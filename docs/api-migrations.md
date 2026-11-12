# API migrations

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
