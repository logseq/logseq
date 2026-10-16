(* Melange/node smoke tests mirroring test_worker_native. *)


external process_env : Js.Json.t Js.Dict.t = "env" [@@mel.scope "process"]

let set_env name value = Js.Dict.set process_env name (Js.Json.string value)

external tmpdir : unit -> string = "tmpdir" [@@mel.module "os"]

external mkdtemp : string -> string = "mkdtempSync" [@@mel.module "fs"]

let promise_of_task t =
  Js.Promise.make (fun ~resolve ~reject ->
      Db_worker_effect.on_any t (fun v -> resolve v [@u]) (fun e -> reject e [@u]))

external browser_process : 'a Js.Undefined.t = "process" [@@mel.scope "globalThis"]
external browser_global : 'a = "globalThis"
external set_browser_process : 'a -> 'b Js.Undefined.t -> unit = "process" [@@mel.set]
external browser_pfs : 'a Js.Undefined.t = "pfs" [@@mel.scope "globalThis"]
external set_browser_pfs : 'a -> 'b Js.Undefined.t -> unit = "pfs" [@@mel.set]
external browser_self : 'a Js.Undefined.t = "self" [@@mel.scope "globalThis"]
external set_browser_self : 'a -> 'b Js.Undefined.t -> unit = "self" [@@mel.set]
external browser_location : 'a Js.Undefined.t = "location" [@@mel.scope "globalThis"]
external set_browser_location : 'a -> 'b Js.Undefined.t -> unit = "location" [@@mel.set]

