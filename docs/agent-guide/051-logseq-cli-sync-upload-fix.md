# Logseq CLI Sync Upload Fix Plan

Goal: Fix `logseq sync upload` so a CLI-managed local graph can be uploaded successfully with the current `logseq-cli` + `db-worker-node` architecture, including the first upload of a graph that does not yet have a local `graph-id`.

Architecture: Keep the CLI surface small and move the real fix into the worker-side sync layer so `:thread-api/db-sync-upload-graph` becomes self-sufficient: it should resolve or create the remote graph when needed, persist the resulting graph metadata locally, and then perform snapshot upload.

Architecture: Remove the current error-swallowing behavior in worker upload so failures propagate back through `db-worker-node` and the CLI can report an actual error instead of a false success.

Tech Stack: ClojureScript, `logseq-cli`, `db-worker-node`, `frontend.worker.sync`, db-sync HTTP endpoints, promesa, babashka test runner.

Related: Builds on `docs/agent-guide/047-logseq-cli-sync-command.md`.

Related: Relates to `docs/cli/logseq-cli.md` and `docs/developers/desktop-db-worker-node.md`.

## Problem statement

With the current implementation, `logseq sync upload --graph <name>` is wired only as:

- CLI `sync upload`
- `logseq.cli.command.sync/execute`
- `:thread-api/db-sync-upload-graph`
- `frontend.worker.sync/upload-graph!`

That path assumes the local graph already has a usable remote `graph-id`.

However, `frontend.worker.sync/upload-graph!` currently fails when either `http-base` or `graph-id` is missing:

- `http-base` comes from CLI sync config and is present in the provided `cli.edn`.
- `graph-id` is read from local graph metadata via `get-graph-id`.
- For a fresh local graph that has never been uploaded or downloaded before, `graph-id` is typically missing.

The desktop/UI flow does not have this problem because `frontend.handler.db_based.sync/<rtc-upload-graph!` first calls `<rtc-create-graph!`, persists the returned graph id locally, and only then invokes `:thread-api/db-sync-upload-graph`.

The CLI flow does not perform that preflight step, so first-time upload cannot work reliably.

There is a second bug that makes the failure harder to see: `frontend.worker.sync/upload-graph!` currently catches errors and only logs them with `js/console.error`, which can turn a failed upload into a misleading success result from the CLI perspective.

In practice, with a `cli.edn` that already provides `ws-url`, `http-base`, `auth-token`, and `e2ee-password`, upload can still fail because the missing piece is remote graph bootstrap and proper error propagation, not just config.

## Current implementation findings

### 1. CLI upload path is too thin for first-time upload

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs`

`execute` for `:sync-upload` currently does only one repo-scoped invoke:

- `:thread-api/set-db-sync-config`
- `:thread-api/db-sync-upload-graph`

There is no CLI-side or worker-side step that ensures the remote graph exists before upload starts.

### 2. Worker upload requires an existing local graph id

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs`

`upload-graph!` currently derives:

- `base` from `http-base-url`
- `graph-id` from `get-graph-id`

If either value is missing, it rejects with `ex-info "db-sync missing upload info"`.

This is correct as a low-level invariant, but it means the higher-level upload orchestration is incomplete.

### 3. Desktop flow already has the missing bootstrap logic

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/db_based/sync.cljs`

`<rtc-upload-graph!` does:

1. `<rtc-create-graph!`
2. persist returned graph metadata locally
3. call `:thread-api/db-sync-upload-graph`
4. refresh remote graphs / start sync

So the product already has a working conceptual flow, but the CLI path bypasses the graph-creation step.

### 4. Upload errors are swallowed

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs`

`upload-graph!` ends with a broad `p/catch` that only does `js/console.error`.

That means transport and CLI layers cannot reliably distinguish success from failure.

### 5. Test coverage misses the real failing case

Current CLI tests mostly verify transport wiring, for example that `sync upload` invokes `:thread-api/db-sync-upload-graph`.

What is missing is an end-to-end behavior test for:

- local graph without graph id
- configured `http-base` + `auth-token`
- worker creating or resolving a remote graph
- successful upload
- failure surfacing when remote bootstrap or snapshot upload fails

## Root cause summary

The broken behavior is not primarily a config parsing problem.

The actual root causes are:

1. `sync upload` assumes local sync metadata already exists, but first-time CLI upload has no step to create or resolve a remote graph.
2. Worker upload swallows errors, so CLI output can be misleading.
3. Desktop and CLI implement different upload orchestration paths, which caused the CLI path to miss required bootstrap logic.
4. There is no regression test covering first-time upload from a local-only graph.

