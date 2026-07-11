# ADR 079: DB-Sync Semantic REST API and ChatGPT App

Status: Accepted

Date: 2026-07-11

## Context

The `deps/db-sync` Cloudflare Worker already provides HTTP endpoints for graph metadata, sync transactions, snapshots, E2EE keys, members, and assets. Those endpoints are transport-oriented. They do not provide a stable semantic API for reading and editing pages and blocks.

Logseq clients implement semantic edits with `deps/outliner`. Reimplementing page and block mutation rules in HTTP handlers would create a second outliner, bypass transaction metadata, and risk producing server state that normal clients cannot replay.

ChatGPT apps connect to remote Model Context Protocol servers. Cloudflare Code Mode can expose an OpenAPI service through two MCP tools:

- `search` runs model-written JavaScript against the OpenAPI document.
- `execute` runs model-written JavaScript with a host-provided request function.

The OpenAPI document stays outside model context until selected information is returned by `search`. The host request callback retains credentials and is the enforcement point for permission scopes and rate limits.

Most synced graphs are end-to-end encrypted. The db-sync server stores and synchronizes those graphs but cannot decrypt semantic page or block content.

Code Mode is experimental as of this decision, so its runtime integration must remain isolated from Logseq's graph implementation.

## Decision

### 1. Add a versioned semantic API to `deps/db-sync`

The initial API supports pages, blocks, tags, properties, assets, capture, and cross-resource search. Pages remain block entities internally and use the same UUID identity as ordinary blocks, but they retain focused `GET` and `POST /pages` endpoints for discovery and creation. The API does not expose a broad `GET /blocks?kind=...` collection.

The Worker will add these initial endpoints:

- `GET /openapi.json`
- `GET /api-docs`
- `GET /api/v1/graphs`
- `GET /api/v1/graphs/:graph-id/pages`
- `POST /api/v1/graphs/:graph-id/pages`
- `GET /api/v1/graphs/:graph-id/pages/:page-id/blocks`
- `GET /api/v1/graphs/:graph-id/pages/:page-id`
- `PATCH /api/v1/graphs/:graph-id/pages/:page-id`
- `DELETE /api/v1/graphs/:graph-id/pages/:page-id`
- `GET /api/v1/graphs/:graph-id/blocks/:block-id`
- `PATCH /api/v1/graphs/:graph-id/blocks/:block-id`
- `DELETE /api/v1/graphs/:graph-id/blocks/:block-id`
- `POST /api/v1/graphs/:graph-id/block-moves`
- `POST /api/v1/graphs/:graph-id/blocks/:block-id/children` with `position: "append"|"prepend"`
- `POST /api/v1/graphs/:graph-id/block-trees`
- `PUT /api/v1/graphs/:graph-id/blocks/:block-id/properties/:property-id`
- `DELETE /api/v1/graphs/:graph-id/blocks/:block-id/properties/:property-id`
- `POST /api/v1/graphs/:graph-id/block-properties/batch-set`
- `POST /api/v1/graphs/:graph-id/block-properties/batch-delete`
- `POST /api/v1/graphs/:graph-id/capture`
- `GET /api/v1/graphs/:graph-id/tasks`
- `POST /api/v1/graphs/:graph-id/tasks`
- `GET /api/v1/graphs/:graph-id/tags`
- `POST /api/v1/graphs/:graph-id/tags`
- `GET /api/v1/graphs/:graph-id/tags/:tag-id`
- `GET /api/v1/graphs/:graph-id/tags/:tag-id/objects`
- `PATCH /api/v1/graphs/:graph-id/tags/:tag-id`
- `DELETE /api/v1/graphs/:graph-id/tags/:tag-id`
- `GET /api/v1/graphs/:graph-id/properties`
- `POST /api/v1/graphs/:graph-id/properties`
- `GET /api/v1/graphs/:graph-id/properties/:property-id`
- `PATCH /api/v1/graphs/:graph-id/properties/:property-id`
- `DELETE /api/v1/graphs/:graph-id/properties/:property-id`
- `GET /api/v1/graphs/:graph-id/pages/:page-id/references`
- `GET /api/v1/graphs/:graph-id/assets/:asset-block-id`
- `GET /api/v1/graphs/:graph-id/search?q=...&types=blocks,tags,properties,assets`

The existing sync HTTP and WebSocket protocol remains unchanged.

One operation registry owns the HTTP method, path template, operation ID, required scope, rate-limit class, and OpenAPI operation. Route matching, authorization, rate-limit selection, and OpenAPI generation derive from that registry so they cannot drift independently.

