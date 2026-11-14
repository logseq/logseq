# QuickJS Plugin Runtime and Typed OCaml Bridge

## Problem

Logseq needs one JavaScript plugin package to work with its Web and Apple
SwiftUI renderers, with a compatible path to future iOS and Android support.
The current plugin implementation depends on a browser host. Recreating that
host with WebViews would preserve some legacy behavior but would make HTML and
DOM dependencies part of the portability contract. The user explicitly does
not want to introduce a WebView.

The runtime boundary must carry typed values and closed application operations,
not JavaScript source strings evaluated by the UI. Installing an engine alone
does not supply a plugin scheduler, permissions, or a portable UI API.

Status: proposed. The user approved the ADR review choices on 2026-11-14
with the response "Approve". This records the architectural direction, not
implementation completion. A separate concrete implementation proposal
remains the next review gate; no runtime, Dune, mobile, Host, or SDK file changes
are included in this ADR.

Source baseline: `refactor/lui` at
`c7aad13d80c4c4e837dd73a9723dd230163153fd`.

### Current source evidence

| Source | Observed behavior | Design consequence |
| --- | --- | --- |
| `libs/src/LSPlugin.caller.ts`, `libs/src/LSPlugin.user.ts` | The existing caller uses an iframe/Postmate; SDK startup and `ready` depend on `window` and `connectToParent`. | Do not load the legacy SDK unchanged into a DOM-free engine. |
| `deps/ui/native/plugin_host.ml` | Native plugin setup is a no-op and capabilities report unavailable. | QuickJS integration is new work, not an existing native plugin capability. |
| `deps/ui/src/contracts/json.ml`, `wire.ml`, `ui_task.mli` | Portable value trees and an owner-thread task scheduler already exist. | Reuse these contracts; do not add browser values or OS threading to shared code. |
| `deps/ui/src/popups/popups_state.ml` | Configured slash commands are parsed into model changes, typed effects, and terminal UI actions. | Reuse the configured-command executor instead of adding a parallel editor mutation path. |
| `deps/ui/src/editor/editor_commands.ml` | `run_configured_ui` handles the typed configured terminal actions and is installed by `install_configured_ui`. | Keep popup/editor ownership and existing UI handoff; do not replace it with a JS event name. |
| `deps/ui/src/shared/dune`, `deps/ui/src/contracts/dune` | Both libraries build bytecode, native, and Melange and discover modules automatically. | New portable modules can live here without editing these Dune files. |
| `deps/ui/scripts/check-shared-boundaries.sh` | Shared code must not import browser FFI, `Js.*`, `Unix`, or `Thread`. | Keep the engine and C stubs outside these libraries. |

There is no `Plugin_broker` or `Plugin_protocol` module at this baseline; those
names below describe proposed additions, not existing implementation.

Read-only reference: `logseq/mobile` at
`82b6da991bc0e6987f652f6f5cd91d1e37f58498` already embeds QuickJS for bundled NLP,
syntax, and calculator code. Its `shared/native/nlp/dependencies.json` pins
Bellard QuickJS `2026-06-04` with a checksum. Its `logseq_nlp_stub.c` demonstrates
runtime/context creation, memory/stack limits, deadline interruption, and OCaml
FFI. These synchronous bundled-library runtimes are not plugin sandboxes or
asynchronous plugin hosts. They must not be shared with third-party plugins.

## Proposal

Adopt QuickJS as the candidate DOM-free execution engine, with a typed bridge
to a shared OCaml broker. JavaScript expresses plugin logic; application UI
and editor mutations remain owned by shared OCaml/LUI code.

The user-selected constraints are fixed: no new WebView, no mobile changes,
no Host/SDK edits in the first implementation, and a separate branch and PR
based on `refactor/lui`. Engine/build/scope/migration boundaries were approved;
the concrete implementation details remain subject to review.

The intended portability model is:

```text
One plugin JavaScript module
  native: QuickJS C embedding
  future Web: QuickJS WASM in a Worker
          |
          v
strict value decoding -> typed request -> shared OCaml broker
          |
          v
application-owned editor/configured commands or future LUI contributions
```

