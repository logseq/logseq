# Unsupported e2e scenarios (Drive harness)

Scenarios the `deps/ui` Drive harness cannot exercise end-to-end, with
the reason the coverage stays out of `deps/ui/test/parity_drive_test.ml`.

- Caret geometry (pixel-accurate caret/selection position, visual-line
  up/down across soft wraps, `caret_to`, `caret_px`): the stub DOM has
  no layout engine, so `conduit` measurements always come back empty and
  the caret overlay never receives real coordinates.
- Mouse-driven block hit-testing (click-to-place-caret,
  `dom_element_at` pointer resolution, drag-select across rows):
  pointer hit-testing is a renderer/geometry concern that the replayed
  patch tree does not model.
- Context-menu hover intent (`cm_hover` hover->open-submenu timing,
  submenu aim/edge proximity, `on_pointermove` hover highlighting):
  hover dispatch lives on `document.body` mousemove against real DOM
  rects; only the programmatic `open_cm_sub`/`close_cm_sub` paths are
  driven in tests.
- Block context-menu keyboard focus bookkeeping beyond highlight state
  (`focus_cm_item` -> real element `focus()`, `scroll_into_view_nearest`
  visibility): no real DOM focus/scroll model exists under the stub.
- Native NSMenu experiment (`Ui_services.env_menu_popup` accepting the
  serialized spec, `native-menu-select` reply routing): depends on the
  host menu provider; the web stub never claims the menu so only the
  LUI fallback path runs.
- Slash popup measurement/positioning (`measure_ac` retry loop,
  `Editor_sink.popup_pos` returns from a mounted logseq-editor sink):
  without a mounted sink the popup stays `pos_pending`, so popup x/y
  placement cannot be asserted.
- CodeMirror key routing inside the editor (`(contains-class target
  "CodeMirror")` branch, CM command fallthrough): CodeMirror is not
  mounted under the stub DOM.
- `block_paste`/`copy`-level events, clipboard payloads, drop events:
  the harness has no real clipboard or DnD plumbing.
- IME composition flows (compositionstart/update/end, `ev.composing`
  suppression of popup keys): synthesized composition events do not
  exercise the native IME pipeline.
- Search-index-backed autocomplete results (`run_node_search` worker
  `search-blocks` hits, `load_titles`/`load_tag_titles` real DB rows):
  the fake worker returns canned values; only deterministic local items
  (nlp dates, New page/tag rows, slash list, templates) are asserted.
- Template-search and query-search popups (`Template_search`,
  `Query_search`, `Query_builder` commands): they require seeded
  templates/query worker data and are covered only by presence of the
  popup kind.
- Property dialog host wiring end-to-end (open from a real row, modal
  focus trap, Tab order inside the dialog): the dialog mounts against
  worker-fetched block data; the Drive tree replays only the rendered
  shell.
- Settings key-recorder (`keymap_record`) capturing real key chords:
  the recorder needs focused DOM capture and platform key semantics the
  stub event fabricator does not reproduce.
- Theme/CSS paint (dark-mode classes on the real <html>, accent-color
  computed styles, font loading): no style engine exists; only state
  transitions are checked.
- GPU/render-thread correctness (SwiftUI/NSView layer parity, z-order,
  hit regions on macOS): Drive asserts on the emitted patch tree, not
  the native host's painted output.
- Real worker round-trips beyond recorded op payloads (transaction
  ordering, refresh deltas arriving back through `on_message`,
  conflict handling): Fake_worker resolves synchronously with canned
  replies, so only outbound op shapes are pinned.
- Editor commit tails (`exit_edit`/`split_at_cursor` finish + restore
  races): `commit_result`/`run_structure` complete only when the worker
  save/apply result and reload-origin match are observable — canned
  replies keep the commit pending or trip the failure-restore path, so
  parity tests pin routing (`last_edit_uuid`, selected set, emitted
  ops) rather than the post-commit editing record.
- Sink-targeted keys: keys whose DOM target is the mounted
  `.ed-input` conduit input take the sink emit path, not the
  document-capture `on_keydown` path — parity tests feed
  `Editor_keys.on_keydown`/`apply_input` directly, covering the
  remount-window (`on_pending_focus_key`) funnel but not the
  conduit-emitted event path.
- Window-level key routing outside document capture (global macOS
  shortcuts, OS-level Cmd+K while unfocused): there is no window
  server in the harness.
- Plugin SDK surfaces (plugin-supplied slash items executing real
  plugin code, `ls:editor-plugin` dispatch payloads): plugin host is
  stubbed; only empty-plugin fallbacks are verified.
- Journals route + multi-page interleaving of optimistic edits
  (`Journals_spliced` refresh while editing): the staged page fixture
  covers a single route page; journal splicing is exercised elsewhere.
