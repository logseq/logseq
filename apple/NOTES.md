# Swift macOS app — build notes & problems hit along the way

Running log of blockers, version skews, and design decisions for the
`devin/lui-swift` work (native macOS SwiftUI app reusing the OCaml
view/model stack via the LUI Apple backend).

## Decisions

- **Reuse path**: the whole deps/ui OCaml view+model layer compiles
  natively inside the app (`deps/ui/apple/` native lib); the LUI element
  tree renders through `LUIAppleBackend` (SwiftUI). Chosen explicitly by
  Tienson over pure-SwiftUI views ("要最大可能的复用 view, model").
- **deps/ui is not JS-free**: 54 modules carry real `external` decls
  (~790 bindings), ~110 files touch `Js.*` APIs. Port strategy:
  - `js_shim.ml` — native `Js`/`Promise`/`Webapi` replacements
    (Js.Json as a concrete variant, Promise = settle-queue task).
  - `copy_files` of the ~98 truly portable modules.
  - Native twins for the JS-bound modules: real ports for
    transport/platform/state code, stubs for DOM-effect modules.
- **Worker transport**: the in-process `logseq_db_worker` libs have no
  `public_name` (can't be installed cross-project), and deps/db-worker
  AGENTS forbids dune edits — so the app talks to the daemon
  (`deps/db-worker/bin/main.exe`) over the same HTTP+SSE protocol the
  Electron renderer uses (`Daemon_client` twin).
- **Transit codec**: db-worker ships `runtime/native/transit_json.ml`, a
  cache-corrected fork of melange-transit-native. The UI twin copies it
  verbatim — upstream's version has read/write cache desync bugs and
  would corrupt frames against the fixed daemon codec.

## Problems hit

### opam switch env leakage (recurring)
- `eval $(opam env --switch=X)` sets PATH but not `OPAMSWITCH`/`OCAMLPATH`;
  `opam list`/`opam var lib` still resolve the ambient switch. The ambient
  shell also has `.opam/default/bin` on PATH, so a bare `dune` resolves
  packages from the *default* switch.
- Fix: `eval $(opam env --switch=5.5.0)` for builds;
  `OPAMSWITCH=5.5.0 opam ...` for opam commands; inspect
  `~/.opam/<sw>/lib/` directly to verify what's installed.

### Missing packages in the 5.5.0 switch
- `dune build bin/main.exe` (deps/db-worker) initially failed: the switch
  had mldoc/melange but no eio/httpun/tls/rrbvec. Installed the whole
  native dep set; `rrbvec` needed an explicit pin
  (`git+https://github.com/logseq/rrbvec.git#main`, not on the opam repo).

### datascript-ocaml / persistent-sorted-set version skew
- The installed `datascript-ocaml-native` pin was at `e439cba` (stale);
  db-worker code expects `#main` (`Datascript.Util.uuid_canonicalize`,
  array-typed `stored_node` children).
- But pset `#main` (`695223e`, "upsert modified stored nodes in place")
  added a `?address` labeled arg to `store_node` *after* datascript's
  last commit — `datascript_ocaml#main` does not compile against pset
  `#main`.
- Fix: pinned `persistent_sorted_set_ocaml` at `7393117` (the commit
  before `?address`) + `datascript_ocaml`/`datascript-ocaml-native` at
  `#main` → consistent pair, `bin/main.exe` builds clean. Upstream skew
  to flag for Tienson: datascript-ocaml needs a follow-up for pset's new
  `store_node` signature.

### Daemon lifecycle contract (discovered, not documented)
- `main.exe` requires `--root-dir` and `--repo`; binds port 0 (random).
- The actual port is published two ways: `Graph_lifecycle.publish`
  writes lease state under `<lifecycleDir>/<encoded-graph>/`, and
  `Server_list.append_entry` adds `{pid, port}` to
  `<root>/server-list` (JSON array, lock file `server-list.lock`).
- Log line on stderr: `db-worker-node-ready host=… port=…`.
- No stdout port banner — clients must poll server-list or the lease.
- `--owner-source` accepts `cli|electron|unknown`.

### deps/ui porting surface (scoping findings)
- `View.view = Chrome.shell` — the root view pulls the whole app:
  143 modules, 52 with externals. It's effectively all-or-nothing, so
  the milestone approach is "compile everything, stub DOM effects".
- `logseq_dom.ml` is fully portable — the entire UI is built on
  `logseq-<tag>` LUI extension components. But its `schema_of` registers
  them only for `{WebOS; WebHost}` — must register the macOS/SwiftUI
  profile too (small edit, upstreamable).
- Only `version.ml` and `sdk/markdown.ml` use melange-only syntax
  (`##`, `[%mel.raw`) outside the external files — everything else is
  plain OCaml once `Js` exists.
- `core/transit.ml` is "portable" (no externals) but references
  `Transit_melange` directly — needed a twin anyway (melange packages
  don't build native).
- deps/db-worker and cli AGENTS forbid dune-file edits — the native
  port must live entirely inside `deps/ui/apple/` + `apple/`.

### SwiftPM local-package identity collision
- Root package dir `apple/` collided with the local dep dir basename
  `apple` (lui/platform/apple): SwiftPM reported
  `product 'LUIAppleBackendStatic' not found` in BOTH directions.
- Fix: `build.sh` creates a `lui-apple-backend` symlink inside
  `_build/apple/` and `Package.swift` resolves
  `.package(path: LOGSEQ_LUI_PACKAGE_PATH)` +
  `.product(name:, package: "lui-apple-backend")`. Local package
  identity comes from the path basename — keep them distinct.

### Graph lifecycle admission (owner side)
- Daemon spawn fails `graph-not-exists` unless the graph is first
  admitted: `<graphs_dir>/<encoded>` must exist AND
  `<lifecycle_dir>/<encoded>/state.json` must say
  `{generation, phase:"available", workers:[], owner}`.
- `daemon_client.ensure_graph_created` now mirrors
  `deps/graph-lifecycle/index.cjs`'s `createGraph` before spawning
  (sha256-keyed `.graph-lifecycle` dir, `logseq_db_`-stripped +
  `~XX`-encoded graph dir name, uuid generation).
- Extra spawn args the JS lifecycle passes (`--lifecycle-dir`,
  `--admission-ticket`, `--graph-generation`) are NOT required — the
  daemon admits fine without them.

### `--create-empty-db` is for sync-downloaded graphs only
- The flag sets `sync-download-graph?: true` in the daemon's own
  create-or-open-db call, which SKIPS `Sqlite_create_graph.initial_tx_data`
  — the seed tx that installs built-in classes/properties
  (`logseq.class/Journal`, `logseq.class/Page`, `logseq.kv/db-type`, …).
- Symptom: `create-page` with `today-journal?` wrote the page with
  `block/journal-day` but the `logseq.class/Journal` tag silently
  dropped (class entity didn't exist), so `is_journal` failed and
  `thread-api/get-latest-journals` always returned `[]`.
- Fix: do NOT pass `--create-empty-db`; `thread-api/create-or-open-db`
  with `Wire.Map []` creates + seeds a local graph. Verified:
  get-latest-journals then returns today's journal and a 161-op gen-3
  batch renders the journals list natively.
- `chunked` transfer-encoding: daemon `/v1/invoke` responses are
  chunked — `http_post` needed a chunk decoder, not just Content-Length.

### Patch batch queueing (don't coalesce)
- `Lui_app.send`/`dispatch` + async host task drains each trigger a
  flush → one patch batch per flush. A single `latest_patch` ref
  overwrites batches emitted between bridge polls — boot lost ~8
  batches. `pending_batches` queue → `take_patches()` returns a JSON
  array of wire batches; Swift `apply` splits `[`-prefixed arrays.

### Why sends produced zero patch ops (diagnosis)
- `Lui_app.send` returning `true` only means lifecycle=Running — it
  does NOT imply the model changed. `Lui_runtime.flush` →
  `Signal.stabilize` runs dirty tasks; `siggen` only bumps when tasks
  ran, and `ops=0` means recomputes produced no diff (dyn `~equal`
  skipped, or data unchanged). Instrumented via
  `Lui_runtime.diagnostics` (`[flush] status/ops/mounted/siggen`) —
  the original "no post-boot patches" symptom was real data emptiness
  (unseeded db), not a signal-propagation failure.
- DOM-event dispatch and model `Signal.set` both route through the same
  stabilize→ops path, so one fix covers both.

## Open risks

- `emit_patch` swallows schema errors (blank screen, no error) —
  LUI backend needs a detailed-messages build for debugging.
- `logseq-*` extension schema fingerprint must match between the OCaml
  registry and the Swift registration literals — use
  `Lui_extension_check` to generate them.
- Style: view code emits tailwind-ish `style-class` strings — the Swift
  extension renderer must interpret them (subset for milestone).
- Editing path (textarea dom-events ↔ LUI `TextChanged`) is the
  riskiest seam — web relies on DOM event payloads
  (`Platform.event_str` on raw `Js.Json`); the native path needs the
  same field names from the Swift text views.
- Document-level keydown/paste/selectionchange listeners are still
  window-side stubs — editor_keys/editor_dom expect a global stream;
  needs an NSEvent monitor forwarded as dom-events.

### Live DOM state must not come from mount-time snapshots
- `el` snapshots captured at mount carry `value=""` — `el_value` on a
  textarea after typing returned the stale mount value, so Enter
  committed empty titles. `live_fields` (id -> value/selectionStart/
  selectionEnd) mirrors the browser's live `el.value`: refreshed from
  every event's `target` snapshot and from imperative
  `el_set_value`/`el_set_selection_range`.

### add_event_listener prepends — ordering trap
- `window_listeners` pushes `f :: cur`, so a listener registered later
  runs FIRST. `on_input` (editor_keys) preceded the editor_dom live-field
  refresh, read the previous value, and wrote it back via
  `el_set_text_content` → the native text view got one-event-stale
  strings and characters vanished mid-typing. Fix: refresh inside
  `Platform.emit_event` itself via `pre_dispatch_hook` — order-free.

### el.textContent != el.value (web semantics)
- `on_input` calls `el_set_text_content` on every keystroke to keep
  `:has-text` in lockstep. Mapping `set-text-content` to the native
  string writes the (stale) buffer over live text — `domSetTextContent`
  is intentionally a no-op.

### updateNSView must not write text while focused
- Prop-driven `textView.string = text` during unrelated re-renders
  clobbers fresh keystrokes before the input event lands. Skip the
  write when `firstResponder == textView`; imperative `domSetValue`
  still applies.

### Outliner indentation styling
- `.block-children-container` carries `margin-left:29px` in
  lui-core.css but isn't visible to the tailwind-token parser — added
  an explicit semantic-class mapping (leading margin 29) +
  `block-children-left-border` collapses the 4px indent-guide strip.

### Autosave is a 400ms debounced setTimeout
- `Outliner_ops.schedule_save` arms `Editor_dom.set_timeout_id` →
  `Host` timer thread → `enqueue` → pump. `apply`/`apply_result` flush
  `pending_save` before structure ops, so Enter/Tab paths save text
  typed inside the debounce window. Verified: title persisted in db
  after plain typing (no Enter/Tab).

### GUI-driving quirks
- First click on a fresh window is consumed by AppKit activation —
  click twice; wait ~1s after focus before typing or leading
  keystrokes are lost.
- Daemon direct query:
  `curl -X POST localhost:<port>/v1/invoke -d '{"method":"thread-api/get-page-blocks-tree","argsTransit":"[\"logseq_db_Demo\",\"~u<page-uuid>\",null]"}'`;
  transit responses use `^N` cached-ref dedup, so literal-string greps
  miss repeated keys.

### Daemon lifecycle: quit must stop the spawned worker
- Cmd+Q terminates the app without running SwiftUI onDisappear, so
  `runtime.stop()` never ran and `logseq-db-worker` survived — it kept
  the graph locked and the next launch failed admission with
  `repo-locked: Graph ownership is locked` (stuck at "Select a Graph").
  `applicationWillTerminate` now calls `LogseqRuntime.terminateActive()`
  → `lui_ocaml_dispose` → `Daemon_client.kill_all` SIGTERMs every
  spawned pid.

### Page-ref navigation (fixed)
Two apple-twin stubs blocked every `closest`-based document listener:
- `Platform.get_attribute` returned `None` — broke `data-ref`/`data-uuid`
  reads in `on_doc_click`. Now decodes the snapshot `attrs` dict (and
  `attr-*` props).
- `apple/sidebar_state.ml` had its own `let closest _ _ = None` shadowing
  `Dom_ext.closest`. One-line fix; verify other apple twins don't
  shadow Dom_ext helpers the same way.

### FLAG — DOM semantics a native extension can't honor verbatim
`D.txt` (render_dom.ml) mounts `<logseq-raw-text data-raw-text="…">` as a
*placeholder*: on web a MutationObserver swaps the element's textContent
in post-commit. On apple the observer is a no-op, so the Swift extension
renders the `data-raw-text` attr itself (`effectiveText`). Any future
"placeholder node filled by observer" pattern will need the same
attr-driven fallback — there is no MutationObserver on the native side.

### Stale caret → split at position 0
`live_fields` in editor_dom.ml only refreshed from emit payloads; native
caret moves (Cmd+Right etc.) never reached OCaml, so split/merge used a
stale selection. LogseqTextArea now injects `selectionStart`/
`selectionEnd` into every dom-event payload.

### cmdk palette (working)
Full loop verified: Cmd+K opens, input autofocuses with last query
restored, arrows/Enter/Ctrl-N/P navigate+run, Esc clears-then-closes
(cljs semantics), Cmd+K toggles, outside click closes, row clicks run
items, create-page works, live results across groups.

Native fixes this needed:
- `Dom_ext.doc_query_selector`/`query_selector` were `None` stubs —
  implemented OCaml-side by walking the live LUI extension tree
  (`Lui_app.runtime` tables: `runtime_extension_nodes`/
  `runtime_extension_properties`/`runtime_children`/`runtime_parents`)
  and emitting snapshots in the Swift LogseqDOMSnapshot shape so the
  existing selector engine works unchanged. Elements without a DOM id
  get a `node-<id>` `#ref`; the Swift registry resolves those for
  dom-ops. This is THE answer for every DOM query semantic —
  `querySelector` on the web ↔ "walk the extension tree" here.
- Element-targeted dom-ops can land before SwiftUI mounts the node
  (commit is synchronous in OCaml; makeNSView registers on a later
  runloop turn). domOp retries unresolved refs 40×20ms.

### position:fixed / dialog shell → window overlay layer
Elements styled `position:fixed` (cp__cmdk-dismiss, ui__dialog-overlay,
ui__dialog-content) can't size through the collapsed out-of-flow
`cp__overlays` container — they now register into LogseqOverlayStore and
render in a window-level ZStack (`.overlay` on LUISwiftUIRoot). Z-order
is explicit (`LogseqStyle.overlayZ`: dismiss -2, scrim -1, content 0) —
mount order alone put the dismiss layer on top.

### FLAG — scrim doesn't swallow outside clicks
The dismiss/scrim Rectangles paint full-window but don't hit-test
outside the panel area (the overlay ZStack's hit path seems confined to
where content views have real frames — needs investigation in the LUI
backend's overlay hit-testing). Outside-click close still works because
the click falls through to a page element and `handle_click` closes when
`closest .cp__cmdk__modal` is None. Gap vs web: the underlying element's
own click handler also fires (e.g. clicking a dimmed link would navigate
as well as close). Flagged for the backend.

### DOM event bubbling (major fix)
The host posts a `dom-event` only to the deepest hit node — element
handlers registered on ancestors (button clicks whose content is a
span/svg) never ran natively, so most buttons were dead. Views now
register per-element handlers in `Platform.dom_handlers` keyed by
extension node id; `Platform.emit_event` walks `payload.nodeId` up
`runtime_parents` (installed by native_embed) invoking each handler
whose `events` list contains the name — the DOM bubble phase, before
`window_listeners`. `logseq_dom.dom` registers `on_dom_event` into it.
This globally fixed buttons hit via inner content (sidebar toggle,
item headers, menu items).
- Known gap: `dom_handlers` entries for removed extension nodes linger
  (Hashtbl.replace only overwrites same-id re-renders) — memory growth
  over long sessions; needs a removal hook from the runtime later.

### Right sidebar milestone fixes
- `buttonBody` used a hardcoded `VStack` ignoring `style.isRow` —
  every flex-row button (item headers, menus) stacked children
  vertically and inflated. Now reuses `stackBody`.
- `LogseqRowLayout`/`LogseqColumnLayout` had no flex-shrink: with the
  420px sidebar sibling the row overflowed the window (left-container
  stayed 850). Grow-weighted children now absorb a negative leftover
  too (flex-shrink:1 semantics).
- `cp__sidebar-help-btn` is `position:fixed` in the web stylesheet;
  mapped to `fillsOverlay` + fixedRight/Bottom it rendered at full
  window bounds — its `.inner` stretched and swallowed every click
  (the invisible-fullscreen-hitbox bug). Anchored overlay elements now
  get `.fixedSize()` so the alignment frame's full-window proposal
  can't expand them — CSS fixed elements shrink-wrap content.
- `LogseqSVGView` never applied `LogseqStyleModifier` — class sizes
  like `h-4 w-4` were ignored, so chevron svgs ballooned (~192x512)
  and inflated their ancestor rows. Modifier applied for the whole
  svg family.
- `sidebar-item-header`/`item-actions`/`resizer`/topbar/item classes
  mapped to native styles (resizer `outOfFlow`; web positions it
  `absolute` inside the item row).
- Painted-surface Rectangle branch ignored fixed sizes — applies
  `.frame(width:fixedWidth,height:fixedHeight)` now.

### Frame instrumentation (LOGSEQ_DUMP)
`LogseqFrameStore` + `LogseqFrameKey` PreferenceKey report each
element's frame in the `logseqWindow` coordinate space; the
`dump-frames` dom-op writes `/tmp/frames.json` (`{nodeId:[x,y,w,h]}`),
and the env-gated document click listener in native_embed writes
`/tmp/click.json` (event payload) + `/tmp/tree.json` (extension tree
snapshot). Used to debug every layout bug above — keep, env-gated.
Caveat: frames persist for removed/hidden nodes (stale values).

### FLAG — stylesheet-declared positioning is invisible to the parser
OCaml emits only class names; any `position:fixed`/`absolute` in
lui-core.css needs a manual Swift mapping. Remaining unmapped:
`.cp__sidebar-left-layout` (left sidebar is position:fixed on web —
we render it in-flow, visually equivalent but no overlay-slide
behavior), `.left-sidebar-resizer`, `.cp__graphs-selector`,
`.sidebar-drop-indicator`, `.ls-page-title-actions`. The sidebar
`.resizer` and `.block-children-left-border` are mapped/hidden;
`.extensions__code-lang` is hidden per web `display:none`.

### Inline components (PDF / LaTeX / code highlight milestone)
- `.ui-fenced-code-editor` rendered INVISIBLE then narrow —
  three stacked layout bugs, all in our CSS-faithful mapping:
  (1) `.ls-code-editor-wrap` has no utility classes, so it kept
  its 45pt ideal width inside the `flex w-full` row — web CSS gives
  it `width:100%`. (2) `.block-head-wrap` kept ideal width inside
  `justify-between` because the row layout sent ALL leftover into
  gaps when `spaceBetween`, skipping flex-grow children — CSS
  resolves flex-grow BEFORE justify-content, so grow children must
  absorb leftover first (gaps only when nothing grows).
  (3) `.extensions__code-lang` is `display:none` in web CSS — our
  duplicate lang label rendered.
- NSScrollView-wrapped NSTextView has no useful intrinsic content
  height — code textareas approximate `field-sizing:content` via
  line-count min-height (20pt/line). Long-term a content-sized
  representable would be truer.
- Highlightr works through `layoutManager?.replaceTextStorage
  (CodeAttributedString())` on the SAME scrollableTextView used
  for block editing; theme flips with appearance
  (`atom-one-dark`/`atom-one-light`), `data-lang` attr →
  `codeStorage.language`.
- PDF: declarative `logseq-pdf` element inside
  `#app-single-container` (runtime_parents chain, so a `grow`
  style class expands the pane); `pdf-close` dom-event clears
  `Pdf_state.current`. `Pdf_assets.open_pdf_file` resolves
  `asset_dir/uuid.ext` — same path the web asset click takes.
- Seeding a pdf asset block for testing is easiest through the
  daemon's own wire (`/v1/invoke` `thread-api/apply-outliner-ops`
  `insert-blocks`, transit-encoded asset block map) — typing
  `#+begin_src` etc. through the UI hits a db-worker bug instead.
- FILE-DROP: no DOM `drop`/file-input — `onDrop(of:[.fileURL])`
  on the LUI root sends a `file-drop` platform event with dropped
  paths; `asset_dom.upload_paths` mirrors `db-based-save-assets!`
  (checksum dedup, `Asset_store.write_asset`, `insert-blocks`).

### Worker-side bug (flagged, not ours)
- Tag creation through the UI writes FLOAT `block/created-at`/
  `block/updated-at` datoms — the schema wants `:int`, so the tx
  is rejected (`ui/save-changes-error`, `Db_tx.Invalid_tx("DB
  write failed with invalid data")`) and stray `user.class/
  +begin_src-*` entities appear. Repro: type a `#` tag in a
  journal block. Workaround for tests: seed via `insert-blocks`
  (raw titles store verbatim).

### Context menus + CustomEvent detail (right-click milestone)
- No SwiftUI right-click gesture: `.rightMouseDown` NSEvent monitor
  hit-tests `LogseqFrameStore.entries` (always-on frame registry,
  smallest-area-wins) and emits `contextmenu` with clientX/Y +
  target snapshot through the hit node's extension context
  (nodeID -> context map in LogseqElementRegistry). Textareas/
  inputs pass through for the native edit menu.
- `NSEvent.locationInWindow` is bottom-left-origin but
  `contentView.convert` already returns top-left coords when the
  hosting view is flipped — flipping again put every contextmenu
  hit ~500px off (menu opened at the wrong spot / wrong node).
  `windowPoint` flips only when `!contentView.isFlipped`.
- `Platform.dispatch` emitted the raw detail; web `dispatch` wraps
  it in `new CustomEvent(name, {detail})` so every listener reads
  `json_field "detail"`. Without the wrapper ALL ls:* CustomEvent
  dispatches silently died — ls:editor-command (context menu,
  slash commands), ls:open-right-sidebar, ls:toast, ls:navigate.
- `Platform.host_request` was never wired — `clipboard-write`,
  `ui-state` requests hit the default no-op. Now set to the same
  `platform_request` external as `Host.set_host_op`.
- Snapshots carry `rect` (from the frame store) + `node-id`, so
  `Dom_ext.bounding_rect` now returns real geometry for event
  targets and their `closest()` ancestors (cm submenu anchors).
- `mousemove` emits only on entered-node change (listeners do
  `closest()` checks, no per-pixel need); submenus open on hover
  via `bounding_rect` of the trigger.
- Menu styling mapped: dropdown-menu-item/sub-trigger/sub-content,
  heading row, color swatches (`var(--color-*-500)` resolved by
  parseCSSColor → namedHue), shortcut hints.
- Remaining gaps: icon/emoji picker surface (Set icon/Add
  reaction), `add-comment`/`copy-export-as` stubbed OCaml-side
  ("editor command not implemented"), hover highlight minimal.

### Native sidebar (Out-style, DOM-as-model)
- `left-sidebar-inner` renders `LogseqNativeSidebar` instead of the
  DOM row tree: the subtree mounts invisibly (0x0, clipsToBounds)
  so mount emitters + node models stay live, while the visible UI
  is a native vibrancy sidebar (sections, disclosure, hover/active
  fills, kbd chips, "…" row actions).
- Extraction walks the subtree with the new lui context APIs
  `childIDs(of:)` / `emit(on:name:values:)` (lui PR #94) —
  `LUIExtensionNodeModel` is @Observable so reading children/
  properties subscribes the view to patch updates.
- PITFALL: an emit with no `target` snapshot IS a document click —
  `on_doc_click` closes `open_menu` when `closest()` on the
  exclusion selector finds no target. Every `emit(on:)` MUST carry
  `payload.target` = `LogseqDOMSnapshot.snapshot(of:context:)` of
  the element the user conceptually clicked (dots button →
  `.sidebar-page-actions` matches the exclusion and the lp menu
  stays open; plain rows → own `a` node → menus close, matching
  web click-outside semantics).
- `SpatialTapGesture(coordinateSpace: .named("logseqWindow"))`
  gives the pointer in window coords for `clientX/Y` — the
  earlier NSEvent→SwiftUI conversion produced off-window coords.
- Dots/more use `.highPriorityGesture` so the row's tap doesn't
  also fire.
- Graphs selector row emits on the `a` node but no dialog
  appears — untracked so far (may be an OCaml-side gate).
- Transient: sidebar items vanish while cmdk is open — likely an
  emptied intermediate patch state during modal mount.

### Icon font + Out-style sidebar polish
- Icons render through the real bundled fonts now: `tabler-icons.ttf`
  (4962 `ti-` glyphs) + `tabler-icons-extension.ttf` (31 `tie-` glyphs,
  converted from the shipped woff2 with fontTools). Name -> codepoint
  tables are generated from the web css (tabler-icons.min.css /
  tabler-extension.css) into Resources/*.json. The old SVG-path
  renderer (LogseqSVGPath over tabler-children.json) stayed as the
  fallback for uncovered names.
- Sidebar switched to `List` + `.listStyle(.sidebar)` like Out's
  AppEntry.swift: system selection pill (synced to the DOM `active`
  class via a selection binding — clicks AND arrow keys both emit),
  plain/section headers with trailing disclosure chevrons, `Label`
  rows with SF symbols (ls-icon name -> SF map), graph switcher row
  (point.3.connected.trianglepath.dotted + headline + up/down chevron).
- The `a.as-edit` "…" section affordance and row `sidebar-page-actions`
  "…" still emit with SpatialTapGesture coords + target snapshots.
- `ls:open-dialog "graphs"` (graph selector click) is a no-op
  OCaml-side — `Dialogs_state.known` has no "graphs" entry; the
  graphs manager dialog doesn't exist in the ported dialog set yet.
  Same for any other dialog name not in `known`.

### Right-sidebar resizer (native drag)
- The OCaml `.resizer` element is decorative — fixed `aria-valuenow`
  and no width model — so the width is native-only state:
  `LogseqRightSidebarLayout.shared.width` (@Observable) read by the
  `cp__right-sidebar` fixedWidth. Reads happen inside `style` during
  body evaluation, so only right-sidebar elements subscribe.
- **Hit-test pitfall**: the resizer is an out-of-flow sibling placed at
  the container's minX, but `cp__right-sidebar-inner` covers the same
  x-range and wins hit-testing (later sibling = topmost). The
  interactive handle therefore renders as a `.overlay(alignment:
  .topLeading)` on the container element, not on the resizer node.
- New `outOfFlowFillY` style/layout key = `position:absolute; inset-y-0`:
  OOF children were placed at their ideal height (~10px stub); the flag
  stretches them to container height in both row and column layouts.

### devin/lui-swift-views — views (table/list/gallery) + popup layer

- Views are fully in the declarative LUI tree natively; the OCaml
  `deps/ui/src/views/*` layer is reused unchanged (table, list, gallery,
  view tabs, headers, row cells). Mount paths: `#/page/all` (All Pages)
  mounts via `Views_mount.ensure_all_pages`; the same mount machinery
  drives `{{query}}` blocks (.custom-query-results), tag/class pages and
  property objects pages (see untested list below).
- Imp views are native twins in `deps/ui/apple/views_dom.ml` /
  `views_popup.ml` — thin shims over `imperative_dom.ml` that keep the
  same DOM-shaped contract as `views/dom.cljs` (el records, query
  selectors, el_rect, document listeners) so `src/views` code paths run
  unchanged.
- Imperative elements (menus/popups/toasts) attach to the runtime tree
  through `Imperative_dom.attach_runtime`: host refs resolve to a LUI
  node (`Host_node`), a dom-id (`Host_dom_id` via
  `Editor_dom.lui_node_by_dom_id` snapshot walk), or body
  (`Host_body` → #app-container). Children of `position:fixed`/`absolute`
  nodes render in `LogseqOverlayLayer` at window scope — this is what
  puts menus/dropdowns above the table.
- `id_of` resolves a *snapshot* element back to its imperative node via
  `node-id` → `lui_index` — required for `el_remove` to detach mounted
  popup children (route leaks fixed).
- Popup dismissal is wired from `Views_mount.install` →
  `Views_popup.install_listeners`: Escape → `document_add_listener
  "keydown"` → `close_top`; outside press → `Overlay.on_document_press
  "mousedown"` → `close_all`. (Event name is `"mousedown"` — Swift
  forwards that, not `"pointerdown"`.)
- Popup positioning: `align_end` uses `right:` insets (Swift parses
  them to `fixedRight`) instead of `transform: translateX(-100%)`
  (unparsed natively). Submenus flip to the anchor's left edge when
  they'd overflow the window (`window_inner_width`); a fresh node's
  frame is 0 until the next rects flush, so width falls back to the
  anchor's width.
- Fixed elements need a `top`/`right` inset or the overlay anchor
  defaults to topLeading — `right:Npx` alone places correctly via
  `fixedRight`→topTrailing.
- Verified in GUI on this branch (All Pages):
  table render + headers + zebra rows; header-click sort menu
  (asc/desc applies + indicator); sort/filter/search toolbar popups;
  search input live-filters rows ("zzz" → "No matched result");
  display-type menu switches Table ↔ List ↔ Gallery; ⋯ menu →
  Columns visibility checks live-hide columns (persisted across
  restart); Group by submenu; Export EDN (toast fires); "+" adds a
  view tab; row click → navigates to page; Escape and outside-press
  both close popups; submenus flip left instead of clipping.
- Not verified / not ported (kanban & graph view excluded per user):
  - `{{query}}` block mount (.custom-query-results) — same
    ensure_mounts machinery, not exercised in GUI.
  - Tag/class + property objects pages — share `Views_view.mount`;
    the tag chip doesn't hit-test at its rendered offset (~8px off,
    same family as clipped page title) so the page can't be opened.
  - Inline cell editing, add-row (+ on tag objects pages only),
    column reorder/pin, view rename/delete tab context menu —
    OCaml emits the affordances; not exercised or no-ops untested.
  - Menu keyboard nav (Home/arrows/Enter): `el_focus` on a div is a
    no-op natively, so arrow-key nav in menus likely doesn't engage.
  - Virtualization/pagination: the OCaml table renders all rows
    (fine for test data; no lazy windowing wired natively).
  - Sort groups submenu (multi-column grouping UI in sort popup).

### devin/lui-swift-properties — page/block properties UI (LUI components milestone)
- View layer rewritten as declarative LUI components (OCaml emits
  semantic intent + data; Swift renders native controls — no DOM
  class-name style mapping). All `deps/ui/src/properties` modules:
  `properties_area` (page panel rows, block pills, title actions,
  bidi, sidebar), `properties_dialog` (4-phase signal-driven card
  sheet), `properties_select` (`Sel.view` filter field + `list`),
  `properties_menu` (`menu_view` dropdown panes), `properties_value`
  (cells + editors), `properties_state` (uuid-keyed `area_data`
  signals + overlay stack), `properties_data` (daemon ops —
  untouched), `properties_view` (install + overlays).
- Verified end-to-end: page panel rows + "Add property"; "Set
  property" → native sheet picker (21 props), live filter,
  "+ New option" row; pick → value edit → `set-block-property`/
  `create_property_text_block` → daemon → `refresh_all` → row
  re-renders; quit/relaunch persistence. Alias write reaches the
  worker and surfaces its validation error as a native banner
  ("Alias should be a Page") — same semantics as web.
- Native `dyn` constraint (set-prop validation): `set_prop` throws
  `Invalid_argument("property is unsupported by node kind")` for
  props outside the backend profile's per-kind settable set. Roots
  mapping to the same kind across dyn branches must keep IDENTICAL
  props — only children may differ; wrap heterogeneous branches in
  `column ~gap:0 [match …]`. Unsupported-on-apple hits: `gap` on
  `stack` (use `column`/`row`), `submit-on-enter` on `text-field`
  (only `textarea` allows it; native fields submit via `.onSubmit`
  anyway — `Sel.submit_on_enter_opt` gates it on `Sys.backend_type`),
  `submitEnabled` isn't settable on `text-field` either →
  Enter-to-submit can't be wired declaratively on apple (commit is
  via row press; `on_submit` is a no-op there).
- Silent failure mode: exceptions inside `Signal.set`→dyn→mount
  propagate through `Signal.stabilize`→`Lui_runtime.flush`→
  Js.Promise → silent rejection (rolled-back mount, no log).
  Instrument `Runtime.signal_set` with `Printexc.get_backtrace`
  when an expected patch doesn't appear.
- Picker list on apple: SwiftUI `List` can't self-size inside a
  content-sized `.sheet` → needs explicit `~height` (0 when empty,
  280 otherwise — mirrors web's `max-height:280px`). `~key` must be
  STABLE per row: a key that changes per keystroke drop+recreates
  the node — taps then hit a dead node id (Swift `try?` swallows)
  and the field loses first-responder mid-typing. New-option row
  uses constant key `"__new__"`; the `list` itself stays mounted
  across edits (height prop change, not mount churn). Same rule for
  any per-keystroke-rebuilt list.
- `dialog` requires `~text` (`invalidBatch("modal surface requires
  text")` otherwise); renders as a native `.sheet`.
- `lui_ocaml_visible_range: Invalid_argument("unknown extension
  node")` fires when Swift queries a list mid-remount — benign
  race; keeping the `list` node stable mostly avoids it.
- Dump limitation: `/tmp/tree.json` only serializes `logseq-*`
  extension nodes; LUI `column`/`row`/`list`/`menu_item` nodes are
  invisible — debug via `[patch]` logging in `native_embed.
  apply_batch` + screenshots.
- Imperative ops the remaining surfaces depend on (shared with
  parent): `doc_query "body"`, `el_append_child`/
  `el_insert_adjacent`/`el_remove`, `el_rect`, `el_focus`/
  `focus_end`/`active_element`/`is_editable_target`, `el_value`/
  `el_set_value`/`el_selection_range`, `el_closest`/`el_query*`/
  `el_query_all` + `:scope`/`,` selectors, `el_listen`/`on_click`/
  `document_add_listener` keydown, `el_set_class`/`el_set_attr`/
  `el_set_text`/`el_clear`/`el_first_child`/`el_inner_html`,
  `el_is_connected`/`node_is_connected`, `set_timeout`,
  `window_inner_height`, `Platform.set_location_hash`. Still-
  imperative surfaces kept via the `Sel.create` el shell
  (query_builder pickers) + `views_table`/`icon_picker`/popups
  through the vdom bridge (`{"#new":n}` materialization in
  `apple/vdom.ml`).
- Gaps vs master cljs:
  - Block-editor text commit not wired on apple (typed block text
    never reaches the daemon — `block/title` stays ""), so
    `key:: value` typed in a block can't create properties natively
    yet; seed via `apply-outliner-ops`.
  - `p a` hidden-properties toggle + `;;`/⌘P dialog shortcuts:
    handlers wired (document keydown listener) but untested
    end-to-end.
  - `key_cell` property menu (`properties_menu.menu_view` panes):
    renders as `dropdown_menu`; untested.
  - `test-prop` renders truncated as "t-prop"; title-actions labels
    clip ("dd icon" = "Add icon") — native chip width/truncation.
  - `apple/properties_value.ml` is a twin of
    `src/properties/properties_value.ml` — `cp` it after edits
    (no dune copy rule).
  - `appIcons` map (tabler→SF symbols) not registered; icons render
    as placeholder glyphs in the picker.

### devin/lui-swift-ac — autocomplete / slash popups (ac milestone)
- Emitted DOM matches master: `.ui__popover-content > #ui__ac >
  #ui__ac-inner > [.ui__ac-group-name] .menu-link-wrap > a#ac-<i>
  .menu-link[.chosen]` — shared selectors (`closest "#ui__ac-inner
  a.menu-link"`, `doc_query_selector "#ui__ac-inner"`) work verbatim.
- Caret anchor: the focused NSTextView snapshots its caret rect
  (layoutManager boundingRect → window coords) into the snapshot's
  `rect` on each keydown; `open_ac` reads it for x = caret.left-20,
  y = caret.bottom + 4 (master: PopoverContent anchors caret.bottom).
- Flip: `measure` lifts `--available-height` to 2000px, reads the real
  rendered height via `measure-node`/`node-rect`, flips iff
  `h > below && above > below` (below = innerH - a.y - 8, above =
  a.cy - 8), then commits `{a with flip = Some (top', avail)}` →
  popover re-emits `top:top'px; data-side="top"`. The lift must stay
  the last style override during retries — the rect reads back
  asynchronously, so writing the clamp after the lift masks it.
- Registry fix (shared, affects every dom-op):
  `LogseqElementRegistry` held `NSWeakReferenceBox`; nothing else
  retains the default handle, so `element("node-N")` went nil within
  a turn and the dom-op retry gate stalled ~800ms. Strong
  `NSReferenceBox`; unregister still drops on unmount.
- Deferred-event starvation: `DispatchQueue.main.async` re-dispatch
  of platform events queued behind MainActor `pump` wakeups and
  batched after retry loops ended; `Task { [weak self] in ... }`
  hops the same actor and interleaves correctly.
- Overlay anchors must be reactive: `LogseqOverlayPresenter`
  evaluated the body once, baking `style.fixedY`; flip's new
  `top:4px`/`data-side=top` never moved the frame. Anchor paddings/
  fill frame now apply inside `LogseqElementView.body` under
  `inOverlay` so they re-read `style` each render. Presenter passes
  a bare `LogseqElementView(inOverlay: true)`.
- Verified in GUI: `/` opens at caret with groups+icons+chosen;
  typing filters (`/cod`, `/img`); Enter commits (`[[Journal]]`);
  `/code` inserts a code block; `[[` autopairs `]]` + date presets +
  "New page X"; `((` block-search popup; `#` class list + Cmd+Enter
  tag pill; mouse click applies; Escape dismisses; nav wraps.
- LUI semantic check (per Tienson's direction): `dropdown_menu`
  anchors to a trigger element by side (`above`/`below`/`left`/
  `right`), `combobox` owns its own text field, `overlay` carries no
  coordinates — none expresses "panel at a caret rect", so the
  DOM-shaped emission stays for now. Planned migration: Tienson's
  shared imperative element layer (`deps/ui/apple/imperative_dom.ml`
  + `apple/Sources/Logseq/LogseqImperative.swift`) — pending els
  serialize on append-child, Swift mounts them in the window
  overlay, frames return via `imperative-rects`, mousedown/click/
  mousemove emit DOM-shaped targets. The AC flip algorithm and
  caret anchor are unchanged by the swap; integration branch owns it.
- Unported / known gaps:
  * `ctrl+p`/`ctrl+n` item nav (emacs-style) — untested, likely
    unhandled by the keymap.
  * Web scrolls the chosen row with `.center`-ish heading reveal;
    `scroll-row-into-view` uses nearest-edge (visual difference in
    long lists only).
  * `block search` (`((`) returns empty against this test graph —
    search plumbing works, fixture has no matching blocks.
  * Alias → source-class resolution and the focus-only reopen path
    (clicking back into the textarea re-opens at the same trigger)
    not exercised.
  * `.cp__commands-slash .ui__icon` opacity .7 styling nicety not
    mapped (icons render full-strength).
  * macOS Cmd+Left/Right line-nav and End-key semantics differ from
    web inside textareas (platform quirk, not AC-specific).
  * `/quote` + Enter-split writes don't persist — daemon write-path
    bug (`save_block_parsed`), out of AC scope.

### devin/lui-swift-settings — settings pages (native milestone)

Master's cljs settings dialog (settings.cljs) has panes:
account* / general / editor / keymap / ai / advanced / features /
collaboration / encryption / plugins-setting. The OCaml port emits
general / editor / keymap / advanced / features — the web-parity
subset (account/ai/collaboration/encryption/plugins panes don't
exist in the OCaml source yet, not a native-layer gap).

- The dialog opens via `Dialogs_state.open_ "settings"` (left-nav
  gear and App → Settings… both route there) and renders through the
  shared `ui__dialog-overlay` overlay layer.
- Migrated the pane emitters to LUI cross-platform semantic
  elements per Tienson's guidance (semantic intent over DOM mimic):
  `ui__switch`/`ui__checkbox` rows → `Lui_elements.switch_`/
  `checkbox` (native Toggle; other `ui__switch` emitters outside
  settings keep the old switchBody/checkboxBody — plugins_view,
  views_table, export_view belong to sibling tasks).
- Language picker: `<select>`-style trigger → `Lui_elements.select`
  + `Lui_elements.dropdown_menu` + `menu_item`s (native anchored
  popover, checkmark on the selected item, dismiss on outside
  click). Real `<select>` tag emitters still use the Picker
  selectBody (date-format row works as-is).
- Style mappings added for the emitted classes: cp__settings-*
  shell, mode-* theme previews (bundled light/dark/system pngs —
  build.sh copies resources/img/*-theme.png into the .app), accent
  palette dots, ls-select-wrap/trigger, ui__dropdown-menu-content.
- Persistence verified: toggles write through
  `Sdk_config.write_config` into the graph db kvs (e.g.
  `logical-outdenting?`), language/theme choices re-render in the
  new language and survive relaunch.
- Unported vs master (recorded, with reasons): spell-check toggle,
  auto-update row, markdown-mirror/http-server/semantic-search
  toggles, proxy row, auto-chmod — none exist in the OCaml settings
  emitters (they're cljs/Electron-only surfaces); account/RTC
  panes need sync backends not in this runtime.

### macOS menu bar (native milestone)

Mirrors master's Electron menu (src/electron/electron/core.cljs):
App (about/services/hide/hideOthers/unhide/quit — all system),
Settings… ⌘, (SwiftUI `CommandGroup(replacing: .appSettings)`),
File (Close Window ⌘W via `.newItem` replacement — the system
supplies Close/Close All in a non-document Window app; a bare
`.closeItem` group renders NO File menu at all), Edit (standard
system group — Undo/Redo/Cut/Copy/Paste/Select All act on the
focused NSTextView automatically), View (Toggle Left Sidebar ⇧⌘L,
Toggle Right Sidebar ⇧⌘R, Toggle Wide Mode, Zoom In ⌘= / Zoom
Out ⌘- / Actual Size ⌘0, Always on Top, Enter Full Screen — lands
via `after: .sidebar` / `before: .windowList`), Window (standard),
Help (Keyboard Shortcuts → settings keymap tab; Logseq
Documentation → docs.logseq.com).

- View/sidebar/settings items post `sendPlatformEvent` (added
  `LogseqRuntime.postPlatformEvent(name:json:)`) into OCaml;
  `deps/ui/apple/menu_bar.ml` installs `Platform.add_event_listener`
  routes: `menu-toggle-left-sidebar`/`menu-toggle-right-sidebar`/
  `menu-toggle-search` → existing `Action.Toggle_*` reducers,
  `menu-toggle-wide-mode` → `Settings_state.toggle_wide_mode`,
  `menu-open-settings` → `Dialogs_state.open_` + optional
  `{"tab":"keymap"}` payload.
- Pre-mount settings tabs: `menu-open-settings` with a tab payload
  before the pane has ever mounted crashed on `state()` — added
  `Settings_state.request_tab/clear_pending_tab` (pending slot
  consumed by `activate()` on mount; direct `set_tab` path when
  already mounted).
- Zoom is native: `.scaleEffect` + GeometryReader resize in
  LogseqRuntimeHost (zoomSteps 0.5–2.0), not routed to OCaml.
- Edit menu needs no code — SwiftUI's default `.pasteboard`/undo
  groups drive the focused NSTextView; verified Select All / Copy /
  Paste / Undo end-to-end through menu clicks.
- Unported vs Electron (recorded, with reasons): File→New Window
  (single-runtime single-window architecture), View→Reload/Force
  Reload/Toggle DevTools (no renderer — native views), the
  windowMenu role's per-doc semantics (no documents), Services
  submenu entries (system-provided), Electron's zoomin Cmd+= hack.
- Shared-layer fixes that dialogs elsewhere also needed: `emit()`
  now sends `targetClass` (style-class of the deepest tapped node)
  — `is_overlay_click`/`is_overlay_root` read it; and dialog
  backdrop taps hit `ui__dialog-content` (it fills the window via
  fillsOverlay), not the overlay element, so `is_overlay_click`
  accepts both classes as backdrop. Verified: Settings… opens,
  backdrop click dismisses.

### devin/lui-swift-pdf-annotations — pdf-annotations (PDFKit annotation layer)
- Architecture per Tienson's guidance: `deps/ui/apple/pdf.ml` is the
  native twin — it emits ONLY semantic data on the `logseq-pdf`
  element (`path`/`filename`/`hls`/`page`/`scale`/`ref_hl`/`theme`/
  `dashed`/`colored`/`automenu`/`hl_mode`/`area_mode`) and receives
  annotation events. All chrome (toolbar, find bar, floating sidebar
  with outline+highlights, settings menu, doc-info popover, context
  menus, area-capture overlay) is rendered natively by
  `LogseqPDFView`/PDFKit — no web DOM structure is emulated.
  `deps/ui/apple/pdf_assets.ml` is the native twin for persistence
  (annotation blocks under the asset block, `insert-blocks` +
  `apply_and_refresh`).
- Events Swift→OCaml: `pdf-close`, `pdf-hl-add` (text hl),
  `pdf-hl-area` (area capture w/ rendered PNG bytes + page rect),
  `pdf-hl-del`, `pdf-hl-color`, `pdf-hl-ref` (copy ((uuid))),
  `pdf-hl-link` (linked-ref goto), `pdf-annots`, `pdf-page` (debounced
  last-visit persist), `pdf-scale`, `pdf-flag` (theme/dashed/colored/
  automenu storage), `pdf-mode` (hl/area toggle). The `hls` attr is a
  JSON array the coordinator diffs by signature to add/remove
  PDFAnnotations.
- Native `q`/`invoke2` wire returns Datascript `:find` results as
  `W.Set`, not `W.Array|W.List` — decoding rows must use `W.elems`.
  First symptom: hls silently reloaded as `[]` on reopen.
- PDFKit `page.annotation(at:)` does NOT hit-test custom PDFAnnotation
  subclasses — the ctx-menu handler hit-tests the `applied` registry
  (page-identity + bounds inflated 4pt for line gaps).
- Local NSEvent monitors see every click in the window: SwiftUI chrome
  overlays the same region, so menu hit-testing must first check the
  TOPMOST view at the point is inside the PDFView
  (`contentView.hitTest` + `isDescendant`) — otherwise sidebar taps
  pop canvas menus.
- `PDFViewPageChanged` + `PDFViewSelectionChanged` (not
  `PDFViewChangedSelection` — wrong name compiles, never fires).
  `NSMenu.popUp(positioning: nil, at: viewPoint, in: view)` works for
  the context menus.
- pdf.js → PDFKit coords: `pdfkit_y = pageHeight - pdfjs_y - h`
  (rects stored in pdf.js top-left space, matching cljs hl-value).
- Area capture: overlay NSView drag → page-space rect → PNG render of
  the page region → `pdf-hl-area` carries base64 bytes; OCaml writes
  `assets/<uuid>.png` + a collapsed `hl-type :area`/`hl-image` block.
  The annotation ref renders the image via `pdf_annotation.ml`'s
  prefix (`.prefix-link > .hl-page` + resolved asset path).
- Verified end-to-end: hl-mode+select → yellow lines + annotation
  block (`P<n>` prefix) live in the journal; persisted across reopen;
  sidebar lists hls sorted by page; item click scrolls to the page
  region; ctx menu on canvas annotations (colors/copy-ref/copy-text/
  go-to-block/delete); color change + delete round-trip to canvas,
  sidebar AND journal block; area capture → dashed yellow box +
  collapsed image block; settings flags + theme storage; annots page
  navigation; ref (`P1` prefix) click re-opens the viewer at the hl.
- Unported (master surface audit, reasons):
  - interact.js region resize/move of annotations — no drag handles in
    PDFKit; would need a custom drag layer per annotation.
  - image lightbox + image-to-clipboard button in area annotation
    blocks — no `preview_images`/`clipboard_image` host op natively.
  - dragstart `[[id]]` on the hl ref icon — outliner DnD infra not
    ported.
  - file-graph `.edn` metadata files — db-graph only (native test
    graph is db-graph; cljs keeps hls only in db on db-graphs too).
  - "Open in external window" opens the file in the system viewer via
    `NSWorkspace` (no second native viewer window).
  - zotero links, unbounded-name hl truncation, theme "dark" canvas
    inversion differences vs pdf.js rendering, Alt+mouseup
    fresh-selection menu (path exists, untested — modifier synth).

### Native topbar (LUI semantic toolbar, liquid glass)
- `chrome.ml`'s DOM `cp__header` is gone; the chrome is two LUI
  `toolbar` elements — `~placement:"navigation"` (leading: panel-left
  sidebar toggle) and `~placement:"primary-action"` (trailing: search,
  home, dots, right-sidebar). `LUIToolbarGroupAnchor` hoists them into
  the real macOS window toolbar where macOS 26 draws liquid-glass
  items — same chrome Out gets from `ToolbarItemGroup`.
- `toolbar` **requires** `~label` (accessibility) — a missing label
  rejects the whole batch (`invalidBatch("toolbar requires an
  accessibility label")`) and poisons the generation counter.
- Toolbar children must be direct interactive nodes: a `dyn`-wrapped
  child hoists as a zero-size `ToolbarItem` (AppKit "ambiguous width"
  warnings, invisible button). Home therefore emits always and no-ops
  its press on `Model.Home`.
- `app:` icons resolve through `LogseqRuntime`'s `appIcons` dict —
  `"home" → .systemName("house")` is registered there (the builtin
  icon table has no house glyph).
- Hoisted `ToolbarItem` frames report in the toolbar's own coordinate
  space — `Imperative_dom.rect_of_node_id` is NOT usable for menu
  anchoring on toolbar children. The dots menu anchors to the fixed
  trailing position (`inner_width - 48, 48`) and stores it in
  `Dom_ext.toolbar_dots_pos` for the appearance popup, which cljs also
  re-anchors to the dots trigger.
- `Action.Toggle_search` is a no-op reducer on native (search opens
  via the cmdk DOM-click path or the mod+k keydown handler). Semantic
  triggers call `Cmdk_state.open_latest ()` directly — the search
  toolbar button and `menu-toggle-search` both use it now (the menu
  item previously dead-ended through the no-op action).
- `Host.inner_width ()` must be called at use time, not bound at
  module init — `page_menu.ml`/`settings_page.ml` previously froze the
  1440 default before the `window-size` push arrived, mis-anchoring
  right-aligned popups ~190pt off.
- rtc/plugin toolbar items have no semantic topbar slots — their DOM
  mounts live in a hidden `chrome-hidden` wrapper so emitters and the
  `rtc-tx` e2e element stay alive.
- `install-opam-deps.sh` (db-worker) restores the native daemon dep
  set (eio/httpun/tls/datascript #main + pset 695223e) on a fresh
  switch; `dune build bin/main.exe` then bundles via build.sh.

## Block-editor input pipeline (click→type burst correctness)

- Clicks on block text/empty rows never emitted "click": SwiftUI taps
  only emit from views carrying their own gesture. Fixed with a
  `leftMouseUp` NSEvent monitor + `emitClick` (same enrichment as the
  element emit), and a 60ms "click" coalescing window in
  `Platform.emit_event` so the element's own gesture emit wins over
  the deferred monitor emit instead of double-firing.
- Hit misses: `.ls-block` had no width and `.block-content` no height,
  so `hitTest` fell through to outer containers. LogseqStyles maps
  `ls-block → fullWidth`, `block-content → grow+fullWidth+minHeight 20`.
- `path` elements report their viewBox literally — rotating_arrow's
  `0 0 192 512` path registered a 192×512 frame that swallowed
  hit-tests. `path` is excluded from `LogseqFrameKey` reporting (the
  parent svg already reports the region).
- The add-block row (`.ls-block.block-add-button`, `id:""`) has no
  uuid — mousedown records wildcard `"*"` which replays into the next
  edit landing regardless of uuid.
- `S.set_silent` STAGES its update (`Signal.update`, no flush) —
  `S.editing()` reads the committed record, so a burst of keys that
  lands inside one flush must transform `st.editing` inside the update
  fn; writing `{e with buffer}` from the captured `e` collapses the
  burst to the last key.
- `pending_focus_actions` pops OLDEST-first: a structural op queued
  during a replay (Enter→split) must be appended to the tail, not
  prepended, or keys typed after it replay first and land in the
  pre-split block.
- NSTextView posts `textDidBeginEditing` lazily (first text change),
  so programmatic `makeFirstResponder` never emitted focus — OCaml's
  pending-focus loop spun and dropped queued keys. `LogseqBlockTextView`
  announces focus/blur on the responder transition itself.
- Keys typed in the split/remount gap (stale textview still first
  responder) were eaten natively. `LogseqPlatform.lastFocusRequest`
  records the focus dom-op target; the key monitor forwards plain keys
  to OCaml while FR is a different `LogseqBlockTextView` (≤0.5s).
- Racing keys (typed before the mousedown's enter_edit lands) queue in
  `pending_focus_actions` and replay via `on_pending_focus_key`;
  window is 5s — shorter drops keys when the pump is backlogged.
- `build.sh` prints "built:" even after a swift compile error —
  verify a new binary with `strings <bin> | grep -c <symbol>`.
- `fputs` is unresolved in LogseqPlatform.swift (needs `Darwin.`),
  fine in LogseqTextArea.swift — don't copy calls between files.
- Screen coordinates ≈ ×1.57 the point space — never infer element
  positions from screenshot pixels; verify via frame dumps.

## Theme / dialogs / menus (audit fixes)

- `ui-state` op carries `data.theme` ("dark"/"light"/"") — the native
  side must apply it (`NSApp.appearance` override) AND bump
  `LogseqAppState.appearanceVersion`; views that read `dark:` style
  rules observe `appState` and re-resolve. One-shot `isDark` colors
  freeze at mount — use `LogseqColors.dyn*`/`grayPair` (NSColor
  dynamicProvider re-resolves per draw) instead of baking a resolved
  Color into a style.
- `enter_edit` seeds `S.editing`'s buffer ASYNC (promise), so a key
  replayed into a record whose `base="" && buffer=""` while the
  display title is non-empty must be DROPPED, not written — writing
  `""+key` wipes the title. `last_block_mousedown` is a 3-tuple
  `(uuid|"*"|"", ts, stale_editing_uuid)`; `"*"` replays only into a
  record whose uuid ≠ stale (else it writes into the DYING record).
- Web dialog chrome `left-[50%] top-[50%] translate(-50%,-50%)` —
  the style parser ignores transform/percent offsets, so
  `ui__dialog-content` uses `centerVertically` in the grown overlay
  frame. Any element relying on translate-centering collapses to
  top-left without it.
- `cp__cmdk-dismiss` is the generic full-window click catcher
  (overlayZ -2, clear fill) — reuse it for any popup needing
  outside-click dismiss; popup's own fillsOverlay (z 0) stays tappable.
- i18n fallback returns the raw key — `t` of a key absent from
  en.edn renders `key` literally in the UI (seen as
  "view|loading-label" leak; use existing dict keys).

## Audit round 2 (Oct 3)

- `open-icon-picker` was a logged no-op dom-op — the native icon/emoji
  picker never existed. Ported `src/icon/icon_picker.ml` to the apple
  twin (imperative DOM via Editor_dom/Properties_dom, mounted through
  `Properties_popup.open_anchored(_right)` which hoists to the window
  overlay). Emoji table is generated into `apple/emoji_mart.ml` (1870
  rows from resources/js/emoji-data.js) because dune file edits are
  forbidden — new modules can't be added to the apple lib.
- `em-emoji` elements render via `attrs["data-emoji"]` Swift-side;
  elements carrying only `("id", mart-id)` render empty. Both emoji_mart
  twins expose `emoji_char id`; `tree.ml` icon_el + picker em_emoji_el
  emit `data-emoji`.
- `LogseqFlowLayout` does NOT honor LogseqOutOfFlowKey/LogseqAnchorKey —
  out-of-flow children inside inline/flowWrap containers render in flow.
- `apple/code_mirror.ml` was a stub: "Choose language"/"Copy" buttons
  rendered but dead. Native impl writes clipboard via
  `Platform.copy_to_clipboard` and the lang property via
  `Outliner_ops.set_block_property "logseq.property.code/lang"`.
- Toasts on native: `Dom_ext.dispatch_custom "ls:toast"` with
  {msg, cls} JSON — there is no Runtime.send Action.Toast_push path.
- CGEvent helpers take REAL screen pixels (~1.36-1.57× the 1024×768
  tool space — verify per display); the computer tool's left_click
  maps scaled coords itself.
- macOS honors only ONE `.navigation` ToolbarItem — LUI merges a
  navigation-placement group's segments into one item; capsule segments
  expand to bare children inside it so controls render as separate
  buttons, not a fused ControlGroup. Separate `primary-action` `toolbar`
  elements hoist as separate items.
- `Window("Logseq")` puts the app name in the titlebar —
  `.windowToolbarStyle(.unified(showsTitle: false))` hides it while
  keeping the Window menu entry; `Browser_ui.set_document_title` is a
  no-op on apple (page name lives in the toolbar crumb).
- `.environment` writes on `core` do NOT reliably reach extension
  children (they resolve through `context.content(for:)` AnyView
  snapshots). Hover-reveal uses `LogseqTitleHoverStore` instead: the
  `block-content-wrapper` ancestor records its nodeID on `.onHover` and
  `ls-page-title-actions` walks `context.parentID(of:)` to check.
- Relaunch flake: the journal page sometimes renders blank for ~60s;
  opening cmdk/search nudges it (runtime is alive — page fetch lag).
