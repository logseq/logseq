# Inherited page typography

Reference master `7dfa9b45a`; native predecessor `da0f9ab28e`.
Both own graphs show `Native focus verified` / `Focus ownership persisted` at
1280 x 900, English/light, scale 1. Open-sidebar before/after/reference captures
are provided, plus closed-sidebar paired after/reference captures.

Master computed styles establish body 16px / 24px line-height and title 36px /
54px line-height. Native was inheriting the generic 14px control font and natural
Pango line-height. Page and journal wrappers now bind the existing page-size
variable and a 1.5 line-height ratio through typed properties. Titles keep their
own size while inheriting the ratio. Reading and editing leaves share these
metrics; header/settings controls remain independently sized.

## Validation

- Test first: production native shell renders a fixture page; its body font
  assertion fails at 14px. After repair, real native text-engine inspection
  verifies body16/24 and title36/54. Production extension registry is used, and
  worker reads are an explicit nil-response test seam, not an actual graph.
- Native executable/web/tests build; native-host/contracts/host tests pass;
  shared UI suite: **2094 checks, 0 failures**. Focused creation E2E passes.
- Actual newly built SDL/OpenGL app: page/journal body is now16px; title/body
  line-height rects become54/24px. Actual existing-block click → Ctrl+A → type
  `Body font editing validated` → Escape saves the correct block; native worker
  response retained (`native-saved.json`). Restore the representative text through
  the same actual editor afterward.
- Earlier actual existing-block editing and basic undo already worked natively;
  broad web-twin failures must not be mislabeled as all-native editing failures.
  An exploratory selection/delete sequence changed only this generated test
  page's block identity; its representative visible content was restored.

Remaining: page/journal padding, control indentation, short-page overflow,
heading-specific typography, font-setting effects, opacity, rich rendering and
complex editing/selection/undo/paste interactions. Sidebar widths differ and
are not corrected by this metric repair. No full page/typography parity claim.
Graph visualization remains excluded.
