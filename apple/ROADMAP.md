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

## In progress

- Command palette (cmdk): overlay renders but is not yet wired to
  keyboard activation or result navigation.
- Block context menu (right-click menu structure exists in OCaml
  view code; Swift side needs a contextMenu surface for it).
- Slash commands / autocomplete popups (`#ui__ac-inner`): AC popup
  state works OCaml-side; positioning + item rendering on the Swift
  side is incomplete.
- Page [[ref]] link navigation: links emit click; route resolution
  lands in the model but some `pull` paths are still stubbed.
- Textarea polish: first keystrokes after mount can drop during the
  focus-settle window; selection/marks interplay untested.

## Remaining (Electron parity)

- Right sidebar (panel stack, drag).
- Page properties UI (property rows, value editors).
- Views / queries / table + kanban renderers (OCaml code compiles;
  native surfaces not yet exercised end-to-end).
- PDF annotations: PDFKit-backed `logseq-pdf` extension component
  (mature-lib choice per Tienson).
- LaTeX: SwiftMath rendering for `$$...$$` blocks.
- Code highlight: Highlightr in the code editor component.
- Whiteboards, graph view (canvas), plugins, RTC/sync UI, settings
  pages, export (assets/filesystem flows partially stubbed).
- Slash menu, block refs/page-refs autocomplete positioning,
  keyboard-driven selection model polish.
- Menubar/app menus (macOS-native idioms), Cmd-K/W shortcuts,
  multi-window.
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
