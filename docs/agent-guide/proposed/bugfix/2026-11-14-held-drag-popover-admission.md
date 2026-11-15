# Held Drag Popover Admission

## Problem

Task43/internal40 observed Appearance reappearing during a held native block drag after visible outside dismissal. Its exact producer and callback ordering remain unobserved. Source inspection identifies two independent admission boundaries: explicit application open actions and Apple anchored-popover reconciliation.

## Proposal

Route the page-menu and shared/native command services through one explicit Appearance toggle. An accepted current popup close records its live toolbar owner for a strict, one-shot 150ms same-or-contained-target suppression. Track physical pointer buttons independently of armed/active drag state; a held gesture cannot open Appearance, including after Escape cancels a drag. Primitive popup feedback may close, never open. Own target suppression with application state lifetime; physical sampling belongs to the process event service and is not cleared by semantic disposal. Refresh native physical samples from AppKit on pointer/key input so a release outside the window does not leave a stale held mask.

In the paired Apple SDK patch, preserve dismissed or held-rejected declarations while their actual popover models remain retained, including temporary anchor absence. Admit no new/rebound presentation during a macOS physical hold, and do not replay that rejected declaration when the button is released. Match dismissal to the current model and anchor identities; geometry changes alone do not invalidate a current dismissal, and stale callbacks cannot dismiss a replacement.

The application base is 675724cafacc0b310463dae4f1ec10065c85b560; the separate SDK base is bc89138b7c44804ab5c0cf72e833635c85261db1. Neither patch changes dependency pins, reveal implementation, frozen runtimes, or wire fields.

## Alternatives considered

### Treat a drag flag as physical input ownership

Rejected: Escape can cancel the drag while the button remains held. A time-only delay also cannot protect a longer hold. Changing generic modal behavior would not repair anchored popovers.

## Acceptance criteria

- Both application command implementations and the page menu use the same toggle; neutral explicit opening remains possible, repeated activation closes, and one matching show inside the strict 150ms close window consumes its marker.
- A hold cannot grant application or SDK opening authority; canceling a drag does not clear physical-button ownership.
- Native geometry updates and temporary anchor absence cannot replay an accepted dismissal. Stale setters cannot close a replacement, and a genuinely retired declaration does not permanently suppress a later explicit opening.
- Native/Melange build, serial regressions, existing UI harness and focused Apple lifecycle checks pass; exact patch identity and application/reverse checks accompany independent source review.
- Physical held/drag, control ordering, appearance and timing acceptance remain separate and require Main's authorized new-runtime procedure.

## Risks

- This is partial PL parity. The separate PL3 opening outside-close grace of 150ms is explicitly out of scope: Dismiss carries no reason, and this change must not invent one or add wire fields. The corresponding T-GRACE acceptance cell remains uncovered.
- The one-shot marker belongs to the real Appearance toolbar target; this does not claim target timing parity for unrelated popups or generic modals. Native Dismiss does not expose a reason, so accepted native popup closes share this short re-show marker; Escape's existing Dismiss_all path remains distinct.
- Native rejection lasts for the rejected declaration, not until a later neutral repaint. Applications must retire it and issue a fresh declaration to retry.
- Historical internal40 causality remains NOBS. Source/build checks cannot establish native physical acceptance or a complete PL1-10 pass.

## Questions

None. Main authorized the A+B scope and explicitly excluded opening outside-grace without adding a dismissal reason or wire field.
