(* OCaml port of src/test/frontend/worker/db_validate_test.cljs
   (frontend.worker.db-validate-test) — all 3 deftests in the file:

   - validate-db-returns-count-fields-without-counts-wrapper
   - validate-db-repairs-block-missing-uuid
   - validate-db-repairs-invalid-pages-properties-and-classes

   cljs with-redefs / plumbing:
   - shared-service/broadcast-to-clients!: Broadcast.to_clients is a
     no-op post_fn in the native runtime — comes for free.
   - ldb/register-transact-pipeline-fn!: Db_tx.transact_pipeline_fn
     saved/set/restored via with_transact_pipeline below. The cljs test
     registers worker-pipeline/transact-pipeline so fix txs get
     :block/tx-id stamped ("live repair must be canonically readable").

   cljs-vs-OCaml port divergence fixed for these tests:
   - cljs fix-invalid-blocks!/fix-* call (ldb/transact! conn tx-data
     {:fix-db? true}) which runs the worker pipeline via transact-sync
     (should-run-transact-pipeline? does not exclude :fix-db?). The
     OCaml fix helpers previously used Db_transact.transact (no
     pipeline), so repaired entities never received block/tx-id. They
     now go through Worker_db_validate.transact_fix -> Db_tx.transact.

   Skipped cases: none — all deftests ported. *)

open Datascript
open Test_shared

(* cljs create-db-graph-conn: (d/create-conn db-schema/schema) +
   (d/transact! conn (sqlite-create-graph/build-db-initial-data "")) *)
let create_db_graph_conn () : conn =
  let conn = Datascript.create_conn ~schema:(Db_schema.schema ()) () in
  ignore
    (Datascript.transact_conn conn
       (Sqlite_create_graph.initial_tx_data ~db:(Datascript.db conn)
          ~config_content:"" ()));
  conn

