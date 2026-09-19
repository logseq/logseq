# Replace db-worker.lock with a SQLite Ownership Lock

## Problem

A user reported that a nightly build could no longer open an existing graph
after filesystem problems involving OneDrive and a macOS reboot. The graph name
remained visible, but its contents appeared absent. Removing `db-worker.lock`
and restarting restored access. The original lock, logs, and exact build are
unavailable, so the OneDrive failure mechanism is not established.

The current JSON lock records a PID and application identity. It can survive its
owner, become unreadable after an interrupted write, or refer to a reused PID.
These conditions can prevent startup before SQLite opens the graph. A local
experiment against the production lifecycle module and a fixture worker showed:

| Input | Observed result |
| --- | --- |
| Valid lock with an absent PID | Startup removes it and reaches ready. |
| Lock pointing to an unrelated live PID, without worker registration | Startup fails with `Graph lock has an unregistered live owner`. |
| Empty lock | JSON parsing fails; removing the lock allows startup. |

These experiments preserved a sentinel file, not a real graph database. They did
not reproduce the reported Desktop UI, OneDrive activity, or reboot.

The user requests an exploring document for replacing this lock with
`lock.sqlite`, ensuring application-version transitions, and removing obsolete
`db-worker.lock` logic. Migration is explicitly authorized for this change; it is
a narrow exception to the repository's default rule against compatibility code.

## Decision

### Scope and existing constraints

Use a dedicated `node:sqlite` connection per graph to hold a write transaction
throughout worker ownership. Keep the current process boundaries: Electron and
CLI coordinate graph-bound workers through the shared lifecycle module. Add no
supervisor, native addon, third-party lock library, or OS process inspector.

Keep graph generations, admission tickets, canonical storage identity, HTTP
discovery, readiness, shutdown draining, and lifecycle operation serialization.
This changes the ownership protocol, not graph schemas or sync algorithms.

The user resolved the exploration questions on 2026-09-18:

- Support sequential upgrades only, after closing old application instances.
  Concurrent old/new access and downgrade/rollback support are outside scope.
- If legacy worker identity cannot be established, stop automatic migration,
  preserve diagnostic evidence, and require old instances and daemons to be
  closed before explicit offline recovery. Do not infer exit from HTTP failure.

Closing an old application window does not establish that its daemon or a
CLI-owned worker has exited. Verified legacy-daemon retirement remains part of
the upgrade flow. The user authorized implementation on 2026-09-18.

The following sources own the relevant behavior:

| Source | Responsibility |
| --- | --- |
| `deps/graph-lifecycle/index.cjs` | Lifecycle lease, registration, discovery, startup, stop, deletion, and outdated-worker retirement. |
| `src/main/frontend/worker/db_worker_node_lock.cljs` | JSON lock creation, PID checks, and ownership assertions; also contains unrelated path and owner helpers. |
| `src/main/frontend/worker/db_worker_node.cljs` | Admission, resource initialization, write guards, health payload, publication, and shutdown. |
| `src/main/frontend/worker/platform/node.cljs` | SQLite connections, backups, imports, and filesystem write guards. |
| `src/main/frontend/worker/db_core.cljs` | Graph connections, exclusive SQLite mode, and close/import/reopen flows. |
| `src/main/logseq/cli/server.cljs`, `src/electron/electron/db_worker.cljs` | Desktop lifecycle and upgrade entry points. |
| `cli/lib/platform/node/cli_unix.ml`, `cli/lib/server_runtime.ml` | CLI lifecycle bridge and old lock-path helper. |

This proposal supersedes JSON graph-lock ownership requirements in
`docs/agent-guide/implemented/architecture/2026-09-16-simplify-graph-lifecycle-process-management.md`
and the graph-deletion lifecycle decisions. Their historical test results remain
historical evidence; update their current-contract references during implementation.

### Lock location and identity

Use one stable path of the form
`<local-runtime-root>/<canonical-graph-path-hash>/lock.sqlite`. Resolve the graph
identity through one shared function for CLI and Electron. Aliased paths and
different configured roots pointing to the same physical graph must converge.
Do not key by PID, admission ticket, app version, or graph generation.

