# Migration-validation Pass

Inspect the reviewed change for missing or incorrect frontend DB migrations. Decide whether changed persisted graph state requires updates in `frontend.worker.db.migrate`, especially `schema-version->updates` and the migration maps returned as `:migrate-updates`.

## Required checks

- Identify every changed persisted attribute, built-in property, built-in class, schema entry, kv entry, datom shape, or invariant that can already exist in user graphs.
- Check whether the change requires a new `frontend.worker.db.migrate/schema-version->updates` entry and a matching `logseq.db.frontend.schema/version` bump.
- For new built-in properties or classes, verify that the migration map uses the correct `:properties` or `:classes` entry so `upgrade-version!` returns accurate `:migrate-updates`.
- For data rewrites, backfills, or invariant repairs, verify that the migration map uses `:fix` and that the returned tx report includes the intended `:migrate-updates` for sync handling.
- For deleted properties, verify `:delete-properties` coverage and check whether the deleted attrs must also be listed in `logseq.db-sync.tx-sanitize/migration-deleted-attrs`.
- Check that older graph versions are migrated deterministically without relying on runtime fallback defaults or broad compatibility code.
- Check migration tests under `src/test/frontend/worker/migrate_test.cljs` or an equivalent targeted test for the old-version graph state and the post-migration state.

## Red flags

- A new built-in property/class or persisted attr is only added to creation-time data, schema, or property definitions, with no `schema-version->updates` entry for existing graphs.
- `logseq.db.frontend.schema/version` is bumped without a corresponding migration entry, or a migration entry exceeds the current schema version.
- Migration tx data changes existing user graph state but `:migrate-updates` does not describe the migration map that sync consumers need.
- Deleted attrs are removed locally but still leak through db-sync sanitization or old local tx replay.
- Tests cover newly-created graphs only, not migration from the previous schema version.

## Suggested validation

- Static evidence: inspect `src/main/frontend/worker/db/migrate.cljs`, `deps/db/src/logseq/db/frontend/schema.cljs`, built-in property/class definitions, and db-sync sanitization when attrs are deleted.
- Test evidence: run a focused migration test with `bb dev:test -v frontend.worker.migrate-test/<test-name>` when a migration finding is actionable.

Return results using [`subagent-output.md`](./subagent-output.md). If there are no findings, state which persisted changes were inspected and why no migration, `migrate-updates`, schema version bump, or migration test is required.
