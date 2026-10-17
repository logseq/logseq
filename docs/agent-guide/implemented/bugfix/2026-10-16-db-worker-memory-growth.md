# Db Worker Memory Growth

## Problem

The Electron desktop DB worker uses excessive memory when opening a graph and
after editing or syncing. The user requested reproduction and a fix on the latest
`dev` branch, including startup measurements.

The runtime investigation used Electron 42.3.0 on macOS arm64 with the native
OCaml 5.5.0 daemon that Electron actually spawns. The renderer was rebuilt from
`ec9dc73b8c`; stale generated assets and missing npm dependencies were refreshed
before collecting desktop evidence. User graphs were only read through SQLite
backups; all writes went to disposable graph copies.

The original graph persisted `:ref-type :strong`. DataScript native additionally
forced strong references while restoring indexes. The worker then cached every
decoded storage payload in another strong hash table. A runtime trace observed
18,688 cached payloads containing 333,115 index datoms. Full major GC left the
live heap essentially unchanged, and all three runtime indexes reported strong
references. Whole-graph startup work made these caches retain scanned nodes.

## Proposal

Use weak PSS references when restoring worker snapshots and remove the redundant
strong decoded-payload cache in `deps/db-worker/lib/graph_store.ml`. Disable the
native strong-index override in the sibling `datascript-ocaml` dependency's
`impl/platform/native/platform.ml`. Preserve pending write buffers, lazy index
reads, immutable snapshots, and durable transactions. Add regression coverage
before changing the implementation and repeat actual Electron measurements.

The only committed read cache retained by the worker is one current root payload
containing schema and index addresses. It contains no index-node datom arrays and
is invalidated by root writes, root deletion, or persistence failure. This avoids
decoding schema on every connection fence check. Pending write buffers remain
strong until their transaction commits.

Changes span two repositories: Logseq and the sibling `datascript-ocaml` checkout.
The native dependency is locally pinned to that checkout for validation. Its
native-policy change was merged in datascript-ocaml PR #45 at `5d76912` and the
local checkout and installed native package were refreshed from that revision.

Further investigation of the remaining footprint found that index construction
held all entity caches until completion and repeatedly copied its accumulated
result list. Build from entity IDs and materialize only the current batch. Retain
results only when vector indexing needs them, with linear list accumulation.
Bucket accent replacements by their first character and compare without
allocating a closure for every candidate at every input position.

The native daemon also needs an idle heap release: OCaml 5 sweeps empty pools
into a global freelist instead of unmapping them, and does not finish collection
while a process is idle and allocating nothing. After at least five seconds
without an invocation and 32 MiB of major allocations since the previous release,
check inactivity under the invocation mutex, release it, and compact. Active
database requests prevent the check from acquiring that mutex. The compaction
itself must not hold it because signal handlers close the graph through the
same serialized invocation path.

## Decision

Use weak PSS references for worker snapshots, remove the unbounded decoded-node
cache, and retain only pending writes plus one current root metadata payload.
Disable the native strong-reference override in the dependency and integrate both
repositories together. Bound index-build retention and normalization allocation,
and release native burst capacity during an idle window rather than on the
indexing request path.

## Alternatives considered

### Bound the outer cache while keeping native strong PSS references

An initial 256-entry cache bounded repeated-edit retention, but left native PSS
references strong and did not resolve startup retention. The user explicitly
requested weak references and measurement of the actual Electron worker first.

### Change only the native PSS override

The measured graph itself persisted `:ref-type :strong`, and the outer cache kept
decoded payloads strongly. Both worker policy and redundant caching must change.

## Acceptance criteria

- Record startup peak and idle memory with identical graph data before and after.
- Repeated fixed-size edits must not retain an ever-growing set of old payloads.
- Reads and writes remain correct after collection, close, and reopen.
- Storage failure fencing and rollback regressions continue to pass.
- Index construction must not retain all entity caches or repeatedly copied lists.
- The native worker releases burst memory while idle and does not compact during
  a sustained stream of requests.

### Reproduction and lifecycle verification

- Before implementation, the new native memory test failed: editing a fixed set
  of 128 entities with 4 KiB titles grew retained memory from 10,644,624 bytes
  after 2,000 edits to 27,743,952 bytes after 6,000 edits.
- All three assertions that a reopened worker index uses weak references also
  failed. The dependency storage test independently failed because a persisted
  weak policy was overridden by native strong references.
- After the fix, the same memory test retained 2,095,424 then 2,399,528 bytes.
  Old snapshots remained readable after later edits and collection, all 128
  final titles survived close/reopen, and all three reopened indexes were weak.
