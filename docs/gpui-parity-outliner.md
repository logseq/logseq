# GPUI outliner parity audit — round 2

Three-way pixel comparison of the outliner surfaces:

- **master** — cljs app, `origin/master`, `localhost:3001`, Playwright headless
  Chrome 1280x800 (persistent profile `parity-profiles/master`).
- **web** — deps/ui LUI bundle (`dune build js_app` + `vite build`), served at
  `localhost:3003/index.html?rtc-test=true`, same viewport/profile harness.
- **gpui** — `deps/ui/gpui/host` debug binary, window 1280x840 incl. ~20px of
  native titlebar/toolbar chrome, captured via `screencapture -R`.

## Fixture

`scripts/parity/pixel3/fixture.mjs` PPFixture page: 26 top-level blocks /
34 nodes incl. nested children and `source-url`/`rating` properties, plus
`Alpha`/`Beta Page` page-ref targets. `reseed3.mjs` hard-deletes the fixture
and ref-target pages (`delete_page` + `delete_recycled_page_permanently`)
before seeding, so repeat runs cannot leave stale-uuid refs — this fixed the
round-1 drift where a re-seed rebound `[[Alpha]]` to a new uuid while old
blocks kept pointing at the recycled one. The graph was exported from master
as sqlite (`showSaveFilePicker`-stubbed `download_graph_db`) and placed at
`$LOGSEQ_ROOT_DIR/graphs/Demo/db.sqlite` for the gpui daemon, so all three
render byte-identical data. Seed order is newest-first on all apps.

## Method