The runtime root must be local and outside graph sync, backup, export, and
`Unlinked graphs` directories. Use a shared per-user location independent of the
Electron installation or profile: for example, `Logseq/runtime-locks` under the
platform's local application-state directory. The shared resolver uses the OS account home from `os.userInfo().homedir`,
independent of process `HOME` overrides: `~/Library/Application Support/Logseq/runtime-locks`
on macOS, `~/.local/state/Logseq/runtime-locks` on Linux, and
`~/AppData/Local/Logseq/runtime-locks` on Windows. It intentionally ignores
application profiles, graph roots, and environment lock-root overrides. Tests use
unique temporary canonical graph paths, giving each test its own hash directory. Arbitrary per-process
overrides must not silently let two clients choose different lock namespaces.

`resolveStorage` currently places lifecycle metadata beside the graphs directory;
that directory is not automatically suitable for this new lock. Preserve the
existing management lease for coordination with supported old clients during
transition. Moving every lifecycle record is a separate decision. Existing state
files can still suffer I/O or parsing failures; this change is not a general
repair for synchronized storage.

Keep `lock.sqlite` after release, graph deletion, and recreation at the same path.
Do not unlink, rename, replace, sync, or periodically garbage-collect it while
another client could reference it. A moved graph gets its destination identity
only after the old worker has stopped and the move has completed under lifecycle
coordination. Same-path recreation retains the same lock resource and receives a
new graph generation.

### Ownership primitive

1. Open `lock.sqlite` with `DatabaseSync`.
2. Execute `BEGIN IMMEDIATE` without a long busy timeout.
3. Keep the connection and transaction alive until all graph resources close.
4. Execute `ROLLBACK` and close the connection to release ownership.

No application table or persistent `locked` flag is necessary. File existence,
contents, timestamps, and PID metadata do not establish ownership. Keep this
connection private and perform no unrelated SQL on it. Graph transactions use
their existing connections and commit normally.

Treat `SQLITE_BUSY` as contention. Propagate permissions, corruption, disk, and
other SQLite errors distinctly; never delete or recreate the lock database to
work around them. Unexpected loss of the transaction or connection is fatal to
the worker's write authority. A cached boolean alone must not authorize writes
after release or failure.

A separate local two-process Node experiment confirmed that an active write
transaction rejects a contender with `SQLITE_BUSY`; after killing its owner with
`SIGKILL`, the contender acquires the transaction without deleting the file.
This is primitive-level evidence, not integration or reboot verification.

### Worker and management lifecycle

| Stage | Required ordering |
| --- | --- |
| Admission | Under the existing lifecycle lease, validate generation and registration, then try the ownership lock before opening graph resources. |
| Initialization | Retain ownership while opening `db.sqlite`, search, client-ops, vector indexes, and graph-scoped background work. |
| Publication | Publish the endpoint only after initialization and admission checks succeed; retain ownership after publication. |
| Import/reopen | Retain the ownership connection while data connections close, files are replaced, and resources reopen. |
| Shutdown | Stop accepting work, drain requests and background work, close graph resources, then release ownership. |
| Failed startup | Close every partially opened graph resource before release. If closure cannot be established, terminate the worker so OS cleanup releases its resources together. |
| Deletion/move | Stop the worker, obtain the ownership lock as the management operation, revalidate generation, and hold it throughout filesystem mutation. Preserve the separate stop/exit checks required by the deletion contract. |

Keep the short management lease and long ownership lock as separate SQLite files.
While holding the management lease, acquisition of the ownership lock must be
nonblocking. Do not hold the management lease while waiting indefinitely for a
worker to acquire ownership. Shutdown must be able to close resources and release
ownership without reacquiring a lease held by the caller awaiting shutdown.

New workers reuse existing ticket, generation, PID, storage, and owner-source
fields for endpoint correlation. Remove the redundant graph `lock-id` and
embedded JSON lock from the new publication and health contracts. Health confirms
the endpoint identity; the ownership transaction enforces exclusion.

Publish an explicit ownership-protocol discriminator, such as
`ownership-protocol: "sqlite-v1"`, in new registration/runtime and health records.
Validate agreement before adopting or retiring a new-protocol worker. A revision
mismatch alone must not select the legacy adapter: future SQLite-lock releases
also need normal version retirement without a JSON lock. Recognize supported
old formats only within the migration adapter, and reject unknown protocols.

