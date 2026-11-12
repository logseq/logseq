# NSH continuous UI and UX review

## Scope and evidence rules

Compare the actual NSH desktop application against `https://app.logseq.com/` and
local master source `29fd2edd015e12963742b985ce6d2311c074e09b`. Graph View is excluded.
Review visible chrome first, then editor entry and text interaction, commands,
block selection, drag/drop, and properties. Preserve the user's running window;
use the LUI CLI for native content capture and native controller activation.
Semantic handler invocation alone does not prove native hit testing, hardware
keyboard focus, IME, or visible motion.

Screenshots and generated artifacts stay under ignored build directories. Record
actual revisions and endpoint identity before attributing a fresh screenshot to a
fix. The existing English application-wide acceptance inventory remains in
`docs/agent-guide/proposed/feature/2026-10-09-ui-interaction-parity.md`.

`spec-dev-tool --help` was attempted in this worktree, but the executable is not
installed. This report records implementation and qualification evidence directly.

## Current evidence

- Inspected the previous release native capture at
  `deps/ui/_build/nsh-release/visible-session/journal.png`: open left sidebar,
  Demo graph, active Journals, Favorites/Recent headings and dated Journal title.
  The graph is nearly empty. That historical image does not qualify new fixes or
  editing, menu, hover, animation, or populated outline behavior.
- Opened `https://app.logseq.com/` in an isolated headless Chrome profile with a
  1440x900 CSS viewport and 2x device scale. The page loaded Demo chrome with no
  page errors. Initial captures were taken before usable Journal content appeared;
  they are not accepted as visual parity evidence. Generated files are under
  `deps/ui/_build/nsh-ux-review/` in the main NSH application worktree.
- The previous retained native process has exited. Await the parent's newly built
  release endpoint before fresh native screenshots and interactions.

## Persistent issue queue

| ID | Priority | Surface | Evidence and expected behavior | State |
| --- | --- | --- | --- | --- |
| UX-001 | P1 | Empty and trailing add-block row | `Add_button.el` relied on document clicks without opting into NSH pointer/press events. Master `page.cljs/add-button-inner` activates insertion directly. NSH must route a real native activation through the existing shared append handler, retaining page and container scope. | Source fix prepared; native event regression added; compilation and actual visible app verification pending. |
| UX-002 | P1 | Editor clipboard | The original missing route has been replaced: `extensions/editor.rs` now emits shared copy/cut document events and uses the native PasteEvent payload adapter. | Source and native regression coverage exist; complete native keyboard/context-menu and structured clipboard UX qualification remains open. |
| UX-003 | P1 | Graph and action menus | Current user screenshot reports externally anchored menu popovers rejected by the backend. | Separate menu workstream owns repair and real open-menu regression; visible native recheck pending. |
| UX-004 | P1 | Initial block editing | The legacy global 60ms click filter dropped unrelated NSH clicks. Active-host policy now bypasses it for NSH. | Parent rebuilt release archives and reports compiled native admission passes, including actual shared editor mounting and focus emission. Actual native click/type and raster verification pending. |
| UX-006 | P1 | Bullet activation and outline drag | Bullet activation now preserves its `dot-<uuid>` document target. A newly prepared main-row motion bridge supplies the missing move/cancel route and distinguishes hover from a held button. | Source and focused regressions prepared; compilation, native held-mouse movement, capture and drop qualification remain pending. |
| UX-007 | P2 | Chrome and editor font metrics | Native theme tokens name Inter, but the native runner did not register the bundled faces. Existing Resources/fonts files alone do not affect native shaping. | Runner and real startup qualification now use NSH Root::font for the existing nine faces before first layout. Native raster/metrics verification pending. |
| UX-005 | P2 | Wrapped rich-text caret | Native hit affinity must preserve the side of a soft-wrap boundary. | Separate geometry workstream owns implementation; actual native verification pending. |

## UX-001 implementation

Move the existing NSH pointer/document forwarding helper from `Tree` into
`Ui_parts.native_document_pointer_handlers`, then reuse it for block display
content and add-block rows. This keeps one shared pointerdown/mousedown/pointerup/
click sequence, and retains `Editor_keys` as the single append owner. Add native
hover opacity to reveal a trailing row after existing blocks. No direct duplicate
append callback, second editor engine, new timer, or backend replacement is added.

