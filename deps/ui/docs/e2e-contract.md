# Logseq `clj-e2e` Contract Inventory

Branch: `devin/native-ocaml-electron` @ `3360eeb80f` — source: `clj-e2e/` in `logseq/logseq`.

This is the DOM/behavior contract the LUI rewrite must satisfy. The test *logic* is fixed; selectors may only be swapped for class/id equivalents, so every selector below is a hard requirement unless deliberately mapped to an equivalent.

## 0. Suite overview & counts

- **30 test files**, **242 `deftest` vars** under `clj-e2e/test/logseq/e2e/`.
- Runner: Clojure + Playwright (`wally.main`/`wally.repl`) via cognitect test-runner. `bb test` runs namespaces matching `.*\-basic\-test$`; `-n`, `-v`, `-i <meta-tag>` filters.
- App must be built with `DEV-RELEASE` (and `OUTLINER-PERF-LOGGING` for perf-log assertions); CI builds with `{:closure-defines {frontend.config/DEV-RELEASE true}}` (`clj-e2e.yml`).
- Test URL: `http://localhost:<port>/?rtc-test=true` (port default 3002, `bb serve` or shadow-cljs dev-http on 3001). `?rtc-test=true` is a real app flag: `util/rtc-test?` → disables journal virtualization (`rtc-test-without-virtualization?`) — the new UI must honor it.
- CI sharding (`.github/workflows/clj-e2e.yml`): all `*-basic-test` namespaces in 5 shards. RTC extras run separately in `clj-rtc-e2e.yml`, **only when commit message contains "rtc"**.

### Per-file test counts

| File | Tests | File | Tests |
|---|---|---|---|
| editor_basic_test | 72 | view_basic_test | 7 |
| commands_basic_test | 30 | reference_basic_test | 5 |
| outliner_basic_test | 26 | property_config_basic_test | 5 |
| plugins_basic_test | 15 | rtc_extra_part2_test | 5 |
| block_property_basic_test | 14 | right_sidebar_basic_test | 4 |
| query_results_basic_test | 8 | plugins_marketplace_test | 4 |
| graph_navigation_basic_test | 8 | query_builder_basic_test | 4 |
| rtc_extra_test | 7 | property_basic_test | 3 |

| File | Tests |
|---|---|
| tag_basic_test | 3 |
| undo_redo_test | 3 |
| cmdk_scroll_basic_test | 3 |
| graph_test (unit, no browser) | 3 |
| assets_basic_test | 2 |
| library_basic_test | 2 |
| property_scoped_choices_test | 2 |
| bidirectional_properties_test | 1 |
| export_basic_test | 1 |
| flashcards_basic_test | 1 |
| import_basic_test | 1 |
| left_sidebar_basic_test | 1 |
| multi_tabs_basic_test | 1 |
| rtc_basic_test | 1 |

Per-area grouping of test *files*: editor/outliner 4 (editor, outliner, undo_redo, reference); properties/tags 4 (block_property, property_basic, property_config, property_scoped_choices, bidirectional → 5); queries/views 4 (commands, query_results, query_builder, view); graph/infra 3 (graph_navigation, graph_test, multi_tabs); rtc 3; plugins 2; sidebars 2 (left, right); page-level features 6 (tag, library, export, import, assets, flashcards); cmdk 1.

---

## 1. Fixtures & helpers contract (`clj-e2e/src/logseq/e2e/`)

### fixtures.clj
- **`open-page`** (once fixture): creates Playwright browser/page headless (config-driven), grants `clipboard-read`/`clipboard-write`, adds init script `localStorage.setItem('preferred-language','"en"'); localStorage.setItem('developer-mode','"true"')`, navigates to `?rtc-test=true`, runs `developer-mode` setup and `refresh-test-env!` (refresh + `assert-graph-loaded?` + polls `document.documentElement.lang === "en"` and localStorage values), attaches console-message listener (log buffer consumed by tests for `:db-worker/outliner-op-perf` entries).
- **`new-logseq-page`** (each): closes `.cp__right-sidebar.open` via `.toggle-right-sidebar` if open; strips `virtualized` URL param via `history.replaceState`; `create-page` → `page/new-page` (cmdk → "Create page called 'x'").
- **`validate-graph`** (each): cmdk "(Dev) Validate current graph" → waits `.ui__toast:has-text('Your graph is valid')`, dismisses `.ui__toast.success button`.
- **`open-2-pages`** / **`open-new-context`**: two/three Playwright pages (`*page1`/`*page2`, `*pw-ctx*`) sharing a browser context — multi-tab/multi-client tests.
- **`prepare-rtc-graph-fixture`**: `login-test-account` on both pages, `new-graph` with sync on p1, `wait-for-remote-graph` + `switch-graph` on p2, cleanup `remove-remote-graph`.
- **`new-logseq-page-in-rtc*`**: creates page on p1 inside `with-wait-tx-updated`, waits `wait-tx-update-to` on p2, `goto-page`.

### util.clj / block.clj / assert.clj
- `editor-q` = `.editor-wrapper textarea` — the block editor is a textarea inside `.editor-wrapper`; `assert-editor-mode` = editor-q visible; `assert-in-normal-mode?` = `[data-testid='block editor']` absent (kept `[datatestid=...]` typo variant), `.selection-action-bar` hidden, `#search-button` visible.
- `assert-graph-loaded?` = `getByTestId("page title")` visible — **the primary app-ready marker**.
- `search-and-click`: `#search-button` → `.cp__cmdk-search-input` → types → clicks `a.menu-link.chosen` / result `data-testid` matching the label text; ~400ms debounce settle.
- `input-command`: types `/` in editor → waits `.ui__popover-content` → clicks `a.menu-link.chosen`.
- `set-tag`: types ` #tag` → clicks `a.menu-link:has-text(tag)` → asserts `.block-tag :text(tag)`.
- `goto-journals` = cmdk action "Go to journals".
- `login-test-account`: `localStorage.setItem("login-enabled", true)` → `.toolbar-dots-btn` → `div:text("Login")` → username/password inputs → `.cp__user-login button[type="submit"]`; creds `e2etest`/`Logseq-e2e`.
- `toggle-property` (block.clj): `ControlOrMeta+p` → `.ls-property-dialog .cp__select-input` → `#ac-0.menu-link:has-text(name)`.
- `select-blocks` = Shift+ArrowUp N times; copy/paste via `ControlOrMeta+c/v`; plain copy `ControlOrMeta+Shift+c`.
- `exit-edit`, `move-cursor-to-end`, `press-seq`, `double-esc`, `refresh-until-graph-loaded`, `wait-timeout`, `count-elements`, `get-page-blocks-contents` (reads `.block-content` texts).
- locator.clj: `filter/or/and` wrappers around Playwright locators (`:has-text`, `:text-is`, regex).

