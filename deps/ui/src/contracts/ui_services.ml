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
  (* Current preference: "light" | "dark" | "system". *)
  system_default : unit -> bool;
  (* Whether "system" is the default mode on this host (desktop platforms). *)
  prefers_dark : unit -> bool;
  (* Live host appearance query — re-read on every call so a system change
     resolves the current effective mode. *)
  set_system_pref : bool -> unit;
  (* Persist the system-follow flag. *)
  set_theme_pref : string -> unit;
  (* Persist the effective theme ("dark" | "light"). *)
  apply_dataset : string -> unit;
  (* Document data attributes for the effective mode (data-theme). *)
  apply_classes : string -> unit;
  (* Document/body class swap for the effective mode. *)
}

(* Semantic navigation service — one hash route plus history and quiet
   replacement, matching the browser contract the native host emulates. *)
type nav = {
  hash : unit -> string;
  set_hash : string -> unit;
  (* Push a destination: updates the hash and notifies observers. *)
  replace_hash : string -> unit;
  (* Quiet rewrite: no history entry and no observer notification. *)
  back : unit -> unit;
  forward : unit -> unit;
  on_change : (unit -> unit) -> unit;
  (* Fires on hash changes only — navigation observers that must not also
     react to the imperative "ls:navigate" re-dispatch. *)
  on_navigate : (unit -> unit) -> unit;
  (* Fires on hash changes AND on the "ls:navigate" custom navigation event
     (imperative navigation that must resolve even when the hash repeats). *)
  search : unit -> string;
  query_param : string -> string option;
  hash_query_param : string -> string option;
  decode_uri : string -> string;
  reload : unit -> unit;
  (* Absolute-URL fields for share/link construction. Hosts without a
     public origin (native apps) return "" — the "open in another tab"
     surface degrades to the graph fragment, as before. *)
  origin : unit -> string;
  pathname : unit -> string;
}

(* Document/app chrome state the shared layer publishes. *)
type doc = {
  set_lang : string -> unit;
  (* Preferred-language preference read/write, quoted internally. *)
  preferred_lang : unit -> string;
  set_lang_pref : string -> unit;
  set_data : string -> string -> unit;
  rm_data : string -> unit;
  (* Arbitrary document data-* attributes (accent color, font) — same
     channel theme_apply_dataset uses for "theme". *)
  set_title : string -> unit;
  (* Window title — a no-op where the host owns the window chrome. *)
  reload : unit -> unit;
}

(* Wall-clock fields in the host's local timezone. [month] is the
   calendar month (1-12), [day] the day of month, [wday] the weekday
   (0 = Sunday). of_fields must normalize overflow the way the JS Date
   constructor/setters do (e.g. month 13 -> January of year+1,
   day 0 -> last day of the previous month). *)
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
  (* Short locale date ("Oct 9, 2026" shape) — the cljs
     toLocaleDateString(undefined, {year numeric, month short,
     day numeric}) rendering. *)
}

(* Host log channel. Values pass through uninterpreted — each runtime
   formats them however its console/log sink does (web console objects,
   native stderr). *)
type log = {
  error : 'a. 'a -> unit;
  info : 'a. 'a -> unit;
}

(* Timing instrumentation for perf marks — a debug sink, never parsed. *)
type perf = { mark : string -> unit }

type uri = { encode_component : string -> string }

(* Clipboard ops are best-effort host requests; the task resolves when
   the host confirms. copy is the fire-and-forget plain-text write. *)
type clipboard = {
  copy : string -> unit;
  write_text : string -> unit Ui_task.t;
  read_text : unit -> string Ui_task.t;
}

(* Per-tab/session storage — browser sessionStorage semantics: the
   values live only for the host session. *)
type session = {
  get : string -> string option;
  set : string -> string -> unit;
}

(* Editor model offset unit system: U16 — host layout offsets count
   UTF-16 code units; Bytes — host works on UTF-8 bytes. *)
type edit_units = [ `U16 | `Bytes ]

(* Host environment facts and capabilities — booleans are live queries,
   not snapshots. *)
