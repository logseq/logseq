(* 1:1 translations of cljs unit tests exercising ported db-worker code.

   Sources:
   - deps/db/test/logseq/db_test.cljs — get-case-page,
     get-journal-page-by-day, ordinary-sibling-*, page-exists,
     test-transact-with-multiple-tx-datoms, get-bidirectional-properties
     (+ ignores-recycled-entities)
   - src/test/frontend/worker/db_core_test.cljs —
     get-block-parents-returns-parents,
     get-block-refs-returns-linked-references,
     get-latest-journals-returns-worker-maps, q-executes-datascript-query,
     q-returns-nil-for-missing-conn, datoms-returns-formatted-datoms,
     pull-returns-entity-data

   cljs deftest names are kept as OCaml test names.

   Skipped cljs cases (unported dependency):
   - sort-page-random-blocks (2 cases): ldb/sort-page-random-blocks not
     ported
   - test-batch-transact!: cljs asserts db validation throws on
     class->property conversion; the OCaml port has no default
     validate-tx-report wired (Db_tx.validate_tx_report_fn = None), so
     the throw assertion has no counterpart
   - batch-transact-with-temp-conn-before-commit-can-abort-live-commit:
     Db_tx.batch_transact_with_temp_conn has no :before-commit opt arg
   - batch-transact-without-pages-date-* /
     test-batch-transact-clears-stale-tx-tail-*: batch-transact! storage
     tail internals are not ported
   - get-bidirectional-properties-performance-* and
     get-latest-journals-bounded-scan: ^:long tests that count d/entity /
     d/datoms calls via with-redefs — no OCaml equivalent
   - plural tests: none exist under deps/common/test
   - id-ref->title-ref / content-id-ref->page tests: none exist in
     deps/db test dirs

   Whole-file drops (no native counterpart):
   - src/test/frontend/worker/db_worker_node_test.cljs (52 deftests):
     drives the cljs db-worker-node daemon — logseq.cli.server HTTP
     /v1/invoke + /v1/events SSE and the @logseq/graph-lifecycle npm
     module. There is no OCaml daemon/server to port it against;
     VERIFY-CLJS.md covers those tests by loading the melange build
     into the cljs daemon harness instead.
   - src/test/frontend/worker/a_test_env.cljs: js/globalThis
     (self/importScripts/postMessage) shims — N/A natively.

   Known cljs-vs-OCaml divergences surfaced by these tests (asserted
   where observable, not papered over):
   - cljs page-exists? returns a seq of matching page eids;
     Ldb.page_exists returns bool. Boolean equivalents asserted.
   - cljs entity->plain-map :block/title goes through
     entity-plus/get-block-title (journal pages get the formatted
     journal title); OCaml page_summary emits the stored literal under
     :block/title and the computed title under :block/raw-title. The
     get-latest-journals test asserts :block/raw-title; the :block/title
     mismatch is reported, not asserted.
   - cljs thread-api/get-block-refs accepts an entity ref
     ([:block/uuid u]); the OCaml endpoint takes the resolved eid int.

   Lib bugs found by these tests (reported upstream, fixed in
   fd406466b2 / 304c07d865):
   - Ldb.values (lib/ldb.ml) drops One_entity/Many_entities produced by
     entity_attr's ref materialization, so every ref-attr accessor
     (ref_ids/ref_ent/has_tag/is_page/...) returned empty. Requires
     unwrapping te.db_id back to Ref. Verified: all assertions below pass
     with that fix.
   - lib/db_tx.ml (ceed505197) called undefined transact_report and
     commit_tx_report; transact ~tx_meta db tx_ops and reset_conn
     ~tx_meta conn report.db_after compile and keep these tests green. *)

open Datascript
open Test_shared

(* Endpoint modules self-register via top-level Dispatcher.register
   effects; force module init before invoking by name. *)
let () = Worker_core.init ()

(* ---------- deps/db/test/logseq/db_test.cljs ---------- *)

(* (deftest get-case-page ...) *)
let test_get_case_page () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "foo", Db_test_util.{ default_property with p_type = "default" };
          "Foo", Db_test_util.{ default_property with p_type = "default" } ]
      ~classes:
        [ "movie", Db_test_util.default_class;
          "Movie", Db_test_util.default_class ]
      ()
  in
  let db = db_of conn in
  let title_of name =
    match Ldb.get_case_page db (String name) with
    | Some e -> ent_title e
    | None -> None
  in
  check "get-case-page foo" (title_of "foo" = Some "foo");
  check "get-case-page Foo" (title_of "Foo" = Some "Foo");
  check "get-case-page movie" (title_of "movie" = Some "movie");
  check "get-case-page Movie" (title_of "Movie" = Some "Movie")

(* (deftest get-journal-page-by-day ...) *)
let test_get_journal_page_by_day () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_journal = Some 20260410 };
              blocks = [] };
          Db_test_util.
            { page = { default_page with pg_journal = Some 20260411 };
              blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let title_of day =
    match Ldb.get_journal_page_by_day db day with
    | Some e -> ent_title e
    | None -> None
  in
  check "get-journal-page-by-day 20260410"
    (title_of 20260410 = Some "Apr 10th, 2026");
  check "get-journal-page-by-day 20260411"
    (title_of 20260411 = Some "Apr 11th, 2026")

(* (deftest ordinary-sibling-skips-created-from-property-children ...)
   (deftest ordinary-sibling-skips-closed-value-property-children ...)
   cljs create-sibling-conn transacts the same raw tx maps. *)
let create_sibling_conn extra_attrs =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/title \"page\" :block/name \"page\"}
            {:db/id -2 :db/ident :user.property/p}
            {:db/id -3 :block/title \"ordinary before\" :block/parent -1 :block/order \"a0\"}
            {:db/id -4 :block/title \"property value\" :block/parent -1 :block/order \"a1\" %s}
            {:db/id -5 :block/title \"ordinary after\" :block/parent -1 :block/order \"a2\"}]"
          extra_attrs));
  conn

let check_ordinary_sibling name conn =
  let db = db_of conn in
  let before' = Option.get (block_by_title db "ordinary before") in
  let after' = Option.get (block_by_title db "ordinary after") in
  check
    (name ^ " left of after")
    (match Ldb.get_left_sibling after' with
     | Some e -> e.id = before'.id
     | None -> false);
  check
    (name ^ " right of before")
    (match Ldb.get_right_sibling before' with
     | Some e -> e.id = after'.id
     | None -> false)

let test_ordinary_sibling_skips_created_from_property_children () =
  check_ordinary_sibling "ordinary-sibling-skips-created-from-property-children"
    (create_sibling_conn ":logseq.property/created-from-property -2")

let test_ordinary_sibling_skips_closed_value_property_children () =
  check_ordinary_sibling "ordinary-sibling-skips-closed-value-property-children"
    (create_sibling_conn ":block/closed-value-property -2")

(* (deftest page-exists ...)
   cljs page-exists? returns a seq of page eids (e.g. ["foo" page]);
   Ldb.page_exists returns bool — boolean equivalents asserted. *)
let test_page_exists () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "foo", Db_test_util.{ default_property with p_type = "default" } ]
      ~classes: [ "movie", Db_test_util.default_class ]
      ()
  in
  let db = db_of conn in
  check "page-exists foo Property"
    (Ldb.page_exists db "foo" [ "logseq.class/Property" ]);
  check "page-exists foo Tag"
    (not (Ldb.page_exists db "foo" [ "logseq.class/Tag" ]));
  check "page-exists movie Tag"
    (Ldb.page_exists db "movie" [ "logseq.class/Tag" ]);
  check "page-exists movie Property"
    (not (Ldb.page_exists db "movie" [ "logseq.class/Property" ]))

(* (deftest test-transact-with-multiple-tx-datoms ...) *)
let test_transact_with_multiple_tx_datoms () =
  (* cljs (d/create-conn) — no schema *)
  let conn = Datascript.create_conn () in
  ignore (Datascript.transact_conn_string conn "[[:db/add -1 :property :v1]]");
  let tx = (Datascript.db conn).max_tx in
  let property_of_e1 () =
    match Datascript.entity (Datascript.db conn) (Entity_id 1) with
    | Some e -> Ldb.value e "property"
    | None -> None
  in
  ignore
    (Datascript.transact_conn conn
       [ Raw_datom { e = 1; a = "property"; v = Keyword "v1"; tx = tx + 1; added = false };
         Raw_datom { e = 1; a = "property"; v = Keyword "v1"; tx = tx + 1; added = true } ]);
  check "test-transact-with-multiple-tx-datoms retract+add same tx"
    (property_of_e1 () = Some (Keyword "v1"));
  ignore
    (Datascript.transact_conn conn
       [ Raw_datom { e = 1; a = "property"; v = Keyword "v1"; tx = tx + 2; added = false };
         Raw_datom { e = 1; a = "property"; v = Keyword "v1"; tx = tx + 2; added = true } ]);
  check "test-transact-with-multiple-tx-datoms tx+2"
    (property_of_e1 () = Some (Keyword "v1"))

(* (deftest get-bidirectional-properties ...) — both testing branches *)
let create_bidirectional_conn ~enabled =
  let open Db_test_util in
  create_conn_with_blocks
    ~properties:
      [ "friend",
        { default_property with
          p_type = "node";
          p_property_classes = [ "Person" ] } ]
    ~classes:
      [ "Person",
        { default_class with
          c_properties =
            (if enabled
             then [ "logseq.property.class/enable-bidirectional?", Bool true ]
             else []) };
        "Project", default_class ]
    ~pages_and_blocks:
      [ { page =
            { default_page with
              pg_title = Some "Alice";
              pg_tags = [ "Person" ];
              pg_properties = [ "friend", build_page_ref ~title:"Bob" () ] };
          blocks = [] };
        { page = { default_page with pg_title = Some "Bob" }; blocks = [] };
        { page =
            { default_page with
              pg_title = Some "Charlie";
              pg_tags = [ "Project" ];
              pg_properties = [ "friend", build_page_ref ~title:"Bob" () ] };
          blocks = [] } ]
    ()

let test_get_bidirectional_properties_disabled () =
  let db = db_of (create_bidirectional_conn ~enabled:false) in
  let target = Option.get (block_by_title db "Bob") in
  check "get-bidirectional-properties disabled"
    (Ldb.get_bidirectional_properties db target.id = [])

let test_get_bidirectional_properties () =
  let conn = create_bidirectional_conn ~enabled:true in
  let db = db_of conn in
  let target = Option.get (block_by_title db "Bob") in
  let result = Ldb.get_bidirectional_properties db target.id in
  check "get-bidirectional-properties group count" (List.length result = 1);
  match result with
  | [ g ] ->
      check "get-bidirectional-properties group title" (g.title = "People");
      check "get-bidirectional-properties group entities"
        (List.map ent_title g.entities = [ Some "Alice" ])
  | _ -> ()

(* (deftest get-bidirectional-properties-ignores-recycled-entities ...) *)
let test_get_bidirectional_properties_ignores_recycled_entities () =
  let conn = create_bidirectional_conn ~enabled:true in
  let db = db_of conn in
  let target = Option.get (block_by_title db "Bob") in
  let alice = Option.get (block_by_title db "Alice") in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id %d :logseq.property/deleted-at 1}]" alice.id));
  (* fresh db value: datascript dbs are immutable, the captured db
     predates the deleted-at tx *)
  check "get-bidirectional-properties-ignores-recycled-entities"
    (Ldb.get_bidirectional_properties (db_of conn) target.id = [])

(* ---------- src/test/frontend/worker/db_core_test.cljs ---------- *)

