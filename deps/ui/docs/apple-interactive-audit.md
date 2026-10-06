# Apple (SwiftUI) host — interactive audit

Date: 2026-10-06. Three rounds:

- **Round 1**: `devin/component-migration` @ `75a961c149`, lui pinned `e812049`.
- **Round 2**: same branch @ `dba7bbbf60`, lui @ `63383d4` (origin/main —
  includes merged `5b3c79e LUICodeEditor`).
- **Round 3 — fix pass**: same branch + `635a287582`, lui `devin/apple-wire-schema`
  @ `14846db`. All fixes below are committed.

Host: macOS, `apple/` Swift package + `Logseq.app`, graph `logseq_db_Demo`
served by the native db-worker daemon (`http://127.0.0.1:56994`). Driven via
real AppKit window (clicks, keys, resize, right-click, screenshots, AX tree,
`sample`, daemon `/v1/invoke`, stderr `EMIT-*`/`LENIENT-*` probes).

Rounds 1–2 are an audit report (local workarounds listed at the end stayed
uncommitted); round 3 is a fix pass — every fix named there is committed
on the two branches above. Debug probes (`EMIT-*`, `PHIT`, `EV`,
`LENIENT-*`) were stripped before the round-3 commit.

## Round-2 delta (new main)

Resolved upstream:

- `LUICodeEditor` is now in lui main — apple host compiles against a real
  checkout (`LOGSEQ_LUI_PACKAGE_PATH=<lui>/platform/apple`), no cherry-pick.
  Caveat: `deps/ui/scripts/install-opam-deps.sh` **still pins `e812049`**
  (OCaml side) and `apple/build.sh` defaults to `../lui/platform/apple`;
  the pin/checkouts must be advanced past `5b3c79e` or the Swift build
  still fails at `LUICodeEditor`.
- `tabler-icons.ttf` is now copied into the app bundle resources — but
  icons still render tofu (font is shipped, never registered/loaded).
- Under `LUI_LENIENT_VALIDATE`, the page header now mounts on first paint
  (`Oct 5th, 2026` + `#Journal` tag + `Add …`/`Set …` buttons) and the
  sidebar renders all rows immediately — better than round 1 where a resize
  was needed to flush them.

Still open (confirmed on new main):

- All five round-1 build findings still unfixed upstream: `macos/gpui`
  fingerprint profile missing, duplicate `LogseqCodeMirrorView` stub,
  `self.` error at `LogseqPlatform.swift` ~L804, `Int64(+Inf)` SIGTRAP in
  `LogseqMeasureCache`, and the wire-schema emission/schema divergences.
- **New rejection class observed under strict validation**:
  `invalidBatch("link requires url")` — fires during boot
  (`LENIENT-NODE scope=50` in the log). `page_link`
  (`render_inline.ml` ~L48) and the sidebar `link-item group` rows emit
  `link` elements with `data-ref`/click delegation and **no `~url`
  property**; apple requires `url` on every link → batch dropped →
  toolbar never mounts → permanent generation desync, same as before.
- Menu mount still emits every round-1 violation: re-opening the page `···`
  menu logged 7× `menu-item accepts only context-menu metadata`, 2×
  `interactive leaf accepts only context-menu metadata`, 1× `button
  requires an accessible name`. The menu only exists under lenient.

### New round-2 findings

- **SwiftUI hit-testing is dead below the AppKit toolbar.** Sidebar `List`
  selection, row `onTapGesture`, and even arrow-key selection never fire —
  `emitClick` is never reached (verified with an `EMIT-OK/FAIL` probe that
  printed nothing across every click/keystroke). All interaction observed
  so far flows through the `NSEvent` monitors (mouseDown/mouseMoved/
  keyDown → `LogseqFrameStore.hitTest` → `context.emit`) — SwiftUI
  gestures inside the hosting views never run. Suspect: a stray full-bleed
  hit target in the window-level `.overlay` (`LogseqOverlayLayer` +
  `LogseqImperativeLayer` host imperative/menu nodes at Z above content),
  or the layout storm below starving input processing.
- **Main-thread SwiftUI layout storm.** `sample` shows the main thread
  saturating inside `sizeThatFits` recursion (`PaddingLayout` →
  `StackLayout` → `FlexFrameLayout` → ~69k samples) — the beachball on the
  Settings menu click is layout burning, not OCaml. The `logseq-ocaml`
  runtime thread is healthy (NSRunLoop idle); the only blocked OCaml
  thread is a spawned worker in `caml_ml_input_scan_line` → `read()` —
  the Settings `on_press` invoke never returned, so its promise never
  resolves and the menu/navigation stays frozen.
  Evidence: `layout-storm.sample.txt`.
