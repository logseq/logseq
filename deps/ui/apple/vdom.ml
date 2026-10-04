(* Virtual-DOM bridge for the imperative UI layer.

   The ported imperative modules (properties, menus, dialogs) build
   elements as Json shells — {"#new": n, "tag": t} — and mutate them
   through the properties_dom/editor_dom shims before attaching under a
   mounted node. On the web those shells are real DOM nodes; here they are
   registry entries that materialize into logseq-<tag> extension nodes via
   Lui_runtime when (and only when) the shell is attached under a node the
   runtime already owns. Everything the shell then does — attr/class/text
   writes, listener registration, queries — forwards to the live node. *)

open Lui_protocol

type el = Js.Json.t

(* one record per {"#new": n} shell *)
type vrec =
  { v_vid : int
  ; v_tag : string
  ; mutable v_class : string
  ; mutable v_attrs : (string * string) list
  ; mutable v_text : string
  ; mutable v_children : el list
  ; mutable v_parent : el option (* the Json handle the caller appended under *)
  ; mutable v_listeners : (string * (Js.Json.t -> unit)) list
  ; mutable v_node : int option
  ; mutable v_scope : Signal.scope option
  }

let app : (Model.t, Action.t) Lui_app.reducer_app option ref = ref None

let init (a : (Model.t, Action.t) Lui_app.reducer_app) = app := Some a

let rt () = Option.map Lui_app.runtime !app

let root_node () =
  match !app with Some app -> Some (Lui_app.root_node app) | None -> None

(* full snapshot (incl. ancestors) for a live node — installed by
   native_embed to ext_snapshot; kept as a hook to avoid a module cycle *)
let snapshot_of_node : (int -> Js.Json.t) ref =
  ref (fun _ -> Js.Json.JObject [])

let vregs : (int, vrec) Hashtbl.t = Hashtbl.create 256
let vid_counter = ref 0

let vrec_of_el (el : el) : vrec option =
  match el with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt "#new" kvs with
      | Some v -> (
          match Js.Json.decodeNumber v with
          | Some n -> Hashtbl.find_opt vregs (int_of_float n)
          | None -> None)
      | None -> None)
  | _ -> None

let new_el (tag : string) : el =
  incr vid_counter;
  let vid = !vid_counter in
  Hashtbl.replace vregs vid
    { v_vid = vid
    ; v_tag = String.lowercase_ascii tag
    ; v_class = ""
    ; v_attrs = []
    ; v_text = ""
    ; v_children = []
    ; v_parent = None
    ; v_listeners = []
    ; v_node = None
    ; v_scope = None
    };
  Js.Json.JObject
    [ ("#new", Js.Json.JNumber (float_of_int vid))
    ; ("tag", Js.Json.JString (String.lowercase_ascii tag)) ]

(* ---------- node resolution ---------- *)

(* the dom-op "ref" the Swift registry resolves: a DOM id when present,
   else the node-<id> handle every element registers under *)
let ref_json el =
  match vrec_of_el el with
  | Some v -> (
      match v.v_node with
      | Some node -> (
          match List.assoc_opt "id" v.v_attrs with
          | Some id when id <> "" ->
              Js.Json.JObject [ ("#ref", Js.Json.JString id) ]
          | _ ->
              Js.Json.JObject
                [ ( "#ref"
                  , Js.Json.JString (Printf.sprintf "node-%d" node) ) ])
      | None -> Js.Json.JObject [])
  | None -> el

(* walk the element snapshots once to map a DOM id (accessibility
   identifier / attrs.id — what "#ref" carries) back to its node *)
let node_of_dom_id (id : string) : int option =
  if id = "" then None
  else
    List.fold_left
      (fun acc el ->
        match acc with
        | Some _ -> acc
        | None -> (
            match
              ( Dom_ext.str_prop "#ref" el
              , Dom_ext.str_prop "ref-id" el
              , Dom_ext.num_prop "node-id" el )
            with
            | Some r, _, Some n when r = id -> Some (int_of_float n)
            | _, Some r, Some n when r = id -> Some (int_of_float n)
            | _ -> None))
      None
      (!Dom_ext.doc_elements_provider ())

