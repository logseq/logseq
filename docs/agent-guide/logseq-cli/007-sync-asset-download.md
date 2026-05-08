# Sync Asset Download Implementation Plan

Goal: Add `logseq sync asset download --id <asset-db-id>|--uuid <asset-uuid>` so CLI users can request one remote asset download into the local graph `assets/` directory.

Architecture: Keep command parsing and orchestration in the existing Logseq CLI sync command namespace.
Architecture: Reuse the existing `db-worker-node` thread API `:thread-api/db-sync-request-asset-download` instead of adding another worker API.
Architecture: Resolve `--id` or `--uuid` to the asset UUID, asset type, and checksum before requesting the worker download, skip the request when the local file exists and checksum matches, and request a re-download when the local checksum mismatches.

Tech Stack: ClojureScript, Logseq CLI, `db-worker-node`, Datascript pull/query through existing thread APIs, Promesa, Node filesystem APIs and checksum helpers, CLI unit tests, worker sync asset tests, and CLI e2e sync manifests.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md` and `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/005-graph-create-enable-sync.md`.

## Problem statement

The CLI can create and list assets through `upsert asset` and `list asset`.

The CLI can sync whole graphs through `sync upload`, `sync download`, and `sync start`.

The CLI cannot currently request a single remote asset download after graph metadata has already been synced locally.

The desktop UI already has an asset-demand path that calls `:thread-api/db-sync-request-asset-download` when an asset block has remote metadata and the local file is not ready.

The worker-side request path already checks `platform/asset-stat` before downloading and only calls `download-remote-asset!` when the local file is missing.

The new CLI command should expose the same capability for headless usage while preserving the existing worker ownership of sync asset download logic.

The command should not add a new `db-worker-node` thread API.

The command should not trigger a download request when the target local file exists and its checksum matches the asset metadata.

The command should trigger a new request when the target local file exists but its checksum mismatches, and the output should include a clear mismatch hint.

The command should return immediately after the worker accepts the enqueue request.

The command should fail fast when sync is not already running for the graph, with a hint to run `logseq sync start --graph <graph>` first.

The command should not accept `--e2ee-password` in this first version.

## Testing Plan

Implementation should follow @Test-Driven Development.

I will add parser and action-builder tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` proving `sync asset download --graph demo --id 123` builds a `:sync-asset-download` action with `:id 123`, `:repo "logseq_db_demo"`, and `:graph "demo"`.

I will add parser and action-builder tests proving `sync asset download --graph demo --uuid <asset-uuid>` builds a `:sync-asset-download` action with `:uuid <asset-uuid>`, `:repo "logseq_db_demo"`, and `:graph "demo"`.

I will add parser and action-builder tests proving `sync asset download` without `--graph` fails with `:missing-graph`, without `--id` or `--uuid` fails with `:invalid-options` or `:missing-target`, and with both `--id` and `--uuid` fails with `:invalid-options`.

I will add execution tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` proving the command resolves the asset entity through `:thread-api/pull` or `:thread-api/q`, checks the expected local file and checksum, syncs worker runtime auth/config, verifies sync is already active, and invokes `:thread-api/db-sync-request-asset-download` with `[repo asset-uuid]` only when the file is missing or checksum-mismatched.

I will add an execution test proving an already-present local file with matching checksum returns an ok result with `:download-requested? false` and does not call `:thread-api/db-sync-request-asset-download`.

I will add an execution test proving an already-present local file with mismatched checksum returns an ok result with `:download-requested? true`, includes a checksum mismatch hint, and calls `:thread-api/db-sync-request-asset-download`.

I will add an execution test proving an inactive sync client returns `:sync-not-started` with a hint to run `logseq sync start --graph <graph>`, and does not call `:thread-api/db-sync-request-asset-download`.

I will add execution tests proving non-asset selectors, missing selectors, missing `:block/uuid`, missing asset type, missing checksum, missing remote metadata, and external-url assets fail or skip with explicit error codes instead of silently reporting success.

I will add a worker sync asset unit test around `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/assets.cljs` proving `request-asset-download!` does not call `download-remote-asset!` when `platform/asset-stat` returns metadata for the expected `assets/<asset-uuid>.<asset-type>` file.

I will add a worker sync asset unit test proving `request-asset-download!` calls `download-remote-asset!` when the asset has remote metadata, has no external URL, has an asset type, and `platform/asset-stat` returns nil.

I will add human formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` or the existing format test namespace proving `:sync-asset-download` prints a useful message for both requested and skipped results.