- Page `···` menu mounts 11 items under lenient (Add to Favorites / Delete
  page / Export page / Publish page / Settings / Plugins / Appearance /
  Recycle / Export graph / Import / Login) — the full page-actions menu,
  not just the plugins subset from round 1. Toolbar item frames still
  ambiguous/zero-size (AppKitToolbarItem warnings); clicks work only
  intermittently.
- `emitClick` sends `dom-event` with inner `name:"click"` — document-level
  `"click"` listeners (`Platform.add_document_listener`) never see it,
  which is why `LOGSEQ_DUMP` never produced `/tmp/tree.json` on any click.

## Round 3 — fix pass

All fixes committed: logseq worktree `0e7d660c79` + `635a287582`
(`devin/apple-interactive-audit`), lui `8dab601` + `14846db`
(`devin/apple-wire-schema`). Verified end-to-end under **strict**
validation (no `LUI_LENIENT_VALIDATE`) on the Demo graph.

**Fixed**

- All five P0 build findings: duplicate `LogseqCodeMirrorView` stub
  removed, `macos/gpui` added to the extension fingerprint profile,
  missing `self.` added, `LogseqMeasureCache` clamps non-finite
  measurements. The host compiles at the real lui pin and boots
  zero-rejection under strict validation.
- **Wire-schema desync resolved.** The apple validator now matches the
  semantics OCaml emits (and gpui accepts): leaf hosts (`button`,
  `menu-item`, etc.) accept content children, url-less `link`s are legal,
  icon-only buttons don't require an accessible-name property, and
  `main`/`cross`/`padding*` admit the full OCaml kind matrix
  (`lui_protocol.ml` `common_property_supported`). `icon-only … requires
  label` and `unsupported property value` batches no longer drop.
  Result: 9+ patch generations applied with zero `invalidBatch`; the
  generation counter stays in sync for the whole session.
- **Icons render.** `fontGlyph` icon source + `LogseqAppIcons.sources`
  map tabler codepoints to the bundled `tabler-icons.ttf` — no more tofu.
- **Interaction works.** Root cause of dead input was a three-layer gate
  mismatch: `Ui_parts.pressable` wraps rows/boxes, but `press-enabled`
  was only admitted on a few kinds (`property_supported`), `press` events
  rejected on row/box (`event_supported`), and the wire validator +
  `performPress` enforced the same narrow list. All three layers now
  admit `Row`/`Box`. Separately, the `pointer-detail` event path
  (`on_press_detail` / `pointer-enabled` — real coords + `target_class`,
  web-bubbling semantics: deepest hit → nearest pointer-enabled ancestor)
  is now implemented end-to-end: `performPointerDown/Up/PressDetail/
  ContextMenuPress` in the backend, NSEvent monitors in the host emit
  them on standard nodes, `pointerEnter`/`Leave` on hit transitions, and
  `LogseqLUIEvents` bridges all six event names to the OCaml C exports.
  Extension-node hits resolve via `contextOwning` so `dom-event`s reach
  the right context.
- **Verified in the window** (strict mode):
  sidebar `Pages` click → `press` accepted → full nav handler runs →
  Pages table mounts with column headers + `Oct 5th, 2026` row
  (`07-pages-view-after-nav.png`);
  page-row click → breadcrumb nav to `Oct 5th, 2026`;
  page `···` menu mounts all 11 items natively (`08-page-menu-strict.png`,
  previously impossible outside lenient).

**Still open**

- **Journal page body renders empty** — nodes mount but blocks don't
  display. Separate from the interaction layer; needs its own pass.
- **Editor conduit** (`logseq-editor` → `EmptyView()`) untouched — ASCII/
  CJK/IME testing still blocked.
- **cmdk** — Cmd+K still mounts nothing.
- **Right-click** on standard rows shows no menu (table rows aren't
  pointer-enabled hosts; the context-menu tree may need an emit path).
- **Layout storm** (main-thread `sizeThatFits` recursion) still present —
  deprioritized this round.
- LUI opam pin in `install-opam-deps.sh` still points at `e812049`; the
  apple backend work needs a pin bump once lui commits land on main.