let () =
  Fest.test "browser runtime reads worker URL flags" (fun () ->
    let previous_process = browser_process in
    let previous_location = browser_location in
    let restore () =
      set_browser_process browser_global previous_process;
      set_browser_location browser_global previous_location
    in
    let run () =
      set_browser_process browser_global Js.Undefined.empty;
      List.iter (fun (query, owner, publishing) ->
        set_browser_location browser_global
          (Js.Undefined.return [%mel.obj { search = query; href = "http://localhost/worker.js" ^ query }]);
        Fest.equal (Runtime_env.owner_source ()) owner Fest.expect;
        Fest.equal (Runtime_env.publishing ()) publishing Fest.expect)
        [ "?electron=true", "electron", false
        ; "?capacitor=true&publishing=true", "capacitor", true
        ; "?electron=false&publishing=false", "browser", false ]
    in
    match run () with
    | () -> restore ()
    | exception error -> restore (); raise error);
  Fest.test "owner UI requests and error reports do not reach other tabs" (fun () ->
    let previous_process = browser_process in
    let previous_self = browser_self in
    let owner_messages = ref [] in
    let relayed = ref [] in
    let restore () =
      set_browser_process browser_global previous_process;
      set_browser_self browser_global previous_self;
      Broadcast.set_extra_poster None
    in
    let run () =
        set_browser_process browser_global Js.Undefined.empty;
        set_browser_self browser_global
          (Js.Undefined.return
             [%mel.obj { postMessage = (fun payload -> owner_messages := payload :: !owner_messages) }]);
        Broadcast.set_extra_poster
          (Some (fun ~kind ~transit_payload:_ -> relayed := kind :: !relayed));
        !Sync_platform.post_message_fn "request";
        Db_listener.capture_error "test" Wire.Nil Wire.Nil
    in
    (match run () with
     | () -> restore ()
     | exception error -> restore (); raise error);
    Fest.equal (List.length !owner_messages) 2 Fest.expect;
    Fest.equal !relayed [] Fest.expect);
  Fest.Promise.test "binary asset files preserve every byte on disk" (fun () ->
    let payload = String.init 33071 (fun i -> Char.chr (i mod 256)) in
    let directory = mkdtemp (Filename.concat (tmpdir ()) "asset-binary-") in
    let source = Filename.concat directory "source.png" in
    let destination = Filename.concat directory "destination.png" in
    Node.Fs.writeFileSync source payload `latin1;
    promise_of_task
      (Db_worker_effect.bind (File_sys.read_binary source) (fun actual ->
         Fest.equal actual payload Fest.expect;
         Db_worker_effect.map
           (fun () ->
             Fest.equal (Node.Fs.readFileSync destination `latin1) payload Fest.expect;
             Node.Fs.unlinkSync source;
             Node.Fs.unlinkSync destination;
             Node.Fs.rmdirSync directory)
           (File_sys.write_binary destination payload))));
  Fest.Promise.test "browser asset ArrayBuffer survives encryption" (fun () ->
    let payload = String.init 33071 (fun i -> Char.chr (i mod 256)) in
    let previous_process = browser_process in
    let previous_pfs = browser_pfs in
    let restore () =
      set_browser_process browser_global previous_process;
      set_browser_pfs browser_global previous_pfs
    in
    set_browser_process browser_global Js.Undefined.empty;
    set_browser_pfs browser_global
      (Js.Undefined.return
         [%mel.obj
           { readFile = (fun _path -> Js.Promise.resolve (U8a.buffer (U8a.of_string payload))) }]);
    let task = Asset_store.read_bytes ~repo:"logseq_db_binary" ~name:"image.png" in
    restore ();
    promise_of_task
      (Db_worker_effect.bind task (fun actual ->
           Fest.equal (String.length actual) (String.length payload) Fest.expect;
           Fest.equal actual payload Fest.expect;
           Db_worker_effect.bind (Crypto.Aes_gcm.generate ()) (fun key ->
             Db_worker_effect.bind
               (Sync_crypt.encrypt_uint8array_impl (Wire.Binary key) actual)
               (fun encrypted ->
                 Db_worker_effect.map
                   (fun decoded -> Fest.equal decoded payload Fest.expect)
                   (Sync_crypt.decrypt_uint8array_impl (Wire.Binary key) encrypted))))))

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

  Fest.test "integer transaction retractions preserve large scalar values" (fun () ->
      List.iter
        (fun timestamp ->
           let conn = Datascript.conn_from_db (Datascript.empty_db ()) in
           Common_util.protect
             ~finally:(fun () -> Db_tx.release_flags conn)
             (fun () ->
                ignore
                  (Db_transact.transact conn
                     [ Wire.kw_map
                         [ "db/id", Wire.Int 1
                         ; "block/title", Wire.String "undo"
                         ; "block/created-at", Wire.Int64 timestamp ] ]
                     []);
                Fest.expect |> Fest.equal
                  (List.exists
                     (fun (d : Datascript.datom) ->
                        d.a = "block/created-at" && d.v = Datascript.Int64 timestamp)
                     (List.of_seq (Datascript.datoms (Datascript.db conn) Datascript.Eavt ~e:1 ())))
                  true;
                ignore
                  (Db_transact.transact conn
                     [ Wire.Array
                         [ Wire.Keyword "db/retract"; Wire.Int 1
                         ; Wire.Keyword "block/created-at"; Wire.Int64 timestamp ]
                     ; Wire.Array
                         [ Wire.Keyword "db/retract"; Wire.Int 1
                         ; Wire.Keyword "block/title"; Wire.String "undo" ] ]
                     []);
                Fest.expect |> Fest.equal
                  (List.of_seq (Datascript.datoms (Datascript.db conn) Datascript.Eavt ~e:1 ()) = [])
                  true))
        [ 1791792912141L; 9007199254740993L ]);

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