I will add structured output assertions proving JSON and EDN include `:asset-id`, `:asset-uuid`, `:asset-type`, `:download-requested?`, `:checksum-status`, `:skipped-reason`, and `:hint` when applicable, and do not include `:local-path`.

I will add CLI e2e coverage in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_cases.edn` or a focused adjacent sync spec that uploads a graph with an asset, starts sync in a second root, runs `sync asset download --id <asset-db-id>`, and checks that the command returns immediately with an enqueue result.

I will add a second e2e assertion for the already-downloaded case that runs the same command again after the file exists with a matching checksum and verifies the command reports a skip without emitting a second download request observable through worker logs if checksum-only assertions are too brittle.

I will add a checksum mismatch e2e assertion that corrupts the local asset file, runs the command again, and verifies the command reports a checksum mismatch hint and requests a re-download.

I will update `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_inventory.edn` so command coverage includes `sync asset download`.

I will run `bb dev:test -v logseq.cli.command.sync-test` after writing command tests and expect the new tests to fail before implementation.

I will run the worker sync asset test namespace after writing worker tests and expect the new tests to fail if the current test seam is missing or if the skip behavior is not directly covered.

I will run the formatter test after writing formatter coverage and expect the new `:sync-asset-download` human-output assertion to fail before the formatter is updated.

I will run `bb -f cli-e2e/bb.edn test --skip-build --case <new-sync-asset-download-case>` after adding the e2e case and expect it to fail before the built CLI supports the command.

After implementation, I will rerun `bb dev:test -v logseq.cli.command.sync-test` and expect all sync command tests to pass.

After implementation, I will rerun the worker sync asset test namespace and expect the asset skip and download-request tests to pass.

After implementation, I will rerun the formatter test namespace and expect human and structured output tests to pass.

After implementation, I will rebuild the CLI when needed and rerun `bb -f cli-e2e/bb.edn test --skip-build --case <new-sync-asset-download-case>`.

Before submitting, I will run `bb dev:lint-and-test` if the local environment can support the full test suite.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation snapshot

The current sync command implementation lives in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs`.

The existing sync command table defines `sync status`, `sync start`, `sync stop`, `sync upload`, `sync download`, `sync remote-graphs`, `sync ensure-keys`, `sync grant-access`, and `sync config` subcommands.

The existing sync action builder routes sync command keywords through `logseq.cli.command.sync/build-action`.

The existing sync executor routes sync command action types through `logseq.cli.command.sync/execute`.

The top-level command table in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` includes `sync-command/entries`, delegates sync action building to `sync-command/build-action`, and delegates sync execution to `sync-command/execute`.

The existing authenticated sync action set includes `:sync-start`, `:sync-upload`, `:sync-download`, `:sync-remote-graphs`, `:sync-ensure-keys`, and `:sync-grant-access`.

The existing sync runtime setup calls `:thread-api/sync-app-state` and `:thread-api/set-db-sync-config` before worker sync operations.

The existing `sync download` command uses `:thread-api/db-sync-list-remote-graphs` and `:thread-api/db-sync-download-graph-by-id`.

The new command should not use the graph snapshot download API because it only needs one asset.

The existing worker thread API is exposed in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.

The relevant API is:

```text
:thread-api/db-sync-request-asset-download [repo asset-uuid]
  -> frontend.worker.sync/request-asset-download!
  -> frontend.worker.sync.apply-txs/request-asset-download!
  -> frontend.worker.sync.assets/request-asset-download!
