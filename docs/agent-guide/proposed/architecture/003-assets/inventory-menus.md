# Task 1 menus & dialogs visual inventory

Working inventory for `2026-10-10-003-shared-ui-visual-design.md`, Task 5
batch "Menus and dialogs". Source files audited:

- `resources/css/lui-overlay.css` — popover/portal plumbing 31–189 (21),
  menu chrome 190–435 (33), menu links 436–556 (16), autocomplete
  557–656 (15), context rows 657–731 (10), `.cp__select*` 1326–1436
  (19), dialogs 1437–2088 (84), toasts 2089–2344 (33), misc overlay
  bodies 4111–4369 (39), help menu 6080–6135 (8); **278 rules** total
  (the cmdk block 732–1325, 80 rules, is already inventoried in the
  plan appendix and excluded)
- `deps/ui/gpui/host/src/logseq_ext.rs` — overlay registrations
  (`cp__overlays`, `cp__overlay-layer`, `cp__dialog-shell`,
  `ui__dialog-overlay`, `ui__alert-dialog-overlay`, `ui__dialog-content`,
  `ui__alert-dialog-content`, `ui__alert-dialog-header/-title/
  -main-content/-footer`, `ui__dialog-close`, `ui__tooltip-content`,
  `ui__tooltip-arrow`, `ls-tooltip-keys`, `ui__toaster-viewport`,
  `ui__toast`, `ui__popover-content`, `ui__dropdown-menu-content`,
  `ui__dropdown-menu-sub-content`, `ui__context-menu-content`,
  `ui__select-content`, `ls-property-dialog`, `ls-popup-backdrop`,
  `menu-links-wrapper`, `menu-link-wrap`, `menu-link`, `chosen`,
  `ls-dialog-settings`)
- `deps/ui/src/popups/popups_view.ml`, `popups_state.ml`,
  `dialogs/dialogs_view.ml`, `toasts/toasts_view.ml`,
  `views/views_popup.ml` — emitters

Classification legend: **layout** / **appearance** / **state** /
**hook** / **deco**.

## Popup plumbing (portal/positioner)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.lui-popup-portal` fixed inset-0 z-99999 isolation pointer-events none | layout | overlay-layer recipe (fixed+inset, z) |
| `.lui-popup-positioner` absolute + `z-index: calc(100 + var(--lui-layer-index))` + `[data-cover]` full size | layout | positioner recipe (computed z → gap) |
| `.lui-popover` transition + `[data-starting-style]`/`[data-ending-style]` scale(0.96) transforms | state+deco | open/close variants; keyframe motion deco |
| `@keyframes lui-fade-zoom-in` `--lui-pop-dx/-dy` side-dependent offsets | deco | stays in adapter CSS (or typed enter-motion prop) |
| anchor `:has(> .ls-anchor-cx)` translate positioning | layout | anchor-rect positioning (state channel, not :has) |
| `.lui-popup-positioner` `max-width/height: var(--available-width/-height)` | layout | typed max sizing (cmdk gap list) |

