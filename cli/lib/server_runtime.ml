open Cli_effect.Infix

type server_status = Starting | Ready | Error | Unknown

type server = {
  repo : Cli_primitive.repo;
  graph : Cli_primitive.graph option;
  pid : Cli_primitive.pid;
  host : string;
  port : Cli_primitive.port;
  base_url : Cli_primitive.url;
  status : server_status;
  revision : string option;
  root_dir : Cli_primitive.path option;
  owner_source : Cli_primitive.owner_source;
  owned : bool;
  raw : Melange_edn_melange.any option;
}

type start_result = {
  repo : Cli_primitive.repo;
  owner_source : Cli_primitive.owner_source;
  owned : bool;
}

type stop_result = { repo : Cli_primitive.repo }
type revision_mismatch = { cli_revision : string; servers : server Rrbvec.t }

type cleanup_result = {
  cli_revision : string;
  checked : int;
  mismatched : int;
  eligible : int;
  skipped_owner : int;
  killed : server Rrbvec.t;
  failed : (server * Error.t) Rrbvec.t;
}

let resolve_root_dir config = config.Cli_config.root_dir
let graphs_dir config = Filename.concat (resolve_root_dir config) "graphs"

let lock_path ~root_dir repo =
  Filename.concat
    (Filename.concat
       (Filename.concat root_dir "graphs")
       (Graph_dir.graph_dir_name_of_repo repo))
    "db-worker.lock"

let env_db_worker_script_path () =
  match Sys.getenv_opt "LOGSEQ_DB_WORKER_NODE_SCRIPT" with
  | Some path when String.trim path <> "" -> Some path
  | _ -> None

let cli_entrypoint_path () =
  let argv = Cli_platform.argv () in
  if Array.length argv > 1 then Some argv.(1) else None

let parent_executable_path () =
  let argv = Cli_platform.argv () in
  if Array.length argv > 0 then argv.(0) else "node"

let cli_dir_db_worker_script_paths () =
  match cli_entrypoint_path () with
  | Some entrypoint ->
      let dir = Filename.dirname entrypoint in
      Vec.of_array
        [|
          Filename.concat dir "db-worker-node.js";
          Filename.concat (Filename.concat dir "js") "db-worker-node.js";
        |]
  | _ -> Vec.empty

let db_worker_runtime_script_path () =
  match env_db_worker_script_path () with
  | Some path -> path
  | None -> (
      match
        Vec.find_opt Cli_unix.file_exists (cli_dir_db_worker_script_paths ())
      with
      | Some path -> path
      | None -> "db-worker-node.js")

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let server_list_path config =
  Filename.concat (resolve_root_dir config) "server-list"

let repo_identity repo = Cli_config.repo_to_graph repo
let same_repo a b = repo_identity a = repo_identity b

let process_alive pid =
  try
    Cli_unix.kill pid 0;
    true
  with
  | Cli_unix.Cli_unix_error (Cli_unix.ESRCH, _, _) -> false
  | Cli_unix.Cli_unix_error (Cli_unix.EPERM, _, _) -> true

let http_request ~(method_ : Fetch.requestMethod) ~url ~headers ~body
    ~timeout_span =
  Cli_platform.HTTP.request ?timeout_span method_ url ~headers ~body
  >>= fun (response, body) -> Cli_effect.pure (response, body)

let http_success response =
  let status = Fetch.Response.status response in
  status >= 200 && status < 300

let http_health_response response =
  let status = Fetch.Response.status response in
  status = 200 || status = 503

let server_publish_timeout_span = Time.span_of_ms 30_000L
let server_ready_timeout_span = Time.span_of_ms 30_000L

let parse_server_list_line line =
  match Vec.split_on_char ' ' (String.trim line) |> Vec.filter (( <> ) "") with
  | values when Vec.length values = 2 -> (
      let pid = Vec.nth values 0 in
      let port = Vec.nth values 1 in
      match (int_of_string_opt pid, int_of_string_opt port) with
      | Some pid, Some port when pid > 0 && port > 0 -> Some (pid, port)
      | _ -> None)
  | _ -> None