(* (deftest get-block-parents-returns-parents ...) *)
let test_get_block_parents_returns_parents () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/uuid #uuid \"00000000-0000-4000-8000-00000000aa01\" :block/title \"grandparent\"}
         {:block/uuid #uuid \"00000000-0000-4000-8000-00000000bb02\" :block/title \"parent\"
          :block/parent [:block/uuid #uuid \"00000000-0000-4000-8000-00000000aa01\"]}
         {:block/uuid #uuid \"00000000-0000-4000-8000-00000000cc03\" :block/title \"child\"
          :block/parent [:block/uuid #uuid \"00000000-0000-4000-8000-00000000bb02\"]}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/get-block-parents"
         [ Wire.String test_repo;
           Wire.Array
             [ Wire.Keyword "block/uuid";
               Wire.Uuid "00000000-0000-4000-8000-00000000cc03" ];
           Wire.Int 3 ])
  in
  let titles =
    List.filter_map (fun m -> wire_string_field "block/title" m) (wire_maps res)
  in
  check "get-block-parents-returns-parents seq" (titles <> []);
  check "get-block-parents-returns-parents contains parent"
    (List.mem "parent" titles)

(* (deftest get-block-refs-returns-linked-references ...)
   cljs passes [:block/uuid ref-uuid]; the OCaml endpoint takes the
   resolved eid — resolved via entity lookup, same endpoint. *)
let test_get_block_refs_returns_linked_references () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/uuid #uuid \"00000000-0000-4000-8000-00000000dd04\" :block/title \"reference target\"}
         {:block/uuid #uuid \"00000000-0000-4000-8000-00000000ee05\" :block/title \"block with ref\"
          :block/refs [:block/uuid #uuid \"00000000-0000-4000-8000-00000000dd04\"]}]");
  register_conn conn;
  let eid =
    match Datascript.entity (db_of conn)
            (Lookup_ref ("block/uuid", Uuid "00000000-0000-4000-8000-00000000dd04"))
    with
    | Some e -> e.id
    | None -> failwith "ref entity not found"
  in
  let res =
    await
      (Dispatcher.invoke "thread-api/get-block-refs"
         [ Wire.String test_repo; Wire.Int eid ])
  in
  check "get-block-refs-returns-linked-references seq"
    (wire_maps res <> [])

(* (deftest get-latest-journals-returns-worker-maps ...)
   cljs transacts build-db-initial-data first; the Journal entity's
   title-format prop is absent here so the default "MMM do, yyyy"
   format is used — same output for these days. The cljs test asserts
   :block/title = formatted journal title because cljs entity lookup
   maps :block/title through get-block-title; the OCaml endpoint emits
   the stored literal under :block/title and the formatted title under
   :block/raw-title, so raw-title is asserted here (see header note). *)
let test_get_latest_journals_returns_worker_maps () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/title \"2024-01-01\" :block/name \"2024-01-01\"
          :block/journal-day 20240101 :block/tags :logseq.class/Journal}
         {:block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/title \"2024-01-02\" :block/name \"2024-01-02\"
          :block/journal-day 20240102 :block/tags :logseq.class/Journal}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/get-latest-journals"
         [ Wire.String test_repo; Wire.Int 1 ])
  in
  let maps = wire_maps res in
  check "get-latest-journals-returns-worker-maps uuids"
    (List.map (fun m -> wire_string_field "block/uuid" m) maps
     = [ Some "22222222-2222-2222-2222-222222222222" ]);
  check "get-latest-journals-returns-worker-maps raw-titles"
    (List.map (fun m -> wire_string_field "block/raw-title" m) maps
     = [ Some "Jan 2nd, 2024" ])

(* (deftest q-executes-datascript-query ...) *)
let test_q_executes_datascript_query () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/title \"page a\"} {:block/title \"page b\"}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/q"
         [ Wire.String test_repo;
           Wire.Array
             [ Wire.String "[:find ?t :where [_ :block/title ?t]]" ] ])
  in
  let rows =
    match res with Wire.Array r | Wire.List r | Wire.Set r -> r | _ -> []
  in
  check "q-executes-datascript-query" (List.length rows = 2)

(* (deftest get-class-extends ...) *)
let test_get_class_extends () =
  let conn = Db_test_util.create_conn () in
  (* cljs class-parents-data *)
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/tags", One_value (Ref_to (Ident "logseq.class/Tag"))
               ; "block/title", One_value (String "x")
               ; "block/name", One_value (String "x")
               ; "block/uuid",
                 One_value (Uuid "6c353967-f79b-4785-b804-a39b81d72461") ] }
       ; Entity
           { db_id = None
           ; attrs =
               [ "block/tags", One_value (Ref_to (Ident "logseq.class/Tag"))
               ; "block/title", One_value (String "y")
               ; "block/name", One_value (String "y")
               ; "block/uuid",
                 One_value (Uuid "7008db08-ba0c-4aa9-afc6-7e4783e40a99")
               ; "logseq.property.class/extends",
                 One_value
                   (Ref_to
                      (Lookup_ref
                         ("block/uuid",
                          Uuid "6c353967-f79b-4785-b804-a39b81d72461"))) ] }
       ; Entity
           { db_id = None
           ; attrs =
               [ "block/tags", One_value (Ref_to (Ident "logseq.class/Tag"))
               ; "block/title", One_value (String "z")
               ; "block/name", One_value (String "z")
               ; "block/uuid",
                 One_value (Uuid "d95f2912-a7af-41b9-8ed5-28861f7fc0be")
               ; "logseq.property.class/extends",
                 One_value
                   (Ref_to
                      (Lookup_ref
                         ("block/uuid",
                          Uuid "7008db08-ba0c-4aa9-afc6-7e4783e40a99"))) ] } ]);
  let db = db_of conn in
  let z =
    match Ldb.get_page db (String "z") with
    | Some e -> e
    | None -> failwith "class page z not found"
  in
  let titles =
    sort_uniq
      (List.filter_map ent_title (Db_class.get_class_extends z))
  in
  check "get-class-extends" (titles = [ "x"; "y" ])

(* (deftest q-returns-nil-for-nonexistent-conn ...) *)
let test_q_returns_nil_for_nonexistent_conn () =
  let res =
    await
      (Dispatcher.invoke "thread-api/q"
         [ Wire.String "nonexistent-repo";
           Wire.Array [ Wire.String "[:find ?e :where [?e _ _]]" ] ])
  in
  check "q-returns-nil-for-missing-conn" (res = Wire.nil)

(* (deftest datoms-returns-formatted-datoms ...) *)
let test_datoms_returns_formatted_datoms () =
  let conn = Db_test_util.create_conn_bare () in
  ignore (Datascript.transact_conn_string conn "[{:block/title \"test\"}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/datoms"
         [ Wire.String test_repo; Wire.Keyword "eavt" ])
  in
  let rows = match res with Wire.Array r | Wire.List r -> r | _ -> [] in
  check "datoms-returns-formatted-datoms seq" (rows <> []);
  check "datoms-returns-formatted-datoms tuple length"
    (match rows with
     | Wire.Array items :: _ -> List.length items = 5
     | Wire.List items :: _ -> List.length items = 5
     | _ -> false)

(* (deftest pull-returns-entity-data ...) *)
let test_pull_returns_entity_data () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/title \"test page\" :block/name \"test-page\"
          :block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/pull"
         [ Wire.String test_repo;
           Wire.String "[*]";
           Wire.Array
             [ Wire.Keyword "block/uuid";
               Wire.Uuid "11111111-1111-1111-1111-111111111111" ] ])
  in
  check "pull-returns-entity-data is map"
    (match res with Wire.Map _ -> true | _ -> false);
  (match res with
   | Wire.Map kvs ->
       check "pull-returns-entity-data title"
         (wire_string_field "block/title" kvs = Some "test page")
   | _ -> ())

(* (deftest batch-transact-with-temp-conn-preserves-retracts-test ...) *)
let test_batch_transact_with_temp_conn_preserves_retracts_test () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page 1" };
              blocks = [ { default_block with b_title = Some "old" } ] } ]
      ()
  in
  let block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "old")
  in
  let block_id = block.id in
  let uuid = uuid_of block in
  let ref_ = Lookup_ref ("block/uuid", Uuid uuid) in
  ignore
    (Db_tx.batch_transact_with_temp_conn conn (fun temp ->
         ignore
           (Db_tx.transact temp
              [ Retract (ref_, "block/title", Some (String "old")) ]);
         ignore
           (Db_tx.transact temp
              [ Add (ref_, "block/title", String "new") ])));
  let e = ent_of_ref_exn (db_of conn) (Entity_id block_id) in
  check "batch-transact-with-temp-conn-preserves-retracts"
    (Ldb.string_value e "block/title" = Some "new")

(* (deftest batch-transact-with-temp-conn-preserves-cardinality-one-schema-test
   ...) *)
let test_batch_transact_with_temp_conn_preserves_cardinality_one_schema_test () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page 1" };
              blocks = [ { default_block with b_title = Some "old" } ] } ]
      ()
  in
  let block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "old")
  in
  let block_id = block.id in
  let uuid = uuid_of block in
  ignore
    (Db_tx.transact conn
       [ Add (Entity_id block_id, "block/order", String "a0") ]);
  ignore
    (Db_tx.batch_transact_with_temp_conn conn (fun temp ->
         ignore
           (Db_tx.transact temp
              [ Add (Lookup_ref ("block/uuid", Uuid uuid), "block/order",
                     String "a1") ])));
  let e = ent_of_ref_exn (db_of conn) (Entity_id block_id) in
  check "batch-transact-with-temp-conn-preserves-cardinality-one-schema"
    (Ldb.string_value e "block/order" = Some "a1")

(* (deftest validated-transact-retries-when-live-conn-changes-before-commit-test
   ...) *)
let test_validated_transact_retries_when_live_conn_changes_before_commit_test () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page 1" };
              blocks =
                [ { default_block with b_title = Some "first" };
                  { default_block with b_title = Some "second" } ] } ]
      ()
  in
  let first_block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "first")
  in
  let second_block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "second")
  in
  let injected = ref false in
  let saved = !Db_tx.transact_pipeline_fn in
  (try
     Db_tx.transact_pipeline_fn
       := Some
            (fun (report : tx_report) ->
              if
                (not !injected)
                && List.exists
                     (fun (d : datom) ->
                       d.a = "block/title" && d.v = String "first updated")
                     report.tx_data
              then begin
                injected := true;
                ignore
                  (Db_tx.transact conn
                     [ Add (Entity_id second_block.id, "block/title",
                            String "second updated") ])
              end;
              report);
     ignore
       (Db_tx.transact conn
          [ Add (Entity_id first_block.id, "block/title",
                 String "first updated") ]);
     let first' = ent_of_ref_exn (db_of conn) (Entity_id first_block.id) in
     let second' =
       ent_of_ref_exn (db_of conn) (Entity_id second_block.id)
     in
     check "validated-transact-retries first"
       (Ldb.string_value first' "block/title" = Some "first updated");
     check "validated-transact-retries second"
       (Ldb.string_value second' "block/title" = Some "second updated")
   with e ->
     Db_tx.transact_pipeline_fn := saved;
     raise e);
  Db_tx.transact_pipeline_fn := saved

(* (deftest fix-db-transact-runs-pipeline-without-recursive-validation-test
   ...) *)
let test_fix_db_transact_runs_pipeline_without_recursive_validation_test () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page 1" };
              blocks = [ { default_block with b_title = Some "before" } ] } ]
      ()
  in
  let block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "before")
  in
  let block_id = block.id in
  let saved_pipeline = !Db_tx.transact_pipeline_fn in
  let saved_validate = !Db_tx.validate_tx_report_fn in
  (try
     Db_tx.transact_pipeline_fn
       := Some
            (fun (report : tx_report) ->
              let stamp =
                Datascript.with_tx report.db_after
                  [ Entity
                      { db_id = Some (Entity_id block_id)
                      ; attrs = [ "block/tx-id", One_value (Int 42) ] } ]
              in
              { stamp with
                db_before = report.db_before
              ; tx_data = report.tx_data @ stamp.tx_data
              ; tx_meta = report.tx_meta });
     (* cljs with-redefs db-validate/validate-tx-report to throw — any
        validation here would be a recursive-validation bug *)
     Db_tx.validate_tx_report_fn
       := Some
            (fun (_ : tx_report) ->
              failwith
                "Repair transactions must not recursively validate");
     ignore
       (Db_tx.transact conn
          ~tx_meta:[ "fix-db?", Bool true ]
          [ Entity
              { db_id = Some (Entity_id block_id)
              ; attrs = [ "block/title", One_value (String "after") ] } ]);
     let e = ent_of_ref_exn (db_of conn) (Entity_id block_id) in
     check "fix-db-transact title"
       (Ldb.string_value e "block/title" = Some "after");
     check "fix-db-transact pipeline-data committed"
       (Ldb.value e "block/tx-id" = Some (Int 42))
   with e ->
     Db_tx.transact_pipeline_fn := saved_pipeline;
     Db_tx.validate_tx_report_fn := saved_validate;
     raise e);
  Db_tx.transact_pipeline_fn := saved_pipeline;
  Db_tx.validate_tx_report_fn := saved_validate

(* (deftest transact-new-graph-refs-skips-pipeline-test ...) *)
let test_transact_new_graph_refs_skips_pipeline_test () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page 1" };
              blocks = [ { default_block with b_title = Some "before" } ] } ]
      ()
  in
  let block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "before")
  in
  let block_id = block.id in
  let calls = ref 0 in
  let saved = !Db_tx.transact_pipeline_fn in
  (try
     Db_tx.transact_pipeline_fn
       := Some (fun (r : tx_report) -> incr calls; r);
     ignore
       (Db_tx.transact conn
          ~tx_meta:[ "transact-new-graph-refs?", Bool true ]
          [ Entity
              { db_id = Some (Entity_id block_id)
              ; attrs = [ "block/title", One_value (String "after") ] } ]);
     check "transact-new-graph-refs-skips-pipeline calls" (!calls = 0);
     let e = ent_of_ref_exn (db_of conn) (Entity_id block_id) in
     check "transact-new-graph-refs-skips-pipeline title"
       (Ldb.string_value e "block/title" = Some "after")
   with e ->
     Db_tx.transact_pipeline_fn := saved;
     raise e);
  Db_tx.transact_pipeline_fn := saved

(* ---------- property/class/validate test helpers ---------- *)

(* Force Endpoint_property module init so its Dispatcher.register effects run *)
let () = ignore Endpoint_property.get_property_node_selector_data

let str_contains (s : string) (sub : string) : bool =
  let ls = String.length s and lsub = String.length sub in
  let rec loop i =
    i + lsub <= ls && (String.sub s i lsub = sub || loop (i + 1))
  in
  lsub = 0 || loop 0

(* cljs thrown-with-msg? — matches ex-info message OR our payload :message *)
let exn_message (e : exn) : string =
  match e with
  | Outliner_validate.Notification w ->
      (match Wire.get "payload" w with
       | Some p ->
           (match Wire.get "message" p with
            | Some (Wire.String s) -> s
            | _ -> "")
       | None -> "")
  | Failure s | Invalid_argument s -> s
  | _ -> Printexc.to_string e

let throws_with (name : string) (needle : string) (f : unit -> _) : unit =
  let ok =
    (try
       ignore (f ());
       false
     with e -> str_contains (exn_message e) needle)
  in
  check name ok

let throws_any (name : string) (f : unit -> _) : unit =
  let ok =
    (try
       ignore (f ());
       false
     with _ -> true)
  in
  check name ok

let ent_ident (d : db) (i : string) : entity option = entity d (Ident i)
let ent_uuid (d : db) (u : string) : entity option =
  entity d (Lookup_ref ("block/uuid", Uuid u))
let ident_kw (e : entity) : string =
  Option.value (Ldb.ident_of e) ~default:""
let block_uuid_ref (u : string) : Wire.t =
  Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ]
let uuid_of (e : entity) : string =
  match Ldb.value e "block/uuid" with
  | Some (Uuid u) -> u
  | _ -> failwith "entity has no block/uuid"
let tag_idents (e : entity) : string list =
  List.sort_uniq String.compare
    (List.filter_map Ldb.ident_of (Ldb.ref_ents e "block/tags"))
let prop_value_ents (e : entity) (a : attr) : entity list =
  Ldb.ref_ents e a
(* db-property/property-value-content *)
let prop_value_content (e : entity) : string =
  match Ldb.value e "logseq.property/value" with
  | Some (String s) -> s
  | Some v -> Ds_wire.edn_of_transit (Ds_wire.transit_of_value v)
  | None -> Option.value (Ldb.string_value e "block/title") ~default:""
let closed_values_content (d : db) (prop_ident : string) : string list =
  match ent_ident d prop_ident with
  | None -> []
  | Some p ->
      List.map prop_value_content (Outliner_property.closed_values_of p)
      |> List.sort compare
