# Logseq DB Properties SDK Reference

## Overview

Logseq has two storage modes:
- **File-based**:  Properties stored as `key::  value` in markdown files
- **DB-based**: Properties stored in SQLite with structured schema, types, and relationships

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

#### `upsertProperty(name, schema?, opts?)`
Define or update a property schema globally.

**Parameters:**
- `name` (string): Property name
- `schema` (optional object):
  - `type`: `'default'` | `'node'` | `'date'` | `'number'` | `'checkbox'` | `'url'`
  - `cardinality`: `'one'` | `'many'` (for `node` type)
  - `hide`: boolean - hide property in UI
  - `public`: boolean - make property public
- `opts` (optional object):
  - `name`: string - display name override

**Returns:** `IEntityID` object with `id`

**Example:**
```typescript
// Simple text property
await logseq.Editor.upsertProperty('author', { type: 'default' })

// Reference property (links to other pages)
await logseq.Editor.upsertProperty('tags', { 
  type: 'node', 
  cardinality: 'many' 
})

// Hidden property with custom display name
await logseq.Editor. upsertProperty('internalKey', 
  { type: 'default', hide: true },
  { name: 'Internal Key' }
)
```

#### `getProperty(key)`
Retrieve an existing property by key.

**Returns:** `BlockEntity` or `null`

**Example:**
```typescript
const prop = await logseq.Editor. getProperty('author')
if (!prop) {
  await logseq.Editor.upsertProperty('author', { type: 'default' })
}
```

#### `removeProperty(key)`
Remove a property definition globally.

**Example:**
```typescript
await logseq.Editor.removeProperty('deprecatedField')
```

---

### Tag (Class) Management APIs

#### `createTag(name, opts?)`
Create a tag as a class/type definition with properties in one call.

**Parameters:**
- `name` (string): Tag name
- `opts` (optional object):
  - `uuid`: string - custom UUID
  - `tagProperties`: Array of property definitions
    - `name`: string - property name
    - `schema`: Partial<PropertySchema> - property schema
    - `properties`: object - additional properties

**Returns:** `PageEntity` or `null`

**Example:**
```typescript
// Simple tag
const bookTag = await logseq.Editor.createTag('book')

// Tag with custom UUID
const articleTag = await logseq.Editor.createTag('article', { 
  uuid: 'custom-uuid-123' 
})

// Tag with properties defined in one call
const bookTag = await logseq.Editor. createTag('book', {
  uuid: generateStableUUID('book'),
  tagProperties: [
    { 
      name: 'author', 
      schema: { type: 'default' } 
    },
    { 
      name: 'isbn', 
      schema: { type: 'default' } 
    },
    { 
      name:  'tags', 
      schema: { type: 'node', cardinality: 'many' } 
    }
  ]
})
```

#### `getTag(nameOrIdent)`
Retrieve an existing tag by name or entity ID.

**Returns:** `PageEntity` or `null`

**Example:**
```typescript
const tag = await logseq.Editor.getTag('book')
if (!tag) {
  // Tag doesn't exist, create it
}
```

#### `getTagsByName(tagName)`
Retrieve all tags matching a name (useful for namespaced tags).

**Returns:** `Array<PageEntity>` or `null`

**Example:**
```typescript
const tags = await logseq.Editor.getTagsByName('book')
```

#### `getAllTags()`
Get all tags in the current graph.

**Returns:** `Array<PageEntity>` or `null`

**Example:**
```typescript
const allTags = await logseq. Editor.getAllTags()
```

#### `addTagProperty(tagId, propertyIdOrName)`
Add a property to a tag's schema.  Property must be defined via `upsertProperty` first.

**Parameters:**
- `tagId` (BlockIdentity): Tag UUID
- `propertyIdOrName` (BlockIdentity): Property UUID or name

**Example:**
```typescript
// Define property globally
await logseq.Editor. upsertProperty('author', { type: 'default' })

// Add to tag
const bookTag = await logseq. Editor.createTag('book')
await logseq.Editor. addTagProperty(bookTag.uuid, 'author')
```

#### `removeTagProperty(tagId, propertyIdOrName)`
Remove a property from a tag's schema.

**Example:**
```typescript
await logseq.Editor.removeTagProperty(bookTag.uuid, 'deprecatedField')
```

#### `addTagExtends(tagId, parentTagIdOrName)`
Set tag inheritance (class extends).

