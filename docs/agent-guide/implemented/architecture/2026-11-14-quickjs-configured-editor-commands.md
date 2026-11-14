# QuickJS Configured Editor Commands

## Problem

The read path is merged. The next useful slice is a user-invoked editor command
that can read through the existing SDK and return a bounded, typed edit program.
It must not create another lifecycle manager or forward executable source to UI.

This implementation proposal was approved on 2026-11-14, including its scope,
explicit command API and single test Dune edit. The implementation and verified
acceptance evidence are recorded below; the design sections retain the approved
contract.

### Verified baseline

Initially inspected `origin/refactor/lui` at the requested
`3056939dd8a81e0925c519540f6c7e0abd04788e0`, including the merged read-path
[PR #14012](https://github.com/logseq/logseq/pull/14012). The foundation is the
[runtime ADR](https://github.com/logseq/logseq/pull/14010) and
[typed bridge](https://github.com/logseq/logseq/pull/14011).

`deps/ui/quickjs/` contains exactly `dependencies.json`, `dune`, `fetch.py`,
`quickjs_runtime.ml`, `quickjs_runtime.mli` and `quickjs_stub.c`. There is no
additional command registry or application lifecycle module in that directory
at this revision.

Rechecked the current remote HEAD at
`7335c9b7852ce5f9dcfa130da0acf7f817fc594c`. The intermediate
`0737276a0b69e7997007fa7bb9b14bb547222d73` adds context-menu target scope;
the two later commits isolate sidebar outliner scopes and update the LUI pin
for Apple CSS-variable colors. Relative to that intermediate revision, QuickJS,
protocol, broker, configured executor, SDK, native runner and their Dune files
are unchanged. The proposed ownership checks explicitly include editor scope,
so sidebar panes cannot authorize one another's edits. This proposal is based
on the rechecked `7335c9b785` baseline. Implementation subsequently fast-forwarded
to `3b4b9a8b8521f8082d08d9d1dc6c33959a68d`; the same runtime/configured boundaries
were unchanged by that baseline update.

| Evidence at this baseline | Consequence |
| --- | --- |
| `deps/ui/quickjs/quickjs_runtime.ml:64-101` and `quickjs_stub.c:515-582` load one exported `run`, issue an owner-bound callback ID and reject overlapping invocations | Reuse this runtime; extend callback selection instead of adding a second JS engine wrapper |
| `quickjs_runtime.ml:45-61,123-138` stops completed calls and closes failed instances; commit `2f8fbacc32` already fixes failure/cancellation retirement | Preserve existing retirement, rather than proposing lifecycle-only work again |
| `deps/ui/src/shared/plugin_broker.ml:41-65,113-128` owns invocations, authorization, program acceptance and session close | Successful acceptance already retires the invocation; applying a result cannot call `check` on that retired invocation |
| `deps/ui/src/contracts/plugin_protocol.mli:9-39` already defines `Editor_command` and `Insert_text`, `Show_date_picker`, `Exit_editing` | No new write action or graph-write permission is necessary for the first editor slice |
| `deps/ui/src/shared/plugin_configured.ml:1-6` only encodes a program to closed `Wire` commands | It is not an application executor or a freshness checkpoint |
| `deps/ui/native/plugin_read_runner.ml:23-31` rejects `Editor_command` before creating the runtime | Preserve the read-only entrypoint's contract |
| `libs/src/LSPlugin.quickjs.ts:190-234,320-364` binds host access only during activation and then clears it | Merely storing a JS callback is insufficient; each later callback needs a fresh invocation binding |
| `deps/ui/src/popups/popups_state.ml:2251-2326` captures ownership inside `run_configured` | Calling it unchanged after asynchronous JS would capture a new origin too late |
| `popups_state.ml:2381-2389` erases a legacy slash trigger before invoking the legacy plugin host | The new path must not inherit that pre-validation editor mutation |

The existing lifecycle is engine-level load/invoke/retire, not yet a public
multi-command registration API. If a separate registration commit is supplied
after this baseline, reconcile and reuse it before implementation; do not land
duplicate registry ownership.

## Decision

Implement the approved command-first slice with one DOM-free SDK and typed
broker, reusing the existing native engine and configured editor executor.
The public command API returns a closed program rather than pretending that
legacy imperative write methods have equivalent semantics.

### Recommendation and delivery boundary

Implement **registered editor commands through the existing configured
executor**, with only the lifecycle extensions required to make that path safe.
This is more useful than a lifecycle-only refactor and smaller than arbitrary
block/page writes or a general plugin UI system.

The vertical slice is:

```text
one DOM-free SDK bundle
  -> ready / bounded command registration
  -> session-owned command descriptor appears in the slash popup
  -> user selects descriptor; application captures ownership
  -> existing QuickJS runtime invokes its retained callback with a fresh host
  -> callback reads existing Editor / DB APIs and returns a closed program
  -> broker validates authority, limits and pre-invocation origin
  -> application consumes a one-use execution ticket
  -> Plugin_configured.output -> configured_program -> existing executor
```

The native application owns the proof, using an explicitly loaded local bundle,
as with the read runner. Marketplace discovery and automatic plugin startup are
not added. Shared contracts, registry semantics and SDK source remain suitable
for a future QuickJS WASM Worker; this slice does not implement or validate that
Worker or mobile embedding.

### Typed public SDK surface

Keep the shipped reads, `ready`, metadata, queries and diagnostics unchanged.
Add one explicit portable extension rather than pretending old immediate-write
APIs now work:

```ts
type EditorCommandAction =
  | { readonly kind: 'insertText'; readonly text: string }
  | { readonly kind: 'showDatePicker' }
  | { readonly kind: 'exitEditing' }

type EditorCommandProgram = readonly EditorCommandAction[]

interface EditorCommandDescriptor {
  readonly key: string
  readonly label: string
}

interface PortableCommands {
  registerEditorCommand(
    descriptor: EditorCommandDescriptor,
    handler: () => EditorCommandProgram | Promise<EditorCommandProgram>
  ): Promise<void>
}

// Proposed addition: logseq.Commands implements PortableCommands.
await logseq.ready(async () => {
  await logseq.Commands.registerEditorCommand(
    { key: 'insert-portable-greeting', label: 'Insert portable greeting' },
    async () => {
      const block = await logseq.Editor.getCurrentBlock()
      return [{ kind: 'insertText', text: block ? 'Hello' : 'No current block' }]
    }
  )
})
```

`key` is a stable plugin-local identifier, distinct from its display label.
Proposed bounds are 32 registrations per plugin session, 1-64 ASCII
`[A-Za-z0-9_.-]` bytes for keys and 1-128 valid UTF-8 bytes for labels, without
control characters. Duplicate keys, including attempts to overwrite a callback,
fail with `Invalid_request`; excess count/size is `Resource_limit`. Reuse the
existing program validator and its limits/terminal-last ordering, not another
action validator in the SDK or popup.

Registration is allowed only while activation is running. Registrations remain
provisional until activation and pending reads complete successfully; failed or
cancelled initialization publishes none. Later registration is `Unsupported`.
There is no per-command JS disposer or hot replacement in this slice; unload
removes all registrations. A callback must return an explicit program, including
`[]` for no effects; `undefined` is not silently converted to success.

The callback result is an edit intent, **not** confirmation of a durable worker
transaction. `insertText` uses configured slash-input replacement semantics,
including trigger handling, rather than promising the semantics of arbitrary
`Editor.insertAtEditingCursor`. `showDatePicker` uses the application's calendar
handoff; it does not return the selected date to JS. A following command must
not be appended after either terminal action.

The existing legacy `Editor.registerSlashCommand`, `insertBlock`, `updateBlock`,
`insertAtEditingCursor`, page/property mutations and raw DB writes remain
unsupported in the QuickJS target. The new namespace makes the staged
return-value contract explicit. Do not alias old mutators to a deferred program
and resolve their Promises before their effects occur.

### OCaml contracts and broker

Extend `plugin_protocol.ml/.mli` with validated command descriptors and opaque
command handles. Extend `callback_id` with a bounded callback slot in addition
to its runtime owner; slot zero remains the module activation entrypoint by
definition, not a fallback for malformed IDs. Update all controlled callers to
the explicit representation.

The schematic broker addition is:

```ocaml
type request =
  (* Existing read/query/log constructors remain. *)
  | Register_editor_command of command_descriptor * callback_id

type reply =
  (* Existing reply constructors remain. *)
  | Editor_command_registered
```

The constructor's callback ID is attached by the trusted runtime adapter, not
deserialized as authority from plugin JSON. The C bridge retains the function
inside its own QuickJS context, validates the descriptor, and emits a bounded
slot plus metadata. `Quickjs_runtime` verifies the slot belongs to that runtime
before issuing the owner-bound ID and dispatching to the broker. JS functions,
OCaml closures and JS-chosen runtime-owner numbers never cross into UI payloads.
Unknown, foreign and retired slots fail closed.

Keep the bounded registration registry in the existing broker session. Its
application-facing handle identifies plugin session generation plus command key
and callback ownership. Unload invalidates the generation before pending work
can complete; reloading the same plugin ID cannot revive an old popup item.

Authorization remains deliberately narrow:

| Operation | Required grant |
| --- | --- |
| Register, invoke or execute a configured editor command | `Editor_command` |
| Read editing state | `Editor_read` |
| Read explicit graph entities | `Graph_read` |
| Read current block/page | `Editor_read` and `Graph_read` |
| Query | `Graph_read` and `Db_query` |
| Plugin metadata and bounded diagnostics | None |

`Editor_command` does not imply any read permission, generic worker RPC or
arbitrary graph writes. Future block/page mutations need a separately proposed
graph-write authority and application service. No new permission is needed just
to expose the three already-defined configured actions.

### Runtime and lifecycle changes, not a parallel manager

Extend the existing engine's retained callback table and invocation selection.
Use the same memory/stack/source/message/call/job/CPU/wall-time limits, denied
module imports and owner-thread requirement. Add no `std/os`, timer or import
loader. On failure/staleness/cancellation, close the runtime and broker session
and withdraw registrations, exactly as the existing failure policy requires.

Generalize the existing native `Plugin_read_runner` into `Plugin_runner` rather
than copying its pump/close loop into a second runner. Keep
`Plugin_host.load_read_plugin` and `unload_read_plugin` as explicit read-only
entrypoints, including their early command-grant denial. Add explicit command
load/unload entrypoints and typed descriptor enumeration/invocation. The native
host owns loaded session instances and rejects duplicate live plugin IDs.

State transitions are:

```text
load -> activating -> ready -> invoking -> ready
                    \          \
                     any failure / stale / cancel / unload -> closed
```

Only successful command completion permits reuse. No reentrant invocation or
implicit queue: a busy session is `Invalid_request`, without disturbing the
active call. Suspend pumping when idle; use the existing owner-thread timer
pump when active. Unload clears the timer, cancels active work, invalidates UI
handles and frees retained callback values exactly once.

Each callback receives a new epoch-bound host. Refactor SDK activation's
host/pending-read/diagnostic scope into a shared invocation helper so registered
handlers can use existing Editor/DB calls without re-running `ready` or keeping
the activation host alive. Pending diagnostics retain the existing failure
flush behavior. Before successful reuse, drain runnable jobs and pending host
requests within the same invocation budget; exhaustion retires the instance.
Do not carry queued continuations into a later invocation with a new SDK host.
Unsettled Promises are not background subscriptions; no background event source
is introduced.

### Configured handoff and exact application ownership

Add a distinct typed popup action for portable command handles. Do not route it
through the legacy `Plugin_slash` action or its early trigger erasure. Display
the descriptor using existing LUI slash rows, with a stable plugin/session/key
identity. No HTML, arbitrary UI commands or LUI schema changes are required.

Factor `Popups_state.run_configured` into a shared prepare/execute seam that
both built-in configured commands and portable commands use:

1. **Prepare before JS.** Validate the selected popup/editor origin and reject
   composition, absent editing state or a noncollapsed selection for this first
   slice with `Invalid_request`. Close the selecting popup once, without
   changing editor text. Capture the post-close popup generation, reload origin,
   graph/route/context, editor UUID/epoch/scope, source/buffer, caret/anchor and
   input sequence. Capture `Plugin_read_services` at this point and combine its
   pre-dispatch freshness check with this popup ownership check.
2. **Issue an opaque one-use application ticket.** It retains the captured
   origin and live plugin-session generation. Mutable editor/checkpoint records
   stay in `Popups_state`; JS and the shared broker receive none of them.
3. **Invoke.** Pass fresh captured services to the existing broker/runtime.
   Missing grants, wrong generation/owner, callback errors or stale context
   yield typed errors and no edit, including no slash-trigger removal.
4. **Accept.** The broker validates the complete action program and authority
   before returning it. Its current `accept_program` retires the invocation:
   do not treat a subsequent `Plugin_broker.check` as an execution lease. The
   separate application ticket and still-live session generation authorize
   the handoff after successful broker acceptance.
5. **Execute once.** Recheck the original ticket immediately before the first
   editor/UI effect. Consume it even for an empty result. Encode only through
   `Plugin_configured.output`, validate with `configured_program`, and run the
   shared configured executor. Never capture a replacement origin on arrival.
6. **Advance owned state, not the original read snapshot.** After a model
   change, retain the executor's existing `expected`-model tracking, otherwise
   the plugin's own edit would falsely invalidate its following terminal action.
   Check live plugin ownership plus the configured executor's evolving guard
   through execution; do not keep checking the old read snapshot after applying
   an owned edit.
7. **Delayed UI.** Preserve `configured_checkpoint_current` and
   `install_configured_ui` -> `Editor_commands.run_configured_ui`. The supplied
   `current` closure must additionally require the plugin generation/ticket
   lease to remain live. Unload, popup replacement, graph/route changes, typing,
   selection movement, composition or editor replacement invalidates pending
   handoff. The current calendar stores the checkpoint but not the stronger
   `current` closure (`editor_commands.ml:130,176,1676-1680`), so retain the
   plugin lease in the application checkpoint through the calendar's final
   commit, not only the initial open. Do not replace the installed application
   UI handler with JS.

Only a fully validated program can start effects. Once execution has begun,
unload/staleness prevents remaining or delayed work; it does not roll back
already-applied editor changes. Existing save scheduling is not a transactional
commit acknowledgement. A successful JS call retires its broker invocation,
whereas the UI ticket remains owned until configured execution/delayed UI is
finished or invalidated. These are distinct lifetimes.

Keep dependency direction unchanged: `Popups_state` may call typed host
invocation ports, but `Plugin_host`, `Quickjs_runtime` and `Plugin_broker` must
not import `Popups_state`. The native runner takes caller-supplied captured
services/currentness; it does not discover or refresh UI ownership itself.
The Web `Plugin_host` implements the same typed port as explicitly unavailable
for portable QuickJS commands and returns no such descriptors until its Worker
exists. This does not alter the legacy Web iframe command path or introduce an
iframe fallback for the portable target.

### Concrete module and file boundary

Paths below are relative to the repository root; edits happen only after approval.

| File/module | Proposed responsibility |
| --- | --- |
| `deps/ui/src/contracts/plugin_protocol.ml/.mli` | Command descriptors/handles, callback ownership/slot validation and typed registration request/reply; retain the existing action algebra |
| `deps/ui/src/shared/plugin_broker.ml/.mli` | Session-owned bounded registration phase, capability checks, retirement and enumeration; reuse read/program validation |
| `deps/ui/src/shared/plugin_configured.ml/.mli` | Keep pure closed-action encoding; do not grow application dependencies |
| `deps/ui/quickjs/quickjs_runtime.ml/.mli`, `quickjs_stub.c` | Retain/select callbacks, attach owned IDs, quiesce successful calls and reuse the existing engine lifecycle/budgets |
| `deps/ui/native/plugin_read_runner.ml/.mli` -> `plugin_runner.ml/.mli` | Generalize the existing pump and close owner; explicit read-only versus command profiles, no duplicate runner |
| `deps/ui/native/plugin_host.ml` | Existing read entrypoints plus explicit command load/unload, descriptor snapshots, generation-currentness and typed invoke ports |
| `deps/ui/src/sdk/plugin_host.ml` | Matching unavailable portable command ports for Web compilation; leave legacy iframe execution intact |
| `deps/ui/src/popups/popups_state.ml` | Distinct portable slash action, pre-JS capture, one-use execution ticket, factored configured executor and invalidation |
| `deps/ui/src/editor/editor_commands.ml` | Preserve the installed configured-UI handler and ensure the checkpoint retained for delayed calendar commit includes the plugin lease |
| `libs/src/LSPlugin.quickjs.ts` | Typed registration facade, per-invocation binding and diagnostics/read tracking |
| `deps/ui/test/quickjs/bridge_test.ml`, new `command_plugin.ts`, new `sdk_command_probe.ml` | Real engine contracts and headless application/configured acceptance |
| `deps/ui/scripts/check-quickjs-sdk.sh` | Build/run both retained read proof and new command proof in owned isolated roots |
| This decision document and `docs/api-migrations.md` | Record approval/implementation and explicit new return-program semantics versus unsupported legacy write calls |

`Plugin_read_services` remains the application-owned read adapter. Reuse its
captured services and entity/Wire conversions; no duplicate query or editor
snapshot implementation is proposed. No module is added under `src/sdk/`, so
no native copy rules are needed for this plan.

### Dune and dependency approval request

**One existing Dune file needs approval:** `deps/ui/test/quickjs/dune` adds a
native executable stanza for `sdk_command_probe`, linked to the same
`logseq_ui_native unix threads.posix` libraries as the read probe.

No new Dune file, library, package, engine pin or version change is proposed.
Contracts/shared modules are already automatically discovered. The native
runner rename is covered by `native/dune`'s `:standard` module set. Engine code
continues in the existing C stub/library, so `quickjs/dune` and its platform
math-link flags remain unchanged. `native/dune` also remains unchanged. Any
additional build-file need must be reported before proceeding.

## Alternatives considered

### Lifecycle-only follow-up

Not recommended: owner-bound callbacks, single-flight invocation and failed
instance retirement already exist. The missing vertical slice is actual
configured execution. Add only command registration and reuse safety required
by that slice, not marketplace/settings/subscription lifecycle infrastructure.

### Arbitrary Editor/DB writes first

Deferred: page/block insert/update/delete/move/property APIs require transaction
ownership, target identity, return entities, ordering and error semantics beyond
the existing three-action configured algebra. Raw worker invocation would
bypass the intended capability boundary.

### Reuse the legacy slash branch or recapture after JS

Rejected: early trigger erasure mutates before validation, and a new checkpoint
on reply could authorize a stale program against a different editor. Neither is
fixed by only checking graph identity in the broker.

### Emulate old imperative mutators with an action queue

Rejected: resolving mutation Promises while merely staging actions creates
read-after-write and failure-ordering incompatibilities. Prefer an explicit
return-program contract until real imperative command services are proposed.

### WebView, DOM UI or arbitrary UI event/source strings

Rejected by the runtime decision. The application receives a closed typed
program, not eval strings, HTML, LUI source or unrestricted command names.

## Explicit non-goals

- Marketplace installation/discovery, automatic startup, settings, event/DB
  subscriptions, hot reload or a general background plugin manager.
- Arbitrary block/page/property writes, worker RPC exposure or transaction APIs.
- Toolbar/panel/custom renderer UI, `provideUI`, model/source injection or LUI
  schema changes.
- DOM/CSS, ReactDOM, iframe/WebView fallback, Node/Electron, network, filesystem,
  Git, unrestricted imports or new host timers.
- Swift/Kotlin/Apple Host changes and any edits to `logseq/mobile` or `logseq/lui`.
- DataScript evaluator budgets, interruption, query cancellation parity or worker
  queue preemption. As already decided, stale/cancelled query replies can be
  discarded without interrupting a running evaluator.
- Claiming Web/WASM, iOS or Android runtime acceptance from this native proof.

## Acceptance criteria

- Approval permits implementation only; completion requires the headless
  execution, compilation and regression evidence specified below.

### Retained headless engine and application proofs

Extend the real `bridge_test` and add one `sdk_command_probe`, not a mock-only
test runner. Use the existing native `Platform.install_ui_services`, LUI context
and isolated worker-graph pattern from `sdk_read_probe`.

1. **Lifecycle/registration:** initialize once; publish descriptors only after
   successful activation; select two distinct retained callbacks; invoke the
   same command twice without repeating initialization; unload twice safely.
   Duplicate IDs/keys, late registration, wrong owner/generation, foreign slots,
   over-budget metadata and reentrant invocation fail explicitly. A failed
   activation or runtime error removes all entries and timers.
2. **Permission separation:** deny registration/invocation/actions without
   `Editor_command`; deny reads/query without their existing grants. The
   existing read-only loader must still reject command grants before creating
   a runtime, and reject nonempty programs. No implicit read/write authority.
3. **True configured application path:** from a real headless popup/editor,
   select the typed command, read through the SDK, accept its program and
   execute through the production configured seam. Assert exact resulting
   buffer/caret and slash replacement; flush the normal save path and verify
   stored text in the isolated graph. Assert invalid programs cause no text
   change, even to the trigger. Count execution to prove a ticket cannot replay.
4. **Terminal handoff:** exercise `insertText` followed by `showDatePicker`,
   `exitEditing` and `[]`. A test-installed typed UI sink asserts the captured
   checkpoint/current closure and later invalidation. Compile the real
   `Editor_commands.run_configured_ui` connection; a sink is not evidence of
   visual SwiftUI calendar rendering.
5. **Staleness:** pause on an asynchronous host read and independently change
   graph/route, context revision, editor epoch/scope/source, caret/selection,
   input sequence, composition or popup generation; then resolve the read.
   Expect `Stale_context` and no edits/UI. Also unload after JS acceptance but
   before application execution, and after handoff but before a delayed UI
   callback. Reloading the same plugin ID must not revive an old handle.
6. **Reuse safety:** queued successful continuations are drained under the same
   budget or retire the instance; retained old hosts cannot access the next
   epoch. Cancellation/failure/staleness and late worker replies cannot revive
   a closed session. One-shot tickets survive successful broker invocation
   retirement but never plugin unload. Owned model changes must not falsely
   invalidate a following valid terminal handoff.
7. **Read regression:** retain the existing native read/DB probe, unsupported
   `includeChildren` behavior, exact numeric conversion, bounded diagnostics
   on initializer failure, invalid UTF-8/depth/node/value rejection and existing
   strict C/resource-limit cases.

### Compilation and checks required after approval

From `deps/ui/`, use an owned build directory and a sanitized `env -i` with an
exact-name non-sensitive allowlist, following the current SDK check script:

```sh
dune build quickjs/logseq_plugin_quickjs.cmxa \
  src/shared/logseq_ui_shared.cmxa native/logseq_ui_native.cmxa \
  test/quickjs/bridge_test.exe test/quickjs/sdk_read_probe.exe \
  test/quickjs/sdk_command_probe.exe js_app native/native_embed.exe.o
dune runtest test/quickjs
```

The new command probe target is proposed, not present at the baseline. Build
the worker first and run both probes against separate owned graph/UI roots via
the extended `scripts/check-quickjs-sdk.sh`. This must execute the real native
OCaml/QuickJS code, not only compile it. Preserve C `-Wall -Wextra -Werror` and
the native/Melange boundary checks. Run the existing strict DOM-free TypeScript
check with no DOM/Node libraries, SDK fixture bundling, shared-boundary script,
document validation and `git diff --check`. Linux/macOS CI must retain the
platform math-link regression coverage.

No generated engine sources, bundles, logs, databases or build directories may
be committed. Do not run `swift test`. GUI testing is not required for this
headless slice and would need separate approval. Headless evidence does not
establish visual SwiftUI, Web/WASM or mobile-host behavior.

### Implemented acceptance evidence

- `Plugin_runner` replaces `Plugin_read_runner` and shares its owner-thread pump
  between read activation, command registration and callback invocation.
- `Plugin_host.load_command_plugin` publishes generation-bound handles only
  after successful activation; failures, cancellation and unload retire them.
- The SDK command callback binds a fresh host per invocation. The C bridge owns
  retained callback slots and drains pending jobs/requests before successful
  epoch retirement under the existing execution budget.
- `prepare_configured` captures ownership before JS. A one-use command ticket
  reuses the existing executor; configured checkpoints retain the application
  and plugin lease through delayed UI.
- `scripts/check-quickjs-sdk.sh` passes with both real native SDK bundles and
  separate isolated worker graphs. The command probe checks exact buffer/caret,
  persisted text, permission separation, registration failures, explicit empty
  programs, invalid/undefined results, repeated invocation, one-use application,
  delayed UI ownership, cancellation, unload/reload and independently stale
  editor/context/route/graph/input/composition/popup cases.
- The existing engine contract table now has 26 passing cases, including
  forged callback arguments, duplicate registration, metadata bounds and
  successful-job quiescence. No second command test framework was introduced.
- Native/Melange `dune build @all`, `dune runtest`, native embedding object,
  strict DOM-free TypeScript, C `-Wall -Wextra -Werror` (engine headers treated
  as system headers), shared-boundary and diff checks pass on macOS. The UI
  regression suite reports 5,772 checks and zero failures.
- `docs/api-migrations.md` documents the new return-program API. This slice
  changes only the approved test Dune file; no engine/dependency/platform pin,
  LUI schema, Swift/Kotlin host or mobile source changes are required.

## Risks

- Retained callbacks extend JS value lifetimes. Bounds, explicit release and
  epoch ownership must be tested on every error/close path.
- Reusing a successful runtime is safe only if old runnable work cannot inherit
  a later SDK binding. Existing failure retirement alone does not prove this.
- The configured refactor touches built-in slash behavior. Keep one executor
  and retain built-in trigger, input transformation and terminal regressions.
- Pre-invocation ownership and post-mutation expected-model ownership differ;
  conflating them either permits stale edits or rejects the plugin's own edits.
- A program is not an atomic DB transaction and has no rollback guarantee once
  application has begun. Cancellation cannot undo already-dispatched saves.
- QuickJS remains in-process, not an OS security sandbox. Its execution budgets
  do not bound worker query CPU or provide evaluator cancellation.
- Native headless success does not establish Web/WASM or future mobile parity.
  Keep one SDK/typed contract and avoid platform APIs, but validate other hosts
  separately before advertising support.

## Consequences

Native plugins can reuse supported reads/queries inside user-selected commands
and apply the three existing editor actions without UI-source execution.
The retained runtime and delayed UI are generation/ownership-bound. Plugins
still require rebundling; arbitrary graph writes, automatic discovery, evaluator
cancellation and additional platform runtimes remain outside this slice.

## Questions

1. Approve the next slice as **registered, user-invoked editor commands with
   the existing three configured actions**, reusing/extending current lifecycle
   rather than doing a lifecycle-only refactor or arbitrary graph writes?
   Recommended answer: approve this scope and its explicit non-goals.
2. Approve the explicit `logseq.Commands.registerEditorCommand` return-program
   API instead of claiming compatibility for old imperative write methods or
   overloading their Promise semantics? Recommended answer: approve; document
   the new target/API contract in `docs/api-migrations.md` before implementation
   is considered complete.
3. Approve the **single existing Dune edit** in `deps/ui/test/quickjs/dune` for
   the retained native command probe? Recommended answer: approve; any extra
   Dune/dependency/Host requirement must be reported again first.

### Recorded answers

The user approved all three questions on 2026-11-14. No additional scope,
dependency or Dune edit is approved by that answer.
