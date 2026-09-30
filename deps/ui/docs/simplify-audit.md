# deps/ui simplification audit

Branch `devin/lui-simplify`. Scope: `deps/ui/src` (LUI/OCaml/Melange UI).
Guards: DOM structure and e2e selectors unchanged; cljs semantic parity kept.

Rubric used: less duplication; concise readable view code; reactive props
(`~p:(reactive f s)` via `lui.ppx`) over `dyn` whole-subtree remounts;
handlers as pure `input -> action` where possible; `let*` over `.then`;
functions ≤ ~64 lines; no dead code.

## Landed (this change)

| Item | Where | What changed |
|------|-------|--------------|
| Wire-typed prop signals → typed + `reactive` | `extension/logseq_dom.ml`, `render/render_dom.ml`, ~30 call sites in 11 files | `dom`/`el` signal args (`style_class_signal`, `attrs_signal`, `text_signal`, `id_signal`) are now typed (`string`, `(string*string) list`); the `StringValue`/`attrs_json` wrap happens once inside `dom`. Callers write `~p:(reactive f s)` — `lui.ppx` (enabled in `src/dune`) rewrites it to `~p_signal:(Signal.map f s)`. Both the caller's signal and the wrapper map are `own`ed to the node scope. |
| `dyn` → reactive props / `if_` | `sidebar/left_sidebar_view.ml` (graphs selector), `graphs/new_graph.ml` (2 checkboxes), `dialogs/ui_requests.ml` (warn text) | `dyn` remounting a subtree to flip a class/attr/text became `~style_class:(reactive …)`/`~attrs:(reactive …)`/`~text:(reactive …)`; `dyn` returning `dom`/`nothing` became `if_ ~test`. |
| `payload_*` takes `string option` | `core/platform.ml` + ~40 call sites in 16 files | `payload_str/bool/num` now accept the dom-event payload option directly (`None` reads as `{}`), deleting the repeated `Option.value p ~default:"{}"`, `match payload with Some p -> … | None -> <same default>`, and `Option.fold` boilerplate. Sites whose `None` branch had real behavior kept their match with `Some _`. |
| Dead code (50 defs) | `core/i18n.ml` (34 unused helpers), `core/sprintf.ml` (`eprintf`/`ifprintf`/`ibprintf`), `core/wire.ml` (`nth_arg`), `core/menu_item.ml` (`cm_cls`, `text_el`), `render/render.ml` (`heading_tag`), `sidebar/sidebar_state.ml` (`open_dots_menu`), `properties/*` (`remove_overlay`, `guard_editing_focus`, `forward_container_click`, `mount_page_properties`, `mount_block_properties`, `open_property_dialog`, `entity_by_title`, `convert_page_to_tag`), `extension/logseq_dom.ml` (`tag_of_identifier`), `render/render_dom.ml` (`text_of_class_signal`), `core/platform.ml` (`event_bool`), `export/publish_view.ml`+`popups/popups_view.ml` (local `sv`/`attrs_v` wire helpers, obsoleted by typed signals) | All verified single-occurrence (definition only) via tree-wide grep. |
| Shared editor shell | `blocks/comments.ml` | `title_editor_el` now uses `Ui_parts.editor_wrapper`/`editor_inner` instead of open-coded `editor-wrapper`/`editor-inner` markup. |
| `mock-text` style dedup | `properties/properties_value.ml` | Uses `Ui_parts.mock_text_style` (same as `properties_menu.ml`). |
| `in_managed` walk | `properties/properties_view.ml` | Hand-rolled parent walk replaced by `el_closest` (text nodes start at parent — `closest` is element-only). |
| `show_select` toggle dedup | `views/views_popup.ml` | Identical multi-select toggle block in the click and Enter handlers extracted to `choose`; Enter branch simplified to `List.nth_opt (filtered ()) !chosen_idx`. |

## Deferred (recommendations, risky or structural)