- The dependency test verifies both collection/reload under weak references and
  preservation of an explicitly requested strong policy for non-worker callers.
- `opam exec -- dune runtest` in `deps/db-worker` passed after the final root-cache
  change, including 975 general DB cases, 286 sync cases, 33 multi-client sync
  simulations, 151 worker JavaScript cases, 95 desktop JavaScript cases, and the
  native lifecycle/storage smoke tests.
- `opam exec -- dune exec test/test_storage.exe` and
  `opam exec -- dune exec test/test_conn.exe` passed in `../datascript-ocaml`.

### Electron benchmark

Three alternating before/after pairs used separate SQLite backups of the same
39,927,808-byte graph with 25,548 UUID entities, fresh search databases, and the
same renderer/profile template. Measurements used the actual Electron-spawned
native workers. No test suite ran concurrently with the final benchmark.

The driver waited for the search-build request and for the renderer's indexing
indicator to disappear before sampling steady memory. Earlier fixed-delay and
test-overlapped experiments are excluded. The original diagnostic used `Gc.stat`,
which itself performs a full major collection in OCaml 5.5. Thus the first table's
post-index footprint is after that collection, not an untouched idle sample.
Follow-up measurements use `Gc.quick_stat` to avoid changing collection state.

Median results:

| Measurement | Before | After | Change |
| --- | ---: | ---: | ---: |
| Live heap after full major GC | 53.67 MiB | 4.80 MiB | -91.1% |
| Footprint after indexing and diagnostic full major GC | 161.6 MiB | 96.3 MiB | -40.4% |
| Footprint after diagnostic compact GC | 86.8 MiB | 33.2 MiB | -61.8% |
| Page content visible | 3.61 s | 4.97 s | +37.4% |
| First search-index build completed | 10.84 s | 19.82 s | +82.9% |
| First count query after GC | 57.47 ms | 56.61 ms | -1.5% |
| Mean point pull, 2,000 requests after 100 warmups | 0.202 ms | 0.250 ms | +23.8% |
| 3,000 fixed-set title transactions | 1.505 s | 1.874 s | +24.5% |

The transaction timing excludes explicit diagnostic GC calls between 500-edit
phases. Their retained heaps plateaued through 3,000 transactions. Both variants
returned exactly 25,548 UUID entities. This is a three-run development-profile
comparison on one Mac, not a release performance guarantee.

Local evidence is under `tmp/db-worker-memory/`:

- `benchmark-summary.json` contains all medians, samples, and percentage changes.
- `bench-{before,after}-steady-{1,2,3}/result.json` contains individual results.
- Each run also retains worker calls, memory samples, `vmmap` output, and a
  screenshot after indexing completed.
- `desktop_matrix.cjs`, `desktop.cjs`, and `serve.py` contain the benchmark driver.
- `native-policy-red.log`, `native-root-cache-green.log`, and
  `worker-final-runtest.log` retain regression and full-suite evidence.

### Remaining footprint: native allocator and index-build follow-up

After the weak-reference fix, an untouched worker still held roughly 100 MiB
after indexing and a minute without database activity. Full major GC left its
footprint essentially unchanged. This is distinct from retained graph data.

The local OCaml 5.5.0 `runtime/shared_heap.c` explains the discrepancy:
`pool_release` removes an empty pool from the domain's heap statistics and links
it onto `pool_freelist.free`, without unmapping it. The fourth phase of
`caml_compact_heap` unmaps that global freelist as well as evacuated local pools.
Consequently, `Gc.quick_stat().heap_words` excludes some still-mapped memory.

Direct LLDB reads of the actual Electron worker confirmed this. In
`footprint-pools-2`, after full major collection:

- 884 completely empty global pools remained mapped: 27.625 MiB at 32 KiB each.
- The active heap had another 3,134,147 free words, or 23.91 MiB, alongside
  4.89 MiB of live objects.
- `sqlite3_memory_used()` reported 5,764,832 bytes, or 5.50 MiB. This is SQLite's
  allocation counter, not an attribution of all malloc regions to SQLite.
- Diagnostic compaction cleared the global freelist to zero and reduced
  footprint from 85.2 to 36.2 MiB. SQLite's allocation counter stayed unchanged.

The structural fixes were measured independently before adding idle release:

- Allocation sampling attributed about 26 GiB of transient allocations to the
  inner accent-comparison closure during startup/indexing of this graph.
- Processing 10,000 ASCII bytes allocated 257,860,232 bytes before the fix and
  180,232 bytes after it. The mixed Unicode case fell from 464,705,232 to
  201,232 bytes. Output and replacement precedence remain covered by tests.
