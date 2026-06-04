val format_count : int -> string
val pluralize_noun : int -> string -> string
val format_count_with_noun : int -> string -> string
val format_filesize : int64 option -> string

val relative_datetime :
  then_ms:Cli_primitive.timestamp_ms ->
  now_ms:Cli_primitive.timestamp_ms ->
  string