## Desired behavior

Given a CLI config containing valid sync credentials and endpoints, `logseq sync upload --graph <name>` should:

1. start or reuse the graph's `db-worker-node`
2. apply sync config to the worker
3. detect whether the local graph already has a remote `graph-id`
4. if missing, resolve or create the remote graph
5. persist the resolved/created graph id and sync metadata locally
6. upload the graph snapshot
7. return a real success result only when upload actually succeeds
8. return a real error with context when any step fails

This should work both for:

- an already-linked graph that has a local `graph-id`
- a fresh local graph being uploaded for the first time

## Recommended design

### Option A: Fix inside worker upload orchestration

Preferred approach: make `frontend.worker.sync/upload-graph!` capable of ensuring remote graph identity before snapshot upload.

This keeps the CLI simple and makes `:thread-api/db-sync-upload-graph` a complete unit of behavior.

Suggested worker-side flow:

1. Read local `graph-id`.
2. If present, continue with existing upload logic.
3. If absent, list remote graphs visible to the current auth context.
4. Match by canonical graph name.
5. If a matching remote graph exists, bind local graph to that `graph-id`.
6. If no matching remote graph exists, create one with the current graph name and schema version.
7. Persist returned graph metadata locally.
8. Continue snapshot upload using the resolved `graph-id`.

This mirrors the desktop behavior conceptually while avoiding duplicated orchestration in CLI code.

### Option B: Add CLI-specific preflight before invoking upload

Alternative approach: keep worker upload low-level and add a new CLI-side preflight that creates or resolves the remote graph before invoking `:thread-api/db-sync-upload-graph`.

I do not recommend this because it duplicates sync orchestration across CLI and desktop-adjacent code and makes the worker thread API less useful as a stable contract.

## Scope

### In scope

- Fix first-time `sync upload` for CLI-managed graphs.
- Make worker upload propagate failures.
- Reuse existing remote graph APIs (`GET /graphs`, `POST /graphs`) instead of inventing a new cloud protocol.
- Add tests for first-time upload, already-linked upload, and failure propagation.
- Update CLI docs so `sync upload` behavior is explicit.

### Out of scope

- Changing the cloud snapshot upload protocol.
- Adding a new top-level CLI command for graph creation.
- Reworking websocket sync start/stop behavior.
- Large refactors unrelated to upload bootstrap.

## Implementation plan

### Phase 1. Add failing tests for the broken behavior

1. Add a worker sync test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` for first-time upload when local graph has no graph id.
2. Stub remote graph listing to return no match, stub graph creation to return a new id, and assert upload continues with that id.
3. Add a companion test where remote graph listing already contains the same graph name and assert upload reuses the existing graph id instead of creating a duplicate graph.
4. Add a failure test that simulates graph creation failure and asserts the promise rejects rather than resolving silently.
5. Add a failure test that simulates snapshot upload failure and asserts the CLI-visible result is an error, not success.
6. Add a CLI command execution/integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` or CLI integration tests that covers the real first-upload path, not just method wiring.

### Phase 2. Move remote graph bootstrap into worker sync code

7. Add a worker helper in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` to ensure a usable remote graph id before snapshot upload.
8. That helper should read the local graph name from repo name using the same canonicalization rules already used by CLI and desktop sync.
9. If local graph id exists, return it immediately.
10. If local graph id is missing, call existing remote graph list API.
11. If a graph with the same canonical name exists, reuse its `graph-id` and persist it locally.
12. If no match exists, call the existing graph creation API and persist the new `graph-id` locally.
13. Keep local metadata writes inside worker code so later sync commands (`sync start`, asset upload, etc.) see a consistent graph identity.

### Phase 3. Reuse or extract desktop graph-creation logic

14. Avoid leaving two divergent graph-creation implementations.
15. Extract the parts of `frontend.handler.db_based.sync/<rtc-create-graph!` that are transport/persistence logic into worker-shared code, or reimplement them once in `frontend.worker.sync` and have desktop code reuse that worker-oriented path where practical.
16. Keep UI-only behaviors such as notifications and state refresh in the frontend handler layer.
17. Ensure the shared implementation supports `graph-e2ee?` and schema version consistently.

### Phase 4. Fix error propagation

18. Remove the broad catch-and-only-log behavior at the end of `frontend.worker.sync/upload-graph!`.
19. If local logging is still desired, log and rethrow, or convert to a structured `ex-info` with context.
20. Ensure `db-worker-node` HTTP invoke returns a failure status when upload bootstrap or upload body transfer fails.
21. Verify CLI output paths show the actual error code/message.

### Phase 5. Clarify E2EE behavior for first-time upload

22. Decide what `graph-e2ee?` should be when a local graph has no sync metadata yet.
23. Prefer to match the current desktop default for fresh cloud graph creation, which treats missing value as encrypted unless explicitly false.
24. Make that default explicit in code and tests instead of relying on incidental `nil` handling.
25. Ensure the provided `e2ee-password` config is actually used when a new encrypted remote graph is created.
26. Add at least one test covering fresh upload with encrypted-graph setup.

### Phase 6. Update docs and command expectations

27. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` so `sync upload` explicitly documents first-time upload behavior.
28. Document that upload will resolve an existing same-name remote graph or create a new remote graph when no graph id is present locally.
29. Document the failure modes clearly: auth failure, graph creation failure, snapshot upload failure, and local DB missing.
30. Do not include real tokens or passwords in docs or tests.

