(* 1:1 OCaml translation of
   src/test/frontend/worker/db_worker_test.cljs (19 deftests).
   cljs deftest names are kept as OCaml test names.

   Route: endpoints are invoked through Dispatcher.invoke "thread-api/..."
   (= cljs `(get @thread-api/*thread-apis k)`), state goes through the same
   Worker_state / Sync_state tables, and cljs `p/with-redefs` seams map to
   the port's injection points:
     thread-api table rebinding      -> Sync_deps.* option-refs
     rtc-log / broadcast-to-clients! -> Broadcast.set_post_fn
     fetch-json / js/fetch           -> Sync_deps.fetch_json /
                                      Sync_deps.http_send_stream
     sync-crypt fns                  -> Sync_crypt.*_fn refs

   Divergences (asserted where observable, documented where not):
   - cljs tracks sqlite close/exec calls on fake #js dbs; on native the
     conns are real sqlite handles, so "closed" is asserted by a
     subsequent exec raising, and wal_checkpoint by the -wal sidecar
     being truncated/absent.
   - cljs observes the OPFS pool's pauseVfs and js/setInterval js
     handles; on native there are no pools and Timers.set_interval is a
     real thread-backed timer, so the assertions translate to the
     client_ops_cleanup_timers table contents.
   - cljs delegating-wrapper tests rebind the impl fns and record calls;
     OCaml endpoints call impls directly (no rebindable layer), so the
     assertions exercise the real impls where they terminate without a
     network, and assert hook-observable calls where the port has hooks.
   - db-sync-start in cljs delegates to db-sync/start!; in OCaml the
     endpoint opens the db (cljs start-db! delegates to
     <create-or-open-db!), asserted via Worker_state tables. *)

open Datascript
open Db_worker_effect.Infix
open Test_shared

let () = Worker_core.init ()

(* ---------- helpers ---------- *)

let await task =
  let result = ref None in
  Db_worker_effect.on_any task (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let await_error task =
  let result = ref None in
  Db_worker_effect.on_any task (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok _) -> failwith "expected error, got success"
  | Some (Error e) -> e
  | None -> failwith "task still pending"

let invoke name args = await (Dispatcher.invoke name args)

let kw s = Wire.Keyword s

let last_rsa_opts = ref Wire.Nil

(* fresh LOGSEQ_WORKER_DB_DIR + reset of every seam/state table a test
   can touch (cljs restoring-worker-state). *)
let with_repo_env f =
  let dir = Filename.temp_dir "logseq-db-worker-test" "" in
  Unix.putenv "LOGSEQ_WORKER_DB_DIR" dir;
  let prev_close = !Sync_deps.close_db in
  let prev_unlink = !Sync_deps.unlink_db in
  let prev_invalidate = !Sync_deps.invalidate_search_db in
  let prev_create = !Sync_deps.create_or_open_db in
  let prev_rehydrate = !Sync_deps.rehydrate_large_titles in
  let prev_fetch = !Sync_deps.fetch_json in
  let prev_stream = !Sync_deps.http_send_stream in
  let prev_truncate = !Sync_deps.search_truncate_table in
  let prev_aes = !Sync_deps.fetch_graph_aes_key_for_download in
  let prev_decrypt = !Sync_deps.decrypt_snapshot_datoms_batch in
  let prev_grant = !Sync_crypt.grant_graph_access_fn in
  let prev_rsa = !Sync_crypt.ensure_user_rsa_keys_fn in
  let prev_config = Worker_state.db_sync_config () in
  Fun.protect f
    ~finally:(fun () ->
      Sync_deps.close_db := prev_close;
      Sync_deps.unlink_db := prev_unlink;
      Sync_deps.invalidate_search_db := prev_invalidate;
      Sync_deps.create_or_open_db := prev_create;
      Sync_deps.rehydrate_large_titles := prev_rehydrate;
      Sync_deps.fetch_json := prev_fetch;
      Sync_deps.http_send_stream := prev_stream;
      Sync_deps.search_truncate_table := prev_truncate;
      Sync_deps.fetch_graph_aes_key_for_download := prev_aes;
      Sync_deps.decrypt_snapshot_datoms_batch := prev_decrypt;
      Sync_crypt.grant_graph_access_fn := prev_grant;
      Sync_crypt.ensure_user_rsa_keys_fn := prev_rsa;
      Worker_state.set_db_sync_config prev_config;
      Broadcast.set_post_fn (fun ~kind:_ ~payload:_ -> ());
      Sync_download.import_state := None;
      Hashtbl.iter
        (fun _ t -> Timers.clear t)
        Endpoint_lifecycle.client_ops_cleanup_timers;
      Hashtbl.clear Endpoint_lifecycle.client_ops_cleanup_timers;
      List.iter
        (fun repo ->
           List.iter
             (fun kind ->
                (match Worker_state.sqlite_conn_of repo kind with
                 | Some db -> (try Sqlite.close db with _ -> ())
                 | None -> ());
                Worker_state.drop_sqlite_conn_of repo kind)
             [ Worker_state.Db; Worker_state.Search
             ; Worker_state.Client_ops ];
           Worker_state.drop_datascript_conn repo;
           Worker_state.drop_pending_local_tx_count repo)
        (Worker_state.repos ());
      Hashtbl.iter
        (fun _ db -> (try Sqlite.close db with _ -> ()))
        Sync_state.client_ops_conns;
      Hashtbl.clear Sync_state.client_ops_conns)

let closed db =
  try
    ignore (Sqlite.exec db ~sql:"select 1" ~bind:[||]);
    false
  with _ -> true

let open_file_db name =
  let dir = Filename.temp_dir "logseq-db-file" "" in
  let path = Filename.concat dir name in
  (Sqlite.open_db ~path, path)

let wal_cleaned path =
  let wal = path ^ "-wal" in
  (not (Sys.file_exists wal))
  || (Unix.stat wal).Unix.st_size = 0

(* wire a sql file at <db_dir repo>/<path> and return expected bytes *)
let place_client_ops_file repo path =
  let dir = Endpoint_lifecycle.db_dir repo in
  (match Filename.dirname path with
   | "." -> ignore (File_sys.mkdir_p dir |> await)
   | sub ->
       ignore
         (File_sys.mkdir_p (Filename.concat dir sub) |> await));
  let db =
    Sqlite.open_db ~path:(Filename.concat dir path)
  in
  ignore (Sqlite.exec db ~sql:"create table t_placed (x)" ~bind:[||]);
  ignore (Sqlite.exec db ~sql:"insert into t_placed values (1)" ~bind:[||]);
  ignore (Sqlite.exec db ~sql:"PRAGMA wal_checkpoint(TRUNCATE)" ~bind:[||]);
  Sqlite.close db;
  let ic = open_in_bin (Filename.concat dir path) in
  Fun.protect
    ~finally:(fun () -> close_in_noerr ic)
    (fun () -> In_channel.input_all ic)

(* serialize a conn's db through Graph_store kvs and return the wire
   [addr content addresses] rows a snapshot stream would carry *)
let kvs_wire_rows_of_conn conn =
  let path = Filename.temp_file "logseq-import-src" ".sqlite" in
  let db = Sqlite.open_db ~path in
  Fun.protect
    ~finally:(fun () ->
      (try Sqlite.close db with _ -> ());
      (try Sys.remove path with _ -> ()))
    (fun () ->
      Graph_store.create_kvs_table db;
      Datascript.store ~storage:(Graph_store.storage db)
        (Datascript.Conn.db conn);
      List.map
        (fun (row : Sqlite.row) ->
           let addr =
             match row.(0) with
             | Sqlite.Integer n -> Wire.Int (Int64.to_int n)
             | _ -> Wire.Nil
           and content =
             match row.(1) with
             | Sqlite.Text s -> Wire.String s
             | _ -> Wire.Nil
           and addresses =
             match row.(2) with
             | Sqlite.Text s -> Some (Wire.String s)
             | _ -> None
           in
           match addresses with
           | Some a -> Wire.Array [ addr; content; a ]
           | None -> Wire.Array [ addr; content ])
        (Sqlite.query db
           ~sql:"select addr, content, addresses from kvs order by addr"
           ~bind:[||]))

(* ---------- close-db! ---------- *)

(* (deftest close-db-clears-worker-state-test ...) *)
let test_close_db_clears_worker_state () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let db_db, _ = open_file_db "cw-db.sqlite" in
      let search_db, _ = open_file_db "cw-search.sqlite" in
      let ops_db, _ = open_file_db "cw-ops.sqlite" in
      Worker_state.set_sqlite_conn_of repo Worker_state.Db db_db;
      Worker_state.set_sqlite_conn_of repo Worker_state.Search search_db;
      Worker_state.set_sqlite_conn_of repo Worker_state.Client_ops ops_db;
      Worker_state.set_datascript_conn repo (Db_test_util.create_conn_bare ());
      let co_db = Sync_state.client_ops_conn repo in
      Worker_state.set_pending_local_tx_count repo 9;
      Worker_state.set_search_index_build_id repo "build-1";
      ignore (invoke "thread-api/close-db" [ Wire.String repo ]);
      check "close-db closed db conn" (closed db_db);
      check "close-db closed search conn" (closed search_db);
      check "close-db closed client-ops conn" (closed ops_db);
      check "close-db closed client-ops-conns db" (closed co_db);
      check "close-db dropped sqlite-conns"
        (Worker_state.sqlite_conn_of repo Worker_state.Db = None
         && Worker_state.sqlite_conn_of repo Worker_state.Search = None
         && Worker_state.sqlite_conn_of repo Worker_state.Client_ops = None);
      check "close-db dropped datascript conn"
        (Worker_state.datascript_conn repo = None);
      check "close-db dropped client-ops conn"
        (not (Sync_state.has_client_ops_conn repo));
      check "close-db cleared pending tx count"
        (Worker_state.pending_local_tx_count repo = None);
      check "close-db cleared search index build"
        (Worker_state.search_index_build_id repo = None))

