open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

type page = { id : int; page : bool; hidden : bool }
type query_value = Text of string | Collection of query_value array | Query

type journal_entity = {
  journal_id : int option;
  journal_value : bool;
  recycled : bool;
}

type ref_entity = {
  ref_id : int;
  refs : int array;
  page_id : int option;
  view_id : int option;
  hidden_ref : bool;
  tag_ids : int array;
  attributes : string list;
  class_ref : bool;
  ident : string option;
}

type tree_entity = {
  tree_id : int;
  collapsed : bool;
  page_value : bool;
  children : int array;
}

let () =
  Fest.test "DB initial reads choose stable oldest IDs" (fun () ->
      expect_equal "oldest"
        (Initial_read.oldest_id (Rrbvec.of_list [ 8; 3; 5 ]))
        (Some 3);
      expect_equal "missing" (Initial_read.oldest_id Rrbvec.empty) None;
      let calls = ref [] in
      expect_equal "oldest matching"
        (Initial_read.oldest_matching_id_with
           ~datoms:(fun () -> [| 8; 3; 5 |])
           ~datom_id:Fun.id
           ~eligible:(fun id ->
             calls := !calls @ [ id ];
             id <> 3))
        (Some 5);
      expect_equal "eligibility calls" !calls [ 8; 3; 5 ]);
  Fest.test "DB initial reads decide child expansion" (fun () ->
      expect_equal "normal"
        (Initial_read.expand_children ~include_collapsed:false ~collapsed:false
           ~page:false)
        true;
      expect_equal "collapsed"
        (Initial_read.expand_children ~include_collapsed:false ~collapsed:true
           ~page:false)
        false;
      expect_equal "page"
        (Initial_read.expand_children ~include_collapsed:false ~collapsed:true
           ~page:true)
        true);
  Fest.test "DB initial reads hide reference candidates" (fun () ->
      let base : Initial_read.hidden_ref_input =
        {
          self = false;
          page_self = false;
          view_self = false;
          hidden_page = false;
          hidden_block = false;
          class_match = false;
          ident_property = false;
        }
      in
      expect_equal "visible" (Initial_read.hidden_ref base) false;
      expect_equal "class"
        (Initial_read.hidden_ref { base with class_match = true })
        true;
      expect_equal "ident"
        (Initial_read.hidden_ref { base with ident_property = true })
        true);
  Fest.test "DB initial reads own lazy load status" (fun () ->
      expect_equal "small child"
        (Initial_read.child_load_status ~collapsed:false ~large_page:false
           ~all_children_loaded:false)
        Initial_read.Full;
      expect_equal "large partial"
        (Initial_read.child_load_status ~collapsed:false ~large_page:true
           ~all_children_loaded:false)
        Self;
      expect_equal "collapsed"
        (Initial_read.child_load_status ~collapsed:true ~large_page:false
           ~all_children_loaded:true)
        Self;
      expect_equal "block full"
        (Initial_read.block_load_status ~children:true ~include_collapsed:true
           ~properties_empty:true)
        Full;
      expect_equal "block children"
        (Initial_read.block_load_status ~children:true ~include_collapsed:false
           ~properties_empty:true)
        Children;
      expect_equal "block self"
        (Initial_read.block_load_status ~children:true ~include_collapsed:true
           ~properties_empty:false)
        Self);
  Fest.test "DB initial reads select journal and initial datom values"
    (fun () ->
      expect_equal "journal"
        (Initial_read.journal ~day:20260714 ~today:20260714 ~journal:true
           ~id_present:true ~recycled:false)
        true;
      expect_equal "future"
        (Initial_read.journal ~day:20260715 ~today:20260714 ~journal:true
           ~id_present:true ~recycled:false)
        false;
      expect_equal "created-at"
        (Initial_read.include_initial_attribute "block/created-at")
        false;
      expect_equal "title"
        (Initial_read.include_initial_attribute "block/title")
        true;
      expect_equal "large" (Initial_read.large_page 100) true;
      expect_equal "small" (Initial_read.large_page 99) false);
  Fest.test "DB initial reads own recent-page scans" (fun () ->
      let calls = ref [] in
      let pages =
        Initial_read.recent_pages_with
          ~updated_datoms:(fun () -> [| 1; 2; 3 |])
          ~datom_entity:(fun id -> id)
          ~has_page_datom:(fun id ->
            calls := !calls @ [ "page:" ^ string_of_int id ];
            id = 2)
          ~title:(fun id ->
            calls := !calls @ [ "title:" ^ string_of_int id ];
            if id = 2 then Some "" else Some ("Page " ^ string_of_int id))
          ~entity:(fun id ->
            calls := !calls @ [ "entity:" ^ string_of_int id ];
            { id; page = true; hidden = false })
          ~page:(fun value -> value.page)
          ~hidden:(fun value -> value.hidden)
      in
      expect_equal "recent pages"
        (pages |> Array.to_list |> List.map (fun value -> value.id))
        [ 3; 1 ];
      expect_equal "recent calls" !calls
        [
          "page:3";
          "title:3";
          "entity:3";
          "page:2";
          "title:2";
          "entity:2";
          "page:1";
          "title:1";
          "entity:1";
        ];
      let inspected = ref 0 in
      let many =
        Initial_read.recent_pages_with
          ~updated_datoms:(fun () -> Array.init 20 Fun.id)
          ~datom_entity:Fun.id
          ~has_page_datom:(fun _ ->
            incr inspected;
            false)
          ~title:(fun _ -> Some "Page")
          ~entity:(fun id -> { id; page = true; hidden = false })
          ~page:(fun value -> value.page)
          ~hidden:(fun value -> value.hidden)
      in
      expect_equal "recent limit" (Array.length many) 15;
      expect_equal "short-circuit" !inspected 15);
  Fest.test "DB initial reads own latest journal scans" (fun () ->
      let calls = ref [] in
      let entities =
        [
          (1, { journal_id = Some 1; journal_value = true; recycled = false });
          (2, { journal_id = Some 2; journal_value = true; recycled = true });
          (3, { journal_id = Some 3; journal_value = false; recycled = false });
          (4, { journal_id = None; journal_value = true; recycled = false });
        ]
      in
      let result =
        Initial_read.latest_journals_with
          ~datoms:(fun () ->
            [|
              (1, 20260713);
              (2, 20260714);
              (1, 20260714);
              (3, 20260714);
              (4, 20260714);
              (1, 20260716);
            |])
          ~datom_entity:fst ~datom_day:snd
          ~entity:(fun id ->
            calls := !calls @ [ id ];
            List.assoc_opt id entities)
          ~entity_id:(fun value -> value.journal_id)
          ~journal_entity:(fun value -> value.journal_value)
          ~recycled:(fun value -> value.recycled)
          ~id_equal:Int.equal ~today:20260715
      in
      expect_equal "latest journals"
        (result |> Array.to_list |> List.map (fun value -> value.journal_id))
        [ Some 1 ];
      expect_equal "reverse scan calls" !calls [ 1; 4; 3; 1; 2; 1 ]);
  Fest.test "DB initial reads own visible block reference workflows" (fun () ->
      let make ?(refs = [||]) ?page_id ?view_id ?(hidden_ref = false)
          ?(tag_ids = [||]) ?(attributes = []) ?(class_ref = false) ?ident
          ref_id =
        {
          ref_id;
          refs;
          page_id;
          view_id;
          hidden_ref;
          tag_ids;
          attributes;
          class_ref;
          ident;
        }
      in
      let values =
        [
          make ~refs:[| 10; 11 |] ~class_ref:true ~ident:"target" 1;
          make ~refs:[| 12; 13; 14; 15; 16 |] 2;
          make 10;
          make ~hidden_ref:true 11;
          make ~page_id:1 12;
          make ~tag_ids:[| 2 |] 13;
          make ~attributes:[ "target" ] 14;
          make ~view_id:1 15;
          make 16;
        ]
      in
      let entity id = List.find_opt (fun value -> value.ref_id = id) values in
      let required id = Option.get (entity id) in
      let args =
        ( (fun id -> if id = 1 then [| 2; 2 |] else [||]),
          entity,
          (fun value -> Some value.ref_id),
          (fun value -> value.ident),
          (fun value -> value.class_ref),
          (fun id -> if id = 1 then [| 2 |] else [||]),
          (fun value -> Array.map required value.refs),
          (fun value -> Option.map required value.page_id),
          (fun value -> Option.map required value.view_id),
          (fun value -> value.hidden_ref),
          (fun value -> Array.map required value.tag_ids),
          fun value attribute -> List.mem attribute value.attributes )
      in
      let ( aliases,
            entity,
            entity_id,
            ident,
            class_entity,
            structured_children,
            references,
            page,
            view_for,
            hidden,
            tags,
            has_ident ) =
        args
      in
      expect_equal "visible refs"
        (Initial_read.block_refs_with ~aliases ~entity ~entity_id ~ident
           ~class_entity ~structured_children ~references ~page ~view_for
           ~hidden ~tags ~has_ident ~id_equal:Int.equal 1
        |> Array.to_list
        |> List.map (fun value -> value.ref_id))
        [ 10; 16 ];
      expect_equal "visible ref count"
        (Initial_read.block_refs_count_with ~aliases ~entity ~entity_id ~ident
           ~class_entity ~structured_children
           ~ref_datoms:(fun id -> if id = 1 then [| 10; 11 |] else [| 16; 16 |])
           ~datom_entity:Fun.id ~page ~view_for ~hidden ~tags ~has_ident
           ~id_equal:Int.equal 1)
        3);
  Fest.test "DB initial reads own relationship rule queries" (fun () ->
      let forms = ref [] in
      let run relation values =
        Initial_read.related_ids_with
          ~encode_form:(fun form ->
            forms := !forms @ [ form ];
            Query)
          ~query:(fun query inputs ->
            expect_equal "query" query Query;
            expect_equal "inputs" (Array.to_list inputs)
              [ Text "root"; Text "rule" ];
            Collection (Array.map (fun value -> Text value) values))
          ~collection_to_array:(function
            | Collection values -> values | _ -> failwith "expected collection")
          ~value_equals:( = ) ~relation ~root:(Text "root") ~rule:(Text "rule")
      in
      expect_equal "aliases"
        (run "alias" [| "a"; "a"; "b" |] |> Array.to_list)
        [ Text "a"; Text "b" ];
      expect_equal "children"
        (run "parent" [| "c" |] |> Array.to_list)
        [ Text "c" ];
      expect_equal "forms" (List.length !forms) 2);
  Fest.test "DB initial reads own descendant expansion" (fun () ->
      let values =
        [
          {
            tree_id = 1;
            collapsed = false;
            page_value = false;
            children = [| 2; 3 |];
          };
          {
            tree_id = 2;
            collapsed = true;
            page_value = false;
            children = [| 4 |];
          };
          {
            tree_id = 3;
            collapsed = true;
            page_value = true;
            children = [| 5 |];
          };
          {
            tree_id = 4;
            collapsed = false;
            page_value = false;
            children = [||];
          };
          {
            tree_id = 5;
            collapsed = false;
            page_value = false;
            children = [||];
          };
        ]
      in
      let find id = List.find (fun value -> value.tree_id = id) values in
      let result =
        Initial_read.children_ids_with
          ~root:(fun () -> Some (find 1))
          ~entity:find
          ~entity_id:(fun value -> value.tree_id)
          ~collapsed:(fun value -> value.collapsed)
          ~page:(fun value -> value.page_value)
          ~children:(fun value -> value.children)
          ~include_collapsed:false
      in
      expect_equal "visible descendants"
        (Option.map Array.to_list result)
        (Some [ 2; 3; 5 ]);
      let all =
        Initial_read.children_ids_with
          ~root:(fun () -> Some (find 1))
          ~entity:find
          ~entity_id:(fun value -> value.tree_id)
          ~collapsed:(fun value -> value.collapsed)
          ~page:(fun value -> value.page_value)
          ~children:(fun value -> value.children)
          ~include_collapsed:true
      in
      expect_equal "all descendants"
        (Option.map Array.to_list all)
        (Some [ 2; 3; 4; 5 ]);
      expect_equal "missing root"
        (Initial_read.children_ids_with
           ~root:(fun () -> None)
           ~entity:find
           ~entity_id:(fun value -> value.tree_id)
           ~collapsed:(fun value -> value.collapsed)
           ~page:(fun value -> value.page_value)
           ~children:(fun value -> value.children)
           ~include_collapsed:true)
        None)
