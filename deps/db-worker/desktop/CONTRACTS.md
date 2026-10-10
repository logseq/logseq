# Cross-module contracts

Each ported module exposes the public API of its cljs source under
these OCaml names. When you call another group's module, use these
names; do not create stubs — call the contract and let integration
link it.

cljs `electron.utils` → `Electron_utils` (`desktop/electron_utils.ml`)
- vals: `mac : bool`, `win32 : bool`, `linux : bool`, `prod : bool`,
  `dev : bool`, `main_window : Electron_bindings.Browser_window.t option ref`
- `open_external : string -> string Js_dict.t option -> unit Js.Promise.t`
- `fetch : string -> 'a Js.t option -> Js.Json.t Js.Promise.t`
- `fix_win_path : string -> string`, `to_native_win_path : string -> string`
- `get_ls_dotdir_root : unit -> string`,
  `get_ls_default_plugins : unit -> string array`
- `set_proxy`, `restore_proxy_settings`, `save_proxy_settings`,
  `get_system_proxy`, `set_electron_proxy` (promise-returning)
- `read_file_raw : string -> string Js.Promise.t`,
  `read_file : string -> string Js.Promise.t`
- `get_focused_window : unit -> Browser_window.t Js.Null.t`
- `send_to_window : Browser_window.t -> string -> 'a array -> unit`
  (cljs `send-to-renderer` — sends an ipc channel + args)
- `get_graph_dir`, `decode_protected_assets_schema_path`,
  `safe_decode_uri_component`, `fs_stat_to_js`

cljs `electron.state` → `Electron_state` (DONE — reference impl)
- `main_window : Browser_window.t option ref`,
  `window_graph : (int, string) Hashtbl.t`,
  `window_graph_path`, `set_window_graph`, `close_window`,
  `once_graph_ready : (unit -> unit) option ref`, platform bools

cljs `electron.configs` → `Electron_configs`
- `graph_registry_path`, `set_item`, `get_item`, `get_config`,
  `semantic_search_enabled`, `read_graph_registry`,
  `write_graph_registry`, `upsert_graph_registry_entry`

cljs `electron.logger` → `Electron_logger` (DONE)
- `debug/info/warn/error : ('a, unit, string, unit) format4 -> ...`
  plus `debug_args/info_args/warn_args/error_args : 'a array -> unit`

cljs `electron.exceptions` → `Electron_exceptions`
- `setup_exception_listeners : unit -> unit`

cljs `electron.url` → `Electron_url`
- `decode : string -> string`,
  `get_url_decoded_params : string -> Js.Json.t`,
  `graph_identifier_from_url`, `local_url_handler`,
  `x_callback_url_handler`, `logseq_url_handler`

cljs `electron.shell` → `Electron_shell`
- `run_command : string -> string array -> js promise`, `commands : …`

cljs `electron.i18n` → `Electron_i18n`
- `update_locale : string -> unit`, `t : string -> 'a array -> string`
  (tongue `build-translate` ported as `Tongue` module; dicts loaded
  from `dicts/*.edn` at runtime — see agent prompt for the copy step)

cljs `electron.window` → `Electron_window`
- `main_window_entry : string`,
  `create_main_window : 'a Js.t option -> Browser_window.t Js.Promise.t`,
  `get_all_windows`, `destroy_window`, `close_handler`, `on #(chan)`,
  `switch_to_window`, `get_graph_all_windows`, `graph_has_other_window`,
  `setup_window`

cljs `electron.lifecycle` → `Electron_lifecycle` — `quit`-related fns

cljs `electron.server` (fastify API server) → `Electron_server`
- `get_host`, `get_port`, `load_state_to_renderer`, `set_config`,
  `close`, `start`, `do_server`, `setup`

cljs `electron.db` → `Electron_db`
- backup/export/sync fns per source

cljs `electron.db-worker` → `Electron_db_worker`
- `prepare_startup`, `ensure_worker`, `release_window`,
  `release_running`, `stop_all`, `stop_all_managers`, `init_state`,
  `create_manager`, `start_manager`, `stop_manager`

cljs `electron.handler`/`handler-interface` → `Electron_handler`
- `set_ipc_handler : unit -> unit` (registers every ipcMain handler)

cljs `electron.core` → `Electron_main` (entry: `main : unit -> unit`,
  `start : unit -> unit`, `stop : unit -> unit` for dev reload)

cljs `logseq.cli.server` → `Cli_server` (orchestrator)
- `resolve_root_dir`, `resolve_storage`, `graphs_dir`,
  `ensure_server`, `stop_server`, `list_servers`, `discover_servers`,
  `cleanup_revision_mismatched_servers`, `list_graph_items`,
  `db_worker_script_path`, `db_worker_binary_path`,
  `db_worker_dev_script_path`, `db_worker_runtime_script_path` —
  with the native-binary logic: `binary` is Some only for owner
  electron on non-win32, `daemon_env` passes
  LOGSEQ_BUILD_REVISION/LOGSEQ_BUILD_TIME always.

`logseq.db-worker.daemon`/`server-list`/`graph-backup` → reuse
`Db_worker_daemon`, `Server_list`, `Graph_backup`/`Sqlite_backup`
from `deps/db-worker/lib` when present; port missing pieces as
`cli_*`/shared modules.
