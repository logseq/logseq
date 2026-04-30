# Sync E2EE Password Persistence Implementation Plan

Goal: Persist and consume sync E2EE passwords only as refresh-token-encrypted data across CLI, desktop app, web app, and db-worker-node.

Architecture: Keep password encryption and verification logic in `frontend.worker.sync.crypt` as the single source of truth.

Architecture: Use runtime-specific persistence behind worker platform boundaries, with IndexedDB-backed secret storage on browser runtime and `<data-dir>/e2ee-password` file storage on node runtime.

Architecture: Route CLI `sync start --e2ee-password` and `sync download --e2ee-password`, plus desktop UI password input, through the same worker-side validation and persistence flow.

Tech Stack: ClojureScript, Promesa, db-worker platform adapters, babashka.cli command parsing, Electron renderer-to-worker UI request protocol.

Related: Builds on `docs/agent-guide/047-logseq-cli-sync-command.md`, `docs/agent-guide/055-logseq-cli-login-logout.md`, and `docs/agent-guide/074-db-worker-node-invoke-main-thread-refactor.md`.

## Problem statement

Current behavior is inconsistent across runtimes and command paths.

`frontend.worker.sync.crypt/<save-e2ee-password` encrypts password text by `refresh-token`, but password sourcing and persistence locations differ by flow.

CLI still accepts and persists plain `:e2ee-password` in `cli.edn`, which conflicts with secure persistence requirements.

Browser runtime currently persists non-native password file via OPFS (`e2ee-password`) instead of IndexedDB.

CLI headless fallback currently includes config password and can return `:ui-interaction-required` rather than a direct `e2ee-password not found` outcome.

Desktop interactive flow can decrypt via UI path, but the verify-and-persist behavior is not defined as an explicit shared worker API reused by CLI.

The table below summarizes current state and required change.

| Area | Current state | Required state |
| --- | --- | --- |
| CLI config | `sync config set|get|unset` accepts `e2ee-password` and stores in `cli.edn`. | Deprecate `:e2ee-password` in `cli.edn` and stop using config as password source. |
| Password crypto key | Worker encrypt/decrypt helpers already accept `refresh-token`, but CLI fallback still depends on config and auth-token candidates. | Use refresh-token as the only password crypto key source for persisted password. |
| Browser persistence | Non-native flow reads/writes OPFS file `e2ee-password`. | Store encrypted password in IndexedDB. |
| Node persistence | Non-native flow reads/writes `<data-dir>/e2ee-password`. | Keep `<data-dir>/e2ee-password` as canonical node location. |
| CLI UX | `sync start/status` does not provide a dedicated missing-password UX contract. | If password is unavailable, `sync start/status` should report `e2ee-password` not found with actionable hint. |
| CLI input path | No `sync start --e2ee-password` or `sync download --e2ee-password` option. | Add `--e2ee-password` to `sync start` and `sync download`, verify it, encrypt it, then persist it. |
| Desktop UI reuse | UI decrypt path exists, but shared CLI-equivalent verify/persist contract is not explicit. | Desktop missing-password interaction should call the same worker verify-and-persist flow as CLI. |

## Target architecture

```text
CLI / Desktop UI / Web runtime
        |
        | password input (optional)
        v
frontend.worker.sync.crypt
  - verify password against user encrypted private key
  - encrypt/decrypt persisted password with refresh-token
  - return typed missing-password errors
        |
        +--> Browser runtime: IndexedDB secret slot
        |
        +--> Node runtime: <data-dir>/e2ee-password
```

## Testing Plan

I will add worker unit tests in `src/test/frontend/worker/sync/crypt_test.cljs` for runtime-specific storage routing, refresh-token-only encryption key usage, and typed missing-password behavior in CLI-headless mode.

I will add CLI command tests in `src/test/logseq/cli/command/sync_test.cljs` for `sync start --e2ee-password`, `sync download --e2ee-password`, deprecation of config key handling, and missing-password reporting in `sync start/sync download/sync status` paths.

I will add CLI config tests in `src/test/logseq/cli/integration_test.cljs` and `src/test/logseq/cli/format_test.cljs` to verify `:e2ee-password` is no longer treated as file config and to verify updated user-facing output.

