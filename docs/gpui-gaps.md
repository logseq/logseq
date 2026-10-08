# GPUI interaction gaps vs web/master

Status of the four known interaction gaps between the GPUI native host
(`deps/ui/gpui/host`) and the web (Melange) host. Branch
`devin/component-migration`, OCaml object `gpui/native_embed.exe.o` built
with `opam exec --switch=5.5.0 -- dune build`, host with `cargo build`.

## 1. Dialog Tab focus trap — implemented

Web parity target: Radix `FocusScope` — Tab wraps inside the dialog,
Shift+Tab walks backwards, focus restores to the pre-dialog element on
close.

- `src/dialogs/dialogs_state.ml`: `trap_tab` is now self-driven on
  native — it computes the next/previous focusable element inside the
  dialog itself and dispatches the focus op, instead of relying on the
  browser's default Tab traversal (which does not exist on gpui). The
  web path is unchanged.
- `gpui/host/src/focus.rs` (new): materializes `gpui::FocusHandle`s for
  LUI focus nodes (`shared.focus_nodes`), intercepts the `focus` dom-op
  before generic domops, tracks the last focused node, and emits
  `focus`/`blur` dom-events back into OCaml so `editor_dom`'s
  `active_element` bookkeeping stays correct — required for focus
  restore on dialog close.
- `native/editor_dom.ml`: `get_element_by_id` returns the real element
  provider shape instead of a stub; the focus listener uses the target's
  `#ref` so `active_element` tracks what gpui actually focused.
- `native/vdom.ml`: `node_of_dom_id` accepts `node-N` ids the host
  materializes.

## 2. IME composition — implemented

The plumbing was already complete end to end (`EntityInputHandler`:
`marked_text_range`/`unmark_text`/`replace_and_mark_text_in_range`/
`bounds_for_range` → caret-anchored candidate window). What was missing
on both hosts: marked text was never rendered — web keeps it in the
invisible `.ed-input` textarea, gpui kept it in a Rust scratch buffer.

- `edit_model.ml`: `composition` is now `(start, stop, marked_text)`
  and `composition_update` stores the marked text.
- `edit_view.ml`: new `Frag_marked` fragment (run tag `b'c'`,
  zero-width in model coordinates) injected by `inject_marked` at the
  composition start; renders as `.ed-r.ed-comp`.
- `logseq_ext.rs`: `.ed-comp` class registered
  (`text-decoration:underline`, matching platform IME styling);
  `lui-core.css` gets the same rule for the web host.
- `editor.rs` `offset_in_run`: tag `b'c'` maps any click inside marked
  text to the composition start (its span is zero-width in model
  coordinates). `caret_rect` already falls through to text layout,
  which anchors `bounds_for_range` at the composition start for the
  candidate window.

## 3. Video embed width-drag — implemented

cljs reference: `video-resize-handle` drags, clamps to
`[160, parentWidth]`, double-click resets to 560, and mouseup rewrites
`, w=N` inside `{{name url, w=N, ...}}` via
`update-video-macro-width-in-content`, saving through
`save-block-if-changed!`.

- `render_inline.ml`: `video_embed_shell` renders a
  `video-embed-resize-handle` element; `lui-core.css` styles it.
- `video_resize.ml` / `editor_keys.ml`: document-level mousemove drags
  update the frame width via an imperative style dom-op (no remount);
  mouseup runs the same `, w=N` regex write-back as cljs and persists
  via `Outliner_ops.save_block_parsed`. Double-click resets to 560.

## 4. Plugins dialog — implemented (with one documented deferral)

`native/plugins_view.ml` and `native/plugin_readme.ml` are full ports
of the web dialog (search, category tabs, control tabs, market cards,
installed panel, per-plugin settings forms). `native/plugin_host.ml`
implements the registry, install/update/uninstall bookkeeping, pinned
plugins, and per-plugin settings persistence under the same
`LSPUserDotRoot/...` localStorage keys web uses.

To make the marketplace functional, `native/fetch.ml` now routes every
`http(s)://` request through a new `Host.http_get` platform request;
`main.rs` answers it on a background thread via `curl` and pushes an
`"http-get"` platform event back through `lui_ocaml_platform_event`
(drained in `pump_tick`), resolved by `Fetch.note_http_result`.
`render_html.ml` gained a small `markdown_to_html` so plugin READMEs
render inline — there is no iframe/webview to embed remote HTML.

### Documented deferral: the JS plugin runtime

`LSPluginCore` is a JavaScript sandbox (`js/iframe` + sdk bundle).
There is no JS engine on the native host, so plugins cannot *execute*
— `toolbar_items`, `palette_commands`, `hook_app`, `exec_*`, and
`make_asset_url`-style asset serving are registry-aware stubs by
design. Install/remove/settings work because they are pure
bookkeeping. Supporting execution requires embedding a JS engine and
porting the sdk event bridge — a separate project.

## Bridge ABI updates

The vendored `native/logseq_lui_bridge.c` predated the current
lui-gpui crate; missing exports added in logseq's own dispatch style:
`lui_ocaml_press_ex` (modifier-aware press, falls back to plain
`lui_ocaml_press` when unregistered), `lui_ocaml_text_changed_utf8`,
`lui_ocaml_picked_utf8`, `lui_ocaml_extension_event_utf8`
(bounded (ptr,len) copies), and `lui_ocaml_resync` (host mirror
recovery). `native_embed.ml` registers `lui_ocaml_resync`, encoding a
full-tree batch via `Lui_runtime.resync_batch`.

## Verification

- `dune build gpui/native_embed.exe.o` clean; `cargo build` links the
  binary clean (3 pre-existing warnings, none from this change).
- App launches on macOS: window renders, OCaml→gpui patch pipeline
  delivers the boot tree and toasts.

### Documented exception: interactive/pixelmatch verification

Runtime pixel comparison is not possible on this machine: boot dies at
`thread-api/init` → `graph/load-error` because the native daemon
`deps/db-worker/bin/main.exe` has never been built here and no switch
(5.5.0, logseq-journal, default, bonsai-ui) carries its deps (eio,
mldoc, datascript-ocaml pins). Without a graph, none of the touched
surfaces (dialogs, editor, plugins) are reachable, so no gpui
screenshots can be produced — and without them pixelmatch has nothing
to diff against a web reference. Verification here is therefore
build-level plus line-by-line port review against
`src/dialogs/plugins_view.ml`, `plugin_readme.ml`, and the cljs
references. To close this exception: provision a switch for
deps/db-worker, build `bin/main.exe` (or pass `LOGSEQ_DB_WORKER_BIN`),
then diff the four surfaces against web.