## Menu chrome (`ui__dropdown-menu*`, `ui__context-menu*`, `ui__select*`, `ui__popover*`)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| shared card rule: `.ui__popover-content`, `.ui__dropdown-menu(-sub)-content`, `.ui__context-menu-content`, `.ui__select-content` — border/radius/popover colors/box-shadow/`max-height: var(--available-height)` + zoom animation | layout+appearance | menu-card recipe; shadow+animation deco |
| `.ui__dropdown-menu-item(-like)` row flex h-8 pad fs-14 radius cursor `[data-highlighted]` bg + `[data-disabled]` opacity/cursor + `[data-open]` | layout+appearance+state | menu-item recipe + highlighted/disabled/open variants (state variants — cmdk list) |
| separators `[role='separator']`, `.ui__dropdown-menu-separator` hairlines | appearance | divider recipe |
| `.ui__select-trigger` h-2.5rem pad border + `:focus-visible` ring box-shadow | layout+appearance+state | select-trigger recipe (focus ring → state) |
| `.ui__select-trigger > span` `-webkit-line-clamp:1` | appearance | single-line clamp (deco vs ellipsis — cmdk covers ellipsis) |
| `.lui-menu-item-icon/-label/-check` order/flex rules + `:not([data-name])` icon collapse + check-slot collapse + gap-0 overrides | layout | menu-item slot recipe (slot-presence variants, not :not()) |
| `.menu-links-wrapper` card + `.menu-link` rows + `.menu-link.chosen` accent bg + `.hide-scrollbar` | layout+appearance+state | menu-links recipe; gpui `menu-links-wrapper`/`menu-link`/`chosen` twins |
| `.ls-context-menu-content` min/max widths + `.ls-cm-colors/-headings` rows + `.ls-cm-swatch`/`ls-cm-heading-btn` | layout+appearance | context-menu recipes (swatch = icon grid) |

## Autocomplete (slash/inline pickers)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `#ui__ac-inner` max-height + overflow scroll | layout | scroll kind |
| `.ls-ac-*` row pieces (`.ls-ac-row`, icon, label, hint spans) | layout+appearance | autocomplete-row recipe |
| `.ui__ac-group-name` sticky-ish group label, muted | appearance | group-label recipe |
| `.cp__commands-slash` icon + `[data-selected]`/hover states | state | selected variant |
| `.ls-tag-search-hint`, `.ls-preview-popup` card | appearance | hint/popup recipes |

## `cp__select` (command/select palette)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.cp__select` palette card + `--palettle-*` vars | layout+appearance | palette recipe (token set) |
| `.cp__select-input` chrome-less input row | layout+appearance | input recipe |
| `.cp__select-results` list + `.item-results-wrap` max-h scroll | layout | results list |
| `.type-icon` + `.type-icon.highlight` | appearance+state | type-icon slot + highlight variant |
| `.menu-link.chosen` / `[data-selected]` inside results | state | chosen variant |
| `.cp__select-apply` footer button | appearance | apply button |

## Dialogs (`ui__dialog`, `ui__alert-dialog`, `ls-dialog-*`)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `@keyframes ui-dialog-zoom-in` / `lui-fade-in` | deco | adapter CSS |
| `.ui__dialog-overlay` fixed inset-0 display:grid place-items center + color-mix scrim + fade animation | layout+appearance | dialog-scrim recipe (grid centering → gap); color-mix → token |
| `.ui__alert-dialog-overlay` same + `backdrop-filter: blur(4px)` | layout+appearance | same + blur (gap) |
| `.ui__dialog-content`, `.ui__alert-dialog-content` fixed left-1/2 top-1/2 translate(-50%,-50%) + scale `--nested-dialogs` math + box-shadow + `max-height:80vh` + `@media(min-width:1024px)` max-w 48rem | layout+appearance | dialog-card recipe (centering transform → typed center prop; nested-depth scale → signal prop; breakpoint width → responsive variant) |
| header/title/main/footer blocks (`.ui__dialog-header`, `.ui__dialog-title`, `.ui__dialog-main-content`, `.ui__dialog-footer`, alert twins) | layout+appearance | dialog-section recipes; gpui regs exist for alert variants |
| `.ls-dialog-<name>` per-dialog sizing (settings/plugins/login/new-graph/add-graph/export-page/sync-server/publish-server/plugin-readme/quick-add/rtc-collaborators/plugin-settings/import/export/flashcards/cmdk) + `[label=...]` attr twins | layout | per-dialog size recipe (name → typed prop, not class concat) |
| `.ui__dialog-close` absolute top-right + focus ring offset | layout+state | close-button slot (position prop) |
| `.ls-dnd-a11y`, `.ls-dnd-live` visually-hidden patterns | hook | a11y live-region (sr-only recipe) |
| `[data-base-ui-inert]` pointer-events none | state | inert variant |
| `.ls-btn-outline`/`.ls-btn-primary`/`(.ls-btn)` + `[data-size=sm]` 28px override + `.lui-button.ui__button[data-size=sm]` | appearance | button recipe variants (size prop) |
| login/e2ee/quick-add/readme/`.lsp-frame-readme`/`.cards-modal` body rules | appearance | dialog-body recipes |
| `.cp__rtc-sync-indicator` `::after` status dot (`.on.idle` states) | appearance+state | status-dot recipe (`::after` → real node) |
| `.cp__user-login` + `.ls-auth-*` fields/footer/title/alert (oklch literal, color-mix) | appearance | auth-form recipes (literal colors → tokens) |

