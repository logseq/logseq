# Task 1 pages & editor chrome visual inventory

Working inventory for `2026-10-10-003-shared-ui-visual-design.md`,
Task 5 batch "Pages and editor chrome". Scope is page chrome and block
decorations — bullet, indent guide, selected highlight, drop indicator,
block-ref/tag pills, embed containers, `.ls-block` chrome, view heads
and view tables. Text/editor internals (textarea content styling)
are included only where they are chrome-adjacent (heading sizes drive
`.block-control` offset); deep editor text shaping is out of scope.

Source files audited:

- `resources/css/lui-core.css` — page/journal 1425–1571 (26),
  breadcrumb 2044–2101 (10), outliner 2102–2667 (100), editor chrome
  2668–2982 (46), inline elements 2983–3358 (64), misc 3359–3548 (30);
  276 rules
- `resources/css/lui-overlay.css` — view switcher/head 4012–4110 (11),
  view-head helpers 5315–5600 (38), view table + fold + filter
  5601–6079 (66), selection action bar 6345–6399 (6), theme var block
  6400–6418 (1), `.ls-page-icon` 6419–6440 (3); 125 rules
- `deps/ui/gpui/host/src/logseq_ext.rs` — editor/chrome registrations
  (`block-head-wrap`, `extensions__code(-lang)`, `bracket`, `page-ref`,
  `ls-blockquote`, `ls-block-content-indent`, `ls-block-properties`,
  `properties-panel`, editor `ed-*`: `block-editor`, `ed-line`,
  `ed-delim`, `ed-hidden`, `ed-pill`, `ed-raw`, `ed-overlay`, `ed-pos`,
  `ed-sel`, `selected`, `block-highlight`, plus `block-control-*`,
  `block-drag-*`, `bullets/*`, `ls-page-title*`, `control-hide`,
  `ls-page-blocks`, `page-inner`, `journal-item`, `journal-last-item`)
- `deps/ui/src/pages/page.ml`, `deps/ui/src/render/tree.ml`,
  `render.ml`, `render_inline.ml`, `editor/edit_view.ml`,
  `editor/logseq_editor.ml`, `views/views_table.ml`,
  `views/views_head.ml`, `selection/selection_bar.ml`,
  `blocks/block_dnd.ml` — emitters

Classification legend: **layout** / **appearance** / **state** /
**hook** / **deco**.

## Page chrome (title, journal list, breadcrumb)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `#journals` `overflow-anchor:none` + `.journal-item` border-b min-h-250 pb-102 (+ `:first-child` min-h-500) + `.journal-last-item` no border | layout+deco | journal-item recipe (first-child → emit variant class); overflow-anchor is web scroll deco |
| `.ls-page-blocks` min-h-60 overflow-hidden ml-−20 (+ `.page-inner >` mt-16, right-sidebar override) | layout | blocks-root recipe; gpui reg twin |
| `.ls-bidirectional-properties:empty` display none | deco | emit nothing instead |
| `.cp__page-inner-wrap > .page-inner` pb-4rem | layout | page-body recipe; gpui `page-inner` twin |
| `h1.title`/`.ls-page-title-container` fw-500 `var(--ls-page-title-size,32px)` + `.ls-page-title` radius + `.edit-input` borderless + `.edit-input-wrapper.editing` bg + `.page-icon`/`ls-page-icon(-btn)` 38px bordered button | layout+appearance+state | page-title recipe + editing variant + icon-button slots |
| `.ls-page-title-actions` absolute top −1.25rem opacity 0 + `:hover >` reveal + `:has(button[data-popup-active])` force-show + transition-delay | layout+state | title-actions slot (group-hover + popup-active pin → gap) |
| `a.page-title`, `.page-title-sizer-wrapper` overflow-x auto + `:empty::before '\200b'` + `.title` ellipsis | layout+appearance | title-link recipe (`:empty::before` ZWSP → emit real placeholder) |
| `.breadcrumb a` link color; `.block-parents` flex nowrap overflow; `.breadcrumb-item` op-.7→1; `.breadcrumb__segment` `max-width: var(--breadcrumb-segment-max-width, 28ch)` inline-flex + `__label` ellipsis + `__overflow` | layout+appearance+state | breadcrumb recipe (ch-unit max-width → gap; `-icon`/`-overflow` dead) |

