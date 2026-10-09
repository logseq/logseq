# Task 6c legacy-impl review — per-file verdicts

Branch: devin/SHAREDUI-task6c (off origin/refactor/lui @ bce1dadb1a).
Baseline green: build OK; web 1,881 checks (1 pre-existing decorate-mod
failure); native 578 (5 expected); boundaries OK.

## Mechanism recap

- `native/dune` copies ~111 `src/`+`subs/` files verbatim into the
  native lib (`wrapped false`). A copied file calling `Web_dom.` binds
  `native/web_dom.ml` (300 ln), which delegates to `Editor_dom` (1,018),
  `Vdom` (882), `Imperative_dom` (1,074), `Properties_dom` (238),
  `Views_dom` (457), `Dom_ext` (777), `Browser_ui` (135).
- The cluster exists ONLY to serve copied-src `Web_dom.*` calls +
  handwritten native callers: `native/comments.ml` (2×query_selector,
  `D.el_focus`), `native/cmdk_host.ml` (query/value/focus/scroll/timers),
  `native/views_popup.ml` (644 ln, `D = Views_dom`, 37 Editor_dom refs),
  `native/logseq_editor.ml` (`Editor_dom.textarea_of`/`el_closest`,
  `Dom_ext.caret_popup_pos`/`bounding_rect`), `native/asset_dom.ml`
  (dead `file_cell` returning `Views_dom.el` — no callers),
  `native/native_embed.ml` (`Editor_dom.run_doc_scans`,
  `Imperative_dom.install`/`lui_index`/`snapshot_of_id`,
  `Vdom.init`/`snapshot_of_node`), `native/ui_dom_native.ml`
  (`Editor_dom.el_class_add/remove`, `document_element`).
- `Dom_ext` has NO deps on the 6 emulation modules (self-contained:
  selector matching, rect store via `Host.dom_op "measure-node"`,
  doc-elements providers). It stays as the snapshot-helpers layer;
  `native_embed` keeps wiring `doc_elements_provider`/`subtree_elements_provider`.
- `Platform.ml` clean (host-event plumbing only).
- `Browser_ui` is native-only (src side deleted in an earlier batch):
  file pickers/downloads via `Host.dom_op` — real working host ops, not
  emulation. `native/web_dom.ml` delegates file ops to it.
- Native rect reads: `Dom_ext.bounding_rect` reads `"rect"` prop or
  fires `Host.dom_op "measure-node"`; reply lands in `rect_store`;
  callers see fresh value on retry ticks. `Ui_services.el.rect` on
  native must call `Dom_ext.bounding_rect` (currently returns zeros).

## 54 dual-compiled caller files (copied AND referencing the modules)

Alias `module D = Web_dom`/`open Web_dom`/`module E = Web_dom` found —
the earlier "46" count was `Web_dom.` literal only. True dual set: 54.

### A. Mechanical → Ui_services ops (migrate in this batch)

- boot.ml: query_selector+el_class_add (wide-mode class)
- worker_events.ml: set_timeout, on_document_event, add_document_listener,
  query_selector, js_get(ev detail)
- comments_ops.ml: query_selector, el_value, el_set_value,
  el_set_text_content (comment textarea clear)
- comments_view.ml: `D.` query_selector ×2, el_set_value,
  el_set_text_content
- query_builder.ml: query_selector, el_focus (input in anchored popup)
- selection_bar.ml: `D.` el_closest, get_element_by_id, ev_target,
  add_document_listener, set_timeout, ev_shift/meta/ctrl/buttons,
  bounding_rect_fields (anchor above first selected block)
- tree.ml: ensure_dom_fixups (dev-only no-op candidates), debounce
- cards_state.ml: on_document_event, set_timeout, event_str, ev_detail
- overlay.ml: ev_target, el_contains, add_document_listener (hit test)
- dialogs_state.ml: el_focus ×7, ev_prevent_default, ev_shift,
  on_document_event, set_timeout, js_get, event_str, active_element,
  query_selector_all_arr, query_selector, ev_default_prevented,
  ev_composing, el_query_all_arr, el_is_connected, el_contains —
  radix focus-trap + Escape-defer logic
- dialogs_view.ml: query_selector, el_focus, set_timeout, el_set_attr
- login_view.ml: set_timeout, query_selector, el_focus
- block_selection.ml: ev_target, closest_sel, ev_buttons, el_get_attr,
  ev_shift/meta/ctrl, ev_prevent_default (shift/meta range select)
