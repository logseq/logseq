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
4) use vercel ai sdk for ai chat
5) update task status in real-time
6) terminate sandbox when task is done
