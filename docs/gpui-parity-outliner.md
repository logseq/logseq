# GPUI outliner parity audit — round 1

Three-way pixel comparison of the outliner surfaces:

- **master** — cljs app, `origin/master`, `localhost:3001`, Playwright headless
  Chrome 1280x800 (persistent profile `parity-profiles/master`).
- **web** — deps/ui LUI bundle (`dune build js_app` + `vite build`), served at
  `localhost:3003/index.html?rtc-test=true`, same viewport/profile harness.
- **gpui** — `deps/ui/gpui/host` debug binary, window 1280x840 incl. ~20px of
  native titlebar/toolbar chrome, captured via `screencapture -R`.

## Fixture

`scripts/parity/pixel/fixture.mjs` PPFixture page: 26 top-level blocks /
34 nodes incl. nested children and `source-url`/`rating` properties, plus an
`Alpha` page-ref target. Seeded identically on all three via
`logseq.api` (`insert_batch_block` → `insert_block` → `append_block_in_page`
fallback chain; master rejects `#tag`/`#[A]` batch writes so those 4 blocks
land via `insert_block`). The graph was exported from master as sqlite
(`showSaveFilePicker`-stubbed `download_graph_db`) and placed at
`$LOGSEQ_ROOT_DIR/graphs/Demo/db.sqlite` for the gpui daemon, so all three
render byte-identical data. Seed order on all apps is newest-first
(`insert_*` prepends) — identical on master/web/gpui, verified via block
text dumps.

## Method

