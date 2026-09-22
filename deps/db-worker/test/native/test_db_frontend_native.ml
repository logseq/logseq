(* 1:1 OCaml translation of cljs tests under
   deps/db/test/logseq/db/frontend/ that exercise ported modules:

   - rules_test.cljs   → Db_query_dsl (get-full-deps / extract-rules / %)
   - inputs_test.cljs  → Db_inputs.resolve-input + between rule
   - db_ident_test.cljc → Db_ident.create-db-ident-from-name
   - class_test.cljs   → Db_class.get-class-objects / get-class-object-ids /
                         private-create-page-tag?
   - property_test.cljs → Export_file.sort-properties (the only ported fn;
                         normalize-sorted-entities-block-order and the
                         built-in-properties map are not ported — skipped)
   - property/type_test.cljs → Outliner_property.validate_pred "asset"
                         (the cljs built-in-validation-schemas entry)
   - content_test.cljs → Db_content.recur-replace-uuid-in-block-title
                         (title-ref->id-ref and replace-tags-with-id-refs
                         are not ported — skipped)

   Divergence note: cljs resolve-input throws "Nothing found for entity"
   when :current-block-uuid is nil/invalid; the OCaml port returns the
   input unchanged, so those cases assert the empty query result that
   falls out of the unresolvable binding instead of a thrown error. *)

open Datascript
open Test_shared
open Db_test_util

(* ---------- helpers ---------- *)

(* cljs (comp :block/title first) over single-col pulls *)
let titles_of_rows = pull_titles

(* cljs q-with-rules: query + [:in $ %] + extract-rules over all dsl rules *)
let q_with_rules db (q : string) : query_result list list =
  let rules =
    Db_query_dsl.parse_rules_input
      (Db_query_dsl.extract_rules
         (List.map fst Db_query_dsl.db_query_dsl_rules))
  in
  (* cljs (into query [:in '$ '%]) — :in goes inside the query vector *)
  let q' =
    let len = String.length q in
    (if len > 0 && q.[len - 1] = ']'
     then String.sub q 0 (len - 1)
     else q)
    ^ " :in $ %]"
  in
  Datascript.q_string db ~inputs:[ rules ] q'

(* cljs custom-query: resolve inputs then d/q; adds the :between rules
   input when the query uses '%' *)
let custom_query db ~(inputs : value list) ~(query : string)
    ~(ctx : Db_inputs.context) : query_result list list =
  let q_args =
    List.map
      (fun i -> Arg_scalar (Result_value (Db_inputs.resolve_input db i ctx)))
      inputs
  in
  let q_args =
    if String.contains query '%'
    then
      q_args
      @ [ Db_query_dsl.parse_rules_input
            (Db_query_dsl.extract_rules [ "between" ]) ]
    else q_args
  in
  (* cljs (map first ...) — wrap each first col back into a row for the
     pull_titles extractor *)
  List.map
    (fun row -> [ List.hd row ])
    (Datascript.q_string db ~inputs:q_args query)

(* journal day-int for a calendar offset from real today — the OCaml
   substitute for cljs (with-redefs [t/today ...]) *)
let day_shift p n =
  Date_time_util.date_to_int
    (Date_time_util.plus p n (Date_time_util.today_ms ()))

let journal day title =
  { page = { default_page with pg_journal = Some day };
    blocks = [ { default_block with b_title = Some title } ] }

(* ---------- db_ident_test.cljc ---------- *)

(* cljs valid-edn-keyword?: (edn/read-string (str "{" kw " nil}")) *)
let valid_edn_keyword (kw : string) : bool =
  match Parser.read_edn ("{" ^ kw ^ " nil}") with
  | _ -> true
  | exception _ -> false

let ident_name (ident : string) : string =
  match String.index_opt ident '/' with
  | Some i -> String.sub ident (i + 1) (String.length ident - i - 1)
  | None -> ident

let contains_sub ~sub s =
  let n = String.length sub and m = String.length s in
  let rec loop i =
    i + n <= m && (String.sub s i n = sub || loop (i + 1))
  in
  n = 0 || loop 0

