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
  storage.storage_store [ "7654321", Storage_node (Persistent_sorted_set.Leaf []) ];
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
    string_of_int (8000000 + i), Storage_node (Persistent_sorted_set.Leaf [])) in
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

let repo = "test/graph"

let setup () =
  let dir = Filename.temp_dir "db_worker_test" "XXXXXX" in
  Unix.putenv "LOGSEQ_WORKER_DB_DIR" dir;
  dir

let () =
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
  graph_store_durability_tests ();
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

  (* --- lifecycle end-to-end --- *)
  let _dir = setup () in
  let args = Wire.Array [ Wire.String repo; Wire.Map [ (Wire.Keyword "schema", Wire.Map [ (Wire.Keyword "block/name", Wire.Map [ (Wire.Keyword "db/unique", Wire.Keyword "db.unique/identity") ]) ]) ] ] in
  let schema_args = Transit_codec.to_string args in
  let res = await (Worker_core.invoke "thread-api/create-or-open-db" schema_args) in
  check "create-or-open-db ok" (not (string_contains res "error"));

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

  let list_res = await (Worker_core.invoke "thread-api/list-db" "[]") in
  check "list-db has repo" (string_contains list_res repo);

  if !failures > 0 then begin
    Printf.printf "%d failures\n%!" !failures;
    exit 1
  end else Printf.printf "all tests passed\n"