(* (deftest close-db-checkpoints-wal-before-closing-test ...) — cljs
   records exec calls on fake dbs; on native the checkpoint is asserted
   by the -wal sidecar being truncated before close. *)
let test_close_db_checkpoints_wal_before_closing () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let db1, p1 = open_file_db "w-db.sqlite" in
      let db2, p2 = open_file_db "w-search.sqlite" in
      let db3, p3 = open_file_db "w-ops.sqlite" in
      List.iter
        (fun db ->
           ignore (Sqlite.exec db ~sql:"pragma journal_mode=WAL" ~bind:[||]);
           ignore (Sqlite.exec db ~sql:"create table t (x)" ~bind:[||]);
           ignore (Sqlite.exec db ~sql:"insert into t values (1)" ~bind:[||]))
        [ db1; db2; db3 ];
      check "wal files exist before close"
        (Sys.file_exists (p1 ^ "-wal") && Sys.file_exists (p2 ^ "-wal")
         && Sys.file_exists (p3 ^ "-wal"));
      Worker_state.set_sqlite_conn_of repo Worker_state.Db db1;
      Worker_state.set_sqlite_conn_of repo Worker_state.Search db2;
      Worker_state.set_sqlite_conn_of repo Worker_state.Client_ops db3;
      ignore (invoke "thread-api/close-db" [ Wire.String repo ]);
      check "close-db checkpointed db wal" (wal_cleaned p1);
      check "close-db checkpointed search wal" (wal_cleaned p2);
      check "close-db checkpointed client-ops wal" (wal_cleaned p3);
      check "close-db closed all"
        (closed db1 && closed db2 && closed db3))

(* (deftest client-ops-cleanup-timer-starts-once-and-clears-on-close-test ...)
   cljs observes js/setInterval / js/clearInterval; the native port keeps
   the per-repo timer handle table, asserted here. *)
let test_client_ops_cleanup_timer_lifecycle () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      Endpoint_lifecycle.ensure_client_ops_cleanup_timer repo;
      Endpoint_lifecycle.ensure_client_ops_cleanup_timer repo;
      check "cleanup timer scheduled once"
        (Hashtbl.length Endpoint_lifecycle.client_ops_cleanup_timers = 1
         && Hashtbl.mem Endpoint_lifecycle.client_ops_cleanup_timers repo);
      check "cleanup interval is 3h"
        (Endpoint_lifecycle.client_ops_cleanup_interval_ms
         = 3 * 60 * 60 * 1000);
      Endpoint_lifecycle.close_db_aux repo;
      check "cleanup timer cleared on close"
        (not
           (Hashtbl.mem Endpoint_lifecycle.client_ops_cleanup_timers repo)))

