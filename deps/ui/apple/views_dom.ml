(* Native twin of views/views_dom.ml — imperative el creation becomes a
   lightweight Json description: the Swift backend's element registry
   materializes {#new:n} nodes on the dom-op channel. Queries return
   empty; geometry is zero. *)

type el = Js.Json.t
type ev = Js.Json.t
type rect = Js.Json.t

let el_counter = ref 0

let new_el ?(tag = "div") () =
  incr el_counter;
  Js.Json.JObject
    [ ("#new", Js.Json.JNumber (Float.of_int !el_counter))
    ; ("tag", Js.Json.JString tag) ]

let doc_op name payload =
  Host.dom_op name (Js.Json.stringify payload)

let el_remove (el : el) : unit =
  doc_op "remove" (Js.Json.JObject [("ref", el)])
let el_replace_children (el : el) : unit =
  doc_op "replace-children" (Js.Json.JObject [("ref", el)])
let el_children (_ : el) : Js.Json.t = Js.Json.JArray [||]
let el_parent (_ : el) : el option = None
let el_is_connected (_ : el) : bool = false
let el_text_content (el : el) : string =
  match el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt "text" kvs) Js.Json.decodeString
      |> Option.value ~default:""
  | _ -> ""
let el_set_text_content (el : el) (v : string) : unit =
  doc_op "set-text-content"
    (Js.Json.JObject [("ref", el); ("text", Js.Json.JString v)])
let el_insert_adjacent_text (el : el) (pos : string) (v : string) : unit =
  doc_op "insert-adjacent-text"
    (Js.Json.JObject
       [("ref", el); ("pos", Js.Json.JString pos); ("text", Js.Json.JString v)])
let el_click (_ : el) : unit = ()
let el_blur (_ : el) : unit = ()
let el_checked (el : el) : bool =
  match el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt "checked" kvs) Js.Json.decodeBoolean
      |> Option.value ~default:false
  | _ -> false
let el_set_checked (el : el) (b : bool) : unit =
  doc_op "set-checked"
    (Js.Json.JObject [("ref", el); ("checked", Js.Json.JBoolean b)])
let el_insert_before (parent : el) (child : el) (_before : el option) : unit =
  doc_op "insert-before"
    (Js.Json.JObject [("parent", parent); ("child", child)])
let el_append_child (parent : el) (child : el) : unit =
  doc_op "append-child"
    (Js.Json.JObject [("parent", parent); ("child", child)])
let el_add_listener (_ : el) (name : string) (f : ev -> unit) : unit =
  Platform.add_event_listener name f
let el_add_listener_capture (_ : el) (name : string) (f : ev -> unit)
    : unit =
  Platform.add_event_listener name f
let el_remove_listener (_ : el) (_ : string) (_ : ev -> unit) : unit = ()
let el_contains (_ : el) (_ : el) : bool = false
let el_placeholder (el : el) (v : string) : unit =
  doc_op "set-placeholder"
    (Js.Json.JObject [("ref", el); ("text", Js.Json.JString v)])
let el_type (el : el) (v : string) : unit =
  doc_op "set-type"
    (Js.Json.JObject [("ref", el); ("type", Js.Json.JString v)])
let el_scroll_into_view (el : el) : unit =
  doc_op "scroll-into-view" (Js.Json.JObject [("ref", el)])
let el_has_attr (el : el) (name : string) : bool =
  match el with
  | Js.Json.JObject kvs ->
      Option.is_some (List.assoc_opt name kvs)
  | _ -> false
let el_set_attr (el : el) (name : string) (v : string) : unit =
  doc_op "set-attr"
    (Js.Json.JObject
       [("ref", el); ("name", Js.Json.JString name); ("value", Js.Json.JString v)])
let el_set_class (el : el) (c : string) : unit =
  el_set_attr el "class" c
let el_remove_attr (el : el) (name : string) : unit =
  doc_op "remove-attr"
    (Js.Json.JObject [("ref", el); ("name", Js.Json.JString name)])
let el_scroll_top (_ : el) : float = 0.
let el_scroll_height (_ : el) : float = 0.
let el_client_height (_ : el) : float = 0.
let el_client_width (_ : el) : float = 0.
let el_inner_html_set (el : el) (v : string) : unit =
  doc_op "set-inner-html"
    (Js.Json.JObject [("ref", el); ("html", Js.Json.JString v)])
let el_query_all (_ : el) (_ : string) : Js.Json.t =
  Js.Json.JArray [||]
let el_focus (el : el) : unit =
  doc_op "focus" (Js.Json.JObject [("ref", el)])
let document_body : el = Js.Json.JObject [("#ref", Js.Json.JNumber (-1.))]
let window_inner_height : float = Host.inner_height ()
let el_rect (_ : el) : rect =
  Js.Json.JObject
    [ ("left", Js.Json.JNumber 0.); ("top", Js.Json.JNumber 0.)
    ; ("bottom", Js.Json.JNumber 0.); ("width", Js.Json.JNumber 0.)
    ; ("height", Js.Json.JNumber 0.) ]
let rect_top (r : rect) : float = Dom_ext.rect_top r
let rect_left (r : rect) : float = Dom_ext.rect_left r
let rect_bottom (r : rect) : float = Dom_ext.rect_bottom r
let rect_width (r : rect) : float = Dom_ext.rect_width r
let rect_height (r : rect) : float = Dom_ext.rect_height r
let ev_client_x (ev : ev) : float = Dom_ext.client_x ev
let ev_client_y (ev : ev) : float = Dom_ext.client_y ev
let ev_button (ev : ev) : int =
  Option.value
    (Option.map int_of_float (Dom_ext.num_prop "button" ev))
    ~default:0