The first implementation would prove the native engine-to-broker boundary,
not enable marketplace installation, wire application startup, replace the
legacy SDK, implement WASM, or claim mobile support. A native driver must run
real QuickJS and the real shared broker. Merely compiling an OCaml interface,
mocking the engine, or executing `qjs` as a subprocess is not sufficient.

## Review outcome

The user's "Approve" answered the four review questions:

1. Use upstream Bellard QuickJS `2026-06-04`, matching the existing mobile
   source pin, as the initial dependency candidate, rather than switching
   to QuickJS-NG or JavaScriptCore.
2. Permit two new Dune files for the later native library and focused driver;
   leave existing Dune files and application startup unchanged in that slice.
3. Limit the first slice to an internal native bridge with
   `Get_editing_context` and typed `Insert_text` / `Show_date_picker` /
   `Exit_editing` results. Actual popup/DB/SDK/startup and Web/WASM wiring are
   deferred to separately reviewed scope.
4. Require explicit migration, without legacy DOM/WebView fallback or a
   promise of unchanged old SDK bundles. Select an application-owned
   `api-migrations` location before future public behavior changes.

## Candidate module and dependency boundaries

All paths in this section are prospective and subject to the final review.

| Candidate location | Responsibility | Dependencies and exclusions |
| --- | --- | --- |
| `deps/ui/src/contracts/plugin_protocol.ml/.mli` | Abstract plugin/request/callback/invocation identities; closed requests, replies, configured actions, and errors. | Reuse `Json.t` only for bounded plain-data conversion; no raw `Wire.t` request proxy, FFI, engine values, or callbacks into views. |
| `deps/ui/src/shared/plugin_broker.ml/.mli` | Validate identity, capabilities, lifecycle and invocation ownership; dispatch typed requests through injected application services. | `Plugin_protocol` and `Ui_task`; no dependency on `Popups_state`, `Sdk_api`, Host, QuickJS, or `Js.Promise`. |
| `deps/ui/quickjs/quickjs_runtime.ml/.mli` and a C stub | Own runtimes, JS handles, module loading, Promise jobs and bounded native-to-OCaml value conversion. | Native-only library depending on the contracts/broker. OS queue/thread details stay here. No DOM, Swift, Kotlin, or unrestricted OS modules. |
| Existing `deps/ui/src/popups/popups_state.ml` | A later approved adapter accepts broker-validated configured results under a captured editor/popup invocation. | Translate the closed action set into existing configured semantics; keep the broker independent of this module. |

The runtime is an adapter, not the policy authority. The broker receives a
trusted plugin session and invocation from the host-side caller, never an
identity, graph path, or permission list accepted from plugin data.

Do not relocate the engine into LUI: plugin permissions, editor actions,
package loading and graph context are Logseq concerns.

## Candidate typed API surface

The initial bridge should be internal, not a new public SDK. A package exports
a named command handler. An invocation provides an immutable editor-context
snapshot and an opaque invocation identity. The injected host bridge permits
only a closed read request, such as `Get_editing_context`, and returns a typed
reply through a Promise. The handler returns a typed command program.

Candidate first command results are `Insert_text`, `Show_date_picker`, and
`Exit_editing`; their exact fields and maximum sizes must be specified in the
implementation proposal. A terminal action may only occur last. Other
configured operations, arbitrary DB queries/writes, settings, toolbar trees,
and renderer registration remain outside this first slice.

The OCaml public boundary should have the shape of:

```ocaml
invoke_command : runtime -> invocation -> callback_id -> editor_context ->
  (configured_action list, error) result Ui_task.t
```

The actual declarations must use abstract identities and closed variants,
not `method : string`, `args : string`, `Obj.t`, or a general-purpose
`eval : string -> string` service. JS functions remain engine-owned; callback
IDs identify registered handles and become invalid on unload.

At the C/JS boundary, inspect values rather than accepting source-code
representations of them. Decode bounded plain data to portable values, then
validate the entire request/result into a closed protocol variant before
performing effects. Reject unknown tags/fields, invalid numbers, malformed
Unicode, cycles, excessive depth/size, unexpected prototypes/accessors,
functions in data fields and stale handles. Integer ranges and text/caret
units must be explicit; no permissive coercion or silent fallback.

