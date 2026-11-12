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
| UX-002 | P1 | Editor clipboard | `extensions/editor.rs` deliberately leaves C/V/X to the native Input; no native clipboard document events reach shared `Editor_keys` copy/cut/paste handlers. Plain text conduit behavior does not establish structured block, HTML, image/file or multiline outline paste parity. | Confirmed source gap; implementation and native qualification pending. |
| UX-003 | P1 | Graph and action menus | Current user screenshot reports externally anchored menu popovers rejected by the backend. | Separate menu workstream owns repair and real open-menu regression; visible native recheck pending. |
| UX-004 | P1 | Initial block editing | The legacy global 60ms click filter dropped unrelated NSH clicks. Active-host policy now bypasses it for NSH. | Parent rebuilt release archives and reports compiled native admission passes, including actual shared editor mounting and focus emission. Actual native click/type and raster verification pending. |
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
