# Editor surface extension design

Status: draft. Feeds gpui-plan M4 (编辑体验) and the remaining
`TODO(component)` keep-sites in `src/pages/page.ml`, `src/blocks/tree.ml`,
`src/core/ui_parts.ml` (editor_wrapper/editor_inner/mock_text), and
`src/core/web_dom.ml` (textarea_of/build_mock_text/caret_popup_pos).

## Why an extension, not a kind

The block editor is the one place where a component kind cannot carry the
contract:

- Each platform must use a *native* text widget to get IME composition,
  selection, spellcheck, and touch keyboards: `textarea` on web,
  `NSTextView` on Apple, `gpui-component` Editor on GPUI. A `editor` kind
  in the shared schema would force every host to implement the same
  contract anyway — that is exactly what the extension channel exists for
  ("只有平台特殊扩展的才可以走扩展").
- The contract is mostly *commands and event payloads*, not props:
  set-selection-range, caret-rect, keydown with caret context, blur.
  Props alone cannot express these.
- Logseq-specific (block uuid, editing scope, mock-text caret mirror) —
  does not belong in `Lui_elements` core.

## Component spec: `logseq-editor`

Replaces `.editor-wrapper > .editor-inner > textarea#edit-block-<uuid> +
.mock-text` and every `Web_dom.textarea_of`/`el_set_selection_range`/
`caret_popup_pos` call site.

### Props

| prop | type | notes |
|---|---|---|
| `block-id` | string | replaces the `edit-block-<uuid>` element id; the host scopes lookups by node id, not document-wide id |
| `value` / `value_signal` | string | model buffer; web keeps the existing cutoff dedup so unrelated publishes never overwrite in-progress typing |
| `placeholder` | string | |
| `multiline` | bool | block editor vs single-line inputs |
| `autofocus` | bool | focus on mount (press-seq resolves `*:focus` before the pending-focus retry) |
| `editing` | bool | whether this instance currently owns the edit session (tree mounts only one editor per scope) |

### Events (host → OCaml, payload JSON)

| event | payload | replaces |
|---|---|---|
| `input` | `{value, selectionStart, selectionEnd}` | live_buffer reads of `.value` |
| `keydown` | `{key, value, selectionStart, selectionEnd, shiftKey, ctrlKey, metaKey, altKey, repeat, composing}` | `events:"keydown"` + `el_selection_start/end` reads |
| `blur` | `{value}` | `events:"blur"` commit path |
| `compositionstart` / `compositionend` | `{value}` | IME gating that currently lives in keydown filtering |

Every event carries the caret coordinates the handler needs so
`editor_keys.ml`/`editor_actions.ml` stop round-tripping into the DOM.

### Commands (OCaml → host)

Same channel family as `Host.dom_op`, scoped to the extension node id:

| command | args | replaces |
|---|---|---|
| `focus` | `{position: "start"\|"end"\|index}` | `el_focus` + `el_set_selection_range el n n` |
| `set-selection-range` | `{start, end}` | `Web_dom.el_set_selection_range` |
| `caret-rect` | — → `{left, top, lineTop}` | `caret_popup_pos` + the whole `.mock-text` mirror |
| `scroll-height` | — → `px` | auto-grow measurement |

`caret-rect` is the key replacement: today `build_mock_text` rebuilds a
hidden grapheme-per-span mirror just to measure caret position. Each
platform has a real API instead — web can keep mock-text internally,
Apple `NSTextView` layoutManager, GPUI the editor's own text layout.

## Per-platform implementation

- **web**: the current `dom ~tag:"textarea"` + `mock_text` code moves
  *under* the extension registration (`logseq-editor` handled by the
  existing web extension host). View code swaps `dom`/`Ui_parts.editor_*`
  for the extension node; `Web_dom.textarea_of`/`caret_popup_pos` become
  command handlers. Zero behavior change for e2e locators — the
  extension emits the same `.editor-wrapper` DOM.
- **apple**: NSTextView representable behind the extension; mock-text is
  dropped (layoutManager gives caret rects). `apple/logseq_dom.ml`
  textarea path retires with it.
- **gpui**: `gpui-component` editor entity per node (stateful — hold it
  in the node map like SelectState/TableState). Caret rect from the
  editor's line layout. IME composition is platform-native by
  construction.

## Sibling embeds (out of scope, same pattern)

These stay `dom` until their own extension lands; the editor spec is the
template:

- **CodeMirror** (`block_display_type = "code"`) — the mounted instance
  IS the editor; needs a `logseq-codemirror` extension (web keeps the
  mount, apple/gpui stub or native equivalent).
- **katex** — mounts by generated `#ls-katex-*` id; `logseq-katex`
  extension (web: katex render; others: stub/degraded text).
- **pdf/media/em-emoji** — platform embeds, already on the "extension
  only for platform-specific" list.

## Migration order

1. Register `logseq-editor` in the web extension host; move
   `Ui_parts.editor_wrapper/editor_inner/mock_text` + `Web_dom`
   textarea helpers under its implementation (no view-code change yet).
2. Swap `editor_el` (tree.ml) and the page-title editor (page.ml) to the
   extension node; route `editor_keys`/`editor_actions` through events +
   commands. Delete `Web_dom.textarea_of`/`build_mock_text`/
   `caret_popup_pos` call sites.
3. Apple twin: NSTextView extension impl; drop the apple mock-text/
   textarea copies.
4. GPUI: gpui-component editor; M4 e2e (typing, IME, popup caret
   positioning, selection ops) via `TestAppContext`.
5. Then the sibling embeds above, each its own PR.

## What this does NOT solve

The remaining ~140 `TODO(component)` sites are mostly **delegated-event
data-\* contracts** (`data-ref`, `data-cid`, `containerid`, `blockid`,
`data-cmdk-item`), **virtuoso/virtualization scaffold**
(`data-virtuoso-scroller`, `data-level`, lazy-mount), and **event payload
gaps** (shiftKey/interactive clicks, mouseenter/leave). Those need their
own answers — likely a `logseq-virt` extension for virtualization and a
small "opaque handle" convention for imperative lookups — and are tracked
separately in `component-migration.md`'s leftover inventory.
