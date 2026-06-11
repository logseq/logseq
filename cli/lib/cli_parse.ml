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
  | "upload-keys" | "pretty-print" ->
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
      (Option.bind (option_value "output" options) Output.Mode.of_string)
    ~verbose:(option_present "verbose" options)
    ~profile:(option_present "profile" options)
    ()

let parse_csv value =
  value |> String.split_on_char ',' |> List.map String.trim
  |> List.filter (fun value -> value <> "")

let int_option key options =
  Option.bind (option_value key options) int_of_string_opt

let int64_option key options =
  Option.bind (option_value key options) Int64.of_string_opt

let time_option key options =
  Option.bind (option_value key options) Time.parse_time

let bool_option_value key options =
  match option_value key options with
  | Some value -> Some (String.lowercase_ascii (String.trim value) = "true")
  | None -> if option_present key options then Some true else None

let raw_option_present token argv = List.exists (( = ) token) argv

let common_list_opts options =
  {
    List_command.fields = Option.map parse_csv (option_value "fields" options);
    limit = int_option "limit" options;
    offset = int_option "offset" options;
    sort = option_value "sort" options;
    order =
      Option.bind (option_value "order" options) List_command.order_of_string;
  }

let optional_flag key options = bool_option_value key options

let graph_export_type options =
  Option.bind
    (Option.map String.lowercase_ascii (option_value "type" options))
    Graph.normalize_export_type

let graph_import_type options =
  Option.bind
    (Option.map String.lowercase_ascii (option_value "type" options))
    Graph.normalize_import_type

let global_options =
  [
    "graph";
    "root-dir";
    "config";
    "timeout-ms";
    "output";
    "verbose";
    "profile";
    "help";
    "version";
  ]

let common_list_options = [ "fields"; "limit"; "offset"; "sort"; "order" ]

