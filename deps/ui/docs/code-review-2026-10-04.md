# deps/ui code-quality review — 2026-10-04

Reviewed `deps/ui/src/` (app/, blocks/, editor/, render/, sidebar/, properties/, popups/, views/, cmdk/, settings/, core/, virt/, plus sdk/, dialogs/, graphs/, extension/, pages/ incidentals), `js_app/main.ml`, `deps/ui/dune`, and `resources/css/lui-{core,overlay}.css`. Branch `devin/lui-ui-rewrite`, read-only.

Scope of review: inelegant or confusing implementations per AGENTS.md rules (fail-fast, one clear code path, no DOM-derived state, no Obj.magic/%identity) and the deps/ui architecture doc (views mount once; dynamics via `Signal.map` + reactive props / `dyn` / `if_`; max 64 lines per function).

## Verdict

The rewrite is **functionally solid but carries a heavy layer of cljs-parity scaffolding that has outstayed its welcome**. The signal model itself is used correctly in the core paths, and several patterns are worth keeping (see end). The main problems are: (a) significant state still lives in raw refs, DOM queries, and imperative timer loops that bypass the signal/patch model the architecture doc mandates; (b) a second, fully imperative DOM pipeline (`Views_dom.h`/`el_append_child` + MutationObserver mounts) runs alongside the declarative `Logseq_dom`/`Lui_elements` tree, duplicating the same UI concerns; (c) foundational helpers (DOM FFI, string utils, singleton-state idiom, button classes) are re-implemented in 6–10 places each; (d) `%identity` — banned by the module rules — appears 23 times. None of this is broken; all of it makes the next 12 months of maintenance expensive.

Severity legend: **HIGH** = real problem (correctness risk, drift hazard, or structural debt that will spread); **MED** = should be refactored; **NIT** = polish.

---

## A. State derived from DOM / refs instead of signals

**A1 — Three different "is a popup open" definitions, all DOM queries.** HIGH
`app/worker_events.ml:88-95` (`popup_open` gating the reload state machine), `editor/editor_keys.ml:1113` (outside-click handler), `popups/popups_view.ml:693-696` (`in_popups`) each hardcode a *different* CSS selector list — `"#ui__ac, .cp__cmdk__modal, .ui__popover-content, .ls-context-menu-content, #date-time-picker, .ls-editor-link-form"` vs `".cp__overlays, .cp__cmdk__modal, .ui__popover-content, .ls-context-menu-content, #date-time-picker, .ls-editor-link-form"` vs `".ui__popover-content, .ls-context-menu-content, .ls-preview-popup"`. They answer three subtly different questions with three different truths, and will silently diverge further as new popup kinds are added to one list but not the others. `Popups_state.popup_signal` / `Cmdk_state.open_signal` / `Properties_state` overlay registry already track this state — *refactor:* one `Popups_state.any_overlay_open : unit -> bool` (or a `Signal.t`) derived from the registries that already exist; delete all three selector lists.

**A2 — `Runtime` is a god-module of ~22 mutable refs.** HIGH
`app/runtime.ml` holds `current_repo`/`current_page`/`current_route`/`current_journals` (mirroring `Model` fields — a second, non-signal source of truth read by `outliner_ops.refresh_page`, `page_still_current`, `splice_journals` etc.), plus ~12 callback refs installed at boot to break module cycles (`on_graph_opened`, `rtc_graph_ready`, `remote_graph_gone`, `add_repo`, `on_navigate`, `refresh_page_side`, `refresh_journal_side`, `reload_current_view`, `refresh_after_ops`, `refresh_property_areas`, `rtc_log_handler`, `nav_load_done`, `after_page_load`, `nav_user_initiated`), plus `page_items` Hashtbl keyed signals. The callback-ref pattern is understandable given cyclic area deps, but 14 of them is inversion-of-control by escape hatch — *refactor:* consolidate into a small `Hooks` record type (`{refresh_page_side; refresh_journal_side; …}`) installed once, and expose `current_*` as reads of a real `Model.t Signal.state` so `!Runtime.current_page` can't disagree with the model.

