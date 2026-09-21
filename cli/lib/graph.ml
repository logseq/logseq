type export_type = Edn | Sqlite
type import_type = Import_edn | Import_sqlite
type create_opts = { enable_sync : bool; e2ee_password : string option }
type validate_opts = { fix : bool }
type backup_create_opts = { name : string option }
type backup_restore_opts = { src : string; dst : Cli_primitive.graph }
type backup_remove_opts = { src : string }

type export_opts = {
  export_type : export_type;
  file : Cli_primitive.path option;
  edn_options : Melange_edn_melange.any option;
  pretty_print : bool;
  include_timestamps : bool;
  exclude_built_in_pages : bool;
  exclude_namespaces : string Rrbvec.t;
}

type import_opts = { import_type : import_type; input : Cli_primitive.path }

type parsed =
  | Parsed_list
  | Parsed_create of create_opts
  | Parsed_switch
  | Parsed_remove
  | Parsed_validate of validate_opts
  | Parsed_info
  | Parsed_backup_list
  | Parsed_backup_create of backup_create_opts
  | Parsed_backup_restore of backup_restore_opts
  | Parsed_backup_remove of backup_remove_opts
  | Parsed_export of export_opts
  | Parsed_import of import_opts

type action =
  | Graph_list
  | Graph_create of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      opts : create_opts;
    }
  | Graph_switch of { graph : Cli_primitive.graph; repo : Cli_primitive.repo }
  | Graph_remove of { graph : Cli_primitive.graph; repo : Cli_primitive.repo }
  | Graph_validate of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      fix : bool;
    }
  | Graph_info of { graph : Cli_primitive.graph; repo : Cli_primitive.repo }
  | Graph_backup_list of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
    }
  | Graph_backup_create of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      name : string option;
      backup_name : string option;
    }
  | Graph_backup_restore of {
      source_repo : Cli_primitive.repo;
      source_graph : Cli_primitive.graph;
      dst_repo : Cli_primitive.repo;
      dst_graph : Cli_primitive.graph;
      src : string;
      dst : string;
    }
  | Graph_backup_remove of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      src : string;
    }
  | Graph_export of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      opts : export_opts;
    }
  | Graph_import of {
      graph : Cli_primitive.graph;
      repo : Cli_primitive.repo;
      opts : import_opts;
      require_missing_graph : bool;
    }

let normalize_export_type = function
  | "edn" -> Some Edn
  | "sqlite" -> Some Sqlite
  | _ -> None

let normalize_import_type = function
  | "edn" -> Some Import_edn
  | "sqlite" -> Some Import_sqlite
  | _ -> None

let string_of_import_type = function
  | Import_edn -> "edn"
  | Import_sqlite -> "sqlite"

let command_id = function
  | Parsed_list -> Command_id.Graph_list
  | Parsed_create _ -> Graph_create
  | Parsed_switch -> Graph_switch
  | Parsed_remove -> Graph_remove
  | Parsed_validate _ -> Graph_validate
  | Parsed_info -> Graph_info
  | Parsed_backup_list -> Graph_backup_list
  | Parsed_backup_create _ -> Graph_backup_create
  | Parsed_backup_restore _ -> Graph_backup_restore
  | Parsed_backup_remove _ -> Graph_backup_remove
  | Parsed_export _ -> Graph_export
  | Parsed_import _ -> Graph_import

(* CLI option contract for logseq.db.sqlite.export/build-export. Entity
   existence, attribute uniqueness and lookup values belong to Datascript. *)
let edn_export_types =
  [
    "graph";
    "graph-human";
    "graph-ontology";
    "block";
    "page";
    "selected-nodes";
    "view-nodes";
  ]

let edn_graph_content_keys =
  [
    "include-timestamps?";
    "exclude-namespaces";
    "exclude-built-in-pages?";
    "exclude-files?";
  ]

let edn_export_selector_keys =
  [
    ("block-id", "block");
    ("page-id", "page");
    ("node-ids", "selected-nodes");
    ("rows", "view-nodes");
    ("group-by?", "view-nodes");
  ]

let edn_option_get fields name =
  Vec.find_map
    (fun (key, value) ->
      if Edn_util.as_keyword key = Some name then Some value else None)
    fields

let edn_option_path = function
  | [ key ] -> key
  | path -> "[" ^ String.concat " " path ^ "]"

let edn_option_type_error path expected =
  [ "--edn-options " ^ edn_option_path path ^ " must be " ^ expected ^ "." ]

let edn_sequential value =
  match Edn_util.as_vector value with
  | Some values -> Some values
  | None -> Edn_util.as_list value

let edn_entity_selector ~allow_uuid value =
  Option.is_some (Edn_util.as_int64 value)
  || Option.is_some (Edn_util.as_keyword value)
  || (allow_uuid && Option.is_some (Edn_util.as_uuid value))
  ||
  match edn_sequential value with
  | Some values when Vec.length values = 2 ->
      let attr = Vec.nth values 0 in
      Option.is_some (Edn_util.as_keyword attr)
      || Option.is_some (Edn_util.as_string attr)
  | _ -> false

let validate_edn_selector ~allow_uuid path value =
  if edn_entity_selector ~allow_uuid value then []
  else
    edn_option_type_error path
      ("an entity ID, keyword ident or two-element lookup ref"
      ^ if allow_uuid then ", or a UUID" else "")

let validate_edn_nodes ~allow_uuid path value =
  match Edn_util.as_seq value with
  | None -> edn_option_type_error path "a collection of entity selectors"
  | Some nodes ->
      Vec.to_list nodes
      |> List.mapi (fun index node ->
          validate_edn_selector ~allow_uuid
            (path @ [ string_of_int index ])
            node)
      |> List.concat

