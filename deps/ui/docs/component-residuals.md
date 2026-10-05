# Component residuals — `TODO(component)` audit

Audit of `deps/ui/` on `devin/component-migration` (tip `faac3b841b`). Every
`TODO(component)` marker: **145 total — 142 code sites**, 1 convention comment
(`render_dom.ml:39`), 2 documentation references
(`docs/editor-surface-extension.md:3`, `:123`).

Each site is classified by the *primary* missing vocabulary:

- **prop** — a missing kind property
- **event** — missing event payload fields / event types
- **attrs** — a data-\*/aria-\*/role/tabindex/draggable/id/class contract read by
  delegated handlers, CSS, or e2e
- **extension** — genuinely platform-special widget
- **css** — element-selector stylesheet contract
- **dom-op** — imperative host op (measure, scroll, focus, click, file pick)

## Summary

| Bucket | Sites | Proposed mechanism |
|---|---|---|
| attrs | 60 | `data_attrs` prop (typed attr-pair list, signal-capable) on container/leaf kinds; migrate `closest`-reading consumers to it or to `accessibility_identifier` node ids |
| prop | 35 | see table — biggest single win: positioned overlay kind (`~at:`/`~anchor`, `~role`, `~keep_selection`) covering 13 fixed-position shells |
| extension | 18 | formal `logseq-*` extension family (editor, emoji, codemirror, virt-list/lazy, embed, katex, pdf) + keep `el` as the raw-element escape hatch for user markup |
| event | 11 | enrich press/pointer payloads: `{modifiers, client_x, client_y, target, interactive}` + pointerdown/up, pointer-enter/leave, contextmenu |
| css | 6 | rewrite element selectors to class anchors, or an `~as:` element-override prop on `heading`/`text`/`button` |
| dom-op | 6 | new ops on the existing channel: `click`/`open-file-picker`, `download`, `scroll-into-view`/`focus` by node id |
| (info) | 3 | `render_dom.ml:39` convention comment; `editor-surface-extension.md:3,123` doc references |

## Top protocol additions (by sites unblocked)

1. **`data_attrs` typed prop** (+`~data_attrs_signal`) — name/value pairs
   restricted to `data-*`/`aria-*`/`role`/`tabindex`/`draggable`/`id`/`style`
   on every container kind. Unblocks all 60 attrs sites plus the attr halves
   of ~15 prop/event sites (~75 sites total). This is *not* the forbidden
   `~attrs` JSON hatch: it's a typed, channel-limited vocabulary the ppx can
   validate and native hosts can ignore or map.
2. **Extension family** — `logseq-editor` (5), `logseq-virt`/`logseq-lazy`
   spine (5), `logseq-codemirror` (3), `logseq-embed` (2), `logseq-pdf`
   (1, already exists on Apple), raw-element escape for user markup (2).
   Unblocks 18 sites. `logseq-em-emoji` and `logseq-katex` are registered
   (src/extension/logseq_emoji.ml, logseq_katex.ml) with apple twins
   emitting the same generic wire shape as before.
3. **Positioned overlay kind** — `~at:(x,y)` / `~anchor:` + `~role`,
   `~available_height`, keep-selection marker. Unblocks 13 fixed-position
   shells (menus, popovers, dialogs, not-found overlay) plus `selection_bar`.
4. **Event payload enrichment** — `{modifiers, client_x, client_y, target,
   interactive}` on press; `pointerdown`/`up` with coords;
   pointer-enter/leave; `contextmenu` with coords. Unblocks 11 sites and
   removes secondary blockers on ~8 attrs/prop sites.
