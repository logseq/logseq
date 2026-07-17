type validation_input = {
  db_based : bool;
  rtc_download : bool;
  reset_conn : bool;
  initial_db : bool;
  skip_meta : bool;
  skip_conn : bool;
  exporter_new_graph : bool;
}

type favorite

val keep_map_attribute : external_transact:bool -> string -> bool
val keep_temporary_attribute : string -> bool
val keep_map : empty:bool -> db_ident:string option -> bool
val keep_vector_attribute : string option -> bool
val should_validate : validation_input -> bool
val favorite : string -> favorite
val favorite_uuid : favorite -> string
val favorite_title : favorite -> string
