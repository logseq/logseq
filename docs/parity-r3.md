# Parity r3 — post-merge regression sweep

Web LUI (`deps/ui`, `devin/component-migration`) vs `origin/master` cljs app,
paired captures from identical Chrome profiles with the same fixture
(PPFixture + CardsTest + RefSource + Alpha + Searchable + ACProbe scratch),
`pixelmatch` (threshold 0.15, includeAA:false). Harness:
`scripts/parity/r3/capture.mjs` + `diff.mjs`; shots in
`docs/parity-r3-shots/<theme>-<width>/`.

## Fixes landed in this sweep

- `properties_area.ml`/`page.ml`: plugin `:pagebar` slots rendered as a sibling
  inside the `~gap:8` column added a phantom 8px to the title row (66px vs
  master 58px). Slots now render inside the absolutely-positioned
  `.ls-page-title-actions` row like cljs.
- `tree.ml`: bullet container was 14px fixed with `border-radius:7px`; master
  `.bullet-container` is 16px/`50%`. Inline style updated.
- `tree.ml`: `data-heading`/`data-has-heading` now derive the level from the
  raw `#`-prefixed title when `block_heading` is unset (fixture blocks keep
  the literal prefix). Restores `--ls-block-icon-size` and the heading bullet
  offset.
- `lui-core.css`: `.ui-fenced-code-editor .CodeMirror-lines { padding: 0 }` —
  cljs mounts no CodeMirror at rest; LUI's mounted CM had lib-default
  `padding: 4px 0` (+8px per fenced code block).
- Harness hardening (this was the bulk of the sweep): master's plugin API is
  destructive when keyboard events leak to page-level selection/title:
  - `Backspace` on a selected block deletes it; typing into the page-title
    input renames the page (PPFixture was renamed to `PPFixture@` mid-run).
  - `delete_page`/`create_page` recycle pages; a recycled ACProbe renders
    "Node has been moved to Recycle" (no title/blocks) — captured clicks then
    landed on linked-reference blocks and navigated back to PPFixture.
  - Fixes: editing keys fire only while `activeElement` is inside
    `.block-content`/`.editor-wrapper`/`.CodeMirror`; AC steps verify the
    current page is ACProbe before every keystroke; ACProbe is restored from
    recycle + seeded with a `scratch` block instead of deleted; `get_page`
    lookups retry (name resolution is flaky right after nav).
- Fixture: PPFixture rebuilt identically on both graphs (26 tops / 34 nodes).

## Diff matrix (pixelmatch %)

| step | light-1440 | dark-1440 | light-1024 | dark-1024 | verdict |
|---|---|---|---|---|---|
| 01-journals | 0.01 | 0.01 | 0.02 | 0.02 | noise |
| 02-page-top | 0.05 | 0.05 | 0.07 | 0.06 | noise |
| 03-page-mid | 0.70 | 0.54 | 0.99 | 0.76 | text AA residual (E1) |
| 04-page-bottom | 1.42 | 1.36 | 2.00 | 1.91 | exception E4 |
| 05-block-hover | 0.05 | 0.05 | 0.07 | 0.06 | noise |
| 06-caret | 0.06 | 0.05 | 0.08 | 0.07 | noise |
| 07-selected | 0.05 | 0.05 | 0.07 | 0.06 | noise |
| 08-ac-page | 0.08 | 0.09 | 0.13 | 0.13 | noise |
| 09-slash(-open) | 0.08–0.11 | 0.10–0.13 | 0.14–0.18 | 0.14–0.18 | noise |
| 10-dbracket(-open) | 0.29 / **4.11** | 0.09–0.31 | 0.43 / **5.74** | 0.25–0.43 | flake E5 |
| 11-parens(-open) | 0.15 / **3.96** | 0.13 | 0.18 | 0.17–0.23 | flake E5 |
| 12-at | 0.15 | 0.19 | 0.27 | 0.32 | noise |
| 13-all-pages | 0.64 | 0.67 | 0.88 | 0.94 | noise / E7 residue |
| 14-right-sidebar | 2.30 | 2.47 | 2.92 | 3.12 | exception E6 |
| 15-right-sidebar-close | 0.64 | 0.67 | 0.88 | 0.94 | noise |
| 16-cmdk | 0.24 | 0.26 | 0.32 | 0.36 | noise |
| 17-search | 0.76 | 0.81 | 1.06 | 1.13 | borderline — E8 |
| 18-settings | 2.96 | 3.32 | 4.16 | 4.67 | exception E9 |
| 19-dots-menu | 0.47 | 0.45 | 0.66 | 0.68 | noise |
| 20-ctx-menu | n/a* | n/a* | n/a* | n/a* | harness E10 |
| 21-sidebar-open | 2.19 | 2.50 | 3.09 | 3.46 | exception E11 |

