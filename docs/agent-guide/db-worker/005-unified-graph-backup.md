# Unified Graph Backup Implementation Plan

Goal: Unify Desktop app and `logseq-cli` graph backup behavior around one shared db-worker-node backup implementation.

Architecture: Keep the live SQLite snapshot operation inside the existing db-worker-node runtime and continue to use `:thread-api/backup-db-sqlite`.
Architecture: Move backup naming, paths, target selection, metadata, listing, deletion, and retention into one shared Node-only namespace that both Electron main process code and CLI command code call.
Architecture: Do not add a new `thread-api` unless implementation proves that the existing `:thread-api/backup-db-sqlite` and `:thread-api/import-db-binary` APIs cannot preserve the required behavior.

Tech Stack: ClojureScript, Node.js `fs` and `path`, Promesa, existing db-worker-node HTTP invoke bridge, existing `logseq.cli.server`, existing `electron.db-worker`, existing `logseq.db.sqlite.backup`.

Related: Builds on `docs/agent-guide/db-worker/001-db-worker-node-restart-on-version-mismatch.md`.
Related: Relates to `docs/agent-guide/db-worker/002-desktop-db-worker-request-cap-switch-graph.md`.
Related: Relates to `docs/agent-guide/db-worker/003-server-list-write-lock.md`.
Related: Relates to `docs/agent-guide/074-db-worker-node-invoke-main-thread-refactor.md`.
Related: Relates to `docs/cli/logseq-cli.md`.

## Problem statement

Desktop and CLI already share the db-worker-node SQLite snapshot primitive, but they do not share graph backup orchestration.

The db-worker-node runtime exposes `:thread-api/backup-db-sqlite` from `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.

The db-worker-node HTTP server marks `:thread-api/backup-db-sqlite` as a write method in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`, so it already validates the bound repo and the db-worker-node write lock before allowing the backup.

The Node platform adapter in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` implements the actual snapshot by calling the SQLite connection backup operation.

Desktop graph backups currently live in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db.cljs`.

Desktop uses `electron.db/backup-db-via-worker!` to ask db-worker-node to copy the live database to a temporary path, then reads that temporary file back into Electron and writes a timestamped `.sqlite` file through `/Users/rcmerci/gh-repos/logseq/src/electron/electron/backup_file.cljs`.

Desktop stores graph backups under `<graphs-dir>/<encoded-graph>/backups`.

Desktop retains 12 versions and skips non-forced backups when the newest backup is less than one hour old.

