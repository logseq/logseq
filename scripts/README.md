## Description
This is a collection of development related scripts, written as bash scripts, bb/babashka scripts and nbb scripts.

## Usage

### Native profiling

`native_profile_run.py` records one isolated macOS demo-graph idle or Enter
workload. It creates a fresh SQLite backup, starts a dedicated worker, samples
GUI/worker memory, and kills both above a combined 200 MB RSS or physical
footprint. Build the application before recording and keep builds/tests out of
the measurement interval. Output directories must not already exist.

Compile `native_input_events.c` as a macOS dynamic library against SDL2, for
example with the bundled application library and locally installed headers:

```sh
clang -dynamiclib -O2 $(pkg-config --cflags sdl2) scripts/native_input_events.c \
  -L/path/to/LogseqNative.app/Contents/Frameworks -lSDL2-2.0.0 -o /tmp/native-input.dylib
```

The application must resolve that same SDL2 library through its rpath. Input
lines contain elapsed milliseconds, an event name, and arguments. For example,
`8000 key 13 0` followed by `8010 release 13 0` sends one Enter. Supported events
are `move`, `down`, `up`, `text`, `key`, `release`, `wheel`, `resize`, and `quit`;
text events hold at most 31 UTF-8 bytes. Replay uses logical window coordinates.
Use a stable graph-specific click/focus sequence before keyboard input.

```sh
python3 scripts/native_profile_run.py --help
python3 scripts/native_profile_run.py \
  --baseline /path/to/inactive-demo-root --output /tmp/native-enter-run-1 \
  --executable /path/to/LogseqNative.app/Contents/MacOS/LogseqNative \
  --worker /path/to/db-worker --input-script /tmp/enter.script \
  --input-library /tmp/native-input.dylib --scenario enter --backend metal \
  --build-profile release --lui-revision <installed-revision> \
  --duration-s 30 --expected-actions 50
python3 scripts/native_profile_report.py /tmp/native-enter-run-1/recording.json
python3 -m unittest discover -s scripts -p 'test_native_profile_*.py'
```

The baseline root must contain `last-repo`, `server-list`, and the demo graph's
database, client-operations database, and search database. The runner preserves
raw `memory.jsonl`, `metrics.jsonl`, input/worker logs, hashes, block counts, and
`outcome.json`, including when the memory guard terminates the workload.
Successful collection writes `recording.json` and a diagnostic `report.json`.
Build-profile and installed LUI revision labels describe the caller's build;
binary hashes identify the actual executable and worker used.

These reports distinguish injected, handled, and persisted actions. UI
settlement remains unverified by this SDL runner, so it does not report
completed-action costs or acceptance success. Quantiles with fewer than 20
observations or lost ring samples remain unknown. Native and external sampling
clocks remain separate. Software-renderer controls and hidden windows cannot
certify the default renderer, visible FPS, OS focus, or IME behavior. The full
protocol and current results are in the
[native latency investigation](../docs/agent-guide/proposed/bugfix/2026-10-13-native-host-interaction-latency.md).

### Babashka scripts
Most bb scripts live under `src/` and are defined as bb tasks. See [babashka tasks](../docs/dev-practices.md#babashka-tasks)

### Nbb scripts

Before running [nbb-logseq](https://github.com/logseq/nbb-logseq) scripts, be sure to have node >= 18.14 installed as well as a recent [babashka](https://github.com/babashka/babashka) for managing the dependencies in `nbb.edn`. Then `pnpm install` to install dependencies

#### Create graph scripts

These scripts generate custom database graphs written with nbb-logseq. If this is
your first time generating a DB graph, first try the
`dev:create` bb task in [db graph
tasks](../docs/dev-practices.md#db-graph-tasks) as it only requires writing EDN.

Creating graphs from the commandline using scripts and a concise EDN map is
possible thanks to nbb-logseq and the namespaces
[logseq.outliner.db-pipeline](../deps/outliner/src/logseq/outliner/db_pipeline.cljs)
and [logseq.db.sqlite.build](../deps/db/src/logseq/db/sqlite/build.cljs).  For
example, the `create_graph_with_properties.cljs` script uses this ns to create a
graph with a variety of properties:

```
$ pnpm exec nbb-logseq src/logseq/tasks/db_graph/create_graph_with_properties.cljs woot
Generating 16 pages and 24 blocks ...
Created graph woot!
```

**NOTE**: To use this created graph, click on the three dots menu in the upper right corner and select `Import`. Then click on the `SQLite` import button and upload the generated graph.

This script creates a DB graph with blocks containing several property types for
both single and many cardinality. It also includes queries for most of these
properties. Read the docs in
[logseq.db.sqlite.build](../deps/db/src/logseq/db/sqlite/build.cljs)
for specifics on the EDN map.

To create large graphs with varying size:

```
$ pnpm exec nbb-logseq src/logseq/tasks/db_graph/create_graph_with_large_sizes.cljs large
Building tx ...
Built 21000 tx, 1000 pages and 20000 blocks ...
Transacting chunk 1 of 21 starting with block: #:block{:name "page-0"}
...
Created graph large with 187810 datoms!

# To see options available
$ pnpm exec nbb-logseq src/logseq/tasks/db_graph/create_graph_with_large_sizes.cljs -h
Usage: $0 GRAPH-NAME [OPTIONS]
Options:
  -h, --help        Print help
  -p, --pages  1000 Number of pages to create
  -b, --blocks 20   Number of blocks to create
```

Another example is the `create_graph_with_schema_org.cljs` script which creates a graph
with the https://schema.org/ ontology with as many of the classes and properties as possible:

```
$ pnpm exec nbb-logseq src/logseq/tasks/db_graph/create_graph_with_schema_org.cljs schema
Skipping 67 superseded properties
Skipping 25 properties with unsupported data types
Renaming 1 properties due to page name conflicts
Generating 2268 pages with 900 classes and 1368 properties ...
Created graph schema!
```

#### Update graph scripts

For database graphs, it is recommended to use
`logseq.outliner.db-pipeline/add-listener!` when updating graphs. TODO