**A3 — `Runtime.track` is a second action dispatcher.** MED
`runtime.ml:180-244` re-implements action handling in parallel with `Update.update`: `Navigate_to` does `Page_delta.reset` + `clear_page_items` + title-setting inline there. Two functions must both be read to know what an action does. *Refactor:* make `track` a pure post-update effect list keyed off `(action, old_model, new_model)`, or move the effects into `Update` returning `model * effect list`.

**A4 — `sidebar_state.ml:51` `model_ref : Model.t ref` shadows the whole model.** MED-HIGH
A `Model.t ref` updated by `Signal.subscribe` (line ~954) just so imperative code can read `left_sidebar_open`/`right_sidebar_open` width decisions (lines 116, 239, 311). It duplicates the model outside the signal graph for the DOM resizer/gesture code. *Refactor:* keep the model signal as the read source (`Signal.get` inside the gesture handlers), or make the resizer emit intent events back into an action.

**A5 — `properties_area.ml` mounts by DOM archaeology.** MED-HIGH
`mount_block_area` (508-583) uses a `data-props-mounted` attribute sentinel, a lazily-cached `resolved : (el*el*el option) ref`, `block_uuid_of_ls_block` (486-490) parsing `ls-block-<uuid>` element ids, and `ensure_indent_for`/`el_query block_el ":scope > .ls-block-content-indent"`/`".block-main-container .flex.flex-col.w-full"` to graft property areas into rows the tree view never declared. Same root cause as B3: property areas are mounted by inspecting emitted DOM instead of being part of the tree. *Refactor:* emit a stable mount point in `tree.ml`'s row structure (even empty) and drive the area content from signals; kill the id-parsing and attr sentinels.

**A6 — `editor_actions.live_buffer` reads DOM textarea `.value`.** MED
`editor_actions.ml:13-24` resolves the edit buffer via three fallbacks: CM doc → DOM textarea `.value` → `editing.buffer`. The DOM textarea is read as a source of truth on the commit path; `sync_buffer` (26-37) then *writes* `el_set_text_content` alongside the signal update on the keystroke path — DOM pokes hidden inside what looks like pure state plumbing. *Refactor:* make `editing.buffer` the single source and have the CM/textarea view subscribe to it; DOM should only ever be written, never read, for buffer state.

**A7 — `anchor_is_page_title` interprets selection by DOM selector.** MED
`editor_actions.ml:678-683` checks `D.query_selector` to decide whether a selection anchor is the page title. Same disease as A1 at finer granularity — the render tree knows whether it emitted a title; selection state should carry that fact, not be re-derived from DOM class inspection.

**A8 — `popups_view.ml` highlights menu items by mutating `data-highlighted`.** MED
Lines 711-727: `cm_hi_el` module ref holds the currently-highlighted `menuitem` DOM node and `el_set_attr e "data-highlighted" ""` paints base-ui hover state imperatively. `pv_pending`/`cm_picker_el` similarly stash DOM elements in module refs (702-708). Justifiable for transient tracking, but the highlight could be a `Signal.state` row index consumed by `attrs_signal` per item.

**A9 — `display_overrides` is a shadow title map.** MED
`editor_state.ml`: `display_overrides : (uuid,title) Hashtbl` painted over the model after commits, plus `prune_overrides` reconciliation in `outliner_ops.apply_queued`/`splice_journals` — a second source of truth for block titles kept in sync by hand. The worker tree is authoritative again on refresh (`S.clear_overrides`), so it's a display cache — but it's exactly the kind of cache that drifts (minted uuids, deltas that miss `delta_uuids`). *Refactor:* fold overrides into the same invalidation path as `render_inline`'s pull caches (single mechanism), or store committed-title overrides as a `Signal.state` map keyed by uuid that row rendering maps over.

## B. Two code paths doing the same thing

