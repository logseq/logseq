# M26: Plan-First Execution and Post-Review Persistence

Status: Implemented
Target: Make every agent execution session start with a planning phase in the same session, persist the generated plan onto the task, create or update split subtasks in Logseq when the plan includes them, and persist a final post-review markdown artifact when the session completes.

## Goal
Keep execution in a single agent session while forcing a plan-first workflow that writes structured planning and review artifacts back into Logseq.

## Why M26
- Execution should not start from an unstructured prompt with no persisted plan.
- Logseq needs a durable record of the agent's implementation plan, including any proposed split subtasks.
- Completed sessions should leave behind a reusable post-review artifact instead of requiring users to reconstruct what changed from the raw chat stream.

## Implemented Flow
1. Task session creation still starts a normal execution session.
2. The initial task prompt now embeds an artifact protocol that requires:
   - a `<logseq-plan>...</logseq-plan>` artifact before code changes
   - continued implementation in the same session after the plan
   - a `<logseq-post-review>...</logseq-post-review>` artifact when the task is finished
3. The frontend watches fetched and streamed session events.
4. When a plan artifact appears, Logseq stores:
   - `Agent plan`
   - generated child tasks when `subtasks` are present
5. When a post-review artifact appears, Logseq stores:
   - `Post-review`

## Current State
- Plan/review prompt protocol and event persistence: `src/main/frontend/handler/agent.cljs`
- Built-in task properties:
  - `deps/db/src/logseq/db/frontend/property.cljs`
- Schema version bump:
  - `deps/db/src/logseq/db/frontend/schema.cljs`
- Frontend migration wiring:
  - `src/main/frontend/worker/db/migrate.cljs`
- Tests:
  - `src/test/frontend/handler/agent_test.cljs`
  - `src/test/frontend/worker/migrate_test.cljs`

## Final Decisions

### D1: Single Session
- Planning and execution happen in the same agent session.
- No separate planner session is introduced.

### D2: Logseq Artifacts
- The persisted planning artifact is markdown stored on the task itself.
- Suggested split work is stored as child tasks under the parent task.
- The persisted review artifact is markdown stored on the task itself.

### D3: Artifact Contract
- The planning artifact is emitted inside `<logseq-plan>`.
- The completion artifact is emitted inside `<logseq-post-review>`.
- Artifact payloads are JSON so the frontend can extract them deterministically from streamed agent output.

## Data Model
- `:logseq.property/agent-plan`
- `:logseq.property/post-review`

## Out of Scope
- Server-side task graph mutation without a connected Logseq client.
- A separate planner-only mode or planner session type.

## Validation
- Added migration coverage for the new built-in properties.
- Added frontend handler coverage for:
  - plan-first prompt construction
  - plan artifact persistence
  - post-review artifact persistence
- Build verification completed with:
  - `clojure -M:test compile test-no-worker`

## Known Limitation
- The repo's JS test runner currently fails before executing frontend tests in this environment because the root Node runtime cannot resolve the `e2b` module.
- That issue is environmental and separate from the changed frontend/DB code.

## Exit Criteria
1. Every execution prompt instructs the agent to emit a plan artifact before coding.
2. Logseq persists the plan markdown to the task.
3. Logseq creates or updates split subtasks when the plan includes them.
4. Logseq persists a final post-review markdown artifact when the session completes.
5. Planning and execution remain in the same session.
