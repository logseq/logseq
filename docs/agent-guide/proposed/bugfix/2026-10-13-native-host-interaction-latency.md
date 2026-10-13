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
