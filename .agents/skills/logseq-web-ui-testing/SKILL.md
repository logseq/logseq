---
name: logseq-web-ui-testing
description: Run the Logseq web dev app locally and drive editor/block/sidebar UI flows for end-to-end testing (code blocks, calc, fenced code, right sidebar, settings/file routes).
---

# Logseq web app UI testing

How to run the browser app and reach common editor UI flows for E2E verification.

## Dev server

- Command: `pnpm watch` from repo root (runs gulp watch + `clojure -M:cljs watch app db-worker db-worker-node electron` + webpack watch). The web app is served by shadow-cljs dev-http at **http://localhost:3001** (`static/` dir).
- Requires **JDK 21+** (`JAVA_HOME=$HOME/.local/jdk21`); Java 17 fails the build.
- First compile takes ~1–3 min; watch `Build completed` in the pnpm log. Webpack builds `static/js/db-worker-bundle.js` — db-worker will hang without it.
- shadow-cljs `:app` build has a **lazy `:code-editor` module** (`frontend.extensions.code.editor`) loaded on first editor render — CodeMirror instances only exist after it loads.
- The dev app opens a **db graph** stored in OPFS (e.g. "Demo"). If none exists, the UI offers a New Graph dialog (name input + Submit; leave Cloud unchecked for local).
- Concurrent file edits trigger shadow watch recompiles — a transient `Compilation failed!` overlay clears itself once the file is saved valid again.

## DOM markers worth asserting

- CM6 editor: `.cm-editor`, `.cm-content` (contenteditable), `.cm-line`; wrapper `[data-logseq-code-editor-root]`; context map on `.__logseqCodeEditorContext`.
- Highlighted tokens: `.cm-content span[class]` — generated `ͼ*` classes (HighlightStyle).
- Calc results: `.extensions__code-calc` with `.extensions__code-calc-output-line` (one per input line); calc editor root has `data-lang="calc"`.
- Fenced block in block text: `.cp__fenced-code-block[data-lang]` containing its own `.cm-editor`; actions bar has a `select-language` button and Copy.
- `window.CodeMirror` is intentionally `undefined` (CM5 dropped).

## UI flows

- Insert a **code block**: click a block → type `/` → pick **Code block**. Or type ` `````` ` (six backticks) in a block to convert it. Set language via hover → "Choose language"/lang-name button → type in the filter input → click entry.
- Insert a **calc block**: `/` → **Calculator** (typing `/calculate` does NOT match — the label is "Calculator"). Editor autofocuses; each line evaluates live into the right-hand results column.
- Block with a ``` fence inside text: in a block editor, type text → **Shift+Enter** (soft newline) → ` ```lang ` → Shift+Enter → code → Shift+Enter → ` ``` ` → Escape. Plain Enter creates a NEW block; Shift+Enter inserts a newline inside it.
- Shift+Enter inside a code/calc editor creates a sibling block (captured before CodeMirror's own Shift-Enter keybinding).
- **Right sidebar**: shift+click the page title or any `[[page-ref]]` → opens that page in `#right-sidebar`; block bullet right-click → "Open in sidebar" opens one block. Toggle sidebar off with `t r` (press `t` then `r`).
- **File route editor** (:file): Settings (`#/settings`) → "Edit config.edn" → `#/file/logseq%2Fconfig.edn`, rendered by the same CM6 editor (clojure/edn mode).
- Editing inside a CM editor: click the `.cm-content` area; plain Enter adds a line; Ctrl+Z / Ctrl+Shift+Z for undo/redo; clicking outside blurs → `save-code-editor!` persists to the block (verify via F5 reload).

## Console checks

- `browser_console` evaluates JS — call it with NO `content` arg to dump the log buffer.
- In DevTools (Ctrl+Shift+J), the filter box accepts `codemirror`/`cm-` to spot editor errors fast.

## Devin Secrets Needed

None — the dev app needs no auth.
