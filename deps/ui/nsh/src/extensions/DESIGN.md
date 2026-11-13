# Native editor extension presentation

The shared OCaml view owns application layout, labels, source and editor model.
The native CodeMirror factory uses NSH Editor's existing theme, monospaced scale,
gutter, selection, caret and composition parts. It adds no layout wrapper, focus
manager, custom paint layer or text document.

## Code viewport and document ownership

Frozen master `29fd2edd`'s `src/main/frontend/extensions/code.css` gives ordinary
`.CodeMirror` a `1024px` maximum height and explicitly removes it for `calc`.
The native factory applies one equivalent 1024pt maximum policy to both its
existing measurement View and NSH Editor, for block and query roles. The
measurement root bounds the size contributed to the surrounding App layout;
the Editor bound limits its own scrolling viewport and native row window.
Its existing `min_rows=Some(1)` remains:
short code grows naturally, and long code scrolls within the bounded viewport.
No maximum line count or `max_rows` approximation is introduced.

The authored language uses the same whitespace/case normalization as native
highlighting. `calc` removes the height constraint with `Length::Auto`, while
still using the existing JavaScript highlighter mapping. Language/height
bindings update the same Editor; only the existing `(source-role, uuid)` key
can replace its document/history owner. Read-only, focus and query draft
contracts remain unchanged. The native Editor's internal Scroll and visible-row
slots own virtualization; the App adds no scroll wrapper, row source or layout
cache.

The existing Headless fixture checks a tall parent independently of the cap,
the factory and canonical Row dimensions, short autoheight, complete 1k/100k
block/query documents through native
document-end paste and Undo, and retained identity/focus/history through
normalized calc/ordinary/rust language changes. Public approximate-layout
witnesses establish bounded projection, not platform font shaping, standalone
physical memory or a successful 100k application launch. Those measurements
require a fresh standalone release and separate code-workload evidence.

### Intrinsic measurement evidence

At App `9650d50756` / LUI `93712b51`, the actual 1000-line AppKit case exposed a
20000pt standard code region despite the existing Editor cap. The complete
captured canonical tree, authentic matching theme/icon initialization and real
public factories/fonts were replayed without removing properties or capping
canonical ancestors. Public committed Core layout at 1440×900 and 1440×1400
reported the following diagnostic results:

| Factory variant | Editor height | Code region / wrapper height | Layout witnesses |
| --- | ---: | ---: | ---: |
| Original inner cap | 1024 | 20000 | 803 |
| Direct source without `each` | 1024 | 20000 | 803 |
| Factory root overflow hidden | 1024 | 20000 | 803 |
| Factory root explicit minimum zero | 1024 | 20000 | 803 |
| Root policy only, Editor uncapped | 20000 | 1024 | 5303 |
| Same policy on root and Editor | 1024 | 1024 | 803 |

These results establish the two distinct control bounds. Removing the source
key does not correct measurement and would discard required source-rebind
ownership. Root-only clamping conceals an unbounded Editor viewport. The chosen
change keeps both existing owners and derives both bindings from one helper;
`calc` still selects Auto for both. The replay establishes Core geometry, not
AppKit pixels, standalone RSS or successful 100k App interaction. Fresh actual
native containment/wheel and memory gates remain required after rebuilding.

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
