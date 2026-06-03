# ADR 0021: RFX-managed Frontend State

Date: 2026-06-03
Status: Accepted

## Context

ADR 0019 replaced Rum with HSX and moved the UI runtime onto React 19. The
frontend now has a React-compatible component runtime, but application state is
still managed by `frontend.state` through a large global atom plus many nested
atoms.

The current state layer has several responsibilities mixed together:

- `frontend.state/state` stores the main application map.
- Many values inside that map are themselves atoms, for example editor,
  selection, RTC, PDF, command palette, scroll, and other high-churn UI refs.
- `frontend.state/use-sub` provides React subscriptions by wrapping the global
  atom or a nested atom with `logseq.shui.hooks/use-atom`.
- `frontend.state/get-state`, `set-state!`, and `update-state!` are used across
  handlers, components, workers, plugins, mobile code, and Electron integration.
- `frontend.state/pub-event!` publishes vectors to a `core.async` channel stored
  at `:system/events`.
- `frontend.handler.events` consumes that channel and routes events through a
  `defmulti`.
- Worker DB queries and component subscriptions use a separate reactive layer in
  `frontend.db.react` and `frontend.db.hooks`.
- Several subsystems use Missionary flows or direct atom watches for runtime
  state that is not just component state.

This makes UI reactivity explicit enough for React hooks, but the ownership is
still split between path cursors, nested atoms, a global event channel, and a
large set of imperative helpers. A code scan showed the size of the migration
surface:

- about 178 `state/use-sub` call sites under `src/main/frontend`;
- about 310 `set-state!` or `update-state!` call sites under
  `src/main/frontend`;
- about 190 `pub-event!` call sites under `src/main/frontend`;
- about 102 `frontend.handler.events/handle` methods.

RFX is a better fit for the next step because it keeps the re-frame style
architecture while using React Context and hooks instead of Reagent. It provides
scoped app instances, `use-sub`, `dispatch`, `reg-sub`, `reg-event-db`,
`reg-event-fx`, effects, coeffects, snapshots, and a queue. Logseq has already
forked RFX and added root `deps.edn` support on `logseq/rfx` branch
`logseq/fork`, commit `d37aaceb37fcaf969c5cd04646dfdb985d65d3c2`.

The migration must not destabilize editor input, block trees, DB worker
transactions, RTC, plugin APIs, Electron IPC, mobile native flows, or
DataScript query subscriptions.

## Decision

Adopt RFX as the frontend application state and event runtime.

Add RFX to the main frontend dependency root from the Logseq fork:

```clojure
io.github.logseq/rfx
{:git/url "https://github.com/logseq/rfx.git"
 :git/sha "d37aaceb37fcaf969c5cd04646dfdb985d65d3c2"}
```

Create a Logseq-owned RFX context, store, and registry. The context should be
provided near the root render in `frontend.core`, around `page/current-page`.
The RFX instance must be initialized during frontend startup before event
handling starts.

Replace `frontend.state` as the state owner in one coordinated migration.
Existing non-hook public entry points may remain as thin call-through APIs only
when they preserve caller compatibility without keeping state outside RFX:

- `get-state`
- `set-state!`
- `update-state!`
- `pub-event!`
- focused helpers such as `get-current-repo`, `set-current-repo!`,
  `get-config`, editor helpers, selection helpers, and RTC helpers

Replace all `frontend.state/use-sub` and focused hook call sites with
`rfx/use-sub` or Logseq-owned domain hooks backed by RFX subscriptions. Do not
keep `frontend.state/use-sub` as a compatibility wrapper. `get-state`,
`set-state!`, `update-state!`, and focused non-hook helpers should read
snapshots or dispatch RFX events instead of mutating the old global atom.

Use one source of truth:

- Frontend application state is plain data in the RFX app db and is updated
  through RFX events.
- Nested atoms must not remain as the representation for application state.
  Convert nested atom state to plain values and path updates during the
  migration.
- Missionary flows and direct atom watches must not remain as state propagation
  paths for frontend application state. Replace them with RFX subscriptions,
  events, effects, and coeffects.
- Imperative resources such as DOM nodes, editor handles, timers, external
  worker objects, Electron handles, and plugin runtime handles stay outside the
  RFX app db. They may be held in refs only when they are not renderable
  application state and do not drive UI subscriptions directly.

Migrate every frontend state domain and its event handlers in the same change.
Do not land partial domain migrations. State-only migrations that still rely on
`frontend.handler.events/handle` for writes are rejected, and event-only
migrations whose render state still lives behind legacy path cursors are also
rejected.

`pub-event!` may remain as the public promise-returning compatibility API for
callers, but it should dispatch into RFX instead of writing to `:system/events`.
It must route to explicit `rfx/reg-event-db` or `rfx/reg-event-fx`
registrations and resolve or reject the deferred promise from the RFX event
result. Do not keep a bridge that invokes the existing
`frontend.handler.events/handle` multimethod.

Use RFX to replace flow-based frontend state propagation. DataScript execution
and worker-owned invalidation can remain worker responsibilities, but
UI-facing query result state and refresh orchestration should be exposed through
RFX subscriptions and events instead of Missionary flows or atom watches.

## Migration Shape

The migration should be one coordinated replacement of the frontend state and
event runtime.

1. Add the RFX dependency and create a small `frontend.rfx` namespace that owns
   the app context, registry, initialization, dispatch helpers, and root
   provider.
2. Move the initial plain app state map construction out of the `defonce state`
   expression into a reusable function.
