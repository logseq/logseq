(* Raw DOM access for the block editor. LUI's dom-event channel is
   fire-and-forget — it cannot preventDefault, read caret positions, or
   deliver clipboard payloads — so editor key handling, focus/caret
   management and the imperative .block-add-button live here behind
   document-level capture listeners and a MutationObserver. *)

type el
type ev
type node_list
type clipboard_data
type mutation_observer
type observe_opts

external document_add_listener :
  string -> (ev -> unit) -> bool -> unit = "addEventListener"
  [@@mel.scope "document"]

external get_element_by_id : string -> el option = "getElementById"
  [@@mel.scope "document"] [@@mel.return nullable]

external query_selector_all : string -> node_list = "querySelectorAll"
  [@@mel.scope "document"]

external active_element : el option = "activeElement"
  [@@mel.scope "document"] [@@mel.return nullable]

external document_element : el = "document.documentElement"

external create_element : string -> el = "createElement"
  [@@mel.scope "document"]

external create_text_node : string -> el = "createTextNode"
  [@@mel.scope "document"]

external node_list_length : node_list -> int = "length" [@@mel.get]

external node_list_item : node_list -> int -> el option = "item"
  [@@mel.send] [@@mel.return nullable]

(* event *)
external ev_key : ev -> string = "key" [@@mel.get]
external ev_shift : ev -> bool = "shiftKey" [@@mel.get]
external ev_ctrl : ev -> bool = "ctrlKey" [@@mel.get]
external ev_meta : ev -> bool = "metaKey" [@@mel.get]
external ev_alt : ev -> bool = "altKey" [@@mel.get]
external ev_repeat : ev -> bool = "repeat" [@@mel.get]
external ev_composing : ev -> bool = "isComposing" [@@mel.get]
external ev_target : ev -> el option = "target" [@@mel.get]
  [@@mel.return nullable]
external ev_clipboard : ev -> clipboard_data option = "clipboardData"
  [@@mel.get] [@@mel.return nullable]
external prevent_default : ev -> unit = "preventDefault" [@@mel.send]
external stop_propagation : ev -> unit = "stopPropagation" [@@mel.send]

(* CustomEvent.detail for the ls:editor-* channel (popups) *)
external ev_detail : ev -> Js.Json.t option = "detail"
  [@@mel.get] [@@mel.return nullable]

(* clipboard *)
external clipboard_get_text : clipboard_data -> string -> string = "getData"
  [@@mel.send]
external clipboard_set_text :
  clipboard_data -> string -> string -> unit = "setData" [@@mel.send]

(* drag events reuse the clipboard_data opaque type (both are DOM objects
   we only pass through) *)
external ev_data_transfer : ev -> clipboard_data option = "dataTransfer"
  [@@mel.get] [@@mel.return nullable]
external dt_set_data : clipboard_data -> string -> string -> unit = "setData"
  [@@mel.send]

(* FileList isn't a Js.Array — copy it *)
let dt_files : clipboard_data -> Js.Json.t array =
  [%mel.raw "function (dt) { return Array.from((dt && dt.files) || []) }"]
external ev_buttons : ev -> int = "buttons" [@@mel.get]

external ev_client_y : ev -> float = "clientY" [@@mel.get]
external ev_page_x : ev -> float = "pageX" [@@mel.get]

type rect
external el_bounding_rect : el -> rect = "getBoundingClientRect" [@@mel.send]
external rect_top : rect -> float = "top" [@@mel.get]
external rect_left : rect -> float = "left" [@@mel.get]

(* element *)
external el_id : el -> string = "id" [@@mel.get]
external el_tag : el -> string = "tagName" [@@mel.get]
external el_matches : el -> string -> bool = "matches" [@@mel.send]

external el_closest : el -> string -> el option = "closest" [@@mel.send]
  [@@mel.return nullable]

external el_query : el -> string -> el option = "querySelector"
  [@@mel.send] [@@mel.return nullable]
external el_get_attr : el -> string -> string option = "getAttribute"
  [@@mel.send] [@@mel.return nullable]
external el_set_attr : el -> string -> string -> unit = "setAttribute"
  [@@mel.send]
external el_append_child : el -> el -> unit = "appendChild" [@@mel.send]
external el_set_class : el -> string -> unit = "className" [@@mel.set]
external el_focus : el -> unit = "focus" [@@mel.send]

(* textarea *)
external el_value : el -> string = "value" [@@mel.get]
external el_set_value : el -> string -> unit = "value" [@@mel.set]
external el_set_text_content : el -> string -> unit = "textContent"
  [@@mel.set]
external el_selection_start : el -> int = "selectionStart" [@@mel.get]
external el_selection_end : el -> int = "selectionEnd" [@@mel.get]

external el_set_selection_range : el -> int -> int -> unit
  = "setSelectionRange" [@@mel.send]

external el_scroll_height : el -> int = "scrollHeight" [@@mel.get]

external el_set_style_height :
  el -> string -> unit = "height" [@@mel.set] [@@mel.scope "style"]

(* cljs mock-textarea autosize: collapse then grow to the content height *)
let autosize_textarea el =
  el_set_style_height el "auto";
  el_set_style_height el (string_of_int (el_scroll_height el) ^ "px")

(* misc *)
external set_timeout : (unit -> unit) -> int -> unit = "setTimeout"

external set_timeout_id : (unit -> unit) -> int -> int = "setTimeout"

external clear_timeout : int -> unit = "clearTimeout"

external new_observer : (unit -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external observe_opts :
  childList:bool -> subtree:bool -> observe_opts = "" [@@mel.obj]

external observe : mutation_observer -> el -> observe_opts -> unit
  = "observe" [@@mel.send]

let for_each_selector sel f =
  let nl = query_selector_all sel in
  for i = 0 to node_list_length nl - 1 do
    match node_list_item nl i with Some el -> f el | None -> ()
  done

let closest_sel sel target =
  match target with
  | Some el -> el_closest el sel
  | None -> None

let textarea_of uuid = get_element_by_id ("edit-block-" ^ uuid)

let is_editable_target target =
  match target with
  | Some el ->
      el_tag el = "TEXTAREA" || el_tag el = "INPUT"
      || el_tag el = "SELECT"
      || el_closest el "[contenteditable='true']" <> None
  | None -> false
