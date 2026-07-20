type page_names = {
  favorites : string;
  contents : string;
  quick_add : string;
  views : string;
  recycle : string;
}

type ('database, 'schema, 'entity, 'value, 'datom) capabilities = {
  schema : 'database -> 'schema;
  max_order : 'database -> string option;
  reset_max_order : string option -> unit;
  entity_by_ident : 'database -> string -> 'entity option;
  entity_by_id : 'database -> 'value -> 'entity option;
  entity_id : 'entity -> 'value;
  entity_ref : 'entity -> string -> 'entity option;
  entity_refs : 'entity -> string -> 'entity array;
  resolve_ident : string -> 'value;
  attribute_datoms : 'database -> string -> 'datom array;
  attribute_value_datoms : 'database -> string -> 'value -> 'datom array;
  entity_datoms : 'database -> 'value -> 'datom array;
  datom_entity : 'datom -> 'value;
  datom_attribute : 'datom -> string;
  datom_value : 'datom -> 'value;
  equal_value : 'value -> 'value -> bool;
  equal_datom : 'datom -> 'datom -> bool;
  oldest_page_by_name : 'database -> string -> 'value option;
  oldest_page_by_title : 'database -> string -> 'value option;
  built_in_page : 'database -> string -> 'entity option;
  recent_pages : 'database -> 'entity array;
}

type ('schema, 'datom) result = {
  schema : 'schema;
  initial_data : 'datom array;
}

val get_with :
  ('database, 'schema, 'entity, 'value, 'datom) capabilities ->
  page_names ->
  'database ->
  ('schema, 'datom) result
