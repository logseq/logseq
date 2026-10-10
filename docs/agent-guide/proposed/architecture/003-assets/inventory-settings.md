# Task 1 settings & properties visual inventory

Working inventory for `2026-10-10-003-shared-ui-visual-design.md`,
Task 5 batch "Settings and properties". Source files audited:

- `resources/css/lui-core.css` — page properties panel 1572–2043 (62)
- `resources/css/lui-overlay.css` — calendar/date-time pickers
  2345–2698 (44), property popups 2699–2892 (28), settings modal
  2893–3601 (90), plugins dashboard 3602–3794 (26), icon/color pickers
  3795–4011 (30), settings helpers 4370–5101 (119), misc
  shortcut/property/cards helpers 5101–5171 (12), property-menu and
  icon-picker helpers 5173–5314 (24), settings select 6136–6175 (5),
  importer internals 6176–6252 (11), icon-mask helper 6253–6270 (2),
  property value-cells 6271–6344 (14), icon-only controls 6441–6469 (8);
  **475 rules** total
- `deps/ui/gpui/host/src/logseq_ext.rs` — settings/property
  registrations (`ls-dialog-settings`, `settings-menu-item`,
  `settings-menu-link`, `ls-property-dialog`, `property-k`,
  `ls-icon-color-wrap`, `properties-panel`, `properties-panel-header`,
  `property-pair`, `property-key-panel`, `property-value-panel`,
  `ls-page-properties`, `hidden-properties-toggle`, `jtrigger`,
  `property-value-container`, `select-item`, `ui__checkbox`,
  `cp__shortcut-*`, …)
- `deps/ui/src/settings/settings_page.ml`, `settings_controls.ml`,
  `settings_view.ml`, `settings_url_view.ml`, `properties/*.ml`,
  `plugins/plugins_view.ml`, `graphs/importer.ml`, `graphs/new_graph.ml`,
  `cards/cards_view.ml`, `popups/icon_picker.ml` — emitters

Classification legend: **layout** / **appearance** / **state** /
**hook** / **deco**.

## Settings modal + panes

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.cp__settings-inner` flex-col, `min-height:55dvh; max-height:75dvh` + `@media ≥768` flex-row | layout | settings-split recipe (dvh + breakpoint → gap) |
| `.cp__settings-inner > aside/.settings-aside` gray-03 bg, pad, `min-width:10rem` + `@media ≥768` w-16rem | layout+appearance | aside recipe (breakpoint width) |
| `.settings-menu-item` list-reset radius + `[data-id="keymap"]` hidden <640 + `.active`/hover gray bg + `.dark` override | layout+appearance+state | settings-nav-item recipe + active variant + dark token |
| `.settings-menu-link` full-width row fs-14 | layout+appearance | nav-link recipe; gpui reg twin |
| `.cp__settings-inner > article/.settings-article` pad flex-1 overflow-y auto + `@media ≥768` w-44rem h-70vh | layout | article recipe (breakpoint) |
| `.cp__settings-header` h-2.5rem row + icon tile `place-items` grid | layout+appearance | section-header recipe |
| `.cp__settings-modal-title` fs-1.5rem fw-600 lowercase + `::first-letter` uppercase; `.cp__settings-category-title` | appearance | title recipe (`::first-letter` → capitalize text-transform → deco/gap) |
| `.panel-wrap` col gap-1rem + `@media ≥640` width 600px max-w calc; `.it` rows block→`grid-template-columns: repeat(3, minmax(0,1fr))` ≥640 | layout | settings-row recipe (3-col grid → gap) |
| `.it .ls-label`/`.it-label` 28px label + `.it-control`/`:nth-child(2):last-child` `grid-column: span 2` + `.it-desc` muted 12px | layout+appearance | row slots (grid-column span → gap; nth-child → emit control slot explicitly) |
| `.form-select`/`.form-input` w-100% max-200px + `.is-small`/`input.form-input`/`select.form-select` h-1.75rem pad radius border fs-13 | layout+appearance | form-control recipe |
| `.cp__settings-app-updater` + `.ctls` + `.update-state` chip | layout+appearance | updater recipe |
| `.cp__settings-appearance-dialog-inner` negative-margin col + `#appearance_settings` variant | layout | appearance-pane recipe |
| `.cp__theme-modes-options` row gap + `li > i` 92px aspect-ratio 160/110 thumbnails (png bg) + `.active > i` inset ring + `.mode-*` bg images + `lui-list-item` overrides | layout+appearance+state | theme-card recipe (image thumbs → asset prop; inset ring = cmdk list) |
| `.cp__shortcut-page-x-*` panes; `.shortcut-toolbar-row` wrap; `.search-input-wrap` + `input.form-input` + `.search-icon` absolute left; `.shortcut-keystroke-inactive` pill 30px; `.shortcut-pills-row`; `.shortcut-filter-pill(-active)` 9999 chip; `li.th`/`.lui-list-item.th` section rows; `.shortcut-row` justify-between; `.keyboard-shortcut` inline-flex gap-2px | layout+appearance+state | shortcut-page recipes (kbd chip = pill recipe; filter pill = chip variant) |
| `.cp__settings` col gap; `.ls-settings-col` col gap-0.5 | layout | section-stack recipe |

