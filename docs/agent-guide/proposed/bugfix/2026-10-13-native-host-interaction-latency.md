# Native Host Interaction Latency

## Problem

The macOS OCaml/SDL host feels slow across scrolling, typing, and navigation on the existing demo graph. Native sampling shows idle whole-store traversals and allocation, and expensive flex layout during interactions. Metal drawable acquisition and an unbounded command-buffer queue block the input thread. Unbounded flex constraints use NaN, but cache comparisons treated identical unconstrained offers as different. Caret extension updates invalidate layout, and the custom host omitted retained-paint interaction hints.

## Proposal

Profile the actual Metal host on the same graph, add failing native regression coverage for unnecessary repeated work, and remove the confirmed hot-path work at its owner. Preserve input focus, IME, geometry, and startup behavior. Rebuild and reopen the application, then compare the same idle and interaction paths.

## Current measurement priorities

Use the controlled measurement protocol below before selecting another change.
Keep memory and latency investigations separate: allocated bytes, live heap,
physical footprint, and frame time are different outcomes.

| Priority | Observed failure | Next evidence required |
| --- | --- | --- |
| 1 | Normal 1440x900 startup and input reach 101.4 MB sampled combined physical peak, with a 105.6 MB conservative per-process peak bound | Reduce the remaining peak and repeat the complete normal visible workload |
| 2 | A normal 620.9-second panel-open quiet interval allocates about 406 KB/s with 0.187 minor collections/s | Reduce measured idle overlay/raster churn under the unchanged 256 KiB/s and 0.1/s limits |
| 3 | Core Animation presentation timing is unavailable and editing RSS can still exceed 200 MB | Keep physical footprint and RSS separate; obtain actual visible presentation and complete input evidence |
| Pending | Visible scroll, typing, navigation, resize, and presentation acceptance | Run the unchanged workload matrix with verified visible output and complete action counts |

A helper allocation improvement alone does not close any of these failures.
Every experiment must state its predicted effect, use one change, retain failed
runs, and compare the same graph, build, viewport, worker count, and input.
Record CPU core type and scheduling alongside diagnostic timings: a run that
migrates from efficiency to performance cores is not a controlled comparison of
algorithmic execution time. Baseline eligibility also requires the window to be
visible throughout the measured interval; it does not itself certify FPS.

## Measured decision: repeated startup submissions

The next optimization must be selected from a measured failure, with a predicted
saving and an unchanged-workload comparison. An unnecessary operation is not,
by itself, evidence that removing it closes the memory or latency gap.

### Capture and hypothesis

A protected full-application run captured four consecutive native Metal scenes
before the 200 MB combined-process guard terminated startup. Their revisions
were 2, 4, 6, and 8. Scenes 0 and 1 had identical canvas, ops, glyphs, atlas
pixels, and CPU-rendered pixels; scenes 2 and 3 also matched exactly. All four
used the unchanged 2880x1800 device viewport. The full application acquired
three distinct IOSurface-backed textures, with 62,226,432 allocated bytes in
the layer's read-only residency set.

Hypothesis: omitting the two visually redundant submissions could reduce
native graphics residency. Test that hypothesis before retaining another
frame snapshot or adding renderer invalidation rules.

### Controlled result

A standalone SDL/Metal replay used the actual four captured scenes, the current
release LUI library, the bundled SDL 2.32.6, native titlebar/menu/activation
setup, and the same viewport. Requested drawable-acquisition offsets were
0, 319.790, 379.600, and 398.567 ms. The counterfactual omitted scenes 1 and 3,
retaining both distinct outputs. Six serial protected runs compared three
original sequences with three counterfactual sequences; no builds or tests
ran during recording. Every run exited normally below the 200 MB guard.

| Measurement | Four submissions | Two submissions |
| --- | --- | --- |
| Median peak physical footprint | 148,554,712 bytes | 149,062,616 bytes |
| Median peak RSS | 99,958,784 bytes | 100,515,840 bytes |
| Distinct drawable textures in every run | 2 | 2 |
| Maximum layer residency allocation count | 2 | 2 |
| Median physical footprint during seconds 12-16 | 74,089,432 bytes | 74,236,888 bytes |

The first exploratory run started its offsets before first-frame preparation;
its acquisitions did not match the intended cadence. It remains saved and is
excluded above. Corrected original runs acquired subsequent drawables at
319.753-323.021, 378.040-381.218, and 398.559-399.216 ms. The counterfactual's
second acquisition occurred at 373.252-381.138 ms. These are diagnostic replay
observations, not an exact scheduling guarantee or visible-FPS acceptance.
The short idle interval measures startup reclamation, not sustained-idle
acceptance; the existing 600-second requirement is unchanged.

### Decision and remaining evidence

This experiment found no physical-memory saving from removing the duplicate
submissions in isolation. Do not add a frame-content cache as the proposed
memory fix on this evidence. It also did not reproduce the full application's
third texture, so it cannot establish that deduplication would have no benefit
in that different path. The full application remains over budget.

The isolated renderer's approximately 149 MB active peak and approximately
74 MB late-idle footprint make native graphics working memory the first
memory-attribution target. A managed-allocation optimization must state how
much of the remaining budget gap it can address. The next graphics experiment
must explain the full-application versus replay difference using actual
acquisitions and resource lifetimes, rather than configured pool capacity.
CPU optimization remains a separate investigation of the main-thread
31-41 ms Enter path; GPU work and allocation rates cannot substitute for that
CPU attribution. Require a failing regression, a measured before/after saving,
and preserved behavior before accepting any production change.

Raw scene files, exact pixel comparisons, executable/source hashes, acquisition
logs, per-run external memory samples, and aggregate results remain under
ignored `tmp/native-app/science-scene-sequence-frames/`,
`science-scene-sequence-pixels/`, `science-sequence-ab-*/`, and
`science-sequence-ab-results.json`. This experiment changed no production code
or renderer defaults and does not satisfy native interaction acceptance.

## Attribution follow-up and rejected query candidate

Further protected diagnostics narrowed the startup graphics investigation:

- Packaging the same signed scene-replay executable initially changed two
  drawable textures and approximately 149 MB peak physical footprint into
  three textures and approximately 169 MB. Repetition reversed the result:
  an independent bundle identifier also produced three textures, while the
  original identifier subsequently produced two. Both used backing scale 2.
  Bundle identity is not a demonstrated cause. A full-application independent
  identifier control still acquired three textures and crossed the combined
  guard at 207,816,168 physical bytes.
- Passive tracing of drawable dimensions, layer bounds/frame, color space,
  drawable capacity, display synchronization, transaction presentation, and
  extended-range setters found no such mutation after the first acquisition
  in a full-app run that acquired three textures. The configured capacity
  stayed two. Do not infer a property-driven pool rebuild from texture count.
- Omitting presented-handler registration in the packaged replay still
  produced three textures: physical peaks were 169,198,504 control bytes and
  169,542,592 counterfactual bytes. Native context deallocation occurred in
  both runs. These observations do not support removing presentation metrics
  or claiming a context retain cycle.

A separate Cocoa startup diagnostic completed with four requested raster
workers and the normal viewport. After the diagnostic's explicit collections,
GC reported 25,645,744 live managed bytes. This is not the default-Metal startup
snapshot and cannot be substituted for its working-memory measurements.

A first-match query candidate avoided eagerly constructing unrelated tree
snapshots. Before/after regression measurements on a 6,000-node native tree
were 7,973,368/3,544 allocated bytes for a document query,
1,442,368/2,296 for ID lookup, and 1,155,112/3,136 for a scoped query.
The tests failed for allocation before the candidate and passed afterward;
selector order, scope roots, ancestors, updates, complete traversal,
unsuccessful-search caching, and disposal were covered. The native host suite
and release build also passed. That result did not establish application gain.

Three unprofiled release Cocoa runs per variant used the same graph, viewport,
four requested raster workers, worker executable, and one-Enter replay. Every
run handled and persisted one additional block, but none had visible-window or
UI-settlement evidence. Their measurement-window medians were:

| Measurement | Original | Query candidate |
| --- | ---: | ---: |
| Host allocated bytes | 24,012,600 | 24,012,768 |
| Combined GUI/worker peak physical bytes | 97,420,728 | 96,568,808 |
| Combined GUI/worker peak RSS bytes | 192,004,096 | 190,971,904 |

Individual input-to-host-frame observations were 29.62, 43.12, and 39.68 ms
before, versus 40.56, 31.53, and 44.14 ms after. No stable response-time
improvement was demonstrated. The sub-1 MB physical difference does not close
the default-renderer budget gap, while measured interaction allocation was
unchanged. The candidate was therefore withdrawn. Production sources and the
packaged profile executable were restored; the candidate patch, failing/passing
logs, and exact run reports remain under ignored `tmp/native-app/science-query-*`
and `science-early-query-candidate.patch`.

A subsequent temporary query profiler on the original implementation attributed
actual calls rather than selecting another synthetic first-match workload:

| Caller and query | Allocated bytes | Instrumented wall time |
| --- | ---: | ---: |
| Journal fill, `main-content-container` lookup | 3,836,016 | 5.06 ms |
| Editor overlay refresh, active editor ID lookup | 1,079,160 | 0.67 ms |
| Reload deferral, overlay-presence selector | 2,030,784 | 16.16 ms |

The overlay-presence query occurred approximately 0.9 seconds after Enter; it
must not be described as the initial input-critical stall. These timings are
profiled diagnostics. The remaining allocation belongs to other work and
requires attribution; do not equate the query total with the complete
24 MB interaction-window total. Temporary instrumentation was removed after
recording. Raw caller stacks, a clock calibration, and producer patches remain
in `science-query-attribution-run/`, `science-query-clock-calibration.json`,
and `science-query-attribution-source.patch` under the same ignored directory.
Default Metal memory, the complete 50-Enter workload, and visible presentation
acceptance remain unproven. The native window observation still returned no
capturable window; no unlock or visible-FPS success is claimed.

## Pixel-copy controls and actual-vector follow-up

Keep component measurements separate from whole-application acceptance. The
first presentation experiment reused a frozen, fully rasterized application
frame. Its full 2880x1800 pixel coverage, including transparency, was retained;
uniform regions used shared 1x1 surfaces while other regions used Metal layers.
This measured presentation resources, not vector rendering or interaction.

Three protected runs per cell used one executable in a two-factor comparison:

| Pixel-copy path | Median peak physical bytes | Median peak RSS bytes |
| --- | ---: | ---: |
| Full layer, render encoder | 142,001,088 | 107,347,968 |
| Partitioned layers, render encoders | 104,514,496 | 98,713,600 |
| Full layer, compute encoder | 124,322,752 | 105,922,560 |
| Partitioned layers, compute encoder | 88,671,192 | 96,354,304 |

The partitioned frame retained 1,774,080 GPU pixels and 3,409,920 uniform pixels,
covering all 5,184,000 viewport pixels. Independent readback checks passed.
Readback-enabled physical peaks are excluded from the table: the diagnostic
copy itself adds memory, especially when it activates another GPU engine.
Every presentation callback count remained zero in the occluded environment.
Neither GPU timestamps nor successful pixel checks establish visible FPS.

These results justify measuring an actual-vector candidate before considering
a renderer change. They do not justify copying the partition architecture into
the application: the pixel-copy input excludes vector shading, live scene
updates, the graph worker, application state, and CPU rasterization cost.
The raw matrix and provenance are in ignored
`tmp/native-app/science-partition-results.json`.

### Actual vector workload and pixel check

An isolated compute experiment consumes the captured application's original
745 packed instances, 46 batches, 638 glyphs, both 512x512 atlases, and 18 image
slices. The captured scene includes a modal; it is not the fresh Journals
startup inventory described above. It preserves paint order, scissor and
rounded clips, transparent cutouts, borders, shadows, image sampling, and
per-channel glyph blending. Effects are explicitly rejected by this diagnostic
exporter rather than silently omitted. No complete renderer implementation or
new default backend is being proposed on this fixture alone.

The candidate shares the existing shader's coverage, paint, shadow, and text
math. A 16x16 tile index limits each pixel to intersecting instances in original
paint order. Compared with the existing Metal renderer's output, 94 of
20,736,000 byte channels differ by one; every other channel matches exactly.
This fixture-level comparison does not replace the complete parity corpus.

At the initial 10 Hz diagnostic cadence, the generic compute kernel's GPU
median was 18.50 ms. Separate work-removal controls measured 14.39 ms without
shadows, 6.47 ms without fills, and 17.85 ms without glyphs. Replacing shading
with plain color measured 3.28 ms. None of those reduced-work outputs is an
acceptance result. A conservative interior-fill branch did not improve the
complete output, and limiting the compute pipeline to 256 threads did not
resolve the slow low-cadence result. These controls do not prove a particular
register or memory-stall mechanism; hardware counter evidence would be needed
for that claim.

### Cadence-controlled comparison and rejected split candidate

Low-cadence timings cannot determine the sustained 120 Hz workload budget.
The follow-up uses one executable, five alternating-order pairs, 260 completed
GPU frames per process, 20 warmup frames excluded, and an 8,333,333 ns target
period. A late frame receives no sleep. This is an offscreen submission target,
not a display-FPS measurement. No builds or tests run concurrently, and the
external 200,000,000-byte RSS/physical guard remains enabled.

The counterfactual classifies entire tiles as uniform only when the drawing
instructions prove their color. It uses a separate lightweight kernel for
those tiles, preserving opaque overdraw, transparent cutouts, and untouched
shadow interiors. All 13,949 uniform and 6,391 remaining tiles cover the full
viewport. Its output is byte-identical to the generic compute output.

Pooled GPU quantiles below use the nearest-rank estimator, `ceil(q*n)-1`, with
1,200 measured frames per variant. They describe this fixture and these five
runs, not a statistical guarantee for arbitrary interactions.

| Measurement | Generic compute | Separate uniform tiles |
| --- | ---: | ---: |
| GPU median | 6.202 ms | 4.477 ms |
| GPU p95 | 7.877 ms | 7.406 ms |
| GPU p99 | 8.031 ms | 8.998 ms |
| Maximum GPU sample | 8.164 ms | 10.461 ms |
| Samples over 8.333333 ms | 0 / 1,200 | 28 / 1,200 |
| Median peak physical bytes | 76,825,176 | 76,825,176 |
| Median peak RSS bytes | 21,954,560 | 21,987,328 |

CPU file loading, metadata parsing, tile binning, and uniform classification
take approximately 1.01 ms at the median in both variants; this excludes GPU
initialization and is not the application's incremental scene-update cost.
Both offscreen variants still own a full-size output texture. The split
candidate improves the median but worsens the tail and saves no physical
memory. Do not retain it as a production optimization on this evidence.

The cadence-controlled generic result also corrects the initial inference:
the 10 Hz experiment does not establish that generic compute is intrinsically
too slow for the 8.33 ms GPU budget. Presentation, CPU work, scene changes,
and complete input outcomes still require their own measurements.

Three full SDL-window generic-vector recordings peak at 108,987,328,
129,287,080, and 129,303,464 physical bytes before any graph worker or mounted
application state. The first has two layer-resident drawable allocations
totaling 41,484,288 bytes; the next two have three totaling 62,226,432 bytes,
despite the same configured capacity of two. This does not establish why the
additional texture exists. All use the unchanged Retina viewport, complete
260 frames, and report zero displayed frames. A separate readback recording
produces pixels byte-identical to the offscreen compute fixture; its
129,549,272-byte peak includes readback overhead and is excluded from the
three normal recordings.

The offscreen 76.8 MB result therefore cannot establish the application's
100 MB target. Do not port the generic compute path merely because that
narrower recording fits the memory budget. The next memory decision must
include window resources and predict a material combined GUI/worker saving
before production changes.

The existing complete Cocoa startup diagnostic supplies a useful contrasting
boundary: 72,582,104 physical GUI bytes plus 22,397,408 worker bytes equals
94,979,512 bytes, with combined RSS 189,530,112 bytes. It includes the normal
viewport, graph, and four requested raster workers, but uses a diagnostic
store trace and has no visible-output acceptance. The rapid-Enter workload on
that path still hits the RSS guard. Before constructing another presentation
architecture, attribute that actual input-window growth to its process and
allocation owners. A shared input-path reduction can then be checked against
all 50 persisted blocks and unchanged latency budgets. Neither this startup
boundary nor a backend switch alone closes the goal.

All ten cadence recordings exited normally below the guard. Sources,
executables, captured pixels, hashes, and complete GPU samples remain ignored
under `tmp/native-app/science-vector-*` and `science_vector_*`; the authoritative
aggregates are `science-vector-cadence-results.json` and
`science-vector-window-results.json`. The pre-window source and
binary used by that matrix are retained as `science_vector_probe_offscreen.m`
and `science_vector_probe_offscreen`. No application code, renderer defaults,
worker count, graph workload, or acceptance limit changed in these experiments.
Default-renderer memory, all 50 Enter actions, and visible 120/60 FPS acceptance
remain incomplete.

## Memtrace allocation and lifetime attribution

An authorized diagnostic override now separates the RSS threshold from the
combined GUI/worker physical-footprint guard. `--ignore-rss-limit` keeps the
200,000,000-byte physical limit, samples both counters every 50 ms, and marks
the result as ineligible for an unprofiled timing baseline. Ordinary runs
retain both guards. A sampler regression also covers the interval in which
macOS has stopped exposing process usage but the child exit is not yet waitable;
the sampler waits up to 50 ms to confirm termination and still rejects failed reads
for a live process.

