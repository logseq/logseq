val format_count : int -> string
val pluralize_noun : int -> string -> string
val format_count_with_noun : int -> string -> string
val format_filesize : int64 option -> string
val relative_datetime : then_time:Ptime.t -> now_time:Ptime.t -> string
