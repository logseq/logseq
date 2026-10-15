# Native interaction paint hints

Reference master7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8.
Before native212f4cc6a8438ebccde8fc7003a37659d2ef5ce9.
Graph visualization remains excluded.

## Confirmed integration gap and fix

The app's custom SDL frame loop refreshed scroll-shifted fragments but omitted
Ui.paint_hints. The standard Lui_window.Assembly.repaint forwards both hard
interaction invalidations and soft geometry hints before Lui_host.repaint.
Hover, focus, pressed state, selections and scroll metrics live outside the
store journal; retained plans cannot observe them from store changes alone.

Host_scroll.prepare_frame now uses the same standard API boundary. It replaces
the app-owned scroll-offset table and full-tree traversal, not a new cache or
blanket invalidation. Its returned pre-paint scroll epoch retains finish_frame's
existing post-layout offset-clamp follow-up; frame_done was already called there
and is not a newly discovered missing operation.

A production test uses actual Lui_host retained painting and Lui_window.Ui:
initial button plan → pointer hover → repaint without hints (unchanged stale
plan, negative control) → prepare_frame/repaint (new plan). Further checks cover
focus and press changes. Existing post-layout clamp tests remain green.

Actual GL SDL Long Page scrolls from the first row to row45 and back using normal
pointer-wheel input. The header stays fixed; all45 fixture rows remain available:
[native start](native-scroll-start.png), [end](native-scroll-end.png),
[restored](native-scroll-restored.png). This preserves the previous scroll path
while adding missing interaction invalidations.

## Tooltip investigation: still unresolved on GL

**This integration fix does not resolve the original GL tooltip pixel loss.**
Same actual SDL executable, light theme, scale1,1280x900, same disposable journal
fixture, both sidebars closed:

- GL renderer: initial tooltip appears, one-pixel movement inside its trigger
  erases it: [initial](native-tooltip-initial.png), [after](native-tooltip-same-trigger.png).
- CPU raster+blit renderer: the same movement preserves the tooltip:
  [initial](cpu-tooltip-initial.png), [after](cpu-tooltip-same-trigger.png).
- Backend identification: gl-renderer.txt and cpu-renderer.txt.

Earlier state/scene evidence still shows the tooltip logically open with a
valid retained node/geometry; resize restores GL pixels. The CPU/GL difference
narrows the remaining investigation to their rendering paths, but is not proof
of a particular GPU-cache bug. No renderer/dependency source was edited, no
production default was switched to hide the problem, and no blanket repaint
workaround was added. CPU is used here as an explicit actual-native diagnostic,
not as a replacement browser wrapper or a claim of GL parity.

## Validation and limits

Native/Melange/test builds, native-host/contracts/host suites and shared UI2119
checks pass. Focused retained-host tests include hover/focus/press and existing
post-layout offset-clamp coverage. Fresh Vite focused creation/focus E2E and
serial browser spacing/property results are retained alongside this report.
Nine required read-only review passes found no new defect in hint forwarding.
No DB migration/schema/worker contract/dependency/configuration change.

Range-only scroll-cap changes without offset clamping, complete nested/horizontal
scrolling, scrollbar metric repaint timing, full GPU visual stability and all
macOS native rendering remain unverified. In particular, finish_frame's epoch
check does not itself prove immediate repaint of a range-only thumb change.
Do not count these checks as complete scrolling or tooltip parity.
