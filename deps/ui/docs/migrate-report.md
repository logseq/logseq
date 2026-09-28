# LUI Web UI Migration Report

Tracking the issues encountered while rewriting the Logseq web UI in LUI
(pure OCaml/Melange), to inform future LUI product design.

## Implicit DOM/behavior contracts surfaced by e2e

These were discoverable only by running the suite — they were implicit in the
cljs implementation, not documented anywhere.

### textarea innerText comes from textContent, not `.value`
Playwright `:has-text` and `innerText` on a `<textarea>` read `textContent`,
not `.value`. The cljs React renderer keeps textContent in sync; our adapter
set only `.value`. Fixed by syncing `textContent` in the document input
handler and making adapter `.value` writes skip redundant assignments
(assigning `.value` resets the caret even to an identical string).

**Design note for LUI**: input-like elements need a value/textContent sync
story. A `text` prop on a `textarea` should probably update both.

### `.block-title-wrap` presence during editing
`get-page-blocks-contents` counts `.block-title-wrap` under non-add-button
blocks. While editing, cljs still keeps the `.block-title-wrap` container
(with the editor inside); our initial implementation swapped content for
`.editor-wrapper`, dropping the block from the count. DOM structure around
editing states must preserve the wrapper element.

### Duplicate `.block-title-wrap`
`Render.title` already emits `span.block-title-wrap`; wrapping it again in
`tree.ml` produced nested wraps and doubled content counts. Guard against
component-level wrappers stacking.

### Shift+Arrow at editor boundary must cross into block selection
In cljs, `Shift+ArrowUp` with caret on the first row exits editing and enters
block-selection mode (selects the block); second press extends the selection.
A no-op in editing mode broke `new-blocks` flows that rely on committing and
selecting without an explicit Escape.

### Match-order bugs in key dispatch
`"ArrowUp" when shift` shadows `meta/alt+shift` combinations. Modifier combos
must be ordered most-specific first in any match-based key dispatch.

### Undo restores the DB but the open editor keeps a stale buffer
Worker `apply_history_action` replays inverse outliner ops correctly; the
bug was UI-side: after undo restored a title, the still-mounted textarea
kept showing the pre-undo `buffer`, and `visible-outline-content-tree`
prefers `editor.value`. `resync_open_editor` after undo/redo re-reads the
block from the model and rewrites the textarea when they diverge.
**LUI lesson**: controlled-input state that can diverge from source of
truth (DB) needs an explicit resync hook on every external-mutation path —
undo/redo, RTC apply, sync events.

### Structured clipboard: copy must keep only topmost selected roots
`select-blocks` selects every visible row including children that are
already inside a selected parent. If the clipboard keeps all selected
uuids, `paste_block_maps` expands each parent AND emits the children again
as separate roots — the worker receives duplicate maps for the same uuid
(one bare, one with a `block/parent` lookup-ref) and the flat writes win,
flattening the pasted tree (cut-and-paste e2e). Fix: filter the clipboard
to uuids with no selected ancestor (`has_selected_ancestor` walks
`find_parent`).
**cljs semantics**: copying a parent implicitly includes its subtree; the
clipboard payload is *trees*, not rows.

### Replace-empty paste swaps the entity under the live editor
`insert-blocks` with `replace-empty-target?` reuses the target's db/id,
uuid and order — the editing block's entity is rewritten in place. The
worker tx was correct from the start (`DBG-POST` showed `title=b1` on the
target uuid); the visible `""` was the still-open textarea buffer. Same
class of bug as undo-resync: `resync_open_editor` now also runs after a
replace-empty paste.

### Worker-side debugging workflow that worked
`eprintf` in `deps/db-worker/lib` reaches the page console (captured by
the e2e `console-logs-*.txt` dump — note the dump is **newest-first**,
`conj` onto a list). Add prints around `insert_blocks` input/output,
rebuild `dune build js_api` + `vite build --mode browser`, run the single
e2e namespace, then strip. No cljs needed.

### mousedown commit → synchronous re-render steals the click target
Committing the edit on `mousedown` re-renders the DOM between `mousedown`
and `mouseup`; the browser then retargets `click` to a common ancestor
(`.page-blocks-inner`), so the block's click handler never fires and the
clicked block never enters edit. Fix: defer the blur commit one tick
(`schedule_blur_commit`), cancelled by `enter_edit`.
**General rule**: pointerdown handlers must not synchronously mutate DOM
that the same gesture's click depends on — defer or dispatch on the
stable ancestor.