let node_of_el (el : el) : int option =
  match vrec_of_el el with
  | Some v -> v.v_node
  | None -> (
      match Dom_ext.num_prop "node-id" el with
      | Some n -> Some (int_of_float n)
      | None -> (
          match el with
          | Js.Json.JObject kvs -> (
              match List.assoc_opt "#ref" kvs with
              | Some (Js.Json.JNumber 0.) -> root_node ()
              | Some (Js.Json.JString id) -> node_of_dom_id id
              | _ -> (
                  match List.assoc_opt "ref-id" kvs with
                  | Some (Js.Json.JString id) -> node_of_dom_id id
                  | _ -> None))
          | _ -> None))

let node_live node =
  match !app with
  | None -> false
  | Some app ->
      let rt = Lui_app.runtime app in
      node = Lui_app.root_node app
      || Hashtbl.mem rt.Lui_runtime.runtime_parents node
      || Hashtbl.mem rt.Lui_runtime.runtime_extension_nodes node

let el_is_connected el =
  match node_of_el el with Some n -> node_live n | None -> false

(* ---------- listeners ---------- *)

(* materialized node id -> imperative listeners; dispatch goes through one
   Platform dom_handler per node that demuxes by event name *)
let node_listeners : (int, (string * (Js.Json.t -> unit)) list) Hashtbl.t =
  Hashtbl.create 64

let events_of node =
  Hashtbl.find_opt node_listeners node
  |> Option.value ~default:[]
  |> List.map fst
  |> List.sort_uniq String.compare
  |> String.concat " "

(* re-register the per-node demuxer so Platform sees the updated union of
   event names, and push the union to the host's "events" prop *)
let refresh_handler rt node =
  Platform.unregister_dom_handlers node;
  let evs = events_of node in
  if evs <> "" then begin
    Platform.register_dom_handler node ~events:evs (fun name payload ->
        match Hashtbl.find_opt node_listeners node with
        | Some ls ->
            let ev =
              match payload with
              | Some p -> (
                  match
                    (try Js.Json.parseExn p with _ -> Js.Json.JNull)
                  with
                  | Js.Json.JObject kvs as j ->
                      (* DOM listeners read e.type — the wire carries the
                         name separately; inject it *)
                      if List.mem_assoc "type" kvs then j
                      else
                        Js.Json.JObject
                          (("type", Js.Json.JString name) :: kvs)
                  | j -> j)
              | None -> Js.Json.JNull
            in
            List.iter
              (fun (n, f) ->
                if n = name && not !Platform.propagation_stopped then f ev)
              ls
        | None -> ());
    if node_live node then
      Lui_runtime.set_extension_prop rt node "events" (StringValue evs)
  end

let listen el name f =
  match vrec_of_el el with
  | Some v ->
      v.v_listeners <- v.v_listeners @ [ (name, f) ];
      (match v.v_node, rt () with
       | Some node, Some rt ->
           Hashtbl.replace node_listeners node
             (Option.value (Hashtbl.find_opt node_listeners node)
                ~default:[]
             @ [ (name, f) ]);
           refresh_handler rt node
       | _ -> ())
  | None -> (
      (* real node snapshot — register directly *)
      match node_of_el el, rt () with
      | Some node, Some rt ->
          Hashtbl.replace node_listeners node
            (Option.value (Hashtbl.find_opt node_listeners node)
               ~default:[]
            @ [ (name, f) ]);
          refresh_handler rt node
      | _ -> ())

(* every materialized element gets one LUI on_event hook mirroring
   logseq_dom.ml's: dom-event -> Platform.emit_event (which bubbles
   through dom_handlers and fires window_listeners) *)
