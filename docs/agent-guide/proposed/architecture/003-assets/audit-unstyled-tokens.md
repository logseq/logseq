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
