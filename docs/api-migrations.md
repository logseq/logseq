# API migrations

## Group partitions, property areas and editor controls use typed exact spacing

The four grouped List/Table partition producers now apply their authored 8pt top
padding to the existing Column through `Ui_components.Prop.padding_top`. Their
existing border style, grouping, pagination and selection owners are retained.
For example, the previous inline `padding-top:8px` is now
`Ui_components.with_props [Ui_components.Prop.padding_top 8] existing_column`.
The grouped selection regression mounts the actual table partition producer and
keeps its auto-sized owner through select/clear/bulk-selection updates.

Both empty and populated block property-area branches apply their authored 45pt
leading inset to the same existing Column; class-property explanatory text uses
its authored 20pt leading margin. Editor calendar controls use the existing
typed 8pt top and 4pt bottom margins. The repeat panel applies its authored 8pt
leading padding through the typed channel. Existing model sources, callbacks,
keys, text state and Web/mobile APIs remain unchanged. There is no additional
layout node, fixed height, new constructor parameter or wire field.

This clears nine of the fourteen literal constructor layout diagnostics in
these three modules. Five still need a faithful owner/API decision: the class
heading and bidirectional title's `display:flex;width:100%`, the bidirectional
area's `width:100%`, the calendar's `max-width:100%`, and the repeat panel's
explicit `box-sizing:border-box`. Native NSH's underlying default is border-box,
but that alone does not establish a generic Web/Apple/Android projection rule;
the explicit declaration remains until its portable contract is resolved.
Axis-specific borders remain in their existing style carriers, not replaced by
an all-edge border with different behavior. The separate natural-language
calendar input helper also still authors `margin-top:0.5rem`; integer-point
spacing cannot preserve an unknown root-font-dependent value by rounding it.
No native layout-carrier diagnostic is disabled or exempted by this migration.

## Shared page and preview blocks project the same clipping contract

The static `Page.blocks_inner`, signal-driven `Page.blocks_area` and
`Popups_view.pv_popover` block documents now put their already-authored
`overflow=hidden` on the existing typed owner. Their Web-only style carrier
has been removed, matching the right-sidebar projection. Existing keys,
minimums, margins, block rows, virtual/keyed switching, context data attributes,
callbacks and scroll ownership remain. No wrapper, fixed height, constructor
or wire change is introduced.

Web retains the existing authored clipping. NSH and maintained Apple/iOS and
Android receive that same canonical property rather than relying on a CSS
string. The shared producer regression covers all three real producers and
keeps clipping/rows/owner identity through keyed document changes. Actual
native page, preview, large-document and editor geometry remain application
qualification gates; this contract projection does not claim a general
correction to unclipped descendant overflow computation.

The inventory is limited to literal overflow-hidden carriers in active shared
page/popup/sidebar producers. Explicit non-NSH overflow-auto styles, Web-only
input/scroll effects and other spacing declarations are unchanged and are not
counted as solved by this migration.

## Page, sidebar and plugin owners project exact authored layout through typed props

Twenty existing constructor sites now express their already-authored integer
spacing or relative positioning through the canonical layout channel. Page and
journal block-list wrappers retain their keys and `data-level`/virtual-scroller
markers while receiving typed relative positioning. Right-sidebar bodies keep
their 8pt top inset; the existing page wrapper keeps 12pt horizontal and 20pt
bottom margins, and its inner owner keeps 64pt bottom padding. Help headings,
the Help root and breadcrumb retain their original exact integer margins.

Plugin controls, card headers/metadata/actions and the settings identifier use
their authored 12pt/6pt/8pt/4pt spacing on the same nodes. The JSON settings editor
keeps 4pt padding with a 12pt leading override, 32pt bottom margin and -4pt leading
margin. Its existing text state, textarea, Reset/Save handlers and source remain
unchanged. No new native view, fixed height, new API or wire field is introduced.
Web and mobile receive the same authored values through the existing typed props.

For example, `data_attrs:["style", "padding-top:8px"]` becomes
`Ui_components.with_props [Ui_components.Prop.padding_top 8] existing_view`.
The wrapper applies properties to the existing owner; it does not add a node.
Non-layout metadata and explicitly Web-only branches retain their contracts.

This is a bounded migration, not completion of the native layout-carrier gate.
The following exact source declarations still require a faithful API/owner
decision and must not be silently rounded, removed or translated to viewport
coordinates merely to pass preflight:

- Page breadcrumb `max-width:100%`, six other page/journal percentage-size
  constructor sites, title-caret theme-dependent `calc(...)` top positioning,
  title-control `0.125rem` padding, and title content's axis-specific
  `overflow-x:visible`. Current dimensions/margins are integer points;
  container-relative frames have a distinct container-sizing contract and are
  not a generic parent-percentage replacement.
- Three Help-item constructors use `display:list-item`/circle markers, and
  their parent has a 19.2px leading margin. The canonical display vocabulary
  has no list-item value and integer margins cannot represent 19.2 exactly.
- The installed-plugin menu uses `top:100%`; a fixed point offset does not
  express its parent-relative placement.

The page `overflow:hidden` sites are covered by the shared clipping migration
above. The separately prepared actual-target preflight rejects unresolved
literal layout carriers; integrating it remains pending while those authored
requirements are migrated. This change adds no exemption or bypass.

## Native ordinary code uses the master's 1024pt maximum viewport

The NSH `logseq-codemirror` factory now constrains the existing native Editor to
1024pt maximum height for ordinary block and query code. Previously its
`min_rows=Some(1)` let the native viewport expand to the full document height.
The default matches frozen master's `.CodeMirror { max-height: 1024px }`.
Short code still grows from one row; the change does not impose a fixed height,
truncate source or set an arbitrary maximum number of lines.

For example, an ordinary `source-role="block"` or `"query"` document with
100,000 lines now uses NSH Editor's own scrolling/visible-row window within
that maximum. An authored language normalizing to `calc` retains master's
explicit uncapped exception; switching `" CALC "` to `" CLJ "` or `"rust"`
updates the same Editor's height constraint and highlighter. The existing
source key, document, Undo history, focus and read-only/query behavior remain
owned by that Editor. No wire schema, public constructor or host API changes
are required downstream.

The public Headless regression's finite bounds, complete native edit/Undo and
retained owner are not physical-memory measurements. Standalone large-code
memory and native shaping/interaction must be requalified after rebuilding;
failed pre-change workloads are not picker-memory results.

## Right sidebar blocks use their authored clipping on native hosts

The existing right-sidebar `.ls-page-blocks` owner now receives typed
`overflow=hidden` through `Ui_components.Prop.overflow`. Its previous
`data-attrs` style carrier expressed the same Web clipping but supplied no
native layout property. Other data attributes, including the inner sidebar
context marker, remain intact. No wrapper, fixed document height, scroll offset,
constructor or wire shape is introduced; callers keep the same sidebar API.

The exact actual-App primitive replay with all original content, theme and
fonts reported 1424pt scroll content while descendant frames occupied 1118pt.
Projecting the already-authored clipping alone reported 1118pt, with the same
960pt card and all real children. This establishes the missing application
clipping contract; the deeper source of the unclipped descendant overflow is
still unresolved and no SDK correction is claimed. The actual native end/return
wheel gate remains required after rebuilding this producer.

The shared producer regression checks the canonical clipping property on the
same auto-sized owner and retained block rows across content updates. Web keeps
its existing clipping behavior, now through the same typed property used by
NSH, Apple/iOS and Android.

## Selection action bars follow their anchor owner

The selection action bar now keys its popover by the outliner scope and mounted
anchor block. Extending or shrinking a selection retains the popup while its
first mounted selected block stays the same. Crossing that block during reverse
selection, or unmounting it during virtualization, retires the old anchored popup
and mounts one for the new block. The action callbacks still use the current
selection and existing stale-selection guards. No constructor or wire changes
are required on any backend.

For example, expanding `B` to `B,C` keeps B's action bar; changing to `A,B`
creates A's action bar instead of changing a retained NSH popup's native anchor.
Application code must give a retained anchored popup a new key when changing its
anchor owner; changing selection membership alone does not require a new key.

## NSH generic DOM requests retain absence across commit

