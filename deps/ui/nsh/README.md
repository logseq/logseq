# Logseq NSH desktop host

This Rust host loads Logseq's native OCaml application through its seven-argument
bridge. It uses the app's exported extension schemas and keeps OCaml, application
services and input dispatch on the existing ordered application pump. Graph View
rendering is excluded from this migration; graph/database features remain.

## Build and run

Install the repository's OCaml 5.5.1 opam switch, Rust 1.97.0, Python 3, Node.js,
a C compiler and the target's NSH native development libraries. Then run from the
Logseq repository:

```sh
bash deps/ui/nsh/build.sh
bash deps/ui/nsh/run.sh
```

`build.sh` prints the executable path on stdout and sends build diagnostics to
stderr. `run.sh` builds, verifies its receipt, sets the OCaml library and resource
paths, then replaces itself with the native host. `LUI_SOURCE_ROOT` selects the
OCaml LUI checkout (default: `../lui` beside the Logseq checkout); Cargo's path
dependency selects the Rust LUI package. The receipt records both actual paths,
even when they differ. `OPAMSWITCH`, `RUSTUP_TOOLCHAIN`, `CARGO_BUILD_JOBS`,
`NODE_BINARY` and `PYTHON_BINARY` can override the corresponding tools/settings.

The script currently implements native macOS and Linux builds. Windows DLL,
signing and packaged launch qualification are separate work; the presence of a
Windows Rust entry does not qualify those steps. This script does not build the
maintained LUI Apple/iOS, Android or Web backends.

## Actual-application startup gate

The build first checks LUI's generated canonical contract for freshness. Closed
domains such as display and image fit become Rust enums, and their native
provider matches are exhaustive: adding a canonical case requires explicit
provider handling before compilation succeeds. Open style strings still require
validation, and compilation does not prove all dynamic application paths.

Before writing the build receipt or reporting success, `build.sh` runs
`cargo test --test startup_preflight` with the newly built OCaml library,
resources and private DB worker. One isolated child process mounts the actual
`nsh_app_logseq::App` with public NSH Headless. Fresh home/state/graph directories
keep user data separate; no agent listener, login daemon, OS window, screenshot
or application activation is used. The test requires Demo/Journals and real
Search/sidebar buttons and fails immediately when `lui-backend-error` appears.
Its engine and private worker processes are cleaned up after either outcome.

The integration target requires `LUI_OCAML_LIBRARY`, `LOGSEQ_NATIVE_ASSET_DIR`
and `LOGSEQ_DB_WORKER_BIN`; missing inputs fail with a build instruction rather
than silently skipping qualification. Ordinary `cargo test --lib` remains the
fast unit-test path without loading the application library. A successful gate
qualifies this production startup path and its encountered backend validation;
it does not statically prove every conditional UI branch or replace native UX,
IME, signing and update tests.

## Safe native publication and build receipts

The executable, OCaml shared library and private DB worker are published with
same-filesystem atomic replacement. The build never truncates an executable or
dylib that an existing process may still have mapped. Running applications and
their worker processes are left alone; a new launch uses the new files.

Every successful build writes `logseq-nsh.lui-build.json` through LUI's existing
`tooling/lui_build_receipt.mjs` API. It covers the executable digest; actual OCaml
library and installed resources/worker; app Rust sources, Cargo files and schemas;
OCaml native/shared source scopes and generators; dictionaries, icons and fonts;
and the actual compiled LUI Rust source package plus OCaml LUI sources. Rust's
manifest path comes from Cargo's compiler-artifact record. The input scan uses
explicit source/resource scopes rather than repository roots, build directories,
Cargo target trees or generated NSH runner caches. New files inside a source
scope also make the receipt stale.

`run.sh` refuses an invalid receipt. Other LUI tooling can verify the same file:

```sh
node ../lui/tooling/lui_build_receipt.mjs check \
  --artifact deps/ui/_build/nsh/logseq-nsh
```

Build receipts detect changes after publication; they do not replace native
launch, signing, updater or visual qualification. Source files must remain stable
while a build is running.

## Background agent use

The macOS host supports `LUI_AGENT_BACKGROUND=1` without activating its window.
Use the LUI agent CLI against its loopback listener for application interaction
and in-process content screenshots. Screenshots capture app content; system menus
and separately composited surfaces are outside that capture. These operations do
not require unlocking the Mac or turning its display on.

The editor unit probes distinguish driver actions: public Headless `type_text`
delivers one native edit per Unicode character, while `paste` delivers one atomic
UTF-8 edit. The CodeMirror cancellation probe requires exactly one input callback
for an atomic multi-scalar paste, with cancelled preedit absent from the document
and the same native editor retained. This does not qualify a hardware IME commit
or Return during marked text. The block-editor removal probe advances the fixture
snapshot generation and verifies the native sink is gone before testing stale
key handlers.
