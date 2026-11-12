# API migrations

## NSH journal title actions stay inside their native virtual cell

NSH journal rows reserve the existing 20-point title-action offset inside each
page-inner instead of placing the toolbar above the virtual cell's clipping
bounds. The reservation comes from its existing bottom padding; opposite margins
on the journal list preserve the title's global position and total scroll extent.
The same keyed row, title, actions and editor owners remain mounted. This lets the
pointer move from a journal title to Add icon or Set property without hiding the
actions at the cell boundary. Web, Apple, Android and ordinary page routes retain
their existing spacing. No application call changes; continue using the same
journal and title-action components.

## NSH right sidebar header toggle retains its native wrapper on resize

`Ui_components.header_right_sidebar_toggle` now uses `display=block` at widths
of at least 640 points and `display=none` below that breakpoint on NSH. It retains
the same wrapper and button while resizing, so a compact native window no longer
rejects the change from a transparent contents anchor to a physical view. Web,
Apple and Android retain their existing `contents`/`none` projection. The button's
command, label and breakpoint are unchanged; downstream callers keep using
`Ui_components.header_right_sidebar_toggle button` without migration.

## Desktop SDK and packaging CLI share an immutable source revision

Native NSH dependencies now select
`adc186db7213f3ccd1eacaa836cc721e9779fd14` from `logseq/nsh`, matching LUI's
selected SDK source. This revision fixes native packaging's unintended development
feature union without changing the UI runtime APIs. Build and package must retain
identical generated manifests and lock files; delivery still rejects drift.
Existing application calls need no migration. Native package, signing and update
qualification remains separate from adopting the pin.

## NSH worker process origin is an update prerequisite

New native DB workers spawned by the current NSH application receive
`LOGSEQ_NSH_APP_SESSION` and `LOGSEQ_NSH_WORKER_INSTANCE` in that child's
explicit environment. Neither variable is set on the parent process. The native
worker adds an optional `nsh-app-ownership` object to `/healthz`:

```json
{"session":"<application UUID>","instance":"<spawn UUID>",
 "executable":"<canonical worker executable>","shared":false}
```

The native loopback invoke and SSE requests add `X-Logseq-App-Session`. A native
worker carrying this origin permanently marks `shared: true` when a non-health,
non-OPTIONS request comes from another session or has no session header. Requests
remain accepted: existing CLI, Electron and mobile consumers keep their current
request formats and reuse behavior. Workers started without both new environment
variables omit the field. Existing health readers must continue ignoring unknown
fields. These origin stamps describe process provenance; they are not credentials
or authority to shut down a worker.

For example, a CLI that attaches to a worker spawned by NSH still sends its normal
`POST /v1/invoke` request. That request succeeds normally and makes the worker
ineligible for the NSH application's update preparation. A login-resident or
previously running daemon can still be reused for editing; its `owner-source`
value never promotes it to this session's owned child.

After saving, NSH update preparation now verifies all known worker attachments
off the application thread. Only an actual child-spawn record matching the health
PID, port, session, instance, executable and canonical storage/repo can pass this
prerequisite, with `shared: false`. The current graph generation, admission ticket
and worker revision are sampled separately; normal changes to them do not imply
a different process owner. Retired graph views do not discard still-running child
records. Missing, reused, changed or shared identities produce a preparation error.
The existing matching abort/released acknowledgement still precedes displaying
that specific error. A successful prerequisite still returns the translated
installation-unavailable explanation and never issues an `InstallLease`.

This sampled check is not atomic exclusivity or completed shutdown proof. Final
worker fencing, drain/graph-close/process-exit acknowledgement and an explicit
packaged relaunch policy remain necessary before enabling installation.
Unconfigured updates still create no updater or preparation event.

The maintained worker platform contract adds
`Http_server.req_header : req -> string -> string option` with case-insensitive
lookup on native and Melange. Downstream platform implementations must implement
this getter; existing request, response and invocation payloads are unchanged.

## Native element clicks activate the retained NSH controller

The native `click` service used by comment-reply reveal and popup keyboard
activation now calls the shared LUI `Renderer::activate_native` capability.
It captures the original node incarnation and the application's mutation guard
before deferring native layout, then uses the existing NSH controller once.
Missing, retired, disabled, hidden, pointer-excluded or unhandled targets return
an error. The host never follows a reused wire ID or also dispatches a second
OCaml Press event.

Existing calls such as `placeholder.Ui_services.click ()` remain valid and keep
their `{ "ref": ... }` request. The host retains the application mutation guard
from its mounted service owner; preparation is checked before activation and
again after measurement. A press that itself opens preparation or dismisses its
view remains accepted. The controller's response does not acknowledge completion
of any later application action. Web, Apple/iOS and Android click behavior and
request payloads are unchanged.
## NSH outliner rows forward native movement to the document controllers

Each mounted block's main Row now owns one NSH-only `pointermove` and
`pointercancel` bridge to the existing shared block-selection and bullet-drag
controllers. Descendant controls keep their Down, Up and click owners; movement
is not registered again on the content column or bullet. Web, Apple/iOS and
Android keep their existing document input routes.

