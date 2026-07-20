type 'value sorting = { id : 'value; ascending : bool }

type 'value capabilities = {
  field : 'value -> string -> 'value;
  resolve_entity : 'value -> 'value option;
  is_nil : 'value -> bool;
  value_truthy : 'value -> bool;
  is_bool : 'value -> bool;
  bool_from_value : 'value -> bool;
  is_number : 'value -> bool;
  float_from_value : 'value -> float;
  is_string : 'value -> bool;
  string_from_value : 'value -> string;
  ident_text : 'value -> string;
  ident_from_string : string -> 'value;
  collection_to_array : 'value -> 'value array;
  string_to_value : string -> 'value;
  float_to_value : float -> 'value;
  value_to_string : 'value -> string;
  equal : 'value -> 'value -> bool;
  datom_entity_ids : string -> 'value array;
}

val property_value_for_search :
  'value capabilities -> entity:'value -> property:'value -> 'value

val sort_entities_with :
  'value capabilities ->
  'value sorting Rrbvec.t ->
  'value Rrbvec.t ->
  'value Rrbvec.t
