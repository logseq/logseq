# Logseq UI

The application logic is OCaml. Desktop uses the NSH host in `nsh/`;
Web uses Melange and the LUI DOM backend. `native/` is the OCaml application
and OS-service adapter, not a renderer. Keep it and the native database worker.
The former `ocaml_host/` SDL renderer has been removed.

## Setup

Use OCaml 5.5.x, Dune 3.23 or newer, Node/pnpm from the root package metadata,
and Rust 1.97.0. Run from the repository root:

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
The UI installer pins LUI to the immutable NSH desktop revision and installs an
explicit non-SDL dependency set; errors are not hidden by a fallback install.
`markup` supports native HTML-to-Markdown conversion.

macOS needs Xcode command-line tools, `pkg-config`, SQLite, libffi and GMP;
packaging also needs `dylibbundler` (`brew install dylibbundler`). Linux needs
a C/C++ toolchain, pkg-config, libc development files, SQLite/libffi/GMP, GTK 4,
Pango/Cairo/HarfBuzz/FreeType/fontconfig and OpenGL/EGL/GLES development files.
Install a CJK font for CJK rendering. SDL, tsdl and tgls are not dependencies.

## Desktop

```sh
pnpm ui:nsh:build
LOGSEQ_ROOT_DIR=/path/to/graphs LOGSEQ_UI_STATE_DIR=/path/to/ui-state pnpm ui:nsh
pnpm ui:nsh:package
```

Build and run both build the native worker. See `nsh/README.md` for staged
startup qualification, artifact receipts, native launch and packaging boundaries.
The independent `nsh-desktop.yml` workflow owns NSH artifacts; the existing
Electron release pipeline remains separate. No compatibility command launches
MyGo. The old Go source is not an active build dependency.

### Graph storage

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
packaging does not replace its backend or require Rust to build the Web bundle.
See `docs/architecture.md` for module boundaries and `docs/parity-audit.md`
for the distinction between historical Web evidence and desktop acceptance.