let validate_edn_rows ~grouped path value =
  if not grouped then validate_edn_nodes ~allow_uuid:true path value
  else
    let validate_group group_path nodes =
      validate_edn_nodes ~allow_uuid:true group_path nodes
    in
    match Edn_util.as_map value with
    | Some groups ->
        Vec.to_list groups
        |> List.map (fun (label, nodes) ->
            validate_group
              (path @ [ Melange_edn_melange.to_edn_string label ])
              nodes)
        |> List.concat
    | None -> (
        match Edn_util.as_seq value with
        | None ->
            edn_option_type_error path
              "a map or collection of [group-label node-collection] pairs"
        | Some groups ->
            Vec.to_list groups
            |> List.mapi (fun index group ->
                let group_path = path @ [ string_of_int index ] in
                match edn_sequential group with
                | Some pair when Vec.length pair = 2 ->
                    validate_group (group_path @ [ "1" ]) (Vec.nth pair 1)
                | _ ->
                    edn_option_type_error group_path
                      "a [group-label node-collection] pair")
            |> List.concat)

let validate_edn_export_options value =
  match Edn_util.as_map value with
  | None ->
      Error
        (Error.invalid_options "graph export --edn-options must be an EDN map")
  | Some fields -> (
      let export_type =
        match edn_option_get fields "export-type" with
        | None -> Some "graph"
        | Some value -> Edn_util.as_keyword value
      in
      let keywords names =
        names |> List.map (fun name -> ":" ^ name) |> String.concat ", "
      in
      match export_type with
      | Some kind when List.mem kind edn_export_types -> (
          let graph_keys =
            "catch-validation-errors?"
            :: (if kind = "graph-human" then edn_graph_content_keys else [])
          in
          let top_keys =
            "export-type" :: "graph-options"
            :: List.filter_map
                 (fun (key, owner) -> if owner = kind then Some key else None)
                 edn_export_selector_keys
          in
          let wrong_export_type path owner =
            [
              "--edn-options " ^ edn_option_path path
              ^ " requires :export-type :" ^ owner
              ^ "; the selected export type is :" ^ kind ^ ".";
            ]
          in
          let unknown_key path allowed =
            [
              "Unknown --edn-options key " ^ edn_option_path path
              ^ ". Allowed keys for :" ^ kind ^ ": " ^ keywords allowed ^ ".";
            ]
          in
          let boolean path value =
            if Option.is_some (Edn_util.as_bool value) then []
            else edn_option_type_error path "an EDN boolean"
          in
          let validate_graph_option path key value =
            match key with
            | "exclude-namespaces" -> (
                match Edn_util.as_set value with
                | Some names
                  when Vec.for_all
                         (fun name ->
                           Option.is_some (Edn_util.as_keyword name)
                           || Option.is_some (Edn_util.as_string name))
                         names ->
                    []
                | _ -> edn_option_type_error path "a set of keywords or strings"
                )
            | _ -> boolean path value
          in
          let validate_fields path allowed validate entries =
            Vec.to_list entries
            |> List.concat_map (fun (key, value) ->
                let key_path =
                  path @ [ Melange_edn_melange.to_edn_string key ]
                in
                match Edn_util.as_keyword key with
                | Some name -> validate key_path name value
                | None -> unknown_key key_path allowed)
          in
          let graph_options path value =
            match Edn_util.as_map value with
            | None -> edn_option_type_error path "an EDN map"
            | Some entries ->
                validate_fields path graph_keys
                  (fun key_path key value ->
                    if List.mem key graph_keys then
                      validate_graph_option key_path key value
                    else if List.mem key edn_graph_content_keys then
                      wrong_export_type key_path "graph-human"
                    else if
                      key = "export-type" || key = "graph-options"
                      || List.mem_assoc key edn_export_selector_keys
                    then
                      [
                        ("Invalid --edn-options key " ^ edn_option_path key_path
                       ^ "; use :" ^ key ^ " at the top level."
                        ^
                        match List.assoc_opt key edn_export_selector_keys with
                        | Some owner -> " Requires :export-type :" ^ owner ^ "."
                        | None -> "");
                      ]
                    else unknown_key key_path graph_keys)
                  entries
          in
          let validate_top path key value =
            if
              List.mem key ("catch-validation-errors?" :: edn_graph_content_keys)
            then
              let owner =
                if key = "catch-validation-errors?" then kind else "graph-human"
              in
              [
                "Invalid --edn-options key " ^ edn_option_path path
                ^ ". Use :graph-options: {:export-type :" ^ owner
                ^ " :graph-options {:" ^ key ^ " "
                ^ Melange_edn_melange.to_edn_string value
                ^ "}}.";
              ]
            else if not (List.mem key top_keys) then
              match List.assoc_opt key edn_export_selector_keys with
              | Some owner -> wrong_export_type path owner
              | None -> unknown_key path top_keys
            else
              match key with
              | "export-type" -> []
              | "graph-options" -> graph_options path value
              | "group-by?" -> boolean path value
              | "block-id" | "page-id" ->
                  validate_edn_selector ~allow_uuid:false path value
              | "node-ids" -> validate_edn_nodes ~allow_uuid:false path value
              | "rows" ->
                  let grouped =
                    Option.bind
                      (edn_option_get fields "group-by?")
                      Edn_util.as_bool
                    = Some true
                  in
                  validate_edn_rows ~grouped path value
              | _ -> assert false
          in
          let missing =
            List.filter_map
              (fun (key, owner) ->
                if
                  owner = kind && key <> "group-by?"
                  && Option.is_none (edn_option_get fields key)
                then
                  Some
                    ("--edn-options :" ^ key ^ " is required for :export-type :"
                   ^ kind ^ ".")
                else None)
              edn_export_selector_keys
          in
          let errors =
            missing @ validate_fields [] top_keys validate_top fields
            |> List.sort String.compare
          in
          match errors with
          | [] -> Ok ()
          | _ -> Error (Error.invalid_options (String.concat "\n" errors)))
      | _ ->
          Error
            (Error.invalid_options
               ("--edn-options :export-type must be one of "
              ^ keywords edn_export_types ^ ".")))