### graph.clj / page.clj / rtc.clj
- Graph mgmt: `.new-graph` dialog `h2:text("Create a new graph")`, `input[placeholder="your graph name"]`, `button:not([disabled]):text("Submit")`; `button#rtc-sync`, `button#rtc-graph-e2ee`; `div[data-testid='logseq_db_<name>']` row, `.graph-action-btn`, `.delete-local-graph-menu-item`, `.delete-remote-graph-menu-item`, `div[role='alertdialog'] button:text('Confirm')`; cmdk "Add a DB graph"; `button:not([disabled]):has-text("Refresh")`; e2ee modal `.e2ee-password-modal-content` with `input[placeholder="Enter password"]`, `input[placeholder="Enter password again"]`, `.ls-toggle-password-input input`, `button:text("Submit")`; `button.cloud.on.idle` = sync-idle marker.
- Page: `div[data-testid='page title'] .block-title-wrap`; cmdk `.search-results > div` with `Create page called '<title>'`; page menu `.toolbar-dots-btn` → `[role='menuitem'] div:text('Delete page')` → `div[role='alertdialog'] button:text('Confirm')`; rename via clicking `div[data-testid='page title']`; convert-to-tag via right-click on page title → `[role='menuitem']` "convert to tag" → `.ls-page-icon`; tag extends via `.property-value` "root tag" → `.ui__dropdown-menu-content a.menu-link`.
- RTC: `get-by-test-id "rtc-tx"` renders EDN `{:local-tx N :remote-tx N}`; `with-wait-tx-updated` waits local==remote and > prior; cmdk "(Dev) RTC Start"/"(Dev) RTC Stop"; `validate-graphs-in-2-pw-pages` compares `:blocks :pages :classes :properties` via API.

### custom_report.clj
- On failure/error dumps screenshots + console logs to `clj-e2e/e2e-dump/`; `*preserve-graph*` flag.

---

## 2. JS / environment hooks the app must expose

- **`window.logseq.api.*` / `logseq.sdk.*`** (plugin API, via `ls-api-call!` → snake_case):
  `editor.getBlock`, `getPage`, `getCurrentPage`, `createPage`, `deletePage`, `createJournalPage`, `getPageBlocksTree`, `getPageProperties`, `insertBlock`, `insertBatchBlock`, `appendBlockInPage`, `updateBlock`, `removeBlock`, `getBlockProperty`, `getBlockProperties`, `upsertBlockProperty`, `removeBlockProperty`, `upsertProperty`, `getProperty`, `removeProperty`, `exitEditingMode`, `openInRightSidebar`, `createTag`, `getTag`, `getTagsByName`, `get_all_tags`, `get_all_properties`, `get_tag_objects`, `addTagExtends`, `setPropertyNodeTags`;
  `app.pushState`, `app.setCurrentGraphConfigs`, `app.getCurrentGraphConfigs`, `app.getCurrentGraph`, `app.get_selected_blocks`, `app.set_theme_mode`, `app.set_state_from_store` (e.g. `['ui/system-theme?']`, `['ui/radix-color']`);
  `ui.showMsg`, `ui.close_msg`/`closeMsg`.
- **localStorage**: `preferred-language` (`"en"`), `developer-mode` (`"true"`), `login-enabled`.
- **document.documentElement**: `lang === 'en'`; `dataset.theme` (`dark`), `dataset.color` (`none`).
- **URL contract**: `?rtc-test=true`, `?virtualized=true`, `?graph-id=`, hash routes `#/page/<uuid>`, `#/block/<uuid>` (direct deep links must resolve; "Page not found" text on miss); `window.location.hash` contains block uuid when zoomed into a block.
- **Other window/DOM hooks**: `window.pswp?.opener?.isOpen` (PhotoSwipe); `window.__e2eEditExitFrames` (test-injected probe); `navigator.clipboard` (Playwright clipboard perms); native `DragEvent`/`DataTransfer`/`ClipboardEvent`/`PointerEvent` dispatch; file `onFileChooser` for asset upload; `page.waitForDownload` for exports.
- **Console-log contract** (tests read console): lines containing `:db-worker/outliner-op-perf` with `:op-names` such as `[:insert-blocks]`, `[:save-block :insert-blocks]`, `[:delete-blocks]`; must NOT emit "DB worker API failed", "Missing renderer resource entity", "Unsupported view resource row", "Invalid renderer resource UUID", `db-sync/checksum-mismatch`, `db-sync/tx-rejected`, `db-sync/apply-remote-txs-failed`.
- **Computed-style contract** (asserted via `getComputedStyle`): `cursor:pointer` on context-menu controls; ring `box-shadow` on color hover; `scrollbar-color` on `#main-content-container` = `--ls-primary-background-color`; equal backgrounds on `.cp__right-sidebar-topbar`/`.cp__right-sidebar-inner`; `overflow-y:visible`/`auto` on `.cp__right-sidebar-scrollable`/`.sidebar-item-list`; measured margins on `.journal-item`; `.block-title-wrap` x-offsets for indent checks.

### Keyboard contract (Playwright key strings)
`ControlOrMeta+k` cmdk, `ControlOrMeta+Shift+f` favorite, `ControlOrMeta+p` / `Control+Alt+p` mod-p property dialog, `ControlOrMeta+Shift+m` move blocks, `Meta+e`/`Control+Alt+e` quick add, `Meta+Shift+.`/`Alt+ArrowRight` zoom in, `Meta/Alt+Shift+ArrowUp/Down` move block, `Shift+ArrowUp/Down` select, `ControlOrMeta+a/c/v/x/z/y`, `ControlOrMeta+Shift+c` plain copy, `ControlOrMeta+b/i` bold/italic, `ControlOrMeta+Shift+h` highlight, `Tab`/`Shift+Tab` indent/outdent, `Enter`/`Shift+Enter`, `Home`, `ArrowUp/Down`, `Escape`, `Backspace`, `Delete`, `Control+e` (open block editor on selected), `ControlOrMeta+ArrowDown` (expand cmdk group).

---

## 3. Selector inventory — the DOM contract

Selectors are grouped by feature area. `:`-suffixes denote text filters (`:text()`, `:has-text()`, `:text-is()`); `[role=...]` are ARIA requirements.

