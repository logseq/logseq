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

### Toasts render newest-first and nest under the shui contract
The tests read `.ui__toast` by position — index 0 must be the newest toast.
Each toast also needs the DOM nesting the shui stylesheet expects (viewport
→ `.ui__toast` → close `button`); flattening it breaks dismissal selectors.

### `focus_end` must not call `setSelectionRange` on non-text inputs
Selection APIs throw `InvalidStateError` on inputs like `type=checkbox`.
The cljs helper silently no-ops there; the LUI port must guard the same way
or property forms crash on focus.

### Property names are validated client-side before the worker call
cljs runs `valid_property_name` (non-blank, no leading `#`, etc.) before
`set-block-property` and shows the invalid-name toast without touching the
worker. Doing it server-side changes toast text/timing and fails the
name-validation test.

### Async page loads need a latest-wins generation guard
`resolve`, `goto_page`, `refresh_page` and block-zoom all fetch
asynchronously; an older in-flight load resolving last overwrote the newer
page. `Runtime.load_gen` (bump on initiation, commit only when still
current) plus `exit_edit` at navigation entry points — the e2e
`wait-editor-visible` probe was passing on the *old* page's stale editor.

### Same-route hash changes must not emit `Navigate_to`
A hashchange to the already-current route re-triggered the whole load path
(stale commits + flicker); cljs only acts on real route transitions.

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

## LUI runtime issues found and fixed (upstream; see branch notes)

(The same-batch create+drop / dead-event fixes landed on logseq/lui
main via PR logseq/lui#75 (`58a9563`) — apply-side tolerance plus the
`enqueue_drop` emission-side cancel. The opam pin tracks `#main`, so
no local repin is needed. Earlier items in this list are on main.)

- Retained-store `insert_at` duplicated elements on non-end insertion,
  producing stale node ids (crash on Toast page nav).
- Document `pointerdown` Dismiss handler fired for every mounted dropdown,
  closing sibling menus on clicks that were inside their own menu group.
- `.lui-modal-layer` lacked `pointer-events: auto` inside the
  `pointer-events: none` portal — clicks passed through the modal.
- `ToggleChanged` echo suppression only matched `Checked`, swallowing
  tree-node `Expanded`/accordion `Selected` collapse events.
- **Generation-desync wedge** (root cause of the cmdk create-page
  timeouts): a `dom batch`/`store batch` `Invalid_argument` inside
  `apply_pending_batch` leaves `pending_ops` populated while the store
  already committed, so `runtime_generation` stays one behind and every
  later flush fails `expected patch generation N, received N-1` —
  permanently wedging rendering. Two trigger paths found and fixed in
  `lui_runtime.ml`: (a) `dispatch` threw `unknown extension node` for
  DOM events on `logseq-*` nodes dropped between listener install and
  event delivery — now absorbed (`node_live` guard); (b) a node created
  and dropped within one pending batch left a `create-*`/`drop-node`
  group that cannot replay post-commit — `enqueue_drop` now prunes all
  queued ops mentioning such a node instead of emitting the drop.
- Same-batch prop ops on dropped nodes resolve through a pre-batch
  mirror (`lui_web_apply.node_record`) so the DOM element, still
  attached at that point in the op stream, can take the write.
- DOM `removeChild`/`MoveChild` ops now detach nodes from their actual
  DOM parent instead of assuming the recorded parent (stale tree state
  after navigation raced removals). Host apps may also swap tracked
  elements outside op dispatch entirely: `editor_dom.ml` replaces
  `<raw-text>` placeholders with real text nodes via a MutationObserver
  (`dom_fixups`), leaving the retained store pointing at detached
  elements — `detach_dom_child` therefore no-ops when the DOM reports
  a different `parentNode` (lui `5a00864`).
- **`lui_runtime.flush` claims `pending_ops` + `runtime_generation`
  before `apply_pending_batch`** (lui `1d58d13`). If apply re-enters
  flush (a dom-event handler sending actions mid-batch), the nested
  call used to replay the same ops or drop the generation bump; the
  claim-first ordering makes re-entry a no-op.
- **`apply_dom_batch` wraps every JS exception as `Invalid_argument`**
  ("dom batch: <exn>") so it joins the `apply_pending_batch` catch
  (lui `5a00864`). Raw JS errors (e.g. `NotFoundError` from
  `removeChild`) used to escape past it: the store had committed while
  `runtime_generation` stayed behind, and every subsequent batch threw
  `expected patch generation N+1, received N` — the same wedge as the
  generation-desync above, via a different door.

## Open / intermittent issues

- None blocking; the cmdk create-page wedge is fixed (see above).

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
- **Markdown heading normalization lives in EVERY save path, not one**:
  `block_map_parsed`/`Title_refs.parse` strips `#` and sets
  `logseq.property/heading` just like `saved_block_map` — the worker's
  `clear_markdown_heading` only strips the title and is skipped entirely
  once `display-type` is set (e.g. `/quote`), so a parsed save that
  skips normalization rewrites the stored title back to `# ...`.
- **Ops that depend on document order must not use
  `String_set.elements`**: the worker's `indent-outdent-blocks` rejects
  non-consecutive input silently (`get_non_consecutive_blocks` → `None`),
  and uuid sort order is random relative to document order — selections
  must go through `selected_uuids` (flat-visible order).
- **`Switch` re-opens bypass `open_ac`'s kind loaders**: `apply_item`'s
  `Switch kind` arm must run the same loader `open_ac` does for that
  kind — `Template_search` fell into the `_ -> ()` branch so
  `t.templates` stayed `[]` and the template picker rendered only its
  empty placeholder.
- **Commit-title overrides must paint the normalized title**
  (`Ops.normalized_title`): the raw buffer carries `# ` prefixes and the
  trailing space `input-command` types, and the override's `S.set`
  repaint lands before any worker `Page_loaded` — so `.block-content`
  shows `# title ` until the refetch clears it, breaking exact-text
  block jumps.
- **Every `Page_loaded` producer must `clear_overrides`**: worker
  `sync-db-changes` reloads flow through `Router.reload` →
  `load_page_ref`/`load_home`/`load_block_zoom`, which never cleared —
  overrides set on exit stayed painted forever. The clear lives at each
  `send (Action.Page_loaded _)` site in router.ml (and refresh_page).
- **Closed-value resolution is case-insensitive**: `/low` style command
  ids pass lowercase names; compare `closed-value-content`
  lowercased (`priority:low` → "Low") or the property is never set.
- **Hidden-properties toggle is root-block/page only** (cljs
  `properties-area` gate): `current-route-page? || root-block?` (or it
  moves to the block-below pill). Rendering it for any block with hidden
  rows adds a second `.property-k` ("Show hidden properties") and breaks
  `get-text ".property-k"` single-match assertions.
- **The popup key router must be consulted before the normal dispatch**:
  `Editor_commands.popup_key`/`click_guard` were defined but never wired
  — `on_keydown` must check `popup_key` first (arrows move the calendar,
  Enter commits, Escape restores caret at `p.from`, other keys swallowed)
  or the date picker ignores Escape and teardown clicks leak into the
  picker. `click_guard` runs at the top of `on_mousedown`'s
  `.editor-wrapper` None branch: inside the popup suppress, outside
  close it — before the blur-commit chain.
- **The forbidden-edit guard is the full cljs selector list**
  (`target-forbidden-edit?`, block.cljs): capture-phase clicks matching
  `.forbid-edit`/`.bullet`/`.logbook`/`.markdown-table`/A|BUTTON|TIME|
  AUDIO|VIDEO|INPUT|TEXTAREA|DETAILS|SUMMARY|SUP.fn|`.image-resize`/
  `closest a`/`.cloze`/`.cloze-revealed`/`.query-table` must not call
  `enter_edit` — the element's own handler owns the click and the
  unmount-on-edit would beat it.
- **The code/calc editing surface needs the same listener wiring as the
  textarea**: `pre.CodeMirror-line[data-code-uuid]` lives outside
  `.editor-wrapper`, so `on_input` must route its `input` events to
  `code_pre_input` (sync buffer + schedule_save + re-render
  `.extensions__code-calc-results` per line) and `on_keydown`'s
  non-textarea fallthrough to `code_pre_key` (Escape exits,
  Shift+Enter inserts a sibling). Without it `w/fill "*:focus"` never
  reaches the buffer and no calc output renders.
- **`expand_property_refs` must actually be in the served worker
  bundle**: `get-page-blocks-tree` expands `{db/id}` stubs under
  `logseq.property/*` keys into `ref_value_summary` maps (title/ident) —
  a stale `static/js/db-worker.js` ships the raw stub and
  `prop_label`-style decoders see `{db/id}` with no `block/title`, so
  `order-list-type` silently decodes to nothing. db-worker has its own
  build: `cd deps/db-worker && dune build js_api && vite build --mode
  browser`.

### cmdk palette (cljs `frontend.components.cmdk.core` parity)