let kw (s : string) : Wire.t = Wire.Keyword s
let kw_map (kvs : (string * Wire.t) list) : Wire.t =
  Wire.Map (List.map (fun (k, v) -> Wire.Keyword k, v) kvs)

(* ---------- deps/db/test/logseq/db/frontend/class_test.cljs ---------- *)

(* (deftest get-class-objects-dedupes-inherited-tags-test ...) *)
let test_get_class_objects_dedupes_inherited_tags_test () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes:
        [ "Parent", Db_test_util.{ default_class with c_title = Some "Parent" };
          "Child",
            Db_test_util.{ default_class with c_title = Some "Child";
                           c_extends = [ "Parent" ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Object1";
                             pg_tags = [ "Parent"; "Child" ] };
            Db_test_util.blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let parent_id =
    match ent_ident db "user.class/Parent" with
    | Some e -> e.id
    | None -> failwith "Parent class missing"
  in
  let objects = Db_class.get_class_objects db parent_id in
  let ids = List.map (fun (e : entity) -> e.id) objects in
  check "get-class-objects-dedupes-inherited-tags count=1"
    (List.length ids = 1);
  check "get-class-objects-dedupes-inherited-tags distinct"
    (List.sort_uniq compare ids = ids);
  check "get-class-objects-dedupes-inherited-tags ids match"
    (Db_class.get_class_object_ids db parent_id = ids)

(* get-class-object-ids-does-not-hydrate-each-object-test is not portable:
   it counts d/entity calls via with-redefs. The OCaml
   get_class_object_ids shares the same id-only query path as
   get_class_objects by construction. *)

(* (deftest get-class-objects-filters-hidden-objects-test ...) *)
let test_get_class_objects_filters_hidden_objects_test () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes:
        [ "Parent", Db_test_util.{ default_class with c_title = Some "Parent" };
          "Child",
            Db_test_util.{ default_class with c_title = Some "Child";
                           c_extends = [ "Parent" ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Visible";
                             pg_tags = [ "Child" ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Deleted";
                             pg_tags = [ "Child" ];
                             pg_extra = [ "logseq.property/deleted-at", Db_test_util.Int 1 ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Hidden";
                             pg_tags = [ "Child" ];
                             pg_extra = [ "logseq.property/hide?", Db_test_util.Bool true ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Hidden parent";
                             pg_extra = [ "logseq.property/hide?", Db_test_util.Bool true ] };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "Nested hidden";
                                b_tags = [ "Child" ] } ] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Visible parent" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "Nested visible";
                                b_tags = [ "Child" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let parent_id =
    match ent_ident db "user.class/Parent" with
    | Some e -> e.id
    | None -> failwith "Parent class missing"
  in
  let titles =
    List.sort compare
      (List.filter_map
         (fun (e : entity) -> Ldb.string_value e "block/title")
         (Db_class.get_class_objects db parent_id))
  in
  check "get-class-objects-filters-hidden-objects titles"
    (titles = [ "Nested visible"; "Visible" ])

(* (deftest get-class-objects-includes-hide-by-default-properties-test ...) *)
let test_get_class_objects_includes_hide_by_default_properties_test () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "keywords",
            Db_test_util.{ default_property with
                           p_extra = [ "logseq.property/hide?", Db_test_util.Bool true ] };
          "author", Db_test_util.default_property;
          "deleted-prop", Db_test_util.default_property ]
      ()
  in
  let db = db_of conn in
  (* private built-in property analog of cljs :logseq.property/type *)
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "logseq.property/type";
        "block/title", Db_test_util.Str "Property type";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
        "logseq.property/built-in?", Db_test_util.Bool true ] ];
  (match ent_ident db "user.property/deleted-prop" with
   | Some deleted ->
       ignore
         (Db_transact.transact conn
            [ Wire.Array
                [ kw "db/add"; Wire.Int deleted.id
                ; kw "logseq.property/deleted-at"; Wire.Int 1 ] ]
            [])
   | None -> failwith "deleted-prop missing");
  let db = db_of conn in
  let property_class_id =
    match ent_ident db "logseq.class/Property" with
    | Some e -> e.id
    | None -> failwith "Property class missing"
  in
  let titles =
    List.map
      (fun (e : entity) -> Option.value (Ldb.string_value e "block/title") ~default:"")
      (Db_class.get_class_objects db property_class_id)
  in
  check "hide-by-default user properties appear in Property table (keywords)"
    (List.mem "keywords" titles);
  check "hide-by-default user properties appear in Property table (author)"
    (List.mem "author" titles);
  check "deleted properties stay out of the Property table"
    (not (List.mem "deleted-prop" titles));
  check "private built-in properties stay out of the Property table"
    (not (List.mem "Property type" titles))

(* (deftest private-create-page-tag-test ...) *)
let test_private_create_page_tag_test () =
  let open Db_class in
  check "private-create-page-tag ident authoritative Tag"
    (private_create_page_tag ~ident:"logseq.class/Tag" ~title:(Some "Tag") () = true);
  check "private-create-page-tag ident authoritative user class"
    (private_create_page_tag ~ident:"user.class/MyTag" ~title:(Some "Tag") () = false);
  check "private-create-page-tag ident authoritative Page"
    (private_create_page_tag ~ident:"logseq.class/Page" ~title:(Some "Page") () = false);
  check "private-create-page-tag title fallback Tag"
    (private_create_page_tag ~title:(Some "Tag") () = true);
  check "private-create-page-tag title fallback Property"
    (private_create_page_tag ~title:(Some "Property") () = true);
  check "private-create-page-tag title fallback Page"
    (private_create_page_tag ~title:(Some "Page") () = false);
  check "private-create-page-tag title fallback Task"
    (private_create_page_tag ~title:(Some "Task") () = false)

(* ---------- deps/outliner/test/logseq/outliner/property_test.cljs ---------- *)

(* (deftest upsert-property! "Creates a property" ...) *)
let test_upsert_property () =
  let conn = Db_test_util.create_conn_with_blocks () in
  ignore
    (Outliner_property.upsert_property conn None
       (Wire.Map [ kw "logseq.property/type", kw "number" ])
       ~property_name:(Some "num") ~properties:[]);
  (match ent_ident (db_of conn) "user.property/num" with
   | Some e ->
       check "upsert-property! creates property with :number type"
         (Ldb.value e "logseq.property/type" = Some (Keyword "number"))
   | None -> check "upsert-property! creates property with :number type" false)

(* (deftest upsert-property! "Updates a property" ...) *)
let test_upsert_property_2 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "num", Db_test_util.{ default_property with p_type = "number" } ]
      ()
  in
  let db = db_of conn in
  let old_updated_at =
    match ent_ident db "user.property/num" with
    | Some e ->
        (match Ldb.value e "block/updated-at" with
         | Some (Int t) -> float_of_int t
         | Some (Instant t) -> Int64.to_float t
         | Some (Float t) -> t
         | _ -> 0.)
    | None -> failwith "num missing"
  in
  (* testing "and change its cardinality" *)
  ignore
    (Outliner_property.upsert_property conn (Some "user.property/num")
       (Wire.Map [ kw "db/cardinality", kw "many" ])
       ~property_name:None ~properties:[]);
  let db = db_of conn in
  (match ent_ident db "user.property/num" with
   | Some e ->
       check "upsert-property! cardinality->many"
         (Ldb.value e "db/cardinality" = Some (Keyword "db.cardinality/many"));
       check "upsert-property! bumps block/updated-at"
         ((match Ldb.value e "block/updated-at" with
           | Some (Int t) -> float_of_int t
           | Some (Instant t) -> Int64.to_float t
           | Some (Float t) -> t
           | _ -> 0.)
          > old_updated_at)
   | None -> check "upsert-property! cardinality->many" false);
  (* testing "and change its type from a ref to a non-ref type" *)
  ignore
    (Outliner_property.upsert_property conn (Some "user.property/num")
       (Wire.Map [ kw "logseq.property/type", kw "checkbox" ])
       ~property_name:None ~properties:[]);
  let db = db_of conn in
  (match ent_ident db "user.property/num" with
   | Some e ->
       check "upsert-property! type->checkbox"
         (Ldb.value e "logseq.property/type" = Some (Keyword "checkbox"));
       check "upsert-property! checkbox drops db/valueType"
         (Ldb.value e "db/valueType" = None)
   | None -> check "upsert-property! type->checkbox" false)

(* (deftest upsert-property! "Multiple properties that generate the same
   initial :db/ident" ...) *)
let test_upsert_property_3 () =
  let conn = Db_test_util.create_conn_with_blocks () in
  ignore
    (Outliner_property.upsert_property conn None
       (Wire.Map [ kw "logseq.property/type", kw "default" ])
       ~property_name:(Some "p1") ~properties:[]);
  ignore
    (Outliner_property.upsert_property conn None (Wire.Map [])
       ~property_name:(Some "p1") ~properties:[]);
  ignore
    (Outliner_property.upsert_property conn None (Wire.Map [])
       ~property_name:(Some "p1") ~properties:[]);
  let db = db_of conn in
  check "upsert-property! existing db/ident not modified"
    (match ent_ident db "user.property/p1" with
     | Some e ->
         Ldb.string_value e "block/title" = Some "p1"
         && Ldb.string_value e "block/name" = Some "p1"
         && Ldb.value e "logseq.property/type" = Some (Keyword "default")
     | None -> false);
  check "upsert-property! 2nd property gets unique ident"
    (match ent_ident db "user.property/p1-1" with
     | Some e -> Ldb.string_value e "block/title" = Some "p1"
     | None -> false);
  check "upsert-property! 3rd property gets unique ident"
    (match ent_ident db "user.property/p1-2" with
     | Some e -> Ldb.string_value e "block/title" = Some "p1"
     | None -> false)

(* (deftest upsert-property-rejects-type-change-with-existing-data ...) *)
let test_upsert_property_rejects_type_change_with_existing_data () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties = [ "status", Db_test_util.Str "active" ] } ] } ]
      ()
  in
  throws_with
    "upsert-property rejects type change with existing data"
    "type can't be changed"
    (fun () ->
       Outliner_property.upsert_property conn (Some "user.property/status")
         (Wire.Map [ kw "logseq.property/type", kw "number" ])
         ~property_name:None ~properties:[])

let test_upsert_property_rejects_type_change_with_existing_data_2 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "empty-prop", Db_test_util.{ default_property with p_type = "default" } ]
      ()
  in
  ignore
    (Outliner_property.upsert_property conn (Some "user.property/empty-prop")
       (Wire.Map [ kw "logseq.property/type", kw "number" ])
       ~property_name:None ~properties:[]);
  (match ent_ident (db_of conn) "user.property/empty-prop" with
   | Some e ->
       check "upsert-property type change allowed with no values"
         (Ldb.value e "logseq.property/type" = Some (Keyword "number"))
   | None -> check "upsert-property type change allowed with no values" false)

(* (deftest convert-property-input-string ...)
   cljs calls the private fn with a bare property map; the OCaml fn takes an
   entity — seed ident entities carrying just :logseq.property/type. *)
let test_convert_property_input_string () =
  let conn = Db_test_util.create_conn () in
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "user.property/p-number";
        "logseq.property/type", Db_test_util.Kw "number" ];
      [ "db/ident", Db_test_util.Kw "user.property/p-url";
        "logseq.property/type", Db_test_util.Kw "url" ];
      [ "db/ident", Db_test_util.Kw "user.property/p-date";
        "logseq.property/type", Db_test_util.Kw "date" ];
      [ "db/ident", Db_test_util.Kw "user.property/p-any";
        "logseq.property/type", Db_test_util.Kw "any" ];
      [ "db/ident", Db_test_util.Kw "user.property/p-none" ] ];
  let db = db_of conn in
  let prop_of i =
    match ent_ident db i with Some e -> e | None -> failwith "prop missing"
  in
  let test_uuid = "8e2e810d-06a6-4bb9-a6b4-e42943b2e2f0" in
  check "convert-property-input-string number int"
    (Outliner_property.convert_property_input_string None
       (prop_of "user.property/p-number") (Wire.String "1")
     = Wire.Float 1.);
  check "convert-property-input-string number float"
    (Outliner_property.convert_property_input_string None
       (prop_of "user.property/p-number") (Wire.String "1.2")
     = Wire.Float 1.2);
  List.iter
    (fun ident ->
       check ("convert-property-input-string " ^ ident ^ " uuid passthrough")
         (Outliner_property.convert_property_input_string None
            (prop_of ident) (Wire.Uuid test_uuid)
          = Wire.Uuid test_uuid))
    [ "user.property/p-url"; "user.property/p-date"; "user.property/p-any";
      "user.property/p-none" ]

(* (deftest create-property-text-block! "Create a new :default property value" ...) *)
let test_create_property_text_block () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties = [ "default", Db_test_util.Str "foo" ] };
                Db_test_util.{ default_block with b_title = Some "b2" } ] } ]
      ()
  in
  let db = db_of conn in
  let block =
    match Db_test_util.find_block_by_content db "b2" with
    | Some b -> b
    | None -> failwith "b2 missing"
  in
  ignore
    (Outliner_property.create_property_text_block conn
       ~block_id:(Some (Wire.Int block.id)) "user.property/default"
       (Wire.String "") ());
  let b2' =
    match Db_test_util.find_block_by_content (db_of conn) "b2" with
    | Some b -> b
    | None -> failwith "b2 missing after"
  in
  (match prop_value_ents b2' "user.property/default" with
   | [ pv ] ->
       check "create-property-text-block! new property value created" true;
       check "create-property-text-block! value content"
         (prop_value_content pv = "");
       check "create-property-text-block! created-from-property"
         (match Ldb.ref_ents pv "logseq.property/created-from-property" with
          | [ src ] -> ident_kw src = "user.property/default"
          | _ ->
              (match Ldb.value pv "logseq.property/created-from-property" with
               | Some (Ref id) ->
                   (match Ldb.ent_of_id pv.db id with
                    | Some s -> ident_kw s = "user.property/default"
                    | None -> false)
               | _ -> false))
   | _ -> check "create-property-text-block! new property value created" false)

