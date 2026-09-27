(* Imperative DOM helpers for views. Reuses Editor_dom's abstract element
   type and document-level listeners; adds the element operations views
   need (children traversal, remove, rects, focus/blur, checked, event
   dispatch) plus a small `h` builder so view trees read declaratively. *)

type el = Editor_dom.el
type ev = Editor_dom.ev

external el_remove : el -> unit = "remove" [@@mel.send]

external el_replace_children : el -> unit = "replaceChildren" [@@mel.send]

external el_children : el -> Editor_dom.node_list = "children" [@@mel.get]

external el_parent : el -> el option = "parentElement"
  [@@mel.get] [@@mel.return nullable]

external el_is_connected : el -> bool = "isConnected" [@@mel.get]

external el_text_content : el -> string = "textContent" [@@mel.get]

external el_set_text_content : el -> string -> unit = "textContent"
  [@@mel.set]

external el_click : el -> unit = "click" [@@mel.send]

external el_blur : el -> unit = "blur" [@@mel.send]

external el_checked : el -> bool = "checked" [@@mel.get]

external el_set_checked : el -> bool -> unit = "checked" [@@mel.set]

external el_insert_before : el -> el -> el option -> unit = "insertBefore"
  [@@mel.send]

external el_add_listener :
  el -> string -> (ev -> unit) -> unit = "addEventListener" [@@mel.send]

external el_add_listener_capture :
  el -> string -> (ev -> unit) -> bool -> unit = "addEventListener"
  [@@mel.send]

external el_remove_listener :
  el -> string -> (ev -> unit) -> unit = "removeEventListener" [@@mel.send]

external el_contains : el -> el -> bool = "contains" [@@mel.send]

external el_placeholder : el -> string -> unit = "placeholder" [@@mel.set]

external el_type : el -> string -> unit = "type" [@@mel.set]

external el_scroll_into_view : el -> unit = "scrollIntoView" [@@mel.send]

external el_has_attr : el -> string -> bool = "hasAttribute" [@@mel.send]

external el_scroll_top : el -> float = "scrollTop" [@@mel.get]

external el_scroll_height : el -> float = "scrollHeight" [@@mel.get]

external el_client_height : el -> float = "clientHeight" [@@mel.get]

external el_client_width : el -> float = "clientWidth" [@@mel.get]

external el_inner_html_set : el -> string -> unit = "innerHTML" [@@mel.set]

type rect

external el_rect : el -> rect = "getBoundingClientRect" [@@mel.send]

external rect_top : rect -> float = "top" [@@mel.get]
external rect_left : rect -> float = "left" [@@mel.get]
external rect_bottom : rect -> float = "bottom" [@@mel.get]
external rect_width : rect -> float = "width" [@@mel.get]
external rect_height : rect -> float = "height" [@@mel.get]

external ev_client_x : ev -> float = "clientX" [@@mel.get]
external ev_client_y : ev -> float = "clientY" [@@mel.get]
external ev_button : ev -> int = "button" [@@mel.get]
external ev_stop_immediate : ev -> unit = "stopImmediatePropagation"
  [@@mel.send]

external new_event_opts : string -> Js.Json.t -> ev = "Event" [@@mel.new]

external el_dispatch : el -> ev -> unit = "dispatchEvent" [@@mel.send]

let dispatch_bubble el name =
  el_dispatch el
    (new_event_opts name
       (Js.Json.object_
          (Js.Dict.fromList
             [ ("bubbles", Js.Json.boolean true)
             ; ("cancelable", Js.Json.boolean true)
             ])))

external now_ms : unit -> float = "now" [@@mel.scope "Date"]

let children_list el =
  let nl = el_children el in
  let n = Editor_dom.node_list_length nl in
  let rec loop i acc =
    if i >= n then List.rev acc
    else
      match Editor_dom.node_list_item nl i with
      | Some c -> loop (i + 1) (c :: acc)
      | None -> loop (i + 1) acc
  in
  loop 0 []

let append_all parent els =
  List.iter (fun c -> Editor_dom.el_append_child parent c) els