The compiled native fixture asserts PressEnabled, the ordered document sequence,
and original `.block-add-button`/parent-page target. It does not claim worker
persistence or AppKit hit testing. Required next evidence is a real native empty
Journal click that inserts a block, focuses its editor, accepts typing, and remains
persisted after leaving and revisiting the page.

### Source review of the remaining native drag boundary

This pass used frozen master `29fd2edd015e12963742b985ce6d2311c074e09b`,
especially `block.cljs/block-content-on-pointer-down`, `select-on-hover?` and
bullet drag handlers. It did not operate the installed app or the locked display.
The native target copies `src/blocks/tree.ml` and `src/editor/block_selection.ml`
through `native/dune`, but uses its own stub `native/block_dnd.ml`; the Web
`src/dnd/block_dnd.ml` manager does not provide native fallback behavior.

The prepared bridge installs motion on each `Tree.row_main` Row, whose public
constructor accepts move/cancel callbacks. Content columns and bullet controls
keep their existing press owners. The native admission fixture exercises that
actual row producer for NSH, SwiftUI and Kotlin profiles. The LUI regression
uses real Headless hover; held-button conversion also uses the public native
MouseEvent shape. Neither test proves a held hardware mouse drag across rows.

Two concrete boundaries remain: NSH currently accepts LUI `PointerCapture` but
has no renderer consumer, and `Editor_keys.on_native_pointerup` resolves a drop
target from the release event's target. Native press release can remain attached
to the origin view. The existing NSH public `claim_touches`, `keep_touches` and
responder callbacks provide a capture candidate without a fork, but their
TouchPoint target is the press origin and Scroll negotiation must be respected.
Capture, target resolution and cancellation therefore need their own actual
controller test before drag/drop parity is claimed.

## Production browser baseline

An isolated headless Chrome session reached the current Demo Journal and opened
its left sidebar and search through actual browser controls. The 1440x900 CSS
viewport at 2x scale produced `reference-sidebar.png`, `reference-search.png` and
`reference-measures.json` in the ignored `deps/ui/_build/nsh-ux-review/` folder.
The observed header is 48px high, sidebar including divider is 246px wide,
navigation rows are 32px high with 14px medium Inter text, and the Journal title
uses 36px Inter with 54px line height. The empty-page add row has a real 28px box
and 0.5 resting opacity. Graph View is intentionally excluded when comparing
vertical positions. Native historical chrome is broadly similar; font raster and
the absent empty-page bullet need fresh native verification, not a parity claim.

## UX-008: complete icon picker tabs consume excessive memory and cannot scroll

The user reproduced an immediate increase to approximately 1 GB after switching
to Emojis or Icons. That is user evidence, not an independently sampled release
RSS measurement. Read-only process inspection after this report found no running
installed frontend, so a new coordinated native session is required for RSS and
AppKit screenshots. The remaining worker was left untouched.

The production picker already passes complete datasets to canonical virtual rows,
but its growing body Scroll had an automatic height basis inside a finite 408px
shrink-to-fit popup. This leaves the viewport dependent on the full intrinsic
virtual content extent. The correction sets the body height basis and minimum to
zero while retaining its existing flex growth and single native Scroll owner.
The datasets, item keys, picker choice callbacks and maintained backend behavior
remain unchanged. Native-engine verification must establish whether this correction
fully resolves the observed issue before a runtime or memory fix is claimed.

The required actual-application startup matrix now includes an independent
`icon-picker` child. It opens the production Journal icon action, changes both
tabs, verifies a positive finite native body height and bounded mounted cells,
scrolls the real native Scroll to the complete source's final row, returns to
the first row, reaches the final row again, activates the last item, and waits
for the Journal icon button to appear and the native picker to retire. It does not manually
supply `VirtualWindow` events, truncate generated datasets, or replace the picker
with a test-only view. The earlier recording-host row tests remain useful for
source semantics but do not prove native viewport ownership. The initial release
run exposed independent queue saturation during the complete Emoji Scroll.
After coalescing visible-range feedback, the full release publisher passed its
actual application matrix at application `aa5a29d4b8` and LUI `eee8d3fa`. This
includes both complete tabs, end/first/end native-controller scrolling, bounded
cells, choice-triggered closure and native picker retirement. That earlier gate
checked only the presence of a Journal icon button; it did not establish the
identity of the persisted choice, particularly on the second tab when a button
already existed. The Emoji case
measured a 328pt viewport and 133–135 mounted cells. Reopening after choosing an
emoji also exposed mixed point/element popover placement; the passing candidate
uses mutually exclusive placement branches. This is native-engine evidence,
not hardware wheel-input or raster-performance qualification.

