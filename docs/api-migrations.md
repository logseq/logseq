# API migrations

## NSH remote gallery covers

Remote gallery classification now passes the URL and prefix to the existing
string helper in their declared order. Previously, full HTTP(S) URLs were
incorrectly excluded before an Image could be created. Trimmed HTTP(S) strings
and property-value collections now reach the existing gallery image branch;
local and script schemes remain excluded.

URL-backed gallery covers use NSH's existing native Image loader with eager
loading. NSH does not have a browser document Referer and the producer omits the
browser-only `referrer_policy` prop. Web, Apple and Android keep the existing
`loading=lazy` and `referrer_policy=no_referrer` parameters. URLs, decorative
alt text, cover dimensions and retained image identity are unchanged. This
producer correction does not add a loader, transport or cache. Recording
coverage checks emitted props; HTTP headers and native image decode require
separate real-runner qualification.

## Find-in-page single-line submission

The find-in-page query uses TextField's standard Enter submission through
`on_submit`; it no longer supplies `submit_on_enter`, which belongs only to
Textarea. Enter still dispatches `Next`, and query edits and repeated submission
retain the same query node. Textarea submission policies and the maintained
mobile and Web backends are unchanged.

## Settings accent swatches

Appearance accent choices now use a closed internal swatch type. The no-color
choice is a sentinel with a transparent background, semantic accent hover and
its existing red bar; it never constructs an undefined `--rx-none-*` variable.
Logseq remains a valid palette using the existing light and dark
`--rx-logseq-*` definitions. Palette and translated label mappings are exhaustive.
Persisted values remain unchanged: for example, `":none"`, `":logseq"` and
`":blue"` still select and save the same choices. No downstream migration is
required; Web and desktop share the corrected swatch producer.

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

### macOS NSH PDF uses the real PDFKit native view

`logseq-pdf` now has an app-owned macOS PDFKit provider registered through NSH's
public NativeComponent interface. The existing OCaml model remains the owner of
page/scale preferences and highlight persistence. PDFKit owns the actual document,
text selection, copying, native scrolling and keyboard behavior. The existing
`repo`/`identity`/`instance` envelope is preserved on page, scale, close, annotation
navigation and explicit selection-highlight actions; retired document events are
checked against the current envelope before dispatch.

The native toolbar uses NSH Button/Toolbar/Popover controllers. Existing PDF
labels, plus `pdf/highlight-selection`, are translated by OCaml and carried in a
`labels` JSON attribute for both initial loading and ready props. Automatic
selection actions use the native popover at its Highlight trigger. This placement
is a desktop presentation difference from a web popup at the selected text.

For example, an existing local PDF asset opens without changing its `path`,
`page`, `scale` or `hls` attributes. `auto`/`page-fit` use native automatic fitting;
`page-width` follows the native view width through PDFKit's page transform,
including page rotation, and positive numeric factors remain explicit scales. A text selection alone does not persist a highlight: choosing
Highlight emits the existing `pdf-hl-add` shape with a native UUID and normalized
page rectangles. Existing model-owned highlights are projected as PDFKit
annotations and referenced highlights can be revealed. An initial `ref_hl`
request waits for the native view's first usable bounds through its own frame
notification, without a timer or display-link dependency. The provider does not
write annotation changes into a second document store.

This is an initial real provider, not complete PDF parity. Area-drag PNG capture,
persistent highlight mode and warm/dark paper recoloring fail explicit admission
rather than being ignored. Password-protected/unreadable documents show a real
load error; password entry is not implemented. Local absolute paths/file URLs
are supported; remote document URLs require an explicit provider path. Annotation
recolor/delete/reference-copy controls and outline/search UI remain unresolved
rather than being reported as completed callbacks. Linux and Windows still
reject the PDF extension before native publication until real providers exist.

No Dune rule, generic bridge ABI, maintained mobile PDF implementation or NSH
fork is changed. The new PDFKit crate is target-macOS only. Native document
opening and parsing follow PDFKit's own load path on the AppKit thread; large
file latency still requires native qualification. No extra file loader, image
cache, polling loop or focus manager is introduced.

