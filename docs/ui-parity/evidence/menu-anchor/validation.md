# Toolbar menu anchoring

Reference master `7dfa9b45a`; native predecessor `f87d111bdf`.

Before, the native toolbar menu was positioned from window width even when the
open right dock moved its trigger into a narrower main area. It appeared inside
the right dock, detached from the dots button (`native-before.png`).

The menu now mounts beneath the retained dots/right-toggle group and uses typed
below/end anchoring, matching master's trigger-right-plus-32 alignment. Its
right edge follows the main area's trailing controls, including when resized,
and its top is the trigger's bottom (y=40), not y=48. Context menus retain their
existing pointer-point positioning. No raw DOM layout measurement is added.

## Validation

- Test first: production native shell/layout test fails the menu/header alignment
  assertion before repair. After, dock closed/open at widths 1280 and 1100 pass;
  menu is 256 pixels wide and begins at y=40.
- Native executable/web/test targets build; native-host/contracts/host tests pass;
  shared UI suite reports **2087 checks, 0 failures**. Focused creation E2E passes.
- Actual rebuilt SDL/OpenGL app: open right dock and dots menu; inspect corrected
  placement (`native-after.png`); resize with menu open (`native-resized.png`);
  Escape and repeat-trigger dismissal work; choosing Settings closes the menu
  and opens the real dialog (`native-settings.png`).
- Actual master Electron now runs with its own HOME/XDG/graph directory and the
  identical imported fixture. `master-desktop.png` shows its menu follows the
  main area's controls rather than the whole window. Both images are 1280 x 900,
  English/light/scale 1. Dock widths differ, so compare the anchor relationship,
  not absolute x coordinates. Before native capture is on a regular page; after
  and reference captures are on the fixture journal. This is not a pixel-match
  claim for page contents or menu entries.

Remaining: Copy page URL and public/private publishing items found in actual
desktop master are missing natively; menu keyboard navigation/return focus and
full Appearance positioning remain unverified. Sidebar widths, desktop caption
controls, spacing and icons still differ. Graph View and sidebar Page graph
visualization are excluded and have not been opened or tested.