## Round 4 — journal-body root cause + cold-start timing (2026-10-06)

Audited on `devin/component-migration` @ `97903d3902` with the
squashed-equivalent lui (`devin/apple-wire-v2-local` @ `adc4bb1`, which
carries the same validator + interaction fixes as
`devin/apple-wire-schema` `8dab601`/`14846db`). Strict validation, no
lenient env. The Demo graph was re-seeded via
`thread-api/apply-outliner-ops` `insert-blocks` (9 blocks: external link,
CJK, `[[page ref]]`, bare URL, TODO, `$$…$$` latex, fenced code, nested
children, long paragraph) to exercise the journal body; patch dumps
captured with `LOGSEQ_DUMP_PATCHES=<file>` (one JSON batch per line —
replays every violation below).

### Cold-start → full-render timing (the deliverable)

| Marker | t0-relative |
| --- | --- |
| Daemon SSE attach + all boot invokes done (journal fetch, search build, pulls, get-page-blocks-tree) | **+38 ms** |
| gen=1/2 applied to backend model (shell + sidebar) | **~+0.10 s** |
| first `extview-appear` (SwiftUI mount/layout pass finishes) | **~+4.3 s** |
| journal body rendered | **never** — gen=3 dropped by validation (below) |

The OCaml + daemon side is fast end-to-end (~38 ms); the entire gap is
main-thread SwiftUI layout in the first mount pass. A second boot
interleaved differently — gen=1 at +0.5 s, gens 2–3 delivered at +4.5 s —
same ~4.5 s wall to content either way. Conclusion: **cold-start to
first painted content ≈ 4.3–4.5 s today, and "full render" is
unreachable because the journal batch is dropped.**

### New round-4 findings

- **P0 — journal-body-empty root cause found: `.block-title-wrap` emits a
  `text` container with extension children → whole batch dropped.** The
  block-title inline renderer wraps mixed runs in a standard `text` node
  and puts `logseq-*` extension children inside it:
  `text(325) → logseq-a(327)` (bare URL external link),
  `text(393) → logseq-span(395)` (`latex-inline`),
  `text(429) → logseq-br(431)` (multi-line title).
  `.text` is not in `acceptsExtensionChildren`
  (`LUIWireProtocol.swift:1025`), so `backend.apply(decoded:)` throws
  `invalidBatch("standard node cannot contain extension")` in the
  post-loop `validateNodeProperties` pass, the snapshot rollback discards
  the whole generation atomically, and the catch in
  `LogseqRuntime.apply` swallows it to an NSLog. Any block with an
  inline link / tag / latex / `<br>` / emphasis kills the page body.
  Worse: `generation` only advances on success
  (`LUIAppleBackend.swift:765`), so one dropped gen leaves the backend
  expecting N while OCaml keeps emitting N+1, N+2, … — **every later
  batch fails the `expectedGeneration` guard; the session is permanently
  desynced until relaunch** (this is also why post-violation clicks
  produce nothing). Fix direction: the `.block-title-wrap` mixed-run
  container should be a container kind (e.g. `row`) or an inline
  `logseq-*` host, never `text`; the alternative is admitting ext
  children under `text` in the three whitelists that must move together
  (`can_contain_children`, `child_kind_supported`,
  `standard_container_supported` — OCaml side) plus
  `acceptsExtensionChildren` (Swift side). Evidence:
  `audit-shots/apple/r4-journal-gen3-patch.jsonl` + the three violations
  above; drop is silent apart from `NSLog("LUI patch apply failed: …")`.

- **P0 — layout storm still dominates every burst.** `apply(decoded:)`
  of the post-press navigation gen took `dur=4334ms` on the main thread;
  `sample` shows ~100% main-thread CPU inside SwiftUI `sizeThatFits`
  recursion (`LayoutEngineBox`/`UnaryLayoutEngine`/`_FlexFrameLayout`/
  `_PaddingLayout`/`StackLayout.placeChildren`). Boot mount pass ≈ 4.2 s;
  a live resize re-triggers the same storm continuously (see
  `audit-shots/apple/r4-layout-storm.sample.txt`).

- **P0 — patch delivery stalls behind the busy main thread.** Boot gens
  2–3 queued `hold=4514–4687ms` while the mount pass ran; `rltick` gaps
  of 17–26 s observed — the 2 ms `drainTimer` cannot fire while the main
  thread is inside layout, so `runOnMain`/patch drains pile up behind
  every storm. Effective per-interaction latency during a burst is
  seconds, not the 1 ms quiet-window the code intends. (The `hold=` math
  also conflates two causes: run3 merged gens 1–3 into one 88 ms deliver;
  run2 split them 4.5 s apart — depends on whether the worker emits
  before or during the mount pass.)

