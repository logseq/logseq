type category =
  | Graph_inspect_and_edit
  | Graph_management
  | Authentication
  | Utilities
  | Hidden

type option_arity = Flag | Required_value of string | Optional_value of string

type option_meta = {
  names : string list;
  arity : option_arity;
  doc : string;
  required : bool;
  repeatable : bool;
  choices : string list;
  default : string option;
}

type command_meta = {
  id : Command_id.t;
  path : string list;
  doc : string;
  long_doc : string option;
  examples : string list;
  options : option_meta list;
  category : category;
  requires_graph : bool;
  requires_auth : bool;
  write_command : bool;
  human_table_headers_order : string list;
}

type group_meta = {
  name : string;
  doc : string;
  category : category;
  children : string list list;
}

type t = { commands : command_meta list; groups : group_meta list }

let option ?(required = false) ?(repeatable = false) ?(choices = []) ?default
    names arity doc =
  { names; arity; doc; required; repeatable; choices; default }

let flag ?required ?repeatable ?choices ?default name doc =
  option ?required ?repeatable ?choices ?default [ "--" ^ name ] Flag doc

let value ?required ?repeatable ?choices ?default name value_name doc =
  option ?required ?repeatable ?choices ?default
    [ "--" ^ name ]
    (Required_value value_name) doc

let optional_value ?required ?repeatable ?choices ?default name value_name doc =
  option ?required ?repeatable ?choices ?default
    [ "--" ^ name ]
    (Optional_value value_name) doc

let output_choices = [ "human"; "json"; "edn" ]
let order_choices = [ "asc"; "desc" ]
let graph_data_choices = [ "edn"; "sqlite" ]
let position_choices = [ "first-child"; "last-child"; "sibling" ]
let property_type_choices = [ "default"; "number"; "date"; "checkbox"; "url" ]
let cardinality_choices = [ "one"; "many" ]

let list_page_sort_choices =
  [ "id"; "title"; "ident"; "uuid"; "created-at"; "updated-at" ]

let list_tag_sort_choices =
  [ "id"; "title"; "ident"; "uuid"; "properties"; "extends"; "description" ]
  @ [ "created-at"; "updated-at" ]

let list_property_sort_choices =
  [ "id"; "title"; "ident"; "uuid"; "classes"; "type"; "cardinality"; "description" ]
  @ [ "created-at"; "updated-at" ]

let list_task_sort_choices =
  [
    "id";
    "title";
    "status";
    "priority";
    "scheduled";
    "deadline";
    "created-at";
    "updated-at";
  ]

let list_node_sort_choices =
  [ "id"; "title"; "type"; "page-id"; "page-title"; "created-at"; "updated-at" ]

let list_asset_sort_choices =
  [ "id"; "title"; "asset-type"; "size"; "created-at"; "updated-at" ]

let search_result_header_order = [ "id"; "ident"; "title" ]

let human_table_headers_order_for_known_path = function
  | [ "list"; "page" ] -> list_page_sort_choices
  | [ "list"; "tag" ] -> list_tag_sort_choices
  | [ "list"; "property" ] -> list_property_sort_choices
  | [ "list"; "task" ] -> list_task_sort_choices
  | [ "list"; "node" ] -> list_node_sort_choices
  | [ "list"; "asset" ] ->
      [
        "id";
        "title";
        "size";
        "type";
        "checksum";
        "remote-metadata";
        "created-at";
        "updated-at";
      ]
  | [ "search"; ("block" | "page" | "property" | "tag") ] ->
      search_result_header_order
  | _ -> []

let global_options =
  [
    option [ "--config" ] (Required_value "path")
      "Path to cli.edn (default <root-dir>/cli.edn)";
    option [ "-g"; "--graph" ] (Required_value "graph") "Graph name";
    option [ "--root-dir" ] (Required_value "path")
      "Path to CLI root dir (default ~/logseq)";
    option [ "--timeout-ms" ] (Required_value "ms")
      "Request timeout in ms (default 10000)";
    option [ "-o"; "--output" ] (Required_value "mode") ~choices:output_choices
      ~default:"human" "Output format";
    option [ "-v"; "--verbose" ] Flag "Enable verbose debug logging to stderr";
    option [ "--profile" ] Flag "Enable stage timing profile output to stderr";
    option [ "-h"; "--help" ] Flag "Show command help";
    option [ "--version" ] Flag "Show CLI version";
  ]

