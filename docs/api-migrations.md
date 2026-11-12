# API migrations

## Native icon and Emoji picker rows use the canonical viewport

NSH icon and Emoji picker sections now feed nine-cell, 44px rows into the
existing `Virt_list.list` adapter. The surrounding picker `Scroll` remains the
viewport owner. NSH mounts only its requested rows and interaction pins; it no
longer eagerly constructs and mounts the complete generated icon or Emoji
collection through the legacy `Lazy_children` path. The complete datasets stay
available, including the last partial row, and the existing item keys, choice
callbacks, search limit, tab/category sections and color-preset behavior remain
in use. Web and maintained mobile hosts retain the existing eight eager rows
and six-row lazy groups. No caller or stored graph data migration is needed.

For other application grids already inside a `Scroll`, pass row data to the
existing `Virt_list.list ~key_of ~render ~estimate_size` adapter rather than
putting every rendered cell behind `Lazy_children`. Keep row keys derived from
item identity and let the native host supply `VirtualWindow` feedback; do not
add a second scroll controller or item cache.

The native virtual-row regression links the production grid builder and counts
actual mounted buttons and cell render calls for 1,000 items and each complete
generated dataset. It exercises middle/end windows, overlapping cell identity,
interaction pins and selecting the last item without truncation. These retained
runtime tests do not qualify platform geometry or physical keyboard navigation.

## Native application links use the delegated click controller

Internal page references, tags, timestamps and block controls retain their
`href="#"` metadata for the application's existing delegated click selectors.
They now explicitly register their canonical Link press callback on NSH through
`Ui_parts.delegated_link`. It forwards the retained node and actual
Control/Shift/Command modifiers to the existing document click controller once.
NSH remains the only hit-test, keyboard and disabled-state owner. Web and the
maintained mobile hosts keep their existing event delivery.

This is an application adapter, not permission for arbitrary relative system
URLs. LUI continues rejecting a relative Link without an authored application
callback. Other application links using a delegated route controller should use
`Ui_parts.delegated_link (Lui_elements.link ~url:"#" ... [])`; external URL links
and links with explicit action callbacks keep their existing constructor calls.
The matching NSH backend must transport native Link detail to the existing
`PressModifiers` callback to retain Shift sidebar navigation.
## Favorites and recent rows share desktop typography and action visibility

The left sidebar now carries the reference 14px/20px medium row typography and
32px trailing title reservation in typed LUI props. The previous list-level
Web CSS declarations did not reach NSH, which inherited the application's
16px root size. These values match master
`29fd2edd015e12963742b985ce6d2311c074e09b`
(`left_sidebar.cljs` Favorites `ul.favorites.text-sm` / `li.font-medium`,
`container.css` row `.page-title` `pr-8`). Existing callers need no migration.

The retained dots button is shown while its row is hovered or its own menu is
open; closing the menu after leaving the row hides the action slot. The row
keeps the reference gray hover/open surface, while the button stays transparent,
matching master's `!bg-transparent` and row-scoped hover selector. The 32px row
and navigation/menu sibling hit targets are preserved. Hover updates change
properties without rebuilding the button or navigation subtree.

A Favorites activation without a preceding pointer sequence now navigates,
while a captured pointer release suppresses its subsequent detail event to
avoid duplicate navigation. Drag completion still reorders without navigation;
secondary context-menu routing and existing menu actions retain their owners.

## Native pointer bridge qualification

The actual Logseq bridge now exports byte-length `lui_ocaml_press_detail_utf8`,
`lui_ocaml_pointer_down_utf8`, `lui_ocaml_pointer_up_utf8`,
`lui_ocaml_pointer_move_utf8`, `lui_ocaml_pointer_cancel_utf8`, and
`lui_ocaml_context_menu_press_utf8`. Their trailing arguments are
`const char *target_class, int32_t class_length`, with the length measured in
UTF-8 bytes. Existing C-string exports remain for maintained hosts; rebuild the
actual native OCaml library when updating NSH artifacts. Native pointer events
must not reuse a library exposing only the C-string forms.

The actual application build now requires its complete NSH bridge capability
set before compilation and probes every generated macro export on the staged
library before startup or publication. Omitting one required UTF-8 export fails
qualification, rather than waiting for the user's first pointer interaction.
Invalid negative lengths and nonempty null buffers are rejected. Pointer
arguments and callback results are rooted across OCaml allocation and dispatch;
embedded NULs in target classes retain their original byte length.

