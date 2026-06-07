type config_key = Ws_url | Http_base
type start_opts = { e2ee_password : string option }
type upload_opts = { e2ee_password : string option }
type download_opts = { progress : bool option; e2ee_password : string option }

type asset_download_opts = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
}

type ensure_keys_opts = { e2ee_password : string option; upload_keys : bool }

type grant_access_opts = {
  graph_id : Cli_primitive.uuid option;
  email : Cli_primitive.email option;
}

type config_get_opts = { key : config_key option }
type config_set_opts = { key : config_key option; value : string option }
type config_unset_opts = { key : config_key option }

type parsed =
  | Parsed_status
  | Parsed_start of start_opts
  | Parsed_stop
  | Parsed_upload of upload_opts
  | Parsed_download of download_opts
  | Parsed_asset_download of asset_download_opts
  | Parsed_remote_graphs
  | Parsed_ensure_keys of ensure_keys_opts
  | Parsed_grant_access of grant_access_opts
  | Parsed_config_get of config_get_opts
  | Parsed_config_set of config_set_opts
  | Parsed_config_unset of config_unset_opts

type action =
  | Sync_status of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }
  | Sync_start of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      e2ee_password : string option;
    }
  | Sync_stop of { repo : Cli_primitive.repo; graph : Cli_primitive.graph }
  | Sync_upload of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      e2ee_password : string option;
    }
  | Sync_download of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      progress : bool;
      progress_explicit : bool;
      e2ee_password : string option;
      allow_missing_graph : bool;
      require_missing_graph : bool;
    }
  | Sync_asset_download of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      id : Cli_primitive.db_id option;
      uuid : Cli_primitive.uuid option;
    }
  | Sync_remote_graphs
  | Sync_ensure_keys of { e2ee_password : string option; upload_keys : bool }
  | Sync_grant_access of {
      repo : Cli_primitive.repo;
      graph : Cli_primitive.graph;
      graph_id : Cli_primitive.uuid;
      email : Cli_primitive.email;
    }
  | Sync_config_get of { key : config_key }
  | Sync_config_set of { key : config_key; value : string }
  | Sync_config_unset of { key : config_key }

type remote_graph = {
  graph_id : Cli_primitive.uuid;
  graph_name : Cli_primitive.graph;
  graph_e2ee : bool;
  raw : Melange_edn.any;
}

type sync_status = {
  ws_state : Cli_primitive.keyword option;
  graph_id : Cli_primitive.uuid option;
  last_error : Melange_edn.any option;
  raw : Melange_edn.any;
}

let config_key_of_string = function
  | "ws-url" -> Some Ws_url
  | "http-base" -> Some Http_base
  | _ -> None

let string_of_config_key = function
  | Ws_url -> "ws-url"
  | Http_base -> "http-base"

let authenticated = function
  | Sync_remote_graphs | Sync_ensure_keys _ | Sync_grant_access _
  | Sync_status _ | Sync_start _ | Sync_stop _ | Sync_upload _ | Sync_download _
  | Sync_asset_download _ ->
      true
  | _ -> false

let required_config_keys = function
  | Sync_config_get _ | Sync_config_set _ | Sync_config_unset _ -> []
  | _ -> [ Ws_url; Http_base ]

let command_id = function
  | Parsed_status -> Command_id.Sync_status
  | Parsed_start _ -> Sync_start
  | Parsed_stop -> Sync_stop
  | Parsed_upload _ -> Sync_upload
  | Parsed_download _ -> Sync_download
  | Parsed_asset_download _ -> Sync_asset_download
  | Parsed_remote_graphs -> Sync_remote_graphs
  | Parsed_ensure_keys _ -> Sync_ensure_keys
  | Parsed_grant_access _ -> Sync_grant_access
  | Parsed_config_get _ -> Sync_config_get
  | Parsed_config_set _ -> Sync_config_set
  | Parsed_config_unset _ -> Sync_config_unset

let validate_parsed _ = Ok ()
let key_value key = Edn_util.keyword (":" ^ string_of_config_key key)

let config_value config = function
  | Ws_url -> config.Cli_config.ws_url
  | Http_base -> config.http_base

let config_patch key value = Edn_util.map [ (key_value key, value) ]

let config_result ?value key =
  let fields = [ (Edn_util.keyword ":key", key_value key) ] in
  let fields =
    match value with
    | Some value -> (Edn_util.keyword ":value", value) :: fields
    | None -> fields
  in
  Edn_util.map (List.rev fields)

let action_with_repo config make message =
  match config.Cli_config.repo with
  | Some repo -> Ok (make repo (Cli_config.repo_to_graph repo))
  | None -> Error (Error.missing_repo message)

let require_key = function
  | Some key -> Ok key
  | None -> Error (Error.invalid_options "config key is required")

let require_value = function
  | Some value when String.trim value <> "" -> Ok value
  | _ -> Error (Error.invalid_options "config value is required")

let require_uuid option message =
  match option with
  | Some value when Cli_primitive.is_uuid_string value -> Ok value
  | Some _ -> Error (Error.invalid_options message)
  | None -> Error (Error.invalid_options message)

let require_email = function
  | Some value when String.trim value <> "" -> Ok (String.trim value)
  | _ -> Error (Error.invalid_options "--email is required")

let explicit_graph_and_repo globals =
  let graph =
    Option.bind globals.Global_opts.graph (fun graph ->
        graph |> Cli_primitive.string_of_graph
        |> Cli_primitive.non_empty
        |> Option.map Cli_primitive.create_graph)
  in
  (graph, Option.map Cli_config.graph_to_repo graph)

