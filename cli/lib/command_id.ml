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

let path segments = Vec.of_array segments

let table =
  Vec.of_array
    [|
      (Version, "version", Vec.empty);
      (Graph_list, "graph-list", path [| "graph"; "list" |]);
      (Graph_create, "graph-create", path [| "graph"; "create" |]);
      (Graph_switch, "graph-switch", path [| "graph"; "switch" |]);
      (Graph_remove, "graph-remove", path [| "graph"; "remove" |]);
      (Graph_validate, "graph-validate", path [| "graph"; "validate" |]);
      (Graph_info, "graph-info", path [| "graph"; "info" |]);
      ( Graph_backup_list,
        "graph-backup-list",
        path [| "graph"; "backup"; "list" |] );
      ( Graph_backup_create,
        "graph-backup-create",
        path [| "graph"; "backup"; "create" |] );
      ( Graph_backup_restore,
        "graph-backup-restore",
        path [| "graph"; "backup"; "restore" |] );
      ( Graph_backup_remove,
        "graph-backup-remove",
        path [| "graph"; "backup"; "remove" |] );
      (Graph_export, "graph-export", path [| "graph"; "export" |]);
      (Graph_import, "graph-import", path [| "graph"; "import" |]);
      (Server_list, "server-list", path [| "server"; "list" |]);
      (Server_cleanup, "server-cleanup", path [| "server"; "cleanup" |]);
      (Server_start, "server-start", path [| "server"; "start" |]);
      (Server_stop, "server-stop", path [| "server"; "stop" |]);
      (Server_restart, "server-restart", path [| "server"; "restart" |]);
      (List_page, "list-page", path [| "list"; "page" |]);
      (List_tag, "list-tag", path [| "list"; "tag" |]);
      (List_property, "list-property", path [| "list"; "property" |]);
      (List_task, "list-task", path [| "list"; "task" |]);
      (List_node, "list-node", path [| "list"; "node" |]);
      (List_asset, "list-asset", path [| "list"; "asset" |]);
      (Search_block, "search-block", path [| "search"; "block" |]);
      (Search_page, "search-page", path [| "search"; "page" |]);
      (Search_property, "search-property", path [| "search"; "property" |]);
      (Search_tag, "search-tag", path [| "search"; "tag" |]);
      (Upsert_block, "upsert-block", path [| "upsert"; "block" |]);
      (Upsert_page, "upsert-page", path [| "upsert"; "page" |]);
      (Upsert_task, "upsert-task", path [| "upsert"; "task" |]);
      (Upsert_asset, "upsert-asset", path [| "upsert"; "asset" |]);
      (Upsert_tag, "upsert-tag", path [| "upsert"; "tag" |]);
      (Upsert_property, "upsert-property", path [| "upsert"; "property" |]);
      (Remove_block, "remove-block", path [| "remove"; "block" |]);
      (Remove_page, "remove-page", path [| "remove"; "page" |]);
      (Remove_tag, "remove-tag", path [| "remove"; "tag" |]);
      (Remove_property, "remove-property", path [| "remove"; "property" |]);
      (Query, "query", path [| "query" |]);
      (Query_list, "query-list", path [| "query"; "list" |]);
      (Show, "show", path [| "show" |]);
      (Debug_pull, "debug-pull", path [| "debug"; "pull" |]);
      (Doctor, "doctor", path [| "doctor" |]);
      (Sync_status, "sync-status", path [| "sync"; "status" |]);
      (Sync_start, "sync-start", path [| "sync"; "start" |]);
      (Sync_stop, "sync-stop", path [| "sync"; "stop" |]);
      (Sync_upload, "sync-upload", path [| "sync"; "upload" |]);
      (Sync_download, "sync-download", path [| "sync"; "download" |]);
      ( Sync_asset_download,
        "sync-asset-download",
        path [| "sync"; "asset"; "download" |] );
      ( Sync_remote_graphs,
        "sync-remote-graphs",
        path [| "sync"; "remote-graphs" |] );
      (Sync_ensure_keys, "sync-ensure-keys", path [| "sync"; "ensure-keys" |]);
      (Sync_grant_access, "sync-grant-access", path [| "sync"; "grant-access" |]);
      (Sync_config_get, "sync-config-get", path [| "sync"; "config"; "get" |]);
      (Sync_config_set, "sync-config-set", path [| "sync"; "config"; "set" |]);
      ( Sync_config_unset,
        "sync-config-unset",
        path [| "sync"; "config"; "unset" |] );
      (Login, "login", path [| "login" |]);
      (Logout, "logout", path [| "logout" |]);
      (Completion, "completion", path [| "completion" |]);
      (Skill_show, "skill-show", path [| "skill"; "show" |]);
      (Skill_install, "skill-install", path [| "skill"; "install" |]);
      (Example, "example", path [| "example" |]);
      (Agent_bridge, "agent-bridge", path [| "agent"; "bridge" |]);
    |]

let to_string t =
  let _, s, _ = Vec.find (fun (id, _, _) -> id = t) table in
  s

let to_path t =
  let _, _, p = Vec.find (fun (id, _, _) -> id = t) table in
  p

let is_write = function
  | Graph_create | Graph_switch | Graph_remove | Graph_import | Upsert_block
  | Upsert_page | Upsert_task | Upsert_asset | Upsert_tag | Upsert_property
  | Remove_block | Remove_page | Remove_tag | Remove_property | Sync_start
  | Sync_stop | Sync_upload | Sync_download | Sync_asset_download
  | Sync_ensure_keys | Sync_grant_access | Sync_config_set | Sync_config_unset
  | Login | Logout | Skill_install ->
      true
  | _ -> false

let requires_graph = function
  | Version | Graph_list | Server_list | Server_cleanup | Completion | Login
  | Logout | Skill_show | Skill_install | Example | Sync_remote_graphs ->
      false
  | _ -> true

let requires_auth = function
  | Sync_status | Sync_start | Sync_stop | Sync_upload | Sync_download
  | Sync_asset_download | Sync_remote_graphs | Sync_ensure_keys
  | Sync_grant_access | Sync_config_get | Sync_config_set | Sync_config_unset ->
      true
  | _ -> false
