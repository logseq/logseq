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
