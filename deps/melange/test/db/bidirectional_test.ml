open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let class_ref ?(class_ = true) ?(built_in = false) ?(recycled = false)
    ?(enabled = true) ?created_at id : Bidirectional.class_ref =
  { id; class_; built_in; recycled; enabled; created_at }

let candidate ?(target = false) ?(recycled = false) ?(class_ = false)
    ?(property = false) ?created_at entity_id classes : Bidirectional.candidate
    =
  {
    entity_id;
    target;
    recycled;
    class_;
    property;
    created_at;
    classes = Rrbvec.of_list classes;
  }

let group_values groups =
  groups
  |> Rrbvec.map (fun group ->
      ( Bidirectional.group_class_id group,
        Bidirectional.group_entity_ids group |> Rrbvec.to_list ))
  |> Rrbvec.to_list

type workflow_value = Text of string | Entity_value of workflow_entity

and workflow_entity = {
  workflow_id : int;
  workflow_title : string;
  workflow_created_at : float option;
  workflow_class : bool;
  workflow_property : bool;
  workflow_built_in : bool;
  workflow_recycled : bool;
  workflow_enabled : bool;
  workflow_created_from : bool;
  workflow_tags : workflow_entity Rrbvec.t;
  workflow_custom_title : workflow_value option;
}

let () =
  Fest.test "DB bidirectional reads filter invalid entities and classes"
    (fun () ->
      let groups =
        Bidirectional.groups ~target_id:99
          (Rrbvec.of_list
             [
               candidate 99 [ class_ref 10 ];
               candidate ~recycled:true 1 [ class_ref 10 ];
               candidate ~class_:true 2 [ class_ref 10 ];
               candidate ~property:true 3 [ class_ref 10 ];
               candidate 31 [ class_ref ~class_:false 10 ];
               candidate 4 [ class_ref ~built_in:true 10 ];
               candidate 5 [ class_ref ~recycled:true 10 ];
               candidate 6 [ class_ref ~enabled:false 10 ];
               candidate 7 [ class_ref 11 ];
             ])
      in
      expect_equal "filtered" (group_values groups) [ (11, [ 7 ]) ]);
  Fest.test "DB bidirectional reads deduplicate repeated property hits"
    (fun () ->
      let groups =
        Bidirectional.groups ~target_id:99
          (Rrbvec.of_list
             [
               candidate ~created_at:20. 1 [ class_ref 10 ];
               candidate ~created_at:20. 1 [ class_ref 10 ];
               candidate ~created_at:10. 2 [ class_ref 10 ];
             ])
      in
      expect_equal "deduplicated and sorted" (group_values groups)
        [ (10, [ 2; 1 ]) ]);
  Fest.test "DB bidirectional reads preserve class and missing-time order"
    (fun () ->
      let groups =
        Bidirectional.groups ~target_id:99
          (Rrbvec.of_list
             [
               candidate ~created_at:20. 1
                 [ class_ref ~created_at:20. 20; class_ref ~created_at:10. 10 ];
               candidate 2 [ class_ref ~created_at:20. 20 ];
               candidate ~created_at:20. 3 [ class_ref ~created_at:20. 20 ];
             ])
      in
      expect_equal "stable groups" (group_values groups)
        [ (10, [ 1 ]); (20, [ 2; 1; 3 ]) ]);
  Fest.test "DB bidirectional reads own query grouping and title workflow"
    (fun () ->
      let class_entity =
        {
          workflow_id = 10;
          workflow_title = "Person";
          workflow_created_at = Some 5.;
          workflow_class = true;
          workflow_property = false;
          workflow_built_in = false;
          workflow_recycled = false;
          workflow_enabled = true;
          workflow_created_from = false;
          workflow_tags = Rrbvec.empty;
          workflow_custom_title = None;
        }
      in
      let node_one =
        {
          workflow_id = 1;
          workflow_title = "One";
          workflow_created_at = Some 20.;
          workflow_class = false;
          workflow_property = false;
          workflow_built_in = false;
          workflow_recycled = false;
          workflow_enabled = false;
          workflow_created_from = false;
          workflow_tags = Rrbvec.singleton class_entity;
          workflow_custom_title = None;
        }
      in
      let node_two =
        {
          workflow_id = 2;
          workflow_title = "Two";
          workflow_created_at = Some 10.;
          workflow_class = false;
          workflow_property = false;
          workflow_built_in = false;
          workflow_recycled = false;
          workflow_enabled = false;
          workflow_created_from = false;
          workflow_tags = Rrbvec.singleton class_entity;
          workflow_custom_title = None;
        }
      in
      let target =
        {
          workflow_id = 99;
          workflow_title = "Target";
          workflow_created_at = None;
          workflow_class = false;
          workflow_property = false;
          workflow_built_in = false;
          workflow_recycled = false;
          workflow_enabled = false;
          workflow_created_from = false;
          workflow_tags = Rrbvec.empty;
          workflow_custom_title = None;
        }
      in
      let entities = [ class_entity; node_one; node_two; target ] in
      let entity id =
        List.find_opt (fun value -> value.workflow_id = id) entities
      in
      let capabilities :
          (workflow_entity, workflow_value) Bidirectional.workflow_capabilities
          =
        {
          query_property_attrs =
            (fun _query ->
              Rrbvec.of_list [ "user.property/ref"; "block/title" ]);
          referenced_entity_ids =
            (fun attribute _target_id ->
              if attribute = "user.property/ref" then
                Rrbvec.of_list [ 1; 1; 99; 2 ]
              else Rrbvec.empty);
          entity;
          entity_id = (fun value -> value.workflow_id);
          recycled = (fun value -> value.workflow_recycled);
          class_value = (fun value -> value.workflow_class);
          property_value = (fun value -> value.workflow_property);
          created_at = (fun value -> value.workflow_created_at);
          classes = (fun value -> value.workflow_tags);
          built_in = (fun value -> value.workflow_built_in);
          bidirectional_enabled = (fun value -> value.workflow_enabled);
          created_from_property = (fun value -> value.workflow_created_from);
          custom_title = (fun value -> value.workflow_custom_title);
          value_is_string =
            (function Text _ -> true | Entity_value _ -> false);
          string_from_value =
            (function Text value -> value | _ -> assert false);
          property_value_content =
            (function
            | Entity_value value -> value.workflow_title
            | Text value -> value);
          title = (fun value -> value.workflow_title);
          plural = (fun value -> value ^ "s");
        }
      in
      let result =
        Bidirectional.groups_with capabilities ~target_id:99
        |> Option.get |> Rrbvec.to_list
      in
      expect_equal "one group" (List.length result) 1;
      let group = List.hd result in
      expect_equal "plural title" (Bidirectional.resolved_title group) "Persons";
      expect_equal "class entity"
        (Bidirectional.resolved_class group).workflow_id 10;
      expect_equal "sorted entities"
        (Bidirectional.resolved_entities group
        |> Rrbvec.map (fun value -> value.workflow_id)
        |> Rrbvec.to_list)
        [ 2; 1 ];
      let blocked_target = { target with workflow_created_from = true } in
      let blocked_capabilities =
        {
          capabilities with
          entity =
            (fun id -> if id = 99 then Some blocked_target else entity id);
        }
      in
      expect_equal "property-created target"
        (Bidirectional.groups_with blocked_capabilities ~target_id:99)
        None)
