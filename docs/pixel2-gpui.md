# Round-2 parity audit: gpui host vs master (cljs)

Slice: `pixel2-gpui`. Fixture: `scripts/parity/pixel` PPFixture (28 blocks
+ 2 properties), same seeded content and order on both ends, 1280x800,
light + dark. Master ref = `pnpm watch` cljs app; gpui = `deps/ui/gpui/host`.

## Fixes landed (deps/ui + gpui host)

- **Blockquote unstyled** — `ls-blockquote` was never registered for the
  gpui backend, so `> quote` rendered as plain text. Registered the
  lui-core.css rule (`padding:8px 16px`, 4px left bar, tinted bg, 8px
  vertical margin) in `deps/ui/gpui/host/src/logseq_ext.rs`. The
  `--lx-gray-*` var fallbacks master's CSS uses do not resolve on gpui
  (dark steps and `-alpha` steps are intentionally unset in
  `lui-gpui/style.rs`), so the bar/bg bind to `--ls-border-color` /
  `--ls-tertiary-background-color` instead. Verified: bar + bg now
  visible in dark theme.
- **Markdown table rendered as stacked plain lines** — gpui has no real
  table layout; `tr`/`td`/`th` tags render as vertical containers so a
  pipe table collapsed to one column of text. `src/render/render.ml`
  `table_el` (both variants) now carries `data-style` attrs (the gpui
  inline-style channel; the web DOM ignores the attribute): `tr` gets
  `display:flex;flex-direction:row;width:100%`, cells get
  `border:1px solid var(--ls-border-color);padding:6px;flex:1`, `th` adds
  the `--lx-gray-03`/`--ls-tertiary-background-color` header fill, the
  table gets `width:98%`. Verified: header row, cell borders, equal-width
  columns.
- **Collapse caret oversized** — `Ui_parts.rotating_arrow` /
  `rotating-arrow-down` rendered at 16px vs master's ~13px caret.
  Dropped to 13px (`src/core/ui_parts.ml`, `src/blocks/tree.ml`).
- **Block properties area lost its indent** — `.ls-block-content-indent`
  (padding-left:45px), `.ls-block-properties` (margin 2px/7px) and
  `.properties-panel` (radius/overflow) were unregistered on gpui, so
  property rows rendered at content-left edge. Registered all three.

## Findings — functional

- **[P1] External paste into the outliner is broken.** cmd+V of a
  ~35-line markdown list pasted only the prefix up to the table block,
  dropped tab-indentation nesting entirely (all children flattened to
  root), and fired `ui/save-changes-error` — the error toast then
  persists (error toasts have duration 0 by design). Path:
  `src/editor/editor_actions.ml` paste_markdown_blocks ->
  `thread-api/paste-extract-blocks` + `insert-blocks`; the failure is
  surfaced at `src/editor/outliner_ops.ml:851`.
- **[P1] `meta+shift+p` leaks to add-property.** Pressing cmd+shift+p
  opened the command palette AND the "Add or change property" dialog.
  The palette chord (`mod+shift+p` -> `command-palette/toggle`) and the
  `mod+p` -> `editor/add-property` binding both dispatch from
  `editor_keys.ml` (`on_global_key`/`on_normal_key`); likely the stroke
  matcher does not require the shift flag when comparing `mod+p`, or the
  stroke is emitted as `mod+p` with shift folded into the key name.
  Owner: `src/editor/editor_keys.ml` `stroke_of`/`on_global_key`.
- **[P2] `t t` chord did not toggle theme** in normal mode (worked via
  cmd+shift+p -> "Toggle between dark/light theme"). The two-stroke
  chord machinery (`chord_seq`) appears to lose or time out the first
  `t` stroke.
- **[P3] Stale/duplicate toasts** — `ui/save-changes-error` remained on
  screen indefinitely (consistent with cljs duration-0 error toasts, but
  on gpui it also overlapped and obscured the all-pages table header).

## Findings — visual deltas remaining

- **[P2] Property rows render scattered.** `rating : 5` prints as a
  raw `name : value` line and `source-url` shows icon+key at left with
  the value pushed to the row's far right edge; master renders aligned
  two-column rows (key panel min 150px, value immediately right of it).
  Cause is inside `properties_area.panel_row`/`value_cell` on gpui —
  the key column (`min_width:150 max_width:260`) and the grow value
  cell land correctly, but the value's inner content right-aligns.
- **[P2] Display math (`$$..$$`) renders left-aligned inline** in its
  own line instead of centered like master's `.latex` display block.
  The katex.rs extension renderer does `w_full().flex().justify_center()`
  for `display=true`; the slot path (`render_slot`) or the wrapper the
  inline renderer mounts it in does not stretch.
- **[P3] Bullet column ~30px narrower than master** — block content
  starts ~30px left of master's 45px indent convention; bullets and
  text baseline sit closer to the left edge.
- **[P3] Indent guide lines / children left border** — master draws a
  `.block-children-left-border` hover pill; gpui emits the element
  (`data-style` positioned absolute) but it is invisible in practice —
  `position:absolute` children of plain flex containers have no
  positioned-ancestor semantics on gpui's taffy layout.
- **[P3] Page header chrome** — ops row (`Add icon`/`Set property`)
  always-visible and centered vs master's hover-revealed, left-aligned
  actions; page title centered vs left; missing the thin divider under
  the title.
- **[P3] All-pages table** — page names render underlined instead of
  blue links; row-count chip shows `>` glyph vs master's `All 7 +`;
  toolbar icons differ. Column headers (Page name/Backlinks/Tags/
  Created/Updated) present.
- **[P3] Tag chips / task items** — `- [x]`/`- [ ]` task items render
  as literal text with a trailing tag chip in both apps (parity); gpui
  adds no checkbox affordance, matching master.
- **[P3] Right-side vertical scrollbar** visible inside code block
  areas on gpui where master hides it.

## Confirmed parity

- Code block: line numbers, syntax colors, header bar + Copy button —
  near-identical to master.
- Tag chips, `[[page refs]]`, `((block refs))`, highlight marks render
  with correct colors in both themes.
- Dark theme: body, sidebar, code block all match master's palette
  (earlier "light sidebar in dark mode" observation was a mid-repaint
  screenshot artifact, verified non-issue).
- cmdk (cmd+k) overlay, left sidebar nav (Journals/Flashcards/Pages/
  Graph view/Favorites/Recent), all-pages route, page navigation,
  block collapse/expand, scrolling — all functional.
- Page menu ("..."), quick-add, breadcrumbs render correctly.

## Not audited / deferred

- Editor AC (autocomplete) menus, inline edit caret/focus ring, block
  context menu contents, right sidebar panels, settings dialog pages,
  journals view content, linked references at page bottom, flashcards,
  graph view, image embed rendering (fixture `tiny` image block shows
  placeholder box on gpui).
- `drive_test.exe` not rerun (OCaml changes limited to view attrs; the
  wire shape is unchanged).

## Verify

- `OPAMSWITCH=5.5.0 opam exec -- dune build @all` — clean.
- `node _build/default/test/ui_test/test/test_main.js` — 1546 checks,
  0 failures (requires `npm i` inside deps/ui for transit-js +
  @tanstack/virtual-core).
- `cargo check`/`cargo build` in deps/ui/gpui/host — clean (2
  pre-existing warnings in main.rs signal casts).