let common_list_options sort_choices =
  [
    value "fields" "fields" "Comma-separated fields to include"
      ~choices:sort_choices;
    value "limit" "n" "Maximum result count";
    value "offset" "n" "Result offset";
    value "sort" "field" "Sort field" ~choices:sort_choices;
    value "order" "order" "Sort order" ~choices:order_choices;
  ]

let selector_options =
  [ value "id" "id" "Entity id"; value "uuid" "uuid" "Entity UUID" ]

let target_options =
  [
    value "target-id" "id" "Target block id";
    value "target-uuid" "uuid" "Target block UUID";
    value "target-page" "page" "Target page name";
    value "pos" "position" "Insert position" ~choices:position_choices;
  ]

let property_update_options =
  [
    value "update-tags" "edn" "Tags to add or update";
    value "update-properties" "edn" "Properties to add or update";
    value "remove-tags" "edn" "Tags to remove";
    value "remove-properties" "edn" "Properties to remove";
  ]

let content_search_options = [ value "content" "text" "Content search text" ]
let e2ee_password_option = value "e2ee-password" "password" "E2EE password"

let options_for_known_path = function
  | [ "graph"; "list" ]
  | [ "graph"; "switch" ]
  | [ "graph"; "remove" ]
  | [ "graph"; "info" ]
  | [ "graph"; "backup"; "list" ] ->
      []
  | [ "graph"; "create" ] ->
      [ flag "enable-sync" "Enable sync"; e2ee_password_option ]
  | [ "graph"; "validate" ] ->
      [
        option [ "-f"; "--fix" ] Flag "Fix validation problems";
        value "fields" "fields" "Fields to include";
      ]
  | [ "graph"; "backup"; "create" ] -> [ value "name" "name" "Backup name" ]
  | [ "graph"; "backup"; "restore" ] ->
      [
        value ~required:true "src" "backup" "Source backup name";
        value ~required:true "dst" "graph" "Destination graph name";
      ]
  | [ "graph"; "backup"; "remove" ] ->
      [ value ~required:true "src" "backup" "Source backup name" ]
  | [ "graph"; "export" ] ->
      [
        value "type" "type" "Export type" ~choices:graph_data_choices;
        value "file" "path" "Output file";
        option [ "-e"; "--edn-options" ] (Required_value "edn")
          "EDN map of export options; :export-type overrides the default :graph";
        option [ "-p"; "--pretty-print" ] Flag
          "Pretty-print the exported EDN file";
      ]
  | [ "graph"; "import" ] ->
      [
        value ~required:true "type" "type" "Import type"
          ~choices:graph_data_choices;
        value ~required:true "input" "path" "Input file";
      ]
  | [ "list"; "page" ] ->
      common_list_options list_page_sort_choices
      @ [
          flag "expand" "Expand page data";
          optional_value "include-built-in" "bool" "Include built-in pages";
          optional_value "include-journal" "bool" "Include journal pages";
          flag "journal-only" "Only include journal pages";
          flag "include-hidden" "Include hidden pages";
          value "updated-after" "timestamp"
            "Only include pages updated after timestamp";
          value "created-after" "timestamp"
            "Only include pages created after timestamp";
        ]
  | [ "list"; "tag" ] ->
      common_list_options list_tag_sort_choices
      @ [
          flag "expand" "Expand tag data";
          optional_value "include-built-in" "bool" "Include built-in tags";
          flag "with-properties" "Include properties";
          flag "with-extends" "Include extends data";
        ]
  | [ "list"; "property" ] ->
      common_list_options list_property_sort_choices
      @ [
          flag "expand" "Expand property data";
          optional_value "include-built-in" "bool" "Include built-in properties";
          flag "with-classes" "Include classes";
          flag "with-type" "Include property type";
        ]
  | [ "list"; "task" ] ->
      common_list_options list_task_sort_choices
      @ [
          value "status" "status" "Task status";
          value "priority" "priority" "Task priority";
          value "content" "text" "Task content filter";
        ]
  | [ "list"; "node" ] ->
      common_list_options list_node_sort_choices
      @ [
          value "tags" "tags" "Comma-separated tag filters";
          value "properties" "properties" "Comma-separated property filters";
        ]
  | [ "list"; "asset" ] -> common_list_options list_asset_sort_choices
  | [ "remove"; "block" ] -> selector_options
  | [ "remove"; "page" ] ->
      [ value "id" "id" "Page id"; value "page" "page" "Page name" ]
  | [ "remove"; "tag" ] | [ "remove"; "property" ] ->
      [ value "id" "id" "Entity id"; value "name" "name" "Entity name" ]
  | [ "upsert"; "block" ] ->
      selector_options @ target_options
      @ [
          value "content" "text" "Block content";
          value "blocks" "edn" "Blocks EDN";
          value "blocks-file" "path" "Path to blocks EDN file";
        ]
      @ property_update_options
  | [ "upsert"; "page" ] ->
      [ value "id" "id" "Page id"; value "page" "page" "Page name" ]
      @ [ flag "restore" "Restore recycled page before updating" ]
      @ property_update_options
  | [ "upsert"; "asset" ] ->
      selector_options
      @ [ value "path" "path" "Asset path" ]
      @ target_options
      @ [ value "content" "text" "Asset content" ]
  | [ "upsert"; "task" ] ->
      selector_options
      @ [
          value "page" "page" "Page name"; value "content" "text" "Task content";
        ]
      @ target_options
      @ [
          value "status" "status" "Task status";
          value "priority" "priority" "Task priority";
          value "scheduled" "date" "Scheduled date";
          value "deadline" "date" "Deadline date";
          flag "no-status" "Remove status";
          flag "no-priority" "Remove priority";
          flag "no-scheduled" "Remove scheduled date";
          flag "no-deadline" "Remove deadline date";
        ]
  | [ "upsert"; "tag" ] ->
      [
        value "id" "id" "Tag id";
        value "name" "name" "Tag name";
        value "add-properties" "edn" "Tag schema properties to add";
        value "remove-properties" "edn" "Tag schema properties to remove";
      ]
  | [ "upsert"; "property" ] ->
      [
        value "id" "id" "Property id";
        value "name" "name" "Property name";
        value "type" "type" "Property type" ~choices:property_type_choices;
        value "cardinality" "cardinality" "Property cardinality"
          ~choices:cardinality_choices;
        optional_value "hide" "bool" "Hide property";
        optional_value "public" "bool" "Make property public";
      ]
  | [ "search"; ("block" | "page" | "property" | "tag") ] ->
      content_search_options
  | [ "query"; "list" ] -> []
  | [ "query" ] ->
      [
        value "query" "edn" "Datascript query";
        value "name" "name" "Saved query name";
        value "inputs" "edn" "Query inputs";
      ]
  | [ "show" ] ->
      [
        optional_value "id" "id" "Entity id";
        value "uuid" "uuid" "Entity UUID";
        value "page" "page" "Page name";
        optional_value "page-hierarchy" "bool" "Show page hierarchy";
        optional_value "linked-references" "bool" "Show linked references";
        optional_value "ref-id-footer" "bool" "Show reference id footer";
        value "level" "n" "Tree depth";
      ]
  | [ "server"; ("list" | "cleanup" | "start" | "stop" | "restart") ] -> []
  | [ "sync"; "status" ]
  | [ "sync"; "stop" ]
  | [ "sync"; "remote-graphs" ]
  | [ "sync"; "config"; ("get" | "unset") ] ->
      []
  | [ "sync"; ("start" | "upload") ] -> [ e2ee_password_option ]
  | [ "sync"; "download" ] ->
      [ flag "progress" "Stream progress"; e2ee_password_option ]
  | [ "sync"; "asset"; "download" ] -> selector_options
  | [ "sync"; "ensure-keys" ] ->
      [ e2ee_password_option; flag "upload-keys" "Upload sync keys" ]
  | [ "sync"; "grant-access" ] ->
      [
        value "graph-id" "graph-id" "Remote graph id";
        value "email" "email" "Account email";
      ]
  | [ "sync"; "config"; "set" ] -> []
  | [ "debug"; "pull" ] ->
      selector_options @ [ value "ident" "ident" "Entity ident" ]
  | [ "doctor" ] -> [ flag "dev-script" "Use development script" ]
  | [ "login" ] | [ "logout" ] | [ "agent"; "bridge" ] | "example" :: _ -> []
  | [ "skill"; "show" ] -> []
  | [ "completion" ] ->
      [ value "shell" "shell" "Completion shell" ~choices:[ "zsh"; "bash" ] ]
  | [ "skill"; "install" ] -> [ flag "global" "Install globally" ]
  | _ -> []

