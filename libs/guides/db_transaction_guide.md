# `logseq.DB.transact` Guide

## What it is

`logseq.DB.transact(...)` is a **DB-graph-only**, **semantic-first** transaction API for plugins.

Use it when you want multiple DB changes to behave like **one logical action**:

- **one atomic batch**
- **one local tx**
- **one undo step per call**
- existing persistence flow via `persistOp -> :persist-op?`

This API is intentionally higher-level than raw Datascript tx-data. Prefer semantic actions so Logseq can keep undo/replay/history behavior understandable.

---

## Quick start

```ts
await logseq.DB.transact(
  [
	{
	  type: 'updateBlock',
	  block: currentBlock.uuid,
	  content: 'Updated title',
	  properties: {
		rating: 5,
	  },
	  schema: {
		rating: { type: 'number' },
	  },
	},
	{
	  type: 'upsertBlockProperty',
	  block: anotherBlock.uuid,
	  key: 'status',
	  value: 'ready',
	},
  ],
  {
	persistOp: true,
	undoGroup: 'command:bulk-update',
  }
)
```

Return shape:

```ts
type DBTransactionResult = {
  txId: string
  outlinerOp: string
  actionCount: number
  persistOp: boolean
  undoGroup?: string
}
```

---

## When to use it

Use `logseq.DB.transact(...)` when:

- one user action needs to update **multiple blocks/properties/pages**
- you want to avoid splitting one logical action into **multiple undo steps**
- you want failure in a later step to cancel earlier steps in the same call

Prefer older single-purpose APIs when:

- you only need one simple edit
- you want editor/UI side effects such as route changes or edit focus behavior

---

## Supported v1 actions

### `updateBlock`

```ts
{
  type: 'updateBlock',
  block: string | number,
  content?: string,
  properties?: Record<string, unknown>,
  schema?: Record<string, Partial<PropertySchema>>,
  resetPropertyValues?: boolean,
}
```

Use for batched block content + property updates in one transaction call.

### `createPage`

```ts
{
  type: 'createPage',
  pageName: string,
  options?: {
	uuid?: string,
	tags?: Array<string | number>,
	properties?: Record<string, unknown>,
	persistOp?: boolean,
	class?: boolean,
	journal?: boolean,
	todayJournal?: boolean,
	splitNamespace?: boolean,
	classIdentNamespace?: string,
	format?: 'markdown' | 'org',
  }
}
```

Notes:

- no redirect side effect
- if you want to reference the page later in the same batch, provide `options.uuid`

### `renamePage`

```ts
{
  type: 'renamePage',
  page: string | number,
  newName: string,
}
```

`page` can be a title, entity id, uuid, or explicit uuid created earlier in the same transaction.

### `deletePage`

```ts
{
  type: 'deletePage',
  page: string | number,
  options?: Record<string, unknown>,
}
```

### `upsertProperty`

```ts
{
  type: 'upsertProperty',
  key: string,
  schema?: Partial<PropertySchema>,
  options?: { name?: string },
}
```

### `removeProperty`

```ts
{
  type: 'removeProperty',
  key: string,
}
```

Plugins may only remove their own plugin-scoped properties.

### `upsertBlockProperty`

```ts
{
  type: 'upsertBlockProperty',
  block: string | number,
  key: string,
  value: unknown,
  options?: {
	schema?: Partial<PropertySchema>,
	reset?: boolean,
  },
}
```

### `removeBlockProperty`

```ts
{
  type: 'removeBlockProperty',
  block: string | number,
  key: string,
}
```

### `rawTx` (escape hatch)

```ts
{
  type: 'rawTx',
  txData: any[],
  txMeta?: Record<string, unknown>,
}
```

Prefer semantic actions unless you truly need low-level tx-data.

---

## Semantics and limits

### Atomicity

One call runs inside one batched outliner transaction.

If a later action throws, earlier actions from the same call are not persisted.

### Undo / redo

Current v1 behavior:

- one call => one undo step
- `undoGroup` is stored as metadata only
- cross-call merge by `undoGroup` is **not implemented yet**

### Persistence

`persistOp` maps directly to existing tx metadata:

```clojure
:persist-op?
```

That keeps this API aligned with worker persistence and db-sync enqueue behavior.

### Scope limits

- DB graph only
- semantic action coverage is still partial
- no automatic UI navigation or focus side effects
- dependent page actions are supported best when you provide an explicit `options.uuid`

---

## AI-friendly usage references

Use these references when explaining, reviewing, or extending this API.

### Public SDK surface

- `libs/src/LSPlugin.ts`
  - `DBTransactionOptions`
  - `DBTransactionAction`
  - `DBTransactionResult`
  - `IDBProxy.transact`

- `libs/src/LSPlugin.user.ts`
  - `const db: Partial<IDBProxy>`
  - `db.transact(...)`

### Host export and implementation

- `src/main/logseq/api.cljs`
  - exported symbol: `db_transact`

- `src/main/logseq/api/db_based.cljs`
  - entrypoint: `transact`
  - helpers:
	- `normalize-js-data`
	- `resolve-block!`
	- `resolve-page-uuid!`
	- `normalize-create-page-options`
	- `resolve-transaction-outliner-op`
	- `run-transaction-action!`

### Related transaction / undo infrastructure

- `src/main/frontend/modules/outliner/ui.cljc`
  - macro: `transact!`
  - collects outliner ops from one UI transaction scope

- `deps/outliner/src/logseq/outliner/transaction.cljc`
  - macros: `with-batch-tx`, `transact!`
  - low-level batch transaction wrapper used by outliner ops

- `deps/outliner/src/logseq/outliner/op.cljs`
  - `apply-ops!`
  - semantic outliner op application

- `deps/outliner/src/logseq/outliner/op/construct.cljc`
  - `semantic-outliner-ops`
  - canonical semantic op set relevant to history/replay

- `src/main/frontend/worker/undo_redo.cljs`
  - `gen-undo-ops!`
  - worker-owned undo stack generation

- `src/main/frontend/worker/sync/apply_txs.cljs`
  - `handle-local-tx!`
  - persistence gate via `:persist-op?`

### Tests

- `src/test/logseq/api/db_based_test.cljs`
  - `transact-batches-update-block-actions-into-one-tx-test`
  - `transact-supports-create-and-rename-page-in-one-batch-test`
  - `transact-fails-atomically-when-a-later-action-errors-test`

### Design notes

- `libs/_docs/001_db_transaction.md`
  - implementation/design note for v1

- `libs/_docs/000_future.md`
  - original SDK-gap proposal that motivated `DB.transact`

---

## Good prompts for AI/code search

If you are an AI agent or using AI-assisted search, these are good entry queries:

- `logseq DB.transact implementation`
- `db_transact host export`
- `run-transaction-action! logseq.api.db-based`
- `persist-op? handle-local-tx!`
- `gen-undo-ops! worker undo redo`
- `semantic-outliner-ops construct`
- `ui-outliner-tx transact!`

---

## See also

- `libs/guides/db_properties_guide.md`
- `libs/guides/db_properties_references.md`
- `libs/guides/commands_api_guide.md`

