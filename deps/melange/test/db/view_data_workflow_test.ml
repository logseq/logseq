open Melange_db

type value = Nil | Text of string | Keyword of string | Number of float

type entity = {
  id : int;
  uuid : string;
  parent_id : int option;
  page_id : int option;
  order : string option;
  created_from_query : bool;
}

let entity ?parent_id ?page_id ?order ?(created_from_query = false) id =
  {
    id;
    uuid = "uuid-" ^ string_of_int id;
    parent_id;
    page_id;
    order;
    created_from_query;
  }

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let sorting id ascending =
  ({ View_data_workflow.id; ascending } : View_data_workflow.sorting)

let default_sorting = Rrbvec.singleton (sorting "block/updated-at" false)

let view ?(feature = View_entity_selection.Class_objects) ?view_for_id
    ?property_ident ?group_property ?group_ident ?(list_view = false) ?filters
    ?stored_sorting ?(group_sort_ident = "block/journal-day")
    ?(group_descending = false) () :
    (int, entity, value) View_data_workflow.view =
  {
    feature;
    view_for_id;
    property_ident;
    group_property;
    group_ident;
    list_view;
    filters;
    stored_sorting;
    group_sort_ident;
    group_descending;
  }

let options ?(journals = false) ?view_for_id ?feature ?group_ident ?(input = "")
    ?query_entity_ids ?query ?filters ?sorting () :
    (int, value) View_data_workflow.options =
  {
    journals;
    view_for_id;
    feature;
    group_ident;
    input;
    query_entity_ids = Option.value query_entity_ids ~default:Rrbvec.empty;
    query;
    filters;
    sorting;
  }

let rows =
  [|
    entity 1;
    entity 2;
    entity ~created_from_query:true 3;
    entity ~parent_id:10 ~page_id:20 ~order:"b" 4;
    entity ~parent_id:10 ~page_id:20 ~order:"a" 5;
    entity ~parent_id:11 ~page_id:20 ~order:"a" 6;
    entity 10;
    entity ~order:"b" 11;
    entity 20;
    entity 90;
    entity 91;
  |]

let find_entity id = Array.find_opt (fun row -> row.id = id) rows
let call_log = ref Rrbvec.empty
let record call = call_log := Rrbvec.push_back !call_log call
let reset_calls () = call_log := Rrbvec.empty

let reference_result :
    (int, entity, string) View_entity_selection.reference_result =
  {
    blocks = Rrbvec.of_array [| entity 1; entity 2 |];
    page_counts =
      Some
        (Rrbvec.singleton
           ({ View_entity_selection.label = "Page"; count = 2 }
             : string View_entity_selection.page_count));
    matched_children_ids = Some (Rrbvec.singleton 99);
  }

let selection feature =
  match feature with
  | View_entity_selection.Linked_references ->
      View_entity_selection.References reference_result
  | Query_result -> View_entity_selection.Empty
  | Property_objects ->
      View_entity_selection.Entities
        (Rrbvec.of_array [| entity 1; entity 1; entity 2 |])
  | All_pages | Class_objects | Unlinked_references ->
      View_entity_selection.Entities (Rrbvec.of_array [| entity 1; entity 2 |])

let sort_rows rows =
  let rows = Rrbvec.to_array rows in
  Array.sort (fun left right -> compare right.id left.id) rows;
  Rrbvec.of_array rows

