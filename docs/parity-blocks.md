# Block rendering + editing parity audit

Slice: BLOCK RENDERING + BLOCK EDITING.

- **master**: `logseq/logseq` @ `22a29b30de` (cljs web app, shadow-cljs `:app` + static on :3001)
- **LUI**: `devin/component-migration` @ `a3dc4ff1f8`, lui pinned to main @`315cc9f`, served on :3003 (`index.html?rtc-test=true`), zero local patches
- Fixture: identical `Parity fixture` page seeded on both via `logseq.api` (create_page + append_block_in_page + upsert_block_property). ~30 blocks covering plain text, bold, italic, strike, inline code, page refs, tags, multi-word tag, block ref, block embed, inline/display KaTeX, highlight, TODO/DOING/DONE + [#A]-[#C] priorities, H1-H3, quote, list with nested children, `- [ ]`/`- [x]`, python fenced block, md table, remote image, CJK long text, 4-deep nesting, collapsible parent + grandchild, block properties.
- Shots: `docs/parity-shots/blocks/` (master-*.png / lui-*.png pairs, both 1440x900, same page state).

## Status legend

- `ok` — visually equivalent
- `divergent` — renders on both but differently
- `missing` — feature absent on LUI
- `broken` — errors / non-functional state on LUI

| # | Feature | master shot | lui shot | status | severity | notes |
|---|---------|-------------|----------|--------|----------|-------|
| 1 | Plain block text | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Identical. |
| 2 | Bold / italic / strikethrough | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Identical inline styling. |
| 3 | Inline `` `code` `` | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Gray chip identical on both. |
| 4 | `[[page refs]]` | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Blue link with literal `[[]]` delimiters on both. |
| 5 | `#tags` | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Blue `#tag` inline on both. |
| 6 | `#[[multi word tag]]` | master-01-formatting-top.png | lui-01-formatting-top.png | divergent | minor | LUI renders a stray floating duplicate `#multi word tag` link pinned mid-right of the page (~x=865,y=440) in addition to the inline one; master has only the inline tag. Visible in every LUI fixture shot. |
| 7 | `((block refs))` | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Raw `((uuid))` text on both; resolution not implemented on either. |
| 8 | Block embed `{{embed}}` | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Both show the same `{{embed}} is deprecated. Use '/Node embed' command instead.` notice. |
| 9 | KaTeX inline `$a^2+b^2=c^2$` + display `$$E=mc^2$$` | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Both typeset identically; display math centered. |
| 10 | `==highlight==` | master-01-formatting-top.png | lui-01-formatting-top.png | divergent | major | Master renders yellow background highlight; LUI renders literal `==Highlighted text==`. |
| 11 | TODO/DOING/DONE markers | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Keyword text renders the same on both. |
| 12 | Task priorities `[#A]`/`[#B]`/`[#C]` | master-01-formatting-top.png | lui-01-formatting-top.png | divergent | minor | Master renders a right-edge `#A]`/`#B]`/`#C]` pill link per task row; LUI shows the inline text only, no pill. |
| 13 | Headings H1–H3 | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | Identical heading levels + H1/H2 underline rule. |
| 14 | Quote `>` | master-02-list-checkboxes.png | lui-02-list-checkboxes.png | divergent | major | Master renders a styled gray rounded quote box; LUI renders the literal `> Quote block content line` text. |
| 15 | Lists (`- item`) | master-02-list-checkboxes.png | lui-02-list-checkboxes.png | divergent | blocker | Both render the literal `-` + bullet (same as master DB). **LUI never renders the nested children** (item one/two, deep child absent) — see #25. |
| 16 | `- [ ]` / `- [x]` checkboxes | master-02-list-checkboxes.png | lui-02-list-checkboxes.png | ok | — | Literal text on both; no interactive checkbox on either (DB app behavior). |
| 17 | Fenced code block `python` | master-03-code-table.png | lui-03-code-table.png | ok | — | Same syntax-highlight + line numbers + tinted bg. No copy button on either. |
| 18 | Markdown table | master-03-code-table.png | lui-03-code-table.png | divergent | major | Master renders a bordered table w/ header row; LUI renders the literal `\| Col A \| Col B \|` source. |
| 19 | Images (remote URL) | master-04-image-cjk.png | lui-04-image-cjk.png | divergent | major | Master renders the remote image (unscaled, very large); LUI renders nothing under `Image below:` — blank region. |
| 20 | Long text + CJK | master-04-image-cjk.png | lui-04-image-cjk.png | ok | — | Mixed CJK/EN paragraph renders identically. |
| 21 | Nested indentation / indent guides | master-05-nested-collapsed.png | lui-05-nested-collapsed.png | missing | blocker | Master indents children (small dot bullets, no guide lines). LUI leaves a ~230px blank region under `Nested level 0` — children absent. |
| 22 | Collapse toggle + folded state | master-05-nested-collapsed.png | lui-05-nested-collapsed.png | missing | major | On LUI children never render so there is nothing to fold; master renders expanded children under `Collapsible parent` (programmatic `set_block_collapsed` did not take effect visually). |
| 23 | Timestamps / properties under block | master-06-properties.png | lui-06-properties.png | divergent | major | Master renders `source-url → https://example.com` and `rating → 5` property rows under the block; LUI shows nothing under the same block (properties exist in db — `upsert_block_property` succeeded). |
| 24 | Hover affordances (block) | master-07-hover-block.png | lui-07-hover-block.png | ok | — | No visible hover affordance on either beyond the always-on bullet. |
| 25 | **Child blocks render** | master-05-nested-collapsed.png | lui-05-nested-collapsed.png | missing | blocker | LUI does not mount ANY child block: `- item one` not in DOM at all; blank space where the children container should be. Affects lists, nesting, collapsible trees — the biggest gap in this slice. `get_page_blocks_tree` also throws `TypeError: Cannot read properties of undefined (reading 'slice')` on LUI. Console shows `[sidebar loader failed]` + `Invalid_argument` MelangeErrors. |
| 26 | Block selection (Escape → select, highlight) | master-multisel.png | lui-multisel.png | missing | blocker | Master: Escape exits editing and selects the block (blue row highlight + floating toolbar: tag / comment / Copy / Set property / Unset property / trash / more). LUI: no highlight, no toolbar. |
| 27 | Multi-select (Shift+↓) | master-multisel.png | lui-multisel.png | missing | major | Master extends the blue selection to a second block; LUI no-op. |
| 28 | Block editing mount (click into text) | master-editing.png | lui-editing.png | missing | blocker | Master focuses `TEXTAREA.uniline-block` (edit state mounts). LUI: `activeElement` stays `BODY`, no caret/editor — editing does not mount (known input-focus gap). Editing-flow rows below are all missing. |
| 29 | Editing shows raw markdown | master-editing.png | lui-editing.png | missing | blocker | N/A on LUI (no editing). |
| 30 | Drag handle / gutter interaction | master-bullet-hover.png | lui-bullet-hover.png | divergent | minor | No visible drag handle on either at rest/hover. Clicking the gutter area behaves differently: master creates a stray empty child block under the target; LUI switches the bullet to a filled (selected-looking) state. |
| 31 | Checkbox interaction | master-02-list-checkboxes.png | lui-02-list-checkboxes.png | ok | — | Not interactive on either; literal text parity. |
| 32 | Block-ref hover preview | master-ref-hover.png | lui-ref-hover.png | ok | — | No hover preview on either (raw `((uuid))` text). |
| 33 | Code-block copy button | master-03-code-table.png | lui-03-code-table.png | ok | — | Not present on either. |
| 34 | Scroll long page | master-01-formatting-top.png | lui-01-formatting-top.png | ok | — | `scrollIntoView` works on both; page renders fully. |
| 35 | Empty-state journal | master-journal.png | lui-journal.png | divergent | minor | Both show today's journal (`Oct 6th, 2026`) with one empty bullet. LUI additionally shows a `#Journal` tag next to the title; master does not. |
| 36 | Tag page (`#Journal`, linked filter target) | master-tag-page.png | lui-tag-page.png | broken | major | Master renders `# Journal` with the entities table (All 1: name/tags/created/updated/page + toolbar). LUI is stuck on `Loading...` indefinitely — tag pages never resolve. |
| 37 | Console health during fixture use | (n/a) | (n/a) | broken | major | LUI fires a burst of `UNHANDLED-REJECTION MelangeError: Invalid_argument` + `PAGE Invalid_argument` (`expected patch generation 9, received 13…`) during rapid sequential `append_block_in_page` calls, plus `[sidebar loader failed]`. Page content still renders. Master: one pre-existing React unique-key warning. |

## Top findings

1. **Child blocks do not render at all on LUI** (blocker). Every nested structure — list items, deep-nesting chain, collapsible children — is absent from the DOM; the children container occupies space but stays empty. `get_page_blocks_tree` throws, and the console shows `[sidebar loader failed]` + `Invalid_argument` MelangeErrors. This single bug makes lists, indentation, collapse, and fold state all unverifiable/missing.
2. **Block editing does not mount on LUI** (blocker, matches the known input-focus gap). Clicking a block leaves `activeElement=BODY`; no caret, no editor, no Escape-select, no multi-select.
3. **Markdown feature coverage gaps on LUI**: `==highlight==`, `>` quote styling, md tables, and remote images all fall back to literal/raw output or nothing, while master renders them (major).
4. **Block properties not displayed** on LUI (major) — master renders `key → value` rows under the block.
5. **Tag pages stuck on `Loading...`** on LUI (major) — `#Journal`/linked-filter targets never resolve; master renders the entities table.
6. **`Invalid_argument` patch-generation storm** on LUI during burst `append_block_in_page` writes (major) — `expected patch generation 9, received 13` etc., unhandled rejections; suggests the store desyncs when batches arrive faster than flush.
7. Minor: stray floating `#multi word tag` element; missing right-edge priority pills; `#Journal` tag shown on the journal title; gutter click maps to a different action than master.