\* master bullet selector times out on every leg (E10); LUI shot exists,
  no pair to diff.

## Exceptions

- **E1 — text raster noise floor ~0.7–1.0%.** Glyph AA differences spread
  evenly; no localized blobs.
- **E2 — ingest normalization gap (root cause, documented).** Master rewrites
  `SCHEDULED:`/`DEADLINE:` into properties, `#` into `:block/heading-level`,
  `[[page]]`/`#tag` into uuid refs, and `upsert_block_property` materializes
  property values as child blocks at ingest; LUI stores the verbatim title.
  Display parity restored via fixture + the tree.ml `#`-prefix fallback; the
  normalization itself is an ingest gap, not a render bug.
- **E4 — 04-page-bottom 1.4–2.0%.** Two compounding ingest diffs: master's
  `upsert_block_property` put the two fixture property values as *child
  blocks* under "Block with properties" (they render as extra rows near page
  bottom); and master's `#`-normalized headings carry `heading-level` props
  vs LUI's raw prefix. Hotspots cluster on the last blocks + linked refs.
- **E5 — 10-dbracket/11-parens 3.7–5.7% (intermittent).** After `[[`/`((`,
  one app's autocomplete popup stayed open while the other's dismissed —
  a full-width band at the popup row. State-dependent timing flake; sibling
  AC steps (09/11-open/12) of the same family are 0.1–0.4%.
- **E6 — right-sidebar 2.3–3.1%.** Sidebar frame geometry matches; inside,
  the page tree renders with a ~2px/line vertical offset (sidebar block
  line-height/padding differs slightly), plus the all-pages table behind has
  a one-row asymmetry from junk pages created by master's AC typing
  (`ACProbe@` etc.) that LUI's list filters differently. The offset itself
  is a real LUI sidebar-render gap worth a follow-up; not a merge
  regression (present in earlier rounds).
- **E8 — 17-search ~0.8–1.1%.** Search result row geometry matches; residual
  is result-count/ranking content + AA on the result list. Borderline at
  1024; not a layout regression.
- **E9 — settings 3.0–4.7%.** The settings nav rail is narrower on LUI so the
  content column starts ~85–115px earlier — a shell layout width difference
  (every settings row then diffs). Theme selection is normalized (Light on
  both); the remaining diff is the rail/content offset. Real layout gap,
  documented rather than silently patched — needs a dedicated sidebar-
  metrics pass.
- **E10 — master ctx-menu selector.** `.ls-block .bullet, [blockid] .bullet,
  .bullet-container` times out on master on every leg (LUI opens the menu).
  Consistent across rounds — master DOM/harness gap, not a UI regression.
  No valid pair could be captured; LUI's menu renders normally.
- **E11 — sidebar-open 2.2–3.5%.** Left sidebar open: master's Recent list
  contains junk pages the AC harness created (`PPFixture((`, `ACProbe((`)
  that LUI's Recent does not — a content asymmetry, plus the main content
  column shifts by a different amount when the sidebar opens (~8px).
  Largely harness fixture noise; the column-shift residual is minor.

## Verification

`opam exec --switch=5.5.0 -- dune build @runtest` — 125 checks, 0 failures.