## Block chrome (`.ls-block`, controls, bullets, indent)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.ls-block` flex-1 relative pad margin `container-type/name: ls-block` + `transform:translateX(0)`/`will-change`/`transition` + `.selected` radius | layout+state | block recipe + selected variant (transform/transition deco; container-name → deco) |
| `.block-main-container` min-h-24 + `[data-has-heading='1'/'2']` / `:has(textarea.h1/.h2)` `.block-control` top offsets + `.is-page-title-row` ml-−36/−30 | layout+state | block-row recipe + heading variant (data attr → typed prop; :has → variant) |
| `.is-page-title-row` `.lui-column`/`.lui-row` flex sizing overrides | layout | title-row layout (kind-level flex props) |
| `.block-control-wrap` h-24 relative + `--ls-block-icon-size` per `[data-heading]` 1–6 + `.is-order-list`/`.is-with-icon`/`.bullet-hidden` variants | layout+state | block-control recipe (heading-size token per heading level; variants as props) |
| `.block-control` min-w/h-22 op-.4 user-select + `.control-hide` display none + `:active` .3 | appearance+state+hook | control recipe + control-hide slot |
| `.block-main-container:hover > .block-control-wrap[data-has-children='true'] > .block-control .control-hide` display revert | state | hover-reveal fold caret (group-hover → gap; `data-has-children` attr is the hook) |
| `.bullet-container` 1em round + `.as-order-list` 1.4em nowrap + `.bullet` .4em dot radius-full bg gray-08 + `transition transform` | layout+appearance | bullet recipe (scale-on-hover deco) |
| `.bullet-container:not(.typed-list)` + `.bullet-closed` + `.typed-list:not(:focus-within) .bullet` bg/height overrides | state | bullet-state variants (closed/typed → typed props, not :not()) |
| `.bullet-link-wrap` inline-flex + `& > .bullet-container:not(.typed-list) .bullet` hover `scale(1.2)` | state+deco | bullet hover variant (scale → deco or typed hover-scale) |
| `.block-children-container` relative ml-29 pt/mb | layout | indent recipe |
| `.block-children-left-border` absolute 4px left-−1 h-100% cursor pointer `background-clip:content-box` + hover bg + opacity | layout+appearance+state | indent-guide recipe (hit-strip: 4px bg-clip trick → typed hit-area prop or keep border) |
| `.block-children` border-l gray-04 + `.hidden-block .block-children` border-0 (dead — no `hidden-block` emitter) | layout | indent-line recipe |
| `.block-content-wrapper` `user-select:text` overflow-x visible + `.block-content-or-editor-wrap` flex wrap + `[data-node-type='quote']` quote card (4px left border + bg + color tokens) | layout+appearance | content-wrap recipe + quote variant (blockquote → `ls-blockquote` gpui reg twin) |
| `.block-title-wrap` inline + `.ui__checkbox` offsets + `:has(.embed-page)` flex + `.as-heading` flex | layout | title-wrap recipe + embed variant (:has → emit class) |
| `.block-head-wrap` flex between wrap + `.inline.w-full` override | layout | head-wrap recipe; gpui reg twin |
| `.block-body` first/last-child margin resets + `ol` inside list + `dl li .ui__checkbox` | deco+layout | mostly margin resets (emit in recipe); `list-style-position` deco |
| `.block-content ul/ol` `list-style:disc/decimal` ml-1.2em | appearance | list-marker recipe (list-style → gap) |
| `.ls-block-content-indent` pl-45px | layout | indent recipe; gpui reg twin |
| heading sizes `.ls-block h1–h6` / `.uniline-block.h1–h6` (2rem→0.75rem, lh, h1/h2 border-b, `.block-ref` reset, `::first-line` fw-600 on multiline) | appearance | heading recipe per level (block-ref context override → variant; `::first-line` → deco/gap) |
| `.block-highlight`/`.ls-block.selected` bg `var(--ls-block-highlight-color)` + transition + `.selected *` user-select none | appearance+state | selected recipe; gpui `selected`/`block-highlight` twins (user-select cascade → cmdk list) |
| `.color-level` depth-1→6 nested bg cascade | appearance | depth-color recipe (recursive nesting depth → depth prop/token lookup) |
| `.ls-page-title-actions` (see page chrome) + `.property-block-container` `.lui-link.external-link` inline | layout | cross-links to properties family |

