# M14: Git Push + PR for All Users

Status: Implemented
Target: Enable all authenticated collaborators to use agent sessions to push committed changes and create pull requests.

## Goal
Allow task agents to complete a full delivery loop:
1) edit + commit locally
2) push branch to remote
3) submit a PR when requested by user/task context

## Why M14
- Current milestones cover repo clone and runtime provisioning, but stop short of remote delivery.
- Users still need manual handoff for pushing and PR creation.
- Push/PR should not be restricted to manager-only workflows.
- End-to-end agent outcomes should include publish-ready outputs.

## Scope
1) Add an explicit agent capability profile for git delivery in task/session payload handling with no role-based gating.
2) Enable authenticated `git push` from sandbox runtime for supported providers.
3) Add PR submission path available to all authenticated collaborators.
4) Persist and stream audit events for push/PR steps and failures.
5) Keep existing agent/session flows backward compatible.

## Out of Scope
- Auto-merge behavior.
- Repo hosting abstraction beyond supported providers.
- Rewriting existing session protocol semantics unrelated to git delivery.

## Workstreams

### WS1: Agent Capability + Session Payload
- Define M14 capability contract for:
  - `push-enabled` (default true)
  - `pr-enabled` (default true)
- Thread capability through session creation and runtime payload assembly.

### WS2: Runtime Git Push
- Ensure runtime has required auth material for push.
- Add guarded push flow:
  - branch selection/creation
  - commit verification
  - push with error classification and retries where safe

### WS3: PR Submission (All Users)
- Add PR intent in task or message flow for every authenticated collaborator.
- Create PR when requested and branch push succeeds.
- Return PR URL and metadata in session events.

### WS4: Observability + Safety
- Emit structured events for:
  - push started/succeeded/failed
  - pr started/succeeded/failed
- Keep failures non-destructive and user-visible with actionable messages.

### WS5: Tests + Docs
- Add unit/integration tests for payload mapping and runtime git/PR paths.
- Document env/config requirements for auth and provider behavior.

## Exit Criteria
1) Any authenticated collaborator can push committed changes to configured repo from an active session.
2) Any authenticated collaborator can submit a PR from an active session.
3) Session event stream includes push/PR lifecycle and final links/errors.
4) No manager/member role gate exists for push/PR actions.
5) Existing non-M14 sessions continue to work unchanged.
