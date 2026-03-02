# M20: Resume Session with Persisted Workspace

Status: Proposed
Target: Guarantee no work loss when a sandbox stops by rebuilding workspace state on demand for the next message.

## Goal
Allow Codex and Claude sessions to resume from a stopped sandbox with the same repository working state so conversation can continue without losing local changes.

## Why M20
- Chat history is already persisted in Cloudflare Durable Objects, but sandbox filesystem state is ephemeral.
- Vercel Sandbox stops/sleeps by design, which can drop unsaved workspace state if not persisted.
- Frequent full snapshots are expensive for large repos.
- A hybrid persistence strategy can minimize storage cost while preserving correctness.

## Scope
1) Add workspace persistence state to session metadata:
- Store `base-snapshot-id`, `latest-patch-key`, `patch-seq`, `last-known-head-sha`, `workspace-dir`, and `checkpoint-at`.
- Keep this state in the session Durable Object so restore is deterministic.

2) Adopt a hybrid persistence model:
- Base layer: use Vercel snapshot as a reusable base image for repo + dependencies.
- Delta layer: persist conversation-local git delta artifacts in R2.
- Default delta format: git bundle of checkpoint commits with metadata JSON.

3) Define checkpoint trigger policy:
- Refresh persistence before controlled inactivity transitions.
- Controlled inactivity means control-plane initiated runtime stop paths such as explicit cancel, PR-ready cleanup, idle timeout shutdown, and manual stop.
- Do not block API responses on checkpoint completion; run checkpoint in background and emit events.

4) Add restore-on-demand behavior:
- On new message for a session with no live runtime, provision a new sandbox.
- Restore from `base-snapshot-id` first.
- Apply latest patch bundle from R2 and verify expected commit SHA.
- Start sandbox-agent and continue the conversation stream.

5) Add observability and failure semantics:
- Emit `sandbox.checkpoint.started|succeeded|failed` and `sandbox.restore.started|succeeded|failed` events.
- If patch apply fails, fall back to clean repo bootstrap and surface a structured recovery warning.

## Out of Scope
- Multi-user merge conflict resolution UI.
- Cross-provider migration of snapshot/patch artifacts.
- Persisting build outputs outside git-tracked workspace state.
- Full snapshot history browsing.

## Architecture
The persistence pipeline uses one durable base plus cheap incremental deltas.

```text
Session running in sandbox
        |
        | controlled inactivity transition
        v
Checkpoint worker
  1) ensure local git checkpoint commit (if dirty)
  2) export incremental git bundle
  3) upload bundle + metadata to R2
  4) refresh base snapshot only when policy says stale
  5) persist pointers in DO session state
        |
        v
Sandbox stops
        |
        | next user message
        v
Resume worker
  1) create new sandbox from base snapshot
  2) download/apply latest bundle from R2
  3) verify expected head SHA
  4) start sandbox-agent + continue message loop
```

## Workstreams

### WS1: Session Metadata and State Machine
- Extend session state model in `deps/workers/src/logseq/agents/do.cljs` to include persistence pointers and checkpoint timestamps.
- Add explicit session runtime states for `running`, `checkpointing`, and `inactive-runtime`.
- Ensure message enqueue path can trigger resume provisioning when runtime is absent.

### WS2: Runtime Provider Persistence API
- Extend `RuntimeProvider` in `deps/workers/src/logseq/agents/runtime_provider.cljs` with checkpoint/restore primitives for workspace deltas.
- Implement Vercel-specific workspace checkpoint commands under `/vercel/sandbox/<repo>` semantics.
- Keep unsupported behavior explicit for providers without patch persistence support.

### WS3: R2 Artifact Store
- Add R2 upload/download helpers for patch bundles and metadata in `deps/workers/src/logseq/agents/runtime_provider.cljs` (or a new `workspace_store.cljs` helper if extraction is cleaner).
- Define object keys by `session-id` + monotonic `patch-seq`.
- Persist checksums and byte sizes for verification and diagnostics.

### WS4: Inactivity Checkpoint Triggers
- Hook checkpoint refresh into existing teardown paths in `deps/workers/src/logseq/agents/do.cljs`.
- Add idle-timeout initiated stop path (DO alarm or equivalent timer policy) that checkpoints first, then terminates runtime.
- Keep termination idempotent when checkpoint already in progress.

### WS5: Resume Path and Verification
- In `handle-messages` and pending-order flush flow, ensure runtime reprovision restores persisted workspace before sending message.
- Verify post-restore branch/HEAD expectations.
- Emit recovery event and continue with clean bootstrap when verification fails.

### WS6: API and UI Contract Updates
- Extend session status payloads in `deps/workers/src/logseq/sync/malli_schema.cljs` with persistence metadata needed by UI.
- Update frontend session state handling in `src/main/frontend/handler/agent.cljs` for restore/checkpoint status visibility.
- Keep existing Snapshot button behavior unchanged.

### WS7: Docs and Operations
- Update protocol docs in `docs/agent-guide/db-sync/protocol.md` for new checkpoint/restore events and session fields.
- Document required env/bindings for R2 delta storage in worker deployment config docs.
- Add runbook entries for checkpoint failures, restore fallback, and forced rebuild.

## Cost Strategy
- Keep one active base snapshot per repo template key.
- Store frequent deltas as compact R2 objects.
- Refresh base snapshot only when dependency/toolchain fingerprint changes or base snapshot age exceeds policy.

## Testing Requirements
1) Unit tests for checkpoint metadata transitions in `deps/workers/test/logseq/agents/do_test.cljs`.
2) Runtime-provider tests for bundle export/apply and checksum verification in `deps/workers/test/logseq/agents/runtime_provider_test.cljs`.
3) Failure tests for R2 upload/download and restore fallback behavior.
4) Session flow tests proving new message can resume from `inactive-runtime` with no message loss.
5) Regression tests confirming non-Vercel providers remain unchanged.

## Exit Criteria
1) Stopped session can be resumed by sending a new message without losing local repo changes.
2) Controlled inactivity paths always attempt checkpoint refresh before runtime termination.
3) Resume restores expected git HEAD for last checkpoint or emits explicit fallback event.
4) Patch artifacts are persisted in R2 with integrity metadata and bounded retention.
5) End-to-end tests demonstrate no-work-loss behavior across stop and resume cycles.
