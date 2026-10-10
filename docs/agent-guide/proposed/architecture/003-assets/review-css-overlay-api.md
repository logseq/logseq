# Review — `lui-overlay.css` → LUI typed props / recipes

Read-only classification of every rule left in `resources/css/lui-overlay.css`
(4,466 lines, **616 rules**, 466 distinct classes) after the dead-selector
purge, on `refactor/lui` @ `433c7909aa`. Companion to
`review-menus-kit.md` / `review-settings-kit.md`, which audited *views* against
kit kinds; this file classifies the *stylesheet* — the view-side channel every
rule should migrate to per `.agents/skills/logseq-lui/SKILL.md` ("typed props
are the only layout channel"; `~style_class` carries only app-semantic
classes).

Verdicts:

- **→ typed props** — layout/spacing/sizing/alignment/typography/color that a
  view emitter can already express (`~gap ~padding* ~width ~height ~min_*
  ~max_* ~grow ~main ~cross ~inset* ~position ~z_index ~font_size ~font_weight
  ~line_height ~white_space ~text_overflow ~opacity ~cursor ~foreground
  ~background ~corner_radius ~border* ~shadow ~hover_* ~pressed_* ~focus_*
  ~selected_* ~disabled_opacity ~visible ~user_select ~overflow ~display …`).
  Note names the emitter + the props.
- **→ recipe** — pattern repeated across ≥2 surfaces; belongs in
  `ui_components.ml` (existing: `menu_card`, `popover_card`, `color_swatch`,
  `option_card`, `chip_toggle`, `property_pill`, `plugin_card`,
  `dialog_close`, `action_bar_capsule`, `flat_toolbar`, `settings-menu-item`,
  `shortcut` keycap, `btn` variants).
- **KEEP (hook)** — e2e/test anchor, imperative-DOM target, dynamic-prefix
  selector, platform bridge, or decoration CSS must own (animations/keyframes,
  `::selection`/`::after`/`::placeholder`, `:has()`, `:focus-within`,
  `:empty`, cross-node `:hover`, `backdrop-filter`, `@media`,
  `prefers-reduced-motion`, `mask-image`, `scrollbar-width`, sticky position,
  text-decoration, list-style, svg internals, runtime `data-*` state).
- **KEEP (token)** — `:root`/theme variable and keyframe infrastructure.
- **DEAD** — selector no longer emitted by any `.ml` view (verified against a
  quoted-string scan of `deps/ui/src/**`).

## Counts

| Verdict | Rules | Sheet lines covered |
|---|---|---|
| → typed props | 453 | ~2,596 |
| → recipe | 33 | ~270 |
| KEEP (hook) | 111 | ~750 |
| KEEP (token) | 7 | ~60 |
| DEAD | 12 | ~60 |
| **total** | **616** | **4,466** |

Roughly **2,900 of 4,466 lines (~65%)** deletable once the migrations land;
the stylesheet converges to tokens, animations, runtime-state decorations,
and a handful of hooks.

## gpui registration overlap (`deps/ui/gpui/host/src/logseq_ext.rs`)

92 `register_class_style` calls; **31 classes overlap** this sheet. Where the
web rules migrate to typed props, the gpui reg must migrate too (or go):

| Registration(s) | Status |
|---|---|
| `ui__dialog-overlay`, `ui__alert-dialog-overlay`, `ui__dialog-content`, `ui__alert-dialog-content`, `ui__dialog-main-content` (l.170–209, 285+) | content/title rules → typed props on `dialogs_view.ml`; **overlay/content regs only remain for the pdf_toolbar imperative modal** — flag for removal when that converts to a view |
| `ls-dialog-settings`, `ls-dialog-cmdk`, `ls-dialog-generic` | dynamic `ls-dialog-<name>` class stays as hook; pad/width regs → `~padding`/`~width`/`~max_width` |
| `ui__popover-content`, `ui__dropdown-menu-content`, `ui__dropdown-menu-sub-content` | card chrome → `menu_card`/`popover_card` recipes; regs become redundant |
| `menu-links-wrapper`, `menu-link-wrap`, `menu-link`, `chosen` (l.609–627) | `menu-links-wrapper` is **dead on web** — remove reg; `menu-link`/`chosen` → menu-link recipe + `SelectedBackground` |
| `ls-popup-backdrop` | → `~position ~inset ~z_index ~background` (settings_page.ml:749) |
| `cp__cmdk-hint-label` (l.551), `icon-cp-container` (l.559) | → `~opacity` / `row ~cross:`center` |
| `keyboard-shortcut`, `hd`, `selected`, `block-head-wrap`, `control-hide`, `page-inner`, `ls-page-blocks`, `ls-page-title*`, `menu-link*` remnants | keycap → shortcut recipe; `hd` → header row props; `selected` → `SelectedBackground`; `control-hide` stays a hook (cross-node hover reveal); `page-inner`/`ls-page-blocks` margin rules are margin-only — no prop, needs parent gap |

`lui-*` classes in this sheet (`lui-menu-item*`, `lui-button*`,
`lui-popover`, `lui-dialog`, `lui-toast-viewport`, `lui-list-item`,
`lui-select-value`, `lui-checkbox-control`, `lui-switch-control`,
`lui-control-label`, `lui-icon`, `lui-label`, `lui-row`) are emitted by the
**renderer** (`~/repos/lui/platform/web/melange/nodes/lui_web_nodes.ml`), not
by app views — kind-internal styling belongs to `platform/web/src/lui.css`,
not here and not in gpui regs.

## Largest typed-prop migrations (deletable lines by surface family)

| Est. lines | Surface | Emitter |
|---|---|---|
| ~350 | dialog bodies (confirm, login, e2ee, quick-add, readme, prompt, export, settings-url) | `dialogs_view.ml`, `login_view.ml`, `ui_requests.ml`, `quick_add_view.ml`, `plugin_readme.ml`, `settings_url_view.ml`, `exporter.ml`, `export_view.ml` |
| ~290 | view head + filters + sort (`ls-view-*`, `ls-vf-*`, `ls-op-*`, `ls-sort-*`, `cp__filters*`, `ls-ref-btn`) | `views_head.ml` |
| ~320 | date/time/repeat pickers (`ui__calendar*`, `ls-cal-*`, `ls-date-*`, `ls-time-*`, `ls-repeat-*`, `ls-editor-date-picker`) | `editor_commands.ml` |
| ~190 | menu chrome + items (`ui__dropdown-menu-*`, `ui__popover-content`, `menu-list`, `ls-cm-*`, `cp__select*`) | `menu_item.ml`, `popups_view.ml`, `views_popup.ml`, `ui_components.ml` |
| ~170 | plugins dashboard (`cp__plugins-*`, `ls-pl-*`, `menu-list`, `control-tabs`) | `plugins_view.ml` |
| ~135 | settings modal frame (`cp__settings*`, `settings-*`, `appearance*`) | `settings_view.ml`, `settings_page.ml` |
| ~130 | icon/emoji picker (`cp__emoji-icon-picker`, `ls-ep-*`, `color-picker`) | `icon_picker.ml` |
| ~110 | table (`ls-table-*`, `selected`, fold a11y) | `views_table.ml` |
| ~105 | autocomplete rows (`#ui__ac*`, `menu-link`, `ls-ac-*`) | `popups_view.ml` |
| ~90 | sidebar (`repos-*`, `cp__sidebar-help-menu-popup`, `ls-hm-*`, `cloud`) | `left_sidebar_view.ml`, `chrome.ml`, `right_sidebar_view.ml` |

## Surprises / notes

- **Dead selectors already gone from views**: `.menu-links-wrapper`,
  `.choices-list`, `.search-results-wrap` (partial), `.ls-property-input`,
  `.ls-login-input`, `.ls-icon-sm`, `.ls-icon-dim`, `.ls-icon-queryCode`,
  `.ls-property-*-sub-pane`, `.property-select`, `.sh`,
  `.cp__select` var block, `.ui__alert` (replaced by `alert` kind —
  login_view.ml:506 comment). ~60 lines + a stale gpui reg
  (`menu-links-wrapper`) to delete outright.
