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
