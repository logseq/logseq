open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

type query_value =
  | Query
  | Text of string
  | Tags of string array
  | Results of query_value array

type parent_entity = { uuid : string; parent_uuid : string option }

type library_entity = {
  library_id : int;
  mutable library_parent : library_entity option;
}

type lookup_entity = { lookup_label : string }

type state_entity = {
  state_id : string;
  state_order : string;
  state_collapsed : bool;
  mutable state_children : state_entity Rrbvec.t;
}

type orphan_entity = {
  orphan_name : string;
  orphan_title : string;
  orphan_order : string;
  orphan_refs_empty : bool;
  orphan_page_children : int;
  orphan_property : bool;
  orphan_journal : bool;
  orphan_has_properties : bool;
  orphan_hidden : bool;
  mutable orphan_children : orphan_entity Rrbvec.t;
}

type order_entity = { order_id : int; order_page_id : int option }

let () =
  Fest.test "DB core reads select case-sensitive page lookup" (fun () ->
      expect_equal "property and tag"
        (Core_read.case_sensitive_page_lookup
           (Rrbvec.of_list [ "logseq.class/Tag"; "logseq.class/Property" ]))
        true;
      expect_equal "empty tags"
        (Core_read.case_sensitive_page_lookup Rrbvec.empty)
        false;
      expect_equal "other class"
        (Core_read.case_sensitive_page_lookup
           (Rrbvec.of_list [ "user.class/Task" ]))
        false);
  Fest.test "DB core reads decide orphan eligibility" (fun () ->
      let candidate : Core_read.orphan_candidate =
        {
          empty_refs = true;
          empty_or_placeholder = true;
          built_in = false;
          property = false;
          namespaced_non_journal = false;
          has_properties = false;
          hidden = false;
        }
      in
      expect_equal "eligible" (Core_read.orphan candidate) true;
      expect_equal "referenced"
        (Core_read.orphan { candidate with empty_refs = false })
        false;
      expect_equal "namespaced"
        (Core_read.orphan { candidate with namespaced_non_journal = true })
        false;
      expect_equal "hidden"
        (Core_read.orphan { candidate with hidden = true })
        false);
  Fest.test "DB core reads own alias and hidden-tag decisions" (fun () ->
      let aliases = function
        | 1 -> Rrbvec.of_list [ 3; 4 ]
        | _ -> Rrbvec.empty
      in
      expect_equal "alias source"
        (Core_read.alias_source_page_with
           ~entity:(fun id -> if id = 1 then Some id else None)
           ~aliases (Some 1))
        (Some 3);
      expect_equal "missing alias"
        (Core_read.alias_source_page_with
           ~entity:(fun _ -> None)
           ~aliases (Some 1))
        None;
      expect_equal "nil alias"
        (Core_read.alias_source_page_with ~entity:(fun _ -> None) ~aliases None)
        None;
      expect_equal "alias set"
        (Core_read.page_alias_set ~equal:Int.equal 1
           (Rrbvec.of_list [ 3; 1; 4; 3 ]))
        (Rrbvec.of_list [ 1; 3; 4 ]);
      expect_equal "hidden tag"
        (Core_read.hidden_or_internal_tag
           ~hidden:(fun _ -> true)
           ~internal_ident:(fun _ -> false)
           1)
        true;
      expect_equal "internal tag"
        (Core_read.hidden_or_internal_tag
           ~hidden:(fun _ -> false)
           ~internal_ident:(fun _ -> true)
           1)
        true;
      expect_equal "visible user tag"
        (Core_read.hidden_or_internal_tag
           ~hidden:(fun _ -> false)
           ~internal_ident:(fun _ -> false)
           1)
        false);
  Fest.test "DB core reads inspect Library ancestry" (fun () ->
      expect_equal "library parent"
        (Core_read.page_in_library ~library_id:10
           (Rrbvec.of_list [ 30; 20; 10 ]))
        true;
      expect_equal "outside library"
        (Core_read.page_in_library ~library_id:10 (Rrbvec.of_list [ 30; 20 ]))
        false;
      let library = { library_id = 10; library_parent = None } in
      let parent = { library_id = 20; library_parent = Some library } in
      let page = { library_id = 30; library_parent = Some parent } in
      let capabilities : (library_entity, int) Core_read.library_capabilities =
        {
          library_page = (fun () -> Some library);
          eligible_page = (fun _ -> true);
          library_entity_id = (fun value -> value.library_id);
          library_equal_id = Int.equal;
          library_parent = (fun value -> value.library_parent);
        }
      in
      expect_equal "workflow ancestry"
        (Core_read.page_in_library_with capabilities page)
        true;
      expect_equal "ineligible"
        (Core_read.page_in_library_with
           { capabilities with eligible_page = (fun _ -> false) }
           page)
        false;
      library.library_parent <- Some parent;
      let missing_library = { library_id = 99; library_parent = None } in
      let failed =
        try
          ignore
            (Core_read.page_in_library_with
               {
                 capabilities with
                 library_page = (fun () -> Some missing_library);
               }
               page);
          false
        with Invalid_argument _ -> true
      in
      expect_equal "cycle" failed true);
  Fest.test "DB core reads honor collapsed child traversal" (fun () ->
      expect_equal "normal"
        (Core_read.search_last_child ~not_collapsed:false ~collapsed:true
           ~has_children:true)
        true;
      expect_equal "skip collapsed"
        (Core_read.search_last_child ~not_collapsed:true ~collapsed:true
           ~has_children:true)
        false;
      expect_equal "collapsed leaf"
        (Core_read.search_last_child ~not_collapsed:true ~collapsed:true
           ~has_children:false)
        true);
  Fest.test "DB core reads own page block and journal lookups" (fun () ->
      let calls = ref [] in
      let datoms attribute value =
        calls := !calls @ [ "datoms:" ^ attribute ^ ":" ^ string_of_int value ];
        if attribute = "block/page" then [| 20; 10 |] else [| 30 |]
      in
      let blocks =
        Core_read.page_blocks_with ~datoms ~datom_entity:Fun.id
          ~pull_many:(fun pattern ids ->
            calls := !calls @ [ "pull:" ^ pattern ];
            Array.map (fun id -> "block:" ^ string_of_int id) ids)
          ~attribute:"block/page" ~pattern:"all" 7
      in
      expect_equal "page blocks" blocks [| "block:20"; "block:10" |];
      expect_equal "page count"
        (Core_read.page_blocks_count_with ~datoms ~attribute:"block/page" 7)
        2;
      expect_equal "journal"
        (Core_read.journal_page_by_day_with ~datoms ~datom_entity:Fun.id
           ~entity:(fun id -> Some ("entity:" ^ string_of_int id))
           ~attribute:"block/journal-day" 20260715)
        (Some "entity:30");
      expect_equal "calls" !calls
        [
          "datoms:block/page:7";
          "pull:all";
          "datoms:block/page:7";
          "datoms:block/journal-day:20260715";
        ]);
  Fest.test "DB core reads own key value lookup" (fun () ->
      expect_equal "value"
        (Core_read.key_value_with
           ~entity:(function "present" -> Some "record" | _ -> None)
           ~value:(fun _ -> Some 42)
           "present")
        (Some 42);
      expect_equal "missing entity"
        (Core_read.key_value_with
           ~entity:(fun _ -> None)
           ~value:(fun _ -> Some 42)
           "missing")
        None);
  Fest.test "DB core reads own page reference lookup" (fun () ->
      let by_id = { lookup_label = "id" } in
      let by_uuid = { lookup_label = "uuid" } in
      let by_title = { lookup_label = "title" } in
      let capabilities :
          (lookup_entity, string) Core_read.page_lookup_capabilities =
        {
          page_by_id =
            (function
            | "id" | "name-id" -> Some by_id
            | "title-id" -> Some by_title
            | _ -> None);
          page_by_uuid =
            (function "uuid" | "parsed" -> Some by_uuid | _ -> None);
          oldest_page_by_name =
            (function "Named" -> Some "name-id" | _ -> None);
          oldest_page_by_title =
            (function "Titled" -> Some "title-id" | _ -> None);
          parse_page_uuid =
            (function "canonical" -> Some "parsed" | _ -> None);
        }
      in
      expect_equal "id"
        (Core_read.page_with capabilities (Page_id "id"))
        (Some by_id);
      expect_equal "uuid"
        (Core_read.page_with capabilities (Page_uuid "uuid"))
        (Some by_uuid);
      expect_equal "uuid text"
        (Core_read.page_with capabilities (Page_name "canonical"))
        (Some by_uuid);
      expect_equal "normalized name"
        (Core_read.page_with capabilities (Page_name "Named"))
        (Some by_id);
      expect_equal "journal name"
        (Core_read.journal_page_with capabilities "Named")
        (Some by_id);
      expect_equal "case title"
        (Core_read.case_page_with capabilities (Page_name "Titled"))
        (Some by_title);
      expect_equal "missing"
        (Core_read.page_with capabilities (Page_name "Missing"))
        None);
  Fest.test "DB core reads own page and direct-child state" (fun () ->
      let leaf =
        {
          state_id = "leaf";
          state_order = "a1";
          state_collapsed = false;
          state_children = Rrbvec.empty;
        }
      in
      let first = { leaf with state_id = "first"; state_order = "a0" } in
      let root =
        {
          state_id = "root";
          state_order = "";
          state_collapsed = true;
          state_children = Rrbvec.of_array [| leaf; first |];
        }
      in
      let lookup : (state_entity, string) Core_read.page_lookup_capabilities =
        {
          page_by_id =
            (function "root" -> Some root | "leaf" -> Some leaf | _ -> None);
          page_by_uuid = (function "root-uuid" -> Some root | _ -> None);
          oldest_page_by_name = (function "Root" -> Some "root" | _ -> None);
          oldest_page_by_title = (fun _ -> None);
          parse_page_uuid = (fun _ -> None);
        }
      in
      let state : (state_entity, string) Core_read.direct_child_capabilities =
        {
          direct_lookup = lookup;
          direct_children = (fun value -> value.state_children);
          direct_children_present =
            (fun value -> not (Rrbvec.is_empty value.state_children));
          direct_collapsed = (fun value -> value.state_collapsed);
          direct_order = (fun value -> value.state_order);
          direct_id = (fun value -> value.state_id);
        }
      in
      expect_equal "non-empty page"
        (Core_read.page_empty_with state (Page_name "Root"))
        false;
      expect_equal "empty page"
        (Core_read.page_empty_with state (Page_id "leaf"))
        true;
      expect_equal "missing page is empty"
        (Core_read.page_empty_with state (Page_id "missing"))
        true;
      expect_equal "children present"
        (Core_read.has_children_with state (Page_uuid "root-uuid"))
        true;
      expect_equal "missing children"
        (Core_read.has_children_with state (Page_id "missing"))
        false;
      expect_equal "last direct child"
        (Core_read.last_direct_child_id_with state ~not_collapsed:false
           (Page_id "root"))
        (Some "leaf");
      expect_equal "collapsed subtree skipped"
        (Core_read.last_direct_child_id_with state ~not_collapsed:true
           (Page_id "root"))
        None);
  Fest.test "DB core reads own orphaned page workflow" (fun () ->
      let entity ?(title = "") ?(order = "") ?(refs_empty = true)
          ?(page_children = 0) ?(property = false) ?(journal = false)
          ?(has_properties = false) ?(hidden = false) name =
        {
          orphan_name = name;
          orphan_title = title;
          orphan_order = order;
          orphan_refs_empty = refs_empty;
          orphan_page_children = page_children;
          orphan_property = property;
          orphan_journal = journal;
          orphan_has_properties = has_properties;
          orphan_hidden = hidden;
          orphan_children = Rrbvec.empty;
        }
      in
      let empty = entity "empty" in
      let placeholder_child = entity ~title:" * " ~order:"a0" "child" in
      let placeholder = entity ~page_children:1 "placeholder" in
      placeholder.orphan_children <- Rrbvec.of_list [ placeholder_child ];
      let referenced = entity ~refs_empty:false "referenced" in
      let built_in = entity "built-in" in
      let namespaced = entity "namespace/page" in
      let journal = entity ~journal:true "journal/page" in
      let with_properties = entity ~has_properties:true "properties" in
      let hidden = entity ~hidden:true "hidden" in
      let entities =
        [
          empty;
          placeholder;
          referenced;
          built_in;
          namespaced;
          journal;
          with_properties;
          hidden;
        ]
      in
      let resolve name =
        entities |> List.find_opt (fun value -> value.orphan_name = name)
      in
      let capabilities : (orphan_entity, string) Core_read.orphan_capabilities =
        {
          orphan_default_pages =
            (fun () ->
              entities |> Array.of_list
              |> Array.map (fun x -> x.orphan_name)
              |> Rrbvec.of_array);
          orphan_resolve_page = resolve;
          orphan_empty_refs = (fun value -> value.orphan_refs_empty);
          orphan_direct_children = (fun value -> value.orphan_children);
          orphan_page_children_count = (fun value -> value.orphan_page_children);
          orphan_name = (fun value -> value.orphan_name);
          orphan_title = (fun value -> value.orphan_title);
          orphan_order = (fun value -> value.orphan_order);
          orphan_property = (fun value -> value.orphan_property);
          orphan_journal = (fun value -> value.orphan_journal);
          orphan_has_properties = (fun value -> value.orphan_has_properties);
          orphan_hidden = (fun value -> value.orphan_hidden);
        }
      in
      expect_equal "default candidates"
        (Core_read.orphaned_pages_with capabilities ~pages:None
           ~built_in_pages_names:(Rrbvec.of_list [ "BUILT-IN" ]))
        (Rrbvec.of_list [ empty; placeholder; journal ]);
      expect_equal "explicit candidates"
        (Core_read.orphaned_pages_with capabilities
           ~pages:(Some (Rrbvec.of_list [ "missing"; "placeholder" ]))
           ~built_in_pages_names:Rrbvec.empty)
        (Rrbvec.of_list [ placeholder ]));
  Fest.test "DB core reads own page block ordering and adjacency" (fun () ->
      let page = { order_id = 100; order_page_id = None } in
      let parent = { order_id = 1; order_page_id = Some 100 } in
      let child = { order_id = 2; order_page_id = Some 100 } in
      let sibling = { order_id = 3; order_page_id = Some 100 } in
      let other = { order_id = 4; order_page_id = Some 200 } in
      let entities = [ page; parent; child; sibling; other ] in
      let entity id =
        List.find_opt (fun value -> value.order_id = id) entities
      in
      let capabilities : (order_entity, int) Core_read.page_order_capabilities =
        {
          order_entity = entity;
          order_id = (fun value -> value.order_id);
          order_equal_id = Int.equal;
          order_page = (fun value -> Option.bind value.order_page_id entity);
          order_parent =
            (fun value ->
              match value.order_id with
              | 2 -> Some parent
              | 1 | 3 -> Some page
              | _ -> None);
          order_left_sibling =
            (fun value -> if value.order_id = 3 then Some parent else None);
          order_right_sibling =
            (fun value -> if value.order_id = 1 then Some sibling else None);
          ordered_page_blocks =
            (fun id ->
              if id = 100 then Rrbvec.of_list [ page; parent; child; sibling ]
              else Rrbvec.empty);
        }
      in
      expect_equal "random blocks sorted"
        (Core_read.sort_page_random_blocks_with capabilities
           (Rrbvec.of_list [ sibling; child ]))
        (Rrbvec.of_list [ child; sibling ]);
      expect_equal "descendant is last child"
        (Core_read.last_child_block_with capabilities ~parent_id:1 ~child_id:2)
        (Some true);
      expect_equal "descendant is not page last child"
        (Core_read.last_child_block_with capabilities ~parent_id:100 ~child_id:2)
        (Some false);
      expect_equal "nested tail is consecutive with next root"
        (Core_read.non_consecutive_blocks_with capabilities
           (Rrbvec.of_list [ child; sibling ]))
        Rrbvec.empty;
      expect_equal "different pages are non-consecutive"
        (Core_read.non_consecutive_blocks_with capabilities
           (Rrbvec.of_list [ child; other ]))
        (Rrbvec.singleton child));
  Fest.test "DB core reads own tagged page queries" (fun () ->
      let forms = ref [] in
      let run case_sensitive =
        Core_read.page_exists_with
          ~encode_form:(fun form ->
            forms := !forms @ [ form ];
            Query)
          ~query:(fun query inputs ->
            expect_equal "query" query Query;
            expect_equal "inputs" (Array.to_list inputs)
              [
                Text (if case_sensitive then "Task" else "task");
                Tags [| "tag" |];
              ];
            Results [| Text "page" |])
          ~collection_to_array:(function
            | Results values -> values | _ -> failwith "expected query results")
          ~string_to_value:(fun value -> Text value)
          ~case_sensitive ~page_name:"Task" ~normalized_name:"task"
          ~tags:(Tags [| "tag" |])
      in
      expect_equal "case-sensitive results" (run true) [| Text "page" |];
      expect_equal "normalized results" (run false) [| Text "page" |];
      expect_equal "query forms" (List.length !forms) 2;
      let relation_forms = ref Rrbvec.empty in
      let query form =
        relation_forms := Rrbvec.push_back !relation_forms form;
        Results [| Text "relation" |]
      in
      expect_equal "relations with journals"
        (Core_read.pages_relation_with ~encode_form:Fun.id ~query
           ~with_journal:true)
        (Results [| Text "relation" |]);
      expect_equal "relations without journals"
        (Core_read.pages_relation_with ~encode_form:Fun.id ~query
           ~with_journal:false)
        (Results [| Text "relation" |]);
      expect_equal "tagged pages"
        (Core_read.all_tagged_pages_with ~encode_form:Fun.id ~query)
        (Results [| Text "relation" |]);
      expect_equal "three distinct query forms"
        (Rrbvec.length !relation_forms)
        3;
      expect_equal "journal branch changes query"
        (Rrbvec.nth !relation_forms 0 = Rrbvec.nth !relation_forms 1)
        false);
  Fest.test "DB core reads own page scans" (fun () ->
      let pages =
        Core_read.pages_with
          ~encode_form:(fun _ -> Query)
          ~query:(fun _ -> Results [| Text "Visible"; Text "$$$hidden" |])
          ~collection_to_array:(function
            | Results values -> values | _ -> failwith "expected query results")
          ~row_first:Fun.id
          ~hidden:(function Text "$$$hidden" -> true | _ -> false)
      in
      expect_equal "page titles" pages [| Text "Visible" |];
      let all =
        Core_read.all_pages_with
          ~datoms:(fun () -> [| 1; 2; 3; 4 |])
          ~datom_entity:Fun.id
          ~entity:(function
            | 1 -> Some "visible"
            | 2 -> Some "hidden"
            | 3 -> Some "internal"
            | _ -> None)
          ~hidden:(String.equal "hidden") ~internal:(String.equal "internal")
      in
      expect_equal "all pages" all [| "visible" |]);
  Fest.test "DB core reads own bounded parent traversal" (fun () ->
      let entities =
        [
          ("child", { uuid = "child"; parent_uuid = Some "parent" });
          ("parent", { uuid = "parent"; parent_uuid = Some "root" });
          ("root", { uuid = "root"; parent_uuid = None });
        ]
      in
      let entity uuid = List.assoc_opt uuid entities in
      let parent value = Option.bind value.parent_uuid entity in
      expect_equal "parents"
        (Core_read.parents_with ~entity ~parent
           ~uuid:(fun value -> value.uuid)
           ~depth:100 "child")
        [| List.assoc "root" entities; List.assoc "parent" entities |];
      expect_equal "depth limit"
        (Core_read.parents_with ~entity ~parent
           ~uuid:(fun value -> value.uuid)
           ~depth:1 "child")
        [| List.assoc "parent" entities |])
