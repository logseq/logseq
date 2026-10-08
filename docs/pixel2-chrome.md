# Pixel parity round 2 — app chrome slice

Logseq master (`https://app.logseq.com/`, cljs, screenshot reference only) vs LUI rewrite
(`deps/ui` @ `devin/component-migration`, served `localhost:3003/index.html?rtc-test=true`).

Slice: left sidebar (favorites/recent/journals, section headers, resize, context menus),
top header (breadcrumbs, title, icons, right-sidebar toggle), right sidebar open/close,
cmdk palette + search autocomplete + command results, page-history back/forward,
graph-switcher dropdown.

## Method

- `scripts/parity/pixel/capture-chrome.mjs` — Playwright persistent profiles
  (`/Users/devin/parity-profiles/{master,lui}`), viewport 1280×800, Chrome channel.
  Seeds an identical fixture on both graphs (pages `Alpha`, `Beta`, `Foo/Bar/Baz`,
  one searchable block; Alpha+Beta favorited; recents `[Baz, Beta, Alpha]`).
- localStorage is normalized per-impl because the two stacks persist under different
  keys/serializations: master `ui/theme`/`ui/system-theme?`/`ui/recent-pages`/
  `ls-left-sidebar-width` as EDN (`"dark"`, `false`, `{"g" [ids]}`, `"240.00px"`),
  LUI `theme`/`logseq:theme`/`recent-pages`/`ls-left-sidebar-width` raw.
- Paired screenshots at 12 UI states in `docs/pixel2-chrome/{light,dark}/`
  (`master-NN-*.png` / `lui-NN-*.png`, pixelmatch heatmaps in `*/diff/`).
  pixelmatch threshold 0.15, includeAA off.

## Results (differing pixels %)

| State | light | dark |
|---|---|---|
| 01 sidebar | 0.27 | 0.30 |
| 02 row hover | 0.27 | 0.30 |
| 03 ctx menu on favorite | 0.45 | 0.48 |
| 04 collapsed section | 0.27 | 0.30 |
| 05 resized sidebar | 0.27 | 0.54 |
| 06 namespaced-page header | 0.27 | 0.30 |
| 07 right sidebar open | 0.42 | 0.46 |
| 08 right sidebar closed | 0.27 | 0.30 |
| 09 cmdk palette | 0.21 | 0.27 |
| 10 search autocomplete | 1.40 | 1.55 |
| 11 command results | 0.70 | 0.69 |
| 12 graph switcher | 0.57 | 0.64 |

Start-of-round light baseline was 0.22–1.38 with real bugs (see fixes); the first dark
capture measured 96–99% until master's theme storage keys were discovered.

## Fixes landed this round (deps/ui)

1. **`recent-pages` serialization** (`sidebar_state.ml:push_recent`) — wrote
   `{"repo" (ids)}` (EDN list); cljs writes `{"repo" [ids]}` (vector). The palette's
   "Recently updated" group stayed empty. Now `Wire.Array`.
2. **cmdk recents badge** (`cmdk_state.ml:recents_g`) — `gtotal` counted all stored
   recents even when the query filtered the list; cljs badges the matching count
   ("Recently updated 3" vs master's "1"). Now counts filtered items.
3. **Sidebar group chevron** (`left_sidebar_view.ml`, `subs/platform.ml`,
   `native/platform.ml`) — web CSS rotates `.more` 90° on `.is-expand`
   (`lui-core.css:1006`); the view additionally swapped the icon on collapse, so the
   transform double-applied and expanded groups showed `‹`-sideways instead of `∨`.
   New `Platform.css_transform_icons` (web=true, native backends=false); the view now
   renders `chevron-right` on web exactly like cljs.
4. **cmdk row icon cell** (`resources/css/lui-overlay.css:.cmdk-item-icon`) — 1.25rem
   box vs master's bare 14px glyph pushed every row label ~4px right. Width → 1rem;
   label and glyph x now align with cljs.
5. **`scripts/serve-static.mjs`** — no cache headers meant the persistent parity
   profiles served stale CSS and masked style fixes. Now `cache-control: no-store`
   (dev server only).

## Documented exceptions (remaining deltas, justified)

- **10-search-ac (~1.4–1.6%)**: `thread-api/search-blocks` in the OCaml db-worker
  uses fuzzy subsequence matching (`Search_fuzzy`) — `alpha` also hits property-doc
  blocks whose text contains the letters a-l-p-h-a in order
  ("This en**a**b**l**es tags to inherit **p**ro**p**erties from ot**h**er t**a**gs"),
  so LUI lists 4 nodes vs cljs's 2 FTS-token hits. Content-level search-ranking
  divergence inside deps/db-worker, not chrome; fixing it is a search-semantics task.
  Palette chrome itself (groups, badges, highlights, footer) is at parity.
- **cmdk tip line**: random per mount on both impls — cljs `rand-nth`, LUI
  `js_random () < 0.5` (`cmdk_state.ml`); paired shots mismatch ~half the time.
- **05-resized dark (~0.54%)**: resizer hover/active color — deployed master resolves
  dark `--ls-active-primary-color` to `#0069b6` (the light-theme accent; a theme gap
  on the live build). Repo source `vars-classic.css` defines `#8ec2c2` for dark and
  LUI renders exactly that; LUI follows current source.
- **12-graph-switcher (~0.6%)**: dropdown rows are pixel-identical; residual is the
  popup anchored ~1–2px lower on LUI plus focus-ring tint — subpixel anchor math.
- **page-history back/forward**: no header buttons exist in either web build
  (Electron titlebar feature only) — equal-absent, not a regression.
- **namespaced breadcrumbs**: `Foo/Bar/Baz` shows flat title `Baz` on both impls —
  `create_page` does not materialize `:block/namespace` ancestors on either side,
  so the breadcrumb path is equal-absent.
- **~0.2–0.5% floor on every state**: text antialiasing + ~1px kerning/scrollbars;
  no structural difference underneath.

## Reproduce

```sh
node scripts/serve-static.mjs 3003          # LUI static server
cd scripts/parity/pixel
node capture-chrome.mjs master light && node capture-chrome.mjs lui light
node capture-chrome.mjs master dark  && node capture-chrome.mjs lui dark
# diff: /tmp/pixel2/diff.mjs <light|dark> (pixelmatch + hotspot grid)
```
