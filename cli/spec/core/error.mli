(** Shared error model. *)

type code =
  | Add_id_resolution_failed
  | Agent_bridge_already_running
  | Agent_bridge_lock_failed
  | Agent_master_prompt_invalid
  | Agent_name_invalid
  | Agent_prompt_template_invalid
  | Ambiguous_page_name
  | Ambiguous_property_name
  | Ambiguous_tag_name
  | Asset_checksum_failed
  | Asset_checksum_missing
  | Asset_create_failed
  | Asset_file_copy_failed
  | Asset_file_not_found
  | Asset_not_found
  | Asset_not_remote
  | Asset_tag_not_found
  | Asset_type_missing
  | Asset_uuid_missing
  | Auth_code_exchange_failed
  | Auth_file_delete_failed
  | Auth_file_write_failed
  | Auth_refresh_failed
  | Backup_create_failed
  | Backup_not_found
  | Block_link_cycle
  | Block_link_target_not_found
  | Block_not_found
  | Browser_open_failed
  | Codex_not_found
  | Codex_session_id_missing
  | Codex_start_failed
  | Config_write_failed
  | Doctor_error
  | Doctor_script_missing
  | Doctor_script_unreadable
  | Doctor_server_not_ready
  | E2ee_password_failed
  | E2ee_password_not_found
  | Entity_not_found
  | Exception
  | External_asset
  | Graph_already_exists
  | Graph_db_not_empty
  | Graph_exists
  | Graph_not_exists
  | Graph_not_removed
  | Graph_validation_failed
  | Invalid_auth_file
  | Invalid_auth_token
  | Invalid_blocks
  | Invalid_callback_request
  | Invalid_callback_state
  | Invalid_config
  | Invalid_options
  | Invalid_property_target
  | Invalid_query
  | Invalid_source
  | Invalid_tag_target
  | Invalid_target
  | Login_callback_error
  | Login_callback_not_found
  | Login_callback_server_start_failed
  | Login_not_configured
  | Login_timeout
  | Logout_not_configured
  | Missing_asset_selector
  | Missing_auth
  | Missing_callback_code
  | Missing_content
  | Missing_dst
  | Missing_examples
  | Missing_graph
  | Missing_id_token
  | Missing_page_name
  | Missing_property_name
  | Missing_query
  | Missing_query_text
  | Missing_repo
  | Missing_snapshot
  | Missing_source
  | Missing_tag_name
  | Missing_target
  | Missing_template_code_block
  | Missing_template_vars
  | Not_asset
  | Not_implemented
  | Page_hierarchy_parent_cycle
  | Page_not_found
  | Property_built_in
  | Property_hidden
  | Property_not_found
  | Recycled_page
  | Remote_graph_not_found
  | Root_dir_permission
  | Server_cleanup_failed
  | Server_not_found
  | Server_owned_by_other
  | Server_revision_mismatch_after_restart
  | Server_script_missing
  | Server_start_failed
  | Server_start_timeout_orphan
  | Server_stop_timeout
  | Skill_home_dir_unavailable
  | Skill_install_failed
  | Skill_show_failed
  | Skill_source_not_found
  | Source_not_found
  | Spec_blocker
  | Sync_not_started
  | Sync_remote_graphs_failed
  | Sync_start_runtime_error
  | Sync_start_timeout
  | Sync_upload_failed
  | Tag_built_in
  | Tag_create_not_tag
  | Tag_hidden
  | Tag_name_conflict
  | Tag_not_found
  | Tag_rename_conflict
  | Target_not_found
  | Task_tag_not_found
  | Unknown_command
  | Unknown_query
  | Unknown_template_vars
  | Unsupported_input_format
  | Unsupported_output_format
  | Upsert_id_not_found
  | Upsert_id_type_mismatch

val code_to_string : code -> string
val code_to_keyword : code -> Cli_primitive.keyword

type candidate = { id : Cli_primitive.db_id option; name : string option }

type t = {
  code : code;
  message : string;
  hint : string option;
  candidates : candidate list;
  context : Melange_edn.any option;
}

type 'a build_result = ('a, t) result

type source =
  | Cli_parse
  | Config
  | Build_action
  | Transport
  | Server
  | Auth
  | Sync
  | Db_worker
  | Filesystem
  | Unknown

val make :
  ?hint:string ->
  ?candidates:candidate list ->
  ?context:Melange_edn.any ->
  code ->
  string ->
  t

val invalid_options : string -> t
val missing_graph : unit -> t
val missing_repo : string -> t
val missing_target : string -> t
val unknown_command : string -> t
val exception_error : ?context:Melange_edn.any -> exn -> t
val map : ('a -> 'b) -> 'a build_result -> 'b build_result
val bind : 'a build_result -> ('a -> 'b build_result) -> 'b build_result
