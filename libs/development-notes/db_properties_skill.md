# Logseq DB Properties SDK Reference

## Overview

Logseq has two storage modes:
- **File-based**: Properties stored as `key::  value` in markdown files
- **DB-based**:  Properties stored in SQLite with structured schema, types, and relationships

This guide covers **DB-based properties API** for plugin development.

---

## Core Concepts

### 1. Property Schema (Global Definition)
Properties must be defined globally before use.  Think of it as creating columns in a database.

### 2. Tags as Classes
Tags act as classes/types.  Pages/blocks can be tagged to inherit property schemas.

### 3. Property Values
After defining properties, assign values to specific blocks/pages.

---

## API Reference

### Property Schema APIs

#### `upsertProperty(name, options)`
Define or update a property schema globally.

**Parameters:**
- `name` (string): Property name
- `options` (object):
    - `type`: `'default'` | `'node'` | `'date'` | `'number'`
    - `cardinality`: `'one'` | `'many'` (for `node` type)

**Returns:** Property object with `uuid`

**Example:**
```typescript
// Simple text property
await logseq.Editor.upsertProperty('author', { type: 'default' })

// Reference property (links to other pages)
await logseq.Editor.upsertProperty('tags', { 
  type: 'node', 
  cardinality: 'many' 
})

// Date property
await logseq.Editor.upsertProperty('publishedDate', { type: 'date' })
```

---

### Tag (Class) Management APIs

#### `createTag(name, options? )`
Create a tag as a class/type definition.

**Parameters:**
- `name` (string): Tag name
- `options` (optional object): `{ uuid: string }`

**Returns:** Tag object with `uuid` and `id`

**Example:**
```typescript
const bookTag = await logseq.Editor.createTag('book')
const articleTag = await logseq.Editor.createTag('article', { 
  uuid: 'custom-uuid-123' 
})
```

#### `getTag(name)`
Retrieve an existing tag by name.

**Returns:** Tag object or `null`

**Example:**
```typescript
const tag = await logseq.Editor. getTag('book')
if (! tag) {
  // Tag doesn't exist, create it
}
```

#### `addTagProperty(tagUUID, propertyName)`
Add a property to a tag's schema.  Pages tagged with this tag will have this property available.

**Parameters:**
- `tagUUID` (string): Tag UUID
- `propertyName` (string): Property name (must be defined via `upsertProperty` first)

**Example:**
```typescript
// Define properties globally
await logseq.Editor. upsertProperty('author', { type: 'default' })
await logseq.Editor.upsertProperty('isbn', { type: 'default' })

// Add properties to 'book' tag
const bookTag = await logseq. Editor.createTag('book')
await logseq.Editor.addTagProperty(bookTag.uuid, 'author')
await logseq.Editor.addTagProperty(bookTag.uuid, 'isbn')
```

---

### Block/Page Property Value APIs

#### `upsertBlockProperty(blockUUID, propertyName, value)`
Set property value for a specific block or page.

**Parameters:**
- `blockUUID` (string): Block or page UUID
- `propertyName` (string): Property name
- `value` (any): Property value
    - For `node` type with `cardinality: 'many'`: Use array of page IDs
    - For `node` type with `cardinality: 'one'`: Use single page ID
    - For other types: Use primitive values

**Example:**
```typescript
const page = await logseq.Editor.getPage('my-page-uuid')

// Set simple value
await logseq.Editor.upsertBlockProperty(page.uuid, 'author', 'John Doe')

// Set number
await logseq.Editor.upsertBlockProperty(page.uuid, 'year', 2024)

// Set single reference
await logseq.Editor. upsertBlockProperty(page.uuid, 'category', categoryPageID)

// Set multiple references
await logseq.Editor.upsertBlockProperty(
  page.uuid, 
  'tags', 
  [tagPageID1, tagPageID2, tagPageID3]
)
```

#### `addBlockTag(blockUUID, tagUUID)`
Tag a block or page, making it an instance of that tag's class.