(* (deftest create-property-text-block! "Create cases for a new :one :number
   property value" ...) *)
let test_create_property_text_block_2 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties = [ "num", Db_test_util.Int 2 ] };
                Db_test_util.{ default_block with b_title = Some "b2" } ] } ]
      ()
  in
  let db = db_of conn in
  let block =
    match Db_test_util.find_block_by_content db "b2" with
    | Some b -> b
    | None -> failwith "b2 missing"
  in
  ignore
    (Outliner_property.create_property_text_block conn
       ~block_id:(Some (Wire.Int block.id)) "user.property/num"
       (Wire.String "3") ());
  let b2' =
    match Db_test_util.find_block_by_content (db_of conn) "b2" with
    | Some b -> b
    | None -> failwith "b2 missing after"
  in
  (match prop_value_ents b2' "user.property/num" with
   | [ pv ] ->
       check "create-property-text-block! :number value created" true;
       check "create-property-text-block! :number value content"
         (Ldb.value pv "logseq.property/value" = Some (Float 3.));
       check "create-property-text-block! :number created-from-property"
         (prop_value_ents pv "logseq.property/created-from-property"
          |> List.exists (fun s -> ident_kw s = "user.property/num"))
   | _ -> check "create-property-text-block! :number value created" false);
  throws_with
    "create-property-text-block! wrong value not transacted"
    "Can't convert"
    (fun () ->
       Outliner_property.create_property_text_block conn
         ~block_id:(Some (Wire.Int block.id)) "user.property/num"
         (Wire.String "Not a number") ())

(* (deftest create-property-text-block! "Create new :many :number property
   values" ...) *)
let test_create_property_text_block_3 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "num-many",
            Db_test_util.{ default_property with p_type = "number";
                           p_cardinality_many = true } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties =
                                  [ "num-many", Db_test_util.Set_ [ Db_test_util.Int 2 ] ] };
                Db_test_util.{ default_block with b_title = Some "b2" } ] } ]
      ()
  in
  let db = db_of conn in
  let block =
    match Db_test_util.find_block_by_content db "b2" with
    | Some b -> b
    | None -> failwith "b2 missing"
  in
  List.iter
    (fun s ->
       ignore
         (Outliner_property.create_property_text_block conn
            ~block_id:(Some (Wire.Int block.id)) "user.property/num-many"
            (Wire.String s) ()))
    [ "3"; "4"; "5" ];
  let b2' =
    match Db_test_util.find_block_by_content (db_of conn) "b2" with
    | Some b -> b
    | None -> failwith "b2 missing after"
  in
  let pves = prop_value_ents b2' "user.property/num-many" in
  let values =
    List.filter_map
      (fun e ->
         match Ldb.value e "logseq.property/value" with
         | Some (Float f) -> Some f
         | _ -> None)
      pves
    |> List.sort_uniq compare
  in
  check "create-property-text-block! many number values"
    (values = [ 3.; 4.; 5. ])

(* (deftest set-block-property-basic-cases ...) *)
let test_set_block_property_basic_cases () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties = [ "num", Db_test_util.Int 2 ] };
                Db_test_util.{ default_block with b_title = Some "b2" } ] } ]
      ()
  in
  let db = db_of conn in
  let property_value =
    match
      Db_test_util.find_block_by_content db "b1"
      |> Option.map (fun b -> prop_value_ents b "user.property/num")
    with
    | Some [ pv ] -> pv
    | _ -> failwith "b1 num property value missing"
  in
  let block_uuid =
    match Db_test_util.find_block_by_content db "b2" with
    | Some b -> uuid_of b
    | None -> failwith "b2 missing"
  in
  Outliner_property.set_block_property conn
    (block_uuid_ref block_uuid) "user.property/num" (Wire.Int property_value.id);
  let b2' =
    match Db_test_util.find_block_by_content (db_of conn) "b2" with
    | Some b -> b
    | None -> failwith "b2 missing after"
  in
  check "set-block-property! sets :number value with existing entity"
    (match prop_value_ents b2' "user.property/num" with
     | [ pv ] -> pv.id = property_value.id
     | _ -> false);
  (* empty-placeholder — seed the ident entity like the cljs ontology *)
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "logseq.property/empty-placeholder" ] ];
  let empty_placeholder_id =
    match ent_ident (db_of conn) "logseq.property/empty-placeholder" with
    | Some e -> e.id
    | None -> failwith "empty-placeholder missing"
  in
  Outliner_property.set_block_property conn
    (block_uuid_ref block_uuid) "user.property/num"
    (Wire.Int empty_placeholder_id);
  let b2'' =
    match ent_uuid (db_of conn) block_uuid with
    | Some b -> b
    | None -> failwith "b2 missing after"
  in
  check "set-block-property! empty-placeholder stored as value"
    (match prop_value_ents b2'' "user.property/num" with
     | [ pv ] ->
         (match Ldb.value pv "logseq.property/value" with
          | Some (Ref id) | Some (Int id) -> id = empty_placeholder_id
          | _ -> pv.id = empty_placeholder_id)
     | _ -> false)

(* set-block-property "Update a :number value with existing value" *)
let test_set_block_property_basic_cases_2 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties = [ "num", Db_test_util.Int 2 ] };
                Db_test_util.{ default_block with b_title = Some "b2";
                                b_properties = [ "num", Db_test_util.Int 3 ] } ] } ]
      ()
  in
  let db = db_of conn in
  let property_value =
    match
      Db_test_util.find_block_by_content db "b1"
      |> Option.map (fun b -> prop_value_ents b "user.property/num")
    with
    | Some [ pv ] -> pv
    | _ -> failwith "b1 num property value missing"
  in
  let block_uuid =
    match Db_test_util.find_block_by_content db "b2" with
    | Some b -> uuid_of b
    | None -> failwith "b2 missing"
  in
  Outliner_property.set_block_property conn
    (block_uuid_ref block_uuid) "user.property/num" (Wire.Int property_value.id);
  let b2' =
    match Db_test_util.find_block_by_content (db_of conn) "b2" with
    | Some b -> b
    | None -> failwith "b2 missing after"
  in
  check "set-block-property! updates :number value"
    (match prop_value_ents b2' "user.property/num" with
     | [ pv ] -> pv.id = property_value.id
     | _ -> false)

(* (deftest set-block-property-with-non-ref-values ...) *)
let test_set_block_property_with_non_ref_values () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "logseq.property/order-list-type", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties =
                                  [ "logseq.property/order-list-type",
                                    Db_test_util.Str "number" ] };
                Db_test_util.{ default_block with b_title = Some "b2" } ] } ]
      ()
  in
  let db = db_of conn in
  let property_value =
    match
      Db_test_util.find_block_by_content db "b1"
      |> Option.map (fun b -> prop_value_ents b "logseq.property/order-list-type")
    with
    | Some [ pv ] -> pv
    | _ -> failwith "b1 order-list-type property value missing"
  in
  let block_uuid =
    match Db_test_util.find_block_by_content db "b2" with
    | Some b -> uuid_of b
    | None -> failwith "b2 missing"
  in
  Outliner_property.set_block_property conn
    (block_uuid_ref block_uuid) "logseq.property/order-list-type"
    (Wire.String "number");
  let b2' =
    match Db_test_util.find_block_by_content (db_of conn) "b2" with
    | Some b -> b
    | None -> failwith "b2 missing after"
  in
  (match prop_value_ents b2' "logseq.property/order-list-type" with
   | [ pv ] ->
       check "set-block-property! :default value sets" true;
       check "set-block-property! :default reuses existing value entity"
         (pv.id = property_value.id)
   | _ -> check "set-block-property! :default value sets" false)

(* set-block-property "Setting :checkbox with same property value reuses
   existing entity" *)
let test_set_block_property_with_non_ref_values_2 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "checkbox", Db_test_util.{ default_property with p_type = "checkbox" } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties = [ "checkbox", Db_test_util.Bool true ] };
                Db_test_util.{ default_block with b_title = Some "b2" } ] } ]
      ()
  in
  let db = db_of conn in
  let property_value =
    match Db_test_util.find_block_by_content db "b1" with
    | Some b -> Ldb.value b "user.property/checkbox"
    | _ -> failwith "b1 checkbox property value missing"
  in
  let block_uuid =
    match Db_test_util.find_block_by_content db "b2" with
    | Some b -> uuid_of b
    | None -> failwith "b2 missing"
  in
  Outliner_property.set_block_property conn
    (block_uuid_ref block_uuid) "user.property/checkbox" (Wire.Bool true);
  let b2' =
    match Db_test_util.find_block_by_content (db_of conn) "b2" with
    | Some b -> b
    | None -> failwith "b2 missing after"
  in
  check "set-block-property! checkbox value set"
    (Ldb.value b2' "user.property/checkbox" = Some (Bool true));
  check "set-block-property! checkbox reuses value"
    (Ldb.value b2' "user.property/checkbox" = property_value)

(* (deftest remove-block-property! ...) *)
let test_remove_block_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties = [ "default", Db_test_util.Str "foo" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let block =
    match Db_test_util.find_block_by_content db "b1" with
    | Some b -> b
    | None -> failwith "b1 missing"
  in
  check "remove-block-property! precondition"
    (Ldb.value block "user.property/default" <> None);
  Outliner_property.remove_block_property conn
    (block_uuid_ref (uuid_of block)) "user.property/default";
  (match Db_test_util.find_block_by_content (db_of conn) "b1" with
   | Some updated ->
       check "remove-block-property! deletes block property"
         (Ldb.value updated "user.property/default" = None)
   | None -> check "remove-block-property! deletes block property" false)

(* (deftest batch-set-property! "Set built-in property values for multiple
   blocks" ...) — user.property/order-list-type stands in for the built-in
   (same default-type write path). *)
let test_batch_set_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties: [ "order-list-type", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "item 1" };
                Db_test_util.{ default_block with b_title = Some "item 2" } ] } ]
      ()
  in
  let db = db_of conn in
  let block_uuids =
    List.map
      (fun t ->
         match Db_test_util.find_block_by_content db t with
         | Some b -> Wire.Uuid (uuid_of b)
         | None -> failwith "block missing")
      [ "item 1"; "item 2" ]
  in
  Outliner_property.batch_set_property conn block_uuids
    "user.property/order-list-type" (Wire.String "number") ();
  let contents =
    List.map
      (fun t ->
         match Db_test_util.find_block_by_content (db_of conn) t with
         | Some b ->
             (match prop_value_ents b "user.property/order-list-type" with
              | [ pv ] -> prop_value_content pv
              | _ ->
                  (match Ldb.value b "user.property/order-list-type" with
                   | Some (String s) -> s
                   | _ -> "MISSING"))
         | None -> "MISSING")
      [ "item 1"; "item 2" ]
  in
  check "batch-set-property! values are batch set"
    (contents = [ "number"; "number" ])

(* batch-set-property "Set custom default-many property values from string
   vector" *)
let test_batch_set_property_2 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "reproducible-steps",
            Db_test_util.{ default_property with p_cardinality_many = true;
                           p_extra = [ "logseq.property/public?", Db_test_util.Bool true ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "target" } ] } ]
      ()
  in
  let block_uuid =
    match Db_test_util.find_block_by_content (db_of conn) "target" with
    | Some b -> uuid_of b
    | None -> failwith "target missing"
  in
  Outliner_property.batch_set_property conn [ Wire.Uuid block_uuid ]
    "user.property/reproducible-steps"
    (Wire.Array [ Wire.String "Step 1"; Wire.String "Step 2"; Wire.String "Step 3" ])
    ();
  (match ent_uuid (db_of conn) block_uuid with
   | Some b ->
       let contents =
         List.sort compare
           (List.map prop_value_content
              (prop_value_ents b "user.property/reproducible-steps"))
       in
       check "batch-set-property! string vector persisted as many values"
         (contents = [ "Step 1"; "Step 2"; "Step 3" ])
   | None -> check "batch-set-property! string vector persisted" false)

(* batch-set-property "Set custom default-many property values from id
   vector" *)
let test_batch_set_property_3 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "reproducible-steps",
            Db_test_util.{ default_property with p_cardinality_many = true;
                           p_extra = [ "logseq.property/public?", Db_test_util.Bool true ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "source";
                                b_properties =
                                  [ "reproducible-steps",
                                    Db_test_util.Set_
                                      [ Db_test_util.Str "Step 1";
                                        Db_test_util.Str "Step 2";
                                        Db_test_util.Str "Step 3" ] ] };
                Db_test_util.{ default_block with b_title = Some "target" } ] } ]
      ()
  in
  let db = db_of conn in
  let source_ids =
    match Db_test_util.find_block_by_content db "source" with
    | Some b ->
        List.map (fun e -> Wire.Int e.id)
          (prop_value_ents b "user.property/reproducible-steps")
    | None -> failwith "source missing"
  in
  let target_uuid =
    match Db_test_util.find_block_by_content db "target" with
    | Some b -> uuid_of b
    | None -> failwith "target missing"
  in
  Outliner_property.batch_set_property conn [ Wire.Uuid target_uuid ]
    "user.property/reproducible-steps" (Wire.Array source_ids) ();
  (match ent_uuid (db_of conn) target_uuid with
   | Some b ->
       let contents =
         List.sort compare
           (List.map prop_value_content
              (prop_value_ents b "user.property/reproducible-steps"))
       in
       check "batch-set-property! id vector persisted as many values"
         (contents = [ "Step 1"; "Step 2"; "Step 3" ])
   | None -> check "batch-set-property! id vector persisted" false)

(* batch-set-property "Invalid many values throw and don't partially persist" *)
let test_batch_set_property_4 () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "reproducible-steps",
            Db_test_util.{ default_property with p_cardinality_many = true;
                           p_extra = [ "logseq.property/public?", Db_test_util.Bool true ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "target" } ] } ]
      ()
  in
  let block_uuid =
    match Db_test_util.find_block_by_content (db_of conn) "target" with
    | Some b -> uuid_of b
    | None -> failwith "target missing"
  in
  throws_any "batch-set-property! invalid many values throw"
    (fun () ->
       Outliner_property.batch_set_property conn [ Wire.Uuid block_uuid ]
         "user.property/reproducible-steps"
         (Wire.Array [ Wire.Int 999999 ]) ());
  (match ent_uuid (db_of conn) block_uuid with
   | Some b ->
       check "batch-set-property! no partial values on failure"
         (prop_value_ents b "user.property/reproducible-steps" = [])
   | None -> check "batch-set-property! no partial values on failure" false)

