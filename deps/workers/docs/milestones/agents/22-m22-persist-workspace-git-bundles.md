# M22: Persist Workspace Git Bundles

Status: Implemented
Target: Persist unsaved workspace changes as git bundles so resumed sessions can restore local progress after sandbox stop/teardown.

## Goal
Store checkpoint bundle metadata in D1 and payloads in R2, then apply the latest bundle during runtime provisioning.

## Scope
1) Add D1 bundle metadata store:
- `workspace_bundle_manifests`
- `workspace_bundle_pointers` (latest pointer per repo+branch)
2) Add R2 bundle payload helper using `BACKUP_BUCKET`.
3) Extend runtime provider contract with:
- `<export-workspace-bundle!`
- `<apply-workspace-bundle!`
4) Hook DO checkpoint path to:
- export bundle from runtime
- upload payload to R2
- persist manifest/pointer in D1
- persist bundle pointer fields into task `:sandbox-checkpoint`
5) Hook DO provision path to:
- load latest bundle pointer from D1
- fetch payload from R2
- apply bundle in runtime
- emit restore success/failure events with fail-open semantics.
6) Extend session request schema/checkpoint map to include bundle metadata fields.

## Notes
- Snapshot metadata remains in `sandbox_checkpoints` (M21).
- Bundle metadata is separate and keyed by repo+branch, enabling reuse across sessions.
- Restore failures do not block provisioning; session continues with clean workspace if bundle apply fails.

## Validation
- Added runtime-provider tests for Vercel bundle export/apply command flow.
- Added DO tests for checkpoint bundle persistence and provision-time bundle restore.
- Existing checkpoint/snapshot flows remain unchanged when bundle export is unsupported.
