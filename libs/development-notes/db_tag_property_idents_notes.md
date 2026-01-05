# Property & Tag Idents

## What is an Ident?

An **ident** is a unique keyword identifier for a property or tag in the database. It's distinct from:
- **name**: Human-readable display name (e.g., "Created At")
- **uuid**: Universal unique identifier for the entity
- **ident**: Internal database identifier (e.g., `:logseq.property/created-at`)

**Key characteristics:**
- Idents use kebab-case with namespace prefixes
- System properties use `:logseq.property/` namespace
- System class properties use `:logseq.class/` namespace
- Plugin created class use `:plugin.class.xxx-plugin-id/` namespace
- Plugin created property use `:plugin.property.xxx-plugin-id/` namespace
- Custom properties typically don't have explicit idents (auto-generated)

## When to Use Idents

Use idents when:
1. Working with **built-in system properties**
2. Setting **special behaviors** for properties
3. Querying the database directly with datascript
4. Creating **stable references** that survive renames

**Example:**
```typescript
// Using ident for system property
await logseq.Editor. upsertBlockProperty(
  blockId, 
  ':logseq. property/created-at',  // ident
  new Date().getTime()
)

// Using regular property name
await logseq.Editor. upsertBlockProperty(
  blockId, 
  'author',  // regular name
  'John Doe'
)
```

---

## Built-in System Properties

### Common System Properties

#### `:logseq.property/created-at`
Timestamp when the block/page was created.

```typescript
await logseq.Editor.upsertBlockProperty(
  page.uuid,
  ':logseq.property/created-at',
  Date.now()
)
```

#### `:logseq.property/updated-at`
Timestamp when the block/page was last updated.

```typescript
await logseq.Editor.upsertBlockProperty(
  block.uuid,
  ':logseq.property/updated-at',
  Date.now()
)
```

#### `:logseq.property/icon`
Icon for a page or block (set via `setBlockIcon` API).

```typescript
// Don't set directly, use API: 
await logseq.Editor. setBlockIcon(page.uuid, 'emoji', 'book')

// Behind the scenes, this sets:
// :logseq.property/icon {: type "emoji", :id "book"}
```

#### `:logseq.property/hide-empty-value`
Hide property when value is empty.

```typescript
const prop = await logseq.Editor.upsertProperty('optional-field', { 
  type: 'default' 
})

await logseq.Editor.upsertBlockProperty(
  prop. id,  // Apply to property entity itself
  ':logseq.property/hide-empty-value',
  true
)
```

#### `:logseq.property/closed-value-mode`
Property only accepts predefined values (enum-like).

```typescript
const prop = await logseq.Editor. upsertProperty('status', { type: 'default' })

await logseq.Editor.upsertBlockProperty(
  prop.id,
  ':logseq.property/closed-value-mode',
  true
)

// Define allowed values
await logseq.Editor.upsertBlockProperty(
  prop. id,
  ':logseq.property/closed-values',
  ['todo', 'in-progress', 'done']
)
```

#### `:logseq.property/schema`
Property schema definition (type, cardinality, etc.).

```typescript
// Automatically set by upsertProperty, don't set manually
await logseq.Editor. upsertProperty('tags', { 
  type: 'node', 
  cardinality: 'many' 
})

// Behind the scenes sets:
// :logseq. property/schema {:type "node", :cardinality "many"}
```

---

## Built-in Class (Tag) Properties

### Tag Inheritance & Schema

#### `:logseq.property. class/extends`
Define parent classes (tag inheritance).

```typescript
const mediaTag = await logseq.Editor.createTag('Media')
const bookTag = await logseq. Editor.createTag('book')

// Use addTagExtends API (recommended)
await logseq.Editor. addTagExtends(bookTag. uuid, mediaTag.uuid)

// Or set directly: 
await logseq.Editor. upsertBlockProperty(
  bookTag.uuid,
  ': logseq.property.class/extends',
  [mediaTag.id]  // Array of parent tag IDs
)
```

#### `:logseq.property.class/properties`
Properties available for this class.

```typescript
// Use addTagProperty API (recommended)
await logseq.Editor.addTagProperty(bookTag.uuid, 'author')

// Or set directly:
const authorProp = await logseq.Editor.getProperty('author')
await logseq.Editor.upsertBlockProperty(
  bookTag.uuid,
  ':logseq.property. class/properties',
  [authorProp.id]
)
```

---

## Working with Idents

### Pattern 1: Query by Ident

```typescript
// Get property entity by ident
const createdAtProp = await logseq. DB.datascriptQuery(`
  [: find (pull ?p [*])
   :where
   [?p :block/type "property"]
   [?p :block/ident : logseq.property/created-at]]
`)

console.log(createdAtProp)
```

