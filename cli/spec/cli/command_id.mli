type t =
  | Version
  | Graph_list
  | Graph_create
  | Graph_switch
  | Graph_remove
  | Graph_validate
  | Graph_info
  | Graph_backup_list
  | Graph_backup_create
  | Graph_backup_restore
  | Graph_backup_remove
  | Graph_export
  | Graph_import
  | Server_list
  | Server_cleanup
  | Server_start
  | Server_stop
  | Server_restart
  | List_page
  | List_tag
  | List_property
  | List_task
  | List_node
  | List_asset
  | Search_block
  | Search_page
  | Search_property
  | Search_tag
  | Upsert_block
  | Upsert_page
  | Upsert_task
  | Upsert_asset
  | Upsert_tag
  | Upsert_property
  | Remove_block
  | Remove_page
  | Remove_tag
  | Remove_property
  | Query
  | Query_list
  | Show
  | Debug_pull
  | Doctor
  | Sync_status
  | Sync_start
  | Sync_stop
  | Sync_upload
  | Sync_download
  | Sync_asset_download
  | Sync_remote_graphs
  | Sync_ensure_keys
  | Sync_grant_access
  | Sync_config_get
  | Sync_config_set
  | Sync_config_unset
  | Login
  | Logout
  | Completion
  | Skill_show
  | Skill_install
  | Example
  | Agent_bridge

val to_string : t -> string
val to_path : t -> string list
val is_write : t -> bool
val requires_graph : t -> bool
val requires_auth : t -> bool
