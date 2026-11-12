# Proposed ADR: qualify an existing Rust PDF wrapper for the native reader

Date: 2026-11-13
Status: Proposed; no engine or dependency approved by this document.
Scope: Windows/Linux in-app PDF parity, retaining the existing macOS PDFKit provider.

## Decision proposed for review

Use an existing Rust wrapper and the pinned NSH public `NativeComponent` APIs.
Do not introduce an App-owned C exception bridge, raw engine bindings, a second
annotation persistence owner, a WebView reader, or an external-opener substitute.
Choose the engine only after a small private wrapper-capability and lifecycle
fixture passes on MSVC Windows and Linux with the proposed release feature set.

The earlier C-header-only preference for MuPDF is insufficient. Its C selection
helpers are not all available through its safe Rust API. Both candidates still
need an application-owned native reader interaction layer; neither wrapper is a
finished reader widget. `pdfium-render` is the first alternative to qualify if
MuPDF's safe selection boundary cannot be used without repairing the dependency.
No dependency fork or new C adapter is authorized here.

## Existing application boundary

- `deps/ui/native/pdf.ml` owns graph/document/instance event fencing, view state
  and calls to the existing annotation persistence functions.
- `deps/ui/native/pdf_assets.ml` owns annotation DB entities, image assets,
  ref-block relationships and navigation. Preserve this owner.
- `deps/ui/nsh/src/extensions/pdf.rs` validates the canonical `logseq-pdf` model,
  supplies the NSH toolbar/popover and routes native events.
- `deps/ui/nsh/src/extensions/pdf/macos.rs` owns PDFKit on AppKit's thread.
  Windows/Linux are currently rejected by the actual PDF validator.
- Current rectangles contain x1/y1/x2/y2 plus their viewport width/height. They
  are not engine-space coordinates or a new persisted quad representation.
  Conversion must retain crop, page rotation, top-left orientation and zoom
  semantics; a new engine cannot reinterpret existing highlights.
- Frozen master `29fd2edd` includes text and area annotations, finder, outline,
  highlight controls, password handling, numeric paging, zoom/fit and reference
  navigation. The current macOS provider also has parity work remaining.

## Source evidence and version discipline

Sources were read through the repository provider and primary upstream docs.
The reviewed MuPDF Rust tag is `v0.8.0`, resolving to
`deaacc87c4cea6a2146e90e00e0d5658c911277b`. The reviewed `pdfium-render` source
commit is `3c786ab9463fcfb503afb93b3386c5a9da4b72e3`, whose manifest says 0.9.6.
These are evidence versions, not additions to Cargo.toml or a selected runtime.
Older 0.9.4 documentation was also checked for its ownership/safety release notes;
do not silently mix its default engine API version with 0.9.6 source.

### Safe Rust capability matrix

| Required capability | `mupdf` / `mupdf-sys` 0.8.0 | `pdfium-render` reviewed commit |
| --- | --- | --- |
| Local document/password/page count | `Document::open`, `needs_password`, `authenticate`, `page_count` | `Pdfium::load_pdf_from_file` / reader with password, `document.pages()` |
| Raster and area capture | `Page::to_pixmap`; bounded `Pixmap::new_with_rect` plus `Device::from_pixmap_with_clip` and `Page::run`; PNG `Pixmap::write_to` | `render_with_config` / render into an existing bitmap, render configuration clipping/origin, bitmap bytes; PNG encoding is an application/package dependency decision |
| Text and geometry | `Page::to_text_page`; borrowed block/line/character iterators; owned structured text; per-character `Quad` | Page text, Unicode characters, nearby-character hit tests, tight/loose rectangles and text/object transforms |
| Find | `TextPage::search` / callback returns quads | `PdfPageText::search`, next/previous results as character segments |
| Pointer selection/copy | No reviewed safe snap/copy-selection method. See output-buffer issue below. App range/word/line selection would otherwise use owned character/quads data. | Character hit tests, subsets/segments and text extraction; app owns anchor/focus, word/line snapping and multi-page selection |
| Crop/rotation | `PdfPage::crop_box`, `media_box`, `rotation`; matrix transforms | `PdfPage::boundaries().crop()/media()`, `rotation`, points/pixels conversion with the rendering configuration |
| Annotation geometry | `PdfAnnotation::quad_points`, setters, rect/color/contents and page creation APIs | Annotation common properties plus attachment-point accessors returning `PdfQuadPoints` |
| Outline | `Document::outlines` returns owned outline values | `document.bookmarks()` and destinations |

