# DB Model Review Rules

Apply when a change touches built-in properties, common keywords, DB schema, migrations, DB graph/file graph differences, or persisted entity attributes.

## Review focus

- DB graphs use `:block/title` for the main block content; do not introduce new DB-graph logic around `:block/content`.
- New common keywords should be added through `logseq.common.defkeywords/defkeywords`.
- New built-in properties should be added to `logseq.db.frontend.property/built-in-properties`.
- Built-in property changes require matching migrations in `frontend.worker.db.migrate/schema-version->updates`.
- Persisted data shape changes require migration, import/export, and sync review.
- DB graph and file graph behavior should be intentionally different only when documented by the domain model.

## Red flags

- Adding a property/class when an existing one can represent the concept.
- Changing keyword names or attribute semantics without migration coverage.
- Assuming `:block/content` stores DB graph block text.
- Adding fallback defaults to hide invalid persisted state.

## Review questions

- What existing graph data is affected?
- Is there a migration path for old data?
- Do import/export, sync, and CLI paths understand the new shape?
- Are property/class definitions minimal and reusable?
- Are tests covering migrated and newly-created data?

## Related modules

- Load [`../libraries/clojure-cljs.md`](../libraries/clojure-cljs.md) for general Clojure keyword naming rules.
- Load [`db-sync.md`](./db-sync.md) when the persisted data shape affects sync protocol, server state, or D1 schema.
- Load [`import-export.md`](./import-export.md) when the persisted data shape affects file import/export or publishing.
