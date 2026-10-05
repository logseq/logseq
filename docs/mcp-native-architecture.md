# Native MCP Architecture

## Scope

This document records the Stage 0 architecture for migrating the verified
`mcp-logseq-db` tool contract into Logseq. The current implementation is an
Electron desktop MCP endpoint backed by the Logseq API. The migration will
extend that endpoint with a domain layer and an adapter; it will not introduce
a second transport or a Python relay.

## Current verified path

```text
MCP client
    |
    v
Electron Streamable HTTP /mcp route
    |
    v
`electron.mcp-server`
    |
    +-- tool schema and registration (`@modelcontextprotocol/sdk` + zod)
    +-- API response envelope
    |
    v
Electron API bridge (`api-fn`)
    |
    v
Logseq API methods
    |
    +-- `logseq.api.db`: datascript/custom query and DB worker access
    +-- `logseq.api.db-based`: page, block, tag and property API operations
    +-- editor/page/property handlers and `frontend.db.async`
    |
    v
Graph/database worker
```

The existing bridge registers six tools: `listPages`, `getPage`, `upsertNodes`,
`searchBlocks`, `listTags`, and `listProperties`. It calls API methods through
the existing desktop server, so it is a transport/API compatibility bridge,
not yet the Python server's behavioral contract.

## Target staged path

```text
MCP client
    |
    v
Electron Streamable HTTP /mcp route
    |
    v
Native MCP registration and schemas
    |
    v
MCP domain operations
    |
    v
Logseq compatibility adapter
    |
    v
`logseq.DB.*` API functions
    |
    +-- existing DB APIs and query layer
    +-- editor/page/property handlers
    |
    v
Graph/database worker and editor invariants
```

The transport remains `electron.mcp-server` and the adapter is the migration
seam. Domain handlers own validation, response shaping, acknowledgements,
read-back verification, and error distinctions. Adapter functions own how a
page, block, tag, or property is resolved or changed, using `logseq.DB.*` API
functions. Those APIs remain the mutation boundary; MCP does not call editor
handlers, graph-worker transactions, or DataScript mutations directly.

## Ownership boundaries

| Concern | Current owner | Migration owner |
|---|---|---|
| MCP transport and sessions | `electron.mcp-server` | unchanged |
| MCP registration and zod schemas | `electron.mcp-server` | native MCP registration namespace |
| API error envelope | `electron.mcp-server` | domain error serializer, then shared transport envelope |
| Page/block API operations | `logseq.api.db-based` and handlers | compatibility adapter first |
| Queries | `logseq.api.db` and `frontend.db.async` | compatibility adapter first; native query layer later |
| DB transactions | graph/database worker | existing mutation machinery; no direct arbitrary datom writes |
| Contract validation | Python boundary helpers | native domain boundary |
| Write verification | Python content/mutation classes | native domain layer until stronger guarantees are proven |

## Initial adapter surface

The first adapter should expose only operations needed by a migrated tool:

- `get-page`, `list-pages`, `create-page`, `rename-page`, `recycle-page`
- `get-block`, `search-blocks`, `get-block-tree`, `create-block`, `update-block`
- `move-block`, `remove-block`, `clear-page`
- `get-tag`, `create-tag`, `delete-tag`, `add-tag`, `remove-tag`
- `get-property`, `create-property`, `delete-property`, `set-property`,
  `clear-property`
- query helpers for backlinks, orphans, stats, lists, and link repair

No adapter function should expose raw HTTP, MCP request objects, or low-level
worker details to the domain layer.

## Migration rules

1. Preserve Python tool names, argument names, defaults, output fields, and
   intentional misspellings (`creatTag`, `getProperyUsers`).
2. Validate UUIDs and idents before mutations.
3. Keep write -> read-back -> compare verification, including `verified=false`.
4. Preserve partial batch behavior and destructive-operation acknowledgements.
5. Test real graph state in addition to unit tests.
6. Migrate one read or mutation at a time and compare compatibility/native
   results before changing the active route.

## Stage 0 baseline

- Python baseline: `Set-Location mcp-logseq-db; python -m pytest -q` passes
    with 403 tests.
- Logseq baseline: Babashka `1.13.223`, Clojure CLI `1.12.5.1664`, and
    OpenJDK `21.0.9` are installed. Lint, carve, translation validation,
    namespace checks, and ClojureScript compilation pass. The aggregate test task
    exits nonzero in `logseq.api.plugin-test` with 11 Windows path/fixture
    assertions; the other selected tests pass.

The baseline is not clean yet because the Logseq suite has not started. Stage 1
must not begin until that suite also has a valid recorded result.
