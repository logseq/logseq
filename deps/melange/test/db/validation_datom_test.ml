open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let entry ?(schema_many = false) ?(value_truthy = true) ?(value_is_set = false)
    index entity_id attribute : Validation_datom.entry =
  { index; entity_id; attribute; schema_many; value_truthy; value_is_set }

let action_kind = Validation_datom.kind

let () =
  Fest.test "DB validation datoms accumulate schema-many values" (fun () ->
      let actions =
        Validation_datom.plan
          (Rrbvec.of_list
             [
               entry ~schema_many:true 0 1 "block/tags";
               entry ~schema_many:true 1 1 "block/tags";
             ])
      in
      expect_equal "schema-many actions"
        (Rrbvec.map action_kind actions |> Rrbvec.to_list)
        [ Validation_datom.Begin_set; Add_set ]);
  Fest.test "DB validation datoms promote duplicate scalar attributes"
    (fun () ->
      let actions =
        Validation_datom.plan
          (Rrbvec.of_list
             [
               entry 0 1 "block/title";
               entry 1 1 "block/title";
               entry 2 1 "block/title";
             ])
      in
      expect_equal "duplicate scalar actions"
        (Rrbvec.map action_kind actions |> Rrbvec.to_list)
        [ Validation_datom.Assign; Start_set; Add_set ];
      expect_equal "previous scalar index"
        (Validation_datom.previous_index (Rrbvec.nth actions 1))
        (Some 0));
  Fest.test "DB validation datoms preserve false overwrite semantics" (fun () ->
      let actions =
        Validation_datom.plan
          (Rrbvec.of_list
             [
               entry ~value_truthy:false 0 1 "block/collapsed?";
               entry 1 1 "block/collapsed?";
             ])
      in
      expect_equal "false overwrite actions"
        (Rrbvec.map action_kind actions |> Rrbvec.to_list)
        [ Validation_datom.Assign; Assign ]);
  Fest.test "DB validation datoms recognize an existing set value" (fun () ->
      let actions =
        Validation_datom.plan
          (Rrbvec.of_list
             [
               entry ~value_is_set:true 0 1 "custom/value";
               entry 1 1 "custom/value";
             ])
      in
      expect_equal "set-valued scalar actions"
        (Rrbvec.map action_kind actions |> Rrbvec.to_list)
        [ Validation_datom.Assign; Add_set ])
