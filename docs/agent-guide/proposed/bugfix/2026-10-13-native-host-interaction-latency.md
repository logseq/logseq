# Native Host Interaction Latency

## Problem

The macOS OCaml/SDL host feels slow across scrolling, typing, and navigation on the existing demo graph. Native sampling shows idle whole-store traversals and allocation, and expensive flex layout during interactions. Metal drawable acquisition and an unbounded command-buffer queue block the input thread. Unbounded flex constraints use NaN, but cache comparisons treated identical unconstrained offers as different. Caret extension updates invalidate layout, and the custom host omitted retained-paint interaction hints.

## Proposal

Profile the actual Metal host on the same graph, add failing native regression coverage for unnecessary repeated work, and remove the confirmed hot-path work at its owner. Preserve input focus, IME, geometry, and startup behavior. Rebuild and reopen the application, then compare the same idle and interaction paths.

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
