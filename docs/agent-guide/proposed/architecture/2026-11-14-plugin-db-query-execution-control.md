# Plugin DB Query Execution Control

## Delivery status

The user explicitly deferred DB evaluator budgets and actual cancellation after
approving this proposal. The SDK read delivery uses the authorized existing
`thread-api/q` path with typed capability/input/output/freshness checks. It does
not implement evaluator CPU/work/deadline control, worker leases, checkpoints or
interruption, and plugin lifecycle cancellation does not free evaluator CPU.
The design below remains future work; its dependency and protected-interface
changes are not included in the SDK delivery.

## Problem

The user approved the SDK/read-service proposal, its two existing Dune edits,
and DB query capability on 2026-11-14. The question here is not whether plugins
may query. It is permission for the additional dependency repository and worker
specification changes required to implement queries safely.

Verified contracts currently lack that control:

- `logseq/logseq:deps/db-worker/lib/endpoint_db.ml` calls synchronous DataScript
  parsing/evaluation from thread-api/q.
- `logseq/datascript-ocaml:impl/query.mli` exposes query evaluation without a
  work budget, cancellation token or checkpoint control.
- `logseq/logseq:deps/db-worker/spec/platform/db_worker_effect.mli` only exposes
  a task timeout. Rejecting that task does not interrupt synchronous evaluation.
- The db-worker AGENTS rules explicitly prohibit changing protected spec .mli
  contracts without approval, so adding that control requires an explicit gate.

No evaluator, protected interface, dependency pin or additional Dune file has
been modified. The previously approved SDK plan is now in proposed lifecycle.

## Proposal

Implement the safe dependency primitive in a separate DataScript PR, then wire
it into the Logseq SDK/worker PR through a real pinned upstream commit. Do not
publish a PR whose build only works with an uncommitted local override. Do not
merge either PR without instruction.

### SDK and worker contract

Start with the existing `DB.datascriptQuery(query, ...inputs)` call shape and a
new `Db_query` capability separate from entity-level Graph_read. Preserve bounded
data inputs and existing query result conversions, not a generic worker-method
tunnel. DB.q is a DSL API and customQuery has additional semantics; do not silently
alias either of them to datascriptQuery.

Use a closed query request and host-owned invocation/job IDs. The application
captures and authorizes the target graph; the plugin cannot select daemon
credentials, connection objects or an arbitrary graph handle. Cancellation
uses the same host-owned job identity, never an arbitrary plugin-supplied ID.

Add dedicated plugin-query and cancellation handling in endpoint_db. Keep the
ordinary thread-api/q behavior unchanged. Invalid syntax, unsupported unbounded
features, permission errors, cancellation and resource exhaustion must remain
distinct. Never fall back to the ordinary unbudgeted q path.

### DataScript execution primitive

Add a guarded query entry point with a query-local control object. Preserve the
existing unguarded entry points for ordinary upstream-compatible callers.
Control must propagate through nested query work, not a process-global mutable
hook. It must account for:

- Parsing depth/nodes and query/input sizes.
- Datom iteration, clause expansion, joins, recursion and intermediate rows.
- Projection, aggregation, sorting, pull traversal and result data size.
- Deadline/cancellation checks before further work or allocation.
- Built-ins: reject a feature in plugin mode if it cannot honor the execution
  bound. An opaque regex/native callback or unbounded collection construction
  must not be advertised as cancellable merely because surrounding loops check.

Start with host policy limits of a 50 ms query deadline, 50,000 charged work
units, 4,096 intermediate rows, 256 result rows, and the existing protocol
depth/node/string/64 KiB message bounds. These are explicit initial defaults,
not claims of already measured performance. Enforce shared invocation quotas
so a plugin cannot evade the budget using many concurrent queries.

The engine receives execution-control callbacks/counters rather than native
Unix dependencies, so it still compiles to native and Melange. No second query
language or approximate replacement evaluator is proposed.

### Platform cancellation

The worker platform contract owns the monotonic clock, cancellation signaling
and any scheduling checkpoint. The native HTTP server currently has separate
connection threads; cancellation must reach the query's control object and stop
further evaluator work, not merely detach a Promise observer. Keep the normal
query connection on the existing worker ownership model; do not move mutable
graph/cache state to arbitrary parallel domains.

