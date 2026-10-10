# Audit — emitted class tokens with no CSS rule and no GPUI registration

Generated for `2026-10-10-003-shared-ui-visual-design.md` Task 6 item 3.

## Method

- Emitters: literal string tokens extracted from `~style_class` /
  `~style_class_signal` / `("class", ...)` attrs / `class_signal`
  expressions across `deps/ui/{src,native,subs,web}/**.ml`
  (comments stripped; balanced-paren capture). 850 literal tokens.
- Styled set: class selectors collected from `resources/css/**/*.css`,
  the vendored/opam `lui.css` + `lui-split.css`, and a locally built
  `static/css/style.css` (tailwind `css:build`, `@source deps/ui/src/**/*.ml`),
  plus the `register_class_style` names in `gpui/host/src/logseq_ext.rs`.
- Result: 185 tokens matched nothing — 23 were tailwind-variant escapes
  my first pass missed (e.g. `hover:opacity-80`, `!px-1`); 162 remain below.
  (Task text estimated ~119; the wider class_signal/attrs capture here
  adds semantic hooks emitted through helpers.)

## Categories

| token | classification | evidence |
|---|---|---|
| `block-left` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml; test/test_main.ml |
| `block-right` | e2e/test hook — keep | test/test_main.ml; test/shared/shared_scenarios_props.ml |
| `block-tags` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml; ../../ocaml-e2e/test/test_commands_basic.ml |
| `btn` | e2e/test hook — keep | ../../ocaml-e2e/lib/graph.ml; ../../ocaml-e2e/test/test_plugins_marketplace.ml |
| `closed` | e2e/test hook — keep | ../../ocaml-e2e/lib/fixtures.ml; ../../ocaml-e2e/test/test_rtc_extra_part2.ml |
| `cloze` | e2e/test hook — keep | ../../ocaml-e2e/test/test_commands_basic.ml; test/edit_model_test.ml |
| `cloze-revealed` | e2e/test hook — keep | ../../ocaml-e2e/test/test_commands_basic.ml |
| `cmdk-item-icon` | e2e/test hook — keep | test/shared/shared_scenarios_cmdk.ml |
| `code` | e2e/test hook — keep | ../../cli-e2e/src/logseq/cli/e2e/runner.clj; ../../cli-e2e/test/logseq/cli/e2e/runner_test.clj |
| `code-editor` | e2e/test hook — keep | test/test_drive.ml; gpui/drive_test.ml |
| `controls` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml |
| `cp__cmdk-group-header` | e2e/test hook — keep | test/shared/shared_scenarios_cmdk.ml |
| `cp__cmdk-group-title` | e2e/test hook — keep | test/shared/shared_scenarios_cmdk.ml |
| `cp__cmdk-item-info` | e2e/test hook — keep | test/shared/shared_scenarios_cmdk.ml |
| `cp__cmdk-item-main-text` | e2e/test hook — keep | test/shared/shared_scenarios_cmdk.ml |
| `cp__cmdk-scroller` | e2e/test hook — keep | test/shared/shared_scenarios_cmdk.ml |
| `cp__cmdk__modal` | e2e/test hook — keep | test/test_drive.ml; test/shared/shared_scenarios.ml |
| `cp__query-builder` | e2e/test hook — keep | ../../ocaml-e2e/test/test_query_builder_basic.ml; ../../ocaml-e2e/test/test_query_results_basic.ml |
| `cp__right-sidebar-scrollable` | e2e/test hook — keep | ../../ocaml-e2e/test/test_right_sidebar.ml |
| `custom-query-results` | e2e/test hook — keep | ../../ocaml-e2e/test/test_commands_basic.ml; ../../ocaml-e2e/test/test_query_results_basic.ml |
| `embed-block` | e2e/test hook — keep | ../../ocaml-e2e/test/test_block_property_basic.ml |
| `extensions__code-calc-output-line` | e2e/test hook — keep | ../../ocaml-e2e/test/test_commands_basic.ml |
| `filters` | e2e/test hook — keep | ../../ocaml-e2e/test/test_plugins_basic.ml; test/test_main.ml |
| `flag` | e2e/test hook — keep | test/test_drive.ml; test/test_main.ml |
| `flip` | e2e/test hook — keep | test/edit_view_test.ml; test/test_main.ml |
| `graph-action-btn` | e2e/test hook — keep | ../../ocaml-e2e/lib/graph.ml; ../../ocaml-e2e/test/test_graph_navigation_basic.ml |
| `image` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml; ../../ocaml-e2e/test/test_assets_basic.ml |
| `initial` | e2e/test hook — keep | ../../ocaml-e2e/test/test_undo_redo.ml; ../../ocaml-e2e/test/test_commands_basic.ml |
| `journal-item-placeholder` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml |
| `latex-inline` | e2e/test hook — keep | test/test_drive.ml; gpui/drive_test.ml |
| `ls-all-pages` | e2e/test hook — keep | ../../ocaml-e2e/test/test_view_basic.ml |
| `ls-block-reactions` | e2e/test hook — keep | ../../ocaml-e2e/test/test_block_property_basic.ml |
| `ls-card-item` | e2e/test hook — keep | ../../ocaml-e2e/test/test_view_basic.ml |
| `ls-comment-actions` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml |
| `ls-comment-add` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml; ../../ocaml-e2e/test/test_block_property_basic.ml |
| `ls-comment-reply-placeholder` | e2e/test hook — keep | ../../ocaml-e2e/test/test_block_property_basic.ml |
| `ls-comment-row` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml; ../../ocaml-e2e/test/test_block_property_basic.ml |
| `ls-comment-submit` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml; ../../ocaml-e2e/test/test_block_property_basic.ml |
| `ls-comments-area` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml; ../../ocaml-e2e/test/test_block_property_basic.ml |
| `ls-comments-label` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml |
| `ls-comments-list` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml |
| `ls-comments-title-editor` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml |
| `ls-editor-link-form` | e2e/test hook — keep | test/test_drive.ml; gpui/drive_test.ml |
| `ls-icon-search` | e2e/test hook — keep | ../../ocaml-e2e/test/test_block_property_basic.ml |
| `ls-left-sidebar-open` | e2e/test hook — keep | test/shared/shared_scenarios_sidebar.ml; test/shared/shared_scenarios.ml |
| `ls-recycle-page-content` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml |
| `ls-resize-image` | e2e/test hook — keep | ../../ocaml-e2e/test/test_assets_basic.ml |
| `ls-table` | e2e/test hook — keep | test/test_drive.ml; test/shared/shared_scenarios_views.ml |
| `macro` | e2e/test hook — keep | test/test_drive.ml; test/edit_model_test.ml |
| `multi-values` | e2e/test hook — keep | ../../ocaml-e2e/test/test_editor_basic.ml |
| `normalize` | e2e/test hook — keep | ../../ocaml-e2e/test/test_import_basic.ml; ../../ocaml-e2e/test/test_assets_basic.ml |
| `page-blocks-inner` | e2e/test hook — keep | ../../ocaml-e2e/lib/util.ml; ../../ocaml-e2e/lib/block.ml |
| `query-clause` | e2e/test hook — keep | ../../ocaml-e2e/test/test_query_builder_basic.ml; ../../ocaml-e2e/test/test_query_results_basic.ml |
| `query-result` | e2e/test hook — keep | test/test_main.ml; test/shared/shared_scenarios_views.ml |
| `references` | e2e/test hook — keep | ../../ocaml-e2e/lib/util.ml; ../../ocaml-e2e/test/test_editor_basic.ml |
| `remove` | e2e/test hook — keep | ../../cli-e2e/src/logseq/cli/e2e/coverage.clj; ../../cli-e2e/src/logseq/cli/e2e/cleanup.clj |
| `search-results` | e2e/test hook — keep | ../../ocaml-e2e/lib/util.ml; ../../ocaml-e2e/lib/ls_page.ml |
| `selection-action-bar` | e2e/test hook — keep | ../../ocaml-e2e/lib/e2e_assert.ml |
| `separate` | e2e/test hook — keep | ../../ocaml-e2e/lib/rtc.ml; test/contracts/ui_services_scenarios.ml |
| `sidebar-item-more` | e2e/test hook — keep | ../../ocaml-e2e/test/test_right_sidebar.ml |
| `tabler-icon` | e2e/test hook — keep | test/test_drive.ml; test/test_main.ml |
| `toolbar-dots-btn` | e2e/test hook — keep | ../../ocaml-e2e/lib/util.ml; ../../ocaml-e2e/lib/ls_page.ml |
| `toolbar-plugins-manager-trigger` | e2e/test hook — keep | ../../ocaml-e2e/test/test_plugins_marketplace.ml |
| `unlinked-references` | e2e/test hook — keep | ../../ocaml-e2e/test/test_block_property_basic.ml |
| `wide-mode` | e2e/test hook — keep | test/contracts/ui_services_scenarios.ml; test/shared/shared_scenarios.ml |
| `color-picker-presets` | imperative selector hook — keep | src/shared/ui_components.ml |
| `cp__cmdk__block` | imperative selector hook — keep | src/shared/cmdk_view.ml |
| `extensions__code-calc` | imperative selector hook — keep | src/editor/code_mirror.ml |
| `foldable-title` | imperative selector hook — keep | src/pages/page.ml |
| `is-pdf` | imperative selector hook — keep | src/assets/asset_dom.ml |
| `ls-comment-delete` | imperative selector hook — keep | src/editor/editor_keys.ml |
| `ls-foldable-header` | imperative selector hook — keep | src/pages/page.ml |
| `secondary-tabs` | imperative selector hook — keep | src/shared/ui_components.ml |
| `select-language` | imperative selector hook — keep | src/editor/code_mirror.ml; native/code_mirror.ml |
| `shui-key-boxed` | imperative selector hook — keep | src/shared/ui_components.ml |
| `toolbar-plugins-manager` | imperative selector hook — keep | src/sidebar/sidebar_state.ml |
| `ui-fenced-code-editor` | imperative selector hook — keep | src/editor/editor_keys.ml |
| `is-paragraph` | dynamic-prefix family — keep | src/render/render.ml |
| `is-top` | dynamic-prefix family — keep | src/dialogs/plugins_view.ml |
| `ls-dialog-generic` | dynamic-prefix family — keep | src/views/views_popup.ml |
| `ls-dialog-prompt` | dynamic-prefix family — keep | src/dialogs/dialogs_view.ml |
| `ls-icon-filter` | dynamic-prefix family — keep | src/views/views_head.ml |
| `add-filter` | dead candidate — report only, do not delete | src/blocks/query_builder.ml |
| `asset-ref` | dead candidate — report only, do not delete | src/assets/asset_dom.ml |
| `bd-scroll` | dead candidate — report only, do not delete | src/icon/icon_picker.ml |
| `block-content-wrap` | dead candidate — report only, do not delete | src/properties/properties_value.ml |
| `bottom-property-pill-focusable` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `breadcrumb--block-page` | dead candidate — report only, do not delete | src/pages/page.ml |
| `clause-bracket` | dead candidate — report only, do not delete | src/views/views_builder.ml |
| `clauses-group` | dead candidate — report only, do not delete | src/views/views_builder.ml |
| `cmdk-item-body` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cmdk-item-header` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cmdk-item-main` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `content-pane` | dead candidate — report only, do not delete | src/icon/icon_picker.ml |
| `control-show` | dead candidate — report only, do not delete | src/blocks/tree.ml |
| `cp__cmdk-current-page-badge` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-empty` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-group` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-group-count` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-group-more` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-group-more-inner` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-group-spacer` | dead candidate — report only, do not delete | src/shared/cmdk_view.ml |
| `cp__cmdk-hints` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-hints-inner` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-hints-label` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-hints-row` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-search-only` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-search-only-clear` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-search-only-name` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-search-only-row` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__cmdk-tip` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `cp__query-builder-filter` | dead candidate — report only, do not delete | src/blocks/query_builder.ml |
| `cp__sidebar-main-layout` | dead candidate — report only, do not delete | native/chrome.ml |
| `desc-item` | dead candidate — report only, do not delete | src/dialogs/plugins_view.ml |
| `downloads` | dead candidate — report only, do not delete | src/dialogs/plugins_view.ml |
| `form-control` | dead candidate — report only, do not delete | src/dialogs/plugins_view.ml |
| `graphs-h2` | dead candidate — report only, do not delete | src/graphs/graphs_view.ml |
| `graphs-host` | dead candidate — report only, do not delete | src/graphs/graphs_view.ml |
| `group-list-view` | dead candidate — report only, do not delete | src/views/views_table.ml |
| `items-stretch` | dead candidate — report only, do not delete | native/chrome.ml |
| `list-wrap` | dead candidate — report only, do not delete | native/chrome.ml |
| `ls-collab-invite` | dead candidate — report only, do not delete | src/graphs/collaborators.ml |
| `ls-collab-users` | dead candidate — report only, do not delete | src/graphs/collaborators.ml |
| `ls-comments-target` | dead candidate — report only, do not delete | src/comments/comments_view.ml |
| `ls-comments-targets` | dead candidate — report only, do not delete | src/comments/comments_view.ml |
| `ls-filters-title-wrap` | dead candidate — report only, do not delete | src/views/views_head.ml |
| `ls-hp-link` | dead candidate — report only, do not delete | src/sidebar/right_sidebar_view.ml |
| `ls-property-select-check` | dead candidate — report only, do not delete | src/properties/properties_select.ml |
| `ls-recycle-page-description` | dead candidate — report only, do not delete | src/graphs/recycle.ml |
| `ls-refs` | dead candidate — report only, do not delete | src/views/views_head.ml |
| `ls-right-sidebar-open` | dead candidate — report only, do not delete | native/chrome.ml |
| `ls-search-row` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `ls-select-empty` | dead candidate — report only, do not delete | src/properties/properties_select.ml |
| `ls-select-trigger` | dead candidate — report only, do not delete | src/settings/settings_page.ml |
| `ls-swatch` | dead candidate — report only, do not delete | src/settings/settings_page.ml |
| `ls-swatch-cell` | dead candidate — report only, do not delete | src/settings/settings_page.ml |
| `ls-swatch-dot` | dead candidate — report only, do not delete | src/settings/settings_page.ml |
| `ls-swatch-none` | dead candidate — report only, do not delete | src/settings/settings_page.ml |
| `ls-tooltip` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `ls-tooltip-col` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `ls-tooltip-keys` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `lsp-hook-ui-slot` | dead candidate — report only, do not delete | src/pages/page.ml |
| `min-h-0` | dead candidate — report only, do not delete | native/chrome.ml |
| `min-w-0` | dead candidate — report only, do not delete | native/chrome.ml |
| `operator-clause` | dead candidate — report only, do not delete | src/views/views_builder.ml |
| `org-left` | dead candidate — report only, do not delete | src/render/render.ml |
| `pl-injected-ui-item-pagebar` | dead candidate — report only, do not delete | src/pages/page.ml |
| `pl-injected-ui-item-toolbar` | dead candidate — report only, do not delete | src/sidebar/left_sidebar_view.ml |
| `query-builder-clause` | dead candidate — report only, do not delete | src/views/views_builder.ml |
| `query-builder-clause-btn` | dead candidate — report only, do not delete | src/views/views_builder.ml |
| `self-stretch` | dead candidate — report only, do not delete | native/chrome.ml |
| `shui-shortcut` | dead candidate — report only, do not delete | src/shared/cmdk_view.ml |
| `shui-shortcut-b` | dead candidate — report only, do not delete | src/shared/cmdk_view.ml |
| `shui-shortcut-chord` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `shui-shortcut-chord-sep` | dead candidate — report only, do not delete | src/shared/ui_components.ml |
| `stars` | dead candidate — report only, do not delete | src/dialogs/plugins_view.ml |
| `to-heading-button` | dead candidate — report only, do not delete | src/popups/popups_view.ml |
| `-cnt` | extraction artifact (string fragment, not a class) | src/settings/settings_url_view.ml |
| `else` | extraction artifact (string fragment, not a class) | src/pages/page_menu.ml |
| `if` | extraction artifact (string fragment, not a class) | src/pages/page_menu.ml |
| `then` | extraction artifact (string fragment, not a class) | src/pages/page_menu.ml |
| `true` | extraction artifact (string fragment, not a class) | src/shell/chrome.ml |

