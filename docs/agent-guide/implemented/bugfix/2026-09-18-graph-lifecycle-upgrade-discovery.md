# Graph Lifecycle Upgrade Discovery

## Problem

Four review comments identify defects in the SQLite ownership upgrade flow.
The user requested an exploring document and fixes on 2026-09-18. This document
records the reproduced behavior, implemented changes, and verification.
The user resolved the remaining question on 2026-09-18: fail immediately when
a live pending worker has no endpoint, preserve evidence, and allow a later retry.
The implementation follows that decision.

| Finding | Reproduced behavior | Actual impact |
| --- | --- | --- |
| Directory decoding | `graphs/bad%ZZname` makes the unscoped `stopOutdatedWorkers` call throw `URIError: URI malformed`. A real isolated Electron launch logged `:electron/worker-upgrade-failed` and exited before opening a window. | P1: an unrelated directory prevents Desktop startup. |
| Legacy stop result | Calling `stopGraph` directly stops a legacy worker and then rejects with `server-not-found`, both with and without a registration. | A confirmed return-contract defect. The current OCaml CLI is protected by its preliminary retirement call and returns success; a P1 CLI failure was not reproduced. |
| Repeated publication discovery | With 20 canonical graph directories and 3 current worker processes, one unscoped scan issued 60 health requests, with 57 concurrent requests at peak. The isolated run took about 25 ms. | P2: request volume grows with graphs times workers. Socket exhaustion and substantial latency have not been demonstrated. |
| Missing endpoint metadata | After removing an old SQLite worker's runtime JSON, targeted retirement returned `[]`. `startGraph` then reused the same PID with revision `old`, and the actual CLI `server start` command returned success. | Revision enforcement is bypassed. No particular data-corruption scenario has been demonstrated. |

The earlier successful worker-crash recovery checks do not cover malformed
sibling directories, a live worker with lost runtime metadata, or the number of
startup discovery requests.

### Relevant code

- `deps/graph-lifecycle/index.cjs`: `stopOutdatedWorkers`, `discover`,
  `readRuntime`, `health`, `stopUnderLease`, `stopGraph`, and `startGraph`.
- `deps/graph-lifecycle/legacy-retirement.cjs`: the existing authorized legacy
  ownership retirement boundary and its identity rechecks.
- `deps/common/src/logseq/common/graph_dir.cljs`: tolerant directory decoding.
- `src/main/logseq/cli/server.cljs`: `classify-graph-dir`, graph listing, and the
  direct CLJS `stopGraph` caller.
- `cli/lib/platform/node/cli_unix.ml`: `start_graph_runtime` assumes retirement
  has checked the revision; `stop_graph_runtime` already treats a nonempty
  retirement result as successful stopping.
- `src/electron/electron/db_worker.cljs` and `core.cljs`: startup retirement
  precedes window creation, and failure quits the application.

This follows the ownership decision in
`docs/agent-guide/implemented/architecture/2026-09-18-replace-db-worker-lock-with-sqlite.md`.
It does not reopen that decision's sequential-upgrade scope or add support for
concurrent old/new application access. Directory handling also follows
`docs/agent-guide/implemented/simplification/2026-09-17-unify-cli-graph-directory-discovery.md`:
the user already chose standard-only discovery, leaving nonstandard directories
untouched. That policy does not need another approval.

## Decision

Fix all four defects in the shared lifecycle implementation. Preserve graph
content, canonical storage identity, SQLite ownership, generation and ticket
checks, shutdown confirmation, and the existing legacy retirement guarantees.
Do not add dependencies, persistent caches, configuration flags, new CLI APIs,
compatibility layers, or graph-data migrations.

### 1. Classify directories before scheduling graph work

Replace the unconditional `decodeURIComponent` map with explicit directory
classification. Match the existing tolerant decoder and canonical round-trip
rules: a canonical directory must decode to a valid graph name and encode back
to the same physical directory name. Catch decoding failures only at this
external filename boundary, not around lifecycle operations.

The implemented scope skips undecodable, reserved, and noncanonical
entries when choosing canonical graph directories for startup retirement.
Leave those entries untouched. Keep the OCaml CLI's standard-only discovery
and the existing CLJS classification surface unchanged. Do not reinterpret a legacy physical directory as a different
canonical path, create lifecycle state for it, rename it, or migrate its data.
Valid encoded percent and tilde characters, spaces, Unicode, and encoded path
separators must still select their correct canonical graphs.

Use the existing classification semantics without introducing a reverse
CommonJS-to-CLJS runtime dependency. If a small Node-side predicate is necessary,
keep it local to directory discovery and verify its results against shared
naming cases. Do not duplicate the complete legacy migration/classification
subsystem in the lifecycle package.

