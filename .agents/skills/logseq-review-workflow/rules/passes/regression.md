# Regression Pass

Inspect the reviewed change for behavior that may break existing users, graphs, runtimes, or persisted data.

Check:

- compatibility with existing DB graphs, file graphs, synced graphs, and persisted settings
- migration, schema, property, protocol, and config compatibility
- changed CLI output, command behavior, user workflows, keyboard flows, or public APIs
- renderer, Desktop, Electron main-process, db-worker-node, mobile, and server/runtime differences
- removed compatibility that is not justified by a current contract
- edge cases in older graph data or partially migrated state

Return results using [`subagent-output.md`](./subagent-output.md).
