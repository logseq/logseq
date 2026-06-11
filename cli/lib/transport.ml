open Cli_effect.Infix

type invoke_config = {
  base_url : Cli_primitive.url;
  timeout_span : float;
  profile_session : Profile_types.session option;
}

type event_type = Cli_primitive.keyword
type event_payload = Melange_edn.any
type event_subscription = { close : unit -> unit Cli_effect.t }

let thread_api_method name = Edn_util.keyword_t ("thread-api/" ^ name)

module T = Transit.Json
module E = Melange_edn

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let strip_prefix prefix value =
  if starts_with ~prefix value then
    String.sub value (String.length prefix)
      (String.length value - String.length prefix)
  else value

let transit_keyword_name keyword = strip_prefix ":" keyword

let value_of_transit = T.to_edn
let transit_json_of_value value = T.to_string (T.of_edn value)
let value_of_transit_string text = T.of_string text |> value_of_transit
let edn_of_value value = value
let value_of_edn value = value

let normalize_base_url base_url =
  let base_url = String.trim base_url in
  if base_url = "" then invalid_arg "base-url is required"
  else if
    String.length base_url > 0 && base_url.[String.length base_url - 1] = '/'
  then String.sub base_url 0 (String.length base_url - 1)
  else base_url

let find_substring_from ~needle haystack start =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec matches needle_index haystack_index =
    needle_index = needle_len
    || haystack.[haystack_index] = needle.[needle_index]
       && matches (needle_index + 1) (haystack_index + 1)
  in
  let rec loop idx =
    match String.index_from_opt haystack idx needle.[0] with
    | None -> None
    | Some idx ->
        if idx + needle_len > haystack_len then None
        else if matches 0 idx then Some idx
        else loop (idx + 1)
  in
  if needle_len = 0 then Some start else loop start

let http_error_message status body =
  let fallback =
    if String.trim body = "" then
      "http request failed (" ^ string_of_int status ^ ")"
    else
      "http request failed (" ^ string_of_int status ^ ")\nhttp response: "
      ^ body
  in
  try
    match Json_util.object_of_json_string body with
    | Some object_ ->
        Option.value
          (match Json_util.nested_string_field object_ "error" "message" with
          | Some _ as message -> message
          | None -> Json_util.string_field object_ "message")
          ~default:fallback
    | None -> fallback
  with _ -> fallback

let response_status response = Fetch.Response.status response
let success_status status = status >= 200 && status <= 299

let request ?timeout_span method_ uri ~headers ~body =
  Cli_platform.HTTP.request ?timeout_span method_ uri ~headers ~body
  >>= fun (response, body) ->
  let status = response_status response in
  if success_status status then Cli_effect.pure (response, body)
  else Cli_effect.error (Failure (http_error_message status body))

let method_name method_ = Edn_util.keyword_to_string method_ |> String.trim

let invoke_body method_ args =
  let args_transit = transit_json_of_value (Edn_util.vector args) in
  Json_util.string_of_string_fields
    [ ("method", method_name method_); ("argsTransit", args_transit) ]

let invoke config method_ args =
  let base_url = normalize_base_url config.base_url in
  let stage = "transport.invoke:" ^ method_name method_ in
  Profile_types.time config.profile_session stage (fun () ->
      Cli_effect.map
        (fun (_response, body) ->
          match Json_util.object_of_json_string body with
          | Some object_ -> (
              match Json_util.string_field object_ "resultTransit" with
              | Some result_transit -> value_of_transit_string result_transit
              | None -> Edn_util.nil)
          | None -> Edn_util.nil)
        (request ~timeout_span:config.timeout_span Fetch.Post
           (base_url ^ "/v1/invoke")
           ~headers:
             [
               ("Content-Type", "application/json");
               ("Accept", "application/json");
             ]
           ~body:(invoke_body method_ args)))

let repo_value repo = Edn_util.string (Cli_primitive.string_of_repo repo)

let thread_api_apply_outliner_ops config ~(repo : Cli_primitive.repo)
    ~(ops : Melange_edn.vector Melange_edn.t)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "apply-outliner-ops")
    [ repo_value repo; Edn_util.any ops; Edn_util.any options ]

let thread_api_backup_db_sqlite config ~(repo : Cli_primitive.repo) ~path =
  invoke config
    (thread_api_method "backup-db-sqlite")
    [ repo_value repo; Edn_util.string path ]

let thread_api_cli_list_nodes config ~(repo : Cli_primitive.repo)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "cli-list-nodes")
    [ repo_value repo; Edn_util.any options ]

let thread_api_cli_list_pages config ~(repo : Cli_primitive.repo)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "cli-list-pages")
    [ repo_value repo; Edn_util.any options ]

let thread_api_cli_list_properties config ~(repo : Cli_primitive.repo)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "cli-list-properties")
    [ repo_value repo; Edn_util.any options ]