let wire_dom_event rt node v =
  let scope = Signal.scope "vel" in
  v.v_scope <- Some scope;
  Lui_runtime.on_event scope rt node (fun raw ->
      match raw with
      | ExtensionEvent (_, ident, "dom-event", values)
        when String.length ident > 7 && String.sub ident 0 7 = "logseq-" ->
          let field name =
            Option.map
              (function StringValue s -> s | _ -> "")
              (String_map.find_opt name values)
          in
          let name = Option.value (field "name") ~default:"" in
          let payload = field "payload" in
          (match payload with
           | Some p -> (
               try
                 Platform.emit_event name (Js.Json.parseExn p)
               with _ -> Platform.emit_event name Js.Json.null)
           | None -> Platform.emit_event name Js.Json.null)
      | _ -> ())

(* ---------- materialization ---------- *)

let attrs_json_of attrs =
  Js.Json.JObject
    (List.map (fun (k, v) -> (k, Js.Json.JString v)) attrs)

let snapshot_of_vrec (v : vrec) : Js.Json.t =
  let dom_id = Option.value (List.assoc_opt "id" v.v_attrs) ~default:"" in
  Js.Json.JObject
    [ ("tag", Js.Json.JString v.v_tag)
    ; ("class", Js.Json.JString v.v_class)
    ; ("id", Js.Json.JString dom_id)
    ; ( "#ref"
      , Js.Json.JString
          (if dom_id <> "" then dom_id
           else
             match v.v_node with
             | Some n -> Printf.sprintf "node-%d" n
             | None -> Printf.sprintf "vd-%d" v.v_vid))
    ; ("ref-id", Js.Json.JString dom_id)
    ; ( "node-id"
      , match v.v_node with
        | Some n -> Js.Json.JNumber (float_of_int n)
        | None -> Js.Json.JNull )
    ; ("attrs", attrs_json_of v.v_attrs)
    ; ("text", Js.Json.JString v.v_text) ]

let rec materialize_into rt parent_node (v : vrec) (index : int) =
  match v.v_node with
  | Some _ -> ()
  | None ->
      let node =
        Lui_runtime.create_extension_node rt ("logseq-" ^ v.v_tag)
      in
      v.v_node <- Some node;
      if v.v_class <> "" then
        Lui_runtime.set_extension_prop rt node "style-class"
          (StringValue v.v_class);
      if v.v_attrs <> [] then
        Lui_runtime.set_extension_prop rt node "attrs"
          (StringValue (Js.Json.stringify (attrs_json_of v.v_attrs)));
      if v.v_text <> "" then
        Lui_runtime.set_extension_prop rt node "text"
          (StringValue v.v_text);
      (match List.assoc_opt "id" v.v_attrs with
       | Some id when id <> "" ->
           Lui_runtime.set_extension_prop rt node
             "accessibility-identifier" (StringValue id)
       | _ -> ());
      wire_dom_event rt node v;
      if v.v_listeners <> [] then begin
        Hashtbl.replace node_listeners node
          (List.map (fun l -> l) v.v_listeners);
        (* text inputs always wire the editor surface events *)
        if v.v_tag = "textarea" || v.v_tag = "input" then
          List.iter
            (fun n ->
              let cur =
                Hashtbl.find_opt node_listeners node
                |> Option.value ~default:[]
              in
              if not (List.mem_assoc n cur) then
                Hashtbl.replace node_listeners node
                  (cur @ [ (n, fun _ -> ()) ]))
            [ "input"; "keydown"; "focus"; "blur" ];
        refresh_handler rt node
      end;
      let clamped =
        min index (List.length (Lui_runtime.children rt parent_node))
      in
      Lui_runtime.insert_child rt parent_node node clamped;
      List.iteri
        (fun i child ->
          match vrec_of_el child with
          | Some cv -> materialize_into rt node cv i
          | None -> ())
        v.v_children

(* ---------- element ops ---------- *)

let attr_get el name =
  match vrec_of_el el with
  | Some v -> List.assoc_opt name v.v_attrs
  | None -> Dom_ext.get_attribute el name