### 3.1 Editor / outliner
- Structure: `.ls-page-blocks`, `.page-blocks-inner`, `.ls-block` (+ `.selected`, `.is-comments-area`, `[data-block-title='<title>']`, `[blockid='<uuid>']` attr), `.block-content`, `.block-content-wrapper`, `.block-title-wrap` (+ `h1..h6`/`.as-heading` variants, `span.block-title-wrap`), `.block-main-container`, `.block-control`, `.block-add-button` (+ `:disabled` while restoring), `.bullet-container`, `.bullet-closed`, `.editor-wrapper textarea`.
- Per-block ids: `#ls-block-<uuid>`, `#block-content-<uuid>`, `#control-<uuid>`, `#dot-<uuid>` (dot click zooms: location.hash gains uuid).
- Selection/editing: `.selection-action-bar`, `.editor-wrapper textarea:focus`, `.ls-block.selected`, `.property-block-container` (+ `.jtrigger`), `.embed-block`.
- Rich content: `.extensions__code`, `.CodeMirror` / `.cm-editor`, `pre.CodeMirror-line`, `.katex`, `div[data-node-type='quote']`, `span.typed-list`, `span.cloze` / `.cloze-revealed`, `div.extensions__code-calc-output-line`, `.ls-datetime a.page-ref`, `a.page-ref`, `.page-reference .page-ref`, `a.tag`, `#embed-test` iframe.
- Context menus: `.ls-context-menu-content`, `button[title='Auto heading']`, `[role='menuitem']` texts `Add comment`, `Add reaction`, `Delete image`, `convert to tag`, `Convert Tag to Page`, `Delete page`, `Recycle`, `Unfavorite page`, `Add to Favorites`, `Available choices`, `Add choice`, `Set as default choice`, `Default value`, `Delete property from node`, `Hide for #<tag>`, `Open as page`, `Add tag property`, `Rename`, `Delete`, `Sort ascending`, `Sort descending`, `Is Not Empty`, `Import`, `Export graph`, `Login`; `div[role='menuitem'].del`; `[role='menuitemcheckbox']` + `[aria-checked]` for "Tasks"/"Assets"/"Columns visibility"/"Group by"/"Sort groups by"/"Sort groups order"/"Status"/"Page name"/"Descending"; `a.menu-link`, `a.menu-link.chosen`, `#ac-0`, `#ui__ac-inner`; `.ui__popover-content`, `.ui__dropdown-menu-content`, `.ui__dropdown-menu-item`, `.ui__context-menu-content`.
- Comments: `.ls-comments-area`, `.ls-comment-add textarea`, `.ls-comment-submit`, `.ls-comment-row` (+ `button[aria-label='Click to edit']`, `button[title='Delete']`, `button[title='Add reaction']`), `.ls-comment-actions`, `.ls-comment-reply-placeholder`, `.ls-comments-list`, `.ls-comments-label`, `.ls-comments-title-editor textarea`, `.block-tags`.
- Reactions/icons: `.ls-block-reactions`, `em-emoji[id='+1'|'heart'|'books']`, `.ls-icon-picker` (+ `input`), `.cp__emoji-icon-picker input`/`button:has(em-emoji)`/`button[data-action='del']`, `button:text('Add icon')`, `.ls-icon-file`, `.ls-icon-*` (`.ls-icon-Todo`, `InProgress50`, `InReview`, `Cancelled`, `Backlog`, `Done`, `priorityLvl<Low|Medium|High|Urgent>`, `line-dashed`, `list`, `table`, `layout-grid`, `trash`, `x`, `search`), `.ui__icon`.
- Assets: `.asset-container` (+ `img[src]` with nonzero `naturalWidth`), `.asset-action-bar button`, `.ls-resize-image`, `.image-resize.handle-right`, `.pswp.pswp--open`, `[getByLabel="Close"]`, `window.pswp`.
- Scroll containers: `#app-container-wrapper`, `#main-content-container`, `[data-virtuoso-scroller]`, `[data-index]`, `.ls-view-body`, `.cp__page-inner-wrap`.
- Misc: `.ui__toast` (+ `.success`, `.error`, `.warning`, `.ui__toast-close`) positioned top-right; `.ui__loading`, `.loading-graph`; `.breadcrumb`.

### 3.2 Left sidebar
`#left-menu` (toggle), `#left-sidebar.is-open`, `.sidebar-header-container`, `.sidebar-content-group .hd`, `.as-edit` (edit nav filter), `.sidebar-navigations .tasks` / `.assets` (nav links to Task/Asset pages), `.favorites .favorite-item`, `.recent .recent-item`, `.flashcards-nav` (+ `.flashcards-nav a`), `.toolbar-plugins-manager-trigger`, `.toolbar-dots-btn`.

### 3.3 Right sidebar
`.toggle-right-sidebar` (opens/closes), `.cp__right-sidebar.open`, `.cp__right-sidebar-topbar`, `.cp__right-sidebar-inner`, `.cp__right-sidebar-scrollable`, `.sidebar-item` (+ `.item-type-contents`), `.sidebar-item-list`, `.sidebar-item-header .breadcrumb`, `[data-testid='sidebar-item-more']`, `.cp__right-sidebar .page-title em-emoji`; blocks mount by uuid in sidebar (`#ls-block-<uuid>` count = 2 across main+sidebar).

### 3.4 Command palette (cmdk) & search
`#search-button`, `.cp__cmdk`, `.cp__cmdk-search-input`, `.cp__cmdk .overflow-y-auto` (scroller), `.search-results > div`, `[data-kb-highlighted]` (exactly 1, kept in viewport while scrolling), `.transition-colors.cursor-pointer` (highlighted row classes), result items keyed by `data-testid` = label text and `data-testid^='<page-name>'` prefix matches; named actions: `Create page called '<t>'`, `Go to journals`, `Add a DB graph`, `(Dev) Validate current graph`, `(Dev) RTC Start`, `(Dev) RTC Stop`, `Move blocks`, `Go to all graphs`, `Search`; lazy results expose `data-item-index`; `input[placeholder="Move blocks to"]` (move-blocks dialog); block results render `.breadcrumb`.

### 3.5 Properties
`.ls-property-dialog` (+ ` .cp__select-input`, ` .cp__select-results`, ` :text('Empty')` absent), `#ac-0.menu-link`, `.cp__select-results a.menu-link.chosen strong`, `input[placeholder='Set <name>']`, `input[placeholder='Set Alias']`, `input[placeholder='title']`, `input[placeholder='Add or change property']`, `button:text('Set property')`, `button:has-text('Add tag property')`, `button:has-text('Save')`, `button[title='More settings']`, `.property-pair` (+ `:has-text(name) > .ls-block`), `.property-k` (click opens `[role='menuitem']` config menu), `.property-value` (+ `.property-value-inner`, `.property-value-container .jtrigger`), `.property-select` `:text-is()`, `.ls-page-properties`, `.multi-values.jtrigger`, `.bottom-property-pill`, `.bottom-property-content`, `.positioned-properties.block-left`, `.ls-property-dropdown` ("Multiple values"/"Property type"), `.ls-property-choices-sub-pane .choices-list` (scrollable), `.ls-property-default-value-pane` ("Set default value"), `.ls-bidirectional-properties`, `.ls-new-property` ("Add property"), `button[role='checkbox'][data-checked]`; texts "Select a property type", "New option:", "Skip choosing tag"; toasts `.ui__toast.error` for invalid name; hidden `#` column on property table.