let build ?registry:_ config globals = function
  | Parsed_status ->
      action_with_repo config
        (fun repo graph -> Sync_status { repo; graph })
        "repo is required for sync-status"
  | Parsed_start opts ->
      action_with_repo config
        (fun repo graph ->
          Sync_start { repo; graph; e2ee_password = opts.e2ee_password })
        "repo is required for sync-start"
  | Parsed_stop ->
      action_with_repo config
        (fun repo graph -> Sync_stop { repo; graph })
        "repo is required for sync-stop"
  | Parsed_upload opts ->
      action_with_repo config
        (fun repo graph ->
          Sync_upload { repo; graph; e2ee_password = opts.e2ee_password })
        "repo is required for sync-upload"
  | Parsed_download opts ->
      let graph, repo = explicit_graph_and_repo globals in
      (match (graph, repo) with
      | Some graph, Some repo ->
          Ok
            (Sync_download
               {
                 repo;
                 graph;
                 progress = Option.value opts.progress ~default:false;
                 progress_explicit = Option.is_some opts.progress;
                 e2ee_password = opts.e2ee_password;
                 allow_missing_graph = true;
                 require_missing_graph = true;
               })
      | _ -> Error (Error.missing_graph ()))
  | Parsed_asset_download opts -> (
      match (config.Cli_config.repo, opts.id, opts.uuid) with
      | None, _, _ ->
          Error (Error.missing_repo "repo is required for sync asset download")
      | Some _, None, None | Some _, Some _, Some _ ->
          Error
            (Error.invalid_options "exactly one of --id or --uuid is required")
      | Some _, _, Some uuid when not (Cli_primitive.is_uuid_string uuid) ->
          Error
            (Error.invalid_options "Option uuid must be a valid UUID string")
      | Some repo, id, uuid ->
          Ok
            (Sync_asset_download
               { repo; graph = Cli_config.repo_to_graph repo; id; uuid }))
  | Parsed_remote_graphs -> Ok Sync_remote_graphs
  | Parsed_ensure_keys opts ->
      Ok
        (Sync_ensure_keys
           {
             e2ee_password = opts.e2ee_password;
             upload_keys = opts.upload_keys;
           })
  | Parsed_grant_access opts ->
      Error.bind
        (action_with_repo config
           (fun repo graph -> (repo, graph))
           "repo is required for sync grant-access")
        (fun (repo, graph) ->
          Error.bind (require_uuid opts.graph_id "--graph-id is required")
            (fun graph_id ->
              Error.bind (require_email opts.email) (fun email ->
                  Ok (Sync_grant_access { repo; graph; graph_id; email }))))
  | Parsed_config_get opts ->
      Error.bind (require_key opts.key) (fun key ->
          Ok (Sync_config_get { key }))
  | Parsed_config_set opts ->
      Error.bind (require_key opts.key) (fun key ->
          Error.bind (require_value opts.value) (fun value ->
              Ok (Sync_config_set { key; value })))
  | Parsed_config_unset opts ->
      Error.bind (require_key opts.key) (fun key ->
          Ok (Sync_config_unset { key }))

let execute_config_get mode config key =
  let value =
    config_value config key |> Option.map (fun value -> Edn_util.string value)
  in
  Cli_effect.pure
    (Cli_result.ok ~command:Command_id.Sync_config_get mode
       (Raw (config_result ?value key)))

let execute_config_set mode config key value =
  Cli_effect.bind
    (Cli_config.update_config config (config_patch key (Edn_util.string value)))
    (function
      | Ok _ ->
          Cli_effect.pure
            (Cli_result.ok ~command:Command_id.Sync_config_set mode
               (Raw (config_result ~value:(Edn_util.string value) key)))
      | Error err ->
          Cli_effect.pure
            (Cli_result.error ~command:Command_id.Sync_config_set mode err))

let execute_config_unset mode config key =
  Cli_effect.bind
    (Cli_config.update_config config (config_patch key Edn_util.nil))
    (function
      | Ok _ ->
          Cli_effect.pure
            (Cli_result.ok ~command:Command_id.Sync_config_unset mode
               (Raw (config_result key)))
      | Error err ->
          Cli_effect.pure
            (Cli_result.error ~command:Command_id.Sync_config_unset mode err))

let sync_config_value config =
  Edn_util.map_t
    [
      ( Edn_util.keyword ":ws-url",
        match config.Cli_config.ws_url with
        | Some value -> Edn_util.string value
        | None -> Edn_util.nil );
      ( Edn_util.keyword ":http-base",
        match config.Cli_config.http_base with
        | Some value -> Edn_util.string value
        | None -> Edn_util.nil );
    ]

let add_runtime_auth key value fields =
  match value with
  | Some value when String.trim value <> "" ->
      (Edn_util.keyword key, Edn_util.string value) :: fields
  | _ -> fields

let runtime_auth_state config =
  let fields =
    []
    |> add_runtime_auth ":auth/id-token" config.Cli_config.id_token
    |> add_runtime_auth ":auth/access-token" config.Cli_config.access_token
    |> add_runtime_auth ":auth/refresh-token" config.Cli_config.refresh_token
  in
  match fields with [] -> None | _ -> Some (Edn_util.map_t (List.rev fields))

let config_with_auth config (auth : Auth_state.auth_data) =
  {
    config with
    Cli_config.id_token = auth.id_token;
    access_token = auth.access_token;
    refresh_token = auth.refresh_token;
  }

let should_resolve_auth_file config =
  match
    (runtime_auth_state config, config.Cli_config.auth_path, config.base_url)
  with
  | Some _, _, _ -> false
  | None, Some _, _ -> true
  | None, None, None -> true
  | None, None, Some _ -> false

let resolve_runtime_auth_if_available config =
  if not (should_resolve_auth_file config) then Cli_effect.pure (Ok config)
  else
    Cli_effect.bind (Auth_state.read_auth_file config) (function
      | Error err -> Cli_effect.pure (Error err)
      | Ok None -> Cli_effect.pure (Ok config)
      | Ok (Some _) ->
          Cli_effect.bind (Auth_state.resolve_auth config) (function
            | Error err -> Cli_effect.pure (Error err)
            | Ok auth -> Cli_effect.pure (Ok (config_with_auth config auth))))

