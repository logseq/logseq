# Pixel-level parity: journal/page block rendering + editing

Slice: block text, bullets, indentation, inline formatting (bold/italic/code/links/tags/page-refs/task markers/latex), code blocks, embeds, block spacing, caret/selection colors, fold arrows, left editor gutter.

- **master**: `logseq/logseq` @ `22a29b30de` (cljs web app) on `http://localhost:3001/`
- **LUI**: `devin/component-migration` (rebased @ `ce8a68336f`, lui pin `f7e8fee0b`), on `http://localhost:3003/index.html?rtc-test=true`
- **Viewport** 1280×800, themes light + dark, same `PPFixture` page seeded via `logseq.api` on both.
- **Tooling**: `scripts/parity/pixel/` — `capture.mjs` (paired screenshots, persistent profiles under `~/parity-profiles/`), `diff.mjs` (pixelmatch % + region heatmaps into `docs/pixel-blocks/<theme>/diff/`), probes (`probe-caret.mjs`, `probe-editparity.mjs`, `probe-shift.mjs`).
- Pairs: `docs/pixel-blocks/{light,dark}/{master,lui}-*.png`.

## Results

| shot | light | dark |
|------|-------|------|
| 01-top | 1.87% | 1.76% |
| 02-mid | 1.50% | 6.38% |
| 03-bottom | 1.33% | 5.89% |
| 04-fold-hover | 1.87% | 1.76% |
| 05-editing | 1.87% | 1.76% |
| 06-after-escape | 1.87% | 1.76% |

Baseline at slice start: comparable shots ran ~1.7–2.3% with several structural defects stacked on top (children column collapsed to zero width, a ~96px phantom gap between page title and block list, block column shifted right ~20px, header shrunk 3px, page-title row geometry off by ~30px, code block rendered as plain text, headings collapsed when editing). Those were each verified fixed; the residual ~1.3–1.9% is sub-pixel text antialiasing at inline-format boundaries plus the exceptions below.

Dark `02-mid`/`03-bottom` sit at ~6% almost entirely because master's capture shows the RTC "Comments 0" panel under `List parent` (~89px tall, pushes everything below it down). See exceptions.

## Acceptance criteria

### (1) Click → caret parity — PASS, 10/10 probes

Probes click a rendered character position inside each inline construct and compare the resulting raw-markdown caret offset with master's. Verified equal: bold (9), multi-mark mid-span (29), italic (4), inline code (19), highlight (21), CJK row (7), plus page-ref/tag clicks navigating on both. Fixes that landed for this:

- `editor_state`/`editor_actions`: initial caret for a click-mount is the requested position, not `0` — mounting at `0` sat inside the first `**` reveal range and shifted the hit-test layout ~21px right, biasing offsets early by 2–4 chars.
- `apply_focus` re-entry: the outer pass no longer re-lands a stale arm after the inner pass consumed it (arm-identity gate).
- `last_focus_emitted` dedup keyed on the arm, not the block uuid (a second edit of the same block previously never re-armed).
- `apply_input` frame path no longer writes back a stale model that covered the landed caret.
- `.ed-*` inline mark spans now carry the read-mode styles (bold/italic/strike/mark/code/page-ref) so edit-mode geometry matches read-mode geometry — the hit-test coords are read-mode coords.

### (2) Edit-mode parity outside the editing element — PASS

Paired read-vs-edit screenshots with the editor rect masked out, per block:

- h1/h2/h3 blocks: master keeps heading geometry in the editor via `.uniline-block hN` on the textarea. LUI now stamps the same classes on `.block-editor` (set from `Render.heading_level` in `tree.ml`, threaded through `Editor_surface.mount ~cls` → `Edit_view.view ~cls`) and `.block-editor.uniline-block.hN .ed-line { min-height: 1em }` drops the 1.5em floor that would overshoot the heading line-height. Verified: block heights identical (65.2/54.1/28px), next-block shift = 0 on both, masked diff = 0px.
- quote (−32px), table (−36px), display-math (−56.2px), code block: the same collapse happens on master — editing shows raw source on both → parity, not a defect.
- list parent and plain blocks: no shift on either side.

## Exceptions (kept LUI behavior)

1. **Image block in edit mode.** Master's textarea dumps the full base64 data URI of the `![tiny](data:...)` markdown (~16px extra height of URI noise). LUI hides the markup while editing — deliberately cleaner; kept.
2. **Block comments (RTC).** Master renders a `Comments 0` thread panel + comment affordance under `List parent` (collaborative comments feature). LUI has no comments implementation; documented as a feature gap, not a pixel bug. Accounts for essentially all of the dark mid/bottom residual.

## Harness notes

- `launch()` returns whatever page the persistent profile restored; `capture.mjs` now `goto`s the app origin before touching `localStorage` (theme writes on `about:blank` silently fail).
- LUI theme is storage-driven (`theme`/`system-theme?`, JSON-quoted values) and re-applied at boot — class toggles get reverted by the render signal, so captures set storage + reload.
- `delete_page` recycles rather than removes; the `PPFixture` name route could hit a stale recycled twin — captures resolve the live page's uuid via `api.get_page` first. Reseeding (`seed3.mjs`) clears top-level blocks so runs are idempotent.
- Code-block fixture: `append_block_in_page` stores only the fence body as title on LUI (no `display-type`/`code-lang` attrs); `update_block` with the raw fence restores it so `Render.src_block` emits `.ui-fenced-code-editor` + CodeMirror.
- `pkill -f "parity-profiles/<tag>"` before every capture — persistent Chrome contexts are single-instance.
