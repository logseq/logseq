# `dom()` deletion plan

Inventory of everything that must go once the last `dom ~` call sites are
drained, verified by grep at `devin/component-migration` @ `4d492c4622`.
Read-only: this document changes nothing.

`dom` is the raw-DOM escape hatch the LUI migration is removing (see
`.agents/skills/logseq-lui` rule 2 and `docs/component-migration.md`,
`docs/component-residuals.md`). It emits `logseq-<tag>` extension nodes with
JSON `attrs`, string `events`, and `dom-event` callbacks — none of which are
typed LUI props.

## 1. The `dom` builder

Defined twice — web and apple twins:

| File | Lines | Notes |
|---|---|---|
| `src/extension/logseq_dom.ml` | 149–201 | web (`web_profile` = WebOS/WebHost) |
| `apple/logseq_dom.ml` | 154–217 | apple twin adds `apple_profile` (SwiftUI) + `gpui_profile`; `on_dom_event` additionally registers `Platform.register_dom_handler` and re-dispatches via `Platform.emit_event` |

Signature (both files):

```ocaml
val dom : ?key:.. -> ?tag:string -> ?attrs:(string * string) list
  -> ?events:string -> ?style_class:string
  -> ?style_class_signal:wire_value Signal.signal -> ?attrs_signal_v:..
  -> ?text_signal:.. -> ?id_signal:..
  -> ?id:string -> ?text:string -> ?html:string
  -> ?on_dom_event:(string -> string option -> unit)
  -> Lui_elements.t list -> Lui_elements.t
```

Call-site shapes the drain must cover (a bare `dom ~` grep misses most of
these spellings):

| Shape | Count @ 4d492c4622 | Example |
|---|---|---|
| `dom ~…` (via `let dom = Logseq_dom.dom` / `let dom = D.dom` aliases or `open Logseq_dom`) | 126 matches in 35 files (`grep -rn 'dom ~' deps/ui/src deps/ui/apple`) | `src/blocks/tree.ml` (23), `src/pages/page.ml` (19), `src/graphs/importer.ml` (11), `apple/chrome.ml` (11) |
| `let dom = …` alias definitions | 21 | e.g. `src/pages/page.ml:16`, `apple/comments.ml:21`; `D` = `module D = Logseq_dom` in `src/sidebar/*`, `src/views/*`, `apple/views_table.ml` |
| `Logseq_dom.dom` qualified refs | 53 (incl. alias defs and comments) | `src/popups/popups_view.ml` (5), `apple/chrome.ml` (11), `apple/cmdk_view.ml` (9) |
| `D.dom` refs | 13 | `src/virt/virt_list.ml` (3), `apple/virt_list.ml` (4) |
| `open Logseq_dom` | 1 | `src/cards/cards_view.ml:5` — all exports used unqualified there |
| `dom` without `~` args | 2 | `gpui/drive_test.ml:533`, `test/test_drive.ml:460` (`Logseq_dom.dom [ … ]` mounts) |
| `on_dom_event` kwarg uses | 35 | ride along inside `dom ~` sites |

Warning on the `D.` alias: `module D = Logseq_dom` and `module D = Web_dom`
coexist (`src/blocks/selection_bar.ml:40`, `apple/comments.ml:17` use
`Web_dom`). `D.dom` is only `Logseq_dom.dom` in the files listed above —
check which `D` each file binds before deleting.

Two `dom ~` matches are machinery-internal, not user call sites:
`nothing`'s self-call in each `logseq_dom.ml`, and the three `ui_parts.ml`
fragments (`mock_text`, `editor_inner`, `editor_wrapper` — held back by the
pending `logseq-editor` surface work, `ui_parts.ml:44`).

## 2. `Logseq_dom` module surface

`src/extension/logseq_dom.ml` + `apple/logseq_dom.ml`. Export-by-export:

| Export | Consumers (outside the two files) | After `dom` dies |
|---|---|---|
| `dom` | everything in §1 | delete |
| `tags` | `dom_adapter.ml:431` (adapter table), `render_dom.ml:16` (`registered_tag`), `imperative_dom.ml:238` (`ident_of_tag`) | delete |
| `identifier` | `dom_adapter.ml:430`, `test/test_lui_apply.ml` (×4), `imperative_dom.ml` (via `tags`) | delete |
| `tag_of_identifier`, `esc`, `string_of_wire`, `schema_of`, `child_identifiers` | internal only | delete |
| `attrs_json` | `src/popups/popups_view.ml:18` (`attrs_v`) | delete (dies with its call site) |
| `register` | `js_app/main.ml:46`, `apple/native_embed.ml:324`, `gpui/drive_test.ml:58,527`, `test/test_lui_apply.ml:71`, `test/test_drive.ml:29,454` | delete |
| `web_profile` | `test/test_drive.ml:36,457` | delete (harnesses can build the profile record inline) |
| `apple_profile`, `gpui_profile` | `gpui/drive_test.ml` (×2) | delete (same) |
| `class_signal`, `attrs_signal`, `reactive_class`, `reactive_attrs`, `reactive_text` | `tree.ml`, `page.ml`, `render_inline.ml`, `virt_list.ml` (both twins), `export_view.ml`, `cmdk_view.ml` (both), `asset_dom.ml`, `apple/chrome.ml`, `apple/pdf.ml`, `popups_view.ml`, `render.ml` — all produce `wire_value` signals that only feed `dom`'s `~*_signal` params | die with the call sites that consume them |
| `own` | `src/editor/edit_view.ml` (one use, for `extension_property_signal` on `logseq-editor`) | relocate — needed by surviving extension code; move next to the editor or into a surviving helper |
| `trace_equal`, `dyn` | **zero** external consumers (ppx expands `reactive` to `Lui_elements.dyn` directly; `dyn` is banned in view code per the logseq-lui skill) | delete (already dead) |
| `if_`, `keyed` | 10 and 8 refs — `ui_requests.ml`, `collaborators.ml`, `exporter.ml`, `new_graph.ml`, `page.ml`, `cmdk_view.ml` (both), `tree.ml`, `dialogs_view.ml` | relocate — signature shims over `Lui_elements.if_`/`keyed`; either move to `Ui_parts`/`Lui_elements` or rewrite call sites to the `Lui_elements` names |
| `nothing` | 29 refs across 9 files (`tree`, `selection_bar`, `left_sidebar_view`, `comments_view`, `cards_view`, `pdf_annotation`, `popups_view`, `page_menu`, `page`) | **problematic**: implemented as `dom ~tag:"raw-text"` — depends on the family it's part of. Needs a non-extension anchor upstream in LUI before the family can go (see §5) |
| `fragment` | 14 refs across 12 files | relocate — pure `Lui_elements.mount_children` helper, no dom dependency |

So `logseq_dom.ml` is not a single deletion: roughly half the module is
load-bearing structural plumbing that must move first. Deleting the file
before relocating `nothing`/`fragment`/`if_`/`keyed`/`own` breaks ~70
references across ~25 files.

## 3. `logseq-*` tags, adapters, and the dom-op channel

### Tag tables

`Logseq_dom.tags` enumerates the `logseq-<tag>` identifiers:

- **web** (`src/extension/logseq_dom.ml:22–33`): 69 tags — the HTML set plus
  SVG (`svg path circle rect line polyline polygon g defs use ellipse tspan`)
  plus `sup` and `raw-text`.
- **apple** (`apple/logseq_dom.ml:31–42`): 67 tags — same set minus
  `blockquote del ins sub`, plus apple-only `em-emoji` and `pdf`. The apple
  list doubles as transport for dedicated widgets: `apple/logseq_emoji.ml`
  and `apple/logseq_katex.ml` mount through `Logseq_dom.dom ~tag:"em-emoji"`
  / `~tag:"div|span"`, and `apple/pdf.ml` mounts `dom ~tag:"pdf"` — on apple
  these are generic-family members, not separately-registered extensions.

### Registration and adapters

