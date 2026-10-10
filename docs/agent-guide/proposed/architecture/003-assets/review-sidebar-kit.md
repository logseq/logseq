# Kit-adoption review — sidebar & app shell

Read-only review for `2026-10-10-003-shared-ui-visual-design.md`, Task 5 batch
"Sidebar and shell". Question per hand-rolled view: does a LUI kit component
already cover this — and what does the kit version delete?

Sources of truth:

- Kit catalog: `lui/schema/components.json` (88 node kinds at the pinned
  a8cc58c), `lui/src/lui_elements.ml`, `lui/src/lui_split.mli`,
  `platform/web/src/lui.css`, `platform/web/melange/widgets/lui_web_split.ml`,
  `platform/apple/.../LUIDrawerView.swift`,
  `platform/gpui/crates/lui-gpui/src/kinds.rs`.
- Views: `deps/ui/src/shell/chrome.ml`,
  `deps/ui/src/sidebar/{left_sidebar_view,right_sidebar_view,sidebar_state}.ml`.
- CSS inventory: `inventory-sidebar.md` (~194 rules in
  `resources/css/lui-core.css` ~229–1424: app shell 21, header 29, left
  sidebar ~102, right sidebar 42) + ~24 gpui `logseq_ext.rs` flat-class
  registrations that twin the same rules.

## 1. Kit coverage map

Today the family emits **zero** kit components — every view is
`box`/`row`/`column`/`text`/`button`/`link` + `style_class`, with `button`,
`link`, `icon`, `kbd`, `spinner`, `progress`, `scroll`, `separator`,
`menu_item`, `popover` already in use as primitives. The kit components that
match this family's structures:

| Kit kind | What it owns | Fit in this family |
|---|---|---|
| `split ~value ~value_signal ~resize_duration ~resize_easing ~resize_origin ~on_resize [a;b]` | Fraction split with draggable divider, px `min_width` clamps per child, keyboard Left/Right/Home/End, ResizeObserver re-layout; gpui → ResizablePanelGroup/dock | **Left sidebar docked mode + both resizers + right sidebar pane.** Fraction model, not px — see gap G1 |
| `drawer ~width ~selected ~on_toggle [main;panel]` | Apple: full sidebar drawer — `NavigationSplitView` pinned (docked) + overlay w/ scrim, edge-swipe drag (`LUIDrawerGeometry`), suppression of `drawer-toggle` chrome. gpui: modal layer (backdrop + right-edge card, Dismiss on outside press). web: container class only — **no overlay behavior yet (gap G2)** | **Left sidebar overlay mode** — the whole `is-open`/`shade-mask`/`is-touching`/touch-drag apparatus |
| `accordion ~text ~selected ~selected_signal ~accordion_height ~on_toggle` | Disclosure group: summary + built-in rotating chevron + height-animated content; gpui renders natively | **Favorites / Recents content groups** (header is text+chevron only). Navigations group needs a header action slot — gap G4 |
| `toolbar ~orientation ~toolbar_gap ~placement` | Roving-focus button strip, overflow scroll, separator styling; gpui native | **`.cp__header` .r action cluster + `.cp__right-sidebar-settings` strip** |
| `breadcrumb ~label [items]` | Crumb trail container | **Header `head-bc` trail + sidebar-item `breadcrumb`** (replaces hand-rolled text+"/" loops in two places) |
| `context_menu` + `~on_context_menu` | Right-click menu mounted at the press point; gpui overlay + web `web_open_context_menu`; children `menu_item`/`menu_trigger`/`divider` only | **lp_menu (favorites/recents rows) + right-sidebar item menu** — deletes the document-level `contextmenu` dispatcher |
| `dropdown_menu ~anchor ~anchor_alignment ~anchor_offset ~on_dismiss` | Anchored menu layer (menu children only); submenu via `menu_trigger` | **nav-edit menu + sidebar-item menu** (pure item lists). Composite menus stay `popover` — see §5 |
| `menu_item ~checked ~icon ~shortcut_hint ~role` | role=option/checkbox row, checked state, keycap hint | **`menu_sc`/`shortcut_hint` helpers (~65 LOC of hand-built kbd rows)** |
| `list_item ~icon ~text ~selected ~tree_level ~expanded ~separator ~swipe_actions ~on_context_menu` | Interactive list row; **web renders `<button>` — nested interactives forbidden** | Nav rows (`.item`) yes; page rows (`.link-item` with inner link+dots) blocked — gap G5 |
| `list_section ~header ~footer` | Section grouping; `~header` takes an arbitrary element emitter | **Navigations group** (title + `as-edit` icon, non-collapsible affordance) |
| `scroll`, `progress`, `separator`, `spinner`, `button`, `link`, `icon`, `kbd`, `popover` | Already used here | Keep |
| `Lui_split` extension (`split-view/branch/pane/tab`) | Full tabbed dock (tab strip, dividers, drop-to-split, tab move/close); gpui → `DockArea` | **Not a fit**: app sidebars are not tabbed docks. Note for future multi-pane layouts |
| `sheet ~detents ~on_dismiss` | Bottom/right-edge sheet w/ swipe dismiss + backdrop | **Right sidebar on phone widths** — optional; `split`/`drawer` cover the base |
| `resizable ~resizable_width` | CSS `resize:horizontal` box (web) | Not a fit: wrong affordance (corner handle), no events; `split` wins |
| `tabs`/`bottom_tabs`, `tree`, `status_bar`, `card`/`panel`, `select`/`combobox`, `avatar`, `dialog` | — | No matching surface in this family (`.page-tabs` hosts a single fixed objects panel, not a tab strip; `.sidebar-item` needs a collapsible card — no kit collapse-with-custom-header exists, gap G4) |

