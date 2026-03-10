# M17: Separate Agents Worker from DB Sync

Status: Proposed
Target: Separate agents control-plane runtime from `db-sync` into a dedicated Cloudflare Worker, and route only `/sessions*` traffic to it.

## Goal
Run sync and agents as independently deployable services while preserving the existing API shape for sessions.

## Why M17
- `db-sync` currently contains both sync and agent session responsibilities, increasing deploy and rollback blast radius.
- Agent runtime changes have different operational risk from sync protocol changes.
- Separate Workers allow independent release cadence, incident isolation, and ownership boundaries.

## Scope
1) Create a dedicated `agents` Worker for session APIs:
- Own `/sessions`, `/sessions/:id`, and all nested session endpoints.
- Own `AgentSessionDO` and runtime orchestration currently used by session flows.

2) Keep `db-sync` focused on sync/indexing APIs:
- Keep `/sync/*`, `/graphs*`, `/e2ee*`, and `/assets/*` in `db-sync`.
- Remove `/sessions*` dispatch from `db-sync` request handling.

3) Route only `/sessions*` to the new Worker:
- Configure edge routing so `/sessions*` goes to `agents`.
- Keep existing non-session routes on `db-sync`.

4) Split deployment and runtime config:
- Separate deploy pipeline/commands for `agents` and `db-sync`.
- Split per-worker secrets/vars/bindings while keeping required auth/runtime behavior unchanged.

5) Durable Object cutover strategy:
- Define cutover for `AgentSessionDO` namespace ownership.
- No legacy session data migration is required for this milestone.

## Out of Scope
- Any `publish` Worker changes, routing changes, or API redesign.
- Session API contract redesign beyond preserving current behavior.
- Feature additions unrelated to worker separation.

## Workstreams

### WS1: Agents Worker Extraction
- Create `agents` Worker entrypoint and config.
- Move/reuse session handler + session DO wiring under the new Worker boundary.
- Keep API contract and auth behavior backward compatible.

### WS2: Routing and Traffic Cutover
- Define routing rules for `/sessions* -> agents`.
- Keep existing `db-sync` routes unchanged.
- Accept clean session-state reset during cutover (no data backfill).
- Add rollback route plan that can quickly restore `/sessions*` to previous target.

### WS3: Config and Secrets Separation
- Provision `agents` Worker bindings (DO, sandbox/runtime, auth, observability).
- Remove agent-only bindings from `db-sync` after cutover.
- Ensure staging/prod parity in env layout.

### WS4: Validation and Reliability
- Add or update route-level tests for `/sessions*` ownership.
- Validate session lifecycle endpoints (`create`, `messages`, `stream`, `events`, `terminal`, control actions) through new route target.
- Verify `db-sync` sync flows remain unaffected.

### WS5: Rollout, Monitoring, and Rollback
- Stage-first rollout with smoke tests.
- Add dashboards/log filters per worker to detect regressions after cutover.
- Document rollback steps for route and deploy reversion.

## Exit Criteria
1) `/sessions*` endpoints are served by the `agents` Worker in staging and production.
2) `db-sync` no longer handles `/sessions*` requests.
3) Session APIs behave equivalently before/after cutover for auth, streaming, and control actions.
4) `db-sync` sync APIs remain stable with no regression attributable to this split.
5) Deploying `agents` does not require redeploying `db-sync`, and vice versa.
6) Cutover is validated with fresh sessions only; no pre-cutover agent session state is expected to persist.
