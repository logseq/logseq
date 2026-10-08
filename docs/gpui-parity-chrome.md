# GPUI host chrome + popup parity audit

Triple target audit of the GPUI host (`deps/ui/gpui/host`, native OCaml
views in `deps/ui/native/`) against the LUI web build
(`deps/ui` → `js_app` + vite) and cljs master (`origin/master`), per the
chrome + popup parity brief. Pixel comparisons use pixelmatch over
identical-viewport screenshots (1280×840, light theme, same "Demo" graph
fixture). The only sanctioned GPUI difference is the native Mac
toolbar/titlebar.

## Method

- **master**: `origin/master` shadow-cljs app at `localhost:3001`,
  persistent Chrome profile `~/parity/profiles/master`.
- **LUI web**: `deps/ui` `dune build js_app` + `vite build`, served at
  `localhost:3003` (`?rtc-test=true`, auto "Demo" graph), profile
  `~/parity/profiles/lui`.
- **GPUI**: `deps/ui` `dune build gpui/native_embed.exe.o` then
  `cargo build` in `deps/ui/gpui/host`, launched with
  `LOGSEQ_ROOT_DIR=/Users/devin/logseq-gpui`,
  `LOGSEQ_DB_WORKER_BIN=.../deps/db-worker/_build/default/bin/main.exe`,
  `LOGSEQ_NO_LOGIN_DAEMON=1`, window fixed at (80,80) 1280×840; captured
  via `screencapture -l<winid>`.
- Popups on GPUI are driven through menubar Accessibility clicks
  (`menu item "Command Palette" of menu "View"`,
  `menu item "Settings…" of menu "logseq-gpui"`), which fire the same
  `menu_event` handlers as the web (`native/menu_bar.ml`). CGEvent key
  injection does not reach the GPUI window on this host (see
  Limitations).
- `pixelmatch` (threshold 0.1) over same-size PNGs; screenshots in
  `docs/parity-shots/gpui-chrome/` (`master-|lui-|gpui-<surface>.png`,
  diffs `d-<pair>-<surface>.png`).

## Results

| Surface                 | master↔LUI | master↔gpui | lui↔gpui | Status |
|-------------------------|-----------:|------------:|---------:|--------|
| Baseline (journals)     | 0.22–0.25% | 0.24%       | ~0.3%    | at noise floor |
| Left sidebar open       | ~0.4%      | 0.47%       | 0.41%    | at noise floor |
| cmdk palette (blank)    | ~0.3%      | 0.47%       | 0.42%    | fixed (was 1.08/1.10%) |
| Settings dialog         | ~0.4%      | ~4.9%       | 4.59%    | exceptions below |
| Context menu (web↔web)  | 0.40%      | n/a         | n/a      | see Limitations |

Noise floor on this harness is ~0.2–0.5% (text rasterization and
compositor noise between Chrome and gpui-kit).

## Fixes applied this audit

deps/ui (this branch):

- `native/cmdk_state.ml` — ported the web behavior that was missing from
  the native twin:
  - fuzzy matching now runs on `strip_pfts`-cleaned titles (PFT markup
    was breaking matches);
  - the Filters group only appears after the first input edit
    (`v.edited`), matching src (cljs loads filters lazily);
  - `open_palette` resets `edited`, fixing the stale "Filters 5" row on
    blank open (1.08% → 0.42%).
- `native/settings_page.ml` — resynced drifted twin: added
  `~style_class:"settings-article"`, version `2.0.1` → `2.0.2`, font
  picker uses `~text:label` (GPUI `button` renders `~text`, not
  `~label` — `~label` is accessibility-only on the native backend).
- `src/settings/settings_view.ml` — `theme_item` wraps the
  thumbnail + label in a `column` so the theme card stacks vertically on
  both backends (the `list_item` kind lays children out as a row on
  native; web relied on a CSS column flip).
