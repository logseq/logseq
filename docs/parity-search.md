# Feature-slice UI parity audit — CMDK palette & search

Comparison of the Logseq master web app (cljs, shadow-cljs dev on :3001) against the
LUI-rewrite web app (`deps/ui` @ `devin/component-migration`, static bundle on :3002).

- **Master:** `22a29b30de` on :3001 (graph "Demo").
- **LUI:** `3faedfd308` on :3002 (`index.html?rtc-test=true`, graph "Demo").
- LUI required one local-only workaround to boot the worker bundle:
  `Unix.gettimeofday` → `Time.monotonic_now`/`Time.diff_monotonic_ms` in
  `deps/db-worker/lib/{endpoint_read,db_worker_node}.ml` (same fix as upstream
  commit `fc8f8d7281` on `devin/fix-web-boot`, applied uncommitted).
- Seed (identical on both): pages `Parity Test Page` (blocks: *keyboard navigation
  audit block*, *screenshot comparison workflow*, *fuzzy matching quality test*),
  `Meeting Notes` (*agenda screenshot review*, *action items keyboard shortcuts*),
  `Reading List` (*outliner editors deep comparison*), `Party Time`
  (*confetti and balloons planning*), `Project Roadmap` (*milestone keyboard-first launch*).
- Screenshots in `parity-shots/search/`: `m-*` = master, `l-*` = LUI. Both apps light
  theme, left sidebar open, fullscreen Chrome (macOS).

## Verdict

**Essentially pixel/behavior parity for the whole slice.** The LUI cmdk palette and
the right-sidebar search panel are visually and functionally the same as master's:
same modal chrome, same sections, same result sets and ordering on every tested
query, same filter model, same keyboard behaviors, same quirks. Two real
differences found (Copy-ref clipboard prompt, one ⌥↵ flake), plus a couple of
not-yet-verified minor items.

## Checklist

| # | Feature | Master | LUI | Match | Notes |
|---|---------|--------|-----|-------|-------|
| 1 | Open via `mod+k` | `m-cmdk-open-empty.png` | `l-cmdk-open-empty.png` | ✅ | Centered modal + dimmed backdrop, input autofocused, same placeholder "What are you looking for?" |
| 2 | Open via search icon | `m-open-search-icon.png` | `l-open-search-icon.png` | ✅ | Icon at top-left; palette reopens with **previous query retained** on both |
| 3 | Empty state / recent items | `m-empty-recent.png` | `l-empty-recent.png` | ✅ | Empty query → `Recently updated 5` (same 5 pages, same order) |
| 4 | Typed query filtering | `m-query-meet.png` | `l-query-meet.png` | ✅ | Identical: Create page → `Nodes 5` (page + desc matches + 1 block result) → `Recently updated 1` → `Commands 4` → `Filters 6` |
| 5 | Keyboard nav (arrows) | `m-kb-nav.png` | `l-kb-nav.png` | ✅ | ↓ cycles highlight top→down across all result rows incl. filters |
| 6 | Enter select | `m-enter-select.png` | `l-enter-select.png` | ✅ | Node → navigates to page; command → executes |
| 7 | Command entries (icons, key hints) | `m-command-entries.png` | `l-command-entries.png` | ✅ | Same icon column, same key-hint chips (`⌘ ^I`, `T I`, `T T`, `C T`, `P P`, `⌘P`, `⌘J`…) |
| 8 | Create-new-page flow | `m-create-page.png` | `l-create-page.png` | ✅ | Top `Create page — Create page called '<q>'` row; Enter creates + navigates |
| 9 | ESC dismiss | `m-esc-dismissed.png` | `l-esc-dismissed.png`, `l-esc-clears-query.png` | ✅ | Multi-stage cascade on both: clear filter chip → clear query → close modal (each stage verified on both apps) |
| 10 | Click-outside dismiss | `m-click-outside-dismissed.png` | `l-click-outside-dismissed.png` | ✅ | Both close on backdrop click |
| 11 | Positioning / animation | (same shots) | (same shots) | ✅ | Centered top-third modal, backdrop dim, instant mount — no visible transition difference |
| 12 | Fuzzy match quality | table below | table below | ✅ | Identical result lists on all probe queries |
| 13 | Full-text search UI (sidebar) | `m-sidebar-search.png` | `l-sidebar-search.png` | ✅ | `⌘↵` opens identical `🔍 <query>` right-sidebar panel (same input, same sections); sidebar tabs `Contents \| Page graph \| Help` identical |
| 14 | Search in page | `m-filter-current-page.png` | `l-filter-current-page.png` | ✅ | `Search only current page` filter chip; **shared quirk**: cross-page block results each still labeled `Current Page` |
| 15 | Go to anything | — | — | ✅ | The palette itself is the goto-anything surface on both |
| 16 | Advanced search | — | — | ✅ | Neither app exposes a query-syntax/advanced-search UI in this slice (filters + sidebar panel are the whole surface) |
| 17 | `Cmd+F` in-page find | — | — | ✅ | Browser-native find bar on both (not intercepted) |
| 18 | Copy ref `⌘C` | — | `l-copy-ref-clipboard-prompt.png` | ⚠️ | Both: palette closes, page title gets selected, OS clipboard stays **empty**. LUI additionally triggered Chrome's `clipboard-read/write` permission prompt (Clipboard API); master did not prompt and wrote nothing |
| 19 | Open in sidebar `⌥↵` | — | — | ⚠️ | Footer hint suggests sidebar-open; on both it navigates the **main pane** like `↵` (no sidebar panel added). One master run instead just selected the page title — flaky |
| 20 | `/` filter mode | `m-slash-filter-mode.png` | `l-filters-expanded.png` | ✅ | `/` at empty input → filters-only list + `Filter ⌘` footer button; mid-query `/` is literal text |
| 21 | `Show more ⌘↓` filter expander | `m-filters-expanded.png` | `l-filters-expanded.png` | ✅ | Expands 6th filter (`Search only themes`) on click. **Shared quirk**: the printed `⌘↓` keypress does NOT expand it on either app — click required |
| 22 | Themes filter | `m-filter-themes.png` | `l-filter-themes.png` | ✅ | Both list 1 theme: `Logseq Default theme — light #logseq-classic-theme` |
| 23 | Files filter | `m-filter-chip-files.png`-adjacent | (empty) | ✅ | Chip applies; result list empty on both (no files in graph) |
| 24 | No-results state | `m-no-results.png` | `l-no-results.png` | ✅ | `zzqq` → `Create page` + `Filters 6` only; later `No matched result` text also identical when filter chip narrows to nothing |
| 25 | Dark theme | `m-create-page-dark.png` | `l-create-page-dark.png` | ✅ | Same dark palette styling (both apps flipped to dark via the same action stream during seeding — see quirks) |
| 26 | `Search only nodes` filter | `m-filter-nodes.png` | `l-filter-nodes.png` | ✅ | Chip `Search only: Nodes` → `Nodes 2` (block results are nodes); footer tip flips to `Press Esc to clear search filter` on both |
| 27 | Footer actions (context) | — | `l-filter-nodes.png` | ✅ | Footer shows `Open ↵ \| Open in sidebar ⌥↵ \| Copy ref ⌘C` on node highlight, `Create ⌘↓` on Create-page highlight — same context-sensitivity on both |

