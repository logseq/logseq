# CSS core API review — `resources/css/lui-core.css`

Read-only classification of every remaining rule in
`resources/css/lui-core.css` (3,445 lines, **531 rule blocks** — each
selector block counts once, including nested `&`/`@media` bodies) for
`2026-10-10-003-shared-ui-visual-design.md`, Task 5 batch "CSS core API".

Question per rule: **can the emitting view express this through LUI
typed props or a shared recipe — or must it stay in the stylesheet?**

Sources of truth:

- Typed-prop vocabulary: `lui/schema/components.json` (149 wire props at
  pin `c3491a1`), `lui/src/lui_elements.mli`, `.agents/skills/logseq-lui`.
- Emitters: `deps/ui/src/{shell/chrome,sidebar/*,pages/page,blocks/tree,
  editor/edit_view,render/render*,properties/properties_*,
  shared/ui_components}.ml`.
- gpui twins: `deps/ui/gpui/host/src/logseq_ext.rs`
  (`register_class_styles` — the flat class→style dictionary the gpui
  backend consults in place of this stylesheet).
- e2e hooks: `ocaml-e2e/lib/*.ml` selectors (`.ls-block`,
  `.block-content`, `.ls-page-blocks`, `.block-add-button`,
  `.cp__right-sidebar.open`, `.toggle-right-sidebar`, `.ls-page-icon`,
  `#edit-block-`, `.editor-wrapper textarea`).

## Verdict legend

- **→ typed props** — layout/spacing/sizing/alignment/typography/colors
  the emitter can carry today (`gap` `padding*` `width/height/min/max*`
  `grow` `sizing` `main/cross/alignment` `display` `position` `inset`
  `x/y` `z-index` `overflow` `font-size` `font-weight` `line-height`
  `letter-spacing` `text-alignment` `text-overflow` `white-space`
  `foreground` `background` `corner-radius` `border-width/color`
  `opacity` `cursor` `user-select` `visible` `pointer-enabled` +
  **state props** `hover-background` `hover-opacity` `pressed-*`
  `selected-background` `hover-shadow`).
- **→ recipe** — a recurring cross-surface pattern that belongs in
  `deps/ui/src/shared/ui_components.ml` (like `property_pill`,
  `nav_item`, `keycap`, `search_row`, `form_row` already there).
- **KEEP (hook)** — e2e/imperative/dynamic hook, or expressible only by
  something typed props do not have: `margin` (no margin prop — biggest
  single gap), `transform`/`transition`/`@keyframes`, `::before/::after`,
  `::selection`, pseudo-classes beyond the hover/pressed/selected set
  (`:focus-visible` `:focus-within` `:has` `:nth-child` `:first/last-child`),
  **group-hover descendant reveals** (`.parent:hover .child`),
  `@media` breakpoints, `container-type` queries, `::-webkit-scrollbar`,
  `-webkit-app-region`, `list-style`, `text-decoration`, floats,
  `field-sizing`, `mask-image`, `font-family`, single-side borders,
  `text-autospace`, `overflow-anchor`, `touch-action`, CSS var plumbing.
- **KEEP (decoration)** — legitimate stylesheet content: `:root`/body
  tokens, base element typography, scrollbar colors, third-party
  chrome (CodeMirror/KaTeX), dark-theme deltas.

Rules marked **mixed** split: the listed share moves, the rest keeps.

## Totals

| Verdict | Rules | % |
|---|---|---|
| → typed props | ~166 | 31% |
| → recipe | ~58 | 11% |
| KEEP (hook) | ~144 | 27% |
| KEEP (decoration) | ~163 | 31% |
| **Total** | **531** | |

| File section | Rules | → typed | → recipe | KEEP hook | KEEP deco |
|---|---|---|---|---|---|
| Base (9–224) | 33 | 3 | 0 | 2 | 28 |
| App shell (225–352) | 18 | 8 | 1 | 7 | 2 |
| Header (353–528) | 23 | 10 | 6 | 4 | 3 |
| Left sidebar (529–1198) | 105 | 30 | 22 | 42 | 11 |
| Right sidebar (1199–1395) | 33 | 13 | 10 | 6 | 4 |
| Page/journal (1437–1583) | 26 | 12 | 3 | 9 | 2 |
| Properties panel (1584–2030) | 60 | 36 | 8 | 13 | 3 |
| Breadcrumb (2031–2061) | 6 | 6 | 0 | 0 | 0 |
| Outliner + block body (2062–2336) | 48 | 20 | 4 | 12 | 12 |
| Bullets + controls (2337–2496) | 30 | 17 | 3 | 8 | 2 |
| Headings (2497–2581) | 12 | 6 | 0 | 5 | 1 |
| Selection + color-level (2582–2622) | 9 | 4 | 0 | 2 | 3 |
| Editor (2623–2933) | 44 | 8 | 2 | 25 | 9 |
| Inline elements (2934–3271) | 56 | 13 | 8 | 11 | 24 |
| Misc (3272–3445) | 28 | 8 | 3 | 5 | 12 |

## 1. Base (33 rules, lines 9–224)

