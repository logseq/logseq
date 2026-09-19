# Graph Lifecycle Review Followups

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

The review of all uncommitted changes on 2026-09-15 found four reproducible
problems in the shared graph lifecycle implementation. Existing regression
suites pass, but do not cover these boundaries. This document records the
evidence and the proposed corrections. The user accepted both recommended
design decisions on 2026-09-15. The corrections below are implemented and
verified against the working tree.

Related decision:
[Graph Deletion Worker Lifecycle](../../implemented/bugfix/2026-09-15-graph-deletion-worker-lifecycle.md).

Source line numbers below refer to the working tree at review time.

### 1. Custom graph directories can delete the wrong graph

- Priority: P1 / Blocking.
- Review category: Data contract.
- Location: `src/main/logseq/cli/common.cljs:15-16`;
  `deps/graph-lifecycle/index.cjs:39-44`.

`LOGSEQ_GRAPHS_DIR` accepts a custom directory through
`logseq.common.graph/get-default-graphs-dir`. The new `<unlink-graph!` passes
only its parent directory to `deleteGraph`. Lifecycle then reconstructs the
graph path as `<root>/graphs/<graph>`, losing the configured directory name.

Reproduction, using an isolated root:

1. Create `<root>/custom-graphs/demo` and `<root>/graphs/demo`, each with a
   marker identifying its source directory.
2. Invoke the actual compiled CLJS entry point in Electron:

   ```clojure
   (logseq.cli.common/<unlink-graph!
     "<root>/custom-graphs" "logseq_db_demo")
   ```

3. Observe a destination under `<root>/graphs/Unlinked graphs/demo`.
4. Confirm that its marker belongs to `graphs`, while
   `<root>/custom-graphs/demo` remains untouched.

This was reproduced in Node and Electron 42.3.0. The compiled source map for
the entry point matched the current CLJS source. The Electron probe invoked
the deletion function directly; it did not exercise the native deletion dialog.

The operation can move a different graph with the same name, or fail to remove
the requested graph when no such sibling exists.

### 2. A failed client commit cannot be retried successfully

- Priority: P2 / Important.
- Review category: Correctness.
- Location: `deps/graph-lifecycle/index.cjs:468-477`;
  `cli/lib/graph.ml:1125-1131`.

`deleteGraph` moves the directory before running its client commit callback,
but persists `destination` only after that callback succeeds. If the callback
fails, the next attempt sees no canonical graph directory and returns
`existed: false`. The CLI reports `graph-not-exists` even when the retry has
successfully completed the remaining configuration update.

Reproduction with the current `static/logseq-cli.js` and a disposable root:

1. Run `graph create --graph demo` with an explicit `--root-dir`.
2. Write `{:graph "demo"}` to `<root>/cli.edn` and set its mode to `0444`.
3. Run `graph remove --graph demo --output json`.
4. Observe exit 1 with `server-cleanup-failed`; the graph directory has already
   moved to `Unlinked graphs`.
5. Restore configuration mode to `0644` and repeat `graph remove`.
6. Observe exit 1 with `graph-not-exists`, even though configuration is now
   `{}` and lifecycle state is `phase: "deleted", destination: null`.

Automated retries never receive a successful deletion result, and lifecycle
metadata loses the preserved directory's location.

### 3. CLI cannot stop its own worker before admission completes

- Priority: P2 / Important.
- Review category: Failure mode.
- Location: `deps/graph-lifecycle/index.cjs:425-432`.

`startGraph` registers a spawned worker's identity, ticket, and generation,
but omits its owner. Ordinary stop checks ownership only through
`target.lock['owner-source']`. A worker that has not reached admission has no
lock, so its owner is treated as a mismatch even when the CLI started it.

Reproduction:

1. Create `demo` in a disposable root with `lifecycle.createGraph`.
2. Call `lifecycle.startGraph` using the existing
   `cli-e2e/scripts/db-worker-node-lifecycle-fixture.cjs` fixture and
   `extraArgs: ['--mode', 'before-admission']`. Use the default `cli` owner.
3. Wait for the fixture's PID marker, then run the freshly built CLI:

   ```sh
   node static/logseq-cli.js server stop \
     --root-dir <root> --graph demo --output json
   ```

4. Observe exit 1 with `server-owned-by-other`; the recorded process remains
   alive, and its command line includes `--owner-source cli`.

When startup hangs at this stage, ordinary stop/restart cannot recover it.
The user must terminate the process manually or invoke graph deletion.
The reproduction used a controlled startup fixture and the real CLI stop path.

### 4. Unrelated workers add sequential delays to normal CLI commands

