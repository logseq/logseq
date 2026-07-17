open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB validation property owns required property exceptions"
    (fun () ->
      expect_equal "asset required"
        (Rrbvec.mem "logseq.property.asset/type"
           Validation_property.required_properties)
        true;
      expect_equal "property value required"
        (Rrbvec.mem "logseq.property/value"
           Validation_property.required_properties)
        true;
      expect_equal "schema property exception"
        (Validation_property.attribute_action ~attribute:"logseq.property/hide?"
           ~is_property:true ~property_exists:true)
        Validation_property.Keep;
      expect_equal "required property exception"
        (Validation_property.attribute_action
           ~attribute:"logseq.property.asset/type" ~is_property:true
           ~property_exists:true)
        Validation_property.Keep);
  Fest.test "DB validation property classifies prepared attributes" (fun () ->
      expect_equal "tags"
        (Validation_property.attribute_action ~attribute:"block/tags"
           ~is_property:true ~property_exists:true)
        Validation_property.Prepare_tags;
      expect_equal "user property"
        (Validation_property.attribute_action ~attribute:"user.property/score"
           ~is_property:true ~property_exists:true)
        Validation_property.Move_property;
      expect_equal "missing property entity"
        (Validation_property.attribute_action ~attribute:"user.property/score"
           ~is_property:true ~property_exists:false)
        Validation_property.Keep;
      expect_equal "ordinary attribute"
        (Validation_property.attribute_action ~attribute:"block/title"
           ~is_property:false ~property_exists:false)
        Validation_property.Keep);
  Fest.test "DB validation property plans typed value validation" (fun () ->
      let plan =
        Validation_property.plan_value_validation
          ~property_type:(Some "default")
          ~cardinality:(Some "db.cardinality/many") ~closed_values_validate:true
          ~new_closed_value:false ~has_closed_values:true
      in
      expect_equal "many" (Validation_property.many plan) true;
      expect_equal "uses DB" (Validation_property.uses_db plan) true;
      expect_equal "closed membership"
        (Validation_property.closed_membership_required plan)
        true;
      let scalar_plan =
        Validation_property.plan_value_validation
          ~property_type:(Some "checkbox")
          ~cardinality:(Some "db.cardinality/one") ~closed_values_validate:true
          ~new_closed_value:false ~has_closed_values:true
      in
      expect_equal "scalar" (Validation_property.many scalar_plan) false;
      expect_equal "scalar without DB"
        (Validation_property.uses_db scalar_plan)
        false;
      expect_equal "unsupported closed membership"
        (Validation_property.closed_membership_required scalar_plan)
        false);
  Fest.test "DB validation property combines value results" (fun () ->
      let open Validation_property in
      let many_plan =
        plan_value_validation ~property_type:(Some "default")
          ~cardinality:(Some "db.cardinality/many") ~closed_values_validate:true
          ~new_closed_value:false ~has_closed_values:true
      in
      expect_equal "valid closed values"
        (validate_value_results many_plan
           (Rrbvec.of_list
              [
                { base_valid = true; closed_value_member = true };
                { base_valid = true; closed_value_member = true };
              ])
           ~empty_placeholder:false)
        true;
      expect_equal "invalid closed value"
        (validate_value_results many_plan
           (Rrbvec.of_list
              [ { base_valid = true; closed_value_member = false } ])
           ~empty_placeholder:false)
        false;
      expect_equal "placeholder override"
        (validate_value_results many_plan
           (Rrbvec.of_list
              [ { base_valid = false; closed_value_member = false } ])
           ~empty_placeholder:true)
        true);
  Fest.test "DB validation property owns stable error messages" (fun () ->
      [
        ("string", "should be a string");
        ("json", "should be JSON string");
        ("raw-number", "should be a raw number");
        ("entity", "should be an Entity");
        ("class", "should be a Class");
        ("property", "should be a Property");
        ("page", "should be a Page");
        ("keyword", "should be a Clojure keyword");
        ("map", "should be a Clojure map");
        ("coll", "should be a collection");
        ("any", "should be non-nil");
        ("default", "should be a text block");
        ("number", "should be a number");
        ("date", "should be a journal date");
        ("datetime", "should be a datetime");
        ("checkbox", "should be a boolean");
        ("url", "should be a URL");
        ("node", "should be a node with a title");
        ("asset", "should be an asset node");
      ]
      |> List.iter (fun (property_type, expected) ->
          expect_equal property_type
            (Validation_property.error_message property_type)
            expected);
      expect_equal "unknown"
        (Validation_property.error_message "unknown")
        "should have a registered property type";
      expect_equal "registered"
        (Validation_property.registered_property_type "number")
        true;
      expect_equal "unregistered"
        (Validation_property.registered_property_type "unknown")
        false)
