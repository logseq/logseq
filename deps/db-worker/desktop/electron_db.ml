(* Port of electron.db — db file backup/export helpers and the
   hourly auto-backup timer that runs them per active window. *)

module Fs_extra = struct
  external ensure_dir_sync : string -> unit = "ensureDirSync"
    [@@mel.module "fs-extra"]

  (* readFileSync without an encoding returns a Buffer; callers of
     get-db only need the opaque value. *)
  external read_file_buffer : string -> Js.Json.t = "readFileSync"
    [@@mel.module "fs-extra"]
end

external promise_error_as_exn : Js.Promise.error -> exn = "%identity"

let backup_interval_ms = 60 * 60 * 1000
let automatic_backup_keep_versions = 12

(* {:window->repo {} :interval-id nil} *)
type auto_backup_state =
  { window_repo : (int, string) Hashtbl.t
  ; mutable interval_id : Timers.timer option
  }

let auto_backup : auto_backup_state =
  { window_repo = Hashtbl.create 8; interval_id = None }

let ensure_graphs_dir () : unit =
  Fs_extra.ensure_dir_sync (Common_graph.get_db_graphs_dir ())

let ensure_graph_dir (db_name : string) : string =
  ensure_graphs_dir ();
  let dir_name =
    match Graph_dir.repo_to_encoded_graph_dir_name db_name with
    | Some name -> name
    | None ->
        invalid_arg
          ("Electron_db.ensure_graph_dir: cannot encode repo " ^ db_name)
  in
  let graph_dir =
    Node.Path.join [| Common_graph.get_db_graphs_dir (); dir_name |]
  in
  Fs_extra.ensure_dir_sync graph_dir;
  graph_dir

let get_db (db_name : string) : Js.Json.t option =
  ignore (ensure_graph_dir db_name);
  let _graph_dir_name, db_path =
    Common_sqlite.get_db_full_path (Common_graph.get_db_graphs_dir ())
      db_name
  in
  if Node.Fs.existsSync db_path then Some (Fs_extra.read_file_buffer db_path)
  else None

(* opts arrive from JS callers as an object; cljs reads :force-backup? *)
let opts_force_backup (opts : Js.Json.t) : bool =
  match Js.Json.classify opts with
  | Js.Json.JSONObject dict -> (
      match Js.Dict.get dict "force-backup?" with
      | Some v -> Option.value (Js.Json.decodeBoolean v) ~default:false
      | None -> false)
  | _ -> false

(* backup-source — :electron-manual when :force-backup? else
   :electron-auto *)
let backup_source (opts : Js.Json.t) : string =
  if opts_force_backup opts then "electron-manual" else "electron-auto"

(* <create-graph-backup! *)
let create_graph_backup ~(db_name : string) ~(opts : Js.Json.t)
    ~(snapshot : string -> unit Js.Promise.t)
    : Graph_backup.backup_result Js.Promise.t =
  ignore (ensure_graph_dir db_name);
  let source = backup_source opts in
  Graph_backup.create_backup
    { Graph_backup.graphs_dir = Common_graph.get_db_graphs_dir ()
    ; repo = db_name
    ; backup_name = Graph_backup.build_backup_name db_name None
    ; source
    ; snapshot
    ; now_ms = None
    ; keep_versions =
        (if String.equal source "electron-auto" then
           Some automatic_backup_keep_versions
         else None)
    ; throttle_ms =
        (if String.equal source "electron-auto" then
           Some backup_interval_ms
         else None)
    }

(* backup-db-with-sqlite-backup! *)
let backup_db_with_sqlite_backup ~(db_name : string)
    ~(force_backup : bool)
    ~(sqlite_backup : src_path:string -> dst_path:string -> unit Js.Promise.t)
    () : Graph_backup.backup_result Js.Promise.t =
  let _graph_dir_name, db_path =
    Common_sqlite.get_db_full_path (Common_graph.get_db_graphs_dir ())
      db_name
  in
  let opts =
    Js.Json.object_
      (let d = Js.Dict.empty () in
       Js.Dict.set d "force-backup?" (Js.Json.boolean force_backup);
       d)
  in
  create_graph_backup ~db_name ~opts ~snapshot:(fun dst_path ->
      sqlite_backup ~src_path:db_path ~dst_path)

(* backup-db! *)
let backup_db ~(db_name : string) ~(opts : Js.Json.t)
    : Graph_backup.backup_result Js.Promise.t =
  backup_db_with_sqlite_backup ~db_name
    ~force_backup:(opts_force_backup opts)
    ~sqlite_backup:(fun ~src_path ~dst_path ->
      Cli_server.promise_of_task
        (Sqlite_backup.backup_db_file ~src_path ~dst_path))
    ()