- Priority: P2 / Important.
- Review category: Performance.
- Location: `deps/graph-lifecycle/index.cjs:279-283`.

Every local CLI command that ensures a server follows
`ensure_server -> ensure_runtime -> startGraph -> discover`. Discovery scans
the whole server list and sequentially requests health from unrelated workers,
even when their process arguments identify another graph. Each unresponsive
worker adds a one-second timeout while the target graph's lease is held.

Measured with the real CLI and worker in an isolated root containing `demo`
and three other graphs:

| Condition | `demo list page --limit 1` |
| --- | ---: |
| All workers responsive | 0.114 s |
| Other three workers paused with `SIGSTOP` | 3.137 s |
| Other workers resumed with `SIGCONT` | 0.110 s |

All three commands exited successfully and returned the same page. The target
worker remained responsive throughout. The old CLI discovery implementation
used concurrent health requests. This change makes latency accumulate across
unrelated workers and also delays concurrent operations on the target graph.

### Verification context

The preceding review completed these checks:

- Fresh CLI and worker build through `bb -f cli-e2e/bb.edn build`.
- CLI non-sync suite: 92 passed, 0 failed.
- Shared lifecycle protocol suite: 18 passed, 0 failed.
- Related CLJS test run: 308 tests, 1,525 assertions, no failures or errors.
- `git diff --check` passed.
- CommonJS/ESM loading checks accepted the new lifecycle package.

These passing checks do not invalidate the four separate reproductions above.
The probes used disposable data and cleaned up their temporary processes and
directories. Complete Desktop UI and sync suites, and native Linux/Windows
behavior, were not verified in this review.

## Decision

Implement four focused corrections within the existing shared lifecycle path:

1. Preserve the explicit graph storage directory across the Electron/common
   boundary. Ensure create, discovery, admission, stop, and deletion agree on
   both the graph location and the coordination identity.
2. Persist the completed directory move before invoking client commit. Resume
   the remaining commit after failure without losing the destination or
   converting that operation into a missing-graph result.
3. Record the known owner when registering a spawned worker. Use that trusted
   record for ownership checks before a canonical lock exists, and check
   consistency once the worker publishes its lock.
4. Exclude processes conclusively identified as belonging to other graphs.
   Perform any remaining necessary health probes concurrently, while
   preserving identity validation and failure reporting.

### Use one canonical storage context

Pass one explicit storage context containing the canonical graph storage
directory and lifecycle metadata location through the shared API. Resolve it
at the entry boundary and use it consistently for creation, discovery,
admission, recovery, stop, and deletion. Do not reconstruct a graph directory
from its parent or assume its final path component is `graphs`.

Coordination identity must distinguish separate graph stores containing the
same graph name, while aliases of one physical store must share exclusion.
The context must reach both the supervisor and the admitted worker so their
paths and identity checks agree.

### Resume an incomplete deletion automatically

Ordinary `graph remove` must resume a recorded deletion whose directory move
completed but client commit failed. Persist its original graph generation,
operation identity, completed move, and destination before attempting client
commit. On retry, complete only the remaining work and return success without
moving the directory again or discarding the destination.

Bind recovery to the original graph instance. A pending operation or stale
retry must never delete, detach, or clear configuration for a subsequently
created graph generation with the same name. Validate this boundary while
holding lifecycle exclusion. A graph that is simply absent, with no pending
deletion to resume, must retain the existing `graph-not-exists` error.

Keep the existing shared protocol and fail-fast behavior. Do not add alternate
legacy paths, compatibility layers, or guessed ownership/path defaults. Preserve
cross-owner restrictions for ordinary stop and the deliberate cross-owner
semantics of graph deletion.

No DataScript attribute, built-in property, DB schema, or D1 schema change is
currently indicated. Lifecycle metadata changes still need their own invariant
and crash/retry coverage. Any required edits to `cli/spec/*.mli` must be scoped
explicitly in accordance with `cli/AGENTS.md`.

## Alternatives considered

### Reconstruct graph paths from the root directory

Rejected as a correction: this is the current failure. Rejecting previously
supported custom graph directory names would also discard an existing
configuration capability without resolving the path contract.

### Treat every absent graph deletion as success

This would hide the failed-commit retry result, but also change the ordinary
missing-graph command contract. Resume only a recorded pending deletion tied
to its original operation and graph generation.

### Treat a missing owner as CLI-owned

Rejected because absence of a lock is not proof of ownership. Registration
already knows the owner and can persist it without guessing.

### Only shorten health timeouts

