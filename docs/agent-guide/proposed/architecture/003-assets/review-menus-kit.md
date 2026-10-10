# Task 2 review — menus & overlays vs the LUI kit

Family: context menus, dropdowns, selects, dialogs, popups,
toast/notifications, tooltips. Companion to
`inventory-menus.md` (278 `lui-overlay.css` rules) and the cmdk review
(T4 — `shared/cmdk_view.ml` is excluded here).

Question per view: is it element-composed where a kit kind exists, what
CSS does adoption delete, and what custom behavior has to stay.

## 1. Kit catalog (logseq/lui `schema/components.json`)

All overlay kinds below are `status: supported` public elements. Web DOM
emitted by `platform/web/melange` + `platform/web/src/lui.css`:

| Kind | Web DOM / behavior | Notes |
|---|---|---|
| `popover` | `.lui-popup-positioner > .lui-popover` portal; `~at:(x,y)` point, `~anchor`+alignment+offset, or cover mode; `~role:\`menu`, `~available_height`, `~on_dismiss` (outside-press/Escape), viewport clamp | The primitive shell — already used everywhere in deps/ui |
| `context-menu` | `.lui-context-menu`, `role=menu`; must be a direct child of an interactive host; opens on `contextmenu` at the pointer; roving focus, submenu (`menu-item` > `dropdown-menu`), dividers | Host+right-click bound only — no programmatic open |
| `dropdown-menu` | `.lui-dropdown-menu`, `role=listbox`; anchored to the parent trigger element (`~anchor`/`~anchor_alignment`/`~anchor_offset`); typeahead, arrow nav, submenu triggers, group outside-press | Anchors to DOM parent, not an arbitrary rect |
| `menu-item` | `<button.lui-menu-item>` + `.lui-menu-item-icon/-label/-check` slots; `~text ~icon ~checked ~selected ~disabled ~shortcut_hint ~tooltip` + children | DOM shape ≠ `div[role=menuitem] > div.text` e2e contract |
| `menu-trigger` | `.lui-menu-item` trigger row (`~text ~icon ~label ~enabled`) | Present; unused in deps/ui |
| `select` | `<button.lui-select role=combobox aria-haspopup=listbox>` + sibling `dropdown-menu` listbox; `~label ~text ~placeholder ~disabled` + `menu_item` children | Picker plumbing wired by the backend |
| `combobox` | `.lui-combobox` + control/trigger/status + dropdown listbox; active-index + "No results" status managed by the backend | Filtering contract unverified — see gaps |
| `dialog` | backdrop + `section.lui-dialog[role=dialog][aria-modal]` + `-title`/`-body` slots; `~text ~description ~on_dismiss`; modal focus | No `role=alertdialog` variant, no close-slot |
| `alert` | `section.lui-alert[role=alert]` + `-title`/`-content` | Inline banner, NOT an alert-dialog |
| `toast` | `role=status data-state=open` in `.lui-toast-viewport`; `~duration ~label ~toast_class ~on_dismiss` + children | Owns timer/hover-pause/swipe/portal |
| `tooltip` | `<span.lui-tooltip role=tooltip>` leaf; `~text ~anchor ~anchor_alignment ~anchor_offset ~tooltip_delay`; children take `nothing` | Text-only; anchors to its own parent trigger |
| `sheet`, `drawer` | `section.lui-sheet` modal variant | Unused in our views (mobile) |
| `overlay` | stacking primitive | Used for toast close-button placement |

Kit machinery that already exists on web (lui_web_menu.ml): contextmenu
wiring on hosts, picker trigger events, roving `data-highlighted` focus,
typeahead, submenu hover-intent + ArrowRight/ArrowLeft nav, outside-press
group dismissal, focus return, combobox active-index/status, toast
viewport. **Every one of these has a hand-rolled twin in deps/ui today.**

## 2. Per-view audit

Emitters grouped by shared helper/host. "Rules deleted" cites the
`inventory-menus.md` sections; a rule only dies when its last emitter
stops emitting the class (or e2e/hook contracts move to `lui-*`/data
attrs). Bracketed numbers are rough; see §6.

