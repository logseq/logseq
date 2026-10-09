type storage = {
  get : string -> string option;
  set : string -> string -> unit;
  remove : string -> unit;
}

(* Semantic theme service. Preference persistence keeps the existing raw
   storage format (cljs-quoted values under "system-theme?"/"theme") —
   callers pass and receive plain semantic values like "dark". *)
type theme = {
  mode : unit -> string;
  system_default : unit -> bool;
  prefers_dark : unit -> bool;
  set_system_pref : bool -> unit;
  set_theme_pref : string -> unit;
  apply_dataset : string -> unit;
  apply_classes : string -> unit;
}

type nav = {
  hash : unit -> string;
  set_hash : string -> unit;
  replace_hash : string -> unit;
  back : unit -> unit;
  forward : unit -> unit;
  on_change : (unit -> unit) -> unit;
  on_navigate : (unit -> unit) -> unit;
  search : unit -> string;
  query_param : string -> string option;
  hash_query_param : string -> string option;
  decode_uri : string -> string;
  reload : unit -> unit;
  (* Absolute-URL fields for share/link construction; "" where the host
     has no public origin (native apps). *)
  origin : unit -> string;
  pathname : unit -> string;
}

type doc = {
  set_lang : string -> unit;
  preferred_lang : unit -> string;
  set_lang_pref : string -> unit;
  set_data : string -> string -> unit;
  rm_data : string -> unit;
  set_title : string -> unit;
  reload : unit -> unit;
}

type date_fields = {
  year : int;
  month : int;
  day : int;
  wday : int;
  hours : int;
  minutes : int;
  seconds : int;
  ms : int;
}

type time = {
  now : unit -> float;
  local_fields : float -> date_fields;
  of_fields : date_fields -> float;
  parse : string -> float option;
  fmt_date : float -> string;
}

(* Host log channel — values pass through uninterpreted. *)
type log = {
  error : 'a. 'a -> unit;
  info : 'a. 'a -> unit;
}

type perf = { mark : string -> unit }

type uri = { encode_component : string -> string }

type clipboard = {
  copy : string -> unit;
  write_text : string -> unit Ui_task.t;
  read_text : unit -> string Ui_task.t;
}

type session = {
  get : string -> string option;
  set : string -> string -> unit;
}

type edit_units = [ `U16 | `Bytes ]

type env = {
  publishing : unit -> bool;
  dev_build : unit -> bool;
  rtc_test_mode : unit -> bool;
  online : unit -> bool;
  is_mac : unit -> bool;
  native_drag : unit -> bool;
  native_block_controls : unit -> bool;
  css_transform_icons : unit -> bool;
  edit_units : unit -> edit_units;
  random_uuid : unit -> string;
  open_url : string -> unit;
}

type timers = {
  timeout : (unit -> unit) -> int -> int;
  clear_timeout : int -> unit;
  interval : (unit -> unit) -> int -> int;
  clear_interval : int -> unit;
  debounce : int -> (unit -> unit) -> unit;
  later : ms:int -> (unit -> unit) -> unit;
}

type file = {
  file_name : string;
  file_size : float;
  file_text : unit -> string Ui_task.t;
  file_binary : unit -> string Ui_task.t;
}

