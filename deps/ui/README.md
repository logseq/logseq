# Logseq UI

The application logic is OCaml. Web uses Melange and the LUI DOM backend.
`native/` contains the OCaml application library and OS-service adapters,
not a renderer. The native database worker and typed in-process application
entry remain available for native hosts. Electron retains its desktop
release path, including Windows and Linux builds.
`ocaml_host/` provides an additional **experimental** self-drawn OCaml desktop
host. It links the current `logseq_ui_native` application library and keeps
the existing WebView and Electron entry points. LUI's Apple/iOS and Android
SDK backends remain maintained independently.

## Setup

Use OCaml 5.5.x, Dune 3.23 or newer, and Node/pnpm from the root package
metadata. Run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --dir deps/db-worker install --ignore-workspace --frozen-lockfile
pnpm --dir deps/ui install --ignore-workspace --frozen-lockfile
(cd deps/db-worker && sh scripts/install-opam-deps.sh)
(cd deps/ui && sh scripts/install-opam-deps.sh)
```

The root Node dependencies are required even for desktop: Dune's theme
generators import `postcss`. UI and worker dependencies are not a replacement
for that root install. Select an opam switch before running the installers.
The UI installer pins LUI to an explicit revision; dependency errors are not
hidden by a fallback install.
`markup` supports native HTML-to-Markdown conversion.

Native builds need a C/C++ toolchain, `pkg-config`, SQLite, libffi and GMP;
macOS also needs Xcode command-line tools. The experimental self-drawn renderer
additionally needs SDL3, its pinned OCaml binding, tgls and the renderer dependencies
declared by the pinned LUI SDK.

## Experimental OCaml native desktop

```sh
pnpm ui:native:experimental:build
LOGSEQ_ROOT_DIR=/tmp/logseq-native-test LOGSEQ_UI_STATE_DIR=/tmp/logseq-native-ui \
  pnpm ui:native:experimental:run
pnpm ui:native:experimental:test
```

This renderer is experimental and is not selected by the normal desktop
release commands. On macOS its app title, bundle identifier and build metadata
identify the experimental backend. The builder stages the native SQLite worker,
resources and dynamic libraries and verifies an ad-hoc code signature. SQLite
WASM and zvec are excluded. See [the host guide](ocaml_host/README.md) for
local SDK builds, platform requirements and qualification limits.

## Native graph storage

`LOGSEQ_GRAPHS_DIR` selects the graph storage directory directly, overriding
`<LOGSEQ_ROOT_DIR>/graphs` (or `$HOME/logseq/graphs`). A leading `~` expands
against `HOME`, matching the existing desktop convention; relative paths are
resolved against the working directory. Listing, worker admission and asset
paths use this same absolute storage root. `LOGSEQ_ROOT_DIR` still owns the
daemon registry and logs.

Native listing returns decoded repo names and uses the worker's unchanged
canonical codec for directory paths: `logseq_db_foo/bar` uses `foo~2Fbar`,
`logseq_db_a:b` uses `a~3Ab`, and spaces remain spaces. Existing databases and
assets stay in place; no schema, file or directory migration is performed.
The canonical list does not accept legacy `++` or `+3A+` spellings or list
the reserved `backup` and `Unlinked graphs` directories.

Native services compile source links to the worker's canonical codec and
native Regexp implementation. Checkouts must preserve these symbolic links;
Windows checkout and packaging behavior still require platform validation.

## Desktop host migration

The previous macOS-only SwiftUI desktop host, its Swift package, C/dylib
embedding bridge and `ui:apple:*` commands have been removed. Replace
`pnpm ui:apple:build` and `pnpm ui:apple:run` with
`pnpm ui:native:experimental:build` and `pnpm ui:native:experimental:run`.
The native builder produces `LogseqNative.app` with its worker and resources;
there is no separate Swift package or Swift/OCaml pin pairing.
The native renderer remains experimental. WebView and Electron releases retain
their existing build commands. This removes the Logseq macOS desktop host only;
it does not retire LUI's Apple/iOS, Android or Web backends.

## Web

```sh
pnpm gulp:build
pnpm db-worker:build
pnpm ui:build
```

Run Gulp first because it replaces `static/`. Web remains Melange; desktop
packaging does not replace its backend.
See `docs/architecture.md` for module boundaries and `docs/parity-audit.md`
for the distinction between historical Web evidence and desktop acceptance.

The Web stylesheet vendored at `../../resources/css/lui.css` and icons under
`../../resources/css/icons/` must stay synced to the same LUI revision pinned in
`scripts/install-opam-deps.sh`, including
`LICENSE-APACHE-2.0` and `NOTICE`. Vendor the upstream
`platform/web/src/lui.css` source rather than its compiled `dist` stylesheet;
the root `pnpm css:build` compiles it with app styles.

## macOS WebView desktop release

The optional LUI desktop host loads the production Web frontend at
`lui://localhost`. Graph operations use explicitly registered LUI Commands to
an OCaml broker, which starts the existing native OCaml db-worker and forwards
its HTTP invokes and SSE events. SQLite runs natively; no browser database
worker, SQLite WASM binary or SQLite WASM loader is shipped.