let read_server_list path =
  if not (Cli_unix.file_exists path) then Vec.empty
  else
    Cli_unix.read_text_file path
    |> Vec.split_on_char '\n'
    |> Vec.filter_map parse_server_list_line

let status_of_string = function
  | "ready" -> Ready
  | "starting" -> Starting
  | "error" -> Error
  | _ -> Unknown

let owner_source_of_string = function
  | "cli" -> Cli_primitive.Cli
  | "electron" -> Electron
  | _ -> Unknown

let server_of_health ~fallback_port body =
  let raw = Json_util.value_of_json_string body in
  let repo =
    Edn_util.get_string raw "repo"
    |> Option.value ~default:"" |> Cli_primitive.create_repo
  in
  let host =
    Edn_util.get_string raw "host" |> Option.value ~default:"127.0.0.1"
  in
  let port =
    Edn_util.get_int raw "port" |> Option.value ~default:fallback_port
  in
  let pid = Edn_util.get_int raw "pid" |> Option.value ~default:0 in
  let status =
    Edn_util.get_string raw "status"
    |> Option.map status_of_string
    |> Option.value ~default:Unknown
  in
  let owner_source =
    Edn_util.get_string raw "owner-source"
    |> Option.map owner_source_of_string
    |> Option.value ~default:Cli_primitive.Unknown
  in
  {
    repo;
    graph = Some (Cli_config.repo_to_graph repo);
    pid;
    host;
    port;
    base_url = "http://" ^ host ^ ":" ^ string_of_int port;
    status;
    revision = Edn_util.get_string raw "revision";
    root_dir = Edn_util.get_string raw "root-dir";
    owner_source;
    owned = owner_source = Cli_primitive.Cli || owner_source = Unknown;
    raw = Some raw;
  }

let discover_server (_pid, port) =
  Cli_effect.catch
    (Cli_effect.map
       (fun (response, body) ->
         if http_health_response response then
           Some (server_of_health ~fallback_port:port body)
         else None)
       (http_request ~method_:Fetch.Get
          ~url:("http://127.0.0.1:" ^ string_of_int port ^ "/healthz")
          ~headers:(Vec.singleton ("Accept", "application/json"))
          ~body:""
          ~timeout_span:(Some (Time.span_of_ms 1_000L))))
    (fun _ -> Cli_effect.pure None)

let list_servers config =
  let entries =
    read_server_list (server_list_path config)
    |> Vec.filter (fun (pid, _) -> process_alive pid)
  in
  Cli_effect.map (Vec.filter_map Fun.id)
    (Cli_effect.all (Vec.map discover_server entries))

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || Cli_unix.file_exists path then
    ()
  else (
    mkdir_p (Filename.dirname path);
    Cli_unix.mkdir path 0o755)

let ensure_repo_dir config repo =
  let path =
    Filename.concat (graphs_dir config) (Graph_dir.graph_dir_name_of_repo repo)
  in
  try
    mkdir_p path;
    if not (Cli_unix.is_directory path) then
      Stdlib.Error
        (Error.make Error.Root_dir_permission
           ("graph-dir is not a directory: " ^ path))
    else Stdlib.Ok path
  with exn ->
    Stdlib.Error
      (Error.make Error.Root_dir_permission
         ("graph-dir is not readable/writable: " ^ path ^ " ("
        ^ Printexc.to_string exn ^ ")"))

let script_candidates config =
  let project_dir = config.Cli_config.project_dir in
  let project_candidates =
    match project_dir with
    | None -> Vec.empty
    | Some dir ->
        Vec.of_array
          [|
            Filename.concat (Filename.concat dir "static") "db-worker-node.js";
            Filename.concat (Filename.concat dir "dist") "db-worker-node.js";
            Filename.concat
              (Filename.concat (Filename.concat dir "static") "js")
              "db-worker-node.js";
          |]
  in
  Vec.filter_map Fun.id (Vec.singleton (env_db_worker_script_path ()))
  |> fun candidates ->
  Vec.append candidates (cli_dir_db_worker_script_paths ()) |> fun candidates ->
  Vec.push_back candidates "db-worker-node.js" |> fun candidates ->
  Vec.append candidates project_candidates

