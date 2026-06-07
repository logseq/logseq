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
  include_timestamps : bool;
  exclude_built_in_pages : bool;
  exclude_namespaces : string list;
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

type graph_item_kind = Canonical | Legacy | Legacy_undecodable

type graph_item = {
  kind : graph_item_kind;
  graph_name : Cli_primitive.graph option;
  graph_dir : Cli_primitive.path option;
  legacy_dir : Cli_primitive.path option;
  target_graph_dir : Cli_primitive.path option;
  conflict : bool;
  reason : Cli_primitive.keyword option;
}

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

let string_of_export_type = function Edn -> "edn" | Sqlite -> "sqlite"

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

let validate_parsed = function
  | Parsed_create opts
    when Option.is_some opts.e2ee_password && not opts.enable_sync ->
      Error (Error.invalid_options "--e2ee-password requires --enable-sync")
  | Parsed_export opts
    when opts.export_type = Sqlite
         && (opts.include_timestamps || opts.exclude_built_in_pages
            || opts.exclude_namespaces <> []) ->
      Error
        (Error.invalid_options
           "graph export --type sqlite does not accept --include-timestamps, \
            --exclude-built-in-pages, or --exclude-namespaces")
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
    int_of_float
      (Time.time_to_epoch_seconds_float (Time.now ()) *. 1_000_000.)
  in
  Filename.concat dir
    ("db." ^ string_of_int stamp ^ "."
    ^ string_of_int !tmp_sqlite_counter
    ^ ".tmp.sqlite")

let explicit_graph_and_repo globals =
  let graph =
    Option.bind globals.Global_opts.graph (fun graph ->
        graph |> Cli_primitive.string_of_graph
        |> Cli_primitive.non_empty
        |> Option.map Cli_primitive.create_graph)
  in
  (graph, Option.map Cli_config.graph_to_repo graph)

let build ?registry:_ config globals parsed =
  Error.bind (validate_parsed parsed) (fun () ->
      let selected_graph = Cli_config.pick_graph config globals in
      let selected_repo = Option.map Cli_config.graph_to_repo selected_graph in
      match parsed with
      | Parsed_list -> Ok Graph_list
      | Parsed_create opts -> (
          match explicit_graph_and_repo globals with
          | Some graph, Some repo -> Ok (Graph_create { graph; repo; opts })
          | _ -> Error (Error.missing_graph ()))
      | Parsed_switch -> (
          match explicit_graph_and_repo globals with
          | Some graph, Some repo -> Ok (Graph_switch { graph; repo })
          | _ -> Error (Error.missing_graph ()))
      | Parsed_remove -> (
          match explicit_graph_and_repo globals with
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
          | Some graph, Some repo -> Ok (Graph_backup_list { graph; repo })
          | _ -> Error (Error.missing_repo "repo is required for backup list"))
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
          | _ -> Error (Error.missing_repo "repo is required for backup create")
          )
      | Parsed_backup_restore opts -> (
          match (selected_graph, selected_repo) with
          | Some source_graph, Some source_repo ->
              let src = String.trim opts.src in
              let dst = String.trim (Cli_primitive.string_of_graph opts.dst) in
              if dst = "" then
                Error
                  (Error.make
                     (Edn_util.keyword_t "missing-dst")
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
              Error (Error.missing_repo "repo is required for backup restore"))
      | Parsed_backup_remove opts -> (
          match (selected_graph, selected_repo) with
          | Some graph, Some repo ->
              Ok
                (Graph_backup_remove { graph; repo; src = String.trim opts.src })
          | _ -> Error (Error.missing_repo "repo is required for backup remove")
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
          | _ -> Error (Error.missing_repo "repo is required for export"))
      | Parsed_import opts -> (
          match (selected_graph, selected_repo) with
          | Some graph, Some repo ->
              Ok
                (Graph_import
                   {
                     graph;
                     repo;
                     opts;
                     require_missing_graph = opts.import_type = Import_sqlite;
                   })
          | _ -> Error (Error.missing_repo "repo is required for import")))

