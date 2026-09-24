(* Lifecycle endpoints. Faithful port of the conn-management parts of
   frontend.worker.db-core: open sqlite, create kvs table, restore or
   create the datascript conn, register per-repo state. *)


(* cljs thread-api/init -> init-sqlite-module!: read the publishing
   env flag, then load sqlite-wasm (no-op where opens are per-db). *)
let () =
  Dispatcher.register "thread-api/init" (fun _ ->
      Worker_state.set_publishing (Runtime_env.publishing ());
      Db_worker_effect.map (fun () -> Wire.nil) (Sqlite.init ()))

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
   cljs <list-all-dbs: platform :list-graphs returns decoded graph
   names without the prefix (browser OPFS ".logseq-pool-*" dirs; node
   graph dirs); each is re-prefixed into {:name "logseq_db_<name>"}. *)
let () =
  Dispatcher.register "thread-api/list-db" (fun _ ->
      let entry_map name = Wire.Map [ Wire.Keyword "name", Wire.String name ] in
      Db_worker_effect.map
        (fun graph_names ->
          Wire.Array
            (List.map
               (fun name -> entry_map ("logseq_db_" ^ name))
               graph_names))
        (Sqlite.list_graphs ()))

(* :thread-api/db-exists [repo] *)
let () =
  Dispatcher.register "thread-api/db-exists" (fun args ->
      let args =
        match args with
        | Wire.Nil :: rest -> Wire.String "" :: rest
        | _ -> args
      in
      match args with
      | Wire.String repo :: _ ->
          let exists = Option.is_some (Worker_state.sqlite_conn repo) in
          if exists then Db_worker_effect.pure (Wire.Bool true)
          else if Sqlite.pooled_runtime () then
            Db_worker_effect.map (fun e -> Wire.Bool e) (Sqlite.db_exists ~repo)
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

(* cljs db-core/*client-ops-cleanup-timers — repo -> interval handle *)
let client_ops_cleanup_timers : (string, Timers.timer) Hashtbl.t =
  Hashtbl.create 7

(* cljs db-core/client-ops-cleanup-interval-ms *)
let client_ops_cleanup_interval_ms = 3 * 60 * 60 * 1000

(* cljs db-core/run-client-ops-cleanup! *)
let run_client_ops_cleanup repo =
  let protected_tx_ids = Undo_redo.referenced_history_tx_ids repo in
  ignore (Sync_client_op.cleanup_finished_history_ops repo protected_tx_ids)

(* cljs db-core/ensure-client-ops-cleanup-timer! *)
let ensure_client_ops_cleanup_timer repo =
  if (not (Worker_state.publishing ()))
     && repo <> ""
     && not (Hashtbl.mem client_ops_cleanup_timers repo)
  then
    Hashtbl.replace client_ops_cleanup_timers repo
      (Timers.set_interval client_ops_cleanup_interval_ms (fun () ->
           run_client_ops_cleanup repo))

(* cljs db-core/debug-transit-raw->datoms — the :datoms or
   :debug-transit-raw open-opt decodes to a transit-serialized DB or a
   raw coll of datoms ([e a v tx] vectors or {:e :a :v} maps). *)
let rec debug_transit_raw_to_datoms (t : Wire.t) : Datascript.datom list =
  match t with
  | Wire.String raw -> debug_transit_raw_to_datoms (Transit_codec.of_string raw)
  | Wire.Tagged ("datascript/DB", _) | Wire.Map _ ->
      List.of_seq
        (Datascript.datoms
           (Datascript.from_serializable (Ds_wire.serializable_db_of_transit t))
           Datascript.Eavt ())
  | Wire.Array _ | Wire.List _ | Wire.Set _ ->
      List.map
        (fun w ->
           match w with
           | Wire.Map _ ->
               let e =
                 match Wire.get "e" w with
                 | Some (Wire.Int n) -> n
                 | Some (Wire.Int64 n) -> Int64.to_int n
                 | _ -> invalid_arg "datom e must be int"
               in
               let a =
                 match Wire.get "a" w with
                 | Some (Wire.Keyword s) -> s
                 | _ -> invalid_arg "datom a must be keyword"
               in
               let v =
                 match Wire.get "v" w with
                 | Some v -> Ds_wire.value_of_transit v
                 | None -> Datascript.Nil
               in
               ({ e; a; v; tx = 0; added = true } : Datascript.datom)
           | _ -> Ds_wire.datom_of_transit w)
        (Wire.as_seq t)
  | _ -> invalid_arg "debug-transit-raw->datoms: unexpected shape"

(* cljs partition-all batch-size for bootstrap-transact! *)
let partition_all (n : int) (xs : 'a list) : 'a list list =
  let rec take k acc l =
    if k <= 0 then (List.rev acc, l)
    else
      match l with
      | [] -> (List.rev acc, [])
      | x :: tl -> take (k - 1) (x :: acc) tl
  in
  let rec loop acc l =
    match l with
    | [] -> List.rev acc
    | _ ->
        let h, tl = take n [] l in
        loop (h :: acc) tl
  in
  loop [] xs

(* cljs <create-or-open-db! datoms branch — raw d/transact! (outside the
   worker pipeline) replaying imported datoms as [:db/add e a v], ident
   eids' datoms first, 20k items per tx with {:initial-db? true}. *)
let bootstrap_datoms (conn : Datascript.conn) (datoms : Datascript.datom list) =
  let module IntSet = Set.Make (Int) in
  let ident_eids =
    List.fold_left
      (fun s (d : Datascript.datom) ->
         if d.Datascript.a = "db/ident" then IntSet.add d.Datascript.e s else s)
      IntSet.empty datoms
  in
  let to_tx (d : Datascript.datom) =
    Datascript.Add (Datascript.Entity_id d.Datascript.e, d.Datascript.a, d.Datascript.v)
  in
  let ident, non_ident =
    List.partition
      (fun (d : Datascript.datom) -> IntSet.mem d.Datascript.e ident_eids)
      datoms
  in
  List.iter
    (fun batch ->
       ignore
         (Datascript.transact_conn conn (List.map to_tx batch)
            ~tx_meta:[ "initial-db?", Datascript.Bool true ]))
    (partition_all 20000 ident @ partition_all 20000 non_ident)

(* cljs db-core/built-in-sync-repair-tx-id *)
let built_in_sync_repair_tx_id = "00000000-0000-4000-8000-652665286528"

(* cljs db-core/built-in-sync-repair-timestamp — fixed so duplicate
   repair txs from multiple clients converge on the same datoms. *)
let built_in_sync_repair_timestamp = 0

let built_in_sync_repair_properties =
  [ "logseq.property.repeat/repeat-type"; "logseq.property.comments/blocks" ]

let built_in_sync_repair_classes =
  [ "logseq.class/Comments"; "logseq.class/Comment" ]

let built_in_sync_repair_unordered_classes = built_in_sync_repair_classes

(* cljs db-core/stable-built-in-sync-repair-item *)
let stable_built_in_sync_repair_item order (m : Block_map.t) : Block_map.t =
  if Block_map.mem m "block/uuid" then
    let m =
      Block_map.put
        (Block_map.put m "block/created-at" (Datascript.Instant 0L))
        "block/updated-at" (Datascript.Instant 0L)
    in
    (match Block_map.attr_value m "db/ident" with
     | Some (Datascript.Keyword ident)
       when not (List.mem ident built_in_sync_repair_unordered_classes) ->
         (match order with
          | Some o -> Block_map.put m "block/order" (Datascript.String o)
          | None -> m)
     | _ -> m)
  else m

(* cljs db-core/built-in-sync-repair-tx-data *)
let built_in_sync_repair_tx_data () : Wire.t list =
  let new_properties =
    Builtin_data.built_in_properties
    |> List.filter (fun (b : Builtin_data.builtin_property) ->
           List.mem b.Builtin_data.ident built_in_sync_repair_properties)
    |> Sqlite_create_graph.build_properties
    |> List.map Sqlite_create_graph.mark_block_as_built_in
  in
  let new_classes =
    Builtin_data.built_in_classes
    |> List.filter (fun (c : Builtin_data.builtin_class) ->
           List.mem c.Builtin_data.c_ident built_in_sync_repair_classes)
    |> (fun entries ->
        Sqlite_create_graph.build_initial_class_entries entries
          (List.map (fun p -> (p, [])) built_in_sync_repair_properties))
    |> List.map Sqlite_create_graph.mark_block_as_built_in
  in
  let new_class_idents : Block_map.t list =
    List.filter_map
      (fun (m : Block_map.t) ->
         match Block_map.attr_value m "db/ident" with
         | Some (Datascript.Keyword ident) ->
             Some [ ("db/ident", Datascript.Keyword ident) ]
         | _ -> None)
      new_classes
  in
  let items = new_class_idents @ new_properties @ new_classes in
  let block_count =
    List.length (List.filter (fun m -> Block_map.mem m "block/uuid") items)
  in
  (* cljs gen-n-keys on a fresh :max-key-atom *)
  let orders = Db_order.gen_n_keys ~max_key_atom:(ref None) block_count None None in
  let orders_ref = ref orders in
  List.map
    (fun m ->
       let m =
         stable_built_in_sync_repair_item
           (if Block_map.mem m "block/uuid" then
              match !orders_ref with
              | o :: tl -> orders_ref := tl; Some o
              | [] -> None
            else None)
           m
       in
       Wire.Map
         (List.map
            (fun (k, v) -> (Wire.Keyword k, Ds_wire.transit_of_value v))
            m))
    items

(* cljs db-core/enqueue-built-in-sync-repair! *)
let enqueue_built_in_sync_repair repo =
  match Sync_client_op.get_local_tx_entry repo built_in_sync_repair_tx_id with
  | Some _ -> ()
  | None ->
      let result =
        Sync_client_op.upsert_local_tx_entry repo
          ~tx_id:built_in_sync_repair_tx_id
          ~created_at:built_in_sync_repair_timestamp ~pending:true
          ~failed:false ~outliner_op:(Some "fix") ~undo_redo:(Some "none")
          ~forward_outliner_ops:[] ~inverse_outliner_ops:[]
          ~inferred_outliner_ops:false
          ~normalized_tx_data:(Wire.Array (built_in_sync_repair_tx_data ()))
          ~reversed_tx_data:(Wire.Array []) ()
      in
      if result.Sync_client_op.should_inc_pending then
        Sync_client_op.adjust_pending_local_tx_count repo 1

(* cljs db-core/maybe-enqueue-built-in-sync-repair! *)
let maybe_enqueue_built_in_sync_repair repo conn migrate_result
    initial_data_exists =
  if migrate_result = None && initial_data_exists then
    match
      Ldb.get_key_value (Datascript.db conn) "logseq.kv/graph-remote?"
    with
    | Some (Datascript.Bool true) -> enqueue_built_in_sync_repair repo
    | _ -> ()

(* cljs db-core/handle-migrate-result-local-txs! — each upgrade's
   tx-report is enqueued as a local tx. *)
let handle_migrate_result_local_txs repo (result : Db_migrate.migrate_result) =
  List.iter
    (fun report ->
       match report with
       | Some report -> Sync_apply.handle_local_tx repo report
       | None -> ())
    result.Db_migrate.upgrade_reports

let create_or_open_db args =
  match args with
  | Wire.String repo :: opts_rest ->
      let opts = match opts_rest with t :: _ -> t | [] -> Wire.Nil in
      let creating_remote_graph = opt_bool "creating-remote-graph?" false opts in
      let current =
        match Worker_state.state_get "git/current-repo" with
        | Some (Wire.String r) -> Some r
        | _ -> None
      in
      (match current with
       | Some c when Graph_dir.same_repo c repo -> ()
       | _ -> Worker_state.reset_deleted_blocks ());
      (* cljs <create-or-open-db!: seed local-tx for a freshly created
         remote graph (client-ops conn may already be open). *)
      (if creating_remote_graph && Sync_state.has_client_ops_conn repo
         && Sync_client_op.get_local_tx repo = None
       then Sync_client_op.update_local_tx repo 0);
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
           let db, created_sqlite =
             match Worker_state.sqlite_conn repo with
             | Some db -> (db, false)
             | None ->
                 let db =
                   Sqlite.open_db_pool ~name:(Graph_dir.pool_name repo)
                     ~path:
                       (if Sqlite.pooled_runtime () then "/db.sqlite"
                        else db_path repo)
                 in
                 (* cljs enable-sqlite-wal-mode! + the graph db's
                    wal_autocheckpoint=0 *)
                 Sqlite.exec db ~sql:"pragma locking_mode=exclusive" ~bind:[||];
                 Sqlite.exec db ~sql:"pragma journal_mode=WAL" ~bind:[||];
                 Sqlite.exec db ~sql:"pragma wal_autocheckpoint=0" ~bind:[||];
                 Worker_state.set_sqlite_conn repo db;
                 (db, true)
           in
           (* cljs get-dbs opens the client-ops sqlite beside the graph
              db — never under publishing ([db search-db nil nil]). *)
           if created_sqlite && not (Worker_state.publishing ()) then
             ignore (Sync_state.client_ops_conn repo);
           (* cljs get-dbs opens the :search sqlite inside the pool on every
              open so tx-listener upserts hit it immediately; cljs runs
              enable-sqlite-wal-mode! on it inside the when-not-sqlite-conn
              block together with the other dbs. *)
           (match Endpoint_search.get_search_db repo with
            | Some search_db when created_sqlite ->
                Sqlite.exec search_db ~sql:"pragma locking_mode=exclusive"
                  ~bind:[||];
                Sqlite.exec search_db ~sql:"pragma journal_mode=WAL" ~bind:[||]
            | _ -> ());
           let finish () : Wire.t Db_worker_effect.t =
             Graph_store.create_kvs_table db;
             let storage = Graph_store.storage db in
             let conn =
               match Datascript.restore_conn storage with
               | Some conn -> conn
               | None ->
                   (* cljs get-storage-conn always uses db-schema/schema *)
                   Datascript.create_conn ~schema:(Db_schema.schema ()) ~storage ()
             in
             (* cljs <create-or-open-db!: the datascript conn is registered
                before the initial transact so sync bookkeeping (local-tx
                seed, handle-local-tx!) can see it. *)
             Worker_state.set_datascript_conn repo conn;
             (* cljs db-fix/check-and-fix-schema! right after
                get-storage-conn, before datoms/initial-data *)
             Worker_db_fix.check_and_fix_schema conn;
             (* cljs bootstrap-transact! on the :datoms/:debug-transit-raw
                open-opts (CLI/node import path). *)
             let datoms =
               match Wire.get "debug-transit-raw" opts with
               | Some t -> Some (debug_transit_raw_to_datoms t)
               | None ->
                   (match Wire.get "datoms" opts with
                    | Some t -> Some (debug_transit_raw_to_datoms t)
                    | None -> None)
             in
             (match datoms with
              | Some ds -> bootstrap_datoms conn ds
              | None -> ());
             (* cljs: after client-op/ensure-sqlite-schema!, seed local-tx
                when creating a remote graph. *)
             (if creating_remote_graph && Sync_client_op.get_local_tx repo = None
              then Sync_client_op.update_local_tx repo 0);
             (* cljs ensure-client-ops-cleanup-timer! runs on every open. *)
             ensure_client_ops_cleanup_timer repo;
             (* cljs <create-or-open-db!: on a fresh graph (no initial data,
                not a sync-download, no imported datoms) transact
                build-db-initial-data; run db-migrate on every open. *)
             let sync_download = opt_bool "sync-download-graph?" false opts in
             let initial_data_exists =
               match datoms with
               | Some _ -> false
               | None ->
                   let db = Datascript.db conn in
                   (match Ldb.ent_of_ref db (Datascript.Ident "logseq.class/Root") with
                    | Some _ -> true
                    | None -> false)
                   && (match Ldb.ent_of_ref db (Datascript.Ident "logseq.kv/db-type") with
                       | Some e -> Ldb.value e "kv/value" = Some (Datascript.String "db")
                       | None -> false)
             in
             let initial_tx_report =
               if not
                   (initial_data_exists || Option.is_some datoms
                    || sync_download)
               then
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
                 Some
                   (Datascript.transact_conn conn tx
                      ~tx_meta:[ "initial-db?", Datascript.Bool true ])
               else None
             in
             (if not sync_download then begin
                (* cljs (if migrate-result (handle-migrate-result-local-txs!
                   ...) (maybe-enqueue-built-in-sync-repair! ...)) *)
                match Db_migrate.migrate conn with
                | Some result ->
                    handle_migrate_result_local_txs repo result
                | None ->
                    maybe_enqueue_built_in_sync_repair repo conn None
                      initial_data_exists
              end;
              Endpoint_transaction.maybe_run_recycle_gc conn);
             (* cljs (when initial-tx-report (db-sync/handle-local-tx! repo
                initial-tx-report)). *)
             (match initial_tx_report with
              | Some report -> Sync_apply.handle_local_tx repo report
              | None -> ());
             Db_listener.listen_db_changes repo conn;
             match Worker_state.datascript_conn repo with
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
                        ] ))
           in
           (* cljs get-dbs opens the vector index beside the search db
              when the platform exposes :vector :open-index (never under
              publishing). *)
           Db_worker_effect.bind
             (if created_sqlite && (not (Worker_state.publishing ()))
                && Embedding.enabled ()
              then
                Vector_index.open_index
                  ~path:
                    (if Sqlite.pooled_runtime () then "search/vector"
                     else Filename.concat (db_dir repo) "search/vector")
                  ~dimension:(Embedding.dimension ())
              else Db_worker_effect.pure None)
             (fun vector_index ->
                (match vector_index with
                 | Some index -> Worker_state.set_vector_index repo index
                 | None -> ());
                finish ()))))
  | _ -> invalid_arg "create-or-open-db expects (repo opts)"

let () = Dispatcher.register "thread-api/create-or-open-db" create_or_open_db

(* close-db-aux!: checkpoint + close every sqlite conn, close import
   state, clear the client-ops cleanup timer, drop all per-repo state.
   cljs db-core/close-db-aux! — each step is attempted independently
   and collected errors are thrown together at the end (AggregateError).
   On browser the cljs wal-checkpoint timer has no counterpart here;
   the OPFS pool pause/drop applies only on the pooled runtime. *)
let close_db_aux repo =
  let errors = ref [] in
  let attempt f = try f () with e -> errors := e :: !errors in
  let conns =
    List.filter_map
      (fun kind ->
         match Worker_state.sqlite_conn_of repo kind with
         | Some db -> Some (kind, db)
         | None -> None)
      [ Worker_state.Db; Worker_state.Search; Worker_state.Client_ops ]
  in
  List.iter
    (fun (_, db) ->
       attempt (fun () ->
           ignore
             (Sqlite.exec db ~sql:"PRAGMA wal_checkpoint(TRUNCATE)"
                ~bind:[||])))
    conns;
  (match Sync_state.client_ops_conn_opt repo with
   | Some db
     when not (List.exists (fun (_, d) -> d == db) conns) ->
       attempt (fun () ->
           ignore
             (Sqlite.exec db ~sql:"PRAGMA wal_checkpoint(TRUNCATE)"
                ~bind:[||]))
   | _ -> ());
  (* cljs attempt! invokes close-import-state-for-repo! without awaiting
     its promise — run the effect fire-and-forget; a sync throw is
     collected, an async rejection is not (as cljs). *)
  attempt (fun () ->
      Db_worker_effect.async (fun () ->
          Sync_download.close_import_state_for_repo repo));
  (match Hashtbl.find_opt client_ops_cleanup_timers repo with
   | Some timer ->
       Timers.clear timer;
       Hashtbl.remove client_ops_cleanup_timers repo
   | None -> ());
  List.iter
    (fun (kind, _) -> Worker_state.drop_sqlite_conn_of repo kind) conns;
  Worker_state.drop_vector_index repo;
  Worker_state.drop_datascript_conn repo;
  Worker_state.drop_pending_local_tx_count repo;
  Endpoint_search.clear_search_index_builds repo;
  List.iter (fun (_, db) -> attempt (fun () -> Sqlite.close db)) conns;
  attempt (fun () -> Sync_state.close_client_ops_conn repo);
  if Sqlite.pooled_runtime () then begin
    (* cljs attempt!s .pauseVfs and forgets the pool unconditionally *)
    attempt (fun () -> Sqlite.pause_vfs ~repo);
    Sqlite.drop_pool ~repo
  end;
  (match !errors with
   | [] -> ()
   | es ->
       failwith
         (Printf.sprintf "Graph resources failed to close: %s"
            (String.concat "; "
               (List.map Printexc.to_string (List.rev es)))))

let () = Worker_state.close_graph_resources_fn := close_db_aux

(* cljs sync-crypt/cancel-ui-requests! {:reason <r> :repo repo} *)
let cancel_ui_requests reason repo =
  let (_ : int) =
    Endpoint_state.cancel_ui_requests
      (Wire.Map
         [ (Wire.Keyword "reason", Wire.Keyword reason)
         ; (Wire.Keyword "repo", Wire.String repo) ])
  in
  ()

let close_db_handler reason args =
  let args =
    match args with
    | Wire.Nil :: rest -> Wire.String "" :: rest
    | _ -> args
  in
  match args with
  | Wire.String repo :: _ ->
      cancel_ui_requests reason repo;
      close_db_aux repo;
      Db_worker_effect.pure Wire.nil
  | _ -> invalid_arg "close-db expects repo"

let () =
  Dispatcher.register "thread-api/close-db" (close_db_handler "close-db")

(* :thread-api/db-sync-close-db [repo] — same as close-db, own reason. *)
let () =
  Dispatcher.register "thread-api/db-sync-close-db"
    (close_db_handler "db-sync-close-db")

(* :thread-api/unsafe-unlink-db [repo] — cancel requests, close, then
   delete the graph's storage file (node storage root). *)
let () =
  Dispatcher.register "thread-api/unsafe-unlink-db" (fun args ->
      let args =
        match args with
        | Wire.Nil :: rest -> Wire.String "" :: rest
        | _ -> args
      in
      match args with
      | Wire.String repo :: _ ->
          cancel_ui_requests "unsafe-unlink-db" repo;
          close_db_aux repo;
          (* cljs unsafe-unlink-db: pool.removeVfs on browser; node
             clears the repo dir's contents but keeps the dir itself —
             the graph-lifecycle admission check requires the graph dir
             to exist. *)
          (if Sqlite.pooled_runtime () then Sqlite.remove_vfs ~repo
           else
             Db_worker_effect.bind
               (File_sys.readdir (db_dir repo))
               (fun entries ->
                 Db_worker_effect.map
                   (fun _ -> ())
                   (Db_worker_effect.all
                      (List.map
                         (fun entry ->
                           File_sys.remove (Filename.concat (db_dir repo) entry))
                         entries))))
          |> Db_worker_effect.map (fun () -> Wire.nil)
      | _ -> invalid_arg "unsafe-unlink-db expects repo")

(* :thread-api/release-access-handles [repo] — closes any active import
   state and pauses the OPFS pool's access handles; node/native storage
   holds none. *)
let () =
  Dispatcher.register "thread-api/release-access-handles" (fun args ->
      let args =
        match args with
        | Wire.Nil :: rest -> Wire.String "" :: rest
        | _ -> args
      in
      match args with
      | Wire.String repo :: _ ->
          Db_worker_effect.bind
            (Sync_download.close_import_state_for_repo repo)
            (fun () ->
              if Sqlite.pooled_runtime () then Sqlite.pause_vfs ~repo;
              Db_worker_effect.pure Wire.nil)
      | _ -> invalid_arg "release-access-handles expects repo")

(* :thread-api/reset-db [repo db-transit] — handler/maintenance.cljs *)
let () =
  Dispatcher.register "thread-api/reset-db" (fun args ->
      let repo =
        match args with
        | Wire.String r :: _ -> r
        | Wire.Nil :: _ | [] -> ""
        | _ -> invalid_arg "repo arg"
      in
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

(* :thread-api/gc-graph [repo] — handler/maintenance.cljs: a missing or
   unopened repo resolves nil; the graph-last-gc-at tx goes through the
   worker pipeline like cljs ldb/transact!. *)
let () =
  Dispatcher.register "thread-api/gc-graph" (fun args ->
      let repo =
        match args with
        | Wire.String r :: _ -> r
        | _ -> ""
      in
      (match Worker_state.sqlite_conn repo, Worker_state.datascript_conn repo with
       | Some db, Some conn ->
           Worker_log.info "gc-sqlite-dbs"
             [ ("message", "gc current graph") ];
           Graph_gc.gc_kvs_table ~full_gc:true db;
           Sqlite.exec db ~sql:"VACUUM" ~bind:[||];
           ignore
             (Db_transact.transact conn
                [ Wire.Map
                    [ ( Wire.Keyword "db/ident"
                      , Wire.Keyword "logseq.kv/graph-last-gc-at" )
                    ; ( Wire.Keyword "kv/value"
                      , Wire.Int (int_of_float (Clock.now_ms ())) ) ] ]
                [ "skip-validate-db?", Datascript.Bool true
                ; "persist-op?", Datascript.Bool false ]);
           Db_worker_effect.pure Wire.nil
       | _ -> Db_worker_effect.pure Wire.nil))

(* :thread-api/backup-db-sqlite [repo dst-path] — sqlite backup to dst-path *)
let () =
  Dispatcher.register "thread-api/backup-db-sqlite" (fun args ->
      let repo =
        match args with
        | Wire.String r :: _ -> r
        | Wire.Nil :: _ | [] -> ""
        | _ -> invalid_arg "repo arg"
      in
      if repo = "" then Db_worker_effect.pure Wire.nil
      else
      (match Worker_state.sqlite_conn repo with
       | None ->
           (* cljs (throw (ex-info "graph not opened"
              {:code :graph-not-opened :repo repo})) *)
           Db_worker_effect.error
             (Dispatcher.Exn_info
                ( "graph not opened",
                  [ (Wire.Keyword "code", Wire.Keyword "graph-not-opened")
                  ; (Wire.Keyword "repo", Wire.String repo) ] ))
       | Some db ->
           (match Option.bind (List.nth_opt args 1) Wire.as_string with
            | Some dst ->
                (* cljs backup-db!: ensure-dir! dirname, checkpoint-db!,
                   then backup; resolves {:path dst-path}. *)
                if not (Sqlite.pooled_runtime ()) then
                  ignore (File_sys.mkdir_p (Filename.dirname dst));
                Sqlite.checkpoint db;
                (* cljs checks [:sqlite :backup-db] is a platform fn —
                   every runtime here implements Sqlite.backup. *)
                Sqlite.backup db ~dst_path:dst;
                Db_worker_effect.pure
                  (Wire.Map [ Wire.Keyword "path", Wire.String dst ])
            | None -> Db_worker_effect.pure Wire.nil)))