let resolve_script_path config =
  let candidates = script_candidates config in
  match Vec.find_opt Cli_unix.file_exists candidates with
  | Some path -> Stdlib.Ok path
  | None ->
      Stdlib.Error
        (Error.make
           ~context:
             (Edn_util.vector_vec
                (candidates |> Vec.map (fun path -> Edn_util.string path)))
           Error.Server_script_missing
           ("db-worker script is missing. Checked paths: "
           ^ Vec.string_concat ", " candidates))

let env_with_node_runtime () =
  let without_key key =
    Cli_unix.environment () |> Vec.of_array
    |> Vec.filter (fun entry ->
        let prefix = key ^ "=" in
        not (starts_with ~prefix entry))
  in
  Vec.push_front (without_key "ELECTRON_RUN_AS_NODE") "ELECTRON_RUN_AS_NODE=1"
  |> Vec.to_array

let db_worker_spawn_args ~executable ~script ~root_dir ~repo ~owner_source
    ~create_empty_db =
  let repo = Cli_primitive.string_of_repo repo in
  let args =
    Vec.of_array
      [|
        executable;
        script;
        "--repo";
        repo;
        "--root-dir";
        root_dir;
        "--owner-source";
        owner_source;
      |]
  in
  if create_empty_db then Vec.push_back args "--create-empty-db" else args

let shell_quote value =
  let rec needs_quote i =
    i < String.length value
    &&
    match value.[i] with
    | ' ' | '\t' | '\n' | '\'' | '"' | '\\' -> true
    | _ -> needs_quote (i + 1)
  in
  if value <> "" && not (needs_quote 0) then value
  else "'" ^ Vec.string_concat "'\\''" (Vec.split_on_char '\'' value) ^ "'"

let db_worker_command_line ~script ~root_dir ~repo ~owner_source
    ~create_empty_db =
  let executable = parent_executable_path () in
  Vec.push_front
    (db_worker_spawn_args ~executable ~script ~root_dir ~repo ~owner_source
       ~create_empty_db)
    "ELECTRON_RUN_AS_NODE=1"
  |> Vec.map shell_quote |> Vec.string_concat " "

let spawn_server_process ~script ~root_dir ~repo ~owner_source ~create_empty_db
    =
  let devnull =
    Cli_unix.openfile "/dev/null" (Vec.singleton Cli_unix.O_RDWR) 0
  in
  Fun.protect
    ~finally:(fun () -> Cli_unix.close devnull)
    (fun () ->
      let executable = parent_executable_path () in
      let argv =
        db_worker_spawn_args ~executable ~script ~root_dir ~repo ~owner_source
          ~create_empty_db
        |> Vec.to_array
      in
      ignore
        (Cli_unix.create_process_env executable argv (env_with_node_runtime ())
           devnull devnull devnull))

let find_repo_server config repo =
  Cli_effect.map
    (Vec.find_opt (fun (server : server) -> same_repo server.repo repo))
    (list_servers config)

let invoke_config_of_server config server =
  {
    Transport.base_url = server.base_url;
    timeout_span = config.Cli_config.timeout_span;
    profile_session = config.profile_session;
  }

let wait_until_effect ?(timeout_span = Time.span_of_ms 8_000L)
    ?(interval_span = Time.span_of_ms 50L) predicate =
  let open Cli_effect in
  let deadline =
    Option.value
      (Time.add_span (Time.now ()) timeout_span)
      ~default:Time.max_time
  in
  let rec loop () =
    bind (predicate ()) (function
      | Some _ as result -> pure result
      | None ->
          if Time.compare_time (Time.now ()) deadline >= 0 then pure None
          else bind (sleep interval_span) (fun () -> loop ()))
  in
  loop ()

let wait_for_lock path =
  wait_until_effect (fun () ->
      Cli_effect.pure (if Cli_unix.file_exists path then Some () else None))

