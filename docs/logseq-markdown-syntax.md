# Logseq Markdown Syntax

This document describes the Markdown syntax used by Logseq Markdown Mirror for
DB graphs.

## Page Identity
Mirror files start with an internal page id marker:

```markdown
id:: 11111111-1111-4111-8111-111111111111
```

The marker associates a mirror file with the DB page. It is not a normal page
property.

## Blocks
Blocks are Markdown list items that use `-`.

```markdown
- Parent
  - Child
  - Another child
- Sibling
```

Indentation defines block nesting. Markdown Mirror writes two spaces per nested
level.

## Properties
Properties are Markdown list items that use `*` and keep the Logseq property
marker `key::`.

```markdown
* page-property:: [[Page value]]

- Block
  * block-property:: 42
```

Page properties appear before the first block. Block properties appear under the
block they belong to.

Open `:default` property values are represented by nested value blocks:

```markdown
- Oscar Wilde
  * description::
    - Irish poet and playwright
  * books::
    - The Picture of Dorian Gray
      * year:: 1891
    - The Importance of Being Earnest
      * year:: 1895
```

Closed values stay inline with the property key, including many-value
properties:

```markdown
- Entry
  * mood:: Joy, Sad
```

Non-default scalar values and node values also stay inline:

```markdown
- Lewis Carroll
  * books:: [[Alice in Wonderland]]
  * rating:: 5
```

Property value blocks can have nested blocks:

```markdown
- Book list
  * notes::
    - Alice
      - Draft
```

## References
Page and node references use Logseq page reference syntax:

```markdown
- Read [[Project Plan]]
  * owner:: [[Alice]]
```

Node property values are exported as `[[Node title]]`. Mirror export does not
use `((uuid))` for node property values.

## Tags
Tags are exported on block lines when they are normal user tags:

```markdown
- Call customer #sales
- Review #[[Quarterly plan]]
```

## Task Status
Task status is encoded on the block line:

```markdown
- TODO Write draft
- DONE Publish note
```

Task status is not exported as a separate `* Status::` property list item.