let graphs_dir config = Filename.concat config.Cli_config.root_dir "graphs"

let current_graph_path config =
  Filename.concat config.Cli_config.root_dir "current-graph"

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

let write_file path content =
  Cli_unix.write_text_file path content

let graph_path config graph =
  Filename.concat (graphs_dir config)
    (Graph_dir.encode_graph_dir_name (Cli_primitive.string_of_graph graph))

let graph_exists config graph =
  Cli_unix.file_exists (graph_path config graph)
  && Cli_unix.is_directory (graph_path config graph)

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let contains_substring ~needle text =
  let needle_len = String.length needle in
  let text_len = String.length text in
  let rec loop index =
    index + needle_len <= text_len
    && (String.sub text index needle_len = needle || loop (index + 1))
  in
  loop 0

let decode_graph_dir_name = Graph_dir.decode_graph_dir_name

let legacy_derivation_signal dir_name =
  contains_substring ~needle:"++" dir_name
  || contains_substring ~needle:"+3A+" dir_name
  || contains_substring ~needle:"%" dir_name

let decode_legacy_graph_dir_name dir_name =
  if not (legacy_derivation_signal dir_name) then None
  else Graph_dir.decode_legacy_graph_dir_name dir_name

let ignored_graph_dir name =
  name = "Unlinked graphs" || name = "backup"
  || starts_with ~prefix:"file-version-" name

let canonical_dir_name dir_name graph_name =
  dir_name = Graph_dir.encode_graph_dir_name graph_name

let canonical_graph_name graph =
  if graph <> "" && not (starts_with ~prefix:"logseq_db_" graph) then Some graph
  else None

let classify_graph_dir graphs_root dir_name =
  if ignored_graph_dir dir_name then None
  else
    let decoded_canonical =
      Option.bind (decode_graph_dir_name dir_name) canonical_graph_name
    in
    match decoded_canonical with
    | Some graph_name when canonical_dir_name dir_name graph_name ->
        Some
          (Edn_util.map
             [
               (Edn_util.keyword ":kind", Edn_util.keyword ":canonical");
               (Edn_util.keyword ":graph-name", Edn_util.string graph_name);
               (Edn_util.keyword ":graph-dir", Edn_util.string dir_name);
             ])
    | _ -> (
        let legacy_graph_name =
          match decoded_canonical with
          | Some graph_name -> Some graph_name
          | None ->
              Option.bind
                (decode_legacy_graph_dir_name dir_name)
                canonical_graph_name
        in
        match legacy_graph_name with
        | Some graph_name ->
            let target_graph_dir = Graph_dir.encode_graph_dir_name graph_name in
            Some
              (Edn_util.map
                 [
                   (Edn_util.keyword ":kind", Edn_util.keyword ":legacy");
                   (Edn_util.keyword ":legacy-dir", Edn_util.string dir_name);
                   (Edn_util.keyword ":graph-name", Edn_util.string graph_name);
                   ( Edn_util.keyword ":target-graph-dir",
                     Edn_util.string target_graph_dir );
                   ( Edn_util.keyword ":conflict",
                     Edn_util.bool
                       (target_graph_dir <> dir_name
                       && Cli_unix.file_exists
                            (Filename.concat graphs_root target_graph_dir)) );
                 ])
        | None ->
            if legacy_derivation_signal dir_name then
              Some
                (Edn_util.map
                   [
                     ( Edn_util.keyword ":kind",
                       Edn_util.keyword ":legacy-undecodable" );
                     (Edn_util.keyword ":legacy-dir", Edn_util.string dir_name);
                     ( Edn_util.keyword ":reason",
                       Edn_util.keyword ":graph-name-not-derivable" );
                   ])
            else None)