**Parameters:**
- `tagId` (BlockIdentity): Child tag UUID
- `parentTagIdOrName` (BlockIdentity): Parent tag UUID or name

**Example:**
```typescript
const mediaTag = await logseq.Editor.createTag('Media')
const bookTag = await logseq. Editor.createTag('book')

// book extends Media
await logseq.Editor. addTagExtends(bookTag. uuid, mediaTag.uuid)
```

#### `removeTagExtends(tagId, parentTagIdOrName)`
Remove tag inheritance.

**Example:**
```typescript
await logseq.Editor.removeTagExtends(bookTag.uuid, mediaTag.uuid)
```

---

### Block/Page Tagging APIs

#### `addBlockTag(blockId, tagId)`
Tag a block or page, making it an instance of that tag's class.

**Parameters:**
- `blockId` (BlockIdentity): Block or page UUID
- `tagId` (BlockIdentity): Tag UUID

**Example:**
```typescript
const page = await logseq.Editor. createPage('Moby Dick')
const bookTag = await logseq.Editor.getTag('book')
await logseq.Editor.addBlockTag(page.uuid, bookTag.uuid)
```

#### `removeBlockTag(blockId, tagId)`
Remove a tag from a block or page.

**Example:**
```typescript
await logseq.Editor.removeBlockTag(page.uuid, bookTag.uuid)
```

#### `getTagObjects(nameOrIdent)`
Get all blocks/pages tagged with a specific tag.

**Returns:** `Array<BlockEntity>` or `null`

**Example:**
```typescript
const allBooks = await logseq.Editor.getTagObjects('book')
```

---

### Block/Page Property Value APIs

#### `upsertBlockProperty(blockUUID, key, value, options?)`
Set property value for a specific block or page.

**Parameters:**
- `blockUUID` (BlockIdentity | EntityID): Block or page UUID or entity ID
- `key` (string): Property name
- `value` (any): Property value
  - For `node` type with `cardinality: 'many'`: Use array of page IDs (`.id` not `.uuid`)
  - For `node` type with `cardinality: 'one'`: Use single page ID
  - For other types: Use primitive values
- `options` (optional object):
  - `reset`: boolean - replace instead of merge

**Example:**
```typescript
const page = await logseq.Editor.getPage('my-page-uuid')

// Set simple value
await logseq.Editor.upsertBlockProperty(page.uuid, 'author', 'John Doe')

// Set number
await logseq.Editor.upsertBlockProperty(page.uuid, 'year', 2024)

// Set single reference (use . id not .uuid)
await logseq.Editor.upsertBlockProperty(page.uuid, 'category', categoryPage.id)

// Set multiple references (use . id not .uuid)
await logseq.Editor.upsertBlockProperty(
  page.uuid, 
  'tags', 
  [tagPage1.id, tagPage2.id, tagPage3.id]
)

// Reset property value completely
await logseq.Editor. upsertBlockProperty(
  page.uuid, 
  'tags', 
  [newTag1.id], 
  { reset: true }
)
```

#### `getBlockProperty(blockId, key)`
Get a single property value from a block or page.

**Returns:** `BlockEntity` or `null`

**Example:**
```typescript
const author = await logseq.Editor. getBlockProperty(page.uuid, 'author')
```

#### `getBlockProperties(blockId)`
Get all properties from a block.

**Returns:** `Record<string, any>` or `null`

**Example:**
```typescript
const props = await logseq.Editor. getBlockProperties(page.uuid)
console.log(props. author, props.isbn)
```

#### `getPageProperties(pageId)`
Get all properties from a page.

**Returns:** `Record<string, any>` or `null`

**Example:**
```typescript
const props = await logseq.Editor.getPageProperties(page.uuid)
```

#### `removeBlockProperty(blockId, key)`
Remove a property from a block or page.

**Example:**
```typescript
await logseq.Editor.removeBlockProperty(page.uuid, 'deprecatedField')
```

---

### Special Properties & Utilities

#### Hide Empty Values
Use special property key `:logseq. property/hide-empty-value`:

```typescript
const prop = await logseq.Editor.upsertProperty('optionalField', { type: 'default' })
await logseq.Editor.upsertBlockProperty(
  prop.id,  // Use property's entity ID
  ': logseq.property/hide-empty-value', 
  true
)
```

