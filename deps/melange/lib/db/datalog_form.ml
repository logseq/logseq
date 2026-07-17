type t =
  | Symbol of string
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | List_form of t Rrbvec.t
  | Vector_form of t Rrbvec.t

let symbol value = Symbol value
let keyword value = Keyword value
let string_literal value = String_literal value
let bool value = Bool value
let list_form values = List_form (Rrbvec.of_array values)
let vector_form values = Vector_form (Rrbvec.of_array values)