This requires the corresponding LUI NSH movement correction: Move button -1
means no held mouse button and maps to document `buttons = 0`; primary 0 maps
to 1, middle 1 to 4, secondary 2 to 2, back 3 to 8 and forward 4 to 16. Rebuild
the host and native application library together. Coordinates, modifiers and
the retained main-row target remain attached to each movement.

For example, holding the primary mouse button while moving between rendered
block rows can now reach `Block_selection.pointermove`; ordinary hover is not
reported as a held primary drag. This bridge does not add pointer capture,
retarget release events across views, or establish complete native drag/drop
parity. Those behaviors require separate controller and native-window evidence.

## Wide mode is a mounted preference with declarative layout

`Settings_state.t` now includes `wide_mode`, initialized by `ensure` from the
existing `wide-mode` storage key. Raw and EDN-quoted booleans retain their
previous meaning; absent or unrecognized values use the existing false default.
Use `Settings_state.initial` when constructing a complete settings record, and
read the live preference through `Settings_state.wide_mode ()`.

`Settings_state.set_wide_mode true` and `toggle_wide_mode ()` persist the same
quoted boolean and update the mounted owner. Both shells bind their retained
root's `ls-wide-mode` class from that state. Web keeps the existing CSS selectors
and overridable `--ls-main-content-max-width[-wide]` variables. Native Chrome
updates the retained reading column through typed `MaxWidth`, using the central
classic defaults 960/1440; All Pages keeps its existing full-width policy.
Apple/iOS, Android and Generic native paths use the same preference behavior.

The setter and saved-preference boot no longer send DOM class-add/remove
requests. A setting applied before shell construction remains supported through
storage initialization. Downstream code that changes a live preference should
call the setter rather than only writing the storage key and relying on an
unrelated model publication to refresh the class. Custom CSS dimension overrides
remain a Web capability: native's prior fixed 960-point width did not support
them, and this correction does not introduce native custom-dimension parity.
## NSH native file requests use the system Open and Save dialogs

The existing native `Browser_ui.open_file_picker`, `download_text` and
`download_binary` operations now use the pinned NSH public `pick_paths` and
`pick_save_path` APIs. They run as application-owned deferred completions, so
an open dialog does not block the ordered OCaml input pump. No hidden picker
view, DOM mutation implementation, extra overlay or NSH fork API is introduced.

Open-file requests preserve the integer `request` token and receive one
`files-picked` response with selected file metadata, an empty `files` array on
cancel, or `error`. NSH directory selection enumerates regular files off the
application owner and provides `/`-separated selected-root-relative paths plus
absolute selected paths. It does not follow directory links or copy every file
into base64. Contents continue through the existing asynchronous native file
reader; files can change between selection and that read, as with ordinary
native file selections. Extension filters such as `.md,.txt` use the native
dialog; MIME/UTI filters remain unsupported by this NSH path. Folder selection
does not apply file filters, so imports can still inspect configuration/assets.

NSH downloads add a canonical string `request-id` to the existing host envelope.
`file-download-result` echoes it after Save cancellation, an error, or completion
of an atomic sibling-file replacement at the user-selected destination. Text
uses UTF-8; binary export preserves every byte. The MIME value remains metadata;
the suggested filename supplies the native extension. Existing Apple/iOS,
Android and other native host payloads remain unchanged.

Every accepted file-service execution produces its correlated terminal event,
including failure to join an off-owner metadata or export task. Those failures
cannot bypass completion bookkeeping through a generic service error.

Pending NSH picker/export completions participate in `Ui_task.Activity`.
Update preparation refuses new requests, drains accepted filesystem work and
suppresses picker callbacks that would initiate new UI actions while fenced.
Application retirement releases pending completion hooks and drops callbacks;
late or duplicate replies cannot target a new request. No callback token is
reused after reinitialization.

Downstream callers keep their existing API, for example:

```ocaml
Browser_ui.open_file_picker ~accept:".md,.txt" on_files;
Browser_ui.download_binary ~filename:"graph.sqlite"
  ~mime:"application/octet-stream" bytes
```

Native dialog behavior on macOS, Windows and Linux still requires runtime
qualification. Headless public-dialog tests and the compiled native activity
fixture cover protocol/ownership behavior; they do not establish OS dialog UX.

## Anonymous property popup anchors use point placement

`Properties_popup.open_from_anchor` now constructs mutually exclusive placement
branches. Anchors with a retained identifier continue to use `anchor-target`,
side, alignment and offsets. An anonymous anchor uses only the measured popup
coordinates, including the existing below/right coordinate adjustment. Point
placement no longer also emits element-anchor properties, which the canonical
contract correctly rejects.

For example, selecting a page emoji and reopening its icon picker can create an
anonymous `.ls-page-icon` anchor. That picker now reopens through the valid point
branch. No caller signatures or event payloads change, and the same correction
applies to NSH, Apple/iOS, Android and Web. Callers with a live retained anchor
should continue supplying its identifier for native anchor tracking.
## NSH keyboard navigation reveals rows in their explicit scroll owner

The native `scroll-row-into-view` service used by command-palette and editor
autocomplete navigation is now implemented through NSH's existing public
measurement, scroll observation and `ElementRef::scroll_to` APIs. The request
keeps its existing `scroller` and `row` references. It scrolls only the nearest
vertical canonical Scroll/List owner, by the minimum distance needed to show
the row, preserving horizontal offset. Autocomplete group headings participate
in the top edge, matching the existing Web helper.