The strengthened source regression captures the exact last mounted source cell's
production identity before activation: the emoji id carried by its native emoji
node, or the icon id carried by its tooltip and the canonical icon reference.
It waits for that exact glyph/reference to render in the Journal icon button,
then reads the private daemon's production `get-latest-journals` response and
checks the persisted icon kind and id. The read client verifies the daemon's
storage root and repository before querying; it performs no graph writes.
The full release publisher passed at application `c65730defa`, LUI `3f1606c0`
and NSH `adc186d`. Both complete tabs passed end/first/end native-controller
scrolling, bounded materialization, exact rendered and persisted icon kind/id
checks, and native picker retirement. The LUI candidate also passed all 262 tests
and strict Clippy; its real Desktop regression confirms that queued agent refusals
cannot strand pending list feedback.

A subsequent isolated AppKit wheel test failed before reaching the picker tabs.
Its default 390pt window exposed a retained `display=contents` to `none` change
in the responsive right-sidebar header wrapper at the 640pt breakpoint. This is
separate from the picker viewport correction and is not a passing wheel result.
The shipping release memory measurements below retain their original candidate
identities; the mixed native test host is not used for release memory claims.

### Release native-window measurements

A separate, nonactivated AppKit window used the release candidate from application
`1bcfa19da4`, LUI `4849e6bf` and NSH
`2635333e4cc0d3be8032c97f3a5e08d3685179c6`. It used a private Demo graph and native
credentials/state, with an initial 10-second idle period. Tab changes used the
host's `native-press` controller operation. A clean process ran the entire tab
sequence without taking screenshots between samples; no collection was forced. The figures
below are the frontend's macOS `vmmap -summary` physical footprint; they exclude
the separate database worker. They are neither virtual address size nor the
sum of mapped shared-library pages.

| State | Physical footprint, MiB | Mounted picker cells | Mounted/source rows | OCaml major heap capacity, bytes |
| --- | ---: | ---: | ---: | ---: |
| Idle before picker | 87.3 | 0 | — | 6,283,040 |
| First Emojis tab | 112.0 | 135 | 15/208 | 10,262,144 |
| First Icons tab | 123.5 | 135 | 15/689 | 7,098,200 |
| Second Emojis tab | 123.5 | 135 | 15/208 | 9,104,152 |
| Second Icons tab | 124.6 | 135 | 15/689 | 6,214,656 |

The current domain's minor-heap **limit** was 16,777,216 bytes throughout. This
limit and the major heap's reserved capacity do not report live object size.
The process peak reached 126.4 MiB during this clean sequence. The four tab
samples establish bounded initial row demand and no
source-sized materialization in this candidate; they do not establish a steady
state memory budget, freedom from leaks over many cycles, or native wheel-scroll
correctness. The original reported 1 GB behavior was not reproduced in this
sequence. The installed application has not been qualified against these bytes.

Evidence is retained under the ignored application directory
`deps/ui/_build/nsh-picker-diagnostic/`: `clean-measurements.json`, per-state
`clean-*-summary.json` and `clean-*-vmmap.txt`, `emojis.png`, `icons.png`, source snapshot
`sources.json` and the actual Cargo compiler-artifact inventory. The directory's
`diagnostic-only.json` explicitly records `qualified: false`; this is not a
successful build publication receipt. Candidate SHA-256 values:

- Host: `dc558885396a4ad7c3c7db0a7892646057c5f87a5aa432d4422a78c088a847af`.
- OCaml library: `2413f5ac358057e95e33e7da0a3d63a0a1b165d43d7d10848f95000a3df055d8`.
- Worker: `c49397ca24df1e96ec7183175088ffab67df5e281be1e260ef7178f2367ea20e`.

