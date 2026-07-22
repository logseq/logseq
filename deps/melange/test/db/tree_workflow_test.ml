open Melange_db

type entity = {
  id : int;
  order : string;
  mutable children : entity Rrbvec.t;
  mutable raw_children : entity Rrbvec.t;
  query_child : entity option;
}

type sibling_entity = { sibling_id : int; sibling_order : string }

let sibling sibling_id sibling_order = { sibling_id; sibling_order }

let entity ?(order = "") ?query_child id =
  {
    id;
    order;
    children = Rrbvec.empty;
    raw_children = Rrbvec.empty;
    query_child;
  }

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let ids values = values |> Rrbvec.map (fun value -> value.id) |> Rrbvec.to_array

let () =
  Fest.test "DB tree workflow sorts entities stably" (fun () ->
      let values =
        Rrbvec.of_array
          [|
            entity ~order:"a2" 1;
            entity ~order:"a0" 2;
            entity ~order:"a1" 3;
            entity ~order:"a1" 4;
          |]
      in
      expect_equal "stable order"
        (Tree_workflow.sort_with ~order:(fun value -> value.order) values |> ids)
        [| 2; 3; 4; 1 |]);
  Fest.test "DB tree workflow owns property-child traversal" (fun () ->
      let query = entity ~order:"a0z" 4 in
      let first = entity ~order:"a1" 1 in
      let second = entity ~order:"a0" ~query_child:query 2 in
      let nested = entity ~order:"a0" 3 in
      let root = entity 0 in
      first.children <- Rrbvec.singleton nested;
      first.raw_children <- Rrbvec.singleton nested;
      root.children <- Rrbvec.of_array [| first; second |];
      root.raw_children <- Rrbvec.of_array [| first; second |];
      let capabilities : (entity, int) Tree_workflow.capabilities =
        {
          id = (fun value -> value.id);
          equal_id = Int.equal;
          order = (fun value -> value.order);
          children = (fun value -> value.children);
          raw_children = (fun value -> value.raw_children);
          query_child = (fun value -> value.query_child);
        }
      in
      expect_equal "regular children"
        (Tree_workflow.block_and_children_with capabilities
           ~include_property_blocks:false root
        |> ids)
        [| 0; 2; 1; 3 |];
      expect_equal "property children"
        (Tree_workflow.block_and_children_with capabilities
           ~include_property_blocks:true root
        |> ids)
        [| 0; 2; 4; 1; 3 |]);
  Fest.test "DB tree workflow rejects parent cycles" (fun () ->
      let root = entity 0 in
      let child = entity 1 in
      root.children <- Rrbvec.singleton child;
      child.children <- Rrbvec.singleton root;
      let capabilities : (entity, int) Tree_workflow.capabilities =
        {
          id = (fun value -> value.id);
          equal_id = Int.equal;
          order = (fun value -> value.order);
          children = (fun value -> value.children);
          raw_children = (fun value -> value.raw_children);
          query_child = (fun value -> value.query_child);
        }
      in
      let failed =
        try
          ignore
            (Tree_workflow.block_and_children_with capabilities
               ~include_property_blocks:false root);
          false
        with Invalid_argument _ -> true
      in
      expect_equal "cycle" failed true);
  Fest.test "DB tree workflow owns sibling source and exclusion rules"
    (fun () ->
      let parent = sibling 10 "" in
      let closed_group = sibling 100 "" in
      let created_group = sibling 200 "" in
      let closed = sibling 1 "a1" in
      let created = sibling 2 "a1" in
      let normal = sibling 3 "a1" in
      let right = sibling 4 "a2" in
      let excluded = sibling 5 "a15" in
      let created_right = sibling 6 "a2" in
      let closed_right = sibling 7 "a2" in
      let capabilities :
          (sibling_entity, int) Tree_workflow.sibling_capabilities =
        {
          sibling_id = (fun value -> value.sibling_id);
          sibling_equal_id = Int.equal;
          sibling_order = (fun value -> value.sibling_order);
          parent = (fun _ -> Some parent);
          closed_property =
            (fun value ->
              if value.sibling_id = 1 || value.sibling_id = 7 then
                Some closed_group
              else None);
          created_from =
            (fun value ->
              if
                value.sibling_id = 2 || value.sibling_id = 5
                || value.sibling_id = 6
              then Some created_group
              else None);
          closed_children =
            (fun _ -> Rrbvec.of_array [| closed; closed_right |]);
          raw_children =
            (fun _ ->
              Rrbvec.of_array
                [| closed; created; normal; excluded; right; created_right |]);
          normal_children =
            (fun _ ->
              Rrbvec.of_array [| closed; created; normal; excluded; right |]);
        }
      in
      expect_equal "closed sibling"
        (Tree_workflow.sibling_with capabilities ~direction:Right closed
        |> Option.map (fun value -> value.sibling_id))
        (Some 7);
      expect_equal "created sibling"
        (Tree_workflow.sibling_with capabilities ~direction:Right created
        |> Option.map (fun value -> value.sibling_id))
        (Some 5);
      expect_equal "normal sibling excludes property children"
        (Tree_workflow.sibling_with capabilities ~direction:Right normal
        |> Option.map (fun value -> value.sibling_id))
        (Some 4));
  Fest.test "DB tree workflow owns child lookup, sorting, and selection"
    (fun () ->
      let root = entity 10 in
      let first = entity ~order:"a1" 1 in
      let second = entity ~order:"a0" 2 in
      root.children <- Rrbvec.of_array [| first; second |];
      let capabilities : (entity, int) Tree_workflow.child_capabilities =
        {
          child_order = (fun value -> value.order);
          child_entities = (fun value -> value.children);
          child_by_id = (fun id -> if id = 10 then Some root else None);
          child_by_uuid = (fun id -> if id = 20 then Some root else None);
        }
      in
      expect_equal "entity children"
        (Tree_workflow.children_with capabilities (Entity root)
        |> Option.map ids)
        (Some [| 2; 1 |]);
      expect_equal "id first child"
        (Tree_workflow.first_child_with capabilities (Id 10)
        |> Option.map (fun value -> value.id))
        (Some 2);
      expect_equal "uuid children"
        (Tree_workflow.children_with capabilities (Uuid 20) |> Option.map ids)
        (Some [| 2; 1 |]);
      expect_equal "missing parent"
        (Tree_workflow.children_with capabilities (Id 99))
        None)
