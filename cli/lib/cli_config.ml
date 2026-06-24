type env = string -> string option

type defaults = {
  timeout_span : float;
  login_timeout_span : float;
  logout_timeout_span : float;
  list_title_max_display_width : int;
  root_dir : Cli_primitive.path;
  ws_url : Cli_primitive.url;
  http_base : Cli_primitive.url;
}

type t = {
  graph : Cli_primitive.graph option;
  repo : Cli_primitive.repo option;
  root_dir : Cli_primitive.path;
  config_path : Cli_primitive.path;
  timeout_span : float;
  login_timeout_span : float;
  logout_timeout_span : float;
  list_title_max_display_width : int;
  output_format : Output.Mode.packed option;
  verbose : bool;
  profile : bool;
  ws_url : Cli_primitive.url option;
  http_base : Cli_primitive.url option;
  auth_path : Cli_primitive.path option;
  id_token : string option;
  access_token : string option;
  refresh_token : string option;
  base_url : Cli_primitive.url option;
  owner_source : Cli_primitive.owner_source;
  project_dir : Cli_primitive.path option;
  raw_file_config : Melange_edn.any option;
  profile_session : Profile_types.session option;
}

type source = Defaults | Env | File of Cli_primitive.path | Argv
type resolved = { config : t; sources : source list }

let default_root_dir () =
  Filename.concat (Sys.getenv_opt "HOME" |> Option.value ~default:".") "logseq"

let default_config_path root_dir = Filename.concat root_dir "cli.edn"

let defaults () =
  {
    timeout_span = Time.span_of_ms 10_000L;
    login_timeout_span = Time.span_of_ms 300_000L;
    logout_timeout_span = Time.span_of_ms 120_000L;
    list_title_max_display_width = 40;
    root_dir = default_root_dir ();
    ws_url = "wss://api.logseq.io/sync/%s";
    http_base = "https://api.logseq.io";
  }

let db_version_prefix = "logseq_db_"

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let strip_db_version_prefix value =
  if starts_with ~prefix:db_version_prefix value then
    String.sub value
      (String.length db_version_prefix)
      (String.length value - String.length db_version_prefix)
  else value

let graph_to_repo graph =
  let stripped =
    let rec loop value =
      if starts_with ~prefix:db_version_prefix value then
        loop (strip_db_version_prefix value)
      else value
    in
    loop (Cli_primitive.string_of_graph graph)
  in
  Cli_primitive.create_repo stripped

let repo_to_graph repo =
  Cli_primitive.create_graph
    (strip_db_version_prefix (Cli_primitive.string_of_repo repo))

let value_of_edn edn = edn
let edn_of_value = Melange_edn.to_edn_string
let read_file = Cli_unix.read_text_file

let read_config_file path =
  if not (Cli_unix.file_exists path) then Ok None
  else
    let content = read_file path in
    if String.trim content = "" then Ok None
    else try Ok (Some (Melange_edn.of_edn_string content |> value_of_edn))
    with exn ->
      Error
        (Error.make
           (Error.Invalid_config)
           ("invalid config file: " ^ path ^ " (" ^ Printexc.to_string exn ^ ")"))

let invalid_config message =
  Error.make (Error.Invalid_config) message

let parse_int_value value =
  let value = String.trim value in
  if value = "" then None
  else Option.map Edn_util.int64 (Int64.of_string_opt value)

let env_string key env value_key fields =
  match env key with
  | Some value when String.trim value <> "" ->
      (Edn_util.keyword value_key, Edn_util.string value) :: fields
  | _ -> fields

let env_int key env value_key fields =
  match Option.bind (env key) parse_int_value with
  | Some value -> (Edn_util.keyword value_key, value) :: fields
  | None -> fields

