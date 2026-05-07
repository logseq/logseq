# Logseq Markdown Syntax

This document describes the Markdown subset used by Logseq Markdown Mirror for
DB graphs.

## Page Identity
Mirror files start with an internal page id marker:

```markdown
id:: 11111111-1111-4111-8111-111111111111
```

The marker is used only to match a mirror file back to the DB page. It is not a
normal page property.

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

Page properties appear before the first block. Block properties appear under
the block they belong to.

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
  * mood:: joy, sad
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

Markdown Mirror exports these property value blocks, but two-way import skips
non-status properties and their value blocks.

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

Two-way import updates tag references from these block-line tags.

## Task Status
Task status is encoded on the block line:

```markdown
- TODO Write draft
- DONE Publish note
```

For two-way sync, task status is the only property currently imported back into
the DB. Other property edits are ignored.
