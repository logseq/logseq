type opts = { dev_script : bool }
type parsed = Parsed_doctor of opts
type action = Doctor of { script_path : Cli_primitive.path option }
type check_status = Ok | Warning | Error

type check = {
  id : Cli_primitive.keyword;
  status : check_status;
  code : Error.code option;
  message : string;
  path : Cli_primitive.path option;
  servers : Melange_edn_melange.any Rrbvec.t;
  raw : Melange_edn_melange.any option;
}

type report = { status : check_status; checks : check Rrbvec.t }

let command_id _ = Command_id.Doctor
let validate_parsed _ = Stdlib.Ok ()

let status_value = function
  | Ok -> Edn_util.keyword "ok"
  | Warning -> Edn_util.keyword "warning"
  | Error -> Edn_util.keyword "error"

let check_value (check : check) =
  let fields =
    Vec.of_array
      [|
        (Edn_util.keyword "id", Edn_util.any check.id);
        (Edn_util.keyword "status", status_value check.status);
        (Edn_util.keyword "message", Edn_util.string check.message);
      |]
  in
  let fields =
    match check.code with
    | Some code ->
        Vec.push_back fields
          (Edn_util.keyword "code", Edn_util.any (Error.code_to_keyword code))
    | None -> fields
  in
  let fields =
    match check.path with
    | Some path ->
        Vec.push_back fields (Edn_util.keyword "path", Edn_util.string path)
    | None -> fields
  in
  let fields =
    if Vec.is_empty check.servers then fields
    else
      Vec.push_back fields
        (Edn_util.keyword "servers", Edn_util.vector_vec check.servers)
  in
  let fields =
    match check.raw with
    | Some raw -> Vec.push_back fields (Edn_util.keyword "raw", raw)
    | None -> fields
  in
  Edn_util.map_vec fields

let check_db_worker_script (Doctor { script_path }) =
  let path =
    Option.value script_path
      ~default:(Server_runtime.db_worker_runtime_script_path ())
  in
  if not (Cli_unix.file_exists path) then
    {
      id = Edn_util.keyword_t "db-worker-script";
      status = Error;
      code = Some Error.Doctor_script_missing;
      message = "db-worker script is missing: " ^ path;
      path = Some path;
      servers = Vec.empty;
      raw = None;
    }
  else if Cli_unix.is_directory path then
    {
      id = Edn_util.keyword_t "db-worker-script";
      status = Error;
      code = Some Error.Doctor_script_unreadable;
      message = "db-worker script path is not a file: " ^ path;
      path = Some path;
      servers = Vec.empty;
      raw = None;
    }
  else
    try
      ignore (Cli_unix.read_text_file path);
      {
        id = Edn_util.keyword_t "db-worker-script";
        status = Ok;
        code = None;
        message = "Found readable file: " ^ path;
        path = Some path;
        servers = Vec.empty;
        raw = None;
      }
    with exn ->
      {
        id = Edn_util.keyword_t "db-worker-script";
        status = Error;
        code = Some Error.Doctor_script_unreadable;
        message =
          "db-worker script is not readable: " ^ path ^ " ("
          ^ Printexc.to_string exn ^ ")";
        path = Some path;
        servers = Vec.empty;
        raw = None;
      }

let ensure_dir path =
  if Cli_unix.file_exists path then () else Cli_unix.mkdir path 0o755

let check_root_dir config =
  let path = config.Cli_config.root_dir in
  try
    ensure_dir path;
    let probe = Filename.concat path ".logseq-cli-doctor-check" in
    Cli_unix.write_text_file probe "ok";
    Cli_unix.remove_tree probe;
    {
      id = Edn_util.keyword_t "root-dir";
      status = Ok;
      code = None;
      message = "Read/write access confirmed: " ^ path;
      path = Some path;
      servers = Vec.empty;
      raw = None;
    }
  with exn ->
    {
      id = Edn_util.keyword_t "root-dir";
      status = Error;
      code = Some Error.Root_dir_permission;
      message = "root-dir check failed: " ^ Printexc.to_string exn;
      path = Some path;
      servers = Vec.empty;
      raw = None;
    }

