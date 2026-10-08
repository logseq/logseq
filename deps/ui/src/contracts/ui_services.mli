type storage = {
  get : string -> string option;
  set : string -> string -> unit;
  remove : string -> unit;
}

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
}

type doc = {
  set_lang : string -> unit;
  preferred_lang : unit -> string;
  set_lang_pref : string -> unit;
  set_data : string -> string -> unit;
  rm_data : string -> unit;
  reload : unit -> unit;
}

type t = {
  storage : storage;
  literal_text : string -> string;
  request_flush : unit -> unit;
  assert_owner : unit -> unit;
  theme : theme;
  nav : nav;
  doc : doc;
}

val install : t -> unit
(* Install once before creating the application. Service calls require the
   owning application context, and raw preferences keep their existing format. *)
val storage_get : string -> string option
val storage_set : string -> string -> unit
val storage_remove : string -> unit
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

val doc_set_lang : string -> unit
val doc_preferred_lang : unit -> string
val doc_set_lang_pref : string -> unit
val doc_set_data : string -> string -> unit
val doc_rm_data : string -> unit
val doc_reload : unit -> unit