I will add desktop UI request tests in `src/test/frontend/handler/db_based/sync_test.cljs` or nearby handler tests to verify missing-password UI roundtrip invokes the shared worker verify-and-persist API instead of bespoke flow-only logic.

I will run targeted tests first, then run `bb dev:lint-and-test` for final validation.

NOTE: I will write all tests before I add any implementation behavior.

## Implementation plan

### Phase 1. Define shared worker password vault behavior.

1. Add failing tests in `src/test/frontend/worker/sync/crypt_test.cljs` that describe a new shared worker API for verify-and-persist password.

2. Add failing tests that enforce refresh-token-only persisted password decrypt path in headless mode and reject config-only fallback.

3. Implement a single worker helper in `src/main/frontend/worker/sync/crypt.cljs` that verifies a candidate password by decrypting user encrypted private key and then persists encrypted password payload.

4. Expose the helper through a thread API that can be invoked by both CLI and desktop flows.

5. Remove `:e2ee-password` config candidate usage from `crypt.cljs` headless candidate logic.

6. Ensure CLI-headless path does not mask missing-password with `:ui-interaction-required` when no interactive channel exists.

7. Add typed error payload and hint contract for missing persisted password.

8. Run worker crypt tests and confirm failing cases are now passing.

### Phase 2. Enforce browser and node persistence locations.

1. Add failing tests for browser runtime persistence using IndexedDB secret storage rather than OPFS file route.

2. Add failing tests for node runtime persistence at `<data-dir>/e2ee-password`.

3. Update `src/main/frontend/worker/sync/crypt.cljs` storage branching to select persistence backend by runtime (`:browser` vs `:node`) rather than legacy native URL heuristics for this password feature.

4. Keep node runtime read/write via `platform/read-text!` and `platform/write-text!` with path `e2ee-password`.

5. Keep browser runtime read/write via `platform/read-secret-text` and `platform/save-secret-text!` so storage lands in IndexedDB-backed kv store.

6. Add migration fallback in browser path to read legacy OPFS `e2ee-password` once, then re-save to IndexedDB, then remove legacy file.

7. Add clear/delete behavior that correctly removes persisted password from both runtime backends.

8. Run `frontend.worker.sync.crypt-test` to verify storage routing and migration behavior.

### Phase 3. Deprecate `cli.edn` `:e2ee-password`.

1. Add failing CLI tests in `src/test/logseq/cli/command/sync_test.cljs` that reject `sync config set|get|unset e2ee-password`.

2. Add failing config tests in `src/test/logseq/cli/integration_test.cljs` showing `:e2ee-password` in old `cli.edn` is ignored and sanitized out without any deprecation warning.

3. Remove `e2ee-password` from `config-key-map` and sync config command examples in `src/main/logseq/cli/command/sync.cljs`.

4. Remove `:e2ee-password` from `sync-config` payload generated by CLI for worker runtime config.

5. Add `:e2ee-password` into `removed-config-keys` in `src/main/logseq/cli/config.cljs` so persisted file config is automatically sanitized.

6. Update `src/main/logseq/cli/format.cljs` and `src/test/logseq/cli/format_test.cljs` for changed sync-config output expectations.

7. Run sync command and format tests to verify deprecation behavior.

### Phase 4. Add CLI `--e2ee-password` on `sync start` and `sync download`, and enforce missing-password errors.

1. Add failing parse/build-action tests in `src/test/logseq/cli/command/sync_test.cljs` for `--e2ee-password` on both `sync start` and `sync download`.

2. Add failing execute tests that both commands invoke worker verify-and-persist before start or download work begins.

3. Add CLI auth helper test coverage in `src/test/logseq/cli/integration_test.cljs` for resolving refresh-token from `auth.json` in runtime command execution path.

4. Extend `src/main/logseq/cli/command/sync.cljs` command spec to include `--e2ee-password` for `sync start` and `sync download`.

5. Add CLI-side runtime auth context helper usage so both flows have id-token and refresh-token available at execution time.

6. When option is provided, call worker shared verify-and-persist API and fail fast on invalid password.

7. In `sync start` and `sync download` execution paths, plus `sync status` reporting path, map missing-password diagnostics to explicit `e2ee-password not found` errors with actionable hint text.

