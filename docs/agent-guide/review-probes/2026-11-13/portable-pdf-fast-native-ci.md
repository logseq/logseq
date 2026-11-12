# Fast private PDF native feedback

The separate `nsh-pdf-native.yml` workflow runs the actual Rust example test
target and prepared-engine probe on Ubuntu 24.04 and Windows 2022. It avoids
OCaml, opam, Node and pnpm setup so native PDF type and lifetime failures appear
before the complete application build. It runs on matching PDF pull-request
changes or an explicit workflow dispatch. No local execution or CI dispatch was
performed while authoring it.

This narrower entry is supported by the current source boundary:

- App `deps/ui/nsh/Cargo.toml` has no build script, `build` or `links` directive.
  The example includes the actual portable PDF modules directly.
- Exact LUI `961107c7c071b04551587b39cc7cdd16f738c07a` also has no NSH
  build script. Its OCaml runtime boundary in `platform/nsh/src/runtime.rs`
  loads the supplied library dynamically with `libloading::Library`.
  The PDF example does not instantiate that boundary or an OCaml runtime.
- The sibling LUI checkout remains necessary for Cargo's existing path
  dependency. Its immutable pin matches both complete application workflows;
  changing the provider requires updating these three workflow pins together.

Linux tests use the existing Xvfb/D-Bus isolation and explicit GTK X11 backend.
Windows tests retain their own OLE apartment initialization and exact hidden
window lifetimes; a shell apartment is not substituted. Both use Rust 1.97.0,
the committed lock file, bounded build parallelism and the existing large stack
budget. Windows resolves the real Visual C++ linker before compilation.

The engine step reuses `prepare_pdfium.py` and `prepare_pdf_probe.py`, preserving
the pinned artifact size/hash, authored-document receipt, native output and
license closure in uploaded evidence. The downloaded engine and original PDF
stay in one exclusively created runner temporary directory, removed by the
owning step. No system PDF library or developer trust store is used. Cargo's
normal per-workspace target directory is retained.

A pass qualifies only the exercised Rust/GTK/Win32/COM/engine worker subset.
The existing `nsh-desktop.yml` and `nsh-windows.yml` remain unchanged final
application gates: native OCaml, schema/static checks, actual application
startup, packaging, installer/runtime resources and real contracts still need
their separate results. This feedback workflow does not enable portable PDF
production registration or establish full reader/annotation parity.