let allowed_options_for_path = function
  | [ "graph"; "list" ]
  | [ "graph"; "switch" ]
  | [ "graph"; "remove" ]
  | [ "graph"; "info" ]
  | [ "graph"; "backup"; "list" ] ->
      []
  | [ "graph"; "create" ] -> [ "enable-sync"; "e2ee-password" ]
  | [ "graph"; "validate" ] -> [ "fix"; "fields" ]
  | [ "graph"; "backup"; "create" ] -> [ "name" ]
  | [ "graph"; "backup"; "restore" ] -> [ "src"; "dst" ]
  | [ "graph"; "backup"; "remove" ] -> [ "src" ]
  | [ "graph"; "export" ] ->
      [
        "type";
        "file";
        "edn-options";
        "pretty-print";
        "include-timestamps";
        "exclude-built-in-pages";
        "exclude-namespaces";
      ]
  | [ "graph"; "import" ] -> [ "type"; "input" ]
  | [ "list"; "page" ] ->
      common_list_options
      @ [
          "expand";
          "include-built-in";
          "include-journal";
          "journal-only";
          "include-hidden";
          "updated-after";
          "created-after";
        ]
  | [ "list"; "tag" ] ->
      common_list_options
      @ [ "expand"; "include-built-in"; "with-properties"; "with-extends" ]
  | [ "list"; "property" ] ->
      common_list_options
      @ [ "expand"; "include-built-in"; "with-classes"; "with-type" ]
  | [ "list"; "task" ] ->
      common_list_options @ [ "status"; "priority"; "content" ]
  | [ "list"; "node" ] -> common_list_options @ [ "tags"; "properties" ]
  | [ "list"; "asset" ] -> common_list_options
  | [ "remove"; "block" ] -> [ "id"; "uuid" ]
  | [ "remove"; "page" ] -> [ "id"; "page" ]
  | [ "remove"; "tag" ] | [ "remove"; "property" ] -> [ "id"; "name" ]
  | [ "upsert"; "block" ] ->
      [
        "id";
        "uuid";
        "target-id";
        "target-uuid";
        "target-page";
        "pos";
        "content";
        "blocks";
        "blocks-file";
        "update-tags";
        "update-properties";
        "remove-tags";
        "remove-properties";
      ]
  | [ "upsert"; "page" ] ->
      [
        "id";
        "page";
        "update-tags";
        "update-properties";
        "remove-tags";
        "remove-properties";
      ]
  | [ "upsert"; "asset" ] ->
      [
        "id";
        "uuid";
        "path";
        "target-id";
        "target-uuid";
        "target-page";
        "pos";
        "content";
      ]
  | [ "upsert"; "task" ] ->
      [
        "id";
        "uuid";
        "page";
        "content";
        "target-id";
        "target-uuid";
        "target-page";
        "pos";
        "status";
        "priority";
        "scheduled";
        "deadline";
        "no-status";
        "no-priority";
        "no-scheduled";
        "no-deadline";
      ]
  | [ "upsert"; "tag" ] -> [ "id"; "name" ]
  | [ "upsert"; "property" ] ->
      [ "id"; "name"; "type"; "cardinality"; "hide"; "public" ]
  | [ "search"; ("block" | "page" | "property" | "tag") ] -> [ "content" ]
  | [ "query"; "list" ] -> []
  | [ "query" ] -> [ "query"; "name"; "inputs" ]
  | [ "show" ] ->
      [
        "id";
        "uuid";
        "page";
        "page-hierarchy";
        "linked-references";
        "ref-id-footer";
        "level";
      ]
  | [ "server"; ("list" | "cleanup" | "start" | "stop" | "restart") ] -> []
  | [ "sync"; "status" ]
  | [ "sync"; "stop" ]
  | [ "sync"; "remote-graphs" ]
  | [ "sync"; "config"; ("get" | "unset") ] ->
      []
  | [ "sync"; ("start" | "upload") ] -> [ "e2ee-password" ]
  | [ "sync"; "download" ] -> [ "progress"; "e2ee-password" ]
  | [ "sync"; "asset"; "download" ] -> [ "id"; "uuid" ]
  | [ "sync"; "ensure-keys" ] -> [ "e2ee-password"; "upload-keys" ]
  | [ "sync"; "grant-access" ] -> [ "graph-id"; "email" ]
  | [ "sync"; "config"; "set" ] -> []
  | [ "debug"; "pull" ] -> [ "id"; "uuid"; "ident" ]
  | [ "doctor" ] -> [ "dev-script" ]
  | [ "login" ]
  | [ "logout" ]
  | [ "skill"; "show" ]
  | "example" :: _ ->
      []
  | [ "completion" ] -> [ "shell" ]
  | [ "skill"; "install" ] -> [ "global" ]
  | _ -> []

let validate_known_options path options =
  let allowed =
    List.sort_uniq String.compare
      (global_options @ allowed_options_for_path path)
  in
  match List.find_opt (fun (key, _) -> not (List.mem key allowed)) options with
  | Some (key, _) -> Error (Error.invalid_options ("Unknown option: :" ^ key))
  | None -> Ok ()

let invalid_value key value message =
  Error.invalid_options
    ("Invalid value for option :" ^ key ^ ": " ^ value ^ ". " ^ message)

let validate_integer_option key options =
  match List.find_opt (fun (candidate, _) -> candidate = key) options with
  | Some (_, Some value) when Int64.of_string_opt value = None ->
      Error (invalid_value key value "Expected integer")
  | _ -> Ok ()

let validate_member_option key values options =
  match option_value key options with
  | Some value when not (List.mem value values) ->
      Error
        (invalid_value key value
           ("Available values: " ^ String.concat ", " values))
  | _ -> Ok ()

let validate_csv_member_option key values options =
  match option_value key options with
  | Some value -> (
      match
        List.find_opt
          (fun field -> not (List.mem field values))
          (parse_csv value)
      with
      | Some invalid ->
          Error
            (invalid_value key invalid
               ("Available values: " ^ String.concat ", " values))
      | None -> Ok ())
  | None -> Ok ()

