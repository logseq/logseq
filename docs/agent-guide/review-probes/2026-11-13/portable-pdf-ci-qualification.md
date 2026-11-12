# Portable PDF CI qualification candidate

Source-only CI wiring based on Logseq
`b67445f07956d81c530ec40dfc8416175bcff42d`. No Cargo invocation, unit test,
artifact download, native window, PDFium load, workflow dispatch, signing or trust
change was performed while preparing this candidate. Production portable PDF
admission remains unchanged.

## Existing runner inputs

The Linux step runs only in the existing `ubuntu-24.04` desktop matrix job.
Its existing apt setup supplies GTK 4, Xvfb, dbus-x11, fonts and native development
libraries. `xvfb-run -a dbus-run-session -- env GDK_BACKEND=x11` owns the temporary
display/session for the native widget test process. Do not disable accessibility
or turn a missing display into a skipped test.

Windows uses the existing `windows-2022` x64 MSVC runner, explicit MSVC linker,
native toolchain setup and `RUST_MIN_STACK=268435456`. No new installer,
certificate, elevated trust, global DLL path or system Pdfium installation is
needed. Both jobs retain the existing Rust 1.97.0, two build jobs, sibling LUI
checkout and immutable dependency/lock policy. The candidate's existing LUI pin
must be reviewed with the source integration; this change does not silently
advance it or regenerate Cargo.lock.

The example and private tools must exist in the checked-out source. These are
ordinary required steps, not `hashFiles`/file-existence skips, optional workflow
inputs or `continue-on-error` gates. No new workflow trigger is introduced.

## Separate evidence layers

1. Existing `cargo clippy --locked --all-targets` checks target-specific example
   code compilation. It does not execute a GTK widget, Win32 window or Pdfium.
2. `cargo test --locked --manifest-path deps/ui/nsh/Cargo.toml --example
   pdfium_engine_probe -- --test-threads=1` executes the example's unit/native
   cases. Linux includes the actual GtkAccessibleText widget and GLib ownership
   cases under Xvfb. Windows includes actual HWND/subclass destruction and
   retirement cases. Later reviewed UIA tests in the same target can extend this
   layer. These tests do not by themselves load the Pdfium artifact or qualify a
   cross-process screen reader, hardware input, compositor screenshot or reader
   inside the actual Logseq application.
3. `prepare_pdfium.py --target linux-x64|win-x64 --output ABSOLUTE_NEW_DIRECTORY`
   downloads the manifest's exact release asset and checks its byte count,
   SHA-256, safe archive entries, license closure and disabled V8/XFA/debug flags.
   A receipt is written last. Network or validation failure fails the job; there
   is no system-engine fallback. This stages bytes without loading them.
4. `prepare_pdf_probe.py --output ABSOLUTE_NEW_DIRECTORY` writes only the original
   private authored two-page fixture. Its ASCII PDF content matches the macOS
   qualification example: `Original page one`, then a rotated second page.
   Byte offsets are computed from bytes and written without Windows newline
   conversion. The receipt records the exact bytes/hash and the marker. This
   proves fixture generation only, not PDF interpretation.
5. `cargo run --locked --manifest-path deps/ui/nsh/Cargo.toml --example
   pdfium_engine_probe -- ABSOLUTE_LIBRARY ABSOLUTE_PDF 'Original page one'`
   actually binds the staged native engine. Linux passes `libpdfium.so`, Windows
   `pdfium.dll`; the document is the authored `original.pdf`. No password is
   supplied because this fixture is not encrypted. The existing probe checks
   logical text/search/selection geometry, raster/strip identity, exact PNG crop
   pixels, worker epoch retirement, close/reopen, actual document-file release
   and exact worker thread exit. Commands intentionally use Cargo's normal dev
   profile: they are functional native qualification, not release performance.

The probe's `packagedPathProjection` is only a path projection. This run does not
prove that a packaged Logseq application ships or loads that relative library.
It also does not qualify rotated-page text/raster behavior merely because the
fixture contains a rotated second page: the current probe exercises page one.
Encrypted PDFs, complex scripts, actual application reader integration,
cross-process UIA/Narrator, screen-reader behavior and release/package PDF engine
loading remain separate gates.

## Evidence and ownership

Every native command propagates failure (including explicit PowerShell native
exit-code checks). The engine and fixture directories are new runner-temporary
directories. No developer document or cached system engine is an input. The
actual native engine only receives absolute paths; PATH/LD_LIBRARY_PATH is not
modified to find it.

Existing always-uploaded `_build/nsh-ci/` evidence now includes `pdfium/` with
native test logs, the artifact preparation output, engine receipt, original
LICENSE, every supplied license notice, args.gn, fixture receipt, actual engine
JSON and stderr. Downloaded engine binaries and generated PDFs remain outside
the checkout in RUNNER_TEMP and are not committed or uploaded as build evidence.
The enclosing workflow run identifies the App source and its existing LUI pin;
the engine receipt identifies the wrapper/build recipe, target and exact native
library hashes. No public API, runtime default or shipping resource contract is
changed by this private qualification tooling.