- **Commands group = `global-shortcut-commands`**: every shortcut.handler
  command in groups editor-global + global-prevent-default +
  global-non-editing-only. cljs `build-category-map` drops `:inactive`
  entries when the config is built — on web that removes electron-only
  bindings (find-in-page, db-save, shell/run, window/close,
  copy-page-url), plugin file/GitHub installers, and dev-only
  replace-graph — so `commands_data.ml` omits them (95 ids: 86
  web-visible + 9 dev-gated). Each row renders its keycap binding on
  the right (mac shows ⌘/⌥/⇧/⌃ glyphs via `Platform.is_mac`, non-mac
  shows Ctrl/Alt/Shift/Delete words). dev/* rows are gated on
  developer-mode at query time, like cljs.
- **Command order = cljs `top-commands`**: sort by :id, then stable
  sort by :invokes-count ascending and `reverse` — net effect:
  invoke-count desc, every equal-count run in reverse :id order. The
  0-count majority therefore renders reverse-alphabetical by id
  (e.g. "Select parent block" before "Edit selected block" on "block").
  Invokes persist in localStorage `commands-history` like cljs.
- **Blank input runs `:initial` + `:filters` only** (cljs `load-results
  :default`): the palette shows Recently updated + Filters — no
  Commands/Nodes/Files groups — until a query or filter is chosen.
- **Fuzzy filter** = cljs `fuzzy-search-multi` semantics
  (`Fuzzy.fuzzy_search_multi`): max score over several extract fields,
  score > 0, stable sort desc, group limit nodes=10 / others=5; query
  "Seed" still returns ~15 commands.
- **Group header** shows `<title> <total-count>` plus `Show more ⌘↓` /
  `Show less ⌘↑` when `gitems > limit`; `mod+down/up` expands/collapses
  per group (state lives on the view record, not the DOM).
- **Filters group** prepends "Search only current page" (file icon,
  `G_current_page` scope) only on a named `:page` route (cljs
  `state/get-current-page` — the journals/home route doesn't count);
  **Nodes rows matching the current page get a "Current Page" badge**
  under the same gate; **Files group lists `logseq/config.edn`** as a
  static entry.
- **Query highlight**: titles render `<mark>`-wrapped match segments
  (`highlight_el`); indices must index the SAME bytes `String.sub`
  slices — normalize with `String.lowercase_ascii text`, not a
  normalizer that re-encodes, or non-ASCII queries shift every segment
  bound and crash inside the dyn render.
- **Hint bar** at the bottom = cljs tips row — `rand-nth
  [:filter-results :open-sidebar]` per open (either "Press / to filter
  search results" or "Press ⌘⏎ to open search in the sidebar").
- **Escape semantics** (cljs `clear_or_close`): first Escape clears a
  non-empty input/filter, second Escape closes — a bare Escape does NOT
  close while input is non-empty.
- **Same-batch create+drop = live crash without lui fix**: any view
  change that mounts a subtree and drops it again inside one signal
  stabilize (two publishes in one flush — e.g. keyed re-orders + row
  remounts from rapid input) emits `create-*` + `drop-node` for the same
  node id; the web backend commits the store batch before DOM replay,
  so `dom_node` then throws `invalid_arg "unknown DOM node"` and the
  failed batch wedges `runtime_generation` (every later flush fails
  `expected patch generation`). Fixed LUI-side on
  `devin/web-same-batch-drop` (PR logseq/lui#75): apply-side tolerance
  for dead-node ops plus `enqueue_drop` cancelling same-batch
  create+drop op groups at emission (from `317b801`, originally on
  `devin/lui-removechild-guard`). PR #75 has merged into logseq/lui
  main (`58a9563`) and the opam pin tracks `#main`, so fresh
  sessions/snapshots get the fix with no local repin.
- **Rows must not subscribe the whole view signal**: keyed rows read
  per-item fields that `Cmdk_state.decorate` bakes at publish
  (`ihl`/`imouse`/`iq`/`gfilter_active`), and the inner `keyed` uses
  `item_dom_key` (content-versioned key) so any render-visible change
  does a clean remove+insert instead of publishing into a row that the
  same flush may tear down.

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

## Right sidebar (e2e: `right_sidebar_basic_test`)

- **`app.set_state_from_store` was a stub**: the test drives
  `set_state_from_store(['ui/radix-color'], 'none')` /
  `(['ui/system-theme?'], false)` and asserts
  `documentElement.dataset.color`. cljs `set-state!` assoc-in's the app
  atom and subscriptions apply effects (`data-color` =
  `(or :ui/radix-color "logseq")`, system-theme → `data-theme` follows
  `prefers-color-scheme`). Our sdk returned `resolved_nil` for every key.
  Implemented the observable effects for `ui/radix-color` (dataset.color +
  `ui/radix-color` storage) and `ui/system-theme?` (storage + theme
  recompute); unknown keys remain no-ops.
- **Boot hardcoded `data-color="logseq"`**: cljs reads
  `storage/get :ui/radix-color` at init; boot.ml now unquotes the stored
  value the same way.
- **`:contents` sidebar item mirrored the main page**: cljs
  `<build-sidebar-item` pulls the built-in page entity named `"Contents"`
  and renders its own blocks; `sidebar-action-block-lookup` resolves
  `:contents -> "Contents"` so "Open as page" navigates there. Our
  `contents_item` snapshot `Model.route_page`/`current_page` blocks
  instead, so `#ls-block-<uuid>` on the main page was mounted a third
  time in the Contents item (and went stale on sync) and "Open as page"
  navigated to the page already open — a no-op. Now `contents_item`
  delegates to `page_item_of_ref "Contents"` (Contents page blocks,
  `page_ref = "Contents"`).

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

## Embeds

Implementation: slash "Node embed" is `ac_kind Embed_ref` in
`popups_state.ml`; picking a page calls `Editor_embed.insert`, which
issues `insert-blocks` with `sibling`, `replace-empty-target`, the page
name as title, and `block/link` → the target page db id (new
`block_map ~link` arg in `outliner_ops.ml`). Blocks with `block/link`
render their linked page's children inside the block-children container;
the row carries `.embed-block` plus `originalblockid`/`data-embed`
attrs. `Editor_state.children_of` returns `block_embed_children` when
`block_link` is set, so `find`/`flat_visible`/prev-next traversals see
embedded rows. `fill_embed_children` (per-`block/link`
`thread-api/get-page-blocks-tree`, ancestor self-embed guard,
`Promise.catch → []`) runs in `refresh_page`, `goto_page`, and the zoom
route. Embed ops never move embedded children — outdent of a block
after an embed uses `parent_original` (the embed row's real parent),
matching the cljs fix for `indent-outdent-embed-page-test`.

### `.block-content` must be UNMOUNTED while editing
`.block-content.inline{display:flex}` (style.css) beats `.hidden
{display:none}` — class-based hiding cannot collapse it, and its
flex sibling squeezes `.editor-wrapper` to width 0 (Playwright reports
the textarea "hidden"). Keeping it mounted-but-hidden also leaves a
stale `.block-title-wrap` that `consecutive-backspace` counts. Upstream
solution adopted: `content_or_editor` swaps content↔editor via `dyn`,
unmounting `.block-content` entirely.

### Editing is scoped per container
`S.editing` is global, but the same block renders in main content AND
the right sidebar. Without a scope, both trees mounted a textarea with
id `edit-block-<uuid>` → Playwright strict-mode violation in
`references-embeds-and-mounted-instance-refresh-test` (`w/fill
util/editor-q`). `editing` now carries `scope` ("main"/"sidebar"):
`block_row ~scope` threads it down, `content_or_editor` only mounts the
editor in the scope where the click landed (`closest
".cp__right-sidebar"`), and `merge/split/delete` paths preserve the
incoming scope.

### Linked references are grouped by source page
cljs `grouped-blocks-container` renders `.references` as
`.references-blocks-item` groups, each headed by `page-cp` (the
referencing page title). A flat row list never shows the source page
name, so `.references :has-text(<source-page>)` fails. `page.ml`
`refs_grouped` groups on `block/page-name` (already emitted per ref row
by `with_explicit_ref_fields`) and emits a `.page-ref` link per group.

### cmdk create-row `idx = -1` race
`on_input` → `upsert_create` inserts the "Create page called …" row with
`idx = -1` before the ~100ms-debounced `apply_results` renumbers; an
index-based click dispatch silently no-ops in that window. Clicks now
resolve via a stable `data-item-key` attr + key lookup in `cmdk_view.ml`
instead of `data-item-index`.

### Stale `db-worker.js` after merges
`static/js/db-worker.js` is a build artifact — after merging branches
that touch `deps/db-worker`, rebuild it (`dune build js_api` + `vite
build` there). A stale bundle misses new endpoints and throws
`MelangeError: Dispatcher.Exn_info` ("not found thread-api: …") as
unhandled rejections that break unrelated flows (observed: missing
`thread-api/get-unlinked-refs` broke `graph/new-graph`).

### LUI `previous_nodes` batch-ordering fix is local-only
The fix for prop ops targeting nodes dropped earlier in the same patch
batch lives ONLY in `~/.opam/5.5.0/.opam-switch/sources/lui`
(`lui_web_apply.ml` / `lui_web_extensions.ml`) and is installed into the
switch, but is NOT committed to `logseq/lui` — the opam pin tracks
`#main`, so any fresh `install-opam-deps.sh` run silently reverts it.
Needs an upstream PR.

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
- **No fullscreen menu backdrops**: sidebar dropdown menus must NOT render
  a `position:fixed;inset:0` overlay — cljs dropdowns dismiss on outside
  pointerdown, and an invisible overlay blocks hit-testing on everything
  beneath it (the toolbar-plugins backdrop swallowed every pointer hit
  while the menu stayed open — the fixture's Escape was legitimately
  consumed by an open cmdk palette, so nothing ever closed the menu and
  Playwright's actionability check timed out on the next click).
  `Sidebar_state.on_doc_click` now closes `open_menu` on clicks outside
  `.ui__dropdown-menu-content` / the trigger controls
  (`.toolbar-plugins-manager`, `.as-edit`, `[data-testid='sidebar-item-more']`).
- **plugins dialog + toolbar trigger**: `dialogs_state.known` must list
  `"plugins"` or `Dialogs_state.open_` drops it. The toolbar trigger is
  gated on `Plugin_host.has_installed_plugins` (installed entries survive
  disable), not `toolbar_items` — after disabling every plugin the trigger
  must still render so the menu can offer "Plugins". `register_ui_item`
  has no installed-presence gate: a plugin's `provideUI` can beat the
  `registered` event on fresh installs.


## RTC surface (e2e: `rtc_basic_test`, `rtc_extra_test`, `rtc_extra_part2_test`)

- **Cloud indicator must reset on graph switch**: the worker's
  `rtc-sync-state` broadcast carries no repo field, and `db_sync_client`
  broadcasts `rtc-lock=false` only via `set_ws_state` on close — a deleted
  graph's conn leaves the UI holding a stale `idle` state, so
  `button.cloud.on.idle` stays visible on the next (unsynced) graph.
  cljs gets away with it because `state/set-state! :rtc/state` merges and
  the close broadcast lands. We clear `Model.rtc` on `Boot_graph_ready`
  (`Worker_events.reset_rtc` resets the dedup ref too) and on
  `Rtc_ops.download` start (`Action.Rtc_state_clear`), so `on.idle` can
  only appear once the *current* graph's conn reports — this is what
  `switch-graph`'s `wait-for` actually gates on.
- **Keyed nodes now survive cross-parent reparents**: outdent/refresh
  reparents used to drop+recreate keyed rows (LUI sibling-only key
  matching) — including the focused editor textarea — which raced
  Playwright `boundingBox`'s two-step resolve+measure into a null →
  NPE. Fixed in LUI `reconcile_subtree`: a subtree-wide key index
  adopts sibling-miss keyed children (each old node claimed once, so
  duplicate keys across branches still create fresh nodes), with the
  reparented child's `RemoveChild` emitted before all parent diffs.
- **Keyed nodes inside *freshly-mounted* containers must also adopt**:
  when a block gains children (`nc-<uuid>` ↔ `children-<uuid>` toggle)
  or any unmapped container mounts, `collect_node_mapping` only recursed
  into *matched* candidate children — a keyed row nested inside the new
  container was never offered for adoption, so its live DOM row (and the
  editing textarea inside it) was dropped and recreated on every nest
  op. LUI now walks unmapped candidate subtrees (`rescue_subtree`) and
  lets keyed descendants adopt their old nodes under the same
  uniqueness/claimed/compatible guards. Row keys are also
  scope-namespaced (`ls-<scope>-<uuid>`) so the same uuid rendered in
  main list, sidebar, preview and embed can't claim each other's DOM.
  `outliner_ops.refresh_page` also keeps a `refresh_gen` guard dropping
  stale in-flight refreshes to shrink the op pileup window.
- **Editor textarea text lives in the DOM, not the model**: typing only
  reaches `S.editing.buffer` through the document `input` listener
  (`sync_buffer`, silent). Two consequences: (1) `buffer_sig` needs
  `Signal.cutoff` or every unrelated publish (e.g. `Rtc_state`
  broadcasts during the stress test) re-emits the stale buffer and
  wipes in-progress typing; (2) `resync_open_editor` must not clobber
  a divergent buffer — it only writes when `buffer = base` (untouched
  since open) and the stored title changed, tracked by the new
  `editing.base` field.
- **`autofocus` on the editor textarea is load-bearing**: removing it
  broke `*:focus` press-seq flows (`rtc-extra-part2` asset test) because
  the slash-command path types into the focused element. The textarea
  keeps `autofocus` AND `request_focus`'s retry loop as backup. The real
  culprit behind textarea churn was upstream in LUI reconcile — see the
  LUI note on keyed adoption.
- **Graphs view must not rebuild on every refresh**: cljs React
  reconciles rows in place; our wholesale `B.remove`+rebuild detached the
  remote row's span mid-click (Playwright "element not stable" → 10s
  TimeoutError on `.last` row click). `graphs_view.render_into` now skips
  when `view_sig` (repos + meta last-seen + remote_graphs) is unchanged.
- **Delete must drop the repo optimistically**: `delete_graph` removes
  from `repos` at entry (before the unlink round-trip) — the remote row
  click during the in-flight unlink checks `repos` to decide
  navigate-vs-download, and a stale `local=true` navigated into a
  deleted graph and recreated an empty DB.
- **Navigation requests need a generation guard**: the delete-redirect
  nav and the remote-row download nav race; `nav_req` lets only the
  newest continuation apply (`navigate_journal`).
- **`remote_row` uses the same `data-testid` as local rows**
  (`logseq_db_<name>`) so `.last`/`w/-query` locators hit it.
- **e2ee password modal**: `db-worker/ui-request` broadcast →
  `Ui_requests.handle` → password dialog (`e2ee` flow in
  `dialogs_view.ml`); the modal must not appear when keys already exist.
- **cmdk `(Dev)` RTC commands**: Start/Stop/Validate entries invoke
  `db-sync-start`/`db-sync-stop`/`db-sync-validate` via
  `thread-api/*`; `Rtc_ops.start` pushes `sync-app-state` +
  `set_sync_config` first.
- **RTC tx element**: hidden `data-testid="rtc-tx"` div renders
  `{:local-tx N, :remote-tx N}` EDN — the e2e `rtc/with-wait-tx-updated`
  reads it. `worker_events` dedupes identical `rtc-sync-state` payloads
  (`last_rtc`) and debounces `sync-db-changes` → `schedule_reload` (150ms,
  defers while an editor is open) — without it the broadcast flood
  starves typing.
- **Asset upload**: hidden `#upload-file` input + `Upload an asset` slash
  command → `db-based-save-assets!` (pfs write + Asset-tagged block) →
  `.ls-block img` renders from `logseq.property.asset/type` blocks.
- **`/query` slash command** → Query block with `.cp__query-builder`
  (issue-651): `run_query_command` in `editor_actions.ml` transacts a
  query block + code-type value block in one batch (advanced variant gets
  `logseq.property.node/display-type = :code` + `code/lang clojure`).
- **Extends picker**: class/property rows render with
  `.ui__dropdown-menu-content` toggle menu; the `/extends` command path
  filters `logseq.class/*` extends candidates.
- **Status/priority slash commands apply closed-value properties**:
  `rtc-task-blocks-test` needs `apply-closed-value` on status/priority
  change (worker-side `closed-value` property ops).
- **Stress-test seeding is deterministic**: `seed-long-nested-page!`
  uses `java.util.Random` seeded per run — failures reproduce at the same
  tree position across runs, which made the reparent-detach race
  diagnosable.

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
| slash/`#` 命令弹窗 | editor autocomplete | `src/cmdk/` + `popups_state.ml`（`/`,`#`,`[[`,`:` 触发；`((` 为已废弃写法，仍打开同一 node-reference 弹窗，`.ui__popover-content`，`a.menu-link.chosen`）|
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
- same-batch create+drop 容错（lui PR #75）：keyed remount 在同一 flush 内 create→insert→drop 的节点，DOM apply 按 batch 末状态找不到 platform_node 导致整个 flush abort（e2e 里表现为 Meta+k 打不开 cmdk——`resync_open_editor` 在同一 flush 重建并卸载了 editor 子树）。DOM apply 现在跳过 current∪previous 两边都解析不到的节点。
- dropdown dismiss / modal hit-testing / retained-store 顺序（lui PR #65）。
- DOM 插入索引按实际挂载父节点计数（lui PR #76）：`visible_child_index` 原先按节点类型估算（只跳过 ContextMenu/DropdownMenu/Toast/modal/tooltip），portal 子节点、从未挂载的 dyn/`nothing` 段和同 batch create+drop 的节点仍计入索引，任何 overlay 挂载（页面菜单、toast、对话框）都会抛 `DOM child index is out of bounds` 并 abort 整个 flush（view-basic/tag-basic 曾因此回归）。现在改为 `platform_node.parentElement = container` 实测计数，原来的 kind 启发式 `child_hidden_in_parent` 被这条规则完全覆盖并删除。


## Graph navigation

`logseq.e2e.graph-navigation-basic-test` green: 8 tests, 29 assertions.

### Route loading contract

- `Router.resolve` = `parse_hash` → `Navigate_to` → `load_route` → `flush`.
  `Model.Page s` resolves via `thread-api/get-page-route-info` (name /
  uuid / lookup-ref all accepted), then `fetch_blocks`
  (`thread-api/get-page-blocks-tree`), then `Page_loaded` + `fetch_refs`.
- Worker `sync-db-changes` broadcasts dispatch to `Router.reload`, which
  re-runs `load_route` for the current route WITHOUT `Navigate_to` — the
  existing `route_page` stays mounted until the fresh one lands (no blank
  flash). This broadcast fires on every committed tx, including ops the
  page itself just issued.
- **Stale-load guard (load-bearing)**: every async page loader re-checks
  `!Runtime.current_route` before sending `Page_loaded`
  (`router.ml` `stale`, `outliner_ops.refresh_page`). Without it, a reload
  for route A started before a navigate to route B resolves last and
  overwrites `route_page` — the view renders page A under route B and the
  editor never appears on the new page. The guard buys nothing for
  loaders keyed off a different ref (`Journals_loaded` etc. are
  route-independent).

### Block tags on page load

- `Decode.block_of_wire` reads `block/tags` into `block_tag_ids`; items
  may arrive as `Wire.Int`, `Wire.Int64`, or `Map {db/id}`.
- `Outliner_ops.resolve_block_tags` batch-resolves titles through
  `thread-api/get-blocks` `[{id, opts:{}}]` → rows of `{block, id}` and
  fills `block_tags`. `Tree.tags_el` renders `.block-tags > .block-tag`
  chips, skipping tags whose `#tag` text still appears in `block_title`.
- ALL THREE `get-page-blocks-tree` consumers must call
  `resolve_block_tags`: `router.fetch_blocks`, `sidebar_state` local
  `fetch_blocks`, `cmdk_state.load_page`. Missing one leaves
  `block_tags=[]` → no `.block-tag` chip after `apply_tag` (the
  `sync-db-changes` reload races the `Page_loaded` from `refresh_page`
  and used to win).

### Create-page → editor flow

`apply-outliner-ops create-page` → `goto_page` (`get-case-page` →
`load_page` → `Navigate_to` + `Page_loaded` + `set_location_hash
"#/page/uuid"`) → `Editor_actions.append_block` inserts the first block
and sets `S.editing` → `.editor-wrapper textarea` mounts. Search's
"Create page called 'X'" row is upserted synchronously on input (worker
search may lag).

### Tag application (`popups_state.apply_tag`)

- Existing class (`db/ident` present) → `save_and_tag`.
- Plain page → `thread-api/convert-page-to-tag` → `save_and_tag`.
- Otherwise → `create_and_tag`. `save_and_tag` =
  `apply_and_refresh [save_block; set_block_property "block/tags"
  (Wire.Int dbid)]`.

### Misc contracts

- `Sdk_config.write_config` must include a `block/uuid` on the file-block
  map (worker file-block schema requires it); `get_configs` treats all
  four positional args as keys.
- `.toolbar-dots-btn` belongs only to the header (cljs convention); the
  sidebar "More" button uses `.sidebar-dots-btn` — Playwright strict
  mode fails on a second `.toolbar-dots-btn`.


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

## Page title actions + properties-area mount (e2e: `block_property_basic_test`)

- **`.ls-page-title-actions` is LUI-rendered, not view-injected**: cljs
  `db-page-title-actions` is part of the page-title component — "Add
  icon" (only while the page has no icon) + "Set property" (pages) /
  "Add tag property" (tag pages). `mount_page_area` used to treat an
  existing `.ls-page-title-actions` as "already mounted" and skip, so
  once LUI rendered the Add-icon button the properties area +
  `.ls-bidirectional-properties` never mounted on plain pages.
  `page_title_el` now renders the full action set and
  `mount_page_area` mounts idempotently: marker on `.page-inner`
  (`data-props-mounted=<uuid>`), refresh registered on `.page-inner`
  (survives actions-node replacement by LUI re-renders), stale
  area/bidi removed on remount.
- **Detached area elements must not be the refresh registration
  container**: `mount_block_area` previously registered the
  `.ls-properties-area` element itself with `S.register_area`, but the
  element stays detached while a block has no visible rows and
  `live_areas` prunes detached containers — a property tx landing
  later found no registration, so pills never re-rendered. The
  always-connected `.ls-block-content-indent` is the registration
  container now.
- **Page icon replaces the bullet**: cljs renders `.ls-page-icon`
  inside `.block-control-wrap.is-with-icon.bullet-hidden`; as an outer
  sibling the `a.block-control` bullet kept intercepting pointer
  events.
- **One `.ls-foldable-title-control` per foldable section**: cljs puts
  the fold arrow only on the outer section header; per-group ref
  titles are plain headers. `foldable_title` takes
  `~control:false` for `ref_group`.
- **Select item text needs the leaf span**: `properties_select`
  `item_el` built `span.font-normal` carrying the item title but never
  appended it to `span.flex-1` — every select row rendered empty, so
  `getByText "New option:"` found nothing.
- **One `ls:editor-command` listener per command**: both
  `editor_keys` and `properties_view` listened for "Add property" and
  each opened the dialog — two `.cp__select-input` mounts broke
  `input[placeholder]` strict mode. `properties_view`'s
  `open_for_current` (editing block > selected > page) is the single
  path now.
- **`createJournalPage` resolves the worker-assigned uuid**: journals
  get a day-derived `00000001-YYYYMMDD-…` uuid from `create-page`, so
  `create_page_with_flags` must `get_entity` the *returned* uuid, not
  the caller's random one.
- **View-head action buttons need click wiring**: the unlinked-refs
  search toggle (`button:has(.ls-icon-search)` →
  `Unlinked_toggle_search`) rendered `.view-action-search` but the
  button dispatched nothing.

## Property value editing (e2e: `property_basic_test`, `block_property_basic_test`)

- **`replaceChildren` fires `blur` on a focused child before
  `isConnected` flips**: when a refresh re-renders the properties area
  (`render_block_area` → `area_el.replaceChildren`), a focused value
  textarea gets a synchronous `blur` while it still reports connected.
  A `blur → commit` handler that runs inline therefore nukes the edit
  session on every routine refresh — the editor closed the instant a
  commit tx round-tripped. `edit_text_cell` defers the commit one tick
  (`set_timeout` + `el_is_connected` re-check): a detached editor is
  skipped, a real user blur still commits. Any future blur-driven
  commit near a `replaceChildren`/innerHTML refresh needs the same
  deferral.
- **Clicks on editing-cell chrome must not blur the textarea**: the
  `.property-pair > .ls-block` row container is clickable, and a
  mousedown on the editing cell's padding lands on the `.jtrigger`
  chrome (tabindex=-1) — focus moves off the textarea, blur-commits,
  and `*:focus` then resolves to the div (playwright `fill` times
  out). The editing cell eats `mousedown` on non-editable targets via
  `preventDefault` so focus stays in the textarea.
- **Every editable property cell goes through `edit_text_cell`, not an
  ad-hoc input**: `number_cell` used to mount its own
  `<input type=number>` outside `active_editor` tracking, so a
  commit-triggered pill-strip rebuild destroyed the focused input
  mid-`press-seq`. Now number/date-adjacent text edits share the
  single editing surface (`active_editor` keyed
  `(block_uuid, ident)`), which is also what lets a refresh re-mount
  the editor instead of losing it (`has_active_edit` /
  `take_pending_edit` in `render`).
- **Property textareas are not `stale_block_editor`s**:
  `editor_keys.on_keydown` routed a TEXTAREA inside `.ls-block` to
  `on_normal_key` (meta+a → outliner `select_all`), which stole
  `ControlOrMeta+a` inside property value editors. The guard now
  excludes targets inside `.property-value-container`.
- **Dialogs are a singleton**: `properties_dialog.open_dialog` runs
  `S.close_overlays ()` before pushing its overlay — a second "Add
  property" while one is open must not stack.
- **Overlay outside-close mirrors shui**: a document-level
  `mousedown` (capture) drops every overlay stacked above the
  innermost overlay containing the target (all when outside any);
  installed lazily on first `push_overlay`.

## Explicitly not ported (product decisions)

- **Graph view canvas** — the pixi.js page/local graph renderer is
  dropped per product decision; the sidebar "Page graph" tab and any
  `#/graph` route render an empty/minimal surface, and graph-navigation
  e2e coverage is out of the acceptance set.
- **`((uuid))` block refs in content** — deprecated by product
  decision; titles parse `((…))` through the same page-reference path
  as `[[…]]` (no distinct block-ref rendering or popup).

## Export page / Publish page dialogs (deps/ui/src/export/)

- **OPML/HTML are client-side in cljs too** (`handler/export/{opml,html}.cljs`
  fetch `export-get-blocks-data` then walk a `mldoc` AST). `mldoc` is a
  native-only opam lib, so `export_formats.ml` re-implements the same
  shape as line-based converters: `- `-bullet items, indent counted in
  `export-bullet-indentation` units, non-bullet continuation lines join
  the current item's text with a space. A bare `-` line is an empty
  item (`<outline text=""/>` / `<li></li>`). Inline HTML covers the
  mldoc constructs the exporters emit (`**`, `~~`, `++`, `^^`,
  `` ` ``, `$$`, `[[p]]`, `[l](u)`, `{{m}}`, `_{}`, `^{}`, `*i*`,
  `_i_`, `#tag` → `a.tag[data-ref]`); constructs outside that subset
  render as literal text.
- **`export-get-blocks-data` map keys are keywords** (`:content`
  `:format` `:title`), not strings — a `W.String` lookup misses.
- **OPML `<title>` is `untitled` for page exports**: cljs passes a
  coll `[page-uuid]`; the worker only resolves `block/title` when given
  a bare uuid, so `untitled` is faithful cljs behavior.
- **EDN preview is single-line**: cljs `pprint`s the worker result into
  the textarea; the port prints `Edn.to_string` (same data, no
  pretty-print).
- **Selects have no `value` attribute**: React sets `.value` as a
  property; the port emits `selected` on the matching `<option>` for
  the initial render only (browser tracks changes after).
- **Publish asset-upload sub-flow is not ported**: cljs
  `publish-page!` first uploads page assets to logseq.io; the port
  POSTs `build-publish-page-payload` transit + `x-publish-meta` (with
  the underscore-named meta keys `graph` `page_uuid` `block_count`
  `schema_version` `format` `compression` `content_hash`
  `content_length` `owner_sub` `owner_username` `created_at`) and
  optional `:page-password` only.
- **Conditional chrome uses `if_`, not `dyn`+empty `box`**: cljs
  `when`/`when-not` unmounts the checkbox check svg, the eye toggle,
  and the Copy/Save row; `if_` is the matching primitive (a `dyn`
  branch returning `box` leaves a stray `.lui-box` div).
- **Persisted export options** read/write the cljs localStorage keys
  `copy/export-block-text-{indent-style,remove-options,other-options}`
  with cljs shapes (`#{…}` removal set, `:other-options` map with
  `keep-only-level<=N`).
- **Appearance popup** — cljs `:ui/toggle-appearance` shows a compact
  `#appearance_settings.cp__settings-appearance-dialog-inner` panel
  anchored under `.toolbar-dots-btn` (theme picker, font, wide mode,
  brackets, accent color). Ported in `Settings_page.appearance_body`
  reusing the settings row renderers; dismissal uses a transparent
  backdrop instead of shui's popup layer. Note for the framework: LUI
  retained-store teardown can re-parent detached nodes, so
  `Event.target.closest()` inside a document-level click handler is
  unreliable when the clicked subtree was unmounted mid-dispatch —
  DOM hit-testing (backdrop) is the robust equivalent.
- **`#/graphs` row menu divergence** — our local-graph row menu keeps a
  "Delete remote graph" item so e2e can reach remote-delete when logged
  in; cljs only shows it on remote rows.
- **sdk `get_entity` resolves names via `get-case-page`, then re-fetches
  by uuid through `get-blocks`**: get-case-page returns raw entity attrs
  (property values as bare eids, no synthesized `block/properties`);
  the sdk entity shape needs the get-blocks wire (eid->{id} stubs,
  display-properties merge). cljs `editor.getPage/getBlock` on a name
  yields the full entity map, so a second fetch restores the shape
  while keeping exact `:block/title` resolution.
- **sdk `remove-block-property` drops the rendered row eagerly**:
  the `sync-db-changes` → route-reload path is debounced (~80ms), so an
  api caller asserting on the DOM right after the promise resolves
  would still see the stale row. `Properties_area.drop_row` removes
  `.property-pair`/`.bottom-property-pill` rows matching the property
  title scoped to the owning block/page area; the debounced refresh
  re-renders the same state.

## Cmdk (e2e: `cmdk_scroll_basic_test`)

- **The `:recently-updated-pages` group is filtered by
  `search/fuzzy-search`**, not substring (`core.cljs` `load-results
  :recently-updated-pages` → `search/fuzzy-search recent-pages q
  {:extract-fn :block/title}`). Fuzzy = subsequence match over
  `clean-str` (lowercase, `[ \/_\]\(\)\[]+` stripped). A substring
  filter drops recents as soon as the query is not a contiguous match
  (e.g. typing one extra char), shrinking the visible result set —
  `cmdk-keeps-results-visible-while-searching` counts on them staying.
- **cljs `:nodes` results come from `search-blocks`** (worker FTS), so
  keystrokes do not clear the rendered list: results are only replaced
  when the async search resolves. The OCaml port already keeps
  `v.groups` while `refresh` is in flight — the stale-input check in
  `apply_results` (`v.input <> q`) must stay.

## Editor (e2e: `editor_basic_test`)

- **Shift+click on the page title opens the page in the right sidebar
  and must NOT enter title edit.** Two click paths reach
  `Title_edit_start`: the `title_content` `.block-content` handler and
  the `.ls-page-title` wrapper handler in `page_title_el` (which fires
  for any descendant click whose target has no `id` — `targetId`
  serializes to `""`, so `target = ""` matches `.block-title-wrap`
  too). Both must guard on `payload_bool "shiftKey"`; the wrapper
  handler lacked the check, so shift+click swapped the title into the
  editor mid-dispatch — Playwright's real click then saw its target
  element detached before `Sidebar_state.on_doc_click` ran.
- **`#/` (Home) is the journals stream, not today's page.** cljs
  `route.cljs:go-to-journals!` routes to `:home` (or `:all-journals`
  only when a custom home page is set), and `:home` renders the full
  journals list. `router.ml:load_home` must call `load_journals` (and
  install it in `reload_current_view`), and `page.ml` `page_view_of_model`
  `Home` renders `journals_view` whenever `m.journals` is non-empty —
  the single-journal fallback is only the not-loaded-yet state. Cmdk
  `go/journals` resolves to `#/`+`Model.Home`; when the hash is already
  `#/` `nav` must still call `Router.resolve ()` or the view never swaps.
- **Vite must define `process.env.NODE_ENV` for the IIFE bundle.**
  `@tanstack/virtual-core`'s `Virtualizer` constructor reads it
  unconditionally; without a `define` the lib/iife output throws
  `ReferenceError: process is not defined` at first use and the whole
  virtualization path is dead.
- **Virtualized scroll-driven selection is append-only.** cljs
  `components/block.cljs` `items-rendered` calls
  `highlight-selection-area!` with the rendered-range boundary
  (`virtual-range-boundary-id`: last rendered row scrolling down, first
  scrolling up) and `append?` true → `conj-selection-block!`. So
  `Block_selection.extend_to` must UNION `range_between anchor boundary`
  into `S.selected`, never replace it: the spacer re-measurement can
  clamp `scrollTop` and emit publishes that look like scroll-up, and a
  replace-semantics extend collapses the selection to the mounted window.
  Direction comes from the `scrollTop` delta on the scroller, not from
  the rendered start-index delta (overscan growth changes the start index
  without any scroll).
- **Multiple `Virt_list` instances share `#main-content-container`.**
  Stale lists from previous views (e.g. journals) keep publishing during
  the current page's scroll; their `key_of` yields ids that are not in
  the flat block order. `Editor_actions.range_between` must return `[]`
  when either endpoint index is `-1` — otherwise the clamp produces a
  bogus 1-element range that nukes the selection.
- **`get_selected_blocks` (sdk) reads selection state, not the DOM.**
  cljs `state/get-selection-blocks` returns the full selected set;
  unmounted rows under virtualization still count. `Platform.
  selected_block_uuids` (DOM `.ls-block.selected`) is only the mounted
  subset — `sdk_ui.get_selected_blocks` must go through
  `Editor_actions.selected_uuids` (document order).
- **`S.selected` is a uuid set (lexicographic, not document order).**
  Any caller that needs document order — move-block ranges, multi-block
  ops — must use `selected_uuids`/`range_between` over `flat_visible`,
  or the worker's `non_consecutive` check misfires and
  `sort_non_consecutive_blocks` silently drops blocks (e.g. the Page
  tag block in `move-pages-to-library`).
- **`Virt_list` overscan is 5 (upstream default).** The cljs virtuoso
  unmounts aggressively; e2e asserts rows actually unmount
  (`journals-list-remounts-*` watches row 0 disappear). Playwright
  "visible" = non-empty bounding box, so off-viewport-but-mounted rows
  still count.
- **`Virt_list` rows are nested under `.ls-virt-spacer`**, so the
  virtual-scroll IO selector must be
  `[data-virtuoso-scroller] [data-index]` (descendant), not `>`.
  `Virtual_scroll.sync` has to be driven from `measure_rows` — it was
  previously dead code.
- **Slash-menu trigger parity** (`handler/editor.cljs`): `/` opens the
  menu only when the last char is `/` AND (`re-find #"(?m)^/"` OR the
  char before it is space/tab) — not mid-word.
- **`:db-worker/outliner-op-perf` console contract:** the e2e suite
  greps worker console lines for `:op-names`. The worker only emits
  them when the op carries `ui/perf-id` AND the worker context has
  `dev?` true (UI sends it from `Platform.rtc_test_mode()` =
  `?rtc-test=true`, which all e2e URLs carry). `outliner_ops.ml` stamps
  `ui/perf-id` on every `apply-outliner-ops` call.
- **Comments header title is editable inline:** clicking `.ls-comments-
  title` swaps to `.ls-comments-title-editor` (`comments_view.ml`
  `header` wraps the label in `dyn` on `Comments.editing_sig`).
- **OCaml pitfall — `if … then match … ; match …`** swallows the second
  expression into the then-branch (`sidebar_state.ml` `on_doc_click` /
  `on_doc_keydown` Escape had dead-code branches until parenthesized).
- **Melange pitfall — DOM property reads must not be `unit ->`.**
  `external x : unit -> t = "prop" [@@mel.scope "o"]` emits
  `o.prop()` — a *call* — not `o.prop`. Declaring
  `document.activeElement` that way threw `TypeError` on every call,
  killed `apply_focus` inside its `setTimeout`, and left
  `S.pending_focus` armed forever (next char went to a stale buffer,
  caret stayed at end). Correct binding is a value read:
  `external active_element : el option = "activeElement"
  [@@mel.scope "document"] [@@mel.return nullable]`, call sites use it
  without `()`. Same shape fixed in `popups/dom_ext.ml`.
- **`S.set_silent` vs `S.set` for editing transitions.** `set_silent`
  only stages the signal (`Signal.update`); `S.editing()` still returns
  the OLD value until the next flush, so the old textarea stays mounted
  and swallows the next keypress (chars landed in the old block:
  `alphamiddle-omega`). `S.set` publishes synchronously — the old
  textarea unmounts immediately. Any edit op that ends an editing
  session (`split_at_cursor`, `insert_sibling_after`, …) must use
  `S.set` before the next keypress can arrive.
- **pending-focus window contract.** `with_focus_after`/`request_focus`
  arm `S.pending_focus`; `apply_focus` must NOT consume it until
  `document.activeElement` actually *is* the target textarea —
  existence in the DOM is not enough (the probe ran before the real
  focus landed, consumed pending, and the caret defaulted to 0).
  Keypresses arriving in the window route through
  `editor_keys.on_pending_focus_key`: printable chars patch the edit
  buffer AND mirror into the mounted textarea (`el_set_value` +
  `el_set_selection_range`); structural keys (Backspace/Delete/Enter/
  Tab) queue onto `S.pending_focus_actions`, replayed by
  `run_pending_focus_actions` once focus is verified. If the freshly
  focused node is replaced before the next keypress (refresh/reconcile),
  `on_keydown`'s rearm clause (`Some e, _` non-targets) re-arms
  `pending_focus` and reschedules `apply_focus` — required because LUI
  re-renders can swap the textarea node after focus landed.
- **cmdk move-blocks mode is scoped to `:nodes`.** cljs opens it via
  `go-to-search! :nodes` (filter-group `:nodes`) — only the nodes group
  + create row render. Without `filter = Some G_nodes` the recents
  group also matches (e.g. a just-visited page "Library"), producing
  two `[data-testid="<title>"]` spans and a playwright strict-mode
  violation.
- **Every store schedules a debounced `wal_checkpoint(TRUNCATE)`**
  (cljs `db-core.cljs` `schedule-wal-checkpoint!`, 2000ms idle, keyed
  by repo). The OPFS pool runs `journal_mode=WAL` +
  `wal_autocheckpoint=0` + `locking_mode=exclusive`, so without the
  idle checkpoint `db.sqlite-wal` grows unboundedly — under sustained
  commit bursts (the e2e suite seeds ~30 journals) it exceeds the
  access-handle write cap and `sah.write()` returns
  `FILE_ERROR_NO_SPACE` (-8), surfacing as a permanent SQLITE_IOERR on
  every subsequent commit. Ported to
  `db-worker/lib/graph_store.ml:schedule_wal_checkpoint` via
  `Timers.set_timeout`, fired after each `store`'s transaction.
- **Lazy-state readers must `S.ensure` before `S.signal`/`S.state`.**
  `block_row_static` (linked-reference rows) called `S.signal()` without
  `ensure`; on a journals refresh the first mounted row is a ref row, so
  `state ()` hit `failwith "editor state not mounted"` mid-mount. Worse,
  the throw happens inside a `Runtime.flush` effect: the failing effect
  stays queued and *every subsequent flush dies on the same exception* —
  the MutationObserver driven publish never fires again and the page
  freezes with boot complete. Any `S.*` read inside a component body
  needs `ensure` first (or a not-mounted fallback).
- **LUI `InsertChild` cannot use a bare DOM index.** In one batch a
  child may be created then dropped later, or a lower-indexed insert may
  land after a higher-indexed one — `insertBefore` with the stored index
  then throws `IndexSizeError`, and because the batch is mid-apply the
  store and DOM diverge permanently (cmdk reopened empty, suite died at
  the next test). `lui_web_apply.insert_child_anchored` anchors on the
  next retained sibling whose DOM element is already seated in the
  target container, falling back to append (lui
  `devin/remove-child-order`).
- **`<raw-text>` placeholders need a live-node backlink.**
  `Editor_dom.replace_all_raw_text` swaps `<raw-text
  data-raw-text="s">` for a real text node via `replaceWith`; after the
  swap the LUI node's element is DETACHED — later `data-raw-text` attr
  writes land on a dead element (dynamic `D.txt` inside `dyn` never
  updates, e.g. `[[uuid]]` `a.page-ref` inner span stayed empty after
  `thread-api/pull` resolved) and `DropNode` removes nothing. The
  placeholder now keeps `__lsTextNode` pointing at the live node
  (reused on re-insert); `dom_adapter.apply_attrs` forwards
  `data-raw-text` writes to `textNode.data` and adapter `cleanup`
  removes the live node.
- **Sidebar `dyn ~equal` must compare contents, not shape.**
  `left_sidebar_view` favorites/recents used
  `~equal:(fun a b -> (a = []) = (b = []))` — once the list was
  non-empty every later load compared equal and the sidebar froze on
  the first render (stale favorites across the whole suite). Compare
  `List.map (fun p -> (p.page_uuid, p.page_title))`. Same class of bug:
  both loads also need a generation counter (`favorites_gen`/
  `recents_gen`) — a load started on page A can resolve after
  navigation and clobber page B's list.
- **`toggle_favorite` reads the worker, not the cached signal.** The
  `favorited` signal still holds the previous page's flag right after
  navigation; toggling from it can write the inverted value. Query
  `thread-api/favorited-page?` at toggle time, then
  `set-page-favorite`.
- **pending-focus window: shift+arrows must be queued, not
  swallowed.** `on_pending_focus_key`'s fallthrough only
  `preventDefault`ed, so `Shift+ArrowUp` arriving while the editing
  textarea was mid-remount never entered block selection — the
  following Tab hit `indent_or_outdent`'s `[editing-uuid]` fallback,
  which is a no-op on a first child (multi-select indent did nothing
  and the undo history desynced). Shift+ArrowUp/Down now queue
  `shift_arrow_select`: replayed after focus lands it runs
  `exit_edit ~select:true` when still editing, `extend_selection`
  otherwise.
- **`#` tag menu suppresses "New tag" on any exact-title match.**
  cljs hides the create row when the text matches an existing page OR
  class (private classes included); `Tag_search` now checks an
  `except-private-tags=false` `get-all-classes` list
  (`tag_exact_titles`) — otherwise `#Journal`-style inputs offered a
  create row the worker then rejects.
- **One `#today-queries` render site.** `page.ml` rendered the
  today-queries block twice (duplicate ids, strict-mode violations);
  keep the journals-view instance only.
- **Page-title focus targets `.ls-page-title`.**
  `editor_actions.focus_page_title` must select the title textarea via
  `D.query_selector ".ls-page-title"` (added to `editor_dom`).


## Editor / virt merge-regression notes (post-merge follow-up)

- **`Virt_list.enabled_min` keeps `virtualize &&` in the gate.**
  `(force || (virtualize && count >= min))` virtualizes EVERY caller
  under `?virtualized=true` — including `blocks_inner` invocations that
  pass `virtualize:false` (journal items' inner block lists), which
  nests `[data-virtuoso-scroller]` inside the outer journals scroller
  (`journals-list-does-not-nest-*` counts 9). Force must amplify a
  `virtualize:true` caller, never override `virtualize:false`.
- **Row measurement can't be purely debounced.** A 50ms debounce that
  resets per mutation starves under scroll churn — freshly mounted rows
  stay at estimate height and overlap. The row MutationObserver must
  measure synchronously (same microtask) when a batch has `addedNodes`,
  debouncing only pure subtree churn.
- **translateY precision matters.** `%.2fpx` truncation (~0.005px per
  row) accumulates a sub-pixel boundary overlap that
  `mixed-height-virtual-page-*` detects (`rect.top < prev.bottom`); keep
  `%.4fpx`.
- **`<raw-text>` swap must run in the observer microtask.** Coalescing
  it into the 60ms debounced doc-scan leaves the placeholder empty for
  ~4 frames; `*-first-frame-*` tests read `.page-ref`/`.block-title-wrap`
  textContent on every rAF after Escape and fail on the blank frames.
  `register_doc_scan ~sync:true` runs such scans inside the mutation
  callback, before paint.
- **Undo must bypass the `base` resync gate.** The gate (`buffer = base`
  ⇒ safe to overwrite) exists so remote refreshes don't clobber typed
  text, but `undo`/`redo` deliberately revert; when the pre-undo edit
  hadn't committed (400ms `schedule_save` debounce), `buffer <> base`
  and the gate left the textarea stale. `resync_open_editor ~force:true`
  from undo/redo.
- **In-editor paste needs the text/plain fallback.** `paste_into_editor`
  pastes stored block trees only when the event's text/plain equals what
  our copy wrote (`S.clipboard_text`); any other text (external, html's
  text/plain sibling) splices into the live textarea at the cursor.
- **Pointer range selection is orthogonal to dnd-kit.** `Block_dnd`
  (drag-move) does not cover pointerdown→scroll→pointerup selection:
  `Block_selection.pointerdown/pointerup` document listeners plus
  `Virtual_scroll.extend_drag`/`sync` from `Virt_list` must stay wired.
- **`.block-add-button` injection must be a sync doc scan.** cljs renders
  `add-button-inner` inside the page component, so the row exists
  atomically with the blocks; the OCaml imperative `MutationObserver`
  port debounced it 60ms, so a just-remounted journal item measured
  28px short (the button's row) before the injection landed
  (`journals-list-remounts-*`). `register_doc_scan ~sync:true` — and
  because the scan now revisits the button on every flush,
  `refresh_opacity`/`set_parent_attr` must only write attrs when the
  value actually changed, or the observer spins on its own mutations.
- **Keys in the remount window replay one per focus landing.**
  `on_pending_focus_key` queues structural keys (Tab/Enter/arrows…) while
  `S.editing` is set but the textarea is detached; plain
  ArrowUp/ArrowDown previously fell into the catch-all `prevent_default`
  and were lost. Two subtleties: (a) the queued closure must resolve
  `S.editing_uuid ()` at replay time, not capture the keypress-time
  block, and (b) `run_pending_focus_actions` must pop ONE action per
  focus landing — `enter_edit` updates `S.editing` only after the
  async `title_for_edit` resolves, so a full-batch replay applies every
  follow-up key against the stale editing block (two queued arrows end
  up navigating from the same origin, and a queued Tab indents the
  pre-nav block — `multi-selection-indent-roundtrip-test`). Replays that
  re-arm `pending_focus` (`enter_edit`/`with_focus_after`) chain the
  drain naturally; `request_focus`/`with_focus_after` therefore must not
  clear `pending_focus_actions` — `exit_edit`'s `cancel_pending_focus`
  remains the only abort path.

## Block drag-and-drop (dnd-kit)

- **Block move runs on `@dnd-kit/dom`** (`DragDropManager` +
  `PointerSensor`), not native HTML5 drag events. `deps/ui/src/dnd/`
  holds the Melange externals (`dnd_kit.ml`) and the block-move wiring
  (`block_dnd.ml`); `editor_keys.install_once` keeps only the file-drop
  listeners natively.
- **`draggable="true"` is NOT harmless under PointerSensor**: while a
  pointerdown is active the sensor binds a document capture-phase
  `dragstart` listener that calls `handleCancel` when the target is a
  native draggable (otherwise `preventDefault`) — i.e. a browser HTML5
  drag started on a bullet aborts the dnd-kit activation mid-flight.
  `editor_keys` registers a capture-phase `dragstart` listener at
  install time — earlier than any sensor binding, so it runs first —
  that `preventDefault`s + `stopImmediatePropagation`s native drags
  started from a `.bullet-container`: the browser never begins an HTML5
  drag and the sensor's listener never sees the event.
- **Activation is `Distance(4)` with `preventActivation: false`**: the
  default `preventActivation` refuses drags whose pointerdown lands
  inside an interactive element (`a.bullet-link-wrap` wraps the bullet),
  and a bare `undefined` constraint would activate on pointerdown.
- **Collision = per-block droppables ranked by nesting depth**:
  `defaultCollisionDetection` (pointer intersection) picks the
  highest `collisionPriority` droppable, so `block_dnd` sets
  `collisionPriority` to the block's `.ls-block` ancestor count —
  innermost block wins, which reproduces `closest('.ls-block')` from
  the native `dragover` handler.
- **Registration is MutationObserver-driven**: draggables
  (`.bullet-container[blockid]`) and droppables (`.ls-block[blockid]`)
  are discovered on every DOM mutation; disconnected elements are
  destroyed + swept each batch. `dragstart`/`dragmove`/`dragover`/
  `dragend` monitor events carry `operation.source/target`; `dragover`
  fires only when the collision target changes (use `dragmove` for
  pointer coordinates — `nativeEvent.pageX`/`clientY`).
- **The `drop_target` "no-target keeps last" quirk is preserved**: the
  native `dragover` handler did `| None -> ()` when no `.ls-block`
  matched, so the previous valid target persisted while hovering
  invalid areas; `block_dnd` reproduces that.
- **File drop stays native**: dnd-kit has no file-drop concept; the
  document `dragover`/`drop` listeners now only act when
  `dataTransfer.files` is non-empty and call `Asset_dom.upload_files`
  — same handler as before, split from block-drag. Synthetic e2e
  `DragEvent`s take this path unchanged.
- **Tag/ref anchors (`views_table.ml`, `page.ml`) keep
  `draggable="true"` but were NOT routed through the manager**: their
  payload is `dataTransfer` `text/plain` data consumed by
  `on_editor_drop` (property rows), not the block-move path, and dnd-kit
  sensors don't produce a native `dataTransfer` payload a `drop`
  listener could read. Routing them through the manager would need a
  separate drop-target path; out of scope for the block-move migration.
- **Journal views have no `Runtime.current_page`**: since the journals
  scaffolding sweep, journal routes populate `current_journals`
  (`get-latest-journals`, newest-first) and leave `current_page`
  `None`. Anything that resolves "the current page" must fall back to
  `current_journals`: `drop_dragged_block` `"top"` finds the journal
  page containing the target block, and `upload_files` treats the head
  of `current_journals` as today's journal — both were silent no-ops
  before that fallback was added.
- **Verified locally** (Playwright, same steps as
  `outliner_basic_test.drag-block!`): `top` (first block + near-top ≤16px),
  `nested` (x-offset > 50), `sibling` all reorder via
  `A.drop_dragged_block`; file drop creates `.asset-container img`.
  The clj-e2e suite itself is blocked upstream of this change: page
  creation through search throws `Invalid_argument` in
  `apply_pending_batch` (`close_ac` → `set_ac`) on the base build too —
  preexisting LUI bug, so `new-logseq-page`'s `wait-editor-visible`
  times out before any drag test runs.


## Toolchain / test-suite state

- **`bb dev:lint-and-test` baseline** — clj-kondo lint is clean on the
  branch. `cljs:test` now compiles after two strays were removed:
  `src/electron/electron/mcp_transport.cljs` + its test (orphaned by a
  master merge that pulled `2a8e123d92` into the branch although the
  cljs electron implementation was removed in `9d85ac268`), and
  `src/test/logseq/outliner/paste_refs_test.cljs` reverted to the base
  variant (the merged variant required `frontend.worker.plain-value`,
  removed with the cljs db-worker). The node runner then crashes in
  `frontend.components.block.reactivity-test`
  (`unhighlight-blocks!` → `document is not defined`) — **preexisting
  on `devin/native-ocaml-electron`**, verified identical. The
  `frontend.handler.code-test` `save-code-editor-*` cases also fail
  when batched with other namespaces (a sibling registers `repo-a`
  first and the fixture resolves the wrong current repo; passes solo)
  — also **preexisting on base**, verified with the same `-n` batch.
- **Unit tests for the OCaml UI** live in `deps/ui/test/test_main.ml`
  (Melange→node). `Platform.local_storage_*` resolves the storage
  object via `globalThis` and no-ops when absent, because
  `Model.initial` touches storage at module init under node.

## Parity sweep fixes

Visual parity sweep (LUI vs cljs at :3003) — DOM compared region-by-region
via Playwright probes for: #Journal tag page, journal day page (linked
references, block hover, block context menu), slash menu, #tag popup,
[[ autocomplete, properties panel, icon picker, settings dialog,
{{embed [[page]]}}, favorites sidebar.

- **Journals page scaffolding**: `#journals` now wraps items in the cljs
  `div > div > div[data-testid=virtuoso-item-list] > div > .journal-item`
  chain (all-journals custom-scroll-parent layout); the route renders
  inside a `journals-root` wrapper like cljs container.cljs's extra div.
- **content-wrap is route-conditional**: `mx-auto pb-24` +
  `margin-bottom: 120px` only for regular routes; journals/home routes
  keep an empty class and `margin-bottom: 0` (cljs container.cljs:118).
- **home button unmounts on Home route**: emits nothing (cljs
  `when-not home?`), not an empty `.lui-box` div.
- **`{{embed}}` macro**: renders `div.warning` with the
  `block.macro/embed-deprecated` string, matching cljs block.cljs:1951.
- **page-ref `data-ref` is the resolved entity uuid**: `[[name]]` and
  `#[[name]]` anchors update `data-ref` from the resolved uuid via a
  uuid signal (cljs page-reference behavior); `((uuid))` deprecated
  block-ref keeps the same page-reference shell.
- **block/refs entries for existing pages carry `block/name`**: LUI used
  to emit bare `[:block/uuid u]` lookup-refs; cljs `use-cached-refs`
  swaps parsed refs for the cached entity's ref-summary map
  (`db/id`/`block/uuid`/`block/title`/`block/name`/`db/ident`/`block/tags`).
  The worker's `remove-orphaned-page-refs` names refs via `block/name`;
  a bare lookup made a still-referenced page look orphaned → retracted
  mid-tx → the `[:block/uuid u]` assert then threw
  `Invalid_argument(Nothing found for entity id ...)`, failing the whole
  save-block tx. LUI now emits the same select-keys map.
- **Icon picker**: full tabler set (~6203 entries) in
  `icon_picker_names.ml`, filled variants, same grid/tab/search DOM.
- **Slash / # / [[ popups**: group wrapper divs, item rows, status icon
  names and label spans aligned to cljs popup structure.
- **Settings/favorites/tag page/properties/block menus**: verified
  identical after the above; only unfixable noise remains (below).
- **Table header property-column menu**: sort more-options now precede
  the configure items (cljs `more-options` order) with arrow-up/down
  icons, the Configure title is hidden (`with-title? false`), the
  delete row reads "Delete property from tag" on tag pages, and the
  `.ls-property-dropdown` popup is capped at
  `max-height: innerHeight - top - 8` with `overflow-y:auto` (radix
  available-height) so trailing items scroll instead of overflowing
  the viewport. Still missing vs cljs: the Pin/Unpin item — LUI has no
  `logseq.property.table/pinned-columns` rendering support yet.
- **Dynamic overlay containers**: cmdk conditional mounts inside a
  keyed `box` and app overlays inside a keyed `.cp__overlays` div —
  keeps dynamic segments off `#app-container`'s child list so
  nav-time reconciles can't emit inconsistent op batches (cmdk reopen
  crash); cljs mounts these through portals, i.e. their own container
  nodes anyway.
- **Row-select checkbox chrome**: header/row checkboxes carry
  `tabindex`/`aria-checked`/`data-checked`/`data-unchecked` and the
  cljs visually-hidden native input sibling (1px clipped fixed box),
  and the row `select` cell exposes `data-table-row-select="true"` —
  a plain checkbox overlapped the button and swallowed its clicks.
- **Duplicate views head**: the extra `render_head` appended above the
  view grid is gone; the head renders only via `filters_row` inside
  `.ls-view-body` (was the second `Add new view` button).

Known unfixable / nondeterministic leftovers:
- `Revision: dev` vs `16c4ed1a04` in the settings footer — build-time
  revision string.
- cljs popover/menu/input ids are per-mount random (`_r_f_`,
  `base-ui-_r_n_`, `slot__*`, `-hidden-input` id suffixes).
- Wall-clock timestamps, lazy-resolved ref titles, block `selected`
  state, and typed-text leftovers in probes are interaction timing.
- `#Journal` tag save is rejected on both sides ("Can't set tag with
  built-in #Journal" — private built-in class), so seeded probes that
  use it leave the same is-blank block on both.

## Review-pass correctness batch (3e4a41f / ed58c9a)

Findings from the logseq-review-workflow correctness pass, fixed on the
main branch:

- **Modifier shortcuts**: DOM `key` reports the shifted glyph
  (`"Z"`, `">"`, `"H"`), so `Cmd+Shift+Z` redo, `Cmd+Shift+H` highlight
  and `Cmd+Shift+.` zoom never matched. `shortcut_key` lowercases and
  un-shifts symbols for the modifier-guarded arms only — raw keys still
  feed the autopair/`)`/`]` overtype paths.
- **toggle-collapse**: temp-expand now keys off `is_expanded`, so a
  default-collapsed block the user temporarily expanded collapses back
  instead of expanding permanently.
- **Async staleness**: refs/unlinked/page fetch results were sent
  unconditionally; in-flight loads could clobber a newer route.
  `fetch_refs`/`fetch_unlinked`/`fetch_unlinked_refs` take a `~stale`
  predicate and `load_page_ref` captures `!Runtime.load_gen` after
  `incr` and compares at commit time.
- **cmdk move-blocks**: selection was sent in `String_set` uuid order;
  now `selected_uuids` (document order).
- **Numbered-list toggle**: the `W.Map` decode arm was dead (entity
  maps aren't fetched that way); now uses
  `Decode.order_list_type_of_wire`.
- **delete-selection**: entered edit mode on the previous block with
  the raw stored title (id-ref form); now runs through
  `Ops.title_for_edit` like `enter_edit`.
- **cmdk page open**: bypassed `nav_hash` (dropped `?graph-id`) and
  double-loaded (manual prefetch + hashchange reload). Now sets the
  `nav_hash` URL and lets the router load — create-page chains its
  `append_block` through a one-shot `Runtime.on_page_loaded` hook.
- **SDK toasts**: `show_msg` now accepts `opts.key`/`timeout`, returns
  the notification key, and `close_msg` dismisses only that toast
  (`Toast_dismiss_key`) instead of clearing all.
- **Startup repo**: `pick_graph` now follows cljs
  `resolve-startup-repo` — url `?graph-id` → sessionStorage tab graph
  (`ls-tab-repo`/`ls-tab-graph-id`, written on graph open) → first
  repo → Demo.
- **Navigate_to** clears the transient `confirm` (and already cleared
  `page_menu`/`appearance`).

## Review-fix streams (in flight)

Read-only review passes flipped to fix mode on dedicated branches off
the correctness batch; each fixes the findings of its own report:

- `devin/review-fix-perf` — views eager table + refresh rebuild,
  journals parallel fetch + unconditional virtualization, Mutation
  Observer consolidation, root-dyn structural compare → revision
  compare, anchor-pull cache, unlinked-refs lazy fetch, embed/minor
  perf.
- `devin/review-fix-sysadd` — matcher consolidation to `Fuzzy`, shared
  menu-item builder, worker `on_message` chains → one subscription,
  shared wire/fetch helpers, i18n consolidation, dead-code deletion,
  shared icon/textarea builders.
- `devin/review-fix-failure` — worker-client rejection/onerror
  forwarding, unmounted-state command crashes, swallowed exceptions.
- `devin/review-fix-tests` — unit-test coverage for indent/outdent,
  sdk_convert/sdk_util, decoder/encoder pure paths.
- `devin/review-fix-contract` — endpoint/arg/decode contract sweep.
- `devin/review-fix-regress` — cljs parity regression hunt + fixes.

## Page-title locator / property-value DOM alignment

- `extends_cell` now emits `a.relative.tag` / `a.relative.page-ref` (cljs
  `property-block-value` → `page-cp`) instead of
  `span.block-title-wrap`; the extra `.block-title-wrap` under
  `[data-testid='page title']` was a Playwright strict-mode duplicate
  (left-sidebar-basic 4 errors → green).
- `.ls-bidirectional-properties` mounts inside `.page-inner` after the
  title row (cljs sibling placement in `properties-area`), not inside
  `.ls-page-title`.
- Preview popup (`pv_popover`) now also closes on outside click and
  `hashchange`, matching cljs tippy death with its reference node.
- Known parity gap: cljs `bidirectional-properties-section` renders a
  `shui/tabs` UI (per-class tabs + blocks-container); ours renders flat
  `.ls-bidirectional-group` rows. Tracked for the parity sweep.
- `custom_report.clj` dumps `e2e-dump/title-dups-<ts>.txt` on failure:
  every `[data-testid='page title']` match + ancestor chain.

## Regression-pass fixes (navigation / keys / collapse / selection / cmdk)

- **editing.base bookkeeping** (`editor_actions.ml`, `outliner_ops.ml`):
  `merge_next` and the debounced `schedule_save`/`commit` paths now
  advance `base` with `buffer` once the commit lands. Without it, an
  undo after a boundary merge left `buffer<>base`, so
  `resync_open_editor` refused the reverted title and the DOM kept
  showing the merged text (`boundary-delete-and-backspace-merge` e2e).
- **Navigation** (`router.ml`, `sidebar_state.ml`): page-ref clicks go
  through cljs `redirect-to-page!` semantics — `get-page-route-info`
  precheck warns (not navigates) on hidden/private-built-in pages
  (`:nav/cannot-go-to-internal-page`, Recycle exempt) and redirects
  aliases to `alias-source-uuid`; `?anchor`/`?block-id` hash params
  poll-scroll to `ls-block-<uuid>` (uuid → select the block, other
  fragments → 4s `block-highlight`), mirroring `jump-to-anchor!`;
  zoom-out consumes `pending_zoom` on page routes too, so the zoomed
  block stays in edit mode after landing on the parent page.
- **Editing keys** (`editor_keys.ml`, `editor_commands.ml`): `mod+enter`
  cycles `logseq.property/status` (todo→doing→done→cleared→todo) via
  closed-values resolution instead of splitting the block;
  `mod+shift+s` strike-through `~~`, `mod+shift+h` highlight `==`,
  `mod+;` toggle-children-collapse, `mod+,` zoom-out bound in edit mode.
- **Collapse/expand** (`editor_actions.ml`): `mod+up`/`mod+down` —
  editing collapses/expands the open block, selection applies to each
  selected block, otherwise collapses the deepest / expands the
  shallowest-collapsed level (cljs `expand!/collapse!`).
- **Selection**: `mod+a` = select-parent (selection → first block's
  parent, falling back to select-all), `mod+shift+a` = select-all —
  in both edit and normal modes.
- **Cmdk**: `editor/cycle-todo` command arm wired; `#tag` create row now
  issues `create-page` with `class?:true` and navigates to the class
  (cljs opens the tag dialog — no such surface exists here yet).

## Property-e2e sweep (second pass)

- **Zoom-breadcrumb refetch** (`outliner_ops.ml`): `refresh_page` on a
  `Block_zoom` route now refetches `page_parents` (not just
  `page_blocks`) — cljs re-queries the ancestor chain on reload, so a
  renamed parent updates `.breadcrumb` text (`rename` e2e in
  `block_property_basic_test`).
- **Container click handlers need an interactive-hit gate**
  (`dom_adapter.ml`, `page.ml`): the `.ls-page-title` node's `click`
  dom-event is a fallback that starts `Title_edit_start` whenever the
  payload `targetId` is `""`/`page-title`/`page-title-text`. Playwright's
  click on `a.block-control` lands on the id-less bullet/icon child, so
  targetId was `""` and the gate passed — the title editor mounted
  (+54px), then a `sync-db-changes` reflow unmounted it ~1s later,
  shifting `.property-k` upward between Playwright's actionability check
  and click dispatch (`tag-scoped-property-choices` e2e). cljs binds
  title-edit on the `.block-content` pointer-down only. The event
  payload now carries an `interactive` flag
  (`target.closest("a, button, input, textarea, select, summary,
   .block-control-wrap, .bullet-container, .ls-properties-area,
   .ls-page-title-actions, .lsp-hook-ui-slot")`) and both title-edit
  handlers require `not interactive`.
- **Unlinked section gates on an exists check, not loaded refs**
  (`outliner_ops.ml`, `model.ml`, `page.ml`): cljs renders
  `.unlinked-references` whenever the `:block-unlinked-ref-exists`
  resource is true — independent of fold state, since opening is what
  triggers the refs fetch. Our section gated on `unlinked_refs`
  non-empty while the fetch was gated on `unlinked_open`, deadlocking
  the collapsed header out of the DOM
  (`unlinked-reference-filter-and-breadcrumb` e2e). New
  `fetch_unlinked_exists` hits `get-render-snapshots` with the
  `block-unlinked-ref-exists` key on page load/refresh into a new
  `Model.unlinked_exists` field; `fetch_unlinked_refs` stays gated on
  `unlinked_open` (it scans every block/title datom).
- **Property-area refresh preserves nodes** (`properties_area.ml`):
  `render_page_area` builds the candidate DOM detached and swaps children
  only when `innerHTML` differs (`replace_if_changed`) — clearing and
  rebuilding on every `sync-db-changes` churned focused editors and
  element identity across refreshes.
- **Sidebar / modal details**: `ref_group` titles render
  `foldable_title ~control:false` (unlinked-references e2e expects
  exactly one `.ls-foldable-title-control`); the icon-picker popup
  carries the `ls-icon-picker` class (`ls-icon-picker input` locator);
  `#cards-modal` is wrapped in the `.ui__dialog-overlay` /
  `.ui__dialog-content` dialog chrome so overlay-clicks behave like cljs.

Known leftovers:
- Toast auto-dismiss is 5000ms; cljs `notification/show!` defaults are
  1500–2000ms.
- cljs `mod+.` zoom-in is skipped upstream on Chrome (unbound here too).
- `#tag` cmdk create navigates instead of opening the tag dialog.

## Menus & sidebar chrome (parity: `devin/lui-parity-menus`)

- **Block context-menu submenus** (cljs `content.cljs` + shui
  `components.cljs`): sub-content class
  `ui__dropdown-menu-sub-content z-50 min-w-[8rem] rounded-md border
  bg-popover p-1 text-popover-foreground shadow-lg`, `role="menu"`,
  `tabindex="-1"`, positioned at `(trigger.right-4, trigger.top-4)`;
  sub-trigger is a cm-item + `data-[open]:bg-muted` + trailing
  `chevron-right ml-auto h-4 w-4`. "Set icon"/"Add reaction" open the
  icon picker as a right-edge submenu (`emoji_only` gate for the
  reaction picker). Items carry a bare-text label and the full
  `ui__dropdown-menu-item` class incl. `data-[highlighted]:bg-muted`
  + `data-[disabled]:pointer-events-none data-[disabled]:opacity-50`.
- **LUI `if_` is eager** — `Lui_elements.if_ ~test t` evaluates `t` at
  parent construction; a child built from popup state must be wrapped
  in `dyn` over a signal-derived value instead, or it snapshots the
  closed state.
- **Right-sidebar panel chrome** (cljs `right_sidebar.cljs`):
  `.sidebar-item` gets `collapsed`; header gets `rounded-b-md` when
  collapsed; title button toggles collapse, `aria-expanded = not
  collapsed`; `.rotating-arrow` gets `collapsed|not-collapsed`; the
  body keeps `role="region"`/`sidebar-panel-content` and switches
  `hidden` ↔ `initial` (plus `px-2` unless `:search`/`:shortcut-
  settings`). `collapsed?` (panel body) and `props_collapsed`
  (properties section, `not class?`) are **separate** cljs states —
  do not conflate. Middle-click (`which=2`) on the header removes the
  item; context-menu on the header or the `sidebar-item-more` button
  opens the actions menu **at the pointer/trigger**.
- **Right-sidebar actions menu** (`actions-menu-content`): Close /
  [multi] Close others / [multi] Close all / [multi && !collapsed]
  `hr.menu-separator` / [!collapsed] Collapse / [multi] Collapse
  others / [multi] Collapse all / [multi && collapsed] sep / [collapsed]
  Expand / [multi] Expand all / [type ∈ {page,contents}] sep +
  "Open as page".
- **Left-sidebar link-item menu** (`left_sidebar.cljs` x-menu):
  right-click or the `.sidebar-page-actions` dots button on a
  favorites/recents row opens a `ui__dropdown-menu-content ... w-60`
  dropdown at the pointer: [not recent] "Unfavorite" (star-off,
  ⌘⇧F) + "Open in sidebar" (layout-sidebar-right, ⇧Click), each
  `ctx-icon` span `scale-90 pr-1 opacity-80` + `dropdown-shortcut`
  combo kbds.
- **Recents populate only on user navigation** — cmdk
  `goto_page`/`open-node` must call `Runtime.mark_nav ()` *before*
  `Runtime.send Page_loaded`, because sends dispatch `on_sync`
  synchronously and `on_sync` takes the mark to `push_recent`.
- **`/Add property` type picker** lists
  `user-built-in-property-types` in order: default(Text), number,
  date, datetime, checkbox, url, node, asset.

## Asset store (e2e: assets_basic_test)

`url_cache` is keyed `repo ^ "|" ^ name` (`A.cache_key`) — every lookup
must go through it; a bare-file lookup silently yields "" for `src`.
cljs `asset.cljs` `img-src` falls back to a data URL via
`get-asset-file-object-url` when the pfs read lands after first paint;
OCaml resolves eagerly before the view mounts (`Sync.init` /
`sync_assets_after_boot`), so `asset-img` renders a real object URL
immediately and needs no async repaint.

## Cmdk (e2e: cmdk_scroll_basic_test) — visible-results contract

cljs `load-results :nodes` keeps the previous `:items` visible while
the worker query is in flight — keystrokes never empty the result
list. `Cmdk_state.refresh ?clear` therefore skips the synchronous
`apply_results` entirely on the debounced input path (`~clear:false`),
leaving prior groups rendered until the async response replaces them;
every other caller uses the default `~clear:true`.

## i18n: runtime dict loading + literal consolidation

`src/core/i18n.ml` was a stopgap table of English literals behind a
`TODO(i18n)` comment. It is now backed by real dictionaries.

### Dict pipeline (one clear path)

- `tools/dict_gen.ml` (native dune exe) parses `src/resources/dicts/*.edn`
  and emits `src/dicts_gen.ml` — an OCaml module with
  `en : (string * string) array` and
  `dicts : (string * (string * string) array) list` covering all 25
  locale files. Function-valued cljs entries (`(fn ...)` defaults, 12
  keys) are unportable and skipped.
- `src/dune` has a `(rule (target dicts_gen.ml) ...)` that shells out to
  `%{exe:../tools/dict_gen.exe}` against
  `$DUNE_SOURCEROOT/../../src/resources/dicts` (dicts live outside this
  dune-project). Because they are not declared deps, re-run
  `dune build --force` after editing `.edn` files.
- Locale filenames map like cljs `frontend.dicts`: `zh-cn`→zh-CN,
  `zh-hant`→zh-Hant, `nb-no`→nb-NO, `pt-br`→pt-BR, `pt-pt`→pt-PT,
  otherwise the file stem.

### Lookup

`I18n.t key`:
1. `current_lang` reads `localStorage["preferred-language"]` (an
   EDN-quoted string like `"en"`), matching `settings_view.set_language`
   / `boot` — no cljs state. Missing key or `"en"` → English.
2. English resolves through `en_text`: `en_overrides` first (13 keys
   where the shipped OCaml English deliberately differs from en.edn —
   e.g. `ui/true` "Yes", `property/use-choice-in-tag`,
   `view/unlinked-references`), then `Dicts_gen.en`, then the key
   itself. Non-en locales resolve `Dicts_gen.dicts[locale]` with
   `en_text` fallback, so untranslated keys degrade to English.
3. `tf key args`/`t1 key arg` substitute `{1}`..`{n}` placeholders.

Language changes only take effect on the next boot (`set_language`
writes localStorage + `<html lang>`), so `let x = t "k"` at module
scope stays frozen-at-init — same effective contract as before.

### Audit + migration (branch `devin/lui-i18n`)

- ~332 call-site literals moved to `I18n.t`/`tf`/`t1` (or a local
  `let t = I18n.t` alias) across 29 files — menus, buttons, toasts,
  dialogs, placeholders, aria-labels, export/publish/options labels.
- `i18n.ml` keeps 273 named `let x = t "k"` constants + ~25 custom
  helpers (`operator_text`, `timestamp_options`, `delete_*_confirm`,
  `import_finished`, ...). The three identity-`t` stubs
  (`sidebar_state`, `plugins_view`, `cards_view` + a dead one in
  `cards_state`) were removed and their pseudo-key call sites remapped
  to real keys.
- Pseudo-namespace call sites renamed to real en.edn keys
  (`cmdk.groups/*`→`cmdk.group/*`, `shortcut.category/*`,
  `command.<id>` derived from keymap `title` attrs, etc.).
- 41 new keys added to `en.edn` + `zh-cn.edn` (per i18n skill: every new
  key ships a zh-CN translation) with matching `^:key$`
  `always_used_key_patterns` exemptions in `.i18n-lint.toml`.
  `bb lang:validate-translations`, `lang:lint-hardcoded`,
  `lang:format-dicts` all clean.

### Deliberately left inline (dev/debug only)

- `(Dev) ...` command labels and their toasts ("Your graph is valid",
  "Validation failed").
- Brand string `"Logseq %s"`, `"rtc sync"` aria label, font names,
  demo-graph name, `"Ag"` font sample.
- Internal error-state fallbacks in `views_query.ml`
  ("invalid query"/"query failed"/"query error") — machine-ish worker
  error strings, not polished user copy.
- `"then"` keycap chord separator (aria-hidden), `date.nlp/*` English
  parser ids (`nlp_en_names`), icon-name quirk `"InProgress50"` as a
  popup label, `input[placeholder='Enter password again']` e2e selector.

### Verification

- `dune build --force js_app test` clean; `vite build` clean;
  `node _build/default/test/ui_test/test/test_main.js` → 884 checks, 0
  failures.
- `bb test -n logseq.e2e.tag-basic-test` still blocked by the known
  base-branch `new-logseq-page` fixture crash (cmdk "Create page" →
  `MelangeError: Invalid_argument` in `apply_pending_batch`, documented
  above). Reproduced identically on an `origin/devin/lui-ui-rewrite`
  bundle — not introduced by this change.

## Code-block editor (branch `devin/lui-codemirror`)

Real CodeMirror 5 replaces the fake `pre.CodeMirror-line` path for
code-fence blocks (`display-type=code`, or ` ```lang ` fences in
`src_block`). Pure OCaml FFI — no hand-written JS.

### FFI shape (deps/ui/src/editor/code_mirror.ml)

- `external cm : cm_module = "codemirror" [@@mel.module]` binds
  `require("codemirror")` — the CJS `module.exports = CodeMirror`
  object itself. A bare `= ""` external is *wrong here*: melange
  infers the val name and emits `require("codemirror").cm`
  (undefined). Same fix applied to all addon/mode imports:
  `= "path" [@@mel.module]` (module-object binding, harmless to
  reference, and it avoids the ppx `fragile` alert entirely — no
  `[@@@alert]` needed).
- Side-effect imports: closebrackets, matchbrackets, show-hint,
  active-line, `mode/meta`, and all 121 vendored modes
  (`codemirror/mode/*/*`). Sanitized OCaml names
  (`asn.1`→`asn_1`, `haskell-literate`→`haskell_literate`, …). The
  `_imports` list keeps references so bundlers don't drop the
  requires; the values are module objects, not members.

### Mount lifecycle

- `Editor_dom.register_doc_scan ~sync:true` scans
  `.code-editor textarea` on every added DOM root and at startup
  (`scan [document_element]`). `~sync` runs in the observer microtask
  so the editor exists before paint and before `set_timeout 0`
  focus attempts (`apply_focus`/`retry_focus` cover stragglers).
- **The scan must skip textareas already inside `.CodeMirror`** —
  CM's own hidden input textarea also matches `.code-editor
  textarea`, and mounting on it nests a second `.CodeMirror`
  recursively until the renderer OOM-crashes. Guard:
  `D.el_closest el ".CodeMirror" = None`.
- `bound` = nextElementSibling has `.CodeMirror`; `instances` map
  pruned when a wrapper disconnects (`prune`).
- CM mounts in **display and edit mode alike** (cljs renders CM as
  the code surface always). `tree.ml content_or_editor` therefore
  keeps `content_wrapper` for `display_type=code` even while editing
  — the dyn never swaps the subtree, so the mounted CM survives
  edit-state flips.

### Options / DOM parity (cljs extensions/code.cljs render!)

theme `lsradix light|dark` (html.dark → dark), autoCloseBrackets,
lineNumbers, matchBrackets for lisp-like (scheme|lisp|clojure|edn),
styleActiveLine, tabIndex −1, extraKeys Esc + Shift-Enter,
`viewportMargin Infinity` for calc. Mode via `findModeByName →
findModeByExtension → .mime → raw lang`; lang normalized
`edn|clj|cljc|cljs|clojurescript → clojure` (cljs src-cp).

### Events

- `change` → `sync_buffer` (silent, keeps `editing.buffer` + textarea
  textContent) + `Ops.schedule_save` (400 ms debounce →
  `apply_parsed` → worker tx) + `update_calc`.
- `blur` → `blur_commit` when this uuid is the editing block.
- `focus` → `enter_edit` whenever the focused CM is not the current
  edit block — including when nothing was editing (cljs
  edit-block! parity). The click-placed caret survives because
  `focus_block` short-circuits when `hasFocus()`.
- Wrapper `keydown`: Cmd/Ctrl+[ ] swallowed (history nav), arrows at
  document start/end move to the neighbor block
  (`A.arrow_nav`). Wrapper `pointerdown`: stopPropagation + clear the
  block-range selection. `editor_keys` document-capture pointerdown
  additionally skips `.ui-fenced-code-editor` targets (CM's
  stopPropagation can't reach capture listeners).
- `Esc`: commits via `A.exit_edit ~select:true`. **Divergence**: cljs
  drops into a raw-textarea mode on Esc before the second Esc fully
  exits; we exit in one step (simpler, matches `exit-edit` helper).
- `Shift-Enter`: `insert_sibling_after`.
- `update_calc` clears `.extensions__code-calc` and re-appends
  `.extensions__code-calc-output-line` rows from
  `Render_calc.results`. For that to exist on a *fresh* calc block,
  render.ml now emits the `.extensions__code-calc.pr-2` container
  for `lang=calc` even when empty (cljs always mounts it).

### State coupling (no module cycle)

`Editor_state` exposes `code_buffer_of` / `code_focus` refs that
`Code_mirror.install` wires: `live_buffer` consults the CM doc before
the textarea fallback; `apply_focus` tries `code_focus` (has_focus →
keep caret, else `cm.focus()` + `setCursor`) before the textarea
match and runs `run_pending_focus_actions` on success. `sync_titles`
(≈ cljs `sync-editor-code!`) is subscribed to `S.signal ()` *lazily*
from the scan — `S.state` throws `failwith "editor state not
mounted"` until the first block row mounts the state, and an eager
subscribe in `install` crashed boot ("Failure(editor state not
mounted)").

### Actions bar

`.code-block-actions` = `.select-language` button (label =
lower-cased lang or `editor/code-language-placeholder` + chevron) +
copy button (`navigator.clipboard.writeText` → "Copied!" toast, via
`let*` promise bind). The picker renders `.ls-code-lang-picker`
menu rows under `.cp__overlays` at the button's fixed rect; a
document mousedown outside `.ls-code-lang-picker,
.code-block-actions` closes it. Picking a mode calls
`setOption("mode", …)` + `set_block_property
logseq.property.code/lang`. `window.CodeMirror` is exported for
extensions/dev helpers.

### Verification

- `virtualized-late-editor-and-code-editor-test` 4/4,
  `commands-basic-test/code-block-test` 2/2,
  `commands-basic-test/calculator-test` 3/3 — all green on port 3013.
- Manual probe: `/code` → `.CodeMirror` (cm-s-lsradix cm-s-light)
  mounts, click on `pre.CodeMirror-line` focuses the hidden textarea,
  `fill "*:focus"` writes the doc, Esc exits, `.extensions__code`
  shows the code, block content persists across reload.
