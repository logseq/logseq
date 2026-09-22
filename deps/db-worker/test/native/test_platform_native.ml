(* cljs -> ocaml translation, 1:1:

   - src/test/frontend/worker/platform_test.cljs (3 deftests; 2 ported,
     1 dropped)
   - src/test/frontend/worker/platform_node_test.cljs (19 deftests; 16
     ported, 3 dropped)
   - src/test/frontend/worker/platform_browser_test.cljs (1 deftest,
     dropped)

   The cljs tests exercise the node/browser "platform" record the
   worker is assembled from; the OCaml port's equivalent is the
   spec/platform/* capability surface with its runtime/native
   implementation. Tests that depend on JS-only seams (js/undefined
   normalization, keytar, js/fetch rebinding, OPFS pools, pfs) cannot
   run natively; each dropped deftest is listed below with the reason.

   Dropped from platform_test.cljs:
   - browser-platform-mirror-storage-is-unsupported-test — the
     :platform/:feature ex-data throw is the browser platform's
     markdown-mirror stub; native File_sys has no mirror ops.

   Dropped from platform_node_test.cljs:
   - node-platform-embedding-backend-calls-local-server — the cljs
     test rebinds js/fetch; the HTTP call is the melange embedding
     impl (native has no embedding capability).
   - exec-accepts-dollar-and-colon-bind-key-styles — $addr/:addr named
     binds are the JS sqlite API's bind-object shape; the OCaml
     Sqlite.exec surface takes positional binds.
   - draining-platform-waits-for-file-writes-and-rejects-late-background-work
     — exercises the async write-guard promise queue; native writes are
     synchronous so there is no pending-write backlog to drain.

   Dropped from platform_browser_test.cljs:
   - browser-platform-asset-read-uses-renderer-memory-path-test —
     reads via the browser's pfs in-memory fs seam; the native asset
     store is file-backed.

   The keychain tests keep their cljs names: on native every owner
   source uses the kv-file secret store (runtime/native/secret_store.ml
   documents this as the CLI_E2E_TEST code path), so both tests assert
   the same file-backed round-trip. *)

let check (name : string) (ok : bool) =
  Alcotest.(check bool) name true ok

let await (t : 'a Db_worker_effect.t) : 'a =
  let result = ref None in
  Db_worker_effect.on_any t
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let kw s = Wire.Keyword s

let () = Worker_core.init ()

(* ---------- env helpers ---------- *)

let with_env name value_opt f =
  let prev = Sys.getenv_opt name in
  (match value_opt with
   | Some v -> Unix.putenv name v
   | None -> Unix.putenv name "");
  Fun.protect f
    ~finally:(fun () ->
      match prev with
      | Some v -> Unix.putenv name v
      | None -> Unix.putenv name "")

let with_tmp_dir f =
  let dir = Filename.temp_dir "logseq-platform" "" in
  Fun.protect (fun () -> f dir)
    ~finally:(fun () -> ignore (File_sys.remove dir |> await))

(* ---------- platform_test.cljs ---------- *)

(* (deftest kv-get-normalizes-undefined-to-nil-test ...) — js/undefined
   does not exist; the port's normalize step is Idb.get's string
   option: a missing key is None. *)
let test_kv_get_normalizes_undefined_to_nil () =
  check "missing key is None"
    (await (Idb.get "test-only-missing-key") = None)

(* (deftest read-secret-text-normalizes-undefined-to-nil-test ...) —
   same normalize contract through the secret-store surface. *)
let test_read_secret_text_normalizes_undefined_to_nil () =
  check "missing secret is None"
    (await (Secret_store.read ~key:"test-only-missing-secret") = None)

(* ---------- platform_node_test.cljs ---------- *)

(* (deftest node-platform-disables-vector-embedding-off-macos ...) —
   cljs redefines process.platform/arch to linux/x64; on native the
   vector/embedding capabilities are absent on every platform. *)
let test_node_platform_disables_vector_embedding_off_macos () =
  check "no embedding capability" (not (Embedding.enabled ()));
  check "no vector index"
    (await (Vector_index.open_index ~path:"/tmp/x" ~dimension:384) = None)

(* (deftest node-platform-disables-vector-embedding-on-macos-x64 ...) —
   same observable contract: the capability stays absent. *)
let test_node_platform_disables_vector_embedding_on_macos_x64 () =
  check "no embedding capability" (not (Embedding.enabled ()));
  check "no vector index"
    (await (Vector_index.open_index ~path:"/tmp/x" ~dimension:384) = None)

(* (deftest node-platform-vector-page-query-topks-expand-adaptively ...) *)
let test_node_platform_vector_page_query_topks_expand_adaptively () =
  check "no page filter -> [limit]"
    (Vector_index.vector_query_topks 10 None = [ 10 ]);
  check "page filter -> widened topks"
    (Vector_index.vector_query_topks 10 (Some "page-1")
     = [ 40; 160; 640 ])

(* (deftest node-platform-env-owner-source-is-propagated ...) — cljs
   {:owner-source :cli} vs default :unknown; the native worker is the
   CLI daemon, so the default is "cli" (runtime_env.ml). *)
let test_node_platform_env_owner_source_is_propagated () =
  (* the default branch is only observable while the var is genuinely
     unset (there is no unsetenv under Unix), so check it first *)
  if Sys.getenv_opt "LOGSEQ_OWNER_SOURCE" = None then
    check "owner-source default" (Runtime_env.owner_source () = "cli");
  with_env "LOGSEQ_OWNER_SOURCE" (Some "cli") (fun () ->
      check "owner-source cli" (Runtime_env.owner_source () = "cli"));
  with_env "LOGSEQ_OWNER_SOURCE" (Some "electron") (fun () ->
      check "owner-source electron"
        (Runtime_env.owner_source () = "electron"))

(* (deftest node-platform-writes-text-atomically-and-deletes-files ...) *)
let test_node_platform_writes_text_atomically_and_deletes_files () =
  with_tmp_dir (fun root ->
      let path =
        Filename.concat root
          "graph-a/mirror/markdown/pages/page.md"
      in
      await (File_sys.write_text_atomic path "mirror");
      check "read back written text" (await (File_sys.read_text path) = "mirror");
      await (File_sys.remove path);
      check "deleted"
        (match await (File_sys.stat path) with
         | None -> true
         | Some _ -> false);
      let leftovers =
        await
          (File_sys.readdir
             (Filename.concat root "graph-a/mirror/markdown/pages"))
        |> List.filter (fun f ->
               let rec contains i =
                 i + 5 <= String.length f
                 && (String.sub f i 5 = ".tmp-" || contains (i + 1))
               in
               contains 0)
      in
      check "no .tmp- leftovers" (leftovers = []))

(* (deftest node-platform-cli-owner-bypasses-keychain-in-cli-e2e-test ...)
   — on native the kv file IS the secret store (no keychain binding), so
   the test asserts the same observable round-trip through kv-get /
   read-secret-text / delete. *)
let test_node_platform_cli_owner_bypasses_keychain () =
  with_tmp_dir (fun kv_dir ->
      with_env "LOGSEQ_WORKER_KV_DIR" (Some kv_dir) (fun () ->
          await (Secret_store.save ~key:"secret-key" "secret-value");
          check "kv-value" (await (Idb.get "secret-key") = Some "secret-value");
          check "secret-value"
            (await (Secret_store.read ~key:"secret-key")
             = Some "secret-value");
          await (Secret_store.delete ~key:"secret-key");
          check "kv cleared" (await (Idb.get "secret-key") = None)))

(* (deftest node-platform-cli-owner-uses-keychain-when-keychain-present ...)
   — native has no OS keychain; the kv file backs secrets on every
   owner, so this asserts the same save/read/delete round-trip without
   CLI_E2E_TEST set. *)
let test_node_platform_cli_owner_uses_keychain_when_present () =
  with_tmp_dir (fun kv_dir ->
      with_env "LOGSEQ_WORKER_KV_DIR" (Some kv_dir) (fun () ->
          await (Secret_store.save ~key:"secret-key" "secret-value");
          check "secret-value"
            (await (Secret_store.read ~key:"secret-key")
             = Some "secret-value");
          await (Secret_store.delete ~key:"secret-key");
          check "deleted value"
            (await (Secret_store.read ~key:"secret-key") = None)))

(* (deftest kv-store-preserves-uint8array-values-across-reloads-test ...)
   — Uint8Array <-> raw bytes; two reads emulate the second platform
   instance reload (the store is file-backed, no in-memory cache). *)
let test_kv_store_preserves_uint8array_values_across_reloads () =
  with_tmp_dir (fun kv_dir ->
      with_env "LOGSEQ_WORKER_KV_DIR" (Some kv_dir) (fun () ->
          let key = "rtc-encrypted-aes-key###graph-1" in
          let value = "\001\002\003\255" in
          await (Idb.set_binary key value);
          let loaded_a = await (Idb.get_binary key) in
          let loaded_b = await (Idb.get_binary key) in
          check "loaded a" (loaded_a = Some value);
          check "loaded b" (loaded_b = Some value)))

(* ---------- sqlite ops ---------- *)

let open_test_db name =
  let dir = Filename.temp_dir "platform-node" "" in
  let path = Filename.concat dir name in
  (Sqlite.open_db ~path, path)

let rows_as_strings rows =
  List.map
    (fun (row : Sqlite.row) ->
       Array.to_list row
       |> List.map (function
              | Sqlite.Text s -> s
              | Sqlite.Integer n -> Int64.to_string n
              | Sqlite.Float f -> string_of_float f
              | Sqlite.Null -> "<null>"
              | Sqlite.Blob b -> b))
    rows

(* (deftest exec-sql-string-creates-schema-and-writes-data ...) *)
let test_exec_sql_string_creates_schema_and_writes_data () =
  let db, _ = open_test_db "db.sqlite" in
  Fun.protect
    ~finally:(fun () -> Sqlite.close db)
    (fun () ->
      Sqlite.exec db
        ~sql:"create table kvs (addr text primary key, content text)"
        ~bind:[||];
      Sqlite.exec db
        ~sql:"insert into kvs (addr, content) values ('a', 'payload')"
        ~bind:[||];
      let rows =
        Sqlite.query db ~sql:"select addr, content from kvs order by addr"
          ~bind:[||]
      in
      check "rows" (rows_as_strings rows = [ [ "a"; "payload" ] ]))

(* (deftest exec-row-mode-array-returns-index-addressable-rows ...) *)
let test_exec_row_mode_array_returns_index_addressable_rows () =
  let db, _ = open_test_db "db.sqlite" in
  Fun.protect
    ~finally:(fun () -> Sqlite.close db)
    (fun () ->
      Sqlite.exec db
        ~sql:
          "create table kvs (addr text primary key, content text, \
           addresses text)"
        ~bind:[||];
      Sqlite.exec db
        ~sql:"insert into kvs (addr, content, addresses) values (?, ?, ?)"
        ~bind:
          [| Sqlite.Text "a"; Sqlite.Text "alpha"
           ; Sqlite.Text "[\"x\",\"y\"]" |];
      let rows =
        Sqlite.query db
          ~sql:"select content, addresses from kvs where addr = ?"
          ~bind:[| Sqlite.Text "a" |]
      in
      check "rows are index-addressable arrays"
        (match rows with
         | [ row ] ->
             Array.length row = 2
             && rows_as_strings rows
                = [ [ "alpha"; "[\"x\",\"y\"]" ] ]
         | _ -> false))

(* (deftest transaction-commits-on-success ...) *)
let test_transaction_commits_on_success () =
  let db, _ = open_test_db "db.sqlite" in
  Fun.protect
    ~finally:(fun () -> Sqlite.close db)
    (fun () ->
      Sqlite.exec db ~sql:"create table tx_log (value integer)" ~bind:[||];
      Sqlite.transaction db (fun () ->
          Sqlite.exec db
            ~sql:"insert into tx_log (value) values (?)"
            ~bind:[| Sqlite.Integer 1L |]);
      let rows =
        Sqlite.query db ~sql:"select value from tx_log order by value"
          ~bind:[||]
      in
      check "rows" (rows_as_strings rows = [ [ "1" ] ]))

(* (deftest transaction-rolls-back-when-callback-throws ...) *)
let test_transaction_rolls_back_when_callback_throws () =
  let db, _ = open_test_db "db.sqlite" in
  Fun.protect
    ~finally:(fun () -> Sqlite.close db)
    (fun () ->
      Sqlite.exec db ~sql:"create table tx_log (value integer)" ~bind:[||];
      (try
         Sqlite.transaction db (fun () ->
             Sqlite.exec db
               ~sql:"insert into tx_log (value) values (?)"
               ~bind:[| Sqlite.Integer 1L |];
             failwith "rollback")
       with _ -> ());
      let rows =
        Sqlite.query db ~sql:"select count(*) from tx_log" ~bind:[||]
      in
      check "count 0" (rows_as_strings rows = [ [ "0" ] ]))

(* (deftest nested-transactions-keep-outer-writes-after-inner-rollback ...) *)
let test_nested_transactions_keep_outer_writes_after_inner_rollback () =
  let db, _ = open_test_db "db.sqlite" in
  Fun.protect
    ~finally:(fun () -> Sqlite.close db)
    (fun () ->
      Sqlite.exec db ~sql:"create table tx_log (value integer)" ~bind:[||];
      Sqlite.transaction db (fun () ->
          Sqlite.exec db
            ~sql:"insert into tx_log (value) values (?)"
            ~bind:[| Sqlite.Integer 1L |];
          (try
             Sqlite.transaction db (fun () ->
                 Sqlite.exec db
                   ~sql:"insert into tx_log (value) values (?)"
                   ~bind:[| Sqlite.Integer 2L |];
                 failwith "inner rollback")
           with _ -> ());
          Sqlite.exec db
            ~sql:"insert into tx_log (value) values (?)"
            ~bind:[| Sqlite.Integer 3L |]);
      let rows =
        Sqlite.query db ~sql:"select value from tx_log order by value"
          ~bind:[||]
      in
      check "inner rollback keeps outer writes"
        (rows_as_strings rows = [ [ "1" ]; [ "3" ] ]))

(* (deftest sqlite-backup-db-creates-importable-copy ...) *)
let test_sqlite_backup_db_creates_importable_copy () =
  let dir = Filename.temp_dir "platform-node-backup" "" in
  let db_path = Filename.concat dir "source.sqlite" in
  let backup_path = Filename.concat dir "backup/copy.sqlite" in
  let db = Sqlite.open_db ~path:db_path in
  Fun.protect
    ~finally:(fun () ->
      (try Sqlite.close db with _ -> ());
      ignore (File_sys.remove dir |> await))
    (fun () ->
      Sqlite.exec db
        ~sql:"create table kvs (addr text primary key, content text)"
        ~bind:[||];
      Sqlite.exec db
        ~sql:"insert into kvs (addr, content) values (?, ?)"
        ~bind:[| Sqlite.Text "a"; Sqlite.Text "alpha" |];
      ignore (File_sys.mkdir_p (Filename.dirname backup_path) |> await);
      Sqlite.backup db ~dst_path:backup_path;
      let backup_db = Sqlite.open_db ~path:backup_path in
      Fun.protect
        ~finally:(fun () -> Sqlite.close backup_db)
        (fun () ->
          let rows =
            Sqlite.query backup_db
              ~sql:"select addr, content from kvs order by addr" ~bind:[||]
          in
          check "backup rows"
            (rows_as_strings rows = [ [ "a"; "alpha" ] ])))

(* (deftest storage-list-graphs-ignores-backup-root ...) — cljs
   storage :list-graphs returns decoded graph dir names; the port's
   list path is :thread-api/list-db which returns [{:name
   "logseq_db_<decoded>"}]. Same filter contract. *)
let test_storage_list_graphs_ignores_backup_root () =
  with_tmp_dir (fun root ->
      with_env "LOGSEQ_WORKER_DB_DIR" (Some root) (fun () ->
          List.iter
            (fun d ->
               ignore
                 (File_sys.mkdir_p (Filename.concat root d) |> await))
            [ "alpha"; "backup"; " alpha "; " padded-only "; "   "
            ; "~20encoded-leading"; "encoded-trailing~20" ];
          match await (Dispatcher.invoke "thread-api/list-db" []) with
          | Wire.Array [ Wire.Map kvs ] ->
              check "only alpha listed"
                (Wire.get "name" (Wire.Map kvs)
                 = Some (Wire.String "logseq_db_alpha"))
          | _ -> check "only alpha listed" false))

(* (deftest remove-vfs-clears-graph-resources ...) — cljs installs an
   OPFS SAH pool and calls (:remove-vfs! storage) on it; the observable
   contract is "the repo dir's entries are gone". Native remove_vfs
   deletes every entry under <LOGSEQ_WORKER_DB_DIR>/<encoded-repo>. *)
let test_remove_vfs_clears_graph_resources () =
  let repo = "logseq_db_demo" in
  with_tmp_dir (fun root ->
      with_env "LOGSEQ_WORKER_DB_DIR" (Some root) (fun () ->
          let dir_name =
            match Graph_dir.repo_to_encoded_graph_dir_name repo with
            | Some d -> d
            | None -> failwith "cannot encode repo"
          in
          let repo_dir = Filename.concat root dir_name in
          let db_path = Filename.concat repo_dir "db.sqlite" in
          let nested = Filename.concat repo_dir "assets/file.bin" in
          await (File_sys.mkdir_p (Filename.concat repo_dir "assets"));
          await (File_sys.write_text db_path "db-bytes");
          await (File_sys.write_text nested "asset-bytes");
          await (Sqlite.remove_vfs ~repo);
          check "db.sqlite removed" (not (Sys.file_exists db_path));
          check "nested asset removed" (not (Sys.file_exists nested))))

let cases =
  List.map
    (fun (n, f) -> Alcotest.test_case n `Quick f)
    [ (* platform_test.cljs *)
      "kv-get-normalizes-undefined-to-nil-test"
    , test_kv_get_normalizes_undefined_to_nil
    ; "read-secret-text-normalizes-undefined-to-nil-test"
    , test_read_secret_text_normalizes_undefined_to_nil
    ; (* platform_node_test.cljs *)
      "node-platform-disables-vector-embedding-off-macos"
    , test_node_platform_disables_vector_embedding_off_macos
    ; "node-platform-disables-vector-embedding-on-macos-x64"
    , test_node_platform_disables_vector_embedding_on_macos_x64
    ; "node-platform-vector-page-query-topks-expand-adaptively"
    , test_node_platform_vector_page_query_topks_expand_adaptively
    ; "node-platform-env-owner-source-is-propagated"
    , test_node_platform_env_owner_source_is_propagated
    ; "node-platform-writes-text-atomically-and-deletes-files"
    , test_node_platform_writes_text_atomically_and_deletes_files
    ; "node-platform-cli-owner-bypasses-keychain-in-cli-e2e-test"
    , test_node_platform_cli_owner_bypasses_keychain
    ; "node-platform-cli-owner-uses-keychain-when-keychain-present"
    , test_node_platform_cli_owner_uses_keychain_when_present
    ; "kv-store-preserves-uint8array-values-across-reloads-test"
    , test_kv_store_preserves_uint8array_values_across_reloads
    ; "exec-sql-string-creates-schema-and-writes-data"
    , test_exec_sql_string_creates_schema_and_writes_data
    ; "exec-row-mode-array-returns-index-addressable-rows"
    , test_exec_row_mode_array_returns_index_addressable_rows
    ; "transaction-commits-on-success", test_transaction_commits_on_success
    ; "transaction-rolls-back-when-callback-throws"
    , test_transaction_rolls_back_when_callback_throws
    ; "nested-transactions-keep-outer-writes-after-inner-rollback"
    , test_nested_transactions_keep_outer_writes_after_inner_rollback
    ; "sqlite-backup-db-creates-importable-copy"
    , test_sqlite_backup_db_creates_importable_copy
    ; "storage-list-graphs-ignores-backup-root"
    , test_storage_list_graphs_ignores_backup_root
    ; "remove-vfs-clears-graph-resources"
    , test_remove_vfs_clears_graph_resources ]
