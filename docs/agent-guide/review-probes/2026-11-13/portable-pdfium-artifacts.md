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