let ev_stop_immediate (_ : ev) : unit = ()
let el_dispatch (el : el) (_ : ev) : unit = ignore el
let now_ms () : float = Js.Date.now ()
let dispatch_custom (name : string) (detail : Js.Json.t) : unit =
  Platform.dispatch name detail
let clipboard_write (v : string) : unit Js.Promise.t =
  Host.clipboard_write v;
  Js.Promise.resolve ()
let debounce (ms : int) : (unit -> unit) -> unit =
  Editor_dom.debounce ms
let clear (el : el) : unit = el_replace_children el

let append_all (parent : el) (els : el list) : unit =
  List.iter (fun c -> el_append_child parent c) els

let h ?(tag = "div") ?(cls = "") ?(attrs = []) ?text ?title_ ?on_click
    ?on_input ?on_keydown ?on_mousedown ?(children = []) () : el =
  let fields =
    [ ("tag", Js.Json.JString tag); ("cls", Js.Json.JString cls) ]
    @ (match text with
       | Some t -> [ ("text", Js.Json.JString t) ]
       | None -> [])
    @ (match title_ with
       | Some t -> [ ("title", Js.Json.JString t) ]
       | None -> [])
    @ List.map (fun (k, v) -> (k, Js.Json.JString v)) attrs
  in
  incr el_counter;
  let j =
    Js.Json.JObject (("#new", Js.Json.JNumber (Float.of_int !el_counter)) :: fields)
  in
  let reg (name : string) (f : (ev -> unit) option) =
    match f with
    | Some g ->
        Platform.add_event_listener
          (name ^ "-" ^ string_of_int !el_counter) (fun ev -> g ev)
    | None -> ()
  in
  reg "click" on_click;
  reg "input" on_input;
  reg "keydown" on_keydown;
  reg "mousedown" on_mousedown;
  append_all j children;
  j

let create_el_ns (_ns : string) (tag : string) : el = new_el ~tag ()

let tabler_icons : (Js.Json.t -> Js.Json.t) Js.Dict.t option = None

let undefined_json : Js.Json.t = Js.Json.JNull

let svg_el (tag : string) : el = new_el ~tag ()

let icon_attr_name k = k

let json_num_str (n : float) : Js.Json.t = Js.Json.JNumber n

let rec append_icon_child (parent : el) (v : Js.Json.t) : unit =
  match v with
  | Js.Json.JArray a -> Array.iter (append_icon_child parent) a
  | _ -> el_append_child parent v

let tabler_icon_el (_name : string) : el option = None

let icon ?(cls = "") name =
  let span = new_el ~tag:"span" () in
  el_set_class span
    ("ui__icon ti ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls);
  (match tabler_icon_el name with
   | Some el -> el_append_child span el
   | None -> (
     match Editor_dom.tabler_svg_el name with
     | Some svg -> el_append_child span svg
     | None ->
       let i = new_el ~tag:"i" () in
       el_set_class i ("ti ti-" ^ name);
       el_append_child span i));
  span

let button_base_cls = "ui__button"

let variant_split_index (_ : string) = -1
let utility_groups = []
let utility_conflict (_ : string) = false
let merge_classes (toks : string list) : string =
  String.concat " " toks
let button_cls ?(variant = "default") ?(size = "default") ?(cls = "") () =
  let v =
    match variant with
    | "text" -> "as-text"
    | "ghost" -> "as-ghost"
    | "outline" -> "as-outline"
    | "secondary" -> "as-secondary"
    | "destructive" -> "as-destructive"
    | "link" -> "as-link"
    | _ -> "as-solid"
  in
  let s =
    match size with
    | "sm" -> "ls-btn-sm"
    | "xs" -> "ls-btn-xs"
    | "md" -> "ls-btn-md"
    | "lg" -> "ls-btn-lg"
    | "icon" -> "ls-btn-icon"
    | _ -> "ls-btn-default"
  in
  merge_classes [ button_base_cls; v; s; cls ]

let button_cls_str ?(variant = "") ?(size = "") (extra : string) : string =
  String.concat " "
    (List.filter (fun s -> s <> "")
       [ button_base_cls; variant; size; extra ])

let focus_end (_ : el) : unit = ()

let query_inside (root : el) (sel : string) : el option =
  Editor_dom.el_query root sel

let el_class_add (el : el) (c : string) : unit =
  doc_op "class-add" (Js.Json.JObject [("ref", el); ("class", Js.Json.JString c)])
let el_class_remove (el : el) (c : string) : unit =
  doc_op "class-remove" (Js.Json.JObject [("ref", el); ("class", Js.Json.JString c)])

let el_set_value (el : el) (v : string) : unit =
  doc_op "set-value" (Js.Json.JObject [("ref", el); ("value", Js.Json.JString v)])

let ev_detail (e : ev) : Js.Json.t option =
  match e with
  | Js.Json.JObject kvs -> List.assoc_opt "detail" kvs
  | _ -> None

let el_value (el : el) : string =
  match el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt "value" kvs) Js.Json.decodeString
      |> Option.value ~default:""
  | _ -> ""