- Captures: `scripts/parity/pixel3/capture3.mjs` (ported from pixel2) drives
  master + web for 14 scenes (top/mid/bottom, hover, editing, ctx menu,
  slash/@/[[/(( autocompletes, collapsed, linked-refs), light + dark.
  gpui scenes are `screencapture` window grabs at the same scroll stops.
- Diffs: `scripts/parity/pixel3/diff3.mjs` — pixelmatch `threshold 0.15,
  includeAA false`. gpui-vs-web auto-aligns by scanning crop offsets
  0–60 px (native titlebar) and reports the minimum.
- Dark mode: web via `localStorage.theme="dark"`; master via `.dark` DOM
  class (harness artifact — code editors keep the light palette);
  gpui via `~/Library/Application Support/logseq/ui-state.json`
  `theme="dark"` + relaunch.

## Numeric results

### Light theme

| scene | web-vs-master | gpui-vs-web | align offset |
|---|---|---|---|
| 01-top      | 1.41% | 2.20% | 6  |
| 02-mid      | 1.44% | 2.27% | 44 |
| 03-bottom   | 1.37% | 2.90% | 0  |
| 14-linked-refs | 0.40% | pending |

### Dark theme

| scene | web-vs-master | gpui-vs-web | note |
|---|---|---|---|
| 01-top    | 1.41% | 92.7% | dark palette mismatch, see F1 |
| 02-mid    | 1.76% | 88.1% | same |
| 03-bottom | 1.65% | 87.9% | same |

Diff heatmaps: `shots/<theme>/diff/m-l-*.png`, `l-g-*.png`
(under `/Users/devin/parity-work`, session-local — regenerate with the
scripts above).

## Findings

### F0 (fixed) — gpui host could not link: missing OCaml bridge exports

`deps/ui/native/logseq_lui_bridge.c` lacked exports the lui-gpui crates
require at HEAD (`lui_ocaml_press_ex`, `lui_ocaml_load`,
`lui_ocaml_text_changed_utf8`, `lui_ocaml_picked_utf8`,
`lui_ocaml_extension_event_utf8`, `lui_ocaml_resync`). Added them plus the
OCaml registrations (`native_embed.ml`: `press_ex` → `PressModifiers`,
`load` → `Load`, `resync` → `Lui_runtime.resync_batch` encoded via
`Lui_wire`), mirroring `lui/platform/native/lui_ocaml_bridge.c` +
`lui_native_bridge.ml`. `cargo build` now succeeds and the app boots.

### F1 — gpui dark theme uses the wrong palette (>1%, documented exception)

gpui dark background: `rgb(15,15,15)`; web/master dark background:
`rgb(0,44,55)` (Logseq dark). Every pixel differs → ~90% diffs.
Root cause: `gpui/host/src/main.rs` installs `registry.default_dark_theme()`
(the gpui-component default) instead of the Logseq dark palette used in the
light preset. Fix belongs in the host theme preset wiring (map the Logseq
dark palette onto `Theme.dark_theme` when the app reports `dark-theme`
class). Not yet fixed — needs the Logseq dark color table plumbed through
the OCaml→Rust theme event or a static dark preset mirroring the light one.

### F2 — systematic vertical layout drift vs web (>1%)

Light-mode gpui-vs-web sits at 2.2–2.9% across all scroll stops. Per-band
analysis shows diffs distributed over the whole page (not localized to
chrome): block row spacing and header block heights differ slightly
(web rows at ~28px pitch from y≈291 vs gpui ~26-28px pitch from y≈316;
page title/header block ~5-10px lower in gpui). Root cause candidate: gpui
text measurement/line-height rounding differs from the web's px metrics —
to be fixed in the gpui renderer's row metrics, or in the deps/ui layout
props the host consumes. Needs a targeted fix pass; kept as open item.

### F3 — page refs render as literal `[[uuid]]` in gpui

`Page ref [[Alpha]] …` renders in gpui as
`Page ref [[6ac77eee-…]] and another [[6ac77eee-…]]` — the uuid is shown
verbatim. Web and master resolve uuid refs to page titles ("Alpha"/"Beta").
Root cause: gpui renderer does not resolve `[[uuid]]` link nodes to page
titles (lookup misses or never runs in the host's inline renderer).
Open fix item (likely host-side inline-ref resolution).

### F4 — code block body empties after scrolling away and back

On first paint the fenced block shows `def hello(): / print("hi")`; after
scrolling it out and back, the body area is empty (header + "Copy" remain).
Reproduced in light and dark. Virtualization/eviction bug in the gpui code
editor surface (content view is released and not remounted on re-entry).
Open fix item — gpui host, not deps/ui view code.

### F5 — display math not centered (confirm vs prior report)

`$$E=mc^2$$` renders inline-left in gpui; prior round documented this vs
web (which centers display math). Still open — same class of issue as F2.

### F6 — `- [x]` / `- [ ]` markers render literally in gpui

The checked/unchecked items show raw `- [x]`/`- [ ]` text; master renders a
checkbox affordance. Web parity needs a dedicated crop check (m-l diff is
only 1.4% — if web also shows literal text this is a shared deps/ui gap vs
master, not gpui-specific). Listed for the next pass.

## Documented exceptions

- **Mac toolbar/titlebar** — traffic lights, native drag region, and the
  host toolbar row are exempt by spec. All gpui diffs were taken at the
  best-fit crop offset over 0–60px to exclude them.
- **Master dark code editors** — harness toggles `.dark` on the DOM only;
  CodeMirror keeps light colors inside fenced editors on master shots.
- **Fonts** — gpui uses the system font stack; raster-level AA noise in
  text runs is expected and accounted for by `threshold 0.15`.

## Reproducing

```sh
# web/master scenes (needs master cljs on :3001, LUI dist on :3003)
cd scripts/parity/pixel3
node capture3.mjs master light   # also seeds PPFixture in-session
node capture3.mjs lui light
node capture3.mjs master dark
node capture3.mjs lui dark
# gpui (seeded graph at /Users/devin/parity-gpui)
LOGSEQ_ROOT_DIR=/Users/devin/parity-gpui LOGSEQ_NO_LOGIN_DAEMON=1 \
  LOGSEQ_DB_WORKER_BIN=<worktree>/deps/db-worker/_build/default/bin/main.exe \
  deps/ui/gpui/host/target/debug/logseq-gpui
screencapture -R 80,80,1280,840 <out>.png   # per scroll stop
node diff3.mjs light && node diff3.mjs dark
```

## Open items (next pass)

- Interactive scenes for gpui (hover pills, editing caret, ctx menu, AC
  popups, collapsed chevrons, linked refs) — need an input-synthesis
  driver (cliclick/osascript) on the host window; scene parity for
  04–14 pending.
- F1 dark palette, F2 layout drift, F3 uuid refs, F4 code-block
  virtualization, F5/F6 — fixes in gpui host / deps/ui view code.
- EXTRA seed (DOING Clocked, LOGBOOK, SCHEDULED, DEADLINE, embed) +
  CardsTest page not yet applied to this fixture round.
