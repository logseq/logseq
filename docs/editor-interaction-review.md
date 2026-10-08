# Editor interaction review — deps/ui (LUI) vs master cljs

Audit of the rich-text outliner editor's interaction surface in the LUI web
app (`deps/ui`, served via `scripts/serve-static.mjs`, tested on
`index.html?rtc-test=true` journal blocks) against master cljs Logseq
behaviour. Method: CDP-driven pointer/key events plus `ClipboardEvent`
dispatch, cross-checked against `src/main/frontend/` (block.cljs mousedown
modifiers, editor.cljs keydown/clipboard, handlers).

Status legend: **parity** = matches master; **fixed** = gap found and fixed in
this branch; **exception** = intentional divergence.

## Caret

| Interaction | Status | Evidence |
|---|---|---|
| click → caret at click offset | parity | px-verified caret rect after click |
| arrow left/right incl. across `[[ref]]` atomic runs | parity | caret rect moves stepwise |
| arrow left/right at block edges → neighbour block | parity | editing focus moves to prev/next block |
| arrow up/down **inside a multi-line block** | **fixed** | was dead: inset caret bar meant `r.y-1`/`r.y+r.h` hit the same line; `Edit_input.vertical` now resolves the adjacent line from `m.lines` and hit-tests its midpoint |
| arrow up/down at first/last line → cross block | parity | verified before/after the fix |
| Home/End, cmd+left/right | parity | caret rect at line edges |

## Selection

| Interaction | Status | Evidence |
|---|---|---|
| Esc → block select, arrows move, shift+arrows extend | parity | `.ls-block.selected` set grows/shrinks |
| shift+up past topmost block → conj page title | **fixed** | cljs `navigable-sibling-block` treats `.ls-page-title` as a block; `extend_selection` now conj's the title row's `data-blockid` when `prev_visible` yields none. Verified: {body} → {body, title} matches master |
| Enter → re-enter edit at caret 0 | parity | |
| shift+click range select | **fixed** | `on_click` ignored modifiers; `Block_selection.modifier_select` (pointerdown) now implements cljs `mousedown` semantics: shift = range from anchor, meta = toggle block in selection, meta+shift = append range; skipped on `.block-control-wrap`, suppresses the follow-up click |
| meta+click toggle block | **fixed** | same change; verified 2-block discontiguous selection |
| Backspace/Delete on block selection → delete blocks | parity | 2 selected blocks deleted, selection cleared |
| multi-block pointer drag selection | parity | `Block_selection` pointermove range |

## Editing

| Interaction | Status | Evidence |
|---|---|---|
| Enter splits block at caret | parity | |
| Backspace at caret 0 merges into previous | parity | caret lands at junction offset |
| Tab / Shift+Tab indent/outdent | parity | |
| mod+Enter cycles TODO marker | parity | |
| undo/redo chain | parity | repeated undo/redo restores states |
| `#tag and text` + Enter attaches tag class and erases query | parity | matches cljs `apply_tag`/`#`-query semantics (not a data-loss bug) |

## Autocomplete popups

| Interaction | Status | Evidence |
|---|---|---|
| `/` commands: open, query filter, arrows, Enter select, Esc dismiss | parity | `/today` inserts date |
| `[[` page search: open/nav/select/dismiss, anchor stable while typing | parity | |
| `((` → autopair + "use page ref" toast, no block-ref search | parity | same warning as master |
| `#` tag-as-class, `# `/`#+` close | parity | `popups_state.on_buffer_change` ports `handle-last-input` |

## Edit vs read mode

| Interaction | Status | Evidence |
|---|---|---|
| `[[ref]]` delimiters hidden in read, revealed while editing | parity | `ed-delim`/`ed-hidden` run classes |
| formatting markers reveal at caret | parity | |
| surrounding layout stable (no reflow) | parity | `.ed-overlay` absolutely positioned |

## Clipboard

| Interaction | Status | Evidence |
|---|---|---|
| paste plain text at caret / mid-text | parity | `ClipboardEvent('paste')` → inserted at caret |
| copy with collapsed selection → `[[uuid]]` block ref | parity | clipboardData carries block-ref |
| cut / copy markdown + blocks | parity | `on_copy`/`on_cut` in editor_keys.ml |

## Drag & bullets

| Interaction | Status | Evidence |
|---|---|---|
| bullet-handle drag reorders block | parity | dnd-kit pointer sensor; block moved below sibling on drop |
| bullet click → zoom to block | parity | navigates `#/block/<uuid>` |
| shift+bullet click → open in right sidebar | **fixed** | cljs `bullet-on-click` shiftKey → `sidebar-add-block!`; now dispatches `ls:open-right-sidebar` in `editor_keys.ml` |

## Keys

| Interaction | Status | Evidence |
|---|---|---|
| mod+K command palette open/close/search/nav | parity | `cmdk_view.ml` document listener |
| g h / g j page nav, t t theme toggle | parity | |
| chords owned by other layers (`mod+k`, `mod+shift+m`) pass through | parity | `owned_strokes` exclusion |

## Changes in this branch

- `deps/ui/src/editor/edit_input.ml` — `vertical` rewritten to use the line
  table (`m.lines`) + adjacent-line midpoint hit-test (fixes dead intra-block
  up/down). Copied into `deps/ui/native/` via `native/dune` copy rule, so the
  native twin gets the fix.
- `deps/ui/src/editor/block_selection.ml` — added `modifier_select` in
  `pointerdown`: shift/meta+click block selection per cljs mousedown
  semantics; falls back to recording the clicked block as anchor when a stale
  anchor yields no range.
- `deps/ui/src/editor/editor_keys.ml` — `on_click` bullet branch:
  shift+click now opens the block in the right sidebar
  (`ls:open-right-sidebar`) instead of zooming.
- `deps/ui/test/edit_view_test.ml` — vertical-arrow tests updated to the new
  line-table contract (first/last line = no-op at model level; interior move
  hit-tests adjacent line).

## Gates

`OPAMSWITCH=5.5.0 opam exec -- dune build @all` clean;
`node _build/default/test/ui_test/test/test_main.js` → 1547 checks, 0
failures.