**B1 — An entire imperative render pipeline next to the declarative one.** HIGH
The `views/` subtree (9 files: `views_table`, `views_head`, `views_view`, `views_popup`, `views_query`, `views_builder`, `views_mount`, `views_virt`, `views_dom`) plus `assets/asset_dom.ml` and `extension/pdf_*` build DOM imperatively (`D.h ~cls ... |> el_append_child`) and thread a `~refresh` callback through every function instead of using signals. `views_mount.ml` then attaches instances via a **MutationObserver** scanning for `.cp__sidebar-main-content > .mx-auto`, `.page-inner`, `[data-sb-views-owner]` shells — cljs-parity scaffolding grafted onto the reactive tree. Two utterly different ways to render a list + header + menu. *Refactor:* port the views table head/body to `keyed`/`dyn` on a views-state signal and let the mount point be declared in the page tree; the observer and `~refresh` plumbing die with it. This is the single largest structural cleanup available.

**B2 — `apply` vs `apply_result` in `outliner_ops.ml` (~50 lines duplicated).** MED
Lines 818-866 and 899-925: identical `pending_save` flush, `clear_timeout`, repo match, `opts` augmentation, `invoke3 "thread-api/apply-outliner-ops"` and error handling — differing only in whether the wire response is returned. *Refactor:* `apply_result` as the one implementation; `apply = ignore (apply_result …)` (or a `~keep_response` flag). The catch handlers already diverge slightly (toast + op-name logging vs plain log) — decide which and share it.

**B3 — Delta-fold logic three times.** MED
"Drain deferred deltas, fold onto page, staleness-guard publish" appears in `worker_events.ml` `apply_pending` (114+), `outliner_ops.apply_queued` (962-995), and `outliner_ops.splice_journals` (1005-1092 — which additionally builds a uuid→journal index and retries once when an earlier delta created the uuid). Same queue, same `Page_delta.apply_to_page`, same `cur == base` identity guard, same "publish inside apply queue" comment. *Refactor:* one `fold_deltas ~targets` in `page_delta.ml` returning merged pages + touched uuids; journals become a multi-target specialization.

**B4 — Three near-identical editor-commit paths.** MED
`exit_edit ~select` (256-278), `blur_commit` (281-291), `flush_edit` (295-306) each grab `live_buffer`, commit, update editing state, clear overrides — differing in focus/selection aftermath. Similarly `split_at_cursor` (360-429) vs `insert_sibling_after` (433-476) share ~80% of an optimistic-insert + `display_overrides` + `S.set` + `with_focus_after` sequence, and `merge_prev`/`merge_next` (507-565/580-652) are a mirror pair. *Refactor:* extract `commit_buffer ~then_` and a shared `insert_block_after` spine; keep the differing tails.

**B5 — `Signal.set` + manual `Runtime.flush()` vs `Runtime.signal_set`.** MED
`Runtime.signal_set` = `Signal.set` + `flush`. But raw `Signal.set` inside promise callbacks appears in ~a dozen view files; some remember `Runtime.flush()` (`plugins_view.ml:402-404`), some don't (`blocks/tree.ml:826` — the embed-blocks fetch publishes `Signal.set st blocks` inside a `let*` chain with no flush, so the embed may not paint until the next unrelated event). Even if a flush happens to land later, this is a correctness coin-toss per call site. *Refactor:* lint rule / grep guard: `Signal.set` may only appear inside `Lui_elements` mount code or `Runtime`; every async callback must use `Runtime.signal_set`. Add a comment-level convention at minimum.

**B6 — `editor_cmds.ml` vs `editor_commands.ml`.** MED
Two files differing by four characters both consume `ls:editor-command` (`editor_commands.ml:814` is the listener; it calls `Editor_cmds.run` for block-scoped commands) — and `assets/asset_dom.ml:743` registers a *third* independent listener on the same event. Command dispatch is split across the name collision plus a stray consumer. *Refactor:* rename `editor_cmds.ml` → `editor_command_table.ml` (it is a dispatch table, not a consumer), and route asset-dom's handler through the same dispatcher.

**B7 — `Update.update` is "pure" but writes localStorage.** MED
`update.ml:98` — `Toggle_left_sidebar` calls `Platform.local_storage_set` inside the `let update (model) (action) : t` reducer, contradicting the "pure reducer" contract and the `Page_loaded` generation dance at 25-33 (`{p with page_blocks=[]} = {page with page_blocks=[]}` structural compare to decide a `data_gen` bump — fragile manual versioning; a dedicated rev field would be clearer).

## C. Convoluted control flow / machinery