let wait_for_ready config repo =
  wait_until_effect ~timeout_span:server_ready_timeout_span (fun () ->
      Cli_effect.map
        (function
          | Some ({ status = Ready; _ } as server) -> Some server | _ -> None)
        (find_repo_server config repo))

let read_lock_pid path =
  if not (Cli_unix.file_exists path) then None
  else
    try
      Cli_unix.read_text_file path |> Json_util.value_of_json_string
      |> fun raw -> Edn_util.get_int raw "pid"
    with _ -> None

let live_lock path =
  match read_lock_pid path with Some pid -> process_alive pid | None -> false

let owner_manageable = function
  | Cli_primitive.Cli | Cli_primitive.Unknown -> true
  | _ -> false

let start_result_of_server repo (server : server) =
  { repo; owner_source = server.owner_source; owned = server.owned }

let wait_for_published_ready time config repo =
  let open Cli_effect in
  bind
    (time "server.wait-publish" (fun () ->
         wait_until_effect ~timeout_span:server_publish_timeout_span (fun () ->
             find_repo_server config repo)))
    (function
      | None ->
          pure
            (Stdlib.Error
               (Error.make Error.Server_start_failed
                  "db-worker-node failed to publish health"))
      | Some _ ->
          bind
            (time "server.wait-ready" (fun () -> wait_for_ready config repo))
            (function
              | Some server ->
                  pure (Stdlib.Ok (start_result_of_server repo server))
              | None ->
                  pure
                    (Stdlib.Error
                       (Error.make Error.Server_start_failed
                          "db-worker-node failed to start"))))

let start_server_unprofiled config repo ~create_empty_db =
  let open Cli_effect in
  let time stage f =
    Profile_types.time config.Cli_config.profile_session stage f
  in
  bind (find_repo_server config repo) (function
    | Some ({ status = Ready; _ } as server) ->
        pure (Stdlib.Ok (start_result_of_server repo server))
    | Some _ -> wait_for_published_ready time config repo
    | None when Option.is_some config.Cli_config.base_url ->
        pure
          (Stdlib.Ok { repo; owner_source = config.owner_source; owned = false })
    | None -> (
        match ensure_repo_dir config repo with
        | Stdlib.Error err -> pure (Stdlib.Error err)
        | Stdlib.Ok _ -> (
            let lock = lock_path ~root_dir:(resolve_root_dir config) repo in
            if live_lock lock then wait_for_published_ready time config repo
            else
              match resolve_script_path config with
              | Stdlib.Error err -> pure (Stdlib.Error err)
              | Stdlib.Ok script -> (
                  try
                    bind
                      (time "server.spawn-daemon" (fun () ->
                           spawn_server_process ~script
                             ~root_dir:(resolve_root_dir config) ~repo
                             ~owner_source:"cli" ~create_empty_db;
                           pure ()))
                      (fun () ->
                        bind
                          (time "server.wait-lock" (fun () ->
                               wait_for_lock lock))
                          (function
                            | None ->
                                pure
                                  (Stdlib.Error
                                     (Error.make
                                        Error.Server_start_timeout_orphan
                                        ("db-worker-node failed to start. \
                                          Command: "
                                        ^ db_worker_command_line ~script
                                            ~root_dir:(resolve_root_dir config)
                                            ~repo ~owner_source:"cli"
                                            ~create_empty_db)))
                            | Some () ->
                                wait_for_published_ready time config repo))
                  with exn ->
                    pure
                      (Stdlib.Error
                         (Error.make Error.Server_start_failed
                            ("failed to spawn db-worker-node: "
                           ^ Printexc.to_string exn)))))))

let start_server config repo ~create_empty_db =
  Profile_types.time config.Cli_config.profile_session "server.ensure-started"
    (fun () -> start_server_unprofiled config repo ~create_empty_db)