| View / host | Elements today | Kit candidate | Rules deleted | Risk |
|---|---|---|---|---|
| `views/views_popup.ml` `show_menu`+`menu_level` (drives ~20 call sites in `views_head`, `views_builder`, `views_table`, `asset_dom`) | `popover ~at ~role:menu` + `menu_item` rows + `divider` + nested `popover ~anchor:right` submenus; **manual roving focus, submenu state, keydown router, hover highlight** | `dropdown_menu` + `menu_item` (+ `menu_item`>`dropdown_menu` submenus, `divider` separators) — backend owns focus/typeahead/submenu | menu chrome (33) + menu links (16) — shared | **High** — needs programmatic-anchor gap (§5.A); `MCustom` sub-content (rename editor), `MCheck` aria contract, `.menu-link`/`ac-N` e2e anchors |
| `views/views_popup.ml` `show_select` (`cp__select` palette; used by views_head/builder ~10 sites) | `popover` + `input.cp__select-input` + `#ui__ac.cp__select-results` + verbatim `<a.menu-link>` rows + multi-select + apply button | `combobox` | cp__select (19) partial (~8) | **High** — OCaml-side fuzzy filter, multi-select+apply, e2e `a.menu-link` contract, wrap extras (§5.E) |
| `views/views_popup.ml` `show_dialog` | `dialog` kind already | — (done) | — | — |
| `popups/popups_view.ml` autocomplete (`#ui__ac`, `.ls-ac-*`, `.menu-link`) | `popover` + hand rows/groups/mark-hints | none — stays custom (editor-owned input, async items, groups, `a.menu-link` anchors) | autocomplete (15): stays | — |
| `popups/popups_view.ml` context menu (`.ls-context-menu-content`, `.ls-cm-*`, `ui__dropdown-menu-*`) | `popover ~at ~role:menu` + `menu_item` + sub-`popover` + swatch/heading rows | `context_menu` children only — shell can't adopt (programmatic open at point, `Ci_sub` pickers) | context rows (10): stays; shares menu chrome | **High** — §5.A/B |
| `popups/popups_view.ml` preview popup (`.ls-preview-popup`) | `popover ~at` + page preview | none — content body | — | — |
| `popups/tooltip.ml` | singleton `popover` + `.ui__tooltip-content/-arrow` + `ls-tooltip-keys` | none — kit `tooltip` is text-only/parent-anchored (file header documents this); `~tooltip:` prop covers plain tips | tooltip rules stay | — |
| `toasts/toasts_view.ml` | `toast` kind + `overlay` + icon/desc/close children + compat `ui__toast*` classes | adopted — drop compat classes | toasts (33) → ~25–30 once `ui__toast*` dropped | **Low** — verify kit stacking/swipe parity (vars in hooks §7) |
| `dialogs/dialogs_view.ml` (host for all named dialogs) | `popover` cover + hand `.ui__dialog-overlay/-content/-close` + title + `ui__alert-dialog-*` confirm + prompt | `dialog` (scrim+role+focus built in); confirm/prompt need `role=alertdialog` + no-outside-dismiss (§5.C) | dialogs (84) → ~35–45 shell rules; `ls-dialog-<name>` (~16) re-express via `~style_class`/width props | **Medium** — autofocus/tabindex timer hack, `dom_query(".ls-dialog-"^name)` hook, nested-dialog scale |
| `dialogs/*` bodies: `login_view`, `plugins_view`, `plugin_readme`, `quick_add_view`, `ui_requests`, `settings_url_view`, `settings_page.modal_body`, `graphs/new_graph`, `importer`, `collaborators`, `exporter`, `export_view` body, `publish_view` | `ls-*`/`cp__*` body classes inside the shell | ride along — no shell work | body rules stay (content) | **Low** |
| `cards/cards_view.ml` flashcards modal | `cp__overlay-layer` + `cp__dialog-shell` + `.ui__dialog-overlay/-content/-close` + select/dropdown_menu already | `dialog` | dialogs share (~6) | **Low-Med** — scrim/content siblings by design (comment); mount-grace outside-press |
| `extension/pdf_toolbar.ml` docinfo modal | imperative `Web_dom` divs `.ui__dialog-overlay/-content/-main` appended outside the tree | convert to view + `dialog` | dialogs share (~4) | **Medium** — imperative DOM → view rewrite |
| `pages/page_menu.ml` | `popover ~at` + `Menu_item.el` rows (`div[role=menuitem]>div.text`) + separators + hand alertdialog | `context_menu`/`dropdown_menu` blocked by documented e2e DOM contract (file header); confirm → `dialog`+alertdialog gap | page-menu rules (in misc 39) partial | **High** — e2e contract decision (§5.D) |
| `sidebar/left_sidebar_view.ml` | plugins dropdown `popover ~role:menu`, x-menu `popover ~at`, repos `popover ~anchor:below` + `Menu_item.el` + `.cp__repos-*` rows | `dropdown_menu` (repos/plugins anchored); x-menu at-point gap | menu chrome share; repos-list rules partial | **Medium** — `ls-anchor-cx` flip math, custom repo rows |
| `sidebar/right_sidebar_view.ml` `item_menu` | `popover ~at` + `Menu_item.el` + `divider.menu-separator` | `dropdown_menu` anchored to the item button | menu chrome share | **Medium** — at-point→button anchor change |
| `core/menu_item.ml` `dots_menu` (graphs_view ×2, collaborators) | ghost button + `popover ~anchor:below` + `menu_item` + manual open state | `dropdown_menu` child of the button — textbook fit | menu chrome share | **Low** |
| `shell/chrome.ml` `rtc_details_popup` | imperative `Web_dom` `.ui__dropdown-menu-content` appended to body + manual outside-click/Escape | view + `dropdown_menu`/`popover` anchored to cloud btn | menu chrome share + `cp__rtc-sync-indicator` stays | **Medium** — imperative→view rewrite |
| `shell/chrome.ml` `help_menu_popup` (`cp__sidebar-help-menu-popup`, `ls-hm-*`) | fixed `box` rows + dividers toggled by `help_open` | `dropdown_menu` anchored to help button (rows carry icons — `menu_item ~icon` covers) or stays if meta/footer rows force custom | help menu (8) partial ~4 | **Low-Med** — version/meta rows aren't menu items |
| `settings/settings_view.ml` `lang_menu`, `settings_page.ml` `dfmt_menu`, `export_view.ml` `select_el` | `select` + `dropdown_menu` + `menu_item` with compat `ui__select-*/ui__dropdown-menu-*` classes | adopted — drop compat classes, use `select`'s own listbox | menu chrome share + `.ui__select-trigger` rules | **Low** |
| `settings/settings_page.ml` appearance popup | `ls-popup-backdrop` + `popover` theme/mode swatch panel | keep `popover` (it's a positioned panel, not a menu) or `dialog` | misc partial | **Low** |
| `properties/properties_dialog.ml` | `dialog` kind (no anchor) / `popover ~at` (anchor) already | adopted | `ls-property-dialog` rules stay (body) | **Low** |
| `properties/properties_select.ml` (`cp__select` twin) | `text_field` + `list` + `list_item` w/ icons, tips, checks, "New option", async `on_search` | `combobox` | cp__select share | **High** — async items + new-option row + Enter-picks-first (§5.E) |
| `properties/properties_menu.ml` `.ls-property-dropdown` | `popover` card + menu_items + form rows (name edit, type, toggles) | keep `popover`; not a menu — a form panel | menu chrome share only | **Low** — mostly content |
| `properties/properties_value.ml` pickers (`ls-datetime`, `ls-property-select-popup`, extends multi-toggle) | `popover ~anchor ~role:menu` + custom pickers | keep `popover`; select-style ones → `combobox` later | stays | **Low** |
| `properties/properties_popup.ml` | generic `popover ~at`/anchored mount helper | adopted | — | — |
| `editor/editor_commands.ml` popups (`#date-time-picker`, `.ls-editor-link-form`, `ui__calendar*`) | `popover` + calendar/link form + inner `[role=menu]` overlays (`ls-date-month-menu`, `ls-repeat-choice-menu`) | calendar/link forms stay custom; inner menus → `menu_item` (already) + optional `dropdown_menu` shell | stays | **Low** |
| `editor/code_mirror.ml` lang picker | imperative `Web_dom` `.ls-code-lang-picker` + `ui__dropdown-menu-item` rows appended to `.cp__overlays` | `Views_popup.show_menu` or `popover ~at` | menu chrome share | **Low** |
| `icon/icon_picker.ml` (`cp__emoji-icon-picker`, `ls-ep-*`) | `popover` via `properties_popup` + custom emoji/icon grid + tabs | keep `popover` + custom body | stays | **Low** |
| `blocks/selection_bar.ml` | `popover ~at` action toolbar | keep `popover` (floating toolbar, not a menu) | stays | **Low** |
| `views/views_head.ml` `cp__filters*` filter chip editor | `P.show_custom` popover + `cp__filters*` chips + `cp__select` value pickers + `select` (`ls-vf-logic`) | rides helpers; `select` already used for logic picker | cp__filters rules (other family?) — partial | **Medium** — custom chip editors |
| `dialogs/login_view.ml` `ui__alert` error box | hand `.ui__alert`/`.ui__alert-description` inside dialog body | `alert` kind | ~2 | **Low** |
| `app/worker_events.ml`, `core/web_dom.ml`, `editor/editor_keys.ml`, `popups/popups_state.ml` | DOM probes/key routers reading `#ui__ac`, `.ui__dropdown-menu-item`, `.ls-context-menu-content`, `.ui__ac-group-name`, `.ui__popover-content` | not views — hooks to re-point at `lui-*`/data attrs on adoption | n/a | **Medium** — update with each migration |
| `sdk/sdk_ui.ml`, `sdk/plugin_host.ml`, `views_db.ml`, `sidebar_state.ml`, `settings_*.ml`, `graphs/rtc_*.ml`, `render/pdf_annotation.ml`, `worker_events.ml` | `Toast_push` / `ls:toast` / `ls:open-dialog` event producers | ride along — API unchanged | — | **Low** |
| `core/overlay.ml` | outside-press hit-index + z-order helpers | superseded per-surface by popup layers/`~on_dismiss` | — | **Low** |
| `shared/cmdk_view.ml` | — | **EXCLUDED — T4** | — | — |

## 3. Adoption order

Ordered by risk-adjusted CSS payoff. Each step is independent; the
shared helpers convert many call sites at once.

1. **Drop compat `ui__*` classes on already-migrated kinds** —
   `toasts_view` (`ui__toast*`), `settings_view`/`settings_page`/`export_view`/`cards` selects+dropdowns (`ui__select-*`, `ui__dropdown-menu-*`), `properties_dialog` (`ls-property-dialog` stays as body). Pure class/token swap after verifying kit styling parity. Toasts ≈25–30 rules, select/menu share of menu chrome.
2. **`core/menu_item.ml` `dots_menu` → `dropdown_menu`** — deletes the manual open-state + anchored popover for graphs/collaborators dots menus.
3. **`views_popup.show_menu`/`menu_level` → `dropdown_menu`+`menu_item`** — the single biggest win: deletes hand-rolled roving focus, submenu state, keydown router across ~20 call sites. Blocked on §5.A (anchor to non-parent element) or restructuring so the trigger is the DOM parent; `MCheck` → `menu_item ~checked`, `MSep` → `divider`, `MSub` → `menu_item`>`dropdown_menu`, `MCustom` → needs custom sub-content support (§5.H).
4. **`dialogs_view` named dialogs → `dialog` kind** — scrim/card/title/scroll/close all come from the kind; `ls-dialog-<name>` sizing rides `~style_class` or typed sizing props. Then `cards_view`, `pdf_toolbar` (rewrite imperative DOM → view), `page_menu` confirm (needs §5.C alertdialog).
5. **Sidebar menus → `dropdown_menu`/`context_menu`** — `left_sidebar` repos/plugins (anchored), `right_sidebar` `item_menu` (re-anchor to button), x-menu needs §5.A.
6. **`chrome.ml` imperative popups → views** — `rtc_details_popup` → anchored `dropdown_menu`; `help_menu_popup` → `dropdown_menu` (verify meta rows fit `menu_item`).
7. **`code_mirror.ml` lang picker → `show_menu`.**
8. **`properties_select` → `combobox`** — after §5.E (async items/new-option) is resolved; otherwise keep.
9. **`views_popup.show_select` → `combobox`** — same §5.E blocker, plus `a.menu-link` e2e anchors. Largest single remaining surface.
10. **Tooltips** — keep singleton service; opportunistically replace `data-tooltip` attrs with `~tooltip:` on kit elements.

## 4. Stays custom (no kit kind covers the need)

- **`popups_view` autocomplete** — input lives in the editor, items are
  async/grouped with mark-highlighted labels and per-row info/hint
  spans; `combobox` owns its input and filter model. Could still slim
  rows to `menu_item` if the `a.menu-link#ac-N` e2e anchors are ported.
- **`popups_view` context menu** — programmatic open at a point from a
  state machine, custom swatch/heading rows, `Ci_sub` opens
  icon/emoji picker sub-content. No host-bound trigger. (§5.A/B/H)
- **`page_menu`** — documented e2e DOM contract
  (`div[role=menuitem] > div.text`, `div[role=alertdialog]`); revisit
  only with an e2e update or a kit DOM-compat mode. (§5.D)
- **`tooltip.ml` service** — delegates over arbitrary foreign elements;
  kit `tooltip` is text-only and parent-anchored. (§5.F)
- **`icon_picker`** — popover shell already; emoji/icon grid body is
  bespoke.
- **`editor_commands` calendar/link-form popups** — bespoke pickers;
  only their inner `[role=menu]` overlays overlap the family.
- **`selection_bar`** — a floating toolbar, not a menu.
- **`properties_menu` / `properties_value` pickers** — form panels and
  datetime/multi-toggle pickers hosted in `popover` cards.
- **`settings_page` appearance popup** — `ls-popup-backdrop`+panel;
  keep `popover` or evaluate `dialog` later.
- **`views_head` `cp__filters` chip editor** — bespoke filter builder.

## 5. Kit feature gaps (beyond the cmdk capability list)

1. **Programmatic menu open at a point/rect** — `context_menu` is bound
   to a host `contextmenu` event; `dropdown_menu` anchors to its DOM
   parent. All Logseq's real menus open at a computed point or at a
   *foreign* element's rect from a state machine (`show_menu`,
   `cm_popover`, `page_menu`, `item_menu`, `x-menu`). Needed: either
   `~at`/rect anchoring on `dropdown_menu`, or a menu-surface kind
   embeddable in `popover ~at`. This is the #1 blocker for the menu
   family.
