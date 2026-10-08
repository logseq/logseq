# Pixel parity — responsive widths (480x800, 768x1024)

Audit of the LUI web app against master at mobile/tablet widths. Master
(`logseq-master` worktree, `pnpm app-watch`, :3001) vs LUI
(`node scripts/serve-static.mjs 3010`, `index.html?rtc-test=true`).
Captures driven by `scripts/parity/pixel/responsive.mjs` (18-step probe:
sidebar open/overlay/nav-tap/shade-dismiss, cmdk, dots menu, journal scroll,
all-pages, block edit, help menu) plus focused settings-dialog probes.
Screenshots in `docs/pixel-responsive/` (`*.master.N.png` / `*.lui.N.png`,
N = viewport width).

Master's responsive breakpoint is `sm` = 640px (`util/sm-breakpoint?`);
settings dialog additionally uses `md` = 768px for its row/column split.

## Findings and fixes

### 480px — left sidebar must overlay, not push

Master: below 640px the left sidebar is an overlay `74vw` wide
(`--ls-left-sidebar-sm-width`), `#main-container` keeps `padding-left:0`,
the inner sidebar is `overflow:hidden` with a `24px` top margin, and the
header's left segment drops to `min-width:auto` (72px) when the sidebar
isn't docked.

LUI was shipping the desktop layout at all widths:

- `#main-container.is-left-sidebar-open` had unconditional
  `padding-left: 246px` — content pushed off-screen at 480.
  Fixed: `padding-left:0` base, `246px` only under
  `@media (min-width:640px)` (`lui-core.css`).
- `.left-sidebar-inner.as-container` was a fixed `246px` —
  `74vw` (=355px at 480) below 640, `246px` at ≥640; top margin `24px`
  below 640, `52px` (`> .wrap { margin-top:52px }`) at ≥640 (`lui-core.css`).
- `.is-open > .left-sidebar-inner` overlay had `overflow:visible` —
  now `overflow:hidden` below 640 (`lui-core.css`).
- `#main-content-container` had unconditional `padding:2rem 1rem 2rem 2rem` —
  now `0.5rem 0` below 640 (`lui-core.css`).
- `.cp__header` kept its desktop `box-shadow:none` and its `.l` segment's
  `min-width:246px` — `.l` now `min-width:auto` when
  `:not(.ls-left-sidebar-open)`, header shadow restored below 640
  (`lui-core.css`).

### 480px — theme container classes were static

`theme-container-inner` never carried `ls-left-sidebar-open`,
`ls-right-sidebar-open`, `ls-wide-mode`, or `ls-hl-colored` — every
responsive state selector on it (header `.l` sizing, sidebar dock/overlay)
was dead. `chrome.ml` now emits these via `Ui_parts.class_signal`, reading
sidebar state reactively and wide-mode/hl-colored from
`Platform.local_storage_get` / `Pdf_state.hl_colored` at publish time.

### Margin-less / full-width data attributes missing

Master sets `data-is-margin-less-pages` / `data-is-full-width` on the
main-content wrapper to switch all-pages/graph-view into full-bleed layout.
`main_content()` now emits them via `~data_attrs_signal`
(margin-less = graph view; full-width = margin-less or all-pages).
At 480, all-pages was clipped by the 2rem content padding — now full-bleed.

### 480px — settings dialog crushed

Master: `.cp__settings-inner` is a column below 768px — nav aside full-width
on top (no fixed width), article below; article is `100vw` below 768,
`44rem` (clamped) at ≥768; `.panel-wrap` keeps `width:600px` only ≥640;
`.it` rows are plain block below 640, 3-column grid at ≥640; the Keymap nav
entry is `hidden sm:block`.

LUI: inner was always `flex-direction:row` with a 256px aside + a
`calc(100vw - 20rem)`-clamped `panel-wrap` (160px at 480), `.it` always
grid, Keymap always visible. All media-gated to match master in
`lui-overlay.css`; `nav_item` now emits `data-id` so the `keymap` selector
applies.

### Harness caveat

`09-dots-menu`/`17-help-menu` leave menus stuck open in **both** apps —
shared Playwright limitation, verified with standalone scripts instead.

## Verified geometry (probe JSON, post-fix)

| probe | master 480 | lui 480 |
|---|---|---|
| sidebar open width | 355.2 (74vw) | 355.2 |
| main pad-left (sidebar open) | 0 | 0 |
| header `.l` min-width (closed → open) | 72 → 246 | 72 → 246 |
| sidebar inner height | ~774 | 774 |
| settings article | x:17 w:480 | x:17 w:480 |
| settings h1 / panel-wrap | x:33 w:448 | x:33 w:448 |

768x1024: sidebar docks at 246px with `padding-left:246px`, header splits
72/522 closed ↔ 246/522 open — identical to master. 1280x800 desktop
layout and settings row split unchanged.

## Remaining diffs

- Dots/help menu items: LUI renders leading icons right-aligned vs master's
  left-aligned — pre-existing overlay detail, out of scope here.

## Checks

- `OPAMSWITCH=5.5.0 opam exec -- dune build @all` — clean.
- `node _build/default/test/ui_test/test/test_main.js` — 1546 checks, 0 failures.
