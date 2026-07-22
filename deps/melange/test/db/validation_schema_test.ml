open Melange_db
open Validation_schema

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let attr ?text ?(truthy = true) ?(non_nil = true) ?(special_valid = true)
    ?(special_message = "") name kind : Validation_schema.attribute =
  { name; kind; text; truthy; non_nil; special_valid; special_message }

let normal_block_attributes =
  Rrbvec.of_list
    [
      attr "block/uuid" Uuid;
      attr "block/created-at" Int;
      attr "block/updated-at" Int;
      attr "block/title" String;
      attr "block/parent" Int;
      attr ~text:"a0" "block/order" String;
      attr "block/page" Int;
    ]

let error_categories errors =
  errors |> Rrbvec.map Validation_schema.error_category |> Rrbvec.to_list

let () =
  Fest.test "DB validation schema accepts a closed normal block" (fun () ->
      expect_equal "valid block"
        (Validation_schema.validate_entity ~closed:true Validation_entity.Block
           normal_block_attributes)
        Rrbvec.empty);
  Fest.test "DB validation schema reports missing and invalid attributes"
    (fun () ->
      let missing_uuid =
        normal_block_attributes
        |> Rrbvec.filter (fun attribute ->
            not (String.equal attribute.name "block/uuid"))
      in
      expect_equal "missing UUID category"
        (Validation_schema.validate_entity ~closed:true Validation_entity.Block
           missing_uuid
        |> error_categories)
        [ Validation_schema.Missing ];
      let bad_title =
        normal_block_attributes
        |> Rrbvec.map (fun attribute ->
            if String.equal attribute.name "block/title" then
              { attribute with kind = Int }
            else attribute)
      in
      expect_equal "title type category"
        (Validation_schema.validate_entity ~closed:true Validation_entity.Block
           bad_title
        |> error_categories)
        [ Validation_schema.Type ]);
  Fest.test "DB validation schema enforces closed maps" (fun () ->
      let with_extra =
        Rrbvec.push_back normal_block_attributes (attr "kv/value" Int)
      in
      expect_equal "closed extra"
        (Validation_schema.validate_entity ~closed:true Validation_entity.Block
           with_extra
        |> error_categories)
        [ Validation_schema.Unknown ];
      expect_equal "open extra"
        (Validation_schema.validate_entity ~closed:false Validation_entity.Block
           with_extra)
        Rrbvec.empty);
  Fest.test "DB validation schema checks alternatives and custom values"
    (fun () ->
      let history =
        Rrbvec.of_list
          [
            attr "block/uuid" Uuid;
            attr "block/created-at" Int;
            attr "logseq.property.history/block" Int;
            attr "logseq.property.history/property" Int;
          ]
      in
      expect_equal "history alternative"
        (Validation_schema.validate_entity ~closed:true
           Validation_entity.Property_history_block history
        |> error_categories)
        [ Validation_schema.Value ];
      let invalid_order =
        normal_block_attributes
        |> Rrbvec.map (fun attribute ->
            if String.equal attribute.name "block/order" then
              { attribute with text = Some "a-test" }
            else attribute)
      in
      expect_equal "order"
        (Validation_schema.validate_entity ~closed:true Validation_entity.Block
           invalid_order
        |> error_categories)
        [ Validation_schema.Value ]);
  Fest.test "DB validation schema validates property identity and type"
    (fun () ->
      let user_property =
        Rrbvec.of_list
          [
            attr "block/uuid" Uuid;
            attr "block/created-at" Int;
            attr "block/updated-at" Int;
            attr "block/name" String;
            attr "block/title" String;
            attr ~text:"user.property/score" "db/ident" Keyword;
            attr ~text:"number" "logseq.property/type" Keyword;
          ]
      in
      expect_equal "valid user property"
        (Validation_schema.validate_entity ~closed:true
           Validation_entity.Property user_property)
        Rrbvec.empty;
      let invalid_type =
        user_property
        |> Rrbvec.map (fun attribute ->
            if String.equal attribute.name "logseq.property/type" then
              { attribute with text = Some "raw-number" }
            else attribute)
      in
      expect_equal "invalid user property type"
        (Validation_schema.validate_entity ~closed:true
           Validation_entity.Property invalid_type
        |> error_categories)
        [ Validation_schema.Value ]);
  Fest.test "DB validation schema owns whole-database preparation order"
    (fun () ->
      let calls = ref [] in
      let validation : Validation_schema.validation_result =
        {
          dispatch_key = Some "block";
          errors =
            Rrbvec.singleton
              {
                attribute = Some "block/title";
                messages = Rrbvec.singleton "should be a string";
              };
          error_details = Rrbvec.empty;
        }
      in
      let capabilities : (int, int, int) Validation_schema.database_capabilities
          =
        {
          scan_all_datoms =
            (fun database ->
              calls := ("scan", string_of_int database) :: !calls;
              [| 1; 2; 3 |]);
          assemble_entities =
            (fun datoms ->
              calls :=
                ("assemble", string_of_int (Array.length datoms)) :: !calls;
              [| 10; 20 |]);
          remove_field =
            (fun entity field ->
              calls := ("remove", string_of_int entity ^ ":" ^ field) :: !calls;
              entity);
          prepare_entities =
            (fun database entities ->
              calls :=
                ( "prepare",
                  string_of_int database ^ ":"
                  ^ string_of_int (Array.length entities) )
                :: !calls;
              Array.map (fun entity -> entity + 1) entities);
          validate_entities =
            (fun database entities ->
              calls :=
                ( "validate",
                  string_of_int database ^ ":"
                  ^ string_of_int (Rrbvec.nth entities 0) )
                :: !calls;
              Rrbvec.singleton { entity = Rrbvec.nth entities 0; validation });
        }
      in
      let result = Validation_schema.validate_database_with capabilities 7 in
      expect_equal "datom count" result.datom_count 3;
      expect_equal "original entities"
        (Rrbvec.to_list result.entities)
        [ 10; 20 ];
      expect_equal "prepared error entity"
        (result.errors
        |> Rrbvec.map (fun error -> error.entity)
        |> Rrbvec.to_list)
        [ 11 ];
      expect_equal "workflow calls" (List.rev !calls)
        [
          ("scan", "7");
          ("assemble", "3");
          ("remove", "10:block.temp/load-status");
          ("remove", "10:block.temp/has-children?");
          ("remove", "20:block.temp/load-status");
          ("remove", "20:block.temp/has-children?");
          ("prepare", "7:2");
          ("validate", "7:11");
        ])
