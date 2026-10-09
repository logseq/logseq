# Task 6c caller migration map

All 54 files under deps/ui/src/ are compiled for BOTH Melange (js_app)
and native (source-copy into logseq_ui_native). Inside them the module
`Web_dom` resolves to native/web_dom.ml (emulation) on native. Goal:
move every call onto Ui_services ops or LUI views so the emulation
modules can be deleted.

## New Ui_services surface (on devin/SHAREDUI-task6c)

Accessors (all `let s = Ui_services` style, no open needed):

- timers: `timers_timeout f ms -> int`,
  `timers_clear_timeout id`, `timers_interval f ms -> int`,
  `timers_clear_interval id`, `timers_debounce ms -> (unit->unit)->unit`
  (returns a scheduler; call the scheduler with the fn),
  `timers_later ~ms f`
- dom: `dom_on_document_event name (fun ev -> ...)`,
  `dom_on_window_event name (fun ev -> ...)`,
  `dom_query sel -> el option`, `dom_query_all sel -> el list`,
  `dom_by_id id -> el option`, `dom_active_element () -> el option`,
  `dom_element_at x y -> el option`, `dom_root () -> el`,
  `dom_body () -> el`, `dom_viewport_width/height () -> float`,
  `dom_document_visible () -> bool`, `dom_dispatch name`,
  `dom_dispatch_json name (Json.t)` (payload = contracts Json.t),
  `dom_open_dialog name`, `dom_confirm msg -> bool`,
  `dom_scroll_row_into_view ~scroller ~row`,
  `dom_ensure_fixups ()`,
  `dom_apply_left_sidebar_width px`, `dom_selected_block_uuids ()`
- files: `files_pick_files ?accept ?multiple ?directory (fun files -> ...)`,
  `files_download_text ~filename ~mime text`,
  `files_download_binary ~filename ~mime binstr`,
  `files_inflate_raw s -> string Ui_task.t`,
  `files_dir_picker_supported () -> bool` (native=false),
  `files_show_dir_picker () -> fs_dir Ui_task.t`
- el record (`let e = el in e.Ui_services.xxx`): `closest sel`,
  `attr name`, `rect () -> (x,y,w,h)`, `set_style n v`, `add_class`,
  `remove_class`, `offset_width`, `focus`, `select_text`,
  `set_selection_range a b`, `set_attr n v`, `rm_attr n`, `value`,
  `set_value`, `set_text`, `checked`, `set_checked`, `contains other`,
  `connected`, `click`, `scroll_into_view`, `scroll_into_view_nearest`,
  `scroll_top`, `set_scroll_top`, `scroll_height`, `client_height`,
  `id`, `tag`, `editable`, `query sel`, `query_all sel`,
  `files () -> file list`, `style_prop name`
- ev record: `x y shift meta ctrl alt composing key buttons
  default_prevented target touches detail clipboard_get clipboard_set
  data_transfer_get files prevent_default stop_propagation
  stop_immediate`
- file record: `file_name file_size file_text () -> string Ui_task.t
  file_binary () -> string Ui_task.t` (binary = raw bytes string)
- fs_dir/fs_file/fs_writable op-records for the exporter auto-backup
  flow (web only): `dir_id dir_name get_dir get_file
  truncate_old_versions`, `fh_file fh_move fh_writable`,
  `w_write s w_close`
- env group already has `env_open_url`, `env_random_uuid`;
  clipboard group `clipboard_copy/write_text/read_text`;
  session/storage groups exist.

## Rules for migrated code

- Replace `Web_dom.foo`/`D.foo`/`open Web_dom` entirely — no references
  to Web_dom/Vdom/Imperative_dom/Editor_dom/Properties_dom/Views_dom may
  remain in the file (grep it).
- `Web_dom.debounce ms` usage `D.debounce ms f` maps to
  `(Ui_services.timers_debounce ms) f`.
- `dispatch_custom name payload` callers build `Json.t`
  (`Json.Object [k, Json.String v]`, `Json.Null`); flat detail objects
  only need `Json.Object [(key, Json.String v)]`.
- `ev_detail`/`event_str` on custom events → `ev.detail name`.
- Rect users: `el.rect ()` returns `(x,y,w,h)` — destructure instead of
  rect_left/rect_top/etc.
- `bounding_rect` on a raw element → use `dom_query`/`ev.target` els.
- Elements are obtained from `dom_query*`, `dom_by_id`, `ev.target`,
  `el.closest/query` — never constructed.
- If a file needs create_element/append_child/el_on/el_set_inner_html/
  h/txt/icon (DOM construction), it is a LUI-port file — do NOT fake
  it; list it in the report instead of migrating.
- Verify: `cd deps/ui && opam exec --switch=5.5.0 -- dune build js_app
  test native/native_embed.exe.o gpui/native_embed.exe.o` must pass.
- Commit(s) with imperative English subjects on YOUR branch, push it.
- Report: files migrated, calls that had no honest mapping (with the
  exact call sites), build status.
