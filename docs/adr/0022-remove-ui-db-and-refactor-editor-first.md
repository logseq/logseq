# ADR 0022: Remove the UI DataScript DB and Refactor Editor First

Date: 2026-07-08
Status: Accepted

## Context

The db worker is the durable owner of graph data, but the renderer has still
kept a second DataScript connection as a UI read model. That split makes graph
reads harder to reason about because UI code can read stale renderer entities,
perform reverse lookups locally, or depend on lazy entity navigation that does
not exist when the worker database is the only graph database.

The renderer has used this UI DB through several shapes:

- direct `d/entity`, `d/pull`, `d/q`, `db/entity`, `db/pull`, and
  `db-model/*` calls;
- reverse lookup attributes such as `:block/_alias` and `:block/_refs`;
- nested entity or pull-map reads such as reading fields from
  `(:block/parent block)`;
- handler code that performs graph-backed editor calculations before
  dispatching worker transactions.

The editor is the highest-risk migration surface because it combines block
tree reads, sibling and parent selection, paste, delete, merge, quick-add,
navigation, undo metadata, DOM focus, and outliner transactions. Removing the
UI DB without simplifying editor ownership would preserve the same complexity
behind async worker calls.

## Decision

Remove the renderer-owned DataScript database as a graph read model.

The db worker is the only owner of graph facts. UI code must not depend on
DataScript entities, lazy entity navigation, reverse lookup attributes, or
renderer-side pull maps for graph computation.

Refactor editor ownership first:

1. Move graph-backed editor calculations to worker APIs.
2. Add worker editor namespaces where editor-specific graph operations need a
   clear home.
3. Keep UI editor handlers thin: they dispatch user intent, coordinate DOM and
   focus state, and consume explicit worker payloads.
4. Return plain data from worker APIs with explicit fields needed by the UI.
   Do not rely on entity identity, lazy nested refs, or reverse attributes.
5. Keep components focused on rendering and event dispatch. Component
   migration comes after handler/editor contracts are explicit.

Do not add a renderer cache to replace the UI DB. If a cache becomes necessary,
it must have a narrowly documented owner, invalidation rule, and test case.
The default design is no cache.

Do not keep a compatibility layer that lets UI code continue to call
renderer-style DB helpers. Compatibility wrappers may remain only while their
call sites are being removed, and they must not hide a second graph database.

## Migration Shape

1. Add guard tests that count and reject direct UI DB reads, reverse lookups,
   and nested entity or pull-map assumptions in frontend UI code.
2. Remove direct `d/entity`, `d/pull`, `d/q`, `db/entity`, `db/pull`,
   `db-model/*`, and renderer `conn/get-db` reads from handlers and events.
3. Move editor calculations to worker APIs before converting component-heavy
   surfaces.
4. Replace reverse lookup usage with worker-owned queries that return explicit
   result fields.
5. Replace nested entity reads with explicit worker payloads, for example
   parent ids, page ids, children, aliases, refs, or sibling blocks.
6. Keep outliner writes on worker-backed transaction paths and keep UI code
   out of DB transaction assembly when the worker can own the calculation.
7. Convert components last so they render worker-shaped data and dispatch UI
   events without graph reads.
8. Run focused tests after each migration batch, then run the broader test and
   e2e suites when the UI DB removal is complete.

## Consequences

UI code becomes more explicit. It must ask the worker for the graph data or
editor decision it needs instead of navigating a local entity graph.

Worker APIs increase during the migration, especially around editor behavior.
That is intentional when the API represents a real graph-backed editor
operation. APIs should stay narrow and return plain data.

Editor behavior needs stronger focused coverage because many previously local
reads become async worker calls. Tests should cover insert, delete, merge,
paste, quick-add, sibling navigation, focused-root behavior, and reverse lookup
replacement paths.

Component migration is delayed until handler and editor worker contracts are
stable. This keeps rendering code simpler and avoids moving complex graph
calculation into components.

The removal may temporarily leave old helper namespaces in place while call
sites are drained, but the target architecture has no renderer-owned graph DB.

## Rejected Alternatives

### Keep a Renderer Read Cache

A renderer cache would preserve much of the old split-brain behavior and would
need invalidation logic for every worker transaction, sync update, import,
undo, redo, and rebase path. That adds complexity without solving ownership.

### Convert Components Before Editor

Component-first migration would move the easiest render reads first while
leaving the most complex graph-backed behavior in handlers. Editor behavior
would continue to depend on old assumptions, and later changes would force a
second pass through component contracts.

### Preserve Entity-shaped Worker Results

Returning entity-like maps with nested refs would keep the renderer coupled to
DataScript navigation semantics. Explicit worker payloads are easier to test,
serialize, and reason about across thread boundaries.