3. Move all frontend application state domains to plain RFX app-db values,
   including route state, graph/current repo state, search, modals, sidebars,
   theme flags, auth tokens, import/loading state, editor state, selection,
   command palette, PDF, RTC UI state, plugin UI state, Electron UI state, and
   mobile UI state.
4. Replace all `frontend.handler.events/handle` methods with explicit
   `rfx/reg-event-db` or `rfx/reg-event-fx` registrations. Keep event ids
   domain-scoped and register effects/coeffects for DB worker calls, RTC,
   plugins, Electron IPC, mobile native calls, and async error capture.
5. Replace `:system/events` with RFX dispatch behind `pub-event!` and remove the
   `core.async` event channel.
6. Replace Missionary flows and direct atom watches that propagate frontend
   application state with RFX subscriptions, events, effects, and coeffects.
7. Replace all `frontend.state/use-sub` and focused state hook call sites with
   `rfx/use-sub` or domain hooks backed by `rfx/reg-sub`.
8. Remove nested atoms, path cursors, and legacy hook paths for application
   state. Keep refs only for imperative resources that do not represent
   renderable state.
9. Update tests in the same change so every moved domain has coverage for state
   reads, event-driven writes, async effects, and promise resolution.

Each domain should have a clear owner namespace, subscription ids, event ids,
effects, coeffects, and test coverage.

## Consequences

State ownership becomes explicit. Components subscribe through React-safe RFX
hooks, while non-view code can use RFX snapshots and dispatch against the same
instance.

Tests and isolated UI surfaces can create scoped RFX contexts instead of
mutating the global `frontend.state/state` atom. This matches the context model
introduced by the HSX migration.

The event system gains a uniform event/effect/coeffect shape and immediately
replaces the `core.async` channel plus `defmulti` dispatch path.

The migration cannot be a mechanical atom swap. Nested atom mutation does not
automatically notify RFX subscriptions. State must move to plain values, and
writes must move to RFX events.

Compatibility wrappers may remain only as public API aliases that call into RFX.
They must not retain separate storage, separate event dispatch, Missionary flow
state propagation, or direct atom-watch state propagation.

RFX effects that run async work must preserve existing error reporting behavior,
including `:capture-error` and promise rejection paths used by callers of
`pub-event!`.

## Rejected Alternatives

### Keep `frontend.state` As-is

This avoids migration cost but leaves Logseq with a custom subscription system
after the React 19 and HSX migration. It also keeps event routing separate from
state updates and does not give isolated RFX contexts for tests or component
development.

### Replace Only `pub-event!`

Moving events to RFX while leaving render state on path cursors would improve
event structure, but components would still subscribe through the custom atom
layer. It would not solve the state ownership problem.

### Migrate Domain-by-Domain

An incremental domain migration would leave two state and event runtimes active
for too long. That would preserve the current split ownership across RFX,
legacy path cursors, Missionary flows, atom watches, the `core.async` event
channel, and `defmulti` handlers. The migration should replace all frontend
application state domains and handlers together.

### Migrate State Without Event Handlers

Moving state keys to RFX while keeping their writes in
`frontend.handler.events/handle` would preserve the current split ownership in a
new form. RFX-managed state must be written through RFX events, so state and
event handlers should move together.

### Keep `frontend.state/use-sub` As A Wrapper

Keeping `frontend.state/use-sub` as a compatibility hook would preserve the old
subscription boundary and make it harder to see which code is using RFX
subscriptions directly. All hook call sites should move to `rfx/use-sub` or
domain hooks backed by RFX.

### Keep Missionary Flows For Frontend State

Keeping Missionary flows or atom watches as frontend state propagation would
leave RFX as only a partial store. Worker internals can still use their own
runtime mechanisms, but UI-facing state should be expressed through RFX
subscriptions and events.

### Keep DataScript Query Reactivity Outside RFX

Keeping `frontend.db.react` and `frontend.db.hooks/use-query` as a separate
UI-facing subscription layer would leave another flow-like state runtime beside
RFX. Query execution and worker invalidation may stay in the DB worker, but the
frontend-facing subscription and refresh contract should be mediated through
RFX.

## Verification

Before accepting the migration, verify:

- root rendering is wrapped in the Logseq RFX context;
- no `frontend.state/use-sub` call sites remain;
- direct `rfx/use-sub` and domain hook call sites obey React hook ordering;
- RFX-managed keys re-render components after `set-state!`, `update-state!`,
  and event handlers update them;
- all frontend application state domains update through RFX events, with no
  remaining legacy `defmethod handle` write path;
- no Missionary flow or direct atom watch remains as a frontend application
  state propagation path;
- non-managed refs are limited to imperative resources and do not drive UI
  subscriptions directly;
- `pub-event!` still returns a promise that resolves or rejects with the event
  result;
- event errors are logged and reported through the existing capture path;
- graph switching, route changes, theme toggles, sidebars, modals, settings,
  search, import progress, login state, plugin UI, Electron IPC, mobile tabs,
  RTC indicator, editor editing, and block selection keep prior behavior;
- UI-facing DB query result subscriptions and refresh orchestration go through
  RFX, while worker-owned query execution and invalidation keep prior behavior;
- no React hook-order warnings, invalid element warnings, or missed subscription
  updates appear in Chrome;
- focused unit tests cover every state domain, event registration, effect,
  coeffect, non-hook compatibility wrapper, and replaced flow path;
- `bb dev:lint-and-test` passes;
- relevant app or CLI E2E tests pass for graph switch, editor input, selection,
  sidebar, settings, plugin, and sync surfaces touched by the migrated keys.