type fs_dir = {
  dir_id : int;
  (* Host-assigned handle — relates the dir record to the impl's own
     host handle table (fh_move needs the destination's raw handle). *)
  dir_name : string;
  get_dir : string -> fs_dir Ui_task.t;
  get_file : string -> fs_file Ui_task.t;
  truncate_old_versions : unit -> unit Ui_task.t;
}

and fs_file = {
  fh_file : unit -> file Ui_task.t;
  fh_move : fs_dir -> string -> unit Ui_task.t;
  fh_writable : unit -> fs_writable Ui_task.t;
}

and fs_writable = {
  w_write : string -> unit Ui_task.t;
  w_close : unit -> unit Ui_task.t;
}

type files = {
  pick_files :
       ?accept:string
    -> ?multiple:bool
    -> ?directory:bool
    -> (file list -> unit)
    -> unit;
  download_text : filename:string -> mime:string -> string -> unit;
  download_binary : filename:string -> mime:string -> string -> unit;
  inflate_raw : string -> string Ui_task.t;
  dir_picker_supported : unit -> bool;
  show_dir_picker : unit -> fs_dir Ui_task.t;
}

(* Typed host-DOM boundary (folded from the temporary Ui_dom contract). *)
type el = {
  token : int;
  (* The host's own element payload — opaque to shared code; only the
     impl that constructed the el may read it (contains, data_transfer
     plumbing). *)
  closest : string -> el option;
  attr : string -> string option;
  rect : unit -> float * float * float * float;
  set_style : string -> string -> unit;
  add_class : string -> unit;
  remove_class : string -> unit;
  offset_width : unit -> float;
  focus : unit -> unit;
  select_text : unit -> unit;
  set_selection_range : int -> int -> unit;
  set_attr : string -> string -> unit;
  rm_attr : string -> unit;
  value : unit -> string;
  set_value : string -> unit;
  set_text : string -> unit;
  checked : unit -> bool;
  set_checked : bool -> unit;
  contains : el -> bool;
  connected : unit -> bool;
  click : unit -> unit;
  scroll_into_view : unit -> unit;
  scroll_into_view_nearest : unit -> unit;
  scroll_top : unit -> float;
  set_scroll_top : float -> unit;
  scroll_height : unit -> float;
  client_height : unit -> float;
  id : unit -> string;
  tag : unit -> string;
  editable : unit -> bool;
  query : string -> el option;
  query_all : string -> el list;
  files : unit -> file list;
  style_prop : string -> string;
}

type ev = {
  x : float;
  y : float;
  shift : bool;
  meta : bool;
  ctrl : bool;
  alt : bool;
  composing : bool;
  key : string option;
  buttons : int;
  button : int;
  repeat : bool;
  movement_x : float;
  movement_y : float;
  default_prevented : bool;
  target : el option;
  touches : (float * float) list;
  detail : string -> string option;
  (* raw CustomEvent detail field as portable Json — [detail] only
     covers string fields; numbers/bools/objects need this *)
  detail_json : string -> Json.t option;
  clipboard_get : string -> string;
  clipboard_set : string -> string -> unit;
  data_transfer_get : string -> string;
  files : file list;
  prevent_default : unit -> unit;
  stop_propagation : unit -> unit;
  stop_immediate : unit -> unit;
}

type dom = {
  on_document_event : ?capture:bool -> string -> (ev -> unit) -> unit;
  on_window_event : string -> (ev -> unit) -> unit;
  query : string -> el option;
  query_all : string -> el list;
  by_id : string -> el option;
  active_element : unit -> el option;
  element_at : float -> float -> el option;
  doc_root : unit -> el;
  body : unit -> el;
  viewport_width : unit -> float;
  viewport_height : unit -> float;
  document_visible : unit -> bool;
  dispatch : string -> unit;
  dispatch_json : string -> Json.t -> unit;
  emit_json : string -> string -> unit;
  open_dialog : string -> unit;
  confirm : string -> bool;
  scroll_row_into_view : scroller:el -> row:el -> unit;
  ensure_fixups : unit -> unit;
  apply_left_sidebar_width : int -> unit;
  selected_block_uuids : unit -> string list;
}

type t = {
  storage : storage;
  literal_text : string -> string;
  request_flush : unit -> unit;
  assert_owner : unit -> unit;
  theme : theme;
  nav : nav;
  doc : doc;
  time : time;
  log : log;
  perf : perf;
  uri : uri;
  clipboard : clipboard;
  session : session;
  env : env;
  dom : dom;
  timers : timers;
  files : files;
}

val install : t -> unit
val get : unit -> t

val storage_get : string -> string option
val storage_set : string -> string -> unit
val storage_remove : string -> unit
val storage_unquote : string -> string
val storage_quote : string -> string

val literal_text : string -> string
val request_flush : unit -> unit

val theme_mode : unit -> string
val theme_system_default : unit -> bool
val theme_prefers_dark : unit -> bool
val theme_set_system_pref : bool -> unit
val theme_set_pref : string -> unit
val theme_apply_dataset : string -> unit
val theme_apply_classes : string -> unit

val nav_hash : unit -> string
val nav_set_hash : string -> unit
val nav_replace_hash : string -> unit
val nav_back : unit -> unit
val nav_forward : unit -> unit
val nav_on_change : (unit -> unit) -> unit
val nav_on_navigate : (unit -> unit) -> unit
val nav_search : unit -> string
val nav_query_param : string -> string option
val nav_hash_query_param : string -> string option
val nav_decode_uri : string -> string
val nav_reload : unit -> unit
val nav_origin : unit -> string
val nav_pathname : unit -> string

val doc_set_lang : string -> unit
val doc_preferred_lang : unit -> string
val doc_set_lang_pref : string -> unit
val doc_set_data : string -> string -> unit
val doc_rm_data : string -> unit
val doc_set_title : string -> unit
val doc_reload : unit -> unit

val time_now : unit -> float
val time_local_fields : float -> date_fields
val time_of_fields : date_fields -> float
val time_parse : string -> float option
val time_fmt_date : float -> string

val log_error : 'a -> unit
val log_info : 'a -> unit
val perf_mark : string -> unit
val uri_encode_component : string -> string
val clipboard_copy : string -> unit
val clipboard_write_text : string -> unit Ui_task.t
val clipboard_read_text : unit -> string Ui_task.t
val session_get : string -> string option
val session_set : string -> string -> unit

val env_publishing : unit -> bool
val env_dev_build : unit -> bool
val env_rtc_test_mode : unit -> bool
val env_online : unit -> bool
val env_is_mac : unit -> bool
val env_native_drag : unit -> bool
val env_native_block_controls : unit -> bool
val env_css_transform_icons : unit -> bool
val env_edit_units : unit -> edit_units
val env_random_uuid : unit -> string
val env_open_url : string -> unit

val dom_on_document_event : ?capture:bool -> string -> (ev -> unit) -> unit
val dom_on_window_event : string -> (ev -> unit) -> unit
val dom_query : string -> el option
val dom_query_all : string -> el list
val dom_by_id : string -> el option
val dom_active_element : unit -> el option
val dom_element_at : float -> float -> el option
val dom_root : unit -> el
val dom_body : unit -> el
val dom_viewport_width : unit -> float
val dom_viewport_height : unit -> float
val dom_document_visible : unit -> bool
val dom_dispatch : string -> unit
val dom_dispatch_json : string -> Json.t -> unit
val dom_emit_json : string -> string -> unit
val dom_open_dialog : string -> unit
val dom_confirm : string -> bool
val dom_scroll_row_into_view : scroller:el -> row:el -> unit
val dom_ensure_fixups : unit -> unit
val dom_apply_left_sidebar_width : int -> unit
val dom_selected_block_uuids : unit -> string list

val timers_timeout : (unit -> unit) -> int -> int
val timers_clear_timeout : int -> unit
val timers_interval : (unit -> unit) -> int -> int
val timers_clear_interval : int -> unit
val timers_debounce : int -> (unit -> unit) -> unit
val timers_later : ms:int -> (unit -> unit) -> unit

val files_pick_files :
     ?accept:string
  -> ?multiple:bool
  -> ?directory:bool
  -> (file list -> unit)
  -> unit
val files_download_text : filename:string -> mime:string -> string -> unit
val files_download_binary :
  filename:string -> mime:string -> string -> unit
val files_inflate_raw : string -> string Ui_task.t
val files_dir_picker_supported : unit -> bool
val files_show_dir_picker : unit -> fs_dir Ui_task.t