| Rule(s) | Verdict | Emitter / notes | gpui reg? |
|---|---|---|---|
| `@supports` font-variation + `html` font-family; `html:not(.is-native-android)` font-family `!important` | KEEP (deco) | Global font bootstrap; no LUI node. | — |
| `:root` text-autospace, scrollbar-width/color, `--ls-z-index-*`, `--color-*` hsl bridge | KEEP (deco) | Token plumbing; the `--color-*` bridge comment explains why it exists. | — |
| `html { overflow:hidden }`, `.theme-container-inner` var, `body`, `#root` font-size | KEEP (deco) | Document/body box + theme var. | — |
| `#skip-to-main` + `&:focus` (2) | KEEP (hook) | `chrome.ml` skip link — `position:fixed` + `:focus` reveal; fixed positioning + focus reveal untyped. | no |
| `::selection` | KEEP (deco) | Pseudo-element. | — |
| `a`, `a:hover`, `hr`, `p`, `ul`, `ol`, `li`, `img` | KEEP (deco) | Raw-markdown / `D.el` element defaults inside block content. Block-body has its own overrides below. | — |
| `mark` | **→ typed props** | `render_inline.ml` (`text ~as_:`Mark`) → `~background ~corner_radius ~padding ~foreground`. ~6 lines. | no |
| `:not(pre) > code` | **→ typed props** | `render_inline.ml code_span` (`text ~as_:`Code`) → `~background ~corner_radius ~font_size ~padding`; `font-family` has no prop — keep or accept theme default. ~8 lines. | no |
| `pre` | KEEP (deco) | Static `pre` chrome for non-CodeMirror code content (`@@html`, `text ~as_:`Pre`). | — |
| `blockquote` | **→ typed props** | `render.ml quote_el` emits `D.el ~tag:"blockquote" ~style_class:"ls-blockquote"` — needs the `D.el` escape hatch swapped for a real element first (SKILL hard rule 2); then `~padding ~background` + border. ~6 lines. | **yes** (`ls-blockquote`) |
| `.external-link` + `:hover` (base copy, 174–183) | KEEP (deco) | `border-bottom` underline + `cursor:alias` — single-side border not in props. Second copy at 1947–1951 is a dead duplicate → delete regardless. | no |
| `.table-wrapper.classic-table` cluster (6) + `.markdown-table` (1) | KEEP (deco) | `render.ml table_el`/`D.el` markdown tables — `tr:hover`, `:nth-child(even)`, `border-collapse`, `white-space:nowrap` untyped; an `md-table` recipe is possible only after tables emit real elements. | no |

## 2. App shell (18 rules, 225–352)

| Rule(s) | Verdict | Emitter / notes | gpui reg? |
|---|---|---|---|
| `#app-container` flex | → typed props | `chrome.ml` app root → `row` kind + `~grow`. ~3 lines. | — |
| `#left-container` flex col 100vh | → typed props | `chrome.ml` → `column` + `~grow` + `~height_viewport`; keep `position:relative` hook for abspos children. ~5 lines. | — |
| `#main-container` overflow/relative/height | KEEP (hook) | `chrome.ml` — overflow clip while the docked split animates; height is owned by the flex parent once `#main-content` grows. | — |
| `#main-content` calc height | → typed props | `chrome.ml` — replace `calc(100vh - headbar)` with `~grow:1` under the header column. ~3 lines. | — |
| `.scrollbar-spacing` | → typed props | `chrome.ml` `scroll` kind → `~overflow` (kind-owned). ~1 line. | — |
| `#main-content-container` + `@media` pad + `::-webkit-scrollbar` + `[data-is-margin-less-pages]` + child (5) | KEEP (hook) | `chrome.ml` — `container-type`, breakpoint padding swap, scrollbar tint, dynamic route flag. Flex-centering part already typed (`~main:`center`). | — |
| `.cp__sidebar-main-content` + `.page` pad | → typed props + recipe | `chrome.ml` — `~width ~max_width ~grow`; `margin-inline:auto` has no margin prop → parent `~main:`center` already does it (same trick the gpui comment documents). `.page` padding → `~padding_horizontal`. Recipe candidate: shared **content-column** (max-width + center + pad) used by main + right-sidebar pages. ~10 lines. | yes (`cp__sidebar-main-content`) |
| `.cp__sidebar-main-content` `is-full-width` + `[data-is-margin-less]` + `>div` + `.ls-wide-mode` (4) | KEEP (hook) | Route/layout flags → keep as `style_class`/`data_attrs` variants; `>div` fill rule is a flex workaround the kind tree doesn't need once parents are `column`. | — |
| `.cp__content-wrap` + `--flush` | → typed props | `chrome.ml`/`page.ml` — `margin:0 auto` → parent centering; `width:100%`/`padding-bottom:6rem` → `~width ~padding_vertical`. ~5 lines. | yes (`cp__content-wrap`) |
| `.cp__not-found` | → typed props | `chrome.ml` 404 — `~position ~inset ~z_index ~background ~min_height`; fixed-overlay is in the position prop's domain. ~5 lines. | — |

## 3. Header (23 rules, 353–528)

| Rule(s) | Verdict | Emitter / notes | gpui reg? |
|---|---|---|---|
| `.button` + `:hover`/`:active` + `@media` hover (4) | → recipe | `chrome.ml ghost_btn_cls` — opacity states → `hover-opacity`/`pressed-opacity` typed; `@media sm:hover` bg is a hover-background. Recipe: **chrome ghost button** (2rem box, 0.9 opacity states). ~12 lines. | — |
| `.button.icon` | → recipe | Same recipe (icon-size variant). | — |
| `.cp__header` bar | → typed props (mixed) | `chrome.ml` — `display:flex`/`justify-content:space-between`/`height`/`padding-top` → `~main ~cross ~height ~padding_vertical`; sticky + `box-shadow` + `-webkit-app-region:drag` + `margin-top:var(--ls-win32-title-bar-height)` keep. | yes (`cp__header`, `-l`, `-r`) |
| `@media` sm `box-shadow:none` | KEEP (deco) | Mobile-only shadow removal. | — |
| `.lui-button[data-size=icon]` + `.lui-button-icon` under `.cp__header` and `.left-sidebar-top` (2 sites, 4 rules) | → recipe | `chrome.ml` + `left_sidebar_view.ml` — the **32px icon-btn recipe** (8px pad, 20px glyph, radius): identical block written twice. ~16 lines. | — |
| `> .l` + `> div` + `> .r` (3) | → typed props | `chrome.ml` — flex rows → `row`/`~cross`/`~grow`. ~8 lines. | — |
| `.head-l-btns` + `.is-hidden` (2) | KEEP (hook) | Delayed visibility fade so header and sidebar button copies never co-render — transition choreography untyped. | — |
| `a,svg,button { -webkit-app-region:no-drag }` + `.cp__right-sidebar-topbar` twin (2) | KEEP (deco) | Electron drag-region hints have no prop. | — |
| `.r > div a, button` opacity + `:hover` (2) | → typed props | `opacity`/`hover-opacity`. ~4 lines. | — |
| `.cp__header .button` + `.ti/.tie` + `.ui-items-container .button` (3) | → recipe | Folds into the chrome ghost-button recipe (icon font-size, auto width). | — |
| `.search-index-progress` + `__text` + `__bar` + `::before` (4) | → typed props | `chrome.ml` — row+`progress` kinds already mounted; chip `~background ~gap ~padding ~font_size`; `::before` fill → the kind-owned `--lui-progress-position` (comment already says so). ~14 lines. | — |

## 4. Left sidebar (105 rules, 529–1198)

| Rule(s) | Verdict | Emitter / notes | gpui reg? |
|---|---|---|---|
| `.left-sidebar-top` icon-btns + `button` opacity (3) | → recipe | Same 32px icon-btn recipe as header (see §3). | — |
| `.as-ghost` neutralizers (`.cp__header`, `.left-sidebar-top`; 2 blocks) | KEEP (hook) | Overrides kit `data-selected`/`focus-visible` states — semantic-state overrides need a kit neutral variant first (kit gap). | — |
| `.cp__graphs-selector > .item` hover/focus (2) | → typed props | `left_sidebar_view.ml` — `hover-background`; `focus-visible`/`data-selected` stays hook. | — |
| `.cp__sidebar-left-layout` overlay machinery (~20: base, `a` opacity, `shade-mask`, `:before`, `@media<640` `is-open`/`is-closing`/`is-touching`/`.left-sidebar-inner` translate/`&:before` strip) | KEEP (hook) | `chrome.ml` — the drawer gesture stack: transforms, transitions, `touch-action`, media split, swipe-follow. Sibling kit review (`review-sidebar-kit.md`) deletes ~40 of these once a web `drawer` exists — this file keeps them until then. | — |
| `html[data-theme=dark] #left-sidebar > .shade-mask` | KEEP (deco) | Dark scrim delta. | — |
| `@media<640 .toggle-right-sidebar` | KEEP (hook) | Breakpoint hide (e2e reads `.toggle-right-sidebar`). | — |
| `.left-sidebar-inner` + `.as-container` + `@media` transform + `> .wrap` + `@media≥sm` (5) | mixed | `chrome.ml` — `display:flex column`/`~grow`/`overflow` → typed (~8 lines); overlay translate/transition/width → KEEP hook. | yes (`left-sidebar-inner` border only) |
| `.item` + `.active`/`.thumb` + `> .ui__icon` + `.page-icon` + icon inner (5) | → recipe | `left_sidebar_view.ml` — 32px nav row = existing `nav_item` recipe territory (`ui_components.ml:635`): `~height ~padding ~font_size ~font_weight ~user_select ~cursor` + `selected-background` for `.active`. ~20 lines. | yes (`item`, `active`) |
| `.cp__left/right-split` divider hidden/cursor/`::after` widen (4) | KEEP (hook) | `lui-split` divider chrome — `~cursor:`col_resize` is typeable, `::after` hover-widen is pseudo-element; move inside the split kind's own chrome. | — |
| `.cp__graphs-selector` row internals (~10: `.item`, `.thumb`, `.lui-text`, `> .ui__icon`, `> span`, `.ui__button` states) | → recipe | `left_sidebar_view.ml` — graph-row recipe: padding/gap/`selected` opacity/absolute trailing icon. `right:-0.25rem;top:0.5rem` → `~position ~inset`. ~25 lines. | no |
| `.sidebar-header-container`, `.sidebar-contents-container` + `.is-scrolled` (3) | → typed props | `chrome.ml` — `column ~gap ~padding`; `.is-scrolled` border-top is a scroll-state hook (keep flag, lose the rest). ~10 lines. | yes (both) |
| `.sidebar-content-group` cluster (~20: scrollbar-hide, `-inner`, `.hd` sticky + variants, `.wrap-th`, `.more`, `.as-edit`, `.enter-show-more`, `.bd`, `.lui-list`, `a.link-item` + `.lui-link-content`/`.page-title`/`.page-icon`/`.sidebar-page-actions`, `[data-popup-active]`, `.is-expand`, `.has-children`) | → recipe + KEEP hook | `left_sidebar_view.ml` — accordion-style content-group recipe: `.hd` row (`~main ~cross ~height ~padding`), `.bd` mount/unmount (`if_`), disclosure `.more` rotate. **KEEP hook**: sticky `.hd`, `data-popup-active`, group-hover reveals, `.is-expand`/`.has-children` dynamic flags, `.sidebar-page-actions` absolute reveal, scrollbar-hide. | yes (`hd`, `wrap-th`, `as-edit`, `more`, `link-item`) |
| `.sidebar-navigations` + `.item .keyboard-shortcut` (2) | → typed props + KEEP hook | `left_sidebar_view.ml` — `~gap`/margin → typed; shortcut chip reveal-on-hover stays hook. | yes (`sidebar-navigations`, `keyboard-shortcut` = hidden) |
| `.left-sidebar-inner .item.active` (1) | → typed props | `selected-background`. ~2 lines. | yes (`active`) |
| `#left-sidebar a,.item` opacity + `.cp__graphs-selector > .item` (3) | → typed props | `~opacity` + `hover-opacity`. ~5 lines. | partial |
| `.rotating-arrow` svg/lui-icon transition + `.not-collapsed` rotate (3) | KEEP (hook) | `transform:rotate` has no prop; gpui already does the native `rotating-arrow-down` swap (`install_app_icons`) — web keeps class transform. | n/a (native rotate) |
| `@media (hover:hover)` cluster (~8: `.item:hover`, `.keyboard-shortcut` reveal, `.hd:hover`, `.enter-show-more > .b`, `a.link-item:hover` + `.sidebar-page-actions`) | KEEP (hook) | Descendant/group-hover reveals + opacity-delay transitions — self-hover props exist but parent-hover-child does not. | no (gpui keeps default-hidden) |
| `.sidebar-item` + variants (~12: `.sidebar-item-header`, `.button`, `item-type-block` gradient, `.collapsed`, `.breadcrumb`, `.item-actions`) | → recipe | `right_sidebar_view.ml` — **sidebar-card** recipe: `~min_height`, header `~height`, collapsed `~flex` swap; `item-type-block` linear-gradient stays deco. ~18 lines. | no (`color-level` also unregistered — see §12) |
| `html[data-theme='dark']` left/right sidebar deltas (3) | KEEP (deco) | Theme deltas. | — |

## 5. Right sidebar (33 rules, 1199–1395)

| Rule(s) | Verdict | Emitter / notes | gpui reg? |
|---|---|---|---|
| `.cp__right-sidebar` + `.open` + `.page` margin + `.page-inner>div:empty` + `.page-inner` (5) | → typed props + KEEP hook | `chrome.ml`/`right_sidebar_view.ml` — `~overflow ~min_width ~user_select` + `.open` flag stays class; `.page` margin → padding restructure; `:empty` hide → emit nothing (comment agrees). ~8 lines. | no |
| `.sidebar-item-list` | → typed props | `right_sidebar_view.ml` — margins → padding; `display:block` → `column`. ~5 lines. | no |
| `.sidebar-panel-content` | → typed props | `~padding_vertical`. | no |
| `.ls-page-blocks` inside right sidebar | → typed props | Same margin-`-20px` note as §6 — needs margin prop or padding restructure. | — |
| `.sidebar-drop-indicator` + `::after` + `.drag-over` (3) | KEEP (hook) | `::after` bar + drag-state fill — emit a real indicator node then `~background` is typed; until then hook. | — |
| `.cp__right-sidebar-inner` | → typed props | `~width ~height ~background ~padding_vertical`. ~4 lines. | no |
| `.cp__right-sidebar-settings` + `a` | → typed props | `right_sidebar_view.ml` — `row ~overflow`; `a` color → `~foreground`. ~6 lines. | no |
| `.cp__right-sidebar-settings-btn` | → recipe | `right_sidebar_view.ml` — settings-strip button (already `button ~style_class`); folds into chrome ghost recipe. | no |
| `.cp__right-sidebar-topbar` + `button` + app-region (3) | → typed props (mixed) | `right_sidebar_view.ml` — `position:sticky`/`height`/`padding`/bg → `~position ~height ~padding ~background ~user_select`; `z-index` typed; app-region + sticky-in-flex quirk keep. | no |
| `.help.cp__sidebar-help-docs` + `.ls-hp-*` (5) | → recipe | `right_sidebar_view.ml` — help-docs recipe: `display:list-item`+circle marker is a gap, margins → padding/gap. ~15 lines. | no |

## 6. Page / journal (26 rules, 1437–1583)

| Rule(s) | Verdict | Emitter / notes | gpui reg? |
|---|---|---|---|
| `#journals` + `.journal-item` + `:first-child` + `.journal-last-item` (4) | → typed props + KEEP hook | `page.ml` — `~border_bottom ~min_height ~padding_vertical` typed; `overflow-anchor:none` + `:first-child` min-height-500 → hook (emit a first-item variant). | yes (`journal-item`, `journal-last-item`) |
| `.ls-page-blocks` + `.page-inner >` mt + right-sidebar override (3) | → typed props (mixed) | `page.ml` — `~min_height ~overflow` typed; `margin-left:-20px` — **no margin prop**; alternative: parent padding compensation or a margin prop (gap G-margin). e2e hook `.ls-page-blocks`. | yes (`ls-page-blocks`) |
| `.ls-bidirectional-properties:empty` | → typed props | `page.ml` — comment says emit nothing instead; delete rule + element. ~2 lines. | — |
| `.cp__page-inner-wrap > .page-inner` pb-4rem | → typed props | `page.ml` — `~padding_vertical`. | yes (`page-inner`) |
| `.property-block-container .lui-link.external-link` | → typed props | `properties_value.ml` — `~display` inline on the link emission. ~2 lines. | — |
| `h1.title` + `.ls-page-title-container` (2) | → typed props | `page.ml` — `~font_weight ~font_size ~foreground` (title size via `--ls-page-title-size` token → `Ui_theme`). ~5 lines. | yes (`ls-page-title-container`) |
| `h1.title` margin/line-height (1) | KEEP (hook) | `margin:0.2em` untyped (line-height is — split). | — |
| `.ls-page-title-container textarea` | KEEP (hook) | Title textarea inherits — editor internals. | — |
| `.ls-page-title` + `.edit-input` + `.editing` + `.page-icon` + `.ui__button` (4) | → recipe | `page.ml` — page-title recipe (radius → `corner-radius`; edit-input chrome stays textarea hook; page-icon pad → `~padding`). | yes (`ls-page-title`) |
| `.ls-page-title-actions` + `:hover>` + `:has(button[data-popup-active])` (3) | KEEP (hook) | `page.ml` — hover-reveal + popup-pin (`data-popup-active` attr stays; gpui already moved reveal to a signal-driven opacity — copy that). | yes (`ls-page-title-actions` — in-flow variant) |
| `a.page-title` | → typed props | `page.ml`/`right_sidebar_view.ml` — `~padding ~display`; `margin-left:-8` stays hook. ~3 lines. | no |
| `.page-title-sizer-wrapper` + `:empty::before` + `> .title` (3) | KEEP (hook) | `page.ml` — `:empty::before` ZWSP sizing trick + measuring scroll box. | no |

## 7. Page properties panel (60 rules, 1584–2030)

Emitter throughout: `properties_area.ml`, `properties_value.ml`.

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `.ls-block .ls-properties-area.ls-block-properties` margin | → typed props | `margin-top:2px` → parent `~gap`; `margin-left:7px` → indent via parent padding or margin prop gap. ~3 lines. | yes (`ls-block-properties`) |
| `.properties-panel` | → typed props | `~corner_radius ~overflow`. | yes (`properties-panel`) |
| `.properties-panel-header` | → typed props | `~padding ~font_size ~font_weight ~foreground`; border-bottom stays deco. ~5 lines. | no |
| `.property-pair.property-panel-row` grid | → typed props | `fit-content(260px) minmax(0,1fr)` grid → `row` + fixed key column (`~width`/`~min_width`) + value `~grow`. ~6 lines. | no |
| `.property-key-panel`, `.property-key-inner` + `.property-icon` + `svg/img` + `.lui-button.property-m` (5) | → typed props | `row ~cross ~gap ~min_height`; 15px icon → `~icon ~point_size` (gap if icon-size prop missing); `property-m` chromeless → recipe variant below. ~15 lines. | no |
| `.property-key-panel .property-k` + `.property-pair .property-k` + `.property-panel-row .property-k` + `a.property-k` color (4) | → typed props | `~text_overflow ~white_space ~overflow ~min_width ~line_height ~foreground`. ~12 lines. | no |
| `.lui-button.property-k`/`.property-value-panel .lui-button`/`.pv-scalar`/`.lui-button-label`/justify-start cluster (6) | → recipe | **Chromeless text-button recipe** — `height:auto;min-height:0;padding:0;justify-content:flex-start;text-align:left` repeated for property-k, pv-scalar, bottom-pill, hidden-toggle-key. ~20 lines across 4 sites. | no |
| `.property-value-panel.ls-block.property-value-container` + `.property-value-panel` + `.block-control-wrap` + `.property-block-container` (4) | → typed props | `row ~gap ~min_width ~min_height ~grow`; `margin-left:-1.25rem` hook. ~10 lines. | no |
| `[data-property-type='node'/'checkbox'/'url']` variants (5) | → typed props | Emitter already knows the property type → emit `~cross:`center`/wrap props per type instead of attr+selector; `overflow-wrap:anywhere` stays deco on url. ~8 lines. | no |
| `.hidden-properties-toggle-row` + `-key` + `.property-icon` (3) | → typed props | `~padding ~min_height ~cursor ~foreground ~text_alignment`; transparent-button → recipe variant. ~10 lines. | no |
| `.property-value-panel-inner` cluster (`.property-value-inner`, `.jtrigger`, `.select-item`; 4) | → typed props | `~width ~min_width ~min_height ~foreground`. ~8 lines. | no |
| `.property-panel-bullet` + `.bullet-container` (2) | → typed props | `display:inline-flex` → `row`; `~opacity`; margins → hook; inner position reset → default. ~8 lines. | no |
| `.property-panel-edit-btn` + `:has()` reveal + `:focus-visible` (4) | KEEP (hook) | `position:absolute` + `translateY(-50%)` + `:has()`-driven reveal — the reveal can't be typed today; gpui path = opacity signal (same fix as title-actions). | no |
| `.positioned-properties.block-below` | → typed props | `column ~gap ~font_size ~overflow ~width`. ~6 lines. | no |
| `.bottom-properties-row`, `.bottom-properties-pills-strip` (2) | → typed props | `~padding ~max_height ~overflow ~grow ~min_width ~max_width`. ~10 lines. | no |
| `.bottom-property-pill` tweaks (`.property-key-inner`, `.property-k`, `.lui-button`, `.property-value-container`, font-size; 5) | → typed props | Already migrated to shared `property_pill` recipe (comment 1917) — remaining tweaks are `~min_height ~gap ~padding ~line_height ~font_size` on the recipe's slots. ~12 lines. | n/a (recipe emits props) |
| `.block-add-button .bab-inner` + `.ls-block-content-indent` variant (2) | KEEP (hook) | `page.ml`/`add_button.ml` — margin-left 22/6px conditional → needs margin prop or parent-padding restructure; e2e reads `.block-add-button`. | no |
| `.bottom-property-content` | → typed props | `row ~cross ~gap ~font_size ~white_space ~overflow`. ~8 lines. | no |
| `.prop-edit-ico` + hover/focus reveals (3) | → typed props + KEEP hook | `~width ~height ~opacity` typed; row-hover/focus-visible reveal stays hook. | no |
| `.ls-block.property-value-container` | → typed props | `~grow ~min_width ~min_height ~padding_vertical`; `container-type` deco. ~6 lines. | no |
| `.ls-page-properties .property-key`, `.ls-properties-area .property-key`, `.property-key`, `.ls-page-title .ls-page-properties` + `> .ls-new-property` (5) | → typed props | `column ~main ~font_size ~min_width ~min_height ~gap`; `margin-top` → parent gap. ~12 lines. | no |
| `.ls-block-content-indent` (prop areas) | → typed props | `~padding_horizontal` (45px → emit value). ~1 line. | yes (`ls-block-content-indent`) |

## 8. Breadcrumb (6 rules, 2031–2061)

Emitter: `page.ml` (`breadcrumb`, `block-parents`).

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `.breadcrumb a`, `.block-parents a` color (2) | → typed props | `~foreground` on the link emission. ~4 lines. | no |
| `.breadcrumb.block-parents` flex nowrap | → typed props | `row ~overflow ~white_space ~min_width ~max_width`. ~7 lines. | no |
| `.breadcrumb-item` + `:hover` (2) | → typed props | `~opacity` + `hover-opacity`. ~5 lines. | no |

## 9. Outliner + block body (48 rules, 2062–2336)

Emitters: `tree.ml`, `page.ml`.

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `.blocks-list-wrap` | → typed props | `~position`. | no |
| `.ls-block` + `.selected` radius (2) | → typed props (mixed) | `~grow ~position ~padding` typed; `margin:0 auto`/`transform`/`will-change`/`transition`/`container-type|name` hook — **e2e hook `.ls-block`**. | no (`ls-block` itself unregistered!) |
| `.ls-page-title.title .block-main-container` gap | → typed props | `~gap`. | — |
| `.block-main-container` + `[data-has-heading]`/`:has(textarea.h1/.h2)` offsets (3) | → typed props + KEEP hook | `~min_height` typed; heading offsets → emitter knows heading level (`tree.ml` `data-has-heading` site) → emit `~inset_top`/`position` directly instead of `:has()` + attr selectors. | no |
| `.is-page-title-row` cluster (`.lui-column`/`.lui-row`/`.ls-page-title-container`; 6) | → typed props | `page.ml` — `~grow ~min_width ~width` on the title row layout. ~12 lines. | — |
| `.block-main-container.is-page-title-row > .block-control-wrap` calc | → typed props | `page.ml` — emitter computes the offset (`(title-size * 1.38 - 24)/2`) and emits `~inset_top` — deletes the calc + both vars. ~6 lines. | — |
| `.block-row`, `.block-content-wrapper` (2) | → typed props | `~min_width` + `~user_select:`text`. | no |
| `.block-content-or-editor-wrap` + `[data-node-type='quote']` (2) | → typed props | `row ~grow ~gap`; quote variant → `~padding ~background` + border-left deco. ~10 lines. | — |
| `.block-content-or-editor-inner` | → typed props | `column ~grow ~width ~padding`. | no |
| `.block-content` + `img.left`/`img.right` (3) | → typed props (mixed) | `~min_height ~white_space ~cursor` typed; `max-width`/`word-wrap` + floats → deco. **e2e hook `.block-content`**. | no |
| `.block-title-wrap` + `> .ui__checkbox` + `.checked` + `:has(.embed-page)` + `> .embed-page` (5) | → typed props + KEEP hook | `~width`/`display` typed; checkbox `top` nudges → `~inset_top`; `:has()` variant → emit embed class at emit time. | — |
| `.block-head-wrap` + `> .inline.w-full` (2) | → typed props | `tree.ml` — `row ~cross ~grow ~main`; `.inline.w-full` display → `~display`. | yes (`block-head-wrap`) |
| `.block-title-wrap.as-heading` + `> .ui__checkbox` (2) | → typed props | `row ~cross ~grow`; checkbox top → `~inset_top`. | — |
| `.ls-block-content-indent` | → typed props | `~padding_horizontal` (45px). | yes |
| `.block-body` cluster (`:first/last-child` margins, `ol` inside-position, `dl>li` + `.ui__checkbox`; 6) | KEEP (deco) | Markdown body spacing pseudo-classes. | — |
| `.block-content ul/ol` (2) | KEEP (deco) | Markdown list styles. | — |
| `.block-children-container` | KEEP (hook) | `margin-left:29px` indent — margin gap; `padding-top`/`margin-bottom` mixed. | no |
| `.block-children-left-border` + `:hover`/`:active` (3) | → typed props | `tree.ml` — `~position ~inset ~width ~height ~cursor ~opacity` + `hover-background`/`pressed-opacity`; `border-left-color` + `background-clip` deco. Indent-guide recipe candidate. ~12 lines. | no |
| `.block-children` border-left | KEEP (deco) | 1px guideline `!important` — single-side border + override of kind inline styles. | no |

## 10. Bullets + controls (30 rules, 2337–2496)

Emitters: `tree.ml`, `add_button.ml`.

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `[data-heading]` `--ls-block-icon-size` ladder (6) | → typed props | `tree.ml` `heading_attrs` already emits `data-heading` → emit a size prop on the icon slot instead of a var lookup table. ~12 lines. | — |
| `.block-control-wrap` + `.is-order-list` + `.is-with-icon` + `.bullet-hidden` (4) | → typed props + KEEP hook | `~height ~position ~padding` typed; `.is-with-icon` icon-size var + `left:-3px` → hook/emit-time variant. | no |
| `.block-control` + `.control-hide` + `:active` (3) | → typed props | `tree.ml` — `~font_size ~line_height ~cursor ~min_width ~min_height ~padding ~user_select ~opacity` + `pressed-opacity`; `.control-hide` → `~visible` signal (same channel as `class_signal`). ~14 lines. | yes (`block-control`, `control-hide`) |
| `.block-main-container:hover > [data-has-children] .control-hide` reveal | KEEP (hook) | Group-hover descendant + `data-has-children` attr — emit `~visible` bound to a hover signal to delete it (the one group-hover worth solving). | — |
| `.bullet-container` + `.as-order-list` + `.bullet` + `> *` + `.bullet-closed` + `.typed-list` (6) | → typed props + KEEP deco | `tree.ml` — `display:inline-flex`/`~width ~min_width ~corner_radius ~main ~cross ~line_height` typed; `.typed-list` unset-trio deco; `1.4em` order-list width → `~width`. | yes (`bullet-container`, `bullet`, `bullet-closed`) |
| `.bullet` fill/transition (folded above) + `.typed-list:not(:focus-within)` | KEEP (deco) | `:focus-within` untyped; transition deco. | — |
| `.bullet-link-wrap` + `.ui__icon` + `:hover` scale (3) | → typed props + KEEP hook | `tree.ml` — `row ~cross ~line_height ~foreground`; hover `scale(1.2)` transform → hook. | yes (`bullet-link-wrap`) |

## 11. Headings in blocks (12 rules, 2497–2581)

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `.ls-block h1`–`h6` + `.uniline-block` twins (6) | → typed props | `render.ml` (`heading ~level`) knows the level → `~font_size ~line_height ~min_height` per level; the `textarea.uniline-block` copies are editor internals → keep those selectors. ~20 lines (static half). | no |
| `:is(h1..h6)` font-weight | → typed props | `~font_weight`. ~3 lines. | no |
| `textarea.uniline-block:is(.h3-.h6)` + `.ed-line` min-height (2) | KEEP (hook) | Editor textarea line-box internals (edit_view). | — |
| `:is(h1,h2)` border-bottom + margins (2) | KEEP (deco) | Single-side border + margins; could move border to `~border_width` only when single-side borders land. | — |
| `textarea.uniline-block:is(.h1,.h2)` transparent border | KEEP (hook) | Editor textarea internals. | — |
| `.block-ref` heading resets (1) | KEEP (hook) | Scoped heading reset inside embeds. | — |

## 12. Selection + color-level (9 rules, 2582–2622)

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `.block-highlight`, `.ls-block.selected` bg+transition (1) | → typed props | `selected-background`; transition deco. | yes (both) |
| `.ls-block.selected` + `*` user-select (2) | → typed props | `~user_select:`none` on the selected variant; `*` descendant stays hook. | — |
| `.color-level` ladder (7 nested) | → typed props | `right_sidebar_view.ml` — emitter knows `tree_level`/depth → `~background` per depth replaces the descendant ladder; `.dark` step → theme token. ~15 lines. | **no** (`color-level` unregistered — gap today) |

## 13. Editor (44 rules, 2623–2933)

Emitters: `edit_view.ml`, `editor/logseq_editor.ml`, `extension/logseq_codemirror.ml`.

**Emitter wiring verified:** `ed-r`/`ed-delim`/`ed-hidden`/`ed-pill`/`ed-raw`
classes are driven by `Ui_parts.class_signal` from `Edit_runs.run.cls` —
the *model* picks the class, the view only mounts it. Per-run reveal
(`ed-hidden`) and position (`.ed-pos` padding offsets) are dynamic.
Layout/positioning/animation rules therefore stay; pure-appearance
colors could later be typed via a `cls → props` translation at
`frag_view` emit time (marked below).

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `.mock-text` | KEEP (hook) | Imperative caret-mirror span (`ui_parts.ml`). | — |
| `.editor-inner` + `textarea` (2) | KEEP (hook) | `field-sizing:content`, `resize:none`, inherited font — hidden-textarea internals. | — |
| `.block-editor` + `.ed-line` user-select + `::selection` (3) | KEEP (hook) | Context-menu selection dance (documented in-file); `::selection` untyped. | yes (`block-editor`) |
| `.ed-line` | KEEP (hook) | `z-index:1` over `.ed-overlay` + `position:relative` + `min-height:1.5em` — could be typed but it *is* the measurement contract. | yes |
| `.ed-r` | KEEP (hook) | `white-space:pre-wrap` — model-driven fragment. | — |
| `.ed-delim` | → typed props | `~foreground` (or theme token). Pure color, model-independent. ~2 lines. | yes |
| `.ed-hidden` | → typed props | `class_signal` already flips it → bind `~visible`/display prop the same way. ~2 lines. | yes |
| `.ed-pill` + `.ed-block-ref/-page-ref/-tag/-link` + `.ed-r.ed-url` + `.ed-raw.*` (3) | → typed props | `~background ~corner_radius ~padding ~cursor ~foreground` — the chip *and* the accent override are pure appearance; emit-time `cls → props` map covers both. ~15 lines. | yes (`ed-pill`, `ed-raw`) |
| `.ed-bold/.ed-b/.ed-strong`, `-italic/.ed-i/.ed-em`, `-strike/.ed-s/.ed-del`, `.ed-u/.ed-ins`, `.ed-hl/.ed-mark`, `.ed-code`, `.ed-sub`, `.ed-sup` (7) | → typed props | Mirror-element marks: `~font_weight ~font_size ~background ~corner_radius ~padding`; italic/`vertical-align`/`font-size:smaller`/`text-decoration` partially untyped → recipe `ed-mark-*` or keep deco for the residues. ~25 lines. | **no** (whole mark set unregistered — gpui falls back to base text) |
| `.ed-pad` | KEEP (hook) | Zero-width caret landing target. | — |
| `.ed-overlay`, `.ed-pos` (2) | KEEP (hook) | Abspos overlay + per-rect padding offsets driven by host measurement (`bind_int` in `sel_rect_view`) — position props exist but the wiring is imperative by design. | yes (both) |
| `.ed-sel` | → typed props | `~background ~corner_radius` on the emitted bar. ~3 lines. | yes |
| `.ed-caret` + `@keyframes ed-caret-blink` (2) | KEEP (hook) | Blink animation untyped; bg/position could type. | — (gpui paints natively) |
| `.ls-code-editor-wrap` + `.extensions__code-lang` + `.code-block-actions` + `:hover` + `button` + `svg` + `.CodeMirror-lines` (7) | KEEP (hook) | Wrap `~overflow ~corner_radius` could type (~4 lines) but the cluster's purpose is the hover-revealed action bar + CodeMirror internals — keep together. | yes (`extensions__code`, `-lang`) |
| `.CodeMirror` + focus/activeline + `pre.CodeMirror-line` + `-hscrollbar` + `.cm-s-solarized` + font-size group (6) | KEEP (hook) | Third-party CodeMirror theme — no OCaml emitter to move. | — (`logseq-codemirror` native ext) |
| `.heading-bg` + `a:hover > &` (2) | → typed props | `~corner_radius ~width ~height` + `hover-shadow`. ~6 lines. | no |

## 14. Inline elements (56 rules, 2934–3271)

Emitters: `render_inline.ml`, `render.ml`, `tree.ml`.

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `.page-reference` + `.bracket` + `:hover` + `.asset-block-wrap` (4) | → recipe | `render_inline.ml` — page-ref chip recipe: `~corner_radius` + `hover-background` + bracket `~opacity`. ~10 lines. | yes (`bracket`); `.page-reference` no |
| `.page-ref` + `:hover` (2) | → typed props | `page.ml`/`render_inline.ml` — `~foreground` + hover color (hover-foreground is a gap → `hover-*` set has no fg; keep class or extend). ~5 lines. | yes |
| `.broken` + `:hover` (2) | KEEP (hook) | `render_inline.ml` — wavy underline + offset untyped (color part could type). | no |
| `.katex` cluster (3) | KEEP (hook) | Third-party KaTeX chrome (`logseq-katex` ext). | n/a |
| `.math-block`/`.latex` width | → typed props | `logseq_katex.ml`/`render.ml` — `~width`. ~2 lines. | n/a |
| `.preview-ref-link` + sibling margins (2) | KEEP (hook) | `& + &` / `a.tag + &` sibling selectors untyped. | no |
| `a.tag` + `:hover` + `[data-ref]+[data-ref]` (3) | → recipe | `tree.ml`/`render_inline.ml` — **tag-chip recipe**: `~font_size ~line_height ~corner_radius ~opacity` + `hover-opacity`; sibling margin → hook/gap. ~12 lines. | no |
| `.block-title-wrap/.block-body a.tag` | KEEP (hook) | Scoped reset (`font-size:initial`). | — |
| `.block-ref` + nested + `:hover` + `.block-content`/`&-inner`/`> *` (6) | → recipe | `render_inline.ml` — block-ref chip recipe (same family as tag-chip): `~cursor` + border-bottom deco; `display:inherit` cascade → emit `~display` on children. ~12 lines. | no |
| `.block-ref-no-title` + `:hover` (2) | → recipe | Same chip recipe; `~padding ~display`. | no |
| `.embed-page` + `> section` + `.in-sidebar` (3) | → typed props | `tree.ml` — `~padding ~background` (sidebar variant); `margin` → parent gap. ~8 lines. | no |
| `.block-marker` | → typed props | `render_inline.ml` — `~padding ~opacity ~font_size ~font_weight`; `margin` → gap. ~6 lines. | no |
| `.done/.canceled/.cancelled` | KEEP (deco) | `text-decoration:line-through` untyped. | no |
| `span.timestamp` | KEEP (hook) | `margin` only. | no |
| `span.priority` | → typed props | `~foreground`. ~2 lines. | no |
| `.ui__checkbox`/`button[role=checkbox]` unchecked + dark (2) | KEEP (hook) | Kit checkbox border by `data-state` — attr-state variant; dark step deco. | n/a (kit) |
| `.block-tag` + `:hover` + `a.tag`/`a.hash-symbol` + `.tag-x` + reveals + `span` ellipsis (8) | → recipe + KEEP hook | `tree.ml` — block-tag row recipe: `~padding ~font_size ~opacity`; `.tag-x` reveal-on-hover → group-hover gap (hook); `span` ellipsis → `~text_overflow`. ~20 lines. | no |
| `.ls-block-right` | → typed props | `~cross:`center` + stretch alignment. ~2 lines. | no |
| `.ls-query-setting` + `:hover`/`:focus-visible` (2) | KEEP (hook) | `tree.ml`/views — `.block-head-wrap:hover` reveal is group-hover. | no |
| `.block-properties`, `.page-properties` | → typed props | `properties_area.ml` — `~padding ~background`; `margin` → gap. ~4 lines. | no |
| `.youtube-timestamp` cluster (5) | → recipe | `render_inline.ml` — timestamp chip recipe: `~gap ~white_space ~line_height ~foreground`; `.lui-icon` mask block stays deco (icon-kind chrome). ~15 lines. | no |
| `.asset-container` (1) | → typed props | `asset_dom.ml` — `~position ~display ~width`; `margin-top` → gap. ~4 lines. | no |
| `.block-title-wrap .asset-container` | → typed props | `~display ~margin→gap`. ~2 lines. | no |
| `.asset-container img.lui-image-pixels` | KEEP (hook) | `!important` 5-declaration fight against the image kind's inline `width/height:100%` — the real fix is emitting the image kind's props right (kill both the inline style and this rule). | no |
| `.asset-video` | → typed props | `~display ~max_width ~height`; `margin` → gap. ~4 lines. | no |

## 15. Misc (28 rules, 3272–3445)

| Rule(s) | Verdict | Notes | gpui reg? |
|---|---|---|---|
| `.cp__sidebar-help-btn` + `:hover` + `> .inner` (3) | → typed props + recipe | `chrome.ml` — `~position ~inset ~z_index ~opacity` + `hover-opacity`; `.inner` circle button → chrome ghost recipe (rounded-full 2rem). ~12 lines. | no |
| `.block-add-button` cursor | → typed props | `add_button.ml` — `~cursor:`text`; e2e reads class. ~1 line. | no |
| `.visible-scrollbar` cluster (3) | KEEP (deco) | `::-webkit-scrollbar-*` pseudo-elements. | — |
| `.hide-scrollbar` (2) | KEEP (deco) | `scrollbar-width:none` + `::-webkit-scrollbar` — candidate for a `~scrollbar` prop gap. | — |
| `.lazy-visibility` | → typed props | `lazy_children.ml`/`virtualizer` — `~min_width ~min_height`; it's an imperative measurement guard though → keep as hook note. ~2 lines. | no |
| `a.close` + `svg` + `.rotating-arrow` colors + `:hover` (3) | → typed props | `~foreground ~opacity` + `hover-opacity`. ~8 lines. | no |
| `.video-embed-block/-shell/-frame`/iframe cluster (5) | KEEP (deco) | `render_libs.ml` embed iframe geometry; `~display ~max_width` could type for the shell rows — marginal win inside iframe chrome. | no |
| `.tweet-embed` | → typed props | `~corner_radius ~overflow`. ~2 lines. | no |
| `.ls-view-partition-title` + `:hover` (2) | → typed props | `views` — `~font_size ~opacity` + `hover-opacity`; `margin` → padding/gap. ~5 lines. | no |
| `.ls-page-title .ls-page-icon-btn` + `svg` (2) | → typed props | `page.ml` — `~width ~height ~border_width ~border_color ~corner_radius ~padding` + 22px icon slot. ~8 lines. | no |
| `.ls-page-title .ls-page-icon .ui__button` + `.ui__icon`/`svg` (2) | → typed props | Same bordered-icon recipe (two selector sets for one widget — dedupe). ~8 lines. | no |
| `.dnd-separator.ls-dnd-drop-indicator` | KEEP (hook) | `block_dnd.ml` imperative fixed overlay — `display:none` default + drag-state. | n/a (`block-drag-*` native twins instead) |

## gpui registration audit

`logseq_ext.rs` currently registers ~85 flat classes. Per focus group:

| Group | Registered today | Missing (stylesheet-only) |
|---|---|---|
| `.block-*`/`.ls-block` (60) | `block-head-wrap`, `block-control`, `control-hide`, `block-highlight`, `block-drag-*`, `bullet-*` (4), `icon-cp-container`, `ls-block-properties`, `ls-block-content-indent`, `ls-page-blocks`, `ls-page-title*` | `ls-block` itself, `block-main-container`, `block-control-wrap`, `block-content*`, `block-children*`, `block-row`, `block-title-wrap`, `block-body`, `block-tag`, `block-ref*`, `block-add-button`, `block-marker` |
| `.property-*` (37) | `properties-panel`, `ls-block-properties` only | All of `property-pair/-key*/-value*/-k/-m`, `bottom-propert*`, `hidden-properties-*`, `property-panel-*`, `prop-edit-ico`, `ls-new-property`, `positioned-properties` |
| `.ed-*` (21) | `block-editor`, `ed-line`, `ed-delim`, `ed-hidden`, `ed-pill`, `ed-raw`, `ed-overlay`, `ed-pos`, `ed-sel` | `ed-r`, `ed-pad`, `ed-caret` (native-painted), `ed-bold…ed-sup` mark set (9), `ed-block-ref/-page-ref/-tag/-link/-url` accent set |
| `.sidebar-*` (38) | `sidebar-navigations`, `sidebar-header/contents-container`, `hd`, `wrap-th`, `as-edit`, `more`, `link-item`, `item`, `active`, `keyboard-shortcut`, `left-sidebar-inner` | `sidebar-content-group(-inner)`, `bd`, `sidebar-item*`, `sidebar-item-list`, `sidebar-panel-content`, `sidebar-drop-indicator`, `sidebar-page-actions`, `lui-list`, `left-sidebar-top`, `cp__graphs-selector`, `shade-mask` |
| `.cp__*` (14) | `cp__header(-l/-r)`, `cp__sidebar-main-content`, `cp__content-wrap`, `cp__overlays`, `cp__overlay-layer`, `cp__dialog-shell`, `cp__theme-modes-options`, `cp__cmdk-hint-label` | `cp__sidebar-left-layout`, `cp__right-sidebar*`, `cp__graphs-selector`, `cp__not-found`, `cp__sidebar-help-btn`, `cp__sidebar-help-docs` (last three web-only surfaces or handled natively) |
| `.page-*` (38) | `page-inner`, `ls-page-title(-container)`, `ls-page-title-actions` | `page-title(-sizer)`, `page-icon`, `page-ref` family partial (`page-ref`+`bracket` registered; `page-reference`, `a.page-title`, `page-properties`, `ls-page-properties`, `ls-page-icon(-btn)` not), `page-tabs` |

## Findings

**Biggest movable groups (typed props + recipe):**

1. **Properties panel** — 44 of 60 rules movable (~73%): the
   `property-panel-row` grid → `row`+fixed-key-column, the ellipsis/color
   sets, and the 4-site **chromeless text-button** cluster. Largest
   single win in the file.
2. **Left sidebar rows/groups** — 52 of 105 movable: `nav_item`/
   content-group recipes + `selected-background`/`hover-*` state props;
   the ~42 KEEP-hook rules are the drawer/overlay machinery the sibling
   kit review already schedules for a web `drawer` kind.
3. **Block chrome** — 37 of 78 movable in §9–§10: `--ls-block-icon-size`
   ladder and `is-page-title-row` offsets flip to emit-time props;
   `data-has-heading`/`:has()` selectors become emit-time variants.
4. **Editor appearance** — only ~10 of 44 movable (all appearance, zero
   layout): `ed-delim`/`ed-sel`/`ed-pill`/`ed-raw` colors and the 7-rule
   mark mirror set. Everything positional/animated is KEEP — verified
   against `edit_view.ml` wiring (`class_signal` + `bind_int` channels).
5. **Breadcrumb** — 6/6 movable, smallest complete win.

**Surprises:**

- **`margin` has no typed prop** — ~40 rules blocked on `margin-left/right/
  top/inline:auto`. Workable via parent `~main:`center`/`~gap`/`~padding`
  restructuring in most places; genuinely stuck cases: `margin-left:-20px`
  gutter tricks (`.ls-page-blocks`, `.property-block-container`),
  `margin:0.2em` on `h1.title`, sibling-margin selectors.
- **State props already exist** — `hover-background`, `hover-opacity`,
  `pressed-*`, `selected-background` cover a large slice of the `:hover`
  rules; the residue is *group-hover descendant reveals*
  (`.parent:hover .child`), which has no prop and no recipe answer yet —
  the `.control-hide` fold-caret reveal is the flagship case.
- **`ls-block` itself has no gpui registration** — the most-used class in
  the app rides the gpui default; its `container-type/name: ls-block` +
  transform/will-change/transition block is web-only anyway.
- **`color-level` ladder unregistered** — right-sidebar cards render
  depth-tinted on web, flat on gpui.
- **`ed-bold…ed-sup` mark set unregistered** — gpui editor shows unstyled
  marks (or relies on its own syntax path).
- **Duplicate `.external-link` rule** (174 vs 1947) — dead duplicate.
- **`.asset-container img.lui-image-pixels`** — a 5-declaration
  `!important` wall fighting the image kind's own inline
  `width/height:100%`; the correct fix is prop-level (emit the right
  sizing), which deletes both sides.
- **`[data-property-type]` / `[data-heading]` / `[data-has-heading]`** —
  selectors that key off attributes the emitter already computes; each
  converts to a plain emit-time prop choice, deleting both the attr and
  the selector.
- **Editor-critical rules all KEEP as predicted**, with two exceptions
  worth flagging: `.ed-hidden` can bind `~visible` on the same
  `class_signal` channel, and `.ed-delim`/`ed-sel`/`ed-pill`/`ed-raw` are
  pure color — typed today if a `cls → props` map is added at `frag_view`.
- **`-webkit-app-region`, `::-webkit-scrollbar-*`, `field-sizing`,
  `mask-image`, `::selection`, `@media`/`container-type`** — the
  web-only residue (~35 rules) that should stay in the sheet even after
  full migration; it's legitimately platform decoration, not a gap.
