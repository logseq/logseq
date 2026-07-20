type reference_shape = {
  collection : bool;
  all_lookup_refs : bool;
  single_lookup_ref : bool;
  all_blocks_with_uuid : bool;
  single_block_with_uuid : bool;
}

type reference_action =
  | Keep_reference
  | Extract_block_uuid
  | Extract_block_uuid_set
  | Reject_reference

val plan_reference_value : reference_shape -> reference_action

type page_source = Page_from_block | Page_from_self

type created_from_source =
  | Created_from_block
  | Created_from_property_entity
  | Created_from_property_lookup

type value_field = Property_value | Block_title

type value_block_shape = {
  block_has_page : bool;
  property_is_default : bool;
  property_has_id : bool;
  value_content : bool;
}

type value_block_plan = {
  page_source : page_source;
  created_from_source : created_from_source;
  value_field : value_field;
}

val plan_value_block : value_block_shape -> value_block_plan

type closed_created_from_source = Closed_block_lookup | Closed_property_ident

type closed_value_shape = {
  closed_property_is_default : bool;
  closed_value_content : bool;
}

type closed_value_plan = {
  closed_created_from_source : closed_created_from_source;
  closed_value_field : value_field;
}

val plan_closed_value : closed_value_shape -> closed_value_plan

type property_value_action =
  | Uuid_set
  | Value_block_set
  | Uuid_lookup
  | Value_block

type property_value_shape = {
  value_collection : bool;
  all_values_uuid : bool;
  single_value_uuid : bool;
}

val plan_property_value : property_value_shape -> property_value_action

type closed_value_entry_action = Merge_entry_properties | Keep_entry_base

val plan_closed_value_entry : has_properties:bool -> closed_value_entry_action

type property_schema_source =
  | Explicit_property_schema
  | Resolve_property_schema

val plan_property_schema : has_explicit_schema:bool -> property_schema_source