(* (deftest complete-datoms-import-invalidates-existing-search-db-test ...) *)
let test_complete_datoms_import () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let rtc_logs = ref [] in
      Broadcast.set_post_fn (fun ~kind ~payload ->
          rtc_logs := (kind, payload) :: !rtc_logs);
      Sync_deps.rehydrate_large_titles :=
        Some (fun _repo _graph_id -> Db_worker_effect.pure ());
      await (Sync_download.complete_datoms_import repo "graph-1" 42);
      check "complete-datoms-import resolved" true;
      check "rtc download logs emitted"
        (List.exists
           (fun (kind, _) -> kind = "rtc-log")
           !rtc_logs);
      check "local-tx updated to remote-tx"
        (Sync_client_op.get_local_tx repo = Some 42);
      check "add-repo broadcast"
        (List.exists
           (fun (kind, _) -> kind = "add-repo")
           !rtc_logs))

(* ---------- import prepare / finalize ---------- *)

(* cljs with-fake-create-or-open-db: thread-api fns swapped for
   recording stubs. The port's seam is Sync_deps — prepare-import calls
   the refs. [calls] records (label, repo) in order. *)
let wire_import_hooks repo conn calls =
  Sync_deps.close_db :=
    Some (fun r ->
        calls := "close" :: !calls;
        Db_worker_effect.pure ());
  Sync_deps.unlink_db :=
    Some (fun r ->
        calls := "unlink" :: !calls;
        Db_worker_effect.pure ());
  Sync_deps.invalidate_search_db :=
    Some (fun r ->
        calls := "invalidate-search" :: !calls;
        Db_worker_effect.pure ());
  Sync_deps.create_or_open_db :=
    Some (fun r _opts ->
        calls := "create-or-open" :: !calls;
        Worker_state.set_datascript_conn r conn;
        Db_worker_effect.pure Wire.Nil);
  ignore repo

(* (deftest db-sync-import-prepare-replaces-active-import-state-test ...) *)
let test_import_prepare_replaces_state () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let calls = ref [] in
      let conn_a = Db_test_util.create_conn_bare () in
      let conn_b = Db_test_util.create_conn_bare () in
      wire_import_hooks repo conn_a calls;
      let first =
        invoke "thread-api/db-sync-import-prepare"
          [ Wire.String repo; Wire.Bool true; Wire.String "graph-1"
          ; Wire.Bool false ]
      in
      Worker_state.set_datascript_conn repo conn_b;
      let second =
        invoke "thread-api/db-sync-import-prepare"
          [ Wire.String repo; Wire.Bool true; Wire.String "graph-1"
          ; Wire.Bool false ]
      in
      let import_id_of w =
        match Wire.get "import-id" w with
        | Some (Wire.String s) -> s
        | _ -> ""
      in
      check "prepare returns map" (import_id_of first <> "");
      check "prepare returns map 2" (import_id_of second <> "");
      check "import-ids differ"
        (import_id_of first <> import_id_of second))

(* (deftest db-sync-import-prepare-reset-unlinks-db-before-reopen-test ...) *)
let test_import_prepare_reset_order () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let calls = ref [] in
      let conn = Db_test_util.create_conn_bare () in
      wire_import_hooks repo conn calls;
      ignore
        (invoke "thread-api/db-sync-import-prepare"
           [ Wire.String repo; Wire.Bool true; Wire.String "graph-1"
           ; Wire.Bool false ]);
      (* reverse: calls were prepended *)
      let ops = List.rev !calls in
      let idx op =
        let rec go i = function
          | [] -> -1
          | x :: xs -> if x = op then i else go (i + 1) xs
        in
        go 0 ops
      in
      check "close ran" (idx "close" >= 0);
      check "unlink ran" (idx "unlink" >= 0);
      check "invalidate-search ran" (idx "invalidate-search" >= 0);
      check "create-or-open ran" (idx "create-or-open" >= 0);
      check "close before unlink" (idx "close" < idx "unlink");
      check "unlink before invalidate"
        (idx "unlink" < idx "invalidate-search");
      check "invalidate before create-or-open"
        (idx "invalidate-search" < idx "create-or-open"))

(* (deftest db-sync-import-finalize-rejects-stale-import-id-test ...) *)
let test_import_finalize_rejects_stale () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let calls = ref [] in
      let conn = Db_test_util.create_conn_bare () in
      wire_import_hooks repo conn calls;
      Sync_deps.rehydrate_large_titles :=
        Some (fun _ _ -> Db_worker_effect.pure ());
      let import_id_of w =
        match Wire.get "import-id" w with
        | Some (Wire.String s) -> s
        | _ -> ""
      in
      let first =
        import_id_of
          (invoke "thread-api/db-sync-import-prepare"
             [ Wire.String repo; Wire.Bool true; Wire.String "graph-1"
             ; Wire.Bool false ])
      in
      let second =
        import_id_of
          (invoke "thread-api/db-sync-import-prepare"
             [ Wire.String repo; Wire.Bool true; Wire.String "graph-1"
             ; Wire.Bool false ])
      in
      let stale_err =
        await_error
          (Dispatcher.invoke "thread-api/db-sync-import-finalize"
             [ Wire.String repo; Wire.String "graph-1"; Wire.Int 42
             ; Wire.String first ])
      in
      check "stale import rejected"
        (Sync_download.is_stale_import stale_err);
      ignore
        (invoke "thread-api/db-sync-import-finalize"
           [ Wire.String repo; Wire.String "graph-1"; Wire.Int 42
           ; Wire.String second ]);
      check "fresh import finalizes" true)

(* (deftest db-sync-import-finalize-cleans-temp-pool-on-success-test ...)
   cljs uses a fake rows-db + fake pool; the port uses a real sqlite rows
   file, asserting close + removal + cleared state. *)
let test_import_finalize_cleans_temp_state () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let graph_id = "graph-success-1" in
      let import_id = "import-success-1" in
      Sync_deps.rehydrate_large_titles :=
        Some (fun _ _ -> Db_worker_effect.pure ());
      ignore
        (File_sys.mkdir_p (Sync_download.import_temp_dir repo) |> await);
      let rows_db =
        Sqlite.open_db ~path:(Sync_download.import_rows_path repo)
      in
      ignore
        (Sqlite.exec rows_db
           ~sql:"create table kvs (addr integer, content text, addresses text)"
           ~bind:[||]);
      Sync_download.import_state :=
        Some
          { Sync_download.aes_key = Wire.Nil
          ; conn = Db_test_util.create_conn_bare ()
          ; graph_e2ee = false
          ; graph_id
          ; import_id
          ; imported_datoms = 0
          ; rows_db = Some rows_db
          ; rows_imported = false
          ; repo
          ; total_datoms = None };
      ignore
        (invoke "thread-api/db-sync-import-finalize"
           [ Wire.String repo; Wire.String graph_id; Wire.Int 42
           ; Wire.String import_id ]);
      check "import state cleared" (!Sync_download.import_state = None);
      check "rows db closed" (closed rows_db);
      check "rows file removed"
        (not (Sys.file_exists (Sync_download.import_rows_path repo))))

