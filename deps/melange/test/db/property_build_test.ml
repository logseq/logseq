open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let shape collection all_lookup_refs single_lookup_ref all_blocks_with_uuid
    single_block_with_uuid : Property_build.reference_shape =
  {
    collection;
    all_lookup_refs;
    single_lookup_ref;
    all_blocks_with_uuid;
    single_block_with_uuid;
  }

let () =
  Fest.test "DB property reference planning preserves valid lookup refs"
    (fun () ->
      expect_equal "single lookup"
        (Property_build.plan_reference_value
           (shape false false true false false))
        Keep_reference;
      expect_equal "lookup set"
        (Property_build.plan_reference_value
           (shape true true false false false))
        Keep_reference;
      expect_equal "empty set"
        (Property_build.plan_reference_value (shape true true false true false))
        Keep_reference);
  Fest.test "DB property reference planning extracts valid block UUIDs"
    (fun () ->
      expect_equal "single block"
        (Property_build.plan_reference_value
           (shape false false false false true))
        Extract_block_uuid;
      expect_equal "block set"
        (Property_build.plan_reference_value
           (shape true false false true false))
        Extract_block_uuid_set);
  Fest.test "DB property reference planning rejects malformed values" (fun () ->
      expect_equal "scalar"
        (Property_build.plan_reference_value
           (shape false false false false false))
        Reject_reference;
      expect_equal "mixed set"
        (Property_build.plan_reference_value
           (shape true false false false false))
        Reject_reference);
  Fest.test "DB property value block planning selects stable field sources"
    (fun () ->
      expect_equal "page block and property entity"
        (Property_build.plan_value_block
           {
             block_has_page = true;
             property_is_default = false;
             property_has_id = true;
             value_content = true;
           })
        {
          page_source = Page_from_block;
          created_from_source = Created_from_property_entity;
          value_field = Property_value;
        };
      expect_equal "page self and property lookup"
        (Property_build.plan_value_block
           {
             block_has_page = false;
             property_is_default = false;
             property_has_id = false;
             value_content = false;
           })
        {
          page_source = Page_from_self;
          created_from_source = Created_from_property_lookup;
          value_field = Block_title;
        };
      expect_equal "default property uses the block"
        (Property_build.plan_value_block
           {
             block_has_page = true;
             property_is_default = true;
             property_has_id = true;
             value_content = false;
           })
        {
          page_source = Page_from_block;
          created_from_source = Created_from_block;
          value_field = Block_title;
        });
  Fest.test "DB closed value planning selects stable created-from sources"
    (fun () ->
      expect_equal "ordinary closed value"
        (Property_build.plan_closed_value
           { closed_property_is_default = false; closed_value_content = false })
        {
          closed_created_from_source = Closed_property_ident;
          closed_value_field = Block_title;
        };
      expect_equal "default closed value"
        (Property_build.plan_closed_value
           { closed_property_is_default = true; closed_value_content = true })
        {
          closed_created_from_source = Closed_block_lookup;
          closed_value_field = Property_value;
        });
  Fest.test "DB property transaction planning classifies value shapes"
    (fun () ->
      expect_equal "UUID set"
        (Property_build.plan_property_value
           {
             value_collection = true;
             all_values_uuid = true;
             single_value_uuid = false;
           })
        Uuid_set;
      expect_equal "value block set"
        (Property_build.plan_property_value
           {
             value_collection = true;
             all_values_uuid = false;
             single_value_uuid = false;
           })
        Value_block_set;
      expect_equal "UUID lookup"
        (Property_build.plan_property_value
           {
             value_collection = false;
             all_values_uuid = false;
             single_value_uuid = true;
           })
        Uuid_lookup;
      expect_equal "value block"
        (Property_build.plan_property_value
           {
             value_collection = false;
             all_values_uuid = false;
             single_value_uuid = false;
           })
        Value_block);
  Fest.test "DB closed value entry planning preserves property merges"
    (fun () ->
      expect_equal "entry properties"
        (Property_build.plan_closed_value_entry ~has_properties:true)
        Merge_entry_properties;
      expect_equal "empty entry properties"
        (Property_build.plan_closed_value_entry ~has_properties:false)
        Keep_entry_base);
  Fest.test "DB closed property planning selects the schema source" (fun () ->
      expect_equal "explicit schema"
        (Property_build.plan_property_schema ~has_explicit_schema:true)
        Explicit_property_schema;
      expect_equal "resolved schema"
        (Property_build.plan_property_schema ~has_explicit_schema:false)
        Resolve_property_schema)
