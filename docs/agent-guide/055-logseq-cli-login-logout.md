# Logseq CLI Login and Logout Implementation Plan

Goal: Add `logseq login` and `logseq logout`, persist Cognito auth in `/Users/rcmerci/logseq/auth.json`, and remove `:auth-token` persistence from `/Users/rcmerci/logseq/cli.edn`.

Architecture: The CLI will get a dedicated auth module that owns loopback OAuth login, token persistence, token refresh, and logout file cleanup.
Architecture: Sync commands will continue to pass `:auth-token` to db-sync at runtime, but that token will be resolved from `auth.json` instead of being edited through `sync config set|get|unset`.
Architecture: The flow will reuse existing Cognito constants and token refresh semantics from the frontend user code, while following the ECA browser plus localhost callback pattern for headless login.

Tech Stack: ClojureScript, babashka.cli, Node.js HTTP server APIs, Cognito Hosted UI OAuth, Promesa, JSON file persistence.

Related: Builds on `docs/agent-guide/047-logseq-cli-sync-command.md`, `docs/agent-guide/048-sync-download-start-reliability.md`, `docs/agent-guide/051-logseq-cli-sync-upload-fix.md`, and `docs/agent-guide/033-desktop-db-worker-node-backend.md`.

## Problem statement

The current CLI expects headless sync authentication to be provided as `:auth-token` inside `/Users/rcmerci/logseq/cli.edn`.

That approach is awkward for users, leaks auth concerns into general CLI config, and does not provide a first-class login or logout flow.