let prepare_worker_runtime invoke_config config =
  let set_sync_config () =
    Transport.thread_api_set_db_sync_config invoke_config
      ~config:(sync_config_value config)
  in
  match runtime_auth_state config with
  | None -> set_sync_config ()
  | Some auth_state ->
      Cli_effect.bind
        (Transport.thread_api_sync_app_state invoke_config ~auth_state)
        (fun _ -> set_sync_config ())

let unquote_transit_value = function
  | Melange_edn.Any (Melange_edn.Tagged (("transit/quote" | "'"), value)) -> value
  | value -> value

let result_value result =
  let result = unquote_transit_value result in
  match Edn_util.as_map result with
  | Some _ -> result
  | _ -> Edn_util.map [ (Edn_util.keyword ":result", result) ]

let kw name = Edn_util.keyword name
let sym name = Edn_util.string ("~$" ^ name)
let vector values = Edn_util.vector values
let repo_string repo = Cli_primitive.string_of_repo repo
let graph_string graph = Cli_primitive.string_of_graph graph

let graph_e2ee_query =
  vector
    [
      kw ":find";
      sym "?v";
      kw ":.";
      kw ":where";
      vector [ sym "?e"; kw ":db/ident"; kw ":logseq.kv/graph-rtc-e2ee?" ];
      vector [ sym "?e"; kw ":kv/value"; sym "?v" ];
    ]

let sync_download_non_empty_query =
  vector
    [
      kw ":find";
      Edn_util.list [ sym "count"; sym "?e" ];
      kw ":.";
      kw ":where";
      vector [ sym "?e"; kw ":block/name"; sym "_" ];
      Edn_util.list
        [
          sym "not";
          vector
            [ sym "?e"; kw ":logseq.property/built-in?"; Edn_util.bool true ];
        ];
      Edn_util.list [ sym "not"; vector [ sym "?e"; kw ":db/ident" ] ];
      Edn_util.list [ sym "not"; vector [ sym "?e"; kw ":file/path" ] ];
    ]

let sync_asset_pull_selector =
  vector
    [
      kw ":db/id";
      kw ":block/uuid";
      Edn_util.map [ (kw ":block/tags", vector [ kw ":db/ident" ]) ];
      kw ":logseq.property.asset/type";
      kw ":logseq.property.asset/checksum";
      kw ":logseq.property.asset/remote-metadata";
      kw ":logseq.property.asset/external-url";
    ]

let trim_keyword value =
  if String.length value > 0 && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let status_ws_state status =
  match Edn_util.get_string status ":ws-state" with
  | Some state -> Some (trim_keyword state)
  | None -> None

let status_last_error status =
  match Edn_util.get status ":last-error" with
  | Some value when not (Edn_util.is_null value) -> Some value
  | _ -> None

let invoke_global_config ?(create_empty_db = false) config =
  match (config.Cli_config.base_url, config.repo) with
  | Some base_url, _ ->
      Cli_effect.pure
        (Ok
           {
             Transport.base_url;
             timeout_span = config.timeout_span;
             profile_session = config.profile_session;
           })
  | None, Some repo -> Server_runtime.ensure_server config repo ~create_empty_db
  | None, None -> Cli_effect.pure (Error (Error.missing_graph ()))

let graphs_value graphs =
  if Edn_util.is_null graphs then Edn_util.vector []
  else
    match (Edn_util.as_vector graphs, Edn_util.as_list graphs) with
    | Some _, _ -> graphs
    | _, Some graphs -> Edn_util.vector graphs
    | _ -> Edn_util.vector [ graphs ]

let tagged_error_value value =
  match unquote_transit_value value with
  | Melange_edn.Any (Melange_edn.Tagged ("error", value)) -> Some value
  | _ -> None

let remote_graphs_error graphs =
  match tagged_error_value graphs with
  | Some value -> Some value
  | None -> (
      match Edn_util.as_seq graphs with
      | Some values -> List.find_map tagged_error_value values
      | None -> None)

let worker_error_message ~default_message value =
  let message =
    match Edn_util.get_string value ":message" with
    | Some message -> message
    | None -> (
        match Edn_util.as_string_like value with
        | Some message -> message
        | None -> default_message)
  in
  message

let worker_error ~code ~default_message value =
  Error.make ~context:value (Edn_util.keyword_t code)
    (worker_error_message ~default_message value)

let remote_graphs_worker_error value =
  worker_error ~code:"sync-remote-graphs-failed"
    ~default_message:"sync remote graphs failed" value

let sync_upload_worker_error value =
  worker_error ~code:"sync-upload-failed" ~default_message:"sync upload failed"
    value

let e2ee_password_worker_error value =
  worker_error ~code:"e2ee-password-failed"
    ~default_message:"e2ee password failed" value

let value_string value = Option.map trim_keyword (Edn_util.as_string_like value)

let remote_graph_values value =
  if Edn_util.is_null value then []
  else Option.value (Edn_util.as_seq value) ~default:[ value ]

let remote_graph_name value =
  match Edn_util.get value ":graph-name" with
  | Some value -> value_string value
  | None -> None

let remote_graph_id value =
  match Edn_util.get value ":graph-id" with
  | Some value -> value_string value
  | None -> None

let remote_graph_e2ee value =
  Option.value (Edn_util.get_bool value ":graph-e2ee?") ~default:false

let find_remote_graph graph graphs =
  remote_graph_values graphs
  |> List.find_opt (fun value ->
      Option.equal String.equal (remote_graph_name value) (Some graph))

let remote_graph_not_found graph =
  Error.make
    ~context:(Edn_util.map [ (kw ":graph", Edn_util.string graph) ])
    (Edn_util.keyword_t "remote-graph-not-found")
    ("remote graph not found: " ^ graph)

let graph_db_not_empty repo count =
  Error.make
    ~context:
      (Edn_util.map
         [
           (kw ":repo", Edn_util.string (repo_string repo));
           (kw ":non-empty-entity-count", Edn_util.int count);
         ])
    (Edn_util.keyword_t "graph-db-not-empty")
    "graph db is not empty"

