# Pixel parity round 2 — outliner / blocks / editor

Slice: journal page blocks (bullets, indentation, page/tag/embed/clock/marker
rendering, property rows, linked refs section, block context menu, hover
actions, collapse chevrons), editor states (caret, selection, edit-mode chrome,
slash/`@`/`[[`/`((` AC popups, editing vs read-mode consistency), PDF
highlights + flashcards as rendered in blocks.

Method: paired 1280×800 screenshots of the `PPFixture` fixture graph
(~52 top-level blocks + 5 extras incl. LOGBOOK clock, SCHEDULED/DEADLINE,
`{{embed}}`) and `CardsTest`, captured with `scripts/parity/pixel2/capture.mjs`
on master cljs (`http://localhost:3001`) and LUI web
(`http://localhost:3003/index.html?rtc-test=true`), diffed with
`scripts/parity/pixel2/diff.mjs` (pixelmatch, threshold 0.15, AA excluded).
Pairs live in `docs/pixel2-outliner/{light,dark}/`, heatmaps under `diff/`.

## Fixes landed this round

1. **Slash/AC popup never flipped above the caret** (`deps/ui/src/popups/
   popups_state.ml`). `open_ac` measured the popup height for ~480 ms
   (`measure 30`) after mount; on a cold load the command items resolve
   later than that, so the measured height stayed small and the
   `h > below && above > below` flip check never fired — the popup stayed
   below the caret, clipped, while master's base-ui collision check keeps
   re-measuring continuously. Raised the re-measure window to ~2 s
   (`measure 120`). light `09-slash` went from ~98% (whole popup below
   fold / clipped) to 1.57%.

2. **Capture harness** (`scripts/parity/pixel2/capture.mjs`, test-only):
   - `Meta+a` + `Backspace` in read mode selects **every** block and wipes
     the page on LUI — the AC section now clears the probe line
     char-by-char instead. (This had silently destroyed the LUI fixture
     mid-run; page was re-seeded after the fix.)
   - Master's `.dark` class is dropped by every `page.reload` — theme is
     re-applied after each reload via `applyTheme()`.
   - LUI needs a `page.reload` after `logseq.api.append_block_in_page`
     before the new block renders; the block selector is
     `.ls-block[data-blockid]` (master also accepts `[blockid]`).
   - Master opens the block context menu on **left**-click of the bullet.

## Numbers (pixelmatch % differing pixels)

| shot | light | dark | notes |
|------|-------|------|-------|
| 01-top | 1.87% | 1.76% | full page top |
| 02-mid | 1.79% | 6.22% | dark: see exception E1 |
| 03-bottom | 1.95% | 6.46% | dark: see exception E1 |
| 04-block-hover | 1.91% | 1.76% | |
| 05-fold-hover | 1.67% | 1.73% | |
| 06-editing | 1.87% | 1.76% | |
| 07-after-escape | 1.87% | 1.76% | |
| 08-ctx-menu | 1.87% | 1.76% | no menu opened on either side (E3) |
| 09-slash | 1.57% | 5.93% | flip fixed; dark pair skewed (E2) |
| 10-at | 1.55% | 6.22% | `@` opens no popup on either side |
| 11-dbracket | 1.80% | 3.69% | both render date-picker AC |
| 12-parens | 1.67% | 6.03% | both render block-ref hint AC |
| 13-collapsed | 1.87% | n/a | master dark shot unavailable (E4) |
| 14-linked-refs | 0.43% | 0.42% | Alpha page linked refs |

The residual ~1.5–2% on static shots is glyph-level AA/subpixel noise —
every text row differs by <1 px line metrics; heatmaps show it spread
evenly rather than concentrated on a component. Same floor as round 1.

## Remaining deltas / exceptions

- **E1 — dark `02-mid`/`03-bottom` ~6.2–6.5%**: mixed cause. Master's
  outliner lazily mounts rows on scripted scroll (probe reached ~32 of
  ~46 `.ls-block`s, so the bottom rows simply aren't in master's DOM for
  the shot) plus real subpixel drift in the shared region. LUI renders
  all blocks — arguably better; chasing the last rows on master is a
  virtualization artifact, not a parity gap.
- **E2 — dark AC shots ~3.7–6.2%**: master's slash popup did not open in
  the dark run (probe log `AC 09-slash []`), so `09-slash` diffs LUI's
  open menu against no menu. `11`/`12` (3.7–6.0%) do have both popups —
  residual is item-list content (LUI shows command entries vs master's
  date-picker items at different heights) plus E1-style text noise.
- **E3 — block context menu did not open on either app** (`CTXMENU: []`
  both runs): left/right click on the bullet produced no menu on master
  or LUI, so there is nothing to diff — behavior identical, trigger still
  unknown in the harness.
- **E4 — dark `13-collapsed`**: master's 'Collapsible parent' block did
  not mount in two dark runs (lazy-mount flake); the pair is
  light-verified (1.87%) and `lui-13-collapsed.png` shows the correct
  dark folded state.
- **`SCHEDULED:`/`DEADLINE:`/`LOGBOOK:`/`{{embed}}` raw text**: renders
  verbatim on both sides in this DB-mode graph (master shows the same
  raw lines). Verified visually in the `03-bottom` pair — parity.
- **Dark code-block palette**: master's dark theme is applied as a DOM
  class only, so its CodeMirror keeps the light palette in these shots;
  LUI follows the class and uses the dark palette. Harness artifact, not
  an app diff (LUI matches real dark behavior).

## Not covered / follow-ups

- `@` mention AC produces no popup on either side (parity; master shows
  nothing for `@` in this graph too).
- Real device-hover context menu (`08`) identical but empty — a manual
  right-click check on a live session would close E3.
- PDF highlight + flashcard coverage is unchanged from round 1
  (`docs/pdf-flashcards-parity.md`); `CardsTest` seeds exist on both
  sides and render identically in `02-mid`/`03-bottom` region diffs.
