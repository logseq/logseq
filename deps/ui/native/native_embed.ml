(* Native app entry — same assembly as js_app/main.ml but rendering
   through a native LUI backend (GPUI). The C bridge calls the registered
   callbacks; every call returns the pending patch JSON which the bridge
   hands to the host's apply path. *)

external wakeup : unit -> unit = "logseq_lui_wakeup"
external platform_request : string -> unit = "logseq_lui_platform_request"

(* Every Lui_app.flush produces one incremental batch; async work (promise
   resolutions, daemon invokes) can flush several times inside a single
   pump, so batches queue here and drain together — dropping intermediate
   batches loses nodes the later diffs reference. *)
let pending_batches : string Queue.t = Queue.create ()

(* Input-path entries (key/mouse/extension events) now run on the main
   systhread while wakeup-driven [pump] runs on the OCaml worker systhread.
   Systhreads in a domain preempt each other at poll points, so two entries
   can interleave mid-flush — pending_ops / runtime_generation /
   pending_batches are all shared. Serialize every entry that dispatches,
   flushes, or drains; a main-thread event then waits out an in-flight pump
   burst the same way event-queueing used to, instead of corrupting the
   batch stream. *)
let entry_lock = Mutex.create ()
let entry_owner : int option ref = ref None

let assert_entry_owner () =
  if !entry_owner <> Some (Thread.id (Thread.self ())) then
    invalid_arg "UI services require ownership of the application entry"

let with_entry_lock f =
  Mutex.lock entry_lock;
  entry_owner := Some (Thread.id (Thread.self ()));
  match f () with
  | x -> entry_owner := None; Mutex.unlock entry_lock; x
  | exception e -> entry_owner := None; Mutex.unlock entry_lock; raise e

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
   the DOM id when present, else a node-<id> handle the host registry
   resolves for dom-ops. *)
let ext_prop_string props name =
  match Lui_protocol.String_map.find_opt name props with
  | Some (Lui_protocol.StringValue s) -> Some s
  | _ -> None

(* Parsed-attrs cache keyed by the raw JSON string — snapshot rebuilds
   after every mutation used to parseExn each node's attrs JSON, which
   was the single biggest allocation source on the main thread. *)
let attrs_parse_cache : (int, string * Js.Json.t) Hashtbl.t =
  Hashtbl.create 1024

(* Standard props (accessibility identifier, style class, data attrs,
   text) live in runtime_properties — extension nodes mirror them into
   runtime_extension_properties, but plain elements only have the
   standard table. Without this fallback a selector like #cmdk-input can
   never match a standard input node. *)
let std_prop_string (rt : Lui_runtime.application) node prop =
  match Hashtbl.find_opt rt.Lui_runtime.runtime_properties node with
  | Some map -> (
      match Lui_protocol.Property_map.find_opt prop map with
      | Some (Lui_protocol.StringValue s) -> Some s
      | _ -> None)
  | None -> None

