# Task 5 settings & properties — LUI kit adoption review

Read-only review for `2026-10-10-003-shared-ui-visual-design.md`,
family "settings & properties". Companion to
`inventory-settings.md` (475 inventoried CSS rules). Question per
view: can a high-level LUI kit component (kind or shared recipe)
replace the hand-assembled element, which CSS rules die with the
adoption, and what custom behavior must stay.

Kit baseline: `lui/schema/components.json` at pin a8cc58c — 88 node
kinds, 149 properties. Form/settings-relevant kinds, with current
use in this family:

| Kind | Signature highlights | Used today |
|---|---|---|
| `switch_` | `checked(_signal)`, `on_toggle`, `label`, `disabled` | yes — `Settings_controls.switch_el`, plugin enable toggle |
| `toggle` | same shape as `switch_` | no |
| `checkbox` | `checked(_signal)`, `on_toggle`, `text` | yes — settings rows, property checkbox cell, new-graph |
| `radio_group`/`radio` | `selected`, `on_change` | no — no radio UIs in this family |
| `slider` | `value(_signal)`, `on_change` | **no — plugin "range" setting uses a raw `Logseq_el` input** |
| `number_stepper` | `value/min/max/step`, `on_value_changed` | no |
| `select` | `text(_signal)`, `on_press`, `menu_item` children | yes — language, date-format, deck pickers |
| `combobox` | — | no — select+`dropdown_menu` emulates it |
| `text_field`/`secure_field`/`input`/`search_field`/`textarea` | `text(_signal)`, `placeholder`, `autofocus`, `on_input`, `on_submit`; `input ~kind:\`color` | yes — all text entry; `input ~kind:\`color` used for plugin color settings |
| `input_group`/`input_group_actions` | `label`, `actions` slot | no |
| `tabs`/`bottom_tabs`/`bottom_tab` | `orientation`, `label` | **no — plugins dashboard and icon picker hand-build tab bars from buttons** |
| `toggle_group`/`button_group`/`toggle_button` | — | `toggle_button` yes (keymap filter pills) |
| `accordion` | `text`, `selected(_signal)`, `accordion_height`, `on_toggle` | no |
| `list`/`list_item`/`list_section(+header/footer)`/`virtual_list` | `selected`, `on_press`, `icon` | yes — settings nav, keymap rows, picker results |
| `kbd` | `value` | yes — `kbd_seq`, keymap bindings, rating buttons |
| `menu_item`/`dropdown_menu`/`context_menu`/`menu_trigger`/`submenu`/`popover`/`dialog`/`sheet`/`drawer` | `checked`, `variant`, anchors, `on_dismiss` | yes — property menus, picker dropdowns, confirm dialog |
| `grid` | `columns` | yes — accent swatch grid (`~columns:8`) |
| `card`/`panel`/`toolbar`/`divider`/`scroll` | — | `card` in property dialog; **plugin cards still hand-built rows** |
| `progress`/`spinner` | `value` | no |
| `stepper`/`step`, `breadcrumb`, `pagination`, `table`/`table_row`/`table_cell`, `tree`, `file_picker`, `file_image`/`file_preview`, `avatar`, `toast`, `tooltip`, `alert`, `resizable`, `split`, `media_surface`, `swipe_actions`/`swipe_action`, `status_bar` | — | `toast` yes; `file_picker` **not usable on web** (no File objects emitted — importer.ml TODO); rest unused by this family |

## Per-view table

