# Native Worker Reconnection

## Problem

In the isolated run7 MyGo acceptance, a normal target-worker restart preserved
the host and window but subsequent search requests failed with ECONNREFUSED.
The host retained its old page. Cached content is not evidence of recovery.
Native transport discovery, event subscriptions, and page-model rehydration do
not currently form an awaitable connection lifecycle.

## Decision

Enable automatic host-local reconnection for the same canonical graph and
validated worker storage identity. Coordinate transport epochs and event-stream
readiness with application-owned graph initialization and current-route reload.
Ready means model rehydration completed, not merely that an HTTP socket opened.

Preserve unsubmitted editor drafts. Never replay a failed business request,
including reads. Distinguish requests known not to have been sent from writes
whose result is unknown; surface unknown outcomes rather than resubmitting.
Ordinary calls cannot bypass the recovery gate; initialization uses an explicit
epoch-scoped invocation capability rather than a global invocation override.

Explicit graph opening and creation must commit the target graph and await its
route model before the transport publishes Ready. A Graph_prepared reducer
action installs the target repository and configuration without starting normal
graph-open or RTC requests. The callback also awaits and commits the target route
snapshot before returning. Initial boot and explicit graph operations retain
their existing journal-creation and Boot_graph_ready owners after connection;
creating an empty import target must not implicitly seed a journal. Non-daemon browser and
publishing clients keep their existing startup and fatal-error semantics.

Recovery cancels stale route reloads, pending focus callbacks, and deferred save
timers without clearing the editor buffer or replaying it. A current-epoch
capability is passed through existing graph, configuration, outliner, and router
owners; cache and model side effects also check that capability after awaits.
Strict alias redirects await the final source-page snapshot in the same scoped
route owner; hash-change notifications cannot launch an ordinary loader while
recovery owns that snapshot. Background RTC start checks the committed model,
target repository, client, and ready epoch at execution and after each await;
arming the debounce before a graph-ready reducer commits is still allowed.
Logout and login supersede any old recovery before rebuilding the current auth
context. Logout issues one scoped sync stop and one empty-auth update against
the current ready worker before retiring its client epoch. Both requests share
a two-second app-owned cleanup budget; failure, missing worker, or expiry leaves
a persistent unconfirmed-cleanup warning. Authentication changes then use
read-only `reconnect_existing` (not explicit worker startup) to bind the
previous graph generation. They never replay old logout requests in a new
epoch; delayed server execution remains possible without server-side fencing.
Unknown request outcomes remain visible until dismissed.

Daemon event decoding uses the JSON `type` as the event owner. The existing
worker emits both raw argument payloads (import progress) and same-kind Transit
message frames (database changes). Only a matching inner event keyword is
unwrapped; raw arguments are delivered unchanged. Misclassifying valid import
progress as a malformed frame invalidates the epoch and cancels the import
response even after persistence. Native and browser-daemon decoders use the
same rule without changing worker messages or suppressing callback exceptions.

Do not change worker RPC, storage, dynamic-port policy, dependency pins, Dune,
or the acceptance harness. Preserve all frozen runs. New runtime verification
uses independent build, output, state, fixture, and graph directories.

## Alternatives considered

### Replace the cached port only

Rejected: this neither restores the event stream nor reloads missed model data,
and does not guard stale callbacks or distinguish worker identity.

### Retry failed calls automatically

Rejected: partial sends and response loss can leave writes committed. Existing
in-flight deduplication is not authorization to repeat a business operation.

## Acceptance criteria

- A fresh real MyGo run passes import, editing, save/reopen, host-only restart,
  worker-only restart on its normally assigned port, and disk cold recovery.
- Recovery uses validated canonical graph/root/graphsDir and worker identity;
  stale old-epoch events and responses cannot modify the restored model.
- Event subscription readiness is demonstrated by existing protocol behavior,
  not inferred from thread startup or response headers.
- The visible model is re-fetched from the replacement worker. A draft survives
  recovery without automatic resubmission or replacement by stale content.
- A new actual product failure freezes the run immediately; subsequent recovery
  layers are not attempted. No new differences in protected old evidence.

## Risks

- Existing SSE has no event replay or explicit subscription acknowledgement.
  Waiting for a post-registration keepalive may delay recovery by one interval.
- Browser and native transport errors have different observability. Unknown
  outcomes must be conservative; do not infer that a rejected fetch sent nothing.
- Route reloads currently swallow some errors. Recovery must not turn those
  failures into a Ready state or lose an editor draft through navigation hooks.

## Consequences

Each new SSE attachment waits for the existing keepalive registration evidence
before rehydration, with an explicit timeout instead of premature readiness.
Clients and the application must be rebuilt together. Recovery is discovery of
an existing worker, not authorization to spawn one or repeat a failed recipe.
The current protocol does not fence server execution after client cancellation;
unconfirmed writes and logout cleanup therefore remain visible to the user.

## Questions

- Should automatic recovery be enabled by default and drafts be retained?
  Answer: approved by the user's selection, "Proceed as recommended", following
  the proposal to preserve drafts, never replay failed calls, and report unknown
  write outcomes. The run7 failure remains frozen.

## Verification

Fresh isolated run10 completed real CPU-native retained MyGo import and editor
acceptance, host-only restart, worker-only restart and disk-cold restart. The
host-only restart reused the original worker. The worker-only restart preserved
the host, changed the dynamic port and ticket, retained storage identity and
generation, and restored the route and model before a successful new search.
An unsubmitted editor draft survived recovery without appearing in the worker
or zero-WAL disk snapshot. A later explicit search blurred the editor and
committed that draft once. The cold restart verifies that normal committed
result, not durability of an unsubmitted buffer.

Native and Web builds, the native suite, shared boundaries and the Node UI
regression passed (5290 checks, zero failures). The native suite still emitted
the existing properties render-data batch failure diagnostic despite exit zero.
The event-envelope regression failed before the decoder correction and passed
afterward. Frozen runs had no new protection differences; the previously
authorized overwritten-library exception remains, so the strict protection
gate is not pristine.

This run did not independently verify partial-send outcome handling, recovery
toast visibility, alias/RTC/logout interaction, IME, Inter face selection or
general visual parity. Those remain separate acceptance items. Existing SSE
keepalive establishes sink registration only, not historical event replay or
atomic snapshot/delta delivery.
