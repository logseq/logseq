(* Imperative element registry for {#new:n} elements.

   Views build their DOM imperatively (`Views_dom.h` -> `el_append_child`
   -> ...). Each {#new:n} payload is materialized as a real `logseq-<tag>`
   extension node via Lui_runtime.create_extension_node + insert_child, so
   the same Swift element renderer (LogseqElementView), the same dom-event
   channel and the same patch flush serve imperative and declarative
   content. Elements appended to document.body are runtime-orphaned (they
   would otherwise render inside the root section stack); they are pushed
   to the host via the "imperative-attach"/"imperative-detach" dom-ops and
   rendered by the imperative overlay layer in App.swift — extension
   children self-position through their `position:fixed` style.

   Element state (attrs, children, value, listeners, rects) lives
   OCaml-side so reads and event dispatch resolve without a host
   round-trip, and closest()/query helpers see a single unified ancestor
   chain: imperative parents first, then the host's own snapshot chain.

   Events: the host emits "dom-event" through the element's extension
   context; each imperative node registers a Lui_runtime.on_event
   trampoline that unwraps {name, payload} and feeds Platform.emit_event,
   which bubbles through runtime_parents invoking the per-node
   dom_handlers entry this module installs — the same path Logseq_dom.dom
   uses for declarative elements. *)

open Lui_protocol
open Js.Json

type el = Js.Json.t

type node =
  { s_id : int
  ; s_tag : string
  ; s_el : el (* the {#new:n} payload handed to callers — stable for == *)
  ; mutable s_cls : string
  ; mutable s_attrs : (string * string) list
  ; mutable s_text : string
  ; mutable s_value : string
  ; mutable s_checked : bool
  ; mutable s_children : el list (* imperative child payloads *)
  ; mutable s_parent : el option (* imperative parent payload or host el *)
  ; mutable s_lui : int (* extension runtime node id; 0 = unmaterialized *)
  ; mutable s_scope : Signal.scope option
  ; mutable s_body_attached : bool
  }

let nodes : (int, node) Hashtbl.t = Hashtbl.create 256
let listeners : (int, (string * (Js.Json.t -> unit)) list) Hashtbl.t =
  Hashtbl.create 256
(* frames keyed by LUI node id — imperative-rects reports node ids for
   every rendered node, imperative or declarative *)
let rects : (int, float * float * float * float) Hashtbl.t =
  Hashtbl.create 256
let lui_index : (int, int) Hashtbl.t = Hashtbl.create 256
(* lui node -> imperative id *)
let next_id = ref 0
let root_dom_id = ref ""

let lui_app : Lui_runtime.application option ref = ref None
let host_scope : Signal.scope option ref = ref None

let install (app : ('a, 'b) Lui_app.reducer_app) =
  lui_app := Some (Lui_app.runtime app);
  host_scope := Some (Signal.scope "imperative-elements")

let app () =
  match !lui_app with
  | Some a -> a
  | None -> invalid_arg "Imperative_dom.install not called"

(* resolve a host element (a mounted LUI snapshot payload) to its runtime
   node id — installed by editor_dom, which owns the element providers *)
let lui_snapshot_by_node_id : (int -> Js.Json.t option) ref =
  ref (fun _ -> None)
let lui_snapshot_by_dom_id : (string -> Js.Json.t option) ref =
  ref (fun _ -> None)
let lui_node_by_dom_id : (string -> int option) ref = ref (fun _ -> None)

let alloc () =
  incr next_id;
  !next_id

let get id = Hashtbl.find_opt nodes id

let id_of (el : el) : int option =
  match el with
  | JObject kvs -> (
      match List.assoc_opt "#new" kvs with
      | Some v -> Option.map int_of_float (decodeNumber v)
      | None -> (
          (* snapshot payload of a materialized imperative extension node —
             resolve it back through the lui-node index *)
          match List.assoc_opt "node-id" kvs with
          | Some v -> (
              match decodeNumber v with
              | Some nid -> Hashtbl.find_opt lui_index (int_of_float nid)
              | None -> None)
          | None -> None))
  | _ -> None

(* ---------- attr helpers ---------- *)

let get_attr (n : node) (name : string) : string option =
  match name with
  | "class" -> if n.s_cls = "" then None else Some n.s_cls
  | "value" -> Some n.s_value
  | "checked" -> if n.s_checked then Some "" else None
  | _ -> List.assoc_opt name n.s_attrs

(* ---------- snapshot shapes (query engine + event targets) ---------- *)

let prop_json key (j : el) : Js.Json.t =
  match j with
  | JObject kvs -> Option.value (List.assoc_opt key kvs) ~default:JNull
  | _ -> JNull

let ancestors_list (j : el) : el list =
  match prop_json "ancestors" j with
  | JArray a -> Array.to_list a
  | _ -> []

(* shallow DOM-shaped snapshot of an imperative element — same field names
   the element snapshots carry (tag/class/id/attrs/node-id) plus "#new" *)
let flat_snapshot (n : node) : el =
  let dom_id =
    match List.assoc_opt "id" n.s_attrs with
    | Some id -> id
    | None -> "imp-" ^ string_of_int n.s_id
  in
  JObject
    ([ ("tag", JString (String.uppercase_ascii n.s_tag))
     ; ("class", JString n.s_cls)
     ; ("id", JString dom_id)
     ; ("#ref", JString dom_id)
     ; ("ref-id", JString dom_id)
     ; ("#new", JNumber (Float.of_int n.s_id))
     ; ("node-id", JNumber (Float.of_int n.s_lui))
     ; ( "attrs"
       , JObject
           (List.map (fun (k, v) -> (k, JString v)) n.s_attrs) ) ]
    @ (if n.s_value <> "" then [ ("value", JString n.s_value) ] else [])
    @ (if n.s_checked then [ ("checked", JBoolean true) ] else []))

(* the ancestor chain of a host element: imperative parents use this
   registry; LUI snapshot payloads carry their own "ancestors" *)
let rec host_ancestors (parent : el) : el list =
  match id_of parent with
  | Some pid -> (
      match get pid with
      | Some pn -> host_ancestors_chain pn
      | None -> [])
  | None ->
      (* a mounted snapshot el or the body marker — its own "ancestors"
         chain covers everything above it *)
      ancestors_list parent

and host_ancestors_chain (n : node) : el list =
  let shallow = flat_snapshot n in
  match n.s_parent with
  | Some p -> host_ancestors p @ [ shallow ]
  | None -> [ shallow ]

let snapshot (n : node) : el =
  match flat_snapshot n with
  | JObject kvs ->
      JObject
        (kvs
        @ [ ( "ancestors"
            , JArray
                (Array.of_list
                   (match n.s_parent with
                    | Some p -> host_ancestors p
                    | None -> [])) ) ])
  | other -> other

let snapshot_of_id id = Option.map snapshot (get id)

(* ---------- host classification ---------- *)

type host_ref =
  | Host_node of int (* runtime node id carried in a snapshot payload *)
  | Host_dom_id of string (* DOM id — resolved via lui_snapshot_by_dom_id *)
  | Host_el of int (* another imperative element *)
  | Host_body (* document.body *)

(* an imperative element's parent slot can hold: another {#new:n}, a
   mounted snapshot payload (with "node-id"/"#ref"), or the body marker *)
let host_ref_of (el : el) : host_ref =
  match id_of el with
  | Some id -> Host_el id
  | None -> (
      match Dom_ext.num_prop "node-id" el with
      | Some nid -> Host_node (int_of_float nid)
      | None -> (
          match Dom_ext.num_prop "#ref" el with
          | Some n when n = -1. -> Host_body
          | _ -> (
              match Dom_ext.str_prop "#ref" el with
              | Some s -> Host_dom_id s
              | None -> (
                  match Dom_ext.str_prop "id" el with
                  | Some s when s <> "" -> Host_dom_id s
                  | _ -> Host_body))))

(* ---------- dom-ops / payload helpers ---------- *)

let doc_op name payload = Host.dom_op name (Js.Json.stringify payload)

(* identity for host-side element ops: the {#new} payload also carries a
   "#ref" string — the accessibility-identifier the Swift element
   registers its LogseqElement under *)
let acc_id (n : node) : string =
  match List.assoc_opt "id" n.s_attrs with
  | Some id -> id
  | None -> "imp-" ^ string_of_int n.s_id

let shadow_field (el : el) : (string * Js.Json.t) list =
  match id_of el with
  | Some id -> (
      match get id with
      | Some n -> [ ("ref", JObject [ ("#ref", JString (acc_id n)) ]) ]
      | None -> [])
  | None -> []

let host_fields (_ : el) : (string * Js.Json.t) list = []

(* ---------- extension node materialization ---------- *)

let ident_of_tag tag =
  if tag = "#text" then "logseq-span"
  else if List.mem tag Logseq_dom.tags then "logseq-" ^ tag
  else "logseq-div"

let attrs_json (n : node) : string =
  let kvs =
    ("class", JString n.s_cls)
    :: List.map (fun (k, v) -> (k, JString v)) n.s_attrs
  in
  let kvs =
    if n.s_checked && not (List.mem_assoc "checked" n.s_attrs) then
      kvs @ [ ("checked", JString "") ]
    else kvs
  in
  Js.Json.stringify (JObject kvs)

let registered_names id : string list =
  match Hashtbl.find_opt listeners id with
  | Some lst -> List.sort_uniq compare (List.map fst lst)
  | None -> []

let node_scope (n : node) : Signal.scope =
  match n.s_scope with
  | Some s -> s
  | None -> (
      match !host_scope with
      | Some s ->
          let child = Signal.child_scope ("imp-" ^ string_of_int n.s_id) s in
          n.s_scope <- Some child;
          child
      | None -> invalid_arg "Imperative_dom.install not called")

let payload (n : node) : el = n.s_el
let listeners_of id name =
  match Hashtbl.find_opt listeners id with
  | Some lst ->
      List.filter_map
        (fun (n', f) -> if n' = name then Some f else None)
        lst
  | None -> []

(* ---------- dispatch flags (stopPropagation / preventDefault) ---------- *)

let stopped : (float, unit) Hashtbl.t = Hashtbl.create 8
let prevented : (float, unit) Hashtbl.t = Hashtbl.create 8
let immediates : (float, unit) Hashtbl.t = Hashtbl.create 8
let dispatch_seq = ref 0
let current_did : float ref = ref 0.

let begin_dispatch () : float =
  incr dispatch_seq;
  let d = Float.of_int !dispatch_seq in
  current_did := d;
  d

(* called from the pre-dispatch hook so every emit_event allocates a
   fresh dispatch id listeners can stop/prevent against *)
let note_dispatch () = ignore (begin_dispatch ())

let mark_stopped (d : float) = Hashtbl.replace stopped d ()
let mark_prevented (d : float) = Hashtbl.replace prevented d ()
let mark_immediate (d : float) = Hashtbl.replace immediates d ()
let is_stopped (d : float) = Hashtbl.mem stopped d
let is_prevented (d : float) = Hashtbl.mem prevented d
let is_immediate (d : float) = Hashtbl.mem immediates d

let prune_flags () =
  if !dispatch_seq > 512 then begin
    let cutoff = Float.of_int (!dispatch_seq - 256) in
    let drop tbl =
      Hashtbl.iter
        (fun k () -> if k < cutoff then Hashtbl.remove tbl k)
        tbl
    in
    drop stopped;
    drop prevented;
    drop immediates
  end

(* ---------- event dispatch ---------- *)

(* run the node's listeners for `name` against a payload; injects the
   shared dispatch id and a registry-side target snapshot so closest()/
   identity checks see the imperative chain *)
let run_listeners (n : node) (name : string) (payload : Js.Json.t) : unit =
  let fns = listeners_of n.s_id name in
  if fns <> [] && not (is_stopped !current_did) then begin
    let ev =
      match payload with
      | JObject kvs -> (
          let kvs =
            (* the payload's nodeId identifies the dispatch target — swap
               "target" for the registry-side snapshot so handler code
               comparing els or walking ancestors sees imperative ids *)
            match List.assoc_opt "nodeId" kvs with
            | Some v -> (
                match decodeNumber v with
                | Some nid -> (
                    match Hashtbl.find_opt lui_index (int_of_float nid) with
                    | Some sid -> (
                        match get sid with
                        | Some target ->
                            List.map
                              (fun (k, v') ->
                                if k = "target" then
                                  (k, snapshot target)
                                else (k, v'))
                              kvs
                        | None -> kvs)
                    | None -> kvs)
                | None -> kvs)
            | None -> kvs
          in
          JObject (kvs @ [ ("##dispatch", JNumber !current_did) ]))
      | other -> other
    in
    List.iter
      (fun f ->
        if is_immediate !current_did then ()
        else
          try f ev
          with e ->
            Printf.eprintf "[imp %s] handler exn: %s\n%!" name
              (Printexc.to_string e))
      fns
  end

(* default action after a click bubble: a[href^="#"] navigates like a
   real link (mirrors dispatch_shadow's behavior on the old channel) *)
let click_default_action (n : node) : unit =
  if (not (is_prevented !current_did)) && not (is_stopped !current_did)
  then begin
    let rec find_href (m : node) : string option =
      if m.s_tag = "a" then
        match List.assoc_opt "href" m.s_attrs with
        | Some h -> Some h
        | None -> (
            match m.s_parent with
            | Some p -> (
                match id_of p with
                | Some pid -> (
                    match get pid with Some pn -> find_href pn | None -> None)
                | None -> None)
            | None -> None)
      else
        match m.s_parent with
        | Some p -> (
            match id_of p with
            | Some pid -> (
                match get pid with Some pn -> find_href pn | None -> None)
            | None -> None)
        | None -> None
    in
    match find_href n with
    | Some href when String.length href > 0 && href.[0] = '#' ->
        Runtime.mark_nav ();
        Platform.set_location_hash (Runtime.nav_hash href)
    | _ -> ()
  end

(* value/checked reported by the host — refresh the shadow record so
   listeners that read el_value/el_checked mid-dispatch see live state *)
let sync_state_from_payload (n : node) (payload : Js.Json.t) : unit =
  match payload with
  | JObject kvs ->
      (match List.assoc_opt "value" kvs with
       | Some v -> (
           match decodeString v with
           | Some s -> n.s_value <- s
           | None -> ())
       | None -> ());
      (match List.assoc_opt "checked" kvs with
       | Some v -> (
           match decodeBoolean v with
           | Some b -> n.s_checked <- b
           | None -> ())
       | None -> ())
  | _ -> ()

(* dom-event trampoline: the host emits "dom-event" through the element's
   extension context; unwrap and re-dispatch through emit_event, which
   bubbles the runtime tree (imperative + declarative ancestors alike) and
   ends at the window listeners *)
let on_extension_event (n : node) (raw : Lui_protocol.event) : unit =
  match raw with
  | ExtensionEvent (_, ident, "dom-event", values) -> (
      let field name =
        Option.bind (String_map.find_opt name values) (fun v ->
            match v with StringValue s -> Some s | _ -> None)
      in
      match field "name" with
      | Some name ->
          let payload =
            match field "payload" with
            | Some p -> (
                try Js.Json.parseExn p
                with _ -> Js.Json.JObject [])
            | None -> Js.Json.JObject []
          in
          (* sync target state before listeners run *)
          (match payload with
           | JObject kvs -> (
               match List.assoc_opt "nodeId" kvs with
               | Some v -> (
                   match decodeNumber v with
                   | Some nid ->
                       if int_of_float nid = n.s_lui then
                         sync_state_from_payload n payload
                   | None -> ())
               | None -> ())
           | _ -> ());
          Platform.emit_event name payload;
          if name = "click" then click_default_action n
      | None -> ())
  | _ -> ()

let wire_events (n : node) : unit =
  let a = app () in
  Lui_runtime.on_event (node_scope n) a n.s_lui (fun raw ->
      on_extension_event n raw)

let sync_events_prop (n : node) : unit =
  if n.s_lui <> 0 then
    Lui_runtime.set_extension_prop (app ()) n.s_lui "events"
      (StringValue (String.concat " " (registered_names n.s_id)))

let add_listener id name f =
  (match Hashtbl.find_opt listeners id with
   | Some lst ->
       Hashtbl.replace listeners id (lst @ [ (name, f) ])
   | None -> Hashtbl.replace listeners id [ (name, f) ]);
  match get id with
  | Some n ->
      if n.s_lui <> 0 then begin
        sync_events_prop n;
        Platform.register_dom_handler n.s_lui
          ~events:(String.concat " " (registered_names id))
          (fun ev_name payload_str ->
            run_listeners n ev_name
              (match payload_str with
               | Some p -> (
                   try Js.Json.parseExn p
                   with _ -> Js.Json.JObject [])
               | None -> Js.Json.JObject []))
      end
  | None -> ()

let remove_listener id name f =
  (match Hashtbl.find_opt listeners id with
   | Some lst ->
       let rec drop acc = function
         | (n', f') :: rest when n' = name && f' == f -> drop acc rest
         | x :: rest -> drop (x :: acc) rest
         | [] -> List.rev acc
       in
       Hashtbl.replace listeners id (drop [] lst)
   | None -> ());
  match get id with
  | Some n when n.s_lui <> 0 -> sync_events_prop n
  | _ -> ()

(* ---------- prop push ---------- *)

let push_attrs (n : node) : unit =
  if n.s_lui <> 0 then
    Lui_runtime.set_extension_prop (app ()) n.s_lui "attrs"
      (StringValue (attrs_json n))

let push_style_class (n : node) : unit =
  if n.s_lui <> 0 then
    Lui_runtime.set_extension_prop (app ()) n.s_lui "style-class"
      (StringValue n.s_cls)

let push_text (n : node) : unit =
  if n.s_lui <> 0 then
    Lui_runtime.set_extension_prop (app ()) n.s_lui "text"
      (StringValue
         (if n.s_tag = "input" || n.s_tag = "textarea" then n.s_value
          else n.s_text))

let push_accessibility (n : node) : unit =
  if n.s_lui <> 0 then
    Lui_runtime.set_extension_prop (app ()) n.s_lui
      "accessibility-identifier"
      (StringValue (acc_id n))

let set_attr (n : node) (name : string) (v : string) : unit =
  (match name with
   | "class" -> n.s_cls <- v
   | "value" -> n.s_value <- v
   | "checked" -> n.s_checked <- true
   | _ ->
       n.s_attrs <-
         (name, v) :: List.filter (fun (k, _) -> k <> name) n.s_attrs);
  (match name with
   | "class" -> push_style_class n
   | "value" -> push_text n
   | "checked" -> push_attrs n
   | "id" ->
       (* accessibility-identifier is derived from the dom id *)
       push_accessibility n;
       push_attrs n
   | _ -> push_attrs n)

let remove_attr (n : node) (name : string) : unit =
  (match name with
   | "class" -> n.s_cls <- ""
   | "value" -> n.s_value <- ""
   | "checked" -> n.s_checked <- false
   | _ -> n.s_attrs <- List.filter (fun (k, _) -> k <> name) n.s_attrs);
  (match name with
   | "class" -> push_style_class n
   | "value" -> push_text n
   | "checked" -> push_attrs n
   | "id" ->
       push_accessibility n;
       push_attrs n
   | _ -> push_attrs n)

let set_text (n : node) (v : string) : unit =
  n.s_text <- v;
  push_text n

let materialize (n : node) : unit =
  if n.s_lui = 0 then begin
    let a = app () in
    let node =
      Lui_runtime.create_extension_node a (ident_of_tag n.s_tag)
    in
    n.s_lui <- node;
    Hashtbl.replace lui_index node n.s_id;
    ignore (node_scope n);
    push_attrs n;
    push_style_class n;
    push_text n;
    push_accessibility n;
    sync_events_prop n;
    wire_events n;
    (* the emit gate drops event names not in `events` — re-register the
       dom_handler with the current names *)
    if registered_names n.s_id <> [] then
      Platform.register_dom_handler n.s_lui
        ~events:(String.concat " " (registered_names n.s_id))
        (fun ev_name payload_str ->
          run_listeners n ev_name
            (match payload_str with
             | Some p -> (
                 try Js.Json.parseExn p
                 with _ -> Js.Json.JObject [])
             | None -> Js.Json.JObject []))
  end

(* ---------- attach bookkeeping (OCaml parent/children records) ---------- *)

let attach_child ~(parent : el) ~(child : el) ?before () : unit =
  (match id_of child with
   | Some cid -> (
       match get cid with
       | Some cn -> cn.s_parent <- Some parent
       | None -> ())
   | None -> ());
  match id_of parent with
  | Some pid -> (
      match get pid with
      | Some pn ->
          let children =
            match before with
            | Some b -> (
                match id_of b with
                | Some bid ->
                    let rec insert acc = function
                      | c :: rest when id_of c = Some bid ->
                          List.rev_append acc (child :: c :: rest)
                      | c :: rest -> insert (c :: acc) rest
                      | [] -> List.rev (child :: acc)
                    in
                    insert [] pn.s_children
                | None -> pn.s_children @ [ child ])
            | None -> pn.s_children @ [ child ]
          in
          pn.s_children <- children
      | None -> ())
  | None -> ()

let detach_bookkeeping (child : el) : unit =
  match id_of child with
  | Some cid -> (
      match get cid with
      | Some cn ->
          (match cn.s_parent with
           | Some p -> (
               match id_of p with
               | Some pid -> (
                   match get pid with
                   | Some pn ->
                       pn.s_children <-
                         List.filter
                           (fun c -> id_of c <> Some cid)
                           pn.s_children
                   | None -> ())
               | None -> ())
           | None -> ());
          cn.s_parent <- None
      | None -> ())
  | None -> ()

(* ---------- runtime attach ---------- *)

(* index of `child`'s s_lui within the runtime children of parent_lui —
   `before` resolves by sibling s_lui; absent/invalid → append *)
let insert_index_in_runtime ~(parent_lui : int) ~(before : el option) :
    int =
  let kids = Lui_runtime.children (app ()) parent_lui in
  match before with
  | Some b -> (
      match id_of b with
      | Some bid -> (
          match get bid with
          | Some bn when bn.s_lui <> 0 -> (
              let rec idx i = function
                | k :: rest -> if k = bn.s_lui then i else idx (i + 1) rest
                | [] -> List.length kids
              in
              idx 0 kids)
          | _ -> List.length kids)
      | None -> List.length kids)
  | None -> List.length kids

let body_attach (n : node) : unit =
  if not n.s_body_attached then begin
    n.s_body_attached <- true;
    doc_op "imperative-attach"
      (JObject [ ("nodeId", JNumber (Float.of_int n.s_lui)) ])
  end

let body_detach (n : node) : unit =
  if n.s_body_attached then begin
    n.s_body_attached <- false;
    doc_op "imperative-detach"
      (JObject [ ("nodeId", JNumber (Float.of_int n.s_lui)) ])
  end

(* materialize + insert n into the runtime tree under its recorded
   parent; imperative children cascade so a subtree built before attach
   materializes in one pass *)
let rec attach_runtime (n : node) ~(before : el option) : unit =
  materialize n;
  if n.s_lui <> 0 then begin
    (* already runtime-attached under this parent? a re-attach cascade
       (parent detached+reinserted) must not re-insert children that came
       along with it — insert_child rejects attached children *)
    let already_attached_under pid =
      match
        Hashtbl.find_opt (app ()).Lui_runtime.runtime_parents n.s_lui
      with
      | Some p -> p = pid
      | None -> false
    in
    (match n.s_parent with
    | Some p -> (
        match host_ref_of p with
        | Host_el pid -> (
            match get pid with
            | Some pn ->
                if pn.s_lui <> 0 && not (already_attached_under pn.s_lui)
                then
                  let index =
                    insert_index_in_runtime ~parent_lui:pn.s_lui ~before
                  in
                  Lui_runtime.insert_child (app ()) pn.s_lui n.s_lui index
            | None -> ())
        | Host_node pid ->
            let index = insert_index_in_runtime ~parent_lui:pid ~before in
            if already_attached_under pid then ()
            else
              Lui_runtime.insert_child (app ()) pid n.s_lui index
        | Host_dom_id dom_id -> (
            match !lui_node_by_dom_id dom_id with
            | Some pid ->
                if not (already_attached_under pid) then begin
                  let index =
                    insert_index_in_runtime ~parent_lui:pid ~before
                  in
                  Lui_runtime.insert_child (app ()) pid n.s_lui index
                end
            | None ->
                (* unresolved dom-id anchors degrade to body attach so
                   popups/menus still render *)
                body_attach n)
        | Host_body -> body_attach n)
    | None -> ());
    List.iter
      (fun c ->
        match id_of c with
        | Some cid -> (
            match get cid with
            | Some cn -> attach_runtime cn ~before:None
            | None -> ())
        | None -> ())
      n.s_children
  end

(* ---------- tree mutation (public API) ---------- *)

(* detach from the runtime parent (insert_child requires the child be
   unattached) or from the body overlay *)
let detach_runtime (n : node) : unit =
  if n.s_lui <> 0 then begin
    body_detach n;
    match
      Hashtbl.find_opt (app ()).Lui_runtime.runtime_parents n.s_lui
    with
    | Some pid -> Lui_runtime.remove_child (app ()) pid n.s_lui
    | None -> ()
  end

let reparent_detach (child : el) : unit =
  match id_of child with
  | Some cid -> (
      match get cid with
      | Some cn -> detach_runtime cn
      | None -> ())
  | None -> ()

let append_child (parent : el) (child : el) : unit =
  (* detach first if the child is already attached somewhere *)
  reparent_detach child;
  detach_bookkeeping child;
  attach_child ~parent ~child ();
  (match id_of child with
   | Some cid -> (
       match get cid with
       | Some cn -> attach_runtime cn ~before:None
       | None -> ())
   | None -> ())

let insert_before (parent : el) (child : el) (before : el option) : unit =
  reparent_detach child;
  detach_bookkeeping child;
  attach_child ~parent ~child ?before ();
  (match id_of child with
   | Some cid -> (
       match get cid with
       | Some cn -> attach_runtime cn ~before
       | None -> ())
   | None -> ())

let rec remove id : unit =
  match get id with
  | None -> ()
  | Some n ->
      (* children keep their shadow records but detach from the runtime *)
      List.iter
        (fun c ->
          match id_of c with
          | Some cid -> (
              match get cid with
              | Some cn ->
                  detach_runtime cn;
                  cn.s_parent <- None
              | None -> ())
          | None -> ())
        n.s_children;
      n.s_children <- [];
      detach_runtime n;
      if n.s_lui <> 0 then begin
        (try Lui_runtime.drop_subtree (app ()) n.s_lui
         with Invalid_argument _ -> ());
        Hashtbl.remove lui_index n.s_lui;
        Hashtbl.remove rects n.s_lui;
        Hashtbl.remove Platform.dom_handlers n.s_lui;
        n.s_lui <- 0
      end;
      (match n.s_scope with
       | Some s ->
           Signal.dispose_scope s;
           n.s_scope <- None
       | None -> ());
      detach_bookkeeping n.s_el

(* keep parity with the old alias name used by views_dom *)
let detach_child (child : el) : unit =
  (match id_of child with
   | Some cid -> (
       match get cid with
       | Some cn -> detach_runtime cn
       | None -> ())
   | None -> ());
  detach_bookkeeping child

(* ---------- rects ---------- *)

let set_rect node_id l t r b = Hashtbl.replace rects node_id (l, t, r, b)
let rect_of_node_id id = Hashtbl.find_opt rects id

let rect_of (id : int) =
  match get id with
  | Some n when n.s_lui <> 0 -> rect_of_node_id n.s_lui
  | _ -> None

(* imperative-rects feed: {rects:{<nodeId>:{left,top,right,bottom}}} —
   posted by the Swift frame reporter over the platform channel *)
let () =
  Platform.add_event_listener "imperative-rects" (fun payload ->
      match payload with
      | JObject kvs -> (
          match List.assoc_opt "rects" kvs with
          | Some (JObject frames) ->
              List.iter
                (fun (k, v) ->
                  match int_of_string_opt k with
                  | Some id -> (
                      let f key =
                        match v with
                        | JObject kvs ->
                            Option.bind (List.assoc_opt key kvs)
                              decodeNumber
                        | _ -> None
                      in
                      match (f "left", f "top", f "right", f "bottom") with
                      | Some l, Some t, Some r, Some b ->
                          set_rect id l t r b
                      | _ -> ())
                  | None -> ())
                frames
          | _ -> ())
      | _ -> ())

(* ---------- traversal / registry surface ---------- *)

let iter f = Hashtbl.iter f nodes
let fold f acc = Hashtbl.fold (fun id n acc -> f id n acc) nodes acc

let descendant_ids (root : int) : int list =
  let rec walk id acc =
    match get id with
    | None -> acc
    | Some n ->
        List.fold_left
          (fun a c ->
            match id_of c with
            | Some cid -> walk cid a
            | None -> a)
          (id :: acc) n.s_children
  in
  walk root []

(* ---------- element creation ---------- *)

let register ?(tag = "div") ?(cls = "") ?(attrs = []) ?(text = "")
    ?(value = "") ?(checked = false) () : el =
  let id = alloc () in
  let attrs, cls =
    (* a "class" pair inside attrs merges into cls *)
    match List.assoc_opt "class" attrs with
    | Some c ->
        ( List.filter (fun (k, _) -> k <> "class") attrs
        , String.trim (cls ^ " " ^ c) )
    | None -> (attrs, cls)
  in
  let acc =
    match List.assoc_opt "id" attrs with
    | Some id' -> id'
    | None -> "imp-" ^ string_of_int id
  in
  let el =
    JObject
      [ ("#new", JNumber (Float.of_int id))
      ; ("#ref", JString acc)
      ; ("ref-id", JString acc) ]
  in
  let n =
    { s_id = id
    ; s_tag = tag
    ; s_el = el
    ; s_cls = cls
    ; s_attrs = attrs
    ; s_text = text
    ; s_value =
        (match List.assoc_opt "value" attrs with
         | Some v -> v
         | None -> value)
    ; s_checked = checked || List.mem_assoc "checked" attrs
    ; s_children = []
    ; s_parent = None
    ; s_lui = 0
    ; s_scope = None
    ; s_body_attached = false
    }
  in
  Hashtbl.replace nodes id n;
  el

let create_text s = register ~tag:"#text" ~text:s ()

(* programmatic dispatch (el_click etc.): emit through the same channel
   host events take so bubbling, stopPropagation and defaults match *)
let dispatch (target_id : int) (name : string)
    (fields : (string * Js.Json.t) list) : unit =
  match get target_id with
  | None -> ()
  | Some n ->
      let payload =
        JObject
          ([ ("name", JString name)
           ; ("nodeId", JNumber (Float.of_int n.s_lui))
           ; ("target", snapshot n) ]
          @ fields)
      in
      if n.s_lui <> 0 then begin
        Platform.emit_event name payload;
        if name = "click" then click_default_action n
      end
      else begin
        (* detached element: run the imperative parent chain manually *)
        let rec walk (m : node) =
          if not (is_stopped !current_did) then begin
            run_listeners m name payload;
            match m.s_parent with
            | Some p -> (
                match id_of p with
                | Some pid -> (
                    match get pid with Some pn -> walk pn | None -> ())
                | None -> ())
            | None -> ()
          end
        in
        walk n;
        if name = "click" then click_default_action n
      end