Replace JSON ownership assertions with retained ownership plus admission and
generation checks across SQLite, assets, backup, and other existing write guards.
Do not remove the guards themselves. Cover non-HTTP background writers as well.

Revisit stale PID gates in discovery and `acquireLease`: successfully acquiring
an OS-backed lease must not subsequently be rejected solely because a saved
owner PID was reused. Under management serialization, distinguish a worker still
initializing from an abandoned registration; revoke an abandoned ticket before
admitting a replacement. A delayed old startup must fail its admission check.
Do not kill an unrelated live PID merely because ownership can now be acquired.
Malformed lifecycle metadata remains an explicit error rather than defaulting to
an empty registration list.

### Application upgrade and legacy retirement

**Acquiring `lock.sqlite` does not exclude an old worker.** Old binaries do not
participate in this protocol. A migration marker also cannot force an already
released binary to honor a new lock. This is a version-transition requirement,
not an implementation detail that can be solved by renaming the file.

Confirmed scope: sequential upgrades, with old application instances closed and
legacy daemons retired before the new worker starts. Concurrent old/new access
and downgrade/rollback support are outside scope. Retain existing `db.sqlite`
exclusive mode as a data-access safeguard, but do not mistake it for graph-wide
protection during import/reopen or asset writes.

Use an isolated, bounded legacy-retirement adapter, entered before new admission
for an affected graph. It must serve both Desktop and CLI, including direct
worker startup paths that might otherwise bypass migration. Desktop's existing
pre-window retirement and CLI's graph-targeted retirement must retain their
appropriate scope.

Transition sequence within the confirmed scope:

1. Resolve canonical storage and inspect legacy evidence without changing graph
   data. A saved migration-complete result must not hide newly observed legacy
   artifacts after cloud restoration or external use of an older binary.
   Classifying those artifacts does not imply support for downgrade or mixed use.
2. Under management coordination, discover a supported legacy worker using its
   publication and `/healthz`. Validate PID, port, graph, root/storage, revision,
   owner source, and all identity fields provided by that supported protocol.
   For the historical protocol already supported by current upgrade tests,
   `/healthz` may omit `lock-id`; preserve its narrow, documented disk-lock
   correlation inside this adapter only.
3. Request shutdown of a verified legacy worker and establish exit before
   cleanup. Preserve the existing bounded escalation policy for an identified
   worker; a mismatched endpoint or unknown live PID is not permission to signal.
   An HTTP shutdown acknowledgement or free new SQLite lock alone is insufficient.
4. Recheck the exact legacy records before removing them. Preserve a replacement
   lock or changed registration; fail the transition instead of deleting another
   owner's evidence. Remove only the retired worker's publications and metadata.
5. Remove an obsolete `db-worker.lock` only after legacy ownership has been
   resolved. Preserve graph data, WAL files, assets, backups, and graph generation.
6. Admit a new worker through the normal SQLite-lock path. Repeated transitions
   and crashes between steps must be retryable without undoing successful cleanup
   or reporting a failed initialization as a migrated, ready graph.

Handle legacy cases explicitly:

| Legacy state | Transition behavior |
| --- | --- |
| Responsive, identity-matched old daemon, either CLI- or Electron-owned | Stop, establish exit, remove matching legacy metadata, then start the new worker. |
| Valid residual lock with absent PID and no conflicting live worker | Recheck and remove it under transition coordination. |
| Reused or unidentified live PID; unreachable or conflicting endpoint | Stop automatic migration, preserve evidence, and require old instances/daemons to be closed before explicit offline recovery. |
| Empty/malformed lock but sufficient independent registration/publication evidence | Use the validated evidence to retire the owner; clean the malformed artifact only after retirement and unchanged-file checks. |
| Empty/malformed lock without sufficient evidence | Stop automatic migration and require old instances/daemons to be closed before explicit offline recovery; the new lock is not proof that an old worker is absent. |
| No old owner, but the new lock is busy | Another new-protocol owner exists; follow new discovery/reuse or report contention. |
| Old lock reappears after a previous transition | Re-enter legacy classification; do not trust a one-time completion flag. |

