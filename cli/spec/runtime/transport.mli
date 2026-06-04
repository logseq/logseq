type request = {
  method_ : string;
  url : Cli_primitive.url;
  headers : (string * string) list;
  body : string option;
  timeout_ms : Cli_primitive.duration_ms option;
}

type response = { status : int; body : string }

type invoke_config = {
  base_url : Cli_primitive.url;
  timeout_ms : Cli_primitive.duration_ms;
  profile_session : Profile_types.session option;
}

type event_type = Cli_primitive.keyword
type event_payload = Edn_ocaml.any
type event_subscription = { close : unit -> unit Cli_effect.t }

val request : request -> response Cli_effect.t

val connect_events :
  invoke_config ->
  (event_type -> event_payload -> unit Cli_effect.t) ->
  event_subscription Cli_effect.t

val write_output :
  format:Cli_primitive.keyword ->
  path:Cli_primitive.path ->
  data:Edn_ocaml.any ->
  unit Error.build_result Cli_effect.t

val read_input :
  format:Cli_primitive.keyword ->
  path:Cli_primitive.path ->
  Edn_ocaml.any Error.build_result Cli_effect.t

val thread_api_apply_outliner_ops :
  invoke_config ->
  repo:Cli_primitive.repo ->
  ops:Edn_ocaml.vector Edn_ocaml.t ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_backup_db_sqlite :
  invoke_config ->
  repo:Cli_primitive.repo ->
  path:Cli_primitive.path ->
  Edn_ocaml.any Cli_effect.t

val thread_api_cli_list_nodes :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_cli_list_pages :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_cli_list_properties :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_cli_list_tags :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_cli_list_tasks :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_create_or_open_db :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_download_graph_by_id :
  invoke_config ->
  repo:Cli_primitive.repo ->
  graph_id:Cli_primitive.uuid ->
  graph_e2ee:bool ->
  Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_ensure_user_rsa_keys :
  ?options:Edn_ocaml.map Edn_ocaml.t ->
  invoke_config ->
  Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_grant_graph_access :
  invoke_config ->
  repo:Cli_primitive.repo ->
  graph_id:Cli_primitive.uuid ->
  email:Cli_primitive.email ->
  Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_list_remote_graphs :
  invoke_config -> Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_request_asset_download :
  invoke_config ->
  repo:Cli_primitive.repo ->
  asset_uuid:Cli_primitive.uuid ->
  Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_start :
  invoke_config -> repo:Cli_primitive.repo -> Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_status :
  invoke_config -> repo:Cli_primitive.repo -> Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_stop : invoke_config -> Edn_ocaml.any Cli_effect.t

val thread_api_db_sync_upload_graph :
  invoke_config -> repo:Cli_primitive.repo -> Edn_ocaml.any Cli_effect.t

val thread_api_export_edn :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_get_block_parents :
  invoke_config ->
  repo:Cli_primitive.repo ->
  block_id:Cli_primitive.db_id ->
  Edn_ocaml.any Cli_effect.t

val thread_api_get_block_refs :
  invoke_config ->
  repo:Cli_primitive.repo ->
  block_id:Cli_primitive.db_id ->
  Edn_ocaml.any Cli_effect.t

val thread_api_get_e2ee_password :
  invoke_config -> refresh_token:string -> Edn_ocaml.any Cli_effect.t

val thread_api_import_db_binary :
  invoke_config ->
  repo:Cli_primitive.repo ->
  data:Edn_ocaml.any ->
  Edn_ocaml.any Cli_effect.t

val thread_api_import_edn :
  invoke_config ->
  repo:Cli_primitive.repo ->
  data:Edn_ocaml.any ->
  Edn_ocaml.any Cli_effect.t

val thread_api_pull :
  invoke_config ->
  repo:Cli_primitive.repo ->
  selector:Edn_ocaml.vector Edn_ocaml.t ->
  lookup:Edn_ocaml.any ->
  Edn_ocaml.any Cli_effect.t

val thread_api_q :
  invoke_config ->
  repo:Cli_primitive.repo ->
  query:Edn_ocaml.vector Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_set_db_sync_config :
  invoke_config ->
  config:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_sync_app_state :
  invoke_config ->
  auth_state:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_validate_db :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Edn_ocaml.map Edn_ocaml.t ->
  Edn_ocaml.any Cli_effect.t

val thread_api_verify_and_save_e2ee_password :
  invoke_config ->
  refresh_token:string ->
  password:string ->
  Edn_ocaml.any Cli_effect.t
