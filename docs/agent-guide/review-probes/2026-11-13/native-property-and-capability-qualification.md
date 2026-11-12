# Native property and capability qualification

Date: 2026-11-13

Application source checkpoint: `71cd1d746e67d7cd992036d447fe756418bb6b6b`.
LUI: `961107c7c071b04551587b39cc7cdd16f738c07a`.
NSH: `adc186db7213f3ccd1eacaa836cc721e9779fd14`.
The comparison baseline remains master
`29fd2edd015e12963742b985ce6d2311c074e09b`; only Graph View is excluded.

## Property ownership and persisted operations

Scalar editors keep one existing active-editor owner. A refresh of an unrelated
property preserves its dirty buffer and native field identity. An authoritative
source change resets that buffer. String Escape cancels its owned draft before
blur; number Escape retains the existing blur-commit behavior. Multiple property
removals use one captured-graph batch operation, wait for the owned refresh and
then close only that dialog. Choice activation clears the existing query state
before invoking application callbacks, retiring stale search results.

The new regression exposed a graph ownership defect in production: route
identity omitted the graph, property areas were cached by UUID alone, and queued
block reads selected their graph at flush time. The repair includes the graph in
route identity, scopes areas to graph and application, captures each refresh
owner, and batches queued reads by their originating graph. It retains existing
worker deduplication and does not fence valid same-graph sidebar work using a
global navigation revision. Public behavior and migration examples are recorded
in `docs/api-migrations.md`.

## Executed evidence

- The complete native OCaml/FFI preparation suite passed at
  `e6c0d7bdc47c000ba8c603e6621468c9b4808d84` with the same production property
  code as this checkpoint. It mounts the real `Page.region`, applies a real
  `Boot_graph_ready` transition with unchanged route/page/UUID, holds genuinely
  distinct overlapping worker batches and checks old refresh/response/close
  callbacks. It also retains the pre-existing editor, worker, timer, clipboard,
  asset and preparation regressions. Evidence:
  `/tmp/logseq-properties-graph-owned-final-ffi.log`.
- A fixture-owned settings signal initially escaped the new page fixture and
  triggered the existing cross-scheduler type guard in a later test. The test
  now saves and restores that cell in its existing cleanup. No production
  scheduler fallback or weakened guard was added.
- The full release publisher passed at the checkpoint above:
  `/tmp/logseq-graph-owned-release-build.log`. Both Rust and OCaml use release
  profiles. Its actual provider validated 1,908 encoded sites in two themes;
  six scoped-variable checks remain runtime checks. The real application
  startup test with private resources and DB worker passed in 16.95 seconds.
- The published artifact receipt passes the source freshness check. Executable
  SHA-256: `b09c787bbe2a90d61534f6253f532214dfb1c30476696f5036d7c34e426a9a69`.
  OCaml library SHA-256:
  `8f8f546b972a1d16f191eabd122c0327fbf44a26d4b510d87abe6e88972b4512`.
- The complete native DB worker suite passed **988 tests with no skips**, with
  `DB_WORKER_INTEGRATION_TESTS=1` and the original `logseq/docs` v0.10.12 fixture
  pinned to `cf0a9e3c1ae8f583dbe46b8732720387f6b0eee1`. This includes the optional
  generated-import fuzz, docs import and 45,000-line import cases. Evidence:
  `/tmp/logseq-current-full-worker-native-integration-tests.log`, at test-only
  checkpoint `dc9fc89a40`. The fixture checkout stays outside the repository.
  Three outdated tests initially expected the plaintext KV fallback removed by
  existing base commit `905af86be7`; they now require the existing missing-host
  rejection and verify that CLI flags cannot create or alter plaintext KV
  credentials. Runtime and specification files were not changed.

## Capability capture repair and remaining gates

The original actual-target capability run passed 28 of 29 tests. The failing
combination was an aliased `Lui_elements` constructor, dynamic text and a known
optional callback. The compiler retained `Input.t` as its result path while the
extractor compared only `Lui_elements.t`, omitting the entire site. The repair
reuses compiler-identity module alias normalization for the result type as well
as the call head. Callbacks remain inert; unknown values stay deferred. Nested
aliases and local shadowing have separate positive/negative regressions.

The revised actual-target capability suite passed **all 32 tests** against the
published release artifact, including the unchanged originally failing case,
nested aliases, local shadowing and other-backend positive cases. Evidence:
`/tmp/logseq-target-capabilities-static-tests-release.log`. The prior negative
run remains historical evidence rather than a current failure.

The complete Web/shared run then passed **16,367 checks**, with no failures or
expected failures, plus all 15 stylesheet-scope tests and the contract suites:
`/tmp/logseq-graph-owned-ui-tests-fixed.log`. Earlier Web failures expected the now-forbidden
enqueue-origin retargeting and have been replaced by origin/destination response
assertions. A failed interim target run had inconsistent cached native/shared
OCaml implementation digests after a profile switch; the successful release
publisher rebuilt those archives before the next qualification.

