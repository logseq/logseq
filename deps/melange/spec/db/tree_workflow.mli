type ('entity, 'id) capabilities = {
  id : 'entity -> 'id;
  equal_id : 'id -> 'id -> bool;
  order : 'entity -> string;
  children : 'entity -> 'entity Rrbvec.t;
  raw_children : 'entity -> 'entity Rrbvec.t;
  query_child : 'entity -> 'entity option;
}

type direction = Left | Right

type ('entity, 'id) sibling_capabilities = {
  sibling_id : 'entity -> 'id;
  sibling_equal_id : 'id -> 'id -> bool;
  sibling_order : 'entity -> string;
  parent : 'entity -> 'entity option;
  closed_property : 'entity -> 'entity option;
  created_from : 'entity -> 'entity option;
  closed_children : 'entity -> 'entity Rrbvec.t;
  raw_children : 'entity -> 'entity Rrbvec.t;
  normal_children : 'entity -> 'entity Rrbvec.t;
}

type ('entity, 'identifier) child_reference =
  | Entity of 'entity
  | Id of 'identifier
  | Uuid of 'identifier

type ('entity, 'identifier) child_capabilities = {
  child_order : 'entity -> string;
  child_entities : 'entity -> 'entity Rrbvec.t;
  child_by_id : 'identifier -> 'entity option;
  child_by_uuid : 'identifier -> 'entity option;
}

val sort_with :
  order:('entity -> string) -> 'entity Rrbvec.t -> 'entity Rrbvec.t

val block_and_children_with :
  ('entity, 'id) capabilities ->
  include_property_blocks:bool ->
  'entity ->
  'entity Rrbvec.t

val sibling_with :
  ('entity, 'id) sibling_capabilities ->
  direction:direction ->
  'entity ->
  'entity option

val children_of_with :
  order:('entity -> string) ->
  children:('entity -> 'entity Rrbvec.t) ->
  'entity ->
  'entity Rrbvec.t

val first_child_of_with :
  order:('entity -> string) ->
  children:('entity -> 'entity Rrbvec.t) ->
  'entity ->
  'entity option

val children_with :
  ('entity, 'identifier) child_capabilities ->
  ('entity, 'identifier) child_reference ->
  'entity Rrbvec.t option

val first_child_with :
  ('entity, 'identifier) child_capabilities ->
  ('entity, 'identifier) child_reference ->
  'entity option
