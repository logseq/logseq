# Plugin support plan for the LUI / SwiftUI app

Research report. No code changes. Companion repo for cljs references: `logseq` master (`/Users/devin/repos/logseq`, tip `22a29b30`); this repo on branch `devin/lui-swift` (`/Users/devin/repos/logseq-swift`, tip `497c0ad1`).

## TL;DR

- **The web LUI build already runs real plugins.** `deps/ui/src/sdk/plugin_host.ml` (1406 lines) is a complete re-hosting of upstream `@logseq/libs`'s `LSPluginCore`: marketplace install → `plugins.logseq.io/r2` → iframe sandbox via the shipped `resources/js/lsplugin.core.js` / `lsplugin.user.js` bundles. Plugin JS is unmodified upstream code.
- **The Apple app has zero plugin infrastructure.** `deps/ui/apple/plugin_host.ml` is a 47-line stub (`api_methods = []`). There is no JS engine anywhere in `apple/Sources/Logseq` — the runtime is the `lui_ocaml_*` C bridge plus the native `deps/db-worker` daemon.
- **Recommended architecture: one shared WKWebView as the plugin host page** running real `lsplugin.core.js` + iframes (exactly the web model), bridged to Swift over `WKScriptMessageHandler`, with DB calls forwarded to the db-worker daemon's existing `/v1/invoke` endpoint. Not per-plugin webviews (memory), not `JSContext` (no DOM).
- **Empirically verified.** Downloaded 7 real marketplace plugins and surveyed their `logseq.*` usage; additionally stood up a bare host page with the real `lsplugin.core.js`/`lsplugin.user.js` and a minimal test plugin — postmate handshake, settings schema merge, and `DB.datascriptQuery` → host `api:call datascript_query` → reply all round-tripped.
- **Minimal viable milestone is bigger than "DB-only".** All 7 sampled real plugins use the main-ui shell (`showMainUI`/`provideModel`/`provideStyle`) + settings schema. A realistic M0 = WKWebView host + settings + `Editor`/`DB` reads + `showMainUI` (webview-backed floating surface).

---

## A. The cljs plugin system map