The actual Headless application startup gate also hovers, presses, drags and
context-clicks Journals through public NSH controller input, requiring the dated
body and sidebar afterward and failing immediately on renderer diagnostics.
These exercise the linked C pointer path that semantic agent presses do not;
all six pointer exports remain required by the staged-library symbol gate.

## Native heap diagnostics

The opt-in native UI agent now advertises `gc-stats` in its `hello.ops`.
Send `{"op":"gc-stats"}` on that existing channel; the successful reply is
`{"ok":true,"op":"gc-stats","gc":{...}}`. No new listener is opened.
Native DB-worker `/healthz` responses additionally include `native-gc` using the
same fields. JavaScript workers omit that field, and other health fields retain
their existing meanings. Consumers must check the capability or field presence
instead of assuming every maintained target exposes native GC diagnostics.

Both objects contain integer `word-bytes`, `major-heap-words`,
`major-heap-capacity-bytes`, `current-domain-minor-heap-limit-bytes`,
`minor-collections`, `major-collections`, and `compactions`. For example,
`major-heap-words: 1000` with `word-bytes: 8` means 8000 bytes of major heap
capacity. The minor value is the configured capacity of the sampling domain;
it is not a sum over all domains. Neither capacity is a live-object count or
additional memory to add to process RSS/physical footprint.

Sampling uses `Gc.quick_stat` and `Gc.get` without forcing a collection,
compaction, UI action, database operation, or allocation-profile mode. Existing
production collection and idle-release policy remains enabled. UI queries are
serialized through the existing application entry and remain available during
update preparation as read-only diagnostics. Worker health samples its own native
runtime through an optional entrypoint-installed hook; maintained JavaScript
health responses do not call the native GC.


## Native document data uses application state

Native `Ui_services.dom_body ()` and `dom_root ()` now read, set and remove
`data-*` attributes through the existing document/application-state channel.
For example, the shared router's
`(Ui_services.dom_body ()).set_attr "data-page" title` publishes
`ui-state.data.page`, and settings publishes `ui-state.data.settings-tab`.
Subsequent attribute reads return the same value; removing an attribute removes
its document-state entry. Web continues to use its actual DOM attributes.

No native element `set-attr` capability is added: node attributes that affect
rendering, accessibility or editing must still use their typed owner. Arbitrary
non-data document attributes retain their existing strict host validation.
Downstream applications can retain document `data-*` calls; rendering state must
continue to use typed LUI props instead of document CSS selectors on native.

## Windows installation qualification boundary

Manual installation now distinguishes a verified absent/empty target from a
directory enumeration failure. Direct typed `FindFirstFileW`/`FindNextFileW`
bindings capture each error through Inno's `DLLGetLastError`: only no-match,
missing-path and successful end-of-enumeration results can admit an empty target.
Access/I/O failures abort before writing the installation-in-progress marker or
replacing any payload. The Windows installer qualifier adds an actual temporary
deny-list ACL scenario and restores that ACL afterward; local source tests do not
substitute for running it on Windows.

The bindings follow Microsoft's [WIN32_FIND_DATAW declaration](https://github.com/microsoft/win32metadata/blob/main/generation/WinSDK/RecompiledIdlHeaders/um/minwinbase.h).
Inno 6.7.1's [built-in helpers](https://github.com/jrsoftware/issrc/blob/is-6_7_1/Projects/Src/Setup.ScriptFunc.HelperFunc.pas#L214)
return Boolean results without capturing the script DLL error slot, so that slot
must be read from the direct native calls instead.

The Windows CI now compiles the real worker admission fixture and exercises the
actual Inno installer with private target/profile paths: active-worker refusal,
independent worker lifetime, fresh installation, real installed-host/worker
startup refusal during installation, interrupted repair, legacy refusal and
removal admission. The existing native save-abort, task/service and 1k/100k row
contracts also run after the actual build with installed `lui.ppx`. Local source
checks are not substituted for these required native results.

Inno captures WinAPI error codes through its public `DLLGetLastError` helper so
script/argument marshalling cannot replace the checked native error value. No
process-close or restart fallback is enabled. Protocol v1 remains conservatively
machine-global; it has not been relabeled as SID-scoped or multi-user qualified.
No SID helper exists in the inspected stock Inno/NSH public interfaces, so a new
security-sensitive identity implementation is deferred for explicit review.


## Windows manual installation admission

The actual Windows host and native DB-worker now register shared process-lifetime
activity before App/graph startup and refuse startup while an installer/remover
is present. Worker presence remains after its originating UI exits and applies
across executable paths/versions implementing this protocol. Named-object
failures refuse admission. Maintained Web/Apple/mobile and native POSIX worker
execution retain their existing behavior.