```

The worker-side download implementation lives in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/assets.cljs`.

That implementation builds the remote asset URL from the configured `http-base`, graph id, asset UUID, and asset type.

That implementation decrypts the payload when graph E2EE is enabled.

That implementation writes the local file through the active worker platform as `assets/<asset-uuid>.<asset-type>`.

That implementation already checks `platform/asset-stat` before calling `download-remote-asset!`.

The desktop UI demand path lives in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/assets.cljs`.

The UI demand path only requests a remote asset download when the asset has remote metadata, has no external URL, has an asset type, the local file is not ready, and no asset transfer is already in progress.

The CLI asset creation path lives in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`.

That path stores local assets under the graph `assets/` directory as `<block-uuid>.<ext>` and stores asset metadata on the asset block.

The CLI asset listing path lives in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs`.

That path treats `--id` in human output as the Datascript `:db/id`, not the block UUID.

## Proposed command contract

The command syntax should be:

```text
logseq sync asset download --graph <graph-name> --id <asset-db-id>
logseq sync asset download --graph <graph-name> --uuid <asset-uuid>
```

The `--id` option should identify the asset node by Datascript `:db/id` because current CLI table output labels db/id as `ID`.

The `--uuid` option should identify the asset node by `:block/uuid` for scripts that already know the asset UUID.

The command should require exactly one of `--id` or `--uuid`.

The command should require `--graph` because it needs a local graph, a local assets directory, and a graph-specific worker server.

The command should resolve runtime auth like other authenticated sync commands because remote asset downloads use sync HTTP auth headers.

The command should apply sync config defaults in the same way as other sync commands.

The command should require `http-base` because the worker asset download URL is HTTP based.

The command should not accept `--e2ee-password`; users should persist the E2EE password through existing sync flows before using this command.

The command should fail fast when sync is not active for the graph, with a hint to run `logseq sync start --graph <graph>`.

The command should return immediately after the worker accepts the request enqueue.

The command should return `:status :ok` when it successfully enqueues or requests the worker download.

The command should return `:status :ok` with `:download-requested? false` when the local file exists and its checksum matches asset metadata.

The command should return `:status :ok` with `:download-requested? true` and a checksum mismatch hint when the local file exists but its checksum differs from asset metadata.

The command should return `:status :error` when the selected id or uuid is missing, is not an asset, has no UUID, has no asset type, has no checksum, has no remote metadata, or points to an external URL asset.

The command should not return the local path because this first version only requests enqueue and returns immediately.

## Command flow

```text
CLI args
  -> commands/parse
  -> sync-command/build-action
  -> sync-command/execute
  -> resolve runtime auth
  -> ensure db-worker-node server for repo
  -> sync worker runtime auth and sync config
  -> fetch and validate asset entity by db/id or block uuid
  -> ensure db-sync status is active for this graph
  -> compute assets/<asset-uuid>.<asset-type>
  -> check local file exists
  -> compute local checksum when the file exists
  -> return skipped result when local checksum matches
  -> return requested result with mismatch hint when local checksum mismatches
  -> invoke :thread-api/db-sync-request-asset-download [repo asset-uuid]
  -> return requested result immediately
