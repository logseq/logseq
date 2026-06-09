open Cli_effect.Infix

type request = Cli_request.t
type config = Cli_config.t
type action = Cli_action.t
type result = Result : 'o Cli_result.t -> result
type registry = Command_registry.t

type phase =
  | Raw_argv
  | Parse_argv
  | Resolve_config
  | Build_action
  | Execute_action
  | Format_result
  | Print_output
  | Exit

type lifecycle = {
  argv : string list;
  request : request option;
  config : config option;
  action : action option;
  result : result option;
  output : string option;
  exit_code : int option;
  current_phase : phase;
}

type app = {
  registry : registry;
  cmdliner : Cmdliner_boundary.app;
  defaults : Cli_config.defaults;
}

type run_input = {
  argv : string list;
  env : (string * string) list;
  cwd : Cli_primitive.path;
  stdin : string option;
}

type run_output = {
  result : result;
  stdout : string option;
  stderr : string list;
  exit_code : int;
  lifecycle : lifecycle;
}

let make_app ?version () =
  let cmdliner = Cmdliner_terms.app ?version () in
  { registry = cmdliner.registry; cmdliner; defaults = Cli_config.defaults () }

let env_lookup env key = List.assoc_opt key env
let is_option token = String.length token > 0 && token.[0] = '-'

let option_value key options =
  List.find_map (fun (k, v) -> if k = key then v else None) options

let option_present key options = List.exists (fun (k, _) -> k = key) options

let normalize_key = function
  | "-g" -> Some "graph"
  | "-o" -> Some "output"
  | "-c" -> Some "content"
  | "-e" -> Some "expand"
  | "-f" -> Some "fields"
  | "-h" -> Some "help"
  | "-s" -> Some "sort"
  | "-t" -> Some "type"
  | "-v" -> Some "verbose"
  | token when String.length token > 2 && String.sub token 0 2 = "--" ->
      Some (String.sub token 2 (String.length token - 2))
  | _ -> None

let split_equals_option token =
  match String.index_opt token '=' with
  | None -> None
  | Some index ->
      let key = String.sub token 0 index in
      let value =
        String.sub token (index + 1) (String.length token - index - 1)
      in
      Option.map (fun key -> (key, value)) (normalize_key key)

let boolean_option = function
  | "version" | "help" | "verbose" | "profile" | "enable-sync" | "expand"
  | "include-built-in" | "include-journal" | "journal-only" | "include-hidden"
  | "with-properties" | "with-extends" | "with-classes" | "with-type"
  | "page-hierarchy" | "linked-references" | "ref-id-footer" | "progress"
  | "upload-keys" ->
      true
  | _ -> false

let boolean_literal value =
  match String.lowercase_ascii (String.trim value) with
  | "true" | "false" -> true
  | _ -> false

let parse_tokens argv =
  let rec loop options positional = function
    | [] -> (List.rev options, List.rev positional)
    | "--" :: rest -> (List.rev options, List.rev_append positional rest)
    | token :: rest -> (
        match split_equals_option token with
        | Some (key, value) ->
            loop ((key, Some value) :: options) positional rest
        | None -> (
            match normalize_key token with
            | Some key when boolean_option key -> (
                match rest with
                | value :: tail when boolean_literal value ->
                    loop ((key, Some value) :: options) positional tail
                | _ -> loop ((key, Some "true") :: options) positional rest)
            | Some key -> (
                match rest with
                | value :: tail when not (is_option value) ->
                    loop ((key, Some value) :: options) positional tail
                | _ -> loop ((key, None) :: options) positional rest)
            | None -> loop options (token :: positional) rest))
  in
  loop [] [] argv

let globals_of_options options =
  Global_opts.create
    ?graph:
      (Option.map Cli_primitive.create_graph (option_value "graph" options))
    ?root_dir:(option_value "root-dir" options)
    ?config_path:(option_value "config" options)
    ?timeout_span:
      (Option.map Time.span_of_ms
         (Option.bind (option_value "timeout-ms" options) Int64.of_string_opt))
    ?output_format:
      (Option.bind (option_value "output" options) Output_mode.of_string)
    ~verbose:(option_present "verbose" options)
    ~profile:(option_present "profile" options)
    ()