For Melange, a cancellation message cannot run while a synchronous evaluator
occupies the JS event loop. A deadline remains enforceable from inside the
evaluator, but that alone does not prove prompt message-driven cancellation.
The integration must either support safe cooperative scheduling/interrupt
signaling or explicitly reject the unavailable execution mode. Do not hide a
native-only implementation behind a falsely portable success result. Mobile
and Swift/Kotlin hosts remain unchanged.

This is cooperative execution control, not hard process/OS preemption. Tests
must distinguish evaluator work termination from Promise rejection. An
interruptible engine cannot stop arbitrary blocking OS/native code unless that
operation also participates in the bound.

## Additional file/contract scope

| Repository/path | Required extension |
| --- | --- |
| `logseq/datascript-ocaml:impl/query.mli` | Public query-local control/guarded entry contract. |
| `impl/query.ml`, `impl/query_api.ml`, `impl/datascript.ml` | Guarded API and propagation without altering ordinary q semantics. |
| `impl/query_where.ml`, `impl/query_eval.ml`, `impl/query_runtime.ml` | Checkpoints and bounded intermediate/result work in query execution. |
| `impl/parser.ml`, `impl/pull_api.ml`, `impl/built_ins.ml` | Bounds or explicit guarded-mode rejection for remaining execution paths. |
| `logseq/logseq:deps/db-worker/spec/platform/db_worker_effect.mli` | Explicit execution-control clock/cancel/checkpoint contract; protected spec edit requires approval. |
| `deps/db-worker/runtime/native/db_worker_effect.ml`, `runtime/melange/db_worker_effect.ml` | Real implementations of the added contract; no fake cancellation. |
| `deps/db-worker/lib/endpoint_db.ml` | Controlled query/cancel endpoints and graph/invocation fencing. |
| `deps/db-worker/scripts/install-opam-deps.sh` | Pin all three DataScript packages to the validated, published dependency commit. |
| Previously approved SDK/protocol/broker/app-service files | Add DB.datascriptQuery, Db_query and cancellation propagation to the same closed architecture. |

Validation additions belong to the existing query/worker test ownership and must
pass the test-value gate before tests are edited. No extra Dune modification is
authorized by this addendum; report any discovered need before editing one.

## Alternatives considered

### Promise timeout around the existing q endpoint

Rejected: synchronous query evaluation continues after the caller gives up.

### Kill or restart the shared graph daemon

Rejected: a plugin must not terminate unrelated application work or risk normal
graph lifecycle operations.

### Dedicated query process and graph snapshot service

Not selected as the first design. It requires a separate snapshot/storage and
process-management contract, increases memory/startup costs, and has no direct
equivalent in an ordinary Web worker without additional isolation work.
Revisit only if engine checkpoints cannot cover the desired query features.

### Restricted replacement Datalog interpreter

Rejected: it would duplicate DataScript semantics and create a second engine
instead of fixing the execution-control boundary.

## Acceptance criteria

- A normal parameterized query round-trips through the real SDK, QuickJS,
  broker, app service, controlled worker endpoint and guarded engine.
- Native and Melange compile with a matching explicit control contract.
- Deadline/work/intermediate/result limits interrupt evaluator work, not only
  the Promise that observes it.
- Cancelling an invocation stops its query work and rejects late results; a
  subsequent unrelated graph query still succeeds on the same daemon.
- Query-local ownership and quotas survive concurrent requests without sharing
  cancellation or leaking graph data.
- Unsupported non-interruptible paths fail explicitly without invoking ordinary
  q. Existing unguarded DataScript query tests remain unchanged and pass.
- Dependency PRs compile against committed published pins; no local-only overlay,
  automatic merge, mobile change or unapproved Dune edit.

## Risks

- The current query engine has no cancellation seam, so this is real evaluator
  work, not a small SDK alias.
- Native and JS scheduling differ. Deadline enforcement and message-driven
  cancellation are separate acceptance properties.
- Guard coverage must include built-ins, parsing, pull and intermediate results;
  checking only final output is insufficient.
- Existing query caches and graph ownership must not become unsafe through
  newly introduced scheduling or parallelism.

## Review outcome

On 2026-11-14 the user approved extending implementation to a separate
logseq/datascript-ocaml PR and modifying the protected worker effect contract
and the listed implementations. The previously approved two Dune edits remain
the only authorized Dune edits. Documents and PR content must be entirely English.
