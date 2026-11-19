# Preserve display data for selected scoped node choices

## Problem

PR #13589 restores selected nodes that lost their required class by appending shallow property references. Canonical references omit `:block/refs`, so a restored node with UUID references in its title displays raw UUIDs. The renderer REPL reproduced `Read [[11111111-1111-1111-1111-111111111111]]` instead of a readable referenced name.

## Decision

Hydrate selected node choices in the existing `property-node-selector-data` worker response and format their labels against the worker DB. The renderer merges only choices still selected in its current block snapshot, preserving the PR's scope exception during searches. Current result choices are included so newly created selections remain visible before reopening the picker. Remove the test-only four-argument forwarding arity of `scoped-class-nodes` and the shallow-value normalization helper replaced by hydrated choices.

The user has authorized reviewing, simplifying, and fixing this PR. The implementation remains limited to this selector, its worker producer, and regression tests.

## Alternatives considered

### Broader snapshot and loading changes

- Expand all canonical property references: rejected because it broadens snapshot size and ownership beyond this selector.
- Add a separate worker request or effect: rejected because the current selector request already receives the block and owns candidate hydration.
- Include selected nodes only in initial choices: rejected because search replaces initial choices, losing the guaranteed selected exceptions.

## Acceptance criteria

- Selected out-of-scope nodes remain visible and removable without permitting unselected out-of-scope nodes.
- Reference-bearing selected titles display readable names, including hidden node-value wrappers.
- Empty placeholders never become choices; single and multiple values behave consistently.
- Search and deduplication retain the existing behavior.
- Targeted renderer/worker tests and relevant lint pass; renderer runtime probes confirm readable labels.

## Verification

- All nine independent review passes completed. No schema or migration changes are needed.
- The linked-title test failed with raw UUIDs before the fix; the newly-selected-choice test failed with missing rows before its fix.
- Final renderer and worker namespaces: 68 tests, 204 assertions, zero failures/errors.
- The standard unit suite before the final local merge adjustment: 2,583 tests, 12,385 assertions, zero failures/errors; excludes db-sync, long, and fix-me tests.
- `bb lint:dev` passed. Final changed-file Clojure lint passed with zero warnings; `git diff --check` passed.
- Renderer REPL: the original shallow choice displayed `Read [[11111111-1111-1111-1111-111111111111]]`; the final mounted selector displayed `Read [[Named page]]` with `aria-checked=true`.
- The runtime probe used a temporary component with synthetic values. Full graph editing and end-to-end checkbox deletion were not exercised; deletion dispatch remains covered by the existing test. A separate temporary node-worker startup was unavailable because that graph had not been created.

## Consequences

- The response adds transient selected display choices. Filtering them by current selection IDs avoids retaining a choice after removal. No persisted schema, migration, new endpoint, or dependency is required.

- Linked titles remain readable without broadening canonical block snapshots.
- The existing selector state owns transient selected display data; no new endpoint or persisted data is introduced.
- Newly selected result choices remain visible and removed out-of-scope choices are excluded.

## Questions

None. The requested fixes and simplification are already authorized.
