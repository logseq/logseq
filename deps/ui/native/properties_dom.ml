(* Native twin of properties/properties_dom.ml — el is either a virtual
   {"#new": n} shell (registry in Vdom) or a node snapshot. Virtual
   shells materialize into logseq-* extension nodes when attached under
   a mounted parent; queries run through Dom_ext's selector engine over
   the runtime element tree. *)

type el = Js.Json.t
type ev = Js.Json.t
type node_list = Js.Json.t
type rect = Js.Json.t

let new_el = Vdom.new_el
let create_element = Vdom.new_el

let doc_op name payload =
  Host.dom_op name (Js.Json.stringify payload)

let el_text (el : el) : string = Vdom.get_text el
let el_inner_html (_ : el) : string = ""

let el_first_child (el : el) : el option =
  match Vdom.vrec_of_el el with
  | Some v -> List.nth_opt v.Vdom.v_children 0
  | None -> (
      (* first snapshot whose nearest ancestor is this node *)
      match Vdom.node_of_el el with
      | Some node ->
          !Dom_ext.subtree_elements_provider node
          |> List.find_opt (fun e ->
                 match Dom_ext.prop "ancestors" e with
                 | Js.Json.JArray a when Array.length a > 0 ->
                     Dom_ext.num_prop "node-id" a.(0)
                     = Some (float_of_int node)
                 | _ -> false)
      | None -> None)

let el_parent = Vdom.parent_el
let el_is_connected = Vdom.el_is_connected
let el_scroll_height (_ : el) : int = 0
let el_client_height (_ : el) : int = 0
let el_contains = Vdom.contains
let el_query = Vdom.query

let el_query_all (el : el) (sel : string) : node_list =
  Js.Json.JArray (Array.of_list (Vdom.query_all el sel))

let doc_query (sel : string) : el option =
  if sel = "body" then Some Editor_dom.document_element
  else Dom_ext.doc_query_selector sel

let el_set_text = Vdom.set_text
let el_remove = Vdom.drop_el
let el_clear = Vdom.clear_children
let el_remove_attr = Vdom.remove_attr
let el_click = Vdom.click
let el_blur (_ : el) : unit = ()

let el_select_text (el : el) : unit =
  let len = String.length (Vdom.get_value el) in
  doc_op "set-selection-range"
    (Js.Json.JObject
       [ ("ref", Vdom.ref_json el)
       ; ("start", Js.Json.JNumber 0.)
       ; ("end", Js.Json.JNumber (float_of_int len)) ])

let el_focus (el : el) : unit =
  doc_op "focus" (Js.Json.JObject [ ("ref", Vdom.ref_json el) ])

let el_id (el : el) : string =
  match Vdom.attr_get el "id" with
  | Some id -> id
  | None -> Option.value (Dom_ext.str_prop "id" el) ~default:""

let el_value (el : el) : string =
  match Vdom.vrec_of_el el with
  | Some _ -> (
      (* materialized text inputs track their value via live_fields,
         keyed by the same dom id el_dom_id assigns (id attr else
         node-<n>) *)
      match Editor_dom.el_dom_id el with
      | Some id -> (
          match Hashtbl.find_opt Editor_dom.live_fields id with
          | Some (value, _, _) -> value
          | None -> Vdom.get_value el)
      | None -> Vdom.get_value el)
  | None -> Editor_dom.el_value el

let el_set_value (el : el) (v : string) : unit =
  (match Editor_dom.el_dom_id el with
   | Some id -> Editor_dom.set_live_value id v
   | None -> ());
  Vdom.set_value el v

let el_get_attr = Vdom.attr_get
let el_set_attr = Vdom.set_attr
let el_set_class = Vdom.set_class
let el_append_child = Vdom.append_child
let el_insert_before = Vdom.insert_before
let el_insert_adjacent = Vdom.insert_adjacent

let el_matches (el : el) (sel : string) : bool =
  match Vdom.vrec_of_el el with
  | Some v -> (
      match v.Vdom.v_node with
      | Some node ->
          Dom_ext.scoped_matches ~scope:el sel
            (!Vdom.snapshot_of_node node)
            (Dom_ext.ancestors_of (!Vdom.snapshot_of_node node))
      | None -> (
          (* match single compounds against the virtual snapshot *)
          match Dom_ext.parse_steps sel with
          | [ { Dom_ext.s_comp = Some comp; _ } ] ->
              Dom_ext.match_compound (Vdom.snapshot_of_vrec v) comp
          | _ -> false))
  | None ->
      Dom_ext.selector_matches sel el (Dom_ext.ancestors_of el)