Both references retain their captured incarnations across asynchronous layout.
Missing or replaced rows, incorrect owners and unavailable layout are errors;
they never become successful no-ops or measurements of a replacement node.
No persistent offset cache or second scroll controller is added. Downstream
callers keep using `Ui_services.dom_scroll_row_into_view ~scroller ~row`, for
example after moving a keyboard highlight. Apple/iOS, Android and Web producers
and delivery paths are unchanged.

## Closing an already closed command palette leaves search persistence unchanged

Only an open command-palette session now persists its search state and cancels
that session's pending requests. Repeating `Cmdk_state.close` while the palette
is closed is inert. Previously a global command such as T L could save the
forced Commands filter left behind by a nonpersisting command-palette session.
Opening Search afterward then incorrectly searched only commands.

For example, open Commands with Cmd/Ctrl+Shift+P, close it, toggle a sidebar
with T L, and reopen Search with Cmd/Ctrl+K. Search now restores the last real
search query and filter. Downstream callers can keep calling `close` before
global command actions; no API or event payload changes are required. The
correction applies to the shared state on NSH, Apple/iOS, Android and Web.

## NSH global shortcuts use the effective shared keymap

The native runner now installs one application-owned native keymap from the
current OCaml `Keymap_data` catalog and user overrides. The new internal
`native-keymap` host message carries revision, command scopes, individual chord
strokes, palette state and keyboard-recording state. The ordered `native-key`
reply supplies the existing document key event fields and, for a focused block
editor, its retained node ID. Document capture runs before the editor conduit;
consumed or retired-target keys do not reach that conduit.

Cmd/Ctrl+K, the command palette and nonediting sequences such as T L and T R now
reach their shared handlers even when no block editor is focused. Binding edits
replace native registrations when their revision changes. Native text inputs
retain their ordinary editing keys; focused editor fallback keys remain owned by
the existing conduit, with one shared stroke table preventing duplicate delivery.
Palette navigation and keyboard recording register only while those scopes are
active. OS-reserved strokes remain owned by the operating system.

Applications require no API changes. Maintained Apple/iOS, Android and Web event
routes are unchanged. Rebuild both the native OCaml library and Rust host together
because the new internal host messages are required as a pair. The required
startup gate exercises native keymap dispatch into the compiled real application;
AppKit responder and hardware focus still require native-window qualification.

## The native publication gate mounts deferred application surfaces

`real_application_startup_preflight` now opens the actual compiled Settings dialog
and every pane, a nested sync URL dialog, Search and its Commands filter, the
right sidebar, and the Pages route through public native-engine input. Each step
checks the actual application agent barrier and rejects renderer failure, in
addition to requiring the expected mounted native content. Existing Appearance
and shell resize/menu checks remain required.

A release whose startup Journal works but whose deferred Settings URL/style is
unsupported now fails publication before launching the normal window. This is
headless native-engine contract evidence; AppKit rendering, hardware input,
platform motion, editor selection/drag, and unexercised application surfaces still
require their own qualification. No application API migration is required.

The same publication test additionally mounts the known graph creation, login,
import/export, sync/publish URL, graph open/remove, plugins, quick-add and
collaborator dialog bodies through the existing `logseq-dom` document carrier.
Each body owns a fresh private child process, graph root and worker; all scenario
failures are collected in one publication attempt. Branch selection through this
existing semantic event does not establish native trigger hit testing or the
business completion of login/import/export/publishing actions.

## NSH uses the bundled Inter faces before its first layout

The native runner and its actual startup qualification now register the existing
bundled Inter Regular, Light, Medium, Semibold, Bold and italic faces through
NSH `Root::font` before rendering. Naming Inter in theme tokens previously fell
back to a system font on machines without an installed Inter family; copying
font files into Resources alone did not register them.

No caller theme change is needed. A theme naming Inter now resolves the same
application faces without requiring OS-wide font installation. Applications
embedding the Logseq Rust root should apply `with_bundled_fonts(root)` to their
root as the standalone runner does. Maintained Apple/iOS, Android and Web font
loading is unchanged.

## NSH block bullets reach the shared outline controller

Displayed block bullets now opt into the same native pointer/document bridge as
block content. A native bullet activation reaches the existing zoom handler, and
Shift activation retains the existing open-in-sidebar behavior. Pointer down is
also delivered to the shared drag controller. This does not by itself qualify
move/drop targeting or hardware drag behavior.

No application call-site changes are required. Apple, Android and Web retain
their current host event ownership.

## NSH trailing add-block rows route native activation

The shared trailing add-block row now opts into native pointer and press-detail
events on NSH, using the same document event bridge as displayed block content.
An empty Journal/page and the trailing row after existing blocks now reach the
existing `Editor_keys` append action with their original parent-page and scope
attributes. Hover restores full opacity for the trailing row.

No caller API migration is required: existing `Add_button.el ~puuid ~flags` calls
retain their signature. Web and Apple hosts keep their existing document-event
ownership; no second direct append handler is installed.

## Packaged NSH native startup requires visible Journal bounds