let graph_name_of_canonical_item value =
  match Edn_util.as_map value with
  | Some fields -> (
      match
        ( List.assoc_opt (Edn_util.keyword ":kind") fields,
          List.assoc_opt (Edn_util.keyword ":graph-name") fields )
      with
      | Some kind, Some graph -> (
          match (Edn_util.as_keyword kind, Edn_util.as_string graph) with
          | Some ":canonical", Some graph -> Some graph
          | _ -> None)
      | _ -> None)
  | None -> None

let graph_list_value graph_items =
  let graphs = List.filter_map graph_name_of_canonical_item graph_items in
  Edn_util.map
    [
      ( Edn_util.keyword ":graphs",
        Edn_util.vector (List.map (fun graph -> Edn_util.string graph) graphs)
      );
      (Edn_util.keyword ":graph-items", Edn_util.vector graph_items);
    ]

let list_graph_items config =
  let dir = graphs_dir config in
  if Cli_unix.file_exists dir then
    Cli_unix.readdir dir |> Array.to_list
    |> List.filter (fun name -> Cli_unix.is_directory (Filename.concat dir name))
    |> List.sort_uniq String.compare
    |> List.filter_map (classify_graph_dir dir)
  else []

let list_graph_dirs config =
  list_graph_items config |> List.filter_map graph_name_of_canonical_item

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
  | Edn -> Edn_util.keyword_t ":edn"
  | Sqlite -> Edn_util.keyword_t ":sqlite"

let import_format = function
  | Import_edn -> Edn_util.keyword_t ":edn"
  | Import_sqlite -> Edn_util.keyword_t ":sqlite"

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

let export_graph_options opts =
  let fields = ref [] in
  if opts.include_timestamps then
    fields := (kw ":include-timestamps?", bool true) :: !fields;
  if opts.exclude_built_in_pages then
    fields := (kw ":exclude-built-in-pages?", bool true) :: !fields;
  if opts.exclude_namespaces <> [] then
    fields :=
      ( kw ":exclude-namespaces",
        Edn_util.set
          (List.map
             (fun value ->
               kw
                 (if String.length value > 0 && value.[0] = ':' then value
                  else ":" ^ value))
             opts.exclude_namespaces) )
      :: !fields;
  Edn_util.map (List.rev !fields)

let export_payload opts =
  let fields = ref [ (kw ":export-type", kw ":graph") ] in
  let graph_options = export_graph_options opts in
  (match graph_options with
  | value when Edn_util.as_map value = Some [] -> ()
  | _ -> fields := (kw ":graph-options", graph_options) :: !fields);
  Edn_util.map (List.rev !fields)

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
       (Edn_util.map
          [
            (kw ":new-graph?", bool new_graph); (kw ":message", string message);
          ]))

let persist_current_graph config graph =
  ensure_dir config.Cli_config.root_dir;
  write_file (current_graph_path config) (Cli_primitive.string_of_graph graph)

let validation_errors value =
  match Edn_util.as_map value with
  | Some _ -> (
      match Option.bind (Edn_util.get value ":errors") Edn_util.as_seq with
      | Some errors -> errors
      | None -> [])
  | None -> []

let format_count count noun = Humanize_types.format_count_with_noun count noun

let graph_validate_result mode _config result =
  match validation_errors result with
  | [] ->
      Cli_result.ok ~command:Command_id.Graph_validate mode
        (Raw (Edn_util.map [ (kw ":result", result) ]))
  | errors ->
      let count = List.length errors in
      Cli_result.error ~command:Command_id.Graph_validate mode
        (Error.make
           (Edn_util.keyword_t "graph-validation-failed")
           ("Graph invalid. Found "
           ^ format_count count "entity"
           ^ " with errors:\n"
           ^ Melange_edn.to_edn_string (Edn_util.vector errors)))

let sym name = Edn_util.string ("~$" ^ name)
let vector values = Edn_util.vector values
let vector_t values = Edn_util.vector_t values
let list values = Edn_util.list values

