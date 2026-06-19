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

let table =
  [
    (Version, "version", []);
    (Graph_list, "graph-list", [ "graph"; "list" ]);
    (Graph_create, "graph-create", [ "graph"; "create" ]);
    (Graph_switch, "graph-switch", [ "graph"; "switch" ]);
    (Graph_remove, "graph-remove", [ "graph"; "remove" ]);
    (Graph_validate, "graph-validate", [ "graph"; "validate" ]);
    (Graph_info, "graph-info", [ "graph"; "info" ]);
    (Graph_backup_list, "graph-backup-list", [ "graph"; "backup"; "list" ]);
    (Graph_backup_create, "graph-backup-create", [ "graph"; "backup"; "create" ]);
    ( Graph_backup_restore,
      "graph-backup-restore",
      [ "graph"; "backup"; "restore" ] );
    (Graph_backup_remove, "graph-backup-remove", [ "graph"; "backup"; "remove" ]);
    (Graph_export, "graph-export", [ "graph"; "export" ]);
    (Graph_import, "graph-import", [ "graph"; "import" ]);
    (Server_list, "server-list", [ "server"; "list" ]);
    (Server_cleanup, "server-cleanup", [ "server"; "cleanup" ]);
    (Server_start, "server-start", [ "server"; "start" ]);
    (Server_stop, "server-stop", [ "server"; "stop" ]);
    (Server_restart, "server-restart", [ "server"; "restart" ]);
    (List_page, "list-page", [ "list"; "page" ]);
    (List_tag, "list-tag", [ "list"; "tag" ]);
    (List_property, "list-property", [ "list"; "property" ]);
    (List_task, "list-task", [ "list"; "task" ]);
    (List_node, "list-node", [ "list"; "node" ]);
    (List_asset, "list-asset", [ "list"; "asset" ]);
    (Search_block, "search-block", [ "search"; "block" ]);
    (Search_page, "search-page", [ "search"; "page" ]);
    (Search_property, "search-property", [ "search"; "property" ]);
    (Search_tag, "search-tag", [ "search"; "tag" ]);
    (Upsert_block, "upsert-block", [ "upsert"; "block" ]);
    (Upsert_page, "upsert-page", [ "upsert"; "page" ]);
    (Upsert_task, "upsert-task", [ "upsert"; "task" ]);
    (Upsert_asset, "upsert-asset", [ "upsert"; "asset" ]);
    (Upsert_tag, "upsert-tag", [ "upsert"; "tag" ]);
    (Upsert_property, "upsert-property", [ "upsert"; "property" ]);
    (Remove_block, "remove-block", [ "remove"; "block" ]);
    (Remove_page, "remove-page", [ "remove"; "page" ]);
    (Remove_tag, "remove-tag", [ "remove"; "tag" ]);
    (Remove_property, "remove-property", [ "remove"; "property" ]);
    (Query, "query", [ "query" ]);
    (Query_list, "query-list", [ "query"; "list" ]);
    (Show, "show", [ "show" ]);
    (Debug_pull, "debug-pull", [ "debug"; "pull" ]);
    (Doctor, "doctor", [ "doctor" ]);
    (Sync_status, "sync-status", [ "sync"; "status" ]);
    (Sync_start, "sync-start", [ "sync"; "start" ]);
    (Sync_stop, "sync-stop", [ "sync"; "stop" ]);
    (Sync_upload, "sync-upload", [ "sync"; "upload" ]);
    (Sync_download, "sync-download", [ "sync"; "download" ]);
    (Sync_asset_download, "sync-asset-download", [ "sync"; "asset"; "download" ]);
    (Sync_remote_graphs, "sync-remote-graphs", [ "sync"; "remote-graphs" ]);
    (Sync_ensure_keys, "sync-ensure-keys", [ "sync"; "ensure-keys" ]);
    (Sync_grant_access, "sync-grant-access", [ "sync"; "grant-access" ]);
    (Sync_config_get, "sync-config-get", [ "sync"; "config"; "get" ]);
    (Sync_config_set, "sync-config-set", [ "sync"; "config"; "set" ]);
    (Sync_config_unset, "sync-config-unset", [ "sync"; "config"; "unset" ]);
    (Login, "login", [ "login" ]);
    (Logout, "logout", [ "logout" ]);
    (Completion, "completion", [ "completion" ]);
    (Skill_show, "skill-show", [ "skill"; "show" ]);
    (Skill_install, "skill-install", [ "skill"; "install" ]);
    (Example, "example", [ "example" ]);
    (Agent_bridge, "agent-bridge", [ "agent"; "bridge" ]);
  ]

let to_string t =
  let _, s, _ = List.find (fun (id, _, _) -> id = t) table in
  s

let to_path t =
  let _, _, p = List.find (fun (id, _, _) -> id = t) table in
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
