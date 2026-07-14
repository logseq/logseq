type invoke_config = {
  base_url : Cli_primitive.url;
  timeout_span : Time.span;
  profile_session : Profile_types.session option;
}

type event_type = Cli_primitive.keyword
type event_payload = Melange_edn_melange.any
type event_subscription = { close : unit -> unit Cli_effect.t }

val connect_events :
  invoke_config ->
  (event_type -> event_payload -> unit Cli_effect.t) ->
  event_subscription Cli_effect.t

val write_output :
  format:Cli_primitive.keyword ->
  path:Cli_primitive.path ->
  data:Melange_edn_melange.any ->
  unit Error.build_result Cli_effect.t

val read_input :
  format:Cli_primitive.keyword ->
  path:Cli_primitive.path ->
  Melange_edn_melange.any Error.build_result Cli_effect.t

val thread_api_apply_outliner_ops :
  invoke_config ->
  repo:Cli_primitive.repo ->
  ops:Melange_edn_melange.vector Melange_edn_melange.t ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_backup_db_sqlite :
  invoke_config ->
  repo:Cli_primitive.repo ->
  path:Cli_primitive.path ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_cli_list_nodes :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_cli_list_pages :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_cli_list_properties :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_cli_list_tags :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_cli_list_tasks :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_create_or_open_db :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_download_graph_by_id :
  invoke_config ->
  repo:Cli_primitive.repo ->
  graph_id:Cli_primitive.uuid ->
  graph_e2ee:bool ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_ensure_user_rsa_keys :
  ?options:Melange_edn_melange.map Melange_edn_melange.t ->
  invoke_config ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_grant_graph_access :
  invoke_config ->
  repo:Cli_primitive.repo ->
  graph_id:Cli_primitive.uuid ->
  email:Cli_primitive.email ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_list_remote_graphs :
  invoke_config -> Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_request_asset_download :
  invoke_config ->
  repo:Cli_primitive.repo ->
  asset_uuid:Cli_primitive.uuid ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_start :
  invoke_config ->
  repo:Cli_primitive.repo ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_status :
  invoke_config ->
  repo:Cli_primitive.repo ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_stop :
  invoke_config -> Melange_edn_melange.any Cli_effect.t

val thread_api_db_sync_upload_graph :
  invoke_config ->
  repo:Cli_primitive.repo ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_export_edn :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_get_block_parents :
  invoke_config ->
  repo:Cli_primitive.repo ->
  block_id:Cli_primitive.db_id ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_get_block_refs :
  invoke_config ->
  repo:Cli_primitive.repo ->
  block_id:Cli_primitive.db_id ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_get_e2ee_password :
  invoke_config -> refresh_token:string -> Melange_edn_melange.any Cli_effect.t

val thread_api_import_db_binary :
  invoke_config ->
  repo:Cli_primitive.repo ->
  data:Melange_edn_melange.any ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_import_edn :
  invoke_config ->
  repo:Cli_primitive.repo ->
  data:Melange_edn_melange.any ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_pull :
  invoke_config ->
  repo:Cli_primitive.repo ->
  selector:Melange_edn_melange.vector Melange_edn_melange.t ->
  lookup:Melange_edn_melange.any ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_q :
  invoke_config ->
  repo:Cli_primitive.repo ->
  query:Melange_edn_melange.vector Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_set_db_sync_config :
  invoke_config ->
  config:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_sync_app_state :
  invoke_config ->
  auth_state:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_validate_db :
  invoke_config ->
  repo:Cli_primitive.repo ->
  options:Melange_edn_melange.map Melange_edn_melange.t ->
  Melange_edn_melange.any Cli_effect.t

val thread_api_verify_and_save_e2ee_password :
  invoke_config ->
  refresh_token:string ->
  password:string ->
  Melange_edn_melange.any Cli_effect.t