### Native More filters model updates through menu inputs

`Chrome.dots_btn` now uses a projected `reactive` source containing the resolved
page's action metadata, graph identity, current authentication/developer/locale
values, publishing mode and plugin commands. These external values are sampled
on existing model notifications, as before; this adds no separate auth listener
or menu store. Updating a block's content, references, caret or sidebar state
leaves that projection equal, so it does not rebuild menu rows or repeat the
publishing-permission query. Page/action metadata changes still refresh the
existing keyed trigger/menu without changing their native identities.

For example, `reactive render (reactive Page_menu.header_menu_inputs ms)` replaces
whole-model menu reconstruction; it requires the corresponding LUI PPX support
for a direct projected reactive child source. Web/mobile menu producers remain
unchanged. Storage-only changes still follow the application's existing model
notification contract rather than introducing another invalidation mechanism.


### NSH Appearance and right-side picker alignment

On `NshHost`, the Appearance popover and `Properties_popup.open_anchored_right`
use zero cross-axis alignment offset. NSH aligns each popup against its retained
native trigger and applies its existing viewport collision policy. The
Appearance popup's old -5.5pt correction and the right-side picker's -4pt
cross-axis correction target the reference host's point-anchor/arrow geometry;
Web and the maintained mobile hosts keep those values unchanged.

For example, `Icon_picker.open_picker_with_opts ~opts:{sub=true; emoji_only=false}`
still opens its dialog-role picker at the native trigger's right edge. Its
existing primary-axis spacing, contents, close handle and dismissal owner are
unchanged. This does not reinterpret externally anchored `role=menu` popovers
as dialogs: property action menus and view menus using that shape remain an
explicit separate NSH capability gap.


### Native Appearance has one explicit scrolling owner

On `NshHost`, `Settings_page.appearance_body` now places its existing settings
column inside a vertical canonical `Scroll`, bounded to 85% of the live native
viewport height. Its popup reuses `menu_surface_chrome` for the same theme,
padding, border and shadow, without the CSS surface's `overflow=auto`. Native
Scroll owns clipping, scrolling and the retained content; no generic overflow
value is translated into hidden or ignored.

For example, native Appearance can retain all settings rows in a short window
and scroll its contents through the native controller. Web/mobile continue
using `menu_surface` and their existing surface overflow recipe. Other callers
of `menu_surface`, including unsupported external role-menu producers, are
unchanged; they are not admitted by this focused Appearance adaptation.


### Native view-type actions use an attached Menu

On `NshHost`, `Views_head.display_type_el` keeps its real styled Button and
permanently attaches a canonical ContextMenu with Table, List and Gallery
MenuItems. NSH owns opening, arrow navigation, activation, dismissal and focus
restoration. The current display type is reflected through the existing view
state in each item's checked presentation and the retained trigger icon.

For example, choosing Gallery still updates the same view state, calls
`Views_state.persist_display_type`, then refreshes the view. This path no longer
creates an externally anchored `Views_popup.show_menu` entry on NSH. Web and the
maintained mobile hosts retain that existing popup path and callbacks. No
property configuration forms, inline rename editors or external role-menu
capability are replaced or claimed by this focused three-action conversion.

### Bundled background qualification restores its own hidden application

On macOS, explicitly setting `LUI_AGENT_BACKGROUND=1` still selects the native
runner's Prohibited activation policy. After the runner creates its window, the
application now requests `NSApplication.unhideWithoutActivation` on its own main
queue, and only while that policy remains Prohibited. A bundled background
process can otherwise retain AppKit's hidden state even though its engine and
content bounds are ready, leaving no visible window for the CLI to capture.

For example, a private `--startup-preflight` launch through the extracted
`Contents/MacOS/Logseq` launcher can restore its own content window without
calling application activation, synthetic input or display-power APIs. No other
application is inspected or unhidden. Ordinary launches and non-macOS hosts
are unchanged; screenshot capture itself remains read-only and continues to
reject an invisible window.