Sources: [MuPDF document](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/document.rs),
[page](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/page.rs),
[text page](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/text_page.rs),
[PDF page](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/pdf/page.rs),
[annotations](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/pdf/annotation.rs),
[device](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/device.rs),
[pixmap](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/pixmap.rs),
[PDFium wrapper document](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document.rs),
[page](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page.rs),
[text](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page/text.rs),
[character hit tests](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page/text/chars.rs),
[character geometry](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page/text/char.rs),
[search](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page/text/search.rs),
[boundaries](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page/boundaries.rs)
and [annotation attachment points](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page/annotation/attachment_points.rs).

### MuPDF wrapper constraints

The safe crate already calls the sys crate's exception-catching C wrappers and
returns Rust errors. Reimplementing `fz_try`/`fz_catch` in the App duplicates an
existing boundary. `mupdf-sys` is a lower-level FFI dependency, not itself the
safe application interface. [Existing catch boundary](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/mupdf-sys/wrapper/internal.h).

`TextPage::highlight_selection` takes `quads: &[Quad]` and casts the derived
const pointer to a mutable engine output pointer. Treat this as a blocking
soundness/API concern, not a usable safe selection helper. Do not invoke it,
work around it with casts, or claim the C snap/copy helpers exist in the safe
crate. Its exact Rust-to-sys export and output behavior need an upstream-backed
resolution and a real target compilation before use. This review did not run a
proof of undefined behavior. The source-level signature is enough to exclude
that method from the proposed application boundary. [Reviewed method](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/text_page.rs).

`Context::get` aliases a thread-local context cloned from a process-wide base;
new document handles are not isolated engine caches. Documents/pages/text and
pixmaps have destructors, and borrowed iterators must not outlive their owner.
Construct, use and drop all native objects on one owner worker; send only owned
pixel/geometry snapshots to the UI. Avoid assumed `Send` implementations.
The reviewed public Context API exposes no cache-budget setter; the sys base
uses `FZ_STORE_DEFAULT`. Do not promise a hard memory limit from a per-document
Rust cache limit alone. [Context](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/src/context.rs),
[base context](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/mupdf-sys/wrapper/context.c).

### PDFium wrapper constraints

The wrapper already owns its process-wide binding initialization and optional
mutex-backed `thread_safe` implementation. Reuse that mechanism; do not add a
second App-global raw binding. Documents retain their reader/bytes, have Drop,
and borrow the Pdfium instance; page text/search/character collections have
borrows and destructors. Keep Pdfium and its document in one worker scope and
create/drop borrowed page/text/search handles inside jobs, caching only owned
results. This avoids a self-referential owner struct or lifetime casts.
[Library/reader ownership](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdfium.rs),
[document Drop](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document.rs).

A selection's logical character order is not necessarily visual reading order.
Rectangle extraction must not become the implementation of multi-column text
selection. Rotated characters, ligatures and unmapped Unicode need fixtures.
The wrapper is not a selection/accessibility widget. Its release notes include
recent memory-safety fixes, so an old convenient version is not an adequate pin.
[Text ordering](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page/text.rs),
[release history](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/README.md).

## Build, features and distribution

