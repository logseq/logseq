# Logseq macOS native app — roadmap

Daemon-backed SwiftUI app: the full `deps/ui` OCaml view/model layer
compiled natively (`native_embed`), LUI patch batches rendered by the
LUI Apple backend, `logseq-*` extension components implemented in
Swift. Goal: feature parity with the Electron app.

## Done

- App shell: launch → spawn `deps/db-worker/bin/main.exe` daemon →
  `create-or-open-db` → search index → boot → render.
- Sidebar: navigations (journals/flashcards/pages/graph view),
  favorites, recent, tag titles — live data.
- Page view: outliner tree with bullets, indentation
  (`block-children-container` margin), page title, journal date,
  block-collapse carets, Tabler icons, dark-mode aware tokens.
- Editing loop (daily-use):
  - click into a block → native NSTextView editing
  - typing → input events → debounced 400ms autosave → daemon
  - Enter → split block / commit title
  - Tab / Shift-Tab → indent / outdent (structural + visible)
  - Escape → exit edit
  - Backspace-at-start → merge with previous block
  - persistence verified across quit → relaunch
- Event plumbing: Swift → OCaml `dom-event` fan-out with `target`
  ancestor snapshots for `closest()`/scope resolution; window-level
  click listeners; `pre_dispatch_hook` live-fields refresh;
  element-mount/unmount lifecycle events.
- Imperative dom-ops: focus, set-value, set-attr, class add/remove/
  toggle, scroll-into-view, set-selection-range, document-title,
  text-content (no-op — web semantics).
- Platform shims: timers (setTimeout via host threads), clipboard
  stubs, HTTP/SSE client with chunked decoding, transit codec,
  Js/JSON shims, async Host mailbox.
- Page [[ref]] link navigation: ref clicks resolve routes and open
  pages; mixed-content titles render correctly.
- Command palette (cmdk): Cmd+K toggles, autofocus, arrows/Enter/
  Ctrl-N/P navigate and run, Esc clear-then-close, outside click
  closes, row clicks run, create-page works.
- DOM event bubbling: dom-events bubble up the extension tree
  (bubble phase) before window listeners — ancestor handlers
  (buttons, menus, item headers) fire for hits on inner spans/svgs.
- Right sidebar: toggle button opens/closes the 420px panel
  (flex-shrink sibling), topbar tabs (Contents/Page graph/Help)
  render and emit clicks (Help dropdown works), item cards pack
  top with header row + actions (dots, close) + page preview,
  collapse via header click.
- Block context menu: right-click resolves the hit node via the
  frame store, emits `contextmenu` with clientX/Y + target snapshot;
  menu renders as an anchored overlay at the pointer and items
  dispatch (`ls:editor-command` → copy-ref → clipboard,
  open-in-sidebar → sidebar verified). Outside click dismisses;
  `mousemove` emits at node granularity for submenu hovers.
- Inline components: PDF asset blocks render `ls-pdf-asset` links;
  click opens a PDFKit `logseq-pdf` viewer in a right-side pane
  (title toolbar + close, container collapses on close). LaTeX
  `$$...$$`/inline renders via SwiftMath (MTMathUILabel). Fenced
  code blocks render the `ui-fenced-code-editor` tree with a
  Highlightr-backed NSTextView (atom-one light/dark themes,
  `data-lang` → language).
- File upload: native `onDrop` of files onto the window emits a
  `file-drop` platform event → `asset_dom.upload_paths` writes
  `graphs/<repo>/assets/` and inserts asset blocks via the same
  `insert-blocks` outliner op the web uploader uses (edit-target,
  page-target, journals fallthrough).

## In progress

- Context-menu polish: `cm_heading_row` renders vertically (needs
  isRow), `ui__dropdown-menu-sub-trigger` unstyled, icon/emoji
  picker surface untested, some commands stubbed OCaml-side
  (add-comment, copy-export-as, set-icon, add-reaction →
  "editor command not implemented").
- Slash commands / autocomplete popups (`#ui__ac-inner`): AC popup
  state works OCaml-side; positioning + item rendering on the Swift
  side is incomplete.
- Textarea polish: first keystrokes after mount can drop during the
  focus-settle window; selection/marks interplay untested.
- Right sidebar gaps: item reorder/drag, drop indicators, the resizer
  strip is inert (no width drag yet), item "open in sidebar" paths
  beyond the default Contents item untested.

## Remaining (Electron parity)
- Page properties UI (property rows, value editors).
- Views / queries / table + kanban renderers (OCaml code compiles;
  native surfaces not yet exercised end-to-end).
- PDF annotations: PDFKit viewer opens/closes; the annotation
  layer (highlight areas, sidebar notes) is not yet wired.
- Code editor polish: actions bar renders in-flow (web overlays
  top-right on hover); multi-line code sizes by line count, no
  horizontal soft-scroll parity yet.
- Whiteboards, graph view (canvas), plugins, RTC/sync UI,
  export (assets/filesystem flows partially stubbed).
- Slash menu, block refs/page-refs autocomplete positioning,
  keyboard-driven selection model polish.
- Cmd-K/W shortcuts, multi-window.
- Settings polish: accent-color custom picker (CC button),
  per-pane gaps documented in NOTES (no account/ai/plugins panes
  in the OCaml emitters yet).
- Accessibility pass (labels, rotor order), drag & drop blocks.

## Build / run

```sh
cd deps/ui && eval $(opam env --switch=5.5.0) && \
  dune build apple/native_embed.exe.o
cd ../.. && ./apple/build.sh    # produces _build/apple/macos/Logseq.app
LOGSEQ_ROOT_DIR=~/some-graph-dir \
  _build/apple/macos/Logseq.app/Contents/MacOS/Logseq
```

Daemon: spawned by `LogseqRuntime` on launch — the app picks a free
localhost port, passes `--owner-source electron`-style args (see
`LogseqRuntime.swift`), serves `POST /v1/invoke` (transit frames) and
`GET /v1/events` (SSE broadcasts). Kill: `pkill -f logseq-db-worker`.

## Architecture notes / pitfalls — see NOTES.md
