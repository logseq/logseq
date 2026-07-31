# ADR 0019: Replace Rum With HSX

Date: 2026-06-01
Status: Accepted

## Context
ADR 0018 defined the goal of removing Rum mixins, Rum lifecycle maps, and
`rum/reactive` from Logseq's frontend component tree. During implementation we
also need to replace Rum component definitions themselves, because keeping Rum as
the component runtime leaves old lifecycle behavior, implicit reactivity, and
Rum-specific memoization in the rendering path.

Logseq now targets React 19. The old Rum runtime and the old React UMD asset
layout are a poor fit for that target:

- Rum lifecycle maps and mixins hide effect ordering and cleanup.
- `rum/reactive` depends on Rum's render-time reaction tracking.
- `db-mixins/query` relies on an implicit render scope to know which components
  need to refresh after worker DB transactions.
- Rum-style Hiccup allowed several shapes that plain React element creation does
  not accept directly.
- React 19 no longer provides the same browser UMD files that existing desktop
  packaging expected.

The migration must keep behavior stable for editor input, block trees, right
sidebar rendering, properties, query results, settings, import, plugin surfaces,
PDF/code extensions, and mobile UI. It must also preserve hot-path render
performance that previously depended on Rum `:should-update` and `rum/static`.

## Decision
Replace Rum components with HSX components and use Logseq's fork of HSX as the
frontend component runtime.

All application component definitions should use `hsx/defc` instead of
`rum/defc`, `rum/defcs`, or plain `defn` replacements for component code. The
goal is a mechanical runtime migration with the smallest semantic change:
component names remain callable from ClojureScript, Hiccup remains the view
syntax, and hook-based state/effect/query APIs replace Rum mixins.

The runtime dependency is pinned to `https://github.com/logseq/hsx` from all
Logseq dependency roots that compile UI code. The fork is intentional and should
remain visible until its Logseq-specific compatibility changes are accepted
upstream or no longer needed.

## Query Reactivity
Rum `db-mixins/query`, `rum/reactive`, and `util/react` are replaced by explicit
query hooks.

The new query path is:

1. Build a query atom with `frontend.db.react/q`.
2. Subscribe to it from a component with `frontend.db.hooks/use-query`.
3. Let `use-query` register a stable component token with
   `frontend.db.react/add-query-component!`.
4. Let worker DB refresh call `frontend.db.react/refresh!`, recompute affected
   query atoms, and request re-render only for registered components.
5. Remove the component token on unmount so unused query cache entries can be
   removed.

`use-query` must be called at a stable hook position. Components must not call
`db/sub-block`, `model/sub-block`, or `use-query` inside data-dependent loops,
conditionals, helper functions that run a variable number of times, or render
branches that can appear after the first render. If each list item needs its own
subscription, move that subscription into a keyed child component. If a parent
needs many entities, use one query hook that returns the collection.

This makes query reactivity explicit and keeps React hook order independent of
database result size.

## Logseq HSX Fork
The Logseq HSX fork exists to support the migration without broad application
rewrites. Its compatibility surface differs from upstream HSX in these ways:

- `hsx/defc` supports Logseq component metadata such as `^:private` and
  `^:large-vars/*`.
- HSX components can be called as functions from ClojureScript component code,
  matching the common Rum call style used throughout Logseq.
- Function-call component invocation preserves React component identity instead
  of treating the component result as an arbitrary higher-order component.
- Legacy Hiccup child shapes used by Rum-era code are normalized so nested
  vectors of children are treated as children instead of invalid React element
  types.
- React keys and Clojure metadata on Hiccup forms are preserved for React list
  reconciliation.
- Hook-backed memoization uses Clojure data equality where Logseq depends on it,
  avoiding a separate adapter layer for immutable CLJS values.
- React 19 element creation is supported without depending on removed React
  internals or old UMD asset paths.
- Known higher-order component values can be marked explicitly with `^:hoc`;
  ordinary render-time anonymous functions should not be treated as HOCs.

These differences are compatibility requirements, not a license to preserve Rum
internals in application code. New component code should use direct HSX, React
hooks, and Logseq hook wrappers instead of adding more compatibility behavior to
the fork.

## Hook Rules
The migration follows normal React hook rules:

- Hooks are only called in `hsx/defc` component bodies or custom hooks.
- Hooks are called unconditionally and in the same order on every render.
- Data-dependent subscriptions are moved to keyed child components or combined
  into one collection query.
- Render-time getters are used only outside component reactivity or when the
  caller intentionally does not need re-rendering.
- Component views that need reactive app state use `state/use-sub`; non-view
  helpers use getters.
- Component views that need reactive DB query results use `db.hooks/use-query`.

This replaces the old implicit Rum rule where `rum/reactive` could be introduced
inside helpers and still be attached to the current Rum component.

## Consequences
- Rum mixin namespaces and lifecycle maps can be removed instead of wrapped.
- Query refresh behavior becomes inspectable through
  `frontend.db.react/*query-state`, `component->query-key`, and
  `query-key->components`.
- Components that previously relied on `rum/static` or `:should-update` need
  explicit smaller memoized children, stable keys, or collection-level queries.
- Code that used component functions as plain render helpers can keep doing so
  through the Logseq HSX fork, but new code should prefer clear component
  boundaries.
- Packaging must bundle React browser globals instead of copying old React UMD
  files.
- Runtime compatibility issues should be fixed in HSX only when they represent
  valid Logseq Hiccup/component semantics; application bugs should be fixed in
  application code.

## Verification
Before merging the migration, verify:

- no `rum/defc`, `rum/defcs`, `rum/reactive`, `rum/static`, `rum/local`,
  `frontend.mixins`, or `frontend.db-mixins` usage remains in application UI
  code;
- no `db/sub-block`, `model/sub-block`, `state/use-sub`, or `use-query` calls
  violate React hook ordering;
- query subscriptions clean up after unmount and refresh affected components
  after worker DB transactions;
- block edit, split, merge, undo, redo, sidebar, page graph, properties, scoped
  tags, settings, import, code blocks, PDF, plugin UI, and mobile surfaces keep
  prior behavior;
- hot block-tree operations do not re-render unrelated sibling blocks;
- React console output has no hook-order, invalid element, invalid nesting, or
  missing-key warnings for covered flows;
- `bb dev:lint-and-test` passes;
- app E2E tests pass, excluding only explicitly skipped RTC-related tests when
  the test run is configured that way.
