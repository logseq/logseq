(* Native app entry — same assembly as js_app/main.ml but rendering
   through the LUI Apple backend. The C bridge calls the registered
   callbacks; every call returns the pending patch JSON which the bridge
   hands to LUIAppleBackend.apply. *)

external wakeup : unit -> unit = "logseq_lui_wakeup"
external platform_request : string -> unit = "logseq_lui_platform_request"

(* Every Lui_app.flush produces one incremental batch; async work (promise
   resolutions, daemon invokes) can flush several times inside a single
   pump, so batches queue here and drain together — dropping intermediate
   batches loses nodes the later diffs reference. *)
let pending_batches : string Queue.t = Queue.create ()

let take_patches () : string =
  if Queue.is_empty pending_batches then ""
  else begin
    let b = Buffer.create 4096 in
    Buffer.add_char b '[';
    let first = ref true in
    Queue.iter
      (fun json ->
         if not !first then Buffer.add_char b ',';
         first := false;
         Buffer.add_string b json)
      pending_batches;
    Buffer.add_char b ']';
    Queue.clear pending_batches;
    Buffer.contents b
  end
let current_app : (Model.t, Action.t) Lui_app.reducer_app option ref = ref None

(* ---------- document queries over the LUI extension tree ----------

   Element snapshots carry the same shape the Swift LogseqDOMSnapshot
   emits so Dom_ext's selector engine treats them identically. "#ref" is
   the DOM id when present, else a node-<id> handle the Swift registry
   resolves for dom-ops. *)
let ext_prop_string props name =
  match Lui_protocol.String_map.find_opt name props with
  | Some (Lui_protocol.StringValue s) -> Some s
  | _ -> None

let ext_shallow_snapshot (rt : Lui_runtime.application) node : Js.Json.t =
  let props =
    match
      Hashtbl.find_opt rt.Lui_runtime.runtime_extension_properties node
    with
    | Some p -> p
    | None -> Lui_protocol.String_map.empty
  in
  let tag =
    match Hashtbl.find_opt rt.Lui_runtime.runtime_extension_nodes node with
    | Some ident ->
        if String.starts_with ~prefix:"logseq-" ident
        then
          String.sub ident 7 (String.length ident - 7)
        else ident
    | None -> "div"
  in
  let attrs =
    match ext_prop_string props "attrs" with
    | Some json -> (try Js.Json.parseExn json with _ -> Js.Json.JObject [])
    | None -> Js.Json.JObject []
  in
  let acc_id =
    Option.value
      (ext_prop_string props "accessibility-identifier")
      ~default:""
  in
  let dom_id =
    match attrs with
    | Js.Json.JObject kvs -> (
        match List.assoc_opt "id" kvs with
        | Some v ->
            Option.value (Js.Json.decodeString v) ~default:acc_id
        | None -> acc_id)
    | _ -> acc_id
  in
  Js.Json.JObject
    [ ("tag", Js.Json.JString tag)
    ; ( "class"
      , Js.Json.JString
          (Option.value (ext_prop_string props "style-class") ~default:"")
      )
    ; ("id", Js.Json.JString dom_id)
    ; ( "#ref"
      , Js.Json.JString
          (if dom_id <> "" then dom_id
           else Printf.sprintf "node-%d" node) )
    ; ("ref-id", Js.Json.JString dom_id)
    ; ("node-id", Js.Json.JNumber (float_of_int node))
    ; ("attrs", attrs)
    ]

let ext_snapshot (rt : Lui_runtime.application) node : Js.Json.t =
  let ancestors =
    let rec walk n acc depth =
      if depth >= 64 then acc
      else
        match Hashtbl.find_opt rt.Lui_runtime.runtime_parents n with
        | Some parent ->
            walk parent (ext_shallow_snapshot rt parent :: acc) (depth + 1)
        | None -> acc
    in
    walk node [] 0
  in
  match ext_shallow_snapshot rt node with
  | Js.Json.JObject kvs ->
      Js.Json.JObject
        (kvs @ [ ("ancestors", Js.Json.JArray (Array.of_list ancestors)) ])
  | el -> el

let collect_subtree (root : int) : Js.Json.t list =
  match !current_app with
  | None -> []
  | Some app ->
      let rt = Lui_app.runtime app in
      let rec dfs node acc =
        let acc = ext_snapshot rt node :: acc in
        match Hashtbl.find_opt rt.Lui_runtime.runtime_children node with
        | Some kids -> List.fold_left (fun a k -> dfs k a) acc kids
        | None -> acc
      in
      List.rev (dfs root [])

let collect_elements () : Js.Json.t list =
  match !current_app with
  | None -> []
  | Some app -> collect_subtree (Lui_app.root_node app)

