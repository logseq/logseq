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
| 1 | Default Metal startup exceeds 200 MB before graph mounting completes, with about 4 MiB of managed heap | Attribute native graphics working memory and drawable lifetimes; quantify the saving before changing ownership |
| 2 | Rapid Enter triggers the memory guard after only a few persisted blocks | Preserve all 50 actions; identify the process and memory category growing during the same input interval |
| 3 | One-Enter diagnostics spend roughly 31-41 ms predominantly executing on the main thread | Attribute CPU samples to application phases; distinguish hash-table/GC work from its callers before optimizing a cache |
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

The current target is 30–100 MB for the native GUI process, measured using
macOS `ri_phys_footprint`, with RSS reported separately. Verify the release
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
