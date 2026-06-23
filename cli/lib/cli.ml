type app_context = {
  registry : Command_registry.t;
  defaults : Cli_config.defaults;
}

type run_input = {
  argv : string list;
  env : (string * string) list;
  cwd : Cli_primitive.path;
  stdin : string option;
}

let command_metadata () =
  Graph.metadata () @ List_command.metadata () @ Upsert.metadata ()
  @ Remove.metadata () @ Search.metadata () @ Query.metadata ()
  @ Show.metadata () @ Server_command.metadata () @ Sync.metadata ()
  @ Completion.metadata () @ Skill.metadata () @ Example.metadata ()
  @ Doctor.metadata () @ Debug.metadata () @ Agent.metadata ()
  @ Auth_command.metadata ()

let command_registry () = Command_registry.make (command_metadata ())

let make_app ?version:_ () =
  { registry = command_registry (); defaults = Cli_config.defaults () }

let make_app_context = make_app
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

let stdin_required_for_show_id argv =
  let options, positional = parse_tokens argv in
  positional = [ "show" ]
  && option_present "id" options
  && Option.is_none (option_value "id" options)

let read_stdin_all () = Cli_unix.read_stdin_all ()

let output_mode_of_options options =
  Option.bind (option_value "output" options) Output_mode.of_string
  |> Option.value ~default:Output_mode.default

let output_mode_of_globals globals =
  Option.value globals.Global_opts.output_format ~default:Output_mode.default

let output_mode_of_config config = Output_mode.for_config config

let result_text_for_mode result (Output.Mode.Packed mode) =
  match mode with
  | Output.Mode.Human -> (
      match result.Cli_result.status with
      | Ok -> (
          match result.data with
          | Some (Cli_result.Message message) -> message
          | _ -> "")
      | Error -> (
          match result.error with
          | Some err -> Format_types.format_error err result.command
          | None -> ""))
  | Output.Mode.Json -> Format_types.to_json result
  | Output.Mode.Edn -> Format_types.to_edn result

type pending_output = { stdout : string; stderr : string list; exit_code : int }

let pending_output : pending_output option ref = ref None

let set_pending_output ?(stderr = []) ~exit_code stdout =
  pending_output := Some { stdout; stderr; exit_code }

let take_pending_output () =
  let output = !pending_output in
  pending_output := None;
  output

let set_pending_error_output ?command mode err =
  let (Output.Mode.Packed concrete_mode) = mode in
  let result = Cli_result.error ?command concrete_mode err in
  set_pending_output ~exit_code:1 (result_text_for_mode result mode)

let set_pending_message_output ?command mode message =
  let (Output.Mode.Packed concrete_mode) = mode in
  let result =
    Cli_result.ok ?command concrete_mode (Cli_result.Message message)
  in
  set_pending_output ~exit_code:0 (result_text_for_mode result mode)

let is_prefix prefix path =
  let rec loop prefix path =
    match (prefix, path) with
    | [], _ -> true
    | p :: ps, x :: xs when p = x -> loop ps xs
    | _ -> false
  in
  List.length prefix <= List.length path && loop prefix path

let group_help_path registry path =
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

let profile_status exit_code =
  Edn_util.keyword_t (if exit_code = 0 then "ok" else "error")

let command_name = function
  | Some command -> Command_id.to_string command
  | None -> "unknown"

let profile_lines config result exit_code =
  match config.Cli_config.profile_session with
  | None -> []
  | Some session ->
      Profile_types.report session
        ~command:(command_name result.Cli_result.command)
        ~status:(profile_status exit_code)
      |> Profile_types.render_lines

let human_table_headers_order registry command =
  match command with
  | None -> []
  | Some command ->
      registry.Command_registry.commands
      |> List.find_opt (fun meta -> meta.Command_registry.id = command)
      |> Option.map
           (fun (meta : Command_registry.command_meta) ->
             meta.human_table_headers_order)
      |> Option.value ~default:[]

let with_registry_metadata app result =
  Cli_result.with_human_table_headers_order
    (human_table_headers_order app.registry result.Cli_result.command)
    result

let verbose_line config result =
  if not config.Cli_config.verbose then []
  else
    [
      Melange_edn.to_edn_string
        (Edn_util.map
           [
             (Edn_util.keyword "level", Edn_util.keyword "debug");
             (Edn_util.keyword "message", Edn_util.keyword "cli/parsed-options");
             ( Edn_util.keyword "command",
               Edn_util.string (command_name result.Cli_result.command) );
             (Edn_util.keyword "root-dir", Edn_util.string config.root_dir);
           ]);
    ]

type raw_argv
type parsed_argv
type resolved_config
type built_action
type executed_action
type error
type final
type not_final

type ('phase, 'final) state =
  | Raw_argv_state : run_input -> (raw_argv, not_final) state
  | Parsed_argv_state :
      (run_input * Cli_request.t)
      -> (parsed_argv, not_final) state
  | Resolved_config_state :
      (Cli_config.t * Cli_request.t)
      -> (resolved_config, not_final) state
  | Built_action_state :
      (Cli_config.t * Cli_action.t)
      -> (built_action, not_final) state
  | Executed_action_state :
      (Cli_config.t * Cli_result.t)
      -> (executed_action, final) state
  | Error_state : Error.t -> (error, final) state

