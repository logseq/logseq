# Native layout qualification and remaining failures

## Qualified source checkpoint

App `9f185f46c848bbf834baaf77a63fa707c604adbc` uses published LUI
`93712b51ab40d7c5882fed1501568a55ab6722ba` and NSH
`adc186db7213f3ccd1eacaa836cc721e9779fd14`. Its Release build passed the actual
OCaml/application startup gate and 1,911 literal presentation sites in two
themes. The complete shared suite passed 16,597 checks before the later Help
and bullet changes. Compiler warnings remain enabled.

Actual AppKit input fixtures used private graphs and owned process groups. They
did not activate or replace the installed application. Their driver is native
platform input, not physical hardware input.

- Nonediting range reversal in both directions, dragging a selected second root
  with the whole selected group, unchanged source text, persisted sibling order
  and outside-window cancellation passed in 16.2 seconds. Evidence is in
  `logseq-native-block.CKlUc9` under the system temporary directory, including
  `range-reversed.png`, `after-multiroot-drop.png` and read-only observations.
- The right sidebar passed native end/return wheel input in a 1280 by 560 window
  after the typed spacing changes. The final row remained visible at the end;
  returning restored the first row and retained all 36 source entities and
  generation 18, without a backend error. Evidence is in
  `logseq-native-right-sidebar-shrink.LjrOpC`, with `right-end.png` and
  `right-returned.png`. Both captures were inspected.

These are the recorded checkpoints, not proof of later source revisions or
complete outliner/master parity. Nested and cross-container dragging, hardware
input, IME and accessibility remain separate gates.

## Long-code measurement root and focus qualification

The original 1,000-line native fixture failed: the existing code region and
wrapper reported 20,000pt despite the inner Editor's 1,024pt limit. Preserved
failed evidence is `logseq-native-code-block.ZkgANV` and `.YjeXsU`. A complete
265-node public Renderer replay, using actual application extension factories,
all nine bundled fonts and original initialization services, reproduced this.
Capping the existing factory measurement root and Editor with the same existing
maximum-height policy bounded both without replacing source, identity or view
ownership. Root-only and overflow-only diagnostic alternatives were rejected.

App `b5c929a943c80f109efadb98d7181ed17e360fe0`, with the unchanged LUI/NSH pins
above, then passed the actual 1,000-line 1,400pt end/return wheel gate in 52.1 seconds.
Evidence `logseq-native-code-block.7K3peS` includes inspected final-line and
first-return PNGs. The 100,000-line gate next failed a three-second read-only
agent request after actual native focus. A failure-only owned-process sample
in `logseq-native-code-block.Opt22w` identified the OCaml application owner
allocating growing string concatenations in `Edit_runs.merge_plains`; the native
main queue and engine were predominantly idle. No timeout was increased.

App `9db47d94b54ea102f91344e1ecb5a97634f7d0c0` replaces only this merge with
linear buffered copying, preserving complete run metadata and singleton
identity. Its full shared suite passed 16,763 checks with zero failures. Its fresh
Release actual-application startup passed in 17.04 seconds. The native allocation/FFI
suite passed: 1,000 prepared 26,000-byte runs allocated 95,896 bytes in 0.000035 CPU
seconds; 100,000 prepared 2,600,000-byte runs allocated 11,016,672 bytes in 0.004146
CPU seconds. These are merge-only counters, not application physical footprint.

The same unchanged 100,000-line native interaction gate then passed in 18.1 seconds,
using actual Release OCaml/worker artifacts in the AppKit development host.
`logseq-native-code-block.xAwbC7` retains source receipts and inspected
`long-end-1400.png`/`long-return-1400.png`: line 100,000 and line 1 really paint.
Native pointer entry, keyboard document-end/start and real local wheels at both
ends preserve all 2,499,994 source bytes, SHA-256
`7646a61839b6e3b9619418939408aded6d23276c4ff562db2ce1d4538bc8be21`
and canonical owner 455. Bounded text observations contained 109 entries. This is
not a continuous 100,000-line wheel sweep, frame-time or standalone-memory gate.

A separate 900pt-high, 1,000-line wheel-only case reached the last
line through a new outer-page gesture and returned to line 1, with the same
source/owners and no backend diagnostic. The actual final-line PNG in
`logseq-native-code-block.2ZWpN7` was inspected. Its extra hover-toolbar assertion
still failed after 15 seconds, so the complete 900pt case remains failed. Earlier fixture
attempts failed on a capture-name whitelist and incorrect Scroll test ID; those
script errors were corrected without changing acceptance assertions. Native
text rectangles are not exposed by this public test API, so no per-line bounds
claim is made. The 100,000-line 900pt full-wheel gate remains unexecuted.

The historical standalone Release physical-footprint measurements in
`deps/ui/nsh/RELEASE_MEMORY.md` remain scoped to their recorded revisions and
workload. They do not establish current focused-editor memory or latency.

## Six-point bullet paint

A separate private AppKit matrix compared seven matching LUI Renderer and direct
Core shapes, without OCaml, a worker or an activated application. For both
providers, 6pt radius-3 and radius-999 shapes already had a native 3pt corner
radius, but their cached-display pixels filled all 36 pixels, including the
four corners. The same 6pt radius-999 shape with clipping painted 32 nonwhite
pixels and antialiased near-background corners. The corresponding 24pt shapes
were also recorded; this is not a blanket claim about all rounded surfaces.

Evidence is in `logseq-native-radius-matrix.w27yuq_b`: `radius-layers.json`,
`radius-appkit.png`, `pixel-corners.json` and the fixture source hashes. The
diagnostic passed and cleanup reported no errors. Its first compilation attempt
failed on two fixture API calls; the corrected attempt supplied the recorded
native evidence. No SDK source changed.

The application fix clips the existing childless outliner and add-block visual
Boxes only on NSH. It preserves radius, size, key, color, opacity and the larger
input/drag owner. The subsequent complete shared suite passed 16,657 checks,
including actual NSH block producers and Help under all four maintained host
profiles. At App `b5c929a943c80f109efadb98d7181ed17e360fe0`, the actual range/reorder
fixture passed in 14.7 seconds (`logseq-native-block.5xwasL`). Inspected
`range-reversed.png` and `after-multiroot-drop.png` show round 6pt bullets and one
selection toolbar surface; selected A/B roots move together after C. This does
not qualify the separate 5pt property bullet family or complete drag parity.

## Application delivery failures remain visible

Application workflow run `43357554443` completed with two failures. Broad native
tests retain the known `next friday 8pm` parity assertion. The actual signed
HTTPS upgrade job built both Release versions, passed their private packaged
startup gates and built the pinned public signing CLI, then failed while
creating the private test certificate. Its fixed 29-byte common-name prefix plus
a 36-byte UUID exceeds OpenSSL's 64-byte limit. The actual upgrade/restart did
not run. Downloaded failure evidence is outside the repository under
`/tmp/logseq-standalone-upgrade-43357554443/evidence`.

Neither failure is skipped or treated as a successful qualification. The
certificate fixture was corrected in App `9650d507561fa3b41d8db4d5afc3867866d91dee`:
32 hexadecimal UUID characters preserve 128-bit uniqueness within a 61-byte CN.
Thirteen actual OpenSSL/HTTPS tests passed, plus ten standalone and four
preparation guards. No trust store was changed locally. Workflow 43368225594
has a completed broad-test failure at the same retained `next friday 8pm`
assertion (80 passed / 1 failed); its actual signed-upgrade job is still running at
this checkpoint. Neither its future outcome nor a current complete upgrade is
claimed. No source, package, trust-store or test-success guard is bypassed.
