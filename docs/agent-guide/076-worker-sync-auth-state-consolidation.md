# 076 — Move db-sync auth fields from `frontend.worker.state/*db-sync-config` to `frontend.worker.state/*state`

Goal: Move all db-sync auth-related runtime fields out of `frontend.worker.state/*db-sync-config` and store them in `frontend.worker.state/*state`.

Goal: Keep `*db-sync-config` focused on transport/runtime config (`ws-url`, `http-base`, and non-auth flags), and keep auth/token lifecycle in one place (`*state`).

Goal: Align auth flow behavior across web app, desktop app, logseq-cli, and db-worker-node.

Architecture: Worker sync modules (`frontend.worker.sync.util`, `frontend.worker.sync.auth`, related sync helpers) should read auth state from `worker-state/*state` only after migration.

Architecture: `:thread-api/sync-app-state` becomes the canonical write path for auth fields; `:thread-api/set-db-sync-config` remains for non-auth sync config.

Related:
- `src/main/frontend/worker/state.cljs`
- `src/main/frontend/worker/db_core.cljs`
- `src/main/frontend/worker/sync/util.cljs`
- `src/main/frontend/worker/sync/auth.cljs`
- `src/main/frontend/persist_db/browser.cljs`
- `src/main/frontend/handler/events/ui.cljs`
- `src/main/frontend/components/repo.cljs`
- `src/main/frontend/handler/events/rtc.cljs`
- `src/main/frontend/handler/db_based/sync.cljs`
- `src/main/logseq/cli/command/sync.cljs`
- `src/main/frontend/worker/db_worker_node.cljs`

## Current implementation snapshot

### Web app

- Worker init (`persist_db/browser.cljs`) currently sends `:thread-api/set-db-sync-config` with:
  - `:ws-url`
  - `:http-base`
  - `:oauth-domain`
  - `:oauth-client-id`
- Auth tokens (`:auth/id-token`, `:auth/access-token`, `:auth/refresh-token`) are synced through `:thread-api/sync-app-state`.

### Desktop app

- Desktop renderer uses remote db-worker-node runtime (`persist_db/remote.cljs` + electron IPC `:db-worker-runtime`).
- It shares the same frontend sync call sites (`events/ui.cljs`, `components/repo.cljs`) that currently push oauth fields through `:thread-api/set-db-sync-config`.
- It also uses `:thread-api/sync-app-state` to sync token state before starting sync flows.

### logseq-cli

- `logseq.cli.command.sync` currently builds worker sync config with `:ws-url`, `:http-base`, and `:auth-token`.
- CLI sends `:thread-api/set-db-sync-config` before sync operations.
- CLI currently uses `:thread-api/get-db-sync-config` to preserve existing worker `:auth-token` for non-authenticated actions (`sync stop`, `sync status`) when runtime config has no token.
- CLI does not currently treat `:thread-api/sync-app-state` as the primary auth write path.

### db-worker-node

- `frontend.worker.db-worker-node/non-repo-methods` already allows both:
  - `:thread-api/set-db-sync-config`
  - `:thread-api/get-db-sync-config`
  - `:thread-api/sync-app-state`
- db-worker-node currently persists whatever auth fields are sent in `set-db-sync-config` because worker stores the full map in `*db-sync-config`.

## Auth field inventory to migrate

Auth-related fields currently coupled to `*db-sync-config`:

- `:auth-token`
- `:oauth-token-url`
- `:oauth-domain`
- `:oauth-client-id`

Non-auth fields that should remain in `*db-sync-config`:

- `:ws-url`
- `:http-base`
- `:enabled?`
- non-auth feature toggles/config flags

## Target state contract

After migration:

- `*db-sync-config` contains only non-auth sync config.
- `*state` contains all sync auth fields, including oauth metadata used for worker-side token refresh.

Proposed worker auth keys in `*state`:

- `:auth/id-token`
- `:auth/access-token`
- `:auth/refresh-token`
- `:auth/oauth-token-url`
- `:auth/oauth-domain`
- `:auth/oauth-client-id`

## Locked decisions

1. `:thread-api/get-db-sync-config` must return non-auth fields only.
2. Implementation must follow phase order in this document (Phase 1 → Phase 5) without reordering.

## Implementation plan

### Phase 1 — Worker state model + compatibility bridge

