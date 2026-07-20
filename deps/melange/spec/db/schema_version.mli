type t

val make : int -> int option -> t
val parse : string -> t
val major : t -> int
val minor : t -> int option
val compare : t -> t -> int
val to_string : t -> string
val version : t
