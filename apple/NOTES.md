# Swift macOS app — build notes & problems hit along the way

Running log of blockers, version skews, and design decisions for the
`devin/lui-swift` work (native macOS SwiftUI app reusing the OCaml
view/model stack via the LUI Apple backend).

## Decisions

- **Reuse path**: the whole deps/ui OCaml view+model layer compiles
  natively inside the app (`deps/ui/apple/` native lib); the LUI element
  tree renders through `LUIAppleBackend` (SwiftUI). Chosen explicitly by
  Tienson over pure-SwiftUI views ("要最大可能的复用 view, model").
- **deps/ui is not JS-free**: 54 modules carry real `external` decls
  (~790 bindings), ~110 files touch `Js.*` APIs. Port strategy:
  - `js_shim.ml` — native `Js`/`Promise`/`Webapi` replacements
    (Js.Json as a concrete variant, Promise = settle-queue task).
  - `copy_files` of the ~98 truly portable modules.
  - Native twins for the JS-bound modules: real ports for
    transport/platform/state code, stubs for DOM-effect modules.
- **Worker transport**: the in-process `logseq_db_worker` libs have no
  `public_name` (can't be installed cross-project), and deps/db-worker
  AGENTS forbids dune edits — so the app talks to the daemon
  (`deps/db-worker/bin/main.exe`) over the same HTTP+SSE protocol the
  Electron renderer uses (`Daemon_client` twin).
- **Transit codec**: db-worker ships `runtime/native/transit_json.ml`, a
  cache-corrected fork of melange-transit-native. The UI twin copies it
  verbatim — upstream's version has read/write cache desync bugs and
  would corrupt frames against the fixed daemon codec.

## Problems hit

### opam switch env leakage (recurring)
- `eval $(opam env --switch=X)` sets PATH but not `OPAMSWITCH`/`OCAMLPATH`;
  `opam list`/`opam var lib` still resolve the ambient switch. The ambient
  shell also has `.opam/default/bin` on PATH, so a bare `dune` resolves
  packages from the *default* switch.
- Fix: `eval $(opam env --switch=5.5.0)` for builds;
  `OPAMSWITCH=5.5.0 opam ...` for opam commands; inspect
  `~/.opam/<sw>/lib/` directly to verify what's installed.

### Missing packages in the 5.5.0 switch
- `dune build bin/main.exe` (deps/db-worker) initially failed: the switch
  had mldoc/melange but no eio/httpun/tls/rrbvec. Installed the whole
  native dep set; `rrbvec` needed an explicit pin
  (`git+https://github.com/logseq/rrbvec.git#main`, not on the opam repo).

### datascript-ocaml / persistent-sorted-set version skew
- The installed `datascript-ocaml-native` pin was at `e439cba` (stale);
  db-worker code expects `#main` (`Datascript.Util.uuid_canonicalize`,
  array-typed `stored_node` children).
- But pset `#main` (`695223e`, "upsert modified stored nodes in place")
  added a `?address` labeled arg to `store_node` *after* datascript's
  last commit — `datascript_ocaml#main` does not compile against pset
  `#main`.
- Fix: pinned `persistent_sorted_set_ocaml` at `7393117` (the commit
  before `?address`) + `datascript_ocaml`/`datascript-ocaml-native` at
  `#main` → consistent pair, `bin/main.exe` builds clean. Upstream skew
  to flag for Tienson: datascript-ocaml needs a follow-up for pset's new
  `store_node` signature.

### Daemon lifecycle contract (discovered, not documented)
- `main.exe` requires `--root-dir` and `--repo`; binds port 0 (random).
- The actual port is published two ways: `Graph_lifecycle.publish`
  writes lease state under `<lifecycleDir>/<encoded-graph>/`, and
  `Server_list.append_entry` adds `{pid, port}` to
  `<root>/server-list` (JSON array, lock file `server-list.lock`).
- Log line on stderr: `db-worker-node-ready host=… port=…`.
- No stdout port banner — clients must poll server-list or the lease.
- `--owner-source` accepts `cli|electron|unknown`.

### deps/ui porting surface (scoping findings)
- `View.view = Chrome.shell` — the root view pulls the whole app:
  143 modules, 52 with externals. It's effectively all-or-nothing, so
  the milestone approach is "compile everything, stub DOM effects".
- `logseq_dom.ml` is fully portable — the entire UI is built on
  `logseq-<tag>` LUI extension components. But its `schema_of` registers
  them only for `{WebOS; WebHost}` — must register the macOS/SwiftUI
  profile too (small edit, upstreamable).
- Only `version.ml` and `sdk/markdown.ml` use melange-only syntax
  (`##`, `[%mel.raw`) outside the external files — everything else is
  plain OCaml once `Js` exists.
- `core/transit.ml` is "portable" (no externals) but references
  `Transit_melange` directly — needed a twin anyway (melange packages
  don't build native).
- deps/db-worker and cli AGENTS forbid dune-file edits — the native
  port must live entirely inside `deps/ui/apple/` + `apple/`.

## Open risks

- `emit_patch` swallows schema errors (blank screen, no error) —
  LUI backend needs a detailed-messages build for debugging.
- `logseq-*` extension schema fingerprint must match between the OCaml
  registry and the Swift registration literals — use
  `Lui_extension_check` to generate them.
- Style: view code emits tailwind-ish `style-class` strings — the Swift
  extension renderer must interpret them (subset for milestone).
- Editing path (textarea dom-events ↔ LUI `TextChanged`) is the
  riskiest seam — web relies on DOM event payloads
  (`Platform.event_str` on raw `Js.Json`); the native path needs the
  same field names from the Swift text views.