No engine value or pointer may escape its owning runtime. Any internal encoding
used between C and OCaml is data only and still requires the same decoding and
closed-variant validation; strings are never interpreted as UI code.

Errors must also be closed and stable: candidate categories are
`Invalid_request`, `Unsupported`, `Permission_denied`, `Stale_context`,
`Cancelled`, `Resource_limit`, and `Runtime_failure`. The proposal must specify
how JS exceptions and rejected host Promises map to these categories without
leaking native internals or treating unsupported operations as successful.

## Existing API transport and future UI ownership

Future DB/editor services should reuse the application semantics implemented
by `deps/ui/src/sdk/sdk_read.ml`, `sdk_write.ml`, `sdk_ui.ml`, and
`sdk_util.ml`, not introduce a second database client. For example,
`Sdk_read.datascript_query` resolves inputs before `thread-api/q`, and
`Sdk_util.apply_ops_for_repo` checks graph/context revision before
`thread-api/apply-outliner-ops`, followed by the existing UI refresh path.

Those implementations are not directly importable into the portable broker:
they currently use application modules and `Js.*` promises/values. Their
semantics must be supplied through typed, application-owned service callbacks
in a separately approved scope; this ADR does not authorize SDK edits.

Below those services, Web dispatch already goes through
`deps/ui/src/core/worker_client.ml`; Electron/native use the daemon client.
`deps/ui/src/core/daemon_client.ml` encodes `{method,argsTransit}` for
`/v1/invoke` and decodes `resultTransit`. The plugin must never receive the
daemon address/token or a generic proxy to this internal RPC vocabulary.
Native reverse-worker invocation is still a stub in
`deps/ui/native/worker_client.ml`, not an available plugin callback channel.

Later toolbar/menu/settings/panel contributions should be versioned typed
application models rendered by ordinary LUI kinds/props, with opaque callback
IDs routed back through the broker. Platform extension registries are for
genuinely native widgets, not generic plugin HTML. No schema change is assumed
for ordinary controls. Custom page/block renderers need explicit dispatch
sites and ownership/disposal semantics: `Sdk_api.sdk_experiments_methods`
currently returns success for renderer registrations without renderer dispatch.
Do not advertise that no-op surface as working native or portable rendering.

## Popups_state configured-command handoff

The existing seam is more specific than a generic editor event:

- `configured_steps` recognizes input/model transformations.
- `configured_program` validates effect/terminal ordering and produces
  `Configured_models`, `Configured_effect`, and `Configured_terminal`.
- `run_configured` applies effects through `Outliner_ops` and checks context,
  editor epoch/scope, source, selection, input sequence and popup generation.
- `configured_checkpoint_current` protects delayed UI handoff.
- `install_configured_ui` connects to `Editor_commands.run_configured_ui` for
  property, calendar and link-form actions.

A future adapter must capture invocation ownership **before** invoking JS,
not capture a new checkpoint when an asynchronous JS result arrives. An editor
change, composition, route/graph change, popup replacement or plugin unload
invalidates the result. Only a current result may be converted from the closed
action variant into the existing `Configured` representation and executor.
Reuse the current executor's validation and refresh behavior, without
exporting `configured_checkpoint` or mutable editor records to JavaScript.

Do not call `configured_ui_entry` directly from the C runtime, set that ref to
a JS handler, or dispatch arbitrary DOM event names. The broker must not import
`Popups_state`, which would invert the shared-library dependency direction.
Actual popup/application wiring is a separately approved change, not part of
the first engine-only compilation proof.

## Build and dependency boundary

This ADR changes no Dune file. Portable modules in `src/contracts/` and
`src/shared/` can use existing automatic module discovery. **A real native C
embedding cannot be honestly delivered under a blanket prohibition on every
new or changed Dune stanza.** The approved minimum exception for the subsequent
implementation proposal is:

1. Add `deps/ui/quickjs/dune` for a native-only `logseq_plugin_quickjs` library
   and its foreign stubs.
2. Add `deps/ui/test/quickjs/dune` for a small native driver that links and runs
   this library with the real broker.

