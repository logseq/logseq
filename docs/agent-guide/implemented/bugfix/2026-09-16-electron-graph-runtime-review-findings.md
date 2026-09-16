# Electron Graph Runtime Review Findings and Lifecycle File Simplification

## Problem

The review of all uncommitted changes on 2026-09-15 confirmed three P2
(Important) issues in Electron graph runtime management that existing tests
did not cover. The user accepted the corrections and lifecycle metadata
simplification on 2026-09-16. All four accepted changes are implemented and
verified. The metadata decision came from read/write analysis rather than a
fourth reproduced runtime defect.

Related decisions:

- [Graph Deletion Worker Lifecycle](../../implemented/bugfix/2026-09-15-graph-deletion-worker-lifecycle.md)
- [Graph Lifecycle Review Followups](../../implemented/bugfix/2026-09-15-graph-lifecycle-review-followups.md)

Source line numbers in the findings refer to the working tree at review time.

### 1. Concurrent graph starts share another request's generation

- Priority: P2 / Important.
- Category: Failure mode.
- Location: `src/electron/electron/db_worker.cljs:294-296`;
  `start-managed-daemon!` at lines 261-264.

`ensure-runtime!` writes each request's options into the global
`*runtime-opts` atom. `ensure-started!` yields through `p/let` before calling
`start-daemon!`, which later reads that atom. A second request can replace the
first request's graph-specific `:generation` before it is consumed.

Reproduction using the actual compiled Electron namespaces and real worker:

1. Create two graphs in a disposable storage root and retain their different
   generations returned by `lifecycle.createGraph`.
2. Call `ensure-runtime!` concurrently for separate window IDs, passing the
   corresponding generation and root directory in each options map.
3. Collect both results with `Promise.allSettled`.

```javascript
Promise.allSettled(
  graphs.map((graph, index) =>
    electron.db_worker.ensure_runtime_BANG_.call(
      null, 'logseq_db_' + graph, index + 1, options[index]
    )
  )
)
```

Here `options[index]` is a ClojureScript map containing `:root-dir` and that
graph's `:generation`. The observed result was:

```json
[
  {"graph":"review-a","status":"rejected","error":"Graph generation changed"},
  {"graph":"review-b","status":"fulfilled"}
]
```

No existing worker or graph switch was required. Multi-window creation,
import, download, or recovery can therefore reject a valid graph instance.

### 2. Inherited embedding configuration bypasses the Desktop setting

- Priority: P2 / Important.
- Category: Regression.
- Location: `deps/graph-lifecycle/index.cjs:581-582`.

The new spawn path copies the complete parent environment. The previous
`logseq.db-worker.daemon/spawn-server!` implementation removed
`LOGSEQ_EMBEDDINGS_URL` for Electron workers when no explicit embedding
endpoint was supplied.

`electron.handler/:db-worker-runtime` supplies an endpoint only when Desktop
semantic search is enabled. Without the old filtering, the Node platform's
environment lookup can enable embeddings even when that setting is disabled.

Reproduction with the actual `static/db-worker-node.js`:

1. Set the probe parent's `LOGSEQ_EMBEDDINGS_URL` to
   `http://127.0.0.1:9/review-embedding`.
2. Create a disposable graph and start it through `lifecycle.startGraph` with
   `owner: "electron"`, without any embedding arguments.
3. Read the graph's worker log, then stop the worker and remove the temporary
   data.

The worker became ready and logged:

```clojure
:vector-embedding-enabled? true
:embedding-endpoint "http://127.0.0.1:9/review-embedding"
```

This confirms unexpected activation. The indexing code path can send block
text to that endpoint; the probe used an unavailable loopback endpoint and
did not demonstrate a successful transfer of text. Users can incur unwanted
indexing, connection failures, or requests despite disabling the feature.

### 3. Worker recovery retains the previous lifecycle observer

