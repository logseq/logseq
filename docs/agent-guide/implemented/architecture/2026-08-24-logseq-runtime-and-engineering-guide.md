# Logseq Runtime and Engineering Guide

Status: implemented

This is a compact, source-verified engineering guide for the runtime areas that
were previously documented across docs/agent-guide. It was checked against the
repository on 2026-08-24.

The guide explains durable architecture, data flow, invariants, failure behavior,
and verification entry points. It intentionally omits implementation schedules,
branch instructions, temporary measurements, review snapshots, and product
research. Source code, tests, generated OpenAPI, and active subsystem
documentation remain the detailed contracts behind this guide.

## Problem

Engineering knowledge about the CLI, db-worker-node, db-sync, rendering,
outliner performance, search, and Graph View was distributed across plans and
reports. The useful content was mixed with proposed work, obsolete paths, and
time-sensitive observations. Engineers need one short technical map that
preserves the valid constraints without treating historical plans as current
contracts.

## Decision

### System model

Logseq uses different runtime processes. Within one local runtime, the worker
database is authoritative for graph state. On Desktop, a graph has at most one
active local writer daemon; remote db-sync storage is a synchronized copy, not a
second local writer.

| Runtime | Main responsibility | Persistent database |
| --- | --- | --- |
| Browser renderer | UI, editor state, worker client | None directly |
| Browser db-worker | Graph transactions and queries | SQLite through OPFS |
| Desktop renderer | UI and remote persistence client | None directly |
| Electron main | Window and db-worker-node lifecycle | Filesystem coordination |
| db-worker-node | Graph transactions, queries, sync, search | Filesystem SQLite |
| CLI | Command parsing, orchestration, formatting | Uses db-worker-node |
| db-sync Worker/DO | Remote graph access and ordered synchronization | D1/DO SQLite and R2 |

Important ownership rules:

- The worker database is authoritative for graph state.
- Desktop and CLI use the same graph directory, lock protocol, and
  db-worker-node runtime.
- The renderer must not create a second optimistic graph authority.
- Disk SQLite is the Desktop source of truth. OPFS export is not the Desktop
  primary persistence path.
- A graph must not have two active writer daemons.

Primary source map:

| Area | Source |
| --- | --- |
| Worker database and thread APIs | src/main/frontend/worker/ |
| Browser persistence | src/main/frontend/persist_db/browser.cljs |
| Desktop remote persistence | src/main/frontend/persist_db/remote.cljs |
| Electron runtime manager | src/electron/electron/db_worker.cljs |
| Shared daemon lifecycle | src/main/logseq/cli/server.cljs |
| Node daemon | src/main/frontend/worker/db_worker_node.cljs |
| CLI | cli/ |
| db-sync server | deps/db-sync/src/logseq/db_sync/worker/ |
| Renderer DB subscriptions | src/main/frontend/db/ |

### Worker platform boundary

frontend.worker.platform is the worker capability boundary. The required adapter
sections are:

- env
- storage
- kv
- broadcast
- websocket
- crypto
- timers
- sqlite

Vector and embedding capabilities are present when the runtime supports semantic
search.

The browser adapter uses OPFS, browser storage, browser WebSocket, and the worker
postMessage channel. The Node adapter uses filesystem paths, Node WebSocket,
Node crypto/storage primitives, and node:sqlite DatabaseSync.

Business namespaces should depend on frontend.worker.platform instead of testing
the host runtime repeatedly. Missing required capabilities fail during platform
validation. Optional capabilities may be absent only where the feature itself is
optional.

Interactive requests use frontend.worker.ui-request:

1. The worker creates a unique request id.
2. The host receives a typed request and payload.
3. The host resolves or rejects that exact request.
4. Cancellation rejects outstanding requests during graph/runtime shutdown.

Browser flows may request UI input. Headless Node flows must use explicit input
or return a useful error. New worker business logic should not call renderer
functions directly. One non-Node search progress path still uses
frontend.worker.state/<invoke-main-thread; do not treat that exception as a
general worker API.