No edit to `deps/ui/native/dune` is required for that standalone first proof.
Linking the runtime into the actual application would require a separately
reported library dependency/startup decision. Do not hide foreign stubs in an
unrelated existing executable or turn a compile check into a parallel manual
build system merely to claim that Dune was untouched.

Prefer the already-used Bellard QuickJS `2026-06-04` pin and checksum as the
starting candidate, subject to dependency/security review. Obtain source as
a fixed, checksum-verified build dependency; do not commit downloaded engine
trees, copy mobile's generated files, add `quickjs-libc` OS capabilities, or
modify mobile to export its NLP runtime. Evaluate patches/forks explicitly;
do not silently switch to QuickJS-NG. A future WASM build must align engine
version and enabled language features with native.

## DOM-free SDK boundary and migration

The first PR adds no `window.logseq` facade, `window` alias, Postmate shim,
HTML renderer or changes under `libs/`, `src/sdk/`, `native/plugin_host.ml`,
Apple host files, or mobile. An internal bridge is not a claim that the
legacy SDK is supported.

For later SDK work, keep `Editor/DB/App` semantics where portable, expose
engine-neutral module/global bindings, and replace browser startup with
injected typed transport. UI contributions must become typed declarations
handled by shared LUI components. HTML/CSS/ReactDOM/Node-dependent plugins
require migration; do not add a fake DOM or WebView fallback. API-only plugins
may retain business logic but can still require SDK replacement and rebuilding.

Before an implementation changes a public API, default, error or callback
behavior, record compatibility and concrete migration examples in an
`api-migrations` document. This baseline has no `docs/api-migrations.md` or
`deps/ui/docs/api-migrations.md`; nominate the application-owned location in
the implementation proposal rather than creating it in this ADR-only change.
If a later change touches LUI's public contract, its own
`docs/api-migrations.md` must also be updated in the LUI repository. This ADR
requires no LUI schema or wire change.

## Security and execution model

- No protocol operation accepts `eval`, `executeScript`, a function body,
  an OCaml method name or a daemon `thread-api/*` name. No UI request evaluates
  plugin strings. Package module compilation/evaluation is private to the
  engine loader, with verified package origin/integrity and resource budgets;
  that necessary JS execution is not a general UI evaluation service.
- Do not treat removal of global `eval`/`Function` as a security boundary.
  Capabilities, package/module loading, resource limits and broker validation
  are authoritative even if dynamic JS language features exist internally.
- Use a separate `JSRuntime`/heap per plugin, not just separate contexts.
  Set memory/stack limits and interrupt deadlines. Do not expose `std`, `os`,
  native-module loading, process/file access or direct daemon endpoints.
- Own each runtime on a serialized execution lane. Promise jobs, callbacks
  and host completions have bounded work per turn. Engine work must not run
  unbounded on the application thread. Host results re-enter through the
  `Ui_task` scheduler; engine pointers and the OCaml runtime lock must never
  be accessed from an unowned thread or across an unsafe FFI callback.
- Unload cancels pending work, invalidates callbacks/requests and releases
  handles. Late results cannot act on a new plugin generation or graph.
  Timeouts do not imply rollback; writes cannot be blindly retried.
- JS heap limits do not cover every host allocation or host operation. Bound
  messages, broker queues, pending Promises and native work separately.
- Native QuickJS is not an OS process sandbox. C engine/FFI vulnerabilities
  remain application risks; a dedicated thread does not isolate crashes.
  Desktop process isolation and the mobile trust/distribution policy require
  separate review. Interpreter/no-JIT execution does not settle iOS store rules.

## Follow-up decisions reserved for the implementation proposal

- Package/module format, loader restrictions, assets and source integrity;
  native/WASM pin alignment, including whether a wrapper such as
  `quickjs-emscripten` can supply the selected engine version.
- Exact request/result declarations, native ownership and scheduler ABI,
  pending-job fairness, callback lifetime and numeric/text limits. Runtime,
  stack, heap, wall-time and pending-call budgets need explicit defaults.
- Capability and consent design for network, storage, crypto, file pickers,
  timers and subscriptions. These are host services, not automatic QuickJS
  globals or first-slice permissions.