An unrelated unrecognized directory is not an ownership error. Invalid
registration/runtime JSON, an unknown ownership protocol, and unverifiable
ownership of an actual target must continue to fail explicitly. Published-worker orphan checks remain enabled for selected canonical graphs.

### 2. Preserve successful legacy retirements in stop results

Capture the array returned by `legacy.retireGraph` in `stopUnderLease`. Report
success if either that array or the subsequent current-protocol target set is
nonempty. Preserve `server-not-found` for a stop that finds neither.

Keep all existing shutdown, ownership, and cleanup checks. Do not change CLI
error mapping to hide this defect. Test the shared `stopGraph` entry point
directly, since the current CLI's preliminary retirement call masks the bug.
Deleting a graph must retain its existing return contract and retry behavior.

### 3. Discover shared publications once per upgrade invocation

Introduce invocation-scoped discovery data for unscoped startup retirement:

1. Enumerate canonical graph candidates and acquire each graph's management lease.
2. Read each referenced publication root lazily, once per invocation. Index its
   entries by PID to correlate registrations with candidate ports.
3. Share endpoint probe promises and group routing observations by graph name.
   Check storage identity when assessing an unregistered publication.
4. Read authoritative registration and runtime metadata under each graph's lease.
   Use a fresh health request to verify identity and revision before retirement;
   cached observations are only for discovery. Existing retirement rechecks remain.

The intended bound is linear in graph enumeration plus publications and actual
retirement work, not graphs multiplied by publications. A target may require
multiple health checks for safety; a constant number per target is acceptable.
Adding empty graphs must not multiply probes of the same live endpoints.

Use the same invocation-scoped observations for unrelated-publication
classification in the legacy adapter during a full scan. Otherwise a collection
of legacy graphs could retain the same repeated-probe problem. Preserve the
adapter's fresh identity checks and exact-evidence cleanup rechecks.

Discovery data is local to the invocation. Registration is read under the lease,
and newly referenced roots are loaded on demand. Publication changes after a
root was read can require a retry; cached observations never authorize shutdown
without fresh identity verification. There is no global cache or background service.

Targeted CLI operations should correlate the requested graph's publications
without probing every unrelated worker. Preserve the existing test guarantee
that paused or invalid sibling workers do not block a current target command.

### 4. Require revision verification for live target workers

For targeted retirement, merge server-list publication data for the requested
registration even when its runtime JSON is absent. Keep the existing
registration/runtime consistency checks and reject conflicting published ports.
A publication provides an endpoint candidate, not authority: the existing
health identity checks must succeed before trusting its revision or stopping it.

After correlation:

- A live target with an endpoint must have its revision checked. Retire an old
  revision; preserve a matching revision.
- A busy ownership lock and a live target with no verifiable endpoint must not
  return successful retirement. The implemented policy is to fail explicitly
  and preserve the worker and metadata for a later retry.
- A legitimate pending startup with no publication also must not silently pass
  the version gate. It fails immediately and preserves its registration for a later retry.
- Dead/abandoned registrations continue through the existing ownership-aware
  cleanup path. Missing metadata must not authorize signaling an unrelated PID.
- Malformed runtime metadata remains an explicit error. Correlating a missing
  file must not become a fallback that masks malformed or conflicting data.

## Alternatives considered

### Catch and ignore the entire upgrade scan

Rejected. This would allow actual ownership and version failures to reach
normal startup. Only unrecognized directory names may be excluded at the
filesystem enumeration boundary.

### Decode legacy names and manage their canonical destination automatically

Not recommended. The physical legacy directory and its canonical destination
can differ or coexist. This would conflate naming migration with ownership
retirement and expand the already-authorized upgrade adapter's responsibilities.

### Call the existing full discover function for every targeted retirement

Rejected as the complete fix. It would recover a missing port but also probe
unrelated endpoints, reintroducing known CLI latency and preserving the full
scan's repeated-request problem.

### Cache endpoint health globally or trust one startup snapshot for shutdown

Rejected. A global cache needs invalidation across worker replacement and graph
recreation. A routing snapshot cannot replace current registration, generation,
ticket, ownership, and endpoint validation under the management lease.

### Fix server-not-found only in the CLI

Rejected. The current OCaml CLI already handles retirement success. The defect
belongs in the shared stop return contract used by other callers.

### Wait for publication while holding the management lease

Rejected. Worker publication itself acquires that lease; waiting under it can
block the event being awaited. Supporting a bounded wait would require releasing
and reacquiring the lease and validating the generation/ticket again. Failing
explicitly is the smaller option, as approved by the user.

## Acceptance criteria

