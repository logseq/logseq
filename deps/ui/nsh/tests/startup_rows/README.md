# Actual production row qualification

`real_application_rows_1k` and `real_application_rows_100k` run the real App,
OCaml library, isolated credential store and private DB worker through the public
NSH Headless engine. They use the startup gate's temporary graph/home/state and
owned-worker cleanup. No Dune rule, graph SQL, replacement worker or model
injection is involved.

The Node helper uses the already-installed `transit-js` dependency and the
existing `/v1/invoke` protocol. Each invocation checks `/healthz` against the
canonical private graph root before ordinary insert/save/delete outliner ops.
The seeded current journal is also opened through its existing title click,
exercising the actual Page producer.

F8 is a qualification-only native command binding around the App, without an
extra View. It uses public `NodeRef::scroll_to` on the actual Scroll ID obtained
from public layout. `Headless::scroll` deliberately simulates every intermediate
wheel step; using it for a 100k-row jump would measure a full traversal instead
of bounded distant demand. The normal Headless platform still applies/reports
the resulting native command. No scroll position is forged in Core or Screen.

Both source sizes must keep at most 128 seeded row roots and at most 8,000
additional logical/native nodes over the empty-App baseline at a 1440x900
viewport. The first and last sentinel must have positive native bounds that
intersect the actual main viewport. Both Journal and Page must retain UUID and
native row roots across a one-row Unicode worker edit; one edit may create at
most 1,024 native nodes. Clear must remove all seeded rows and retain the main
Scroll. These fixed render budgets do not grow with business source size.

JSON lines prefixed `NSH_PRODUCTION_ROWS` report render counts, native patch
churn, recent engine timings, UI-process memory/CPU and mutation/settle durations.
The engine's memory sample can be absent before an idle collection, and is
reported as null. Engine timing distributions cover recent commits; they are
not phase-isolated presentation timings. The existing full page-tree fetch and
graph/model/worker memory can grow with data size. This gate does not qualify
native pixels, animation presentation, caret geometry, IME, or editing through
the native block-editor input: its edits are normal external worker writes.

After building fresh actual native artifacts and installing the locked UI-local
Node dependencies, run from the checkout root (macOS filenames below):

```sh
LUI_OCAML_LIBRARY="$PWD/deps/ui/_build/nsh/liblogseq_ui.dylib" \
LOGSEQ_NATIVE_ASSET_DIR="$PWD/deps/ui/_build/Resources" \
LOGSEQ_DB_WORKER_BIN="$PWD/deps/ui/_build/Resources/logseq-db-worker" \
cargo test --locked --manifest-path deps/ui/nsh/Cargo.toml \
  --test startup_preflight -- --exact real_application_rows_1k --nocapture
```

Repeat with `real_application_rows_100k`. Linux uses `liblogseq_ui.so`; Windows
uses the actual built DLL/worker paths. Each case launches a fresh child process.
The 300-second process deadline bounds setup, graph writes and cleanup; it is
not a claimed interaction latency budget. Backend diagnostics, missing content,
unbounded render counts, identity loss, malformed protocol replies and ownership
mismatches fail the case explicitly.

## Runtime heap configuration

The real startup gate and row gates query `gc-stats` and the owned worker's
`/healthz` `native-gc` field without collecting or compacting. They require the
bridge's default of 2,097,152 machine words in both runtimes.
`real_application_minor_heap_override` exercises the same actual application
with `OCAMLRUNPARAM=s=1M` and requires 1,048,576 words in both runtimes. These
assertions qualify configured capacities, not physical memory consumption or
interaction latency. The child environment is isolated from the build shell's
OCaml heap settings, and each case still owns its private graph and worker.
