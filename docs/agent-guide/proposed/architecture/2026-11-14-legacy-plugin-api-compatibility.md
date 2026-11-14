# Legacy Plugin API Compatibility on QuickJS

## Problem

Installing QuickJS does not make the existing plugin SDK portable. Logseq needs
one plugin implementation and one public API contract across Web, macOS, and
future mobile, without a WebView. It must distinguish APIs that are implemented
now from APIs whose semantics could be preserved with additional work.

This is a source audit and next-scope decision, not a claim of legacy plugin
compatibility. No marketplace plugin bundle was executed for this audit.

Source baseline: `logseq/logseq` commit
`2f8fbacc324e7b3fb6bf6d67e128cb3649e20adf`, SDK package version `0.3.4`.
The native bridge is [PR #14011](https://github.com/logseq/logseq/pull/14011).
The approved architecture is [PR #14010](https://github.com/logseq/logseq/pull/14010).
Mobile and LUI sources remain read-only.

## Proposal

Preserve the names, arguments, result shapes, asynchronous completion and event
semantics of portable legacy APIs, rather than inventing a competing Editor/DB
API. Supply a separate DOM-free SDK entry and a closed typed OCaml broker.
Unsupported operations must fail explicitly, not return empty data or success.

The compatibility target is **source-level API compatibility after SDK replacement
and rebundling**, not unchanged execution of existing iframe bundles. The same
rebuilt plugin artifact should eventually execute on native QuickJS and Web
QuickJS/WASM. Neither that dual-engine result nor mobile integration is proven
by the current native-only PR.

Keep the bridge PR focused. Prepare the SDK/application integration as a separate
proposal and branch; do not silently widen its original no-SDK/no-Host scope.

## What the current PR actually exposes

The import-free ESM module exports `run(host)`. Its only callable host API is:

```javascript
const context = await host.getEditingContext(); // {blockUuid, text}
```

The return value is an array of closed actions:

```javascript
return [
  {kind: "insertText", text: "example"},
  {kind: "exitEditing"}
];
```

`{kind: "showDatePicker"}` is the other supported terminal action. Insertions may
precede one terminal action; arbitrary command strings are not accepted.

These actions are validated and encoded as configured output. They are **not
executed in the live application**. The runtime does not install `logseq`, expose
DB queries, register commands, provide settings, or replace the existing Web
iframe host. Failed, stale or cancelled calls retire the runtime/session; a host
must create a fresh instance and reload before another command. Successful calls
can reuse module state.

Sources: `deps/ui/src/contracts/plugin_protocol.mli:1-35`,
`deps/ui/src/shared/plugin_configured.ml:1-6`,
`deps/ui/quickjs/quickjs_runtime.mli:1-13`.

## Compatibility matrix

All legacy API rows below are **not exposed by the new QuickJS runtime yet**.
The last column is a proposed compatibility direction, not implementation status.

| Surface and examples | Compatibility direction | Required work or boundary |
| --- | --- | --- |
| `ready`, `baseInfo`, `connected`, `beforeunload` | Preserve public lifecycle intent | Replace `window`/Postmate bootstrap. Model initialization separately from editor command invocations. Define unload deadlines and cleanup. |
| `Editor.getBlock`, `getPage`, `getCurrentBlock`, `getCurrentPage`, tree/sibling/property/tag reads | Preserve API and data semantics | Typed identities, graph-scoped reads, real entity DTOs, currentness checks and reply budgets. `{blockUuid,text}` is not a `BlockEntity`. |
| `Editor.checkEditing`, `getEditingBlockContent`, selected-block reads | Preserve logical editing semantics | Capture authoritative application editor/selection state, not DOM textareas. Keep null/boolean/string distinctions. |
| `Editor.getEditingCursorPosition`, `restoreEditingCursor`, `onInputSelectionEnd` | Preserve only with an explicit cross-backend contract | Logical selection and platform layout coordinates must be separated. Do not promise DOM selection/range behavior. |
| `Editor.insertAtEditingCursor`, `exitEditingMode`, selection/focus/scroll/sidebar operations | Preserve portable operations | Execute through application-owned editor/configured services. Await the same logical completion point as the existing API; do not resolve merely because an action was queued. |
| `Editor.insertBlock`, `insertBatchBlock`, `updateBlock`, `removeBlock`, page/property/tag mutations | Preserve on the matching graph model | Typed worker operations, graph write permission, context fencing and acknowledged refresh. Existing file-graph assumptions are not automatically DB-graph semantics. |
| `Editor.registerSlashCommand`, block/highlight context menus; `Commands.register`, `App.registerCommandPalette`, command shortcuts/page menus | Preserve callable/data-oriented registrations | Typed registration records, host-owned callback handles, unregister/unload cleanup and shared LUI command dispatch. Legacy action arrays need a reviewed closed action vocabulary. |
| `Commands.execute`, `App.invokeExternalCommand` | Preserve a reviewed command catalog | Validate known commands and argument schemas. Never forward arbitrary UI method names or use command strings as source execution. |
| `DB.datascriptQuery` | Included in the approved read slice | Typed JSON inputs/results and captured-graph authorization require `Graph_read` + `Db_query`. Evaluator budgets and true cancellation are explicitly deferred; a QuickJS timeout does not interrupt database evaluation. |
| `DB.q`, `customQuery` | Deferred | Separate Datalog/DSL/custom-query contracts; not aliases or empty-result fallbacks. |
| `DB.onChanged`, `onBlockChanged` | Preserve data event contracts | Serialize transactions, preserve required ordering and metadata, add subscription handles/backpressure, remove on unload and reject stale graph deliveries. |
| `App.onCurrentGraphChanged`, route/theme/journal/command/sidebar hooks | Preserve data-only events | Define payloads and graph/session lifetimes; route callbacks onto the owner execution lane. Not a generic event-name tunnel. |
| `useSettingsSchema`, `settings`, `updateSettings`, `onSettingsChanged`, settings UI | Preserve data/schema operations; render native UI declaratively | Per-plugin persistence, schema validation, typed change events and LUI form mapping. HTML/CSS embedded in labels/descriptions is not portable UI. |
| `App.getInfo`, `getUserConfigs`, graph metadata/configs/templates/favorites/recent | Mostly preserve reviewed data fields | Do not expose credentials or private host objects. A real OS graph path is not a portable mobile capability; do not invent an empty path to satisfy its type. |
| `App.pushState`, `replaceState`, sidebar visibility | Preserve reviewed navigation intent | Map known routes and semantic UI actions to LUI/application state. Native route and screen presentation require explicit adapters. |
| `UI.showMsg`, `closeMsg` | Preserve text/status/key behavior | Typed toast service and LUI rendering. Arbitrary HTML content requires migration. |
| `Assets.makeSandboxStorage`, `FileStorage` | Preserve scoped key/value operations | Per-plugin storage namespace, quotas, normalized keys and traversal protection. No arbitrary filesystem access. |
| `Assets.makeUrl`, `resolveResourceFullUrl`, `Assets.builtInOpen`, `Editor.openPDFViewer` | Preserve resource intent with portable resource references | Resource URLs are opaque and platform-dependent; browser `file://`, DOM embedding and absolute OS paths are not a cross-platform contract. |
| `Assets.listFilesOfCurrentGraph` | Capability-dependent | Graph storage may not be a user-visible directory, especially for DB graphs/mobile. Requires a defined asset listing capability, not a fake empty list. |
| `Net.request/get/head/post/put/patch/delete` | Preserve portable HTTP behavior with a new transport | Network permissions, cancellation, bytes/text/JSON encoding, retry/cache policy and limits. Rebuild `AbortSignal`, codecs and timers outside the engine as needed. |
| `App.registerSearchService` | Preserve data-only search contribution intent | Typed request/result/callback protocols and resource limits; not a generic JS object crossing the broker. |
| `App.invokeExternalPlugin`, `getExternalPlugin`, `provideModel` | Requires a separate explicit inter-plugin contract | Do not expose another runtime's live object/functions. Use authorized data messages and registered callback identities; do not accept source strings. |
| `App.getStateFromStore`, `setStateFromStore` | Do not preserve arbitrary store access | Exposes implementation-owned paths/state. Replace concrete use cases with semantic typed APIs, not a generic OCaml model mutation escape hatch. |
| `DB.getFileContent`, `setFileContent`, `Git.*`, `App.execGitCommand` | Not universally portable | File-graph source files, Git/process execution and mobile sandbox access are separate capabilities. A DB graph does not acquire Markdown source files through a compatibility shim. |
| `App.relaunch`, `quit`, `setFullScreen`, `setZoomFactor` | Platform/capability-dependent | Mobile and Web lifecycle/window policies differ. Return a defined unsupported result where the capability does not exist. |
| `provideUI`, `provideStyle`, `provideTheme`, main-UI attrs/styles/visibility, `App.registerUIItem` HTML templates | UI migration required | Replace HTML/CSS and iframe UI with typed LUI contributions. Do not implement a fake DOM or WebView fallback. Semantic theme tokens may become a separate typed API. |
| `UI.queryElementRect`, `queryElementById`, `resolveThemeCssPropsVals`; DOM-slot consumers | Not preserved as DOM APIs | Selectors, DOM rectangles and CSS variables are not a SwiftUI/Compose contract. Use logical contribution handles and typed layout/theme information where genuinely required. |
| Renderer-slot hooks and `Experiments` React/ReactDOM/renderers/loadScripts | UI migration or unsupported | Data events can be redesigned, but DOM slot IDs, React elements and arbitrary loaded scripts cannot be passed to LUI. Do not count registration no-ops as renderer support. |
| `Utils.toJs`, direct `.caller`, underscored hook installation and dynamic undocumented proxy methods | Review individually; internal transport is not portable API | Plain-data conversion can be retained where meaningful. Never export the old generic caller, arbitrary method lookup or internal hook management as an escape hatch. |

The important distinction is not simply DOM versus non-DOM. Process execution,
raw graph files, private state access, inter-plugin object sharing and unbounded
queries also require migration, authorization, or an unsupported capability.

## Why the existing SDK cannot be loaded unchanged

1. `libs/src/LSPlugin.user.ts:802-855` connects `ready()` through the parent;
   lines 1175-1178 install `window.logseq`. The caller imports Postmate and creates
   DOM elements (`libs/src/LSPlugin.caller.ts:2,71,268-283`).
2. `libs/package.json` points `main` at `dist/lsplugin.user.js`; building the
   current package again does not select a new DOM-free transport automatically.
3. QuickJS supplies ECMAScript, not browser or Node host APIs. `setTimeout`,
   `fetch`, `TextEncoder`, `TextDecoder`, `AbortController`, `URL`, console and
   secure randomness must be audited and supplied deliberately where needed.
   For example, `LSPlugin.Net.ts:77-130` already depends on timers/codecs/base64
   helpers, independently of plugin DOM/CSS usage.
4. The current bridge accepts one import-free ESM module with `run`; an existing
   self-starting iframe bundle with `logseq.ready(main)` has a different lifecycle.
   A new SDK packaging/initialization contract is required, not a simple rename.

Pure ECMAScript libraries can be bundled into the single module. Browser/Node
libraries and native addons cannot be assumed compatible merely because their
UI does not use CSS. This audit makes no compatibility percentage estimate.

## Existing OCaml work that can be reused

- `deps/ui/src/sdk/sdk_api.ml:28-127` already maps many logical SDK methods to
  OCaml readers/writers/UI operations. Its installer uses `Js.Json` and the old
  plugin host; do not import it directly into the portable broker.
- `sdk_read.ml:8-15,43-53,412-424` shows why full entity reads and current editor
  state are distinct from the new bridge's small editing snapshot.
- `sdk_ui.ml:271-297` reads the editing buffer and mutates editor state before
  scheduling save. A replacement Promise must not silently change that API into
  an unexecuted action buffer; durable DB writes need their own completion rules.
- `sdk_read.ml:312-350` resolves query inputs and invokes `thread-api/q`;
  `deps/db-worker/lib/endpoint_db.ml:19-88` evaluates Datalog synchronously in its
  query path. No per-plugin evaluator cancellation/budget is evident in that
  endpoint. Returning a timeout to JS alone is not proof that a query stopped.
- `deps/ui/native/worker_client.ml:1-5,117-135` already uses the daemon transport.
  The missing native plugin integration is `native/plugin_host.ml:1-59`, which
  currently reports plugin operations unavailable. The daemon itself is not
  missing just because the new plugin runtime is not wired to it.
- `native/dune:215-219` copies existing SDK modules, and lines 270 onward define
  the native application library. Native membership is explicit; a new
  application module cannot be assumed available without a copy/build rule.

Several Web SDK methods are placeholders: `sdk_api.ml:164-190` returns an empty
asset listing and successful no-op experimental registrations. Their presence
is not a valid compatibility oracle. Preserve real public behavior, not fake
success, and compare against the canonical API implementation where necessary.

## Recommended next slice and scope gate

Start with a **DOM-free SDK bootstrap and a bounded read compatibility slice**:

- Public lifecycle: `ready`/`baseInfo` initialization and unload cleanup.
- Editor reads: `checkEditing`, `getEditingBlockContent`, `getCurrentBlock`,
  `getCurrentPage`, `getBlock`, `getPage`. Preserve existing identities/options,
  entity shapes and null behavior; explicitly scope any unsupported option.
- Define `Graph_read` separately from the current editor-context capability.
  Recheck captured graph/editor ownership after asynchronous completion.
- The user authorized `DB.datascriptQuery` with typed input/output limits and
  explicitly deferred evaluator budgets and true cancellation. Keep `DB.q`,
  `customQuery`, subscriptions, graph writes,
  arbitrary files, Git, networking and plugin UI outside this initial slice.
- Make a single SDK artifact/typed contract the portability target. Before
  claiming Web parity, execute the same artifact through a real WASM adapter;
  compiling portable OCaml modules alone is not that evidence.

The next implementation proposal must explicitly list changes in:

1. `libs/src/` and the SDK package/build entry for DOM-free bundling. Keep the
   current iframe entry usable during migration; do not accidentally load it
   inside QuickJS.
2. `plugin_protocol`, `plugin_broker` and the QuickJS host surface for closed
   request/reply schemas, initialization and registration ownership.
3. Application-owned OCaml SDK/editor/worker adapters that supply actual reads.
   Keep application state, worker routing names, credentials and daemon URLs on
   the host side. The shared broker continues to depend only on typed services.
4. Any native application startup/plugin-host wiring needed for actual app use.
   A driver-only proof must still be labelled driver-only, not app compatibility.
5. Every proposed Dune/module-membership change and any required dependency pin.
   The first PR's two-file exception is not general approval for new build edits.

The old no-SDK/no-Host restriction still applies until expanded scope is
approved. Mobile and Swift/Kotlin host modifications are not requested here.
No implementation of this follow-up has started.

## Declared API inventory

The audited TypeScript file declares 146 members across eight proxy interfaces,
plus 34 `ILSPluginUser` members. These are **declaration counts, not counts of
implemented operations**: they include properties, internal methods and `ready`
overloads. `IEditorProxy` also extends `Record<string, any>`; undocumented dynamic
methods are not a proposed compatibility promise.

- `App` (52): `getInfo`, `getUserInfo`, `getUserConfigs`, `registerSearchService`,
  `registerCommand`, `registerCommandPalette`, `registerCommandShortcut`,
  `invokeExternalCommand`, `invokeExternalPlugin`, `getExternalPlugin`,
  `getStateFromStore`, `setStateFromStore`, `relaunch`, `quit`, `openExternalLink`,
  `execGitCommand`, `getCurrentGraph`, `checkCurrentIsDbGraph`,
  `getCurrentGraphConfigs`, `setCurrentGraphConfigs`, `getCurrentGraphFavorites`,
  `getCurrentGraphRecent`, `getCurrentGraphTemplates`, `pushState`, `replaceState`,
  `getCurrentRoute`, `getTemplate`, `existTemplate`, `createTemplate`,
  `removeTemplate`, `insertTemplate`, `setZoomFactor`, `setFullScreen`,
  `setLeftSidebarVisible`, `setRightSidebarVisible`, `clearRightSidebarBlocks`,
  `registerUIItem`, `registerPageMenuItem`, `onCurrentGraphChanged`,
  `onGraphAfterIndexed`, `onThemeModeChanged`, `onThemeChanged`,
  `onTodayJournalCreated`, `onBeforeCommandInvoked`, `onAfterCommandInvoked`,
  `onBlockRendererSlotted`, `onMacroRendererSlotted`, `onPageHeadActionsSlotted`,
  `onRouteChanged`, `onSidebarVisibleChanged`, `_installPluginHook`,
  `_uninstallPluginHook`.
- `Commands` (2): `register`, `execute`.
- `Editor` (71): `registerSlashCommand`, `registerBlockContextMenuItem`,
  `registerHighlightContextMenuItem`, `checkEditing`, `insertAtEditingCursor`,
  `restoreEditingCursor`, `exitEditingMode`, `getEditingCursorPosition`,
  `getEditingBlockContent`, `getCurrentPage`, `getTodayPage`, `getCurrentBlock`,
  `getSelectedBlocks`, `clearSelectedBlocks`, `getCurrentPageBlocksTree`,
  `getPageBlocksTree`, `getPageLinkedReferences`, `getPagesFromNamespace`,
  `getPagesTreeFromNamespace`, `newBlockUUID`, `isPageBlock`, `insertBlock`,
  `insertBatchBlock`, `updateBlock`, `removeBlock`, `getBlock`, `setBlockCollapsed`,
  `getPage`, `createPage`, `createJournalPage`, `deletePage`,
  `deleteRecycledPagePermanently`, `restorePage`, `renamePage`, `getAllPages`,
  `getAllTags`, `getAllProperties`, `getTagObjects`, `createTag`, `getTag`,
  `getTagsByName`, `addTagProperty`, `removeTagProperty`, `addTagExtends`,
  `removeTagExtends`, `addBlockTag`, `removeBlockTag`, `setBlockIcon`,
  `removeBlockIcon`, `addPropertyValueChoices`, `setPropertyNodeTags`,
  `prependBlockInPage`, `appendBlockInPage`, `getPreviousSiblingBlock`,
  `getNextSiblingBlock`, `moveBlock`, `editBlock`, `selectBlock`,
  `saveFocusedCodeEditorContent`, `getProperty`, `upsertProperty`,
  `removeProperty`, `upsertBlockProperty`, `removeBlockProperty`,
  `getBlockProperty`, `getBlockProperties`, `getPageProperties`,
  `scrollToBlockInPage`, `openInRightSidebar`, `openPDFViewer`,
  `onInputSelectionEnd`.
- `DB` (7): `q`, `customQuery`, `datascriptQuery`, `onChanged`, `onBlockChanged`,
  `setFileContent`, `getFileContent`.
- `Git` (3): `execCommand`, `loadIgnoreFile`, `saveIgnoreFile`.
- `UI` (6): `showMsg`, `closeMsg`, `queryElementRect`, `queryElementById`,
  `checkSlotValid`, `resolveThemeCssPropsVals`.
- Declared `Utils` proxy (1): `toJs`.
- `Assets` (4): `listFilesOfCurrentGraph`, `makeSandboxStorage`, `makeUrl`,
  `builtInOpen`.
- Root `ILSPluginUser` (34 declarations): `connected`, `caller`, `baseInfo`,
  `settings`, `ready` (three overloads), `beforeunload`, `provideModel`,
  `provideTheme`, `provideStyle`, `provideUI`, `useSettingsSchema`,
  `updateSettings`, `onSettingsChanged`, `showSettingsUI`, `hideSettingsUI`,
  `setMainUIAttrs`, `setMainUIInlineStyle`, `showMainUI`, `hideMainUI`,
  `toggleMainUI`, `isMainUIVisible`, `resolveResourceFullUrl`, `App`, `Commands`,
  `Editor`, `DB`, `Git`, `UI`, `Assets`, `Net`, `FileStorage`, `Experiments`.

Additional modules were reviewed separately, not added to those declaration
counts: `LSPlugin.Storage.ts` defines six `IAsyncStorage` operations;
`LSPlugin.Net.ts` implements requests, response objects, retry/cache and abort
handling; `LSPlugin.Experiments.ts` includes React/ReactDOM/components, script
loading and renderer registration APIs. Inherited EventEmitter methods also
need a deliberate DOM-free lifecycle implementation, not a host transport leak.

Primary declaration references:

- [App and Commands](https://github.com/logseq/logseq/blob/2f8fbacc324e7b3fb6bf6d67e128cb3649e20adf/libs/src/LSPlugin.ts#L404-L640)
- [Editor](https://github.com/logseq/logseq/blob/2f8fbacc324e7b3fb6bf6d67e128cb3649e20adf/libs/src/LSPlugin.ts#L642-L956)
- [DB, Git, UI, Utils and Assets](https://github.com/logseq/logseq/blob/2f8fbacc324e7b3fb6bf6d67e128cb3649e20adf/libs/src/LSPlugin.ts#L958-L1089)
- [Root SDK](https://github.com/logseq/logseq/blob/2f8fbacc324e7b3fb6bf6d67e128cb3649e20adf/libs/src/LSPlugin.ts#L1106-L1269)

## Alternatives considered

### Promise that every non-DOM API works unchanged

Rejected as a compatibility claim: Git, private state, file-graph source APIs,
browser globals, inter-plugin objects and unsafe queries are counterexamples.

### Rename all APIs around the new bridge snapshot/actions

Not preferred. It needlessly rewrites portable plugin business logic and makes
an incomplete snapshot look like the old entity contract. Keep the bridge as an
internal transport, not a replacement public SDK vocabulary.

### Forward the old generic method/arguments RPC directly to the app

Not preferred. It bypasses the closed broker's authorization, validation,
resource and ownership boundaries. The SDK may keep familiar public names while
encoding each supported operation into a reviewed typed request.

### Load existing bundles through a WebView or fake DOM

Rejected by the architecture decision and user constraint. It does not establish
LUI UI parity or a uniform mobile plugin contract.

## Acceptance criteria

- Publish a precise supported-method/option table for each SDK slice; a method
  merely existing, returning empty data or returning success is insufficient.
- Run a real bundled DOM-free SDK through QuickJS against the real broker;
  verify entity shapes, nulls, ordering and lifecycle at public API boundaries.
- Use real application/worker services before calling the result app-compatible.
  Keep driver-only and Web/WASM/native/mobile evidence clearly separated.
- Preserve read-after-write semantics when writes are eventually enabled;
  distinguish editor buffer changes, queued saves and durable worker changes.
- Reject unsupported/private methods and undeclared capabilities explicitly.
- Demonstrate stale graph cancellation and unload cleanup without allowing old
  requests, callbacks or microtasks into replacement instances.
- Do not expose arbitrary Wire values, generic host method lookup, daemon
  credentials, filesystem/process access or executable UI source strings.

## Risks

- Arbitrary Datalog can consume worker CPU beyond the QuickJS budget. Query
  exposure needs an actual evaluator-level bound or an explicitly reviewed
  isolation/permission policy, not just a Promise timeout.
- Existing Web SDK placeholders can make a name-only compatibility test pass.
- Source compatibility still requires a new SDK build target/packaging contract.
- Mobile storage, lifecycle, keyboards and graph paths differ even without DOM.
- The conservative aborted-instance reload policy must be reflected in SDK
  ownership and future subscription semantics; it is not transparent resume.

## Review outcome

The user approved expanding the next concrete proposal on 2026-11-14
to the DOM-free SDK and application-owned OCaml service wiring. Start with the
read-only Editor slice and review the DB query budget/cancellation contract.
This approves the proposal's scope, not an implementation file list.
Mobile and Swift/Kotlin hosts stay read-only; Dune changes still require
separate explicit approval. The next concrete implementation proposal remains
a review gate before code.

### Subsequent approval

The concrete SDK/read-service proposal, its two Dune edits and DB query capability
were approved. The user later deferred evaluator budgets and actual query
cancellation. This authorizes the existing graph-scoped query path, not a claim
of evaluator isolation, CPU bounding or interruption. See the SDK integration
decision for the delivered API subset and validation boundary.

## Decision

Adopt this compatibility matrix as the migration boundary, not a claim that all
listed APIs have been implemented. Implement the separately approved SDK read
slice first, including the explicitly authorized typed DB query path.

## Consequences

API-only plugins can retain supported business logic after rebundling; DOM,
CSS, Node and unsupported services still require migration or later capabilities.
Keep mobile read-only and do not infer Web/WASM execution from portable builds.