The pure Windows `--installation-admission-protocol` flag returns
`com.logseq.logseq.nsh-installation-admission-v1` without opening application or
worker services. Packaging requires the exact capability from both qualified
binaries before stamping `nsh/installation-admission-v1`. Inno uses the matching
AppMutex and opposing register-before-check order, with automatic close/restart
disabled. It never force-kills or takes ownership of a shared DB daemon.

A nonempty legacy target without admission metadata is refused rather than
certified safe. Stop/remove that older installation or choose a fresh empty
target. This does not attest to arbitrary older workers outside the target or
replace worker-version/update-preparation checks. Before replacement/removal,
`.nsh-installing` blocks the actual host/worker from reopening incomplete code;
all final installed payload hashes must match before setup clears it. Interrupted
protocol-aware targets can be repaired by re-running setup. User graph/state/
cache paths remain untouched. Raw ZIP overwrite while processes are active is
not an admitted update procedure. Actual Windows/Inno qualification remains
required; local source/model tests do not prove native installer safety.


## Actual Windows whole-app package layout

`deps/ui/nsh/package_windows.py` packages the qualified native Windows App into
`Logseq-NSH-<version>-windows-x86_64.zip`. The archive root contains the actual
`logseq-nsh.exe`, qualified root DLLs, sibling `Resources` (OCaml, worker,
dependencies/assets) and NSH app/update metadata. It preserves seven-argument
startup and existing executable-relative resource/data paths. There is no
Windows shell launcher or generic Todos/generated-runner substitution.

The portable package helper accepts Windows x86_64 and copies `ownedCode` root
DLLs alongside `ownedResources`, validating each against the build receipt. The
ZIP receipt adds `signing`, final `installedCodeSha256` and optional companion
`installer` name/hash. Existing macOS/Linux receipts remain compatible. Real
certificate/timestamp options reuse LUI Authenticode hooks; absent credentials
produce explicitly unsigned output. A failed requested signature never publishes
an unsigned substitute. Optional Inno installation affects only application
files, preserving user graphs/state/cache. Release checks bind the companion
installer and source sidecar to the final archive receipt.

This source checkpoint and its fake-toolchain tests do not qualify real Windows
startup, signatures, installation or upgrades. The Windows CI now exercises the
actual package path after its private App gate; a successful remote run remains
required. Maintained Web/mobile/Apple paths are unchanged.

## Windows actual-app build publication

`python deps/ui/nsh/build_windows.py --lui-source <checkout> --dumpbin <tool>
--dll-root <trusted-directory>` adds a native Windows x86_64 build path, separate
from the Unix build script. It preserves the actual Logseq seven-argument ABI,
worker/service channel and application resource contract. The typed OCaml schema
export is checked before Rust compilation. Required native imports are collected
from explicit trusted directories, not the development PATH; system Windows
libraries/API sets remain system dependencies.

The success layout is `_build/nsh-windows/logseq-nsh.exe` with sibling `Resources`
and required executable-adjacent DLLs. The existing actual-App startup preflight
must pass using the completed private candidate with a clean Windows PATH before
any published code/resource changes. Source or dependency changes reject
publication. The success receipt is written last and now optionally records
`ownedCode` for backend-owned root DLLs alongside `ownedResources`; unrelated
files are not retired. Individual file replacement remains atomic, not the whole
application set. Existing Unix receipts without `ownedCode` remain compatible.

This is a source build/qualification recipe, not evidence that Windows startup,
packaged launch, signing or upgrades have run. No feed, key, dependency version,
mobile backend or application wire behavior changes. See the NSH README's
complete Windows recipe and current qualification boundary.

## Native Windows application startup paths and worker identity

When `HOME` is absent on native Windows, UI services and daemon paths now use
`USERPROFILE`. The default native UI state directory is `%APPDATA%/logseq`,
matching the platform roaming-data convention; `LOGSEQ_UI_STATE_DIR` still
overrides it. Explicit empty home values and invalid Windows application-data
paths fail instead of writing relative to the working directory. macOS/Linux
state locations and Web/mobile backends are unchanged.

Native Windows worker startup opens `NUL` instead of `/dev/null`. The process
handle returned by OCaml 5.5.1 `Unix.create_process` is consumed at a local
Windows boundary: public `GetProcessId` supplies the real OS pid for the existing
worker registry, and `CloseHandle` releases the unused parent handle. Both
Windows errors are checked and retain their numeric codes. No caller waits or
signals through that discarded handle; existing worker health/shutdown owns
its later lifecycle. POSIX pid behavior and the seven-argument Logseq startup
ABI are unchanged. Actual Windows runtime qualification remains required.