- Priority: P2 / Important.
- Category: Performance.
- Location: `src/electron/electron/db_worker.cljs:167-178`;
  `deps/graph-lifecycle/index.cjs:616-634`.

Each `start-managed-daemon!` creates a filesystem watcher and a 250 ms polling
interval through `lifecycle.observe`. The unhealthy-runtime branch replaces
the runtime without invoking the old runtime's `:close-observer!`.

Ordinary worker stop and restart preserve the graph's generation and
`"available"` phase. The old observer therefore does not close itself. A
later window release closes only the observer stored on the latest runtime.

Reproduction with compiled Electron namespaces and a real worker:

1. Open a disposable graph through `ensure-runtime!`.
2. Terminate its worker with `SIGKILL` and wait for exit.
3. Call `ensure-runtime!` again to recover the graph.
4. Call `release-window!`.
5. Instrument `fs.watch` creation and watcher closure in the probe process.

Observed counts:

```json
{"afterRecovery":{"opened":2,"closed":0}}
{"afterRelease":{"opened":2,"closed":1},"state":"available"}
```

Each recovery retains another watcher, interval, and callback/configuration
references. Each leaked interval continues synchronous reads of `state.json`
four times per second, including after the graph window is closed.

### 4. Simplify the per-graph lifecycle metadata files

Before consolidation, the per-graph directory under `.graph-lifecycle/<store-id>/`
used five application-managed file categories. Their roles differ, so reducing
file count must preserve the coordination protocol.

| File | Original role | Accepted direction |
| --- | --- | --- |
| `termination-<ticket>.json` | Records termination identity and stage in `terminate`; no production reader or cleanup path was found. | Remove the separate diagnostic file; record stop stages in logs. |
| `owner.json` | Stores lease owner identity and operation; `acquireLease` checks the previous owner and verifies ownership on release. | Store these fields in `state.json`, preserving the checks. |
| `runtime-<ticket>.json` | Publishes worker readiness, port, lock identity, and close result; read by discovery, readiness, and cleanup. | Retain the independent publication channel. |
| `state.json` | Stores graph generation, phase, admitted workers, and deletion recovery state. | Retain. |
| `lease.sqlite` | Provides cross-process exclusion through `BEGIN IMMEDIATE`. | Retain; ordinary JSON writes do not replace this lock. |

Relevant paths in `deps/graph-lifecycle/index.cjs` are `acquireLease`
(lines 141-180), `publish` / `recordStop` (lines 231-251), the termination
stage write (line 423), and `cleanup` / `stopUnderLease` (lines 436-476).

The runtime publication channel has a necessary independence: a deletion
process holds the lifecycle lease while waiting for the worker to exit, and
the worker still needs to publish its close result. Moving that publication
behind the same lease can make each process wait for the other. Writing it
into `state.json` without exclusion instead risks overwriting lifecycle state.

The implemented layout has three application-managed file categories:

```text
.graph-lifecycle/<store-id>/<encoded-graph>/
├── state.json
├── lease.sqlite
└── runtime-<ticket>.json
```

There may be multiple runtime tickets, and SQLite or atomic writes may create
temporary sidecar files; this is a target for logical file categories, not an
invariant that exactly three physical files exist at every instant. Validation
of owner merging is recorded in the implementation results below.

### Simplification audit on 2026-09-16

Scope: the lifecycle responsibilities added by the uncommitted changes,
including their CLI, Electron, worker, and renderer consumers. Generated
bundles and dependency lockfiles are integration evidence, not cleanup targets.

The existing metadata exploration owns the durable file-count decision; no
separate decision document is needed. The following smaller candidates are
local cleanup and do not require a new architectural decision:

- `acquireLease` creates `lease(id INTEGER PRIMARY KEY)` but never reads or
  writes a row. The lock is acquired by `BEGIN IMMEDIATE` before the table is
  created. An isolated Node SQLite probe with two processes and no tables
  returned `SQLITE_BUSY` (error code 5) while the first transaction was held,
  then acquired successfully after commit. Remove the unused table creation
  while retaining the SQLite file and transaction. Before shipping, rerun
  concurrent acquisition and crashed-owner recovery tests with this change.
- `deleteGraph` writes the destination to both `current.destination` and
  `current.deletion.destination`. Recovery and the returned deletion result
  use the latter. The top-level copy is consumed only by the CLI and protocol
  retry tests. Keep the nested field as the sole source of
  truth and update that assertion; preserve the public result's `destination`.
  Verify failed-client-commit retry and crash-after-rename recovery.

Consumer searches covered production source, tests, fixtures, scripts, and
repository decision documents. No supported external contract for the unused
table or duplicate top-level field was found. The local package is private;
generated bundles mirror its implementation rather than introduce consumers.

Removing `*runtime-opts` is already owned by correction 1: it eliminates shared
argument transport and fixes behavior, so it is not a separate behavior-preserving
simplification. Observer retirement belongs to correction 3 for the same reason.

Retain graph generation, admission tickets, and process birth identity: they
distinguish recreated graphs, registered starting workers, and reused PIDs.
Retain the independent runtime publication channel and shared package. Removing
them would lose a required protocol boundary or duplicate implementation across
OCaml and CLJS. Do not remove the lifecycle-directory identity check merely
because its value is derived, or choose between filesystem notifications and
polling without platform evidence. Owner-file merging required concurrency and crash-recovery validation,
as described above.

No production code was changed during the discovery audit. The SQLite probe establishes the
lock primitive's behavior on this host; it does not validate a lifecycle patch
or Windows/Linux behavior. Termination diagnostics must remain observable in
logs if the standalone files are removed.

### Verification context

The review used disposable graphs and cleaned up its workers and temporary
files. Electron probes used Electron 42.3.0 on macOS arm64, loading compiled
main-process namespaces without opening the normal Desktop UI. The loader
pattern is available in `cli-e2e/scripts/graph_lifecycle_electron_test.cjs`.

The following checks passed during the review, independently of the failures
reproduced above:

- `node --test cli-e2e/scripts/graph_lifecycle_protocol_test.cjs
  cli-e2e/scripts/graph_lifecycle_cli_test.cjs`: 32 tests.
- Related compiled CLJS suites: 320 tests, 1,563 assertions, no failures or
  errors, using `LOGSEQ_STABLE_IDENTS=1 node static/tests.js -r <selection>`.
- Standalone Electron custom-directory, alias, stop/reopen, and deletion
  scenario.
- CommonJS/ESM loading checks, changed-file i18n lint,
  `spec-dev-tool check --all`, and `git diff --check`.

The full Desktop UI journey, complete sync suite, and native Linux/Windows
behavior were not verified. No database schema, persisted graph attribute,
built-in property, or D1 change is indicated by these three corrections.

## Decision

The user accepted all four directions on 2026-09-16. Implementation follows
this scope:

1. Carry immutable, per-call options through `ensure-started!`, `start-daemon!`,
   and `start-managed-daemon!`. Remove `*runtime-opts` as an argument transport.
   Preserve the generation check and bind it to the originating request.
2. Make Electron's explicit embedding configuration authoritative at spawn.
   When an Electron caller supplies no endpoint, omit inherited
   `LOGSEQ_EMBEDDINGS_URL`. Preserve the existing CLI environment behavior and
   explicit endpoint support.
3. Give each observer a clear runtime owner. Release the old observer when its
   runtime is retired during recovery, and release a newly created observer
   if its runtime cannot be installed. Audit `stop-all!` and invalidation for
   the same ownership invariant, while preserving deletion notifications.
