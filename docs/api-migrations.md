# API migrations

## NSH desktop CodeMirror extension

The existing `Logseq_codemirror.cm` constructor and `cm-event` scalar fields are
preserved. The native factory consumes the exact OCaml-exported schema receipt;
application startup rejects a mismatched fingerprint before mounting a widget.
For example, `Logseq_codemirror.cm ~uuid ~source_role:"block" ~lang:"edn"
~value ~on_event ()` now mounts NSH's native `Editor` instead of MyGo's editor.

Native text editing, IME, selections, undo, wrapping and syntax highlighting are
owned by NSH. Block source changes update the existing editor; changing `uuid`
or `source-role` replaces its native editing state. Query evaluation snapshots do
not replace a focused query draft. Query Enter, Shift+Enter and Escape retain the
existing `cm-event {name="key"; key; value}` payload, including the full text.
Block focus/blur continue to carry the current full text. Empty-UUID blocks and
explicit `read-only=true` are read-only. An unknown source role is rejected
atomically; unknown highlighting languages use NSH's plain-text language.

Authoritative same-source replacements use NSH's native undo policy: replacing
text is an undoable edit, whereas the former MyGo replacement cleared history.
There is no handwritten history or composition controller in this adapter.
Web and Apple editor factories remain unchanged. Hardware IME key dispatch and
native appearance still require qualification on each desktop target.

## NSH raw user markup

Raw `logseq-*` schemas are loaded from the same OCaml receipt. Native Text/View,
Button, Input, Checkbox and Image hosts translate the existing raw text, attrs and
typed layout properties. DOM events preserve `nodeId`, so OCaml supplies the full
target/ancestor snapshot; text changes emit `input` then `change`. Navigation stays
with the OCaml document dispatcher instead of opening every raw link externally.
For example, `Logseq_el.el ~tag:"input" ~attrs:["value", source] ...` remains a
controlled native text input; `type=checkbox` uses NSH's semantic Checkbox.

This native markup route is deliberately not a browser: raw CSS classes do not
install a stylesheet, and iframe, canvas, SVG subtrees, audio/video, PDF, select,
option and details/summary require specific native adapters. Instantiating these
unsupported raw tags is rejected before publication rather than displaying an
empty surrogate. Use the existing typed LUI component where one is available.
The `logseq-dom` document-event carrier is intentionally zero-size; document
routing belongs to the application's typed runtime services, not a second tree.


## Native desktop application menus

NSH installs the application, File, Edit, View, Window and Help menus using native
menu roles. The `application-menu-labels` service now includes translated `file`,
`edit`, `view`, `window`, `help` and `reload` fields in addition to the existing
sidebar/documentation labels. The OCaml exporter supplies them from the selected
dictionary; older MyGo JSON decoding ignores these additive fields. For example,
rebuilding the native OCaml app before launching NSH supplies the new menu labels;
a hand-authored two-field payload is rejected rather than shipping blank menus.

Reload (`Mod+R`), Toggle Left Sidebar and Documentation send the existing
`application-menu-command` platform event with `detail.command`. Edit commands,
Quit and Close use NSH's native roles; application shutdown remains owned by the
root's save/close handshake. Standard role labels and shortcuts follow NSH's
platform implementation. The application menu exists on macOS; other desktops
place Quit in File. No separate menu focus or keyboard controller is introduced.

Raw layout accepts numeric point strings, CSS `px`, percentages and `auto` where
the corresponding native property supports them. Scoped color expressions use
the same final theme resolver as typed controls, including transaction preflight;
invalid style/theme combinations leave the previous tree and native state intact.
Raw Button/Checkbox activation uses native semantic events: click payloads identify
the node and omit unavailable physical pointer coordinates/modifiers. For menus
or gestures that require those details, use the typed LUI component rather than
raw button markup. The raw View/Text/Input hosts retain native pointer payloads.

### Native theme snapshots include the Web typography scale

The native CSS palette generator now reads `--text-*` declarations directly from
this application's pinned Tailwind `theme.css`, matching the theme imported by
`tailwind.all.css`. These source declarations are the lowest-priority root layer;
authored base/unlayered declarations and application theme overrides retain their
precedence in light, dark and accent modes. Other Tailwind namespaces are outside
this typography change.

For example, the existing sidebar `~font_size:"var(--text-sm)"` now resolves from
its real `0.875rem` stylesheet source instead of failing native startup. No NSH
fallback font size, new theme API or wire ordinal is introduced. Changing the
pinned stylesheet's text scale changes the generated palette on the next build.

### NSH DOM measurement completes with the display locked

A DOM request that follows its target's creating patch waits once for the native
commit, not for a display-link frame. The existing retained ElementRef then
provides the real measurement, and the captured node incarnation is checked
again before replying. For example, the Journal shell's
`dom_measure_rect "nsh-right-split-space"` can resolve while the Mac remains
locked, allowing its model-owned content split to mount. No timer, synthetic
frame, window activation or fabricated rectangle is used.

### NSH raw images resolve OCaml-owned graph resources

The existing ordered `resource-context` host message now installs typed,
application-owned graph metadata instead of storing unused JSON. Its required
`graph`, `graph-dir` and `asset-dir` fields retain their existing native contract:
open graph roots are absolute; closing a graph clears both roots. Unknown or
malformed metadata fails explicitly before it can replace the current context.

Raw `logseq-img` nodes use this context to resolve graph-relative `src` values.
`assets/image.png`, `./assets/image.png` and `../assets/image.png` refer to the
published asset directory. Other relative sources stay beneath the published
graph directory; encoded path traversal, absolute/protocol-relative relative
references, malformed escapes and unsupported URL schemes are rejected.
A `data-asset-file="image.png"` identity takes precedence over an old retained
`src`, so changing graph context resolves the same authored filename beneath
the new graph's assets. Closing the graph clears that source synchronously.

Absolute files, local file URLs, image data URLs and credential-free HTTP(S)
URLs continue through the existing native Image loader. Direct URLs do not
subscribe to graph metadata. This adds no second decoder, image byte cache,
filesystem I/O or selector tree. Existing typed asset Images already use the
absolute paths supplied by OCaml's Asset_store; this change does not invent a
new canonical Image property or wire ordinal. PDF viewing is a separate native
extension and is not represented by an image placeholder.


### NSH header More uses the native attached Menu

On `NshHost`, `Chrome.dots_btn` now permanently attaches a canonical
`ContextMenu` to its retained Button. The existing desktop adapter lowers that
pair to the public NSH `Menu` trigger slot. NSH owns opening, arrow navigation,
activation, outside/Escape dismissal and focus restoration. Pressing More no
longer sets `Model.page_menu`; its existing page/global action callbacks remain
unchanged. Web and the other maintained hosts retain their external anchored
popover and controlled `Page_menu_set` behavior.

For example, native header code uses `dots_btn ms`, with the existing model
signal, instead of dispatching `Page_menu_set (Some (...))` to open an external
role-menu Popover. The bounded menu list is reconciled on existing model
notifications, refreshing page/auth actions without a new store or controller;
stable keys preserve the trigger and Menu owner. Publishing permission loads
into a disabled retained MenuItem. The native signed-in account container is a
semantic MenuItem, with its existing email/visibility/logout controls retained.

Native placement follows NSH's trigger, collision and motion policies; the old
Web-specific -33pt alignment adjustment is not applied. Generic externally
anchored role-menu popovers remain unsupported, including separate property and
view menus; this change qualifies only the header producer. The actual app
startup gate now opens More, requires Settings and Appearance, dismisses using
native Escape, reopens, and verifies trigger/journal-body identities.