let download_progress_enabled config ~progress ~progress_explicit =
  if progress_explicit then progress
  else
    match config.Cli_config.output_format with
    | Some (Output.Mode.Packed mode) -> not (Output.Mode.structured mode)
    | None -> true

let download_progress_message graph_id event_type payload =
  match (Edn_util.keyword_to_string event_type, Edn_util.as_map payload) with
  | ":rtc-log", Some _ ->
      let event_kind =
        Option.bind (Edn_util.get payload ":type") value_string
      in
      let event_graph_id =
        Option.bind (Edn_util.get payload ":graph-uuid") value_string
      in
      let message =
        Option.bind (Edn_util.get payload ":message") value_string
      in
      if event_kind = Some "rtc.log/download" && event_graph_id = Some graph_id
      then message
      else None
  | _ -> None

let maybe_connect_download_progress config invoke_config ~enabled ~graph_id =
  if not enabled then Cli_effect.pure None
  else
    Cli_effect.bind
      (Transport.connect_events invoke_config (fun event_type payload ->
           (match download_progress_message graph_id event_type payload with
           | Some message when String.trim message <> "" ->
               print_endline message
           | _ -> ());
           Cli_effect.pure ()))
      (fun subscription -> Cli_effect.pure (Some subscription))

let asset_download_error code message repo graph =
  Error.make
    ~context:
      (Edn_util.map
         [
           (kw ":repo", Edn_util.string (repo_string repo));
           (kw ":graph", Edn_util.string (graph_string graph));
         ])
    (Edn_util.keyword_t code) message

let asset_lookup_ref ~id ~uuid =
  match (id, uuid) with
  | Some id, _ -> Edn_util.int64 id
  | None, Some uuid -> vector [ kw ":block/uuid"; Edn_util.uuid uuid ]
  | None, None -> Edn_util.nil

let asset_tag_ident = ":logseq.class/Asset"

let asset_tag value =
  match Edn_util.as_string_like value with
  | Some ident -> trim_keyword ident = trim_keyword asset_tag_ident
  | None -> (
      match Edn_util.as_map value with
      | Some _ -> (
          match Edn_util.get value ":db/ident" with
          | Some ident ->
              Option.value
                (Option.map
                   (fun value -> value = trim_keyword asset_tag_ident)
                   (value_string ident))
                ~default:false
          | None -> false)
      | None -> false)

let asset_tags value =
  Option.value
    (Option.bind (Edn_util.get value ":block/tags") Edn_util.as_seq)
    ~default:[]

let non_empty_string_field value key =
  match Edn_util.get value key with
  | Some field -> (
      match value_string field with
      | Some s when String.trim s <> "" -> Some s
      | _ -> None)
  | None -> None

let field_present value key =
  match Edn_util.get value key with
  | Some value -> not (Edn_util.is_null value)
  | None -> false

let asset_result_data ?(extra = []) asset ~download_requested ~checksum_status =
  let fields =
    [
      ( kw ":asset-uuid",
        Edn_util.string
          (Option.value
             (non_empty_string_field asset ":block/uuid")
             ~default:"") );
      ( kw ":asset-type",
        Edn_util.string
          (Option.value
             (non_empty_string_field asset ":logseq.property.asset/type")
             ~default:"") );
      (kw ":download-requested?", Edn_util.bool download_requested);
      (kw ":checksum-status", kw checksum_status);
    ]
    @ extra
  in
  match Edn_util.get_int64 asset ":db/id" with
  | Some id -> Edn_util.map ((kw ":asset-id", Edn_util.int64 id) :: fields)
  | None -> Edn_util.map fields

let asset_file_path config repo asset =
  let asset_uuid =
    Option.value (non_empty_string_field asset ":block/uuid") ~default:""
  in
  let asset_type =
    Option.value
      (non_empty_string_field asset ":logseq.property.asset/type")
      ~default:""
  in
  Filename.concat
    (Filename.concat
       (Filename.concat
          (Filename.concat config.Cli_config.root_dir "graphs")
          (Graph_dir.graph_dir_name_of_repo repo))
       "assets")
    (asset_uuid ^ "." ^ asset_type)

let file_sha256 path = try Some (Sha256.file_hex path) with _ -> None

type local_asset_status =
  | Local_missing
  | Local_match
  | Local_mismatch of Cli_primitive.path

let local_asset_status config repo asset =
  let path = asset_file_path config repo asset in
  if not (Cli_unix.file_exists path) then Local_missing
  else
    match
      ( file_sha256 path,
        non_empty_string_field asset ":logseq.property.asset/checksum" )
    with
    | Some actual, Some expected when String.equal actual expected ->
        Local_match
    | _ -> Local_mismatch path

let remove_local_asset path =
  if Cli_unix.file_exists path && not (Cli_unix.is_directory path) then Cli_unix.remove_tree path

let ensure_keys_args ~upload_keys ~e2ee_password =
  if not upload_keys then None
  else
    let fields = [ (kw ":ensure-server?", Edn_util.bool true) ] in
    let fields =
      match e2ee_password with
      | Some password when String.trim password <> "" ->
          (kw ":password", Edn_util.string password) :: fields
      | _ -> fields
    in
    Some (Edn_util.map_t (List.rev fields))

let e2ee_password_not_found repo =
  Error.make ~hint:"Provide --e2ee-password to verify and persist it."
    ~context:
      (Edn_util.map
         [
           (kw ":repo", Edn_util.string (repo_string repo));
           (kw ":action", kw ":sync-start");
         ])
    (Edn_util.keyword_t "e2ee-password-not-found")
    "e2ee-password not found"

let missing_refresh_token_error config =
  Error.make ~hint:"Run `logseq login` first."
    ~context:
      (Edn_util.map
         [ (kw ":auth-path", Edn_util.string (Auth_state.auth_path config)) ])
    (Edn_util.keyword_t "missing-auth")
    "missing refresh token"

