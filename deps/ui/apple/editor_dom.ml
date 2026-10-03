(* Native twin of editor/editor_dom.ml — el/ev are Json snapshots the
   host supplies via dom-event payloads; DOM writes become host dom-op
   requests. Element queries return None (no DOM). *)

type el = Js.Json.t
type ev = Js.Json.t
type node_list = Js.Json.t (* array of el snapshots *)
type clipboard_data = Js.Json.t
type mutation_observer = int
type mutation_record = Js.Json.t
type observe_opts = int
type rect = Js.Json.t

let json_prop = Dom_ext.prop

let document_add_listener (name : string) (f : ev -> unit)
    (_capture : bool) : unit =
  Platform.add_event_listener name f

(* callers compare elements with physical equality (ae == el), so all
   queries for the same DOM id must return the same allocation *)
let el_cache : (string, el) Hashtbl.t = Hashtbl.create 64

(* document_element / document.body are {#ref:0}/{#ref:-1} placeholder
   refs — the host key classification turns them into scope/body roots *)
let document_element : el = Js.Json.JObject [("#ref", Js.Json.JNumber 0.)]

(* ids of elements the host has told us are mounted — element-mount /
   element-unmount dom-events keep this truthful, so DOM probes like
   `get_element_by_id "ui__ac-inner"` (is the autocomplete popup open?)
   give real answers instead of always succeeding *)
let live_ids : (string, unit) Hashtbl.t = Hashtbl.create 64

(* live (value, selectionStart, selectionEnd) per DOM id — the cached
   element snapshots only carry mount-time values, but a browser's
   el.value tracks typing. Input events keep this truthful. *)
let live_fields : (string, string * int * int) Hashtbl.t =
  Hashtbl.create 16

let get_element_by_id (id : string) : el option =
  if not (Hashtbl.mem live_ids id) then None
  else
    Some
      (match Hashtbl.find_opt el_cache id with
       | Some el -> el
       | None ->
           let el =
             Js.Json.JObject
               [ ("#ref", Js.Json.JString id); ("ref-id", Js.Json.JString id)
               ]
           in
           Hashtbl.replace el_cache id el;
           el)

(* ---------- element queries (LUI subtree + {#new} shadow registry) ---------- *)

(* A query scope: roots lacking a node-id/#new (document_element, body)
   mean the whole document; otherwise matches are limited to the LUI
   subtree(s) plus shadow descendants attached inside them. *)
type query_scope =
  | Everywhere
  | Scoped of (int, unit) Hashtbl.t * (int, unit) Hashtbl.t

let scope_of_roots (roots : el list) : query_scope =
  let lui = Hashtbl.create 16 and sh = Hashtbl.create 8 in
  let unscoped = ref false in
  List.iter
    (fun r ->
      match Shadow_dom.id_of r with
      | Some id ->
          List.iter (fun i -> Hashtbl.replace sh i ())
            (Shadow_dom.descendant_ids id)
      | None -> (
          match Dom_ext.num_prop "node-id" r with
          | Some nid ->
              (* shadow children attach directly under the root, so the
                 root id itself is in scope even if the provider's
                 subtree excludes it *)
              Hashtbl.replace lui (int_of_float nid) ();
              List.iter
                (fun e ->
                  match Dom_ext.num_prop "node-id" e with
                  | Some n -> Hashtbl.replace lui (int_of_float n) ()
                  | None -> ())
                (!Dom_ext.subtree_elements_provider (int_of_float nid))
          | None -> unscoped := true))
    roots;
  if !unscoped then Everywhere else Scoped (lui, sh)

let shadow_in_scope scope (n : Shadow_dom.node) : bool =
  match scope with
  | Everywhere -> n.Shadow_dom.s_parent <> None
  | Scoped (lui, sh) -> (
      if Hashtbl.mem sh n.Shadow_dom.s_id then true
      else
        match n.Shadow_dom.s_parent with
        | Some p -> (
            match Shadow_dom.host_ref_of p with
            | Shadow_dom.Host_node nid -> Hashtbl.mem lui nid
            | Shadow_dom.Host_dom_id d -> (
                match !Shadow_dom.lui_snapshot_by_dom_id d with
                | Some s -> (
                    match Dom_ext.num_prop "node-id" s with
                    | Some nid -> Hashtbl.mem lui (int_of_float nid)
                    | None -> false)
                | None -> false)
            | _ -> false)
        | None -> false)

(* shadow els match on their synthesized snapshot but the call sites get
   the stable {#new:n} payload back *)
let shadow_query scope sel : el list =
  Shadow_dom.fold
    (fun _id n acc ->
      if shadow_in_scope scope n then begin
        let snap = Shadow_dom.snapshot n in
        if Dom_ext.selector_matches sel snap (Dom_ext.ancestors_of snap)
        then Shadow_dom.payload n :: acc
        else acc
      end
      else acc)
    []

let query_in_roots (roots : el list) (sel : string) : el list =
  let scope = scope_of_roots roots in
  let lui_hits =
    List.filter
      (fun el ->
        (match scope with
         | Everywhere -> true
         | Scoped (lui, _) -> (
             match Dom_ext.num_prop "node-id" el with
             | Some n -> Hashtbl.mem lui (int_of_float n)
             | None -> false))
        && Dom_ext.selector_matches sel el (Dom_ext.ancestors_of el))
      (!Dom_ext.doc_elements_provider ())
  in
  lui_hits @ shadow_query scope sel

let query_selector (sel : string) : el option =
  match query_in_roots [ document_element ] sel with
  | h :: _ -> Some h
  | [] -> None

let query_selector_all (sel : string) : node_list =
  Js.Json.JArray (Array.of_list (query_in_roots [ document_element ] sel))

let node_list_iter (nl : node_list) (f : el -> unit) : unit =
  match nl with
  | Js.Json.JArray a -> Array.iter f a
  | _ -> ()

let el_of_json (j : Js.Json.t) : el = j

(* view DOM builders — {#new} shadow nodes so attrs/children/read-backs
   resolve OCaml-side and the Swift store can materialize them *)
let create_element (tag : string) : el = Shadow_dom.register ~tag ()

let create_text_node (text : string) : el = Shadow_dom.create_text text

(* ---------- events ---------- *)

let ev_key (ev : ev) : string =
  match ev with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt "key" kvs with
      | Some v -> Option.value (Js.Json.decodeString v) ~default:""
      | None -> "")
  | _ -> ""

let ev_target (ev : ev) : el option =
  match json_prop "target" ev with
  | Js.Json.JObject _ as el -> Some el
  | _ -> None

(* shadow-dispatch events carry "##dispatch"; a stop/prevent marks the
   flags table so the shadow dispatcher halts the remaining chain *)
let prevent_default (ev : ev) : unit =
  match Dom_ext.num_prop "##dispatch" ev with
  | Some d -> Shadow_dom.mark_prevented d
  | None -> ()

let stop_propagation (ev : ev) : unit =
  match Dom_ext.num_prop "##dispatch" ev with
  | Some d -> Shadow_dom.mark_stopped d
  | None -> ()

let ev_buttons (ev : ev) : int =
  match json_prop "buttons" ev with
  | Js.Json.JNumber n -> int_of_float n
  | _ -> 0

(* ---------- element ops ---------- *)

(* attrs set on mounted (LUI) elements via el_set_attr — the host can't
   mutate post-mount, but callers read them back (view-mount idempotency
   marks like data-views-inst), so they persist OCaml-side keyed by the
   element's identity *)
let attr_overrides : (string, (string, string) Hashtbl.t) Hashtbl.t =
  Hashtbl.create 16

let override_key (el : el) : string option =
  match Dom_ext.num_prop "node-id" el with
  | Some n -> Some ("node-" ^ string_of_int (int_of_float n))
  | None -> (
      match Dom_ext.str_prop "#ref" el with
      | Some s -> Some ("dom:" ^ s)
      | None -> (
          match Dom_ext.str_prop "ref-id" el with
          | Some s -> Some ("dom:" ^ s)
          | None -> None))

let record_attr_override (el : el) (name : string) (v : string) : unit =
  match override_key el with
  | Some k ->
      let t =
        match Hashtbl.find_opt attr_overrides k with
        | Some t -> t
        | None ->
            let t = Hashtbl.create 8 in
            Hashtbl.replace attr_overrides k t;
            t
      in
      Hashtbl.replace t name v
  | None -> ()

let remove_attr_override (el : el) (name : string) : unit =
  match override_key el with
  | Some k -> (
      match Hashtbl.find_opt attr_overrides k with
      | Some t -> Hashtbl.remove t name
      | None -> ())
  | None -> ()

let el_get_attr (el : el) (name : string) : string option =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> Shadow_dom.get_attr n name
      | None -> None)
  | None -> (
      let overridden =
        match override_key el with
        | Some k -> (
            match Hashtbl.find_opt attr_overrides k with
            | Some t -> Hashtbl.find_opt t name
            | None -> None)
        | None -> None
      in
      match overridden with
      | Some _ -> overridden
      | None -> (
          match el with
          | Js.Json.JObject kvs -> (
              match List.assoc_opt ("attr-" ^ name) kvs with
              | Some v -> Js.Json.decodeString v
              | None -> (
                  match List.assoc_opt "attrs" kvs with
                  | Some (Js.Json.JObject attrs) ->
                      Option.bind (List.assoc_opt name attrs)
                        Js.Json.decodeString
                  | _ -> (
                      (* snapshots carry the DOM class under "class", not
                         attrs *)
                      match name with
                      | "class" ->
                          Option.bind (List.assoc_opt "class" kvs)
                            Js.Json.decodeString
                      | _ -> None)))
          | _ -> None))

let el_has_attr (el : el) (name : string) : bool =
  el_get_attr el name <> None

let el_set_attr (el : el) (name : string) (v : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> Shadow_dom.set_attr n name v
       | None -> ())
   | None -> record_attr_override el name v);
  Host.dom_op "set-attr"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("ref", el); ("name", Js.Json.JString name)
           ; ("value", Js.Json.JString v) ]
          @ Shadow_dom.shadow_field el)))

let el_remove_attr (el : el) (name : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> Shadow_dom.remove_attr n name
       | None -> ())
   | None -> remove_attr_override el name);
  Host.dom_op "remove-attr"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("ref", el); ("name", Js.Json.JString name) ]
          @ Shadow_dom.shadow_field el)))