let validate_time_option key options =
  match option_value key options with
  | Some value when Option.is_none (Time.parse_time value) ->
      Error (invalid_value key value "Expected RFC3339 datetime or epoch ms")
  | _ -> Ok ()

let list_page_sort_values =
  [ "id"; "ident"; "title"; "uuid"; "created-at"; "updated-at" ]

let list_tag_sort_values =
  list_page_sort_values @ [ "properties"; "extends"; "description" ]

let list_property_sort_values =
  list_page_sort_values @ [ "classes"; "type"; "cardinality"; "description" ]

let list_task_sort_values =
  [
    "id";
    "title";
    "status";
    "priority";
    "scheduled";
    "deadline";
    "updated-at";
    "created-at";
  ]

let list_node_sort_values =
  [ "id"; "title"; "type"; "page-id"; "page-title"; "created-at"; "updated-at" ]

let list_asset_sort_values =
  [ "id"; "title"; "asset-type"; "size"; "updated-at"; "created-at" ]

let validate_list_common_values sort_values options =
  Error.bind (validate_integer_option "limit" options) (fun () ->
      Error.bind (validate_integer_option "offset" options) (fun () ->
          Error.bind
            (validate_member_option "order" [ "asc"; "desc" ] options)
            (fun () ->
              Error.bind (validate_member_option "sort" sort_values options)
                (fun () ->
                  validate_csv_member_option "fields" sort_values options))))

let validate_global_values options =
  Error.bind (validate_integer_option "timeout-ms" options) (fun () ->
      validate_member_option "output" [ "human"; "json"; "edn" ] options)

let empty_exclude_namespaces_error =
  Error.invalid_options
    "graph export --exclude-namespaces must include at least one non-empty \
     value"

let validate_graph_export_values options =
  match
    ( Option.map String.lowercase_ascii (option_value "type" options),
      List.find_opt (fun (key, _) -> key = "exclude-namespaces") options )
  with
  | Some "edn", Some (_, Some value) when parse_csv value = [] ->
      Error empty_exclude_namespaces_error
  | Some "edn", Some (_, None) -> Error empty_exclude_namespaces_error
  | _ -> Ok ()

let parse_graph_export_edn_options options =
  match option_value "edn-options" options with
  | None -> Ok None
  | Some text -> (
      try
        let value = Melange_edn.of_edn_string text in
        match Edn_util.as_map value with
        | Some _ -> Ok (Some value)
        | None ->
            Error
              (Error.invalid_options
                 "graph export --edn-options must be an EDN map")
      with Melange_edn.Parse_error _ ->
        Error
          (Error.invalid_options
             "graph export --edn-options must be an EDN map"))

let validate_non_empty_csv_option key message options =
  match List.find_opt (fun (candidate, _) -> candidate = key) options with
  | Some (_, Some value) when parse_csv value = [] ->
      Error (Error.invalid_options message)
  | Some (_, None) -> Error (Error.invalid_options message)
  | _ -> Ok ()

let validate_list_node_values options =
  Error.bind
    (validate_non_empty_csv_option "tags"
       "list node --tags must include at least one non-empty value" options)
    (fun () ->
      validate_non_empty_csv_option "properties"
        "list node --properties must include at least one non-empty value"
        options)

let validate_pos_value options =
  validate_member_option "pos"
    [ "first-child"; "last-child"; "sibling" ]
    options

