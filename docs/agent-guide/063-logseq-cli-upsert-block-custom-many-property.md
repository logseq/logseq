# Logseq CLI Upsert Block Custom Many Property Reliability Plan

Goal: Fix `logseq upsert block --update-properties` so custom public properties with `type=default` and `cardinality=many` can reliably persist multiple values on blocks.

Architecture: Keep CLI command shape stable and preserve `upsert property` / `upsert block` UX.
Architecture: Apply the core behavior fix in outliner property write logic (`:batch-set-property`) because db-worker-node forwards ops without property-value normalization.
Architecture: Add end-to-end regression coverage in CLI integration tests and low-level behavioral coverage in outliner property tests.

Tech Stack: ClojureScript, Datascript, Promesa, Logseq CLI command layer, db-worker-node thread-api, outliner ops (`deps/outliner`), existing CLI integration test harness.

Related:
- `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/044-logseq-cli-upsert-block-page.md`
- `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/045-logseq-cli-property-type-and-upsert-option-unification.md`
- `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/043-logseq-cli-tag-property-management.md`

## Problem statement

A reproducible CLI flow currently fails or behaves inconsistently when assigning multiple values to a custom property on a block:

1. `graph create`
2. `upsert property --name "Reproducible steps" --type default --cardinality many --public true`
3. `upsert block --update-properties '{"Reproducible steps" ["Step 1" "Step 2" "Step 3"]}'`

Observed behavior:
- String-vector payload can fail with a generic CLI `http request failed` during `:batch-set-property`.
- A numeric-id vector payload may report `ok` but still not materialize expected property datoms on the target block.

Expected behavior:
- The target block should persist exactly three values for that custom property.
- CLI should provide deterministic success/failure semantics for both title-based values and id-based values.

## Current implementation snapshot

