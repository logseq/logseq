(* Lifecycle endpoints. Faithful port of the conn-management parts of
   frontend.worker.db-core: open sqlite, create kvs table, restore or
   create the datascript conn, register per-repo state. *)


let () = Dispatcher.register "thread-api/init" (fun _ -> Db_worker_effect.pure Wire.nil)

let db_path repo =
  let base =
    match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
    | Some dir -> dir
    | None -> "."
  in
  let name = String.map (fun c -> match c with '/' | '\\' | ':' -> '-' | c -> c) repo in
  Filename.concat base (name ^ ".sqlite")

(* :thread-api/list-db -> repo names with open dbs *)
let () =
  Dispatcher.register "thread-api/list-db" (fun _ ->
      Db_worker_effect.pure (Wire.Array (List.map Wire.string (Worker_state.repos ()))))

(* :thread-api/db-exists [repo] *)
let () =
  Dispatcher.register "thread-api/db-exists" (fun args ->
      match args with
      | Wire.String repo :: _ ->
          let exists = Option.is_some (Worker_state.sqlite_conn repo) in
          if exists then Db_worker_effect.pure (Wire.Bool true)
          else
            File_sys.exists (db_path repo)
            |> Db_worker_effect.map (fun e -> Wire.Bool e)
      | _ -> Db_worker_effect.pure (Wire.Bool false))

(* :thread-api/create-or-open-db [repo opts]
   Faithful core of <create-or-open-db!: on graph switch reset the
   deleted-block map, close other repos' dbs (unless :close-other-db?
   false), open sqlite, create kvs, restore or create the conn, and
   return {:schema ...}. *)
let opt_bool name default t =
  match Wire.get name t with
  | Some (Wire.Bool b) -> b
  | _ -> default

let create_or_open_db args =
  match args with
  | Wire.String repo :: opts_rest ->
      let opts = match opts_rest with t :: _ -> t | [] -> Wire.Nil in
      let current =
        match Worker_state.state_get "git/current-repo" with
        | Some (Wire.String r) -> Some r
        | _ -> None
      in
      if current <> Some repo then Worker_state.reset_deleted_blocks ();
      (match Worker_state.datascript_conn repo with
       | Some conn ->
           Db_worker_effect.pure
             (Wire.Map
                [
                  ( Wire.Keyword "schema",
                    Ds_wire.transit_of_schema
                      (Datascript.schema (Datascript.db conn)) );
                ])
       | None ->
           if opt_bool "close-other-db?" true opts then
             Worker_state.close_other_sqlite_conns repo;
           Db_worker_effect.bind
             (Sqlite.prepare_pool ~name:(Graph_dir.pool_name repo))
             (fun () ->
           let db =
             match Worker_state.sqlite_conn repo with
             | Some db -> db
             | None ->
                 let db =
                   Sqlite.open_db_pool ~name:(Graph_dir.pool_name repo)
                     ~path:
                       (if Sqlite.pooled_runtime () then "/db.sqlite"
                        else db_path repo)
                 in
                 Sqlite.exec db ~sql:"pragma journal_mode=WAL" ~bind:[||];
                 Worker_state.set_sqlite_conn repo db;
                 db
           in
           Graph_store.create_kvs_table db;
           let storage = Graph_store.storage db in
           let conn =
             match Datascript.restore_conn storage with
             | Some conn -> conn
             | None ->
                 let schema =
                   match Wire.get "schema" opts with
                   | Some t -> Datascript.schema_of_edn_string (Ds_wire.edn_text_of_arg t)
                   | None -> []
                 in
                 Datascript.create_conn ~schema ~storage ()
           in
           Worker_state.set_datascript_conn repo conn;
           Db_listener.listen_db_changes repo conn;
           (match Worker_state.datascript_conn repo with
            | Some conn ->
                Db_worker_effect.pure
                  (Wire.Map
                     [
                       ( Wire.Keyword "schema",
                         Ds_wire.transit_of_schema
                           (Datascript.schema (Datascript.db conn)) );
                     ])
            | None ->
                Db_worker_effect.error
                  (Dispatcher.Exn_info
                     ( "Missing worker graph connection",
                       [
                         (Wire.Keyword "type", Wire.Keyword "db/missing-connection");
                         (Wire.Keyword "repo", Wire.String repo);
                       ] )))))
  | _ -> invalid_arg "create-or-open-db expects (repo opts)"

let () = Dispatcher.register "thread-api/create-or-open-db" create_or_open_db