Not sufficient: sequential delays still grow with the number of unrelated
workers, and shorter timeouts can reject legitimately slow endpoints. First
remove unnecessary probes and avoid serial waits for independent candidates.

## Acceptance criteria

- With custom and standard graph directories containing the same graph name,
  deleting the custom graph moves only its data, stops only its workers, and
  preserves the standard graph and its runtime.
- Creation, open/recovery, and deletion resolve the same configured location;
  aliases of one physical directory retain consistent lifecycle exclusion.
- A client commit failure after the directory move records the destination.
  After the fault is corrected, retry succeeds without a second move and
  completes configuration cleanup.
- Retrying a pending deletion cannot delete or detach a newly created graph
  generation with the same name. Ordinary missing-graph behavior is explicit
  and covered separately.
- CLI stop/restart can terminate its registered worker before admission,
  confirm OS exit, and clean matching metadata without deleting graph data.
  A worker registered to another owner remains protected from ordinary stop.
- Pausing unrelated workers does not add one health timeout per worker to a
  responsive target graph's normal command. Re-run the recorded latency
  experiment with equal outputs and report measurements.
- Missing or conflicting process identity still produces an explicit error;
  no optimization bypasses required identity checks before termination.
- Add focused regressions for the four failures and run them against current
  artifacts. Run CLI non-sync and relevant CLJS checks after implementation,
  plus an isolated Electron custom-directory scenario.

## Risks

- Directory identity changes can split exclusion between aliases or conflate
  distinct graph stores if only the parent root remains in the key.
- Retaining a pending deletion record requires distinguishing its generation
  and completed move from a later graph created under the same name.
- Ownership recorded before admission must remain tied to verified process
  identity and must not authorize signaling a reused PID.
- Concurrent discovery can increase short-lived socket activity. It must not
  skip unresolved workers or weaken lock and endpoint identity checks.
- Timing results came from macOS. OS-specific process behavior still requires
  native Linux/Windows verification where affected by a correction.

## Questions

Both questions were answered by the user on 2026-09-15:

1. Use one canonical storage context containing graph storage and lifecycle
   metadata locations.
2. Automatically resume a recorded deletion after client commit failure,
   preserve ordinary missing-graph errors, and protect recreated generations.

No questions require additional user input before implementation of this
proposal.

## Implementation

### Storage and coordination

`resolveStorage(root, graphsDir)` resolves physical directories once and returns
`root`, `graphsDir`, and `lifecycleDir`. Lifecycle metadata lives under the
canonical store parent's `.graph-lifecycle/<sha256-of-store-path>/` directory.
Separate stores cannot collide, and symlink aliases share the same lease and
state. Metadata stays outside the graph listing directory.

All shared lifecycle APIs require this context. The CLI resolves its standard
`root/graphs` storage at the platform boundary. Electron resolves its configured
`LOGSEQ_GRAPHS_DIR`. Worker arguments carry the canonical graphs and lifecycle
directories; admission rejects mismatched coordination locations. The admitted
context also drives the database platform, lock, health payload, and logs.
Runtime observers and stop/reopen use the same context. Registered worker roots
are retained so cleanup removes the original server publication even when an
operation arrives through an alias with another root.

No `cli/spec/*.mli`, dune file, database schema, built-in property, or D1 migration
was changed for these followups.

### Recoverable deletion

Deletion retains the original generation and a unique operation id. It records
the source directory's device/inode and destination before rename, then records
the completed move before client commit. If execution stops after rename but
before that second write, retry recognizes the original directory at the
recorded destination. It never moves it a second time.

Retries capture their generation and operation before waiting for exclusion and
validate them under the lease. Explicit recreation replaces the generation;
queued old retries fail before commit. A replacement directory appearing while
a moved deletion is pending also fails identity validation without touching its
data or clearing configuration. An absent graph with no pending move returns
`existed: false` and does not invoke client cleanup, preserving CLI
`graph-not-exists` behavior.

### Ownership and discovery

Spawn and direct admission retain the known owner alongside the ticket,
generation, root, and OS process identity. Ordinary stop can use this registration
before admission. Published locks must agree with it. Termination still verifies
PID birth/command identity and waits for OS exit.

Discovery skips workers whose arguments conclusively identify another graph or
store. Remaining independent publication probes and moved-lock probes run
concurrently. Probe failures are collected before metadata adoption; unresolved
target identity and conflicting locks remain explicit failures.

### Regression coverage and runtime evidence

- `graph_lifecycle_protocol_test.cjs`: 29 process tests covering storage aliases,
  cross-store worker isolation, commit/rename recovery, queued recreation,
  replacement directories, ownership, unresolved identity, and concurrent probes.
