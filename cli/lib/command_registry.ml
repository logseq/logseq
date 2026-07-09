type category =
  | Graph_inspect_and_edit
  | Graph_management
  | Authentication
  | Utilities
  | Hidden

type option_arity = Flag | Required_value of string | Optional_value of string

type option_meta = {
  names : string Rrbvec.t;
  arity : option_arity;
  doc : string;
  required : bool;
  repeatable : bool;
  choices : string Rrbvec.t;
  default : string option;
}

type command_meta = {
  id : Command_id.t;
  path : string Rrbvec.t;
  doc : string;
  long_doc : string option;
  examples : string Rrbvec.t;
  options : option_meta Rrbvec.t;
  category : category;
  requires_graph : bool;
  requires_auth : bool;
  write_command : bool;
  human_table_headers_order : string Rrbvec.t;
}

type group_meta = {
  name : string;
  doc : string;
  category : category;
  children : string Rrbvec.t Rrbvec.t;
}

type t = { commands : command_meta Rrbvec.t; groups : group_meta Rrbvec.t }

let append_all values = Array.fold_left Vec.append Vec.empty values

let option ?(required = false) ?(repeatable = false) ?(choices = Vec.empty)
    ?default names arity doc =
  { names; arity; doc; required; repeatable; choices; default }

let option_of_array ?required ?repeatable ?choices ?default names arity doc =
  option ?required ?repeatable ?choices ?default (Vec.of_array names) arity doc

let flag ?required ?repeatable ?choices ?default name doc =
  option ?required ?repeatable ?choices ?default
    (Vec.singleton ("--" ^ name))
    Flag doc

let value ?required ?repeatable ?choices ?default name value_name doc =
  option ?required ?repeatable ?choices ?default
    (Vec.singleton ("--" ^ name))
    (Required_value value_name) doc

let optional_value ?required ?repeatable ?choices ?default name value_name doc =
  option ?required ?repeatable ?choices ?default
    (Vec.singleton ("--" ^ name))
    (Optional_value value_name) doc

let output_choices = Vec.of_array [| "human"; "json"; "edn" |]
let order_choices = Vec.of_array [| "asc"; "desc" |]
let graph_data_choices = Vec.of_array [| "edn"; "sqlite" |]
let position_choices = Vec.of_array [| "first-child"; "last-child"; "sibling" |]

let property_type_choices =
  Vec.of_array [| "default"; "number"; "date"; "checkbox"; "url" |]

let cardinality_choices = Vec.of_array [| "one"; "many" |]

let list_page_sort_choices =
  Vec.of_array [| "id"; "title"; "ident"; "uuid"; "created-at"; "updated-at" |]

let list_tag_sort_choices =
  Vec.of_array
    [|
      "id";
      "title";
      "ident";
      "uuid";
      "properties";
      "extends";
      "description";
      "created-at";
      "updated-at";
    |]

let list_property_sort_choices =
  Vec.of_array
    [|
      "id";
      "title";
      "ident";
      "uuid";
      "classes";
      "type";
      "cardinality";
      "description";
      "created-at";
      "updated-at";
    |]

let list_task_sort_choices =
  Vec.of_array
    [|
      "id";
      "title";
      "status";
      "priority";
      "scheduled";
      "deadline";
      "created-at";
      "updated-at";
    |]

let list_node_sort_choices =
  Vec.of_array
    [|
      "id"; "title"; "type"; "page-id"; "page-title"; "created-at"; "updated-at";
    |]

let list_asset_sort_choices =
  Vec.of_array
    [| "id"; "title"; "asset-type"; "size"; "created-at"; "updated-at" |]

let search_result_header_order = Vec.of_array [| "id"; "ident"; "title" |]