Memtrace 0.2.3 was installed in the existing OCaml 5.5.1 profiling switch.
The standard trace writer/reader records sampled allocations, promotions,
collections, and complete backtraces. A temporary adapter retains and discards
the OCaml 5 profiling handle and serializes writer access across domains.
A roundtrip with three worker domains decoded 722 allocation and 700 collection
events.
The first application trace reproduced the released encoder's location-field
overflow; the profiling dependency received the upstream
[location encoding fix](https://github.com/janestreet/memtrace/pull/23) before
recapture. The malformed trace is excluded from allocation conclusions.
No profiling dependency or temporary producer hook is added to the application.

The valid full-size Cocoa trace used 0.0001 samples per word, up to 128 stack
frames, the unchanged graph and worker, four requested raster workers, and
50 Enter events at 10 Hz. Its injected, handled, and persisted counts all equal
50. The native viewport remained 1440x900 points and 2880x1800 pixels. SDL event
replay establishes the controlled native path; OS input and UI settlement are
not established by those counters alone.

| Diagnostic measurement | Result |
| --- | ---: |
| Estimated Enter-phase allocation | 949,440,000 bytes |
| Host metric allocation over the recorded input window | 944,821,568 bytes |
| Allocation with `paint_frame` in its stack | 578,000,000 bytes |
| Allocation with layout synchronization in its stack | 108,800,000 bytes |
| Allocation with accessibility synchronization in its stack | 88,240,000 bytes |
| Combined GUI/worker peak physical footprint | 124,765,624 bytes |

These stack totals are nested and must not be added together. Sampling estimates
are distinct from exact runtime counters and retained memory. The trace showed
large allocation churn without a corresponding increase in sampled survivors.
The next application decision must distinguish live payload, GC capacity and
metadata, native allocations, and renderer resources.

A follow-up retained the full viewport for the complete 90-second replay,
including approximately 79 idle seconds after the final Enter. All 50 blocks
were handled and persisted, and the fixed app exited normally. Before disposing
any application state, two diagnostic major collections left 22,169,976 live
managed bytes in 41,620,192 bytes of heap capacity. Memtrace estimated 22.72 MB
of survivors from 234 sampled objects. Estimated retained allocation owners
include flex/layout at 5.84 MB, raster buffers at 3.12 MB, scene data at 2.56 MB,
signals at 2.40 MB, native snapshots at 1.60 MB, and store nodes at 1.20 MB.
These sampled sites describe where surviving objects were allocated, not all
owners keeping them reachable. The recording peaked at 95,405,064 physical GUI
bytes and 28,606,968 worker bytes. Earlier long captures with window size changes
remain excluded from the fixed-viewport comparison. Neither 90 seconds nor
forced collection replaces the required 600-second uninstrumented idle test.

A separate matched diagnostic then compacted the still-mounted application.
GUI physical memory fell from 94,979,080 to 73,073,672 bytes, while heap capacity
fell from 41,457,376 to 24,319,712 bytes and live payload stayed at 22,169,864
bytes. Compaction took 21.274 ms. This isolates retained heap capacity as a
material part of the software control footprint; it does not justify adding
a pause exceeding the editing-frame budget to the interaction path.

A separate system allocation capture resolves several costs hidden from a
managed allocation trace: about 5.13 MB in OCaml reference/custom/ephemeron
tables, 2.11 MB in frame descriptors, and 1.51 MB in major-GC mark stacks.
About 8.03 MB of malloc allocations in that capture are managed large objects;
they already belong to GC accounting and must not be counted a second time.
Virtual mappings and pthread stack reservations are likewise not resident
malloc payload. The stack logger has its own overhead and its 143 MB combined
physical peak is not an uninstrumented application result.

A control changed only the GUI startup minor heap from 262,144 to 65,536 words.
Both variants handled and persisted all 50 blocks with the same full viewport,
graph, worker, and input script. Combined physical peaks were 122,914,256 and
118,359,504 bytes, while windowed minor collections increased from 458 to 1,729.
This single pair does not establish a latency-neutral production improvement,
and the smaller heap is not adopted. The original runtime configuration remains
the baseline; these software controls do not certify the default-renderer target.

The actual Enter stack sample also justified removing capturing closures from
attribute substring checks. A failing allocation regression fell from 20,896
to 96 bytes for 200 scans; a 6,000-node discovery test fell from 2,016,312 to
192,256 bytes beyond a matched traversal control. Boundary semantics and all
6,000 nodes are preserved. The two complete one-Enter pairs measured about
24.0 MB before and 22.8 MB after. A later unmatched original run and interrupted
candidate are excluded from paired comparisons.
These software measurements do not establish the default-renderer memory goal.

Long sampling exposed an independent native crash. The crash report shows
`SDL_WaitEventTimeout` invoking `logseq_expose_watch` after its Ctypes binding
released the runtime, followed by `caml_callback_exn` aborting with
`no domain lock held`. The event watcher now acquires the runtime only when it
was released and restores that state after repainting. The regression first
reproduced the same abort and then passed with the fix, including a callback
that allocates and pushes a nested expose event, a foreign-thread event, and
events after disposal. The full native host tests and release build pass.

Raw traces, decoded events, source patches, and run provenance remain ignored
under `tmp/native-app/science-enter-50-memtrace*`,
`science-enter-50-native-malloc*`, and `science-memtrace-producer.patch`.
The default Metal repetition was terminated at 178,930,672 physical GUI bytes
plus 22,462,968 worker bytes, after only 127 nodes and before any Enter input.
The latest managed live/heap observation was approximately 5/6 MiB. This is a
failed startup capture, not a completed action workload. A separate 1 ms native
allocation diagnostic paused the GUI at about 115 MB before the safety limit,
then recorded system maps and malloc stacks and intentionally terminated it.
Its later map showed a lower current footprint than the earlier peak, so a
paused snapshot alone cannot explain transient graphics charges. Its explicit
profiler and termination markers exclude it from normal runtime acceptance.
The complete default-Metal memory budget and visible presentation acceptance
remain open.

## Incremental accessibility follow-up

The allocation trace identified accessibility synchronization as a measurable
Enter cost. A first candidate deduplicated overlapping dirty subtrees. Although
its synthetic allocation regression improved, three complete application pairs
showed no material physical-memory or accessibility-latency improvement. That
candidate was withdrawn before testing the next hypothesis.

A diagnostic census of the actual 50-Enter patch stream recorded 1,647 node
creations and 1,790 child insertions. Adding a child dirties its parent; the
accessibility updater then expanded both old and current subtrees of that
parent, recomputing every unchanged sibling. The public updater contract takes
the store's drained dirty set, which already includes directly changed, moved,
and removed nodes.

The replacement expands descendants only when inherited visibility changes.
Directly dirty nodes and both ancestor chains still reconcile child order,
accessible names, and removals. A separate child-ID traversal removes an
intermediate node list without retaining another cache or changing order.

The 6,000-sibling insertion regression failed at 7,067,168 allocated bytes and
passes at 434,440 bytes against the unchanged 524,288-byte budget. Reading
10,000 child IDs fell from approximately 720,000 to 480,000 bytes. Visibility,
hidden ancestry, reparenting, removal, duplicate dirty IDs, and root replacement
tests compare incremental records with a fresh tree.

Three alternating before/after pairs used release OCaml 5.5.1, the same graph,
worker, full viewport, four requested raster workers, Cocoa diagnostic backend,
and 50 Enter events at 10 Hz. All six runs handled and persisted all 50 actions.
The table reports medians across the three runs of each variant. Physical
process values are taken at each run's combined physical peak.

| Diagnostic measurement | Before | Candidate |
| --- | ---: | ---: |
| Host allocation over the input recording window | 929.11 MB | 877.97 MB |
| Accessibility synchronization p95 | 9.27 ms | 0.60 ms |
| Active-frame p95 | 21.65 ms | 18.33 ms |
| GUI physical memory at combined peak | 93.62 MB | 94.60 MB |
| Worker physical memory at combined peak | 28.69 MB | 29.05 MB |
| Combined peak physical memory | 122.18 MB | 123.65 MB |

This is a CPU and allocation improvement, not a demonstrated retained-memory
saving. Frame time still exceeds the 16.67 ms editing budget. The diagnostic
RSS override, unverified UI settlement, and incomplete visible presentation
evidence prevent these runs from certifying interaction or FPS acceptance.
The default renderer is unchanged and its memory budget remains open.

A separate temporary oracle rebuilt the complete accessibility tree after
every application repaint. All 126 comparisons matched the incremental tree;
the app exited normally with all 50 Enter actions persisted. This extra work
is excluded from performance comparisons. The complete LUI test suite and
native host tests pass against the staged candidate. The temporary census and
parity hooks were removed from application sources.
The fix is published as LUI `943e9acd` on `feat/ml-backend`. A standalone
formatter check remains nonzero for both modified implementation files and
their unchanged baseline; this change does not reformat the surrounding code.
This decision document passes validation. Repository-wide document validation
still reports the same 13 unrelated pre-existing failures.

The source patch, frozen executable identities, per-run provenance, full
reports, withdrawn candidate, and parity diagnostic remain ignored under
`tmp/native-app/science-a11y-*` and `science-enter-patch-census/`.

### Long allocation capture

A subsequent Memtrace recording retained the same full viewport for 650
seconds, including more than 600 seconds after the final input. All 50 Enter
actions were handled and persisted, and both processes exited normally. A
600-second trace window beginning 30 seconds after replay startup estimates
112.08 MB allocated, or 186.8 KB/s. The corresponding runtime counter window
spans 599.01 seconds and records 114.05 MB, or 190.4 KB/s, 48 minor collections,
four major collections, and no additional layouts. There are 44 additional
SDL events, so this is a quiet application diagnostic rather than a zero-event
idle acceptance run.

| Inclusive allocation stack in the trace window | Estimated bytes |
| --- | ---: |
| Ctypes foreign-call invocation | 54,160,000 |
| SDL event waiting | 32,400,000 |
| Event draining | 14,400,000 |
| Metrics JSON snapshot | 10,560,000 |
| Native performance-clock reads | 7,760,000 |

These inclusive stacks overlap. SDL waiting belongs to the Ctypes total;
adding the rows would double-count allocations. The largest confirmed
background sources include polling and FFI wrappers, not repeated layout.
Changing the idle timeout alone would delay worker responses: the current
worker wakeup sets a flag without waking SDL. Any event-loop change must cover
that boundary and preserve asynchronous UI updates.

Before disposing the still-mounted app, two diagnostic major collections leave
22,166,544 live managed bytes in 42,373,856 bytes of heap capacity. Use this
explicit GC checkpoint for live managed payload; sampled lifetime estimates
and callbacks around the final checkpoint are not an exact substitute. During
the runtime counter window, heap capacity increases about 3.18 MB while the
last-GC live observation decreases about 1.81 MB. This does not establish an
unbounded retained-object leak.

The profiled run peaks at 104,039,432 physical GUI bytes plus 25,854,456 worker
bytes. Profiling and metrics exports remain enabled, so these values do not
replace uninstrumented memory or FPS acceptance. Raw trace, decoded events,
runtime counts, and attribution remain under ignored
`tmp/native-app/science-enter-50-a11y-idle-650*`. The temporary producer and
Memtrace link dependency were restored after freezing the diagnostic binary.

## Default Metal memory after startup

The earlier 200 MB protection runs ended during startup and did not measure
retained GUI memory after loading the page. A bounded diagnostic now keeps the
same release executable, installed LUI revision
`943e9acd7bac25e18b69d39136b62ac5e1a3c513`, fixed worker, isolated graph,
2880 by 1800 physical viewport, and 50-Enter replay running for 90 seconds.
Only an ignored collector copy raises the combined physical guard to 400 MB;
the normal collector and its 200 MB guard are unchanged. RSS is recorded without
a threshold in this explicitly labelled diagnostic. No Memtrace producer is
linked. A screenshot confirms the loaded page, and all 50 actions are handled
and persisted. UI settlement and presentation FPS remain unverified.

The GUI SDK records a lifetime peak of 204,932,056 physical bytes. External
sampling sees a combined peak of 227,902,928 bytes, consisting of 199,492,568 GUI
bytes and 28,410,360 worker bytes at that instant. These peaks occur at different
times and must not be added. Median GUI footprint is 104.60 MB at 35–55 seconds
and 106.22 MB at 80–89 seconds; corresponding worker medians are 27.08 MB.
The final combined footprint is 133.65 MB. Startup working memory therefore
retires substantially, but the remaining GUI allocation is still a separate
optimization target. A 90-second diagnostic cannot establish long-run stability.

A `vmmap` snapshot at approximately 67 seconds reports 100.7 MiB physical
footprint, with these major, disjoint VM categories:

| VM category | Dirty plus swapped memory | Interpretation |
| --- | ---: | --- |
| `VM_ALLOCATE` | About 35.8 MiB | Includes the OCaml heap and other VM allocations; not all managed live payload |
| Malloc zones | About 31.5 MiB | 19.6 MiB allocated payload and 11.9 MiB fragmentation/unused capacity |
| `IOSurface` | 19.8 MiB | Consistent with one full-resolution BGRA frame |
| Other graphics categories | About 3.8 MiB | `IOAccelerator (graphics)` and `owned unmapped (graphics)` |
| Remaining private categories | About 9.8 MiB | Framework data, metadata, stacks, page tables, and other private regions |

The VM figures use binary units; application counters use decimal bytes. Do not
add the managed GC heap to this VM breakdown: managed large objects may reside
in malloc pages, so those measurements overlap. Near 53 seconds the runtime
reports 32,626,016 heap-capacity bytes and 22,596,864 last-GC live bytes. Heap
capacity is not the same as currently live payload.

The matching `heap` snapshot reports 20,585,776 allocated bytes, of which
15,097,604 bytes in 23,001 allocations are classified as non-object. Resolving
those allocation stacks, including OCaml runtime tables and large objects, is
more useful than treating all GUI footprint as an unavoidable Metal baseline.
The malloc-zone fragmentation is also a measured follow-up target, not proof
that all those pages can be reclaimed without changing allocation behavior.
The worker's approximately 27 MB remains acceptable for this investigation.

A second, explicitly profiled run enables `MallocStackLogging` only for the GUI
and captures live allocations after the same input workload. All 50 actions
persist and both processes exit normally. The live malloc snapshot resolves
these previously untyped allocations:

| Allocation owner | Live allocated bytes in the profiled snapshot |
| --- | ---: |
| OCaml managed large objects, `caml_shared_try_alloc` | 5,585,920 |
| Runtime frame descriptors, `add_frame_descriptors` | 2,113,536 |
| GC custom, ephemeron, and reference tables, `realloc_generic_table` | 1,884,160 |
| Input/output channel buffers | 409,600 |
| GC marking stack | 278,528 |

The managed large-object row overlaps the GC heap and is not extra native
payload. Runtime tables and frame descriptors are outside managed live-object
counts. These stacks establish allocation owners, not a fix or an avoidable
retention size. The profiled snapshot also has 16.2 MiB of performance-tool data
and two full-frame-equivalent IOSurfaces rather than one; its footprint cannot
be substituted for the unprofiled baseline or corrected by subtracting a single
constant. Raw snapshots and parsed stack groups are retained under ignored
`tmp/native-app/science-metal-poststartup-malloc-90/`.

Apple documents that drawables are expensive resources, with a default pool
limit of three and a supported limit of two. A 2880 by 1800 BGRA8 frame requires
20,736,000 bytes before alignment. Multiple buffers can therefore account for
tens of megabytes during active rendering, but the documentation does not
establish a universal 100–200 MB minimum for a Metal GUI. Apple also distinguishes
logical buffer length from allocated size and recommends inspecting live
resources in the Metal memory viewer.

Sources:

- [Synchronizing CPU and GPU work](https://developer.apple.com/documentation/metal/synchronizing-cpu-and-gpu-work)
- [Analyzing memory usage](https://developer.apple.com/documentation/xcode/analyzing-memory-usage)

The recording and snapshots are retained under ignored
`tmp/native-app/science-metal-poststartup-90/`; the guard override and source
hashes are recorded in `science-metal-poststartup-90-provenance.json`. This
result corrects startup-only attribution and does not certify the memory,
interaction-latency, or FPS goals.

## Managed live payload and input synchronization

A fresh Metal Memtrace diagnostic uses the current release source and installed
LUI revision `943e9acd7bac25e18b69d39136b62ac5e1a3c513`. It samples at 0.0005,
completes and persists all 50 Enter actions, and forces two diagnostic major
collections at 60 seconds while the page remains mounted. The retained marker
is delayed another second so deallocation callbacks can run. Exact GC live
payload is 19,223,696 bytes in 32,847,288 bytes of heap capacity; sampled live
payload is 17,536,000 bytes. The estimates are not exact object sizes.

| Disjoint sampled live owner | Estimated bytes |
| --- | ---: |
| Flex layout | 3,616,000 |
| Signals | 2,496,000 |
| Native element snapshots | 1,904,000 |
| Scene, including CPU atlas pixels | 1,616,000 |
| Retained store | 1,344,000 |
| Layout adapter | 1,088,000 |
| View runtime | 960,000 |
| Retained paint fragments | 880,000 |

Unlike the earlier software-renderer lifetime snapshot, this Metal checkpoint
does not identify a single multi-megabyte loop allocation as retained payload.
The temporary producer, explicit collections, and Memtrace dependency are not
part of the shipped source. Raw evidence is retained under ignored
`tmp/native-app/science-metal-live-current-v3*`. Two earlier launch attempts
are excluded: one used the previous binary and ended early, and the other
failed dynamic-library loading before metrics started.

The input trace attributes approximately 31.7 MB of allocation to temporary
preorder lists built by autofocus, appearance, overlay, and scroll store scans.
Those scans now use the existing intrusive-tree iterator. Lifecycle sets keep
physical identity when membership is unchanged; equal-size member replacements
still rebuild them. Native event admission reads required properties directly
through the shared protocol predicate rather than constructing a temporary
property map containing every admission flag.

Four 6000-node allocation regressions first fail at approximately 289 KB per
scan, or 577 KB for the two scroll scans. They now use 514, 506, 386, and 914
bytes respectively, under unchanged 16 KiB budgets. A dense 6000-node appearance
case first measures 3,557,360 bytes and now uses 864,592 bytes, below its unchanged
1,000,000-byte budget. The initial direct-set-insertion experiment regressed the
dense case and was replaced before committing. Tests preserve tree order,
visible/enabled autofocus eligibility, overlay scope and stacking, appearance
removal/re-addition, equal-size member replacement, and tracked-list order.
A native-admission matrix covers every standard kind, both ordinary/treeitem
roles, and all 32 flag combinations. Existing protocol tests retain the
independent expected admission behavior.

The full LUI build/test aliases and native application host tests pass. The
formatter invocation cannot certify formatting because the repository has no
formatter configuration and the tool declines to run without opt-in. No compiler
warnings are disabled. Application memory and timing must still be measured with
the rebuilt binary; fixture allocation savings are not retained-memory or FPS
acceptance.

A separate unchanged-binary allocator control removes the inherited
`MallocNanoZone=0` setting only from the GUI. Its 35–55-second GUI median is
102.89 MB and its 80–89-second median is 104.71 MB, versus 104.60 and 106.22 MB
in the earlier run. One such pair cannot distinguish a small allocator gain
from run variation and does not solve the memory target. Worker configuration
is unchanged.

### Application crossover and idle menu callback

The release crossover uses the full Metal viewport, the same isolated graph,
worker executable, SDL library, runtime settings, and 50 Enter actions at ten
per second. In the first completed before/after pair, both applications handle
and persist all 50 actions and exit normally. Host allocation decreases from
882,734,328 to 804,155,056 bytes. GUI physical-footprint medians at 80–89 seconds
are 105.91 MB before and 101.53 MB after. The second optimized run allocates
834,375,280 bytes and has a 103.97 MB GUI median over the same interval. These
samples show variability; they do not establish a stable sub-100 MB result.
The first pair's active-frame p95 remains 20.88 and 20.31 ms, respectively, so
neither passes the editing frame-time target. Presentation FPS is not certified.

The reversed pair's baseline run aborts before input with `no domain lock held`.
Its system crash report identifies `caml_callback_exn` called by an AppKit menu
action during `SDL_WaitEventTimeout`. The host's menu callback did not reacquire
the OCaml runtime released by that wait. This failed recording is excluded from
memory/timing comparisons rather than treated as a completed baseline.

A regression dispatches the real AppKit menu target through `sendAction`, first
with the runtime held and nested dispatch, then from the unlocked state used by
SDL. The callback allocates and runs a minor collection. It reproduces the same
fatal error before the fix. The callback now conditionally acquires the runtime
and restores its original ownership afterward. The regression and full native
host tests pass, including allocation after an unlocked callback. The original
system crash report and red/green logs remain under ignored
`tmp/native-app/science-native-menu-crash.ips` and
`tmp/native-app/science-menu-runtime-*.log`.

Input synchronization is committed in LUI as
`d62bb7efa9843d5b45bc347ebfef0b0bea43396c` on `feat/ml-backend`. The runtime
package is explicitly reinstalled after updating its pin; pin synchronization
alone is not evidence that installed code changed. The final app must be built
against that installed package and include the menu boundary repair. The
memory goal remains open, with GUI and worker footprint reported separately.

### Installed release verification

The installed classic runtime package's protocol and focus sources match LUI
`d62bb7efa9843d5b45bc347ebfef0b0bea43396c`. A fresh build against that installed
package passes the native host test alias and includes the menu runtime repair
committed as `e415ce47ec`. Both release and profiling bundles are rebuilt,
ad-hoc signed, and verified; their executable SHA-256 is
`8b38f2af28aec9e09bc662c7e761c9a752c8ea67e7f1a76f1e24f0c23c96b5e6`.
Neither executable contains the temporary Memtrace producer.

The final release runs the same 90-second Metal workload and handles and
persists all 50 actions. Every metrics sample reports a visible window, and a
native screenshot confirms the loaded page and created rows. At 80–89 seconds,
median GUI physical footprint is 104,973,296 bytes and worker footprint is
28,574,200 bytes, approximately 133.55 MB combined. Host allocation is
828,889,624 bytes. Active-frame p95 is 20.95 ms, and the displayed FPS counter
still reads zero despite successful rendering. This verifies the rebuilt
workload and avoids a premature memory or frame-rate claim. Physical memory
varies across runs, including the earlier optimized 101.53 and 103.97 MB GUI
medians. Startup combined physical peak is 227,690,008 bytes, above the normal
200 MB guard; the explicitly labelled 400 MB diagnostic collector remains
necessary for this investigation. The applications exit after recording.

The final run is retained under ignored
`tmp/native-app/science-input-menu-final-metal-90/`. The memory target and the
long idle, scrolling, and frame-time acceptance remain open. Document validation
passes for this decision; the full documentation check still reports thirteen
pre-existing invalid documents outside this change.

### Scalar property binding retention and application control

The retained-allocation trace identifies signals as a substantial live owner.
Typed scalar properties previously created an owned conversion signal before
installing their scoped runtime observer. Conversion now happens in the
observer, removing the intermediate computation without changing ownership of
the caller's source. LUI commit `0247464c03d0275bf4228b9294ad43a4bc91ee14`
contains the change on `feat/ml-backend`.

A 2000-node retention regression fails at 1104 extra bytes per binding before
the change and passes at 328 afterward, under its unchanged 768-byte budget.
Separate tests cover all affected value conversions, batched publication,
derived-source diamonds, shared borrowed sources, and queued node/scope
disposal. The full LUI suite and native host test alias pass. This fixture
saving is not a prediction of the full application's physical-memory saving.

The controlled release pair uses identical graph, worker, SDL, viewport, and
50-Enter input, with no builds or tests during recording. Both runs last about
92 seconds, handle and persist all 50 actions, report visible windows, and exit
normally. At 80-89 seconds, GUI medians are 105399256 bytes before and 104137712
after; worker medians are 28541432 and 27509240 bytes. Host allocations are
818676168 and 819268488 bytes, respectively. Active-frame p95 is 19.35 versus
19.47 ms. This is a small physical-memory difference in one pair, without a
measured allocation or timing improvement; it does not solve the main problem.

The before executable SHA-256 is
`8b38f2af28aec9e09bc662c7e761c9a752c8ea67e7f1a76f1e24f0c23c96b5e6`;
the candidate is
`847f1cf9dd50eb6419c9569258075c43cc8e91f07a3883ca9b2924e7f94575a7`.
The candidate was built against an isolated installation of the committed LUI
sources. After the captures, the global runtime pin is synchronized and LUI is
explicitly reinstalled; both installed binding source files match that commit.
After the Enter publication fix below, the normal release bundle is rebuilt
against this installation. Its packaged executable SHA-256 is
`1c21241460f37d9b5ec366f345093de21596f3fd18137269be837d6100bab64c`;
the temporary model-order trace is absent. Recordings remain under ignored
`tmp/native-app/science-property-binding-before-metal-r1/` and
`science-property-binding-after-metal-r2/`. The first candidate recording was
stopped to restore manual input and is excluded despite its successful exit
code. Isolated SDL replay deliberately discards real mouse and keyboard events;
its input success cannot establish operating-system input or IME acceptance.
The normal 200 MB guard and all acceptance targets remain unchanged.

### Physical ownership beyond the managed-allocation trace

The previous native-allocation analysis summarized malloc blocks but omitted
the anonymous-VM backtraces already present in the system capture. That was an
attribution gap: Memtrace's live-object owners alone do not explain the GUI's
physical footprint. Stop selecting small allocation optimizations from those
owners until the major physical regions are reconciled.

The candidate's unprofiled `vmmap` snapshot at approximately 60 seconds reports
98.8 MiB of physical footprint. Its disjoint region categories are approximately
34.9 MiB of anonymous `VM_ALLOCATE`, 30.5 MiB in malloc zones, 19.8 MiB of
IOSurface backing, and 13.6 MiB in the remaining categories/accounting residual.
The malloc-zone total consists of about 18.5 MiB of allocated payload and
12.0 MiB of allocator-reported fragmentation. These rounded categories describe
one snapshot, not the independently measured 80-89-second median. Managed large
objects occupy malloc blocks and must not be added again to the region totals.
The residual is not yet attributed to individual owners.

Two fresh system-stack captures on the candidate confirm that the largest
anonymous-VM owner is `caml_shared_try_alloc -> caml_mem_map ->
caml_plat_mem_map`. The second inverted physical call tree attributes about
31.3 MiB to those major-heap mappings, 5.95 MiB of malloc payload to managed
large allocations, and 2.00 MiB to minor-heap commitment. Runtime metadata and
buffers include 2.10 MiB from `caml_stat_calloc_noexc`, 1.80 MiB from
`realloc_generic_table`, and 480 KiB of input-channel buffers. These are current
live allocations or mapped dirty/compressed pages, not cumulative allocation
traffic or reserved virtual address space. The same capture's nearby GC
observation reports 31949456 heap bytes and 21942168 last-observed live bytes.
Do not subtract these different accounting views and label the difference an
exact free-pool measurement.

The installed OCaml 5.5.1 runtime source explains one missing accounting path:
`pool_release` in `runtime/shared_heap.c` subtracts a released pool from the
domain's `pool_words` and puts it on `pool_freelist.free` without unmapping it.
`caml_gc_quick_stat` in `runtime/gc_ctrl.c` reports active pool and large-object
words; compaction explicitly unmaps that global free list. This establishes
that the HUD's heap-capacity field does not include every retained runtime
mapping. A debugger snapshot after the Enter burst directly walks 202 free
pools, checking that each has no domain owner and that the chain has no cycle.
The installed runtime's 4096-word pool size makes this 6619136 bytes of retained
virtual pool capacity. This is not an exact dirty/compressed-page measurement.
Active-pool slack and retained application owners still need to be separated
before choosing a fix.
The earlier diagnostic compaction result cannot substitute for this separation
or justify adding compaction pauses to the application.

The free-list snapshot is saved under ignored
`tmp/native-app/science-free-pool-count.json`, with its debugger transcript in
`science-free-pools-after-metal-r2/pool-debugger.txt`. It is a short, paused
diagnostic and cannot satisfy the 600-second idle requirement. The initial
debugger script import fails because its filename contains hyphens; that
attempt yields no count. The corrected script attaches, reads the chain, and
detaches successfully. Neither attempt is a performance baseline.

Raw captures remain under ignored
`tmp/native-app/science-physical-owners-after-metal-r1/` and
`science-physical-owners-after-metal-r2/`. Both handle and persist 50 actions
and exit normally after about 92 seconds under the finite 400 MB diagnostic
guard. Stack logging adds its own 16.2 MiB category and changes allocator and
drawable behavior; the second recording also changes window visibility. It is
ownership evidence, not a timing baseline or an estimate of unprofiled memory
obtained by subtracting a constant profiler cost. The first malloc-only class
filter returns an empty tree; the second unfiltered inverted tree provides the
allocation owners above. Attempts to query the exited first process produce
no usable evidence. Current measured ownership does not establish that the
remaining footprint is necessary, nor does it close the memory target.

## Runtime pool census and active graphics attribution

The October 16 investigation uses the native Metal executable and the existing
cloned graph. These are diagnostic attribution runs, not memory or frame-rate
acceptance. Production behavior is unchanged by the following controls.

A read-only debugger census walks all runtime pool lists and checks their totals
against runtime counters. Before compaction, 850 active pools occupy 27852800
bytes: occupied object slots account for 18357760 bytes, free slots for 9275336
bytes, and headers/internal fragmentation for 219704 bytes. Another 162 globally
cached empty pools have 5308416 bytes of virtual capacity. Large allocations
account for 4035168 bytes. Occupied slots can include unreachable objects awaiting
collection; these figures must not be described as reachable live data. Debugger
pauses also invalidate timing and sustained-idle conclusions from that recording.
The census is saved in science-pool-census-current-r1/pool-census.json under the
ignored native diagnostic directory.

Two reverse-order controls distinguish runtime pool reclamation from native
allocator pressure relief. Compacting first reduces physical footprint from
99206104 to 82805720 bytes and heap capacity from 31586800 to 19180824 bytes;
subsequent malloc-zone pressure relief returns zero bytes. Reversing the order
also returns zero bytes from pressure relief, then compaction reduces footprint
from 100516848 to 84001776 bytes. Compaction takes 54.3–55.9 ms. Combined GUI and
worker footprint still measures about 112.3 MB afterward. Periodic compaction is
therefore rejected: it misses both the memory target and the editing frame
budget. The two controls are summarized in
science-heap-capacity-oracle-results.json.

A fresh startup-to-retained Memtrace recording uses the current root and LUI
revisions. Two diagnostic major collections before mounted-view disposal report
18827592 live bytes. The sampled estimate is 17360000 bytes across 198 retained
samples. Sampled owners include flex state (3.84 MB), signal state (3.04 MB), scene
state (1.84 MB), layout state (1.84 MB), and the UI store (1.36 MB). Sampling error
limits individual source-line conclusions. This recording identifies managed
owners, but cannot account for the larger physical graphics peak. Evidence is
in science-current-retained-memtrace-r1.

The parent environment supplies MallocNanoZone=0. GUI-only controls removing that
variable or setting it to 1 produce approximately 101.4 MB and 99.4 MB steady GUI
footprints respectively, before adding approximately 28 MB of worker memory.
Neither supplies a budget-sized reduction. Allocator environment variables must
be included in future run provenance; no production allocator setting is changed.

A same-process active/quiet vmmap pair identifies the dominant peak categories.
At 8.24–8.98 seconds during rapid Enter, GUI footprint is 197.2 MiB, including
59.3 MiB of IOSurface residency and 65.4 MiB of owned unmapped graphics memory.
At 45 seconds, footprint is 87.0 MiB, IOSurface residency is 19.8 MiB, and owned
unmapped graphics memory is 1.4 MiB. VM_ALLOCATE residency stays at 24.6 MiB in
both snapshots. These categories explain most of the transient increase, but do
not yet identify the exact allocation owner or prove that overlapping graphics
accounting can be added independently. The snapshots and capture interval are
in science-active-peak-map-r1.

Forcing framebuffer-only drawables in a diagnostic interposer still reaches
approximately 215 MB GUI footprint. It does not establish readback or backdrop
parity, and is not a production candidate. The first Metal System Trace attempt
is invalid: a wrapper timeout killed the recorder while it was saving, leaving
an unexportable trace. A replacement 25-second recording saves and exports
successfully. It attaches after startup and records transient 128 KiB instance
buffers, plus the device allocation counter falling from about 62.3 MiB to 22.7 MiB after activity. Its
kernel resource table is also empty, so exact graphics ownership remains open.
A separate Game Memory attachment never starts: a recorder stack sample shows
it waiting in AuthorizationCopyRights during MemoryPlugin startup. It is
terminated after the bounded test app exits and is excluded from conclusions.
The subsequent diagnostic records graphics-ledger changes around in-process
IOKit calls without requiring debugger authorization.

The in-process IOKit interposer first covers only external-method calls and
records 720 calls without observing the large allocation. That coverage is
insufficient: Metal submission uses a fast trap. A second recording also covers
all seven public IOConnectTrap variants. It observes the graphics footprint
ledger rising by exactly 67108864 bytes inside trap4 selector 0, called from
IOGPUCommandQueueSubmitCommandBuffers through the Metal submission queue. The
same call increases physical footprint from 91210736 to 184304624 bytes; the
larger physical delta can include concurrent page residency and must not be
assigned entirely to the graphics ledger change. The first startup submission
also records a 71155712-byte graphics increase. Later resource-pool purgeability
updates return individual 1 MiB allocations. This directly locates a dominant
increase at GPU submission, rather than merely correlating heap samples with
frames. It does not establish a leaked resource, a configurable allocation size,
or a safe production fix. The diagnostic library does not change call arguments
or results. Raw stacks and extracted events are in science-iokit-ledger-r2.

A current-release software-presentation control runs the same graph, full
viewport, and 50-Enter script without profiling. Its sampled combined physical
peak is approximately 119.3 MB, versus approximately 243.2 MB in the instrumented
Metal IOKit recording. This pair identifies a large renderer-dependent cost,
but is not a clean timing crossover: the Metal process is instrumented and the
software process is not. The software run records all 50 Enter key-downs; its
late GUI and worker medians are approximately 88.7 MB and 30.0 MB. Recorded host
input-latency p95 is 23.58 ms across 54 observations, while presentation samples
are absent. Neither memory nor visible-interaction acceptance passes, and the
default renderer remains unchanged. A separate Memtrace run measures 23141944
live bytes after diagnostic major collections, versus 18827592 bytes on Metal.
Its sampled retained estimate is 22.80 MB across 218 objects; approximately 3.92 MB is attributed to raster image
staging. These measurements bound the managed-payload difference, and do not
attribute the entire physical remainder to that payload. The tiled software path
also explicitly rejects shader effects, so it is not a feature-equivalent
default replacement on this evidence. Evidence is in
science-current-cocoa-r1 and science-current-cocoa-memtrace-r1.

The local date changed during these runs. A baseline count taken before editor
activation can include the initial click-created row as well as 50 Enter actions.
Future Enter-only acceptance must measure the baseline after editor activation
and before the first Enter, rather than reuse a historical graph count.

The combined 30–100 MB goal remains unmet. These diagnostics use a temporary
400 MB combined physical guard and bounded lifetime; the normal collector keeps
its 200 MB guard. No forced collection, allocator override, debugger pause, or
occluded-window replay counts as final interaction acceptance.

## Nested native row mounting and editor lifetime

Native Journals row gates only bounded top-level blocks. A mounted parent with
53 children eagerly created the whole nested tree, even when those children
were beyond the viewport. The new native integration regression first measured
1644 nodes and failed its 128-node initial limit. Nested children now use the
same per-row viewport lifecycle as top-level rows: 55 initial nodes, with
estimated extents, mount/unmount/reentry, and row identity preserved. Browser
list windowing keeps its existing path.

The active editing target now raises its row's mount latch before native focus
arrives. The target includes the pane scope, and its derived signal ignores
buffer-only changes. A separate regression exposed an intermediate failure:
a viewport unmount could dispose the newly mounted editor while native focus
was still pending. Active rows now retain the latch during that interval while
still recording their measured extent. A different pane cannot pin the row.

The actual native app reproduction injects 50 Enter actions, then the literal
focus-tail text, then Escape. Before the fix, the model has 51 rows but none
contains that text. After the fix, the final row contains it exactly once, all
orders are present and sorted, and native focus diagnostics match the active
editing UUID before Escape. This is isolated SDL input, not OS-input or IME
acceptance. Evidence is in science-enter-focus-tail-red-r1,
science-enter-focus-tail-pinned-green-r3, and its semantic-results.json.

The native release targets and test aliases pass; the independently executed
shared Web entry point reports 2080 checks and zero failures. The production
candidate hash is 6324bfa3815197834d5318a279c978bede8963da3f62e2ffb9d2f6475f4f1bfc.

An earlier 2-raster-worker control reduced sampled combined physical peak from
119293368 to 100058552 bytes, but also changed layout counts and retained heap.
The eager nested-tree mount depended on viewport timing, so the whole saving
cannot be attributed to domain count. No default worker-count or backend change
is selected from that pair.

The extended candidate workload adds 200 Unicode characters after 50 Enter,
then requires over 600 seconds after Escape. The first attempt stops at the
normal combined 200 MB RSS guard after 13.35 seconds, with 103630360 physical
bytes. Its count query preceded editor activation; it is excluded from semantic
and sustained-idle acceptance. Database queries also warm worker caches. The
replacement removes queries from the measured interval. It exits normally after
640.68 seconds, then reopens the same graph without resetting it. The reopened
journal has 51 ordered rows and the final row contains all 200 Unicode
characters exactly once. The native counters record 50 Enter actions, 200 text
commits, and 431 UTF-8 bytes. It temporarily guards physical footprint at
200 MB while reporting RSS, as authorized for diagnosis.

Sampled combined physical peak is 105416168 bytes; final GUI and worker
footprints are 76612592 and 26722808 bytes. Combined sampled RSS peak is
208945152 bytes. During 608.62 quiet seconds, event and layout counts do not
change, host allocation averages 195928 bytes/s, and sampled live bytes fall
from 27360960 to 26745408. Heap capacity grows from 31580136 to 35547480 bytes.
These sampled live-byte totals do not establish a leak, but polling and managed
heap capacity still contribute to idle memory. Complete timing histories have
no lost samples: active-frame p95 is 15.82 ms, input-latency p95 is 17.79 ms,
and layout p95 is 5.95 ms. Occluded software presentation does not establish
visible FPS. Neither the active peak nor the final combined footprint meets
the 100 MB goal.

Raw records are in science-nested-rows-cocoa2-long-r1,
science-nested-rows-cocoa2-long-r2, and science-nested-rows-long-reopen-r1.
Both memory runs use the normal full viewport; the replacement explicitly
selects the existing software backend with two raster workers. The default
Metal backend and its GPU submission working-memory issue remain open.

## Native mailbox wakeups and idle polling

A one-raster-worker control completes the same 640-second workload and reopens
the same graph with all 51 rows and the final 200-character title intact.
Combined physical peak is 102352360 bytes. The last positive GUI and worker
samples are 64570352 and 29229560 bytes. One zero-footprint GUI read during
process exit is excluded, not treated as a memory improvement. During 608.42
seconds without new events or layouts, host allocation averages 196181 bytes/s.
The worker-count control still fails the peak budget and is not a default change.

A separate 60-second allocation-only profile on the persisted graph estimates
11280000 allocated bytes. Inclusive stack groups include SDL blocking waits
(3200000 bytes), metric serialization (1520000), focus checks (1440000), and
event draining (1280000). These are sampled estimates and can overlap. The
native bridge only sets an atomic flag, forcing the host to poll every 16 ms.
A real cross-thread mailbox regression fails because the blocking SDL wait
reaches its timeout despite a queued callback.

The bridge now accompanies the first pending notification with an SDL user
event. Bursts coalesce until the main loop consumes the pending flag. Quiet
macOS waits can last up to one second and still wake for input and asynchronous
work. Recent activity retains its existing pacing; Linux shell pumping and
pending visible presentation retain 16 ms waits; an open metrics panel uses
250 ms. Regressions verify delivery during a blocking wait, preservation of
the queued event, all 100 callbacks in a burst, one notification per burst,
and calls before SDL initialization and after shutdown. The complete native
release targets and test aliases pass. Raw failed/passing test logs and the
allocation profile remain under the ignored native diagnostic directory.

The frozen production-source candidate has SHA-256
99cd78711fdf744abb6ced46c5c3f76d1f9d76558e347313cbfce640312c6dee.
Its full workload recording, science-event-wake-cocoa1-long-r1, exits normally
after 642.08 seconds. A same-graph reopen verifies 51 ordered rows and the exact
200-character final title. During 609.67 seconds without further input, two SDL
events arrive but layout count does not change. Host allocation averages
59513 bytes/s, versus 196181 bytes/s before the change. Quiet-loop averages are
approximately one iteration/s between notifications; their brief active pacing
raises the whole interval average to 1.39 iterations/s. Complete metric-history
exports remain enabled. Sampled live bytes fall from 25444008 to 25058632,
while heap capacity rises from 28119088 to 32004736 bytes.

Sampled combined physical peak is 100025880 bytes, and the last positive GUI
and worker samples are 67732488 and 30147064 bytes. One process-exit sample is
excluded. Combined RSS peak is 203669504 bytes. Complete timing histories lose
no samples: active-frame p95 is 17.09 ms, input-latency p95 is 20.77 ms, and
layout p95 is 6.95 ms. The run still fails the strict 100 MB physical bound and
the editing frame budget. This software-backend diagnostic does not solve the
default Metal submission allocation or establish displayed FPS; default backend
and raster-worker count remain unchanged.

A separate static-icon representation control rejects a predicted saving
before any production change. Three alternating fresh-process pairs compare
the existing compiled children constants with a packed build-time Marshal
payload and name/offset index. After two diagnostic major collections, physical
footprints are approximately 1.77–1.80 MB for the existing constants and
1.77–1.79 MB for the packed representation. This does not support a multi-MB
physical-memory saving from packing the constants. The control is an isolated
module fixture, not an application measurement; no icon codec or cache change
is adopted. Sources and results remain in science-icon-static-control.

## Native timer ownership and metrics serialization

A fresh 18-second CPU sample during 50 Enter actions and 200 Unicode text
commits observes 1536 distinct thread sections, including 738 with native
Host timer frames. These counts describe threads observed across the interval,
not simultaneous concurrency. Diagnostic counters for the complete workload
record 1572 scheduled timers, a peak of 25 timer threads, and 504 cancellation
records still retained at exit. Delay counts are 836 at 0 ms, 200 at 400 ms,
139 at 40 ms, 115 at 150 ms, 106 each at 120 and 300 ms, 53 at 12 ms, and 17
at 250 ms. Evidence is in science-cocoa1-cpu-input-r1 and science-timer-census-r1.

Each timer previously created a system thread. Cancellation neither released
its captured callback immediately nor suppressed a callback already queued for
the UI. Cancelled handles remained in a global table indefinitely. Real native
regressions fail for due-callback cancellation, immediate release of 1 MiB
payloads at both 0 and 60000 ms, zero-delay ordering, cancellation from another
callback, and inactive-handle retention. Clearing 10000 inactive handles retains
385424 bytes in the original implementation and zero bytes after the change.
The resource checks use diagnostic collections; application execution does not.

Zero-delay work now goes directly to the existing asynchronous mailbox. One
worker serves delayed deadlines through a monotonic clock and an interruptible
wake pipe. Queued tasks retain handles only; callbacks leave the active table
when cancelled or dispatched. Due batches preserve their deadline order and
callbacks execute on the UI entry thread. A shorter newly registered deadline
interrupts the worker's current wait. Mtime is an explicit native dependency.
Focused regressions and the complete native release build/test aliases pass.

The replacement CPU sample observes 346 distinct thread sections and one timer
worker. Both profiled runs handle all 50 Enter actions and 200 text commits;
their sampled combined physical peaks are 98731520 and 97207832 bytes. Profiler
runs do not establish application timing or the final memory bound.

The unprofiled replacement, science-timer-queue-cocoa1-long-r1, exits normally
after 640.73 seconds. A same-graph reopen verifies 51 ordered rows and the exact
200-character final title. Sampled combined physical peak is 99681768 bytes;
GUI lifetime peak is 69403632 bytes and worker peak is 30278136 bytes. Final
GUI and worker footprints are 66175984 and 30278136 bytes. RSS peak is
202194944 bytes under the temporary physical-only diagnostic guard. During
608.89 seconds without further input, one SDL event arrives but no layout runs.
Host allocation averages 58597 bytes/s. Sampled live bytes change from 24329888
to 25011392 and heap capacity from 27657440 to 31811256 bytes. Active-frame p95
is 17.06 ms, input-latency p95 21.28 ms, and layout p95 6.53 ms; no timing
samples are lost. The frame budget still fails. This is a closed-panel,
occluded software-renderer cohort, not default-renderer or visible acceptance.

Metric history export is a separate measured allocation source: the native log
copies the complete serialized history on every export. A real-file regression
with full histories first allocates 72745 bytes/export and fails its 8192-byte
budget. Writing the reusable serialization buffer directly allocates 5443
bytes/export and preserves all 31 recording boundaries, complete histories,
and the final timestamp. String snapshot callers retain their existing immutable
result; both interfaces share one formatter. Sample contents and export cadence
are unchanged. The complete native release targets and test aliases pass.

An open-panel cohort remains failing: science-timer-queue-panel-r1 reaches
102581736 combined physical bytes; science-stream-queue-panel-r1 reaches
105498136 bytes. Both handle 50 Enter actions and 200 text commits and exit
normally after approximately 36 seconds. The worker and GUI contributions both
vary between those runs, so the serialization allocation reduction is not a
proven physical-memory saving. The panel-open result and unchanged default
Metal submission cost keep the full 30–100 MB objective open.

Matched vmmap controls on the streaming candidate capture near the final text
commits. GUI physical footprint is approximately 63.3 MiB with the panel closed
and 68.3 MiB open. Mapped IOSurface dirty bytes rise from 1792 to 4144 KiB; the
open-panel map also contains 2336 KiB of owned unmapped memory, absent from the
closed map. VM_ALLOCATE changes from about 25.5 to 26.0 MiB and malloc-zone
dirty residency from about 27.4 to 27.5 MiB. These are diagnostic category
snapshots, not simultaneous full-app acceptance or proof of the unmapped
allocation's owner. Both allocator summaries show approximately 12.5 MiB of
fragmentation/unused capacity; that figure is not automatically reclaimable.
Evidence is in science-stream-vmmap-closed-r1 and science-stream-vmmap-panel-r1.

A separate native surface experiment compares all 256 opaque gray levels through
actual CALayer composition into a BGRA bitmap. BGRA and 8-bit single-component
IOSurfaces both reproduce every channel exactly across 65536 pixels. Surface
ownership is 262144 and 65536 bytes respectively, with or without the optional
contents-format hint. Apple's [contentsFormat documentation](https://developer.apple.com/documentation/quartzcore/calayer/contentsformat)
describes a hint, not a guaranteed application memory saving. This experiment
supports a bounded format investigation, not a production renderer change;
colored and translucent data still require their full representation. No image
format or default backend change is included in the timer/export fix. The
source and raw results are in science-gray-surface-control.

## Actual scroll memory cohort

The final-image census rejects grayscale storage as a material application
optimization: only 25 of 57 cropped images qualify, most already occupy a
single allocation page. Their predicted aligned saving is 114688 bytes from
3735552 image bytes. The complete presenter owns 4210688 bytes including
backgrounds. No format or segmentation change is adopted. Evidence is in
science-surface-census-panel-r1/surfaces/gray-analysis.json.

The first scroll script ended its pointer sweep at x999, outside the main
scroller's logical right edge near x997. Wheel events alone were insufficient
functional evidence; science-stream-scroll-panel-long-r1 is explicitly excluded
and stopped before its planned long idle. A separate native offset diagnostic
at [600,450] observes 0 to 6776 device pixels and back to zero, with scroll epoch
155 and a final 4516-pixel range. The corrected unprofiled script resets to that
position before scrolling. Its graph, worker, full viewport, software backend,
and single raster worker remain unchanged.

science-stream-scroll-panel-long-r2 exits normally after 670.81 seconds,
replaying all 602 pointer moves and 2400 wheel events across four alternating
sweeps. Combined sampled physical peak is 135267792 bytes, comprising 108463064
GUI and 26804728 worker bytes at that instant. Final physical footprints are
107381744 and 26673656 bytes; GUI lifetime peak is 108872664 bytes. Combined RSS
peaks at 230703104 bytes under the authorized temporary physical-only guard.
The sampled window remains occluded, so this is not screen/FPS acceptance.

Over the final 603.49 seconds, no layout runs; one SDL event is observed.
Host allocation averages 1015393 bytes/s and minor collections 0.466/s, failing
the existing 256 KiB/s and 0.1/s budgets. Last-completed-GC live bytes change
from 39044552 to 39441760 and heap capacity from 53329896 to 55108112 bytes.
These values do not establish an unbounded leak, but the retained post-scroll
footprint exceeds the target. The same graph requires retained-allocation
attribution before choosing another optimization.

The recorded scroll interval has active-frame p95 31.73 ms, input-latency p95
33.15 ms, layout p95 9.27 ms, scene-build p95 9.95 ms, and overlay p95 9.92 ms.
Timing histories lose no samples. The default Metal working set remains a
separate failure; neither the software cohort nor timer/export regressions
close the complete memory or performance objective.

## Retained paint fragment lifetime

A live-allocation diagnostic replays the corrected scroll workload using the
same release executable, sampling allocations from seconds 16 through 59.
Diagnostic full major collections run when sampling stops; these measurements
are not normal application memory acceptance. The run exits normally at 85.92
seconds. It estimates 23760000 newly allocated bytes still live, of which
21680000 have retained-paint allocation stacks. Fresh fragment records account
for 10560000 bytes, their rectangles for several more MB, and parent-map entries
for approximately 3200000 bytes. The live native store has only 436 nodes, with
436 shallow snapshots, zero subtree snapshots/handles, and 111 text layouts.
Evidence is in science-stream-scroll-live-profile-r1.

The paint cache uses the last painted child lists to purge deleted subtrees.
Those lists omit previously virtualized children and can change during nested
scope disposal. Parent links also survive deletion, and old geometry/interaction
hints recreate fragments for IDs absent from the final store. A repeated native
teardown regression initially leaves 113 fragments and 301 parent links for
one live store node; a second regression recreates resources from deleted-node
hints. Both fail before the fix.

LUI commit 4b8cc1d8 on feat/ml-backend prunes retired fragment, parent, pending
work, and virtual-window records at structural journal boundaries against the
final store. Hints name only live nodes, complete invalidation clears every
associated index, and dropping the last root still clears the presented scene.
The teardown regression now retains one fragment and one parent link. All 21
retained-paint tests pass, including full-paint scene equivalence, remounting,
virtual-window movement, random updates, root removal, and journal resync.
Complete LUI release build/test/install aliases and native application release
build/test aliases pass. The earlier formatter invocation returned success while formatting was disabled
by project detection; that exit status did not verify formatting. Explicitly
enabled checks show existing whole-file formatting differences on both the
baseline and changed source. No Dune files or warning policies change in LUI.

The rebuilt production candidate, science-retained-scroll-panel-long-r1,
uses executable SHA-256
106d83b7958d65b819349ab6a2adc9b84bebb506776e07220646b608a4ac03d3.
Graph, worker, input script/library, viewport, renderer, raster worker count,
and allocator environment match the unprofiled pre-fix cohort. It exits
normally after 671.54 seconds with all 602 pointer moves and 2400 wheel events.
Combined physical peak falls from 135267792 to 105088488 bytes; the peak occurs
at 24.14 seconds, with 79037424 GUI and 26051064 worker bytes. Final footprints
are 68207600 GUI plus 22643192 worker bytes, totaling 90850792 bytes, versus
134055400 bytes before. Combined RSS peak is 197197824 bytes. GUI lifetime peak
is 79152112 bytes. Worker footprint varies independently and is reported rather
than credited to the GUI fix.

The final 602.98 seconds contain zero events and zero layouts. Sampled live
bytes change from 11711656 to 12238792 and heap capacity from 25040456 to
25843584 bytes, substantially below the earlier retained 39 MB. Host allocation
still averages 1009419 bytes/s and minor GC 0.481/s with the metrics panel open;
those idle budgets fail. Scroll active-frame p95 is 30.29 ms, input latency
30.91 ms, layout 9.73 ms, scene build 10.10 ms, and overlay 9.87 ms, with complete
histories. The peak still exceeds 100 MB, actual screen presentation remains
unverified, and the default Metal working set is unchanged. This is a measured
retention fix, not completion of either memory or frame-rate acceptance.

A rebuilt native offset diagnostic independently verifies post-fix scrolling:
0 to 7333 device pixels and back to zero, scroll epoch 167, with five journals
and a final 4516-pixel range. It exits normally after 31.75 seconds. This is
functional offset evidence, not a replacement for screen-visible acceptance.
Evidence is in science-scroll-offset-after-r1/semantic-results.json.

An independent allocation-volume capture starts at second 65, after the same
scroll workload, and runs for 20 seconds without forced collections. It
estimates 19440000 allocated bytes. The largest stack groups include raster
operation bounds and damage comparison, overlay prefix/reuse lists, and
reversing the composed glyph list. Individual leading bounds stacks estimate
1920000, 1520000, and 1200000 bytes. These identify the next allocation owners;
no new cache or storage policy is selected from allocation volume alone. The
producer's alive column is inapplicable when live tracking is disabled and is
explicitly excluded from the parsed report. The diagnostic exits normally at
100 seconds. Evidence is in science-retained-scroll-idle-profile-r1.

## Default native presentation and glyph damage allocation

A fresh current-release default-renderer diagnostic, using the retained-paint
fix, still crosses the combined physical guard after 1.70 seconds. GUI footprint
is 182436824 bytes and worker footprint 19874296 bytes, totaling 202311120.
The guard terminates this isolated run before input acceptance. Evidence is in
science-retained-default-metal-r1. An opt-in software result cannot establish
the application's default memory behavior.

The post-scroll allocation capture identifies per-glyph rectangle construction
in raster operation bounds and atlas-overlap checks. A real Damage.update
regression with 1000 retained glyphs and a changing panel first allocates
217057 bytes/frame against its 49152-byte budget. Numeric integer bounds
accumulation and skipping overlap rectangles/closures when the relevant atlas
has no changes reduce the same test to 25137 bytes/frame. Fractional, zero,
empty and nested-clip bounds remain exact; changed mask/color atlas pixels
still redraw identical glyph records correctly. All 42 raster cases and the
complete release build/test/install aliases pass, including GPU parity.
LUI commit d44dc83c records this change on feat/ml-backend. Sources and logs
are in science-glyph-damage-red-r2.log and science-glyph-damage-green-r2.log.

macOS now selects the existing immutable-IOSurface/Core Animation presenter
and one raster worker when no renderer environment variable is present.
Explicit Metal selection remains available; Linux selection is unchanged.
The native sidebar material and transparent hole hook also run with this
presenter, preserving its compositor integration. The release native build and
test aliases pass. Presentation timing remains unavailable on this presenter;
its displayed FPS does not prove display acceptance. The screen/latency gate
and the full physical memory bound remain open.

The first default-path diagnostic uses executable SHA-256
c24996ece3d81d0e36d675784bc17c26f7231dcddb117f3bba634e35d407988a.
Its frozen source patch and build metadata are in
science-default-candidate-source.patch and science-default-candidate-provenance.json.
Neither LUI_GPU nor LOGSEQ_NATIVE_RASTER_WORKERS is supplied. The native log
confirms the IOSurface renderer and zero background raster domains. A matching
post-scroll allocation-volume capture estimates 12080000 bytes over 20 seconds,
compared with 19440000 before. The longer quiet metric interval measures about
733309 host bytes/s, still above the 256 KiB/s budget. Leading remaining stacks
are overlay prefix/reuse/reversal lists and raster glyph-array conversions.
The diagnostic exits normally after 101.70 seconds; it is not a sustained-idle
or visible-window acceptance run. Its sampled combined peak is 106038712 bytes,
so the allocation decrease is not a demonstrated physical-memory saving.
Evidence is in science-default-scroll-idle-profile-r1.

## Optimistic Enter order during asynchronous delta publication

The native application reproduces new empty rows above their original block
while the database has the correct order. An isolated input recording leaves
four optimistic rows without canonical `block_order`; a later membership patch
sorts those missing values before the original row. Reopening materializes the
canonical database order, explaining the apparent recovery.

Both operation responses and subscription broadcasts enrich deltas
asynchronously. A newer optimistic Enter replaces the page/list during that
work. The old result is then discarded by the physical-identity publication
guard, but its revisions have already been marked applied. Later responses
skip those revisions, permanently omitting their canonical rows in the current
view. Operation responses already stash every delta; adding another stash
would not repair the publication race.

Serialized apply attempts now checkpoint revision bookkeeping. If optimistic
input replaces their base, they restore unpublished bookkeeping and retry the
same batch against the latest page/list. A full load invalidates the attempt's
epoch, preventing its old asynchronous completion from marking revisions or
publishing over the loaded model. Journals subscription publication also stays
inside the serialized queue. Current editor identity and unsaved input survive.

Native integration regressions exercise real operation and subscription paths
for page and Journals, including input during enrichment and a full load during
an outstanding apply. Both operation-order cases and stale-revision cases fail
before their fix; both subscription-order cases fail before extending the fix
to broadcasts. All pass afterward. The complete native host suite passes,
and the shared JavaScript suite reports 2080 checks and zero failures.

A rebuilt diagnostic application and real worker process receive 50 Enter
presses at 10 per second. The first journal grows from 7 to 57 top-level blocks;
all canonical orders are present and sorted, with the original `hello` first.
After stopping and reopening the same graph without cloning or resetting it,
the complete captured UUID/title/order trees are identical. Periodic model
samples establish settled metadata independently of whether a metadata-only
change triggers layout. Ignored evidence is saved in
`tmp/native-app/science-enter-order-complete-green/`,
`science-enter-order-reopen-green/`, and `science-enter-order-results.json`.
This isolated SDL replay validates ordering and persistence, not operating-system
input, IME, memory-budget, or presentation-FPS acceptance. The temporary model
trace is excluded from production source and binaries.

## Alternatives considered

### Change renderer or reduce graph content

Neither removes the repeated application-side work, and both would alter the user's reproduction. Keep the Metal renderer and graph unchanged.

## Acceptance criteria

Acceptance uses the real SDL/Metal application, the existing demo graph, a release build, and the same window size and display. Each scenario warms up for five seconds, then records at least ten seconds and 120 actual presented-frame intervals. Input scenarios require at least 20 actions. Startup and warmup are excluded; no idle samples enter the active CPU distribution. Timing failures remain failures even when functional regression tests pass.

| Scenario | Correctness | Timing acceptance |
| --- | --- | --- |
| Navigation and buttons | Each of 20 clicks performs the intended action exactly once; opening and closing the metrics split preserves focus and usable controls | Active CPU and GPU execution p95 each <= 8.33 ms; input-to-host-frame p95 <= 32 ms |
| Scroll | Both directions move the intended scroll container; fractional wheel deltas are preserved; offset clamps at either end; the scrollbar is hidden at rest and visible during wheel or thumb interaction | Active CPU and GPU execution p95 each <= 8.33 ms; actual presentation interval p95 <= one display refresh interval |
| Fast typing | 200 characters at 20 characters/s produce the exact text and caret position, including Chinese IME composition | Active CPU and layout p95 <= 16.67 ms; GPU execution p95 <= 8.33 ms; actual presentation interval p95 <= 16.67 ms; actual FPS >= 60; input-to-host-frame p95 <= 32 ms |
| Repeated Enter | 50 Enter actions at 10 actions/s create exactly 50 additional blocks with the editor focused on the final block | Same editing timing limits as fast typing |
| Resize and full reflow | Content wraps and hit geometry remains correct after shrinking and expanding the viewport | Layout p95 <= 16.67 ms; record the maximum separately |
| Lifecycle | Close, reopen, and dispose twice without an exception or repeated cleanup | No ownership violation during UI service cleanup |

At least 95% of actual display intervals must fit the scenario's limit. The 120 FPS workload budget remains 8.33 ms even on a lower-refresh display. A 100 Hz display can accept a 10 ms presentation interval for navigation/scroll, but cannot certify 120 physical FPS. Editing still requires 60 actual FPS. CPU loop cadence is recorded separately and cannot substitute for presentation timing. Input-to-host-frame excludes GPU/display delay and must be labelled that way; it does not certify input-to-visible latency.

- Native regression tests fail before the fix and pass after it.
- Unchanged UI state does not trigger a full editor-focus search on every loop iteration.
- GPU presentation runs off the input thread and in-flight work is bounded.
- Unconstrained flex measurements reuse cached results and still invalidate after content changes.
- A visible caret follows the current editor model.
- FPS reports actual Metal presentations, and a dialog button opens a live split metrics buffer.
- Idle CPU and interaction timing improve in the same native app and graph after restart.
- Scrolling, focus, and input still work in the running app.

## Risks

- Incorrect invalidation could leave focus or geometry stale after remounts. Cover state changes and restart behavior.
- Native timing varies with system load; retain profiles and compare equivalent paths.

## Questions

None. The user authorized fixing all-operation native latency; the remaining questions are technical investigation tasks.

## Native memory budget

The current target is 30–100 MB for the combined native GUI and graph worker,
measured using macOS physical footprint, with RSS reported separately. A GUI-only
result must not be reported as meeting the application budget. Verify the release
application on the existing graph at its normal 1440×900 logical window size,
including startup, at least 600 seconds of idle time, navigation, scrolling,
editing, and resize. Preserve rich text editing and the interaction acceptance
criteria above. A smaller diagnostic viewport or a managed-heap reading alone
cannot establish acceptance. The external protection terminates the app when
either RSS or physical footprint exceeds 200,000,000 bytes.

Confirmed findings on October 15:

- Uninstrumented release startup still exceeded 200 MB. The protection
  terminated it; long-running full-application acceptance remains incomplete.
- The native icon bootstrap expanded the complete 6,192-icon registry despite
  the host already supporting lazy bundled-icon lookup. Its regression test
  measured 124,676,320 allocated bytes and a 3,354,990-byte envelope before the
  fix, versus 273,648 allocated bytes and a 41,674-byte envelope afterward.
- Resolved native SVGs now retain their identity on warm lookup. The regression
  records 48 allocated bytes per lookup and covers registry replacement,
  override removal, application icons, and lazy toolbar-icon resolution.
- Independent replay of the retained 2880×1800 page scene consumed about
  116 MB when submitted once per second, falling to about 41 MB after four
  seconds without submission. Device-owned Metal resources measured about
  25 MB in both states. This distinguishes driver working memory from retained
  application textures; it does not prove that the application meets budget.
- Idle scenes no longer resubmit periodically. Pending GPU updates still
  retry the latest scene, FPS changes refresh the HUD, and the open metrics
  panel continues refreshing. Native regression tests fail before these
  changes and pass afterward.

The memory objective remains unverified. Retained frame targets, drawable
pool size, driver working memory, and application startup retention require
further runtime measurement and optimization.

Further validation on October 15:

- Window drawables are limited to two. Idle trimming releases spare drawable
  capacity without modifying the rendered frame; tests cover original-size
  rendering, resize, and offscreen pixel preservation.
- Window frames now draw directly into an acquired drawable. An immutable
  native frame owns copied instance data and GPU references while background
  acquisition and encoding run; neither operation waits on the input thread.
  Private frame-target allocation is zero before rendering, after rendering,
  and after resize in the real SDL/Metal window regression. Offscreen targets
  remain owned and retain their pixel-parity behavior.
- Collapsed sidebars no longer create an unused material or keep the window
  transparent. Closing removes and releases the material; reopening restores
  transparent composition. The actual AppKit window regression fails before
  the lifecycle fix and passes afterward.
- All native host regressions and the full LUI regression suite passed,
  including 13 Metal pixel and GPU-budget cases.
- The normal release application's measured startup peak still reached
  221,299,720 bytes and was terminated by the 200 MB protection. These changes
  therefore do not establish the 30–100 MB application budget.
- A 0.5-second startup survivor sample estimates 15.76 MB allocated and
  5.84 MB retained by the bundled icon table's full parse and portable JSON
  conversion. This remains eager even though individual SVGs are now lazy.
  Its two diagnostic major collections are not part of normal operation.

The native icon provider now indexes array offsets in the original bundled
JSON and decodes only requested icons. Index construction allocated 633,600
bytes versus 18,913,744 bytes for eager portable-JSON conversion. Regression
coverage compares every bundled icon against the original parser, verifies
all names, memoized identity, missing entries, escaped keys, duplicate-key
precedence, and malformed table rejection. Native host regressions pass.
The normal 1440×900 release still crossed the protection threshold at
215,516,144 bytes during startup, so the application memory target remains
unmet.

A diagnostic CPU replay of the retained 2880×1800 modal scene with moving glyphs
used 33.21 MB, but recorded p50 34.48 ms and p95 58.12 ms. This excludes
window presentation and fails the editing frame budget, so it is not an
acceptable replacement renderer without substantial further optimization.

The native icon provider now converts the complete bundled resource during
the build. The generated table contains immutable renderer children, rather
than runtime JSON arrays. A regression compiling all 6,146 bundled icons
measured 1,410,016 bytes of eager module initialization with JSON constants;
immutable children reduce that measurement to 53,248 bytes. First native
lookup allocates 112 bytes instead of the indexed provider's 2,413,024-byte
initial load. Production no longer reads the JSON file, scans offsets, or
converts portable JSON into renderer children. Binary search returns the
same immutable value on warm lookup. Tests compare every bundled entry and
cover escaped names and values, duplicate precedence, empty tables, missing
names, malformed resources, and the startup allocation budget. Web adapters
decode at their boundary and preserve their existing rendering behavior.

The newly packaged uninstrumented 1440×900 release reached 210,011,120 bytes
of physical footprint and was terminated by the unchanged protection. The
600-second idle run therefore did not complete. This is still a failing
application memory result. Paused-process memory maps were collected only
for diagnosis and do not replace normal application acceptance.

Further inspection distinguishes the captured modal from ordinary page
captures: the modal includes a full-window alpha-128 fill. CPU sampling
identified polymorphic minimum comparisons in its translucent pixel loop.
Integer-specific saturation and byte writes preserve the existing pixels.
All 14 raster golden, damage, and semantic cases pass. An optional native
capture replay now checks moving-glyph pixels against a full redraw and
enforces a 16.67 ms p95 draw budget. The modal replay initially failed at
70.27 ms and still fails after optimization; it cannot justify selecting
the CPU renderer for the application. An ordinary page replay passes at
p50 2.93 ms and p95 4.07 ms. These measurements exclude presentation.

A separate 1440×900 AppKit/CoreGraphics window displaying the captured page
at its original 2880×1800 resolution peaks at 58.00 MB physical footprint
while scheduling repeated redraws. It is a presentation experiment, not
the complete application. The view retains one image provider across draw
calls, so borrowing a movable OCaml byte buffer without an ownership and
synchronization design would be unsafe. Actual application startup, long
idle, editing, modal performance, and resize still require validation.

Window raster staging now uses a reusable 64-row band. Its retained-pixel
regression fails with the whole-image renderer at 20,737,680 bytes and passes
with 737,792 bytes. The window presenter owns copied, immutable CoreGraphics
band images; source mutation and collection cannot invalidate them. Native
window tests cover retained pixels, resize, disposal, and unchanged SDL input
ownership. Raster coverage compares banded pixels with the existing golden
fixtures and whole redraws, checks resize and translucent rounded geometry,
and rejects redundant uploads for unchanged scenes. The ordinary captured
page's tiled redraw and pixel-copy replay records p50 12.45 ms and p95
12.63 ms; presentation is excluded, and the 8.33 ms target remains unmet.

Initial full-application CoreGraphics recordings still exceeded 200 MB.
Diagnostic inspection found both SDL and child views without layer backing;
changing that setting is therefore not justified by the evidence. Explicit
context flushing did not reduce the observed startup footprint and was
removed. A console-session inspection then confirmed that the Mac was
locked. The application had continued drawing while its window was not
presentable. The host now uses the public window-occlusion state to defer
layout/paint and presentation until the window is visible, retaining pending
model updates. Linux uses SDL hidden/minimized state. The hidden-window
regression and all native host tests pass. The current protected release
recording is approximately 38 MB while locked; this is an occluded-window
diagnostic and cannot establish the normal visible-window memory target,
actual FPS, interaction behavior, or the required visible idle duration.

The occluded release completed its 600-second external observation without
crossing the protection threshold: physical footprint peaked at 38.274 MB
and finished at 34.047 MB; RSS peaked at 114.459 MB and finished at 86.262 MB.
No forced collection or process suspension was used in this observation.
The Mac remained locked, so this still does not satisfy visible-window
acceptance.

Further modal replay sampling identifies opaque and translucent span writes
as the main raster work. Packed two-pixel stores and independent 16-bit
compositing lanes preserve the scalar rounding and saturation rules. New
byte-level regressions cover alpha endpoints, odd widths, offset starts,
destination transparency, and untouched edges; a preallocated 512×128
translucent fill stays below the unchanged 131072-byte allocation limit.
All 20 raster correctness and retention tests pass. The modal tiled replay
improves from p50 68.82 ms / p95 136.42 ms to p50 34.78 ms / p95 35.72 ms,
but still fails its 16.67 ms budget. The whole-image replay also still fails
the p95 budget. These CPU timings exclude window presentation, and this
optimization is included in the rebuilt release.

Default Metal startup also prefetched window-sized drawables before any
application frame. The window layer now starts at 1×1 without acquisition;
the submitted scene establishes the actual drawable size on the existing
background render queue. The cold-window regression failed before this
change and passes together with first-frame readback, idle restoration,
and resize coverage. The first full release recording after this change
still peaked at 111.379 MB physical footprint, exceeding 100 MB. It was
stopped after 202 seconds for further diagnosis and is not an idle
acceptance recording.

A native hidden-window memory regression then identified GPU pipeline
prewarming as a separate allocation. SDK physical-footprint measurements
over the initialization boundary reported 74,973,184 added bytes and
failed a 20,000,000-byte limit. Prewarming now checks the public window
occlusion state and skips invisible windows; offscreen renderers retain
their existing behavior. The same regression adds 1,998,872 bytes after
the fix. Subsequent full-size rendering, readback, idle restoration, and
resize still pass, as do the full LUI and native host suites. The release
has been repackaged with this change and restarted on the default Metal
path for external observation. This does not establish visible-window
startup or interaction memory.

The earlier isolated CoreGraphics result is not consistently reproducible.
Current whole-image and 64-row image experiments peak around 193–196 MB,
including after terminating the native GUI. Device RGB versus sRGB does
not explain the difference. These experiments remain diagnostic; they do
not justify changing the application's color space or selecting an
experimental renderer.

The uninstrumented default Metal release completed a 600.131-second
occluded-window observation with 1,179 external samples. Physical footprint
peaked at 39.601 MB and finished at 35.947 MB; RSS peaked at 117.785 MB and
finished at 117.703 MB. No forced collection or process suspension was used.
The required visible-window and interaction observations remain missing.

Memory acceptance is now enforced by the existing scenario CLI alongside
timing and functional acceptance. It requires physical footprint, RSS,
the SDK lifetime physical-footprint peak, window visibility, and logical
and pixel viewport dimensions. Startup peaks remain included after timing
warmup, physical peaks above 100 MB fail, and RSS above the 200 MB protection
limit fails. A reduced startup viewport, invisible post-warmup samples,
missing evidence, and visibility-sampling gaps above two seconds fail.
Invalid or decreasing measurements fail fast. The existing 600-second
idle-duration requirement remains unchanged. Thirty validator regressions
pass after reproducing nine incorrect CLI success results before the fix.

The native macOS exporter reads SDK `RUSAGE_INFO_V4` once per second when
metrics recording is enabled. Its lifetime peak captures increases between
individual samples. Window visibility uses the same public occlusion check
as presentation eligibility. Unobserved process metrics remain explicitly
unavailable. Native SDK, exporter, and allocation-budget tests pass; the
full-history allocation regression also includes process-memory fields.
A rebuilt live release emits the normal 1440×900 / 2880×1800 dimensions,
physical/resident/peak bytes, and `window_visible=false`. The validator
correctly rejects that recording as invisible. This is producer/validator
integration verification, not visible-window memory acceptance.

## Active renderer memory isolation

A content-free 2880×1800 render target reproduces substantial graphics
allocation: a legacy Metal clear peaks at approximately 88.3 MB physical
footprint, compared with 62.1 MB for a 1×1 clear. Metal 4 command allocators
produce approximately the same 88.5 MB peak, so no Metal 4 port is applied.
These are isolated driver diagnostics, not application acceptance.

The opt-in software presenter previously copied immutable CGImage bands
into an AppKit drawing context. A cold full-size SDL regression exceeds
its 200 MB protection limit before completing 120 updates. Immutable
IOSurface bands now go directly to Core Animation layers without that
client drawing context. The same regression peaks at approximately
82.4 MB and passes its 100 MB isolation budget. This test does not reserve
memory for application state or replace the whole-process 100 MB acceptance
limit. An attempted 70 MB renderer sub-budget fails at 81.9 MB. A safe
two-surface reuse probe submits only 20 updates in 10 seconds while occluded;
a three-surface probe submits all 1200 scheduled updates and peaks at 78.3 MB.
The 70 MB sub-budget is therefore withdrawn rather than treating unsafe
reuse as a fix. Neither prototype establishes visible presentation FPS,
and neither is included in production code. Resize, source
buffer reuse after collection, unchanged frames, partial updates, pixel
readback, disposal, and SDL mouse-event ownership remain covered.
IOSurface accounting includes the actual allocation size and row alignment.
The default application renderer remains Metal.

The first ordinary native-scene replay has total draw/present p95 5.22 ms
and physical peak 91.9 MB. The modal replay has p95 15.87 ms and peak
92.9 MB, so its frame latency is still inadequate. Longer pre-optimization
replays fail: the compatibility-library run reaches 200.3 MB RSS after
347.9 seconds, and a run linked to the exact bundled SDL2 library reaches
202.5 MB RSS after 377.0 seconds. Both are killed by the unchanged memory
cap. The latter rules out attributing the growth solely to SDL compatibility.
These replays force window updates while the window is occluded and do
not establish visible-window FPS or idle acceptance. The initial replay
also retained timing samples in lists; the harness now preallocates arrays
bounded by duration and its paced 120 Hz rate to reduce measurement overhead.

Allocation sampling of the actual captured CPU scenes finds approximately
31.6 MB/frame for the ordinary page and 140 MB/frame for the modal. The
largest sites are per-pixel bilinear sampling closures/color tuples and
inset shadows with an empty hole. Image sampling now uses per-renderer
channel scratch and direct integer clamp indices; empty inset holes use
the existing clipped fill/span path. New regressions fail at 8,575,946
bytes/frame for an image and 25,167,498 bytes/frame for an empty inset,
then pass at 23,498 and 31,442 bytes/frame. Their 1,000,000 and 262,144
byte limits are unchanged. A per-renderer clip-row cache also reduces a
320-glyph regression from 1,917,578 to 287,594 bytes/frame under its unchanged
512 KB limit. Clip stack changes, damage, resize, and multicore output are
checked for identical pixels. All 26 raster tests pass, including fractional
image coverage, grayscale, clipped continuous/circular shadow corners,
alpha/opacity endpoints, golden pixels, damage, and multicore equality.
Captured-scene four-worker CPU-only p95 is 1.47 ms for the ordinary page
and 7.07 ms for the modal, excluding presentation and frontend work.
A persistent-worker prototype increased memory without improving
latency and is not included in production code.

Malloc stack logging of the local 5.5.0 replay identifies live 48-byte
allocations from `caml_alloc_stack_cache`, through `domain_create`. The
installed compiler is OCaml 5.5.0; its domain termination does not free
this cache. The upstream fix is included in OCaml 5.5.1
([runtime fix](https://github.com/ocaml/ocaml/pull/14940)). CI already
selects 5.5.1, but the earlier local native builds used the 5.5.0 switch.
A complete 5.5.1 rebuild is required: relinking old package objects with
the new standard library fails its implementation checksum checks and is
not used. Native replay output now includes the compiler version so
recordings cannot silently obscure this distinction. This explains one
source of growth, not the entire active-process footprint.

The complete 5.5.1 LUI build/test suite passes after building its local
`@install` artifacts before the scaffold integration test. Native host
tests also pass, and the release GUI has been rebuilt with 5.5.1. A second
allocation snapshot records one live stack-cache allocation (48 bytes),
compared with 1453 allocations (69,744 bytes) in the 5.5.0 snapshot.
Sampling changes timing and these snapshots cover different intervals;
they establish cache release, not a direct byte-for-byte whole-process
comparison. The post-raster-optimization 5.5.0 replay completes 600 seconds
without hitting the protection limit: SDK lifetime physical peak is
126,911,472 bytes, sampled RSS peak is 167,886,848 bytes. It still exceeds
the 100 MB physical target. Its timing includes concurrent builds and
allocation diagnostics and does not establish a frame-latency improvement.
The 5.5.1 replay also completes 600 seconds. Its SDK lifetime physical peak
is 138,560,472 bytes; external sampling sees a lower 118,883,312-byte peak
and 160,563,200-byte RSS peak. Sampling alone would miss the transient
physical peak, so the 100 MB physical target still fails. Builds and
allocation diagnostics overlap portions of this recording too; its
18.147 ms draw/present p95 is not an uncontended latency comparison or
visible-window FPS acceptance. Locked-window GUI plus shared worker
footprint is approximately 88 MB; this is not active-window acceptance.

The software tile presenter can render bands on up to eight workers while
the caller alone uploads them. Each worker owns one staging band and waits
for its upload before reusing it; exceptions join all workers and invalidate
damage before retry. Parallel pixel, resize, upload failure, worker failure,
and bounded staging tests pass. Four workers improve the captured modal's
work budget, but do not resolve whole-application memory. This path remains
opt-in, and no persistent worker pool is added.

Scalar shadow integration previously allocated 3,003,226 bytes per redraw
in the 128×96 regression. Inlining its scalar helpers preserves the formulas
and reduces it to 252,650 bytes under the unchanged 262,144-byte limit.
The captured modal's four-worker tile replay then has 8.090 ms draw/present
p95 and SDK lifetime physical peak 101,893,104 bytes. It still exceeds the
100 MB limit and remains an occluded renderer fixture, not app acceptance.

An opt-in full-app repaint diagnostic now exercises the real frontend tree,
assets, host phases, and bundled SDL2 while the screen is locked. It records
the actual window visibility and does not claim physical presentation FPS.
With the metrics panel closed and one raster worker, node and snapshot counts
remain at 2517 while reported heap capacity grows from approximately 31 MB
to 40 MB. Draw work p95 is approximately 5.25 ms, but sampled RSS reaches
204,242,944 bytes after 10.68 seconds and the protection monitor terminates
the process. Four workers also exceed the cap. Worker concurrency is therefore
not sufficient to explain or solve the full-app memory issue.

An early full-app vmmap reports 125.3 MiB physical footprint, with 30.4 MiB
IOSurface dirty memory, 28.8 MiB VM_ALLOCATE dirty memory, 28.7 MiB malloc
dirty memory, and 19.8 MiB owned-unmapped accounting. Malloc reports 16.2 MiB
allocated and 12.4 MiB fragmentation. These categories do not separately
identify the OCaml heap, and shared library residency is not summed into
private process footprint.

A short serial full-app Memprof cohort estimates 63,120,000 allocated bytes
and zero surviving sampled bytes after two diagnostic major collections.
The largest sampled sites include rounded scanline bounds and shadow
integration. This does not establish an OCaml leak; the reported live-word
growth can include garbage awaiting major collection. Forced collection is
used only to classify ownership, not to meet memory acceptance.

Inlining scanline scalar helpers and folding clip intersections without
mutable accumulator references reduces an integral-edge 1024×768 clipped
fill regression from 290,418 to 112,706 allocated bytes/frame, below its
unchanged 131,072-byte limit. Rounded and fractional pixels remain covered
by the existing golden and differential tests; this allocation limit applies
to the integral-edge scanline fixture. All 33 raster tests and the full LUI
build/test suite pass. Full-app post-change memory validation remains pending.

The full-app repaint diagnostic after the scanline change still fails memory
acceptance. The SDK records a 139,117,576-byte physical peak; the external
guard terminates it at 201,670,656 RSS bytes after approximately 8.63 seconds.
Its active-frame p95 is 5.30 ms. The recording includes vmmap inspection,
so it is not a controlled before/after latency comparison.

## Controlled frontend memory comparison

An initial launch of the installed Electron 2.0.2 package uses a JavaScript
daemon and is excluded from comparison with the current native-worker branch.
The current Electron main process and UI are rebuilt from this worktree, with
the renderer's production flag enabled. An outdated installed local
`@logseq/graph-lifecycle` copy ignores the native binary argument; linking the
current local package restores the native daemon launch. This is dependency
setup, not a production source change.

The controlled comparison uses a consistent SQLite backup of the demo graph,
including its client-operations and search databases, under an isolated root.
Both frontends load that graph and use a 1440×900-point window at 2× scale.
The native frontend's boot log explicitly reuses the Electron-launched OCaml
daemon at port 63811, and its health response reports PID 95064. The shared
worker binary is built with OCaml 5.5.1. No forced GC is used for memory sampling.

At the end of a 30-sample recording, physical footprint is:

| Component | Native frontend | Electron frontend |
| --- | ---: | ---: |
| Frontend processes | 40.3 MB | 412.4 MB |
| Same OCaml worker | 33.6 MB | 33.6 MB |
| Application total | 73.9 MB | 446.0 MB |

Electron's frontend consists of 78.6 MB main, 289.4 MB renderer, 37.1 MB GPU,
and 7.3 MB utility processes. RSS totals are approximately 159.7 MB for native
including the shared worker and 738.4 MB for Electron. RSS sums include shared
framework pages and are not substituted for physical footprint.

The screen remains locked. The native host records `window_visible=false`
and zero layout runs, while the Electron renderer has constructed its DOM.
This measures each runtime's behavior in the locked state, not equivalent
visible rendering work, long-duration idle acceptance, or active memory/FPS.
The native 100 MB active-memory goal remains incomplete.

The worker storage adapter also retains committed payloads in an unbounded
strong read-through cache. A regression writing 256 historical 64 KiB leaf
values retains all 256 after diagnostic GC, then also retains all restored
payloads. Removing that cache releases them, but the requested implementation
must preserve a weak cache and benchmark behavior. The strong-cache baseline
is restored for that comparison. Warm-cache, mutable-address replacement,
payload lifetime, and unused-address lifetime probes remain local experiments.
The user has deferred weak-cache implementation; those unfinished tests are
excluded from this change. A separate 4k-movies
baseline startup exceeds the unchanged 200 MB protection limit and is killed;
it provides no passing benchmark evidence.

## Validation after the October 15 branch update

The branch is fast-forwarded to `27019f4dff` before restoring the local native
changes. The combined native executable and Melange UI compile with OCaml
5.5.1 in the release profile. Native host, icon generator, contract, and shared
boundary test aliases pass. The corresponding renderer's release `@all` and
`@runtest` pass, including all 33 raster tests.

The Web recording-host suite reports 2070 checks and 18 Journals failures.
A separate build of the unmodified `27019f4dff` UI produces exactly the same
18 failures. This establishes no additional failures in that suite for the
local changes; it does not establish a passing Web suite. The screen remains
locked, so active native UI, memory, and presentation acceptance remain open.

The Journals failures are subsequently traced to `Virt_list.rows_sig` ignoring
the existing `rtc-test=true` eager-rendering contract. The recording host has
no queryable DOM, so its virtualizer cannot attach and the day list remains
empty. The signal-row entry now uses keyed mounting in that mode, preserving
item identity through insertion, removal, and reordering. Ordinary rendering
and the explicit `virtualized=true` override retain virtualization.

Ten mode and row-lifecycle checks are added before the fix: the suite reports
2080 checks and 24 failures, including the original 18 Journals failures.
After the entry-point fix it reports 2080 checks and zero failures. Existing
Journals assertions and patch-operation budgets are unchanged. Release native
and Melange compilation and all UI test aliases also pass.

## Unfocused editor recovery allocation

A current-release full-app software repaint cohort estimates 40.48 MB of
allocation in 0.15 seconds. About 2.56 MB comes from constructing the preorder
node list for `Host_requests.editor_sink_bid`. The focus recovery runs even
when no editor exists. The diagnostic frontend reaches 136.15 MB physical
footprint and 198.33 MB RSS; it still fails the active-memory goal. Sampling
classifies allocation sites here, not retained-object lifetime.

The 1000-child unfocused recovery regression fails at 64,617 bytes/poll.
Streaming the traversal alone reduces it to 16,497 bytes/poll but still fails
the unchanged 1024-byte budget. Each `Lui_store.kind` call creates a temporary
`Some` wrapper. Its separate regression fails at 160,096 bytes for 10,000
lookups. A direct lookup preserving missing-node behavior reduces that to
96 bytes, and the combined recovery regression passes at 465 bytes/poll.
All LUI build/test targets and native host regressions pass, including editor
remount focus recovery. No new cache or invalidation state is introduced.

A 60-second default-Metal baseline has a 48.408-second interval after warmup
with no events or layouts: 2,052,869 host-domain bytes/s and 0.971 minor
collections/s. The fixed release completes a 625.504-second isolated demo
recording with the same worker, viewport, and normal GC settings. Its
612.574-second interval after warmup allocates 181,321 host-domain bytes/s
and runs 0.083 minor collections/s, with zero input events and layout runs.
Heap capacity changes from 9,955,776 to 12,522,376 bytes. The unchanged idle
validator reports no allocation, GC, layout, or event errors. Frontend physical
peak is 41,763,776 bytes; externally sampled frontend-plus-worker physical peak
is 62,277,024 bytes and RSS peak is 156,303,360 bytes.

Full acceptance still rejects this recording because the window is invisible
throughout. It does not certify visible-window memory, scrolling, editing, or
presentation FPS. A subsequent full-app software repaint diagnostic reaches
133,334,504 combined physical bytes and 206,946,304 combined RSS bytes after
1.132 seconds. The guard terminates it. Quiet-loop allocation is improved,
but the full memory goal remains unmet. No weak-cache changes are included.

## Default renderer resource accounting

The replay diagnostic now accepts every existing renderer. It continues to
reject nonpositive and nonfinite durations, and exports the real occlusion
state. Forcing repaint while occluded does not certify visible presentation
FPS, scroll behavior, or whole-graph acceptance. The default stays Metal;
no driver interposition or alternative-backend experiment is shipped.

At 2880×1800, an uninstrumented default-Metal app replay reaches
185,959,432 frontend physical bytes plus 20,054,520 worker bytes, triggering
the unchanged 200,000,000-byte combined guard after 1.608 seconds. RSS at
that sample is 164,134,912 combined bytes. The trace still has only about
5 MiB of live OCaml data and 127 store nodes. This is already a startup
failure; it does not reach a fully populated demo-page steady state.

A separate, briefly paused resource snapshot finishes before the protection
threshold and reports 128.3 MiB frontend physical footprint. Its disjoint
vmmap categories include 19.8 MiB of mapped IOSurface data and 65.4 MiB of
owned unmapped graphics memory. The device's allocation counter overlaps
these resource categories and must not be added to them. Direct drawable
tracing records 20,742,144 bytes per 2880×1800 texture. Although the configured
maximum drawable count is two, the device allocation counter reaches
65,241,088 bytes after three distinct full-size textures have appeared. This
observation alone does not prove a leaked application reference.

A minimal 1×1 clear reconfirms the earlier driver isolation: physical
footprint rises from roughly 6.2 MB before submission to 62.3 MB during
repeated GPU work, then falls to about 8.3 MB after two idle seconds. No
application store, text renderer, or graph is involved. The earlier Metal 4
result already reproduced this cost, so a backend port is not justified by
that hypothesis.

Process-local diagnostic interposition tests retain the same viewport and
embedded app while varying one graphics hypothesis. None brings startup
within the requested range:

| Diagnostic control | Observed combined physical bytes before termination |
| --- | ---: |
| One command buffer permitted per queue | 204,670,464 |
| Opaque layer/window and hidden material view | 212,960,768 |
| Release the previous target before drawable acquisition | 203,785,704 |
| Present on the drawing command buffer | 203,818,496 |
| Framebuffer-only drawable textures | 207,078,888 |

These cold, instrumented runs are sufficient to reject each control as a
complete memory fix, not to rank small differences between them. The controls
can alter rendering or readback semantics and are not production changes.
No surface precision, viewport size, graph data, or rich-text functionality
is reduced in the production implementation.

The existing OpenGL path also fails: the global guard observes 242,238,472
frontend physical bytes and kills it. The local 50 ms sampler's last
pre-termination combined sample is only 189,531,528 bytes, illustrating why
its sampled peak cannot override the independent guard's larger observation.
Changing the default to OpenGL is therefore rejected.

The renderer's fixed working cost and full-size surfaces remain the active
bottleneck. The 30–100 MB target, including application state and worker
accounting, remains unverified and contradicted by active startup samples.
The next renderer change must be evaluated in the complete app; passing an
isolated renderer budget is insufficient. Preserve the existing Metal default
until an alternative passes memory, pixel, readback, resize, and latency
acceptance together. Weak storage caches remain out of scope.

## Compiler and allocation regression checks

A separately rebuilt OCaml 5.5.1 Flambda O3 candidate does not solve active
application memory. With the same ordinary compiler worker and cloned demo
graph, guarded software replays terminate at 220,512,256 combined RSS bytes
for the ordinary compiler and 215,810,048 for Flambda. These short cold runs
do not establish a steady-state improvement or authorize changing the
application compiler.

Two Flambda regressions are resolved in LUI commits `74592afe` and
`56828517`. Float min/max bodies stay inline rather than boxing intermediate
shadow geometry; inset shadows reuse each row's fully covered span. The
original outer-shadow fixture falls from 424,114 to 131,170 bytes/frame under
its unchanged 262,144-byte limit. Outer/inset cases at heights 96 and 160 all
pass, as do golden pixels and GPU parity. The glyph lifetime fixture now uses
runtime geometry so constant lifting cannot make its weak-reference check
fail spuriously. It verifies both current ownership and release after scene
replacement. Temporarily removing cache pruning makes the corrected test
fail. Full ordinary-compiler and Flambda builds/test aliases pass. These are
renderer/test improvements, not evidence that the default Metal app meets
the memory target.

## Lossless software presentation and scanline allocation

The opt-in software presenter now stores only each band's nonuniform
horizontal extent. A one-pixel immutable IOSurface supplies the uniform
margins through nonoverlapping layers; the cropped middle preserves every
source pixel, including transparent holes and fractional alpha. Dense images
retain their full width. Background images may be reused only while unchanged;
in-use images are never overwritten.

Regressions compare both retained readback and actual Core Animation layer
composition byte for byte. They cover opaque, transparent, and partially
transparent backgrounds, sparse content against both edges and in the
middle, dense-to-uniform replacement, resize, partial updates, and disposal.
At 2048 by 131 pixels, uniform snapshots fall from 1,081,344 to 49,152 owned
bytes and 20-pixel-wide sparse content uses 98,304 bytes. Full-size isolated
software presentation peaks around 20.4 MB physical footprint, compared with
about 61.4 MB before cropping. These are renderer isolation results.

Full-app allocation sampling subsequently identifies shadow scanline arrays,
clip interval tuples, a per-row recursive closure, and shape interval tuples.
LUI `16c6c543` reuses the integration arrays per operation, reads intervals
through the existing integer cache, and returns scalar shape edges. The
3072-row fill regression fails before the scalar change at 149,762 allocated
bytes/frame and passes at 2,402, without increasing its 131,072-byte budget.
The shared-glyph regression tightens from 512 to 128 KiB/frame and passes
at 105,834 bytes/frame. Outer/inset shadow cases now include height 2048
under the unchanged 256 KiB budget. All 33 raster tests, full release build,
and test aliases pass, including pixel parity and multicore output.

A separate failure during full-suite parity reveals an unrooted temporary
C string in the generic OpenGL shader-source binding. LUI `bfcf2128` uploads
the rooted source directly; initialization under concurrent major collection
and the complete GL/parity suites pass on macOS. Other operating systems
have not been runtime-tested for this binding change.

The cropped full-app software recording before the scalar-edge change still
reaches 107,693,472 combined physical bytes and 200,048,640 combined RSS bytes;
the unchanged guard kills it after 12.23 seconds. A frontend-only GC
space-overhead experiment at 60 reaches essentially the same limit after
11.68 seconds and is reverted. It does not establish a useful memory fix.
A half-second steady-state live-allocation sample estimates 65.52 MB
allocated and 0.08 MB surviving two diagnostic major collections. Startup
sampling retains about 25.04 MB, led by flex layout and native node snapshots.
These sampled classifications are not evidence of a long-duration bound;
forced collection is not used for acceptance.

After the scalar-edge change, an uninstrumented full-app software replay
reduces host allocation from 127.6 to 87.2 MB/s over the sampled warm
intervals. Active CPU p95 is 5.63 ms, compared with 5.56 ms before; neither
recording proves a visible frame rate. Combined memory still reaches
107,759,056 physical bytes and 200,163,328 RSS bytes after 15.51 seconds,
and the guard terminates it. Scanline allocation improves, but this does
not establish a steady-state application memory bound.

A subsequent frontend GC policy at space overhead 30 completes a
601.28-second full-app repaint recording without forced collections or a
protection kill. Its warm CPU p95 is 5.81 ms over 71,374 fresh samples,
GUI lifetime physical peak is 81,413,080 bytes, and the externally sampled
combined peak is 100,943,264 physical bytes / 193,478,656 RSS bytes. This
improves the earlier guard failure, but the combined peak still exceeds
100 MB. Heap capacity oscillates as incremental collection catches up;
node and layout-cache counts remain stable.

The presenter also stops retaining the largest uniform internal gap of a
band when two cropped images cost less than one. The storage estimate
includes both IOSurface alignment and the system's 16 KiB VM page rounding;
otherwise a three-row band incorrectly gains an extra surface. The new
separated-content regressions fail at 1,081,344 / 1,032,192 owned bytes and
pass at 131,072 / 147,456 bytes. Both metadata readback and real Core Animation
composition retain exact pixels, including fractional alpha and holes.

With that gap compression and the same GC policy, a 611.01-second full-app
repaint recording completes. Its 603.78-second warm interval contains 72,573
fresh active-CPU samples with p95 6.00 ms and maximum 20.05 ms. GUI lifetime
physical peak is 76,547,008 bytes; externally sampled GUI-plus-worker peaks
are 97,584,544 physical bytes and 191,397,888 RSS bytes. Warm heap capacity
ranges from 33,397,816 to 36,062,672 bytes. No post-warmup layout or input is
recorded. This cohort uses one raster worker, a closed metrics panel, and
the same inherited `MallocNanoZone=0` environment as earlier comparisons.
The default four-worker path and open-panel workload remain separate gates.
The window is invisible throughout, so this still cannot certify visible
application memory, interaction correctness, or presented FPS.

Heavier cohorts remain failing. With the metrics panel open, the single
worker completes 60.25 seconds but reaches 106,169,784 combined physical
bytes and active CPU p95 8.71 ms. Four workers with the panel open reach
109,069,776 combined physical bytes / 200,392,704 RSS bytes after 2.73
seconds and are terminated by the guard. Four workers with the panel closed
also fail at 106,317,264 combined physical bytes / 200,081,408 RSS bytes
after 7.14 seconds. Two workers with the panel open and a four-worker trial
using the default system allocator are likewise terminated; neither is a
memory fix. Their short cold samples do not certify steady-state latency.

The multiworker implementation previously created and joined domains on every
frame. A low-allocation 32-frame tiled redraw regression verified correct pixels
but caused 109 minor collections before the worker-lifetime change. Producers
now belong to their tile renderer and wait for another job instead of exiting
after each frame. The isolated redraw regression records zero minor collections
after the change. Release joins the owned domains; resize, changing worker
counts, upload errors, rendering errors, and release/reuse remain covered.
The complete classic-runtime LUI build and test suite passes.
Console memory tracing now includes owned software pixels and atlas bytes
so these can be distinguished from managed layout/cache memory.

Persistent workers alone do not fix the heavy application cohort. With four
workers and the metrics panel open, the guard still terminates the application
at 109,315,560 combined physical bytes / 200,556,544 RSS bytes. A smaller child
minor heap does not solve that failure and was reverted. No reduced worker
count is adopted as an application memory fix.

## In-process native patch transport

The SDL host encoded each native patch batch to JSON, joined the strings, and
decoded them back into the original protocol values inside the same process.
An integration regression queues two generations containing 512 text children,
escaped Unicode, and typed property changes. The original enqueue/drain path
allocates 8,899,416 bytes; direct typed batches allocate 240 bytes under the
unchanged 65,536-byte limit. The queue releases consumed batches.

Native input, initialization, focus/blur, and mailbox handling now apply typed
batches directly. Hosts crossing the C bridge still encode at their callback
boundary. The wire regression decodes that boundary output, applies it to the
real store, and verifies batch order, generations, mounted children, values,
and the empty-result contract. The native host regression suite, executable,
and separate native library build pass.

This removes confirmed allocation churn but does not establish the application
memory bound. The four-worker open-panel recording still reaches 108,742,120
combined physical bytes / 200,065,024 RSS bytes before protection terminates it.
Reducing frontend GC space overhead further from 30 to 5 also fails at
108,922,320 physical bytes / 200,261,632 RSS bytes, so that experiment is reverted.

A subsequent diagnostic freezes the test process before the cap, at 186,417,152
combined RSS bytes and 95,110,584 combined physical bytes, to inspect ownership.
The GUI map reports about 27.3 MiB of dirty `VM_ALLOCATE`, 28.9 MiB of dirty
malloc regions containing 23.5 MiB of allocations, and 3.9 MiB of mapped
IOSurfaces. These are a startup snapshot, not steady-state peaks or proof of a
retention leak. Further optimization requires identifying retained owners
within those categories rather than continuing to tune GC policy.

The default remains Metal. Software pixel correctness and reduced isolated
memory do not certify complete application memory, visible presentation,
scrolling, editing, or effect support. The 30–100 MB objective remains open.

## Continuous-corner pixel allocation

A fresh standalone replay of the saved 2880×1800 application scene isolates
the raster path from graph startup. Sampling identifies continuous-corner
distance and clipped sharp inset-shadow coverage among its largest repeated
allocation sites. Corner distance constructs four coordinate pairs, lists,
and a capturing callback for every evaluated pixel. Clip coverage likewise
captures its accumulator in a per-pixel traversal closure.

Two new renderer regressions reproduce 12,956,114 bytes per continuous-border
redraw and 19,991,474 bytes per clipped sharp-inset redraw. Both fail their
1,000,000-byte limit before the change. Corner reach and distance now use
scalar helpers, and clip coverage walks its existing stack without a callback.
The same cases allocate 687,602 and 221,954 bytes per redraw afterward. The
36 raster tests pass, including reference pixels, changing clips, partial
damage, parallel bands, resize, and renderer error/lifetime cases. These are
renderer integration results; application memory acceptance still requires
a rebuilt full-app measurement under the existing guard.

The complete classic-runtime LUI build and test aliases and the rebuilt native
host regressions pass. The CLI scaffold initially runs before local-install
artifacts are complete in the combined build/test invocation; after the build
finishes, the same invocation passes without changing its checks. Reference
and cross-renderer pixel comparisons also pass.

An unprofiled 120-redraw replay of that same application scene, using four
workers, reduces allocation from 13,202,888 to 1,923,757 bytes/frame. Its elapsed
time changes from 0.611 to 0.576 seconds; these short aggregate durations are
not application frame-acceptance measurements. The four-worker full-app
open-panel cohort still fails, reaching 109,037,008 combined physical bytes /
200,523,776 RSS bytes after 2.22 seconds. Startup ownership remains a separate
problem despite the substantial reduction in pixel allocation.

Malloc stack tracing also identifies runtime-owned large strings and arrays
and remembered/custom-block tables among native malloc allocations. Malloc
regions therefore overlap the managed-heap accounting and must not be added
to it as if they were all independent graphics or framework resources. The
instrumented cohort is diagnostic and does not replace uninstrumented peaks.

The single-worker open-panel comparison completes 60.19 seconds without a
protection kill. GUI lifetime physical peak is 80,118,744 bytes; sampled
GUI-plus-worker peaks are 100,844,960 physical bytes and 191,463,424 RSS bytes.
Its 53.25-second warm interval has 6,452 fresh active-CPU samples with p95
8.73 ms and maximum 24.06 ms. Host allocation is 89.59 MB/s, compared with
111.52 MB/s in the earlier open-panel recording. This remains a short,
invisible diagnostic and still fails the 8.33 ms work budget. The default
worker count and renderer remain unchanged.

Inspection of the software presenter identifies another ownership path to
verify: every submitted band creates new immutable IOSurfaces even when its
pixels equal the retained band. Retaining an already identical immutable
image would avoid replacing compositor resources without overwriting pixels
that the compositor may still read. This requires a failing resource-identity
regression, exact pixel/readback checks, and another full-app measurement.

## Immutable software band reuse

The resource-identity regression confirms that repeated equal uploads replace
immutable IOSurfaces. It fails for sparse and fully populated images and for
duplicate uploads of a pending update. Uniform bands already reuse their
background pixel, but introducing a single changed pixel creates an image
which the next identical upload used to replace again.

The presenter now compares the submitted bytes with the retained band before
creating another snapshot. Image comparisons take read-only surface locks;
uniform intervals validate their first row and compare subsequent rows without
allocating a reconstructed image. A matching upload leaves both resource
ownership and the pending-change flag untouched. Changed pixels still create
new immutable surfaces, preserving compositor readers and caller buffer reuse.

The same regression passes for uniform, separated-content, and fully populated
bands with fractional alpha. It checks uploads before presentation, a changed
last pixel in the short final band, a changed pixel in a background interval,
duplicate pending updates, unrelated bands, retained readback, and actual Core
Animation composition. The native host test alias, executable, and separate
native library build pass; resize and disposal regressions remain green.

The four-worker open-panel application cohort still exceeds the guard after
3.30 seconds, at 107,906,512 combined physical bytes / 200,114,176 RSS bytes.
Resource reuse is confirmed, but this does not resolve the multiworker startup
peak. A longer single-worker open-panel cohort is measured separately.

That cohort completes 610.25 seconds without forced collections or a protection
kill. Its 603.06-second warm interval contains 72,485 fresh active-CPU samples,
with zero lost samples, p95 5.42 ms and maximum 18.55 ms. GUI lifetime physical
peak is 75,252,672 bytes; sampled GUI-plus-worker peaks are 96,994,696 physical
bytes and 189,431,808 RSS bytes. Warm heap capacity ranges from 31,618,536 to
34,656,872 bytes, starting at 33,428,800 and ending at 33,441,808 bytes.
Host allocation remains 90.27 MB/s because this diagnostic forces full raster
redraws at 120 Hz even when application state is unchanged; there are no
post-warmup layout runs or input events. It is not an idle-allocation pass.

This establishes a sustained full-size software-path memory and CPU result
with one worker and the metrics panel open. It does not establish scrolling,
editing, resize, multiworker startup, or visible presentation acceptance. The
window remains invisible, and a read-only console-session check confirms the
screen is locked. The default Metal path remains unchanged.

## Editing layout ownership

The native SDL input replay delivers 200 ASCII characters while the shared text
cache grows from 29 to 536 entries. Each historical paragraph prefix and caret
measurement enters the caption cache. A real CoreText regression retains
9,455,328 bytes for rich text and 8,213,728 bytes for an input after 200 updates;
superseded layouts and a disposed editor's current layout remain reachable.

Editable nodes now own a small layout cache for their current node version.
Changing that version clears its previous shapes. The next text-cache access
after a store change also removes disposed or no-longer-editable owners. Static
captions retain the existing shared cache. This changes text-layout ownership,
without changing storage caching or forcing collections in the application.

The same regression retains 143,208 bytes for rich text and 141,128 bytes for an
input, below the unchanged 2 MiB limit. It verifies collection of superseded and
disposed layouts, reuse of the current wrapped layout across caret-prefix
measurement, and reuse of unrelated captions. The forced native host test alias
passes, as do the executable and separate native-library builds.

In the rebuilt SDL replay, the shared cache remains at 31 entries and two
editing owners retain five to six current layouts during 200 input bytes.
The test graph subsequently contains eight more blocks, but the process guard
kills the application after 18.86 seconds at 200,359,936 combined RSS bytes and
106,694,096 combined physical bytes. The previous run reached only three added
blocks before its guard kill. These partial runs use an accumulating test graph
and diagnostic tracing, so they do not establish a controlled timing improvement
or successful 50-Enter acceptance. The remaining Enter peak, default renderer
memory, and visible interaction requirements remain unresolved.

## Unused selector ancestry during Enter

A fresh full-graph SDL Enter replay reaches the unchanged protection limit at
8.82 seconds, with 201,523,200 combined RSS bytes and 107,349,456 physical bytes.
The database gains 22 blocks before termination. Allocation sampling over a
half-second diagnostic interval identifies 2.08 MB at ancestor-array copying
inside the dropdown-menu query invoked by every keydown; all selector-related
sampled sites total 2.64 MB. Raster work dominates the full allocation recording
because the occluded-window diagnostic forces redraws at 120 Hz.

Scoped matching previously converted every candidate's complete ancestor array
to a list before checking whether the selector needed ancestry at all. Matching
now reads ancestry only after a multi-step selector's candidate compound matches.
Simple selectors and rejected candidates avoid that copy. The 1000-node,
64-ancestor regression fails at 1,728,525 bytes/query and passes at 136,525 bytes
under its unchanged 262,144-byte limit. A missing menu query uses 32,549 bytes;
unmatched descendant and alternative selectors also pass the same bound.
Existing direct-child, descendant, and nearest-ancestor semantics remain green.

An identical fresh-baseline graph replay reduces estimated selector allocation
in the diagnostic interval from 2.64 MB to 0.16 MB. It still hits the guard at
9.03 seconds, with 200,425,472 combined RSS bytes and 106,235,368 physical bytes,
and persists 20 added blocks. This confirms removal of a real allocation site,
not successful 50-Enter or memory acceptance. Neither partial replay proves a
timing improvement, and neither certifies visible input or FPS.

## Shared immutable subtree ancestry

A later allocation-survival capture during Enter finds repeated ancestor-list
construction and shallow-snapshot lookups at the largest individual sites.
Stacks containing the native embedding layer account for an estimated 65.52 MB
of allocation. This is an overlapping stack category, not an exclusive cost
breakdown. Its diagnostic major collections do not establish normal memory use.

Subtree traversal now constructs the nearest-first ancestor array once for a
parent's children and shares that immutable array among siblings. Only the
collection root resolves its parents through the runtime tables. Full snapshots
prepend their ancestry field to the existing immutable property list rather
than copying that list. Standalone event targets use the same snapshot shape.

The 70-level, 1000-leaf regression fails at 4,807,384 allocated bytes and passes
at 197,840 bytes, below the unchanged 524,288-byte bound. It checks preorder,
equality with independently generated event targets, the 64-ancestor limit,
ancestors outside a scoped collection root, and repeated cached collection.
The forced native host suite passes, including snapshot disposal, held handles,
pointer delivery, scrolling, resize, and software-presentation lifetime tests.

The same fresh-baseline, one-worker SDL Enter diagnostic now persists 24 blocks
before the unchanged guard kills the GUI after 9.89 seconds. Combined sampled
physical memory peaks at 102,090,168 bytes and RSS at 200,294,400 bytes. There are
25 injected Enter keydowns, so this is still a failed 50-Enter run. The earlier
selector-only cohort peaks at 106,235,368 physical bytes and persists 20 blocks.
The lower peak and the allocation regression justify retaining this change,
but neither cohort satisfies the full application memory or interaction goal.
The default renderer and raster-worker count remain unchanged.

## Keyed rollback checkpoints and retained rows

The Enter allocation capture estimates 15.76 MB in stacks containing keyed
reconciliation. Its checkpoint copies runtime tables for every existing row's
entire subtree, even when the collection only appends a new row or reorders
retained rows. The parent owns the reordered child sequence; retained item
updates use queued signal writes rather than mutating those subtrees inside
the keyed transaction.

The checkpoint now includes the parent and the complete subtrees actually
removed by the transaction. A 128-row fixture with 33 nodes per row fails its
524,288-byte append limit at 2,439,800 bytes and passes at 232,328 bytes. Reorder
uses 236,096 bytes, retaining every original row identity without remounting.
A separate regression removes a row containing a button, then rejects an
invalid table child during insertion. Rollback restores the removed subtree,
its working input handler, and a following keyed segment; a subsequent valid
replacement disposes the removed owner exactly once.

LUI commit `2aafc5db` on `feat/ml-backend` contains the change. The full build
and test aliases pass, including all 122 core tests and native input scenarios.
The local classic compiler switch installs that revision, and the rebuilt
application passes native host tests and both native artifact builds.
The optional formatting check cannot run because `ocamlformat` is absent.

The fresh full-graph diagnostic persists 27 blocks before the unchanged guard
terminates it at 10.08 seconds: 105,874,896 combined physical bytes and
200,065,024 RSS bytes. At approximately 3178 mounted nodes, the trace reports
30 MiB managed live memory versus 32 MiB in the previous shared-ancestry run.
This is a reduction at a comparable node count, not a claim of a lower overall
peak across runs with different completed work.

A second fresh cohort disables debug output and allocation sampling. It still
terminates at 9.21 seconds, with 106,169,832 physical bytes and 200,343,552 RSS
bytes. Twenty-seven keydowns are injected but only 25 new blocks are confirmed
in the database. This rules out diagnostic stack retention as the sole cause
of the remaining protection failure. Both cohorts still force full-size
software redraws while occluded and use one raster worker. Neither meets
50-Enter, visible FPS, default-renderer memory, or full application acceptance.

## Node-owned native snapshots

A new 0.25-second Enter allocation capture after the keyed-checkpoint fix
estimates 93.04 MB of total allocation, including 10.48 MB in stacks containing
shallow snapshot construction. Checkpoint stacks account for 0.64 MB in this
capture. These overlapping sampled stack categories are diagnostic evidence,
not an exclusive cost breakdown or a frame-rate measurement.

The subtree epoch previously discarded every shallow snapshot whenever any
node changed. Shallow entries now retain the immutable property-map identities
and node kinds they describe. Unchanged entries survive epoch changes; changed
or removed owners are pruned. Full subtree snapshots still invalidate because
their ancestry may have changed. Cache ownership also separates distinct
application runtimes with matching generations and node ids, and disposal
releases that runtime owner.

The 1000-row, one-row-update regression fails at 1,904,920 allocated bytes and
passes at 242,608 bytes under its unchanged 524,288-byte bound. It verifies
reuse of an unrelated row and fresh text and attributes for the edited row.
Rollback regressions cover reused standard kinds and extension identifiers.
They also expose a stale subtree when rollback replaces a pending operation
list with another list of equal length. Epoch checks now compare immutable
pending-list identity in constant time instead of counting operations.

Another regression exposes live extension nodes being classified as disposed:
the old liveness predicate checked only standard nodes. It now includes
extension nodes, retaining their valid parsed attributes and DOM overlays.
Parsed attribute entries are removed when their owning raw attribute changes
or disappears. Disposal still removes attributes, geometry, live fields, and
held snapshots. The native host suite and both native artifact builds pass.

The rebuilt, unprofiled fresh-graph Enter cohort persists 26 blocks before the
guard terminates it after 10.19 seconds, at 105,924,048 combined physical bytes
and 200,130,560 RSS bytes. Twenty-seven keydowns were injected. This remains
failed memory and 50-Enter acceptance; reduced snapshot allocation alone has
not established a materially lower full application peak.

A separate startup-survival diagnostic completes normally after 8.24 seconds.
It estimates 20.88 MB surviving from 210.56 MB sampled allocation. Individual
retained sites include flex styles and nodes, retained paint fragments, store
property tables, and measurement state. This capture begins at loop entry and
excludes earlier bootstrap allocations. It forces diagnostic major collections
and software redraws, so its 88,950,200 combined physical-byte peak is not normal
memory acceptance. Default-renderer, multiworker, and visible interaction gates
remain unresolved.

## Separate changed-scene replay from continuous redraw stress

The occluded-window diagnostic previously forced a complete tile invalidation
and repaint every loop. That remains the default continuous stress mode.
`LOGSEQ_NATIVE_MEMORY_REPLAY_MODE=changes` now permits normal dirty-scene
painting while occluded without forcing unchanged frames. Both modes retain
the duration, full viewport, external memory guard, and truthful visibility
exports. The selected policy is printed in the run log. Changes-only replay
does not provide visible presentation or OS-input evidence.

The pre-change full-app regression has zero events and zero layouts over
2.016 seconds but produces 242 active frames despite requesting changes-only
replay. The same assertion passes after the change, with zero active frames
over 2.007 seconds. A controlled host regression checks final changed pixels,
visible and occluded behavior, unchanged-scene suppression, retained continuous
stress, and rejected invalid configuration. The native host suites and both
native artifact builds pass.

The short one-worker changes-only recording exits normally with a peak of
82,134,456 combined physical bytes and 177,029,120 RSS bytes. This six-second
replay is a diagnostic check, not the required sustained acceptance interval.
A fresh four-worker Enter cohort still hits the unchanged guard after 6.96
seconds at 106,104,296 physical bytes and 200,343,552 RSS bytes. Five Enter
keydowns are injected and only four new blocks persist. Separating the normal
painting policy therefore does not resolve multiworker memory acceptance.
The default application renderer and raster-worker count remain unchanged.

## Caller participation in parallel tile rendering

The four-worker tile renderer previously started four background domains while
the application domain only consumed completed uploads. A resident-domain
regression first fails for two requested workers: it observes two background
domains instead of one. The caller now renders the first band and takes
additional bands whenever no completed producer upload is available. Uploads
remain on the caller, parallelism is unchanged, and the pool retains one fewer
background domain. LUI commit `e3d00a23` contains this change.

Tests cover requested counts 1, 2, 4, and 8, exactly one upload per completed
band, correct pixels, repeated frames, and complete domain release. Failure
coverage includes invalid pixels affecting only the caller's first band and
errors affecting all bands, followed by successful renderer reuse. The standard
37-case raster suite and full LUI build/test aliases pass.

The captured scrolling fixture preserves its original limits. Four-worker
tiled rendering measures p95 6.45 ms versus 5.95 ms in the installed baseline,
remaining below 8.33 ms. Serial tiled rendering still fails 16.67 ms: the new
run measures 17.99 ms, and an independent probe linked against the previous
installed implementation measures 18.53 ms. The serial path is unchanged by
the pool modification. These CPU fixtures do not certify application FPS.

The rebuilt application exports `raster_background_domains` in metrics and
memory traces; the real four-worker cohort consistently reports three. Its
pre-input 2.5–4.5-second interval has the same 2517-node graph: median combined
physical memory is 89,982,416 bytes versus 93,603,304 bytes before the change,
and median RSS is 184,762,368 versus 188,317,696 bytes. The intervals contain
36 and 35 external samples, respectively. This is a short allocation/resource
comparison rather than sustained memory acceptance.

The cohort still hits the protection guard after 8.07 seconds at 106,137,040
physical bytes and 200,458,240 RSS bytes. Eight Enter keydowns are injected and
seven new blocks persist, so 50-Enter and full application memory acceptance
remain failures. Both cohorts use the changes-only software replay with four
requested workers, without debug output or allocation profiling. The default
Metal renderer is unchanged and visible interaction remains unverified.

## Captured scrolling assertion repair

The existing captured-scene suite reproduces a serial tiled redraw failure:
p95 is 19.20 ms against the unchanged 16.67 ms limit, with exact output pixels.
Sampling the same serial rendering path identifies `blend_span` as the largest
CPU hotspot (1504 top-of-stack samples). An allocation probe also identifies
repeated full clip-coverage evaluation in sharp inset shadows. This is the CPU
raster runtime used by the software presenter, not an Electron measurement.

LUI commit `96f1ec03` reduces the work in these paths. Opaque spans expand one
initialized pixel with bulk copies, and fully covered row interiors can copy
from a previous interior containing the same span. Edges and borders retain
their original coverage calculation. Packed translucent blending no longer
saturates each channel: a premultiplied source channel is at most its alpha,
and the destination contribution is at most the complementary alpha, so the
sum cannot exceed 255. Sharp inset shadows reuse the existing solid clip-row
bounds, and hot integer bounds use specialized comparisons.

Regression cases cover empty through 2880-pixel spans, offsets 0/1/3, heights
1/3/65, odd tails, adjacent untouched pixels, and every translucent alpha from
1 through 254 over every destination byte value. The captured-scene tests keep
their original 16.67 ms serial and 8.33 ms parallel limits and exact pixel
checks. An intermediate span-only optimization still has one failed repeat
at 24.49 ms; it is not treated as stable acceptance. After the complete change,
three consecutive captured-scene runs pass all three replay tests:

| Run | Whole-image p95 | Serial tiled p95 | Four-worker tiled p95 |
| --- | --- | --- | --- |
| 1 | 4.78 ms | 14.13 ms | 6.16 ms |
| 2 | 3.73 ms | 13.83 ms | 4.77 ms |
| 3 | 4.01 ms | 13.72 ms | 5.20 ms |

All 42 raster cases pass with the captured fixture enabled, and the full LUI
build/test aliases pass. The installed classic-switch package source matches
the committed implementation; native host regressions and executable/archive
builds pass against it. The profile application bundle is rebuilt and its code
signature verifies. A separate unprofiled 60-frame serial probe reports
p95 14.67 ms and median allocation 1,748,432 bytes/frame, down from approximately
2,005,000 bytes/frame before the clip change. It still causes 121 minor and one
major collection. Allocation remains substantial; this repair does not certify
the application memory target, sustained input, or visible presentation FPS.

## UI store reader allocation and warmup row ownership

A fresh demo graph with changes-only painting still reaches the combined
200 MB RSS protection limit during rapid Enter. A 650 ms allocation capture,
requested after the scripted End key and before Enter, estimates 69.60 MB
of allocation, including 14.08 MB whose first allocation site is
`Hashtbl.find_opt`. Many typed UI property reads wrap the live node and stored
value in temporary options before immediately inspecting them.

LUI commit `76628547` removes those intermediate options while retaining the
public result types and existing absent/mistyped/deleted-node behavior. Two
allocation regressions first fail: 10,000 scalar/stored-option read rounds
allocate 800,096 bytes, and typed/raw property rounds allocate 1,760,096 bytes.
They pass after the change at 96 and 640,096 bytes respectively. All 22 store
cases, full LUI build/test aliases, and native host regressions pass. In the
same scripted 650 ms diagnostic window, estimated total allocation becomes
61.84 MB and first-site `Hashtbl.find_opt` allocation becomes 4.32 MB. These
sampled intervals establish reduced allocation, not sustained memory acceptance.

Another ownership problem affects initial virtual-list rows. `initial_rows`
previously bypasses the viewport mount wrapper permanently. Journals starts
four such days, whose contents consequently cannot leave the mounted tree.
Both native list entry points now start warmup rows mounted inside the same
viewport-owned wrapper as deferred rows. The host also recognizes automatic
height as already-mounted content when an offscreen warmup row has never
received an entry event. Focused, pressed, and open-menu ancestors retain the
existing pin protection.

New regressions first fail for missing warmup viewport markers and missing
offscreen disposal. They now verify initial content heights versus deferred
estimates, actual node/resource release, preservation of measured scroll
extent, remount on return, and pinned-row protection. Existing 100-cycle
disposal budgets remain unchanged. Native host tests and executable/archive
builds pass.

The real demo cohort drops from 2517 to 2403 nodes before input. Over the
same 2.5–4.5-second pre-input interval, median combined physical memory falls
from 90,179,024 to 89,589,200 bytes and median RSS from 184,795,136 to
184,238,080 bytes (35 and 34 samples). Rapid Enter still fails the guard after
8.25 seconds at 106,776,040 physical bytes and 200,949,760 RSS bytes. Ten Enter
keydowns are injected; reopening the isolated worker confirms 799 blocks,
nine more than the pristine 790-block graph. Both isolated processes are killed
at the unchanged protection limit. The 50-Enter, default-renderer memory, and
visible presentation requirements remain unmet.

## Controlled measurement protocol

Further optimization must follow a measured application bottleneck. A lower
allocation count in a helper is insufficient when the same end-to-end workload
still fails. The previous 650 ms captures have different completed-action
counts; their raw estimates cannot rank application improvements. The store
reader regressions establish the local allocation reduction independently.

Use fresh SQLite backups of the same inactive demo graph for every repetition.
Record executable, worker, input script, input library, and graph SHA-256 hashes;
source revisions and local diff hash; compiler/build profile; renderer; replay
policy; logical/device viewport; requested and actual raster domain counts;
window visibility; and profiler mode. Keep the full 1440x900 logical / 2880x1800
device viewport and four requested raster workers. Do not compile, lint, or run
tests during measurements. The independent 50 ms memory monitor terminates both
isolated processes when combined RSS or physical footprint exceeds 200000000
bytes, including while a graph query is in progress.

Separate three kinds of recording:

1. Unprofiled baseline: measure GUI and worker RSS/physical memory, cumulative
   phase work, active-frame and presentation timings, and completed actions.
   Repeat each scenario at least three times; report the median and full range,
   including failed runs. Three repetitions are preliminary evidence, not a
   precise confidence interval.
2. Allocation/CPU diagnosis: replay the same input boundaries with sampling
   enabled. Attribute sampled bytes to the first allocation site, preserving
   complete stacks for ownership. Do not add inclusive caller and callee costs.
   Sampling timings do not qualify as baseline or acceptance measurements.
3. Retention/native-resource diagnosis: inspect surviving sampled allocations
   only with live tracking enabled and explicitly record the diagnostic major
   collections. Capture native memory categories and graphics resource sizes
   separately. Last-GC live bytes, heap capacity, cumulative allocation, RSS,
   and physical footprint answer different questions and must stay separate.
   Atlas bytes and native resource accounting can overlap process accounting;
   do not add them to the process footprint or label its remainder as a leak.

The workload matrix remains idle (at least 600 seconds), pointer-only movement,
bidirectional scrolling, navigation/buttons, 200-character typing, 50 Enter
actions at 10/s, and resize. Preserve rich text and all existing functional and
presentation acceptance requirements. Diagnostic software-renderer controls
cannot certify the default Metal backend. Locked-window replay cannot certify
visible presentation, physical pointer delivery, focus, or IME behavior.

Count injected input, host-handled input, persisted operations, and settled UI
results separately. Normalize bytes/work by completed actions only when all
four agree. A guard exit, lost timing samples, missing persistence evidence, or
unknown UI settlement remains an incomplete workload. Idle controls must retain
the same editing/focus state as the action recording. Use recorded native-clock
timestamps as phase boundaries; external memory samples retain their own clock.

The native phase exporter now retains cumulative `total_ms` independently of
the 240-sample history. Its regression first fails when the ring loses the first
25 ms sample, then passes with 625 ms of cumulative work and an unchanged 2 ms
rolling mean. `scripts/native_profile_report.py` uses differences between exact
recorded boundaries, rejects counter resets/missing provenance, includes GUI
and worker memory at the same sampling instant, and marks missing quantiles.
Parent/nested phase totals are reported independently, never summed as CPU time.

`scripts/native_profile_run.py` records isolated demo idle/Enter cohorts and
preserves raw samples, input logs, checksums, block counts, and termination
outcomes. It deliberately leaves UI settlement unverified; its report is a
diagnostic, not an acceptance result. The macOS input library source is
`scripts/native_input_events.c`; compile it against SDL2 and load it only into
the isolated GUI using the runner's `--input-library` argument. Input script
lines have the shape `8000 key 13 0` and `8010 release 13 0`; elapsed times are
milliseconds from replay startup. Each emitted event logs the native performance
clock used by the phase exporter.

```sh
python3 scripts/native_profile_run.py --help
python3 scripts/native_profile_report.py tmp/native-app/science-enter-1/recording.json
python3 -m unittest discover -s scripts -p 'test_native_profile_*.py'
```

Prioritize measured excess over the budget and repeated cost in the workload.
For each change, record the suspected owner, evidence, maximum plausible saving,
and a falsifiable prediction. Re-run the identical workload after one change;
keep it only when the intended bottleneck improves without functional or timing
regressions. Add a regression at the confirmed boundary, while retaining the
application acceptance thresholds.

## First controlled release cohorts

These cohorts use the classic 5.5.1 switch, an explicit Dune release build,
LUI `49c5d766`, Logseq `0e4bfa4ce9` plus the pending geometry and phase-export
changes, and the same binary/graph/input hashes. No allocation profiler runs.
The geometry change reduces the 1000-node regression from 390360 to 86360
allocated bytes; nested clipping/scrolling tests pass. Its preceding fast-Enter
application run still exits at 200163328 RSS bytes / 105973176 physical bytes
after 8.28 seconds. This is a local allocation repair, not an application pass.

The new isolated default-Metal startup recordings fail before any scripted
input, while the store still contains 127 nodes and the managed heap is about
5 MiB. All three activate the unchanged combined-memory guard:

| Repetition | Combined physical bytes at guard | GUI physical bytes | Worker physical bytes |
| --- | --- | --- | --- |
| 1 | 208881128 | 188695536 | 20185592 |
| 2 | 202753464 | 182453208 | 20300256 |
| 3 | 209061400 | 188662816 | 20398584 |

This localizes the memory priority to renderer initialization/initial submission
before the full graph is mounted. It does not yet identify an individual Metal
allocation. Further store/row micro-optimizations cannot explain this startup
failure. Native resource attribution must precede the next memory optimization.

The same executable on the Cocoa diagnostic backend completes one Enter in each
of three fresh 790-block graphs, with all three worker queries returning 791
blocks. Combined physical peaks are 96388512, 96241128, and 96667112 bytes; RSS
peaks are 191447040, 191250432, and 191676416 bytes. The recorded post-setup
windows allocate 31788192, 31780336, and 31789056 host-domain bytes, including
roughly 36 seconds of background work. A matched idle control is required before
attributing all of those bytes to Enter. Input-to-host-frame observations are
44.50, 43.06, and 27.24 ms; they are three individual observations, not a p95
acceptance distribution. Final UI settlement and visible FPS remain unverified.

The first idle control completes 625 seconds without a protection exit. A
613.164-second post-setup interval has zero input events and zero layouts,
167530.71 host-domain allocated bytes/s, 0.07828 minor collections/s, and two
major collections. The existing idle-allocation validator reports no errors.
Heap capacity grows from 32016344 to 37291136 bytes; this is not equivalent to
live process growth. Over external seconds 30-615, combined physical memory
ranges from 85476792 to 93160888 bytes, median 88606136. The first/last five-second
medians are 91489720 and 90195384 bytes. Corresponding RSS medians are 186630144
and 170442752 bytes, with a complete-recording RSS peak of 191791104 bytes.
This is one hidden Cocoa control, not default-renderer, visible-memory, or FPS
acceptance, and it does not prove indefinite retention bounds.

Separate startup diagnostics pause the GUI before the protection threshold,
while the independent memory monitor remains active, then collect `vmmap`
and kill both isolated processes. These snapshots cannot measure latency.
The 126.9 MiB GUI snapshot includes 65.4 MiB resident
`owned unmapped (graphics)` and a 19.8 MiB IOSurface region. A later 168.3 MiB
snapshot has approximately 65.4 MiB in the former category and 59.3 MiB resident
IOSurface memory across four regions. The categories are observations from
different startup phases, not a summed ownership proof. They confirm the next
memory investigation must attribute native graphics resource creation and
lifetime; the exact allocation owner and whether any resource is redundant
remain unresolved. The same binary, graph, worker, and viewport are preserved.

After the collector settles, a further three Enter cohorts use an identical
runner hash (`cb6d76d6`), binary/worker/graph/input hashes, and a 20-second input
script. Each injects and handles one Enter and persists exactly one additional
block. Their measured native windows last 12.082-12.111 seconds and allocate
27695888, 27696272, and 27697000 host-domain bytes. These include background
allocation and are not completed-UI costs. Individual input-to-host-frame
observations are 47.25, 41.98, and 38.00 ms, all above the 32 ms target; maximum
active-frame work is 46.45, 42.19, and 38.06 ms. These results reproduce an input
pipeline failure without selecting a helper from a sampled stack prematurely.
Native geometry totals are 8.97-10.20 ms and scene-build totals 11.18-19.37 ms
per recording, alongside 27.83-37.21 ms of mailbox work. Phase nesting prevents
adding these totals into an exclusive CPU breakdown. The next interaction
profile must attribute allocation and CPU within this reproducible operation.

The memory monitor requests a 50 ms wait between observations. The 625-second
cohort's actual sampling gaps have median 58.62 ms, p95 60.39 ms, and maximum
74.38 ms, including system-call and scheduling time. Report measured peaks as
sampled peaks; do not imply the monitor can prevent every instantaneous
overshoot. All isolated processes from the protection and snapshot cohorts are
terminated. The reporter regressions cover aggregation, incomplete workloads,
counter resets, missing roles/provenance, reduced viewports, invalid visibility,
insufficient quantile samples, and ring loss; all 13 tests pass.

## Native resource attribution and reload guard experiment

A six-second Instruments Metal System Trace starts before the isolated app,
using the tracing-start notification rather than a fixed startup delay. The
export contains the actual GUI PID 44888. The collector records
`--external-profiler xctrace-metal-system`, preserves the combined-memory guard,
and terminates both isolated processes at 201164264 combined physical bytes.
These instrumented timings and peaks do not qualify as an unprofiled baseline.

The resource allocation table identifies three distinct 20742144-byte textures,
each labeled `CAMetalLayer Display Drawable`. Their stacks enter
`CAMetalLayer.nextDrawable` from the native Metal render block. The recorded
device allocation counter peaks at 65273856 bytes. The mask and color atlases
are much smaller, 278528 and 1064960 bytes. No drawable deallocation appears
before the guard exit, which is insufficient to prove a lifetime leak.
Unknown per-resource system/video-memory values remain unknown; resource sizes
must not be added to process physical footprint. The kernel resource allocation
table is empty, so this trace does not attribute the separate graphics memory
category observed by `vmmap` to individual resources.

The trace also shows synchronous expose drawing inside a Core Animation
transaction. A diagnostic interposer defers that callback to the ordinary SDL
event loop. It still exits at 203703808 combined physical bytes with only 127
nodes mounted. This hypothesis fails its memory prediction; no expose or resize
behavior change is retained. An earlier system trace missed the target process,
and attempted Game Memory launches did not reach application startup. Those
recordings are excluded from application conclusions.

For interaction allocation, a separate six-second Memprof capture includes the
same one-Enter script. Live tracking and two diagnostic major collections are
explicitly enabled. It estimates 28400000 allocated bytes and 1760000 surviving
bytes; 3600000 sampled bytes have `Worker_events.ui_busy` in their stack. This
path eagerly scans every native element for popups even when pending structure,
typing, editing throttle, or recent pointer activity already forbids reload.

The native runtime regression mounts 1000 actual text rows and exercises the
real document-query provider. Before the fix, the four existing busy guards
each perform the unnecessary scan and allocate approximately 468661-468669
bytes/check. Short-circuiting on those guards reduces this to 61-69 bytes/check
under the unchanged 4096-byte limit. Expiry boundaries, pointer activity without
an editor, and all seven popup selectors retain their reload behavior. The full
native host release tests and executable/archive builds pass.

Three unprofiled fresh-graph one-Enter runs preserve the script, worker, graph,
viewport, and raster-worker configuration. Each injects and handles one Enter
and persists one block. Their measured host allocation windows contain
25994024, 25981632, and 25987720 bytes, approximately 6.2% below the preceding
27695888-27697000-byte controls. Input-to-host-frame observations are 44.45,
40.26, and 43.90 ms: latency has not reliably improved and remains above target.
Combined physical peaks are 96699856, 95323576, and 96732600 bytes; no material
process-memory improvement is established.

The matching post-fix Memprof capture estimates 26720000 allocated bytes and
2560000 surviving bytes, including 1600000 bytes under `ui_busy`. Remaining
popup scans occur when state guards allow reload; this change does not eliminate
that legitimate query. Sampling uncertainty and diagnostic collections prevent
using either surviving-byte estimate as a retention trend. Both captures handle
and persist exactly one Enter; UI settlement remains unverified.

The 50-Enter workload still triggers the guard at 200065024 combined RSS bytes
and 105596368 physical bytes. Eight keydowns are injected, seven appear in the
last exported handled counter, and reopening the isolated graph confirms seven
persisted blocks, 790 to 797. This is a failed workload. The local allocation
repair does not satisfy application memory, latency, or visible FPS acceptance.
Default-renderer startup memory and interaction latency remain separate measured
bottlenecks; neither should be selected from generic heap growth alone.

## Drawable lifetime and sampling validity follow-up

A diagnostic layer-method trace records every drawable-size change and acquired
texture without changing either operation. The current release reaches the
combined guard at 200164840 physical bytes before the first scripted input.
The layer changes from 1x1 to 2880x1800 once; no idle shrink occurs before the
failure. Three distinct 20742144-byte textures appear, then two are reused.
This rejects idle pool resizing as the cause of this startup peak. It does not
prove that every retained texture is necessary or that the driver working set
cannot be reduced.

Game Memory profiling of a standalone copy also fails before application main:
the actual target remains suspended until the diagnostic timeout. The isolated
target, worker, and recorder are terminated and the unusable trace is removed.
Developer mode is reported disabled; this observation alone does not establish
why profiler launch stalls. No global security settings are changed. Successful
Metal System Trace resource evidence remains valid independently of this failed
allocator-profiling attempt.

Two separate live-allocation captures cover the first four main-loop seconds
on the Cocoa diagnostic backend, before scripted input. They exclude allocations
before that loop and perform two diagnostic major collections at the end.
Estimated allocated bytes are 101200000 and 103040000; surviving sampled bytes
are 21920000 and 22560000. Assigning each stack to its first non-standard-library
subsystem gives the following exclusive estimates, without adding nested owners:

| Allocation subsystem | First capture surviving bytes | Second capture surviving bytes |
| --- | ---: | ---: |
| Flex layout | 4960000 | 5040000 |
| Raster buffers and rendering | 3600000 | 3600000 |
| Native element snapshots | 2880000 | 3120000 |
| Signals | 2800000 | 2320000 |
| Layout mirror | 1200000 | 1760000 |

These sampled owners guide managed-memory investigation; they do not explain
the much earlier default-Metal graphics peak. They are neither a census of the
whole heap nor exact reclaimable savings. The first recording exposes a
collector race: normal GUI exit between `poll` and `proc_pid_rusage` raises
`ESRCH`. Another recording includes a terminating GUI's zero-footprint sample.
Neither observation is an application allocation failure or a real memory drop.

The collector now omits a child that exits during the memory read, rechecks its
status after successful reads, and still propagates read failures for a running
child. Real subprocess regressions first fail for both exit boundaries and then
pass; the live-child error remains an error. All 16 profiling tests pass. A fresh
unprofiled application recording exits normally, handles and persists one Enter,
and contains 352 samples with both processes and no nonpositive memory values.
Combined physical peak is 97584568 bytes and RSS peak is 192315392 bytes. This is
still a hidden Cocoa one-Enter diagnostic, not default-renderer memory or sustained
interaction acceptance.

## Clipping allocation and matched application crossover

LUI `f58d20f2` removes generic floating-point comparison boxing from rectangle
intersection and reuses immutable rectangles only when all computed fields are
unchanged. Twenty thousand contained intersections first fail the unchanged
200000-byte allocation limit at 3360096 bytes, then pass at 96 bytes. Coverage
preserves empty intersections, negative dimensions, infinity, NaN comparison
order, and floating-point rounding at large and fractional origins. Full LUI
release suites, renderer pixel parity, native host regressions, and the native
executable/archive builds pass. The CLI scaffold test requires the install
targets to exist; after building them, the full suite passes without test or
threshold changes.

An alternating old/new crossover uses the same signed app path, worker, fresh
790-block graph, input library, and one-Enter script. The old binary SHA-256
starts `66d8f285`; the new binary starts `e4408b1d`. Each version has three runs,
each injecting and handling one Enter and persisting exactly one block. The
approximately 11.07-second native windows include background work; unknown UI
settlement prevents treating them as complete-action costs.

| Measurement | Old median (range) | New median (range) |
| --- | --- | --- |
| Host allocated bytes | 25854976 (25850200-25865456) | 24041464 (24036928-24051160) |
| Combined peak physical bytes | 98239928 (97994168-98321872) | 99501520 (97994168-99763712) |
| Combined peak RSS bytes | 197312512 (196984832-197378048) | 198492160 (197033984-198754304) |
| Input-to-host-frame ms | 26.40 (26.29-39.28) | 39.57 (37.20-45.95) |

The approximately 7% allocation reduction is repeatable in these runs.
Application memory does not improve, and the slower latency observations
require investigation rather than a performance success claim. Three runs do
not establish a precise confidence interval or a p95. The default Metal startup
still fails at 202212840 combined physical bytes with 127 nodes mounted.

The unchanged 50-Enter script also fails on both versions. The new version
crosses the guard at 200605696 combined RSS bytes; reopening its isolated graph
confirms five persisted blocks. The old version crosses at 200032256 bytes and
persists four. Different startup offsets and one failed run each cannot rank
their throughput. Neither completes the workload.

## Input CPU versus scheduling diagnosis

Two System Trace recordings use an input-library kernel signpost immediately
before returning the Enter keydown to the native host. The trace includes the
actual isolated GUI PID, and the signpost carries the native performance clock.
Both recordings handle and persist one Enter. They are explicitly marked as
profiled diagnostics and preserve the combined-memory guard.

Using each signpost and recorded host latency to approximate the main-thread
interval gives the following decomposition. SDL's millisecond event timestamp
and the signpost offset limit boundary precision; these are not exact phase CPU
measurements or input-to-visible latency.

| Diagnostic | Host latency ms | Running ms | Blocked ms | Runnable ms | Interrupted/preempted ms |
| --- | --- | --- | --- | --- | --- |
| Old binary | 31.36 | 30.85 | 0.43 | 0.04 | 0.04 |
| New binary | 41.47 | 40.47 | 0.78 | 0.04 | 0.18 |

The new sample runs for about 13.44 ms on efficiency cores before moving to
performance cores; the old sample runs on performance cores throughout. This
is a measured confounder, not proof that scheduling explains the entire
difference. Both samples predominantly execute instead of waiting. CPU samples
include hash-table lookup/comparison, major collection, retained painting,
geometry, accessibility, and software presentation. Many OCaml stacks omit the
intermediate application caller, so a generic hash-table sample cannot select a
particular cache for modification. Preserve the unresolved attribution and
timing risk before promoting the allocation change as an application speedup.

The report's visibility regression first fails for a hidden start, middle, or
end sample: all three incorrectly qualify as timing baselines. Baseline
eligibility now requires visibility throughout the recorded window. Hidden
setup outside the window remains valid, and explicit profiling still excludes
an otherwise visible run. All 18 collector/report tests pass. Visibility is
necessary but insufficient: action correctness, enough observations, actual
presentation timing, and the existing acceptance limits remain required.

## Minimal GPU completion working memory

A separate headless native Metal probe creates a device, queue, pipeline, and
1x1 private color texture, then submits one clear without drawing. The external
50 ms memory guard remains active. Physical footprint rises from approximately
7.3 MB before submission to 62.1 MB after GPU completion while the public Metal
resource counter reports 999424 bytes. A single-frame control stays near that
level for five seconds and falls to approximately 20.8 MB by ten seconds. An
additional empty command buffer does not reduce the immediate peak.

This establishes a substantial completion-related working cost even without a
window or graph. It neither attributes every physical page nor proves a leak.
Public resource counters overlap process accounting and must not be added to
physical footprint. The probe is diagnostic, not application acceptance.

A full-app appearance control skips six redundant assignments but still
crosses the guard at 202278376 combined physical bytes. A separate material-init
control never logs its changed initializer before termination, so its intended
path was not exercised and it cannot reject the material hypothesis. Neither
control is retained as a production change. A VM trace's page-fault totals also
include pre-exec activity and describe cumulative faults, not retained memory;
they cannot be used as a reclaimable allocation total.

## Drawable backing identity and host isolation

The next process-local trace records IOSurface IDs, configured drawable capacity,
texture size, and native VM ledgers around actual drawable acquisition. The
same release app, worker, graph, full viewport, and independent combined-memory
guard remain in use. Each recording is explicitly instrumented; its timings
cannot qualify as a baseline. The app executable remains `e4408b1d`.

Three distinct 2880x1800 IOSurfaces appear while `maximumDrawableCount` continues
to report two. This is not just three wrappers around two shared surfaces.
The public layer residency set independently confirms three allocations and
62226432 bytes, each texture occupying 20742144 bytes. The first texture remains
alive while the later two alternate. Configured capacity and drawable dimensions
therefore cannot establish the count or lifetime of actual backing storage.
The existing configuration assertions do not prove a two-surface memory bound.

One recording observes the graphics footprint ledger rising from 2031616 to
73973760 bytes between the first and second acquisition. GUI physical footprint
rises from about 33.3 MB to 133.1 MB over those observations. Subsequent writes
to the other full-size surfaces add approximately 21 MB each. The guard then
terminates the GUI and worker at 202982840 combined physical bytes, including
182551512 GUI bytes and 20431328 worker bytes. The latest native log still has
127 nodes and about 5 MiB of managed heap. Resource size, ledger values, and
physical footprint overlap and must not be added into an ownership total.

A paused reverse-reference snapshot includes paths through the layer residency
set and Core Animation image queue. Such trees also expose weak references,
internal non-owning links, and temporary diagnostic stack roots. They do not
prove exclusive ownership or justify releasing a framework-owned texture.
The SDK explicitly forbids modifying the layer-owned residency set.

The following full-app controls exercise their changed paths and still retain
three backing surfaces. Each is terminated by the unchanged guard. The table
records failed predictions; small differences from single instrumented runs
are not ranked as improvements.

| Control | Combined physical bytes at guard |
| --- | ---: |
| Flush main-thread transactions after SDL polling | 200574440 |
| Flush the initial size transaction before drawable acquisition | 200312272 |
| Flush background transactions after acquisition and presentation submission | 200443344 |
| Keep presentation pending through GPU command completion | 204703136 |
| Omit display-link creation | 202556880 |
| Run application launch completion once | 208471528 |
| Suppress activation and window raising after the first acquisition | 205047296 |

A separate prewarm control installs successfully but never encounters its 1x1
render-encoder path. It cannot attribute the failure to prewarming. No control
is retained in production, and neither presentation tracking nor frame-rate
requests are removed to obtain a favorable memory result.

The isolation ladder now distinguishes these cases:

| Diagnostic, without a graph worker | Backing surfaces | Sampled peak physical bytes |
| --- | ---: | ---: |
| AppKit clear, retaining the preceding target | 2 | 119505712 |
| AppKit clear, releasing the preceding target | 2 | 119227160 |
| SDL clear | 2 | 120144808 |
| SDL triangle with ordinary blending | 2 | 119817152 |
| SDL triangle with dual-source blending | 2 | 119751616 |
| SDL triangle plus a presentation handler | 2 | 120013760 |
| LUI replay of the actual first startup scene | 2 | 143885224 |

All these processes exit normally under the 50 ms external guard. Presentation
callbacks in the minimal hidden-window probe report timestamp zero, which is
not evidence of a displayed frame. The earlier SDL probe whose dynamic library
could not load is excluded. These probes do not verify application behavior,
sustained idle bounds, or visible FPS.

The captured first scene contains 23 operations and 20 glyphs at the original
2880x1800 size. It is replayed using installed LUI `f58d20f2` and the same bundled
SDL 2.32.6 library. Its graphics ledger also reaches 73973760 bytes, so this cost
does not require the Logseq graph, model, or document-query caches. Its late
idle physical median is 69256104 bytes; the corresponding simple dual-source
triangle median is 61277120 bytes. Active working memory and idle retention
remain distinct measurements.

A second replay binary links the exact native host stubs and cumulatively adds
titlebar setup, repeated collapsed-sidebar setup, activation, and native menus.
The unchanged replay and all four integration steps retain two surfaces, with
sampled physical peaks of 143885272, 143442904, 144016320, 143426496, and 144065496
bytes. These results exclude those initialization calls alone as a sufficient
reproduction of the extra backing surface. They do not exclude interactions
with the full host's frame cadence, changing scenes, or application packaging.

The next comparison must match those remaining differences in a differential
scene replay. Independently, the active fixed-scene replay already exceeds
100 MB without the application model or graph worker. Managed-cache changes
alone cannot establish the full memory target on this renderer path. Renderer
alternatives still require complete application memory, pixel, input, resize,
and latency acceptance before changing the default. All isolated measurement
children have exited; raw logs, source probes, hashes, and the captured scene
remain ignored local investigation artifacts.

## Performance target and display limit

The work budget is 8.33 ms for 120 FPS. The connected DELL S3422DW is currently reported by macOS at 100 Hz, so this display cannot show 120 distinct frames per second. The HUD counts drawable presented-handler notifications rather than render-loop attempts.

## Confirmed regressions and validation

- A real nested flex tree failed the measurement reuse bound before NaN-aware constraint comparison; it passes after the fix and verifies changed leaf dimensions.
- Native host tests cover context-menu anchors, focus discovery, caret paint, retained interaction hints, viewport markers, linear hit geometry, overlay glyph indices, and normalized text measurement constraints.
- Metal pixel parity tests exercise the public readiness interface with an actual GPU renderer.
- Profiles and runtime logs are retained under tmp/native-app.
- LUI changes target feat/ml-backend. The user requested local commits before continuing the remaining native interaction and rendering fixes.

## Measured baseline

The first instrumented recording (`tmp/native-app/native-metrics-before.jsonl`) fails acceptance: full layout p95 is 86.35 ms, GPU execution p95 is 32.08 ms, and input-to-host-frame p95 is 101.77 ms. Actual presentation was approximately 30 FPS. Event handling p95 is 5.30 ms and patch application p95 is 2.32 ms, so layout and GPU work are the first optimization targets. Phase histories have independent sample counts and may span different times; scenario validation must use fresh samples from the same recording interval.

Large full-window outset shadows were shading pixels entirely covered by their casting rectangle. Opaque fills also ran the general rounded rectangle fragment shader with blending. Dedicated regression scenes compare pixels and enforce the GPU work budget. These fixes alone do not establish that editing meets acceptance; the full application still needs scenario measurements.

The real app scene is captured with `LUI_METAL_CAPTURE` and replayed by the existing Metal test using `LUI_METAL_BENCH_SCENE`. The captured scene failed its 8.33 ms budget at GPU p95 9.25 ms. Excluding shadows only in the diagnostic replay reduced GPU p95 to 2.53 ms. Drawing the unchanged shadows in four scissor strips outside the fully covered casting-box interior reduced the full scene to p95 5.01 ms; the shared pixel parity corpus passes. These are offscreen GPU measurements, not a certification of application FPS.

The timing validator is `deps/ui/ocaml_host/native_acceptance.py`. It reconstructs fresh samples from cumulative phase sequence numbers and rejects insufficient input, short recordings, lost samples, CPU-loop substitution, slow GPU work, and dropped display frames. Its tests run under `dune runtest ocaml_host`. For example:

```sh
python3 deps/ui/ocaml_host/native_acceptance.py tmp/native-app/native-metrics-shadow-strips.jsonl --scenario typing --refresh-hz 100 --warmup-s 5 --evidence tmp/native-app/typing-evidence.json
```

A passing timing report must accompany functional scenario evidence. Missing functional evidence does not count as acceptance.

## Current scenario findings

- The persisted acceptance page contains all 200 ASCII characters in the expected order. The first 50-Enter run added only 48 blocks. This is a functional failure, regardless of timing. A retired focused sink was not repaired until frame cleanup; a regression test now exercises remount followed by input before cleanup. Focus repair runs before keyboard and text events. The exact 50-Enter scenario must still be repeated against the live application.
- Wrapped caret geometry measured an unwrapped prefix. The native text layout now supplies caret geometry, click hit testing, and visual line ranges from the same layout used to draw glyphs. Tests exercise a wrapped paragraph and focus replacement.
- A 100-block incremental layout fixture failed at p95 20.04 ms and passed at 14.73 ms after typed offer-cache lookup and bounded reuse of unchanged subtree measurements. Incremental/random geometry regression tests pass. This fixture does not certify the full app's editing performance.
- The real search scene contains 289 operations and 638 glyphs at 2880x1800. With the app closed to avoid competing GPU workloads, its first isolated replay measured GPU p95 18.49 ms. Dedicated fill rendering, flat interior rendering, and omission of transparent border interiors reduced the 120-frame replay to p95 6.52 ms. Shared pixel parity tests pass. Application display FPS must be measured separately.
- The global CLI replaced the native worker with a different implementation during validation. The native worker was restored. Subsequent persistence checks call the running native worker's read-only `/v1/invoke` API directly rather than using the mismatched CLI.
- The timing validator also checks scenario-specific functional evidence: exact persisted text, Enter/block counts, input rates, IME commits, caret/final focus, button outcomes, scroll reversal/scrollbar visibility, and reflow correctness. Its 15 tests include the observed 48-versus-50 block failure. Input counters in metrics distinguish received keydowns, Enter events, text commits, and UTF-8 bytes.
- Editor context discovery repeatedly scanned the store during caret rendering. A failing allocation regression now protects cached context discovery; scroll and resize still use the current editor rectangle on each cache hit.
- The default Metal suite now includes a content-free native modal fixture with the full-window translucent mask, continuous panel corners, shadows, transparent border, and 640 glyphs. Its first isolated GPU p95 was 8.62 ms. Rendering fully opaque panel interiors without blending brought an isolated run to 7.81 ms, but a subsequent serial suite still failed at 8.66 ms. Dedicated mask-glyph rendering removes the unrelated shadow/image shader branches; the final serial suite passes the fixture at GPU p95 7.54 ms. CPU/GPU pixel parity remains covered. Concurrent Metal test processes also compete for the GPU, so hardware performance validation runs with `dune runtest -j 1` and the application closed. No timing limit was increased. These measurements do not establish the application's display FPS.
- Full LUI tests and native host tests pass. After unlocking, the live recording still shows layout p95 around 20 ms and input-to-host-frame p95 around 50 ms while GPU p95 is around 6.4 ms. The user also reproduced character-by-character wrapping during editing and disappearing header button icons. These failures require follow-up fixes and controlled scenario acceptance. No claim of universal smoothness, 60 editing FPS, or 120 physical FPS is established yet.


## Native gallery diagnostics and follow-up findings

The LUI SDL/Metal component demo was built from the local source on the same Mac and display, with a client size of 1960x1376 device pixels. This demo exercises the backend used by the Logseq SDL host. Logs and sample boundaries are retained in `tmp/native-app/lui-gallery-profile.log`, `lui-gallery-phases.log`, and `gallery-windows.json`.

The demo accepted navigation and a 200-character burst. Its input field displayed the text but overflowed rather than scrolling horizontally. The overlay menu opened, but hidden menu text could remain in the top-left corner. The input page select dispatches a model field that its view never reads, so that control is a separate incomplete example. Shrinking and expanding the window changed its layout, but this observation alone does not establish continuous resize smoothness.

Twenty navigation actions and twenty 10-character input bursts were recorded. These burst tests do not certify the application acceptance scenarios. The original per-frame allocation trace used sampled GC counters; those numbers cannot certify allocation on an individual frame. The trace now uses the current UI domain allocation counter. A later mixed resize/navigation/input recording had layout p95 2.23 ms, encode p95 3.04 ms, and present p95 13.13 ms. Startup was excluded, but these phase distributions remain mixed diagnostic samples, not scenario acceptance.

The demo FPS badge divides 1000 by average processing time, which is not an actual display FPS measurement. The Logseq HUD uses the real Metal presentation callbacks. The native transition property is currently classified as unmapped. Native transitions remain outstanding work.

Allocation sampling of the real application identified repeated clip tuple/list construction and per-instance packing closures in `Lui_gpu`. Two new tests failed before the fix: packing 1000 instances allocated 64000 bytes, and four nested clips allocated 354144 extra bytes compared with an unclipped scene. Reusing encoded clip state until push/pop and writing float4 fields with fixed offsets reduced these to 0 and 3680 bytes respectively. All 20 GPU encoding/cache tests pass, including existing nested-clip, gamut, glyph, and field-order checks. Metal pixel parity and live application acceptance are checked separately; no FPS claim follows from these allocation tests.

Additional host fixes have failing-then-passing coverage: a decorative sidebar material must return no hit-test target; viewport resize must retain text measurements; unchanged interaction sync must allocate less than 16 bytes per poll; pending zero-width editor geometry must not wrap every character; and metrics percentile sorting must avoid boxed float comparisons. The sidebar material fix was verified by first-click Pages and Journals navigation in the real application. These changes still require the complete controlled editing, Enter, scroll, idle, and animation acceptance runs.


## Follow-up idle rendering cache

After the gallery-driven GPU encoding changes, a controlled native recording still failed idle acceptance at 942093 bytes/s and 0.43 minor collections/s. No input or layout occurred in the sampled quiet interval. The allocation call stacks still entered `Lui_gpu.rebuild` from the once-per-second HUD presentation. Temporary overlay composition touched the scene revision even when the displayed HUD and body were unchanged.

The host now reuses composed overlay ops and glyphs while body lists, viewport dimensions/scale, theme, rounded FPS label, and caret geometry remain unchanged. Opening the live metrics panel bypasses reuse so its counters keep updating. The retained body lists and width are restored after each render, including exceptional exits. Editor requests now use unclipped, scroll-shifted geometry; clipping belongs to hit testing and paint, and must not change text wrapping width.

The existing real-application idle acceptance validator supplied the failing integration test. Overlay caching alone still failed at 532477 bytes/s and 0.24 minor collections/s. Allocation sampling then identified snapshot export: each update rebuilt a chronological array and list and reformatted overlapping samples. Export now writes directly to one reusable buffer and caches each sample string and summary header until its source changes. Numeric conversion bypasses general-purpose format interpretation, retains more sample precision, and emits valid JSON numbers. Regression tests cover the wrapped ring order, unchanged history reuse, and the allocation budget with 120 new samples per phase per snapshot.

An initial interval passed idle acceptance, but the longer unprofiled recording in `tmp/native-app/gallery-export-acceptance-idle.jsonl` still exceeded the existing 256 KiB/s allocation limit. No new layout or user events occurred in the quiet interval. This remains a failure; sampling also identified repeated Metal draw-command construction during retained scene submission. Interactive invalidation, editing FPS, Enter correctness, and transitions remain required before this decision can be implemented.


## Retained Metal draw submission

Sampling showed that a retained GPU batch cache hit still rebuilt pipeline runs, scissor strips, and the draw array on every submission. A real offscreen Metal test failed at 1057024 allocated bytes per frame for an unchanged 1000-element scene. Draw descriptors now follow batch-cache invalidation; image textures are synchronized each frame before reuse, so image version changes remain visible and active resources are not retired after 64 frames. Cache entries are cleared on renderer release.

The same regression now allocates 520 bytes per frame, below its 8 KiB limit. Pixel tests cover image updates after 70 retained renders, display-list replacement, viewport changes, and clear-color changes. All 12 Metal tests pass, including the shared CPU/GPU parity corpus and existing GPU frame budgets. The host must be rebuilt against the updated dependency and measured independently before idle or editing acceptance can be claimed.


## Allocation counter accuracy

OCaml 5 `Gc.quick_stat` reports counters sampled at the last collection, so a short interval can underreport allocation without a GC. The exporter retains the sampled process total and adds `host_allocated_bytes`, measured with `Gc.allocated_bytes` for the UI domain. The two scopes are explicit; neither counter replaces the other. Idle acceptance requires both rates to fit 256 KiB/s, process minor collections to stay at or below 0.1/s, no layout, and no user events. New tests failed before the change for uncollected allocation and input contaminating an idle interval, then passed after it. The LUI diagnostic trace also uses current domain allocation rather than differences between sampled GC records.

The previous 46.7 KB/s short-window result used sampled counters and is provisional. A fresh recording with the current-domain counter is required before claiming idle allocation acceptance.


## Full-history export budget

A regression with all 15 phase histories filled to 240 samples failed at 500868 allocated bytes per snapshot, measured with the current domain counter. Separate measurements attributed approximately 124696 bytes to sorting and 115542 bytes to export after eliminating per-phase row copies. Statistics now merge integer indices using two fixed-size work arrays per history, and means update with the bounded rolling window. Export reuses one buffer and avoids repeated float format interpretation. The sorting portion measured 2776 bytes for all phase summaries; the complete full-history export passes its unchanged 160000-byte limit. Quantile checks cover all partial window sizes, tied values, and ring replacement through 300 records. The full native host suite and 18 acceptance-validator tests pass.


## Remaining idle polling allocation

The rebuilt host with bounded export still failed a longer quiet recording: sampled process allocation was 280140 bytes/s, current-domain allocation was 265598 bytes/s, and minor collections were 0.12/s. No new layout or user events occurred. This is retained as a failure in `tmp/native-app/bounded-metrics-idle-window.jsonl`.

Sampling also identified per-poll action-dispatch and scrollbar callbacks. Action handling now uses one recursively bound handler rather than constructing its capturing closure on each empty action list. Scrollbar polling checks whether deadlines exist before creating a traversal callback, while still validating and advancing the monotonic clock. The new idle scrollbar allocation test failed before the change and passed afterward. All 70 window tests pass, including scrollbar visibility, scrolling, input, focus, and overlay coverage. A new unprofiled host recording must determine whether the combined changes meet idle acceptance.

## Idle polling acceptance result

The rebuilt native host passed the unchanged idle validator in `tmp/native-app/idle-poll-fixed-window.jsonl`. After excluding five seconds of startup, the quiet interval lasted 56.269 seconds: sampled process allocation was 175841 bytes/s, current UI-domain allocation was 157625 bytes/s, and minor collections were 0.0711/s. No layout or user events occurred. The final 11.042-second interval independently passed at 207223 process bytes/s, 158682 UI-domain bytes/s, and 0.0906 minor collections/s. Both allocation counters stayed below 256 KiB/s and minor collections stayed below 0.1/s.

The rebuilt native host regression suite and all 18 metrics acceptance tests pass. This result establishes idle acceptance for this recording only. Controlled fast typing, repeated Enter, scrolling to the bottom, button outcomes, resize, editing presentation timing, and transitions remain outstanding.

## Overlay visibility and presentation diagnostics

The native gallery reproduced closed dropdown, context-menu, and toolbar-menu labels stacked at the window origin. Transient visibility reached layout but did not reach either paint path. Host-owned visibility now travels with paint hooks; both the full walk and retained fragments stop at a hidden ancestor, including promoted popup descendants. Changing the predicate invalidates retained paint, and menu open-state changes invalidate paint alongside layout. Two host regressions failed for first paint and retained close/reopen, then passed after the fix. Wire visibility remains authoritative. A rebuilt gallery shows no closed-menu labels, opens the dropdown, and executes its notification item. Clicking that item still selects an underlying text label; this separate input issue remains unresolved.

The gallery badge previously displayed 808 FPS by dividing 1000 by average processing time. It now counts actual Metal presented-handler notifications over elapsed wall time and reports once per second. CPU processing statistics retain their own labels and cannot be read as display FPS. Tests cover 100 Hz, 60 Hz, irregular reporting windows, idle, and decreasing counters; they failed before implementation and pass afterward. The rebuilt idle gallery reports 0 FPS when no new frame is presented.

The actual application also reproduced a separate sidebar issue: Pages navigation worked, but recent-page titles did not navigate. Detail-click registration did not mark an activation owner, so a passive child captured the click. Native click detail now follows the deepest hit through its actual ancestors, preserving target class and modifiers, and detail handlers register activation ownership. Runtime view-to-input regressions cover navigation ownership, sibling release capture, the actions button class, unrelated underlays, outside release, and disabled owners. The corrected tests fail with the previous implementation and pass with the fix. After restarting the rebuilt application, the recent-page title opened the acceptance page on its first click.

## Pointer hit-test allocation

The native entry point omitted the spatial index already supported by the shared input engine. Each pointer event traversed the full mounted forest for UI input and again for the document event target. A 2000-button input/DOM regression measured the unchanged unindexed path at 2083506 bytes per movement event. The cache regression first failed at 1761577 bytes/event when rebuilding an index for each event. Reusing the index by store identity/revision, rectangle mirror identity, and geometry epoch reduced the combined path to 5113 bytes/event, below the unchanged 16 KiB budget. Tests cover moved rectangles, hidden nodes, and a replacement store. Pointer events and document hit testing now share this cache; layout/scroll/resize mirror refresh advances its epoch.

All native host regressions pass and the main application was rebuilt and restarted with the change. Navigation remains a failure: a 20-click Pages/Journals probe had active-frame p95 132.89 ms, layout p95 254.63 ms, and input-to-host-frame p95 104.98 ms in its diagnostic recording. These phase histories also include startup and are not controlled scenario acceptance; they justify further investigation, not a smoothness claim. CPU sampling during another eight navigation actions includes flex layout, protocol JSON decoding, and property lookups. Continuous mouse movement and editing FPS still require isolated application measurements.

## Captured Journals layout failure

Flex profiling of repeated Journals navigation reports 204175 layout calls and 85501 cache hits in a roughly 200 ms compute pass. `LOGSEQ_NATIVE_LAYOUT_CAPTURE` now saves the store, dimensions, scale, transient hidden ids, and popup anchor only when an actual layout exceeds 50 ms. Capture serialization occurs after the measured layout interval and is diagnostic overhead, so capture-enabled application timings cannot certify acceptance. The captured local store has 6138 nodes.

The optional `LOGSEQ_NATIVE_LAYOUT_REPLAY` native host regression replays that store through the same text engine, padding, width normalization, and layout backend without the GUI or database. Six fresh-layout samples failed the unchanged 16.67 ms editing budget: 206.43–247.08 ms, with about 114.45 MB allocated per repeated layout. The capture remains an ignored local artifact; graph contents are not committed. This supplies a repeatable failing integration boundary for further flex cache optimization.


## Scroll allocation and row lifetime

Real native scrolling reproduced heap growth with no new layout. Nine input events over a 56.248-second observation allocated roughly 150 MB; sampled RSS fell from 289.5 MiB to 259.9 MiB, so this recording alone does not establish a leak. Allocation sampling identified whole-tree traversal and viewport checks. The exporter now includes heap capacity, sampled live bytes, and peak heap capacity separately from cumulative allocation.

Store traversal follows intrusive child/sibling links without allocating child lists. A 6000-node deep-tree regression failed at 912360 bytes for preorder and now uses 288456 bytes. Twenty streamed traversals allocate 6336 bytes. Native geometry refresh and scroll paint hints use the streamed traversal. Viewport-marker discovery is cached by store identity and revision; its 6000-node regression failed at 2691025 bytes per check and now passes an 8192-byte limit. Removed markers lose their per-node firing state.

Native lazy-row placeholders supplied height through an unread style string. Four real view paths now preserve their estimated extent in the declared native viewport-widget layout property, and preserve the measured floating-point extent when unmounting content outside the overscan band. Returning to the band remounts content. Focused editor ancestors stay mounted. Native DOM handlers unregister with their mounting scope, and row latches belong to the mounted list rather than a process-wide table. Weak-reference tests failed for retained handler resources and a disposed row scheduler, then passed after the lifetime fixes. Row-owned resources become collectible on viewport exit. After 100 mount/unmount cycles, the four paths retain 156288–159312 additional bytes, below the unchanged 1 MiB limit.

Pagination had two independent faults: the viewport sweep's `else` bound to the inner lazy-mount condition, and short journal lists omitted their pagination endpoint. Both have failing-then-passing tests. Pagination uses unclipped, scroll-shifted geometry. The rebuilt app visibly reaches later journal dates and restores the original content when scrolled back to the top; the resting scrollbar is hidden.

The initial live journal store dropped from 6138 nodes to 1744 nodes, with heap capacity around 44 MiB. The bounded-window recording returned to 1703 nodes after downward/upward scrolling and loading additional days, with sampled live memory around 49 MiB. These are diagnostic observations, not complete timing acceptance. Its active-frame p95 was 63.33 ms, layout p95 45.65 ms, scene-build p95 11.25 ms, geometry p95 2.46 ms, and mailbox p95 23.36 ms. The performance target remains unmet.

## Definite and intrinsic flex measurement

An exact main-axis measurement now uses the same single-flex-child shortcut and grow distribution as a full layout pass. Intrinsic at-most offers still remain content-sized. A deep-container regression reduced allocation from 20321856 bytes to 5858880 bytes before the subsequent intrinsic-cache work. Existing alignment, wrapping, percent-size, and geometry coverage passes.

A second nested regression failed at 16219712 allocated bytes. A representative intrinsic measurement can satisfy a tighter fitting offer only when the entire subtree is independent of percentage owner dimensions; style and child-list changes invalidate that dependency summary. The regression now uses 6373952 bytes. Tests cover percentage descendants and changing a fixed child into a percentage child. The 100-block incremental fixture measured p95 7.57 ms in one run; this remains a fixture result and does not certify application editing FPS. The real captured-layout replay and controlled native interaction scenarios still determine acceptance.


## Shared geometry and viewport entry batches

A deep absolute-coordinate refresh failed at 5840760 allocated bytes. Resolving ancestor coordinates once per geometry refresh, before pixel snapping, reduced it to 3608568 bytes but still failed the original 2 MiB limit. Sampling then showed renewed flex measurements under a changed height bound at an unchanged exact width. An uncapped height representative now reuses that content height only for owner-independent subtrees and fitting offers at the identical width/mode. The combined regression uses 1280040 bytes and passes its unchanged limit; ancestor movement and later scoped height updates retain the expected rectangles. Existing snapping, virtual-list, popup, grid, and incremental/random geometry tests pass.

A real journal-row region now publishes all entering row latches through its existing batched event contract. The new integration test failed when twenty rows produced twenty independent events; it passes with one event that mounts all twenty rows exactly once. Nested child gates retain their own event target rather than joining a different row container's latch table. Focused, pressed, and open-menu ancestry stays mounted while outside the viewport.

The frozen 4604-node layout snapshot is kept separate from later live graph changes. Its intrinsic-cache replay improved from about 63–75 ms to 31–43 ms, with 25911 flex calls instead of 91317. It still fails the 16.67 ms limit. The shared absolute-coordinate/height-cache changes require another replay and a fresh rebuilt-app measurement before any further timing claim.


## Pending presentation and cache disposal

A controlled renderer regression reproduces a dirty host scene being consumed while the GPU is busy. Without pending presentation state, the host remains clean and its latest update waits for the one-second idle heartbeat. The native loop now retains a pending presentation flag, retries the latest retained scene when the GPU becomes ready, and clears the flag only after submission. Retry does not repeat layout or scene construction. The regression verifies busy skips, coalescing a second update, final pixels, no repeated submission after success, and the idle heartbeat; it failed before the fix and passes afterward.

A nested scope teardown can detach one child before detaching its enclosing root in the same batch. Unlink replay previously replaced the parent's recorded children with the final store children, losing still-to-be-purged siblings. This retained descendant layout nodes and the absolute-coordinate cache exposed their missing owner. Unlink now removes only the recorded target from the mirror before subtree purge. A new disposal/re-mount regression and the existing actual application disposal scenario pass. Fractional ancestor margins continue to accumulate before pixel snapping.

Native snapshot attribute parsing, DOM overlays, rectangle/natural-size measurements, reference fields, and the element-handle ring retained removed nodes. Cache invalidation now prunes against mounted runtime nodes at patch drain and application disposal. Reference-owned data follows its node owner. A real mounted extension with a 100 KB attribute payload failed its teardown checks, then passed after pruning; its snapshot becomes collectible. Allocation profiling also discards its diagnostic stack table after exporting, so a finished capture does not keep sampled stack strings alive.

## Repeated construction during incremental mounting

Allocation sampling during repeated native scrolling identified fresh flex nodes and styles as the largest sources. A batch is applied to the store before its layout journal is replayed. Inserting a newly created ancestor therefore mirrors its complete final subtree. Later create records used to purge and rebuild those freshly created descendants, causing repeated construction proportional to subtree depth.

The journal now purges old create identities before constructing final inserted subtrees and skips repeated create purges during replay. An 80-level subtree regression failed at 12240912 allocated bytes and now uses 911072 bytes, below its unchanged 1500000-byte limit. Differential coverage verifies replacement parents, replacement attached children, newly inserted identities dropped and recreated, transient subtrees dropped in the same batch, and released old descendants. The full layout, native window, retained paint, and application scenario suites pass.

The frozen 4604-node cold layout now takes roughly 26–32 ms and allocates 24476480 bytes after shared geometry/height-cache optimization. It still fails 16.67 ms. One rebuilt native scroll round returned to approximately 39–40 MiB of sampled live memory and 52–54 MiB heap capacity, but allocated around 1.4 GiB during the observation. That run predates the final cache pruning and single-construction changes. It cannot establish final memory or frame acceptance.

The requested free-pointer recording contains 1441 events and 75 layouts over a 43.612-second exported interval, with about 4380 MiB of host-domain allocation. Its final screenshot also shows page navigation and the metrics split opened relative to the start; these boundaries are not an isolated steady-page pointer benchmark. Pointer/hover application allocation remains an unresolved acceptance item despite the indexed hit-path unit improvement.


New-node initial properties also recomputed styles already read from the final store. Extending the 80-level regression with five initial layout properties per node failed at 2558312 bytes after the first construction fix. Property replay now skips identities created in that journal; their first mirror construction reads all final properties. The extended regression uses 961784 bytes and passes the same 1500000-byte budget. Existing identity replacement and full scenario coverage passes.

The native metrics overlay now caches its own text/glyph contribution independently of changes to the body scene, updating live panel samples at four intervals per second. Pointer repaint no longer reshapes unchanged panel text each frame. Its regression failed with 101 draws for repeated equivalent frames and passes with one; new samples and changed body glyph counts still refresh indices. This controls diagnostic overhead and does not alter the actual presented FPS counter. The optional allocation trigger file starts/stops a capture after the chosen page is settled, allowing pointer-only sampling without startup/navigation allocations.


## Queued updates followed by subtree disposal

The next live pointer recording crashed with `Not_found` while resolving an absolute coordinate, so no success claim is valid for that application run. A property update queued before a later subtree drop was replayed against the already-final store where its target no longer existed. Restyling that removed target erased its recorded child expansion before teardown could release the descendants. A four-node regression first exposes retained disposed geometry, then reproduces the exact missing-owner exception after resize. Property replay now also skips targets removed by the final transaction; drop replay still releases the recorded descendants. The regression and full LUI suites pass. A fresh native restart and pointer recording remain necessary.

Allocation capture now exports in the loop finalizer as well as on its stop trigger, preserving diagnostic evidence if a later interaction throws. Finished captures release sampled stack strings and cannot restart automatically. Capture-enabled timings remain diagnostic overhead, not performance acceptance.


## GPU glyph compilation during hover repaints

The recovered native application completed twenty consecutive metrics-panel toggles with correct final width and no repeated missing-owner exception. Its mixed interaction allocation capture identifies GPU glyph instance construction and clip stamping as the largest sites, with about 35.52 MB and 34.48 MB estimated at those two sites. It includes panel changes and cannot certify a pointer-only allocation rate.

A regression changes one hover fill while retaining 1000 glyph records and recompiles the scene each frame. It failed at 707069 bytes/frame. The batch cache now weakly keys immutable glyph records and reuses compiled instances only when text coverage, atlas dimensions, gradient/style, wide colors, and clip context match. A per-operation compilation closure avoids allocating a closure per reused glyph. The regression passes at 91565 bytes/frame under its unchanged 131072-byte limit, with instance values equal to an uncached compilation. Separate tests cover all signature changes, replaced geometry/color, and collection of removed glyphs. The weak cache shares immutable instance records with the current batches and does not retain removed text. Native runtime validation of this last optimization is pending.


## Native element identity under repeated pointer events

Native `contains` omitted the target element itself, so two handles of the same trigger never compared as the same element. Tooltip hover therefore repeatedly cancelled and re-armed the same trigger. The original element-token ring also overwrote a held handle after 1024 lookups. The identity regression first failed before any intervening lookup, then failed after 2001 lookups once reflexive containment was corrected.

Containment now includes the same element and preserves parent/child direction. Handles use monotonically assigned tokens and an ephemeron registry weakly keyed by the handle itself; a held handle retains its snapshot and temporary event handles become collectible. The old bounded-ring expiration rule is removed. Tests pass for repeated lookups, separate snapshots of one node, held handles across GC, directional containment, and disposed snapshot collection. The GPU glyph reuse full suites also pass, including Metal pixel coverage and native input tests. Rebuilt native application validation remains outstanding for the combined change.

## Idle allocation with unchanged patches

An extended native recording has zero events and zero layout runs over 30.103 seconds but allocates 561242440 host-domain bytes. Heap capacity reaches 601559600 bytes. The metrics panel is open; its updates use the renderer overlay rather than application patches, so an unchanged patch counter does not establish that rendering is idle. The renderer restores the retained operations and glyph list after overlay submission; the evidence does not support repeated overlay-list accumulation.

The GPU glyph cache previously weakly retained compiled instances as long as historical glyph keys remained alive elsewhere. It also accumulated weak-table bookkeeping between major collections. A regression retaining historical text snapshots across 100 replacements fails with 24947088 additional bytes of compiled renderer data. The cache now owns only glyphs used by its current compiled frame and drops superseded entries at replacement, independently of GC timing. The same regression retains 247168 bytes and verifies identical uncached rendering. The stable 1000-glyph hover regression remains below its unchanged 131072-byte/frame budget at 91429 bytes/frame; the full LUI suite passes.

Panel labels now retain their individual fragments and relocate glyph indices when preceding text changes length. Unchanged glyph geometry preserves physical identity across sample changes, allowing GPU instance reuse. Diagnostic layouts use a separate 32-entry cache instead of adding continuously changing numerical strings to the application text cache. A real CoreText label regression fails when changing a number reshapes unrelated labels, then passes at 52112 bytes/update. Cached indices are also checked against changed and empty scene bodies.

Allocation sampling identifies work-percentile sorting as another idle hotspot. Copying and sorting the 240-element float array for p50 and p95 allocates 217757 bytes/update. Reusable integer index buffers and one sort per history update reduce the same regression to 65 bytes/update without changing the rolling percentile semantics.

The rebuilt panel recording contains a 24.117-second interval with zero events and zero layouts. It allocates 17242608 host-domain bytes, while heap capacity decreases by 2165440 bytes and sampled live memory decreases by 1551448 bytes. This interval does not reproduce monotonic heap growth, but approximately 0.715 MB/s allocation still exceeds the 256 KiB/s idle target. Active editing, scrolling, pointer allocation, and presentation acceptance remain incomplete.

The user requires terminating the application above 200 MB of actual process memory. Test launches now have an external RSS monitor with a 200000000-byte threshold and a 0.5-second polling interval. It terminated the rebuilt application at 200491008 RSS bytes. This cap limits test resource consumption; it is not a memory optimization or a passing acceptance result. Samples after input resumes must not be reported as pure idle. `LOGSEQ_NATIVE_METRICS_PANEL=1` opens the split at startup for reproducible idle recordings when UI automation cannot click the window.


## Quiet-loop integration and extended memory validation

The extended recording after the warmup spans 775.598 seconds. It allocates 718608 host-domain bytes/s and runs 0.330 minor collections/s; heap capacity grows from 40586832 to 59237392 bytes. It contains 79 events, so it is not a pure-idle acceptance recording. Both allocation and GC exceed their existing limits. Idle acceptance now requires at least 600 seconds, and its regression rejects the previously reported 24-second interval.

A 30-second live-allocation cohort estimates 17840000 allocated bytes and 160000 surviving bytes after two diagnostic major collections. The surviving samples are shaped layouts. Snapshot, handle, glyph-slot, and layout-cache counts remain bounded in that recording. This narrows the investigation to allocation churn but does not establish that every native resource is released. Forced collections remain diagnostic only.

The remote quiet-loop fix replaces an idle gate based on repaint count with elapsed time since activity. Repaints stop during idle, so a repaint-count boot gate may never expire. The local Metal path has no GL vsync and instead used the active 120 Hz deadline, bypassing the remote blocking-wait branch. Quiet-loop selection now precedes both renderer pacing paths: after two seconds without activity and with no dirty frame, SDL waits up to 16 ms for an event. Input wakes the wait, and the waking event remains queued for normal handling. Scheduler regressions cover quiet, recent-activity, and dirty-frame cases.

The rebuilt application reduces quiet polling from approximately 120 to 60 iterations/s, but still allocates approximately 0.65–0.75 MB/s in the short panel recording. Its actual RSS reaches 200114176 bytes and the external memory guard kills it. Subsequent launch diagnostics also hit the unchanged 200000000-byte cap. These recordings cannot certify sustained idle behavior, interaction responsiveness, or the FPS requirements. A native memory-map capture reports substantial graphics memory beyond the OCaml heap; ownership and in-flight GPU resources still require investigation.

Merge validation builds the native executable and web bundle and passes the UI test aliases after generating their complete JavaScript test dependencies. Restored allocation fixes pass the native host tests, all 19 acceptance-validator tests, and the LUI test suite. The nearest-ancestor regression measures 12073 bytes/query for 64 ancestors, and the 1000-row scoped query regression measures 216525 bytes/query. These are isolated regression measurements, not application FPS acceptance.


## Solid compositor bands and promotion diagnostics

A native CoreAnimation control rendered 98,688 premultiplied color cases through `CALayer.backgroundColor` with exact byte equality. Uniform band regions now use immutable `CGColor` values instead of one-pixel IOSurfaces. Before the change, each uniform fixture owned 49,152 bytes of image backing; afterward all six fixtures own zero image bytes. Sparse and separated content still uses cropped immutable IOSurfaces. The full native window and UI test aliases pass, including immutable versions, alpha composition, clipping, resize, disposal, menu boundaries, and editor behavior. This fixture saving is not an application-level physical-memory result.

An unprofiled default-backend memory map during scrolling reports 26.5 MiB of dirty VM allocations, 28.7 MiB of dirty malloc regions, and 4,160 KiB of IOSurfaces. Malloc payload is 15.9 MiB; the remaining 12.9 MiB includes allocator capacity and fragmentation and is not proven reclaimable. Managed OCaml memory overlaps these VM/malloc categories and must not be added again.

A paired bootstrap control tested whether the temporary initialization domain caused the remaining high-water mark. Combined physical peaks were 104,662,456 bytes with parallel initialization and 105,776,592 bytes with serial initialization. Both ran the same full-size scroll sequence. Serial initialization did not improve the peak and was rejected; production initialization remains parallel. These 85-second controls do not establish sustained idle acceptance.

The metrics exporter now records cumulative minor allocation and promotion bytes, plus configured nursery capacity per domain. These distinguish allocation volume from promoted data and retained heap capacity without forced collections. Runtime tuning remains experimental until the same graph, worker, viewport, and input sequence show an actual combined physical-memory improvement without interaction regressions.

The rebuilt solid-band application completed the 85-second default-backend scroll diagnostic at 103,400,888 bytes of combined physical peak, with 69,452,736 GUI bytes and 26,018,296 worker bytes at the final valid sample. During the active scroll interval it allocated 218.3 MB/s and promoted 44.3 MB/s, a 21.4% promotion ratio. Two single-variable GUI nursery controls retained the same executable and worker: 8 MiB reached 111,412,664 bytes, while 1 MiB reached 103,171,488 bytes. Promotion remained about 20.1% and 22.2%, respectively. Neither control met the 100,000,000-byte peak bound; neither was adopted. The default nursery remains unchanged. These short controls are diagnostic only and are not sustained idle or visible frame acceptance.


## Current scroll allocation follow-up

A fresh native allocation-volume capture during seconds 18-28 of the full scroll sequence attributes estimated allocations to retained paint, layout, store traversal, accessibility, and application geometry. It records volume only, with no forced collection and no valid surviving-allocation estimate. Capture overhead disqualifies its physical peak and timings as an unprofiled baseline. The corresponding unprofiled run, including all pointer and wheel events, remains the memory comparison.

The retained fragment lookup used `Hashtbl.find_opt` for every hit, allocating an option wrapper even though callers need the fragment itself. Direct lookup preserves miss creation and fragment identity. A regression first failed at 16,049 bytes per 1,000 hits and now uses 49 bytes. The full retained-paint, layout, input, and application scenario suites pass. This local allocation result does not establish an application physical-memory saving.

Accessibility updates independently walked every changed node's complete current and previous ancestor chains. Shared ancestors were repeatedly visited even when already included in the update. Per-update visited sets now deduplicate each tree separately, preserving different ancestry after reparenting. The new 400-leaf/80-ancestor regression failed at 1,745,968 bytes and passes at 775,856 bytes under its unchanged 1 MiB bound. It compares the complete result with a fresh accessible tree, includes duplicated and reversed dirty ids, and verifies hiding, moving a descendant into a visible root, and restoring visibility in a later batch. Existing insertion, focus, old/new ancestry, platform accessibility, native input, and application suites pass.

The default-backend fragment-lookup application completed all 50 Enter and 200 Unicode input events without crashing. Reopening the worker confirms one exact 200-character/431-byte title and 50 additional empty blocks relative to a no-input startup control. The control starts the empty current journal but never clicks its add button; the action workload also creates the initial editing block, so its total block-count difference is 51. The Enter counter itself is exactly 50. Its combined physical peak is 103,024,176 bytes; it still fails the 100,000,000-byte memory goal. This is persistence and input-handler evidence, not visible editing FPS acceptance.

The fragment-lookup scroll candidate reached 103,925,176 combined physical bytes. Its planned long recording was stopped after 118.31 seconds because the active peak had already failed the target; the early-stop reason is retained beside the recording. It is not a 600-second idle acceptance result. The accessibility change requires a new frozen executable and unchanged-workload recording before attributing any application saving.

The accessibility candidate completes the same unprofiled scroll sequence at 105,006,544 bytes of combined physical peak. Active scroll allocation is approximately 215.9 MB/s and promotion is 44.8 MB/s; accessibility p95 is 5.21 ms, compared with 7.04 ms in the solid-band baseline. The local allocation and phase improvements have not reduced the physical peak.

The shell environment for these cohorts includes `MallocNanoZone=0`, recorded in their provenance. Therefore their renderer default is tested under that allocator override, not an entirely unmodified macOS launch environment. A separate same-executable control removes that setting only for the GUI after launching the unchanged worker. Prior results retain their original configuration and remain valid comparisons within it. The control is not yet evidence that allocator selection explains the remaining physical memory.


## Native allocation ownership and startup reclamation policy

A native malloc-stack recording at 24 seconds captures the same full-size scroll path. Its inverted graph attributes approximately 24.5 MiB of mapped storage to OCaml shared-heap pools, 3.83 MiB of malloc payload to large OCaml allocations, 2 MiB to the nursery, 2.02 MiB to compiled frame descriptors, and 1.80 MiB to runtime generic tables. The generic tables include custom-block and ephemeron tracking. IOSurface snapshots account for approximately 5.33 MiB in that capture. These are rounded, inclusive tool estimates with profiling overhead, not an unprofiled physical-memory decomposition; managed heap categories overlap native VM/malloc categories. The `heap` tool cannot inspect writable object contents because the signed app is not debuggable, but malloc stack history and VM mapping succeed.

The same signed executable and unchanged worker completed two unprofiled 85-second controls. With the GUI allocator environment unset, combined physical peak is 103,974,304 bytes; with only `MallocSpaceEfficient=1` added for the GUI, peak is 84,788,640 bytes. GUI lifetime physical peaks are 78,201,768 and 60,244,904 bytes. RSS peaks remain 197,017,600 and 195,411,968 bytes. Scroll allocation and promotion remain about 216 MB/s and 45 MB/s, and the sampled phase distributions show no material timing improvement. The observed saving is physical backing reclamation, not reduced object allocation or a demonstrated RSS saving.

Apple's [allocator implementation](https://github.com/apple-oss-distributions/libmalloc/blob/c49dafa25f1efe8607701ae6014a663ad2ee437f/src/malloc.c#L1738-L1759) enables aggressive reclamation and disables its large-allocation cache under this policy. A real LaunchServices probe shows that the policy is absent from the original bundle startup and is present after adding its `LSEnvironment` entry. The failing and passing probe outputs are retained. The checked-in macOS `Info.plist` now declares the policy before runtime initialization. This uses bundle metadata rather than re-executing the app, mutating allocator internals, or adding periodic compaction.

The signed release artifact includes this exact metadata, the current native host, unchanged worker bytes, the tested native libraries, and fonts. The longer recording launches both processes with the bundle-declared environment, matching inherited worker startup. No renderer or raster-worker override is supplied. The launch probe verifies actual bundle-policy application; SDL input replay remains separate from visible OS-input/FPS acceptance. Completion still requires the full action sequence followed by at least 600 seconds of idle and fresh editing/persistence verification under the packaged policy.


## Packaged release long-run result

The packaged default configuration completed 671.60 seconds, including all 602 pointer movements and 2,400 wheel events, followed by a 603.587-second quiet window with zero events and zero layouts. Combined GUI/worker physical peak is 80,905,536 bytes and the final sample is 78,300,480 bytes. GUI lifetime physical peak is 60,654,480 bytes. Combined RSS peaks at 194,707,456 bytes and finishes at 143,884,288 bytes. The complete external recording includes startup. Both processes inherit the bundle-declared reclamation policy, and the bundled worker bytes match the frozen worker used in the prior controls.

Quiet heap capacity changes from 25,258,048 to 25,876,160 bytes; the last GC live observation changes from 12,005,488 to 11,699,888 bytes. There is no accumulating live-data signal in this interval. Allocation remains 651,305 bytes/s and minor GC remains 0.308/s, so the existing idle acceptance gate still fails. Its limits have not been weakened. Every sampled window is occluded, so this recording cannot certify visible interaction or FPS.

The packaged Enter recording completes all 50 Enter presses and 200 Unicode commits (431 bytes) without a crash. A pre-Enter boundary contains 792 blocks; after exit there are 842. Reopening the worker confirms the same total, exactly one matching typed title, and that its block is the last of 51 siblings. Combined physical peak is 76,088,808 bytes. Combined RSS reaches 204,341,248 bytes; this exceeds the RSS protection threshold and is retained explicitly under the previously authorized physical-only diagnostic guard. No RSS reduction claim is made.

A separate LaunchServices run starts the bundle with no caller allocator, renderer, raster-worker, or worker-binary override. The application spawns its own bundled worker; its parent PID matches the GUI. Both processes report `MallocSpaceEfficient=1` from bundle startup/inheritance. Reopening preserves the graph. However, this run is constrained to 576x964 points / 1152x1928 pixels and still reports an occluded window. Its 62,735,704-byte combined physical peak is excluded from full-size acceptance. Window screenshots are available, but they do not establish on-screen visibility.

The profiling report now checks the 100,000,000-byte physical bound against simultaneous GUI/worker samples across the complete recording. New regressions fail before the check and pass afterward, covering a startup overshoot, a worker contribution that crosses the limit, exact decimal-byte boundaries, and non-simultaneous individual process peaks. All 23 profiling-runner/report tests and 30 native acceptance-validator tests pass. The physical sub-gate passes for the full-size packaged replay; overall idle, visible-window, and presentation acceptance remain incomplete.

## Quiet metrics refresh suffix sharing

The packaged long recording's quiet phase counters contain 2,352 overlay renders over 603.587 seconds, with no new event, layout, scene-build, or accessibility work. The open diagnostic panel therefore remains an allocation source even with unchanged application patches. A fresh allocation-volume recording samples seconds 65-85 after the complete scroll sequence, without forced collections. Its estimated allocation is 12.56 MB. These samples attribute volume only; their surviving-byte column is not valid live-memory evidence.

Overlay cache misses previously copied the glyph prefix, copied it again to preserve unchanged glyph identities, and appended it to the scene body. Prefix extraction and identity reuse now share a single traversal and retain an unchanged immutable suffix directly. An empty body also uses that prefix directly. The cache still owns only its overlay fragment, and changed body lengths retain the existing operation-index relocation behavior.

A 1,000-glyph sampling regression first fails at 72,137 allocated bytes/update. It passes at 169 bytes/update with an empty body and 24,169 bytes/update with a body, under fixed 4 KiB and 32 KiB limits. It also verifies glyph order, body replacement without reshaping, and rejection of a draw that discards the body. Existing glyph-identity, changing/empty-body index tests, and the full UI release test aliases pass. The paired allocation-volume sample estimates 9.60 MB, approximately 24% less; profiled allocation and timing are not an unprofiled physical-memory result. Panel refresh cadence and memory acceptance limits remain unchanged.

The unprofiled rebuilt release completes the same 602 pointer movements and 2,400 wheel events, then 603.544 seconds with zero events and layouts. Combined physical peak is 79,594,816 bytes, with 73,614,656 bytes at the end. RSS peaks at 195,559,424 bytes and ends at 193,314,816 bytes; this change does not establish an RSS saving. Quiet allocation is 585,449 bytes/s, approximately 10% below the preceding 651,305-byte/s long recording, and minor GC is 0.277/s. Both still fail the unchanged idle limits. Heap capacity changes from 25,307,488 to 26,434,888 bytes, and the last GC live observation from 11,962,584 to 12,060,968 bytes. The small physical-peak difference is not attributed to glyph suffix reuse. Every sampled window remains occluded, so visible-window and frame-rate acceptance remain outstanding.

The same rebuilt artifact also completes 50 Enter presses and 200 Unicode commits without crashing. The count changes from 792 before input to 842 after exit; reopening the bundled worker verifies exactly one matching typed title and that its block is the last of 51 siblings. Combined physical peak is 76,514,720 bytes and RSS peak is 194,838,528 bytes. This confirms input-handler and persistence behavior for the new artifact, without certifying visible editing FPS.

## Resident-memory ownership and shared raster snapshots

A fresh default-release mapping after the full scroll sequence reports 56.6 MB of GUI physical footprint. Its largest charged categories are 28.5 MB of VM_ALLOCATE, 12.0 MB of small malloc regions, 3.9 MB of IOSurfaces, and 2.8 MB of owned unmapped memory. VM_ALLOCATE overlaps the managed heap and must not be added to the OCaml heap counter. The same mapping reports 16.7 MB of reclaimable pages and 33.7 MB of clean pages. The worker has 18.9 MB of physical footprint. Native mapping tools are diagnostic, not a new unprofiled timing or peak baseline.

A second run reads `TASK_VM_INFO` inside each process at 65 seconds, with one extra diagnostic thread per process. The GUI's 154,517,504 resident bytes equal 53,280,768 internal bytes plus 84,099,072 external bytes plus 17,137,664 reusable bytes exactly; its physical footprint is 54,117,288 bytes. The worker's 37,634,048 resident bytes equal 19,136,512 internal bytes plus 11,993,088 external bytes plus 6,504,448 reusable bytes exactly; its physical footprint is 19,448,240 bytes. Both snapshots succeed, contain no compressed memory, and match the external process counters. This identifies the resident-accounting difference without attributing all RSS to retained application allocations. Apple's [memory profiling guidance](https://developer.apple.com/videos/play/wwdc2022/10106/) distinguishes resident clean pages from charged footprint, and its [task-info implementation](https://github.com/apple-oss-distributions/xnu/blob/main/osfmk/kern/task.c) reads these categories from separate kernel ledgers.

The idle allocation stacks also identify repeated glyph-array construction in raster bounds, difference detection, snapshot retention, and tile drawing. Those stages now share one immutable current-frame snapshot. Mutable effect parameter arrays remain defensively copied for the previous frame. The existing 1,000-glyph/changed-panel regression fails at 25,137 bytes/update under a tightened 16 KiB limit and passes at 8,913 bytes/update. A new pixel comparison mutates the same scene's operation and glyph lists, changes glyph count through empty and nonempty states, crosses band boundaries, and updates atlas pixels. It matches a full redraw throughout. All 43 raster tests and the full LUI release test aliases pass, including effects, image/atlas updates, resize, parallel uploads, and renderer parity. The rebuilt Logseq UI release aliases also pass. These local savings alone do not establish an application physical-memory saving.

The rebuilt snapshot release completes all 602 pointer and 2,400 wheel events, then 602.880 quiet seconds without events or layouts. Combined GUI/worker physical peak is 79,496,536 bytes and final footprint is 72,729,944 bytes. RSS peaks at 195,280,896 bytes and finishes at 192,282,624 bytes. Quiet allocation falls from the preceding 585,449 bytes/s to 524,551 bytes/s; minor GC is 0.255/s. Both still fail the unchanged idle limits. Heap capacity changes from 24,426,368 to 25,291,744 bytes and the last GC live observation from 11,258,528 to 11,766,088 bytes. The small physical-peak variation is not attributed to this snapshot change. The window remains occluded throughout, so this recording cannot establish visible memory or FPS acceptance. One earlier launch failed to replace a read-only packaged executable and ran the old binary; it was terminated and explicitly excluded. The restarted recording verifies a different GUI hash with unchanged worker and bundle metadata before launch.

The same snapshot artifact completes 50 Enter presses and 200 Unicode commits (431 bytes), changing the block count from 792 to 842. Reopening verifies exactly one matching typed block and that it remains the last of 51 siblings. Combined physical peak is 81,577,376 bytes, above the previous input cohort's 76,514,720 bytes but within 100 MB. RSS peaks at 193,757,184 bytes. This provides fresh input and persistence evidence, without claiming a physical-memory improvement or visible editing FPS.

## Metrics sampling without duplicate glyph ownership

A new current-release allocation-volume sample after the complete scroll sequence estimates 10.16 MB over seconds 65-85. Its largest individual stack is overlay sealing; other stacks show a second complete metrics glyph cache appending fragments already owned by individual label caches. The complete renderer overlay also has its own scene/key cache. This nested metrics glyph cache is redundant, but removing it alone would resample numerical labels on every active body repaint instead of preserving their existing cadence.

The host now retains only one formatted panel sample per sampling interval and FPS reading, while individual label fragments and the complete renderer overlay retain their existing responsibilities. The intermediate complete metrics glyph cache is removed. Closing or reopening the panel invalidates the sampled values; builder exceptions propagate and do not cache a failed sample. Tests cover interval and FPS refresh, same-interval reopening, closed-panel rejection, exception retry, and collection of superseded sample lists. The uncached sampling regression fails at 904 bytes/read and repeated builder calls; the final utility uses zero bytes/read and one builder call for 1,000 repeated reads. Full UI release test aliases pass. No displayed strings, renderer choice, viewport, or panel refresh cadence are changed.

The paired new allocation-volume sample estimates 7.68 MB, approximately 24% below 10.16 MB. Both recordings use sampling without forced collections, and their surviving-byte estimates are invalid. These are attribution diagnostics, not unprofiled physical-memory or presentation results.

The first extended sampling candidate completes 670.91 seconds and the complete pointer/scroll workload. Its 603.741-second post-scroll interval allocates 449,402 bytes/s with 0.219 minor collections/s. However, that interval includes two unclassified SDL events at approximately 393 and 395 seconds, plus the scripted Quit at the end. Neither unclassified event triggers mailbox, patch, layout, or accessibility work. This is a low-activity diagnostic and fails the pure-idle event criterion; its result is retained rather than reported as idle acceptance. Sampled combined physical peak is 80,004,440 bytes, final footprint is 78,513,496 bytes, and RSS peaks at 195,133,440 bytes. Last-GC live memory changes from 11,810,240 to 11,701,440 bytes, while heap capacity changes from 24,818,568 to 25,865,920 bytes.

At approximately 667.5 seconds, `RUSAGE_INFO_V4` reports GUI and worker lifetime physical peaks of 60,064,656 and 20,857,288 bytes. Their 80,921,944-byte sum is a conservative bound through the observation, not a simultaneous peak. The GUI value matches its final exported lifetime peak. A repeat recording retains SDL system notifications and logs their categories, uses the same input sequence with no scripted Quit, exits through the existing replay deadline, and samples both processes' OS lifetime peaks throughout. Event and idle allocation limits remain unchanged.

The repeat completes all 602 pointer movements and 2,400 wheel events, followed by 613.558 seconds with zero SDL events and zero layouts. Combined sampled physical peak is 83,428,720 bytes and final footprint is 81,806,704 bytes. The GUI and worker OS lifetime peaks sum to a conservative 83,953,008-byte upper bound. RSS peaks at 201,474,048 bytes and finishes at 156,745,728 bytes; the physical-only diagnostic guard and its RSS override remain explicit. Allocation is 446,656 bytes/s and minor GC is 0.214/s, still failing the unchanged idle limits. Heap capacity changes from 26,892,712 to 28,260,960 bytes and last-GC live memory from 15,462,736 to 16,209,208 bytes. This establishes a pure no-event observation, not passing idle allocation or visible presentation.

The candidate also completes 50 Enter presses and 200 Unicode commits. Reopening confirms the 792-to-842 block-count change, exactly one matching title, and the last-sibling position. Sampled physical peak is 80,201,168 bytes; the conservative sum of OS lifetime peaks is 80,479,696 bytes. RSS peaks at 188,792,832 bytes.

After the console unlocks, a separate normal bundle launch uses its own resource worker and no replay, fixed-size flag, or input-injection library. Its 174 exported snapshots all report an occluded window. AX Raise, selecting the main window from the native Window menu, and entering full screen produce black window captures; only one layout occurs during the full-screen transition. Observed dimensions include an initial 461x964-point window and an unstable full-screen transition. This run is excluded from memory acceptance. The test GUI and its owned worker are closed afterward. A working visible normal launch and stable full-size viewport remain unverified, independently of the passing replay physical-memory sub-gate.

## Normal retained-backing startup

A minimal standard AppKit window reproduces the host environment's occlusion report: 62 observations return raw state 8192, with the window visible and on the active space, while its ordinary text control renders into window captures. The SDK defines the actual visible bit as `1 << 1`; changing that constant would falsify visibility. The running window manager also tiles newly launched windows, explaining the initial narrow geometry. A second launch through Finder reproduces the condition.

The custom host incorrectly gated retained Cocoa backing updates on onscreen visibility, preventing even initial layout and content generation. The normal repaint policy now permits dirty retained backing updates while occluded. Direct onscreen renderers preserve their existing visibility gate, and unchanged backing content does not repaint. A real host fixture fails with zero renders before the change and passes initial paint, unchanged-frame, and changed-pixel checks afterward. Focused interaction tests and the complete UI release build/test aliases pass.

The new normal bundle launch uses its own resource worker, default Cocoa rendering, no replay, no fixed-size override, and no injected SDL input. Entering full screen produces a 2305x965-point, 4610x1930-pixel backing capture containing the actual page and header. Search opens, Return navigates to the selected page, and native input counters record 50 further Enter presses and 200 typed characters without a process crash. This is additional normal-input evidence, not persistence or presented-FPS acceptance. The system still reports `window_visible=false`, and the accessibility tree exposes no application controls; visible presentation remains unverified. Changing cohort launch metadata requires re-signing the executable, so signature-free diagnostic copies are compared: both have SHA-256 `22b07157eddcc611b4300493d1c4655f1fb0355dcb9688ca8540806e228988c2`. The worker and tracked runtime source hashes match the frozen candidate.

## Normal-launch peak and retained band colors

The retained-backing normal launch completes 620.880 seconds with zero input events and zero layouts at 2305x965 points. Combined sampled physical peak is 97,912,200 bytes; the conservative sum of the two OS lifetime peaks is 102,827,400 bytes, so the 100 MB peak bound fails. Final footprint is 89,802,144 bytes. RSS peaks at 200,114,176 bytes. Allocation remains 405,872 bytes/s with 0.187 minor collections/s, failing both idle limits. The viewport stays stable, but all visibility samples remain false. Later mapping and search diagnostics are excluded from this unprofiled interval. Search increases the GUI IOSurface mapping from approximately 5.8 MiB to 13.4 MiB; its later instrumented GUI lifetime peak is 89,883,608 bytes. This identifies a candidate owner, not a causal application-level before/after result.

The software presenter previously used one background color for all three solid spans around two immutable images. A modal interior with a different color therefore became image data. Each solid span now owns its own color, with the same five layer slots and aligned-storage cost check. Tests cover distinct backgrounds, translucent premultiplied pixels, short final bands, dense vertical stripes, sparse content, immutable resource reuse, and replacement. Retained byte readback and actual Core Animation composition both match the input exactly. The new fixture fails at 475,136-786,432 image bytes before the change; afterward flat backgrounds use zero image bytes and textured cases use 81,920 bytes.

The candidate's normal 1440x900-point launch records 226 ASCII commits, 50 additional Enter presses, scrolling, the metrics panel, and repeated search opens. Typing precedes the Enter burst; this does not establish typing immediately after a long burst. Unprofiled combined sampled peak is 101,352,816 bytes, and the conservative per-process peak sum is 105,629,040 bytes. These still fail the 100 MB requirement. All candidate visibility samples in that active interval are false. Later debugger and mapping observations are explicitly excluded from the unprofiled peak recording. A separate visible run with additional actual user input reaches 117,851,552 sampled combined physical bytes and a 120,178,080-byte peak bound; its action sequence differs and it cannot be used as a matched comparison.

A debugger export reconstructs the candidate's entire 2880x1800 backing from its actual colors and image bytes. Retained IOSurface ownership totals 9,601,024 bytes. A cost model, verified against every captured stride and allocation, exactly reproduces this total with 128-byte row alignment and 16 KiB allocation pages. An extra internal gap predicts only 557,056 bytes saved. Fixed 16-row bands predict 2,457,600 bytes saved while increasing layer count; smaller eight-row bands increase storage. Horizontal grid candidates also save less. None of these additional partition changes is implemented without sufficient end-to-end benefit. The next investigation targets the larger retained managed and malloc objects after editing.

## Expose and mailbox runtime lock ordering

A normal visible native run stops exporting metrics and becomes unresponsive. A two-second native thread sample shows the main thread inside an SDL expose watcher, yielding the OCaml runtime during repaint while retaining SDL's watcher mutex. The worker holds the runtime and blocks in SDL_PushEvent waiting for that mutex. The notifier now releases the OCaml runtime around SDL_PushEvent and reacquires it before accessing runtime values or raising errors. No paint callback or event delivery is removed.

A subprocess regression drives 20 expose callbacks that yield while another OCaml thread sends real SDL mailbox notifications. Before the fix it reaches the five-second deadlock timeout; afterward it completes and preserves all callbacks. The complete UI release build and test aliases pass, including the new lock regression, band pixel/ownership tests, input delivery, menu runtime boundaries, live resize, and lifecycle checks. Earlier incomplete runs and their sampler failures are retained and excluded. A later 20-second no-input interval has zero events, layouts, and renders with approximately 13 KB/s allocation; high observed allocation occurs during editing rather than a proven idle expose loop.


## Resolved measurement generations and bootstrap sampling

The live allocation capture identifies flex measurement state as the largest managed allocation origin after interaction. A public-API regression creates 2,048 measured percentage-width leaves, changes their owner width twelve times, restores the initial width, and collects twice. Before the fix, unreachable offer generations retain 5,898,240 additional bytes. A separate fixed-offer regression changes percentage padding against its owner and incorrectly reuses height 44 instead of 48; percentage borders reproduce the same invalidation defect.

LUI commit `0e3d9517b6831787ffe68d0f29e8e4507c6f1349` clears old offer entries, natural measurements, the measurement ring, and the final layout cache whenever resolved edges change. Dirty-node invalidation uses the same helper. The unchanged regression retains zero additional bytes, produces height 48, and preserves reuse when owner dimensions remain unchanged. All 39 flex tests, the complete LUI release build/test/install aliases, and the native application's complete release build/test aliases pass. This is an isolated retained-memory saving, not a proven application-level peak reduction.

A normally launched old-LUI cohort records 226 typed ASCII characters, 50 additional Enter events, scrolling, twelve metrics split cycles, and repeated search opens. Its sampled combined GUI/worker physical peak is 116,786,616 bytes and its conservative per-process lifetime peak sum is 117,212,600 bytes. Final combined footprint is 94,356,896 bytes. A new-LUI cohort also records 226 typed characters and 50 additional Enter events, but changes viewport and navigates to Journals during the observation. Its sampled physical peak is 130,729,400 bytes and its lifetime bound is 132,859,320 bytes. Final footprint is 115,721,656 bytes, comprising GUI 89,146,328 and worker 26,575,328 bytes. These sequences and viewports do not match, so their difference is not a causal before/after result. Both fail the 100 MB peak requirement; neither establishes the required full-size visible workload and 600-second pure-idle acceptance.

The allocation sampler previously started only after native application initialization and creation of its bootstrap domain. Even zero-delay captures omitted initialization itself. Stack frames for later `initialize_unlocked` callback closures must not be counted as evidence of initialization coverage. The old real bundle capture contains zero exact initialization frames. Zero-delay, untriggered profiles now begin before spawning the bootstrap domain, which inherits the active profile. Delayed and file-triggered captures retain their main-loop timing. Shared allocation/deallocation counters are protected because inherited domain callbacks can run concurrently, and process exit exports an unfinished capture.

The rebuilt normal bundle records 14 exact initialization frames, including the bootstrap domain. All sampled live counts remain between zero and their allocation counts. At the configured eight-second diagnostic stop, two full collections leave an estimated 17,520,000 sampled live bytes: flex 3,200,000; native DOM snapshots 2,800,000; signals 2,000,000; and byte buffers 2,880,000, including glyph atlases and a raster tile. These are sampling estimates and allocation origins, not retaining paths or an additive physical-footprint decomposition. Static module initialization before the executable's main entry is still outside this capture. Profiler bookkeeping and forced collections exclude this run from memory and latency acceptance. The complete UI release build and test aliases pass after the profiling change. Normal release physical-memory acceptance remains incomplete.
