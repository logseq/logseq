(* Native twin of src/core/web_dom.ml — the unified DOM FFI surface the
   shared src modules use, backed by the imperative-DOM shims
   (dom_ext / editor_dom / properties_dom / views_dom / browser_ui)
   instead of browser externals. Keep identifiers in sync with
   src/core/web_dom.ml. *)

type el = Editor_dom.el
type ev = Editor_dom.ev
type node_list = Editor_dom.node_list
type rect = Editor_dom.rect
type clipboard_data = Editor_dom.clipboard_data
type mutation_observer = Editor_dom.mutation_observer

(* ---------- json object access ---------- *)

let js_get j k = Dom_ext.prop k j

(* ---------- document / window ---------- *)

let get_element_by_id = Editor_dom.get_element_by_id
let query_selector = Editor_dom.query_selector
let doc_query = Dom_ext.doc_query_selector
let document_element = Editor_dom.document_element
let document_body = Views_dom.document_body
let document_el = Dom_ext.document_el
let document_visible = Platform.document_visible
let add_document_listener = Dom_ext.add_document_listener
let on_document_event = Platform.on_document_event
let add_window_listener = Platform.add_event_listener

let doc_set_lang = Platform.document_set_lang
let doc_set_data = Platform.document_set_data
let body_set_data = Platform.body_set_data
let body_rm_data = Platform.body_rm_data
let doc_add_class = Platform.root_add_class
let doc_rm_class = Platform.root_rm_class
let body_add_class = Platform.body_add_class
let body_rm_class = Platform.body_rm_class

let dispatch_custom = Dom_ext.dispatch_custom
(* web exposes these as `float` externals re-read per access; the apple
   host window size is fixed per launch, so one snapshot is fine *)
let win_inner_width = Dom_ext.window_inner_width ()
let win_inner_height = Dom_ext.window_inner_height ()
let win_confirm = Browser_ui.confirm
let win_open = Browser_ui.open_url
let prefers_dark = Browser_ui.prefers_dark
let json_props = Browser_ui.json_props

(* ---------- elements ---------- *)

let create_element = Editor_dom.create_element
let create_text_node = Editor_dom.create_text_node
let el_get_attr = Editor_dom.el_get_attr
let el_has_attr = Editor_dom.el_has_attr
let el_set_attr = Editor_dom.el_set_attr
let el_remove_attr = Editor_dom.el_remove_attr
let el_append_child = Editor_dom.el_append_child
let el_insert_before = Views_dom.el_insert_before
let el_insert_adjacent = Properties_dom.el_insert_adjacent
let el_insert_adjacent_text = Views_dom.el_insert_adjacent_text
let el_replace_children = Views_dom.el_replace_children
let el_contains = Editor_dom.el_contains
let el_parent = Views_dom.el_parent
let el_children = Views_dom.el_children
let el_is_connected = Views_dom.el_is_connected
let el_remove = Dom_ext.el_remove
let el_matches = Properties_dom.el_matches
let el_closest = Editor_dom.el_closest
let closest_sel = Editor_dom.closest_sel
let el_query = Editor_dom.el_query
let el_query_all = Editor_dom.el_query_all
let el_id = Editor_dom.el_id
let el_dom_id = Editor_dom.el_dom_id
let el_tag = Editor_dom.el_tag
let el_focus = Editor_dom.el_focus
let focus_dom_id = Editor_dom.focus_dom_id
let el_blur = Views_dom.el_blur
let el_click = Views_dom.el_click
let el_select_text = Properties_dom.el_select_text
let el_scroll_into_view = Editor_dom.el_scroll_into_view
let scroll_row_into_view = Dom_ext.scroll_row_into_view
let el_scroll_height = Views_dom.el_scroll_height
let el_scroll_top = Views_dom.el_scroll_top
let el_class_add = Editor_dom.el_class_add
let el_class_remove = Editor_dom.el_class_remove
let el_set_class = Editor_dom.el_set_class
let el_set_text_content = Editor_dom.el_set_text_content
let el_text_content = Views_dom.el_text_content
let el_set_inner_html = Views_dom.el_inner_html_set
let el_set_checked = Views_dom.el_set_checked
let el_value = Editor_dom.el_value
let el_set_value = Editor_dom.el_set_value
let el_selection_start = Editor_dom.el_selection_start
let el_selection_end = Editor_dom.el_selection_end
let el_set_selection_range = Editor_dom.el_set_selection_range
let autosize_textarea = Editor_dom.autosize_textarea
let textarea_of = Editor_dom.textarea_of
let is_editable_target = Editor_dom.is_editable_target
let active_element = Editor_dom.active_element
let el_style_set_property = Dom_ext.style_set_property
let el_bounding_rect = Dom_ext.bounding_rect
let el_listen = Properties_dom.el_listen
let el_on el name f = el_listen el name f false

let el_on_once el name f =
  let done_ = ref false in
  el_on el name (fun ev -> if not !done_ then ( done_ := true; f ev ))

(* a file input change event — native has no DOM file inputs (uploads
   go through the host picker), so the list is always empty *)
let el_files (_el : el) : Js.Json.t array = [||]

(* ---------- geometry ---------- *)

let rect_left = Dom_ext.rect_left
let rect_top = Dom_ext.rect_top
let rect_right = Dom_ext.rect_right
let rect_bottom = Dom_ext.rect_bottom
let rect_width = Dom_ext.rect_width
let rect_height = Dom_ext.rect_height

