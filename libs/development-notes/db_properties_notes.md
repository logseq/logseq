# Logseq DB Properties (Developer Notes)

This note explains how **properties** work in Logseq when using a **DB graph** (database mode), how that differs from a **file graph** (Markdown/Org), and how to use the **plugin SDK** APIs defined in `libs/src/LSPlugin.ts`.

> Scope: This is written for plugin developers. It focuses on `logseq.Editor.*` property APIs and tag/class modeling.

---

## 1) Two worlds: File graph vs DB graph

### File graph (Markdown / Org)
- “Properties” are primarily **text syntax** stored in the file:
  - Markdown frontmatter (`---`)
  - Org property drawers (`:PROPERTIES:`)
  - Inline props (`key:: value`)
- When you update a property, you’re often ultimately **editing text**.
- SDK calls like `Editor.insertBlock`/`updateBlock` have `opts.properties`, but note this warning in the typings:
  - `IBatchBlock.properties` is **not supported for DB graph**.

### DB graph (Database mode)
DB mode treats properties as **first-class DB entities**.

Think of it as a 2-layer model:

1) **Property definitions (schema)**
   - A property key (e.g. `rating`, `authors`, `zotero_key`) exists as an entity.
   - It may have a schema: type, cardinality, visibility.

2) **Property values (data)**
   - Blocks/pages can store values for property keys.
   - Persisted structurally in the DB (not by emitting `key:: value` text).

In DB graphs, prefer the dedicated APIs:
- Property schema: `Editor.getProperty / upsertProperty / removeProperty`
- Values on blocks: `Editor.upsertBlockProperty / removeBlockProperty / getBlockProperties`

---

## 2) Important types (from `LSPlugin.ts`)

### `PropertySchema`
```ts
export type PropertySchema = {
  type: 'default' | 'number' | 'node' | 'date' | 'checkbox' | 'url' | string,
  cardinality: 'many' | 'one',
  hide: boolean
  public: boolean
}
```

Practical meaning:
- `type`
  - Controls editor/UI behavior and (in DB graphs) how values are interpreted.
  - Common: `default`, `number`, `date`, `checkbox`, `url`, `node`.
- `cardinality`
  - `'one'`: a single value
  - `'many'`: multiple values (typically passed as an array)
- `hide`
  - Hide in UI property panels.
- `public`
  - Expose property in UI (and typically configure discoverability).

### Entities you’ll see
- `BlockEntity`: blocks, but also used for some “special blocks” such as property entities.
- `PageEntity`: pages, tags (classes), property pages (`type: 'property'`), etc.
- `BlockIdentity`: a block uuid string OR `{ uuid }`.

---

## 3) DB-only vs graph-agnostic checks

Before doing DB-only work, check graph type:

```ts
const isDbGraph = await logseq.App.checkCurrentIsDbGraph()
if (!isDbGraph) {
  await logseq.UI.showMsg('This feature requires a DB graph.', 'warning')
  return
}

// Also check app-level capability:
const { supportDb } = await logseq.App.getInfo()
```

---

## 4) Property schema APIs (DB only)

### Get a property definition
```ts
const propEntity = await logseq.Editor.getProperty('zotero_key')
// -> BlockEntity | null
```

### Create or update a property definition (idempotent)
Use `upsertProperty` to ensure the property exists and has the schema you expect.

```ts
await logseq.Editor.upsertProperty(
  'zotero_key',
  {
    type: 'default',
    cardinality: 'one',
    hide: false,
    public: true,
  },
  { name: 'Zotero Key' }
)
```

Notes:
- `key` is your stable identifier (recommend `snake_case`).
- `opts.name` can be used as a **display name** for users.

### Remove a property definition
```ts
await logseq.Editor.removeProperty('zotero_key')
```

---

## 5) Block/page property value APIs

### Set (upsert) a property value on a block
```ts
const block = await logseq.Editor.getCurrentBlock()
if (!block) return

await logseq.Editor.upsertBlockProperty(block.uuid, 'zotero_key', 'ABCD1234')
```

### Set multi-value properties (`cardinality: 'many'`)
For `many`, pass an array. Use `{ reset: true }` when you want to overwrite vs merge.

```ts
await logseq.Editor.upsertBlockProperty(
  block.uuid,
  'authors',
  ['Ada Lovelace', 'Alan Turing'],
  { reset: true }
)
```

### Remove a value
```ts
await logseq.Editor.removeBlockProperty(block.uuid, 'zotero_key')
```