5. **`image ~source:`url(string)`** — blob/object URLs. Unblocks 4 sites.

---

## attrs — 60 sites

Contract: `data-*`/`aria-*`/`role`/`tabindex`/`draggable`/`id`/class handles
read by delegated handlers (`*_state.ml` doc listeners, `dom_adapter`,
`virtualizer`, `virtual_scroll`), CSS (`lui-overlay.css`, `lui-core.css`), or
e2e locators.

| Site | Function | Element now | Reader(s) | Proposed fix |
|---|---|---|---|---|
| src/pages/page.ml:331 | `page_title_el` | `.ls-block` dom, attrs: `blockid`,`containerid`,`data-block-title`,`haschild`,`data-comment-item`,`data-comments-area`,`level`,`data-collapsed`,`data-db-collapsable`,`data-block-format`; `style_class_signal` for `selected` | `block_dnd` (`[blockid]` queries), `block_selection`, `editor_keys`/`editor_actions` (`blockid`,`containerid`), `collapsable_title` (`data-db-collapsable`) | `data_attrs`/`data_attrs_signal` on `box`/`row`; long-term the `logseq-block` extension owns the row contract |
| src/pages/page.ml:387 | `page_title_el` | `dom ~tag:"span" .control-hide` wrapper around fold caret | page.ml's own `.block-control > span` query in the mouseenter/leave handler | Restructure: drive caret show/hide from a `hover` signal + `class_signal` (see event bucket, :351) — then the span is deletable |
| src/pages/page.ml:536 | `add_button_el` | `dom .block-add-button` attrs: `tabindex`, `parentblockid` | `editor_keys.ml:977,1428` doc-level click (`closest .block-add-button`, reads `parentblockid`); `add_button.ml` doc-scan | `data_attrs` prop; alternatively a `logseq-block-add` extension if the block extension absorbs the append affordance |
| src/pages/page.ml:573 | `blocks_inner` | `dom .blocks-list-wrap` attrs: `data-level`,`data-virtuoso-scroller` | `virtual_scroll.ml` MutationObserver (`[data-virtuoso-scroller] [data-index]`), dnd scaffold | `data_attrs` prop; or the virt-list extension owns the scaffold attrs |
| src/pages/page.ml:594 | `blocks_inner` | `dom .blocks-list-wrap` attr: `data-level` | same scaffold | `data_attrs` prop |
| src/pages/page.ml:605 | `blocks_inner` | `dom .blocks-container` attr: `containerid` | `block_dnd`, `editor_actions` container queries | `data_attrs` prop |
| src/pages/page.ml:615 | `blocks_inner` | `dom .page-blocks-inner` attrs: `data-cid`,`data-pu` | `editor_actions.ml:223` `closest [data-cid]`; `add_button.ml:66` `data-pu` | `data_attrs` prop |
| src/pages/page.ml:704 | `refs_view_head` | `dom .property-value-inner` attr: `data-type` | property-cell trigger contract (jtrigger/open-value flows) | `data_attrs` prop; or a property-trigger kind |
| src/pages/page.ml:774 | `ref_group` | `dom` wrapper, `~attrs:extra_attrs` = `data-index`,`data-item-index`,`style:overflow-anchor` | `virtualizer`/`virtual_scroll` measure path | `data_attrs` prop on the group container |
| src/pages/page.ml:781 | `ref_group` | `dom ~tag:"a" .page-ref` attrs: `tabindex`,`draggable`,`data-ref` | `sidebar_state.on_doc_click` (`a.page-ref`, `data-ref`/`data-uuid`), popups hover preview (`a[data-ref]`), dnd | `data_attrs` + `~draggable`/`~tabindex` on `link` |
| src/pages/page.ml:825 | `ref_groups_virt` | `dom .group-list-view` attrs: `data-virtuoso-scroller`,`data-viewport-type`,`data-testid=virtuoso-item-list`,`data-index`,`data-item-index`, inline styles | `virtual_scroll.ml`, `virtualizer.ml`, e2e | virt-list extension owns the whole scaffold; interim `data_attrs` |
| src/pages/page.ml:868 | `references_row` | `dom ~tag:"a" .page-ref` attr: `data-ref` | `sidebar_state.on_doc_click` | `data_attrs` on `link` |
| src/pages/page.ml:884 | `ref_item` | `dom ~tag:"a" .references-item-page` attr: `data-ref` | `sidebar_state.on_doc_click` | `data_attrs` on `link` |
| src/pages/page.ml:1112 | `journal_item_sig` | `dom .cp__page-inner-wrap.is-journals`, `~attrs:(page_wrap_attrs p0)` incl. `data-page-tags` | plugin page-wrap contract (cljs `container.cljs`); no LUI readers — plugins only | `data_attrs` prop |
| src/pages/page.ml:1133 | `journal_item_sig` | `dom .page-blocks-inner` attrs: `data-cid`,`data-pu` | same as :615 | `data_attrs` prop |
| src/pages/page.ml:1142 | `journal_item_sig` | `dom .blocks-list-wrap` attr: `data-level` | same as :594 | `data_attrs` prop |
| src/pages/page.ml:1285 | `blocks_area` | `dom .blocks-list-wrap` attr: `data-level` | same | `data_attrs` prop |
| src/pages/page.ml:1294 | `blocks_area` | `dom .blocks-list-wrap` attrs: `data-level`,`data-virtuoso-scroller` | same | `data_attrs` / virt extension |
| src/pages/page.ml:1318 | `blocks_area` | `dom .page-blocks-inner` attrs: `data-cid`,`data-pu` | same as :615 | `data_attrs` prop |
| src/pages/page.ml:1326 | `blocks_area` | `dom .blocks-container` attr: `containerid` | same as :605 | `data_attrs` prop |
| src/pages/page.ml:1465 | `page_view_ms` | `dom` page root, `~attrs_signal_v` carrying dynamic `data-page-tags` etc. | plugin page-wrap contract | `data_attrs` + signal variant (`data_attrs_signal`) — the one site that needs the signal form |
| src/cmdk/cmdk_view.ml:328 | `hl_span` | `dom ~tag:"span"`, `attrs_signal` `data-testid=<plain title>`; `mark` children | e2e `cmdk_scroll_basic_test` counts `[data-testid^=…]`; CSS `[data-cmdk-item] mark` | `data_attrs` (+ `mark`/emphasis via css bucket) |
| src/cmdk/cmdk_view.ml:407 | `item_row` | two `dom` wrappers, attrs: `data-item-index`,`data-item-key`,`data-cmdk-item`,`data-hoverable`,`data-highlighted`,`data-kb-highlighted` | `cmdk_view` delegated `handle_click`/`handle_mousemove` (`closest .cp__cmdk [data-item-key|index]`), `lui-overlay.css` `[data-cmdk-item]…`, e2e | `data_attrs`/`data_attrs_signal`; or a cmdk list-item kind carrying `~index`/`~highlighted` semantics |
| src/cmdk/cmdk_view.ml:785 | `palette` | `dom .cp__cmdk` attr: `data-keep-selection` | `selection_bar.ml:63` doc mousedown `inside [data-keep-selection]`; CSS `div[data-keep-selection].menu-links-wrapper` | `data_attrs` prop |
| src/cmdk/cmdk_view.ml:910 | `modal_shell` | `dom .ui__dialog-content` attrs: `role=dialog`,`data-state`,`style:--nested-dialogs` | base-ui dialog contract + e2e | `data_attrs` prop; or `dialog` kind with `~role`/`~state` |
| src/render/render_inline.ml:27 | `page_link` | `D.el ~tag:"a" .page-ref/.tag` attrs: `data-ref`,`tabindex`,`draggable`, `attrs_signal` `data-uuid` | `sidebar_state.on_doc_click`, popup hover preview, dnd, cljs-parity selectors | `data_attrs`/`data_attrs_signal` on `link` |
| src/render/render_inline.ml:280 | `block_ref_anchor` | `D.el ~tag:"a" .page-ref` attrs: `data-ref`,`tabindex`; `text_signal` | same | `data_attrs` on `link` |
| src/render/render_inline.ml:290 | `block_ref` | `D.el ~tag:"span" .page-reference` attr: `data-ref` | delegated-event + hover-preview hooks | `data_attrs` on `text`/`box` |
| src/render/render_inline.ml:360 | `timestamp_el` | `D.el ~tag:"a" .youtube-timestamp` (+ `.youtube-timestamp-icon/-label`, inline svg) | `render_libs` delegated click (`el_closest a.youtube-timestamp`), label query | keep class anchor via `style_class` (already works); needs only `data_attrs`? No — class suffices once svg icon is an `app` icon. Fix: register timestamp svg as app icon, keep `link ~style_class:"youtube-timestamp"`; the label span stays `text` |
| src/render/render_inline.ml:617 | `page_ref` | `D.el ~tag:"span" .page-reference` attr: `data-ref` (+`attrs_signal`) | same ref hooks | `data_attrs` |
| src/render/render_inline.ml:627 | `resolved_ref` | `D.el .page-reference`/`.page-ref.broken` attrs: `data-ref`,`data-uuid`,`tabindex`,`draggable` | same | `data_attrs` |
| src/render/render_inline.ml:646 | `resolved_ref` | inner `a.page-ref` same attr set | same | `data_attrs` |
| src/render/render_inline.ml:675 | `resolved_tag_ref` | `D.el ~tag:"a" .tag` attrs: `data-uuid`,`data-ref`,`tabindex` (`attrs_signal`) | same | `data_attrs`/`data_attrs_signal` |
| src/render/render.ml:401 | `title` | `D.el ~tag:"div"` attr: `data-node-type` | e2e selector | `data_attrs` prop |
| src/shell/chrome.ml:446 | `rtc_indicator` | hidden `box` `accessibility_identifier:"rtc-tx"` — e2e reads `[data-testid="rtc-tx"]` | e2e | `data_attrs` (`data-testid`) or move e2e to the a11y id — decide which contract wins |
| src/pages/page_menu.ml:153 | `user_item` | `dom` menuitem attrs: `role=menuitem`,`tabindex=-1` | e2e `div[role='menuitem']` | `data_attrs` `role`/`tabindex`, or `menu_item ~role` built in |
| src/pages/page_menu.ml:319 | `confirm_view` | `dom` attrs: `role=alertdialog` | e2e `div[role='alertdialog']` | `data_attrs`; or `alert_dialog` kind |
| src/dialogs/plugin_readme.ml:185 | `body` | `dom .cp__plugins-details` attr: `data-capture-click` + click reads `href` payload | `dom_adapter.ml:262` | `data_attrs` + press payload `{href}` (event bucket) |
| src/views/views_table.ml:730 | `dnd_described`/`dnd_live` | `dom` nodes: `style:display:none`/`clip`, `role=status`,`aria-live`,`aria-atomic`, ids `DndDescribedBy-*`/`DndLiveRegion-*` | screen readers (dnd-kit a11y) | `data_attrs` incl. aria + `~hidden`/`~display` prop; or an `a11y_live_region` kind |
| src/views/views_table.ml:777 | `row_el` | `row .ls-block` — `blockid`/`data-id` readers still exist; uuid already on `accessibility_identifier:"ls-block-<uuid>"` | `block_dnd`, `block_selection` | No new vocab needed — migrate readers to `accessibility_identifier`/`#ls-block-<uuid>` (restructure); `data_attrs` if an interim shim is wanted |
| src/views/views_table.ml:936 | `list_row_el` | same as :777 | same | same |
| apple/views_table.ml:733 | `dnd_described`/`dnd_live` | same dnd-kit a11y twin (`display:none`/`clip` style, `role=status`,`aria-live`,`aria-atomic`, `DndDescribedBy-*`/`DndLiveRegion-*` ids) | screen readers | same as src twin |
| apple/views_table.ml:780 | `row_el` | `row .ls-block` — `blockid`/`data-id` readers; uuid on `accessibility_identifier` | `block_dnd`, `block_selection` | same as src twin — readers move to `ls-block-<uuid>` |
| apple/views_table.ml:939 | `list_row_el` | same as :780 | same | same |
| src/virt/virt_list.ml:418 | `list` (`row_mount`) | `D.dom .ls-virt-row`, `attrs_signal` `data-index` + `style:translateY` | `virtualizer.ml:77` measure path, MutationObserver | virt-list extension owns row attrs; interim `data_attrs` + style channel |
| src/virt/virt_list.ml:433 | `list` | `D.dom` list wrapper: `~id:list_id`, `~attrs:list_attrs`; spacer `style:height` signal | `attach` (getElementById, scroll-parent binding, `scroll_to_key` registry); caller `list_attrs` (`data-viewport-type`) | virt-list extension; interim `data_attrs` + `~id` passthrough |
| src/sidebar/left_sidebar_view.ml:393 | `page_item_el` | `dom ~tag:"button"` dots inside `a.link-item` — class hooks `sidebar-page-actions`,`ls-icon-dots` feed the anchor's `targetClass` check | the anchor's own click handler (event bucket :347) | Restructure with event payload `{target}` (once it exists, both sides become kinds); interim `data_attrs`/`style_class` already carry the classes |
| src/sidebar/right_sidebar_view.ml:365 | `item_body` | `dom .page-blocks-inner` attr: `data-cid` | `editor_actions` `[data-cid]` closest | `data_attrs` prop |
| apple/chrome.ml:210 | `rtc_indicator` | `dom` twin of src rtc incl. `data-testid="rtc-tx"` + hidden mount keeping emitters alive | e2e EDN contract | `data_attrs` prop |
| apple/chrome.ml:262 | `right_sidebar` | `dom ~id:"right-sidebar"`, `style_class_signal` open/closed | `sidebar_state` `get_element_by_id` | `data_attrs`/`~id` passthrough; or move reader to node id |
| apple/chrome.ml:304 | `main_content` | `dom ~id:"main-content-container"` + `attrs_signal` `data-is-margin-less-pages`,`data-is-full-width`,`class`,`style` | `graphs/recycle.ml`, `graphs_mount`, `export_page.ml` queries; `lui-core.css` `[data-is-full-width]` | `data_attrs`/`~id` passthrough |
| apple/chrome.ml:351 | `overlays` | `dom .cp__overlays` | `popups_state.ml:221` `el_closest` (inside-overlay check); mount host for cmdk/popups/dialogs | class anchor suffices — `box ~style_class:"cp__overlays"` once kinds render real nodes; keep as overlay-host kind otherwise |
| apple/asset_dom.ml:202 | `file_cell_el` | `dom ~tag:"img"` attr: `data-asset-file` | Swift asset-resolution contract | `data_attrs` prop; or `logseq-asset` extension carries the file ref |
| apple/asset_dom.ml:227 | `block_view` | `dom` `.asset-container` attrs: `data-asset-uuid`,`data-asset-type` + click | Swift asset resolution + pdf open | `data_attrs` + `on_press`; or `logseq-asset` extension |
| apple/cmdk_view.ml:399 | `item_row` | `dom` wrapper+row attrs: `data-item-index`,`data-item-key`,`data-cmdk-item`,`data-hoverable`,`data-highlighted`,`data-kb-highlighted` | `handle_click`/`handle_mousemove` closest | `data_attrs` |
| apple/cmdk_view.ml:498 | `group_header` | `dom .cp__cmdk-group-title` attr: `data-cmdk-group` | delegated `handle_click` | `data_attrs` |
| apple/cmdk_view.ml:508 | `group_header` | `dom ~tag:"a" .cp__cmdk-group-more` attr: `data-cmdk-group` | delegated `handle_click` | `data_attrs` |
| apple/cmdk_view.ml:552 | `search_only_chip` | `dom ~tag:"button"` attr: `data-cmdk-clear-filter` | delegated `handle_click` | `data_attrs` (or plain `button ~on_press`) |
| apple/cmdk_view.ml:729 | `palette` | `dom .cp__cmdk` attr: `data-keep-selection`; class is the delegated scope | outside-click + hover-highlight closest checks | `data_attrs` + class anchor |
| apple/cmdk_view.ml:885 | `modal_shell` | `dom .cp__cmdk__modal` | outside-click `closest` bound | class anchor / `data_attrs` |

