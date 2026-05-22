# Correctness Pass

Inspect the reviewed change for broken behavior and invalid state.

Check:

- broken invariants and invalid state transitions
- incorrect branching, nil handling, ordering, identity, or lifecycle behavior
- contract mismatches between callers and callees
- async races, cancellation mistakes, stale state, and promise/task misuse
- schema, query, transaction, migration, and persistence mistakes
- behavior that contradicts documented API, CLI, protocol, or UI contracts

Return results using [`subagent-output.md`](./subagent-output.md).
