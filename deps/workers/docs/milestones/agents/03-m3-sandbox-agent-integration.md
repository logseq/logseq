# M3: Sandbox + Agent Integration

- Use local sandbox-agent at `~/Codes/projects/sandbox-agent` as the runtime.
- Provision sessions through sandbox-agent HTTP API (`/v1/sessions/{session_id}`).
- Send task messages through `/v1/sessions/{session_id}/messages/stream`.
- Track sandbox session metadata in DO runtime state.
- Implement adapter to select Codex/Claude Code backends.
- Run end-to-end task execution from Logseq doc to agent output.