- editor_actions.ml: set_timeout ×5, ev_prevent_default, cd_get_data,
  ev_clipboard, get_element_by_id, ev_stop_immediate, el_get_attr,
  closest_sel, file_size/file_name/file_buffer/el_files (asset upload),
  dispatch_custom("ls:editor-command")
- editor_surface.ml: set_timeout
- outliner_ops.ml: clear_timeout, set_timeout_id
- pdf_state.ml: query_selector, el_set_attr (data-theme),
  el_class_add/remove (.theme-container-inner)
- page.ml: query_selector, element_at (contextmenu anchor),
  el_get_attr (title collapsable), set_timeout (grow retry)
- popups_state.ml: query_selector, el_closest, dispatch_custom,
  win_inner_height/width, set_timeout, rect_* (autocomplete flip/measure
  loop via --available-height), el_style_set_property,
  scroll_row_into_view, ev_key/ctrl/meta
- popups_view.ml: el_closest, el_get_attr, ev_prevent_default, ev/el
  types, add_document_listener, selected_block_uuids, win_inner_height,
  ev_target, ev_stop_propagation/immediate, el_set_attr/el_remove_attr
  (data-highlighted roving), el_bounding_rect, set_timeout_id,
  rect_width, el_is_connected, el_query/el_query_all_arr, el_focus,
  el_click, el_scroll_into_view_opts, el_contains — menu/preview-popup
  hover+keyboard layer
- properties_area.ml: doc_query (anchor for icon picker / add-property)
- properties_dialog.ml: win_inner_height, set_timeout,
  bounding_rect_fields (measure retry loop)
- properties_menu/select/state.ml: `el` type refs (mutable content
  fields), el_append_child (overlay root), set_timeout — mostly type
- render.ml: `el` type ×27 + txt + dispatch_custom — mostly type
- router.ml: get_element_by_id, el_scroll_into_view, el_class_add/remove
  (anchor highlight), el_client_height/scroll_height/scroll_top/
  set_scroll_top (journals infinite scroll + scroll-to-top),
  body_set_data("page"), on_document_event, event_str, ev_target,
  el_id, set_timeout_id, clear_timeout
- sdk_api.ml: dispatch_custom (ls:open-dialog plugins)
- sdk_ui.ml: dispatch_custom ×6 (navigate/toast/right-sidebar/
  exit-editing), get_element_by_id, doc_query + rect_fields (boundingRect
  API), el_tag, el_computed_style(document_body) (theme css props),
  document_body, win_open, js_get
- settings_state.ml: body_set_data(settingsTab), query_selector,
  el_class_add/remove (wide-mode)
- left_sidebar_view.ml: win_inner_width, dispatch_custom, set_timeout,
  rect_*, query_selector, element_at, el_closest, el_bounding_rect
  (resize hit-targets)
- right_sidebar_view.ml: win_inner_width, get_element_by_id
- toast.ml: set_timeout_id, clear_timeout (auto-dismiss)
- rtc_flows.ml: set_timeout_id, on_document_event, document_visible,
  clear_timeout, add_window_listener (visibility-gated reconnect)
- views_state.ml: win_inner_height, `el` type
- views_query.ml: debounce
- runtime.ml: comment-only mention — no calls
- add_button.ml: `open Web_dom` — check actual unqualified uses

### B. Files/binary/downloads → new `files` group (host-backed both sides)

- exporter.ml: download_text/download_binary ×3 (sqlite/zip/edn/md/
  transit/export HTML), str_to_u8, decode_u8; auto-backup flow uses
  FS Access: show_dir_picker/get_dir/get_file/fh_get_file/fh_move/
  fh_writable/w_write/w_close/truncate_old_versions/h_name/
  picker_supported/set_interval — web-only capability
  (`picker_supported=false` on native → downloads fallback; dir-backup
  section gated already)
- importer.ml: file_text/file_buffer/file_name, u8_of_buffer,
  binary_to_u8, inflate_raw, el_files (file input), query_selector,
  later — importer reads picked File snapshots; native path supplies
  {name,size,path} snapshots via Browser_ui picker
- publish_view.ml: binary_to_u8 (publish bundle)
- editor_actions asset path: el_files/file_name/file_size/file_buffer

