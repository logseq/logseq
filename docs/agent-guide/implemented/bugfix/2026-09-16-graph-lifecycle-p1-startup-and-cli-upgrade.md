# Graph Lifecycle P1 Startup and CLI Upgrade

## Problem

[PR #13234](https://github.com/logseq/logseq/pull/13234) has three confirmed P1
findings at revision `5981ee46c3d2910f4940c6012fc52c595d223c76`. All three review
threads were unresolved and current when investigated on 2026-09-16. The user accepted both recommended behavior choices on 2026-09-16. This
decision records the implementation and verification completed on 2026-09-16.

Related decisions:

- [Graph Deletion Worker Lifecycle](../../implemented/bugfix/2026-09-15-graph-deletion-worker-lifecycle.md)
- [Simplify Graph Lifecycle Process Management](../../implemented/architecture/2026-09-16-simplify-graph-lifecycle-process-management.md)

The accepted constraints remain: use Node built-in capabilities, accept the
previously documented rare PID reuse races, and retire old workers without
adopting or migrating their registrations.

### P1-1: Initialization prevents stop and deletion

[Review comment](https://github.com/logseq/logseq/pull/13234#discussion_r4024775233)
points to `deps/graph-lifecycle/index.cjs:156`.

`admit` acquires the SQLite lifecycle lease and returns its release function.
`publish` releases it only after platform initialization, DB initialization,
canonical lock creation, graph opening, and HTTP server startup. A pending
initialization therefore also blocks the operations intended to stop it.

Reproduction with an actual compiled worker and current lifecycle source:

1. Create an isolated graph and start its worker through `startGraph`.
2. Inject a barrier immediately after the real `admit` succeeds, retaining the
   returned runtime so its SQLite connection remains live.
3. Keep initialization pending and invoke `stopGraph` and `deleteGraph`.

| Operation | Observed duration | Result |
| --- | ---: | --- |
| `startGraph` | 30,009 ms | `server-start-failed: Worker failed to become ready` |
| `stopGraph` | 30,013 ms | `database is locked`, SQLite error code 5 |
| `deleteGraph` | 30,014 ms | `database is locked`, SQLite error code 5 |

The worker remained alive. Lifecycle state retained `phase: available` and
`owner.operation: admit`. Normal lifecycle operations could not recover it.

### P1-2: Readiness failure leaves the startup running

[Review comment](https://github.com/logseq/logseq/pull/13234#discussion_r4024775241)
points to `deps/graph-lifecycle/index.cjs:608`.

`startGraph` persists the spawned PID and ticket, then waits for readiness. Its
30-second deadline throws without terminating the child or removing its record.
A later call discovers the same live PID and repeats the wait.

With a barrier before the actual worker's `admit` call:

- The first start failed after 30,005 ms; PID 8080 and its registration survived.
- A second start failed after 30,050 ms, reusing PID 8080 without a new spawn.
- Releasing the barrier allowed that same PID to become ready after both callers
  had already reported failure.

This establishes an orphaned startup attempt, not data loss. If the initialization
never resumes, ordinary reopen attempts keep timing out. If it eventually
resumes, background state diverges from the failed caller's result. Desktop also
installs a managed runtime only after startup succeeds, so its manager does not
retain this failed startup for normal managed-runtime cleanup.

### P1-3: CLI lifecycle operations cannot retire old workers

[Review comment](https://github.com/logseq/logseq/pull/13234#discussion_r4024775268)
points to `cli/lib/server_runtime.ml:297`.

Electron startup invokes `stopOutdatedWorkers`, but the OCaml CLI delegates
start, stop, and deletion directly to the current lifecycle protocol. Discovery
rejects a live canonical lock with no matching worker registration before a
normal CLI operation can retire the old daemon.

Three genuine historical packaged workers at revision `be7c1d1-dirty` were
started in separate temporary graphs. The freshly bundled CLI reported revision
`5981ee46c3`. Each of these commands exited 1:

```sh
logseq server start --root-dir <temporary-root> --graph old-start --output json
logseq server stop --root-dir <temporary-root> --graph old-stop --output json
logseq graph remove --root-dir <temporary-root> --graph old-remove --output json
```

All returned `server-cleanup-failed: Graph lock has an unregistered live owner`.
All three old workers remained alive.

A separate experiment confirmed the deletion consequence:

1. Failed `graph remove` leaves `phase: deletion-failed`.
2. Manual `server cleanup` shuts down the responsive old CLI worker.
3. `server start` still fails with `graph-not-exists` because deletion is pending.
4. Retrying `graph remove` succeeds and advances the phase to `deleted`.

The existing cleanup command is a limited workaround: it currently supplies
revision `unknown`, selects CLI-owned workers, and counts a shutdown HTTP success
as a kill without waiting for process exit. It is not an equivalent automatic
upgrade boundary.

### Evidence boundaries

The first two reproductions used deterministic startup-hang fault injection in
real compiled workers. They prove failure-handling defects under the comments'
stated conditions; they do not establish how often ordinary graph initialization
naturally hangs. The existing worker artifact was labelled `2f3dd44f41-dirty`;
its worker startup source was unchanged through the reviewed HEAD, and the
lifecycle implementation used in the probes was current HEAD. The CLI was freshly
bundled at the reviewed HEAD.

Validation ran on macOS ARM64, using Node 22 and Electron's Node 24 runtime.
Windows and Linux were not rerun for this investigation. All graphs were isolated
and probe workers were terminated afterward. Source files were not modified.

Local investigation artifacts, which are temporary and not repository fixtures:

- `/tmp/logseq-p1-admission-review/reproduce.cjs` and `evidence.json`
- `/tmp/logseq-pr13234-readiness-review/probe.cjs` and `output.jsonl`
- `/tmp/pr13234-p1-cli-reproduction.json`
- `/tmp/pr13234-remove-recovery.json`

The steps and observations above remain the durable evidence if those temporary
files are removed. Permanent regression tests must reproduce the behavior without
depending on those paths or a developer's application backups.

## Decision

Implement the three fixes together using the existing Node-only lifecycle
protocol. No dependency, platform-specific process inspection, compatibility
registration, registry, watchdog, or frontend DB migration was introduced.

### Short admission and serialized publication

`admit` now persists and validates the registration under `withLease`, then
releases exclusion before platform/DB initialization. The returned runtime no
longer owns a release function.

Canonical lock creation has its own short lease. `checkAdmission` verifies both
available generation and the complete registration tuple: PID, ticket,
generation, owner, root, graph storage, lifecycle storage, and repo. A stopped or
replaced ticket cannot create a lock.

`publish` acquires another short lease, verifies registration and lock, writes the
runtime, and invokes a synchronous readiness callback inside that lease. The
worker awaits publication; the callback appends server-list, installs the stop
handler, and sets ready. Publication failure closes the listening server and
rejects startup. Potentially blocking platform and DB initialization remain
outside these critical sections.

`abortAdmission` records a startup failure only while its registration still
exists. It does not recreate a runtime sidecar for a revoked admission.

### Creator-owned startup cancellation

`startGraph` remembers the registration only when that invocation actually
spawned the worker. Any subsequent startup failure invokes `cancelStartup` for
that record before reporting completion. A call that reused a pending worker
cannot cancel it on its own failure. The spawning call cancels even when other
callers are waiting; those callers fail and may retry.

Cancellation acquires the graph lease and rechecks generation and every identity
field. It uses existing discovery, verified termination, exit confirmation, and
matching metadata cleanup, then removes only that ticket. A changed registration
or generation is never cleaned as part of an older attempt. If its old PID remains
alive after identity changes, cancellation fails explicitly.

Successful cleanup preserves the original startup error. Incomplete cleanup
returns `server-start-failed` with both startup and cleanup errors. Existing
close-error acknowledgment semantics remain: an initialization error recorded by
`abortAdmission` can retain a dead record on the first cleanup attempt, report the
recorded error, and allow a subsequent explicit operation to finish cleanup.

### Targeted CLI revision retirement

`stopOutdatedWorkers(storage, revision, repo)` optionally limits candidates using
the target graph's canonical lock PID. Unrelated endpoints are not probed by this
retirement step. The existing whole-root Desktop startup call remains unchanged.
Retirement verifies endpoint, canonical storage, graph, revision and lock, waits
for exit, and returns the retired PID/port identities. Same-revision workers are
preserved; unknown or conflicting identities fail explicitly.

The existing CLI Node platform boundary invokes scoped retirement before local
start, stop, and remove, using `LOGSEQ_CLI_REVISION`. Both CLI- and Electron-owned
mismatched workers are eligible for the requested graph. A successful retirement
satisfies `server stop`; it does not attempt a second stop and return
`server-not-found`. Remote start/ensure/stop paths continue to bypass local worker
management. Public CLI signatures, success JSON, `cli/spec/`, and dune files are
unchanged.

## Alternatives considered

### Increase the readiness or lease timeout

This postpones failure without allowing stop/delete to recover a permanently
hung worker. It also leaves the failed startup's ownership unchanged.

### Release admission without changing publication

This removes one blockage but loses the existing exclusion between initialization
and stop/delete. Current ticket validation and lock cleanup are insufficient for
that change alone.

### Kill every worker observed by a failed open

This can terminate an existing worker shared by another caller. A request's owner
label, such as `cli`, does not prove that request spawned the worker.

### Keep a timed-out child while another caller might still be waiting

This would require explicit shared-attempt ownership or waiter tracking, including
cross-process abandonment. It could preserve slow initialization for another
caller, but adds coordination state and makes bounded cancellation harder. Prefer
one cancellable spawn attempt unless the user requires this guarantee.

### Run whole-root cleanup before every CLI command

This copies Desktop's startup policy into a narrower command. It can stop a
worker serving another graph or let an unrelated failed endpoint block the
requested operation. Scope retirement to the command's graph instead.

### Adopt old registrations or require manual cleanup

Adoption contradicts the accepted no-compatibility policy. Manual cleanup leaves
ordinary upgrade operations broken and does not recover a graph already in
`deletion-failed` without completing its pending deletion. Retire the old process
and register a fresh worker using the current protocol.

### Add another registry, watchdog, dependency, or DB migration

The current lifecycle sidecars, lease, process handles, HTTP endpoint, and Node
signal APIs already provide the required mechanisms. New infrastructure does not
resolve the ownership and ordering defects and increases maintenance obligations.

## Consequences

- Initialization can remain pending without blocking normal stop/delete.
- A newly spawned readiness timeout no longer leaves a live attempt for future
  opens to reuse. Cancellation adds the existing bounded shutdown sequence after
  the readiness deadline, so total failure latency can exceed 30 seconds.
- CLI upgrade and rollback retire only the target graph's mismatched worker.
  This can disconnect an older Desktop client using that graph, as accepted.
- Graph data, deletion-failed recovery, ownership restrictions for same-revision
  workers, and persistent registration formats remain unchanged.
- Process-instance identity and zombie detection retain the limitations of the
  earlier Node-only decision.

## Implementation evidence (2026-09-16)

### Permanent regression coverage

- `graph_lifecycle_startup_test.cjs`: after-admission and before-publication
  stop/delete; creator timeout and retry with preserved data; observer timeout
  without cancellation; revoked publication; original plus cleanup failure.
- Four additional race cases resume initialization only after stop/delete holds
  the lease and await a `continued` acknowledgment. They verify exit, absence of
  late lock/runtime/server-list publications, preserved data, and a usable
  replacement worker, including deletion/recreation.
- `graph_lifecycle_upgrade_test.cjs`: current CLI start/stop/remove against
  independently running historical-protocol fixtures for both owners, target
  filtering despite an unrelated invalid endpoint, current revision protection,
  and existing storage/identity protections.
- Fixtures use isolated roots and observable file barriers. New test cleanup
  waits for process exit before removing storage. The startup suite is registered
  in the existing CLI non-sync process-protocol case.

### Executed checks

| Check | Result |
| --- | --- |
| Lifecycle protocol and startup tests | 70 passed; the 4 added resumed-initialization races also passed with acknowledgment |
| Upgrade tests, including real CLI entry points | 24 passed |
| CLI non-sync suite | 98 cases passed, 0 failed; the 4 additional race cases were then run separately |
| CLI unit/business tests (`pnpm --dir cli test`) | 235 passed |
| `frontend.worker.db-worker-node-test` | 55 tests, 320 assertions passed |
| `electron.db-worker-manager-test` | 31 tests, 82 assertions passed |
| `electron-import-and-download-open-real-worker-in-fresh-graphs` | 1 test, 7 assertions passed |
| Actual Electron main-process lifecycle harness | Custom storage, reuse, stop/reopen, parallel graphs, recovery and deletion passed |
| Actual Electron ready-handler harness | Old worker exits before window creation, current revision retained, reopen/repeat startup succeeds, invalid identity blocks startup |
| CLI, CLJS test and production worker/Electron builds | Passed |
| Changed CLJS lint and `git diff --check` | Passed |
| Review workflow | All 9 passes completed; suggested resumed-initialization race coverage added |

### Real runtime reproductions after the fix

The same actual compiled-worker admission barrier now allows `stopGraph` to
complete in 5,101 ms and concurrent `deleteGraph` in 5,125 ms. The worker exits,
registration is empty, and the graph reaches `deleted`, compared with the prior
30-second SQLite lock failures.

A separate real compiled-worker readiness probe first initialized a graph and
stored a SQLite sentinel. A later gated attempt failed after 35,149 ms including
termination; PID 45582 was gone and its registration removed. Reopening produced
PID 45770 at revision `5981ee46c3-dirty`. After normal stop, the database sentinel
still read `preserved`. An initial verification attempt queried the database while
the worker held its database lock; the probe was corrected to read after stop.

The genuine packaged `be7c1d1-dirty` CLI was used to create and start isolated
historical graphs. Current CLI `server start`, `server stop`, and `graph remove`
all exited 0. The remaining started worker reported `5981ee46c3-dirty`; final
normal stop confirmed its exit.

Computer-use verification used isolated copies of Desktop `2f3dd44f41` and the
current packaged `5981ee46c3-dirty`, separate HOME/profile/storage, and the graph
`P1 Startup Switch`. The old UI created a journal sentinel. Current CLI then
retired its Electron worker (PID 59538); the new UI displayed the sentinel and
accepted another block. Old and new Desktop subsequently reopened both blocks.
Finally, new Desktop startup retired old CLI PID 59850 and opened current
Electron worker PID 59886. External normal lifecycle stop confirmed the latter's
exit. The installed application and personal graphs were not replaced or edited.

GUI teardown had a separate limitation: closed-window test app processes did not
always exit, and one old worker remained a zombie until its old parent was
terminated. Exact test processes were forcibly cleaned before relaunch. This
verification establishes graph reopen, revision retirement and editing; it does
not claim that every Desktop quit path now exits gracefully. The Node-only zombie
limitation was explicitly accepted before this change.

Validation ran on macOS ARM64 with Node 22 and Electron 42.3.0 / Node 24.
Windows and Linux were not executed in this implementation pass.

Temporary supporting logs (not required by permanent tests):

- `/tmp/graph-p1-red.log`, `/tmp/graph-p1-red-startup.log`
- `/tmp/graph-p1-green.log`, `/tmp/graph-p1-late-init-ack.log`
- `/tmp/graph-p1-upgrade-green.log`, `/tmp/graph-p1-cli-e2e.log`
- `/tmp/graph-p1-real-admission.log`, `/tmp/graph-p1-real-timeout.log`
- `/tmp/graph-p1-historical-cli.log`, `/tmp/logseq-p1-desktop-ui/`

## Risks

- Releasing admission changes the synchronization model around DB opening, lock
  creation, and publication. Incorrect ordering can turn a recoverable startup
  failure into an unexpected lock or a revived worker after deletion.
- A 30-second deadline can cancel legitimately slow initialization. Changing the
  deadline is outside this proposal; cancellation ownership must be explicit.
- Targeted cross-owner retirement can disconnect Desktop clients using that same
  graph. Whole-root retirement would expand that impact to unrelated graphs.
- A shutdown failure or permission error can prevent full cleanup. Keep enough
  matching state for diagnosis/retry rather than pretending the worker exited.
- The previously accepted PID reuse and zombie limitations remain. Metadata
  correlation is not proof of OS process-instance identity.
- Historical test artifacts may be unavailable in CI. A reproducible protocol
  fixture must capture the demonstrated old endpoint/lock behavior, with genuine
  historical-package validation retained as separate supporting evidence.


## CI follow-up: consistent build revisions (2026-09-16)

[Ubuntu CLI E2E job 104800904293](https://github.com/logseq/logseq/actions/runs/35098255711/job/104800904293)
failed at case 20, `node-list-renders-block-ref-labels-json`, with
`Failure(fetch failed)` after 19 passing cases. The failing upsert command logged
three worker terminations; the earlier `graph-import-json` case passed.

The new automatic retirement path exposes a pre-existing disagreement between
build metadata generators. CLI used `git rev-parse --short HEAD` plus
`git diff-index --quiet`; Shadow used `git describe --long --always --dirty`.
A temporary Git fixture reproduced two disagreements:

- Updating only a tracked file's timestamp produced `SHA-dirty` for CLI and
  `SHA` for the worker, despite an empty content diff. `describe` refreshes the
  index before deciding whether the worktree is dirty.
- An annotated tag produced `SHA` for CLI and `tag-0-gSHA` for the worker.

Revision mismatch retires the worker before each local ensure operation.
Repeated operations within a command can therefore restart workers and invalidate
an already selected HTTP endpoint. The CI log does not include the actual two
revision strings; the diagnosis is supported by its repeated termination path
and the deterministic metadata and runtime reproductions, rather than a direct
read of the runner's artifacts.

CLI now uses the same `git describe --long --always --dirty` invocation as
Shadow. Explicit `LOGSEQ_REVISION` overrides remain unchanged, and runtime
revision comparison remains strict. No automatic retry, relaxed identity check,
or compatibility normalization was added.

`cli_build_revision_test.mjs` covers clean, timestamp-only, modified and tagged
worktrees plus explicit overrides using real temporary Git repositories and the
actual Vite configuration. The timestamp and tag tests failed before the fix and
all five passed afterward. A real CLI regression checks that consecutive commands
retain one worker PID; it failed with mismatched local artifacts and passed after
rebuilding both artifacts with equal revisions. Both tests are included in the
existing non-sync lifecycle case.

Post-fix verification used freshly rebuilt CLI and worker artifacts, both
reporting `ba70aafca7-dirty`. On macOS ARM64 with Electron's Node 24.15.0 runtime:

- The original `node-list-renders-block-ref-labels-json` case passed and returned
  `Task [[RefNodePage]]`.
- The consecutive-command PID reuse regression passed.
- The complete CLI non-sync suite, using `--skip-build --jobs 1 --verbose`, passed
  all 98 cases in 375.18 seconds, including the new regression tests.
- `git diff --check` and `spec-dev-tool check --all` passed.

Ubuntu was not rerun locally, and the remote CI job has not validated this
uncommitted patch. The verified Git metadata disagreement is platform-independent;
confirmation of the exact Ubuntu failure remains dependent on the next CI run.