let validate_parsed = function
  | Parsed_create opts
    when Option.is_some opts.e2ee_password && not opts.enable_sync ->
      Error (Error.invalid_options "--e2ee-password requires --enable-sync")
  | Parsed_export opts
    when opts.export_type = Sqlite
         && (Option.is_some opts.edn_options || opts.pretty_print) ->
      Error
        (Error.invalid_options
           "graph export --type sqlite does not accept --edn-options or \
            --pretty-print")
  | Parsed_export { edn_options = Some value; _ } ->
      validate_edn_export_options value
  | _ -> Ok ()

let utc_timestamp () =
  let year, month, day, hour, minute, second =
    Time.utc_date_time (Time.now ())
  in
  Printf.sprintf "%04d%02d%02dT%02d%02d%02dZ" year month day hour minute second

let safe_backup_part value =
  let buffer = Buffer.create (String.length value) in
  String.iter
    (function
      | '/' | '\\' | ':' -> Buffer.add_char buffer '-'
      | c -> Buffer.add_char buffer c)
    value;
  Buffer.contents buffer

let build_backup_name repo label =
  let graph =
    safe_backup_part
      (Cli_primitive.string_of_graph (Cli_config.repo_to_graph repo))
  in
  let timestamp = utc_timestamp () in
  match label with
  | Some label when String.trim label <> "" ->
      graph ^ "-" ^ safe_backup_part (String.trim label) ^ "-" ^ timestamp
  | _ -> graph ^ "-" ^ timestamp

let tmp_sqlite_counter = ref 0

let tmp_sqlite_path dir =
  incr tmp_sqlite_counter;
  let stamp =
    int_of_float (Time.time_to_epoch_seconds_float (Time.now ()) *. 1_000_000.)
  in
  Filename.concat dir
    ("db." ^ string_of_int stamp ^ "."
    ^ string_of_int !tmp_sqlite_counter
    ^ ".tmp.sqlite")

let validate_graph_name graph =
  let graph_name = graph |> Cli_primitive.string_of_graph |> String.trim in
  if graph_name = "" || graph_name = "." || graph_name = ".." then
    Error (Error.invalid_options "graph name must not be empty, '.', or '..'")
  else Ok (Cli_primitive.create_graph graph_name)

let graph_and_repo graph =
  Error.bind (validate_graph_name graph) (fun graph ->
      Ok (graph, Cli_config.graph_to_repo graph))

let optional_graph_and_repo graph =
  match graph with
  | None -> Ok (None, None)
  | Some graph ->
      Error.bind (graph_and_repo graph) (fun (graph, repo) ->
          Ok (Some graph, Some repo))

let explicit_graph_and_repo globals =
  optional_graph_and_repo globals.Global_opts.graph

let build ?registry:_ config globals parsed =
  Error.bind (validate_parsed parsed) (fun () ->
      Error.bind (explicit_graph_and_repo globals)
        (fun (explicit_graph, explicit_repo) ->
          Error.bind
            (optional_graph_and_repo (Cli_config.pick_graph config globals))
            (fun (selected_graph, selected_repo) ->
              match parsed with
              | Parsed_list -> Ok Graph_list
              | Parsed_create opts -> (
                  match (explicit_graph, explicit_repo) with
                  | Some graph, Some repo ->
                      Ok (Graph_create { graph; repo; opts })
                  | _ -> Error (Error.missing_graph ()))
              | Parsed_switch -> (
                  match (explicit_graph, explicit_repo) with
                  | Some graph, Some repo -> Ok (Graph_switch { graph; repo })
                  | _ -> Error (Error.missing_graph ()))
              | Parsed_remove -> (
                  match (explicit_graph, explicit_repo) with
                  | Some graph, Some repo -> Ok (Graph_remove { graph; repo })
                  | _ -> Error (Error.missing_graph ()))
              | Parsed_validate opts -> (
                  match (selected_graph, selected_repo) with
                  | Some graph, Some repo ->
                      Ok (Graph_validate { graph; repo; fix = opts.fix })
                  | _ -> Error (Error.missing_graph ()))
              | Parsed_info -> (
                  match (selected_graph, selected_repo) with
                  | Some graph, Some repo -> Ok (Graph_info { graph; repo })
                  | _ -> Error (Error.missing_graph ()))
              | Parsed_backup_list -> (
                  match (selected_graph, selected_repo) with
                  | Some graph, Some repo ->
                      Ok (Graph_backup_list { graph; repo })
                  | _ ->
                      Error
                        (Error.missing_repo "repo is required for backup list"))
              | Parsed_backup_create opts -> (
                  match (selected_graph, selected_repo) with
                  | Some graph, Some repo ->
                      let name =
                        Option.bind opts.name (fun value ->
                            let value = String.trim value in
                            if value = "" then None else Some value)
                      in
                      Ok
                        (Graph_backup_create
                           {
                             graph;
                             repo;
                             name;
                             backup_name = Some (build_backup_name repo name);
                           })
                  | _ ->
                      Error
                        (Error.missing_repo "repo is required for backup create")
                  )
              | Parsed_backup_restore opts -> (
                  match (selected_graph, selected_repo) with
                  | Some source_graph, Some source_repo ->
                      let src = String.trim opts.src in
                      let dst =
                        String.trim (Cli_primitive.string_of_graph opts.dst)
                      in
                      if dst = "" then
                        Error
                          (Error.make Error.Missing_dst
                             "destination graph name is required")
                      else
                        let dst_graph = Cli_primitive.create_graph dst in
                        let dst_repo = Cli_config.graph_to_repo dst_graph in
                        Ok
                          (Graph_backup_restore
                             {
                               source_repo;
                               source_graph;
                               dst_repo;
                               dst_graph;
                               src;
                               dst;
                             })
                  | _ ->
                      Error
                        (Error.missing_repo
                           "repo is required for backup restore"))
              | Parsed_backup_remove opts -> (
                  match (selected_graph, selected_repo) with
                  | Some graph, Some repo ->
                      Ok
                        (Graph_backup_remove
                           { graph; repo; src = String.trim opts.src })
                  | _ ->
                      Error
                        (Error.missing_repo "repo is required for backup remove")
                  )
              | Parsed_export opts -> (
                  match (selected_graph, selected_repo) with
                  | Some graph, Some repo -> (
                      match (opts.export_type, opts.file) with
                      | Edn, None ->
                          Error
                            (Error.invalid_options
                               "graph export --type edn requires --file")
                      | Sqlite, _ -> Ok (Graph_export { graph; repo; opts })
                      | Edn, Some _ -> Ok (Graph_export { graph; repo; opts }))
                  | _ ->
                      Error (Error.missing_repo "repo is required for export"))
              | Parsed_import opts -> (
                  match (selected_graph, selected_repo) with
                  | Some graph, Some repo ->
                      Ok
                        (Graph_import
                           {
                             graph;
                             repo;
                             opts;
                             require_missing_graph =
                               opts.import_type = Import_sqlite;
                           })
                  | _ ->
                      Error (Error.missing_repo "repo is required for import")))))