let ext_shallow_snapshot (rt : Lui_runtime.application) node : Js.Json.t =
  let props =
    match
      Hashtbl.find_opt rt.Lui_runtime.runtime_extension_properties node
    with
    | Some p -> p
    | None -> Lui_protocol.String_map.empty
  in
  let prop_string name prop =
    match ext_prop_string props name with
    | Some s -> Some s
    | None -> std_prop_string rt node prop
  in
  let kind = Hashtbl.find_opt rt.Lui_runtime.mounted_nodes node in
  let tag =
    match Hashtbl.find_opt rt.Lui_runtime.runtime_extension_nodes node with
    | Some ident ->
        if String.starts_with ~prefix:"logseq-" ident
        then
          String.sub ident 7 (String.length ident - 7)
        else ident
    | None -> (
        (* standard kinds present the HTML tag their DOM twin would carry
           (matching lui-gpui's dom_tag_of_kind) — delegated selectors
           like a[data-ref] / button.x match on it *)
        match kind with
        | Some Lui_protocol.Link -> "a"
        | Some
            ( Lui_protocol.Button | Lui_protocol.ToggleButton
            | Lui_protocol.BottomTab ) ->
            "button"
        | Some
            ( Lui_protocol.Input | Lui_protocol.TextField
            | Lui_protocol.SearchField | Lui_protocol.SecureField
            | Lui_protocol.NumberStepper ) ->
            "input"
        | Some Lui_protocol.Textarea -> "textarea"
        | Some (Lui_protocol.Select | Lui_protocol.Combobox) -> "select"
        | Some Lui_protocol.MenuItem -> "menuitem"
        | Some
            ( Lui_protocol.FileImage | Lui_protocol.Image
            | Lui_protocol.FilePreview ) ->
            "img"
        | Some Lui_protocol.ListItem -> "li"
        | Some k -> Lui_wire_schema.node_kind_name k
        | None -> "div")
  in
  let attrs =
    (* two encodings share this slot: extension "attrs" is a JSON object
       ({name: value}); the standard DataAttrs prop is the \x1e/\x1f
       record list data_attrs_encode produces — decode each by source *)
    match ext_prop_string props "attrs" with
    | Some json -> (
        match Hashtbl.find_opt attrs_parse_cache node with
        | Some (raw, parsed) when raw = json -> parsed
        | _ ->
            let parsed =
              try Js.Json.parseExn json with _ -> Js.Json.JObject []
            in
            Hashtbl.replace attrs_parse_cache node (json, parsed);
            parsed)
    | None -> (
        match std_prop_string rt node Lui_protocol.DataAttrs with
        | Some raw ->
            Js.Json.JObject
              (List.map
                 (fun (k, v) -> (k, Js.Json.JString v))
                 (Lui_protocol.data_attrs_decode raw))
        | None -> Js.Json.JObject [])
  in
  let attrs =
    (* the typed props are the DOM attrs a real element would carry —
       delegated selectors ([aria-label], a[target=_blank]) and readers
       (tooltip label, default-action href) look for them in attrs, not
       in the prop table *)
    match attrs with
    | Js.Json.JObject kvs ->
        let kvs =
          match
            std_prop_string rt node Lui_protocol.AccessibilityLabel
          with
          | Some label -> ("aria-label", Js.Json.JString label) :: kvs
          | None -> kvs
        in
        let kvs =
          match kind with
          | Some Lui_protocol.Link ->
              let push name prop acc =
                match std_prop_string rt node prop with
                | Some v -> (name, Js.Json.JString v) :: acc
                | None -> acc
              in
              kvs
              |> push "target" Lui_protocol.TargetValue
              |> push "href" Lui_protocol.UrlValue
          | _ -> kvs
        in
        Js.Json.JObject kvs
    | other -> other
  in
  let acc_id =
    Option.value
      (prop_string "accessibility-identifier"
         Lui_protocol.AccessibilityIdentifier)
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
          (Option.value
             (prop_string "style-class" Lui_protocol.StyleClass)
             ~default:"")
      )
    ; ("id", Js.Json.JString dom_id)
    ; ( "#ref"
      , Js.Json.JString
          (if dom_id <> "" then dom_id
           else Printf.sprintf "node-%d" node) )
    ; ("ref-id", Js.Json.JString dom_id)
    ; ("node-id", Js.Json.JNumber (float_of_int node))
    ; ("attrs", attrs)
    ; ( "text"
      , Js.Json.JString
          (Option.value
             (prop_string "text" Lui_protocol.TextValue)
             ~default:"") )
    ]

(* Snapshot caches — collecting the doc walks every extension node and
   parses each node's "attrs" JSON, and the query paths (selector lookups,
   event-target resolution, shadow scope checks) each used to rebuild it
   from scratch, which multiplied a full-tree walk per element lifecycle
   event into a GC storm. The epoch key covers every mutation channel:
   apply_batch bumps the generation, creates/removes change the extension
   node count, and prop writes enqueue pending ops. *)
let snapshot_epoch (rt : Lui_runtime.application) =
  ( Lui_runtime.generation rt
  , Hashtbl.length rt.Lui_runtime.runtime_extension_nodes
  , List.length !(rt.Lui_runtime.pending_ops) )