let human_table_headers_order_for_command = function
  | Command_id.List_page -> list_page_sort_choices
  | List_tag -> list_tag_sort_choices
  | List_property -> list_property_sort_choices
  | List_task -> list_task_sort_choices
  | List_node -> list_node_sort_choices
  | List_asset ->
      Vec.of_array
        [|
          "id";
          "title";
          "size";
          "type";
          "checksum";
          "remote-metadata";
          "created-at";
          "updated-at";
        |]
  | Search_block | Search_page | Search_property | Search_tag ->
      search_result_header_order
  | _ -> Vec.empty

let global_options =
  Vec.of_array
    [|
      option (Vec.singleton "--config") (Required_value "path")
        "Path to cli.edn (default <root-dir>/cli.edn)";
      option_of_array [| "-g"; "--graph" |] (Required_value "graph")
        "Graph name";
      option
        (Vec.singleton "--root-dir")
        (Required_value "path") "Path to CLI root dir (default ~/logseq)";
      option
        (Vec.singleton "--timeout-ms")
        (Required_value "ms") "Request timeout in ms (default 10000)";
      option_of_array [| "-o"; "--output" |] (Required_value "mode")
        ~choices:output_choices ~default:"human" "Output format";
      option_of_array [| "-v"; "--verbose" |] Flag
        "Enable verbose debug logging to stderr";
      option
        (Vec.singleton "--profile")
        Flag "Enable stage timing profile output to stderr";
      option_of_array [| "-h"; "--help" |] Flag "Show command help";
      option (Vec.singleton "--version") Flag "Show CLI version";
    |]

let common_list_options sort_choices =
  Vec.of_array
    [|
      value "fields" "fields" "Comma-separated fields to include"
        ~choices:sort_choices;
      value "limit" "n" "Maximum result count";
      value "offset" "n" "Result offset";
      value "sort" "field" "Sort field" ~choices:sort_choices;
      value "order" "order" "Sort order" ~choices:order_choices;
    |]

let selector_options =
  Vec.of_array
    [| value "id" "id" "Entity id"; value "uuid" "uuid" "Entity UUID" |]

let target_options =
  Vec.of_array
    [|
      value "target-id" "id" "Target block id";
      value "target-uuid" "uuid" "Target block UUID";
      value "target-page" "page" "Target page name";
      value "pos" "position" "Insert position" ~choices:position_choices;
    |]

let property_update_options =
  Vec.of_array
    [|
      value "update-tags" "edn" "Tags to add or update";
      value "update-properties" "edn" "Properties to add or update";
      value "remove-tags" "edn" "Tags to remove";
      value "remove-properties" "edn" "Properties to remove";
    |]

let content_search_options =
  Vec.singleton (value "content" "text" "Content search text")

let e2ee_password_option = value "e2ee-password" "password" "E2EE password"