let validate_option_values path options =
  match path with
  | [ "graph"; "export" ] -> validate_graph_export_values options
  | [ "list"; "page" ] ->
      Error.bind (validate_list_common_values list_page_sort_values options)
        (fun () ->
          Error.bind (validate_time_option "updated-after" options) (fun () ->
              validate_time_option "created-after" options))
  | [ "list"; "tag" ] ->
      validate_list_common_values list_tag_sort_values options
  | [ "list"; "property" ] ->
      validate_list_common_values list_property_sort_values options
  | [ "list"; "task" ] ->
      validate_list_common_values list_task_sort_values options
  | [ "list"; "node" ] ->
      Error.bind (validate_list_node_values options) (fun () ->
          validate_list_common_values list_node_sort_values options)
  | [ "list"; "asset" ] ->
      validate_list_common_values list_asset_sort_values options
  | [ "show" ] -> validate_integer_option "level" options
  | [ "completion" ] ->
      validate_member_option "shell" [ "zsh"; "bash" ] options
  | [ "upsert"; "task" ] ->
      Error.bind (validate_pos_value options) (fun () ->
          Error.bind (validate_time_option "scheduled" options) (fun () ->
              validate_time_option "deadline" options))
  | [ "upsert"; "block" ] | [ "upsert"; "asset" ] -> validate_pos_value options
  | _ -> Ok ()

let validate_options path options =
  Error.bind (validate_known_options path options) (fun () ->
      Error.bind (validate_global_values options) (fun () ->
          validate_option_values path options))

let sync_config_key_or_error = function
  | None -> Ok None
  | Some raw -> (
      match
        Sync.config_key_of_string (String.lowercase_ascii (String.trim raw))
      with
      | Some key -> Ok (Some key)
      | None -> Error (Error.invalid_options ("unknown config key: " ^ raw)))

let parsed_remove_command options = function
  | "block" ->
      Some
        (Cli_request.Remove
           (Remove.Parsed_block
              {
                id_raw = option_value "id" options;
                uuid = option_value "uuid" options;
              }))
  | "page" ->
      Some
        (Remove
           (Parsed_page
              {
                id = int64_option "id" options;
                page = option_value "page" options;
              }))
  | "tag" ->
      Some
        (Remove
           (Parsed_tag
              {
                id = int64_option "id" options;
                name = option_value "name" options;
              }))
  | "property" ->
      Some
        (Remove
           (Parsed_property
              {
                id = int64_option "id" options;
                name = option_value "name" options;
              }))
  | _ -> None

let content_option_or_args options args =
  match option_value "content" options with
  | Some _ as content -> content
  | None when args <> [] -> Some (String.concat " " args)
  | None -> None

let parsed_upsert_command ?(args = []) options = function
  | "block" ->
      Some
        (Cli_request.Upsert
           (Upsert.Parsed_block
              {
                id = int64_option "id" options;
                uuid = option_value "uuid" options;
                target_id = int64_option "target-id" options;
                target_uuid = option_value "target-uuid" options;
                target_page = option_value "target-page" options;
                pos =
                  Option.bind
                    (option_value "pos" options)
                    Block.position_of_string;
                content = content_option_or_args options args;
                blocks_edn = option_value "blocks" options;
                blocks_file = option_value "blocks-file" options;
                update_tags_edn = option_value "update-tags" options;
                update_properties_edn = option_value "update-properties" options;
                remove_tags_edn = option_value "remove-tags" options;
                remove_properties_edn = option_value "remove-properties" options;
              }))
  | "page" ->
      Some
        (Upsert
           (Parsed_page
              {
                id = int64_option "id" options;
                page = option_value "page" options;
                update_tags_edn = option_value "update-tags" options;
                update_properties_edn = option_value "update-properties" options;
                remove_tags_edn = option_value "remove-tags" options;
                remove_properties_edn = option_value "remove-properties" options;
              }))
  | "asset" ->
      Some
        (Upsert
           (Parsed_asset
              {
                id = int64_option "id" options;
                uuid = option_value "uuid" options;
                path = option_value "path" options;
                target_id = int64_option "target-id" options;
                target_uuid = option_value "target-uuid" options;
                target_page = option_value "target-page" options;
                pos =
                  Option.bind
                    (option_value "pos" options)
                    Block.position_of_string;
                content = option_value "content" options;
              }))
  | "task" ->
      Some
        (Upsert
           (Parsed_task
              {
                id = int64_option "id" options;
                uuid = option_value "uuid" options;
                page = option_value "page" options;
                content = option_value "content" options;
                target_id = int64_option "target-id" options;
                target_uuid = option_value "target-uuid" options;
                target_page = option_value "target-page" options;
                pos =
                  Option.bind
                    (option_value "pos" options)
                    Block.position_of_string;
                status = option_value "status" options;
                priority = option_value "priority" options;
                scheduled = time_option "scheduled" options;
                deadline = time_option "deadline" options;
                no_status = option_present "no-status" options;
                no_priority = option_present "no-priority" options;
                no_scheduled = option_present "no-scheduled" options;
                no_deadline = option_present "no-deadline" options;
              }))
  | "tag" ->
      Some
        (Upsert
           (Parsed_tag
              {
                id = int64_option "id" options;
                name = option_value "name" options;
              }))
  | "property" ->
      Some
        (Upsert
           (Parsed_property
              {
                id = int64_option "id" options;
                name = option_value "name" options;
                kind =
                  Option.bind
                    (option_value "type" options)
                    Property.kind_of_string;
                cardinality =
                  Option.bind
                    (option_value "cardinality" options)
                    Property.cardinality_of_string;
                hide = bool_option_value "hide" options;
                public = bool_option_value "public" options;
              }))
  | _ -> None