**Parameters:**
- `blockUUID` (string): Block or page UUID
- `tagUUID` (string): Tag UUID

**Example:**
```typescript
const page = await logseq. Editor.createPage('Moby Dick')
const bookTag = await logseq.Editor.getTag('book')
await logseq.Editor.addBlockTag(page.uuid, bookTag.uuid)
```

---

### Tag Inheritance

#### Set Tag Parent (Class Inheritance)
Invoke API of `logseq.Editor.setTagExtends`

**Example:**
```typescript
// Create parent tag
const rootTag = await logseq.Editor.createTag('Media')

// Create child tag
const bookTag = await logseq.Editor.createTag('book')

// Set inheritance
await logseq.Editor.addTagExtends(bookTag.uuid, rootTag.uuid)

// Use special property `:logseq.property.class/extends` to create tag hierarchy.
// await logseq.Editor. upsertBlockProperty(
//   bookTag.uuid, 
//   ':logseq.property.class/extends', 
//   [rootTag.id]  // Use . id, not .uuid
// )
```

---

### Special Properties

#### Hide Empty Values
```typescript
const prop = await logseq.Editor. upsertProperty('optionalField', { type: 'default' })
await logseq.Editor.upsertBlockProperty(
  prop.uuid, 
  ': logseq.property/hide-empty-value', 
  true
)
```

---

## Common Patterns

### Pattern 1: Define a Schema with Class Hierarchy

```typescript
async function setupBookSchema() {
  // 1. Create root class
  const mediaTag = await logseq.Editor.createTag('Media')
  
  // 2. Define common properties
  await logseq. Editor.upsertProperty('title', { type: 'default' })
  await logseq.Editor.upsertProperty('year', { type: 'number' })
  await logseq.Editor.upsertProperty('tags', { type: 'node', cardinality: 'many' })
  
  // 3. Add properties to root class
  await logseq. Editor.addTagProperty(mediaTag.uuid, 'title')
  await logseq.Editor.addTagProperty(mediaTag.uuid, 'year')
  await logseq.Editor. addTagProperty(mediaTag.uuid, 'tags')
  
  // 4. Create subclass
  const bookTag = await logseq.Editor.createTag('book')
  await logseq.Editor.upsertBlockProperty(
    bookTag.uuid, 
    ':logseq.property.class/extends', 
    [mediaTag.id]
  )
  
  // 5. Add book-specific properties
  await logseq.Editor.upsertProperty('author', { type: 'default' })
  await logseq.Editor.upsertProperty('isbn', { type: 'default' })
  await logseq.Editor.addTagProperty(bookTag.uuid, 'author')
  await logseq.Editor.addTagProperty(bookTag.uuid, 'isbn')
}
```

### Pattern 2: Create an Instance

```typescript
async function createBookInstance(bookData) {
  // 1. Create page with stable UUID
  const pageUUID = generateStableUUID(bookData.id)
  let page = await logseq.Editor.getPage(pageUUID)
  
  if (!page) {
    page = await logseq.Editor.createPage(
      bookData.title, 
      {}, 
      { customUUID: pageUUID, redirect: false }
    )
  }
  
  // 2. Tag the page
  const bookTag = await logseq.Editor.getTag('book')
  await logseq.Editor.addBlockTag(page.uuid, bookTag. uuid)
  
  // 3. Set property values
  await logseq. Editor.upsertBlockProperty(page.uuid, 'title', bookData.title)
  await logseq.Editor.upsertBlockProperty(page.uuid, 'author', bookData.author)
  await logseq.Editor.upsertBlockProperty(page.uuid, 'isbn', bookData.isbn)
  await logseq.Editor.upsertBlockProperty(page.uuid, 'year', bookData.year)
  
  return page. uuid
}
```

### Pattern 3: Link Related Entities

