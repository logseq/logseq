# Stable header placement across the left dock

Reference master `7dfa9b45a`, native predecessor `df928284b2`.
Same `Native focus verified` content, English/light, scale 1, 1280 x 900.
Graph visualization and its controls are explicitly excluded.

## Difference and fix

Before, opening the left dock moved its header buttons to the detail pane's
leading edge; closing it retained a 70-pixel macOS traffic-light inset on Linux.
The header now spans the main area above the left split. Sidebar toggle and
search stay at the reference's x=8/x=40 frames (glyph centers x=24/x=56),
regardless of the left dock state. Reserve titlebar traffic-light space only on
macOS. Keep the graph selector at its existing vertical position by replacing
the sidebar's former 52-pixel top strip with a four-pixel inset below the header.

The left dock must fit the remaining viewport rather than claim the whole
900-pixel window below a 48-pixel header. Remove its viewport-height override
and give both splits an explicit zero minimum height.

## Validation

- Test first: the production native header/layout fails its platform-inset
  assertion before the fix. The complete shell test separately detected the
  newly introduced 948-pixel overflow; viewport-constrained splits repair it.
- Complete production native shell, actual native platform services, standard
  extension registry and native layout engine tested with left dock closed/open.
  It fits 1280 x 900 and keeps the sidebar button at its expected frame.
- Native executable/web/tests build; native-host/contracts/host tests pass;
  shared UI suite: **2087 checks, 0 failures**. Focused creation E2E passes.
- Actual newly built SDL/OpenGL application: open/close the left dock, select
  the representative recent page and capture each state. Before/after and paired
  reference snapshots retained here. The sidebar preference remains persisted.

## Remaining header/navigation scope

Desktop Back/Forward buttons were explored but are not added in this chunk:
returning to Home can leave the retained native scene blank until resize despite
correct journal nodes in the tree. An isolated LUI retained-cache probe identifies
reparent-then-drop subtree invalidation as a candidate cause; actual batch
confirmation and dependency repair remain work. Menu anchoring with an open
right dock, sidebar widths, opacity, hints/tooltips, conditional indicators and
desktop reference bootstrap remain unverified/different. macOS window chrome
has not been executed on Linux. This is not whole-header parity.