let set_attr el name v =
  match vrec_of_el el with
  | Some r -> (
      r.v_attrs <- List.remove_assoc name r.v_attrs @ [ (name, v) ];
      match r.v_node, rt () with
      | Some node, Some rt when node_live node ->
          Lui_runtime.set_extension_prop rt node "attrs"
            (StringValue (Js.Json.stringify (attrs_json_of r.v_attrs)));
          if name = "id" && v <> "" then
            Lui_runtime.set_extension_prop rt node
              "accessibility-identifier" (StringValue v)
      | _ -> ())
  | None -> (
      match node_of_el el with
      | Some node ->
          (* real node: mirror the write into the query overlay (runtime
             props are unaffected by view-side dom-ops) and push the
             dom-op so the host updates the rendered view in place *)
          Dom_ext.overlay_set_attr node name v;
          Host.dom_op "set-attr"
            (Js.Json.stringify
               (Js.Json.JObject
                  [ ("ref", ref_json el); ("name", Js.Json.JString name)
                  ; ("value", Js.Json.JString v) ]))
      | None -> ())

let remove_attr el name =
  match vrec_of_el el with
  | Some r -> (
      r.v_attrs <- List.remove_assoc name r.v_attrs;
      match r.v_node, rt () with
      | Some node, Some rt when node_live node ->
          Lui_runtime.set_extension_prop rt node "attrs"
            (StringValue (Js.Json.stringify (attrs_json_of r.v_attrs)))
      | _ -> ())
  | None -> (
      match node_of_el el with
      | Some node ->
          Dom_ext.overlay_remove_attr node name;
          Host.dom_op "remove-attr"
            (Js.Json.stringify
               (Js.Json.JObject
                  [ ("ref", ref_json el); ("name", Js.Json.JString name) ]))
      | None -> ())

let set_class el c =
  (* Same value → skip the emit: every op costs a patch + a native layout
     pass; focus retries re-sent the same class ~110x per click. *)
  let cur =
    match vrec_of_el el with
    | Some r -> r.v_class
    | None -> String.concat " " (Dom_ext.class_list el)
  in
  if cur <> c then
    match vrec_of_el el with
    | Some r -> (
        r.v_class <- c;
        match r.v_node, rt () with
        | Some node, Some rt when node_live node ->
            Lui_runtime.set_extension_prop rt node "style-class"
              (StringValue c)
        | _ -> ())
    | None -> (
        match node_of_el el with
        | Some node ->
            Dom_ext.overlay_set_class node c;
            Host.dom_op "set-class"
              (Js.Json.stringify
                 (Js.Json.JObject
                    [ ("ref", ref_json el); ("class", Js.Json.JString c) ]))
        | None -> ())

let class_add el c =
  let cur =
    match vrec_of_el el with
    | Some r -> r.v_class
    | None -> String.concat " " (Dom_ext.class_list el)
  in
  let classes = String.split_on_char ' ' cur in
  if not (List.mem c classes) then
    set_class el (String.trim (cur ^ " " ^ c))

let class_remove el c =
  let cur =
    match vrec_of_el el with
    | Some r -> r.v_class
    | None -> String.concat " " (Dom_ext.class_list el)
  in
  set_class el
    (String.concat " "
       (List.filter
          (fun x -> x <> "" && x <> c)
          (String.split_on_char ' ' cur)))

let set_text el text =
  match vrec_of_el el with
  | Some r -> (
      r.v_text <- text;
      match r.v_node, rt () with
      | Some node, Some rt when node_live node ->
          Lui_runtime.set_extension_prop rt node "text" (StringValue text)
      | _ -> ())
  | None -> (
      match node_of_el el with
      | Some node ->
          Dom_ext.overlay_set_text node text;
          Host.dom_op "set-text-content"
            (Js.Json.stringify
               (Js.Json.JObject
                  [ ("ref", ref_json el); ("text", Js.Json.JString text) ]))
      | None -> ())

