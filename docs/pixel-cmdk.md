# Pixel-level parity — cmdk palette & search

LUI web app (`deps/ui` @ `devin/component-migration`, static bundle on :3010,
`index.html?rtc-test=true`) vs master cljs Logseq (worktree on :3001). Both ends
at 1280x800, same fixture graph, same seed content. Diffs measured with
pixelmatch (threshold 0.1) on paired Playwright captures; screenshot pairs live
in `docs/pixel-cmdk/` (`master-*` vs `lui-*`).

## Results

| State | Before | After |
|-------|--------|-------|
| Palette, query `oct` | 2.22% | **0.72%** |
| Palette, `oct` + keyboard selection | 2.70% | **0.76%** |
| Sidebar search pane (mod+Enter) | 2.13% | **0.94%** |
| Blank open | — | **0.22%** |
| Dark theme, `oct` | — | **0.92%** |
| No results (`zzzzqqq`) | — | **0.43%** |
| Slash `/` filter mode | — | **0.29%** |

Geometry is exact: dialog y89.5 h621 x191 w898, cmdk y90.5 h619 x192 w896,
input row h54, scroller y144.5 h520, hints row y664.5 h45, item rows h32,
group headers h32 with 4px group padding — identical on both ends, verified
by DOM rect probes (not just the screenshot diff).

## Fixes landed in this slice

- **Stale-signal search** (`cmdk_state.ml`): `Signal.set` stages the value as
  pending until the next stabilize; `get` read only the published signal, so
  `on_input` → `refresh` dispatched the *previous* keystroke's query and the
  last keystroke never searched. `get` now reads `pending` first.
- **Theme var shape split** (`lui-overlay.css`): the shipped theme defines
  `--background`/`--foreground`/`--card`/`--card-foreground`/`--border` as
  complete oklch colors in light mode but hsl triplets in dark mode, so
  neither `var(--x)` nor `hsl(var(--x))` is valid in both themes — the overlay
  was fully transparent (light) and borders/backgrounds silently dropped
  (dark). Added `--lui-c-*` alias vars (`:root` = raw var, `[data-theme=dark]`/
  `.dark-theme` = `hsl(var())`) and repointed ~70 declarations. Triplet vars
  (`--muted`, `--popover`, `--input`, `--ring`, `--primary`, `--secondary`,
  `--accent`, `--popover-foreground`) keep `hsl(var())` unchanged.
- **Dialog chrome**: `box-sizing: content-box` on `.ui__dialog-content`
  (master's 898px is content-box), input-row padding removed (cljs row has
  none), hints row pinned to 45px, hint buttons to 28px, sidebar-item header
  to 32px (`lui-core.css`), command-item rows to 32px via a 20px
  shortcut-row clamp, `.cp__cmdk-group` `padding-bottom: 4px` + `create`
  group tagged `data-cmdk-group-kind`.
- **Sidebar search pane** (`cmdk_state.ml`, `cmdk_view.ml`,
  `sidebar_state.ml`, `right_sidebar_view.ml`): mod+Enter now runs cljs's
  `consume-open-search-sidebar-keydown!` — closes the palette and pins a
  `kind="search"` right-sidebar item whose body is a `Cmdk_view.sidebar`
  (cljs `cmdk-block`): independent non-singleton state seeded with the
  query, no modal shell, no hints row, no group `Show more` link.
- A11y: icon-only buttons (`more`, sidebar item header) now carry `~label` —
  the lui web store rejects unlabeled icon buttons and the whole patch batch
  was being dropped.

## Documented exceptions (kept LUI's / unavoidable)

1. **Files group absent** — master lists `logseq/custom.js`, `custom.css`
   from a file index the LUI db-worker doesn't expose yet. Residual row-area
   diff in `oct`/`dark`/`sidebar` shots is this group; LUI's Filters group
   simply sits higher.
2. **Random tip text** — master picks one of two footer hints at random
   (`rand-tip`); LUI renders the same two but the picked index can differ
   between captures.
3. **Text rasterization** — sub-pixel anti-aliasing deltas on text runs
   (different shapers), the bulk of the remaining diff.
4. **App chrome outside this slice** — master's top nav has a `Page graph`
   entry and the LUI left-header search button shows a visible `⌘K` hint
   chip; both belong to the nav/chrome slice, not cmdk.
5. **`Show more` in the sidebar pane** — master's sidebar `cmdk-block` does
   not render the group expander; LUI now matches (was a divergence, fixed).

## Notable shared quirks (identical on both ends)

- Fresh blank palette shows no groups (cljs `:default` load only fires on an
  input edit; LUI mirrors it via `edited`).
- `Search only themes` is the 6th filter row, clipped at the scroller edge
  identically.
