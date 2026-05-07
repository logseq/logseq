# Malli Review Rules

Apply when a change adds, edits, or consumes Malli schemas, validation, coercion, explain data, or schema-driven CLI/API/UI contracts.

## Review focus

- Schemas should describe the real domain contract, not just the current happy path.
- Boundary inputs should be validated/coerced at the boundary; internal code should not repeatedly validate the same trusted value.
- Required and optional keys must be intentional.
- Error messages should be actionable at user/API boundaries.
- Shared schemas should live near the shared domain contract, not inside one caller when multiple modules depend on them.

## Red flags

- Adding optional keys to avoid fixing invalid callers.
- Using broad schemas such as `:any`, unbounded maps, or unconstrained strings for important persisted data.
- Rebuilding large schemas or validators in hot paths.
- Silently ignoring `m/explain` failures.
- Coercing persisted values in a way that changes semantics without migration coverage.
- Duplicating nearly identical schemas across frontend, worker, CLI, and server code.

## Review questions

- What happens on invalid input?
- Does the schema cover persisted data and protocol versions?
- Are error details preserved for debugging or user feedback?
- Are tests checking both valid and invalid examples?
- If coercion changed, is there coverage for before/after data shapes?

## Related skill

Load `clojure-malli` for implementation or deep schema design work.
