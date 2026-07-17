open Melange_db

type value = Nil | Bool of bool | Number of float | Text of string

type entity = {
  id : int;
  title : string;
  hidden : bool;
  refs_count : int option;
  fields : (string * value) array;
}

let entity ?(hidden = false) ?refs_count ?(fields = [||]) id title =
  { id; title; hidden; refs_count; fields }

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let expect_invalid label callback =
  match callback () with
  | exception Invalid_argument _ -> ()
  | _ -> failwith (label ^ ": expected Invalid_argument")

let ids rows = rows |> Rrbvec.map (fun row -> row.id) |> Rrbvec.to_array

let entities =
  [|
    entity ~fields:[| ("block/updated-at", Number 10.) |] 1 "Alpha";
    entity 2 "Hidden by property";
    entity 3 "Deleted";
    entity 4 "Built in";
    entity 5 "Property class";
    entity ~hidden:true 6 "Hidden entity";
    entity ~fields:[| ("block/updated-at", Number 20.) |] 7 "Beta";
    entity 8 "Missing sort value";
    entity 100 "Property";
    entity 200 "Class";
    entity 201 "Class object";
    entity 300 "Property object";
    entity ~hidden:true 301 "Hidden property object";
  |]

let find_entity id = Array.find_opt (fun row -> row.id = id) entities

let ids_with_attribute = function
  | "block/name" -> Rrbvec.of_array [| 1; 2; 3; 4; 5; 6; 7; 8 |]
  | "logseq.property/deleted-at" -> Rrbvec.singleton 3
  | _ -> Rrbvec.empty

let ids_with_bool attribute expected =
  match (attribute, expected) with
  | "logseq.property/hide?", true -> Rrbvec.singleton 2
  | "logseq.property/built-in?", true -> Rrbvec.singleton 4
  | _ -> Rrbvec.empty

let ids_with_ref attribute id =
  match (attribute, id) with
  | "block/tags", 100 -> Rrbvec.singleton 5
  | _ -> Rrbvec.empty

let linked_result : (int, entity, string) View_entity_selection.reference_result
    =
  {
    blocks = Rrbvec.singleton (entity 401 "Linked");
    page_counts =
      Some
        (Rrbvec.singleton
           ({ label = "Page"; count = 1 }
             : string View_entity_selection.page_count));
    matched_children_ids = Some (Rrbvec.singleton 402);
  }

let capabilities :
    (int, entity, value, string) View_entity_selection.capabilities =
  {
    resolve_id = (function "logseq.class/Property" -> Some 100 | _ -> None);
    entity = find_entity;
    entity_id = (fun row -> row.id);
    equal_id = Int.equal;
    hidden = (fun row -> row.hidden);
    ids_with_attribute;
    ids_with_bool;
    ids_with_ref;
    with_refs_count = (fun row count -> { row with refs_count = Some count });
    refs_count = (fun id -> if id = 1 then 3 else 5);
    sort_value =
      (fun row attribute ->
        match Array.find_opt (fun (name, _) -> name = attribute) row.fields with
        | Some (_, Number value) -> View_order.Number value
        | Some (_, Bool value) -> View_order.Bool value
        | Some (_, Text value) -> View_order.Text value
        | Some (_, Nil) | None -> View_order.Missing);
    class_objects =
      (fun id ->
        if id = 200 then Rrbvec.singleton (entity 201 "Class object")
        else Rrbvec.empty);
    property_object_ids =
      (fun property_ident ->
        if property_ident = "user.property/owner" then
          Rrbvec.of_array [| 300; 301; 300 |]
        else Rrbvec.empty);
    linked_references =
      (fun id -> if id = 200 then linked_result else linked_result);
    unlinked_references =
      (fun id ->
        if id = 200 then Some (Rrbvec.singleton (entity 501 "Unlinked"))
        else None);
  }

let sorting id ascending = ({ id; ascending } : View_entity_selection.sorting)

let () =
  Fest.test "DB view entity selection owns the property object query" (fun () ->
      let open Datalog_form in
      expect_equal "property object query"
        View_entity_selection.property_objects_query
        (vector_form
           [|
             keyword "find";
             vector_form [| symbol "?b"; symbol "..." |];
             keyword "in";
             symbol "$";
             symbol "%";
             symbol "?prop";
             keyword "where";
             list_form
               [|
                 symbol "has-property-or-object-property?";
                 symbol "?b";
                 symbol "?prop";
               |];
           |]));
  Fest.test
    "DB view entity selection excludes internal pages and attaches refs counts"
    (fun () ->
      let rows =
        View_entity_selection.all_pages_with capabilities
          ~sorting:(Rrbvec.singleton (sorting "block.temp/refs-count" false))
          ~property_ident:"block/name"
      in
      expect_equal "visible pages" (ids rows) [| 1; 7; 8 |];
      expect_equal "refs count alpha" (Rrbvec.nth rows 0).refs_count (Some 3);
      expect_equal "refs count beta" (Rrbvec.nth rows 1).refs_count (Some 5));
  Fest.test
    "DB view entity selection fast path sorts supported attributes missing-last"
    (fun () ->
      let sorted =
        View_entity_selection.fast_all_page_ids_with capabilities
          ~sorting:(Rrbvec.singleton (sorting "block/updated-at" false))
      in
      expect_equal "sorted page ids"
        (Option.map Rrbvec.to_array sorted)
        (Some [| 8; 7; 1 |]);
      expect_equal "unsupported sort"
        (View_entity_selection.fast_all_page_ids_with capabilities
           ~sorting:(Rrbvec.singleton (sorting "user.property/score" true)))
        None;
      expect_equal "minor sort disables fast path"
        (View_entity_selection.fast_all_page_ids_with capabilities
           ~sorting:
             (Rrbvec.of_array
                [|
                  sorting "block/title" true; sorting "block/updated-at" false;
                |]))
        None);
  Fest.test
    "DB view entity selection dispatches class property and reference features"
    (fun () ->
      let select feature ?view_for_id ?property_ident () =
        View_entity_selection.select_with capabilities ~feature ~view_for_id
          ~property_ident
          ~sorting:(Rrbvec.singleton (sorting "block/title" true))
      in
      let class_rows =
        match
          select View_entity_selection.Class_objects ~view_for_id:200 ()
        with
        | View_entity_selection.Entities rows -> rows
        | References _ | Empty -> failwith "expected class entities"
      in
      expect_equal "class rows" (ids class_rows) [| 201 |];
      let property_rows =
        match
          select Property_objects ~property_ident:"user.property/owner" ()
        with
        | Entities rows -> rows
        | References _ | Empty -> failwith "expected property entities"
      in
      expect_equal "property rows are distinct and visible" (ids property_rows)
        [| 300 |];
      (match select Linked_references ~view_for_id:200 () with
      | References result ->
          expect_equal "linked rows" (ids result.blocks) [| 401 |]
      | Entities _ | Empty -> failwith "expected linked references");
      (match select Unlinked_references ~view_for_id:200 () with
      | Entities rows -> expect_equal "unlinked rows" (ids rows) [| 501 |]
      | References _ | Empty -> failwith "expected unlinked entities");
      expect_equal "query selection" (select Query_result ())
        View_entity_selection.Empty;
      expect_invalid "missing class target" (fun () -> select Class_objects ());
      expect_invalid "missing property ident" (fun () ->
          select Property_objects ()))
