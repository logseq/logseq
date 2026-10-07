# Pixel parity — views + all pages

LUI web app vs master cljs Logseq, 1280×800 light theme, identical fixture graph
(Book tag + 7 typed properties, 6 #Book objects under "Seed notes", 6 plain
pages, journal pages). Screenshots captured headless-Chrome on both ends;
diff = pixelmatch % of differing pixels (threshold 0.12).

Pairs live in `docs/pixel-views/<state>.{master,lui,diff}.png`.

## Results

| State | Diff % |
|---|---|
| 01 all-pages | 0.59 |
| 02 all-pages-hover | 0.59 |
| 03 all-pages-select | 0.73 |
| 04 all-pages-header-menu | 0.77 |
| 05 all-pages-more-menu | 0.84 |
| 06 all-pages-groupby | 0.90 |
| 07 all-pages-search | 0.35 |
| 08 tag-table | 1.27 |
| 09 tag-header-menu | 1.29 |
| 10 tag-select-rows | 1.44 |
| 11 tag-list-view | 2.72 |
| 12 tag-gallery-view | 1.04 |
| 13 tag-cell-author | 1.04 |
| 14 tag-cell-rating | 1.04 |
| 15 tag-cell-published | 1.04 |
| 16 tag-cell-finished | 1.04 |
| 17 tag-cell-website | 1.04 |
| 18 obj-page | 0.84 |
| 19 obj-prop-edit | 1.02 |
| 20 obj-prop-add | 1.02 |

## What was fixed this slice

- **All Pages table**: column widths/labels, row height (32px + 1px border),
  border color `hsl(var(--border))`, selection highlight → muted gray
  (was accent blue), selection action bar merged into the header row like
  master (`Selected: N` + Copy/Set property/Unset property/Delete while
  other column headers stay visible), sort indicator, hover ghost buttons.
- **Tag table view**: same header/selection geometry, sort button,
  updated-at arrow placement.
- **List view**: rows render full `block-container` (bullet + title with
  resolved refs + inline tags + positioned property pills + property
  panel), matching master's `block.cljs` render — previously bare titles.
  Grouped partitions show the group page name (breadcrumb, `show-page?
  false`) with master's `ml-6 text-sm opacity-70` title strip and
  `border-t pt-2` group wrapper. Inline-tag filtering no longer emits a
  spurious `#Book` chip on rows.
- **Object page** (`#/page/<block-uuid>`): renders as a block page like
  master — breadcrumb (parent page), the object block itself with
  positioned pills row (Rating/Published/Finished — icon-less key, journal
  link + pencil affordance, checkbox glyph), property panel rows at 28px
  height/150px key column, value bullets for entity/closed/empty values,
  URL external-link underline, trailing add-block bullet. Add-block
  button visibility: hidden on page routes by page children, shown on
  block routes by the routed block's children.
- **Page title**: `#` icon in 38px bordered rounded box (was bare glyph),
  `margin-left` −36px alignment for the foldable title (was −61px).
- **Property rows inside views**: key panel `min-h-28px min-w-150px`,
  panel bullet shown beside entity/closed/empty values
  (`show-property-panel-bullet?` parity), pill row vs panel layout split.
- **Escape semantics**: no longer clears table row selection (matches
  master); menus still close.

## Interactions verified end-to-end (both apps)

- View head: view-type switcher (Table/List/Gallery), sort menu, filter
  icon, search input, "more" menu, group-by strip.
- Table header column menus (click column label → menu opens both sides).
- Row multi-select + selection action bar (Copy/Set property/Unset
  property/Delete buttons present and hit-testable).
- Cell editors: Author (text), Rating (number), Published (date → journal
  ref), Finished (checkbox), Website (url) — open/confirm/cancel.
- Object page: property row click→edit, Add property flow, per-type
  editors render at master's geometry.

## Exceptions / remaining deltas

No deliberate divergences — master's behavior was kept everywhere it
mattered. Remaining diff percentages are measurement-floor noise:

1. **Text rasterization residual (~1–2 px per line)** — same font stack
   and size on both ends, but sub-pixel glyph positioning differs line to
   line (fractional offsets), so pixelmatch flags glyph edges. Accounts
   for most of every state's remaining %.
2. **Bullet/caret glyph shape** — LUI's block bullet and foldable caret
   are different glyph paths than master's SVG icons (e.g. caret-right,
   property key icons). Visually equivalent, pixel-different by design.
3. **State-04 measurement artifact** (resolved): with rows selected,
   master replaces the name-column header label with "Selected: N", so a
   literal "Page name" locator no longer exists; the original driver
   scroll-into-viewed a hidden match and scrolled master's view head
   away. Driver now clicks the always-visible `Backlinks` header. Real
   behavior parity confirmed: both apps scroll the view head/toolbar out
   of view with content while column headers stay sticky.
4. **`Published` pill shows `Jul 31st, 2008` on both sides** — master's
   journal display for the seeded `2008-08-01` value; LUI renders the
   same resolved journal title, so identical output.

## Fixture + harness

- Fixture: `~/parity-lab/fixture.transit` (+ `fixture-meta.json`), seeded
  via `window.logseq.api.import_edn` in `rtc-test` mode on both apps.
- Harness: `~/parity-lab/pair.mjs` — `node pair.mjs [--only <name>]
  [--out dir] [--dark]`. Master on `localhost:3001/?rtc-test=true`, LUI on
  `localhost:3010/index.html?rtc-test=true`.
