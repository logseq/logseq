# Settled journal row geometry

Reference master7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8.
Before nativec2d00c7fefdccf7d282253f4d8a43e4e2466c204.
Actual Electron and SDL GL windows:1280x900, light theme, scale1, English,
both sidebars closed, disposable Demo graph with Oct15/14 journal fixtures.
Graph visualization remains excluded.

## Authoritative geometry and change

Master journal.css gives a journal250px minimum,102px bottom padding and a
bottom border except on the final item; :first-child receives500px. Actual
normal desktop wraps every journal in an individual Virtuoso row, so **every
settled journal is first-child and receives500px**. This is measured behavior,
not an invented uniform-height design. In direct nonvirtual RTC test mode,
only the first item receives500px; following items retain250px minimums.
Forced virtualization restores500px for every item.

Actual master DOM measurements: both normal rows500px, starts80/580, first
separator579, second title line box582. Inline styles are absent and both
journal elements match:first-child within their one-child virtual wrappers.
See master-metrics.json and master-structure.json.

Native previously carried minimums/padding/borders in an inline CSS string the
native layout does not interpret. Its second title appeared roughly240px too
high, and there was no real separator. The settled journal view now uses:

- Typed, reactive minimum height matching the reference mode.
- A growing footer with a102px minimum, preserving padding on tall content.
- A real1px separator only when a following journal exists.
- One scope-owned first/last derivation for class, minimum and separator state.

Existing typed-property adapters are used because column constructors do not
admit style_class_signal/min_height_signal; no new generic extension, untyped
layout attribute or CSS utility is introduced. Only overflow-anchor remains in
its existing non-layout style metadata.

- [Master before](master-before.png), [native before](native-before.png).
- [Native after](native-after.png), [native retained geometry](native-scene.txt).
  The scene dump's final row rectangle is viewport-clipped, not a320px row;
  production engine-rectangle tests verify both complete500px rows.
- Browser regression captures/metrics cover desktop, nonvirtual test and forced
  virtual test modes in browser-*.png/json. They supplement, not replace, actual
  SDL verification.

## Interaction and persistence

Both actual apps start with no blocks in today's journal. Clicking the empty
add row, typing Journal spacing parity and pressing Escape saves exactly one
matching block in both workers:
[master](master-edited.png), [native](native-edited.png),
master/native-content-before.json and master/native-content-after.json.

The native UI was closed, and its isolated worker was also stopped after
checking the process arguments target only data/native-root. A fresh UI and
fresh worker reload the same single block from the graph database:
[native after both restarts](native-after-worker-restart.png),
native-content-restarted.json and native-restarted-processes.txt.
The sample text is retained in both disposable graphs for future comparisons.
No real user graph was accessed.

## Precise remaining differences

Normal wheel scrolling reaches both journals and returns to the top. However,
**full scroll parity is not established**:

- Actual master: scrollHeight1032, viewport852, cap180px.
- Native: cap212px; an extra32px trailing range remains.
- [Master bottom](master-bottom.png), [native bottom](native-bottom.png),
  master-scroll-*.json and native-bottom-scene.txt record the exact states.
- Actual Electron reserves a15px classic scrollbar gutter. Its journal content
  starts160.5px; native content starts168px. The7.5px horizontal centering gap,
  thumb appearance and background/hover glyph differences remain.

A typed vertical-frame experiment on the native scroll body was rejected: the
existing long-page regression immediately lost its real scroll range (cap0).
No such Chrome change is shipped. The targeted cap180 expectation belonged to
that unsuccessful experiment and is retained as red evidence, not turned into a
false green claim. Existing long-page assertions remain unchanged and pass.

Date paging, load-more/virtualized large lists, loading placeholders and cached
row-height pinning, narrow/high-DPI interaction states, complete scrolling and
macOS verification remain incomplete. Only settled row spacing/separators and
the stated journal editing/persistence workflow are claimed here.

## Validation

- Failing-first production native layout tests: minimums, continuity, separator
  position; extended checks cover reorder ownership, nonvirtual mode, tall45-row
  content and footer minimums.
- Native/Melange/test builds and native-host/contracts/host suites pass.
- Shared UI suite:2119 checks,0 failures.
- New browser modes:3/3 pass. Final serial journal/spacing/property run:5/5 pass;
  focused creation/focus E2E also passes. Browser date fixtures use the previous
  calendar day so they cannot collide with the current journal.
- Changed decision-document and diff checks pass. Nine read-only review passes
  completed; the optional reorder-ownership assertion was strengthened.
- No DB/schema/migration/worker contract, dependency, new UI string or stylesheet
  change. artifact-sha256.txt identifies the tested native/web artifacts.