let options_for_command =
  let empty = Vec.empty in
  function
  | Command_id.Version | Graph_list | Graph_switch | Graph_remove | Graph_info
  | Graph_backup_list ->
      empty
  | Graph_create ->
      Vec.of_array [| flag "enable-sync" "Enable sync"; e2ee_password_option |]
  | Graph_validate ->
      Vec.of_array
        [|
          option_of_array [| "-f"; "--fix" |] Flag "Fix validation problems";
          value "fields" "fields" "Fields to include";
        |]
  | Graph_backup_create -> Vec.singleton (value "name" "name" "Backup name")
  | Graph_backup_restore ->
      Vec.of_array
        [|
          value ~required:true "src" "backup" "Source backup name";
          value ~required:true "dst" "graph" "Destination graph name";
        |]
  | Graph_backup_remove ->
      Vec.singleton (value ~required:true "src" "backup" "Source backup name")
  | Graph_export ->
      Vec.of_array
        [|
          value "type" "type" "Export type" ~choices:graph_data_choices;
          value "file" "path" "Output file";
          option_of_array
            [| "-e"; "--edn-options" |]
            (Required_value "edn")
            "EDN map of export options; :export-type overrides the default \
             :graph";
          option_of_array
            [| "-p"; "--pretty-print" |]
            Flag "Pretty-print the exported EDN file";
        |]
  | Graph_import ->
      Vec.of_array
        [|
          value ~required:true "type" "type" "Import type"
            ~choices:graph_data_choices;
          value ~required:true "input" "path" "Input file";
        |]
  | List_page ->
      Vec.append
        (common_list_options list_page_sort_choices)
        (Vec.of_array
           [|
             flag "expand" "Expand page data";
             optional_value "include-built-in" "bool" "Include built-in pages";
             optional_value "include-journal" "bool" "Include journal pages";
             flag "journal-only" "Only include journal pages";
             flag "include-hidden" "Include hidden pages";
             value "updated-after" "timestamp"
               "Only include pages updated after timestamp";
             value "created-after" "timestamp"
               "Only include pages created after timestamp";
           |])
  | List_tag ->
      Vec.append
        (common_list_options list_tag_sort_choices)
        (Vec.of_array
           [|
             flag "expand" "Expand tag data";
             optional_value "include-built-in" "bool" "Include built-in tags";
             flag "with-properties" "Include properties";
             flag "with-extends" "Include extends data";
           |])
  | List_property ->
      Vec.append
        (common_list_options list_property_sort_choices)
        (Vec.of_array
           [|
             flag "expand" "Expand property data";
             optional_value "include-built-in" "bool"
               "Include built-in properties";
             flag "with-classes" "Include classes";
             flag "with-type" "Include property type";
           |])
  | List_task ->
      Vec.append
        (common_list_options list_task_sort_choices)
        (Vec.of_array
           [|
             value "status" "status" "Task status";
             value "priority" "priority" "Task priority";
             value "content" "text" "Task content filter";
           |])
  | List_node ->
      Vec.append
        (common_list_options list_node_sort_choices)
        (Vec.of_array
           [|
             value "tags" "tags" "Comma-separated tag filters";
             value "properties" "properties" "Comma-separated property filters";
           |])
  | List_asset -> common_list_options list_asset_sort_choices
  | Remove_block -> selector_options
  | Remove_page ->
      Vec.of_array
        [| value "id" "id" "Page id"; value "page" "page" "Page name" |]
  | Remove_tag | Remove_property ->
      Vec.of_array
        [| value "id" "id" "Entity id"; value "name" "name" "Entity name" |]
  | Upsert_block ->
      append_all
        [|
          selector_options;
          target_options;
          Vec.of_array
            [|
              value "content" "text" "Block content";
              value "blocks" "edn" "Blocks EDN";
              value "blocks-file" "path" "Path to blocks EDN file";
            |];
          property_update_options;
        |]
  | Upsert_page ->
      append_all
        [|
          Vec.of_array
            [|
              value "id" "id" "Page id";
              value "page" "page" "Page name";
              flag "restore" "Restore recycled page before updating";
            |];
          property_update_options;
        |]
  | Upsert_asset ->
      append_all
        [|
          selector_options;
          Vec.singleton (value "path" "path" "Asset path");
          target_options;
          Vec.singleton (value "content" "text" "Asset content");
        |]
  | Upsert_task ->
      append_all
        [|
          selector_options;
          Vec.of_array
            [|
              value "page" "page" "Page name";
              value "content" "text" "Task content";
            |];
          target_options;
          Vec.of_array
            [|
              value "status" "status" "Task status";
              value "priority" "priority" "Task priority";
              value "scheduled" "date" "Scheduled date";
              value "deadline" "date" "Deadline date";
              flag "no-status" "Remove status";
              flag "no-priority" "Remove priority";
              flag "no-scheduled" "Remove scheduled date";
              flag "no-deadline" "Remove deadline date";
            |];
        |]
  | Upsert_tag ->
      Vec.of_array
        [|
          value "id" "id" "Tag id";
          value "name" "name" "Tag name";
          value "add-properties" "edn" "Tag schema properties to add";
          value "remove-properties" "edn" "Tag schema properties to remove";
        |]
  | Upsert_property ->
      Vec.of_array
        [|
          value "id" "id" "Property id";
          value "name" "name" "Property name";
          value "type" "type" "Property type" ~choices:property_type_choices;
          value "cardinality" "cardinality" "Property cardinality"
            ~choices:cardinality_choices;
          optional_value "hide" "bool" "Hide property";
          optional_value "public" "bool" "Make property public";
        |]
  | Search_block | Search_page | Search_property | Search_tag ->
      content_search_options
  | Query_list -> empty
  | Query ->
      Vec.of_array
        [|
          value "query" "edn" "Datascript query";
          value "name" "name" "Saved query name";
          value "inputs" "edn" "Query inputs";
        |]
  | Show ->
      Vec.of_array
        [|
          optional_value "id" "id" "Entity id";
          value "uuid" "uuid" "Entity UUID";
          value "page" "page" "Page name";
          optional_value "page-hierarchy" "bool" "Show page hierarchy";
          optional_value "linked-references" "bool" "Show linked references";
          optional_value "ref-id-footer" "bool" "Show reference id footer";
          value "level" "n" "Tree depth";
        |]
  | Server_list | Server_cleanup | Server_start | Server_stop | Server_restart
  | Sync_status | Sync_stop | Sync_remote_graphs | Sync_config_get
  | Sync_config_unset | Sync_config_set | Login | Logout | Agent_bridge
  | Example | Skill_show ->
      empty
  | Sync_start | Sync_upload -> Vec.singleton e2ee_password_option
  | Sync_download ->
      Vec.of_array [| flag "progress" "Stream progress"; e2ee_password_option |]
  | Sync_asset_download -> selector_options
  | Sync_ensure_keys ->
      Vec.of_array
        [| e2ee_password_option; flag "upload-keys" "Upload sync keys" |]
  | Sync_grant_access ->
      Vec.of_array
        [|
          value "graph-id" "graph-id" "Remote graph id";
          value "email" "email" "Account email";
        |]
  | Debug_pull ->
      Vec.append selector_options
        (Vec.singleton (value "ident" "ident" "Entity ident"))
  | Doctor -> Vec.singleton (flag "dev-script" "Use development script")
  | Completion ->
      Vec.singleton
        (value "shell" "shell" "Completion shell"
           ~choices:(Vec.of_array [| "zsh"; "bash" |]))
  | Skill_install -> Vec.singleton (flag "global" "Install globally")

