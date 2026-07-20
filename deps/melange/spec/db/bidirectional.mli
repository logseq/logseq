type class_ref = {
  id : int;
  class_ : bool;
  built_in : bool;
  recycled : bool;
  enabled : bool;
  created_at : float option;
}

type candidate = {
  entity_id : int;
  target : bool;
  recycled : bool;
  class_ : bool;
  property : bool;
  created_at : float option;
  classes : class_ref Rrbvec.t;
}

type group

type ('entity, 'value) workflow_capabilities = {
  query_property_attrs : Datalog_form.t -> string Rrbvec.t;
  referenced_entity_ids : string -> int -> int Rrbvec.t;
  entity : int -> 'entity option;
  entity_id : 'entity -> int;
  recycled : 'entity -> bool;
  class_value : 'entity -> bool;
  property_value : 'entity -> bool;
  created_at : 'entity -> float option;
  classes : 'entity -> 'entity Rrbvec.t;
  built_in : 'entity -> bool;
  bidirectional_enabled : 'entity -> bool;
  created_from_property : 'entity -> bool;
  custom_title : 'entity -> 'value option;
  value_is_string : 'value -> bool;
  string_from_value : 'value -> string;
  property_value_content : 'value -> string;
  title : 'entity -> string;
  plural : string -> string;
}

type 'entity resolved_group

val groups : target_id:int -> candidate Rrbvec.t -> group Rrbvec.t
val group_class_id : group -> int
val group_entity_ids : group -> int Rrbvec.t

val groups_with :
  ('entity, 'value) workflow_capabilities ->
  target_id:int ->
  'entity resolved_group Rrbvec.t option

val resolved_title : 'entity resolved_group -> string
val resolved_class : 'entity resolved_group -> 'entity
val resolved_entities : 'entity resolved_group -> 'entity Rrbvec.t