The optional macOS `qualify_packaged_startup.py --native-background` gate now
requires the existing `native-bounds` host operation. Before its first screenshot,
it requires positive intersecting AppKit window-content bounds for the canonical
main Scroll, Journals region and the dated title discovered in that subtree.
Missing, hidden, transparent, offscreen or truncated native evidence cannot pass
by retaining an otherwise successful semantic tree. The result retains the
actual replies in `journalBody.nativeBounds`. A `hello.backend_error` rejects
qualification immediately.

For example, an installed archive whose agent still returns the dated Journal
node after a renderer rejection now fails this native gate; rebuild the archive
with the corrected renderer and repeat the same qualification command. The
existing Headless gate and maintained Web, Apple/iOS and Android paths are
unchanged. This does not assert pixel parity or hardware input and does not
require activating the application or making its window key.

## NSH click activation is never time-coalesced

The native document event bridge now selects click coalescing from the active
application backend profile. NSH emits one activation per native press, so it
delivers every click, including two controls activated within 60ms and repeated
activation of the same control. The Apple host retains the legacy duplicate
monitor/control coalescing behavior. Web and Android paths are unchanged.

No application API migration is required. For example, clicking a page link and
immediately clicking a block now reaches both delegated handlers on NSH; the
second click no longer silently disappears in the legacy 60ms window.

## Native editor geometry preserves soft-wrap caret affinity

An NSH `offset-at` response now contains `affinity: "upstream" | "downstream"`
alongside the UTF-8 byte `offset`. The same source offset can be the end of one
visual row or the start of its successor. `caret-rect` accepts that affinity and
echoes it; omitted request affinity retains the previous downstream default.
Invalid dynamic affinity values are rejected. Native reply caches key caret
rectangles by block, offset and affinity, and retain the existing geometry epoch
and source/layout guards. There is no additional text shaper or hit cache.

The shared model records `caret_affinity`; initial click resolution and vertical
navigation retain the native hit position through overlay measurement. Source
edits and ordinary byte-based selection calls default to downstream. End/Document
End use upstream, and line membership respects affinity at a soft-wrap boundary.
Insertion and range replacement continue to use the same source byte offset.

Custom editor conduits must migrate from `caret_rect off` to
`caret_rect ~affinity off`, and from `offset_at : int option` to
`offset_at : Edit_model.position option`. For example, a downstream-only adapter
can return `Some (Edit_model.position off)` and accept `~affinity:_`; an adapter
with native hit information returns
`Some (Edit_model.position ~affinity:Edit_model.Upstream off)`. NSH initialization
explicitly enables the affinity wire. Other native hosts retain their existing
byte-only requests/replies and downstream geometry; Web keeps its existing
unit representation and default hit semantics while accepting the typed conduit.

The regressions cover shared model line membership/insertion, hit-to-overlay
propagation, independent native conduit replies and epoch rejection, and a real
CoreText wrapped multibyte layout whose upstream hit returns a caret on the same
visual row. They do not qualify hardware typing or IME.

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
`updater.dialog/installation-unavailable-description` after a successful save.
Save or ownership failures return their specific error after release acknowledgement. No successful preparation returns an
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


## NSH committed block-editor text geometry (2026-11-12)

The native application now implements `caret-rect`, `selection-rects`,
`offset-at`, `line-ranges`, and `scroll-height` using the approved NSH
`ElementRef.text_geometry` API. Queries target the existing `.ed-line` text
blocks and use the exact attributed string and span identities committed by the
platform text engine. No alternative text shaper, document buffer, persistent
geometry cache, or offscreen materialization is introduced.

NSH fragment views carry `ls-editor-run-<index>` span identifiers scoped to their
logical line. Atomic block-reference rows receive a containing text span so the
engine exposes their attachment interval. Display labels and landing pads do not
become source. Native UTF-16 boundaries convert to LUI UTF-8 byte offsets;
hidden delimiters are excluded from hit targets, and clicking an atomic display
uses the existing shared editor's interior-offset reveal behavior.

Native measurement requests now include `geometry-epoch`, and NSH replies echo
it. For example, `offset-at` receives
`{"block-id":"<uuid>","geometry-epoch":7,"x":120,"y":8}` and replies with the
same identity/coordinates plus `offset` in source bytes. The OCaml adapter rejects
an echoed epoch after an edit, remount, or disposal. Existing native hosts may
continue returning replies without this additive field. NSH also rejects stale
source-version/run/composition snapshots, replaced nodes, and layout answers
whose committed text or scroll/window coordinate space changed while awaiting a
query. Unavailable/culled geometry remains unavailable and is retried by the
existing shared editor lifecycle.

No application API changes are required. Existing caret and selection rectangles
remain relative to the editor's root-view origin; caret replies include `ox`/`oy`
for viewport popup anchoring. NSH's page scale is included when projecting text
content coordinates into this space.

## NSH visual-line source coverage (2026-11-12)

Native `line-ranges` replies now partition each logical line's complete source
range at the committed text engine's visual-line starts. Hidden Markdown
markers and spaces omitted at a visual edge belong to an adjacent source
partition. For example, a wrapped `**long wrapped text** suffix` with the
caret outside the bold span returns a first range starting at byte `0`,
including the hidden opening marker, rather than starting at byte `2` and
being rejected by the shared editor's source-coverage check. The final range
ends at the logical line's source end; consecutive visual ranges are contiguous.

