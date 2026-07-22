type entry = {
  index : int;
  id : string option;
  scope_ids : string Rrbvec.t;
  recycled : bool;
}

val filter_indices :
  entry Rrbvec.t ->
  class_ids:string Rrbvec.t ->
  excluded_ids:string Rrbvec.t ->
  int Rrbvec.t

val filter_values_with :
  id_text:('entity -> string option) ->
  scope_ids:('entity -> string array) ->
  recycled:('entity -> bool) ->
  class_id:('entity -> string option) ->
  class_entity:bool ->
  block_id:string option ->
  exclusions:('entity -> 'entity array) ->
  values:'entity array ->
  classes:'entity array ->
  'entity array

val closed_values_with :
  lookup:('property_id -> 'property option) ->
  values:('property -> 'entity array) ->
  recycled:('entity -> bool) ->
  order:('entity -> string option) ->
  'property_id ->
  'entity array option

val find_closed_value_with :
  lookup:('property_id -> 'property option) ->
  values:('property -> 'entity array) ->
  recycled:('entity -> bool) ->
  order:('entity -> string option) ->
  content:('entity -> 'content) ->
  equals:('content -> 'content -> bool) ->
  'property_id ->
  'content ->
  'entity option
