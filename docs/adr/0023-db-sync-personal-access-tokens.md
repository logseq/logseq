# ADR 0023: Graph-scoped Personal Access Tokens for the DB Sync REST API

Date: 2026-08-13
Status: Accepted

## Context

The DB Sync semantic REST API currently accepts Cognito OAuth access tokens and
enforces the `logseq/read` and `logseq/write` scopes declared by each operation.
This works for interactive OAuth clients, but it does not provide a durable,
user-managed credential for scripts and other personal integrations.

The existing DB Sync bearer-token path also protects the raw `/sync` and
`/assets` protocols. Treating an opaque personal access token as a general
replacement for a Logseq login token would unintentionally grant access outside
the semantic REST API and would make token scope ambiguous.

RTC group users need to request and revoke personal access tokens from Logseq
Settings. A token must be restricted to one graph, have read, write, or read and
write permission, and expire. The default expiration is one year from creation.

## Decision

Add opaque, graph-scoped personal access tokens (PATs) for the public semantic
REST API under `/api/v1`.

PATs are not accepted by `/sync`, `/assets`, `/graphs`, `/e2ee`, WebSocket, or
admin endpoints. Those paths keep their existing authentication contracts.

### Token Model

1. Generate PATs from cryptographically secure random bytes and prefix the
   displayed value with `logseq_pat_` so credentials can be identified reliably.
2. Return the complete token only in the successful create response. It cannot
   be retrieved again.
3. Store only a SHA-256 hash of the complete token. Store a short non-secret
   prefix separately so Settings can identify a token after creation.
4. Bind every token to exactly one `user_id` and one `graph_id`.
5. Store permission as one of `read`, `write`, or `both`. Map these values to
   the existing semantic API scopes:
   - `read` -> `logseq/read`
   - `write` -> `logseq/write`
   - `both` -> `logseq/read logseq/write`
6. Store `created_at`, `expires_at`, and optional `last_used_at` timestamps in
   milliseconds. A missing expiration is invalid. The create API defaults
   `expires_at` to 365 days after creation when the caller omits it.
7. Reject tokens whose expiration is not in the future. Expired tokens are not
   accepted even if their rows have not yet been deleted.

### Storage

Add a Cloudflare D1 migration for a `personal_access_tokens` table with:

- `id` as the public token identifier;
- `user_id` and `graph_id` ownership columns;
- unique `token_hash` and non-secret `token_prefix` columns;
- checked `permission` with `read`, `write`, and `both` values;
- `created_at`, `expires_at`, and nullable `last_used_at` timestamps.

Index token lookup by `token_hash`, user listing by `(user_id, created_at)`, and
graph cleanup by `graph_id`. Graph deletion deletes its PAT rows explicitly.

### Management API

Add these endpoints:

- `GET /api/v1/personal-access-tokens` lists the current user's token metadata
  without token hashes or complete token values.
- `POST /api/v1/personal-access-tokens` creates a token from `graph-id`,
  `permission`, and optional `expires-at`.
- `DELETE /api/v1/personal-access-tokens/:token-id` revokes a token owned by the
  current user.

Management endpoints accept only a verified Logseq login JWT. They do not accept
a PAT. The server checks that the JWT belongs to the current RTC rollout groups
and rejects all other users. Creation also requires the user to have current
access to the requested graph.

Revocation and listing are owner-scoped. A caller cannot inspect or revoke
another user's tokens by guessing an identifier.

### Semantic API Authentication

Add a semantic-API-specific authentication function that first preserves the
existing verified OAuth JWT behavior, then attempts PAT lookup for values with
the `logseq_pat_` prefix. Do not broaden the existing general DB Sync authentication
function.

A valid PAT produces the same `sub` and `scope` claims consumed by semantic
route authorization, plus an internal graph restriction. Before forwarding a
graph-scoped operation, authorization must verify all of the following:

1. the token exists and is not expired;
2. the operation's existing scope is present;
3. the route graph matches the token's graph;
4. the token owner still has access to that graph;
5. the graph is still eligible for the semantic API.

`GET /api/v1/graphs` returns only the PAT's bound graph and requires read
permission. A write-only PAT therefore cannot use the graph-list operation.
Rate-limit keys include the PAT identifier so separate credentials do not share
one indistinguishable bucket.

### Settings Experience

Add a Personal Access Tokens section to Logseq Settings for logged-in RTC group
users. The section:

- lists token prefix, graph, permission, creation time, and expiration time;
- creates a token after selecting a synced graph and `read`, `write`, or `both`;
- defaults expiration to one year while allowing a future expiration date;
- displays the complete token once after creation with a copy action and an
  explicit warning that it cannot be shown again;
- revokes an existing token after confirmation;
- reports loading, empty, validation, and request failure states.

The Settings entry is a rollout affordance, not the authorization boundary.
The server remains responsible for RTC group eligibility.

## Consequences

Personal scripts can use the existing semantic REST API without implementing an
interactive OAuth flow. Existing operation metadata remains the single source
of truth for read and write authorization.

PAT compromise is limited to one graph, the selected operation class, and the
remaining lifetime. Removing the user from a graph immediately makes that
graph's PAT unusable even before explicit revocation.

The complete credential cannot be recovered. Users must revoke and create a new
token after losing it.

The server gains a D1 lookup for PAT-authenticated semantic requests. JWT paths
remain unchanged, and PAT lookup is limited to values with the explicit prefix.

## Rejected Alternatives

### Encode PATs as Long-lived JWTs

Long-lived signed JWTs cannot be revoked without adding a revocation lookup, and
their embedded graph and permission data becomes stale. Opaque tokens make D1
the authoritative source for expiry, revocation, and current permissions.

### Accept PATs on the Raw Sync Protocol

The raw sync protocol is bidirectional and does not map cleanly to semantic read
and write operations. Accepting PATs there would undermine the requested
permission model and expose a broader API than intended.

### Store Complete Tokens

Storing recoverable credentials increases the impact of a D1 data disclosure.
Hash-only storage is sufficient because token verification is equality lookup.

### Enforce RTC Eligibility Only in Settings

UI-only gating can be bypassed by direct HTTP requests. The management API must
verify the rollout group from the login JWT.
