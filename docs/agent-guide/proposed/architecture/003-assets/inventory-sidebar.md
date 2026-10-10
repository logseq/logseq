# Task 1 sidebar & shell visual inventory

Working inventory for `2026-10-10-003-shared-ui-visual-design.md`, Task 5
batch "Sidebar and shell". Source files audited:

- `resources/css/lui-core.css` — app shell ~229–363 (21 rules), header
  ~364–547 (29), left sidebar ~548–1164 (102), right sidebar ~1165–1424
  (42); ~194 rules total
- `deps/ui/gpui/host/src/logseq_ext.rs` — shell registrations
  (~24 entries: `cp__header`, `cp__header-l/-r`, `left-sidebar-inner`,
  `item`, `active`, `hd`, `wrap-th`, `as-edit`, `sidebar-navigations`,
  `sidebar-header-container`, `sidebar-contents-container`, `more`,
  `keyboard-shortcut`, `link-item`, `cp__sidebar-main-content`,
  `cp__content-wrap`, `ls-page-blocks`, `page-inner`, `journal-item`,
  `journal-last-item`; overlay-layer entries `cp__overlays`,
  `cp__overlay-layer`, `cp__dialog-shell` shared with the menus family)
- `deps/ui/src/shell/chrome.ml`, `deps/ui/src/sidebar/left_sidebar_view.ml`,
  `deps/ui/src/sidebar/right_sidebar_view.ml`,
  `deps/ui/src/sidebar/sidebar_state.ml` — view emitters and the touch
  gesture code that toggles `.is-open`/`.is-closing`/`.is-touching`
- `deps/ui/docs/css-audit.md` — prior dead-selector audit (verdicts reused)

## Classification

Every rule is classified as: **layout** (shared, typed-prop owned),
**appearance** (shared, token/recipe owned), **state** (typed state
refinements), **hook** (structure-only, keep for tests/commands), or
**deco** (web-only decoration, stays in per-platform CSS).

### App shell

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `#app-container` flex basis-100% | layout | app-shell recipe |
| `#left-container` flex col h-100vh relative | layout | app-shell recipe |
| `#main-container` overflow-y hidden relative + ~~`.is-left-sidebar-open` padding-left var(--ls-left-sidebar-width) ≥sm~~ **deleted (003) — split track owns docked width** | layout+state | shell recipe + sidebar-open variant (typed prop, not attr selector) |
| `#main-content` relative h calc(100vh − headbar) | layout | shell recipe (needs calc/viewport-unit height) |
| `.scrollbar-spacing` overflow-y auto | layout | scroll kind |
| `#main-content-container` container-type inline-size, sm padding ramp, flex row justify-center, scrollbar-color, `::-webkit-scrollbar` | layout+deco | content-scroll recipe; scrollbar colors + container queries deco |
| `#main-content-container[data-is-margin-less-pages]` padding 0 + stretch column | layout | margin-less page variant |
| `.cp__sidebar-main-content` w-100% max-width var flex-1 margin-inline auto container-type (+ `.page` pad, `[data-is-full-width]`, margin-less) | layout | content-column recipe + full-width variant; gpui reg `cp__sidebar-main-content` 960px hardcodes the token |
| `.ls-wide-mode .cp__sidebar-main-content` max-width wide | layout | wide-mode variant of same recipe |
| `.cp__content-wrap` margin auto w-100% pb-6rem (+ `--flush`) | layout | content-wrap recipe; gpui reg identical |
| `.cp__not-found` fixed inset-0 z-99999 bg | layout+appearance | fullscreen-overlay recipe |