CLI graph backups currently live in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`.

CLI stores graph backups under `<root-dir>/graphs/<encoded-graph>/backup/<encoded-backup-name>/db.sqlite`.

CLI can list, create, restore, and remove backups.

CLI backup creation already invokes the existing `:thread-api/backup-db-sqlite` method directly against the final backup `db.sqlite` path.

The two implementations now duplicate backup path and retention responsibilities in different places and use different filesystem layouts.

This means Desktop automatic backups cannot be listed, restored, or removed by the CLI graph backup commands.

This also means future backup behavior fixes must be made in multiple places.

## Testing Plan

I will use @Test-Driven Development (TDD) before changing implementation behavior.

I will add a new unit test namespace at `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/graph_backup_test.cljs`.

I will test that the shared backup namespace derives backup roots as `<graphs-dir>/<encoded-graph>/backup`.

I will test that the shared backup namespace writes backup directories as `<backup-root>/<encoded-backup-name>/db.sqlite`.

I will test that backup names preserve the current CLI shape for graph backup create, including optional labels and UTC timestamps.

I will test that list returns only backups that contain a `db.sqlite` file and ignores incomplete temporary directories.

I will test that create calls a caller-provided snapshot function exactly once with a temporary SQLite destination and publishes the final backup only after the snapshot succeeds.

I will test that a failed snapshot removes temporary files and leaves no listable backup.

I will test that explicit CLI backups do not apply Desktop automatic backup throttling or retention.

I will test that Desktop automatic backups skip creation when the latest explicit Desktop automatic backup is newer than one hour and `force-backup?` is false.

I will test that Desktop automatic backup retention prunes only backups whose metadata explicitly identifies them as Desktop automatic backups.

I will test that Desktop manual backups and CLI backups are not pruned by Desktop automatic retention.

I will update `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` so CLI backup list, create, restore, and remove exercise the shared backup namespace behavior.

I will update `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_test.cljs` so Desktop graph backups use the same shared `backup` layout as CLI graph backups and still invoke db-worker-node through the existing `:thread-api/backup-db-sqlite`.

I will update `/Users/rcmerci/gh-repos/logseq/src/test/frontend/persist_db_test.cljs` only if the renderer IPC contract changes.

The preferred implementation keeps the renderer IPC contract stable, so existing renderer tests for `:db-export` should continue to pass without broad changes.

I will update `/Users/rcmerci/gh-repos/logseq/src/test/frontend/handler/export_test.cljs` only if the visible SQLite export flow changes.

The preferred implementation leaves `:db-export-as` as a direct SQLite export and not a graph backup.

I will run focused RED tests before implementation and confirm they fail because the shared namespace does not exist or current Electron tests still expect the old `backups` layout.

I will run focused tests after implementation with commands such as `bb dev:test -v logseq.db-worker.graph-backup-test`, `bb dev:test -v logseq.cli.command.graph-test`, and `bb dev:test -v electron.db-test`.

I will run `bb dev:lint-and-test` after focused tests pass.

I will run CLI E2E non-sync coverage after the unit suite passes with `bb -f cli-e2e/bb.edn build` followed by `bb -f cli-e2e/bb.edn test --skip-build`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation snapshot

| Concern | Current location | Current behavior | Unification issue |
|---------|------------------|------------------|-------------------|
| db-worker-node snapshot API | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` | `:thread-api/backup-db-sqlite` checkpoints the graph DB and calls the platform SQLite backup function. | This is already the right shared snapshot primitive. |
| db-worker-node HTTP boundary | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` | `/v1/invoke` validates repo, write methods, and db-worker-node lock ownership. | No new HTTP endpoint or thread API should be needed. |
| Node SQLite backup | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` | The Node platform calls `.backup` on the SQLite connection. | This should stay behind `:thread-api/backup-db-sqlite`. |
| Desktop backup orchestration | `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db.cljs` | Copies through db-worker-node into a temp file, reads bytes into Electron, then writes through `electron.backup-file/backup-file`. | This duplicates retention and writes a second copy from Electron. |
| Desktop backup file helper | `/Users/rcmerci/gh-repos/logseq/src/electron/electron/backup_file.cljs` | Writes timestamped files under `backups` and prunes old versions. | This helper is still used by file write failure backup and should not own graph backup policy. |
| Desktop IPC | `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs` | `:db-export` calls `backup-db-via-worker!` and `:db-export-as` calls direct SQLite export. | `:db-export` should use shared graph backup orchestration, while `:db-export-as` remains an export. |
| Desktop open backup folder | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/config.cljs` | `get-electron-backup-dir` points to `<graph>/backups`. | It should point to the unified `<graph>/backup` directory after graph backup unification. |
| CLI backup orchestration | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` | Owns backup path helpers, list, target selection, create, restore, and remove. | These helpers should move to the shared backup namespace. |
| CLI docs | `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Documents CLI backup snapshots under `<root-dir>/graphs/<graph>/backup`. | The documented CLI layout should become the Desktop graph backup layout too. |

## Target behavior

One Node-only namespace owns graph backup filesystem behavior.

Both Desktop and CLI use that namespace for graph backup path derivation, backup name creation, list, create, remove, metadata, and retention.

The canonical graph backup root is `<graphs-dir>/<encoded-graph>/backup`.

Each listable backup is stored as `<backup-root>/<encoded-backup-name>/db.sqlite`.

The shared namespace must use `logseq.common.graph-dir` path encoding instead of ad hoc string replacement.

The shared namespace must accept a caller-provided snapshot function so it does not depend on Electron windows, CLI config, or HTTP transport.

Desktop snapshot creation supplies a snapshot function that ensures the db-worker-node runtime through `electron.db-worker/ensure-runtime!` and invokes `:thread-api/backup-db-sqlite`.

CLI snapshot creation supplies a snapshot function that ensures the db-worker-node runtime through `logseq.cli.server/ensure-server!` and invokes `:thread-api/backup-db-sqlite`.

Restore continues to use the existing CLI SQLite import flow and `:thread-api/import-db-binary`.

Manual SQLite export through `:db-export-as` remains an export flow and does not become a graph backup.

`electron.backup-file` remains available for non-graph file write failure backups, but graph backups no longer depend on it.

No new `thread-api` should be added for this change.

No browser renderer code should import the shared Node-only backup namespace.

Desktop automatic backup retention must not remove CLI-created backups.

Desktop automatic backup retention must not remove Desktop manual backups.

Missing or invalid backup names at command boundaries should return actionable errors instead of silently picking defaults.

## Proposed architecture

The shared namespace should be `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/graph_backup.cljs`.

The namespace should be Node-only because it uses Node `fs` and `path`.

The namespace should not require `electron.*` namespaces.

The namespace should not require `logseq.cli.server`.

The namespace should not call `transport/invoke`.

The namespace should accept `graphs-dir`, `repo`, `backup-name`, `source`, and `snapshot!` from callers.

The shared namespace should write optional metadata next to each backup.

The metadata file should be used for retention filtering and debugging, not for the CLI output contract unless a later product decision asks for that.

The metadata file should be named `metadata.edn`.

The metadata should include `:schema-version`, `:name`, `:repo`, `:source`, `:created-at-ms`, and `:db-path`.

The shared namespace should only prune backups that explicitly opt into the retention source being pruned.

Missing metadata must not make a backup eligible for Desktop automatic retention.

The implementation should keep the current CLI backup output fields unless a test proves an output update is required.

```text
CLI command code
  |
  | ensures db-worker-node with logseq.cli.server
  | passes snapshot! to shared graph backup namespace
  v
