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

type candidate = { id : Cli_primitive.db_id option; name : string option }

type t = {
  code : code;
  message : string;
  hint : string option;
  candidates : candidate list;
  context : Melange_edn_melange.any option;
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

let code_to_string = function
  | Add_id_resolution_failed -> "add-id-resolution-failed"
  | Agent_bridge_already_running -> "agent-bridge-already-running"
  | Agent_bridge_lock_failed -> "agent-bridge-lock-failed"
  | Agent_master_prompt_invalid -> "agent-master-prompt-invalid"
  | Agent_name_invalid -> "agent-name-invalid"
  | Agent_prompt_template_invalid -> "agent-prompt-template-invalid"
  | Ambiguous_page_name -> "ambiguous-page-name"
  | Ambiguous_property_name -> "ambiguous-property-name"
  | Ambiguous_tag_name -> "ambiguous-tag-name"
  | Asset_checksum_failed -> "asset-checksum-failed"
  | Asset_checksum_missing -> "asset-checksum-missing"
  | Asset_create_failed -> "asset-create-failed"
  | Asset_file_copy_failed -> "asset-file-copy-failed"
  | Asset_file_not_found -> "asset-file-not-found"
  | Asset_not_found -> "asset-not-found"
  | Asset_not_remote -> "asset-not-remote"
  | Asset_tag_not_found -> "asset-tag-not-found"
  | Asset_type_missing -> "asset-type-missing"
  | Asset_uuid_missing -> "asset-uuid-missing"
  | Auth_code_exchange_failed -> "auth-code-exchange-failed"
  | Auth_file_delete_failed -> "auth-file-delete-failed"
  | Auth_file_write_failed -> "auth-file-write-failed"
  | Auth_refresh_failed -> "auth-refresh-failed"
  | Backup_create_failed -> "backup-create-failed"
  | Backup_not_found -> "backup-not-found"
  | Block_link_cycle -> "block-link-cycle"
  | Block_link_target_not_found -> "block-link-target-not-found"
  | Block_not_found -> "block-not-found"
  | Browser_open_failed -> "browser-open-failed"
  | Codex_not_found -> "codex-not-found"
  | Codex_session_id_missing -> "codex-session-id-missing"
  | Codex_start_failed -> "codex-start-failed"
  | Config_write_failed -> "config-write-failed"
  | Doctor_error -> "doctor-error"
  | Doctor_script_missing -> "doctor-script-missing"
  | Doctor_script_unreadable -> "doctor-script-unreadable"
  | Doctor_server_not_ready -> "doctor-server-not-ready"
  | E2ee_password_failed -> "e2ee-password-failed"
  | E2ee_password_not_found -> "e2ee-password-not-found"
  | Entity_not_found -> "entity-not-found"
  | Exception -> "exception"
  | External_asset -> "external-asset"
  | Graph_already_exists -> "graph-already-exists"
  | Graph_db_not_empty -> "graph-db-not-empty"
  | Graph_exists -> "graph-exists"
  | Graph_not_exists -> "graph-not-exists"
  | Graph_not_removed -> "graph-not-removed"
  | Graph_validation_failed -> "graph-validation-failed"
  | Invalid_auth_file -> "invalid-auth-file"
  | Invalid_auth_token -> "invalid-auth-token"
  | Invalid_blocks -> "invalid-blocks"
  | Invalid_callback_request -> "invalid-callback-request"
  | Invalid_callback_state -> "invalid-callback-state"
  | Invalid_config -> "invalid-config"
  | Invalid_options -> "invalid-options"
  | Invalid_property_target -> "invalid-property-target"
  | Invalid_query -> "invalid-query"
  | Invalid_source -> "invalid-source"
  | Invalid_tag_target -> "invalid-tag-target"
  | Invalid_target -> "invalid-target"
  | Login_callback_error -> "login-callback-error"
  | Login_callback_not_found -> "login-callback-not-found"
  | Login_callback_server_start_failed -> "login-callback-server-start-failed"
  | Login_not_configured -> "login-not-configured"
  | Login_timeout -> "login-timeout"
  | Logout_not_configured -> "logout-not-configured"
  | Missing_asset_selector -> "missing-asset-selector"
  | Missing_auth -> "missing-auth"
  | Missing_callback_code -> "missing-callback-code"
  | Missing_content -> "missing-content"
  | Missing_dst -> "missing-dst"
  | Missing_examples -> "missing-examples"
  | Missing_graph -> "missing-graph"
  | Missing_id_token -> "missing-id-token"
  | Missing_page_name -> "missing-page-name"
  | Missing_property_name -> "missing-property-name"
  | Missing_query -> "missing-query"
  | Missing_query_text -> "missing-query-text"
  | Missing_repo -> "missing-repo"
  | Missing_snapshot -> "missing-snapshot"
  | Missing_source -> "missing-source"
  | Missing_tag_name -> "missing-tag-name"
  | Missing_target -> "missing-target"
  | Missing_template_code_block -> "missing-template-code-block"
  | Missing_template_vars -> "missing-template-vars"
  | Not_asset -> "not-asset"
  | Not_implemented -> "not-implemented"
  | Page_hierarchy_parent_cycle -> "page-hierarchy-parent-cycle"
  | Page_not_found -> "page-not-found"
  | Property_built_in -> "property-built-in"
  | Property_hidden -> "property-hidden"
  | Property_not_found -> "property-not-found"
  | Recycled_page -> "recycled-page"
  | Remote_graph_not_found -> "remote-graph-not-found"
  | Root_dir_permission -> "root-dir-permission"
  | Server_cleanup_failed -> "server-cleanup-failed"
  | Server_not_found -> "server-not-found"
  | Server_owned_by_other -> "server-owned-by-other"
  | Server_revision_mismatch_after_restart ->
      "server-revision-mismatch-after-restart"
  | Server_script_missing -> "server-script-missing"
  | Server_start_failed -> "server-start-failed"
  | Server_start_timeout_orphan -> "server-start-timeout-orphan"
  | Server_stop_timeout -> "server-stop-timeout"
  | Skill_home_dir_unavailable -> "skill-home-dir-unavailable"
  | Skill_install_failed -> "skill-install-failed"
  | Skill_show_failed -> "skill-show-failed"
  | Skill_source_not_found -> "skill-source-not-found"
  | Source_not_found -> "source-not-found"
  | Spec_blocker -> "spec-blocker"
  | Sync_not_started -> "sync-not-started"
  | Sync_remote_graphs_failed -> "sync-remote-graphs-failed"
  | Sync_start_runtime_error -> "sync-start-runtime-error"
  | Sync_start_timeout -> "sync-start-timeout"
  | Sync_upload_failed -> "sync-upload-failed"
  | Tag_built_in -> "tag-built-in"
  | Tag_create_not_tag -> "tag-create-not-tag"
  | Tag_hidden -> "tag-hidden"
  | Tag_name_conflict -> "tag-name-conflict"
  | Tag_not_found -> "tag-not-found"
  | Tag_rename_conflict -> "tag-rename-conflict"
  | Target_not_found -> "target-not-found"
  | Task_tag_not_found -> "task-tag-not-found"
  | Unknown_command -> "unknown-command"
  | Unknown_query -> "unknown-query"
  | Unknown_template_vars -> "unknown-template-vars"
  | Unsupported_input_format -> "unsupported-input-format"
  | Unsupported_output_format -> "unsupported-output-format"
  | Upsert_id_not_found -> "upsert-id-not-found"
  | Upsert_id_type_mismatch -> "upsert-id-type-mismatch"

let code_to_keyword code = Edn_util.keyword_t (code_to_string code)

let make ?hint ?(candidates = []) ?context code message =
  { code; message; hint; candidates; context }

let invalid_options message = make Invalid_options message

let missing_graph () =
  make ~hint:"Use --graph <name>" Missing_graph "graph name is required"

let missing_repo message = make Missing_repo message
let missing_target message = make Missing_target message
let unknown_command message = make Unknown_command message

let exception_error ?context exn =
  make ?context Exception (Printexc.to_string exn)

let map f = function Ok x -> Ok (f x) | Error e -> Error e
let bind x f = match x with Ok v -> f v | Error e -> Error e
