# Native MCP Architecture

## Scope

The native MCP server runs inside Logseq Desktop and targets Logseq DB graphs.
Logseq source, its SDK, tests and documented tool contracts are authoritative.
Current routes are recorded in [the tool map](mcp-native-tool-map.md), and live
checks in [the native end-to-end checklist](mcp-native-e2e-test.md).

## Application path

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
`logseq.DB.*` API methods
    |
    +-- `logseq.api.db`: datascript/custom query and DB worker access
    +-- `logseq.api.db-based`: page, block, tag and property API operations
    +-- editor/page/property handlers and `frontend.db.async`
    |
    v
Graph/database worker
```

The server registers 55 tools. `upsertNodes` is not an advertised MCP tool.
Handlers use the existing desktop API bridge; MCP does not open its own
database connection or implement a separate transaction path.

## Tool and API boundaries

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
Logseq API adapter (`electron.mcp-compat`)
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

The transport is `electron.mcp-server`. Domain handlers own validation, response shaping, acknowledgements,
read-back verification, and error distinctions. Adapter functions own how a
page, block, tag, or property is resolved or changed, using `logseq.DB.*` API
functions. Those APIs remain the mutation boundary; MCP does not call editor
handlers, graph-worker transactions, or DataScript mutations directly.

## Ownership boundaries

| Concern | Owner | Responsibility |
|---|---|---|
| MCP transport and sessions | `electron.mcp-server` | authenticated Streamable HTTP and session handling |
| MCP registration and zod schemas | `electron.mcp-server` | public tool names and input contracts |
| API error envelope | `electron.mcp-server` | returned API errors and IPC exceptions become MCP errors |
| Page/block API operations | `logseq.api.db-based` and handlers | application-owned semantics behind DB API methods |
| Queries | `logseq.api.db` and `frontend.db.async` | read-only application queries behind the DB API |
| DB transactions | graph/database worker | existing mutation machinery; no direct arbitrary datom writes |
| Contract validation | MCP domain handlers and native APIs | identifiers, bounds, acknowledgements and error distinctions |
| Write verification | MCP domain handlers | read-back and comparison of actual state |

## Adapter surface

Adapters expose only operations needed by registered tools:

- `get-page`, `list-pages`, `create-page`, `rename-page`, `recycle-page`
- `get-block`, `search-blocks`, `get-block-tree`, `create-block`, `update-block`
- `move-block`, `remove-block`, `clear-page`
- `get-tag`, `create-tag`, `delete-tag`, `add-tag`, `remove-tag`
- `get-property`, `create-property`, `delete-property`, `set-property`,
  `clear-property`
- query helpers for backlinks, orphans, stats, lists, and link repair

No adapter function should expose raw HTTP, MCP request objects, or low-level
worker details to the domain layer.

## Engineering rules

1. Preserve registered tool names, argument names, defaults, output fields, and
   intentional misspellings (`creatTag`, `getProperyUsers`).
2. Validate UUIDs and idents before mutations.
3. Keep write -> read-back -> compare verification, including `verified=false`.
4. Preserve partial batch behavior and destructive-operation acknowledgements.
5. Test real graph state in addition to unit tests.
6. Change one operation at a time. Verify its native contract, API routing and
     relevant graph state before changing an active route.

## Discovery and query safeguards

- `datascriptQuery` passes through the existing DB query API only after fresh
    explicit approval of each exact query and inputs. It is a read-only last
    resort with bounded output, audit logging and no automatic retries.
- `getContentCapabilities` reads safe, bounded application metadata through
    its DB API. It distinguishes implementation support, visual verification and
    MCP creation support; plugin names alone do not establish usable syntax.
- DB and Editor/App implementations may share existing exports through normal
    dispatch. MCP callers still use `logseq.DB.*`; do not duplicate application
    implementations merely to establish that namespace boundary.

## Validation

Use focused native tests, SDK checks and applicable compilation/lint gates.
Keep local results, live graph evidence and deployment status separate.
Run live mutations only with explicit approval on a disposable graph, and
preserve retained fixtures. Do not restart the app or rebuild watched runtime
bundles during an active live test. See the checklist for the current workflow.