let ensure_server config repo ~create_empty_db =
  match config.Cli_config.base_url with
  | Some base_url ->
      Cli_effect.pure
        (Ok
           {
             Transport.base_url;
             timeout_span = config.timeout_span;
             profile_session = config.profile_session;
           })
  | None ->
      let open Cli_effect in
      bind (find_repo_server config repo) (function
        | Some ({ status = Ready; _ } as server) ->
            pure (Ok (invoke_config_of_server config server))
        | Some _ ->
            bind (wait_for_ready config repo) (function
              | Some server -> pure (Ok (invoke_config_of_server config server))
              | None ->
                  pure
                    (Stdlib.Error
                       (Error.make Error.Server_start_failed
                          "db-worker-node failed to start")))
        | None ->
            bind (start_server config repo ~create_empty_db) (function
              | Stdlib.Error err -> pure (Stdlib.Error err)
              | Stdlib.Ok _ ->
                  bind (wait_for_ready config repo) (function
                    | Some server ->
                        pure (Ok (invoke_config_of_server config server))
                    | None ->
                        pure
                          (Stdlib.Error
                             (Error.make Error.Server_start_failed
                                "db-worker-node failed to publish health")))))

let shutdown_server server =
  Cli_effect.catch
    (Cli_effect.map
       (fun (response, _body) -> http_success response)
       (http_request ~method_:Fetch.Post
          ~url:(server.base_url ^ "/v1/shutdown")
          ~headers:(Vec.singleton ("Content-Type", "application/json"))
          ~body:"{}"
          ~timeout_span:(Some (Time.span_of_ms 1_000L))))
    (fun _ -> Cli_effect.pure false)

let stop_server config repo =
  let open Cli_effect in
  bind (find_repo_server config repo) (function
    | None when Option.is_some config.Cli_config.base_url ->
        pure (Stdlib.Ok { repo })
    | None ->
        pure
          (Stdlib.Error
             (Error.make Error.Server_not_found "server is not running"))
    | Some server ->
        if not (owner_manageable server.owner_source) then
          pure
            (Stdlib.Error
               (Error.make Error.Server_owned_by_other
                  "server is owned by another process"))
        else
          let shutdown_timeout_span = Time.span_of_ms 5_000L in
          let shutdown_interval_span = Time.span_of_ms 200L in
          let kill_timeout_span = Time.span_of_ms 1_000L in
          let kill_interval_span = Time.span_of_ms 100L in
          bind (shutdown_server server) (fun _ ->
              bind
                (wait_until_effect ~timeout_span:shutdown_timeout_span
                   ~interval_span:shutdown_interval_span (fun () ->
                     map
                       (function None -> Some () | Some _ -> None)
                       (find_repo_server config repo)))
                (function
                  | Some () -> pure (Stdlib.Ok { repo })
                  | None ->
                      (try
                         if process_alive server.pid then
                           Cli_unix.kill server.pid Sys.sigterm
                       with _ -> ());
                      bind
                        (wait_until_effect ~timeout_span:kill_timeout_span
                           ~interval_span:kill_interval_span (fun () ->
                             map
                               (function None -> Some () | Some _ -> None)
                               (find_repo_server config repo)))
                        (function
                          | Some () -> pure (Stdlib.Ok { repo })
                          | None ->
                              pure
                                (Stdlib.Error
                                   (Error.make Error.Server_stop_timeout
                                      "timed out stopping server"))))))

let restart_server config repo =
  stop_server config repo >>= function
  | Stdlib.Ok _ -> start_server config repo ~create_empty_db:false
  | Stdlib.Error err when err.code = Error.Server_not_found ->
      start_server config repo ~create_empty_db:false
  | Stdlib.Error err -> Cli_effect.pure (Stdlib.Error err)

let ignored_graph_dir name =
  name = "Unlinked graphs" || name = "backup"
  || starts_with ~prefix:"file-version-" name
  || starts_with ~prefix:"logseq_db_" name

let contains_substring ~needle text =
  let needle_len = String.length needle in
  let text_len = String.length text in
  let rec loop index =
    index + needle_len <= text_len
    && (String.sub text index needle_len = needle || loop (index + 1))
  in
  needle_len = 0 || loop 0

