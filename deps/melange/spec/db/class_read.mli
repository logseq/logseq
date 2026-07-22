type node = { id : int; extends : int Rrbvec.t }
type object_candidate = { id : int; hidden : bool }

val extends_ids : root_id:int -> node Rrbvec.t -> int Rrbvec.t

val extends_entities_with :
  entity_id:('entity -> int) ->
  entity_extends:('entity -> 'entity array) ->
  'entity ->
  'entity array

val structured_children_with :
  encode_form:(Datalog_form.t -> 'value) ->
  query:('value -> 'value array -> 'value) ->
  collection_to_array:('value -> 'value array) ->
  value_equals:('value -> 'value -> bool) ->
  root:'value ->
  rule:'value ->
  'value array

val objects_with :
  encode_form:(Datalog_form.t -> 'value) ->
  query:('value -> 'value array -> 'value) ->
  collection_to_array:('value -> 'value array) ->
  value_equals:('value -> 'value -> bool) ->
  datoms:('value -> 'value array -> 'datom array) ->
  datom_entity:('datom -> 'value) ->
  entity:('value -> 'entity option) ->
  hidden:('entity -> bool) ->
  root:'value ->
  rule:'value ->
  index:'value ->
  attribute:'value ->
  'entity array

val object_ids : object_candidate Rrbvec.t -> int Rrbvec.t
val logseq_class : string -> bool
val user_class_namespace : string -> bool
