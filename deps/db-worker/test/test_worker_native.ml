(* Native smoke tests for the OCaml db-worker slice:
   wire helpers, dispatcher, and the end-to-end conn lifecycle over
   the kvs sqlite format. *)


let failures = ref 0

let check name cond =
  if cond then Printf.printf "ok - %s\n" name
  else begin
    incr failures;
    Printf.printf "FAIL - %s\n%!" name
  end

let string_contains haystack needle =
  let hl = String.length haystack and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub haystack i nl = needle then true
    else go (i + 1)
  in
  go 0

let await task =
  let result = ref None in
  Db_worker_effect.on_any task (fun v -> result := Some (Ok v)) (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let graph_store_durability_tests () =
  let open Datascript in
  let exec db sql = Sqlite.exec db ~sql ~bind:[||] in
  let rejects f = try f (); false with _ -> true in
  let fenced f =
    try f (); false with e -> string_contains (Printexc.to_string e) "reopen"
  in
  let tx conn value =
    ignore (transact_conn_string conn
      (Printf.sprintf "[[:db/add 1 :probe/value %d]]" value))
  in
  let has_value conn value =
    datoms (db conn) Eavt ~e:1 ~a:"probe/value" ()
    |> Seq.exists (fun d -> d.v = Int64 value) in
  List.iter
    (fun (name, write) ->
       let path = Filename.temp_file "graph_store_failure" ".sqlite" in
       let sql = Sqlite.open_db ~path in
       Graph_store.create_kvs_table sql;
       let storage = Graph_store.storage sql in
       let conn = Common_sqlite.get_storage_conn storage [] in
       tx conn 7;
       let root_before = Graph_store.restore sql "0" in
       let tail_before = Graph_store.restore sql "1" in
       let notifications = ref 0 in
       ignore (listen conn "durability" (fun _ -> incr notifications));
       Worker_state.set_datascript_conn name conn;
       exec sql "create trigger fail_write before insert on kvs begin select raise(ABORT, 'injected-kvs-write-failure'); end";
       check (name ^ " write propagates failure") (rejects (fun () -> write conn));
       check (name ^ " no listener notification") (!notifications = 0);
       check (name ^ " durable root unchanged") (Graph_store.restore sql "0" = root_before);
       check (name ^ " durable tail unchanged") (Graph_store.restore sql "1" = tail_before);
       exec sql "drop trigger fail_write";
       let query = Transit_codec.to_string
           (Wire.Array [ Wire.String name;
             Wire.Array [ Wire.String "[:find ?v . :where [1 :probe/value ?v]]" ] ]) in
       check (name ^ " worker read is fenced")
         (fenced (fun () -> ignore (await (Worker_core.invoke "thread-api/q" query))));
       check (name ^ " same conn retry is fenced") (fenced (fun () -> tx conn 99));
       check (name ^ " address enumeration is fenced")
         (fenced (fun () -> ignore (storage.storage_list_addresses ())));
       check (name ^ " cache read is fenced")
         (fenced (fun () -> ignore (storage.storage_restore "1")));
       Worker_state.drop_datascript_conn name;
       Sqlite.close sql;
       let sql = Sqlite.open_db ~path in
       let conn = Common_sqlite.get_storage_conn (Graph_store.storage sql) [] in
       check (name ^ " reopen restores last durable value") (has_value conn 7L);
       tx conn 9;
       Sqlite.close sql;
       let sql = Sqlite.open_db ~path in
       let conn = Common_sqlite.get_storage_conn (Graph_store.storage sql) [] in
       check (name ^ " retry after reopen survives second reopen") (has_value conn 9L);
       Sqlite.close sql;
       Sys.remove path)
    [ "tail-failure", (fun conn -> tx conn 8)
    ; "compaction-failure", (fun conn ->
        let ops = List.init 2000 (fun i ->
          Printf.sprintf "[:db/add %d :probe/value %d]" (i + 2) i) in
        ignore (transact_conn_string conn ("[" ^ String.concat " " ops ^ "]")))
    ; "schema-failure", (fun conn -> ignore (reset_schema conn (schema (db conn))))
    ];
  (* A node-only call is buffered until the terminal tail arrives. Failure
     must never let a later enumeration flush that abandoned batch. *)
  let path = Filename.temp_file "graph_store_pending" ".sqlite" in
  let sql = Sqlite.open_db ~path in
  Graph_store.create_kvs_table sql;
  let storage = Graph_store.storage sql in
  storage.storage_store [ "7654321", Storage_node (Persistent_sorted_set.Leaf [||]) ];
  check "pending node readable during batch" (storage.storage_restore "7654321" <> None);
  exec sql "create trigger fail_tail before insert on kvs when new.addr = 1 begin select raise(ABORT, 'injected-tail-write-failure'); end";
  check "pending batch propagates terminal failure"
    (rejects (fun () -> storage.storage_store [ "1", Storage_tail [] ]));
  exec sql "drop trigger fail_tail";
  check "failed pending node rolled back" (Graph_store.restore sql "7654321" = None);
  check "failed pending cannot be flushed by enumeration"
    (fenced (fun () -> ignore (storage.storage_list_addresses ())));
  check "failed pending cannot be deleted"
    (fenced (fun () -> storage.storage_delete [ "7654321" ]));
  Sqlite.close sql;
  let sql = Sqlite.open_db ~path in
  check "failed pending absent after reopen" (Graph_store.restore sql "7654321" = None);
  Sqlite.close sql;
  Sys.remove path;
  (* Fail after the first SQL chunk has inserted nodes, so rollback must
     preserve the previous root/tail and discard every new node. *)
  let path = Filename.temp_file "graph_store_chunk" ".sqlite" in
  let sql = Sqlite.open_db ~path in
  Graph_store.create_kvs_table sql;
  let storage = Graph_store.storage sql in
  let conn = Common_sqlite.get_storage_conn storage [] in
  tx conn 7;
  let root_before = Graph_store.restore sql "0" in
  let tail_before = Graph_store.restore sql "1" in
  exec sql "create trigger fail_terminal before insert on kvs when new.addr = 1 begin select raise(ABORT, 'injected-terminal-failure'); end";
  let nodes = List.init 350 (fun i ->
    string_of_int (8000000 + i), Storage_node (Persistent_sorted_set.Leaf [||])) in
  check "second chunk failure propagates"
    (rejects (fun () -> storage.storage_store (nodes @ [ "1", Storage_tail [] ])));
  check "second chunk rolls back first chunk nodes" (Graph_store.restore sql "8000000" = None);
  check "second chunk preserves durable root" (Graph_store.restore sql "0" = root_before);
  check "second chunk preserves durable tail" (Graph_store.restore sql "1" = tail_before);
  check "second chunk cache fenced" (fenced (fun () -> ignore (storage.storage_restore "8000000")));
  Sqlite.close sql;
  Sys.remove path;
  let path = Filename.temp_file "graph_store_delete" ".sqlite" in
  let sql = Sqlite.open_db ~path in
  Graph_store.create_kvs_table sql;
  let storage = Graph_store.storage sql in
  storage.storage_store [ "1", Storage_tail [] ];
  exec sql "create trigger fail_delete before delete on kvs begin select raise(ABORT, 'injected-delete-failure'); end";
  check "delete failure propagates" (rejects (fun () -> storage.storage_delete [ "1" ]));
  check "delete failure fences cached reads" (fenced (fun () -> ignore (storage.storage_restore "1")));
  check "delete failure preserves durable row" (Graph_store.restore sql "1" <> None);
  Sqlite.close sql;
  Sys.remove path

let search_normalization_memory_tests () =
  List.iter
    (fun (input, expected) ->
       check "accent normalization preserves replacement order and Unicode"
         (Search_fuzzy.remove_accents input = expected))
    [ "", ""
    ; "plain ASCII 123", "plain ASCII 123"
    ; "Æ Œ Ǽ café", "AE OE AE cafe"
    ; "A̋ a̧ Ř̩ й Ё", "A a R̩ и Е"
    ; "中文 😀 é", "中文 😀 é"
    ; "A̋A̧ǼŒ", "AAAEOE" ];
  List.iter
    (fun input ->
       ignore (Search_fuzzy.remove_accents input);
       let before = Gc.allocated_bytes () in
       let normalized = Search_fuzzy.remove_accents input in
       let allocated = Gc.allocated_bytes () -. before in
       Printf.printf "accent normalization allocated %.0f bytes for %d input bytes\n%!"
         allocated (String.length input);
       check "accent normalization allocation stays proportional to text size"
         (allocated < float_of_int (String.length input * 32 + 4096));
       check "accent normalization consumes the complete input"
         (String.length normalized > 0))
    [ String.make 10000 'x'
    ; String.concat "" (List.init 1000 (fun _ -> "A̋ café 中文 😀 ")) ]

let search_build_memory_tests () =
  let open Datascript in
  List.iter (fun count ->
    let repo = "search-memory-" ^ string_of_int count in
    let conn = conn_from_db (empty_db ~schema:(Db_schema.schema ()) ()) in
    ignore (transact_conn conn (List.init count (fun i ->
      Entity { db_id = Some (Entity_id (i + 1)); attrs =
        [ "block/uuid", One_value (Uuid (Printf.sprintf "00000000-0000-4000-8000-%012d" (i + 1)))
        ; "block/title", One_value (String ("Search row " ^ string_of_int i)) ] })));
    let sql = Sqlite.open_db ~path:":memory:" in
    Search_index.create_tables_and_triggers sql;
    let retained () = Gc.full_major (); (Gc.quick_stat ()).live_words * (Sys.word_size / 8) in
    let before = retained () in
    let build_peak = ref 0 in
    let completed = ref false in
    Broadcast.set_post_fn (fun ~kind ~payload ->
      if kind = "thread-api/search-index-build-progress" then
        match Transit_codec.of_string payload with
        | Wire.Array [ _; Wire.Array [ _; progress ] ]
          when Wire.get "status" progress = Some (Wire.Keyword "completed") ->
            completed := true;
            build_peak := retained () - before
        | _ -> ());
    Common_util.protect
      ~finally:(fun () ->
        Broadcast.set_post_fn (fun ~kind:_ ~payload:_ -> ());
        Endpoint_search.clear_search_index_builds repo;
        Sqlite.close sql)
      (fun () ->
        let build_id = Endpoint_search.start_search_index_build repo in
        await (Endpoint_search.lt_build_blocks_index repo sql conn build_id);
        check "search build reports completion" !completed;
        let rows = Sqlite.query sql ~sql:"SELECT count(*) FROM blocks" ~bind:[||] in
        check "search build indexes every eligible block"
          (rows = [[|Sqlite.Integer (Int64.of_int count)|]]);
        Printf.printf "search build retained %d additional bytes at completion for %d blocks\n%!"
          !build_peak count;
        check "search build bounds temporary retained entities and results"
          (!build_peak < 4 * 1024 * 1024)))
    [ 0; 8000 ]

let graph_store_memory_tests () =
  let open Datascript in
  let path = Filename.temp_file "graph_store_memory" ".sqlite" in
  let sql = Sqlite.open_db ~path in
  Graph_store.create_kvs_table sql;
  let conn = Common_sqlite.get_storage_conn (Graph_store.storage sql) [] in
  let edit i =
    ignore (transact_conn conn
      [ Add (Entity_id (1 + i mod 128), "probe/title",
          String (string_of_int i ^ String.make 4096 'x')) ])
  in
  let retained_bytes () =
    (* Allow cancelled WAL timers to finish before collecting their closures. *)
    Unix.sleepf 0.1;
    Gc.full_major ();
    (Gc.stat ()).live_words * (Sys.word_size / 8)
  in
  for i = 0 to 1999 do edit i done;
  let before = retained_bytes () in
  for i = 2000 to 5999 do edit i done;
  let after = retained_bytes () in
  Printf.printf "storage repeated edits retained bytes: %d -> %d\n%!" before after;
  check "fixed-size edits have bounded retained memory"
    (after - before < 4 * 1024 * 1024);
  let title db eid =
    datoms db Eavt ~e:eid ~a:"probe/title" ()
    |> Seq.map (fun d -> d.v) |> List.of_seq
  in
  let snapshot = db conn in
  let snapshot_title = title snapshot 1 in
  for i = 6000 to 7999 do edit i done;
  check "older snapshot survives later edits and collection"
    (title snapshot 1 = snapshot_title);
  let expected = List.init 128 (fun i -> title (db conn) (i + 1)) in
  Sqlite.close sql;
  let sql = Sqlite.open_db ~path in
  let reopened = Common_sqlite.get_storage_conn (Graph_store.storage sql) [] in
  check "all edited values survive reopen after collection"
    (List.init 128 (fun i -> title (db reopened) (i + 1)) = expected);
  Sqlite.close sql;
  Sys.remove path

let graph_store_weak_indexes_test () =
  let open Datascript in
  let path = Filename.temp_file "graph_store_reference_policy" ".sqlite" in
  let sql = Sqlite.open_db ~path in
  Graph_store.create_kvs_table sql;
  let storage = Graph_store.storage sql in
  let conn = Common_sqlite.get_storage_conn storage [] in
  ignore (transact_conn_string conn "[[:db/add 1 :probe/value 7]]");
  (* Existing graphs can carry a strong cache policy in their snapshot. *)
  let root = match Graph_store.restore sql "0" with
    | Some (Storage_root root) -> root
    | _ -> failwith "missing snapshot root"
  in
  storage.storage_store
    [ "0", Storage_root { root with storage_ref_type = Persistent_sorted_set.Strong } ];
  Sqlite.close sql;
  let sql = Sqlite.open_db ~path in
  let conn = Common_sqlite.get_storage_conn (Graph_store.storage sql) [] in
  let restored = db conn in
  List.iter (fun index ->
    check "reopened worker index uses weak references"
      ((Persistent_sorted_set.settings index).ref_type = Persistent_sorted_set.Weak))
    [ restored.eavt_index; restored.aevt_index; restored.avet_index ];
  check "cache policy does not change restored facts"
    (datoms restored Eavt ~e:1 ~a:"probe/value" ()
     |> Seq.exists (fun d -> d.v = Int64 7L));
  Sqlite.close sql;
  Sys.remove path

let graph_close_recovery_tests () =
  List.iter
    (fun mode ->
       let repo = "close-recovery-" ^ mode in
       let path = Filename.temp_file "graph_close_recovery" ".sqlite" in
       let weak = Weak.create 1 in
       let run () =
         let sql = Sqlite.open_db ~path in
         Graph_store.create_kvs_table sql;
         let storage = Graph_store.storage sql in
         let conn = Common_sqlite.get_storage_conn storage [] in
         Weak.set weak 0 (Some conn);
         ignore (Db_tx.flags_of conn);
         ignore (Datascript.transact_conn_string conn "[[:db/add 1 :probe/value 7]]");
         Worker_state.set_datascript_conn repo conn;
         Worker_state.set_sqlite_conn repo sql;
         if mode <> "healthy" then begin
           Sqlite.exec sql ~sql:"PRAGMA query_only=ON" ~bind:[||];
           let failed =
             try
               ignore (Datascript.transact_conn_string conn "[[:db/add 1 :probe/value 8]]");
               false
             with _ -> true
           in
           check (mode ^ " storage write actually failed") failed;
           Sqlite.exec sql ~sql:"PRAGMA query_only=OFF" ~bind:[||]
         end;
         let close () =
           if mode = "direct-drop" then begin
             Worker_state.drop_datascript_conn repo;
             Worker_state.drop_sqlite_conn repo;
             Sqlite.close sql
           end else
             ignore (await (Worker_core.invoke "thread-api/close-db"
               (Transit_codec.to_string (Wire.Array [ Wire.String repo ]))))
         in
         let closed = try close (); true with _ -> false in
         check (mode ^ " close completes") closed;
         let dropped =
           try Worker_state.datascript_conn repo = None with _ -> false in
         check (mode ^ " close drops failed or healthy connection") dropped;
         (* Dispose the failed RED fixture too, without hiding its checks. *)
         if not closed then begin
           Worker_state.drop_datascript_conn repo;
           Worker_state.drop_sqlite_conn repo;
           Sqlite.close sql
         end;
         let sql = Sqlite.open_db ~path in
         let restored = Common_sqlite.get_storage_conn (Graph_store.storage sql) [] in
         check (mode ^ " reopen restores durable value")
           (Datascript.datoms (Datascript.db restored) Datascript.Eavt
              ~e:1 ~a:"probe/value" ()
            |> Seq.exists (fun d -> d.Datascript.v = Datascript.Int64 7L));
         ignore (Datascript.transact_conn_string restored "[[:db/add 1 :probe/value 9]]");
         Sqlite.close sql
       in
       run ();
       Gc.full_major ();
       Gc.full_major ();
       check (mode ^ " closed connection can be collected") (not (Weak.check weak 0));
       Sys.remove path)
    [ "healthy"; "fenced"; "direct-drop" ]

let service_retry_tests () =
  let repo = "test/service-ready-retry" in
  let open_args opts =
    Transit_codec.to_string (Wire.Array [ Wire.String repo; opts ]) in
  let failed =
    try
      ignore (await (Worker_core.remote_invoke "thread-api/create-or-open-db"
        (open_args (Wire.kw_map [ "datoms", Wire.Int 42 ]))));
      false
    with _ -> true
  in
  check "remote open reports initialization failure" failed;
  let retried =
    try
      await (Worker_core.remote_invoke "thread-api/create-or-open-db"
        (open_args (Wire.kw_map [])))
      |> fun result -> string_contains result "schema"
    with _ -> false
  in
  check "same graph remote open can retry failed readiness" retried;
  ignore (await (Worker_core.invoke "thread-api/close-db"
    (Transit_codec.to_string (Wire.Array [ Wire.String repo ]))))

let repo = "test/graph"

let setup () =
  let dir = Filename.temp_dir "db_worker_test" "XXXXXX" in
  Unix.putenv "LOGSEQ_WORKER_DB_DIR" dir;
  dir

let with_sqlite_transaction_db f =
  let db = Sqlite.open_db ~path:":memory:" in
  Sqlite.exec db ~sql:"PRAGMA foreign_keys=ON" ~bind:[||];
  Sqlite.exec db ~sql:"CREATE TABLE parent(id INTEGER PRIMARY KEY)" ~bind:[||];
  Sqlite.exec db
    ~sql:"CREATE TABLE child(pid INTEGER REFERENCES parent(id) DEFERRABLE INITIALLY DEFERRED)"
    ~bind:[||];
  match f db with
  | result -> Sqlite.close db; result
  | exception exn -> Sqlite.close db; raise exn

let sqlite_exec db sql = Sqlite.exec db ~sql ~bind:[||]

let sqlite_check_rows db table expected =
  let actual = Sqlite.query db ~sql:("SELECT * FROM " ^ table) ~bind:[||] in
  if actual <> expected then failwith ("unexpected rows in " ^ table)

let sqlite_expect_error f =
  match f () with
  | _ -> failwith "expected SQLite transaction failure"
  | exception Sqlite.Sqlite_error _ -> ()

let sqlite_expect_callback_error expected f =
  match f () with
  | _ -> failwith "expected callback failure"
  | exception exn -> if exn <> expected then raise exn

let sqlite_check_reusable db =
  (* A new BEGIN proves SQLite left the failed transaction; a nested call
     also proves the wrapper selects SAVEPOINT again at the right depth. *)
  let result = Sqlite.transaction db (fun () ->
      Sqlite.transaction db (fun () -> sqlite_exec db "INSERT INTO parent VALUES (99)");
      "committed") in
  if result <> "committed" then failwith "lost transaction result";
  sqlite_check_rows db "parent" [[| Sqlite.Integer 99L |]]

let sqlite_transaction_cases =
  [ "sqlite nested transaction commits and returns result", (fun () ->
        with_sqlite_transaction_db (fun db ->
            sqlite_check_reusable db));
    "sqlite callback failure rolls back outer transaction", (fun () ->
        with_sqlite_transaction_db (fun db ->
            let original = Failure "outer callback" in
            sqlite_expect_callback_error original (fun () ->
                Sqlite.transaction db (fun () ->
                    sqlite_exec db "INSERT INTO parent VALUES (1)";
                    raise original));
            sqlite_check_rows db "parent" [];
            sqlite_check_reusable db));
    "sqlite nested callback failure preserves parent transaction", (fun () ->
        with_sqlite_transaction_db (fun db ->
            Sqlite.transaction db (fun () ->
                sqlite_exec db "INSERT INTO parent VALUES (1)";
                let original = Failure "nested callback" in
                sqlite_expect_callback_error original (fun () ->
                    Sqlite.transaction db (fun () ->
                        sqlite_exec db "INSERT INTO parent VALUES (2)";
                        raise original));
                sqlite_check_rows db "parent" [[| Sqlite.Integer 1L |]];
                Sqlite.transaction db (fun () ->
                    sqlite_exec db "INSERT INTO parent VALUES (3)"));
            sqlite_check_rows db "parent"
              [[| Sqlite.Integer 1L |]; [| Sqlite.Integer 3L |]]));
    "sqlite commit failure rolls back deferred foreign key", (fun () ->
        with_sqlite_transaction_db (fun db ->
            sqlite_expect_error (fun () ->
                Sqlite.transaction db (fun () ->
                    sqlite_exec db "INSERT INTO child VALUES (1)"));
            sqlite_check_rows db "child" [];
            sqlite_check_reusable db));
    "sqlite outer commit failure rolls back released nested savepoint", (fun () ->
        with_sqlite_transaction_db (fun db ->
            sqlite_expect_error (fun () ->
                Sqlite.transaction db (fun () ->
                    sqlite_exec db "INSERT INTO parent VALUES (2)";
                    Sqlite.transaction db (fun () ->
                        sqlite_exec db "INSERT INTO child VALUES (1)")));
            sqlite_check_rows db "parent" [];
            sqlite_check_rows db "child" [];
            sqlite_check_reusable db));
    "sqlite release failure rolls back before propagating", (fun () ->
        with_sqlite_transaction_db (fun db ->
            let original = Failure "abort outer after release failure" in
            sqlite_expect_callback_error original (fun () ->
                Sqlite.transaction db (fun () ->
                    sqlite_expect_error (fun () ->
                        Sqlite.transaction db (fun () ->
                            (* Turn the wrapper's first nested savepoint into
                               a transaction savepoint: SQLite checks deferred
                               foreign keys on RELEASE of this outermost one.
                               This deterministically fails the real RELEASE,
                               without mocking the database or exec. *)
                            sqlite_exec db "ROLLBACK";
                            sqlite_exec db "SAVEPOINT __logseq_tx_1";
                            sqlite_exec db "INSERT INTO child VALUES (1)"));
                    sqlite_check_rows db "child" [];
                    raise original));
            sqlite_check_reusable db));
    "sqlite rollback failure preserves original callback error", (fun () ->
        with_sqlite_transaction_db (fun db ->
            let original = Failure "callback already rolled back" in
            sqlite_expect_callback_error original (fun () ->
                Sqlite.transaction db (fun () ->
                    sqlite_exec db "INSERT INTO parent VALUES (1)";
                    sqlite_exec db "ROLLBACK";
                    raise original));
            sqlite_check_rows db "parent" [];
            sqlite_check_reusable db));
    "sqlite begin failure leaves wrapper reusable", (fun () ->
        with_sqlite_transaction_db (fun db ->
            sqlite_exec db "BEGIN";
            sqlite_expect_error (fun () -> Sqlite.transaction db (fun () -> ()));
            sqlite_exec db "ROLLBACK";
            sqlite_check_reusable db)) ]

let () =
  List.iter
    (fun (name, f) ->
       try f (); check name true
       with exn ->
         Printf.printf "sqlite regression error: %s\n%!" (Printexc.to_string exn);
         check name false)
    sqlite_transaction_cases;

  List.iter
    (fun (json, expected) ->
       check ("storage addresses " ^ json)
         (Storage_codec.decode_addresses json = expected))
    [ ("[]", []);
      ("[1000001,1000004]", ["1000001"; "1000004"]);
      (" \r\n[ 0, 2147483648 ]\t", ["0"; "2147483648"]);
      (Storage_codec.encode_addresses ["1"; "9007199254740991"],
       ["1"; "9007199254740991"]) ];
  List.iter
    (fun json ->
       let rejected =
         try ignore (Storage_codec.decode_addresses json); false
         with Invalid_argument _ -> true
       in
       check ("reject malformed storage addresses " ^ json) rejected)
    [""; "1,2"; "[1,]"; "[,1]"; "[x]"; "[-1]"; "[1.5]"; "[01]"; "[1] trailing"];

  (* --- wire helpers --- *)
  let m = Wire.kw_map [ ("a", Wire.int 1); ("b", Wire.string "s") ] in
  check "kw_map get int" (Wire.get_exn "a" m |> Wire.as_int = Some 1);
  check "kw_map get string" (Wire.get_exn "b" m |> Wire.as_string = Some "s");
  check "kw_map missing" (Wire.get "c" m = None);

  (* --- edn_of_transit --- *)
  let edn =
    Ds_wire.edn_of_transit
      (Wire.Array [ Wire.Keyword "db/add"; Wire.Int (-1); Wire.Keyword "block/name"; Wire.String "x" ])
  in
  check "edn tx vector" (edn = "[:db/add -1 :block/name \"x\"]");

  let edn_map =
    Ds_wire.edn_of_transit
      (Wire.Map [ (Wire.Keyword "db/unique", Wire.Keyword "db.unique/identity") ])
  in
  check "edn map" (edn_map = "{:db/unique :db.unique/identity}");

  (* --- dispatcher --- *)
  Worker_core.init ();
  let _worker_db_dir = setup () in
  search_normalization_memory_tests ();
  search_build_memory_tests ();
  graph_store_durability_tests ();
  graph_store_memory_tests ();
  graph_store_weak_indexes_test ();
  graph_close_recovery_tests ();
  service_retry_tests ();
  check "registered q" (Dispatcher.registered "thread-api/q");
  check "not registered" (not (Dispatcher.registered "thread-api/nope"));
  (* cljs (throw (ex-info "not found thread-api: ...")) — a synchronous
     throw makes remoteInvoke reject, so invoke raises before a task
     exists. *)
  let err =
    try
      ignore (Worker_core.invoke "thread-api/nope" "[]");
      "no-error"
    with e -> Printexc.to_string e
  in
  check "unregistered endpoint rejects"
    (string_contains err "not found thread-api");

  (* A failed first open must not make the next open skip initialization. *)
  let retry_repo = "logseq_db_failed-open-retry" in
  let open_retry opts =
    Worker_core.invoke "thread-api/create-or-open-db"
      (Transit_codec.to_string (Wire.Array [Wire.String retry_repo; opts]))
    |> await
  in
  let invalid_opts = Wire.kw_map ["datoms", Wire.Int 42] in
  for attempt = 1 to 2 do
    let failed =
      try
        match Transit_codec.of_string (open_retry invalid_opts) with
        | Wire.Tagged (("error" | "js/Error"), _) -> true
        | _ -> false
      with _ -> true
    in
    check (Printf.sprintf "invalid open rejects attempt %d" attempt) failed;
    check "failed open drops graph connection"
      (Worker_state.datascript_conn retry_repo = None);
    check "failed open drops SQLite connection"
      (Worker_state.sqlite_conn retry_repo = None)
  done;
  check "retry open succeeds"
    (not (string_contains (open_retry Wire.Nil) "error"));
  let initialized =
    Worker_core.invoke "thread-api/q"
      (Transit_codec.to_string
         (Wire.Array [Wire.String retry_repo;
                      Wire.Array [Wire.String
                        "[:find ?v . :where [?e :db/ident :logseq.kv/db-type] [?e :kv/value ?v]]"]]))
    |> await |> Transit_codec.of_string
  in
  check "retry creates graph initial data" (initialized = Wire.String "db");
  ignore (await (Worker_core.invoke "thread-api/close-db"
                   (Transit_codec.to_string (Wire.Array [Wire.String retry_repo]))));

  (* --- lifecycle end-to-end --- *)
  let _dir = setup () in
  let args = Wire.Array [ Wire.String repo; Wire.Map [ (Wire.Keyword "schema", Wire.Map [ (Wire.Keyword "block/name", Wire.Map [ (Wire.Keyword "db/unique", Wire.Keyword "db.unique/identity") ]) ]) ] ] in
  let schema_args = Transit_codec.to_string args in
  let res = await (Worker_core.invoke "thread-api/create-or-open-db" schema_args) in
  check "create-or-open-db ok" (not (string_contains res "error"));

  let version_at ident =
    let conn = Option.get (Worker_state.datascript_conn repo) in
    match Datascript.entity (Datascript.db conn) (Datascript.Ident ident) with
    | Some e -> Option.map Db_schema.parse_schema_version (Ldb.value e "kv/value")
    | None -> None
  in
  let current_version = Db_schema.version in
  check "new graph schema includes page-order repair"
    (version_at "logseq.kv/schema-version" = Some current_version);
  check "new graph initial schema includes page-order repair"
    (version_at "logseq.kv/graph-initial-schema-version" = Some current_version);

  let tx_args =
    Transit_codec.to_string
      (Wire.Array
         [
           Wire.String repo;
           Wire.Array
             [
               Wire.Map
                 [
                   ( Wire.Keyword "block/name", Wire.String "hello" );
                   ( Wire.Keyword "block/title", Wire.String "t" );
                   ( Wire.Keyword "block/uuid", Wire.Uuid "00000000-0000-0000-0000-000000000099" );
                   ( Wire.Keyword "block/created-at", Wire.Int 1 );
                   ( Wire.Keyword "block/updated-at", Wire.Int 1 );
                   ( Wire.Keyword "block/tags"
                   , Wire.Set [ Wire.Keyword "logseq.class/Page" ] );
                 ];
             ];
           Wire.Nil;
           Wire.Nil;
         ])
  in
  let tx_res = await (Worker_core.invoke "thread-api/transact" tx_args) in
  check "transact ok" (not (string_contains tx_res "error"));

  let q_args =
    Transit_codec.to_string
      (Wire.Array
         [
           Wire.String repo;
           Wire.Array [ Wire.String "[:find ?e :where [?e :block/name \"hello\"]]" ];
         ])
  in
  let q_res = await (Worker_core.invoke "thread-api/q" q_args) in
  check "q returns rows" (string_contains q_res "[[" || not (string_contains q_res "error"));

  let pull_args =
    Transit_codec.to_string
      (Wire.Array [ Wire.String repo; Wire.String "[*]"; Wire.Int 1 ])
  in
  let pull_res = await (Worker_core.invoke "thread-api/pull" pull_args) in
  check "pull returns map" (string_contains pull_res "db/id" || string_contains pull_res "hello");

  let datoms_args =
    Transit_codec.to_string (Wire.Array [ Wire.String repo; Wire.Keyword "eavt" ])
  in
  let datoms_res = await (Worker_core.invoke "thread-api/datoms" datoms_args) in
  check "datoms returns tuples" (string_contains datoms_res "block/name");

  (* --- persistence across reopen --- *)
  let _ = await (Worker_core.invoke "thread-api/close-db" (Transit_codec.to_string (Wire.Array [ Wire.String repo ]))) in
  let res2 = await (Worker_core.invoke "thread-api/create-or-open-db" schema_args) in
  check "reopen ok" (not (string_contains res2 "error"));
  let q_res2 = await (Worker_core.invoke "thread-api/q" q_args) in
  check "data survives reopen" (q_res2 = q_res || string_contains q_res2 "[[");

  (* Persist a pre-65.34 graph, then exercise the default migration on open. *)
  let conn = Option.get (Worker_state.datascript_conn repo) in
  ignore (Datascript.transact_conn_string conn
    "[[:db/add [:db/ident :logseq.kv/schema-version] :kv/value {:major 65 :minor 33}]
      [:db/add [:db/ident :logseq.kv/graph-initial-schema-version] :kv/value {:major 65 :minor 33}]
      {:db/id \"parent\" :block/name \"country\" :block/title \"Country\"
       :block/uuid #uuid \"33333333-3333-4333-8333-333333333333\"
       :block/tags :logseq.class/Page}
      {:block/name \"overview\" :block/title \"Overview\"
       :block/uuid #uuid \"55555555-5555-4555-8555-555555555555\"
       :block/parent \"parent\" :block/page \"parent\" :block/order \"bzz\"
       :block/tags :logseq.class/Page}
      {:block/name \"australia\" :block/title \"Australia\"
       :block/uuid #uuid \"44444444-4444-4444-8444-444444444444\"
       :block/parent \"parent\" :block/tags :logseq.class/Page}]");
  let close () =
    ignore (await (Worker_core.invoke "thread-api/close-db"
      (Transit_codec.to_string (Wire.Array [ Wire.String repo ]))))
  in
  let order_at uuid =
    let conn = Option.get (Worker_state.datascript_conn repo) in
    match Datascript.entity (Datascript.db conn)
      (Datascript.Lookup_ref ("block/uuid", Datascript.Uuid uuid)) with
    | Some e -> Ldb.value e "block/order"
    | None -> None
  in
  close ();
  ignore (await (Worker_core.invoke "thread-api/create-or-open-db" schema_args));
  check "old graph default open migrates to 65.34"
    (version_at "logseq.kv/schema-version" = Some current_version);
  check "old graph initial version is preserved"
    (version_at "logseq.kv/graph-initial-schema-version"
     = Some (Db_schema.parse_schema_version (Datascript.String "65.33")));
  let repaired_order = order_at "44444444-4444-4444-8444-444444444444" in
  check "old graph missing order repaired beyond sibling"
    (match repaired_order with
     | Some (Datascript.String o) -> String.compare o "bzz" > 0
     | _ -> false);
  check "old graph sibling order preserved"
    (order_at "55555555-5555-4555-8555-555555555555"
     = Some (Datascript.String "bzz"));
  close ();
  ignore (await (Worker_core.invoke "thread-api/create-or-open-db" schema_args));
  check "repaired schema survives reopen"
    (version_at "logseq.kv/schema-version" = Some current_version);
  check "repaired order survives reopen"
    (order_at "44444444-4444-4444-8444-444444444444" = repaired_order);
  close ();

  let list_res = await (Worker_core.invoke "thread-api/list-db" "[]") in
  check "list-db has repo" (string_contains list_res repo);

  if !failures > 0 then begin
    Printf.printf "%d failures\n%!" !failures;
    exit 1
  end else Printf.printf "all tests passed\n"
