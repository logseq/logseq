# Graph Deletion Worker Lifecycle

> Process identity update (2026-09-16):
> [Simplify Graph Lifecycle Process Management](../architecture/2026-09-16-simplify-graph-lifecycle-process-management.md)
> supersedes this document's OS birth-marker, command-line inspection, and
> unregistered-worker adoption guarantees. The current protocol uses Node PID
> existence probes and lifecycle metadata, with explicitly accepted PID reuse
> races. Historical evidence and verification results below remain unchanged.

## Current ownership contract

The SQLite ownership decision in
`docs/agent-guide/implemented/architecture/2026-09-18-replace-db-worker-lock-with-sqlite.md`
supersedes this document's JSON graph-lock, graph lock-ID, and PID-based lease
recovery requirements. New workers retain a separate local SQLite transaction;
registration and health correlate `ownership-protocol: sqlite-v1`, ticket,
generation, PID, storage, and owner. Graph deletion preserves the ownership file.
Legacy JSON readers are restricted to the sequential-upgrade retirement adapter.
The original observations and test results below remain historical evidence.

## Problem

Deleting a local DB graph must not leave a process holding its moved database,
an unusable published runtime, or a client that automatically recreates the
deleted graph. Before this change, Desktop and the shipped OCaml CLI had
different deletion and shutdown semantics.

