(* Melange/node smoke tests mirroring test_worker_native. *)


external process_env : Js.Json.t Js.Dict.t = "env" [@@mel.scope "process"]

let set_env name value = Js.Dict.set process_env name (Js.Json.string value)

external tmpdir : unit -> string = "tmpdir" [@@mel.module "os"]

external mkdtemp : string -> string = "mkdtempSync" [@@mel.module "fs"]

let promise_of_task t =
  Js.Promise.make (fun ~resolve ~reject ->
      Db_worker_effect.on_any t (fun v -> resolve v [@u]) (fun e -> reject e [@u]))

let contains haystack needle =
  match Js.String.indexOf ~search:needle haystack with
  | -1 -> false
  | _ -> true

let repo = "test/melange-graph"

let schema_args () =
  Transit_codec.to_string
    (Wire.Array
       [
         Wire.String repo;
         Wire.Map
           [
             ( Wire.Keyword "schema",
               Wire.Map
                 [
                   ( Wire.Keyword "block/name",
                     Wire.Map [ (Wire.Keyword "db/unique", Wire.Keyword "db.unique/identity") ] );
                 ] );
           ];
       ])

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
  List.iter (fun (name, f) -> Fest.test name f) sqlite_transaction_cases;

  Fest.test "storage addresses decode persisted JSON arrays" (fun () ->
      List.iter
        (fun (json, expected) ->
           Fest.expect |> Fest.equal (Storage_codec.decode_addresses json = expected) true)
        [ ("[]", []);
          ("[1000001,1000004]", ["1000001"; "1000004"]);
          (" \r\n[ 0, 2147483648 ]\t", ["0"; "2147483648"]);
          (Storage_codec.encode_addresses ["1"; "9007199254740991"],
           ["1"; "9007199254740991"]) ]);

  Fest.test "storage addresses reject malformed arrays" (fun () ->
      List.iter
        (fun json ->
           let rejected =
             try ignore (Storage_codec.decode_addresses json); false
             with Invalid_argument _ -> true
           in
           Fest.expect |> Fest.equal rejected true)
        [""; "1,2"; "[1,]"; "[,1]"; "[x]"; "[-1]"; "[1.5]"; "[01]"; "[1] trailing"]);

  Fest.test "wire helpers" (fun () ->
      let m = Wire.kw_map [ ("a", Wire.int 1) ] in
      Fest.expect |> Fest.equal (Wire.get_exn "a" m |> Wire.as_int) (Some 1);
      let edn =
        Ds_wire.edn_of_transit
          (Wire.Array [ Wire.Keyword "db/add"; Wire.Int (-1); Wire.Keyword "block/name"; Wire.String "x" ])
      in
      Fest.expect |> Fest.equal edn "[:db/add -1 :block/name \"x\"]");

  Fest.test "dispatcher registers endpoints" (fun () ->
      Worker_core.init ();
      Fest.expect |> Fest.equal (Dispatcher.registered "thread-api/q") true;
      Fest.expect |> Fest.equal (Dispatcher.registered "thread-api/nope") false);

  Fest.Promise.test "end-to-end worker lifecycle" (fun () ->
      let dir = mkdtemp (Filename.concat (tmpdir ()) "dbw-") in
      set_env "LOGSEQ_WORKER_DB_DIR" dir;
      Worker_core.init ();
      promise_of_task (Worker_core.invoke "thread-api/create-or-open-db" (schema_args ()))
      |> Js.Promise.then_ (fun res ->
             Fest.expect |> Fest.equal (contains res "error") false;
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
                              ( Wire.Keyword "block/title", Wire.String "hello" );
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
             promise_of_task (Worker_core.invoke "thread-api/transact" tx_args))
      |> Js.Promise.then_ (fun res ->
             (* cljs transact returns nil *)
             Fest.expect |> Fest.equal (contains res "error") false;
             let q_args =
               Transit_codec.to_string
                 (Wire.Array
                    [
                      Wire.String repo;
                      Wire.Array [ Wire.String "[:find ?e :where [?e :block/name \"hello\"]]" ];
                    ])
             in
             promise_of_task (Worker_core.invoke "thread-api/q" q_args))
      |> Js.Promise.then_ (fun res ->
             Fest.expect |> Fest.equal (contains res "error") false;
             Fest.expect |> Fest.equal (contains res "hello" || contains res "[[") true;
             let datoms_args =
               Transit_codec.to_string (Wire.Array [ Wire.String repo; Wire.Keyword "eavt" ])
             in
             promise_of_task (Worker_core.invoke "thread-api/datoms" datoms_args))
      |> Js.Promise.then_ (fun res ->
             Fest.expect |> Fest.equal (contains res "block/name") true;
             promise_of_task
               (Worker_core.invoke "thread-api/close-db"
                  (Transit_codec.to_string (Wire.Array [ Wire.String repo ]))))
      |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()))