The release build exports that same generated OpenAPI document and runs Redocly CLI `build-docs` to create a standalone HTML reference. The Worker serves the generated artifact at `/api-docs` and `/api-docs/`; the documentation is public like `/openapi.json`, while executing graph operations still requires their declared OAuth scopes. The generated artifact is embedded at build time and is never fetched from a previous deployment.

Every collection endpoint and cross-resource search uses cursor pagination. Requests accept `limit` (default 50, maximum 200) and an opaque `cursor`. Responses contain the resource collection and include `next-cursor` only when another page exists. Ordering uses a deterministic resource-specific key with UUID as the final tie breaker; cursors encode that key rather than an offset, so a stable graph snapshot does not skip or duplicate results. Invalid cursors return `400` and never fall back to the first page.

`GET /api/v1/graphs` resolves the authenticated user's available non-E2EE graphs before graph-scoped operations. It supports `name` for an exact case-insensitive graph-name match and the same `limit`/`cursor` contract. The implementation reads bounded metadata rows from D1; it does not open graph databases or load graph entities.

Pages, tags, and properties provide full create, read, update, and delete operations. Their collection `GET` operations are paginated; item `GET` operations are bounded to one entity. `GET /pages/:page-id/blocks` paginates top-level blocks in outliner order, and each selected top-level block includes its complete descendant tree. The `limit` and cursor apply to top-level roots, so pagination never splits a returned parent from its descendants. `GET /blocks/:block-id` returns only the addressed block, so a page lookup cannot accidentally return an unbounded tree. Page and tag deletion use `logseq.outliner.page/delete!`; page deletion is kept separate from block deletion so the page-specific cleanup path remains explicit. Property updates and deletion use the corresponding `deps/outliner` property operations rather than raw datoms.

`GET /tags/:tag-id/objects` returns blocks and pages whose `:block/tags` contains the addressed tag. `GET /pages/:page-id/references` returns blocks and pages whose `:block/refs` contains the addressed page. Both endpoints are cursor-paginated flat collections; they do not recursively expand children or referenced entities. Their implementations walk the indexed AVET range for the exact tag or page entity and only materialize the requested page, so they never scan or load all graph entities. Results use deterministic DataScript entity-ID order from that index and an opaque cursor, avoiding an in-memory sort of all matches.

### 2. Use `deps/outliner` for semantic mutations

The db-sync dependency set will include `logseq/outliner` from `../outliner`.

Blocks are the base semantic resource. A page is a block entity with page identity such as `:block/name`; block responses include `kind: "page"` or `kind: "block"`. `GET /pages` is paginated and `POST /pages` creates a page through `deps/outliner`.

`POST /blocks/:block-id/children` inserts one or more block trees as the first or last children of the target. `POST /block-trees` inserts a recursive tree relative to an explicit target block and position. Both recursively flatten the request only to coordinate `deps/outliner` calls; they do not construct raw mutation datoms.

`POST /block-moves` accepts one or more unique source block UUIDs, a target block UUID, and one of `before`, `after`, `first-child`, or `last-child`. It validates every source before mutation and delegates the complete source collection to `logseq.outliner.core/move-blocks!`, which preserves Logseq's outliner ordering rules.

`POST /capture` appends a supplied block tree to the end of today's journal page. It derives the journal title through Logseq date utilities, creates the journal page through `logseq.outliner.page/create!` when absent, and inserts through `deps/outliner`. It does not require a client to discover or create today's page first.

Single property assignment uses idempotent `PUT` because the addressed block-property pair has one resulting representation; deletion uses idempotent `DELETE` on the same URL. They resolve property identifiers through graph entities and call the existing `logseq.outliner.property` setters. A cardinality-many array on `PUT` replaces the collection by removing the prior values and adding each validated entity through `batch-set-property!`; scalar writes continue through `set-block-property!`. Batch set and batch delete use explicit collection endpoints because they affect multiple block-property pairs and are not single-resource replacements. Batch set appends cardinality-many values by default and accepts top-level `isResetExistingValues: true` to replace existing values. Each batch validates every block and property before applying changes and returns the affected count; invalid input fails before mutation rather than partially applying an unvalidated request.

Tags and properties are exposed as focused resources because callers need their schemas, but their identities remain Logseq graph entities rather than a parallel server model.

Tasks are first-class semantic resources backed by ordinary blocks or pages tagged with `:logseq.class/Task`. `GET /tasks` walks the indexed Task-class AVET range, supports cursor pagination plus status, priority, and title-content filters, and returns typed task properties. It never substitutes title search for class membership. `POST /tasks` creates a normal outliner block, assigns the Task class, and sets typed status, priority, scheduled, and deadline values. Task titles never encode file-graph Markdown markers such as `TODO`. Status and priority aliases cover built-in choices only; clients may also select user-defined choices by UUID, ident, or exact title. Property responses expose the graph's current `choices` so agents can discover extensions instead of assuming a closed enum.

