# M26: Cloudflare-Native Planning Layer

Status: Proposed
Target: Add a planning control plane on top of the existing `/sessions`
agents service by using Cloudflare Agents for interactive planning chat
and state, and Cloudflare Workflows for durable planning,
approval, execution dispatch, and replanning flows.

## Goal

Introduce a planning layer above the existing agents execution service
while reducing home-made control-plane and planning-chat transport code
as much as possible.

The planning layer should reuse the existing execution substrate rather
than replace it.

The milestone also covers turning planner output into real Logseq
`#Task` blocks and keeping those tasks synchronized with execution
status as sessions run.

## Why M26

- The current agents service already provides the execution substrate for sandbox work and should be reused.
- The missing system layer is durable planning and orchestration, not another execution backend.
- Cloudflare Agents can reduce custom realtime planning chat and planning-session state code.
- Cloudflare Workflows can reduce custom orchestration, retry, wait-state, and replanning logic.
- Planning state and execution-operational state need clearer separation.

## Architectural Decision

- Keep the existing `/sessions` APIs and execution semantics.
- Do not replace E2B, local-runner, runtime-provider, source-control, or checkpoint logic in this milestone.
- Use Cloudflare Agent instances as the canonical planning-session model.
- Use Workflows for direct planning, repo-aware planning, approval waits, execution fan-out, and replanning.
- Keep the Logseq graph as the product-visible system of record for goals, plans, tasks, and execution summaries.
- Accept that operational state remains split across Logseq graph, Cloudflare Agent/Workflow state, and the existing agents service.

## Scope

1. Define a planning-session model backed by Cloudflare Agents.
2. Define a workflow-driven planning pipeline:
- goal intake
- clarification
- direct planning
- repo-aware research
- approval gate
- execution dispatch
- replanning
3. Define planner-created Logseq task persistence:
- create real `#Task` blocks under the goal block by default
- initialize new planner-created tasks as `Todo`
- inherit `project` and `agent` from goal or plan context when available
- use created task `:block/uuid` as the canonical task identity for later reconciliation
4. Define the handoff from planned task to existing `sessions/create`.
5. Define the frontend direction to replace custom planning-chat transport with Cloudflare-native client primitives where possible.
6. Define persistence boundaries across Logseq graph, Agent/Workflow state, and existing execution-operational state.
7. Define an initial rollout strategy that keeps the execution service unchanged.

## Out of Scope

- Replacing `/sessions` execution APIs.
- Replacing sandbox provisioning or runtime-provider logic.
- Replacing checkpoint persistence.
- Replacing managed auth and GitHub token logic.
- Migrating all existing execution chat/session flows to Cloudflare Agents immediately.
- Full frontend rewrite.

## Workstreams

### WS1: Planning Architecture and Contracts

- Define planning entities and lifecycle.
- Define mapping from Goal, Plan, and Task into Logseq task blocks and execution-session payloads.
- Define the planner task contract:
  - goal block parent
  - task title and content
  - `#Task` marker
  - initial `Todo` status
  - inherited `project`
  - inherited `agent`
  - optional dependency metadata
- Define approval triggers, follow-up task creation, and replanning entrypoints.
- Define reconciliation rules for replanning:
  - match by stored task `:block/uuid` when available
  - fall back to best-effort matching against existing non-started child tasks when necessary
  - update planning-owned fields before execution starts
  - avoid duplicate task creation
  - preserve execution-owned fields once a session exists

### WS2: Cloudflare Agent Planning Session

- Define a planning Agent instance as the canonical interactive planning session.
- Use Cloudflare-native chat, state, and client primitives where possible.
- Minimize or eliminate custom planning transport code.

### WS3: Workflow Orchestration

- Define Workflow steps for decomposition, repo-aware research, approval wait, execution dispatch, and replanning.
- Define retry behavior, failure handling, and pause/resume semantics.
- Define how Workflow state links back to Logseq graph records and planning sessions.

### WS4: Logseq Task Persistence

- Create planner-generated tasks as child blocks under the goal block.
- Make planner-created tasks immediately runnable when inherited `project` and `agent` are present.
- Reuse the existing runnable task shape already consumed by the agent session flow.
- Preserve execution-owned fields such as session id, PR URL, checkpoint metadata, and terminal execution status after a task has started.

### WS5: Execution Handoff

- Define exactly how a planned task becomes a `POST /sessions` request.
- Include project metadata, agent metadata, runtime-provider selection, optional runner pinning, checkpoint reuse, and capability flags.
- Reuse the existing execution API instead of inventing a second runtime control surface.
- Reuse the existing session-to-task-status mapping for planner-created tasks:
  - `created` / `running` -> `Doing`
  - `paused` -> `Todo`
  - `completed` -> `Done`
  - `pr-created` -> `In Review`
  - `failed` / `canceled` -> `Canceled`
- Apply the same execution status sync to planner-created and manually created runnable tasks.

### WS6: Frontend Integration Strategy

- Reuse existing chat UI components where practical.
- Replace custom planning-chat transport with Cloudflare Agent client APIs.
- Keep execution chat/session UI on the existing service unless a later milestone migrates it.

### WS7: Validation and Rollout

- Validate that the planning layer can drive the existing execution backend without adding new custom orchestration endpoints.
- Roll out behind a planning-specific feature flag or internal-only entrypoint.
- Define degraded behavior if Cloudflare Agent or Workflow state is temporarily unavailable.

## Exit Criteria

1. A planning session can be represented as a Cloudflare Agent instance.
2. A planning Workflow can orchestrate decomposition, approval, and execution dispatch durably.
3. Planner-generated tasks appear in Logseq as real `#Task` blocks under the goal block.
4. Planner-created tasks default to `Todo` and inherit `project` and `agent` when available.
5. Replanning updates existing planner-created tasks without creating duplicates.
6. Planned tasks have a documented translation into the existing `sessions/create` contract.
7. The design clearly separates planning state from execution-operational state.
8. The milestone reduces planned custom code by preferring Cloudflare-native planning primitives.
9. Existing `/sessions` execution behavior remains unchanged.

## Validation

- Update the planning architecture document to reflect the new layering and persistence model.
- Review the milestone against the current agents worker contracts before implementation starts.
- Walk through the task-to-`sessions/create` mapping and confirm every required execution field is accounted for.
- Validate planner-created task behavior:
  - tasks are created under the goal block
  - tasks are marked as `#Task`
  - tasks default to `Todo`
  - tasks inherit `project` and `agent` from goal or plan context when present
  - planner reruns reconcile by stored task `:block/uuid`, with title-based fallback before execution starts
  - execution updates status through the existing session-status mapping
  - replanning does not overwrite execution-owned fields after a task has started
- Future implementation should add targeted tests for planning-to-execution contract handling and Workflow integration.

## Defaults Chosen

- Planner-created tasks live under the goal block by default.
- Initial planner-created status is `Todo`.
- `project` and `agent` are inherited from goal or plan context when present.
- Planner-created and manual runnable tasks share the same execution status-sync path.
- Created task `:block/uuid` is the canonical task identity after creation.
