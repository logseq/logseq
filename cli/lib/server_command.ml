type parsed =
  | Parsed_list
  | Parsed_cleanup
  | Parsed_start
  | Parsed_stop
  | Parsed_restart

type action =
  | Server_list
  | Server_cleanup
  | Server_start of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }
  | Server_stop of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }
  | Server_restart of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }

let command_id = function
  | Parsed_list -> Command_id.Server_list
  | Parsed_cleanup -> Server_cleanup
  | Parsed_start -> Server_start
  | Parsed_stop -> Server_stop
  | Parsed_restart -> Server_restart

let validate_parsed _ = Ok ()

let action_with_repo config make message =
  match config.Cli_config.repo with
  | Some repo -> Ok (make repo (Cli_config.repo_to_graph repo))
  | None -> Error (Error.missing_repo message)

let build ?registry:_ config _globals = function
  | Parsed_list -> Ok Server_list
  | Parsed_cleanup -> Ok Server_cleanup
  | Parsed_start ->
      action_with_repo config
        (fun repo graph -> Server_start { repo; graph })
        "repo is required for server start"
  | Parsed_stop ->
      action_with_repo config
        (fun repo graph -> Server_stop { repo; graph })
        "repo is required for server stop"
  | Parsed_restart ->
      action_with_repo config
        (fun repo graph -> Server_restart { repo; graph })
        "repo is required for server restart"

let status_value = function
  | Server_runtime.Starting -> Edn_util.string "starting"
  | Ready -> Edn_util.string "ready"
  | Error -> Edn_util.string "error"
  | Unknown -> Edn_util.string "unknown"

let owner_source_value source =
  Edn_util.string (Cli_primitive.string_of_owner_source source)

let optional_string key = function
  | Some value -> [ (Edn_util.keyword key, Edn_util.string value) ]
  | None -> []

let server_value (server : Server_runtime.server) =
  Edn_util.map
    ([
       ( Edn_util.keyword "repo",
         Edn_util.string (Cli_primitive.string_of_repo server.repo) );
       ( Edn_util.keyword "graph",
         match server.graph with
         | Some graph -> Edn_util.string (Cli_primitive.string_of_graph graph)
         | None -> Edn_util.nil );
       (Edn_util.keyword "pid", Edn_util.int server.pid);
       (Edn_util.keyword "host", Edn_util.string server.host);
       (Edn_util.keyword "port", Edn_util.int server.port);
       (Edn_util.keyword "base-url", Edn_util.string server.base_url);
       (Edn_util.keyword "status", status_value server.status);
       (Edn_util.keyword "owner-source", owner_source_value server.owner_source);
       (Edn_util.keyword "owned", Edn_util.bool server.owned);
     ]
    @ optional_string "revision" server.revision
    @ optional_string "root-dir" server.root_dir)

let start_result_value (result : Server_runtime.start_result) =
  Edn_util.map
    [
      ( Edn_util.keyword "repo",
        Edn_util.string (Cli_primitive.string_of_repo result.repo) );
      (Edn_util.keyword "owner-source", owner_source_value result.owner_source);
      (Edn_util.keyword "owned", Edn_util.bool result.owned);
    ]

let stop_result_value (result : Server_runtime.stop_result) =
  Edn_util.map
    [
      ( Edn_util.keyword "repo",
        Edn_util.string (Cli_primitive.string_of_repo result.repo) );
    ]

let error_value (err : Error.t) =
  Edn_util.map
    [
      (Edn_util.keyword "code", Edn_util.string (Error.code_to_string err.code));
      (Edn_util.keyword "message", Edn_util.string err.message);
    ]

let failed_cleanup_value (server, err) =
  match Edn_util.as_map (server_value server) with
  | Some fields ->
      Edn_util.map (fields @ [ (Edn_util.keyword "error", error_value err) ])
  | None ->
      Edn_util.map
        [
          (Edn_util.keyword "server", server_value server);
          (Edn_util.keyword "error", error_value err);
        ]

let execute_with_mode action config mode =
  let open Cli_effect in
  match action with
  | Server_list ->
      bind (Server_runtime.list_servers config) (fun servers ->
          pure
            (Cli_result.ok ~command:Command_id.Server_list mode
               (Raw
                  (Edn_util.map
                     [
                       ( Edn_util.keyword "servers",
                         Edn_util.vector (List.map server_value servers) );
                     ]))))
  | Server_cleanup ->
      bind
        (Server_runtime.cleanup_revision_mismatched_servers config
           ~cli_revision:"unknown") (function
        | Ok result ->
            pure
              (Cli_result.ok ~command:Command_id.Server_cleanup mode
                 (Raw
                    (Edn_util.map
                       [
                         ( Edn_util.keyword "cli-revision",
                           Edn_util.string result.cli_revision );
                         ( Edn_util.keyword "checked",
                           Edn_util.int result.checked );
                         ( Edn_util.keyword "mismatched",
                           Edn_util.int result.mismatched );
                         ( Edn_util.keyword "eligible",
                           Edn_util.int result.eligible );
                         ( Edn_util.keyword "skipped-owner",
                           Edn_util.int result.skipped_owner );
                         ( Edn_util.keyword "killed",
                           Edn_util.vector (List.map server_value result.killed)
                         );
                         ( Edn_util.keyword "failed",
                           Edn_util.vector
                             (List.map failed_cleanup_value result.failed) );
                       ])))
        | Error err ->
            pure (Output_mode.error ~command:Command_id.Server_cleanup mode err))
  | Server_start { repo; _ } ->
      bind (Server_runtime.start_server config repo ~create_empty_db:false)
        (function
        | Ok result ->
            pure
              (Cli_result.ok ~command:Command_id.Server_start mode
                 (Raw (start_result_value result)))
        | Error err ->
            pure (Output_mode.error ~command:Command_id.Server_start mode err))
  | Server_stop { repo; _ } ->
      bind (Server_runtime.stop_server config repo) (function
        | Ok result ->
            pure
              (Cli_result.ok ~command:Command_id.Server_stop mode
                 (Raw (stop_result_value result)))
        | Error err ->
            pure (Output_mode.error ~command:Command_id.Server_stop mode err))
  | Server_restart { repo; _ } ->
      bind (Server_runtime.restart_server config repo) (function
        | Ok result ->
            pure
              (Cli_result.ok ~command:Command_id.Server_restart mode
                 (Raw (start_result_value result)))
        | Error err ->
            pure (Output_mode.error ~command:Command_id.Server_restart mode err))

let meta ?(examples = []) id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples;
    options = [];
    category = Command_registry.Graph_management;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
    human_table_headers_order = [];
  }

let metadata () =
  [
    meta ~examples:[ "logseq server list" ] Command_id.Server_list
      "List db-worker-node servers";
    meta
      ~examples:[ "logseq server cleanup" ]
      Server_cleanup
      "Clean up revision-mismatched CLI-owned db-worker-node servers";
    meta
      ~examples:[ "logseq server start --graph my-graph" ]
      Server_start "Start db-worker-node for a graph";
    meta
      ~examples:[ "logseq server stop --graph my-graph" ]
      Server_stop "Stop db-worker-node for a graph";
    meta
      ~examples:[ "logseq server restart --graph my-graph" ]
      Server_restart "Restart db-worker-node for a graph";
  ]

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