let parsed_list_command options = function
  | "page" ->
      Some
        (Cli_request.List
           (List_command.Parsed_page
              {
                common = common_list_opts options;
                expand = option_present "expand" options;
                include_built_in = optional_flag "include-built-in" options;
                include_journal = optional_flag "include-journal" options;
                journal_only = option_present "journal-only" options;
                include_hidden = option_present "include-hidden" options;
                updated_after = time_option "updated-after" options;
                created_after = time_option "created-after" options;
              }))
  | "tag" ->
      Some
        (List
           (Parsed_tag
              {
                common = common_list_opts options;
                expand = option_present "expand" options;
                include_built_in = optional_flag "include-built-in" options;
                with_properties = option_present "with-properties" options;
                with_extends = option_present "with-extends" options;
              }))
  | "property" ->
      Some
        (List
           (Parsed_property
              {
                common = common_list_opts options;
                expand = option_present "expand" options;
                include_built_in = optional_flag "include-built-in" options;
                with_classes = option_present "with-classes" options;
                with_type = true;
              }))
  | "task" ->
      Some
        (List
           (Parsed_task
              {
                common = common_list_opts options;
                status = option_value "status" options;
                priority = option_value "priority" options;
                content = option_value "content" options;
              }))
  | "node" ->
      Some
        (List
           (Parsed_node
              {
                common = common_list_opts options;
                tags =
                  Option.value
                    (Option.map parse_csv (option_value "tags" options))
                    ~default:[];
                properties =
                  Option.value
                    (Option.map parse_csv (option_value "properties" options))
                    ~default:[];
              }))
  | "asset" -> Some (List (Parsed_asset { common = common_list_opts options }))
  | _ -> None