## Control primitives (settings-helpers block)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.ui__switch` inline-flex 2×1.125rem + `.lui-switch-control` pill + `:checked` primary bg + `::after` knob `translateX(0.875rem)` + `.ls-switch-lg`/`ls-thumb-lg` size | layout+appearance+state | switch recipe (checked state + knob translate → typed checked/knob) |
| `.ui__checkbox` inline-flex gap fs-14 + `.lui-checkbox-control` + `[data-checked]` | layout+state | checkbox recipe (gpui reg twin) |
| `.ui__button` variants `.as-solid/-secondary/-outline/-text` + hover + `.ls-btn-sm`; `.ls-btn-xs/-md/-lg/-icon/-default`, `.as-ghost`, `.as-destructive`, `.as-link` | appearance+state | button recipe variants (variant prop) |
| `.ls-font-btn`/`ls-font`/`ls-font-sample`/`ls-font-name`/`ls-font-global` font picker | layout+appearance | font-option recipe |
| `.cp__accent-colors-list-wrap` `grid-template-columns: repeat(8, minmax(0,1fr))` gap + `.as-modal-picker` + `.ls-swatch*` round swatch buttons + `.ls-swatch-none` strike bar | layout+appearance+state | swatch-grid recipe (8-col grid → gap) |
| `.ls-info-icon`, `.shui-shortcut-wrap`, `.ls-label`, `.ls-it-*`, `.ls-ver-*`, `.fade-link`, `.ls-select-*`, `.ls-toolbar-gap`, `.icon-link`, `.ls-plain-list`, `.ls-row*`, `.ls-kbd-*`, `.ls-th-strong`, `.ls-desc`, `.ls-dc`, `.ls-mb`, `.ls-popup-backdrop` fixed inset-0 z-40 | layout+appearance+hook | small slot/utility recipes; `ls-popup-backdrop` = transparent scrim recipe |
| `.control-tabs` justify-between + `.l`/`.r` | layout | tab-bar recipe |
| `.secondary-tabs` + `.active` | appearance+state | secondary-tab recipe |