(* (deftest create-db-ident-from-name ...) *)
let test_create_db_ident_from_name () =
  let mk = Db_ident.create_db_ident_from_name ~user_namespace:"user.property" in
  check "create-db-ident-from-name invalid-special"
    (valid_edn_keyword (mk ~name_string:"f@!{h[#"));
  check "create-db-ident-from-name valid-special"
    (valid_edn_keyword (mk ~name_string:"foo*+!_'?<>=-"));
  check "create-db-ident-from-name keeps-special"
    (contains_sub ~sub:"*+!_'?<>=-" (ident_name (mk ~name_string:"foo*+!_'?<>=-")));
  check "create-db-ident-from-name leading-number"
    (valid_edn_keyword (mk ~name_string:"2ndCity"));
  check "create-db-ident-from-name NUM-prefix"
    (String.length (ident_name (mk ~name_string:"2ndCity")) >= 5
     && String.sub (ident_name (mk ~name_string:"2ndCity")) 0 5 = "NUM-2");
  check "create-db-ident-from-name colon"
    (valid_edn_keyword (mk ~name_string:":name")
     && not (contains_sub ~sub:":" (ident_name (mk ~name_string:":name"))));
  check "create-db-ident-from-name slash"
    (valid_edn_keyword (mk ~name_string:"foo/bar")
     && not (contains_sub ~sub:"/" (ident_name (mk ~name_string:"foo/bar"))));
  check "create-db-ident-from-name dot"
    (valid_edn_keyword (mk ~name_string:"foo.bar")
     && not (contains_sub ~sub:"." (ident_name (mk ~name_string:"foo.bar"))))

(* ---------- class_test.cljs ---------- *)

(* (deftest get-class-objects-dedupes-inherited-tags-test ...) *)
let test_get_class_objects_dedupes_inherited_tags () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "Parent", { default_class with c_title = Some "Parent" };
          "Child",
          { default_class with c_title = Some "Child"; c_extends = [ "Parent" ] } ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Object1"; pg_tags = [ "Parent"; "Child" ] };
            blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let parent_id = (ident_ent_exn db "user.class/Parent").id in
  let objects = Db_class.get_class_objects db parent_id in
  let ids = List.map (fun (e : entity) -> e.id) objects in
  check "get-class-objects-dedupes-inherited-tags count" (List.length ids = 1);
  check "get-class-objects-dedupes-inherited-tags distinct"
    (List.length (List.sort_uniq compare ids) = 1);
  check "get-class-objects-dedupes-inherited-tags ids-match"
    (List.sort compare ids
     = List.sort compare (Db_class.get_class_object_ids db parent_id))

(* (deftest get-class-object-ids-does-not-hydrate-each-object-test ...)
   SKIPPED — cljs asserts on d/entity call count via with-redefs; no OCaml
   equivalent. *)