let parse ?stdin argv =
  let options, positional = parse_tokens argv in
  let make path command =
    Error.bind (validate_options path options) (fun () ->
        let globals = globals_of_options options in
        Ok (Cli_request.make ~globals ~path ~command ~raw_args:argv))
  in
  if option_present "version" options then make [] Cli_request.Version
  else
    match positional with
    | [ "graph"; "list" ] -> make [ "graph"; "list" ] (Graph Graph.Parsed_list)
    | [ "graph"; "create" ] ->
        make [ "graph"; "create" ]
          (Graph
             (Parsed_create
                {
                  enable_sync = option_present "enable-sync" options;
                  e2ee_password = option_value "e2ee-password" options;
                }))
    | [ "graph"; "switch" ] -> make [ "graph"; "switch" ] (Graph Parsed_switch)
    | [ "graph"; "remove" ] -> make [ "graph"; "remove" ] (Graph Parsed_remove)
    | [ "graph"; "validate" ] ->
        make [ "graph"; "validate" ]
          (Graph
             (Parsed_validate
                {
                  fix =
                    option_present "fix" options || raw_option_present "-f" argv;
                }))
    | [ "graph"; "info" ] -> make [ "graph"; "info" ] (Graph Parsed_info)
    | [ "graph"; "backup"; "list" ] ->
        make [ "graph"; "backup"; "list" ] (Graph Parsed_backup_list)
    | [ "graph"; "backup"; "create" ] ->
        make
          [ "graph"; "backup"; "create" ]
          (Graph (Parsed_backup_create { name = option_value "name" options }))
    | [ "graph"; "backup"; "restore" ] -> (
        match (option_value "src" options, option_value "dst" options) with
        | Some src, Some dst ->
            make
              [ "graph"; "backup"; "restore" ]
              (Graph
                 (Parsed_backup_restore
                    { src; dst = Cli_primitive.create_graph dst }))
        | None, _ ->
            Error
              (Error.invalid_options "graph backup restore --src is required")
        | _, None ->
            Error
              (Error.invalid_options "graph backup restore --dst is required"))
    | [ "graph"; "backup"; "remove" ] -> (
        match option_value "src" options with
        | Some src ->
            make
              [ "graph"; "backup"; "remove" ]
              (Graph (Parsed_backup_remove { src }))
        | None ->
            Error
              (Error.invalid_options "graph backup remove --src is required"))
    | [ "graph"; "export" ] -> (
        match graph_export_type options with
        | Some export_type ->
            Error.bind
              (parse_graph_export_edn_options options)
              (fun edn_options ->
                make [ "graph"; "export" ]
                  (Graph
                     (Parsed_export
                        {
                          export_type;
                          file = option_value "file" options;
                          edn_options;
                          pretty_print = option_present "pretty-print" options;
                          include_timestamps =
                            option_present "include-timestamps" options;
                          exclude_built_in_pages =
                            option_present "exclude-built-in-pages" options;
                          exclude_namespaces =
                            Option.value
                              (Option.map parse_csv
                                 (option_value "exclude-namespaces" options))
                              ~default:[];
                        })))
        | None ->
            Error
              (Error.invalid_options "graph export --type must be edn or sqlite")
        )
    | [ "graph"; "import" ] -> (
        match (graph_import_type options, option_value "input" options) with
        | Some import_type, Some input ->
            make [ "graph"; "import" ]
              (Graph (Parsed_import { import_type; input }))
        | None, _ ->
            Error
              (Error.invalid_options "graph import --type must be edn or sqlite")
        | _, None ->
            Error (Error.invalid_options "graph import --input is required"))
    | [ "list"; kind ] -> (
        match parsed_list_command options kind with
        | Some command -> make [ "list"; kind ] command
        | None ->
            Error (Error.unknown_command ("unknown command: list " ^ kind)))
    | [ "remove"; kind ] -> (
        match parsed_remove_command options kind with
        | Some command -> make [ "remove"; kind ] command
        | None ->
            Error (Error.unknown_command ("unknown command: remove " ^ kind)))
    | "upsert" :: "block" :: args -> (
        match parsed_upsert_command ~args options "block" with
        | Some command -> make [ "upsert"; "block" ] command
        | None -> Error (Error.unknown_command "unknown command: upsert block"))
    | [ "upsert"; kind ] -> (
        match parsed_upsert_command options kind with
        | Some command -> make [ "upsert"; kind ] command
        | None ->
            Error (Error.unknown_command ("unknown command: upsert " ^ kind)))
    | [ "search"; "block" ] ->
        make [ "search"; "block" ]
          (Search
             (Search.Parsed_block
                {
                  content =
                    Option.value (option_value "content" options) ~default:"";
                }))
    | [ "search"; "page" ] ->
        make [ "search"; "page" ]
          (Search
             (Search.Parsed_page
                {
                  content =
                    Option.value (option_value "content" options) ~default:"";
                }))
    | [ "search"; "property" ] ->
        make [ "search"; "property" ]
          (Search
             (Search.Parsed_property
                {
                  content =
                    Option.value (option_value "content" options) ~default:"";
                }))
    | [ "search"; "tag" ] ->
        make [ "search"; "tag" ]
          (Search
             (Search.Parsed_tag
                {
                  content =
                    Option.value (option_value "content" options) ~default:"";
                }))
    | [ "query"; "list" ] -> make [ "query"; "list" ] (Query Query.Parsed_list)
    | [ "query" ] ->
        make [ "query" ]
          (Query
             (Query.Parsed_run
                {
                  query_edn = option_value "query" options;
                  name = option_value "name" options;
                  inputs_edn = option_value "inputs" options;
                }))
    | [ "show" ] ->
        let stdin_id =
          if
            option_present "id" options
            && Option.is_none (option_value "id" options)
          then stdin
          else None
        in
        make [ "show" ]
          (Show
             (Show.Parsed_show
                {
                  id_raw = option_value "id" options;
                  uuid = option_value "uuid" options;
                  page = option_value "page" options;
                  page_hierarchy =
                    Option.value
                      (bool_option_value "page-hierarchy" options)
                      ~default:false;
                  linked_references = optional_flag "linked-references" options;
                  ref_id_footer = optional_flag "ref-id-footer" options;
                  level = int_option "level" options;
                  stdin_id;
                }))
    | [ "server"; "list" ] ->
        make [ "server"; "list" ] (Server Server_command.Parsed_list)
    | [ "server"; "cleanup" ] ->
        make [ "server"; "cleanup" ] (Server Parsed_cleanup)
    | [ "server"; "start" ] -> make [ "server"; "start" ] (Server Parsed_start)
    | [ "server"; "stop" ] -> make [ "server"; "stop" ] (Server Parsed_stop)
    | [ "server"; "restart" ] ->
        make [ "server"; "restart" ] (Server Parsed_restart)
    | [ "sync"; "status" ] ->
        make [ "sync"; "status" ] (Sync Sync.Parsed_status)
    | [ "sync"; "start" ] ->
        make [ "sync"; "start" ]
          (Sync
             (Sync.Parsed_start
                { e2ee_password = option_value "e2ee-password" options }))
    | [ "sync"; "stop" ] -> make [ "sync"; "stop" ] (Sync Sync.Parsed_stop)
    | [ "sync"; "upload" ] ->
        make [ "sync"; "upload" ]
          (Sync
             (Sync.Parsed_upload
                { e2ee_password = option_value "e2ee-password" options }))
    | [ "sync"; "download" ] ->
        make [ "sync"; "download" ]
          (Sync
             (Sync.Parsed_download
                {
                  progress =
                    (if option_present "progress" options then Some true
                     else None);
                  e2ee_password = option_value "e2ee-password" options;
                }))
    | [ "sync"; "asset"; "download" ] ->
        make
          [ "sync"; "asset"; "download" ]
          (Sync
             (Sync.Parsed_asset_download
                {
                  id = int64_option "id" options;
                  uuid = option_value "uuid" options;
                }))
    | [ "sync"; "remote-graphs" ] ->
        make [ "sync"; "remote-graphs" ] (Sync Sync.Parsed_remote_graphs)
    | [ "sync"; "ensure-keys" ] ->
        make [ "sync"; "ensure-keys" ]
          (Sync
             (Sync.Parsed_ensure_keys
                {
                  e2ee_password = option_value "e2ee-password" options;
                  upload_keys = option_present "upload-keys" options;
                }))
    | [ "sync"; "grant-access" ] ->
        make [ "sync"; "grant-access" ]
          (Sync
             (Sync.Parsed_grant_access
                {
                  graph_id = option_value "graph-id" options;
                  email = option_value "email" options;
                }))
    | [ "sync"; "config"; "get"; key ] -> (
        match sync_config_key_or_error (Some key) with
        | Ok key ->
            make
              [ "sync"; "config"; "get" ]
              (Sync (Sync.Parsed_config_get { key }))
        | Error err -> Error err)
    | [ "sync"; "config"; "get" ] ->
        make
          [ "sync"; "config"; "get" ]
          (Sync (Sync.Parsed_config_get { key = None }))
    | [ "sync"; "config"; "set"; key; value ] -> (
        match sync_config_key_or_error (Some key) with
        | Ok key ->
            make
              [ "sync"; "config"; "set" ]
              (Sync (Sync.Parsed_config_set { key; value = Some value }))
        | Error err -> Error err)
    | [ "sync"; "config"; "set"; key ] -> (
        match sync_config_key_or_error (Some key) with
        | Ok key ->
            make
              [ "sync"; "config"; "set" ]
              (Sync (Sync.Parsed_config_set { key; value = None }))
        | Error err -> Error err)
    | [ "sync"; "config"; "set" ] ->
        make
          [ "sync"; "config"; "set" ]
          (Sync (Sync.Parsed_config_set { key = None; value = None }))
    | [ "sync"; "config"; "unset"; key ] -> (
        match sync_config_key_or_error (Some key) with
        | Ok key ->
            make
              [ "sync"; "config"; "unset" ]
              (Sync (Sync.Parsed_config_unset { key }))
        | Error err -> Error err)
    | [ "sync"; "config"; "unset" ] ->
        make
          [ "sync"; "config"; "unset" ]
          (Sync (Sync.Parsed_config_unset { key = None }))
    | [ "debug"; "pull" ] -> (
        match
          Option.map Debug.parse_ident_option (option_value "ident" options)
        with
        | Some (Error err) -> Error err
        | ident ->
            make [ "debug"; "pull" ]
              (Debug
                 (Debug.Parsed_pull
                    {
                      id = int64_option "id" options;
                      uuid = option_value "uuid" options;
                      ident =
                        Option.bind ident (function
                          | Ok ident -> Some ident
                          | Error _ -> None);
                    })))
    | [ "agent"; "bridge" ] ->
        make [ "agent"; "bridge" ] (Agent Agent.Parsed_bridge)
    | [ "doctor" ] ->
        make [ "doctor" ]
          (Doctor
             (Doctor.Parsed_doctor
                { dev_script = option_present "dev-script" options }))
    | [ "login" ] -> make [ "login" ] (Auth Auth_command.Parsed_login)
    | [ "logout" ] -> make [ "logout" ] (Auth Auth_command.Parsed_logout)
    | [ "skill"; "show" ] -> make [ "skill"; "show" ] (Skill Skill.Parsed_show)
    | [ "skill"; "install" ] ->
        make [ "skill"; "install" ]
          (Skill
             (Skill.Parsed_install { global = option_present "global" options }))
    | [ "completion"; shell ] -> (
        match Cli_primitive.shell_of_string shell with
        | Some shell ->
            make [ "completion" ]
              (Completion (Completion.Parsed_completion { shell = Some shell }))
        | None ->
            Error
              (Error.invalid_options
                 ("unsupported shell: " ^ shell ^ "; expected zsh or bash")))
    | [ "completion" ] ->
        let shell =
          match option_value "shell" options with
          | None ->
              Error
                (Error.invalid_options
                   "completion shell is required; expected zsh or bash")
          | Some shell -> (
              match Cli_primitive.shell_of_string shell with
              | Some shell -> Ok (Some shell)
              | None ->
                  Error
                    (Error.invalid_options
                       ("unsupported shell: " ^ shell
                      ^ "; expected zsh or bash")))
        in
        Error.bind shell (fun shell ->
            make [ "completion" ]
              (Completion (Completion.Parsed_completion { shell })))
    | "example" :: selector ->
        make ("example" :: selector)
          (Example (Example.Parsed_example { selector }))
    | [] -> Error (Error.unknown_command "")
    | _ ->
        Error
          (Error.unknown_command
             ("unknown command: " ^ String.concat " " positional))