let el_append_child (parent : el) (child : el) : unit =
  Shadow_dom.append_child parent child

(* LUI-snapshot lookups for Shadow_dom's ancestor splicing — resolved
   against the element providers native_embed installs *)
let () =
  Shadow_dom.lui_snapshot_by_node_id :=
    (fun n ->
      List.find_opt
        (fun el ->
          Dom_ext.num_prop "node-id" el = Some (Float.of_int n))
        (!Dom_ext.doc_elements_provider ()));
  Shadow_dom.lui_snapshot_by_dom_id :=
    (fun dom_id ->
      List.find_opt
        (fun el ->
          (match Dom_ext.str_prop "#ref" el with
           | Some s -> s = dom_id
           | None -> false)
          ||
          (match Dom_ext.str_prop "id" el with
           | Some s -> s = dom_id
           | None -> false))
        (!Dom_ext.doc_elements_provider ()))

(* element identity keys shared by snapshots and synth shadow snapshots *)
let identity_keys (el : el) (t : (string, unit) Hashtbl.t) =
  (match Shadow_dom.id_of el with
   | Some i -> Hashtbl.replace t ("new-" ^ string_of_int i) ()
   | None -> ());
  (match el with
   | Js.Json.JObject kvs -> (
       match List.assoc_opt "#shadow" kvs with
       | Some v -> (
           match Js.Json.decodeNumber v with
           | Some n ->
               Hashtbl.replace t ("new-" ^ string_of_int (int_of_float n)) ()
           | None -> ())
       | None -> ())
   | _ -> ());
  (match Dom_ext.num_prop "node-id" el with
   | Some n -> Hashtbl.replace t ("node-" ^ string_of_int (int_of_float n)) ()
   | None -> ());
  (match Dom_ext.str_prop "#ref" el with
   | Some s -> Hashtbl.replace t ("dom:" ^ s) ()
   | None -> ());
  match Dom_ext.str_prop "id" el with
  | Some s when s <> "" -> Hashtbl.replace t ("dom:" ^ s) ()
  | _ -> ()