## Summary

- e2e/test hook: 65
- imperative selector hook: 12
- dynamic-prefix family: 5
- dead candidate: 75
- not a class: 5

Notes:

- `is-paragraph`, `is-top`, `is-pdf` are cljs-compat state-flag classes
  (`is-*` family) — retained for DOM-contract parity, not dynamic
  composition; counted under the dynamic-prefix keep bucket.
- `ls-dialog-generic`, `ls-dialog-prompt`, `ls-icon-filter` are members
  of dynamically-composed families (`"ls-dialog-" ^ name`,
  `"ls-icon-" ^ n`) — keep.
- Dead candidates are emitted tokens with no CSS rule, no GPUI
  registration, and no observed e2e/imperative consumer. The bulk is
  cmdk/settings semantic hooks kept during T4–T5 recipe migrations
  (`cp__cmdk-*`, `ls-swatch-*`, `ls-tooltip-*`, `shui-shortcut-*`) —
  removing them is safe to batch in a follow-up, not done here.

## CSS purge (2026-10-10, branch `devin/css-purge`)

Reverse pass over the same audit: for every rule in
`resources/css/lui-overlay.css`, `resources/css/lui-core.css`, and
`resources/css/theme/*.css` (vendored `lui.css` excluded), the selector
was checked against every class emitter (`deps/ui/{src,native,subs,web}`
`.ml` `style_class`/`("class", ..)`/`data_attrs` sites including
dynamic families `"ls-dialog-" ^ name`, `"mode-" ^`, `"ls-icon-" ^`,
`"cp__settings-" ^`, `"block-drag-over-" ^`, `"ed-" ^ t`, plus
`deps/ui/{shims,js_app,web,gpui}` and the LUI runtime). 939 rules were
classified: 871 live, 5 kept as e2e/imperative hooks, 63 dead.

