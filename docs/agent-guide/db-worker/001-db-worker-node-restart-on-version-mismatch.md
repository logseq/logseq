# db-worker-node Restart on Version Mismatch Plan

Goal: Ensure every `logseq-cli` or Desktop app connection to a `db-worker-node` server uses a server built from the same application revision/version as the requester.

Goal: When a requester discovers a running `db-worker-node` server for the target graph but the server revision/version does not match the requester, stop that server, start a new `db-worker-node` server from the requester's bundled runtime, and connect only after the new server reports the matching revision/version.

Goal: If the requester restarts the server and the replacement still reports a different revision/version, fail fast with a clear error instead of continuing against an incompatible server.

## Problem statement

After installing a new Desktop app while an older `db-worker-node` server is still running, opening the new app can reuse the already running server. The server continues to execute the old bundled `db-worker-node` code, so the Desktop app and worker server can run different code revisions.

Today, users must manually run:

```shell
logseq server cleanup
```

Then they must trigger `db-worker-node` startup again so the server is recreated from the newly installed app or CLI runtime.

This manual cleanup is easy to miss and can lead to subtle mismatches between:

- the Desktop renderer/main process code,
- the `logseq-cli` command code,
- the HTTP/SSE protocol expectations,
- worker API behavior,
- local SQLite/schema/sync assumptions.

## Current implementation snapshot

### Version source

`db-worker-node` exposes build metadata through `frontend.worker.version`:

- File: `src/main/frontend/worker/version.cljs`
- Current public value: `frontend.worker.version/revision`
- The HTTP health payload includes `:revision`.

`logseq-cli` exposes its own build metadata through `logseq.cli.version`:

- File: `src/main/logseq/cli/version.cljs`
- Current public value: `logseq.cli.version/revision`

The current code mostly names this field `revision`, but the desired behavior is a version/revision compatibility check. This plan uses **revision** for concrete code references and **version** for user-facing behavior.

### Server discovery and health

`db-worker-node` publishes runtime health from:

- File: `src/main/frontend/worker/db_worker_node.cljs`
- Function: `health-payload`
- Endpoint: `GET /healthz`

The health payload currently includes:

- `:repo`
- `:status`
- `:host`
- `:port`
- `:pid`
- `:owner-source`
- `:root-dir`
- `:revision`

`logseq.cli.server/discover-servers` reads the root-dir `server-list` file, calls `/healthz` for each alive process, and returns discovered server maps with normalized status and owner source.

Relevant files:

- `src/main/logseq/db_worker/server_list.cljs`
- `src/main/logseq/db_worker/daemon.cljs`
- `src/main/logseq/cli/server.cljs`

### Shared startup path

Both `logseq-cli` and Desktop app use `logseq.cli.server/ensure-server!` as the shared lifecycle entry point.

CLI commands call `ensure-server!` directly from command handlers, for example:

- `src/main/logseq/cli/command/add.cljs`
- `src/main/logseq/cli/command/graph.cljs`
- `src/main/logseq/cli/command/list.cljs`
- `src/main/logseq/cli/command/query.cljs`
- `src/main/logseq/cli/command/search.cljs`
- `src/main/logseq/cli/command/show.cljs`
- `src/main/logseq/cli/command/sync.cljs`
- `src/main/logseq/cli/command/update.cljs`
- `src/main/logseq/cli/command/upsert.cljs`

Desktop app calls the same shared path through Electron IPC:

- Renderer entry: `src/main/frontend/persist_db.cljs`
  - Calls `ipc/ipc "db-worker-runtime" repo` before creating `frontend.persist-db.remote`.
- Main process IPC handler: `src/electron/electron/handler.cljs`
  - Handles `:db-worker-runtime` and calls `electron.db-worker/ensure-runtime!`.
- Main process manager: `src/electron/electron/db_worker.cljs`
  - `start-managed-daemon!` calls `cli-server/ensure-server!` with `{:owner-source :electron}`.

### Existing cleanup behavior

`logseq server cleanup` already stops CLI-owned revision-mismatched servers:

- File: `src/main/logseq/cli/command/server.cljs`
- File: `src/main/logseq/cli/server.cljs`
- Function: `cleanup-revision-mismatched-servers!`

Current cleanup behavior is manual and limited:

- It only runs when explicitly invoked.
- It only kills mismatched servers whose `:owner-source` is `:cli`.
- It skips Electron-owned mismatches.
- Normal `ensure-server!` does not automatically restart a mismatched server before returning a usable `:base-url`.

## Target behavior

When `logseq-cli` or Desktop app attempts to connect to `db-worker-node` for a graph:

1. Discover an existing server for the graph and current root-dir.
2. Read the server revision/version from `/healthz`.
3. Compare it against the requester revision/version.
4. If the revisions match:
   - reuse the server as today.
5. If the revisions do not match:
   - stop the current server,
   - remove stale lock/list state through the existing stop path,
   - start a new `db-worker-node` server from the requester's bundled script,
   - wait for `/healthz` to report ready,
   - compare revision/version again.
6. If the restarted server still reports a different revision/version:
   - fail fast,
   - return/throw a structured error with the expected and actual revisions,
   - do not return a `:base-url` to callers.

## Ownership policy

The new behavior should be applied at connection time, not only in the manual cleanup command.

Required owner policy:

- When the requester proves the running server revision/version differs from the requester's expected revision/version, the requester may stop that mismatched server even if the server has a different `:owner-source`.
- A newer Desktop app may stop a mismatched CLI-owned or `:unknown` server for the same root-dir/graph.
- A newer CLI may stop a mismatched Electron-owned or `:unknown` server for the same root-dir/graph.
- Cross-owner stop is allowed only after a successful `/healthz` response identifies the target as the same root-dir/graph and exposes a mismatched revision/version.
- If revision/version cannot be read from `/healthz`, treat it as mismatch only for the discovered server entry that already maps to the target root-dir/graph; then restart once and verify the replacement.
- If the revisions match, preserve the existing ownership behavior and do not take over another active owner's server unnecessarily.

Rationale:

- Version compatibility is more important than preserving a stale owner boundary after an app or CLI upgrade.
- This removes the need for manual `logseq server cleanup` in mixed Desktop/CLI upgrade flows.
- The safety check is the revision/version mismatch proof from `/healthz`, plus root-dir/graph matching from existing discovery logic.
- Restart remains bounded to one attempt, so a bad package cannot loop-kill servers indefinitely.

## Design

### 1. Add requester revision to `ensure-server!`

Add a helper in `logseq.cli.server` to resolve the expected revision for a requester.

Implementation options:

- Prefer explicit `(:expected-revision config)` when present.
- Otherwise default to `logseq.cli.version/revision`.

`electron.db-worker/start-managed-daemon!` should pass the Desktop app's expected revision explicitly if needed. If Desktop and CLI builds share the same `logseq.cli.version` define in packaged app builds, the default can be enough, but tests should not rely on that implicit coupling.

Recommended concrete change:

- Add `logseq.cli.version` require to `src/main/logseq/cli/server.cljs`.
- Add private helper:
  - `expected-revision`
- Let callers override with `:expected-revision` for tests and future Desktop-specific wiring.

### 2. Centralize revision comparison

Add helpers in `logseq.cli.server`:

- `revision-match?`
- `revision-mismatch?`
- `server-revision-mismatch-error`

Rules:

- Treat missing server revision as mismatch.
- Compare exact string values.
- Do not add fallback compatibility layers.
- Do not silently continue on mismatch.

Error shape recommendation:

```clojure
{:code :server-revision-mismatch
 :message "db-worker-node revision does not match requester revision"
 :repo repo
 :expected-revision expected-revision
 :actual-revision actual-revision
 :owner-source owner-source}
```

If a restart was attempted but the replacement still mismatches, use a distinct code or include `:after-restart? true`:

```clojure
{:code :server-revision-mismatch-after-restart
 :message "db-worker-node revision still does not match after restart"
 :repo repo
 :expected-revision expected-revision
 :actual-revision actual-revision
 :owner-source owner-source}
```

### 3. Restart during `ensure-server!`

