type t

val of_string : string -> (t, string) result
val to_string : t -> string
val namespace : t -> string option
val name : t -> string
val equal : t -> t -> bool