let legacy_derivation_signal dir_name =
  contains_substring ~needle:"++" dir_name
  || contains_substring ~needle:"+3A+" dir_name
  || contains_substring ~needle:"%" dir_name

let decode_legacy_graph_dir_name dir_name =
  if not (legacy_derivation_signal dir_name) then None
  else Graph_dir.decode_legacy_graph_dir_name dir_name

let canonical_graph_name graph =
  if graph <> "" && not (starts_with ~prefix:"logseq_db_" graph) then Some graph
  else None

let classify_graph_dir graphs_root dir_name =
  if ignored_graph_dir dir_name then None
  else
    match
      Option.bind
        (Graph_dir.canonical_graph_name_of_dir dir_name)
        canonical_graph_name
    with
    | Some graph_name ->
        Some
          {
            Graph_types.kind = Graph_types.Canonical;
            graph_name = Some (Cli_primitive.create_graph graph_name);
            graph_dir = Some dir_name;
            legacy_dir = None;
            target_graph_dir = None;
            conflict = false;
            reason = None;
          }
    | None -> (
        match
          Option.bind
            (decode_legacy_graph_dir_name dir_name)
            canonical_graph_name
        with
        | Some graph_name ->
            let target_graph_dir = Graph_dir.encode_graph_dir_name graph_name in
            Some
              {
                Graph_types.kind = Graph_types.Legacy;
                graph_name = Some (Cli_primitive.create_graph graph_name);
                graph_dir = None;
                legacy_dir = Some dir_name;
                target_graph_dir = Some target_graph_dir;
                conflict =
                  target_graph_dir <> dir_name
                  && Cli_unix.file_exists
                       (Filename.concat graphs_root target_graph_dir);
                reason = None;
              }
        | None ->
            if legacy_derivation_signal dir_name then
              Some
                {
                  Graph_types.kind = Graph_types.Legacy_undecodable;
                  graph_name = None;
                  graph_dir = None;
                  legacy_dir = Some dir_name;
                  target_graph_dir = None;
                  conflict = false;
                  reason = Some (Edn_util.keyword_t "graph-name-not-derivable");
                }
            else None)

let list_graph_items config =
  let dir = graphs_dir config in
  if Cli_unix.file_exists dir then
    Cli_unix.readdir dir |> Vec.of_array
    |> Vec.filter (fun name -> Cli_unix.is_directory (Filename.concat dir name))
    |> Vec.sort_uniq String.compare
    |> Vec.filter_map (classify_graph_dir dir)
  else Vec.empty

let list_graphs config =
  list_graph_items config
  |> Vec.filter_map (function
    | { Graph_types.kind = Graph_types.Canonical; graph_name = Some graph; _ }
      ->
        Some graph
    | _ -> None)

let revision_matches cli_revision server =
  match server.revision with
  | Some revision -> String.equal revision cli_revision
  | None -> false

let cleanup_revision_mismatched_servers config ~cli_revision =
  let open Cli_effect in
  bind (list_servers config) (fun servers ->
      let mismatched =
        Vec.filter
          (fun server -> not (revision_matches cli_revision server))
          servers
      in
      let eligible, skipped =
        Vec.partition
          (fun (server : server) -> server.owner_source = Cli_primitive.Cli)
          mismatched
      in
      let rec stop_loop killed failed targets =
        match Vec.pop_front targets with
        | None ->
            pure
              (Ok
                 {
                   cli_revision;
                   checked = Vec.length servers;
                   mismatched = Vec.length mismatched;
                   eligible = Vec.length eligible;
                   skipped_owner = Vec.length skipped;
                   killed;
                   failed;
                 })
        | Some (server, rest) ->
            bind (shutdown_server server) (fun stopped ->
                if stopped then
                  stop_loop (Vec.push_back killed server) failed rest
                else
                  stop_loop killed
                    (Vec.push_back failed
                       ( server,
                         Error.make Error.Server_cleanup_failed
                           "failed to stop revision-mismatched server" ))
                    rest)
      in
      stop_loop Vec.empty Vec.empty eligible)
