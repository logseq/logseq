(* The one DOM FFI surface for the whole UI layer. LUI's dom-event
   channel is fire-and-forget — it cannot preventDefault, read caret
   positions, or deliver clipboard payloads — so everything that needs
   real DOM access (document listeners, element ops, mutation scans,
   imperative view trees) goes through this module.

   Element/event handles are Js.Json.t — these wrappers only ever pass
   them through, so a concrete type is what lets every call site share
   the same handles without casts. Handles with real identity
   (node_list, rect, mutation records, segmenter) stay abstract.

   Naming convention:
     document-level calls keep their DOM names (get_element_by_id,
     query_selector, create_element, add_document_listener)
     el_*   element members
     ev_*   event members
     rect_* bounding-rect fields
     nl_*   NodeList access
     tl_*   TouchList access
     cd_*   ClipboardData / DataTransfer access
     win_*  window members
     js_*   generic JS value plumbing *)

(* ---------- types ---------- *)

type el = Js.Json.t
type ev = Js.Json.t
type node_list
type rect
type clipboard_data
type mutation_observer
type mutation_record
type observe_opts
type el_set
type segmenter

(* ---------- generic JS plumbing ---------- *)

external js_get : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]

(* 'a: JS property writes accept any value — objects, functions, dicts *)
external js_set : Js.Json.t -> string -> 'a -> unit = ""
  [@@mel.set_index]

external js_set_str : Js.Json.t -> string -> string -> unit = ""
  [@@mel.set_index]

external js_call :
  Js.Json.t -> Js.Json.t -> Js.Json.t -> Js.Json.t = "call" [@@mel.send]

(* o.m(a, b) with heterogenous arg types (e.g. name string + callback) *)
external js_call2 : Js.Json.t -> string -> 'a -> 'b -> Js.Json.t = "call"
  [@@mel.send] [@@mel.scope "Reflect"]

let js_undefined : Js.Json.t = [%mel.raw "undefined"]

external json_array_from : Js.Json.t -> Js.Json.t array = "from"
  [@@mel.scope "Array"]

external json_parse : string -> Js.Json.t = "parse" [@@mel.scope "JSON"]

external parse_float : string -> float = "parseFloat"
  [@@mel.scope "window"]

(* build {k: v, ...} from a pair list *)
let json_props pairs = Js.Json.object_ (Js.Dict.fromList pairs)

let str_to_json s = Js.Json.string s

(* ---------- document ---------- *)

external document_el : el = "document"
external document_element : el = "document.documentElement"
external document_body : el = "document.body"

external get_element_by_id : string -> el option = "getElementById"
  [@@mel.scope "document"] [@@mel.return nullable]

external query_selector : string -> el option = "querySelector"
  [@@mel.scope "document"] [@@mel.return nullable]

(* the apple twin names the document-scoped query doc_query *)
let doc_query = query_selector

external query_selector_all : string -> node_list = "querySelectorAll"
  [@@mel.scope "document"]

external query_selector_all_arr : string -> el array = "querySelectorAll"
  [@@mel.scope "document"]

external active_element_dom : el option = "document.activeElement"
  [@@mel.return nullable]

(* function form — the apple twin re-queries the focused node on every
   call, so shared call sites take `active_element ()` rather than a
   value that would be captured once *)
let active_element () = active_element_dom

external doc_client_width : float = "clientWidth"
  [@@mel.scope "document.documentElement"]

external doc_visibility_state : string = "visibilityState"
  [@@mel.scope "document"]

(* cljs flows/document-visibility-state *)
let document_visible () = doc_visibility_state = "visible"

external create_element : string -> el = "createElement"
  [@@mel.scope "document"]

external create_element_ns : string -> string -> el = "createElementNS"
  [@@mel.scope "document"]

external create_text_node : string -> el = "createTextNode"
  [@@mel.scope "document"]

(* listeners: document.addEventListener(name, f, capture) — the bool is
   the capture-phase flag *)
external add_document_listener :
  string -> (ev -> unit) -> bool -> unit = "addEventListener"
  [@@mel.scope "document"]

(* CustomEvents dispatched on document do not bubble to window *)
let on_document_event name f = add_document_listener name f false

external remove_document_listener : string -> (ev -> unit) -> bool -> unit
  = "removeEventListener" [@@mel.scope "document"]

let set_document_title : string -> unit =
  [%mel.raw "function (t) { document.title = t }"]

external dataset_of : el -> Js.Json.t = "dataset" [@@mel.get]

let el_dataset_set el k v = js_set_str (dataset_of el) k v

external ds_get :
  Js.Json.t -> string -> string Js.Undefined.t = "" [@@mel.get_index]

let el_dataset_get el k = Js.Undefined.toOption (ds_get (dataset_of el) k)

let el_dataset_del : el -> string -> unit =
  [%mel.raw "function (e, k) { delete e.dataset[k] }"]


let doc_set_lang s = js_set_str document_element "lang" s
let doc_set_data name value = js_set_str (dataset_of document_element) name value
let body_set_data name value = js_set_str (dataset_of document_body) name value

let body_rm_data : string -> unit =
  [%mel.raw "function (k) { delete document.body.dataset[k] }"]

let doc_add_class : string -> unit =
  [%mel.raw "function (c) { document.documentElement.classList.add(c) }"]

let doc_rm_class : string -> unit =
  [%mel.raw "function (c) { document.documentElement.classList.remove(c) }"]

let body_add_class : string -> unit =
  [%mel.raw "function (c) { document.body.classList.add(c) }"]

let body_rm_class : string -> unit =
  [%mel.raw "function (c) { document.body.classList.remove(c) }"]

(* ---------- window ---------- *)

external win_inner_height : float = "innerHeight" [@@mel.scope "window"]

external win_inner_width : float = "innerWidth" [@@mel.scope "window"]

external win_scroll_x : float = "scrollX" [@@mel.scope "window"]

external win_scroll_y : float = "scrollY" [@@mel.scope "window"]

external win_prompt : string -> string option = "prompt"
  [@@mel.scope "window"] [@@mel.return nullable]

external win_confirm : string -> bool = "confirm" [@@mel.scope "window"]

external win_open : string -> unit = "open" [@@mel.scope "window"]

external add_window_listener : string -> (ev -> unit) -> unit
  = "addEventListener" [@@mel.scope "window"]

external remove_window_listener : string -> (ev -> unit) -> unit
  = "removeEventListener" [@@mel.scope "window"]

external request_animation_frame : (unit -> unit) -> unit
  = "requestAnimationFrame" [@@mel.scope "window"]

external set_timeout_id : (unit -> unit) -> int -> int = "setTimeout"
  [@@mel.scope "window"]

external clear_timeout : int -> unit = "clearTimeout"
  [@@mel.scope "window"]

let set_timeout f ms = ignore (set_timeout_id f ms)

(* debounce: returns a function; each call resets the timer *)
let debounce ms =
  let id = ref (-1) in
  fun f ->
    if !id >= 0 then clear_timeout !id;
    id := set_timeout_id f ms

(* auto-dismiss helper (toasts, transient UI) *)
let later ?(ms = 5000) f = ignore (set_timeout_id f ms)

let prefers_dark : unit -> bool =
  [%mel.raw
    "function () { return window.matchMedia('(prefers-color-scheme: \
     dark)').matches }"]

(* ---------- events ---------- *)

external ev_key : ev -> string = "key" [@@mel.get]
external ev_shift : ev -> bool = "shiftKey" [@@mel.get]
external ev_ctrl : ev -> bool = "ctrlKey" [@@mel.get]
external ev_meta : ev -> bool = "metaKey" [@@mel.get]
external ev_alt : ev -> bool = "altKey" [@@mel.get]
external ev_repeat : ev -> bool = "repeat" [@@mel.get]
external ev_composing : ev -> bool = "isComposing" [@@mel.get]

(* InputEvent.inputType — "insertReplacementText" marks a programmatic
   whole-value fill (wally `fill` in e2e), as opposed to typing *)
external ev_input_type : ev -> string = "inputType" [@@mel.get]

external ev_key_code : ev -> int = "keyCode" [@@mel.get]
external ev_which : ev -> int = "which" [@@mel.get]

external ev_button : ev -> int = "button" [@@mel.get]
external ev_buttons : ev -> int = "buttons" [@@mel.get]
external ev_movement_x : ev -> float = "movementX" [@@mel.get]
external ev_movement_y : ev -> float = "movementY" [@@mel.get]
external ev_client_x : ev -> float = "clientX" [@@mel.get]
external ev_client_y : ev -> float = "clientY" [@@mel.get]
external ev_page_x : ev -> float = "pageX" [@@mel.get]
external ev_page_y : ev -> float = "pageY" [@@mel.get]
external ev_delta_y : ev -> float = "deltaY" [@@mel.get]
external ev_type : ev -> string = "type" [@@mel.get]

external ev_target : ev -> el option = "target"
  [@@mel.get] [@@mel.return nullable]

(* event.target.title — title lives on the target, not the event *)
let ev_target_title (e : ev) : string option =
  match ev_target e with
  | Some t -> Js.Json.decodeString (js_get t "title")
  | None -> None

(* CustomEvent.detail for the ls:* document-event channel *)
external ev_detail : ev -> Js.Json.t option = "detail"
  [@@mel.get] [@@mel.return nullable]

external ev_clipboard : ev -> clipboard_data option = "clipboardData"
  [@@mel.get] [@@mel.return nullable]

(* drag events reuse the clipboard_data type (both are DOM objects we
   only pass through) *)
external ev_data_transfer : ev -> clipboard_data option = "dataTransfer"
  [@@mel.get] [@@mel.return nullable]

external ev_prevent_default : ev -> unit = "preventDefault" [@@mel.send]

external ev_stop_propagation : ev -> unit = "stopPropagation"
  [@@mel.send]

external ev_stop_immediate : ev -> unit = "stopImmediatePropagation"
  [@@mel.send]

(* TouchList access (sidebar gesture tracking): ev.touches[i] *)
external ev_touches_length : ev -> int = "length"
  [@@mel.scope "touches"] [@@mel.get]

external ev_touch_item : ev -> int -> el = "item"
  [@@mel.scope "touches"] [@@mel.send]

(* ---------- clipboard / data-transfer payloads ---------- *)

external cd_get_data : clipboard_data -> string -> string = "getData"
  [@@mel.send]

external cd_set_data : clipboard_data -> string -> string -> unit
  = "setData" [@@mel.send]

external cd_file_list : clipboard_data -> Js.Json.t = "files" [@@mel.get]

let cd_files dt = json_array_from (cd_file_list dt)

(* ---------- elements ---------- *)

external el_matches : el -> string -> bool = "matches" [@@mel.send]

external el_closest : el -> string -> el option = "closest" [@@mel.send]
  [@@mel.return nullable]

external el_query : el -> string -> el option = "querySelector"
  [@@mel.send] [@@mel.return nullable]

external el_query_all : el -> string -> node_list = "querySelectorAll"
  [@@mel.send]

external el_query_all_arr : el -> string -> el array = "querySelectorAll"
  [@@mel.send]

external el_get_attr : el -> string -> string option = "getAttribute"
  [@@mel.send] [@@mel.return nullable]

external el_set_attr : el -> string -> string -> unit = "setAttribute"
  [@@mel.send]

external el_has_attr : el -> string -> bool = "hasAttribute" [@@mel.send]

external el_remove_attr : el -> string -> unit = "removeAttribute"
  [@@mel.send]

external el_id : el -> string = "id" [@@mel.get]
external el_set_id : el -> string -> unit = "id" [@@mel.set]
external el_tag : el -> string = "tagName" [@@mel.get]
external el_node_name : el -> string = "nodeName" [@@mel.get]
external el_node_type : el -> int = "nodeType" [@@mel.get]
external el_class : el -> string = "className" [@@mel.get]
external el_set_class : el -> string -> unit = "className" [@@mel.set]

(* mel.send on the receiver's classList: el.classList.add(c) — a bare
   [@@mel.scope "classList"] (no send) would emit global classList.add *)
external el_class_add : el -> string -> unit = "add"
  [@@mel.send] [@@mel.scope "classList"]

external el_class_remove : el -> string -> unit = "remove"
  [@@mel.send] [@@mel.scope "classList"]

external el_class_toggle : el -> string -> bool -> unit = "toggle"
  [@@mel.send] [@@mel.scope "classList"]

external el_class_contains : el -> string -> bool = "contains"
  [@@mel.send] [@@mel.scope "classList"]

external el_text_content : el -> string = "textContent" [@@mel.get]

external el_set_text_content : el -> string -> unit = "textContent"
  [@@mel.set]

external el_inner_text : el -> string = "innerText" [@@mel.get]

external el_inner_html : el -> string = "innerHTML" [@@mel.get]

external el_set_inner_html : el -> string -> unit = "innerHTML"
  [@@mel.set]

external el_value : el -> string = "value" [@@mel.get]
external el_set_value : el -> string -> unit = "value" [@@mel.set]
external el_selection_start : el -> int = "selectionStart" [@@mel.get]
external el_selection_end : el -> int = "selectionEnd" [@@mel.get]

external el_set_selection_range : el -> int -> int -> unit
  = "setSelectionRange" [@@mel.send]

external el_select_text : el -> unit = "select" [@@mel.send]
external el_focus : el -> unit = "focus" [@@mel.send]

(* shared with the native impl: stable identity for an el — the DOM id
   when present (native resolves snapshot/imperative ids too) *)
let el_dom_id (el : el) : string option = el_get_attr el "id"

(* Focus by DOM id; on the web the element either exists (real DOM) or
   the pending-focus poll picks it up next tick — no host-side queue. *)
let focus_dom_id (id : string) : unit =
  match get_element_by_id id with
  | Some el -> el_focus el
  | None -> ()
external el_blur : el -> unit = "blur" [@@mel.send]
external el_click : el -> unit = "click" [@@mel.send]
external el_checked : el -> bool = "checked" [@@mel.get]
external el_set_checked : el -> bool -> unit = "checked" [@@mel.set]

external el_set_placeholder : el -> string -> unit = "placeholder"
  [@@mel.set]

external el_set_type : el -> string -> unit = "type" [@@mel.set]

external el_append_child : el -> el -> unit = "appendChild" [@@mel.send]

external el_insert_before : el -> el -> el option -> unit = "insertBefore"
  [@@mel.send]

(* el.insertAdjacentElement(position, el) — position is
   "beforebegin"|"afterbegin"|"beforeend"|"afterend" *)
external el_insert_adjacent : el -> string -> el -> unit
  = "insertAdjacentElement" [@@mel.send]

external el_insert_adjacent_text : el -> string -> string -> unit
  = "insertAdjacentText" [@@mel.send]

external el_remove : el -> unit = "remove" [@@mel.send]
external el_replace_children : el -> unit = "replaceChildren" [@@mel.send]
external el_replace_with : el -> el -> unit = "replaceWith" [@@mel.send]
external el_contains : el -> el -> bool = "contains" [@@mel.send]

external el_parent : el -> el option = "parentElement"
  [@@mel.get] [@@mel.return nullable]

external el_previous_sibling : el -> el option = "previousElementSibling"
  [@@mel.get] [@@mel.return nullable]

external el_next_sibling : el -> el option = "nextElementSibling"
  [@@mel.get] [@@mel.return nullable]

external el_first_child : el -> el option = "firstElementChild"
  [@@mel.get] [@@mel.return nullable]

external el_children : el -> node_list = "children" [@@mel.get]
external el_child_nodes : el -> node_list = "childNodes" [@@mel.get]
external el_outer_html : el -> string = "outerHTML" [@@mel.get]
external el_body : el -> el option = "body" [@@mel.get]
  [@@mel.return nullable]
external el_is_connected : el -> bool = "isConnected" [@@mel.get]
external el_scroll_into_view : el -> unit = "scrollIntoView" [@@mel.send]

external el_scroll_into_view_opts : el -> Js.Json.t -> unit
  = "scrollIntoView" [@@mel.send]

external el_scroll_left : el -> float = "scrollLeft" [@@mel.get]
external el_set_scroll_left : el -> float -> unit = "scrollLeft" [@@mel.set]
external el_scroll_width : el -> float = "scrollWidth" [@@mel.get]
external el_scroll_top : el -> float = "scrollTop" [@@mel.get]

external el_set_scroll_top : el -> float -> unit = "scrollTop" [@@mel.set]

external el_scroll_height : el -> float = "scrollHeight" [@@mel.get]
external el_client_height : el -> float = "clientHeight" [@@mel.get]
external el_client_width : el -> float = "clientWidth" [@@mel.get]
external el_offset_top : el -> float = "offsetTop" [@@mel.get]
external el_offset_left : el -> float = "offsetLeft" [@@mel.get]
external el_offset_height : el -> float = "offsetHeight" [@@mel.get]
external el_offset_width : el -> float = "offsetWidth" [@@mel.get]
external el_nat_width : el -> float = "naturalWidth" [@@mel.get]
external el_nat_height : el -> float = "naturalHeight" [@@mel.get]

external el_bounding_rect : el -> rect = "getBoundingClientRect"
  [@@mel.send]

(* el.addEventListener(name, f, capture) *)
external el_listen : el -> string -> (ev -> unit) -> bool -> unit
  = "addEventListener" [@@mel.send]

let el_on el name f = el_listen el name f false

let el_on_once : el -> string -> (ev -> unit) -> unit =
  [%mel.raw
    "function (el, n, f) { el.addEventListener(n, f, {once: true}) }"]

external el_remove_listener : el -> string -> (ev -> unit) -> unit
  = "removeEventListener" [@@mel.send]

external el_dispatch : el -> ev -> unit = "dispatchEvent" [@@mel.send]

(* style members *)
external el_set_style_height : el -> string -> unit = "height"
  [@@mel.set] [@@mel.scope "style"]

external el_set_style_width : el -> string -> unit = "width"
  [@@mel.set] [@@mel.scope "style"]

external el_style_set_property : el -> string -> string -> unit
  = "setProperty" [@@mel.scope "style"] [@@mel.send]

external el_style_get_property : el -> string -> string
  = "getPropertyValue" [@@mel.send] [@@mel.scope "style"]

let doc_style_set_property k v =
  el_style_set_property document_element k v

(* style="..." as an attribute string *)
let set_style el s = el_set_attr el "style" s

external el_computed_style : el -> Js.Json.t = "getComputedStyle"
  [@@mel.scope "window"]

external style_get_property : Js.Json.t -> string -> string
  = "getPropertyValue" [@@mel.send]

let computed_style_str el prop =
  match Js.Json.decodeString (js_get (el_computed_style el) prop) with
  | Some s -> s
  | None -> ""

(* generic JS property read for values outside attributes *)
let el_prop_string el name =
  match Js.Json.decodeString (js_get el name) with
  | Some s -> s
  | None -> ""

(* hidden bookkeeping fields stamped on elements *)
external el_set_mock_value : el -> string -> unit = "__mockValue"
  [@@mel.set]

external el_get_mock_value : el -> string option = "__mockValue"
  [@@mel.get] [@@mel.return nullable]

(* the adapter reads this back to keep the Text node in sync — see
   dom_adapter.raw_text_node_get *)
external el_set_swap_text : el -> el -> unit = "__lsText" [@@mel.set]

(* ---------- NodeList ---------- *)

external nl_length : node_list -> int = "length" [@@mel.get]

external nl_item : node_list -> int -> el option = "item" [@@mel.send]
  [@@mel.return nullable]

(* ---------- rects ---------- *)

external rect_left : rect -> float = "left" [@@mel.get]
external rect_top : rect -> float = "top" [@@mel.get]
external rect_right : rect -> float = "right" [@@mel.get]
external rect_bottom : rect -> float = "bottom" [@@mel.get]
external rect_width : rect -> float = "width" [@@mel.get]
external rect_height : rect -> float = "height" [@@mel.get]

(* (left, top, right, bottom, width) tuple for positioning math *)
let bounding_rect_fields el =
  let r = el_bounding_rect el in
  (rect_left r, rect_top r, rect_right r, rect_bottom r, rect_width r)

(* ---------- custom events ---------- *)

external new_custom_event : string -> Js.Json.t -> ev = "CustomEvent"
  [@@mel.new]

(* `new CustomEvent(name, {detail: payload})` dispatched on document —
   the cross-area event bus *)
let dispatch_custom name detail =
  let init = Js.Dict.empty () in
  Js.Dict.set init "detail" detail;
  el_dispatch document_el (new_custom_event name (Js.Json.object_ init))

(* ---------- JS Map ---------- *)

type js_map

external new_js_map : unit -> js_map = "Map" [@@mel.new]
external js_map_has : js_map -> el -> bool = "has" [@@mel.send]
external js_map_set : js_map -> el -> 'a -> unit = "set" [@@mel.send]
external js_map_del : js_map -> el -> unit = "delete" [@@mel.send]

external js_map_each : js_map -> ('a -> el -> unit) -> unit = "forEach"
  [@@mel.send]

(* ---------- mutation observers ---------- *)

external new_observer : (unit -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external new_observer_records :
  (mutation_record array -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external rec_target : mutation_record -> el = "target" [@@mel.get]
external rec_added : mutation_record -> node_list = "addedNodes" [@@mel.get]
external rec_removed : mutation_record -> node_list = "removedNodes"
  [@@mel.get]
external rec_type : mutation_record -> string = "type" [@@mel.get]

external mo_opts : childList:bool -> subtree:bool -> observe_opts = ""
  [@@mel.obj]

external obs_observe : mutation_observer -> el -> observe_opts -> unit
  = "observe" [@@mel.send]

external obs_disconnect : mutation_observer -> unit = "disconnect"
  [@@mel.send]

(* ---------- element sets ---------- *)

external el_set_new : unit -> el_set = "Set" [@@mel.new]
external el_set_has : el_set -> el -> bool = "has" [@@mel.send]
external el_set_add : el_set -> el -> el_set = "add" [@@mel.send]

(* ---------- grapheme segmentation (Intl.Segmenter) ---------- *)

external intl_obj : Js.Json.t = "Intl"

external make_segmenter : string -> Js.Json.t -> segmenter = "Segmenter"
  [@@mel.scope "Intl"] [@@mel.new]

external seg_iter : segmenter -> string -> Js.Json.t = "segment"
  [@@mel.send]

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
      Array.map seg_text (json_array_from it)
  | None -> Array.init (String.length s) (fun i -> String.make 1 s.[i])
;;

(* count grapheme clusters in s[..from-index) — cljs get-graphemes-pos *)
let graphemes_pos s from_index =
  if from_index <= 0 then 0
  else Array.length (split_graphemes (String.sub s 0 from_index))
;;

(* ---------- traversal helpers ---------- *)

let for_each_selector sel f =
  let nl = query_selector_all sel in
  for i = 0 to nl_length nl - 1 do
    match nl_item nl i with Some el -> f el | None -> ()
  done

(* uuid list of .ls-block.selected blocks, in DOM order *)
let selected_block_uuids () =
  query_selector_all_arr ".ls-block.selected"
  |> Array.to_list
  |> List.filter_map (fun el -> el_get_attr el "blockid")

(* first match in a node_list, descending into each element's subtree *)
let nl_find els sel =
  let rec go i n =
    if i >= n then None
    else
      match nl_item els i with
      | Some el when el_matches el sel -> Some el
      | Some el -> (
        match el_query el sel with Some _ as r -> r | None -> go (i + 1) n)
      | None -> go (i + 1) n
  in
  go 0 (nl_length els)

(* elements matching [sel] touched by the mutation roots: each root's
   closest ancestor-or-self match plus its matching descendants. Roots
   are the mutation records' addedNodes — a subtree inserted under an
   already-mounted shell is covered by the ancestor direction. *)
let for_each_touched roots sel f =
  (* a page mount feeds hundreds of per-node roots through each scan;
     the dedup must stay O(1) — an identity-list scan measured ~260ms
     on a 200-block nav *)
  let seen = el_set_new () in
  let emit el =
    if not (el_set_has seen el) then begin
      ignore (el_set_add seen el);
      f el
    end
  in
  List.iter
    (fun root ->
      (match el_closest root sel with Some el -> emit el | None -> ());
      let nl = el_query_all root sel in
      for i = 0 to nl_length nl - 1 do
        match nl_item nl i with Some el -> emit el | None -> ()
      done)
    roots

(* ---------- shared document mutation scan ---------- *)

(* shared document observer: feature installers register one scan each;
   mutation batches coalesce into a single debounced pass that hands each
   scan the added element roots so scans scope their selector work to the
   changed subtrees instead of re-scanning the whole document *)
type doc_scan =
  { ds_run_if : mutation_record array -> bool
  ; ds_scan : el list -> unit
  ; ds_sync : bool (* run in the observer microtask, before paint *)
  }

let doc_scans : doc_scan list ref = ref []
let doc_scan_timer = ref (-1)
let doc_pending_recs : mutation_record list ref = ref []

let roots_of_recs recs =
  Array.fold_left
    (fun acc r ->
      let nl = rec_added r in
      let rec collect i acc =
        if i >= nl_length nl then acc
        else
          collect (i + 1)
            (match nl_item nl i with
             | Some el when el_node_type el = 1 -> el :: acc
             | _ -> acc)
      in
      collect 0 acc)
    [] recs

let doc_flush () =
  doc_scan_timer := -1;
  let recs = Array.of_list (List.rev !doc_pending_recs) in
  doc_pending_recs := [];
  let roots = roots_of_recs recs in
  List.iter
    (fun ds ->
      if (not ds.ds_sync) && ds.ds_run_if recs then ds.ds_scan roots)
    !doc_scans

let doc_observer_installed = ref false

let register_doc_scan ?(run_if = fun _ -> true) ?(sync = false) scan =
  doc_scans :=
    !doc_scans @ [ { ds_run_if = run_if; ds_scan = scan; ds_sync = sync } ];
  scan [ document_element ];
  if not !doc_observer_installed then (
    doc_observer_installed := true;
    let obs =
      new_observer_records (fun recs ->
          (* sync scans run inside the observer microtask — their DOM
             writes must land before the next paint (a 60ms debounce
             leaves e.g. <raw-text> placeholders visibly empty for
             several frames) *)
          List.iter
            (fun ds ->
              if ds.ds_sync && ds.ds_run_if recs then
                ds.ds_scan (roots_of_recs recs))
            !doc_scans;
          doc_pending_recs := Array.to_list recs @ !doc_pending_recs;
          if !doc_scan_timer < 0 then
            doc_scan_timer := set_timeout_id doc_flush 60)
    in
    obs_observe obs document_element (mo_opts ~childList:true ~subtree:true))

(* <raw-text> placeholders carry the intended text in data-raw-text and
   are swapped for real text nodes once they enter the DOM — extension
   create() can only return Elements, so this observer performs the
   swap the adapter cannot.  The swapped node is kept on the placeholder
   as __lsText so later property writes/removals on the (detached)
   placeholder can still reach the live text node. *)
let replace_all_raw_text roots =
  for_each_touched roots "raw-text" (fun el ->
      let tn =
        create_text_node
          (match el_get_attr el "data-raw-text" with
           | Some s -> s
           | None -> "")
      in
      el_set_swap_text el tn;
      el_replace_with el tn)

(* LUI core stamps id="lui-node-<n>" on every registered/extension node
   at create time; cljs emits no such ids, so strip them for DOM parity.
   Ids with a suffix (menu popups, accordion triggers/panels) keep the
   "lui-node-N-*" form and are left alone since LUI core references them. *)
let strip_lui_node_ids roots =
  for_each_touched roots "[id^='lui-node-']" (fun el ->
      match el_get_attr el "id" with
      | Some id ->
          let n = String.length id in
          let rec digits i =
            i >= n || (id.[i] >= '0' && id.[i] <= '9' && digits (i + 1))
          in
          if n > 9 && digits 9 then el_remove_attr el "id"
      | None -> ())

let dom_fixups roots =
  replace_all_raw_text roots;
  strip_lui_node_ids roots

let raw_text_observer_installed = ref false

let ensure_raw_text_observer () =
  if not !raw_text_observer_installed then (
    raw_text_observer_installed := true;
    register_doc_scan ~sync:true dom_fixups)

(* ---------- textarea / caret / selection ---------- *)

(* cljs mock-textarea autosize: collapse then grow to the content height *)
let autosize_textarea el =
  el_set_style_height el "auto";
  el_set_style_height el
    (string_of_int (int_of_float (el_scroll_height el)) ^ "px")

let closest_sel sel target =
  match target with Some el -> el_closest el sel | None -> None

let textarea_of uuid = get_element_by_id ("edit-block-" ^ uuid)

let is_editable_target target =
  match target with
  | Some el ->
      el_tag el = "TEXTAREA" || el_tag el = "INPUT" || el_tag el = "SELECT"
      || el_closest el "[contenteditable='true']" <> None
  | None -> false

(* Focus a text input/textarea and move caret to the end. *)
let el_focus el =
  el_focus el;
  (* input[type=number|date|...] reject setSelectionRange *)
  (try
     let n = String.length (el_value el) in
     el_set_selection_range el n n
   with _ -> ())

(* ---------- mock-text mirror (cljs util/cursor.cljs) ----------
   a hidden .mock-text inside .editor-inner holds one span per grapheme;
   caret pos is read from the span at the grapheme index *)

(* cljs cursor.cljs build-mock-text!: one span per grapheme ("\n" -> "0"
   + <br>), ids mock-text_<i>, rebuilt only when the value changed *)
let build_mock_text input el =
  let v = el_value input ^ "0" in
  let cached = Option.value (el_get_mock_value el) ~default:"" in
  if cached <> v then (
    el_set_text_content el "";
    Array.iteri
      (fun i g ->
        let s = create_element "span" in
        el_set_id s ("mock-text_" ^ string_of_int i);
        if g = "\n" then (
          el_set_text_content s "0";
          el_append_child s (create_element "br"))
        else el_set_text_content s g;
        el_append_child el s)
      (split_graphemes v);
    el_set_mock_value el v)
;;

(* the .mock-text mirror sibling of `input` inside .editor-inner *)
let mock_text_el input =
  match el_closest input ".editor-inner" with
  | Some inner -> el_query inner ".mock-text"
  | None -> None
;;

(* cljs cursor.cljs get-caret-pos -> editor.cljs popup pos:
   left = mirror-span offsetLeft + input.left - 20
   top  = mirror-span offsetTop  + input.top  + (lineHeight - 4 | 20)
   also returns the caret line top so flip-above math can anchor on it *)
let caret_popup_pos el =
  let r = el_bounding_rect el in
  let lh =
    let f = parse_float (computed_style_str el "lineHeight") in
    if Float.is_nan f then 20.0 else f -. 4.0
  in
  let l, t =
    match mock_text_el el with
    | Some m ->
        build_mock_text el m;
        let gpos = graphemes_pos (el_value el) (el_selection_start el) in
        (match nl_item (el_children m) gpos with
         | Some s -> (el_offset_left s, el_offset_top s)
         | None -> (0., 0.))
    | None -> (0., 0.)
  in
  (l +. rect_left r -. 20., t +. rect_top r +. lh, t +. rect_top r)

(* cljs ui.cljs auto-complete-keep-visible-scroll-top: scroll exactly
   enough to keep the row inside the viewport (no padding); when the row
   starts a group, the .ui__ac-group-name above it counts toward its top
   so arrowing back reveals the label *)
let scroll_row_into_view ~scroller ~row =
  let st = el_scroll_top scroller in
  let vh = el_client_height scroller in
  let s_top = rect_top (el_bounding_rect scroller) in
  let heading =
    match Option.bind (el_parent row) el_previous_sibling with
    | Some el when el_matches el ".ui__ac-group-name" -> Some el
    | _ -> None
  in
  let item_top =
    st
    +. (rect_top
          (el_bounding_rect (match heading with Some h -> h | None -> row))
       -. s_top)
  in
  let item_bottom = st +. (rect_bottom (el_bounding_rect row) -. s_top) in
  if item_top < st then el_set_scroll_top scroller (Float.max 0.0 item_top)
  else if item_bottom > st +. vh then
    el_set_scroll_top scroller (Float.max 0.0 (item_bottom -. vh))

(* ---------- imperative builders ---------- *)

(* build element: tag, class, attrs, optional text/click/children *)
let h ?(tag = "div") ?(cls = "") ?(attrs = []) ?text ?title_ ?on_click
    ?on_input ?on_keydown ?on_mousedown ?children () : el =
  let el = create_element tag in
  if cls <> "" then el_set_class el cls;
  List.iter (fun (k, v) -> el_set_attr el k v) attrs;
  (match title_ with
  | Some t -> el_set_attr el "title" t
  | None -> ());
  (match text with Some t -> el_set_text_content el t | None -> ());
  (match on_click with
  | Some f -> el_on el "click" (fun ev -> f ev)
  | None -> ());
  (match on_input with
  | Some f -> el_on el "input" (fun ev -> f ev)
  | None -> ());
  (match on_keydown with
  | Some f -> el_on el "keydown" (fun ev -> f ev)
  | None -> ());
  (match on_mousedown with
  | Some f -> el_on el "mousedown" (fun ev -> f ev)
  | None -> ());
  (match children with
  | Some cs -> List.iter (el_append_child el) cs
  | None -> ());
  el

let append_all parent els = List.iter (el_append_child parent) els

let mk ?(cls = "") ?(attrs = []) tag =
  let el = create_element tag in
  if cls <> "" then el_set_class el cls;
  List.iter (fun (k, v) -> el_set_attr el k v) attrs;
  el

let child_text tag cls txt parent =
  let el = mk ~cls tag in
  el_set_text_content el txt;
  el_append_child parent el;
  el

(* click listener with capture + preventDefault (popup/menu items) *)
let on_click el f =
  el_listen el "click" (fun ev -> ev_prevent_default ev; f ev) true

(* ---------- class strings (cljs shui cn / button variants) ---------- *)

(* shui/button rendered classes (deps/shui components.cljs) *)
let button_base_cls = "ui__button"

(* cljs shui cn (deps/shui components.cljs): a small tailwind-merge —
   only height/width/padding utilities conflict; later wins unless the
   earlier match is marked important (!). Returns (variant-prefix ^ group,
   important?). *)
let variant_split_index s =
  let n = String.length s in
  let rec go i depth idx =
    if i >= n then idx
    else
      let c = s.[i] in
      if c = '[' then go (i + 1) (depth + 1) idx
      else if c = ']' then go (i + 1) (max 0 (depth - 1)) idx
      else if c = ':' && depth = 0 then go (i + 1) depth (Some i)
      else go (i + 1) depth idx
  in
  go 0 0 None

let utility_groups =
  [ ("min-h-", "min-h"); ("max-h-", "max-h"); ("h-", "h")
  ; ("min-w-", "min-w"); ("max-w-", "max-w"); ("w-", "w")
  ; ("px-", "px"); ("py-", "py"); ("pt-", "pt"); ("pr-", "pr")
  ; ("pb-", "pb"); ("pl-", "pl"); ("p-", "p") ]

let utility_conflict s =
  let vp, u =
    match variant_split_index s with
    | Some i ->
        ( String.sub s 0 (i + 1)
        , String.sub s (i + 1) (String.length s - i - 1) )
    | None -> ("", s)
  in
  let imp = String.length u > 0 && u.[0] = '!' in
  let u = if imp then String.sub u 1 (String.length u - 1) else u in
  let u =
    if String.length u > 0 && u.[0] = '-' then
      String.sub u 1 (String.length u - 1)
    else u
  in
  match
    List.find_opt
      (fun (p, _) ->
        String.length u > String.length p
        && String.sub u 0 (String.length p) = p)
      utility_groups
  with
  | Some (_, g) -> Some (vp ^ g, imp)
  | None -> None

let merge_classes toks =
  let classes = ref [] in
  let indexes = Hashtbl.create 16 and important = Hashtbl.create 8 in
  List.iteri
    (fun _ tok ->
      match utility_conflict tok with
      | Some (key, imp) -> (
          match Hashtbl.find_opt indexes key with
          | Some i ->
              if not (Hashtbl.find important key && not imp) then (
                classes :=
                  List.mapi (fun j c -> if j = i then "" else c) !classes
                  @ [ tok ];
                Hashtbl.replace indexes key (List.length !classes - 1);
                Hashtbl.replace important key imp)
          | None ->
              classes := !classes @ [ tok ];
              Hashtbl.add indexes key (List.length !classes - 1);
              Hashtbl.add important key imp)
      | None -> classes := !classes @ [ tok ])
    toks;
  !classes

let cn parts =
  parts
  |> List.concat_map
       (fun s ->
         List.filter (fun t -> t <> "") (String.split_on_char ' ' s))
  |> merge_classes
  |> List.filter (fun t -> t <> "")
  |> String.concat " "

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
  cn [ button_base_cls; v; s; cls ]

(* ---------- icon elements ---------- *)

(* imperative twin of Icons.icon: span.ui__icon.ti.ls-icon-<name> holding
   svg.tabler-icon.tabler-icon-<name> built from Icon_tabler_data; font
   glyph only when no svg data exists *)
let svg_ns_el tag = create_element_ns "http://www.w3.org/2000/svg" tag

let tabler_svg_el ?(size = 18.) name : el option =
  let n = Icons.kebab name in
  match Icon_tabler_data.tabler_children n with
  | [] -> None
  | kids ->
      let svg = svg_ns_el "svg" in
      List.iter
        (fun (k, v) -> el_set_attr svg k v)
        (Icons.tabler_svg_attrs ~size ~filled:(Icons.is_filled n) n " ");
      List.iter
        (fun (tag, attrs) ->
          let k = svg_ns_el tag in
          List.iter (fun (a, v) -> el_set_attr k a v) attrs;
          el_append_child svg k)
        kids;
      Some svg

external tabler_icons : Js.Json.t Js.Dict.t Js.Undefined.t = "tablerIcons"
  [@@mel.scope "window"]

let icon_attr_name k =
  match k with
  | "className" -> "class"
  | "viewBox" -> "viewBox"
  | _ ->
    let b = Buffer.create (String.length k + 2) in
    String.iter
      (fun c ->
        if c >= 'A' && c <= 'Z' then begin
          Buffer.add_char b '-';
          Buffer.add_char b (Char.lowercase_ascii c)
        end
        else Buffer.add_char b c)
      k;
    Buffer.contents b

let json_num_str n =
  let i = int_of_float n in
  if n = float_of_int i then string_of_int i else string_of_float n

(* tabler.ext.js factories return react-element-shaped objects
   ({type, props:{children}}) produced by the ReactJSXRuntime shim in
   index.html — convert them to real DOM elements *)
let rec append_icon_child parent (v : Js.Json.t) : unit =
  match Js.Json.classify v with
  | Js.Json.JSONObject _ -> (
    match dom_of_react_el v with
    | Some el -> el_append_child parent el
    | None -> ())
  | Js.Json.JSONArray items -> Array.iter (append_icon_child parent) items
  | _ -> ()

and dom_of_react_el (v : Js.Json.t) : el option =
  match Js.Json.classify v with
  | Js.Json.JSONObject o -> (
    match Js.Dict.get o "type" with
    | Some ty -> (
      match Js.Json.decodeString ty with
      | None -> None
      | Some tag ->
        let el = svg_ns_el tag in
        (match Js.Dict.get o "props" with
         | Some p -> (
           match Js.Json.decodeObject p with
           | None -> ()
           | Some props ->
             Array.iter
               (fun (k, pv) ->
                 if k <> "children" then
                   match Js.Json.classify pv with
                   | Js.Json.JSONString s ->
                     el_set_attr el (icon_attr_name k) s
                   | Js.Json.JSONNumber n ->
                     el_set_attr el (icon_attr_name k) (json_num_str n)
                   | Js.Json.JSONTrue ->
                     el_set_attr el (icon_attr_name k) ""
                   | _ -> ())
               (Js.Dict.entries props);
             append_icon_child el
               (match Js.Dict.get props "children" with
                | Some ch -> ch
                | None -> Js.Json.null))
         | None -> ());
        Some el)
    | None -> None)
  | _ -> None

(* window.tablerIcons.Icon<name> — custom Logseq icons (Backlog, priorityLvl*,
   InProgress50...) that have no tabler font glyph *)
let tabler_icon_el name : el option =
  match Js.Undefined.toOption tabler_icons with
  | Some icons -> (
    match Js.Dict.get icons ("Icon" ^ String.capitalize_ascii name) with
    | Some ctor ->
      let props =
        Js.Json.object_ (Js.Dict.fromList [ ("size", Js.Json.number 18.) ])
      in
      dom_of_react_el (js_call ctor js_undefined props)
    | None -> None)
  | None -> None

(* <span class="ui__icon ti ls-icon-{name}">…</span> matches shui icon markup;
   cljs prefers window.tablerIcons (custom ext icons), then the
   @tabler/icons-react svg, then the font glyph *)
let icon ?(size = 18.) ?(cls = "") name =
  let span = create_element "span" in
  el_set_class span
    ("ui__icon ti ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls);
  (match tabler_icon_el name with
   | Some el -> el_append_child span el
   | None -> (
     match tabler_svg_el ~size name with
     | Some svg -> el_append_child span svg
     | None ->
       let i = create_element "i" in
       let prefix =
         if List.mem (Icons.kebab name) Icons.tie_names then "tie tie-"
         else "ti ti-"
       in
       el_set_class i (prefix ^ name);
       el_append_child span i));
  span

(* ---------- files / blobs / downloads ---------- *)

(* el.files is a FileList (nullable on non-inputs) — flatten to an array *)
let el_files : el -> Js.Json.t array =
  [%mel.raw "function (el) { return Array.from(el.files || []) }"]

external file_name : Js.Json.t -> string = "name" [@@mel.get]
external file_size : Js.Json.t -> float = "size" [@@mel.get]

external file_text : Js.Json.t -> string Js.Promise.t = "text"
  [@@mel.send]

external file_buffer :
  Js.Json.t -> Js.Typed_array.ArrayBuffer.t Js.Promise.t = "arrayBuffer"
  [@@mel.send]

external make_blob :
  Js.Typed_array.Uint8Array.t array -> Js.Json.t -> Webapi.Blob.t =
  "Blob" [@@mel.new]

external create_object_url : Webapi.Blob.t -> string = "createObjectURL"
  [@@mel.scope "URL"]

external revoke_object_url : string -> unit = "revokeObjectURL"
  [@@mel.scope "URL"]

let u8_of_buffer buf =
  let u8 = Js.Typed_array.Uint8Array.fromBuffer buf () in
  let n = Js.Typed_array.Uint8Array.length u8 in
  let out = Bytes.create n in
  for i = 0 to n - 1 do
    Bytes.set out i
      (Char.chr (Js.Typed_array.Uint8Array.unsafe_get u8 i land 0xff))
  done;
  Bytes.unsafe_to_string out

let u8_to_bytes u8 =
  let n = Js.Typed_array.Uint8Array.length u8 in
  let out = Bytes.create n in
  for i = 0 to n - 1 do
    Bytes.set out i
      (Char.chr (Js.Typed_array.Uint8Array.unsafe_get u8 i land 0xff))
  done;
  out

let binary_to_u8 s =
  let u8 = Js.Typed_array.Uint8Array.fromLength (String.length s) in
  String.iteri
    (fun i c -> Js.Typed_array.Uint8Array.unsafe_set u8 i (Char.code c))
    s;
  u8

let download_blob ~filename ~mime payload_u8 =
  let blob =
    make_blob [| payload_u8 |]
      (json_props [ ("type", Js.Json.string mime) ])
  in
  let url = create_object_url blob in
  let a = create_element "a" in
  el_set_attr a "href" url;
  el_set_attr a "download" filename;
  (match query_selector "body" with
   | Some b -> el_append_child b a
   | None -> ());
  el_click a;
  later ~ms:0 (fun () ->
      el_remove a;
      revoke_object_url url)

let download_binary ~filename ~mime payload =
  download_blob ~filename ~mime (binary_to_u8 payload)

let download_text ~filename ~mime text =
  download_binary ~filename ~mime text

(* ---------- File System Access (cljs auto-backup) ---------- *)

type dir_handle

type file_handle

type writable_

external show_dir_picker : Js.Json.t -> dir_handle Js.Promise.t =
  "showDirectoryPicker" [@@mel.scope "window"]

let picker_supported : unit -> bool =
  [%mel.raw
    "function () { return typeof window.showDirectoryPicker === \
     'function' }"]

external h_name : dir_handle -> string = "name" [@@mel.get]

external get_dir :
  dir_handle -> string -> Js.Json.t -> dir_handle Js.Promise.t =
  "getDirectoryHandle" [@@mel.send]

external get_file :
  dir_handle -> string -> Js.Json.t -> file_handle Js.Promise.t =
  "getFileHandle" [@@mel.send]

external fh_get_file : file_handle -> Js.Json.t Js.Promise.t =
  "getFile" [@@mel.send]

external fh_move :
  file_handle -> dir_handle -> string -> unit Js.Promise.t = "move"
  [@@mel.send]

external fh_writable : file_handle -> writable_ Js.Promise.t =
  "createWritable" [@@mel.send]

external w_write :
  writable_ -> Js.Typed_array.Uint8Array.t -> unit Js.Promise.t =
  "write" [@@mel.send]

external w_close : writable_ -> unit Js.Promise.t = "close" [@@mel.send]

external set_interval : (unit -> unit) -> int -> int =
  "setInterval" [@@mel.scope "window"]

external clear_interval : int -> unit = "clearInterval"
  [@@mel.scope "window"]

let truncate_old_versions : dir_handle -> unit Js.Promise.t =
  [%mel.raw
    "async function (dir) { const names = []; for await (const e of \
     dir.values()) if (e.kind === 'file') names.push(e.name); for \
     (const n of names.sort().reverse().slice(12)) await \
     dir.removeEntry(n); }"]

let decode_u8 : Js.Typed_array.Uint8Array.t -> string Js.Promise.t =
  [%mel.raw
    "async function (u8) { return new TextDecoder().decode(u8) }"]

let str_to_u8 (s : string) =
  let u8 = Js.Typed_array.Uint8Array.fromLength (String.length s) in
  String.iteri
    (fun i c -> Js.Typed_array.Uint8Array.unsafe_set u8 i (Char.code c))
    s;
  u8
