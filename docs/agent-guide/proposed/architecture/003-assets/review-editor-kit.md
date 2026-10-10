# Task 5 pages & editor chrome — LUI kit adoption review

Kit-adoption review for `2026-10-10-003-shared-ui-visual-design.md`,
family "Pages and editor chrome". Scope is page chrome and block
decorations — bullet, fold caret, indent guides, selected highlight,
drop indicator, ref/tag pills, embed containers, page header,
view heads and view tables. Text/editor internals are out of scope.

Question per view: **does a high-level LUI kit component genuinely
fit, or is this Logseq-specific chrome that must stay custom?**
Companion doc `inventory-editor.md` catalogues the 413 CSS/DOM rules
and the hooks that must survive migration.

Kit layers audited (pin `a8cc58c`):

- `lui_elements.mli` — ~80 primitive kinds: `breadcrumb`, `tabs`,
  `accordion`, `tree`, `table`/`table_row`/`table_cell`, `button`
  (variants/sizes/icon), `menu_item`, `list_item`, `checkbox`,
  `select`, `popover`, `avatar`, `icon`, `progress`, `spinner`,
  `virtual_list`, `link`, `heading`, `toolbar`, `toolbar_item`.
- `lui_element_combine.mli` — high-level composites: `action_toolbar`
  (floating capsule of ghost icon buttons), `breadcrumb_trail`,
  `composer`, `confirm_dialog`, `form_sheet`, `settings_row`,
  `empty_state`, `loading`, `suggestion_list`, `menu_button`,
  `check_menu_item`, `nav_item`, `sidebar`.
- `schema/components.json` — 84 publicElements / 88 nodeKinds /
  149 properties; `badge` and `skeleton` are listed but have **no
  element kind** (CSS-only `.lui-badge`/`.lui-skeleton`).

## Verdict at a glance

| Verdict | Count | What |
| --- | --- | --- |
| **Adopt now** | 4 | selection action bar, table action bar, view-actions row → `action_toolbar`; breadcrumbs → `breadcrumb_trail` |
| **Already kit** | 3 | ghost icon buttons (page icon, `.ls-add-view`), `select` controls, `checkbox` column |
| **Adopt once gap closes** | 5 | foldables → `accordion`, view tabs + page-tabs shell → `tabs`, tag chip + view counts → `chip`/`badge`, filter chips → segmented control, page menu → `menu_item`/`confirm_dialog` (role contract) |
| **Stay custom** | 14 | outliner chrome core, data-grid, inline ref pills — detailed below |

This is the largest stay-custom family, as expected: the `.ls-block`
row (caret + bullet + indent guides + data-attr contract) is the
outliner's signature and has no kit analog.

## Per-view table