let snapshot_epoch_ref = ref (-1, -1, -1)
let shallow_cache : (int, Js.Json.t) Hashtbl.t = Hashtbl.create 1024
let subtree_cache : (int, Js.Json.t list) Hashtbl.t = Hashtbl.create 8

let invalidate_stale_snapshots (rt : Lui_runtime.application) =
  let epoch = snapshot_epoch rt in
  if epoch <> !snapshot_epoch_ref then begin
    snapshot_epoch_ref := epoch;
    Hashtbl.reset shallow_cache;
    Hashtbl.reset subtree_cache
  end

let shallow_of (rt : Lui_runtime.application) node : Js.Json.t =
  match Hashtbl.find_opt shallow_cache node with
  | Some s -> s
  | None ->
      let s = ext_shallow_snapshot rt node in
      Hashtbl.replace shallow_cache node s;
      s

let ext_snapshot (rt : Lui_runtime.application) node : Js.Json.t =
  invalidate_stale_snapshots rt;
  let ancestors =
    let rec walk n acc depth =
      if depth >= 64 then acc
      else
        match Hashtbl.find_opt rt.Lui_runtime.runtime_parents n with
        | Some parent ->
            walk parent (shallow_of rt parent :: acc) (depth + 1)
        | None -> acc
    in
    walk node [] 0
  in
  match shallow_of rt node with
  | Js.Json.JObject kvs ->
      Js.Json.JObject
        (kvs @ [ ("ancestors", Js.Json.JArray (Array.of_list ancestors)) ])
  | el -> el

let collect_subtree (root : int) : Js.Json.t list =
  match !current_app with
  | None -> []
  | Some app ->
      let rt = Lui_app.runtime app in
      invalidate_stale_snapshots rt;
      (match Hashtbl.find_opt subtree_cache root with
       | Some els -> els
       | None ->
           let rec dfs node acc =
             let acc = ext_snapshot rt node :: acc in
             match Hashtbl.find_opt rt.Lui_runtime.runtime_children node
             with
             | Some kids -> Lui_sequence.fold_left (fun a k -> dfs k a) acc kids
             | None -> acc
           in
           let els = List.rev (dfs root []) in
           Hashtbl.replace subtree_cache root els;
           els)

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

let take_patches_dbg where =
  let out = take_patches () in
  (match Sys.getenv_opt "LOGSEQ_PERF" with
   | Some _ ->
       Printf.eprintf "[perf] patches %s bytes=%d t=%.3f\n%!" where
         (String.length out) (Unix.gettimeofday ())
   | None -> ());
  out

let app_flush_checked app =
  try ignore (Lui_app.flush app)
  with e ->
    Printf.eprintf "[flush] FAILED: %s\n%s\n%!" (Printexc.to_string e)
      (Printexc.get_backtrace ())

let flush () =
  match !current_app with
  | Some app -> app_flush_checked app
  | None -> ()

let perf_log =
  lazy (match Sys.getenv_opt "LOGSEQ_PERF" with Some _ -> true | None -> false)

let perf_ms () = Unix.gettimeofday () *. 1000.

let perf_mark name t0 =
  if Lazy.force perf_log
  then Printf.eprintf "[perf] %s %.1fms\n%!" name (perf_ms () -. t0)