The earlier screenshot-producing sequence is retained separately as
`measurements.json` and unprefixed per-state summaries: 95.2 MiB baseline,
119.7 MiB first Emojis, 220.6 MiB first Icons, 221.1 MiB second Emojis and
222.6 MiB second Icons, with a 260.7 MiB peak. That sequence was confounded by
image capture. Its first-Icons `vmmap` contains 90.0 MiB of dirty `Malloc Large
(empty)` pages, absent from the corresponding clean sample. The controlled
repeat therefore attributes most of that apparent 100 MiB tab increment to the
capture sequence's allocator retention, rather than demonstrating an Icons or
SVG-rendering regression. The screenshots remain visual evidence only; memory
comparisons use the clean sequence above.

An earlier foreground diagnostic was affected by concurrent interaction and
remained on All; those samples were excluded from this comparison. Real wheel
input, longer memory runs and light/dark visual finishing checks remain
unqualified. Computer-use verification of the installed candidate was blocked
by the locked macOS session; the app remains open, and no unlock or display-power
action was performed.

The same clean candidate subsequently completed eight Icons open/close samples,
retained in `cycle-measurements.json` and per-cycle ignored evidence. Open
physical footprint increased from 124.5 to 126.0 MiB; closed footprint increased
from 122.4 to 123.8 MiB, with a 126.7 MiB process peak. Each open sample had 135
cells from 15/689 rows, and every closed sample had zero canonical picker nodes,
cells or row lists. No screenshots or forced collections were introduced. This
short run supports bounded initial materialization and canonical retirement; it
does not establish long-term leak freedom or native wheel-scroll correctness.

### Follow-up native input and final release sample

Application `69a6380a17`, LUI `645edbd4` and NSH `adc186d` passed the full
release publisher, including exact persisted final choices and a new geometry
check requiring the Journal icon action to fit inside its virtual cell and list.
The native header also passed resizing through 600, 640, 639 and 1440 points
without changing the retained Journal/main-scroll identities.

The actual AppKit test exposed a second, independent problem: the title toolbar
started about 18 points above its virtual cell. The native Stack clipped its
painting and hit region. Title hover correctly changed opacity to one, but
moving onto the clipped action left the title and hid it again. NSH Journal
pages now reserve the existing 20-point toolbar offset inside each cell, taking
that space from the existing bottom padding. Opposite margins on the list
wrapper retain the title position and total scroll extent. Other backends and
ordinary pages keep their previous layout.

The isolated AppKit test then passed title hover, actual mouse press to open the
picker, both complete tabs, and positive/negative native wheel gestures. The
first source cell retired after scrolling down and returned after scrolling up;
mounted button counts remained bounded. A separate repeat passed with no agent
polling and no screenshots. These are synthetic events delivered through the
private AppKit window, not physical hardware input. The mixed development test
host is not used for release-memory measurements.

A separate Rust-only published release process produced the following clean
sample, with no concurrent compiler/test run, screenshots or forced collection:

| Phase | Frontend physical footprint, MiB | Worker physical footprint, MiB | Approximate combined footprint, MiB | Mounted picker cells |
| --- | ---: | ---: | ---: | ---: |
| About 10 seconds after launch | 97.7 | 39.5 | 137.2 | 0 |
| First Emojis tab | 121.9 | 39.5 | 161.4 | 135 |
| First Icons tab | 130.6 | 39.5 | 170.1 | 135 |
| Second Emojis tab | 130.7 | 39.5 | 170.2 | 135 |
| Second Icons tab | 131.9 | 39.5 | 171.4 | 135 |

The baseline frontend scan began 10.014 seconds after process launch; worker
scans follow within approximately one second, so the sum is approximate rather
than an atomic process-family snapshot. The frontend peak was 133.7 MiB.
The complete sources contained 1,870 emoji and 6,200 icons, with 15 mounted rows
out of 208/689 source rows. OCaml major-heap capacity ranged from 6,182,000 to
10,262,192 bytes during the tab samples; its minor-heap limit was 16,777,216
bytes. Capacity and limit are not live-object memory. The physical-footprint
columns include the processes' native allocations and resident OCaml memory.