The wire shape remains `{"block-id":"<uuid>","geometry-epoch":0,"ranges":"0,12;12,34"}`
with UTF-8 byte offsets (illustrative boundaries; actual cuts come from native
layout). Hit tests still skip hidden markup, and caret/selection queries retain
their existing behavior. No application migration or maintained-host change is
required.

## NSH graph selector uses its retained native Menu owner

The graph selector now permanently attaches a canonical `context_menu` to its
existing Button on NSH. LUI already projects Button attachments through the public
NSH `Menu` trigger slot. NSH therefore owns open/close, keyboard traversal,
selection, outside dismissal and focus return; there is no point-positioned proxy
or external menu-role popover. Graph footer actions use `menu_item` on NSH so
selection closes that same native controller. Other hosts keep their model-owned
popover and Button footer actions.

For native automation, select `prop:accessibility-identifier=graphs-selector-trigger`
and use `native-press`, then inspect the actual menu item with `native-bounds`.
The canonical menu attachment remains in the semantic tree while closed, so a
successful semantic `find` alone does not establish that it is displayed. The
packaged native gate now opens/closes the graph selector and checks native bounds,
then opens More and Appearance. These source gates require execution against a
fresh package; their presence is not evidence of a passing native flow.


## NSH Favorites actions use the retained Button's native Menu

Favorites and Recent rows attach their action items permanently to the real dots
Button on NSH. Opening the Button activates NSH's existing `Menu` controller; the
sidebar's `open_menu` value now tracks only the row's active appearance. Native
Menu dismissal clears that appearance. Action items use canonical `menu_item`
selection instead of passive rows. Keyboard focus within the native row also
keeps the actions visible. Other hosts retain the existing point-positioned
popover and pointer anchor behavior.

Downstream native automation should activate the actual action Button with
`native-press` and inspect native menu item bounds. Sending a semantic PressDetail
only updates row appearance and does not simulate the native controller. The
compiled native contract fixture exercises real constructor validation, appearance
and dismissal routing; native pointer/keyboard usability still requires the
running app flow. This change does not implement row secondary-click menus or
other external menu-role popovers.
## NSH editor clipboard events use the shared controller

The NSH block editor now sets its native Input to `PasteBehavior::Report` outside
IME composition. Native paste supplies its event-time plain text, HTML, captured
image bytes and copied local-file URLs to the existing `logseq-editor` `dom-event`
channel as a document `paste` event. `nodeId` identifies the retained editor sink;
`clipboardData` uses the existing native file snapshot shape (`data-b64` for
captured bytes, `path` for local files). Copied local-file paths are dispatched immediately without filesystem access;
their bytes are read off the application owner through the existing native file
channel when the upload asks. Malformed URLs are rejected before dispatch;
unreadable paths fail explicitly through that file channel.
No clipboard re-read, shadow document, alternate block parser or clipboard cache
is introduced. The shared controller continues to own internal tree paste,
HTML-to-Markdown conversion, paragraph splitting and asset uploads. Input's
default text insertion is disabled for that event, so the paste is applied once.
During marked-text composition, the existing native Input insertion/composition
path remains in charge.

Focused editor Cmd/Ctrl+C and Cmd/Ctrl+X now emit shared `copy`/`cut` document
events. The existing selected-source-text and collapsed block-reference copy
policies remain authoritative. Cmd/Ctrl+Shift+C and Cmd/Ctrl+Shift+V go through
the existing shared editor key handlers for whole-block text copy and paste into
one block. This changes no Web or maintained mobile adapter API.

The public NSH Input has no `on_copy`/`on_cut` interception for platform-native
Edit menu and context-menu actions. Those selectors still use native Input
behavior and require a reviewed public seam before claiming full clipboard UX
parity. Native paste from those menus does use `on_paste`. The added retained
Input, native facade and actual shared-copy regressions do not qualify hardware
clipboard actions, IME combinations or platform file access on all desktops.


## File snapshot sizes can be unknown until an asynchronous read

`Ui_services.file.file_size` and the size element of `clipboard_files` are now
`float option`: `Some size` records known event-time metadata, and `None` means
an unread native path supplied no size snapshot. Diagnostic JSON represents the
latter as `null`. Web `File` and captured-image metadata remain known; adapter
records migrate from `file_size = n` to `file_size = Some n`. Code that needs an
exact persisted size must read `file_binary ()` and use the returned byte length,
as asset uploads and database backup decisions now do. Unknown size is never
represented by zero and never triggers a synchronous filesystem metadata query.

Native `Browser_ui.file_buffer` reads paths and decodes captured binary data on
a file worker, then settles its existing Promise through the application Host
mailbox. There is no new input queue, clipboard cache or delayed paste event.
The shared paste/upload activation captures its existing graph, route and editor
owner immediately; subsequent typing stays in order and the existing upload
checks use the current buffer when the file completes. Ending that activation
still prevents a stale upload from mutating a different editor or graph.


## Native application route Links opt into the existing click controller

Shared Settings edit Links, property date/reference Links, table reference-group
headers, publishing navigation and breadcrumb Links now explicitly reuse
`Ui_parts.delegated_link` on NSH. Generic faded Links and markup URL helpers use
`Ui_parts.routed_link ~url`, which opts in only for `#/` application routes.
This keeps their authored href and forwards native activation modifiers through
the existing document click/default-action controller; that controller already
updates native hash navigation and history. Bare `#` delegated action Links keep
their existing explicit handler. Web, Apple and Android retain host click delivery.