let parse_request _ input =
  Cli_effect.pure (Cli_parse.parse ?stdin:input.stdin input.argv)

let resolve_config app request input =
  Cli_config.resolve ~defaults:app.defaults ~env:(env_lookup input.env)
    request.Cli_request.globals
  |> Cli_effect.map
       (Error.map (fun r ->
            { r.Cli_config.config with project_dir = Some input.cwd }))

let build_action app request config =
  match request.Cli_request.command with
  | Cli_request.Completion parsed ->
      Cli_effect.pure
        (Error.map
           (fun action -> Cli_action.Completion action)
           (Completion.build ~registry:app.registry config request.globals
              parsed))
  | _ -> Cli_action.build config request

let execute_action _ action config =
  let execute_with_packed (Output.Mode.Packed mode) =
    Cli_effect.map
      (fun result -> Result result)
      (Cli_action.execute action config mode)
  in
  execute_with_packed
    (Option.value config.Cli_config.output_format ~default:Output_mode.default)

let format_result _ (Result result) config =
  Format_types.format_result result config

let result_exit_code (Result result) = Cli_result.exit_code result

let ensure_root_config config =
  match Root_dir_types.ensure_root_dir (Some config.Cli_config.root_dir) with
  | Ok root_dir -> Ok { config with Cli_config.root_dir }
  | Error _ as err -> err

let graph_exists_error graph =
  let graph_name = Cli_primitive.string_of_graph graph in
  Error.make
    ~context:
      (Edn_util.map [ (Edn_util.keyword "graph", Edn_util.string graph_name) ])
    (Edn_util.keyword_t "graph-exists")
    ("graph already exists: " ^ graph_name)

let action_graph_exists config graph =
  List.exists
    (fun existing ->
      String.equal
        (Cli_primitive.string_of_graph existing)
        (Cli_primitive.string_of_graph graph))
    (Server_runtime.list_graphs config)

let ensure_action_graph_constraints config action =
  match Cli_action.graph action with
  | Some graph
    when Cli_action.requires_missing_graph action
         && action_graph_exists config graph ->
      Error (graph_exists_error graph)
  | _ -> Ok ()

let profile_status output =
  Edn_util.keyword_t (if output.exit_code = 0 then "ok" else "error")

let profile_command = function
  | Some request -> Command_id.to_string (Cli_request.command_id request)
  | None -> "unknown"

let with_profile_lines profile_session request output =
  match profile_session with
  | None -> output
  | Some session ->
      let report =
        Profile_types.report session ~command:(profile_command request)
          ~status:(profile_status output)
      in
      { output with stderr = output.stderr @ Profile_types.render_lines report }

let verbose_parsed_options_line request (config : Cli_config.t) =
  if not config.verbose then []
  else
    [
      Melange_edn.to_edn_string
        (Edn_util.map
           [
             (Edn_util.keyword "level", Edn_util.keyword "debug");
             (Edn_util.keyword "message", Edn_util.keyword "cli/parsed-options");
             ( Edn_util.keyword "command",
               Edn_util.string
                 (Command_id.to_string (Cli_request.command_id request)) );
             (Edn_util.keyword "root-dir", Edn_util.string config.root_dir);
           ]);
    ]

let with_verbose_line config request output =
  {
    output with
    stderr = output.stderr @ verbose_parsed_options_line request config;
  }

let stdin_required_for_show_id argv =
  let options, positional = parse_tokens argv in
  positional = [ "show" ]
  && option_present "id" options
  && Option.is_none (option_value "id" options)

let read_stdin_all () = Cli_unix.read_stdin_all ()

let group_help_path registry path =
  let is_prefix prefix path =
    let rec loop prefix path =
      match (prefix, path) with
      | [], _ -> true
      | p :: ps, x :: xs when p = x -> loop ps xs
      | _ -> false
    in
    List.length prefix <= List.length path && loop prefix path
  in
  match path with
  | [] -> true
  | _ when Option.is_some (Command_registry.find_by_path path registry) -> false
  | _ ->
      List.exists
        (fun command ->
          is_prefix path command.Command_registry.path
          && List.length command.Command_registry.path > List.length path)
        registry.Command_registry.commands

let help_group registry options positional =
  if option_present "help" options then Some positional
  else if group_help_path registry positional then Some positional
  else None

