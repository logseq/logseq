type opts = { shell : Cli_primitive.shell option }
type parsed = Parsed_completion of opts

type action =
  | Completion of {
      shell : Cli_primitive.shell;
      registry : Command_registry.t option;
    }

let join_words words = Vec.string_concat " " words

let unique_preserve values =
  let seen = Hashtbl.create 16 in
  values
  |> Vec.filter (fun value ->
      if Hashtbl.mem seen value then false
      else (
        Hashtbl.add seen value ();
        true))

let top_command_names registry =
  registry.Command_registry.commands
  |> Vec.filter_map (fun command -> Vec.nth_opt command.Command_registry.path 0)
  |> Vec.sort_uniq String.compare

let is_prefix prefix path =
  let rec loop index =
    index = Vec.length prefix
    || (Vec.nth prefix index = Vec.nth path index && loop (index + 1))
  in
  Vec.length prefix <= Vec.length path && loop 0

let commands_under registry prefix =
  registry.Command_registry.commands
  |> Vec.filter (fun command ->
      is_prefix prefix command.Command_registry.path
      && Vec.length command.Command_registry.path > Vec.length prefix)

let direct_children registry prefix =
  let prefix_len = Vec.length prefix in
  commands_under registry prefix
  |> Vec.filter_map (fun command ->
      Vec.nth_opt command.Command_registry.path prefix_len)
  |> unique_preserve

let direct_leaf_children registry prefix =
  let prefix_len = Vec.length prefix in
  commands_under registry prefix
  |> Vec.filter (fun command ->
      Vec.length command.Command_registry.path = prefix_len + 1)

let nested_child_groups registry prefix =
  let prefix_len = Vec.length prefix in
  commands_under registry prefix
  |> Vec.filter_map (fun command ->
      if Vec.length command.Command_registry.path > prefix_len + 1 then
        Vec.nth_opt command.Command_registry.path prefix_len
      else None)
  |> unique_preserve

let is_group registry path = not (Vec.is_empty (commands_under registry path))

let global_option_names =
  Vec.of_array
    [|
      "--help";
      "-h";
      "--version";
      "--config";
      "--graph";
      "-g";
      "--root-dir";
      "--timeout-ms";
      "--output";
      "-o";
      "--verbose";
      "-v";
      "--profile";
    |]

let global_value_option_names =
  Vec.of_array
    [|
      "--config";
      "--graph";
      "-g";
      "--root-dir";
      "--timeout-ms";
      "--output";
      "-o";
    |]

let command_desc_for_path registry path =
  Command_registry.find_by_path path registry
  |> Option.map (fun (command : Command_registry.command_meta) -> command.doc)
  |> Option.value ~default:""

let zsh_quote_entry name desc = "'" ^ name ^ ":" ^ desc ^ "'"

let zsh_leaf_function command =
  let func_name = "_logseq_" ^ join_words command.Command_registry.path in
  let func_name = String.map (function ' ' -> '_' | c -> c) func_name in
  String.concat "\n"
    [
      func_name ^ "() {";
      "  _arguments -s \\";
      "    '--help[Show help]' \\";
      "    '--graph=[Graph name]:value:{_logseq_graphs}' \\";
      "    '--output=[Output format]:value:(human json edn)'";
      "}";
      "";
    ]

let zsh_subgroup_function registry parent subgroup =
  let prefix = Vec.push_back parent subgroup in
  let child_entries =
    direct_leaf_children registry prefix
    |> Vec.map (fun command ->
        "        "
        ^ zsh_quote_entry
            (Vec.nth command.Command_registry.path (Vec.length prefix))
            command.Command_registry.doc)
    |> Vec.string_concat "\n"
  in
  let dispatches =
    direct_leaf_children registry prefix
    |> Vec.map (fun command ->
        let leaf = Vec.nth command.Command_registry.path (Vec.length prefix) in
        "        " ^ leaf ^ ") _logseq_"
        ^ Vec.string_concat "_" command.Command_registry.path
        ^ " ;;")
    |> Vec.string_concat "\n"
  in
  String.concat "\n"
    [
      "_logseq_" ^ Vec.string_concat "_" prefix ^ "() {";
      "  local curcontext=\"$curcontext\" state line";
      "  typeset -A opt_args";
      "  _arguments -C -s \\";
      "    '--help[Show help]' \\";
      "    '--graph=[Graph name]:value:{_logseq_graphs}' \\";
      "    '(-)1:subcommand:->subcmd' \\";
      "    '(-)*::args:->args'";
      "  case $state in";
      "    subcmd)";
      "      local -a subcmds";
      "      subcmds=(";
      child_entries;
      "      )";
      "      _describe 'subcommand' subcmds";
      "      ;;";
      "    args)";
      "      case $line[1] in";
      dispatches;
      "      esac";
      "      ;;";
      "  esac";
      "}";
      "";
    ]