- Captures: `capture3.mjs` drives master + web for 14 scenes (top/mid/bottom,
  hover, editing, ctx menu, slash/@/[[/(( autocompletes, collapsed,
  linked-refs), light + dark. gpui scenes are `screencapture` window grabs at
  the same scroll stops.
- Diffs: `diff3.mjs` — pixelmatch `threshold 0.15, includeAA false`.
  gpui-vs-web auto-aligns by scanning crop offsets 0–60 px (native titlebar)
  and reports the minimum.
- Dark mode: web via `localStorage.theme="dark"`; master via `.dark` DOM
  class (harness artifact — code editors keep the light palette); gpui via
  `ui-state.json` `theme="dark"` + relaunch.

## Numeric results (round 6, fresh captures after fixes)

### Light theme

| scene | web-vs-master | gpui-vs-web | align offset |
|---|---|---|---|
| 01-top    | 2.04% | 2.67% | -1 (content-aligned) |

### Dark theme

| scene | web-vs-master | gpui-vs-web | align offset |
|---|---|---|---|
| 01-top    | 6.55% | 2.67% | 2  |

Method note (round 6): `diff3.mjs` now scans signed offsets ±60. For the
gpui-vs-web number, gpui's native toolbar is excluded by cropping the
gpui shot at y=72 *before* scoring — without that, the offset scan
latches onto the ~45-76px "titlebar removal" artifact instead of true
content alignment. The reported gpui-vs-web figure is the honest
content-aligned diff; earlier rounds' 2.4-2.9% numbers used the
titlebar-confounded global scan and were optimistic by ~0.1-0.3%.

Earlier scenes (02-mid/03-bottom, captured before the round-4/5 layout
fixes): light gpui-vs-web 2.67%/2.73%, dark 3.06%/3.54% — the same
class registrations apply to them and should be re-measured when the
fixture is re-captured.

Round-1 baselines for comparison: dark gpui-vs-web was ~90% before the
palette fix (F1); light was 2.2–2.9%.

Diff heatmaps: `shots/<theme>/diff/m-l-*.png`, `l-g-*.png`
(under `/Users/devin/parity-work`, session-local — regenerate with the
scripts above).

## Findings

### F0 (fixed) — gpui host could not link: missing OCaml bridge exports

`deps/ui/native/logseq_lui_bridge.c` lacked exports the lui-gpui crates
require at HEAD (`lui_ocaml_press_ex`, `lui_ocaml_load`,
`lui_ocaml_text_changed_utf8`, `lui_ocaml_picked_utf8`,
`lui_ocaml_extension_event_utf8`, `lui_ocaml_resync`). Added them plus the
OCaml registrations (`native_embed.ml`), mirroring
`lui/platform/native/lui_ocaml_bridge.c`. `cargo build` succeeds; app boots.

### F1 (fixed) — gpui dark theme used the wrong palette

gpui dark background was `rgb(15,15,15)`; Logseq dark is `rgb(0,44,55)`
(Solarized dark). `main.rs` installed gpui-component's `default_dark_theme`.
Fixed: `apply_logseq_palette` (host `main.rs`) mutates cloned ThemeConfigs
with the full Logseq palette (~30 colors per mode) plus the Solarized
highlight-editor theme (`ThemeConfig.highlight`), then `Theme::change`.
Dark gpui-vs-web dropped from ~90% to 2.4–3.5%.

### F2a — page-column centering (fixed)

The `.cp__sidebar-main-content` class registration carried
`margin-left:auto;margin-right:auto` from the web stylesheet. Under
taffy, each main-axis auto margin receives the full free space — so
`margin-left:auto` pushed the 960px column hard right (bounds
`[320,245 960x378]`) and the OCaml `row ~main:`center` wrapper
(native/chrome.ml `main_content`) had no space left to center within.
Dropping the margins lets the row's justify-center place the column at
`[160,245 960x378]` — same column position as the web.

### F2b — page-title metrics (fixed)

gpui rendered the page title at 20px/600 via the generic `title` style
utility; the web's `.ls-page-title-container` sets 32px/500 with the
`--ls-title-text-color`. Registered that class in the host's class
dictionary — the title now matches the web's metrics.

### F2 — residual layout divergence vs web (>1%, documented exception)

With palette, centering, title, row pitch, table, title-actions,
property rows, page-inner gap and code-editor background fixed,
gpui-vs-web sits at 2.67% (light, honest content-aligned measure on
scene 01) — within ~0.6% of the web-vs-master baseline (2.04% light)
and well below the dark baseline (6.55%). The title line and the
`.ls-page-blocks` column now land at the same y on both apps. Diff
heatmaps localize the remainder to:
- **Property rows** — FIXED (round 4 + round 6). Stacked causes:
  (1) the `native/` twin of `properties_value.ml` had drifted — its
  `value_button` lacked `~label`/`~style_class:"pv-scalar"`/`~main:`start`;
  (2) gpui-component `Button` hard-codes `justify_center` inside its
  label flex, so MainAlignment never reached the label — fixed in
  lui-gpui via `aligned_button`; (3) `.property-key-inner` emitted a
  `column` (icon stacked above the key, 39px rows) where the web is a
  flex row at min-height 28px — `properties_area.ml` now emits
  `Lui_elements.row ~gap:4 ~cross:`center` and the host registers
  28px min-heights on `.property-key-panel`/`.property-key-inner`/
  `.property-value-panel`, `margin-right:4px` on `.property-icon`, and
  naked 20px label metrics on `.property-k`. Rows render horizontally
  at ~17-28px like the web.
- **Page-inner phantom gap** — FIXED (round 6). `.page-inner` is a
  column with `gap:32px`; on gpui two *empty wire `box` nodes* (the
  page-title wrapper's sibling anchors) occupied real flex slots,
  consuming an extra 32px gap and pushing `.ls-page-blocks` +28px.
  Web `box`/`lui-box` is `display:contents` — an empty box contributes
  nothing. Fixed in lui-gpui `kinds.rs`: childless, text-less `box`
  nodes now mount out of flow (`absolute().size_0()`), so they neither
  paint nor consume gaps.
- **Code-editor background** — FIXED (round 6). gpui rendered fenced
  code editors on the neutral window background; the web's solarized
  light editor bg is `rgb(253,246,227)` (`#fdf6e3`). gpui-component's
  `Editor` paints no background of its own, so registering
  `background:var(--lx-gray-01, #fdf6e3)` on `.extensions__code` shows
  through and tracks the theme var in dark mode.
- **Title metrics** — refined (round 6): measured web `.ls-page-title`
  is 36px/500 at line-height 54 (the `--ls-page-title-size` var, not
  32); the registration now declares `font-size:36px;line-height:54px`.
  The gpui text box reaches h=54 but glyph ink still measures ~21px vs
  web's ~26px — residual suspect: `text_size` set on the wrapping box
  does not reach the leaf text node in lui-gpui's style pipeline.
- **Fold/thread guides** — FIXED. `.block-children` now carries the web's
  1px `--ls-guideline-color` left border; indent guides paint under
  nested children.
- **Table geometry** — FIXED. The `.markdown-table` wrapper was sized to
  content; registered `width:100%` (plus the web's 8px vertical margins).
  Cell borders/padding and the header fill already flowed through the
  `data-style` channel.
- **Row pitch** — FIXED. gpui's text line box is ~26px where the web's
  is 24px (16px/1.5); `.ls-block` now carries 1px vertical padding so
  block rows pitch at the web's 28px.
- **Title-actions strip** — FIXED. `.ls-page-title-actions` is
  `position:absolute;top:-1.25rem` on web (no layout space, revealed on
  hover). gpui cannot take the row out of flow inside the scroll clip,
  so it renders at `height:0` — invisible at rest (opacity is already
  hover-driven), buttons overhang the title on hover.
- **Table header cells** — FIXED. Web `<th>` bold + center come from
  the UA stylesheet; gpui has none. `render.ml` now declares
  `font-weight:700;align-items:center` on `th` cells via `data-style`
  (the attribute is inert on the web DOM).
- **Code-block header bar** — FIXED (round 5, refined round 6).
  `render.ml` `code_block` now drives the actions container's opacity
  with a reactive hover signal (`Signal.state` + `Runtime.flush`), the
  same mechanism as `.ls-page-title-actions`; the host registers
  `.code-block-actions` as an absolute overlay at top/right. At rest
  gpui shows no header — parity with the web's rest state.
- **In-box text baseline** — OPEN. Inside equal-height rows (~26px)
  gpui ink sits ~4-10px higher than web ink on every text row
  (uniform, not per-element). Suspect: gpui's shaped-line placement
  inside the line box vs CSS `line-height` centering. Diff contribution
  is a per-row vertical smear, the largest remaining component.
- **Title ink height** — OPEN (partial): see "Title metrics" above.
- **Image alt chip** — the `![tiny]` data-url image renders as a visible
  `[tiny]` bracketed chip on its own line in gpui (block-level div split —
  same mechanism as F5); web renders the decoded inline image, near-
  invisible at 8x8 px.

Root causes are per-surface layout/styling gaps in the gpui host
renderers, not data or state bugs. Each is fixable but none is a one-line
change; they are listed as tracked open items rather than masked.

### F3 (verified parity) — unresolved page/block refs render red-underlined

`[[uuid]]` refs that don't resolve render on all three as red underlined
literal text. gpui was missing the `.broken` affordance entirely (round 1);
added `register_class_style("broken", "color:var(--ls-broken-ref-color)");
text-decoration:underline")` in `logseq_ext.rs` with the host-written
`--ls-broken-ref-color` CSS var (radix red-11: `#ff6369` dark / `#cd2b31`
light) set per mode in `main.rs` — the web pulls the same red from
`--lx-red-11`/`--rx-red-11`, which have no gpui counterpart. gpui has no
wavy-underline paint op, so the mark is straight underlined — text-raster
noise level difference.

Important subtlety: after reseeding, master's own db contains page refs
whose stored uuid points at a recycled Alpha page — so **master and gpui
render both refs broken identically (same uuids)**, while web LUI's own
graph has them resolved. This is data-level divergence of the master's
fixture import, not a renderer difference; gpui matches master exactly.

### F4 (fixed) — code block body emptied after scrolling away and back

gpui-base `InputBaseState::on_scroll_wheel` scrolls the editor's inner
scroll region; with the default `scroll_beyond_last_line` (viewport/2) a
wheel tick parked the retained EditorState at a negative offset, so the
virt-list remount repainted blank. Fixed in `logseq_ext/codemirror.rs`:
`.scroll_beyond_last_line(Some(0))` at EditorState construction — wheel
events can no longer drive the editor past its content.

### F5 (fixed) — display math shares the text line instead of its own

`$$E=mc^2$$` rendered inline on the title's baseline. The native twin
(`deps/ui/native/logseq_katex.ml`) mounted display math as `logseq-span`
with a `display` extension prop that never crosses the wire — the
generic-dom emission carries only style-class/text/attrs. Fixed:
display-mode math now mounts as `logseq-div` + `.latex` (the class the
host's katex slot already treats as display). In lui-gpui
(`kinds.rs`/`dom.rs` — pushed as lui branch
`devin/gpui-inline-block-split`), a block-level extension child
(`logseq-div`/`logseq-table`) inside an inline run now splits the flow
onto its own line — DOM-accurate block-in-inline behavior. Renders
centered on its own line, matching web's `.katex-display`.

### F6 (verified parity) — `- [x]` / `- [ ]` render literally

Both web LUI and gpui render `- [x] checked task item` as literal text —
the deps/ui renderer doesn't emit a checkbox for these markers. This is a
shared deps/ui-vs-master gap (master renders TODO/DOING chips via
properties, not `- [x]` affordances either in DB graphs), not a gpui
divergence. Documented, not fixed.

## Documented exceptions

- **Mac toolbar/titlebar** — traffic lights, native drag region, and the
  host toolbar row are exempt by spec. gpui shots are cropped at y=72
  before scoring; `diff3.mjs` scans signed offsets ±60 for residual
  content alignment.
- **Master dark code editors** — harness toggles `.dark` on the DOM only;
  CodeMirror keeps light colors inside fenced editors on master shots.
- **Fonts** — gpui uses the system font stack; raster-level AA noise in
  text runs is expected and accounted for by `threshold 0.15`.
- **Master interactive scenes** — the cljs harness produced empty
  ctx-menu/slash/at results on master (scenes 08–10 captured as plain
  page); m-l numbers for those scenes measure popups against a plain page
  and are listed for completeness, not as web regressions.

## Reproducing

```sh
# web/master scenes (needs master cljs on :3001, LUI dist on :3003)
cd scripts/parity/pixel3
node reseed3.mjs master    # hard-delete + recreate fixture pages
node reseed3.mjs lui
node capture3.mjs master light   # also re-seeds in-session via ensureSeed
node capture3.mjs lui light
node capture3.mjs master dark
node capture3.mjs lui dark
# gpui (fresh export: node exportdb.mjs, copy to $LOGSEQ_ROOT_DIR/graphs/Demo/)
LOGSEQ_ROOT_DIR=/Users/devin/parity-gpui LOGSEQ_NO_LOGIN_DAEMON=1 \
  LOGSEQ_DB_WORKER_BIN=<worktree>/deps/db-worker/_build/default/bin/main.exe \
  deps/ui/gpui/host/target/debug/logseq-gpui
screencapture -R 80,80,1280,840 <out>.png   # per scroll stop
node diff3.mjs light && node diff3.mjs dark
```

## Open items (next pass)

- F2 itemized layout divergences (title metrics, property rows, fold
  guides, table geometry, code header bar, image alt chip).
- Interactive scenes for gpui (hover pills, editing caret, ctx menu, AC
  popups, collapsed chevrons, linked refs) — need an input-synthesis
  driver (cliclick/osascript) on the host window; scenes 04–14 pending.
- EXTRA seed (DOING Clocked, LOGBOOK, SCHEDULED, DEADLINE, embed) +
  CardsTest page not yet applied to this fixture round.