Property paths accept a property UUID, qualified ident, or exact title. Property writes accept JSON scalar values for scalar properties. For ref properties, entity selectors may be stable UUIDs, qualified idents, or exact titles; cardinality-many properties accept arrays of those selectors. Status and Priority additionally normalize case-insensitive built-in aliases such as `TODO`, `DONE`, and `HIGH` to their DB choice entities, while user-defined choices remain selectable by UUID, ident, or exact title. The handler resolves selectors to existing entity IDs before calling `deps/outliner`. Class-valued properties such as `:block/tags` additionally require every resolved entity to be a class and return `400` with a stable actionable error when resolution fails.

Assets remain blocks tagged as assets. `GET /assets/:asset-block-id` resolves the asset block and returns a short-lived, signed Worker URL for its R2 object. The URL expires after five minutes and does not contain an OAuth bearer token. There is no semantic asset upload endpoint. Asset deletion uses the same `DELETE /blocks/:block-id` operation as every other block, ensuring the outliner transaction and asset reference cleanup follow one deletion path.

The per-graph Durable Object will open its existing DataScript connection through `logseq.db-sync.storage/open-conn`. Semantic mutations use:

- `logseq.outliner.page/create!` for page blocks and tags.
- `logseq.outliner.core/insert-blocks!` for block insertion.
- `logseq.outliner.core/save-block!` for block edits.
- `logseq.outliner.core/move-blocks!` for block movement.
- `logseq.outliner.page/delete!` for page deletion and `logseq.outliner.core/delete-blocks!` for ordinary block deletion.
- `logseq.outliner.property/upsert-property!` for property creation or update.
- `logseq.outliner.property/set-block-property!` and `batch-set-property!` for scalar and collection property assignment.

The existing storage listener records each outliner transaction in `tx_log`, advances `t`, and updates the checksum. After a successful semantic mutation, the Durable Object broadcasts the normal `changed` message so connected clients pull the transaction through the existing sync protocol.

HTTP handlers must not construct raw mutation datoms when an outliner operation exists.

Read handlers may query the DataScript DB directly. They use DB-graph attributes such as `:block/uuid`, `:block/title`, `:block/name`, `:block/parent`, `:block/page`, `:block/order`, and `:block/tags`; they must not use file-graph-only attributes such as `:block/content` or `:block/left`.

### 3. Fail closed for E2EE graphs

Semantic endpoints are available only when the graph metadata has `graph_e2ee = false`.

For an E2EE graph, every semantic endpoint returns `409` with a stable `semantic-api-unavailable-for-e2ee` error. The server will not return encrypted values as if they were page or block content and will not attempt server-side decryption.

Metadata, sync, snapshot, membership, key, and asset endpoints continue to work for E2EE graphs.

### 4. Require explicit OAuth scopes

The semantic API and MCP endpoint use the existing verified Cognito JWT authentication. New Cognito resource-server scopes are:

- `logseq/read` for reading blocks, tags, properties, assets, and search results.
- `logseq/write` for creating or changing blocks, tags, properties, and assets.

The Worker reads the standard space-delimited JWT `scope` claim. Authentication, graph membership, and operation scope are separate checks; all three must pass. Unknown operations fail closed.

The OpenAPI document declares OAuth authorization-code security and the required scope on each operation. Credentials are never included in the OpenAPI document, MCP tool results, or model-written code.

### 5. Enforce rate limits before Durable Object work

The Worker uses Cloudflare Rate Limiting bindings rather than isolate memory or a custom cache:

- `SEMANTIC_READ_RATE_LIMITER`: 120 requests per 60 seconds.
- `SEMANTIC_WRITE_RATE_LIMITER`: 20 requests per 60 seconds.

The rate-limit key combines the verified JWT subject, operation ID, and graph ID. The Worker checks the binding after authentication and scope validation but before forwarding to the graph Durable Object.

When a limit is exceeded, the Worker returns `429` with `Retry-After: 60` and does not call the Durable Object. Missing rate-limit bindings are deployment errors and fail closed for semantic requests.

### 6. Publish the OpenAPI API through Cloudflare Code Mode MCP

The Worker exposes streamable HTTP at `/mcp` using `openApiMcpServer()` from `@cloudflare/codemode/mcp` and a `DynamicWorkerExecutor` backed by a Worker Loader binding.