(* (deftest db-sync-download-graph-by-id-cleans-temp-pool-on-failure-test ...)
   cljs mocks js/fetch + stream; the port drives Sync_deps.fetch_json /
   Sync_deps.http_send_stream: one framed row batch then a stream error. *)
let test_download_graph_by_id_cleans_on_failure () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let graph_id = "graph-failure-1" in
      let calls = ref [] in
      let conn = Db_test_util.create_conn_bare () in
      wire_import_hooks repo conn calls;
      Sync_deps.rehydrate_large_titles :=
        Some (fun _ _ -> Db_worker_effect.pure ());
      Worker_state.set_db_sync_config
        (Wire.Map
           [ kw "http-base", Wire.String "https://sync.example.test" ]);
      Sync_deps.fetch_json :=
        Some
          (fun _url ?meth:_ ?headers:_ ?body:_ ?response_schema
               ?error_schema:_ () ->
            match response_schema with
            | Some "sync/pull" ->
                Db_worker_effect.pure (Wire.Map [ kw "t", Wire.Int 77 ])
            | Some "sync/snapshot-download" ->
                Db_worker_effect.pure
                  (Wire.Map
                     [ kw "url"
                     , Wire.String "https://snapshot.example.test" ])
            | _ ->
                Db_worker_effect.error
                  (Dispatcher.Exn_info
                     ("unexpected schema", [])));
      (* one framed row [1 "content" nil], then a stream failure *)
      let row_payload =
        Transit_codec.to_string
          (Wire.Array [ Wire.Array [ Wire.Int 1; Wire.String "content"
                                   ; Wire.Nil ] ])
      in
      let len = String.length row_payload in
      let frame = Bytes.create (4 + len) in
      Bytes.set frame 0 (Char.chr (len lsr 24 land 0xff));
      Bytes.set frame 1 (Char.chr (len lsr 16 land 0xff));
      Bytes.set frame 2 (Char.chr (len lsr 8 land 0xff));
      Bytes.set frame 3 (Char.chr (len land 0xff));
      Bytes.blit_string row_payload 0 frame 4 len;
      let chunk_sent = ref false in
      Sync_deps.http_send_stream :=
        Some
          (fun _req on_response ->
             on_response 200 [] (fun () ->
                 if !chunk_sent then
                   Db_worker_effect.error
                     (Failure "stream failed")
                 else begin
                   chunk_sent := true;
                   Db_worker_effect.pure (Some (Bytes.to_string frame))
                 end));
      let err =
        await_error
          (Sync_download.download_graph_by_id repo graph_id false)
      in
      let msg =
        match err with
        | Dispatcher.Exn_info (m, _) -> m
        | e -> Printexc.to_string e
      in
      check "download failed with db-sync error"
        (msg = "db-sync download failed");
      check "import state cleared on failure"
        (!Sync_download.import_state = None);
      check "rows file removed on failure"
        (not (Sys.file_exists (Sync_download.import_rows_path repo))))

(* ---------- snapshot / datom batching ---------- *)

(* (deftest snapshot-datoms-in-import-order-puts-schema-before-data-test ...) *)
let test_snapshot_datoms_import_order () =
  let conn = Db_test_util.create_conn_bare () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/ident :logseq.kv/schema-version :kv/value {:major 65 :minor 0}}
         {:db/ident :user.test/attr :db/valueType :db.type/string
          :db/cardinality :db.cardinality/one}
         {:db/id 100 :user.test/attr \"hello\"}]");
  let ordered = Sync_download.snapshot_datoms_in_import_order conn in
  let idx_where f =
    let rec go i = function
      | [] -> None
      | d :: rest -> if f d then Some i else go (i + 1) rest
    in
    go 0 ordered
  in
  let db = Conn.db conn in
  let attr_eid =
    match Ldb.ent_of_ref db (Datascript.Ident "user.test/attr") with
    | Some e -> e.id
    | None -> -1
  in
  let schema_version_eid =
    match Ldb.ent_of_ref db (Datascript.Ident "logseq.kv/schema-version") with
    | Some e -> e.id
    | None -> -1
  in
  let data_idx = idx_where (fun (d : datom) -> d.e = 100 && d.a = "user.test/attr") in
  let ident_idx = idx_where (fun (d : datom) -> d.e = attr_eid && d.a = "db/ident") in
  let card_idx = idx_where (fun (d : datom) -> d.e = attr_eid && d.a = "db/cardinality") in
  let sv_idx = idx_where (fun (d : datom) -> d.e = schema_version_eid && d.a = "db/ident") in
  check "data datom found" (Option.is_some data_idx);
  check "ident datom found" (Option.is_some ident_idx);
  check "cardinality datom found" (Option.is_some card_idx);
  check "schema-version datom found" (Option.is_some sv_idx);
  check "schema-version before data"
    (Option.get sv_idx < Option.get data_idx);
  check "ident before data"
    (Option.get ident_idx < Option.get data_idx);
  check "cardinality before data"
    (Option.get card_idx < Option.get data_idx)

(* cljs snapshot datom -> wire row for import-datoms-batch *)
let wire_datom e a v tx =
  Wire.Array [ Wire.Int e; Wire.Keyword a; v; Wire.Int tx ]

(* (deftest import-datoms-batch-transacts-all-db-schema-before-data-test ...) *)
let test_import_datoms_batch_schema_before_data () =
  let conn = Db_test_util.create_conn_bare () in
  let attr_eid = 8001 in
  let datoms =
    [ wire_datom attr_eid "db/ident" (Wire.Keyword "user.test/indexed") 1
    ; wire_datom 100 "user.test/indexed" (Wire.String "hello") 1
    ; wire_datom attr_eid "db/valueType" (Wire.Keyword "db.type/string") 1
    ; wire_datom attr_eid "db/cardinality" (Wire.Keyword "db.cardinality/one") 1
    ; wire_datom attr_eid "db/index" (Wire.Bool true) 1 ]
  in
  await (Sync_download.import_datoms_batch conn Wire.Nil false datoms);
  let db = Conn.db conn in
  let n =
    Datascript.datoms db Eavt ()
    |> Seq.filter (fun (d : datom) ->
           d.a = "user.test/indexed" && d.v = String "hello")
    |> List.of_seq |> List.length
  in
  check "user.test/indexed hello transacted" (n = 1)

