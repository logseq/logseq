# Logseq Module Review Rules

This directory contains review modules for Logseq product/runtime areas.

Use these files after identifying touched namespaces, file paths, runtime targets, and persisted contracts.

## Current modules

- [`logseq-cli.md`](./logseq-cli.md) — CLI commands, output contracts, graph isolation
- [`db-sync.md`](./db-sync.md) — server/worker protocol, D1 migrations, sync correctness
- [`outliner-core.md`](./outliner-core.md) — block tree operations and structural invariants
- [`db-model.md`](./db-model.md) — properties, keywords, schema, migrations
- [`i18n.md`](./i18n.md) — translation dictionaries, user-facing text, i18n lint scope
- [`frontend-ui.md`](./frontend-ui.md) — shipped UI behavior, state, rendering
- [`editor-commands.md`](./editor-commands.md) — editing commands, shortcuts, cursor/selection
- [`electron-main.md`](./electron-main.md) — Electron main process, IPC, filesystem, security
- [`import-export.md`](./import-export.md) — import/export/publish data transformations
- [`search-indexing.md`](./search-indexing.md) — search correctness and index/cache invalidation
- [`mobile.md`](./mobile.md) — Capacitor/mobile-specific behavior
- [`whiteboard.md`](./whiteboard.md) — canvas/whiteboard interactions and data persistence