let initialize_unlocked platform_code host_code (_payload : string) : string =
  Printexc.record_backtrace true;
  Platform.install_ui_services ~assert_owner:assert_entry_owner ~request_flush:Runtime.flush ~dom:Ui_dom_native.ops ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
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
    | 6 -> Lui_protocol.GPUIHost
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
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  Logseq_editor.register registry;
  let app =
    Lui_app.create_with_extensions backend registry Model.initial
      Update.apply View.view
  in
  current_app := Some app;
  Imperative_dom.install app;
  Dom_ext.doc_elements_provider := collect_elements;
  Dom_ext.subtree_elements_provider := collect_subtree;
  Vdom.init app;
  Vdom.snapshot_of_node :=
    (fun node -> ext_snapshot (Lui_app.runtime app) node);
  Platform.dom_parent_of :=
    (fun id ->
      match !current_app with
      | Some app ->
          Hashtbl.find_opt
            (Lui_app.runtime app).Lui_runtime.runtime_parents id
      | None -> None);
  (* host dom-events carry only nodeId; inject "target" like the Swift
     host's snapshot attachment so document listeners (ev_target/
     el_closest) work. Imperative nodes keep their registry snapshot *)
  Platform.event_target_of :=
    (fun id ->
      match !current_app with
      | Some app -> (
          match Hashtbl.find_opt Imperative_dom.lui_index id with
          | Some sid -> Imperative_dom.snapshot_of_id sid
          | None -> Some (ext_snapshot (Lui_app.runtime app) id))
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
  let flush_app () = app_flush_checked app in
  Runtime.app_send :=
    (fun action ->
      let changed = Lui_app.send app action in
      flush_app ();
      changed);
  Runtime.read_model := (fun () -> Lui_app.model app);
  Runtime.app_flush := flush_app;
  Runtime.schedule_flush := (fun cb -> ignore (Host.set_timeout cb 0));
  (* OCaml-internal async completions (HTTP, timers, daemon spawn) hop
     through Host onto this thread via the host wakeup *)
  Host.set_wakeup (fun () -> wakeup ());
  Host.set_host_op (fun name payload ->
      platform_request (name ^ "\n" ^ payload));
  (* Platform's request channel ("<op>\n<payload>") shares the same wire
     as Host's — clipboard-write, ui-state, etc. *)
  Platform.host_request := platform_request;
  let t0 = perf_ms () in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  perf_mark "init.app" t0;
  let t1 = perf_ms () in
  Sdk_api.install ();
  Properties_view.install ();
  Editor_commands.install ();
  Editor_keys.install_once ();
  Menu_bar.install ();
  Asset_dom.install ();
  Router.init ();
  Rtc_flows.init ();
  perf_mark "init.installs" t1;
  let t2 = perf_ms () in
  ignore (Boot.run ());
  perf_mark "init.boot" t2;
  take_patches ()

let initialize platform_code host_code payload =
  with_entry_lock (fun () -> initialize_unlocked platform_code host_code payload)

(* NOTE: never Queue.clear pending_batches at entry — a systhread yield
   inside drain/dispatch (blocking daemon IO) can let another entry emit
   into the shared queue first; clearing here would drop those batches and
   skip a wire generation, which the host rejects as invalidBatch. *)
let dispatch_lui (event : Lui_protocol.event) : string =
  with_entry_lock (fun () ->
      let t0 = perf_ms () in
      (match !current_app with
       | Some app ->
           ignore (Lui_app.dispatch_event app event);
           perf_mark "dispatch_event" t0;
           let t1 = perf_ms () in
           ignore (Lui_app.flush app);
           perf_mark "flush" t1;
       | None -> ());
      let t3 = perf_ms () in
      let out = take_patches_dbg "lui" in
      perf_mark "take_patches" t3;
      perf_mark "total" t0;
      out)

let appear node = dispatch_lui (Lui_protocol.Appear node)

let press node = dispatch_lui (Lui_protocol.Press node)
let press_ex node modifiers =
  dispatch_lui (Lui_protocol.PressModifiers (node, modifiers))
let long_press node = dispatch_lui (Lui_protocol.LongPress node)

let text_changed node text =
  dispatch_lui (Lui_protocol.TextChanged (node, text))

let submit node = dispatch_lui (Lui_protocol.Submit node)
let dismiss node = dispatch_lui (Lui_protocol.Dismiss node)
let double_press node = dispatch_lui (Lui_protocol.DoublePress node)

let pointer_detail x y modifiers button target_class :
    Lui_protocol.pointer_detail =
  { x; y; modifiers; button; target_class }

let press_detail node x y modifiers button target_class =
  dispatch_lui
    (Lui_protocol.PressDetail
       (node, pointer_detail x y modifiers button target_class))

let pointer_down node x y modifiers button target_class =
  dispatch_lui
    (Lui_protocol.PointerDown
       (node, pointer_detail x y modifiers button target_class))

let pointer_up node x y modifiers button target_class =
  dispatch_lui
    (Lui_protocol.PointerUp
       (node, pointer_detail x y modifiers button target_class))

let pointer_enter node = dispatch_lui (Lui_protocol.PointerEnter node)

let pointer_leave node = dispatch_lui (Lui_protocol.PointerLeave node)

let context_menu_press node x y modifiers button target_class =
  dispatch_lui
    (Lui_protocol.ContextMenuPress
       (node, pointer_detail x y modifiers button target_class))

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

let extension_event node identifier name values : string =
  with_entry_lock (fun () ->
      let t0 = perf_ms () in
      (match !current_app with
       | Some app -> (
           match
             Lui_runtime.extension_identifier (Lui_app.runtime app) node
           with
           | Some expected_identifier when identifier = expected_identifier ->
               ignore
                 (Lui_app.dispatch_event app
                    (Lui_protocol.ExtensionEvent
                       (node, identifier, name,
                        decode_extension_values values)));
               perf_mark "ext.dispatch" t0;
               let t1 = perf_ms () in
               ignore (Lui_app.flush app);
               perf_mark "ext.flush" t1
           | Some _ -> invalid_arg "Extension identifier does not match the mounted node"
           | None -> ())
       | None -> ());
      let t3 = perf_ms () in
      let out = take_patches_dbg "ext" in
      perf_mark "ext.take" t3;
      perf_mark "ext.total" t0;
      out)

(* drain the Host mailbox on the app thread; called via the wakeup the
   OCaml side fired when async work completed *)
let pump () : string =
  with_entry_lock (fun () ->
      let t0 = perf_ms () in
      Host.drain ();
      perf_mark "pump.drain" t0;
      let t1 = perf_ms () in
      (match !current_app with
       | Some app -> ignore (Lui_app.flush app)
       | None -> ());
      perf_mark "pump.flush" t1;
      let t3 = perf_ms () in
      let out = take_patches_dbg "pump" in
      perf_mark "pump.take" t3;
      perf_mark "pump.total" t0;
      out)

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
      else if name = "node-rect" then Dom_ext.note_node_rect json
      else if name = "node-natural-size" then
        Dom_ext.note_node_natural_size json
      else if
        name = "caret-rect" || name = "offset-at"
        || name = "line-ranges" || name = "scroll-height"
      then Logseq_editor.note_measurement name json
      else if name = "clipboard-read" then (
        match json with
        | Js.Json.JObject kvs ->
            Platform.note_clipboard_text
              (Option.bind (List.assoc_opt "text" kvs)
                 Js.Json.decodeString
              |> Option.value ~default:"")
        | _ -> Platform.note_clipboard_text "")
      else Host.enqueue (fun () -> Platform.emit_event name json)
  | None -> ()

let dispose () : string =
  (* daemons deliberately outlive the app — they keep the repo admitted
     and the graph open so the next launch attaches instantly *)
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

let resync _ =
  with_entry_lock (fun () ->
      let app = Option.get !current_app in
      ignore (Lui_app.flush app);
      Queue.clear pending_batches;
      Queue.add
        (Lui_wire.encode_batch (Lui_runtime.resync_batch (Lui_app.runtime app)))
        pending_batches;
      take_patches ())

let () =
  Callback.register "lui_ocaml_init" initialize;
  Callback.register "lui_ocaml_appear" appear;
  Callback.register "lui_ocaml_press" press;
  Callback.register "lui_ocaml_press_ex" press_ex;
  Callback.register "lui_ocaml_long_press" long_press;
  Callback.register "lui_ocaml_text_changed" text_changed;
  Callback.register "lui_ocaml_submit" submit;
  Callback.register "lui_ocaml_dismiss" dismiss;
  Callback.register "lui_ocaml_double_press" double_press;
  Callback.register "lui_ocaml_press_detail" press_detail;
  Callback.register "lui_ocaml_pointer_down" pointer_down;
  Callback.register "lui_ocaml_pointer_up" pointer_up;
  Callback.register "lui_ocaml_pointer_enter" pointer_enter;
  Callback.register "lui_ocaml_pointer_leave" pointer_leave;
  Callback.register "lui_ocaml_context_menu_press" context_menu_press;
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
  Callback.register "lui_ocaml_root_node" root_node;
  Callback.register "lui_ocaml_resync" resync