### Header

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.button` h-2rem pad radius opacity .9 block + hover/active opacity + ≥md hover bg | appearance+state | toolbar-button recipe (opacity states; responsive hover = gap) |
| `.button.icon` 2rem square centered | appearance | icon-button recipe |
| `.cp__header` flex shrink-0 items-center justify-between sticky top-0 z-10 nowrap + box-shadow + `-webkit-app-region: drag` + headbar vars height | layout+appearance | header recipe (sticky, 48px, shadow mobile-only); app-region deco |
| `.cp__header > .l` flex h-100% ~~min-width var(--ls-left-sidebar-width)~~ **deleted (003) — header sits inside the split's second pane; toggle/search moved to `.left-sidebar-top`, `.l` keeps them only while the sidebar is closed** | layout | header-left slot recipe |
| ~~`.theme-container-inner:not(.ls-left-sidebar-open) .cp__header > .l` min-width auto~~ **deleted (003)** | state | sidebar-open variant (parent-state styling → gap) |
| `.cp__header > .r` flex-1 justify-end pr | layout | header-right slot; gpui `cp__header-r` twin |
| `.cp__header a/svg/button` `-webkit-app-region: no-drag` | deco | stays in adapter CSS |
| `.cp__header .r a/button` opacity .7→1 hover | state | typed hover opacity |
| `.cp__header .button` flex center + `.ti` 20px | appearance | header icon-button slot |
| `.cp__header .ui-items-container .button` width auto | appearance | same recipe |
| `.search-index-progress` chip flex gap radius pad fs-12 bg + `__text` nowrap + `__bar` 4×64px track + `::before` accent fill | layout+appearance | progress-chip recipe (`::before` fill → real node or typed progress prop) |
| `.cp__header-logo` display none / ≥sm block | dead | no emitter in views — drop |
| `.is-electron.is-mac(.is-fullscreen) .cp__header > .l` pl-78px/1rem | deco | Electron-only platform classes; gpui does the same via `#[cfg(macos)] header_pl` — stays per-platform |
| `.cp__header .toggle-right-sidebar` hidden <640px | layout | responsive variant (breakpoint → gap) |