(* build element: tag, class, attrs, optional text/click/children *)
let h ?(tag = "div") ?(cls = "") ?(attrs = []) ?text ?title_ ?on_click
    ?on_input ?on_keydown ?on_mousedown ?children () : el =
  let el = Editor_dom.create_element tag in
  if cls <> "" then Editor_dom.el_set_class el cls;
  List.iter (fun (k, v) -> Editor_dom.el_set_attr el k v) attrs;
  (match title_ with
   | Some t -> Editor_dom.el_set_attr el "title" t
   | None -> ());
  (match text with Some t -> el_set_text_content el t | None -> ());
  (match on_click with
   | Some f -> el_add_listener el "click" (fun ev -> f ev)
   | None -> ());
  (match on_input with
   | Some f -> el_add_listener el "input" (fun ev -> f ev)
   | None -> ());
  (match on_keydown with
   | Some f -> el_add_listener el "keydown" (fun ev -> f ev)
   | None -> ());
  (match on_mousedown with
   | Some f -> el_add_listener el "mousedown" (fun ev -> f ev)
   | None -> ());
  (match children with Some cs -> append_all el cs | None -> ());
  el

(* <span class="ui__icon ti ls-icon-{name}"><i class="ti ti-{name}"></i></span>
   matches shui icon markup; ti-* gives the tabler glyph via the icon font *)
let icon ?(cls = "") name =
  let i = Editor_dom.create_element "i" in
  Editor_dom.el_set_class i ("ti ti-" ^ name);
  let span = Editor_dom.create_element "span" in
  Editor_dom.el_set_class span
    ("ui__icon ti ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls);
  Editor_dom.el_append_child span i;
  span

let clear el = el_replace_children el

let query_inside (root : el) sel = Editor_dom.el_query root sel

(* subtree query via :scope — querySelectorAll on element *)
external el_query_all : el -> string -> Editor_dom.node_list
  = "querySelectorAll" [@@mel.send]

let for_each_inside root sel f =
  let nl = el_query_all root sel in
  for i = 0 to Editor_dom.node_list_length nl - 1 do
    match Editor_dom.node_list_item nl i with
    | Some el -> f el
    | None -> ()
  done

let focus_end el = Editor_dom.el_focus el

(* debounce: returns a function; each call resets the timer *)
external clear_timeout : int -> unit = "clearTimeout" [@@mel.scope "window"]

external set_timeout_id : (unit -> unit) -> int -> int = "setTimeout"
  [@@mel.scope "window"]

let debounce ms =
  let id = ref (-1) in
  fun f ->
    if !id >= 0 then clear_timeout !id;
    id := set_timeout_id f ms

external el_class_add : el -> string -> unit = "add"
  [@@mel.scope "classList"]

external el_class_remove : el -> string -> unit = "remove"
  [@@mel.scope "classList"]

external el_class_toggle : el -> string -> bool -> unit = "toggle"
  [@@mel.scope "classList"]

external el_class_contains : el -> string -> bool = "contains"
  [@@mel.scope "classList"]

external el_remove_attr : el -> string -> unit = "removeAttribute" [@@mel.send]

external document_body : el = "body" [@@mel.scope "document"]

external clipboard_write : string -> unit Js.Promise.t = "writeText"
  [@@mel.scope ("navigator", "clipboard")]

external el_shift_key : ev -> bool = "shiftKey" [@@mel.get]

(* generic js property read for values outside attributes *)
external el_prop_string : el -> string -> string = "" [@@mel.get_index]

external document_el : el = "document"

external new_custom_event : string -> Js.Json.t -> ev = "CustomEvent"
  [@@mel.new]

(* `new CustomEvent(name, {detail: payload})` dispatched on document —
   Platform.dispatch's external is broken (dom_ext.ml notes it), so views
   uses this local version like popups do. *)
let dispatch_custom name detail =
  let init = Js.Dict.empty () in
  Js.Dict.set init "detail" detail;
  el_dispatch document_el (new_custom_event name (Js.Json.object_ init))

(* aliases to Editor_dom ops so view modules only need module D *)
let el_append_child = Editor_dom.el_append_child
let el_set_attr = Editor_dom.el_set_attr
let el_get_attr = Editor_dom.el_get_attr
let el_focus = Editor_dom.el_focus
let el_value = Editor_dom.el_value
let el_set_value = Editor_dom.el_set_value