## Fuzzy / match-quality comparison

Same queries run on both apps; result lists read off the screenshots.
`page:` = page node, `blk:` = block-level result (page context + text), `desc:` =
matched node description, `cmd:` = command row.

| Query | Master results | LUI results | Match |
|-------|----------------|-------------|-------|
| `parity` | Create page; Nodes 1: page:`Parity Test Page`; Recently 1 | Identical | ✅ |
| `meet` | Nodes 5: page:`Meeting Notes`, desc:`Enable property history`, blk:`milestone keyboard-first launch`, desc:`Deadline`, desc:`Scheduled`; Commands 4: Move cursor ×4 | Identical | ✅ |
| `prty` | Nodes 5: page:`Party Time`, `#Property`, page:`Parity Test Page`, desc:`Hide empty value`, desc:`Enable property history`; Recently 2; Commands 3 (Add property `⌘P`, Add task priority `P P`, Jump to property `⌘J`) | Identical | ✅ |
| `mtng` | Nodes 5: page:`Meeting Notes`, blk:`fuzzy matching quality test`, desc:`Scheduled`, desc:`Deadline`, desc:`Enable property history`; Commands 1: Move cursor left | Identical | ✅ |
| `scrn` | Nodes 3 (all blocks): blk:`screenshot comparison workflow`, blk:`agenda screenshot review`, blk:`outliner editors deep comparison`; Commands 5 (Select graph, Select parent block, Toggle open blocks, Open publish, Copy) | Identical | ✅ |
| `keyboard launch` (multi-word) | Nodes 1: blk:`milestone keyboard-first launch` (both terms highlighted) | Identical | ✅ |
| `theme` | Nodes 4 (property descs); Commands 4 (Search themes, Select theme colors, Toggle dark/light, Close right-sidebar top) | Identical | ✅ |
| `screenshot` | Sidebar panel: Nodes 2 (the two blocks containing the word, substring-highlighted) | Identical | ✅ |
| `zzqq` | Create page + filters only | Identical | ✅ |

Matched substrings are highlighted identically (bold + accent underline) on both,
including inside block text and description lines.

## Real differences

1. **Copy ref `⌘C` permission prompt (LUI only).** LUI's palette issues a real
   `navigator.clipboard` write → Chrome shows the clipboard permission prompt on
   first use. Master never prompted and the OS clipboard stayed empty either way.
   Net user-visible difference: an extra permission dialog on LUI; neither app
   actually landed a ref on the OS clipboard in this harness.
2. **`⌥↵` flake (master).** On the first probe, master's `⌥↵` closed the palette
   and left the page title selected without navigating; on retry it navigated to
   the page like `↵`. LUI navigated both times. Footer still advertises "Open in
   sidebar ⌥↵" on both, and neither actually opened the node in the sidebar.

## Shared quirks (identical on both — worth fixing once)

- **Query retention:** reopening the palette restores the last query (only `Esc`
   clears it). Filter chips also survive reopen.
- **`Search only current page` labels every block result `Current Page`** — rows
   from other pages still carry the badge; the chip didn't visibly narrow to the
   current page for block results.
- **Theme flip during seeding:** the same action stream toggled dark theme on
   *both* apps mid-sequence (likely a palette Enter landing on a theme/command
   row while the highlight lags). Consistent, so not an LUI regression.
- **`Show more ⌘↓`** printed shortcut doesn't expand on either app via keypress
  (click required) — verified on both.
- **Ghost `Current page` section:** on master, removing the `Current page` chip
  left a residual empty `Current page 2` section header above `Nodes` — cosmetic
  only; not reproducible on demand on LUI (chip removal there was clean).

## Not covered

- RTC/networked graphs, plugin-provided commands, `@`-mentions/`#`-tag picker
  inside the palette, `Search only codes` with real code blocks (none seeded),
  palette pagination beyond the first `Nodes 5` cap, screen-reader behavior.
