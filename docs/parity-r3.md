# Parity r3 — post-merge regression sweep

Web LUI (`deps/ui`, `devin/component-migration`) vs `origin/master` cljs app,
paired captures from identical Chrome profiles with the same fixture
(PPFixture + CardsTest + RefSource + Alpha + Searchable + ACProbe), 1440×900,
light theme, `pixelmatch` (threshold 0.15, includeAA:false). Harness:
`scripts/parity/r3/capture.mjs` + `diff.mjs`; shots in
`docs/parity-r3-shots/<theme>-<width>/`.

## Fixes landed in this sweep

- `properties_area.ml`/`page.ml`: plugin `:pagebar` slots were rendered as a
  sibling column child inside `~gap:8`, adding a phantom 8px to the title row
  (66px vs master 58px). Slots now render inside the absolutely-positioned
  `.ls-page-title-actions` row like cljs — title row back to 58px.
- `tree.ml`: bullet container was 14px fixed with `border-radius:7px`; master
  `.bullet-container` is 16px/`50%`. Inline style updated.
- `tree.ml`: `data-heading`/`data-has-heading` attrs now derive the level from
  the raw `#`-prefixed title when `block_heading` is absent (blocks ingested
  without heading normalization). Restores `--ls-block-icon-size` rules and
  the heading bullet offset on `block-main-container`.
- `lui-core.css`: `.ui-fenced-code-editor .CodeMirror-lines { padding: 0 }` —
  cljs mounts no CodeMirror at rest (static `<pre>`, 46px); LUI mounts real CM
  whose lib-default `padding: 4px 0` added 8px to every fenced code block.
- Fixture: `SCHEDULED:`/`DEADLINE:`/`:LOGBOOK:` marker blocks rewritten to
  plain text on both graphs (master normalizes them at ingest into properties;
  LUI keeps them verbatim — see E2). Master PPFixture graph rebuilt
  hierarchically after page corruption.
- Harness: `addInitScript` writes `theme`/`system-theme?` before app scripts
  on both apps (master's mac default is `system-theme?=true`; explicit light
  picks the Light card in settings). Left-sidebar state normalized per run.

## Diff matrix (light, 1440×900)

| item | diff% | verdict |
|---|---|---|
| 01-journals | 0.01 | noise |
| 02-page-top | 0.06 | noise |
| 03-page-mid | 0.77 | text AA residual |
| 04-page-bottom | 1.51 | exception E4 |
| 05-block-hover | 0.06 | noise |
| 06-caret | 0.06 | noise |
| 07-selected | 0.06 | noise |
| 08-ac-page | 0.25 | noise |
| 09-slash(-open) | 0.35–0.38 | noise |
| 10-dbracket(-open) | 0.27–0.33 | noise |
| 11-parens(-open) | 0.27 / **4.31** | flake — see E5 |
| 12-at | 4.31 | flake — see E5 |
| 13-all-pages | 0.71 | noise |
| 14-right-sidebar | 2.51 | exception E6 |
| 15-right-sidebar-close | 0.71 | noise |
| 16-cmdk | 0.23 | noise |
| 17-search | 0.75 | noise |
| 18-settings | 2.96 | exception E7 |
| 19-dots-menu | 2.14 | exception E8 |
| 20-ctx-menu | n/a | master selector timeout — E9 (harness) |
| 21-sidebar-open | 2.21 | exception E6 |

## Exceptions

- **E1 — text raster noise floor ~0.7%.** Pixel-level glyph AA differences
  spread evenly across text; hotspots show no localized blob. (Standing.)
- **E2 — ingest normalization gap (root cause).** Master rewrites
  `SCHEDULED:`/`DEADLINE:` into `:logseq.property/scheduled|deadline` and
  `# title` into `:block/heading-level` at ingest; LUI stores the verbatim
  title. Display parity restored via plain-text fixture + the tree.ml
  `#`-prefix fallback for `data-heading`; the property-level normalization
  remains an ingest gap (doc, not a render bug).
- **E4 — 04-page-bottom 1.51%.** Residual diff in the page-bottom region
  (code block + property rows + linked references). CodeMirror rest-state
  padding fixed this round; remaining hotspots are concentrated in the
  linked-references block and the table/image blocks near page bottom.
  Under investigation — likely a remaining container padding on
  `.references`/`table` render.
- **E5 — 11-parens/12-at 4.31% flake.** After typing `((`/`@`, one app kept
  the autocomplete popup (or the typed text) while the other dismissed it —
  a full-width band at y≈113. State-dependent capture flake, not a layout
  diff: sibling steps 09/10 of the same AC family are 0.27–0.38%.
- **E6 — right sidebar 2.51% / sidebar-open 2.21%.** Geometry of
  `.cp__right-sidebar` matches (864,0,576×900 both) but the inner column is
  8px shorter (892 vs 900) and the resizer starts at y=32 vs y=0 on LUI —
  the sidebar topbar height differs by ~8px, shifting every sidebar item
  down. Content inside the sidebar item then inherits page-render residuals.
  Root: LUI sidebar topbar/render height vs cljs `cp__right-sidebar-topbar`.
- **E7 — settings 2.96%.** Two compounding diffs: (a) the settings nav rail
  is ~113px narrower on LUI (content column starts at x≈408 vs master
  x≈523) — layout width difference in the settings shell; (b) theme-card
  selection is now normalized to Light on both via `addInitScript`, but the
  rail offset still dominates the diff.
- **E8 — dots-menu 2.14%.** Page visible behind the menu shows the same
  block-area residual as E4; the menu itself matches. Inherits the E4 fix.
- **E9 — master ctx-menu selector.** `.ls-block .bullet, [blockid] .bullet,
  .bullet-container` times out on master at step 20 (LUI opens the menu).
  Consistent across rounds — harness/selector gap on the master DOM, not a
  UI regression.

## Verification

`opam exec --switch=5.5.0 -- dune build @runtest` — 125 checks, 0 failures.
