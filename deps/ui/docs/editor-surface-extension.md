# Editor surface: shared rich-text editor (Out-style)

Status: draft. Feeds gpui-plan M4 (编辑体验) and the `TODO(component)`
keep-sites in `src/pages/page.ml`, `src/blocks/tree.ml`,
`src/core/ui_parts.ml`, `src/core/web_dom.ml`.

Supersedes the earlier "native widget per platform" sketch: the editor
is **rendered by LUI nodes from shared OCaml** — the same view code runs
on web/apple/gpui. Platform hosts provide only a text-input conduit and
text measurement. This follows Out's split (`core/src` editing model +
thin platform adapters), but for the db version and with the render side
shared too, since deps/ui view code is already cross-platform OCaml.

## What we take from Out (logseq/Out)

- **Run segmentation** (`core/src/inline_markup.ml`): block source → flat
  positioned runs covering 100% of bytes — `Plain`, `Delim` (grey only
  while caret is inside its reveal range), `Atomic` (collapse to a pill
  while caret is outside). Typora-style WYSIWYG editing.
- **Editing model** (`core/src/editor_view.ml`): caret arithmetic in a
  consistent unit, `delim_shown` reveal rule, first/last-line detection
  for arrow-key focus moves, `shape` signature so typing inside a plain
  span skips the structural rebuild, keymap → semantic `key_action`
  (split/indent/merge/focus-next/select-next/menu/palette…).
- **Keymap table** mirroring OG semantics — the platform collects raw
  keys, the model decides.

## What differs (db version, not file version)

- Buffer/commit goes through `block/title` transactions — no md/org
  serialization, no DOM-walk round-trip.
- Run segmentation consumes our own inline parser
  (`src/render/render_inline.ml` already produces db-semantic display
  spans); the edit-mode run layer is added alongside it, not ported from
  Out's file-syntax parser.
- Menu/completion data sources (`/`, `[[`, `((`, `#`) query the db, not
  file-derived indexes.
- We are not blocked on Out's unfinished surfaces (table/property
  editing) — block-type coverage follows our db schema.

## Architecture

```
deps/ui/src/editor/
  edit_runs.ml      — block source → Plain/Delim/Atomic runs (db parser)
  edit_model.ml     — buffer, caret, selection, reveal, shape, keymap
  edit_view.ml      — runs → Lui_elements tree (shared, one impl)
  edit_input.ml     — input/composition event → model updates

platform conduit (the only per-platform code)
  web    — hidden input + DOM text measurement (Range.getClientRects
           works on real text nodes — no mock-text needed)
  apple  — UIKeyInput/NSTextInputClient conduit + TextKit measurement
  gpui   — gpui text-input/IME handler + text layout measurement
```

### Rendered structure (shared OCaml emits)

```
block-editor (column)
  line (row, one per source line)
    run nodes: text (plain), text ~visible:reveal (delim),
               pill component (atomic, non-editable)
  selection overlay + caret element (LUI nodes)
  hidden input sink node (the extension — see below)
```

### Extension: `logseq-editor` (input conduit only)

The extension carries **no visual content** — it is the platform's
text-input/IME/measurement channel bound to one block editor:

- **props**: `block-id`, `caret` (UTF-16 offset), `composition`
  (marked-text range while IME is active)
- **events** → OCaml: `key {key, mods, repeat}`, `insert {text}`,
  `delete {kind: backward|forward|word|line}`, `composition {state,
  text, range}`, `focus`/`blur`, `pointer {offset}` (hit-tested text
  position for click-to-place-caret and drag-select)
- **commands** OCaml → host: `set-input-focus`, `caret-rect {offset} →
  {x, y, h}` and `line-ranges`/`offset-at {x, y}` — implemented per
  platform on the rendered run nodes (web: Range.getClientRects /
  caretRangeFromPoint on the run text nodes; apple: TextKit
  layoutManager; gpui: editor text layout)

Selection highlight and the caret blink are LUI-rendered (shared), so
the conduit never draws text itself.

## Hard parts (flagged early)

- **Line breaking is host-side.** OCaml doesn't know where wraps land;
  `caret-rect`/`offset-at` must answer over wrapped visual lines, so the
  host measures against the real rendered nodes. First/last-line focus
  moves use `caret-rect` + `offset-at`, not OCaml arithmetic.
- **IME composition**: conduit reports `composition` events; the model
  marks the composing range and renders it (underlined run) instead of
  committing until `compositionend`.
- **ed-pad/ed-tail quirks still apply on web**: a caret landing after a
  trailing hidden delimiter needs a zero-width landing node per line —
  keep an `ed-pad`-style trailing span in the emitted line structure.
- **Perf**: `shape` signature skip-rebuild per keystroke; typing must
  stay O(local run diff), never re-segment the page.
- **Long blocks**: per-line containers keep patches narrow; no full-block
  remount on delimiter reveal (reveal is `~visible`/`class_signal` on the
  run node).

## Migration order

1. `edit_runs` + `edit_model` + unit tests (pure OCaml, no platform).
2. `edit_view` rendering block source as run nodes + `logseq-editor`
   web conduit (hidden input wiring input/composition/key/caret-rect).
3. Swap `editor_el` (tree.ml) and page-title editor (page.ml) to it;
   delete `Web_dom.textarea_of`/`build_mock_text`/`caret_popup_pos` and
   `Ui_parts.editor_*`.
4. Apple conduit (UIKeyInput) + gpui conduit; keymap/model already
   shared so each is adapter-only work.
5. M4 e2e: typing, IME (中文 composition), delimiter reveal, popup caret
   positioning, block select, split/merge.

## Explicitly out of scope

CodeMirror code blocks, katex, pdf/media/em-emoji embeds — separate
extensions (platform-specific by the same rule). The ~140 other
`TODO(component)` sites (delegated-event `data-*` contracts, virtuoso
scaffold, event payload gaps) are tracked in `component-migration.md`.
