# ADR 0023: Plugin API for DB property value nodes

- **Status:** Proposal
- **Date:** 2026-10-08
- **Related:** [#13020](https://github.com/logseq/logseq/pull/13020), [db-test #1032](https://github.com/logseq/db-test/issues/1032)

## Context

DB graphs represent a closed property choice as a property-value node. The node is a normal block entity with additional invariants, including `:logseq.property/created-from-property` and the property relationship used by `:logseq.property/closed-values`.

The plugin API currently exposes `Editor.addPropertyValueChoices(property, choices)`, but it only accepts identities of nodes that already exist. A plugin can create an ordinary block and call `upsertBlockProperty`, yet that does not create a valid property-value node. The result is either silently ignored or rejected during validation. Calling private outliner operations or constructing raw transaction data is not a safe plugin contract.

PR [#13020](https://github.com/logseq/logseq/pull/13020) fixed a related boundary problem by normalizing JavaScript block identities before existing choices are registered. That fix makes existing nodes reliable; it does not provide a supported way to create a new node.

This gap prevents plugins from synchronizing schema choices, repairing missing choices, and implementing controlled imports without asking users to edit every choice manually.

## Proposal

Expose one additive editor API that creates a valid, standalone property-value node and returns its entity:

```ts
createPropertyValue(
  property: BlockIdentity,
  value: unknown,
  opts?: { uuid?: BlockUUID }
): Promise<BlockEntity>
```

The operation should:

1. Resolve property and UUID inputs using the same identity normalization as `addPropertyValueChoices`.
2. Validate that the target is a DB property and convert the supplied value according to its schema.
3. Create the node through the existing property-value transaction path, including `:logseq.property/created-from-property` and the correct page/parent representation.
4. Return the created entity, including its UUID, so the caller can pass it to `addPropertyValueChoices`.
5. Be atomic: a failed validation must not leave an orphan block or a partially updated closed-value list.
6. Treat an existing equivalent value as an idempotent operation, or return a typed duplicate error that a caller can handle. The final choice should match the current closed-value semantics.

The narrow API intentionally does not create a page, change a property's schema, or automatically enable closed-value mode. Those remain separate operations with their existing permission and lifecycle rules.

Example:

```ts
const choice = await logseq.Editor.createPropertyValue(
  property.uuid,
  "跟进"
)
await logseq.Editor.addPropertyValueChoices(property.uuid, [choice.uuid])
```

## Alternatives considered

- **Create an ordinary block, then call `upsertBlockProperty`:** does not establish the property-value invariants and is not equivalent to the internal transaction.
- **Expose a private `invoke` or raw outliner operation:** couples plugins to implementation details and bypasses validation.
- **Use the CLI from a plugin worker:** the CLI can write a semantic property value, but it requires a graph-side staging context and does not provide a plugin transaction or closed-value lifecycle guarantee.
- **Keep the API check-only:** useful as a short-term workaround, but it leaves schema repair and import plugins dependent on manual UI actions.

## Compatibility and security

This is an additive API. Existing plugins and graph data remain unchanged. The implementation should be restricted to DB graphs, use the same permission boundary as other editor mutations, and reject invalid property identities and values before writing.

## Test plan

Add SDK and DB integration coverage for:

- string/default, number, and node property values;
- one and many cardinalities;
- UUID strings and `{ uuid }` identities;
- create → `addPropertyValueChoices` → reopen graph persistence;
- duplicate values and explicit custom UUIDs;
- invalid property/value/UUID input;
- rollback/no orphan node when validation or the transaction fails.

## Open questions

1. Should a newly created value be standalone, or should the API also accept an optional parent/page for import workflows?
2. Should duplicate creation return the existing entity or a typed error?
3. Should `createPropertyValue` automatically register the new node as a closed choice, or should registration remain explicit as shown above?

Keeping creation and registration separate mirrors the existing API and lets callers construct a complete set atomically in a follow-up transaction.