let env_config env =
  let fields =
    []
    |> env_string "LOGSEQ_CLI_GRAPH" env "graph"
    |> env_string "LOGSEQ_CLI_ROOT_DIR" env "root-dir"
    |> env_string "LOGSEQ_CLI_CONFIG" env "config-path"
    |> env_int "LOGSEQ_CLI_TIMEOUT_MS" env "timeout-ms"
    |> env_int "LOGSEQ_CLI_LOGIN_TIMEOUT_MS" env "login-timeout-ms"
    |> env_int "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS" env "logout-timeout-ms"
    |> env_string "LOGSEQ_CLI_OUTPUT" env "output-format"
    |> env_string "LOGSEQ_CLI_WS_URL" env "ws-url"
    |> env_string "LOGSEQ_CLI_HTTP_BASE" env "http-base"
  in
  Edn_util.map_t (List.rev fields)

let validate_env_int_value key env =
  match env key with
  | Some value when String.trim value <> "" -> (
      let value = String.trim value in
      match Int64.of_string_opt value with
      | Some _ -> Ok ()
      | None ->
          Error
            (invalid_config
               ("invalid env " ^ key ^ ": " ^ value ^ ". Expected integer")))
  | _ -> Ok ()

let checked_env_config env =
  Error.bind (validate_env_int_value "LOGSEQ_CLI_TIMEOUT_MS" env) (fun () ->
      Error.bind (validate_env_int_value "LOGSEQ_CLI_LOGIN_TIMEOUT_MS" env)
        (fun () ->
          Error.bind (validate_env_int_value "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS" env)
            (fun () -> Ok (env_config env))))

let sanitize_file_config value =
  match Edn_util.as_map value with
  | Some fields ->
      Edn_util.map
        (List.filter
           (fun (key, _) ->
             match Edn_util.as_string_like key with
             | Some ("auth-token" | "retries" | "e2ee-password") -> false
             | _ -> true)
           fields)
  | None -> value

let assoc_opt key value fields =
  match value with
  | None -> fields
  | Some value ->
      (Edn_util.keyword key, Edn_util.string value)
      :: List.remove_assoc (Edn_util.keyword key) fields

let map_fields value = Option.value (Edn_util.as_map value) ~default:[]

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || Cli_unix.file_exists path then
    ()
  else (
    mkdir_p (Filename.dirname path);
    Cli_unix.mkdir path 0o755)

let write_config_file path value =
  mkdir_p (Filename.dirname path);
  Cli_unix.write_text_file path (edn_of_value value ^ "\n")

let pick_graph config globals =
  match globals.Global_opts.graph with Some _ as g -> g | None -> config.graph

let value_string key value = Edn_util.get_string value key
let value_int key value = Edn_util.get_int value key
let value_int64 key value = Edn_util.get_int64 value key

let normalize_output_string value =
  let value = String.trim value in
  if value <> "" && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let value_output key value =
  Option.bind (value_string key value) (fun value ->
      Output.Mode.of_string (normalize_output_string value))

let edn_value_text value = Melange_edn.to_edn_string value

let validate_int64_config_value ~source key value =
  match Edn_util.get value key with
  | None -> Ok ()
  | Some raw -> (
      match Edn_util.as_int64 raw with
      | Some _ -> Ok ()
      | None ->
          Error
            (invalid_config
               ("invalid " ^ source ^ " config " ^ key ^ ": "
              ^ edn_value_text raw ^ ". Expected integer")))

let validate_int_config_value ~source key value =
  match Edn_util.get value key with
  | None -> Ok ()
  | Some raw -> (
      match Edn_util.as_int raw with
      | Some _ -> Ok ()
      | None ->
          Error
            (invalid_config
               ("invalid " ^ source ^ " config " ^ key ^ ": "
              ^ edn_value_text raw ^ ". Expected integer")))

let validate_output_config_value ~source key value =
  match Edn_util.get value key with
  | None -> Ok ()
  | Some raw -> (
      match Edn_util.as_string_like raw with
      | Some output
        when Option.is_some
               (Output.Mode.of_string (normalize_output_string output)) ->
          Ok ()
      | _ ->
          Error
            (invalid_config
               ("invalid " ^ source ^ " config " ^ key ^ ": "
              ^ edn_value_text raw ^ ". Expected one of human, json, edn")))