let refresh_token_required config =
  match config.Cli_config.refresh_token with
  | Some token when String.trim token <> "" -> Ok token
  | _ -> Error (missing_refresh_token_error config)

let contains_substring ~needle text =
  let needle_len = String.length needle in
  let text_len = String.length text in
  let rec loop index =
    index + needle_len <= text_len
    && (String.sub text index needle_len = needle || loop (index + 1))
  in
  needle_len = 0 || loop 0

let missing_e2ee_password_diagnostic text =
  let text = String.lowercase_ascii text in
  List.exists
    (fun needle -> contains_substring ~needle text)
    [
      "db-sync/missing-e2ee-password";
      "missing-e2ee-password";
      "db-sync/invalid-e2ee-password-payload";
      "invalid-e2ee-password-payload";
      "decrypt-text-by-text-password";
      "e2ee-password-not-found";
    ]

let ensure_e2ee_password_available config invoke_config repo e2ee_password
    graph_e2ee =
  if not graph_e2ee then Cli_effect.pure (Ok ())
  else
    match refresh_token_required config with
    | Error err -> Cli_effect.pure (Error err)
    | Ok refresh_token ->
        let verify_e2ee_password =
          match e2ee_password with
          | Some password when String.trim password <> "" ->
              Transport.thread_api_verify_and_save_e2ee_password invoke_config
                ~refresh_token ~password
          | _ ->
              Transport.thread_api_get_e2ee_password invoke_config
                ~refresh_token
        in
        Cli_effect.catch
          (Cli_effect.bind verify_e2ee_password (fun result ->
               match tagged_error_value result with
               | Some value ->
                   let message =
                     worker_error_message
                       ~default_message:"e2ee password failed" value
                   in
                   if missing_e2ee_password_diagnostic message then
                     Cli_effect.pure (Error (e2ee_password_not_found repo))
                   else
                     Cli_effect.pure (Error (e2ee_password_worker_error value))
               | None -> Cli_effect.pure (Ok ())))
          (fun exn ->
            let message = Printexc.to_string exn in
            if missing_e2ee_password_diagnostic message then
              Cli_effect.pure (Error (e2ee_password_not_found repo))
            else Cli_effect.error exn)

let runtime_error repo status last_error =
  Error.make
    ~hint:
      "Run sync status to inspect last-error and fix sync runtime error before \
       retrying."
    ~context:
      (Edn_util.map
         [
           (kw ":repo", Edn_util.string (repo_string repo));
           (kw ":status", status);
           (kw ":last-error", last_error);
         ])
    (Edn_util.keyword_t "sync-start-runtime-error")
    "sync start reached open websocket but runtime sync error is present"

let sync_start_timeout_error repo status =
  Error.make
    ~hint:
      "Run sync status to inspect ws-state and ensure sync endpoint/token are \
       valid."
    ~context:
      (Edn_util.map
         [
           (kw ":repo", Edn_util.string (repo_string repo));
           (kw ":status", status);
         ])
    (Edn_util.keyword_t "sync-start-timeout")
    "sync start timed out before websocket reached open state"

let wait_sync_start_ready config invoke_config repo =
  let deadline =
    Option.value
      (Time.add_span (Time.now ()) config.Cli_config.timeout_span)
      ~default:Time.max_time
  in
  let rec loop () =
    Cli_effect.bind (Transport.thread_api_db_sync_status invoke_config ~repo)
      (fun status ->
        match (status_ws_state status, status_last_error status) with
        | Some "open", Some last_error ->
            Cli_effect.pure (Error (runtime_error repo status last_error))
        | Some "open", _ -> Cli_effect.pure (Ok status)
        | _ when Time.compare_time (Time.now ()) deadline >= 0 ->
            Cli_effect.pure (Error (sync_start_timeout_error repo status))
        | _ ->
            Cli_effect.bind
              (Cli_effect.sleep (Time.span_of_ms 100L))
              (fun () -> loop ()))
  in
  loop ()

let execute_status mode config repo =
  Cli_effect.bind
    (Server_runtime.ensure_server config repo ~create_empty_db:false) (function
    | Error err ->
        Cli_effect.pure
          (Cli_result.error ~command:Command_id.Sync_status mode err)
    | Ok invoke_config ->
        Cli_effect.bind (prepare_worker_runtime invoke_config config) (fun _ ->
            Cli_effect.bind
              (Transport.thread_api_db_sync_status invoke_config ~repo)
              (fun result ->
                Cli_effect.pure
                  (Cli_result.ok ~command:Command_id.Sync_status mode
                     (Raw result)))))

let execute_stop mode config repo =
  Cli_effect.bind
    (Server_runtime.ensure_server config repo ~create_empty_db:false) (function
    | Error err ->
        Cli_effect.pure
          (Cli_result.error ~command:Command_id.Sync_stop mode err)
    | Ok invoke_config ->
        Cli_effect.bind (prepare_worker_runtime invoke_config config) (fun _ ->
            Cli_effect.bind (Transport.thread_api_db_sync_stop invoke_config)
              (fun result ->
                Cli_effect.pure
                  (Cli_result.ok ~command:Command_id.Sync_stop mode
                     (Raw (result_value result))))))

let sync_download_timeout_span = Time.span_of_ms 1_800_000L

let sync_download_invoke_config invoke_config =
  {
    invoke_config with
    Transport.timeout_span =
      (if
         Time.compare_span invoke_config.Transport.timeout_span
           sync_download_timeout_span
         >= 0
       then invoke_config.Transport.timeout_span
       else sync_download_timeout_span);
  }

