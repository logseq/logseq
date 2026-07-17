type feature =
  | All_pages
  | Class_objects
  | Property_objects
  | Linked_references
  | Unlinked_references
  | Query_result

type sorting = { id : string; ascending : bool }
type 'label page_count = { label : 'label; count : int }

type ('id, 'entity, 'label) reference_result = {
  blocks : 'entity Rrbvec.t;
  page_counts : 'label page_count Rrbvec.t option;
  matched_children_ids : 'id Rrbvec.t option;
}

type ('id, 'entity, 'label) selection =
  | Entities of 'entity Rrbvec.t
  | References of ('id, 'entity, 'label) reference_result
  | Empty

type ('id, 'entity, 'value, 'label) capabilities = {
  resolve_id : string -> 'id option;
  entity : 'id -> 'entity option;
  entity_id : 'entity -> 'id;
  equal_id : 'id -> 'id -> bool;
  hidden : 'entity -> bool;
  ids_with_attribute : string -> 'id Rrbvec.t;
  ids_with_bool : string -> bool -> 'id Rrbvec.t;
  ids_with_ref : string -> 'id -> 'id Rrbvec.t;
  with_refs_count : 'entity -> int -> 'entity;
  refs_count : 'id -> int;
  sort_value : 'entity -> string -> View_order.value;
  class_objects : 'id -> 'entity Rrbvec.t;
  property_object_ids : string -> 'id Rrbvec.t;
  linked_references : 'id -> ('id, 'entity, 'label) reference_result;
  unlinked_references : 'id -> 'entity Rrbvec.t option;
}

val feature_of_string : string -> feature
val feature_to_string : feature -> string
val property_objects_query : Datalog_form.t

val all_pages_with :
  ('id, 'entity, 'value, 'label) capabilities ->
  sorting:sorting Rrbvec.t ->
  property_ident:string ->
  'entity Rrbvec.t

val fast_all_page_ids_with :
  ('id, 'entity, 'value, 'label) capabilities ->
  sorting:sorting Rrbvec.t ->
  'id Rrbvec.t option

val select_with :
  ('id, 'entity, 'value, 'label) capabilities ->
  feature:feature ->
  view_for_id:'id option ->
  property_ident:string option ->
  sorting:sorting Rrbvec.t ->
  ('id, 'entity, 'label) selection