let set_value el v =
  match vrec_of_el el with
  | Some r -> (
      if r.v_node = None then
        (* pre-mount: the text prop carries the initial value *)
        r.v_text <- v;
      match r.v_node with
      | Some _ ->
          Host.dom_op "set-value"
            (Js.Json.stringify
               (Js.Json.JObject
                  [ ("ref", ref_json el); ("value", Js.Json.JString v) ]))
      | None -> ())
  | None ->
      Host.dom_op "set-value"
        (Js.Json.stringify
           (Js.Json.JObject
              [ ("ref", ref_json el); ("value", Js.Json.JString v) ]))

let get_text el =
  match vrec_of_el el with
  | Some v -> v.v_text
  | None -> (
      match Dom_ext.overlay_text_of el with
      | Some t -> t
      | None -> Option.value (Dom_ext.str_prop "text" el) ~default:"")

let get_value el =
  match vrec_of_el el with
  | Some v -> v.v_text
  | None -> Option.value (Dom_ext.str_prop "value" el) ~default:""

(* ---------- structure ---------- *)

let rec drop_el el =
  match vrec_of_el el with
  | Some v -> (
      (match v.v_node, rt () with
       | Some node, Some rt when node_live node ->
           (try Lui_runtime.drop_subtree rt node with _ -> ())
       | _ -> ());
      (match v.v_node with
       | Some node ->
           Platform.unregister_dom_handlers node;
           Hashtbl.remove node_listeners node
       | None -> ());
      Option.iter Signal.dispose_scope v.v_scope;
      v.v_scope <- None;
      v.v_node <- None;
      v.v_parent <- None;
      List.iter drop_el v.v_children)
  | None -> (
      match node_of_el el with
      | Some node -> (
          match rt () with
          | Some rt ->
              let ours =
                Hashtbl.fold
                  (fun _ v acc -> acc || v.v_node = Some node)
                  vregs false
              in
              Dom_ext.overlay_drop node;
              if ours then (
                try Lui_runtime.drop_subtree rt node
                with _ -> ())
              else
                Host.dom_op "remove"
                  (Js.Json.stringify
                     (Js.Json.JObject [ ("ref", ref_json el) ]))
          | None -> ())
      | None -> ())

let clear_children el =
  match vrec_of_el el with
  | Some v ->
      List.iter drop_el v.v_children;
      v.v_children <- []
  | None -> (
      (* real parent: only our own materialized children can go *)
      match rt () with
      | Some rt -> (
          match node_of_el el with
          | Some node ->
              let kids =
                match
                  Hashtbl.find_opt rt.Lui_runtime.runtime_children node
                with
                | Some ks -> ks
                | None -> []
              in
              List.iter
                (fun k ->
                  let ours =
                    Hashtbl.fold
                      (fun _ v acc -> acc || v.v_node = Some k)
                      vregs false
                  in
                  if ours then
                    try Lui_runtime.drop_subtree rt k with _ -> ())
                kids
          | None -> ())
      | None -> ())

let insert_at_index parent_el child index =
  (match vrec_of_el child with
   | Some cv -> cv.v_parent <- Some parent_el
   | None -> ());
  match vrec_of_el parent_el with
  | Some pv -> (
      pv.v_children <-
        (let rec ins i acc = function
           | [] -> List.rev (child :: acc)
           | c :: rest when i = index ->
               List.rev_append acc (child :: c :: rest)
           | c :: rest -> ins (i + 1) (c :: acc) rest
         in
         ins 0 [] pv.v_children);
      match pv.v_node, rt () with
      | Some pnode, Some rt -> (
          match vrec_of_el child with
          | Some cv ->
              materialize_into rt pnode cv
                (min index
                   (List.length (Lui_runtime.children rt pnode)))
          | None -> ())
      | _ -> ())
  | None -> (
      match node_of_el parent_el, rt () with
      | Some pnode, Some rt -> (
          match vrec_of_el child with
          | Some cv ->
              materialize_into rt pnode cv
                (min index
                   (List.length (Lui_runtime.children rt pnode)))
          | None -> ())
      | _ -> ())