Generic native DOM services now resolve their canonical target exactly once,
when the host captures the request. A missing target remains absent through
`AfterCommit`: for example, `measure-node` for `{"#ref":"search"}` captured
before the canonical search field exists returns its correlated `rect:null`
reply even if a later patch creates that identifier before native commit.
Other supported generic commands retain their existing empty-result behavior
for a missing target. Retired/replaced owners cannot redirect a pending request;
a retained owner remains valid if its identifier is renamed.

Callers must publish the canonical owner before issuing its generic focus,
selection, scrolling or measurement request. Native mounting and layout may
still finish at commit; an existing canonical owner does not need to have a
native view yet. Do not use a missing identifier as a request to adopt a future
node. Intentional late block-editor creation continues through the existing
`set-input-focus` / editor-geometry route: `EditorOwner` captures the existing
block row and admits only its own later editor while that row remains current.
No wire shape or constructor changes are required. Web and maintained mobile
hosts are unchanged.

## Native callback outcomes are decoded before GC rooting

The application C bridge now uses a private typed callback outcome for every
OCaml callback arity. The unsafe exceptional encoding from `caml_callback*_exn`
is decoded without allocation before a payload enters any `CAMLlocal` root.
Patch, document, agent, snapshot, input and sparse-feedback entries retain their
existing exported signatures, return codes, exception diagnostics and successful
patch/reply ordering. Downstream hosts require no migration.

Within this bridge translation unit, the familiar `caml_callback*_exn` names
also resolve to the typed outcome wrappers. Code such as
`root = caml_callback_exn(closure, argument)` is now a mandatory C type error;
bridge maintainers must test the outcome's `raised` field and root its decoded
`payload`, or pass the outcome to the existing private `emit_patch` helper.
The existing primitive-signature gate includes rejected root assignments for
all four callback arities. The existing native FFI fixture covers throwing and
subsequently successful real entries, checks the actual registered roots during
diagnostics and performs full-major collection while those decoded roots live.
These regressions require native qualification; source preparation alone is not
a passing result.

## NSH sidebar content fills the remaining viewport

The left Favorites/Recent viewport and the right panel viewport now use typed
`height=0`, `grow=1` and `min-height=0` on NSH. The zero height supplies a finite
flex basis; the parent allocates the remaining height after its intrinsic
header and navigation. A long intrinsic document no longer shares its sizing
deficit with that header. For example, 36 Favorites in a 560pt window previously
compressed the navigation rows to 9–10pt even though their authored height was
32pt. The document remains full-sized inside the existing native Scroll.

This changes neither a fixed viewport budget nor canonical shrink defaults.
The existing titlebar minimum, graph/navigation dimensions, right topbar,
content keys, callbacks and native scroll identities remain. Emptying or
repopulating Favorites retains those owners. Apple/iOS, Android and Web omit
this NSH-specific height and keep their existing sizing. No constructor or wire
migration is required; application callers keep the same sidebar API.

The actual producer regression checks the backend-specific viewport contract
and retained identities across content changes. Real native short-window header
bounds, populated Favorites/Recent wheel range and the analogous right panel
remain application geometry qualification gates.

## Native code Copy reads the active document before persistence

The native OCaml code toolbar's existing `Code_mirror.copy_button uuid` now
copies `Editor_actions.live_buffer uuid` when that block owns the active edit
session. It previously read the persisted block title, so Copy immediately
after typing could return old text before the existing 400ms save and model
refresh completed. An active empty document copies an empty string. Inactive
code blocks keep their stored-source fallback; another block's editing session
cannot supply their text. Callers need no argument or event changes.

The clipboard transport, copied notification, save debounce, native editor
identity and history remain unchanged. Web CodeMirror already reads its live
document. The native admission regression exercises real focus/input/Copy
callbacks before persistence; actual native pointer/focus and OS clipboard
readback remain separate application qualification gates.

## Native code actions overlay the retained editor

On NSH the existing code action row is now positioned four points from the
editor wrap's top/right rather than consuming a separate document row. Its
existing ghost Buttons use master's compact 16pt height/minimum and 12pt text recipe;
the same language/Copy handlers and accessible controls remain installed.

The retained wrap owns one scoped hover/focus-within state slot. Controlled
source re-renders reuse that slot; disposing its owner releases it. One
state-to-read-only conversion at initialization supplies the existing recipe's
optional visibility source, and normal Row reactive opacity owns its derived
binding. Pointer entry or contained
keyboard focus reveals the action row; leaving both restores opacity zero.
Only that row's opacity changes, through its existing 300ms ease-in transition
and native reduced-motion policy. No display-none, disabled flag, focus manager,
timer, native Editor remount or document/history replacement is used for this
visibility. Web and maintained mobile hosts keep their existing composition
and stylesheet behavior. Actual native placement, keyboard focus, language
selection and Copy still require their normal application qualification gates.

## Code blocks keep one visible language caption

The separate `.extensions__code-lang` node inside a fenced code editor is now
hidden through the existing typed display property. Frozen master and the Web
stylesheet already hide that node; native hosts previously displayed it beside
the Editor while the language selector showed the same caption above it. The
language selector remains the visible, enabled action. The hidden node keeps
its existing key and text, and the code extension retains its UUID, source role,
language and value. No editor remount, selection/history change, constructor or
wire change is introduced. Toolbar hover/placement remains a separate native
qualification requirement.

## The native application forwards container focus-within events

The actual Logseq OCaml bridge now exports the existing LUI
`lui_ocaml_focus_within_changed(int64_t node, int32_t within)` ABI and registers
its matching typed callback. Standard `row`, `column` and `box`
`on_focus_within` handlers receive both entry and loss through the existing
application dispatch, update-admission and patch channel. For example, leaving
the calendar year input invokes its retained owner's loss handler so an
unfinished draft restores the accepted year. A disposed owner never receives
the callback. No view argument, event ordinal, queue or maintained backend API
changes.

All native application builders require this symbol in their existing shared
application-ABI inventory before invoking native compilation. The candidate
library symbol check also requires it before schemas, startup qualification or
publication. An application bridge that omits container focus support is thus a
build failure, rather than a first-focus runtime diagnostic. Generic LUI
libraries still retain their optional capability contract; this requirement
belongs to the actual Logseq application that authors these handlers.

Full native publishers also compare this inventory against the optional event
exports loaded by the exact `lui-nsh` package selected in their locked Cargo
metadata. A future optional event symbol therefore requires an explicit bridge
inventory review before application compilation, even if no startup view happens
to exercise it. The bounded literal `Exports` loader shape is checked fail-closed
with a review diagnostic; generic clock/startup drivers remain separate. The
existing candidate-library symbol check still verifies the compiled artifact.

## Native code language choices scroll inside their popup

The native code language picker now uses the existing `Ui_components.scroll_body`
helper around its choices. On NSH, the retained Popover already caps available
height; its Scroll child makes all 31 choices reachable when that cap clips the
list. For example, Rust can be scrolled into view before activating its original
MenuItem. No extra fixed height, duplicated menu actions or global popup policy
is introduced.

The existing toolbar, UUID-specific selection callback, popup dismissal and code
editor identity are unchanged. Other native backends keep the same body through
the helper, and Web keeps its existing picker. No constructor or wire migration
is required. The actual native producer regression checks every choice and its
Scroll ancestry; real NSH wheel, activation, persisted language and editor history
remain separate application qualification gates.

## Toast content stays within the native toast card

The shared toast content overlay now grows into the existing toast's available
width and permits its body/message or code column to shrink. Long notification
text wraps within that width instead of giving the overlay an intrinsic width
larger than its card and pushing the complete 32-by-32 close target beyond the
right border. No fixed content width, new component or extra scroll owner is
introduced. The existing NSH Toast/ToastStack, viewport placement, timeout,
hover/focus pause, dismissal and retained notification identity are unchanged.
Downstream callers use the same toast API on all maintained backends.

## NSH code editors fill their horizontal parent

The native CodeMirror adapter now explicitly sizes its retained root to the
parent width. A code-display block's canonical `code-editor` Row can have valid
positive bounds while a bare keyed-region root collapses to zero intrinsic
width around its percent-width NSH Editor. The previous direct column/stretch
fixture did not expose that production layout.

