# Plugins system gap — cljs master vs LUI

Audit of the plugin runtime: what `master` (cljs, `src/main/frontend/components/plugins.cljs`,
`src/main/frontend/handler/plugin.cljs`, `src/main/frontend/modules/instrumentation/*`,
`libs/src/LSPlugin.*`) exposes vs what the LUI rewrite (`deps/ui/src/sdk/`, host shim in
`deps/ui/src/sdk/plugin_host.ml`, public surface in `deps/ui/src/sdk/sdk_api.ml`) supports.

Status legend: **done** = implemented in LUI, **partial** = exists with reduced fidelity,
**no** = not implemented, **blocked** = needs the cljs plugin host or a renderer that does
not exist in LUI.

## 1. Host protocol / bootstrap

| Capability | cljs | LUI | Notes |
|---|---|---|---|
| `LSPluginCore` sandbox + `setupPluginCore` | done | done | `plugin_host.setup ()` installs `window.apis` EE3, calls `setupPluginCore`, `core_listeners`, `boot_register`, `host_mounted` |
| `invokeHostExportedApi(method,…)` resolution (`window.logseq.api` → `window.apis` → `window.logseq.sdk.*`) | done | done | every entry must exist; a missing method throws `Not existed method #X` and aborts the plugin's promise chain |
| `hostMounted()` deferred | done | done | resolves the provideUI/ready handshake |
| `frontend.modules.layout.core` shim (`move_container_to_top`, `setup_draggable_container_BANG_`, `setup_resizable_container_BANG_` via `window.interact`) | done | done | `plugin_host.setup_layout_core`; `interact.min.js` is already loaded by `resources/index.html` |
| Plugin register/unregister listeners (`registered`, `unregistered`, `error`, …) | done | done | `core_listeners` + `on_lsp_update` |
| Plugin install/uninstall persistence (`installed` dict, web-plugin JSON store) | done | done | `store_key`/`prefs_key` localStorage |
| `clear_plugin_resources` (items, settings, pinned toolbar state) | done | done | strips `pid:*` keys from `pinnedToolbarItems` |

## 2. `window.logseq.api` (host methods)

64 host methods in `plugin_host.api_methods` + ~135 public `window.logseq.api` /
`logseq.sdk.*` entries installed by `sdk_api.install ()` (editor, db, ui, utils, assets,
experiments, debug namespaces + `logseq.sdk.core.version`).

| Group | cljs | LUI | Notes |
|---|---|---|---|
| Editor api (`insert_block`, `update_block`, `get_current_block`, `edit_block`, `insert_at_editing_cursor`, cursor save/restore, selection ops, …) | done | done | via `sdk_api` editor methods + `ls:editor-command` event bridge |
| DB api (`q`, `datascript_query`, `custom_query`, `get_page*`, `get_block*`, tags/properties, `upsert_*`, `rename_page`, `delete_page`, …) | done | done | backed by the OCaml datascript worker |
| App/api plumbing (`get_app_info`, `get_current_graph*`, `push_state`/`replace_state`, `invoke_external_command`, `check_editing`, `set_state_from_store`, `get_state_from_store`) | done | done | `get_state_from_store` reads localStorage; `invoke_external_command` routes through the cmdk dispatch (`plugin.<pid>/<key>` + builtin ids) |
| UI api (`query_element_rect`, `query_element_by_id`, `check_slot_valid`, `resolve_theme_css_props_vals`, `set_left/right_sidebar_visible`, `set_theme_mode`, `show_msg`/`close_msg`) | done | done | `check_slot_valid` via `get_element_by_id`; `resolve_theme_css_props_vals` reads `getComputedStyle(document.body)` |
| Assets (`make_url`, `list_files_of_current_graph`, `built_in_open`) | done | partial | `make_url` → `asset://`-prefixed last path segment; `list_files` returns `[]` (no FS walk on web); `built_in_open` opens the PDF viewer |
| Plugin management (`__install_plugin`, `unlink_installed_web_plugin`, `load_plugin_user_settings`/`update_plugin_user_settings`, `load/save_user_preferences`, dotdir + plugin-storage file ops) | done | done | file ops are localStorage-backed (`lsp-files`/`settings` stores), matching the web cljs build |
| Experiments (`exper_load_scripts`, `exper_request`, `http_request_abort`, `register_*` enhancer/renderer no-ops) | done | partial | `exper_request` is a real `fetch` + `AbortController` registry calling back `#lsp#request#callback`; renderer registration fns are intentional no-ops |
| Misc (`write_user_tmp_file`, `write_assetsdir_file`, `relaunch`, `quit`, `relaunch`…) | done | partial | `relaunch`/`quit`/`write_assetsdir_file` are no-ops — desktop/electron semantics have no web counterpart |
| `invoke_external_command` prefix/keyword handling (`logseq.` prefix strip, kebab-case keyword) | done | done | matches `api/app.cljs` |
| `invoke_external_plugin_cmd` | done | done | fires the target plugin's `onExternalCommand` hook |

