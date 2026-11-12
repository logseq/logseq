# Portable PDF source qualification boundary

Status: source-only candidate at `f2343ddd10`, based on App `5e6949c4ed`.
No compiler, test, native engine/artifact, window, COM client or process was run
by this implementation batch. Feature growth is stopped for the first actual
Linux/Windows compile and native qualification. Production PDF validation and
registration remain unchanged; macOS still uses its existing PDFKit provider.

## Actual compilation entry points

| Entry | Modules included |
| --- | --- |
| Linux/Windows `pdfium_engine_probe` example | Safe engine and bounded owner worker |
| Linux example test target | Above plus Unicode document model, GTK completion queue and typed GTK page widget |
| Windows example test target | Above plus Unicode document model, exact HWND boundary and generated COM Text/Value/range providers |
| macOS example | Explicit unsupported-PDFium main; it does not compile these portable modules or replace the PDFKit qualification |

The root owns lock generation and all executions. The relevant native test entry
is `cargo test --locked --example pdfium_engine_probe`; Linux widget tests require
an actual Xvfb display. The separate release example takes explicit absolute
prepared engine/private authored PDF paths and a marker. A passing compile/test
is not visual, narrator, package or application-persistence qualification.

## Checked public API boundaries

- NSH pin `adc186db7213f3ccd1eacaa836cc721e9779fd14`: Linux public
  NativeComponent widget/context APIs and GTK 4.14 feature floor; Windows public
  NativeComponent HWND/context APIs. No private SDK accessibility module is used.
- GTK 0.11.5: AccessibleTextImpl contents/caret/selection at 4.14; extents/hit-test
  require 4.16 and selection setters require 4.22, so they are not called. GLib
  0.22.10 supplies attached Source/SendWeakRef; MainContext::invoke is not used.
- windows/windows-core 0.62.2 and windows-implement 0.60.2: exact generated
  IRawElementProviderSimple_Impl, ITextProvider_Impl, IValueProvider_Impl and
  ITextRangeProvider_Impl signatures were read. COM uses `Agile = false`, the
  public checked cast_object_ref protocol, standard Variant conversions and
  typed SAFEARRAY ownership. Generated macro expansion requires direct
  windows-core by that crate name; this matches the existing transitive version.
- Windows APIs/features already exposed by the pinned SDK: Foundation, Gdi,
  Com/Ole/Variant, Threading, Globalization, Accessibility, Shell and
  WindowsAndMessaging. No SDK feature expansion is required by the candidate.
- Additional target-only dependencies: exact PDFium wrapper commit with
  pdfium_8125/thread_safe and no default features; png 0.18.1;
  unicode-segmentation 1.13.3. Native binary receipt preparation is separate from
  loading it. No native artifact/dependency tree is committed.

Package VCS metadata identifies the reviewed generated Windows sources as
[windows-rs 32c3144](https://github.com/microsoft/windows-rs/tree/32c3144490c016fe496a0aed769bce60987a2e9d/crates/libs),
and GTK as [gtk4-rs 2fcbc15](https://github.com/gtk-rs/gtk4-rs/tree/2fcbc1544689df84b4f607d4dd6e7be668482494/gtk4).
The detailed platform and native ownership contracts are linked in the companion
artifact report. This static review does not substitute for target type checking.

## Concrete remaining worker gate

The Unicode Document builder is currently fed by authored test text. The real
worker publishes page text/geometry, search, outline, selection and area PNG,
but does **not** yet publish complete logical-document text to the Windows host.
That next stage must extract bounded page characters off the UI thread, yield
to finite input/viewport work between pages, discard an epoch on close/replacement,
and atomically publish a complete owned model. No UI-thread extraction, visible-
page-only DocumentRange or bitmap-only parity may be substituted.

The final controller/NativeComponent assembly, continuous page virtualization,
progressive high-DPI tiles/global budgets, persistent annotations/references,
remaining master controls, native AT/physical input and packaged performance
remain separate gates. UIA text-child/hyperlink/annotation providers and
TextPattern2/caret are not qualified by the current readonly TextPattern tests.

## Unicode mapping audit finding

At exact wrapper commit `3c786ab9463fcfb503afb93b3386c5a9da4b72e3`,
unicode_char only converts the raw value into a Rust scalar. A PDFium mapping
error can still yield a scalar. Furthermore, has_unicode_map_error maps native
1 to false and 0 to true, contradicting the same pinned binding contract and
its own comments. It must not be consumed by name as though its boolean were
already correct. No engine/wrapper behavior change was made during this freeze.

A later bounded correction needs reviewed safe-wrapper semantics plus authored
valid/invalid-map engine evidence; simply rejecting absent Rust scalars does not
prove Unicode-map-error handling. Sources:
[exact safe wrapper](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/pdf/document/page/text/char.rs),
[exact binding contract](https://github.com/ajrcarey/pdfium-render/blob/3c786ab9463fcfb503afb93b3386c5a9da4b72e3/src/bindings.rs).

## Ordered source commits

4228a3028a → 4f7bff217a → d3e2052674 → 559b3a0b07 → 15fea7b02b →
85bf8e29cb → d5866861a5 → 89aa22e77e → b67445f079 → 5aa27221ab →
02dfd75fd9 → f2343ddd10.

## First actual Linux compile result

Run 43300130927, job 131468776921, reached the real Xvfb PDF test target and
failed compilation: the pinned SDK exports `gtk4`, while the two candidate GTK
modules incorrectly imported `gtk`. The source correction uses that actual
public `gtk4` re-export, locally naming it `gtk` for the widget types. Missing
subclass traits/PageView diagnostics in that log cascade from this import.
No test or native engine result is inferred from this failure, and no local
compiler/test was run for the correction; the same target requires another CI run.

The next run, 43304781232 at c74eeaf363, reached the same native test target
and reported one type inference error in the selection-offset closure. Its
argument indexes individual glyphs, so it is explicitly `usize`, rather than an
unresolved generic `SliceIndex`. This source correction still requires the
actual Linux compile and widget tests; no execution is inferred from it.

## First actual Windows compile result

Run 43300275904, job 131469285114, passed the strict App host tests and
artifact source guards, then failed the native PDF test compile at three calls
to the removed `Error::from_win32` constructor. The pinned windows-result 0.4.1
uses `Error::from_thread` for the current Win32 last error. The search path
already captures `GetLastError`, so it constructs the HRESULT from that exact
captured error instead of rereading thread state. No error is suppressed or
replaced with success. The correction requires another native target run;
Win32/UIA tests and the subsequent PDFium load step have not run yet.

## First fast native runtime result

Fast run 43309342263 at c77d9ff569 compiled both real native example targets.
Linux passed all five GTK/completion/Unicode tests and the prepared PDFium
engine/document/worker probe. The Xvfb run had no accessibility bus, so this is
in-process AccessibleText evidence, not an AT-SPI client result.

Windows passed thirteen of fourteen tests. Document replacement returned
`UIA_E_ELEMENTNOTAVAILABLE` (`0x80040201`) before the retained-provider lifetime
assertions; the generic system message describes subscribers and does not
identify the actual failed call. Each replacement disconnect/notification now
retains the native HRESULT and adds its exact operation to the error. This
diagnostic change does not suppress errors or alter ownership assertions. The
actual failing boundary and subsequent Windows engine load still need evidence.
