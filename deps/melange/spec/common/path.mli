val is_file_url : string -> bool
val filename : string -> string option
val split_ext : string -> string * string
val file_stem : string -> string
val file_ext : string -> string
val url_join : string -> string option array -> string
val path_join : string option -> string option array -> string
val prepend_protocol : string -> string -> string
val url_normalize : string -> string
val path_normalize : string -> string
val url_to_path : string -> string
val file_url_or_path_to_path : string -> string
val trim_dir_prefix : string -> string -> string option
val parent : string -> string option
val basename : string -> string
val is_absolute : string -> bool
val is_protocol_url : string -> bool