logseq.db-worker.graph-backup
  |
  | owns backup path, create, list, remove, retention
  | calls snapshot! with a temp sqlite path
  v
db-worker-node /v1/invoke
  |
  | existing :thread-api/backup-db-sqlite
  v
live SQLite connection backup

Electron main process
  |
  | ensures db-worker-node with electron.db-worker
  | passes snapshot! to shared graph backup namespace
  v
same shared graph backup namespace
```

## Shared namespace responsibilities

Add `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/graph_backup.cljs`.

Add `backup-root-path` to return `<graphs-dir>/<encoded-graph>/backup`.

Add `backup-dir-name` to encode a backup name with `logseq.common.graph-dir/graph-dir-key->encoded-dir-name`.

Add `backup-dir-path` to return `<backup-root>/<encoded-backup-name>`.

Add `backup-db-path` to return `<backup-dir>/db.sqlite`.

Add `backup-metadata-path` to return `<backup-dir>/metadata.edn`.

Add `build-backup-name` to preserve the current CLI naming shape.

Add `next-backup-target` to find a non-existing target and append numeric suffixes when needed.

Add `list-backups` to list only directories with a real `db.sqlite`.

Add `<create-backup!` to create one backup by calling a caller-provided snapshot function.

Add `remove-backup!` to delete one backup directory.

Add `latest-backup-info` to support Desktop automatic backup throttling.

Add `prune-backups!` to remove old backups for one explicit metadata source.

All async public functions should return Promesa promises and use a leading `<` name when the function itself is promise-returning.

Synchronous path helpers can keep plain names.

## Backup creation details

The shared create flow should validate `graphs-dir`, `repo`, `backup-name`, and `snapshot!` before touching the filesystem.

The shared create flow should create the backup root if needed.

The shared create flow should reserve the target directory before calling `snapshot!`.

The shared create flow should write the SQLite snapshot to a temporary path inside the reserved target directory.

The shared create flow should rename the temporary SQLite file to `db.sqlite` only after `snapshot!` succeeds.

The shared create flow should write `metadata.edn` only after `db.sqlite` exists.

The shared create flow should remove the reserved target directory if `snapshot!` fails before a listable backup exists.

The shared create flow should return `{:backup-name ..., :path ..., :created? true}` after successful creation.

The shared create flow should return `{:backup-name nil, :path nil, :created? false, :reason :too-soon}` when Desktop automatic backup throttling intentionally skips creation.

The shared create flow should throw on invalid paths, missing inputs, snapshot failure, and retention failure.

The shared create flow should not silently swallow backup failures.

## Desktop integration plan

Update `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db.cljs`.

Remove graph backup orchestration from `backup-db-with-sqlite-backup!` or shrink it to a small wrapper around the shared graph backup namespace.

Keep `ensure-graphs-dir!`, `ensure-graph-dir!`, and `get-db` only if callers still need them.

Change `backup-db-via-worker!` so it calls the shared `<create-backup!` with `graphs-dir` from `logseq.cli.common.graph/get-db-graphs-dir`.

Use `electron.db-worker/ensure-runtime!` and `logseq.cli.transport/invoke` only inside the Desktop snapshot function.

Pass `:source :electron-auto` when `force-backup?` is false.

Pass `:source :electron-manual` when `force-backup?` is true.

Apply one-hour throttling and 12-version retention only for `:electron-auto`.

Do not apply automatic retention to `:electron-manual` or `:cli` backups.

Keep `export-db-via-worker!` and `export-db-to-export-dir-via-worker!` as direct export helpers that write to the requested export path.

Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/config.cljs` so `get-electron-backup-dir` returns `<graph>/backup`.

