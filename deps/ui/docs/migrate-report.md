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
  after navigation raced removals).

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
||||||| parent of be25c4ee95 (fix(ui): parity sweep — journals scaffolding, route-conditional content-wrap, ref-summary maps in block/refs, icon picker set)

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