The MCP server exposes Code Mode's `search` and `execute` tools. The `execute` host request callback:

1. Resolves method and path through the same operation registry.
2. Forwards the verified OAuth bearer token without exposing it to generated code.
3. Calls the Worker's semantic REST endpoint.

The REST dispatch path remains authoritative for scope, graph access, E2EE, and rate-limit enforcement. The MCP layer does not duplicate or weaken those checks.

Direct outbound access from model-written code remains disabled. The sandbox can reach Logseq only through the host request callback.

### 7. Treat the MCP endpoint as the ChatGPT app backend

The first Logseq ChatGPT app consists of the remote `/mcp` endpoint, OAuth metadata, OpenAPI-backed tools, and deployment documentation. ChatGPT connects to the deployed Worker URL and requests the scopes needed for the user's actions.

The MCP descriptors include human-readable titles, input schemas, per-tool OAuth security schemes, and the required `readOnlyHint`, `openWorldHint`, and `destructiveHint` annotations. Because `execute` can select any documented semantic operation, its descriptor is classified as a bounded destructive write tool even when a particular generated program performs only reads.

The first version does not ship a custom iframe component. Block, tag, property, asset, and search results use structured JSON that ChatGPT can render natively. A custom UI can be added later without changing the REST contract.

The Worker publishes OAuth protected-resource metadata for `/mcp` and the semantic API, pointing clients to the configured Cognito issuer and listing `logseq/read` and `logseq/write`.

The MCP app is tested in ChatGPT developer mode before it is packaged as an installable plugin. Plugin packaging uses the real `plugin_asdk_app...` identifier generated by ChatGPT; the identifier is not invented or checked into the server before developer-mode creation succeeds.

## Request flow

```text
ChatGPT
  -> db-sync Worker /mcp with Cognito OAuth token
  -> Code Mode search or execute sandbox
  -> host request callback with hidden bearer token
  -> semantic REST dispatch
     -> verify JWT
     -> require operation scope
     -> verify graph membership
     -> apply Cloudflare rate limit
  -> per-graph SyncDO
     -> reject E2EE graph
     -> read DataScript or mutate through deps/outliner
     -> storage listener appends normal sync tx
     -> broadcast changed
```

## Consequences

### Positive

- Server semantic edits use the same outliner invariants as Logseq clients.
- Existing clients receive ChatGPT edits through the normal sync protocol.
- The OpenAPI document serves REST clients and progressive MCP discovery.
- ChatGPT receives a fixed two-tool surface as the semantic API grows.
- Model-written code never receives bearer tokens.
- Permissions and rate limits are enforced before graph work.
- E2EE confidentiality is preserved.

### Negative

- The ChatGPT app cannot read or edit E2EE graph content.
- Users need a non-E2EE graph for semantic server integrations.
- Cognito must be configured with the new resource-server scopes and an OAuth client usable by ChatGPT.
- Code Mode requires a Worker Loader binding and is experimental.
- Adding `deps/outliner` increases the db-sync Worker bundle size.

## Rejected alternatives

### Implement semantic mutations directly with raw DataScript transactions

Rejected because it duplicates `deps/outliner`, risks invalid tree state, and may omit replayable outliner transaction metadata.

### Decrypt E2EE graphs in the Worker

Rejected because the server must not possess plaintext graph keys or content.

### Expose sync transactions directly as ChatGPT tools

Rejected because Transit transaction payloads are a replication protocol, not a safe semantic editing interface.

### Give Code Mode direct access to Cognito tokens or Worker fetch

Rejected because generated code must not receive credentials or arbitrary network access.

### Implement rate limits with Worker global memory

Rejected because isolates do not provide consistent shared counters and would under-enforce limits.

### Add one MCP tool per operation

Rejected because the requested OpenAPI Code Mode design provides progressive discovery and a fixed tool footprint.

## Verification

Implementation is accepted when tests prove:

- OpenAPI paths, route matching, operation IDs, scopes, and rate classes derive from one registry.
- Missing authentication, missing scope, missing graph access, E2EE graphs, and unknown operations fail closed.
- Rate-limit rejection does not call a graph Durable Object.
- Page and block mutations call `deps/outliner` and append replayable sync transactions.
- Successful mutations broadcast one normal `changed` notification.
- Reads use DB-graph attributes and return stable JSON shapes.
- MCP streamable HTTP exposes Code Mode `search` and `execute`.
- Generated code receives only the OpenAPI document and host request function, never credentials.
- Existing db-sync server tests and the Node adapter suite remain green.

All implementation tests are written and observed failing before production behavior is added.