#### Properties — reverse-engineered behaviors (LUI implementation notes)
- Worker `entity-of-arg` rejects a bare `Uuid` wire arg — every endpoint arg that is an entity ref must be a `[:block/uuid <uuid>]` lookup-ref (`Wire.List [Keyword "block/uuid"; Uuid ...]`), or the endpoint returns `Nil` (silent empty rows).
- `upsert-property` schema keys are `logseq.property/type` and `db/cardinality` (values `one`|`many` or `db.cardinality/*`); bare `"type"`/`"cardinality"` keys are silently ignored.
- Invalid property names (`[[bad`, `#bad`, empty) are NOT rejected client-side — the name flows through type-select and the worker's `upsert-property` raises an `Outliner_validate.Notification` broadcast which renders as `.ui__toast.error` ("Property failed to create." / "invalid property name").
- Overlay/popup mounting must target `document.body`; `.cp__overlays` is owned by LUI and its children are wiped on each render.
- `.page-inner` children are replaced wholesale on page re-render — the MutationObserver in `properties_view` must re-mount `.ls-properties-area`/`.ls-bidirectional-properties` whenever they go missing.
- The type-select step renders "Select a property type" as visible placeholder text (asserted via `get-by-text`), not only as an input placeholder attr.
- `.multi-values.jtrigger` is the multi-cardinality node/ref cell and must be focusable (`tabindex=0`) and open its value select on `Enter` (editor_basic_test presses Enter on it).
- `ui-position` rows split three ways: `block-left` chips (`.positioned-properties.block-left > .property-value-inner` inside `.block-main-content`), `block-below` pills (`.bottom-property-pill` in `.positioned-properties.block-below` inside `.ls-block-content-indent`), and panel rows.
- `get-property-values` only reads `property-ident`/`view-id`/`query-entity-ids` from args — the block arg is ignored.

### 3.6 Tags & Library
`.block-tag`, `a.tag`, `.ls-page-icon`, `.ls-page-icon button`, `.cp__emoji-icon-picker`, `div[data-testid='page title'] :text('Tag')`, `.ls-view-body` (tag objects view); Library page content in `.ls-page-blocks` with `.block-title-wrap` rows only (no block bodies), `.page-blocks-inner .ls-new-property` absent, sibling alignment by `.block-title-wrap` x-coords.

### 3.7 Queries & views
`.custom-query-results`, `.ls-query-setting`, `button:text('filter')`, `.cp__query-builder .query-clause`, `.query-builder-picker .cp__select-input`, `div:text('Live query (n)')`, `li` scalar results, `.ls-table-header-cell` ("Created At"/"Updated At"/"File"; NOT "#"/"checksum"), `.ls-table-row`, `[data-table-row-select]`, `.ls-table-actions` (+ `.selection-count`, `button:has(.ls-icon-trash)`), `.views button[title='Add new view']`, `.views > button` ("New view", "All", title), `.view-action-type`, `.view-action-search input`, `.filters-row` (+ `button:has(.ls-icon-x)`), `input[placeholder='Type to search']`, `.cp__select-input[placeholder='Status']`, `.ls-all-pages`, `.ls-card-item`, `.ls-foldable-title-control`, `.ls-foldable-content[aria-hidden]`, `.unlinked-references` (+ `button:has(.ls-icon-search)`), `.references`, `.references .ls-block .block-title-wrap`; menu texts "Export EDN" → toast "Copied view nodes"; texts "No matched result", "Show built-in properties"; `.ui__dialog-content`, `#modal-headline`.

### 3.8 Journals & dates
`#journals`, `.journal-item` (measured margins), `.journal-item-placeholder`, `#journals .references .ls-foldable-content[aria-hidden]`, `[data-index]` virtualization rows, `.ui__calendar [role='gridcell'] button`, `.ls-date-month-select`, `.ls-date-month-option`, `.ls-datetime a.page-ref` ("Today"), `.is-today-page`, `a.button[data-on-click=goToToday]` (plugin-injected journal button), `.ls-dialog-quick-add` + "Add to today" button (quick-add, `Meta+e`/`Control+Alt+e`).

### 3.9 Graphs, sync & login
`.new-graph` dialog (`h2:text("Create a new graph")`, `input[placeholder="your graph name"]`, `button:not([disabled]):text("Submit")`, `button#rtc-sync`, `button#rtc-graph-e2ee`), `div[data-testid='logseq_db_<name>']`, `.graph-action-btn`, `.delete-local-graph-menu-item`, `.delete-remote-graph-menu-item`, `div[role='alertdialog'] button:text('Confirm')`, "Last opened at:" text, `button:not([disabled]):has-text("Refresh")`, `.ui__toast.warning` ("Graph name can't contain"), `.ui__toast.error` ("already exists"), `.e2ee-password-modal-content` (`input[placeholder="Enter password"]`, `input[placeholder="Enter password again"]`, `.ls-toggle-password-input input`, `button:text("Submit")`), `button.cloud.on.idle`, `[data-testid='rtc-tx']`, `.cp__user-login` (`input[name='username']`/`[name='password']`, `button[type="submit"]`), `div:text("Login")`, `localStorage "login-enabled"`.
Graph view: `#global-graph.graph-root`, `[role='application'][aria-label='Graph canvas']`, `.graph-settings-toggle`, `.graph-mode-tab` (+ `[aria-selected='true']`, tabs "Tags"/"All pages"), `.graph-error`, `.graph-node, [data-node-id]`, `button[title*='Time']`/`button:has-text('Time travel')`, `input[type='range']`, `.graph-time-travel-reset[title='Now']`, `.graph-time-travel-label`.

### 3.10 Plugins
`.cp__plugins-page`, tabs `button:has-text('Plugins'|'Marketplace'|'Installed'|'Themes')`, `.cp__plugins-marketplace-cnt`, `.cp__plugins-item-card` (+ `h3`, `.ctl a.btn` "Install"/"Installed", `.disabled`), `.cp__plugins-installed`, `input[placeholder*='Search']`, `button[role='switch'][aria-checked]`, `.toolbar-plugins-manager-trigger`, `a.button[data-on-click=goToToday]`; plugin API surface = all `window.logseq.api` calls in §2; idents `:plugin.property._test_plugin/*`, `:plugin.class._test_plugin/*`, built-ins `:logseq.class/Template|Query|Math-block|Task|Code-block|Card|Quote-block|Cards|Page|Tag`.

### 3.11 Flashcards
`.flashcards-nav a` (left sidebar), `#cards-modal`, `#card-answers`, `#card-good`, `#ls-cards-add`, `#cards-modal [role='combobox']`, `[role='option']` (query text shown, no uuids), `#cards-modal .ls-card`, `#cards-modal .text-sm.opacity-50` ("1/1", "1/2"), `.card-rating-loading`, `.ls-block .tag:has-text('Cards')`.

