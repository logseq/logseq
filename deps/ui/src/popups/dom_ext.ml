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

(* InputEvent.inputType — "insertReplacementText" marks a programmatic
   whole-value fill (wally `fill` in e2e), as opposed to typing *)
external input_type : event -> string = "inputType" [@@mel.get]

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

external value : element -> string = "value" [@@mel.get]
external set_value : element -> string -> unit = "value" [@@mel.set]
external selection_start : element -> int = "selectionStart" [@@mel.get]

external selection_end : element -> int = "selectionEnd" [@@mel.get]

external is_connected : element -> bool = "isConnected" [@@mel.get]
external set_text_content : element -> string -> unit = "textContent"
  [@@mel.set]
external set_selection_range : element -> int -> int -> unit
  = "setSelectionRange" [@@mel.send]
external focus : element -> unit = "focus" [@@mel.send]

(* mock-text mirror (cljs util/cursor.cljs) — a hidden .mock-text inside
   .editor-inner holds one span per grapheme; caret pos is read from the
   span at the grapheme index *)
external create_element : string -> element = "createElement"
  [@@mel.scope "document"]
external append_child : element -> element -> unit = "appendChild"
  [@@mel.send]
external set_id : element -> string -> unit = "id" [@@mel.set]
external offset_left : element -> float = "offsetLeft" [@@mel.get]
external children_col : element -> Js.Json.t = "children" [@@mel.get]
external col_item : Js.Json.t -> int -> element option = "item"
  [@@mel.send] [@@mel.return nullable]
external set_mock_value : element -> string -> unit = "__mockValue" [@@mel.set]
external get_mock_value : element -> string option = "__mockValue"
  [@@mel.get] [@@mel.return nullable]
external parse_float : string -> float = "parseFloat" [@@mel.scope "window"]
external intl_obj : Js.Json.t = "Intl"

type segmenter
external make_segmenter : string -> Js.Json.t -> segmenter = "Segmenter"
  [@@mel.scope "Intl"] [@@mel.new]
external seg_iter : segmenter -> string -> Js.Json.t = "segment" [@@mel.send]
external array_from : Js.Json.t -> Js.Json.t array = "from"
  [@@mel.scope "Array"]
external seg_text : Js.Json.t -> string = "segment" [@@mel.get]

let segmenter : segmenter option =
  match Js.Json.decodeObject intl_obj with
  | Some d -> (
      match Js.Dict.get d "Segmenter" with
      | Some _ ->
          let o = Js.Dict.empty () in
          Js.Dict.set o "granularity" (Js.Json.string "grapheme");
          (try Some (make_segmenter "und" (Js.Json.object_ o))
           with _ -> None)
      | None -> None)
  | None -> None
;;

(* cljs util/split-grapheme-clusters *)
let split_graphemes s : string array =
  match segmenter with
  | Some seg ->
      let it = seg_iter seg s in
      Array.map seg_text (array_from it)
  | None -> Array.init (String.length s) (fun i -> String.make 1 s.[i])
;;

(* count grapheme clusters in s[..from-index) — cljs get-graphemes-pos *)
let graphemes_pos s from_index =
  if from_index <= 0 then 0
  else
    Array.length (split_graphemes (String.sub s 0 from_index))
;;

external bounding_rect : element -> rect = "getBoundingClientRect" [@@mel.send]
external window_inner_height : float = "innerHeight" [@@mel.scope "window"]
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
external scroll_height : element -> float = "scrollHeight" [@@mel.get]
external parent_element : element -> element option = "parentElement"
  [@@mel.get] [@@mel.return nullable]
external previous_sibling : element -> element option
  = "previousElementSibling" [@@mel.get] [@@mel.return nullable]

external active_element : element option = "document.activeElement"
  [@@mel.return nullable]

external set_timeout : (unit -> unit) -> int -> unit = "setTimeout"
  [@@mel.scope "window"]

external set_timeout_id : (unit -> unit) -> int -> int = "setTimeout"
  [@@mel.scope "window"]

external clear_timeout : int -> unit = "clearTimeout" [@@mel.scope "window"]

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

external style_set_property : element -> string -> string -> unit
  = "setProperty" [@@mel.scope "style"] [@@mel.send]

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

(* cljs ui.cljs auto-complete-keep-visible-scroll-top: scroll exactly
   enough to keep the row inside the viewport (no padding); when the row
   starts a group, the .ui__ac-group-name above it counts toward its top
   so arrowing back reveals the label *)
let scroll_row_into_view ~scroller ~row =
  let st = scroll_top scroller in
  let vh = client_height scroller in
  let s_top = rect_top (bounding_rect scroller) in
  let heading =
    match Option.bind (parent_element row) previous_sibling with
    | Some el when matches el ".ui__ac-group-name" -> Some el
    | _ -> None
  in
  let item_top =
    st
    +. (rect_top
          (bounding_rect (match heading with Some h -> h | None -> row))
       -. s_top)
  in
  let item_bottom = st +. (rect_bottom (bounding_rect row) -. s_top) in
  if item_top < st then
    set_scroll_top scroller (Float.max 0.0 item_top)
  else if item_bottom > st +. vh then
    set_scroll_top scroller (Float.max 0.0 (item_bottom -. vh))

(* the .mock-text mirror sibling of `input` inside .editor-inner *)
let mock_text_el input =
  match closest input ".editor-inner" with
  | Some inner -> query_selector inner ".mock-text"
  | None -> None
;;

(* cljs cursor.cljs build-mock-text!: one span per grapheme ("\n" -> "0"
   + <br>), ids mock-text_<i>, rebuilt only when the value changed *)
let build_mock_text input el =
  let v = value input ^ "0" in
  let cached = Option.value (get_mock_value el) ~default:"" in
  if cached <> v then (
    set_text_content el "";
    Array.iteri
      (fun i g ->
        let s = create_element "span" in
        set_id s ("mock-text_" ^ string_of_int i);
        if g = "\n" then (
          set_text_content s "0";
          append_child s (create_element "br"))
        else set_text_content s g;
        append_child el s)
      (split_graphemes v);
    set_mock_value el v)
;;

external inner_height : float = "innerHeight" [@@mel.scope "window"]

(* cljs cursor.cljs get-caret-pos -> editor.cljs popup pos:
   left = mirror-span offsetLeft + input.left - 20
   top  = mirror-span offsetTop  + input.top  + (lineHeight - 4 | 20)
   also returns the caret line top so flip-above math can anchor on it *)
let caret_popup_pos el =
  let r = bounding_rect el in
  let lh =
    let f = parse_float (style_line_height (computed_style el)) in
    if Float.is_nan f then 20.0 else f -. 4.0
  in
  let l, t =
    match mock_text_el el with
    | Some m ->
        build_mock_text el m;
        let gpos = graphemes_pos (value el) (selection_start el) in
        (match col_item (children_col m) gpos with
         | Some s -> (offset_left s, offset_top s)
         | None -> (0., 0.))
    | None -> (0., 0.)
  in
  ( l +. rect_left r -. 20., t +. rect_top r +. lh
  , t +. rect_top r )
