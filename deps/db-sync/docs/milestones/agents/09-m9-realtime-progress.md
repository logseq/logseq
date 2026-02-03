# M9: Realtime Progress Viewer

## Target
Render live session events from `/sessions/:id/stream` in Logseq UI.

## Scope
- Stream client in UI.
- Display agent messages, command output, and status transitions.
- Support reconnect (resume stream on reload).

## Acceptance
1) User sees live updates as session runs.
2) Stream reconnects and continues after reload.
3) Errors are surfaced without losing session history.
