# deps/ui — LUI/OCaml web UI architecture

Logseq web UI rewritten in pure OCaml (Melange) on the LUI web backend.
No cljs, no React, no shadow-cljs in the UI layer. The DOM contract the
`clj-e2e` suite depends on is `docs/e2e-contract.md` — read it first.

## Build & run

```sh
# one-time (blueprint VMs already have opam/pnpm/clojure):
eval $(opam env)            # any 5.5.x switch with the pins below
sh deps/ui/scripts/install-opam-deps.sh
pnpm install              # repo root, if not already done

# build the app bundle -> static/js/main.js
cd deps/ui && dune build js_app && ../../node_modules/.bin/vite build

# build the worker -> static/js/db-worker.js
cd deps/db-worker && dune build js_api && ../../node_modules/.bin/vite build --mode browser

# serve + run e2e (Clojure/Playwright):
cd clj-e2e && bb serve    # serves ../static on :3002
bb test -n <ns>           # e.g. bb test -n outliner-basic-test
```

Rebuild after any OCaml change. `pnpm gulp build` WIPES `static/js/*.js`
— re-run both vite builds after any gulp run. `static/index.html` must be
copied from `resources/index.html` when it changes.

## Module rules (shared with all parallel sessions)

- One directory per feature area under `src/`; file names are module names
  — the library is `(wrapped false)` + `include_subdirs unqualified`, so
  **every module name must be globally unique** across dirs. Prefix area
  files (`Editor_state`, `Cmdk_view`, ...).
- **Max 64 lines per function.** Split with named helpers.
- No `Obj.magic`/`%identity`, no disabled warnings, no dune edits.
- Repo rules (`AGENTS.md`): fail-fast, no compat layers, mandatory i18n for
  user-facing text (use `I18n.t`-style helpers — see `src/app/`), no
  `js/Buffer`, no `List.append` hot loops (use `Rrbvec` or accumulators).

## Reactivity model (IMPORTANT — differs from React)

- `View.view` runs ONCE. Dynamic UI = signal-driven props
  (`style_class_signal`, `text_signal`, `attrs_signal_v`, `id_signal` on
  `Logseq_el.el`) or `dyn ~equal f signal` / `if_ ~test` subtrees.
- After mutating state outside an event handler (async `then_`, timers):
  `Runtime.signal_set signal v` (sets + flushes). Inside `on_dom_event`
  handlers a flush happens automatically after the handler.
- `dyn` needs a real parent node — the root of a subtree can't be `dyn`;
  wrap in a `box`/`Logseq_el.el` container.

## State ownership

- `Model.t` (src/app/) = app-global state only: phase, repo, route,
  route_page, repos, theme, sidebar open flags. App-level actions go
  through `Action.t` + `Runtime.send`.
- **Area-local state** lives in `<area>/<area>_state.ml` as
  `val signal : t Signal.signal` + `val set`/`val update` helpers built on
  `Runtime.signal_set`. Own it entirely — do not add fields to `Model.t`.

## Shared visual ownership

Component appearance has exactly one definition in the shared layer:
`Ui_theme` resolves the active design-token snapshot (canvas/panel/
foreground/accent/selected/border/ring + typography, spacing, radius,
density) and `Ui_components` recipes (result row, section header,
badge, dialog, menu item, …) emit typed props through LUI. Platform
adapters only translate those props — they own no second copy of the
design.

- GPUI consumes ONLY natively-expressible typed props — no CSS parsing,
  no `var()`/`calc()` resolution. Decoration that cannot be expressed
  natively stays adapter-side as `gpui/host/src/logseq_ext.rs`
  hook-class registrations.
- Web keeps adapter-side leftovers in `resources/css/lui-overlay.css`
  behind the same semantic hook classes (`ui__*`, `cp__*`, `ls-*`):
  keyframe animations, `::selection`/`::first-letter`, `transform`,
  media-query breakpoints, `dvh` units, `var()` fallback chains,
  `calc()` micro-layout, descendant-hover rules, `backdrop-filter`,
  `-webkit-line-clamp`, `grid-template-columns`.
- `~style_class` is not a styling channel — it carries app-semantic
  hook classes for e2e tests, imperative DOM queries, and adapter-side
  decoration only.

## DOM building — the `logseq-*` extension family

`Logseq_el.el` is the escape hatch (raw elements with attrs + DOM events):

```ocaml
open Lui_elements
Logseq_el.el ~key:"x" ~tag:"button" ~id:"search-button"
  ~style_class:"cp__header-btn"             (* static class *)
  ~style_class_signal:(Logseq_el.class_signal ms (fun m -> "..."))
  ~attrs:[ ("data-testid", "page title"); ("role", "menuitem") ]
  ~attrs_signal_v:(Logseq_el.attrs_signal ms (fun m -> [ ("aria-checked", ...) ]))
  ~text:"..."  ~text_signal:(...)
  ~events:"click keydown input"             (* space-separated DOM events *)
  ~on_dom_event:(fun name payload -> ... )  (* payload: JSON string *)
  [ children ]
```