- At the completion callback of an actual 8,000-block SQLite search build, full
  collection still retained 9,660,408 extra bytes before the batch change and
  220,416 afterward. The index contains all 8,000 expected rows.
- In the actual 23,228-block Electron index build, the last sampled heap dropped
  from about 71 MiB to 15 MiB; not-yet-collected live data dropped from about
  67 MiB to 7.6 MiB. These in-flight GC counters include floating garbage and
  should not be interpreted as the final reachable graph size.

`footprint-idle-red` reproduced 86.1 MiB after 15 seconds without requests before
native idle release was implemented. The same Electron flow in
`footprint-idle-green` passed afterward:

| Phase | Footprint | Compactions |
| --- | ---: | ---: |
| Index complete, before maintenance | 82.1 MiB | 0 |
| Seven seconds of repeated real pull requests | 82.3 MiB | 0 |
| After requests stopped and idle maintenance ran | 29.5 MiB | 1 |

The last row is automatic maintenance, before invoking either diagnostic full
major GC or diagnostic compaction. Querying afterward still returned exactly
25,548 UUID entities. The maintenance log measured 79.5 ms for that release;
the separate diagnostic compaction request measured about 24 ms. Other builds
and tests on the machine varied CPU availability, so these wall-clock samples
are not a reliable indexing-speed comparison.

Evidence includes `search-memory-red-confirmed.log`,
`search-memory-final-green.log`, `search-js-green.log`,
`footprint-pools-2/{result.json,pools-major.txt,pools-compact.txt}`,
`footprint-idle-red/idle-assertion.json`, and
`footprint-idle-green/{result.json,idle-assertion.json}` under the same local
evidence directory. The temporary debugger endpoints, allocation sampler, and
stage checkpoints are not part of shipped source. Idle heap maintenance is.

### Final incremental benchmark and remaining malloc capacity

A final fresh-backup Electron pair compared the merged weak-reference dependency
and bounded root cache against those same changes plus the search and idle-heap
fixes. This isolates the follow-up work; it is not the original strong-cache
baseline in the first table. No diagnostic GC ran during this pair.

| Measurement | Before follow-up | After follow-up |
| --- | ---: | ---: |
| Footprint before idle maintenance | 108.7 MiB | 86.1 MiB |
| Footprint after initial idle period | 108.7 MiB | 31.9 MiB |
| Footprint after count query and another idle period | 108.7 MiB | 36.9 MiB |
| Footprint after 3,000 title transactions and idle | 153.6 MiB | 73.7 MiB |
| Startup/index CPU time, user plus system | 19.13 s | 15.93 s |
| Mean point pull, 2,000 requests after 100 warmups | 0.267 ms | 0.285 ms |
| Point-pull p95 | 0.385 ms | 0.424 ms |
| 3,000 fixed-set title transactions | 1.904 s | 1.878 s |

These are one development-profile pair on a shared machine, so the small RPC
timing differences are not conclusive. Startup/index allocation fell about 56%
and CPU time about 17%. Seven seconds of sustained pull requests did not trigger
compaction; the subsequent idle release took 23.4 ms. The post-edit idle release
took 21.2 ms. Both runs returned exactly 25,548 UUID entities.

The final 73.7 MiB editing footprint is not all retained graph data. At that
checkpoint, `Gc.quick_stat` reported a 9.09 MiB managed heap, with about 8.50 MiB
of not-yet-collected live words. `vmmap` reported only 12.9 MiB allocated in the
default malloc zone but 45.0 MiB of dirty/swapped fragmentation, including 33.3 MiB
dirty in regions labeled `MALLOC_SMALL (empty)`. VM_ALLOCATE resident memory was
10.0 MiB. These measurements identify allocator-retained capacity; they do not
attribute all malloc allocations to SQLite, nor establish that malloc capacity
would stay bounded under every editing workload. No platform-specific malloc
purge was added. The earlier fixed-set regression verifies that obsolete decoded
payloads no longer accumulate through 6,000 edits.

Evidence is in `footprint-final-{before,after}-1/result.json` and the corresponding
`vmmap-*.txt` files. The final native executable was rebuilt without diagnostic
endpoints and `dune runtest` passed again. Actual Electron persistence was tested
with `thread-api/apply-outliner-ops` using `save-block` on a normal block, followed
by closing Electron and reopening the same disposable graph with a new worker
process. The edited title survived and the UUID count stayed 25,548; evidence is
in `footprint-reopen-clean/reopen-result.json`.

