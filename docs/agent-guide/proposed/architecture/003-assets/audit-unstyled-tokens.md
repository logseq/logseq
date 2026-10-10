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

## Batch B2 — views head + table (lui-overlay.css)

Migrated `views_head.ml` + `views_table.ml` and deleted **52 rules**
(~380 lines) from `resources/css/lui-overlay.css`:

- Dead markup: `.menu-links-wrapper` + the four scoped variants +
  `strong` (no emitters left; gpui registration removed the same commit).
- View head/tabs: `.views`, `.views button`, `.ls-count`,
  `.ls-view-tab`, `.ls-dim`, `.ls-view-head`, `.ls-view-head-left`,
  `.ls-query-count` → `~gap`/`~cross`/`~main`/`~height`/FontSize/
  `float_prop_signal Opacity` on the emitters.
- Sort popup: `.ls-view-order-setting`, `.ls-drag-row`, `.ls-col-name`,
  `.ls-sort-right`, `.ls-sort-order` (base), `.ls-sort-x` + `:hover`,
  `.ls-sort-delete` + `:hover`, `.ls-xs` → typed props on `button`
  kinds; `.ls-sort-order svg`/`.ti`, `.ls-sort-x svg`,
  `.ls-sort-delete svg` icon-size hooks kept as hooks.
- Filter popup + chips: `.ls-vf-col`, `.ls-op-btn`, `.ls-vf-chip`,
  `.ls-vf-chip-prop/-op/-val/-x`, `.ls-view-filter-value-item`,
  `.filters-row`, `.ls-vf-chips` → `row`/`column`/`box`/`button` kinds;
  per-side borders + flex-wrap/ellipsis/nowrap ride the
  `("style", ...)` data-attrs merge channel; chip `disabled` via
  `DisabledOpacity`.
- Filters dialog: `.ls-filters` box chrome, `.ls-filters-header`,
  `.ls-filters-icon`, `.ls-filters-title`, `.ls-filters-label`,
  `.cp__filters-input-panel` (base), `.cp__filters-input`,
  `.ls-ref-btn` (base; `:hover` border-color hook kept) →
  `column`/`row`/`box`/`heading`/`button ~on_press_detail` (shift-click
  via `modifiers` bit 2).