Graph creation also reuses the native application's existing UUID generator
for lifecycle generations instead of opening the POSIX-only `/dev/urandom`
path. Generation values retain their UUID-v4 identity format; they are not
authentication secrets, and no consumer migration is required.

## NSH update-compatible package identity and layout

Actual Logseq packages now write canonical `nsh/app.json` metadata before
signing. The entire Linux `Logseq-NSH` directory is the installation unit:
`logseq` and `logseq-nsh` move from `bin/` to its root alongside `Resources/`.
Installed native resource lookup uses `../Resources` on macOS and
`Resources` relative to the executable on Linux/Windows, in both the Rust
library resolver and OCaml asset/worker services. Web and mobile paths are
unchanged. `LUI_OCAML_LIBRARY` and `LOGSEQ_NATIVE_ASSET_DIR` overrides remain
supported. An explicit `LOGSEQ_DB_WORKER_BIN` must name an executable regular
file; an invalid override fails immediately instead of finding a different
worker. A package with `nsh/app.json` only uses its own packaged worker when no
override is supplied. Development executable-relative/current-checkout paths
remain available outside an installed package; personal home checkout guesses
are removed. External scripts that ran `Logseq-NSH/bin/logseq` must now run
`Logseq-NSH/logseq`.

Release version comes only from `resources/package.json`; development
`deps/ui/nsh/nsh.json` no longer has a separate version. Archive names change
from `Logseq-NSH-linux-x64-2.0.2.tar.gz` to
`Logseq-NSH-2.0.2-linux-x86_64.tar.gz` (macOS uses `macos` and `aarch64` or
`x86_64`). Update artifact consumers accordingly. `<archive>.release/nsh.json`
provides the matching release version and public configuration to the pinned
NSH CLI manifest generator. Before manifest generation from the build checkout,
run `node deps/ui/scripts/package-nsh.mjs check-release "$archive"`: this checks
archive freshness, sidecar hash/identity and canonical archive naming. Generic
archive freshness alone does not validate an adjacent sidecar. Packaging now
publishes the receipt last, after archive and sidecar, and removes a candidate
receipt when its final metadata write fails. Publication is per-file rather
than a multi-file transaction.

No update source is configured by default. Packaging accepts the paired
`--update-url HTTPS-URL --update-public-key FILE` options; the qualified host
validates the generated whole-app configuration through NSH/LUI before the
packager embeds `nsh/assets/nsh-updater.json`. Missing/mismatched options or
invalid configuration fail the package. An unconfigured package omits the asset
and creates no updater worker or request when bootstrapped. Metadata and public
key source changes during packaging prevent a final receipt. This adds no
TSX/UI-only update path and makes no actual N-to-N+1 qualification claim.

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


### NSH Logseq retains its application menu when enabling installed updates

The NSH application now mounts one `lui_nsh::desktop_updates::UpdateActions`
inside its existing application/menu owner. Optional installed updater metadata
adds actions to the macOS Logseq menu or the Linux/Windows File menu. Native
Edit/Window roles and OCaml-owned business commands remain in that same menu;
there is no second `DesktopApp`, updater worker, installer or polling loop.

Without installed `nsh/assets/nsh-updater.json`, the contribution is empty and
creates no update cache, worker or network request. No production manifest URL
or signing key is supplied by this change. An explicitly configured installation
still uses LUI's existing whole-application root/configuration/signature checks.
Checks/downloads are user initiated. A confirmed installation also requires the
application-owned lifecycle lease now required by the LUI constructor. Actual
Logseq currently refuses that lease with a translated explanation: save/quiesce,
shared worker ownership and isolated relaunch remain unqualified. Consequently
this integration cannot install or restart the application yet. Owner disposal
cancels pending work and makes retired callbacks inert.

The NSH-only `application-menu-labels` payload now requires a complete nested
`updates` object matching LUI `UpdateLabels`, including `{version}` and `{notes}`
placeholders, and a nonempty `installation-unavailable-description` for the
application's current installation gate. For example, `updates.menu-check` is the translated label for
checking updates; `updates.version-notes` is a full translated description with
both placeholders, substituted by the existing workflow. Empty/malformed labels
are rejected before menu replacement. The OCaml native host configures this
payload before the initial app render, and I18n refreshes update the same owner.
Generic Apple/mobile native hosts retain their previous menu payload; no UI
component, ordinal, mobile build path or Dune rule changes.