The plugin SDK lives in `libs/` at the repo root (not `src/libs/` — the task description's path is stale). It's published as `@logseq/libs` on npm and built into two bundles shipped in `resources/js/`:

- `resources/js/lsplugin.core.js` — host-side runtime, loaded by the app page (`resources/index.html:74`).
- `resources/js/lsplugin.user.js` — plugin-side SDK, injected into each plugin sandbox.

### File inventory

| File | Role |
|---|---|
| `libs/src/LSPlugin.core.ts` (1943 lines) | `LSPluginCore` + `PluginLocal`: registration, package.json normalization, settings persistence, main-ui containers, provider/theme/style/ui injection, `api:call` dispatch, marketplace listeners. `setupPluginCore()` sets `window.LSPluginCore` (LSPlugin.core.ts:1934-1941). |
| `libs/src/LSPlugin.caller.ts` (456) | `LSPluginCaller`: sandbox construction (Postmate iframe or shadow DOM), message plumbing, `callUserModel`, 8s handshake timeout (caller.ts:296). |
| `libs/src/LSPlugin.user.ts` (1178) | `LSPluginUser`: the `window.logseq` object inside the plugin. Proxies `logseq.App/.Commands/.Editor/.DB/.UI/.Utils/.Git/.Assets` via `_makeUserProxy` (user.ts:1002-1141); unknown methods become `api:call` host invocations. |
| `libs/src/LSPlugin.shadow.ts` | `LSPluginShadowFrame`: same-thread shadow-DOM sandbox (mode `"shadow"`), for plugins like bullet-threading that inject into the host DOM. |
| `libs/src/common.ts` | `invokeHostExportedApi` (common.ts:301) + `setupInjectedStyle`/`setupInjectedUI` (slot `data-injected-ui` elements, common.ts:~350-399). |
| `libs/src/postmate/` | Vendored Postmate fork (parent↔child `postMessage` RPC, MessageChannel fast path). |
| `libs/src/modules/LSPlugin.*` | User-side `FileStorage`, `Net`, `Experiments` modules. |
| `src/main/logseq/api.cljs` (246) | The complete exported host API (`window.logseq.api`): plugin (33 fns), app/graph (22), db (5), editor (45), ui (3), assets, experiments, http, search, cli group (~19 db-based fns). |
| `src/main/logseq/api/plugin.cljs` (418) | Plugin-manager-facing host fns: `load_plugin_config` (Electron-only), `load/save_plugin_user_settings`, `load/save_user_preferences`, dotdir JSON fns, command/ui-item/hook registration delegates, `get_caller_plugin_id` reads `window.$$callerPluginID`, `assert-storage-path!` blocks `..` escapes. |
| `src/main/frontend/handler/plugin.cljs` (1353) | Orchestrator: `init-plugins!` (:1203) sets up `LSPluginCore` + 12 `.on` listeners, then `register(initial)`. Hook routing `hook-plugin{,-app,-editor,-db}`, uuid-gated `block:<uuid>` db hooks, renderer registries (fenced-code, extensions-enhancers, route-renderers, daemon-renderers, hosted/block renderers), marketplace + dotdir JSON makers (electron fs vs web idb). |
| `src/main/frontend/components/plugins.cljs` (:1400-1901) | UI consumers: `hook-ui-slot`, `hook-block-slot`, `ui-item-renderer` (calls `LSPlugin.pluginHelpers.setupInjectedUI.call(pl, {slot, key, template})`), `hook-ui-items` (:toolbar/:pagebar + pinned + manager dropdown), plugins page, settings modal, custom-route/daemon renderers. |
| `src/electron/electron/plugin.cljs` (265) | GitHub zipball download/install; `lsp-updates` IPC channel. |
| `src/electron/electron/core.cljs:80-119` | `lsp://` + `assets://` `registerFileProtocol` handlers serving plugin files (`lsp://logseq.io/plugins/`, `lsp://logseq.com/plugins/`, `…/external/`). |
| `src/main/frontend/common/plugin.cljs` | Web install path: entry info from `plugins.logseq.io/r2/<repo>/<version>`, `emit-lsp-updates!` onto `window.apis`. |

### API surface, grouped

Plugin-visible namespaces (user-side proxies, `LSPlugin.user.ts`):

- **App**: `getInfo`, `getUserConfigs`, `registerCommandShortcut`, `registerCommandPalette`, `registerUIItem('toolbar'|'pagebar', …)`, `pushState`/`replaceState`/`popState`, `queryGraph`, `onRouteChanged`, `onThemeModeChanged`, `onCurrentGraphChanged`, `openExternalLink`, `invokeExternalCommand`, `getCurrentGraphFavorites`, state store get/set.
- **DB**: `datascriptQuery`, `q`/`customQuery`, `onBlockChanged(uuid, cb)` → registers `hook:db:block_<uuid>` (user.ts:660-688), `onChanged` (`db:changed`).
- **Editor**: `getBlock`, `getPage`, `getCurrentPage`, `getCurrentBlock`, `getPageBlocksTree`, `getAllPages`, `createPage`, `insertBlock`, `updateBlock`, `removeBlock`, `moveBlock`, `appendBlockInPage`, `upsertBlockProperty`, `getBlockProperty`, `openInRightSidebar`, `scrollToBlockInPage`, `registerSlashCommand`, `registerBlockContextMenuItem`, `registerHighlightContextMenuItem`, `restoreEditingCursor`, `exitEditingMode`, `selectBlock`, `editBlock`, … (~45 host fns in api/editor.cljs).
- **UI**: `showMsg`, `queryElementRect`, `queryElementById`, `showDatePicker`, `checkWorkerReady`, `setSunMoons`.
- **Host shell** (top-level `logseq.*`): `ready`, `useSettingsSchema`, `updateSettings`, `showSettingsUI`, `onSettingsChanged`, `provideModel`, `provideStyle`, `provideTheme`, `provideUI`, `showMainUI`/`hideMainUI`/`toggleMainUI`, `setMainUIAttrs`/`setMainUIInlineStyle`, `isMainUIVisible`, `baseInfo`, `settings`, `beforeunload`.
- **Modules**: `logseq.FileStorage` (per-plugin storage files), `logseq.Net` (http proxy → `exper_request` → ipc `:httpRequest`), `logseq.Experiments` (`ensureHostScope()` → `window.top` — direct host-window access for same-origin iframes; `logseq.api.*`, `logseq.sdk.utils`, `React`/`ReactDOM`, `pluginLocal`, `exper_*` fns).
- **Escape hatch**: plugins can also call `window.top.logseq.api.<snake_case>` directly (verified in downloaded bundles — several call `logseq.api.datascript_query`, `exper_register_fenced_code_renderer`, `get_state_from_store`).

Host-exported registry calls used by the plugin manager itself (subset of api/plugin.cljs): `load_user_preferences`, `save_user_preferences`, `load_plugin_user_settings`, `save_plugin_user_settings`, `update_plugin_user_settings`, `unlink_plugin_user_settings`, `load_plugin_config`, `save_plugin_package_json`, `register_plugin_ui_item(s)`, `unregister_plugin_ui_item`, `install_plugin_hook`, `uninstall_plugin_hook`, `register_plugin_simple_command`, `register_plugin_slash_command`, `register_plugin_global_keybinding_cmd`, `register_search_service`, `write_dotdir_file`, `read_dotdir_file`, `list_dotdir_files`, `exist_dotdir_file`, `unlink_dotdir_file`, `write_user_tmp_file`, `read/write/unlink/exist/list_plugin_storage_file`, `clear_plugin_storage_files`, `get_external_plugin`, `invoke_external_plugin_cmd`, `validate_external_plugins`, `__install_plugin`, `get_caller_plugin_id`, `should_exec_plugin_hook`, `get_app_info`, `check_current_is_db_graph`, `get_user_configs`, `show/hide/toggle_main_ui`, `set_main_ui_inline_style`, `set_main_ui_attrs`.

### Loading mechanism

1. `init-plugins!` → `init-ls-dotdir-root` (Electron ipc `getLogseqDotDirRoot`; web `LSPUserDotRoot/`) → `LSPlugin.setupPluginCore({localUserConfigRoot, dotConfigRoot})` → `register(plugins, initial=true)` → `hostMounted()` (handler/plugin.cljs:1203+; mirrored in deps/ui/src/sdk/plugin_host.ml:1325-1345).
2. `PluginLocal.load()`: `_preparePackageConfigs` — package.json via host api `load_plugin_config` (local) or the supplied `webPkg` object (web). `localRoot = <repo|url>/<version>` for web plugins (core.ts:714).
3. `_tryToNormalizeEntry` (core.ts:785-848): for `.js` entries, generates `<id>_index.html` via host api `write_user_tmp_file`/`write_dotdir_file`, injecting `lsplugin.user.js` (`/external/<sdkPathRoot>/` on Electron; `cdn.jsdelivr.net/npm/@logseq/libs` for web plugins). `.html` entries are used directly.
4. Entry URL resolution (`_resolveResourceFullUrl`, core.ts:624-655): web plugins → `https://pub-80f42b85b62c40219354a834fcf2bbfa.r2.dev/<repo>/<version>/<file>` (or `webPkg.installedFromUserWebUrl` override); installed dotdir plugins → `lsp://` scheme; external dev plugins → `lsp://…/external/`.
5. `LSPluginCaller.connectToChild` — Postmate iframe (`div.lsp-iframe-sandbox-container` on `document.body`) or same-thread shadow frame; `model.baseInfo = pl.toJSON()`; handshake timeout 8000ms.
6. Plugin calls `logseq.ready()` → `connectToParent` → host emits `LSPMSG_READY` (`#lspmsg#ready#`) with baseInfo incl. merged settings → `registered` event.

package.json `logseq` fields: `id`, `title`, `icon`, `entry`/`main`, `mode` (`"shadow"`|`"iframe"`), `theme`/`themes`, `effect`, `devEntry` (core.ts:211-227, 700-735). `effect: true` = needs Electron-only capabilities (fs/git); marketplace filters these out for web installs (`plugin_host.ml:295-299`: `web:true or not effect`).

### Event / IPC contract

- Transport: vendored Postmate over `postMessage`, upgraded to MessageChannel (`enableMessageChannel`, caller.ts:~285).
- Plugin → host events: `emit('#lspmsg#' + pid, {type, payload})` → `pluginLocal.emit(type, payload)` + `caller.emit` (caller.ts:~309-320).
- Plugin → host API: `api:call {method, args, _sync}` → `invokeHostExportedApi` (common.ts:301-332) resolves the snake_cased method on, in order: `window.logseq.api` → `window.logseq.sdk.<ns0>` → `window.apis` → `callables`. Caller identity set via `window.$$callerPluginID` (plugin.cljs `get-caller-plugin-id` reads it). Replies on `#lspmsg#reply#` keyed by the `_sync` tag.
- Host → plugin: `callUserModel` / `callUserModelAsync` with `#await#response#` prefix (caller.ts:12-20); user model extended by `provideModel`.
- Hook registration: `logseq.on<HookName>` → `hook:{ns}:{snake_type}` → host `install_plugin_hook`; host fires via `LSPluginCore.hook{App,Editor,Db}(type, payload, pid?)`; DB hooks are uuid-gated `hook:db:block_<uuid>` + broadcast `db:changed`.
- `window.apis` = EventEmitter3 (web) / Electron preload bridge (desktop) — carries `lsp-updates` marketplace install events.

### Plugin UI embedding

- Default: hidden Postmate iframe; `provideModel` exposes plugin-side `logseq.App` methods the host calls (e.g. `show`/`hide`), used with `main-ui:*` to display a floating draggable/resizable container (`window.frontend.modules.layout.core` helpers, core.ts:938-991).
- `provideUI`/`provideStyle`/`provideTheme` → host `provider:*` handlers → `setupInjectedUI` writes `data-injected-ui` DOM into slot selectors (`#<slot>` / `path` / float on body).
- `mode: "shadow"` mounts the plugin in a shadow root on the host DOM (same thread, no iframe) — used for DOM-modifying plugins.
- `registerUIItem('toolbar'|'pagebar')` → `register_plugin_ui_item` host api → rendered by `hook-ui-items`/`ui-item-renderer`.

---

## B. What exists in LUI land

### Web (`deps/ui/`)

Already a complete host — `deps/ui/src/sdk/plugin_host.ml` (1406 lines):

- `setup()` (1325-1345): `window.apis = EventEmitter3`, `LSPlugin.setupPluginCore({localUserConfigRoot: "LSPUserDotRoot/", dotConfigRoot: "LSPUserDotRoot/"})`, core listeners, `lsp-updates` listener, `boot_register()`, `host_mounted()`. `isWebPlatform` is true because `dotConfigRoot` starts with `LSPUserDotRoot` (core.ts:1805).
- Persistence in localStorage mirroring cljs idb paths: `LSPUserDotRoot/installed-plugins-for-web/all.json`, `LSPUserDotRoot/settings/<pid>.json`, `LSPUserDotRoot/preferences.json` (plugin_host.ml:39-56, 739-770).
- Marketplace: `plugins.json` fetch + web filter, `r2_entry_url`, `install_marketplace` emits `lsp-updates` completed → `register({key, url: repo, webPkg})` (plugin_host.ml:270-330).
- Registries: hooks, simple commands, slash commands, keybindings, themes, ui items; `fire_db_hooks` (Wire delta → `db:changed` + `block:<uuid>`) wired into `worker_events.ml:120`; `fire_route_changed`.
- `api_methods` (~60) in plugin_host.ml:1348+ — includes deliberate no-ops for `show_main_ui`/`hide_main_ui`/`set_main_ui_*` ("must still resolve — a missing method aborts the plugin's promise chain", :1399-1402).
- Consumers: `sdk_api.ml` installs `window.logseq.api` (~40 methods + these) and `window.logseq.sdk.ui`; `left_sidebar_view.ml:108-531` renders toolbar items + pinned; `popups_state.ml` dispatches slash commands; `dialogs/plugins_view.ml` is the plugins page.

**Web gaps**: main-ui surface is a no-op (plugins can't display their main window — e.g. agenda/heatmap/mark-map dashboards render nothing visible beyond their injected UI/toolbar buttons); `window.frontend.modules.layout.core` isn't present (draggable/resizable restore logs an error — observed live); injected `provideUI` slots are only the toolbar/pagebar equivalents; Electron-only APIs (fs, git, `lsp://` files, local dev plugins) absent by design.

### Apple (`apple/Sources/Logseq`, `deps/ui/apple/`)

- `deps/ui/apple/plugin_host.ml` — 47-line stub: `api_methods = []`, comment says the JS plugin runtime "does not exist on native".
- **No JS engine.** `apple/Sources/Logseq/LogseqRuntime.swift` (774 lines) hosts only the OCaml runtime via `lui_ocaml_start`/`pump`/`platform_event` (:20-41); UI is JSON patch batches → `LUIAppleBackend`. No `WKWebView`, `JSContext`, or `JavaScriptCore` import anywhere in `apple/`.
- Data path: spawned native `deps/db-worker/bin/main.exe` daemon; `deps/ui/apple/daemon_client.ml` does `POST /v1/invoke` (transit) + `/v1/events` long-poll; `worker_client.ml` dedups inflight reads.
- Extensibility precedent: `LUIAppleExtensionRegistry` (LogseqExtensions.swift:57-152) registers `logseq-<tag>` extensions (~60 tags incl. `"iframe"`) with a `viewFactory` → `AnyView(LogseqElementView)`; `NSViewRepresentable` pattern already used for PDFKit (LogseqPDF.swift:787) and LaTeX (LogseqLatex.swift:9). The `"iframe"` tag is registered but is a generic webview extension, not a plugin host.

---

## C. Feasibility for the Swift app

### Verified contract (live test)

Harness: real `resources/js/lsplugin.core.js` + `lsplugin.user.js` in a bare page, `window.apis = EventEmitter3`, `window.logseq.api` = stub object, plugin registered via `LSPluginCore.register({key, url, webPkg:{installedFromUserWebUrl: 'http://127.0.0.1:8999/plugin1', main:'index.html'}})`. Results:

- iframe loaded from `http://127.0.0.1:8999/plugin1/index.html?__v__=v1`; postmate upgraded to `MessagePort`.
- `logseq.ready()` resolved `baseInfo.id = test-plugin`, settings schema merged (`{greeting: "hi"}` from schema default).
- `logseq.DB.datascriptQuery(...)` arrived host-side as `datascript_query([query])` and the reply reached the plugin — the full api:call round-trip works with a ~40-line stub.
- `register_plugin_ui_item`, `show_main_ui`, `set_main_ui_inline_style`, `get_user_configs`, `load_plugin_user_settings`, `load_user_preferences` all called as predicted by the code read.
- Host globals required beyond `logseq.api`: `window.apis` (EventEmitter3), `window.frontend.modules.layout.core` (`move_container_to_top`, `setup_draggable_container_BANG_`, `setup_resizable_container_BANG_` — missing it only degrades main-ui restore), `window.__LSP__HOST__` marker for user-bundle mode selection.

### Architecture options

**JSContext / JavaScriptCore — rejected.** Plugin code expects a browser: `document`, `window`, DOM elements, postmate's `postMessage`+MessageChannel, per-plugin iframe pages. JSContext has no DOM at all; you'd have to fake a DOM and the entire postmate transport. Not viable.

**WKWebView per plugin — viable but wasteful.** Each WKWebView is a separate WebContent process (tens of MB baseline each, plus plugin JS heap; iOS jetsam limits make N processes risky). Only consider if isolation requirements change.

**Recommended: one shared "plugin host" WKWebView.** Recreate the web model verbatim inside one webview document:

- Host page HTML loaded from a bundled resource (or `about:blank` + injected scripts): `lsplugin.core.js`, `eventemitter3`, a `window.logseq.api` shim object, `window.apis`, `window.frontend.modules.layout.core` stubs, `window.__LSP__HOST__`.
- Every plugin = a Postmate iframe inside that one webview, served from one custom scheme (`lsp://plugins/<repo>/<version>/…` via `WKURLSchemeHandler`) or a loopback HTTP server. All iframes same-site → single WebContent process shared by all plugins. Total cost ≈ one webview, not N.
- Bridge: the host page's `window.logseq.api` methods forward to Swift via `window.webkit.messageHandlers.lsp.postMessage({method, args, sync})`; Swift replies with `evaluateJavaScript`. In the reverse direction, Swift pushes events (`db:changed`, `block:<uuid>`, `route:changed`, `settings-changed`) by evaluating `LSPluginCore.hookDb(...)` etc. in the webview.
- This buys 100% wire compatibility with real plugin JS for free — same bundles, same postmate, same sandbox DOM — while all native work stays in Swift/OCaml.
- Plugin visual output (`provideModel` + `main-ui:*`, `provideUI` templates, custom routes) also lives in that webview; surface it to the user either by embedding the host WKWebView in SwiftUI when a plugin calls `showMainUI` (a `logseq-iframe`-style extension/overlay), or — later — by projecting individual injected-UI DOM nodes into LUI slots.

**API bridge layering** (what the shim forwards where):

| API group | Target | Effort |
|---|---|---|
| `DB.q`, `DB.datascriptQuery`, `custom_query` | daemon `/v1/invoke` → `thread-api/q`, `query-custom`, `resolve-query-inputs` | cheap — read-only, already exposed |
| `Editor` reads: `getBlock`, `getPage`, `getPageBlocksTree`, `getAllPages` (`get-all-page-titles`), `getBlockParent/s`, `getBlockRefs`, `getBlockSibling`, `getBlockSource`, `getProperty*`, `getTagsByName` | daemon `thread-api/get-*`, `pull`, `pull-many`, `entity`, `datoms`, `get-page-blocks-tree`, `get-block-*` | cheap — mostly 1:1 |
| `Editor` writes: `insertBlock`, `updateBlock`, `removeBlock`, `moveBlock`, `appendBlockInPage`, `upsertBlockProperty`, `createPage` | daemon `thread-api/transact` / `apply-outliner-ops` / `api-build-upsert-nodes-edn` | medium — cljs api layer wraps these in editor-handler UI state (selection/caret/scroll); on Swift you transact directly and skip UI side-effects |
| Settings (`useSettingsSchema`, `load/save_plugin_user_settings`, `updateSettings`) | host page JS + Swift persistence (file under `~/.logseq/settings/` or UserDefaults) | cheap — pure JSON |
| Plugin storage (`*_plugin_storage_file`, dotdir fns) | Swift file I/O under a plugins dotdir | cheap |
| Commands (`register_plugin_simple_command`, slash, palette, keybindings) | registry in host page; dispatch needs LUI command palette / slash popup surfaces | medium — needs UI consumers on LUI |
| `App.registerUIItem` toolbar/pagebar | host registry + LUI toolbar slot | medium — LUI has a toolbar surface via extension registry |
| `main-ui:*` + `provideModel` | host webview shown as overlay | medium — "free" once the host webview can be shown |
| `provideUI`/`provideStyle`/`provideTheme`, injected slots | DOM-only by design | hard — requires webview-hosted slot regions or DOM→LUI projection |
| `onRouteChanged`, `Editor.getCurrentPage`, selection/edit-caret APIs | LUI app state | medium — needs new daemon or platform-request endpoints for route/selection state |
| `DB.onBlockChanged`, `onChanged` | daemon `/v1/events` stream → host `hookDb` | cheap-medium — event bridge exists |
| `search`, `Git`, `Assets`, `FileStorage`, `Net`/`http`, `Experiments`, `fenced-code/daemon renderers` | various / Electron-only | hard — mostly out of scope; fenced-code renderers need per-block slot webviews |
| `getUserConfigs`, `check_current_is_db_graph`, `get_app_info` | host shim constants/LUI config | trivial |

Note `datascriptQuery` with *function* inputs calls `window.top.logseq.api.datascript_query` directly (`Experiments.ensureHostScope()` = `window.top`, Experiments.ts:274-280; user.ts:695-699) — same-origin required. Keeping plugin iframes same-site inside the shared webview preserves this escape hatch; serving each plugin from a distinct origin would break it (and `sdk.experiments`/`React` access).

### Marketplace/distribution

- Manifest: `raw.githubusercontent.com/logseq/marketplace/master/plugins.json` (614 packages today; ~312 marked web-compatible, ~306 `effect:true` Electron-only, ~70 themes).
- Web install flow (what to replicate): fetch `plugins.logseq.io/r2/<repo>/<version>` for webPkg → files at `https://pub-80f42b85b62c40219354a834fcf2bbfa.r2.dev/<repo>/<version>/<file>`.
- For Apple, simplest is identical: register `{key, url: repo, webPkg}` and let LSPluginCore fetch plugin files from the R2 CDN — no local mirroring needed initially. Local-dev plugins (`externals` preference + `load_plugin_config`) need a local file story (WKURLSchemeHandler over an app-sandbox `plugins/` dir) — Phase 3 material.

### Sampled real-plugin API usage (downloaded from R2)

All 7 sampled plugins (`agenda`, `todo`, `tabs`, `heatmap`, `mark-map`, `journals-calendar`, `bullet-threading`) are `main: index.html` iframe plugins. Usage counts (grep over bundled JS):

- Universal: `useSettingsSchema`/`settings`/`onSettingsChanged` (7/7), main-ui shell `showMainUI`/`hideMainUI`/`provideModel`/`setMainUIInlineStyle`/`isMainUIVisible` (6-7/7), `App.registerUIItem`/`pushState`/`getUserConfigs` (6/7), `ready`/`baseInfo`.
- Common: `Editor.getBlock/getPage/getCurrentPage/getPageBlocksTree`, `Editor.updateBlock/insertBlock/removeBlock/upsertBlockProperty`, `Editor.openInRightSidebar/scrollToBlockInPage`, `App.onRouteChanged/onThemeModeChanged/onCurrentGraphChanged`, `UI.showMsg`, `DB.q`/`DB.datascriptQuery` (2-3/7), `App.registerCommandPalette/registerCommandShortcut`, `Editor.registerSlashCommand`/`registerBlockContextMenuItem`.
- Escape-hatch calls observed in bundles: `logseq.api.datascript_query`, `exper_register_fenced_code_renderer`, `exper_register_extensions_enhancer`, `get_state_from_store`, plus `logseq.sdk.experiments`/`utils` via `ensureHostScope`.

Implication: **no popular plugin is DB-only.** The minimal demo-able set is settings + main-ui shell + Editor reads + `DB.q/datascriptQuery` + `registerUIItem`. Editor writes unlock todo-list-style plugins; provideUI/renderer slots are the long tail.

---

## D. Phased plan (effort in agent-sessions)

| Phase | Scope | Est. |
|---|---|---|
| **P0 — host webview skeleton** | Add WKWebView host page (bundled `lsplugin.core.js`/`lsplugin.user.js`/`eventemitter3`), `window.logseq.api` JS shim → `WKScriptMessageHandler` → Swift dispatcher, `evaluateJavaScript` reply path, `__LSP__HOST__`/`window.apis`/`layout.core` stubs. Prove handshake + `ready()` with one test plugin (the harness from this report, minus the web server). | 2-3 sessions |
| **P1 — DB/query milestone** | Forward `datascript_query`, `q`, `custom_query`, `get_user_configs`, `get_app_info`, `check_current_is_db_graph`, `get_block`, `get_page`, `get_page_blocks_tree`, `get_all_pages`(+ family above) to daemon `/v1/invoke` with transit encode/decode parity with `daemon_client.ml`. Settings persist (load/save_plugin_user_settings, user_preferences) to a per-graph dotdir. `register`/`boot_register` persisted plugin list. Demo: a hand-written plugin that reads the graph end-to-end inside the app. | 3-4 sessions |
| **P2 — main-ui + toolbar + write ops** | Show the host webview as a SwiftUI overlay when `show_main_ui` (drive `setMainUIInlineStyle`/attrs → frame rect); `provideModel` already works (postmate). Toolbar/pagebar `ui-items` surfaced in LUI (new extension tag or toolbar slot). Editor writes → `transact`/`apply-outliner-ops`/`api-build-upsert-nodes-edn` (subset: insert/update/remove/append/upsertBlockProperty/createPage). `onRouteChanged`/`getCurrentPage` via platform-request state push. Slash commands + simple command palette hooks. | 4-6 sessions |
| **P3 — install UX + events** | Plugins dialog (port `plugins_view.ml` consumption to native), marketplace fetch + R2 install flow, enable/disable/reload, `db:changed`/`block:<uuid>` hooks from `/v1/events`, `beforeunload`/unload, update checks. | 3-5 sessions |
| **P4 — deep UI integration** | `provideUI` slot projection (webview regions anchored to LUI elements, or `logseq-*` extension tags that embed the host webview), `provideStyle`/`provideTheme` scoping, fenced-code/daemon renderers (per-block iframe views), `FileStorage`/`Net`, custom routes. | 5-8 sessions, open-ended |

M0 (demoable, no UI): end of P1 — plugins that only read/query the DB work, e.g. a plugin computing stats via `datascriptQuery`. M1 (real plugins visibly work): end of P2 — agenda/todo/heatmap class plugins show their main-ui window.

---

## E. Risks

1. **DOM/style injection on a non-DOM UI.** `provideUI`, `provideStyle`, injected slots, shadow-mode plugins, and fenced-code renderers are DOM primitives. On LUI there is no host DOM to inject into. The shared-webview design contains this — plugin DOM stays inside the webview — but plugins whose entire value is mutating the host page (bullet-threading class, `mode:"shadow"`) can never work verbatim; they need a DOM→LUI projection layer or a per-slot webview embed. Expect a compatibility ceiling.
2. **Security model is thin by upstream design.** Same-origin iframe plugins get `window.top` → full `logseq.api`, `React`, `LSPluginCore`, `logseq.sdk.experiments` (Experiments.ts:274-280). The cljs app already runs plugin JS with effectively full app trust (Electron plugins even get fs/git when `effect`). On Swift the additional risk is the *bridge surface*: `WKScriptMessageHandler` is the privilege boundary — whitelist the method names a plugin may invoke (the `logseq.api` set), never expose raw daemon `invoke` or arbitrary file paths, and keep `assert-storage-path!`-style `..` checks (api/plugin.cljs). Plugin code is remote GitHub release code; the marketplace JSON is the only gate.
3. **Version compat.** Plugins bundle their own `lsplugin.user.js`/SDK version and call snake_case host methods; the contract is the `window.logseq.api` name table, which drifts across releases (new methods, db-only args). Pin the bundled `lsplugin.core.js` to the libs version deps/ui ships, and expect a compat matrix (old plugins calling removed methods resolve to `not found` — plugins degrade noisily but recoverably). `effect:true` and Electron-fs plugins are permanently unsupported — filter by marketplace `web`/`effect` flags as deps/ui does.
4. **Memory/process.** One WebContent process shared by all plugin iframes — bounded, but heavy plugins (mark-map ships ~600KB JS + KaTeX; agenda ~4MB bundle) pile into one heap. A crashy plugin can take down the whole plugin host webview; WKWebView auto-reloads content processes, so design `boot_register` to re-run after `webViewWebContentProcessDidTerminate`.
5. **Event fidelity.** `db:changed` + `block:<uuid>` hooks fire per tx on the cljs web worker via tx-report deltas; the daemon `/v1/events` stream must carry equivalent delta payloads (deps/ui's `fire_db_hooks` proves the web side has the data — verify the same events flow on the native daemon channel before promising hook parity).
6. **UI-state APIs have no backend yet.** Route, selection, edit-caret, sidebar (`openInRightSidebar`, `scrollToBlockInPage`, `getCurrentPage`…) are cljs `frontend.state` reads/mutations. On Swift they need either new daemon endpoints or platform-request push — scope risk for P2.
7. **Maintenance surface.** `plugin_host.ml` already re-implements ~60 api fns + registries on web; a Swift host duplicates the same table in JS-shim + Swift dispatcher form. Two non-cljs hosts to keep in sync with upstream `api.cljs` additions.