let append_child parent_el child =
  match vrec_of_el child with
  | Some cv -> (
      cv.v_parent <- Some parent_el;
      match vrec_of_el parent_el with
      | Some pv -> (
          pv.v_children <- pv.v_children @ [ child ];
          match pv.v_node, rt () with
          | Some pnode, Some rt ->
              materialize_into rt pnode cv
                (List.length (Lui_runtime.children rt pnode))
          | _ -> ())
      | None -> (
          match node_of_el parent_el, rt () with
          | Some pnode, Some rt ->
              materialize_into rt pnode cv
                (List.length (Lui_runtime.children rt pnode))
          | _ -> ()))
  | None -> ()

let insert_before parent_el child before_el =
  let idx =
    match vrec_of_el parent_el with
    | Some pv ->
        let rec go i = function
          | [] -> List.length pv.v_children
          | c :: rest -> if c == before_el then i else go (i + 1) rest
        in
        go 0 pv.v_children
    | None -> (
        match node_of_el parent_el, rt () with
        | Some pnode, Some rt -> (
            match node_of_el before_el with
            | Some bnode ->
                let kids =
                  match
                    Hashtbl.find_opt rt.Lui_runtime.runtime_children pnode
                  with
                  | Some ks -> ks
                  | None -> []
                in
                let rec go i = function
                  | [] -> List.length kids
                  | k :: rest -> if k = bnode then i else go (i + 1) rest
                in
                go 0 kids
            | None -> List.length (Lui_runtime.children rt pnode))
        | _ -> 0)
  in
  insert_at_index parent_el child idx

(* (parent el handle, index of el within the parent) for position math *)
let parent_and_index el : (el * int) option =
  match vrec_of_el el with
  | Some v -> (
      match v.v_parent with
      | None -> None
      | Some p -> (
          match vrec_of_el p with
          | Some pv ->
              let rec go i = function
                | [] -> Some (p, List.length pv.v_children)
                | c :: rest ->
                    if c == el then Some (p, i) else go (i + 1) rest
              in
              go 0 pv.v_children
          | None -> (
              (* real parent: index via runtime children *)
              match node_of_el p, v.v_node, rt () with
              | Some pnode, Some node, Some rt ->
                  let kids =
                    match
                      Hashtbl.find_opt rt.Lui_runtime.runtime_children
                        pnode
                    with
                    | Some ks -> ks
                    | None -> []
                  in
                  let rec go i = function
                    | [] -> Some (p, List.length kids)
                    | k :: rest ->
                        if k = node then Some (p, i)
                        else go (i + 1) rest
                  in
                  go 0 kids
              | _ -> Some (p, 0))))
  | None -> (
      match node_of_el el, rt () with
      | Some node, Some rt -> (
          match Hashtbl.find_opt rt.Lui_runtime.runtime_parents node with
          | Some p ->
              let parent_el =
                Js.Json.JObject
                  [ ("node-id", Js.Json.JNumber (float_of_int p)) ]
              in
              let kids =
                match
                  Hashtbl.find_opt rt.Lui_runtime.runtime_children p
                with
                | Some ks -> ks
                | None -> []
              in
              let rec go i = function
                | [] -> Some (parent_el, List.length kids)
                | k :: rest ->
                    if k = node then Some (parent_el, i)
                    else go (i + 1) rest
              in
              go 0 kids
          | None -> None)
      | _ -> None)

let insert_adjacent el pos child =
  match pos with
  | "afterbegin" -> insert_at_index el child 0
  | "beforeend" -> append_child el child
  | "beforebegin" | "afterend" -> (
      match parent_and_index el with
      | Some (parent_el, idx) ->
          insert_at_index parent_el child
            (if pos = "beforebegin" then idx else idx + 1)
      | None -> ())
  | _ -> ()

(* ---------- queries over materialized/virtual trees ---------- *)