The successful sample and exact artifact hashes are preserved under ignored
`deps/ui/_build/nsh-picker-final-memory/final-release-x0jf9pxv/`; `complete.json`
records all five phases and `cleanup.json` records no errors. Only this private
frontend/worker group was stopped; the normally installed user session remained
open. The native-input run is retained in `/tmp/logseq-picker-native-wheel-clean.log`
and its private evidence directory `logseq-picker-wheel.Ip8cXA`. These results do
not qualify long-term leak freedom, physical input devices or distribution signing.

### Cancel-only SDK overlay retirement remains unresolved

A focused native-engine selection-Escape regression exposed a separate SDK
boundary at the pinned NSH revision. In the cancel-only overlay variant,
`/tmp/logseq-native-selection-escape-trace-fixed.log` records a keymap containing
both the selection binding (`2147483648`, nonediting) and the overlay binding
(`4294967295`). After Cancel removes the overlay content, no replacement keymap
is emitted; the next Escape does not reach the selection binding. This is not a
passing AppKit or production-application qualification.

Source proof: `nsh-core/src/core/overlay.rs:438` returns early when the overlay,
watched-pointer and hint lists are empty, without considering the retained
`cancel`/`hint_escape` flags. Releasing the last cancel-only overlay removes it
from the overlay list at line 319. The normal listener synchronization at line
581 would clear `cancel` and dirty the keymap, but the early return skips it.
No SDK source or dependency pin is changed by this report.

The production selection Popover listens to both `on_press_outside` and
`on_cancel` (`LUI platform/nsh/src/controls.rs:377–381`). Its watched-pointer
list forces the retirement synchronization, so the application regression now
models both real dismissal paths while retaining the exact requirement that
first Escape dismisses the overlay and second Escape reaches selection once.
The reduced cancel-only case remains a separate known SDK issue, not a fixed or
qualified path.

Provider audit also found real potential exposure: LUI's notification stack
reuses `nsh_base::ToastStack`; `nsh-base/src/toast/stack.rs:313–322` creates a
zero-size cancel-only overlay while notifications exist. The last notification
can therefore encounter the same condition when no other watched overlay is
present. Canonical Sheet reuses a cancel-only native panel in
`nsh-base/src/sheet.rs:134–154`; no current Logseq desktop Sheet call was found.
Desktop context-menu roots retain a PressOutside listener, and their submenus
remain under that root. Dialog uses native Modal RequestClose rather than this
Overlay Cancel path. Toast/Sheet retirement requires a separate focused proof
and a scoped dependency decision; this audit does not claim those paths pass.

### Properties source audit: repeated choices and draft ownership

This is a source-only audit against frozen master
`29fd2edd015e12963742b985ce6d2311c074e09b`, not a GUI qualification.
The current native host at `e1db7fbd8172b94dbade42b8b018bac65e675c1e`
still has the same `properties_select.ml` and `properties_area.ml` as
`a82cf24cd7`; the isolated audit tree is based on `f80b224175`.
The native target compiles these shared property modules, rather than a Web-only
replacement. The already assigned scalar-cancellation and atomic batch-removal
work is excluded here.

**Highest-value next fix: clear a retained picker's query after choosing.**
Master `src/main/frontend/components/select.cljs:126` defaults
`clear-input-on-chosen?` to true; its `choose-result!` at lines 196–200 resets the
input atom before invoking the choice. The input component observes that empty
atom and updates its controlled value at lines 69–73. Current
`deps/ui/src/properties/properties_select.ml:87–94` invokes the active
`on_choose` directly for Enter; the pointer handler at line 146 also invokes it
directly. Neither path changes `st.q`, `searched`, or the outstanding search
request. `properties_value.ml:1253–1269` and `1328–1343` deliberately retain
many-value popups after ordinary additions/removals, so a query such as `al`
remains in the actual field after choosing Alpha. The next choice still uses
that filter instead of the empty query master's chooser supplies.

The minimal correction is one application-owned choice function shared by the
pointer and Submit paths: capture the intended item, invalidate the previous
search ticket, reset controlled query/results/highlight, then invoke that item's
existing callback. Retain the present LUI text field, list and popup; no new
native widget, focus controller or search cache is necessary. A meaningful
fixture should seed a many-value property with Alpha/Beta, type `al`, choose
Alpha by Enter, assert the query becomes empty and Beta returns, then select
Beta by pointer. A delayed search response for `al` must not reinstate the old
filter. Verify the same popup remains mounted and the real worker contains
both choices. This scenario has not been executed.