## Plugins dashboard

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.cp__plugins-settings-inner`/`installed`/`marketplace-cnt`/`item-lists(-inner)` columns + wrap | layout | plugin-list recipes |
| `.cp__plugins-item-card` card `width:calc(50% - .5rem)` min-w-16rem + `.l .plugin-icon` tile + `.r` + `.head`/`.desc`/`.ctl .l .r` + `.menu-list` absolute dropdown | layout+appearance | plugin-card recipe (2-col wrap → gap: fractional sizing); menu-list = nested popover |
| `.search-ctls` + `> small.s1` abs icon + `.form-input` pl | layout+appearance | search-field recipe |
| `.cp__plugins-page .tabs(-inner)`, `.ls-tab-btn` + `.active`, `.ls-icon-btn-md` | appearance+state | tab recipe |
| `.ls-pl-*` (empty/empty-text/meta/status/loading/html/warn/id/link), `.code-mode-wrap`, `.ls-mono`, `.ls-form-actions` | layout+appearance | plugin-pane text recipes |

## Property pickers + popups

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.ls-property-dropdown` w-260px pad + `.inner-wrap`/`property-setting-title`/label + `.disabled` | layout+appearance+state | property-dropdown recipe |
| `.ls-property-name-edit-pane`/`.ls-base-edit-form` + `.input-wrap` + `.ui__input`/`ui__textarea` h-29px border ring-focus | layout+appearance+state | input recipe (focus ring state) |
| `.ls-property-choices-sub-pane .choices-list`, `.ls-property-type-sub-pane`, `.ls-property-ui-position-sub-pane`, `.ls-property-default-value-pane` pad | layout | sub-pane recipes |
| `.select-item` inline-flex chip fs-14 | appearance | select-item recipe (gpui reg twin) |
| `.jtrigger` cursor pointer (flex-1 min-w-0 in value cells) | hook+layout | trigger slot; gpui reg twin |
| `.ls-property-dialog` col + `.ls-property-input`/`.ls-property-add` rows + `.ls-property-key` h-286px + `.cp__select-main .item-results-wrap` max-h-250 | layout | property-dialog recipes; gpui reg `ls-property-dialog` |
| `.ls-icon-color-wrap` inline-flex + `em-emoji` sizing | layout | icon+color slot; gpui reg twin |

## Date/time pickers

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.ui__calendar` flex wrap + `.ui__calendar-cell` centered + `.ui__calendar-day` 1.75rem round + `:hover`/(`[data-selected]`,`.selected`)/`[data-today]` accent | layout+appearance+state | calendar recipe + day variants (selected/today → state props) |
| `.ls-editor-date-picker` 300px card + `.ls-cal-head`/`.ls-cal-selects`/`.ls-date-month-select`/`.ls-date-year-input`/`.ls-cal-nav(-btn)`/`.ls-cal-outside`/`.ls-date-nlp` + `table[role=grid]` 276px fixed + `td[role=gridcell]` | layout+appearance | date-picker recipes (table → grid/rows; `color-scheme` prop) |
| `.ls-date-month-menu`/`.ls-repeat-choice-menu` absolute max-h scroll card z-901 + `.ls-date-month-option` | layout+appearance | month-menu recipe |
| `.ls-repeat-panel`/`head`/`-checkbox`/`[data-checked]`/`-frequency`/`-label`/`-frequency-input`/`-select`/`-next`/`-when`/`-is` + `.ls-time-picker`/`-input`/`-now` | layout+appearance+state | repeat-panel + time-picker recipes |
| `.ls-property-date-picker`, `.ls-datetime` rows | layout | row recipes |

## Icon & color pickers

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.cp__emoji-icon-picker` 380px col overflow-hidden + `> .hd` absolute top-38 + `> .bd` pt-96px scroll + `> .ft` absolute top −1px 40px tab strip | layout | picker recipe (absolute slots → gap if unlayered; fits position+inset) |
| `.ft .tab-item` opacity states; `.search-input` + `.ls-icon-search` abs + `.x` abs + `.ui__input` borderless + `:focus-within` icon opacity | layout+appearance+state | search-field + tab recipes (`focus-within` → focus state on parent → gap-lite) |
| `.pane-section` + `.its`/`.icons-row` wrap + 2.25rem round buttons + `.hd strong` label + `.hover-preview` | layout+appearance | icon-grid recipe |
| `.color-picker-presets .it` 18px round + `.color-picker` 24px swatch + `> strong` abs overlay | layout+appearance | color-swatch recipe |
| `.ls-ep-*` (btn/input/section-title/col/tabs) + `.ls-icon-mini` scale(0.75) | appearance | emoji-picker helpers (icon-mini scale → transform deco) |
| `.action-input` 68px rounded row + `.as-flex-center` 62px tile + `.lui-icon` `mask-image: var(--lui-icon-image)` | layout+appearance | importer action-row + masked-icon recipe (mask icon → icon-color prop) |
| `.importer`, `.cp__onboarding-setups`, `.inner-card` + `h1.ls-imp-title`/`h2`, `.ls-imp-field`, `.ls-hidden-input`, `.importer .c/.d` | layout+appearance | importer/onboarding recipes (responsive centering) |
| `.new-graph`, `.ls-ng-*` rows/labels, `.ls-pad`/`.ls-mb-sm`/`.ls-strong`/`.ls-ex-list`, `.export h1`/`.export hr`, `.ls-cards-select(-value)` | layout+appearance | new-graph/export/cards-select recipes |