| Layer | File | Current behavior |
| --- | --- | --- |
| CLI upsert command wiring | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs` | `upsert block` (create/update paths) resolves properties and emits `[:batch-set-property [block-ids k v {}]]`. |
| CLI property parse/resolve | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` | `allow-non-built-in? true` path supports custom properties and many values. |
| db-worker-node bridge | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` | `:thread-api/apply-outliner-ops` forwards ops to outliner; no property-value normalization. |
| Outliner op execution | `/Users/rcmerci/gh-repos/logseq/deps/outliner/src/logseq/outliner/op.cljs` | `:batch-set-property` delegates to `outliner-property/batch-set-property!`. |
| Property value conversion | `/Users/rcmerci/gh-repos/logseq/deps/outliner/src/logseq/outliner/property.cljs` | `convert-ref-property-value` is scalar-centric and has incomplete/implicit handling for custom ref-many collection values. |

## Scope and non-goals

This plan fixes custom property many-value persistence for block updates through CLI upsert/update flows.

This plan includes both string-input and id-input value shapes for custom `default` + `many` properties.

This plan does not redesign property schema semantics.

This plan does not change CLI command flags or argument names.

This plan does not add new thread-api methods.

## Proposed behavior

For custom public properties (`:user.property/*`) with `:db.cardinality/many` and ref-capable types (including `:default`):

- `--update-properties '{"Name" ["Step 1" "Step 2" "Step 3"]}'` should persist three values on the block.
- `--update-properties '{"Name" [180 181 182]}'` should persist three values on the block when ids are valid entities.
- `--update-properties '{"Name" []}'` should clear the property from the target block.
- Duplicate input values should be preserved at input semantics level (CLI/outliner must not proactively dedupe user input before write).
- Result must be observable via Datascript query as expected datoms for that block/property.

Failure cases should return explicit error payloads (invalid values, invalid ids, schema mismatch), not silent no-op behavior.

## Root-cause hypothesis

Primary hypothesis:
- `batch-set-property!` in outliner currently applies ref conversion in a way that is optimized for scalar values and does not consistently normalize collection values for custom ref-many properties.
- `convert-ref-property-value` treats collection values as a special case only when all elements are integers; string collection conversion is not explicit/element-wise for many mode.
- This causes unstable behavior in CLI flows that legitimately pass many values.

Secondary hypothesis:
- Success responses can occur even when final value conversion does not produce a valid persisted property value set for the target block.

## Testing plan (TDD first)

I will follow `@test-driven-development` and add/adjust tests before implementation changes.

### Outliner-level tests (RED first)

Add tests in:
`/Users/rcmerci/gh-repos/logseq/deps/outliner/test/logseq/outliner/property_test.cljs`

1. Add failing test: custom property (`:user.property/reproducible-steps`) with `:default + many`, call `batch-set-property!` with string vector values, assert three persisted values.
2. Add failing test: same property, call `batch-set-property!` with numeric id vector, assert three persisted values.
3. Add failing test: mixed/invalid value set returns explicit error and does not partially persist.
4. Add regression assertion that built-in many properties (for example tags/page-tags-like behavior) remain unchanged.

### CLI integration tests (RED first)

Add tests in:
`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`

5. Add failing end-to-end test:
   - create graph
   - upsert custom property (`default + many + public`)
   - upsert block with string-vector update-properties
   - query and assert exactly three values on target block.
6. Add failing end-to-end test for id-vector values.
7. Ensure assertion helper is many-aware (do not rely on scalar-only query helpers).

### Optional command-level guard tests

8. If needed, add command-level tests in:
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`
   to verify many-value payload survives parse/build-action shape without lossy normalization.

## Detailed implementation plan

1. In `/Users/rcmerci/gh-repos/logseq/deps/outliner/src/logseq/outliner/property.cljs`, introduce explicit many-aware ref conversion helper (for example, scalar conversion + collection mapping wrapper).
2. Keep existing scalar conversion semantics as baseline for non-many properties.
3. In `batch-set-property!`, compute cardinality from property entity and branch conversion flow:
   - one: current scalar conversion path
   - many: normalize to collection and convert each element deterministically.
4. Ensure string inputs for custom default properties create/reuse property value entities element-by-element.
5. Ensure integer/ref inputs for many mode are validated and preserved element-by-element.
6. Preserve validation (`throw-error-if-invalid-property-value`) after conversion and before tx construction.
7. Ensure self-reference protection for ref values also works in many mode (check each resolved element against block id when applicable).
8. Keep transaction generation centralized via `build-property-value-tx-data` and avoid introducing duplicate write paths.
9. Add explicit error context when conversion fails in many mode (property id, incoming value shape) to reduce generic `http request failed` surface area.
10. Re-run newly added outliner tests and iterate until green.
11. Re-run CLI integration tests and confirm end-to-end pass for both string-vector and id-vector payloads.
12. Confirm existing upsert flows for built-in properties still pass.

## Edge cases to cover

- Empty vector value for many property should clear the property on the target block.
- Duplicate values in input vector should be preserved at input semantics level (no proactive dedupe in CLI/outliner conversion path).
- Mixed-type vectors (`["Step 1" 181]`) for default many property.
- Invalid entity ids in id-vector input.
- Non-public property update attempts.
- Property just upserted in same flow followed immediately by block update.

## Verification commands

| Command | Expected result |
| --- | --- |
| `bb dev:test -v logseq.outliner.property-test` | New many-value conversion tests pass and no outliner regressions. |
| `bb dev:test -v logseq.cli.integration-test` | New CLI e2e tests for custom many property pass. |
| `bb dev:test -v logseq.cli.commands-test` | Command parse/build behavior remains stable. |
| `bb dev:lint-and-test` | Full lint/test suite remains green. |

## Acceptance criteria

1. CLI flow for custom `default + many + public` property with string values persists all values on target block.
2. CLI flow with id values persists all values on target block.
3. Empty vector updates (`[]`) clear the target property from the block.
4. Duplicate input values are preserved at input semantics level (conversion path does not proactively dedupe).
5. Datascript query confirms expected count and value set semantics for the target block property.
6. No regression for built-in property update flows.
7. Failures return actionable error details instead of generic silent/no-op outcomes.

## Rollout and compatibility

This is a behavior correctness fix, not a CLI API change.

Existing scripts using current flags remain valid.

Behavioral change is limited to making many-value persistence for custom properties deterministic and correct.

## Question

No open design question for this phase.