let with_catalog_options command =
  let options =
    if command.options = [] then options_for_known_path command.path
    else command.options
  in
  let human_table_headers_order =
    if command.human_table_headers_order = [] then
      human_table_headers_order_for_known_path command.path
    else command.human_table_headers_order
  in
  { command with options; human_table_headers_order }

let empty = { commands = []; groups = [] }

let make commands =
  { commands = List.map with_catalog_options commands; groups = [] }

let add command t =
  { t with commands = with_catalog_options command :: t.commands }

let find_by_path path t = List.find_opt (fun c -> c.path = path) t.commands

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
  let rec loop prefix path =
    match (prefix, path) with
    | [], _ -> true
    | p :: ps, x :: xs when p = x -> loop ps xs
    | _ -> false
  in
  List.length prefix <= List.length path && loop prefix path

let option_label option =
  let names = String.concat ", " option.names in
  match option.arity with
  | Flag -> names
  | Required_value value_name -> names ^ " <" ^ value_name ^ ">"
  | Optional_value value_name -> names ^ " [<" ^ value_name ^ ">]"

let option_doc option =
  let suffixes =
    (match option.choices with
      | [] -> []
      | choices -> [ "choices: " ^ String.concat ", " choices ])
    @
    match option.default with
    | None -> []
    | Some default -> [ "default: " ^ default ]
  in
  match suffixes with
  | [] -> option.doc
  | _ -> option.doc ^ " (" ^ String.concat "; " suffixes ^ ")"