4. Simplify lifecycle metadata in one implementation and verification pass:
   - Remove `termination-<ticket>.json` production writes and emit equivalent
     diagnostic logs with graph, ticket, process identity, and stop stage.
   - Merge lease owner metadata into `state.json`. Initialize
     and update it while holding the SQLite lease, retain process identity
     and ownership checks, and ensure every graph-state rewrite preserves the
     active owner. Release must clear only the matching owner from the latest
     state, without overwriting newer worker or deletion information.
   - Keep `runtime-<ticket>.json` independently writable during shutdown, with
     its existing identity validation, close-error reporting, and cleanup.

Add focused regression tests and repeat the three runtime probes. Keep the
work within Electron management, shared lifecycle coordination/spawning, and
their tests. Add process tests for the metadata changes; prior passing runtime
checks do not validate owner merging. Remove obsolete production paths without
adding compatibility readers, fallbacks, or metadata migrations.

## Alternatives considered

### Serialize every Electron start globally

This would hide options races if all paths obeyed the queue, but introduces
unnecessary coupling between independent graphs. Passing options explicitly
addresses the source of the race without delaying unrelated starts.

### Remove generation validation

This would suppress the observed error while allowing stale requests to
attach to recreated graphs. The generation boundary is necessary; its input
must remain associated with the correct request.

### Remove the embedding environment variable for every owner

This would also disable existing CLI configuration. Restricting the change to
Electron without an explicit endpoint restores the previous Desktop behavior
without changing CLI semantics.

### Let observers expire only on graph deletion

This does not bound resource use across ordinary worker recovery or graph
switching. Observer cleanup should follow runtime ownership, with explicit
handling for observers retained to deliver deletion completion.

### Keep all five lifecycle file categories

This avoids changing lease metadata, but leaves diagnostic files accumulating
without a production consumer or cleanup path. The accepted change removes the diagnostic files and merges owner metadata
together, with concurrency and crash-recovery coverage for the owner merge.

### Merge all metadata into one JSON file

This conflates supervisor-owned graph state with worker publication during
shutdown. Requiring the same lease for both creates a waiting cycle; allowing
unlocked writes creates lost-update races. Keep the runtime publication
channel independent.

### Replace SQLite exclusion with an owner field in JSON

An owner record describes ownership but does not itself provide atomic
cross-process exclusion or OS-released locking after a crash. Owner metadata
merging must retain the SQLite lease.

## Acceptance criteria

- Concurrent starts of two independent graphs with different generations both
  succeed and return their own generations. Include a case that waits for a
  previous runtime to stop before starting the replacement.
- A genuinely stale generation remains rejected after graph deletion and
  recreation; fixing the race does not weaken instance isolation.
- An Electron worker without an explicit endpoint has embeddings disabled
  even when the parent environment defines `LOGSEQ_EMBEDDINGS_URL`.
- Explicit Electron embedding endpoints and CLI environment configuration
  continue to work according to their existing contracts.
- Repeated worker recovery leaves exactly one active observer per managed
  runtime. Releasing the final window leaves no observer or polling interval
  for that retired runtime.
- Failed or invalidated recovery does not leak an observer, and graph deletion
  still delivers the lifecycle events required by renderer invalidation.
- Regression tests fail before the changes and pass afterward. Repeat real
  Electron/worker probes and relevant manager, lifecycle, and CLI checks,
  documenting any unverified platform or UI paths.
- Fresh lifecycle operations produce no standalone `termination-<ticket>.json`
  files, while diagnostic logs retain enough context to distinguish graceful
  shutdown, `SIGTERM`, and `SIGKILL` stages.
- Normal operations no longer create
  `owner.json`; `state.json` retains the owner identity and operation while
  the SQLite lease is held and removes only the matching owner on release.
- Concurrent starts, stops, and deletes remain mutually exclusive. Owner
  updates cannot overwrite graph generation, worker records, or a persisted
  deletion move/commit operation.
- Process tests cover crashes after lease acquisition, after owner publication,
  during graph-state writes, and during release. Recovery preserves process
  identity checks and resumes deletion without moving data twice.