let ids_of (el : el) : (string, unit) Hashtbl.t =
  let t = Hashtbl.create 16 in
  identity_keys el t;
  let ancestors =
    match Shadow_dom.id_of el with
    | Some id -> (
        match Shadow_dom.snapshot_of_id id with
        | Some s -> Dom_ext.ancestors_of s
        | None -> [])
    | None -> Dom_ext.ancestors_of el
  in
  List.iter (fun a -> identity_keys a t) ancestors;
  t

let el_contains (a : el) (b : el) : bool =
  let ia = ids_of a and ib = ids_of b in
  Hashtbl.fold (fun k _ acc -> acc || Hashtbl.mem ib k) ia false

let el_focus (el : el) : unit =
  Host.dom_op "focus"
    (Js.Json.stringify
       (Js.Json.JObject ([ ("ref", el) ] @ Shadow_dom.shadow_field el)))

let el_scroll_into_view (el : el) : unit =
  Host.dom_op "scroll-into-view"
    (Js.Json.stringify
       (Js.Json.JObject ([ ("ref", el) ] @ Shadow_dom.shadow_field el)))

let el_class_add (el : el) (c : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n ->
           Shadow_dom.set_attr n "class"
             (String.trim (n.Shadow_dom.s_cls ^ " " ^ c))
       | None -> ())
   | None -> ());
  Host.dom_op "class-add"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("ref", el); ("class", Js.Json.JString c) ]
          @ Shadow_dom.shadow_field el)))