### Left sidebar

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.cp__sidebar-left-layout` fixed top/left w-10px z-4 + `.is-open` w-100% + transitions | layout+state | sidebar-overlay recipe + open variant (translate/width motion deco) |
| `.cp__sidebar-left-layout > .shade-mask` absolute inset bg black/70 opacity 0→1 open (+dark .15) | appearance+state | scrim recipe + open variant + dark-aware token |
| `.cp__sidebar-left-layout.is-touching` width/transitions none | state | gesture state (suppress transitions while dragging) |
| `.cp__sidebar-left-layout:before` 3rem grab strip fixed <sm | deco | web touch affordance, stays adapter CSS |
| `.left-sidebar-inner.as-container` relative h-100% overflow y/x width var(--ls-left-sidebar-sm-width) bg border-r translateX(-100%)→0 open | layout+appearance+state | sidebar-panel recipe + open state (transform motion deco) |
| `.left-sidebar-inner > .wrap` flex col w-100% mt + h calc | layout | sidebar-content recipe |
| ~~≥sm `.cp__sidebar-left-layout` w-0 z-1 / `.is-open` w var / `:before` w0 / shade-mask none~~ **deleted (003) — base rule is now the docked pane (relative + overflow clip); overlay positioning moved into the <sm media block** | layout | docked variant (breakpoint) |
| `.left-sidebar-inner .item` flex h-2rem fs-14 fw-500 op-.8 user-select + `.ui__icon` slot + `.active`/`.thumb` gray-04 bg | layout+appearance+state | nav-row recipe + active variant; gpui `item`/`active` twins |
| `.left-sidebar-inner .page-icon` flex baseline | layout | icon slot |
| ~~`.left-sidebar-resizer` absolute 3px right-2 col-resize z-10 + is-active/hover/focus/active accent bg~~ **deleted (003) — split divider owns the handle** | layout+state | resize-handle recipe (new: col-resize cursor, grab state) |
| `.cp__graphs-selector > .item` flex relative overflow pad op-.9 radius + `.thumb` 1.5rem chip + `.lui-text` nowrap ellipsis + `.ui__icon` absolute op-.4 + `> span` button op-.4/.7/1 | layout+appearance+state | graph-selector row recipe (abs icon → position props) |
| `.sidebar-header-container` / `.sidebar-contents-container` flex col gap pad (+ `.is-scrolled` border-t — dead variant, no emitter) | layout | section-container recipes; gpui regs identical |
| `.sidebar-content-group:not(:hover)` webkit-scrollbar transparent | deco | stays adapter CSS |
| `.sidebar-content-group-inner > .hd` flex justify-between h-32 user-select sticky top-4 cursor z-2 radius bg + `.non-collapsable` cursor default | layout+appearance+state | group-header recipe (sticky → gap) |
| `.hd .wrap-th` flex fs-14 fw-500 op-.5 + `.lui-text` ≥sm fs-12 lh-16 + icon offsets | appearance | section-label recipe (breakpoint font step) |
| `.hd .ui__icon.more` margins | layout | disclosure-icon slot; gpui `more` twin |
| `.hd .as-edit` op-.6 hover .8 + icon margins | appearance+state | edit-icon slot; gpui `as-edit` twin |
| `.hd.enter-show-more > .b` opacity 0 transition | state | hidden-until-hover action slot |
| `.sidebar-content-group-inner > .bd` display none + `.is-expand` block | state | collapsed variant (display toggling via typed prop) |
| `.bd a.link-item` flex h-32 justify-between relative pad radius + `[data-popup-active]` bg | layout+appearance+state | page-row recipe + popup-open state; gpui `link-item` twin |
| `.link-item .lui-link-content` flex flex-1 min-w-0 | layout | recipe (link-kind wrapper shape) |
| `.link-item .page-title` nowrap ellipsis grow overflow pr-2rem + `* {display:inline!important}` | layout+appearance | title slot (the `!important` inline quirk → emit inline runs, same as cmdk) |
| `.link-item .sidebar-page-actions` display none absolute right top + `.ls-icon-dots` offset | layout+state | hover-reveal actions slot (group-hover → gap) |
| `.sidebar-navigations .item .keyboard-shortcut` opacity 0 hidden + margins | state | hover-reveal hint slot; gpui registers `keyboard-shortcut` display:none (web shows on hover+delay — unexpressible) |
| `.sidebar-navigations` gap mt | layout | gpui reg identical |
| `.hd .more` transition transform; `.is-expand .more` op-.4 rotate(90); `.has-children:not(.is-expand) .more` op-.5 | state+deco | disclosure state → rotated app icon (gpui already rotates via `app_icon_svg` hook); transition deco |
| `#left-sidebar a,.item` op-.8 color → hover 1 | appearance+state | sidebar text recipe |
| `.rotating-arrow(.not-collapsed)` svg/.lui-icon rotate(90) + transition | state+deco | disclosure glyph variant (app-icon resolver on gpui) |
| `@media (hover:hover) and (pointer:fine)` hover cluster: `.item:hover` bg, `.item:hover .keyboard-shortcut` reveal + opacity transition delay 2s, `.hd:not(.non-collapsable):hover` bg + `* {opacity:1!important}` + `.more` .8, `.enter-show-more:hover > .b` .8, `.link-item:hover` bg + `.sidebar-page-actions` inline-flex | state | typed hover + hover-reveal descendants (group-hover → gap); transition-delay deco |