- Typed UI v1 scope and toolbar/slash/settings/custom-renderer registration,
  including disposal on unload and an error/migration policy for legacy
  renderer methods that currently return success without doing work.
- Desktop process isolation, iOS background suspension/resume, Android
  lifecycle/resource limits and store/distribution constraints. Native
  embedding alone settles none of these.

## Alternatives considered

### QuickJS with a DOM-free typed broker

Preferred candidate: a small C engine fits the existing OCaml/native boundary
and mobile already has embedding experience. A WASM build offers a path to
the same engine and plugin source on Web. The cost is owning async scheduling,
strict conversion, host services, isolation and a new SDK migration boundary.

### WebView / legacy iframe host on native

Not selected: explicitly excluded by the user. It would preserve more browser
APIs, but would retain DOM-specific UI and per-plugin Web content/lifecycle
costs. The existing Web iframe implementation is evidence of legacy behavior,
not a requirement to reproduce it in the native portable runtime.

### JavaScriptCore on Apple, browser engine on Web, another engine on Android

Not preferred: JavaScriptCore can embed without a WebView but provides no DOM
and does not remove the SDK migration work. Different engines increase
cross-platform semantics and host-API validation costs. QuickJS has a more
direct reuse path from mobile's existing source dependency.

### V8 or Hermes

Not preferred for the first slice: larger embedding/build/platform work and
no demonstrated in-repository plugin adapter to reuse. Performance could
justify a later engine comparison; it must use the same typed broker contract,
not introduce a second plugin API. No performance advantage is asserted here.

### QuickJS-NG

A viable separate engine/dependency choice, not a drop-in assumption. It needs
an explicit version, maintenance/security review and native/WASM compatibility
decision. The current mobile pin is upstream QuickJS, so switching forks would
not be justified merely by the existing mobile code.

## Acceptance criteria

- This ADR changes only its own Markdown file, records the review answers,
  transitions to `proposed` with `spec-dev-tool`, and validates before the
  separate concrete implementation proposal is submitted for approval.
- A later approved first slice must compile real OCaml contracts, the shared
  broker, the runtime adapter and C stubs, and link an executable against the
  pinned QuickJS engine. No source-only review or JS-only check substitutes
  for native OCaml compilation.
- The candidate focused build from `deps/ui/` is
  `dune build quickjs/logseq_plugin_quickjs.cmxa src/shared/logseq_ui_shared.cmxa test/quickjs/bridge_test.exe`.
  These targets do not exist yet; exact names are subject to the implementation
  proposal. Execute the resulting driver against a real module after building.
- That driver must prove a host read/Promise round trip through the real
  broker and a typed configured result, malformed/unsupported value rejection,
  unload/stale-result rejection, interruption and resource cleanup.
- Shared modules pass `deps/ui/scripts/check-shared-boundaries.sh`; native
  engine code is outside the Melange/shared libraries. No prohibited Host,
  SDK, mobile or unapproved Dune edits appear in the diff.
- A subsequent approved popup integration must exercise existing configured
  semantics and verify that an editor/graph/popup change while JS is pending
  prevents side effects. Until then, do not claim working plugin slash UI.
- Web/WASM and future mobile must eventually run the same plugin artifact and
  behavioral contract. The native proof alone does not establish WORA parity.

## Risks

- The portable API intentionally gives up legacy HTML/CSS/DOM/Node behavior.
  One-time migration is preferable to hidden platform-dependent fallbacks.
- The cross-backend popup code still uses `Js.Promise` at its application
  boundary. Its adapter must bridge to `Ui_task` locally, without leaking
  `Js.*` back into the new shared broker or adding a native/SDK compatibility layer.
- QuickJS C handle ownership, exceptions, callback lifetimes, Promise-job
  fairness and FFI lock transitions are implementation hazards. Existing NLP
  examples do not prove that an async plugin embedding is safe.
- Resource/time budgets and thread model require measurement. No runtime
  performance, Apple execution, WASM conformance or mobile build was validated
  by this documentation-only change.
- Dune approval covers only the two new files for the native proof. Further
  build exceptions or application startup changes require new approval;
  do not advertise missing application integration as already working.