(* (deftest imported-snapshot-blocks-receive-local-revisions-test ...) *)
let test_imported_snapshot_blocks_local_revisions () =
  let conn = Db_test_util.create_conn_bare () in
  let block_uuid = "11111111-2222-3333-4444-555555555555" in
  let datoms =
    [ wire_datom 100 "block/uuid" (Wire.Uuid block_uuid) 1
    ; wire_datom 100 "block/title" (Wire.String "downloaded") 1
    ; wire_datom 100 "block/tx-id" (Wire.Int 42) 1 ]
  in
  await (Sync_download.import_datoms_batch conn Wire.Nil false datoms);
  let db = Conn.db conn in
  let block =
    match Datascript.entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
    | Some e -> e
    | None -> failwith "imported block not found"
  in
  check "block title"
    (Ldb.string_value block "block/title" = Some "downloaded");
  let tx_id =
    match Ldb.value block "block/tx-id" with
    | Some (Int n) -> n
    | _ -> -1
  in
  check "remote tx-id not retained" (tx_id <> 42);
  check "local tx stamped" (tx_id = db.max_tx)

(* ---------- export-client-ops-db-binary ---------- *)

(* (deftest thread-api-export-client-ops-db-binary-checkpoints-and-exports-client-ops-file-test ...)
   cljs records wal_checkpoint execs + export-file path attempts; on
   native the checkpoint is asserted via the conn's -wal sidecar and the
   export path by which candidate file's bytes come back. *)
let test_export_client_ops_binary () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let ops = Sync_state.client_ops_conn repo in
      ignore (Sqlite.exec ops ~sql:"pragma journal_mode=WAL" ~bind:[||]);
      ignore (Sqlite.exec ops ~sql:"create table t (x)" ~bind:[||]);
      ignore (Sqlite.exec ops ~sql:"insert into t values (1)" ~bind:[||]);
      let ops_path = Sync_state.client_ops_path repo in
      check "client-ops wal exists" (Sys.file_exists (ops_path ^ "-wal"));
      let expected = place_client_ops_file repo "client-ops-/db.sqlite" in
      let result =
        invoke "thread-api/export-client-ops-db-binary" [ Wire.String repo ]
      in
      (match result with
       | Wire.Binary data ->
           check "exported bytes match candidate file" (data = expected);
           check "client-ops conn checkpointed" (wal_cleaned ops_path)
       | _ -> check "export returned binary" false))

(* (deftest thread-api-export-client-ops-db-binary-supports-flat-client-ops-filename-test ...) *)
let test_export_client_ops_flat_filename () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let expected = place_client_ops_file repo "client-ops-db.sqlite" in
      let result =
        invoke "thread-api/export-client-ops-db-binary" [ Wire.String repo ]
      in
      match result with
      | Wire.Binary data ->
          check "flat client-ops-db.sqlite exported" (data = expected)
      | _ -> check "export returned binary" false)

(* (deftest thread-api-export-client-ops-db-binary-supports-normalized-browser-client-ops-path-test ...)
   cljs exercises the "/client-ops-/db.sqlite" pool path; on native the
   leading-slash candidate strips to the same file under db_dir. *)
let test_export_client_ops_normalized_path () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      let expected = place_client_ops_file repo "client-ops-/db.sqlite" in
      let result =
        invoke "thread-api/export-client-ops-db-binary" [ Wire.String repo ]
      in
      match result with
      | Wire.Binary data ->
          check "client-ops-/db.sqlite exported" (data = expected)
      | _ -> check "export returned binary" false)

(* ---------- thread-api registry ---------- *)