The explicit full-width View replaces the View NSH already creates implicitly
for a region root; it does not add a second outer layout node. The existing
`(source-role, uuid)` key still owns the Editor, document, history and input
callbacks. Value/language changes retain that Editor; changing source identity
replaces it. No caller migration, schema, event payload or default editor prop
changes. Web CodeMirror and the Apple/iOS and Android backends are unchanged.

The regression uses the actual registered CodeMirror factory/schema under the
same canonical grow Row as `Render.code_block`, requiring materialized width,
minimum row height, actual native input and retained identity on controlled
echo. The real application fence/edit/language gates remain required for native
rendering, focus, worker persistence and screenshot qualification.

## Calendar year drafts restore the accepted year on blur

The shared calendar retains partial or invalid year text while its year input is
focused, without changing the displayed month or selecting a date. Leaving that
input restores the latest accepted calendar year, matching the existing master
calendar behavior. For example, typing `20` in a February 2024 calendar and
moving focus away restores `2024`; typing `2025` updates the calendar grid without
calling `on_pick`. Month navigation and date selection also clear an unfinished
year draft.

Accepted year input must contain exactly four characters and remain within the
existing supported range, 1000 through 9999. A padded value such as `02024` is an
unfinished draft rather than a different representation of 2024. No constructor
argument changes; the year input retains its identity across draft and grid
updates on all maintained backends.

## Settings reuses its native menu's update owner

The NSH settings General pane restores master's Check for updates button in the
existing version row. Its label reuses `settings.general/check-for-updates` for
that exact existing action and role. It is disabled until the host confirms an
installed update source and while the same updater/preparation is busy. It
does not create another updater or install a cached archive without checking.

`Ui_services.t.desktop_updates` is an optional typed host service with
`current`, scoped `subscribe`, and `check`. Existing custom service records
must add `desktop_updates = None` when unsupported. The maintained Web,
Apple/iOS and Android adapters preserve their existing behavior with no NSH
request path. NSH exposes the service through its native adapter; views use
`desktop_updates_signal ~scheduler ~scope service`, whose subscription and leaf
signal retire with the view. A retained old callback cannot flush a new view.

On the existing application pump, `application-update-check` accepts exactly
an empty object and invokes the retained menu owner's public LUI Check action.
`application-updater-state` carries required boolean `configured` and `busy`
fields. The menu publishes its own existing phase/preparation state; OCaml
validates the boundary and ignores queued updates from a retired application.
No extra queue, installer endpoint, polling timer or backend API flag is added.

## Standalone NSH installation owns its native restart

The actual Rust main now captures its installed executable, original arguments,
working directory and environment before any update can move the application.
It constructs `relaunch::Session::root`, whose internal Rust component supplies
the process owner to the existing application menu. Default `App` roots and
embedded hosts keep the save-and-refuse policy because they do not own a process
to restart; no LUI wire or JS prop is added.

The standalone menu obtains an existing `InstallLease` only after the correlated
OCaml preparation has saved and stopped every proven owned worker. Cancellation
and known pre-replacement failures keep the existing abort/restoration protocol.
After installation dispatch, unknown outcomes and restart failure keep writes
closed. The final callback requests public native `quit`; the captured runner
acts only after `run_app` returns, without reading the moved N1 executable path.

Unix replaces the process image at the captured installed path with `exec`.
Windows starts that same path using normal `Command` argument quoting, adding
the internal `--nsh-restart-after <pid> <creation-time> <remote-event> [original arguments]`
handoff. Before credentials, installation admission, workers or windows start,
the child opens a non-inheritable exact parent process handle, verifies its
creation time, duplicates the parent's exact unnamed event into a local handle,
signals capture, and waits for the process handle to signal exit.
The old process remains alive until capture is acknowledged. Timeout or failure
does not start application services; only the parent's newly spawned child can
be cleaned up after a failed handoff. No shell, helper executable, SDK restart
internals or global process registry is used.

Private `--startup-preflight` roots and the existing no-login-daemon setting
remain attached to the original arguments/environment. The next process drops
the same artifact-loader overrides excluded by packaged-startup qualification,
including the old OCaml-library, asset and worker overrides. It then resolves
the new package's normal resources. The user's profile, storage, credential
policy and other environment values stay intact.

This is a source candidate pending actual native compilation and the private
actual-Logseq N1-to-N2 install/relaunch/data gate. It has not been run against
an installed user application or a developer trust store. Complete application,
platform packaging/signing and rollback qualification remain required before
shipping this standalone policy.

The existing explicit `--startup-preflight` launch also emits one console JSON
record containing the Rust-compiled canonical release version and process ID.
Private upgrade qualification pairs this with the existing settings view's
OCaml `Version.app`, exact executable/library/worker hashes and persisted data.
The marker is neither installation permission nor a claim of N2 readiness.

After native quit, a failed exec/spawn cannot roll installed files back or
restore the disposed old UI. The runner reports the failure and exits without
reopening writes or old workers. The private qualifier must preserve code,
process and stderr evidence for this fail-closed outcome. Filesystem replacement
and any rollback before this point remain owned by the existing signed updater.

The Windows remote event boundary uses only the
[public DuplicateHandle source-process contract](https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-duplicatehandle).
Only its newly duplicated local handle is owned/closed; the remote value is
never dereferenced or closed in the new process. The protocol changes neither
process's standard input/output/error streams.

## Icon color changes paint retained cells

Changing the icon palette now updates each mounted Tabler button's existing
foreground binding. Color is excluded from the result-content shape comparison,
so it does not rebuild the virtual source, change its generation/window, replace
the cells, or reset the far-down Scroll and search input. Emoji glyphs retain
their own colors; icon choice still reads the current selected preset.

This is a shared-view identity/performance correction with no new parameter,
wire event, imperative scroll, timer or artificial viewport feedback. Query and
tab changes keep their explicit result-viewport reset behavior.

## Datetime property pills retain their local time

Numeric datetime values now show zero-padded local `HH:mm` beside the date link,
matching master. Scalar values wrapped under `logseq.property/value` use the same
projection. Date-only journal references and midnight datetime values do not gain
a time label. The clock text is separate from the navigation link and is not
selectable, preserving the master interaction.

Formatting uses the existing host local-time fields; the stored epoch, timezone
interpretation, calendar controls, edit/cancel callbacks and persistence path are
unchanged. This adds no backend API or parameter and preserves maintained Web and
mobile behavior through the shared view. No translation key is needed for the
existing numeric 24-hour time format.

## Icon picker result viewports reset with the tab and query

Changing the icon picker tab, editing its search query, or clearing search now
creates a fresh result Scroll owner at the beginning of that result set. This
restores the master picker reset behavior: switching from the last Icons row to
Emojis, or changing an end-of-list filter to a short/empty result, cannot retain
the previous result set's far-down offset. Native virtual rows remain bounded.

Only the result viewport is keyed by tab/query/reset identity. Palette opening,
color changes and asynchronous search-result publication keep that viewport;
query edits keep the existing search input and surrounding picker. The existing
tab-specific search reset behavior, chosen icon payload and callbacks are
unchanged. No new DOM/Scroll operation, timer or backend API is introduced.

## Native input capability preflight uses the runtime provider policy

The actual native target gate now rejects statically authored unsupported
TimeField options and color input before application startup. Callback presence
is taken from the compiler's typed application; the probe substitutes an inert
callback and never executes application handlers. The extractor already captured
`on_dismiss` correctly; the missing validation was the style-only provider gate.
That gate now reuses the renderer's pure input capability policy in LUI.
Navigation callback presence is captured in the same way, so a known
`on_navigate` cannot be dropped as an unknown function and hide the native
TimeField restriction. Optional forwarded callbacks whose presence is unknown
remain deferred.