### 3.12 Import / export & settings
`.importer`, `#import-sqlite-db`, `#import-sqlite-zip`, `#import-file-graph`, `#import-debug-transit`, `#import-db-edn` (file inputs), `#modal-headline`, `.form-input`, `.export a` ("Export EDN file"/"Export as standard Markdown"/"Export debug transit file"/"Export both SQLite DB and assets"/"Export SQLite DB") via `waitForDownload`; settings `.cp__theme-modes-options > li > i` (3 theme previews), `.ui__select-trigger .ui__select-icon svg`, `.cp__user-login`, recycle `.ls-recycle-page-content section > div > div`; `.ui__dialog-content`.

---

## 4. Per-test inventory (242 tests)

### editor_basic_test.clj (72)
- `recycle-restore-removes-row-immediately-test` — recycle bin row removal on restore.
- `recycle-delete-removes-row-and-recent-entry-test` — delete from recycle + recents.
- `block-context-menu-clickable-controls-use-pointer-test` — menu items `cursor:pointer`.
- `block-context-menu-color-hover-shows-ring-test` — color picker hover ring.
- `notification-appears-at-top-right-test` — `.ui__toast` top-right placement.
- `favorites-and-recents-load-after-refresh-test` — left sidebar favorite/recent persistence.
- `favorite-menu-and-sidebar-follow-page-updates-test` — favorite/rename sync across UI.
- `page-alias-can-be-added-and-removed-from-the-property-picker-test` — alias property editing.
- `theme-preview-images-load-test` — theme picker previews.
- `language-select-shows-dropdown-indicator-test` — select chevron icon.
- `main-scrollbar-track-uses-main-background-test` — scrollbar CSS var.
- `click-rendered-block-focuses-editor` — clicking rendered block enters edit mode.
- `multiline-heading-keeps-bullet-on-first-line` — heading block bullet layout.
- `copy-blocks-selected-after-fast-scroll-virtualized-list` — virtualized scroll selection.
- `journals-list-uses-measured-spacing-without-item-margins` — journal spacing.
- `journals-list-does-not-nest-virtualized-scrollers-in-long-journal` — single scroller.
- `journals-list-rows-hold-no-pin-once-content-is-in` — journal placeholder release.
- `journals-list-remounts-complete-long-journal-with-one-scroller` — remount.
- `journals-linked-refs-remain-visible` — linked refs visibility.
- `consecutive-enter-keeps-text-and-cursor-on-the-new-block` — Enter split.
- `enter-delete-keeps-text-and-cursor-on-the-previous-block` — Enter+Delete merge.
- `parent-and-child-rapid-edits-keep-the-latest-child-title` — rapid edit race.
- `page-level-node-reference-renders-linked-references` — linked references render.
- `consecutive-enter-and-delete-ops-complete-without-worker-errors` — op-perf log check.
- `backspace-at-start-removes-pending-block-dom-test` — pending block cleanup.
- `today-queries-render-without-resource-errors` — today query on journal.
- `drag-and-drop-asset-does-not-create-blank-asset` — file drop creates asset.
- `toggle-between-page-and-block` — page/block ref toggle.
- `toggle-between-page-and-block-for-selected-blocks` — multi-select toggle.
- `disallow-adding-page-tag-to-normal-pages` — #Page tag restriction.
- `move-blocks-mod+shift+m` — move-blocks via hotkey.
- `move-blocks-cmdk` — move blocks via cmdk.
- `move-editing-block-cmdk` — move the block under edit.
- `shift-open-page-in-sidebar` — Shift+click opens right sidebar.
- `shift-click-page-title-opens-in-sidebar` — same on page title.
- `cmdk-block-results-render-breadcrumbs-test` — cmdk block breadcrumbs.
- `comments-update-and-title-edit` — block comments lifecycle.
- `first-comment-actions-stay-inside-scroll-container` — comment menu clipping.
- `move-pages-to-library` — Library move.
- `create-nested-pages-in-library` — nested Library pages.
- `page-icon-in-library` — page icons in Library.
- `editor-exit-and-unicode-persistence-test` — unicode save/exit.
- `empty-enter-and-soft-line-break-test` — Shift+Enter soft break.
- `cursor-boundaries-word-motion-and-kill-test` — word navigation/deletion.
- `text-format-shortcuts-and-source-roundtrip-test` — bold/italic/highlight.
- `escape-save-never-paints-stale-block-content-test` — no stale paint after Esc.
- `new-page-reference-renders-on-the-first-frame-after-save-test` — first-frame ref render.
- `saved-page-reference-reopens-with-page-title-test` — ref reopen.
- `page-and-tag-autocomplete-test` — `[[`/`#` autocomplete.
- `slash-menu-filter-scroll-and-cleanup-test` — `/` menu filtering.
- `task-date-and-priority-slash-lifecycle-test` — slash status/priority/date.
- `virtualized-late-editor-and-code-editor-test` — late-mounted editor in virtual list.
- `multi-selection-indent-roundtrip-test` — shift-select + indent.
- `collapse-single-multiple-and-sidebar-test` — collapse/expand bullets.
- `collapsed-subtree-stays-collapsed-after-bullet-zoom-back-test` — zoom-out collapse persist.
- `selection-direction-and-hierarchical-select-all-test` — select-all hierarchy.
- `structured-and-plain-text-copy-test` — copy formats.
- `plain-multiline-and-html-paste-test` — paste formats.
- `mixed-height-virtual-page-keeps-blocks-separated-test` — virtual layout.
- `journals-consecutive-input-test` — consecutive journal typing.
- `worker-missing-read-is-recoverable-test` — worker read recovery.
- `enter-splits-block-at-cursor-test` — mid-text Enter.
- `node-reference-autocomplete-test` — `[[` node refs (`((` is deprecated).
- `quick-add-moves-all-blocks-to-today-test` — quick-add dialog.
- `external-property-update-preserves-edit-buffer-test` — external update vs edit buffer.
- `operation-completion-restores-mounted-focus-test` — focus restore after ops.
- `arrow-up-down-move-the-caret-inside-a-block-test` — caret motion.
- `shift-arrow-up-selects-inside-a-block-test` — shift-select in text.
- `heading-editor-shows-every-row-test` — heading editor rows.
- `page-ref-navigate-persists-unsaved-edit-buffer-test` — unsaved buffer survives nav.
- `shift-click-select-persists-unsaved-edit-buffer-test` — unsaved buffer survives shift-click.
- `page-ref-navigate-persists-edit-buffer-with-open-popup-test` — buffer survives nav with popup open.