(* (deftest status-property-setting-classes ...) *)
let test_status_property_setting_classes () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes:
        [ "Cat", Db_test_util.default_class;
          "Project",
            Db_test_util.{ default_class with
                           c_class_properties = [ "logseq.property/status" ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "" };
                Db_test_util.{ default_block with b_title = Some "cat task";
                                b_tags = [ "Cat" ] };
                Db_test_util.{ default_block with b_title = Some "project task";
                                b_tags = [ "Project" ] } ] } ]
      (* seed the built-in Task class, status property and status.doing closed
         value BEFORE fixture tx — the cljs ontology provides these and
         :logseq.property.class/properties resolves the ident refs *)
      ~pre_txs:
        [ [ "db/ident", Db_test_util.Kw "logseq.class/Task";
            "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Tag" ];
            "block/title", Db_test_util.Str "Task";
            "block/name", Db_test_util.Str "task" ];
          [ "db/ident", Db_test_util.Kw "logseq.property/status";
            "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
            "block/title", Db_test_util.Str "status";
            "block/name", Db_test_util.Str "status";
            "logseq.property/type", Db_test_util.Kw "default" ];
          [ "db/ident", Db_test_util.Kw "logseq.property/status.doing";
            "block/title", Db_test_util.Str "Doing";
            "block/page", Db_test_util.Kw "logseq.property/status";
            "block/parent", Db_test_util.Kw "logseq.property/status";
            "block/closed-value-property", Db_test_util.Kw "logseq.property/status" ] ]
      ()
  in
  let db = db_of conn in
  let uuid_of_title t =
    match Db_test_util.find_block_by_content db t with
    | Some b -> uuid_of b
    | None ->
        (match Db_test_util.find_page_by_title db t with
         | Some p -> uuid_of p
         | None -> failwith ("missing " ^ t))
  in
  let empty_task = uuid_of_title "" in
  let cat_task = uuid_of_title "cat task" in
  let project_task = uuid_of_title "project task" in
  let page1_uuid = uuid_of_title "page1" in
  let tags_of u =
    match ent_uuid (db_of conn) u with
    | Some e -> tag_idents e
    | None -> []
  in
  Outliner_property.batch_set_property conn [ Wire.Uuid empty_task ]
    "logseq.property/status" (kw "logseq.property/status.doing") ();
  check "status-property adds Task to untagged block"
    (tags_of empty_task = [ "logseq.class/Task" ]);
  Outliner_property.batch_set_property conn [ Wire.Uuid page1_uuid ]
    "logseq.property/status" (kw "logseq.property/status.doing") ();
  check "status-property adds Task to page without tag"
    (tags_of page1_uuid = [ "logseq.class/Page"; "logseq.class/Task" ]);
  Outliner_property.batch_set_property conn [ Wire.Uuid cat_task ]
    "logseq.property/status" (kw "logseq.property/status.doing") ();
  check "status-property adds Task to tagged block without status class"
    (tags_of cat_task = [ "logseq.class/Task"; "user.class/Cat" ]);
  Outliner_property.batch_set_property conn [ Wire.Uuid project_task ]
    "logseq.property/status" (kw "logseq.property/status.doing") ();
  check "status-property does not add Task when class provides status"
    (tags_of project_task = [ "user.class/Project" ])

(* (deftest task-child-class-does-not-add-parent-task-tag ...) *)
let test_task_child_class_does_not_add_parent_task_tag () =
  List.iter
    (fun (property_id, v) ->
       let conn =
         Db_test_util.create_conn_with_blocks
           ~classes:
             [ "Work",
                 Db_test_util.{ default_class with
                                c_extends = [ "logseq.class/Task" ] } ]
           ~pages_and_blocks:
             [ { Db_test_util.page =
                   Db_test_util.{ default_page with pg_title = Some "plain page" };
                 Db_test_util.blocks = [] };
               { Db_test_util.page =
                   Db_test_util.{ default_page with pg_title = Some "work page";
                                  pg_tags = [ "Work" ] };
                 Db_test_util.blocks =
                   [ Db_test_util.{ default_block with b_title = Some "work block";
                                     b_tags = [ "Work" ] } ] } ]
           (* seed Task class providing the task property idents BEFORE
              fixture tx — Work extends :logseq.class/Task by ident ref *)
           ~pre_txs:
             [ [ "db/ident", Db_test_util.Kw "logseq.property/status";
                 "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
                 "block/title", Db_test_util.Str "status";
                 "block/name", Db_test_util.Str "status";
                 "logseq.property/type", Db_test_util.Kw "default" ];
               [ "db/ident", Db_test_util.Kw "logseq.property/scheduled";
                 "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
                 "block/title", Db_test_util.Str "scheduled";
                 "block/name", Db_test_util.Str "scheduled";
                 "logseq.property/type", Db_test_util.Kw "datetime" ];
               [ "db/ident", Db_test_util.Kw "logseq.property/deadline";
                 "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
                 "block/title", Db_test_util.Str "deadline";
                 "block/name", Db_test_util.Str "deadline";
                 "logseq.property/type", Db_test_util.Kw "datetime" ];
               [ "db/ident", Db_test_util.Kw "logseq.class/Task";
                 "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Tag" ];
                 "block/title", Db_test_util.Str "Task";
                 "block/name", Db_test_util.Str "task";
                 "logseq.property.class/properties",
                 Db_test_util.Vec
                   [ Db_test_util.Kw "logseq.property/status";
                     Db_test_util.Kw "logseq.property/scheduled";
                     Db_test_util.Kw "logseq.property/deadline" ] ];
               [ "db/ident", Db_test_util.Kw "logseq.property/status.doing";
                 "block/title", Db_test_util.Str "Doing";
                 "block/page", Db_test_util.Kw "logseq.property/status";
                 "block/parent", Db_test_util.Kw "logseq.property/status";
                 "block/closed-value-property", Db_test_util.Kw "logseq.property/status" ] ]
           ()
       in
       let db = db_of conn in
       let uuid_of_title t =
         match Db_test_util.find_page_by_title db t with
         | Some p -> uuid_of p
         | None ->
             (match Db_test_util.find_block_by_content db t with
              | Some b -> uuid_of b
              | None -> failwith ("missing " ^ t))
       in
       let plain_page = uuid_of_title "plain page" in
       let work_page = uuid_of_title "work page" in
       let work_block = uuid_of_title "work block" in
       let tags_of u =
         match ent_uuid (db_of conn) u with
         | Some e -> tag_idents e
         | None -> []
       in
       Outliner_property.batch_set_property conn [ Wire.Uuid plain_page ]
         property_id v ();
       check
         (Printf.sprintf "task-child-class %s adds Task to plain page"
            property_id)
         (tags_of plain_page = [ "logseq.class/Page"; "logseq.class/Task" ]);
       Outliner_property.batch_set_property conn [ Wire.Uuid work_page ]
         property_id v ();
       check
         (Printf.sprintf "task-child-class %s keeps Task child on page"
            property_id)
         (tags_of work_page = [ "logseq.class/Page"; "user.class/Work" ]);
       Outliner_property.batch_set_property conn [ Wire.Uuid work_block ]
         property_id v ();
       check
         (Printf.sprintf "task-child-class %s keeps Task child on block"
            property_id)
         (tags_of work_block = [ "user.class/Work" ]))
    [ "logseq.property/status", kw "logseq.property/status.doing";
      "logseq.property/scheduled", Wire.Int64 1783612800000L;
      "logseq.property/deadline", Wire.Int64 1783699200000L ]

(* (deftest batch-set-property-rejects-private-built-in-entity ...) *)
let test_batch_set_property_rejects_private_built_in_entity () =
  let conn = Db_test_util.create_conn () in
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "logseq.property/empty-placeholder";
        "logseq.property/built-in?", Db_test_util.Bool true ];
      [ "db/ident", Db_test_util.Kw "logseq.property/description";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
        "block/title", Db_test_util.Str "description";
        "block/name", Db_test_util.Str "description";
        "logseq.property/built-in?", Db_test_util.Bool true;
        "logseq.property/type", Db_test_util.Kw "default" ] ];
  let placeholder_id =
    match ent_ident (db_of conn) "logseq.property/empty-placeholder" with
    | Some e -> e.id
    | None -> failwith "placeholder missing"
  in
  throws_with "batch-set-property rejects private built-in entity"
    "can't be modified"
    (fun () ->
       Outliner_property.batch_set_property conn [ Wire.Int placeholder_id ]
         "logseq.property/description" (Wire.String "hacked") ())

(* (deftest batch-remove-property! ...) *)
let test_batch_remove_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes: [ "C1", Db_test_util.default_class ]
      ~properties: [ "order-list-type", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "item 1";
                                b_properties =
                                  [ "order-list-type", Db_test_util.Str "number" ] };
                Db_test_util.{ default_block with b_title = Some "item 2";
                                b_properties =
                                  [ "order-list-type", Db_test_util.Str "number" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let block_uuids =
    List.map
      (fun t ->
         match Db_test_util.find_block_by_content db t with
         | Some b -> Wire.Uuid (uuid_of b)
         | None -> failwith "block missing")
      [ "item 1"; "item 2" ]
  in
  Outliner_property.batch_remove_property conn block_uuids
    "user.property/order-list-type" ();
  let vals' =
    List.map
      (fun t ->
         match Db_test_util.find_block_by_content (db_of conn) t with
         | Some b -> Ldb.value b "user.property/order-list-type"
         | None -> None)
      [ "item 1"; "item 2" ]
  in
  check "batch-remove-property! property values are batch removed"
    (vals' = [ None; None ]);
  let page1_id =
    match Db_test_util.find_page_by_title db "page1" with
    | Some p -> p.id
    | None -> failwith "page1 missing"
  in
  throws_with "batch-remove-property! can't remove private"
    "Can't remove private"
    (fun () ->
       Outliner_property.batch_remove_property conn [ Wire.Int page1_id ]
         "block/tags" ());
  let c1_id =
    match ent_ident db "user.class/C1" with
    | Some e -> e.id
    | None -> failwith "C1 missing"
  in
  throws_with "batch-remove-property! can't remove required"
    "Can't remove required"
    (fun () ->
       Outliner_property.batch_remove_property conn [ Wire.Int c1_id ]
         "logseq.property.class/extends" ())

(* (deftest batch-remove-property-rejects-private-built-in-entity ...) *)
let test_batch_remove_property_rejects_private_built_in_entity () =
  let conn = Db_test_util.create_conn () in
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "logseq.property/empty-placeholder";
        "logseq.property/built-in?", Db_test_util.Bool true ];
      [ "db/ident", Db_test_util.Kw "logseq.property/description";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
        "block/title", Db_test_util.Str "description";
        "block/name", Db_test_util.Str "description";
        "logseq.property/built-in?", Db_test_util.Bool true;
        "logseq.property/type", Db_test_util.Kw "default" ] ];
  let placeholder_id =
    match ent_ident (db_of conn) "logseq.property/empty-placeholder" with
    | Some e -> e.id
    | None -> failwith "placeholder missing"
  in
  throws_with "batch-remove-property rejects private built-in entity"
    "can't be modified"
    (fun () ->
       Outliner_property.batch_remove_property conn [ Wire.Int placeholder_id ]
         "logseq.property/description" ())

(* (deftest add-existing-values-to-closed-values! ...) *)
let test_add_existing_values_to_closed_values () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties = [ "num", Db_test_util.Int 1 ] };
                Db_test_util.{ default_block with b_title = Some "b2";
                                b_properties = [ "num", Db_test_util.Int 2 ] } ] } ]
      ()
  in
  let db = db_of conn in
  let values =
    List.of_seq (datoms db Avet ~a:"user.property/num" ())
    |> List.filter_map
         (fun d ->
            match d.v with
            | Ref id ->
                (match Ldb.ent_of_id db id with
                 | Some e -> uuid_of e |> Option.some
                 | None -> None)
            | _ -> None)
  in
  Outliner_property.add_existing_values_to_closed_values conn
    "user.property/num" values;
  check "add-existing-values-to-closed-values! contents"
    (closed_values_content (db_of conn) "user.property/num" = [ "1"; "2" ])

(* (deftest add-existing-generated-value-to-closed-values-reparents-to-property ...) *)
let test_add_existing_generated_value_to_closed_values_reparents_to_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "reproducible-steps",
            Db_test_util.{ default_property with p_cardinality_many = true;
                           p_extra = [ "logseq.property/public?", Db_test_util.Bool true ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "target" } ] } ]
      ()
  in
  let property_id =
    match ent_ident (db_of conn) "user.property/reproducible-steps" with
    | Some e -> e.id
    | None -> failwith "property missing"
  in
  let block =
    match Db_test_util.find_block_by_content (db_of conn) "target" with
    | Some b -> b
    | None -> failwith "target missing"
  in
  let block_uuid = uuid_of block in
  Outliner_property.batch_set_property conn [ Wire.Uuid block_uuid ]
    "user.property/reproducible-steps" (Wire.Array [ Wire.String "Step 1" ]) ();
  let generated =
    match ent_uuid (db_of conn) block_uuid with
    | Some b ->
        (match prop_value_ents b "user.property/reproducible-steps" with
         | pv :: _ -> pv
         | [] -> failwith "generated value missing")
    | None -> failwith "target missing after"
  in
  let value_uuid = uuid_of generated in
  check "add-existing-generated-value precondition parent"
    (match Ldb.value generated "block/parent" with
     | Some (Ref p) -> p = block.id
     | _ -> false);
  Outliner_property.add_existing_values_to_closed_values conn
    "user.property/reproducible-steps" [ value_uuid ];
  (match ent_uuid (db_of conn) value_uuid with
   | Some closed_value ->
       check "add-existing-generated-value closed-value-property"
         (List.map (fun (e : entity) -> e.id)
            (prop_value_ents closed_value "block/closed-value-property")
          = [ property_id ]);
       check "add-existing-generated-value parent"
         (match Ldb.value closed_value "block/parent" with
          | Some (Ref p) -> p = property_id
          | _ -> false);
       check "add-existing-generated-value page"
         (match Ldb.value closed_value "block/page" with
          | Some (Ref p) -> p = property_id
          | _ -> false);
       check "add-existing-generated-value content"
         (prop_value_content closed_value = "Step 1");
       (* cljs (outliner-core/delete-blocks! conn [block] {}) *)
       let tx =
         Outliner_blocks.delete_blocks (db_of conn)
           [ (match ent_uuid (db_of conn) block_uuid with
              | Some b -> b
              | None -> failwith "block gone") ]
       in
       ignore (Db_transact.transact conn tx []);
       check "add-existing-generated-value survives block deletion"
         (ent_uuid (db_of conn) value_uuid <> None)
   | None -> check "add-existing-generated-value reparented" false)

