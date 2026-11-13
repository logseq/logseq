# Editor surface: shared rich-text editor (Out-style)

Status: draft. Feeds the native editor milestone and the
`TODO(component)`
keep-sites in `src/pages/page.ml`, `src/blocks/tree.ml`,
`src/core/ui_parts.ml`, `src/core/web_dom.ml`.

Supersedes the earlier "native widget per platform" sketch: the editor
is **rendered by LUI nodes from shared OCaml** — the same view code runs
on web/apple/the OCaml host. Platform hosts provide only a text-input
conduit and
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
- **Model offsets are units of the stored string**, not always bytes:
  `Edit_model.create ~units` is `Bytes` (UTF-8 bytes — native OCaml and
  test corpora) or `U16` (UTF-16 code units — web). On web the db text
  is already a proper JS string, so `~units:U16` makes model offsets
  identical to DOM Range offsets and the conduit needs no byte↔UTF-16
  translation; native stays `Bytes` and translates at its own boundary
  (NSString is UTF-16). The same offset value means different
  things per platform, but offsets are view-local state — only text
  content crosses into the db.

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
  ocaml  — OCaml host text-input/IME handler + text layout measurement
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

- **props**: `block-id`, required String `source` (exact display-model
  text), `caret` (model-unit offset), `composition`
  (marked-text range while IME is active), `runs` (the emitted run
  spans `start,end,kind;…` in document order — measurement zips it
  against the rendered `.ed-r` elements)
- **events** → OCaml: `key {key, mods, repeat}`, `insert {text}`,
  `delete {kind: backward|forward|word|line}`, `composition {state,
  text, range}`, `focus`/`blur`, `pointer {offset}` (hit-tested text
  position for click-to-place-caret and drag-select), `dblclick {offset}`
  for source-word selection
- **commands** OCaml → host: `set-input-focus`, `caret-rect {offset} →
  {x, y, h}`, `selection-rects {first, last} → rects` and
  `line-ranges`/`offset-at {x, y}` — implemented per
  platform on the rendered run nodes (web: Range.getClientRects /
  caretRangeFromPoint on the run text nodes; apple: TextKit
  layoutManager; OCaml host: editor text layout)

### Source binding and native geometry requests

The canonical native and web `logseq-editor` schemas require `source`
without a default. The shared sink derives `source`, `runs`, `caret`, and
`composition` from the same `Edit_model.display_model` frame, including
IME preedit text. The Apple extension schema and its fingerprint must
declare the same required String property. Missing `source` is a
contract violation; it must not be replaced with an empty string.

All five native geometry operations include the exact issuing
display-model `source`, in addition to `block-id` and their arguments:

| Operation | Request fields |
| --- | --- |
| `caret-rect` | `block-id`, `source`, `offset` |
| `selection-rects` | `block-id`, `source`, `first`, `last` |
| `offset-at` | `block-id`, `source`, `x`, `y` |
| `line-ranges` | `block-id`, `source` |
| `scroll-height` | `block-id`, `source` |

The source is captured at issuance, not reconstructed when the host
receives the request. If no active editor matches `block-id`, the
operation emits no request and returns its normal no-data result
(`None` or `[]`), even if an older measurement is cached.
`set-input-focus {block-id, focused}` is unchanged and carries no source.
Geometry reply shapes are unchanged.

Before measuring, the native host must establish
`request.source == current editor snapshot.source == projected sink.source`.
This is byte-for-byte UTF-8 equality, not Swift's canonically equivalent
String equality: composed `é` and decomposed `e` + combining acute have
different byte offsets and cannot share a geometry request.
The projected run spans and text geometry must belong to that source.
AppKit input-method geometry also requires its native input buffer to
equal that layout source before converting a character-range offset.
The host must finish applying all metadata batches in a callback array
before attempting geometry; a Core flush is not an acknowledgement that
the host has committed those batches. A missing active editor or a
source mismatch is stale lifecycle work, not permission to clamp offsets,
invent a source, or slice run spans against a different document.

For example, an editor containing `/upload` can issue
`caret-rect {block-id: B, source: "/upload", offset: 7}` before the slash
command clears its trigger text. The command then publishes `source: ""`
with `runs: "0,0,z"`. If the old request arrives after the clear, its
`source: "/upload"` identifies it as stale even if the same block and
extension node remain mounted. It must not measure offset 7 in the empty
source. Conversely, old projected runs `0,7,p;7,7,z` must not be sliced
using a newer empty editor snapshot, even for a new request at offset 0.
An actually empty active editor legitimately issues `source: ""` with
its empty-model offsets; this is distinct from a missing source.

All conduit geometry uses logical pixels relative to the block editor;
source offsets retain the model's units. Native hosts convert drawable
pixels at this boundary. Range geometry must include every selected
visual fragment, including soft-wrap boundaries and bidirectional runs.
Do not infer a selection rectangle by subtracting two caret positions.

Selection highlights use shared LUI views with typed left/top insets.
The OCaml host paints its caret from current glyph geometry; Web uses
the shared caret view. The conduit itself draws no text.

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
4. Apple conduit (UIKeyInput) + OCaml host conduit; keymap/model
   already
   shared so each is adapter-only work.
5. M4 e2e: typing, IME (中文 composition), delimiter reveal, popup caret
   positioning, block select, split/merge.

## Explicitly out of scope

CodeMirror code blocks, katex, pdf/media/em-emoji embeds — separate
extensions (platform-specific by the same rule). The ~140 other
`TODO(component)` sites (delegated-event `data-*` contracts, virtuoso
scaffold, event payload gaps) are tracked in `component-migration.md`.