let graph_info_query =
  vector_t
    [
      kw ":find";
      sym "?ident";
      sym "?value";
      kw ":where";
      vector [ sym "?e"; kw ":db/ident"; sym "?ident" ];
      vector [ list [ sym "namespace"; sym "?ident" ]; sym "?ns" ];
      vector [ list [ sym "="; string "logseq.kv"; sym "?ns" ] ];
      vector [ sym "?e"; kw ":kv/value"; sym "?value" ];
    ]

let graph_info_key value =
  match Edn_util.as_keyword value with
  | Some value ->
      if String.length value > 0 && value.[0] = ':' then
        String.sub value 1 (String.length value - 1)
      else value
  | None -> (
      match Edn_util.as_string value with
      | Some value ->
          if String.length value >= 2 && String.sub value 0 2 = "~$" then
            String.sub value 2 (String.length value - 2)
          else value
      | None -> Melange_edn.to_edn_string value)

let graph_info_kv rows =
  let row_fields row =
    match (Edn_util.as_vector row, Edn_util.as_list row) with
    | Some [ key; value ], _ | _, Some [ key; value ] ->
        Some (Edn_util.string (graph_info_key key), value)
    | _ -> None
  in
  rows |> List.filter_map row_fields

let parse_positive_int64 text =
  let text = String.trim text in
  if text = "" then None else Int64.of_string_opt text

let graph_info_timestamp_seconds value =
  let timestamp =
    match Edn_util.as_int64 value with
    | Some value -> Some value
    | None -> parse_positive_int64 (Melange_edn.to_edn_string value)
  in
  timestamp
  |> Option.map (fun timestamp ->
      if Int64.compare timestamp 100_000_000_000L >= 0 then
        Int64.div timestamp 1_000L
      else timestamp)

let graph_info_datetime_value : type a.
    a Output.Mode.t -> Melange_edn.any -> Melange_edn.any =
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
  let kv_value key = List.assoc_opt (Edn_util.string key) kv in
  let graph_created_at =
    Option.value
      (kv_value "logseq.kv/graph-created-at"
      |> Option.map (graph_info_datetime_value mode))
      ~default:Edn_util.nil
  in
  let fields =
    [
      (kw ":graph", string graph);
      (kw ":logseq.kv/graph-created-at", graph_created_at);
      ( kw ":logseq.kv/schema-version",
        Option.value (kv_value "logseq.kv/schema-version") ~default:Edn_util.nil
      );
      (kw ":kv", Edn_util.map kv);
    ]
  in
  Cli_result.ok ~command:Command_id.Graph_info mode (Raw (Edn_util.map fields))

let read_file_opt path =
  if not (Cli_unix.file_exists path) then None
  else Some (Cli_unix.read_text_file path)

let find_substring ~needle haystack =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop idx =
    if idx + needle_len > haystack_len then None
    else if String.sub haystack idx needle_len = needle then Some idx
    else loop (idx + 1)
  in
  loop 0

let metadata_source backup_dir =
  match read_file_opt (backup_metadata_path backup_dir) with
  | Some text -> (
      match find_substring ~needle:":source" text with
      | Some idx ->
          let start = idx + String.length ":source" in
          let rest = String.sub text start (String.length text - start) in
          let token =
            rest |> String.split_on_char ' '
            |> List.find_opt (fun value -> String.trim value <> "")
            |> Option.value ~default:"" |> String.trim
          in
          let token =
            token |> String.split_on_char '}' |> List.hd |> String.trim
          in
          if token = "" then None
          else if String.length token > 0 && token.[0] = ':' then
            Some (String.sub token 1 (String.length token - 1))
          else Some token
      | None -> None)
  | _ -> None

let backup_entry root name =
  let dir = Filename.concat root name in
  let db_path = backup_db_path dir in
  if Cli_unix.file_exists dir && Cli_unix.is_directory dir && Cli_unix.file_exists db_path then
    let stat = Cli_unix.stat db_path in
    let fields =
      [
        (kw ":name", string name);
        (kw ":created-at", Edn_util.float stat.Cli_unix.st_mtime);
        (kw ":size-bytes", Edn_util.int stat.Cli_unix.st_size);
      ]
    in
    let fields =
      match metadata_source dir with
      | Some source -> fields @ [ (kw ":source", string source) ]
      | None -> fields
    in
    Some (Edn_util.map fields)
  else None