Do not add new visible UI text for the folder change unless product wants a migration note.

If visible UI text is added or changed, load @logseq-i18n first and follow `/Users/rcmerci/gh-repos/logseq/.agents/skills/logseq-i18n/SKILL.md`.

## CLI integration plan

Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`.

Before editing this file, read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/AGENTS.md`.

Remove private backup path helpers from the CLI command namespace once the shared namespace owns them.

Keep CLI parsing, validation, action construction, and presentation contracts in the CLI command namespaces.

Keep the current `graph backup create` backup name shape by delegating name construction to the shared namespace.

Change `execute-graph-backup-list` to call the shared `list-backups`.

Change `execute-graph-backup-create` to call the shared `<create-backup!`.

The CLI snapshot function should call `logseq.cli.server/ensure-server!` and `logseq.cli.transport/invoke` with `:thread-api/backup-db-sqlite`.

Change `execute-graph-backup-restore` to locate the source `db.sqlite` with the shared `backup-db-path`, then keep reusing the existing SQLite import flow.

Change `execute-graph-backup-remove` to call the shared `remove-backup!`.

Keep machine-readable JSON and EDN output fields stable unless the implementation intentionally changes the public contract and updates tests.

## Detailed implementation tasks

1. Read `/Users/rcmerci/gh-repos/logseq/AGENTS.md`.

2. Read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/AGENTS.md` before editing CLI code.

3. Load @Test-Driven Development (TDD) before writing implementation code.

4. Write failing path derivation tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/graph_backup_test.cljs`.

5. Write failing list tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/graph_backup_test.cljs`.

6. Write failing create success tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/graph_backup_test.cljs`.

7. Write failing create failure cleanup tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/graph_backup_test.cljs`.

8. Write failing automatic throttling tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/graph_backup_test.cljs`.

9. Write failing automatic retention tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/graph_backup_test.cljs`.

10. Run `bb dev:test -v logseq.db-worker.graph-backup-test` and confirm the new tests fail for the expected missing namespace or missing behavior.

11. Add `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/graph_backup.cljs` with only enough implementation to pass the shared namespace tests.

12. Run `bb dev:test -v logseq.db-worker.graph-backup-test` and confirm the shared namespace tests pass.

13. Write failing CLI tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` for shared create, list, restore, and remove behavior.

14. Run the focused CLI graph tests and confirm the new assertions fail against the old CLI-local helper implementation.

15. Refactor `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` to use the shared graph backup namespace.

16. Run `bb dev:test -v logseq.cli.command.graph-test` and confirm the CLI graph tests pass.

17. Write failing Electron tests in `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_test.cljs` for unified backup path, source metadata, throttling, retention, and existing worker invocation.

18. Run `bb dev:test -v electron.db-test` and confirm the new Electron backup tests fail against the current `backups` layout.

19. Refactor `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db.cljs` to use the shared graph backup namespace for graph backups.

20. Keep `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db.cljs` direct export helpers on their current worker-backed export path.

21. Run `bb dev:test -v electron.db-test` and confirm the Electron tests pass.

22. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/config.cljs` to point Electron graph backup folder links at `backup`.

23. Run affected frontend tests if a config or renderer expectation changes.

24. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` only if the documented CLI behavior changes or if the document should explicitly note that Desktop graph backups now use the same directory.

25. Run `bb dev:lint-and-test`.

26. Run `bb -f cli-e2e/bb.edn build`.

27. Run `bb -f cli-e2e/bb.edn test --skip-build`.

28. Use @logseq-review-workflow to review the completed implementation.

29. In the review, apply repository-wide rules from `.agents/skills/logseq-review-workflow/rules/common.md`.

30. In the review, apply ClojureScript rules from `.agents/skills/logseq-review-workflow/rules/libraries/clojure-cljs.md`.

31. In the review, apply Promesa rules from `.agents/skills/logseq-review-workflow/rules/libraries/promesa.md`.

