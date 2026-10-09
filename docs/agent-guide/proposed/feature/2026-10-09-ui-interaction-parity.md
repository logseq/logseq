# UI Interaction Parity

## Problem

The shared OCaml UI reproduces much of the styling of app.logseq.com, but several controls bypass the component lifecycle that drives interaction and motion. Graph and collaborator action menus do not toggle, URL editors sample input state at mount, generic dialogs use a fixed type priority rather than open order, and ordinary columns bypass the toast lifecycle. Nested dialogs and popup menus must consume one dismissal at a time and restore focus to the appropriate trigger.

## Proposal

Use app.logseq.com in its disposable Demo graph as the behavioral reference. Cover buttons, dropdowns and menus, dialog stacking, notification lifecycle, settings controls, RTC graph/member actions, and view action submenus. Implement shared behavior once in deps/ui/src and use existing typed LUI primitives wherever they supply the required lifecycle. Preserve alert-dialog outside-press behavior. Compare Web and GPUI separately; recording-host tests establish shared behavior but do not prove native motion or visual parity.

Implementation sequence:

1. Write all failing interaction tests for menu toggling, URL editing, dialog order and cleanup, toast identity, and submenu navigation.
2. Verify failures against the current application code and capture browser evidence before changing implementation.
3. Repair shared controls and dialog ownership; derive props with scoped reactive expressions.
4. Use the toast primitive for pause, swipe, duration, and presentation lifecycle, retaining stable keyed identity across model updates.
5. Align component motion styles with the observed production transitions and honor reduced motion.
6. Verify settings dropdowns and nested dialogs, graph/member action menus, view submenus, and notification interactions in the browser. Build and run native shared-host coverage. Record any native renderer limitations explicitly.

## Alternatives considered

### Surface-specific event and timer patches

Adding separate browser and native implementations duplicates behavior and bypasses platform component ownership. It also makes nested focus and dismissal depend on listener registration order.

### Restyle all controls before verifying behavior

The existing semantic stylesheet already contains most production chrome. Behavioral evidence should determine which styles and lifecycle paths need changes.

## Acceptance criteria

- Action-menu triggers toggle, expose their expanded state, retain disabled-item behavior, and close after an action.
- URL editor input and Reset visibility update without remounting; save/reset closes the editor that owns the operation.
- Dialog dismissal follows opening order; nested dismissal leaves the parent intact, and close-all clears all dialog state and request resources.
- Toast updates retain mounted identity, error notifications persist, and transient notifications use platform pause/swipe/dismiss behavior.
- View menus safely handle empty lists and navigate nested submenus without changing the parent action.
- Web motion and focus behavior are compared with app.logseq.com; native behavior and motion claims have corresponding native evidence.
- The UI build, shared-host tests, browser checks, and applicable translation checks pass.
- Compare each accessible page and control state at the same viewport, theme, font, and graph fixture. Save reference, local, and difference screenshots; visual similarity without measured comparison is insufficient.
- Exercise all settings controls, including persistence and reload, and match the switch track, thumb, checked state, focus state, and motion to the reference.
- Verify search opens from a single icon press and graph/action triggers close on the second press.
- Match menu icon placement, readable hover/focus colors, settings navigation, and neutral right-sidebar disclosure headers.
- Restore the correct block and caret or selection after undo/redo of typing, split, merge, indentation, and paste.
- Align heading editing geometry and typography with reading mode; match task status and priority controls.
- Show page-reference autocomplete when the caret enters an existing reference, including keyboard movement and pointer selection.

## Verification record

The reference is app.logseq.com. Anonymous Demo graphs are used for repeatable browser comparisons. Current local preview is http://localhost:3001. The initial pull advanced the application branch to a2fa7964bf.

Shared interaction fixes currently cover chronological dialog ownership, nested Escape handling, URL editor reactivity, action-menu state, view submenu navigation, and primitive-owned toast lifetime. Browser evidence exposed renderer defects in cover-popover ownership, overlay alignment, retained toast exits, and trigger outside-press handling. Corresponding LUI changes are in the sibling worktree at /Users/tiensonqin/Codes/projects/lui; its local opam pin and the native Cargo path dependency use that worktree. Remote dependency publication and the application pin update are still pending.

Initial passing checks: 1,958 Web recording-host checks, 667 native recording-host checks, 87 LUI Rust tests, 51 Web overlay tests, protocol/schema checks, and translation validation. Subsequent changes require rerunning affected checks. The native boot test reproduced and repaired missing idle-window wakeups after OCaml patches.

Browser feedback then reproduced additional failures: duplicate search activation, graph trigger reopen, menu icons after labels, unreadable highlighted text, primary-colored sidebar headings, and a persisted font setting that crashes startup because a hyphenated dataset key is assigned through DOMStringMap. New browser regressions first failed on these application paths. Settings, editing, task controls, and full pixel comparisons remain in progress.

GPUI currently has retained fade entrances/exits, with headless lifecycle coverage. Native card zoom, toast viewport/collapsed-stack geometry, and actual window pixel comparison are not yet verified or fully aligned. The Mac was locked during the native GUI check. Authenticated RTC permission and remote collaboration workflows require account fixtures and are not established by anonymous menu tests.

## Risks

- Native component motion is implemented by the LUI renderer, so CSS parity alone cannot establish GPUI parity.
- RTC permission and collaboration flows require authenticated accounts and remote graph fixtures; the anonymous Demo cannot prove server-backed behavior.
- Timed dismissals and focus restoration must not affect a newer layer or a disposed view.

## Questions

None. The default scope includes Web and GPUI; optional prioritization does not block shared interaction work.
