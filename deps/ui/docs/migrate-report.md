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
  `position:relative` or the stack collapses.
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

## Block/page references (e2e: `reference_basic_test`)

- **Copy inside an editing block is a block-ref copy**: cljs
  `shortcut-copy` (handler/editor.cljs) on a collapsed caret writes
  `[[<block-uuid>]]` to the clipboard (`copy-current-block-ref` →
  `ref/->page-ref`); only a non-collapsed selection is a native text
  copy. The OCaml `on_copy` handled only selection-mode copy, so
  editing-mode mod+c silently wrote nothing. Fixed in
  `editor_keys.ml`: collapsed selection in an editing block does
  `clipboardData.setData("text/plain", "[[" ^ uuid ^ "]]")` +
  preventDefault; paste then falls through `paste_into_editor` to a
  native textarea insert (internal `S.clipboard` stays empty).
- **`[[x]]`/`((uuid))` render `[[`/`]]` bracket spans**: cljs
  `page-reference` always emits `span.page-reference[data-ref]` +
  `span.text-gray-500.bracket` "[" "]"" around `a.page-ref`; `((uuid))`
  routes through the same component. The OCaml renderer emitted only
  bare `a.page-ref`/`a.tag`, so `:text('b1[[b2]]')` never matched.
  `#tag` is different: cljs routes it through `page-cp` with
  `:tag? true` — `a.tag` with `#name`, no `.page-reference` wrapper,
  no brackets.
- **Uuid refs resolve the target's title and re-parse it**: cljs
  `page-inner` calls `block-title` on the resolved block, so
  `[[uuid]]` renders the block's full markup recursively. A uuid that
  resolves to a *page* entity renders plain title text instead. The
  OCaml `resolved_ref` pulls `[:block/title :block/name]` in one
  `thread-api/pull` (`block/name` present = page → plain text;
  absent = block → `parse` recursion). Non-uuid `[[name]]` still
  renders the raw name — cljs resolves it to the unique title.
- **`:ref-set` suppression is required to terminate cycles**: cljs
  seeds the ref-set with the enclosing block's uuid on the first ref
  and conjs `{enclosing-uuid, ref-target}` per nesting level; a ref
  whose target is in the set renders nothing (not even the wrapper).
  Mirrored via `~refs`/`~self` params on `Render_inline.parse` +
  `Render.title` (block uuid passed from `content_el`): without it,
  `b1[[u3]]` → `u3` title → `[[u2]]` → `u2` title → `[[u1]]` looped
  forever (each level a new thread-api pull + dyn mount).
