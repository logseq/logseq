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