Rules deleted per file:

- `resources/css/lui-overlay.css`: **49 rules** (271 lines). Notables:
  `.menu-link.no-padding`, `.cp__select-input.ls-compact`, the whole
  `.cp__select-main .type-icon` cluster, `.ls-readme-repo-icon`,
  `.ui__button.ls-btn-outline-sm`, the `.ls-property-dropdown
  .inner-wrap` group, `.ls-property-name-edit-pane`/`.ls-base-edit-form`
  inputs, `.cp__user-login a.opacity-60`, `html.is-mobile`-era leftovers,
  `.ui__toaster` (toasts are LUI `lui-toast` now).
- `resources/css/lui-core.css`: **12 rules** (72 lines): `.cp__header-logo`
  + its 640px media block, `.is-electron.is-mac[.is-fullscreen]
  .cp__header > .l` (is-electron/is-mac/is-fullscreen are never emitted),
  `.as-scalar-value-wrap .ui__checkbox`, `.hidden-block .block-children`,
  `.non-block-editor textarea`, the `html.is-mobile` block,
  `html.custom-scrollbar` scrollbar variant. `.cm-s-solarized.CodeMirror`
  kept — `cm-s-solarized` is emitted by CodeMirror 5 at runtime.
- `resources/css/theme/index.css`: **1 rule** (160 lines): the
  `.ui__toaster` toast stack (superseded by `lui-toast-viewport`).