Event payload JSON fields: `key code data inputType shiftKey ctrlKey
metaKey altKey repeat isComposing button clientX clientY value checked
targetId targetClass`. On `input`/`change` events `value`/`checked` carry
the target's current values — read them with `Platform.json_*` helpers.

Standard LUI elements (`box`, `text`, `dyn`, `if_`) are fine inside
`Logseq_el.el` children — extension elements nest freely.

## Worker calls

`Runtime.invoke* "thread-api/<endpoint>" (Wire.x args...)` returns
`Wire.t Js.Promise.t`. Decode with `Decode.*` / `Wire.*` helpers. Full
endpoint list: `grep 'Dispatcher.register' deps/db-worker/lib/`.
Transit wire gotchas: `["^ "]` maps → null arg; op args are
`["~:op-name", [args]]`; lookup-ref = `Wire.Array [Keyword "block/uuid"; Uuid u]`.
Endorsement: reuse existing `Graph.ml`/`Boot.ml` patterns.

## Mount points already wired (chrome.ml / page.ml)

- `Page.page_view_of_model` — main content area (owns page render).
- `Left_sidebar_view.render` — inside `#left-container`.
- `Right_sidebar_view.render` — inside `.cp__right-sidebar`.
- `.cp__overlays` — `Cmdk_view`, `Popups_view`, `Dialogs_view`,
  `Toasts_view` render stubs (overlays/popups/portals go there).
- `Tree.block_row` — per-block row skeleton (`.ls-block` + `blockid` +
  `data-block-title` + `#ls-block-<uuid>`). Rich content render goes via
  `Render.*` (src/render/).

## Testing contract

clj-e2e fixtures assume: `document.documentElement.lang='en'`,
`dataset.theme`, `dataset.color`, `localStorage preferred-language /
developer-mode`, `[data-testid='page title']` visible when app is ready,
`.editor-wrapper textarea` editor, `#search-button` + `.cp__cmdk` palette,
`.ui__toast` notifications, `a.menu-link.chosen` popups, hash routes
`#/page/<uuid>`/`#/block/<uuid>`, console `:db-worker/outliner-op-perf`
lines untouched. Full inventory: `docs/e2e-contract.md`.

## Shared runtimes (post-migration, 2026-10)

`deps/ui` builds three runtimes from shared business/view sources:

| Layer | Path | Runs on | Owns |
| --- | --- | --- | --- |
| contracts | `src/contracts/` | all | `Ui_services` (storage/theme/nav/doc/time/log/perf/uri/clipboard/session/env/dom), `Ui_task`, `Wire`, `Json`, `State_cell`, `Cmdk_services` — installable op records, no host types; properties use `Ui_services` |
| shared | `src/shared/` | all | portable single-owner modules (helpers, settings/sidebar/cmdk/properties/views/edit-flow state+views, json_payload) — no `Js.*`/`Platform`/`Webapi` refs |
| subs | `subs/` | all | subscription/model layer on `Ui_task`; Js.Promise↔Ui_task bridge (`task_of_promise`) stays at transport edge while worker/sdk emit Js.Promise |
| web src | `src/` | Melange | web-only view/app code still migrating feature-by-feature; real browser boundary `src/core/web_dom.ml` |
| web adapter | `web/` | Melange | `platform_web.ml` installs `Ui_services` ops via real browser APIs |
| native adapter | `native/` | native | host services (`services/platform_native.ml`), lui/native widgets, C bridge, `native_embed` entry |
| gpui | `gpui/` | Rust+OCaml | GPUI host; links same shared/native libraries |

Boundary gate: `scripts/check-shared-boundaries.sh` (wired into `dune runtest test/contracts` on Unix) rejects `Js.*`/`Webapi`/`Web_dom`/`Unix`/`Thread`/`Yojson`/`Platform.*` in `src/shared`+`src/contracts`+`subs`. Tracked exceptions (must shrink to zero): `subs/promise_ext.ml` (Js.Promise `let*` still opened by src files), `subs_state` promise↔task adapters.

Retained platform code is by ownership, not name: `native/js.ml`/`webapi.ml`/`fetch.ml`/`sdk_*`/`daemon_client.ml`/`worker_client.ml`/`pdf*` are real host adapters (mailbox, SDK bridge, worker client, pdf FFI). The DOM-simulation cluster (`native/web_dom`/`vdom`/`imperative_dom`/`editor_dom`/`properties_dom`/`views_dom`) is *legacy emulation* retained only because ~71 `src/` files still call it through the source-copy build — its deletion is tracked in the shared-UI plan (batch 6c).
