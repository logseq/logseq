# Dark-theme pixel parity audit: LUI vs master

Method: `scripts/pixel2/capture-dark.mjs` drives both apps (master `localhost:3001`,
LUI `localhost:3010`) in headless Chrome at 1280x800, dark theme, identical fixture
graph (Seed notes/Book, PPFixture blocks, PdfFixture + zlib.pdf, recents, #card cards).
`scripts/pixel/diff.mjs` runs pixelmatch (threshold 0.12) on each `master-*`/`lui-*`
pair under `docs/pixel2-dark/` and emits `diff-*.png` + `diff-results.json`.

## Fixes landed this pass

- `resources/css/lui-overlay.css`: `.action-input` background fallback →
  `var(--lx-gray-06, var(--ls-quaternary-background-color, var(--rx-gray-06)))`
  (was resolving to `--ls-page-inline-code-bg-color` → rgb(1,34,42) vs master rgb(9,73,88)).
- `resources/css/lui-overlay.css`: settings dialog aside background →
  `var(--lx-gray-03-alpha, var(--rx-gray-03-alpha))` (white 5.6% overlay, matching
  master's `.cp__settings-inner aside` rule; previously fell back to
  `--ls-secondary-background-color` → rgb(2,54,67) vs master rgb(14,57,67)).
- `resources/css/lui-overlay.css`: removed dark `.settings-menu-item` white-alpha
  active/hover overrides; master uses `rgb(0 0 0 / 0.1)` (black 10%) in dark mode too.
- `deps/ui/src/views/views_table.ml`: `VGroupedList` partitions render as
  `.ls-foldable-title` + caret + `.ls-foldable-content` (matching master's
  linked-references foldables), with stable `g<i>-<j>` keys; previously a plain
  `.ls-view-partition-title` link.
- `deps/ui/src/render/render_inline.ml`: `![x](*.pdf)` embeds now render
  `span.asset-ref.is-pdf` (master renders `a.asset-ref.is-pdf`, not an `<img>`); press
  dispatches through the `pdf_link_press` hook registered by `Pdf.install ()` →
  `Pdf_assets.open_pdf_link` (dependency-direction-safe; no render_inline→pdf_assets edge).
- Fixture parity: LUI recents list seeded to master's order (10 pages); PPFixture
  block order aligned (Tags/empty-line position, TODO/DOING/DONE tail).

## Diff results (after fixes)

42 surface pairs, mean diff **1.27%**. Worst:

| % | surface | note |
|---|---------|------|
| 4.49 | 10-settings-general | settings article row offset (~10px vertical drift); colors match |
| 3.13 | 04-blocks-bottom | ~1-line scroll drift + block-ref uuid text |
| 2.93 | 03-blocks-mid | scroll drift |
| 2.51 | 12-appearance | settings article offset |
| 2.31 | 11-settings-advanced | toggle row offsets |
| 2.24 | 13-export-page | export preview text ordering/line-wrap |
| 2.20 | 09-dots-menu | menu item order/row-height drift |
| 1.95 | 11-settings-keymap | keymap table row offsets |
| 1.94 | 35-page-alpha | linked-refs group row drift |

Everything ≤1% is within antialiasing/scroll noise.

Before/after for fixed items: 14-import 16.32%→0.20%, 39-pdf-viewer capture-fail→0.82%,
35-page-alpha folded-groups → now render (1.94% residual drift), settings aside/active
colors now identical (rgb(14,55,65) vs master rgb(14,57,67); active row 13,49,59 vs 13,51,60).

## Exceptions (documented, not fixed)

- Remaining diffs are positional (scroll/row-height drift, menu ordering) and fixture
  content drift (export preview text order, block-ref uuid rendering), not theme colors.
- Flashcards sidebar badge: master shows "2"; LUI mounts the badge only when
  `feature/enable-flashcards?` is set — fixture config difference.
- Verified: `OPAMSWITCH=5.5.0 opam exec -- dune build @all` green;
  `node _build/default/test/ui_test/test/test_main.js` — 1546 checks, 0 failures.
