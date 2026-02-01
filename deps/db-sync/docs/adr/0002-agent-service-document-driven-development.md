# ADR 0002: Agent Service for Document-Driven Logseq Development

Date: 2026-02-01
Status: Accepted

## Context
We want to develop Logseq in Logseq by following document-driven development
rules. That requires a reliable agent service that can accept tasks derived
from planning documents (ADRs, PRDs, issue write-ups), run them safely, and
report results back into Logseq.

We need:
- Safe, isolated execution for coding agents.
- A control plane that can orchestrate long-lived sessions, stream events,
  and allow multiple clients to observe the same session.
- A consistent API to swap between coding agents (Codex, Claude Code, etc.)
  without rewriting integrations.

External guidance and tooling:
- Sandbox Agent provides a universal HTTP/SSE API to run multiple coding agents
  inside sandboxes with normalized events and session management. This avoids
  per-agent integration work.
- Ramp's background agent architecture highlights Durable Objects for
  synchronized, multi-client sessions, fast session start, and giving agents
  full tooling context and sandboxed execution.

## Decision
Build an agents service with a Cloudflare control plane and sandboxed runtimes:
1) Cloudflare Workers + Durable Objects handle session state, streaming, and
   multi-client coordination.
2) Each coding session runs inside a sandbox that hosts Sandbox Agent.
3) The control plane talks to Sandbox Agent over HTTP/SSE to create sessions,
   send messages, and stream normalized events.
4) Tasks are assigned to agents from Logseq documents and tracked as
   document-driven work items (ADR/PRD/issue pages).

This lets us support multiple agent backends (Codex, Claude Code, etc.),
centralize session persistence, and keep execution isolated from production.

## Options Considered
1) Local-only agent execution in developer machines
   - Pros: minimal infrastructure
   - Cons: inconsistent environments, limited concurrency, hard to share
     sessions, no reliable background execution

2) Managed third-party agent SaaS
   - Pros: fastest to start
   - Cons: limited control, data residency concerns, difficult to integrate
     with document-driven workflows inside Logseq

3) Cloudflare control plane + sandboxed agents with Sandbox Agent (chosen)
   - Pros: sandbox isolation, durable session state, multi-client access, and
     a universal agent API that can swap Codex/Claude Code without rewrites
   - Cons: new service to maintain; requires Cloudflare and sandbox provider

## Consequences
- Requires building and operating a new Cloudflare-based service.
- Adds dependency on a sandbox provider and Sandbox Agent runtime.
- Enables background, repeatable, and collaborative agent sessions tied to
  Logseq documents.
- Sets a foundation for usage metrics, audit trails, and tool approvals.

## Follow-up Work
- Define a session data model (document ID, task metadata, agent selection,
  auth, status, and event history).
- Implement control plane APIs for create/assign/observe sessions.
- Prototype sandbox provisioning and Sandbox Agent integration.
- Define the Logseq document workflow (how ADRs/PRDs become agent tasks).
- Add observability (logs, metrics, session replay) and a permission model.

## Milestones
1) Architecture + API shape (M1)
   - Confirm document-driven workflow entrypoints and task schema.
   - Define session lifecycle, event model, and required auth surfaces.
   - Draft API contracts for control plane and agent runtime.

2) Control plane prototype (M2)
   - Implement Durable Object session coordination.
   - Add streaming and multi-client observation.
   - Wire basic auth and session persistence.

3) Sandbox + agent integration (M3)
   - Provision sandbox per session and run Sandbox Agent inside it.
   - Implement adapter to select Codex/Claude Code backends.
   - Run end-to-end task execution from Logseq doc to agent output.

4) Operational readiness (M4)
   - Add logs, metrics, and session replay.
   - Add permission model and audit trails.
   - Document setup and rollout for internal dogfooding.

## References
- https://github.com/rivet-dev/sandbox-agent
- https://www.sandboxagent.dev/
- https://builders.ramp.com/post/why-we-built-our-background-agent