type env = {
  publishing : unit -> bool;
  (* Static publishing-export build (window.logseq_db present). *)
  dev_build : unit -> bool;
  (* Development build flag. *)
  rtc_test_mode : unit -> bool;
  (* ?rtc-test=true query flag. *)
  online : unit -> bool;
  (* Host reports network reachability (navigator.onLine). *)
  is_mac : unit -> bool;
  (* macOS host platform detection. *)
  native_drag : unit -> bool;
  (* The host drives block drags itself (no HTML5 drag layer). *)
  native_block_controls : unit -> bool;
  (* The host keeps fold controls visible without hover. *)
  css_transform_icons : unit -> bool;
  (* The stylesheet supplies disclosure-icon state transforms; without
     it views must swap the icon itself. *)
  edit_units : unit -> edit_units;
  random_uuid : unit -> string;
  open_url : string -> unit;
  (* Open an external URL in the system browser. *)
}

(* Host timers — the same setTimeout/clearTimeout contract the DOM API
   exposes, so shared code never reaches for window.*)
type timers = {
  timeout : (unit -> unit) -> int -> int;
  clear_timeout : int -> unit;
  interval : (unit -> unit) -> int -> int;
  clear_interval : int -> unit;
  debounce : int -> (unit -> unit) -> unit;
  (* Returns a scheduler that restarts the delay on every call. *)
  later : ms:int -> (unit -> unit) -> unit;
}

(* A picked/dropped/host file as an opaque handle — impls keep the
   underlying host file inside the closures. *)
type file = {
  file_name : string;
  file_size : float;
  file_text : unit -> string Ui_task.t;
  (* Raw bytes as a binary string — the Wire.Binary payload shape. *)
  file_binary : unit -> string Ui_task.t;
}

(* File System Access handles as op-records (web only —
   [dir_picker_supported] gates every use; native impls fail fast). *)
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

(* File-system access — the picker/download surface plus the
   File System Access directory-backup handle flow. *)
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

(* Typed host-DOM boundary (folded from the temporary Ui_dom contract):
   event targets as opaque elements with a few accessors, host metrics,
   and the cross-area dispatch channel. Element handles never expose Js
   values — each runtime renders an event/target snapshot into these
   accessors. *)