Constructor result types use the same compiler-resolved module aliases as call
heads. For example, `module Input = Lui_elements` followed by
``Input.input ~kind:`time ~text ?on_dismiss:(Some cancel) []`` now reaches the
same capability check even when `text` is dynamic. The probe substitutes an
inert callback, preserves dynamic value deferral, and distinguishes shadowed
modules by compiler identity. No application callback or user function is run.

Dynamic or omitted time text stays at the existing runtime value boundary,
while known read-only, autofocus, navigation, dismissal and nonempty-placeholder
options are rejected for native TimeField. None/absent callbacks remain valid.
Actual target branch pruning preserves the Web/mobile time and color alternatives;
there is no backend-blind constructor restriction, source callback evaluation or
new wire operation. Applications should select a text field for cancelable
native time drafts. Runtime value-before-option error priority is unchanged.

## Native audio assets use the platform streaming player

The canonical `logseq-audio` extension now owns a public NSH `AudioPlayer`.
Audio files and recorded `Audio-*` WebM blocks no longer render as images or
open an external player. The native controls provide play/pause, keyboard and
pointer seeking, volume, elapsed/total time, buffering and platform error text.
Audio cells retain the controls' intrinsic height rather than clipping them to
the image thumbnail's 30px limit. New control labels use `asset.audio/*` keys.

The source uses the same `data-asset-graph` and optional `data-asset-file`
resource contract as managed files, plus `src` and a JSON `labels` object with
`play`, `pause`, `seek`, `volume` and `loading`. Local filenames resolve through
the existing resource owner; remote sources require HTTP(S). Arbitrary schemes,
missing labels and autoplay are rejected during actual target admission.

Playback starts only on user activation. Control requests obey disabled state,
application quiescence, exact retained incarnation, captured graph and source.
Graph close, source replacement and view disposal retire the owned player.
Playback identity includes the captured graph as well as the resolved source:
switching graphs retires playback even when both graphs resolve the same URL or
filesystem path. The asset's optional `aria-label` names a semantic group around
its controls. Audio control labels include English and Simplified Chinese text.
Progress is driven by the platform event stream; idle players do not poll,
load or autoplay, and this adds no OCaml request queue or media cache.

The native archive fixture checks the real emitted audio factory. A contained
Headless fixture authors its own tiny PCM WAV and inspects public AudioCall
commands for source ownership, play/pause, seek, volume and close, with actual
stream events driving progress/end state. Headless uses NSH's fake audio backend
and does not qualify real decoding, sound output or native OS playback. Those
results and visual layout remain separate platform qualification.

## Native asset views distinguish image, video, PDF and generic files

Native asset blocks and file cells classify the stored extension without case
sensitivity. Image assets keep the image loader; video blocks now use the typed
`media_surface` and NSH's native video controls. PDF labels retain their in-app
document opener and capture graph identity. Generic files display the asset
title and extension instead of attempting to decode the file as an image.

Generic activation is restricted to canonical `logseq-a` elements carrying
`data-asset-graph` plus either `data-asset-file` or an explicit validated source.
For example, `data-asset-graph="graph-id" data-asset-file="uuid.txt"` resolves
through the existing resource owner and calls NSH `open_path`; explicit HTTP(S)
sources use `open_url`. This does not grant default navigation to arbitrary raw
anchors. Closed/different graphs, disabled links, update quiescence and retired
element incarnations cannot issue an open request. Platform failures use the
existing `platform-error` completion channel. No new OCaml request queue is added.
Both file activation and audio controls recheck the captured graph, source,
owner and mutation admission after notifying the application's click handler.
For example, a click callback that closes the graph or prepares an update cannot
then open the previous graph's file or resume its audio. A callback that only
changes presentation attributes retains the accepted file action.

The native archive fixture checks emitted Image/MediaSurface/managed-link kinds,
source ownership and labels. Headless tests inspect actual native OpenPath
commands and refusal boundaries. Actual video decoding, playback and visual
layout remain separate platform qualification; audio playback is a separate
native factory change.

## Native inline PDF links use the installed document opener

`![Report](../assets/report.pdf)` now reaches the native PDF extension through
the existing `Render_inline.pdf_link_press` hook. Relative filenames and the
`assets/`, `./assets/`, and `../assets/` prefixes resolve within the active graph's
asset directory. URL path escapes decode once; absolute OS filenames remain
literal. Local `file:` URLs are accepted, while remote hosts, traversal,
malformed escapes, credentials, queries and fragments are rejected. HTTP(S)
PDF documents still require a separate native download/reader implementation.

The inline press captures its graph identity. Retained links cannot open after
graph close or against a different graph. The hook type and Web opener remain
unchanged; this adds the same stale-graph protection to Web inline presses.
This wires document activation only: in-app PDF rendering remains macOS PDFKit;
Linux and Windows PDF reader support is not supplied by this change.

Qualification: `nsh/run_update_preparation_native.py` compiles a fixture against
the actual native archives and dispatches the retained inline press, checking
the resulting `Pdf_state` document and graph/path boundaries. It does not load
a PDFKit view or claim visual PDF rendering qualification.

## Owned-worker qualification includes durable canonical native reference drops

`nsh/run_owned_worker_update_native.py --worker <newly-built-native-worker>` adds
an `outliner` case to its existing contained protocol and coordinator cases.
The case creates a real `Worker_client` and uses its application-session
transport for every seed, mutation and database query. It mounts the shared
keyed outliner/editor views in a recording native backend and dispatches
canonical document down/move/up events through `Native_embed` and the existing
native drag controller. Row geometry is authored fixture data; host commands
are recorded without fabricated replies. This does not qualify NSH hit testing,
native focus, physical dragging or physically held Alt.

A successful run proves a fresh reference UUID and actual `block/refs` edge,
source/child retention, before/after/append-child ordering, and a dirty source
save preceding the insertion in the actual worker operation vector. The new
editor conduit must mount only after the inserted block arrives through the
real canonical refresh. The native view scope then retires, the exact worker
is cleanly stopped and replaced, and the same client verifies every persisted
row/order/parent/title and reference edge again. Application error toasts
and failed refreshes reject the case. No shipping inspection API or test flag
is added to the application.

The JSON result adds `outlinerDropQualified`, `outlinerInstances`,
`outlinerCases` and `outlinerInput: "canonical-events-with-fixture-geometry"`.
Existing protocol, coordinator and installer fields retain their meanings;
the new fields describe only the contained case when its assertions pass.

## Native build arguments retain system Bash 3.2 support

`deps/ui/nsh/build.sh` now keeps the shared Cargo argument vector nonempty under
`set -u`. The default development build and explicit `--release` retain their
existing profiles, output directories and exact Cargo build/test arguments;
manifest paths containing spaces remain one argument. An explicit empty string
or unsupported input argument still fails before build tooling. The publication plumbing fixture
uses macOS `/bin/bash` explicitly and checks both complete argument vectors;
it models compilers and does not replace the actual native qualification gate.

## Native Alt drag inserts a single-block reference

The native outliner now reads Alt from the accepted primary pointer release.
Dragging one block with Alt inserts a new block titled `[[source-uuid]]`, keeps
the source in place, and enters the new block's editor after the ordinary
structural refresh. An existing dirty editor is committed first through the
existing save path. The sibling zone inserts after the target, the top zone
inserts before it, and the nested zone appends after its existing children.
This follows `frontend.handler.dnd/move-blocks` and `api-insert-new-block!` at
the frozen comparison source `29fd2edd`.

The single-block decision counts selection membership before pruning selected
descendants. For example, selecting a parent and its child and releasing with
Alt still moves the parent tree; it does not insert a reference. A single
reference can be inserted into the source's descendant because it creates no
structural move cycle. Self-targets and readonly native targets remain refused.
Ordinary moves retain their ancestor and selected-target restrictions.

The shared `Editor_actions.can_drop_dragged_block` and `drop_dragged_block`
helpers accept optional `~alt:true`; omitted arguments retain their previous
move behavior. The native document controller supplies `ev.alt` for target
admission and the final action. Existing Web/mobile callers omit the argument
and keep their current behavior. No pointer wire fields or modifier mask bits
change in this migration.

The native action regression projects release events through `Ui_dom_native`
and the actual native drag controller, then checks the worker operation and
one-shot click suppression. It does not claim physical held-Alt input or
persisted database qualification; the public macOS test driver still lacks
held-key support.

## Owned-worker qualification includes the actual two-worker preparation owner

`nsh/run_owned_worker_update_native.py --worker <newly-built-native-worker>` now
runs the existing single-worker protocol proof and a separate two-worker
coordinator proof through the same contained fixture driver. Each case starts
with fresh private storage, credentials, session and child ownership. The driver
links the actual `Native_embed` lifecycle and app archives; it does not introduce
an application flag, daemon endpoint or installation API.

The coordinator case persists data in both graphs, uses a real active
`Worker_client` transport with acknowledged SSE readiness, and checks both exact
clean child exits before accepting `prepared: true`. Abort must restore both
graphs, their durable data and the captured transport's SSE/probe before release.
A second preparation is cancelled at the completion of the first actual worker
stop: the first exact child has exited, the second remains sealed and alive, and
no second stop may be dispatched. Rollback must replace only the exited child,
abort the live worker's seal, and restore real finite RPC reads. The Python owner
checks each graph's runtime record, SQLite lock, integrity and endpoint state at
these explicit boundaries. It never infers exit from a protocol acknowledgement.

The resulting JSON additionally reports `coordinatorQualified` and the observed
`coordinatorInstances`; existing `stage2Qualified`, `instances` and installer
fields remain available. This proves only the exercised normal and partial-stop
cancellation paths when run successfully. Transport failure, retired-owner and
relaunch qualification remain separate; installation still issues no lease.

## Abandoned update preparation accepts eventual successful recovery

After an update preparation waiter is dropped, a failed matching `released`
acknowledgement keeps application admission fenced. Repeated failed recovery
acknowledgements for that abandoned request are inert; a later matching
successful `released` acknowledgement clears the reservation. Previously a
recorded failure made that eventual success look like a duplicate and could
leave the Rust fence permanently held after the native side recovered.

For example, cancellation followed by a failed worker restore can now retry the
same request and reopen admission only after the native owner proves recovery.
Live waiters still reject duplicate responses. Request identity, phase checks,
old-response handling and the requirement for a successful release proof remain
unchanged. This does not enable installation or grant an install lease.

Retiring the Rust preparation owner also retires its cleanup sender: dropping an
old waiter after `Preparation.close` sends no late `update-abort` into its former
application channel. A live cancelled owner still sends abort and requires the
matching successful release proof. This is owner retirement, not evidence that
native workers have recovered; the native coordinator retains its own fence
whenever shutdown or restoration remains unproven.

## Native update preparation coordinates all owned workers under one owner

The NSH `update-prepare` bridge now runs the exact worker lifecycle after the
existing editor save and finite activity/mailbox barrier. It holds ordinary
application and worker admission, captures the owned-worker snapshot and the
existing active transport, sorts canonical storage keys, and seals **all**
workers before stopping **any** worker. `prepared: true` requires every exact
child's clean exit and another barrier; shared, reused, unknown or mismatched
workers refuse preparation without acquiring installation authority.

Cancellation is intent until the current worker action settles. The same
preparation owner then aborts live sealed workers and restores independently
verified exited workers through their captured handles. Restoration/probe
failure on one worker does not skip recovery of the others. Successful recoveries
are retained; a matching later abort retries only failed recovery/readiness work.
Transport readiness does not start until every worker recovery is proven. A
readiness-only failure retries that readiness check without replaying successful
worker recoveries.
The original active transport is rebound through its captured same-repo closure,
including confirmed SSE readiness and a finite graph probe. Only after those
operations and nested activity/mailbox/model callbacks settle does the bridge
emit matching `released: true` and reopen admission. Failure emits
`released: false` and remains fenced.

For example, if workers A and B both seal, A exits, and cancellation arrives
while B stops, the owner first waits for B's operation. It restores every proven
exit and aborts any still-sealed worker; it never interprets an HTTP dispatch
acknowledgement as exit proof. A failed restoration of B can be retried without
repeating A's successful replacement or adopting a new graph/transport owner.
Normal worker calls remain refused during post-seal `Aborting`; the pre-seal save
path still admits its already accepted finite descendants.

Native admission now has a monotonic local reservation epoch. Retiring a
preparation prevents its callbacks from dispatching more stops or acknowledging
a newer reservation with the same decimal ID. Reset refuses while a real worker
seal/stop/restoration remains unproven; it never silently clears that fence.
A pre-seal/capture-only reset can retire its epoch because no remote worker state
has changed. These local callback guards are not a new wire incarnation token;
wire IDs and their application event-pump ownership remain unchanged.

`Update_preparation.start` accepts an optional native worker lifecycle. Existing
save-only callers omit it and retain their save/drain behavior. The actual NSH
bridge opts in; one preparation record owns the worker sequence, cancellation,
recovery and final release. There is no extra pump, worker registry or timer.
Owner-retirement/crash recovery that cannot prove restoration remains a held
failure; it is not qualified as an automatic application restart path.

The Rust menu still uses `refuse_after_save` and never issues an `InstallLease`.
Its final refusal now follows the actual worker recovery/released acknowledgement.
Unconfigured update feeds still perform no preparation or worker operations.
Whole-application installation remains disabled pending end-to-end multi-worker
partial rollback, owner retirement and relaunch qualification.

## Native update rollback restores exact worker and transport owners

The native coordinator can capture a deterministic owned-worker snapshot with
`Daemon_client.capture_update_workers ()`. The previous
`require_update_owned_workers ()` remains a unit-returning compatibility wrapper.
Unfinished child tokens, reused workers and shared workers still refuse capture.

`Daemon_client.Worker_update.restore_exited handle` restores only the handle's
captured storage and child after independently proving clean exit. A lost stop
acknowledgement remains insufficient; the exact retained child token must produce
`WEXITED 0`. Conflicting origins or attachments are preserved and rejected. A
successful retry verifies its recorded replacement instead of spawning again.
The replacement origin, exact child token and endpoint are recorded before its
first health probe. Transient 503 or transport failure retries within a finite
background deadline; later abort attempts can verify the same child again.
Unpublished startup remains unproven and cannot spawn another replacement.

Before stopping workers, capture
`let resume = Worker_client.capture_restore_after_update worker`. On rollback,
`resume ()` rebinds that client's existing transport, including when its endpoint
URL/port is unchanged. It waits for acknowledged SSE headers and a bounded finite
`create-or-open-db` response. Empty transports complete without starting SSE;
changes to the captured transport owner refuse restoration. Retired streams are
closed through their own socket and their queued messages are ignored. Native
fake clients constructing `Worker_client.t` records must additionally supply
`capture_restore_fn = (fun () -> fun () -> Js.Promise.resolve ())`.

These narrow hooks do not reopen input admission, reconstruct application/editor
state, issue installation leases or enable installation. The existing update
owner must keep both worker and application admission closed until restoration
and its usual activity/mailbox drain are acknowledged.

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

## Owned-child startup preserves failed attachment identity

The native client now registers each opaque child token immediately after
`Unix.create_process_env`, before querying its OS PID. If PID lookup or later
attachment fails, that token remains tracked with an unproven origin. Update
preparation refuses it, and another child is not spawned for the same canonical
storage/repo while that startup remains unproven. Normal reuse can still attach
a subsequently ready daemon for editing; reuse does not promote an unknown
origin into update authority. There is no generic process reaper or PID-based
cleanup. The original Windows handle stays owned until exact waiting consumes
it or the parent process exits.

For example, retrying a failed startup does not create a second unknown worker
for that graph. A clean application restart provides a fresh session; existing
persistent daemons remain subject to the normal external/shared update refusal.
The constructor's `on_created` publication callback receives only the opaque
new-child token, so a bounded failure fixture can retain and reap its own gated
child even if publication raises before the OS-PID lookup.

`nsh/run_owned_worker_update_native.py --worker <newly-built-native-worker>`
adds an explicit stage-two qualification driver over the actual app archives,
current C bridge and selected native worker. Its new fixture process uses fresh
private HOME, credentials, graph and lifecycle paths, with login-daemon creation
disabled. Containment is established before the stdin startup gate: a new POSIX
session or an unnamed Windows kill-on-close Job assigned through the exact new
process HANDLE. Cleanup controls only those newly created processes.

The fixture performs a real finite page mutation, verifies it, opens a real SSE
stream, seals and proves later work is refused, then aborts and proves normal
work resumes. A fresh request seals/stops the same worker and independently
awaits its exact clean child exit. A second actual worker reopens the private
graph and reads the durable mutation before its own sealed stop. The Python
driver also checks held/released SQLite ownership, ready/closed runtime records,
SQLite integrity and endpoint closure. This is opt-in test tooling; it adds no
shipping startup flag or control plane and enables no installation lease.

## Explicit owned-worker seal and shutdown capability remains disabled for installation

Native workers carrying the NSH process-origin descriptor now support
`POST /v1/nsh-update` with `X-Logseq-App-Session` and exactly:

```json
{"id":"<positive decimal request ID>","instance":"<spawn UUID>","action":"seal"}
```

`action` is `seal`, `abort` or `stop`. Successful replies carry `ok: true`, the
matching `id` and `instance`, and `phase: "sealed"`, `"open"` or `"stopping"`.
Malformed, mismatched, shared or invalid-state requests return HTTP 409 with
`ok: false` and a specific string `error` code. Wrong HTTP methods return 405.
These operations use the existing loopback worker, not a new daemon or installer.

Sealing atomically orders against ordinary finite request admission. Work already
admitted can finish; later ordinary requests receive HTTP 409 with the normal
structured error containing `code: "worker-update-sealed"`. Legacy clients keep
working before an explicit seal. Read-only health and OPTIONS remain available;
an SSE stream counts only its finite setup, not its connection lifetime. A
foreign client marks the process shared, including a rejected request after a
seal. Shared processes cannot start a stop. `nsh-app-ownership` health metadata
also adds `phase` (`open`, `sealed` or `stopping`). Existing health readers keep
ignoring unknown fields.

For example, `seal` request `7` can be released with `abort` request `7`. That
release is idempotent; its tombstone rejects a delayed seal of `7`. A seal of `8`
cannot be released by an old abort of `7`. Once `stop` is dispatched, abort returns
`worker-update-stop-dispatched`; neither the worker nor the client pretends it
can resume. Existing signed-update download and installation behavior is not
changed by these internal worker operations.

Stop waits for all finite reservations accepted before the seal, then invokes
the existing daemon stop lifecycle: close streams, stop DB sync, drain writes,
close the bound DB, release graph ownership and exit. Its HTTP `stopping` reply
acknowledges dispatch only. It does not prove graph closure or process exit.
The management request is excluded from the ordinary request drain, so it never
waits for itself.

The native client's explicit `Worker_update` helper requires a child token made
only by `Child_process.spawn`. It retains the actual unreaped child identifier
on POSIX and original process HANDLE on Windows, and uses `Unix.waitpid` on that
exact token. It never obtains stop authority from a registry PID or a liveness
probe. The original HANDLE remains owned until waiting consumes it or the parent
process exits; normal persistent worker lifetime is unchanged. OCaml 5.5.1's
[createprocess.c](https://github.com/ocaml/ocaml/blob/5.5.1/otherlibs/unix/createprocess.c)
returns that HANDLE, and
[winwait.c](https://github.com/ocaml/ocaml/blob/5.5.1/otherlibs/unix/winwait.c)
waits its termination and closes it. The existing consuming PID helper remains
available; the new private getter obtains the OS PID without consuming the
original HANDLE. No duplicated handle or custom process waiter is introduced.

Network and bounded exact-child exit checks run off the application owner. Only
`WEXITED 0` proves a clean stop. Nonzero, signalled, timed-out or otherwise unknown
exit leaves the client uncertain; an uncertain stop cannot abort or release.
Transport failure during seal or abort can only be resolved by a matching abort
acknowledgement, including a tombstone for a seal that never arrived.

Normal NSH preparation now invokes these management operations through the
single owner described above. **Installation still issues no `InstallLease`.**
Multi-worker partial rollback, owner-retirement/relaunch behavior and end-to-end
qualification remain prerequisites before enabling whole-application installation. Unconfigured updates
still do not create an updater, network operation or preparation event.

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
non-OPTIONS request comes from another session or has no session header. Until an explicit update seal, requests
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

This sampled check is not atomic exclusivity or completed shutdown proof. The
explicit stage-two capability above is separate and remains unused by normal
preparation. Final restoration/released coordination and a packaged relaunch
policy remain necessary before enabling installation.
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


## Structural editor completion owns the input gate before native callbacks

Opening an editor whose title is already available now releases the structural
input gate as soon as that operation finishes. Native promises may invoke
continuations synchronously; the operation now installs its exact owner and
stable completion promise before registering success or recovery callbacks.
Previously an already-resolved title could finish before it owned the gate,
leaving native Command+A and text input queued indefinitely.

The same owner continues to protect deferred worker operations. Accepted editor
input replays in order after the current operation completes; an older
completion cannot release or overwrite a newer operation, including one started
by an inline finish callback. Recovery retains rejection and cleanup semantics.
There is no new timer, polling, focus control, wire operation or downstream API.
Web retains its existing promise microtask behavior; Apple/iOS and Android
backends remain maintained. Applications need no migration.


### Outliner selection endpoints and toolbar dismissal

Nonediting block selection now retains a fixed anchor and an explicit moving
head in the existing outliner-scoped editor state. Repeated Shift+Up/Down and
Alt+Up/Down extend the same range; reversing direction removes its moving edge
before crossing the anchor. Collapsed descendants remain excluded. Plain arrows
replace a range with the adjacent row beyond its directional edge. Selection
entry, pointer ranges, editing entry and selection reset own both endpoints;
applications must not carry a keyboard head into another outliner scope.

Selection history cursors now include optional `selection-head` (selected UUID
or nil) alongside `selection-anchor`. New cursors restore both endpoints; older
cursors without this field restore the head to their saved anchor. For example,
`{selection-anchor: A, selection-head: C, selected-blocks: [A, B, C]}` shrinks to
`[A, B]` on Shift+Up after restoration. Dynamically supplied heads outside the
saved selected set are rejected at the history boundary.

The selection toolbar supplies the canonical popover `on_dismiss` callback.
Escape first dismisses its bar, and the next nonediting Escape clears selection;
`editor/escape-editing` follows the same rule when invoked outside editing.
Toolbar Copy clears selection and dismisses immediately, matching the frozen
master interaction. Clipboard success still requires the original write
acknowledgement and current owner: failure or a newer selection cannot record a
successful structured clipboard snapshot. Keyboard Copy keeps its selection.
Downstream toolbar callers that need master behavior should invoke
`Editor_actions.copy_selection_and_clear ()`; ordinary copy callers retain
`Editor_actions.copy_selection_text ()`.


### Native nonediting selection Escape ownership

The application-private `native-keymap` snapshot now requires a boolean
`block-selection`, published only while a block selection exists without an
active editor. Changes to this context republish the snapshot even when user
shortcut bindings have the same revision. The Rust consumer validates the field
and installs plain Escape with NSH `When::NotEditing` only for that context.
Unselected documents gain no Escape shortcut; focused form fields and block
editors keep their native keys. This does not bind the normally unbound
`editor/escape-editing` command or change Web/Apple/Android key registration.

The SDK appends its topmost overlay Cancel binding after component bindings.
Therefore Escape first dismisses selection actions, and a subsequent Escape
clears the remaining selection once the native overlay has retired. Palette and
keyboard-capture contexts reuse their existing deduplicated Escape path. Keep
producer and consumer together when updating the application-private snapshot;
there is no new LUI public wire field or downstream component parameter.


### Printable native shortcut prefixes preserve editor text

The native application keymap retains `When::Auto` for printable strokes without
Command/Control/Option modifiers even while the custom block editor owns focus. The
catalog's multi-stroke defaults are flattened into native registrations, so
`editor/toggle-number-list` (`t n`, `global-prevent-default`) previously installed
plain `t` and `n` as `When::Always` while editing. The native platform consumed
those characters before the text view; OCaml only observed an incomplete
command prefix and could not restore the text. Typing `draft` could become
`draf` through the actual AppKit keyboard path.

Plain and Shift character input now stays with the focused native editor.
Configured Command/Control/Option shortcuts, explicit keyboard capture and palette navigation keep
their existing ownership. Nonediting catalog sequences continue to dispatch;
there is no SDK change, extra input buffer, per-character delay or synthetic
replay. Web/Apple/Android registrations and user shortcut defaults are unchanged.
The focused native Input still owns composition, while its existing composing
signal suspends application bindings. Downstream callers need no API migration.

## Native scalar string cancellation

Native string property fields now opt into canonical input `on_dismiss`.
Cancellation clears the captured active edit owner and editing state before a
later native blur could submit the draft. The original value remains unchanged;
reopening starts from that original value. Number fields retain their existing
Escape-to-commit behavior through native blur submission. The Web window-keydown
handler remains unchanged and receives no duplicate dismissal callback.

For application text fields with cancelable drafts, use the input callback and
keep the application as the owner of the reset:

```ocaml
Lui_elements.text_field ~text:draft ~submit_on_blur:true
  ~on_dismiss:(fun _ -> cancel_owned_draft ()) []
```

Actual native style admission now captures statically present input dismissal
callbacks without executing them. NSH ``input ~kind:`time`` uses TimeField, whose
public API does not expose cancellation; an authored callback fails the actual
native preflight rather than being silently ignored. Other maintained backend
branches are pruned according to the actual native target as before. Dynamic
values retain provider validation.

### Selected property removal uses one captured transaction

The property dialog's remove workflow now submits one existing worker
`batch-remove-property` operation for its captured selected UUID list. It
previously sent one `remove-block-property` request per owner, creating multiple
transactions/undo entries and allowing earlier owners to change before a later
request failed. The worker validates the complete batch before mutation.

`Properties_data.batch_remove_property_for_repo ~origin_repo ~block_uuids ~ident`
uses the existing SDK origin-bound operation path. For example, removing `P`
from `[A; B]` sends one request with `batch-remove-property [[A; B]; P]` to the
captured graph, even if navigation happens while the request is constructed.
The SDK awaits refresh only for the originating current context; completion
closes only its own property dialog and cannot dismiss a newer workflow.
Validation failure rejects the batch without a per-owner retry or a success
refresh. Ordinary single-owner removal uses the same one-element batch.

No worker wire operation or public LUI contract changes. Selection defaults,
class-property handling and other property write workflows retain their
existing behavior. The dedicated Task-view status-preservation option remains
outside this change; this entry does not claim that separate master parity.

## Property choices clear their retained search

`Properties_select.view` now clears its query and remote result snapshot before
an accepted pointer or Enter choice, including new-option and free-text entry.
This restores master's default `clear-input-on-chosen?=true` behavior. For
example, choosing `Alpha` from a filtered multi-value picker leaves the picker
open with an empty input and all initial options; previously its old filter
remained. Selected values remain selected and the input node stays mounted.

Accepting a choice also retires the existing search ticket, so a pending reply
cannot restore the cleared filter. Disposed owners cannot update a replacement
picker. No new LUI callback, worker operation or component parameter is added.
Master's explicit library add-pages opt-out belongs to its separate picker path
and is unchanged.

## Scalar property drafts across property-area refreshes

A property-area refresh that changes another row now restores an active scalar
field's unsaved buffer instead of reinitializing it from persisted text. The
existing single active-editor owner captures the repo, surface, block UUID and
property ident; no additional draft registry or cache is introduced. Rebuilt
views adopt that edit and its stable text-field key. Retired view callbacks
cannot submit or clear the adopted draft.

```text
Stored string: original
User types: unsaved draft
Worker refreshes a sibling property
Active field: unsaved draft
Cancel, then reopen: original
```

An authoritative change to the edited source resets the controlled buffer to
that new stored value, matching master's persisted-value effect. Source identity
includes property/type/value identity and displayed text. The field stays in
editing mode with its existing key, while callbacks captured for the old source
lose authority. The same UUID/property in another repo or surface cannot adopt
the origin draft; a new edit must be opened there explicitly. Ordinary number
submission and string cancellation retain their established behavior.

The native regression uses the actual property-area read/refresh branch and
`Native_embed` text/dismiss/press entry points, including cancel/reopen and a
repo change. It does not itself establish AppKit first-responder behavior during
a live worker refresh; that UI interaction remains a separate native gate until
executed.


## Property areas and route regions are graph-owned

Route regions now include `Model.repo` in their structural identity. A
`Boot_graph_ready` transition rebuilds a normal page or journal region even
when the route, page UUID and page payload are identical. Diagnostic report
routes retain their existing independent state. Graph changes also retire the
existing subscribed page/journal item caches; ordinary same-graph navigation
and property refreshes keep their existing ownership rules.

Property areas reuse data only within the same graph and LUI application.
Their refresh contexts capture the exact registered area, rather than looking
up whichever area currently has the same UUID. Replies publish only to that
area while its graph remains current, and only the latest request may publish.
The guard deliberately does not use the global navigation revision: a valid
retained sidebar read must survive navigation within the same graph. Batched
block-property reads capture their graph when queued and retain one deduplicated
worker request per graph if a switch occurs before the deferred flush.

```text
Graph A, block U: type an unsaved scalar draft
Refresh another property in A: keep the draft and field identity
Open graph B with the same route, block U and stored properties:
  rebuild the region; do not adopt A's draft
A's old refresh, response or close callback arrives:
  do not refresh, overwrite or submit B's property editor
Open B's scalar editor: start from B's stored source
```

No application migration or worker protocol change is required. Internal
property context producers must construct their refresh callback after the
area has registered: use `Properties_state.capture_refresh key`, not a late
key-only lookup. The native entry regression mounts the real `Page.region`,
uses `Update.apply` with `Boot_graph_ready`, and retains the same route and
page payload without an artificial disposal or `Navigate_to`. It also retains
same-graph dirty-buffer, authoritative-source and cancellation checks. Native
OS graph-switch interaction remains a separate UI qualification.


The native latest-request regression uses two actually mounted block property
areas. Its first held read contains one UUID; a subsequent refresh of both
areas produces a distinct two-UUID batch. This preserves the native worker's
intentional identical-read coalescing while exercising an actual overlapping
request shape. An identical in-flight batch is not expected to increment the
underlying worker request count.

## Table title activation and editor return focus

Table title captions now preserve the reference application's modifier-click
behavior: Command-click on macOS or Ctrl-click elsewhere opens the row's page;
Shift-click opens the right sidebar. The platform primary modifier takes
precedence when Shift is also held. An ordinary click continues to open the
existing rich-text title editor. The existing ghost buttons are unchanged.
This uses canonical `PressModifiers`; there is no new LUI or worker wire field.

The table title editor's internal `show` call now requires an `on_close`
completion callback. Its originating mounted title captures the existing cell
handle and table/view context. Successful editor retirement restores that
cell's selected appearance and focus once, provided the originating scope,
graph, route/view and connected element are still current. Removed/replaced
rows and destination graphs do not inherit the completion. It does not select
the row checkbox, create a focus timer, or look up a replacement by identifier.

```ocaml
let on_close = Views_table.capture_cell_return context table
  ~row_uuid ~column:"block/title"
  (Ui_services.dom_by_id (Views_table.cell_id table row_uuid "block/title")) in
Table_title_editor.show ~anchor ~column_width ~on_close block
```

Shared recording-host regressions cover modifier precedence, exactly-once
completion, disconnected replacements, changed views/graphs, stale sessions
and disposed owners. These are application ownership checks, not AppKit
first-responder qualification. Generic NSH container `NavigationKey` projection
remains a separate backend gap; this change does not claim table arrow-key
parity or alter the maintained Web/mobile backends' event contracts.

## Calendar invalid text feedback

Submitting nonempty invalid text in the shared calendar now emits the existing
`date/invalid-date-warning` notification through the existing `ls:toast` document
event (`msg` and `cls="warning"`), handled by the application's notification
owner. It uses the calendar's existing translation callback. The calendar keeps its selected date, input identity
and open state; no property/filter write is issued. Empty or whitespace-only
submission remains silent, and cancelling an unsubmitted draft does not warn.
Valid dates keep the existing selection behavior on every maintained backend.

No application API, translation key or worker contract changes. This feedback
does not add natural-language parsing: native inputs such as `Next week` still
need the separate parser integration and compatibility qualification.

## Candidate asynchronous English date parsing for desktop calendars

The interim-backed candidate is not qualified for release. Its actual Rust
comparison fails the reference application's next-weekday behavior; retain that
failing expectation until the parser is replaced or a compatible engine is
qualified. The task/ownership API described below is independent of that engine
decision.

`Ui_services.time` now requires
`parse_natural : reference:float -> string -> float option Ui_task.t`.
Custom service factories must supply this field; the ordinary synchronous
`parse` field and `Ui_services.time_parse` retain their existing ISO, RFC and
journal-title behavior. Call the public `Ui_services.time_parse_natural` wrapper
with a finite, integral epoch-millisecond reference and at most 1024 input
string units. Invalid references and oversized input fail before host dispatch.
`None` means the text did not match; rejected tasks represent capability or
service failures, not invalid user dates.

```ocaml
(* Every custom time service must implement this typed field. *)
{ now; local_fields; of_fields; parse; fmt_date;
  parse_natural = (fun ~reference text -> parse_english ~reference text) }

(* The existing Ui_task owner cancels or discards stale results. *)
Ui_services.time_parse_natural
  ~reference:(Float.floor (Ui_services.time_now ())) "Next week"
```

Web uses the application's existing `chrono-node` 2.10.1 package. NSH uses pure
Rust `interim = 0.2.2`, with only `chrono_0_4`, and the already resolved
`chrono = 0.4.45` with local-clock support. No JavaScript engine is introduced
into the shipping native application. The published interim archive inspected
for this implementation has SHA-256
`4711cb91b46a8f9d5b8dc20531c49c968fa7806e8016ddc8f9ef9b09e065bc1e`.
Its public `parse_date_string` accepts an explicit reference and dialect; this
candidate chooses US English. That dialect does not reproduce the reference
application's next-weekday policy. Native non-NSH hosts reject natural-language parsing
before emitting a host operation; structured-date fast paths remain usable.
Their existing platform UI backends and mobile tools remain maintained.

The application host operation is `natural-date-parse`:

```json
{"request-id":"7","input":"Next week","reference-ms":1794528000000}
```

Its `natural-date-result` event echoes that positive decimal request identity
with exactly one result shape: `status="parsed"` and integer `epoch-ms`,
`status="no-match"`, or `status="error"` and nonempty `error`. The Rust boundary
rejects unknown request fields and enforces a 1024-byte UTF-8 input limit.
The native reference must fall within calendar years 1000–9999; an unsupported
reference returns a service error before local-timezone conversion.
Completions reuse the existing cancellable clipboard-write request owner,
with operation checks preventing one service from settling another's task.
Disposal cancels outstanding host tasks; late cancelled replies are ignored.

Calendars preserve strict local ISO-date validation and existing structured
fast paths. Only unresolved nonempty free text starts a task. The shared
calendar's optional `is_current` callback captures its application's existing
owner guard; property pickers capture their graph and mounted scope, table
filters use `Views_state.current_view`, and query builders retain their active
session guard. New input, a date/month/time choice, clear or disposal cancels
the current request. A reply must match its request ticket, live scope and
current application owner before choosing a date or showing a message. Editor
date popups capture their exact active popup, graph and application sender.
An ordinary same-owner model refresh does not invalidate a pending date result.
No-match uses `date/invalid-date-warning`; a failed service uses the distinct
`date/parse-service-error` error notification. Empty submission and cancellation
remain silent.

This is a bounded English parser, not `chrono-node` compatibility. The actual
comparison from Friday 2026-11-13 finds `next friday 8pm` resolving to that same
day in interim, while pinned `chrono-node` 2.10.1 resolves Friday 2026-11-20.
An absolute date without a time defaults to midnight in interim and noon in
the reference. The test's former assumption that `9999 January` was invalid
was itself incorrect; that is a valid absolute year, separate from the genuine
next-weekday mismatch. Whole-input matching also differs from phrase extraction.
No dialect switch or application keyword patch is accepted as a parity fix. The
published 0.2.2 Chrono adapter resolves offsets at the target local date, rejects
nonexistent local times and chooses the earlier instant for an ambiguous local
time unless an explicit offset selects otherwise. Its published DST regression
source was inspected; this change does not claim an executed OS-timezone or
AppKit qualification. Shared factory/notification checks, Rust parser/protocol
tests and native OCaml request/calendar ownership regressions accompany the
source. The release build, lockfile resolution and actual native interaction
remain separate qualification steps.

## Warning toast controls use the published foreground role

Toast dismiss controls now derive their half-opacity color from
`Ui_theme.semantic_color_var "foreground"`, which is owned by the application
palette. The former private `--lui-c-foreground` reference was not published to
native theme scopes and could abort NSH rendering when a malformed calendar date
produced a warning.
Warnings retain their message, dismissal and duration behavior. Applications do
not need to define a compatibility token or change their calendar calls; for
example, submitting `2023-02-29` can display the existing invalid-date warning
while preserving the input and stored value. The actual warning toast's authored
colors are checked against both light and dark application palettes.

The same typed-property correction covers CmdK input/result/hint foreground
fallbacks and alert-dialog overlay/content backgrounds. The existing Web-only
`--lui-c-*` aliases and stylesheet rules remain valid CSS-local declarations;
native projected props now use the application palette's published foreground
and background roles. Regression checks exercise the fallback path when the
higher-level text/background aliases are absent, without supplying a new alias
or masking missing role definitions.

## Table columns retain their semantic owners during schema updates

Table header and row-cell owners now use stable keys derived from canonical
column identifiers. The trailing add-property header and empty row filler have
distinct reserved keys. They cannot be adopted as a newly populated column by
positional same-kind reconciliation. Existing columns retain their header, cell,
selection and unsaved scalar editor when metadata adds or reorders columns.

For example, changing `[select; notes]` to `[select; notes; created-at]`, then
`[select; created-at; notes]`, preserves the Notes draft and input owner; the new
Created At column receives its own owner. No application parameter or wire
payload changes. Callers continue supplying canonical column identifiers and
must not assign two different columns the same identifier. This correction adds
no permanent pointer observers, native capability relaxation or table remount.
## Icon picker Escape clears the query before closing

The shared icon/emoji picker now handles the focused search field's canonical
`Dismiss` event: Escape with a nonempty query clears the query and pending emoji
results, invalidates stale search completions and resets the result viewport.
It retains the picker, active tab and selected color. The existing search reset
owner replaces the canceled input draft with an empty autofocused input, so the
next native key edits the cleared search and a subsequent blank Escape closes
the picker. Cancellation elsewhere keeps its existing once-per-draft behavior.

`Ui_components.search_row` accepts an optional `on_dismiss` forwarded unchanged
to its typed `search_field`. Existing calls remain unchanged and do not opt into
input cancellation. For example:

```ocaml
Ui_components.search_row ~key:"filter" ~placeholder ~text_signal:query
  ~on_text:set_query ~on_dismiss:(fun _ -> close_filter ()) ()
```

This correction matches frozen master's query-first Escape behavior; it does
not add grid arrow navigation or change global overlay/key handling.

### Popup and outliner layout properties use their retained typed owners

The shared outliner, autocomplete, preview, reference-filter and flashcard producers now project already-authored point-valued layout through canonical properties instead of relying on the Web `data_attrs` style carrier. Examples include exact Web/NSH-scoped ShrinkValue through the existing typed float adapter, ``Ui_components.Prop.position `relative``, and `Ui_components.Prop.padding_bottom 64` on the existing preview document Box. Keys, child structure, handlers, identity and authored sizes remain unchanged; NSH now receives these existing requirements. The preview's bottom padding overrides its uniform padding exactly as its former inline declaration did.

This is not a CSS compatibility parser or a new LUI API. Remaining rem, percentage maximum, AlignSelf and transform requirements are recorded in `docs/agent-guide/review-probes/2026-11-13/popup-tree-typed-layout-carriers.md`. They remain explicit migration gaps; downstream callers must preserve their units and owner semantics rather than replace them with guessed pixels or host-guard away required native behavior. Explicit typed shrink remains a Web/NSH capability; this application batch does not change maintained Apple, Android or Web backend APIs.

The shrink projection is explicitly scoped to WebHost/NshHost, using the existing typed float adapter with no value on SwiftUIHost/KotlinHost/GenericHost. These profiles reject explicit shrink, and retain their prior native behavior. The original `user-select:text` style carrier remains unchanged; only its adjacent overflow declaration is migrated. No new typed/inherited selection or drag policy is introduced by this application change.