| View / emitter (file) | Current shape | Kit candidate | Verdict | Notes |
| --- | --- | --- | --- | --- |
| Zoom/page breadcrumbs (`pages/page.ml` `zoom_breadcrumbs`, `breadcrumbs`, `block_page_breadcrumb`) | Hand-built `.breadcrumb` rows: `link.breadcrumb-item` + `text " / "` separators | `breadcrumb_trail` (pairs → ghost caption buttons) or `breadcrumb` kind | **Adopt** | Needs item-class hook + 28ch ellipsis (`.breadcrumb__segment`, `--breadcrumb-segment-max-width`) preserved; see gap G4 |
| Page title row (`page.ml` `page_title_el`) | Full `.ls-block` replica: fold caret, `.ls-page-icon`, `title_content`↔`title_editor` swap, hover `ls-page-title-actions` | none | **Stay custom** | It *is* a block row (shares fold/data-attr contract); title_actions row is already ghost buttons + `button ~size:icon` |
| Page icon button / title actions (`page.ml`, `properties_area.ml` `title_actions`) | `button ~variant:\`ghost ~size:\`icon`, opacity signal reveal | `button` kind | **Already kit** | Only the hover-reveal channel is hand-rolled (gap G7) |
| Page dropdown + confirm (`pages/page_menu.ml`) | `Logseq_el` markup: e2e requires `div[role='menuitem']`, `div[role='alertdialog']` | `menu_item`, `confirm_dialog` | **Blocked → adopt later** | Kit kinds don't emit the required roles today; see gap G9 |
| Foldable sections (`page.ml` `foldable_title`/`foldable_content`, `views_table.ml` `foldable`) | `.ls-foldable-title` caret + `.ls-foldable-content` grid-rows collapse | `accordion` (~text ~selected ~on_toggle) | **Blocked → adopt later** | No collapse/expand animation in kit; caret must stay `block-control`/rotating-arrow for style parity; gap G3 |
| Journal list (`page.ml` `journal_item_sig`, `journals_view_ms`) | `Virt_list`/`keyed` list of full block trees, `journal-item`/`-last-item` spacing classes | none | **Stay custom** | Rows are block trees; classes are spacing only |
| References sections (`page.ml` `references_view`, `unlinked_references_view`) | Mounts `Views_view.view`; collapsed head = `.views` ghost buttons | per view-head row below | **Partial adopt** | Body is the view component; head shares the view-tab verdict |
| Page tabs shell (`page.ml` `page_tabs_el`) | `.page-tabs` container + `.ui__tabs-content` body swap | `tabs` kind (~label ~orientation) | **Blocked → adopt later** | Verify `tabs` carries Logseq's tab-strip semantics on native; low value — shell only |
| `.ls-block` row shell (`blocks/tree.ml` `block_row`, `row_class_str`, `row_attrs_sig`) | State-class string (`selected`, `block-dragging`, `block-drag-over-*`, `is-order-list`, `embed-block`…) + `data-blockid/containerid/haschild/collapsed/level` attrs | `list_item` (~selected ~tree_level ~expanded ~swipe_actions) | **Stay custom** | The data-attr + state-class contract is consumed by dnd registration, selection, plugins, e2e and web CSS; `list_item` props don't cover it and the row's interior is all custom anyway |
| Fold caret + bullet (`tree.ml` `control_wrap`) | `.block-control-wrap` > `link.block-control` (rotating-arrow, `control-show`/`-hide`) + `.bullet-container` > `.bullet` (6px dot, inline style, dnd drag-handle via `[data-blockid]`) | none (`tree` kind's disclosure is a header toggle, not per-row chrome) | **Stay custom** | Bullet is drag handle + `color-level` themed; caret reveal is `[data-has-children]` CSS on web / always-on native |
| Tag chip (`tree.ml` `tag_chip`) | `.block-tag` hover-reveal box: `a.hash-symbol` + `a.tag` with `data-tag-uuid/id/priv`, `data-ref`, `draggable` | `badge`/chip kind | **Blocked → adopt later** | No badge/chip kind exists (G1); needs hover-x + `data-tag-*` + draggable contract regardless |
| Indent guides (`tree.ml` `children_dom`) | `.block-children-container` (29px) + `.block-children-left-border` (4px strip) + `.block-children` (1px guideline) | none | **Stay custom** | Outliner signature; inline `style` geometry already backend-portable |
| Embed container (`tree.ml` `page_embed`, `.embed-page`, `.embed-more`) | Live fetched block tree, 50-block cap, more-row | none | **Stay custom** | Nested block tree, not a styled shell |
| Add-child button (`blocks/add_button.ml`) | `.block-add-button` opacity-reveal + `.bab-inner` dot, `data-parentblockid`, `cursor:text` | none | **Stay custom** | Logseq-specific affordance |
| Selection action bar (`blocks/selection_bar.ml`) | Anchored `popover` + `.selection-action-bar` row of ghost text/icon buttons | **`action_toolbar`** | **Adopt** | Exact match (floating capsule of ghost icon buttons); keep popover anchoring + armed-mouseup logic |
| Drop indicator (`dnd/block_dnd.ml`, `dnd_kit.ml`) | Imperative `div.dnd-separator.ls-dnd-drop-indicator` on `<body>`, rect-positioned | none | **Stay custom** | Imperative overlay by nature; kit drag primitives N/A |
| View tab strip (`views_head.ml` `.views`, `.ls-view-tab`) | Keyed ghost buttons w/ icon + count + `ls-dim`/`ls-lit` + per-tab context menu | `tabs` kind | **Blocked → adopt later** | Per-tab `on_context_menu` + count slot + overflow scrolling unverified on kit `tabs`; interim fine as ghost buttons |
| View-actions row (`views_head.ml` `.view-actions`) | Ghost icon buttons: cog/sort/filter/search/display-type/more/add-object | **`action_toolbar`** (inline) or plain ghost `button`s | **Adopt** | Mostly already `button ~variant:\`ghost`; consolidating on `action_toolbar` aligns with selection/table bars |
| Add-view button (`views_head.ml` `.ls-add-view`) | Ghost button | `button` | **Already kit** | — |
| Filter chips (`views_head.ml` `.ls-vf-chip`, ref-filter `.ls-ref-btn`) | Segmented prop/op/val/x button group | segmented control / chip group | **Blocked → adopt later** | No kind exists (G2); composing 4 buttons loses the segmented shape on native |
| Filter logic select (`views_head.ml` `.ls-vf-logic`) | `select` kind | `select` | **Already kit** | — |
| View table grid (`views_table.ml` `.ls-table` family) | 33px rigid rows, header cells + resize handles, sticky columns, select-checkbox column, `.ls-title-ghosts` cell ghosts, `data-table-row-select` reveal, grouped foldables | `table`/`table_row`/`table_cell` (~text ~size ~on_press ~selected) | **Stay custom** | Kit table is a simple list-table — no virtual rows, resize, sticky cols, group headers, per-cell hover actions; adopting would shed exactly the features the grid needs (G6) |
| Table select checkboxes | `checkbox` kind | `checkbox` | **Already kit** | Reveal-on-hover is the pattern gap (G7), not the control |
| Table batch action bar (`views_table.ml` `action_bar`) | `.table-action-bar` ghost buttons | **`action_toolbar`** | **Adopt** | Same as selection bar |
| Inline ref/tag pills (`render_inline.ml` `page_link`, `preview_link`, `bracket`, `block_ref`) | `a.page-ref`/`a.tag`, `.page-reference` + `.bracket` `[[ ]]`, `.broken` unresolved variant, `data-ref`/`data-uuid`/`draggable` | `link` kind | **Stay custom** | Inline text anchors with ref/drag semantics + unresolved state; `link` doesn't carry them |
| Code-block chrome (`render.ml` `.ls-code-editor-wrap`, `.code-block-actions`) | CodeMirror shell + hover-reveal action row | ghost `button`s (row), none (shell) | **Partial adopt** | Action row can reuse ghost buttons; shell stays custom |

## Adoption order

1. **P0 — mechanical, no gaps:** swap the three action bars
   (`selection_bar.ml`, `views_table.ml` `action_bar`,
   `views_head.ml` `.view-actions`) onto `action_toolbar`; swap the
   three breadcrumb emitters onto `breadcrumb_trail`. Pure markup
   simplification; CSS for these bars/crumbs then deletes with the
   component.
2. **P1 — polish pass:** route remaining ad-hoc ghost icon buttons
   (`.ls-icon-btn` cog, `.code-block-actions`, `.ls-title-ghosts`)
   through the same button recipe so chrome styling has one owner.
3. **P2 — after kit gaps close:** foldables → `accordion` (needs
   collapse animation, G3); view tabs + page-tabs → `tabs` (needs
   per-tab menu/count/overflow, G5); tag chip + view-count chips →
   `badge`/chip kind (G1); filter chips → segmented control (G2);
   page menu → `menu_item`/`confirm_dialog` once roles emit (G9).
4. **Never (outliner core):** `.ls-block` shell, caret+bullet,
   indent guides, embed container, add-button, drop indicator,
   view table grid, inline ref pills.

## Stay-custom rationale (the outliner core)

Fourteen surfaces stay custom. Common reasons, in order of weight:

- **Data-attribute/state-class contract.** `.ls-block` rows carry
  `data-blockid`, `data-containerid`, `data-haschild`,
  `data-collapsed`, `data-level`, `data-title` plus state classes
  (`selected`, `block-dragging`, `block-drag-over-*`, `embed-block`,
  `is-order-list`, `is-blank`). These are consumed by the dnd-kit
  MutationObserver registration (`.bullet-container[data-blockid]`
  draggables, `.ls-block` droppables), selection, plugins, e2e and
  the residual web stylesheet. No kit kind accepts this contract as
  props, and `list_item`'s `selected`/`tree_level`/`expanded` props
  cover a fraction of it.
- **Logseq-specific geometry.** The bullet (6px dot, `color-level`
  depth theming, doubles as drag handle), the caret reveal
  (`[data-has-children]` on web vs always-visible native), 29px
  children indent, 4px left-border strip, and the add-child button
  are the outliner's visual identity — they exist *because* Logseq
  is an outliner. Kit primitives would just be re-skinned to look
  like them.
- **Imperative positioning.** The drop indicator is a body-level
  div positioned from target rects; embed containers mount live
  block trees. Neither is a declarative component problem.
- **Grid features beyond kit table.** `.ls-table` needs virtual
  33px rows, column resize, sticky columns, group foldables and
  per-cell ghost actions — the `table` kind is a plain list-table.

## Kit gaps to file

| # | Gap | Blocks |
| --- | --- | --- |
| G1 | No `badge`/`chip`/`pill` kind (schema lists `badge`, but no nodeKind/`val`; `.lui-badge` is CSS-only) | tag chip, view-count chips, `.ls-count` |
| G2 | No segmented-control / chip-group kind | `.ls-vf-chip` prop/op/val/x, `.ls-ref-btn` |
| G3 | No collapse/expand animation channel (grid-rows `fr` transition) | `.ls-foldable-*` → `accordion` |
| G4 | `breadcrumb`/`breadcrumb_trail` can't set per-item class or max-width ellipsis (`.breadcrumb__segment`, 28ch) | breadcrumb adoption polish |
| G5 | `tabs` kind lacks per-tab context menu, count slot, overflow scrolling | `.ls-view-tab` strip, `.page-tabs` shell |
| G6 | `table` kind lacks virtualization, column resize, sticky columns, group headers, per-cell hover actions | `.ls-table` (probably permanent) |
| G7 | **No hover-reveal primitive** — see next section | every group-hover site |
| G8 | `tree`/`list_item` kinds have no decoration slots (leading icon/bullet, trailing hover actions) or data-attr contract | `.ls-block` (probably permanent) |
| G9 | `menu_item`/`confirm_dialog` don't emit `role=menuitem`/`role=alertdialog` markup e2e requires | `page_menu.ml` |

## Group-hover reveal patterns (flagged)

Six sites reveal chrome on row hover; today they split channels:

- Web CSS `:hover`/`[data-has-children]`: caret + tag-x
  (`control-hide`/`control-show`), `.ls-title-ghosts`,
  `[data-table-row-select]` checkbox, `.code-block-actions`,
  `.block-add-button` opacity.
- Signal-driven (already backend-portable): `.ls-page-title-actions`
  (`caret_hover`/`actions_hover` `Signal.state` + `~opacity`
  reactive in `properties_area.ml`), foldable caret via
  `class_signal`.

The pattern is ubiquitous enough that each call site hand-rolls it.
Recommendation: grow **one kit mechanism** — e.g. a
`~revealed_on_hover:` container prop or a `hover_reveal` wrapper
kind that on web emits the `group`/`peer` class and on native wires
pointer enter/leave to an opacity/visibility reactive — rather than
adopting kit buttons piecemeal and keeping six bespoke reveal
channels. Until then, the `Signal.state` + `~opacity` approach in
`properties_area.ml` is the reference implementation to copy.

## Counts

- View surfaces reviewed: **26**
- Adopt now: **4** (selection bar, table action bar, view-actions,
  breadcrumbs)
- Already on kit: **3** (ghost/icon buttons, `select`, `checkbox`)
- Adopt blocked on kit gaps: **5** (foldables, view tabs/page-tabs,
  tag chip + badges, filter chips, page menu)
- Stay custom: **14**
- Kit gaps filed: **9** (G1–G9), of which G7 (hover reveal) is
  cross-cutting and G6/G8 are probably permanent exclusions
- Group-hover sites flagged: **6**