Also deleted:

- 7 dead comma-part alternatives pruned from otherwise-live rules
  (`.menu-links-outer`, `.ls-property-name-edit-pane .ui__input` +
  `.ls-base-edit-form .ui__input`, `.ui__textarea:focus`,
  `.cp__user-login a.opacity-60`, `.editor-inner .multiline-block:hN`,
  `html.custom-scrollbar`, `.video-inline-text`).
- 1 emptied `@media (min-width: 640px)` block; 0 dead `@keyframes`.
- **524 unreferenced custom properties**: the whole
  `theme/radix-hsl.css` file (672 `--rx-*-hsl` triplets, removed along
  with its `tailwind.all.css` import), 350 unused `--rx-*` ramps in
  `theme/radix.css` (color families with no `[data-color]` block and
  the `--rx-{black,white}-alpha` overlays), 47 dead `--ls-wb-*`/accent
  twins in `theme/colors.css`, and 11 dead vars in the two lui sheets.
- All **75 dead-candidate emitted tokens** were removed from their
  emitters (all sites found — several tokens had extra emission sites
  beyond the table, e.g. `asset-ref` in `render_inline.ml`,
  `list-wrap`/`cp__sidebar-main-layout` in `src/shell/chrome.ml`,
  `cp__query-builder-filter` in `views_builder.ml`). The 65 e2e/test
  hooks, 12 imperative hooks, and 5 dynamic-prefix-family tokens were
  kept.