let capabilities :
    (int, entity, value, string, string) View_data_workflow.capabilities =
  {
    entity = find_entity;
    entity_id = (fun row -> row.id);
    entity_uuid = (fun row -> row.uuid);
    equal_id = Int.equal;
    page = (fun row -> Option.bind row.page_id find_entity);
    parent = (fun row -> Option.bind row.parent_id find_entity);
    created_from_query = (fun row -> row.created_from_query);
    latest_journals =
      (fun () ->
        record "journals";
        Rrbvec.of_array [| entity 90; entity 91 |]);
    fast_all_page_ids =
      (fun sorting ->
        record ("fast:" ^ (Rrbvec.nth sorting 0).id);
        Some (Rrbvec.of_array [| 2; 1 |]));
    select =
      (fun ~feature ~view_for_id:_ ~property_ident:_ ~sorting:_ ->
        record "select";
        selection feature);
    filter_entities =
      (fun ~filters:_ ~input rows ->
        record ("filter:" ^ input);
        Rrbvec.filter (fun row -> row.id <> 2) rows);
    sort_entities =
      (fun ~sorting rows ->
        record ("sort:" ^ (Rrbvec.nth sorting 0).id);
        sort_rows rows);
    group_entities =
      (fun ~property:_ ~group_ident ~sort_ident ~descending rows ->
        record
          (Printf.sprintf "group:%s:%s:%b" group_ident sort_ident descending);
        Rrbvec.singleton (Text "Group", rows));
    project_group_key = (fun value -> value);
    sort_by_order =
      (fun rows ->
        record "strict-order";
        let rows = Rrbvec.to_array rows in
        Array.sort
          (fun left right ->
            match (left.order, right.order) with
            | Some left, Some right -> String.compare left right
            | None, _ | _, None ->
                invalid_arg "DB view data workflow: block order is missing")
          rows;
        Rrbvec.of_array rows);
    query_properties =
      (fun ~query:_ ~entities:_ ->
        record "properties";
        Rrbvec.of_array [| Keyword "block/title" |]);
  }

let ids_of_result result =
  match result.View_data_workflow.data with
  | View_data_workflow.Ids ids -> Rrbvec.to_array ids
  | Grouped _ -> failwith "expected flat ids"