let thread_api_cli_list_tags config ~(repo : Cli_primitive.repo)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "cli-list-tags")
    [ repo_value repo; Edn_util.any options ]

let thread_api_cli_list_tasks config ~(repo : Cli_primitive.repo)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "cli-list-tasks")
    [ repo_value repo; Edn_util.any options ]

let thread_api_create_or_open_db config ~(repo : Cli_primitive.repo)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "create-or-open-db")
    [ repo_value repo; Edn_util.any options ]

let thread_api_db_sync_download_graph_by_id config ~(repo : Cli_primitive.repo)
    ~graph_id ~graph_e2ee =
  invoke config
    (thread_api_method "db-sync-download-graph-by-id")
    [ repo_value repo; Edn_util.string graph_id; Edn_util.bool graph_e2ee ]

let thread_api_db_sync_ensure_user_rsa_keys ?options config =
  let args =
    match options with None -> [] | Some options -> [ Edn_util.any options ]
  in
  invoke config (thread_api_method "db-sync-ensure-user-rsa-keys") args

let thread_api_db_sync_grant_graph_access config ~(repo : Cli_primitive.repo)
    ~graph_id ~email =
  invoke config
    (thread_api_method "db-sync-grant-graph-access")
    [ repo_value repo; Edn_util.string graph_id; Edn_util.string email ]

let thread_api_db_sync_list_remote_graphs config =
  invoke config (thread_api_method "db-sync-list-remote-graphs") []

let thread_api_db_sync_request_asset_download config
    ~(repo : Cli_primitive.repo) ~asset_uuid =
  invoke config
    (thread_api_method "db-sync-request-asset-download")
    [ repo_value repo; Edn_util.uuid asset_uuid ]

let thread_api_db_sync_start config ~(repo : Cli_primitive.repo) =
  invoke config (thread_api_method "db-sync-start") [ repo_value repo ]

let thread_api_db_sync_status config ~(repo : Cli_primitive.repo) =
  invoke config (thread_api_method "db-sync-status") [ repo_value repo ]

let thread_api_db_sync_stop config =
  invoke config (thread_api_method "db-sync-stop") []

let thread_api_db_sync_upload_graph config ~(repo : Cli_primitive.repo) =
  invoke config (thread_api_method "db-sync-upload-graph") [ repo_value repo ]

let thread_api_export_edn config ~(repo : Cli_primitive.repo)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "export-edn")
    [ repo_value repo; Edn_util.any options ]

let thread_api_get_block_parents config ~(repo : Cli_primitive.repo) ~block_id =
  invoke config
    (thread_api_method "get-block-parents")
    [ repo_value repo; Edn_util.int64 block_id ]

let thread_api_get_block_refs config ~(repo : Cli_primitive.repo) ~block_id =
  invoke config
    (thread_api_method "get-block-refs")
    [ repo_value repo; Edn_util.int64 block_id ]

let thread_api_get_e2ee_password config ~refresh_token =
  invoke config
    (thread_api_method "get-e2ee-password")
    [ Edn_util.string refresh_token ]

let thread_api_import_db_binary config ~(repo : Cli_primitive.repo) ~data =
  invoke config (thread_api_method "import-db-binary") [ repo_value repo; data ]

let thread_api_import_edn config ~(repo : Cli_primitive.repo) ~data =
  invoke config (thread_api_method "import-edn") [ repo_value repo; data ]

let thread_api_pull config ~(repo : Cli_primitive.repo)
    ~(selector : Melange_edn.vector Melange_edn.t) ~lookup =
  invoke config (thread_api_method "pull")
    [ repo_value repo; Edn_util.any selector; lookup ]

let thread_api_q config ~(repo : Cli_primitive.repo)
    ~(query : Melange_edn.vector Melange_edn.t) =
  invoke config (thread_api_method "q") [ repo_value repo; Edn_util.any query ]

let thread_api_set_db_sync_config config ~config:sync_config =
  invoke config
    (thread_api_method "set-db-sync-config")
    [ Edn_util.any sync_config ]

let thread_api_sync_app_state config
    ~(auth_state : Melange_edn.map Melange_edn.t) =
  invoke config (thread_api_method "sync-app-state") [ Edn_util.any auth_state ]

let thread_api_validate_db config ~(repo : Cli_primitive.repo)
    ~(options : Melange_edn.map Melange_edn.t) =
  invoke config
    (thread_api_method "validate-db")
    [ repo_value repo; Edn_util.any options ]

let thread_api_verify_and_save_e2ee_password config ~refresh_token ~password =
  invoke config
    (thread_api_method "verify-and-save-e2ee-password")
    [ Edn_util.string refresh_token; Edn_util.string password ]

