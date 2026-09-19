# Simplify Graph Lifecycle Process Management

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

`deps/graph-lifecycle/index.cjs` manages graph creation, worker admission,
startup, shutdown, and deletion for the CLI and Electron. Its process inspection
currently combines PID existence, OS birth markers, command lines, and exit
states into one identity check.

`processIdentity` reads Linux `/proc`, invokes PowerShell on Windows, and invokes
`ps` on macOS and other platforms. `sameProcess`, `argument`, and `belongsTo`
then interpret these platform-specific results. The same inspection runs during
admission, startup polling, shutdown, stale-lock cleanup, and worker discovery.

On PR #13234 at commit `12ec04d323`, Ubuntu CI reported `Process identity changed`
while stopping workers in both of these cases:

- `frontend.persist-db-test/electron-import-and-download-open-real-worker-in-fresh-graphs`
- CLI E2E case `graph-import-json`

Both cases passed three consecutive local runs on macOS ARM64 with Node 22.
A race between Linux stat and command-line reads is a hypothesis, not a confirmed
root cause. The proposed change removes this inspection model rather than
claiming that a specific Linux race has already been reproduced or fixed.

Related decisions currently require stronger OS identity checks:

- `docs/agent-guide/implemented/bugfix/2026-09-15-graph-deletion-worker-lifecycle.md`
- `docs/agent-guide/implemented/bugfix/2026-09-15-graph-lifecycle-review-followups.md`

This is an architecture decision because it intentionally weakens those
guarantees. It is not a behavior-preserving simplification.

## Decision

### Confirmed direction

The user explicitly accepts weaker process identity checks and occasional races
in exchange for using only Node built-in APIs. PID-based forced termination of
an unresponsive registered worker remains part of the proposed behavior.

Use no third-party process library, native addon, `/proc` inspection, `ps`,
PowerShell, `tasklist`, or other OS inspection commands. Do not move the existing
platform branches into another module or introduce a resident supervisor.

### Capabilities retained and removed

| Capability | Proposed mechanism | Limit |
| --- | --- | --- |
| Spawn a worker | `node:child_process.spawn` | Register its PID before admission. |
| Check whether a PID exists | `process.kill(pid, 0)` | Does not prove that the process is a worker or distinguish zombies. |
| Correlate a responsive worker | `node:http` health request and lifecycle metadata | Reject mismatched ticket, generation, storage, repo, owner, or lock ID. |
| Stop a registered worker | HTTP shutdown, then `process.kill` escalation | Accept PID reuse risk when the endpoint cannot respond. |
| Read persisted registration and lock records | `node:fs` | Records can be stale; they are not OS identity evidence. |
| Query another process's name, command line, or start time | Removed | Node has no built-in portable API for this lookup by arbitrary PID. |

Calling `ps` through `node:child_process` or reading Linux `/proc` through
`node:fs` would still depend on platform-specific inspection and does not meet
this decision. Setting `process.title` in the worker does not provide a portable
Node API for another process to retrieve that title by PID.

### One process-liveness path

Replace `processIdentity` with a narrowly named PID-existence helper backed by
`process.kill(pid, 0)`:

- Validate that the PID is a positive safe integer.
- A successful probe means the PID exists; it does not prove worker identity.
- `ESRCH` means the PID no longer exists.
- Permission errors and other unexpected errors propagate.

Remove OS birth markers, command-line comparison and parsing, and the macOS
`exiting` exception. Do not retain a function named `verifiedAlive` if it only
checks PID existence. Keep spawning through `node:child_process` and signaling
through `process.kill`.

The initial design uses the same PID probe for workers launched in this process
and workers launched by an earlier CLI or Electron process. It does not add a
second persistent identity registry or require reconstructing `ChildProcess`
objects from saved PIDs. Normal Node child-exit handling must still be allowed
to run while asynchronously polling.

### Identity comes from lifecycle records

Reuse the existing admission `ticket` as the worker-instance token instead of
introducing another UUID with the same purpose. Retain canonical storage paths,
repo, graph `generation`, owner source, PID, ticket, and graph `lock-id`.

- Register the spawned PID and ticket before the worker enters admission.
- Admission checks the recorded PID against `process.pid`, plus ticket,
  generation, owner, and storage. Direct worker startup registers through the
  same lifecycle protocol.
- Publish enough information in runtime records, graph locks, and `/healthz` to
  correlate the current PID, ticket, generation, repo, storage, and lock.
- A responsive endpoint with conflicting metadata is an explicit error. Never
  reinterpret an identity mismatch as an unresponsive worker and then kill it.
- Discover managed workers through lifecycle records. Server-list entries and
  graph locks provide consistency checks, not permission to kill arbitrary PIDs.
