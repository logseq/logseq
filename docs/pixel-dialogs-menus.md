# Pixel parity: dialogs & menus

LUI web app vs master cljs Logseq, `devin/component-migration` (rebased on ce8a68336f, lui pin f7e8fee0).
Viewport 1280x800, same fixture graph, light + dark shots where relevant.
Master (cljs) served on :3001, LUI web on :3003 (`?rtc-test=true`).
Screenshot pairs + diff heatmaps in `docs/pixel-dialogs-menus/` (`master-*`, `lui-*`, `diff-*.png`).
Harness: `node scripts/pixel/capture-dialogs-menus.mjs <url> docs/pixel-dialogs-menus <tag>` then
`node scripts/pixel/diff.mjs docs/pixel-dialogs-menus` (pixelmatch, threshold 0.1).

## Before / after

`baseline-diff-results.json` was captured at the start of the slice;
`diff-results.json` is the final run.

| Surface | Baseline | Final |
|---|---|---|
| 19-set-property | 4.88% | 1.05% |
| 02-settings-general | 4.43% | 1.26% |
| 18-block-ctx | 4.31% | 1.63% |
| 32-dark-settings | 3.68% | 1.35% |
| 14-login | 3.28% | 0.54% |
| 10-appearance | 2.76% | 1.31% |
| 03-settings-advanced | 2.66% | 1.28% |
| 11-export-page | 2.58% | 0.90% |
| 03-settings-keymap | 2.43% | 1.71% |
| 03-settings-editor | 1.93% | 0.99% |
| 17-delete-confirm | 1.41% | 0.01% |
| 34-dark-right-sidebar | 1.37% | 1.54% |
| 33-dark-block-ctx | 1.21% | 1.40% |
| 23-sidebar-help | 1.17% | 1.38% |
| everything else | ≤0.99% | ≤0.96% |

All 25 surfaces are now ≤1.71% diff; the residual is almost entirely
anti-aliased text pixels, the documented exceptions below, and a small
number of sub-pixel icon strokes.

## Verified identical (geometry probes)

- **Dialog chrome**: `.ui__dialog-content` box model — `max-width:32rem`,
  `padding:1.5rem`, `border:1px`, `border-radius:.5rem`, `max-height:80vh`,
  `overflow-y:auto`, shadow stack — matches shui/Radix output exactly.
- **Backdrop dim**: `.ui__dialog-overlay` = `--lui-c-background` @90%
  (`bg-background/90` in cljs); alert dialogs @80% + the same overlay.
- **Settings `.it` rows**: 3-column grid (`grid-cols-3`), row heights and
  label/control placement match across all five settings tabs.
- **Context menu**: `.ui__context-menu-content` (280×523 at same anchor),
  item rows y-identical, icon/label/check slots, shortcut right-edge x312
  (master 313), chevron x296 (master 297).
- **Export dialog**: textarea identical; options rows y539/h46, y585/h24,
  y609/h24, y633/h24, y657/h46, buttons y719/h28 — byte-identical rects.
- **Appearance popup**: row metrics within 1px.
- **Right sidebar**: pane geometry (x780 w492, header h32), item stacking
  order (newest on top — `cons` semantics), content-driven item heights,
  help pane DOM (titles h24, ul margin-left 19.2px, li h24 circle markers).

## Fixes landed (deps/ui + css)

- `.ui__dialog-overlay` / `.ui__alert-dialog-overlay`: scrim rebuilt with
  `color-mix(in oklab, var(--lui-c-background) {90,80}%, transparent)` —
  `--lui-c-background` is a full `hsl()` color since the theme-var
  namespacing repin, so the old `hsl(var(--lui-c-background))` wrapped it
  twice and produced fully transparent scrims.
- `.ui__dialog-content` / `.ui__alert-dialog-content` / `.ui__toast`:
  dropped the `--ls-primary-text-color` color override — cljs surfaces
  inherit the body color (rgb(23,23,23)); the warm #433f38 was tinting
  every dialog/toast label.
- Dialog content: `border-box`, `max-height:80vh`, `overflow-y:auto`,
  empty `.ui__dialog-title` placeholder removed from layout flow.
- Menu items: `.lui-menu-item-check` hidden inside dropdown/context/
  popover contents (invisible 16px slot was pushing shortcuts/chevrons
  off the right edge); icon/label flex `order` preserved.
- Export view: inner padding 24→4 (cljs `.export.-m-5 > .p-6` net offset),
  per-row `min-height`, options/button block margins, button gap 8→24.
- Login view: auth field rows get `lh-20` labels + `pb-1`; footer gets
  `pt-4` + `min-height:24px` link rows (dialog 368→406px, matches master).
- Right sidebar: `push_item` conses (newest pane on top, matching cljs
  `sidebar-add-block!`); `.sidebar-item-list` is `display:block` so item
  heights are content-driven like cljs, not a 50/50 flex split.
- Right-sidebar help pane implemented (`onboarding.cljs` port): Usage /
  Community / About / Terms sections, external doc links, circle-bullet
  list, "Keyboard shortcuts" action opens the shortcut-settings pane.
- Capture fixture: LUI-only empty sibling block seeded after the first
  block (cljs keeps the auto-created initial block on new pages; LUI
  doesn't create one) so row geometry is comparable.

## Exceptions

1. **`#tag` renders as `#Tag`** in LUI blocks and the export preview —
   the LUI block renderer capitalizes tag display. Kept (render-layer
   choice), contributes a small text diff in block shots.
2. **Right-sidebar help pane drops the Development section**
   (Roadmap / Bug report / Feature request / Changelog) — product-owner
   request. This shifts the Contents pane ~140px up vs master and is the
   bulk of the remaining sidebar-help / dark-right-sidebar diff.
3. **Keymap tab counts differ** (master All·116 / Unset·9; LUI All·125 /
   Unset·18) — LUI registers a different command set; a data difference,
   not a styling one. LUI's "Basics" group header also shows a collapse
   chevron master's lacks.
4. **Right-click selection**: LUI selects the block under the cursor;
   master keeps the prior selection. LUI's behavior kept (matches native
   outliner UX); the capture clicks the already-selected block to keep
   screenshots comparable.
5. **Menu item DOM tag**: LUI emits `button.lui-menu-item` with
   icon/label/check slots vs cljs `div` markup — identical role/geometry;
   tag-name difference is invisible.