(* (deftest upsert-closed-value! ...) *)
let test_upsert_closed_value () =
  let cv_uuid = "aaaaaaaa-0000-4000-8000-00000000c001" in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "num",
            Db_test_util.{ default_property with p_type = "number";
                           p_closed_values =
                             [ { Db_test_util.cv_value = "2";
                                 cv_uuid = Some cv_uuid;
                                 cv_ident = None;
                                 cv_icon = None;
                                 cv_properties = [] } ] } ]
      ()
  in
  throws_with "upsert-closed-value! non-number choice fails"
    "Can't convert"
    (fun () ->
       Outliner_property.upsert_closed_value conn "user.property/num"
         ~id:None ~value:(Wire.String "not a number") ~description:None
         ~scoped_class_id:Wire.nil);
  throws_with "upsert-closed-value! existing choice fails"
    "already exists"
    (fun () ->
       Outliner_property.upsert_closed_value conn "user.property/num"
         ~id:None ~value:(Wire.Int 2) ~description:None
         ~scoped_class_id:Wire.nil);
  Outliner_property.upsert_closed_value conn "user.property/num"
    ~id:None ~value:(Wire.Int 3) ~description:None ~scoped_class_id:Wire.nil;
  let db3 = db_of conn in
  (match
     List.of_seq (datoms db3 Avet ~a:"logseq.property/value" ~v:(Float 3.) ())
   with
   | [ d ] ->
       check "upsert-closed-value! added choice is closed value" true;
       check "upsert-closed-value! contents after add"
         (closed_values_content db3 "user.property/num" = [ "2"; "3" ]);
       let b_uuid =
         match Ldb.ent_of_id db3 d.e with
         | Some e -> uuid_of e
         | None -> failwith "closed value missing"
       in
       Outliner_property.upsert_closed_value conn "user.property/num"
         ~id:(Some b_uuid) ~value:(Wire.Int 4) ~description:(Some "choice 4")
         ~scoped_class_id:Wire.nil;
       (match ent_uuid (db_of conn) b_uuid with
        | Some updated ->
            check "upsert-closed-value! update choice content"
              (prop_value_content updated = "4" || prop_value_content updated = "4.")
        | None -> check "upsert-closed-value! update choice content" false)
   | _ -> check "upsert-closed-value! added choice is closed value" false)

(* (deftest delete-closed-value! ...) *)
let test_delete_closed_value () =
  let closed_value_uuid = "bbbbbbbb-0000-4000-8000-00000000c002" in
  let used_value_uuid = "bbbbbbbb-0000-4000-8000-00000000c003" in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "default",
            Db_test_util.{ default_property with
                           p_closed_values =
                             [ { Db_test_util.cv_value = "foo";
                                 cv_uuid = Some closed_value_uuid;
                                 cv_ident = None;
                                 cv_icon = None;
                                 cv_properties = [] };
                               { Db_test_util.cv_value = "bar";
                                 cv_uuid = Some used_value_uuid;
                                 cv_ident = None;
                                 cv_icon = None;
                                 cv_properties = [] } ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                                b_properties =
                                  [ "default",
                                    Db_test_util.Vec
                                      [ Db_test_util.Kw "block/uuid";
                                        Db_test_util.Uuid used_value_uuid ] ] } ] } ]
      ()
  in
  (match Db_test_util.find_block_by_content (db_of conn) "b1" with
   | Some b ->
       check "delete-closed-value! precondition"
         (prop_value_ents b "user.property/default" <> [])
   | None -> check "delete-closed-value! precondition" false);
  let child_uuid = "bbbbbbbb-0000-4000-8000-00000000c004" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/title \"closed value child\" :block/page [:db/ident :user.property/default] :block/parent [:block/uuid #uuid \"%s\"] :block/order \"a0\"}]"
          child_uuid closed_value_uuid));
  Outliner_property.delete_closed_value conn "user.property/default"
    closed_value_uuid;
  check "delete-closed-value! removes closed value"
    (ent_uuid (db_of conn) closed_value_uuid = None);
  check "delete-closed-value! removes closed value children"
    (ent_uuid (db_of conn) child_uuid = None);
  check "delete-closed-value! keeps used closed value"
    (match ent_ident (db_of conn) "user.property/default" with
     | Some p ->
         List.map uuid_of
           (prop_value_ents p "block/_closed-value-property")
         = [ used_value_uuid ]
         || List.mem used_value_uuid
              (List.map uuid_of
                 (prop_value_ents p "block/_closed-value-property"))
     | None -> false)

(* (deftest class-add-property! ...) *)
let test_class_add_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes: [ "c1", Db_test_util.default_class ]
      ~properties:
        [ "p1", Db_test_util.default_property;
          "p2", Db_test_util.default_property ]
      ()
  in
  Outliner_property.class_add_property conn "user.class/c1" "user.property/p1";
  Outliner_property.class_add_property conn "user.class/c1" "user.property/p2";
  (match ent_ident (db_of conn) "user.class/c1" with
   | Some c ->
       check "class-add-property! adds properties in order"
         (List.map ident_kw (Ldb.ref_ents c "logseq.property.class/properties")
          = [ "user.property/p1"; "user.property/p2" ])
   | None -> check "class-add-property! adds properties in order" false)

(* (deftest class-remove-property! ...) *)
let test_class_remove_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes:
        [ "c1",
            Db_test_util.{ default_class with
                           c_class_properties = [ "p1"; "p2" ] } ]
      ~properties:
        [ "p1", Db_test_util.default_property;
          "p2", Db_test_util.default_property ]
      ()
  in
  Outliner_property.class_remove_property conn "user.class/c1" "user.property/p1";
  (match ent_ident (db_of conn) "user.class/c1" with
   | Some c ->
       check "class-remove-property! removes property"
         (List.map ident_kw (Ldb.ref_ents c "logseq.property.class/properties")
          = [ "user.property/p2" ])
   | None -> check "class-remove-property! removes property" false)

(* (deftest get-block-classes-properties ...) *)
let test_get_block_classes_properties () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes:
        [ "c1", Db_test_util.{ default_class with c_class_properties = [ "p1" ] };
          "c2", Db_test_util.{ default_class with c_class_properties = [ "p2"; "p3" ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "p1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "o1";
                                b_tags = [ "c1"; "c2" ] } ] } ]
      ()
  in
  let block =
    match Db_test_util.find_block_by_content (db_of conn) "o1" with
    | Some b -> b
    | None -> failwith "o1 missing"
  in
  let r = Outliner_property.get_block_classes_properties (db_of conn) block.id in
  check "get-block-classes-properties classes-properties"
    (List.map ident_kw r.classes_properties
     = [ "user.property/p1"; "user.property/p2"; "user.property/p3" ])

(* ---------- deps/outliner/test/logseq/outliner/validate_test.cljs ---------- *)

(* (deftest validate-block-title-unique-for-properties ...) *)
let test_validate_block_title_unique_for_properties () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "color", Db_test_util.default_property;
          "color2", Db_test_util.default_property ]
      ()
  in
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "logseq.property/background-color";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
        "block/title", Db_test_util.Str "background color";
        "block/name", Db_test_util.Str "background color";
        "logseq.property/type", Db_test_util.Kw "default";
        "logseq.property/built-in?", Db_test_util.Bool true ] ];
  let db = db_of conn in
  let bg_title =
    match ent_ident db "logseq.property/background-color" with
    | Some e -> Ldb.string_value e "block/title"
    | None -> None
  in
  check "validate unique: user property may share built-in property name"
    (try
       Outliner_validate.validate_unique_by_name_and_tags db bg_title
         (ent_ident db "user.property/color") None;
       true
     with _ -> false);
  throws_with "validate unique: duplicate user property rejected"
    "Another property named"
    (fun () ->
       Outliner_validate.validate_unique_by_name_and_tags db (Some "color")
         (ent_ident db "user.property/color2") None)

(* (deftest validate-block-title-unique-for-tags ...) *)
let test_validate_block_title_unique_for_tags () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes:
        [ "Class1", Db_test_util.default_class;
          "Class2",
            Db_test_util.{ default_class with
                           c_extends = [ "logseq.class/Task" ] } ]
      ~pre_txs:
        [ [ "db/ident", Db_test_util.Kw "logseq.class/Task";
            "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Tag" ];
            "block/title", Db_test_util.Str "Task";
            "block/name", Db_test_util.Str "task" ];
          [ "db/ident", Db_test_util.Kw "logseq.class/Card";
            "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Tag" ];
            "block/title", Db_test_util.Str "Card";
            "block/name", Db_test_util.Str "card";
            "logseq.property/built-in?", Db_test_util.Bool true ] ]
      ()
  in
  let db = db_of conn in
  throws_with "validate unique: duplicate class names rejected (extends)"
    "Another tag named"
    (fun () ->
       Outliner_validate.validate_unique_by_name_and_tags db (Some "Class1")
         (ent_ident db "user.class/Class2") None);
  throws_with "validate unique: duplicate class even if built-in"
    "Another tag named"
    (fun () ->
       Outliner_validate.validate_unique_by_name_and_tags db (Some "Card")
         (ent_ident db "user.class/Class1") None)

(* (deftest validate-block-title-unique-for-pages ...) *)
let test_validate_block_title_unique_for_pages () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "another page" };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Apple";
                             pg_tags = [ "Company" ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Another Company";
                             pg_tags = [ "Company" ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Banana";
                             pg_tags = [ "Fruit" ] };
            Db_test_util.blocks = [] } ]
      ()
  in
  let db = db_of conn in
  throws_with "validate unique: duplicate page with tag"
    "Another page named"
    (fun () ->
       Outliner_validate.validate_unique_by_name_and_tags db (Some "Apple")
         (Db_test_util.find_page_by_title db "Another Company") None);
  check "validate unique: same name allowed for different tag"
    (try
       Outliner_validate.validate_unique_by_name_and_tags db (Some "Apple")
         (Db_test_util.find_page_by_title db "Banana") None;
       true
     with _ -> false);
  throws_with "validate unique: duplicate page without tag"
    "Another page named"
    (fun () ->
       Outliner_validate.validate_unique_by_name_and_tags db (Some "page1")
         (Db_test_util.find_page_by_title db "another page") None);
  check "validate unique: class can share name with page"
    (try
       Outliner_validate.validate_unique_by_name_and_tags db (Some "Apple")
         (Db_test_util.find_page_by_title db "Fruit") None;
       true
     with _ -> false)

(* (deftest validate-block-title-unique-for-namespaced-pages ...)
   :build-existing-tx? is a fixture flag; same shape via explicit
   block/parent lookup refs. *)
let test_validate_block_title_unique_for_namespaced_pages () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Library";
                             pg_uuid = Some "d246c71a-3e71-42f0-928f-afe607ee5ce0";
                             pg_properties =
                               [ "logseq.property/built-in?",
                                 Db_test_util.Bool true ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "n1";
                             pg_uuid = Some "3aa1e950-5a9b-4efc-81d4-b6d89a504591";
                             pg_extra =
                               [ "block/parent",
                                 Db_test_util.Vec
                                   [ Db_test_util.Kw "block/uuid";
                                     Db_test_util.Uuid "d246c71a-3e71-42f0-928f-afe607ee5ce0" ] ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "n2";
                             pg_extra =
                               [ "block/parent",
                                 Db_test_util.Vec
                                   [ Db_test_util.Kw "block/uuid";
                                     Db_test_util.Uuid "3aa1e950-5a9b-4efc-81d4-b6d89a504591" ] ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "n3";
                             pg_extra =
                               [ "block/parent",
                                 Db_test_util.Vec
                                   [ Db_test_util.Kw "block/uuid";
                                     Db_test_util.Uuid "3aa1e950-5a9b-4efc-81d4-b6d89a504591" ] ] };
            Db_test_util.blocks = [] } ]
      ()
  in
  let db = db_of conn in
  throws_with "validate unique: duplicate namespace child"
    "Another page named"
    (fun () ->
       Outliner_validate.validate_unique_by_name_and_tags db (Some "n2")
         (Db_test_util.find_page_by_title db "n3") None);
  check "validate unique: unique namespace child allowed"
    (try
       Outliner_validate.validate_unique_by_name_and_tags db (Some "n4")
         (Db_test_util.find_page_by_title db "n3") None;
       true
     with _ -> false)

(* (deftest validate-extends-property ...) *)
let test_validate_extends_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties: [ "prop1", Db_test_util.default_property ]
      ~classes:
        [ "Class1", Db_test_util.default_class;
          "Class2", Db_test_util.default_class ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page2" };
            Db_test_util.blocks = [] } ]
      ()
  in
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "logseq.class/Task";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Tag" ];
        "block/title", Db_test_util.Str "Task";
        "block/name", Db_test_util.Str "task";
        "logseq.property/built-in?", Db_test_util.Bool true ];
      [ "db/ident", Db_test_util.Kw "logseq.class/Cards";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Tag" ];
        "block/title", Db_test_util.Str "Cards";
        "block/name", Db_test_util.Str "cards";
        "logseq.property/built-in?", Db_test_util.Bool true ] ];
  let db = db_of conn in
  let find t = Db_test_util.find_page_by_title db t in
  let get t =
    match find t with Some e -> e | None -> failwith (t ^ " missing")
  in
  check "validate-extends-property: class->class valid"
    (try
       Outliner_validate.validate_extends_property db (get "Class1")
         [ get "Class2" ];
       true
     with _ -> false);
  List.iter
    (fun (parent, child) ->
       throws_with "validate-extends-property: invalid combination"
         "Can't extend"
         (fun () ->
            Outliner_validate.validate_extends_property db parent [ child ]))
    [ get "Class1", get "page1";
      get "page1", get "Class1";
      get "prop1", get "Class1" ];
  throws_with "validate-extends-property: built-in tag parent can't change"
    "Can't change"
    (fun () ->
       match
         (ent_ident db "logseq.class/Task", ent_ident db "logseq.class/Cards")
       with
       | Some task, Some cards ->
           Outliner_validate.validate_extends_property db task [ cards ]
       | _ -> failwith "built-ins missing")

