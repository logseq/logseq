# DataScript Review Rules

Apply when a change touches `datascript.core`, Datalog queries, `d/pull`, entities, DB snapshots, transactions, or graph data invariants.

## Review focus

- Use `db` for immutable snapshots and `conn` only when a function transacts or intentionally needs mutability.
- Queries should match the available indexes and avoid repeated work in render loops or tight recursion.
- Transactions should preserve Logseq block/page/property invariants atomically.
- Entity values should not be cached globally or retained longer than the owning graph lifecycle.
- Do not globally `memoize` functions whose arguments can retain graph data such as `entity`, `block`, `conn`, or `db`.

## Red flags

- Functions named or parameterized with `conn` but never calling `d/transact!`.
- `d/transact!` called inside loops without clear batching requirements.
- Pulling entire subgraphs when only a small set of attrs is needed.
- Relying on entity laziness after the DB snapshot may become stale.
- Datalog rules or queries without tests for empty, missing, or duplicated data.
- Memoizing query results keyed by `db`, `entity`, `block`, or graph-specific values.

## Review questions

- Is the transaction atomic from the user's perspective?
- Can the same operation run twice without corrupting order or identity?
- Is the query correct for pages, blocks, journals, whiteboards, and properties?
- Does the change work for both old and newly migrated graphs?
- Are large graphs likely to trigger query or pull performance problems?

## Related modules

Load [`../modules/db-model.md`](../modules/db-model.md) when DataScript code reads or writes Logseq persisted attributes such as block content, properties, or schema-managed keywords.
