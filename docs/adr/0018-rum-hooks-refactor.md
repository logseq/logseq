# ADR 0018: Complete Rum Hooks Refactor

Date: 2026-05-29
Status: Proposed

## Context
Logseq frontend, mobile, and shui UI code still relies on Rum mixins and old
Rum lifecycle maps for state, subscriptions, query registration, event
listeners, memoization, DOM effects, and cleanup.

The current `master` tree has broad usage:

- 542 `rum/defc` components and 120 `rum/defcs` components under `src/main`
  and `deps/shui/src`.
- 100 `rum/local` usages.
- Heavy use of `rum/reactive`, `rum/static`, `db-mixins/query`,
  `mixins/container-id`, custom lifecycle maps, and `:should-update`.
- Shared mixin definitions in `src/main/frontend/mixins.cljs` and
  `src/main/frontend/db_mixins.cljs`.
- Existing hook wrappers in `deps/shui/src/logseq/shui/hooks.cljs`, with
  selected atom hooks re-exported from `src/main/frontend/rum.cljs`.

Mixins hide side effects and make component behavior harder to reason about.
The most sensitive cases are editor focus and cursor handling, block tree
rendering, reactive query refresh, plugin rendering, PDF/code integrations, and
mobile mount/unmount effects.

## Decision
Replace all existing Rum mixins and Rum lifecycle maps with hook-based component
code as a complete refactor.

The migration uses one explicit hook path for state, effects, subscriptions,
event listeners, query registration, memoization, and cleanup. The old mixin
namespaces must be removed by the end of the refactor, not left as wrappers or
compatibility shims.

The migration applies to:

- `src/main/frontend/`
- `src/main/mobile/`
- `deps/shui/src/`

The refactor is not complete until there is no behavior regression and no
performance regression on the affected UI paths. Any replacement hook must match
the old lifecycle timing, subscription semantics, cleanup behavior, and
memoization characteristics where those characteristics were observable.

Replacement code must use public React/Rum hook APIs only. It must not depend on
Rum internals such as `rum/*reactions*`, private dynamic bindings, or
reimplementations of `rum/reactive` under another name.

## Hook Foundation

Add hook APIs before migrating broad component areas. These hooks are the new
implementation path, not an adapter layer over the old mixin namespaces.

1. Add subscription hooks for render-time `rum/react`, `util/react`, and
   `state/sub` usage:
   - `frontend.state/use-sub`
   - `frontend.state/use-sub-config`
   - `frontend.state/use-sub-editing?`
   - keep `frontend.rum/use-atom` and `frontend.rum/use-atom-in` as the
     atom-level APIs.
2. Replace `db-mixins/query` with an explicit hook-backed query scope.
   `db-mixins/query` currently binds `frontend.db.react/*query-component*` and
   `*reactive-queries*` during render, then removes the component token on
   unmount. The replacement should create a stable component token with
   `use-ref`, register cleanup with `use-effect!`, and bind query tracking
   while rendering the body.
3. Replace `rum/local` with:
   - `rum/use-state` for values that affect rendering;
   - `rum/use-ref` for mutable values that should not trigger rendering;
   - `frontend.rum/use-atom` only where the state is intentionally atom-shaped
     and shared with existing functions.
4. Replace event mixins with hook APIs:
   - `use-event-listener`
   - `use-window-keydown`
   - `use-window-keyup`
   - `use-hide-on-esc-or-outside`
   - `use-modal-state`
5. Replace `mixins/container-id` with an explicit `use-container-id` hook that
   derives from the same stable key currently built in the mixin.

## Lifecycle Mapping

Rum lifecycle maps are migrated directly to hooks:

- `:init`: use lazy `use-state`, `use-ref`, or pure `let` bindings. Do not move
  side effects here.
- `:will-mount`: use `use-effect!` or `use-layout-effect!` with an empty
  dependency vector.
- `:did-mount`: use `use-effect! []` for subscriptions, timers, and network
  work; use `use-layout-effect! []` for focus, sizing, and DOM measurement.
- `:did-update`: use `use-effect!` with explicit dependencies. Use a first-render
  guard only when old behavior intentionally skipped mount.
- `:will-update`: derive values during render, or use a previous-value ref plus
  effect when side effects are required.
- `:will-unmount`: return cleanup from the effect that created the resource.
- `:wrap-render`: replace with explicit wrapper functions, macros, profiling
  calls, or error-boundary components.
- `:should-update` and `rum/static`: replace with smaller memoized child
  components, `React.memo`, or no memoization if the old optimization is not
  meaningful.
- `:did-catch`: keep explicit class-based error boundaries where needed. React
  hooks cannot replace render error boundaries.

## Migration Order

### Phase 1: Hook Foundation

1. Add state subscription, event listener, container id, and query-scope hooks.
2. Add focused tests for subscription cleanup and query cleanup.
3. Add a lint/search check that blocks new Rum mixin usage.
4. Migrate one small component from each behavior category:
   - one `rum/local` component;
   - one lifecycle component;
   - one `db-mixins/query` component;
   - one `rum/reactive` component.

### Phase 2: Low-Risk Leaf Components

Migrate components without editor focus, query refresh, plugin rendering, or PDF
behavior.

Good first targets:

- `src/main/frontend/components/avatar.cljs`
- `src/main/frontend/components/window_controls.cljs`
- `src/main/frontend/components/find_in_page.cljs`
- `src/main/frontend/components/selection.cljs`
- simple `src/main/mobile/components/*` components
- simple `deps/shui/src/logseq/shui/*` components

