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

## Numeric results (round 2, fresh captures after fixes)

### Light theme

| scene | web-vs-master | gpui-vs-web | align offset |
|---|---|---|---|
| 01-top    | 2.04% | 2.52% | 6  |
| 02-mid    | 2.37% | 2.67% | 56 |
| 03-bottom | 2.23% | 2.73% | 0  |

### Dark theme

| scene | web-vs-master | gpui-vs-web | align offset |
|---|---|---|---|
| 01-top    | 6.55% | 2.42% | 6  |
| 02-mid    | 2.94% | 3.06% | 26 |
| 03-bottom | 2.68% | 3.54% | 42 |

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

With palette, centering and title fixed, gpui-vs-web sits at ~2.5% —
just above the web-vs-master baseline (2.0–2.4% light). Diff heatmaps
localize the remainder to:
- **Property rows** — `source-url`/`rating` render as name+value columns
  on web (name left, value mid-column); gpui spreads them name-left /
  value-centered-far-right. Root cause: web relies on the CSS override
  `.property-value-panel .lui-button { justify-content:flex-start }`;
  the OCaml view already emits `~main:`start`/`~text_alignment:`start`
  on the value button, but gpui-component's `Button` hard-codes
  `justify_center` in its internal flex, so the property never reaches
  the label. Needs a lui-gpui Button fix (honor MainAlignment, or render
  ghost buttons as plain flex) — deferred: it lives in the lui repo.
- **Fold/thread guides** — web draws vertical indent guide lines through
  nested children; gpui draws none (bullet column only).
- **Table geometry** — web table spans the content column with a filled
  header row and an empty trailing column; gpui sizes to content with a
  transparent header.
- **Code-block header bar** — gpui draws a persistent `lang ▾ Copy`
  header; web shows none at rest (it appears on hover).
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
  host toolbar row are exempt by spec. All gpui diffs were taken at the
  best-fit crop offset over 0–60px to exclude them.
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