## Page properties panel (lui-core 1572–2043)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.ls-properties-area` + `.properties-panel` (+ dead `-header`) | layout | properties-panel recipe; gpui regs twin |
| `.property-pair.property-panel-row` `grid-template-columns: fit-content(260px) minmax(0,1fr)` | layout | property-row recipe (fit-content grid → gap) |
| `.property-key-panel`/`-inner`, `.property-m`/`.property-k` chromeless buttons | layout+appearance | key-cell recipe (inner dead — flatten) |
| `.property-value-panel(-inner)` + `[data-property-type='node|checkbox|url']` attr selectors + `.ls-block.property-value-container` | layout+state | value-cell recipe; per-type variants via attr (keep data attr hook) |
| `.property-block-container` −20px hang | layout | hang-into-gutter recipe |
| `.hidden-properties-toggle-*` | layout+state | collapse-toggle recipe; gpui reg twin |
| `.property-panel-bullet` | appearance | bullet slot |
| `.property-panel-edit-btn` absolute `translateY(-50%)` + `:has(.property-value-panel-inner:hover)` reveal + inset box-shadow | layout+state+deco | edit-button slot (parent-hover reveal → gap; inner class dead — restyle on `.property-value-panel:hover`) |
| `.positioned-properties.block-below` | layout | placement variant |
| `.bottom-properties-row`/`-pills-strip`/`-pill` radius 9999 + inset shadow + nowrap overflow | layout+appearance | property-pill recipe |
| `.prop-edit-ico` hover/focus-visible reveal | state | reveal-on-hover slot |
| `.as-scalar-value-wrap .ui__checkbox` flex-0 | dead/layout | wrapper class dead; checkbox cell recipe stays |
| `.property-key` 15px/160px | appearance | property-key recipe |
| `.ls-page-properties`/`.ls-new-property` | layout+appearance | section recipes; gpui regs twin |
| `.block-add-button .bab-inner` margins | layout | add-button recipe (gpui `block-add-button` hooks) |
| `.pv-closed-value`, `.ls-property-select-*`, `.ls-ep-*`, `.ls-hover-lit`, `.ls-number`, `.all-pane`, `.ls-block-right`, `.editor-wrapper`/`.editor-inner`/`property-value-inner` flex cells | layout+appearance+state | value-cell recipes (`ls-hover-lit`, `ls-number` dead) |

## Hooks that MUST survive migration

- `data-property-type` on `.property-value-panel` (node/checkbox/url
  variants) and `data-checked` on `.ui__checkbox`/`.lui-switch-control`/
  `.ls-repeat-checkbox`
- `data-id="keymap"` on `.settings-menu-item`, `data-selected`/
  `data-active`/`aria-pressed` on `.settings-menu-item` and
  `.shortcut-filter-pill`
- `.cp__settings-inner` aside/article structure (`.settings-aside`,
  `.settings-menu`, `.settings-article`, `.cp__settings-header`),
  `.cp__settings-<key>-cnt` per-page classes (`"cp__settings-" ^ key ^
  "-cnt"` concat — dynamic prefix, keep the shape)
- `.ls-dialog-settings` (gpui reg + dialog-name hook)
- `table[role="grid"]` / `td[role="gridcell"]` + `[data-selected]`/
  `[data-today]`/`.selected` on `.ui__calendar-day`
- `.jtrigger` click-target class, `.property-value-container`,
  `.ls-block` on property containers (block chrome hooks — editor
  family shares these)
- `.cp__accent-colors-list-wrap` + `.as-modal-picker`,
  `.cp__theme-modes-options .mode-*` + `.mode-active`,
  `.shortcut-keystroke-inactive`, `.keyboard-shortcut` chips
- `.lui-icon` `mask-image: var(--lui-icon-image)` — the icon-mask
  mechanism itself is the hook (adapters paint via the var)