### C. Heavy imperative element construction → LUI port (user directive)

- graphs_view.ml (425 ln; 44 append/37 create/30 set_class): all-graphs
  page, dropdown menus appended to body, mounted under .graphs-host by
  graphs_mount subscription. Port to `Graphs_view.view model` LUI kind
  in page.ml's `Model.All_graphs` branch (currently `box []`),
  preserving .graphs-host + data-testid + menu classes. graphs_mount
  subscription dies (view renders declaratively).
- recycle.ml (224 ln; 17 append/16 create): recycle-bin rows injected
  as sibling of page pipeline. Port to LUI; mount from page.ml Recycle
  route — but page pipeline renders the Recycle page's own chrome;
  rows list becomes a LUI child. Keep .ls-recycle-page-content +
  data-testid="logseq_db_<n>" + span text <n> for e2e.
- collaborators.ml (372 ln): rtc collaborators dialog body — already
  called via `Collaborators.body ms` returning `t` (dialog slot);
  imperative inner construction → LUI.
- new_graph.ml (119 ln): new-graph dialog body → LUI (input kind for
  `input[placeholder='your graph name']`? check LUI input kind; else
  `text_input`-equivalent).
- importer.ml dialog `body`/`view` — mixed: file pickers via files
  group; view part → LUI.
- publish_view.ml `body` — dialog body → LUI; publish flow itself is
  Exporter.save_publishing bridge (keep).
- tooltip.ml (create/append tooltip div + doc listeners) → popup kind
  or keep-element-handle; decide on read.
- editor_commands.ml (45 h, 14 el_on, inline popups: link/tag forms
  under editor_popup_root) → LUI popup views; largest single rewrite.
- views cluster (views_builder/head/view/table/query + native
  views_popup twin): imperative `h`/`el_on`/`by_id` for header,
  popups, query builder, rename inputs. `native/views_popup.ml` is the
  native twin over Views_dom — replace BOTH with shared LUI popup
  views (popover+menu_item kinds exist; data-highlighted roving +
  aria-checked need care). Biggest cluster; may exceed pass scope.

### D. Native handwritten callers (rewire or delete)

- native/comments.ml: query_selector "#ls-block-<u> textarea" + focus/
  scroll → Dom_ext find-by-id + Host.dom_op focus; or Ui_services op.
- native/cmdk_host.ml: query_selector cmdk input/scroller, set_value,
  focus, set_selection_range, scroll_row_into_view, add_document_listener,
  set_timeout → native-side equivalents (the cmdk input is a LUI node
  on native; selection-range via Host dom_op or drop retry loop).
- native/logseq_editor.ml: textarea_of (find el by dom-id via
  doc_elements_provider), el_closest → Dom_ext-based helpers.
- native/views_popup.ml: see C (port or caller-map).
- native/asset_dom.ml: file_cell (Views_dom.el) dead — delete; keep
  file_cell_el (LUI t).
- native/native_embed.ml: Editor_dom.run_doc_scans (doc-scan engine —
  who registers? src render_libs registers via D=Web_dom on WEB only;
  src/render_libs.ml is NOT copied to native (native twin exists);
  native render_libs doesn't register → run_doc_scans is dead on
  native → drop call + engine). Imperative_dom.install/Vdom.init +
  lui_index/snapshot_of_id event_target_of → resolve snapshots
  directly via ext_snapshot once imperative els gone.
- native/ui_dom_native.ml: el_class_add/remove → Host.dom_op
  "class-add"/"class-remove"; document_element → inline JObject
  {"#ref":0}. ALSO: `el.rect` must call Dom_ext.bounding_rect +
  request_measure (currently zeros — bug vs old emulation).

## Ops to add to Ui_services (contract-first, both impls)

- timers: later?, set_timeout_id exists on Host — add `timers` group
  { timeout : int -> (unit -> unit) -> int; clear : int -> unit;
  interval : int -> (unit -> unit) -> int; clear_interval : int -> unit;
  debounce : int -> (unit -> unit) -> (unit -> unit) }
- dom: query_all, active_element, element_at(x,y), viewport_height,
  on_window_event, document_visible, dispatch_json(name,json payload)
  — dispatch_custom needs payload; reuse emit_json semantics on native
  (Platform.dispatch name payload) vs web dispatch_custom CustomEvent.
