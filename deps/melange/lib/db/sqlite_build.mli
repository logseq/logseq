type property_value = Missing | Page of { journal : bool } | Scalar of string
type property_schema = { property_type : string; cardinality : string option }
type temp_id_state

val create_temp_id_state : unit -> temp_id_state
val next_temp_id : temp_id_state -> int
val default_temp_id_state : temp_id_state
val class_property_order : string Rrbvec.t Rrbvec.t -> string Rrbvec.t
val property_schema : collection:bool -> property_value -> property_schema

val extract_blocks :
  children:('block -> 'block Rrbvec.t) ->
  apply:('block -> 'result Rrbvec.t) ->
  'block Rrbvec.t ->
  'result Rrbvec.t

val update_blocks :
  children:('block -> 'block Rrbvec.t) ->
  with_children:('block -> 'block Rrbvec.t -> 'block) ->
  update:('block -> 'block) ->
  'block Rrbvec.t ->
  'block Rrbvec.t