## prop — 35 sites

| Site | Function | Element now | Needs | Proposed fix |
|---|---|---|---|---|
| src/pages/page.ml:1351 | `top_view` | `dom ~style:"display:contents"` | box-free container (grid-transparent segment) | `~display:`contents` prop on `box`, or a `passthrough`/`fragment`-with-class node |
| src/pages/page.ml:1355 | `top_view` | same | same | same |
| src/pages/page.ml:1359 | `top_view` | same | same | same |
| src/cmdk/cmdk_view.ml:387 | `shortcut_slot` | `dom .shui-shortcut-row`, `attrs_signal` `style:opacity` | inline opacity | `~opacity` (float) prop on container kinds |
| src/dialogs/plugins_view.ml:503 | `item_input` | `dom ~tag:"input" type=color|range` | color/range input variants | `input ~kind:`color`|`range`, or `color_well`/`slider` kinds |
| src/render/render.ml:29 | `wrap` | `D.el ~tag:h1..h6 .block-title-wrap` (+`wrap_attrs`) | e2e contract on real `hN` tags | `~as:`h1..`h6` element-override prop on `heading`; `data_attrs` for `wrap_attrs`. Alternative: e2e moves to `div[role=heading][aria-level]` |
| src/render/render.ml:359 | `content` | `D.el ~tag:"br"` (empty-title line box) | line-break element | `br` leaf kind (or `text ~break`) |
| src/render/render_inline.ml:271 | `external_link` | `a.external-link` `target=_blank` `href` | new-tab nav | `link ~target:`blank` |
| src/render/render_inline.ml:297 | `image_el` | `span.asset-container > img src=url` (attrs: src, loading, referrerPolicy, title, alt) | URL-sourced image | `image ~source:(`url src)` + `~loading`/`~alt` |
| src/render/render_inline.ml:577 | `try_match` | `\n` → `D.el ~tag:"br"` | same as render.ml:359 | `br` kind |
| src/render/render_inline.ml:894 | `try_lt` | `<br>`/`<br/>` → same | same | `br` kind |
| src/assets/asset_dom.ml:539 | `asset_img` | `img` blob-URL, `load` event, `#asset-img-<uuid>` queried | URL src + load hook + measure | `image ~source:`url` + `~on_load`; measure via dom-op by node id |
| src/assets/asset_dom.ml:692 | `file_cell_el` | async blob-URL `img` (`attrs_signal` src/title) | URL src | `image ~source:`url` (signal) |
| src/render/pdf_annotation.ml:136 | `area_display` | `.hl-area` inline `width` + `div.asset-container` inline width + `img` blob-URL `#hl-area-img-<uuid>` | URL src + width style + id query | `image ~source` + `~width`; lightbox switches to node-id lookup |
| src/export/export_view.ml:191 | `png_preview` | `img#export-preview` blob-URL (`attrs_signal`), `export_page.ml` pokes `el.src` + measures natural size | URL src + imperative measure | `image ~source` signal + dom-op `natural-size` by node id |
| src/cards/cards_view.ml:181 | modal | `.ui__dialog-content` attrs: `label`,`data-state`,`role=dialog`,`style:translate(-50%,-50%)` | dialog semantics + label attr read by `lui-overlay.css [label="flashcards__cp"]` | `dialog` kind (`~label` → emits both attr and class anchor), or `data_attrs` + centered placement from the overlay kind |
| src/shell/chrome.ml:33 | `icon_btn` | `data-tooltip`/`data-tooltip-keys` attrs lost; `~label` → aria-label only | tooltip content + keycap row read by `popups/tooltip.ml` | `~tooltip`/`~shortcut_hint` prop on `button`/`icon` kinds |
| src/shell/chrome.ml:594 | `header` | cljs inline `fontSize:50` on `.cp__header` — dropped | none | No fix needed — dropped deliberately (icon kind self-sizes); document as resolved |
| src/graphs/importer.ml:116 | `logo_svg` | inline `<svg>` 3 ellipses | custom svg | No schema change — register the logo path as `app` icon (same as `rotating-arrow`) → `icon ~name:(`app "logseq-logo")` |
| src/graphs/importer.ml:137 | `file_input` | `label.action-input > i+column(strong+small)+input[type=file][accept][webkitdirectory]` | file pick w/ accept+directory; label/strong/small tag CSS | `file_picker ~accept ~directory` props; label/strong/small → `text` with class anchors (css) |
| src/pages/page_menu.ml:323 | `confirm_view` | `h2.ui__alert-dialog-title` containing icon + text | `heading` is a leaf | `heading ~children`, or restructure: `row [icon; heading]` (preferred) |
| src/blocks/query_builder.ml:100 | `block_el` | `dom ~tag:"button" ~text` (direct text node required) | Playwright `button:text('filter')` needs the button itself to be the smallest text container | No schema change — update e2e to `button:has-text('Filter')`; alternatively `button ~text_placement:`inline` |
| src/blocks/selection_bar.ml:146 | `view` | `dom .selection-action-bar` `style:position:fixed;left;top;z-index;pointer-events:none` + `data-keep-selection` | computed fixed placement + keep-selection | positioned overlay kind (`~at:`/`~anchor`) + `data_attrs` |
| src/pages/page_menu.ml:261 | `view` | `dom .ui__dropdown-menu-content` `role=menu` + `style:position:fixed…` | pointer/trigger-anchored placement + role | positioned overlay kind + `~role:`menu` (`data_attrs`) |
| src/popups/popups_view.ml:359 | `ac_popover` | `dom ~id:"ui__ac" .ui__popover-content` — fixed x/y + `--available-height` + base-ui data-* (`attrs_signal`) | anchored placement + id hook + data attrs | positioned overlay kind + `data_attrs` + `~id` |
| src/popups/popups_view.ml:580 | `cm_sub_el` | `dom .ui__dropdown-menu-sub-content` `role=menu`,`tabindex`,`data-keep-selection`,fixed style | sub-menu anchored placement | same overlay kind |
| src/popups/popups_view.ml:627 | `cm_popover` | `dom .ui__dropdown-menu-content` — fixed, `role=menu`, `data-keep-selection`, width via style | anchored placement + role + keep-selection | same overlay kind + `data_attrs` |
| src/popups/popups_view.ml:779 | `pv_popover` | `dom .ui__popover-content.ls-preview-popup` — fixed + tippy styles | anchored placement | same overlay kind |
| src/settings/settings_page.ml:719 | `appearance_body` | `dom .ui__dropdown-menu-content.appearance-popup` `style:position:fixed;right;top` | anchored placement | same overlay kind |
| src/sidebar/left_sidebar_view.ml:38 | `menu_box` | `dom .ui__dropdown-menu-content` `role=menu` + fixed style | anchored placement + role | same overlay kind |
| src/sidebar/left_sidebar_view.ml:183 | `lp_menu` | `dom` `role=menu` + fixed style | pointer-anchored placement + role | same overlay kind |
| src/sidebar/right_sidebar_view.ml:93 | `item_menu` | `dom` `role=menu` + fixed style + min-width | pointer-anchored placement + role | same overlay kind |
| apple/chrome.ml:502 | `not_found_page` | `dom` `style:position:fixed;inset:0;z-index` | full-screen fixed overlay | same overlay kind (`~inset:0`) |
| apple/page_menu.ml:167 | `view` | `dom` `role=menu` + fixed style | anchored placement + role | same overlay kind |
| apple/settings_page.ml:717 | `appearance_body` | `dom` fixed right/top | anchored placement | same overlay kind |

## event — 11 sites

Missing payload fields / event types. Proposed payload: press/pointer events
carry `{modifiers (shift/ctrl/alt/meta), client_x, client_y, target
(node/class identity), interactive (whether the hit target was an
interactive descendant)}`; plus `pointerdown`/`pointerup`,
`pointer_enter`/`pointer_leave`, `contextmenu {x,y}`.

| Site | Function | Element now | Needs | Proposed fix |
|---|---|---|---|---|
| src/pages/page.ml:252 | `title_content` | `dom .block-content` `events:"click"` reads `shiftKey`,`interactive`; attrs `blockid`,`containerid`,`data-type`,`style:width` | click modifiers + interactive-target flag | press payload `{modifiers, interactive}`; attrs → `data_attrs` |
| src/pages/page.ml:351 | `page_title_el` | `dom .block-main-container` `events:"mouseenter mouseleave"` + `style:margin-left` | pointer enter/leave to drive fold caret | `~on_pointer_enter`/`~on_pointer_leave` (or `hover` signal on the kind) |
| src/pages/page.ml:484 | `page_title_el` | `dom #page-title` `events:"click contextmenu"` reads `targetId`,`shiftKey`,`interactive`,`clientX/Y`; `data-testid` | click target identity + modifiers; contextmenu coords | press payload `{target, modifiers}` + `~on_context_menu:{x,y}`; `data_attrs` for testid |
| src/assets/asset_dom.ml:579 | `resize_handle` | `dom ~tag:"span" .image-resize` `events:"pointerdown"` → window pointermove/up drag | pointerdown coords + drag lifecycle | pointer gesture event (`pointerdown {x,y}` + move/up) or a `drag_handle`/`resize_handle` kind |
| src/render/pdf_annotation.ml:123 | `area_btn` | `button` `events:"pointerdown click"` + `<i class=ti-*>` child | pointerdown (lightbox ref tracking) + click; font icon | pointerdown event; register `ti-*` glyphs as `app` icons |
| src/render/pdf_annotation.ml:199 | `prefix_el` | `span.prefix-link` `events:"pointerdown"` reads `targetClass` | pointer event target identity | pointerdown payload `{target}` |
| src/dialogs/dialogs_view.ml:72 | `dialog_view` | `dom` scrim `events:"click"` reads `targetClass` (deepest hit) | backdrop-vs-content discrimination | `~on_backdrop_press` on the overlay kind, or press payload `{target}` |
| src/dialogs/dialogs_view.ml:101 | `confirm_view` | same pattern | same | same |
| src/pages/page_menu.ml:306 | `confirm_view` | same pattern (`ui__alert-dialog-overlay`) | same | same |
| src/sidebar/left_sidebar_view.ml:347 | `page_item_el` | `dom ~tag:"a" .link-item` `events:"click"` reads `targetClass`,`shiftKey`,`clientX`,`clientY`; `data-lp-*` attrs feed doc `contextmenu` | full press payload + contextmenu | press payload `{modifiers, x, y, target}` + `~on_context_menu`; `data_attrs` for `data-lp-*` |
| apple/page_menu.ml:218 | `confirm_view` | same scrim `targetClass` pattern | same | same |