- **P1 — phantom geometry persists.** OCaml `PERF rects` place rows at
  negative y (`@-52`, `@-28`) and a ~506-wide content column in a ~1000pt
  window; AX mounts the full tree at off-window coordinates; the paint
  shows only two sidebar rows plus stray `〉`/`’` glyphs
  (`audit-shots/apple/r4-phantom-paint.png`). The last `window-size`
  event seen was `.defaultSize` 1200×800 — a real resize pushes the new
  size but the layout still doesn't converge while the storm runs.

- **P1 — right-click: still nothing.** `nsev type=3/4` deliver fine, but
  no `performContextMenuPress` / `emitContextMenu` reaches OCaml —
  `LogseqFrameStore.hitTest` misses under the phantom geometry and the
  sidebar rows are native `List` rows (not pointer-enabled hosts); the
  `.contextMenu` node kind is still `EmptyView()` anyway
  (`audit-shots/apple/r4-right-click-no-menu.png`).

- **P1 — cmdk mounts but doesn't paint.** Cmd+K forwards correctly
  (`nsev kc=40` → OCaml `keydown` → gens 13–14, `n=326 e=19`, applied in
  8 ms, extension views mounted) — the palette nodes exist in the tree
  but nothing paints; same storm/geometry cause, not an input problem.
  AX exposes no cmdk text field.

- **P1 — window vanished mid-session, process kept burning 100% CPU.**
  After an AX-driven resize during a storm, the window disappeared
  (`count of windows = 0`) while the app stayed frontmost and kept
  spinning in `sizeThatFits` — inverse of the round-3 zombie-window note.
  Inverse variant: window painted but `apply` silently dropped the
  journal gen (above) — the app looks alive while permanently behind.

- **P1 — early-boot SIGTRAP: not reproduced** in three cold boots this
  round.

- **P2 — `apply` error handling swallows batch failures.** The only
  signal for a dropped generation is `NSLog("LUI patch apply failed:
  invalidBatch(…)")` — no stderr/perf line, no surface badge, no retry;
  debugging required `log show` or `LOGSEQ_DUMP_PATCHES`. A
  `PERF apply-fail gen=… reason=…` line would make this class visible.

### Round-4 carry-over status of the checklist

- Journal body: **still empty — root cause identified** (above); needs
  the emit-side container fix, then latex/PDF blocks become testable.
- Editor conduit: unchanged — `LogseqEditorView` is `EmptyView()`
  (`LogseqExtensions.swift:338`); typing/IME still untestable.
- cmdk / right-click / layout storm / phantom paint: all still open,
  details above.

## Checklist coverage

| Item | Result |
| --- | --- |
| Initial render (sidebar/page/cmdk) | Partial — shell + full sidebar mount; page header + table render on nav; icons fixed; journal body still empty |
| Editor: mount, ASCII+CJK, caret, IME | **Blocked** — `logseq-editor` conduit is an `EmptyView()` stub |
| cmdk open/query/scroller | **Dead** — Cmd+K produces nothing |
| Context menus/popovers | Page `···` menu mounts 11 items natively under strict validation; right-click still produces nothing |
| Sidebar navigation | **Works** — Pages/Journals/row clicks navigate and render |
| LaTeX block, PDF block | **Blocked** — journal body renders empty, no blocks reachable |
| Resize, scroll long page | Resize relayouts fine; nothing scrollable yet |

## Findings (severity ranked — round-1/2 status; see Round 3 for fixes)

### P0 — does not build at the pinned dependency set (fixed in round 3)

1. **lui pin drift**: deps/ui pins lui `e812049`, but
   `apple/Sources/Logseq/LogseqCodeMirror.swift` uses `LUICodeEditor`, which
   only exists on lui `devin/apple-ext` (`f42566a`, unmerged). `swift build`
   fails at pin. Local workaround: cherry-pick `f42566a` onto `e812049` in a
   lui worktree and build with `LOGSEQ_LUI_PACKAGE_PATH=<lui>/platform/apple`.
2. **Duplicate symbol**: `LogseqExtensions.swift` carries a stub
   `LogseqCodeMirrorView` that collides with the real view in
   `LogseqCodeMirror.swift`. Deleted the stub locally.
