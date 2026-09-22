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

let () =
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