let execute_upload mode config repo e2ee_password =
  let command = Command_id.Sync_upload in
  let error err = Cli_effect.pure (Cli_result.error ~command mode err) in
  Cli_effect.bind (resolve_runtime_auth_if_available config) (function
    | Error err -> error err
    | Ok config ->
        Cli_effect.bind
          (Server_runtime.ensure_server config repo ~create_empty_db:false)
          (function
          | Error err -> error err
          | Ok invoke_config ->
              let upload_invoke_config =
                sync_download_invoke_config invoke_config
              in
              let ensure_upload_e2ee_password () =
                match e2ee_password with
                | Some password when String.trim password <> "" ->
                    ensure_e2ee_password_available config upload_invoke_config
                      repo e2ee_password true
                | _ ->
                    Cli_effect.bind
                      (Transport.thread_api_q upload_invoke_config ~repo
                         ~query:(Edn_util.vector_t [ graph_e2ee_query ]))
                      (fun graph_e2ee ->
                        let graph_e2ee =
                          match Edn_util.as_bool graph_e2ee with
                          | Some false -> false
                          | _ -> true
                        in
                        ensure_e2ee_password_available config
                          upload_invoke_config repo e2ee_password graph_e2ee)
              in
              Cli_effect.bind
                (prepare_worker_runtime upload_invoke_config config) (fun _ ->
                  Cli_effect.bind (ensure_upload_e2ee_password ()) (function
                    | Error err -> error err
                    | Ok () ->
                        Cli_effect.bind
                          (Transport.thread_api_db_sync_upload_graph
                             upload_invoke_config ~repo) (fun result ->
                            match tagged_error_value result with
                            | Some value ->
                                error (sync_upload_worker_error value)
                            | None ->
                                Cli_effect.pure
                                  (Cli_result.ok ~command mode
                                     (Raw (result_value result))))))))

let execute_start mode config repo e2ee_password =
  let command = Command_id.Sync_start in
  let error err = Cli_effect.pure (Cli_result.error ~command mode err) in
  let ok status = Cli_effect.pure (Cli_result.ok ~command mode (Raw status)) in
  Cli_effect.bind (resolve_runtime_auth_if_available config) (function
    | Error err -> error err
    | Ok config ->
        Cli_effect.bind
          (Server_runtime.ensure_server config repo ~create_empty_db:false)
          (function
          | Error err -> error err
          | Ok invoke_config ->
              Cli_effect.bind (prepare_worker_runtime invoke_config config)
                (fun _ ->
                  let start_sync () =
                    Cli_effect.bind
                      (Transport.thread_api_db_sync_start invoke_config ~repo)
                      (fun _ ->
                        Cli_effect.bind
                          (wait_sync_start_ready config invoke_config repo)
                          (function
                          | Ok status -> ok status
                          | Error err -> error err))
                  in
                  Cli_effect.bind
                    (Transport.thread_api_q invoke_config ~repo
                       ~query:(Edn_util.vector_t [ graph_e2ee_query ]))
                    (fun graph_e2ee ->
                      let graph_e2ee =
                        Edn_util.as_bool graph_e2ee = Some true
                      in
                      let handle_e2ee = function
                        | Error err -> error err
                        | Ok () -> start_sync ()
                      in
                      Cli_effect.bind
                        (ensure_e2ee_password_available config invoke_config
                           repo e2ee_password graph_e2ee)
                        handle_e2ee))))

let execute_remote_graphs mode config =
  Cli_effect.bind (Auth_state.resolve_auth config) (function
    | Error err ->
        Cli_effect.pure
          (Cli_result.error ~command:Command_id.Sync_remote_graphs mode err)
    | Ok auth ->
        let config = config_with_auth config auth in
        Cli_effect.bind (invoke_global_config config) (function
          | Error err ->
              Cli_effect.pure
                (Cli_result.error ~command:Command_id.Sync_remote_graphs mode
                   err)
          | Ok invoke_config ->
              Cli_effect.bind (prepare_worker_runtime invoke_config config)
                (fun _ ->
                  Cli_effect.bind
                    (Transport.thread_api_db_sync_list_remote_graphs
                       invoke_config) (fun graphs ->
                      match remote_graphs_error graphs with
                      | Some error_value ->
                          Cli_effect.pure
                            (Cli_result.error
                               ~command:Command_id.Sync_remote_graphs mode
                               (remote_graphs_worker_error error_value))
                      | None ->
                          Cli_effect.pure
                            (Cli_result.ok
                               ~command:Command_id.Sync_remote_graphs mode
                               (Raw
                                  (Edn_util.map
                                     [ (kw ":graphs", graphs_value graphs) ])))))))

let execute_grant_access mode config repo graph_id email =
  Cli_effect.bind
    (Server_runtime.ensure_server config repo ~create_empty_db:false) (function
    | Error err ->
        Cli_effect.pure
          (Cli_result.error ~command:Command_id.Sync_grant_access mode err)
    | Ok invoke_config ->
        Cli_effect.bind (prepare_worker_runtime invoke_config config) (fun _ ->
            Cli_effect.bind
              (Transport.thread_api_db_sync_grant_graph_access invoke_config
                 ~repo ~graph_id ~email) (fun result ->
                Cli_effect.pure
                  (Cli_result.ok ~command:Command_id.Sync_grant_access mode
                     (Raw (result_value result))))))

let execute_ensure_keys mode config ~upload_keys ~e2ee_password =
  Cli_effect.bind (invoke_global_config config) (function
    | Error err ->
        Cli_effect.pure
          (Cli_result.error ~command:Command_id.Sync_ensure_keys mode err)
    | Ok invoke_config ->
        Cli_effect.bind (prepare_worker_runtime invoke_config config) (fun _ ->
            let options = ensure_keys_args ~upload_keys ~e2ee_password in
            Cli_effect.bind
              (Transport.thread_api_db_sync_ensure_user_rsa_keys ?options
                 invoke_config) (fun result ->
                Cli_effect.pure
                  (Cli_result.ok ~command:Command_id.Sync_ensure_keys mode
                     (Raw (result_value result))))))

let ensure_empty_download_db invoke_config repo =
  Cli_effect.bind
    (Transport.thread_api_q invoke_config ~repo
       ~query:(Edn_util.vector_t [ sync_download_non_empty_query ]))
    (function
      | count_value
        when Option.value (Edn_util.as_int count_value) ~default:0 > 0 ->
          let count = Option.value (Edn_util.as_int count_value) ~default:0 in
          Cli_effect.pure (Error (graph_db_not_empty repo count))
      | _ -> Cli_effect.pure (Ok ()))