Refactor `ensure-server-started!` so the returned server is guaranteed to match the expected revision.

Recommended approach:

1. Keep the existing startup/discovery flow as a lower-level function, for example:
   - `ensure-server-started-once!`
2. Wrap it with a version-enforcing function:
   - `ensure-compatible-server-started!`
3. `ensure-server!`, `start-server!`, and Desktop runtime startup should use the version-enforcing path.

Pseudo-flow:

```clojure
(defn- ensure-compatible-server-started!
  [config repo]
  (p/let [expected (expected-revision config)
          server (ensure-server-started-once! config repo)]
    (if (revision-match? expected (:revision server))
      server
      (p/let [stop-result (stop-version-mismatched-server! config repo server)]
        (when-not (:ok? stop-result)
          (throw (ex-info "db-worker-node revision mismatch and restart failed"
                          {:code :server-revision-mismatch-restart-failed
                           :repo repo
                           :expected-revision expected
                           :actual-revision (:revision server)
                           :owner-source (:owner-source server)
                           :stop-error (:error stop-result)})))
        (p/let [server' (ensure-server-started-once! config repo)]
          (if (revision-match? expected (:revision server'))
            server'
            (throw (ex-info "db-worker-node revision still mismatches after restart"
                            {:code :server-revision-mismatch-after-restart
                             :repo repo
                             :expected-revision expected
                             :actual-revision (:revision server')})))))))
```

Important detail:

- Avoid recursion that can restart indefinitely.
- Restart at most once per connection attempt.
- Preserve existing `profile/time!` stages or add a new stage such as `server.restart-version-mismatch`.

### 4. Make restart path robust

The existing `stop-server!` calls `/v1/shutdown`, waits for the lock to disappear, and falls back to `SIGTERM` if needed.

Keep that stop sequence as the default restart mechanism, but add a mismatch-specific stop path that can bypass owner checks only after revision/version mismatch is proven.

Recommended concrete change:

- Extract the shared stop implementation into a lower-level helper that accepts an explicit `:allow-cross-owner?` or `:expected-target` option.
- Keep public `stop-server!` behavior unchanged for manual commands and matching-version servers.
- Add a private helper such as `stop-version-mismatched-server!` for `ensure-server!` to stop the exact discovered mismatched target, including cross-owner targets.

Acceptance requirements:

- Graceful shutdown first.
- Cross-owner stop is only available from the mismatch-enforcing startup path.
- Cross-owner stop must target the discovered server for the same root-dir/graph, not an arbitrary lock owner.
- Existing lock removed by daemon shutdown when possible.
- Existing stale-lock cleanup still works when the process is already gone.
- Server-list stale entries are cleaned lazily by `discover-servers`.
- If stop fails, do not spawn another server that races with the old one.

### 5. Preserve manual cleanup command

Keep `logseq server cleanup` as a maintenance command.

Update its docs and output only if needed:

- `server cleanup` remains useful for batch cleanup and external repair.
- Normal connection should no longer require users to run it for version mismatch cases.

### 6. Desktop manager behavior

`electron.db-worker/ensure-started!` already restarts unhealthy cached runtimes based on `runtime-ready?`.

The version enforcement should happen inside `cli-server/ensure-server!`, so Desktop can reuse the shared behavior without duplicating revision checks in Electron manager state.

Add tests to ensure:

- `start-managed-daemon!` passes `:owner-source :electron` as today.
- A Desktop request restarts an Electron-owned mismatched server through the shared `ensure-server!` path.
- A cached runtime that is still HTTP-ready but version-mismatched is not returned as usable if `ensure-server!` is invoked for the repo after upgrade.

If cached Desktop manager state can survive app upgrade within the same process, extend `runtime-ready?` to validate revision too. For the install-and-reopen case, the process restarts, so shared startup enforcement should be sufficient.

## Implementation steps

### Step 1: Add expected revision plumbing

Files:

- `src/main/logseq/cli/server.cljs`
- `src/main/logseq/cli/version.cljs` only if a public helper is needed; otherwise no change.
- `src/electron/electron/db_worker.cljs` only if Desktop must pass an explicit revision.

Tasks:

1. Require `logseq.cli.version` in `logseq.cli.server`.
2. Add `expected-revision` helper.
3. Allow `:expected-revision` in config for tests and future explicit Desktop wiring.

### Step 2: Add mismatch detection helpers

File:

- `src/main/logseq/cli/server.cljs`

Tasks:

1. Add exact revision comparison helper.
2. Treat `nil` server revision as mismatch.
3. Add structured `ex-info` builders for mismatch errors.

### Step 3: Refactor startup into one-attempt and enforcing layers

File:

- `src/main/logseq/cli/server.cljs`

Tasks:

1. Rename current private `ensure-server-started!` implementation to `ensure-server-started-once!`.
2. Add new `ensure-server-started!` wrapper that:
   - calls one-attempt startup,
   - checks revision,
   - stops the exact mismatched discovered server, including cross-owner targets,
   - starts once again,
   - checks revision again,
   - throws if mismatch remains.
3. Keep the public `ensure-server!` function unchanged in shape.
4. Ensure `start-server!` reports structured mismatch errors through existing catch logic.
5. Keep public `stop-server!` owner checks unchanged; only the mismatch startup path should use the cross-owner stop helper.

### Step 4: Improve CLI human output for mismatch errors

Files:

- `src/main/logseq/cli/format.cljs`
- Potential command-specific format paths if needed.

Tasks:

1. Add guidance for `:server-revision-mismatch`, `:server-revision-mismatch-restart-failed`, and `:server-revision-mismatch-after-restart`.
2. Make JSON/EDN output include expected/actual revision fields and the stopped server's `:owner-source`.
3. For human output, say that Logseq tried to restart the mismatched server and failed if applicable.

### Step 5: Update docs

Files:

- `docs/cli/logseq-cli.md`
- Potential Desktop/db-worker guide if one exists later.

Tasks:

1. Update server lifecycle notes to say normal connection attempts auto-restart revision-mismatched servers, including cross-owner servers when mismatch is proven.
2. Keep `logseq server cleanup` documented as manual maintenance, not as the required upgrade path.

## Test plan

### Unit tests: shared CLI server lifecycle

File:

- `src/test/logseq/cli/server_test.cljs`

Add tests:

1. `ensure-server-reuses-matching-revision`
   - Existing discovered server has `:revision` equal to expected revision.
   - Assert no stop/restart occurs.
   - Assert returned `:base-url` is reused.

2. `ensure-server-restarts-cli-owned-mismatched-revision`
   - First discovered server has mismatched revision and owner `:cli`.
   - `stop-server!` succeeds.
   - Second discovered server has matching revision.
   - Assert `ensure-server!` returns the replacement server.

3. `ensure-server-restarts-electron-owned-mismatched-revision`
   - Same as above with config `{:owner-source :electron}` and server `:owner-source :electron`.
   - Assert restart is attempted and replacement is returned.

4. `ensure-server-restarts-cross-owner-mismatched-revision`
   - CLI requester sees an Electron-owned mismatched server, or Desktop requester sees a CLI-owned mismatched server.
   - Assert the mismatch-specific stop path is used despite owner mismatch.
   - Assert a matching replacement is started and returned.

5. `ensure-server-preserves-owner-boundary-when-revision-matches`
   - CLI requester sees an Electron-owned server with matching revision.
   - Assert the server is reused only if current behavior allows it, or the existing owner mismatch behavior remains unchanged.
   - Assert no cross-owner stop occurs without a proven mismatch.

6. `ensure-server-fails-when-restarted-server-still-mismatches`
   - First and second server revisions differ from expected revision.
   - Assert error code `:server-revision-mismatch-after-restart`.
   - Assert only one restart attempt.

7. `ensure-server-treats-missing-revision-as-mismatch`
   - First discovered server has `:revision nil`.
   - Assert it follows the restart path.

8. `start-server-reports-revision-mismatch-error-stably`
   - Public `start-server!` returns `{:ok? false :error ...}` with expected/actual revisions.

### Unit tests: Electron manager

File:

- `src/test/electron/db_worker_manager_test.cljs`

Add or adjust tests:

1. Ensure `start-managed-daemon!` still calls `cli-server/ensure-server!` with `:owner-source :electron`.
2. If explicit expected revision is passed from Electron, assert it is included in the config.
3. If `runtime-ready?` is extended to revision-check cached runtimes, add a test that an HTTP-ready but mismatched cached runtime triggers stop/start.

### Unit tests: db-worker-node health payload

File:

- `src/test/frontend/worker/db_worker_node_test.cljs`

Add or verify tests:

1. `/healthz` includes `revision`.
2. `--version` still prints revision and exits without requiring repo/root-dir.

### CLI e2e tests

Area:

- `cli-e2e/`

Add an e2e case if feasible after unit coverage:

1. Start a test `db-worker-node` server whose `/healthz` returns an older revision.
2. Run a CLI command that calls `ensure-server!`.
3. Assert the old server is stopped and the command connects to the restarted server.

If constructing two real revisions is too heavy for e2e, keep this as a focused unit/integration test in `src/test/logseq/cli/server_test.cljs`.

### Manual verification

1. Install/open an old Desktop app and open a DB graph so `db-worker-node` starts.
2. Install/open a new Desktop app without running `logseq server cleanup`.
3. Open the same DB graph.
4. Verify:
   - the old `db-worker-node` process exits,
   - a new `db-worker-node` process starts from the new app bundle,
   - `/healthz` reports the new revision,
   - the graph opens successfully.
5. Repeat with `logseq-cli`:
   - start a server with an older CLI build,
   - run a command with a newer CLI build,
   - verify auto-restart before the command executes.

## Failure behavior

Expected failures should be explicit and actionable.

Examples:

- Mismatched server owned by another active owner:
  - stop it through the mismatch-specific cross-owner path,
  - then start a replacement and verify revision/version again.
- Cross-owner stop timeout:
  - fail with stop error details and do not spawn a replacement.
- Replacement server still reports the wrong revision:
  - fail with `:server-revision-mismatch-after-restart`.
- Missing revision in health response:
  - treat as mismatch and restart once.

## Risks and mitigations

### Risk: Killing a server still in use

Mitigation:

- Allow cross-owner stop only after the requester proves revision/version mismatch for the same root-dir/graph.
- Keep public `stop-server!` owner checks unchanged for manual stop/restart commands.
- Restart at most once and fail fast if the replacement is still incompatible.
- Include expected revision, actual revision, owner source, repo, and root-dir context in errors/logs.

### Risk: Restart loop

Mitigation:

- Restart at most once per connection attempt.
- Fail fast if mismatch remains.

### Risk: Race between stop and start

Mitigation:

- Reuse the `stop-server!` shutdown sequence and lock-removal wait through the mismatch-specific stop helper.
- Do not spawn when stop fails.
- Keep stale-lock cleanup before spawn.

### Risk: Packaged build revision defines diverge

Mitigation:

- Use a single expected revision source in the shared lifecycle code.
- Allow explicit `:expected-revision` override from Electron if the Desktop app uses a more authoritative revision source.
- Add tests that pass explicit expected revisions instead of relying only on compile-time defines.

### Risk: Older server has no `:revision`

Mitigation:

- Treat missing revision as mismatch.
- Restart once.
- If the new server still has no revision, fail fast.

## Acceptance criteria

- `logseq-cli` connection attempts automatically restart `db-worker-node` servers whose `/healthz` revision differs from the local CLI expected revision, including Electron-owned servers when mismatch is proven.
- Desktop app `db-worker-runtime` connection attempts automatically restart `db-worker-node` servers whose `/healthz` revision differs from the Desktop expected revision, including CLI-owned servers when mismatch is proven.
- Manual `logseq server cleanup` is no longer required for the normal app-upgrade path.
- A replacement server must report the expected revision before a `:base-url` is returned.
- If the replacement still mismatches, callers get a structured error and no incompatible server is used.
- Public manual stop/restart commands keep existing owner protections unless they are explicitly changed later.
- Unit tests cover matching reuse, same-owner mismatch restart, cross-owner mismatch restart, missing revision, and mismatch-after-restart failure.