## Editor chrome (editing surface, not text content)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.editor-inner` relative flex + `textarea` reset (`field-sizing:content`, min-height:1lh, overflow hidden, inherit fonts) + `.non-block-editor textarea` bg (dead) | layout | editor-surface recipe (`field-sizing`/`lh` units → gap-lite; autosize) |
| `.block-editor` relative user-select none + `.ed-line` user-select text + `::selection` transparent | layout+state | editor recipe + selection-state suppression |
| `.ed-line` block pre-wrap min-h-1.5em relative z-1 | layout | line recipe; gpui reg twin |
| `.ed-delim` muted, `.ed-hidden` display none, `.ed-pill` inline-block pill bg radius cursor + `.ed-block-ref`/`.ed-page-ref`/`.ed-tag`/`.ed-link`/`.ed-r.ed-url` link-color overrides, `.ed-raw` bg | appearance+state | mark recipes (delimiter/hidden/pill/raw variants); gpui `ed-delim`/`-hidden`/`-pill`/`-raw` twins |
| `.ed-bold`/`.ed-b`/`.ed-strong`, `.ed-italic`/`.ed-i`/`.ed-em`, `.ed-strike`/`.ed-s`/`.ed-del`, `.ed-u`/`.ed-ins`, `.ed-hl`/`.ed-mark` hl bg+color pad radius, `.ed-code` mono 0.9em pad radius, `.ed-sub`/`.ed-sup` vertical-align smaller, `.ed-pad` | appearance | inline-mark recipes (emitted via `"ed-" ^ t` concat in render_inline — dynamic prefix); `vertical-align` → gap-lite |
| `.ed-overlay` absolute inset-0 pointer-events none, `.ed-pos` absolute, `.ed-sel` selection bg radius, `.ed-caret` caret bg + `ed-caret-blink` keyframe | layout+appearance+deco | overlay/selection/caret recipes (caret blink → deco or typed caret prop); gpui `ed-overlay`/`-pos`/`-sel` twins |
| `.ls-code-editor-wrap` relative radius overflow + `.extensions__code-lang` display none + `.code-block-actions` absolute top-right op-0 + hover reveal + button/svg sizing + `.CodeMirror*` font/box-shadow resets + `.cm-s-solarized` | layout+appearance+state | code-block recipe + hover-reveal actions (group-hover → gap); CodeMirror internals adapter-deco; gpui `extensions__code(-lang)` twins |
| `.heading-bg` 18px round swatch + `a:hover >` ring | appearance+state | heading-color swatch (gpui `ls-cm-*` swatches share) |
| `.mock-text` absolute visibility hidden | hook | measurement node (structure-only) |