## extension — 18 sites

Genuinely platform-special widgets (per the SKILL.md policy) plus the raw
`el` escape hatch for user-authored markup.

| Site | Function | Element now | Extension | Proposed fix |
|---|---|---|---|---|
| src/core/ui_parts.ml:44 | `mock_text` | `dom .mock-text` caret-mirror host | `logseq-editor` | per editor-surface-extension.md — fold into the editor extension node |
| src/core/ui_parts.ml:53 | `editor_inner` | `dom .editor-inner.block-editor` | `logseq-editor` | same |
| src/core/ui_parts.ml:57 | `editor_wrapper` | `dom .editor-wrapper` | `logseq-editor` | same |
| src/pages/page.ml:152 | `title_editor` | `textarea#edit-block-<uuid>` `events:"keydown blur"` (`key`,`value` payloads) | `logseq-editor` | editor conduit events (`key`/`blur`) per the extension doc |
| apple/comments.ml:153 | `title_editor_el` | `textarea#edit-block-<uuid>` | `logseq-editor` | same |
| src/render/render.ml:218 | `code_block` | `textarea#edit-block-<uuid>` + `data-lang`; CM mounts on `.code-editor textarea`, resolves via `#ls-block-<uuid>` | `logseq-codemirror` | CM host extension (mount point + `lang`/`uuid` props + edit events) |
| src/views/views_query.ml:410 | `cm_host` | `dom .CodeMirror > pre.CodeMirror-line[contenteditable][role=textbox]`; `attach_cm` binds listeners imperatively | `logseq-codemirror` | same extension hosts the query source editor |
| apple/views_query.ml:413 | `cm_host` | same twin | `logseq-codemirror` | same |
| src/render/render_inline.ml:497 | `youtube_iframe`/`embed_iframe` | `.embed-block > iframe` (youtube enablejsapi attrs; plugin src) | `logseq-embed` | iframe/embed extension carrying `src`,`allow`,…; timestamp seek via postMessage stays host-side |
| src/dialogs/plugin_readme.ml:178 | `body` | `iframe.lsp-frame-readme src=./marketplace.html?repo=…` | `logseq-embed` | same embed extension |
| src/render/render_html.ml:105 | `el_of_node` | `D.el ~tag ~attrs` for arbitrary `@@html` fragments | (raw-element escape) | No new protocol — `D.el`/`dom` stays as the *documented* raw-element escape for user markup; rename if `dom` must die |
| src/views/views_view.ml:109 | `hiccup_els` | `dom ~tag ~attrs` for `:view` user hiccup | (raw-element escape) | same |
| apple/lazy_children.ml:13 | `lazy_children` | `dom .block-children` `data-lazy-mount` + `lazy-mount` event + min-height | `logseq-virt`/`logseq-lazy` | Swift spine contract folds into the virt-list extension |
| apple/virt_list.ml:115 | `list` row_mount | `dom .ls-virt-row` `data-lazy-mount` + `lazy-mount` | `logseq-virt` | same |
| apple/virt_list.ml:132 | `list` | `dom` list `data-virt-count` + `virt-end` event | `logseq-virt` | same |
| apple/virt_list.ml:188 | `rows_sig` row_mount | same lazy-mount contract | `logseq-virt` | same |
| apple/virt_list.ml:204 | `rows_sig` | same `data-virt-count`/`virt-end` | `logseq-virt` | same |
| apple/pdf.ml:385 | `viewer_el` | `dom ~tag:"pdf"` `events`/`attrs_signal` whole viewer | `logseq-pdf` | Already an extension node — no fix; formalize the event channel (annotation events → OCaml, data props → host) |