8. Ensure `sync status` returns error status and non-zero exit code when e2ee password is required but missing.

9. Keep machine-readable error code stable for automation.

10. Run sync command tests and relevant integration tests.

### Phase 5. Reuse CLI flow from desktop missing-password interaction.

1. Add failing UI request tests for missing persisted password path in desktop interactive runtime.

2. In `src/main/frontend/worker/sync/crypt.cljs`, route interactive fallback to request password input, then call the same shared verify-and-persist helper used by CLI.

3. Update `src/main/frontend/worker/ui_request.cljs` and `src/main/frontend/handler/worker.cljs` action contract so UI request returns password input and worker does verification/decryption centrally.

4. Update desktop password modal flow in `src/main/frontend/handler/events/rtc.cljs` and `src/main/frontend/components/e2ee.cljs` only as needed to collect password and forward it to worker.

5. Remove duplicate validation logic from UI-side code paths after worker shared flow is active.

6. Run frontend handler/component tests and existing e2ee-related tests.

### Phase 6. Documentation and acceptance.

1. Update `docs/cli/logseq-cli.md` to remove `sync config ... e2ee-password` references.

2. Document `sync start --e2ee-password` and `sync download --e2ee-password` usage, plus missing-password troubleshooting for `sync start/sync download/sync status`.

3. Document persistence locations explicitly.

4. Browser runtime stores encrypted password in IndexedDB.

5. Node runtime stores encrypted password at `<data-dir>/e2ee-password`.

6. Add migration note for users with legacy `cli.edn :e2ee-password` and legacy browser OPFS password file.

7. Run a final lint and test pass.

8. Confirm no docs still recommend `cli.edn :e2ee-password`.

## Edge cases to cover

Expired id-token with valid refresh-token in CLI should still allow password verification and persistence after auth refresh.

Missing refresh-token in `auth.json` should produce a login-required error before any password persistence attempt.

Wrong `--e2ee-password` should fail verification without overwriting previously stored encrypted password.

Node file exists but is corrupted transit payload should return typed missing/invalid-password diagnostics and preserve existing UX hints.

Browser migration should handle missing legacy OPFS file without error noise.

Desktop interactive flow cancellation should not persist empty password and should keep prior stored password untouched.

Multiple `sync start` invocations should avoid race conditions that overwrite password storage with stale data.

## Verification commands

Run targeted worker tests.

`bb dev:test -v frontend.worker.sync.crypt-test`

Run targeted CLI sync tests.

`bb dev:test -v logseq.cli.command.sync-test`

Run CLI format tests.

`bb dev:test -v logseq.cli.format-test`

Run CLI integration tests around sync/auth/config behavior.

`bb dev:test -v logseq.cli.integration-test`

Run full lint and test suite before merge.

`bb dev:lint-and-test`

## Testing Details

The key behavior assertions are that password persistence is always encrypted with refresh-token, storage backend is runtime-correct, and user-facing CLI/desktop UX is deterministic when password is missing or invalid.

Tests will validate command outcomes and worker behavior contracts instead of only checking internal data structures.

## Implementation Details

- Introduce one shared worker API for verify-and-persist E2EE password and reuse it from CLI and desktop.
- Remove `:e2ee-password` from CLI file config lifecycle and sync config subcommands.
- Keep refresh-token as the sole crypto key for persisted password encryption and decryption.
- Move browser persistence to IndexedDB secret storage and keep node persistence at `<data-dir>/e2ee-password`.
- Add legacy migration read path from browser OPFS password file to IndexedDB.
- Add explicit missing-password diagnostics for CLI `sync start/sync download/sync status`, with `sync status` returning error when password is required but missing.
- Add `sync start --e2ee-password` and `sync download --e2ee-password` options with verification-before-persist semantics.
- Keep `:e2ee-password` deprecation behavior as silent ignore with no compatibility warning.
- Preserve machine-readable error codes and CLI structured output compatibility.
- Update user docs and troubleshooting guidance to match deprecation and new option flow.

## Question

No open questions.

Decisions locked.

Add `--e2ee-password` to `sync start` and `sync download` only.

Ignore `cli.edn :e2ee-password` silently with no compatibility path.

Return error for missing password in `sync status`.

---