## Current standalone release memory

The private session launched the actual Rust-only published release executable,
not the TSX native test driver. Its receipt was verified before private HOME,
storage and credentials were selected. No compiler, screenshot, forced GC or
other qualification ran concurrently. Samples use `vmmap -summary` physical
footprint, not virtual address space or RSS. Each process and worker listener
was checked against the exact private process group/root. Cleanup completed
without errors and did not stop the installed user app.

| Phase | Frontend footprint | Frontend lifetime peak | DB worker footprint | Mounted picker cells |
| --- | --- | --- | --- | --- |
| About ten seconds after launch | 95.5 MiB | 95.7 MiB | 39.8 MiB | Closed |
| Full Emojis, first visit | 118.9 MiB | 119.0 MiB | 39.8 MiB | 135 of 1,870 |
| Full Icons, first visit | 126.8 MiB | 127.1 MiB | 39.8 MiB | 135 of 6,200 |
| Full Emojis, second visit | 126.6 MiB | 129.2 MiB | 39.9 MiB | 135 of 1,870 |
| Full Icons, second visit | 127.8 MiB | 129.2 MiB | 39.9 MiB | 135 of 6,200 |

The two process footprints sum to approximately 135.3 MiB at baseline and
167.7 MiB at the last sample. This is an explicitly labeled sum of independently
sampled physical footprints; it is not a simultaneous, de-duplicated system
memory measurement. The frontend major-heap capacity at baseline was 6,385,160
bytes and ranged from 6,247,576 to 10,262,232 bytes during picker visits.
The worker's baseline major-heap capacity was 9,763,936 bytes. Each process's
current-domain minor-heap limit was 16,777,216 bytes. Capacity/limit values are
not live OCaml object bytes and must not be added to physical footprint.

Evidence: `/tmp/logseq-current-release-picker-memory.log` and ignored
`deps/ui/_build/nsh-picker-final-memory/final-release-2vme70n3/`, including
source/artifact hashes, verified receipt, raw per-process vmmap output, worker
health/GC data, canonical tree, five measurements and successful cleanup.
This short default-graph tab-switch run does not qualify a long-lived populated
graph, scrolling at dataset boundaries or absence of every memory leak.

No installed user application was replaced or stopped. These checks do not
establish complete native UX, physical drag/IME, accessibility, cross-platform
PDF, signing, installed updates or completion of the desktop migration.

## Actual AppKit property interactions

The native harnesses use the pinned NSH CLI and actual application Rust module
with the published release OCaml library, resources and DB worker. The CLI's
development test host is used for native input delivery; these interaction
runs are distinct from the standalone release memory sample above. They use
private seeded graphs and inspect persisted worker state after native actions.

| Scenario | Result | Evidence |
| --- | --- | --- |
| Number: replace 137 with 246, Escape | Passed: editor closed and worker stored 246; block order/titles unchanged | `/tmp/logseq-current-release-property-scalar.log` |
| String: replace original text, Escape, reopen | Passed: edited text was not saved; reopened native field showed the original source | Same scalar log |
| Unrelated checkbox refresh while a scalar draft is dirty | Passed: real native-controller activation persisted `true`, advanced the application generation and preserved field identity/buffer; the next native `z` reached that same field without a focus helper; Escape retained the original stored string | `/tmp/logseq-current-release-property-dirty-refresh-fixed.log` |
| Two selected block owners: remove one property, then one native Mod-Z | Passed: both values were removed and a single undo restored their two distinct original values | `/tmp/logseq-current-release-property-batch-remove.log` |
| Actual block editing, nonediting selection, current-hit drop and outside cancellation | Passed with persisted final order; Alt reference-drop is explicitly unqualified | `/tmp/logseq-current-release-block-all.log` |
| Actual CmdK focus, seeded result navigation, cancellation and clean reopen | Passed; cancellation retained the same editor/draft, continued native typing appended `z`, and later search selected the persisted target | `/tmp/logseq-current-release-cmdk.log` |

The refresh test's first run failed before editing because its observer required
an attribute present on panel rows but absent on the actual bottom-property
pills. The corrected observer identifies that existing production wrapper by
the exact seeded property key and label, then requires exactly one real
unchecked Checkbox and a handled native-controller reply. It performs no direct
worker writes after setup. This qualifies controller-triggered refresh with
native keyboard continuation, not physical pointer focus behavior.

## Stronger picker geometry gate: initial finding