let invoke_download_graph mode config invoke_config repo graph_id graph_e2ee
    subscription =
  Cli_effect.finally
    (Cli_effect.bind
       (Transport.thread_api_db_sync_download_graph_by_id invoke_config ~repo
          ~graph_id ~graph_e2ee) (fun result ->
         Cli_effect.pure
           (Cli_result.ok ~command:Command_id.Sync_download mode
              (Raw (result_value result)))))
    (fun () ->
      match subscription with
      | Some subscription -> subscription.Transport.close ()
      | None -> Cli_effect.pure ())

let execute_download_with_remote mode config repo graph progress
    progress_explicit e2ee_password remote_graph =
  match remote_graph_id remote_graph with
  | None ->
      Cli_effect.pure
        (Cli_result.error ~command:Command_id.Sync_download mode
           (remote_graph_not_found graph))
  | Some graph_id ->
      let graph_e2ee = remote_graph_e2ee remote_graph in
      Cli_effect.bind
        (Server_runtime.ensure_server config repo ~create_empty_db:true)
        (function
        | Error err ->
            Cli_effect.pure
              (Cli_result.error ~command:Command_id.Sync_download mode err)
        | Ok invoke_config ->
            let download_invoke_config =
              sync_download_invoke_config invoke_config
            in
            Cli_effect.bind (prepare_worker_runtime invoke_config config)
              (fun _ ->
                Cli_effect.bind
                  (ensure_e2ee_password_available config invoke_config repo
                     e2ee_password graph_e2ee) (function
                  | Error err ->
                      Cli_effect.pure
                        (Cli_result.error ~command:Command_id.Sync_download mode
                           err)
                  | Ok () ->
                      Cli_effect.bind
                        (ensure_empty_download_db invoke_config repo) (function
                        | Error err ->
                            Cli_effect.pure
                              (Cli_result.error
                                 ~command:Command_id.Sync_download mode err)
                        | Ok () ->
                            let progress_enabled =
                              download_progress_enabled config ~progress
                                ~progress_explicit
                            in
                            Cli_effect.bind
                              (maybe_connect_download_progress config
                                 download_invoke_config
                                 ~enabled:progress_enabled ~graph_id)
                              (fun subscription ->
                                invoke_download_graph mode config
                                  download_invoke_config repo graph_id
                                  graph_e2ee subscription)))))

let execute_download mode config repo graph progress progress_explicit
    e2ee_password =
  let graph_name = graph_string graph in
  Cli_effect.bind (resolve_runtime_auth_if_available config) (function
    | Error err ->
        Cli_effect.pure
          (Cli_result.error ~command:Command_id.Sync_download mode err)
    | Ok config ->
        Cli_effect.bind (invoke_global_config config ~create_empty_db:true)
          (function
          | Error err ->
              Cli_effect.pure
                (Cli_result.error ~command:Command_id.Sync_download mode err)
          | Ok global_config ->
              Cli_effect.bind (prepare_worker_runtime global_config config)
                (fun _ ->
                  Cli_effect.bind
                    (Transport.thread_api_db_sync_list_remote_graphs
                       global_config) (fun remote_graphs ->
                      match find_remote_graph graph_name remote_graphs with
                      | None ->
                          Cli_effect.pure
                            (Cli_result.error ~command:Command_id.Sync_download
                               mode
                               (remote_graph_not_found graph_name))
                      | Some remote_graph ->
                          execute_download_with_remote mode config repo
                            graph_name progress progress_explicit e2ee_password
                            remote_graph))))

let validate_asset repo graph asset =
  match Edn_util.as_map asset with
  | Some _ ->
      if not (List.exists asset_tag (asset_tags asset)) then
        Error
          (asset_download_error "not-asset" "selected entity is not an asset"
             repo graph)
      else if Option.is_none (non_empty_string_field asset ":block/uuid") then
        Error
          (asset_download_error "asset-uuid-missing" "asset uuid is missing"
             repo graph)
      else if
        Option.is_none
          (non_empty_string_field asset ":logseq.property.asset/type")
      then
        Error
          (asset_download_error "asset-type-missing" "asset type is missing"
             repo graph)
      else if
        Option.is_none
          (non_empty_string_field asset ":logseq.property.asset/checksum")
      then
        Error
          (asset_download_error "asset-checksum-missing"
             "asset checksum is missing" repo graph)
      else if not (field_present asset ":logseq.property.asset/remote-metadata")
      then
        Error
          (asset_download_error "asset-not-remote"
             "asset remote metadata is missing" repo graph)
      else if
        Option.is_some
          (non_empty_string_field asset ":logseq.property.asset/external-url")
      then
        Error
          (asset_download_error "external-asset"
             "external URL assets cannot be downloaded through sync" repo graph)
      else Ok asset
  | _ ->
      Error
        (asset_download_error "asset-not-found" "asset not found" repo graph)

let request_asset_download mode config invoke_config repo asset checksum_status
    extra =
  match non_empty_string_field asset ":block/uuid" with
  | Some asset_uuid ->
      Cli_effect.bind
        (Transport.thread_api_db_sync_request_asset_download invoke_config ~repo
           ~asset_uuid) (fun _ ->
          Cli_effect.pure
            (Cli_result.ok ~command:Command_id.Sync_asset_download mode
               (Raw
                  (asset_result_data ~extra asset ~download_requested:true
                     ~checksum_status))))
  | None ->
      Cli_effect.pure
        (Cli_result.error ~command:Command_id.Sync_asset_download mode
           (Error.make
              (Edn_util.keyword_t "asset-uuid-missing")
              "asset uuid is missing"))