```

The local file and checksum preflight should happen before the worker API call.

The command should not wait for the worker file write to finish.

The worker-side `platform/asset-stat` check should remain as the second line of defense.

## Phase 1. Add failing command parse and action tests.

1. Open `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs`.

2. Add a test that calls `sync-command/build-action` with `:sync-asset-download`, `{:id 123}`, no positional args, and repo `logseq_db_demo`.

3. Assert the result is ok and the action includes `:type :sync-asset-download`, `:repo "logseq_db_demo"`, `:graph "demo"`, and `:id 123`.

4. Add a test that calls `sync-command/build-action` with `:sync-asset-download`, `{:uuid "asset-uuid"}`, no positional args, and repo `logseq_db_demo`.

5. Assert the result is ok and the action includes `:type :sync-asset-download`, `:repo "logseq_db_demo"`, `:graph "demo"`, and `:uuid "asset-uuid"`.

6. Add a test for missing repo and assert `:missing-repo`.

7. Add a test for missing selector and assert an explicit validation error.

8. Add a test for both `--id` and `--uuid` and assert an explicit validation error.

9. If parser-level tests exist in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`, add parse tests for `sync asset download --graph demo --id 123` and `sync asset download --graph demo --uuid asset-uuid`.

10. Run `bb dev:test -v logseq.cli.command.sync-test`.

11. Confirm the new tests fail because the command entry and build-action branch do not exist yet.

## Phase 2. Add the command entry and action builder.

1. Edit `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs`.

2. Add a `sync-asset-download-spec` with `:id` described as the target asset node db/id and `:uuid` described as the target asset block UUID.

3. Coerce `:id` with the same numeric id style used by other CLI id options and coerce `:uuid` as string.

4. Do not add `:e2ee-password` to this command spec.

5. Add `(core/command-entry ["sync" "asset" "download"] :sync-asset-download "Download remote asset" sync-asset-download-spec ...)` to `entries`.

6. Include examples for `logseq sync asset download --graph my-graph --id 123` and `logseq sync asset download --graph my-graph --uuid <asset-uuid>`.

7. Add `:sync-asset-download` to `authenticated-sync-actions` because the worker uses sync auth headers for asset HTTP requests.

8. Add `:sync-asset-download [:http-base]` to `required-sync-config-keys-by-action`.

9. Add `build-sync-asset-download-action` that requires repo and exactly one of id or uuid.

10. Route `:sync-asset-download` inside `build-action`.

11. Edit `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.

12. Add `:sync-asset-download` to the sync command groups in `build-action` and `execute-action` routing.

13. Add validation for missing `--graph`, missing selector, and conflicting `--id` plus `--uuid` in command finalization if the generic action builder error is not enough for parser-level behavior.

14. Run `bb dev:test -v logseq.cli.command.sync-test`.

15. Confirm the parser and action tests now pass while execution tests still fail.

## Phase 3. Add asset entity resolution and local-file preflight tests.

1. Add execution tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` using `p/with-redefs` around `cli-server/ensure-server!`, `transport/invoke`, and filesystem helpers.

2. Stub `transport/invoke` for `:thread-api/pull` or `:thread-api/q` so the command can fetch an asset entity containing `:db/id`, `:block/uuid`, `:block/tags`, `:logseq.property.asset/type`, `:logseq.property.asset/checksum`, `:logseq.property.asset/remote-metadata`, and `:logseq.property.asset/external-url`.

3. Test the missing-local-file case and assert `:thread-api/db-sync-request-asset-download` is called with repo and asset UUID.

4. Test the existing-local-file with matching checksum case and assert `:thread-api/db-sync-request-asset-download` is not called.

5. Test that the matching-checksum case returns structured data with `:download-requested? false`, `:checksum-status :match`, and `:skipped-reason :already-downloaded`.

6. Test the existing-local-file with checksum mismatch case and assert `:thread-api/db-sync-request-asset-download` is called with repo and asset UUID.

7. Test that the checksum-mismatch case returns structured data with `:download-requested? true`, `:checksum-status :mismatch`, and a hint explaining that the local file checksum mismatched and a re-download was requested.

8. Test inactive sync status and assert `:sync-not-started` with a `logseq sync start --graph demo` hint.

9. Test a non-asset selector and assert `:asset-not-found` or `:not-asset`.

10. Test an asset with `:logseq.property.asset/external-url` and assert `:external-asset` because remote sync download should not fetch external URLs.

11. Test an asset without `:logseq.property.asset/remote-metadata` and assert `:asset-not-remote` or `:asset-remote-metadata-not-found`.