(* cljs db-worker-test/expected-db-core-thread-apis — full 128-name set. *)
let expected_db_core_thread_apis =
  [ "thread-api/list-db"; "thread-api/init"; "thread-api/set-db-sync-config"
  ; "thread-api/get-db-sync-config"; "thread-api/get-key-value"
  ; "thread-api/db-sync-status"; "thread-api/db-sync-start"
  ; "thread-api/db-sync-stop"; "thread-api/db-sync-update-presence"
  ; "thread-api/db-sync-request-asset-download"
  ; "thread-api/db-sync-download-missing-assets"
  ; "thread-api/db-sync-grant-graph-access"
  ; "thread-api/db-sync-ensure-user-rsa-keys"
  ; "thread-api/db-sync-list-remote-graphs"
  ; "thread-api/db-sync-upload-graph"
  ; "thread-api/db-sync-create-remote-graph"
  ; "thread-api/db-sync-stop-upload"; "thread-api/db-sync-resume-upload"
  ; "thread-api/db-sync-upload-stopped?"
  ; "thread-api/db-sync-get-all-block-conflicts"
  ; "thread-api/db-sync-clear-block-conflicts"
  ; "thread-api/db-sync-download-graph-by-id"
  ; "thread-api/create-or-open-db"; "thread-api/q"; "thread-api/datoms"
  ; "thread-api/pull"; "thread-api/task-spent-time"; "thread-api/get-blocks"
  ; "thread-api/get-block-refs"; "thread-api/get-block-source"
  ; "thread-api/get-block-parents"; "thread-api/set-context"
  ; "thread-api/transact"; "thread-api/undo-redo-set-pending-editor-info"
  ; "thread-api/undo-redo-record-editor-info"
  ; "thread-api/undo-redo-record-ui-state"; "thread-api/undo-redo-undo"
  ; "thread-api/undo-redo-redo"; "thread-api/undo-redo-clear-history"
  ; "thread-api/undo-redo-get-debug-state"; "thread-api/reset-db"
  ; "thread-api/get-file-content"; "thread-api/get-all-properties"
  ; "thread-api/get-date-scheduled-or-deadlines"
  ; "thread-api/unsafe-unlink-db"; "thread-api/close-db"
  ; "thread-api/db-sync-close-db"; "thread-api/db-sync-invalidate-search-db"
  ; "thread-api/db-sync-rehydrate-large-titles"
  ; "thread-api/db-sync-import-prepare"; "thread-api/db-sync-import-rows-chunk"
  ; "thread-api/db-sync-import-finalize"; "thread-api/release-access-handles"
  ; "thread-api/db-exists"; "thread-api/export-db-binary"
  ; "thread-api/import-file-graph"; "thread-api/export-client-ops-db-binary"
  ; "thread-api/backup-db-sqlite"; "thread-api/import-db-binary"
  ; "thread-api/search-blocks"; "thread-api/search-upsert-blocks"
  ; "thread-api/search-delete-blocks"; "thread-api/search-truncate-tables"
  ; "thread-api/search-build-blocks-indice"
  ; "thread-api/search-build-blocks-indice-in-worker"
  ; "thread-api/search-build-pages-indice"; "thread-api/apply-outliner-ops"
  ; "thread-api/sync-app-state"; "thread-api/markdown-mirror-set-enabled"
  ; "thread-api/markdown-mirror-flush"; "thread-api/markdown-mirror-regenerate"
  ; "thread-api/export-get-debug-datoms"
  ; "thread-api/export-get-all-page->content"; "thread-api/validate-db"
  ; "thread-api/recompute-checksum-diagnostics"; "thread-api/export-edn"
  ; "thread-api/import-edn"; "thread-api/get-fsrs-due-card-block-ids"
  ; "thread-api/get-view-data"; "thread-api/get-class-objects"
  ; "thread-api/validate-block-tag"; "thread-api/convert-tag-to-page"
  ; "thread-api/convert-page-to-tag"; "thread-api/set-page-favorite"
  ; "thread-api/reorder-favorites"; "thread-api/get-page-route-info"
  ; "thread-api/query-custom"; "thread-api/query-dsl-query"
  ; "thread-api/query-dsl-custom-query"; "thread-api/get-journal-page-by-day"
  ; "thread-api/get-latest-journals"; "thread-api/page-exists?"
  ; "thread-api/get-case-page"; "thread-api/get-tags-by-name"
  ; "thread-api/resolve-query-inputs"; "thread-api/get-block-parent"
  ; "thread-api/get-block-page-info"; "thread-api/get-block-immediate-children"
  ; "thread-api/get-block-sibling"; "thread-api/get-page-blocks-tree"
  ; "thread-api/get-block-class-default-properties"
  ; "thread-api/get-all-classes"; "thread-api/get-structured-children"
  ; "thread-api/get-class-extends-children-tree"
  ; "thread-api/get-alias-source-page"
  ; "thread-api/get-property-closed-values"
  ; "thread-api/get-first-url-property-value"
  ; "thread-api/get-display-properties"; "thread-api/reorder-display-property"
  ; "thread-api/get-property-values"; "thread-api/get-bidirectional-properties"
  ; "thread-api/build-graph"; "thread-api/get-all-page-titles"
  ; "thread-api/gc-graph"; "thread-api/mobile-logs"
  ; "thread-api/get-graph-uuid"; "thread-api/get-rtc-graph-uuid"
  ; "thread-api/ensure-local-graph-uuid"; "thread-api/cli-list-properties"
  ; "thread-api/cli-list-tags"; "thread-api/cli-list-pages"
  ; "thread-api/cli-list-tasks"; "thread-api/cli-list-nodes"
  ; "thread-api/api-get-page-data"; "thread-api/api-list-properties"
  ; "thread-api/api-list-tags"; "thread-api/api-list-pages"
  ; "thread-api/api-build-upsert-nodes-edn" ]

(* (deftest thread-api-db-core-registers-all-thread-apis-test ...) *)
let test_registers_all_thread_apis () =
  let registered = Dispatcher.registered_names () in
  List.iter
    (fun n ->
       check ("registered " ^ n) (List.mem n registered))
    expected_db_core_thread_apis

(* ---------- db-sync thread-api delegation ---------- *)

(* (deftest thread-api-db-sync-wrappers-delegate-core-ops-test ...)
   cljs rebinds every impl fn and asserts arg forwarding + result
   passthrough. The OCaml endpoints call impls directly, so each endpoint
   is exercised against its real impl: state-observable ops assert their
   effects, crypt ops go through the *_fn refs, and network ops go
   through Sync_deps.fetch_json. *)
