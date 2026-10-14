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