## css — 6 sites

Element-tag selectors in stylesheets/e2e; kinds emit `span`/div-based
elements and lose the semantics.

| Site | Function | Element now | Contract | Proposed fix |
|---|---|---|---|---|
| src/render/render.ml:286 | `src_eval_el` | `D.el ~tag:"code"` + `~tag:"pre".code` | `:not(pre) > code`, `pre` whitespace rules | rewrite selectors to `.ls-src-result code`-style class anchors, then `text`/`paragraph` kinds; or `~as:`code`/``pre` |
| src/render/render_inline.ml:310 | `code_span` | `D.el ~tag:"code"` (and the `emph` family: b/i/em/mark/del/u/s/sub/sup/strong/kbd) | `:not(pre) > code`, `mark {}`, tag-selected emphasis rules | class anchors per tag (`ls-code`,`ls-mark`…) or `~as:` element prop on `text` |
| src/render/render_inline.ml:381 | `emph` | `D.el ~tag` for b/i/em/… | same | same |
| src/graphs/exporter.ml:318 | `body` | `dom ~tag:"h1" .title.ls-mb` | `.export h1.title.ls-mb` keys on the tag | move rule to `.export .ls-export-title` class anchor → then `heading` |
| src/graphs/importer.ml:182 | `article` | `dom ~tag:"h1"/"h2"` | `.importer .c h1/h2` key on tags | class anchors → `heading` |
| src/graphs/importer.ml:195 | `view` | `dom ~tag:"h1".ls-imp-title` + `h2` | `.inner-card > h1.ls-imp-title / > h2` key on tags | class anchors → `heading` |

