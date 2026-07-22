type t

val to_string : t -> string
val of_string : string -> t option

val property_value_content :
  property_type:t option ->
  property_is_default:bool ->
  block_type:t option ->
  bool

val infer : number:bool -> url:bool -> boolean:bool -> t
val internal_built_in : t Rrbvec.t
val user_built_in : t Rrbvec.t
val user_allowed_internal : t Rrbvec.t
val closed_value : t Rrbvec.t
val cardinality : t Rrbvec.t
val default_value_ref : t Rrbvec.t
val text_ref : t Rrbvec.t
val original_value_ref : t Rrbvec.t
val value_ref : t Rrbvec.t
val user_ref : t Rrbvec.t
val all_ref : t Rrbvec.t
val with_db : t Rrbvec.t
