# Promesa Review Rules

Apply when a change uses `promesa`, JavaScript promises, async JS interop, or promise-returning Logseq functions.

## Review focus

- Promise-returning functions should have names that make async behavior visible, generally starting with `<`.
- Async chains should return the final promise; do not start async work and discard it unless intentionally fire-and-forget with logging.
- Errors should propagate to the caller or be handled with an explicit user/runtime outcome.
- Promise composition should keep control flow readable and avoid nested callback pyramids.
- Shared mutable state captured across async boundaries should be reviewed for races and stale graph/window state.

## Red flags

- Missing `return`/final promise in JS interop or CLJS promise chains.
- `p/catch` that logs and swallows an error without a successful fallback contract.
- Fire-and-forget side effects that can outlive the graph, component, worker, or window.
- Mixing callbacks, promises, and atoms without clear sequencing.
- Updating UI or DB state after the owning graph/window/component is no longer current.

## Review questions

- Which caller observes completion or failure?
- What happens if the promise rejects halfway through a multi-step operation?
- Are concurrent invocations safe and ordered if order matters?
- Is cancellation or stale-result suppression needed?
- Do tests cover rejection paths, not only fulfilled paths?
