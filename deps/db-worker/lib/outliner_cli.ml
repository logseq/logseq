(* logseq.outliner.cli — node-only CLI helpers: classpath lookup,
   config.edn merge, git sha, init-conn. *)

open Datascript

let find_on_classpath (classpath : string) (rel_path : string)
    : string option Db_worker_effect.t =
  let dirs = String.split_on_char ':' classpath in
  let rec go = function
    | [] -> Db_worker_effect.pure None
    | dir :: rest ->
        let f = Filename.concat dir rel_path in
        Db_worker_effect.bind (File_sys.exists f) (fun yes ->
            if yes then Db_worker_effect.pure (Some f) else go rest)
  in
  go dirs

(* cljs pretty-print-merge — merge a map into an EDN string preserving
   whitespace. Entries are (bare-key, EDN-value-text) pairs. *)
let pretty_print_merge (s : string) (m : (string * string) list) : string =
  List.fold_left (fun acc (k, v) -> Rewrite_edn.assoc acc k v) s m

let get_git_sha () : string option =
  match Node_process.spawn_stdout "git" [ "rev-parse"; "--short"; "HEAD" ] with
  | Some (0, out) ->
      let s = Unicode.trim out in
      if s = "" then None else Some s
  | _ -> None

type init_opts =
  { additional_config : (string * string) list option
  ; classpath : string option
  ; import_type : value
  }

(* cljs setup-init-data — same seed as frontend.handler.repo/create-db *)
let setup_init_data (conn : conn) (opts : init_opts)
    : unit Db_worker_effect.t =
  let config_path () =
    match opts.classpath with
    | None -> Db_worker_effect.pure None
    | Some cp -> find_on_classpath cp "templates/config.edn"
  in
  Db_worker_effect.bind (config_path ()) (fun found ->
      Db_worker_effect.bind
        (match found with
         | Some f -> File_sys.read_text f
         | None ->
             Node_console.log
               "Setting graph's config to empty since no \
                templates/config.edn was found.";
             Db_worker_effect.pure "{}")
        (fun config_content ->
           let config_content =
             match opts.additional_config with
             | Some m -> pretty_print_merge config_content m
             | None -> config_content
           in
           let git_sha = get_git_sha () in
           let tx_ops =
             Sqlite_create_graph.initial_tx_data
               ~db:(Datascript.db conn) ~config_content
               ~import_type:opts.import_type ?graph_git_sha:git_sha ()
           in
           ignore (Db_tx.transact conn tx_ops);
           Db_worker_effect.pure ()))

(* cljs get-db-full-path — [graph-dir-name db.sqlite-path] *)
let get_db_full_path (graphs_dir : string) (db_name : string)
    : string * string =
  match Graph_dir.repo_to_encoded_graph_dir_name db_name with
  | Some graph_dir_name ->
      let graph_dir = Filename.concat graphs_dir graph_dir_name in
      (graph_dir_name, Filename.concat graph_dir "db.sqlite")
  | None -> invalid_arg ("invalid db-name: " ^ db_name)

(* cljs open-sqlite-datascript! — {:sqlite :conn} minus the sqlite
   handle (callers only use the conn, same as open-db!). *)
let open_sqlite_datascript (graphs_dir : string option) (db_name : string)
    : conn =
  let db_full_path =
    match graphs_dir with
    | None -> db_name
    | Some dir -> snd (get_db_full_path dir db_name)
  in
  let db = Sqlite.open_db ~path:db_full_path in
  Graph_store.create_kvs_table db;
  let storage = Graph_store.storage db in
  match Datascript.restore_conn storage with
  | Some conn -> conn
  | None -> Datascript.create_conn ~schema:(Db_schema.schema ()) ~storage ()

(* cljs open-db! *)
let open_db (graphs_dir : string option) (db_name : string) : conn =
  open_sqlite_datascript graphs_dir db_name

(* cljs init-conn — [& args*] where a trailing opts map is split off.
   Here args are 1 (db-full-path) or 2 (graphs-dir db-name) strings and
   opts is a record. *)
let init_conn ~(args : string list) ?(opts : init_opts option) ()
    : conn Db_worker_effect.t =
  let opts =
    Option.value opts
      ~default:
        { additional_config = None
        ; classpath = None
        ; import_type = Keyword "cli/default"
        }
  in
  (* Only mkdir when a dir and db-name are passed *)
  let mkdir =
    match args with
    | [ dir; name ] -> File_sys.mkdir_p (Filename.concat dir name)
    | _ -> Db_worker_effect.pure ()
  in
  Db_worker_effect.bind mkdir (fun () ->
      let conn =
        match args with
        | [ db_full_path ] -> open_db None db_full_path
        | [ graphs_dir; db_name ] -> open_db (Some graphs_dir) db_name
        | _ ->
            invalid_arg
              "init_conn expects a db-full-path or graphs-dir + db-name"
      in
      Outliner_db_pipeline.add_listener conn;
      Db_worker_effect.map (fun () -> conn) (setup_init_data conn opts))

(* cljs build-blocks-tx alias *)
let build_blocks_tx = Sqlite_build.build_blocks_tx