- `src/sidebar/left_sidebar_view.ml` (earlier) — emit `chevron-down`
  directly when expanded on native (`Platform.css_transform_icons ()` is
  false there; the CSS-based rotate can't apply).
- `gpui/host/src/logseq_ext.rs` — registered the missing semantic
  classes the settings/settings-adjacent markup relies on:
  `ls-dialog-settings` (padding:0, max-width 1024px),
  `cp__settings-inner/-header/-modal-title/-category-title`,
  `settings-modal/-aside/-menu/-menu-item/-article`, `panel-wrap`,
  `it`, `ls-it-*`, `ls-label`, `ls-switch-*`, `ctls`, `ls-ver-*`,
  `fade-link`, `ls-select-*`, `ls-font-*`, `ls-check-*`, `ls-kbd-*`,
  `ls-th-*`, `ls-icon-sm`, `cp__accent-colors-list-wrap`, `ls-swatch*`,
  `cp__settings-appearance-dialog-inner`, `appearance-popup`,
  `cp__theme-modes-options`, `mode-light/-dark/-system`, `mode-active`,
  `ui__select-trigger`, `as-solid/-secondary/-outline/-text`,
  `ls-btn-sm`, `ls-active`.
- `gpui/host/src/menu.rs` — added `cmd-k` → `CommandPalette`
  keybinding (was only reachable via menu on some layouts).
- `native/chrome.ml` — earlier chrome fixes (scroll-row centering wrap).

lui repo (`~/repos/lui-gpui-pin` worktree, pushed as
`devin/gpui-dialog-padding` on logseq/lui):

- `platform/gpui/crates/lui-gpui/src/kinds.rs` — removed the baked
  `.p_4()` on `NodeKind::Dialog` surfaces. Web dialogs own padding via
  `ui__dialog-content` (1.5rem) and `ls-dialog-*` overrides can zero it;
  the baked pad doubled it and made every modal ~32px taller than its
  web twin. `cargo build` resolves the crate through the uncommitted
  `gpui/host/Cargo.toml` path-dep override to that worktree — the fix
  must land in logseq/lui for the GPUI host to keep this geometry.

## Documented exceptions (root cause)

Settings dialog (~4.6% lui↔gpui residual):

1. **Nav item icons missing on gpui.** `nav_item` passes
   `~icon:(`app icn)` identically on both backends; the gpui
   `list_item` kind does not paint the icon prop. Renderer gap in
   lui-gpui (icon glyph pipeline), not a markup drift.
2. **Theme cards are flat fills, not screenshots.** Web cards are
   `background-image` PNGs (`img/light-theme.png` etc.); the gpui style
   layer has no image backgrounds, so `mode-light/-dark/-system` classes
   carry the theme's approximate fill + `mode-active` ring. Positions
   and the active ring match; interior raster cannot.
3. **Font button missing the "Ag" glyph preview.** The gpui `button`
   kind renders `~text` but not nested children (the `ls-font`
   two-line "Ag"/name column). `~text:label` gives the name; the
   preview line is a renderer limitation.
4. **Accent swatch fills/dots.** Swatches use `~background:
   var(--rx-<c>-09)` fills with a `~background: var(--rx-<c>-07)` inner
   dot; on gpui only the border vars paint — the background var
   resolution produces no fill. Rings + positions match.
5. **Dialog height.** gpui renders `cp__settings-inner` at its
   `min-height:55dvh` (462px) while the web article stretches toward
   `max-height:75dvh`; the card is ~40px shorter and shifts the centered
   block. Same classes, different stretch semantics under taffy.
6. **Language select label alignment.** gpui centers the trigger text
   with the chevron on the left; web is left-aligned text, chevron
   right. `select` kind layout detail.

Context menu / Esc-dismiss / tooltips / toasts — see Limitations; they
could not be triggered inside the GPUI window from this host.

## Limitations

- **Keyboard events do not reach the GPUI window.** CGEvent key posts
  and `osascript keystroke` produce nothing even with the window
  frontmost/AXFocused (clicks via CGEvent do land). This blocks
  key-driven audit items on gpui: Esc dismiss, typing in cmdk/search,
  arrow-key submenu cascading, focus-restore assertions. Menubar AX
  clicks cover open triggers but not dismiss/type paths. Needs a host
  that can give the gpui window true key status, or driving key events
  through the gpui-kit event pump.
- **Context menus / right-click**: CGEvent right-click did not surface a
  gpui context menu in this environment; web↔web ctxmenu parity is
  0.40% but gpui could not be exercised. Tooltips (hover-driven),
  toasts, and the export/import/rename/delete-page/e2ee dialogs share
  this trigger limitation — they mount through the same
  `dialogs_view.ml`/`menu` pipeline as cmdk+settings, so markup/class
  parity carries over, but per-surface pixel pairs remain to be
  captured on a host with working input injection.
- `docs/parity-shots/gpui-chrome/` holds the captured pairs and
  pixelmatch diff images used for the table above.

## Verification

- `opam exec --switch=5.5.0 -- dune build @runtest` in `deps/ui`:
  125 checks, 0 failures.
- `cargo build` in `deps/ui/gpui/host`: clean.