Dual-track hooks: web uses `data-*` attrs on rows (`data-highlighted`
already in menus; here `data-selected`, `data-checked`,
`data-active`, `aria-pressed`, `data-id`, `data-property-type`) while
gpui registers flat class names (`settings-menu-item`, `property-k`,
`jtrigger`, `select-item`). Recipes must key on both tracks.

## LUI capability gaps (beyond the cmdk list)

cmdk already needs: position+inset, typography props, state variants,
ellipsis, min/max sizing, user-select, inset shadow. Settings &
properties additionally needs:

1. Grid track templates + placement — `repeat(3, minmax(0,1fr))`
   (`.it` rows), `repeat(8,…)` (accent swatches),
   `fit-content(260px) minmax(0,1fr)` (property rows),
   `grid-column: span 2/3` (`.ls-it-value`, `.ls-it-actions`,
   `.ls-span3`). gpui `apply_decl` has display:grid but no
   `grid-template-columns`/`grid-column` — the single largest gap in
   this family
2. `:checked` / `data-checked` state styling (switch bg + knob
   `::after` transform, calendar day, filter pill `aria-pressed`,
   repeat checkbox) — check-state prop
3. `::after` knob/thumb pseudo-node (`.lui-switch-control::after`) —
   emit as a real child node
4. `transform: translateX/scale` for the switch knob and
   `.ls-icon-mini` scale(0.75) — semantic knob offset (express as
   layout offset, not deco)
5. Fractional/wrapped sizing — plugin cards `width:calc(50% - .5rem)`,
   `dvh` heights, `fit-content` tracks (calc + % sizes → gap)
6. `text-transform` (capitalize via `::first-letter`, lowercase) —
   pseudo-element-free capitalize needed; `::first-letter` itself deco
7. `list-style:none`/marker suppression on `.settings-menu`,
   `.ls-plain-list`, `.choices-list`, `.cp__theme-modes-options`
8. `-webkit-line-clamp` on select trigger labels
9. `cursor` variants: `not-allowed` (`.disabled`), `copy`, `ew-resize`
10. Responsive breakpoints — settings modal 768px two-pane switch,
    `.it` 640px grid switch, `keymap` menu-item reveal at 640px,
    panel-wrap 640px width cap (same size-class mechanism as sidebar)
11. `:focus-within` on `.cp__filters-input-panel`,
    `.cp__emoji-icon-picker .search-input` (parent-focused state →
    focus-within channel or signal)
12. `background-image`/asset thumbnails + `mask-image` icon painting
    (`.action-input .lui-icon`, theme-mode `i` thumbnails) — icon-color
    prop covers mask; image assets need an image/asset prop
13. `text-align` (center/right on `.ls-kbd-cell`, importer headers) —
    not in `apply_decl`
14. `:nth-child`/`:last-child`/`:first-of-type` slot selectors
    (`.it > *:nth-child(2):last-child`, `.menu-list` etc.) — replace
    with explicit slot kinds
15. `color-scheme` on `.ls-time-input` (native control theming) —
    platform deco
16. `resize:vertical` (`.ui__textarea`), `aspect-ratio` (supported),
    `:empty` collapse (`.ui__switch > .lui-control-label:empty`,
    `.ls-filters:empty`) — emit nothing instead

## Dead selectors

- `.ls-btn-label` — no emitter
- `.ls-thumb-lg` — no emitter (`.ls-switch-lg` is emitted; the thumb
  variant never is)
- `.ui__select-icon` — no emitter (also flagged under menus)
- `.properties-panel-header`, `.property-key-panel-inner`,
  `.property-value-panel-inner` — never emitted (only the `-panel`
  wrapper classes are); rules restyling them are dead, including the
  `:has(.property-value-panel-inner:hover)` operand
- `.as-scalar-value-wrap`, `.pv-editor-positioned` — no emitters
- `.ls-hover-lit`, `.ls-number` — no emitters

## Decoration that stays per-platform

Transitions/opacity fades, `transition=fill` on icons, gradient/photo
thumbnails (theme png assets), `resize`, `color-scheme`,
`outline`/`box-shadow` ring micro-styles where the shared recipe already
declares a focus variant, `.dark` color tweaks resolved by tokens.

