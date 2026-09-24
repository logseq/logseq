(* 1:1 port of src/test/frontend/worker/sync/upload_test.cljs to native
   OCaml. The cljs file contains 11 deftests; 1 is ported here with the
   cljs deftest name kept as the OCaml test name.

   Ported tests (cljs source order):
   - snapshot-upload-excludes-local-block-revisions-test

   Not yet ported (cljs source order):
   - split-snapshot-rows-by-max-bytes-splits-rows-into-byte-capped-batches-test
   - split-snapshot-rows-by-max-bytes-fails-fast-for-oversized-single-row-test
   - upload-snapshot-rows-batches-sets-reset-and-finished-flags-correctly-test
   - drop-oversized-upload-datoms-drops-large-tldraw-page-values-test
   - create-remote-graph-creates-new-remote-graph-when-no-remote-match-test
   - create-remote-graph-aux-skips-rsa-keys-for-non-e2ee-graph-test
   - create-remote-graph-rejects-matching-remote-graph-test
   - create-remote-graph-missing-e2ee-password-does-not-create-remote-graph-test
   - create-remote-graph-missing-e2ee-password-does-not-run-create-aux-test

   Port notes:
   - cljs (p/with-redefs [sync-temp-sqlite/<create-temp-sqlite-conn ...])
     swaps in an in-memory datascript conn. The OCaml equivalent is the
     real temp sqlite path the production code uses natively; the result
     is restored via Datascript.restore_conn for assertions — same
     observable contract (titles present, block/tx-id absent).
   - cljs (d/create-conn db-schema/schema) maps to
     Db_test_util.create_conn, which builds a conn on the real worker
     schema (including :block/tx-id).
   - cljs passes nil aes-key → Wire.Nil selects the no-encryption branch,
     matching the cljs nil argument. *)

open Datascript
open Test_shared

let () = Worker_core.init ()

let test_repo = "test-db-sync-upload-repo"

(* keep lazy client_ops_conn sqlite files out of the repo dir *)
let () = Unix.putenv "LOGSEQ_WORKER_DB_DIR" (Filename.get_temp_dir_name ())

let await_task (t : 'a Db_worker_effect.t) : 'a =
  let result = ref None in
  Db_worker_effect.on_any t
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> Alcotest.fail "effect did not settle"

(* cljs upload_test.cljs ~100: transact two blocks carrying worker-local
   :block/tx-id revisions, run prepare-upload-temp-sqlite!, and assert the
   snapshot carries the blocks but not the local revision attr. *)
let test_snapshot_upload_excludes_local_block_revisions () =
  let source_conn = Db_test_util.create_conn () in
  let first_uuid = Common_uuid.new_block_id () in
  let second_uuid = Common_uuid.new_block_id () in
  ignore
    (Datascript.transact_conn_string source_conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/title \"first\" :block/tx-id 41}
            {:block/uuid #uuid \"%s\" :block/title \"second\" :block/tx-id 42}]"
          first_uuid second_uuid));
  let sql =
    await_task
      (Sync_upload.prepare_upload_temp_sqlite test_repo "graph-id"
         source_conn ~aes_key:Wire.Nil
         ~update_progress:(fun _ -> ()))
  in
  let conn =
    match Datascript.restore_conn (Graph_store.storage sql) with
    | Some c -> c
    | None -> Alcotest.fail "temp sqlite did not restore a conn"
  in
  let db = Datascript.db conn in
  (match entity_at_uuid db first_uuid with
   | Some e ->
       check "first title"
         (Ldb.string_value e "block/title" = Some "first")
   | None -> Alcotest.fail "first block missing from snapshot");
  (match entity_at_uuid db second_uuid with
   | Some e ->
       check "second title"
         (Ldb.string_value e "block/title" = Some "second")
   | None -> Alcotest.fail "second block missing from snapshot");
  check "snapshot transport must not copy worker-local block revisions"
    (List.for_all
       (fun (d : datom) -> d.a <> "block/tx-id")
       (List.of_seq (Datascript.datoms db Eavt ())))

let cases =
  [ Alcotest.test_case
      "snapshot-upload-excludes-local-block-revisions-test" `Quick
      test_snapshot_upload_excludes_local_block_revisions ]