let zsh_group_function registry group =
  let prefix = Vec.singleton group in
  let leaf_entries =
    direct_leaf_children registry prefix
    |> Vec.map (fun command ->
        "        "
        ^ zsh_quote_entry
            (Vec.nth command.Command_registry.path 1)
            command.Command_registry.doc)
  in
  let subgroup_entries =
    nested_child_groups registry prefix
    |> Vec.map (fun name ->
        "        " ^ zsh_quote_entry name (name ^ " commands"))
  in
  let dispatches =
    direct_leaf_children registry prefix
    |> Vec.map (fun command ->
        let subcmd = Vec.nth command.Command_registry.path 1 in
        "        " ^ subcmd ^ ") _logseq_"
        ^ Vec.string_concat "_" command.Command_registry.path
        ^ " ;;")
    |> fun leaf_dispatches ->
    Vec.append leaf_dispatches
      (nested_child_groups registry prefix
      |> Vec.map (fun name ->
          "        " ^ name ^ ") _logseq_" ^ group ^ "_" ^ name ^ " ;;"))
  in
  let subgroup_functions =
    nested_child_groups registry prefix
    |> Vec.map (zsh_subgroup_function registry prefix)
    |> Vec.string_concat "\n"
  in
  subgroup_functions
  ^ String.concat "\n"
      [
        "_logseq_" ^ group ^ "() {";
        "  local curcontext=\"$curcontext\" state line";
        "  typeset -A opt_args";
        "  _arguments -C -s \\";
        "    '--help[Show help]' \\";
        "    '--graph=[Graph name]:value:{_logseq_graphs}' \\";
        "    '(-)1:subcommand:->subcmd' \\";
        "    '(-)*::args:->args'";
        "  case $state in";
        "    subcmd)";
        "      local -a subcmds";
        "      subcmds=(";
        Vec.string_concat "\n" (Vec.append leaf_entries subgroup_entries);
        "      )";
        "      _describe 'subcommand' subcmds";
        "      ;;";
        "    args)";
        "      case $line[1] in";
        Vec.string_concat "\n" dispatches;
        "      esac";
        "      ;;";
        "  esac";
        "}";
        "";
      ]

let generate_zsh_completion registry =
  let top_entries =
    top_command_names registry
    |> Vec.map (fun top ->
        let desc =
          let path = Vec.singleton top in
          if is_group registry path then top ^ " commands"
          else command_desc_for_path registry path
        in
        "        " ^ zsh_quote_entry top desc)
    |> Vec.string_concat "\n"
  in
  let dispatches =
    top_command_names registry
    |> Vec.map (fun top -> "        " ^ top ^ ") _logseq_" ^ top ^ " ;;")
    |> Vec.string_concat "\n"
  in
  let leaf_functions =
    registry.Command_registry.commands
    |> Vec.filter (fun command -> Vec.length command.Command_registry.path = 1)
    |> Vec.map zsh_leaf_function |> Vec.string_concat "\n"
  in
  let group_functions =
    top_command_names registry
    |> Vec.filter (fun top -> is_group registry (Vec.singleton top))
    |> Vec.map (zsh_group_function registry)
    |> Vec.string_concat "\n"
  in
  String.concat "\n"
    [
      "#compdef logseq";
      "# Auto-generated by `logseq completion zsh` - do not edit manually.";
      "";
      "_logseq_graphs() {";
      "  logseq graph list 2>/dev/null | sed -n 's/^[* ]*//p' | sed \
       '/^Count:/d'";
      "}";
      "";
      "# --- per-command functions ---";
      "";
      leaf_functions;
      "# --- group dispatchers ---";
      "";
      group_functions;
      "# --- top-level dispatcher ---";
      "";
      "_logseq() {";
      "  local curcontext=\"$curcontext\" state line";
      "  typeset -A opt_args";
      "  _arguments -C -s \\";
      "    '--help[Show help]' \\";
      "    '--version[Show version]' \\";
      "    '--config=[Path to cli.edn]:file:_files' \\";
      "    '--graph=[Graph name]:value:{_logseq_graphs}' \\";
      "    '--root-dir=[Path to CLI root dir]:dir:_files -/' \\";
      "    '--timeout-ms=[Request timeout in ms]:value:' \\";
      "    '--output=[Output format]:value:(human json edn)' \\";
      "    '--verbose[Enable verbose debug logging to stderr]' \\";
      "    '--profile[Enable stage timing profile output to stderr]' \\";
      "    '(-)1:command:->cmds' \\";
      "    '(-)*::args:->args'";
      "  case $state in";
      "    cmds)";
      "      local -a cmds";
      "      cmds=(";
      top_entries;
      "      )";
      "      _describe 'command' cmds";
      "      ;;";
      "    args)";
      "      case $line[1] in";
      dispatches;
      "      esac";
      "      ;;";
      "  esac";
      "}";
      "";
      "compdef _logseq logseq";
    ]

let bash_case_pattern names = Vec.string_concat "|" names

let bash_subcommand_cases registry =
  top_command_names registry
  |> Vec.filter_map (fun top ->
      let children = direct_children registry (Vec.singleton top) in
      if Vec.is_empty children then None
      else
        Some
          ("      " ^ top ^ ") COMPREPLY=( $(compgen -W '"
          ^ Vec.string_concat " " children
          ^ "' -- \"$cur\") ) ;;"))
  |> Vec.string_concat "\n"