2. **Menu surface inside `popover`** — same gap viewed differently: a
   `.lui-dropdown-menu`-style card kind that provides item
   chrome + focus/typeahead without owning the trigger/anchor contract.
3. **`alert-dialog` semantics** — no kind emits `role=alertdialog`;
   confirm/prompt need non-dismissable scrim + footer autofocus.
   Could be `dialog` props (`dismissible`, initial-focus, role
   override) rather than a new kind.
4. **Kit DOM shape vs e2e/contracts** — `menu_item` renders
   `<button.lui-menu-item>` with icon/label/check spans; e2e expects
   `div[role=menuitem] > div.text`, `a.menu-link#ac-N`, `.chosen`.
   Decide: port e2e to kit DOM (preferred — it's the design system)
   or add a compat emit mode. `page_menu.ml`'s header documents the
   block.
5. **`combobox` doesn't cover our pickers** — needs app-driven async
   items (`on_search` in `properties_select`), a "New option:" create
   row, multi-select with an apply footer (`show_select`), custom row
   layout (icon+tip+check), and app-owned fuzzy ranking (kit filters
   internally). Verify whether `combobox` children/`on_input` expose
   enough control; if not, these two surfaces stay custom.
6. **`tooltip` is text-only + parent-anchored** — no support for
   arbitrary-element delegated tooltips or rich content (keycap rows);
   the service tooltip stays a `popover`. Fine as designed — gap only
   if we wanted to delete `tooltip.ml`.
7. **Custom sub-content in menus** — `MCustom` (inline rename editor),
   `Ci_sub` → `Sub_picker` (icon/emoji picker as submenu), menu
   footers/headers (`repos-list` header, help-menu version meta). Kit
   submenu = `menu_item` containing `dropdown_menu` of items;
   arbitrary sub-panel support is unverified.
8. **Cross-references to re-point on adoption** —
   `popups_view`/`popups_state` keynav queries
   (`.ui__dropdown-menu-item:not([data-disabled])`, sub-trigger wiring),
   `worker_events` overlay-open probe (`#ui__ac, .cp__cmdk__modal,
   .ui__popover-content, .ls-context-menu-content, #date-time-picker,
   .ls-editor-link-form, .ls-property-dialog`), `web_dom` sticky-group
   scroll math (`.ui__ac-group-name`), `dialogs_view` autofocus
   (`dom_query(".ls-dialog-"^name)` + `[autofocus]`), gpui
   `logseq_ext.rs` registrations for the same `ui__*`/`ls-*` classes.
   Each migrated view must keep these attrs/classes via `~data_attrs`
   or the readers must switch to `lui-*` selectors — pick one
   convention per surface.

## 6. CSS deletion estimate vs `inventory-menus.md` (278 rules)

| Section | Rules | Fate under full adoption |
|---|---|---|
| Popup plumbing (`.lui-popup-*`) | 21 | ~15 delete if the backend's own `lui.css` already ships them; z-index/portal overrides may stay (~6) |
| Menu chrome (`ui__dropdown/context-menu`, `ui__select`, `ui__popover`, `.lui-menu-item-*` parity, `.menu-links*`, `.ls-context-menu-content`) | 33 | ~30 delete once every emitter is on `dropdown-menu`/`menu-item`/`select` kinds (hook re-points required) |
| Menu links (`.menu-links-wrapper`, `.menu-link`, `.chosen`) | 16 | ~10 delete; `a.menu-link` anchors keep ~6 alive until e2e moves |
| Autocomplete (`.ls-ac-*`, `#ui__ac*`, `cp__commands-slash`) | 15 | stays — custom picker |
| Context rows (`.ls-cm-*`) | 10 | stays — custom swatch/heading rows |
| `cp__select*` palette | 19 | ~8–12 delete if `combobox` covers show_select/properties_select; else stays |
| Dialogs (`ui__dialog*`, `ui__alert-dialog*`, `ls-dialog-*`, auth/login bodies, misc) | 84 | ~35–45 shell rules delete; per-dialog `ls-dialog-<name>` sizing (~16) stays as `~style_class` tokens or typed sizing; body rules stay |
| Toasts (`ui__toast*`, viewport) | 33 | ~25–30 delete after compat classes drop (kit `toast` styling) |
| Misc overlay bodies (repos-list, page-menu, appearance-popup, dots-menu, inputs, text-muted/skeleton, rtc indicator) | 39 | ~10–15; the rest are content rules |
| Help menu (`cp__sidebar-help-*`, `ls-hm-*`) | 8 | ~4 if dropdown-menu adopted |
| **Total** | **278** | **~140–160 deletable** (≈50–60%), concentrated in menu chrome + dialog shells + toasts |

The remaining ~120 rules are content CSS (dialog bodies, autocomplete
rows, filter chips, auth forms, emoji picker, calendar) that belongs to
the non-overlay families or to stay-custom surfaces.

## 7. Hooks that MUST survive (restated for this family)

`data-highlighted/-disabled/-open/-selected/-state`, `.lui-popup-portal/
-positioner` + `data-cover`, `data-starting/ending-style`,
`.ls-anchor-cx` anchor, `ls-dialog-<name>` + `aria-labelledby`,
`.ui__toast` stacking vars (`--toast-index` etc.) while compat classes
live, `data-base-ui-inert`, `.ls-dnd-a11y/-live`, `.cp__select*` +
`.menu-link.chosen` + `.type-icon`, `.menu-links-wrapper`/`menu-link` gpui
twins, `.ui__dropdown-menu-sub-trigger/-sub-content`, `.lui-toast-viewport`,
`.cp__sidebar-help-menu-popup`, `.cp__rtc-sync-indicator` + `.on.idle`,
`#ui__ac`/`#ui__ac-inner`, `ac-N` row ids, `.ui__ac-group-name`,
`#date-time-picker`, `.ls-editor-link-form`, `.ls-property-dialog`,
`.ls-hidden-input`.

## 8. Counts

- Views/host files audited: **34** (emitters) + 8 event-producer/state files
- Surfaces fully adoptable today: **~10** (dots_menu, settings/export/cards
  selects+dropdowns, toasts compat drop, dialogs_view named dialogs,
  cards/pdf_toolbar/dialog+login alert, left-sidebar anchored menus,
  code_mirror picker, help menu)
- Adoptable after one kit gap lands: **~8** (show_menu/menu_level,
  right-sidebar item_menu, x-menu, page_menu shell, cm submenu chrome,
  show_select, properties_select, filters select) — mostly §5.1/§5.3/§5.5
- Stay custom: **~12** (autocomplete, context-menu shell, preview popup,
  tooltip service, page_menu rows, icon picker, calendar/link forms,
  selection bar, property form panels, datetime pickers, appearance
  popup, filters editor)
- Estimated deletable rules: **~140–160 of 278**
- Already on kit kinds (no work beyond compat-class cleanup):
  `toasts_view`, `views_popup.show_dialog`, `properties_dialog`,
  `properties_popup`, `settings_view`/`settings_page`/`export_view`/
  `cards` selects+dropdowns, `views_head` `ls-vf-logic` select,
  `selection_bar` popover, `icon_picker` popover.
