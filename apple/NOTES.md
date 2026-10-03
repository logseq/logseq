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