let format_rows rows =
  let width =
    rows |> List.fold_left (fun acc (name, _) -> max acc (String.length name)) 0
  in
  rows
  |> List.map (fun (name, doc) ->
      let padding = String.make (max 0 (width - String.length name)) ' ' in
      if doc = "" then "  " ^ name else "  " ^ name ^ padding ^ "  " ^ doc)
  |> String.concat "\n"

let format_options options =
  options
  |> List.map (fun option -> (option_label option, option_doc option))
  |> format_rows

let render_help ?group (t : t) =
  let join_words words = String.concat " " words in
  let command_label command = join_words command.path in
  let global_options_help = format_options global_options in
  let top_level_entries () =
    let seen = Hashtbl.create 16 in
    let doc_for_top top fallback =
      match find_by_path [ top ] t with
      | Some command -> command.doc
      | None -> Option.value (top_level_group_doc top) ~default:fallback
    in
    t.commands
    |> List.filter_map (fun command ->
        match command.path with
        | top :: _ when not (Hashtbl.mem seen top) ->
            Hashtbl.add seen top ();
            Some (top, doc_for_top top command.doc)
        | _ -> None)
  in
  let top_level_help () =
    String.concat "\n"
      [
        "Usage: logseq <command> [options]";
        "";
        "Commands:";
        format_rows (top_level_entries ());
        "";
        "Available commands:";
        format_rows
          (t.commands
          |> List.filter (fun (command : command_meta) ->
              command.category <> Hidden)
          |> List.map (fun (command : command_meta) ->
              (command_label command, command.doc)));
        "";
        "Global options:";
        global_options_help;
        "";
        "Command options:";
        "  See `logseq <command> --help`";
      ]
  in
  let group_help group =
    let rows =
      t.commands
      |> List.filter (fun command -> is_prefix group command.path)
      |> List.map (fun command -> (command_label command, command.doc))
    in
    String.concat "\n"
      [
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
      ]
  in
  let command_options_help command =
    match command.options with
    | [] -> "  None"
    | options -> format_options options
  in
  let command_help command =
    let examples =
      match command.examples with
      | [] -> []
      | xs -> "" :: "Examples:" :: List.map (fun example -> "  " ^ example) xs
    in
    String.concat "\n"
      ([
         "Usage: logseq " ^ command_label command ^ " [options]";
         "";
         "Global options:";
         global_options_help;
         "";
         "Command options:";
         command_options_help command;
       ]
      @ examples)
  in
  match group with
  | None | Some [] -> top_level_help ()
  | Some group -> (
      match find_by_path group t with
      | Some command -> command_help command
      | None -> group_help group)