- **`data-size=sm` is already redundant**: `~size:`sm` emits `data-size`
  through the button kind; the `.lui-button.ui__button[data-size="sm"]` rule
  duplicates what views already pass.
- **The `as-*`/`ls-btn-*` button-variant classes are call-site noise**:
  `btn_base`/`~variant` in `settings_controls.ml:54` already does the work —
  33 rules collapse into the existing recipe.
- **No `margin`, `flex-wrap`, `hover-fg`, `hover-border`, `text-decoration`,
  `list-style`, `font-family`, `background-image`, `position:sticky`, or
  `transform` prop exists.** ~40 rules are margin-only or wrap-only; they need
  parent-side `~gap`/`~padding` restructuring rather than 1:1 porting, and a
  few (`.ls-mb`, `.ls-ml`, `cp__filters`) are candidates for a `Margin*`
  schema addition or should stay as hooks.
- **`.ui__dialog-overlay/-content/-main` survive only for
  `extension/pdf_toolbar.ml:885`**, the last imperative-DOM modal — convert it
  to a view and the whole `ui__dialog-*` + gpui reg block dies.
- **`ls-dialog-<name>` is a dynamic class** (`dialogs_view.ml:56`), so every
  `ls-dialog-settings/login/plugins/…` rule hangs off a dynamic-prefix hook —
  the class stays, the declarations inside migrate.
- **`.cp__settings-<key>-cnt` is computed** (`settings_url_view.ml:76`) —
  looked dead, isn't.
- **Runtime `data-*` attrs do the state work**: `data-highlighted`,
  `data-side`, `data-cover`, `data-starting/ending-style`, `data-index`,
  `data-viewport-type`, `data-base-ui-inert` are set by the renderer/JS, not
  view signals — those rules must remain (or move into the platform sheet).
  `selected`/`data-selected`/`data-checked` on *view-driven* elements
  (`ls-table-row`, calendar days, checkbox) CAN migrate to
  `SelectedBackground`/`selected` signal.

## Classification table

Line ranges are rule offsets in `resources/css/lui-overlay.css` @ `433c7909aa`.
"Emitter" cites `deps/ui/src/…` `.ml` files.

### Menus & shared popup chrome — 56 rules

| Lines | Selector | Verdict | Destination / hook reason |
|---|---|---|---|
| `31–33` | `.hidden {` | → typed props | visible/display prop or mount condition — emitters chrome.ml:428/463/491/540 (spacer), new_graph.ml:106, collaborators.ml:329 |
| `40–46` | `.lui-popup-portal {` | KEEP (hook) | runtime shell — .lui-popup-portal is renderer-owned portal layer, no view node |
| `48–54` | `.lui-popup-positioner {` | KEEP (hook) | runtime shell — positioner element emitted by renderer (lui_web_nodes.ml:203) |
| `56–67` | `.lui-popover {` | KEEP (hook) | popover kind chrome (transition + var clamps) — belongs to platform/web/src/lui.css, not view props |
| `69–73` | `.lui-popover[data-starting-style],.lui-popover[data-ending-style] {` | KEEP (hook) | runtime transition attrs data-starting/ending-style + transform |
| `85–88` | `.lui-popup-positioner[data-cover] {` | KEEP (hook) | cover mode — runtime data-cover attr on positioner |
| `90–95` | `.lui-popup-positioner[data-cover] > .lui-popover {` | KEEP (hook) | same |
| `113–132` | `.ui__popover-content,.ui__dropdown-menu-content,.ui__dropdown-menu-sub-content {` | → recipe | card chrome → menu_card/popover_card recipes (ui_components.ml:771/786 — already exist); residual hook: --lui-pop-* slide vars + animation |
| `138–140` | `.lui-popup-positioner:has(> .ls-anchor-cx) {` | KEEP (hook) | :has() cross-node — positioner transform from child anchor class |
| `142–144` | `.lui-popup-positioner:has(> .ls-anchor-cx.ls-anchor-top) {` | KEEP (hook) | same |
| `147–154` | `.ui__dropdown-menu-content,.ui__dropdown-menu-sub-content,.ui__popover-content[data-side="bo…` | KEEP (hook) | runtime data-side drives --lui-pop-dy slide offset |
| `156–160` | `.ui__popover-content[data-side="top"],.ui__dropdown-menu-content[data-side="top"],.ui__dropd…` | KEEP (hook) | same |
| `162–166` | `.ui__popover-content[data-side="left"],.ui__dropdown-menu-content[data-side="left"],.ui__dro…` | KEEP (hook) | same |
| `168–172` | `.ui__popover-content[data-side="right"],.ui__dropdown-menu-content[data-side="right"],.ui__d…` | KEEP (hook) | same |
| `174–177` | `.ui__dropdown-menu-sub-content {` | → recipe | submenu deeper shadow — fold into menu_card submenu variant; emitter popups_view.ml:635 |
| `181–184` | `.ui__dropdown-menu-content,.ui__dropdown-menu-sub-content {` | → recipe | padding:0.25rem = menu_card ~padding:4 — recipe already covers |
| `224–237` | `.ui__dropdown-menu-item,.ui__dropdown-menu-sub-trigger {` | → recipe | menu-item row chrome → menu-item recipe over Menu_item.el (menu_item.ml:26): padding/font-size/cursor/user-select/radius |
| `239–245` | `.ui__dropdown-menu-item[data-highlighted],.ui__dropdown-menu-sub-trigger[data-highlighted],.…` | KEEP (hook) | runtime data-highlighted/[data-open] — roving-focus state view cannot see |
| `247–250` | `.ui__dropdown-menu-item[data-disabled] {` | KEEP (hook) | runtime data-disabled (or DisabledOpacity via ~enabled) |
| `252–256` | `.ui__dropdown-menu-separator {` | → typed props | ~height ~background on separator divider — menu_item.ml:18/33; margin via parent gap |
| `261–263` | `.lui-menu-item > .lui-menu-item-icon {` | KEEP (hook) | kind-internal part order (lui-menu-item-icon) |
| `265–267` | `.lui-menu-item > .lui-menu-item-label {` | KEEP (hook) | kind-internal part (label) |
| `269–271` | `.lui-menu-item > .lui-menu-item-check {` | KEEP (hook) | kind-internal part (check) |
| `274–277` | `.ui__dropdown-menu-item.lui-menu-item,.ui__dropdown-menu-sub-trigger.lui-menu-item {` | → typed props | ~gap on menu_item node — menu_item.ml:26 |
| `282–291` | `.menu-item-label,.lui-menu-item-label {` | KEEP (hook) | kind-internal label part (flex/min-width/overflow) |
| `313–319` | `.select-item-row {` | → typed props | row ~cross/`end ~width — views_popup.ml:426 |
| `321–327` | `.select-item-left {` | → typed props | row ~gap ~min_width — views_popup.ml:428 |
| `329–331` | `.cp__select-apply {` | → typed props | ~padding on apply row — views_popup.ml:483 |
| `375–385` | `.menu-links-wrapper {` | DEAD | menu-links-wrapper not emitted anywhere (post-rewrite); gpui reg at logseq_ext.rs:611 is stale — delete both |
| `402–409` | `.menu-link {` | → recipe | .menu-link row chrome → menu-link recipe — emitters popups_view.ml:190, views_head.ml:345, views_popup.ml:414; hover → HoverBackground |
| `411–415` | `.menu-link:hover {` | → recipe | same recipe (HoverBackground + radius) |
| `417–421` | `.menu-separator {` | → typed props | divider ~margin→parent gap, ~border — right_sidebar_view.ml:94 |
| `423–426` | `.hide-scrollbar {` | KEEP (hook) | scrollbar-width / -ms-overflow-style — no prop |
| `428–430` | `.hide-scrollbar::-webkit-scrollbar {` | KEEP (hook) | ::-webkit-scrollbar pseudo-element |
| `470–473` | `#ui__ac .menu-link strong,.menu-links-wrapper strong {` | → typed props | ~font_weight on match-highlight text — ac_label_el popups_view.ml |
| `482–487` | `.ls-menu-chevron {` | → typed props | chevron icon ~width ~height ~flex_shrink — popups_view.ml:604 |
| `508–511` | `.menu-link-wrap > a.menu-link > span:first-child {` | → typed props | ~grow ~min_width on flex1 box — popups_view.ml:203 |
| `545–548` | `.cp__commands-slash .menu-link.chosen .ui__icon,.cp__commands-slash .menu-link[data-selected…` | KEEP (hook) | cross-node .menu-link.chosen .ui__icon — state on parent drives child |
| `591–593` | `.ls-context-menu-content {` | → typed props | ~width — popups_view.ml:679 |
| `596–598` | `.ls-context-menu-content.ls-tag-menu {` | → typed props | ~width — same |
| `600–605` | `.ls-context-menu-content [role="separator"] {` | → typed props | separator ~height ~background ~opacity — menu divider emitter |
| `708–711` | `.cp__select {` | DEAD | --cp__select-* vars — palette block now unused (colors moved to props) |
| `713–717` | `.cp__select-main {` | → typed props | column ~gap ~padding — views_popup.ml:470 / views_head.ml:377 |
| `719–725` | `.cp__select-main .item-results-wrap,.cp__select-main .search-results-wrap > div:first-child {` | → typed props | ~max_height ~padding on results wrap — views_head.ml:386; .search-results-wrap part is dead |
| `751–753` | `.ui__dropdown-menu-content .cp__select-main {` | → typed props | ~padding — same as 713 |
| `755–761` | `.cp__select-results .menu-link {` | → typed props | ~padding on menu-link rows — same recipe as 402 |
| `763–766` | `.cp__select-results .menu-link > span:first-child {` | → typed props | ~grow ~min_width — same as 508 |
| `768–774` | `.cp__select-main .menu-link.chosen,.cp__select-main .menu-link.chosen p,.cp__select-main .me…` | → typed props | SelectedBackground — same as 513 |
| `776–781` | `.dark .cp__select-main .menu-link.chosen,.dark .cp__select-main .menu-link.chosen p,.dark .c…` | KEEP (hook) | theme-scoped .dark override — stays in theme block |
| `783–785` | `.cp__select-main .menu-link:hover p {` | KEEP (hook) | cross-node .menu-link:hover p color |
| `787–792` | `.cp__select-main .search-result {` | → typed props | ~padding — search-result rows |
| `794–796` | `.cp__select-main .ui__icon {` | → typed props | icon ~font_size |
| `1001–1004` | `.ls-menu-item-icon {` | → typed props | icon ~padding/margin — icon emitter in menu item |
| `1801–1808` | `.select-item {` | → typed props | row ~cross ~gap ~padding — views_table.ml:467 select-item |
| `2844–2848` | `.ls-popup-backdrop {` | → typed props | ~position ~inset ~z_index ~background — ls-popup-backdrop settings_page.ml:749 |
| `3402–3405` | `.ls-menu-h3 {` | → typed props | ~font_size ~font_weight ~padding — ls-menu-h3 properties_menu.ml:480 |

_menus: 25 typed-props · 6 recipe · 23 keep-hook · 0 token · 2 dead_

### Command palette (cmdk) — 8 rules

| Lines | Selector | Verdict | Destination / hook reason |
|---|---|---|---|
| `651–657` | `.lui-dialog.ls-dialog-cmdk {` | → typed props | cmdk dialog ~height ~max_height ~padding — cmdk_view.ml:871 (already ~width ~padding:0); overflow native |
| `669–673` | `.cp__cmdk-search-input::selection {` | KEEP (hook) | ::selection pseudo-element |
| `677–679` | `.cp__cmdk .ui__icon {` | → typed props | icon ~font_size — cmdk input row ui_components.ml:81-96 |
| `681–684` | `.cp__cmdk-input-row .ui__icon {` | → typed props | same + ~width |
| `687–689` | `.ui__tooltip-content {` | KEEP (hook) | tooltip runtime animation (ui__tooltip-content) |
| `692–694` | `.ui__tooltip-arrow {` | KEEP (hook) | tooltip arrow transform |
| `698–700` | `.cp__cmdk-hint-label {` | → typed props | ~opacity — hint label emitter cmdk_view.ml; also registered in gpui logseq_ext.rs:551 — after migration remove reg |
| `702–704` | `.cp__cmdk-hint:hover .cp__cmdk-hint-label {` | KEEP (hook) | cross-node :hover .cp__cmdk-hint-label reveal |

_cmdk: 4 typed-props · 0 recipe · 4 keep-hook · 0 token · 0 dead_

### Settings — 85 rules

| Lines | Selector | Verdict | Destination / hook reason |
|---|---|---|---|
| `293–306` | `.ui__dropdown-menu-checkbox-item {` | → typed props | checkbox-item row — views_popup.ml:304; props pad/radius/font/cursor; residual text-transform |
| `308–310` | `.ui__dropdown-menu-checkbox-item[data-highlighted] {` | KEEP (hook) | runtime data-highlighted |
| `1057–1059` | `.lui-dialog.ls-dialog-settings {` | → typed props | ls-dialog-settings ~padding — dynamic ls-dialog-<name> class dialogs_view.ml:56 |
| `1140–1143` | `.lui-dialog.ls-dialog-settings {` | → typed props | settings dialog ~padding — settings_view/settings_page |
| `1174–1179` | `.lui-dialog.ls-dialog-settings {` | → typed props | settings dialog ~width |
| `1181–1183` | `.lui-dialog.ls-dialog-settings .settings-modal {` | → typed props | settings-modal ~corner_radius — settings_view.ml |
| `1863–1868` | `.cp__settings-inner {` | → typed props | row/column ~min_height ~width — cp__settings-inner settings_view.ml:166 |
| `1871–1873` | `.cp__settings-inner {` | KEEP (hook) | @media settings layout |
| `1879–1884` | `.cp__settings-inner > .cp__settings-header,.cp__settings-inner > header {` | → typed props | row ~cross ~gap ~padding — settings header |
| `1886–1889` | `.cp__settings-inner > header h1 {` | → typed props | ~font_size ~font_weight ~line_height — ui__dialog-title heading settings_view.ml:168 |
| `1894–1899` | `.cp__settings-inner > .settings-aside,.cp__settings-inner aside {` | → typed props | column ~gap ~padding ~border_right via border — settings-aside settings_page.ml:700 |
| `1902–1905` | `.cp__settings-inner > .settings-aside, .cp__settings-inner > aside {` | KEEP (hook) | @media aside |
| `1910–1917` | `.cp__settings-inner > .settings-article,.cp__settings-inner > article {` | → typed props | column ~gap ~padding — settings-article |
| `1920–1925` | `.cp__settings-inner > .settings-article, .cp__settings-inner > article {` | KEEP (hook) | @media article |
| `1928–1939` | `.cp__settings-inner > .settings-aside > .cp__settings-header,.cp__settings-inner > .settings…` | → typed props | row ~cross ~main — settings-header |
| `1941–1944` | `.cp__settings-inner .settings-aside > .cp__settings-header {` | → typed props | ~padding — aside header |
| `1946–1953` | `.cp__settings-inner .settings-aside > .cp__settings-header > .ui__icon {` | → typed props | icon badge ~width ~height ~corner_radius ~background — settings ui__icon box |
| `1955–1959` | `.cp__settings-inner .settings-aside > .cp__settings-header > .ui__icon > svg,.cp__settings-i…` | → typed props | icon ~size ~width — .ui__icon.lui-icon part; svg selector is internal |
| `1961–1965` | `.cp__settings-modal-title {` | → typed props | ~font_size ~font_weight — cp__settings-modal-title |
| `1967–1969` | `.cp__settings-category-title {` | → typed props | ~font_size ~font_weight ~foreground — category title |
| `1971–1974` | `.cp__settings-modal-title::first-letter,.cp__settings-category-title::first-letter {` | KEEP (hook) | ::first-letter pseudo-element (caps) |
| `1978–1986` | `.cp__settings-inner aside > ul.settings-menu,.cp__settings-inner .settings-aside > .settings…` | → typed props | column ~gap ~padding — settings-menu settings_page.ml:700; margin residual (no margin prop → parent gap) |
| `1988–1990` | `.settings-menu-item[data-id="keymap"] {` | KEEP (hook) | data-id=keymap + @media — section-conditional rule |
| `1996–1998` | `.settings-menu-item.lui-list-item[data-id="keymap"] {` | KEEP (hook) | @media |
| `2004–2006` | `.cp__settings-inner.no-aside > article {` | → typed props | ~padding — no-aside article |
| `2055–2057` | `.panel-wrap [role="checkbox"]:hover {` | → typed props | HoverOpacity — role=checkbox hover |
| `2071–2076` | `.cp__settings-appearance-dialog-inner {` | → typed props | column ~gap ~padding — appearance dialog inner settings_view.ml:140 |
| `2078–2083` | `#appearance_settings.cp__settings-appearance-dialog-inner {` | → typed props | ~width ~padding ~shadow — #appearance_settings settings_page.ml:757; margin residual |
| `2103–2109` | `.cp__shortcut-page-x-pane-controls {` | → typed props | row ~gap — cp__shortcut-page-x-pane-controls settings_page.ml:362 |
| `2111–2113` | `.shortcut-toolbar-row {` | KEEP (hook) | flex-wrap only — no wrap prop (shortcut-toolbar-row) |
| `2119–2136` | `.shortcut-keystroke-inactive {` | → typed props | ~opacity — shortcut-keystroke-inactive settings_page.ml:374 |
| `2138–2141` | `.shortcut-keystroke-inactive:hover {` | → typed props | HoverOpacity — same |
| `2143–2149` | `.shortcut-pills-row {` | → typed props | row ~cross ~gap — shortcut-pills-row; flex-wrap residual |
| `2152–2155` | `.shortcut-pills-row .ls-toolbar-gap {` | → typed props | margin-left → ~gap — ls-toolbar-gap inside pills row |
| `2172–2186` | `.cp__shortcut-page-x li.th,.lui-list-item.th {` | → typed props | column ~gap ~padding — cp__shortcut-page-x li.th + lui-list-item.th |
| `2188–2190` | `.lui-list-item.th .ls-th-strong {` | → typed props | ~font_weight — ls-th-strong settings_page.ml:457 |
| `2192–2197` | `.shortcut-row {` | → typed props | row ~cross ~gap ~padding — shortcut-row |
| `2199–2203` | `.shortcut-row .sh {` | DEAD | .sh spans not emitted — dead |
| `2205–2209` | `.keyboard-shortcut {` | → recipe | keycap recipe — .keyboard-shortcut shared (settings_controls.ml:41 comment confirms); display/gap → row props |
| `2229–2236` | `.cp__plugins-settings-inner {` | → typed props | column ~gap ~padding — cp__plugins-settings-inner plugins_view.ml |
| `2573–2575` | `.appearance-popup {` | → typed props | ~padding — appearance-popup settings_page.ml:756 |
| `2731–2735` | `.ls-info-icon {` | → typed props | icon ~size ~foreground — ls-info-icon settings_controls.ml:15 |
| `2738–2741` | `.ls-info-icon svg.info {` | KEEP (hook) | svg fill internal |
| `2743–2747` | `.shui-shortcut-wrap {` | → typed props | row ~cross ~gap — shui-shortcut-wrap ui_components shortcut recipe |
| `2749–2752` | `.ctls {` | → typed props | column ~gap — .ctls dup |
| `2754–2759` | `.ls-ver-wrap {` | → typed props | row ~cross ~gap — ls-ver-wrap settings_page |
| `2761–2763` | `.ls-ver-text {` | → typed props | ~font_size ~foreground — ls-ver-text |
| `2765–2770` | `.fade-link {` | → typed props | link ~foreground ~font_size — fade-link settings_page.ml:56 |
| `2772–2774` | `.fade-link:hover {` | → typed props | HoverOpacity — same |
| `2776–2779` | `.ls-select-md {` | → typed props | select ~width ~font_size — ls-select-md settings_page.ml:73 |
| `2781–2784` | `.ls-select-wrap {` | → typed props | box ~width — ls-select-wrap settings_view.ml:140 |
| `2786–2790` | `.ls-toolbar-gap {` | → typed props | spacer ~width — ls-toolbar-gap settings_page.ml:385 |
| `2806–2810` | `.ls-plain-list {` | → typed props | column ~gap — ls-plain-list settings_page.ml:508; list-style residual (no list-style prop) |
| `2812–2815` | `.ls-row {` | → typed props | row ~cross ~gap — ls-row settings_page.ml:459 |
| `2817–2820` | `.ls-row-gap {` | → typed props | row ~gap — ls-row-gap |
| `2822–2824` | `.ls-kbd-label {` | → typed props | ~font_size ~foreground ~padding ~corner_radius ~background — ls-kbd-label settings_page.ml:467 |
| `2830–2834` | `.ls-desc {` | → typed props | ~font_size ~foreground — ls-desc settings_url_view.ml:81 |
| `2836–2838` | `.ls-dc {` | → typed props | box ~width ~height — ls-dc settings_page.ml:403 |
| `2840–2842` | `.ls-mb {` | KEEP (hook) | margin-bottom only — no margin prop; needs parent gap or padding |
| `2852–2862` | `.ui__switch {` | → typed props | switch ~width ~height ~corner_radius ~background — ui__switch settings_controls.ml:89 |
| `2864–2866` | `.ui__switch > .lui-control-label:empty {` | KEEP (hook) | lui-control-label:empty kind internal |
| `2868–2876` | `.ui__switch > .lui-switch-control {` | KEEP (hook) | lui-switch-control kind internal |
| `2878–2880` | `.ui__switch > .lui-switch-control:checked {` | KEEP (hook) | :checked pseudo on internal control |
| `2882–2891` | `.ui__switch > .lui-switch-control::after {` | KEEP (hook) | ::after pseudo-element thumb |
| `2893–2895` | `.ui__switch > .lui-switch-control:checked::after {` | KEEP (hook) | :checked::after |
| `2900–2907` | `.ui__checkbox {` | → typed props | checkbox ~width ~height ~corner_radius ~border ~background — ui__checkbox settings_controls.ml:100 |
| `2909–2911` | `.ui__checkbox > .lui-checkbox-control {` | KEEP (hook) | lui-checkbox-control internal |
| `2913–2915` | `.ui__checkbox[data-checked] {` | → typed props | checked bg via signal — or SelectedBackground on checkbox |
| `2966–2971` | `.ls-font-btn {` | → typed props | button ~padding ~font_size ~border — ls-font-btn settings_page.ml:109 |
| `2973–2975` | `.ls-font-btn.ls-active {` | → typed props | active border via signal — ls-font-btn.ls-active |
| `2977–2981` | `.ls-font {` | → typed props | column ~gap — ls-font settings_page.ml:114 |
| `2983–2987` | `.ls-font-sample {` | → typed props | ~font_size ~font_family? — ls-font-sample settings_page.ml:115; font-family residual |
| `2989–2992` | `.ls-font-name {` | → typed props | ~font_size ~foreground — ls-font-name |
| `2994–2996` | `.ls-font-global {` | → typed props | row ~cross ~gap — ls-font-global |
| `3015–3020` | `.cp__accent-colors-list-wrap {` | → typed props | grid ~gap ~grid_columns — cp__accent-colors-list-wrap settings_page.ml:195 |
| `3022–3026` | `.cp__accent-colors-list-wrap.as-modal-picker {` | → typed props | ~width — as-modal-picker |
| `3030–3033` | `.ui__switch.ls-switch-lg {` | → typed props | switch ~width ~height — ui__switch.ls-switch-lg |
| `3151–3154` | `.cp__settings-sync-server-cnt .ls-form-actions,.cp__settings-publish-server-cnt .ls-form-act…` | → typed props | ~main:`end — scoped form-actions |
| `3277–3279` | `.ls-pad {` | → typed props | ~padding — ls-pad settings_url_view.ml:79 |
| `3281–3283` | `.ls-mb-sm {` | KEEP (hook) | margin-bottom only — ls-mb-sm |
| `3285–3287` | `.ls-strong {` | → typed props | ~font_weight — ls-strong |
| `3297–3299` | `.export h1.title.ls-mb {` | KEEP (hook) | margin only — export h1.title.ls-mb |
| `4233–4236` | `.ls-select-lg {` | → typed props | select ~width ~font_size — ls-select-lg settings_page.ml |
| `4238–4242` | `.ls-settings-col {` | → typed props | column ~gap — ls-settings-col |
| `4244–4248` | `.cp__settings {` | → typed props | column ~gap — cp__settings settings_view.ml:166 |

_settings: 65 typed-props · 1 recipe · 18 keep-hook · 0 token · 1 dead_

### Sidebar — 19 rules

| Lines | Selector | Verdict | Destination / hook reason |
|---|---|---|---|
| `2502–2509` | `.ui__dropdown-menu-content.repos-list {` | → typed props | column ~gap ~padding — repos-list left_sidebar_view.ml:274 |
| `2511–2516` | `.repos-list .repos-hd {` | → typed props | ~font_size ~font_weight ~padding — repos-hd |
| `2518–2520` | `.repos-list .repos-h4 {` | → typed props | ~font_size ~font_weight — repos-h4 |
| `2522–2527` | `.repos-list .cp__repos-list-wrap {` | → typed props | column ~gap — cp__repos-list-wrap left_sidebar_view.ml:283 |
| `2529–2535` | `.repos-list .cp__repos-quick-actions {` | → typed props | row ~gap — cp__repos-quick-actions left_sidebar_view.ml:286 |
| `2537–2539` | `.repos-list .no-repos .cp__repos-list-wrap {` | → typed props | ~font_size ~foreground ~padding — no-repos left_sidebar_view.ml:276 |
| `2541–2544` | `.repos-list .no-repos .cp__repos-quick-actions {` | → typed props | ~padding — no-repos quick-actions scoped |
| `2548–2560` | `.repos-qa-btn {` | → typed props | button ~justify ~font_size — repos-qa-btn left_sidebar_view.ml:267 |
| `2562–2565` | `.repos-qa-btn:hover {` | → typed props | HoverBackground — same |
| `2671–2673` | `.cp__rtc-sync-indicator .ui__button.cloud {` | → typed props | ~position ~inset — .cloud rtc indicator chrome.ml |
| `2675–2686` | `.cp__rtc-sync-indicator .ui__button.cloud.on::after {` | KEEP (hook) | ::after pseudo-element dot — .cloud.on |
| `2688–2690` | `.cp__rtc-sync-indicator .ui__button.cloud.on.idle::after {` | KEEP (hook) | ::after — .cloud.on.idle |
| `4188–4195` | `.cp__sidebar-help-menu-popup .it {` | → typed props | row ~gap — .it items ui_components.ml:556 / chrome.ml:970 |
| `4197–4199` | `.cp__sidebar-help-menu-popup .it:hover {` | → typed props | HoverBackground — same |
| `4201–4206` | `.ls-hm-icon {` | → typed props | icon box ~width ~height — ls-hm-icon chrome.ml:971 |
| `4208–4210` | `.ls-hm-title {` | → typed props | ~font_size ~font_weight — ls-hm-title chrome.ml:973 |
| `4212–4216` | `.ls-hm-hr {` | → typed props | divider ~height ~background — ls-hm-hr; margin residual |
| `4218–4224` | `.cp__sidebar-help-menu-popup .ft {` | → typed props | row ~main ~gap — .ft icon_picker.ml:422 |
| `4226–4229` | `.ls-hm-meta {` | → typed props | ~font_size ~opacity — ls-hm-meta |

_sidebar: 17 typed-props · 0 recipe · 2 keep-hook · 0 token · 0 dead_

### Editor surface (views, pickers, properties, table) — 210 rules

| Lines | Selector | Verdict | Destination / hook reason |
|---|---|---|---|
| `98–101` | `.icon-cp-container {` | → typed props | row ~cross:`center — emitter cmdk_view.ml:445 |
| `188–192` | `.ui__popover-content[data-editor-popup-ref],.ui__dropdown-menu-content[data-editor-popup-ref] {` | → typed props | ~padding ~width on ac-c box — popups_view.ml:399 |
| `194–199` | `.ui__popover-content[data-editor-popup-ref="page-search"],.ui__popover-content[data-editor-p…` | → typed props | ~width per popup kind on same box — popups_view.ml:399/419 |
| `201–203` | `.ui__popover-content[data-editor-popup-ref="datepicker"] {` | → typed props | same |
| `205–211` | `.ui__popover-content[data-editor-popup-ref="commands"] #ui__ac-inner,.ui__popover-content[da…` | → typed props | ~max_height on ac-inner scroll — popups_view.ml:325 |
| `213–216` | `.ui__popover-content[data-editor-popup-ref="commands"][data-side="top"] #ui__ac-inner {` | → typed props | same (top-side clamp) |
| `218–221` | `.ui__popover-content[data-editor-popup-ref][data-side="top"] {` | → typed props | flip offset → fold into ~at y computation — popups_view.ml:367-391 |
| `389–400` | `.ls-context-menu-content .menu-links-wrapper,.ui__dropdown-menu-content .menu-links-wrapper,…` | DEAD | same dead selector, scoped variants |
| `433–437` | `.ls-ac-node {` | → typed props | column ~min_width — popups_view.ml:132 |
| `439–444` | `.ls-ac-node-row {` | → typed props | row ~cross ~min_width — popups_view.ml:148 |
| `446–453` | `.ls-ac-node-icon {` | → typed props | box ~height ~opacity ~flex_shrink — popups_view.ml:106; margin-right→gap |
| `455–461` | `.ls-ac-bc {` | → typed props | ~font_size ~opacity ~min_width — popups_view.ml:139 |
| `463–468` | `.ls-ac-ic {` | → typed props | row ~gap ~min_width — popups_view.ml:166 |
| `491–496` | `#ui__ac-inner {` | → typed props | scroll kind ~max_height/overflow native — popups_view.ml:325; residual -webkit-overflow-scrolling/position |
| `498–500` | `#ui__ac-inner .menu-link {` | → typed props | ~corner_radius on ac anchor — popups_view.ml:190 |
| `502–506` | `#ui__ac-inner .menu-link-wrap > a,.menu-link-wrap > a.menu-link {` | → typed props | ~display/~main alignment on anchor el — popups_view.ml:190 |
| `513–518` | `#ui__ac-inner .menu-link:hover,#ui__ac-inner .menu-link.chosen,#ui__ac-inner .menu-link[data…` | → typed props | SelectedBackground/HoverBackground via class_signal — popups_view.ml:192-197 |
| `520–525` | `.ui__ac-group-name {` | → typed props | ~padding ~font_size ~font_weight ~foreground — popups_view.ml:337 |
| `527–531` | `.ls-ac-empty {` | → typed props | ~padding ~font_size ~foreground — popups_view.ml:237 |
| `540–543` | `.cp__commands-slash .ui__icon.ls-icon-queryCode {` | KEEP (hook) | dynamic-prefix icon nudge (ls-icon-queryCode) — one-off offset |
| `565–568` | `.ls-preview-popup {` | → typed props | ~padding — popups_view.ml:851 |
| `570–573` | `.ls-preview-popup .tippy-wrapper {` | → typed props | ~min_width ~padding — popups_view.ml:855 |
| `575–583` | `.ls-preview-popup .tippy-wrapper.as-page {` | → typed props | ~padding ~font_weight — popups_view.ml:855 |
| `585–587` | `.ls-preview-popup .ls-page-blocks {` | → typed props | margin-top → parent ~gap — popups_view.ml:881 |
| `1185–1188` | `.ls-icon-sm {` | DEAD | .ls-icon-sm not emitted — dead |
| `1377–1384` | `.lui-toast-viewport {` | KEEP (hook) | toast viewport — runtime shell (LUI toast kind positions it) |
| `1387–1390` | `.lui-toast-viewport {` | KEEP (hook) | @media toast viewport |
| `1407–1412` | `.ui__calendar {` | → typed props | ~font_size ~width ~gap on ui__calendar — editor_commands.ml |
| `1414–1418` | `.ls-property-date-picker,.ls-editor-date-picker {` | → typed props | ~padding — ls-property/ls-editor-date-picker editor_commands.ml:818 |
| `1420–1424` | `.ls-property-date-picker .ui__calendar,.ls-editor-date-picker .ui__calendar {` | → typed props | ~width — calendar inside picker |
| `1426–1430` | `.ui__calendar-cell {` | → typed props | cell ~padding ~font_size — ui__calendar-cell |
| `1432–1444` | `.ui__calendar-day {` | → typed props | ~font_size ~line_height ~foreground ~border_radius on day cell — ui__calendar-day (editor_commands.ml:269) |
| `1446–1448` | `.ui__calendar-day:hover {` | → typed props | HoverBackground — same |
| `1450–1454` | `.ui__calendar-day[data-selected],.ui__calendar-day.selected {` | → typed props | SelectedBackground/Foreground via selected signal — same |
| `1456–1459` | `.ui__calendar-day[data-today]:not([data-selected]) {` | → typed props | today bg via signal on selected state — same emitter |
| `1461–1470` | `.ls-editor-date-picker {` | → typed props | column ~gap ~padding ~corner_radius ~background ~border — ls-editor-date-picker editor_commands.ml:818 |
| `1472–1475` | `.ls-editor-date-picker .ui__calendar {` | → typed props | ~width — cal inside editor picker |
| `1477–1482` | `.ls-editor-date-picker .ls-cal-head {` | → typed props | row ~main ~cross — ls-cal-head inside picker |
| `1484–1488` | `.ls-editor-date-picker .ls-cal-selects {` | → typed props | row ~gap — ls-cal-selects inside picker |
| `1490–1506` | `.ls-editor-date-picker .ls-date-month-select {` | → typed props | select ~font_size ~padding ~background ~border ~corner_radius ~cursor — ls-date-month-select inside picker |
| `1508–1517` | `.ls-editor-date-picker .ls-date-year-input {` | → typed props | input ~width ~font_size ~padding — ls-date-year-input inside picker |
| `1519–1523` | `.ls-editor-date-picker .ls-cal-nav {` | → typed props | row ~gap — ls-cal-nav |
| `1525–1536` | `.ls-editor-date-picker .ls-cal-nav-btn {` | → typed props | button ~width ~height ~font_size ~cursor ~corner_radius — ls-cal-nav-btn |
| `1538–1540` | `.ls-editor-date-picker .ls-cal-nav-btn:hover {` | → typed props | HoverBackground — same |
| `1542–1546` | `.ls-editor-date-picker table[role="grid"] {` | → typed props | ~width + border-collapse/table-layout residual — ui__calendar grid |
| `1548–1554` | `.ls-editor-date-picker td[role="gridcell"],.ls-editor-date-picker td.ui__calendar-cell {` | → typed props | ~padding ~height ~foreground — gridcell; text-align residual |
| `1556–1560` | `.ls-editor-date-picker .ui__calendar-day {` | → typed props | ~width ~font_size — month select |
| `1562–1565` | `.ls-editor-date-picker .ls-cal-outside {` | → typed props | ~opacity — ls-cal-outside inside picker |
| `1567–1576` | `.ls-editor-date-picker .ls-date-nlp {` | → typed props | input ~width ~font_size ~padding ~border ~corner_radius — ls-date-nlp |
| `1578–1588` | `.ls-editor-date-picker .ls-date-month-menu,.ls-repeat-choice-menu {` | → typed props | ~position ~max_height ~z_index ~corner_radius ~background ~border ~shadow — month/repeat menus |
| `1590–1595` | `.ls-editor-date-picker .ls-date-month-option {` | → typed props | ~padding ~font_size ~cursor ~corner_radius — ls-date-month-option |
| `1597–1599` | `.ls-editor-date-picker .ls-date-month-option:hover {` | → typed props | HoverBackground on month option |
| `1603–1606` | `.ls-editor-date-picker.ls-cal-prop {` | → typed props | ~width — editor_commands.ml:818 ls-cal-prop |
| `1608–1612` | `.ls-editor-date-picker .ls-property-date-picker {` | → typed props | ~gap ~padding — property date picker |
| `1614–1620` | `.ls-editor-date-picker .ls-time-picker {` | → typed props | row ~cross ~gap — ls-time-picker (editor_commands.ml:631) |
| `1622–1631` | `.ls-editor-date-picker .ls-time-input {` | → typed props | input ~width ~font_size ~padding ~foreground ~background ~border ~corner_radius — ls-time-input; color-scheme residual |
| `1633–1640` | `.ls-editor-date-picker .ls-time-now {` | → typed props | ~font_size ~foreground ~cursor — ls-time-now |
| `1642–1644` | `.ls-editor-date-picker .ls-time-now:hover {` | KEEP (hook) | hover foreground — no hover-fg prop (only HoverBackground/Opacity/Shadow) |
| `1648–1657` | `.ls-repeat-panel {` | → typed props | column ~gap ~padding ~border — ls-repeat-panel |
| `1659–1665` | `.ls-repeat-head {` | → typed props | ~font_size ~font_weight — ls-repeat-head |
| `1667–1682` | `.ls-repeat-checkbox {` | → typed props | row ~cross ~gap — ls-repeat-checkbox |
| `1684–1688` | `.ls-repeat-checkbox[data-checked] {` | → typed props | checked bg via signal — ls-repeat-choice |
| `1690–1695` | `.ls-repeat-frequency {` | → typed props | row ~cross ~gap — ls-repeat-frequency |
| `1697–1700` | `.ls-repeat-label {` | → typed props | ~font_size ~foreground — ls-repeat-label |
| `1702–1712` | `.ls-repeat-frequency-input {` | → typed props | input ~width ~font_size ~padding ~background ~border ~corner_radius — ls-repeat-frequency-input |
| `1714–1732` | `.ls-repeat-select {` | → typed props | select ~font_size ~padding ~background ~border ~corner_radius ~cursor — ls-repeat-select (editor_commands.ml:552) |
| `1734–1736` | `.ls-repeat-select:hover {` | → typed props | HoverBackground — same |
| `1738–1743` | `.ls-repeat-next,.ls-repeat-when {` | → typed props | ~font_size ~opacity — ls-repeat-next/when |
| `1745–1747` | `.ls-repeat-when .ls-repeat-select {` | → typed props | ~max_width on select inside when-row |
| `1749–1753` | `.ls-repeat-is {` | → typed props | ~font_size ~opacity — ls-repeat-is |
| `1755–1757` | `.ls-repeat-choice-menu .ls-date-month-option {` | → typed props | ~white_space — month option |
| `1761–1764` | `.ls-property-dropdown {` | → typed props | ~gap ~padding — ls-property-dropdown (properties_menu.ml:30) |
| `1766–1768` | `.ls-property-dropdown [role="separator"] {` | → typed props | separator margin → parent ~gap |
| `1788–1792` | `.ls-property-choices-sub-pane .choices-list {` | DEAD | .choices-list under ls-property-choices-sub-pane — not emitted |
| `1794–1798` | `.ls-property-type-sub-pane,.ls-property-ui-position-sub-pane,.ls-property-default-value-pane {` | DEAD | .ls-property-*-sub-pane classes not emitted — dead |
| `1810–1812` | `.jtrigger {` | → typed props | ~cursor — properties_area.ml:77 jtrigger |
| `1814–1818` | `.ls-property-dialog {` | → typed props | dialog ~padding ~width — ls-property-dialog |
| `1820–1826` | `.ls-property-input {` | DEAD | .ls-property-input not emitted |
| `1831–1835` | `.ls-property-date-picker {` | → typed props | ~padding — ls-property-date-picker dup of 1608 |
| `1837–1842` | `.ls-datetime {` | → typed props | ~font_size ~foreground ~cursor — properties_value.ml:543 ls-datetime |
| `1844–1846` | `.property-select {` | DEAD | .property-select not emitted |
| `1849–1852` | `.ls-icon-color-wrap {` | → typed props | box ~width ~height ~corner_radius ~background — views_head.ml:142 ls-icon-color-wrap |
| `1854–1857` | `.ls-icon-color-wrap em-emoji {` | KEEP (hook) | em-emoji extension element inside wrap |
| `2048–2053` | `.panel-wrap .ls-date-format {` | KEEP (hook) | background-image + background-repeat — no bg-image prop (ls-date-format) |
| `2059–2063` | `.cp__settings-app-updater {` | → typed props | row ~cross ~gap — cp__settings-app-updater settings_page.ml:48 |
| `2065–2069` | `.cp__settings-app-updater .ctls {` | → typed props | column ~gap — .ctls settings_page.ml:50 |
| `2157–2164` | `.shortcut-pills-row .icon-link,.shortcut-pills-row .lui-button.icon-link {` | → typed props | link ~foreground ~font_size — icon-link settings_page.ml:386 |
| `2166–2168` | `.shortcut-filter-pills {` | KEEP (hook) | flex-wrap only — shortcut-filter-pills |
| `2348–2356` | `.cp__emoji-icon-picker {` | → typed props | column ~gap ~padding ~width — cp__emoji-icon-picker icon_picker.ml |
| `2358–2366` | `.cp__emoji-icon-picker > .hd {` | → typed props | ~position ~width ~inset — .hd header |
| `2368–2372` | `.cp__emoji-icon-picker > .bd {` | → typed props | column ~gap — .bd body pane |
| `2374–2376` | `.cp__emoji-icon-picker > .bd.all {` | → typed props | ~padding — .bd.all |
| `2378–2392` | `.cp__emoji-icon-picker > .ft {` | → typed props | row ~cross ~gap ~padding — .ft icon_picker.ml:422 |
| `2394–2399` | `.cp__emoji-icon-picker .pane-section {` | → typed props | column ~gap — .pane-section |
| `2401–2407` | `.cp__emoji-icon-picker .pane-section > .its,.cp__emoji-icon-picker .pane-section .icons-row {` | → typed props | grid/row ~gap — .pane-section>.its |
| `2409–2421` | `.cp__emoji-icon-picker .pane-section > .its > button,.cp__emoji-icon-picker .pane-section .i…` | → typed props | button ~width ~height ~font_size ~corner_radius — .its>button items |
| `2423–2426` | `.cp__emoji-icon-picker .pane-section > .its > button:hover,.cp__emoji-icon-picker .pane-sect…` | → typed props | HoverBackground — same |
| `2428–2432` | `.cp__emoji-icon-picker .hd strong {` | → typed props | ~font_size ~font_weight — .hd strong |
| `2434–2436` | `.dark .cp__emoji-icon-picker .hd strong {` | KEEP (hook) | .dark scoped override — stays in theme |
| `2438–2440` | `.ui__dropdown-menu-content .cp__emoji-icon-picker {` | → typed props | ~padding — picker inside dropdown-menu |
| `2468–2473` | `.views {` | → typed props | row ~cross ~gap — .views views_head.ml |
| `2475–2484` | `.views button {` | → typed props | button ~padding ~font_size ~cursor ~opacity — .views button |
| `2486–2492` | `.ls-view-filter-value-item {` | → typed props | row ~cross ~gap ~padding — ls-view-filter-value-item views_head.ml:732 |
| `2497–2499` | `.ls-dots-menu {` | → typed props | icon button ~width ~height — ls-dots-menu page_menu.ml:284 |
| `2708–2719` | `.ui__popover-content .breadcrumb.block-parents,.breadcrumb.breadcrumb--search-result {` | → typed props | ~font_size ~gap — breadcrumb.block-parents page.ml:580 / popups breadcrumb |
| `2792–2800` | `.icon-link {` | → typed props | link ~foreground — icon-link settings_page.ml:386 |
| `2802–2804` | `.icon-link:hover {` | → typed props | HoverOpacity — same |
| `3035–3046` | `.ui__button.ls-icon-btn-md {` | → recipe | icon-button recipe — ls-icon-btn-md plugins_view.ml:69 |
| `3075–3077` | `.cp__plugins-item-card .l.link-block {` | → typed props | ~cursor — link-block |
| `3407–3414` | `.ui__dropdown-menu-item.del,.property-key {` | → typed props | ~foreground — .del/.property-key properties_area.ml:121 |
| `3416–3418` | `.ls-icon-dim {` | DEAD | .ls-icon-dim not emitted |
| `3420–3423` | `.property-select {` | DEAD | .property-select not emitted |
| `3425–3429` | `.ls-property-date-picker {` | → typed props | ~padding — ls-property-date-picker dup |
| `3432–3437` | `.ls-emoji-preview {` | → typed props | ~width ~height — ls-emoji-preview icon_picker.ml:197 |
| `3439–3443` | `.ls-emoji-cell {` | → typed props | ~width ~height ~font_size — ls-emoji-cell icon_picker.ml:201 |
| `3445–3449` | `.ls-ep-section-title {` | → typed props | ~font_size ~font_weight ~foreground — ls-ep-section-title icon_picker.ml:230 |
| `3451–3453` | `.dark .ls-ep-section-title {` | KEEP (hook) | .dark theme-scoped override |
| `3455–3460` | `.ls-ep-col {` | → typed props | column ~gap — ls-ep-col |
| `3462–3468` | `.ls-ep-tabs {` | → typed props | row ~gap — ls-ep-tabs |
| `3470–3473` | `.ls-icon-mini {` | KEEP (hook) | transform scale — ls-icon-mini |
| `3476–3484` | `.ls-icon-btn {` | → recipe | icon-button recipe — ls-icon-btn (views_head, cards_view, plugins…) |
| `3486–3489` | `.ls-icon-color-wrap {` | → typed props | dup ls-icon-color-wrap — views_head.ml:142 |
| `3499–3507` | `.ls-view-tab {` | → typed props | ~padding ~font_size ~corner_radius ~cursor — ls-view-tab views_head.ml:91 |
| `3515–3518` | `.view-actions,.ls-add-view {` | KEEP (hook) | transition only — view-actions/ls-add-view fade (opacity driven by signal) |
| `3520–3527` | `.ls-view-order-setting {` | → typed props | column ~gap ~padding — ls-view-order-setting views_head.ml:241 |
| `3542–3547` | `.ls-sort-right {` | → typed props | row ~cross ~gap — ls-sort-right |
| `3549–3562` | `.ls-sort-order {` | → typed props | ~font_size ~foreground ~padding — ls-sort-order |
| `3564–3569` | `.ls-sort-order svg,.ls-sort-order .ls-icon-sm {` | KEEP (hook) | svg size internal + dead .ls-icon-sm |
| `3571–3574` | `.ls-sort-order .ti {` | KEEP (hook) | .ti icon-font internal span |
| `3576–3587` | `.ls-sort-x {` | → typed props | button ~width ~height ~opacity ~cursor — ls-sort-x |
| `3589–3591` | `.ls-sort-x:hover {` | → typed props | HoverOpacity — same |
| `3593–3596` | `.ls-sort-x svg {` | KEEP (hook) | svg internal |
| `3599–3612` | `.ls-sort-delete {` | → typed props | button ~width ~height ~opacity — ls-sort-delete |
| `3614–3616` | `.ls-sort-delete:hover {` | → typed props | HoverOpacity |
| `3618–3621` | `.ls-sort-delete svg {` | KEEP (hook) | svg internal |
| `3627–3632` | `.ls-vf-col {` | → typed props | column ~gap — ls-vf-col |
| `3634–3644` | `.ls-op-btn {` | → typed props | ~padding ~font_size ~corner_radius ~background ~cursor — ls-op-btn views_head.ml:358 |
| `3646–3650` | `.ls-op-label {` | → typed props | ~font_size ~opacity — ls-op-label views_head.ml:366 |
| `3652–3654` | `.ls-op-label:hover {` | → typed props | HoverOpacity — same |
| `3656–3664` | `.ls-vf-chip {` | → typed props | row ~cross ~gap ~padding ~corner_radius ~background — ls-vf-chip views_head.ml:732 area |
| `3666–3676` | `.ls-vf-chip-prop,.ls-vf-chip-op,.ls-vf-chip-val,.ls-vf-chip-x {` | → typed props | ~font_size ~font_weight — ls-vf-chip-* |
| `3678–3682` | `.ls-vf-chip-prop,.ls-vf-chip-op {` | → typed props | ~padding ~border_right via border — chip prop |
| `3684–3686` | `.ls-vf-chip-prop {` | → typed props | ~opacity — chip dim |
| `3688–3694` | `.ls-vf-chip-val {` | → typed props | ~font_size — chip-val |
| `3696–3699` | `.ls-vf-chip-x {` | → typed props | button ~opacity ~cursor — chip-x |
| `3701–3711` | `.filters-row {` | → typed props | row ~cross ~gap — filters-row views_head.ml:762; flex-wrap residual |
| `3713–3721` | `.ls-vf-chips {` | → typed props | row ~gap — ls-vf-chips |
| `3723–3731` | `.ls-vf-logic {` | → typed props | button ~padding ~font_size ~cursor — ls-vf-logic |
| `3733–3735` | `.ls-vf-logic:hover {` | → typed props | HoverBackground — same |
| `3741–3747` | `.page-inner > .page-tabs,.page-tabs > .w-full,.ui__tabs-content,.ui__tabs-content > .ml-1,.l…` | → typed props | ~min_width — page-inner>.page-tabs/.ls-view-body views_table/right_sidebar |
| `3750–3752` | `.ls-view-body {` | → typed props | ~min_height — ls-view-body views_table.ml:1400 |
| `3755–3757` | `.page-inner > .ls-page-blocks {` | KEEP (hook) | margin-top only — page-inner>.ls-page-blocks |
| `3763–3775` | `.ls-table-header {` | → typed props | row ~cross ~padding — ls-table-header views_table.ml:689; will-change residual |
| `3784–3791` | `.ls-table-header-cell {` | → typed props | ~font_size ~font_weight ~padding ~text_align — ls-table-header-cell; vertical-align residual |
| `3795–3798` | `.ls-table-header-cell > .ui__button {` | → typed props | button ~font_size — header cell button |
| `3802–3813` | `.ls-table-resize-handle {` | → typed props | ~position ~inset ~width ~cursor — ls-table-resize-handle views_table.ml:718; transition residual |
| `3815–3817` | `.ls-table-resize-handle:hover {` | → typed props | HoverOpacity — same |
| `3819–3821` | `.ls-table-resize-handle:active {` | → typed props | PressedOpacity — same |
| `3825–3847` | `.ls-table-row.ls-block {` | → typed props | row ~cross ~padding ~border — ls-table-row.ls-block; box-sizing/transition residual |
| `3849–3853` | `.ls-table-row div,.ls-table-row span,.ls-table-row a {` | KEEP (hook) | descendant div/span/a sweep inside table row |
| `3855–3859` | `.ls-table-row .table-block-title,.ls-table-row .block-head-wrap a {` | → typed props | ~text_overflow — table-block-title |
| `3862–3868` | `.ls-table-rows div[data-index],.ls-table-rows div[data-item-index] {` | KEEP (hook) | div[data-index] — virtual-list runtime attr |
| `3870–3875` | `.ls-table-footer {` | → typed props | row ~cross ~padding — ls-table-footer |
| `3877–3880` | `.ls-table-rows div[data-viewport-type='window'] {` | KEEP (hook) | data-viewport-type=window runtime marker |
| `3885–3889` | `.ls-table-cell {` | → typed props | ~padding ~font_size ~min_width — ls-table-cell views_table.ml:503 |
| `3891–3894` | `.ls-table-rows .ls-table-cell {` | → typed props | ~min_width — ls-table-rows cell |
| `3896–3900` | `.ls-table-cell > div {` | → typed props | ~display ~align — cell > div (emitted box) |
| `3905–3909` | `.ls-table-row [data-table-row-select] .lui-checkbox,.ls-table-header-cell .lui-checkbox {` | KEEP (hook) | :has() + checkbox state — reveal checkbox cross-node |
| `3911–3916` | `.ls-table-row [data-table-row-select]:hover .lui-checkbox,.ls-table-row [data-table-row-sele…` | KEEP (hook) | same |
| `3920–3923` | `.ls-table-row .ls-title-ghosts {` | → typed props | ~opacity — ls-title-ghosts; transition residual |
| `3928–3931` | `.ls-table-row .table-block-title:hover .ls-title-ghosts,.ls-table-row .ls-title-ghosts:hover {` | KEEP (hook) | cross-node :hover ghosts |
| `3936–3938` | `.ls-table-row.ls-block.selected {` | → typed props | SelectedBackground — .selected row views_table |
| `3942–3944` | `.ls-table-rows > .relative {` | KEEP (hook) | >.relative utility class — virtual-list inner wrapper |
| `3948–3956` | `.ls-table-rows .ls-table-row,.ls-table-rows .ls-table-row .lui-text,.ls-table-rows .ls-table…` | → typed props | ~font_size — cell text sweep |
| `3958–3963` | `.ls-table-header-cell,.ls-table-header-cell > .ui__button,.ls-table-header-cell .lui-text {` | → typed props | ~font_size ~font_weight — header-cell fonts |
| `3967–3969` | `.ls-foldable-title-control {` | KEEP (hook) | margin-left only — ls-foldable-title-control |
| `3976–3980` | `.ls-foldable-content {` | KEEP (hook) | grid-template-rows fold animation — ls-foldable-content views_table.ml:1235 |
| `3982–3986` | `.ls-foldable-content .ls-foldable-content-inner {` | KEEP (hook) | inner opacity part of fold transition |
| `3988–3990` | `.ls-foldable-content.is-collapsed {` | KEEP (hook) | is-collapsed state class — fold animation |
| `3992–3995` | `.ls-foldable-content.is-collapsed .ls-foldable-content-inner {` | KEEP (hook) | same |
| `3999–4011` | `.ls-view-head {` | → typed props | row ~cross ~main ~padding — ls-view-head views_head.ml |
| `4013–4018` | `.ls-view-head-left {` | → typed props | row ~cross ~gap — ls-view-head-left |
| `4030–4032` | `.ls-foldable-title:hover .ls-foldable-title-control .control-hide {` | KEEP (hook) | cross-node :hover .control-hide reveal |
| `4036–4039` | `.ls-filters {` | → typed props | column ~gap ~padding — ls-filters views_head.ml:929 |
| `4041–4046` | `.ls-filters-header {` | → typed props | row ~cross ~gap — ls-filters-header |
| `4048–4058` | `.ls-filters-icon {` | → typed props | icon ~size ~opacity — ls-filters-icon |
| `4060–4065` | `.ls-filters-title {` | → typed props | ~font_size ~font_weight — ls-filters-title |
| `4067–4069` | `.ls-filters .cp__filters {` | KEEP (hook) | margin only — cp__filters views_head.ml:940 |
| `4071–4073` | `.ls-filters .cp__filters:empty {` | KEEP (hook) | :empty pseudo — filters container |
| `4075–4079` | `.ls-filters-label {` | → typed props | ~font_size ~opacity — ls-filters-label views_head.ml:885; margin residual |
| `4081–4088` | `.cp__filters-input-panel {` | → typed props | row ~cross ~gap ~padding ~border — cp__filters-input-panel |
| `4090–4092` | `.cp__filters-input-panel:focus-within {` | KEEP (hook) | :focus-within pseudo on panel |
| `4094–4100` | `.cp__filters-input {` | → typed props | input ~font_size ~foreground ~background — cp__filters-input |
| `4102–4104` | `.ls-filters-refs {` | KEEP (hook) | margin-top only — ls-filters-refs |
| `4106–4108` | `.ls-filters-refs:empty {` | KEEP (hook) | :empty — same |
| `4341–4343` | `.link-block {` | → typed props | ~cursor — link-block dup |
| `4347–4350` | `.property-value-inner {` | → typed props | ~font_size — property-value-inner properties_value |
| `4352–4356` | `.editor-wrapper {` | → typed props | ~height ~width — editor-wrapper |
| `4358–4361` | `.editor-inner {` | → typed props | ~height ~width ~padding — editor-inner |
| `4363–4366` | `.jtrigger {` | → typed props | ~cursor — jtrigger dup |
| `4368–4373` | `.ls-datetime {` | → typed props | ~font_size ~foreground ~cursor — ls-datetime dup |
| `4375–4381` | `.ls-block-right {` | → typed props | row ~main ~gap — ls-block-right |
| `4383–4385` | `.property-block-container {` | → typed props | column ~gap — property-block-container |
| `4391–4395` | `.ls-ep-btn {` | → typed props | button ~size ~variant — ls-ep-btn icon_picker.ml:35/293 |
| `4441–4441` | `.ls-property-select-compact {` | → typed props | ~width — ls-property-select-compact properties_select.ml:157 |
| `4442–4451` | `.ls-property-select-input,.ls-property-select-input:focus {` | → typed props | input ~padding ~font_size ~background — ls-property-select-input properties_select.ml:161; outline/box-shadow→FocusShadow residual |
| `4452–4452` | `.ls-property-select-compact .lui-list-item {` | → typed props | ~font_size — lui-list-item |
| `4455–4455` | `.ls-property-select-popup {` | → typed props | ~padding ~min_width ~max_height — ls-property-select-popup properties_value.ml:797 |
| `4457–4461` | `.ls-property-select-compact .lui-list-item[data-selected],.ls-property-select-compact .lui-l…` | → typed props | SelectedBackground + HoverBackground — items in select popup |
| `4463–4466` | `.ls-property-select-input::placeholder {` | KEEP (hook) | ::placeholder pseudo-element |

_editor: 165 typed-props · 2 recipe · 35 keep-hook · 0 token · 8 dead_

### Dialogs & imperative overlay — 172 rules

| Lines | Selector | Verdict | Destination / hook reason |
|---|---|---|---|
| `76–79` | `.lui-popover.ls-dialog-layer[data-starting-style] {` | KEEP (hook) | same — ls-dialog-layer override on runtime attrs |
| `81–83` | `.lui-popover.ls-dialog-layer[data-ending-style] {` | KEEP (hook) | same |
| `334–337` | `.ls-dialog-head {` | → typed props | row ~cross:`center — views_popup.ml:522 |
| `339–348` | `.ls-dialog-head-icon {` | → typed props | box ~width ~height ~corner_radius ~background — views_popup.ml:523 |
| `350–353` | `.ls-dialog-error {` | → typed props | ~foreground ~font_size — views_popup.ml:524 |
| `355–357` | `.ls-dialog-head-text {` | → typed props | margin-left → parent ~gap — views_popup.ml:526 |
| `359–364` | `.ls-dialog-headline {` | → typed props | heading ~font_size ~font_weight ~line_height — views_popup.ml:528 |
| `366–371` | `.ls-dialog-footer {` | → typed props | row ~main:`end ~gap ~padding — views_popup.ml:533 |
| `637–645` | `.ls-cm-swatch,.ls-cm-heading-btn {` | → recipe | color_swatch recipe already exists — ui_components.ml:684 |
| `727–729` | `.cp__select-main .input-wrap {` | → typed props | row ~cross — input wrap |
| `731–738` | `.cp__select-input {` | → typed props | input ~font_size ~padding ~foreground — cp__select input emitter |
| `740–742` | `.cp__select-input:focus {` | → typed props | ~focus_shadow/FocusShadow on input |
| `746–749` | `.ui__dropdown-menu-content .cp__select-input {` | → typed props | same input inside dropdown — dedupe with 731 |
| `820–833` | `.ui__dialog-overlay {` | KEEP (hook) | imperative DOM — .ui__dialog-overlay only emitted by pdf_toolbar.ml:889 modal |
| `835–842` | `.ui__alert-dialog-overlay {` | → typed props | confirm overlay ~justify/`center ~inset — dialogs_view.ml:92; residual backdrop-filter + animation |
| `844–873` | `.ui__dialog-content {` | KEEP (hook) | pdf imperative DOM content (30L block) — pdf_toolbar.ml:889 |
| `876–878` | `.ui__dialog-content {` | KEEP (hook) | @media max-width:640px dialog padding |
| `881–902` | `.ui__alert-dialog-content {` | → typed props | alert-dialog ~max_width ~width ~gap ~padding ~corner_radius — dialogs_view.ml:94; residual animation |
| `904–909` | `.ui__alert-dialog-header {` | → typed props | column ~gap — dialogs_view.ml:109 |
| `911–915` | `.ui__alert-dialog-title {` | → typed props | heading ~font_size ~font_weight ~line_height — dialogs_view.ml:111 |
| `919–921` | `.ui__alert-dialog-main-content {` | → typed props | scroll ~max_height — dialogs_view.ml:119 |
| `923–927` | `.ui__alert-dialog-main-content .ls-confirm-desc {` | → typed props | ~font_size ~foreground — dialogs_view.ml:121 |
| `929–932` | `.ui__alert-dialog-description {` | → typed props | same ~font_size ~foreground ~line_height |
| `934–939` | `.ui__alert-dialog-footer {` | → typed props | row ~main:`end ~gap — dialogs_view.ml:122 |
| `941–945` | `.ls-alert-title {` | → typed props | ~font_size ~font_weight — page_menu.ml:342 |
| `948–961` | `.ui__button.ls-btn-outline {` | → recipe | ~variant:`outline already exists on button kind — dialogs_view btn call sites; delete class+rule |
| `963–965` | `.ui__button.ls-btn-outline:hover {` | → recipe | ls-btn-outline hover → ~variant:`outline recipe HoverBackground |
| `967–980` | `.ui__button.ls-btn-primary {` | → recipe | ls-btn-primary → ~variant:`primary — call sites already pass variant; delete class+rule |
| `982–984` | `.ui__button.ls-btn-primary:hover {` | → recipe | ls-btn-primary hover → HoverBackground |
| `988–991` | `.ui__dialog-content .ui__button.ls-btn-primary,.ui__alert-dialog-content .ui__button.ls-btn-…` | → typed props | dialog-scoped primary button — same variant prop |
| `993–997` | `.ui__dialog-content .ui__button.ls-btn-primary:hover,.ui__alert-dialog-content .ui__button.l…` | → recipe | hover in dialog scope — recipe |
| `1009–1027` | `.ui__dropdown-menu-content .lui-menu-item-icon:not([data-name]),.ui__dropdown-menu-content .…` | → typed props | .ui__dialog-title ~font_size ~font_weight ~line_height — dialogs_view.ml:64; letter-spacing residual; lui-internal parts stay hook |
| `1036–1039` | `.ui__dialog-main-content {` | → typed props | scroll ~min_height — dialogs_view.ml:70; overflow native |
| `1044–1048` | `.lui-dialog {` | → typed props | dialog ~gap ~padding ~width — dialogs_view.ml:55 |
| `1051–1053` | `.lui-dialog {` | KEEP (hook) | @media 640px dialog pad/max-h |
| `1062–1064` | `.lui-dialog.ls-dialog-flashcards {` | → typed props | ls-dialog-flashcards ~padding — cards_view.ml:305 |
| `1066–1071` | `.lui-dialog.ls-dialog-flashcards .ui__dialog-main-content {` | → typed props | same — scroll pad on content |
| `1074–1077` | `.lui-dialog.ls-dialog-flashcards {` | KEEP (hook) | @media flashcards min-height |
| `1101–1104` | `.ui__dialog-content[data-base-ui-inert],.ui__alert-dialog-content[data-base-ui-inert] {` | KEEP (hook) | runtime data-base-ui-inert attr |
| `1106–1109` | `.ui__dialog-content[data-base-ui-inert] *,.ui__alert-dialog-content[data-base-ui-inert] * {` | KEEP (hook) | same |
| `1114–1118` | `.ls-dialog-export-page {` | → typed props | ls-dialog-export-page ~width/~max_width — export_view emitter |
| `1124–1124` | `.ls-dialog-export-page .export-opts {` | → typed props | export-opts margin-top → parent ~gap — export_view.ml |
| `1125–1125` | `.ls-dialog-export-page .export-btns {` | → typed props | export-btns margin-top → ~gap |
| `1130–1133` | `.ls-dialog-sync-server,.ls-dialog-publish-server {` | → typed props | ls-dialog-sync/publish-server ~max_width — settings_url_view.ml dialog |
| `1135–1138` | `.ls-dialog-plugin-readme {` | → typed props | ls-dialog-plugin-readme ~max_width — plugin_readme.ml |
| `1145–1150` | `.lui-dialog.ls-dialog-plugins {` | → typed props | plugins dialog ~padding — plugins_view.ml |
| `1153–1157` | `.cp__plugins-page.web-platform .cp__plugins-item-lists {` | → typed props | plugins item-lists ~gap — plugins_view.ml (web-platform conditional) |
| `1160–1163` | `.lui-dialog.ls-dialog-new-graph,.lui-dialog.ls-dialog-add-graph {` | → typed props | new-graph/add-graph dialogs ~width — new_graph.ml / collaborators.ml |
| `1170–1172` | `.ui__dialog-overlay[data-align="top"] .ui__dialog-content {` | KEEP (hook) | data-align on imperative overlay — pdf only |
| `1193–1202` | `.lui-button.ui__button[data-size="sm"] {` | → typed props | data-size=sm duplicate of ~size:`sm — emitters set ~size already; delete rule |
| `1205–1218` | `.ui__button.ls-btn {` | → recipe | ls-btn base → button recipe (settings_controls.ml:54 btn_base): padding/font-size/radius/cursor |
| `1220–1222` | `.ui__button.ls-btn:hover {` | → recipe | ls-btn hover → recipe HoverBackground |
| `1224–1226` | `.ui__button.ls-btn.ls-btn-primary {` | → typed props | ls-btn-primary → ~variant:`primary |
| `1229–1234` | `.ls-prompt-headline {` | → typed props | ~font_size ~font_weight ~foreground — dialogs_view.ml:147/154 |
| `1236–1241` | `.ls-prompt-input,.ls-login-input {` | → typed props | input ~width ~font_size ~padding — dialogs_view.ml:158; .ls-login-input dead part |
| `1244–1247` | `.lui-dialog.ls-dialog-login .form-input,.lui-dialog.ls-dialog-login .ui__button.as-solid {` | → typed props | login form ~width — login_view.ml |
| `1251–1257` | `.lui-dialog.ls-dialog-login {` | → typed props | login dialog ~gap — login_view.ml |
| `1259–1264` | `.lui-dialog.ls-dialog-login .ui__dialog-main-content {` | → typed props | scoped main-content pad — same as 1036 |
| `1267–1269` | `.lui-dialog.ls-dialog-login .ui__dialog-main-content {` | KEEP (hook) | @media 640px |
| `1273–1279` | `.e2ee-password-modal-content {` | → typed props | column ~gap ~padding — ui_requests.ml:117 |
| `1281–1285` | `.ls-e2ee-title {` | → typed props | ~font_size ~font_weight — ui_requests.ml |
| `1287–1291` | `.ls-e2ee-form {` | → typed props | column ~gap — ui_requests.ml |
| `1293–1297` | `.ls-toggle-password-input {` | → typed props | box ~position:relative — ui_requests.ml:84 |
| `1299–1308` | `.ls-eye-btn {` | → typed props | icon button ~position ~inset ~width ~cursor — ui_requests.ml:91; HoverOpacity |
| `1310–1312` | `.ls-eye-btn:hover {` | → typed props | HoverOpacity — same |
| `1320–1327` | `.ls-quick-add {` | → typed props | dialog ~padding ~width — quick_add_view.ml:19 |
| `1348–1352` | `.ls-qa-btns {` | → typed props | row ~main:`end ~gap — same |
| `1355–1359` | `.ls-readme-repo {` | → typed props | row ~gap ~align ~padding ~background ~corner_radius — plugin_readme.ml:207 |
| `1361–1364` | `.ls-readme-repo-link {` | → typed props | link ~foreground — plugin_readme.ml:209 |
| `1366–1372` | `.ls-readme-body {` | → typed props | column ~gap ~font_size — plugin_readme.ml:213 |
| `1394–1402` | `.ls-dialog-layer, .ui__dialog-overlay, .ui__alert-dialog-overlay, .ui__dialog-content, .ui__…` | KEEP (hook) | prefers-reduced-motion media |
| `1770–1781` | `.ui__input {` | → recipe | form-input recipe — ui__input shared across dialogs/properties (font-size/padding/fg/bg/border/radius) |
| `1783–1786` | `.ui__input:focus {` | → typed props | FocusShadow — same input |
| `2036–2041` | `.panel-wrap .form-select,.panel-wrap .form-input {` | → recipe | form control recipe — form-select/.form-input shared (border/radius/padding/font-size) |
| `2043–2046` | `.panel-wrap .form-select:hover,.panel-wrap .form-input:hover {` | → typed props | HoverOpacity — same |
| `2092–2095` | `.ls-cm-heading-btn > .lui-button-icon,.ls-cm-heading-btn > .lui-button-label {` | KEEP (hook) | lui-button-icon/label kind internals |
| `2212–2225` | `.form-input.is-small,.form-select.is-small,input.form-input,select.form-select {` | → recipe | form-input.is-small/.ls-* inputs → shared form-input recipe |
| `2238–2242` | `.cp__plugins-installed {` | → typed props | ~font_size ~font_weight — plugins-installed header |
| `2244–2248` | `.cp__plugins-marketplace-cnt {` | → typed props | column ~gap — marketplace cnt |
| `2250–2253` | `.cp__plugins-item-lists {` | → typed props | column ~gap — plugins item-lists |
| `2255–2259` | `.cp__plugins-item-lists-inner {` | → typed props | column ~gap — item-lists-inner; flex-wrap residual |
| `2261–2269` | `.cp__plugins-item-card .l .plugin-icon {` | → typed props | icon box ~width ~height ~corner_radius — plugin-icon |
| `2271–2274` | `.cp__plugins-item-card .r {` | → typed props | row ~main ~cross — .r |
| `2276–2283` | `.cp__plugins-item-card .head {` | → typed props | ~font_size ~font_weight — .head |
| `2285–2288` | `.cp__plugins-item-card .desc {` | → typed props | ~font_size ~foreground ~line_height — .desc |
| `2290–2295` | `.cp__plugins-item-card .ctl {` | → typed props | row ~cross ~gap — .ctl |
| `2297–2302` | `.cp__plugins-item-card .ctl .l,.cp__plugins-item-card .ctl .r {` | → typed props | row ~gap — .ctl .l/.r |
| `2304–2317` | `.cp__plugins-item-card .menu-list {` | → typed props | ~position ~inset ~z_index ~corner_radius ~background ~border ~shadow — plugins_view.ml:287 menu-list |
| `2333–2337` | `.cp__plugins-page .tabs {` | → typed props | row ~gap ~border — .tabs |
| `2339–2343` | `.cp__plugins-page .tabs-inner {` | → typed props | row ~gap — .tabs-inner |
| `2568–2570` | `.menu-list .ui__dropdown-menu-item {` | → typed props | ~width on dropdown item — menu-list scope |
| `2578–2585` | `.cp__user-login {` | → typed props | column ~gap ~padding — cp__user-login login_view.ml:370 |
| `2587–2590` | `.cp__user-login .desc {` | → typed props | ~font_size ~foreground — .desc |
| `2593–2595` | `.cp__user-login span.opacity-50 {` | → typed props | ~opacity — opacity-50 utility in login |
| `2599–2602` | `.cp__user-login .ls-auth-muted {` | → typed props | ~font_size ~foreground — ls-auth-muted |
| `2604–2609` | `.cp__user-login .ls-auth-link {` | → typed props | link ~foreground — ls-auth-link |
| `2611–2613` | `.cp__user-login .ls-auth-link:hover {` | → typed props | hover fg — no hover-fg prop; residual hook OR HoverOpacity |
| `2616–2621` | `.cp__user-login .ls-auth-title {` | → typed props | ~font_size ~font_weight — ls-auth-title login_view.ml:503 |
| `2625–2627` | `.cp__user-login .ls-auth-field .lui-label {` | → typed props | ~line_height — lui-label in auth field |
| `2629–2631` | `.cp__user-login .ls-auth-field {` | → typed props | column ~gap — ls-auth-field |
| `2635–2637` | `.cp__user-login .ls-auth-foot {` | → typed props | row ~main ~gap — ls-auth-foot |
| `2639–2641` | `.cp__user-login .ls-auth-foot > .lui-row {` | → typed props | ~min_height — lui-row in login |
| `2644–2647` | `.ui__dialog-content .ui__input {` | KEEP (hook) | scoped under .ui__dialog-content — only pdf_toolbar imperative DOM |
| `2650–2652` | `.cp__user-login .ui__button {` | → typed props | button ~width — cp__user-login .ui__button |
| `2658–2662` | `.dark .cp__user-login .ui__alert {` | DEAD | .ui__alert no longer emitted — alert kind replaced it (login_view.ml:506 comment) |
| `2693–2695` | `.ls-quick-add {` | → typed props | dup ls-quick-add — quick_add_view.ml:19 |
| `2697–2701` | `.lsp-frame-readme {` | → typed props | ~padding ~font_size — lsp-frame-readme plugin_readme.ml:187 |
| `2703–2705` | `.cards-modal {` | → typed props | column ~gap ~padding — cards-modal cards_view.ml:313 |
| `2724–2727` | `.ui__dialog-content .flex.flex-col,.ui__popover-content .flex.flex-col {` | → typed props | ~min_width on flex children inside dialog/popover — utility-class consumers via Logseq_el |
| `2918–2922` | `.ui__button.as-solid {` | → recipe | as-solid → ~variant:`primary — button recipe |
| `2924–2926` | `.ui__button.as-solid:hover {` | → recipe | as-solid hover → recipe |
| `2928–2932` | `.ui__button.as-secondary {` | → recipe | as-secondary → ~variant:`secondary |
| `2934–2936` | `.ui__button.as-secondary:hover {` | → recipe | as-secondary hover → recipe |
| `2938–2942` | `.ui__button.as-outline {` | → recipe | as-text → ~variant:`text |
| `2944–2946` | `.ui__button.as-outline:hover {` | → recipe | as-ghost → ~variant:`ghost |
| `2948–2951` | `.ui__button.as-text {` | → recipe | as-text → ~variant:`text |
| `2953–2955` | `.ui__button.as-text:hover {` | → recipe | as-text hover → recipe HoverBackground |
| `2957–2962` | `.ui__button.ls-btn-sm {` | → typed props | ~size:`sm — ls-btn-sm |
| `3079–3083` | `.cp__plugins-item-card .head {` | → typed props | ~font_size ~font_weight — .head dup |
| `3085–3088` | `.cp__plugins-item-card .desc {` | → typed props | ~font_size ~foreground — .desc dup |
| `3097–3101` | `.cp__plugins-item-card .ctl .l,.cp__plugins-item-card .ctl .r {` | → typed props | row ~gap — .ctl .l/.r dup |
| `3116–3120` | `.cp__plugins-page .tabs {` | → typed props | row ~gap ~border — .tabs dup |
| `3122–3125` | `.cp__plugins-page .tabs-inner {` | → typed props | row ~gap — .tabs-inner dup |
| `3142–3147` | `.ls-form-actions {` | → typed props | row ~main:`end ~gap — ls-form-actions settings_url_view.ml:96 |
| `3182–3185` | `.ls-hidden-input {` | → typed props | ~position ~display — ls-hidden-input importer.ml:245 |
| `3189–3198` | `.importer {` | → typed props | column ~gap ~padding — importer importer.ml:273/286 |
| `3200–3206` | `.cp__onboarding-setups {` | → typed props | column ~gap — cp__onboarding-setups importer.ml:286 |
| `3210–3213` | `.cp__onboarding-setups {` | KEEP (hook) | @media onboarding |
| `3216–3221` | `.inner-card {` | → typed props | column ~gap ~padding ~corner_radius ~border ~background — inner-card importer.ml:288 |
| `3224–3229` | `.inner-card > h1.ls-imp-title {` | → typed props | ~font_size ~font_weight — h1.ls-imp-title |
| `3231–3237` | `.inner-card > h2 {` | → typed props | ~font_size ~font_weight — h2 |
| `3264–3269` | `.new-graph {` | → typed props | column ~gap ~padding — new-graph new_graph.ml:53 |
| `3271–3275` | `.ls-dialog-title-lg {` | → typed props | ~font_size ~font_weight — ls-dialog-title-lg settings_url_view.ml:78 |
| `3289–3294` | `.ls-ex-list {` | → typed props | column ~gap — ls-ex-list exporter.ml:364; margin residual |
| `3302–3306` | `.export hr {` | → typed props | ~border — export hr; margin residual |
| `3309–3312` | `.ls-cards-select {` | → typed props | row ~cross ~gap — ls-cards-select cards_view.ml:45 |
| `3316–3325` | `.ls-cards-select-value {` | → typed props | ~font_size — ls-cards-select-value cards_view.ml:49 |
| `3327–3333` | `.ls-cards-select-value .lui-select-value {` | KEEP (hook) | lui-select-value kind internal |
| `3336–3339` | `.ls-card-bc {` | → typed props | row ~cross ~gap — ls-card-bc cards_view.ml:165; margin residual |
| `3362–3366` | `.ls-card.content {` | → typed props | ~padding ~font_size — ls-card.content cards_view.ml:152/248 |
| `3368–3373` | `.ls-card-scroll {` | → typed props | scroll ~max_height — ls-card-scroll |
| `3375–3379` | `.ls-card-actions {` | → typed props | row ~main:`end ~gap — ls-card-actions; margin residual |
| `3385–3390` | `.ls-cards-col {` | → typed props | column ~gap — ls-cards-col |
| `3392–3398` | `.ls-cards-stack {` | → typed props | column ~gap — ls-cards-stack |
| `4110–4118` | `.ls-ref-btn {` | → typed props | button ~padding ~font_size ~border ~corner_radius ~cursor — ls-ref-btn views_head.ml:855 |
| `4120–4122` | `.ls-ref-btn:hover {` | KEEP (hook) | hover border-color — no hover-border prop |
| `4125–4130` | `.ui__button.ls-btn-xs {` | → typed props | ~size/font_size ~padding — ls-btn-xs |
| `4132–4136` | `.ui__button.ls-btn-md {` | → typed props | ~size — ls-btn-md |
| `4138–4143` | `.ui__button.ls-btn-lg {` | → typed props | ~size — ls-btn-lg |
| `4145–4151` | `.ui__button.ls-btn-icon {` | → typed props | button ~width ~height ~padding — ls-btn-icon |
| `4153–4156` | `.ui__button.ls-btn-default {` | → typed props | ~variant:`default — ls-btn-default |
| `4158–4160` | `.ui__button.as-ghost {` | → recipe | ~variant:`ghost — as-ghost dup |
| `4162–4164` | `.ui__button.as-ghost:hover {` | → recipe | hover → recipe |
| `4166–4169` | `.ui__button.as-destructive {` | → recipe | ~variant:`destructive — as-destructive dup |
| `4171–4173` | `.ui__button.as-destructive:hover {` | → recipe | hover → recipe |
| `4175–4180` | `.ui__button.as-link {` | → recipe | ~variant:`link — as-link dup; text-decoration residual |
| `4182–4184` | `.ui__button.as-link:hover {` | KEEP (hook) | text-decoration underline hover |
| `4252–4264` | `.action-input {` | → typed props | input ~padding ~font_size ~border — action-input importer.ml:236; transition residual |
| `4266–4268` | `.action-input:hover {` | → typed props | HoverOpacity — same |
| `4270–4272` | `.action-input:active {` | → typed props | PressedOpacity — same |
| `4274–4277` | `.action-input strong {` | → typed props | ~font_size ~font_weight — strong inside action-input |
| `4279–4282` | `.action-input small {` | → typed props | ~font_size ~foreground — small inside action-input |
| `4286–4288` | `.importer .c {` | → typed props | ~text_align — .c centered col |
| `4290–4295` | `.importer .c h1 {` | → typed props | ~font_size ~font_weight — .c h1 |
| `4297–4301` | `.importer .c h2 {` | → typed props | ~font_size ~font_weight — .c h2 |
| `4303–4308` | `.importer .d {` | → typed props | ~font_size ~foreground ~line_height — .d |
| `4310–4315` | `.importer .d > label.action-input {` | → typed props | ~cursor — label.action-input |
| `4317–4325` | `.action-input .as-flex-center {` | → typed props | ~main:`center ~cross:`center — as-flex-center |
| `4329–4339` | `.action-input .lui-icon {` | KEEP (hook) | mask-image — no prop |
| `4425–4432` | `.ls-page-icon .lui-button.ui__button {` | → typed props | button ~width ~height ~padding — lui-button.ui__button page.ml:584 |
| `4434–4436` | `.ls-page-icon .lui-button.ui__button:hover {` | → typed props | HoverOpacity — same |
| `4439–4439` | `.pv-closed-value .lui-button-label:empty {` | KEEP (hook) | lui-button-label:empty kind internal — pv-closed-value scope |

_dialogs: 127 typed-props · 24 recipe · 20 keep-hook · 0 token · 1 dead_

### Misc — 66 rules

| Lines | Selector | Verdict | Destination / hook reason |
|---|---|---|---|
| `23–27` | `:root {` | KEEP (token) | --lui-c-* aliases over shipped hsl-triplet theme vars — feeds the whole sheet |
| `104–108` | `from {` | KEEP (token) | @keyframes lui-fade-zoom-in — animation def for hook rules |
| `476–479` | `.ls-cm-sc {` | → typed props | margin/padding-left → ~gap on parent — popups_view.ml:567 |
| `534–538` | `.cp__commands-slash .ui__icon {` | → typed props | icon ~opacity ~foreground — slash icon emitter popups_view.ml |
| `551–561` | `.ls-tag-search-hint {` | → typed props | ~font_size ~opacity ~cross ~gap — popups_view.ml:436 |
| `608–616` | `.ls-cm-colors,.ls-cm-headings {` | → typed props | row ~main ~cross ~padding — popups_view.ml cm_* |
| `618–621` | `.ls-cm-headings {` | → typed props | ~padding — same |
| `623–631` | `.ls-cm-headings-row {` | → typed props | row ~main ~cross ~grow — same |
| `633–635` | `.ls-cm-colors-row {` | → typed props | margin-top → parent ~gap — same |
| `801–805` | `from {` | KEEP (token) | @keyframes lui-overlay-in/-out/-content-in/-content-out — dialog animations |
| `807–811` | `to {` | KEEP (token) | keyframe frame (ui-dialog-zoom-in) — part of token block 801 |
| `815–817` | `from {` | KEEP (token) | keyframe frame (lui-fade-in) |
| `1082–1084` | `.ls-dnd-a11y {` | KEEP (hook) | sr-only a11y node (clip/clip-path) — views_table.ml:860 |
| `1086–1099` | `.ls-dnd-live {` | KEEP (hook) | visually-hidden live region — views_table.ml:871 |
| `1314–1317` | `.ls-warn-text {` | → typed props | ~foreground ~font_size — ui_requests.ml:134 |
| `1329–1337` | `.ls-qa-head {` | → typed props | row ~main ~cross ~padding — quick_add_view.ml:22 |
| `1339–1341` | `.ls-qa-title {` | → typed props | ~font_size ~font_weight — quick_add_view.ml |
| `1343–1346` | `.ls-qa-content {` | → typed props | column ~padding ~gap — same |
| `2010–2015` | `.panel-wrap {` | → typed props | column ~gap — panel-wrap settings_page.ml:218/309 |
| `2018–2021` | `.panel-wrap {` | KEEP (hook) | @media panel-wrap |
| `2026–2028` | `.panel-wrap > .it:first-of-type {` | → typed props | first-of-type pad → parent ~padding or data_attrs — panel-wrap .it |
| `2319–2324` | `.control-tabs {` | → typed props | row ~gap — control-tabs plugins_view.ml:72 |
| `2326–2331` | `.control-tabs .l,.control-tabs .r {` | → typed props | row ~gap — .l/.r |
| `2442–2450` | `.color-picker {` | → typed props | ~padding ~border ~corner_radius ~background — color-picker icon_picker.ml:437 |
| `2452–2460` | `.color-picker > strong {` | → typed props | ~font_size ~font_weight — color-picker strong |
| `2462–2464` | `.color-picker > strong:hover {` | → typed props | HoverBackground — swatch hover |
| `2666–2669` | `:root {` | KEEP (token) | sync status color vars in :root |
| `2826–2828` | `.ls-th-strong {` | → typed props | ~font_weight — ls-th-strong settings_page.ml:457 |
| `2998–3004` | `.ls-check-row {` | → typed props | row ~cross ~gap — ls-check-row |
| `3006–3010` | `.ls-check-label {` | → typed props | ~font_size — ls-check-label |
| `3048–3053` | `.control-tabs {` | → typed props | row ~gap — control-tabs dup |
| `3055–3059` | `.control-tabs .l,.control-tabs .r {` | → typed props | row ~gap — .l/.r dup |
| `3061–3069` | `.ls-pl-empty {` | → typed props | ~padding ~font_size ~foreground — ls-pl-empty |
| `3071–3073` | `.ls-pl-empty-text {` | → typed props | ~font_size ~foreground — ls-pl-empty-text |
| `3090–3095` | `.ls-pl-meta {` | → typed props | ~font_size ~opacity — ls-pl-meta |
| `3103–3108` | `.ls-pl-status {` | → typed props | ~font_size ~foreground — ls-pl-status |
| `3110–3114` | `.ls-pl-loading {` | → typed props | ~font_size ~opacity — ls-pl-loading |
| `3127–3131` | `.html-content.ls-pl-html {` | KEEP (hook) | html-content — extension-rendered HTML body plugins_view.ml:521 |
| `3133–3136` | `.code-mode-wrap {` | → typed props | column ~gap — code-mode-wrap plugins_view.ml:663 |
| `3138–3140` | `.ls-mono {` | KEEP (hook) | font-family mono — no font-family prop (ls-mono plugins_view.ml:664) |
| `3156–3160` | `.ls-pl-warn {` | → typed props | ~font_size ~foreground — ls-pl-warn |
| `3162–3166` | `.ls-pl-id {` | → typed props | ~font_size ~opacity — ls-pl-id |
| `3168–3170` | `.ls-pl-link {` | → typed props | link ~foreground — ls-pl-link |
| `3172–3174` | `.ls-pl-link:hover {` | KEEP (hook) | text-decoration underline on hover — no text-decoration prop |
| `3177–3180` | `.ls-imp-field {` | → typed props | column ~gap — ls-imp-field importer.ml:241 |
| `3239–3241` | `.ls-imp-title {` | → typed props | ~font_size ~font_weight — ls-imp-title |
| `3243–3246` | `.ls-ng-rtc {` | → typed props | row ~cross ~gap — ls-ng-rtc new_graph.ml:83 |
| `3248–3253` | `.ls-ng-row {` | → typed props | row ~cross ~gap — ls-ng-row new_graph.ml:84 |
| `3255–3257` | `.ls-ng-sub {` | KEEP (hook) | margin-left only — no margin prop (ls-ng-sub) |
| `3259–3262` | `.ls-ng-label {` | → typed props | ~font_size ~foreground — ls-ng-label new_graph.ml:88 |
| `3341–3343` | `.ls-gap {` | → typed props | row ~gap — ls-gap |
| `3345–3347` | `.ls-nowrap {` | → typed props | ~white_space:`nowrap — ls-nowrap |
| `3349–3352` | `.ls-center {` | → typed props | ~main:`center ~cross:`center — ls-center |
| `3354–3360` | `.ls-ratings {` | → typed props | row ~cross ~gap — ls-ratings cards_view.ml:135; flex-wrap residual |
| `3381–3383` | `.ls-ml {` | KEEP (hook) | margin-left only — ls-ml |
| `3494–3497` | `.ls-count {` | → typed props | ~font_size ~opacity — ls-count views_head.ml:168 |
| `3509–3511` | `.ls-dim {` | → typed props | ~opacity — ls-dim views_head.ml:91 |
| `3529–3534` | `.ls-drag-row {` | → typed props | row ~cross ~gap ~padding ~border — ls-drag-row views_head.ml:~245 |
| `3536–3539` | `.ls-col-name {` | → typed props | ~font_size ~grow ~min_width — ls-col-name |
| `3623–3625` | `.ls-xs {` | → typed props | ~font_size — ls-xs views_head.ml:687/689 |
| `3777–3782` | `.sticky-columns {` | KEEP (hook) | position:sticky — no sticky in Position prop values (sticky-columns) |
| `4020–4024` | `.ls-query-count {` | → typed props | ~font_size ~opacity — ls-query-count views_head.ml:1041 |
| `4387–4389` | `.all-pane {` | → typed props | column ~gap — all-pane icon_picker.ml:312 |
| `4404–4414` | `html[data-theme=light] {` | KEEP (token) | html[data-theme=light] :root token block |
| `4419–4423` | `.ls-page-icon {` | → typed props | icon ~size — ls-page-icon page.ml:580 |
| `4454–4454` | `.pv-closed-value:hover {` | → typed props | HoverBackground/HoverForeground — pv-closed-value:hover properties_value.ml:759 |

_misc: 50 typed-props · 0 recipe · 9 keep-hook · 7 token · 0 dead_
