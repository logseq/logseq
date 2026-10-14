# Master / native UI parity coverage

## Fixed comparison inputs

- Reference: `logseq/logseq master`, `7dfa9b45a` (full hash recorded in the session manifest).
- Native base: `refactor/lui`, `7b0d18735000f2b7ae6342c410df476088baa543`.
- Implementation branch: `codex/native-ui-parity-master`, created from that base with no previous remote implementation branch.
- Linux native host: OCaml/LUI SDL executable, not the browser UI. LUI source revision: `7ae8b157281fc4837fc7e6f1507d722c1f13404c`.
- Comparison target: 1280 x 900 content viewport, scale 1, English, light and dark themes, identical disposable content. Native header at the top is accepted; its content and behavior are not exempt.
- Workspace evidence: `/home/user/logseq-ui-parity/evidence/`. Runtime logs: sibling `logs/`. Disposable data: sibling `data/`; never use an existing user graph.
- User scope update: Graph View and its graph-visualization-specific interactions are explicitly excluded from implementation and validation. Graph management, graph switching and persistence remain in scope.
- Hard stop: 2026-10-16T16:22:21.466320Z. The existing enabled deadline timer remains unchanged.

## Status convention

`Inventory` means identified in current master source/tests, not verified parity. `Explored` requires live reference reproduction. `Different` requires paired execution evidence. `Fixed` requires tests and actual native reproduction; `Verified` additionally requires paired matching behavior, persistence where applicable, and appearance evidence. `Partial` records validated fixes while known differences remain. `Blocked` names an exact external/platform prerequisite; it does not mean omitted.

`source-inventory.json` lists 251 current master E2E cases with scenario descriptions and candidate native test files. Candidate paths and historical reports do not count as native execution. This matrix expands as live exploration discovers additional surfaces.

## Coverage matrix