- `graph_lifecycle_cli_test.cjs`: three tests against the staged CLI for failed
  configuration commit retry, pre-admission stop/restart, and paused workers.
- `graph_lifecycle_electron_test.cjs`: loads actual compiled Electron namespaces
  in an isolated Electron process and verifies create IPC, custom storage, alias
  reuse, stop/reopen, common deletion, SQLite/log placement, and the surviving
  standard store's live worker.
- `logseq.cli.common-test`: the actual CLJS deletion boundary preserves the
  custom graph's marker and leaves the standard sibling intact. Existing worker
  orchestration tests now use real lock creation instead of incomplete lock stubs.

Before implementation, six focused protocol regressions failed, the custom CLJS
case produced four failed assertions, and the rename-interruption regression
returned `existed: false`. The isolated Electron 42.3.0 probe moved the standard
marker's directory while retaining the custom directory. The same compiled
common entry point now moves only the custom data. The expanded Electron
scenario also confirms alias reuse and a new worker PID after stop/reopen.

The real CLI read-only configuration experiment changed from retry exit 1 with
`graph-not-exists` to retry exit 0 with `status: ok`; the subsequent absent-graph
remove still exits 1 with `graph-not-exists`. Configuration becomes `{}` and the
original destination remains in lifecycle metadata.

The same `list page --graph demo --limit 1 --output json --profile` experiment
used one responsive target and three unrelated workers:

| Build | Responsive | Other workers paused | Resumed |
| --- | ---: | ---: | ---: |
| Before | 0.114 s | 3.220 s | 0.114 s |
| After | 0.114 s | 0.108 s | 0.108 s |

Each row returned identical output for all three commands. Profiling measured
3,163 ms in `cli.total` before the correction versus 53 ms after it during the
paused condition. The CLI regression independently measured about 0.111 s in
each condition.

Relevant historical Electron/worker logs were inspected before implementation;
controlled fixtures and CLI output supplied the four reproductions. A mixed
artifact run exposed a stale CLI bundle and failed before admission/log setup.
Cleaning the CLI build, rebuilding, and staging aligned its storage protocol
with the worker. Subsequent runtime logs and process checks matched the new
paths and lifecycle behavior.

Final validation:

- `bb dev:lint-and-test`: passed, including all lint tasks and 2,067 tests with
  8,218 assertions; no failures or errors. This command excludes `:long` and
  `:fix-me` as configured by the repository.
- Targeted CLJS runtime suites, including the relevant long tests: 340 tests,
  1,652 assertions, no failures or errors. Use `LOGSEQ_STABLE_IDENTS=1` when
  running the compiled test artifact directly, as the standard test task does.
- `pnpm --dir cli test`: 234 passed, no failures.
- `bb -f cli-e2e/bb.edn test --skip-build`: 93 cases passed, no failures,
  including 29 protocol tests and three compiled CLI followup tests.
- The rename-interruption test also kills its deletion process with `SIGKILL`
  immediately after the directory move, before completion metadata or catch
  cleanup can run. It confirms `phase: deleting`, reclaims the dead lease owner,
  and successfully resumes the original move. This final strengthened case passed.
- Isolated Electron 42.3.0 custom-directory, alias, stop/reopen, and deletion
  scenario: passed against compiled main-process namespaces and the real worker.
- CommonJS/ESM scan: lifecycle package loads from static, resources, and root.
  The scanner's unrelated `@sentry/node` warning comes from probing outside the
  db-sync package; loading it from both db-sync runtime directories succeeds.
- `git diff --check` and `spec-dev-tool check --all`: passed.

To reproduce the isolated Electron check after `clojure -M:cljs compile electron`
and staging the worker, run:

```sh
./static/node_modules/.bin/electron cli-e2e/scripts/graph_lifecycle_electron_test.cjs
```

## Consequences

Graph storage identity now follows the canonical physical directory, so custom
stores and aliases coordinate consistently. Failed client commits remain
recoverable without weakening missing-graph errors or generation checks.
Registered owners can stop workers before admission, and unrelated worker
latency no longer accumulates during normal target commands.

The shared API and lifecycle metadata layout changed without a compatibility or
migration path. CLI, Electron, and workers must use matching fresh artifacts.
Concurrent discovery opens several short-lived connections when process identity
cannot exclude candidates; identity validation remains mandatory before signaling.

### Verification limits

Validation ran on macOS with Node 22.21.1 and Electron 42.3.0. The Electron test
exercises compiled main-process entry points, without the native deletion dialog
or a full Desktop UI journey. Native Linux/Windows behavior and the complete sync
suite were not run for these followups.