type el = {
  token : int;
  (* Host-assigned element handle — lets an impl relate two els it built
     (contains, scroll_row_into_view) without exposing host payloads.
     Values are unique within the impl's bounded handle table. *)
  closest : string -> el option;
  attr : string -> string option;
  rect : unit -> float * float * float * float; (* x, y, width, height *)
  set_style : string -> string -> unit;
  add_class : string -> unit;
  remove_class : string -> unit;
  offset_width : unit -> float;
  focus : unit -> unit;
  (* Focus the element and move a text caret to the end (best effort). *)
  select_text : unit -> unit;
  set_selection_range : int -> int -> unit;
  set_attr : string -> string -> unit;
  rm_attr : string -> unit;
  value : unit -> string;
  set_value : string -> unit;
  set_text : string -> unit;
  (* Replace the element's text content. *)
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
  (* Text-entry element: textarea/input/select or contenteditable. *)
  query : string -> el option;
  query_all : string -> el list;
  files : unit -> file list;
  (* <input type=file> selections. *)
  style_prop : string -> string;
  (* Computed style property — "" where the host has no stylesheets. *)
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
  movement_x : float;
  movement_y : float;
  default_prevented : bool;
  target : el option;
  touches : (float * float) list;
  detail : string -> string option;
  clipboard_get : string -> string;
  (* clipboardData.getData <mime> — "" without data. *)
  clipboard_set : string -> string -> unit;
  data_transfer_get : string -> string;
  files : file list;
  (* Files carried by paste/drop events (clipboardData.files,
     dataTransfer.files). *)
  prevent_default : unit -> unit;
  stop_propagation : unit -> unit;
  stop_immediate : unit -> unit;
}

type dom = {
  on_document_event : ?capture:bool -> string -> (ev -> unit) -> unit;
  (* Document-level event subscription (custom "ls:*" events and input
     events) — the typed [ev] snapshot replaces raw event access. *)
  on_window_event : string -> (ev -> unit) -> unit;
  (* Window-level subscription (resize, visibilitychange relays). *)
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
  (* Cross-area custom event, payload-less (detail = null). *)
  dispatch_json : string -> Json.t -> unit;
  (* Cross-area custom event with a JSON detail payload — the
     CustomEvent contract. *)
  emit_json : string -> string -> unit;
  (* Re-dispatch a host-emitted synthetic event with a raw JSON payload
     (the payload IS the event's json object, not wrapped in detail).
     Malformed payloads dispatch null. Unreachable on web — hosts never
     synthesize dom-events there — so the web impl is a no-op. *)
  open_dialog : string -> unit;
  (* Publish "ls:open-dialog" with the dialog name. *)
  confirm : string -> bool;
  (* Synchronous confirm dialog; false on hosts without one. *)
  scroll_row_into_view : scroller:el -> row:el -> unit;
  (* Keep [row] visible inside [scroller] (autocomplete menus). *)
  ensure_fixups : unit -> unit;
  (* Register DOM content fixups (hidden delimiters, internal attrs) —
     a no-op on hosts that render source directly. *)
  apply_left_sidebar_width : int -> unit;
  (* Live left-sidebar width write (CSS var on web, dock model on
     native). *)
  selected_block_uuids : unit -> string list;
  (* Block selection as uuid list — empty where the host has no block
     selection concept. *)
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

let installed : t option ref = ref None
let install services = match !installed with
  | Some _ -> invalid_arg "UI services already installed"
  | None -> services.assert_owner (); installed := Some services
let get () = match !installed with
  | None -> invalid_arg "UI services not installed"
  | Some services -> services.assert_owner (); services

let storage_get key = (get ()).storage.get key
let storage_set key value = (get ()).storage.set key value
let storage_remove key = (get ()).storage.remove key

(* cljs storage.cljs reads with reader/read-string and writes pr-str,
   so cljs-stored strings appear double-quoted ("\"en\""). Strip/add
   that quoting at the storage boundary — pure helpers shared by every
   runtime. *)
let storage_unquote s =
  let len = String.length s in
  if len >= 2 && String.get s 0 = '"' && String.get s (len - 1) = '"' then
    String.sub s 1 (len - 2)
  else s

let storage_quote v = "\"" ^ v ^ "\""

let literal_text value = (get ()).literal_text value
let request_flush () = (get ()).request_flush ()

let theme_mode () = (get ()).theme.mode ()
let theme_system_default () = (get ()).theme.system_default ()
let theme_prefers_dark () = (get ()).theme.prefers_dark ()
let theme_set_system_pref v = (get ()).theme.set_system_pref v
let theme_set_pref v = (get ()).theme.set_theme_pref v
let theme_apply_dataset v = (get ()).theme.apply_dataset v
let theme_apply_classes v = (get ()).theme.apply_classes v

let nav_hash () = (get ()).nav.hash ()
let nav_set_hash h = (get ()).nav.set_hash h
let nav_replace_hash h = (get ()).nav.replace_hash h
let nav_back () = (get ()).nav.back ()
let nav_forward () = (get ()).nav.forward ()
let nav_on_change f = (get ()).nav.on_change f
let nav_on_navigate f = (get ()).nav.on_navigate f
let nav_search () = (get ()).nav.search ()
let nav_query_param n = (get ()).nav.query_param n
let nav_hash_query_param n = (get ()).nav.hash_query_param n
let nav_decode_uri s = (get ()).nav.decode_uri s
let nav_reload () = (get ()).nav.reload ()
let nav_origin () = (get ()).nav.origin ()
let nav_pathname () = (get ()).nav.pathname ()

let doc_set_lang l = (get ()).doc.set_lang l
let doc_preferred_lang () = (get ()).doc.preferred_lang ()
let doc_set_lang_pref l = (get ()).doc.set_lang_pref l
let doc_set_data name value = (get ()).doc.set_data name value
let doc_rm_data name = (get ()).doc.rm_data name
let doc_set_title t = (get ()).doc.set_title t
let doc_reload () = (get ()).doc.reload ()

let time_now () = (get ()).time.now ()
let time_local_fields ms = (get ()).time.local_fields ms
let time_of_fields f = (get ()).time.of_fields f
let time_parse s = (get ()).time.parse s
let time_fmt_date ms = (get ()).time.fmt_date ms

let log_error v = (get ()).log.error v
let log_info v = (get ()).log.info v
let perf_mark name = (get ()).perf.mark name
let uri_encode_component s = (get ()).uri.encode_component s
let clipboard_copy s = (get ()).clipboard.copy s
let clipboard_write_text s = (get ()).clipboard.write_text s
let clipboard_read_text () = (get ()).clipboard.read_text ()
let session_get k = (get ()).session.get k
let session_set k v = (get ()).session.set k v

let env_publishing () = (get ()).env.publishing ()
let env_dev_build () = (get ()).env.dev_build ()
let env_rtc_test_mode () = (get ()).env.rtc_test_mode ()
let env_online () = (get ()).env.online ()
let env_is_mac () = (get ()).env.is_mac ()
let env_native_drag () = (get ()).env.native_drag ()
let env_native_block_controls () = (get ()).env.native_block_controls ()
let env_css_transform_icons () = (get ()).env.css_transform_icons ()
let env_edit_units () = (get ()).env.edit_units ()
let env_random_uuid () = (get ()).env.random_uuid ()
let env_open_url u = (get ()).env.open_url u

let dom_on_document_event ?capture name f = (get ()).dom.on_document_event ?capture name f
let dom_on_window_event name f = (get ()).dom.on_window_event name f
let dom_query sel = (get ()).dom.query sel
let dom_query_all sel = (get ()).dom.query_all sel
let dom_by_id id = (get ()).dom.by_id id
let dom_active_element () = (get ()).dom.active_element ()
let dom_element_at x y = (get ()).dom.element_at x y
let dom_root () = (get ()).dom.doc_root ()
let dom_body () = (get ()).dom.body ()
let dom_viewport_width () = (get ()).dom.viewport_width ()
let dom_viewport_height () = (get ()).dom.viewport_height ()
let dom_document_visible () = (get ()).dom.document_visible ()
let dom_dispatch name = (get ()).dom.dispatch name
let dom_dispatch_json name detail = (get ()).dom.dispatch_json name detail
let dom_emit_json name payload = (get ()).dom.emit_json name payload
let dom_open_dialog name = (get ()).dom.open_dialog name
let dom_confirm msg = (get ()).dom.confirm msg
let dom_scroll_row_into_view ~scroller ~row =
  (get ()).dom.scroll_row_into_view ~scroller ~row
let dom_ensure_fixups () = (get ()).dom.ensure_fixups ()
let dom_apply_left_sidebar_width px = (get ()).dom.apply_left_sidebar_width px
let dom_selected_block_uuids () = (get ()).dom.selected_block_uuids ()

let timers_timeout f ms = (get ()).timers.timeout f ms
let timers_clear_timeout id = (get ()).timers.clear_timeout id
let timers_interval f ms = (get ()).timers.interval f ms
let timers_clear_interval id = (get ()).timers.clear_interval id
let timers_debounce ms = (get ()).timers.debounce ms
let timers_later ~ms f = (get ()).timers.later ~ms f

let files_pick_files ?accept ?multiple ?directory on_files =
  (get ()).files.pick_files ?accept ?multiple ?directory on_files
let files_download_text ~filename ~mime text =
  (get ()).files.download_text ~filename ~mime text
let files_download_binary ~filename ~mime data =
  (get ()).files.download_binary ~filename ~mime data
let files_inflate_raw s = (get ()).files.inflate_raw s
let files_dir_picker_supported () = (get ()).files.dir_picker_supported ()
let files_show_dir_picker () = (get ()).files.show_dir_picker ()
