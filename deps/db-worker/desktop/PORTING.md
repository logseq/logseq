# Electron main → OCaml port guide

`desktop/` is the OCaml port of the Electron main process
(`src/electron/electron/*.cljs` + the `logseq.*` namespaces it pulls
in). It compiles via Melange to `static/electron.js`
(`dune build js_api` + `vite build --mode electron`), replacing the
shadow-cljs `:electron` target.

## Layout

- `deps/db-worker/desktop/` — flat `(wrapped false)` library
  `logseq_db_worker_desktop`, one OCaml module per cljs namespace.
- `deps/db-worker/js_api/entry_electron.ml` — `let () = Electron_main.main ()`.
- `deps/db-worker/vite.config.mjs` `electron` mode → `static/electron.js`
  (CJS; npm deps external, resolved from `static/node_modules`).

## Naming

- `electron.foo` cljs ns → `electron_foo.ml` (module `Electron_foo`).
- `logseq.*` deps that have an OCaml twin in `deps/db-worker/lib/` are
  reused — check `/tmp` is not needed: grep `deps/db-worker/lib/*.ml`
  first. Examples: `logseq.db-worker.daemon` → `Db_worker_daemon`,
  `logseq.db-worker.server-list` → `Server_list`,
  `logseq.common.graph-registry` → `Graph_registry`,
  `logseq.common.version` → `Common_version`,
  `logseq.common.config` → `Common_config`,
  `logseq.common.graph` → `Common_graph`, `logseq.common.path` →
  `Common_path`, EDN → `Edn_parser`/`Edn_eval`/`Clj_value`.
- `logseq.*` deps with no twin are ported as `<name>.ml` when the name
  is unambiguous (e.g. `cli_server.ml` for `logseq.cli.server`).
- A cljs file may become several OCaml modules
  (`electron_foo_bar.ml`) when cleaner.

## Rules

- Jane Street style: `snake_case`, no `Obj.magic`, no `[%mel.raw]`, no
  suppressed warnings, fail-fast (no defensive fallbacks for
  programmer errors), faithful port of semantics.
- JS interop only through `melange.js` / `melange.node` or `external`
  declarations with `[@@mel.*]` attributes — mirroring
  `runtime/melange/*.ml` and `cli/lib/platform/node/cli_unix.ml`.
- Electron `"electron"` module externals go in `electron_bindings.ml`;
  APPEND new externals there (never edit existing ones — other modules
  depend on them). Other npm deps' externals live inside the module
  that uses them.
- promesa `p/let` → `Js.Promise.then_` chains (see
  `cli/lib/platform/node/cli_unix.ml` `of_promise` for the
  promise→task pattern when a monadic style is needed).
- cljs `atom`/`defonce` → `ref`/`Hashtbl`. cljs keyword-keyed maps →
  OCaml records where the shape is fixed, `Js.Dict`/`Js.t` externals
  for JS-side shapes, variants for fixed keyword sets.
- IPC payloads crossing to the renderer stay as `Js.t`/abstract
  values — the renderer is still cljs; do not re-encode what the
  original passed through.
- `version/revision` (glogi build metadata) → read
  `LOGSEQ_BUILD_REVISION`/`LOGSEQ_BUILD_TIME` env or the injected
  vite `define` like `cli` does (`LOGSEQ_CLI_REVISION` style):
  use `Runtime_env`/raw defines consistent with cli's vite config.
- Every module you add MUST keep
  `cd deps/db-worker && opam exec -- dune build js_api` compiling on
  your branch. If your code calls a module owned by another porting
  group that is not merged yet, match the contract in
  `desktop/CONTRACTS.md` — do NOT create a stub for their module.
- Format with `dune build @fmt` conventions (ocamlformat profile used
  elsewhere in the repo).

## Smoke check

`cd deps/db-worker && opam exec -- dune build js_api && npx vite build --mode electron`
must emit `static/electron.js` without errors.