let list_backups config graph =
  let root = backup_root_path config graph in
  if not (Cli_unix.file_exists root) then []
  else
    Cli_unix.readdir root |> Array.to_list |> List.sort String.compare
    |> List.filter_map (backup_entry root)

let graph_backup_list_result mode config graph =
  Cli_result.ok ~command:Command_id.Graph_backup_list mode
    (Raw
       (Edn_util.map
          [ (kw ":backups", Edn_util.vector (list_backups config graph)) ]))

let graph_backup_remove_result mode config graph src =
  let dir = backup_dir_path config graph src in
  if Cli_unix.file_exists dir then (
    remove_tree dir;
    Cli_result.ok ~command:Command_id.Graph_backup_remove mode
      (Message ("Removed backup " ^ src)))
  else
    Cli_result.error ~command:Command_id.Graph_backup_remove mode
      (Error.make
         (Edn_util.keyword_t "backup-not-found")
         ("backup not found: " ^ src))

let unlink_graph_dir config graph repo =
  let graphs_root = graphs_dir config in
  let repo_name = Cli_primitive.string_of_repo repo in
  let graph_name = Cli_primitive.string_of_graph graph in
  let repo_path = Filename.concat graphs_root repo_name in
  let graph_path = graph_path config graph in
  let source =
    if Cli_unix.file_exists repo_path && Cli_unix.is_directory repo_path then
      Some (repo_name, repo_path)
    else if Cli_unix.file_exists graph_path && Cli_unix.is_directory graph_path then
      Some (graph_name, graph_path)
    else None
  in
  match source with
  | None -> None
  | Some (dir_name, source_path) ->
      let unlinked_root = Filename.concat graphs_root "Unlinked graphs" in
      ensure_dir unlinked_root;
      let rec target suffix =
        let name =
          if suffix = 0 then dir_name else dir_name ^ "-" ^ string_of_int suffix
        in
        Filename.concat unlinked_root name
      in
      let rec reserve suffix =
        let path = target suffix in
        if Cli_unix.file_exists path then reserve (suffix + 1) else path
      in
      let destination = reserve 0 in
      Cli_unix.rename source_path destination;
      Some destination

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
    ("{:schema-version 1 :name \"" ^ String.escaped backup_name ^ "\" :repo \""
   ^ String.escaped repo ^ "\" :source :cli :created-at-ms "
    ^ Int64.to_string created_at_ms
    ^ " :db-path \"" ^ String.escaped db_path ^ "\"}")

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
        bind
          (Transport.thread_api_backup_db_sqlite invoke_config ~repo
             ~path:tmp_path) (fun _ ->
            if Cli_unix.file_exists tmp_path then (
              Cli_unix.rename tmp_path db_path;
              write_backup_metadata dir ~backup_name ~repo ~db_path;
              pure
                (Cli_result.ok ~command:Command_id.Graph_backup_create mode
                   (Raw
                      (Edn_util.map
                         [
                           (kw ":backup-name", string backup_name);
                           (kw ":path", string db_path);
                           ( kw ":message",
                             string ("Created backup " ^ backup_name) );
                         ]))))
            else (
              remove_tree dir;
              pure
                (Cli_result.error ~command:Command_id.Graph_backup_create mode
                   (Error.make
                      (Edn_util.keyword_t "missing-snapshot")
                      ("snapshot did not create sqlite backup: " ^ tmp_path))))))

let graph_create_data result =
  Option.value (Cli_result.data_value result) ~default:Edn_util.nil