### db-worker-node daemon

db-worker-node is a graph-bound localhost daemon. It starts the same worker core
used by the browser, installs the Node platform adapter, opens the requested
repo, writes graph and server-list metadata, and becomes ready only after worker
initialization succeeds.

Client-facing endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /healthz | Readiness, bound repo, process, owner, revision, host, and port |
| GET | /v1/events | Server-Sent Events from worker broadcasts |
| POST | /v1/import-db-binary?repo=... | Stream a SQLite database import |
| POST | /v1/invoke | Invoke a worker thread API with Transit arguments |
| POST | /v1/shutdown | Graceful close and process shutdown |

The daemon also answers CORS preflight requests. It binds to `127.0.0.1` on an
OS-selected port and has no remote-bind option.

Most thread APIs require the first argument to identify the repo. The daemon
rejects:

- a missing or blank repo with HTTP 400;
- a repo that differs from the daemon's bound repo with HTTP 409.

Only explicitly listed process-level APIs may omit the repo. This binding keeps a
client from accidentally sending graph work to another daemon discovered from
stale metadata.

#### Graph lock and ownership

The three discovery records have deliberately different scopes:

- `db-worker.lock` records `repo`, `pid`, `lock-id`, and `owner-source`.
- `server-list` records only `pid` and `port` pairs.
- `/healthz` reports `repo`, readiness status, host, port, pid, owner source,
  root directory, and runtime revision.

Neither the graph lock nor `server-list` is a readiness or revision authority.

Lifecycle behavior:

1. Resolve and validate the graph directory under the configured root.
2. Read the graph lock and remove it only when its owner process is absent.
3. Read `server-list`, discard entries whose pid is absent, and probe remaining
   entries through `/healthz`.
4. Spawn only when neither a discovered graph server nor a graph lock exists.
5. Require both a graph lock and a discovered server, then wait for readiness.
6. Reuse the daemon only when its reported revision matches the requester.
7. On revision mismatch, stop that exact server, start once, and verify the new
   revision; fail if stop, startup, or the second revision check fails.

A discovered process without the expected usable lock is not adopted as a valid
runtime; startup fails instead of returning an unowned endpoint.

Normal stop and restart operations respect owner boundaries. A proven revision
mismatch may replace the exact stale daemon across owner sources because the
requester cannot safely use it. Manual CLI cleanup remains limited to eligible
CLI-owned daemons.

#### Server list

root-dir/server-list is a discovery index of pid/port pairs. Mutations are
serialized through root-dir/server-list.lock.

The write protocol:

1. Create the lock with exclusive wx semantics.
2. Write lock owner metadata including pid, lock id, and timestamp.
3. Recover the lock only when its owner process is proven absent.
4. Read and normalize current entries while holding the lock.
5. Write a uniquely named temporary file.
6. Rename the temporary file over server-list atomically.
7. Remove the lock only when its lock id still matches.

Readers tolerate missing files and ignore malformed or duplicate entries. They
must still verify each entry through /healthz.

#### Electron graph switching and recovery

Electron owns graph-scoped runtimes in electron.db-worker. A window may bind to
one graph while another window keeps another graph runtime alive.

setCurrentGraph is metadata synchronization for the window graph path. It does
not release a worker. Runtime start/switch is handled by db-worker-runtime IPC,
and release is handled by explicit lifecycle or window close. Releasing from
setCurrentGraph can stop the newly selected runtime after a switch.

The renderer remote persistence client treats server-unavailable errors as a
runtime recovery signal. The current recovery threshold is one failed request.
Recovery is graph-scoped and must not silently switch the user to another graph.

The SSE client reconnects after 1000 ms by default and keeps scheduling another
attempt while the client remains connected; `disconnect!` stops that loop.
Request recovery is different: the first server-unavailable failure triggers at
most one recovery for the active runtime session. Session and repo checks stop a
stale recovery result from replacing the currently selected graph runtime.

#### Graph backups

Desktop and CLI share the graph backup layout:

