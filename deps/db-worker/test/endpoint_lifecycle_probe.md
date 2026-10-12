# Failed graph open regression

Build `js_api` with the pinned dependencies, then from `deps/db-worker` run:

```sh
node test/endpoint_lifecycle_probe.cjs
```

The probe executes the real compiled Node worker's Transit endpoints against
fresh synthetic graphs under the system temporary directory. It inserts faults
at repair, migration, checksum, listener, SQLite setup, and asynchronous pool
and vector boundaries; it never accesses accounts, remote graphs, or a vector
backend. `DBW_BUILD_DIR` can select a baseline Melange emit tree for comparison.

It checks failed-open cleanup, repeated failures, full initialization on retry,
listener processing of a normal transaction, persistence after reopening,
concurrent opens, pending-open cancellation, graph switches, and continued
teardown after checkpoint or local SQLite-close errors. A ready connection still
uses the fast path. Each scenario restores its fault injectors and closes its
synthetic handles. Exit status is nonzero for a failed assertion or a timeout.

`test_worker_native.ml` also exercises invalid open, retry, and initialization
through the native worker's Transit endpoints.

The probe explicitly exits after recording all results because the existing
Graph_store storage closure keeps a private idle checkpoint timeout alive for
2 seconds after writes. Its interface does not expose cancellation; vector
indexes likewise have no close operation in the current platform interface.
These two resource-release boundaries are outside this regression's guarantees.
