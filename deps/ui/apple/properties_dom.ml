(* Native twin of properties/properties_dom.ml — el is a Json node
   snapshot; mutations go over the host dom-op channel, queries return
   empty, geometry is zero. *)

type el = Js.Json.t
type ev = Js.Json.t
type node_list = Js.Json.t
type rect = Js.Json.t

let el_counter = ref 0

let new_el tag : el =
  incr el_counter;
  Js.Json.JObject
    [ ("#new", Js.Json.JNumber (Float.of_int !el_counter))
    ; ("tag", Js.Json.JString tag) ]

let doc_op name payload =
  Host.dom_op name (Js.Json.stringify payload)

let create_element (tag : string) : el = new_el tag

let el_text (el : el) : string =
  match el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt "text" kvs) Js.Json.decodeString
      |> Option.value ~default:""
  | _ -> ""
let el_inner_html (_ : el) : string = ""
let el_first_child (_ : el) : el option = None
let el_parent (_ : el) : el option = None
let el_is_connected (_ : el) : bool = false
let el_scroll_height (_ : el) : int = 0
let el_client_height (_ : el) : int = 0
let el_contains (_ : el) (_ : el) : bool = false
let el_query (_ : el) (_ : string) : el option = None
let el_query_all (_ : el) (_ : string) : node_list = Js.Json.JArray [||]
let doc_query (_ : string) : el option = None
let el_set_text (el : el) (v : string) : unit =
  doc_op "set-text-content"
    (Js.Json.JObject [("ref", el); ("text", Js.Json.JString v)])
let el_remove (el : el) : unit =
  doc_op "remove" (Js.Json.JObject [("ref", el)])
let el_clear (el : el) : unit =
  doc_op "replace-children" (Js.Json.JObject [("ref", el)])
let el_remove_attr (el : el) (name : string) : unit =
  doc_op "remove-attr"
    (Js.Json.JObject [("ref", el); ("name", Js.Json.JString name)])
let el_click (el : el) : unit = ignore el
let el_blur (el : el) : unit = ignore el
let el_select_text (el : el) : unit = ignore el
let el_focus (el : el) : unit =
  doc_op "focus" (Js.Json.JObject [("ref", el)])
let el_id (el : el) : string =
  match el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt "id" kvs) Js.Json.decodeString
      |> Option.value ~default:""
  | _ -> ""
let el_value (el : el) : string =
  match el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt "value" kvs) Js.Json.decodeString
      |> Option.value ~default:""
  | _ -> ""
let el_set_value (el : el) (v : string) : unit =
  doc_op "set-value"
    (Js.Json.JObject [("ref", el); ("value", Js.Json.JString v)])
let el_get_attr (el : el) (name : string) : string option =
  match el with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt name kvs with
      | Some v -> Js.Json.decodeString v
      | None -> (
          match List.assoc_opt "attrs" kvs with
          | Some (Js.Json.JObject attrs) ->
              Option.bind (List.assoc_opt name attrs)
                Js.Json.decodeString
          | _ -> None))
  | _ -> None
let el_set_attr (el : el) (name : string) (v : string) : unit =
  doc_op "set-attr"
    (Js.Json.JObject
       [ ("ref", el); ("name", Js.Json.JString name)
       ; ("value", Js.Json.JString v) ])
let el_set_class (el : el) (c : string) : unit =
  doc_op "set-class"
    (Js.Json.JObject [("ref", el); ("class", Js.Json.JString c)])
let el_append_child (parent : el) (child : el) : unit =
  doc_op "append-child"
    (Js.Json.JObject [("parent", parent); ("child", child)])
let el_insert_before (parent : el) (child : el) (_b : el) : unit =
  doc_op "insert-before"
    (Js.Json.JObject [("parent", parent); ("child", child)])
let el_insert_adjacent (parent : el) (pos : string) (child : el) : unit =
  doc_op "insert-adjacent"
    (Js.Json.JObject
       [ ("parent", parent); ("pos", Js.Json.JString pos)
       ; ("child", child) ])
let el_matches (_ : el) (_ : string) : bool = false
let el_closest (_ : el) (_ : string) : el option = None
let el_listen (_ : el) (name : string) (f : ev -> unit) (_cap : bool)
    : unit =
  Platform.add_event_listener name f

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

let el_rect_json (_ : el) : Js.Json.t = Js.Json.JObject []
let rect_get (_ : Js.Json.t) (_ : string) : float = 0.

let el_rect (el : el) : float * float * float * float * float =
  ignore el;
  (0., 0., 0., 0., 0.)

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
  let id = el_id el in
  if id <> "" then
    Platform.add_event_listener ("click-" ^ id) (fun _ -> f ())

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
  ignore sel;
  let rec go i n =
    if i >= n then None else node_list_item els i |> fun _ -> go (i + 1) n
  in
  go 0 (node_list_length els)

let focus_end (_ : el) : unit = ()
let now_ms () : float = Js.Date.now ()

let rec_target (r : Js.Json.t) : el =
  match r with
  | Js.Json.JObject kvs ->
      Option.value (List.assoc_opt "target" kvs) ~default:Js.Json.JNull
  | _ -> Js.Json.JNull