Inventory the concrete pre-change binaries and health formats already supported
by `graph_lifecycle_upgrade_test.cjs`; record the tested revisions before marking
implementation complete. This migration does not extend support to arbitrary
historical formats or add permissive readers to the new runtime.

### Unverifiable legacy ownership and unsupported transitions

When independent evidence cannot establish the legacy owner's identity, report
the affected graph and available lock/publication diagnostics without starting
the new worker, removing the legacy lock, or signaling an unidentified PID.
Require the old application instances and daemons to be closed before an explicit
offline recovery. A normal retry must not silently force recovery after a timeout.
The recovery procedure must preserve graph data and recheck the affected legacy
artifacts before cleanup; do not weaken normal startup to handle this exception.

Downgrade/rollback and simultaneous old/new application access are outside the
confirmed scope. Do not add reverse migration, dual-lock writes, or an automatic
rollback operation. A new-only format marker cannot enforce safety in old
binaries that ignore it. Document the sequential-upgrade requirement with the
release; do not describe unsupported transitions as safe.

### Removal of old runtime logic

The new steady-state path must neither create nor parse `db-worker.lock`.

- Remove JSON create/read/remove/assert helpers and their PID-based graph-lock
  recovery. Move still-used path canonicalization and owner-source helpers to
  their existing shared owners before deleting the obsolete namespace.
- Remove lock payloads and graph `lock-id` dependencies from publication,
  readiness, request checks, stop, deletion, revision cleanup, and startup-error
  callbacks. Replace them with ownership-handle and existing identity checks.
- Remove old graph lock-path helpers from both CLI implementations and update
  platform directory-cleanup exclusions.
- Update lifecycle fixtures, Node/CLJS tests, CLI/Desktop tests, and graph
  deletion assertions to exercise ownership rather than JSON file existence.
- Keep old-format readers only in the explicitly named migration adapter and
  historical migration fixtures. They must never create a legacy lock for a new
  worker or choose the old protocol as a fallback after SQLite failure.
- Retire that adapter once the minimum supported upgrade source is a
  SQLite-lock release. Document the support window with the release change.
- Do not remove unrelated `server-list.lock` logic or its `lock-id` fields in a
  blanket search-and-replace. It is a separate mechanism and a remaining possible
  source of stale-metadata failures.

The user-facing startup failure must remain distinguishable from an empty graph.
Any accompanying UI change requires the repository i18n workflow and a separate
Desktop reproduction; this document does not claim the reported UI is verified.

## Alternatives considered

### Keep JSON locks and improve stale-owner heuristics

This preserves partial-write and stale-file recovery complexity. PID and HTTP
checks alone cannot distinguish every reused PID from an unresponsive worker.

### Use only db.sqlite exclusive locking

The current graph code already enables `locking_mode=EXCLUSIVE` and WAL. It
supports normal commits while retaining the connection's file lock. A local
two-process experiment confirmed exclusion after commit, backup through the
owning connection, and reopening after `SIGKILL` with committed data intact.

However, graph import explicitly closes and overwrites the data database before
reopening it. Graph ownership also covers search, client-ops, assets, and other
resources. The requested dedicated lock can remain held across all of those
operations without tying ownership to a particular data connection.

### Hold the existing lifecycle lease for the worker lifetime

This would block management operations needed to stop, publish, or delete the
worker. Keep operation serialization and worker ownership separate.

### Native locks, socket ownership, or a supervisor

These require different platform integration or coordination contracts. The
SQLite primitive is already available in the supported Node/Electron runtimes.

### Permanently acquire both old and new locks

This would retain the fragile JSON path and conflict with the requested cleanup.
The user selected sequential upgrades after closing old instances, so permanent
dual locking for mixed-version execution is outside scope.

## Acceptance criteria

- Exactly one new-protocol worker can own a graph across Desktop, CLI, direct
  daemon startup, different roots, and canonical path aliases.
- Ownership remains held through initialization, normal transactions, backups,
  imports, close/reopen operations, request draining, and final resource closure.
- A suspended or HTTP-unresponsive owner still excludes contenders. Graceful
  exit, startup failure, and process death release ownership at the proper point.
