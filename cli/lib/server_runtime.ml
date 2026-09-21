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

let env_db_worker_script_path () =
  match Sys.getenv_opt "LOGSEQ_DB_WORKER_NODE_SCRIPT" with
  | Some path when String.trim path <> "" -> Some path
  | _ -> None

let cli_entrypoint_path () =
  let argv = Cli_platform.argv () in
  if Array.length argv > 1 then Some argv.(1) else None

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

let lifecycle_error (err : Cli_unix.lifecycle_error) =
  let code =
    match err.code with
    | "graph-not-exists" -> Error.Graph_not_exists
    | "server-not-found" -> Error.Server_not_found
    | "server-owned-by-other" -> Error.Server_owned_by_other
    | "server-start-failed" -> Error.Server_start_failed
    | "server-stop-timeout" -> Error.Server_stop_timeout
    | _ -> Error.Server_cleanup_failed
  in
  Error.make code err.message

let invoke_config_of_server config server =
  {
    Transport.base_url = server.base_url;
    timeout_span = config.Cli_config.timeout_span;
    profile_session = config.profile_session;
  }

let ensure_runtime config repo ~create_empty_db =
  match resolve_script_path config with
  | Stdlib.Error err -> Cli_effect.pure (Stdlib.Error err)
  | Ok script ->
      Cli_unix.start_graph_runtime ~root_dir:(resolve_root_dir config)
        ~repo:(Cli_primitive.string_of_repo repo)
        ~script ~owner_source:"cli" ~create_empty_db
        ~generation:config.Cli_config.graph_generation
      |> Cli_effect.map (function
        | Stdlib.Error err -> Stdlib.Error (lifecycle_error err)
        | Ok body -> Ok (server_of_health ~fallback_port:0 body))

let start_server config repo ~create_empty_db =
  if Option.is_some config.Cli_config.base_url then
    Cli_effect.pure
      (Ok { repo; owner_source = config.owner_source; owned = false })
  else
    Profile_types.time config.Cli_config.profile_session "server.ensure-started"
      (fun () ->
        ensure_runtime config repo ~create_empty_db
        |> Cli_effect.map
             (Result.map (fun (server : server) ->
                  {
                    repo;
                    owner_source = server.owner_source;
                    owned = server.owned;
                  })))

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
      ensure_runtime config repo ~create_empty_db
      |> Cli_effect.map (Result.map (invoke_config_of_server config))

let stop_server config repo =
  if Option.is_some config.Cli_config.base_url then
    Cli_effect.pure (Ok { repo })
  else
    Cli_unix.stop_graph_runtime ~root_dir:(resolve_root_dir config)
      ~repo:(Cli_primitive.string_of_repo repo)
      ~owner_source:"cli"
    |> Cli_effect.map (function
      | Stdlib.Error err -> Stdlib.Error (lifecycle_error err)
      | Ok () -> Ok { repo })

let delete_graph config repo ~on_removed =
  Cli_unix.delete_graph ~root_dir:(resolve_root_dir config)
    ~repo:(Cli_primitive.string_of_repo repo) ~on_removed:(fun () ->
      on_removed ()
      |> Cli_effect.map
           (Result.map_error (fun (err : Error.t) ->
                {
                  Cli_unix.code = Error.code_to_string err.code;
                  message = err.message;
                })))
  |> Cli_effect.map (Result.map_error lifecycle_error)

let create_graph config repo =
  Cli_unix.create_graph ~root_dir:(resolve_root_dir config)
    ~repo:(Cli_primitive.string_of_repo repo)
  |> Cli_effect.map (Result.map_error lifecycle_error)

let restart_server config repo =
  stop_server config repo >>= function
  | Ok _ -> start_server config repo ~create_empty_db:false
  | Stdlib.Error err when err.code = Error.Server_not_found ->
      start_server config repo ~create_empty_db:false
  | Stdlib.Error err -> Cli_effect.pure (Stdlib.Error err)

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

let ignored_graph_dir name =
  name = "Unlinked graphs" || name = "backup"
  || starts_with ~prefix:"file-version-" name
  || starts_with ~prefix:"logseq_db_" name

let classify_graph_dir dir_name =
  if ignored_graph_dir dir_name then None
  else
    Graph_dir.canonical_graph_name_of_dir dir_name
    |> Option.map (fun graph_name ->
        {
          Graph_types.kind = Graph_types.Canonical;
          graph_name = Some (Cli_primitive.create_graph graph_name);
          graph_dir = Some dir_name;
          legacy_dir = None;
          target_graph_dir = None;
          conflict = false;
          reason = None;
        })

let list_graph_items config =
  let dir = graphs_dir config in
  if Cli_unix.file_exists dir then
    Cli_unix.readdir dir |> Vec.of_array
    |> Vec.filter (fun name -> Cli_unix.is_directory (Filename.concat dir name))
    |> Vec.sort_uniq String.compare
    |> Vec.filter_map classify_graph_dir
  else Vec.empty

let list_graphs config =
  list_graph_items config
  |> Vec.map (fun item -> Option.get item.Graph_types.graph_name)

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
