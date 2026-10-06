# Apple (SwiftUI) host — interactive audit

Date: 2026-10-06. Two rounds:

- **Round 1**: `devin/component-migration` @ `75a961c149`, lui pinned `e812049`.
- **Round 2**: same branch @ `dba7bbbf60`, lui @ `63383d4` (origin/main —
  includes merged `5b3c79e LUICodeEditor`).

Host: macOS, `apple/` Swift package + `Logseq.app`, graph `logseq_db_Demo`
served by the native db-worker daemon (`http://127.0.0.1:56994`). Driven via
real AppKit window (clicks, keys, resize, right-click, screenshots, AX tree,
`sample`, daemon `/v1/invoke`, stderr `EMIT-*`/`LENIENT-*` probes).

This is an audit report — no product fixes are committed. Local workarounds
used to get far enough to observe anything are listed at the end and stay
uncommitted.

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

## Checklist coverage

| Item | Result |
| --- | --- |
| Initial render (sidebar/page/cmdk) | Partial — shell + partial sidebar mount; content area almost empty; icons all tofu |
| Editor: mount, ASCII+CJK, caret, IME | **Blocked** — `logseq-editor` conduit is an `EmptyView()` stub; no reachable editable block (nav dead, journal empty) |
| cmdk open/query/scroller | **Dead** — Cmd+K produces nothing |
| Context menus/popovers | Toolbar `···` dropdown mounts natively (6 items) and hover tooltip works — **only** with validation disabled; right-click produces nothing |
| LaTeX block, PDF block | **Blocked** — cannot reach a page with blocks |
| Resize, scroll long page | Resize relayouts fine (and reveals sidebar content that never mounted initially); nothing to scroll — blocks scroll area has height 0 |

## Findings (severity ranked)

### P0 — does not build at the pinned dependency set

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

### P0 — wire-schema validation rejects OCaml trees → permanent desync

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

### P1 — input plumbing is dead in practice

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

### P2 — icons are all tofu

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
| `LogseqCodeMirrorView` (code/source editor) | Compiles only with unpinned lui `devin/apple-ext` cherry-pick |
| `.contextMenu` kind | `EmptyView()` in SwiftUI root — right-click path relies on the mouse monitor but no menu tree ever mounts |
| cmdk palette | No host surface reachable via Cmd+K |
| Icon font pipeline | Generated but not loaded — all icons tofu |
| Empty-page empty-state | `blocks_inner` emits zero nodes for `blocks = []` |

## Local workarounds applied (NOT committed)

Round 1: `lui` worktree `lui-apple-ext` (e812049 + cherry-pick f42566a) —
superseded in round 2 by a real `~/repos/lui` checkout at `63383d4`.

In `~/repos/lui` (63383d4, uncommitted): `LUI_LENIENT_VALIDATE` env gates
around `validateChild` and `validateNodeProperties` in
`LUIWireProtocol.swift` + `LENIENT-SKIP`/`LENIENT-NODE` stderr prints —
lenient keeps patch generation in sync and lets invalid children mount,
which is how every menu/screenshot here was obtained.

In the logseq worktree `apple/` (uncommitted): removed duplicate
`LogseqCodeMirrorView` stub; added `macos/gpui` to the extension
`profiles` fingerprint; added missing `self.` in `LogseqPlatform.swift`;
finite-guard in `LogseqMeasureCache.sizes`; `EMIT-OK/FAIL` probe in
`LogseqNativeSidebar.emitClick`; assorted `PERF`/`LOGSEQ_DEBUG_VIEWS`
probes.

## Reproduce

```sh
# opam lui must be >= 5b3c79e (main) for LUICodeEditor:
opam pin add -y lui git+https://github.com/logseq/lui.git#63383d4 --switch=5.5.0
cd deps/ui && OPAMSWITCH=5.5.0 opam exec -- dune build @all
LOGSEQ_LUI_PACKAGE_PATH=<lui>/platform/apple sh apple/build.sh
launchctl setenv LUI_LENIENT_VALIDATE 1   # else first rejection desyncs the run
open _build/apple/macos/Logseq.app
```