MuPDF's wrapper has an MSVC-specific MSBuild branch and a Unix make branch,
compiles its existing C wrappers and generates bindings with libclang. Its CI
includes Ubuntu, macOS and Windows 2022/2025. This is upstream support evidence,
not a passing result with Logseq's Rust 1.97 toolchain/package. Default features
include several document engines, JS and OCR; qualify an explicit PDF-only set.
Keep base14 fonts or prove a runtime replacement. System-font/CJK behavior and
font licensing must be part of the selected closure, not sacrificed to reduce
size. [Build](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/mupdf-sys/build.rs),
[CI](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/.github/workflows/CI.yml),
[features](https://github.com/messense/mupdf-rs/blob/deaacc87c4cea6a2146e90e00e0d5658c911277b/Cargo.toml).

`pdfium-render` does not build the engine. Qualify either a source-built native
library or an explicitly approved binary source, pinned by engine revision,
platform, architecture and digest. Bind the packaged library by its absolute
trusted path; never use working-directory/system discovery as a shipping
fallback. Match the wrapper's explicit `pdfium_*` feature to that library rather
than `pdfium_latest`. Windows support in the Rust API does not qualify the
engine DLL/MSVC runtime or the App's final PE closure. Its reviewed build/test
workflow runs on Ubuntu; add actual Windows application gates.
[Binding/build policy](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/README.md),
[feature definitions](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/Cargo.toml),
[upstream CI](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/.github/workflows/build_test.yml).

MuPDF's Rust manifest says AGPL-3.0; its engine offers AGPL/commercial terms.
`pdfium-render` says MIT OR Apache-2.0, while PDFium has its own BSD-style and
additional included license text. All transitive native/font licenses still
need an artifact-specific review; these facts do not establish distribution
compliance. Logseq's current LICENSE.md contains AGPLv3.
[MuPDF license](https://mupdf.readthedocs.io/en/latest/license.html),
[PDFium license](https://pdfium.googlesource.com/pdfium/+/refs/heads/main/LICENSE).

Poppler remains a candidate if its frontend/build closure proves simpler: it has
GLib text layout, selection and search, with GPLv2-or-later notices in that
frontend. WinRT PdfPage only exposes raster/page operations, so it cannot replace
the semantic reader engine by itself. [Poppler API](https://poppler.freedesktop.org/api/glib/poppler-Poppler-Page.html),
[frontend notice](https://github.com/tsdgeos/poppler_mirror/blob/master/glib/poppler-page.cc),
[WinRT page API](https://learn.microsoft.com/en-us/uwp/api/windows.data.pdf.pdfpage?view=winrt-26100).

## Minimal native implementation after qualification

1. Retain the canonical OCaml PDF model and repo/identity/instance checks. Select
   one concrete portable provider for Windows/Linux. Do not build a plugin or
   multi-engine abstraction merely to retain both research candidates.
2. One registered native viewport owns its session, bounded render work and
   native images. Linux uses the public GTK NativeComponent widget; Windows
   uses public Direct2D drawing/redraw and native element-local pointer events.
   The pinned SDK already exports GTK/windows types and these interfaces.
   A child HWND is available but is not needed unless a concrete input/rendering
   limitation requires it. No PDF SDK fork is currently justified.
3. Keep all engine calls off the UI thread on one document owner worker. A small
   bounded native work channel is for parsing/rendering, not a new OCaml RPC
   queue. Coalesce superseded viewport work and fence every result by session,
   document, page and render generation. Close must drain/drop that exact owner
   before the old file, pixels or widget are released.
4. Use one affine transform for rendering, hit testing, selection quads, search,
   highlight overlays and area clipping. Preserve existing stored rectangle
   semantics through an explicit conversion at the boundary.
5. Reuse the existing NSH toolbar/popover and add the missing reader controls:
   search, count/page input, outline/highlight list, password state and annotation
   menus. Continue emitting the existing `pdf-hl-add/area/del/color/ref/link`,
   `pdf-page`, `pdf-scale` and mode/flag events to their existing OCaml owner.
   Record any needed additive event fields/default behavior in api-migrations.
6. Persist Logseq annotations in the DB and assets through existing functions.
   Render embedded annotations with the engine; paint DB highlights as owned
   overlays. Implement text and area modes, copy/ref/link actions and re-reveal;
   do not introduce a PDF-file rewrite/save path as a second owner.
7. Native text accessibility and keyboard selection/navigation are explicit
   delivery work. A bitmap in DrawingArea/Direct2D is not an accessible PDF
   reader. Theme/focus/disabled/loading/error states require real light/dark UI
   review on both platforms.

Relevant pinned SDK source: `nsh-platform-linux/src/native.rs` NativeComponent
and ComponentContext; `nsh-platform-windows/src/native.rs` draw/window/wheel and
ComponentContext; `nsh-core/src/ops.rs` PressEvent/MouseEvent local position.
App registrations currently only provide PDFKit on macOS in lib.rs and main.rs;
normal and generated package runners must register the selected provider.

## Qualification and acceptance gates

1. **Wrapper gate:** a private Rust fixture compiles/runs only the named public
   safe APIs with the exact release features on MSVC Windows and Linux. No
   App FFI bridge/casts or ignored compiler warnings. Confirm selected crate,
   sys engine revision, bindings and font/data closure before adding a shipping
   dependency. A MuPDF selection-output repair needs a reviewed upstream result
   or explicit dependency-change scope; otherwise exclude that API.
2. **Semantic engine gate:** authored PDFs cover non-Latin text, ligatures,
   surrogate characters, multi-column/reordered text, rotated/cropped pages,
   blank/scanned pages, password rejection/acceptance, outline destinations and
   embedded annotations. Check copied text, search results, line/quads and PNG
   crop pixels against authored expectations, not just a screenshot.
3. **Native reader gate:** actual GTK and Direct2D pointer/keyboard selection,
   multi-page drag, find next/previous, zoom/fit, numeric paging, area capture,
   annotation menus and ref reveal match frozen master. Verify accessibility,
   light/dark states, focus, scroll/selection interruption and high-DPI changes.
4. **Real App gate:** persist highlights/area PNG and ref blocks through an actual
   private worker; close/reopen and verify DB entities, coordinates and assets.
   Graph switch, retirement, disabled state, update quiescence and stale async
   results must not mutate a new session. Keep the canonical model/worker owner.
5. **Retention gate:** repeated open/zoom/search/close, hundreds of pages and
   image-heavy documents keep only viewport work/pixels and bounded owned text.
   Check document/file closure independently. Measure release RSS/native engine
   allocations separately from OCaml heap; include engine-global cache retention.
6. **Package gate:** receipts cover engine binaries/fonts/licenses and exact
   artifact digests. Verify ELF/PE dependency closure and native startup in a
   clean disposable environment; include the new bytes in the existing signing,
   installer and update payload qualification. Never require an end user's
   developer-installed engine library.

Binary size, compressed package delta, build time, first-page latency, selection
latency and cold/peak/post-close memory are unmeasured. No engine is declared
smaller, faster, memory-bounded or fully compatible from upstream marketing or
header availability.

## Documentation workflow and validation boundary

`spec-dev-tool --help` failed because the command is unavailable on PATH. Searches
also found no executable in ~/.local/bin, Homebrew, the current spec_dev_tool
project location, or the recorded /Users/tiensonqin project executable location.
No tool installation/build was attempted. This proposed lifecycle path follows
the existing agent-guide convention, but its spec-dev-tool validator was not run.

This change contains English documentation only. Source inspection, primary
source research and git diff --check are the available evidence. No engine
checkout, dependency addition, compiler, test, native window, user graph,
downloaded third-party tree, signing action or system configuration change was
performed. Revisit the decision after the wrapper and actual target gates.