Application helpers should use, for example,
`Ui_parts.routed_link ~url (Lui_elements.link ~url ~text [])` when a destination
may be an application hash or an external URL. A relative external destination
such as `assets/readme.md` receives no application press handler and remains
subject to the NSH URL boundary validation. The backend does not accept arbitrary
relative URLs or invent their navigation behavior.

## NSH scrolling uses explicit native viewport owners

`Ui_components.scroll_column` preserves the CSS overflow column on Web and the
maintained hosts, and uses an actual vertical NSH Scroll with one unbounded
content column on desktop. Constraints, surface identity and chrome stay on the
scroll owner; gap and content padding remain on its child. For example, a bounded
settings navigation pane must use `scroll_column ~max_height:480 children`, rather
than applying ``Prop.overflow `auto`` to an ordinary Column.

Native Menu surfaces already provide their own scrolling. `menu_surface` therefore
keeps the shared surface chrome without applying CSS overflow on NSH. Rich popup
callers use `scroll_body ~max_height` or `~max_height_viewport` around their content
and retain CSS surface overflow on the other hosts. `css_scroll` is only the CSS
surface half of that composition; it does not provide native scrolling by itself.
The backend still rejects unsupported CSS overflow instead of silently clipping
content or pretending a plain element is scrollable.

Native alert-dialog cards use that bounded Scroll composition. Right-sidebar
header actions use a horizontal Scroll on NSH; Web keeps its CSS row. Favorites
and Recent contents borrow the native sidebar's existing Scroll instead of
adding another CSS overflow owner. Their other hosts retain the original styles.

## Property pickers and plugin panes have native Scroll owners

On NSH, closed-value property pickers, date pickers, trigger-owned property dialogs,
plugin lists and plugin settings use explicit native Scroll nodes. Their content
remains unbounded inside the owner. The closed-value picker retains its viewport
height cap; date pickers retain viewport height minus 16; compact property phases
retain 288 pixels and date phases their existing viewport bound. Plugin settings
retain the 30–70 percent viewport limits. Plugin lists retain both the 80 percent
cap and the viewport-minus-320-pixel toolbar height.

CSS, Apple and Android paths keep their original bodies and CSS overflow behavior.
No application should replace unsupported CSS overflow with content clipping.
`Ui_services.viewport_height_signal ~scheduler ~scope` is available beside the
existing width signal for calculated native bounds. It publishes actual viewport
height on resize and disposes its listener/signal with the supplied scope. For
example, a native Scroll height can bind through
`Ui_parts.int_prop Lui_protocol.HeightValue ~value:(reactive calculate viewport)`.


## Native point-anchored property dialogs scroll their rich body

The point-anchored property workflow now places its existing body inside a real
NSH Scroll owner. Its height follows the same available room below the anchor
(viewport height minus anchor y minus eight pixels), including height-only window
resizes. The inner body remains unbounded and retains its canonical node identity;
only the Scroll and surface bounds change. Native available room clamps to zero
when the anchor is below the resized viewport, preserving the nonnegative wire
contract. Other hosts retain their existing surface and body.

`Properties_dialog.point_popup ~x ~y body` is the common application composition
used by the real workflow and its long-body native contract fixture. That fixture
checks owner structure, mounted actions and resize retention; a semantic action
on an offscreen row does not qualify native scrolling or physical hit testing.
Those require the native engine/window flow against a fresh release.

## NSH target builds check literal presentation before opening a window

The desktop build now reads the `.cmt` files belonging to its four actual native
archives. Compiler-resolved `Lui_elements` constructor calls and public
`Ui_parts.Prop` literal encoders generate a temporary probe; the probe calls
those exact compiled APIs and exports their wire values with the application's
computed light/dark theme snapshots. `Ui_parts.Prop.to_wire` exposes the existing
immutable encoded pair for this read-only tooling. No property vocabulary or
capability matrix is maintained separately.

The candidate executable's `--validate-native-styles` command checks that
manifest with the same Rust theme resolver and style compiler used at runtime.
Both Unix desktop and Windows build paths run it before startup qualification
and publication. Failures identify the authored native source location. Native
host comparisons and their local boolean aliases select the NSH branches;
Web-only CSS literals remain valid in their own branches.

This is a presentation gate, not whole-program interpretation: arbitrary
computed values, missing scoped theme variables, opaque helper applications,
retained event ownership and platform layout still require boundary validation
and real application qualification. The report records captured literal sites
and deferred scoped-variable checks. It does not claim those dynamic paths have
been statically proved or that every conditional route has been exercised.
## Native OCaml primitives return boxed OCaml values

`logseq_lui_wakeup` and `logseq_lui_platform_request`, bound by OCaml as
`unit -> unit` and `string -> unit`, now use `CAMLprim value` signatures, root
their arguments and explicitly return `Val_unit`. Their host callbacks keep the
existing C `void` ABI. Application code and wire messages do not change. Any
embedding that directly called the primitive as a host `void` function must use
the registered host callback instead; OCaml primitives require the runtime lock
and boxed arguments.

The prior C `void` implementations could tail-call a host callback and return
its arbitrary machine-register residue to OCaml. The real macOS crash report
`logseq-nsh-2026-11-12-164859.ips` records `caml_format_exception` receiving
`0x1c`; the matching embedded library UUID is
`F38BB3D8-BD73-34B9-A926-4A42B81A0FC8`. Disassembly of that exact library shows
both primitives tail-branching into their `void` host callbacks, and the exported
platform-event bridge applying the legacy exception-result encoding test. An
ordinary return residue of `0x1e` satisfies that test and decodes to `0x1c`.
This explains why the OCaml exception logger did not run: no OCaml exception
was raised. The return-value correction addresses the malformed result; normal
OCaml exception diagnostics remain intact.

Both Unix and Windows native build paths now parse the actual native OCaml
external declarations with the compiler's parser and compile the real C bridge
in the same translation unit as derived boxed-value prototypes. Wrong return
types and argument counts become C compiler errors before application startup.
Unsupported external calling-convention attributes fail explicitly and require
an ABI derivation rather than silently treating them as ordinary boxed calls.
For example, `external wakeup : unit -> unit = "logseq_lui_wakeup"` requires
`CAMLprim value logseq_lui_wakeup(value unit)` and an explicit `Val_unit` result.

The existing actual-native admission runner includes the real bridge once and
installs test-only host callbacks that deliberately leave `0x1e` in the return
register. It exercises actual `Ffi.platform_event -> Host.enqueue -> wakeup`
and update-result `platform_request` paths, then confirms the queued state
change survives. The existing throwing-callback/GC regression remains enabled.
The primitive-signature native suite also compiles rejected `void` and wrong
arity definitions. These checks do not replace a real application session or
qualify unrelated native UI behavior.

## Native style preflight explicitly builds its archive typedtrees

Release native archives may exist without every implementation `.cmt` file.
The style gate now asks its compiler-libs extractor for the exact unit table of
those actual `.cmxa` archives, then requests all corresponding native byte-object
CMT targets in one Dune build. It inherits the selected release/development
profile and local LUI `OCAMLPATH`; no Dune rules are changed. For example, the
actual contracts archive's `Ui_task` unit requests
`src/contracts/.logseq_ui_contracts.objs/byte/ui_task.cmt`.

Inspection still fails when a requested native typedtree is missing. It never
substitutes Melange output, scans stale object directories or skips an archive
unit. Regression helpers supplied with an already compiled `cmts` fixture use
that fixture directly and do not rebuild unrelated archive typedtrees.

## NSH command-palette input follows its controlled state

The command-palette adapter now accepts its actual `host` when creating
services; native Chrome and sidebar search supply their mounted profile. NSH query restore, clearing and filter changes use the existing
`Cmdk_state` signal already bound to the retained Input. They no longer send the
redundant imperative DOM `set-value` operation. Generic/Apple native hosts retain
their existing mirror. For example, the native Chrome creates services with
`Cmdk_host.services ~host:(Lui_ui.host context) ()`.

Restored queries still focus and select their contents. Native selection lengths
now count UTF-16 units, so `中😀` selects three units rather than seven UTF-8 bytes.
The compiled native regression mounts the production input row, restores and
clears that query, checks retained identity and actual focus/selection requests,
and rejects any NSH `set-value` request. This is not a general no-op for imperative
DOM setters; other callers still require their own authoritative input owners.

## Bound the native icon picker body before requesting virtual rows

The 408px picker now gives its growing body Scroll a zero height basis and
zero minimum height. Its existing Scroll remains the sole viewport owner; the
complete Emoji and icon sources remain available. Intrinsic virtual content
extent must not set the height of a Scroll inside a shrink-to-fit popup. Other
backends retain the same header/body allocation and item choice behavior.

For similar finite popups, use `scroll ~grow:1. ~height:0 ~min_height:0` under
the finite-height column rather than allowing the full source extent to become
the body's intrinsic minimum. Do not truncate the source or add a second
viewport/cache. The required actual-application native preflight now opens the
Journal icon action, switches to both complete datasets, checks bounded
materialization and resolved body bounds, drags the native Scroll to the final
source row, and activates its last item. This complements the recording-host
window tests; it does not substitute for AppKit raster/input or release RSS
measurement. No caller or graph data migration is required.
## Preserve semantic native Menu trigger identity

`Views_head.action_button` accepts an optional `?key` and forwards it to the
canonical Button. Existing callers remain source compatible on every backend.
The view-type action uses its per-view `vtype-<id>` key, and Favorites/Recent
menu actions use their owning row key. This preserves the same trigger and Menu
controller across sibling insertion, reorder and metadata changes. It does not
change Menu opening, dismissal or event semantics.

When rebuilding a toolbar whose ordinary and menu-bearing Buttons can change
positions, identify each action semantically:

```ocaml
Views_head.action_button ~key:"export" ~label:(I18n.t "view/export-edn")
  ~on_press:(fun _ -> export ()) []