Gates after the purge: `dune build js_app test gpui/drive_test.exe`
clean, `test_main.js` 2009 checks 0 failures, `dune runtest` green,
`npm run css:build` succeeds.

## CSS purge — B1 dialogs (2026-10-10, branch `devin/004-b1-dialogs`)

Batch B1 of `2026-10-11-004-css-to-lui-api.md` — the dialog-body
selectors in `resources/css/lui-overlay.css` moved to typed props on
their emitters (`dialogs_view`, `login_view`, `ui_requests`,
`quick_add_view`, `plugin_readme`, `settings_url_view`, `exporter`,
`export_view`, plus the `page_menu`/`native/page_menu` alert-dialog
twins and a shared `ui_components` recipe: `dialog_btn_neutral`,
`dialog_btn_primary`, `alert_dialog_overlay`, `alert_dialog_content`,
`alert_dialog_header`, `alert_dialog_main_content`,
`alert_dialog_footer`). `ls-dialog-<name>` chrome rides a per-name
spec on the `dialog` element (`~padding` + data-attrs `style` for the
unexpressible viewport/calc declarations); gpui parity comes from the
same props.

Deleted rules (`resources/css/lui-overlay.css`, ~390 lines):

- AlertDialog chrome: `.ui__alert-dialog-header`, `-title`,
  `-main-content`, `.ui__alert-dialog-description`, `-footer`,
  `.ui__alert-dialog-main-content .ls-confirm-desc`, `.ls-alert-title`.
  `.ui__alert-dialog-overlay` keeps `backdrop-filter` + entry
  animation; `.ui__alert-dialog-content` keeps the zoom-in animation.