~~~text
<root-dir>/graphs/<encoded-graph>/backup/<encoded-backup-name>/
  db.sqlite
  metadata.edn
~~~

Backup policy:

- Snapshot through SQLite backup APIs; do not copy a live database with a plain
  filesystem copy.
- Include db.sqlite only.
- Exclude WAL/SHM sidecars, search-db.sqlite, and client-ops-db.sqlite.
- Reserve the destination directory atomically.
- Add a numeric suffix when a generated backup name already exists.
- Write metadata only after the database snapshot succeeds.
- Remove an incomplete reserved directory on failure.
- Resolve shared-helper backup paths as children of the graph backup root.

metadata.edn records schema version, name, repo, source, creation time, and
database path. Retention is source-specific so automatic pruning cannot delete
manual backups.

Electron runs automatic backups hourly for active graph windows, throttles the
same source, and retains 12 automatic versions. Manual Desktop and CLI backups
are not subject to that automatic retention policy.

The shared ClojureScript helper validates path containment. The current OCaml
CLI `backup restore --src` and `backup remove --src` paths only trim the supplied
name and concatenate it below the backup root; they do not reuse that containment
validator. Do not treat those two `--src` arguments as safe for untrusted input.

Markdown mirror output keeps page-level identity but does not emit block
database ids as HTML comments.

### db-sync architecture

db-sync separates four concerns:

- index-level graph, membership, access, and E2EE operations;
- graph-scoped ordered sync in a Durable Object;
- semantic REST operations for external clients;
- asset storage and signed download access through R2.

Key files:

| Concern | Source |
| --- | --- |
| Entry and dispatch | deps/db-sync/src/logseq/db_sync/worker/dispatch.cljs |
| Sync route registry | deps/db-sync/src/logseq/db_sync/worker/routes/sync.cljs |
| Semantic route registry/OpenAPI | deps/db-sync/src/logseq/db_sync/worker/routes/semantic.cljs |
| WebSocket protocol codec | deps/db-sync/src/logseq/db_sync/protocol.cljs |
| Sync handlers | deps/db-sync/src/logseq/db_sync/worker/handler/sync.cljs |
| Semantic handlers | deps/db-sync/src/logseq/db_sync/worker/handler/semantic.cljs |
| Storage | deps/db-sync/src/logseq/db_sync/storage.cljs |
| Client sync | src/main/frontend/worker/sync/ |
| MCP and ChatGPT entry | deps/db-sync/worker/entry.mjs |

Graph-scoped sync requests use /sync/<graph-id>/... and are forwarded to the
corresponding Durable Object.

#### Sync HTTP routes

The graph-scoped route registry contains:

| Method | Internal path | Purpose |
| --- | --- | --- |
| GET | /health | Graph sync readiness |
| GET | /pull | Transactions after a server t |
| GET | /checksum/diagnostics | Incremental and recomputed checksum details |
| GET | /snapshot/download | Snapshot download |
| GET | /snapshot/stream | Framed snapshot stream |
| DELETE | /admin/reset | Administrative graph reset |
| POST | /tx/batch | Ordered transaction batch |
| POST | /snapshot/upload | Streaming snapshot upload |

Use the route registry for the exact method/path contract. Public dispatch adds
graph id, authentication, access checks, and Durable Object forwarding.

#### WebSocket protocol

Messages are JSON maps. Transaction payloads inside the maps are Transit
encoded. UUIDs are serialized as strings.

Client messages:

| type | Important fields | Result |
| --- | --- | --- |
| hello | none | hello with current t and optional checksum |
| ping | none | pong |
| presence | editing-block-uuid | broadcast presence update |
| pull | since | pull/ok with t, txs, and optional checksum |
| tx/batch | t-before, txs, optional client-revision | tx/batch/ok or tx/reject |

The server also broadcasts online-users, presence, and changed notifications.
Malformed JSON, invalid since values, and unknown types return an error message.

Transaction batches use optimistic ordering:

- t-before must be a non-negative number.
- t-before must equal the server's current t.
- snapshot upload must be complete before normal transactions apply.
- a successful logical batch advances t and returns tx/batch/ok.
- a stale request returns tx/reject with the current t.
- a partial failure reports the new t plus successful and failed transaction
  identifiers when available.
- peers receive one changed notification after the batch and checksum settle.

Clients must pull/rebase after stale rejection instead of retrying the same batch
blindly.

#### Semantic REST and MCP

The semantic API lives under /api/v1 and exposes operations for:

- graph discovery;
- pages and page references;
- blocks, recursive trees, and block moves;
- typed properties and batch property updates;
- journal capture;
- Task objects;
- tags and tagged objects;
- assets;
- graph search.

The semantic layer uses Logseq outliner and property semantics. It must not
implement mutations as arbitrary raw DataScript transactions.

Security and data rules:

- Every operation declares logseq/read or logseq/write OAuth scope.
- Graph access is checked before dispatch into the graph Durable Object.
- E2EE graphs fail closed because the server cannot interpret their content.
- Rate limiting happens before expensive Durable Object work.
- Property mutations use typed DB graph properties, not file-graph key:: text.
- Task creation uses the Task class and typed status/priority/date properties,
  not Markdown TODO syntax.
- Asset uploads are limited to 100 MB and require an exact size plus SHA-256
  checksum.
- The generated /openapi.json is the detailed external contract.

MCP is a thin integration over the semantic API. entry.mjs owns request wiring,
chatgpt_app.mjs owns app metadata, and chatgpt_asset_upload.mjs adapts asset
uploads. Do not create a second independent mutation API for MCP tools.

#### Authentication and E2EE state

