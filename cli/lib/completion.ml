type opts = { shell : Cli_primitive.shell option }
type parsed = Parsed_completion of opts

type action =
  | Completion of {
      shell : Cli_primitive.shell;
      registry : Command_registry.t option;
    }

let join_words words = String.concat " " words

let unique_preserve values =
  let seen = Hashtbl.create 16 in
  values
  |> List.filter (fun value ->
      if Hashtbl.mem seen value then false
      else (
        Hashtbl.add seen value ();
        true))

let top_command_names registry =
  registry.Command_registry.commands
  |> List.filter_map (fun command ->
      match command.Command_registry.path with
      | top :: _ -> Some top
      | [] -> None)
  |> List.sort_uniq String.compare

let is_prefix prefix path =
  let rec loop prefix path =
    match (prefix, path) with
    | [], _ -> true
    | p :: ps, x :: xs when p = x -> loop ps xs
    | _ -> false
  in
  List.length prefix <= List.length path && loop prefix path

let commands_under registry prefix =
  registry.Command_registry.commands
  |> List.filter (fun command ->
      is_prefix prefix command.Command_registry.path
      && List.length command.Command_registry.path > List.length prefix)

let direct_children registry prefix =
  let prefix_len = List.length prefix in
  commands_under registry prefix
  |> List.filter_map (fun command ->
      List.nth_opt command.Command_registry.path prefix_len)
  |> unique_preserve

let direct_leaf_children registry prefix =
  let prefix_len = List.length prefix in
  commands_under registry prefix
  |> List.filter (fun command ->
      List.length command.Command_registry.path = prefix_len + 1)

let nested_child_groups registry prefix =
  let prefix_len = List.length prefix in
  commands_under registry prefix
  |> List.filter_map (fun command ->
      if List.length command.Command_registry.path > prefix_len + 1 then
        List.nth_opt command.Command_registry.path prefix_len
      else None)
  |> unique_preserve

let is_group registry path = commands_under registry path <> []

let global_option_names =
  [
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
  ]

let global_value_option_names =
  [
    "--config"; "--graph"; "-g"; "--root-dir"; "--timeout-ms"; "--output"; "-o";
  ]

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
  let prefix = parent @ [ subgroup ] in
  let child_entries =
    direct_leaf_children registry prefix
    |> List.map (fun command ->
        "        "
        ^ zsh_quote_entry
            (List.nth command.Command_registry.path (List.length prefix))
            command.Command_registry.doc)
    |> String.concat "\n"
  in
  let dispatches =
    direct_leaf_children registry prefix
    |> List.map (fun command ->
        let leaf =
          List.nth command.Command_registry.path (List.length prefix)
        in
        "        " ^ leaf ^ ") _logseq_"
        ^ String.concat "_" command.Command_registry.path
        ^ " ;;")
    |> String.concat "\n"
  in
  String.concat "\n"
    [
      "_logseq_" ^ String.concat "_" prefix ^ "() {";
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
  let prefix = [ group ] in
  let leaf_entries =
    direct_leaf_children registry prefix
    |> List.map (fun command ->
        "        "
        ^ zsh_quote_entry
            (List.nth command.Command_registry.path 1)
            command.Command_registry.doc)
  in
  let subgroup_entries =
    nested_child_groups registry prefix
    |> List.map (fun name ->
        "        " ^ zsh_quote_entry name (name ^ " commands"))
  in
  let dispatches =
    (direct_leaf_children registry prefix
    |> List.map (fun command ->
        let subcmd = List.nth command.Command_registry.path 1 in
        "        " ^ subcmd ^ ") _logseq_"
        ^ String.concat "_" command.Command_registry.path
        ^ " ;;"))
    @ (nested_child_groups registry prefix
      |> List.map (fun name ->
          "        " ^ name ^ ") _logseq_" ^ group ^ "_" ^ name ^ " ;;"))
  in
  let subgroup_functions =
    nested_child_groups registry prefix
    |> List.map (zsh_subgroup_function registry prefix)
    |> String.concat "\n"
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
        String.concat "\n" (leaf_entries @ subgroup_entries);
        "      )";
        "      _describe 'subcommand' subcmds";
        "      ;;";
        "    args)";
        "      case $line[1] in";
        String.concat "\n" dispatches;
        "      esac";
        "      ;;";
        "  esac";
        "}";
        "";
      ]

let generate_zsh_completion registry =
  let top_entries =
    top_command_names registry
    |> List.map (fun top ->
        let desc =
          if is_group registry [ top ] then top ^ " commands"
          else command_desc_for_path registry [ top ]
        in
        "        " ^ zsh_quote_entry top desc)
    |> String.concat "\n"
  in
  let dispatches =
    top_command_names registry
    |> List.map (fun top -> "        " ^ top ^ ") _logseq_" ^ top ^ " ;;")
    |> String.concat "\n"
  in
  let leaf_functions =
    registry.Command_registry.commands
    |> List.filter (fun command ->
        List.length command.Command_registry.path = 1)
    |> List.map zsh_leaf_function |> String.concat "\n"
  in
  let group_functions =
    top_command_names registry
    |> List.filter (fun top -> is_group registry [ top ])
    |> List.map (zsh_group_function registry)
    |> String.concat "\n"
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

let bash_case_pattern names = String.concat "|" names

let bash_subcommand_cases registry =
  top_command_names registry
  |> List.filter_map (fun top ->
      let children = direct_children registry [ top ] in
      if children = [] then None
      else
        Some
          ("      " ^ top ^ ") COMPREPLY=( $(compgen -W '"
         ^ String.concat " " children ^ "' -- \"$cur\") ) ;;"))
  |> String.concat "\n"

let bash_sub_subcommand_cases registry =
  top_command_names registry
  |> List.concat_map (fun top ->
      nested_child_groups registry [ top ]
      |> List.map (fun subgroup ->
          let leaves = direct_children registry [ top; subgroup ] in
          "      " ^ top ^ ":" ^ subgroup ^ ") COMPREPLY=( $(compgen -W '"
          ^ String.concat " " leaves ^ "' -- \"$cur\") ) ;;"))
  |> String.concat "\n"

let generate_bash_completion registry =
  let top_commands = String.concat " " (top_command_names registry) in
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
      "_logseq_opts_for() {";
      "  printf '%s' \"" ^ String.concat " " global_option_names ^ "\"";
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

let build ?registry config _ = function
  | Parsed_completion { shell } ->
      Ok
        (Completion
           { shell = Option.value shell ~default:Cli_primitive.Zsh; registry })

let execute (Completion { shell; registry }) _config mode =
  Cli_effect.pure
    (Cli_result.ok ~command:Command_id.Completion mode
       (Message
          (generate shell
             (Option.value registry ~default:Command_registry.empty))))

let metadata () =
  [
    {
      Command_registry.id = Command_id.Completion;
      path = Command_id.to_path Command_id.Completion;
      doc = "Generate shell completion script";
      long_doc = None;
      examples = [];
      options = [];
      category = Command_registry.Utilities;
      requires_graph = Command_id.requires_graph Command_id.Completion;
      requires_auth = Command_id.requires_auth Command_id.Completion;
      write_command = Command_id.is_write Command_id.Completion;
    };
  ]