let el_class_remove (el : el) (c : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n ->
           Shadow_dom.set_attr n "class"
             (String.concat " "
                (List.filter
                   (fun t -> t <> "" && t <> c)
                   (String.split_on_char ' ' n.Shadow_dom.s_cls)))
       | None -> ())
   | None -> ());
  Host.dom_op "class-remove"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("ref", el); ("class", Js.Json.JString c) ]
          @ Shadow_dom.shadow_field el)))

let snapshot_value (el : el) : string =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> n.Shadow_dom.s_value
      | None -> "")
  | None -> (
      match el with
      | Js.Json.JObject kvs -> (
          match List.assoc_opt "value" kvs with
          | Some v -> Option.value (Js.Json.decodeString v) ~default:""
          | None -> "")
      | _ -> "")

let el_dom_id (el : el) : string option =
  match Dom_ext.str_prop "id" el with
  | Some id when id <> "" -> Some id
  | _ -> Dom_ext.str_prop "ref-id" el

let el_value (el : el) : string =
  match el_dom_id el with
  | Some id -> (
      match Hashtbl.find_opt live_fields id with
      | Some (v, _, _) -> v
      | None -> snapshot_value el)
  | None -> snapshot_value el

let set_live_value (id : string) (v : string) : unit =
  match Hashtbl.find_opt live_fields id with
  | Some (_, s, e) -> Hashtbl.replace live_fields id (v, s, e)
  | None -> Hashtbl.replace live_fields id (v, 0, 0)

let el_set_value (el : el) (v : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> n.Shadow_dom.s_value <- v
       | None -> ())
   | None -> (
       match el_dom_id el with
       | Some id -> set_live_value id v
       | None -> ()));
  Host.dom_op "set-value"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("ref", el); ("value", Js.Json.JString v) ]
          @ Shadow_dom.shadow_field el)))

let el_closest (el : el) (sel : string) : el option =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.snapshot_of_id id with
      | Some s -> Dom_ext.closest s sel
      | None -> None)
  | None -> Dom_ext.closest el sel

