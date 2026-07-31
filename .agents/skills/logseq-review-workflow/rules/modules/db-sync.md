# DB Sync Review Rules

Apply when a change touches `deps/db-sync`, sync protocol messages, Cloudflare worker code, D1 schema, RTC persistence, sync metadata, or db-worker-node sync integration.

## Review focus

- Protocol changes must be versioned or proven compatible with deployed clients/servers.
- D1 schema changes need SQL migrations under `deps/db-sync/worker/migrations/`.
- Writes should be atomic from the server/client perspective and safe under retries.
- Conflict handling should be deterministic and observable.
- Logs should provide enough context for support without leaking sensitive graph content.

## Red flags

- Runtime-only schema migration instead of a worker SQL migration.
- Server/client protocol shape changes without compatibility review.
- Silent retry loops or swallowed sync errors.
- Partial writes that can leave sync state inconsistent.
- Usage/statistics code that can create excessive D1 reads/writes.
- Tests that mock away protocol serialization/deserialization boundaries.

## Review questions

- What happens when an old client talks to the new server, and vice versa?
- Are retries idempotent?
- Does the migration run once and work on existing data?
- Are authorization, graph identity, and user identity preserved?
- Are sync errors logged and surfaced in the right runtime?

## Related docs and skills

- `docs/agent-guide/db-sync/db-sync-guide.md`
- `docs/agent-guide/db-sync/protocol.md`
- `logseq-server-usage-stats` when reviewing usage-stat scripts or D1 cost impact