3. **Swift 6 strict-concurrency error**: `LogseqPlatform.swift` ~L804
   missing `self.` capture.
4. **Extension fingerprint mismatch** — `LogseqExtensions.swift` `profiles`
   is `["web/web","macos/swiftui"]`; OCaml registers with
   `["web/web","macos/swiftui","macos/gpui"]`. Every `logseq-*` extension
   registration is rejected at boot ("extension fingerprint mismatch"), so
   the window is completely empty. Locally added `macos/gpui` to match.
5. **SIGTRAP on first layout** — `LogseqMeasureCache.sizes` converts a
   `+Inf` width with `Int64()` → `Double value cannot be converted to
   Int64` crash. Local guard: clamp non-finite measurements.

### P0 — wire-schema validation rejects OCaml trees → permanent desync (fixed in round 3)

`LUIWireProtocol.swift` validates children per `insertChild` and re-validates
node properties at end of batch; a single rejection throws `invalidBatch`,
rolls back the batch, and leaves the patch stream permanently desynced
(`expected patch generation N, received N+1` on every subsequent apply —
the UI can never recover). Observed rejections on an unmodified tree:

- `invalidBatch("menu-item accepts only context-menu metadata")` — OCaml
  serializes `menu_item ~icon:` as an `icon` **child node** under
  `menu-item`; the apple schema allows only context-menu metadata children.
  GPUI reads the icon as a *property* (`icon_name(node,
  Property::InlineIconName/IconName)`, `kinds.rs` ~L1627), so the same
  OCaml tree is legal there — the two backends disagree on the wire shape.
- `invalidBatch("interactive leaf accepts only context-menu metadata")` —
  `button` parent carrying `text`/`row` children (menu rows built via
  `Ui_parts.pressable` + `icon_` + `text`).
- `invalidBatch("button requires an accessible name")` — `button` nodes
  whose label is a child `text` node fail node-level `validateNode`
  (expects a `text`/`aria-label` *property* on the button).

Until the icon/label emission is unified (property vs child) across apple
and gpui, any menu/popover open bricks the app for the rest of the run.

### P0 — editor conduit is a stub

`LogseqEditorView` is `EmptyView()` (TODO `logseq-editor`); no block editor
mounts anywhere, so typing, CJK, caret-position and IME marked-text paths
are all untestable. Even the block "〉" add-button is inert (see hang below).

### P1 — OCaml runtime blocks the UI thread on socket reads

Clicking the block add-button (and some other content interactions) wedges
the app: `sample` shows the `logseq-ocaml` thread inside
`caml_ml_input_scan_line` → `caml_read_fd` → `read()` on a socket —
`apple/daemon_client.ml` `http_post`/`input_line` is synchronous blocking
I/O and the request never returns. The daemon is healthy throughout
(`/v1/invoke` answers fine from curl). Evidence:
`audit-shots/apple/ocaml-hang.sample.txt`; screenshot `04-menu-open-beachball.png`.

### P1 — input plumbing is dead in practice (fixed in round 3)

- Sidebar row clicks (`Journals`, `Pages`, `Flashcards`, `Favorites`,
  `Recent`) produce no navigation and no visible change, even though a
  `leftMouseDown` monitor hit-tests `LogseqFrameStore` and emits
  `mousedown` (the emit path uses `try?` — silent failures are
  indistinguishable from dead handlers).
- Cmd+K: `keyMonitor` forwards `keydown` to OCaml
  (`LogseqPlatform.swift` ~L239), but cmdk never mounts.
- Right-click anywhere: no context menu appears (`screenshot 06`).
- `emitClick`/document listeners never produced a `LOGSEQ_DUMP` tree on
  any click, meaning no tap-bearing element ever dispatched `click`
  successfully to the document listener.

### P1 — content renders sparsely / drops after relayout

- Fresh boot to the journal shows a single "〉" glyph (the
  block-add-button); the blocks region is an `AXScrollArea` of height 0.
  `page.ml` `blocks_inner` emits nothing at all when `blocks = []`, so an
  empty journal has no empty-state and no editable surface.
- Initial sidebar paints only `Flashcards/Pages/Favorites/Recent`; after a
  window resize a second section (`Demo`, `Navigations`, `Journals`) appears
  — the earlier rows never mounted (`05-post-resize-sidebar.png`).
