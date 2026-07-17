open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let empty : Validation_entity.shape =
  {
    reaction = false;
    property = false;
    class_ = false;
    page = false;
    hidden = false;
    whiteboard = false;
    asset = false;
    file = false;
    property_history = false;
    closed_value = false;
    created_from_property = false;
    property_value = false;
    empty_placeholder = false;
    uuid = false;
    ident = false;
  }

let () =
  Fest.test "DB validation entity dispatch preserves priority" (fun () ->
      expect_equal "reaction before property"
        (Validation_entity.dispatch
           { empty with reaction = true; property = true })
        (Some Validation_entity.Reaction_entity);
      expect_equal "property before class"
        (Validation_entity.dispatch
           { empty with property = true; class_ = true })
        (Some Validation_entity.Property);
      expect_equal "hidden page"
        (Validation_entity.dispatch { empty with page = true; hidden = true })
        (Some Validation_entity.Hidden);
      expect_equal "whiteboard"
        (Validation_entity.dispatch { empty with whiteboard = true })
        (Some Validation_entity.Normal_page));
  Fest.test "DB validation entity dispatch classifies block families" (fun () ->
      expect_equal "asset"
        (Validation_entity.dispatch { empty with asset = true })
        (Some Validation_entity.Asset_block);
      expect_equal "property value"
        (Validation_entity.dispatch
           {
             empty with
             created_from_property = true;
             property_value = true;
             uuid = true;
           })
        (Some Validation_entity.Property_value_block);
      expect_equal "empty placeholder"
        (Validation_entity.dispatch
           { empty with empty_placeholder = true; ident = true })
        (Some Validation_entity.Property_value_placeholder);
      expect_equal "normal block"
        (Validation_entity.dispatch { empty with uuid = true; ident = true })
        (Some Validation_entity.Block);
      expect_equal "key value"
        (Validation_entity.dispatch { empty with ident = true })
        (Some Validation_entity.Db_ident_key_value);
      expect_equal "unknown" (Validation_entity.dispatch empty) None)
