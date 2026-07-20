type t =
  | Symbol of string
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | List_form of t Rrbvec.t
  | Vector_form of t Rrbvec.t

val symbol : string -> t
val keyword : string -> t
val string_literal : string -> t
val bool : bool -> t
val list_form : t array -> t
val vector_form : t array -> t