- el: focus, set_attr, rm_attr, value, set_value, contains, connected,
  scroll_into_view(+opts?), scroll_top get/set, scroll_height,
  client_height, id, tag?, click, query(child), query_all(child),
  computed_style?, set_checked/checked, set_selection_range,
  set_text_content? — prefer shared text ops only where truly needed
- ev: buttons, key(s), alt, client_x/y, default_prevented,
  stop_propagation, stop_immediate, clipboard(cd_get_data/ev_clipboard?),
  is_editable_target(target check)
- files: pick_files(~accept,~multiple,~directory, cb), download_text,
  download_binary, file_name/file_size/file_text/file_buffer,
  dir_backup_supported (= picker_supported)
- misc: open_url already env.open_url (win_open), confirm — dialog
  confirm exists? win_confirm → probably Ui_services dialog path or
  env.confirm op; check dialogs_state confirm.
- binary: str_to_u8/binary_to_u8/u8_of_buffer/decode_u8/inflate_raw —
  binary codec; keep behind files group or a `bin` group; on web real
  impls, on native Bytes-based where used paths can be hit
  (binary_to_u8=str for publish zip; u8_of_buffer only web file inputs;
  inflate_raw web-only import path → files.inflate? only reachable via
  importer which is C-listed → may stay web-only)

## Open decisions

1. `el`/`ev` handle types: Ui_services.el record-of-closures vs
   carrying a payload — current design is opaque record; add ops as
   fields. `Web_dom.el`-typed record fields in callers (pv_pending,
   cm_hi_el, results_inner...) become Ui_services.el.
2. `h`/create_element/append_child: NOT added to services — that IS
   the emulation we kill; imperative builders port to LUI.
3. `ensure_dom_fixups` (tree.ml): dev fixup; check semantics — likely
   droppable on native (native impl = no-op already).
4. e2e selectors to preserve in ports: .graphs-host, .graphs-page-…,
   [role=menuitem] menu, .ls-recycle-page-content section>div>div,
   div[data-testid='logseq_db_<n>'] span:text '<n>',
   input[placeholder='your graph name'], .ui__toast.*.
5. `Web_dom.ev` type in popups (handler params) → Ui_services.ev.

## EXECUTION STATE (resume here after compaction)

Branch devin/SHAREDUI-task6c. Files changed so far (uncommitted):
- src/contracts/ui_services.ml + .mli: added `timers` (timeout/clear/
  interval/clear_interval/debounce/later), `files` (file record
  {file_name,file_size,file_text,file_binary,file_json} + pick_files/
  download_*/of_json/binary_to_u8/str_to_u8/decode_u8/inflate_raw/
  dir_picker_supported/show_dir_picker/dir_name/get_dir/get_file_handle/
  fh_file/fh_move/fh_writable/w_write/w_close/truncate_old_versions),
  `el` gained `raw : Js.Json.t` + focus/select_text/set_selection_range/
  set_attr/rm_attr/value/set_value/set_text/checked/set_checked/contains/
  connected/click/scroll_into_view/scroll_into_view_nearest/scroll_top/
  set_scroll_top/scroll_height/client_height/id/tag/editable/query/
  query_all/files/style_prop; `ev` gained buttons/alt/default_prevented/
  clipboard_get/clipboard_set/data_transfer_get/stop_propagation/
  stop_immediate; `dom` gained on_window_event/query_all/by_id/
  active_element/element_at/body/viewport_height/document_visible/
  dispatch_json/confirm/scroll_row_into_view(~scroller ~row)/
  ensure_fixups. All accessors added bottom of .ml + .mli.
- src/core/ui_dom_web.ml: externals added (focus_js..body_js, FS-access
  externals redeclared over Js.Json.t, dir_picker_supported,
  truncate_old_versions_js, decode_u8_js, inflate_raw_js delegating to
  Web_dom, picker_create_opts/picker_rw_opts); file_of_json added.
  IN PROGRESS: el_of extended BUT missing `raw = e` field (must add
  `Ui_services.raw = e` and fix `contains` to use `other.Ui_services.raw`),
  ev_of needs new fields (buttons/alt/default_prevented/clipboard_get/
  clipboard_set/data_transfer_get/stop_propagation/stop_immediate),
  ops needs new dom fields (on_window_event/query_all/by_id/
  active_element/element_at/body/viewport_height/document_visible/
  dispatch_json/confirm/scroll_row_into_view/ensure_fixups) + timers +
  files records. scroll_row_into_view web impl = Web_dom.scroll_row_into_view
  ~scroller:(scroller.Ui_services.raw) ~row:(row.raw).