Real Logseq feed/install qualification remains pending an explicitly supplied
feed and public key. Existing generic updater tests do not qualify a Logseq
production feed, and an archive without updater configuration remains a normal
manual-install package.


### Validate release update configuration before application startup

The actual NSH host accepts `--validate-update-config FILE`. It reads at most
1 MiB, validates those exact bytes with LUI's canonical signed whole-application
configuration parser, and exits before logger, native window, OCaml library,
credentials, updater cache or worker initialization. Exit zero means syntax and
configuration policy passed; it does not qualify the feed, signatures, archives,
installed application, data saving or restart. Missing files, malformed arguments,
oversized input and invalid configuration fail with a nonzero exit.

For example, the packager runs
`deps/ui/_build/nsh/logseq-nsh --validate-update-config STAGED/nsh-updater.json`
after writing the optional configuration and before signing. Supply both
`--update-url HTTPS-URL` and `--update-public-key FILE` to the packager; omitted
options preserve a manual-install package without update metadata or network
activity. Ordinary application launch and the explicit private
`--startup-preflight ROOT` mode keep their existing credential/storage rules.


### Optional application-owned asynchronous work observation

`Ui_task.Activity` supplies app/scope-owned pending-work and activity-epoch
snapshots. `within scope f` observes tasks created by that scope and preserves the
observation context of their continuations; `without f` marks control work that
must not count itself. `close scope` stops observing newly created work without
cancelling tasks. Counters release exactly once through the existing settlement
and cancellation lifecycle. There is no global cross-application task registry,
new worker, timer or deferred-invoke queue. Existing Web/mobile callers need not
create an observation scope and retain task ordering and cancellation semantics.

For example, a native save coordinator may create one application-owned scope,
run its existing serialized entries inside that scope, and inspect
`Activity.snapshot scope` after the existing mailbox drains. Outstanding unknown
work must explicitly refuse preparation; a snapshot alone does not prove worker
revision compatibility or authorize an update. Adapter primitives can use the
one-shot optional completion hook from `begin_work` to account for native
promises without copying task state. Long-lived transport liveness subscriptions
must be classified separately rather than waited on as finite work.


### Native Windows timer wake channel uses the OCaml socketpair primitive

The native Host timer scheduler now uses `Unix.socketpair PF_UNIX SOCK_STREAM`
on Windows, retaining the existing anonymous pipe on POSIX. Both paths retain
close-on-exec, nonblocking wake writes and the same select-driven timer worker;
there is no new polling loop, listener service or application worker.

