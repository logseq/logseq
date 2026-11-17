# Logseq UI

The application logic is OCaml. Web uses Melange and the LUI DOM backend.
`native/` contains the OCaml application library and OS-service adapters,
not a renderer. The `native_embed` shared-library build and native database
worker remain available for native hosts. Electron retains its desktop
release path, including Windows and Linux builds.

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
The UI installer pins LUI to an explicit revision and installs an
explicit non-SDL dependency set; errors are not hidden by a fallback install.
`markup` supports native HTML-to-Markdown conversion.

Native builds need a C/C++ toolchain, `pkg-config`, SQLite, libffi and GMP;
macOS also needs Xcode command-line tools. SDL, tsdl and tgls are not
dependencies.

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

## macOS desktop (SwiftUI host)

`apple/` is a SwiftPM executable host that embeds the OCaml app through
`liblogseq_ui.dylib` and renders it with `LUIAppleBackend` (SwiftUI,
`NavigationSplitView` sidebar, native titlebar). Windows and Linux keep the
Electron path; this host targets macOS only.

```sh
pnpm ui:apple:build    # dylib + db-worker + resources + swift release binary
pnpm ui:apple:run      # build then launch
pnpm ui:apple:package  # logseq-apple.app bundle (dylibbundler + ad-hoc sign)
```

The Swift and OCaml sides must pin the same LUI revision: `Package.swift`'s
`revision` must equal the pin in `scripts/install-opam-deps.sh`, and
`build.sh` refuses to build otherwise. Run disposable graphs against
`LOGSEQ_ROOT_DIR`/`LOGSEQ_UI_STATE_DIR`; see `apple/README.md` for the
packaging and diagnostics (`LOGSEQ_DUMP`, `LOGSEQ_APPLE_TRACE_PATCHES`)
details.

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

Use the LUI revision pinned by `scripts/install-opam-deps.sh` and
`apple/Package.swift`. The desktop frontend has an isolated build directory;
its bundle and package stages reject browser SQLite/WASM code or resources.
The packager omits source maps and Node dependencies, externalizes inline
bootstrap scripts for the host CSP, bundles the native worker and its dynamic
libraries with dylibbundler, then signs the complete app and creates a DMG.
App identity is `com.logseq.desktop.web`. Apple native and Electron paths remain
available; ordinary browser builds retain their existing database worker.

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
