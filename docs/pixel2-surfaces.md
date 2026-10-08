# Pixel2 parity — surfaces slice (views + dialogs + popups)

Round-2 pixel audit for branch `devin/component-migration`. Same viewport
(1280x800), light+dark, identical seeded fixture on both ends.

## Fixture

`scripts/pixel2/seed-views.mjs` (idempotent, run against each app):
- Tag `Book` with 7 typed properties (author text, rating number, published
  date, finished checkbox, genre+website text, reading node w/ choice
  property).
- 6 `#Book` object blocks under `Seed notes`, all property values set
  (finished/rating/website/reading/genre/author). `published` values not
  seeded: master's `upsert_block_property` rejects every date value format
  ("Schema validation failed") — column exists on both sides, cells empty.
- 6 plain pages, journals 2026-10-05/06.

## Harness

- `scripts/pixel2/lib.mjs` — persistent-profile launcher (master :3001 /
  LUI :3010, `?rtc-test=true`, headless chrome 1280x800, cache disabled).
- `scripts/pixel2/seed-views.mjs` — fixture seeder.
- `scripts/pixel2/capture-views.mjs` — views captures.
- `scripts/pixel/capture-dialogs-menus.mjs` — dialogs/menus captures
  (existing round-1 harness, self-seeding `Parity` page).
- `scripts/pixel/diff.mjs` — pixelmatch (threshold 0.12) + heatmaps.

Master: `pnpm watch` → http://localhost:3001/?rtc-test=true
LUI: `cd deps/ui && OPAMSWITCH=5.5.0 opam exec -- dune build @all` +
`pnpm db-worker:build` (needs `static/js/db-worker.js`) + vite build →
`node scripts/serve-static.mjs 3010`.

## Fixes landed this round

1. **View-tab menu — extra Delete item.** `deps/ui/src/views/views_head.ml`
   always offered `Delete` in a view tab's menu; cljs only offers it when
   `> 1` view exists (`views.cljs view-tab-button`). Gated the Delete item
   on `List.length views > 1`. Verified: master `All` tab menu =
   [Rename], LUI now identical.

## Results (after fix; dialogs & views, light + dark)

### dialogs/menus (max 1.30%)

| diff | surface |
|---|---|
| 1.30% | dark settings |
| 1.24% | settings advanced |
| 1.22% | settings keymap |
| 1.21% | settings general |
| 1.19% | appearance |
| 0.95% | settings editor |
| 0.90% | export page |
| 0.86% | dark right sidebar |
| 0.86% | block ctx |
| 0.83% | dots menu |
| 0.80% | dark block ctx |
| 0.79% | dark dots menu |
| 0.70% | set-property popup |
| 0.62% | sidebar help |
| 0.58% | plugins |
| 0.54% | login |
| 0.53% | sidebar contents |
| 0.52% | right sidebar |
| 0.48% | settings features |
| 0.39% | recycle |
| 0.37% | help menu / parity page / sidebar closed |
| 0.34% | dark home |
| 0.27% | title ctx |
| 0.03% | import |
| 0.01% | delete-confirm |

### views (max 1.82%)

| diff | surface |
|---|---|
| 1.82% | tooltip hover |
| 1.77% | page-alpha (page + linked references) |
| 0.89% | table row select |
| 0.89% | column header menu |
| 0.81% | journals list |
| 0.81% | book object page (properties panel) |
| 0.80% | dark object page |
| 0.77% | dark book objects |
| 0.76% | view list / gallery / table / add-property (see note) |
| 0.74% | dark all-pages |
| 0.73% | all-pages |
| 0.72% | book objects table |

Note: shots 06-09 captured the same table state on *both* apps — no
Table/List/Gallery switcher or "Add property" button exists on tag pages
in current master (toolbar = `Add icon`, `Add tag property`, `All` tab,
`New property`; LUI toolbar = `All`, `New view`, `Sort groups by`,
`Filter`). Kept as table-view duplicates; 0.76% is the table diff.

## Open diffs (remaining, not exceptions)

- ~~Tooltip surface (1.82%)~~ **VERIFIED FIXED**: hover probes show LUI
  tooltips matching master on both header buttons — "Toggle left sidebar"
  (131x53 vs 131x54, same label + `T`/`L` keys) and "More" (55x29 vs
  55x30, 2px x drift = raster). The old diff-12 residual was the
  linked-refs offset riding the same capture.
- ~~Linked references vertical offset (~8px)~~ **FIXED** (page-alpha
  1.45%→0.08%): five stacked deltas, all resolved — page plugin slots
  mounted inside the title column (+8px row gap), missing `ml-1` on the
  refs wrapper (x/width), missing cljs `.flex.flex-col.border-t.pt-2.gap-2
  .group-list-view` partition wrapper + `-ml-2` group bodies, missing
  `.ls-foldable-content` grid/`is-collapsed`/`-inner` overflow rules
  (margin collapse → +4px), `bullet-container` inline 14px box
  overriding the stylesheet's 16px var (2px per-row text shift),
  view-head action buttons at size-sm instead of `!h-7 !px-1`,
  view-tab at 16px instead of `!text-sm !px-1`, `ls-add-view` visible
  in refs instead of opacity-0-at-rest, fold caret not in
  `control-show`/`control-hide` contract, `.ls-count` dark instead of
  muted-foreground. Residual: sub-pixel text raster on the head row
  (~400px) plus the separate top-header band.
- **First block row on Page Alpha**: full-row diff — content identical,
  likely rasterization + slight x-offset of bullet/text.
- **Settings screens (~1.2-1.3%)**: residual text-rasterization + small
  control-spacing deltas, no structural mismatch found.
- ~~Rename menu structure~~ **FIXED**: LUI's view-tab menu now renders
  `Rename` as `ui__dropdown-menu-sub-trigger` → `ui__dropdown-menu-sub-content`
  with the inline editor inside (`MSub` + `MCustom`), matching master's
  `dropdown-menu-sub` + block container at the same open coordinates.
  The editor autofocuses when the sub opens (popup layer focuses the
  first editable). Remaining delta: LUI's editor is a single-line
  `cp__select-input` (225x46) vs master's full block-container chrome
  (128x62) — documented simplification; commit-on-Enter and Escape
  behavior match.

## Retained exceptions (from round 1, still applicable)

- Text rasterization noise between renderers (per-line sub-pixel diffs).
- Bullet/caret glyph shapes (different icon sources).
- Search result-count popup heights.
- Block ctx menu: master uses `<button>` menuitems, LUI uses `<div
  role="menuitem">`; right-click lands on different selection state.
- `published` date column seeded empty on both ends (master API rejects
  all date formats via `upsert_block_property`).

## Pairs

`docs/pixel2-surfaces/dialogs/{master,lui,diff}-*.png` +
`docs/pixel2-surfaces/views/{master,lui,diff}-*.png`,
`diff-results.json` per dir.