(* Shared_service failure contracts use the real Melange effect scheduler.
   Request tests send their responses through Node's BroadcastChannel API. *)
module Shared_effect = Db_worker_effect

let shared_observe task =
  let outcome = ref None in
  Shared_effect.on_any task
    (fun value -> outcome := Some (Ok value))
    (fun exn -> outcome := Some (Error exn));
  outcome

let shared_await task =
  match !(shared_observe task) with
  | Some (Ok value) -> value
  | Some (Error exn) -> raise exn
  | None -> failwith "shared-service task still pending"

let shared_check condition = Fest.expect |> Fest.equal condition true

let shared_create handler =
  shared_await
    (Shared_service.create_service ~service_name:"failure-contract"
       ~target:(fun _ _ -> Shared_effect.pure Wire.Nil)
       ~on_become_master_handler:handler ~broadcast_data_types:[] ())

let shared_master handler ready =
  let channel = Broadcast_channel.create (Uuid_gen.uuid ()) in
  let task =
    try
      Shared_service.on_become_master ~master_client_id:"test-master"
        ~service_name:"failure-contract" ~common_channel:channel
        ~target:(fun _ _ -> Shared_effect.pure Wire.Nil)
        ~on_become_master_handler:handler ~status_ready:ready ()
    with exn -> Broadcast_channel.close channel; raise exn
  in
  Broadcast_channel.close channel;
  task

let () =
  List.iter
    (fun (name, start) ->
       Fest.test ("shared-service " ^ name ^ " ready success is synchronous") (fun () ->
           let calls = ref 0 in
           let ready = start (fun _ -> incr calls; Shared_effect.pure ()) in
           shared_check (!calls = 1);
           shared_check (!(shared_observe ready) = Some (Ok ())));
       Fest.test ("shared-service " ^ name ^ " ready rejects effect failure") (fun () ->
           let failure = Failure "initialization failed" in
           let ready = start (fun _ -> Shared_effect.error failure) in
           shared_check (!(shared_observe ready) = Some (Error failure)));
       Fest.test ("shared-service " ^ name ^ " ready rejects synchronous throw") (fun () ->
           let failure = Failure "initialization threw" in
           let ready = start (fun _ -> raise failure) in
           shared_check (!(shared_observe ready) = Some (Error failure)));
       Fest.test ("shared-service " ^ name ^ " deferred ready success") (fun () ->
           let init, resolver = Shared_effect.wait () in
           let ready = start (fun _ -> init) in
           let outcome = shared_observe ready in
           shared_check (!outcome = None);
           Shared_effect.wakeup resolver ();
           shared_check (!outcome = Some (Ok ())));
       Fest.test ("shared-service " ^ name ^ " deferred ready failure reaches all observers") (fun () ->
           let init, resolver = Shared_effect.wait () in
           let ready = start (fun _ -> init) in
           let first = shared_observe ready in
           let second = shared_observe ready in
           let failure = Failure "deferred initialization failed" in
           shared_check (!first = None && !second = None);
           Shared_effect.reject resolver failure;
           shared_check (!first = Some (Error failure) && !second = Some (Error failure));
           Shared_effect.wakeup resolver ();
           shared_check (!first = Some (Error failure))))
    [ "node", (fun handler -> (shared_create handler).Shared_service.status_ready)
    ; "browser master", (fun handler ->
          let ready, resolver = Shared_effect.wait () in
          ignore (shared_master handler resolver);
          ready)
    ];
  Fest.test "shared-service new service after failed initialization" (fun () ->
      let failure = Failure "first initialization failed" in
      let first = shared_create (fun _ -> Shared_effect.error failure) in
      let second = shared_create (fun _ -> Shared_effect.pure ()) in
      shared_check (!(shared_observe first.status_ready) = Some (Error failure));
      shared_check (!(shared_observe second.status_ready) = Some (Ok ())));
  Fest.test "shared-service proxy returns synchronous target throw as effect failure" (fun () ->
      let failure = Failure "target threw" in
      let service = shared_await
          (Shared_service.create_service ~service_name:"proxy-failure"
             ~target:(fun _ _ -> raise failure)
             ~on_become_master_handler:(fun _ -> Shared_effect.pure ())
             ~broadcast_data_types:[] ()) in
      shared_check (!(shared_observe (service.proxy [])) = Some (Error failure)))

let shared_request id =
  Wire.Map
    [ Wire.String "type", Wire.String "request"
    ; Wire.String "id", Wire.Int id
    ; Wire.String "method", Wire.String "remoteInvoke"
    ; Wire.String "args", Wire.Array [Wire.String "thread-api/failure-probe"] ]

let shared_request_test name target expected =
  Fest.Promise.test ("shared-service response " ^ name) (fun () ->
      let channel_name = Uuid_gen.uuid () in
      let sender = Broadcast_channel.create channel_name in
      let receiver = Broadcast_channel.create channel_name in
      let received, resolver = Shared_effect.wait () in
      let messages = ref [] in
      let listener = Broadcast_channel.add_message_listener receiver (fun response ->
          messages := response :: !messages;
          if List.length !messages = 2 then Shared_effect.wakeup resolver ()) in
      let close () =
        Broadcast_channel.remove_message_listener receiver listener;
        Broadcast_channel.close receiver;
        Broadcast_channel.close sender;
        Shared_effect.pure () in
      let calls = ref 0 in
      let handler = Shared_service.create_on_request_handler sender (fun method_name args ->
          incr calls;
          shared_check (method_name = "remoteInvoke");
          shared_check (args = [Wire.String "thread-api/failure-probe"]);
          target ()) in
      let test =
        try
          (* Repeated requests each receive a response, even with the same id. *)
          handler (shared_request 7);
          shared_check (!calls = 1);
          handler (shared_request 7);
          shared_check (!calls = 2);
          Shared_effect.bind (Shared_effect.timeout received 1000.) (fun () ->
              List.iter (fun response ->
                  shared_check (Option.bind (Wire.get "id" response) Wire.as_int = Some 7);
                  shared_check (Wire.get "type" response = Some (Wire.String "response"));
                  shared_check (Wire.get "method-key" response = Some (Wire.String "thread-api/failure-probe"));
                  let result, error = expected in
                  shared_check (Wire.get "result" response = Some result);
                  shared_check (Wire.get "error" response = Some error)) !messages;
              Shared_effect.pure ())
        with exn -> Shared_effect.error exn in
      promise_of_task (Shared_effect.finally test close))

let () =
  let result = Wire.String "ok" in
  let failure = Failure "endpoint failed" in
  let error = Shared_service.error_to_wire failure in
  shared_request_test "synchronous success" (fun () -> Shared_effect.pure result)
    (result, Wire.Nil);
  shared_request_test "synchronous throw" (fun () -> raise failure)
    (Wire.Nil, error);
  shared_request_test "already rejected effect" (fun () -> Shared_effect.error failure)
    (Wire.Nil, error);
  shared_request_test "deferred success" (fun () ->
      let task, resolver = Shared_effect.wait () in
      ignore (Js.Global.setTimeout ~f:(fun () -> Shared_effect.wakeup resolver result) 0
                : Js.Global.timeoutId);
      task) (result, Wire.Nil);
  shared_request_test "deferred failure" (fun () ->
      let task, resolver = Shared_effect.wait () in
      ignore (Js.Global.setTimeout ~f:(fun () -> Shared_effect.reject resolver failure) 0
                : Js.Global.timeoutId);
      task) (Wire.Nil, error);
  Fest.test "shared-service replay rejects synchronous endpoint throws and continues" (fun () ->
      let rejected = ref [] in
      let resolved = ref [] in
      let failure = Failure "replayed endpoint threw" in
      let entry args =
        { Shared_service.method_name = "remoteInvoke"; args
        ; resolve_fn = (fun value -> resolved := value :: !resolved)
        ; reject_fn = (fun value -> rejected := value :: !rejected) } in
      Shared_service.requests_in_flight :=
        [ 1, entry [Wire.String "fail"]; 2, entry [Wire.String "ok"] ];
      let run () =
           Shared_service.re_requests_in_flight_on_master (fun _ args ->
               if args = [Wire.String "fail"] then raise failure
               else Shared_effect.pure (Wire.String "ok"));
           shared_check (!rejected = [Shared_service.error_to_wire failure]);
           shared_check (!resolved = [Wire.String "ok"]);
           Shared_service.re_requests_in_flight_on_master (fun _ _ -> failwith "request replayed twice")
      in
      try run (); Shared_service.clear_old_service ()
      with exn -> Shared_service.clear_old_service (); raise exn)


let () =
  Fest.test "shared-service slave registration failure rejects ready" (fun () ->
      let common = Broadcast_channel.create (Uuid_gen.uuid ()) in
      Broadcast_channel.close common;
      let ready, resolver = Shared_effect.wait () in
      let initialization = Shared_effect.bind (Shared_effect.pure ()) (fun () ->
          Shared_service.on_become_slave ~slave_client_id:"failed-slave"
            ~service_name:"registration-failure" ~common_channel:common
            ~broadcast_data_types:[] ~status_ready:resolver ()) in
      let outcome = !(shared_observe ready) in
      let task_outcome = !(shared_observe initialization) in
      Shared_service.clear_old_service ();
      shared_check (match outcome, task_outcome with
          | Some (Error first), Some (Error second) -> first = second
          | _ -> false))


let () =
  List.iter (fun (name, run) ->
      Fest.test ("temporary batch preserves exception: " ^ name) (fun () ->
          let conn = Datascript.conn_from_db (Datascript.empty_db ()) in
          let original = Failure ("batch-sentinel-" ^ name) in
          let captured = ref None in
          let fail temp = captured := Some temp; raise original in
          let raised = try run conn fail; None with exn -> Some exn in
          Fest.expect |> Fest.equal (match raised with Some exn -> exn == original | None -> false) true;
          Fest.expect |> Fest.equal
            (match !captured with
             | Some temp -> not (List.exists (fun (candidate, _) -> candidate == temp) !Db_tx.conn_flags_list)
             | None -> false) true;
          Db_tx.release_flags conn))
    [ "db-tx", (fun conn f -> ignore (Db_tx.batch_transact_with_temp_conn conn f))
    ; "db-transact", (fun conn f -> ignore (Db_transact.batch_transact_with_temp_conn conn [] f))
    ; "sync-apply", (fun conn f -> ignore (Sync_replay.batch_transact_with_temp_conn_impl conn [] f ())) ]

let () =
  let marked s = Search_index.snippet_highlight_start ^ s ^ Search_index.snippet_highlight_end in
  List.iter
    (fun (name, title, query, expected) ->
       Fest.test ("search snippet preserves Unicode: " ^ name) (fun () ->
           Fest.expect |> Fest.equal
             (Search_index.ensure_highlighted_snippet None (Some title) query)
             (Some expected)))
    [ "mixed Chinese and English",
      {js|Repro · 列边界拖拽热区过窄，难以命中，光标反馈弱|js}, "repro",
      marked "Repro" ^ {js| · 列边界拖拽热区过窄，难以命中，光标反馈弱|js}
    ; "Chinese query", {js|今天学习中文|js}, {js|中文|js}, {js|今天学习|js} ^ marked {js|中文|js}
    ; "accented text and emoji", {js|Repro · café 😀 中文|js}, "repro",
      marked "Repro" ^ {js| · café 😀 中文|js}
    ; "astral query", {js|中文 😀 search|js}, {js|😀|js}, {js|中文 |js} ^ marked {js|😀|js} ^ " search" ];
  Fest.test "search snippets preserve Chinese in a distant match window" (fun () ->
      let title = String.concat "" (List.init 300 (fun _ -> {js|中|js})) ^ {js| target 中文内容|js} in
      let actual = Option.get (Search_index.ensure_highlighted_snippet None (Some title) "target") in
      Fest.expect |> Fest.equal (contains actual (marked "target" ^ {js| 中文内容|js})) true;
      Fest.expect |> Fest.equal (contains actual {js|中|js}) true;
      Fest.expect |> Fest.equal (contains actual {js|ï|js}) false);
  Fest.test "fuzzy search distinguishes Chinese text and counts astral characters" (fun () ->
      Fest.expect |> Fest.equal (Search_fuzzy.utf16_length {js|中文😀|js}) 4;
      Fest.expect |> Fest.equal
        (Search_fuzzy.score {js|中文|js} {js|中文|js} > Search_fuzzy.score {js|中文|js} {js|另一段文字|js}) true);
  Fest.test "indexed search returns the original Chinese block text" (fun () ->
      let open Datascript in
      let page_uuid = "00000000-0000-4000-8000-000000000101" in
      let block_uuid = "00000000-0000-4000-8000-000000000102" in
      let title = {js|Repro · 列边界拖拽热区过窄，难以命中，光标反馈弱|js} in
      let conn = Datascript.conn_from_db (Datascript.empty_db ~schema:(Db_schema.schema ()) ()) in
      let scalar a v = a, One_value v in
      ignore (Datascript.transact_conn conn
        [ Entity { db_id = Some (Entity_id 1); attrs =
            [ scalar "block/uuid" (Uuid page_uuid); scalar "block/name" (String "search")
            ; scalar "block/title" (String "Search") ] }
        ; Entity { db_id = Some (Entity_id 2); attrs =
            [ scalar "block/uuid" (Uuid block_uuid); scalar "block/title" (String title)
            ; scalar "block/page" (Ref 1); scalar "block/parent" (Ref 1)
            ; scalar "block/order" (String "a0") ] } ]);
      let db = Sqlite.open_db ~path:":memory:" in
      Common_util.protect ~finally:(fun () -> Sqlite.close db) (fun () ->
          Search_index.create_tables_and_triggers db;
          Search_index.upsert_blocks db
            [ Search_index.mk_index_item ~id:block_uuid ~page:page_uuid ~title () ];
          let result = Search_index.search_blocks ~conn ~search_db:(Some db)
              ~vector_index:None ~q0:"repro" ~opts:Search_index.default_opts in
          let rows = match result with
            | Search_index.Rows rows | Search_index.Rows_with_count (rows, _) -> rows in
          Fest.expect |> Fest.equal
            (List.map (fun row -> List.assoc_opt "block/title" row) rows
             = [ Some (String (marked "Repro" ^ {js| · 列边界拖拽热区过窄，难以命中，光标反馈弱|js})) ]) true))
