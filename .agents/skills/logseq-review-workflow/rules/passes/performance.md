# Performance Pass

Inspect the reviewed change for realistic performance and resource regressions.

Check:

- query shape, indexes, pull selectors, repeated scans, and N+1 access
- repeated schema construction, parsing, serialization, or large data conversions
- render loops, reactive recomputation, cache invalidation, and unnecessary subscriptions
- memory retention, listener leaks, unbounded collections, and long-lived references
- work that scales poorly with large graphs, many blocks, many pages, or sync history
- startup, command latency, import/export, search, and background worker impact

Return results using [`subagent-output.md`](./subagent-output.md).