let validate_config_values ~source value =
  Error.bind (validate_int64_config_value ~source "timeout-ms" value) (fun () ->
      Error.bind (validate_int64_config_value ~source "login-timeout-ms" value)
        (fun () ->
          Error.bind
            (validate_int64_config_value ~source "logout-timeout-ms" value)
            (fun () ->
              Error.bind
                (validate_int_config_value ~source
                   "list-title-max-display-width" value) (fun () ->
                  Error.bind
                    (validate_output_config_value ~source "output-format" value)
                    (fun () ->
                      validate_output_config_value ~source "output" value)))))

let first_some values = List.find_map (fun value -> value) values

let positive_or_default value default =
  match value with Some value when value > 0 -> value | _ -> default

let span_option_of_ms value = Option.map Time.span_of_ms value

let resolve ~(defaults : defaults) ~env (globals : Global_opts.t) =
  match checked_env_config env with
  | Error _ as err -> Cli_effect.pure err
  | Ok env_config -> (
      let env_config = Edn_util.any env_config in
      let initial_root_dir =
        first_some
          [
            globals.root_dir;
            value_string "root-dir" env_config;
            Some defaults.root_dir;
          ]
        |> Option.value ~default:defaults.root_dir
      in
      let config_path =
        first_some
          [
            globals.config_path;
            value_string "config-path" env_config;
            Some (default_config_path initial_root_dir);
          ]
        |> Option.value ~default:(default_config_path initial_root_dir)
      in
      match read_config_file config_path with
      | Error _ as err -> Cli_effect.pure err
      | Ok raw_file_config -> (
          let raw_file_config =
            Option.map sanitize_file_config raw_file_config
          in
          match
            Error.bind (validate_config_values ~source:"env" env_config)
              (fun () ->
                match raw_file_config with
                | None -> Ok ()
                | Some file_config ->
                    validate_config_values ~source:"file" file_config)
          with
          | Error _ as err -> Cli_effect.pure err
          | Ok () ->
              let base_url = env "LOGSEQ_CLI_BASE_URL" in
              let file_graph =
                Option.bind raw_file_config (value_string "graph")
                |> Option.map Cli_primitive.create_graph
              in
              let env_graph =
                value_string "graph" env_config
                |> Option.map Cli_primitive.create_graph
              in
              let root_dir =
                first_some
                  [
                    globals.root_dir;
                    value_string "root-dir" env_config;
                    Option.bind raw_file_config (value_string "root-dir");
                    Some initial_root_dir;
                  ]
                |> Option.value ~default:initial_root_dir
              in
              let graph = first_some [ globals.graph; env_graph; file_graph ] in
              let repo = Option.map graph_to_repo graph in
              let file_ws_url =
                Option.bind raw_file_config (fun value ->
                    Edn_util.get_string value "ws-url")
              in
              let file_http_base =
                Option.bind raw_file_config (fun value ->
                    Edn_util.get_string value "http-base")
              in
              let file_auth_path =
                Option.bind raw_file_config (fun value ->
                    Edn_util.get_string value "auth-path")
              in
              let file_id_token =
                Option.bind raw_file_config (fun value ->
                    Edn_util.get_string value "id-token")
              in
              let file_access_token =
                Option.bind raw_file_config (fun value ->
                    Edn_util.get_string value "access-token")
              in
              let file_refresh_token =
                Option.bind raw_file_config (fun value ->
                    Edn_util.get_string value "refresh-token")
              in
              let env_ws_url = Edn_util.get_string env_config "ws-url" in
              let env_http_base = Edn_util.get_string env_config "http-base" in
              let output_format =
                first_some
                  [
                    globals.output_format;
                    value_output "output-format" env_config;
                    Option.bind raw_file_config (value_output "output-format");
                    Option.bind raw_file_config (value_output "output");
                  ]
              in
              let timeout_span =
                first_some
                  [
                    globals.timeout_span;
                    span_option_of_ms (value_int64 "timeout-ms" env_config);
                    span_option_of_ms
                      (Option.bind raw_file_config (value_int64 "timeout-ms"));
                    Some defaults.timeout_span;
                  ]
                |> Option.value ~default:defaults.timeout_span
              in
              let login_timeout_span =
                first_some
                  [
                    span_option_of_ms
                      (value_int64 "login-timeout-ms" env_config);
                    span_option_of_ms
                      (Option.bind raw_file_config
                         (value_int64 "login-timeout-ms"));
                    Some defaults.login_timeout_span;
                  ]
                |> Option.value ~default:defaults.login_timeout_span
              in
              let logout_timeout_span =
                first_some
                  [
                    span_option_of_ms
                      (value_int64 "logout-timeout-ms" env_config);
                    span_option_of_ms
                      (Option.bind raw_file_config
                         (value_int64 "logout-timeout-ms"));
                    Some defaults.logout_timeout_span;
                  ]
                |> Option.value ~default:defaults.logout_timeout_span
              in
              let list_title_max_display_width =
                positive_or_default
                  (Option.bind raw_file_config
                     (value_int "list-title-max-display-width"))
                  defaults.list_title_max_display_width
              in
              let config =
                {
                  graph;
                  repo;
                  root_dir;
                  config_path;
                  timeout_span;
                  login_timeout_span;
                  logout_timeout_span;
                  list_title_max_display_width;
                  output_format;
                  verbose = globals.verbose;
                  profile = globals.profile;
                  ws_url =
                    Some
                      (Option.value env_ws_url
                         ~default:
                           (Option.value file_ws_url ~default:defaults.ws_url));
                  http_base =
                    Some
                      (Option.value env_http_base
                         ~default:
                           (Option.value file_http_base
                              ~default:defaults.http_base));
                  auth_path = file_auth_path;
                  id_token = file_id_token;
                  access_token = file_access_token;
                  refresh_token = file_refresh_token;
                  base_url;
                  owner_source = Cli_primitive.Cli;
                  project_dir = None;
                  raw_file_config;
                  profile_session = None;
                }
              in
              Cli_effect.pure
                (Ok
                   {
                     config;
                     sources = [ Defaults; File config_path; Env; Argv ];
                   })))

