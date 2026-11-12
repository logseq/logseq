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
for the Journal icon to be persisted and the native picker to retire. It does not manually
supply `VirtualWindow` events, truncate generated datasets, or replace the picker
with a test-only view. The earlier recording-host row tests remain useful for
source semantics but do not prove native viewport ownership. The initial release
run exposed independent queue saturation during the complete Emoji Scroll.
After coalescing visible-range feedback, the full release publisher passed its
actual application matrix at application `aa5a29d4b8` and LUI `eee8d3fa`. This
includes both complete tabs, end/first/end native-controller scrolling, bounded
cells, persisted final choices and native picker retirement. The Emoji case
measured a 328pt viewport and 133–135 mounted cells. Reopening after choosing an
emoji also exposed mixed point/element popover placement; the passing candidate
uses mutually exclusive placement branches. This is native-engine evidence,
not hardware wheel-input or raster-performance qualification.

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
