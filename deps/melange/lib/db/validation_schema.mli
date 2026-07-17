type value_kind =
  | String
  | Int
  | Number
  | Bool
  | Keyword
  | Uuid
  | Instant
  | Int_set
  | Sequential
  | Other

type attribute = {
  name : string;
  kind : value_kind;
  text : string option;
  truthy : bool;
  non_nil : bool;
  special_valid : bool;
  special_message : string;
}

type error_category = Missing | Type | Value | Unknown | Dispatch
type error
type error_group = { attribute : string option; messages : string Rrbvec.t }

type validation_result = {
  dispatch_key : string option;
  errors : error_group Rrbvec.t;
  error_details : error Rrbvec.t;
}

type 'value entity_error = { entity : 'value; validation : validation_result }

type ('report, 'database, 'datom, 'value) transaction_capabilities = {
  report_db_after : 'report -> 'database;
  report_datoms : 'report -> 'datom array;
  report_tx_metadata : 'report -> 'value;
  datom_entity : 'datom -> 'value;
  equal : 'value -> 'value -> bool;
  scan_entity_datoms : 'database -> 'value -> 'datom array;
  assemble_entities : 'database -> 'datom array -> 'value array;
  prepare_entities : 'database -> 'value array -> 'value array;
  validate_entities :
    'database -> 'value Rrbvec.t -> 'value entity_error Rrbvec.t;
  log_errors : 'value Rrbvec.t -> 'value -> 'value entity_error Rrbvec.t -> unit;
}

type 'value transaction_result = {
  valid : bool;
  errors : 'value entity_error Rrbvec.t;
}

type ('database, 'datom, 'value) database_capabilities = {
  scan_all_datoms : 'database -> 'datom array;
  assemble_entities : 'datom array -> 'value array;
  remove_field : 'value -> string -> 'value;
  prepare_entities : 'database -> 'value array -> 'value array;
  validate_entities :
    'database -> 'value Rrbvec.t -> 'value entity_error Rrbvec.t;
}

type 'value database_result = {
  datom_count : int;
  entities : 'value Rrbvec.t;
  errors : 'value entity_error Rrbvec.t;
}

type 'value workflow_capabilities = {
  map_entries : 'value -> 'value array array;
  field : 'value -> string -> 'value;
  has_field : 'value -> string -> bool;
  assoc_field : 'value -> string -> 'value -> 'value;
  lookup_entity : 'value -> 'value option;
  empty_map : 'value;
  array_to_vector : 'value array -> 'value;
  dispatch : 'value -> string option;
  is_nil : 'value -> bool;
  value_truthy : 'value -> bool;
  is_string : 'value -> bool;
  is_integer : 'value -> bool;
  is_number : 'value -> bool;
  is_bool : 'value -> bool;
  is_keyword : 'value -> bool;
  is_uuid : 'value -> bool;
  is_instant : 'value -> bool;
  is_set : 'value -> bool;
  is_sequential : 'value -> bool;
  keyword_to_string : 'value -> string;
  string_from_value : 'value -> string;
  value_to_string : 'value -> string;
  collection_to_array : 'value -> 'value array;
  equal : 'value -> 'value -> bool;
  property_tuple_valid : 'value -> bool;
  property_tuple_error_message : 'value -> string;
}

val error_attribute : error -> string option
val error_category : error -> error_category
val error_message : error -> string

val validate_entity :
  closed:bool -> Validation_entity.kind -> attribute Rrbvec.t -> error Rrbvec.t

val kind_of_string : string -> Validation_entity.kind

val validate_entity_with :
  'value workflow_capabilities ->
  dispatch_key:string option ->
  closed:bool ->
  'value ->
  validation_result

val validate_entities_with :
  'value workflow_capabilities ->
  dispatch_key:string option ->
  closed:bool ->
  'value Rrbvec.t ->
  'value entity_error Rrbvec.t

val validate_transaction_with :
  ('report, 'database, 'datom, 'value) transaction_capabilities ->
  'report ->
  'value transaction_result

val validate_database_with :
  ('database, 'datom, 'value) database_capabilities ->
  'database ->
  'value database_result
