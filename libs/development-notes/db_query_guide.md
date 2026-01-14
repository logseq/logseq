## Logseq Datascript Query Skills Guide

### 1. Logseq SDK Query APIs

```typescript
// DSL Query - Logseq's query language
const results = await logseq.DB.q('[[page-name]]')
const todos = await logseq.DB.q('(task TODO DOING)')

// Datascript Query - Datalog syntax (more powerful)
const results = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where [?b :block/marker "TODO"]]
`)

// Query with parameters
const results = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :in $ ?name
   :where
   [?p :block/name ?name]
   [? b :block/page ?p]]
`, `"my-page"`)

// Watch database changes
logseq.DB.onChanged(({ blocks, txData }) => {
  console.log('Changed blocks:', blocks)
})

// Watch specific block changes
logseq.DB.onBlockChanged(uuid, (block, txData) => {
  console.log('Block changed:', block)
})
```

---

### 2. Datalog Query Syntax Basics

#### 2.1 Basic Structure

```clojure
[: find <return-value>    ;; what to return
 :in $ <params... >       ;; input parameters ($ = database)
 :where <clauses...>]    ;; query conditions
```

#### 2.2 : find Clause

```clojure
;; Return entity IDs
[:find ?b : where ...]

;; Return multiple values
[:find ?b ? name :where ...]

;; Return full entity (commonly used)
[:find (pull ?b [*]) :where ...]

;; Return specific attributes
[:find (pull ?b [: block/uuid :block/content]) :where ...]

;; Aggregate functions
[:find (count ? b) :where ...]
[:find (min ? d) (max ?d) :where ...]
```

#### 2.3 :where Clause - Data Patterns

```clojure
;; Basic triple: [entity attribute value]
[?b :block/marker "TODO"]         ;; ? b's marker equals "TODO"
[? b :block/page ?p]               ;; ?b belongs to page ? p
[?p :block/name ?name]            ;; ? p's name binds to ?name

;; Multiple conditions (implicit AND)
[?b :block/marker "TODO"]
[?b : block/page ?p]
[?p :block/journal? true]         ;; all three must be satisfied
```

#### 2.4 :in Clause - Parameter Passing

```clojure
;; $ is the database (required)
[:find (pull ?b [*])
 :in $
 :where ...]

;; Single parameter
[:find (pull ?b [*])
 :in $ ?marker
 :where [?b :block/marker ? marker]]

;; Multiple parameters
[:find (pull ?b [*])
 :in $ ?marker ? page-name
 :where
 [?b :block/marker ?marker]
 [? p :block/name ?page-name]
 [?b : block/page ?p]]

;; Collection parameter (match multiple values)
[:find (pull ?b [*])
 :in $ [?marker ...]
 :where [?b :block/marker ?marker]]
```

---

### 3. Schema Reference:  File Graph vs DB Graph

#### 3.1 Block Attributes

| Attribute           | File Graph | DB Graph | Type   | Description                         |
|---------------------|:----------:|:--------:|--------|-------------------------------------|
| `:block/uuid`       |     ✅      |    ✅     | UUID   | Unique block identifier             |
| `:block/content`    |     ✅      |    ❌     | String | Raw block content (File Graph only) |
| `:block/title`      |     ❌      |    ✅     | String | Block title/content (DB Graph only) |
| `:block/page`       |     ✅      |    ✅     | Ref    | Parent page reference               |
| `:block/parent`     |     ✅      |    ✅     | Ref    | Parent block reference              |
| `:block/left`       |     ✅      |    ❌     | Ref    | Left sibling block                  |
| `:block/order`      |     ❌      |    ✅     | String | Block order in DB Graph             |
| `:block/refs`       |     ✅      |    ✅     | Ref[]  | Referenced pages/blocks             |
| `:block/marker`     |     ✅      |    ❌     | String | Task marker (TODO/DOING/DONE)       |
| `:block/priority`   |     ✅      |    ❌     | String | Priority (A/B/C)                    |
| `:block/scheduled`  |     ✅      |    ❌     | Int    | Scheduled date (YYYYMMDD)           |
| `:block/deadline`   |     ✅      |    ❌     | Int    | Deadline date (YYYYMMDD)            |
| `:block/properties` |     ✅      |    ❌     | Map    | Properties as key-value map         |
| `:block/tags`       |     ✅      |    ✅     | Ref[]  | Tag references                      |
| `:block/link`       |     ❌      |    ✅     | Ref    | Link to class/tag in DB Graph       |
| `:block/tx-id`      |     ❌      |    ✅     | Int    | Transaction ID                      |
| `:block/created-at` |     ✅      |    ❌     | Int    | Creation timestamp (File Graph)     |
| `:block/updated-at` |     ✅      |    ❌     | Int    | Update timestamp (File Graph)       |

#### 3.2 Page Attributes

