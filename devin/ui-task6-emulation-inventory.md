# Task 6 preparation — runtime emulation and build-copying inventory

Read-only inventory for the Task 6 batch ("Structural cleanup") of
`docs/agent-guide/proposed/architecture/2026-10-08-002-ui-shared-implementation.md`.
No code changed. Branch: `devin/SHAREDUI-task6-emulation-inventory`.

Baseline commit: `0964fcf1de` on `origin/refactor/lui` (includes `ef8d49f385`
"semantic theme, navigation, and document services" and `287dda11f2` "read
radix-color through storage service"). Caller counts below were measured on this
tree, so the Task 2 contract-layer removals of nav/theme `Platform.*`/`Web_dom.*`
call sites are already reflected.

Method: `rg` scans over all `*.ml` under `deps/ui`, then each caller file was
classified as **dual** (a `src/`/`subs/` file that `native/dune` copies into the
native library — one call site compiles against both runtimes), **melange-only**
(`src/`/`subs/`/`web/`/`js_app/` file not copied — its `Js.`/`Web_dom.` calls only
ever bind the browser implementation), **native** (handwritten file in
`native/`), **test** (`test/`, `gpui/drive_test.ml`), or **contracts**
(`src/contracts/`, `src/shared/`). Reference counts are qualified `Module.`
occurrences plus `open`/`include`/alias sites; they over-approximate slightly
(comments and strings are not filtered).

Builds were not run (read-only task). Verified facts come from direct source
reads; anything speculative is marked *(inference)*.

## How the emulation works

`native/dune` declares `(library (name logseq_ui_native) (wrapped false))` whose
module set is: 70 handwritten `native/*.ml` files + 105 files copied verbatim
from `../src`/`../subs` + 4 generated tables (`version_gen`, `dicts_gen`,
`emoji_mart_data`, `icon_names_data`). Because the library is unwrapped, a copied
`src/` file calling `Js.` or `Web_dom.` resolves to the native module of the same
name — `native/js.ml`, `native/web_dom.ml` — where under Melange the same source
binds `melange.js` and `src/core/web_dom.ml`. Substitution pairs are pure
name-matching: there are no `(copy_files ...)`, `(copy# ...)`, or
`module_substitution` stanzas anywhere under `deps/ui`.

`gpui/dune` rebuilds the *same* library under the name `logseq_ui_gpui`: it
repeats all 105 `src`/`subs` copy rules verbatim, adds 70 `(copy ../native/*.ml)`
rules (the entire handwritten native set, so the two hosts cannot drift), 2 C
copies of `logseq_lui_bridge.c` (one renamed `drive_test_bridge.c` for the test
executable), and 2 `../test` copies (`test_check.ml`, `fake_worker.ml`). The four
table-generation rules are also duplicated verbatim. Only the library name and
host code differ (per the comment at `deps/ui/gpui/dune:12-18`).

The emulation chain: handwritten business twins and copied shared sources call
`Web_dom.*`/`Platform.*`/`Js.*`/`Fetch.*`/`Promise_ext`; `native/web_dom.ml`
fans the unified DOM surface out to the element shims (`Editor_dom`, `Views_dom`,
`Properties_dom`, `Dom_ext`, `Browser_ui`, `Vdom`, `Imperative_dom`); those
mutate host-visible state through `Host.dom_op` / `Host.request` envelopes and
`Platform.emit_event`'s in-process dispatch engine, and materialize imperative
`{#new:n}` shells as `logseq-<tag>` extension nodes through `Lui_runtime`.

## Per-module inventory

### `native/js.ml` — 480 lines

Emulates the `melange.js` API surface: `Js.Dict` (Hashtbl), `Js.Json` (a real
JSON ADT `JObject`/`JArray`/... plus `parseExn`/`stringify`), `Js.Promise` (a
native deferred state machine), `Js.Date`, `Js.String`, `Js.Undefined`/
`Nullable`/`Null`/`Option`, `Js.Exn`, `Js.Typed_array`. `'a Js.t = 'a` is erased
(`native/js.ml:8`). Comment states unsupported calls raise.

Callers (`Js.`): **3,927 refs across 167 files** — dual 63, melange-only 47,
native 44, test 9, gpui 1, js_app 1, web 2. Largest: `src/sdk/plugin_host.ml`
(255, melange-only), `test/stub_dom.ml` (111), `src/core/web_dom.ml` (109,
melange-only), `src/editor/outliner_ops.ml` (101, dual), `src/sdk/sdk_write.ml`
(97, melange-only), `native/editor_dom.ml` (96), `native/sdk_write.ml` (94).

- `Js.Promise`: also surfaced through `Promise_ext`'s `let*` (see below) and
  through `native/fetch.ml`/`native/daemon_client.ml`/`native/worker_client.ml`
  return types.
- `Js.Json`: additionally the internal payload format of the whole native
  emulation (element snapshots, `dom-event` payloads, `Host.dom_op` envelopes,
  `native_embed` patch batches) — not just caller-visible browser JSON.

Owning batch: last. `Js.Promise` usage in shared flows is Batch 4 (`Ui_task`);
`Js.Json` shrinks feature by feature (3a–5) and legitimately survives at
transport/extension boundaries (`transit`, `native_embed` snapshots are a
boundary format — plan line 546: "JSON belongs at host/plugin/network
serialization boundaries").

Deletion condition: no module in `logseq_ui_native`/`logseq_ui_gpui` references
`Js.` — i.e., every dual caller's `Js.` usage removed or bounded, every native
twin deleted, and the emulation internals that *return* `Js.Json` (snapshot
encoding, event payloads) replaced by typed payloads or moved behind the C
bridge. Blocked by: everything above; effectively the entire migration.

### `native/webapi.ml` — 35 lines

Opaque host-object types only (`Webapi.Dom.Element`/`Document`/
`HtmlInputElement`/`HtmlTextAreaElement`, `Blob`, `File`, ...) — `type opaque =
int`, never dereferenced (`native/webapi.ml:1-4`).

Callers (`Webapi.`): 29 refs / 16 files — native 6 (`export_page` 6,
`browser_ui` 4, `platform` 1, `sidebar_state` 1, `asset_store` 1, self 1), dual 1
(`src/export/export_state.ml` 2), melange-only 7 (`src/core/web_dom.ml`,
`asset_store`, `export_page`, `cm_adapter`, `logseq_editor`, `logseq_virt`,
`web_ext_adapters`), `web/platform.ml` 1, `js_app/main.ml` 1.

Deletion: trivially dies once `native/browser_ui.ml`, `native/export_page.ml`,
and the `Platform.get_element_by_id`/`get_attribute` stubs are gone or typed
(batch 5 / Task 6).

### `native/web_dom.ml` — 300 lines

Native implementation of the unified `Web_dom` surface; the Melange twin is
`src/core/web_dom.ml` (1,242 lines of `mel.dom`/`melange-webapi` externals —
retained as the web adapter; Task 6 step 2 moves it under `web/`).
`web_dom.ml:7-14` aliases `Editor_dom` types; the body delegates element
identity/queries/attributes/focus to `Editor_dom` (~78 refs), child ops to
`Views_dom`, `el_matches`/`insert_adjacent` to `Properties_dom`, document
listeners/window metrics/custom dispatch to `Dom_ext`, and
`confirm`/`open_url`/`prefers_dark`/`json_props` to `Browser_ui` (`web_dom.ml`
lines 33–99).

Callers (`Web_dom.`): **1,468 refs / 90 files** — dual 52, melange-only 32,
native 4 (`comments`, `settings_page`, `views_table`, `views_query`), test 1
(`test_drive`), js_app 1. Top dual callers: `graphs_view` 172, `popups_view`
102, `recycle` 63, `collaborators` 48, `dialogs_state` 34, `popups_state` 32,
`exporter` 28, `router` 26, `sdk_ui` 23, `block_selection` 16. Top melange-only:
`pdf_toolbar` 325, `pdf_hls` 114, `chrome` 55, `cmdk_view` 48, `pdf` 46 —
these never touch the native twin but keep `src/core/web_dom.ml` alive on web.

Deletion condition: zero `Web_dom.` call sites in every file the native/GPUI
libraries compile (dual callers migrated to typed LUI/services per their feature
batch — 3a–5f — or deleted with their twin). This is the facade over the whole
imperative layer, so it is the *last* emulation module to die (Task 6 tail).
The shared module name also must disappear from shared code before the melange
`src/core/web_dom.ml` can be relocated.

### `native/vdom.ml` — 882 lines

Virtual-DOM registry for `{#new:n}` Json shells: shells record
tag/class/attrs/text/children/listeners (`vdom.ml:17-32`) and materialize into
`logseq-<tag>` extension nodes via `Lui_runtime` when attached under a mounted
node (`vdom.ml:1-12`).

Callers (`Vdom.`): 74 refs / 4 native files — `properties_dom` 45,
`editor_dom` 25, `native_embed` 2, `web_dom` 2. No shared caller: shared code
reaches it only through `Web_dom.create_element`/`new_el` paths.

Deletion: dies when no caller constructs `{#new}` shells — i.e., the imperative
element factories used by properties/cmdk/editor surfaces are replaced by typed
LUI kinds (batches 3c/3d/5d). Verify `native_embed`'s two references are only
snapshot helpers.

### `native/imperative_dom.ml` — 1,074 lines

Imperative element registry: `#new` payloads materialize via
`Lui_runtime.create_extension_node`; OCaml-side element state (attrs, children,
value, listeners, rects); host `dom-event` trampolines feed
`Platform.emit_event` bubbling; `imperative-attach`/`imperative-detach` dom-ops
for `document.body` appends (`imperative_dom.ml:1-25`).

Callers (`Imperative_dom.`): 169 refs / 6 native files — `views_dom` 87,
`editor_dom` 71, `web_dom` 4, `native_embed` 3, `views_popup` 2, self 2.

Deletion: dies with `Views_dom`/`Editor_dom` (batch 5 + 5d) once their call
sites migrate; `native_embed` references need checking for snapshot/diagnostic
use before deletion *(inference)*.

### `native/dom_ext.ml` — 777 lines

Header says "Native twin of popups/dom_ext.ml" — that src file no longer exists
(deleted in `887b6bc7ca` "merge six DOM FFI modules into core/web_dom"); it now
stands alone as the Json event/element accessor + document-listener +
`Host.dom_op` mutation + subtree-selector engine (`dom_ext.ml:1-9`).

Callers (`Dom_ext.`): 264 refs / 18 native files — `editor_dom` 59, `cmdk_view`
51, `vdom` 29, `web_dom` 25, `properties_dom` 23, `cmdk_state` 21,
`browser_ui`/`logseq_editor`/`views_dom` 10 each, `imperative_dom` 7, `chrome`
5, `native_embed` 4, `views_popup`/`asset_dom` 3, `sidebar_state`/`platform`/
`page_menu`/`code_mirror` 1 each.

Deletion: dies when (a) the business twins calling it are deleted in their
batches (3b `sidebar_state`, 3c `cmdk_*`, 5 `chrome`/`page_menu`/`asset_dom`/
`views_popup`), (b) `logseq_editor`'s typed-input migration lands (5d), and (c)
`web_dom` stops delegating.

### `native/editor_dom.ml` — 1,018 lines

Header says "Native twin of editor/editor_dom.ml" — also deleted in
`887b6bc7ca`. It is the largest single shim: `el`/`ev` as Json snapshots pushed
via `dom-event` payloads, an `el_cache` so `==` identity holds per DOM id,
mount-id tracking for `get_element_by_id`, document listeners via
`Platform.add_event_listener`, and DOM writes via `Host.dom_op`
(`editor_dom.ml:1-30`).

Callers (`Editor_dom.`): 145 refs / 10 native files — `web_dom` 78,
`views_popup` 37, `views_dom` 10, `sidebar_state` 8, `properties_dom` 6,
`logseq_editor` 3, `native_embed` 2, `cmdk_view` 1, plus `open` in
`code_mirror`/`icon_picker`.

Deletion: gated by Task 5d ("Trace non-editor callers of editor_dom.ml and
delete only helpers whose owning callers have migrated") — the shared editor
control drops DOM deps, the native view/sidebar/cmdk twins are deleted, and
`web_dom` stops delegating. Practically Task 5d + Task 6.

### `native/properties_dom.ml` — 238 lines

Twin of deleted `src/properties/properties_dom.ml` (`887b6bc7ca`). Elements are
`Vdom` `{#new}` shells or node snapshots; queries run through `Dom_ext`'s
selector engine (`properties_dom.ml:1-6`).

Callers (`Properties_dom.`): 12 refs / 4 native files — `web_dom` 11,
`cmdk_state` 1, plus `open` in `code_mirror`/`icon_picker`.

Deletion: dies with `Vdom` + `cmdk_state` native twin (3c/3d) once `web_dom`
stops calling it.

### `native/views_dom.ml` — 457 lines

Twin of deleted `src/views/views_dom.ml` (`c95eeb5ff8` "unify views onto
declarative signal pipeline"). `new_el` registers in `Imperative_dom`; live ops
(focus/selection/scroll/value) go through `doc_op` → `Host.dom_op`
(`views_dom.ml:1-13`).

Callers (`Views_dom.`): 27 refs / 5 native files — `web_dom` 20, `views_virt` 3
(itself dead), `asset_dom` 2, `imperative_dom` 1, `views_popup` 1 (plus `open`
in `views_popup`).

Deletion: dies when `Imperative_dom` and `views_popup`/`asset_dom` callers
migrate (batch 5).

### `native/views_virt.ml` — 15 lines

Twin of deleted `src/views/views_virt.ml` (`c95eeb5ff8`). Stub `rows` returning
`Views_dom.new_el ()`; comment notes virt lists are unreachable natively
(`Virt_list.enabled` always false).

Callers: **zero anywhere in `deps/ui`** — dead module. Deletion: delete file +
the `gpui/dune` copy rule (it is only copied, never compiled into `native/` — it
is compiled, but nothing references it; verify the generated tables don't
reference it, then remove).

### `native/browser_ui.ml` — 206 lines

Twin of deleted `src/graphs/browser_ui.ml` (`887b6bc7ca`). File pickers and
downloads go through host requests; `qs`/element ops are stubs over a counter;
`confirm`/`open_url`/`prefers_dark`/`json_props`/`clipboard` are real
host-backed calls (`browser_ui.ml:1-5`, e.g. `Host.dom_op` usage below line 60).

Callers (`Browser_ui.`): 17 refs / 3 native files — `web_dom` 15, `asset_dom`
2, plus `open Browser_ui` in `export_page`.

Deletion: dies when `web_dom`'s `confirm`/`open_url`/`prefers_dark` surface and
`asset_dom`/`export_page` file flows move to typed services (batch 5).

### `subs/promise_ext.ml` — 5 lines (copied into `native/` and `gpui/`)

`let* p f = Js.Promise.then_ f p` — `let*`/`and*` sequencing syntax over
`Js.Promise`. Under Melange it is the `logseq_subs` module; under native it is
the copy rule's module; not a substitution (identical file both modes).

Callers (`open Promise_ext`/`Promise_ext.`): 89 files — dual 48, melange-only
20, native 20 (all handwritten twins), js_app 1. Every site is an `open` — zero
qualified references.

Deletion: dies per call site as `Js.Promise` is replaced by `Ui_task` (batch 4
for shared flows; native twins' opens die when the twins are deleted in 3b/3c/5).

### `native/fetch.ml` — 67 lines

`melange-fetch` API surface (`Fetch.RequestInit`/`HeadersInit`/`BodyInit`/
`Response`/`fetchWithInit`) over a blocking unix-socket HTTP POST — comment:
"Only the surface publish_view.ml needs" (`fetch.ml:1-4`). Module substitution
for the external `melange-fetch` library (no src counterpart).

Callers (`Fetch.`): 28 refs / 4 files, all dual — `src/graphs/collaborators.ml`
11, `src/dialogs/login_view.ml` 10, `src/export/publish_view.ml` 4,
`src/graphs/graphs_ops.ml` 3.

Deletion: dies when these flows move to `Ui_task`+typed transport (batch 4/5).

### `native/platform.ml` — 420 lines (`include Platform_native` at line 18)

What remains after the `ad675c389f` extraction is the in-memory host-state +
dispatch half of the platform surface: console/perf stubs, `edit_units =
`Bytes`, the `dom_handlers` registry and `emit_event` capture/bubble engine
(`platform.ml:54-148`), clipboard queues, `pfs_*` stubs, `random_uuid`,
`json_prop`/`payload_*` decoders, location stubs (`platform.ml:270-415`).
This file is still "emulation + thin host glue" — `emit_event` and
`register_dom_handler` are the backbone the imperative-DOM channel
(`imperative_dom`/`logseq_el`/`editor_dom`/`dom_ext`/`views_dom`/`vdom`/
`native_embed`/`logseq_editor` + `gpui/drive_test.ml`) dispatches through.

Callers (`Platform.`): **685 refs / 126 files** — dual 58, melange-only 30,
native 30, web 2, test 4, gpui 1, js_app 1. Post-ef8d49f385 the nav/theme
callers are gone; remaining heavy users: dual `editor_actions` 23,
`editor_keys` 22, `router` 19, `page` 14, `tree` 12, `commands_data` 11,
`rtc_ops` 11; melange-only `cmdk_state` 25 (batch 3c in flight), `plugin_host`
22, `sidebar_state` 12, `chrome` 11; native `sidebar_state` 28, `cmdk_state` 22.

Deletion: shrinks piecewise — `Ui_services` keeps absorbing semantic groups;
the `emit_event`/`dom_handlers`/`add_event_listener` machine dies with the
imperative DOM channel (batch 5d/Task 6); `pfs_*`, `publishing`,
`console_*`, `perf_*`, `location_*`, `selected_block_uuids` stubs die or move to
explicit capability services. Cannot fully die while any copied file calls
`Platform.`.

### `native/native_embed.ml` — 769 lines — host boundary, retain

C bridge entry: `external wakeup`/`platform_request` (`native_embed.ml:6-7`),
entry lock serialization (`with_entry_lock`), snapshot encoder producing
`Js.Json` patch batches, `Callback.register "lui_ocaml_*"` block at the bottom.
The `Js.Json` snapshots are a wire format here — classification: host boundary,
not emulation.

### `native/menu_bar.ml` — 34 lines — host boundary, retain

Menu events routed to reducer actions via `Platform.add_event_listener`
(`menu_bar.ml:5-20`). Sole caller `native_embed`. Keep; it consumes (does not
emulate) the event channel.

### `native/services/host.ml` — 95 lines — extracted service, retain

Byte-identical move of the deleted `native/host.ml` (verified: `git show
ad675c389f^:deps/ui/native/host.ml` diff is empty). Host mailbox (`enqueue`/
`drain`/`set_wakeup`), timers (`set_timeout`/`clear_timeout`), window metrics,
and the `host_op` envelope channel (`dom_op`, `clipboard`, `clipboard-read`,
`open-url`) (`host.ml:46-89`).

Callers (`Host.`): 90 refs / 20 files — native 18 + `services/platform_native`
+ `gpui/drive_test`. `src/app/runtime.ml:110` is a comment, not a call.
`Host.dom_op` (43 refs) is the channel the emulation layer mutates through —
`Host` itself is genuine and survives; `dom_op` call sites die with emulation.

### `native/services/platform_native.ml` — 352 lines — extracted service, retain

Host request channel, persisted `ui-state.json` (localStorage equivalent,
`LOGSEQ_UI_STATE_DIR` support), appearance/hash/history/query state, and
`install_ui_services` — now including the theme/nav/doc impls added in
`ef8d49f385` (`platform_native.ml:253+`, `Ui_task.install { enqueue =
Host.enqueue }` at line ~264 pre-extraction numbering — verified present).

### Dead or consumer-free modules

| Module | Lines | Evidence | Fate |
| --- | --- | --- | --- |
| `native/views_virt.ml` | 15 | zero `Views_virt.` refs in `deps/ui` | Delete in Task 6 (file + gpui copy rule) |
| `native/virtual_scroll.ml` | 5 | zero refs; stub (`enabled () = false`) | Delete in Task 6 (+ gpui copy rule) |
| `native/sprintf.ml` | 433 | zero `Sprintf.`/`open Sprintf` refs anywhere in `deps/ui`; `src/core/sprintf.ml` also shows zero callers | Dead in *both* runtimes — confirm, then delete both |
| `native/dnd_kit.ml` | 3 | only caller `src/dnd/block_dnd.ml` is melange-only (native twin `block_dnd.ml` doesn't use it) | Dead in native lib; delete with batch 5 |
| `native/logseq_virt.ml` | 14 | `Logseq_virt.` callers are melange-only (`src/virt/virt_list.ml`, `interaction_perf`, js_app) + tests | Dead in native lib; delete with `virt_list` batch (5) |
| `native/virtualizer.ml` | 4 | callers all melange-only (`logseq_virt`, `virt_list`, `lazy_children`) | Dead in native lib; delete with batch 5 |
| `native/pdf_hls.ml`, `pdf_toolbar.ml`, `pdf_utils.ml` | 1–2 | spacer stubs; native `pdf.ml` twin doesn't call them | Dead in native lib; delete with pdf batch (5) |
| `native/dune` copy of `src/properties/properties_calendar.ml` | — | zero `Properties_calendar` refs in the entire native lib — and zero refs anywhere in `deps/ui` | Copy rule has no consumer; the src file itself appears dead in both runtimes — confirm before deleting |

Caveat on "dead": generated modules (`dicts_gen.ml`, `emoji_mart_data.ml`,
`icon_names_data.ml`, `version_gen.ml`) are produced into `_build` and were not
scanned; `tools/*_gen.ml` sources contain no references to the dead names.
Deletion still needs a compile check after removal *(inference: low risk)*.

## Build copying

| File | Copy rules | Notes |
| --- | --- | --- |
| `deps/ui/native/dune` | **105** `(rule (copy ...))`: 8 from `../subs` (action, decode, model, page_delta, promise_ext, subs, subs_state, update), 97 from `../src` | + 4 generation rules (version_gen, dicts_gen, emoji_mart_data, icon_names_data) |
| `deps/ui/gpui/dune` | **179**: the same 105 src/subs copies verbatim + 70 `../native/*.ml` + 2 `../native/logseq_lui_bridge.c` (second name `drive_test_bridge.c`) + 2 `../test` (test_check, fake_worker) | + the same 4 generation rules duplicated; `(test drive_test)` also has `foreign_stubs`/`modules` wiring |
| `deps/ui/src/dune`, `subs/dune`, `src/contracts/dune`, `src/shared/dune`, `web/dune`, `native/services/dune`, `test/dune`, `test/shared/dune`, `js_app/dune` | **0** | no copy rules outside native/gpui |

Module-substitution pairs (native file shadows a same-named module that exists
in `src/`/`subs/`/`web/` and is *not* copied): **56 pairs** — matches the plan's
candidate table. `platform.ml` pairs with `web/platform.ml`; `web_dom` pairs
with `src/core/web_dom.ml`; `fetch`/`js`/`webapi` substitute external Melange
libraries (`melange-fetch`, `melange.js`, `melange-webapi`). Native-only
modules with no counterpart: `browser_ui`, `dom_ext`, `editor_dom`, `fetch`,
`imperative_dom`, `js`, `menu_bar`, `native_embed`, `properties_dom`, `vdom`,
`views_dom`, `views_virt`, `virtual_scroll`, `webapi` (14).

Copy rules with no remaining consumer: **`properties_calendar` only**
(every other copied module is referenced by at least one library member; full
reference map computed but too large to inline — regenerate with the scan in the
appendix).

## host.ml / platform.ml file-state verification

Verified against `git show ad675c389f`:

- `native/host.ml` — **deleted**; `native/services/host.ml` is byte-identical.
- `subs/platform.ml` — **deleted**; `web/platform.ml` is the same 409-line file
  with a single change: `open Promise_ext` → local `let* ... Js.Promise.then_`
  (dependency-cycle avoidance, per handoff line 123).
- `native/platform.ml` — still exists at 420 lines; the extracted 264-ish lines
  (host request channel, persisted state, appearance/hash/history, service
  install) became `native/services/platform_native.ml` (now 352 lines after the
  ef8d49f385 additions); `platform.ml` retains the event-dispatch engine and
  emulation helpers via `include Platform_native`.
- `web/platform_web.ml` — 134 lines; installs the browser `Ui_services` impls
  (storage, literal-text, flush, theme/nav/doc groups).

## Summary classification — every `native/` file

| File | Lines | Class | Owning batch / fate |
| --- | --- | --- | --- |
| js.ml | 480 | emulation (Js surface) | dies last in Task 6 — every batch blocks it |
| webapi.ml | 35 | emulation (opaque types) | batch 5 + Task 6 |
| web_dom.ml | 300 | emulation facade (Web_dom twin) | Task 6 tail — gated by all feature batches |
| vdom.ml | 882 | emulation (virtual DOM registry) | 3c/3d/5d |
| imperative_dom.ml | 1,074 | emulation (element registry) | 5/5d |
| dom_ext.ml | 777 | emulation (events/selectors/host ops) | 3b/3c/5/5d |
| editor_dom.ml | 1,018 | emulation (editor DOM snapshots) | 5d per plan's explicit gate |
| properties_dom.ml | 238 | emulation | 3c/3d |
| views_dom.ml | 457 | emulation | 5 |
| views_virt.ml | 15 | emulation — **dead** | delete in Task 6 |
| browser_ui.ml | 206 | emulation + host file/dialog ops | 5 |
| virtual_scroll.ml | 5 | emulation — **dead** | delete in Task 6 |
| sprintf.ml | 433 | pure helper — **dead both runtimes** | delete in Task 6 |
| fetch.ml | 67 | emulation (HTTP over socket) | 5 |
| platform.ml | 420 | emulation + host glue (event engine) | shrinks via Task 2 cont.; dies Task 6 |
| native_embed.ml | 769 | host boundary (C bridge entry) | retain — Json snapshots are a wire format |
| menu_bar.ml | 34 | host boundary (menu routing) | retain |
| logseq_lui_bridge.c | — | host boundary (C stubs) | retain |
| services/host.ml | 95 | extracted service (mailbox/host ops) | retain — `dom_op` call sites die w/ emulation |
| services/platform_native.ml | 352 | extracted service (persist/appearance/nav) | retain |
| asset_dom.ml, asset_store.ml | 284/72 | platform service twins (src/assets) | 5 — move I/O behind services |
| daemon_client.ml, worker_client.ml, transit.ml | 876/120/568 | platform service twins (transport) | 4 |
| html_to_md.ml, plugin_host.ml, render_libs.ml, sdk_util.ml, version.ml | 50/68/25/536/11 | platform service twins | 5 |
| settings_page.ml, sidebar_state.ml | 736/1,101 | duplicate business (view/state) | 3b |
| cmdk_state.ml, cmdk_view.ml | 1,494/957 | duplicate business (palette) | 3c |
| properties_data.ml, properties_value.ml | 564/823 | duplicate business | 3d |
| chrome.ml, comments.ml, editor_cmds.ml, export_page.ml, page_menu.ml, plugin_readme.ml, plugins_view.ml, sdk_write.ml, views_popup.ml, views_query.ml, views_table.ml | 520/246/210/306/277/3/6/1,524/623/409/1,301 | duplicate business (generic view) | 5 (editor_cmds: 5b) |
| dates.ml, fuzzy.ml, icons.ml, icon_tabler_data.ml, icon_picker_names.ml, sdk_convert.ml | 100/117/251/69/6/177 | pure helper / generated twins | 3a |
| block_dnd.ml, code_mirror.ml, dnd_kit.ml*, emoji_mart.ml, icon_picker.ml, lazy_children.ml, logseq_codemirror.ml, logseq_editor.ml, logseq_el.ml, logseq_emoji.ml, logseq_katex.ml, logseq_virt.ml*, pdf.ml, pdf_annotation.ml, pdf_assets.ml, pdf_hls.ml*, pdf_toolbar.ml*, pdf_utils.ml*, plugins_view.ml*, views_popup.ml, virt_list.ml, virtualizer.ml* | 2–634 | widget adapter/control twins (* = already dead in native lib) | 5 / editor 5a–5f; dead ones earlier |

(70 handwritten `.ml` files total ≈ 24,457 lines; `services/` adds 2 files.)

## Deletion order (inference)

1. **Now-free deletions** (zero callers): `views_virt.ml`, `virtual_scroll.ml`,
   `sprintf.ml`, `dnd_kit.ml`, `logseq_virt.ml`, `virtualizer.ml`,
   `pdf_hls.ml`, `pdf_toolbar.ml`, `pdf_utils.ml`, the `properties_calendar`
   copy rule — and possibly `src/properties/properties_calendar.ml` itself.
   Each needs a compile check; several have open-question ownership since their
   src twins still have melange callers (don't delete the src files).
2. **Per-batch emulation collapse**: `properties_dom` (3d), `dom_ext`/`vdom`
   shrink as 3b/3c twins die, `browser_ui` (5), `editor_dom`/`imperative_dom`/
   `views_dom` (5/5d).
3. **`native/web_dom.ml`** dies only after the last dual caller stops calling
   `Web_dom.` — final emulation file removed in Task 6.
4. **`native/js.ml`** dies last: `Js.Promise`→`Ui_task` (batch 4), `Js.Json`
   confined to `native_embed`/transit/extension boundaries (boundary JSON is
   legitimate — the module may end as a small shared JSON type rather than
   melange.js emulation, or be deleted if boundaries use `Wire`/bytes).
5. **Copy rules** die with the last native caller of each copied module; the
   duplicated generation rules (`version_gen`/`dicts_gen`/`emoji_mart_data`/
   `icon_names_data` in both `native/dune` and `gpui/dune`) consolidate when
   `gpui` links the shared libraries directly (Task 6 step 4-5).

## Facts vs inference

- **Verified**: all file sizes, caller counts, copy-rule counts, the
  byte-identical `host.ml` move, the single-line `web/platform.ml` delta, the
  deleted-src history of `dom_ext`/`editor_dom`/`properties_dom`/`views_dom`/
  `views_virt`/`browser_ui`/`virtual_scroll` (`887b6bc7ca`, `c95eeb5ff8`,
  `88140219ee`), 56 name-match pairs, zero-ref modules.
- **Inference**: "dead" verdicts assume generated `_build` modules and
  first-class-module registrations don't secretly reference them — a
  `dune build` after removal is the check. Caller classification assumes the
  current copy list; a src file added to `native/dune` later shifts callers
  from melange-only to dual. Owning-batch assignments follow the plan's
  candidate table; per-file drift may move a few rows between batches.