let graphs_dir config = Filename.concat config.Cli_config.root_dir "graphs"

let rec ensure_dir path =
  if Cli_unix.file_exists path then ()
  else
    let parent = Filename.dirname path in
    if parent <> path then ensure_dir parent;
    Cli_unix.mkdir path 0o755

let rec remove_tree path =
  if Cli_unix.file_exists path then
    if Cli_unix.is_directory path then (
      Cli_unix.readdir path
      |> Array.iter (fun name -> remove_tree (Filename.concat path name));
      Cli_unix.rmdir path)
    else Cli_unix.remove_tree path

let write_file path content = Cli_unix.write_text_file path content

let graph_path config graph =
  Filename.concat (graphs_dir config)
    (Graph_dir.encode_graph_dir_name (Cli_primitive.string_of_graph graph))

let graph_exists config graph =
  Cli_unix.file_exists (graph_path config graph)
  && Cli_unix.is_directory (graph_path config graph)

let graph_item_value (item : Graph_types.graph_item) =
  Edn_util.map_vec
    (Vec.of_array
       [|
         (Edn_util.keyword "kind", Edn_util.keyword "canonical");
         ( Edn_util.keyword "graph-name",
           Edn_util.string
             (Cli_primitive.string_of_graph (Option.get item.graph_name)) );
         ( Edn_util.keyword "graph-dir",
           Edn_util.string (Option.get item.graph_dir) );
       |])

let graph_list_value graph_items =
  let graphs =
    Vec.map
      (fun item ->
        Edn_util.string
          (Cli_primitive.string_of_graph
             (Option.get item.Graph_types.graph_name)))
      graph_items
  in
  Edn_util.map_vec
    (Vec.of_array
       [|
         (Edn_util.keyword "graphs", Edn_util.vector_vec graphs);
         ( Edn_util.keyword "graph-items",
           Edn_util.vector_vec (Vec.map graph_item_value graph_items) );
       |])

let backup_root_path config graph =
  Filename.concat (graph_path config graph) "backup"

let backup_dir_path config graph name =
  Filename.concat (backup_root_path config graph) name

let backup_db_path backup_dir = Filename.concat backup_dir "db.sqlite"
let backup_metadata_path backup_dir = Filename.concat backup_dir "metadata.edn"
let kw name = Edn_util.keyword name
let string value = Edn_util.string value
let bool value = Edn_util.bool value

let export_format = function
  | Edn -> Edn_util.keyword_t "edn"
  | Sqlite -> Edn_util.keyword_t "sqlite"

let import_format = function
  | Import_edn -> Edn_util.keyword_t "edn"
  | Import_sqlite -> Edn_util.keyword_t "sqlite"

let default_sqlite_export_path config repo =
  let export_root =
    Filename.concat (graph_path config (Cli_config.repo_to_graph repo)) "export"
  in
  ensure_dir export_root;
  let timestamp_seconds =
    int_of_float (Time.time_to_epoch_seconds_float (Time.now ()))
  in
  let graph_name =
    Cli_config.repo_to_graph repo |> Cli_primitive.string_of_graph
  in
  Filename.concat export_root
    (graph_name ^ "_" ^ string_of_int timestamp_seconds ^ ".sqlite")

let export_payload opts =
  match opts.edn_options with
  | Some value when Option.is_some (Edn_util.get value "export-type") -> value
  | Some value -> Edn_util.assoc "export-type" (kw "graph") value
  | None -> Edn_util.map_vec (Vec.singleton (kw "export-type", kw "graph"))

let write_pretty_edn path data =
  try
    Cli_unix.write_text_file path
      Ustring.(of_string (Pretty_print.pprint_edn data) |> to_string);
    Cli_effect.pure (Ok ())
  with exn -> Cli_effect.pure (Error (Error.exception_error exn))

let graph_export_message mode _config path =
  Cli_result.ok ~command:Command_id.Graph_export mode
    (Message ("wrote " ^ path))

let graph_import_message mode _config graph opts new_graph =
  let graph = Cli_primitive.string_of_graph graph in
  let import_type = string_of_import_type opts.import_type in
  let message =
    (if new_graph then "Created graph " ^ graph ^ "\n" else "")
    ^ "Imported " ^ import_type ^ " from " ^ opts.input
  in
  Cli_result.ok ~command:Command_id.Graph_import mode
    (Raw
       (Edn_util.map_vec
          (Vec.of_array
             [|
               (kw "new-graph?", bool new_graph); (kw "message", string message);
             |])))

let validation_errors value =
  match Edn_util.as_map value with
  | Some _ -> (
      match Option.bind (Edn_util.get value "errors") Edn_util.as_seq with
      | Some errors -> errors
      | None -> Vec.empty)
  | None -> Vec.empty

let format_count count noun = Humanize_types.format_count_with_noun count noun