let server_status_value = function
  | Server_runtime.Starting -> Edn_util.keyword "starting"
  | Server_runtime.Ready -> Edn_util.keyword "ready"
  | Server_runtime.Error -> Edn_util.keyword "error"
  | Server_runtime.Unknown -> Edn_util.keyword "unknown"

let server_value (server : Server_runtime.server) =
  Edn_util.map_vec
    (Vec.of_array
       [|
         ( Edn_util.keyword "repo",
           Edn_util.string (Cli_primitive.string_of_repo server.repo) );
         ( Edn_util.keyword "graph",
           match server.graph with
           | Some graph -> Edn_util.string (Cli_primitive.string_of_graph graph)
           | None -> Edn_util.nil );
         (Edn_util.keyword "status", server_status_value server.status);
         (Edn_util.keyword "base-url", Edn_util.string server.base_url);
       |])

let check_running_servers config =
  Cli_effect.map
    (fun servers ->
      let starting =
        Vec.filter
          (fun (server : Server_runtime.server) ->
            server.status = Server_runtime.Starting)
          servers
      in
      if Vec.is_empty starting then
        {
          id = Edn_util.keyword_t "running-servers";
          status = Ok;
          code = None;
          message =
            (if Vec.is_empty servers then
               "No running db-worker servers detected"
             else "All running servers are ready");
          path = None;
          servers = Vec.map server_value servers;
          raw = None;
        }
      else
        {
          id = Edn_util.keyword_t "running-servers";
          status = Warning;
          code = Some Error.Doctor_server_not_ready;
          message =
            Humanize_types.format_count_with_noun (Vec.length starting) "server"
            ^ " still starting";
          path = None;
          servers = Vec.map server_value starting;
          raw = None;
        })
    (Server_runtime.list_servers config)

let report_status checks =
  if Vec.exists (fun (check : check) -> check.status = Error) checks then Error
  else if Vec.exists (fun (check : check) -> check.status = Warning) checks then
    Warning
  else Ok

let report_value checks =
  let status = report_status checks in
  Edn_util.map_vec
    (Vec.of_array
       [|
         (Edn_util.keyword "status", status_value status);
         ( Edn_util.keyword "checks",
           Edn_util.vector_vec (checks |> Vec.map check_value) );
       |])

let build ?registry:_ _ _ (Parsed_doctor opts) =
  let script_path =
    if opts.dev_script then Some (Filename.concat "static" "db-worker-node.js")
    else None
  in
  Stdlib.Ok (Doctor { script_path })

let execute_with_mode action config mode =
  let script_check = check_db_worker_script action in
  if script_check.status = Error then
    Cli_effect.pure
      (Output_mode.error ~command:Command_id.Doctor mode
         ~context:(report_value (Vec.singleton script_check))
         (Error.make
            ~context:(report_value (Vec.singleton script_check))
            (Option.value script_check.code ~default:Error.Doctor_error)
            script_check.message))
  else
    let root_check = check_root_dir config in
    if root_check.status = Error then
      let checks = Vec.of_array [| script_check; root_check |] in
      Cli_effect.pure
        (Output_mode.error ~command:Command_id.Doctor mode
           ~context:(report_value checks)
           (Error.make ~context:(report_value checks)
              (Option.value root_check.code ~default:Error.Doctor_error)
              root_check.message))
    else
      Cli_effect.map
        (fun server_check ->
          let checks =
            Vec.of_array [| script_check; root_check; server_check |]
          in
          Cli_result.ok ~command:Command_id.Doctor mode
            (Raw (report_value checks)))
        (check_running_servers config)

let metadata () =
  Vec.of_array
    [|
      {
        Command_registry.id = Command_id.Doctor;
        path = Command_id.to_path Command_id.Doctor;
        doc = "Run CLI diagnostics";
        long_doc = None;
        examples = Vec.empty;
        options = Vec.empty;
        category = Command_registry.Utilities;
        requires_graph = Command_id.requires_graph Command_id.Doctor;
        requires_auth = Command_id.requires_auth Command_id.Doctor;
        write_command = Command_id.is_write Command_id.Doctor;
        human_table_headers_order = Vec.empty;
      };
    |]

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