**Native Enter focus needs a separate qualification.** The same chooser handles
Enter with `text_field ~on_submit` (`properties_select.ml:200–226`), while
NSH's current single-line policy retains native `BlurAndSubmit`
(`LUI platform/nsh/src/inputs.rs:59–69`; pinned NSH
`nsh-core/src/mount.rs:606–618` and `ops.rs:1458–1466`). Many-value callbacks keep
the popup open. Consequently clearing its query alone does not establish that
continuous keyboard entry remains possible after Enter. Extend the actual
native fixture above by immediately typing the second query without a pointer
click or focus helper. If focus is lost, prefer the public native Input's
submit-without-blur behavior through a narrowly typed, explicitly opted-in LUI
policy; preserve ordinary scalar Enter/blur defaults. Do not add an unconditional
window key binding or refocus timer. This is an identified provider/default
boundary requiring an interaction test, not a claim of completed keyboard QA.

**Draft refresh ownership remains a focused risk.**
`properties_value.ml:64–91` stores the active scalar buffer, but its `edit_buffer`
reader has no callers. `scalar_edit_cell` at lines 513–519 restores the editing
boolean from the active owner while always initializing its local buffer from
persisted `initial`; lines 536–538 then overwrite the active buffer with an empty
one. `properties_area.ml:440–464` and `800–825` rebuild the property-panel branch
on area data changes. A refresh that actually remounts an active scalar field
can therefore restore editing state without restoring its dirty text. Frozen
master's `single-string-input` keeps the controlled draft in hook state and
updates it only when persisted `string-value` changes
(`property/value.cljs:1816–1845`). The smallest proof is an actual active-field
fixture: type an unsaved draft, publish an unrelated property-row change,
require the draft and its owner to survive, and then cancel without a write.
Do not claim this is reproduced until that exact refresh path is exercised, and
do not repair it by introducing a second global draft registry.

The audit also ruled out a tempting false difference: closing a many-valued
closed-choice popup after removing its final value is intentional in frozen
master (`property/value.cljs:491–499`) and current
`properties_value.ml:1269`. That close condition should remain.

### Natural-language date engine decision: parity remains blocked

The source review and root-run comparison retain the complete frozen-master
behavior requirement. `/tmp/logseq-natural-date-rust-release.log` fails the
next-Friday expectation; changing it to the candidate's same-day result would
hide a real difference. Interim 0.2.2 only exposes US/UK dialects and returns a
resolved datetime, not known/implied fields. The application's pinned
chrono-node 2.10.1 instead implements week-relative weekday rules in
`dist/cjs/calculation/weekdays.js` and implies hour 12 in `results.js:61`. A
dialect switch cannot reproduce that complete policy. The candidate's midnight
default is another datetime difference. `9999 January` is valid reference input;
its incorrect invalid-input fixture must not be confused with the weekday bug.

A bounded primary-source review found no qualified drop-in replacement:

| Engine | Relevant public boundary | Decision |
| --- | --- | --- |
| chrono-english 0.2.1 | Generic Chrono timezone and captured base, US/UK dialect | Same grammar family; lacks the required field/default policy. |
| dateparser 0.3.1 | Custom timezone and default time | Enumerated absolute formats, not the required relative grammar. |
| natural-date-parser 0.1.3 | `DateParser` | Reads `Local::now` internally repeatedly instead of accepting one captured reference. |
| rustling-ontology | Probabilistic time/entity grammar and training pipeline | Different semantics and a broad integration surface; not a small compatible replacement. |
| chrono-node-rs 0.1.0 | Known/implied parsing components, tags and reference timezone | Closest grammar candidate, but hardcodes its system timezone to UTC. |

The actual chrono-node-rs 0.1.0 archive was read without compiling it (SHA-256
`40875bc70dba13430750d9be684dcd08046d8c2e1404a57cc82ae40ac49a24a5`).
Its normal dependencies are fancy-regex and serde_json, and its MSRV is 1.85.
It ports upstream 2.10.3, while this application's reference is 2.10.1; those
versions require an explicit comparison. `ParsingOption` has only forward-date
and abbreviation overrides. `ReferenceWithTimezone` stores one offset;
`JsDate::local`, local getters/setters and `get_timezone_offset` assume UTC.
`utc()` currently aliases `local()`. These are published implementation facts,
not an executed compatibility result.

