type 'value capabilities = {
  field : 'value -> string -> 'value;
  resolve_entity : 'value -> 'value option;
  resolve_uuid : 'value -> 'value option;
  recycled : 'value -> bool;
  nil_value : 'value;
  is_nil : 'value -> bool;
  is_entity : 'value -> bool;
  is_set : 'value -> bool;
  is_string : 'value -> bool;
  is_keyword : 'value -> bool;
  is_uuid : 'value -> bool;
  value_truthy : 'value -> bool;
  collection_to_array : 'value -> 'value array;
  string_to_value : string -> 'value;
  value_to_string : 'value -> string;
  equal : 'value -> 'value -> bool;
  project_entity : 'value -> 'value;
}

type 'value entry = { label : 'value; value : 'value }

val content : 'value capabilities -> 'value -> 'value

val from_entities :
  'value capabilities ->
  property_ident:string ->
  empty_id:'value ->
  'value Rrbvec.t ->
  'value entry Rrbvec.t

val from_datoms :
  'value capabilities ->
  ref_type:bool ->
  default_value:'value option ->
  'value Rrbvec.t ->
  'value entry Rrbvec.t