```

An `accessibility_identifier` remains an accessibility/automation identifier;
it does not replace the reconciliation key. The dynamic NSH boundary still
rejects changing a retained trigger's native attachment mode.

The native admission runner now accepts `--ppx /absolute/path/to/ppx.exe` for
its reactive view fixture, matching the existing virtual-row runner. Without
that option it uses the installed `lui.ppx` package. It invokes no Dune rules
and continues to link the actual already-built native application archives.
## Native literal preflight follows immutable local aliases

The actual-target typedtree pass now follows immutable literal bindings by
compiler identifier, including strings, polymorphic variants, literal tuples
and options. For example, both `let size = "invalid" in Prop.font_size size`
and `let size = Some "invalid" in Lui_elements.text ?font_size:size []` reach
the existing public encoders and the actual NSH style validator. An immutable
`"auto"` or `` `auto`` alias cannot bypass the native Scroll-owner check.
Local shadowing and backend branch selection retain their compiler identities;
Web-only values behind a proven host branch remain valid.

The extractor reads compiler-declared aliases from each CMT's environment
summary only along the module prefix being checked. It does not eagerly load
unrelated opened modules. For example, `module Props = Ui_parts.Prop` now reaches
the same encoder as `Ui_parts.Prop`, including through a host guard; it no longer
disappears from capture. Negative compile fixtures require the
actual candidate provider's offending-value diagnostic. An empty capture or
an unrelated OCaml/C compilation failure cannot count as a rejected style call.

