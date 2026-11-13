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

## Long-code geometry remains a failing gate

The actual 1,000-line code fixture failed its containment assertion after an
actual native-window resize from 900 to 1,400 points. The ordinary Markdown
insertion retained all 22,994 source bytes, the source SHA-256 and canonical
owners. The first native text witnesses and captured first viewport were
present, but the existing standard `code-editor` region and wrapper each
reported a 20,000-point AppKit frame. The source-keyed Editor's own committed
Core dimensions were not measured by that observation.

Evidence is retained in `logseq-native-code-block.ZkgANV` and the unchanged
repeat `logseq-native-code-block.YjeXsU`. The repeat additionally saved
`first-admitted-tree.json` and `first-admitted-source-hashes.json` for a complete
public-Renderer replay. No containment assertion was relaxed, ancestor clamped,
scroll offset set or geometry substituted. The 100,000-line native end/return
gate has not been run past this failed prerequisite.

The successful standalone Release physical-footprint measurements in
`deps/ui/nsh/RELEASE_MEMORY.md` remain measurements of that workload. They do not
establish long-code scroll containment or final-line paint. The replay must
distinguish the native Editor from its original ancestors and use authentic
initialization theme/icon services, rather than replacing the surrounding tree.

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
profiles. Actual application paint and interaction after this fix still require
a fresh Release capture.

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
certificate fixture correction and a real OpenSSL-only early regression are
pending. No source, package, trust-store or test-success guard is bypassed.