let graph_validate_result mode _config result =
  let errors = validation_errors result in
  if Vec.is_empty errors then
    Cli_result.ok ~command:Command_id.Graph_validate mode
      (Raw (Edn_util.map_vec (Vec.of_array [| (kw "result", result) |])))
  else
    let count = Vec.length errors in
    Cli_result.error ~command:Command_id.Graph_validate mode
      (Error.make
         ~context:
           (Edn_util.map_vec
              (Vec.of_array [| (kw "errors", Edn_util.vector_vec errors) |]))
         Error.Graph_validation_failed
         ("Graph invalid. Found "
         ^ format_count count "entity"
         ^ " with errors:\n"
         ^ Melange_edn_melange.to_edn_string (Edn_util.vector_vec errors)))

let sym name = Edn_util.symbol name
let vector_t_vec values = Edn_util.vector_t_vec values
let list_vec values = Edn_util.list_vec values

let graph_info_query =
  Cli_primitive.(
    make_datascript_query
      ~find:(Vec.of_array [| sym "?ident"; sym "?value" |])
      ~where:
        (Vec.of_array
           [|
             V
               (vector_t_vec
                  (Vec.of_array [| sym "?e"; kw "db/ident"; sym "?ident" |]));
             V
               (vector_t_vec
                  (Vec.of_array
                     [|
                       list_vec
                         (Vec.of_array [| sym "namespace"; sym "?ident" |]);
                       sym "?ns";
                     |]));
             V
               (vector_t_vec
                  (Vec.of_array
                     [|
                       list_vec
                         (Vec.of_array
                            [| sym "="; string "logseq.kv"; sym "?ns" |]);
                     |]));
             V
               (vector_t_vec
                  (Vec.of_array [| sym "?e"; kw "kv/value"; sym "?value" |]));
           |])
      ()
    |> datascript_query_to_edn)

let graph_info_key value =
  match Edn_util.as_keyword value with
  | Some value -> value
  | None -> (
      match Edn_util.as_symbol value with
      | Some value -> value
      | None -> (
          match Edn_util.as_string value with
          | Some value -> value
          | None -> Melange_edn_melange.to_edn_string value))

let graph_info_kv rows =
  let row_fields row =
    match (Edn_util.as_vector row, Edn_util.as_list row) with
    | Some values, _ when Vec.length values = 2 ->
        Some
          (Edn_util.string (graph_info_key (Vec.nth values 0)), Vec.nth values 1)
    | _, Some values when Vec.length values = 2 ->
        Some
          (Edn_util.string (graph_info_key (Vec.nth values 0)), Vec.nth values 1)
    | _ -> None
  in
  rows |> Vec.filter_map row_fields

let parse_positive_int64 text =
  let text = String.trim text in
  if text = "" then None else Int64.of_string_opt text

let graph_info_timestamp_seconds value =
  let timestamp =
    match Edn_util.as_int64 value with
    | Some value -> Some value
    | None -> parse_positive_int64 (Melange_edn_melange.to_edn_string value)
  in
  timestamp
  |> Option.map (fun timestamp ->
      if Int64.compare timestamp 100_000_000_000L >= 0 then
        Int64.div timestamp 1_000L
      else timestamp)

let graph_info_datetime_value : type a.
    a Output.Mode.t -> Melange_edn_melange.any -> Melange_edn_melange.any =
 fun mode value ->
  match (mode, graph_info_timestamp_seconds value) with
  | Output.Mode.Human, Some then_seconds ->
      Edn_util.string
        (Humanize_types.datetime
           ~now:(Time.time_to_epoch_seconds (Time.now ()))
           then_seconds)
  | _ -> value

let graph_info_result mode _config graph rows =
  let graph = Cli_primitive.string_of_graph graph in
  let kv = graph_info_kv rows in
  let kv_value key = Vec.assoc_opt (Edn_util.string key) kv in
  let graph_created_at =
    Option.value
      (kv_value "logseq.kv/graph-created-at"
      |> Option.map (graph_info_datetime_value mode))
      ~default:Edn_util.nil
  in
  let fields =
    [
      (kw "graph", string graph);
      (kw "logseq.kv/graph-created-at", graph_created_at);
      ( kw "logseq.kv/schema-version",
        Option.value (kv_value "logseq.kv/schema-version") ~default:Edn_util.nil
      );
      (kw "kv", Edn_util.map_vec kv);
    ]
  in
  Cli_result.ok ~command:Command_id.Graph_info mode (Raw (Edn_util.map fields))

let read_file_opt path =
  if not (Cli_unix.file_exists path) then None
  else Some (Cli_unix.read_text_file path)

let strip_leading_colon value =
  if String.length value > 0 && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let metadata_source backup_dir =
  match read_file_opt (backup_metadata_path backup_dir) with
  | Some text -> (
      try
        let metadata = Melange_edn_melange.of_edn_string text in
        Option.bind (Edn_util.get metadata "source") (fun value ->
            Edn_util.as_string_like value)
        |> Option.map strip_leading_colon
      with _ -> None)
  | _ -> None

let backup_entry root name =
  let dir = Filename.concat root name in
  let db_path = backup_db_path dir in
  if
    Cli_unix.file_exists dir && Cli_unix.is_directory dir
    && Cli_unix.file_exists db_path
  then
    let stat = Cli_unix.stat db_path in
    let fields =
      Vec.of_array
        [|
          (kw "name", string name);
          (kw "created-at", Edn_util.float stat.Cli_unix.st_mtime);
          (kw "size-bytes", Edn_util.int stat.Cli_unix.st_size);
        |]
    in
    let fields =
      match metadata_source dir with
      | Some source -> Vec.push_back fields (kw "source", string source)
      | None -> fields
    in
    Some (Edn_util.map_vec fields)
  else None

let list_backups config graph =
  let root = backup_root_path config graph in
  if not (Cli_unix.file_exists root) then Vec.empty
  else
    Cli_unix.readdir root |> Vec.of_array |> Vec.sort String.compare
    |> Vec.filter_map (backup_entry root)

let graph_backup_list_result mode config graph =
  Cli_result.ok ~command:Command_id.Graph_backup_list mode
    (Raw
       (Edn_util.map_vec
          (Vec.of_array
             [|
               (kw "backups", Edn_util.vector_vec (list_backups config graph));
             |])))