let el_tag (el : el) : string =
  String.uppercase_ascii
    (Option.value (Dom_ext.str_prop "tag" el) ~default:"")

(* ---------- timers ---------- *)

let set_timeout (f : unit -> unit) (ms : int) : unit =
  ignore (Host.set_timeout f ms)

let set_timeout_id (f : unit -> unit) (ms : int) : int =
  Host.set_timeout f ms

let clear_timeout (id : int) : unit = Host.clear_timeout id

(* debounce: returns a function; each call resets the timer *)
let debounce ms =
  let id = ref 0 in
  fun f ->
    clear_timeout !id;
    id := set_timeout_id f ms

(* the DOM-level raw-text fixups (hidden delimiters, lui node ids) are a
   web rendering trick — the native text views show block source
   directly *)
let ensure_raw_text_observer () = ()

let closest_sel sel target =
  match target with
  | Some el -> el_closest el sel
  | None -> None

let textarea_of uuid = get_element_by_id ("edit-block-" ^ uuid)

let is_editable_target target =
  match target with
  | Some el ->
      let t = el_tag el in
      t = "TEXTAREA" || t = "INPUT"
  | None -> false

let el_set_class (el : el) (c : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> Shadow_dom.set_attr n "class" c
       | None -> ())
   | None -> ());
  Host.dom_op "set-class"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("ref", el); ("class", Js.Json.JString c) ]
          @ Shadow_dom.shadow_field el)))

let el_query (root : el) (sel : string) : el option =
  (* querySelector excludes the root element itself *)
  let hits = query_in_roots [ root ] sel in
  let excluded =
    match Shadow_dom.id_of root with
    | Some i -> fun el -> Shadow_dom.id_of el = Some i
    | None -> (
        match Dom_ext.num_prop "node-id" root with
        | Some n ->
            fun el -> Dom_ext.num_prop "node-id" el = Some n
        | None -> fun _ -> false)
  in
  match List.filter (fun el -> not (excluded el)) hits with
  | h :: _ -> Some h
  | [] -> None

let el_query_all (root : el) (sel : string) : node_list =
  Js.Json.JArray (Array.of_list (query_in_roots [ root ] sel))

let node_list_length (nl : node_list) : int =
  match nl with Js.Json.JArray a -> Array.length a | _ -> 0

let node_list_item (nl : node_list) (i : int) : el option =
  match nl with
  | Js.Json.JArray a ->
      if i >= 0 && i < Array.length a then Some a.(i) else None
  | _ -> None

let create_el_ns (_ns : string) (tag : string) : el =
  create_element tag

let svg_ns_el (tag : string) : el =
  create_el_ns "http://www.w3.org/2000/svg" tag

(* ---------- icon els (port of src tabler_svg_el/ui_icon_el) ---------- *)

let tabler_svg_el ?(size = 18.) (name : string) : el option =
  match Icon_tabler_data.tabler_children name with
  | [] -> None
  | children ->
      let svg = create_element "svg" in
      el_set_attr svg "width" (Printf.sprintf "%g" size);
      el_set_attr svg "height" (Printf.sprintf "%g" size);
      el_set_attr svg "viewBox" "0 0 24 24";
      List.iter
        (fun (tag, attrs) ->
          let k = create_element tag in
          List.iter (fun (a, v) -> el_set_attr k a v) attrs;
          el_append_child svg k)
        children;
      Some svg

let ui_icon_el ?(size = 18.) ?(cls = "") (name : string) : el =
  match tabler_svg_el ~size name with
  | Some svg ->
      if cls <> "" then el_set_class svg cls;
      svg
  | None ->
      let i = create_element "i" in
      el_set_class i ("ti ti-" ^ name ^ (if cls = "" then "" else " " ^ cls));
      i