Converting only final components to Chrono Local cannot repair every case.
Root executed the actual pinned chrono-node 2.10.1 in an isolated Node process
with `TZ=America/Los_Angeles`: reference 2024-02-10 local 02:30 and input
`in 1 month 1 day` return **2024-03-11 local 04:30**, epoch **1710156600000**.
The source-derived 03:30 is only an intermediate setter result: `setMonth`
normalizes the March 10 gap to 03:30 and `setDate` retains it; the complete
parser then applies its captured reference offset. Root also measured
`2024-03-10 02:30` returning local 03:30, epoch **1710066600000**. Actual parser
outputs are authoritative. The UTC port never encounters the intermediate gap,
and its final components no longer retain the operation sequence. Also, upstream
`createRelativeFromReference` assigns a certain timezone offset for relative
time expressions: certainty alone does not prove the user supplied a timezone.

The smallest credible dependency direction is a reviewed, immutable fork of the
chrono-node Rust port limited to its centralized local-date runtime. Preserve
the grammar/refiners and all UTC primitives; add system-local construction,
getters/setters, overflow normalization and per-instant offset behavior. A
provider must supply JavaScript-compatible forward gap/earlier fold resolution;
Jiff's public `try_system` and compatible resolution are candidates, with no
UTC fallback on detection failure. This requires a dependency-scope decision,
provider/range review and comparison tests, not an application keyword grammar.
No external fork, application provider dependency or shipping replacement was
created by this review.

A subsequent authorized local-only prototype adds optional exact Jiff 0.2.38
behind `system-local`, with local getter/setter and per-instant offset behavior,
separate UTC primitives, and the companion restoration of upstream's
`setUTCFullYear`/`getUTC*` calls in component validation. Grammar and refiners are
unchanged. A private differential harness checks the actual Node package is
2.10.1, captures references once, and compares full result/component certainty
and dates in fresh per-zone processes; expected values are generated by the
actual parser. No compiler or test has been run by the prototype's author.

Published-source provenance was checked against git commit
`c9cd9895588c11e4c85d44906e3972147e0d5ec0`: all 309 compared source/build/license
files match despite the crate's `dirty=true` metadata; the author manifest differs
only in version and publication flag. MIT LICENSE and upstream NOTICE must be
preserved in any authorized fork.

The prototype remains blocked on explicit qualification and contract decisions.
Jiff's local civil/timestamp range is -9999 through 9999, narrower than the JS
TimeClip range; the full UTC range is preserved but unsupported local dates are
not replaced with fabricated UTC rules. Jiff's own system-zone cache has a
five-minute lifetime, and the port already maps invalid numeric getters to zero
instead of JS NaN. Windows system detection and bundled rules, Unix system tzdb,
historical sub-minute offsets and near-boundary dates require comparison.
`try_system` failures are surfaced through a reference validation call before
parsing. This candidate is not proof of complete JS Date or master parity.

Required qualification includes all seven reference weekdays with this/next/last,
inferred noon and explicit times, month-end/leap overflow, valid year 9999,
invalid dates, phrase extraction, explicit offsets/abbreviations, local DST gaps
and folds, mixed duration sequences through a gap, and cancelled/reordered host
results. Run the frozen Node engine and candidate in separate timezone-controlled
processes for UTC, Asia/Shanghai, America/Los_Angeles and Europe/Berlin; repeat
the applicable platform gates on macOS, Windows and Linux. Runtime size, first
parse cost and retained memory remain measurements, not assumptions. The owned
asynchronous service can be kept while the unqualified parser is replaced.

Primary references: [interim](https://docs.rs/interim/0.2.2/interim/),
[chrono-english](https://docs.rs/chrono-english/0.2.1/chrono_english/),
[dateparser](https://docs.rs/dateparser/0.3.1/dateparser/),
[chrono-node-rs](https://docs.rs/chrono-node-rs/0.1.0/chrono_node/),
[rustling-ontology](https://github.com/sonos/rustling-ontology), and
[Jiff timezone API](https://docs.rs/jiff/0.2.38/jiff/tz/struct.TimeZone.html).
