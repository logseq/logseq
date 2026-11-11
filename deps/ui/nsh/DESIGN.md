# Native desktop presentation

The shared OCaml UI layer owns Logseq's semantic component recipes and theme
roles. NSH's existing components and native style system own interaction,
focus, overlays and property transitions. Application code does not introduce
another animation clock or controller. Editor-specific presentation and motion
remain documented in `src/extensions/DESIGN.md`.

## Block motion token

`Ui_components.native_block_transition` is the native selectable-block state
change recipe: transform and background-color both use 200ms ease-out. The
background retains its existing 200ms duration while the coupled native change
uses one shared timing. NSH has one transition timing per native element; the
application intentionally chooses this desktop recipe instead of asking the
backend to approximate unrelated CSS timings. Web and the maintained mobile
hosts retain transform 300ms ease plus background-color 200ms
cubic-bezier(0,1,0,1).

## Motion inventory

| Change | Owner and tool | Reduced motion |
| --- | --- | --- |
| Block selection/background and transform update | Shared `block_motion` recipe; NSH native property transition | Existing LUI/NSH reduced-motion mapping sets duration and delay to zero |
| Main, reference, page-title, property and recycle block updates | Same recipe on retained native row/column | Same native policy; no remount |
| Editor caret, selection and reveal | Existing NSH Editor/Input parts | Existing native policy |
| Split panel drag and bounds | Existing NSH ResizablePanelGroup | Existing native policy |

The recipe does not add entering/leaving animations, list choreography or
layout animation. Native light/dark, selection motion, interruption and reduced
motion need review in the real app after the startup gate passes. Source changes
or recording-host assertions do not constitute that visual qualification.

## Controlled foldable content

The existing view state owns grouped-content collapse. The shared
`foldable_motion` recipe maps that same state to native display-none/block on
NSH, retaining the content's owner and native identities. The layout change is
immediate, including with reduced motion; no grid-track interpolation, timer,
replacement collapse controller or new layout animation is introduced. The
existing Web/mobile grid-template-rows 200ms ease-in-out recipe remains intact.
Inner opacity/transform recipes remain with their native transition owner when
those supported properties actually change; they are not presented as native
grid-track animation. Verify expand/collapse, editor retention and focus behavior
in the real app after the body startup gate passes.