- An isolated Desktop launch with `bad%ZZname` beside a valid graph opens a
  window and can open/edit the valid graph. The malformed directory is unchanged.
- Directory cases cover malformed percent/tilde escapes, valid encoded literal
  percent/tilde characters, Unicode, spaces, reserved directories, legacy names,
  and a legacy/canonical name collision. No unrelated directory is renamed,
  deleted, or given fabricated lifecycle state.
- Direct `stopGraph` succeeds after retiring a historical CLI- or Electron-owned
  worker, with and without registration; a truly absent worker still produces
  `server-not-found`. Existing CLI stop and deletion tests remain green.
- With a fixed number of published workers, adding empty graph directories does
  not increase the number of health probes for those endpoints. Test current
  workers and legacy retirement, unrelated storage, alternate publication roots,
  and an unregistered publication. Measure request counts, not only elapsed time.
- Removing an old live SQLite worker's runtime JSON cannot make targeted
  retirement succeed and then reuse that old worker. Exercise both the shared
  lifecycle API and the actual CLI `server start` path.
- Missing runtime metadata with a matching revision is resolved through a
  validated publication. Conflicting ports, wrong ticket/generation/storage,
  malformed runtime metadata, and missing/unresponsive endpoints fail explicitly
  without signaling an unverified process.
- Pending startup fails explicitly and does not wait
  while holding a lease needed by the worker to publish readiness.
- Existing generation, shutdown, deletion retry, suspended-worker, and Desktop
  worker-crash/reopen guarantees remain intact.

## Verification

Regression tests were added before the production fixes. The selected initial
run had 12 cases: 11 failed for the reproduced defects and the matching-revision
case passed. The same regressions pass after the fixes and rebuilding artifacts.

| Check | Result |
| --- | --- |
| Ownership, lifecycle protocol, and startup suites | 98 tests passed. |
| Full CLI non-sync harness, `bb -f cli-e2e/bb.edn test --skip-build` | 98 cases passed, 0 failed, including the upgrade and CLI follow-up suites. |
| Upgrade suite | 46 cases passed, including missing runtime, conflicting publication, alternate root, orphan, directory, and legacy-stop cases. |
| CLI follow-up suite | 6 cases passed. Pending retirement fails explicitly, preserves the ticket/process, and succeeds after publication on retry. |
| 20 graphs and 3 current workers | Health requests decreased from 60 to 6. |
| 20 graphs and 3 legacy workers | Health requests decreased from 63 to 9. |
| CJS syntax and whitespace checks | `node --check` for all four modified scripts and `git diff --check` passed. |

The native Electron check used an isolated profile and graph root at
`/tmp/logseq-review-malformed-20260918`. With `graphs/bad%ZZname` still present,
Desktop opened the Demo graph and accepted a baseline edit. After SIGKILL of the
verified test worker, reloading opened the graph with that text preserved. A
further edit survived another reload. The worker PID changed from 87352 to 99145,
while ownership generation and lock inode remained unchanged. The malformed
directory was preserved. Desktop and worker logs had no error matches.

The CLI, worker, and Electron artifacts were rebuilt to revision
`7dcf33d7ba-dirty` before final runtime verification. An initially stale generated
CLI bundle was explicitly rebuilt and staged. Evidence is recorded in local logs:
`/tmp/logseq-upgrade-red.log`, `/tmp/logseq-lifecycle-regression.log`,
`/tmp/logseq-cli-nonsync-final.log`, `/tmp/logseq-probe-count-final.log`, and
`/tmp/logseq-review-malformed-20260918/desktop-fixed.log`.

These checks exercise local built CLI/Desktop runtimes, not a packaged installer
upgrade. The full CLJS unit suite was not run for these CommonJS-only production
changes. No commit or PR update is part of this request.

## Consequences

- Tolerant enumeration must not turn invalid ownership evidence into permission
  to start a competing worker. Keep filename classification separate from
  registration and endpoint validation.
- Discovery results can become stale while waiting for graph leases. Fresh
  identity checks must protect replacement workers and newly recreated graphs.
- Shared storage can be reached through different root directories; grouping
  only by requesting root or graph name can miss owners or touch another store.
- Request-count reduction must retain orphan detection and the legacy adapter's
  supported upgrade behavior. Removing checks is not an acceptable optimization.
- Failing a legitimate in-progress startup without an endpoint may require the
  caller to retry. A wait policy increases coordination complexity and must not
  deadlock publication.
- The measured 60-request example proves request amplification, not a production
  outage threshold. Do not claim a measured latency improvement without a
  comparable before/after workload.

## Decision record

On 2026-09-18 the user selected immediate explicit failure for a live pending
worker without a published endpoint. No additional waiting path was added.
All exploration questions are resolved.