OCaml 5.5.1's Windows [`nonblock.c`](https://raw.githubusercontent.com/ocaml/ocaml/5.5.1/otherlibs/unix/nonblock.c)
uses the Winsock nonblocking operation, while its
[`read_win32.c`](https://raw.githubusercontent.com/ocaml/ocaml/5.5.1/otherlibs/unix/read_win32.c)
uses socket receive for sockets and blocking ReadFile for pipes. The supported
[`socketpair_win32.c`](https://raw.githubusercontent.com/ocaml/ocaml/5.5.1/otherlibs/unix/socketpair_win32.c)
implementation supplies same-process AF_UNIX socket endpoints. Consequently the
previous pipe could fail at Host module initialization on native Windows and
could not implement the nonblocking wake drain correctly. Unsupported native
socketpair environments fail honestly rather than falling back to an unsafe
pipe. Actual Windows CI now compiles and runs the real Host source to exercise
initialization, delayed/zero timers, cancellation, wake bursts and mailbox drain;
this source change alone is not a passed Windows runtime qualification.


### Native update preparation admission and save boundary

The NSH application bridge accepts correlated `update-prepare` and `update-abort`
platform events with exactly `{ "id": "<positive decimal request id>" }`. Its
ordered service response is `update-preparation-result`, carrying `id`, `phase`
(`prepared` or `released`), `ok` and `error`. IDs must increase within the current
application owner. Only a matching abort releases a reservation; a repeated
matching release is idempotent, and an older abort cannot release a newer save.
Web/mobile default admission and their wire ordinals are unchanged.

Preparation rejects new ordinary, extension/editor, document/keyboard and
semantic-agent mutations while retaining the existing pump, service completions
and read-only agent queries. It reuses `prepare_window_close` to settle structural
editing, commit the live buffer, flush pending saves and await this app's worker
calls, without closing a window or stopping the shared daemon. A Host mailbox
barrier drains callbacks enqueued by accepted callbacks, then reactive flush,
worker/activity/mailbox epochs and app-owned finite-work counts are checked.
Unknown outstanding work explicitly refuses preparation; it is not awaited
indefinitely or misreported as a completed save boundary. Native Promise
continuations preserve their app observation context; transport liveness is
explicitly excluded from finite work. Pre-attachment buffered daemon invokes
participate in the same observation until their actual dispatch completes.

While the matching reservation is held, new native worker invocations reject
through the existing Promise error path with typed `Update_admission.Refused`;
there is no deferred-write queue or new worker. Abort resumes ordinary admission.
This fence covers application/model mutations, not an invented inherited NSH
`disabled` state. Native controller-local UI state is not certified frozen.
Worker artifact identity/compatibility, shared-consumer ownership and safe
relaunch remain separate requirements; this save boundary issues no installation
lease and does not qualify whole-application upgrading.


### Logseq updater saves, explicitly releases, then remains unavailable

The actual NSH application menu now requests the correlated native save boundary
through its existing `ApplicationEvents` capability after final update
confirmation. Its one application-owned preparation record rejects new model and
agent mutations, and the same native menu owner temporarily disables its actual
role/command items (including Edit roles). It creates no second updater, event
pump or worker. Missing installed update configuration still creates no updater
worker, feed request or preparation event.

The policy **always** sends `update-abort` and waits for the matching `released`
acknowledgement before returning the translated
`updater.dialog/installation-unavailable-description`. Save failures are logged
as diagnostics and also remain unavailable. No successful preparation returns an
`InstallLease`, so this increment cannot dispatch installation or relaunch.
Cancelling the preparation future sends the matching abort but keeps admission
closed until its acknowledgement; a stale earlier completion cannot release a
newer reservation. A failed abort transport does not pretend to release the
native fence. Owner cleanup retires the request; late issued replies are inert.

This exercises saving and safe release while the installation feature remains
explicitly unqualified. Shared-daemon artifact identity/compatibility, consumer
ownership and argv/credential/background-preserving relaunch are still open.
Controller-local native portal interaction is not certified frozen by a root
`disabled` property, which NSH does not inherit; the durable model/worker fence
and explicit native-agent admission remain necessary independent protections.


### Owned idle notification for asynchronous work observation

`Ui_task.Activity.when_idle scope callback` installs one cancellable notification
through the existing task scheduler. A second installed observer is an explicit
error; it never silently replaces the first. Cancelling or closing the scope
suppresses even an already-queued notification. The callback must recheck the
snapshot because new work can arrive before it runs. This supplies a bounded
wake-up for one application-owned save coordinator, without polling, a registry
or a queue of deferred invokes. Observation does not change task cancellation,
completion order or existing Web/mobile scheduling behavior.


### Abort waits for the actual save chain and its accepted descendants

A native `update-abort` now records `Aborting` intent instead of reopening input.
`released: true` is emitted only after the actual preparation promise settles,
all observed accepted descendants finish, and the mailbox/reactive boundary is
stable. Cancellation checks precede later property-editor, editor-buffer and
pending-save mutation boundaries. An abort during the initial worker wait cannot
later commit an old draft after admission has reopened. A failed request also
waits for still-pending sibling work before acknowledgement.

Actual saving runs inside the application work scope; only direct no-output
promise observers and coordinator bookkeeping are excluded. Native one-shot
Host timers remain observed through firing/cancellation and capture their
creation context, including detached save refreshes. Recurring interval waits
are explicitly liveness; their executing callbacks and finite descendants remain
observed. A queued cancelled zero-delay timer releases its work exactly once.
The existing sleeping timer worker is reused.

`Ui_task.Activity.when_idle` now accepts optional `after_epoch` for observing the
next real activity boundary without repeatedly reporting the same zero count.
One owned coordinator coalesces idle notifications onto the existing mailbox tail;
there is no polling timer or overwritten observer. Remaining structural state,
pending saves or deferred save-ready closures prevent release even at zero
observable activity. Such an opaque state is reported and remains fenced until
real observed work resolves it; it is never treated as proof of quiescence.

The actual application still aborts and awaits release before returning its
translated installation-unavailable explanation. No installation lease, daemon
termination or relaunch is enabled by this change.


### NSH production row sources borrow the existing Scroll

The native `Virt_list.list`, `Virt_list.rows_sig`, and
`Lazy_children.lazy_rows` adapters now use canonical `virtual_rows` on NSH.
Their `virtual_list` uses `viewport = parent`: the existing enclosing Scroll
remains the sole scroll owner, including journal headers and adjacent content.
Apple and the other existing host branches retain their previous behavior.

NSH rows use their application key (normally a block/page UUID), without a
content-version suffix. `rows_sig` keeps its signal-aware row mount; `list`
updates a changed snapshot through the existing `render` function within that
retained row scope. Applications that need control identity during a row's
content changes should use `rows_sig` and reactive properties inside `mount`.
Only requested rows and native interaction pins own mounted row scopes;
unmounted editor state must remain in the application model.

The existing pin/active-key notification becomes a canonical nonanimated
`scroll_target` request with `scroll_anchor = nearest` and a monotonic token.
The native virtual list owns measurement, focus retention and viewport feedback;
there is no second application viewport or per-row visibility cache on NSH.
`on_end` uses the canonical visible half-open range, emits once when the source
end becomes visible, and can emit again after the count changes or the viewport
leaves and returns to the end. The estimate must be finite and positive; NSH
measures mounted rows, so the estimate is not a fixed row-height requirement.

For example, keep a stable UUID key and put live content on the mounted row:

```ocaml
Virt_list.rows_sig ~key:block_uuid ~cmp:String.compare
  ~estimate_size:(fun _ -> 32.)
  ~mount:(fun block -> text ~text:(reactive block_title block) ())
  blocks
```

This production adapter change does not itself qualify large-page AppKit
scrolling or native pixel output. Run the production-helper fixture and the
actual Journal/page native qualifier against the selected immutable LUI pin.
# Logseq sparse virtual-window native ABI

The actual seven-argument Logseq OCaml bridge now exports
`lui_ocaml_virtual_window(node, generation, first, last, pins, count)`, matching
LUI's generic native ABI. Its registered OCaml callback dispatches canonical
`VirtualWindow` feedback through the existing serialized application entry.
This is accepted layout maintenance during update preparation, not new user
input; generation and mounted-row identity checks remain in LUI.

Applications using the NSH sparse viewport must rebuild their actual OCaml
library together with the host. For example, a host requesting `[100, 120)`
with retained row IDs passes those IDs in `pins`, rather than sending a public
`VisibleRange` event as a substitute. Windows and Unix candidate builders now
require the export before startup qualification or publication. No startup
signature, wire property ordinal, mobile backend, or shared-worker API changes.

## NSH window header follows native sidebar surfaces

The native Logseq window now uses the existing resizable pane surfaces behind
its fixed 48-point header. An open left sidebar extends
`--left-sidebar-bg-color` to its header portion; an open right sidebar extends
`--lx-gray-02` (falling back to `--ls-secondary-background-color`) to its header
portion. These are the same live theme tokens as the corresponding sidebar
bodies, in light and dark appearances. Closing or resizing either pane uses the
existing native split owner, without a second header width calculation.

The single transparent header remains first in logical keyboard order and is
painted above the pane bands. Its controls keep their existing keys and global
positions. Page and PDF bodies reserve the same 48-point top space as before.
Web and maintained Apple/Android chrome retain their existing layout.

## Graph selector uses one aligned content row

The shared graph-switch button now lays out its graph icon, growing name and
selector chevron in the same centered row. The chevron participates in normal
flow instead of using coordinates relative to an assumed button containing
block. The old padding reserved for that absolute icon is removed; the name
still truncates with an ellipsis. Existing keys, labels, handlers and menu
ownership are unchanged across native and Web hosts.

### Explicit native release builds

`bash deps/ui/nsh/build.sh --release` now selects `DUNE_PROFILE=release` for
both the LUI/Logseq OCaml libraries and the worker, and `cargo --release` for
both the native executable build and its actual startup qualification test.
No Dune file or compiler-warning policy changes. The no-argument command
explicitly selects the existing development profile.

Release publication uses `deps/ui/_build/nsh-release/bin/logseq-nsh`, its native
OCaml library beside it, and `deps/ui/_build/nsh-release/Resources`. Development
outputs remain in their existing paths. Both profiles retain staged validation
and atomic per-file publication. Their receipts record `buildProfile`,
`duneProfile`, and a rebuild command that retains `--release` when selected.

For example, package the exact qualified release output with:

```sh
host=$(bash deps/ui/nsh/build.sh --release)
pnpm --silent ui:nsh:package --built-host "$host"
```

`run.sh` still uses the development build; a release measurement must launch the
returned release executable with its own adjacent library and sibling Resources,
or launch its qualified package. A release profile does not itself establish
memory or performance budgets.

## Authoritative native block-editor source and selection revisions

The `logseq-editor` extension now admits optional integer `source-version` and
`anchor` metadata in both native and Web schemas. The shared edit surface emits
its existing `Edit_model.version` and the source selection anchor (or caret for
a collapsed selection). This metadata does not copy the document or introduce
a second revision owner. The native Input still reads the authoritative source
and directed selection through the existing serialized snapshot query.

A same-length replacement such as `A😀中z` → `B😀文z` now refreshes the retained
native buffer even when caret, composition and run offsets are unchanged.
Changing only the anchor also updates the actual selected range before the next
native insertion. Run metadata remains the existing offsets/kinds grammar.
Rebuild producer and native host together and regenerate the extension schema
receipt, since their schema fingerprints change. Web's scratch-input behavior
and maintained mobile backends keep their existing editing owners.

## NSH editor document capture and modifier keys

The NSH block editor now sends command keys through the application's existing
native document `keydown` capture phase before dispatching the same canonical
editor `key` event. Capture and conduit dispatch share one application entry;
preventing the default or removing the sink during capture suppresses the conduit
event. Other hosts retain their existing event delivery. The editor uses its
mounted LUI node as `nodeId`, so existing target selectors, autocomplete capture,
and keyboard recording use the same ownership rules as Web.

NSH modifier Enter and the existing shared editor formatting, selection, history,
and readline commands now reach that route instead of mutating the native scratch
buffer. For example, Mod+Enter cycles TODO through `Editor_commands`, and
Shift+Enter follows the existing document-mode newline policy. Plain text and
clipboard insertion remain on the native input. Applications must not emit a
second `dom-event` keydown for an NSH editor `key` event; it is delivered by the
native application entry. No LUI API parameter or schema changes are required for
this ordering change.

## NSH outliner content pointer delivery

The typed block content Column now owns NSH pointer-down, pointer-up and detailed
press events when a deeper native control does not own the press. It forwards the
actual LUI node ID, coordinates, primary button state and modifier flags into the
existing document event controller. Pointer-down precedes mousedown; the release
ends range-selection state, and the press becomes the existing click event.
This restores the same selection and editing entry path without a second
outliner controller. Web, Apple and Android keep their existing document routing.

Raw nonsemantic markup inside content now forwards `pointerdown` before
`mousedown` with `button: 0` and `buttons: 1`. Native Buttons and Inputs retain
their semantic event ownership. Applications should continue using the shared
selection/edit handlers; they must not add a parallel native content click
handler. This change establishes click and modifier-selection delivery, not
cross-row pointer hit testing or native drag/drop parity.

## Native OCaml minor-heap default uses machine words

The native bridge now defaults `OCAMLRUNPARAM` to `s=2M` when the variable is
absent. OCaml counts this parameter in machine words: this is 16 MiB on a
64-bit desktop. The previous `s=16M` allocated a 128 MiB minor-heap capacity
instead of its documented 16 MiB. The UI's native DB-worker child inherits the
same environment. Existing explicit `OCAMLRUNPARAM` settings remain authoritative.

For example, `OCAMLRUNPARAM=s=1M <native-launcher>` retains an explicit 8 MiB
minor-heap limit on a 64-bit desktop. Do not interpret either configured
capacity as live OCaml objects or add it to the process's physical footprint.
The actual-application startup test queries both runtime limits without forcing
a collection; its override case runs the same compiled path with `s=1M`.

## NSH retained block editor focus (2026-11-12)

The NSH application host accepts the existing `set-input-focus` command emitted
by the shared block editor. It focuses or blurs the current `logseq-editor`
native Input through its retained ElementRef. Requests captured before the sink
creation batch may bind only to the original mounted block row and its descendant
sink; removed or replaced owners cannot redirect an asynchronous focus request.
The payload remains `{"block-id":"<uuid>","focused":true}` and needs no downstream
API migration. Text click positioning still requires the geometry service before
queued editing actions can be released.

## Native sidebar reveal retains its content

Both desktop sidebar splits now share the existing 300ms standard reveal token
with the maintained hosts. On NSH, LUI passes this to scoped native layout
animation for changes to the authored first-pane width. Native divider drag
remains direct and the platform owns interruption and reduced motion.

NSH sidebars no longer set display-none at the start of closing. Their native
panels clip the retained subtree as the width reaches zero. Right-sidebar
content also remains mounted across close/reopen, preserving its keyed rows,
scroll and editor owners. Web/mobile keep their existing conditional right
sidebar content and inert semantics. Applications following the same pattern
should keep content mounted inside the split, set its closed minimum width to
zero, and let the native panel own clipping. Do not add a timer or intermediate
width signal around the existing split.
