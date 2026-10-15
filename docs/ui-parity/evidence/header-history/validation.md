# Desktop history controls and cold tooltip ownership

Reference master: 7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8.
Before native: fc56a83f2780780e95c53393c679c18a0f2076cf.
Actual Electron and SDL windows, 1280x900, light theme, scale 1, both sidebars
closed, same disposable fixture pages. Graph visualization remains excluded.

## History controls

Master header.cljs mounts Home, Back, Forward, page menu and right-sidebar
toggle in that order. Both history controls stay enabled at history boundaries;
clicking an unavailable direction is a no-op. Native already owns route-history
stacks and command bindings but omitted these controls.

Two native32px controls now invoke the existing navigation service. Header
labels reuse the exact existing translation keys; shortcut hints reuse the
command table's platform display. No second navigation state/store is added.

- [Native before](native-before.png), [native after](native-final-long.png).
- Long Page → Reference Target → Back → Long Page → Forward → Reference Target
  works through actual pointer presses in both apps:
  [master Back](master-back-long.png), [native Back](native-back-long.png),
  [master Forward](master-forward-target.png), [native Forward](native-forward-target.png).
- Extra Forward at the newest destination stays on Reference Target:
  [master](master-forward-boundary.png), [native](native-forward-boundary.png).
  A fresh native empty Back stack also stays on Home:
  native-empty-back-boundary.png.
- Production tests dispatch the real buttons, exercise boundary no-ops and
  forward-stack retirement after new navigation, and restore the fixture's
  previous hash/stacks. The missing-control test fails on the previous source.

Native caption buttons are still absent, so the trailing header group remains
farther right than the reference. That is an unresolved controls/layout gap,
not covered by the accepted top-of-window header placement allowance. Home's
previous retained-rendering problem remains documented separately; page-to-page
history success does not establish full navigation parity.

## Cold tooltip and dismissal fixes

The first actual native hover exposed Go back at the upper-left corner instead
of below its trigger. The geometry service is asynchronous, but Tooltip.show_for
read a cold zero rectangle before the measurement reply arrived.

The shared tooltip now waits for the existing trigger readiness contract before
mounting, then waits for bubble geometry. Bounded retries never treat pending
geometry as measured zero. Generation ownership cancels queued initial hover,
trigger and bubble-placement callbacks after hide or replacement. In particular,
native clear_timeout cannot retract a callback already delivered to the UI
mailbox; a failing-first test expires a real native timer, verifies queued work,
then hides before draining it. The old implementation resurrects the tooltip.

Keeping trigger ownership avoids rearming on movement inside the same control.
Native DOM containment also incorrectly excluded a node from containing itself;
that broke the existing mutual-containment identity test. The adapter now uses
its existing node identity before checking ancestors. Direct production tests
cover self, descendant and unrelated nodes, failing first on self-containment.

- [Wrong cold position](native-back-tooltip-before.png).
- [Reference tooltip](master-back-tooltip.png).
- [Final clean native binary: cold position repaired](native-back-tooltip-after.png).
- [Escape dismissal](native-tooltip-dismissed.png).

### Remaining pointer repaint difference

**Tooltip visual stability is not fully repaired.** Moving the pointer one pixel
inside the native history button can erase tooltip pixels even though it remains
logically open. A temporary diagnostic trace reports the same history-back
trigger and same=true; the retained host scene still contains the popover at
1124,44 size72x52 and Go back at1136,50. Resizing1280→1281→1280 restores it:

- [Missing pixels](native-tooltip-pointer-paint-gap.png).
- [Retained scene](native-invisible-tooltip-scene.txt).
- [Diagnostic pointer trace](native-tooltip-pointer-trace.txt).
- [Repaint after resize](native-tooltip-after-resize.png).

The diagnostic logging was removed before final builds and is not in production
source. These observations isolate a remaining native rendering/damage path;
they do not prove its exact root cause or introduce a blanket repaint workaround.
The arrow still looks square rather than the reference triangle, and keycap
styling differs. Retry exhaustion, multiple rapid owners, full window/graph
history, editing-to-navigation, keyboard focus and macOS remain incomplete.

## Validation

- Native/Melange/test builds and native-host/contracts/host suites pass.
- Shared UI suite:2119 checks,0 failures.
- Fresh Vite focused creation/focus E2E and serial browser spacing/property
  regression results are retained in test-e2e.txt and test-browser.txt.
- Translation hardcoded-text lint and changed decision-document validation pass.
- Nine required read-only review passes completed; queued-hover cancellation and
  native self-containment findings were tested and fixed.
- No DB/worker/schema/migration, dependency or new translation-key change.
- artifact-sha256.txt identifies the final clean native executable/web bundle.

Actual paired Reference Target captures also expose separate backlinks gaps:
master-target.png includes the Projects / Alpha breadcrumb and different linked
reference spacing; native-target.png does not. These are inventoried remaining
work, not silently counted as parity from successful header navigation.