let el_closest (el : el) (sel : string) : el option =
  match Vdom.vrec_of_el el with
  | Some v -> (
      match v.Vdom.v_node with
      | Some node -> Dom_ext.closest (!Vdom.snapshot_of_node node) sel
      | None -> (
          (* walk the virtual parent chain matching single compounds *)
          let rec walk e depth =
            if depth > 64 then None
            else
              let snap =
                match Vdom.vrec_of_el e with
                | Some vv -> Vdom.snapshot_of_vrec vv
                | None -> e
              in
              match Dom_ext.parse_steps sel with
              | [ { Dom_ext.s_comp = Some comp; _ } ]
                when Dom_ext.match_compound snap comp ->
                  Some e
              | _ -> (
                  match Vdom.parent_el e with
                  | Some p -> walk p (depth + 1)
                  | None -> None)
          in
          walk el 0))
  | None -> Dom_ext.closest el sel

let el_listen (el : el) (name : string) (f : ev -> unit) (_cap : bool)
    : unit =
  Vdom.listen el name f

let ev_target (ev : ev) : el option =
  match ev with
  | Js.Json.JObject kvs -> List.assoc_opt "target" kvs
  | _ -> None

let ev_key (ev : ev) : string =
  Option.value (Dom_ext.str_prop "key" ev) ~default:""

let ev_client_x (ev : ev) : float = Dom_ext.client_x ev
let ev_client_y (ev : ev) : float = Dom_ext.client_y ev

let ev_button (ev : ev) : int =
  Option.value
    (Option.map int_of_float (Dom_ext.num_prop "button" ev))
    ~default:0

let ev_type (ev : ev) : string =
  Option.value (Dom_ext.str_prop "type" ev) ~default:""

let window_inner_width : float = Host.inner_width ()
let window_inner_height : float = Host.inner_height ()

let el_rect (el : el) : float * float * float * float * float =
  Vdom.el_rect el

let el_rect_json (el : el) : Js.Json.t =
  let l, t, r, b, w = Vdom.el_rect el in
  Js.Json.JObject
    [ ("left", Js.Json.JNumber l); ("top", Js.Json.JNumber t)
    ; ("right", Js.Json.JNumber r); ("bottom", Js.Json.JNumber b)
    ; ("width", Js.Json.JNumber w)
    ; ("height", Js.Json.JNumber (b -. t)) ]

let rect_get (r : Js.Json.t) (name : string) : float =
  Option.value (Dom_ext.num_prop name r) ~default:0.

let node_list_length (nl : node_list) : int =
  match nl with Js.Json.JArray a -> Array.length a | _ -> 0

let node_list_item (nl : node_list) (i : int) : el option =
  match nl with
  | Js.Json.JArray a ->
      if i >= 0 && i < Array.length a then Some a.(i) else None
  | _ -> None

let set_style (el : el) (s : string) : unit =
  el_set_attr el "style" s

let on_click (el : el) (f : unit -> unit) : unit =
  el_listen el "click" (fun _ -> f ()) true

let mk ?(cls = "") ?(attrs = []) (tag : string) : el =
  let el = new_el tag in
  if cls <> "" then el_set_class el cls;
  List.iter (fun (k, v) -> el_set_attr el k v) attrs;
  el

let child_text (tag : string) (cls : string) (txt : string)
    (parent : el) : el =
  let el = mk ~cls tag in
  el_set_text el txt;
  el_append_child parent el;
  el

let find (els : node_list) (sel : string) : el option =
  let rec go i n =
    if i >= n then None
    else
      match node_list_item els i with
      | Some el when el_matches el sel -> Some el
      | _ -> go (i + 1) n
  in
  go 0 (node_list_length els)

let focus_end (el : el) : unit =
  el_focus el;
  let len = String.length (el_value el) in
  doc_op "set-selection-range"
    (Js.Json.JObject
       [ ("ref", Vdom.ref_json el)
       ; ("start", Js.Json.JNumber (float_of_int len))
       ; ("end", Js.Json.JNumber (float_of_int len)) ])

let now_ms () : float = Js.Date.now ()

let rec_target (r : Js.Json.t) : el =
  match r with
  | Js.Json.JObject kvs ->
      Option.value (List.assoc_opt "target" kvs) ~default:Js.Json.JNull
  | _ -> Js.Json.JNull
