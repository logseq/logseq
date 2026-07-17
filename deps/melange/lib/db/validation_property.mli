type attribute_action = Keep | Move_property | Prepare_tags
type plan = { many : bool; uses_db : bool; closed_membership_required : bool }
type value_result = { base_valid : bool; closed_value_member : bool }

type validation_options = {
  new_closed_value : bool;
  closed_values_validate : bool;
  skip_strict_url_validate : bool;
}

type 'value validation_capabilities = {
  field : 'value -> string -> 'value;
  entity : 'value -> 'value option;
  has_tag : 'value -> string -> bool;
  is_nil : 'value -> bool;
  is_string : 'value -> bool;
  is_bool : 'value -> bool;
  is_number : 'value -> bool;
  is_integer : 'value -> bool;
  is_keyword : 'value -> bool;
  is_vector : 'value -> bool;
  is_set : 'value -> bool;
  is_map : 'value -> bool;
  is_sequential : 'value -> bool;
  string_from_value : 'value -> string;
  string_is_url : string -> bool;
  is_macro : string -> bool;
  keyword_to_string : 'value -> string;
  keyword_from_string : string -> 'value;
  collection_to_array : 'value -> 'value array;
  equal : 'value -> 'value -> bool;
  nil_value : 'value;
  value_to_string : 'value -> string;
  log_error : string -> unit;
}

val required_properties : string Rrbvec.t

val attribute_action :
  attribute:string ->
  is_property:bool ->
  property_exists:bool ->
  attribute_action

val plan_value_validation :
  property_type:string option ->
  cardinality:string option ->
  closed_values_validate:bool ->
  new_closed_value:bool ->
  has_closed_values:bool ->
  plan

val many : plan -> bool
val uses_db : plan -> bool
val closed_membership_required : plan -> bool

val validate_value_results :
  plan -> value_result Rrbvec.t -> empty_placeholder:bool -> bool

val value_valid_with :
  'value validation_capabilities ->
  validation_options ->
  property:'value ->
  property_value:'value ->
  bool

val error_message : string -> string
val registered_property_type : string -> bool