let decode_extension_values payload =
  let json = try Yojson.Safe.from_string payload with _ -> `Null in
  match json with
  | `Assoc fields ->
      List.fold_left
        (fun map (key, value) ->
          match value with
          | `String s ->
              Lui_protocol.String_map.add key
                (Lui_protocol.StringValue s) map
          | `Bool b ->
              Lui_protocol.String_map.add key (Lui_protocol.BoolValue b)
                map
          | `Int i ->
              Lui_protocol.String_map.add key (Lui_protocol.IntValue i)
                map
          | `Float f ->
              Lui_protocol.String_map.add key
                (Lui_protocol.FloatValue f) map
          | _ -> map)
        Lui_protocol.String_map.empty fields
  | _ -> Lui_protocol.String_map.empty

let flush () =
  match !current_app with
  | Some app -> ignore (Lui_app.flush app)
  | None -> ()

let initialize platform_code host_code (_payload : string) : string =
  Printexc.record_backtrace true;
  Queue.clear pending_batches;
  let os =
    match platform_code with
    | 1 -> Lui_protocol.MacOS
    | 2 -> Lui_protocol.IOS
    | 3 -> Lui_protocol.AndroidOS
    | 4 -> Lui_protocol.LinuxOS
    | 5 -> Lui_protocol.WindowsOS
    | _ -> Lui_protocol.GenericOS
  in
  let host_kind =
    match host_code with
    | 1 -> Lui_protocol.WebHost
    | 2 -> Lui_protocol.SwiftUIHost
    | 3 -> Lui_protocol.FlutterHost
    | _ -> Lui_protocol.GenericHost
  in
  let backend =
    { Lui_protocol.backend_profile = Lui_protocol.profile os host_kind
    ; apply_batch =
        (fun batch ->
          let json = Lui_wire.encode_batch batch in
          Queue.add json pending_batches;
          true)
    }
  in
  let registry = Lui_extension.registry () in
  Logseq_dom.register registry;
  let app =
    Lui_app.create_with_extensions backend registry Model.initial
      Update.update View.view
  in
  current_app := Some app;
  Dom_ext.doc_elements_provider := collect_elements;
  Dom_ext.subtree_elements_provider := collect_subtree;
  Platform.dom_parent_of :=
    (fun id ->
      match !current_app with
      | Some app ->
          Hashtbl.find_opt
            (Lui_app.runtime app).Lui_runtime.runtime_parents id
      | None -> None);
  (match Sys.getenv_opt "LOGSEQ_DUMP" with
   | Some _ ->
       Platform.add_document_listener "click" (fun payload ->
           Host.dom_op "dump-frames" "{}";
           (try
              let oc = open_out "/tmp/click.json" in
              output_string oc (Js.Json.stringify payload);
              close_out oc
            with _ -> ());
           try
             let oc = open_out "/tmp/tree.json" in
             output_string oc
               (Js.Json.stringify
                  (Js.Json.array (Array.of_list (collect_elements ()))));
             close_out oc
           with _ -> ())
   | _ -> ());
  let flush_app () = ignore (Lui_app.flush app) in
  Runtime.app_send :=
    (fun action ->
      let changed = Lui_app.send app action in
      flush_app ();
      changed);
  Runtime.app_flush := flush_app;
  (* OCaml-internal async completions (HTTP, timers, daemon spawn) hop
     through Host onto this thread via the host wakeup *)
  Host.set_wakeup (fun () -> wakeup ());
  Host.set_host_op (fun name payload ->
      platform_request (name ^ "\n" ^ payload));
  (* Platform's request channel ("<op>\n<payload>") shares the same wire
     as Host's — clipboard-write, ui-state, etc. *)
  Platform.host_request := platform_request;
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  Sdk_api.install ();
  Properties_view.install ();
  Editor_commands.install ();
  Views_mount.install ();
  Menu_bar.install ();
  Router.init ();
  Rtc_flows.init ();
  ignore (Boot.run ());
  take_patches ()

let dispatch_lui (event : Lui_protocol.event) : string =
  Queue.clear pending_batches;
  (match !current_app with
   | Some app ->
       ignore (Lui_app.dispatch_event app event);
       ignore (Lui_app.flush app)
   | None -> ());
  take_patches ()

let appear node = dispatch_lui (Lui_protocol.Appear node)
let press node = dispatch_lui (Lui_protocol.Press node)
let long_press node = dispatch_lui (Lui_protocol.LongPress node)

let text_changed node text =
  dispatch_lui (Lui_protocol.TextChanged (node, text))

let submit node = dispatch_lui (Lui_protocol.Submit node)
let dismiss node = dispatch_lui (Lui_protocol.Dismiss node)
let double_press node = dispatch_lui (Lui_protocol.DoublePress node)

let toggle_changed node checked =
  dispatch_lui (Lui_protocol.ToggleChanged (node, checked))

let radio_changed node = dispatch_lui (Lui_protocol.Change node)

let slider_changed node value =
  dispatch_lui (Lui_protocol.ValueChanged (node, value))

let scroll_completed node token outcome =
  let m =
    Lui_protocol.String_map.empty
    |> Lui_protocol.String_map.add "token" (Lui_protocol.IntValue token)
    |> Lui_protocol.String_map.add "outcome"
         (Lui_protocol.StringValue outcome)
  in
  dispatch_lui (Lui_protocol.ExtensionEvent (node, "scroll-completed", "", m))

let visible_range node first last =
  let m =
    Lui_protocol.String_map.empty
    |> Lui_protocol.String_map.add "first" (Lui_protocol.IntValue first)
    |> Lui_protocol.String_map.add "last" (Lui_protocol.IntValue last)
  in
  dispatch_lui (Lui_protocol.ExtensionEvent (node, "visible-range", "", m))

let picked node payload =
  let m =
    Lui_protocol.String_map.empty
    |> Lui_protocol.String_map.add "payload"
         (Lui_protocol.StringValue payload)
  in
  dispatch_lui (Lui_protocol.ExtensionEvent (node, "picked", "", m))

let extension_event node name values : string =
  Queue.clear pending_batches;
  (match !current_app with
   | Some app -> (
       match
         Lui_runtime.extension_identifier (Lui_app.runtime app) node
       with
       | Some identifier ->
           ignore
             (Lui_app.dispatch_event app
                (Lui_protocol.ExtensionEvent
                   (node, identifier, name,
                    decode_extension_values values)));
           ignore (Lui_app.flush app)
       | None -> ())
   | None -> ());
  take_patches ()

(* drain the Host mailbox on the app thread; called via the wakeup the
   OCaml side fired when async work completed *)
let pump () : string =
  Queue.clear pending_batches;
  Host.drain ();
  flush ();
  take_patches ()

let platform_event payload =
  (* Swift -> OCaml event channel (window resize, appearance change,
     dom-op results, menu commands). Payload is "name\njson". *)
  match String.index_opt payload '\n' with
  | Some i ->
      let name = String.sub payload 0 i in
      let body =
        String.sub payload (i + 1) (String.length payload - i - 1)
      in
      let json =
        try Js.Json.parseExn body with _ -> Js.Json.JObject []
      in
      if name = "window-size" then (
        let f k =
          match json with
          | Js.Json.JObject kvs -> (
              match List.assoc_opt k kvs with
              | Some v -> Option.value (Js.Json.decodeNumber v) ~default:0.
              | None -> 0.)
          | _ -> 0.
        in
        Host.set_window_size (f "width") (f "height"))
      else if name = "appearance" then (
        match json with
        | Js.Json.JObject kvs -> (
            match List.assoc_opt "dark" kvs with
            | Some v -> (
                match Js.Json.decodeBoolean v with
                | Some b -> Host.set_dark b
                | None -> ())
            | None -> ())
        | _ -> ())
      else Host.enqueue (fun () -> Platform.emit_event name json)
  | None -> ()

let dispose () : string =
  Daemon_client.kill_all ();
  Queue.clear pending_batches;
  (match !current_app with
   | Some app ->
       ignore (Lui_app.dispose app);
       current_app := None
   | None -> ());
  take_patches ()

let root_node () =
  match !current_app with
  | Some app -> Lui_app.root_node app
  | None -> 0

let () =
  Callback.register "lui_ocaml_init" initialize;
  Callback.register "lui_ocaml_appear" appear;
  Callback.register "lui_ocaml_press" press;
  Callback.register "lui_ocaml_long_press" long_press;
  Callback.register "lui_ocaml_text_changed" text_changed;
  Callback.register "lui_ocaml_submit" submit;
  Callback.register "lui_ocaml_dismiss" dismiss;
  Callback.register "lui_ocaml_double_press" double_press;
  Callback.register "lui_ocaml_toggle_changed" toggle_changed;
  Callback.register "lui_ocaml_radio_changed" radio_changed;
  Callback.register "lui_ocaml_slider_changed" slider_changed;
  Callback.register "lui_ocaml_scroll_completed" scroll_completed;
  Callback.register "lui_ocaml_visible_range" visible_range;
  Callback.register "lui_ocaml_picked" picked;
  Callback.register "lui_ocaml_extension_event" extension_event;
  Callback.register "lui_ocaml_pump" pump;
  Callback.register "lui_ocaml_platform_event" platform_event;
  Callback.register "lui_ocaml_dispose" dispose;
  Callback.register "lui_ocaml_root_node" root_node