### Pattern 2: Check if Property Has Ident

```typescript
async function getPropertyIdent(propertyName: string) {
  const prop = await logseq.Editor. getProperty(propertyName)
  return prop?.ident || null
}

const ident = await getPropertyIdent('created-at')
// Returns:  ": logseq.property/created-at" or null
```

### Pattern 3: Create Custom Namespaced Property

```typescript
// For plugin-specific properties, use your own namespace
const pluginNamespace = 'myplugin'

async function createPluginProperty(name: string, schema: any) {
  // Note: Custom idents are not directly settable via API
  // They're auto-generated, but you can query by name
  
  const prop = await logseq.Editor.upsertProperty(name, schema)
  
  // Custom properties won't have idents unless they're system properties
  return prop
}
```

### Pattern 4: Set Multiple System Properties

```typescript
async function setupPageMetadata(pageUUID: string, metadata: any) {
  const now = Date.now()
  
  // Set creation timestamp
  await logseq. Editor.upsertBlockProperty(
    pageUUID,
    ':logseq.property/created-at',
    metadata.createdAt || now
  )
  
  // Set update timestamp
  await logseq. Editor.upsertBlockProperty(
    pageUUID,
    ':logseq.property/updated-at',
    now
  )
  
  // Set custom properties
  await logseq. Editor.upsertBlockProperty(pageUUID, 'author', metadata.author)
  await logseq.Editor.upsertBlockProperty(pageUUID, 'source', metadata.source)
}
```

### Pattern 5: Configure Property Behavior

```typescript
async function createEnumProperty(name: string, allowedValues: string[]) {
  // 1. Create property
  const prop = await logseq.Editor.upsertProperty(name, { type: 'default' })
  
  // 2. Enable closed-value mode
  await logseq.Editor.upsertBlockProperty(
    prop.id,
    ':logseq.property/closed-value-mode',
    true
  )
  
  // 3. Set allowed values
  await logseq.Editor. upsertBlockProperty(
    prop.id,
    ':logseq.property/closed-values',
    allowedValues
  )
  
  // 4.  Optionally hide when empty
  await logseq. Editor.upsertBlockProperty(
    prop.id,
    ':logseq.property/hide-empty-value',
    true
  )
  
  return prop
}

// Usage
await createEnumProperty('priority', ['high', 'medium', 'low'])
```

---

## System Property Reference Table

| Ident | Purpose | Value Type | Applied To |
|-------|---------|------------|------------|
| `:logseq.property/created-at` | Creation timestamp | number (ms) | Block/Page |
| `:logseq.property/updated-at` | Update timestamp | number (ms) | Block/Page |
| `:logseq.property/icon` | Icon definition | `{type, id}` object | Block/Page |
| `:logseq.property/hide-empty-value` | Hide if empty | boolean | Property entity |
| `:logseq.property/closed-value-mode` | Enum mode | boolean | Property entity |
| `:logseq.property/closed-values` | Allowed values | array | Property entity |
| `:logseq.property/schema` | Schema definition | object | Property entity |
| `:logseq.property. class/extends` | Parent classes | array of IDs | Tag entity |
| `:logseq.property.class/properties` | Class properties | array of IDs | Tag entity |

---

## Best Practices for Idents

### 1. Prefer High-Level APIs Over Direct Ident Manipulation
Use specialized APIs instead of setting idents directly:

```typescript
// ✅ Better: Use API
await logseq.Editor.addTagExtends(childTag.uuid, parentTag.uuid)

// ❌ Avoid: Direct ident manipulation
await logseq. Editor.upsertBlockProperty(
  childTag.uuid,
  ': logseq.property. class/extends',
  [parentTag.id]
)
```

### 2. Only Use Idents for System Properties
Custom properties should use regular names:

```typescript
// ✅ Correct: System property with ident
await logseq. Editor.upsertBlockProperty(
  page.uuid,
  ': logseq.property/created-at',
  Date.now()
)

// ✅ Correct: Custom property with name
await logseq.Editor. upsertBlockProperty(
  page.uuid,
  'author',
  'John Doe'
)

// ❌ Wrong: Don't create custom idents
await logseq.Editor. upsertBlockProperty(
  page.uuid,
  ':myplugin/custom-prop',  // Not supported
  'value'
)
```

### 3. Query System Properties by Ident in Datascript
When using advanced queries, idents provide stable references:

```typescript
// Query all pages created in the last 7 days
const recentPages = await logseq. DB.datascriptQuery(`
  [:find (pull ?p [*])
   :where
   [?p :block/type "page"]
   [?p : logseq.property/created-at ? created]
   [(> ?created ${Date.now() - 7 * 24 * 60 * 60 * 1000})]]
`)
```