let with_catalog_options command =
  let options =
    if Vec.is_empty command.options then options_for_command command.id
    else command.options
  in
  let human_table_headers_order =
    if Vec.is_empty command.human_table_headers_order then
      human_table_headers_order_for_command command.id
    else command.human_table_headers_order
  in
  { command with options; human_table_headers_order }

let empty = { commands = Vec.empty; groups = Vec.empty }

let make commands =
  { commands = Vec.map with_catalog_options commands; groups = Vec.empty }

let add command t =
  { t with commands = Vec.push_front t.commands (with_catalog_options command) }

let find_by_path path t = Vec.find_opt (fun c -> c.path = path) t.commands

let top_level_group_doc = function
  | "agent" -> Some "Agent bridge commands"
  | "debug" -> Some "Debug commands"
  | "graph" -> Some "Manage graphs"
  | "list" -> Some "List graph entities"
  | "remove" -> Some "Remove graph entities"
  | "search" -> Some "Search graph entities"
  | "server" -> Some "Manage db-worker-node servers"
  | "skill" -> Some "Manage built-in logseq-cli skill"
  | "sync" -> Some "Manage Logseq sync"
  | "upsert" -> Some "Create or update graph entities"
  | _ -> None

let is_prefix prefix path =
  let rec loop index =
    index = Vec.length prefix
    || (Vec.nth prefix index = Vec.nth path index && loop (index + 1))
  in
  Vec.length prefix <= Vec.length path && loop 0