```typescript
async function linkBookToCategories(bookPageUUID, categoryKeys) {
  // Get or create category pages
  const categoryIDs = await Promise.all(
    categoryKeys.map(async (key) => {
      const catUUID = generateStableUUID(key)
      let catPage = await logseq.Editor.getPage(catUUID)
      
      if (!catPage) {
        catPage = await logseq.Editor.createPage(key, {}, { 
          customUUID: catUUID 
        })
      }
      
      return catPage.id  // Use . id for references
    })
  )
  
  // Link book to categories
  await logseq.Editor.upsertBlockProperty(
    bookPageUUID, 
    'tags',  // Must be 'node' type with 'many' cardinality
    categoryIDs
  )
}
```

### Pattern 4: Batch Schema Setup from JSON

```typescript
async function setupSchemaFromConfig(config) {
  // config = { "book": { "fields": ["author", "isbn"], "parent": "Media" } }
  
  for (const [tagName, tagConfig] of Object.entries(config)) {
    let tag = await logseq.Editor.getTag(tagName)
    
    if (!tag) {
      tag = await logseq.Editor.createTag(tagName)
      
      // Set parent if specified
      if (tagConfig. parent) {
        const parentTag = await logseq. Editor.getTag(tagConfig. parent)
        if (parentTag) {
          await logseq.Editor.upsertBlockProperty(
            tag. uuid, 
            ':logseq.property.class/extends', 
            [parentTag.id]
          )
        }
      }
    }
    
    // Add properties
    for (const fieldName of tagConfig.fields) {
      await logseq.Editor.upsertProperty(fieldName, { type: 'default' })
      await logseq.Editor.addTagProperty(tag.uuid, fieldName)
    }
  }
}
```

---

## Best Practices

### 1. Use Stable UUIDs
Generate deterministic UUIDs from stable identifiers:

```typescript
import { v5 as uuidv5 } from 'uuid'

const NAMESPACE = 'your-plugin-namespace-uuid'

function generateStableUUID(id:  string): string {
  return uuidv5(id, NAMESPACE)
}
```

### 2. Check Before Creating
Always check if tags/pages exist before creating:

```typescript
let tag = await logseq.Editor.getTag('book')
if (!tag) {
  tag = await logseq.Editor.createTag('book')
}
```

### 3. Property Definition Order
1. Define property globally with `upsertProperty`
2. Create tag with `createTag`
3. Add property to tag with `addTagProperty`
4. Create page and tag it with `addBlockTag`
5. Set values with `upsertBlockProperty`

### 4. Use . id for References
When setting `node` type properties, use `.id` not `.uuid`:

```typescript
await logseq.Editor.upsertBlockProperty(
  page. uuid, 
  'category', 
  categoryPage.id  // ✅ Correct
  // categoryPage.uuid  // ❌ Wrong
)
```

### 5. Error Handling
Wrap API calls in try-catch for robustness:

```typescript
try {
  await logseq.Editor.upsertBlockProperty(uuid, 'field', value)
} catch (error) {
  console.error(`Failed to set property: ${error}`)
  // Handle gracefully
}
```

---

## Real-World Example:  Zotero Plugin

See complete implementation:  [xyhp915/logseq-zotero-plugin](https://github.com/xyhp915/logseq-zotero-plugin/blob/main/src/handlers.ts#L19-L207)

Key techniques:
- Schema defined from `z_item_types. json` metadata
- Tag hierarchy:  `Zotero` → `book`, `article`, etc.
- Stable UUIDs via `v5(itemKey, namespace)`
- Relationship properties for collections
- Nested blocks for attachments

---

## Reference

- **Type Definitions**: See `@logseq/libs` package
- **Examples**: [logseq-zotero-plugin/handlers.ts](https://github.com/xyhp915/logseq-zotero-plugin/blob/main/src/handlers. ts)
- **Search More**: [GitHub Code Search](https://github.com/search?type=code&q=repo:xyhp915/logseq-zotero-plugin+upsertBlockProperty)