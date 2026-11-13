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
The UI installer pins LUI to the renderer-removal revision and installs an
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