## 2. Per-view table

Elements = `Lui_elements` constructor call sites + imperative DOM blobs.
Rules deleted = rows in `inventory-sidebar.md` whose rules disappear when the
view moves to the kit component (each row ≈ 1–8 rules).

| View (file · section) | Elements today | Kit candidate | Inventory rules deleted | Behavior risk |
|---|---|---|---|---|
| `chrome.ml` · `#left-sidebar` wrapper + `.shade-mask` + `.left-sidebar-resizer` | ~6 | `drawer [main;panel]` overlay + `split [sidebar;main]` docked | ~40 of 102 left-sidebar rules: `.cp__sidebar-left-layout`+`.is-open`+`.is-touching`+`:before`, `.shade-mask`(+dark), `.left-sidebar-inner`+`.wrap`, `≥sm` docked block, `.left-sidebar-resizer`; `#main-container .is-left-sidebar-open` padding | **G2**: web `lui-drawer` is a bare container — overlay/scrim/swipe must land in lui web first (Apple+gpui already have it). **G1**: `split` value is a fraction; persisted `ls-left-sidebar-width` is px [240,460] — needs value↔px mapping + no per-pane `max_width` clamp today. Hooks `.is-open`/`.ls-left-sidebar-open` must keep emitting as semantic attrs |
| `chrome.ml` · `#right-sidebar` wrapper + `.resizer` | ~3 | `split` second pane (or `sheet` on phone) | ~8 of 42 right-sidebar rules: `.cp__right-sidebar` open/closed/max-w-60vw, `.resizer`+hover/focus/active | Fraction ↔ persisted % model matches well (right sidebar already persists a 0.1–0.7 viewport ratio). Closed state = don't mount the second pane |
| `sidebar_state.ml` · resizer machinery (`on_resizer_*`, `sync_*_width`, `set_right_width`) | ~120 LOC | `split ~on_resize` → storage write | — (OCaml, not CSS) | Persistence stays app-side; drag clamps move to `min_width`/fraction bounds. Deletes `dom_apply_left_sidebar_width` service channel + `--ls-left-sidebar-width` plumbing |
| `sidebar_state.ml` · edge-swipe machinery (`on_doc_touch*`, `apply_touch_drag`, `clear_touch_drag`) | ~150 LOC | `drawer` native gesture | ~3 rules (`.is-touching`, transitions) | **Apple: deleted outright** (`LUIDrawerGeometry` = same math). Web: blocked on G2 — keep until web drawer lands, or accept swipe-less overlay on web |
| `sidebar_state.ml` · `on_doc_contextmenu`, `im_xy`, `lp_ctx`, `on_doc_click` dismiss half | ~90 LOC | `~on_context_menu` + `context_menu`/`dropdown_menu` + `~on_dismiss` | ~3 rules | `context_menu` children restricted to menu kinds and it hosts only on control kinds — rows keep emitting `ContextMenuPress` and the menu mounts at overlay root; pointer-flip behavior now lives in the kind's positioner. The `a[href='#']`/`a.page-ref` nav half of `on_doc_click` stays (~20 LOC) |
| `chrome.ml` · `.cp__header` bar (`.l`/`.r` slots, buttons, `head-bc`) | ~30 | `toolbar` (.r cluster), `breadcrumb` (trail), keep `row` bar as recipe | ~10 of 29 header rules: `.button`, `.button.icon`, `.cp__header .button`, `.ui-items-container .button`, `.cp__header .r a/button` opacity, `.breadcrumb` bits | Web `toolbar` is a bordered pill — apply to the action cluster only, not the full-width sticky bar (bar stays recipe + `-webkit-app-region` deco). `.cp__header > .l` sidebar-width reservation still needed to align controls over the docked pane |
| `chrome.ml` · `search-index-progress` chip | ~4 | `progress` kind (already used) + row | ~3 rules (`__bar` track + `::before` fill → kind-owned `--lui-progress-position`) | Low; chip chrome (icon+text) stays a row |
| `chrome.ml` · `rtc_indicator` + `open_rtc_details` popup | ~8 + ~160 LOC imperative `Wd.create_element` | `popover` + declarative content (no kind swap possible — it's imperative DOM) | 0 sidebar rules (menu surface lives in the menus inventory); deletes the only imperative blob in the family | Medium: async per-row title enrichment + `<details>` trees need restructuring into reactive children; outside-press/Escape come free via `~on_dismiss` |
| `chrome.ml` · `help_area` + `help_menu_popup` | ~15 | `popover` + `menu_item`s | ~0 (popup rules are in the menus family) | Low — items are already icon+text+action rows |
| `chrome.ml` · `main_content` scroll + `.cp__sidebar-main-content` column | ~6 | `scroll` (in use) + content-column recipe | ~4 app-shell rules (`.scrollbar-spacing`, `#main-content` calc, `#main-content-container` layout half) | Low; container-type/container-query + scrollbar-color stay web deco |
| `chrome.ml` · `overlays`, `not_found_page`, `skip_to_main` | ~20 | keep: popups/dialogs already self-portal; 404 → recipe | ~2 rules | None |
| `left_sidebar_view.ml` · `graphs_selector` + `repos_menu` | ~12 | trigger `button` + `popover` (composite content: "Switch to" list + remote rows + quick actions) | ~2 rules (`.cp__graphs-selector` row internals → recipe) | `dropdown_menu` accepts only menu children → popover stays |
| `left_sidebar_view.ml` · `nav_group` (Navigations + `as-edit`) | ~11 | `list_section ~header:(row title+edit)` — **not** `accordion` (no header slot, gap G4) | ~8 rules: `.sidebar-header-container` padding, `.hd` for nav, `.wrap-th`, `.as-edit`, `.enter-show-more > .b` (keeps class hook), `.sidebar-navigations` gap | Low-medium: `~header` slot exists and takes any element; `.enter-show-more` hover reveal still needs the group-hover gap (G6) — keep class, lose rule shape |
| `left_sidebar_view.ml` · `content_group` (Favorites, Recents) | ~10 | `accordion ~text ~selected ~on_toggle` | ~14 rules: `.sidebar-content-group(-inner)` structure, `.hd`, `.bd`+`.is-expand`, `.more`+rotate, `.rotating-arrow`, disclosure transitions | Medium: `has-children` hook → data attr; `env_css_transform_icons` chevron swap deleted (chevron is backend-owned); `always_bd` empty-ul quirk → conditional child |
| `left_sidebar_view.ml` · `nav_link`/`nav_items` rows (`.item`, `active`, shortcut hint, due-count pill) | ~8 | `list_item ~icon ~text ~selected ~on_press` (+kbd/pill children) | ~6 rules: `.item`, `.item.active/.thumb`, `#left-sidebar a,.item` opacity, `.page-icon` | Low: `list_item` is a container — pill/kbd ride as children. Flashcards pill uses `Lui_elements.dyn` child — works |
| `left_sidebar_view.ml` · `page_item_el` rows (`.link-item` + dots + `data-lp-*`) | ~6 | `list_item` **blocked** → nav-row recipe | ~5 rules pending G5: `.link-item`, `.lui-link-content`, `.page-title` ellipsis, `.sidebar-page-actions` | G5: web `list_item` = `<button>`; inner `link`+dots `button` = nested interactives. Needs a list-item actions/trailing slot, or emit `link` outside the row. Hover-reveal of dots still G6 |
| `left_sidebar_view.ml` · `lp_menu`, `nav_edit_menu`, `menu_sc`, `shortcut_hint` | ~18 | `context_menu`/`dropdown_menu` + `menu_item ~checked ~icon ~shortcut_hint` | ~4 rules (`.keyboard-shortcut` cluster, `.sidebar-page-actions`); deletes `menu_sc`+`shortcut_hint` helpers (~65 LOC) | Medium: `menu_item ~shortcut_hint` replaces the kbd-combo rows outright; `ls-anchor-cx`/`ls-anchor-top` flip math → kind positioner |
| `left_sidebar_view.ml` · `plugins_menu`, `plugins_toolbar` | ~12 | stay `popover` + `button` (plugin slot-injection by element id is app-domain) | 0 | None — composite menu + `Plugin_host.slot_id` mount points stay custom |
| `right_sidebar_view.ml` · `topbar` (Contents/Page graph/Help + dev items) | ~8 | `toolbar ~orientation:`horizontal`` | ~4 rules: `.cp__right-sidebar-settings`+`-btn`, hide-scrollbar deco stays | Low: buttons already `button` kind; toolbar adds roving focus + overflow scroll |
| `right_sidebar_view.ml` · `item_header` + `item_title` + `breadcrumb` | ~14 | `breadcrumb` kind for the trail; header row stays custom (icon+title+more+close) | ~3 rules (`.breadcrumb`/`.breadcrumb-item`, `.rotating-arrow` → accordion-style disclosure icon or keep `app` icon) | Low: replaces the recursive text+"/" builder and the second copy in `chrome.ml` |
| `right_sidebar_view.ml` · `sidebar_item` + `item_body` | ~25 | **stays custom** — collapsible card with typed header (gap G4: no kit collapse-with-actions); `.item-type-*`/gradient → sidebar-card recipe | ~2 rules (`collapsed` flex swap → typed) | Blocks/pages/properties/views/refs/cmdk bodies are domain content — see §5 |
| `right_sidebar_view.ml` · `item_menu` | ~10 | `context_menu`/`dropdown_menu` + `menu_item` + `divider` | ~2 rules; deletes `im_xy` + `item_menu_host` plumbing | Same context-menu path as lp_menu |
| `right_sidebar_view.ml` · `help_pane` | ~18 | `list_section` per section, or recipe | ~4 rules (`ls-hp-*`; `display:list-item`+circle marker is a gap) | Low; content is static links |
| `right_sidebar_view.ml` · `sidebar_props_row`, `object_tabs_host`, drop indicator | ~10 | stays custom (domain hosts; dnd) | ~1 rule (`::after` bar → real node) | Drag/reorder + drop indicator have no kit analog — see §5 |

## 3. Inventory-rule accounting (~194 total, ~24 gpui twins)

| Section | Rules | Deleted by kit | Shrinks to recipe tokens/hooks | Stays (deco/platform/dead) |
|---|---|---|---|---|
| App shell | 21 | ~7 (`.scrollbar-spacing`, `#main-content`, `#main-container` sidebar padding, `#app-container`/`#left-container` as split panes) | ~9 (content column, wide-mode, margin-less, not-found, containers) | ~5 (scrollbar colors, app-region, container queries) |
| Header | 29 | ~10 (`.button`, `.button.icon`, `.cp__header .button`, `.ui-items-container .button`, `.r a/button` opacity, `__bar` fill, breadcrumb bits) | ~9 (`.cp__header` bar+slots, `> .l` reservation, progress chip, breakpoint variants) | ~10 (app-region, `.cp__header-logo`+electron-mac dead, hover deco, transitions) |
| Left sidebar | ~102 | **~48** (`.cp__sidebar-left-layout` cluster, `.shade-mask`, `.is-touching`, `:before`, `.left-sidebar-inner`/`.wrap`, ≥sm docked block, `.left-sidebar-resizer`, `.hd`/`.bd`/`.more`/`.rotating-arrow`/`.is-expand`, `.item`+`.active`, `.sidebar-header/contents-container`, `.sidebar-navigations`, `.page-icon`, opacity rules, hover cluster kind-owned half) | ~30 (graph-selector row, `link-item` page rows if G5 unresolved, `.wrap-th`/`.as-edit` header slots, `.enter-show-more`, `.keyboard-shortcut` reveal, `.sidebar-page-actions`, `.page-title` ellipsis, `has-children`/`is-expand`→attrs) | ~24 (scrollbar deco, `:before` variant if G2 lags, group-hover reveals, transitions, dark deltas) |
| Right sidebar | 42 | ~14 (`.cp__right-sidebar` open/closed/maxw, `.resizer` cluster, `.cp__right-sidebar-settings`+btn, breadcrumb) | ~18 (`.sidebar-item` card + type variants + collapsed, `.sidebar-item-list`, `.sidebar-panel-content`, `.page`/`.page-inner`, `.ls-hp-*`, inner bg token) | ~10 (`.cp__right-sidebar-topbar` sticky+app-region, `.sidebar-drop-indicator`, dark steps, gradient `.item-type-block`) |
| **Totals** | **~194** | **~79 rules (~41%)** | **~66 (~34%)** | **~49 (~25%)** |

Plus the OCaml deletions the table doesn't count: ~330 LOC of resizer/touch/
context-menu machinery in `sidebar_state.ml`, ~65 LOC of kbd-combo helpers,
~160 LOC of imperative RTC popup DOM, and **all ~24 gpui `logseq_ext.rs`
sidebar/shell flat-class registrations** — kit kinds render natively on gpui
(Split→ResizablePanelGroup/dock, Drawer→modal layer, Accordion→disclosure,
Toolbar/Breadcrumb/ListSection/ListItem/DropdownMenu/ContextMenu all in
`kinds.rs`), so the dual-track class twins collapse to zero.

## 4. Recommended adoption order

1. **`split` for both resizers + sidebars' docked layout** — largest single
   win (~18 CSS rules + ~120 LOC + the `apply_left_sidebar_width` channel),
   self-contained. Do the fraction↔px persistence mapping once, in
   `sidebar_state.ml`'s `~on_resize` handler. Needs G1 decision first.
2. **`context_menu` + `~on_context_menu` for lp_menu and item_menu** —
   deletes the document-level `contextmenu` dispatcher and `lp_ctx`/`im_xy`
   plumbing; standardizes both context menus on one mechanism.
3. **`accordion` for Favorites/Recents** — clean text-header fit; deletes the
   `is-expand`/`has-children`/`rotating-arrow`/`env_css_transform_icons`
   apparatus. Navigations goes to `list_section ~header` in the same pass.
4. **`menu_item ~shortcut_hint` + `dropdown_menu` inside the pure menus**
   (nav-edit, lp, item) — deletes `menu_sc`/`shortcut_hint`; composite menus
   (repos, plugins, help) stay `popover`.
5. **`toolbar` for header `.r` cluster + right-sidebar settings strip** —
   small rule win, real a11y win (roving focus).
6. **`breadcrumb` kind** — trivial, deletes both hand-rolled trails.
7. **`drawer` for the left-sidebar overlay** — after G2 lands in lui web;
   deletes the biggest block of remaining machinery (~150 LOC + ~16 rules).
   Until then keep `on_doc_touch*` for web.
8. **`list_item` for `.item` nav rows** — after G5 is resolved or with the
   dots-button moved to `~on_context_menu` only; otherwise nav-row recipe.
9. **Declarative rewrite of `open_rtc_details` into `popover`** — orthogonal
   cleanup, no new kind needed.

## 5. Must stay custom (kit coverage ends here)

- **`sidebar_state.ml` model** — items/collapse/favorites/recents/nav_checked/
  menu signals, storage persistence (widths now written from `~on_resize`).
- **Right-sidebar item bodies** — `Tree.block_row`, `Add_button`,
  `Properties_area.sidebar_area`, `Views_view.view` (objects tab),
  `Page.references_view`, `Cmdk_view.sidebar`, help pane links: domain
  content, not chrome.
- **Plugin host slots** — `Plugin_host.slot_id` element-id injection in the
  plugins menu/toolbar; no kit analog.
- **Drag/reorder** — `.sidebar-drop-indicator` + `sidebar_state` dnd path;
  kit has no generic reorder (the `split-view` extension's tab-move is
  dock-internal). `::after` bar → emit a real indicator node.
- **Composite popovers** — repos/plugins/help/appearance menus (`dropdown_menu`
  only takes menu children); RTC details popup (needs imperative→declarative
  rewrite first).
- **`a[href='#']`/`a.page-ref` navigation** in `on_doc_click` — app routing,
  not menu dismissal.
- **Header bar shell** — full-width sticky bar with drag region; `toolbar` is
  a pill — kit covers the clusters, the bar stays a recipe row.
- **`.ls-left-sidebar-open`/`.is-open`/`has-children`/`.item-type-*` hooks** —
  keep emitting as `style_class`/`data_attrs` semantic flags (e2e + recipes);
  the rules that read them shrink to recipe variants.

## 6. LUI gaps this review surfaces (sidebar/shell family)

- **G1 `split` px panes** — value is a fraction clamped only by child
  `min_width`; Logseq persists px (`ls-left-sidebar-width` [240,460]) and
  needs a per-pane `max_width` or px-mode so the docked pane keeps px across
  window resizes. Workable today via `value_signal` recompute on viewport
  change, but it's a kit-level want.
- **G2 `drawer` on web is a bare container** — the overlay/scrim/edge-swipe
  exists only on Apple (and gpui as modal layer). Sheet swipe machinery on
  web is right there in `lui_web_overlay.ml`; sidebar adoption on web is
  blocked until it lands.
- **G3 Responsive size class** — docked-vs-overlay at 640px (and
  `.toggle-right-sidebar` hiding) needs a typed conditional, same as
  inventory gap #2. `drawer` already encodes it on Apple via size classes —
  needs a shared spelling.
- **G4 Collapse-with-custom-header** — `accordion` header is `~text` only;
  Navigations (`as-edit` icon) and `.sidebar-item` headers (icon+title+more+
  close) can't ride it. Either an `accordion ~header:` slot or a
  `list_section`-level disclosure prop.
- **G5 `list_item` nested interactives** — web emits `<button>`, so
  `.link-item`'s inner `link`+dots `button` can't nest. Needs a
  trailing/actions slot or a non-button row variant.
- **G6 Group-hover reveal** — `.item:hover .keyboard-shortcut`,
  `.enter-show-more`, `.sidebar-page-actions`: ancestor-hover → descendant
  visibility (inventory gap #4 restated; affects ~6 rows).
- **G7 `context_menu` hosting** — hostable only on control kinds; row
  context menus therefore emit `ContextMenuPress` and mount the
  `context_menu` at overlay root (works, but document it — the current code
  uses a document-level dispatcher instead).