### outliner_basic_test.clj (26)
- `focused-root-block-cannot-indent-or-move-test` — focused-root indent/move no-ops.
- `create-test-page-and-insert-blocks-test` — create page + insert blocks.
- `indent-and-outdent-test` — Tab/Shift+Tab.
- `indent-outdent-embed-page-test` — indent blocks inside page embed.
- `indent-into-collapsed-block-expands-it-test` — auto-expand collapsed parent.
- `indent-into-collapsed-block-on-journals-expands-it-test` — same on journals.
- `indent-selected-block-into-collapsed-block-expands-it-test` — selected variant.
- `enter-then-tab-on-collapsed-block-expands-it-test` — Enter+Tab expand.
- `move-up-down-test` — Alt+Shift+Up/Down.
- `delete-test` — Backspace delete.
- `delete-end-test` — Delete forward.
- `delete-test-with-children-test` — delete w/ children.
- `delete-concat-test-2-blocks` — Backspace merge 2 blocks.
- `delete-concat-test-3-blocks` — merge 3 blocks.
- `delete-concat-test-with-children` — merge into children.
- `delete-concat-test-with-tag` — merge preserving tags.
- `backspace-empty-first-child-keeps-empty-parent-subtree-test` — subtree keep.
- `backspace-at-parent-start-keeps-children-test` — children keep on merge.
- `consecutive-backspace-does-not-restore-deleted-blocks-test` — no resurrect.
- `held-backspace-does-not-duplicate-merged-content-test` — held Backspace.
- `rapid-retype-before-enter-keeps-the-edit-test` — fast typing.
- `boundary-delete-and-backspace-merge-contract-test` — boundary merge.
- `drag-reorders-once-and-is-undoable-test` — bullet drag reorder + undo.
- `drag-indents-and-outdents-test` — drag indent/outdent.
- `drag-rejects-parent-into-descendant-test` — cycle reject.
- `undo-history-is-scoped-to-current-graph-test` — undo scope.

### commands_basic_test.clj (30)
- `command-trigger-test` — `/` command trigger.
- `slash-command-arrow-scroll-test` — slash menu arrow scroll.
- `page-reference-test` — `[[page]]`.
- `block-reference-test` — `[[uuid]]` block ref.
- `link-test` — markdown link.
- `link-image-test` — image link.
- `underline-test` — underline markup.
- `code-block-test` — `/code` block + CodeMirror.
- `math-block-test` — KaTeX render.
- `quote-test` — quote block.
- `quote-heading-test` — quote with heading.
- `headings-test` — h1–h6 cycle.
- `clear-heading-test` — clear heading.
- `status-test` — task status icons.
- `priority-test` — priority icons.
- `scheduled-deadline-test` — scheduled/deadline dates.
- `date-command-keyboard-navigation-test` — date picker arrows.
- `date-picker-month-select-test` — month dropdown.
- `date-time-test` — date-time picker (time part FIXME-commented).
- `number-list-test` — numbered list.
- `number-children-test` — numbered children.
- `query-test` — `{{query}}` render.
- `query-view-membership-updates-live` — live query update.
- `advanced-query-test` — advanced query.
- `calculator-test` — calc extension output.
- `template-test` — template insert.
- `embed-html-test` — html embed.
- `embed-video-test` — video embed (external iframe).
- `embed-tweet-test` — tweet embed (external iframe).
- `cloze-test` — cloze reveal.

### block_property_basic_test.clj (14)
- `references-embeds-and-mounted-instance-refresh-test` — embeds + mounted refresh.
- `unlinked-reference-filter-and-breadcrumb-test` — unlinked refs filter.
- `flashcard-rating-advances-once-test` — card rating.
- `multi-target-comment-draft-edit-delete-test` — comment CRUD.
- `block-and-comment-reaction-toggle-test` — emoji reactions.
- `icon-and-structural-tag-visibility-test` — icon/tag visibility.
- `property-create-and-name-validation-test` — property create + invalid names.
- `scalar-property-value-validation-test` — scalar validation.
- `property-type-cardinality-and-checkbox-choice-test` — cardinality + checkbox.
- `property-default-description-position-and-hidden-state-test` — property config.
- `property-delete-and-bidirectional-refresh-test` — delete property + bidirectional.
- `tag-inheritance-schema-and-object-view-test` — tag extends schema.
- `tag-template-dynamic-values-test` — tag template values.
- `checkbox-property-toggle-persists-test` — checkbox persistence.

### property_basic_test.clj (3)
- `new-property-test` — create property of each type via "Add property".
- `property-value-lifecycle-and-object-view-persistence-test` — property values + object view.
- `keyboard-highlight-selects-property-test` — mod-p dialog keyboard selection.

### property_config_basic_test.clj (5)
- `property-choices-configuration-and-mod-p-stay-reactive-test` — choices + mod-p.
- `mod-p-creates-and-sets-text-property-test` — mod-p text property.
- `property-table-hides-internal-id-column-test` — hides `#` column.
- `available-choices-list-is-scrollable-test` — scrollable choices.
- `text-property-default-value-can-be-set-from-config-menu-test` — default value pane.

### property_scoped_choices_test.clj (2)
- `tag-scoped-property-choices-test` — per-tag property choices.
- `tag-scoped-property-choices-isolated-test` — choice isolation across tags.

### bidirectional_properties_test.clj (1)
- `bidirectional-properties-test` — reverse refs on bidirectional class.

### tag_basic_test.clj (3)
- `new-tag-test` — create tag via `#`.
- `page-title-tag-autocomplete-test` — tag autocomplete in page title.
- `page-tag-conversion-persists-and-removes-tag-from-objects-test` — tag↔page convert.

### view_basic_test.clj (7)
- `table-row-selection-shows-action-bar-test` — row select + action bar.
- `all-pages-delete-confirm-stays-open-on-pointer-release-test` — delete confirm dialog.
- `view-lifecycle-and-display-type-persistence-test` — list/table/gallery views.
- `table-view-search-filter-and-new-record-actions-test` — filter + new record (right sidebar).
- `table-view-column-visibility-action-test` — column visibility menu.
- `table-view-group-and-export-actions-test` — group + Export EDN.
- `table-view-column-sort-does-not-crash-test` — sort actions.

### query_results_basic_test.clj (8)
- `partial-journal-query-table-list-and-reload-test` — journal query table.
- `partial-query-edit-empty-and-live-update-test` — empty query + live update.
- `scalar-and-multiple-column-query-results-test` — scalar/column results.
- `partial-query-result-transform-test` — result transform.
- `query-set-literals-do-not-create-tags-test` — set literals vs tags.
- `partial-query-uses-requested-columns-test` — custom columns.
- `simple-query-builder-views-and-live-results-test` — query builder views.
- `advanced-query-relative-journal-inputs-test` — relative journal inputs.