- THEN: web/platform_web.ml install ~145-223 gains ~timers ~files args,
  Ui_services.t gains timers/files fields; js_app/main.ml:49 +
  test/test_main.ml:6 pass Ui_dom_web.timers/files.
- THEN: native/ui_dom_native.ml rewrite (el_of over Dom_ext+Host.dom_op,
  ev_of new fields, ops new fields, timers via Host.set_timeout +
  recursive interval, files via Browser_ui + failwith fs-access ops).
- THEN: native/services/platform_native.ml install_ui_services gains
  timers+files; native/native_embed.ml:380 + gpui/drive_test.ml:1924
  install sites update.
- Build: cd deps/ui && opam exec --switch=5.5.0 -- dune build js_app test
  native/native_embed.exe.o gpui/native_embed.exe.o
- Baseline: 1,881 checks (1 pre-existing decorate-mod fail), native 578
  (5 expected), boundaries OK. digestif installed manually this session.
- Caller maps: /tmp/dual_all.txt (54 dual files incl. aliases),
  /tmp/dual_calls.txt (per-file op counts), /tmp/copied_norm2.txt (111
  copy rules).

## Remaining work after contract lands
- ~30 mechanical dual files → Ui_services_* accessors (mapping in
  review doc section A).
- exporter/importer file paths → files ops; FS-access dir-backup stays
  in exporter.ml gated by files_dir_picker_supported (native=false,
  ops failwith — unreachable).
- LUI ports: graphs_view/recycle/collaborators/new_graph + tooltip +
  editor_commands + views cluster + both views_popup.
- native rewires: ui_dom_native(above), native_embed (drop
  Imperative_dom.install/Vdom.init/run_doc_scans; event_target_of via
  ext_snapshot directly), logseq_editor (textarea_of via
  Dom_ext doc_elements_provider id match; el_closest via Dom_ext),
  comments (query by id + focus/scroll via Host.dom_op),
  asset_dom (delete dead file_cell), cmdk_host (input focus/value/
  scroll via new ops).
- Then delete native/{web_dom,vdom,imperative_dom,editor_dom,
  properties_dom,views_dom}.ml + copy rules; trim dom_ext.

## STATE UPDATE 2 (after contract landed)
- Committed+pushed f8310e479f: contract extension (timers/files groups,
  el/ev/dom +~35 ops, Json.t/Ui_task.t/fs_* op-records — all portable,
  no Js types in contracts), ui_dom_web+ui_dom_native impls, dom_ext
  absorbed el ops (set_attr/class_add/remove/set_class/scroll_*/
  click/select_text/set_checked/contains/by_id/active_element +
  focus/blur listener), platform_web/platform_native install signatures
  gained ~timers ~files, call sites updated. Build + suites + boundaries
  ALL GREEN at f8310e479f.
- devin/task6c-migration-map.md committed (accessor table for children).
- 4 children dispatched on branch devin/SHAREDUI-task6c-m{1,2,3,4} off
  f8310e479f: m1 app/sdk/misc (107e7611), m2 editor/blocks (4f9620af),
  m3 views/properties/popups (e9ddb1ea), m4 graphs LUI ports (bc2f4789).
- My remaining work: native/cmdk_host.ml (D.query_selector/el_focus/
  set_value/set_selection_range/scroll_row_into_view/add_document_
  listener/set_timeout/dispatch_custom/el_bounding_rect→services),
  native/logseq_editor.ml:309-320 (Editor_dom.textarea_of +
  el_closest→Dom_ext/services), native/views_popup.ml (37 Editor_dom
  refs — LUI port or remaining-map), native/native_embed.ml
  (Imperative_dom.install/Vdom.init/run_doc_scans dead → drop),
  asset_dom file_cell deleted (done), comments.ml done.
- After children report: merge their branches into devin/SHAREDUI-
  task6c, grep-verify zero src callers, delete native/{web_dom,vdom,
  imperative_dom,editor_dom,properties_dom,views_dom}.ml + copy rules,
  trim dom_ext, full verify, push, report.