### Comparison with master CLJS

Three controlled Electron pairs compared master `4cf26891c1` (CLJS worker) with
native worker code at `db04e523c5`. Both used Electron 42.3.0 on the same Mac,
development builds, a fresh backup of the same graph, fresh search databases,
and the same existing page UUID. The controlled page differs from the journal
view used above, so these memory values should be compared within this table.
Run order was CLJS/native, native/CLJS, then CLJS/native. Builds and tests were
finished before measurements; neither runtime received diagnostic GC requests.

The driver waited for visible blocks, the search-build request, and the indexing
indicator to disappear. It then sampled memory, waited 15 seconds without probe
requests, checked the UUID count, warmed 100 point pulls, measured 2,000 pulls,
and submitted 3,000 raw title transactions over a fixed set of 128 entities with
2 KiB titles. A second 15-second idle period preceded the final memory sample.
These are worker HTTP RPC timings, not keyboard-edit latency. Every run returned
25,548 UUID entities, persisted 17,902 search rows, and returned the last written
title. All six runs had no renderer exceptions; development React warnings were
present in both versions.

Median results:

| Measurement | Master CLJS | Fixed native | Native change |
| --- | ---: | ---: | ---: |
| Startup/index peak footprint | 313.5 MiB | 45.5 MiB | -85.5% |
| Footprint after indexing and idle | 312.9 MiB | 28.5 MiB | -90.9% |
| Footprint after transactions and idle | 192.5 MiB | 64.1 MiB | -66.7% |
| Peak RSS over the whole run | 351.5 MiB | 81.5 MiB | -76.8% |
| Page blocks visible | 4.46 s | 5.57 s | +24.7% |
| First index build completed | 16.53 s | 18.85 s | +14.0% |
| Worker CPU time through index completion | 12.06 s | 14.18 s | +17.6% |
| Mean point pull | 0.216 ms | 0.237 ms | +9.9% |
| Point-pull p95 | 0.324 ms | 0.337 ms | +4.0% |
| 3,000 title transactions | 5.885 s | 1.761 s | -70.1% |

Post-index idle footprint ranged from 311.4–313.9 MiB for CLJS and 25.8–29.2 MiB
for native. Post-transaction idle footprint ranged from 186.0–278.4 MiB and
48.5–70.1 MiB, respectively: natural GC timing and allocator capacity affect
those samples. These development-profile results do not establish release-build
performance. They show lower native memory and transaction time alongside a
slower first index build and a small point-pull cost in this workload.

Evidence is in `compare-master-summary.json`, `compare-master-{cljs,native}-{7,8,9}`,
and `compare-master-final-controlled.log` under `tmp/db-worker-memory/`.
`compare-master.cjs`, `compare-desktop.cjs`, and `summarize-master.py` contain the
local driver and validation. Master was built in an isolated checkout with
`clojure -J-Xmx4096m -J-XX:ActiveProcessorCount=4 -M:cljs compile app db-worker
db-worker-node electron` and a development webpack app bundle; the native
executable was the normal `dune build bin/main.exe` output. Original graphs and
the PR's worker source were unchanged by this comparison.

## Risks

- Collection trades decoded-memory retention for additional SQLite reads.
- Native and Melange runtimes have different GC policies; measure them separately.
- Idle compaction pauses native work and drops collectible index caches. It is
  gated by both inactivity and allocation volume; it does not run on every idle
  tick. It checks the invocation mutex before starting, but incoming work can
  still encounter a GC pause. Memory-return behavior was measured on OCaml 5.5.0.
- The original weak-cache benchmark showed a slower first search-index rebuild
  and smaller point-pull/transaction throughput costs. The follow-up reduced
  indexing CPU and allocation, but does not establish parity with strong caches.
- Native malloc retains additional empty capacity after the bulk-edit probe;
  the final editing footprint does not return to the startup idle value.
- Authenticated live remote sync was not exercised. Multi-client sync simulations
  and actual Electron open/query/transaction/close flows were verified.

## Consequences

Scanned index nodes and obsolete titles become collectible. Index construction
keeps batch-sized entity state, text normalization avoids candidate-sized
allocation, and the native runtime returns burst capacity after becoming idle.
Smaller operations retain the measured weak-cache reload cost. Persistence
fencing, rollback, snapshots, and reopen
behavior remain covered by the passing tests. Live authenticated remote sync
remains outside the verified scope.

## Questions

None outstanding. The user specified Electron desktop, growth after editing or
syncing, and excessive memory already at startup. No additional product decision
is needed for a storage-memory bugfix.