- A worker can publish success or failure of resource closure while the
  deletion process holds the lease; the supervisor observes that result,
  confirms exit, and cleans only matching runtime records without deadlock.
- Repeated start/stop/delete cycles do not accumulate new diagnostic files or
  successfully retired runtime records. Count application-managed metadata
  separately from SQLite and atomic-write temporary files.

## Risks

- Changing the manager dependency's startup signature requires updating all
  callers and test fixtures; partial conversion can silently omit options.
- Clearing an observer too early can lose deletion-completion notifications.
  Observer retirement must distinguish replacement from intentional retention
  during an active deletion.
- Cleanup must not close a successor runtime's observer when an older async
  request finishes late.
- Embedding configuration tests must cover both owners and explicit endpoints
  so a Desktop correction does not disable legitimate CLI configuration.
- Existing passing suites do not establish correctness for these scenarios;
  runtime evidence must accompany the new focused regressions.
- Adding owner metadata to `state.json` changes its initialization and every
  full-state rewrite. A stale snapshot can erase the active owner; clearing
  ownership from a stale snapshot can erase newer deletion or worker state.
- Owner writes will trigger existing `state.json` observers more often. They
  must not be interpreted as graph deletion, generation changes, or failures.
- Removing termination files reduces persistent diagnostic breadcrumbs;
  replacement logs must remain available to diagnose failed shutdowns.
- The three-category target must not force runtime close publication to wait
  for a lease held by the process waiting for that worker to exit.

## Implementation

All four accepted directions are implemented. Termination logging and owner
metadata consolidation were delivered together; the three Electron runtime
corrections are now complete as well. No compatibility readers, fallback
metadata files, or migrations were introduced.

### Electron runtime corrections

Implemented in `src/electron/electron/db_worker.cljs` and
`deps/graph-lifecycle/index.cjs`:

- `ensure-runtime!` passes its immutable options map through `ensure-started!`
  into `start-daemon!` and `start-managed-daemon!`. The global `*runtime-opts`
  atom is removed. Waiting for another runtime to stop preserves the original
  options. Electron's managed start explicitly sets its owner to Electron.
- Electron spawn removes inherited `LOGSEQ_EMBEDDINGS_URL` when no explicit
  `--embedding-endpoint` is present. CLI environment configuration and explicit
  endpoints retain their behavior.
- Recovery closes the retired runtime's observer before starting its
  replacement. A shared installation path closes a displaced observer and
  closes a newly returned observer if lifecycle invalidation prevents
  installation. Cleanup acts on the captured runtime, preserving a successor
  installed after invalidation.
- `stop-all!` reuses graph-specific stopping, closes observers for successfully
  retired owned and external runtimes, and retains failed stops for retry.
  A late graph-stop completion detaches only the runtime it actually stopped.
- Observers intentionally retained during `deleting` continue to deliver
  terminal lifecycle notifications and then close themselves.

Validation on macOS arm64 with Node 22.21.1 and Electron 42.3.0:

- Before the patch, six new manager regressions produced nine failed
  assertions covering missing per-request options, retired observers,
  invalidated initial/recovery starts, and incomplete stop-all handling.
  All 31 manager tests now pass with 82 assertions.
- The four real-worker embedding cases initially had one failure: Electron
  without an explicit endpoint enabled embeddings from the parent environment.
  All four now pass. Logs confirm disabled embeddings for that case and the
  intended endpoint for explicit Electron, inherited CLI, and explicit CLI
  configuration. Only unavailable loopback endpoints were used.