12. Run `bb dev:test -v logseq.cli.command.sync-test`.

13. Confirm the execution tests fail before implementation.

## Phase 4. Implement asset entity validation and local-file preflight.

1. Edit `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs`.

2. Add a private asset selector that fetches the fields required for validation and output.

3. Resolve the selected entity by db/id or block UUID through existing worker APIs such as `:thread-api/pull` or `:thread-api/q`.

4. Validate that the entity exists.

5. Validate that it is tagged as `:logseq.class/Asset` or otherwise matches the same asset classification used by `list asset` and `upsert asset`.

6. Validate that `:block/uuid` is present.

7. Validate that `:logseq.property.asset/type` is present and non-blank.

8. Validate that `:logseq.property.asset/checksum` is present and non-blank.

9. Validate that `:logseq.property.asset/remote-metadata` is present.

10. Validate that `:logseq.property.asset/external-url` is blank or nil.

11. Compute the expected file name as `<asset-uuid>.<asset-type>`.

12. Compute the local path internally as `<graphs-dir>/<repo>/assets/<asset-uuid>.<asset-type>` using the same root-dir and repo conventions as `db-worker-node` and `upsert asset`.

13. Check local file existence with Node filesystem APIs before invoking the worker request API.

14. Compute the local file checksum when the file exists.

15. Return an ok skip result when the file exists and the local checksum matches asset metadata.

16. Do not call `:thread-api/db-sync-request-asset-download` in the matching-checksum skip path.

17. Return an ok requested result with a checksum mismatch hint when the file exists and the local checksum mismatches asset metadata.

18. Do not include the internally computed local path in structured output.

19. Keep the worker's internal `platform/asset-stat` check unchanged.

20. Run `bb dev:test -v logseq.cli.command.sync-test`.

21. Confirm entity validation and preflight tests pass.

## Phase 5. Implement sync runtime handling and worker request execution.

1. Reuse `resolve-runtime-config!` so auth is loaded from runtime config or `auth.json`.

2. Reuse `missing-required-sync-config-keys` with `:sync-asset-download` so missing `http-base` returns `:missing-sync-config`.

3. Reuse `cli-server/ensure-server!` for the target repo.

4. Reuse `<sync-worker-runtime!` before any worker sync calls.

5. Check `:thread-api/db-sync-status` before requesting an asset download.

6. Require the status to indicate an active sync client that can service the asset queue.

7. Return `:status :error` with `:code :sync-not-started` when sync is inactive, stopped, missing graph id, or otherwise unable to service the request.

8. Include a hint such as `Run logseq sync start --graph <graph> first.` in the `:sync-not-started` error.

9. Do not auto-start sync from this command.

10. Invoke `transport/invoke` with `:thread-api/db-sync-request-asset-download` and `[repo asset-uuid]` only after local preflight passes or checksum mismatch is detected.

11. Return ok data containing `:asset-id` when available, `:asset-uuid`, `:asset-type`, `:download-requested? true`, and `:checksum-status`.

12. Do not include `:local-path` in returned data.

13. Treat a nil worker result as success because the current worker API returns nil for enqueued work.

14. Return immediately after the worker request call resolves.

15. Do not add polling or waiting for the file to exist.

16. Run `bb dev:test -v logseq.cli.command.sync-test`.

17. Confirm the request execution tests pass.

## Phase 6. Add worker-side regression coverage for local skip behavior.

1. Open or create the appropriate worker sync asset test namespace under `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/`.

2. Prefer a focused namespace for `frontend.worker.sync.assets` if one already exists or if current test setup makes a focused unit test simple.

3. Stub `current-client-f` to return a client map with `:graph-id` and an asset queue promise chain.

4. Stub `worker-state/get-datascript-conn` with a Datascript conn containing one asset entity.

5. Stub `platform/current` so `platform/asset-stat` returns file metadata in the skip test.

6. Stub `download-remote-asset!` and record calls.