let run app input =
  let options, _ = parse_tokens input.argv in
  let profile_session =
    Profile_types.create_session (option_present "profile" options)
  in
  let time stage f = Profile_types.time profile_session stage f in
  let ( let* ) = ( >>= ) in
  let finish ?config request output =
    let output =
      match (config, request) with
      | Some config, Some request -> with_verbose_line config request output
      | _ -> output
    in
    Cli_effect.pure (with_profile_lines profile_session request output)
  in
  let format_result_effect result config =
    time "cli.format-result" (fun () ->
        Cli_effect.pure (format_result app result config))
  in
  let finish_command_error config request err =
    let packed_result =
      let pack (Output.Mode.Packed mode) =
        Result
          (Cli_result.error ~command:(Cli_request.command_id request) mode err)
      in
      pack
        (Option.value config.Cli_config.output_format
           ~default:Output_mode.default)
    in
    let* output = format_result_effect packed_result config in
    finish ~config (Some request)
      {
        result = packed_result;
        stdout = Some (output ^ "\n");
        stderr = [];
        exit_code = 1;
        lifecycle =
          {
            argv = input.argv;
            request = Some request;
            config = Some config;
            action = None;
            result = Some packed_result;
            output = Some output;
            exit_code = Some 1;
            current_phase = Exit;
          };
      }
  in
  if option_present "version" options then
    let version = "logseq-cli ocaml" in
    let packed_result =
      Result
        (Cli_result.ok ~command:Command_id.Version Output.Mode.Human
           (Message version))
    in
    finish None
      {
        result = packed_result;
        stdout = Some (version ^ "\n");
        stderr = [];
        exit_code = 0;
        lifecycle =
          {
            argv = input.argv;
            request = None;
            config = None;
            action = None;
            result = Some packed_result;
            output = Some version;
            exit_code = Some 0;
            current_phase = Exit;
          };
      }
  else
    match help_group app.registry options (snd (parse_tokens input.argv)) with
    | Some group ->
        let help = Command_registry.render_help ~group app.registry in
        let packed_result =
          Result (Cli_result.ok Output.Mode.Human (Message help))
        in
        finish None
          {
            result = packed_result;
            stdout = Some (help ^ "\n");
            stderr = [];
            exit_code = 0;
            lifecycle =
              {
                argv = input.argv;
                request = None;
                config = None;
                action = None;
                result = Some packed_result;
                output = Some help;
                exit_code = Some 0;
                current_phase = Exit;
              };
          }
    | None -> (
        let* parsed =
          time "cli.parse-args" (fun () -> parse_request app input)
        in
        match parsed with
        | Error err when err.Error.code = Edn_util.keyword_t "invalid-options"
          ->
            let output_format =
              globals_of_options options |> fun globals ->
              globals.Global_opts.output_format
            in
            let result = Cli_result.error Output.Mode.Human err in
            let packed_result = Result result in
            let* output =
              time "cli.format-result" (fun () ->
                  Cli_effect.pure
                    (match output_format with
                    | Some (Output.Mode.Packed Output.Mode.Json) ->
                        Format_types.to_json result
                    | Some (Output.Mode.Packed Output.Mode.Edn) ->
                        Format_types.to_edn result
                    | _ -> Format_types.format_error err None))
            in
            finish None
              {
                result = packed_result;
                stdout = Some (output ^ "\n");
                stderr = [];
                exit_code = 1;
                lifecycle =
                  {
                    argv = input.argv;
                    request = None;
                    config = None;
                    action = None;
                    result = Some packed_result;
                    output = Some output;
                    exit_code = Some 1;
                    current_phase = Exit;
                  };
              }
        | Error err ->
            let result = Cli_result.error Output.Mode.Human err in
            let packed_result = Result result in
            let* output =
              time "cli.format-result" (fun () ->
                  Cli_effect.pure (Format_types.format_error err None))
            in
            finish None
              {
                result = packed_result;
                stdout = Some (output ^ "\n");
                stderr = [];
                exit_code = 1;
                lifecycle =
                  {
                    argv = input.argv;
                    request = None;
                    config = None;
                    action = None;
                    result = Some packed_result;
                    output = Some output;
                    exit_code = Some 1;
                    current_phase = Exit;
                  };
              }
        | Ok request -> (
            let* resolved =
              time "cli.resolve-config" (fun () ->
                  resolve_config app request input)
            in
            match resolved with
            | Error err ->
                let result = Cli_result.error Output.Mode.Human err in
                let packed_result = Result result in
                let* output =
                  time "cli.format-result" (fun () ->
                      Cli_effect.pure
                        (Format_types.format_error err
                           (Some (Cli_request.command_id request))))
                in
                finish (Some request)
                  {
                    result = packed_result;
                    stdout = Some (output ^ "\n");
                    stderr = [];
                    exit_code = 1;
                    lifecycle =
                      {
                        argv = input.argv;
                        request = Some request;
                        config = None;
                        action = None;
                        result = Some packed_result;
                        output = Some output;
                        exit_code = Some 1;
                        current_phase = Exit;
                      };
                  }
            | Ok config -> (
                let config = { config with Cli_config.profile_session } in
                let* ensured =
                  time "cli.ensure-root-dir" (fun () ->
                      Cli_effect.pure (ensure_root_config config))
                in
                match ensured with
                | Error err -> finish_command_error config request err
                | Ok config -> (
                    let* built =
                      time "cli.build-action" (fun () ->
                          build_action app request config)
                    in
                    match built with
                    | Error err -> finish_command_error config request err
                    | Ok action -> (
                        match ensure_action_graph_constraints config action with
                        | Error err -> finish_command_error config request err
                        | Ok () ->
                            let* result =
                              time "cli.execute-action" (fun () ->
                                  execute_action app action config)
                            in
                            let* output = format_result_effect result config in
                            let exit_code = result_exit_code result in
                            finish ~config (Some request)
                              {
                                result;
                                stdout =
                                  (if output = "" then None
                                   else Some (output ^ "\n"));
                                stderr = [];
                                exit_code;
                                lifecycle =
                                  {
                                    argv = input.argv;
                                    request = Some request;
                                    config = Some config;
                                    action = Some action;
                                    result = Some result;
                                    output = Some output;
                                    exit_code = Some exit_code;
                                    current_phase = Exit;
                                  };
                              })))))