### query_builder_basic_test.clj (4)
- `query-builder-task-filter-shows-all-status-choices-test` — status choices.
- `query-builder-priority-filter-shows-all-priority-choices-test` — priority choices.
- `query-builder-property-filter-shows-all-status-choices-test` — property filter.
- `query-builder-task-tag-shows-title-not-uuid-test` — clause shows title.

### reference_basic_test.clj (5)
- `self-reference`, `self-tag-block-reference`, `mutual-reference`, `parent-reference`, `cycle-reference` — copy/paste block refs rendering `[[...]]` backlinks.

### undo_redo_test.clj (3)
- `undo-redo-paste` — undo/redo pasted blocks.
- `undo-latest-saved-block-content-once` — single undo of latest save.
- `cut-and-paste-preserves-multiple-block-trees` — structured cut/paste of nested trees.

### graph_navigation_basic_test.clj (8)
- `graph-empty-state-and-name-validation-test` — all-graphs + name validation toasts.
- `graph-refresh-and-browser-history-test` — refresh + back/forward.
- `direct-page-and-block-route-test` — `#/page/<uuid>` & `#/block/<uuid>` deep links.
- `local-graph-delete-and-list-metadata-test` — delete local graph + "Last opened at:".
- `default-home-route-test` — `default-home` config routing.
- `graph-view-mode-settings-test` — graph view tabs/settings.
- `graph-time-travel-playback-test` — time-travel slider.
- `restoring-graph-gates-and-recovers-interaction-test` — restore blocks input.

### left_sidebar_basic_test.clj (1)
- `selected-class-navigations-survive-graph-lifecycle-test` — Tasks/Assets nav items persist across reload/graph switch.

### right_sidebar_basic_test.clj (4)
- `right-sidebar-topbar-uses-dark-neutral-background` — computed bg match.
- `right-sidebar-uses-only-content-scrollbar` — overflow contract.
- `same-block-updates-in-main-and-right-sidebar` — dual-mounted uuid sync.
- `contents-open-as-page-navigates-to-contents` — Contents → Open as page.

### library_basic_test.clj (2)
- `library-hides-normal-blocks-and-collapses-child-pages` — Library page listing.
- `library-enter-on-page-creates-sibling` — Enter sibling vs child.

### assets_basic_test.clj (2)
- `image-upload-lightbox-and-resize-test` — upload via file chooser, PhotoSwipe, resize handle, Asset tag view.
- `image-action-menu-delete-test` — asset action menu delete + confirm.

### flashcards_basic_test.clj (1)
- `flashcards-plus-and-switching-test` — cards modal, card-set combobox, counters, query labeling.

### export_basic_test.clj (1)
- `graph-export-downloads-browser-artifacts-test` — EDN/Markdown/transit/DB+assets zip downloads.

### import_basic_test.clj (1)
- `import-options-and-invalid-edn-preserve-current-graph-test` — import sources + atomic failure.

### cmdk_scroll_basic_test.clj (3)
- `cmdk-keeps-results-visible-while-searching` — results stay rendered while typing.
- `cmdk-highlight-mode-switching` — keyboard/mouse highlight switch.
- `cmdk-lazy-visible-keyboard-scroll` — lazy results + arrow-key scroll-in-view.

### plugins_basic_test.clj (15)
`editor-apis-test`, `append-block-in-page-stays-at-page-root-test`, `block-properties-test`, `property-upsert-test`, `property-related-test`, `insert-block-with-properties`, `update-block-with-properties`, `insert-batch-blocks-test`, `create-page-test`, `get-all-tags-test`, `get-all-properties-test`, `get-tag-objects-test`, `create-and-get-tag-test`, `get-tags-by-name-test`, `set-property-node-tags` — all exercise the `window.logseq.api` plugin surface (§2) plus plugin-namespaced property/tag idents.

### plugins_marketplace_test.clj (4)
- `marketplace-tabs-search-and-state-test` — plugins page tabs/search/toggles.
- `install-plugin-from-marketplace` — install "Journals calendar" (real registry).
- `plugin-command-registration-follows-lifecycle-test` — plugin command + `goToToday`.
- `plugin-disable-enable-and-reload-test` — disable/enable/reload states.

### rtc_basic_test.clj (1)
- `rtc-basic-test` — login, create synced graph, wait for remote graph, page add/delete sync, Recycle.

### rtc_extra_test.clj (7)
- `rtc-task-blocks-test` — status×priority matrix sync.
- `rtc-property-test` — property CRUD sync.
- `rtc-property-update-rerenders-mounted-block` — rerender on remote update.
- `rtc-outliner-test` — outliner ops sync.
- `rtc-outliner-conflict-update-test` — indent-vs-delete conflict.
- `rtc-page-test` — page lifecycle sync.
- `long-block-title-test` — long title sync.

### rtc_extra_part2_test.clj (5)
- `online-two-clients-undo-redo-stress-test` — undo/redo storm (env `DB_SYNC_E2E_STRESS_*`).
- `issue-651-block-title-double-transit-encoded-test` — title encoding.
- `paste-multiple-blocks-test` — multi-block paste sync.
- `asset-blocks-validate-after-init-downloaded-test` — asset upload sync.
- `issue-683-paste-large-block-test` — large-text paste (`resources/large_text.txt`).

### multi_tabs_basic_test.clj (1)
- `multi-tabs-test` — 3 tabs same context; edits + graph creation/switch replicate.

### graph_test.clj (3) — pure unit tests, no browser
`maybe-input-e2ee-password-skips-when-cloud-ready-test`, `...-inputs-when-modal-appears-test`, `...-does-not-exit-on-stale-cloud-ready-test` — stub `w/visible?` to check `.e2ee-password-modal-content` / `button.cloud.on.idle` wait-loop semantics in `logseq.e2e.graph`.

---

## 5. Skipped / conditional / external-service notes