### Right sidebar

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.cp__right-sidebar` z-1 relative user-select container-type + ~~`.closed` w-0!important + `transition: width`~~ **deleted (003) — pane clips via overflow/min-width:0 while the track animates** + `.open` max-w-60vw | layout+state | right-sidebar recipe + open/closed variants |
| ~~`.cp__right-sidebar .resizer` absolute 3px left-1 col-resize z-1000 touch-action none + hover/focus/active primary bg~~ **deleted (003) — split divider owns the handle** | layout+state | resize-handle recipe (cursor variant) |
| `.cp__right-sidebar .page` margin + `.page-inner` pb-4rem + `.page-inner > div:empty` none | layout | page-in-sidebar recipe (`:empty` → emit nothing instead) |
| `.sidebar-item-list` ml mt-8 pb-150 h calc display block | layout | item-list recipe |
| `.sidebar-panel-content` pt-8 | layout | recipe |
| `.cp__right-sidebar .ls-page-blocks` ml-20 | layout | shared with page recipe |
| `.sidebar-drop-indicator` relative h-8 + `::after` 4px bar + `.drag-over::after` accent bg z-1000 | layout+state | drop-indicator recipe (`::after` bar → real node); drag-over variant |
| `.sidebar-item` relative flex-1 min-h-100 + `.sidebar-item-header` h-32 + `.item-type-block` header linear-gradient + `.collapsed` flex-0 + `.breadcrumb` + `.item-actions .button` | layout+appearance+state | sidebar-card recipe + type variant + collapsed variant (gradient → gap) |
| `.cp__right-sidebar-inner` pt-0 bg secondary | appearance | panel surface token |
| `.cp__right-sidebar-settings` flex row overflow auto + `.cp__right-sidebar-settings-btn` block nowrap bg | layout+appearance | settings-strip recipe |
| `.cp__right-sidebar-topbar` sticky top-0 h-3rem bg z-999 user-select + app-region drag + children no-drag | layout+appearance | topbar recipe (sticky → gap); drag region deco |
| `html[data-theme='dark']` right-sidebar inner/topbar/item bg steps | appearance | dark-aware tokens (recipe resolves from snapshot) |
| `.help.cp__sidebar-help-docs` block margin + `.ls-hp-title` fs-16 fw-700 + `.ls-hp-list` ml-19.2 + `.ls-hp-item` display:list-item circle + `.ls-hp-iconrow` link color | layout+appearance | help-pane recipe (display:list-item + list-style → gap) |

## Hooks that MUST survive migration

Structure/state attributes consumed by gestures, tests, and view logic:

- `.cp__sidebar-left-layout` with `.is-open` / `.is-closing` / `.is-touching`
  — `sidebar_state.ml` toggles them and reads `.shade-mask` opacity via
  `dom_query` for the edge-swipe ratio
- `#main-container.is-left-sidebar-open`, `.theme-container-inner` with
  `.ls-left-sidebar-open` / `.ls-wide-mode`, `data-is-margin-less-pages`,
  `data-is-full-width`
- ~~`.left-sidebar-resizer` (+ `.is-active`), `.cp__right-sidebar .resizer`~~ — deleted (003): `Lui_elements.split`'s `.lui-split-divider` is the handle; new (003): `> .lui-split-divider` `cursor: col-resize`, `:hover/:active ::after` widens to 3px accent for discoverability, `.is-collapsed > .lui-split-divider` display:none
- new (003): `.left-sidebar-top` row inside `.left-sidebar-inner` — hosts the toggle/search buttons moved out of `.cp__header > .l` while the sidebar is open; its icon buttons reuse the `.cp__header` 32px/20px geometry
- new (003): `.cp__header > .l .head-l-btns` — permanently mounted copy of the toggle/search pair for the closed state; `is-hidden` (driven by `left_sidebar_open`) removes it instantly on open, and a 0.28s `visibility`/`opacity` transition-delay fades it in only after the sidebar's own top row has clipped out, so a toggle never shows both copies
- `.sidebar-content-group` with `.is-expand` / `.has-children`,
  `.hd`/`.bd`/`.more`/`.as-edit` structure, `.non-collapsable`
- `.item` + `.active`, `a.link-item` + `[data-popup-active]`,
  `.sidebar-page-actions`, `.keyboard-shortcut`
- `.cp__graphs-selector`, `.sidebar-navigations`, `.sidebar-contents-container`
- `.cp__right-sidebar` `.open`/`.closed`, `.sidebar-item` + `item-type-*` +
  `.collapsed`, `.sidebar-drop-indicator.drag-over`
- `.cp__header` `.l`/`.r` regions, `.search-index-progress`, `.rotating-arrow`
  `.collapsed`/`.not-collapsed`, `.cp__rtc-sync-indicator .cloud` state classes

Dual-track hooks (web attr/element name ↔ gpui flat class):

- Web `#left-sidebar .item` descendant vs gpui flat `item`; `.item.active`
  vs `active`; `.hd`/`.wrap-th`/`.as-edit`/`.more` vs same flat names
- Web `.cp__header > .l` / `> .r` element children vs gpui classes
  `cp__header-l` / `cp__header-r` (different hook shapes — migration must
  emit one stable hook or map both tracks in recipes)