(* (deftest get-class-objects-filters-hidden-objects-test ...) *)
let test_get_class_objects_filters_hidden_objects () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "Parent", { default_class with c_title = Some "Parent" };
          "Child",
          { default_class with c_title = Some "Child"; c_extends = [ "Parent" ] } ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Visible"; pg_tags = [ "Child" ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "Deleted"; pg_tags = [ "Child" ];
                pg_extra = [ "logseq.property/deleted-at", Int 1 ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "Hidden"; pg_tags = [ "Child" ];
                pg_extra = [ "logseq.property/hide?", Bool true ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "Hidden parent";
                pg_extra = [ "logseq.property/hide?", Bool true ] };
            blocks =
              [ { default_block with
                  b_title = Some "Nested hidden"; b_tags = [ "Child" ] } ] };
          { page = { default_page with pg_title = Some "Visible parent" };
            blocks =
              [ { default_block with
                  b_title = Some "Nested visible"; b_tags = [ "Child" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let parent_id = (ident_ent_exn db "user.class/Parent").id in
  let titles =
    sort_uniq
      (List.filter_map ent_title
         (Db_class.get_class_objects db parent_id))
  in
  check "get-class-objects-filters-hidden-objects"
    (titles = [ "Nested visible"; "Visible" ])

(* (deftest get-class-objects-includes-hide-by-default-properties-test ...) *)
let test_get_class_objects_includes_hide_by_default_properties () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ "keywords",
          { default_property with
            p_extra = [ "logseq.property/hide?", Bool true ] };
          "author", default_property;
          "deleted-prop", default_property ]
      ()
  in
  let db = db_of conn in
  let deleted = ident_ent_exn db "user.property/deleted-prop" in
  ignore
    (Datascript.transact_conn conn
       [ Add (Entity_id deleted.id, "logseq.property/deleted-at", Int 1) ]);
  let db = db_of conn in
  let property_class_id = (ident_ent_exn db "logseq.class/Property").id in
  let titles =
    List.filter_map ent_title (Db_class.get_class_objects db property_class_id)
  in
  check "get-class-objects-includes-hide-by-default keywords"
    (List.mem "keywords" titles);
  check "get-class-objects-includes-hide-by-default author"
    (List.mem "author" titles);
  check "get-class-objects-includes-hide-by-default deleted-prop"
    (not (List.mem "deleted-prop" titles));
  check "get-class-objects-includes-hide-by-default Property-type"
    (not (List.mem "Property type" titles))

(* (deftest private-create-page-tag-test ...) *)
let test_private_create_page_tag () =
  let f ~ident ~title () =
    Db_class.private_create_page_tag ?ident ~title ()
  in
  check "private-create-page-tag ident logseq.class/Tag"
    (f ~ident:(Some "logseq.class/Tag") ~title:(Some "Tag") ());
  check "private-create-page-tag ident user.class/MyTag"
    (not (f ~ident:(Some "user.class/MyTag") ~title:(Some "Tag") ()));
  check "private-create-page-tag ident logseq.class/Page"
    (not (f ~ident:(Some "logseq.class/Page") ~title:(Some "Page") ()));
  check "private-create-page-tag title Tag"
    (f ~ident:None ~title:(Some "Tag") ());
  check "private-create-page-tag title Property"
    (f ~ident:None ~title:(Some "Property") ());
  check "private-create-page-tag title Page"
    (not (f ~ident:None ~title:(Some "Page") ()));
  check "private-create-page-tag title Task"
    (not (f ~ident:None ~title:(Some "Task") ()))

(* ---------- property_test.cljs ---------- *)

(* (deftest sort-properties ...) — cljs sorts plain maps; OCaml sorts
   entities, so create bare entities with block/order + block/uuid. *)
let test_sort_properties () =
  let conn = create_conn () in
  let mk ?order uuid =
    let attrs =
      [ "block/uuid", One_value (Uuid uuid) ]
      @ (match order with
         | Some o -> [ "block/order", One_value (String o) ]
         | None -> [])
    in
    ignore
      (Datascript.transact_conn conn [ Entity { db_id = None; attrs } ]);
    (List.hd
       (List.of_seq
          (Datascript.datoms (db_of conn) Avet ~a:"block/uuid"
             ~v:(Uuid uuid) ()))).e
  in
  let p1 = mk ~order:"a" "uuid-a" in
  let p2 = mk ~order:"b" "uuid-b" in
  let p3 = mk "uuid-d" in
  let p4 = mk ~order:"b" "uuid-c" in
  let p5 = mk "uuid-e" in
  let ent id = Option.get (Datascript.entity (db_of conn) (Entity_id id)) in
  let sorted =
    Export_file.sort_properties
      (List.map ent [ p3; p1; p5; p2; p4 ])
  in
  check "sort-properties"
    (List.map (fun (e : entity) -> e.id) sorted = [ p1; p2; p4; p3; p5 ])

(* ---------- property/type_test.cljs ---------- *)

(* (deftest asset-entity-validator ...) *)
let test_asset_entity_validator () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Page" };
            blocks =
              [ { default_block with b_title = Some "plain-block" };
                { default_block with
                  b_title = Some "my-asset";
                  b_tags = [ "logseq.class/Asset" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let asset_block = Option.get (find_block_by_content db "my-asset") in
  let plain_block = Option.get (find_block_by_content db "plain-block") in
  let asset_fn, _msg = Outliner_property.validate_pred "asset" in
  let asset_fn = Option.get asset_fn in
  check "asset-entity-validator asset-block"
    (asset_fn db (Ref asset_block.id));
  check "asset-entity-validator plain-block"
    (not (asset_fn db (Ref plain_block.id)));
  check "asset-entity-validator nonexistent"
    (not (asset_fn db (Ref 9999999)))

(* ---------- content_test.cljs ---------- *)

(* (deftest recur-replace-uuid-in-block-title-test ...) — cljs passes
   nested plain maps; in OCaml the fn takes an entity, so each case builds
   a conn: ref-target entities (uuid/title/refs) plus a block whose
   :block/title holds the id-ref and whose :block/refs point at them. *)
let content_entity ~(block_title : string) ~(block_refs : string list)
    ~(entities : (string * string * string list) list) : entity =
  let conn = create_conn () in
  let block_uuid = gen_uuid () in
  let ref_value u = Ref_to (Lookup_ref ("block/uuid", Uuid u)) in
  let txs =
    List.map
      (fun (uuid, title, refs) ->
        Entity
          { db_id = None
          ; attrs =
              [ "block/uuid", One_value (Uuid uuid)
              ; "block/title", One_value (String title)
              ; "block/name",
                One_value (String (Ldb.page_name_sanity_lc title)) ]
              @ (match refs with
                 | [] -> []
                 | rs -> [ "block/refs", Many_values (List.map ref_value rs) ]) })
      entities
    @ [ Entity
          { db_id = None
          ; attrs =
              [ "block/uuid", One_value (Uuid block_uuid)
              ; "block/title", One_value (String block_title)
              ; "block/name",
                One_value (String (Ldb.page_name_sanity_lc block_title))
              ; "block/refs",
                Many_values (List.map ref_value block_refs) ] } ]
  in
  ignore (Datascript.transact_conn conn txs);
  ent_of_ref_exn (db_of conn) (Lookup_ref ("block/uuid", Uuid block_uuid))

let test_recur_replace_uuid_in_block_title () =
  let uuid_a = "11111111-1111-1111-1111-111111111111" in
  let uuid_b = "22222222-2222-2222-2222-222222222222" in
  let uuid_c = "33333333-3333-3333-3333-333333333333" in
  let id_ref_a = Page_ref.to_page_ref uuid_a in
  let id_ref_b = Page_ref.to_page_ref uuid_b in
  let id_ref_c = Page_ref.to_page_ref uuid_c in
  let b =
    content_entity ~block_title:id_ref_a ~block_refs:[ uuid_a ]
      ~entities:[ uuid_a, "Direct Page", [] ]
  in
  check "recur-replace direct"
    (Db_content.recur_replace_uuid_in_block_title b = Some "[[Direct Page]]");
  let b =
    content_entity ~block_title:id_ref_a ~block_refs:[ uuid_a ]
      ~entities:
        [ uuid_a, id_ref_b, [ uuid_b ]; uuid_b, "Leaf Page", [] ]
  in
  check "recur-replace nested"
    (Db_content.recur_replace_uuid_in_block_title b
     = Some "[[[[Leaf Page]]]]");
  let b =
    content_entity ~block_title:("#" ^ id_ref_a) ~block_refs:[ uuid_a ]
      ~entities:[ uuid_a, "simple-tag", [] ]
  in
  check "recur-replace hashtag"
    (Db_content.recur_replace_uuid_in_block_title b = Some "#simple-tag");
  let b =
    content_entity ~block_title:("#" ^ id_ref_a) ~block_refs:[ uuid_a ]
      ~entities:[ uuid_a, "tag with space", [] ]
  in
  check "recur-replace hashtag-page-ref"
    (Db_content.recur_replace_uuid_in_block_title b
     = Some "#[[tag with space]]");
  let b =
    content_entity ~block_title:id_ref_a ~block_refs:[ uuid_a ]
      ~entities:
        [ uuid_a, id_ref_b, [ uuid_b ];
          uuid_b, id_ref_c, [ uuid_c ];
          uuid_c, "Too Deep", [] ]
  in
  (match Db_content.recur_replace_uuid_in_block_title ~max_depth:1 b with
   | Some result ->
       check "recur-replace max-depth keeps-ref"
         (Regexp.test Db_content.id_ref_re result);
       check "recur-replace max-depth stops"
         (not (contains_sub ~sub:"Too Deep" result))
   | None -> check "recur-replace max-depth" false)

(* ---------- rules_test.cljs ---------- *)

(* (deftest get-full-deps ...) *)
let test_get_full_deps () =
  let deps = Db_query_dsl.get_full_deps in
  let s = List.sort_uniq String.compare in
  let property_value_deps =
    s
      [ "ref->val"; "class-extends"; "object-has-class-property";
        "property-missing-value"; "ref-property-value";
        "ref-property-value-with-default" ]
  in
  let property_deps = s ("ref-property-with-default" :: property_value_deps) in
  let task_deps = s ("task" :: property_deps) in
  let priority_deps = s ("priority" :: property_deps) in
  check "get-full-deps ref-property-value-with-default"
    (s (deps [ "ref-property-value-with-default" ]) = property_value_deps);
  check "get-full-deps ref-property-with-default"
    (s (deps [ "ref-property-with-default" ]) = property_deps);
  check "get-full-deps task" (s (deps [ "task" ]) = task_deps);
  check "get-full-deps priority" (s (deps [ "priority" ]) = priority_deps);
  check "get-full-deps task+priority"
    (s (deps [ "task"; "priority" ]) = s (priority_deps @ task_deps))

let rules_fixture () =
  create_conn_with_blocks
    ~properties:
      [ "foo", default_property;
        "foo2", default_property;
        "number-many",
        { default_property with p_type = "number"; p_cardinality_many = true };
        "page-many",
        { default_property with p_type = "node"; p_cardinality_many = true } ]
    ~pages_and_blocks:
      [ { page =
            { default_page with
              pg_title = Some "Page1";
              pg_properties =
                [ "foo", Str "bar";
                  "number-many", Set_ [ Int 5; Int 10 ];
                  "page-many",
                  Set_ [ Vec [ Kw "build/page"; Map [ "block/title", Str "Page A" ] ] ] ] };
          blocks = [] };
        { page =
            { default_page with
              pg_title = Some "Page A"; pg_properties = [ "foo", Str "bar A" ] };
          blocks = [] } ]
    ()

(* (deftest has-property-rule ...) — cljs fixture is just foo/foo2 + Page1 *)
let test_has_property_rule () =
  let conn =
    create_conn_with_blocks
      ~properties: [ "foo", default_property; "foo2", default_property ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Page1";
                pg_properties = [ "foo", Str "bar" ] };
            blocks = [] } ]
      ()
  in
  let db = db_of conn in
  check "has-property returns result when block has property"
    (titles_of_rows
       (q_with_rules db
          "[:find (pull ?b [:block/title]) :where (has-property ?b :user.property/foo)]")
     = [ "Page1" ]);
  check "has-property returns no result when block doesn't have property"
    (titles_of_rows
       (q_with_rules db
          "[:find (pull ?b [:block/title]) :where (has-property ?b :user.property/foo2)]")
     = []);
  check "has-property can bind to property arg"
    (result_keyword_values
       (q_with_rules db
          "[:find [?p ...] :where (has-property ?b ?p) [?b :block/title \"Page1\"]]")
     = [ "block/tags"; "user.property/foo" ])

(* shared assertions for (ref-property ...) and (property ...) — cljs
   ref-property-rule and property-rule test the same cases twice *)
let property_rule_assertions ~rule_name (db : db) =
  let run_q q = q_with_rules db q in
  let pull_titles_q q = titles_of_rows (run_q q) in
  check (rule_name ^ " cardinality-one match")
    (pull_titles_q
       (Printf.sprintf
          "[:find (pull ?b [:block/title]) :where (%s ?b :user.property/foo \"bar\")]"
          rule_name)
     = [ "Page1" ]);
  check (rule_name ^ " cardinality-one no-match")
    (pull_titles_q
       (Printf.sprintf
          "[:find (pull ?b [:block/title]) :where (%s ?b :user.property/foo \"baz\")]"
          rule_name)
     = []);
  check (rule_name ^ " cardinality-one binds property arg")
    (sort_uniq
       (result_keyword_values
          (run_q
             (Printf.sprintf
                "[:find [?p ...] :where (%s ?b ?p \"bar\") [?b :block/title \"Page1\"]]"
                rule_name)))
     = [ "user.property/foo" ]);
  check (rule_name ^ " cardinality-many match")
    (pull_titles_q
       (Printf.sprintf
          "[:find (pull ?b [:block/title]) :where (%s ?b :user.property/number-many 5)]"
          rule_name)
     = [ "Page1" ]);
  check (rule_name ^ " cardinality-many no-match")
    (pull_titles_q
       (Printf.sprintf
          "[:find (pull ?b [:block/title]) :where (%s ?b :user.property/number-many 20)]"
          rule_name)
     = []);
  check (rule_name ^ " cardinality-many binds property arg")
    (sort_uniq
       (result_keyword_values
          (run_q
             (Printf.sprintf
                "[:find [?p ...] :where (%s ?b ?p 5) [?b :block/title \"Page1\"]]"
                rule_name)))
     = [ "user.property/number-many" ]);
  check (rule_name ^ " ref-property match")
    (pull_titles_q
       (Printf.sprintf
          "[:find (pull ?b [:block/title]) :where (%s ?b :user.property/page-many \"Page A\")]"
          rule_name)
     = [ "Page1" ]);
  check (rule_name ^ " ref-property no-match")
    (pull_titles_q
       "[:find (pull ?b [:block/title]) :where [?b :user.property/page-many ?pv] [?pv :block/title \"Page B\"]]"
     = []);
  check (rule_name ^ " binds property with unbound value")
    (sort_uniq
       (result_keyword_values
          (run_q
             (Printf.sprintf
                "[:find [?p ...] :where (%s ?b ?p _) [?b :block/title \"Page1\"]]"
                rule_name)))
     = [ "block/tags"; "user.property/foo"; "user.property/number-many";
         "user.property/page-many" ]);
  (* #{[:user.property/number-many 10] [:user.property/number-many 5]
        [:user.property/foo "bar"] [:user.property/page-many "Page A"]
        [:block/tags "Page"]} *)
  let pairs =
    List.sort compare
      (List.filter_map
         (function
           | [ Result_attr a; v ] | [ Result_value (Keyword a); v ] ->
               let v' =
                 match v with
                 | Result_value x -> Some x
                 | Result_entity id ->
                     (match Datascript.entity db (Entity_id id) with
                      | Some e ->
                          (match Ldb.value e "block/title" with
                           | Some t -> Some t
                           | None -> Some (Ref id))
                      | None -> Some (Ref id))
                 | _ -> None
               in
               (match v' with Some v -> Some (a, v) | None -> None)
           | _ -> None)
         (run_q
            (Printf.sprintf
               "[:find ?p ?val :where (%s ?b ?p ?val) [?b :block/title \"Page1\"]]"
               rule_name)))
  in
  check (rule_name ^ " binds property and value args")
    (pairs
     = List.sort compare
         [ "block/tags", String "Page";
           "user.property/foo", String "bar";
           "user.property/number-many", Int 5;
           "user.property/number-many", Int 10;
           "user.property/page-many", String "Page A" ]);
  check (rule_name ^ " chains on property value")
    (sort_uniq
       (pull_titles_q
          (Printf.sprintf
             "[:find (pull ?b [:block/title]) :where [?b :user.property/page-many ?pv] (%s ?pv :user.property/foo \"bar A\")]"
             rule_name))
     = [ "Page1" ])

(* (deftest ref-property-rule ...) *)
let test_ref_property_rule () =
  let conn = rules_fixture () in
  property_rule_assertions ~rule_name:"ref-property" (db_of conn)

(* (deftest property-rule ...) *)
let test_property_rule () =
  let conn = rules_fixture () in
  property_rule_assertions ~rule_name:"property" (db_of conn)

(* (deftest tags-test ...) *)
let test_tags () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Page1"; pg_tags = [ "Person" ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "Page2"; pg_tags = [ "Person" ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "Page3"; pg_tags = [ "Employee" ] };
            blocks = [] } ]
      ()
  in
  let person_eid =
    (ident_ent_exn (db_of conn) "user.class/Person").id
  in
  ignore
    (Datascript.transact_conn_string conn
       {|[{:db/ident :user.class/Employee
           :logseq.property.class/extends :user.class/Person}]|});
  let db = db_of conn in
  let expected = [ "Page1"; "Page2"; "Page3" ] in
  check "tags query with eid"
    (sort_uniq
       (titles_of_rows
          (Datascript.q_string db
             ~inputs:
               [ Db_query_dsl.parse_rules_input
                   (Db_query_dsl.extract_rules
                      (List.map fst Db_query_dsl.db_query_dsl_rules));
                 (* cljs passes #{person-eid} — a set of eids bound to scalar
                    ?tag-ids; (number? ?spec) picks them up in tag-spec->tag *)
                 Arg_scalar (Result_value (Set [ Int person_eid ])) ]
             "[:find (pull ?b [:block/title]) :in $ % ?tag-ids :where (tags ?b ?tag-ids)]"))
     = expected);
  check "tags query with db/ident"
    (sort_uniq
       (titles_of_rows
          (q_with_rules db
             "[:find (pull ?b [:block/title]) :where (tags ?b #{:user.class/Person})]"))
     = expected);
  check "tags query with block/title"
    (sort_uniq
       (titles_of_rows
          (q_with_rules db
             "[:find (pull ?b [:block/title]) :where (tags ?b #{\"Person\"})]"))
     = expected)

(* ---------- inputs_test.cljs ---------- *)

let empty_ctx : Db_inputs.context =
  { current_block_uuid = None; current_page_fn = (fun () -> None) }

(* (deftest resolve-input-for-page-and-block-inputs ...) *)
let test_resolve_input_for_page_and_block_inputs () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with
                  b_title = Some "parent";
                  b_children =
                    [ { default_block with b_title = Some "child 1" };
                      { default_block with b_title = Some "child 2" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let page_query =
    "[:find (pull ?b [*]) :in $ ?current-page :where \
     [?b :block/page ?bp] [?bp :block/name ?current-page]]"
  in
  check ":current-page input resolves to current page name"
    (sort_uniq
       (pull_titles
          (custom_query db ~inputs:[ Keyword "current-page" ]
             ~query:page_query
             ~ctx:{ empty_ctx with
                    current_page_fn = (fun () -> Some "page1") }))
     = [ "child 1"; "child 2"; "parent" ]);
  check ":current-page input doesn't resolve when :current-page-fn not provided"
    (custom_query db ~inputs:[ Keyword "current-page" ] ~query:page_query
       ~ctx:empty_ctx
     = []);
  let parent_uuid =
    uuid_of (Option.get (find_block_by_content db "parent"))
  in
  check ":current-block input resolves to current block's :db/id"
    (sort_uniq
       (pull_titles
          (custom_query db ~inputs:[ Keyword "current-block" ]
             ~query:
               "[:find (pull ?b [*]) :in $ ?current-block :where \
                [?b :block/parent ?current-block]]"
             ~ctx:{ empty_ctx with
                    current_block_uuid = Some parent_uuid }))
     = [ "child 1"; "child 2" ]);
  (* cljs: throws "Nothing found for entity" for nil uuid; OCaml returns
     the input unchanged -> binding matches nothing *)
  check ":current-block input doesn't resolve when :current-block-uuid nil"
    (custom_query db ~inputs:[ Keyword "current-block" ]
       ~query:
         "[:find (pull ?b [*]) :in $ ?current-block :where \
          [?b :block/parent ?current-block]]"
       ~ctx:empty_ctx
     = []);
  check ":current-block input doesn't resolve when :current-block-uuid invalid"
    (custom_query db ~inputs:[ Keyword "current-block" ]
       ~query:
         "[:find (pull ?b [*]) :in $ ?current-block :where \
          [?b :block/parent ?current-block]]"
       ~ctx:{ empty_ctx with current_block_uuid = Some "magic" }
     = []);
  let child1_uuid =
    uuid_of (Option.get (find_block_by_content db "child 1"))
  in
  check ":parent-block input resolves to parent of current blocks's :db/id"
    (pull_titles
       (custom_query db ~inputs:[ Keyword "parent-block" ]
          ~query:
            "[:find (pull ?parent-block [*]) :in $ ?parent-block :where \
             [?parent-block :block/parent]]"
          ~ctx:{ empty_ctx with
                 current_block_uuid = Some child1_uuid })
     = [ "parent" ])

(* (deftest resolve-input-for-journal-date-inputs ...) — journal days are
   relative to real today (no with-redefs). *)
let test_resolve_input_for_journal_date_inputs () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ journal (day_shift Days (-7)) "b1";
          journal (day_shift Days 0) "b2" ]
      ()
  in
  let db = db_of conn in
  let between_q =
    "[:find (pull ?b [*]) :in $ ?start ?end % :where (between ?b ?start ?end)]"
  in
  check ":Xd-before and :today resolve to correct journal range"
    (pull_titles
       (custom_query db
          ~inputs:[ Keyword "3d-before"; Keyword "today" ]
          ~query:between_q ~ctx:empty_ctx)
     = [ "b2" ]);
  let conn2 =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ journal (day_shift Days 3) "b1";
          journal (day_shift Days (-3)) "b2" ]
      ()
  in
  check ":tomorrow and :Xd-after resolve to correct journal range"
    (pull_titles
       (custom_query (db_of conn2)
          ~inputs:[ Keyword "tomorrow"; Keyword "4d-after" ]
          ~query:between_q ~ctx:empty_ctx)
     = [ "b1" ])

let journal_title day = Ldb.journal_title_of_day day "MMM do, yyyy"

(* (deftest resolve-input-for-query-page ...) *)
let test_resolve_input_for_query_page () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ journal 20221231 "-1d"; journal 20230101 "now"; journal 20230102 "+1d" ]
      ()
  in
  let db = db_of conn in
  let q =
    "[:find (pull ?b [*]) :in $ ?page :where \
     [?b :block/page ?e] [?e :block/name ?page]]"
  in
  let run input_kw block_title =
    let ctx : Db_inputs.context =
      { current_block_uuid =
          Some (uuid_of (Option.get (find_block_by_content db block_title)));
        current_page_fn = (fun () -> Some (journal_title 20230101)) }
    in
    pull_titles
      (custom_query db ~inputs:[ Keyword input_kw ] ~query:q ~ctx)
  in
  check ":current-page resolves to the stateful page when called from a block on the stateful page"
    (run "current-page" "now" = [ "now" ]);
  check ":query-page resolves to the stateful page when called from a block on the stateful page"
    (run "query-page" "now" = [ "now" ]);
  check ":current-page resolves to the stateful page when called from a block on another page"
    (run "current-page" "+1d" = [ "now" ]);
  check ":query-page resolves to the parent page when called from another page"
    (run "query-page" "+1d" = [ "+1d" ])

(* (deftest resolve-input-for-relative-date-queries ...) — journals are
   placed at the same calendar offsets from real today; :±1y journals sit
   at ±365d so the cljs expectations hold regardless of leap years. *)
let test_resolve_input_for_relative_date_queries () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ journal (day_shift Days (-365)) "-1y";
          journal (day_shift Months (-1)) "-1m";
          journal (day_shift Weeks (-1)) "-1w";
          journal (day_shift Days (-1)) "-1d";
          journal (day_shift Days 0) "now";
          journal (day_shift Days 1) "+1d";
          journal (day_shift Weeks 1) "+1w";
          journal (day_shift Months 1) "+1m";
          journal (day_shift Days 365) "+1y" ]
      ()
  in
  let db = db_of conn in
  let between_q =
    "[:find (pull ?b [*]) :in $ ?start ?end % :where (between ?b ?start ?end)]"
  in
  let between a b =
    pull_titles
      (custom_query db ~inputs:[ Keyword a; Keyword b ] ~query:between_q
         ~ctx:empty_ctx)
  in
  check ":-365d and today resolve to correct journal range"
    (sort_uniq (between "-365d" "today")
     = [ "-1d"; "-1m"; "-1w"; "-1y"; "now" ]);
  check ":-1y and today resolve to correct journal range"
    (sort_uniq (between "-1y" "today")
     = [ "-1d"; "-1m"; "-1w"; "-1y"; "now" ]);
  check ":-1m and today resolve to correct journal range"
    (sort_uniq (between "-1m" "today") = [ "-1d"; "-1m"; "-1w"; "now" ]);
  check ":-1w and today resolve to correct journal range"
    (sort_uniq (between "-1w" "today") = [ "-1d"; "-1w"; "now" ]);
  check ":-1d and today resolve to correct journal range"
    (sort_uniq (between "-1d" "today") = [ "-1d"; "now" ]);
  check ":+365d and today resolve to correct journal range"
    (sort_uniq (between "today" "+365d")
     = [ "+1d"; "+1m"; "+1w"; "+1y"; "now" ]);
  check ":+1y and today resolve to correct journal range"
    (sort_uniq (between "today" "+1y")
     = [ "+1d"; "+1m"; "+1w"; "+1y"; "now" ]);
  check ":+1m and today resolve to correct journal range"
    (sort_uniq (between "today" "+1m") = [ "+1d"; "+1m"; "+1w"; "now" ]);
  check ":+1w and today resolve to correct journal range"
    (sort_uniq (between "today" "+1w") = [ "+1d"; "+1w"; "now" ]);
  check ":+1d and today resolve to correct journal range"
    (sort_uniq (between "today" "+1d") = [ "+1d"; "now" ]);
  check ":today/+1d and today resolve to correct journal range"
    (sort_uniq (between "today" "today/+1d") = [ "+1d"; "now" ])

let cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "create-db-ident-from-name" `Quick test_create_db_ident_from_name;
    Alcotest.test_case "get-class-objects-dedupes-inherited-tags-test" `Quick test_get_class_objects_dedupes_inherited_tags;
    Alcotest.test_case "get-class-objects-filters-hidden-objects-test" `Quick test_get_class_objects_filters_hidden_objects;
    Alcotest.test_case "get-class-objects-includes-hide-by-default-properties-test" `Quick test_get_class_objects_includes_hide_by_default_properties;
    Alcotest.test_case "private-create-page-tag-test" `Quick test_private_create_page_tag;
    Alcotest.test_case "sort-properties" `Quick test_sort_properties;
    Alcotest.test_case "asset-entity-validator" `Quick test_asset_entity_validator;
    Alcotest.test_case "recur-replace-uuid-in-block-title-test" `Quick test_recur_replace_uuid_in_block_title;
    Alcotest.test_case "get-full-deps" `Quick test_get_full_deps;
    Alcotest.test_case "has-property-rule" `Quick test_has_property_rule;
    Alcotest.test_case "ref-property-rule" `Quick test_ref_property_rule;
    Alcotest.test_case "property-rule" `Quick test_property_rule;
    Alcotest.test_case "tags-test" `Quick test_tags;
    Alcotest.test_case "resolve-input-for-page-and-block-inputs" `Quick test_resolve_input_for_page_and_block_inputs;
    Alcotest.test_case "resolve-input-for-journal-date-inputs" `Quick test_resolve_input_for_journal_date_inputs;
    Alcotest.test_case "resolve-input-for-query-page" `Quick test_resolve_input_for_query_page;
    Alcotest.test_case "resolve-input-for-relative-date-queries" `Quick test_resolve_input_for_relative_date_queries ]