The pass evaluates no application function, dereferences no mutable storage,
and does not execute signals. Literal syntax expansion is bounded to 512 nodes, including substituted aliases,
so large generated data bindings do not impose unbounded preflight expansion;
values outside that analysis remain deferred to the runtime boundary. Constant
analysis does not add a second presentation grammar.

Source-capture diagnostics now count deferred property calls and constructor
calls containing unresolved arguments, with separate optional/required argument
counts. Unknown optional values are no longer silently dropped from the coverage
report. Known arguments on the same constructor are still checked through its
real encoder; a constructor requiring unknown mandatory arguments remains deferred.
These counts describe captured syntax, not exhaustive UI or dynamic-value coverage.
## Native calendar and legacy comment fields reset through their owners

The NSH calendar repeat-frequency field is a canonical controlled TextField.
Its scoped draft commits on Enter or blur. Invalid values restore the existing
positive frequency through the field's TextValue binding; valid values update
the existing repeat model and worker operation. An authoritative frequency
change replaces a draft based on an older value. Other backends retain their
numeric input and existing DOM restore/focus behavior.

`Editor_commands.commit_freq` now requires `~restore`, so each caller explicitly
provides its field owner rather than implicitly performing a DOM mutation:

```ocaml
Editor_commands.commit_freq
  ~restore:(fun frequency -> Signal.set draft (string_of_int frequency)) value
```

Legacy Comments areas on NSH use one scoped, controlled textarea draft per
reply owner. `Comments_ops.submit_value area_uuid ~value ~current ~clear`
submits through the existing operation path and clears only if the original
owner, graph and draft remain current after the asynchronous write. A newer
draft or disposed owner is preserved. The DOM-oriented `Comments_ops.submit`
facade remains available for existing non-NSH consumers and keeps its behavior;
no global native DOM setter or extra draft registry is introduced.

The authored `native/comments.ml` reply box implements this contract separately
from `src/blocks/comments.ml`; the native target does not copy that shared view.
Its NSH field binds TextValue to its scoped draft, and its submit callback clears
through that owner. Apple/iOS and other native hosts retain their prior field
and submission behavior. The calendar target does copy `editor_commands.ml`,
so its NSH controlled frequency field uses the shared implementation.

The actual native admission fixture exercises invalid/valid frequency commits,
external frequency updates, concurrent comment drafts, successful clearing and
post-disposal completion. Source preparation does not establish that the
compiled native checks have passed; the primary build owner runs them serially.

## NSH build diagnostic for proven reactive display topology changes

The actual native-target presentation gate now rejects a direct reactive display
projection whose finite literal return paths include both `contents` and another
display value. It checks compiler-resolved `Ui_parts.string_prop DisplayValue`
bindings and canonical `Lui_elements` constructor display bindings after the real
LUI PPX expansion. The diagnostic names the source location before application
startup; it is not a backend-blind restriction in the shared PPX.

For example, `~value:(reactive (fun width -> if width >= 640. then "contents"
else "none") viewport)` cannot retain one NSH node across those topology modes.
Use `"block"`/`"none"` for native visibility or remount a structural branch.
Static `contents`, constant `contents` projections and reactive `block`/`none`
remain valid. Select the physical form in the `NshHost` branch to retain an
existing `contents`/`none` implementation on other backends. Unknown projections
remain subject to the existing dynamic host validation; no user function or
signal source is evaluated by this source analysis.

## Native pointer and delegated Link events expose the existing Alt input

The NSH native document bridge decodes the new canonical pointer/press Alt bit
16 into `altKey`, alongside unchanged Ctrl=1, Shift=2 and Meta=4. For example,
a `PointerMove` whose mask is 23 now reaches the shared controller with all four
modifier booleans true. Delegated native Link clicks decode the same Alt bit.

The native C bridge continues to transport the complete integer mask without a
signature or payload-layout change; a real exported-entry regression preserves
mask 31, including the separate secondary-pointer-button bit 8. This does not
change `ToggleChangedDetail`, whose distinct Alt=8 mask remains unchanged.
Web/mobile document event producers retain their existing modifier booleans.
This bridge change alone does not enable native block dragging or qualify
physical Alt-key continuity during an AppKit drag.
