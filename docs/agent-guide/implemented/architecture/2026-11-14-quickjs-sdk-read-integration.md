# QuickJS SDK Read Compatibility and Application Services

## Problem

The native typed bridge from [PR #14011](https://github.com/logseq/logseq/pull/14011)
does not provide the legacy SDK or application-owned editor/graph services.
The cross-platform plugin architecture in
[PR #14010](https://github.com/logseq/logseq/pull/14010) needs an import-free,
DOM-free SDK target that preserves supported API-only plugin business logic.

## Decision

Implement an opt-in QuickJS rebundling target, a closed typed read/query protocol,
shared broker authorization, application-owned services and a native read-only
runner. Keep the existing iframe entry/runtime unchanged.

The user approved SDK/application wiring, both existing Dune edits and DB query
capability on 2026-11-14, then explicitly deferred DB evaluator budgets and actual
query cancellation. This delivery includes no evaluator, protected worker
interface, dependency-version or mobile/Swift/Kotlin host changes.
An additional QuickJS Dune link-flag fix was approved for Apple embedding.

## SDK and bundle contract

The separate `libs/webpack.config.quickjs.js` target aliases `@logseq/libs` to
`libs/src/LSPlugin.quickjs.ts` and exports `activate` as `run`. It produces one
import-free ESM file without DOM/Postmate/Node startup or runtime chunk loading.
`libs/quickjs-typescript.cjs` reuses the existing `ts-morph` compiler export;
the package compiler version and dependency declarations are unchanged.

The SDK supports:

- `ready(callback)` / `ready()` and session-owned `baseInfo.id` with runtime
  `quickjs`. The handshake settles at callback start; activation separately
  awaits asynchronous initialization and readiness Promise chains. Initializers
  run once; late callback registration and model bootstrap are unsupported.
- `Editor.checkEditing()` and `getEditingBlockContent()`: UUID/text or
  `false`/`null` when absent.
- `Editor.getCurrentBlock()`, `getCurrentPage()`, `getBlock(identity, options?)`
  and `getPage(identity, options?)`: existing entity conversions or `null`.
  The current-page route summary remains exactly equal `title`/`name` fields.
- Positive signed 32-bit entity IDs, UUIDs/UUID objects and page names.
  Omitted options and `includeChildren:false` are supported;
  `includeChildren:true` is `Unsupported`; unknown/malformed options fail.
- `DB.datascriptQuery(query, ...inputs)` with bounded JSON inputs/results.
- Bounded `console.log/info/warn/error/debug` diagnostics, including Error
  messages, forwarded to application-owned logging.

Unsupported APIs fail explicitly. No fabricated settings/iframe metadata,
browser globals, network, filesystem, timers, subscriptions, writes, commands,
plugin UI or marketplace/startup discovery are provided. API-only source still
needs rebuilding for the new target.

## Ownership, capabilities and DB queries

`deps/ui/src/sdk/plugin_read_services.ml` captures graph, route, generation,
context revision, selected blocks, editing epoch/model/scope and live text.
It checks currentness before dispatch and after asynchronous replies. Entity
reads reuse `Sdk_util` and `Sdk_convert` conversions rather than raw transport
exposure. Missing entities/editor return explicit optional values; a DB query
without a graph is `Invalid_request`.

Capabilities remain distinct: editing state requires `Editor_read`, explicit
graph lookups require `Graph_read`, current block/page require both, and queries
require `Graph_read` plus `Db_query`. Metadata and bounded diagnostics need no
graph authority. The shared broker rechecks authority/currentness and validates
reply sizes, depth, node count, UTF-8 and finite numbers.

Queries resolve inputs via `thread-api/resolve-query-inputs`, then use the
existing authorized `thread-api/q` path. Evaluator CPU/work/deadline budgets,
worker leases, evaluator checkpoints and actual interruption are deferred.
Discarding a stale reply or cancelling a plugin does not stop a synchronous
evaluator or release the serialized worker queue. QuickJS deadlines do not
cover worker CPU.

## Native runner and validation

`deps/ui/native/plugin_read_runner.ml` exposes owner-thread-bound start/close
through `Plugin_host.load_read_plugin` / `unload_read_plugin`. It uses
`Host.set_timeout` to pump the real QuickJS engine. It rejects
`Editor_command` grants and nonempty action programs; successful reads return
an empty program without command authority. Failure/cancellation/staleness
retires the invocation/runtime; close is idempotent.

The approved `deps/ui/native/dune` and `deps/ui/test/quickjs/dune` edits provide
application copies/library linkage and one integration executable. A third
approved edit in `deps/ui/quickjs/dune` omits explicit `-lm` on macOS, where math
symbols resolve through libSystem at the final host link, and retains it on
other platforms. No new Dune files or cross-project bundle-generation rules
are added.

`sh deps/ui/scripts/check-quickjs-sdk.sh` builds native OCaml and Melange,
runs the existing native bridge tests, builds the SDK fixture and executes one
retained contract probe against a real isolated worker graph. It verifies
readiness, entity/query DTOs, variadic inputs, absent editor/graph behavior,
permission denial, stale late replies and idempotent close. Linux/macOS CI run
the same probe plus strict DOM-free TypeScript checks.

## Alternatives considered

### Alias editing snapshots to entities

Rejected because IDs/properties/references would not match the supported SDK DTOs.

### Dispatch arbitrary legacy string names through the UI SDK

Rejected because that bypasses closed capabilities and leaks transport coupling.

### Include commands, writes, marketplace loading, subscriptions and UI now

Deferred because they require separate lifecycle/permission contracts.

### Claim safe DB execution from a Promise/QuickJS timeout

Rejected because it does not interrupt the worker evaluator.

## Consequences

Supported API-only plugin logic can retain its names and successful data
semantics after rebundling. DOM/CSS/Node-dependent and unsupported APIs still
need migration; this is not blanket compatibility with the old SDK.

Native contract validation and portable Melange compilation do not establish
QuickJS WASM/Web or mobile-host runtime parity. QuickJS is an in-process engine,
not a process sandbox. Evaluator controls remain future work in the DB
execution-control addendum, not a prerequisite secretly implemented here.