(* (deftest validate-tags-property ...) *)
let test_validate_tags_property () =
  let class_uuid = "cccccccc-0000-4000-8000-00000000d001" in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes:
        [ "SomeTag",
            Db_test_util.{ default_class with c_uuid = Some class_uuid } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "block";
                                b_children =
                                  [ Db_test_util.{ default_block with
                                                    b_title = Some "block - invalid location" } ] };
                Db_test_util.{ default_block with
                                b_title = Some "block / invalid title" } ] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_uuid = Some class_uuid;
                             pg_title = Some "SomeTag" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "class block" } ] } ]
      ()
  in
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "logseq.property/heading";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
        "block/title", Db_test_util.Str "heading";
        "block/name", Db_test_util.Str "heading";
        "logseq.property/built-in?", Db_test_util.Bool true;
        "logseq.property/type", Db_test_util.Kw "number" ];
      [ "db/ident", Db_test_util.Kw "logseq.property/priority";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
        "block/title", Db_test_util.Str "priority";
        "block/name", Db_test_util.Str "priority";
        "logseq.property/built-in?", Db_test_util.Bool true;
        "logseq.property/type", Db_test_util.Kw "default" ];
      [ "block/title", Db_test_util.Str "Contents";
        "block/name", Db_test_util.Str "contents";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Page" ];
        "logseq.property/built-in?", Db_test_util.Bool true ] ];
  let db = db_of conn in
  let eid_of_ident i =
    match ent_ident db i with
    | Some e -> e.id
    | None -> failwith (i ^ " missing")
  in
  let sometag_id = eid_of_ident "user.class/SomeTag" in
  throws_with "validate-tags: built-in tag can't be tagged"
    "Can't add tag"
    (fun () ->
       Outliner_validate.validate_tags_property db [ eid_of_ident "logseq.class/Tag" ]
         sometag_id);
  throws_with "validate-tags: built-in property can't be tagged"
    "Can't add tag"
    (fun () ->
       Outliner_validate.validate_tags_property db
         [ eid_of_ident "logseq.property/heading" ] sometag_id);
  (match Db_test_util.find_page_by_title db "Contents" with
   | Some contents ->
       throws_with "validate-tags: built-in page can't be tagged"
         "Can't add tag"
         (fun () ->
            Outliner_validate.validate_tags_property db [ contents.id ]
              sometag_id)
   | None -> check "validate-tags: built-in page can't be tagged" false);
  let block_id =
    match Db_test_util.find_block_by_content db "block" with
    | Some b -> b.id
    | None -> failwith "block missing"
  in
  throws_with "validate-tags: nodes can't be tagged with private tags"
    "Can't set tag"
    (fun () ->
       Outliner_validate.validate_tags_property db [ block_id ]
         (eid_of_ident "logseq.class/Tag"));
  throws_with "validate-tags: nodes can't be tagged with built-in non tags"
    "Can't set tag"
    (fun () ->
       Outliner_validate.validate_tags_property db [ block_id ]
         (eid_of_ident "logseq.property/priority"));
  check "validate-tags: blocks can be tagged with #Page"
    (try
       Outliner_validate.validate_tags_property db [ block_id ]
         (eid_of_ident "logseq.class/Page");
       true
     with _ -> false);
  (match Db_test_util.find_block_by_content db "block / invalid title" with
   | Some b ->
       throws_with "validate-tags: invalid title can't tag #Page"
         "Page name can't"
         (fun () ->
            Outliner_validate.validate_tags_property db [ b.id ]
              (eid_of_ident "logseq.class/Page"))
   | None -> check "validate-tags: invalid title can't tag #Page" false);
  (match Db_test_util.find_block_by_content db "block - invalid location" with
   | Some b ->
       throws_with "validate-tags: invalid location can't tag #Page"
         "Can't convert this block to page"
         (fun () ->
            Outliner_validate.validate_tags_property db [ b.id ]
              (eid_of_ident "logseq.class/Page"))
   | None -> check "validate-tags: invalid location can't tag #Page" false)

(* (deftest validate-tags-property-deletion ...) *)
let test_validate_tags_property_deletion () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes: [ "SomeTag", Db_test_util.default_class ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "block";
                                b_tags = [ "logseq.class/Page" ] } ] } ]
      ()
  in
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "logseq.class/Task";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Tag" ];
        "block/title", Db_test_util.Str "Task";
        "block/name", Db_test_util.Str "task";
        "logseq.property/built-in?", Db_test_util.Bool true ] ];
  let db = db_of conn in
  let eid_of_ident i =
    match ent_ident db i with
    | Some e -> e.id
    | None -> failwith (i ^ " missing")
  in
  let tag_id = eid_of_ident "logseq.class/Tag" in
  let page_id = eid_of_ident "logseq.class/Page" in
  throws_with "validate-tags-deletion: built-in class keeps tag"
    "Can't remove tag"
    (fun () ->
       Outliner_validate.validate_tags_property_deletion db
         [ eid_of_ident "logseq.class/Task" ] tag_id);
  throws_with "validate-tags-deletion: node keeps private tag"
    "Can't remove tag"
    (fun () ->
       Outliner_validate.validate_tags_property_deletion db
         [ eid_of_ident "user.class/SomeTag" ] tag_id);
  (match Db_test_util.find_block_by_content db "block" with
   | Some b ->
       check "validate-tags-deletion: page with parent can remove #Page"
         (try
            Outliner_validate.validate_tags_property_deletion db [ b.id ]
              page_id;
            true
          with _ -> false)
   | None -> check "validate-tags-deletion: page with parent" false);
  (match Db_test_util.find_page_by_title db "page1" with
   | Some p ->
       throws_with "validate-tags-deletion: root page can't remove #Page"
         "cannot be converted"
         (fun () ->
            Outliner_validate.validate_tags_property_deletion db [ p.id ]
              page_id)
   | None -> check "validate-tags-deletion: root page" false)

(* (deftest validate-editing-built-in-property ...) *)
let test_validate_editing_built_in_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "myprop", Db_test_util.default_property ]
      ()
  in
  Db_test_util.transact_maps conn
    [ [ "db/ident", Db_test_util.Kw "block/tags";
        "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Property" ];
        "block/title", Db_test_util.Str "tags";
        "block/name", Db_test_util.Str "tags";
        "logseq.property/built-in?", Db_test_util.Bool true ] ];
  let db = db_of conn in
  let user_prop =
    match ent_ident db "user.property/myprop" with
    | Some e -> e
    | None -> failwith "myprop missing"
  in
  let built_in_prop =
    match ent_ident db "block/tags" with
    | Some e -> e
    | None -> failwith "block/tags missing"
  in
  check "validate-editing-built-in-property: user property editable"
    (try
       Outliner_validate.validate_editing_built_in_property user_prop
         (kw_map [ "db/cardinality", kw "db.cardinality/many" ]);
       true
     with _ -> false);
  throws_with "validate-editing-built-in-property: built-in attr rejected"
    "Can't change the given attributes"
    (fun () ->
       Outliner_validate.validate_editing_built_in_property built_in_prop
         (kw_map [ "block/title", Wire.String "renamed" ]));
  check "validate-editing-built-in-property: allowed attr editable"
    (try
       Outliner_validate.validate_editing_built_in_property built_in_prop
         (kw_map [ "logseq.property/hide-empty-value", Wire.Bool true ]);
       true
     with _ -> false)

(* new-graph-should-be-valid is not ported — it iterates the full cljs
   build-db-initial-data ontology which the fixture does not seed. *)

(* ---------- src/test/frontend/worker/db_core_test.cljs ---------- *)

(* (deftest get-property-node-selector-data-prepares-worker-owned-db-data-test ...) *)
let test_get_property_node_selector_data_prepares_worker_owned_db_data_test () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/ident :user.class/Topic :block/title \"Topic\" :block/name \"topic\" :block/tags :logseq.class/Tag}
         {:block/title \"Page A\" :block/name \"page-a\" :block/uuid #uuid \"11111111-1111-1111-1111-111111111111\" :block/tags [:db/ident :user.class/Topic]}]");
  register_conn conn;
  let db = db_of conn in
  let topic_id, page_a_id =
    match (ent_ident db "user.class/Topic", ent_uuid db "11111111-1111-1111-1111-111111111111") with
    | Some t, Some p -> t.id, p.id
    | _ -> failwith "fixture entities missing"
  in
  let option =
    kw_map
      [ "property",
        kw_map
          [ "db/ident", kw "block/tags";
            "logseq.property/type", kw "node";
            "logseq.property/classes",
            Wire.Array
              [ kw_map
                  [ "db/id", Wire.Int topic_id;
                    "db/ident", kw "user.class/Topic";
                    "block/title", Wire.String "Topic" ] ] ];
        "block", kw_map [ "db/id", Wire.Int page_a_id ] ]
  in
  let res =
    await
      (Dispatcher.invoke "thread-api/get-property-node-selector-data"
         [ Wire.String test_repo; option ])
  in
  (match res with
   | Wire.Map data ->
       (match Wire.get "all-classes" (Wire.Map data) with
        | Some (Wire.Array classes) ->
            check "node-selector all-classes contains Topic"
              (List.exists
                 (fun m -> Wire.get "db/ident" m = Some (kw "user.class/Topic"))
                 classes)
        | _ -> check "node-selector all-classes contains Topic" false);
       (match Wire.get "class-options" (Wire.Map data) with
        | Some (Wire.Array classes) ->
            check "node-selector class-options excludes Root"
              (not
                 (List.exists
                    (fun m -> Wire.get "db/ident" m = Some (kw "logseq.class/Root"))
                    classes))
        | _ -> check "node-selector class-options excludes Root" false);
       (match Wire.get "structured-children-by-class-id" (Wire.Map data) with
        | Some (Wire.Map kvs) ->
            check "node-selector structured-children contains topic id"
              (List.exists
                 (fun (k, _) -> k = Wire.Int topic_id) kvs)
        | _ -> check "node-selector structured-children contains topic id" false);
       (match Wire.get "initial-choices" (Wire.Map data) with
        | Some (Wire.Array choices) ->
            let titles =
              List.filter_map
                (fun m ->
                   match Wire.get "block/title" m with
                   | Some (Wire.String t) -> Some t
                   | _ -> None)
                choices
            in
            check "node-selector initial-choices = Page A"
              (titles = [ "Page A" ])
        | _ -> check "node-selector initial-choices = Page A" false)
   | _ -> check "node-selector returns map" false)

(* (deftest alias-selector-initial-choice-keeps-page-and-owner-data-test ...) *)
let test_alias_selector_initial_choice_keeps_page_and_owner_data_test () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/title \"Source\" :block/name \"source\" :block/uuid #uuid \"11111111-1111-1111-1111-111111111112\" :block/tags :logseq.class/Page :block/alias [{:block/title \"Alias\" :block/name \"alias\" :block/uuid #uuid \"22222222-2222-2222-2222-222222222223\" :block/tags :logseq.class/Page}]}]");
  register_conn conn;
  let db = db_of conn in
  let source_id, alias_id =
    match
      (ent_uuid db "11111111-1111-1111-1111-111111111112",
       ent_uuid db "22222222-2222-2222-2222-222222222223")
    with
    | Some s, Some a -> s.id, a.id
    | _ -> failwith "fixture entities missing"
  in
  let option =
    kw_map
      [ "property",
        kw_map
          [ "db/ident", kw "block/alias";
            "db/valueType", kw "db.type/ref";
            "logseq.property/type", kw "page" ];
        "block", kw_map [ "db/id", Wire.Int source_id ] ]
  in
  let res =
    await
      (Dispatcher.invoke "thread-api/get-property-node-selector-data"
         [ Wire.String test_repo; option ])
  in
  (match res with
   | Wire.Map data ->
       (match Wire.get "initial-choices" (Wire.Map data) with
        | Some (Wire.Array (choice :: _)) ->
            check "alias-selector choice label"
              (Wire.get "label" choice = Some (Wire.String "Alias"));
            (match Wire.get "value" choice with
             | Some value ->
                 check "alias-selector value db/id"
                   (Wire.get "db/id" value = Some (Wire.Int alias_id));
                 check "alias-selector value tags"
                   (match Wire.get "block/tags" value with
                    | Some (Wire.Array tags) ->
                        List.mem (kw "logseq.class/Page") tags
                        || List.exists
                             (fun t ->
                                Wire.get "db/ident" t
                                = Some (kw "logseq.class/Page"))
                             tags
                    | Some (Wire.Set tags) ->
                        List.mem (kw "logseq.class/Page") tags
                    | _ -> false);
                 check "alias-selector alias-source-page-id"
                   (Wire.get "block/alias-source-page-id" value
                    = Some (Wire.Int source_id))
             | None -> check "alias-selector value db/id" false)
        | _ -> check "alias-selector has initial choice" false)
   | _ -> check "alias-selector returns map" false)

(* ---------- rule/:in-predicate query sites ----------
   Semantics of the functions whose cljs originals use recursive rules,
   the bidirectional :alias rule, collection :in bindings and :in-bound
   predicate clauses. *)

(* db-class/get-structured-children — (class-extends) closure *)
let test_get_structured_children_recursive () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~classes:
        [ "x", Db_test_util.default_class;
          "y", Db_test_util.{ default_class with c_extends = [ "x" ] };
          "z", Db_test_util.{ default_class with c_extends = [ "y" ] };
          "w", Db_test_util.{ default_class with c_extends = [ "x" ] } ]
      ()
  in
  let db = db_of conn in
  let class_id name =
    match ent_ident db ("user.class/" ^ name) with
    | Some c -> c.id
    | None -> failwith ("class " ^ name ^ " missing")
  in
  let children =
    Db_class.get_structured_children db (class_id "x") |> List.sort compare
  in
  check "get-structured-children includes transitive extends"
    (children
     = List.sort compare [ class_id "y"; class_id "z"; class_id "w" ]);
  check "db-reference/structured-children delegates"
    (Db_reference.structured_children db (class_id "x") |> List.sort compare
     = children);
  check "get-structured-children leaf is empty"
    (Db_class.get_structured_children db (class_id "z") = [])