let () =
  Fest.test "DB view data workflow short-circuits journal views" (fun () ->
      reset_calls ();
      let result =
        View_data_workflow.get_with capabilities ~view:(view ())
          ~options:(options ~journals:true ())
      in
      expect_equal "journal count" result.count 2;
      expect_equal "journal ids" (ids_of_result result) [| 90; 91 |];
      expect_equal "journal calls" (Rrbvec.to_array !call_log) [| "journals" |]);
  Fest.test
    "DB view data workflow uses the eligible all-pages fast path and defaults \
     sorting" (fun () ->
      reset_calls ();
      let result =
        View_data_workflow.get_with capabilities
          ~view:(view ~feature:View_entity_selection.All_pages ())
          ~options:(options ())
      in
      expect_equal "fast ids" (ids_of_result result) [| 2; 1 |];
      expect_equal "fast calls"
        (Rrbvec.to_array !call_log)
        [| "fast:block/updated-at" |]);
  Fest.test
    "DB view data workflow filters sorts and preserves linked reference \
     metadata" (fun () ->
      reset_calls ();
      let result =
        View_data_workflow.get_with capabilities
          ~view:
            (view ~feature:View_entity_selection.Linked_references
               ~view_for_id:20 ~filters:(Text "filters") ())
          ~options:(options ~input:"alpha" ())
      in
      expect_equal "linked count" result.count 1;
      expect_equal "linked ids" (ids_of_result result) [| 1 |];
      expect_equal "linked page counts"
        (Option.map Rrbvec.to_array result.ref_page_counts)
        (Some
           [|
             ({ View_entity_selection.label = "Page"; count = 2 }
               : string View_entity_selection.page_count);
           |]);
      expect_equal "linked children"
        (Option.map Rrbvec.to_array result.ref_matched_children_ids)
        (Some [| 99 |]);
      expect_equal "linked calls"
        (Rrbvec.to_array !call_log)
        [| "select"; "filter:alpha"; "sort:block/updated-at" |]);
  Fest.test
    "DB view data workflow filters query-created rows, dedupes ids, and \
     reports properties" (fun () ->
      reset_calls ();
      let result =
        View_data_workflow.get_with capabilities
          ~view:(view ~feature:View_entity_selection.Query_result ())
          ~options:
            (options
               ~query_entity_ids:(Rrbvec.of_array [| 1; 3; 1; 2 |])
               ~query:(Text "query") ())
      in
      expect_equal "query count before dedupe" result.count 3;
      expect_equal "query ids" (ids_of_result result) [| 2; 1 |];
      expect_equal "query properties"
        (Option.map Rrbvec.to_array result.properties)
        (Some [| Keyword "block/title" |]);
      expect_equal "query calls"
        (Rrbvec.to_array !call_log)
        [| "sort:block/updated-at"; "properties" |]);
  Fest.test "DB view data workflow dedupes property object ids" (fun () ->
      reset_calls ();
      let result =
        View_data_workflow.get_with capabilities
          ~view:(view ~feature:View_entity_selection.Property_objects ())
          ~options:(options ())
      in
      expect_equal "property count before dedupe" result.count 3;
      expect_equal "property ids" (ids_of_result result) [| 2; 1 |]);
  Fest.test "DB view data workflow projects and sorts table groups" (fun () ->
      reset_calls ();
      let result =
        View_data_workflow.get_with capabilities
          ~view:
            (view ~group_property:(entity 20) ~group_ident:"block/title"
               ~stored_sorting:(Rrbvec.singleton (sorting "block/title" true))
               ())
          ~options:(options ())
      in
      match result.data with
      | Grouped groups -> (
          let group = Rrbvec.nth groups 0 in
          expect_equal "group key" group.key (Text "Group");
          match group.rows with
          | View_data_workflow.Group_ids ids ->
              expect_equal "group ids" (Rrbvec.to_array ids) [| 2; 1 |]
          | Parent_groups _ -> failwith "expected table group ids")
      | Ids _ -> failwith "expected grouped result");
  Fest.test "DB view data workflow sorts parent entities and blocks separately"
    (fun () ->
      reset_calls ();
      let grouped_rows =
        Rrbvec.of_array
          [|
            entity ~parent_id:10 ~page_id:20 ~order:"b" 4;
            entity ~parent_id:10 ~page_id:20 ~order:"a" 5;
            entity ~parent_id:11 ~page_id:20 ~order:"a" 6;
          |]
      in
      let list_capabilities =
        {
          capabilities with
          select =
            (fun ~feature:_ ~view_for_id:_ ~property_ident:_ ~sorting:_ ->
              View_entity_selection.Entities grouped_rows);
          group_entities =
            (fun ~property:_ ~group_ident:_ ~sort_ident:_ ~descending:_ rows ->
              Rrbvec.singleton (Text "Group", rows));
          sort_entities =
            (fun ~sorting rows ->
              record ("sort:" ^ (Rrbvec.nth sorting 0).id);
              rows);
        }
      in
      let result =
        View_data_workflow.get_with list_capabilities
          ~view:
            (view ~group_property:(entity 20) ~group_ident:"block/page"
               ~list_view:true ())
          ~options:(options ())
      in
      (match result.data with
      | Grouped groups -> (
          match (Rrbvec.nth groups 0).rows with
          | Parent_groups parents ->
              expect_equal "parent count" (Rrbvec.length parents) 2;
              let first = Rrbvec.nth parents 0 in
              let second = Rrbvec.nth parents 1 in
              expect_equal "first group root uuid" first.uuid "uuid-4";
              expect_equal "first parent block ids"
                (first.blocks
                |> Rrbvec.map
                     (fun
                       (block : (int, string) View_data_workflow.parent_block)
                     -> block.id)
                |> Rrbvec.to_array)
                [| 5; 4 |];
              expect_equal "second group root uuid" second.uuid "uuid-6"
          | Group_ids _ -> failwith "expected parent groups")
      | Ids _ -> failwith "expected grouped list result");
      expect_equal "list sorting calls"
        (Rrbvec.to_array !call_log)
        [| "sort:block/order"; "strict-order"; "strict-order" |])