- The actual compiled Electron namespaces and real worker pass the expanded
  `cli-e2e/scripts/graph_lifecycle_electron_test.cjs`: concurrent graphs return
  their own generations; two successive crash/recovery cycles each retain one
  watcher and one 250 ms interval; final release leaves zero of each. Deletion
  emits both `deleting` and `deleted`, releases its observer, rejects an old
  generation after recreation, and supports reopening and stop-all cleanup.
  Existing custom-directory, alias, stop/reopen, and sibling-preservation
  checks also pass. Watcher closure and interval cancellation are measured
  at the actual resource APIs, including internal observer self-closure.
- `node --test cli-e2e/scripts/graph_lifecycle_protocol_test.cjs`: 45 passed,
  including all metadata concurrency/crash cases recorded below and the four
  embedding cases.
- `node --test cli-e2e/scripts/graph_lifecycle_cli_test.cjs`: 3 passed against
  the refreshed CLI bundle and real worker.
- `clojure -M:test compile test electron`: both builds completed without
  warnings. The related compiled CLJS selection passed 157 tests and 672
  assertions: Electron manager, renderer persistence, worker/lock, and CLI
  common/server/daemon.
- `bb lint:kondo-git-changes`: zero errors and warnings across the uncommitted
  CLJS changes. `git diff --check` and `spec-dev-tool check --all` passed.

The private file dependency was refreshed in root, CLI, and resources installs;
all consumer resolutions, including static, match the source package. The
existing Vite action rebuilt the CLI from `cli/_build/default`, then
`scripts/stage-cli-runtime.mjs` staged it. Inspection confirmed the final
bundle includes the embedding filter and consolidated metadata implementation.

The two smaller audit candidates (unused lease table and duplicate top-level
destination) were accepted in the follow-up below.

## Metadata implementation results

Implemented on 2026-09-16 in `deps/graph-lifecycle/index.cjs`:

- `acquireLease` reads and publishes `state.owner` while holding the existing
  SQLite transaction. It retains the process identity and live-owner checks.
- Graph recreation carries the active owner into its replacement state.
- Release reads the latest state, verifies the operation ID, removes only its
  matching owner, and writes back that latest state before releasing SQLite.
  An ownership mismatch fails without overwriting the replacement state, while
  still closing the SQLite transaction.
- Termination writes structured `[graph-lifecycle]` records to stderr with
  graph/storage, generation, ticket, process identity, and stop stage.
  Machine-readable CLI stdout is unchanged. Diagnostics follow the invoking
  process's stderr capture; the package creates no separate diagnostic file.
- Worker runtime readiness and close-result publication remain independent of
  the supervisor's lease. No legacy metadata reader, fallback, or migration
  was added. Existing old diagnostic files are not swept from user graphs.

Validation on macOS with Node 22.21.1 and Electron 42.3.0:

- Red phase: 11 failures among 14 selected tests established absent embedded
  ownership, missing ownership checks, old metadata files, and missing stage
  logs. The same selection passed after implementation.
- `node --test cli-e2e/scripts/graph_lifecycle_protocol_test.cjs`: 41 passed.
  Covers five crash boundaries (after SQLite acquisition, owner publication,
  during state replacement, before release publication, and after release
  publication), latest-state preservation, live/reused identity rejection,
  owner replacement, observer stability, and close-error publication while
  deletion holds the lease. Existing concurrent startup/deletion, move-intent,
  and client-commit retry tests also passed.
- `node --test cli-e2e/scripts/graph_lifecycle_cli_test.cjs`: 3 passed against
  the refreshed CLI bundle and the real worker.
- `static/node_modules/.bin/electron
  cli-e2e/scripts/graph_lifecycle_electron_test.cjs`: custom directory, symlink
  alias reuse, stop/reopen, deletion, and sibling worker preservation passed.
- Existing compiled CLJS suites for the Electron manager, renderer persistence,
  worker/lock, and CLI common/server/daemon: 151 tests and 655 assertions passed
  using `LOGSEQ_STABLE_IDENTS=1 node static/tests.js -r <selection>`. CLJS source
  was unchanged, so the compiled test artifact was reused with the refreshed
  lifecycle dependency.