| ID | Reference surface / interaction | Authoritative master source | Native implementation candidate | Status | Difference / fix / validation / evidence |
| --- | --- | --- | --- | --- | --- |
| H01 | Header: sidebar/search/home/right-sidebar, graph-dependent visibility | components/header.cljs | native/chrome.ml | Partial | Graph-search loading/closure visibility fixed and regression-tested. Header positioning/alignment and other conditional controls remain. [Evidence](evidence/search/validation.md) |
| H02 | Desktop back/forward, route history, block breadcrumb | components/header.cljs | native/chrome.ml; routing/router.ml | Inventory | Pending desktop reference execution |
| H03 | Header: page/application menu, shortcut hints, tooltips | components/header.cljs; page_menu.cljs | native/page_menu.ml; popups/tooltip.ml | Inventory | Pending paired execution |
| H04 | Sync, collaborators, upload/download/index progress, updates, server and plugin indicators | components/header.cljs; rtc/; server.cljs | native/chrome.ml; graphs/rtc_flows.ml | Inventory | Test local states first; remote fixtures must not use real graphs |
| L01 | Graph picker: switching, recent graph order, menus and creation entry | components/repo.cljs; left_sidebar.cljs | sidebar/left_sidebar_view.ml; graphs/ | Inventory | Pending paired execution |
| L02 | Journals, Pages, Tasks, Assets, flashcards; navigation customization | components/left_sidebar.cljs | sidebar/left_sidebar_view.ml | Inventory | Pending paired execution |
| L03 | Favorites and recents: navigation, shift-click, context actions, collapse | components/left_sidebar.cljs | sidebar/left_sidebar_view.ml; sidebar_state.ml | Inventory | Pending paired execution |
| L04 | Sidebar resizing, close/open persistence, drag/reorder, scrolling | components/left_sidebar.cljs | native/chrome.ml; sidebar/ | Inventory | Pending paired execution |
| R01 | Contents, page/block items, help; open/close/clear/close-top | components/right_sidebar.cljs | sidebar/right_sidebar_view.ml | Inventory | Pending paired execution |
| R02 | Right sidebar resizing, item folding, independent scrolling, breadcrumbs | components/right_sidebar.cljs | sidebar/right_sidebar_view.ml | Inventory | Pending paired execution |
| P01 | Home/default page and journals: dates, paging, empty content, scroll reset | components/home.cljs; journal.cljs | native/chrome.ml; pages/page.ml | Inventory | Pending paired execution |
| P02 | Page title rename, icon/cover, metadata, built-in/regular/tag/journal states | components/page.cljs; db_based/page.cljs | pages/page.ml; icon/icon_picker.ml | Inventory | Pending paired execution |
| P03 | Block zoom routes and breadcrumb navigation; invalid/missing routes | routes.cljs; components/page.cljs | routing/router.ml; pages/page.ml | Inventory | Source route sets differ; reproduce before fixing |
| P04 | Delete, favorite, convert tag/page, copy URL, publish/public and export menus | components/page_menu.cljs | native/page_menu.ml; pages/page_ops.ml | Inventory | Pending paired execution |
| P05 | All Pages: tables, filtering, sorting, tabs, selection, navigation | components/all_pages.cljs; views.cljs | views/ | Inventory | Pending paired execution |
| G01 | Global Graph: modes, settings, node/edge display, navigation, pan/zoom, time travel | components/graph.cljs; extensions/graph.cljs | Not required | Excluded by user | Explicit user scope update on 2026-10-14: do not implement or validate graph visualization or graph-specific interactions |
| S01 | Search: open/close, query restore, Escape semantics, focus, results, scrolling | components/cmdk/ | shared/cmdk_view.ml; native/cmdk_host.ml | Partial | Literal-space encoding and new-page editor focus fixed. Native typing/save/database evidence and repeated focused E2E pass; remaining query/Escape/results/scroll paths are not fully verified. [Evidence](evidence/search/validation.md) |
| S02 | Search filters, commands, new page, journal/date navigation, sidebar-open | components/cmdk/; commands.cljs | cmdk/; shared/cmdk_view.ml | Inventory | Pending paired execution |
| S03 | Search in page / find; theme search | components/find_in_page.cljs; cmdk/ | cmdk/; settings/ | Inventory | Pending paired execution |
| E01 | Click-to-edit, caret placement, title editing, empty block/add button | components/editor.cljs; block.cljs | editor/; blocks/add_button.ml; native/logseq_editor.ml | Inventory | Pending paired execution |
| E02 | Text, Enter split, Shift+Enter, Backspace/Delete merge, line/cursor navigation | handler/editor.cljs; clj-e2e editor tests | editor/ | Inventory | Pending paired execution |
| E03 | Formatting, headings, task status/priority, markdown/Org rendering | components/block.cljs; handler/editor.cljs | render/; editor/; properties/ | Inventory | Pending paired execution |
| E04 | Slash, page/block reference, tag, emoji, link and date autocomplete | components/editor.cljs; handler/editor.cljs | editor/; native/editor_cmds_host.ml; popups/ | Inventory | Pending paired execution |
| E05 | Focus, Escape/outside-save, IME, selection retention, shortcut suppression | components/editor.cljs; modules/shortcut/ | editor/; ocaml_host/logseq_native.ml | Inventory | IME and macOS modifiers need platform-specific evidence |
| E06 | Selection and multiselect, selection action bar, selected-block operations | components/block/selection.cljs; selection.cljs | editor/block_selection.ml; blocks/selection_bar.ml | Inventory | Pending paired execution |
| E07 | Undo/redo: typing, split, merge, indent, paste; caret/selection restoration | clj-e2e undo_redo_test.clj; editor_basic_test.clj | editor/editor_actions.ml; outliner_ops.ml | Inventory | Pending paired execution |
| E08 | Clipboard: block-ref/text copy, cut, structured/plain/multiline paste | handler/editor.cljs; clj-e2e editor tests | editor/; native/services/platform_native.ml | Inventory | Pending paired execution |
| E09 | Indent/outdent, fold/unfold, number/document modes, keyboard reorder | clj-e2e outliner_basic_test.clj | editor/; blocks/tree.ml | Inventory | Pending paired execution |
| E10 | Pointer drag/drop, nested target insertion, multi-block reordering | components/dnd.cljs; block/drop.cljs | native/block_dnd.ml | Inventory | Pending paired execution |
| B01 | Links, refs, backlinks, filters, embeds, self/missing references | components/reference.cljs; block.cljs | pages/page.ml; render/; views/ | Inventory | Pending paired execution |
| B02 | Tags/classes: create/convert/extends, objects/table membership | components/class.cljs; property.cljs | properties/; pages/; views/ | Inventory | Pending paired execution |
| B03 | Properties: types, values, choices, defaults, cardinality, hidden/positioned | components/property/ | properties/ | Inventory | Pending paired execution |
| B04 | Bidirectional and scoped properties; validation errors and disabled controls | clj-e2e property tests | properties/ | Inventory | Pending paired execution |
| B05 | Comments, reactions, status history and sync conflicts | components/block/ | comments/; blocks/comments_ops.ml | Inventory | Pending paired execution |
| Q01 | Query builder, view management, table/grid/list controls and action submenus | components/query/; views.cljs | blocks/query_builder.ml; views/ | Inventory | Pending paired execution |
| M01 | Menus/popovers: anchors, second press, outside/Escape, disabled items, keyboard focus | components/; deps/shui/ | core/overlay.ml; shared/ui_components.ml | Inventory | Verify each owning surface, not just primitives |
| M02 | Dialog stacking, alerts, prompts, confirmation, password and focus restore | deps/shui/; components/ | dialogs/; graphs/rtc_error.ml | Inventory | Pending paired execution |
| M03 | Toasts: identity, duration, persistent errors, close/pause/swipe/stack | handler/notification.cljs; deps/shui/ | toasts/ | Partial | Master notification selector restored; production-view and graph-validation fixture checks pass. Native layout, position and lifecycle parity remain. [Evidence](evidence/search/validation.md) |
| T01 | Settings General: language, theme, accents, font, wide/bracket modes | components/settings.cljs | settings/; ocaml_host/theme_vars.ml | Partial | Native control palette now resolves app snapshot roles; actual dark/light switch and restart persistence verified. Typed column/pane sizing, visible font-checkbox geometry/persistence and theme selection outline now have native layout/paint and actual-window evidence. First-row spacing, icons, font effects and custom accents remain. [Palette](evidence/theme/validation.md), [layout/text](evidence/settings-layout/validation.md) |
| T02 | Settings Editor: date format, outdent, references, home, tooltip options | components/settings.cljs | settings/settings_page.ml | Partial | Paired execution confirms primary/input track colors and theme backdrop fixed. Column alignment and native wrapping/line-height now repaired and scene-tested; actual window evidence retained. First-row spacing, thumb geometry, icons and nested scrolling remain. [Evidence](evidence/settings-layout/validation.md) |
| T03 | Settings Features/Advanced: flashcards, plugins, server, sync URLs, privacy/developer | components/settings.cljs | settings/ | Inventory | Pending paired execution |
| T05 | Authenticated settings: collaboration, access tokens and encryption | components/settings.cljs | No complete corresponding native settings panel inventoried | Inventory | Conditional source surfaces discovered; use isolated local account fixtures, not a production graph/account |
| T04 | Keymap: filters, search by keys, custom binding, disable/reset, actual dispatch | components/shortcut.cljs; modules/shortcut/ | settings/keymap_data.ml; settings_page.ml; native/ | Inventory | Base keymap uses static macOS data; custom/reset paths require investigation |
| D01 | Graph creation, import formats, export page/graph/ontology and publishing | components/repo.cljs; imports.cljs; export.cljs | graphs/; export/ | Inventory | Use disposable fixtures only |
| D02 | Graph switching/deletion/recycle, retention and persistence across restart | components/repo.cljs; recycle.cljs | graphs/; native/daemon_client.ml | Inventory | Pending paired execution |
| A01 | Assets: upload/paste/drop, images/media/PDF, annotations/file views | components/assets.cljs; block/; file.cljs | native/asset_dom.ml; pdf.ml; pages/file_view.ml | Inventory | Native extension support must be tested, not hidden |
| A02 | Flashcards: navigation, review/rating, scheduling and settings | clj-e2e flashcards_basic_test.clj | cards/ | Inventory | Pending paired execution |
| X01 | Plugins dashboard/settings/marketplace, UI hooks and commands | components/plugins*.cljs | native/plugins_view.ml; plugin_host.ml | Inventory | Exact native host capability restrictions must be recorded |
| X02 | Login/logout, local sync test server, RTC/e2ee/error/retry/collaboration | components/user/; rtc/; e2ee.cljs | graphs/rtc_*; dialogs/login_view.ml | Inventory | Do not use production account or existing graph for destructive tests |
| X03 | Bug report/help/library/onboarding, desktop menus and window controls | routes.cljs; components/ | native/menu_bar.ml; dialogs/; sidebar/ | Inventory | macOS AppKit and window-material verification unavailable on Linux |
| U01 | Loading/empty/error/disabled states; long content, clipping/scrolling, scaling | Current source/tests across all surfaces | All corresponding surfaces | Partial | Graph-search loading state and Linux native uncover repaint repaired. Uncover capture exactly matches baseline; other cross-cutting states remain per-area work. [Evidence](evidence/window-damage/validation.md) |

## Evidence and validation ledger

No entire feature area has been declared fully verified yet. The default native control palette and modal backdrop sub-area has focused scene tests and actual light/dark/restart evidence. Both actual apps now execute. Bootstrap repair: initialize the newly required `Lui_paint.hooks.hidden` field; `Lui_host.set_hidden` supplies the real visibility predicate. Native build and platform/service tests pass; UI suite: **2066 checks, 0 failures**. Evidence and reproduction: sibling `evidence/bootstrap-validation.md`, `master/01-home-light.png`, `native/01-home-light-before.png`. Bootstrap logs distinguish setup failures from product differences. Before/after screenshots and reproduction steps will be linked per completed area, alongside focused tests, actual native verification, and normal pushed commits.