| Host | Registration | Adapter |
|---|---|---|
| web | `js_app/main.ml:46` `Logseq_dom.register registry` | `src/extension/dom_adapter.ml` — `adapters` map (lines 427–434) consumed at `main.ml:51–52`; also carries the `logseq-em-emoji`, `logseq-katex`, `logseq-codemirror` adapters |
| apple (SwiftUI/GPUI profiles) | `apple/native_embed.ml:324` `Logseq_dom.register registry` | no OCaml-side adapter — `logseq-*` nodes cross the `apply_batch` → `platform_request` wire (`native_embed.ml:307–321`) and are rendered by the Swift host (`logseq/lui` `platform/apple/Sources/LUIAppleBackend/LUIAppleExtension.swift`) or the gpui Rust renderer (`platform/gpui/crates/lui-gpui/src/extension.rs` routes `logseq-*` → `dom.rs`) |
| gpui test harness | `gpui/drive_test.ml:58,527` | same Rust renderer |
| unit tests | `test/test_lui_apply.ml:71`, `test/test_drive.ml:29,454` | `test/stub_dom.ml` stub DOM + real adapters |

`dom_adapter.ml` cannot be deleted wholesale: `Logseq_editor` reads
`Dom_adapter.emit_get`/`emit_set` (`logseq_editor.ml:291,582`), and the
`adapters` map is the only place the emoji/katex/codemirror web adapters are
registered. Those four things (`emit_*` helpers + three dedicated-widget
adapters) must move out before the file goes.

### `Host.dom_op` channel

`apple/host.ml:88`: `dom_op name payload = !host_op "dom-op" (name ^ "\n" ^ payload)`
— an envelope on the shared host wire (alongside `open-url`, `clipboard`,
etc.), **not** a logseq-*-specific channel. 39 call sites in 9 files send
24 distinct op names:

- **element ops** (serve the imperative/vdom DOM mirrors and `dom_ext`):
  `set-attr`, `remove-attr`, `set-class`, `class-add`, `class-remove`,
  `set-text-content`, `set-value`, `set-selection-range`, `focus`,
  `scroll-into-view`, `scroll-row-into-view`, `measure-node`,
  `natural-size`, `remove`, `style-set-property`, `insert-adjacent-text`
- **imperative attach**: `imperative-attach`, `imperative-detach`
  (`imperative_dom.ml` body-attached elements)
- **host services, non-dom**: `download-text`, `download-binary`,
  `open-file-picker`, `save-file` (`browser_ui.ml`, `export_page.ml`)
- **render-lib readiness**: `katex-pending`, `hljs-pending` (`render_libs.ml`)
- **debug**: `dump-frames` (`vdom.ml`, `native_embed.ml`)

Extension create/prop ops do **not** ride `dom_op` — they go through the
`apply_batch` wire. No `dom_op` caller is the `logseq-*` adapter itself, so
deleting the family removes no `dom_op` consumer directly; the channel
stays. (If the apple imperative/vdom mirrors are later rewritten, their
element ops drain away with them — but file/download/render-lib/debug ops
keep the channel alive regardless.)

## 4. Deletion order

The `logseq-*` family fails at **runtime** (`invalid_arg "unknown extension
identifier"`, documented in `render_dom.ml:4–6`) when a node emits an
identifier that is no longer registered — and at **compile time** when
deleted exports still have consumers. Order accordingly:

1. **Drain `dom ~` call sites to zero** — all six call shapes in §1
   (aliases, `D.dom`, qualified `Logseq_dom.dom`, `open Logseq_dom`,
   `render_dom.el` wrappers, bare-`dom` mounts in tests/harness). Includes
   the apple widget mounts (`logseq_emoji`/`logseq_katex`/`pdf`) and
   `ui_parts.ml`'s three editor-surface fragments (gated on the
   `logseq-editor` surface work).
2. **Migrate the non-`dom ~` emitters** (§5): `imperative_dom.ident_of_tag`
   + `vdom.ml:275` + the `logseq_katex.ml:59` `logseq-span` holder.
   `grep 'dom ~' = 0` alone is not sufficient.
3. **Relocate surviving exports**: `if_`/`keyed`/`fragment`/`nothing`/`own`
   to their new home (see §2); `nothing` additionally needs its
   `raw-text`-free implementation landed first. Break if skipped: ~70 refs
   across ~25 files fail to compile.