- An unregistered live lock owner or conflicting publication fails explicitly.
  Remove command-line-based adoption of workers and attempts to infer ownership
  from executable names or graph arguments.

Desktop startup stops revision-mismatched workers before creating the first
window. It scans the configured storage root's server publications across all
graphs and both CLI and Electron owners. Upgrade cleanup verifies the live
`/healthz` PID, port, root, repo, owner, and revision against the publication and
graph lock, then repeats the endpoint check under the graph lease. When the
endpoint publishes a lock ID, that must also match; historical endpoints without
it use the disk lock ID to guard metadata cleanup. It requests normal
shutdown before using the shared signal escalation sequence and removes matching
metadata only after exit. Current-revision workers and other storage roots remain
running. This retires old workers without admitting them into the new protocol or
migrating their registration format. An unresponsive endpoint cannot establish an
outdated revision; cleanup reports the failure and Desktop does not open a window.

Recorded metadata is application-level correlation, not fresh OS proof that a
PID still belongs to the same process. The accepted weak case is a consistently
registered PID whose worker cannot answer the protocol.

### Stop and delete flow

1. Enter the existing graph lifecycle coordination and select registered targets
   for the requested canonical storage and graph generation.
2. Preserve owner restrictions for ordinary stop and the existing graph-scoped
   cross-owner behavior for explicit deletion.
3. If an endpoint responds, check its metadata and request graceful shutdown.
   Expected connection failures or timeouts may proceed to PID-based stopping;
   metadata mismatches and unexpected errors fail.
4. Wait for PID disappearance with a bounded asynchronous poll. If it remains,
   send `SIGTERM`, wait, then send `SIGKILL` and wait again. Preserve the current
   5-second, 1-second, and 2-second stage budgets initially. Node determines the
   platform-specific signal semantics.
5. Treat `ESRCH` during signaling as the target having disappeared. Never signal
   the caller's PID; retain PID validation and propagate permission errors.
6. Only after the liveness checks pass, clean matching runtime and lock records
   and move the graph to `Unlinked graphs`. A shutdown acknowledgement, missing
   HTTP endpoint, or `closed` record alone does not authorize the move.
7. If a PID continues to exist after the deadline, return a stop failure and
   retain the graph and remaining lifecycle records for diagnosis and retry.
   Do not assume that timeout means exit.

Use the same limited liveness semantics when checking stale lifecycle owners
and server-list locks. Preserve lock-ID comparisons before removing files and
do not mask malformed state with defaults.

### Scope and cleanup

Primary implementation scope:

- `deps/graph-lifecycle/index.cjs`: remove platform inspection, identity parsing,
  command-line discovery, and birth comparisons; simplify their callers.
- `src/main/frontend/worker/db_worker_node.cljs`: update admission and health
  publication to use the agreed application-level fields.
- `src/main/frontend/worker/db_worker_node_lock.cljs`: remove `process-start`
  and align lock publication with the current worker ticket and generation.
- Direct consumers and test fixtures referencing `processIdentity`,
  `identity.birth`, `identity.command`, `identity.argv`, `exiting`, or
  `process-start`: update together. Inspect the CLI bridge, Electron manager,
  and server helpers for assumptions about the returned metadata.
- Lifecycle protocol, CLI, Electron, and worker-lock tests: replace expectations
  that assert OS birth-marker protection with the explicitly weaker contract.

Keep graph generations, canonical storage identity, admission coordination,
write leases, shutdown draining, deletion retry state, and matching-file cleanup.
This decision does not authorize removing those mechanisms or changing sync
algorithms. The separate CLI sync stress failure and known startup lease issue
remain independent investigations; this change must not be reported as fixing
them without matching reproduction evidence.

Remove obsolete fields and code paths outright. Add no compatibility readers,
fallback process scanners, or automatic migrations for previous lifecycle
metadata. If existing records lack required fields, fail clearly; any developer
reset must first stop the corresponding workers and must preserve graph data.
Update the related decision documents when implementation supersedes their OS
identity guarantees, without rewriting their historical verification results.

## Alternatives considered

### Keep or extract the platform adapters

This retains stronger inspection but keeps the complexity the user wants to
remove. Relocating the same branches is not the requested outcome.

### Use a third-party process library

This hides OS inspection behind a dependency and still requires checking its
identity and exit-state semantics. It violates the built-in-only constraint.

### Refuse every forced stop of an external worker

This avoids signaling a potentially reused PID but gives up automatic stopping
of registered unresponsive workers. The proposed design accepts the weaker
PID-based stop instead.

### Introduce a resident supervisor or a second local-child management path

A supervisor can retain child handles but adds another process lifecycle and
orphan-recovery problem. A separate local-child path adds state and still does
not solve later CLI invocations. Neither is required for this scoped proposal.

## Acceptance criteria