- Dialog chrome: `.ui__dialog-title` (moved to the heading;
  the comma-merged menu-item selectors keep their shared body),
  `.ui__dialog-main-content` (top-level), `.lui-dialog.ls-dialog-settings`
  (3 rules), `.ls-dialog-export-page` + `.export-opts`/`.export-btns`,
  `.ls-dialog-sync-server`/`.ls-dialog-publish-server`,
  `.ls-dialog-plugin-readme`, `.lui-dialog.ls-dialog-plugins`,
  `.lui-dialog.ls-dialog-new-graph`/`-add-graph`,
  `.lui-dialog.ls-dialog-login` + its dead `.form-input`/`.as-solid`
  width rules.
- Buttons: `.ui__button.ls-btn` + `:hover`, `.ui__button.ls-btn
  .ls-btn-primary`, `.ui__button.ls-btn-primary` + `:hover` — all
  emitters were B1 files; paint now rides the `dialog_btn_*` recipes.
  The `.ui__dialog-content`/`.ui__alert-dialog-content` scoped
  `ls-btn-primary` overrides (pdf imperative modal) stay.
- Prompt/e2ee: `.ls-prompt-headline`, `.ls-prompt-input`/
  `.ls-login-input`, `.e2ee-password-modal-content`, `.ls-e2ee-title`,
  `.ls-e2ee-form`, `.ls-eye-btn` + `:hover`, `.ls-warn-text`.
- Login: `.cp__user-login` + scoped `.ui__button`/`.desc`/
  `span.opacity-50`/`.ui__alert` (dead) and the whole `.ls-auth-*`
  cluster (title, field + `.lui-label`, foot + `.lui-row`, muted, link
  + hover).
- Misc bodies: `.ls-quick-add` (2 rules), `.ls-qa-head`/`-title`/
  `-content`/`-btns`, `.ls-readme-repo`/`-link`/`-body`,
  `.ls-dialog-title-lg`, `.ls-pad`, `.ls-mb-sm`, `.ls-strong`,
  `.ls-ex-list`, `.export h1.title.ls-mb`, the scoped
  `.cp__settings-{sync,publish}-server-cnt .ls-form-actions`.

Kept per batch scope:

- `.lui-dialog` base `gap/padding/width/height` + its `min-width:
  1024px` media variant — shared with `cards_view`, `views_popup`,
  `properties_menu`, `cmdk_view` emitters (unassigned batches); the
  `.ui__dialog-*` imperative overlay/content family (pdf_toolbar),
  runtime `[data-base-ui-inert]` state, `[data-align=top]`, and the
  reduced-motion block.
- `.lui-dialog.ls-dialog-login .ui__dialog-main-content{width:70vw;
  max-width:500px}` + 640px media — media-coupled width stays in CSS;
  the same element carries `padding:0;position:relative` as props.
- Shared button/input families: `.ui__button.ls-btn-*`
  (`ls-btn-outline`, `ls-btn-sm/xs/md/lg/icon/default`), `.as-*`,
  `.ui__input`, `.form-input`, `.ls-toggle-password-input`, `.ls-desc`,
  `.ls-form-actions` — emitters outside B1 (publish_view, new_graph,
  collaborators, settings_controls, cards_view, plugins_view,
  views_popup).
- `.lsp-frame-readme` (raw `Logseq_el` iframe), `.export hr`
  (margin + border decoration), `.lui-dialog.ls-dialog-flashcards` +
  media, `.lui-dialog.ls-dialog-cmdk`, `.lui-modal-decoration:empty`,
  the `.ui__dialog-title:has(...)` and dialog-close hooks.

gpui `register_class_style` removals (`logseq_ext.rs`): the whole
`ui__alert-dialog-{overlay,content,header,title,main-content,footer}`
set (both registries) and `ui__dialog-main-content` (`min-height:0`,
`width:100%`). `ls-dialog-settings` stays — the settings max-width is
carried by the data-attrs style pair, which is web-only.
