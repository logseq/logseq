# Agent Service M1: Architecture + API Shape

Date: 2026-02-01
Status: Accepted

## Goals
- Define document-driven workflow entrypoints and task schema.
- Define session lifecycle, event model, and auth surfaces.
- Draft API contracts for control plane and agent runtime.

## Non-goals
- Implementation details for Durable Objects, storage, or sandbox provisioning.
- UI design inside Logseq.
- Security hardening beyond the initial auth surfaces.

## Architecture Overview
- Logseq (document-driven UI) creates tasks from ADR/PRD/issue pages.
- Agents service control plane (Cloudflare Worker + Durable Objects) manages
  session state, streaming, and multi-client observers.
- Sandbox runtime runs Sandbox Agent per session and exposes a universal
  HTTP/SSE interface for multiple coding agents.
- Control plane forwards user/task input to Sandbox Agent and streams events
  back to Logseq for traceability.

## Document-Driven Workflow Entrypoints
- A task is any node tagged with #Task (page or block is not distinguished).
- ADR pages: #Task nodes capture decision follow-up work.
- PRD pages: #Task nodes capture implementation or research tasks.
- Issue pages: #Task nodes capture bugfix or investigation tasks.
- Each task links back to the source node and captures a context snapshot.

## Task Extraction Rules
- Only nodes with #Task are eligible.
- Task identity is stable by node-id, not by title text.
- Context snapshot includes:
  - node content (string or rendered content)
  - outbound references (linked pages, blocks)
  - file attachments explicitly referenced by the node
- Snapshot is captured at session creation and stored with node-revision.

## Task Schema
- id: unique task id
- source:
  - node-id
  - node-title
  - node-revision (hash or timestamp)
  - snapshot (content + references + attachments)
- intent:
  - title
  - summary
  - constraints (list of strings)
  - deliverables (list of strings)
- agent:
  - provider (codex | claude | other)
  - model (string)
  - tools (list of tool ids)
- execution:
  - repo (name or url)
  - workdir
  - env (key/value map)
  - timeout-seconds
- audit:
  - requested-by
  - requested-at
  - priority

## Session Lifecycle
1) created: task accepted and session id issued.
2) provisioned: sandbox allocated and ready.
3) running: agent is processing tasks.
4) paused: waiting for user input or approval.
5) completed: agent finished with summary and artifacts.
6) failed: unrecoverable error, with diagnostics.
7) canceled: explicitly stopped.

## Event Model
Common envelope:
- event-id
- session-id
- type
- ts
- data

Event types (minimum):
- session.created
- session.provisioned
- session.running
- session.paused
- session.completed
- session.failed
- session.canceled
- agent.message
- agent.tool_call
- agent.tool_result
- agent.artifact
- agent.summary
- agent.approval_requested
- agent.approval_granted
- audit.log

Approval payload:
- request-id
- tool-id
- reason
- expires-at
- decision (granted | denied)

## Auth Surfaces
- Logseq -> control plane: user auth + graph/workspace authorization.
- Control plane -> sandbox agent: session token scoped to a single session.
- Observers: read-only stream token to subscribe to events.

## Logseq Sync
- Task node properties store session-id and status.
- Status transitions mirror session lifecycle (created, running, paused, completed,
  failed, canceled).
- Final agent summary is appended under the task node as a child block.

## API Contracts (Draft)
### Control Plane
- POST /sessions
  - request: task schema + initial message
  - response: session-id, stream-url, status
- GET /sessions/:id
  - response: session status + task metadata
- POST /sessions/:id/messages
  - request: user message or approval
  - response: accepted
- POST /sessions/:id/cancel
  - response: accepted
- GET /sessions/:id/stream
  - server-sent events stream of event model

Errors and idempotency:
- POST /sessions accepts an idempotency-key header.
- 400: invalid task schema
- 401/403: auth or workspace mismatch
- 404: session not found
- 409: conflicting session state (e.g., message after completion)
- 429: rate limit

### Sandbox Agent Runtime
- POST /sandbox/sessions
  - request: agent config + repo/workdir
  - response: sandbox session-id
- POST /sandbox/sessions/:id/messages
  - request: agent message
  - response: accepted
- GET /sandbox/sessions/:id/stream
  - server-sent events of normalized agent events

## Example: Session Creation Payload
```json
{
  "id": "task-123",
  "source": {
    "node-id": "uuid-1",
    "node-title": "Improve db-sync docs",
    "node-revision": "2026-02-01T10:12:00Z",
    "snapshot": {
      "content": "Document the db-sync agent workflow #Task",
      "references": ["docs/agent-guide/db-sync/db-sync-guide.md"],
      "attachments": []
    }
  },
  "intent": {
    "title": "Write db-sync agent workflow doc",
    "summary": "Document how agents run db-sync tasks",
    "constraints": ["follow ADRs", "keep change minimal"],
    "deliverables": ["new doc in docs/agent-guide/"]
  },
  "agent": {
    "provider": "codex",
    "model": "default",
    "tools": ["filesystem", "shell"]
  },
  "execution": {
    "repo": "logseq/web",
    "workdir": "deps/db-sync",
    "env": {
      "LOGSEQ_GRAPH": "main"
    },
    "timeout-seconds": 1800
  },
  "audit": {
    "requested-by": "user-1",
    "requested-at": "2026-02-01T10:12:05Z",
    "priority": "normal"
  }
}
```