## Detailed design notes

### Remote graph resolution rules

For first-time upload, use the local graph name after stripping the internal db prefix in the same way current sync code already does for remote graph matching.

Recommended resolution order:

1. local `graph-id`
2. exact remote graph name match
3. create remote graph

If graph name matching can return more than one candidate, fail with a deterministic conflict error instead of guessing.

### Metadata persistence

After graph resolution/creation succeeds, persist at least:

- `:logseq.kv/graph-uuid`
- `:logseq.kv/graph-remote?`
- `:logseq.kv/graph-rtc-e2ee?`

This ensures later commands such as `sync start`, asset operations, and subsequent uploads operate on the same graph identity.

### Error model

Do not return success when worker upload has failed.

Prefer structured `ex-info` errors with enough context for CLI formatting, such as:

- `:repo`
- `:graph-id`
- `:graph-name`
- `:status`
- `:url`
- remote response body when safe

### Why the fix belongs in worker sync

`db-sync-upload-graph` is already the contract used by CLI.

If the worker API stays incomplete and CLI grows its own upload bootstrap logic, we will keep drifting away from the desktop path and make sync semantics harder to maintain.

Putting graph bootstrap in worker sync makes the behavior available to every caller and keeps the CLI transport layer thin.

## Verification plan

### Targeted automated verification

- `bb dev:test -v frontend.worker.db-sync-test`
- `bb dev:test -v logseq.cli.command.sync-test`
- `bb dev:test -v logseq.cli.integration-test`

### Manual verification with CLI config

Use a `cli.edn` with these keys configured:

- `:ws-url`
- `:http-base`
- `:auth-token`
- `:e2ee-password`

Do not commit real token values.

Manual checks:

1. Create a brand-new local graph with no stored `graph-id`.
2. Run `logseq sync upload --graph <name>`.
3. Confirm the command returns success only after remote graph bootstrap + snapshot upload finish.
4. Run `logseq sync status --graph <name>` and confirm the graph now has stable remote metadata.
5. Re-run `logseq sync upload --graph <name>` and confirm it reuses the existing graph id.
6. Force a failing auth token and confirm the CLI returns an error instead of false success.
7. Force a server-side snapshot upload failure and confirm the CLI returns an error with useful context.

## Acceptance criteria

The fix is complete when all of the following are true:

- `logseq sync upload --graph <name>` works for a fresh local graph with no prior `graph-id`.
- The command reuses an existing same-name remote graph when appropriate.
- Worker upload failures propagate to CLI callers and no longer appear as success.
- Desktop and CLI upload bootstrap logic no longer diverge in a risky way.
- Test coverage includes first-time upload and failure propagation.
- CLI docs describe first-time upload behavior and required config without exposing secrets.

## Risks and mitigations

### Risk: duplicate remote graphs

If upload always creates a graph when local `graph-id` is missing, we may create duplicates.

Mitigation: list remote graphs first and only create when there is no exact name match.

### Risk: inconsistent E2EE defaults

Fresh graph creation from CLI may accidentally create an unencrypted graph while desktop defaults to encrypted.

Mitigation: make fresh-upload `graph-e2ee?` behavior explicit and test it.

### Risk: hidden regressions in desktop flow

If desktop and worker share more code, UI expectations could shift.

Mitigation: keep only transport/bootstrap logic shared; keep UI state refresh and notifications in frontend handler code.

## Suggested file touch list

Primary implementation files:

- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/db_based/sync.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs`

Primary test files:

- `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`

Primary docs:

- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`

## Question

No open question. The current implementation gap is clear enough to proceed with a worker-centered fix.