7. Assert the skip test records no `download-remote-asset!` call.

8. Add a missing-local-file test where `platform/asset-stat` returns nil.

9. Assert the missing-local-file test records exactly one `download-remote-asset!` call with repo, graph id, asset UUID, and asset type.

10. Run the worker test namespace.

11. Confirm both tests pass.

## Phase 7. Add human and structured output support.

1. Edit `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.

2. Add `:sync-asset-download` to the ok-result command routing.

3. Render the requested case as a concise human message such as `Sync asset download requested: <asset-uuid> (repo: <repo>)`.

4. Render the checksum mismatch requested case with a hint such as `Local asset checksum mismatched; requested re-download: <asset-uuid>`.

5. Render the skipped case as a concise human message such as `Sync asset already downloaded: <asset-uuid>`.

6. Do not print or return the local path.

7. Keep JSON and EDN output as the raw structured `:data` map.

8. Add tests for requested, checksum-mismatch requested, and skipped human output cases.

9. Run the formatter tests.

10. Confirm output tests pass.

## Phase 8. Update CLI docs and examples.

1. Edit `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`.

2. Add `sync asset download --graph <name> --id <asset-db-id>` and `sync asset download --graph <name> --uuid <asset-uuid>` to the sync command list.

3. Document that `--id` is the `ID` returned by `list asset`.

4. Document that `--uuid` is the asset block UUID.

5. Document that the command skips work when `assets/<asset-uuid>.<asset-type>` already exists locally and its checksum matches.

6. Document that checksum mismatch requests a re-download and prints a hint.

7. Document that the command requires sync to already be started and fails with a hint otherwise.

8. Document that the command returns immediately after enqueue and does not support `--e2ee-password`.

9. Edit `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md`.

10. Add the new command to the CLI guide sync command list and explain that it uses the existing worker asset request API.

11. Run any docs checks that the repository normally uses if available.

## Phase 9. Add CLI e2e coverage.

1. Read `/Users/rcmerci/gh-repos/logseq/cli-e2e/AGENTS.md` before editing `cli-e2e` files.

2. Add a sync case in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_cases.edn` that creates or imports a graph with one asset.

3. Upload that graph with `sync upload`.

4. Download the graph into a second root with `sync download`.

5. Start sync in the second root before requesting the asset download.

6. Use `list asset --output json` or `query --output json` in the second root to get the asset db/id, UUID, asset type, and checksum.

7. Remove the local asset file from the second root if snapshot download currently materializes it automatically.

8. Run `sync asset download --graph <graph> --id <asset-db-id> --output json`.

9. Assert the returned JSON has `status ok` and `download-requested? true` when the file was missing.

10. Assert the command output does not include `local-path`.

11. Poll for the expected file under the second root graph `assets/` directory only as e2e verification of the asynchronous request.

12. Run the same command again after the file exists with matching checksum.

13. Assert the returned JSON has `status ok`, `download-requested? false`, `checksum-status match`, and `skipped-reason already-downloaded`.

14. Corrupt the local asset file.

15. Run the same command again.

16. Assert the returned JSON has `status ok`, `download-requested? true`, `checksum-status mismatch`, and a checksum mismatch hint.

17. Add an adjacent case that stops sync or uses an inactive second root and asserts `:sync-not-started` with the start-sync hint.

18. Update `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/sync_inventory.edn` to list `sync asset download`.

19. Run the focused sync e2e case.

20. Confirm the new e2e coverage passes.

## Edge cases