**C1 — `worker_events.ml` is a hidden timer state machine.** HIGH
8 module refs + recursive `schedule_reload`/`fire_reload`/`apply_pending` `setTimeout` loop driven by four magic constants (`edit_input_idle_ms=750`, `reload_debounce_ms=400`, `reload_max_wait_ms=2000`, `edit_reload_min_ms=8000`, lines 48-56) whose interactions (idle vs debounce vs max-wait vs edit-suppression) live entirely in the reader's head, plus the DOM popup query (A1). Failures that require all four timers to interplay correctly are the hardest class to debug. *Refactor:* name the states (`Idle | Debouncing of since_ms | EditSuppressed of last_edit_ms`) and make the transition table explicit; move popup detection to signals (A1).

**C2 — Focus acquisition is a 40ms×50 polling loop with three queues.** MED-HIGH
`editor_actions.ml:41-159`: `focus_attempts` counter, `pending_focus`, `pending_focus_actions`, `drain`/`run_pending_focus_actions`, a `mod 10 = 5` scroll-into-view trigger. This is "retry focus until the DOM catches up" — necessary evil in retained DOM, but three interlocking queues plus a magic 50×40ms window is fragile. *Refactor:* one `pending_focus : request option ref` + one retry timer; document the invariant; drop `focus_attempts`'s modulo behavior for a named every-N policy.

**C3 — `render_inline` has a three-layer cache+generation invalidation apparatus.** MED-HIGH
Lines 62-158+: `pull_caches` (per-repo pair of Hashtbls), `invalidation_gen`/`reset_gen`/`invalidated_gens` per-uuid generation map folded into dyn keys to force remounts of rows mentioning touched entities, plus `minted_meta` shadow cache for just-committed titles, plus `prime_ref_metas`/`prime_pull_meta`/`prime_pull_caches` — three priming paths into the same two tables. It works, and the comments are honest about being keyed-mount workarounds, but it's the codebase's deepest "state lives in the walls" example: resolved titles should arguably be a `(uuid, meta) Signal.state map` that row rendering subscribes to via `text_signal`, making invalidation = `signal_set` rather than generations+key packing.

**C4 — `cmdk_state.ml` de-normalizes state per publish and packs a 10-field remount key.** MED
`latest_vs`/`latest_st` dual singleton refs (82-92); `decorate` (108-124) copies `ihl`/`imouse`/`iq` into every item on every publish (admitted workaround); `item_dom_key` (133-144) stringifies ~10 fields to force keyed remount; `apply_results` (591-593) accepts `move_mode`/`expanded` params it ignores; `group_order` (~476-540) is boolean-flag ordering soup; `invoke_counts`/`record_invoke` (166-213) inline localStorage JSON with `try _ -> ()` swallow and 6-level nesting; a `String.index q '/'` substring hack (~528). *Refactor:* keep item state out of items (carry it in the view record read at render), let the key be `(kind, uuid)` not a stringified blob, delete the ignored params.

**C5 — `splice_journals` index-rebuild-retry.** MED
`outliner_ops.ml:1005-1092` builds a uuid→journal-index Hashtbl over every block of every journal page per delta batch, then rebuilds+retries once for newly-created uuids. Correct but expensive and subtle (O(journal trees) per refresh under RTC). Worth a comment-level invariant or a cheaper owner-prediction scheme; flag as a perf-sensitive hotspot.

**C6 — `page_title_el` is 266 lines; ~85 functions exceed the stated 64-line cap.** MED
`pages/page.ml:267-531`. Others: `decode.ml block_of_wire` 167, `cmdk_state.run_command` 166, `router.ml load_block_zoom` 144, `views_table.table_el` 129, `views_popup.menu_items_el`/`show_select` 134/139, `editor_keys.on_editor_key` 134, `html_to_md.node_to_md` 132, `i18n.en_overrides` 426 (data table — excusable but see D6), `virt_list.attach` 209, `properties_area.mount_sidebar_area` 101. The 64-line rule is nominal, not enforced — either enforce it or delete it from architecture.md.

## D. Duplicated foundations

