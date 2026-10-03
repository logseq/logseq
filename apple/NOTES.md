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