1. Extend `frontend.worker.state/*state` defaults with oauth auth metadata keys.
2. Add worker helpers to normalize/split auth fields from sync config payloads.
3. Update `frontend.worker.sync.util/auth-token` and `frontend.worker.sync.auth/<refresh-id&access-token` to read auth fields from `*state`.
4. Keep a temporary compatibility bridge in `:thread-api/set-db-sync-config`:
   - If auth keys are present in incoming config, move/merge them into `*state`.
   - Keep only non-auth keys in `*db-sync-config`.
5. Enforce `:thread-api/get-db-sync-config` contract to return non-auth fields only from the beginning of migration.
6. Add/update worker tests for auth resolution and oauth token URL/client ID lookup from `*state`.

### Phase 2 — Web + desktop producer updates

1. Update web/desktop `set-db-sync-config` call sites to stop sending auth-related fields:
   - `src/main/frontend/persist_db/browser.cljs`
   - `src/main/frontend/handler/events/ui.cljs`
   - `src/main/frontend/components/repo.cljs`
2. Ensure oauth metadata is sent through `:thread-api/sync-app-state` payloads (or equivalent state sync path) so worker auth refresh can still resolve oauth endpoints.
3. Update state-sync payload builders:
   - `src/main/frontend/handler/events/rtc.cljs`
   - `src/main/frontend/handler/db_based/sync.cljs`
4. Add/update frontend tests to assert new payload boundaries (`sync-app-state` carries auth metadata; `set-db-sync-config` carries non-auth config only).

### Phase 3 — CLI migration to `sync-app-state` auth writes

1. Remove `:auth-token` from CLI worker sync config payload (`sync-config` function in `logseq.cli.command.sync`).
2. Replace CLI token-preservation logic that depends on `get-db-sync-config` with explicit auth-state sync:
   - Resolve auth via `cli-auth/resolve-auth!` / `resolve-auth-token!`.
   - Send auth into worker via `:thread-api/sync-app-state` as `:auth/*` fields.
3. Keep `sync config set|get|unset` as non-auth config only (`ws-url`, `http-base`).
4. Update CLI tests in `src/test/logseq/cli/command/sync_test.cljs` to validate new invoke sequence (`sync-app-state` + `set-db-sync-config` non-auth payload).

### Phase 4 — db-worker-node API contract alignment

1. Keep method allowlist behavior unchanged (`sync-app-state` remains non-repo method).
2. Update db-worker-node tests that currently assert `auth-token` inside `get-db-sync-config`:
   - move assertions to `sync-app-state` behavior and sync runtime behavior.
3. Ensure repo-mismatch behavior remains unchanged (no auth contract leakage into repo-bound checks).

### Phase 5 — Remove temporary compatibility paths

1. Remove fallback reads from `*db-sync-config` for auth fields once all producers are migrated.
2. Keep `get-db-sync-config` strict: return non-auth fields only.
3. Keep final state model strict:
   - auth only from `*state`
   - transport config only from `*db-sync-config`

## Testing plan

### Targeted tests

- `bb dev:test -v frontend.worker.node-sync-test`
- `bb dev:test -v frontend.worker.sync.crypt-test`
- `bb dev:test -v frontend.worker.db-sync-test`
- `bb dev:test -v frontend.worker.db-worker-node-test`
- `bb dev:test -v frontend.handler.db-based.sync-test`
- `bb dev:test -v frontend.components.repo-test`
- `bb dev:test -v logseq.cli.command.sync-test`

### Final verification

- `bb dev:lint-and-test`

## Edge cases and migration risks

- Running daemon with stale in-memory auth state while CLI switches between commands.
- Mixed-version compatibility (new CLI with old worker, old CLI with new worker) during rollout.
- Worker token refresh requiring oauth metadata after migration; missing oauth fields must produce clear diagnostics.
- Avoid confusion with unrelated db-worker HTTP auth token (`persist_db.node` / `persist_db.remote` transport auth); this plan only changes db-sync cloud auth state inside worker sync logic.

## Acceptance criteria

1. Worker sync auth logic no longer depends on auth fields inside `*db-sync-config`.
2. All auth-related db-sync fields are sourced from `*state`.
3. `set-db-sync-config` payloads from web/desktop/CLI carry only non-auth sync config.
4. CLI sync flows remain functional (start/status/stop/upload/download/remote-graphs/ensure-keys/grant-access).
5. db-worker-node tests and CLI tests pass with updated contracts.
6. No regression in desktop/web db-sync startup and key-management flows.