Related issue: [logseq/db-test#1060](https://github.com/logseq/db-test/issues/1060).

### Observed evidence

The investigation on 2026-09-15 used disposable graphs, the actual CLI, and a
db-worker-node rebuilt at revision `94c218f984-dirty`. Desktop behavior was
exercised through its compiled runtime manager and shared unlink helper, whose
source maps matched the current source. The Desktop UI and cloud download flow
were not exercised.

1. CLI graph creation and worker startup succeeded.
2. `electron.db-worker/ensure-runtime!` attached to that worker with
   `:owned? false`.
3. `release-repo!` followed by `logseq.cli.common/unlink-graph!` moved the graph
   and its lock into `Unlinked graphs`, while the worker remained alive.
4. `/healthz` still returned `ready`; `server-list` retained PID `52052` and
   port `52890`; the canonical `db-worker.lock` was absent.
5. Desktop runtime reopening failed with `db-worker-node failed to start` and
   `:server-start-failed`.
6. CLI `server start` returned success, but `list page` failed with
   `Failure(graph lock missing)`.
7. CLI `server stop` removed the orphaned process and publication. Creating a
   new graph with the same name restored CLI queries and Desktop attachment.
   This verified lifecycle recovery, not restoration of the removed data.

The ordinary CLI-owned `graph remove` control succeeded without leaving a
worker. That successful case does not prove correct handling of Desktop-owned,
unresponsive, partially stopped, or concurrently starting workers. Worker logs
showed normal startup and readiness before unlinking. Test processes and the
temporary root were removed; no production source was modified.

### Pre-fix paths and gaps

| Path | Relevant behavior |
| --- | --- |
| `src/electron/electron/handler.cljs`, `:deleteGraph` | Releases the manager entry, then unlinks the graph without independently establishing worker exit. |
| `src/electron/electron/db_worker.cljs`, `ensure-repo-stopped!` | Detaches state before stopping; skips external workers; a resolved false stop result does not prevent its success return. |
| `src/main/logseq/cli/server.cljs`, `stop-server-target!` | Treats a missing canonical lock as no server and uses lock disappearance as the shutdown completion condition. Desktop still actively uses this namespace. |
| `cli/lib/graph.ml`, `execute_graph_remove` | Stops before unlinking, but treats `Server_not_found` as permission to move the directory. |
| `cli/lib/server_runtime.ml`, `stop_server` | Rejects Desktop ownership and treats disappearance from health-based discovery as shutdown completion, without proving process exit. |
| `src/main/frontend/worker/db_worker_node.cljs`, `make-stop!` | Removes publication and the lock before the process exit callback; database close failures are logged and swallowed. |
| `src/main/frontend/handler/repo.cljs`, `src/main/frontend/db/persist.cljs`, `src/main/frontend/persist_db.cljs` | Close renderer connections before deletion; recovery and other windows must not restart a worker during deletion. |

An absent health response, HTTP shutdown acknowledgement, removed publication,
or removed lock is not proof that the process has exited.

## Decision

Implemented on 2026-09-15. The following contract is shared by Desktop, CLI,
and direct worker startup.

### Required outcome and scope

The deletion contract has these requirements:

- Both Desktop deletion and CLI `graph remove` stop every worker belonging to
  the selected local graph, regardless of whether Desktop or CLI started it.
- A successful deletion leaves no graph worker or graph-owned subprocess,
  listener, live lock, runtime publication, or active client recovery loop for
  the removed graph instance.
- Shutdown and cleanup complete before moving the graph directory.

Keep the existing local removal destination, `Unlinked graphs`. Preserve graph
data, assets, backups, and diagnostic logs there. Resource cleanup does not mean
erasing recoverable data or deleting shared infrastructure. Remote graph
deletion, IndexedDB-only graphs, and global process cleanup are outside scope.

The termination policy is graceful shutdown, bounded SIGTERM, then SIGKILL for
a verified worker that remains alive. Deletion proceeds only after confirmed
exit and matching resource cleanup. No unresolved product questions remain.

### One deletion contract across both entry points

Use the same ordered contract in Desktop and the OCaml CLI:

```text
Resolve canonical root and graph identity
  -> exclude concurrent startup, creation, recovery, and deletion
  -> establish the complete set of graph workers and starting processes
  -> quiesce clients and stop graph work
  -> request shutdown and prove process exit
  -> remove only matching runtime resources
  -> move the graph directory to Unlinked graphs
  -> commit client and graph-list removal
  -> release the lifecycle exclusion
```

Use deletion-specific lifecycle operations rather than changing ordinary window
release to kill external workers. Closing a window or switching graphs retains
the existing ownership policy. Explicit graph deletion may stop workers across
owner sources, including CLI deletion of a Desktop-owned worker.

Keep one active deletion path per implementation. Reuse the current daemon
protocol and filesystem conventions across CLJS and OCaml; do not resurrect a
legacy CLI or add a compatibility route. Any shared contract extension must be
implemented by both callers and the worker together.

### Identity, discovery, and existing orphaned runtimes

- Bind deletion to canonical `root-dir` plus graph identity. The same graph
  name in another root is a different target.
- Inspect both lock ownership and server publication, including workers not
  tracked by the Desktop manager and processes still starting. Do not use only
  the first healthy matching server as the complete target set.
- Validate reported root, graph, PID, and endpoint against recorded process
  identity before shutdown or signaling. Do not guess a missing root, signal a
  reused PID, or identify a target by its executable name alone.
- A live lock owner without a responsive endpoint is unresolved, not absent.
  A published, verified graph worker without a canonical lock is still a
  shutdown target. Missing or conflicting identity must produce an explicit
  error rather than allow the directory move.
- Retain exact process identity until exit is confirmed. Do not erase the only
  management record for a process that is still alive or whose status is unknown.
- Clean stale matching metadata only after proving its process is absent.
  Remove a moved stale lock from a previously unlinked directory only when its
  graph and lock identity establish the same stopped runtime; preserve the data.
- If the canonical graph is already absent, still clean an identifiable orphan
  before returning the normal graph-absence result. Never create an empty graph
  as a side effect of cleanup.

The existing CLI startup shortcut must also reject a ready endpoint whose
canonical lock is missing or inconsistent. Do not recreate a lock to adopt a
worker whose database directory has already moved. Explicit stop/delete is the
cleanup mechanism for that invalid runtime state.

### Exclude startup races across processes

An Electron atom cannot protect deletion from another CLI process. Define a
graph-scoped lifecycle exclusion outside the directory being moved, under the
resolved root. It must be honored by Desktop, CLI, and direct worker startup.

The protocol must cover spawn registration through worker admission, not merely
the ready state. A child already spawned but not yet published must be included
in deletion's process set or prevented from becoming a graph runtime. Specify
the parent/child admission handshake when implementing this exclusion; do not
hold a parent lock while waiting for a child that must acquire the same lock.

Keep the exclusion through shutdown, resource cleanup, and the directory move.
Recheck graph existence and lifecycle state after acquiring it. Ordinary open
or recovery may not recreate a graph that deletion removed. An explicit later
create/import/download is a new operation and must acquire the same exclusion.
Invalidate pending client sessions so callbacks for the removed instance cannot
attach to a newly created graph with the same name.

Use exclusive acquisition with operation identity. Reclaim an abandoned
exclusion only when its owner is proven absent, never solely by age. A failed
or crashed deletion must leave inspectable state and support a deliberate retry.
Do not hold `server-list.lock` while awaiting worker shutdown: the worker needs
that lock to remove its own publication.

### Shutdown completion and failure semantics

1. Stop accepting new graph requests and suppress reconnect/recovery before
   shutdown. Quiesce or explicitly reject in-flight operations.
2. Request graceful shutdown. An HTTP 200 response acknowledges the request;
   it is not a completion result.
3. Close graph databases and background work; close SSE clients and the HTTP
   listener; await the OS-level exit of every verified graph process.
4. If graceful shutdown times out, send SIGTERM and wait for a bounded interval.
   If the same verified process remains alive, send SIGKILL and await confirmed
   exit within a bounded interval. Revalidate identity before each signal.
   Permission errors and unknown process status cannot count as exit.
5. Verify and clean matching metadata, then move the graph. A false result,
   rejected promise, timeout, or cleanup error must reach the caller.

Selected policy: graceful shutdown, bounded SIGTERM, then SIGKILL for each still
alive, verified graph process. Record the termination stage in diagnostics.
Forced exit permits deletion to proceed only after process exit and matching
runtime cleanup are established. Preserve database files and any required WAL
files; do not claim that a forced stop completed a graceful checkpoint.

If identity or exit still cannot be established, fail deletion, keep the graph
in its canonical location, and retain management information for any remaining
worker. Such a failed deletion does not satisfy the success contract; it must
not turn the remaining process into an untracked orphan. Never escalate against
a PID whose identity changed during the wait.

Do not swallow database close errors and report a clean deletion. If a close or
shutdown error occurs after some workers have exited, report partial progress;
leave the directory unmoved and allow retry. Do not pretend that the old client
bindings are still usable or automatically restart a worker to simulate rollback.

If metadata cleanup or the directory move fails after all workers have exited,
return the actual failure and leave the graph stopped. A retry re-evaluates
current state and must not duplicate the unlink operation or delete another
runtime's lock. Release operation resources on both success and failure.

### Resource ownership and cleanup

| Resource | Required treatment |
| --- | --- |
| Graph worker and graph-owned subprocesses | Confirm process exit; parent exit or HTTP failure alone is insufficient. Preserve unrelated workers. |
| Main SQLite, search, and client-ops databases | Close handles; complete the normal checkpoint/close path. Preserve database and required WAL files if cleanup was interrupted. Never manually delete WAL files to make a check pass. |
| Sync/import work, search builds, vector handles, timers, and queued tasks | Stop graph-scoped work through its owning cleanup paths; ensure none can recreate files or retain the worker. Do not claim that server sync/upload has completed. |
| HTTP listener and SSE subscriptions | Close sockets and subscriptions; confirm the old endpoint cannot serve graph work. |
| `db-worker.lock` | Remove only the stopped runtime's matching lock. Never unlink a successor's lock. |
| `server-list` | Remove exact stopped PID/port entries using the existing serialized atomic update protocol; preserve other graphs and release the update lock. |
| Desktop manager, renderer clients, and windows | Quiesce every attached window, clear obsolete bindings, and cancel pending recovery for the removed graph instance. |
| CLI sessions and saved selection | Finish graph requests with an explicit terminal outcome; clear any selection that still points to the removed graph. |
| Shared services, including embedding infrastructure | Release this graph's references only; keep resources used by other graphs. |
| Lifecycle exclusion | Release only this operation's ownership after a recorded outcome; leave no lock owned by a completed operation. |
| Data, assets, backups, and logs | Preserve under `Unlinked graphs`; no live runtime lock is moved with them. |

CLI deletion of a graph open in Desktop needs an explicit deletion signal or
equivalent graph lifecycle observation so Desktop cannot interpret the shutdown
as a recoverable transport failure. An SSE message alone is insufficient for
disconnected clients; admission must enforce graph absence after deletion.

### Expected implementation areas

- `src/electron/electron/handler.cljs` and `db_worker.cljs`: deletion-specific
  orchestration, correct stop-result propagation, all-window state handling.
- `src/main/logseq/cli/server.cljs` and `cli/lib/server_runtime.ml`: identical
  identity, exit, cleanup, and deletion ownership requirements.
- `cli/lib/graph.ml` and `src/main/logseq/cli/common.cljs`: unlink only after
  shutdown and cleanup have been established under lifecycle exclusion.
- `src/main/frontend/worker/db_worker_node.cljs`, `db_worker_node_lock.cljs`,
  `db_core.cljs`, and `src/main/logseq/db_worker/server_list.cljs`: admission,
  shutdown completion, scoped resource cleanup, and identity-safe metadata.
- Renderer persistence and graph removal paths: quiescence, deletion results,
  other-window invalidation, and recovery suppression.

Inventory existing cleanup ownership before adding helpers. Reuse the worker's
current close path, and add missing cleanup there rather than duplicating it in
Desktop and CLI. Do not perform an unrelated namespace migration or add graph
schema properties. Load the repository i18n skill before implementing any new
UI messages; reuse existing error transport and output envelopes.

## Alternatives considered

### Refuse deletion of all externally owned workers

This avoids the immediate Desktop bug but leaves Desktop and CLI with different
capabilities. The requested deletion contract includes stopping the selected
graph's worker across both ownership directions. Ownership remains relevant to
ordinary stop/release operations, not to rejecting explicit graph deletion.

### Stop through the current release or stop functions unchanged

Rejected: release skips external workers; stop uses missing health or lock state
as a success signal and cannot guarantee process exit. Neither closes the
concurrent startup window.

### Move first, then stop or repair publication later

Rejected: this creates the reported orphan state and permits writes against a
directory whose canonical lock is gone. Cleanup must precede the move.

### Recreate the missing lock or silently adopt the published server

Rejected: metadata repair does not restore the worker's database path or prove
valid ownership. Invalid runtime state must fail explicitly and be stopped.

### Kill all Node/Electron processes or clear the complete server list

Rejected: unrelated graphs, Desktop instances, and shared services are outside
the deletion target. Cleanup must use verified graph and process identities.

## Consequences

### Success invariants

- Before directory movement, every graph worker and graph-owned subprocess is
  proven exited. HTTP disappearance or metadata removal alone never satisfies
  this condition.
- After success, the canonical graph is absent; the preserved directory has no
  live worker lock; matching publication, listener, and active client bindings
  are gone; unrelated graphs remain operational.
- No pending Desktop recovery, CLI request, or startup can recreate the removed
  graph. An explicit new graph operation can subsequently succeed.
- Both entry points enforce these conditions with CLI-owned and Desktop-owned
  workers, using identical root and graph identity rules.
- Errors are reported as failures, including consistent nonzero CLI exit and
  human/JSON/EDN outcomes; no success notification precedes completion.

### Required regression matrix

| Case | Expected result |
| --- | --- |
| Desktop delete with CLI worker, attached or untracked | Worker exit and resource cleanup precede unlink. |
| CLI remove with Desktop worker, including multiple windows | Worker exits; all windows stop recovery; graph is not recreated. |
| Each entry point deleting its own worker | Same invariants; no ownership-specific shortcut. |
| Healthy graph without a worker | Removal succeeds without starting a worker. |
| Missing lock with a live published worker | Stop the verified orphan; clean matching publication; no false absence result. |
| Canonical graph absent but verified orphan remains | Clean the orphan without creating a graph; return the graph-absence outcome explicitly. |
| Lock owner alive but health endpoint unavailable | Establish identity and exit or fail without moving the directory. |
| HTTP shutdown acknowledged, publication/lock gone, process still alive | Deletion remains pending or fails; no early success or unlink. |
| Worker survives graceful shutdown and SIGTERM | Signal SIGKILL only after identity revalidation; await exit, clean metadata, preserve required WAL files, then unlink. |
| SIGKILL denied, target identity changes, or exit remains unknown | Fail without unlinking; keep accurate management records; never signal a replacement process. |
| Graceful shutdown, signal, close, cleanup, or rename failure | Preserve data and accurate partial state; explicit failure; retry is safe. |
| Concurrent CLI start, direct worker startup, Desktop recovery, and deletion | No process escapes admission tracking; no worker writes into the moved graph. |
| Concurrent deletions and deleter crash | One serialized outcome; safe retry; no permanent exclusion owned by an absent process. |
| Same graph name in another root; another active graph in the same root | Their PIDs, lock files, publication, and queries remain unchanged. |
| PID/lock replacement during cleanup | No signal or lock removal targets a successor or unrelated process. |
| Active sync/import/SSE work during removal | Graph-scoped resources end; no later writes recreate canonical files. |
| Plain window close or graph switch | External worker remains available under the ordinary ownership policy. |
| Explicit create/open after completed deletion | A new runtime uses a new valid lock and serves queries successfully. |

Use small unit tests for stop-result propagation, identity checks, cleanup
ordering, and failure states. Add real process tests that keep a PID alive after
publication disappears; a mocked `server-not-found` result cannot prove the fix.
Use deterministic barriers for race tests rather than relying only on sleeps.

Re-run the issue reproduction against fresh CLI and worker builds, then verify
both ownership directions. Desktop UI coverage belongs in `clj-e2e/`; CLI
command/process coverage belongs in `cli-e2e/`. Validate logs, exact PID exit,
lock/publication cleanup, unaffected-graph queries, and reopen behavior. Run
`bb dev:lint-and-test` and the CLI non-sync suite before submitting the fix;
include focused Desktop lifecycle and active-sync cleanup coverage. Reuse
compiled CLJS tests when their sources have not changed.

### Implementation worklist

- [x] Add real-process regression cases and confirm failures in deletion behavior.
- [x] Implement graph-scoped lifecycle exclusion, process identity, and spawn admission.
- [x] Integrate worker admission, quiescence, shutdown outcomes, and cleanup.
- [x] Integrate Desktop and OCaml CLI deletion and explicit creation.
- [x] Invalidate all Desktop clients and pending recovery for the removed instance.
- [x] Verify the regression matrix, lint/unit tests, CLI non-sync suite, and Desktop UI.
- [x] Record evidence and transition this decision to implemented.

The shared Node lifecycle component uses a graph-scoped SQLite transaction
outside the graph directory for OS-backed exclusion. An operation owner record
identifies the lease holder; an abandoned owner can be replaced only after its
recorded process has exited. Durable JSON state records graph generation,
deletion outcome, and registered processes independently of the transaction.
SQLite handles cross-process exclusion and releases the OS lock on process exit;
the application does not reclaim a lease based on elapsed time.

A parent acquires the exclusion, starts a child with an admission ticket, records
its OS process identity and generation, then releases the exclusion before
waiting for readiness. The child acquires the same exclusion, validates its
ticket and generation, and only then opens graph resources. Direct startup must
pass admission before it creates files. Deletion invalidates the generation and
includes registered starting children before requesting shutdown. Explicit
create/import/download establishes a new generation under the same exclusion.

The component is shared by CLJS and the OCaml Node platform adapter so the
filesystem protocol, process-exit checks, and escalation cannot drift between
the two deletion entry points. Existing worker database cleanup remains in CLJS.
Runtime publication continues using the existing serialized `server-list`
protocol, whose lock is never held while waiting for a worker.

## Implementation evidence (2026-09-15)

### Shared protocol and resource ownership

`deps/graph-lifecycle/index.cjs` is the Node-only CommonJS implementation used by
Electron, the OCaml CLI platform adapter, and the worker. It records OS process
birth and command identity, serializes operations with SQLite outside the graph,
and retains process records until exit and exact lock/publication cleanup.
The CLI `.mli` changes expose lifecycle results, generation, and the deletion
commit callback. Both callers complete client/config removal while holding the
same exclusion. Obsolete PID-only daemon termination and lock recreation paths
have been removed.

Worker shutdown rejects new requests, drains admitted requests, closes sync and
SSE, and attempts every database/vector/import cleanup even when one close fails.
It reports close failures to the supervisor before exiting. The supervisor waits
for OS exit before removing matching metadata or moving data. Sync download
reset preserves the canonical lock throughout database replacement.

The current Node graph worker does not spawn graph-owned child processes.
`src/main/frontend/worker/` contains no child-process spawn path; shared embedding
processes are owned by `src/electron/electron/embedding_server.cljs` and remain
outside graph deletion. Worker exit releases graph-local threads, sockets,
timers, and queued work; retained WAL files remain part of the preserved data.

### Before and after

The original runtime-manager reproduction is recorded above. The added real CLI
regression suite initially failed five cases, including cross-owner deletion
and published orphans. After implementation, its seven cases pass against the
shipped CLI and freshly compiled worker.

Native Desktop verification used the Electron main and renderer REPLs plus the
actual UI, with an isolated graph root and Electron profile:

1. Open `lifecycle-desktop` in Desktop and confirm its manager owns the worker.
2. Run CLI `graph remove` against that exact root. The command exits zero, the
   old PID `55538` is absent, the renderer reports no current repo or remote
   client, and the UI shows the graph selector. Publication is empty and data
   is preserved without a worker lock.
3. Explicitly recreate and start the same graph with the CLI. Desktop attaches
   with `:owned? false` and a new generation/lock.
4. Open a second Desktop window and confirm both window IDs share that runtime.
   Delete through All graphs → Delete local graph → Confirm. Both bindings are
   invalidated; the manager reports `:repos {}` and `:window->repo {}`. The
   lifecycle phase is `deleted`, workers are empty, publication is empty, and
   both preserved directories contain no `db-worker.lock`.

This exercise also caught an IPC serialization error from returning an observer
function; runtime IPC now returns only serializable connection fields. Late
notifications carry the old generation so they cannot detach a recreated graph.
The isolated Desktop profile, graph root, and supervised development processes
were removed after verification. The Desktop check was manual native UI coverage. The existing `clj-e2e/` runner
is browser-only; no automated Electron harness was added.

### Regression coverage and verification

- Real CLI process suite: 7 cases covering ownership, orphan cleanup, absent
  graphs, output modes, and unaffected graphs/roots.
- Shared protocol process suite: 15 cases covering misleading shutdown
  acknowledgement, forced termination, SIGKILL denial, identity replacement,
  cleanup/rename/close failure, crash recovery, concurrent deletion, admission
  barriers, moved orphan locks, and commit exclusion.
- CLI non-sync suite: 92 passed, 0 failed, including both process suites.
- OCaml unit suite: 234 passed, 0 failed; CLI bundle rebuilt successfully.
- Active sync deletion: two live peers and an open SSE stream; deletion closes
  the stream and worker, preserves the database, removes lock/publication, and
  leaves the other peer connected. Sync bootstrap upload/download also passes.
- `bb dev:lint-and-test` passes, including all configured linters and the full
  CLJS unit run: 2,059 tests and 8,202 assertions. `bb lang:lint-hardcoded`
  also passes. `spec-dev-tool check --all` validates the decision records.
- Focused CLJS tests cover manager stop failure, pending recovery and old
  generations, renderer cleanup, worker/database close errors, and lock
  preservation during sync reset.
- CommonJS/ESM scan accepts the new module from root and Electron resource
  package roots. The module is Node-only and does not enter browser bundles.

Real process and Desktop runs used macOS. Linux and Windows process-inspection
branches were not exercised on their native operating systems. Remote graph
deletion and the complete cloud sync suite remain outside this change's scope.

## Review corrections (2026-09-15)

Follow-up review exposed five gaps in the initial implementation. Regression
checks reproduced each failure before correction:

- Independent `cli/` and `resources/` frozen installs rejected their stale
  lockfiles. Both lockfiles are now regenerated and verified with
  `--ignore-workspace --frozen-lockfile --ignore-scripts`, including fresh
  temporary install directories.
- Desktop SQLite/ZIP import and initial sync download now call `createGraph`
  before obtaining a remote runtime and pass its generation through the open
  request. Ordinary open/recovery retains the existing admission requirement.
- Both Electron's runtime cache and the renderer's client cache reject an
  explicitly requested generation that differs from the cached instance.
- Window release assigns the last-window stop synchronously before yielding.
  A stopping runtime remains tracked until stop succeeds; a new open waits for
  that result. Duplicate releases do not acquire a second stop responsibility,
  and a failed stop retains the runtime for explicit retry.
- macOS `ps` can report the same process birth marker with `?Es (node)` during
  exit. This state remains alive for bounded waiting, without further signals.
  A changed birth marker still fails identity verification. Persistent exiting
  state times out without moving the graph or removing its management record.

The focused renderer/manager run passes 69 tests with 251 assertions, including
real-worker fresh import/download, concurrent two-window release, stale-cache
rejection, OS exit, and reopen. The process protocol suite passes all 18 cases.
The complete lint/unit run passes 2,066 tests with 8,214 assertions; targeted
lint also covers the subsequently added integration tests. These follow-up
checks exercise the renderer persistence and manager modules directly against
real workers; native Desktop file dialogs were not rerun.

## Risks

- Deletion intentionally interrupts other clients using the same local graph.
  All affected Desktop windows must reflect that outcome accurately.
- Forced termination can interrupt checkpoints and leave recovery work in WAL
  files. Never equate process exit with successful graceful database closure.
- Startup exclusion must cover both languages and direct daemon startup. A
  partial rollout would retain the race; no mixed-protocol compatibility layer
  is planned.
- Suppressing only the initiating window's recovery leaves other windows or
  disconnected clients able to recreate the graph. Admission checks are part
  of this fix, not optional UI polish.
- No application can guarantee termination when the OS denies permission or
  cannot establish process identity. The guarantee is that deletion cannot
  succeed or move the graph in that state, and remaining workers stay tracked.
- Shared services and data files must not be mistaken for disposable runtime
  resources. Aggressive global cleanup would exceed the requested scope.