| Priority | File:Function | Why complex | Simplification | Risk |
|----------|---------------|-------------|----------------|------|
| 1 | `pages/page.ml` `page_title_el` (~250 lines) | Page title row + breadcrumbs + icon picker + menus in one function; mixes DOM shape, state, and event wiring | Split into `breadcrumbs_el` / `icon_picker_el` / `title_menu_el` sub-builders; hoist pure attr/class computation out of the JSX-ish tree | Medium — large diff, easy to drop a handler or key |
| 2 | 6 parallel DOM-FFI modules (`dom_ext.ml`, `editor_dom.ml`, `views_dom.ml`, `properties_dom.ml`, `asset_dom.ml`, `browser_ui.ml`, ~290 externals) | The same JS API (`el_parent`, `closest`, `querySelector`, `rect`, `matches`, `ev_target`…) is declared 3–4× with different names (`el_closest` vs `el_find_ancestor`, `payload_string` option vs `Platform.payload_str` defaulting) | Merge into one `Dom` module with one name per API; `payload_string`/`Platform.payload_str` need a semantics check (option-returning vs defaulting) | Medium-high — mechanical but touches every file; must keep externals byte-identical |
| 3 | `editor/editor_keys.ml` `on_click` (125 lines, ~9-level nested match) | Click dispatch ladder: targetClass checks, edit-commit, ref-resolution, popup handling in one deeply nested match | Table of `(guard, action)` tried in order, or split handlers by target kind; state reads already flow through `Editor_state` | Medium — ordering is load-bearing (first-match-wins) |
| 4 | `properties/properties_dialog.ml` — `property_chosen`/`pick_value`/`value_ids`/`render` (~500-line `and` chain) | The whole dialog is one mutually-recursive blob: query state, pick lists, enum/special value handling, worker calls | Split state (`*_state.ml`) from view; per-picker-type builders | High — worker round-trips and imperative focus management interleave |
| 5 | `render/render_inline.ml` `parse`/`try_match`/`try_bracket`/`page_ref`/`resolved_ref` chain (~430-line `and` chain) | Inline-markup parser + renderer fused; pull-cache lookup inside renderer | Split the parser (pure) from the element builders; memoization already exists (`pull_caches`) | Medium — parser is subtle; keep per-site keys stable |
| 6 | Stringly-typed DOM queries | `.editor-wrapper textarea`, `.jtrigger`, `#edit-block-<uuid>`, `.ls-properties-area` selectors literal in `dom_ext`/`editor`/`properties`/`views` | Centralize selector constants next to the markup that emits them (or export them from `Ui_parts`) | Low code risk, but cross-module — defer with FFI merge |
| 7 | `comments.ml` `add_comment` never wired | `editor_cmds "add-comment"` logs `console_error "not implemented"` while `Comments.add_comment` exists unused | Wire the command to the implementation (or delete the feature) — likely a missing hookup, not dead code | Product decision, not a code change |
| 8 | Remaining `dyn` sites | Most `dyn`s left are legitimate structural branches (popups body, item renders) — the easy attr/text ones were converted above | Re-audit after the FFI merge; prefer `if_` for presence/absence and reactive props for value changes | Low |

## Conventions now in AGENTS.md

- `deps/ui` uses `lui.ppx`: write `~p:(reactive f s)` (or `~p:(reactive f s1 s2)` for `Signal.map2`), not `~p_signal:(Signal.map …)`.
- Prefer reactive props over `dyn` subtree remounts; `dyn` only for structural branches.
- Derive view state with `Signal.map` on `*_state` signals rather than hand-rolled pub/sub.

## Verification

- `cd deps/ui && eval $(opam env --switch=5.5.0) && dune build js_app test` — green.
- `node deps/ui/_build/default/test/ui_test/test/test_main.js` — 1238 checks, 0 failures.
- clj-e2e `editor-basic-test` + `commands-basic-test` — see commit message.
