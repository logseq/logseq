(* Raw DOM primitives for document-level delegated listeners and element
   access the LUI/logseq-dom schema does not expose: capture-phase
   listeners, preventDefault/stopPropagation, movementX/Y, rects, scroll
   geometry, input caret/value. Shared by cmdk/ and popups/. *)

type element = Js.Json.t

type event = Js.Json.t

type rect = Js.Json.t

external document_el : element = "document"

(* listeners: document.addEventListener(name, f, capture) *)
external add_document_listener :
  string -> (event -> unit) -> bool -> unit = "addEventListener"
  [@@mel.scope "document"]

(* -- event fields -- *)

external key_ : event -> string option = "key"
  [@@mel.get] [@@mel.return nullable]

external code_ : event -> string option = "code"
  [@@mel.get] [@@mel.return nullable]

external meta_key : event -> bool = "metaKey" [@@mel.get]
external ctrl_key : event -> bool = "ctrlKey" [@@mel.get]
external shift_key : event -> bool = "shiftKey" [@@mel.get]
external alt_key : event -> bool = "altKey" [@@mel.get]
external movement_x : event -> float = "movementX" [@@mel.get]
external movement_y : event -> float = "movementY" [@@mel.get]
external client_x : event -> float = "clientX" [@@mel.get]
external client_y : event -> float = "clientY" [@@mel.get]

external target : event -> element option = "target"
  [@@mel.get] [@@mel.return nullable]

external prevent_default : event -> unit = "preventDefault" [@@mel.send]

external stop_propagation : event -> unit = "stopPropagation"
  [@@mel.send]

external stop_immediate_propagation : event -> unit
  = "stopImmediatePropagation" [@@mel.send]

(* -- element access -- *)

external matches : element -> string -> bool = "matches" [@@mel.send]

external closest : element -> string -> element option = "closest"
  [@@mel.send] [@@mel.return nullable]

external get_attribute : element -> string -> string option
  = "getAttribute" [@@mel.send] [@@mel.return nullable]

external query_selector : element -> string -> element option
  = "querySelector" [@@mel.send] [@@mel.return nullable]

external doc_query_selector : string -> element option
  = "querySelector" [@@mel.scope "document"] [@@mel.return nullable]

external tag_name : element -> string = "tagName" [@@mel.get]
external value : element -> string = "value" [@@mel.get]
external set_value : element -> string -> unit = "value" [@@mel.set]
external selection_start : element -> int = "selectionStart" [@@mel.get]
external focus : element -> unit = "focus" [@@mel.send]
external bounding_rect : element -> rect = "getBoundingClientRect" [@@mel.send]
external rect_left : rect -> float = "left" [@@mel.get]
external rect_top : rect -> float = "top" [@@mel.get]
external rect_right : rect -> float = "right" [@@mel.get]
external rect_bottom : rect -> float = "bottom" [@@mel.get]
external rect_width : rect -> float = "width" [@@mel.get]
external rect_height : rect -> float = "height" [@@mel.get]
external scroll_top : element -> float = "scrollTop" [@@mel.get]
external set_scroll_top : element -> float -> unit = "scrollTop" [@@mel.set]
external offset_top : element -> float = "offsetTop" [@@mel.get]
external offset_height : element -> float = "offsetHeight" [@@mel.get]
external client_height : element -> float = "clientHeight" [@@mel.get]

external active_element : unit -> element option = "activeElement"
  [@@mel.scope "document"] [@@mel.return nullable]

external set_timeout : (unit -> unit) -> int -> unit = "setTimeout"
  [@@mel.scope "window"]

external new_custom_event : string -> Js.Json.t -> event = "CustomEvent"
  [@@mel.new]

external dispatch_on : element -> event -> unit = "dispatchEvent"
  [@@mel.send]

(* `new CustomEvent(name, {detail: payload})` dispatched on document.
   Platform.dispatch cannot be used for this: its dispatchEvent external
   reads the method off `undefined`. TODO(core): fix Platform.dispatch and
   drop this local version. *)
let dispatch_custom name detail =
  let init = Js.Dict.empty () in
  Js.Dict.set init "detail" detail;
  dispatch_on document_el (new_custom_event name (Js.Json.object_ init))

external prompt_text : string -> string option = "prompt"
  [@@mel.scope "window"] [@@mel.return nullable]

external computed_style : element -> Js.Json.t = "getComputedStyle"
  [@@mel.scope "window"]

external style_line_height : Js.Json.t -> string = "lineHeight"
  [@@mel.get]

(* parse a dom-event payload JSON string, read a string field *)
let payload_string payload key =
  match
    try Some (Js.Json.parseExn payload) with _ -> None
  with
  | Some o -> (
      match Js.Json.decodeObject o with
      | Some d ->
          Option.bind (Js.Dict.get d key) Js.Json.decodeString
      | None -> None)
  | None -> None

let is_text_input el =
  let t = String.lowercase_ascii (tag_name el) in
  t = "input" || t = "textarea"

(* smooth scroll-nudge like cljs scroll-to-highlight: scrolls scroller so
   the row sits inside with 32px padding *)
let scroll_row_into_view ~scroller ~row =
  let s_top = rect_top (bounding_rect scroller) in
  let s_bottom = rect_bottom (bounding_rect scroller) in
  let r_top = rect_top (bounding_rect row) in
  let r_bottom = rect_bottom (bounding_rect row) in
  let pad = 32.0 in
  let st = scroll_top scroller in
  if r_bottom > s_bottom -. pad then
    set_scroll_top scroller (st +. r_bottom -. s_bottom +. pad)
  else if r_top < s_top +. pad then
    set_scroll_top scroller (st -. (s_top +. pad -. r_top))

(* text position of caret -> line index for popup placement *)
let caret_line_index el =
  if not (is_text_input el) then 0
  else
    let v = value el in
    let pos = selection_start el in
    let n = ref 0 in
    for i = 0 to Int.min pos (String.length v) - 1 do
      if String.get v i = '\n' then incr n
    done;
    !n

(* caret-relative popup position below the current line *)
let caret_popup_pos el =
  let r = bounding_rect el in
  let lh =
    match Float.of_string_opt (style_line_height (computed_style el)) with
    | Some f -> f
    | None -> 20.0
  in
  let line = float_of_int (caret_line_index el) in
  (rect_left r, rect_top r +. (line +. 1.0) *. lh)
