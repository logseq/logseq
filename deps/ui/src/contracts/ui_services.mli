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

(* Typed host-DOM boundary (folded from the temporary Ui_dom contract). *)
type el = {
  closest : string -> el option;
  attr : string -> string option;
  rect : unit -> float * float * float * float;
  set_style : string -> string -> unit;
  add_class : string -> unit;
  remove_class : string -> unit;
  offset_width : unit -> float;
}

type ev = {
  x : float;
  y : float;
  shift : bool;
  meta : bool;
  ctrl : bool;
  composing : bool;
  key : string option;
  target : el option;
  touches : (float * float) list;
  detail : string -> string option;
  prevent_default : unit -> unit;
}

type dom = {
  on_document_event : string -> (ev -> unit) -> unit;
  query : string -> el option;
  doc_root : unit -> el;
  viewport_width : unit -> float;
  dispatch : string -> unit;
  emit_json : string -> string -> unit;
  open_dialog : string -> unit;
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

val dom_on_document_event : string -> (ev -> unit) -> unit
val dom_query : string -> el option
val dom_root : unit -> el
val dom_viewport_width : unit -> float
val dom_dispatch : string -> unit
val dom_emit_json : string -> string -> unit
val dom_open_dialog : string -> unit
val dom_apply_left_sidebar_width : int -> unit
val dom_selected_block_uuids : unit -> string list