| Case | Expected behavior |
|------|-------------------|
| Missing `--graph` | Fail with `:missing-graph`. |
| Missing both `--id` and `--uuid` | Fail with a clear validation error. |
| Both `--id` and `--uuid` are provided | Fail with `:invalid-options`. |
| `--id` points to no entity | Fail with `:asset-not-found`. |
| `--uuid` points to no entity | Fail with `:asset-not-found`. |
| Selector points to a non-asset entity | Fail with `:not-asset`. |
| Asset has no UUID | Fail with `:asset-uuid-missing`. |
| Asset has no type | Fail with `:asset-type-missing`. |
| Asset has no checksum | Fail with `:asset-checksum-missing`. |
| Asset has no remote metadata | Fail with `:asset-not-remote`. |
| Asset has external URL | Fail with `:external-asset` because sync asset download should not fetch external URLs. |
| Local asset file is missing | Request worker download and return immediately with `:download-requested? true`. |
| Local asset file exists and checksum matches | Return ok with `:download-requested? false` and do not invoke `:thread-api/db-sync-request-asset-download`. |
| Local asset file exists and checksum mismatches | Return ok with `:download-requested? true`, include a mismatch hint, and invoke `:thread-api/db-sync-request-asset-download`. |
| Local assets directory does not exist | Treat the file as missing and let worker create the directory when writing. |
| Missing `http-base` after config defaults are applied | Fail with `:missing-sync-config`. |
| Missing auth | Fail with existing auth resolution error and hint to run `logseq login`. |
| E2EE graph without persisted password | Do not accept `--e2ee-password`; users must run an existing sync command that persists the password before requesting asset download. |
| Sync client is not active | Fail fast with `:sync-not-started` and a hint to run `logseq sync start --graph <graph>`. |
| Worker request returns nil | Treat as ok because the current request API is enqueue-oriented. |
| Worker download fails asynchronously | Preserve worker logging and status reporting, and do not block this command for completion. |

## Non-goals

This plan does not add a new worker thread API.

This plan does not add a bulk asset download command.

This plan does not change the remote asset storage protocol.

This plan does not change snapshot graph download behavior.

This plan does not add `--e2ee-password` to `sync asset download`.

This plan does not make the command wait for the local file write to finish.

This plan does not auto-start sync when the sync client is inactive.

This plan does not return local filesystem paths from command output.

This plan does not add default values to hide invalid graph, auth, or asset state.

## Testing Details

The parser tests verify the public command contract rather than internal command table shape.

The execution tests verify behavior by observing whether the worker request API is called or not called under missing-file, matching-checksum, and mismatched-checksum conditions.

The execution tests verify fail-fast sync-state behavior by asserting an inactive sync status returns `:sync-not-started` and never invokes the worker request API.

The worker tests verify behavior by observing whether `download-remote-asset!` is called or not called after `platform/asset-stat`, rather than only asserting mock return data.

The e2e test verifies real CLI behavior by creating a synced graph, starting sync, requesting one asset download, and polling for the local file system result after the command returns.

The skipped e2e assertion verifies the requirement that already-downloaded assets with matching checksum do not trigger another download.

The checksum mismatch e2e assertion verifies that corrupt local files trigger a new request and show a clear hint.

## Implementation Details

- Add command path `["sync" "asset" "download"]` with action type `:sync-asset-download`.
- Support exactly one of `--id` and `--uuid` as the asset selector.
- Treat `--id` as the asset node Datascript db/id because `list asset` exposes db/id as `ID`.
- Resolve the asset entity before making any worker request.
- Validate asset identity, UUID, type, checksum, remote metadata, and external URL state explicitly.
- Compute the local asset path internally as `assets/<asset-uuid>.<asset-type>` under the graph directory.
- Skip before invoking the worker API when the local file exists and checksum matches.
- Request a re-download when the local file exists and checksum mismatches.
- Reuse `:thread-api/db-sync-request-asset-download` for the actual worker request.
- Fail fast when sync is not active instead of auto-starting sync.
- Return immediately after enqueue and omit local paths from output.

## Question

No open product questions remain for this plan.

Resolved decisions are: return immediately after enqueue, fail fast when sync is inactive, do not support `--e2ee-password`, support both `--id` and `--uuid`, check local file existence plus checksum, request re-download on checksum mismatch with a hint, and omit local paths from output.

---
