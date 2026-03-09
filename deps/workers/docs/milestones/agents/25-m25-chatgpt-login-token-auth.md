# M25: ChatGPT Login Managed Token Auth

Status: Implemented
Target: Use Electron to complete ChatGPT OAuth locally, import the resulting tokens into the agents service, and reuse the stored managed auth across platforms for Codex sessions.

## Goal
Let users authenticate ChatGPT once from Electron, persist that credential server-side, and use the resulting managed auth for Codex-backed agent sessions without manually maintaining `auth.json`.

## Why M25
- `auth.json` is implementation-shaped and creates unnecessary user setup friction.
- Codex still expects a Codex-style `~/.codex/auth.json` in the sandbox, but that should be materialized from managed auth rather than entered by users.
- OpenAI/ChatGPT does not currently offer a stable third-party web callback registration model we can rely on for production browser OAuth.
- Electron can safely run the supported localhost callback flow (`http://localhost:1455/auth/callback`) and then hand the resulting tokens to the server as the durable source of truth.

## Implemented Flow
1. A Codex session start without valid managed auth returns `401` with `chatgpt login required`.
2. On Electron only, the frontend invokes the Electron main process to start ChatGPT OAuth.
3. Electron opens the browser, listens on `http://localhost:1455/auth/callback`, exchanges the authorization code for tokens, and stores those tokens locally.
4. The frontend uploads the returned token bundle to `POST /auth/chatgpt/import`.
5. The agents worker stores the credential in `managed_auth_sessions`.
6. Subsequent Codex session creation resolves the stored managed auth and materializes a Codex-compatible `auth.json` into the sandbox bootstrap.

## Current State
- Electron OAuth implementation: `src/electron/electron/openai_oauth.js`
- Electron IPC bridge: `src/electron/electron/handler.cljs`
- Frontend Electron auth/import flow: `src/main/frontend/handler/agent.cljs`
- Managed auth persistence/import: `src/logseq/agents/managed_auth.cljs`
- Agents auth endpoints: `src/logseq/agents/handler.cljs`, `src/logseq/agents/routes.cljs`
- Runtime auth materialization: `src/logseq/agents/runtime_provider.cljs`
- D1 schema: `worker/migrations/0006_add_managed_auth.sql`

## Final Decisions

### D1: Canonical Product Flow
- ChatGPT login is currently supported only on Electron.
- Browser/mobile/web do not run ChatGPT OAuth directly.
- Browser/mobile/web can still benefit from previously imported managed auth stored on the server.

### D2: Canonical Stored Credential
- The durable server-side object is a managed auth session in `managed_auth_sessions`.
- Stored fields include access token, refresh token, id token, token metadata, issued/expiry timestamps, and revocation state.
- The server remains the source of truth for auth availability during session creation.

### D3: Runtime Contract
- The sandbox still receives a materialized `~/.codex/auth.json`.
- That file is generated from managed auth and matches Codex’s expected shape, including:
  - `auth_mode`
  - `OPENAI_API_KEY`
  - `tokens.id_token`
  - `tokens.access_token`
  - `tokens.refresh_token`
  - `tokens.account_id`
  - `last_refresh`

### D4: Cross-Platform Behavior
- Electron is the acquisition path for ChatGPT credentials.
- Once tokens are imported into the agents service, other platforms can use Codex sessions as long as the stored managed auth remains valid.
- Non-Electron clients should surface a clear login-required message when no valid managed auth exists.

## Out of Scope
- Browser-based ChatGPT OAuth with a public app callback.
- General OpenAI OAuth client registration for arbitrary third-party web callbacks.
- Replacing Anthropic or other non-Codex auth flows.
- Removing legacy `auth.json` support everywhere immediately.

## UX States
- Missing managed auth: session start returns `chatgpt login required`.
- Electron login available: frontend starts Electron OAuth and retries session creation after import.
- Valid managed auth: session creation proceeds without interruption.
- Expired managed auth: session start returns `chatgpt login expired, reconnect required`.
- Non-Electron without valid auth: show a clear unsupported/login-required message.

## Data Model
- D1 table: `managed_auth_sessions`
- Columns:
  - `auth_id`
  - `user_id`
  - `provider`
  - `auth_method`
  - `access_token`
  - `refresh_token`
  - `id_token`
  - `token_type`
  - `scope`
  - `issued_at`
  - `expires_at`
  - `created_at`
  - `updated_at`
  - `revoked_at`

## Validation
- Managed auth request/runtime coverage:
  - `test/logseq/agents/m25_managed_auth_test.cljs`
  - `test/logseq/agents/routes_test.cljs`
- Worker build verification:
  - `clojure -M:cljs release db-sync agents-worker`
- Targeted managed auth test verification:
  - `clojure -M:cljs compile agents-m25-managed-auth-test && node worker/dist/agents-m25-managed-auth-test.js`

## Exit Criteria
1. Electron can complete ChatGPT OAuth using the localhost callback flow.
2. The frontend can import the resulting token bundle to the agents service.
3. The agents service persists managed auth in D1.
4. Codex-backed sessions can bootstrap from stored managed auth without user-supplied `auth.json`.
5. Previously imported managed auth can be reused from non-Electron clients when still valid.