A new actual AppKit end-of-list probe checks visible native geometry as well as
bounded materialization. Its first run found negative `native-bounds` coordinates
for the last icon although the LUI CLI own-window screenshot clearly paints that
icon at the bottom of the picker. The existing diagnostic uses bare
`NSView.convertRect`, which omits NSH's layer transforms; the SDK's own native
test driver accounts for them. No production virtualization repair is justified
by that diagnostic failure alone. The updated qualification below supersedes
this initial diagnostic finding; the negative evidence remains recorded here.

Evidence: `/tmp/logseq-native-picker-state-geometry-capture.log` and private
`logseq-picker-wheel.XWSy4H/failed-target-native.json`, canonical tree and
`failed-target.png`. The screenshot was captured through the existing LUI CLI
against this exact owned test listener. Its `--unchecked` flag identifies the
test-driver receipt limitation; it is not independent build-freshness evidence.

## Many-choice input: initial finding

The new actual AppKit many-value chooser case seeded real Alpha/Beta/Gamma
closed-value entities and initially selected Gamma. Native typing `al` filtered
to Alpha; Enter correctly persisted Alpha alongside Gamma and cleared the query,
while retaining the canonical input ID. However, an immediately following native
`b` did not enter that input. The current NSH single-line projection inherits
`BlurAndSubmit`, unlike the existing Web/Apple submit path which emits without
unconditionally blurring. The proposed correction uses the SDK's existing
focus-preserving `Submit` behavior, with no new LUI argument or wire property.
The successful Enter/pointer qualification below supersedes this initial failure.
Evidence: `/tmp/logseq-native-property-many-enter-authored.log`.

## Updated release and native qualification

Application source checkpoint: `d68e2e0abcb4d8def0168908681ec1a6f65e9e80`.
Its four dependency pins select published LUI
`b73fc438e44c58209b8729470bb6c9d3e0989dad`; NSH remains unchanged.
The older memory table above belongs to its explicitly stated `71cd1d746e`
checkpoint and has not been remeasured for this newer application source.

- The release publisher passed, including 1,909 encoded style sites in both
  themes and real private application startup in 16.95 seconds:
  `/tmp/logseq-picker-paint-date-table-release-build.log`.
- The full shared/Web suite passed 16,427 checks without failures, plus all 15
  stylesheet-scope tests and contract suites:
  `/tmp/logseq-picker-color-date-table-calendar-ui-tests-events.log`.
- The complete real native OCaml/FFI suite passed, retaining graph-owned
  property, editor, clipboard, assets and update races:
  `/tmp/logseq-current-date-table-native-ffi.log`.
- LUI's existing public `SubmitBehavior::Submit` now preserves the native
  single-line input focus after submit. Both real many-choice Enter and pointer
  cases passed: selecting Alpha clears the query, immediately typing `b`
  reaches the same retained input without a focus helper, and selecting Beta
  persists all three values. Evidence:
  `/tmp/logseq-native-property-many-enter-focus-fixed.log` and
  `/tmp/logseq-native-property-many-pointer-focus-fixed.log`.
- The corrected native-bounds diagnostic accounts for existing CALayer
  transforms. Its own real AppKit geometry fixture passed; the previously
  negative last-row coordinates were a diagnostic defect, not proof that the
  renderer failed to paint that row. Source and results are recorded in LUI's
  `input-focus-and-painted-bounds.md`.
- Actual native tab transitions and filtered/empty-result clearing reset the
  result viewport as frozen master does, while retaining the search field.
  Evidence: `/tmp/logseq-native-picker-state-changes-reset-query-fixed.log`
  (tab subcase passed before the later input-fixture failure) and
  `/tmp/logseq-native-picker-filter-reset-native-input.log` (complete filter
  case passed). These are distinct scoped results, not a claim that the former
  combined run passed.
- Actual native far-down color editing passed in 37.9 seconds:
  `/tmp/logseq-native-picker-color-reactive-final.log`. Before and after choosing
  `#5e69d2`, the result Scroll remained 858, source 864, source generation 12,
  sparse indices 674–688, 134 mounted cells and final cell 14641. The last
  `Zzz Off` cell remained at `[548,413,36,36]` inside the actual body viewport;
  its foreground changed from `inherit` to the chosen color. No extra wheel,
  synthetic VirtualWindow or post-change focus operation was used. This uses
  the actual application module and release OCaml library in the native test
  host, not the standalone release memory process. Its private evidence root
  is `logseq-picker-wheel.ninCN4/` under the system temporary directory.

The stronger canonical picker unit case initially failed because its private
services were absent, then because its full real view was created without the
application extension registry. That test remains open pending its corrected
typed initialization and rerun; passing actual native color interaction does
not convert this unit target into a passing result. A separate LUI regression
also investigates source-factory replacement independently of the application's
paint-only color repair. Native table focus/navigation, date-flow interaction,
all-platform packaging, signing and installed updates remain incomplete.