let update_config config patch =
  let original =
    match config.raw_file_config with
    | Some value -> value
    | None -> Edn_util.map []
  in
  let fields = map_fields original in
  let fields =
    fields
    |> assoc_opt "ws-url" (Edn_util.get_string patch "ws-url")
    |> assoc_opt "http-base" (Edn_util.get_string patch "http-base")
    |> assoc_opt "graph" (Edn_util.get_string patch "graph")
  in
  let fields =
    match Edn_util.get patch "ws-url" with
    | Some value when Edn_util.is_null value ->
        List.remove_assoc (Edn_util.keyword "ws-url") fields
    | _ -> fields
  in
  let fields =
    match Edn_util.get patch "http-base" with
    | Some value when Edn_util.is_null value ->
        List.remove_assoc (Edn_util.keyword "http-base") fields
    | _ -> fields
  in
  let fields =
    match Edn_util.get patch "graph" with
    | Some value when Edn_util.is_null value ->
        List.remove_assoc (Edn_util.keyword "graph") fields
    | _ -> fields
  in
  let value = Edn_util.map_t (List.rev fields) in
  try
    write_config_file config.config_path (Edn_util.any value);
    Cli_effect.pure (Ok value)
  with exn ->
    Cli_effect.pure
      (Error
         (Error.make
            (Error.Config_write_failed)
            ("failed to write config file: " ^ Printexc.to_string exn)))