- `deps/graph-lifecycle` has no OS-specific process inspection branches, external
  process inspection commands, or new process-management dependencies.
- There are no remaining runtime consumers of the removed OS identity fields or
  command-line ownership parser in this lifecycle flow.
- Normal worker creation, reuse, stop/reopen, import/download, and graph deletion
  work through both CLI and Electron.
- A separate CLI invocation can stop a registered worker using the persisted
  application metadata, including escalation when its HTTP endpoint is absent
  or unresponsive.
- Mismatched ticket, generation, storage, repo, owner, or lock metadata fails
  without signaling an unrelated target or moving the graph.
- Permission-denied probes, self-targets, malformed PIDs, and persistent liveness
  produce explicit errors; failed stopping does not authorize lock deletion or
  graph movement.
- Protocol tests cover disappearance between probe and signal, graceful exit,
  forced exit, and stop timeout. Signal tests use owned disposable processes;
  tests never deliberately risk signaling an unrelated reused PID.
- Remove tests for guarantees intentionally abandoned, including rejecting an
  OS birth-marker mismatch and interpreting macOS `ps` exit states. Retain graph
  ownership, generation, lock replacement, concurrent operation, and close-error
  coverage.
- Run the lifecycle process suites, the two CI regression cases, affected CLJS
  namespaces, and the non-sync CLI suite. Check the Linux/Node 24 CI paths, not
  only local macOS. Record Windows verification or its absence explicitly.

Verification entry points for the implementation phase include:

```sh
node --test cli-e2e/scripts/graph_lifecycle_protocol_test.cjs cli-e2e/scripts/graph_lifecycle_cli_test.cjs
pnpm cljs:test
LOGSEQ_STABLE_IDENTS=1 node static/tests.js -n electron.db-worker-manager-test -n frontend.persist-db-test -n frontend.worker.db-worker-node-lock-test
bb -f cli-e2e/bb.edn test --skip-build --case graph-import-json
bb -f cli-e2e/bb.edn test --skip-build --jobs 4
static/node_modules/.bin/electron cli-e2e/scripts/graph_lifecycle_electron_test.cjs
```

Rebuild affected CLI, Electron, and worker artifacts before using commands that
skip compilation. Results and environment details are recorded below.

## Risks

- A recorded PID can be reused before inspection or between checking and
  signaling. Forced termination can then affect an unrelated process. A runtime
  ticket cannot eliminate this when the target cannot answer. This weaker
  identity guarantee is explicitly accepted; its frequency is not measured.
- A zombie or reused live PID can keep the existence probe positive and cause a
  false stop timeout. There is no platform-specific workaround in this design.
- Unregistered or damaged lifecycle state is no longer repaired by command-line
  discovery. Desktop upgrade cleanup can retire an unregistered worker whose
  endpoint and graph lock agree; unresponsive or conflicting owners still require
  intervention.
- Correlated files can be stale together. File consistency is weaker than OS
  process-instance identity and must not be described as an equivalent guarantee.
- Node signal behavior varies across platforms. The stages are escalation
  attempts, not a promise that `SIGTERM` is graceful everywhere.
- The existing snapshot of registration records must remain protected against
  graph recreation and concurrent startup. Accepting PID races does not permit
  removing generation or lock ownership checks.
- Removing platform inspection addresses complexity and removes the source of
  the current identity-comparison errors; it is not evidence that all CI failures
  will pass. Actual cross-platform test results remain necessary.

## Authorization

The user approved implementation of this design, including built-in-only process
management, weaker identity checks, occasional PID races, and PID-based
escalation for an unresponsive registered worker.


## Implementation

- Replaced OS inspection with `pidExists` and PID signaling in
  `deps/graph-lifecycle/index.cjs`; removed `processIdentity`, birth markers,
  command-line parsing, process adoption, and the macOS exit-state exception.
- Registration and runtime records use flat PID, ticket, generation, owner,
  repo, and canonical storage fields. Runtime metadata is checked against its
  registration before merging it. Locks and health responses publish ticket
  and generation; conflicting fields fail before shutdown or signaling.
- Both ordinary stop and explicit deletion retain asynchronous exit polling,
  the existing escalation budgets, matching-lock cleanup, leases, generation
  checks, and deletion retry behavior. Unregistered live lock owners fail.
- Updated worker publication, direct consumers, fixtures, and lifecycle tests.
  The CLI test that owns a child now calls the separate stop command
  asynchronously so its event loop can reap the child while stop polls for PID
  disappearance. A synchronous parent caused a reproducible stop timeout on
  both tested platforms; the implementation does not add an OS zombie scanner.
- No production package dependencies or compatibility readers were added.

### Verification

The following checks were run against the working tree on 2026-09-16:

| Environment | Check | Result |
| --- | --- | --- |
| macOS ARM64, Node 22.21.1 | `pnpm cljs:test` | Worker and tests compile, zero warnings. |
| macOS ARM64, Node 22.21.1 | Lifecycle protocol suite | 62 tests passed. |
| macOS ARM64, Node 22.21.1 | Lifecycle CLI suite | 5 tests passed. |
| macOS ARM64, Node 22.21.1 | Affected CLJS namespaces listed below | 138 tests, 613 assertions, zero failures/errors. |
| macOS ARM64, Node 22.21.1 | `bb -f cli-e2e/bb.edn test --skip-build --jobs 4` | 98 cases passed, including `graph-import-json`. |
| macOS ARM64, Electron 42.3.0 | `graph_lifecycle_electron_test.cjs` | Custom storage, alias reuse, stop/reopen, deletion, sibling preservation, parallel generations, recovery, and observer/resource cleanup passed. |
| Ubuntu 26.04 ARM64, Node 24.21.0 | Lifecycle protocol and CLI suites | 67 tests passed (62 protocol + 5 CLI). |
| Ubuntu 26.04 ARM64, Node 24.21.0 | Import/download CLJS regression | 1 test, 7 assertions, zero failures/errors. |
| Ubuntu 26.04 ARM64, Node 24.21.0 | CLI `graph-import-json` | 1 case passed, including cleanup of both workers. |
| macOS ARM64 | `bb lint:kondo-git-changes`, `bb lint:large-vars`, `git diff --check` | Passed. |

Affected CLJS namespaces:

```sh
LOGSEQ_STABLE_IDENTS=1 node static/tests.js \
  -n electron.db-worker-manager-test \
  -n frontend.persist-db-test \
  -n frontend.worker.db-worker-node-lock-test \
  -n frontend.worker.db-worker-node-test
```

The pre-change RED check showed that conflicting lock tickets and endpoint
tickets were ignored (`Missing expected rejection`). After implementation,
all 15 lock/endpoint/runtime conflict checks also assert that no termination
signal was sent to the disposable worker and pass.

The CLI bundle initially remained stale because the local Dune incremental
build did not rerun Vite for the changed file dependency. Verification used a
fresh Vite bundle from `cli/_build/default`, staged with
`node scripts/stage-cli-runtime.mjs`, and rebuilt worker and Electron artifacts.
The staged CLI was inspected for the new PID and registration validation code
before rerunning the suites.

Linux testing also exposed a pre-existing test assumption that any embedding
endpoint enabled the vector engine. `frontend.worker.platform.node` currently
enables that engine only on macOS ARM64. The protocol test now matches that
platform contract while still checking endpoint forwarding on every platform;
production embedding behavior was not changed.

Linux verification used a disposable Lima VM and a copied test workspace,
with the same compiled worker/tests/CLI and a Linux build of `keytar`. The
CLJS regression was selected with:

```sh
LOGSEQ_STABLE_IDENTS=1 node static/tests.js \
  -v frontend.persist-db-test/electron-import-and-download-open-real-worker-in-fresh-graphs
```

The CLI regression ran the repository's unchanged harness through Babashka's
built-in dependencies, avoiding a Java-only dependency resolution preflight:

```sh
bb --config /tmp/bb-empty.edn --classpath cli-e2e/src -e \
  '(require (quote logseq.cli.e2e.main)) (logseq.cli.e2e.main/test! {:skip-build true :case "graph-import-json" :jobs 1})'
```

Windows was not available and was not verified. The Linux runs exercise the
previously failing paths on Node 24; they are not a rerun of GitHub-hosted CI or
an x86_64 validation. The separate sync stress failure remains outside scope.

### Desktop upgrade validation with computer use

On macOS ARM64, packaged Desktop builds `2f3dd44f41` and
`2f3dd44f41-dirty` were launched with an isolated HOME, user-data directory, and
graph storage. Native UI interactions created a graph and edited a journal block
through the sequence old -> new -> old -> new. Each version displayed the edits
saved by the preceding version. Before upgrading, two old CLI-owned workers were
left running; the new Desktop terminated both before opening its window.

A real historical packaged worker (`be7c1d1-dirty`) exposed a missing case: its
health endpoint did not publish a lock ID. Before the correction, Desktop logged
`Outdated worker endpoint identity mismatch` and exited. After adding the
regression test and correcting the upgrade identity check, the same live worker
was shut down normally. The new Desktop opened its graph and accepted an edit
through the UI. All 16 upgrade protocol tests passed. Test windows exited
normally; the installed application and personal graphs were not replaced.

## Consequences

The accepted tradeoff is now part of the process lifecycle contract: a PID
that exists may have been reused or may be a zombie. An unresponsive registered
PID may be signaled, and a PID that stays present causes a stop timeout without
moving graph data. No claim of equivalent OS process-instance verification or
of eliminating every PID race is made.