- Conversely the toolbar items that did render (back/forward/home/search/…)
  vanish after the same relayout — patch application is lossy both ways.
- Demo graph is **not** empty: `graphs/Demo/db.sqlite` has 232 kvs rows
  including page/block titles (e.g. "Property view context"), so the blank
  page is a render/navigation problem, not data.

### P2 — icons are all tofu (fixed in round 3)

Every icon renders as a boxed `⌧` — the icon font generated by
`gen-icon-resources.mjs` is not loaded into the app (or not referenced by
the `icon` element path). Visible throughout sidebar and toolbar.

### P2 — working pieces (under `LUI_LENIENT_VALIDATE=1`)

- Toolbar `···` dropdown menu mounts as a real native panel
  (`LUIDropdownMenuView` + `LUIAnchoredMenuHost`): Plugins / Appearance /
  Recycle / Export graph / Import / Login (`03-toolbar-menu.png`).
  AX: 7 `AXButton`s at x≈1092, y=179–459, 256×40.
- Tooltip ("Page Menu") renders on hover.
- Window resize relayouts the native shell correctly.
- Daemon attach/reuse, SSE stream, and the invoke queue all come up in
  ~40 ms of boot.

### P2 — other observations

- The open menu does not dismiss on outside click.
- Recurring `[daemon] invoke thread-api/get-file-content failed: repo is
  required` at boot — a `get-file-content` call is issued with an empty/
  absent repo arg.
- Zombie-window state observed once: app frontmost with a painted window
  while `System Events` reports `windows().length = 0` — dead surface
  accepting no input; relaunch restores.
- `open Logseq.app` does not inherit shell env; `launchctl setenv` is
  required for `LOGSEQ_DUMP`, `LOGSEQ_DEBUG_VIEWS`, `LOGSEQ_PERF_FILE`.
- `AppKitToolbarItem ambiguous height/width` warnings throughout.

## Stub list (unimplemented / placeholder surfaces)

| Surface | State |
| --- | --- |
| `logseq-editor` conduit (`LogseqEditorView`) | `EmptyView()` — editor never mounts |
| `LogseqCodeMirrorView` (code/source editor) | Needs lui ≥ `5b3c79e` on the Swift package path (in main, pin not bumped) |
| `.contextMenu` kind | `EmptyView()` in SwiftUI root — right-click emits `contextMenuPress` but no menu tree ever mounts |
| cmdk palette | No host surface reachable via Cmd+K |
| ~~Icon font pipeline~~ | **Fixed** — `fontGlyph` source + `LogseqAppIcons.sources` map to bundled `tabler-icons.ttf` |
| Empty-page empty-state | `blocks_inner` emits zero nodes for `blocks = []` |

## Local workarounds applied during rounds 1–2 (superseded by committed round-3 fixes)

Round 1: `lui` worktree `lui-apple-ext` (e812049 + cherry-pick f42566a) —
superseded in round 2 by a real `~/repos/lui` checkout at `63383d4`.

`LUI_LENIENT_VALIDATE` env gates around `validateChild` and
`validateNodeProperties` in `LUIWireProtocol.swift` +
`LENIENT-SKIP`/`LENIENT-NODE` stderr prints — lenient keeps patch
generation in sync and lets invalid children mount, which is how every
round-1/2 menu/screenshot was obtained. The gate was kept (opt-in env
only); the probe prints were removed. With the validator fixes, strict
mode now passes the same surfaces lenient used to rescue.

In the logseq worktree `apple/`: the round-1 workaround list (dedupe
stub, `macos/gpui` profile, `self.`, finite-guard) is now the committed
`0e7d660c79`; all `EMIT-*`/`PHIT`/`EV` probes were stripped.

NOTE — the local opam pin was repointed for development:
`opam pin add lui /Users/devin/repos/lui --kind=path` so worktree edits
compile; restore a git pin once `devin/apple-wire-schema` lands.

## Reproduce

```sh
# lui >= 5b3c79e for LUICodeEditor; >= 14846db (devin/apple-wire-schema)
# for the validator + interaction fixes:
opam pin add -y lui git+https://github.com/logseq/lui.git#14846db --switch=5.5.0
cd deps/ui && OPAMSWITCH=5.5.0 opam exec -- dune build @all
LOGSEQ_LUI_PACKAGE_PATH=<lui>/platform/apple sh apple/build.sh
open _build/apple/macos/Logseq.app   # strict validation now passes
```