- `link-item` + `[data-popup-active]` attr vs gpui `link-item` class
- `.is-expand`/`.has-children` state classes on `.sidebar-content-group`
- `.drag-over` on `.sidebar-drop-indicator`
- `item-type-<kind>` concatenated suffix (`sidebar_state.ml` kind map)

## LUI capability gaps (beyond the cmdk list)

The cmdk family already needs: position+inset, typography props, state
variants, ellipsis, min/max sizing, user-select, inset shadow. Sidebar &
shell additionally needs:

1. `position:sticky` inside scroll viewports (`.hd` group headers,
   `.cp__header`, `.cp__right-sidebar-topbar`) — semantic, not the
   fixed→absolute downgrade gpui `apply_decl` applies today
2. Viewport/container breakpoints — `640px`/`768px`/`1024px` media
   queries and `container-type: inline-size` drive dock-vs-overlay,
   header shadow, paddings, `.wrap-th` font step, login column width.
   Needs a size-class conditional in shared recipes (typed, not media CSS)
3. Cursor variants beyond pointer — `col-resize` on both resizers,
   `default`, `text`
4. Group-hover reveal — `.item:hover .keyboard-shortcut`,
   `.hd:hover > *`, `.link-item:hover .sidebar-page-actions`: descendant
   visibility driven by ancestor hover (a hovered→descendant state
   channel or signal-driven `visible` prop)
5. z-index ordering — `--ls-z-index-level-*` scale; gpui `apply_decl`
   has no z-index and layering is mount-order only
6. `transform` translate/rotate + transitions for the sidebar slide and
   disclosure chevron — mostly deco on web, but the semantic
   expanded/collapsed variant needs a home (already special-cased via
   `app_icon_svg` rotate on gpui; general transform prop is the gap)
7. Pointer-events none/auto as a typed prop (overlay layers, scrims —
   gpui has a utility token; needs prop form for shared recipes)
8. Linear-gradient backgrounds (`.item-type-block` header) — either a
   gradient prop or accept flat-color approximation in the recipe
9. `display:list-item` + `list-style` (`.ls-hp-item` circle markers)
10. Pseudo-element bars — `.sidebar-drop-indicator::after`,
    `.search-index-progress__bar::before`, `.cp__sidebar-left-layout:before`
    (emit real nodes; today they are CSS-only content)
11. `touch-action`, `-webkit-app-region`, `-webkit-overflow-scrolling`,
    `overscroll-behavior`, `prefers-reduced-motion` — platform-only,
    stays in adapter CSS (listed to keep them out of shared recipes)
12. Scrollbar theming (`scrollbar-color`, `::-webkit-scrollbar`,
    `.hide-scrollbar`) — web-only deco
13. calc()/viewport-unit sizes (`calc(100vh - var(--ls-headbar-height))`,
    `60vw`, `100dvh`) — typed size props are integer px today
14. `outline`/`outline-offset` focus treatment (`.ui__toast:focus-visible`,
    `.ui__select-trigger:focus-visible` box-shadow rings — state variant
    already covers shadow form; toast uses outline)

## Dead selectors

- `.cp__header-logo` (+ its `@media ≥640` reveal) — no emitter
- `.ui__dropdown-trigger` in `.cp__header > .r > div:not(...)` — dead per
  css-audit (cljs dropdown wrapper not emitted)
- `.is-electron.is-mac` / `.is-fullscreen` `.cp__header > .l` rules — no
  emitter in the LUI tree (Electron-era platform classes; gpui covers the
  inset via `#[cfg(macos)] header_pl`)
- `.sidebar-contents-container.is-scrolled` — `is-scrolled` never emitted
- `.cp__header .r > div:not(.ui__dropdown-trigger)` operand is dead as a
  group (see above)
- `#d8e1e8` — audit artifact (hex fallback inside a var(), not an id)

## Decoration that stays per-platform

`-webkit-app-region` drag regions, `transform`/`transition` motion
(slide, rotate, fade), scrollbar styling, `:before` grab strip,
touch-action/overscroll behavior, `prefers-reduced-motion` guards,
`.dark`/theme-delta color overrides that become snapshot tokens.
