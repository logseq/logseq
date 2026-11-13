# Native editor extension presentation

The shared OCaml view owns application layout, labels, source and editor model.
The native CodeMirror factory uses NSH Editor's existing theme, monospaced scale,
gutter, selection, caret and composition parts. It adds no layout wrapper, focus
manager, custom paint layer or text document.

## Motion inventory

| Change | Owner and tool | Reduced motion |
| --- | --- | --- |
| Caret blink and selection | Native NSH Editor parts | Native platform policy |
| Typing, composition and wrapping | Native editor layout | Immediate |
| Source identity replacement | Keyed native owner disposal/mount | Immediate |
| Caret reveal while editing | NSH Editor scroll controller | Native NSH policy |
| Model or language update | Retained editor property binding | Immediate |
| Code action toolbar hover or contained keyboard focus | Existing shared opacity transition, 300ms ease-in; actions positioned over the editor without changing its layout | Existing LUI/NSH reduced-motion mapping makes the property change immediate |
| Language/Copy press and language menu | Existing shared compact ghost Buttons and native popup owner | Existing control and popup policy |

No extra animations, sounds, entrances or transitions are introduced. Actual
light/dark appearance, focus indication and IME behavior must be reviewed in the
running application; headless tests only establish event and ownership behavior.

The code action toolbar follows frozen master's four-point top/right inset,
16pt control height, compact shared text/icon recipe and hidden-at-rest state.
Its existing wrap owns scoped pointer-presence and focus-within state so keyboard focus
reveals the same retained actions. Only opacity changes when those states
change; the code extension, native document, source key and editor history do
not rebuild. The actions remain in normal accessibility/focus traversal rather
than using display-none, disabled or a separate focus manager. Native light/dark
placement, hover interruption, keyboard focus and reduced-motion screenshots
remain required; source/unit checks alone do not qualify pixels.

The existing state-slot/child-context pattern preserves this state through
controlled source re-renders and releases the slot with its mounted owner.
The compact recipe explicitly sets height and minimum height to 16pt, with
zero vertical padding; authored wire height alone is not native size evidence.

## IME qualification boundary

The public headless driver qualifies native preedit updates/cancellation and an
explicit UTF-8 committed edit. Its hardware-key dispatcher does not reproduce a
platform input method consuming Return while marked text is active. The query
editor's hardware Return during active IME composition therefore remains
unqualified by these tests; it must be exercised in the actual macOS, Windows
and Linux native input methods. The preedit/committed-input assertions remain
active and verify that cancelled marked text does not become source or produce
a duplicate committed edit.
