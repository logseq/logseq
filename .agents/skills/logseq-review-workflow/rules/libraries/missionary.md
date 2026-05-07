# Missionary Review Rules

Apply when a change uses Missionary tasks, flows, signals, reactive streams, subscriptions, or scheduler integration.

## Review focus

- Every started flow/task should have a clear owner and disposal path.
- Cancellation should be explicit and should release listeners, timers, watchers, and in-flight work.
- Stream semantics should match the UI/runtime need: latest value, every value, debounced value, or ordered side effects.
- Errors should propagate to the owning runtime or be handled with a visible/logged outcome.
- Reactive computations should avoid retaining graph-specific data after graph switch.

## Red flags

- Starting flows from render paths without lifecycle ownership.
- Missing cancellation when a component unmounts, graph changes, worker stops, or window closes.
- Dropping errors inside tasks or converting them to silent nils.
- Assuming ordering where the flow can interleave or restart.
- Backpressure-sensitive sources connected to unbounded consumers.

## Review questions

- Who starts the task/flow, and who stops it?
- What happens on rapid graph switching or component remounting?
- Are stale values suppressed when a newer task wins?
- Can failures be observed in logs/tests?
- Is there a test or runtime reproduction for timing-sensitive behavior?
