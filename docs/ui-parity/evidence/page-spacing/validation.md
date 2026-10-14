# Page spacing and native scroll geometry

Reference: master `7dfa9b45a`. Actual native SDL/OpenGL, Linux, English/light,
1280x900, scale1, private representative graphs. Graph visualization excluded.

## Fail first / repair

- Production native text-engine/layout test measured title `(170,80)` and body
  `(181,182)`. Master's actual computed rects are `(178,82)` and `(198,188)`.
  Repair typed responsive container gutters, two-pixel title/block padding,
  22px control link sizing/padding and page-inner64px margin. Native title/body
  rects now exactly match those reference metrics.
- Empty/unlaid nodes contributed `(0,0)` to scroll bounds. Actual short-page
  viewport `y48/h852` with bottom868 therefore acquired a false16px range.
  Bounds now start at the viewport, ignore empty rectangles, preserve scaled
  direct-child padding and stop below nested clipping/hidden owners. Display
  contents does not clip. No scrollbar is hidden cosmetically.
- Long-page content inflated the native viewport to1490px inside a900px window;
  cap0 made final blocks unreachable. Bind the application wrapper to the
  actual viewport and allow the scroll pane to shrink. The regression drains
  the real host mailbox until row45 exists, rather than testing an incomplete
  deferred spine. The final viewport remains852px with a real range702px.
- After painting, shrinking layout caps can clamp the offset; frame_done used
  to erase that dirty state. Preserve changed scroll epochs for the following
  frame, which synchronizes translated retained paint before rendering.
- Review identified a shared-web additive footer: new typed margin64 plus old
  stylesheet padding64. A fresh real browser-app regression failed first on
  padding64. Remove the obsolete CSS layout rule, leaving one typed owner;
  both journal and newly created named-page computed styles are margin64 / pad0.

## Actual verification

- Paired named-page screenshots and full ancestor/control metrics retained.
  Final native `Focus ownership persisted` rect is `(198,188,203,24)`.
- Short page/journal viewport has cap0; native scrollbar no longer appears.
- Actual Long Page45 rows: wheel reaches row45 completely. Before the viewport
  repair, the native viewport was1490px and the lower rows were unreachable.
- Resize1100x700, scroll to bottom, expand1280x900: before the post-paint fix,
  row45 stayed at y518 despite the clamped cap702. Afterward offset702 is
  painted and row45 moves to y718. Separate split-width cache defect remains
  visible and is not claimed fixed (see ../flex-basis/investigation.md).
- Actual Settings Editor pane wheel scroll: outer dialog/navigation stay fixed;
  outer cap0 and pane cap22. Full nested-settings parity is not established.
- Actual click existing block → Ctrl+A → `Geometry editing saved` → Escape:
  actual worker returns that exact block title; representative text restored
  afterward through the same native editor.

## Tests / build provenance

- Native executable/web emission/tests build. Native-host/contracts/host tests
  pass, including Pango rects, complete45-row viewport, below640px gutter,
  actual store clipping policy, empty/scaled/tall bounds and post-paint clamp
  lifecycle. Shared UI: **2114 checks, 0 failures**.
- Vite and CSS builds rerun explicitly. `static/js/main.js` rebuilt22:14 UTC.
  Focused current-bundle creation E2E passes; browser spacing regression passes
  in a fresh isolated context and covers journal plus newly created page.
- Earlier focused reruns after18:28 used the older Vite bundle despite fresh
  Melange emission; they are not current-source E2E evidence. Actual native
  executions and unit tests used freshly built artifacts. Current reruns
  correct that browser-provenance gap; broad web E2E is still not declared green.

Remaining: long-page footer extent differs (native cap702 vs reference766,
last-row bottom position differs64px); title-caret visibility/offset, responsive
page insets, heading/rich rendering, journal minima/separators, wide/font modes,
complex selection/drag/clipboard and all resize states remain. A fixed-height
content-row/footer experiment compressed long content and was discarded, not
published. No whole-area or complete UI parity claim.