(* doc-scan selectors run against the Swift element registry plus the
   {#new} shadow registry — the scan covers mounted LUI elements and
   view-built shadow elements alike *)
let for_each_selector (sel : string) (f : el -> unit) : unit =
  List.iter f (query_in_roots [ document_element ] sel)

let for_each_touched (roots : el list) (sel : string) (f : el -> unit)
    : unit =
  List.iter f (query_in_roots roots sel)

type doc_scan =
  { ds_run_if : mutation_record array -> bool
  ; ds_scan : el list -> unit
  ; ds_sync : bool }

let doc_scans : doc_scan list ref = ref []

(* native embed runs this after each flush that changed the LUI tree —
   stands in for the web MutationObserver feed *)
let run_doc_scans () : unit =
  List.iter
    (fun ds ->
      if ds.ds_run_if [||] then ds.ds_scan [ document_element ])
    !doc_scans

let register_doc_scan ?(run_if = fun _ -> true) ?(sync = false)
    (scan : el list -> unit) : unit =
  doc_scans :=
    !doc_scans
    @ [ { ds_run_if = run_if; ds_scan = scan; ds_sync = sync } ];
  scan [ document_element ]

(* the host's native text views emit "focus"/"blur" dom-events carrying a
   target snapshot; the last focused DOM id stands in for
   document.activeElement *)
let last_active_id : string option ref = ref None

let active_element () : el option =
  match !last_active_id with
  | Some id -> get_element_by_id id
  | None -> None

let () =
  document_add_listener "focus"
    (fun ev ->
      last_active_id :=
        (match Dom_ext.prop "target" ev with
         | Js.Json.JObject _ as t -> Dom_ext.str_prop "ref-id" t
         | _ -> None))
    true;
  document_add_listener "blur" (fun _ -> last_active_id := None) true;
  document_add_listener "element-mount"
    (fun ev ->
      match Dom_ext.str_prop "id" ev with
      | Some id when id <> "" -> Hashtbl.replace live_ids id ()
      | _ -> ())
    true;
  document_add_listener "element-unmount"
    (fun ev ->
      match Dom_ext.str_prop "id" ev with
      | Some id ->
          Hashtbl.remove live_ids id;
          Hashtbl.remove live_fields id
      | _ -> ())
    true;
  (* refresh live fields from the target snapshot carried by every event
     — the host always injects the text view's current value there, so
     handlers that read el_value (e.g. Enter -> split) see the latest
     text even when input events are still in flight. Runs inside
     emit_event, before any listener — add_event_listener prepends, so
     a plain listener could race a stale el_value read. *)
  Platform.pre_dispatch_hook := fun ev ->
    match Dom_ext.prop "target" ev with
    | Js.Json.JObject _ as t -> (
        let id =
          match Dom_ext.str_prop "id" t with
          | Some id when id <> "" -> Some id
          | _ -> Dom_ext.str_prop "ref-id" t
        in
        match id with
        | Some id -> (
            let v =
              match Dom_ext.str_prop "value" ev with
              | Some v -> Some v
              | None -> Dom_ext.str_prop "value" t
            in
            let num name j =
              Option.map int_of_float (Dom_ext.num_prop name j)
            in
            match v with
            | Some v ->
                let s, e =
                  match
                    ( num "selectionStart" ev, num "selectionEnd" ev )
                  with
                  | Some s, Some e -> (s, e)
                  | _ -> (
                      match Hashtbl.find_opt live_fields id with
                      | Some (_, s, e) -> (s, e)
                      | None -> (0, 0))
                in
                Hashtbl.replace live_fields id (v, s, e)
            | None -> ())
        | None -> ())
    | _ -> ()

let el_set_text_content (el : el) (v : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> n.Shadow_dom.s_text <- v
       | None -> ())
   | None -> ());
  Host.dom_op "set-text-content"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("ref", el); ("text", Js.Json.JString v) ]
          @ Shadow_dom.shadow_field el)))

(* native text views auto-size — keep the call as a no-op *)
let autosize_textarea (_ : el) : unit = ()