For each file, remove mixins, convert `rum/defcs` to `rum/defc` when the `state`
parameter is gone, and use hooks for subscriptions and effects.

### Phase 3: Shared Query Components

Migrate components that combine `rum/reactive` and `db-mixins/query`.

Targets include:

- page and block references;
- property values;
- query result views;
- journal and all-pages views;
- right sidebar block/page renderers.

Every `react/q` consumer should move from `util/react` or `rum/react` to a hook
subscription. Query cleanup must be verified by checking
`frontend.db.react` component maps after mount/unmount.

### Phase 4: Editor, Block Tree, and Navigation

Migrate the high-risk rendering core in small PRs by behavior:

1. Editor search and autocomplete lifecycles.
2. Editor input event listeners and cursor restoration.
3. Block content/edit switching.
4. Asset rendering and upload/download state.
5. Block container query scope and sidebar state.
6. Page mount/update side effects.
7. Header/sidebar collaboration and recent-highlight behavior.

Primary files:

- `src/main/frontend/components/editor.cljs`
- `src/main/frontend/components/block.cljs`
- `src/main/frontend/components/page.cljs`
- `src/main/frontend/components/header.cljs`
- `src/main/frontend/components/container.cljs`

Use `use-layout-effect!` for focus, selection, size, and scroll effects that
depend on mount/update ordering.

### Phase 5: Extensions and Heavy Integrations

Migrate extension components after core hooks are stable:

- `src/main/frontend/extensions/code.cljs`
- `src/main/frontend/extensions/fsrs.cljs`
- `src/main/frontend/extensions/latex.cljs`
- `src/main/frontend/extensions/pdf/core.cljs`
- `src/main/frontend/extensions/video/youtube.cljs`

These contain third-party DOM integrations, delayed rendering, timers, and
external cleanup. Prefer one integration per PR.

### Phase 6: Remove Old Mixin API

After all usage is gone:

1. Delete `src/main/frontend/mixins.cljs`; move any still-needed non-mixin
   helper logic into hook-focused namespaces before deletion.
2. Delete `src/main/frontend/db_mixins.cljs`.
3. Remove unused `rum/reactive`, `rum/static`, `rum/local`, and lifecycle map
   imports/usages.
4. Keep a permanent lint or CI search check blocking:
   - `rum/reactive`
   - `rum/static`
   - `rum/local`
   - `rum/defcs`
   - lifecycle keys in Rum component declarations
   - `frontend.mixins`
   - `frontend.db-mixins`

## Consequences

- Component side effects become explicit and locally inspectable through hooks.
- Query refresh cleanup must preserve stable component identity, or query state
  can leak.
- Subscription hooks need explicit dependency handling to avoid stale renders.
- Editor focus and cursor behavior can regress if layout-sensitive work moves to
  normal effects.
- Removing `rum/static` and `:should-update` may change render frequency. Hot
  paths need smaller memoized children or measured `React.memo` usage.
- Error boundaries remain a class-component concern and must be represented as
  explicit boundary components.
- The refactor has a hard cleanup boundary: `frontend.mixins` and
  `frontend.db-mixins` must not remain in the final tree.
- Performance-sensitive paths need before/after evidence when their
  memoization, subscription, or render frequency changes.

## Verification

Each migration batch should run the narrowest relevant checks first, then broader
checks for shared behavior:

- focused hook tests for subscription and query cleanup;
- namespace-level unit tests where present;
- smoke compile for frontend and mobile targets;
- manual smoke checks for page load, block edit, slash command, page search,
  block search, toggle block, drag block, right sidebar, asset block, query
  blocks, PDF, code block rendering, flashcards, and YouTube embeds;
- app E2E tests for affected UI flows must pass. Run `bb test` from
  `clj-e2e/`, or `bb -f clj-e2e/bb.edn test` from the repo root;
- CLI E2E tests must pass when a migration batch touches CLI-facing behavior,
  command rendering, graph import/export behavior, or shared code used by the
  CLI. Run `bb -f cli-e2e/bb.edn test --skip-build` from the repo root after
  building when needed;
- render-count or profiling checks for hot paths whose `rum/static`,
  `:should-update`, query subscription, or editor/block rendering behavior
  changes;
- `bb dev:lint-and-test` before merging broad shared changes.

## Completion Criteria

- No `rum/reactive`, `rum/static`, `rum/local`, `rum/defcs`,
  `frontend.mixins`, or `frontend.db-mixins` usage remains in application
  component code.
- `src/main/frontend/mixins.cljs` and `src/main/frontend/db_mixins.cljs` are
  removed from the repository.
- No Rum lifecycle maps remain in component declarations.
- Query subscriptions mount, refresh, and unmount without leaking entries.
- Editor, block tree, page navigation, right sidebar, properties, query results,
  PDF, code, and mobile surfaces pass focused smoke checks.
- No known behavior regressions remain open against the affected UI paths.
- No known performance regressions remain open against the affected hot paths.
- Relevant app E2E tests pass for every affected UI flow.
- CLI E2E tests pass for batches that affect CLI-facing shared behavior.
- `bb dev:lint-and-test` passes.

## Follow-up Work

1. Implement the hook foundation and tests.
2. Add the lint/search guard for new mixin usage.
3. Migrate low-risk leaf components first.
4. Migrate query-scope components outside the editor/block tree.
5. Migrate the editor, block tree, page, header, and container components.
6. Migrate extension integrations.
7. Delete old mixin namespaces and enforce the permanent ban.
8. Capture before/after performance evidence for editor, block tree, page load,
   right sidebar, query result, and PDF/code surfaces before declaring the
   refactor complete.
