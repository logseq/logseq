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

No extra animations, sounds, entrances or transitions are introduced. Actual
light/dark appearance, focus indication and IME behavior must be reviewed in the
running application; headless tests only establish event and ownership behavior.

## IME qualification boundary

The public headless driver qualifies native preedit updates/cancellation and an
explicit UTF-8 committed edit. Its hardware-key dispatcher does not reproduce a
platform input method consuming Return while marked text is active. The query
editor's hardware Return during active IME composition therefore remains
unqualified by these tests; it must be exercised in the actual macOS, Windows
and Linux native input methods. The preedit/committed-input assertions remain
active and verify that cancelled marked text does not become source or produce
a duplicate committed edit.