#### Set Block Icon
```typescript
// Tabler icon
await logseq.Editor.setBlockIcon(blockId, 'tabler-icon', 'book')

// Emoji (from emoji-mart)
await logseq.Editor.setBlockIcon(blockId, 'emoji', 'books')
```

#### Remove Block Icon
```typescript
await logseq.Editor.removeBlockIcon(blockId)
```

---

## Common Patterns

### Pattern 1: Define Schema with Tag and Properties (Simple)

```typescript
async function setupBookSchema() {
  // Create tag with all properties in one call
  const bookTag = await logseq.Editor.createTag('book', {
    uuid: generateStableUUID('book'),
    tagProperties: [
      { name: 'title', schema: { type: 'default' } },
      { name: 'author', schema: { type: 'default' } },
      { name: 'isbn', schema: { type: 'default' } },
      { name: 'year', schema: { type: 'number' } },
      { name:  'tags', schema: { type: 'node', cardinality: 'many' } }
    ]
  })
  
  return bookTag
}
```

### Pattern 2: Define Schema with Inheritance

```typescript
async function setupSchemaWithInheritance() {
  // 1. Create parent tag
  const mediaTag = await logseq.Editor.createTag('Media', {
    tagProperties: [
      { name:  'title', schema: { type: 'default' } },
      { name: 'year', schema: { type: 'number' } },
      { name: 'tags', schema: { type: 'node', cardinality: 'many' } }
    ]
  })
  
  // 2. Create child tag with specific properties
  const bookTag = await logseq.Editor.createTag('book', {
    tagProperties: [
      { name:  'author', schema: { type: 'default' } },
      { name: 'isbn', schema: { type: 'default' } }
    ]
  })
  
  // 3. Set inheritance
  await logseq. Editor.addTagExtends(bookTag.uuid, mediaTag.uuid)
  
  return { mediaTag, bookTag }
}
```

### Pattern 3: Create Instance with Properties

```typescript
async function createBookInstance(bookData) {
  // 1. Create page with stable UUID
  const pageUUID = generateStableUUID(bookData.id)
  let page = await logseq.Editor.getPage(pageUUID)
  
  if (!page) {
    page = await logseq.Editor. createPage(
      bookData.title, 
      {}, 
      { customUUID: pageUUID, redirect: false }
    )
  }
  
  // 2. Tag the page
  const bookTag = await logseq. Editor.getTag('book')
  await logseq.Editor.addBlockTag(page.uuid, bookTag. uuid)
  
  // 3. Set property values
  await logseq. Editor.upsertBlockProperty(page.uuid, 'title', bookData.title)
  await logseq.Editor.upsertBlockProperty(page.uuid, 'author', bookData. author)
  await logseq.Editor.upsertBlockProperty(page.uuid, 'isbn', bookData.isbn)
  await logseq.Editor.upsertBlockProperty(page.uuid, 'year', bookData. year)
  
  return page. uuid
}
```

### Pattern 4: Link Related Entities

