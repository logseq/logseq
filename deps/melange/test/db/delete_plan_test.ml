open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let expect_string_list label actual expected =
  if actual <> expected then
    failwith
      (label ^ ": actual [" ^ String.concat "; " actual ^ "] expected ["
      ^ String.concat "; " expected
      ^ "]")

let ids values = Rrbvec.of_list values

let node id block children : Delete_plan.node =
  { id; block; children = ids children }

let referrer id raw_title : Delete_plan.referrer = { id; raw_title }

let block id uuid title asset referrers : Delete_plan.block =
  { id; uuid; title = Some title; asset; referrers = Rrbvec.of_list referrers }

let entity id block history reactions views histories : Delete_plan.entity =
  {
    id;
    block;
    history;
    reactions = ids reactions;
    views = ids views;
    histories = ids histories;
  }

let operation_text = function
  | Delete_plan.Retract_entity id -> "entity:" ^ string_of_int id
  | Retract_ref { entity_id; block_id } ->
      "ref:" ^ string_of_int entity_id ^ ":" ^ string_of_int block_id
  | Add_title { entity_id; title } ->
      "title:" ^ string_of_int entity_id ^ ":" ^ title
  | Retract_uuid uuid -> "uuid:" ^ uuid

let operation_texts operations =
  operations |> Rrbvec.map operation_text |> Rrbvec.to_list

let () =
  Fest.test "DB delete planning expands block subtrees" (fun () ->
      let nodes =
        Rrbvec.of_list
          [
            node 1 true [ 2; 3 ];
            node 2 true [ 4 ];
            node 3 false [ 5 ];
            node 4 true [];
            node 5 true [];
          ]
      in
      expect_equal "subtree"
        (Delete_plan.expand_retract_ids ~root_ids:(ids [ 1; 3 ]) nodes
        |> Rrbvec.to_list)
        [ 1; 2; 4 ]);
  Fest.test "DB delete planning builds cleanup transactions" (fun () ->
      let target =
        block 1 "00000000-0000-0000-0000-000000000001" "Target" false
          [
            referrer 9
              (Some
                 "{{embed ((00000000-0000-0000-0000-000000000001))}} and \
                  ((00000000-0000-0000-0000-000000000001))");
            referrer 6 (Some "deleted view");
          ]
      in
      let entities =
        Rrbvec.of_list
          [
            entity 1 (Some target) false [ 7 ] [ 6 ] [ 8 ];
            entity 5 None true [] [] [];
          ]
      in
      expect_string_list "operations"
        (Delete_plan.direct_cleanup entities |> operation_texts)
        [
          "ref:9:1";
          "title:9:Target and Target";
          "ref:6:1";
          "entity:6";
          "entity:5";
          "entity:8";
          "entity:7";
        ]);
  Fest.test "DB delete planning uses blank content for assets" (fun () ->
      let target =
        block 2 "00000000-0000-0000-0000-000000000002" "Asset" true
          [ referrer 9 (Some "[[00000000-0000-0000-0000-000000000002]]") ]
      in
      expect_string_list "asset"
        (Delete_plan.direct_cleanup
           (Rrbvec.of_list [ entity 2 (Some target) false [] [] [] ])
        |> operation_texts)
        [ "ref:9:2"; "title:9:" ]);
  Fest.test "DB delete planning cleans only blocks referenced by each entity"
    (fun () ->
      let first =
        block 1 "00000000-0000-0000-0000-000000000001" "First" false
          [
            referrer 9
              (Some "((00000000-0000-0000-0000-000000000001))");
          ]
      in
      let second =
        block 2 "00000000-0000-0000-0000-000000000002" "Second" false
          [
            referrer 10
              (Some "((00000000-0000-0000-0000-000000000002))");
          ]
      in
      expect_string_list "per-referrer blocks"
        (Delete_plan.direct_cleanup
           (Rrbvec.of_list
              [
                entity 1 (Some first) false [] [] [];
                entity 2 (Some second) false [] [] [];
              ])
        |> operation_texts)
        [
          "ref:9:1";
          "title:9:First";
          "ref:10:2";
          "title:10:Second";
        ]);
  Fest.test "DB delete planning removes new orphaned histories" (fun () ->
      let candidates : Delete_plan.history_candidate Rrbvec.t =
        Rrbvec.of_list
          [
            {
              Delete_plan.target = Delete_plan.By_uuid "history-uuid";
              block_id = Some 1;
              property_id = Some 20;
              ref_value_id = None;
              own_ref_retracted = false;
            };
            {
              Delete_plan.target = By_id 40;
              block_id = Some 30;
              property_id = Some 20;
              ref_value_id = None;
              own_ref_retracted = true;
            };
          ]
      in
      expect_string_list "history"
        (Delete_plan.new_history_retracts ~retracted_ids:(ids [ 1 ]) candidates
        |> operation_texts)
        [ "uuid:history-uuid"; "entity:40" ])
