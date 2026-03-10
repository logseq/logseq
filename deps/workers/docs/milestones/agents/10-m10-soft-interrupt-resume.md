# M10: Soft Interrupt + Resume

## Target
Allow collaborators to pause and resume sessions without terminating runtimes.

## Scope
- UI buttons: Interrupt (pause), Resume.
- Wire to existing pause/resume endpoints.
- Ensure collaboration permissions are respected.

## Acceptance
1) Interrupt pauses progress without canceling session.
2) Resume continues processing queued work.
3) Status transitions are visible in stream.