let bash_sub_subcommand_cases registry =
  top_command_names registry
  |> Vec.concat_map (fun top ->
      nested_child_groups registry (Vec.singleton top)
      |> Vec.map (fun subgroup ->
          let leaves =
            direct_children registry (Vec.of_array [| top; subgroup |])
          in
          "      " ^ top ^ ":" ^ subgroup ^ ") COMPREPLY=( $(compgen -W '"
          ^ Vec.string_concat " " leaves
          ^ "' -- \"$cur\") ) ;;"))
  |> Vec.string_concat "\n"

let generate_bash_completion registry =
  let top_commands = Vec.string_concat " " (top_command_names registry) in
  String.concat "\n"
    [
      "# Auto-generated by `logseq completion bash` - do not edit manually.";
      "";
      "_logseq_is_value_opt() {";
      "  case \"$1\" in";
      "    " ^ bash_case_pattern global_value_option_names ^ ")";
      "      return 0 ;;";
      "    *) return 1 ;;";
      "  esac";
      "}";
      "";
      "_logseq_cmd_and_subcmd() {";
      "  local i skip=0";
      "  __cmd='' __subcmd='' __subsubcmd=''";
      "  for (( i = 1; i < COMP_CWORD; i++ )); do";
      "    local w=\"${COMP_WORDS[i]}\"";
      "    if (( skip )); then skip=0; continue; fi";
      "    if [[ \"$w\" == -* ]]; then";
      "      _logseq_is_value_opt \"$w\" && skip=1";
      "      continue";
      "    fi";
      "    if [[ -z \"$__cmd\" ]]; then __cmd=\"$w\"";
      "    elif [[ -z \"$__subcmd\" ]]; then __subcmd=\"$w\"";
      "    elif [[ -z \"$__subsubcmd\" ]]; then __subsubcmd=\"$w\"";
      "    fi";
      "  done";
      "}";
      "";
      "_logseq_json_names_bash() {";
      "  logseq graph list --output json 2>/dev/null | node -e 'const fs = \
       require(\"fs\"); const input = fs.readFileSync(0, \"utf8\"); if \
       (!input.trim()) process.exit(0); const data = JSON.parse(input); const \
       graphs = data && data.data && data.data.graphs; if \
       (Array.isArray(graphs)) console.log(graphs.join(\" \"));'";
      "}";
      "";
      "_logseq_opts_for() {";
      "  printf '%s' \"" ^ Vec.string_concat " " global_option_names ^ "\"";
      "}";
      "";
      "_logseq() {";
      "  local cur prev";
      "  cur=\"${COMP_WORDS[COMP_CWORD]}\"";
      "  prev=\"${COMP_WORDS[COMP_CWORD-1]}\"";
      "  COMPREPLY=()";
      "  local __cmd __subcmd __subsubcmd";
      "  _logseq_cmd_and_subcmd";
      "  if [[ \"$cur\" == -* ]]; then";
      "    COMPREPLY=( $(compgen -W \"$(_logseq_opts_for \"$__cmd\" \
       \"$__subcmd\" \"$__subsubcmd\")\" -- \"$cur\") )";
      "    return";
      "  fi";
      "  if [[ -z \"$__cmd\" ]]; then";
      "    COMPREPLY=( $(compgen -W '" ^ top_commands ^ "' -- \"$cur\") )";
      "    return";
      "  fi";
      "  if [[ -z \"$__subcmd\" ]]; then";
      "    case \"$__cmd\" in";
      bash_subcommand_cases registry;
      "    esac";
      "    return";
      "  fi";
      "  if [[ -z \"$__subsubcmd\" ]]; then";
      "    case \"$__cmd:$__subcmd\" in";
      bash_sub_subcommand_cases registry;
      "    esac";
      "    return";
      "  fi";
      "}";
      "";
      "complete -F _logseq logseq";
    ]

let generate shell registry =
  match shell with
  | Cli_primitive.Zsh -> generate_zsh_completion registry
  | Bash -> generate_bash_completion registry

let command_id _ = Command_id.Completion
let validate_parsed _ = Ok ()

let build ?registry _config _ = function
  | Parsed_completion { shell = Some shell } ->
      Ok (Completion { shell; registry })
  | Parsed_completion { shell = None } ->
      Error
        (Error.invalid_options
           "completion shell is required; expected zsh or bash")

let execute_with_mode (Completion { shell; registry }) _config mode =
  Cli_effect.pure
    (Cli_result.ok ~command:Command_id.Completion mode
       (Message
          (generate shell
             (Option.value registry ~default:Command_registry.empty))))

let metadata () =
  Vec.of_array
    [|
      {
        Command_registry.id = Command_id.Completion;
        path = Command_id.to_path Command_id.Completion;
        doc = "Generate shell completion script";
        long_doc = None;
        examples = Vec.empty;
        options = Vec.empty;
        category = Command_registry.Utilities;
        requires_graph = Command_id.requires_graph Command_id.Completion;
        requires_auth = Command_id.requires_auth Command_id.Completion;
        write_command = Command_id.is_write Command_id.Completion;
        human_table_headers_order = Vec.empty;
      };
    |]

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