32. In the review, apply Shadow CLJS Node rules from `.agents/skills/logseq-review-workflow/rules/libraries/shadow-cljs-node.md`.

33. In the review, apply CLI rules from `.agents/skills/logseq-review-workflow/rules/modules/logseq-cli.md`.

34. In the review, apply Electron main process rules from `.agents/skills/logseq-review-workflow/rules/modules/electron-main.md`.

35. In the review, apply import/export rules from `.agents/skills/logseq-review-workflow/rules/modules/import-export.md`.

36. Fix any blocking or important review findings.

37. Re-run the focused tests that cover any fixes made after review.

38. Re-run `bb dev:lint-and-test` if review fixes touched source code.

## Edge cases

A backup directory without `db.sqlite` must not appear in `graph backup list`.

A failed snapshot must not leave a partial `db.sqlite` that can be restored later.

Concurrent create calls with the same base backup name must not overwrite one another.

Backup names with slashes, colons, spaces, or non-ASCII text must be encoded through the graph-dir helper.

Backup removal must only remove one encoded backup directory inside the selected graph backup root.

Backup restore must fail with `:backup-not-found` when the source backup is missing or incomplete.

Desktop automatic backup throttling must not skip a forced manual backup.

Desktop automatic backup retention must not delete CLI backups.

Desktop automatic backup retention must not delete backups without explicit `:electron-auto` metadata.

Desktop automatic backup should surface worker errors to the Electron caller and log auto-backup failures.

CLI backup create should keep using the requester revision checks in `logseq.cli.server/ensure-server!`.

CLI backup create should fail if db-worker-node cannot start or the existing server cannot satisfy revision checks.

Restore into an existing destination graph must keep failing through the existing `require-missing-graph` guard.

Direct SQLite export through `:db-export-as` must keep writing the requested export file and must not create a graph backup entry.

## Review Plan

The completed implementation must be checked with @logseq-review-workflow.

The review scope should include `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/graph_backup.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`, `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/frontend/config.cljs`, and all changed tests.

The review should verify that no new `thread-api` was added.

The review should verify that browser renderer bundles do not import Node-only backup code.

The review should verify that CLI output contracts remain stable.

The review should verify that promise-returning backup functions propagate failures.

The review should verify that Desktop automatic retention cannot delete CLI or manual backups.

The review should verify that tests cover behavior and failure modes instead of only checking mocks.

## Testing Details

The shared namespace tests prove the canonical backup layout, backup creation, failure cleanup, list filtering, throttling, and retention behavior directly through filesystem state.

The CLI tests prove that `graph backup list`, `graph backup create`, `graph backup restore`, and `graph backup remove` use the shared layout while preserving command behavior.

The Electron tests prove that Desktop graph backups use the same shared layout and still snapshot through the existing db-worker-node `:thread-api/backup-db-sqlite` path.

The db-worker-node tests that already cover `:thread-api/backup-db-sqlite` should continue to prove that the live SQLite connection can be copied and imported into another graph.

The CLI E2E non-sync cases prove the user-facing graph backup lifecycle still works through the built CLI and db-worker-node bundle.

## Implementation Details

- Create `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/graph_backup.cljs` as the single owner of graph backup filesystem policy.
- Keep db-worker-node snapshotting on the existing `:thread-api/backup-db-sqlite` API.
- Keep CLI restore on the existing SQLite import path and `:thread-api/import-db-binary`.
- Use `<graphs-dir>/<encoded-graph>/backup/<encoded-backup-name>/db.sqlite` as the canonical layout.
- Use `metadata.edn` only for retention filtering and diagnostics in the first implementation.
- Stop using `electron.backup-file/backup-file` for graph backups.
- Keep `electron.backup-file/backup-file` for non-graph file write failure backups.
- Keep `:db-export-as` as a direct export flow, not a graph backup flow.
- Preserve CLI machine output unless product explicitly wants metadata exposed.
- Run @logseq-review-workflow after implementation and before considering the work complete.

## Question

There are no open product questions after review.

Do not migrate or read old Desktop backups under `<graph>/backups`.

Do not add compatibility for the old Desktop graph backup layout.

Keep CLI JSON and EDN output stable and do not expose backup metadata such as `:source`.

Treat Desktop `force-backup? true` as a manual backup.

Protect Desktop manual backups from automatic throttling and automatic retention.

Prune only backups whose metadata explicitly marks them as `:electron-auto`.

Keep the shared backup namespace Node-only.

Do not add a new `thread-api` for this implementation.

---