```typescript
async function linkBookToCategories(bookPageUUID, categoryKeys) {
  // Get or create category pages
  const categoryIDs = await Promise.all(
    categoryKeys. map(async (key) => {
      const catUUID = generateStableUUID(key)
      let catPage = await logseq.Editor.getPage(catUUID)
      
      if (!catPage) {
        catPage = await logseq.Editor.createPage(key, {}, { 
          customUUID: catUUID 
        })
      }
      
      return catPage.id  // ⚠️ Use .id not .uuid for references
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

### Pattern 5: Batch Schema Setup from Configuration

```typescript
async function setupSchemaFromConfig(config) {
  // config example:
  // {
  //   "Media": { 
  //     "properties": ["title", "year"],
  //     "parent": null 
  //   },
  //   "book": { 
  //     "properties": ["author", "isbn"],
  //     "parent": "Media" 
  //   }
  // }
  
  for (const [tagName, tagConfig] of Object. entries(config)) {
    let tag = await logseq.Editor. getTag(tagName)
    
    if (!tag) {
      // Create tag with properties
      tag = await logseq.Editor.createTag(tagName, {
        tagProperties:  tagConfig.properties. map(name => ({
          name,
          schema: { type: 'default' }
        }))
      })
      
      // Set parent if specified
      if (tagConfig.parent) {
        const parentTag = await logseq. Editor.getTag(tagConfig. parent)
        if (parentTag) {
          await logseq.Editor.addTagExtends(tag.uuid, parentTag.uuid)
        }
      }
    }
  }
}
```

### Pattern 6: Migrate Existing Pages to New Schema

```typescript
async function migrateToBookSchema() {
  // 1. Setup schema
  const bookTag = await logseq.Editor.createTag('book', {
    tagProperties: [
      { name: 'author', schema: { type: 'default' } },
      { name: 'year', schema: { type: 'number' } }
    ]
  })
  
  // 2. Find all pages with old structure
  const allPages = await logseq.Editor.getAllPages()
  
  // 3. Migrate each page
  for (const page of allPages) {
    const props = await logseq.Editor. getPageProperties(page.uuid)
    
    // Check if page has book-like properties
    if (props?. author || props?.isbn) {
      // Add book tag
      await logseq.Editor.addBlockTag(page.uuid, bookTag.uuid)
      
      // Migrate properties if needed
      if (props. author) {
        await logseq.Editor.upsertBlockProperty(
          page.uuid, 
          'author', 
          props. author
        )
      }
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
Always check if tags/pages/properties exist before creating:

```typescript
let tag = await logseq.Editor.getTag('book')
if (!tag) {
  tag = await logseq.Editor.createTag('book', {
    tagProperties: [/* ... */]
  })
}
```

### 3. Property Definition Order (Manual Approach)
If not using `createTag` with `tagProperties`:

1. Define property globally with `upsertProperty`
2. Create tag with `createTag`
3. Add property to tag with `addTagProperty`
4. Create page and tag it with `addBlockTag`
5. Set values with `upsertBlockProperty`

### 4. Use . id for References ⚠️
When setting `node` type properties, use `.id` not `.uuid`:

```typescript
const categoryPage = await logseq.Editor.getPage('category-uuid')

// ✅ Correct
await logseq.Editor.upsertBlockProperty(
  page.uuid, 
  'category', 
  categoryPage.id
)

// ❌ Wrong
await logseq.Editor.upsertBlockProperty(
  page.uuid, 
  'category', 
  categoryPage.uuid
)
```

### 5. Error Handling
Wrap API calls in try-catch for robustness:

```typescript
try {
  await logseq.Editor.upsertBlockProperty(uuid, 'field', value)
} catch (error) {
  console.error(`Failed to set property: ${error}`)
  await logseq.UI.showMsg(`Error:  ${error. message}`, 'error')
}
```

### 6. Use createTag with tagProperties
Prefer the streamlined approach for better readability:

```typescript
// ✅ Better:  One call
const tag = await logseq.Editor. createTag('book', {
  tagProperties: [
    { name: 'author', schema: { type: 'default' } },
    { name: 'isbn', schema: { type: 'default' } }
  ]
})

// ❌ Verbose:  Multiple calls
await logseq. Editor.upsertProperty('author', { type: 'default' })
await logseq.Editor.upsertProperty('isbn', { type: 'default' })
const tag = await logseq.Editor. createTag('book')
await logseq.Editor. addTagProperty(tag.uuid, 'author')
await logseq.Editor.addTagProperty(tag.uuid, 'isbn')
```

---

## Real-World Example: Zotero Plugin

See complete implementation:  [xyhp915/logseq-zotero-plugin](https://github.com/xyhp915/logseq-zotero-plugin/blob/main/src/handlers. ts#L19-L207)

Key techniques:
- Schema defined from `z_item_types. json` metadata
- Tag hierarchy:  `Zotero` → `book`, `article`, etc.
- Stable UUIDs via `v5(itemKey, namespace)`
- Relationship properties for collections
- Nested blocks for attachments

---

## Type Definitions

```typescript
type PropertySchema = {
  type: 'default' | 'number' | 'node' | 'date' | 'checkbox' | 'url' | string
  cardinality:  'many' | 'one'
  hide:  boolean
  public: boolean
}

type BlockIdentity = BlockUUID | Pick<BlockEntity, 'uuid'>
type PageIdentity = BlockPageName | BlockIdentity
type EntityID = number
```

---

## Reference

- **Type Definitions**: `@logseq/libs` - [LSPlugin. ts](https://github.com/logseq/logseq/blob/master/libs/src/LSPlugin.ts)
- **Real Example**: [logseq-zotero-plugin/handlers.ts](https://github.com/xyhp915/logseq-zotero-plugin/blob/main/src/handlers. ts)
- **Search More**: [GitHub Code Search](https://github.com/search?type=code&q=repo:xyhp915/logseq-zotero-plugin+upsertBlockProperty)