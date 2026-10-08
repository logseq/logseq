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
| Baseline (journals)     | 0.22–0.25% | 0.24%       | 0.29%    | at noise floor |
| Left sidebar open       | ~0.4%      | 0.47%       | 0.41%    | at noise floor |
| cmdk palette (blank)    | ~0.3%      | 0.47%       | 0.42%    | fixed (was 1.08/1.10%) |
| Settings dialog         | ~0.4%      | 4.28%       | 4.27%    | exceptions below |
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
  `~style_class:"settings-article"`, version `2.0.1` → `2.0.2`. Font
  buttons keep `~label` (accessibility name); the visible Ag/name
  column is real children, which the gpui `button` kind now mounts
  (see lui fixes below).
- `src/settings/settings_view.ml` — `theme_item` stacks thumbnail +
  label in a `column`, and on native (`Platform.css_transform_icons ()`
  false) swaps the `background-image` box for `mode_thumb`: a drawn
  mock-editor thumbnail (title bar + text lines in each mode's
  palette; `system` splits light/dark panes) since gpui has no image
  backgrounds.
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
  `ls-btn-sm`, `ls-active`. `cp__settings-inner` stretches
  (`align-items:stretch`), `settings-article` is pinned to the web's
  704px × 70vh top-aligned block, `ls-label` carries the web's 28px
  line-height/min-height, and `panel-wrap` folds in the web's
  first-row padding. Also bumped the opam `lui` pin in
  `deps/ui/scripts/install-opam-deps.sh` to `cffac1a` (lui PR #161
  head) so a clean environment resolves the same lui revision — keep
  the pin tracking the merged lui SHA.
- `gpui/host/src/menu.rs` — added `cmd-k` → `CommandPalette`
  keybinding (was only reachable via menu on some layouts).
- `native/chrome.ml` — earlier chrome fixes (scroll-row centering wrap).

lui repo (`~/repos/lui-gpui-pin` worktree, pushed as
`devin/gpui-dialog-padding` on logseq/lui —
[PR #161](https://github.com/logseq/lui/pull/161)):

- `platform/gpui/crates/lui-gpui/src/kinds.rs` — removed the baked
  `.p_4()` on `NodeKind::Dialog` surfaces; `button()` now mounts
  `node.children` inside the Button (the font picker's `ls-font`
  Ag/name column — gpui previously rendered the label prop only);
  `list_item()` resolves `app:` icon names through the host
  `app_icon_svg` resolver (settings nav icons); the empty-items
  `select` trigger uses `.dropdown_caret(true)` so the chevron trails
  the label like the web `ui__select-trigger`.
- `platform/gpui/crates/lui-gpui/src/style.rs` — `style::all` applies
  the semantic `style_class` **before** typed props and the inline
  `style` attr. On the web, typed props are inline styles and beat
  classes; previously `as-text`'s `background:transparent` clobbered
  `~background`, so accent swatches rendered as bare rings.
- `cargo build` resolves the crates through the uncommitted
  `gpui/host/Cargo.toml` path-dep override to that worktree — the fixes
  must land in logseq/lui for the GPUI host to keep this geometry and
  rendering.

## Documented exceptions (root cause)

Settings dialog (4.27% lui↔gpui / 4.28% master↔gpui residual — the bulk
of it is item 1):

1. **Theme cards are drawn approximations, not the real screenshots.**
   Web cards are `background-image` PNGs (`img/light-theme.png` etc.);
   gpui has no image-backed fills, so `mode_thumb` draws a mock editor
   (title bar + text lines, `system` as split light/dark panes). Card
   geometry, positions, and the `mode-active` ring match exactly — the
   interior raster approximates the PNGs but cannot match them
   pixel-for-pixel. ~1.5–2% of the dialog diff is this region alone.
   To go further gpui needs `NodeKind::Image`/background-image support
   in lui-gpui's style layer.
2. **Per-row text baseline offsets (~1–3px).** Rows sit at the same
   grid positions but label text baselines differ slightly between
   Chrome's and gpui's text shaping (line-box rounding); this is raster
   noise above the 0.2–0.5% floor.
3. **`k t t` shortcut chip.** The web shortcuts row renders a kbd chip
   that is absent/mispositioned on gpui — minor, isolated.

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
