(* Lifecycle endpoints. Faithful port of the conn-management parts of
   frontend.worker.db-core: open sqlite, create kvs table, restore or
   create the datascript conn, register per-repo state. *)


let () = Dispatcher.register "thread-api/init" (fun _ -> Db_worker_effect.pure Wire.nil)

(* cljs node storage keeps each graph at
   <graphs-dir>/<encoded-graph>/db.sqlite (platform/node.cljs repo-dir),
   where <encoded-graph> is graph-dir/repo->encoded-graph-dir-name. *)
let db_dir repo =
  let base =
    match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
    | Some dir -> dir
    | None -> "."
  in
  match Graph_dir.repo_to_encoded_graph_dir_name repo with
  | Some dir -> Filename.concat base dir
  | None -> base

let db_path repo = Filename.concat (db_dir repo) "db.sqlite"

(* :thread-api/list-db -> [{:name repo} ...]
   cljs <list-all-dbs lists every graph dir under the storage root and
   returns {:name "logseq_db_<decoded-key>"}. On pooled runtimes there is
   no directory to scan; the open conns are the only record. *)
let () =
  Dispatcher.register "thread-api/list-db" (fun _ ->
      let entry_map name = Wire.Map [ Wire.Keyword "name", Wire.String name ] in
      if Sqlite.pooled_runtime () then
        Db_worker_effect.pure
          (Wire.Array (List.map entry_map (Worker_state.repos ())))
      else
        let base =
          match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
          | Some dir -> dir
          | None -> "."
        in
        Db_worker_effect.bind (File_sys.readdir base) (fun entries ->
            let rec with_dbs acc = function
              | [] -> Db_worker_effect.pure (List.rev acc)
              | dir :: rest ->
                  Db_worker_effect.bind
                    (File_sys.exists
                       (Filename.concat (Filename.concat base dir) "db.sqlite"))
                    (fun ok ->
                      if ok then with_dbs (dir :: acc) rest
                      else with_dbs acc rest)
            in
            Db_worker_effect.bind (with_dbs [] entries) (fun dirs ->
                let names =
                  List.filter_map
                    (fun dir ->
                      Option.map
                        (fun key -> entry_map ("logseq_db_" ^ key))
                        (Graph_dir.decode_canonical_graph_dir_key dir))
                    dirs
                in
                Db_worker_effect.pure (Wire.Array names))))

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
           let ensure_dir =
             if Sqlite.pooled_runtime () then Db_worker_effect.pure ()
             else File_sys.mkdir_p (db_dir repo)
           in
           Db_worker_effect.bind ensure_dir (fun () ->
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
                 (* cljs get-storage-conn always uses db-schema/schema *)
                 Datascript.create_conn ~schema:(Db_schema.schema ()) ~storage ()
           in
           (* cljs <create-or-open-db!: on a fresh graph (no initial data,
              not a sync-download) transact build-db-initial-data; run
              db-migrate on every open. *)
           let sync_download = opt_bool "sync-download-graph?" false opts in
           let initial_data_exists =
             let db = Datascript.db conn in
             (match Ldb.ent_of_ref db (Datascript.Ident "logseq.class/Root") with
              | Some _ -> true
              | None -> false)
             && (match Ldb.ent_of_ref db (Datascript.Ident "logseq.kv/db-type") with
                 | Some e -> Ldb.value e "kv/value" = Some (Datascript.String "db")
                 | None -> false)
           in
           (if not (initial_data_exists || sync_download) then
              let config_content =
                match Wire.get "config" opts with
                | Some (Wire.String c) -> c
                | _ -> Templates.config_edn
              in
              let opt_str name =
                match Wire.get name opts with
                | Some (Wire.String s) -> Some s
                | _ -> None
              in
              let tx =
                Sqlite_create_graph.initial_tx_data
                  ~db:(Datascript.db conn)
                  ~config_content
                  ?import_type:
                    (Option.map Ds_wire.value_of_transit
                       (Wire.get "import-type" opts))
                  ?graph_git_sha:(opt_str "graph-git-sha")
                  ?creating_remote_graph:
                    (match Wire.get "creating-remote-graph?" opts with
                     | Some (Wire.Bool b) -> Some b
                     | _ -> None)
                  ()
              in
              ignore
                (Datascript.transact_conn conn tx
                   ~tx_meta:[ "initial-db?", Datascript.Bool true ]));
           (if not sync_download then
              (* cljs then runs handle-migrate-result-local-txs! /
                 maybe-enqueue-built-in-sync-repair! and recycle-gc — they
                 need the client-ops db + sync plumbing, not yet ported. *)
              ignore (Db_migrate.migrate conn));
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
                       ] ))))))
  | _ -> invalid_arg "create-or-open-db expects (repo opts)"

let () = Dispatcher.register "thread-api/create-or-open-db" create_or_open_db

(* close-db-aux!: drop conns, clear pending counts, close sqlite. *)
let close_db_aux repo =
  Worker_state.drop_datascript_conn repo;
  Worker_state.drop_pending_local_tx_count repo;
  Endpoint_search.clear_search_index_builds repo;
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
          File_sys.remove (db_dir repo)
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