let bounding_rect_fields el =
  let r = el_bounding_rect el in
  (rect_left r, rect_top r, rect_right r, rect_bottom r, rect_width r)

let caret_popup_pos = Dom_ext.caret_popup_pos

let nl_length = Editor_dom.node_list_length
let nl_item = Editor_dom.node_list_item

(* imperative construction/helpers — shared code's imperative sections
   (properties select/popup) use these over the same Js.Json.t elements *)
let mk = Properties_dom.mk
let child_text = Properties_dom.child_text
let set_style = Properties_dom.set_style
let on_click = Properties_dom.on_click
let find = Properties_dom.find
let focus_end = Properties_dom.focus_end

let icon ?(size = 18.) ?(cls = "") name =
  let span = create_element "span" in
  el_set_class span
    ("ui__icon ti ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls);
  (match Editor_dom.tabler_svg_el ~size name with
   | Some svg -> el_append_child span svg
   | None ->
       let i = create_element "i" in
       let prefix =
         if List.mem (Icons.kebab name) Icons.tie_names then "tie tie-"
         else "ti ti-"
       in
       el_set_class i (prefix ^ name);
       el_append_child span i);
  span

(* imperative element builder + class helpers *)
let h = Views_dom.h

let append_all parent els = List.iter (el_append_child parent) els

let button_cls = Views_dom.button_cls
let el_inner_html = Properties_dom.el_inner_html
let el_checked = Views_dom.el_checked

(* ---------- events ---------- *)

let ev_key = Editor_dom.ev_key
let ev_target = Editor_dom.ev_target
let ev_buttons = Editor_dom.ev_buttons
let ev_button = Views_dom.ev_button
let ev_which = Editor_dom.ev_which
let ev_key_code (_e : ev) = 0
let ev_meta = Editor_dom.ev_meta
let ev_ctrl = Editor_dom.ev_ctrl
let ev_alt = Editor_dom.ev_alt
let ev_shift = Editor_dom.ev_shift
let ev_composing = Editor_dom.ev_composing
let ev_detail = Editor_dom.ev_detail
let ev_client_x = Dom_ext.client_x
let ev_client_y = Dom_ext.client_y
let ev_input_type = Dom_ext.input_type
let ev_movement_x = Dom_ext.movement_x
let ev_movement_y = Dom_ext.movement_y
let ev_prevent_default = Editor_dom.prevent_default
let ev_stop_propagation = Editor_dom.stop_propagation
let ev_stop_immediate = Dom_ext.stop_immediate_propagation
let ev_clipboard = Editor_dom.ev_clipboard
let ev_data_transfer = Editor_dom.ev_data_transfer
let dt_files = Editor_dom.dt_files

(* ---------- clipboard data ---------- *)

let cd_get_data = Editor_dom.clipboard_get_text
let cd_set_data = Editor_dom.clipboard_set_text
let cd_files = Editor_dom.clipboard_files
let clipboard_set_text = Editor_dom.clipboard_set_text
let clipboard_get_text = Editor_dom.clipboard_get_text

(* ---------- timing ---------- *)

let set_timeout = Editor_dom.set_timeout
let set_timeout_id = Editor_dom.set_timeout_id
let clear_timeout = Editor_dom.clear_timeout
let debounce = Editor_dom.debounce
let later = Browser_ui.later
let now_ms = Platform.date_now_ms

(* ---------- selection / misc ---------- *)

let selected_block_uuids = Platform.selected_block_uuids
let ensure_raw_text_observer = Editor_dom.ensure_raw_text_observer
let for_each_touched = Editor_dom.for_each_touched
let run_doc_scans = Editor_dom.run_doc_scans
let register_doc_scan ?run_if ?sync f =
  Editor_dom.register_doc_scan ?run_if ?sync f
let svg_ns_el = Editor_dom.svg_ns_el
let tabler_svg_el = Editor_dom.tabler_svg_el

(* ---------- files / blobs ---------- *)

let make_blob = Browser_ui.make_blob
let file_text = Browser_ui.file_text
let file_buffer = Browser_ui.file_buffer
let file_name = Browser_ui.file_name
let file_size = Browser_ui.file_size
let u8_of_buffer = Browser_ui.u8_of_buffer
let binary_to_u8 = Browser_ui.binary_to_u8
let download_text = Browser_ui.download_text
let download_binary = Browser_ui.download_binary

(* ---------- File System Access — unsupported on apple ---------- *)

type dir_handle = Js.Json.t
type file_handle = Js.Json.t
type writable_ = Js.Json.t

let picker_supported () = false
let show_dir_picker _ = failwith "fs-access: not supported on apple"
let h_name _ = failwith "fs-access"
let get_dir _ _ _ = failwith "fs-access"
let get_file _ _ _ = failwith "fs-access"
let fh_get_file _ = failwith "fs-access"
let fh_move _ _ _ = failwith "fs-access"
let fh_writable _ = failwith "fs-access"
let w_write _ _ = failwith "fs-access"
let w_close _ = failwith "fs-access"
let set_interval (_ : unit -> unit) (_ : int) : int = 0
let clear_interval (_ : int) : unit = ()
let truncate_old_versions _ = failwith "fs-access"
let decode_u8 _ = failwith "fs-access"
let str_to_u8 (_ : string) = Js.Typed_array.Uint8Array.fromLength 0