let graph_backup_remove_result mode config graph src =
  let dir = backup_dir_path config graph src in
  if Cli_unix.file_exists dir then (
    remove_tree dir;
    Cli_result.ok ~command:Command_id.Graph_backup_remove mode
      (Message ("Removed backup " ^ src)))
  else
    Cli_result.error ~command:Command_id.Graph_backup_remove mode
      (Error.make Error.Backup_not_found ("backup not found: " ^ src))

let reserve_backup_target config graph base_name =
  let root = backup_root_path config graph in
  ensure_dir root;
  let rec loop suffix =
    let backup_name =
      if suffix = 0 then base_name else base_name ^ "-" ^ string_of_int suffix
    in
    let dir = backup_dir_path config graph backup_name in
    if Cli_unix.file_exists dir then loop (suffix + 1)
    else (
      Cli_unix.mkdir dir 0o755;
      (backup_name, dir, backup_db_path dir))
  in
  loop 0

let write_backup_metadata dir ~backup_name ~repo ~db_path =
  let repo = Cli_primitive.string_of_repo repo in
  let created_at_ms = Time.time_to_epoch_ms (Time.now ()) in
  write_file (backup_metadata_path dir)
    (Melange_edn_melange.to_edn_string
       (Edn_util.map_vec
          (Vec.of_array
             [|
               (kw "schema-version", Edn_util.int 1);
               (kw "name", string backup_name);
               (kw "repo", string repo);
               (kw "source", kw "cli");
               (kw "created-at-ms", Edn_util.int64 created_at_ms);
               (kw "db-path", string db_path);
             |])))

let graph_backup_create_result mode config graph repo name backup_name =
  let open Cli_effect in
  let base_name =
    Option.value backup_name ~default:(build_backup_name repo name)
  in
  bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Graph_backup_create mode err)
    | Ok invoke_config ->
        let backup_name, dir, db_path =
          reserve_backup_target config graph base_name
        in
        let tmp_path = tmp_sqlite_path dir in
        let success_result () =
          Cli_result.ok ~command:Command_id.Graph_backup_create mode
            (Raw
               (Edn_util.map_vec
                  (Vec.of_array
                     [|
                       (kw "backup-name", string backup_name);
                       (kw "path", string db_path);
                       (kw "message", string ("Created backup " ^ backup_name));
                     |])))
        in
        let error_result code message =
          Cli_result.error ~command:Command_id.Graph_backup_create mode
            (Error.make code message)
        in
        let backup_effect =
          bind
            (Transport.thread_api_backup_db_sqlite invoke_config ~repo
               ~path:tmp_path) (fun _ ->
              if Cli_unix.file_exists tmp_path then (
                Cli_unix.rename tmp_path db_path;
                write_backup_metadata dir ~backup_name ~repo ~db_path;
                pure (success_result ()))
              else (
                remove_tree dir;
                pure
                  (error_result Error.Missing_snapshot
                     ("snapshot did not create sqlite backup: " ^ tmp_path))))
        in
        catch backup_effect (fun exn ->
            remove_tree dir;
            pure
              (Cli_result.error ~command:Command_id.Graph_backup_create mode
                 (Error.make
                    ~context:(Edn_util.string (Printexc.to_string exn))
                    Error.Backup_create_failed "backup create failed"))))

let graph_create_data result =
  Option.value (Cli_result.data_value result) ~default:Edn_util.nil

let graph_create_enable_sync_result mode _config graph repo create_result
    upload_result start_result =
  Cli_result.ok ~command:Command_id.Graph_create mode
    (Raw
       (Edn_util.map_vec
          (Vec.of_array
             [|
               (kw "graph", string (Cli_primitive.string_of_graph graph));
               (kw "repo", string (Cli_primitive.string_of_repo repo));
               ( kw "stages",
                 Edn_util.map_vec
                   (Vec.of_array
                      [|
                        (kw "create", graph_create_data create_result);
                        (kw "upload", graph_create_data upload_result);
                        (kw "start", graph_create_data start_result);
                      |]) );
             |])))

let execute_graph_create_invoke mode _graph repo config =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Graph_create mode err)
    | Ok invoke_config ->
        bind
          (Transport.thread_api_create_or_open_db invoke_config ~repo
             ~options:(Edn_util.map_t_vec Vec.empty))
          (fun result ->
            pure
              (Cli_result.ok ~command:Command_id.Graph_create mode
                 (Raw
                    (Edn_util.map_vec
                       (Vec.of_array [| (kw "result", result) |]))))))

let execute_graph_create_enable_sync mode graph repo opts config =
  let open Cli_effect in
  bind (execute_graph_create_invoke mode graph repo config)
    (fun create_result ->
      if Cli_result.is_error create_result then pure create_result
      else
        bind
          (Sync.execute
             (Sync.Sync_upload
                { repo; graph; e2ee_password = opts.e2ee_password })
             config)
          (fun upload_result ->
            if Cli_result.is_error upload_result then
              pure
                (Cli_result.with_command Command_id.Graph_create upload_result)
            else
              bind
                (Sync.execute
                   (Sync.Sync_start
                      { repo; graph; e2ee_password = opts.e2ee_password })
                   config)
                (fun start_result ->
                  if Cli_result.is_error start_result then
                    pure
                      (Cli_result.with_command Command_id.Graph_create
                         start_result)
                  else
                    pure
                      (graph_create_enable_sync_result mode config graph repo
                         create_result upload_result start_result))))

let execute_graph_create mode graph repo opts config =
  let open Cli_effect in
  if opts.enable_sync then
    bind (Server_runtime.create_graph config repo) (function
      | Error err ->
          pure (Cli_result.error ~command:Command_id.Graph_create mode err)
      | Ok generation ->
          execute_graph_create_enable_sync mode graph repo opts
            { config with graph_generation = Some generation })
  else
    match config.Cli_config.base_url with
    | None ->
        bind (Server_runtime.create_graph config repo) (function
          | Error err ->
              pure (Cli_result.error ~command:Command_id.Graph_create mode err)
          | Ok _ ->
              pure
                (Cli_result.ok ~command:Command_id.Graph_create mode
                   (Message
                      ("Created graph \""
                      ^ Cli_primitive.string_of_graph graph
                      ^ "\""))))
    | Some _ -> execute_graph_create_invoke mode graph repo config