## 3. Plugin manifest / loader

| Capability | cljs | LUI | Notes |
|---|---|---|---|
| `package.json` load + `logseq.api` entry (`load_plugin_config`, `save_plugin_package_json`) | done | done | |
| `load_installed_web_plugins` / `save_installed_web_plugin` | done | done | |
| `register_plugin_ui_item(s)` → `provideUI` items | done | done | stored in `items`, injected by `inject_ui` |
| `register_plugin_simple_command` (`$commands$`/`$palette$`/ctx-menu types) | done | done | `simple_cmd` records keep `sc_type` |
| `register_plugin_slash_command` | done | done | slash-menu tags via `slash_cmd_tags` |
| `register_plugin_global_keybinding_cmd` | done | done | keybinding registry shim |
| `register_plugin_hook`/`install_plugin_hook`/`uninstall_plugin_hook` | done | done | per-pid hook tables |
| `should_exec_plugin_hook` | done | done | respects enabled state |
| `load_plugin_readme`, theme manifest loading | done | done | feeds the themes tab |
| Security model: iframe sandbox isolation per plugin | done | **blocked** | LUI runs plugin JS through the same `LSPluginCore` host contract, but the strict per-plugin iframe sandbox of the cljs build is not recreated — plugins share the page origin |
| Plugin loading from local FS/electron `~/.logseq/plugins` | done | **no** | web build loads web plugins only, same as cljs web |

## 4. UI injection points

| Slot | cljs | LUI | Notes |
|---|---|---|---|
| `toolbar` (`hook-ui-items :toolbar`, plugins-manager dropdown items) | done | done | `.pl-injected-ui-item-*` divs + `setupInjectedUI` per mount; pin state in `pinnedToolbarItems` |
| `pagebar` (`hook-ui-items :pagebar`) | done | done | `page_plugin_slots` next to `title_actions` |
| `page-head-actions` slot (`hook-ui-slot` → `page-head-actions-slotted`) | done | done | fixed slot id `lsp-page-head-actions`, `page-head-actions-slotted {type:"slotted", slot, payload:{page}}` fired once per page mount |
| `block-context-menu-item` simple commands | done | done | appended to the block ctx menu; dispatched via `plugin-ctx:` commands → `exec_simple_command ~ctx:{uuid}` |
| `page-menu-item` simple commands | done | done | appended to `page_items`; ctx `{page}` |
| `$commands$` simple commands | done | done | cmdk dispatch + `before/after-command-invoked` hooks |
| `$palette$` commands | done | done | `exec_palette_command` splits `plugin.<pid>/<key>` |
| `ui:visible:changed` hook on item transitions | done | done | tracked by `ui_visible_last` |
| `left-sidebar` ui items | done | partial | container renders; slot injection identical to toolbar |
| `slot:<uuid>`/`onBlockRendererSlotted` block-level slots | done | **blocked** | needs a per-block render hook inside the LUI block renderer — no block-level mount boundary exists yet |
| `macro-renderer-slotted` / `{{renderer}}` macro host | done | **blocked** | needs the renderer-macro evaluation pipeline |
| `highlight-context-menu-item` (PDF annotation ctx menu) | done | **blocked** | the PDF annotation area in LUI does not run the pdf-highlights ctx menu yet |
| Custom themes + `reset-custom-theme` listener | done | done | `apply_theme_mode`/`reset_custom_theme`; themes tab via `Plugin_host.pending_dialog_tab` |