(* close-db-aux!: drop conns, clear pending counts, close sqlite. *)
let close_db_aux repo =
  Worker_state.drop_datascript_conn repo;
  Worker_state.drop_pending_local_tx_count repo;
  (match Worker_state.sqlite_conn repo with
   | Some db ->
       Sqlite.close db;
       Worker_state.drop_sqlite_conn repo
   | None -> ())

let close_db_handler args =
  match args with
  | Wire.String repo :: _ ->
      let (_ : int) = Endpoint_state.cancel_ui_requests Wire.Nil in
      close_db_aux repo;
      Db_worker_effect.pure Wire.nil
  | _ -> invalid_arg "close-db expects repo"

let () = Dispatcher.register "thread-api/close-db" close_db_handler

(* :thread-api/db-sync-close-db [repo] — same as close-db. *)
let () = Dispatcher.register "thread-api/db-sync-close-db" close_db_handler

(* :thread-api/unsafe-unlink-db [repo] — cancel requests, close, then
   delete the graph's storage file (node storage root). *)
let () =
  Dispatcher.register "thread-api/unsafe-unlink-db" (fun args ->
      match args with
      | Wire.String repo :: _ ->
          let (_ : int) = Endpoint_state.cancel_ui_requests Wire.Nil in
          close_db_aux repo;
          File_sys.remove (db_path repo)
          |> Db_worker_effect.map (fun () -> Wire.nil)
      | _ -> invalid_arg "unsafe-unlink-db expects repo")

(* :thread-api/release-access-handles [repo] — pauses the OPFS pool on
   browser; node/native storage holds no access handles. *)
let () =
  Dispatcher.register "thread-api/release-access-handles" (fun args ->
      match args with
      | Wire.String _ :: _ -> Db_worker_effect.pure Wire.nil
      | _ -> invalid_arg "release-access-handles expects repo")

(* :thread-api/reset-db [repo db-transit] — handler/maintenance.cljs *)
let () =
  Dispatcher.register "thread-api/reset-db" (fun args ->
      let repo = match args with Wire.String r :: _ -> r | _ -> invalid_arg "repo arg" in
      (match Worker_state.datascript_conn repo with
       | None -> Db_worker_effect.pure Wire.nil
       | Some conn ->
           (match Option.bind (List.nth_opt args 1) Wire.as_string with
            | Some transit ->
                let sdb =
                  Ds_wire.serializable_db_of_transit (Transit_codec.of_string transit)
                in
                let new_db = Datascript.from_serializable sdb in
                (* cljs swaps the old conn's eavt storage onto the new db so
                   kvs persistence keeps writing to the same sqlite file. *)
                let new_db' =
                  match Datascript.storage (Datascript.db conn) with
                  | Some st -> { new_db with storage_ref = Some st }
                  | None -> new_db
                in
                ignore
                  (Datascript.reset_conn
                     ~tx_meta:[ "reset-conn!", Bool true ]
                     conn new_db');
                Db_worker_effect.pure Wire.nil
            | None -> Db_worker_effect.pure Wire.nil)))

(* :thread-api/gc-graph [repo] — handler/maintenance.cljs *)
let () =
  Dispatcher.register "thread-api/gc-graph" (fun args ->
      let repo = match args with Wire.String r :: _ -> r | _ -> invalid_arg "repo arg" in
      (match Worker_state.sqlite_conn repo, Worker_state.datascript_conn repo with
       | Some db, Some conn ->
           Graph_gc.gc_kvs_table ~full_gc:true db;
           Sqlite.exec db ~sql:"VACUUM" ~bind:[||];
           let tx_edn =
             Printf.sprintf
               "[{:db/ident :logseq.kv/graph-last-gc-at :kv/value %d}]"
               (int_of_float (Clock.now_ms ()))
           in
           ignore
             (Datascript.transact_conn_string
                ~tx_meta:[ "skip-validate-db?", Bool true; "persist-op?", Bool false ]
                conn tx_edn);
           Db_worker_effect.pure Wire.nil
       | _ -> Db_worker_effect.pure Wire.nil))

(* :thread-api/backup-db-sqlite [repo dst-path] — sqlite backup to dst-path *)
let () =
  Dispatcher.register "thread-api/backup-db-sqlite" (fun args ->
      let repo = match args with Wire.String r :: _ -> r | _ -> invalid_arg "repo arg" in
      (match Worker_state.sqlite_conn repo with
       | None -> invalid_arg ("graph not opened: " ^ repo)
       | Some db ->
           (match Option.bind (List.nth_opt args 1) Wire.as_string with
            | Some dst ->
                Sqlite.backup db ~dst_path:dst;
                Db_worker_effect.pure Wire.nil
            | None -> Db_worker_effect.pure Wire.nil)))