let option_label option =
  let names = Vec.string_concat ", " option.names in
  match option.arity with
  | Flag -> names
  | Required_value value_name -> names ^ " <" ^ value_name ^ ">"
  | Optional_value value_name -> names ^ " [<" ^ value_name ^ ">]"

let option_doc option =
  let suffixes =
    Vec.append
      (if Vec.is_empty option.choices then Vec.empty
       else Vec.singleton ("choices: " ^ Vec.string_concat ", " option.choices))
      (match option.default with
      | None -> Vec.empty
      | Some default -> Vec.singleton ("default: " ^ default))
  in
  if Vec.is_empty suffixes then option.doc
  else option.doc ^ " (" ^ Vec.string_concat "; " suffixes ^ ")"

let format_rows rows =
  let width =
    rows |> Vec.fold_left (fun acc (name, _) -> max acc (String.length name)) 0
  in
  rows
  |> Vec.map (fun (name, doc) ->
      let padding = String.make (max 0 (width - String.length name)) ' ' in
      if doc = "" then "  " ^ name else "  " ^ name ^ padding ^ "  " ^ doc)
  |> Vec.string_concat "\n"

let format_options options =
  options
  |> Vec.map (fun option -> (option_label option, option_doc option))
  |> format_rows

let render_help ?group (t : t) =
  let join_words words = Vec.string_concat " " words in
  let command_label command = join_words command.path in
  let global_options_help = format_options global_options in
  let top_level_entries () =
    let seen = Hashtbl.create 16 in
    let doc_for_top top fallback =
      match find_by_path (Vec.singleton top) t with
      | Some command -> command.doc
      | None -> Option.value (top_level_group_doc top) ~default:fallback
    in
    t.commands
    |> Vec.filter_map (fun command ->
        match Vec.nth_opt command.path 0 with
        | Some top when not (Hashtbl.mem seen top) ->
            Hashtbl.add seen top ();
            Some (top, doc_for_top top command.doc)
        | _ -> None)
  in
  let top_level_help () =
    Vec.string_concat "\n"
      (Vec.of_array
         [|
           "Usage: logseq <command> [options]";
           "";
           "Commands:";
           format_rows (top_level_entries ());
           "";
           "Available commands:";
           format_rows
             (t.commands
             |> Vec.filter (fun (command : command_meta) ->
                 command.category <> Hidden)
             |> Vec.map (fun (command : command_meta) ->
                 (command_label command, command.doc)));
           "";
           "Global options:";
           global_options_help;
           "";
           "Command options:";
           "  See `logseq <command> --help`";
         |])
  in
  let group_help group =
    let rows =
      t.commands
      |> Vec.filter (fun command -> is_prefix group command.path)
      |> Vec.map (fun command -> (command_label command, command.doc))
    in
    Vec.string_concat "\n"
      (Vec.of_array
         [|
           "Usage: logseq " ^ join_words group ^ " <subcommand> [options]";
           "";
           "Subcommands:";
           format_rows rows;
           "";
           "Global options:";
           global_options_help;
           "";
           "Command options:";
           "  See `logseq " ^ join_words group ^ " <subcommand> --help`";
         |])
  in
  let command_options_help command =
    if Vec.is_empty command.options then "  None"
    else format_options command.options
  in
  let command_help command =
    let examples =
      if Vec.is_empty command.examples then Vec.empty
      else
        Vec.append
          (Vec.of_array [| ""; "Examples:" |])
          (command.examples |> Vec.map (fun example -> "  " ^ example))
    in
    Vec.string_concat "\n"
      (Vec.append
         (Vec.of_array
            [|
              "Usage: logseq " ^ command_label command ^ " [options]";
              "";
              "Global options:";
              global_options_help;
              "";
              "Command options:";
              command_options_help command;
            |])
         examples)
  in
  match group with
  | None -> top_level_help ()
  | Some group when Vec.is_empty group -> top_level_help ()
  | Some group -> (
      match find_by_path group t with
      | Some command -> command_help command
      | None -> group_help group)