let graph_create_enable_sync_result mode _config graph repo create_result
    upload_result start_result =
  Cli_result.ok ~command:Command_id.Graph_create mode
    (Raw
       (Edn_util.map
          [
            (kw ":graph", string (Cli_primitive.string_of_graph graph));
            (kw ":repo", string (Cli_primitive.string_of_repo repo));
            ( kw ":stages",
              Edn_util.map
                [
                  (kw ":create", graph_create_data create_result);
                  (kw ":upload", graph_create_data upload_result);
                  (kw ":start", graph_create_data start_result);
                ] );
          ]))

let execute_graph_create_invoke mode graph repo config =
  let open Cli_effect in
  bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
    (function
    | Error err ->
        pure (Cli_result.error ~command:Command_id.Graph_create mode err)
    | Ok invoke_config ->
        bind
          (Transport.thread_api_create_or_open_db invoke_config ~repo
             ~options:(Edn_util.map_t []))
          (fun result ->
            persist_current_graph config graph;
            pure
              (Cli_result.ok ~command:Command_id.Graph_create mode
                 (Raw (Edn_util.map [ (kw ":result", result) ])))))

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
             config mode)
          (fun upload_result ->
            if Cli_result.is_error upload_result then
              pure
                (Cli_result.with_command Command_id.Graph_create upload_result)
            else
              bind
                (Sync.execute
                   (Sync.Sync_start
                      { repo; graph; e2ee_password = opts.e2ee_password })
                   config mode)
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
    execute_graph_create_enable_sync mode graph repo opts config
  else
    match config.Cli_config.base_url with
    | None ->
        ensure_dir (graph_path config graph);
        pure
          (Cli_result.ok ~command:Command_id.Graph_create mode
             (Message
                ("Created graph \""
                ^ Cli_primitive.string_of_graph graph
                ^ "\"")))
    | Some _ -> execute_graph_create_invoke mode graph repo config

let execute_graph_export mode graph repo opts config =
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
                  (Transport.write_output
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
            bind
              (Server_runtime.ensure_server config repo ~create_empty_db:false)
              (function
              | Error err ->
                  pure
                    (Cli_result.error ~command:Command_id.Graph_import mode err)
              | Ok invoke_config ->
                  bind
                    (match opts.import_type with
                    | Import_edn ->
                        Transport.thread_api_import_edn invoke_config ~repo
                          ~data:input_data
                    | Import_sqlite ->
                        Transport.thread_api_import_db_binary invoke_config
                          ~repo ~data:input_data)
                    (fun _ ->
                      bind (Server_runtime.restart_server config repo) (function
                        | Error err ->
                            pure
                              (Cli_result.error ~command:Command_id.Graph_import
                                 mode err)
                        | Ok _ ->
                            pure
                              (graph_import_message mode config graph opts
                                 new_graph))))
          in
          bind (Server_runtime.stop_server config repo) (function
            | Error err
              when err.Error.code = Edn_util.keyword_t "server-not-found" ->
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
         (Error.make
            (Edn_util.keyword_t "backup-not-found")
            ("backup not found: " ^ src)))
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
             ~options:(Edn_util.map_t [ (kw ":fix", bool fix) ]))
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
             ~query:(vector_t [ Edn_util.any graph_info_query ]))
          (fun result ->
            let rows =
              match Edn_util.as_seq result with
              | Some rows -> rows
              | _ when Edn_util.is_null result -> []
              | _ -> [ result ]
            in
            pure (graph_info_result mode config graph rows)))

let execute_graph_switch mode graph repo config =
  let open Cli_effect in
  let graph_name = Cli_primitive.string_of_graph graph in
  if not (graph_exists config graph) then
    pure
      (Cli_result.error ~command:Command_id.Graph_switch mode
         (Error.make (Edn_util.keyword_t "graph-not-exists") "graph not exists"))
  else
    bind (Server_runtime.ensure_server config repo ~create_empty_db:false)
      (function
      | Error err ->
          pure (Cli_result.error ~command:Command_id.Graph_switch mode err)
      | Ok _ ->
          persist_current_graph config graph;
          pure
            (Cli_result.ok ~command:Command_id.Graph_switch mode
               (Message
                  ("Switched to graph \"" ^ graph_name ^ "\""))))