## Toasts

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.lui-toast-viewport:has(> .ui__toast)` fixed bottom-right + `@media(500px)` | layout | toast-viewport recipe (`:has` presence → mount-time container kind) |
| `.ui__toast` absolute + `--toast-index`/`--scale`/`--peek`/`--toast-swipe-*` calc() stacking + transform-origin + `data-expanded/starting-style/ending-style/limited/swipe-direction` + `::after` gap filler + sibling `~` count rules + reduced-motion block | layout+appearance+state | toast-card recipe; stacking math → signal props; swipe/end states → variants; `::after` → real node |
| `.ui__toast-content`, `.ui__toast-description`, `.ui__toast-close`, `.ui__toast-status-icon` + `.info/.success/.warning/.error` | layout+appearance+state | toast-section recipes + severity variant |
| `.ui__toast:focus-visible` outline ring | state | focus variant |

## Misc overlay bodies

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.ls-dots-menu` icon row | appearance | icon slot |
| `.repos-list`/`.repos-*` + `.repos-qa-btn` ghost buttons | layout+appearance | repos-list recipes |
| `.ls-page-menu`, `.appearance-popup` | layout | page-menu/appearance recipes |
| `.ui__dialog-content .ui__input` h-10 | appearance | input recipe |
| `.text-muted`, `.skeleton` min-width helpers | appearance | shared text/skeleton recipes |
| `.cp__sidebar-help-menu-popup` fixed bottom-right + `.it`/`.ft` + `.ls-hm-*` | layout+appearance | help-menu recipes |

## Hooks that MUST survive migration

- `data-highlighted`, `data-disabled`, `data-open`, `data-selected`,
  `data-state`, `data-orientation`, `data-side` on menu items/contents
  (web recipe states; keyboard nav in `popups_view.ml` queries
  `.ui__dropdown-menu-item:not([data-disabled])` — the attr must exist)
- `.lui-popup-portal`, `.lui-popup-positioner`, `data-cover`,
  `data-starting-style`, `data-ending-style`, `.ls-anchor-cx` anchor
- `ls-dialog-<name>` content class + `aria-labelledby="ls-dialog-title-<name>"`
  (`dialogs_view.ml:74,81` — `dom_query(".ls-dialog-" ^ name)` reads it)
- `.ui__toast` with `data-expanded`, `data-swipe-direction`,
  `--toast-index` (viewport stacking logic consumes the index)
- `data-base-ui-inert`, `.ls-dnd-a11y`, `.ls-dnd-live`
- `.cp__select`, `.cp__select-input`, `.cp__select-results`,
  `.menu-link.chosen`, `.type-icon`
- `.menu-links-wrapper`/`.menu-link(-wrap)` + `.chosen` — gpui
  registers flat twins (`menu-link`, `chosen`) — dual-track hooks
- `.ui__dropdown-menu-sub-trigger` / `.ui__dropdown-menu-sub-content`
  (sub-menu wiring in popups_view:594-632, 1242)
- `.lui-toast-viewport`, `.cp__sidebar-help-menu-popup`,
  `.cp__rtc-sync-indicator` + `.on.idle` states

## LUI capability gaps (beyond the cmdk list)

