# M19: Vercel Sandbox Runtime and Snapshot Support

Status: Proposed
Target: Add a first-class `vercel` runtime provider with snapshot create/restore support for agent sessions.

## Goal
Support `AGENT_RUNTIME_PROVIDER=vercel` end-to-end so sessions can run in Vercel Sandbox and use snapshots for fast recovery and branch/task handoff.

## Why M19
- Runtime providers currently cover `sprites`, `cloudflare`, and `local-dev`, but not Vercel Sandbox.
- Snapshot behavior is becoming a core workflow primitive for long-running tasks and recovery from sandbox restarts.
- A Vercel provider reduces platform lock-in and gives teams another hosted runtime option with the same session API.

## Scope
1) Add `VercelProvider` in `src/logseq/agents/runtime_provider.cljs`.
2) Implement runtime lifecycle methods for Vercel:
- `<provision-runtime!`
- `<open-events-stream!`
- `<send-message!`
- `<open-terminal!` (if supported by Vercel sandbox APIs)
- `<terminate-runtime!`
3) Implement snapshot parity for Vercel provider:
- `<snapshot-runtime!` create snapshot
- restore-from-latest-snapshot during provision when repo/branch key matches
- keep one active snapshot handle per `repo/branch` key in provider cache policy (same behavior as Cloudflare flow)
4) Preserve current control-plane/session API contract:
- no route changes required for `/sessions/:id/snapshot`
- no behavior regression for non-Vercel providers
5) Add env/config wiring for Vercel credentials and runtime options.

## Out of Scope
- Cross-cloud snapshot migration between providers.
- Snapshot browsing/history UI.
- Replacing existing default runtime provider.

## Workstreams

### WS1: Provider Implementation
- Add `vercel` to provider-kind resolution and `create-provider` dispatch.
- Implement sandbox provisioning and sandbox-agent bootstrap for Vercel runtime.
- Persist runtime metadata needed for event stream, terminal, and teardown.

### WS2: Snapshot and Restore Integration
- Implement Vercel snapshot create adapter in runtime provider.
- Reuse repo/branch snapshot keying policy for restore selection.
- Restore snapshot on provision when available, otherwise clone repo.
- Keep auto-backup-on-terminate disabled.

### WS3: Config and Secrets
- Define required env vars/secrets in node config and worker docs.
- Wire runtime provider selection (`AGENT_RUNTIME_PROVIDER=vercel`) and provider-specific options.
- Add staging/prod/local guidance and failure-mode diagnostics.

### WS4: Tests
- Add runtime provider tests for Vercel provision/message/terminate behavior.
- Add snapshot tests for create, restore-on-provision, and fallback-to-clone.
- Add failure-path tests (invalid credentials, snapshot unavailable, restore failure).
- Verify existing provider tests remain green.

### WS5: Rollout
- Add staging smoke test checklist for Vercel sessions.
- Add rollback plan to switch provider back to `cloudflare` or `sprites` quickly.
- Document operational metrics/log keys for Vercel runtime and snapshot events.

## Exit Criteria
1) `AGENT_RUNTIME_PROVIDER=vercel` can create and run sessions end-to-end.
2) `/sessions/:id/snapshot` succeeds for Vercel sessions when provider config is valid.
3) Re-provision restores from matching snapshot key, else clones repo.
4) Existing providers (`sprites`, `cloudflare`, `local-dev`) behave unchanged.
5) Tests cover Vercel runtime lifecycle and snapshot create/restore behavior.