The current sync code path in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` still reads `:auth-token` directly from resolved config and writes it through `sync config set|get|unset`.

The db-sync worker then consumes that runtime token through `worker-state/*db-sync-config` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs`.

Logseq user management already uses AWS Cognito in the frontend app, with Cognito constants in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/config.cljs` and refresh-token logic in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/user.cljs`.

The ECA repository shows the closest CLI-friendly reference implementation for this feature, because it opens a browser, listens on localhost for the callback, exchanges the authorization code for tokens, and persists auth state locally.

This plan keeps the existing db-sync runtime contract stable by continuing to inject `:auth-token` into the worker config map, while changing only how the CLI obtains and persists that token.

I will use @planning-documents for naming, @writing-plans for task granularity, @test-driven-development for implementation order, and the current `logseq-cli` plus `db-worker-node` implementation as the baseline architecture.

## Testing Plan

I will add unit tests for auth file path resolution, JSON persistence, token refresh, and auth file deletion before adding implementation behavior.

I will add command parser tests for the new `login` and `logout` commands before wiring them into the CLI.

I will add execution tests for `login` and `logout` that verify browser launch, callback handling, Cognito token exchange, auth file writes, and logout cleanup.

I will add sync command regression tests that fail first and verify `sync config set|get|unset` no longer accept `auth-token`.

I will add config resolution tests that fail first and verify `resolve-config` no longer loads or persists `:auth-token` from `cli.edn`, while a new auth resolver loads the effective token from `auth.json`.

I will add worker-facing tests that fail first and verify CLI sync runtime still injects an `:auth-token` into `worker-state/*db-sync-config` when `auth.json` exists.

I will add integration tests that fail first and cover `login`, `logout`, and one authenticated sync command using a stubbed Cognito token exchange.

I will run targeted tests after each slice, and I will finish with `bb dev:lint-and-test`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Proposed CLI surface

| Command | Purpose | Persistence effect | Notes |
|---|---|---|---|
| `logseq login` | Authenticate the current machine against Logseq cloud. | Creates or updates `/Users/rcmerci/logseq/auth.json`. | Opens browser and completes a localhost callback flow. |
| `logseq logout` | Remove locally persisted cloud auth for the CLI. | Deletes or clears `/Users/rcmerci/logseq/auth.json`. | Idempotent when the file does not exist. |
| `logseq sync config set ws-url|http-base|e2ee-password <value>` | Persist non-auth sync config. | Updates `/Users/rcmerci/logseq/cli.edn`. | `auth-token` is removed from this command. |
| `logseq sync config get ws-url|http-base|e2ee-password` | Read non-auth sync config. | Reads `/Users/rcmerci/logseq/cli.edn`. | `auth-token` is removed from this command. |
| `logseq sync config unset ws-url|http-base|e2ee-password` | Remove non-auth sync config. | Updates `/Users/rcmerci/logseq/cli.edn`. | `auth-token` is removed from this command. |

The runtime db-sync config map will still contain `:auth-token` when the CLI invokes worker methods.

Only the persistence source changes from `cli.edn` to `auth.json`.

## Auth file design

The new auth file will live at `/Users/rcmerci/logseq/auth.json` by default.

The implementation should expose an internal override path for tests, but it should not add a new public CLI flag unless later required.

The file format should be JSON rather than EDN so it is easy to inspect and delete manually.

The file should contain enough information to refresh expired tokens without asking the user to log in again.

A good starting shape is the following.

```json
{
  "provider": "cognito",
  "id-token": "<jwt>",
  "access-token": "<jwt>",
  "refresh-token": "<opaque>",
  "expires-at": 1735689600000,
  "sub": "<user-uuid>",
  "email": "<user-email>",
  "updated-at": 1735686000000
}
```

`id-token` should remain the value injected into db-sync as runtime `:auth-token`, because current CLI and worker behavior already assumes the sync token is the same value as `state/get-auth-id-token` on desktop.

`refresh-token` is required so the CLI can refresh auth non-interactively before sync commands.

`access-token` can be stored for parity with the existing frontend token model, even if the first CLI release does not consume it directly.

The file should be written with restrictive permissions on Unix when feasible, and tests should verify the implementation does not fail on platforms where chmod semantics differ.

## OAuth flow design

The login flow should follow the ECA pattern more than the current browser app pattern.

The CLI should start a temporary localhost callback server, generate a PKCE verifier and challenge, build a Cognito Hosted UI authorization URL, and then open the browser.

The callback should validate `state`, read the authorization `code`, exchange it against Cognito `/oauth2/token`, persist the resulting tokens, and print a concise success result.

A suggested flow is shown below.

```text
logseq login
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/auth.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/auth.cljs
  -> start localhost callback server on an ephemeral port
  -> build Cognito authorize URL with PKCE and redirect_uri http://127.0.0.1:<port>/auth/callback
  -> open browser with system launcher, or print URL fallback
  -> receive code on callback server
  -> POST code exchange to https://<oauth-domain>/oauth2/token
  -> persist /Users/rcmerci/logseq/auth.json
  -> future sync commands refresh token if needed and inject runtime :auth-token
```

The callback server should prefer an ephemeral port rather than a fixed port, because that avoids collisions during local development and test runs.

The login result should include non-sensitive metadata such as email, subject, auth file path, and whether the token was freshly created or refreshed.

The CLI should not print raw tokens in human output.

## Refresh and runtime token resolution

The current worker code does not refresh tokens in CLI-owned node mode.

`frontend.worker.sync/<resolve-ws-token` explicitly skips refresh when `:owner-source` is `:cli`.

That means the new CLI auth module must resolve a fresh usable token before invoking sync commands.

The auth module should expose one helper that loads `auth.json`, checks `id-token` expiry, refreshes via the Cognito refresh-token grant when needed, persists the updated file, and returns the effective runtime `id-token`.

The refresh HTTP request should mirror the existing app logic in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/user.cljs`, which already posts to `https://<oauth-domain>/oauth2/token` using `grant_type=refresh_token` and `client_id`.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` should stop reading `:auth-token` from resolved config and instead call the new auth helper when building the sync runtime config sent through `:thread-api/set-db-sync-config`.

If no valid auth file exists, authenticated sync commands should return a dedicated error with a hint such as `Run logseq login first.`.

## Implementation plan

### Phase 1. Add failing tests for auth file helpers.

1. Create `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/auth_test.cljs`.
2. Add a failing test that the default auth path resolves to `/Users/rcmerci/logseq/auth.json`.
3. Add a failing test that writing auth data creates the parent directory when missing.
4. Add a failing test that reading a missing auth file returns `nil` instead of throwing.
5. Add a failing test that deleting auth data is idempotent when the file does not exist.
6. Add a failing test that expired `id-token` plus valid `refresh-token` triggers refresh and persists updated JSON.
7. Add a failing test that malformed JSON returns a stable `invalid-auth-file` error code.
8. Run `bb dev:test -v logseq.cli.auth-test` and confirm only auth helper tests fail.

### Phase 2. Add failing parser and help tests for `login` and `logout`.

9. Update `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` with a failing assertion that top-level help lists `login` and `logout`.
10. Add a failing assertion that `logseq login --help` and `logseq logout --help` produce command-specific help.
11. Add a failing assertion that `sync config set|get|unset` help no longer mentions `auth-token`.
12. Run `bb dev:test -v logseq.cli.commands-test` and confirm the failures reflect missing auth command wiring and old sync config text.

### Phase 3. Add failing command execution tests for auth commands.

13. Create `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/auth_test.cljs`.
14. Add a failing test that `login` starts a callback server and opens the browser with a Cognito authorize URL.
15. Add a failing test that `login` validates `state` before exchanging the authorization code.
16. Add a failing test that a successful code exchange writes `/Users/rcmerci/logseq/auth.json` through the auth persistence helper.
17. Add a failing test that `logout` removes the auth file and returns success when the file existed.
18. Add a failing test that `logout` still succeeds when the auth file was already absent.
19. Add a failing test that `login` returns a timeout error when no browser callback arrives.
20. Run `bb dev:test -v logseq.cli.command.auth-test` and confirm the tests fail for missing implementation only.

### Phase 4. Implement auth helpers and OAuth plumbing.

21. Add `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/auth.cljs` for auth path resolution, JSON read and write helpers, token expiry checks, refresh logic, and auth file deletion.
22. Add `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/auth.cljs` for command entries, action builders, and command execution.
23. Implement PKCE helpers and loopback callback server support inside `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/auth.cljs`, unless the file becomes too large, in which case split transport helpers into `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/auth_oauth.cljs`.
24. Build the Cognito authorize URL using constants from `/Users/rcmerci/gh-repos/logseq/src/main/frontend/config.cljs` so the CLI and app share the same cloud environment.
25. Implement the token exchange POST against `https://<oauth-domain>/oauth2/token` and map the response into the `auth.json` shape.
26. Implement refresh-token exchange using the same Cognito domain and client id.
27. Add best-effort browser launching for macOS and Linux, and always print the URL so the flow remains usable when auto-open fails.
28. Run `bb dev:test -v logseq.cli.auth-test` and `bb dev:test -v logseq.cli.command.auth-test` until green.

### Phase 5. Wire `login` and `logout` into the CLI parser and help output.

29. Register `auth-command/entries` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
30. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` so top-level summaries include `login` and `logout` in a dedicated auth section or the existing management section.
31. Extend action building and execute dispatch in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` to route `:login` and `:logout`.
32. Re-run `bb dev:test -v logseq.cli.commands-test` until the new parser and help output tests pass.

### Phase 6. Remove `:auth-token` persistence from `cli.edn`.

33. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/config_test.cljs` that `resolve-config` no longer returns `:auth-token` from file config.
34. Add a failing test that `update-config!` strips `:auth-token` from updates instead of persisting it.
35. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/config.cljs` so file-backed config excludes `:auth-token` while still preserving `ws-url`, `http-base`, `e2ee-password`, graph selection, and output settings.
36. Update any config-related tests that currently expect `:auth-token` round-tripping through `cli.edn`.
37. Run `bb dev:test -v logseq.cli.config-test` until green.

### Phase 7. Update sync commands to resolve auth from `auth.json`.

38. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` that `sync config set|get|unset auth-token` is rejected as an unknown key.
39. Add a failing test that sync execution uses the auth helper to resolve a runtime `:auth-token` before invoking `:thread-api/set-db-sync-config`.
40. Add a failing test that missing auth file returns a `missing-auth` style error for authenticated sync operations such as `sync remote-graphs`.
41. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` so `config-key-map` removes `auth-token`.
42. Update sync execution to call the auth helper and merge the effective runtime token into the in-memory sync config map.
43. Update human-readable hints that currently say `Set sync config keys (ws-url/http-base/auth-token)` so they instead mention login plus the remaining sync config keys.
44. Run `bb dev:test -v logseq.cli.command.sync-test` until green.

### Phase 8. Keep worker behavior stable while clarifying CLI ownership of auth.

45. Add a failing regression test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs` that CLI node mode still prefers the runtime `:auth-token` provided by sync config over renderer state.
46. Decide whether an additional worker test is needed to prove no worker-side changes are required beyond existing runtime behavior.
47. Make only the smallest worker change necessary, and prefer no production worker changes if CLI runtime injection remains sufficient.
48. Run `bb dev:test -v frontend.worker.sync.crypt-test` and any related worker namespace tests.

### Phase 9. Update output formatting and docs.

49. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for human output of `login` and `logout`.
50. Remove or rewrite any format tests that currently mention `sync config get auth-token` redaction.
51. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` so auth command output reports file path, email, and status without printing tokens.
52. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to document `login`, `logout`, `auth.json`, and the reduced `sync config` key set.
53. Add one short troubleshooting section telling users to delete `/Users/rcmerci/logseq/auth.json` or run `logseq logout` when local auth becomes invalid.
54. Run `bb dev:test -v logseq.cli.format-test` after formatter updates.

### Phase 10. Add integration coverage and perform final verification.

55. Add a failing integration test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that simulates a successful `login` callback and verifies `auth.json` contents.
56. Add a failing integration test that `logout` removes the auth file.
57. Add a failing integration test that an authenticated sync command reads `auth.json`, refreshes if needed, and sends runtime `:auth-token` to the worker.
58. Stub browser opening and Cognito HTTP responses so the integration tests remain deterministic and offline.
59. Run `bb dev:test -v logseq.cli.integration-test` until the new coverage is green.
60. Run `bb dev:lint-and-test` from `/Users/rcmerci/gh-repos/logseq` and confirm exit code `0`.

## File map

| Area | Files to update or add | Reason |
|---|---|---|
| Auth persistence and OAuth flow | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/auth.cljs`, optionally `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/auth_oauth.cljs` | Own `auth.json`, login callback server, PKCE, refresh, and logout deletion. |
| CLI command wiring | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/auth.cljs` | Expose `login` and `logout` and update help text. |
| Sync runtime auth | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` | Replace file-backed `:auth-token` lookup with auth helper resolution. |
| Config cleanup | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/config.cljs` | Stop round-tripping `:auth-token` in `cli.edn`. |
| Cloud constants reuse | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/config.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/user.cljs` | Reference existing Cognito endpoints and refresh semantics. |
| Tests | `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/auth_test.cljs`, `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/auth_test.cljs`, `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/config_test.cljs`, `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs`, `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`, `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`, `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs`, and possibly `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/sync/crypt_test.cljs` | Cover behavior before implementation. |
| User-facing docs | `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Explain the new auth workflow and removal of `auth-token` from sync config commands. |

## Edge cases and failure handling

`logseq login` must fail cleanly when the localhost callback port cannot be opened.

`logseq login` must reject callbacks with mismatched `state` or missing `code`.

`logseq login` must surface Cognito code-exchange failures without writing a partial auth file.

`logseq logout` must succeed even when `/Users/rcmerci/logseq/auth.json` is already missing.

Malformed or partially written `auth.json` must produce a deterministic error code and an actionable hint rather than a generic JSON parse exception.

Expired `id-token` with a valid `refresh-token` should auto-refresh before sync commands instead of forcing an immediate re-login.

Expired `id-token` with an invalid or missing `refresh-token` should fail with a hint to run `logseq login`.

`sync start`, `sync remote-graphs`, `sync upload`, `sync download`, `sync ensure-keys`, and `sync grant-access` should all use the same auth resolution path so behavior is consistent.

The CLI must not print raw JWTs or refresh tokens in human output, logs, or test snapshots.

The implementation should preserve the current worker contract by continuing to pass `:auth-token` in runtime sync config, because changing the worker key name would expand scope without user benefit.

## Verification commands

| Command | Expected outcome |
|---|---|
| `bb dev:test -v logseq.cli.auth-test` | Auth helper tests pass. |
| `bb dev:test -v logseq.cli.command.auth-test` | Login and logout command tests pass. |
| `bb dev:test -v logseq.cli.commands-test` | Help output includes `login` and `logout`, and sync config no longer mentions `auth-token`. |
| `bb dev:test -v logseq.cli.config-test` | `cli.edn` no longer persists `:auth-token`. |
| `bb dev:test -v logseq.cli.command.sync-test` | Sync command tests pass with auth resolved from `auth.json`. |
| `bb dev:test -v logseq.cli.integration-test` | End-to-end auth flow tests pass with stubs. |
| `bb dev:lint-and-test` | Full repo lint and test suite passes with exit code `0`. |
| `node ./dist/logseq.js login` | Opens browser or prints login URL, then writes `/Users/rcmerci/logseq/auth.json` after callback. |
| `node ./dist/logseq.js logout` | Removes local auth state and reports success. |
| `node ./dist/logseq.js sync remote-graphs --output json` | Reads auth from `auth.json` and returns remote graphs without requiring `sync config set auth-token`. |

## Testing Details

The tests focus on externally observable behavior, including CLI help text, browser launch requests, callback validation, auth file contents, refresh-on-expiry behavior, sync runtime payloads, and user-facing error hints.

The tests should not assert private helper structure unless that structure is itself the behavior contract, such as the persisted JSON keys or the generated Cognito callback URL.

## Implementation Details

- Keep `auth-token` as an in-memory db-sync runtime key, but remove it from persistent `cli.edn` config and from `sync config` command parsing.
- Add a dedicated CLI auth module instead of scattering login and refresh logic across `sync.cljs` and `config.cljs`.
- Reuse Cognito constants from `frontend.config` so the CLI always targets the same environment as the app.
- Reuse the refresh grant semantics from `frontend.handler.user.cljs` instead of inventing a second refresh protocol.
- Prefer an ephemeral localhost callback port and PKCE-based authorization code flow.
- Always print a copyable login URL even when automatic browser opening succeeds.
- Make `logout` local and idempotent first, and treat remote Cognito session invalidation as optional future scope.
- Keep the worker contract stable and prefer solving expiration entirely in the CLI auth module.
- Add an internal test-only auth path override rather than a new public CLI flag.
- Update user-facing docs and error hints so `Run logseq login first.` becomes the primary recovery path.

## Decision

The implementation will use a loopback redirect URI such as `http://127.0.0.1:<port>/auth/callback`.

If the current Cognito app client does not yet allow that redirect URI pattern, updating the Cognito app-client configuration is part of the implementation prerequisite rather than a reason to change the CLI design.

`logout` will only clear `/Users/rcmerci/logseq/auth.json` in the first release.

Best-effort browser sign-out against the Cognito Hosted UI logout endpoint is explicitly out of scope for this iteration.

`auth.json` will persist `id-token`, `access-token`, and `refresh-token`, plus non-sensitive metadata such as `expires-at`, `sub`, `email`, and `updated-at`.

This keeps the first CLI implementation aligned with the existing frontend token model while still using `id-token` as the runtime `:auth-token` injected into db-sync.

---