Worker auth belongs in frontend.worker.state/*state under namespaced keys:

- :auth/id-token
- :auth/access-token
- :auth/refresh-token
- :auth/oauth-token-url
- :auth/oauth-domain
- :auth/oauth-client-id

frontend.worker.state/*db-sync-config contains transport configuration such as
:ws-url and :http-base. non-auth-db-sync-config strips auth-shaped keys before
storing transport config.

E2EE password rules:

- Never store plaintext passwords in cli.edn or db-sync config.
- Verify a supplied password against the encrypted private key before saving it.
- Do not overwrite a valid stored payload after a failed verification.
- Encrypt the persisted password with material derived from the refresh token.
- Browser storage uses the platform secret store.
- The Node platform prefers the OS keychain under the Logseq E2EE service.
- If keychain access fails, Node falls back to root-dir/kv-store.json.
- CLI E2E mode uses the KV store directly so tests do not mutate the keychain.
- Headless flows fail with a missing-password error and a command hint.
- Interactive browser/Desktop flows may request a password through ui-request.

CLI cloud tokens are stored separately in ~/logseq/auth.json. Runtime sync
receives auth state in memory.

#### Large operations

Large logical transactions must remain one ordered operation while bounding
individual allocations and requests.

Client upload behavior:

- frontend.worker.sync.apply-txs groups datoms without splitting an inseparable
  datom group.
- Upload requests target a 5000-datom cap; one inseparable group may exceed it.
- Chunks are sent sequentially and preserve logical order.

Server apply behavior:

- A large entry targets 500-item apply chunks; one inseparable group may exceed
  the target.
- Intermediate chunks suppress per-chunk checksum updates.
- The final checksum is updated from the complete logical transaction.
- The listener is installed and removed around the operation.
- Failure payloads preserve already successful transaction ids and the failed
  transaction id when known.

Do not promise full rollback across already committed chunks. Preserve explicit
partial-success reporting so clients can reconcile deterministically.

#### Checksums

logseq.db-sync.checksum owns the checksum algorithm. It normalizes eligible
entities into stable tuples and supports both full recomputation and incremental
updates.

Checksum comparison is meaningful only when local and remote transaction
positions are synchronized. The client records the latest remote checksum and
logs a mismatch only after that readiness condition.

Investigation sequence:

1. Record graph id, local t, remote t, local checksum, and remote checksum.
2. Query /checksum/diagnostics for the server recomputation.
3. Recompute the local checksum from the same logical graph state.
4. Compare normalized tuple diagnostics, not raw SQLite row order.
5. Replay a captured transaction with the scripts exposed by
   deps/db-sync/package.json when the incremental transition is suspect.
6. Distinguish a true state divergence from a stale t/checksum observation.

Snapshot upload may initialize a missing checksum only before transaction history
has advanced. It must not overwrite an existing different checksum.

#### Cycle repair utility

`logseq.db-sync.cycle` implements and tests reference-cycle repair for:

- :block/parent, cardinality one;
- :logseq.property.class/extends, cardinality many.

Its algorithm:

1. Collect entities touched by remote and local transaction reports.
2. Detect a reachable cycle with DFS across the configured attribute.
3. Prefer an edge whose current value differs from the corresponding value in
   the remote transaction report.
4. Retract one edge on the cycle.
5. For block parent, add a safe remote parent or page root when possible.
6. For class extension, prefer the remote reference set or Root fallback.
7. Repeat until stable, with a 16-iteration safety cap.

Repair transactions use `:outliner-op :fix-cycle`, disable undo generation, and
set `:persist-op? false`.

Current integration boundary: the client remote-apply path in
`frontend.worker.sync.apply-txs` repairs duplicate outliner orders but does not
call `logseq.db-sync.cycle/fix-cycle!`. The utility and its unit tests therefore
must not be described as active client-side cycle repair.

#### Schema and failure policy

D1 schema changes require SQL migrations in deps/db-sync/worker/migrations.
Runtime schema initialization is not a substitute for a migration.

db-sync should fail closed on invalid auth, graph access, E2EE semantic access,
stale ordering, invalid snapshots, and malformed transaction payloads. Do not
introduce defaults that hide corrupt state.

### Incremental rendering and outliner transactions

The worker commits graph state once and derives renderer state from the committed
transaction.

Current flow:

1. An outliner/thread API transacts in the worker.
2. frontend.worker.db-listener receives the complete transaction report.
3. render-affected-keys derives exact resource invalidations.
4. render-delta builds one renderer delta.
5. The worker broadcasts :sync-db-changes.
6. frontend.db.subs applies the graph-scoped revision.
7. React hooks read immutable snapshots from frontend.db.hooks.

#### Render delta contract

A delta contains:

- graph-id;
- rev, derived from the authoritative database transaction position;
- optional operation id;
- complete block replacements keyed by block UUID;
- deleted block tombstones with revision and previous db/id when available;
- child membership patches per parent;
- affected render-resource keys.

Every replacement block carries :block/tx-id. A block cannot be both replaced
and deleted in one delta.

Child patches contain base-rev and rev plus ordered remove/upsert operations.
Membership changes are derived from:

- :block/parent;
- :block/order;
- :block/closed-value-property;
- :logseq.property/created-from-property;
- :logseq.property/deleted-at.

The renderer ignores a whole delta when its graph differs from the active graph
or its revision is not newer. For child patches, a mounted slot whose base
revision cannot be reconciled is marked stale and reloaded instead of being
merged speculatively.

#### Subscription store

frontend.db.subs owns one immutable external store. Important resource
identities include:

- [:block uuid]
- [:children parent-uuid]
- [:resource resource-key]

Subscriptions watch exact keys. Applying a delta updates cached blocks and
children, marks affected resources, and notifies only slots whose snapshot
changed.

Render-resource computation is registered in
frontend.worker.handler.render-resource.engine. Families include basic graph
lookups, property resources, views, and queries. The registry and
render-affected-keys must evolve together: every cached resource needs an exact
invalidation rule.

Checksum updates, db-sync persistence, Markdown mirror work, and search-index
updates run after the graph transaction commits. Each registered listener is
wrapped so synchronous or promise failures are reported through
`:capture-error`; they do not roll back the committed graph transaction.

#### Outliner performance guardrails

Outliner mutations use worker-owned transactions and publish their committed
result through the renderer delta path. Do not add a second optimistic block
tree or publish the same mutation independently from both a command response and
the DB listener. Page-window APIs should transfer the requested window, not a
full page, and graph-open work must not add graph-wide GC or `VACUUM`.

Useful transaction-pipeline measurements that are already logged include:

- performance id, outliner operation, and transaction count;
- renderer pipeline, delta construction, and broadcast time;
- checksum, persistence, sync-main, and registered-handler time;
- total listener time.

These measurements are diagnostics, not a fixed latency guarantee.

### CLI engineering guide

The shipped CLI is implemented in OCaml and compiled with Melange:

~~~text
cli/ OCaml
  -> Dune/Melange
  -> Vite bundle
  -> cli/_build/default/dist/logseq-cli.js
  -> scripts/stage-cli-runtime.mjs
  -> static/logseq-cli.js
~~~

db-worker-node remains ClojureScript and is bundled separately to
dist/db-worker-node.js. There is no shadow-cljs logseq-cli target.

CLI source map:

| Concern | Source |
| --- | --- |
| Entry/orchestration | cli/lib/cli.ml |
| Command ids | cli/lib/command_id.ml |
| Registry/help/options | cli/lib/command_registry.ml |
| Parsing | cli/lib/cli_parse.ml |
| Actions | cli/lib/cli_action.ml |
| Worker transport | cli/lib/transport.ml |
| Daemon lifecycle | cli/lib/server_runtime.ml |
| Graph/import/export/backup | cli/lib/graph.ml |
| Sync | cli/lib/sync.ml |
| AgentBridge | cli/lib/agent.ml |
| Platform effects | cli/lib/platform/ |
| Public command reference | docs/cli/logseq-cli.md |

cli/spec contains interfaces and cli/test contains unit/parity tests. The CLI
uses the existing CLJS daemon; do not duplicate the worker database or sync
implementation in OCaml.

#### Configuration and output

With the default root, runtime files may include:

~~~text
~/logseq/
  cli.edn
  auth.json
  kv-store.json
  server-list
  graphs/
~~~

Configuration precedence is global flag, then environment variable, then
cli.edn. Auth tokens and E2EE passwords are not CLI config fields.

Output modes:

- human is display-oriented and may truncate table titles by display width;
- json and edn preserve full values for scripts;
- namespaced keyword keys retain namespace/name form in JSON;
- UUIDs become strings in JSON;
- verbose and profile diagnostics go to stderr;
- normal structured stdout must not contain human warnings;
- sync progress is disabled by default for structured output unless explicitly
  requested.

Executed commands are normalized internally to `Cli_result.t`, with status,
data or error, optional command id, output renderer, and optional exit code.
Human output may be a table or message; JSON and EDN serialize structured
results. `skill show` deliberately renders the skill body as raw human text.

#### Data operations

The CLI exposes list, show, search, query, upsert, move, and remove commands.
Important shared rules:

- Human list titles are CJK-aware and truncate by display width, not byte count.
- Structured list output never uses human truncation.
- Selectors must be unambiguous; commands reject conflicting id, UUID, ident,
  name, and page options.
- list node tag/property filters use all-of semantics.
- Block and page references are rendered from UUID-backed graph data.
- show resolves nested block references with a depth cap.
- show page hierarchy is explicit and does not replace normal page content
  display.
- Library is a special hierarchy root, but ordinary page hierarchy uses the
  same bounded traversal and cycle protection.
- Mutations use worker outliner APIs rather than raw database editing in the
  CLI.

SQLite export asks the worker to write the snapshot directly to the destination
path. EDN export forwards validated graph export options. SQLite import has a
top-level missing-graph check; EDN import may target an existing graph.

Current limitation: `graph backup restore` imports a SQLite backup but is not
included in the CLI's top-level missing-graph check. It must not be documented as
rejecting an existing destination until that constraint is implemented.

#### Sync behavior

CLI sync reuses worker-side sync logic:

- upload resolves or creates a remote graph identity before snapshot transfer;
- download starts a create-empty daemon and refuses a non-empty target;
- download uses a long-running command timeout;
- progress uses /v1/events and :rtc.log/download;
- asset download validates the asset entity and local checksum before enqueue;
- a valid local asset skips the remote request;
- a checksum mismatch requests a new download;
- sync config accepts transport keys only;
- E2EE password verification and storage remain worker-owned.

doctor validates the daemon bundle, root permissions, running server readiness,
and revision compatibility. When startup reports missing bundled modules, rebuild
db-worker-node and verify every asset in dist/db-worker-node-assets.json.

#### AgentBridge

cli/lib/agent.ml owns graph-scoped AgentBridge routing.

Implemented routing constraints:

- one bridge lock exists per graph and agent name;
- the agent name comes from configuration or hostname and must be non-empty;
- one master Codex session is started and resumed for task and comment dispatch;
- a task is routable only when it has a stable UUID, the Task class, TODO status,
  the matching assignee, and no `:logseq.property.agent/session-id`;
- an ancestor task session id is passed to the master as inherited routing
  context for descendant tasks.

Prompt templates from the AgentBridge registry are loaded and validated at
startup, and invalid custom templates are replaced with defaults. The current
dispatch path discards that returned template set and constructs hard-coded
master prompts instead. Custom registry templates therefore must not be
documented as affecting dispatched prompts until the dispatch path consumes
them.

The generated master instructions say that only the master may write graph
results, subagents are read-only, and a launched child session id must be saved
on the task. Those are prompt-level policies, not enforcement by the OCaml
bridge, so they must not be presented as runtime guarantees.

Keep graph queries, lock ownership, task routing, prompt construction, and
external process effects separately testable.

### Vector search

Desktop vector search uses:

- Electron embedding server:
  src/electron/electron/embedding_server.cljs;
- default sentence-transformer model: all-MiniLM-L6-v2;
- embedding dimension: 384;
- vector context version: 3;
- zvec-backed Node vector index;
- SQLite keyword search plus vector results.

Each searchable block keeps at most one vector document, keyed by block UUID.
Both indexes derive their text from that block's search title; they do not
concatenate parent, sibling, or child context. SQLite FTS stores a normalized
form for ordinary blocks. The vector document embeds and retains the
pre-normalized title for ranking context-term boosts.

Constraints:

- Do not multiply vector count with rolling windows.
- Do not add parent/sibling traversal to full rebuild or incremental indexing
  without a measured need and an explicit invalidation model.
- Preserve exact keyword matches ahead of weak vector hits.
- Current vector search returns at most 10 vector candidates and requires score
  greater than 0.5.
- A completed vector rebuild writes model id, dimension, and context version to
  index metadata. The current rebuild decision checks the SQLite search index
  `PRAGMA user_version` or an explicit force flag; it does not compare the
  persisted vector metadata on open. Do not claim automatic metadata-mismatch
  rebuild until that check exists.

Incremental indexing derives affected searchable entities from the transaction.
It intentionally does not reindex adjacent siblings merely because a sibling was
reordered, and it does not expand a moved block update to the new parent. Page
hierarchy changes do reindex descendant pages whose indexed titles depend on the
hierarchy.

### Graph View

Graph View is a relationship browser built from worker graph data and rendered
with Pixi.

Source map:

| Concern | Source |
| --- | --- |
| Global UI and settings | src/main/frontend/components/graph.cljs |
| Page/block sidebar graph | src/main/frontend/components/page.cljs |
| Worker graph builder | src/main/frontend/worker/graph_view.cljs |
| React/Rum bridge | src/main/frontend/extensions/graph.cljs |
| Pixi renderer | src/main/frontend/extensions/graph/pixi.cljs |
| Layout and visibility logic | src/main/frontend/extensions/graph/pixi/logic.cljs |
| Styling | src/main/frontend/extensions/graph.css |

The renderer receives plain nodes and links. The worker emits string endpoint
ids and deduplicates links by directed endpoint pair. A later nonblank label can
replace an earlier label for the same pair, and class-extension links carry an
explicit `class-extends` edge type.

Relationship sources:

- :block/tags;
- :block/refs, lifted to owning pages where appropriate;
- user ref properties, labeled with the property title;
- :logseq.property.class/extends;
- :block/parent for page hierarchy in all-pages mode.

Global modes:

- tags-and-objects is the default;
- all-pages renders the visible page relationship graph.

tags-and-objects excludes property definitions, hidden/recycled entities,
excluded entities, and core internal tag classes. It renders tag/class nodes,
their objects, class-extension links, and visible ref-property links.

all-pages excludes hidden/recycled pages and internal property pages. Journals,
built-ins, excluded pages, and orphans are controlled by options. The large-graph
path activates at 10,000 page-name datoms, bounds visible ref links to 20,000,
then appends property, parent, and extension link tuples before applying a
20,000-link cap to the combined sequence. Because ref links come first,
structural links are not guaranteed to survive when the cap is exhausted.

The page graph centers on a page and includes references, mentions, tags, class
extensions, and selected second-order relationships. The block graph centers on
a block and connects incoming/outgoing referenced pages. Both use the same Pixi
page-mode renderer.

Renderer invariants:

- visible-node sets filter rendered nodes and links independently from the
  source graph data;
- label selection is bounded and screen-cell based to reduce overlap;
- all-pages and tags-and-objects share the Pixi renderer plumbing;
- the renderer exposes explicit visibility updates and destroys its label,
  edge-label, and application resources during cleanup.

Per-repo settings are stored under logseq.graph.settings.<repo>. They cover view
mode, selected tags, depth, link distance, grid layout, journal visibility, and
open settings groups. Time-travel cutoff is session state and is not persisted as
the graph's initial filter.

### Frontend state and UI dependencies

frontend.state remains the primary application state namespace. Focused modules
such as frontend.graph-tab own selected domains, but there is no general
src/main/frontend/state/ facade tree. Add a focused state namespace only when it
has real ownership, not to mirror a historical split plan.

The UI stack uses Base UI and Tailwind 4. Read package.json and current component
usage before changing dependency or styling conventions.

### Engineering workflow

Before changing a subsystem:

1. Read root and directory-specific AGENTS.md.
2. Locate the owning source, its callers, and its tests.
3. Confirm runtime boundaries: browser, renderer, Electron, Node worker, CLI, or
   server.
4. Write or update the narrowest behavior test.
5. Preserve one authoritative data path.
6. Fail fast on invalid internal state.
7. Remove obsolete paths instead of adding compatibility fallbacks.
8. Run focused tests before broad verification.

Useful commands:

~~~sh
# Repository lint and unit tests
bb dev:lint-and-test

# One unit test
bb dev:test -v <namespace/testcase-name>

# Already-compiled CLJS namespaces
bb dev:run-test-namespaces -n <namespace>

# CLI
(cd cli && opam exec --switch=<compatible-ocaml-switch> -- dune runtest)
pnpm cli:release
pnpm db-worker-node:release:bundle
bb -f cli-e2e/bb.edn test --skip-build

# db-sync
pnpm --dir deps/db-sync test
pnpm --dir deps/db-sync test:chatgpt-app
pnpm --dir deps/db-sync test:large-op-128m

# Agent document validation
spec-dev-tool check --all
~~~

Use docs/cli/logseq-cli.md for the current CLI command reference and generated
OpenAPI for the current semantic API contract.

## Alternatives considered

### Keep the original plans as the technical reference

Rejected because proposed steps and old file paths are indistinguishable from
current behavior during search.

### Duplicate every current source contract in prose

Rejected because exhaustive route, command, and schema duplication would become
stale quickly. This guide records durable concepts and points detailed contracts
to executable registries and tests.

## Consequences

The guide preserves useful architecture, protocol, data-flow, performance, and
debugging knowledge in one document. Historical task sequencing, temporary
benchmarks, and obsolete proposals are intentionally absent.

The guide is concise enough to read as an orientation document, but engineers
must still inspect the named source and tests before modifying behavior.
