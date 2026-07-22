type 'value capabilities = {
  field : 'value -> string -> 'value;
  map_keys : 'value -> 'value array;
  resolve_ident : 'value -> 'value option;
  resolve_uuid : 'value -> 'value option;
  nil_value : 'value;
  is_nil : 'value -> bool;
  is_entity : 'value -> bool;
  is_collection : 'value -> bool;
  is_string : 'value -> bool;
  is_bool : 'value -> bool;
  is_number : 'value -> bool;
  is_keyword : 'value -> bool;
  is_uuid : 'value -> bool;
  is_instant : 'value -> bool;
  value_truthy : 'value -> bool;
  bool_from_value : 'value -> bool;
  float_from_value : 'value -> float;
  string_from_value : 'value -> string;
  string_to_value : string -> 'value;
  lowercase : string -> string;
  ident_text : 'value -> string;
  collection_to_array : 'value -> 'value array;
  value_to_string : 'value -> string;
  equal : 'value -> 'value -> bool;
  instant_to_ms : 'value -> float;
  now_ms : unit -> float;
  relative_timestamp_ms : now_ms:float -> string -> float option;
}

val filter_entities_with :
  'value capabilities ->
  filters:'value ->
  input:string ->
  'value Rrbvec.t ->
  'value Rrbvec.t

val query_properties_with :
  'value capabilities ->
  query:'value ->
  entities:'value Rrbvec.t ->
  'value Rrbvec.t

val query_properties :
  map_keys:('value -> 'value array) ->
  collection_to_array:('value -> 'value array) ->
  ident_text:('value -> string) ->
  equal:('value -> 'value -> bool) ->
  query:'value ->
  entities:'value Rrbvec.t ->
  'value Rrbvec.t