(* cljs with-transact-pipeline *)
let with_transact_pipeline (f : unit -> 'a) : 'a =
  let before = !Db_tx.transact_pipeline_fn in
  Db_tx.transact_pipeline_fn := Some Worker_pipeline.transact_pipeline;
  Fun.protect
    ~finally:(fun () -> Db_tx.transact_pipeline_fn := before)
    f

let wire_kvs (w : Wire.t) : (Wire.t * Wire.t) list =
  match w with Wire.Map kvs -> kvs | _ -> []

(* cljs (empty? (:errors (worker-db-validate/validate-db conn))) —
   empty? is true for nil and empty collections; validate-db leaves
   :errors nil when the graph is valid *)
let errors_empty (result : Wire.t) : bool =
  match wire_get "errors" (wire_kvs result) with
  | Some (Wire.Array []) | Some (Wire.List []) | Some Wire.Nil | None -> true
  | _ -> false

let db_error_count (db : db) : int =
  List.length (Db_validate.validate_db db).errors

(* validate-db-returns-count-fields-without-counts-wrapper *)
let test_count_fields_without_counts_wrapper () =
  let conn = create_db_graph_conn () in
  let result = Worker_db_validate.validate_db ~fix:false conn in
  let db = Datascript.db conn in
  let validation_result = Db_validate.validate_db db in
  let counts =
    Db_validate.graph_counts db validation_result.entities
      validation_result.datom_count
  in
  let expected =
    [ "entities", counts.entities
    ; "pages", counts.pages
    ; "blocks", counts.blocks
    ; "classes", counts.classes
    ; "properties", counts.properties
    ; "objects", counts.objects
    ; "property-pairs", counts.property_pairs
    ; "datoms", counts.datoms ]
  in
  let kvs = wire_kvs result in
  List.iter
    (fun (k, n) -> check ("count :" ^ k) (wire_get k kvs = Some (Wire.Int n)))
    expected;
  check "no :counts key" (wire_get "counts" kvs = None);
  check "no :datom-count key" (wire_get "datom-count" kvs = None);
  check "count fields are numbers"
    (List.for_all
       (fun (k, _) ->
          match wire_get k kvs with
          | Some (Wire.Int _) | Some (Wire.Int64 _) | Some (Wire.Float _) ->
              true
          | _ -> false)
       expected)

(* validate-db-repairs-block-missing-uuid *)
let test_repairs_block_missing_uuid () =
  let conn = create_db_graph_conn () in
  let page_uuid = Db_test_util.gen_uuid () in
  let page_tx =
    Datascript.transact_conn_string conn
      (Printf.sprintf
         "[{:db/id \"page\" :block/uuid #uuid \"%s\" :block/created-at 1 :block/updated-at 1 :block/name \"test page\" :block/title \"Test Page\" :block/tags :logseq.class/Page}]"
         page_uuid)
  in
  let page_id = List.assoc "page" page_tx.tempids in
  let block_tx =
    Datascript.transact_conn_string conn
      (Printf.sprintf
         "[{:db/id \"block\" :block/created-at 1 :block/updated-at 2 :block/page %d :block/parent %d :block/order \"a0\" :block/title \"\"}]"
         page_id page_id)
  in
  let block_id = List.assoc "block" block_tx.tempids in
  check "uuid-less block is invalid"
    (db_error_count (Datascript.db conn) > 0);
  ignore
    (with_transact_pipeline (fun () -> Worker_db_validate.validate_db conn));
  let db = Datascript.db conn in
  let repaired_block = ent_of_ref_exn db (Entity_id block_id) in
  check "repaired block has block/uuid"
    (Ldb.uuid_value repaired_block "block/uuid" <> None);
  check "repaired block canonically readable (nat-int block/tx-id)"
    (match Ldb.int_value repaired_block "block/tx-id" with
     | Some n -> n >= 0
     | None -> false);
  check "block/page intact"
    (match Ldb.ref_ent repaired_block "block/page" with
     | Some p -> p.id = page_id
     | None -> false);
  check "block/parent intact"
    (match Ldb.ref_ent repaired_block "block/parent" with
     | Some p -> p.id = page_id
     | None -> false);
  check "no errors after repair"
    (errors_empty (Worker_db_validate.validate_db conn))

(* validate-db-repairs-invalid-pages-properties-and-classes *)
let test_repairs_invalid_pages_properties_and_classes () =
  let conn = create_db_graph_conn () in
  let journal_tx =
    Datascript.transact_conn_string conn
      (Printf.sprintf
         "[{:db/id \"journal\" :block/uuid #uuid \"%s\" :block/created-at 1 :block/journal-day 20260504 :block/name \"2026-05-04\" :block/title \"2026-05-04\" :block/tags :logseq.class/Journal}]"
         (Db_test_util.gen_uuid ()))
  in
  let journal_id = List.assoc "journal" journal_tx.tempids in
  let class_tx =
    Datascript.transact_conn_string conn
      (Printf.sprintf
         "[{:db/id \"class\" :block/uuid #uuid \"%s\" :block/created-at 1 :block/updated-at 2 :block/name \"imported\" :block/title \"imported\" :block/tags :logseq.class/Tag :db/ident :user.class/imported :logseq.property.class/extends :logseq.class/Root :kv/value 1}]"
         (Db_test_util.gen_uuid ()))
  in
  let class_id = List.assoc "class" class_tx.tempids in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[[:db/add :logseq.property.class/extends :block/tags :logseq.class/Tag] [:db/add :logseq.property.class/extends :logseq.property.class/extends :logseq.class/Root] [:db/add :logseq.property.class/extends :block/tx-id 1] [:db/add %d :block/tx-id 1] [:db/add %d :block/tx-id 1]]"
          journal_id class_id));
  check "3 invalid entities"
    (db_error_count (Datascript.db conn) = 3);
  let result =
    with_transact_pipeline (fun () -> Worker_db_validate.validate_db conn)
  in
  let db = Datascript.db conn in
  let journal = ent_of_ref_exn db (Entity_id journal_id) in
  let property = ident_ent_exn db "logseq.property.class/extends" in
  let class_ = ent_of_ref_exn db (Entity_id class_id) in
  check "no errors in result" (errors_empty result);
  List.iter
    (fun (name, e) ->
       check (name ^ " received a new block/tx-id")
         (match Ldb.int_value e "block/tx-id" with
          | Some n -> n <> 1
          | None -> false))
    [ "journal", journal; "property", property; "class", class_ ];
  check "journal updated-at = created-at"
    (Ldb.int_value journal "block/updated-at" = Some 1);
  check "property tags = [:logseq.class/Property]"
    (List.filter_map Ldb.ident_of (Ldb.ref_ents property "block/tags")
     = [ "logseq.class/Property" ]);
  check "property extends removed"
    (Ldb.value property "logseq.property.class/extends" = None);
  check "class kv/value removed" (Ldb.value class_ "kv/value" = None);
  check "no errors after repair"
    (errors_empty (Worker_db_validate.validate_db conn))

let () =
  Alcotest.run "db-validate-test"
    [ ( "db_validate_test",
        [ Alcotest.test_case
            "validate-db-returns-count-fields-without-counts-wrapper"
            `Quick test_count_fields_without_counts_wrapper
        ; Alcotest.test_case "validate-db-repairs-block-missing-uuid"
            `Quick test_repairs_block_missing_uuid
        ; Alcotest.test_case
            "validate-db-repairs-invalid-pages-properties-and-classes"
            `Quick test_repairs_invalid_pages_properties_and_classes ] ) ]
