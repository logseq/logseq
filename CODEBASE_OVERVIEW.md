# Logseq Codebase Overview

The web app, database worker, Electron main process, and CLI are implemented
in OCaml. Melange compiles JavaScript targets; native targets use shared
modules with platform-specific implementations of their contracts.

## Build and Test

Dune compiles OCaml, Vite bundles JavaScript, and Gulp stages static resources
and packages the desktop app. Babashka provides development tasks.

- `pnpm release`: build the LUI web app and database worker.
- `pnpm test`: run database worker and UI tests.
- `pnpm test:publishing`: check exported sites, CLI export, and LUI export.
- `bb lint:dev`: validate shared resources and translation keys.

Docker packaging requires the `static/` output from `pnpm release`.
The Docker workflow builds the checked-out revision before packaging it.

## Important Directories

- `deps/ui/src/`: LUI components, editor behavior, routing, and application state.
- `deps/ui/js_app/`: web application entry point.
- `deps/ui/native/` and `deps/ui/gpui/`: native platform implementations.
- `deps/ui/test/`: UI tests compiled for Node.
- `deps/db-worker/lib/`: database operations, rendering resources, search,
  publishing export, and sync behavior.
- `deps/db-worker/runtime/`: JavaScript and native platform implementations.
- `deps/db-worker/desktop/`: Electron main process.
- `deps/db-worker/test/`: native and Melange worker tests and migration fixtures.
- `cli/`: OCaml command-line application.
- `ocaml-e2e/`: browser application tests.
- `cli-e2e/`: command-line integration tests.
- `resources/`: styles, translation dictionaries, templates, and static assets.
- `resources/package.json`: application version and desktop dependencies.
- `scripts/`: build helpers and Babashka tasks.
- `deps/publish/`: Cloudflare publishing backend, Durable Objects, and R2.

The root `src/`, `deps.edn`, and `shadow-cljs.edn` have been removed.
Active ClojureScript services and tooling keep their configuration under
`deps/` and `scripts/`.

## Data Flow

The database worker owns graph data in DataScript and persists regular
graphs through SQLite-backed storage. The frontend calls worker endpoints
and subscribes to rendering resources. UI state changes pass through the
application model and LUI signals.

Editing updates the local editor model immediately. Worker endpoints save
content and outliner structure; resource updates refresh affected UI.
Platform modules provide input, selection, and geometry behavior.

A published static site embeds an exported database and initializes an
in-memory DataScript connection on the main thread. It uses existing read
endpoint contracts without starting a database worker or opening SQLite.
Search reads DataScript datoms. Editing and mutation commands are disabled;
navigation, folding, search, and read-only views remain available.