## Task 5 deletion pass (devin/003-t5-settings)

Recipes added in `deps/ui/src/shared/ui_components.ml`: `form_row`
(label|control|desc|kbd, grow-ratio replaces the 3-col `.it` grid),
`form_label`, `form_desc`, `search_row` (icon+search_field+trailing;
`search-ctls`/`search-input-wrap` killer), `nav_item` (settings nav,
`--lx-nav-active` light/dark token added in `ui_theme.ml`),
`chip_toggle` (pills/tabs/segmented filters), `color_swatch` (18/30px
round swatches), `property_pill` (bottom-properties chip),
`plugin_card`, `option_card` (theme-mode thumb card). Kind adoptions:
`slider` (plugin settings range), `search_field` (keymap filter,
plugins search, icon picker), `toggle_group` (plugins secondary tabs,
keymap pills, icon-picker tabs), `card` (plugin cards), `keycap` +
`shortcut_separate` (kbd_seq), `list_item` (nav + theme cards).

CSS deleted in `resources/css/lui-overlay.css` (~600 lines): the `.it`
grid row rules + `.it .ls-label`/`.it-label`/`:nth-child(2):last-child`
span-2/`.it-desc`; `.settings-menu-item` visual set (base, lui-list-item
override, hover/data-selected/active/.dark) — `data-id="keymap"` hide
kept as a standalone hook rule (breakpoint channel is still a gap);
`.shortcut-toolbar-row .search-input-wrap*` + `.search-icon*`
(toolbar row collapses to `flex-wrap:wrap` only);
`.shortcut-filter-pill*` (container keeps `flex-wrap` only);
`.search-ctls*`; `.secondary-tabs*` (container + `> a/button` +
`.active`); `.desc-item*` (+ `.form-control`, `.wrap` — wrap grow now a
prop); `.cp__plugins-item-card` base rule (width/border/radius/pad are
props; inner `.l`/`.r`/`.head`/`.desc`/`.ctl`/`.menu-list` hooks kept);
`.cp__theme-modes-options` complete block (~15 rules, li/i/strong/
.mode-*/.mode-active/.lui-list-item); `.ls-cm-swatch` + `.heading-bg`
+ `.remove` (dot/remove bound as props; joint swatch+heading-btn rules
rewritten heading-only); `.ls-cm-colors(-row)` (padding/margin → props;
`margin-top:.5rem` kept as one deco leftover);
`.cp__emoji-icon-picker .ft .tab-item*` + `.search-input*` (10 rules);
`.color-picker-presets` + scoped `.it` swatch rules; `.ls-swatch*`
(cell/dot/none — sizes+bg now props); `.ls-search-ico`; `.ls-tab-btn*`;
`.ls-ep-input`; helpers `.ls-label`, `.ls-it-*` (value/top/label-col/
desc/actions/side), `.ls-switch-wrap`, `.ls-switch-narrow`,
`.ls-kbd-cell`. Dead bindings dropped in `icon_picker.ml`
(`ui_input_cls`, `tab_item_cls`, `btn_ghost_sm`).

Not migrated (documented blockers, per plan): `.property-panel-row`
`fit-content(260px) minmax(0,1fr)` grid track; `repeat(8,...)` accent
grid → `grid ~columns:8` already used; date-picker/calendar (44 rules);
`width:calc(50% - .5rem)` plugin card (carried via `style` data_attr);
`min-height:55dvh` modal sizing; `@media` 640/768 breakpoint channels;
`::first-letter` capitalize; `-webkit-line-clamp`; `:focus-within`
channel; `color-scheme`; `resize`; `aspect-ratio`; parent-hover reveal
(`.prop-edit-ico`); `text-align`; `transform` scale/translate (switch
knob, icon-mini); `.select-item` chips (live inside property-value
rendering — stay-custom zone); importer/onboarding/new-graph/cards
text recipes; `.ui__select-*`/`.ls-font-*` leftovers still emitted.

gpui: `settings-menu-item`/`property-k`/`select-item`/`jtrigger`
registrations must be repointed at recipe output when gpui adopts this
family — no Rust changes made in this batch.
