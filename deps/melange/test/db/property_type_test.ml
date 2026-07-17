open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let names values =
  values |> Rrbvec.map Property_type.to_string |> Rrbvec.to_array

let () =
  Fest.test "DB property type inference owns scalar decisions" (fun () ->
      Fest.equal
        (Property_type.infer ~number:true ~url:false ~boolean:false
        |> Property_type.to_string)
        "number" Fest.expect;
      Fest.equal
        (Property_type.infer ~number:false ~url:true ~boolean:false
        |> Property_type.to_string)
        "url" Fest.expect;
      Fest.equal
        (Property_type.infer ~number:false ~url:false ~boolean:true
        |> Property_type.to_string)
        "checkbox" Fest.expect;
      Fest.equal
        (Property_type.infer ~number:false ~url:false ~boolean:false
        |> Property_type.to_string)
        "default" Fest.expect);
  Fest.test "property type catalogs preserve values and legacy order" (fun () ->
      expect_equal "internal"
        (names Property_type.internal_built_in)
        [|
          "raw-number";
          "property";
          "coll";
          "page";
          "string";
          "keyword";
          "class";
          "json";
          "entity";
          "map";
          "any";
        |];
      expect_equal "user"
        (names Property_type.user_built_in)
        [|
          "default";
          "number";
          "date";
          "datetime";
          "checkbox";
          "url";
          "node";
          "asset";
        |];
      expect_equal "user allowed internal"
        (names Property_type.user_allowed_internal)
        [| "map"; "json"; "string" |];
      expect_equal "closed value"
        (names Property_type.closed_value)
        [| "default"; "number"; "url" |];
      expect_equal "cardinality"
        (names Property_type.cardinality)
        [| "default"; "number"; "url"; "date"; "node"; "asset" |];
      expect_equal "default value ref"
        (names Property_type.default_value_ref)
        [| "default"; "number"; "checkbox" |];
      expect_equal "text ref"
        (names Property_type.text_ref)
        [| "default"; "url"; "entity" |];
      expect_equal "original value ref"
        (names Property_type.original_value_ref)
        [| "number" |];
      expect_equal "value ref"
        (names Property_type.value_ref)
        [| "default"; "url"; "number" |];
      expect_equal "user ref"
        (names Property_type.user_ref)
        [| "date"; "node"; "asset"; "default"; "url"; "number" |];
      expect_equal "all ref"
        (names Property_type.all_ref)
        [|
          "date";
          "number";
          "default";
          "property";
          "page";
          "node";
          "class";
          "url";
          "entity";
          "asset";
        |];
      expect_equal "with DB"
        (names Property_type.with_db)
        [|
          "date";
          "number";
          "default";
          "property";
          "page";
          "node";
          "class";
          "url";
          "entity";
          "asset";
        |]);
  Fest.test "property value content planning preserves storage-field decisions"
    (fun () ->
      expect_equal "number property"
        (Property_type.property_value_content
           ~property_type:(Property_type.of_string "number")
           ~property_is_default:false ~block_type:None)
        true;
      expect_equal "default value number block"
        (Property_type.property_value_content
           ~property_type:(Property_type.of_string "default")
           ~property_is_default:true
           ~block_type:(Property_type.of_string "number"))
        true;
      expect_equal "non-default number block"
        (Property_type.property_value_content
           ~property_type:(Property_type.of_string "default")
           ~property_is_default:false
           ~block_type:(Property_type.of_string "number"))
        false;
      expect_equal "default value text block"
        (Property_type.property_value_content ~property_type:None
           ~property_is_default:true
           ~block_type:(Property_type.of_string "default"))
        false;
      expect_equal "missing types"
        (Property_type.property_value_content ~property_type:None
           ~property_is_default:false ~block_type:None)
        false)
