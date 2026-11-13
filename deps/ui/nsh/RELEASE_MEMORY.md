# Native release memory evidence — November 12, 2026

## Scope and artifact identity

For the later isolated standalone release measurement with the compiled default
and bounded complete Emoji/icon picker visits, see
[native property and capability qualification](../../../docs/agent-guide/review-probes/2026-11-13/native-property-and-capability-qualification.md#current-standalone-release-memory).
That report identifies its separate exact application/LUI checkpoint; neither
measurement is automatically evidence for subsequent builds.

These are historical control measurements of one release artifact, not memory
qualification of the current final application. The approximately 135 MiB result
belongs to the previous release with an explicit `OCAMLRUNPARAM=s=2M` override.
The corrected compiled default and later font, input, layout and picker changes
require a new release build and the same ten-second measurement.

All three `result.json` files contain an identical build receipt:

- App revision: `90b6fc0d6ea63dcb1161bbbd309b05e160232cca`.
- LUI revision: `6809a6ef7e153a3cc9b78a7299e89c191f2bb929`.
- Rust build profile and Dune profile: `release`.
- Native executable SHA-256:
  `821e96416cb275755abd9c0f74a6809cb9ebfafba6073f8b04e9609e97d4ed17`.
- OCaml shared-library SHA-256:
  `5d5c7916dcda5a7b9b5b346e52455ce7dc8550bb2e5a80ab3f62e7f63ed08904`.
- Private DB-worker SHA-256:
  `c49397ca24df1e96ec7183175088ffab67df5e281be1e260ef7178f2367ea20e`.

Each run opened an isolated default Demo graph and a dated Journal, with no user
graph. OS samples began approximately 10.005 seconds after process launch;
read-only GC queries finished approximately 10.007 seconds after launch. The
recorder did not force collection or compaction. All reported compaction
counters were zero. The visible-window captures establish the measured workload,
not pixel or UX parity. These runs each included one UI process and one owned
DB-worker process; their recorder cleaned up those private processes afterward.

The ignored local evidence is under
`deps/ui/_build/nsh-release/<sample>/result.json`. It is not committed as a build
output. The source files' SHA-256 digests identify the observations:

| Sample | Runtime configuration in this control | `result.json` SHA-256 |
| --- | --- | --- |
| `memory-10s` | Previous default `s=16M` | `c01f08cd31b4ac3ccd46ed9c422b454a2d1d9e6e4302c6116d28562ece07126c` |
| `memory-10s-16m` | Explicit `OCAMLRUNPARAM=s=2M` | `fe7801bb77a1327de970812e83efe62e25d6e17756ab0d5dd63c8159cb2428bf` |
| `memory-profile-16m` | Repeat with explicit `OCAMLRUNPARAM=s=2M` | `a7ebf2bd0029928a17ba42fdaf1c6ee0e4e8547f4e084dd7d5fc2435e4a86537` |

The configuration descriptions include the recording session's launch settings;
the JSON's GC samples independently confirm the effective capacities. The JSON
does not record the complete launch environment. For a future recording, retain
the explicit override alongside the build receipt rather than inferring its
literal text only from the effective capacity.

## Process memory at ten seconds

The recorder uses macOS `proc_pid_rusage` with `RUSAGE_INFO_V0`.
`physicalFootprintBytes` is the process's physical-footprint charge.
`residentBytes` is its RSS charge. The total rows sum the two process reports;
RSS can count shared pages more than once. Neither column is an allocation
counter or a count of live OCaml objects. MiB means 1,048,576 bytes.

| Sample | Process | Physical footprint, bytes | Physical footprint, MiB | RSS, bytes | RSS, MiB |
| --- | --- | ---: | ---: | ---: | ---: |
| Previous default | UI | 152,011,928 | 144.970 | 244,350,976 | 233.031 |
| Previous default | DB worker | 159,171,160 | 151.797 | 171,278,336 | 163.344 |
| Previous default | **Total** | **311,183,088** | **296.767** | **415,629,312** | **396.375** |
| Explicit `s=2M` | UI | 100,516,968 | 95.860 | 192,397,312 | 183.484 |
| Explicit `s=2M` | DB worker | 41,320,928 | 39.407 | 53,559,296 | 51.078 |
| Explicit `s=2M` | **Total** | **141,837,896** | **135.267** | **245,956,608** | **234.562** |
| Explicit `s=2M`, repeat | UI | 103,990,352 | 99.173 | 196,132,864 | 187.047 |
| Explicit `s=2M`, repeat | DB worker | 42,058,208 | 40.110 | 54,345,728 | 51.828 |
| Explicit `s=2M`, repeat | **Total** | **146,048,560** | **139.283** | **250,478,592** | **238.875** |

The first explicit-override control used 169,345,192 fewer physical-footprint
bytes (161.500 MiB, 54.42%) than the previous-default observation. Its summed RSS
was 169,672,704 bytes lower (161.812 MiB). These are observed single-run
comparisons using the same artifacts, not a repeated-trial performance estimate.
The repeat's total physical footprint was 139.283 MiB, so the evidence should not
be presented as a fixed 135 MiB application memory budget. The readiness times
also differed between runs and do not establish a startup-speed improvement.

The repeat collected `vmmap` and `footprint` region reports only after the
primary OS/GC samples, between approximately 10.007 and 11.152 seconds. Those
later reports can describe regions but must not replace the recorded ten-second
counters or be added to them.

## OCaml capacities, reported separately

The UI's `gc-stats` operation and worker `/healthz` `native-gc` object use
`Gc.quick_stat ()` and `Gc.get ()`. `word-bytes` was 8 in both processes.
`major-heap-capacity-bytes` is `heap_words * word_bytes`;
`current-domain-minor-heap-limit-bytes` is `minor_heap_size * word_bytes`.
These are capacities included within process memory. Do not add them to physical
footprint or label them as live object sizes. The minor value is explicitly for
the domain executing the query; it is not a sum of every OCaml domain's heap.
The UI also has a prewarm domain in its startup implementation.

| Sample | Runtime | Major heap words | Major capacity, bytes | Major capacity, MiB | Current-domain minor limit, bytes | Minor limit, MiB |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Previous default | UI | 462,582 | 3,700,656 | 3.529 | 134,217,728 | 128 |
| Previous default | DB worker | 1,300,302 | 10,402,416 | 9.921 | 134,217,728 | 128 |
| Explicit `s=2M` | UI | 746,581 | 5,972,648 | 5.696 | 16,777,216 | 16 |
| Explicit `s=2M` | DB worker | 1,200,008 | 9,600,064 | 9.155 | 16,777,216 | 16 |
| Explicit `s=2M`, repeat | UI | 748,056 | 5,984,448 | 5.707 | 16,777,216 | 16 |
| Explicit `s=2M`, repeat | DB worker | 834,408 | 6,675,264 | 6.366 | 16,777,216 | 16 |

| Sample | Runtime | Minor collections | Major collections | Compactions |
| --- | --- | ---: | ---: | ---: |
| Previous default | UI | 10 | 3 | 0 |
| Previous default | DB worker | 2 | 0 | 0 |
| Explicit `s=2M` | UI | 21 | 8 | 0 |
| Explicit `s=2M` | DB worker | 11 | 5 | 0 |
| Explicit `s=2M`, repeat | UI | 21 | 8 | 0 |
| Explicit `s=2M`, repeat | DB worker | 13 | 6 | 0 |

## Corrected default and startup qualification

Commit `9a0ab96693ad6a6d86df4cd7bbcfdb828ba4ef40` corrected the bridge's
absent-environment default from `s=16M` to `s=2M`. OCaml interprets `s` in
machine words: 16M words is 128 MiB on these 64-bit hosts, while 2M words is
16 MiB. The old comment incorrectly described 16M words as 16 MB. The spawned
worker inherits the environment; an explicit user `OCAMLRUNPARAM` remains
unchanged. This commit is newer than the measured artifact above.

Source review at App revision
`d2f2499fca8357d5c327b3b4368f7e827d6b727f` found no blocking correctness defect
in the new heap qualification:

- `startup_preflight::run_child` removes the build shell's `OCAMLRUNPARAM`
  from the owned child. Normal startup and row cases require 2,097,152 words;
  `real_application_minor_heap_override` explicitly sets `s=1M` and requires
  1,048,576 words. It does not mutate the parent environment.
- `startup_rows::qualify_minor_heaps` converts each runtime's reported 4- or
  8-byte word size, checks the effective minor capacity, and refuses missing or
  malformed diagnostics. It reads the private worker registry, verifies the
  health response's canonical storage root and requires exactly one worker.
- The UI query uses the single announced child-owned loopback agent address.
  Both queries are read-only and introduce no `Gc.full_major` or `Gc.compact`.
  The existing child process deadline bounds a stalled query.
- Qualification runs after real Demo/Journals body and sidebar readiness. It
  verifies the configured default and override on that actual compiled path;
  it does not measure RSS, physical footprint, all-domain heap capacity,
  interactive latency or a large user graph.

This was a source review and evidence transcription. No new compiler, profiler,
application launch or native test execution was performed for this report.

## Picker finding and remaining measurement

The earlier picker path rendered every group eagerly on NSH because
`Virt_list.lazy_spine` returns false there. Both the complete Emoji and icon
collections reached `Lazy_children` through that path. This source-level eager
mounting problem is established. The row-source correction in
`b3a0624a73068f72086628c0b6f24d184dfa1467` reuses the existing canonical
virtualizer and adds real mounted-button/render-call regressions.

No post-fix picker memory sample is part of these three observations. The
recorded workload is the default Journal, and it does not qualify opening either
picker. There is no allocation-stack attribution in these JSON results linking
a separate claim of 500 MiB of allocations to picker cells, text shaping,
fonts or glyph caches. Cumulative allocations, live heap capacity, reserved
address space, RSS and physical footprint must remain separate measurements.

After the final integrated release is built and its startup gate passes, repeat
the isolated ten-second Journal workload with the corrected compiled default.
Then measure opening and scrolling each complete picker as a separate workload,
retaining artifact identity, process identities, OS counters, GC counters and
actual mounted-cell counts. Until then, report the values above as historical
controls and leave the integrated release and picker memory improvement
unqualified.

## Standalone Release picker measurement — November 13, 2026

This later measurement is separate from the historical November 12 controls
above and the earlier standalone table linked at the start of this report.
Those observations and their artifact identities remain unchanged. The new
session measured the actual published Rust-only executable and its release
OCaml library, not a mixed development UI host or the NSH TSX test driver.

The exact measured sources were:

- App: `2f96a1d94d54ad87cfad99a13b4ce8a149919034`.
- LUI: `f29b2473621f7a07293bbf884f135d22126d4928`.
- NSH: `adc186db7213f3ccd1eacaa836cc721e9779fd14`.
- Rust and OCaml build profiles: `release`.
- Executable SHA-256:
  `4a9e6e479eb7edeb4c6ed638b59375ef20c7f51c4ef8013157b6279910578b8b`.
- OCaml library SHA-256:
  `723fdc1b53a01e60612e41ce9b62fae1e1cf8efe56d2327f2e128becfdcb9324`.
- DB-worker SHA-256:
  `5404762a8ccd9b5987c0ab00fc8455000e428f0ac652a5e55166b20ec0ba1b50`.

The recorder verified the actual release receipt and exact source revisions,
launched the standalone executable with private startup-preflight storage and
credentials, and checked the frontend and worker against that owned session.
It sampled `vmmap -summary` physical footprint for frontend PID 25853 and its
single owned worker PID 25888. The baseline frontend sample began 10.015 seconds
after launch; the separately collected worker sample began at 10.858 seconds.
The decimal values below preserve `vmmap`'s rounded `M` observations as MiB;
they are not exact-byte OS counters, RSS, virtual address space or live OCaml
allocation measurements.

| Phase | Frontend footprint, MiB | Frontend lifetime peak, MiB | Worker footprint, MiB | Worker lifetime peak, MiB | Mounted picker rows / cells | Full source items / rows |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Baseline, ten seconds after launch | 94.8 | 95.1 | 39.5 | 39.7 | 0 / 0 | Picker closed |
| Emojis, first visit | 120.6 | 121.6 | 39.6 | 39.7 | 15 / 135 | 1,870 / 208 |
| Icons, first visit | 127.8 | 128.1 | 39.6 | 39.7 | 15 / 135 | 6,200 / 689 |
| Emojis, second visit | 127.3 | 129.9 | 39.6 | 39.7 | 15 / 135 | 1,870 / 208 |
| Icons, second visit | 128.5 | 129.9 | 39.6 | 39.7 | 15 / 135 | 6,200 / 689 |

The independently sampled process footprints sum to approximately 134.3 MiB
at baseline and 168.1 MiB at the last sample. These sums are not a simultaneous,
de-duplicated system memory measurement. Every open-picker observation retained
the full dataset while materializing only indices 0–14, with a parent-bounded
virtual viewport. Canonical picker node counts were respectively 320, 321, 320
and 321. This bounds materialization at these sampled positions; it is not a
measurement of scrolling or of every possible picker state.

The read-only frontend `gc-stats` and worker `/healthz` diagnostics reported
8-byte words. Major capacity and the current query domain's minor limit are
reported separately below. They are included within process memory, must not
be added to physical footprint, and do not count live object bytes or all
domains' minor heaps. The worker values were identical at all five phases.

| Phase | Frontend major capacity, bytes | Worker major capacity, bytes | Frontend current-domain minor limit, bytes | Worker current-domain minor limit, bytes |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 6,301,704 | 9,763,936 | 16,777,216 | 16,777,216 |
| Emojis, first visit | 11,067,416 | 9,763,936 | 16,777,216 | 16,777,216 |
| Icons, first visit | 10,286,408 | 9,763,936 | 16,777,216 | 16,777,216 |
| Emojis, second visit | 14,966,616 | 9,763,936 | 16,777,216 | 16,777,216 |
| Icons, second visit | 9,391,248 | 9,763,936 | 16,777,216 | 16,777,216 |

Only two Emoji/Icon tab cycles were recorded, using existing native-controller
presses. There were no screenshots, forced collections or compaction requests;
all reported compaction counters were zero. This short default-Demo session
does not establish long-term leak freedom, populated-graph memory, physical
hardware input or native wheel delivery. The installed user app was not used.
The recorder's final `complete.json` reports all five phases completed, no
error and no cleanup or freshness errors.

The ignored evidence directory is
`deps/ui/_build/nsh-picker-final-memory/release-revisions-kf4x5_az/`.
It retains the verified `source-build-receipt.json`, source/artifact hashes,
per-process raw vmmap reports, frontend GC samples, worker health/GC samples,
canonical trees, ownership and cleanup records. Evidence digests:

| File | SHA-256 |
| --- | --- |
| `measurements.json` | `49c9e7c2259f8f75ef7a6679c0dc539b0adb2fb8a28c1b2bfdb759bf3f99f205` |
| `sources.json` | `47da5165f802530f1948afe2637b1847651e31efd872882083d838a5a29057c1` |
| `source-build-receipt.json` | `a7aaeccf164d7e3559f975b8dd42b50961ef5ddb45cf3465a74fefc10f0dfac0` |
| `complete.json` | `1ebb391b4282f6169e1f414ed713b5e2698550e76fa92d24e5affb99f7dd0ca2` |

Separately, the actual AppKit picker state-change gate at this same application
checkpoint passed: `/tmp/logseq-intrinsic-owner-native-picker-states.log`,
private evidence `logseq-picker-wheel.BEAhra`. Its public native-wheel scenario
checks end-of-list tab switches, short and empty filters followed by clearing,
and color changes at the icon-list end, with visible target bounds inside the
328-point picker viewport and no backend diagnostic. It uses the mixed native
test host for input delivery and is interaction evidence, not an additional
standalone memory sample. No new compiler, application launch or test was run
to transcribe this report.


## Bounded ordinary-code viewport: executed release measurements (2026-11-13)

This is a separate large-code workload, not an Emoji/Icon picker sample. The
standalone release and actual native OCaml library were measured on macOS 27.2,
arm64 Mac18,5 with 24 GiB RAM, at App
`c756ec5ffa07a7e8636066cf0c9517dc29763700`, LUI
`93712b51ab40d7c5882fed1501568a55ab6722ba` and NSH
`adc186db7213f3ccd1eacaa836cc721e9779fd14`. Both Rust and OCaml profiles were
release. Each case used a fresh private profile, one startup-created journal,
one ordinary worker-inserted Markdown code fence and exactly one owned worker.
The full source was verified in the canonical extension and persisted entity.

The previous ordinary Editor used `min_rows=Some(1)` without a maximum height.
A 1,000-line, 22,994-byte document reached 206.8 MiB frontend footprint after
idle. The 100,000-line case failed its unchanged 15-second agent-response
bound. A read-only diagnostic of that still-live child at 28.165 seconds after
launch measured 3.8 GiB frontend footprint and a 4.0 GiB lifetime peak; the
subsequent one-second OS sample recorded 4.1 GiB while it continued allocating.
Its engine was reconciling native Editor row views and styles. These are failed
workload diagnostics, not completed publication/idle measurements. Owned cleanup
succeeded; no user's graph or installed application was used.

Frozen master `29fd2edd015e12963742b985ce6d2311c074e09b` already specifies
`.CodeMirror { height:auto; max-height:1024px }` in
`src/main/frontend/extensions/code.css`, with an explicit uncapped `calc`
exception. The corrected factory applies that maximum to the same NSH Editor.
It keeps the native document, internal scrolling, visible-row window and Undo;
it adds no alternative editor or virtualizer. The separate public Headless
fixture passed 1k/100k full-document end-paste/Undo, bounded native witnesses,
short natural height and retained language/calc transitions. All nine extension
tests, formatting and strict all-target release Clippy passed. The broader
81-case Rust library run remains red: 80 passed and the unchanged natural-date
`next friday 8pm` parity assertion failed.

The root-owned standalone recorder then completed both cases without forced GC,
focus injection or offset mutation. The independent maintained CLI verified the
receipt and captured the first viewport; both PNGs were inspected. The initial
fixture attempt held a persistent agent connection while opening an independent
CLI connection. The transport serves one client at a time, so that fixture-only
contention was corrected by closing each read client before invoking the CLI.
The response deadline and application assertions were retained. The failed
connection attempt and the subsequent failed unbounded document runs remain in
the ignored evidence directories.

The table preserves rounded `vmmap -summary` physical-footprint observations as
MiB. They are not RSS, virtual size or exact live-object bytes. Frontend and
worker samples are sequential, not a de-duplicated simultaneous system total.

| Lines / source bytes | Phase | Frontend MiB | Frontend lifetime peak MiB | Worker MiB | Worker lifetime peak MiB |
| --- | --- | ---: | ---: | ---: | ---: |
| 1,000 / 22,994 | baseline-10s-after-launch | 94.6 | 94.9 | 39.7 | 39.9 |
| 1,000 / 22,994 | long-code-ready | 110.9 | 111.0 | 44.1 | 44.3 |
| 1,000 / 22,994 | long-code-idle-10s | 116.8 | 127.2 | 43.2 | 44.3 |
| 100,000 / 2,499,994 | baseline-10s-after-launch | 95.2 | 95.5 | 39.3 | 39.4 |
| 100,000 / 2,499,994 | long-code-ready | 167.9 | 168.0 | 268.4 | 268.6 |
| 100,000 / 2,499,994 | long-code-idle-10s | 170.6 | 178.7 | 135.0 | 268.6 |

The baseline frontend samples began 10.136 and 10.135 seconds after launch.
Worker insertion through canonical source publication took approximately 576 ms
for 1k and 2,151 ms for 100k; the latter source contains 2,499,994 bytes. These
are complete worker/application publication observations, not native frame or
paint latency. The first-viewport PNG occurs between ready and idle samples;
its allocations are included in the later footprints. Both cases retained 266
canonical nodes, which alone does not prove bounded native row rendering.

Read-only OCaml counters are reported separately below. Major heap capacity and
the current domain's 16 MiB minor limit are already included in process memory,
must not be added to footprint, and do not establish live heap or all-domain
allocation. The worker's natural collection/compaction counter changed during
100k insertion; the recorder never requested a collection or compaction.

| Lines | Phase | Frontend major capacity bytes | Worker major capacity bytes | Current-domain minor limit bytes, each process |
| --- | --- | ---: | ---: | ---: |
| 1,000 | baseline-10s-after-launch | 6,301,768 | 9,796,704 | 16,777,216 |
| 1,000 | long-code-ready | 6,301,768 | 9,536,152 | 16,777,216 |
| 1,000 | long-code-idle-10s | 6,301,768 | 9,536,152 | 16,777,216 |
| 100,000 | baseline-10s-after-launch | 6,242,760 | 9,829,472 | 16,777,216 |
| 100,000 | long-code-ready | 41,261,656 | 34,703,416 | 16,777,216 |
| 100,000 | long-code-idle-10s | 28,612,440 | 5,644,576 | 16,777,216 |

These two short sessions establish completed source publication and first-line
paint after the height correction. Standalone last-line paint, native wheel
reachability, frame-time distributions, sustained edits/leak freedom, IME,
other OSes and the deliberately uncapped calc workload remain separate gates.
The ignored recorder is
`deps/ui/_build/nsh-native-code-memory/measure.py`; commands and errors are in
`/tmp/logseq-current-release-code-memory-client-fixed.log`,
`/tmp/logseq-current-release-code-memory-timeout-diagnostic.log` and
`/tmp/logseq-bounded-release-code-memory.log`.

Each completed evidence directory retains source/artifact hashes, the verified
release receipt, per-process raw vmmap, frontend GC and worker health/GC,
readiness/ownership/cleanup records, CLI replies and first-viewport PNG. Digests:

| Ignored evidence directory | File | SHA-256 |
| --- | --- | --- |
| `long-code-1000-6ddss26p` | `measurements.json` | `aaffa1ed15f7e327098881834b1bfe2dfdde158d19a8efd6f8f423d4f404d1d0` |
| `long-code-1000-6ddss26p` | `sources.json` | `a2c5e93a5022e13df53a7856ef0f0e907b0679ceff3a6e2e31334b2109547333` |
| `long-code-1000-6ddss26p` | `source-build-receipt.json` | `1826d61a85cf743428db435a4a0a0c9231541be85aa2a4549360fb70842a9f19` |
| `long-code-1000-6ddss26p` | `complete.json` | `140d60bcd43a391bbcdb5270bd5a60a6cbf40f9862b08d5bb3aa93c8c6405178` |
| `long-code-100000-cauchz1m` | `measurements.json` | `d63f345751da6b5a371cb2cd2892a9e40ff0bdbf72adb9378e173a3031d59edb` |
| `long-code-100000-cauchz1m` | `sources.json` | `d0dccc6c2a2c68ec0e091e9688eb44240a59b477de780dba7e2ef871adb213f3` |
| `long-code-100000-cauchz1m` | `source-build-receipt.json` | `1826d61a85cf743428db435a4a0a0c9231541be85aa2a4549360fb70842a9f19` |
| `long-code-100000-cauchz1m` | `complete.json` | `140d60bcd43a391bbcdb5270bd5a60a6cbf40f9862b08d5bb3aa93c8c6405178` |
