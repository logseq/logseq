# M21: Store Snapshots Metadata in D1

Status: Implemented
Target: Use D1 as the durable source of truth for sandbox checkpoint metadata across sessions.

## Goal
Persist checkpoint metadata by `repo+branch` in D1 so new sessions can restore from existing snapshots without relying on per-isolate in-memory cache or per-session DO storage fallback.

## Why M21
- In-memory snapshot caches are not reliable across isolate restarts and deployments.
- DO storage fallback is session-local and cannot reliably resume across independent tasks/sessions.
- D1 gives a shared, durable lookup path for checkpoint metadata.

## Scope
1) Add `AGENTS_DB` D1 binding for agents worker environments.
2) Add checkpoint metadata store in agents worker:
- key: `repo_key + branch`
- value: `provider`, `snapshot_id`, `backup_key`, `backup_dir`, `checkpoint_at`
- retention: 30-day TTL with opportunistic cleanup.
3) Make runtime provisioning use D1 checkpoint lookup for restore metadata.
4) Upsert D1 metadata when checkpoint/snapshot success persists session checkpoint.
5) Remove provider-side in-memory restore cache fallback.

## Out of Scope
- Persisting snapshot payloads in D1.
- UI changes for checkpoint browsing.
- Backfilling historical checkpoint records.

## Data Model
Table: `sandbox_checkpoints`
- `repo_key TEXT NOT NULL`
- `branch TEXT NOT NULL`
- `provider TEXT NOT NULL`
- `snapshot_id TEXT NOT NULL`
- `backup_key TEXT`
- `backup_dir TEXT`
- `checkpoint_at INTEGER NOT NULL`
- `updated_at INTEGER NOT NULL`
- `expires_at INTEGER NOT NULL`
- `PRIMARY KEY (repo_key, branch)`
- index: `idx_sandbox_checkpoints_expires_at(expires_at)`

## Implementation Notes
- Added `logseq.agents.checkpoint-store` for D1 load/upsert and schema ensure.
- `do.cljs` now:
  - loads checkpoint from D1 during `<provision-runtime!` using task repo+branch,
  - no longer uses DO storage checkpoint fallback for runtime provisioning,
  - upserts D1 metadata when persisting session checkpoint.
- `runtime_provider.cljs` now:
  - restores only from explicit task checkpoint metadata,
  - no longer restores from in-memory snapshot/backup caches.

## Validation
- Agents worker build compiles cleanly.
- Worker split test suite passes.
- Main CLJS test compile passes (existing unrelated warnings remain).
- Targeted runtime execution of frontend node test harness is currently blocked by missing local file `static/tests-with-dom-shim.js` in this checkout.