cmdk already needs: position+inset, typography props, state variants,
ellipsis, min/max sizing, user-select, inset shadow. Menus & dialogs
additionally needs:

1. `z-index` ordering — positioner `calc(100 + var(--lui-layer-index))`,
   dialog/scrim stacking, z-99999 portal; gpui has no z-index and relies
   on mount order (layer-index needs a typed prop or stacking contract)
2. `backdrop-filter: blur()` (`.ui__alert-dialog-overlay`) — blur scrim
3. Viewport-centered fixed overlays with translate(-50%,-50%) and
   `--nested-dialogs` scale — a centered-modal placement variant plus a
   depth signal (current decl support only does absolute edges)
4. `display:grid` + `place-items:center` centering (dialog overlay) —
   gpui has place-items but no template tracks; grid centering itself
   fits, track templates do not
5. `-webkit-line-clamp` (select trigger label clamp) — multi-line clamp
6. Transform scale/translate animations on open/close
   (`data-starting-style`/`data-ending-style` scale 0.96, zoom/fade
   keyframes) — deco on web; needs an enter/exit-motion prop or stays
   adapter CSS
7. Toast stacking variables (`--toast-index/--scale/--peek`) +
   sibling-count selectors — toast layout is computed; port as signal
   props per toast node (index/limit), not CSS sibling rules
8. `::after`/`::before` pseudo nodes (toast gap filler, rtc indicator
   dot) — emit real elements
9. `color-mix()` scrim colors — fold into tokens at recipe resolution
10. `cursor` variants (`not-allowed`, `alias`, `grab`, `default`,
    `text`) — beyond pointer
11. `outline`/`outline-offset` focus rings (toast focus-visible uses
    outline; select trigger uses box-shadow ring — the shadow-ring form
    is covered by state variants)
12. Responsive breakpoints — `@media(500px)` toast viewport,
    `@media(min-width:1024px)` dialog max-width, settings modal
    two-pane switch at 768px
13. `pointer-events` typed prop (portal none → children auto; inert)
14. Visually-hidden recipe (`.ls-dnd-a11y`, `.ls-dnd-live`,
    `.ls-hidden-input`) — 1px clip technique → sr-only variant
15. `list-style:none` resets on menu lists — trivial but needs a list
    kind that doesn't paint markers
16. `aspect-ratio` on theme-mode thumbnails (supported already) —
    noted, no gap

## Dead selectors

- `.ui__select-item`, `.ui__select-label`, `.ui__select-separator`,
  `.ui__select-icon` — no emitters (LUI select kind doesn't emit these
  child classes; select uses `cp__select`/menu-items)
- `.ui__context-menu-item`, `.ui__context-menu-separator` — no emitters
  (context menu renders via menu-item rows + `.ls-context-menu-content`)
- `.ui__dropdown-menu-item-indicator` — no emitter
- `.ui__toast-header`, `.ui__toast-body`, `.ui__toast-text`,
  `.ui__toast-title` — `toasts_view.ml` emits only `ui__toast`,
  `ui__toast-content`, `ui__toast-description`, `ui__toast-close`,
  `ui__toast-status-icon`; the header/body/text/title rules never match
- `.ls-dialog-body` — no emitter (structural classes emitted are
  `ls-dialog-layer/head/head-icon/head-text/headline/footer/error/
  title-lg`, plus per-name `ls-dialog-<name>`)
- `.ls-cm-heading-btn\,` — escaped selector matching a literal
  `ls-cm-heading-btn,` class token (cljs class-join quirk kept for DOM
  parity); the LUI emitter produces clean `ls-cm-heading-btn`, so the
  escaped twin never matches in the LUI tree

## Decoration that stays per-platform

All keyframe animations (fade/zoom/scale), `--lui-pop-dx/-dy` side
offsets, reduced-motion guards, `transition` lists, toast swipe
transforms, scrollbar hiding inside menus, `backdrop-filter` if kept as
decoration, `color-mix` scrim literals.