let main_effect ?argv ?env () =
  let argv =
    match argv with
    | Some argv -> Array.to_list argv |> List.tl
    | None -> Array.to_list Sys.argv |> List.tl
  in
  let env =
    match env with
    | Some lookup ->
        [
          "HOME";
          "LOGSEQ_CLI_GRAPH";
          "LOGSEQ_CLI_ROOT_DIR";
          "LOGSEQ_CLI_CONFIG";
          "LOGSEQ_CLI_TIMEOUT_MS";
          "LOGSEQ_CLI_LOGIN_TIMEOUT_MS";
          "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS";
          "LOGSEQ_CLI_OUTPUT";
          "LOGSEQ_CLI_WS_URL";
          "LOGSEQ_CLI_HTTP_BASE";
          "LOGSEQ_CLI_BASE_URL";
        ]
        |> List.filter_map (fun key ->
            Option.map (fun value -> (key, value)) (lookup key))
    | None ->
        [
          "HOME";
          "LOGSEQ_CLI_GRAPH";
          "LOGSEQ_CLI_ROOT_DIR";
          "LOGSEQ_CLI_CONFIG";
          "LOGSEQ_CLI_TIMEOUT_MS";
          "LOGSEQ_CLI_LOGIN_TIMEOUT_MS";
          "LOGSEQ_CLI_LOGOUT_TIMEOUT_MS";
          "LOGSEQ_CLI_OUTPUT";
          "LOGSEQ_CLI_WS_URL";
          "LOGSEQ_CLI_HTTP_BASE";
          "LOGSEQ_CLI_BASE_URL";
          "LOGSEQ_DB_WORKER_NODE_SCRIPT";
        ]
        |> List.filter_map (fun key ->
            Option.map (fun value -> (key, value)) (Sys.getenv_opt key))
  in
  let stdin =
    if stdin_required_for_show_id argv then Some (read_stdin_all ()) else None
  in
  Cli_effect.map
    (fun output ->
      Option.iter print_string output.stdout;
      List.iter prerr_endline output.stderr;
      flush stdout;
      flush stderr;
      output.exit_code)
    (run (make_app ()) { argv; env; cwd = Sys.getcwd (); stdin })