let execute_graph_remove mode graph repo config =
  let open Cli_effect in
  let graph_name = Cli_primitive.string_of_graph graph in
  let removed_graph_result =
    Cli_result.ok ~command:Command_id.Graph_remove mode
      (Message ("Removed graph \"" ^ graph_name ^ "\""))
  in
  if not (graph_exists config graph) then
    pure
      (Cli_result.error ~command:Command_id.Graph_remove mode
         (Error.make (Edn_util.keyword_t "graph-not-exists") "graph not exists"))
  else
    bind (Server_runtime.stop_server config repo) (function
      | Error err when err.Error.code = Edn_util.keyword_t "server-not-found"
        -> (
          match unlink_graph_dir config graph repo with
          | Some _ -> pure removed_graph_result
          | None ->
              pure
                (Cli_result.error ~command:Command_id.Graph_remove mode
                   (Error.make
                      (Edn_util.keyword_t "graph-not-removed")
                      "unable to remove graph")))
      | Error err ->
          pure (Cli_result.error ~command:Command_id.Graph_remove mode err)
      | Ok _ -> (
          match unlink_graph_dir config graph repo with
          | Some _ -> pure removed_graph_result
          | None ->
              pure
                (Cli_result.error ~command:Command_id.Graph_remove mode
                   (Error.make
                      (Edn_util.keyword_t "graph-not-removed")
                      "unable to remove graph"))))

let execute action config mode =
  let pure = Cli_effect.pure in
  match action with
  | Graph_list ->
      let graph_items = list_graph_items config in
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

let meta ?(examples = []) id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples;
    options = [];
    category = Command_registry.Graph_management;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
  }

let metadata () =
  [
    meta ~examples:[ "logseq graph list" ] Command_id.Graph_list "List graphs";
    meta
      ~examples:
        [
          "logseq graph create --graph my-graph";
          "logseq graph create --graph my-graph --enable-sync";
          "logseq graph create --graph my-graph --enable-sync --e2ee-password \
           \"my-secret\"";
        ]
      Graph_create "Create graph";
    meta
      ~examples:[ "logseq graph switch --graph my-graph" ]
      Graph_switch "Switch current graph";
    meta
      ~examples:[ "logseq graph remove --graph my-graph" ]
      Graph_remove "Remove graph";
    meta
      ~examples:
        [
          "logseq graph validate --graph my-graph";
          "logseq graph validate --graph my-graph --fix";
        ]
      Graph_validate "Validate graph";
    meta
      ~examples:[ "logseq graph info --graph my-graph" ]
      Graph_info "Graph metadata";
    meta
      ~examples:
        [
          "logseq graph export --graph my-graph --type edn --file \
           /tmp/my-graph.edn --include-timestamps --exclude-built-in-pages \
           --exclude-namespaces user,project";
          "logseq graph export --graph my-graph --type sqlite --file \
           /tmp/my-graph.sqlite";
        ]
      Graph_export "Export graph";
    meta
      ~examples:
        [
          "logseq graph import --graph my-graph --type edn --input \
           /tmp/my-graph.edn";
        ]
      Graph_import "Import graph";
    meta
      ~examples:[ "logseq graph backup list --graph my-graph" ]
      Graph_backup_list "List graph backups";
    meta
      ~examples:
        [
          "logseq graph backup create --graph my-graph";
          "logseq graph backup create --graph my-graph --name nightly";
        ]
      Graph_backup_create "Create graph backup";
    meta
      ~examples:
        [
          "logseq graph backup restore --src my-graph-nightly --dst \
           my-graph-restore";
        ]
      Graph_backup_restore "Restore graph backup";
    meta
      ~examples:[ "logseq graph backup remove --src my-graph-nightly" ]
      Graph_backup_remove "Remove graph backup";
  ]

let action_context _ = Edn_util.map_t []

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
