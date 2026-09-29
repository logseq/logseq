(* Extra DOM primitives for the imperative property UI. Property areas,
   popup layers and dialogs live outside the one-shot LUI view (same
   pattern as blocks/add_button.ml), so they need raw element mutation
   helpers that Editor_dom doesn't expose. Everything here stays on the
   same abstract element/event types. *)

open Editor_dom

(* Reads. *)
external el_text : el -> string = "textContent" [@@mel.get]
external el_inner_html : el -> string = "innerHTML" [@@mel.get]
external el_first_child : el -> el option = "firstElementChild"
  [@@mel.get] [@@mel.return nullable]

external el_parent : el -> el option = "parentElement"
  [@@mel.get] [@@mel.return nullable]
external el_is_connected : el -> bool = "isConnected" [@@mel.get]
external el_scroll_height : el -> int = "scrollHeight" [@@mel.get]
external el_client_height : el -> int = "clientHeight" [@@mel.get]

external el_contains : el -> el -> bool = "contains" [@@mel.send]

(* Scoped queries: sel() on an element instead of document. *)
external el_query : el -> string -> el option = "querySelector"
  [@@mel.send] [@@mel.return nullable]
external el_query_all : el -> string -> node_list = "querySelectorAll"
  [@@mel.send]

(* Document-scoped query_selector for the popup/layer roots. *)
external doc_query : string -> el option = "querySelector"
  [@@mel.scope "document"] [@@mel.return nullable]

(* Mutations. *)
external el_set_text : el -> string -> unit = "textContent" [@@mel.set]
external el_remove : el -> unit = "remove" [@@mel.send]
external el_clear : el -> unit = "replaceChildren" [@@mel.send]
external el_remove_attr : el -> string -> unit = "removeAttribute"
  [@@mel.send]
external el_click : el -> unit = "click" [@@mel.send]
external el_blur : el -> unit = "blur" [@@mel.send]
external el_select_text : el -> unit = "select" [@@mel.send]
(* el.insertAdjacentElement(position, el) — position is
   "beforebegin"|"afterbegin"|"beforeend"|"afterend". *)
external el_insert_adjacent : el -> string -> el -> unit
  = "insertAdjacentElement" [@@mel.send]

(* Element-scoped listener; returns unit so it composes with for_each_selector. *)
external el_listen : el -> string -> (ev -> unit) -> bool -> unit
  = "addEventListener" [@@mel.send]

(* Element-scoped dataset is avoided (extra opaque type); use data-*
   attributes via set_attr/get_attr instead. *)

(* clientX/clientY for context-menu-like anchoring. *)
external ev_client_x : ev -> float = "clientX" [@@mel.get]
external ev_client_y : ev -> float = "clientY" [@@mel.get]
external ev_button : ev -> int = "button" [@@mel.get]
external ev_type : ev -> string = "type" [@@mel.get]

external window_inner_width : float = "innerWidth" [@@mel.scope "window"]

(* Bounding rect, decoded field-by-field via Js.Json (one external, no
   extra abstract types). *)
external el_rect_json : el -> Js.Json.t = "getBoundingClientRect"
  [@@mel.send]

external window_inner_height : float = "innerHeight"

external rect_get : Js.Json.t -> string -> float = ""
  [@@mel.get_index]

let el_rect el =
  let j = el_rect_json el in
  ( rect_get j "left",
    rect_get j "top",
    rect_get j "right",
    rect_get j "bottom",
    rect_get j "width" )

(* Style string helper: element.style is a CSSStyleDeclaration; going
   through set_attr("style", ...) is simpler and matches the contract. *)
let set_style el s = el_set_attr el "style" s

let on_click el f =
  el_listen el "click" (fun ev -> prevent_default ev; f ev) true

let mk ?(cls = "") ?(attrs = []) tag =
  let el = create_element tag in
  if cls <> "" then el_set_class el cls;
  List.iter (fun (k, v) -> el_set_attr el k v) attrs;
  el

let child_text tag cls txt parent =
  let el = mk ~cls tag in
  el_set_text el txt;
  el_append_child parent el;
  el

let find els sel =
  let rec go i n =
    if i >= n then None
    else
      match node_list_item els i with
      | Some el when el_matches el sel -> Some el
      | Some el -> (
          match el_query el sel with Some _ as r -> r | None -> go (i + 1) n)
      | None -> go (i + 1) n
  in
  go 0 (node_list_length els)

(* Focus a text input/textarea and move caret to the end. *)
let focus_end el =
  el_focus el;
  (* input[type=number|date|...] reject setSelectionRange *)
  (try
     let n = String.length (el_value el) in
     el_set_selection_range el n n
   with _ -> ())
