val strip_ansi : string -> string
val bold : string -> string
val dim : string -> string
val red : string -> string
val green : string -> string
val yellow : string -> string
val blue : string -> string
val magenta : string -> string
val cyan : string -> string
val bold_keywords : string -> string list -> string
val bold_options : string -> string
val with_color_enabled : bool -> (unit -> 'a) -> 'a