**D1 — Six parallel DOM-FFI helper modules.** HIGH
`core/platform.ml` (53 externs), `graphs/browser_ui.ml` (40), `popups/dom_ext.ml` (73), `editor/editor_dom.ml` (80+), `properties/properties_dom.ml` (28), `views/views_dom.ml` (54) each re-extern the same DOM surface under different names: `closest_sel`/`closest`/`el_closest`, `get_attr`/`get_attribute`/`el_get_attr`, `qs`/`doc_query`/`query_selector`/`el_query`, plus per-file copies of `set_timeout`, `clear_timeout`, `bounding_rect`, `el_value`/`el_set_value`, `el_focus`, clipboard wrappers. Each new area grew its own DOM shim. *Refactor:* one `Js_dom` module (element/event/query/timer wrappers); area modules keep only genuinely area-specific helpers (e.g. `editor_dom`'s textarea ops).

**D2 — Hand-rolled string helpers in ≥8 files.** MED
`starts_with`/`contains_sub`/`index_of`/`ends_with`/`take`/`contains_ci`/`ltrim` appear in `editor_actions.ml` (1086-1191: ltrim, starts_with, contains_sub, is_url, is_video_url), `render.ml` (starts_ci), `cmdk_state.ml`, `sdk_util.ml`, `popups_state.ml`, `sidebar_state.ml`, `views_dom.ml`, `page.ml` — while `i18n.ml:31-50` already exports `contains`/`contains_ci`/`index_ci` used elsewhere. *Refactor:* a `Str_util` module; one `substring search` implementation.

**D3 — The `st option ref` + `ensure`/`ready`/`state()`/`failwith "not mounted"` singleton idiom in ≥8 modules.** MED
`editor_state.st` (+`defer_init`/`on_init` staging), `popups_state.active`, `cmdk_state.latest_vs`/`latest_st`, `sidebar_state.st_ref`+`model_ref`, `pdf_state`, `properties_state`, `settings_state`, `toast` — each hand-rolled with slightly different failure behavior (failwith vs Option.get vs silent). *Refactor:* one `Module_state` helper/functor (`create`, `get`, `get_exn`, `on_init`, `ready`) to fix the semantics once.

**D4 — `ghost_btn_cls` / shui class-soup copied verbatim ×3+.** NIT-MED
Identical `as-ghost`/`ring-offset-background` Tailwind bundles in `shell/chrome.ml`, `extension/pdf_toolbar.ml:586-596`, `properties_area.ml:616-624`, and ~7 more files inline variations. *Refactor:* `Ui_parts.ghost_btn_cls` (or extend `menu_item.ml`) — it exists as a helper in chrome.ml already, just not shared.

**D5 — `en_overrides` is a 426-line shadow dictionary.** MED
`i18n.ml:168`+ — English text hardcoded to deliberately differ from en.edn "for e2e/DOM-parity". It works, but it's a second source of truth for English strings that must be hand-diffed against en.edn forever; worse, it papers over which strings are real i18n keys vs literal text the cljs components hardcoded. *Refactor:* annotate each entry with which cljs component it mirrors and an issue/TODO to converge (either fix en.edn or mark the call site literal-text), so the table shrinks over time instead of calcifying.

**D6 — Embedded `{|…|}` JSON blobs with per-file hand-decoders.** NIT
`settings/keymap_data.ml`, `cmdk/commands_data.ml`, `icon/icon_picker_names.ml` — each embeds a JSON literal (reasonable, documented cons-skeleton rationale) but each also ships its own positional-array decoder with `failwith "bad json"`. Share a tiny positional decode helper; keep the blobs.

## E. Silent recovery / fallbacks masking invalid state (AGENTS.md violations)

**E1 — `logseq_dom.ml:63-69` `tag_of_identifier` → `"div"`; `string_of_wire` → `""`.** MED
Unknown `logseq-*` identifiers silently render as `<div>` — a programmer error (unregistered tag) becomes invisible DOM drift. `string_of_wire` returning `""` on non-string likewise. *Refactor:* `failwith`/console-error + drop the element — fail-fast.

**E2 — `sidebar_state.ml:536-539` navigates on `.catch`.** MED
`navigate_to_page`'s rejection path navigates anyway — an error in the lookup becomes a silent wrong-page nav. Same family: ~30 `with _ ->`/`try _ -> ()` swallows (`sidebar_state:346/376/399`, `worker_client:90`, `daemon_client:154`, `cmdk_state:191/209/758/791`, `plugin_host:47`, `sdk_config:17`, `router:7`, `editor_cmds` int_of_string fallbacks, `popups_state` EDN parse fallbacks). LocalStorage EDN codecs (`sidebar_state.ml:338-406`) decode `try _ ->` → empty — corrupted state reads as "empty sidebar", indistinguishable from a fresh user. *Refactor:* log-and-rethrow on decode of *written-by-us* state; keep silent-default only where cljs parity genuinely requires it (document which).

**E3 — `editor_cmds.ml` stub commands log `console_error "not implemented"`.** NIT
`cycle-todo`/`deadline`/`scheduled`/`date-picker`/`add-comment`/`copy-export-as`/`set-icon`/`add-reaction` hit a fallthrough error path — fine while ports are in flight, but ensure these are tracked against parity-audit.md and not permanent stubs.

## F. Ad-hoc encoding / unsafe casts

**F1 — 23 `%identity` externs despite the "no Obj.magic/%identity" rule.** HIGH
`plugin_host.ml:19-20` (`as_promise : Js.Json.t -> Js.Json.t Js.Promise.t`, `as_any : 'a -> Js.Json.t`), `daemon_client.ml:14-15,21`, `sdk_convert.ml:6-7`, `sdk_util.ml:7`, `browser_ui.ml:104,109-112`, `export_page.ml:32`, `views_virt.ml:14`, `asset_dom.ml:23-25`, `asset_store.ml:45`, `editor_dom.ml:18-20`, `code_mirror.ml:26,138-139`. The opaque `el <-> Js.Json.t` pairs are the standard melange bridge idiom (defensible, typed both ways); the `as_any : 'a -> _` and `as_promise` casts are genuine Obj.magic holes. Either the rule is dead (update architecture.md) or these should route through typed wrappers (`Js.Promise` extern, `Js.Json.classify` dispatch). Pick one; today the code contradicts the doc.

**F2 — `attrs_json` JSON escaping is incomplete.** MED
`logseq_dom.ml:71-88` `esc` handles `"`, `\`, `\n`, `\t` only — attribute values containing `\r`, backspace, or other control chars produce invalid JSON that fails at the adapter layer far from the call site. *Refactor:* use `Js.Json.stringify`/`Edn`-style escaping, or a shared `json_string_escape`.

**F3 — Ad-hoc key encodings.** MED
`editor_state.ml:145` `collapse_key scope uuid = scope ^ "\x00" ^ uuid` (NUL-delimited pair key — works, invisible in logs, breaks if a scope ever contains NUL); `cmdk_state.ml:133-144` 10-field string pack as remount key; `popups_state.ml:215` `auuid = ""` sentinel for "no autocomplete"; `data-props-mounted`/`data-views-inst`/`data-cm-item` attr sentinels; `ls-block-<uuid>` id parsing. Each is locally reasonable; collectively they're a private serialisation dialect. *Refactor:* `option` types for sentinels; tuple/record keys (or `Hashtbl` on a pair type) instead of string packing; document attr sentinels in one place.

## G. Dead / vestigial code

- `editor_actions.ml:348` `outdent_empty_last_child uuid e b` — `let _ = (e, b) in` dead parameters. NIT
- `editor_actions.ml:1927` — `let _ = () in` dead binding. NIT
- `cmdk_state.ml:591-593` `apply_results` ignores `move_mode`/`expanded` params. MED (misleading signature)
- `chrome.ml:271-273` — `attrs_signal_v` returning constant `[("data-is-margin-less-pages","false")]` (reactive channel used to ship a constant); `:288-298` `("class","mx-auto pb-24")` delivered via the attrs channel instead of `style_class`. NIT
- `chrome.ml:82-119` `rtc_indicator` — `dyn` remounts the whole indicator subtree on every rtc tick where a `text_signal`/`class_signal` pair would do. NIT
- `sidebar_state.ml:490-496` — comment admits `#/page/<uuid>` lookup-ref form "does not match `Ldb.get_page` — TODO(shared): fix": broken-by-design route case shipped. MED
- `installed`/`install_once` guard refs in `editor_keys.ml`, `editor_commands.ml`, several views — pattern repeated ~8 times (fold into D3's helper). NIT
- `editor/editor_keys.ml:168` `follow_link` reads `!Sidebar_state.st_ref` — cross-module singleton reach-around. MED
- `popups_state.ml` record `t` mixes the `vs` signal with `gen`/`titles`/`tag_titles`/`tag_exact_titles`/`templates` raw refs (148-158) — half signal-driven, half imperative caches; refresh paths invalidate by hand. MED
- `dom_ext.ml:175` — comment notes `Platform.dispatch` bug ("reads the method off `undefined`"), i.e. a known-broken primitive is being routed around instead of fixed. MED
- `keymap_data.ml`/`commands_data.ml` hardcode the macOS binding set — documented, but the "non-mac branches dropped" comment means the port silently misbinds on Linux/Windows-native. MED if native targets are in scope, else NIT.

## H. CSS structural smells (`lui-core.css`, `lui-overlay.css`)

- `lui-core.css` defines a `--ls-z-index-level-{0..5}` scale (0,9,99,999,9999,99999) that `lui-overlay.css` ignores — overlay uses literal `z-index: 50/901/999/99999/100000` and `calc(1000 - var(--toast-index))`, plus ML-side inline `style="position:fixed;…z-index:999"` strings in `popups_view.ml`/`cmdk_view.ml`. Three layering systems coexist. MED
- 14 `!important` in `lui-core.css` (e.g. the html font-family override) — expected for a port overriding legacy sheets, but each should carry a comment naming what it fights. NIT
- Inline `style=` strings in ML (`popups_view.ml` positioning, `views_table.ml` `z-index:9`) duplicate CSS layering in OCaml — move to classes. NIT

## Good patterns worth keeping

- **`Logseq_dom.own` (extension/logseq_dom.ml:117-121)** — derived signals handed to `dom`/`dyn`/`if_`/`keyed` get scoped to the node's lifetime only when they have upstream subscriptions; shared state signals are left alone. Documents and enforces the subscription-leak rule in one place.
- **The `_state.ml` convention** — `Signal.state` + `set`/`update` helpers per area is consistent enough to grep; violations (refs, DOM reads) stand out because the convention is otherwise uniform.
- **`Page_delta`** — share-preserving `map_share` rebuild, `with_apply_queue` serialization, `delta_uuids` touched-tracking: surgical patching with identity-stable subtrees. The *replication* of its callers (B3) is the problem, not the module.
- **`decode.ml` boundary discipline** — wire → `Model` normalization in one module; `block_of_wire`'s size is a table-of-fields problem, not a logic problem.
- **Single i18n surface** (`i18n.ml` merged Strings/Views_i18n/Properties_i18n/Ui_strings/Graphs_text) with lazy locale dicts and an English-path fallback order — the en_overrides table (D5) is the wart, not the design.
- **Embedded `{|…|}` JSON for big static tables** — keymap/command data as one literal decoded once, with the cons-skeleton rationale documented. Keep; just share the decoders (D6).
- **`virt_list.ml` publish path** — `Signal.set` + `Runtime.flush()` done correctly inside the scroll loop, with a documented drag-extension edge case. The model for how async publishes should look (contrast B5).
- **Comment quality** — most non-obvious behavior carries a "cljs X does Y because Z" pointer; keep this standard, it's what's keeping the parity scaffolding navigable.

## Suggested order of attack

1. B1 (views imperative pipeline + MutationObserver mounts) — biggest structural win; A5/A7 mostly die with it.
2. A1 + B5 (popup detection → signals; `signal_set` discipline) — small, kills real staleness bugs.
3. D1 (one DOM FFI module) — mechanical, unlocks D2/D3/D4.
4. F1 (%identity policy) — decide the rule, then enforce.
5. A2/A3 (runtime god-module, second dispatcher) — bigger refactor, do after the above so the hooks have somewhere clean to live.
6. E-audit of `try _ ->` swallows and `en_overrides` convergence.