## Inline elements (pills, refs, embeds — chrome, not text)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.page-reference` radius hover bg + `.bracket` op-.3 inline-flex + `.asset-block-wrap` inline-block | appearance+state | page-ref recipe; gpui `page-ref`/`bracket` twins |
| `.page-ref` accent-11 color hover | appearance | same recipe |
| `.broken` red-11 wavy underline offset-3 pointer hover red-12 | appearance+state | broken-ref recipe (`text-decoration: underline wavy` + offset → gap-lite) |
| `.katex`/`math-block` sizing overrides | deco | KaTeX theming stays per-platform |
| `.preview-ref-link` + sibling margins, `a.tag` pill fs-14 radius op-.7 hover 1 + `[data-ref]` spacing, `.block-title-wrap a.tag` fs-inherit | appearance+state | tag-pill recipe (sibling `+` spacing → emit margins) |
| `.block-ref` 0.5px bottom border cursor:alias display:inherit + nested overrides + hover link color; `.block-ref-no-title` padded block variant (dead); `.open-block-ref-link` chip (dead) | appearance+state | block-ref recipe (`cursor:alias` → gap; inherit-cascade → real inline flow anyway) |
| `.embed-page` pad margin + `> section` mb + `.in-sidebar` tertiary bg | layout+appearance | embed-card recipe + sidebar variant |
| `.block-marker`/`marker-switch` (dead — no emitters) | — | drop |
| `.cp__sidebar-help-btn` fixed bottom-right round chip (misc section — help affordance) | layout+appearance | help-fab recipe (fixed placement) |
| `.block-add-button` cursor text + `.bab-inner` margins | layout | add-button recipe; gpui `block-add-button` twin |
| `.text-ellipsis-wrapper`, `.lazy-visibility`, `.hide-scrollbar`, `.visible-scrollbar`/`custom-scrollbar` | layout+deco | ellipsis recipe (cmdk), lazy-size mins; scrollbar rules deco |
| `.video-embed-shell`/`.video-embed-frame`/`.tweet-embed`/`has-video-embed` | layout+appearance | embed recipes (iframe sizing → adapter) |
| `.dnd-separator.ls-dnd-drop-indicator` fixed h-0 3px border display none pointer-events none | layout+state | drop-indicator recipe (fixed bar — same role as sidebar's) |

## View head + view table + fold + filters (overlay region)

| Selector / registration | Class | Owner after migration |
|---|---|---|
| `.views` row gap-0.25 + `button` resets; `.ls-view-head` flex h-28px justify-between overflow hidden + `.ls-view-head-left` + `.ls-query-count` | layout+appearance | view-head recipe |
| `.view-actions` row + transition + `.ls-view-head.ls-refs .view-actions` opacity 0 + `:hover`/`.ls-lit` reveal + `.views .ls-add-view` same pattern | layout+state | view-actions slot (refs-variant hover reveal → gap) |
| `.ls-view-tab` inline-flex h-1.5rem + `.ls-count` muted 12px + `.ls-dim`/`.ls-lit` opacity | appearance+state | view-tab recipe + lit/dim variants |
| `.view-action-search`/`.view-action-type` + `.property-value-inner`/`.jtrigger`/`.select-item` inner resets | layout | view-action recipes |
| `.ls-view-filter` chip border row + `button` border-r segments + `:last-child` + `.ls-view-filter-value-item` ellipsis | layout+appearance | filter-chip recipe (segment borders → gap-lite or emit separators) |
| `.ls-view-order-setting`/`.ls-drag-row`/`.ls-col-name`/`.ls-sort-right`/`.ls-sort-order` bordered pill + `.ls-sort-x`/`.ls-sort-delete` ghost + `.ls-xs`/`.ls-vf-*`/`filters-row`/`.ls-vf-chips`/`.ls-vf-logic`/`ls-op-*`/`ls-search-input` | layout+appearance+state | sorting/filter-editor recipes |
| `.ls-filters` card widths + `ls-filters-header/-icon/-title` + `cp__filters(-input-panel)(-input)` + `:focus-within` bg + `ls-filters-label`/`-refs` + `.ls-ref-btn` | layout+appearance+state | filter-dialog recipes (focus-within → gap-lite) |
| `.page-inner > .page-tabs`/`.ui__tabs-content`/`.ls-view-body` min-w-0 + `.ls-view-body` mt-4 + `.page-inner > .ls-page-blocks` mt-16 | layout | page-section recipe |
| `.ls-table-header` flex `width:fit-content` min-w-100% `will-change/transform` + border-y bg | layout+appearance | table-header recipe |
| `.sticky-columns` `position:sticky` left-0 z-8 bg | layout | sticky-column recipe (sticky → gap) |
| `.ls-table-header-cell` pointer text-left fw-500 muted border-r + `> .ui__button` h-2rem!important | layout+appearance | header-cell recipe |
| `.ls-table-resize-handle` absolute 4px right col-resize accent bg op-0 → hover .7/active 1 + transition | layout+state | resize-handle recipe (cursor + hover reveal) |
| `.ls-table-row.ls-block` flex 33px pinned box-border border-b + nowrap cascade + `.ls-table-rows [data-index]`/`[data-item-index]` 33px + `.ls-table-cell` h-32 overflow + `> div` | layout | table-row/cell recipes (rigid row height) |
| `.ls-table-footer` absolute bottom-8 + `[data-viewport-type='window']` min-w-100% w-auto!important | layout | virtual-scroll window recipe (viewport hook!) |
| `data-table-row-select` `.lui-checkbox` opacity 0 → `:hover`/`:has(input:checked)` reveal + `.ls-table-header-cell` same | state | checkbox reveal (hover + checked parent → gap) |
| `.ls-title-ghosts` opacity 0 + `.table-block-title:hover`/self-hover reveal | state | hover-reveal slot |
| `.ls-table-row.ls-block.selected` bg muted | state | selected variant |
| `.ls-foldable-title-control` ml-−27px gutter hang; `.ls-foldable-content` `grid-template-rows: 1fr→0fr` + `.is-collapsed` + `inner` opacity/pointer-events + `.ls-foldable-title:hover .control-hide` | layout+state | foldable recipe (grid-rows collapse animation → typed collapsed prop + motion deco; the −27px hang = layout) |
| `.ui__button.ls-btn-*`/`as-ghost`/`as-destructive`/`as-link` size+variant rules | appearance | shared button recipe (settings family lists the same variants — dedupe into one button recipe) |

## Hooks that MUST survive migration

- `.ls-block` + `.selected` (+ `.block-highlight`), `data-has-heading`,
  `data-has-children`, `data-heading` on `.block-control-wrap`/
  `.block-main-container`, `[data-node-type='quote']`
- `.block-control-wrap` / `.block-control` / `.control-hide` /
  `.bullet-container` / `.bullet` / `.bullet-link-wrap` /
  `.bullet-closed` / `.typed-list` / `.as-order-list` / `.is-order-list` /
  `.is-with-icon` / `.bullet-hidden` — the whole bullet/control
  structure is queried by block_dnd and tree code
- `.block-children-container`, `.block-children`,
  `.block-children-left-border` (clickable indent guide)
- `.editor-inner`, `.block-editor`, `.ed-line`, `ed-*` mark classes
  (`"ed-" ^ t` concat — dynamic prefix, keep), `.ed-overlay`,
  `.ed-pos`, `.ed-sel`, `.ed-caret`, `.mock-text`
- `.page-ref`, `.bracket`, `.page-reference`, `a.tag` (+`data-ref`),
  `.block-ref`, `.embed-page`(+`.in-sidebar`), `.preview-ref-link`,
  `.open-block-ref-link` (dead), `.broken`
- `.ls-page-title*`, `.page-icon`, `.ls-page-icon`, `.ls-page-icon-btn`,
  `.edit-input`, `.ls-page-title-actions` (+`data-popup-active`)
- `.breadcrumb`/`.block-parents`/`.breadcrumb-item`/
  `.breadcrumb__segment`/`.breadcrumb__label`,
  `--breadcrumb-segment-max-width`
- `.page-tabs`, `.ui__tabs-content`, `.ls-view-body`,
  `.ls-view-head(.ls-refs)`, `.view-actions`, `.views`, `.ls-view-tab`,
  `.ls-add-view`, `.ls-foldable-*`(+`.is-collapsed`),
  `.control-hide` on fold carets
- `.ls-table-*` family incl. `.sticky-columns`,
  `data-table-row-select`, `data-index`/`data-item-index` rows,
  `data-viewport-type='window'`, `.table-block-title`,
  `.ls-title-ghosts`, `.ls-table-resize-handle`
- `.dnd-separator.ls-dnd-drop-indicator`, `.block-drag-*` (gpui regs)
- `.selection-action-bar`/`.selection-action-button` (floating toolbar)
- `.jtrigger`, `.property-value-inner`, `.editor-wrapper` inside value
  cells (shared with settings family)

Dual-track hooks: web mixes element+attr (`td[role=gridcell]`,
`[data-viewport-type]`, `[data-has-heading]`, `:has(input:checked)`)
with classes; gpui registers flat class twins (`selected`,
`block-highlight`, `ed-*`, `control-hide`, `block-head-wrap`,
`ls-block-content-indent`, `extensions__code*`). Recipes must read both
tracks; several attrs (`data-node-type`, `data-has-children`,
`data-viewport-type`) are semantic props on web.

## LUI capability gaps (beyond the cmdk list)

cmdk already needs: position+inset, typography props, state variants,
ellipsis, min/max sizing, user-select, inset shadow. Pages & editor
chrome additionally needs:

1. `position:sticky` inside a scroll grid — `.sticky-columns` (table
   left column), plus fold/view-head stickiness on web (semantic sticky,
   same gap as sidebar but for horizontal stick)
2. `grid-template-rows: 1fr↔0fr` collapse animation
   (`.ls-foldable-content`) — the fold contract is a grid-rows
   transition; needs either the animation or a `collapsed` prop +
   adapter-side motion
3. `grid-template-columns`/`fit-content`/`minmax`/`width:fit-content`
   on `.ls-table-header` (table sizing model) — same grid gap as
   settings
4. Hover-reveal cascades — `.block-main-container:hover .control-hide`,
   `.table-block-title:hover .ls-title-ghosts`,
   `[data-table-row-select]:hover .lui-checkbox`,
   `.ls-code-editor-wrap:hover .code-block-actions`,
   `.ls-view-head:hover .view-actions/.ls-add-view`,
   `.ls-page-title-container:hover .ls-page-title-actions` — one
   group-hover mechanism (same gap as sidebar, but it dominates this
   family)
5. `:has()` state selectors — `:has(input:checked)` (persistent
   checkbox), `:has(textarea.h1/.h2)` (heading control offset),
   `:has(.embed-page)`, `:has(button[data-popup-active])` — replace
   with typed props/data attrs
6. Nested depth styling — `.color-level` 6-deep bg cascade (tag page
   nested blocks): depth → token lookup
7. `text-decoration: underline wavy` + `text-underline-offset`
   (`.broken` refs), `text-decoration-color` — beyond plain
   underline/strikethrough
8. `vertical-align: sub/super` (`.ed-sub`/`.ed-sup`) — baseline shift
   prop
9. `cursor: alias/text/default` variants (block-ref alias cursor,
   content cursor:text)
10. `::selection` suppression (`.block-editor ::selection
    transparent`), `::first-line` weight (multiline headings) —
    selection/first-line channels
11. `field-sizing: content` + `lh` units + autosize textarea behavior
    — adapter-specific; keep textarea autosize in adapter
12. `list-style` disc/decimal/inside markers in `.block-content` lists
13. `transform: scale` on bullet hover, `translateX(0)`/will-change
    baseline on `.ls-block`, `transform:scale(0.75)` icon-mini —
    deco/hover-scale variant
14. `aspect-ratio`, `border-radius: calc(infinity * 1px)` /
    `9999px` pill radii — radius token covers; `calc(infinity)` literal
    → token
15. `background-clip: content-box` hit-strip (`.block-children-left-
    border` 4px guide) — either keep as border or a hit-area prop
16. `box-shadow` rings on focus/hover (`.heading-bg` hover ring,
    `.selection-action-bar` shadows) — outer shadow beyond cmdk's inset
17. `pointer-events:none` typed prop (`.ed-overlay`,
    `.selection-action-bar` container, `.dnd-separator`,
    `.mock-text` visibility)
18. `overflow-anchor:none`, `will-change`, `contain`,
    `container-name`/`container-type` on `.ls-block` — perf deco
19. `z-index` on `.ed-line`/`.ed-caret`/`.sticky-columns`/
    `.dnd-separator` — ordering in layered block chrome
20. `[data-viewport-type='window']` virtual-window sizing + rigid
    `33px` row contract — virtualization-aware row recipe (typed
    row-height prop)
21. `img.left/right` float in `.block-content` — float deco
22. `:empty`/`:first-child`/`:last-child`/`:nth-child` structural
    selectors — emit variant classes instead (journal first-item
    min-h-500, `.ls-bidirectional-properties:empty`)
23. `mask-image: var(--lui-icon-image)` icon painting —
    icon-color/mask prop (shared with settings)
24. `ch` unit (`--breadcrumb-segment-max-width: 28ch`) — non-px
    lengths

## Dead selectors

- `.breadcrumb__segment-icon`, `.breadcrumb__overflow` — `page.ml`
  emits segment/label only
- `.hidden-block` (`.hidden-block .block-children` rule) — no emitter
- `.non-block-editor` — no emitter
- `.ed-strong`, `.ed-ins`, `.ed-mark`, `.ed-sup` — emitted only via the
  `"ed-" ^ t` mark-name concat in `render_inline.ml:1735`; alive iff a
  `strong`/`ins`/`mark`/`sup` mark type reaches that emitter — flag as
  *conditional* rather than dead (mark types are runtime data)
- `.block-ref-no-title`, `.open-block-ref-link` — no emitters
- `.block-marker`, `.marker-switch` — only in docs/db-worker exporter,
  never in LUI views
- `.editor-inner textarea` `.non-block-editor` variant (see above)

## Decoration that stays per-platform

`transition`/`will-change`/transforms, `ed-caret-blink` keyframes,
KaTeX sizing overrides, scrollbar rules, `overflow-anchor`, iframe/video
embeds internals, `::selection` color, `outline:none` input resets,
`float` images, `::first-line`, motion reduce guards.

## Task 5 deletion pass (devin/003-t5-editor)

Recipes added in `deps/ui/src/shared/ui_components.ml`:
`action_bar_capsule` (popover-bg/6px-radius/shadow card spec for the two
floating action bars — the kit `action_toolbar` composite's own
`surface` bg is transparent on web) and `flat_toolbar` (`toolbar` kind,
role=toolbar, card chrome flattened via the data-attrs style pair —
the kind admits no background/border/pad/opacity props; the reveal
opacity rides a wrapping box). Kind/composite adoptions:
`Lui_element_combine.action_toolbar` (selection action bar, table
batch-action bar), `toolbar` (view-head `.view-actions`),
`Lui_element_combine.breadcrumb_trail` (page zoom/namespace/block-page
breadcrumbs), `Signal.state` + `~opacity`/`float_prop_signal` for the
view-head hover reveal (G7 pattern — restores cljs's hover-lit that the
earlier class port had dropped to popup-open-only; `.ls-add-view` and
`.view-actions` share the derivation).

CSS deleted in `resources/css/lui-overlay.css` (~190 lines):
`.selection-action-bar` (pointer-events/bg/radius/shadow →
`action_bar_capsule` props; the `.lui-popup-positioner`/`lui-popover`
pointer-events split already covers the hit-transparent bar) and all
`.selection-action-button*` rules (joined-buttons border/margin/radius
set — kit toolbar items); `.view-actions` layout/gap rule and the
`.ls-view-head.ls-refs .view-actions` / `.views .ls-add-view` opacity
rules incl. `.ls-lit` (signal-driven now — `.view-actions`/`.ls-add-view`
keep only `transition: opacity 300ms ease-in` as decoration);
`.view-action-search` + `.view-action-search input` (box/row wrappers
were not toolbar-legal — flat `search_items` now);
`.ls-search-input` (borderless transparent input → props);
`.view-action-type` + `.view-action-type.ls-dim` +
`.view-action-type .property-value-inner*` (jtrigger/select-item box
stack → one ghost button, muted color → `~foreground`);
`.ls-add-view` padding/margin/color/hover rules (→ props +
`~foreground`; `-ml-1` via data-attrs style pair).

CSS deleted in `resources/css/lui-core.css` (~30 lines):
`.breadcrumb__segment` (28ch max-width), `.breadcrumb__label`
(ellipsis), `.breadcrumb__segment-icon`, `.breadcrumb__overflow` —
`page.ml` was the sole live emitter of segment/label (icon/overflow
were already dead); `.breadcrumb`/`.block-parents` wrapper classes are
kept on the wrapper `box` so the nowrap/overflow-clip container
behavior survives. `.breadcrumb a`, `.breadcrumb.block-parents*`,
`.breadcrumb-item*` stay — sidebar/cards/chrome still emit them.

Kept as hooks/deco: `.selection-action-bar` (mousedown `closest`
listener), `.table-action-bar`, `.view-actions`, `.ls-view-head`,
`.ls-refs`, `.ls-add-view`, `.ls-icon-btn` (still emitted by cards/
plugins too), `.ls-view-tab` + `.ls-dim` (non-current tab dimming).
The `!h-7 !px-1` utility overrides on view-head buttons became
`~height:28 ~min_height:28 ~padding_horizontal:4` props.
