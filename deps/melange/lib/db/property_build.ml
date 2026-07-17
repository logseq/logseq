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

let plan_reference_value shape =
  if shape.collection then
    if shape.all_lookup_refs then Keep_reference
    else if shape.all_blocks_with_uuid then Extract_block_uuid_set
    else Reject_reference
  else if shape.single_lookup_ref then Keep_reference
  else if shape.single_block_with_uuid then Extract_block_uuid
  else Reject_reference

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

let plan_value_block shape =
  {
    page_source =
      (if shape.block_has_page then Page_from_block else Page_from_self);
    created_from_source =
      (if shape.property_is_default then Created_from_block
       else if shape.property_has_id then Created_from_property_entity
       else Created_from_property_lookup);
    value_field = (if shape.value_content then Property_value else Block_title);
  }

type closed_created_from_source = Closed_block_lookup | Closed_property_ident

type closed_value_shape = {
  closed_property_is_default : bool;
  closed_value_content : bool;
}

type closed_value_plan = {
  closed_created_from_source : closed_created_from_source;
  closed_value_field : value_field;
}

let plan_closed_value shape =
  {
    closed_created_from_source =
      (if shape.closed_property_is_default then Closed_block_lookup
       else Closed_property_ident);
    closed_value_field =
      (if shape.closed_value_content then Property_value else Block_title);
  }

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

let plan_property_value shape =
  if shape.value_collection then
    if shape.all_values_uuid then Uuid_set else Value_block_set
  else if shape.single_value_uuid then Uuid_lookup
  else Value_block

type closed_value_entry_action = Merge_entry_properties | Keep_entry_base

let plan_closed_value_entry ~has_properties =
  if has_properties then Merge_entry_properties else Keep_entry_base

type property_schema_source =
  | Explicit_property_schema
  | Resolve_property_schema

let plan_property_schema ~has_explicit_schema =
  if has_explicit_schema then Explicit_property_schema
  else Resolve_property_schema
