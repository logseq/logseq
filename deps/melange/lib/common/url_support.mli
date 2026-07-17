type t

val make : string -> t
val can_parse : string -> bool
val origin : t -> string
val protocol : t -> string
val host : t -> string
val pathname : t -> string