| Attribute              | File Graph | DB Graph | Type    | Description                              |
|------------------------|:----------:|:--------:|---------|------------------------------------------|
| `:block/name`          |     ✅      |    ✅     | String  | Page name (lowercase)                    |
| `:block/original-name` |     ✅      |    ✅     | String  | Original page name                       |
| `:block/journal?`      |     ✅      |    ✅     | Boolean | Is journal page                          |
| `:block/journal-day`   |     ✅      |    ✅     | Int     | Journal date (YYYYMMDD)                  |
| `:block/type`          |     ❌      |    ✅     | String  | Type ("page", "class", "property", etc.) |
| `:block/format`        |     ✅      |    ❌     | Keyword | Format (:markdown or :org)               |
| `:block/file`          |     ✅      |    ❌     | Ref     | Associated file reference                |

#### 3.3 DB Graph Specific - System Properties (Idents)

| Attribute                            | Type     | Description                  |
|--------------------------------------|----------|------------------------------|
| `:logseq.property/created-at`        | Int (ms) | Creation timestamp           |
| `:logseq.property/updated-at`        | Int (ms) | Update timestamp             |
| `:logseq.property/icon`              | Object   | Icon definition `{type, id}` |
| `:logseq.property/hide-empty-value`  | Boolean  | Hide property if empty       |
| `:logseq.property/closed-value-mode` | Boolean  | Enum mode for property       |
| `:logseq.property/closed-values`     | Array    | Allowed enum values          |
| `:logseq.property/schema`            | Object   | Property schema definition   |
| `:logseq.property. class/extends`    | Ref[]    | Parent class references      |
| `:logseq.property.class/properties`  | Ref[]    | Class property references    |

#### 3.4 DB Graph Task System

In DB Graph, tasks use a different system based on tags/classes:

| Attribute                | Description                                                 |
|--------------------------|-------------------------------------------------------------|
| `:block/tags`            | Reference to task status class (e.g., `#logseq.class/Todo`) |
| `:logseq.task/status`    | Task status property                                        |
| `:logseq.task/priority`  | Task priority property                                      |
| `:logseq.task/deadline`  | Task deadline property                                      |
| `:logseq.task/scheduled` | Task scheduled property                                     |

---

### 4. Common Query Examples

#### 4.1 Task Queries

**File Graph:**

```typescript
// All TODOs
const todos = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where [?b :block/marker "TODO"]]
`)

// TODO or DOING
const activeTasks = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :in $ [?m ...]
   :where [?b :block/marker ? m]]
`, `["TODO" "DOING"]`)

// Tasks with priority A
const priorityTasks = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where 
   [?b :block/marker ? m]
   [?b : block/priority "A"]]
`)

// Scheduled for today
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const scheduled = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :in $ ? today
   :where [?b : block/scheduled ?today]]
`, parseInt(today))
```

**DB Graph:**

```typescript
// All tasks with TODO status
const todos = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where
   [?b :block/tags ?tag]
   [?tag :db/ident : logseq.class/Todo]]
`)

// Tasks by status property
const tasks = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where
   [?b :logseq.task/status ?s]
   [?s :db/ident :logseq. task/status. todo]]
`)
```

#### 4.2 Page Queries

**Both File Graph and DB Graph:**

```typescript
// All journal pages
const journals = await logseq.DB.datascriptQuery(`
  [:find (pull ?p [*])
   :where [?p :block/journal?  true]]
`)

// Journals in specific month
const monthJournals = await logseq.DB.datascriptQuery(`
  [:find (pull ?p [*])
   :where
   [?p :block/journal?  true]
   [?p : block/journal-day ?d]
   [(>= ?d 20250101)]
   [(<= ?d 20250131)]]
`)

// Blocks in a specific page
const blocks = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :in $ ? name
   :where
   [? p :block/name ?name]
   [?b :block/page ?p]]
`, `"my-page"`)
```

**DB Graph only:**

```typescript
// Pages by type
const pages = await logseq.DB.datascriptQuery(`
  [:find (pull ?p [*])
   :where [?p :block/type "page"]]
`)

// Class/Tag pages
const classes = await logseq.DB.datascriptQuery(`
  [:find (pull ?p [*])
   :where [?p : block/type "class"]]
`)

// Recently created pages (last 7 days)
const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
const recentPages = await logseq.DB.datascriptQuery(`
  [:find (pull ?p [*])
   :where
   [?p :block/type "page"]
   [?p :logseq.property/created-at ?created]
   [(> ? created ${sevenDaysAgo})]]
`)
```

#### 4.3 Reference Queries

**Both File Graph and DB Graph:**

```typescript
// Blocks referencing a specific page
const refs = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :in $ ?page
   :where
   [? p :block/name ?page]
   [?b :block/refs ?p]]
`, `"target-page"`)

// Block references (backlinks)
const blockRefs = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :in $ ?uuid
   :where
   [? target :block/uuid ?uuid]
   [?b :block/refs ?target]]
`, `#uuid "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`)
```

#### 4.4 Property Queries

**File Graph:**

```typescript
// Blocks with specific property
const withProp = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where
   [?b :block/properties ?props]
   [(get ?props :status)]]
`)

// Property equals specific value
const statusDone = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where
   [?b :block/properties ?props]
   [(get ?props :status) ?v]
   [(= ?v "done")]]
`)
```

**DB Graph:**

```typescript
// Blocks with property value (properties are direct attributes)
const withProp = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where
   [?b : user. property/status ?v]]