## dom-op — 6 sites

Imperative host operations. The dom-op channel exists (scroll-into-view,
node bounds, focus); these need new ops or node-id rewiring.

| Site | Function | Element now | Op needed | Proposed fix |
|---|---|---|---|---|
| src/assets/asset_dom.ml:265 | `upload_input` | hidden `input#upload-file[type=file]`; `editor_actions` clicks it, `change` reads `el.files` | `open-file-picker` on a node id, or invoke the file_picker request API directly | new dom-op `open-file-picker` (returns file list); alternatively rewire `trigger_asset_upload` to the `file_picker` kind — no DOM node needed |
| apple/asset_dom.ml:179 | `upload_input` | same contract | same | same |
| src/shell/chrome.ml:799 | `export_anchors` | hidden `<a>` anchors (`#download`,`#download-as-*`); export code `getElementById`→set `href`→`click()` | `download` host op | new dom-op `download {name, url|blob}` replacing the anchor hack entirely |
| apple/chrome.ml:390 | `export_anchors` | same | same | same |
| apple/cmdk_view.ml:573 | `scroller` | `dom .cp__cmdk-scroller` queried for `scroll-into-view` | scroll-into-view by node id | dom-op already supports it — switch `cmdk_state` to node ids (`data_attrs`/`~id` on the kind meanwhile) |
| apple/cmdk_view.ml:592 | `input_row` | `dom ~tag:"input" .cp__cmdk-search-input` — queried/focused + imperative input events | focus by node id + `on_input` | `input ~on_input` + dom-op `focus` by node id |