### Pending focus must retry until mount, not poll twice
`apply_focus` polled at 0ms/120ms after an apply+refresh; a slower refresh
(more blocks, cold wasm paths) lost the focus entirely, leaving
`pending_focus` set but dead. Bounded retry-until-mounted (40ms × 50)
fixes Enter→Tab flows on collapsed blocks.

### Collapsed-state override is per-view, not per-DB
cljs `expand-collapsed-indent-target!` expands the indent target in the DB
*and* clears the local `:ui/collapsed-blocks` override — porting only the
DB part left the freshly-indented child invisible on journals.

### Menu links must not steal editor focus
`a.menu-link` items with `tabindex=0` accept focus on click; cljs keeps
editor focus. preventDefault on mousedown inside `.ui__popover-content` /
`.ls-context-menu-content` preserves it (click still fires).

### Undo recording needs `outliner-op` on multi-op batches
Worker `gen_undo_ops` auto-derives `outliner-op` only for single-op
batches; multi-op batches (e.g. split = `save-block` + `insert-blocks`,
merges = `move`+`delete`+`save`) MUST pass it via opts or the tx is
invisible to undo.

### Asset upload must commit the pending edit before inserting
cljs `db-based-save-assets!` calls `save-block-aux!` on the edit block
first (`has-unsaved-edit?`): the file is written to
`assets/<block-uuid>.<ext>` and rendering resolves that path from the
*final* block uuid. The worker only honors `replace-empty-target?` when
the stored target title is still blank — so an uncommitted edit ("image
uploads" typed but still only in the buffer) silently remaps the idx-0
block's uuid onto the target's, leaving the pfs file named after the
stale random bid and `img.src` blank. Port sends `save-block` + the
`insert-blocks` op in one `apply-and-refresh` batch. (cljs also has a
`new-asset-block` uuid-reuse path keyed on `empty-target?`, which now
rarely triggers since the saved title is non-blank.)
`crypto.subtle.digest` via Melange: `[@@mel.scope ("crypto","subtle")]
[@@mel.send]` compiles to `"SHA-256".crypto.subtle.digest(...)` — scope
binds to the receiver (first arg). Get `crypto.subtle` as a value with
`[@@mel.scope "crypto"]`, then call `digest` as a `send` on it.
LUI mounts `on_dom_event`-created elements after the mount fn returns —
`qs`/`querySelector` from an async continuation (pfs read, onload) can
still see a detached node; use a bounded `setTimeout` retry like the
focus fix above.

## Worker protocol edge cases

- `apply-outliner-ops` op entries require nested `Array` args
  (`[Keyword op-name; Array args]`), not a flat list.
- `insert-blocks` block maps put `block/tags` at the top level of the new
  block map (cljs merges `:properties` into the block map); worker expects
  lookup-refs `Array [Keyword "block/uuid"; Uuid u]` inside a `Set`.
- `set-block-property` rejects private tags (`logseq.class/Cards` is in
  `Db_class.private_tags`, raising `Outliner_validate.Notification`). Card
  tagging must go through the `insert-blocks` path.
- `q`/datalog wire form: `[:find ?x . :where ...]` (single-scalar find) works;
  multi-scalar forms return rows. Nested vector queries need the nested
  `Array` wrapping.

## LUI runtime issues found and fixed (already merged upstream)

- Retained-store `insert_at` duplicated elements on non-end insertion,
  producing stale node ids (crash on Toast page nav).
- Document `pointerdown` Dismiss handler fired for every mounted dropdown,
  closing sibling menus on clicks that were inside their own menu group.
- `.lui-modal-layer` lacked `pointer-events: auto` inside the
  `pointer-events: none` portal — clicks passed through the modal.
- `ToggleChanged` echo suppression only matched `Checked`, swallowing
  tree-node `Expanded`/accordion `Selected` collapse events.

## Open / intermittent issues

- cmdk "Create page called 'X'" row occasionally never appears for ~10s.
  The create row previously depended on the worker search resolving; we now
  upsert it synchronously on input. Root cause of the search hang itself is
  still unknown — possibly a stale-`gen` drop or a rejected `search-blocks`
  promise that logs only to console.

## Process notes

- `opam env --switch=5.5.0` is required before `dune` — the `default` switch
  lacks `lui` and produces confusing "lui.web.dom not found" errors.
- e2e DOM contract is `clj-e2e/`; selectors may move to class/id but the
  behavioral assumptions above are load-bearing.

that the e2e contract doesn't spell out directly. Newest area last.

## Graphs / dialogs / toasts / settings / import-export

- **Toasts**: worker `notification` broadcasts decode into `model.toasts`
  (`Action.Toast_push`); SDK `logseq.api.show_msg` / `close_msg` route through
  `ls:toast` / `ls:toast-close` CustomEvents (wired in `Worker_events.init`).
  Client-side validation raises toasts via
  `Runtime.send (Action.Toast_push ...) ; Runtime.flush ()` — no event needed.
  Tests click `.ui__toast.warning button` / `.ui__toast.success button`, so
  every toast needs a `button` child (the close control). Stacking is purely
  stylesheet: `.ui__toast` is `position:absolute` inside the fixed top-right
  `.ui__toaster-viewport`, offset by `--toast-index` — don't force
  `position:relative` or the stack collapses. `--toast-index` 0 must be the
  NEWEST toast (cljs sonner stacking puts newest frontmost with
  `z-index: calc(1000 - var(--toast-index))`); the model appends new toasts
  last, so `toasts_view` renders `List.rev`. If newest isn't index 0, an
  older toast's viewport overlays the new one and tests can't click its
  close button. cljs `notification/show!`: `toast_kind = "error"` persists
  (duration 0 — no `schedule_dismiss`); all other kinds auto-dismiss (5s).
- **Property name validation is client-side**: cljs
  `property/add-existing-or-new-property` runs `valid-property-name?`
  (`#…` and `[[…` prefixes rejected) and shows the `invalid property name`
  error toast WITHOUT calling the worker. Our
  `properties_dialog.on_type_chosen` must do the same — letting `#bad`
  reach the worker hits `validate_page_title_characters` first and emits a
  "Page name can't include #" warning toast, not the expected error.
- **Cards / flashcards phase machine**: cljs `fsrs.cljs` cycles
  `init → (cloze? show-cloze : show-answer) → show-answer → init`.
  `#card-answers` renders while next-phase ∈ {show-cloze, show-answer};
  at `show-answer` it renders `#card-again|hard|good|easy` rating buttons.
  Our `cards_state.phase` + `cards_view` mirror this. **Gap**: rating
  currently only advances `pos` and resets phase — cljs `rate-card!` also
  writes `logseq.property.fsrs/state` + `/due` via the JS `fsrs` package,
  which has no OCaml port; add a worker endpoint when persistence is
  needed.
- **Header dots menu Import**: cljs `header.cljs` toolbar-dots menu ends
  with global items incl. Import → `#/import`. Our `page_menu` folds it in
  as an item that opens `Dialogs_state.open_ "import"` (the importer is a
  dialog body, not a route).
- **Theme previews**: `.cp__theme-modes-options > li > i` classes are
  `mode-light|mode-dark|mode-system`; the light preview image only exists
  under `.mode-light.radix` — cljs adds `radix` to all three when
  `[:ui/radix-color]` is set, so emit `mode-<x> radix`. `li` must be a
  direct `ul` child: `dyn`/`box` wrap children in a `.lui-box` div that
  breaks the `ul > li` selector — use `style_class_signal` per `li` instead.
- **Importer inputs**: cljs file inputs are `input.absolute.hidden` inside
  `label.action-input` — NOT `.form-input`. If they get `form-input`,
  `w/fill ".form-input"` hits strict-mode violations (5 file inputs + the
  name prompt). `#import-file-graph` carries `webkitdirectory` (folder pick).
- **Import EDN**: cljs parses the EDN client-side first; invalid EDN →
  warning toast, no graph created, no navigation, current graph preserved.
  Empty name on the `#modal-headline` prompt → toast, prompt stays open.
- **Graph rows**: `.graph-action-btn` lives INSIDE
  `div[data-testid='logseq_db_<name>']`; the dropdown menu itself is appended
  to `body` (fixed-positioned at the button rect). Switch-graph clicks the
  last `span:has-text('<name>')` in the row — keep the name in a `span`, not
  wrapped in another `span` (strict-mode violation).
- **New graph**: blank submit keeps `.new-graph` open (no close); reserved
  chars → `.ui__toast.warning` "Graph name can't contain …"; existing name →
  `.ui__toast.error` "…already exists…"; success → close dialog, navigate
  `#/` (journal).
- **`ls:open-dialog`** `detail.name` values dispatched elsewhere:
  `delete-page`, `settings`, `export-graph`, `import`, `login`, `cards`,
  `plugins`. Unknown names should render an empty dialog, not crash.
- **LUI runtime pitfalls**: `Signal.set` on state whose node is unmounted in
  the same flush makes `runtime_backend.apply_batch` throw
  `Invalid_argument` — drop redundant `set`s on the success path that also
  closes the dialog. `Object.fromEntries` needs an OCaml
  `(string * Js.Json.t) array` via `%identity`, never a list (lists are not
  JS-iterable → "object is not iterable").
- **Settings page/dialog**: `#/settings` (`Model.Settings` in `router.ml`)
  and the header-dots `settings` dialog share `settings_page.inner ~modal`
  (`#settings.cp__settings-main > .cp__settings-inner > aside + article`).
  cljs `settings-effect` mirrors `body[data-settings-tab]` while a settings
  panel is mounted — `Settings_state.activate/deactivate` runs on inner
  mount, on route change away, and from `Dialogs_state.set` when the
  `settings` name leaves the dialog stack.
- **Dialog label attr**: `.ui__dialog-content` gets `label` from
  `dialogs_view.label_of` (settings→`app-settings`, plugins→
  `plugins-dashboard`); `app-settings` is what gives the modal its
  `w-auto md:max-w-5xl overflow-hidden` sizing in shui.css.
- **Settings rows**: `(i)` hint icons are sequential children of the
  `<label>` (`span.flex.px-2 > svg.info` + `data-base-ui-tooltip-trigger`),
  not siblings of the switch — `toggle_row`'s `~label_extra`. `svg.info`
  is cljs `svg/info` flattened (no `<g>` wrapper).
- **Shortcut `<kbd>` labels**: cljs `print-shortcut-key` semantics in
  `settings_page.print_key` (letters uppercased; mod/cmd→⌘; shift→⇧;
  alt/opt→⌥; return→⎵; delete→⌫…). `kbd_seq` keys kbd children by index
  — repeated letters (`t t`) otherwise trip `invalid_arg "duplicate
  reload key among siblings"`.
- **`style_class_signal` overwrites the whole `class` attribute** — the
  base `style_class` is not merged; signals must emit the full class
  string (`"settings-menu-item[ active]"`).
- **Boot storage env** (`boot.ml apply_storage_env`): `preferred-language`,
  `system-theme?` (→ `prefers-color-scheme` else stored `theme`),
  `radix-color` (strip leading `:` → `data-color`), `editor-font`
  (EDN → `data-font`/`data-font-global`), `wide-mode` → `ls-wide-mode`.

---

# Migration report — cljs → LUI (Melange)

Per-area notes on what was ported, deviations, and cross-area gaps.

## src/views (views system)

Ported `components/views.cljs`, `view/*.cljs` (table/list/gallery, filters,
sorting, view tabs, selection bar, export EDN) and the query surface of
`components/query_table.cljs` + `components/query.cljs` (custom queries,
`{{query}}` blocks, query builder shell, live-query count).

### Implemented

- All-pages route: `.ls-all-pages` mounted into `.cp__sidebar-main-content`
  when `Model.All_pages` (page.ml renders an empty `graphs-view` box — a
  first-class `All_pages` case should eventually live there; TODO left).
- Tag/class pages: `.ls-views-wrap` inserted before `.ls-page-blocks`
  (class-objects feature), default "All" view auto-created as a block under
  `$$$views`.
- `{{query}}` blocks: `.views-query-inner` inside `.custom-query-results`,
  query-builder clause display + filter button, `.query-result` table for
  block rows, `li` scalar results, "No matched result", live-query count.
- Views bar: `.views` tabs, `button[title='Add new view']`, rename/delete/
  export-EDN popup menus, `.view-action-type` display-type switcher
  (table/list/gallery), `.view-action-search` full-text search.
- Table: `.ls-table-header-cell` (sort asc/desc via menu),
  `[data-table-row-select]`, `.ls-table-actions` (`.selection-count`,
  trash → `.ui__dialog-content` confirm for page rows), `.filters-row`,
  `.ls-card-item` gallery, `.ls-foldable-*` group foldables.

### Deviations / simplifications

- Virtualization: `deps/ui/src/virt/` (@tanstack/virtual-core wrapper) does
  not exist yet — rows render eagerly; the row-loop is isolated behind
  `views_table.render_window`-style helpers so a virtual window can drop in.
- User-facing strings live in `src/views/views_i18n.ml` (plain literals)
  because `src/core/strings.ml` is owned by another area — should be merged
  into the shared i18n table.
- `Platform.dispatch` (CustomEvent) was unreliable — views uses a local
  `views_dom.dispatch_custom`.

### Cross-area gaps / bugs found (not views-owned)

- **js_app/main.ml** needs `Views_mount.install ();` after
  `Sdk_api.install ()` — with `(melange.emit (modules main))` an
  unreferenced views tree is dead-stripped. Required one-liner, not
  committed (js_app is out of area).
- **Base-branch LUI crash on page→route nav**: navigating away from a
  `Page` route (e.g. `#/page/x` → `#/all-pages`) throws
  `Invalid_argument` from the LUI store batch —
  `"store batch: cannot drop a node with children"` — leaving stale DOM.
  Reproduces with views fully disabled; likely same root cause as the cmdk
  "Create page" Invalid_argument that makes `new-logseq-page` fixtures
  time out (blocks every e2e namespace). Owner: app/lui shell.
- **sdk_write gaps** (`src/sdk`): `insert_block`/`new_block_map` never
  parses `#tag` in titles into `block/tags`, and `create_tag` ignores its
  options arg (`tagProperties`), so `seed-table-view!`-style e2e seeding
  cannot produce tagged objects through the public API yet.
- **strings.ml consolidation**: move `views_i18n.ml` literals into
  `src/core/strings.ml` once shared-area edits are allowed.
- **`ls:editor-insert` / `ls:editor-command` listeners**: views_mount
  implements a minimal `ls:editor-insert` splice for `{{query `}}` slash
  inserts; the full slash-command event contract should be owned by
  editor/popups.
- **`page.ml`**: add an `All_pages` case rendering `.ls-all-pages`
  directly instead of relying on the MutationObserver adapter.

### E2E

- `view_basic_test`, `query_results_basic_test`,
  `query_builder_basic_test`, `reference_basic_test` exist (coordinator's
  list also named `queries_test`/`all_pages_test`/`tables_basic_test`/
  `all_references_test`/`live_query_test` — not present in the tree).
- All e2e namespaces are currently blocked by the shared
  `new-logseq-page` fixture (cmdk create-page throws →
  `.editor-wrapper textarea` timeout). Views behaviors were verified via
  Playwright probes driving `LogseqDbWorker.invoke` directly (see
  worker-call contract in e2e-contract.md §7).

## Commands

Contracts discovered while making `logseq.e2e.commands-basic-test` green
(slash autocomplete, tags, templates, clozes, list commands).

- **ac popup is not tied to its trigger text** (cljs handle-last-input).
  A whole-buffer replacement (Playwright `fill`, inputType
  `insertText`/`insertReplacementText`) can wipe the `/`, `[[`, `((`, `#`
  trigger while the popup stays open — the whole buffer becomes the query.
  Only a `delete*` inputType that removes the trigger closes it.
  `on_editor_input` re-anchors `tpos/tlen/rpos` to 0 in that case.
- **`#` autocomplete lists classes only** (cljs `get-matched-classes`,
  `thread-api/get-all-classes` with `except-root-class?`), never page
  titles — otherwise properties like `logseq.property/template-applied-to`
  (title "Apply template to tags") match `:has-text("Template")` clicks and
  `set-block-property block/tags` on a non-class built-in raises
  `Outliner_validate.Notification`.
- **Tag application value** is the class entity's `db/id` sent as a bare
  int to `set-block-property` (cljs `(:db/id tag-entity)`); a `db/ident`
  keyword also works via `convert_ref_property_value`, but `db/id` is the
  cljs-exact path.
- **`thread-api/q` relation results decode as `Wire.Set`**, not
  `Wire.Array`/`Wire.List` — always go through `Sdk_util.wire_elems`.
- **`?u` uuid bindings decode as `Wire.Uuid`**, not `Wire.String` —
  `Wire.as_uuid` accepts both; `Wire.as_string` silently drops them
  (this made the `/template` list empty).
- **Template search** = blocks tagged `logseq.class/Template`
  (`[:find ?u ?ti :where [?b :block/tags ?t] [?t :db/ident
  :logseq.class/Template] ...]`); apply via `apply-template` op with
  `replace-empty-target? true`.
- **Interactive inline elements must be in the click guard**: clicks on
  `.cloze`/`.cloze-revealed` (cljs `non-link-target?`) must NOT call
  `enter_edit` — the capture-phase document `on_click` swaps the block to
  a textarea before the element's own click listener can emit its
  dom-event, so the toggle is lost.
- **`number children` reads children fresh from the worker**
  (`thread-api/get-block-immediate-children`), not `Model.block_children`
  — the model tree lags a just-applied `k/tab` indent and intermittently
  returns `[]`, silently no-oping the command.
- **Worker-side validation raises are unrecoverable page-side**: a
  synchronous `Outliner_validate.Notification` inside `invoke_raw`
  escapes Comlink as `MelangeError` with only the constructor name — the
  human message is lost. Log context (op names, ids) before the call when
  diagnosing.

## tag-basic-test (page-title tagging)

- **Editor_state reads throw when unmounted**: `Editor_state.editing_uuid ()`
  etc. raised `Failure "editor state not mounted"` on pages with no block
  editor (empty page, title-only editing). Popups calling these accessors on
  `#`-tag commit died synchronously. Fix: `read ()` falls back to `initial`.
  This is a recurring hazard — any read of editor state must not assume a
  mounted block editor. *LUI-level candidate*: keep the state signal always
  mounted instead of per-block mount.
- **`block/tags` wire shape**: `get-case-page` returns it as a `Set` of plain
  `Int` entity ids — not `{:db/id}` lookup-ref stubs like `entity_map_wire`
  emits elsewhere. `db/ident` decodes as `Wire.Keyword`, not `Wire.String`.
  Decoders must accept both or we silently drop data (chip never rendered).
- **Built-in Page tag must be filtered**: every page carries
  `logseq.class/Page` in `block/tags`; cljs never renders it as a chip.
- **`save-block` rejects page entities**: title edits must use
  `set-block-property`/`rename-page` paths only.
- **`ls:editor-insert` has no handler for the title textarea**: `emit`
  dispatched the event but only block editors listen — the `" #tag"` token
  stayed in the buffer and the following commit renamed the page to
  `title #tag` (worker validation rejected it). Fix: when `ac.editor` is
  inside `.ls-page-title`, `emit` splices the value directly. Suggestion:
  generalize editor targets behind a shared `editor-surface` contract so
  emit/insert works for any textarea, not only `edit-block-*`.
- **Commit must trim**: emit leaves the leading space (`"ttd5 "`); cljs trims
  before rename. An untrimmed title reaches worker `save-block` on the page
  entity and corrupts the lookup (page became unresolvable).
- **Stale-node dispatch crash**: a capture-phase handler that re-renders can
  unmount the event target before its own bubbling listener runs; LUI
  `dispatch` raised `unknown extension node`. Fixed in LUI
  (`devin/web-stale-node-ops`): events on unmounted nodes are ignored.
- **Remounted textarea loses focus**: `autofocus` doesn't re-fire reliably on
  remount; the title editor now focuses explicitly after `Title_edit_start`
  and places the caret at the end.

## Multi-tabs / cross-tab sync (e2e: `multi_tabs_basic_test`)

- **Worker side is healthy**: `logseq.api.append_block_in_page` propagates to
  other tabs via navigator.locks master election + BroadcastChannel
  (`deps/db-worker/lib/shared_service.ml`); UI receives `"sync-db-changes"`
  and `Router.reload ()` re-fetches blocks.
- **Crash 1 — `NotFoundError: removeChild`**: a single batch emitted
  `SetExtensionProp(span.block-title-wrap, "text", ...)` BEFORE
  `RemoveChild(span, br)`; `dom_adapter.ml` `set_property "text"` maps to
  `setTextContent`, which detaches ALL DOM children, so the later
  `removeChild` threw, the batch aborted, and the generation desync
  ("expected patch generation N, received M") killed every subsequent
  render on all tabs. This is an upstream emit-order issue (prop sets
  applied before child ops on the same node). Workaround committed in
  `src/render/render.ml`: `.block-title-wrap` gets reload keys `btw-t`
  (plain `~text`) vs `btw-c` (children, incl. the empty-title `<br>`), so
  a text↔children transition forces a remount instead of a prop+remove
  mix on one node. If upstream reorders emits (children before prop
  writes), the keys can be dropped.
- **Crash 2 — `store batch: cannot drop a node with children`**: surfaced
  on cmdk "Add a DB graph" → dialog open. Cause was the retained-store
  `insert_at` bug already listed above (fixed upstream in
  logseq/lui#65): every non-append `insert_child` duplicated the child id
  in `retained_children`, so `drop_node` still saw leftovers after all
  `RemoveChild` ops. **Environment gotcha**: `lui` in the `5.5.0` opam
  switch is `dune install`ed from `~/repos/lui`, NOT the git pin — after
  upstream merges you must `cd ~/repos/lui && dune build -p lui && dune install lui`
  then rebuild `deps/ui`, or you debug already-fixed code.
- **Open**: `src/properties/properties_view.ml` installs a capture-phase
  `input` listener that opens a second `.ui__popover-content` on `/`/`#`
  in any `edit-block-*` textarea, alongside the real `popups_state`
  slash menu (which already lists "Add property"). Two popovers →
  `slash-menu-filter-scroll-and-cleanup-test` sees
  `a.menu-link.chosen` count=2. The properties popover should be removed
  or folded into the main autocomplete.

## Plugins (e2e: `plugins_basic_test`, `plugins_marketplace_test`)

- **SDK bridge**: `src/sdk/` installs `window.logseq.api` (flat snake_case
  method table) + `sdk.ui`; `sdk/plugin_host.ml` wires `LSPluginCore`
  events (`registered`/`unregistered`/`disabled`, `lsp-updates`), persists
  installed web plugins under `LSPUserDotRoot/installed-plugins-for-web`
  localStorage keys, and injects toolbar UI via `pluginHelpers.setupInjectedUI`
  into `pl-injected-ui-item-*` slots in the left-sidebar plugins menu
  (`.toolbar-plugins-manager-trigger` dropdown).
- **`datascript_query` camelCase**: cljs calls
  `normalize-keyword-for-json result false` — camel-case? is nil, so keys
  keep hyphens (`journal-day`, `original-name`). `json_of_wire ~camel:false`
  added for this; every other api result stays camelized. Inputs are
  resolved through worker `thread-api/resolve-query-inputs` (binds
  `:current-page`/`:today`-style inputs) before `thread-api/q`, matching
  cljs `db-async/<resolve-query-inputs` + `<q`.
- **`datascript_query` input args**: `logseq.DB.datascriptQuery` also emits
  `logseq.api.datascript_query`; `q` (`thread-api/query-dsl-query` with
  `:current-page-title`/`:today-day` opts) is registered too.
- **`wire_of_json` must guard `undefined`**: plugins pass `undefined`/null
  args (e.g. `pushState('page', {name: page?.uuid})` when uuid is absent);
  `Js.Json.classify` lets `undefined` fall into the `JSONObject` branch →
  `Js.Dict.keys` crashes the whole exec call and silently aborts the
  plugin's promise chain. Guard on `Js.typeof j = "undefined"` first.
- **Missing api methods throw, not resolve**: `LSPluginCore` rejects
  `logseq.<fn>` calls for unregistered method names ("Not existed method
  #<name>"), which aborts the plugin's `.then` chain (hideMainUI inside
  `_onDaySelect` killed `pushState` before it ran). Any method a plugin
  may call needs at least a `nil_fn` stub — added `show/hide/toggle_main_ui`,
  `set_main_ui_inline_style`, `set_main_ui_attrs`.
- **`get_user_configs.preferredDateFormat`**: cljs returns
  `state/get-date-formatter` (config `:journal/page-title-format`,
  default `"MMM do, yyyy"`); plugins format journal titles with it via
  dayjs. A wrong default (`yyyy-MM-dd`) makes created journal pages miss
  `journal-day`. `get_user_configs` now reads `logseq/config.edn` through
  `Sdk_config.read_config` with that fallback.
- **`sup` tag**: `installed_card` uses `[:sup]` (cljs plugins.cljs L388);
  every `Logseq_dom.dom ~tag:` must be whitelisted in
  `logseq_dom.ml`'s `tags` list or `create_extension_node` raises
  `Invalid_argument` and unmounts the whole dialog subtree.
- **`a.btn.disabled` e2e pitfall**: app CSS gives
  `.cp__plugins-item-card>.r .ctl a.btn.disabled` `pointer-events:none`;
  the e2e `has-text('Install')` selector also matches "Installed", so
  `click-install-button` hit-tests a dead anchor forever. The installed
  anchor carries inline `pointer-events:auto` (handler no-ops when
  installed) — a deliberate deviation from cljs CSS.
- **`create_tag` `tagProperties`**: cljs creates the class then
  `set-block-property! :logseq.property.class/properties` with db/ids;
  `set-block-property`'s first arg spec is `SBlockId` → `Wire.Uuid` only
  (`Wire.Int` raises `Invalid_outliner_op`). OCaml create_tag upserts
  missing property entities then links them by uuid.
- **`get_block_property` enum reads**: `logseq.property/type` arrives as
  `Wire.Keyword "json"` — `Wire.map_get_string` misses keywords; match
  `(Wire.Keyword _ | Wire.String _)`.

## cljs ↔ OCaml 行为对照表 (interaction semantics map)

| 交互 / 隐式契约 | cljs 语义来源 | LUI/OCaml 实现位置 |
|---|---|---|
| Enter 分裂块 / Shift+Enter 换行 | frontend.handler.editor/keydown | `src/editor/editor_keys.ml` `on_editor_key` → `editor_actions.split_at_cursor` |
| Tab / Shift+Tab 缩进 | editor handler indent-outdent | `editor_keys.ml` Tab → `editor_actions.indent_or_outdent` → `outliner_ops.indent_outdent` |
| Shift+Arrow 在编辑边界跨到块选择 | cljs keydown 边界判断 | `editor_keys.ml` `on_editor_arrows`（caret 在首/末行时退出编辑进入选择态）|
| Meta/Alt+Shift+Arrow 移动块 | shortcuts move-up/down | `editor_keys.ml` `on_normal_key` → `editor_actions.move_blocks_up_down` + `Model.move_selected_top_blocks` 乐观重排 |
| textarea 文本同步 | React 同时维护 value+textContent | `extension/dom_adapter.ml`（input 事件同步 textContent；text prop 跳过冗余 .value 写入）；上游 `lui_web_props.set_text_control_value` 已同步（lui PR #68） |
| 页面标题编辑（点击→textarea→Enter 提交）| page.cljs title editor | `src/pages/page.ml` `title_editor`/`commit`（`String.trim` 后 `Page_ops.rename`）|
| 标题上打 tag（# → popup）| editor tag popup | `src/popups/popups_state.ml` `emit`/`apply_tag` — `.ls-page-title` 内直接 splice value/textContent（`ls:editor-insert` 不覆盖标题 textarea）|
| slash/`#` 命令弹窗 | editor autocomplete | `src/cmdk/` + `popups_state.ml`（`/`,`#`,`[[`,`((`,`:` 触发，`.ui__popover-content`，`a.menu-link.chosen`）|
| cmdk (Meta+K) | ui.search | `src/cmdk/cmdk_state.ml`/`cmdk_view.ml`（`.cp__cmdk-search-input` + testid 结果行）|
| Undo/Redo（图级作用域）| outliner history per repo | `editor_actions.undo/redo` → worker `apply_history_action`；`resync_open_editor` 回写打开的 buffer |
| 左/右 sidebar | frontend.components.right-sidebar / left | `src/sidebar/`（`#left-sidebar` 单实例、right sidebar panels）|
| 页面 tags (`.block-tags`) | :block/tags refs 解析 | `outliner_ops.resolve_page_tags`（接受 `Wire.Set` of `Int`/`Int64`，过滤 `logseq.class/Page` 内建类）；`router.load_page_ref` 与 `refresh` 都会调用 |
| 块/页面 embed（`{{embed}}`、Node embed）| components.block embed | `src/render/render.ml` 嵌入渲染 + reload key `btw-t`/`btw-c` 区分 text/children 两种形态 |
| 虚拟列表 | cljs Virtuoso | `@tanstack/virtual-core` 绑定 `src/virt/virt_list.ml` + `virtualizer.ml`，page block list 已接入 |
| worker 协议 | Comlink + transit | `src/core/comlink.ml` + `src/core/wire.ml`（transit map/array/keyword/int64 解码）+ `app/decode.ml` |
| 弹层 (popover/modal/toast) | shui base-ui | LUI schema 组件 + `src/popups/`；document `ls:open-dialog` CustomEvent 跨模块派发 |
| 键盘修饰键顺序 | cljs match 顺序 | 教训：`on_normal_key`/`on_editor_key` 中 modifier 组合必须先匹配最具体的 |

## 已提交到 lui 的通用化下沉

- `lui_web_dom_ext`（lui PR #68）：通用 `lui-dom-<tag>` 扩展族（attrs/events/text + dom-event payload 含 selectionStart/End/Direction），textarea textContent 同步。
- stale-node 容错（lui PR #67）：unmounted 节点上的事件/属性写入不再崩溃或卡住批次。
- dropdown dismiss / modal hit-testing / retained-store 顺序（lui PR #65）。