- Table: `.ls-table-header`, `.ls-table-header-cell` + `> .ui__button`,
  `.ls-table-row.ls-block`, `.ls-table-row.ls-block.selected`,
  `.ls-table-footer`, `.ls-table-cell`, `.ls-table-rows .ls-table-cell`,
  `.ls-table-cell > div`, both font sweeps
  (`.ls-table-rows .ls-table-row*`, `.ls-table-header-cell*`) →
  props on cell/header/row emitters; row selected bg via
  `prop_signal BackgroundValue` (the `selected` class is still emitted
  for `table_row_keydown`'s add/remove_class contract); `.ls-view-body`
  dropped from the shared `min-width:0` selector group (its `mt-1`
  margin rule kept).
- One leftover emitted decl deliberately dropped: `.ls-table-header`'s
  `opacity:0.5` (cljs header is not translucent).

Kept as stylesheet hooks (no prop channel or shared with later
batches): `.ls-icon-btn` (cards_view/plugins_view emit),
`.ls-view-body` margin, `.ls-view-head`, `.ls-view-tab`,
`ls-vf-chip`/`filters-row` (class markers now), `.ls-op-label` +
`.ls-vf-logic` (base+hover opacity pairs — inline `~opacity` would win
over the zero-specificity `:where(:hover)` channel),
`.ls-table-resize-handle` (0/.7/1 opacity ladder, same reason),
`.sticky-columns` (no `sticky` Position value),
`.ls-table-rows > .relative` (`pb-38px` + virtual-list wrappers),
`.ls-table-row div/span/a` nowrap sweep, `.table-block-title` +
`ls-title-ghosts` hover-reveal, `.ls-table-row [data-table-row-select]`
checkbox `:has` rules, `div[data-index]`/`[data-viewport-type]`
virtual-list hooks, `.view-actions`/`.ls-add-view` transition,
`.ls-icon-color-wrap` em-emoji, `.select-item`/`.jtrigger`/
`.property-value-inner` (views_popup/properties_area still emit),
`.menu-link*`/`.chosen`/`cp__select*` (B3/B4 scope), `.ls-foldable-*`
animations, `.ls-filters .cp__filters` + `:empty` margins,
`.cp__filters-input-panel:focus-within`, `.ls-filters-refs` + `:empty`,
`.ls-ref-btn:hover`, `.ls-sort-order .ti/svg`, `.ls-sort-x svg`,
`.ls-sort-delete svg`.

Gates after the batch: `dune build js_app test gpui/drive_test.exe`
clean, `test_main.js` 2009 checks 0 failures, `dune runtest` green
(725 checks), `npm run css:build` succeeds. One gpui class registration
removed (`menu-links-wrapper`); `selected`, `menu-link-wrap`,
`menu-link`, `chosen` registrations kept — their emitters land in later
batches.

## CSS purge — B3 pickers (2026-10-10, branch `devin/004-b3-pickers`)

Batch B3 of `2026-10-11-004-css-to-lui-api.md`: calendar/date/time/repeat
pickers + icon/emoji/color pickers. Emitters: `editor_commands.ml`,
`icon_picker.ml`. Rebased over `refactor/lui` first — the web-parity
datepicker repeat-column + calendar fixes landed in
`web-parity.ml`+`cal_body`-adjacent rules at `lui-overlay.css:4112+`
(`.ls-cal-hd`/`.ls-cal-grid`/`.ls-cal-day`/`.ls-repeat-col`) which
belong to a different emitter and were left untouched.

`resources/css/lui-overlay.css`: **62 rules deleted (~350 net lines)**:

- `.ui__calendar` display rule, `.ui__calendar-cell`, the whole
  `.ui__calendar-day` chain (+hover/+[data-selected]/+[data-today])
  → td contract attrs kept (`data-focused`/`data-today` — shui.css
  `[role=gridcell][data-*]>button` still paints them); day buttons are
  `~variant:`ghost` with `~selected` + reactive
  background/foreground (selected > today > default).
- `.ls-editor-date-picker` root + all descendants (cal-head,
  cal-selects, month-select, year-input, cal-nav, cal-nav-btn,
  table[role=grid] + td, ls-cal-outside, ls-date-nlp,
  ls-date-month-menu, ls-repeat-choice-menu, ls-date-month-option,
  ls-cal-prop, ls-property-date-picker-in-picker, ls-time-picker,
  ls-time-input) → kinds + typed props; raw number/time inputs keep
  `Logseq_el` and take box styles via a `style` data_attr (number/time
  have no LUI input kind).
- `.ls-repeat-panel`, `.ls-repeat-head`, `.ls-repeat-checkbox`
  (+[data-checked]), `.ls-repeat-frequency`, `.ls-repeat-label`,
  `.ls-repeat-frequency-input`, `.ls-repeat-select` (+hover),
  `.ls-repeat-next`/`.ls-repeat-when`, `.ls-repeat-is` →
  column/row/checkbox-button with reactive background/foreground; the
  checkbox's `border-color` rides a reactive `style` attr (no
  `border_color_signal` channel).
- `.cp__emoji-icon-picker` root + `.hd`/`.bd`/`.ft`/`.pane-section`/
  `.its`/`.icons-row`/button/hover/`hd strong` rules →
  `container_relative_frame` + `with_props` Position/Inset; preset
  color reactive `~foreground` on the section column.
- `.color-picker` base, `.ls-emoji-preview`, `.ls-emoji-cell`,
  `.ls-ep-section-title` (light), `.ls-ep-col`, `.ls-ep-tabs`,
  `.all-pane`, `.ls-ep-btn` → item cells are 36px ghost buttons;
  `ls-emoji-preview`/`ls-emoji-cell` classes kept (regression-test
  locator); outline buttons take 28px typed chrome.
- Shared `.ls-property-date-picker,.ls-editor-date-picker` rules
  narrowed to `.ls-property-date-picker` only — also emitted by
  `properties_value.ml` (out of scope).

Added: `.ls-time-now:hover` text-color rule (no `HoverForeground`
channel exists).

Kept (leftovers, next passes or out of scope): `.dark
.cp__emoji-icon-picker .hd strong`, `.ui__dropdown-menu-content
.cp__emoji-icon-picker` (context-specific margins), `.color-picker >
strong`(+hover), `.dark .ls-ep-section-title`, `.panel-wrap
.ls-date-format`, and the `:4112+` `.ls-cal-*`/`.ls-repeat-col`
web-parity rules (different emitter).

Gates: `dune build js_app test gpui/drive_test.exe` clean,
`test_main.js` 2009 checks 0 failures, `dune runtest` 725 checks 0
failures, `npm run css:build` succeeds.

## B4 menu chrome + autocomplete (2026-10-10, branch `devin/004-b4-menus`)

Batch B4 of `2026-10-11-004-css-to-lui-api.md`: migrated the
`lui-overlay.css` menu/autocomplete block into LUI typed props and
inline-style attrs on the emitters (`menu_item.ml`, `popups_view.ml`,
`views_popup.ml`, `views_head.ml`, `views_view.ml`,
`plugins_view.ml`, `ui_components.ml`).

Deleted **348 lines** (~70 rules): `[data-editor-popup-ref]` base +
per-ref width/side rules, `#ui__ac-inner` + `.menu-link` base +
`#ui__ac-inner .menu-link{,:hover,.chosen,[data-selected]}` +
`.menu-link-wrap`/`strong`, `ls-ac-*` (node/row/icon/bc/ic/empty),
`ls-tag-search-hint`, `ls-preview-popup` + `.tippy-wrapper` +
`.as-page` + `.ls-page-blocks`, `ls-context-menu-content` widths +
`ls-cm-*` rows (colors/headings/swatch/btn/sc/chevron),
`ui__dropdown-menu-sub-content` deeper shadow, `cp__select` vars +
`cp__select-main`/`input-wrap`/`cp__select-input`(+`:focus`)/
dropdown-scoped overrides/`cp__select-results`/`item-results-wrap`/
`cp__select-apply`/`select-item-*`, `menu-links-wrapper` (dead), and
`.cp__plugins-item-card .menu-list` + `.menu-list
.ui__dropdown-menu-item`.

Emission changes:

- Card chrome → `with_props` binds on the popover kinds: `card_shadow`
  + `sub_card_shadow` pairs added to `Ui_components`; per-emitter
  `~background`/`~border_color`/`~border_width`/`~corner_radius`/
  `~padding`/`~min_width` and `int_prop_signal P.WidthValue` for the
  tag-vs-standard context-menu width.
- `menu-link`/`chosen` → `Menu_item.menu_link` recipe for the
  imperative `<a>` anchors (extension nodes take no typed props):
  inline `style` carries the row chrome, `chosen_signal` flips
  `.chosen` + re-emits `attrs` (ac rows), static `~chosen` for
  cp__select rows; `~plain_bg`/`~transition:false` variants cover the
  select rows. `ac_chosen_bg` paints `lx-gray-04`/`--ls-menu-hover-color`
  inline so the CSS `.chosen` rule could go.
- `ls-ac-*` row structure → `row`/`column`/`text` typed props
  (opacity, min-width, gap); margins/flex-shrink stay as data-attr
  styles.
- `cp__select*` → `menu_link` rows + `with_props` on the input
  (`FontSize`, `FocusShadow`) and `MaxHeightViewport` on the column;
  inline styles keep `width:fit-content`/`100%`, compact padding, and
  the results-wrap overflow.
- `menu-list` (plugins card) → `list` kind + card props + absolute
  positioning style pair.
- gpui: dead `menu-links-wrapper` + `menu-link-wrap` regs removed;
  `menu-link`/`chosen` regs kept (extension anchors still emit them).
- `views_popup.ml` menu_level kept `popover` + typed props; the
  `dropdown_menu ~at` adoption is a leftover (placement translate
  transforms + MCustom children don't fit the anchor contract yet).
- `~gap` is not a `menu_item` prop (native test failure) — item gap
  stays in the shared `.ui__dropdown-menu-item` rule.

Kept (hooks/other-batch emitters): base `.ui__popover-content` card
rule (page_menu/properties/sidebars/settings/icon_picker emitters),
`data-side`/`--lui-pop-dx`/sub-content[data-side] placement hooks,
`.menu-link:hover` + theme-scoped `.cp__select-main .menu-link.chosen`
variants (class still toggles), separator margin rules,
`.menu-separator`, `.hide-scrollbar`, `.cp__commands-slash .ui__icon*`
descendant hooks, `menu-link`/`chosen` gpui regs.

Gates: `dune build js_app test gpui/drive_test.exe` clean,
`test_main` 2009 checks 0 failures, `dune runtest` green,
`npm run css:build` succeeds; menu + autocomplete spot-checked
light/dark.

### B5 plugins + settings frame (2026-10-10, branch `devin/004-b5-plugins-settings`)

Batch B5 of plan `2026-10-11-004-css-to-lui-api.md`: migrated the
plugins dashboard + settings modal frame out of
`resources/css/lui-overlay.css` into LUI typed props across
`plugins_view.ml`, `settings_view.ml`, `settings_page.ml`,
`settings_url_view.ml`, and `dialogs_view.ml` (new `dialog_frame`
carries the vw/calc dialog geometry as a per-name `data_attrs` style).

Deleted **432 lines** from `lui-overlay.css` (4705 → 4273), ~64
selector lines:

- Plugins: `ls-dialog-plugins` + `ls-dialog-settings` dialog geometry,
  `.cp__plugins-page.web-platform .cp__plugins-item-lists`,
  `.cp__plugins-settings-inner`, `.cp__plugins-installed`,
  `.cp__plugins-marketplace-cnt`, `.cp__plugins-item-lists[-inner]`,
  `.plugin-icon`, `.r`, `.head` (both instances — the 1.25rem duplicate
  won), `.desc` (both), `.ctl` + `.ctl .l/.r` (both), `.menu-list`,
  `.control-tabs` + `.l/.r` (both instances), `.tabs`/`.tabs-inner`
  (both), `.l.link-block`, `.ls-pl-empty`/`-text`, `.ls-pl-meta`,
  `.ls-pl-status`, `.ls-pl-loading`, `.code-mode-wrap`, `.ls-pl-warn`,
  `.ls-pl-id`, `.ls-pl-link` (hover rule kept).
- Settings frame: `.cp__settings-inner` (base), dead
  `.cp__settings-inner > header`/`h1` rules, `.settings-aside`,
  `.settings-article`, `.cp__settings-header` variants + `.ui__icon`
  dead pair, `.cp__settings-modal-title`, `.cp__settings-category-title`
  (`::first-letter` kept), `.settings-menu`, dead `.no-aside > article`,
  `.panel-wrap` base (media + `> .it:first-of-type` kept),
  `.cp__settings-app-updater` + `.ctls`,
  `.cp__settings-appearance-dialog-inner` + `#appearance_settings`,
  `.appearance-popup`, `.ls-popup-backdrop`, `.ls-select-md`,
  `.ls-select-lg`, `.ls-select-wrap`, `.ls-settings-col`,
  `.cp__settings`, scoped `.cp__settings-{sync,publish}-server-cnt
  .ls-form-actions`, dead `.menu-list .ui__dropdown-menu-item`.

Also deleted: the `ls-popup-backdrop` GPUI class registration in
`deps/ui/gpui/host/src/logseq_ext.rs` (backdrop now emits
Position/Inset/ZIndex typed props).

Kept hooks: all `@media` blocks, `::first-letter`,
`.settings-menu-item[data-id="keymap"]` variants,
`.panel-wrap > .it:first-of-type`, `.panel-wrap .form-*` cluster,
`.html-content.ls-pl-html`, `.ls-mono`, `.ls-pl-link:hover`,
`.ls-form-actions` base, `.ls-select-content` dropdown internals
(`order`, `data-selected` hovers), `ls-font-sample`/`ls-font-name`
GPUI regs (out of scope).

Leftovers for follow-up machinery: `top: 100%` percent-inset,
`flex-wrap`, margins (`margin-top`, `-5px`/`1rem` offsets),
`calc()`/`min()`/`dvw`/`dvh` clamps, `text-transform`, `order`,
`:hover`/`:first-of-type`/`[data-*]` selectors, `font-family`,
scrollbar rules.

Gates: `dune build js_app test gpui/drive_test.exe` clean,
`test_main.js` 2009 checks 0 failures, `dune runtest` green,
`npm run css:build` succeeds. Plugins dashboard + settings General/
Editor sections + appearance popup spot-checked light+dark vs prod.