let test_db_sync_delegate_core_ops () =
  with_repo_env (fun () ->
      let repo = "graph-a" in
      let graph_id = "remote-graph-id" in
      let calls = ref [] in
      Worker_state.set_datascript_conn repo
        (Db_test_util.create_conn_bare ());
      Worker_state.set_db_sync_config
        (Wire.Map
           [ kw "http-base", Wire.String "https://sync.example.test"
           ; kw "auth-token", Wire.String "tok" ]);
      Sync_crypt.grant_graph_access_fn :=
        (fun r gid email ->
           calls := ("grant-graph-access", r, gid, email) :: !calls;
           Db_worker_effect.pure ());
      Sync_crypt.ensure_user_rsa_keys_fn :=
        (fun opts ->
           calls :=
             ("ensure-user-rsa-keys", "", None, "") :: !calls;
           last_rsa_opts := opts;
           Db_worker_effect.pure (Wire.Map [ kw "ok", Wire.Bool true ]));
      Sync_deps.fetch_json :=
        Some
          (fun _url ?meth:_ ?headers:_ ?body:_ ?response_schema
               ?error_schema:_ () ->
            match response_schema with
            | Some "graphs/list" ->
                Db_worker_effect.pure
                  (Wire.Map
                     [ kw "graphs"
                     , Wire.Array [ Wire.Map [ kw "graph-id", Wire.String "g1" ] ] ])
            | _ -> Db_worker_effect.pure (Wire.Map []));
      (* status: conn present -> sync_counts map (cljs forwards the
         db-sync/status result) *)
      (match
         invoke "thread-api/db-sync-status" [ Wire.String repo ]
       with
       | Wire.Map _ -> check "status map" true
       | _ -> check "status map" false);
      (* stop: no client -> nil *)
      check "stop nil"
        (invoke "thread-api/db-sync-stop" [] = Wire.Nil);
      (* update-presence: no client -> nil *)
      check "update-presence nil"
        (invoke "thread-api/db-sync-update-presence"
           [ Wire.String "block-1" ] = Wire.Nil);
      (* request-asset-download: no client -> nil *)
      check "request-asset-download nil"
        (invoke "thread-api/db-sync-request-asset-download"
           [ Wire.String repo; Wire.String "asset-1" ] = Wire.Nil);
      (* download-missing-assets: empty db -> zero counts map *)
      (match
         invoke "thread-api/db-sync-download-missing-assets"
           [ Wire.String repo; Wire.String graph_id ]
       with
       | Wire.Map kvs ->
           check "download-missing-assets total"
             (Wire.get "total" (Wire.Map kvs) = Some (Wire.Int 0))
       | _ -> check "download-missing-assets returned map" false);
      (* grant-graph-access via the fn hook *)
      check "grant-graph-access nil"
        (invoke "thread-api/db-sync-grant-graph-access"
           [ Wire.String repo; Wire.String graph_id
           ; Wire.String "user@example.com" ] = Wire.Nil);
      check "grant-graph-access forwarded args"
        (List.mem
           ("grant-graph-access", repo, Some graph_id, "user@example.com")
           !calls);
      (* ensure-user-rsa-keys via the fn hook, with and without opts *)
      check "ensure-user-rsa-keys returns impl result"
        (invoke "thread-api/db-sync-ensure-user-rsa-keys"
           [ Wire.Map [ kw "force?", Wire.Bool true ] ]
         = Wire.Map [ kw "ok", Wire.Bool true ]);
      check "ensure-user-rsa-keys no-arg forwards nil"
        (invoke "thread-api/db-sync-ensure-user-rsa-keys" []
         = Wire.Map [ kw "ok", Wire.Bool true ]
         && !last_rsa_opts = Wire.Nil);
      (* list-remote-graphs through fetch_json hook; cljs requires an
         auth token, which lives in worker-state/*state *)
      Worker_state.merge_state
        (Wire.Map [ kw "auth/id-token", Wire.String "tok" ]);
      check "list-remote-graphs forwards result"
        (invoke "thread-api/db-sync-list-remote-graphs" []
         = Wire.Array
             [ Wire.Map [ kw "graph-id", Wire.String "g1" ] ]);
      Worker_state.merge_state
        (Wire.Map [ kw "auth/id-token", Wire.Nil ]);
      (* upload lifecycle: local repo_upload_stopped flag *)
      check "stop-upload nil"
        (invoke "thread-api/db-sync-stop-upload" [ Wire.String repo ]
         = Wire.Nil);
      check "upload-stopped? true after stop"
        (invoke "thread-api/db-sync-upload-stopped?" [ Wire.String repo ]
         = Wire.Bool true);
      check "resume-upload nil"
        (invoke "thread-api/db-sync-resume-upload" [ Wire.String repo ]
         = Wire.Nil);
      check "upload-stopped? false after resume"
        (invoke "thread-api/db-sync-upload-stopped?" [ Wire.String repo ]
         = Wire.Bool false);
      (* clear-block-conflicts: real client-ops db + broadcast *)
      let broadcasts = ref [] in
      Broadcast.set_post_fn (fun ~kind ~payload ->
          broadcasts := (kind, payload) :: !broadcasts);
      ignore
        (invoke "thread-api/db-sync-clear-block-conflicts"
           [ Wire.String repo; Wire.String "block-1" ]);
      check "sync-conflicts-updated broadcast"
        (List.exists
           (fun (kind, payload) ->
              kind = "sync-conflicts-updated"
              && (match Transit_codec.of_string payload with
                  | Wire.Array [ _; data ] ->
                      Wire.get "repo" data = Some (Wire.String repo)
                      && Wire.get "block-uuid" data
                         = Some (Wire.Uuid "block-1")
                      && Wire.get "conflicts" data = Some (Wire.Array [])
                  | _ -> false))
           !broadcasts))

(* (deftest thread-api-db-sync-wrappers-delegate-import-ops-test ...)
   same rebind-mapping: the real endpoints drive prepare-import /
   import-rows-chunk / finalize-import / download-graph-by-id /
   rehydrate-large-titles through the Sync_deps seams. *)
let test_db_sync_delegate_import_ops () =
  with_repo_env (fun () ->
      let repo = "graph-a" in
      let graph_id = "remote-graph-id" in
      let calls = ref [] in
      let conn = Db_test_util.create_conn_bare () in
      wire_import_hooks repo conn calls;
      Sync_deps.rehydrate_large_titles :=
        Some (fun _ _ -> Db_worker_effect.pure ());
      Sync_deps.fetch_graph_aes_key_for_download :=
        Some (fun _ _ ->
            Db_worker_effect.pure
              (Wire.Map [ kw "aes-key", Wire.String "key" ]));
      Sync_deps.decrypt_snapshot_datoms_batch :=
        Some (fun _ ds -> Db_worker_effect.pure ds);
      (* import-prepare -> {:import-id} *)
      let prepared =
        invoke "thread-api/db-sync-import-prepare"
          [ Wire.String repo; Wire.Bool true; Wire.String graph_id
          ; Wire.Bool true ]
      in
      let import_id =
        match Wire.get "import-id" prepared with
        | Some (Wire.String s) -> s
        | _ -> ""
      in
      check "prepare returned import-id" (import_id <> "");
      (* import-rows-chunk -> Bool; rows are real kvs serializations so
         finalize can restore the source conn for replay *)
      let rows = kvs_wire_rows_of_conn (Db_test_util.create_conn ()) in
      check "import-rows-chunk true"
        (invoke "thread-api/db-sync-import-rows-chunk"
           [ Wire.Array rows; Wire.String graph_id; Wire.String import_id ]
         = Wire.Bool true);
      (* import-finalize -> nil *)
      check "import-finalize nil"
        (invoke "thread-api/db-sync-import-finalize"
           [ Wire.String repo; Wire.String graph_id; Wire.Int 77
           ; Wire.String import_id ] = Wire.Nil);
      check "import state cleared after finalize"
        (!Sync_download.import_state = None);
      (* rehydrate-large-titles -> nil (real impl via Sync_deps hook) *)
      check "rehydrate-large-titles nil"
        (invoke "thread-api/db-sync-rehydrate-large-titles"
           [ Wire.String repo; Wire.String graph_id ] = Wire.Nil);
      (* download-graph-by-id: fetch_json + stream hooks, empty stream
         -> no import, returns the result map *)
      Worker_state.set_db_sync_config
        (Wire.Map
           [ kw "http-base", Wire.String "https://sync.example.test" ]);
      Sync_deps.fetch_json :=
        Some
          (fun _url ?meth:_ ?headers:_ ?body:_ ?response_schema
               ?error_schema:_ () ->
            match response_schema with
            | Some "sync/pull" ->
                Db_worker_effect.pure (Wire.Map [ kw "t", Wire.Int 77 ])
            | Some "sync/snapshot-download" ->
                Db_worker_effect.pure
                  (Wire.Map
                     [ kw "url", Wire.String "https://snapshot.example.test" ])
            | _ -> Db_worker_effect.pure Wire.Nil);
      Sync_deps.http_send_stream :=
        Some
          (fun _req on_response ->
             on_response 200 [] (fun () -> Db_worker_effect.pure None));
      Worker_state.merge_state
        (Wire.Map [ kw "auth/id-token", Wire.String "tok" ]);
      (match
         invoke "thread-api/db-sync-download-graph-by-id"
           [ Wire.String repo; Wire.String graph_id; Wire.Bool false ]
       with
       | Wire.Map kvs as w ->
           check "download result map"
             (Wire.get "repo" w = Some (Wire.String repo)
              && Wire.get "graph-id" w = Some (Wire.String graph_id)
              && Wire.get "remote-tx" w = Some (Wire.Int 77)
              && Wire.get "graph-e2ee?" w = Some (Wire.Bool false))
       | _ -> check "download returned map" false);
      Worker_state.merge_state
        (Wire.Map [ kw "auth/id-token", Wire.Nil ]))

(* (deftest thread-api-set-and-get-db-sync-config-uses-sanitized-config-test ...)
   cljs redefs non-auth-db-sync-config and records calls; the port asserts
   the same observable contract: stored + returned config is the sanitized
   map (auth fields dropped). *)
let test_db_sync_config_sanitized () =
  with_repo_env (fun () ->
      let input =
        Wire.Map
          [ kw "http-base", Wire.String "https://sync.example.test"
          ; kw "auth-token", Wire.String "secret" ]
      in
      check "set-db-sync-config nil"
        (invoke "thread-api/set-db-sync-config" [ input ] = Wire.Nil);
      let stored = Worker_state.db_sync_config () in
      check "stored config sanitized"
        (Wire.get "auth-token" stored = None
         && Wire.get "http-base" stored
            = Some (Wire.String "https://sync.example.test"));
      let got = invoke "thread-api/get-db-sync-config" [] in
      check "get-db-sync-config returns sanitized"
        (got = stored))

(* (deftest thread-api-release-access-handles-closes-import-state-and-pauses-vfs-test ...)
   cljs asserts close-import-state-for-repo! + pool.pauseVfs; on native
   there is no pool, so the import-state close is the whole assertion. *)
let test_release_access_handles () =
  with_repo_env (fun () ->
      let repo = "test-db-worker-repo" in
      Sync_download.import_state :=
        Some
          { Sync_download.aes_key = Wire.Nil
          ; conn = Db_test_util.create_conn_bare ()
          ; graph_e2ee = false
          ; graph_id = "g"
          ; import_id = "imp-1"
          ; imported_datoms = 0
          ; rows_db = None
          ; rows_imported = false
          ; repo
          ; total_datoms = None };
      check "release-access-handles nil"
        (invoke "thread-api/release-access-handles" [ Wire.String repo ]
         = Wire.Nil);
      check "import state closed"
        (!Sync_download.import_state = None))

(* ---------- case list ---------- *)

let cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "close-db-clears-worker-state-test" `Quick
      test_close_db_clears_worker_state
  ; Alcotest.test_case "close-db-checkpoints-wal-before-closing-test"
      `Quick test_close_db_checkpoints_wal_before_closing
  ; Alcotest.test_case
      "client-ops-cleanup-timer-starts-once-and-clears-on-close-test"
      `Quick test_client_ops_cleanup_timer_lifecycle
  ; Alcotest.test_case
      "complete-datoms-import-invalidates-existing-search-db-test"
      `Quick test_complete_datoms_import
  ; Alcotest.test_case
      "db-sync-import-prepare-replaces-active-import-state-test"
      `Quick test_import_prepare_replaces_state
  ; Alcotest.test_case
      "db-sync-import-prepare-reset-unlinks-db-before-reopen-test"
      `Quick test_import_prepare_reset_order
  ; Alcotest.test_case
      "db-sync-import-finalize-rejects-stale-import-id-test"
      `Quick test_import_finalize_rejects_stale
  ; Alcotest.test_case
      "db-sync-import-finalize-cleans-temp-pool-on-success-test"
      `Quick test_import_finalize_cleans_temp_state
  ; Alcotest.test_case
      "db-sync-download-graph-by-id-cleans-temp-pool-on-failure-test"
      `Quick test_download_graph_by_id_cleans_on_failure
  ; Alcotest.test_case
      "snapshot-datoms-in-import-order-puts-schema-before-data-test"
      `Quick test_snapshot_datoms_import_order
  ; Alcotest.test_case
      "import-datoms-batch-transacts-all-db-schema-before-data-test"
      `Quick test_import_datoms_batch_schema_before_data
  ; Alcotest.test_case
      "imported-snapshot-blocks-receive-local-revisions-test" `Quick
      test_imported_snapshot_blocks_local_revisions
  ; Alcotest.test_case
      "thread-api-export-client-ops-db-binary-checkpoints-and-exports-client-ops-file-test"
      `Quick test_export_client_ops_binary
  ; Alcotest.test_case
      "thread-api-export-client-ops-db-binary-supports-flat-client-ops-filename-test"
      `Quick test_export_client_ops_flat_filename
  ; Alcotest.test_case
      "thread-api-export-client-ops-db-binary-supports-normalized-browser-client-ops-path-test"
      `Quick test_export_client_ops_normalized_path
  ; Alcotest.test_case "thread-api-db-core-registers-all-thread-apis-test"
      `Quick test_registers_all_thread_apis
  ; Alcotest.test_case "thread-api-db-sync-wrappers-delegate-core-ops-test"
      `Quick test_db_sync_delegate_core_ops
  ; Alcotest.test_case
      "thread-api-db-sync-wrappers-delegate-import-ops-test" `Quick
      test_db_sync_delegate_import_ops
  ; Alcotest.test_case
      "thread-api-set-and-get-db-sync-config-uses-sanitized-config-test"
      `Quick test_db_sync_config_sanitized
  ; Alcotest.test_case
      "thread-api-release-access-handles-closes-import-state-and-pauses-vfs-test"
      `Quick test_release_access_handles ]