let make_error_state err = Error_state err
let make_raw_argv_state _ input = Raw_argv_state input
let parse_request _ input = Cli_parse.parse ?stdin:input.stdin input.argv

let parse_args : type marker.
    app_context ->
    (raw_argv, marker) state ->
    (parsed_argv, not_final) state Error.build_result =
 fun app (Raw_argv_state input) ->
  let input =
    match input.stdin with
    | Some _ -> input
    | None when stdin_required_for_show_id input.argv ->
        { input with stdin = Some (read_stdin_all ()) }
    | None -> input
  in
  let options, positional = parse_tokens input.argv in
  let mode = output_mode_of_options options in
  let help =
    if option_present "version" options then None
    else help_group app.registry options positional
  in
  match help with
  | Some group ->
      Command_registry.render_help ~group app.registry
      |> set_pending_message_output mode;
      Error (Error.unknown_command "")
  | None -> (
      match parse_request app input with
      | Ok request -> Ok (Parsed_argv_state (input, request))
      | Error err ->
          set_pending_error_output mode err;
          Error err)

let resolve_request_config app request input =
  Cli_config.resolve ~defaults:app.defaults ~env:(env_lookup input.env)
    request.Cli_request.globals
  |> Cli_effect.map
       (Error.map (fun r ->
            { r.Cli_config.config with project_dir = Some input.cwd }))

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

let resolve_config : type marker.
    app_context ->
    (parsed_argv, marker) state ->
    (resolved_config, not_final) state Error.build_result Cli_effect.t =
 fun app (Parsed_argv_state (input, request)) ->
  Cli_effect.map
    (fun result ->
      match result with
      | Error err ->
          set_pending_error_output
            ~command:(Cli_request.command_id request)
            (output_mode_of_globals request.Cli_request.globals)
            err;
          Error err
      | Ok config -> (
          match ensure_root_config config with
          | Error err ->
              set_pending_error_output
                ~command:(Cli_request.command_id request)
                (output_mode_of_config config)
                err;
              Error err
          | Ok config ->
              let profile_session =
                Profile_types.create_session config.Cli_config.profile
              in
              Option.iter
                (fun session ->
                  let now = Time.now () in
                  Profile_types.record_span session
                    {
                      stage = "cli.parse-args";
                      span_id = 1;
                      start_time = now;
                      end_time = now;
                      elapsed_span = Time.zero_span;
                    })
                profile_session;
              Ok
                (Resolved_config_state
                   ({ config with Cli_config.profile_session }, request))))
    (resolve_request_config app request input)

let build_request_action app request config =
  match request.Cli_request.command with
  | Cli_request.Completion parsed ->
      Cli_effect.pure
        (Error.map
           (fun action -> Cli_action.Completion action)
           (Completion.build ~registry:app.registry config request.globals
              parsed))
  | _ -> Cli_action.build config request

let build_action : type marker.
    app_context ->
    (resolved_config, marker) state ->
    (built_action, not_final) state Error.build_result Cli_effect.t =
 fun app (Resolved_config_state (config, request)) ->
  Cli_effect.map
    (fun result ->
      match result with
      | Error err ->
          set_pending_error_output
            ~command:(Cli_request.command_id request)
            (output_mode_of_config config)
            err;
          Error err
      | Ok action -> (
          match ensure_action_graph_constraints config action with
          | Error err ->
              set_pending_error_output
                ~command:(Cli_request.command_id request)
                (output_mode_of_config config)
                err;
              Error err
          | Ok () -> Ok (Built_action_state (config, action))))
    (build_request_action app request config)

let execute_action : type marker.
    app_context ->
    (built_action, marker) state ->
    (executed_action, final) state Error.build_result Cli_effect.t =
 fun app (Built_action_state (config, action)) ->
  Cli_effect.map
    (fun result ->
      Ok (Executed_action_state (config, with_registry_metadata app result)))
    (Cli_action.execute action config)

let format_cli_result result config = Format_types.format_result result config

let format_result _ (Executed_action_state (config, result)) =
  format_cli_result result config

let result_exit_code result = Cli_result.exit_code result
let write_stdout_line output = if output <> "" then print_string (output ^ "\n")

let final_effect : type phase. (phase, final) state -> int Cli_effect.t =
  function
  | Executed_action_state (config, result) ->
      let output = format_cli_result result config in
      let exit_code = result_exit_code result in
      write_stdout_line output;
      List.iter prerr_endline (verbose_line config result);
      List.iter prerr_endline (profile_lines config result exit_code);
      flush stdout;
      flush stderr;
      Cli_effect.pure exit_code
  | Error_state err ->
      let output =
        match take_pending_output () with
        | Some output -> output
        | None ->
            {
              stdout = Format_types.format_error err None;
              stderr = [];
              exit_code = 1;
            }
      in
      write_stdout_line output.stdout;
      List.iter prerr_endline output.stderr;
      flush stdout;
      flush stderr;
      Cli_effect.pure output.exit_code
