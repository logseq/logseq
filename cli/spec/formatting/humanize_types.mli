val format_count : int -> string
val pluralize_noun : int -> string -> string
val format_count_with_noun : int -> string -> string
val datetime : now:int64 -> ?suffix:string -> ?prefix:string -> int64 -> string
val relative_datetime : then_time:Time.date -> now_time:Time.date -> string
