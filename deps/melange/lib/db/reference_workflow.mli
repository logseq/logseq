type ('id, 'entity, 'label) capabilities = {
  entity : 'id -> 'entity option;
  entity_id : 'entity -> 'id;
  equal_id : 'id -> 'id -> bool;
  id_text : 'id -> string;
  aliases : 'id -> 'id Rrbvec.t;
  structured_children : 'id -> 'id Rrbvec.t;
  children_ids : 'entity -> 'id Rrbvec.t;
  direct_children : 'entity -> 'entity Rrbvec.t;
  parents : 'entity -> 'entity Rrbvec.t;
  parent : 'entity -> 'entity option;
  page : 'entity -> 'entity option;
  view_for : 'entity -> 'entity option;
  references : 'entity -> 'entity Rrbvec.t;
  references_to : 'entity -> 'entity Rrbvec.t;
  tags : 'entity -> 'entity Rrbvec.t;
  filter_includes : 'entity -> 'entity Rrbvec.t;
  filter_excludes : 'entity -> 'entity Rrbvec.t;
  ident : 'entity -> string option;
  has_ident_field : 'entity -> string -> bool;
  hidden : 'entity -> bool;
  class_entity : 'entity -> bool;
  page_entity : 'entity -> bool;
  title : 'entity -> 'label;
}

type 'label page_count = { label : 'label; count : int }

type 'entity filters = {
  included : 'entity Rrbvec.t;
  excluded : 'entity Rrbvec.t;
}

type ('id, 'entity, 'label) result = {
  ref_blocks : 'entity Rrbvec.t;
  ref_pages_count : 'label page_count Rrbvec.t option;
  ref_matched_children_ids : 'id Rrbvec.t option;
}

val filters :
  included:'entity Rrbvec.t ->
  excluded:'entity Rrbvec.t ->
  'entity filters option

val linked_with :
  ('id, 'entity, 'label) capabilities -> 'id -> ('id, 'entity, 'label) result