let el_set_selection_range (el : el) (s : int) (e : int) : unit =
  (match el_dom_id el with
   | Some id -> (
       match Hashtbl.find_opt live_fields id with
       | Some (v, _, _) -> Hashtbl.replace live_fields id (v, s, e)
       | None -> Hashtbl.replace live_fields id ("", s, e))
   | None -> ());
  Host.dom_op "set-selection-range"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("ref", el)
           ; ("start", Js.Json.JNumber (Float.of_int s))
           ; ("end", Js.Json.JNumber (Float.of_int e)) ]
          @ Shadow_dom.shadow_field el)))

let el_selection_start (el : el) : int =
  match el_dom_id el with
  | Some id -> (
      match Hashtbl.find_opt live_fields id with
      | Some (_, s, _) -> s
      | None ->
          Option.value
            (Option.map int_of_float (Dom_ext.num_prop "selectionStart" el))
            ~default:0)
  | None ->
      Option.value
        (Option.map int_of_float (Dom_ext.num_prop "selectionStart" el))
        ~default:0

let el_selection_end (el : el) : int =
  match el_dom_id el with
  | Some id -> (
      match Hashtbl.find_opt live_fields id with
      | Some (_, _, e) -> e
      | None ->
          Option.value
            (Option.map int_of_float (Dom_ext.num_prop "selectionEnd" el))
            ~default:0)
  | None ->
      Option.value
        (Option.map int_of_float (Dom_ext.num_prop "selectionEnd" el))
        ~default:0

let ev_composing (_ : ev) : bool = false

let ev_meta (e : ev) : bool =
  Option.value (Dom_ext.bool_prop "metaKey" e) ~default:false

let ev_ctrl (e : ev) : bool =
  Option.value (Dom_ext.bool_prop "ctrlKey" e) ~default:false

let ev_alt (e : ev) : bool =
  Option.value (Dom_ext.bool_prop "altKey" e) ~default:false

let ev_shift (e : ev) : bool =
  Option.value (Dom_ext.bool_prop "shiftKey" e) ~default:false

let ev_clipboard (e : ev) : clipboard_data option =
  match e with
  | Js.Json.JObject kvs -> List.assoc_opt "clipboardData" kvs
  | _ -> None

let clipboard_text (cd : clipboard_data) : string =
  match cd with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt "text" kvs) Js.Json.decodeString
      |> Option.value ~default:""
  | _ -> ""

let clipboard_files (cd : clipboard_data) : Js.Json.t array =
  match cd with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt "files" kvs with
      | Some (Js.Json.JArray a) -> a
      | _ -> [||])
  | _ -> [||]

let ev_which (e : ev) : int =
  Option.value (Option.map int_of_float (Dom_ext.num_prop "which" e))
    ~default:0

let clipboard_set_text (_cd : clipboard_data) (_mime : string)
    (_text : string) : unit = ()

let node_name (el : el) : string =
  match el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt "tag" kvs) Js.Json.decodeString
      |> Option.value ~default:""
  | _ -> ""

let clipboard_get_text (cd : clipboard_data) (_mime : string) : string =
  clipboard_text cd

let ev_detail (e : ev) : Js.Json.t option =
  match e with
  | Js.Json.JObject kvs -> List.assoc_opt "detail" kvs
  | _ -> None

let rec_target (r : mutation_record) : el =
  match r with
  | Js.Json.JObject kvs ->
      Option.value (List.assoc_opt "target" kvs) ~default:Js.Json.JNull
  | _ -> Js.Json.JNull

let json_of_el (e : el) : Js.Json.t = e

let el_id (el : el) : string =
  Option.value (Dom_ext.str_prop "id" el) ~default:""

let stop_immediate (ev : ev) : unit = stop_propagation ev

type data_transfer = Js.Json.t
let ev_data_transfer (e : ev) : data_transfer option =
  match e with
  | Js.Json.JObject kvs -> List.assoc_opt "dataTransfer" kvs
  | _ -> None

let dt_files (dt : data_transfer) : Js.Json.t array =
  match dt with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt "files" kvs with
      | Some (Js.Json.JArray a) -> a
      | _ -> [||])
  | _ -> [||]
