# ADR 0002: Optional Encryption When Creating a Sync Graph

Date: 2026-02-11
Status: Proposed

## Context
Sync graph creation currently assumes encrypted graph data. This is a good default
for privacy, but it is not always the right choice:
- Self-hosted users may run trusted infrastructure and prefer plaintext storage.
- Some users need easier integration with external tools that read graph data
  directly from storage or APIs.
- Encryption/decryption adds CPU and complexity during sync operations.

We need to support both privacy-first and integration-first workflows without
breaking compatibility for existing encrypted graphs.

## Decision
Add an explicit graph-level option when creating a sync graph:
- `Encrypt graph data` (boolean)

Behavior:
1) Default remains encrypted for safety.
2) Users can disable encryption at graph creation time.
3) The selected mode is stored as graph metadata and treated as immutable for
   that graph after creation.
   There's already `:logseq.kv/graph-rtc-e2ee?`.
4) Existing encrypted graphs remain unchanged.

When encryption is disabled:
- Client does not generate/import graph encryption keys for sync payloads.
- Sync payloads and assets are sent as plaintext over TLS transport.
- Client skips encrypt/decrypt steps in DB and asset sync pipelines.

When encryption is enabled:
- Current E2EE behavior remains unchanged.

## Options Considered
1) Keep encryption mandatory
- Pros: strongest default privacy, simpler policy
- Cons: blocks valid self-hosted and interoperability use cases

2) Disable encryption by default
- Pros: easier integrations out of the box
- Cons: unsafe default for most users

3) Make encryption selectable at graph creation (chosen)
- Pros: keeps secure default while enabling self-hosted/integration scenarios
- Cons: introduces dual execution paths and UI/UX complexity

## Consequences
- Positive:
  - Better support for self-hosted deployments.
  - Easier interoperability with external tooling.
  - Lower client CPU overhead for non-encrypted graphs.
- Negative:
  - More branching in sync and asset code paths.
  - Higher test matrix (encrypted vs non-encrypted).
  - Users must understand security tradeoffs.

## Follow-up Work
1) API and protocol
- Add graph creation flag for encryption mode.
- Persist encryption mode in graph metadata and return it in graph info.

2) Client graph creation UI
- Add `Encrypt graph data` option with warning/help text.
- Default ON, with clear explanation of tradeoff.

3) DB sync and asset sync behavior
- Gate encryption and key-management logic on graph mode.
- Ensure non-encrypted graphs do not call key generation/import paths.

4) Migration and compatibility
- Keep existing graph behavior unchanged.
- Do not auto-migrate graph encryption mode.

5) Testing
- Add/create-path tests for both modes.
- Add sync + asset upload/download tests for encrypted and non-encrypted graphs.
- Add regression tests for mixed environments (desktop/web/self-hosted).

## Open Questions
- Should self-hosted servers be able to enforce a default or only allow one mode?
  Defaults to encryption mode.
- Do we need a future migration flow to move a graph between encrypted and
  non-encrypted modes?
  Probably, let's leave it for future.