## 5. Event hooks (`on`/app hooks fired by the host)

| Hook | cljs | LUI | Notes |
|---|---|---|---|
| `before-command-invoked:<cmd>` / `after-command-invoked:<cmd>` | done | done | fired around `run_with_lifecycle` in cmdk dispatch |
| `current-graph-changed {}` | done | done | fired on `Boot_graph_ready`/`Graph_closed` via `Subs_state.app_hooks.plugin_event` |
| `theme-mode-changed {mode}` | done | done | `fire_theme_mode_changed` on effective theme change (skipped on first apply, matching cljs) |
| `sidebar-visible-changed {visible}` | done | done | fired from `Toggle_left_sidebar`/`Toggle_right_sidebar` |
| `route-changed {path}` | done | done | `fire_route_changed` on route updates |
| `today-journal-created` | done | done | fired when the journal-day command lands on today |
| `block:edit`, `block:save`, db tx hooks | done | partial | `fire_db_hooks` covers the save path; per-block edit hook granularity is reduced |
| `page-head-actions-slotted`, `macro-renderer-slotted`, `onBlockRendererSlotted` | done | partial | page-head variant done; block/macro variants blocked (see §4) |
| `ui:visible:changed` | done | done | |
| `beforeload`/`ready` UI affordances | done | **no** | the plugin iframe ready-handshake UI is not recreated |

## 6. Settings / routes

| Capability | cljs | LUI | Notes |
|---|---|---|---|
| `set_focused_settings(pid)` → plugins dialog preselect | done | done | `open_settings_pid` + `ls:open-dialog` |
| `show_themes` → plugins dialog themes tab | done | done | `pending_dialog_tab` consumed by `plugins_view` |
| Plugin settings schema → generated settings form | done | partial | schema fields render; the full cljs settings UI (per-field editors, validation affordances) is reduced |
| `register_route_renderer` custom routes | done | no-op | registration is a no-op; route rendering blocked on renderer infra |
| Settings persistence (`load/update_plugin_user_settings`, dotdir files) | done | done | |

## What remains blocked, and why

- **Per-plugin iframe sandbox**: the cljs host isolates each plugin in its own iframe with
  a `postMessage` protocol. Recreating that in LUI needs the sandboxed iframe container and
  the full LSPlugin proxy layer; feasible later, not a stub-away.
- **Block-level slots (`onBlockRendererSlotted`, `slot:<uuid>`, `macro-renderer-slotted`,
  `{{renderer}}`)**: need a mount boundary inside the LUI block renderer where a slot div
  can be created and the hook fired per block. The renderer path is not componentized for
  that yet.
- **Fenced-code/block/daemon/hosted renderers**: `register_*_renderer` fns are no-ops —
  the render targets (fenced code eval, route renderers, daemon renderers) don't exist in
  the LUI web build.
- **`highlight-context-menu-item`**: the pdf-highlights context menu does not exist on the
  LUI pdf viewer yet.
- **`list_files_of_current_graph`**: returns `[]`; the web build has no graph-FS listing.
- **`relaunch`/`quit`/`write_assetsdir_file`**: electron/desktop semantics, no web target.
- **`beforeload`/`ready` chrome**: not recreated; plugins observe `hostMounted` only.

## Verification

- `cd deps/ui && OPAMSWITCH=5.5.0 opam exec -- dune build @all` — green (web + native + gpui targets; the native/gpui twin modules get no-op stubs).
- `node deps/ui/_build/default/test/ui_test/test/test_main.js` — 1546 checks, 0 failures.