4. **Extract `dom_adapter.ml`'s non-dom contents**: move `emit_get`/
   `emit_set`/`cleanup`/`set_class` helpers and the emoji/katex/codemirror
   adapter registrations to their own modules (or `Cm_adapter`-style
   files), update `js_app/main.ml:51–52` to build the map without
   `Dom_adapter.adapters`. Break if skipped: `logseq_editor.ml` fails to
   compile; surviving dedicated extensions lose their adapters → runtime
   `unknown extension identifier`.
5. **Delete the builder + family machinery**: `dom`, `tags`, `identifier`,
   `tag_of_identifier`, `esc`, `attrs_json`, `string_of_wire`,
   `schema_of`, `child_identifiers`, `register`, `*_profile`,
   `class_signal`/`attrs_signal`/`reactive_*`, `trace_equal`, `dyn` — in
   both `logseq_dom.ml` files. Break if early: every `dom` call site and
   every `Logseq_dom.*` consumer.
6. **Delete `render_dom.ml`'s `el`/`registered_tag`/`fallback_tag`**
   wrapper (or the whole file if `txt`/`text_of_class_signal` move too).
7. **Remove registration sites**: `js_app/main.ml:46`,
   `native_embed.ml:324`, `gpui/drive_test.ml`, `test_drive.ml`,
   `test_lui_apply.ml`. Break if early: runtime `unknown extension
   identifier` at the first `logseq-*` mount.
8. **Remove the web raw-text machinery** in `web_dom.ml`:
   `replace_all_raw_text`, `el_set_swap_text` (`__lsText`),
   `ensure_raw_text_observer`, `raw_text_observer_installed`, and the
   raw-text half of `dom_fixups` — plus the `tree.ml:487` install call and
   the apple no-op stub `editor_dom.ml:575` / its `cmdk_view.ml:899`
   caller. Keep `register_doc_scan` (used by `add_button.ml`,
   `render_libs.ml`, `code_mirror.ml`) and `strip_lui_node_ids`. Silent
   break if early: `nothing` renders a literal `<raw-text>` element
   instead of a text node — no compile error, a DOM-shape regression.
9. **Apple snapshot decode cleanup**: `native_embed.ml:77–79` strips the
   `logseq-` prefix in `ext_shallow_snapshot` — dead code after the family
   is gone.
10. **Tests**: rework `test_lui_apply.ml` (registers the family, asserts
    `logseq-div`/`logseq-raw-text`/`logseq-svg` node kinds),
    `test_drive.ml` (mounts via `Logseq_dom.dom`/`web_profile`),
    `gpui/drive_test.ml` (registers + `gpui_profile` + `dom` mount).
    `edit_view_test.ml` only touches `logseq-editor` — survives.
    `stub_dom.ml:302` raw-text comment goes with the machinery.
11. **Keep `Host.dom_op`** — §3 shows non-dom consumers. Delete nothing
    here.
12. **Cross-repo cleanup (logseq/lui, follow-up)**: gpui `dom.rs`/
    `extension.rs` `logseq-*` routing and `LUIAppleExtension.swift`'s
    `logseq-*` handling become dead once logseq stops emitting. Safe to
    leave until after; the host side tolerates a missing family.
13. **Docs**: update `component-migration.md`, `component-residuals.md`,
    `architecture.md`, `editor-surface-extension.md` references.

## 5. Edge cases — `logseq-*` emitters that never touch `dom ~`

Verified emitters of `logseq-<tag>` extension nodes outside the builder:

| Site | What it does |
|---|---|
| `apple/imperative_dom.ml:236–239,576` | `ident_of_tag` maps imperative `{#new}` element tags to `logseq-<tag>`/`logseq-div`/`logseq-span`; `create_extension_node` materializes them. The whole apple imperative DOM layer (`views_dom`, `properties_dom`, `editor_dom` shims) emits through here — the largest hidden consumer of the family |
| `apple/vdom.ml:275` (+`:334–428`) | `materialize_into` creates `logseq-<v_tag>` nodes for Json element shells and drives their `style-class`/`attrs`/`text`/`events` extension props directly |
| `src/extension/logseq_katex.ml:59` | dedicated `logseq-katex` extension mounts a `"logseq-span"` holder — a dedicated widget reaching back into the generic family |
| `apple/logseq_katex.ml`, `apple/logseq_emoji.ml`, `apple/pdf.ml` | widget mounts via `dom ~tag` — counted in §1 but worth listing: on apple the family is the *only* transport for these (no separate schema) |
| `apple/native_embed.ml:77` | `ext_shallow_snapshot` decodes `logseq-*` identifiers back to tags for the host snapshot — consumer, not emitter; dies at step 9 |
| `src/render/render_dom.ml` | `el` wraps `Logseq_dom.dom` with an unregistered-tag fallback (`data-tag` shim); its ~57 `D.el`/`Render_dom.el` call sites in `render*.ml`, `render_html.ml`, `render_state.ml`, `pdf_annotation.ml` (both) are `dom` emitters invisible to a `dom ~` grep |
| `gpui/drive_test.ml`, `test/test_drive.ml` | mount calls `Logseq_dom.dom [ … ]` — no `~` spelled args |
| `src/cards/cards_view.ml:5` | `open Logseq_dom` — `dom`/`nothing`/`fragment` used unqualified |
| `web_dom.ml` raw-text machinery | `ensure_raw_text_observer`/`replace_all_raw_text`/`el_set_swap_text` keep `nothing`'s `<raw-text>` placeholder working on web (`tree.ml:487`); gpui handles `raw-text` in `dom.rs:349` natively; the apple twin is a no-op stub (`editor_dom.ml:575`) |

Also audited, stays: `logseq-editor`, `logseq-codemirror`,
`logseq-em-emoji`, `logseq-katex` are dedicated extensions with their own
`let identifier`/schemas — they are not the generic tag family, but
`dom_adapter.ml` and the apple `tags` list entangle them (§3); and
`el_set_mock_value`/`__mockValue` in `web_dom.ml` serves the editor's
mock-text mirror, unrelated.

## Grep baseline @ `4d492c4622`

```
grep -rn 'dom ~' deps/ui/src deps/ui/apple --include='*.ml' | wc -l   → 126 (35 files)
grep -rn 'let dom ='     deps/ui/src deps/ui/apple | wc -l            → 21
grep -rn 'D\.dom'        deps/ui/src deps/ui/apple | wc -l            → 13
grep -rn 'Logseq_dom\.dom' deps/ui/src deps/ui/apple | wc -l          → 53
grep -rn 'open Logseq_dom' deps/ui/src deps/ui/apple | wc -l          → 1
grep -rn 'on_dom_event'  deps/ui/src deps/ui/apple | wc -l            → 35
grep -rn 'Logseq_dom\.'  deps/ui/{src,apple,js_app,gpui,test}         → 176 (excl. the two module files)
grep -rn 'Host\.dom_op'  deps/ui/apple deps/ui/src | wc -l            → 39 (9 files, 24 op names)
grep -rn '"logseq-'      deps/ui/{src,apple,js_app,gpui,test} | wc -l → 30
```

## Ready criteria

Before deleting the family machinery, all of these must hold:

- [ ] `grep -rn 'dom ~' deps/ui/src deps/ui/apple` → only
      `logseq_dom.ml` self-refs (`nothing`) and `ui_parts.ml` editor
      fragments — and those resolved too
- [ ] `grep -rn 'Render_dom\.el\|D\.el ~' deps/ui/src deps/ui/apple` → 0
      outside `render_dom.ml` itself
- [ ] `grep -rn '"logseq-' deps/ui` → only the surviving dedicated
      identifiers: `logseq-editor`, `logseq-codemirror`, `logseq-em-emoji`,
      `logseq-katex`
- [ ] `imperative_dom.ident_of_tag` and `vdom.materialize_into` emit zero
      `logseq-*` identifiers (or the apple imperative layer has been
      migrated off extension nodes entirely)
- [ ] `nothing`/`fragment`/`if_`/`keyed`/`own` relocated and compiling;
      `nothing` no longer emits `raw-text`
- [ ] emoji/katex/codemirror web adapters + `emit_*` helpers moved out of
      `dom_adapter.ml`
- [ ] web melange build, apple build, `deps/ui` tests, and gpui drive test
      all green; DOM-shape e2e parity assertions unaffected