let execute_asset_download_request mode config invoke_config repo graph asset =
  Cli_effect.bind (Transport.thread_api_db_sync_status invoke_config ~repo)
    (fun status ->
      match (status_ws_state status, Edn_util.get status ":graph-id") with
      | Some "open", Some graph_id when Option.is_some (value_string graph_id)
        -> (
          match local_asset_status config repo asset with
          | Local_match ->
              Cli_effect.pure
                (Cli_result.ok ~command:Command_id.Sync_asset_download mode
                   (Raw
                      (asset_result_data
                         ~extra:
                           [ (kw ":skipped-reason", kw ":already-downloaded") ]
                         asset ~download_requested:false
                         ~checksum_status:":match")))
          | Local_mismatch path ->
              remove_local_asset path;
              request_asset_download mode config invoke_config repo asset
                ":mismatch"
                [
                  ( kw ":hint",
                    Edn_util.string
                      "Local asset checksum mismatched; requested re-download."
                  );
                ]
          | Local_missing ->
              request_asset_download mode config invoke_config repo asset
                ":missing" [])
      | _ ->
          Cli_effect.pure
            (Cli_result.error ~command:Command_id.Sync_asset_download mode
               (Error.make
                  ~hint:
                    ("Run logseq sync start --graph " ^ graph_string graph
                   ^ " first.")
                  ~context:
                    (Edn_util.map
                       [
                         (kw ":repo", Edn_util.string (repo_string repo));
                         (kw ":graph", Edn_util.string (graph_string graph));
                         (kw ":status", status);
                       ])
                  (Edn_util.keyword_t "sync-not-started")
                  "sync is not started for this graph")))

let execute_asset_download mode config repo graph id uuid =
  Cli_effect.bind
    (Server_runtime.ensure_server config repo ~create_empty_db:false) (function
    | Error err ->
        Cli_effect.pure
          (Cli_result.error ~command:Command_id.Sync_asset_download mode err)
    | Ok invoke_config ->
        Cli_effect.bind (prepare_worker_runtime invoke_config config) (fun _ ->
            Cli_effect.bind
              (Transport.thread_api_pull invoke_config ~repo
                 ~selector:
                   (Edn_util.expect_vector_t "sync asset pull selector"
                      sync_asset_pull_selector)
                 ~lookup:(asset_lookup_ref ~id ~uuid))
              (fun asset ->
                match validate_asset repo graph asset with
                | Error err ->
                    Cli_effect.pure
                      (Cli_result.error ~command:Command_id.Sync_asset_download
                         mode err)
                | Ok asset ->
                    execute_asset_download_request mode config invoke_config
                      repo graph asset)))

let execute action config mode =
  match action with
  | Sync_config_get { key } -> execute_config_get mode config key
  | Sync_config_set { key; value } -> execute_config_set mode config key value
  | Sync_config_unset { key } -> execute_config_unset mode config key
  | Sync_status { repo; _ } -> execute_status mode config repo
  | Sync_start { repo; e2ee_password; _ } ->
      execute_start mode config repo e2ee_password
  | Sync_stop { repo; _ } -> execute_stop mode config repo
  | Sync_upload { repo; e2ee_password; _ } ->
      execute_upload mode config repo e2ee_password
  | Sync_download { repo; graph; progress; progress_explicit; e2ee_password; _ }
    ->
      execute_download mode config repo graph progress progress_explicit
        e2ee_password
  | Sync_asset_download { repo; graph; id; uuid } ->
      execute_asset_download mode config repo graph id uuid
  | Sync_remote_graphs -> execute_remote_graphs mode config
  | Sync_ensure_keys { e2ee_password; upload_keys } ->
      execute_ensure_keys mode config ~upload_keys ~e2ee_password
  | Sync_grant_access { repo; graph_id; email; _ } ->
      execute_grant_access mode config repo graph_id email

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
    meta
      ~examples:[ "logseq sync status --graph my-graph" ]
      Command_id.Sync_status "Show db-sync runtime status";
    meta
      ~examples:
        [
          "logseq sync start --graph my-graph";
          "logseq sync start --graph my-graph --e2ee-password \"my-secret\"";
        ]
      Sync_start "Start db-sync client";
    meta
      ~examples:[ "logseq sync stop --graph my-graph" ]
      Sync_stop "Stop db-sync client";
    meta
      ~examples:
        [
          "logseq sync upload --graph my-graph";
          "logseq sync upload --graph my-graph --e2ee-password \"my-secret\"";
        ]
      Sync_upload "Initialize upload of the entire graph";
    meta
      ~examples:
        [
          "logseq sync download --graph my-graph";
          "logseq sync download --graph my-graph --progress";
          "logseq sync download --graph my-graph --e2ee-password \"my-secret\"";
        ]
      Sync_download "Download remote graph snapshot";
    meta
      ~examples:
        [
          "logseq sync asset download --graph my-graph --id 123";
          "logseq sync asset download --graph my-graph --uuid <asset-uuid>";
        ]
      Sync_asset_download "Download remote asset";
    meta
      ~examples:[ "logseq sync remote-graphs" ]
      Sync_remote_graphs "List remote graphs";
    meta
      ~examples:
        [
          "logseq sync ensure-keys";
          "logseq sync ensure-keys --e2ee-password \"my-secret\" --upload-keys";
        ]
      Sync_ensure_keys "Ensure user RSA keys for sync/e2ee";
    meta
      ~examples:
        [
          "logseq sync grant-access --graph my-graph --graph-id \
           8b6ecdd0-1fab-4a9f-b3fb-3069c5f76e95 --email teammate@example.com";
        ]
      Sync_grant_access "Grant graph access to an email";
    meta
      ~examples:[ "logseq sync config set --key sync-enabled --value true" ]
      Sync_config_set "Set sync config key";
    meta
      ~examples:[ "logseq sync config get --key sync-enabled" ]
      Sync_config_get "Get sync config key";
    meta
      ~examples:[ "logseq sync config unset --key sync-enabled" ]
      Sync_config_unset "Unset sync config key";
  ]