`)

// Query by property ident
const results = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where
   [? prop :db/ident : user.property/status]
   [?b ? prop ? v]
   [?v :block/title "done"]]
`)
```

#### 4.5 Content Search

**File Graph:**

```typescript
// Content contains keyword
const results = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where
   [? b :block/content ?c]
   [(clojure.string/includes?  ?c "keyword")]]
`)
```

**DB Graph:**

```typescript
// Title contains keyword
const results = await logseq.DB.datascriptQuery(`
  [:find (pull ?b [*])
   :where
   [?b :block/title ?t]
   [(clojure.string/includes?  ?t "keyword")]]
`)
```

---

### 5. Predicate Functions

```clojure
;; Comparison
[(> ? d 20250101)]
[(>= ?d 20250101)]
[(< ?d 20250131)]
[(<= ?d 20250131)]
[(= ?v "value")]
[(not= ?v "value")]

;; String operations
[(clojure.string/includes? ? s "text")]
[(clojure.string/starts-with? ?s "prefix")]
[(clojure.string/ends-with? ?s "suffix")]
[(clojure.string/blank? ?s)]

;; Collection operations
[(contains? #{"A" "B" "C"} ?v)]

;; Null checks
[(some? ?v)]
[(nil? ?v)]

;; Math operations
[(+ ?a ?b) ? sum]
[(- ?a ?b) ?diff]
[(* ?a ?b) ?product]
```

---

### 6. NOT and OR Clauses

```clojure
;; NOT - exclude conditions
[: find (pull ?b [*])
 :where
 [? b :block/marker ? m]
 (not [?b :block/priority "C"])]

;; OR - any condition matches
[:find (pull ?b [*])
 :where
 (or [?b :block/marker "TODO"]
     [?b : block/marker "DOING"])]

;; OR with AND (or-join)
[:find (pull ?b [*])
 :where
 (or-join [? b]
          (and [?b :block/marker "TODO"]
               [?b :block/priority "A"])
          (and [?b :block/marker "DOING"]))]
```

---

### 7. Aggregation Queries

```typescript
// Count
const count = await logseq.DB.datascriptQuery(`
  [:find (count ?b)
   :where [?b : block/marker "TODO"]]
`)

// Group by page
const grouped = await logseq.DB.datascriptQuery(`
  [:find ? name (count ?b)
   :where
   [?b :block/marker "TODO"]
   [?b :block/page ?p]
   [?p :block/name ?name]]
`)

// Min/Max
const range = await logseq.DB.datascriptQuery(`
  [:find (min ?d) (max ?d)
   :where
   [?p :block/journal? true]
   [?p :block/journal-day ?d]]
`)
```

---

### 8. Cross-Compatible Plugin Example

```typescript
import '@logseq/libs'

async function detectGraphType(): Promise<'db' | 'file'> {
  const result = await logseq.DB.datascriptQuery(`
    [:find ? type . 
     :where [_ :block/type ?type]]
  `)
  return result ? 'db' : 'file'
}

async function queryTodos(graphType: 'db' | 'file') {
  if (graphType === 'file') {
    return await logseq.DB.datascriptQuery(`
      [:find (pull ?b [*])
       :where [?b :block/marker "TODO"]]
    `)
  } else {
    return await logseq.DB.datascriptQuery(`
      [:find (pull ?b [*])
       :where
       [?b :block/tags ?tag]
       [?tag :db/ident :logseq.class/Todo]]
    `)
  }
}

async function queryBlockContent(uuid: string, graphType: 'db' | 'file') {
  const attr = graphType === 'file' ? ': block/content' : ':block/title'
  return await logseq.DB.datascriptQuery(`
    [:find ? content .
     :in $ ?uuid
     :where
     [? b : block/uuid ?uuid]
     [?b ${attr} ?content]]
  `, `#uuid "${uuid}"`)
}

async function main() {
  const graphType = await detectGraphType()
  console.log('Graph type:', graphType)

  logseq.Editor.registerSlashCommand('Query TODOs', async () => {
    try {
      const results = await queryTodos(graphType)
      const todos = results?.flat() || []

      if (todos.length) {
        const content = todos.map(t => `- ((${t.uuid}))`).join('\n')
        await logseq.Editor.insertAtEditingCursor(content)
      } else {
        await logseq.UI.showMsg('No TODOs found', 'warning')
      }
    } catch (e) {
      console.error('Query failed:', e)
      await logseq.UI.showMsg('Query failed', 'error')
    }
  })
}

logseq.ready().then(main)
```

---

### 9. Important Notes

1. **Page names are lowercase**:  `:block/name` stores lowercase names; convert before querying
2. **Parameter format**:
    - Strings: `"value"`
    - Numbers: `123`
    - UUIDs: `#uuid "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
    - Keywords: `:keyword`
    - Collections: `["a" "b" "c"]`
3. **Flatten results**: Query results usually need `.flat()` processing
4. **Error handling**: Always wrap queries in try-catch
5. **Performance**: Use `pull` with specific attributes instead of `[*]` when possible
6. **Graph compatibility**: Check graph type before using graph-specific attributes