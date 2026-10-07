# Pixel parity: left sidebar + navigation (LUI vs master cljs)

Slice: left sidebar — section headers, page list rows, favorites,
recents, icons, spacing/padding, hover states, top bar (logo, search
trigger, icons), breadcrumbs, graph switcher. Reference:
`docs/parity-nav.md`.

## Harness

Paired Playwright captures at 1280x800, pixelmatch diff (threshold
0.12) over three regions: full frame, sidebar region (x 0-300), top
bar (y 0-56).

- master: cljs app served at :3001 (`pnpm app-watch`, shadow-cljs
  dev-http), branch tip at measurement time.
- LUI: `deps/ui` build via `OPAMSWITCH=5.5.0 opam exec -- dune build
  @all` + `pnpm css:build && pnpm ui:build`, served at :3010
  (`node scripts/serve-static.mjs 3010`, `index.html?rtc-test=true`).
- Fixture: same `Demo` graph in both; seeds `Alpha` + `Beta` pages,
  favorites both, visits each via in-app navigation so both sides'
  recents record `[Beta, Alpha]`.
- States: sidebar, nav-hover, row-hover, collapsed, expanded,
  graph-switcher, sidebar-closed, sidebar-reopen, dark,
  dark-row-hover, light-again.

## Results (sidebar-region diff %, before → after)

| state            | before | after |
|------------------|--------|-------|
| sidebar          | 1.94%  | 0.20% |
| nav-hover        | 1.92%  | 0.20% |
| row-hover        | 1.93%  | 0.20% |
| collapsed        | 1.65%  | 0.13% |
| expanded         | 1.93%  | 0.20% |
| graph-switcher   | 2.26%  | 0.87% |
| sidebar-closed   | 0.64%  | 0.61% |
| sidebar-reopen   | 1.94%  | 0.20% |
| dark             | 3.86%  | 0.49% |
| dark-row-hover   | 6.56%  | 0.50% |
| light-again      | 1.93%  | 0.20% |

Top bar region: 0.41-0.45% → 0.22-0.37%. Remaining residue is glyph
anti-aliasing: LUI icons are `currentColor` masks (`--lui-icon-image`)
while master inlines stroked SVGs, so edges differ by ~1px of AA.
Text bounding boxes measured identical for the graph switcher,
section labels and nav rows.

Screenshot pairs live in `docs/pixel-nav/` (`master-*.png`,
`lui-*.png`, `diff-*.png`).

## Fixes applied

All in `resources/css/lui-core.css` + `deps/ui`:

1. `--left-sidebar-bg-color` was scoped to `main.theme-container-inner`;
   LUI renders `div.theme-container-inner` → whole sidebar rendered on
   a transparent background. Selector widened to
   `.theme-container-inner`.
2. `#head.cp__header` is a flex item inside `div.lui-column` and was
   shrunk to 45.3px; added `flex-shrink: 0` (48px like master).
3. Every sidebar rule in `lui-core.css` was written against the cljs
   DOM (`a.item`, `ul li > a`, `strong`). LUI emits `.lui-row.item`,
   `div.lui-list` + `a.lui-link.link-item` and `span.lui-text`; all
   selectors retargeted (row height 32, padding, hover backgrounds,
   hidden shortcut keycaps, `.hd` label size, chevron slot).
4. Header ghost icon buttons: master is a 32px box with a 20px icon,
   LUI's `~size:`icon` kind rendered 40px + 16px icon → overridden
   under `.cp__header` (2rem box, .25rem padding, 1.25rem icon).
5. Added the missing `#left-sidebar a { opacity:.8; hover:opacity:1;
   color: text-foreground }` rule (extended to `.item` since LUI nav
   rows are not anchors); graphs-selector keeps `opacity:.9`.
6. `a.lui-link` wraps children in `span.lui-link-content` (display:
   block) — page icon/title stacked vertically; now `display:flex`
   like the cljs anchor contents.
7. Icon sizes in view code: graphs-selector chevron `selector` 16→18,
   `filter-edit` default→14 (cljs `:size` props).
8. Section collapse (Favorites/Recent) was unimplemented — `.hd` had
   no press handler and `is-expand` was hard-coded. Added
   `groups_collapsed` state to `Sidebar_state` (web + apple/gpui copy)
   mirroring cljs `:ui/navigation-item-collapsed?`: in-memory toggle
   keyed by group class, `.hd` press toggles, chevron rotates via the
   existing `.is-expand .more` rule.
9. Harness fixes (not app fixes): recents only record on explicit
   navigation (`Runtime.take_nav_mark`), so seeding clicks sidebar
   items instead of hash-nav; dropped the `Foo/Bar/Baz` seed page
   (master records `create_page` targets in recents, LUI does not —
   see exceptions); resync to `#/` after the graph-switcher state.

## Exceptions (kept LUI's version)

- **Graph switcher click → `/graphs` page, not a dropdown.** Master
  opens an inline repos dropdown under the selector; LUI navigates to
  the All-graphs page which hosts the same actions (switch, create,
  per-graph row actions). The cljs dropdown isn't unreasonable per
  se, but the page is a strict superset and the selector row itself
  now renders pixel-identical — the 0.87% residual in that state is
  the opened-dropdown overlay vs the navigated page, not a styling
  gap.
- **Top-bar breadcrumbs absent.** Master renders
  `ui/breadcrumb` inside `#head` on non-journal pages. LUI only
  implements breadcrumbs in the right sidebar (`right_sidebar_view`);
  a top-bar breadcrumb doesn't exist yet — feature gap, not a styling
  difference. Flagged for the component-migration roadmap rather than
  faked in this slice.
- **Icon glyph AA.** LUI renders icons as `currentColor` masks from
  the tabler icon font; master inlines stroked SVGs. Stroke edges
  differ by sub-pixel AA — ~0.2% floor on every state. Keeping LUI's
  renderer (cheaper, consistent with the rest of the LUI port).
- **Recents semantics.** Master pushes a recent entry for
  `logseq.api.create_page` targets too; LUI records only explicit
  in-app navigation (`take_nav_mark`). Arguably more correct —
  creating a page is not "visiting" it — and only observable via the
  plugin/API surface.
- **`sidebar-closed` residual (0.61%).** The diff sits at x 246-300 —
  the journal page heading bleeding into the 300px sample band, i.e.
  page content, not the sidebar itself. Out of this slice.

## Reproducing

`~/parity-lab/pair.mjs` (session-local, not committed): launches both
apps headless at 1280x800, runs the state drivers, writes
`shots/{master,lui,diff}-<state>.png` and prints per-region diff
percentages.