let execute_graph_export mode _graph repo opts config =
  let open Cli_effect in
  let output_path =
    match (opts.file, opts.export_type) with
    | Some path, _ -> path
    | None, Sqlite -> default_sqlite_export_path config repo
    | None, Edn -> ""
  in
  bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Graph_export mode err)
    | Ok invoke_config -> (
        match opts.export_type with
        | Edn ->
            bind
              (Transport.thread_api_export_edn invoke_config ~repo
                 ~options:
                   (Edn_util.expect_map_t "graph export options"
                      (export_payload opts)))
              (fun exported ->
                bind
                  (if opts.pretty_print then
                     write_pretty_edn output_path exported
                   else
                     Transport.write_output
                       ~format:(export_format opts.export_type)
                       ~path:output_path ~data:exported)
                  (function
                    | Ok () ->
                        pure (graph_export_message mode config output_path)
                    | Error err ->
                        pure
                          (Cli_result.error ~command:Command_id.Graph_export
                             mode err)))
        | Sqlite ->
            bind
              (Transport.thread_api_backup_db_sqlite invoke_config ~repo
                 ~path:output_path) (fun _ ->
                pure (graph_export_message mode config output_path))))

let execute_graph_import mode graph repo opts config =
  let open Cli_effect in
  let new_graph = not (graph_exists config graph) in
  bind
    (Transport.read_input
       ~format:(import_format opts.import_type)
       ~path:opts.input)
    (function
      | Error err ->
          pure (Cli_result.error ~command:Command_id.Graph_import mode err)
      | Ok input_data ->
          let import_after_stop () =
            bind (Server_runtime.create_graph config repo) (function
              | Error err ->
                  pure
                    (Cli_result.error ~command:Command_id.Graph_import mode err)
              | Ok generation ->
                  let config =
                    { config with graph_generation = Some generation }
                  in
                  bind
                    (Server_runtime.ensure_server config repo
                       ~create_empty_db:false) (function
                    | Error err ->
                        pure
                          (Cli_result.error ~command:Command_id.Graph_import
                             mode err)
                    | Ok invoke_config ->
                        bind
                          (match opts.import_type with
                          | Import_edn ->
                              Transport.thread_api_import_edn invoke_config
                                ~repo ~data:input_data
                          | Import_sqlite ->
                              Transport.thread_api_import_db_binary
                                invoke_config ~repo ~data:input_data)
                          (fun _ ->
                            bind (Server_runtime.restart_server config repo)
                              (function
                              | Error err ->
                                  pure
                                    (Cli_result.error
                                       ~command:Command_id.Graph_import mode err)
                              | Ok _ ->
                                  pure
                                    (graph_import_message mode config graph opts
                                       new_graph)))))
          in
          bind (Server_runtime.stop_server config repo) (function
            | Error err when err.Error.code = Error.Server_not_found ->
                import_after_stop ()
            | Error err ->
                pure
                  (Cli_result.error ~command:Command_id.Graph_import mode err)
            | Ok _ -> import_after_stop ()))

let execute_graph_backup_restore mode source_graph dst_graph dst_repo src config
    =
  let db_path = backup_db_path (backup_dir_path config source_graph src) in
  if not (Cli_unix.file_exists db_path) then
    Cli_effect.pure
      (Cli_result.error ~command:Command_id.Graph_backup_restore mode
         (Error.make Error.Backup_not_found ("backup not found: " ^ src)))
  else
    let opts = { import_type = Import_sqlite; input = db_path } in
    Cli_effect.map
      (Cli_result.with_command Command_id.Graph_backup_restore)
      (execute_graph_import mode dst_graph dst_repo opts config)

let execute_graph_validate mode repo fix config =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Graph_validate mode err)
    | Ok invoke_config ->
        bind
          (Transport.thread_api_validate_db invoke_config ~repo
             ~options:
               (Edn_util.map_t_vec (Vec.of_array [| (kw "fix", bool fix) |])))
          (fun result -> pure (graph_validate_result mode config result)))

let execute_graph_info mode graph repo config =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Graph_info mode err)
    | Ok invoke_config ->
        bind
          (Transport.thread_api_q invoke_config ~repo
             ~query:
               (vector_t_vec (Vec.of_array [| Edn_util.any graph_info_query |])))
          (fun result ->
            let rows =
              match Edn_util.as_seq result with
              | Some rows -> rows
              | _ when Edn_util.is_null result -> Vec.empty
              | _ -> Vec.singleton result
            in
            pure (graph_info_result mode config graph rows)))

let execute_graph_switch mode graph repo config =
  let open Cli_effect in
  let graph_name = Cli_primitive.string_of_graph graph in
  if not (graph_exists config graph) then
    pure
      (Cli_result.error ~command:Command_id.Graph_switch mode
         (Error.make Error.Graph_not_exists "graph not exists"))
  else
    bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
      (function
      | Error err ->
          pure (Cli_result.error ~command:Command_id.Graph_switch mode err)
      | Ok _ ->
          bind
            (Cli_config.update_config config
               (Edn_util.map_vec
                  (Vec.of_array [| (kw "graph", string graph_name) |])))
            (function
              | Error err ->
                  pure
                    (Cli_result.error ~command:Command_id.Graph_switch mode err)
              | Ok _ ->
                  pure
                    (Cli_result.ok ~command:Command_id.Graph_switch mode
                       (Message ("switched to " ^ graph_name)))))