- Repeated graceful and forced-stop cycles retained the three termination
  stages in stderr and left only `state.json` among lifecycle JSON files.

The local file dependency was refreshed in each consumer. Dune's incremental
bundle command did not regenerate the changed dependency, so the existing
Vite bundle action was run directly from `cli/_build/default`, followed by
`scripts/stage-cli-runtime.mjs`. The staged CLI was checked for the new logger
and absence of the old owner-file path before runtime tests. No Dune files
were changed.

Native Windows/Linux runs, full Desktop UI, and the full sync suite were not
run for this metadata change. The table and duplicate-destination candidates
from the audit are addressed in the follow-up below.

## Metadata cleanup follow-up on 2026-09-16

The user accepted three additional review findings: retire runtime publications
after crash recovery, remove the unused lease table, and remove the duplicate
top-level deletion destination. These are local changes to the existing protocol;
no new lifecycle state, compatibility reader, or migration is required.

Runtime publication deletion now belongs to the shared `cleanup` function,
after process exit, matching lock/publication cleanup, and close-error handling
have all succeeded. Both restart and ordinary stop therefore retire the same
ticket files. A failed cleanup still retains the close result for retry; the
replacement worker's publication is not a cleanup target.

Lease acquisition retains `BEGIN IMMEDIATE` and owner identity verification,
without creating an unused table. Deletion retains only
`state.deletion.destination`; callers still receive `result.destination`.
Configuration retry tests read the nested persisted destination.

Regression coverage uses real workers and isolated storage:

- CLI recovery repeats three crash/restart cycles, checks that only the current
  runtime publication remains, and verifies that both final stop and graph
  removal leave no runtime publications.
- A worker close error preserves its publication after the failed stop. A
  subsequent start retires that old publication and preserves the replacement.
- Existing concurrent lease, crashed-owner recovery, failed client commit, and
  crash-after-rename tests cover the preserved coordination behavior.

Before the fix, both CLI cases retained two runtime publications after the first
recovery, and the close-error retry retained the old publication. All three new
tests failed on those assertions. After the fix:

- All three new regression tests pass, along with the focused lease and
  deletion-retry cases.
- `bb -f cli-e2e/bb.edn test --skip-build --jobs 4`: 98 cases passed, including
  the complete protocol suite (46 tests) and CLI lifecycle suite (5 tests).
- `static/node_modules/.bin/electron
  cli-e2e/scripts/graph_lifecycle_electron_test.cjs`: custom storage, concurrent
  graph starts, crash recovery, observer release, deletion completion, and stale
  generation rejection all passed with real workers.
- A fresh temporary storage probe found no SQLite tables and confirmed that
  only the nested destination is persisted while the public deletion result
  still reports the moved directory.
- JavaScript syntax checks, `git diff --check`, and `spec-dev-tool check --all`
  passed. CLJS source was unchanged, so no CLJS recompilation was required.

The local file dependency was refreshed in root, CLI, and resources using frozen,
offline installs. All consumer copies match the source. The existing Vite build
action rebuilt the CLI bundle, and `scripts/stage-cli-runtime.mjs` staged it
before validation. No lockfile or dependency version changed.

Validation ran on macOS; native Windows/Linux and full sync/UI journeys were
not repeated for this metadata cleanup.

## Consequences

Request options no longer create shared mutable configuration. Observer
ownership bounds watcher and polling resources across recovery and shutdown.
Desktop embedding configuration again controls Electron workers independently
of the CLI environment. Lifecycle coordination retains SQLite exclusion,
process identity checks, and independent worker publication while reducing
application-managed metadata from five file categories to three.

Verification exercised the compiled Electron main process and real Node worker
without the normal Desktop UI. Full Desktop UI journeys, the full sync suite,
and native Windows/Linux execution were not run. The platform limitation does
not change the accepted implementation scope; cross-platform execution remains
an integration validation gap.
