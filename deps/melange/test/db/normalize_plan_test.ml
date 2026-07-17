open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let expect_invalid label operation =
  try
    operation ();
    failwith (label ^ ": expected invalid argument")
  with Invalid_argument _ -> ()

let group indices tx : Normalize_plan.conflict_group =
  { indices = Rrbvec.of_array indices; tx = Some tx }

let group_without_tx indices : Normalize_plan.conflict_group =
  { indices = Rrbvec.of_array indices; tx = None }

let reorder index kind : Normalize_plan.reorder_entry = { index; kind }

let item index retract_block_uuid has_attr has_value : Normalize_plan.item_shape
    =
  { index; retract_block_uuid; has_attr; has_value }

let replacement index replacement_group : Normalize_plan.replacement_entry =
  { index; replacement_group }

let availability has_before_lookup has_after_tempid :
    Normalize_plan.resolution_availability =
  { has_before_lookup; has_after_tempid }

let datom added entity resolve_value value original_value_present :
    Normalize_plan.datom_shape =
  { added; entity; resolve_value; value; original_value_present }

let () =
  Fest.test "DB normalization keeps the last conflict and sorts by tx"
    (fun () ->
      let groups =
        Rrbvec.of_array
          [|
            group [| 0; 1 |] 3;
            group [| 2 |] 1;
            group [| 3 |] 1;
            group [| 4 |] 4;
          |]
      in
      expect_equal "selected indices"
        (Normalize_plan.select_conflict_indices groups |> Rrbvec.to_array)
        [| 2; 3; 1; 4 |];
      expect_equal "missing tx stays stable"
        (Normalize_plan.select_conflict_indices
           (Rrbvec.of_array [| group_without_tx [| 5 |]; group [| 6 |] 1 |])
        |> Rrbvec.to_array)
        [| 5; 6 |]);
  Fest.test "DB normalization stably sorts attribute priorities" (fun () ->
      expect_equal "priority indices"
        (Normalize_plan.sort_priority_indices
           (Rrbvec.of_array [| 3; 3; 3; 2; 0; 1; 3; 3 |])
        |> Rrbvec.to_array)
        [| 4; 5; 3; 0; 1; 2; 6; 7 |]);
  Fest.test "DB normalization reorders retract-entity groups stably" (fun () ->
      let entries =
        Rrbvec.of_array
          [|
            reorder 0 Recreated_retract;
            reorder 1 Other;
            reorder 2 Retracted_datom;
            reorder 3 Final_retract;
            reorder 4 Retracted_datom;
            reorder 5 Other;
          |]
      in
      expect_equal "retract order indices"
        (Normalize_plan.reorder_retract_indices entries |> Rrbvec.to_array)
        [| 0; 2; 4; 1; 5; 3 |]);
  Fest.test "DB normalization plans retract item replacements" (fun () ->
      let plans =
        Normalize_plan.plan_item_actions
          (Rrbvec.of_array
             [|
               item 0 true true true;
               item 1 false true true;
               item 2 false true false;
               item 3 false false true;
             |])
        |> Rrbvec.to_array
      in
      expect_equal "replacement plans" plans
        [|
          { index = 0; action = Retract_entity };
          { index = 1; action = Keep_item };
          { index = 2; action = Shorten_item };
          { index = 3; action = Shorten_item };
        |]);
  Fest.test "DB normalization retains unmarked item indices" (fun () ->
      expect_equal "retained indices"
        (Normalize_plan.retained_indices
           (Rrbvec.of_array [| false; true; false; true |])
        |> Rrbvec.to_array)
        [| 0; 2 |]);
  Fest.test "DB normalization emits one entity retraction per stable group"
    (fun () ->
      expect_equal "entity retraction plan"
        (Normalize_plan.plan_entity_retractions
           (Rrbvec.of_array
              [|
                replacement 0 (Some 0);
                replacement 1 (Some 0);
                replacement 2 None;
                replacement 3 (Some 1);
                replacement 4 (Some 1);
              |])
        |> Rrbvec.to_array)
        [| Emit_retraction 0; Keep_original 2; Emit_retraction 1 |]);
  Fest.test "DB normalization preserves an empty entity retraction plan"
    (fun () ->
      expect_equal "empty entity retraction plan"
        (Normalize_plan.plan_entity_retractions Rrbvec.empty |> Rrbvec.to_array)
        [||]);
  Fest.test "DB normalization rejects a negative replacement group" (fun () ->
      expect_invalid "negative replacement group" (fun () ->
          Normalize_plan.plan_entity_retractions
            (Rrbvec.singleton (replacement 0 (Some (-1))))
          |> ignore));
  Fest.test "DB normalization rejects an out-of-range replacement group"
    (fun () ->
      expect_invalid "out-of-range replacement group" (fun () ->
          Normalize_plan.plan_entity_retractions
            (Rrbvec.singleton (replacement 0 (Some 1)))
          |> ignore));
  Fest.test "DB normalization selects stable datom value sources" (fun () ->
      let before = availability true true in
      let after = availability false true in
      let missing = availability false false in
      expect_equal "add with original value"
        (Normalize_plan.plan_datom (datom true before false missing true))
        {
          operation = Add_datom;
          entity_source = Some Before_lookup;
          value_source = Some Original_value;
        };
      expect_equal "add with after tempid"
        (Normalize_plan.plan_datom (datom true after false missing true))
        {
          operation = Add_datom;
          entity_source = Some After_tempid;
          value_source = Some Original_value;
        };
      expect_equal "add with resolved ref"
        (Normalize_plan.plan_datom (datom true before true after true))
        {
          operation = Add_datom;
          entity_source = Some Before_lookup;
          value_source = Some After_tempid;
        };
      expect_equal "retract with resolved ref"
        (Normalize_plan.plan_datom (datom false before true before true))
        {
          operation = Retract_datom;
          entity_source = Some Before_lookup;
          value_source = Some Before_lookup;
        });
  Fest.test "DB normalization drops unresolved datoms" (fun () ->
      let before = availability true true in
      let after = availability false true in
      let missing = availability false false in
      let dropped : Normalize_plan.datom_plan =
        { operation = Drop_datom; entity_source = None; value_source = None }
      in
      expect_equal "retract never uses after tempid"
        (Normalize_plan.plan_datom (datom false after false missing true))
        dropped;
      expect_equal "missing resolved ref"
        (Normalize_plan.plan_datom (datom true before true missing true))
        dropped;
      expect_equal "missing original value"
        (Normalize_plan.plan_datom (datom true before false missing false))
        dropped)