CSS column = inventoried rules that become deletable if the kit
candidate lands (from `inventory-settings.md` section totals; rules
marked "hook" or "deco" are excluded — see that file's legend).

| View (emitter) | Surface | Kit candidate | CSS deletable | Must stay custom |
|---|---|---|---|---|
| `shared/settings_controls.ml` | `.it` label\|control\|desc rows, `ui__switch`, `ui__checkbox`, `ui__button`, `keyboard-shortcut` chips | Shared **form-row recipe** (label + control + description + kbd slots) on `row`/`column`; `switch_`/`checkbox`/`kbd` already kit — the recipe absorbs `.it`, `.ls-it-*`, `.ls-switch-wrap`, `.ls-kbd-cell`, `.ls-label`, `.it-label`, `.it-control`, `.it-desc` | ~45 of 119 settings-helper rules + most of the `.it` grid rules in the 90-rule settings block | `btn_cls` variant→class mapping (until buttons drop style_class entirely); `print_key` glyph table; `for_` label↔control binding (no kit `htmlFor`) |
| `settings/settings_page.ml` — shell | `.cp__settings-inner` aside+article, `.settings-menu(-item/-link)`, `.cp__settings-header/-modal-title/-category-title`, `.settings-article`, `.cp__settings-<key>-cnt` | `Split` or aside/article recipe + `list`+`list_item` nav with `selected` (already kit) — nav items already `list_item ~selected`; remainder is breakpoint layout + heading slots | ~25 of 90 (nav/item/header rules shrink to recipe) | `data-id="keymap"` breakpoint-hidden item; dynamic `cp__settings-<key>-cnt` prefix hook; `::first-letter` capitalize on modal title (deco) |
| `settings_page.ml` — general pane | `.panel-wrap` `.it` rows, version/updater row, `cp__theme-modes-options` thumbnails, `ls-font-*` font buttons, `cp__accent-colors-list-wrap` swatch grid | form-row recipe covers all `.it` rows; **theme modes → new "option card" recipe** (`list_item` + image thumbnail + inset-ring selected state); font buttons → `button ~variant:secondary ~selected` (already close); accent swatches → **swatch-grid recipe** on `grid` (already `grid ~columns:8`); `select`+`dropdown_menu` language picker already kit | ~35 of 90 (`.it`, `.form-select`, `.panel-wrap` mechanics) + `ls-font-*` + `ls-swatch*` helpers (~15 of 119) | theme-mode thumbnail PNGs (need an image/asset prop — gap); `radix` conditional class on swatches; version row's `.ctls`/`.update-state` chip layout |
| `settings_page.ml` — editor pane | date-format `select` row, config `cfg_row`s, `storage_row`s | `select` already kit; all toggle rows via form-row recipe | covered by form-row count | `dfmt_menu` signal plumbing (same pattern as language — could share a `select_menu` recipe) |
| `settings_page.ml` — keymap pane | `.shortcut-toolbar-row`, `.search-input-wrap`, `.shortcut-filter-pill(s)`, `.shortcut-keystroke-inactive`, `li.th`, `.shortcut-row`, `.keyboard-shortcut` | **`search_field` replaces icon+input pair**; `toggle_button` pills already kit → `toggle_group` recipe; `list_item` section headers + rows already kit; `kbd` chips already kit | ~10 of 12 misc rules + `.shortcut-*` rules in the 90 block (~15) | keystroke-record button (inactive stub, needs a capture channel); `ls-dc` display:contents trick for binding cells (emit fragment instead — deco); fold-all/refresh icon-link stubs |
| `settings_page.ml` — advanced + features panes | URL action buttons, `ls-select-wrap` home input, switch action rows | form-row recipe; `input`/`button` already kit | small (inside `.it` counts) | `storage_unquote`/`set_home_page` semantics; blur-save is already dropped (kit has no blur event — gap) |
| `settings_view.ml` | `theme_modes_ul`, `lang_trigger`, legacy `body` | `list_item ~selected` + class_signal for `.active` ring → option-card recipe (same as general pane); `select`+`dropdown_menu` already kit | `cp__theme-modes-options` + `ui__select-*` (~8) | `use_mode`/`apply_theme_dom` side effects; `ls-select-wrap` anchor box (needed until select anchors natively) |
| `settings_url_view.ml` | `.cp__settings-<key>-cnt` URL editor dialogs | `input` + `button` rows → `input_group` (label+field+actions in one kind) or form recipe | ~5 | `push_sync_config` worker call; valid_url/toast flow |
| `properties/properties_area.ml` | `.ls-properties-area` panel: `.property-pair` grid rows, `.property-key-panel/.property-k`, `.property-value-panel`, `.hidden-properties-toggle-*`, `.bottom-property-pill` pills, `.positioned-properties` chips, title actions, class section, bidi groups | **property-row recipe** (key-cell + value-cell, replaces `fit-content(260px) minmax(0,1fr)` grid) + **pill/chip recipe** for `bottom-property-pill`/`select-item`; hidden toggle → `list_item` or `accordion` section | ~40 of 62 (grid template, key/value cells, pills, hover reveal) | `partition_rows` positioning dispatch; `key_cell` hosts the anchored config `popover`; `can_toggle_hidden` route check; hover-driven `title_actions` opacity (needs parent-hover channel — gap); block-chrome hooks `.ls-block`/`.jtrigger`/`property-value-container` (must survive as data hooks) |
| `properties/properties_value.ml` | per-type value cells: `pv-scalar`, `ui__checkbox`, `ls-datetime`, `.pv-closed-value`, `page-ref` link, `.property-block-container` block chrome, `prop-edit-ico` | `checkbox` already kit; **date cell → `date-picker` kind (gap)**; ref chips → chip recipe; `block_value_wrap` → block-chrome recipe (shared with editor family) | ~10 of 14 value-cell rules | the whole type dispatch (`view` match); `scalar_edit_cell` pending/active-editor state machine + `close_editor` single-surface contract; `extends_view` multi-toggle `menu_item ~checked` popover; `closed_value_view` tag-scoping/exclusion fetch chain; `url_view` target-blank nav |
| `properties/properties_dialog.ml` | `.ls-property-dialog` 4-phase picker (select → type → tags → value) | `Sel.view` (already list+text_field); `dialog`/`card`+anchored `popover` already kit; type list could be `list_section` | ~6 of 28 popup rules | 4-phase state machine; `add_empty_text_block` pending-edit flow; is_many add-or-remove semantics; measure-retry anchor |
| `properties/properties_select.ml` | `.cp__select` widget: text_field over `list` of `list_item`s | already kit-shaped; candidate for `combobox` once the kind gains a filter field — today the hand pair is correct | ~3 | async `on_search` stale-guard; "New option" row synthesis; exact/prefix ranking |
| `properties/properties_menu.ml` | `.ls-property-dropdown` config menu: name/type/choices/default/position/hide panes + delete confirm | `submenu`/`menu_item ~checked` already kit; `text_form_view` → form recipe; choices pane → `list`+`submenu` per choice (already); `dialog` confirm already kit | ~12 of 24 property-menu rules | pane-swap `menu_pane` machine (popover not dropdown_menu — documented kind constraint); choice scoping/exclusion item generation; `menu_root_class` hook class |
| `properties/properties_popup.ml` + `properties_view.ml` | anchored `popover` infra, `.cp__overlays` host, global keydown | already kit (`popover ~at`, `dialog`); zero extra | 0 | measure-retry for async host measurement; Escape ordering contract; `cp__overlay-layer` gpui hook |
| `dialogs/plugins_view.ml` — dashboard | `.tabs(-inner)`+`.ls-tab-btn`, `.control-tabs`/`.secondary-tabs`, `.search-ctls`, `.cp__plugins-item-card`, `.menu-list`, `ls-pl-*` | **`tabs` or `toggle_group` for tab bars** (today: `button`+`class_signal`); **`card` for item cards** (today: `row`+classes); `search_field` for `.search-ctls`; `switch_` already kit; gear `menu-list` → `dropdown_menu`+`menu_trigger` | ~18 of 26 plugin rules + `ls-tab-btn`/`secondary-tabs`/`control-tabs` (~10 of 119) | marketplace fetch/stats signals; stars/downloads meta row; `.menu-list` nested-inside-card dropdown (needs MenuTrigger anchoring); `btn.disabled` e2e click contract |
| `dialogs/plugins_view.ml` — plugin settings | `.desc-item` schema rows (input/toggle/enum/object/heading/button), `.code-mode-wrap` | **range setting → `slider`** (replaces `Logseq_el` escape — TODO already in code); `input ~kind:\`color`/`checkbox`/`select`/`textarea` already kit; `.desc-item` → form-row recipe | ~8 (`form-control`, `desc-item`) | schema-dispatch on `type`/`inputAs`; `set_v_quiet` no-bump contract; code-mode JSON textarea + replace flow |
| `icon/icon_picker.ml` | `.cp__emoji-icon-picker`: `.hd` search, `.bd` scroll grid, `.ft` tab strip, `.tab-item`s, `.color-picker` preset popover, icon cells | `search_field` (icon+clear — clear-x currently a `Logseq_el` `<a>` escape); `tabs` for the ft strip; `virtual_list` for the icon grid (already chunked rows — kind exists); color presets → swatch recipe | ~20 of 30 icon/color rules | emoji/tabler item cells (glyph buttons + tooltips + used-items persistence); `pane_section ~virtual_list` chunking until `virtual_list` supports grid items; `pal_open` preset popover |
| `popups/popups_view.ml` — `cm_color_row` | `.ls-cm-swatch` heading-color swatches | same swatch/chip recipe as accent+presets | ~4 | `run_cm_color` dispatch; remove-swatch special case |
| `graphs/importer.ml` | `.importer` `.action-input` file rows, `.inner-card`, `.ls-imp-*` | **`file_picker` kind — blocked on web backend** (emits bare `lui-file-picker`, no File objects/directory pick — file's own TODO); `card` for `.inner-card` | ~6 of 11 importer rules | zip/asset pipeline; label+hidden-input click activation until `file_picker` backend lands (stay-DOM, documented) |
| `graphs/new_graph.ml` | `.new-graph` name input + rtc/e2ee checkboxes + submit | `input`+`checkbox`+`button` already kit; row recipe | ~4 | rtc-test-mode gating; `ensure_rsa_keys` ordering |
| `cards/cards_view.ml` | deck `select`, rating buttons + `kbd` chips | `select`+`dropdown_menu` already kit; `kbd` already kit; rating buttons → button recipe variant | ~4 of 12 misc | rating tint classes (`primary-red` etc. — semantic color prop or recipe); due-label cells |

## Adoption order

Sorted by deletion-per-effort and dependency on kit gaps.

1. **`slider` for the plugin "range" setting** (plugins_view.ml:584) — one-line kind swap, deletes the only raw `Logseq_el` input in the family; slider kind already shipped.
2. **`search_field` in `.search-ctls`/`.search-input-wrap`/icon-picker `.hd`** — drops icon-wrap + input pairs in three views; clears the `<a>` escape in icon_picker.
3. **Shared form-row recipe** (label + control + desc + optional kbd slot) across `settings_controls` `.it` rows and plugin `.desc-item` — the single largest deletion: collapses the 3-col grid + nth-child machinery. ~60–70 rules.
4. **`tabs`/`toggle_group` for `.tabs-inner`+`.secondary-tabs`+`.shortcut-filter-pills`** (plugins dashboard, keymap filters, icon-picker `.ft`) — needs a pill/secondary variant on the kind or recipe.
5. **`card` + toolbar recipe for `.cp__plugins-item-card`** — deletes the fractional `calc(50% - .5rem)` wrap; needs wrap/grid support.
6. **Swatch/chip recipe for accent grid, icon-color presets, `cm_color_row`, `bottom-property-pill`, `select-item`, `ref_chips`** — one recipe kills five hand-built variants; needs `corner_radius:999` + selected-ring state (mostly present as typed props).
7. **Property-row recipe** (`key_cell | value_cell`) — replaces `fit-content` grid template; depends on the recipe layer, not a new kind.
8. **Option-card recipe for theme modes** — needs an image/asset prop for thumbnails; do together with gap #5 below.
9. **`file_picker` for importer rows** — blocked until the web backend emits File objects and directory pick.
10. **`date-picker`/`calendar` kind for property date cells** — upgrades `ls-datetime` text_field to parity with the editor's `.ui__calendar`; share the kind with the editor family (owner of `editor_commands.ml`'s 44 calendar rules).

## Stay-custom (do not flatten into kit)

- **Property type dispatch** — `Properties_value.view` matches on `row_type` + closed-values; this is the family core, not styling.
- **Multi-value ref chips + picker popover** (`node_view`, `extends_view`) — composite fetch+toggle semantics; `menu_item ~checked` already does the checked part.
- **Scalar edit state machine** — `pending_edit`/`active_editor`/`close_editor` single-editing-surface contract with the block editor.
- **Property dialog 4-phase flow** and `is_many` add-or-remove semantics; `Sel.view` async-search stale guard + "New option" synthesis.
- **Pane-swapping config menu** (`menu_pane`) — constrained to `popover` because `dropdown_menu` accepts only menu children.
- **`key_cell` chromeless button + anchored config `popover`** — the anchor is the feature.
- **Icon picker item cells** — glyph buttons with tooltips, used-items persistence, emoji vs tabler sources.
- **Theme-mode thumbnail cards** — pending the image/asset prop; then they move to the option-card recipe.
- **Importer file inputs** — stay `Logseq_el` until the web `file_picker` backend exists (already TODO'd).
- **Block-chrome hooks** — `.ls-block`, `.jtrigger`, `property-value-container`, `data-property-type`, `data-checked` survive as data/class hooks even when their styling migrates (see inventory "Hooks that MUST survive").
- **Plugin settings schema dispatch** (`type`/`inputAs` match) and the code-mode JSON editor.

## Kit gaps for this family

Beyond the cmdk list (position+inset, typography, state variants,
ellipsis, min/max sizing, user-select, inset shadow — already filed):

1. **Form-row / settings-row recipe or kind** — label + control +
   description + shortcut slots. Highest value: ~70 rules across
   `.it`/`.ls-it-*`/`desc-item` collapse into it. (Recipe-level, no
   new kind required.)
2. **Swatch-grid / color-palette component** — accent picker
   (8-col `grid`, already kind-backed but hand-styled), icon-color
   presets, `cm_color_row`. Needs selected-ring state on a round
   `button`/`box` cell.
3. **`date-picker`/`calendar`/`time-picker` kinds** — property date
   cells use a bare `text_field`; the editor's `.ui__calendar` grid
   (44 rules) has no kind. Share one kind across families; needs
   `data-selected`/`data-today` state props on day cells.
4. **Option-card / radio-card** — theme-mode thumbnails
   (`.cp__theme-modes-options li > i` 92px image + inset ring).
   Needs an image-asset prop; `radio_group` exists but the design is
   a thumbnail card, not a radio.
5. **Chip / pill kind or recipe** — `bottom-property-pill`,
   `select-item`, `ref_chips`, `shortcut-filter-pill`. `toggle_button`
   covers the filter pills; the ref pills need `icon + text +
   (on_remove?)`.
6. **Switch checked-state + knob** — `.lui-switch-control::after`
   knob and `:checked` track are pseudo-element/deco today; either
   emit the knob as a real child node or paint both states in the
   backend so the stylesheet carries zero geometry.
7. **Web `file_picker` backend** — emits `lui-file-picker` with no
   `Picked` event / web File objects; importer stays on `Logseq_el`
   until then (also needs `webkitdirectory`).
8. **Blur/commit event on text fields** — `scalar_edit_cell` and the
   default-home input dropped the cljs blur-save because `on_submit`
   is Enter-only. A blur or commit channel restores parity.
9. **Parent-hover channel** — `.property-panel-edit-btn` /
   `ls-page-title-actions` reveal on `:has(:hover)`/wrapper hover;
   today a manual pointer-enter/leave signal. A `hover` state prop or
   parent-hover event would delete the plumbing.
10. **Grid track templates + placement** (inventory gap #1) —
    `repeat(3, minmax(0,1fr))` `.it` rows, `fit-content(260px)`
    property rows, `repeat(8,…)` swatches, `grid-column: span`.
11. **Combobox-kind gap** — `select` has no built-in filter field, so
    every picker hand-pairs `text_field` + `list` (`Sel.view`,
    `lang_trigger`, `dfmt_menu`). Either grow `combobox` or bless the
    `select + dropdown_menu(text_field …)` pattern as the recipe.
12. **Tabs variants** — `tabs` exists but the design needs
    pill/secondary styling (`.ls-tab-btn`, `.secondary-tabs`,
    `.ft .tab-item`); a variant prop or recipe decides whether the
    hand-built bars convert.
13. **Focus-within channel** — search-icon opacity on
    `:focus-within` (`.search-input`, `.cp__filters-input-panel`).
14. Minor: `list-style:none` marker suppression, `cursor` variants
    (`not-allowed`, `copy`, `ew-resize`), `text-transform` capitalize
    without `::first-letter`, `-webkit-line-clamp` on select labels,
    `resize:vertical` on `textarea`, `text-align` on
    `.ls-kbd-cell`/importer headers, `color-scheme` on native inputs.

## Rule-deletion estimate

475 inventoried rules → **~250–300 deletable** once the form-row,
swatch, option-card, property-row recipes and the slider/tabs/card
kind adoptions land; ~60–80 are hooks that must survive (`data-*`,
class registrations, `.ls-block` chrome); the remainder is
platform-deco (transitions, gradients, `::first-letter`, dark
tweaks). Largest single wins: form-row recipe (~70), plugins
dashboard cards+tabs (~28), property panel row/pills (~40), icon
picker (~20).