### Read properties
```ts
const props = await logseq.Editor.getBlockProperties(block.uuid)
// -> Record<string, any> | null

const pageProps = await logseq.Editor.getPageProperties('My Page')
```

### Read a single property (returns a `BlockEntity | null`)
`getBlockProperty` is useful when you want the DB entity wrapper for a key.

```ts
const v = await logseq.Editor.getBlockProperty(block.uuid, 'zotero_key')
```

---

## 6) Tags as “classes” + attaching properties (DB modeling)

In DB graphs, tags can behave like **classes**.

Relevant APIs:
- `Editor.createTag(tagName, opts)`
- `Editor.addTagProperty(tagId, propertyIdOrName)` / `removeTagProperty`
- `Editor.addTagExtends(tagId, parentTagIdOrName)` / `removeTagExtends`
- `Editor.addBlockTag(blockId, tagId)` / `removeBlockTag`

### Create a tag with tagProperties
This is the most developer-friendly way to ship a “schema bundle”:

```ts
const tag = await logseq.Editor.createTag('ZoteroItem', {
  tagProperties: [
    {
      name: 'zotero_key',
      schema: { type: 'default', cardinality: 'one', public: true, hide: false },
    },
    {
      name: 'authors',
      schema: { type: 'node', cardinality: 'many', public: true, hide: false },
    },
    {
      name: 'published_at',
      schema: { type: 'date', cardinality: 'one', public: true, hide: false },
    },
  ],
})

if (tag) {
  const block = await logseq.Editor.getCurrentBlock()
  if (block) await logseq.Editor.addBlockTag(block.uuid, tag.uuid)
}
```

Why this pattern is popular:
- Users see a consistent “record type” (`ZoteroItem`) with fields.
- Plugins can be idempotent: create if missing, otherwise just reuse.

### Add properties to an existing tag later
```ts
const tag = await logseq.Editor.getTag('ZoteroItem')
if (tag) {
  await logseq.Editor.addTagProperty(tag.uuid, 'zotero_key')
  await logseq.Editor.addTagProperty(tag.uuid, 'authors')
}
```

### Tag inheritance
```ts
await logseq.Editor.addTagExtends('ZoteroItem', 'Reference')
```

---

## 7) Recommended conventions for plugin authors

### Prefer DB APIs over text editing in DB graphs
- Don’t generate `key:: value` strings as your “source of truth” in DB mode.
- Use `upsertProperty` + `upsertBlockProperty`.

### Keep keys stable; use display names for UX
- Use safe keys (`snake_case`, ASCII) for `key`.
- Use `upsertProperty(key, schema, { name })` to show a nice label.

### Be explicit about cardinality
- If you intend a list, set `cardinality: 'many'` and always write arrays.
- Use `{ reset: true }` when you want to overwrite.

### Guard DB-only APIs
- Always check `App.checkCurrentIsDbGraph()`.

---

## 8) A tiny helper wrapper (optional)

If you’re building a small internal “DB properties SDK” for your plugin, a minimal shape looks like:

```ts
export async function ensureDbGraph() {
  if (!(await logseq.App.checkCurrentIsDbGraph())) {
    throw new Error('DB graph required')
  }
}

export async function ensureProperty(
  key: string,
  schema: Partial<import('../src/LSPlugin').PropertySchema>,
  name?: string
) {
  return logseq.Editor.upsertProperty(key, schema, name ? { name } : undefined)
}

export async function setProp(
  block: string,
  key: string,
  value: any,
  reset = false
) {
  return logseq.Editor.upsertBlockProperty(block, key, value, reset ? { reset: true } : undefined)
}
```

---

## Appendix: API quick reference (from `LSPlugin.ts`)

**Property schema (DB only)**
- `Editor.getProperty(key)`
- `Editor.upsertProperty(key, schema?, opts?)`
- `Editor.removeProperty(key)`

**Block/page values**
- `Editor.upsertBlockProperty(block, key, value, { reset? })`
- `Editor.removeBlockProperty(block, key)`
- `Editor.getBlockProperty(block, key)`
- `Editor.getBlockProperties(block)`
- `Editor.getPageProperties(page)`

**Tags / Classes**
- `Editor.createTag(tagName, { tagProperties? })`
- `Editor.getTag(nameOrIdent)` / `Editor.getAllTags()`
- `Editor.addTagProperty(tagId, propertyIdOrName)` / `removeTagProperty`
- `Editor.addTagExtends(tagId, parentTagIdOrName)` / `removeTagExtends`
- `Editor.addBlockTag(blockId, tagId)` / `removeBlockTag`