## Informational (3)

- `src/render/render_dom.ml:39` — the convention comment itself (explains
  that `[el]`/`[dom]` survivors carry `TODO(component)` notes). No action;
  delete when the last residual goes.
- `docs/editor-surface-extension.md:3` and
  `docs/editor-surface-extension.md:123` — references to the keep-sites and
  the ~140 residuals; update the pointer to this file.

## Notes on secondary needs

Sites frequently span buckets; the primary bucket above is what unblocks
*most* of the site. Recurring secondary needs:

- **virtuoso scaffold** (page.ml:573,594,774,825,1285,1294; virt_list:418,433):
  `data_attrs` unblocks the attrs; the clean end-state is a `logseq-virt`
  extension owning scroller/viewport/item-list structure, covering web and
  Swift spines uniformly.
- **`.ls-block` row contract** (page.ml:331,536,605,615,1133,1142,1318,1326;
  views_table:777,936 + twins): `data_attrs` is the interim; several readers
  (`blockid`/`data-id`) can already migrate to the emitted
  `accessibility_identifier` (`ls-block-<uuid>`) without any schema change.
- **`mark`/`code`/`h1-h6`/`label`/`strong`/`small` element tags**: split
  between the `~as:` element-override prop (cheap, general) and rewriting
  the ~10 CSS rules/e2e locators that key on tags (one-time sweep).
