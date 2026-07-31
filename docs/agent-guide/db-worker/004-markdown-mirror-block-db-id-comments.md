# Markdown Mirror Block ID Comments

Status: Superseded.

Markdown Mirror files must not append generated block database ids to rendered
block lines. Keep mirrored Markdown clean and user-readable:

```markdown
id:: 11111111-1111-4111-8111-111111111111

- hello
- world
```

The page-level `id:: <uuid>` line remains part of the mirror format because it
identifies the page without changing the friendly file name. Block-level
identity must not be encoded as HTML comments in the mirrored Markdown.

Do not reintroduce block id comments for search integrations. If a future
integration needs block identity, add a non-visible mapping mechanism outside
the Markdown content and keep the mirror files free of implementation metadata.
