type 'value capabilities = {
  field : 'value -> string -> 'value;
  is_nil : 'value -> bool;
  is_entity : 'value -> bool;
  is_collection : 'value -> bool;
  is_map : 'value -> bool;
  is_bool : 'value -> bool;
  is_number : 'value -> bool;
  is_string : 'value -> bool;
  value_truthy : 'value -> bool;
  bool_from_value : 'value -> bool;
  float_from_value : 'value -> float;
  string_from_value : 'value -> string;
  ident_text : 'value -> string;
  collection_to_array : 'value -> 'value array;
  equal : 'value -> 'value -> bool;
}

type 'value group = { key : 'value; entities : 'value Rrbvec.t }

val group_entities_with :
  'value capabilities ->
  property:'value ->
  group_ident:string ->
  sort_ident:string ->
  descending:bool ->
  'value Rrbvec.t ->
  'value group Rrbvec.t