let value_get_string_key key value =
  match Edn_util.as_map value with
  | Some fields ->
      List.find_map
        (fun (field_key, value) ->
          match
            (Edn_util.as_string_like field_key, Edn_util.as_string value)
          with
          | Some field, Some value when field = key -> Some value
          | _ -> None)
        fields
  | None -> None

let keyword_from_string value = Edn_util.keyword_t (transit_keyword_name value)

let decode_event_payload payload =
  try value_of_transit_string payload with _ -> Edn_util.string payload

let max_non_progress_event_decode_bytes = 256 * 1024

let decode_event event_text =
  let data_line =
    event_text |> String.split_on_char '\n'
    |> List.find_map (fun line ->
        if starts_with ~prefix:"data: " line then
          Some (String.sub line 6 (String.length line - 6))
        else None)
  in
  match data_line with
  | None -> None
  | Some data -> (
      try
        let json = Js.Json.parseExn data in
        let event_type =
          Option.bind (Js.Json.decodeObject json) (fun object_ ->
              Json_util.string_field object_ "type")
        in
        match event_type with
        | Some event_type
          when event_type <> "rtc-log"
               && String.length data > max_non_progress_event_decode_bytes ->
            Some (keyword_from_string event_type, Edn_util.nil)
        | _ -> (
            let event = Json_util.value_of_json json in
            let decoded_payload =
              match value_get_string_key "payload" event with
              | Some payload -> decode_event_payload payload
              | None -> Edn_util.nil
            in
            match Edn_util.as_vector decoded_payload with
            | Some [ event_type_value; payload ] -> (
                match Edn_util.as_keyword_t event_type_value with
                | Some event_type -> Some (event_type, payload)
                | None -> None)
            | _ -> (
                match value_get_string_key "type" event with
                | Some event_type ->
                    Some (keyword_from_string event_type, decoded_payload)
                | None -> None))
      with _ -> None)

let split_sse_events buffer =
  let rec loop start acc =
    match find_substring_from ~needle:"\n\n" buffer start with
    | None ->
        (List.rev acc, String.sub buffer start (String.length buffer - start))
    | Some idx ->
        let event_text = String.sub buffer start (idx - start) in
        loop (idx + 2) (event_text :: acc)
  in
  loop 0 []

let dispatch_event on_event event_type payload =
  Cli_effect.async (fun () ->
      Cli_effect.catch (on_event event_type payload) (fun _ ->
          Cli_effect.pure ()))

let consume_sse_chunk on_event buffer chunk =
  let events, rest = split_sse_events (!buffer ^ chunk) in
  buffer := rest;
  List.iter
    (fun event_text ->
      match decode_event event_text with
      | Some (event_type, payload) -> dispatch_event on_event event_type payload
      | None -> ())
    events

let connect_events config on_event =
  let base_url = normalize_base_url config.base_url in
  let buffer = ref "" in
  Cli_effect.map
    (fun (subscription : Cli_platform.Events.subscription) ->
      { close = subscription.close })
    (Cli_platform.Events.connect ~url:(base_url ^ "/v1/events")
       ~on_chunk:(consume_sse_chunk on_event buffer))

let normalize_format format = Edn_util.keyword_to_string format |> String.trim
let write_file_text path content = Cli_unix.write_text_file path content
let read_file_text path = Cli_unix.read_text_file path
let write_file_binary path content = Cli_unix.write_binary_file path content
let read_file_binary path = Bytes.of_string (Cli_unix.read_binary_file path)

let bytes_of_output_data value =
  match (Edn_util.as_bytes value, Edn_util.as_string value) with
  | Some bytes, _ -> Bytes.to_string bytes
  | _, Some value -> value
  | _ -> Melange_edn.to_edn_string value

let unsupported_output_format format =
  Error.make
    (Edn_util.keyword_t "unsupported-output-format")
    ("unsupported output format: " ^ format)

let unsupported_input_format format =
  Error.make
    (Edn_util.keyword_t "unsupported-input-format")
    ("unsupported input format: " ^ format)

let write_output ~format ~path ~data =
  let format = normalize_format format in
  try
    let result =
      match format with
      | "edn" ->
          write_file_text path (E.to_edn_string (edn_of_value data));
          Ok ()
      | "db" | "sqlite" ->
          write_file_binary path (bytes_of_output_data data);
          Ok ()
      | _ -> Error (unsupported_output_format format)
    in
    Cli_effect.pure result
  with exn -> Cli_effect.pure (Error (Error.exception_error exn))

let read_input ~format ~path =
  let format = normalize_format format in
  try
    let result =
      match format with
      | "edn" ->
          let content = read_file_text path in
          Ok (E.of_edn_string content |> value_of_edn)
      | "db" | "sqlite" -> Ok (Edn_util.bytes (read_file_binary path))
      | _ -> Error (unsupported_input_format format)
    in
    Cli_effect.pure result
  with exn -> Cli_effect.pure (Error (Error.exception_error exn))