```sh
pnpm gulp:build
opam exec -- dune build --root deps/db-worker --profile release js_api bin/main.exe
opam exec -- dune build --root deps/ui --profile release js_app
pnpm exec vite build --config deps/ui/vite.config.mjs --mode desktop
python3 deps/ui/desktop/build.py --lui-source /absolute/path/to/lui \
  --output _build/desktop-web/release
open _build/desktop-web/release/Logseq.app
```

Use the LUI revision pinned by `scripts/install-opam-deps.sh`. The desktop
frontend has an isolated build directory;
its bundle and package stages reject browser SQLite/WASM code or resources.
The packager omits source maps and Node dependencies, externalizes inline
bootstrap scripts for the host CSP, bundles the native worker and its dynamic
libraries with dylibbundler, then signs the complete app and creates a DMG.
App identity is `com.logseq.desktop.web`. The experimental OCaml native and
Electron paths remain available; ordinary browser builds retain their existing database worker.

Native desktop data defaults to
`~/Library/Application Support/com.logseq.desktop.web/native`, with graph SQLite
files under `graphs/<canonical-name>/db.sqlite`. `LOGSEQ_WEB_DESKTOP_ROOT` may
select a separate absolute root for qualification. App data is outside the
bundle. Graph directory encoding reuses the worker's canonical implementation.
The broker owns the workers it starts and stops them on normal app exit.
Command calls carry encoded Transit arguments; events carry the existing Transit
frames. The browser cannot select arbitrary daemon addresses or filesystem paths.

The registered transport commands are `logseq.graphs.list` (unit to encoded JSON
repo-name array), `logseq.graphs.open` (`{repo, create}` to unit),
`logseq.worker.invoke` (`{repo, method, argsTransit}` to the daemon JSON reply),
and `logseq.worker.events` (unit to an encoded array of Transit event strings).
Only attached graphs accept invokes. Graph open preserves existing SQLite files;
missing lifecycle metadata is initialized for existing graph directories, while
opening a missing graph fails. The LUI bridge's payload/concurrency limits apply.

The default output is an ad-hoc-signed app and DMG. Native helper binaries omit
hardened-runtime library validation for this local signature; Developer ID builds
retain hardened runtime and sign their bundled dependencies with the same
identity. Pass `--identity` and `--notary-profile` for configured distribution
signing/notarization. The sample has no update feed. Use a new output directory
for each build; `build-info.json` records both source revisions and frontend hash.

Local macOS qualification exercised the actual WebView graph-creation dialog,
native page creation/readback, normal application exit with worker cleanup, and
reopening the graph after restart with the same persisted page UUID. The fixture
rejected browser Worker construction. Package verification rejects WASM files
and SQLite browser loader code; a stale browser asset was rejected during this
check. Distribution signing/notarization still requires application credentials.

Release and desktop builds disable UI interaction samples (`__uiPerf`) and
editor/navigation timing traces. Development builds retain this instrumentation.
Web icons resolve on demand; picker rows release their view scopes outside the
viewport. These changes do not resolve all observed renderer memory growth.
Native and Node distributions no longer include a vector backend or zvec SDK.
Existing graph SQLite data and full-text search remain available; old vector
index directories are left untouched but are not opened.