- **No `^:skip` metadata anywhere.** `-i <tag>` filtering exists (`^:focus`) but no test sets it.
- **RTC tests** (`rtc_basic`, `rtc_extra`, `rtc_extra_part2`): workflow `clj-rtc-e2e.yml` runs **only when the commit message contains "rtc"**. They require a running Logseq sync/account server plus test account `e2etest`/`Logseq-e2e` (hardcoded in `util.clj`), `?rtc-test=true`, and the `rtc-tx` testid element. `rtc_extra_part2` reads `DB_SYNC_E2E_STRESS_*` env vars for stress tuning.
- **plugins_marketplace_test**: hits the real plugin registry/network; installs "Journals calendar".
- **External iframes**: `embed-video-test` (youtube.com), `embed-tweet-test` (x.com) — external network.
- **graph_test.clj**: pure helper unit tests (no Playwright page).
- **multi_tabs_basic_test**: separate browser context, 3 tabs.
- **Build flags**: `DEV-RELEASE` required; editor tests assert on `OUTLINER-PERF-LOGGING` console output (`:db-worker/outliner-op-perf` `:op-names`).
- **Fixtures**: `open-page` runs once per namespace (shared page within a file); `new-logseq-page` + `validate-graph` run per test — so per-test cost includes a fresh page create + validate roundtrip.
- **Fixture resources**: `clj-e2e/resources/invalid-db-export.edn`, `clj-e2e/resources/large_text.txt`, repo `assets/icon.png`, `assets/splash.png`, `resources/img/logo.png`, `resources/icons/logseq.png`.
- **Known TODOs**: `reference_basic_test` lacks page-reference tests; `commands_basic_test/date-time-test` has a commented-out time assertion (FIXME); `plugins_basic_test` has a commented checkbox-cardinality block; `multi_tabs` notes all-graphs doesn't auto-update across tabs (refresh workaround in test).
- **Coverage gaps**: `bb test` runs only namespaces matching `.*\-basic\-test$`, so `undo_redo_test`, `property_scoped_choices_test`, `bidirectional_properties_test`, `graph_test`, `rtc_extra*` and `plugins_marketplace` are excluded from the default run (rtc extras and marketplace run via explicit `-n` / the separate RTC workflow). In `clj-e2e.yml` CI shards, `left_sidebar_basic_test` is also absent from every shard's namespace list despite matching the `-basic-test` pattern, so it currently does not run in CI. `dev/user.clj` `run-all-basic-test` omits `undo_redo`, `graph_test`, `property_scoped_choices`, `bidirectional_properties`, `plugins_marketplace`, `left_sidebar` too — confirm intended coverage when porting.

---

## 6. Cross-cutting requirements summary

1. **Stable id/testid hooks**: `data-testid` for `page title`, `block editor`, `rtc-tx`, `logseq_db_<name>`, `sidebar-item-more`, plus cmdk result items keyed by label text.
2. **uuid-keyed DOM**: `#ls-block-<uuid>`, `#block-content-<uuid>`, `#control-<uuid>`, `#dot-<uuid>`, `blockid` attr — the same uuid element id may appear twice (main + right sidebar).
3. **Class vocabulary**: `.ls-*`, `.cp__*`, `.ui__*` namespaces are load-bearing, as are `[role=...]` ARIA attrs and `data-*` state flags (`data-kb-highlighted`, `data-checked`, `data-index`, `data-item-index`, `aria-hidden`, `aria-checked`, `aria-selected`, `aria-label`).
4. **Text-content contract**: toasts ("Your graph is valid", "Copied view nodes", "Graph name can't contain", "already exists"), menu labels, placeholders, dialog titles, "New option:", "No matched result", "Page not found", "Last opened at:", "Add to today", counter text `1/1`.
5. **Plugin API surface** on `window.logseq.api` (+ `logseq.sdk`) must keep snake_case names — heavily used for seeding, not just plugin tests.
6. **Console-silence contract**: absence of specific error strings; presence of `:db-worker/outliner-op-perf` logs under perf logging.
7. **Computed styles** are asserted — visual layout details (cursor, scrollbar color, sidebar backgrounds, overflow, journal spacing, indent offsets) are part of the contract, not just DOM shape.

---

## 7. Views worker-data contract (reverse-engineered, db-worker `render_resource.ml`)

Contracts discovered while porting `components/views.cljs` — they are implicit in the cljs wire code and enforced by `require_*` assertions on the worker side.

### `thread-api/get-render-snapshots`
- Request map has **exactly three keys**: `{:blocks [], :children [], :resources [k1 k2 ...]}` — resource entries are the **bare key vectors** (e.g. `[:view-data uuid ctx]`), NOT wrapped as `[:resource k]`.
- At least one of the three lists must be non-empty; limits: blocks ≤1000, children ≤25, resources ≤25; duplicate keys are rejected — dedupe before sending.
- Response: `{:basis-rev n, :slots {[:resource <key>] -> {:watch {:keys set, :all? bool}, :value v}}, :groups {...}}` — read the payload from the slot's `:value`.

### Resource key shapes (`rr` arity)
- `[:views owner feature-type]` (3) — view entities for an owner; owner is a `Uuid` (entity) or non-empty `String` (page name — fails "Missing view owner page" if absent; use `$$$views` for the all-pages owner page).
- `[:view-data view-uuid ctx]` (3) — rows for a view; `ctx` keys ⊆ `{feature-type, sorting, filters, input, group-by-property-ident, initial-row-count, row-offset, query-row-uuids}`; `feature-type` ∈ `{all-pages, class-objects, property-objects, linked-references, unlinked-references, query-result}`; `query-result` **requires** `query-row-uuids`.
- `[:query spec]` (2) — run a `{{query}}`; `spec` requires `:kind` as a **keyword** `:dsl|datalog` (a string kind is rejected) plus `:query`; allowed extra keys: `current-page-title`, `current-block-uuid`, `today-day` (yyyymmdd int), `remove-block-children?`, `result-transform-edn`, dsl `cards?`, datalog `inputs`/`rules`. Unknown keys → rejected.
- `[:page-identity name]` (2) — page-name → uuid lookup (used to resolve journal page uuids).

### `thread-api/get-blocks`
- Args `[repo [{:id <uuid> :opts {:block-metadata? bool}} ...]]`; response is one **wrapper** `{id, block, children?}` per request — callers must unwrap `:block` (a missing block yields `{id}` only).

### `thread-api/apply-outliner-ops`
- Args `[repo [[op-name args...] ...] {..opts}]`; `insert-blocks` takes `[["~#list" [block-maps]] target-uuid {:sibling? bool :keep-uuid? bool :outliner-op :insert-blocks}]`; block-maps use **string keys** (`"block/uuid"`, `"block/title"`, `"block/tags"`, `"block/page"`, `"logseq.property/view-for"`), ref values as `{:block/uuid "~u..."}` maps.

### View entities
- A named view is a block under the `$$$views` page (uuid `~u00000004-1867-9724-0098-000000000000` on a fresh Demo graph) carrying `logseq.property/view-for` (ref → owner entity) + `logseq.property.view/feature-type` (keyword). The UI auto-creates the default "All" view via `insert-blocks` on first visit.
- `[:views owner feature]` returns the *block uuids* of view entities; hydrate them via `get-blocks` and read `block/title`, `logseq.property.view/type` (display type), `logseq.property.table/*` (sorting/filters/hidden/ordered columns), `logseq.property.view/group-by-property`, `sort-groups-*`.

### Mount notes (LUI side)
- `.ls-all-pages` is appended to `.cp__sidebar-main-content` on `Model.All_pages` (page.ml renders an empty `graphs-view` box — TODO there).
- Tag/class pages get `.ls-views-wrap` inserted before `.ls-page-blocks` inside `.page-inner`.
- `{{query ...}}` blocks render a `.custom-query-results` shell (render area); views fills it with `.views-query-inner` (builder + result view).
