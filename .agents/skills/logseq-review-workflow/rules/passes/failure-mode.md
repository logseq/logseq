# Failure-mode Pass

Inspect how the reviewed change behaves when operations fail or stop halfway.

Check:

- error propagation, user-visible errors, logs, and swallowed exceptions
- fail-fast behavior versus silent recovery from programmer errors
- cancellation, retries, timeouts, and async cleanup
- transaction atomicity, partial writes, duplicate writes, and rollback assumptions
- file system, network, IPC, worker, and interop failures
- resource cleanup, listener cleanup, and state consistency after failure

Return results using [`subagent-output.md`](./subagent-output.md).
