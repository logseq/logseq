# Portable PDFium runtime preparation

Status: source candidate; no runtime download, load, build or test performed.
The Linux/Windows reader is not enabled by this preparer alone. macOS keeps
PDFKit. The controlling design is the existing proposed Rust-wrapper ADR.

## Exact inputs

The safe wrapper source is `ajrcarey/pdfium-render` commit
`3c786ab9463fcfb503afb93b3386c5a9da4b72e3` (manifest version 0.9.6), with explicit
`pdfium_8125` bindings and no `pdfium_latest`/default image feature. This source
includes the safe bitmap, coordinate conversion, character, search and bookmark
APIs needed by the reader. The wrapper owns its existing global binding and
thread-safe serialization; the application must not add another raw global.

The engine binary source is the immutable
[bblanchon release chromium/8125](https://github.com/bblanchon/pdfium-binaries/releases/tag/chromium/8125),
version 158.0.8125.0. Its GitHub release API was read on 2026-11-13 before the
helper was authored. The checked-in manifest preserves each release asset's ID,
compressed length and provider-published SHA-256 for Linux/Windows x64/arm64.
`buildRecipeCommit` identifies the packaging repository's release commit, not an
invented hash of PDFium's full dependency source closure. The immutable archive
hash pins the actual runtime bytes. A reproducible source-build claim requires a
separate engine/dependency provenance gate.

The reviewed recipe's `steps/07-stage.sh` places Linux's engine at
`lib/libpdfium.so`, Windows's at `bin/pdfium.dll`, and the release `args.gn` and
`LICENSE` at the archive root. `steps/08-licenses.sh` collects PDFium and native
third-party notices under `licenses/`; `steps/10-pack.sh` archives that staging
root. The preparer retains all those notices and the exact GN args, excludes
headers/import libraries, and rejects missing licenses or V8/XFA/debug builds.
It does not assert that the upstream license inventory establishes distribution
compliance, or that every required system DLL/SO is already packaged.

## Contained commands for the serial qualification owner

```sh
cd deps/ui/nsh
python3 -m unittest test_prepare_pdfium.py
python3 prepare_pdfium.py --target linux-x64
```

`--target` also accepts `linux-arm64`, `win-x64` and `win-arm64`; `--output` names
a new build/package staging directory. The default is the ignored
`deps/ui/_build/native-pdfium/<target>` directory. An existing output is refused.
All archive size/hash/path/type/license/build checks complete before creating
that directory. `receipt.json` is written last as its readiness marker and
records hashes of the exact staged library, build arguments and license files.
No native code is executed or installed, and TLS trust is not modified. No
working-directory or system-library fallback is allowed in the eventual reader.
Downloaded binaries/archives and extracted dependency trees must remain untracked.

## Remaining gates

Run the authored-archive unit checks, then download the actual immutable artifacts
only in private build-owned directories. Inspect actual ELF/PE dependency closure,
font behavior, license inventory and cold startup on each supported architecture.
Package the engine and all notices with the existing signed whole-app payload,
record their file hashes in delivery receipts, and test clean-host startup and
updates. MSVC CRT availability and Linux ABI/library requirements are unqualified.

Native implementation must still supply the owner worker and bounded viewport
cache, GTK/D2D drawing, exact crop/rotation transforms, text selection/copy/find,
area PNG, outline/password/paging/zoom controls, annotation persistence/ref hooks,
keyboard and native text accessibility. The preparer is not reader parity.

## Safe engine candidate and explicit probe

`src/extensions/pdf/portable/engine.rs` is the shared source candidate for the
native owner worker. It is compiled by the explicit `pdfium_engine_probe`
example on Linux/Windows; production PDF registration is still unchanged.
The target-only Cargo dependency pins the reviewed wrapper commit with exactly
`pdfium_8125` and `thread_safe`, without its default image API or latest-engine
alias. The serial build owner generates Cargo.lock; it was not fabricated here.

The engine functions keep document/page/text/search/bookmark/bitmap objects in
one lexical worker scope. They return owned pixels, logical glyph indices,
Unicode values, geometry, search results and outline metadata. Raster work is
limited to an 8M-pixel tile; text/search/outline budgets reject oversized jobs
explicitly. The owned data does not retain a document/page or native engine
handle. The viewer must coalesce obsolete viewport requests and fence their
results before using this layer.

Rendering and character/search rectangles use the same explicit fixed-size page
configuration and PDFium's public `points_to_pixels` conversion, including page
crop/rotation. Strip rendering uses the documented `set_origin` API into a
bounded bitmap, rather than allocating every full page. The private probe
compares stitched strip bytes against a full-page render and rejects blank
output. Rotated/cropped and complex-script fixtures remain mandatory.

The wrapper binding is established only by `bind_to_library(absolute_path)`.
For its specific `PdfiumLibraryBindingsAlreadyInitialized` result, the reviewed
wrapper's `Default` implementation reuses its immutable OnceCell without loading
any working-directory/system path. This branch is documented in the candidate;
other binding errors are returned. The App must pass only its fixed packaged
engine path, never a per-document or untrusted override. The explicit private
probe accepts an absolute prepared-library argument to qualify the actual bytes.

```sh
cargo check --locked --example pdfium_engine_probe
cargo run --locked --example pdfium_engine_probe -- \
  /private/build/pdfium/libpdfium.so /private/fixture/original.pdf 'Original page one'
```

Use `pdfium.dll` on Windows. An optional fourth argument is a password. Supply
only a private authored fixture: the probe deliberately returns extracted text
and geometry as evidence. The existing macOS PDF qualification example already
authors an original/replacement two-page fixture with a rotated second page;
its generator should be shared by the cross-platform gate as it expands. This
initial probe checks page one, text/search marker, owned geometry, outline and
strip identity; it does not yet qualify all page rotations, passwords, selection
interaction, annotations, area PNG, native accessibility or any App persistence.
No engine probe, compiler, document load or native app was run for this source
batch. The GTK/Windows native hosts and complete UI integration remain in progress.

The engine candidate also supplies logical character-range selection and area
PNG encoding. Selection copies characters by index and obtains rectangles from
PDFium's `segments_subset(start, count)`; it never calls a rectangle's text
extractor to assemble the copied text. Unmapped Unicode is an explicit selection
error, not invented replacement text. Search-hit output carries native match rectangles; the search request
identifies the query once, without duplicating it in every hit; it does not mislabel rectangle-extracted text as an
exact logical match. The private probe checks that selecting the authored marker
copies exactly that marker and returns highlight rectangles.

Area encoding uses the existing rendered tile and pinned `png` 0.18.1 (MIT OR
Apache-2.0; safe Rust encoder API checked in the installed upstream source).
It creates owned PNG bytes without writing a file or changing the PDF. The
private probe decodes those bytes and compares all pixels against the selected
lower-page crop. The OCaml `pdf-hl-area` persistence/ref owner is unchanged and
is not yet connected by the native viewport. These are semantic-layer candidates,
not passing integration or user-interaction results.

## Owner worker candidate

`portable/worker.rs` owns one thread and one lexical document scope. Finite
selection/area/outline work is bounded to eight pending jobs; viewport work
coalesces to one latest request. Search replaces obsolete pending searches and
checks its revision between pages. Viewport results check both document epoch
and render revision. Closing invalidates pending work; no callback after stop
can authorize a result for a replacement document. The widget must independently
check the captured epoch again when applying a queued UI completion.

The worker caches at most three owned page-text snapshots and 64 MiB of glyph
storage, keyed by page and render width. Scrolling another tile of the same page
does not re-extract every character. Geometry uses stack-local four-corner
conversion rather than allocating a vector per glyph. Character-count budgets
are checked before the wrapper allocates its character-index collection. PDFium's
public limited-render-image-cache flag is enabled; this does not establish a
hard process/native-engine memory limit.

Ordinary close emits `Closed` only after the document and its retained file-backed
reader have dropped. The explicit probe checks the exact private file is held
while Opened and released when Closed: `/proc/self/fd` on Linux, exclusive-share
read open on Windows. It reopens with a new epoch, refuses old-epoch work, closes
again, then joins the exact owned thread and checks file release once more.
The Windows probe accepts only ERROR_SHARING_VIOLATION as evidence of a held file;
unrelated errors cannot become a passing release assertion.

Forced widget disposal signals stop and rejects results immediately, but does
not join a blocking PDFium call on the UI thread. The exact worker retains every
PDF object until that call returns and the document drops. The normal native
close control must await Closed before emitting the existing application
`pdf-close`; forced-disposal shutdown/retention remains a real-platform gate.
No generic reaper or global worker registry is introduced.

The GTK completion wake must use an explicitly attached one-shot GLib source,
not MainContext::invoke: upstream documents that invoke runs inline when the
context is unowned, which is unsuitable for upgrading a SendWeakRef after loop
shutdown. The pending source must be owner-fenced and destroyed on disposal.
Windows already exposes thread-safe ComponentContext::redraw. Native hosts,
continuous page layout/selection, all master reader controls and native text
accessibility remain in progress; this candidate is not enabled in App startup.

Primary lifecycle references: [Rust Windows share mode](https://doc.rust-lang.org/std/os/windows/fs/trait.OpenOptionsExt.html#tymethod.share_mode),
[Linux proc filesystem](https://www.kernel.org/doc/html/latest/filesystems/proc.html).

## Continuous viewport and GTK delivery candidate

Opened now returns bounded geometry for every page (at most 100,000), checking
owner retirement between page reads. A visible batch shares one epoch/revision
across at most eight tiles and eight million pixels; a new scroll replaces the
whole batch. This preserves multiple visible pages/strips instead of a later
request overwriting an earlier page in the same viewport. The worker additionally
limits the batch's unique owned text snapshots to 64 MiB. The engine probe now
asserts both half-page results arrive under one revision and rejects an oversized
batch. These budgets require the host to progressively request bounded batches
for a large or high-DPI viewport; they are not permission to discard visible tiles.

`gtk_completion.rs` implements the delivery boundary using public GTK-reexported
GLib/GIO APIs. Its per-reader queue retains at most 16 events and 128 MiB, with
backpressure released by consumption, replacement epoch or disposal. One attached
Source wakes the captured GTK context; no callback executes inline on the worker
and no recurring idle/timer polls for results. A SimpleAction is the typed weak
target. Disposal disables it, destroys the exact retained Source, clears results
and wakes blocked producers. Every callback rechecks epoch/liveness, including
between events when a prior callback could reenter and replace/dispose the owner.
A fast Opened arriving before `Worker::open` returns is preserved by set_epoch.

Two source regressions are included in the Linux engine example test target:
`cargo test --locked --example pdfium_engine_probe`. They create private GLib
contexts without a display, check that sending from a joined worker does not run
inline while the context is unowned, dispatch on the owner thread, discard stale
epochs, preserve a fast new epoch, and reject late work after source destruction.
No compiler, test, GLib loop, engine or native app was executed for this batch.
The actual GTK widget and Windows UIA host are still separate pending integration;
these tests alone do not qualify native accessibility or physical interactions.

## Typed GTK page surface candidate

`gtk_page.rs` is a retained, typed GtkWidget subclass implementing the public
GtkAccessibleText interface at the pinned NSH GTK 4.14 baseline. It owns no engine
handle. Owned RGBA tiles become GdkMemoryTextures; logical PDF glyph indices,
selection feedback, native text contents, caret and selection bounds share the
same captured PageText. Native TextBuffer/TextIter supplies Unicode character,
word and sentence operations, without introducing a second text-layout engine or
ASCII word splitter. Native text is read-only. An unmapped PDF glyph is exposed
as a replacement character for accessibility; the engine continues to reject an
exact copy request containing unmapped Unicode, rather than inventing copied text.

The widget fences document epoch, render revision, page and dimensions before
accepting pixels/text. It bounds retained textures to eight/32 MiB and checks
packed RGBA byte counts. Highlight overlays receive explicit native colors.
Mouse drag selects logical glyph ranges in either direction rather than assuming
left-to-right caret halves. Copy/select-all/word movement and range extension are
native scoped key handlers; unrelated keys fall through. Disabled and retired
widgets emit no actions. Callbacks are cloned outside mutable borrows, allowing
synchronous owner retirement without retaining handlers or accepting a late tile.

The private Linux example test target now includes one real-display GTK widget
case (run under Xvfb in disposable Linux CI): multilingual contents and character
offsets, exact logical glyph-index selection, native caret/selection queries,
colored overlay admission, stale-render refusal, disabled actions and reentrant
retirement. These are authored native-widget assertions, not physical pointer,
screenshot or screen-reader qualification. No test/display/engine was executed
for this source batch.

AccessibleText extents/hit-test methods require GTK 4.16 and selection setters
require GTK 4.22 in the reviewed safe binding. They are not called or claimed at
the maintained 4.14 baseline. The outer native reader still needs continuous page
virtualization, global retained-resource budgeting, progressive tile scheduling,
controller/persistence wiring, complete master controls and real AT/interaction
qualification. This page-surface candidate remains qualification-only and does
not enable Linux/Windows PDF validation or replace the existing macOS provider.

## Windows instance boundary proposed for review

The pinned Windows NativeComponent public API accepts an owned child HWND and
performs ordinary placement/clipping/adoption. Its Direct2D-only draw path has no
public stateful TextPattern provider hook. NSH's own `access` module is private;
it cannot be imported as an app helper. Public generated windows-rs COM interfaces
and implementations are the available typed route for a reader TextPattern
provider. No PDFium pointer or SDK-private handle needs to cross this boundary.

The smaller window boundary uses CreateWindowExW with the built-in Unicode STATIC
class, initially hidden, then SetWindowSubclass. This avoids a new window-class
registry and GWLP_USERDATA. One exact Box<Registration> contains Rc<WindowState>;
its pointer round-trips only through that callback's DWORD_PTR reference-data
slot. SetWindowSubclass keys that slot by HWND, procedure and subclass ID and does
not reference-count it. The wrapper must be !Send/!Sync through its Rc owner and
create/install/dispatch/destroy on one UI thread. It never subclasses a foreign
HWND, overwrites another callback's data, transmutes function pointers or casts a
PDFium/COM handle to an unrelated type.

The proposed callback immediately clones Rc<WindowState> from its own registered
box, retaining no borrowed userdata reference across a handler call. Reentrant
DestroyWindow can therefore retire the window and release registration without
invalidating the outer handler's local state. At WM_NCDESTROY it removes only its
own subclass, clears the shared HWND/liveness, and releases the registration box
once; remaining OS messages use DefSubclassProc. A failed subclass installation
reclaims the never-transferred registration before destroying the built-in
window. A failed explicit destruction remains a failure; it cannot report a
closed window or authorize worker/application release. This is ordinary Win32
ABI instance-data interop, not an escape from Rust type/lifetime checks.

Required private Windows gates before this boundary is enabled: real hidden
window creation/close with one registration and handler drop; real parent-driven
child destruction; repeated close after NCDESTROY; real destruction reentered
from a dispatched custom message with the outer handler's state still alive;
installation failure cleanup; no callback after retirement; and generated COM
TextPattern/range lifetime queries after the native view/worker has closed.
The whole reader additionally needs physical keyboard/pointer/wheel behavior,
parent global-shortcut fallthrough, airspace/overlay clipping and packaged
PDFium/CRT/data tests. No window/COM provider was created or tested for this note.

Primary contracts: [SetWindowSubclass reference data, identity and thread restriction](https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-setwindowsubclass),
[DefSubclassProc and the modern subclass chain](https://learn.microsoft.com/en-us/windows/win32/controls/subclassing-overview),
[WM_NCDESTROY memory-release ordering](https://learn.microsoft.com/en-us/windows/win32/winmsg/wm-ncdestroy).

The reviewed boundary is now drafted as qualification-only
`portable/windows_window.rs`, included only by the Windows engine-example test
target. It creates a hidden owned STATIC window, stores exactly one registration
through SetWindowSubclass, clones Rc before dispatch, removes the callback before
reclaiming registration, and verifies NCDESTROY changed the exact owner's HWND
state before close succeeds. If a handler destroys the window reentrantly and
returns no result, the outer callback returns without invoking another native
handler on that destroyed window. A retirement gate prevents any later message
from invoking application code. Rc keeps the owner !Send/!Sync and close verifies
its creating thread. No production reader/provider registration is enabled.

Four authored real-Windows tests cover ordinary close/retirement/one-drop,
reentrant actual DestroyWindow with a live outer handler, parent-driven adopted
child destruction, and a real failed SetWindowSubclass on the destroyed private
HWND with registration Rc count restored. They are in
`cargo test --locked --example pdfium_engine_probe` on Windows and require actual
native execution; they do not substitute fake window destruction or interface
success for OS results. No compiler, Windows process, window or test was run for
this candidate. Generated COM TextPattern implementation and its independent
retained-range/closed-owner gates remain in progress.

Installation retains Rust ownership of the box until SetWindowSubclass returns
success. A tiny Installing/WindowOwned/Destroyed transfer state also covers
possible reentrant NCDESTROY during installation: that callback removes itself
and marks destruction but leaves the still caller-owned box for normal Rust
drop. Only after successful installation, with no intervening native call, does
Box::into_raw transfer reclamation to NCDESTROY. Thus a failed or reentrantly
destroyed installation cannot reclaim the same registration twice.

Worker error results now retain their viewport/search revision, and an engine
failure from a superseded job is checked before publication. The GTK queue's
oversized-result diagnostic preserves that same scope. The future reader
controller must check these revisions again on UI delivery, as it does for
successful tiles/searches: a source-side check cannot retract a result already
queued before a new scroll/search. The private probe reports the captured scope
on failure. Real overlapping-scroll/search error presentation remains a native
controller gate; this source change does not claim that unimplemented UI gate.