(* runtime -> cli-transport config *)
let transport_config_of_runtime (runtime : Electron_db_worker.runtime)
    : Cli_transport.config =
  { Cli_transport.base_url = runtime.Electron_db_worker.base_url
  ; timeout_ms = None
  ; profile_session = None
  }

(* backup-db-via-worker! *)
let backup_db_via_worker ~(db_name : string) ~(window_id : int)
    ~(opts : Js.Json.t) : Graph_backup.backup_result Js.Promise.t =
  create_graph_backup ~db_name ~opts ~snapshot:(fun dst_path ->
      Js.Promise.then_
        (fun runtime ->
          Cli_transport.invoke
            (transport_config_of_runtime runtime)
            "thread-api/backup-db-sqlite"
            [| Datascript.String db_name; Datascript.String dst_path |]
          |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()))
        (Electron_db_worker.ensure_worker db_name window_id ()))

(* export-db-via-worker! *)
let export_db_via_worker ~(db_name : string) ~(window_id : int)
    ~(dst_path : string) : Datascript.value Js.Promise.t =
  ignore (ensure_graph_dir db_name);
  Fs_extra.ensure_dir_sync (Node.Path.dirname dst_path);
  Js.Promise.then_
    (fun runtime ->
      Cli_transport.invoke
        (transport_config_of_runtime runtime)
        "thread-api/backup-db-sqlite"
        [| Datascript.String db_name; Datascript.String dst_path |])
    (Electron_db_worker.ensure_worker db_name window_id ())

(* export-db-to-export-dir-via-worker! *)
let export_db_to_export_dir_via_worker ~(db_name : string)
    ~(window_id : int) ~(filename : string)
    : Datascript.value Js.Promise.t =
  let export_dir = Node.Path.join [| ensure_graph_dir db_name; "export" |] in
  let dst_path =
    Node.Path.join [| export_dir; Node.Path.basename filename |]
  in
  Js.Promise.then_
    (fun result ->
      Js.Promise.resolve
        (Clj_value.map_assoc result "path" (Datascript.String dst_path)))
    (export_db_via_worker ~db_name ~window_id ~dst_path)

(* active-repo-window-ids — repo -> first window-id *)
let active_repo_window_ids () : (string * int) list =
  let by_repo = Hashtbl.create 8 in
  Hashtbl.iter
    (fun window_id repo ->
      if repo <> "" then
        match Hashtbl.find_opt by_repo repo with
        | Some _ -> ()
        | None -> Hashtbl.replace by_repo repo window_id)
    auto_backup.window_repo;
  Hashtbl.fold (fun repo window_id acc -> (repo, window_id) :: acc)
    by_repo []

let run_auto_backup () : unit array Js.Promise.t =
  Js.Promise.all
    (Array.of_list
       (List.map
          (fun (repo, window_id) ->
            Js.Promise.catch
              (fun error ->
                Electron_logger.warn_args
                  [| Js.Json.string "electron/auto-db-backup-failed"
                   ; Js.Json.string "repo"
                   ; Js.Json.string repo
                   ; Js.Json.string "error"
                   ; Js.Json.string
                       (Electron_configs.exn_message
                          (promise_error_as_exn error))
                  |];
                Js.Promise.resolve ())
              (Js.Promise.then_
                 (fun _ -> Js.Promise.resolve ())
                 (backup_db_via_worker ~db_name:repo ~window_id
                    ~opts:(Js.Json.object_ (Js.Dict.empty ())))))
          (active_repo_window_ids ())))

let reconcile_auto_backup_timer () : unit =
  let has_repos = active_repo_window_ids () <> [] in
  match has_repos, auto_backup.interval_id with
  | true, None ->
      auto_backup.interval_id <-
        Some
          (Timers.set_interval backup_interval_ms (fun () ->
               ignore (run_auto_backup ())))
  | false, Some id ->
      Timers.clear id;
      auto_backup.interval_id <- None
  | _ -> ()

let sync_auto_backup_repo (window_id : int) (repo : string option)
    : unit =
  (match repo with
   | Some repo when repo <> "" ->
       Hashtbl.replace auto_backup.window_repo window_id repo
   | _ -> Hashtbl.remove auto_backup.window_repo window_id);
  reconcile_auto_backup_timer ()

let reset_auto_backup () : unit =
  (match auto_backup.interval_id with
   | Some id -> Timers.clear id
   | None -> ());
  Hashtbl.reset auto_backup.window_repo;
  auto_backup.interval_id <- None
