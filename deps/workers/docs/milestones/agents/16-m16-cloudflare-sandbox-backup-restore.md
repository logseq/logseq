# M16: Cloudflare Sandbox Backup + Restore

Status: Proposed
Target: Integrate Cloudflare Sandbox backup/restore into agent session runtime lifecycle.

## Goal
Allow agent sessions on Cloudflare runtime to create and restore sandbox backups so users can resume work quickly after runtime loss, restart, or migration.

## Why M16
- Current runtime flow provisions and runs sessions but does not preserve sandbox workspace state across sandbox lifecycle events.
- Cloudflare Sandbox provides first-class backup/restore APIs we can integrate:
  - https://developers.cloudflare.com/sandbox/guides/backup-restore
- Fast recovery improves agent continuity and reduces repeated repo/bootstrap setup costs.

## Scope
1) Backup creation and restore wiring:
- Add runtime-provider support for Cloudflare sandbox `createBackup` and `restoreBackup`.
- Persist backup handle metadata in session runtime state and events.

2) Backup identity policy (required):
- Enforce at most one active sandbox backup per `repo/branch` identity.
- Define identity as normalized `repo-url + head-branch` (or equivalent deterministic key).
- New backup for same identity replaces previous handle metadata.

3) TTL policy (required):
- Create backups with fixed TTL of 7 days.
- Use TTL seconds = `604800`.

4) Restore triggers:
- Restore backup when a matching `repo/branch` backup exists and runtime requires workspace recovery.
- Keep restore logic idempotent and safe for repeated session init attempts.

5) Observability:
- Emit structured events for backup and restore lifecycle:
  - backup created/replaced/failed
  - restore started/succeeded/failed

## Out of Scope
- Multi-backup history browsing per repo/branch.
- User-facing backup management UI in this milestone.
- Cross-provider backup/restore beyond Cloudflare runtime.

## Workstreams

### WS1: Runtime Provider API
- Extend runtime provider protocol with backup/restore operations for Cloudflare runtime.
- Keep unsupported-provider behavior explicit and non-fatal.

### WS2: Backup Index + Policy Enforcement
- Add storage/index model for one-backup-per-repo/branch contract.
- Replace existing backup metadata on new successful backup creation.

### WS3: Session Lifecycle Integration
- Hook backup creation into safe lifecycle points (for example before termination/completion).
- Hook restore into session init/provision path when matching backup exists.

### WS4: TTL + Cleanup Behavior
- Ensure backup creation always uses 7-day TTL.
- Ensure stale/missing handles fail gracefully and can self-heal via new backup creation.

### WS5: Tests + Docs
- Add tests for:
  - one backup per repo/branch replacement semantics
  - restore selection by repo/branch identity
  - TTL fixed at 7 days
  - failure paths and event emission
- Document env/runtime prerequisites for Cloudflare backup/restore.

## Exit Criteria
1) Cloudflare runtime can create and restore sandbox backups through db-sync runtime provider APIs.
2) System guarantees at most one active backup per repo/branch identity.
3) All created backups use TTL = 7 days (`604800` seconds).
4) Restore path is automatic for matching repo/branch backup when runtime recovery is needed.
5) Backup/restore events are visible in session event stream for audit/debugging.
