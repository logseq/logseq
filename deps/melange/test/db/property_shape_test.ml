open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB property shape recognizes property-created blocks" (fun () ->
      expect_equal "created block"
        (Property_shape.is_property_created_block ~is_map:true
           ~has_created_from_property:true ~has_page:true ~has_content:false)
        true;
      expect_equal "closed value"
        (Property_shape.is_property_created_block ~is_map:true
           ~has_created_from_property:true ~has_page:true ~has_content:true)
        false);
  Fest.test "DB property shape rejects incomplete property-created blocks"
    (fun () ->
      expect_equal "non-map"
        (Property_shape.is_property_created_block ~is_map:false
           ~has_created_from_property:true ~has_page:true ~has_content:false)
        false;
      expect_equal "missing source"
        (Property_shape.is_property_created_block ~is_map:true
           ~has_created_from_property:false ~has_page:true ~has_content:false)
        false;
      expect_equal "missing page"
        (Property_shape.is_property_created_block ~is_map:true
           ~has_created_from_property:true ~has_page:false ~has_content:false)
        false);
  Fest.test "DB property shape recognizes exact many cardinality" (fun () ->
      expect_equal "many" (Property_shape.is_many "db.cardinality/many") true;
      expect_equal "one" (Property_shape.is_many "db.cardinality/one") false;
      expect_equal "missing" (Property_shape.is_many "") false);
  Fest.test "DB property shape selects title before stored value" (fun () ->
      expect_equal "title"
        (Property_shape.select_content_source ~title_truthy:true)
        Property_shape.Title;
      expect_equal "value"
        (Property_shape.select_content_source ~title_truthy:false)
        Property_shape.Value)