let execute_graph_remove mode graph repo config =
  let open Cli_effect in
  let on_removed () =
    match Cli_config.read_config_file config.Cli_config.config_path with
    | Error err -> pure (Error err)
    | Ok raw_file_config ->
        let selected =
          Option.bind raw_file_config (fun value ->
              Edn_util.get_string value "graph")
        in
        if selected = Some (Cli_primitive.string_of_graph graph) then
          Cli_config.update_config
            { config with raw_file_config }
            (Edn_util.map_vec (Vec.singleton (kw "graph", Edn_util.nil)))
          |> map (Result.map (fun _ -> ()))
        else pure (Ok ())
  in
  bind (Server_runtime.delete_graph config repo ~on_removed) (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Graph_remove mode err)
    | Ok false ->
        pure
          (Cli_result.error ~command:Command_id.Graph_remove mode
             (Error.make Error.Graph_not_exists "graph not exists"))
    | Ok true ->
        pure
          (Cli_result.ok ~command:Command_id.Graph_remove mode
             (Message
                ("Removed graph \"" ^ Cli_primitive.string_of_graph graph ^ "\""))))

let execute_with_mode action config mode =
  let pure = Cli_effect.pure in
  match action with
  | Graph_list ->
      let graph_items = Server_runtime.list_graph_items config in
      pure
        (Cli_result.ok ~command:Command_id.Graph_list mode
           (Raw (graph_list_value graph_items)))
  | Graph_create { graph; repo; opts } ->
      execute_graph_create mode graph repo opts config
  | Graph_switch { graph; repo } -> execute_graph_switch mode graph repo config
  | Graph_remove { graph; repo } -> execute_graph_remove mode graph repo config
  | Graph_validate { repo; fix; _ } ->
      execute_graph_validate mode repo fix config
  | Graph_info { graph; repo } -> execute_graph_info mode graph repo config
  | Graph_backup_list { graph; _ } ->
      pure (graph_backup_list_result mode config graph)
  | Graph_backup_create { graph; repo; name; backup_name } ->
      graph_backup_create_result mode config graph repo name backup_name
  | Graph_backup_restore { source_graph; dst_repo; dst_graph; src; _ } ->
      execute_graph_backup_restore mode source_graph dst_graph dst_repo src
        config
  | Graph_backup_remove { graph; src; _ } ->
      pure (graph_backup_remove_result mode config graph src)
  | Graph_export { repo; opts; _ } ->
      execute_graph_export mode "" repo opts config
  | Graph_import { graph; repo; opts; _ } ->
      execute_graph_import mode graph repo opts config

let meta ?(examples = Vec.empty) id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples;
    options = Vec.empty;
    category = Command_registry.Graph_management;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
    human_table_headers_order = Vec.empty;
  }

let metadata () =
  Vec.of_array
    [|
      meta
        ~examples:(Vec.singleton "logseq graph list")
        Command_id.Graph_list "List graphs";
      meta
        ~examples:
          (Vec.of_array
             [|
               "logseq graph create --graph my-graph";
               "logseq graph create --graph my-graph --enable-sync";
               "logseq graph create --graph my-graph --enable-sync \
                --e2ee-password \"my-secret\"";
             |])
        Graph_create "Create graph";
      meta
        ~examples:(Vec.singleton "logseq graph switch --graph my-graph")
        Graph_switch "Switch current graph";
      meta
        ~examples:(Vec.singleton "logseq graph remove --graph my-graph")
        Graph_remove "Remove graph";
      meta
        ~examples:
          (Vec.of_array
             [|
               "logseq graph validate --graph my-graph";
               "logseq graph validate --graph my-graph --fix";
             |])
        Graph_validate "Validate graph";
      meta
        ~examples:(Vec.singleton "logseq graph info --graph my-graph")
        Graph_info "Graph metadata";
      meta
        ~examples:
          (Vec.of_array
             [|
               "logseq graph export --graph my-graph --type edn --file \
                /tmp/my-graph.edn --edn-options '{:export-type :graph-human \
                :graph-options {:include-timestamps? true}}' --pretty-print";
               "logseq graph export --graph my-graph --type sqlite --file \
                /tmp/my-graph.sqlite";
             |])
        Graph_export "Export graph";
      meta
        ~examples:
          (Vec.of_array
             [|
               "logseq graph import --graph my-graph --type edn --input \
                /tmp/my-graph.edn";
             |])
        Graph_import "Import graph";
      meta
        ~examples:(Vec.singleton "logseq graph backup list --graph my-graph")
        Graph_backup_list "List graph backups";
      meta
        ~examples:
          (Vec.of_array
             [|
               "logseq graph backup create --graph my-graph";
               "logseq graph backup create --graph my-graph --name nightly";
             |])
        Graph_backup_create "Create graph backup";
      meta
        ~examples:
          (Vec.of_array
             [|
               "logseq graph backup restore --src my-graph-nightly --dst \
                my-graph-restore";
             |])
        Graph_backup_restore "Restore graph backup";
      meta
        ~examples:
          (Vec.singleton "logseq graph backup remove --src my-graph-nightly")
        Graph_backup_remove "Remove graph backup";
    |]

let repo = function
  | Graph_list -> None
  | Graph_create { repo; _ }
  | Graph_switch { repo; _ }
  | Graph_remove { repo; _ }
  | Graph_validate { repo; _ }
  | Graph_info { repo; _ }
  | Graph_backup_list { repo; _ }
  | Graph_backup_create { repo; _ }
  | Graph_backup_remove { repo; _ }
  | Graph_export { repo; _ }
  | Graph_import { repo; _ } ->
      Some repo
  | Graph_backup_restore { dst_repo; _ } -> Some dst_repo

let graph = function
  | Graph_list -> None
  | Graph_create { graph; _ }
  | Graph_switch { graph; _ }
  | Graph_remove { graph; _ }
  | Graph_validate { graph; _ }
  | Graph_info { graph; _ }
  | Graph_backup_list { graph; _ }
  | Graph_backup_create { graph; _ }
  | Graph_backup_remove { graph; _ }
  | Graph_export { graph; _ }
  | Graph_import { graph; _ } ->
      Some graph
  | Graph_backup_restore { dst_graph; _ } -> Some dst_graph

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
