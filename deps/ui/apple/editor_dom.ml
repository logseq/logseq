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

(* ids of elements the host has told us are mounted — element-mount /
   element-unmount dom-events keep this truthful, so DOM probes like
   `get_element_by_id "ui__ac-inner"` (is the autocomplete popup open?)
   give real answers instead of always succeeding *)
let live_ids : (string, unit) Hashtbl.t = Hashtbl.create 64

(* live (value, selectionStart, selectionEnd) per DOM id — the cached
   element snapshots only carry mount-time values, but a browser's
   el.value tracks typing. Input events keep this truthful. The table
   lives in Dom_ext so popup code reading snapshot elements sees the
   same live state. *)
let live_fields = Dom_ext.live_fields

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

let query_selector (_ : string) : el option = None
let query_selector_all (_ : string) : node_list = Js.Json.array [||]

let node_list_iter (_ : node_list) (_ : el -> unit) : unit = ()

let el_of_json (j : Js.Json.t) : el = j

let create_element (tag : string) : el =
  Js.Json.JObject [ ("tag", Js.Json.JString tag) ]

let create_text_node (text : string) : el =
  Js.Json.JObject [ ("#text", Js.Json.JString text) ]

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

let prevent_default (_ : ev) : unit = ()
let stop_propagation (_ : ev) : unit = ()

let ev_buttons (ev : ev) : int =
  match json_prop "buttons" ev with
  | Js.Json.JNumber n -> int_of_float n
  | _ -> 0

(* ---------- element ops ---------- *)

let el_get_attr (el : el) (name : string) : string option =
  match el with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt ("attr-" ^ name) kvs with
      | Some v -> Js.Json.decodeString v
      | None -> (
          match List.assoc_opt "attrs" kvs with
          | Some (Js.Json.JObject attrs) ->
              Option.bind (List.assoc_opt name attrs) Js.Json.decodeString
          | _ -> (
              (* snapshots carry the DOM class under "class", not attrs *)
              match name with
              | "class" ->
                  Option.bind (List.assoc_opt "class" kvs)
                    Js.Json.decodeString
              | _ -> None)))
  | _ -> None

let el_set_attr (el : el) (name : string) (v : string) : unit =
  Host.dom_op "set-attr"
    (Js.Json.stringify
       (Js.Json.JObject [("ref", el); ("name", Js.Json.JString name); ("value", Js.Json.JString v)]))

let el_remove_attr (el : el) (name : string) : unit =
  Host.dom_op "remove-attr"
    (Js.Json.stringify (Js.Json.JObject [("ref", el); ("name", Js.Json.JString name)]))

let el_append_child (_ : el) (_ : el) : unit = ()
let el_contains (_ : el) (_ : el) : bool = false

let el_focus (el : el) : unit =
  Host.dom_op "focus" (Js.Json.stringify (Js.Json.JObject [("ref", el)]))

let el_scroll_into_view (el : el) : unit =
  Host.dom_op "scroll-into-view"
    (Js.Json.stringify (Js.Json.JObject [("ref", el)]))

let el_class_add (el : el) (c : string) : unit =
  Host.dom_op "class-add"
    (Js.Json.stringify (Js.Json.JObject [("ref", el); ("class", Js.Json.JString c)]))

let el_class_remove (el : el) (c : string) : unit =
  Host.dom_op "class-remove"
    (Js.Json.stringify (Js.Json.JObject [("ref", el); ("class", Js.Json.JString c)]))

let snapshot_value (el : el) : string =
  match el with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt "value" kvs with
      | Some v -> Option.value (Js.Json.decodeString v) ~default:""
      | None -> "")
  | _ -> ""

let el_dom_id (el : el) : string option = Dom_ext.dom_id_of el

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
  (match el_dom_id el with
   | Some id -> set_live_value id v
   | None -> ());
  Host.dom_op "set-value"
    (Js.Json.stringify (Js.Json.JObject [("ref", el); ("value", Js.Json.JString v)]))

let el_closest (el : el) (sel : string) : el option =
  Dom_ext.closest el sel

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
  Host.dom_op "set-class"
    (Js.Json.stringify
       (Js.Json.JObject [("ref", el); ("class", Js.Json.JString c)]))

let el_query_all (_ : el) (_ : string) : node_list = Js.Json.JArray [||]

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

(* doc-scan selectors run against the Swift element registry — not
   ported yet; callbacks simply never fire *)
let for_each_selector (_sel : string) (_f : el -> unit) : unit = ()

let for_each_touched (_roots : 'a) (sel : string) (f : el -> unit)
    : unit =
  for_each_selector sel f

let el_query (_ : el) (_ : string) : el option = None

type doc_scan =
  { ds_run_if : mutation_record array -> bool
  ; ds_scan : el list -> unit
  ; ds_sync : bool }

let doc_scans : doc_scan list ref = ref []

let document_element : el = Js.Json.JObject [("#ref", Js.Json.JNumber 0.)]

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
  Host.dom_op "set-text-content"
    (Js.Json.stringify
       (Js.Json.JObject [("ref", el); ("text", Js.Json.JString v)]))

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
          [ ("ref", el)
          ; ("start", Js.Json.JNumber (Float.of_int s))
          ; ("end", Js.Json.JNumber (Float.of_int e)) ]))

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

let stop_immediate (_ : ev) : unit = ()

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
