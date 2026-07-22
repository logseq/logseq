open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

type value = Id of int | Entity of int | Map of int

let snapshot id children referrers views : value Delete_workflow.snapshot =
  {
    value = Entity id;
    id = Some id;
    uuid = Some ("uuid-" ^ string_of_int id);
    page_ref = true;
    page = false;
    asset = false;
    title = Some ("Title " ^ string_of_int id);
    raw_title = None;
    children = Rrbvec.of_list (List.map (fun child -> Entity child) children);
    referrers =
      Rrbvec.of_list (List.map (fun referrer -> Entity referrer) referrers);
    history_block = None;
    history_property = None;
    history_ref_value = None;
    history_scalar = false;
    reactions = Rrbvec.empty;
    views = Rrbvec.of_list (List.map (fun view -> Entity view) views);
    histories = Rrbvec.empty;
  }

let entities =
  [
    (1, snapshot 1 [ 2 ] [ 9 ] [ 6 ]);
    (2, snapshot 2 [] [] []);
    (6, snapshot 6 [] [] []);
    (9, { (snapshot 9 [] [] []) with raw_title = Some "((uuid-1))" });
  ]

let capabilities : (unit, value) Delete_workflow.capabilities =
  {
    entity =
      (fun () -> function
        | Id id | Entity id ->
            List.assoc_opt id entities |> Option.map (fun _ -> Entity id)
        | Map _ -> None);
    snapshot =
      (function
      | Entity id | Map id -> List.assoc id entities
      | Id id -> List.assoc id entities);
    integer = (function Id id -> Some id | Entity _ | Map _ -> None);
    int_value = (fun id -> Id id);
    uuid_text =
      (function
      | Map id -> Some ("uuid-" ^ string_of_int id)
      | Id _ | Entity _ -> None);
    equal = ( = );
  }

let operation_text = function
  | Delete_plan.Retract_entity id -> "entity:" ^ string_of_int id
  | Retract_ref { entity_id; block_id } ->
      "ref:" ^ string_of_int entity_id ^ ":" ^ string_of_int block_id
  | Add_title { entity_id; title } ->
      "title:" ^ string_of_int entity_id ^ ":" ^ title
  | Retract_uuid uuid -> "uuid:" ^ uuid

let () =
  Fest.test "DB delete workflow expands current block descendants" (fun () ->
      let transaction : value Delete_workflow.transaction =
        {
          source = Map 100;
          kind =
            Retract_entity_tx { operation = "db/retractEntity"; target = Id 1 };
        }
      in
      let result =
        Delete_workflow.expand capabilities () ~delete_blocks:true
          (Rrbvec.singleton transaction)
      in
      expect_equal "expanded"
        (result
        |> Rrbvec.map (function
          | Delete_workflow.Existing _ -> "existing"
          | Planned operation -> operation_text operation)
        |> Rrbvec.to_list)
        [ "existing"; "entity:2" ]);
  Fest.test "DB delete workflow owns recursive cleanup planning" (fun () ->
      let transactions =
        Rrbvec.singleton
          ({
             Delete_workflow.source = Map 100;
             kind =
               Retract_entity_tx
                 { operation = "db/retractEntity"; target = Id 1 };
           }
            : value Delete_workflow.transaction)
      in
      expect_equal "cleanup"
        (Delete_workflow.cleanup capabilities () transactions
        |> Rrbvec.map operation_text |> Rrbvec.to_list)
        [ "ref:9:1"; "title:9:Title 1"; "entity:6" ])
