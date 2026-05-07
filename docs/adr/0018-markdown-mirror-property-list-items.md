# ADR 0018: Markdown Mirror Property List Items

Date: 2026-05-07
Status: Proposed

## Context
ADR 0016 introduced Markdown Mirror as derived Markdown output for DB graphs.
ADR 0017 added an optional two-way importer and made the DB the authoritative
data model.

The existing Logseq property syntax renders properties as plain indented lines:

```markdown
- Block A
  key:: value
```

That shape is valid for Logseq but awkward in external Markdown editors because
the property line is not part of the surrounding list. A
[Logseq forum proposal](https://discuss.logseq.com/t/an-idea-for-a-more-standard-markdown-property-syntax/20073)
suggested using Markdown list items with `*` for properties while keeping `-`
for blocks:

```markdown
- Block A
  * key:: value
```

The same proposal discussed replacing `key::` with bold label syntax. For
Markdown Mirror we keep `key::` because it is already the Logseq property marker
and makes the exported file easier to parse without adding another property key
syntax.

## Decision
1. Markdown Mirror exports user-visible page and block properties as Markdown
   list items:
   - page property: `* key:: value`
   - block property: `  * key:: value`
2. Blocks continue to use `-` list items.
3. The mirror keeps `id:: <uuid>` as the internal page identity marker.
4. The task status property is not exported as a property list item. It remains
   encoded in the block line status marker, for example `- TODO ship`.
5. Open `:default` property values are exported as property value blocks:
   - one value:
     ```markdown
     * key::
       - First value
     ```
   - many values:
     ```markdown
     * key::
       - First value
       - Second value
     ```
6. Closed values are exported inline with the property key, including
   cardinality-many closed values: `* key:: First value, Second value`.
7. Node property values are exported as Logseq page references:
   `[[Node title]]`.
8. Markdown Mirror does not export node property values as block references
   using `((uuid))`.
9. Two-way import recognizes property list items and skips them. This includes
   indented property value blocks.
10. Two-way import continues to ignore all non-status property edits. The only
   property with two-way behavior is task status, via the block line status
   marker.

## Syntax

```markdown
id:: 11111111-1111-4111-8111-111111111111
* owner:: [[Bob]]
* rating:: 5

- TODO Write draft
  * description::
    - First value
    - Second value
  * owner:: [[Alice]]
  * references::
    - Design note
      * rating:: 4
  * mood:: Joy, Sad
  - Child block
```

In this example:
- `owner`, `rating`, and `mood` are inline exported properties.
- `description` and `references` have block-shaped property values.
- `mood` is a closed-value property, so it remains inline.
- `Child block` is the only child block imported as outline content.
- `TODO` is the only imported property change path.

## Consequences

### Positive
- Exported properties are part of normal Markdown lists, so external Markdown
  editors render them more predictably.
- The distinction between blocks and properties is visible in plain text:
  blocks use `-`, properties use `*`.
- Keeping `key::` avoids adding a second property key syntax.
- Open default values can carry nested properties without being flattened.
- Node property values remain stable, readable Logseq page references.

### Tradeoffs
- Mirror output now differs from the legacy Logseq Markdown property layout.
- Property value blocks are visible in the mirror but are read-only for two-way
  import until property import is deliberately expanded.
- Closed values and node values remain inline, so different property types have
  different value layout.
- The parser must distinguish property value blocks from real child blocks.

## Compatibility
Legacy `key:: value` property lines are still ignored by the two-way parser, but
new mirror output uses `* key:: value`.

## Verification
Focused tests:

```bash
bb dev:test -v frontend.worker.markdown-mirror-test/page-mirror-exports-property-values-test
bb dev:test -v frontend.worker.markdown-mirror-test/page-mirror-exports-node-property-values-as-page-refs-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-markdown-property-lines-and-values-are-ignored-test
```
