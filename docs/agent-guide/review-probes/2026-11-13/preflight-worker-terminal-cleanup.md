# Exact worker terminal proof in startup preflight

The signed-upgrade CI run43368225594 passed the actual plugins dialog mount /
close assertions and its child exited0, then failed private-worker cleanup with
a connection reset. The old cleanup loop sent shutdown again after any health
reply while the first acknowledged shutdown was draining. Worker shutdown replies
200 with `{"ok":true}`, then starts its close path; a second POST can therefore
race the server/socket close. No evidence establishes that a lost first ACK is
safe to accept, so transport errors remain failures.

The private Rust startup fixture now captures each exact registry PID/port and
health repo/ticket/generation/owner/storage identity once, validates its existing
runtime record, and requires the complete successful HTTP shutdown ACK once.
There are no network probes or repeated shutdown requests to that worker after
ACK. Under the original four-second bound, it waits for that exact runtime
record's `phase=closed,error=null` and process absence. Wrong identity, changed
paths, close errors, malformed/missing ACK and process-inspection errors fail.
No protocol error is suppressed and no deadline is extended.

The real worker records closed only after in-flight requests, repository close,
server close and ownership release, immediately before on_stopped(None) exits0
(db_worker_node.ml918–944,1228–1231). The runtime record matches every captured
identity field. Its lifecycle directory is a canonical sibling of root/graphs
within this exact unguessable fixture directory, as resolve_storage specifies;
it is not incorrectly required to be inside LOGSEQ_ROOT_DIR itself. The existing
runtime-<captured-ticket>.json file is found uniquely within that
validated private lifecycle directory; its complete immutable identity is then
checked on every observation. No second graph-name encoder or new registry is
introduced. No registry entry is adopted; the worker intentionally leaves a stale
server-list tuple after exit.

On Unix, the existing Python build prerequisite checks the admitted PID belongs
to the captured fixture process group before dispatch, then performs signal0
liveness inspection only; permission/inspection errors are failures. The parent
cannot reap its grandchild, so it proves the worker's successful durable close
plus PID absence rather than claiming a directly captured Unix wait status.
On Windows, the already available public query/synchronize process handle is
retained
directly beside its worker in the existing local owned list; it tracks the exact
process and requires its signalled state and exit code0. No separate handle
registry, process adoption or new supervisor is introduced. No process is
stopped through these observations. Existing group cleanup remains responsible
for abnormal or not-yet-published descendants after the graceful attempt.

Successful actual cleanup prints NSH_PREFLIGHT_WORKER_TERMINAL with the exact
identity and one-dispatch/closed/absent evidence before group cleanup. Deterministic
fixture tests exercise a drain exceeding the former20ms repeat interval, later
process absence, wrong identity/path, lost or malformed ACK even with a closed
record, and errors recorded after a valid ACK. They use a controlled transport
and owned temporary protocol records; they are not substitutes for the actual
release/worker CI run. This source batch has not been compiled or executed by its
author. No App, worker production protocol, SDK, Dune or public API changes.