let query el sel =
  match vrec_of_el el with
  | Some v -> (
      match v.v_node with
      | Some node -> Dom_ext.query_selector (!snapshot_of_node node) sel
      | None -> (
          (* virtual children: only ":scope > <compound>" is meaningful
             pre-materialization *)
          match String.split_on_char '>' sel with
          | [ scope_part; child_sel ]
            when String.trim scope_part = ":scope" -> (
              match Dom_ext.parse_steps (String.trim child_sel) with
              | [ { Dom_ext.s_comp = Some comp; _ } ] ->
                  List.find_opt
                    (fun c ->
                      match vrec_of_el c with
                      | Some cv ->
                          Dom_ext.match_compound
                            (snapshot_of_vrec cv) comp
                      | None -> false)
                    v.v_children
              | _ -> None)
          | _ -> None))
  | None -> Dom_ext.query_selector el sel

let query_all el sel : el list =
  match vrec_of_el el with
  | Some v -> (
      match v.v_node with
      | Some node -> Dom_ext.query_selector_all (!snapshot_of_node node) sel
      | None -> [])
  | None -> Dom_ext.query_selector_all el sel

(* ---------- misc ---------- *)

let parent_el el : el option =
  match vrec_of_el el with
  | Some v -> (
      match v.v_parent with
      | Some p -> Some p
      | None -> (
          match v.v_node, rt () with
          | Some node, Some rt -> (
              match
                Hashtbl.find_opt rt.Lui_runtime.runtime_parents node
              with
              | Some p -> Some (!snapshot_of_node p)
              | None -> None)
          | _ -> None))
  | None -> (
      match Dom_ext.prop "ancestors" el with
      | Js.Json.JArray a when Array.length a > 0 -> Some a.(0)
      | _ -> None)

let contains a b =
  match node_of_el a with
  | None -> false
  | Some an -> (
      let rec walk el depth =
        depth < 64
        &&
        match node_of_el el with
        | Some n when n = an -> true
        | Some _ | None -> (
            match parent_el el with
            | Some p -> walk p (depth + 1)
            | None -> false)
      in
      walk b 0)

let click el =
  match node_of_el el with
  | Some node ->
      let payload =
        Js.Json.JObject
          [ ("nodeId", Js.Json.JNumber (float_of_int node))
          ; ("button", Js.Json.JNumber 0.)
          ; ("type", Js.Json.JString "click")
          ; ("target", !snapshot_of_node node) ]
      in
      Platform.emit_event "click" payload
  | None -> ()

(* element frames live Swift-side (LogseqFrameStore); dump-frames is a
   synchronous dom-op writing {"node":[x,y,w,h]} to /tmp/frames.json *)
let rect_of_node node : float * float * float * float * float =
  match Dom_ext.prop "rect" (!snapshot_of_node node) with
  | Js.Json.JObject _ as r ->
      let f n = Option.value (Dom_ext.num_prop n r) ~default:0. in
      (f "left", f "top", f "right", f "bottom", f "width")
  | _ -> (
      Host.dom_op "dump-frames" "{}";
      match
        (try
           let ic = open_in "/tmp/frames.json" in
           let n = in_channel_length ic in
           let s = really_input_string ic n in
           close_in ic;
           Some s
         with _ -> None)
      with
      | Some s -> (
          try
            match Js.Json.parseExn s with
            | Js.Json.JObject kvs -> (
                match List.assoc_opt (string_of_int node) kvs with
                | Some (Js.Json.JArray a) when Array.length a = 4 ->
                    let g i =
                      Option.value (Js.Json.decodeNumber a.(i)) ~default:0.
                    in
                    let x, y, w, h = (g 0, g 1, g 2, g 3) in
                    (x, y, x +. w, y +. h, w)
                | _ -> (0., 0., 0., 0., 0.))
            | _ -> (0., 0., 0., 0., 0.)
          with _ -> (0., 0., 0., 0., 0.))
      | None -> (0., 0., 0., 0., 0.))

let el_rect el =
  (* event-target snapshots carry "rect" already *)
  match Dom_ext.prop "rect" el with
  | Js.Json.JObject _ as r ->
      let f n = Option.value (Dom_ext.num_prop n r) ~default:0. in
      (f "left", f "top", f "right", f "bottom", f "width")
  | _ -> (
      match node_of_el el with
      | Some node -> rect_of_node node
      | None -> (0., 0., 0., 0., 0.))