(* common-initial-data/get-block-full-children-ids — (parent) closure *)
let test_get_block_full_children_ids_parent_rule () =
  let u_b1 = "5f6c1b2a-3d4e-4f5a-8b7c-9d0e1f2a3b4c" in
  let u_b2 = "6a7d2c3b-4e5f-4a6b-9c8d-0e1f2a3b4c5d" in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "p" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "b1";
                               b_uuid = Some u_b1;
                               b_children =
                                 [ Db_test_util.{ default_block with
                                                  b_title = Some "b2";
                                                  b_uuid = Some u_b2 } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let b1 = Option.get (ent_uuid db u_b1) in
  let b2 = Option.get (ent_uuid db u_b2) in
  let page_id =
    match Ldb.get_page db (String "p") with
    | Some p -> p.id
    | None -> failwith "page p missing"
  in
  check "get-block-full-children-ids page subtree"
    (Ldb.get_block_full_children_ids db page_id |> List.sort compare
     = List.sort compare [ b1.id; b2.id ]);
  check "get-block-full-children-ids nested only"
    (Ldb.get_block_full_children_ids db b1.id = [ b2.id ]);
  check "outliner-blocks/get-block-full-children-ids delegates"
    (Outliner_blocks.get_block_full_children_ids db page_id |> List.sort compare
     = List.sort compare [ b1.id; b2.id ])

(* common-initial-data/get-block-alias — bidirectional :alias rule *)
let test_get_block_alias_bidirectional () =
  let u_src = "7b8e3d4c-5f6a-4b7c-0d9e-1f2a3b4c5d6e" in
  let u_alias = "8c9f4e5d-6a7b-4c8d-1e0f-2a3b4c5d6e7f" in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Source";
                             pg_uuid = Some u_src;
                             pg_extra =
                               [ "block/alias",
                                 Db_test_util.Vec
                                   [ Db_test_util.Vec
                                       [ Db_test_util.Kw "block/uuid";
                                         Db_test_util.Uuid u_alias ] ] ] };
            Db_test_util.blocks = [] };
          { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Alias";
                             pg_uuid = Some u_alias };
            Db_test_util.blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let source = Option.get (ent_uuid db u_src) in
  let alias = Option.get (ent_uuid db u_alias) in
  check "get-block-alias forward"
    (Db_reference.get_block_alias db source.id = [ alias.id ]);
  check "get-block-alias backward"
    (Db_reference.get_block_alias db alias.id = [ source.id ]);
  check "db-view get-block-alias uses the rule query"
    (Db_view.get_block_alias db alias.id = [ source.id ])

(* view/property-objects — has-property-or-object-property? +
   object-has-class-property? + class-extends rules *)
let test_property_object_eids_rules () =
  let u_direct = "9d0a5f6e-7b8c-4d9e-2f1a-3b4c5d6e7f8a" in
  let u_tagged = "0e1b6a7f-8c9d-4e0f-3a2b-4c5d6e7f8a9b" in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties: [ "p1", Db_test_util.default_property ]
      ~classes:
        [ "c1",
            Db_test_util.{ default_class with c_class_properties = [ "p1" ] };
          "c2", Db_test_util.{ default_class with c_extends = [ "c1" ] } ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "pg" };
            Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "direct";
                               b_uuid = Some u_direct;
                               b_properties =
                                 [ "p1", Db_test_util.Str "v" ] };
                Db_test_util.{ default_block with b_title = Some "tagged";
                               b_uuid = Some u_tagged;
                               b_tags = [ "c2" ] };
                Db_test_util.{ default_block with b_title = Some "plain" } ] } ]
      ()
  in
  let db = db_of conn in
  let direct = Option.get (ent_uuid db u_direct) in
  let tagged = Option.get (ent_uuid db u_tagged) in
  check "property-object-eids direct attr or tag-declared property"
    (Db_class.property_object_eids db "user.property/p1" |> List.sort compare
     = List.sort compare [ direct.id; tagged.id ])

(* ---------- other translated cljs test modules ---------- *)

let endpoint_cases : unit Alcotest.test_case list =
  [     Alcotest.test_case "get-class-objects-dedupes-inherited-tags-test" `Quick test_get_class_objects_dedupes_inherited_tags_test;
    Alcotest.test_case "get-class-objects-filters-hidden-objects-test" `Quick test_get_class_objects_filters_hidden_objects_test;
    Alcotest.test_case "get-class-objects-includes-hide-by-default-properties-test" `Quick test_get_class_objects_includes_hide_by_default_properties_test;
    Alcotest.test_case "private-create-page-tag-test" `Quick test_private_create_page_tag_test;
    Alcotest.test_case "upsert-property" `Quick test_upsert_property;
    Alcotest.test_case "upsert-property-2" `Quick test_upsert_property_2;
    Alcotest.test_case "upsert-property-3" `Quick test_upsert_property_3;
    Alcotest.test_case "upsert-property-rejects-type-change-with-existing-data" `Quick test_upsert_property_rejects_type_change_with_existing_data;
    Alcotest.test_case "upsert-property-rejects-type-change-with-existing-data-2" `Quick test_upsert_property_rejects_type_change_with_existing_data_2;
    Alcotest.test_case "convert-property-input-string" `Quick test_convert_property_input_string;
    Alcotest.test_case "create-property-text-block" `Quick test_create_property_text_block;
    Alcotest.test_case "create-property-text-block-2" `Quick test_create_property_text_block_2;
    Alcotest.test_case "create-property-text-block-3" `Quick test_create_property_text_block_3;
    Alcotest.test_case "set-block-property-basic-cases" `Quick test_set_block_property_basic_cases;
    Alcotest.test_case "set-block-property-basic-cases-2" `Quick test_set_block_property_basic_cases_2;
    Alcotest.test_case "set-block-property-with-non-ref-values" `Quick test_set_block_property_with_non_ref_values;
    Alcotest.test_case "set-block-property-with-non-ref-values-2" `Quick test_set_block_property_with_non_ref_values_2;
    Alcotest.test_case "remove-block-property" `Quick test_remove_block_property;
    Alcotest.test_case "batch-set-property" `Quick test_batch_set_property;
    Alcotest.test_case "batch-set-property-2" `Quick test_batch_set_property_2;
    Alcotest.test_case "batch-set-property-3" `Quick test_batch_set_property_3;
    Alcotest.test_case "batch-set-property-4" `Quick test_batch_set_property_4;
    Alcotest.test_case "status-property-setting-classes" `Quick test_status_property_setting_classes;
    Alcotest.test_case "task-child-class-does-not-add-parent-task-tag" `Quick test_task_child_class_does_not_add_parent_task_tag;
    Alcotest.test_case "batch-set-property-rejects-private-built-in-entity" `Quick test_batch_set_property_rejects_private_built_in_entity;
    Alcotest.test_case "batch-remove-property" `Quick test_batch_remove_property;
    Alcotest.test_case "batch-remove-property-rejects-private-built-in-entity" `Quick test_batch_remove_property_rejects_private_built_in_entity;
    Alcotest.test_case "add-existing-values-to-closed-values" `Quick test_add_existing_values_to_closed_values;
    Alcotest.test_case "add-existing-generated-value-to-closed-values-reparents-to-property" `Quick test_add_existing_generated_value_to_closed_values_reparents_to_property;
    Alcotest.test_case "upsert-closed-value" `Quick test_upsert_closed_value;
    Alcotest.test_case "delete-closed-value" `Quick test_delete_closed_value;
    Alcotest.test_case "class-add-property" `Quick test_class_add_property;
    Alcotest.test_case "class-remove-property" `Quick test_class_remove_property;
    Alcotest.test_case "get-block-classes-properties" `Quick test_get_block_classes_properties;
    Alcotest.test_case "validate-block-title-unique-for-properties" `Quick test_validate_block_title_unique_for_properties;
    Alcotest.test_case "validate-block-title-unique-for-tags" `Quick test_validate_block_title_unique_for_tags;
    Alcotest.test_case "validate-block-title-unique-for-pages" `Quick test_validate_block_title_unique_for_pages;
    Alcotest.test_case "validate-block-title-unique-for-namespaced-pages" `Quick test_validate_block_title_unique_for_namespaced_pages;
    Alcotest.test_case "validate-extends-property" `Quick test_validate_extends_property;
    Alcotest.test_case "validate-tags-property" `Quick test_validate_tags_property;
    Alcotest.test_case "validate-tags-property-deletion" `Quick test_validate_tags_property_deletion;
    Alcotest.test_case "validate-editing-built-in-property" `Quick test_validate_editing_built_in_property;
    Alcotest.test_case "get-property-node-selector-data-prepares-worker-owned-db-data-test" `Quick test_get_property_node_selector_data_prepares_worker_owned_db_data_test;
    Alcotest.test_case "alias-selector-initial-choice-keeps-page-and-owner-data-test" `Quick test_alias_selector_initial_choice_keeps_page_and_owner_data_test ]





let db_test_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "get-case-page" `Quick test_get_case_page;
    Alcotest.test_case "get-journal-page-by-day" `Quick test_get_journal_page_by_day;
    Alcotest.test_case "ordinary-sibling-skips-created-from-property-children" `Quick test_ordinary_sibling_skips_created_from_property_children;
    Alcotest.test_case "ordinary-sibling-skips-closed-value-property-children" `Quick test_ordinary_sibling_skips_closed_value_property_children;
    Alcotest.test_case "page-exists" `Quick test_page_exists;
    Alcotest.test_case "test-transact-with-multiple-tx-datoms" `Quick test_transact_with_multiple_tx_datoms;
    Alcotest.test_case "get-bidirectional-properties" `Quick
      (fun () ->
        test_get_bidirectional_properties_disabled ();
        test_get_bidirectional_properties ());
    Alcotest.test_case "get-bidirectional-properties-ignores-recycled-entities" `Quick test_get_bidirectional_properties_ignores_recycled_entities;
    Alcotest.test_case "get-block-parents-returns-parents" `Quick test_get_block_parents_returns_parents;
    Alcotest.test_case "get-block-refs-returns-linked-references" `Quick test_get_block_refs_returns_linked_references;
    Alcotest.test_case "get-latest-journals-returns-worker-maps" `Quick test_get_latest_journals_returns_worker_maps;
    Alcotest.test_case "q-executes-datascript-query" `Quick test_q_executes_datascript_query;
    Alcotest.test_case "get-class-extends" `Quick test_get_class_extends;
    Alcotest.test_case "q-returns-nil-for-nonexistent-conn" `Quick test_q_returns_nil_for_nonexistent_conn;
    Alcotest.test_case "datoms-returns-formatted-datoms" `Quick test_datoms_returns_formatted_datoms;
    Alcotest.test_case "pull-returns-entity-data" `Quick test_pull_returns_entity_data;
    Alcotest.test_case "batch-transact-with-temp-conn-preserves-retracts-test" `Quick test_batch_transact_with_temp_conn_preserves_retracts_test;
    Alcotest.test_case "batch-transact-with-temp-conn-preserves-cardinality-one-schema-test" `Quick test_batch_transact_with_temp_conn_preserves_cardinality_one_schema_test;
    Alcotest.test_case "validated-transact-retries-when-live-conn-changes-before-commit-test" `Quick test_validated_transact_retries_when_live_conn_changes_before_commit_test;
    Alcotest.test_case "fix-db-transact-runs-pipeline-without-recursive-validation-test" `Quick test_fix_db_transact_runs_pipeline_without_recursive_validation_test;
    Alcotest.test_case "transact-new-graph-refs-skips-pipeline-test" `Quick test_transact_new_graph_refs_skips_pipeline_test;
    Alcotest.test_case "get-structured-children-recursive-rule" `Quick test_get_structured_children_recursive;
    Alcotest.test_case "get-block-full-children-ids-parent-rule" `Quick test_get_block_full_children_ids_parent_rule;
    Alcotest.test_case "get-block-alias-bidirectional-rule" `Quick test_get_block_alias_bidirectional;
    Alcotest.test_case "property-object-eids-rules" `Quick test_property_object_eids_rules ]

let () =
  Alcotest.run "db-worker"
    [ "db_test", db_test_cases
    ; "endpoint", endpoint_cases
    ; "common", Test_db_common_native.cases
    ; "frontend", Test_db_frontend_native.cases
    ; "outliner", Test_outliner_native.cases
    ; "outliner-op", Test_outliner_native.op_cases
    ; "outliner-page", Test_outliner_native.page_cases
    ; "outliner-core", Test_outliner_native.core_cases
    ; "outliner-copy-paste", Test_outliner_native.copy_paste_cases
    ; "outliner-cut-paste-prop", Test_outliner_native.cut_paste_cases
    ; "outliner-cut-paste-undo", Test_outliner_native.cut_paste_undo_cases
    ; "outliner-op-construct", Test_outliner_native.op_construct_cases
    ; "outliner-move-undo", Test_outliner_native.move_undo_cases
    ; "outliner-pipeline", Test_outliner_native.pipeline_cases
    ; "outliner-tree", Test_outliner_native.tree_cases
    ; "outliner-property", Test_outliner_native.property_cases
    ; "handler-block", Test_handler_native.block_cases
    ; "handler-comments", Test_handler_native.comments_cases
    ; "handler-property", Test_handler_native.property_cases
    ; "handler-transaction", Test_handler_native.transaction_cases
    ; "undo-redo", Test_undo_redo_native.cases
    ; "db-listener", Test_db_listener_native.cases
    ; "render-delta", Test_render_delta_native.cases
    ; "misc-migrate", Test_misc_native.migrate_cases
    ; "misc-plain-value", Test_misc_native.plain_value_cases
    ; "misc-commands", Test_misc_native.commands_cases
    ; "misc-publish", Test_misc_native.publish_cases
    ; "misc-state", Test_misc_native.state_cases
    ; "misc-worker-util", Test_misc_native.worker_util_cases
    ; "render-resource", Test_render_resource_native.cases
    ; "render-affected-keys", Test_render_affected_keys_native.cases
    ; "db-worker", Test_db_worker_native.cases
    ; "platform", Test_platform_native.cases
    ; "search-benchmark", Test_search_benchmark_native.cases
    ; "shared-service", Test_shared_service_native.cases
    ; "node-sync", Test_node_sync_native.cases
    ; "pipeline", Test_pipeline_native.cases
    ; "markdown-mirror", Test_markdown_mirror_native.cases
    ; "graph-view", Test_graph_view_native.cases
    ; "db-core", Test_db_core_native.cases ]
