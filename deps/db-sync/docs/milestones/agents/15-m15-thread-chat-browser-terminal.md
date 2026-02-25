# M15: Thread Chat + Cloudflare Browser Terminal

Status: Proposed
Target: Integrate Cloudflare Sandbox browser terminals into the agent thread experience.

## Goal
When a user clicks the thread button, open the agent chat box directly, and provide a terminal connect button next to the selected Agent (for example, `codex`) so the user can open and connect a browser terminal for that session.

## Why M15
- Current thread and agent chat flow does not include terminal access from the same surface.
- Cloudflare Sandbox now provides a browser terminal pattern we can use for safe in-browser shell access:
  - https://developers.cloudflare.com/sandbox/guides/browser-terminals/
- M13 added Cloudflare runtime support, which is the right foundation for session-linked terminal access.

## Scope
1) Thread-to-chat entrypoint:
- Clicking the thread button should always open/focus the agent chat box for that thread.
- Preserve existing behavior for selecting/restoring the active session.

2) Agent header terminal action:
- Add an "Open Terminal" action next to the Agent identity in chat UI.
- Button is visible only when the active session runtime supports terminal connection.

3) Browser terminal session wiring:
- Add backend endpoint(s) to create/reuse a terminal connection for a running agent session.
- Bind terminal access to the same runtime/session identity used by the thread chat.
- Use Cloudflare Sandbox browser terminal flow for terminal creation/connect.

4) Connection lifecycle + UX:
- Show terminal states (`connecting`, `connected`, `disconnected`, `failed`) in UI.
- Support reconnect and explicit close.
- Surface actionable errors in chat when terminal connection fails.

5) Security + observability:
- Ensure terminal connect requests are authenticated and scoped to workspace/thread/session access.
- Emit audit/runtime events for terminal open/close/fail.

## Out of Scope
- Non-Cloudflare terminal providers.
- Full terminal multiplexing across multiple sessions in one panel.
- Redesign of the broader chat layout beyond required M15 controls.

## Workstreams

### WS1: Thread Button to Chat Box
- Update thread button handler to open/focus agent chat box.
- Ensure correct thread/session context hydration.

### WS2: Chat Header Terminal Control
- Add terminal connect button next to Agent label.
- Add capability gating from session/runtime metadata.

### WS3: Worker/Backend Terminal API
- Introduce terminal connect endpoint for active session runtimes.
- Map session runtime metadata to Cloudflare browser terminal provisioning.

### WS4: Frontend Terminal Panel Integration
- Add terminal UI surface (panel/drawer/modal) connected to returned terminal session data.
- Implement status transitions and reconnect/close behavior.

### WS5: Auth, Policy, and Eventing
- Validate collaborator access before issuing terminal sessions.
- Add structured events for terminal lifecycle.

### WS6: Tests + Docs
- Add unit/integration coverage for:
  - thread button chat open behavior
  - terminal button visibility/enablement
  - terminal connect API success/failure handling
- Document env/config and runtime prerequisites for browser terminals.

## Exit Criteria
1) Clicking thread button opens/focuses the agent chat box for that thread.
2) Chat header shows a terminal connect action next to Agent when runtime supports it.
3) User can open and connect a Cloudflare browser terminal for the active session.
4) Terminal lifecycle states and failures are visible and recoverable in UI.
5) Access control and audit events are in place for terminal operations.