- Tests kill an owned disposable worker and reopen a real graph with committed
  data intact; they do not merely check a sentinel or fixture readiness response.
- Permissions and corrupt lock databases fail explicitly without lock-file
  deletion or fallback. No test deletes an in-use ownership database to recover.
- Parent death before admission, startup cancellation, delayed publication,
  deletion/recreation, and failed resource closure preserve exclusion and
  generation fencing. Tests verify lock order and absence of shutdown deadlocks.
- A reused PID in new-protocol metadata does not independently veto an otherwise
  authorized recovery or authorize signaling an unrelated process. Unknown or
  conflicting legacy evidence follows the separate migration policy.
- Supported old workers are retired before new graph resources open. Include
  CLI-owned daemons surviving an app upgrade and multiple affected graphs.
- Migration tests cover absent/dead/malformed/replaced legacy locks, missing
  historical health fields, endpoint mismatch, unavailable endpoints, and
  interruption before and after cleanup. Unrelated graphs and roots remain intact.
- Run old -> new and SQLite-lock release -> subsequent SQLite-lock release
  upgrades using real packaged apps and isolated storage, closing the previous
  application before each upgrade and verifying edits after each transition.
  Include leftover CLI-owned daemons, cold starts, and crash-recovery cases.
  Downgrade and mixed-version operation are not acceptance requirements.
- Unverifiable legacy identity stops automatic migration with the original
  evidence preserved. Ordinary retries do not delete the lock or signal the
  unidentified PID. Exercise explicit offline recovery only after old instances
  and daemons are closed.
- Tests demonstrate that a busy new lock does not prove anything about a legacy
  worker, and a free new lock does not authorize deleting unidentified old locks.
- `db-worker.lock` references remain only in the bounded migration adapter,
  historical fixtures, and explanatory documentation. No new worker creates one.
- Validate real worker, CLI, and Electron paths on macOS, Linux, and Windows;
  record unavailable platforms and reboot/OneDrive evidence as gaps.

Implementation verification should reuse the existing lifecycle protocol,
startup, upgrade, CLI, and Electron suites under `cli-e2e/scripts/`, plus
`frontend.worker.db-worker-node-test`, the replacement ownership-lock tests,
`electron.db-worker-manager-test`, `frontend.persist-db-test`, and platform
import/backup tests. Rebuild changed artifacts before reuse, and run applicable
linters and document checks. Do not infer OneDrive or OS-reboot coverage from a
local `SIGKILL` test.

## Consequences

New-protocol ownership no longer depends on a persistent JSON lock or a saved
PID. A stable local SQLite transaction spans graph resource lifetimes, including
imports and close/reopen operations. The bounded migration adapter remains only
for the explicitly supported sequential-upgrade window.

- OS file locks are local exclusion, not a distributed lock across cloud copies.
  Syncing or replacing the ownership file can defeat the stable-file assumption.
- Different lock-root resolution between CLI and Desktop would split ownership;
  the shared resolver and alias tests are correctness requirements.
- Old binaries cannot be retroactively made to honor `lock.sqlite`. Concurrent
  mixed-version use and downgrade/rollback are explicitly unsupported; the
  release must communicate the sequential-upgrade requirement.
- Historical workers predating reliable identity metadata cannot always be
  retired automatically. Retaining a bounded migration reader is necessary for
  the requested update support, even while the steady-state JSON path is removed.
- Existing lifecycle metadata and server-list locking can still block startup
  independently. This change must not claim to eliminate all stale-state or
  OneDrive-related failures.
- The new lock database can suffer filesystem errors or corruption. It must fail
  explicitly; automatic replacement could create two independent lock resources.
- Releasing ownership before asset/background work or failed resource closure
  finishes would allow overlapping writers even if SQLite acquisition is correct.
- The reported empty/create-graph UI needs its own runtime evidence and fix.

References: [SQLite transactions](https://www.sqlite.org/lang_transaction.html),
[SQLite exclusive locking](https://www.sqlite.org/pragma.html#pragma_locking_mode),
and [SQLite file replacement hazards](https://www.sqlite.org/howtocorrupt.html#_unlinking_or_renaming_a_database_file_while_in_use).

## Questions

Both questions were answered by the user on 2026-09-18. No user questions remain
open; implementation is now authorized.

- **Q1 — Version-transition scope. Resolved:** Support only sequential upgrades
  after closing old application instances. Retire any verified remaining daemons
  before new ownership begins. Do not include concurrent mixed-version execution
  or downgrade/rollback support.
- **Q2 — Unverifiable legacy ownership. Resolved:** Follow the recommended
  fail-closed policy: stop automatic migration, preserve diagnostics, and require
  old instances and daemons to be closed before explicit offline recovery. Do not
  treat HTTP failure or a free new SQLite lock as proof that an old worker exited.

## Implementation plan

1. Write ownership, lifecycle fencing, and bounded migration regression tests.
2. Observe failures against the existing JSON ownership implementation.
3. Implement the shared SQLite ownership primitive and legacy retirement adapter.
4. Wire worker admission, guarded writes, shutdown, management mutation, and CLI paths.
5. Update obsolete fixtures and run Node, CLJS, CLI, and Electron verification.
6. Record results, platform/package verification gaps, and lock file contents.

## Implementation and verification record

Implementation started from repository revision
`3103543b660d572cb4c62dd194b37a1126dc2504` on macOS ARM64. The new development
worker and CLI report `3103543b66-dirty`; Electron runtime verification uses
Electron 42.3.0 and the Node tests use Node 22.21.1.

The production ownership primitive is in `deps/graph-lifecycle/ownership.cjs`.
Its connection is private, assertions inspect `isOpen` and `isTransaction`, and
only SQLite busy maps to `repo-locked`. The lifetime does not depend on PID
metadata. `index.cjs` keeps operation leases short, fences pending admissions,
checks generation/registration on writes, and retains ownership during moves.
A worker waiting for admission checks cancellation without reacquiring the lease,
so another process can revoke its ticket and wait for exit without deadlock.

`legacy-retirement.cjs` is the only production graph JSON-lock reader. It checks
raw disk evidence and registration identity before and after verified shutdown.
Missing historical health lock IDs are accepted only with the corresponding disk
identity. Damaged disk artifacts require independent registered endpoint evidence.
Unknown ownership protocols never enter a fallback path. New-runtime records and
health have no embedded graph lock or graph lock ID.

The Node platform guards SQLite and vector operations as well as filesystem
writes. Its resource scope rejects new asynchronous writers while draining and
waits for pending writes before data connections close. Partial initialization
registers each opened data connection immediately so startup cleanup closes it.
Successful shutdown uninstalls graph logging before releasing ownership; failed
closure retains ownership until the standalone worker exits.

The obsolete CLJS graph-lock namespace and its JSON-lock tests are removed.
Shared directory decoding lives in `logseq.common.graph-dir`; owner normalization
uses `logseq.db-worker.daemon`. After explicit user authorization, the obsolete
OCaml `lock_path` interface, implementation, and path-only parity test were also
removed. Production `db-worker.lock` references now remain only in the bounded
legacy adapter. The separate server-list lock remains unchanged.

### Verification evidence

- The initial 13 ownership regression tests failed against the original code;
  they passed after the ownership implementation. Subsequent regressions cover
  permission/corruption errors, transaction loss, HOME isolation, malformed
  lifecycle state, partial real-worker initialization, and real graph data after
  `SIGKILL`.
- Related CLJS suites: 161 tests, 679 assertions, zero failures or errors.
- OCaml CLI: 273 tests passed after removal of the obsolete interface. The first
  run exposed five stderr regressions caused by eagerly loading `node:sqlite`;
  loading it only when acquiring ownership fixed those existing tests without
  suppressing warnings. `dune build @all` and formatting checks passed.
- After that fix, all 22 ownership tests and 11 CLI lifecycle follow-up tests
  passed against the rebuilt CLI bundle.
- Full CLI non-sync suite: 98 cases passed in the final fresh run (144.93s),
  including the ownership suite in its lifecycle case.
- Real-process Python graph deletion: 7 tests passed.
- Electron main-process tests passed canonical alias reuse, custom storage,
  shutdown/reopen, parallel generations, recovery resource cleanup, and deletion
  fencing. The real ready handler retired old workers before window creation and
  blocked window creation for unverified legacy identity.
- `bb lint:dev` passed clj-kondo, carve, large-vars, worker/frontend separation,
  translation validation, and namespace docstring checks.

The supported legacy fixtures reproduce the ticket/generation JSON protocol at
the pre-change source revision and the older pre-registration format already
covered by the existing upgrade suite. Their revision strings `old`,
`previous-build`, and `current` are synthetic test labels, not historical release
binary identities. Tests also cover SQLite-protocol revision retirement without
creating a JSON lock, multiple owners/graphs, restored artifacts, replaced
registrations, and malformed locks with independent evidence.

### Packaged macOS upgrade verification

`cli-e2e/scripts/graph_packaged_upgrade_probe.cjs` passed the complete packaged
CLI/worker chain on macOS ARM64. It uses each application's own executable and
`app.asar/js/logseq-cli.js`; no package is patched or supplemented with repository
dependencies. The old CLI commands exit before upgrade, leaving their CLI-owned
daemons running in isolated storage. No GUI instance accesses the test graphs.

| Package | Revision | app.asar SHA-256 |
| --- | --- | --- |
| Installed Logseq 2.0.1, built 2026-09-16T08:44:34.359Z | `2f3dd44f41` | `1b2ffac10d410f02602910443cdd636ff3298009a8f1478fdbb20ef290ee252a` |
| Local SQLite package A | `3103543b66-dirty` | `53c9127c56f0074c7a19067a3ca2de2d838588be8ff38ed132ea68f0f454a464` |
| Local SQLite package B | `3103543b66-dirty-sqlite-upgrade-next` | `21a623d4bda2709d2c0b69dda85c9504863519652d9e254607792db4d5fce330` |

Both local packages use Electron 42.3.0 / Node 24.15.0, release-compiled CLJS,
bundled workers and CLI, and the repository's unsigned Electron packaging flow.
Package B deliberately uses the same source with a different `LOGSEQ_REVISION`
to exercise SQLite-protocol revision retirement. It is a real local package,
not a claim that a subsequent public release already exists.

The chain checks two graphs through old -> A -> B. At each transition, the
identified previous worker exits, page contents and generation remain intact,
the JSON graph lock is absent, and the new worker reports `sqlite-v1`. Targeted
retirement leaves the other graph's daemon alive. New edits survive both cold
starts and `SIGKILL` recovery, with the ownership file inode unchanged. The
historical health response provides ticket, generation, lock ID, root/storage,
owner source, and revision `2f3dd44f41`.

The same probe verifies explicit offline recovery: after all test workers stop,
it introduces a malformed historical artifact, checks that repeated starts
preserve it, saves diagnostic copies, and removes only the unchanged legacy
artifact under the management lease. Existing data, a new edit, generation, and
the ownership inode survive. This is an isolated operator-procedure test, not a
new automatic recovery path.

The successful command was:

```sh
node cli-e2e/scripts/graph_packaged_upgrade_probe.cjs \
  /Applications/Logseq.app \
  /tmp/logseq-sqlite-package-a/mac-arm64/Logseq.app \
  /tmp/logseq-sqlite-package-b/mac-arm64/Logseq.app
```

Output is recorded in `/tmp/logseq-packaged-upgrade-chain-final.log`. An earlier
probe against the old package's root `db-worker-node.js` failed because that
unbundled artifact needs `chrono-node`; the successful packaged chain uses the
intended `js/` runtime entry points with no override.

Linux, Windows, OneDrive activity, OS reboot, and the originally reported
empty/create-graph failure remain explicitly unverified. The packaged chain
exercises CLI and worker behavior. Actual packaged-window and browser checks
were subsequently performed as described below.

CLI verification must refresh each local file dependency installation, including
`static` and `cli` with `pnpm install --ignore-workspace`, and regenerate the Vite
bundle after CJS dependency edits. The existing Dune bundle rule does not track
those CJS files; an unchanged cached bundle is not valid evidence for this change.

### Desktop, CLI, and Web UI verification (2026-09-18)

Actual macOS windows were controlled through accessibility UI actions. Copies of
the installed legacy package and SQLite package A used distinct test bundle IDs,
an isolated HOME and graph root, and the same isolated Electron profile across
the upgrade. Application JavaScript was unchanged. The personal running Logseq
instance and its graph were not stopped or modified. Test artifacts and logs
remain under `/tmp/logseq-ownership-ui/`.

| Scenario | Observed result |
| --- | --- |
| Legacy GUI creates `desktop-upgrade-probe` and writes a journal block | The block appears in the legacy window. Normal application quit stops its workers. |
| Legacy packaged CLI starts a surviving daemon; new GUI opens the same profile and graph | New startup gracefully retires legacy PID 80192 before creating the window. New worker PID 80398 opens the same generation and displays the old block without manual lock deletion. |
| New GUI edits the old block; new packaged CLI reads it | CLI returns the new title. Renderer reload retains it. |
| New packaged CLI adds a block while Desktop is open | The new block appears in Desktop without a manual refresh. |
| New Desktop quits and cold-starts | Both the GUI edit and CLI-created block remain visible. |
| Test worker PID 80683 receives SIGKILL; Desktop reloads | Worker PID 80856 replaces it. Both blocks return, and another GUI edit is confirmed by CLI. |
| Current Web release served on localhost:3017 in Chrome | Creating a named graph, editing a journal block, and reloading preserve the graph and complete block text. No console errors were observed; the browser reports the existing OPFS storage-pressure warning. |

`new.log` records legacy retirement, `new-reopen.log` records the cold start,
and `cli-after-recovery-edit.json` contains both persisted titles after crash
recovery. Local directory packages lack `app-update.yml`, so their updater logs
ENOENT; graph startup, editing, and recovery still succeed. This run does not
validate downloading or installing an update through the updater.

A separate baseline check found that typing a replacement, pressing Escape, and
immediately reloading in one action sequence can restore the previous title.
This happened in both the unmodified legacy package and SQLite package A. It is
an existing pending-editor-submission timing limitation, not evidence that this
ownership change fixes it. Editing with a completed submission, reload, normal
quit/cold start, and the legacy-to-new transition all retained the verified data.
No product code was changed during this UI verification pass.

### Ownership file contents

`lock.sqlite` has no application schema, rows, PID, ticket, timestamp, or locked
flag. In the verified Node 22 run, the main file was zero bytes both while owned
and after release; `sqlite_schema` was empty. SQLite temporarily created a
`lock.sqlite-journal` while the transaction was open. SQLite manages that journal.
The exclusive authority is the live connection's SQLite write transaction and
OS file locks, not bytes indicating who owns the graph. Other SQLite versions
may initialize an empty database header; no code depends on file size.

Never inspect, delete, truncate, or replace the file to decide whether ownership
is free. A competing `BEGIN IMMEDIATE` is the exclusion check. Keep the stable
main file after release, crash, deletion, and recreation at the same canonical
path. Debug identity remains in lifecycle metadata and `/healthz`.

### Release and offline recovery instructions

Support sequential upgrades only: close the old Desktop applications, retire
verified surviving CLI/other daemons, and then open the new version. Concurrent
old/new access and rollback are unsupported. Retire the bounded adapter when the
minimum supported upgrade source itself implements SQLite ownership.

For an unresolved legacy identity, normal retries preserve the evidence. Offline
recovery is an explicit operator procedure, not an automatic startup branch:

1. Close every old application and daemon that can access the affected storage;
   resolve any uncertainty about remaining worker processes before proceeding.
   Do not kill an unrelated PID on the strength of an old lock file.
2. Preserve copies of the affected raw JSON lock, server publication, graph
   state, runtime records, and logs in a separate diagnostic directory. Do not
   modify graph data, assets, backup files, or SQLite WAL files.
3. Under the shared graph management lease, compare the original artifacts byte
   for byte with the saved copies. Stop if any evidence changed. A free new
   ownership transaction does not establish that old applications are closed.
4. Remove only the obsolete lock and corresponding legacy registration/runtime
   and PID/port publications for the affected graph. Preserve its generation,
   unrelated workers, and the new ownership database. If association remains
   uncertain, retain that evidence and resolve it before cleanup.
5. Restart through normal admission and verify existing data and a new edit.
   Keep diagnostic copies for investigation; do not describe the operation as
   OneDrive or reboot repair.
