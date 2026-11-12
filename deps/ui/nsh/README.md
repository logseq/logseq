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

The shell script implements native macOS and Linux builds. The separate native
Windows source recipe is documented below; Windows compilation, signing and
packaged launch still require real runner qualification. This script does not build the
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
keep user data separate; no login daemon, OS window, screenshot or application
activation is used. An ephemeral loopback agent in the owned child serves the
read-only heap-configuration queries; it is separate from any running user app.
Its explicit `StartupPreflight` engine context injects an owner-local empty credential store: changing HOME alone
would not isolate the OS keychain. The production runner always uses the native
vault; no environment variable selects the in-memory test store.
The test requires Demo/Journals and real
Search/sidebar buttons, then requires a visible dated journal title within the
nonzero measured main split, its native main-content Scroll and Journals subtree.
Sidebar labels or mounted empty containers cannot satisfy this body check. A
bounded layout/text summary is emitted before the body wait and on failure; the
gate fails immediately when `lui-backend-error` appears.
Its engine and private worker processes are cleaned up after either outcome.

The integration target requires `LUI_OCAML_LIBRARY`, `LOGSEQ_NATIVE_ASSET_DIR`
and `LOGSEQ_DB_WORKER_BIN`; missing inputs fail with a build instruction rather
than silently skipping qualification. Ordinary `cargo test --lib` remains the
fast unit-test path without loading the application library. A successful gate
qualifies this production startup path and its encountered backend validation;
it does not statically prove every conditional UI branch or replace native UX,
IME, signing and update tests.

## Release memory evidence

[November 12, 2026 release controls](RELEASE_MEMORY.md) record the ten-second
physical footprint, summed RSS and separately reported OCaml capacities from
one previous release artifact. The approximately 135 MiB override result is a
historical control; the integrated release and picker virtualization require
fresh measurements.

## Safe native publication and build receipts

Compilation stages the candidate executable, OCaml shared library, complete
Resources directory and private DB worker under a temporary publication directory.
The startup gate loads that staged library/resources/worker and mounts the same
Rust App in its test executable; it does not launch the candidate OS executable.
Compilation, preflight or source-stability failure leaves the published artifact
set and its prior receipt untouched.

Only a qualified candidate reaches publication. Resources and code use
same-filesystem atomic file replacement, with the receipt replaced last. The
Resources directory is shared with maintained backends: only stale paths listed
in an earlier NSH receipt's `ownedResources` are removed on this success path.
Legacy receipts authorize no deletion, and unrelated outputs remain untouched. The build never
truncates mapped code or stops a running application. Local publication is not a
multi-file transaction: an I/O failure partway through publication stops without
a new successful receipt, and the old receipt will reject the partial set. This
local build mechanism is separate from packaged whole-application installation.

Every successful Unix build writes `logseq-nsh.lui-build.json` through LUI's existing
`tooling/lui_build_receipt.mjs` API. It covers the executable digest; actual OCaml
library and installed resources/worker; app Rust sources, Cargo files and schemas;
OCaml native/shared source scopes and generators; dictionaries, icons and fonts;
and the actual compiled LUI Rust source package plus OCaml LUI sources. The Rust
contract JSON and shared Web SVG files embedded by NSH are included. Theme inputs
include authored CSS, native generators, the package lock and the pinned Tailwind
typography stylesheet. Cargo
metadata selects the local Rust package before compilation, and the actual
compiler-artifact manifest must match that selection. The input scan uses
explicit source/resource scopes rather than repository roots, build directories,
Cargo target trees or generated NSH runner caches. New files inside a source
scope also make the receipt stale.

`run.sh` refuses an invalid receipt. Other LUI tooling can verify the same file:

```sh
node ../lui/tooling/lui_build_receipt.mjs check \
  --artifact deps/ui/_build/nsh/logseq-nsh
```

The existing receipt API snapshots explicit source inputs before compilation
and rechecks them before and after qualification. Added, removed or changed
inputs reject publication. Regenerating a changed canonical schemas.json is a
source change too: review the update and rerun the cached build. Final receipt
paths are relocated from tested staged bytes. Installed resource inputs list
individual owned files rather than unrelated shared-directory contents; a new
source edit cannot be
recorded as if it had been compiled. Receipts do not replace native launch,
signing, updater or visual qualification.

The publication regressions use fake toolchain commands and temporary files;
they do not invoke Cargo, Dune or an OS application:

```sh
node --test deps/ui/nsh/build_publication_test.mjs
```

## Background agent use

The native runner accepts `--startup-preflight <absolute-private-root>` for an
explicit qualification launch. Public `Root::new` passes `AppProps.startup_preflight`
to the actual App; it defaults to false, and `Root::of::<App>()` still uses the
ordinary native credential store unless Headless supplies its existing explicit
`StartupPreflight` engine marker. The flag and the marker select the same
owner-local empty credential implementation. Credentials are never selected by
an environment fallback, and this initialization-only prop does not change the
running app's store reactively.

The flag requires HOME, LOGSEQ_ROOT_DIR, LOGSEQ_GRAPHS_DIR and LOGSEQ_UI_STATE_DIR
to name existing directories below its private root, plus
`LOGSEQ_NO_LOGIN_DAEMON=1`. Public native AppOptions put NSH storage and disk cache
under that root too. Ordinary launch storage/cache defaults remain native; the
native application metadata consistently identifies `com.logseq.logseq` on all
desktop platforms. Graph and persisted UI-state paths retain their existing
application contracts.

Build first under the normal toolchain home. For a background macOS qualification
launch, create a private state root and invoke the resulting executable directly:

```sh
native_host=$(bash deps/ui/nsh/build.sh)
native_output=$(dirname "$native_host")
qualification_root=$(mktemp -d "${TMPDIR:-/tmp}/logseq-nsh-qualification.XXXXXX")
mkdir -p "$qualification_root/home" "$qualification_root/root" \
  "$qualification_root/graphs" "$qualification_root/state"
env HOME="$qualification_root/home" \
  LOGSEQ_ROOT_DIR="$qualification_root/root" \
  LOGSEQ_GRAPHS_DIR="$qualification_root/graphs" \
  LOGSEQ_UI_STATE_DIR="$qualification_root/state" \
  LOGSEQ_NO_LOGIN_DAEMON=1 LUI_AGENT_BACKGROUND=1 \
  LUI_OCAML_LIBRARY="$native_output/liblogseq_ui.dylib" \
  LOGSEQ_NATIVE_ASSET_DIR="$native_output/../Resources" \
  LOGSEQ_DB_WORKER_BIN="$native_output/../Resources/logseq-db-worker" \
  "$native_host" --startup-preflight "$qualification_root"
```

Stop that process and its private worker before removing the qualification root.
The existing background option keeps the app nonactive; this invocation does not
request screen unlocking or display wake. Set the existing loopback agent address
explicitly when agent interaction is needed.

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

Startup body qualification uses only public Headless text and layout evidence.
It accepts the application's dated title format rather than inventing a journal
or overriding the model/date, and checks the title intersects the measured main
viewport. A passing Headless gate still requires a separate background native
capture/UX review; it does not prove AppKit pixels or a usable completed UI.

## Native sidebar sizing ownership

On NSH, the outer left ResizablePanelGroup alone owns sidebar width, capture and
its native divider. The retained sidebar content fills that pane; it has no
viewport-width child, fixed-position reveal, invisible shade or nested reveal
split. Its inner content follows the native pane during a drag instead of pinning
itself to the last persisted width. Opening a narrow NSH desktop window uses the
same native pane rather than switching to the Web reveal overlay. The right
sidebar's existing breakpoint and measured-content conversion remain unchanged.

The left preference remains absolute points (`ls-left-sidebar-width-px`), while
the right preference remains a fraction (`ls-right-sidebar-width`). Native close
keeps the last nonzero saved size for reopening. No new size model, gesture
controller or NSH fork is introduced. Other hosts retain their existing inert,
small-window reveal/shade, handle options and animation behavior.

The real application gate checks that the visible left sidebar matches its
nearest native panel bounds and has no nested native split panes. It then resizes
the viewport and closes/reopens the sidebar through public native input, checking
that the Journals region and main Scroll retain their native identities while
a dated title remains visible. This does
not claim focused block-editor draft/IME qualification; those remain separate
editor tests and native UX checks.

## Desktop commands and application archives

The optional loopback LUI CLI endpoint now forwards semantic requests through
the existing `Lui_agent.app_target` for the actual OCaml reducer. The seven-argument
startup ABI is unchanged; `lui_ocaml_agent_utf8` is an additional optional export.
Each request owns the existing application entry lock and publishes every queued
batch before its reply. Use `hello` to inspect operations, then `find`, `prop`,
`press` or `type` with the canonical LUI selectors. The native macOS screenshot
command remains available without activation. Semantic actions do not qualify
native hit testing, keyboard focus, IME or accessibility.

The active repository commands are `pnpm ui:nsh:build`, `pnpm ui:nsh` and
`pnpm ui:nsh:package`. MyGo command aliases and its old build/launch/package
scripts are removed. The existing native OCaml object target and source-copy
rules remain unchanged; the shared `native/` application and services continue
to serve maintained backends.

`ui:nsh:package` first uses the qualified native build, then copies its exact
executable, OCaml library and receipt-owned resources into a relocatable bundle.
An already built artifact can be selected explicitly:

```sh
pnpm ui:nsh:package --built-host "$PWD/deps/ui/_build/nsh/logseq-nsh"
```

The command refuses stale code/resources, unowned resource paths and source
changes during packaging. Shared Resources outputs owned by other maintained
backends are not copied. The launcher and direct native resource resolvers select library, asset and
private worker locations from the installed executable directory, independently
of the working directory. macOS uses `../Resources`; Linux/Windows use the
sibling `Resources` directory. Explicit library/asset overrides remain supported.
An invalid `LOGSEQ_DB_WORKER_BIN` fails immediately, and an identified installed
package never searches a checkout for a missing worker. The development run
script retains its explicit qualified paths.
The packager writes the archive plus `<archive>.lui-build.json` only after
source verification; a package receipt hashes the final archive after native
library relocation and signing.

| Target | Archive | Layout |
| --- | --- | --- |
| macOS | `deps/ui/_build/packages/Logseq-NSH-{version}-macos-{aarch64,x86_64}.zip` | `Logseq NSH.app/Contents/MacOS/{Logseq,logseq-nsh}` and `Contents/Resources/` |
| Linux | `deps/ui/_build/packages/Logseq-NSH-{version}-linux-{aarch64,x86_64}.tar.gz` | `Logseq-NSH/{logseq,logseq-nsh}` and `Resources/` |

The installed version, archive name and generated release configuration all
come from `resources/package.json`; the development `nsh.json` no longer carries
a separate version. Metadata is written before signing at
`Contents/Resources/nsh/app.json` on macOS and `nsh/app.json` at the Linux app
root. Linux replaces the complete app directory, including its sibling
`Resources/` library, worker and assets, instead of only the old `bin/` directory.

Updates are absent by default. To embed an existing release source and public
key, pass both explicit options:

```sh
pnpm ui:nsh:package --built-host "$PWD/deps/ui/_build/nsh/logseq-nsh" \
  --update-url "$LOGSEQ_UPDATE_MANIFEST_URL" \
  --update-public-key "$LOGSEQ_UPDATE_PUBLIC_KEY_FILE"
```

These variables stand for release-owner inputs, not built-in defaults. The URL
must be HTTPS without credentials or a fragment. The qualified host's pure
`--validate-update-config` mode validates the generated configuration through
NSH/LUI before signing; it starts no UI, updater worker, cache or request.
Without both options, no `nsh/assets/nsh-updater.json` is created. The public key
file and generated metadata are checked again before the final archive receipt.
Do not pass a signing secret as the public-key file.

Each archive has an adjacent `<archive>.release/nsh.json` containing that exact
release version and optional updater settings. It can be passed to the pinned
NSH CLI's `update-manifest --entry <archive>.release` after all target archives
are finalized. This sidecar contains public release metadata, never the signing
secret. The archive receipt records its hash and the installed updater-config
hash when present. Before invoking the manifest CLI from the build checkout,
validate both final artifacts:

```sh
node deps/ui/scripts/package-nsh.mjs check-release "$archive"
```

A generic archive freshness check does not inspect this separate sidecar. The
release check also binds its identity and canonical archive name to the receipt.
Packaging checks the complete candidate before publishing and publishes the
receipt after both archive and sidecar. Local publication remains per-file,
not a multi-file transaction. The pinned NSH manifest CLI itself does not read
these application receipts; release automation must retain this check and must
only publish manifest/signature outputs when the CLI exits successfully.
Archive names now use NSH's version/OS/architecture order;
consumers of the old version-last names must update their artifact selection.
This packaging stage does not establish actual upgrade/restart qualification.

macOS uses
`dylibbundler` to collect non-system libraries into `Contents/Frameworks`, signs
nested native code and verifies the app signature. It defaults to an ad-hoc
signature. Set `NSH_CODESIGN_IDENTITY` to an existing Developer ID identity to
request distribution signing; set `NSH_NOTARY_PROFILE` to an existing notarytool
keychain profile to request notarization and stapling. No credentials are
created. These source paths require actual signing/notarization qualification
before release claims. Linux archives use the target's native GTK/graphics and
C runtime dependencies; they are not self-contained AppImages or installers.

The separate NSH CI workflow owns native artifacts. Electron's release workflow
has no MyGo selection and remains independent. This cutover has not qualified
Windows native installation, a production NSH release/update feed, native PDF annotation,
or every raw markup/media widget. Passing the staged Headless startup gate is
not an outside-checkout OS launch, IME, accessibility or update qualification.

## Native Windows DLL candidate

On a native Windows x86_64 OCaml 5.5.1 toolchain with the actual application
OCaml dependencies installed, run:

```powershell
python deps/ui/nsh/build_windows_dll.py
```

This source recipe builds the four actual Logseq native library archives,
compiles `native_embed.ml` and the real seven-argument `logseq_lui_bridge.c` with
the configured OCaml C compiler, and links a candidate DLL using
`-output-complete-obj`. It does not use the Unix `_pic` executable-object target
or LUI's generic three-argument bridge. A separate child process checks native
DLL loading and every declared bridge export; no exported application startup
function is called by that probe. Loader/CRT initializers may run.

The candidate and `ocaml-toolchain.json` are written beneath
`deps/ui/_build/nsh-windows-candidate`, separate from the qualified application
publication directory. The receipt records compiler settings, exports, candidate
bytes, exported schema digest and the actual four compiled archive digests. The
same compiled `Native_embed.extension_schemas ()` is exported by a standalone
native OCaml program and compared semantically with tracked `schemas.json` before
Rust compilation. A mismatch fails without publishing the DLL. Its named source digests are
limited to the builder and bridge/entry sources; they are not a full application
build-freshness receipt. Windows compile/load execution still requires a real
runner. The private DB worker, its SQLite/native dependencies, complete resources,
actual App startup, packaged launch, signing and upgrade remain separate gates.
A successful DLL export probe alone must not be reported as a working Windows
Logseq application. The guard tests use mocks and do not establish those results.

## Actual application CI boundary

`.github/workflows/nsh-desktop.yml` checks out the immutable LUI provider beside
Logseq, runs strict actual-App Rust checks and service/factory tests, then invokes
the staged native build and its real OCaml startup gate on Linux and macOS.
It packages that exact qualified host with `ui:nsh:package --built-host`, checks
the archive's source receipt, extracts it outside the checkout, and re-runs the
real App Headless gate with the archive's actual OCaml library, DB worker and
resources:

```sh
python3 deps/ui/nsh/qualify_packaged_startup.py /absolute/Logseq-NSH-archive \
  --evidence /absolute/packaged-startup.json
```

The macOS extraction also verifies the packaged code signature. This establishes
packaged resource/runtime startup, not a native window launch or pixel/UX parity.
`packaged-startup.json` records those remaining boundaries explicitly. The generic
LUI Todos package qualifier uses a different application ABI and is not substituted
for this actual Logseq gate. Windows remains outside this Unix application CI job.


## Native editor text-span policy

Logseq's shared editor emits one standard Text per logical line, with keyed Text
fragments directly inside it. NSH natively treats nested Text as spans in that
parent's single attributed-text layout; the span's `display=block` does not
introduce a separate block, row or native text view. For NshHost only, shown
markup delimiters therefore use that supported native display value rather than
browser `inline`. The fragment's source text, keyed identity and line parent are
retained through reveal changes. Maintained Web, Apple and other hosts retain
their existing inline value.

Native inline-code fragments inherit the actual parent size (`1em`), retaining
their monospace family and authored marks. This is an intentional native visual
policy: NSH exposes inherited size but not an arbitrary fraction of the current
parent metric. It does not guess a 16-point parent or implement a CSS resolver.
Other hosts retain their existing `0.9em` code treatment.

`Edit_view_test` records actual line/fragment output for WebHost, SwiftUIHost and
NshHost, checking those distinct properties and retained IDs through reveal.
`cargo test --test editor_spans` consumes the corresponding standard LUI shape
through the real renderer/public Headless engine, checking one attributed line,
ordered span ranges, live inherited size, reveal and native Text/span identity.
These are source/consumer checks, not an operating-system IME qualification. The
shown-run policy alone does not prove concealed-delimiter advance removal;
`visibility:hidden` and `display:none` have different text-layout semantics and
require a separate renderer projection check.


### Packaged macOS background-window regression

After building and packaging the actual host, run:

```sh
LUI_SOURCE_ROOT=/absolute/path/to/lui python3 deps/ui/nsh/qualify_packaged_startup.py \
  /absolute/path/to/Logseq-NSH-darwin-arm64-2.0.2.zip \
  --native-background --evidence _build/nsh-ci/packaged-startup.json
```

The flag selects a real macOS package-launch qualification; the default remains
the packaged-library Headless gate used on Linux. It extracts outside the checkout
and runs the actual `Contents/MacOS/Logseq` launcher with fresh private
home/graph/state directories and `--startup-preflight`. External native library,
asset, worker and dynamic-loader overrides are removed. It reuses LUI's existing
packaged-agent helper, requires Journals semantic readiness and an actual dated
journal header inside the canonical `journals` subtree before the first PNG.
The existing `native-bounds` operation must also prove positive intersecting
AppKit bounds for the main Scroll, Journals region and dated title, with a visible
window and complete unhidden, nontransparent ancestry. These native replies are
retained in `journalBody.nativeBounds`; semantic nodes alone cannot qualify startup.
Before `journal.png`, the gate additionally waits for actual open-sidebar layout:
the main pane meets the sidebar shell and its full content column, and the main
right edge reaches the same native viewport's right edge. This uses current
bounds, including the authored content width while its shell animates, rather
than a fixed sidebar width or animation sleep. The replies are saved as
`openSidebarLayout`. A visible strip during opening cannot qualify that capture;
this condition still does not establish full animation, pixel or UX parity.
The flow rejects a `hello.backend_error` renderer diagnostic,
captures real app content, activates the native More/Appearance controllers and requires the actual
startup log to report `active=false, hidden=false`.

The native flow has a 50-second deadline plus bounded cleanup within 60 seconds.
Only its fresh process group and private resources are stopped. The evidence
JSON reports `qualified-background-native-window`; PNGs, agent transcript, tree
and native log are preserved beside it and uploaded by macOS CI. Successful
capture/controller activation does not establish pixel/UX parity, hardware
input, focus or IME behavior. No application activation, unlock or display-power
operation is performed. The optional mode requires actual macOS and never
silently falls back to Headless.


## Complete Windows application build candidate

The native Windows x86_64 source path now has a thin orchestrator. Use the same
OCaml 5.5.1 switch and actual UI/DB-worker dependencies as the DLL recipe, Rust
1.97.0, Python 3.11+, Node.js and the x64 Visual Studio DUMPBIN tool. From an
initialized native toolchain shell, supply the actual flat directories containing
the MinGW/OCaml and/or Visual C++ redistributable DLLs required by that toolchain:

```powershell
python deps/ui/nsh/build_windows.py --lui-source C:\src\lui `
  --dumpbin C:\tools\VC\bin\Hostx64\x64\dumpbin.exe `
  --dll-root C:\tools\opam-native-dlls --dll-root C:\tools\vc-redist-x64
```

These paths are examples, not downloaded or selected toolchains. The script
refuses non-native/foreign-architecture OCaml configurations. It reuses the
existing libraries, seven-argument bridge and worker Dune target without changing
Dune files. It exports and checks the real OCaml extension schemas before
compiling Rust, then assembles a private candidate with the host, actual OCaml
DLL, worker and complete fonts/catalog/dictionary/image resources.

[DUMPBIN /IMPORTS](https://learn.microsoft.com/en-us/cpp/build/reference/imports-dumpbin?view=msvc-170)
provides ordinary and delay-import dependencies. Every collected code file must
be PE x86_64. The dependency closure uses only explicit `--dll-root` directories,
rejects ambiguous same-name bytes and records source/destination SHA-256 digests.
Windows System32 libraries and API-set contracts remain operating-system
dependencies; Visual C++ runtime DLLs still require explicit redistributable
roots even if installed on the builder. It copies dependencies beside each
executable or Resources DLL rather than relying on the opam/build PATH. This
covers PE imports, not arbitrary application-chosen dynamic plugin filenames.

Before publication, the compiled `startup_preflight` executable runs the real App
with the staged seven-argument DLL, private worker/resources and its existing
isolated credential/graph policy. Its PATH contains only Windows/System32 and
Windows, and the orchestrator bounds it to 240 seconds. This is the actual app
Headless gate, not a generic Todos substitute or OS window/IME qualification.

Only a successful gate followed by unchanged source/toolchain-DLL checks can
publish `deps/ui/_build/nsh-windows/logseq-nsh.exe`, sibling `Resources`, and
required root DLLs. Publication replaces individual files atomically and writes
`logseq-nsh.exe.lui-build.json` last; it is not a multi-file installation
transaction. A failed gate or changed inputs leave the previous qualified set
untouched. Obsolete files are removed only if named by this backend's preceding
receipt. Unrelated resources remain. The receipt binds actual staged code and
resources, scoped Logseq/LUI source and shared SVG inputs; the resource
`windows-dependencies.json` also records the trusted DLL provenance.

The source/fake-toolchain regressions establish ordering, dependency collection,
receipt relocation and failure isolation only. No real Windows compilation or
startup has been established by those tests. Windows archive/installer
construction now has the source path below; outside-checkout native launch, Authenticode, whole-app upgrade and CI execution
remain separate qualification work; the Unix packager does not silently produce
a Windows archive.


### Actual Windows CI qualification

`.github/workflows/nsh-windows.yml` runs the actual application path on a native
x64 Windows runner. It pins LUI `82cc86cfe1337fc78e7fe21935053f76129faa1d`,
uses stock [setup-ocaml@v3](https://github.com/ocaml/setup-ocaml/tree/v3) with
OCaml 5.5.1 and explicit MinGW/Cygwin selection, and reuses the existing DB-worker
and UI dependency scripts. Rust/dumpbin use the x64 MSVC environment from
[msvc-dev-cmd@v1](https://github.com/ilammy/msvc-dev-cmd/tree/v1). Native Rust
steps run in PowerShell so Git Bash's GNU `link` cannot shadow the MSVC linker.

The workflow resolves the actual opam MinGW sysroot, switch bin, OCaml runtime
and x64 Visual C++ CRT directories explicitly. The CRT location follows
[Microsoft's documented VCToolsRedistDir layout](https://learn.microsoft.com/en-us/cpp/windows/determining-which-dlls-to-redistribute?view=msvc-170).
It records these paths and the exact revisions, runs strict actual-App compiler
and host/factory tests, then invokes the complete Windows builder above. A real
native worker fixture verifies the OS pid returned across the bridge's owned
HANDLE boundary, handle release and checked invalid-handle errors. It compiles
in a temporary directory, never into tracked source.

LUI's pinned Windows `runtime.rs` already uses public libloading
`load_with_flags(LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR |
LOAD_LIBRARY_SEARCH_DEFAULT_DIRS)` on the canonical absolute OCaml DLL path. Its
private dependent DLLs can therefore load from Resources without the development
PATH or changing the process DLL search policy. The generic `Library::new` path
is compiled only on non-Windows targets. The worker's current vendored SQLite
archive deliberately satisfies sqlite imports before the sysroot import library;
the dependency closure and clean-PATH startup gate remain authoritative for the
actual built PE files.

CI preserves the compiler/explicit-root metadata, dependency provenance, build
log and final source receipt. The new workflow is a qualification requirement,
not a claim of a successful remote run. A green job establishes real Windows
App/OCaml/private-worker Headless startup and the HANDLE fixture; native window
launch, outside-checkout packaged launch, real ZIP/installer execution,
Authenticode trust and upgrades remain separate gates. It never substitutes the
generic LUI Todos bridge or package.


### Actual Windows archives and installer

After the real Windows builder qualifies the actual host, package that exact
artifact without rebuilding a generic NSH runner:

```powershell
python deps/ui/nsh/package_windows.py --lui-source C:\src\lui `
  --built-host C:\src\logseq\deps\ui\_build\nsh-windows\logseq-nsh.exe `
  --iscc 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe'
```

The ZIP uses canonical `Logseq-NSH-<version>-windows-x86_64.zip` naming and contains
one complete `Logseq-NSH` root: `logseq-nsh.exe`, qualified root DLLs, sibling
`Resources` with the actual OCaml DLL/dependencies, private worker and all owned
application assets, plus `nsh/app.json`. No launcher or checkout-dependent PATH
is needed; actual executable-relative resource resolution remains authoritative.
Version and optional whole-app update configuration use the same portable
metadata helper as macOS/Linux. Without a real update URL and paired public-key
file there is no updater asset/network configuration.

Packaging reuses LUI's existing PE architecture validator, ZIP writer,
`sign_windows`, `find_iscc` and `signtool sign/verify` hooks. To sign, supply
`--windows-thumbprint <installed-certificate-thumbprint> --timestamp-url <HTTPS-URL>`
and optionally `--signtool <tool>`. No certificate is created or supplied by the
script. The default is explicitly `signing=unsigned`; failed or unavailable
requested signing never falls back to unsigned publication. Nested DLLs/worker
and the actual root executable are signed and verified before archive/installer
construction; the installer is signed and verified separately. The ZIP's code
entries are streamed and compared against their final signed candidate bytes.

When Inno Setup is present (or explicitly required through `--iscc`), the
application-specific script builds a per-user `-setup.exe` using the native
NSH install conventions: stable AppId, complete recursive application files and
Start menu identity. NSH's Inno generator is private to its CLI, so this small
actual-host script describes only this payload; it does not rebuild a generated
runner or copy a toolkit implementation. It retires only installed Resources,
NSH metadata and old app-root DLLs. User APPDATA/LOCALAPPDATA, graphs, state and
cache directories are not installation payloads and are not deleted. Without
Inno, only the ZIP is produced. The Windows CI explicitly requires its documented
Inno compiler, producing unsigned ZIP and installer for qualification.

The final ZIP receipt binds scoped source/build inputs, shared signing-hook
source, the release sidecar, final installed-code hashes and optional installer
hash. The copied `windows-dependencies.json` hashes describe qualified build
inputs before distribution signatures; `installedCodeSha256` records final
packaged code after signatures. `check-release-windows <archive> <lui-checkout>`
on `package-nsh.mjs` checks all of them, including the companion installer when present. A changed code
source, signature verification failure, incomplete closure or existing release
refuses publication. The qualified dependency-provenance map must agree with
receipt ownership, so omitting a required root/Resources DLL is rejected. Archive, installer and sidecar publish before the receipt;
this is per-file publication, not a whole-directory transaction. The installer
is not an updater ZIP or a substitute for an authenticated release manifest.

Local tests use synthetic PE headers, actual ZIP/receipt functions and fake
Inno/signing subprocesses. They prove payload inclusion, ownership/freshness,
final-code hashing and publication/signing order, not Windows executable
loading, real Authenticode trust, installer execution or packaged native UX.
Those remain remote/production qualification gates.


### Windows installer admission and interrupted installation

Manual setup/removal does not force-close or restart Logseq or its shared native
DB workers: `CloseApplications=no`, `RestartApplications=no`, no shutdown API and
no post-install app launch. Public NSH single-instance forwarding covers only its
UI window and therefore cannot establish this worker/file-replacement boundary.

The actual Windows host registers a process-lifetime named activity mutex before
opening the platform App; the native worker registers independently before
opening any graph/request server. Workers deliberately outlive UI instances.
Their shared product namespace therefore continues to refuse installation after
the UI closes, including a worker started by another protocol-aware app version
or from another executable path. The fixed kernel objects are not a process
registry, polling loop or new worker controller. No graph/state/cache path is
changed. Other operating systems do not register these Windows objects.

Each runtime first registers activity and then checks the installer mutex. The
installer first registers its mutex and then checks activity; either ordering of
a concurrent launch/install refuses one side. Access/check failures refuse
admission too. Inno's built-in `AppMutex` supplies its standard running-app check,
with the same checked guard repeated before file changes and during uninstall.
`SetupMutex` alone is insufficient: Inno checks AppMutex before creating that
mutex. Runtime/installer handles last until their respective processes exit.

Before producing any ZIP/installer marker, packaging invokes the pure
`--installation-admission-protocol` flag on BOTH qualified actual binaries. They
must return `com.logseq.logseq.nsh-installation-admission-v1`; otherwise packaging
fails. The flag returns only capability identity; it does not mount the App or open
the worker daemon, graph, credential store or updater. The resulting
`nsh/installation-admission-v1` is bound by the release metadata receipt.

A nonempty existing target without that marker is refused for in-place
installation. Stop its processes and remove the old installation, or choose a
new empty target. This does not pretend that older/foreign workers already
implement the mutex: legacy workers outside the target may remain alive, their
files and databases are not modified, and worker-version compatibility remains
a separate update-preparation requirement. Raw ZIP extraction over a running
installation is not a qualified upgrade procedure.

Before changing files the installer creates `.nsh-installing`. The host and
Resources worker refuse startup while it exists. Inno verifies every installed
payload file against the final archive's SHA-256 before deleting the marker.
Cancellation, ignored copy errors, verification failure or interrupted setup
therefore cannot reopen a partially replaced installation as usable. Re-running
setup can repair an interrupted target that carries this protocol marker. The
same admission applies to removal; partial removal keeps the marker when host
or worker code remains. User data directories are never removal targets.

The local tests cover all six register/check interleavings, shared identity,
source ordering, old-worker capability rejection and packaging guards. Native
Windows/Inno execution remains required. To compile the additional real worker
primitive fixture without Dune edits, copy
`deps/db-worker/runtime/native/node_process_stubs.c` and
`deps/ui/nsh/tests/fixtures/windows_installation.ml` to a task-owned temporary
directory, then run:

```powershell
opam exec -- ocamlfind ocamlopt -thread -package 'unix,threads.posix' -linkpkg `
  node_process_stubs.c windows_installation.ml -o windows-installation.exe
```

The fixture prints `ACTIVE` after registration and keeps presence while waiting
on stdin. Two processes from separate copied executable paths must both hold
presence; closing only one stdin must not release the other. A native regression
must also hold the installer mutex and require both real binaries to fail
before application startup, require setup/removal to refuse an active fixture
without replacing files, then qualify fresh install and interrupted repair with
all processes inactive. These OS/installer results are not established by the
source/model tests or synthetic PE packaging tests.


### Native Windows installation qualification in CI

The Windows workflow compiles `windows_installation.ml` against the actual
worker's `node_process_stubs.c` in a task-owned temporary directory, then runs
`qualify_windows_installer.py` against the actual ZIP and compiled Inno setup.
The driver uses two copies of the native fixture to prove independent lifetime
across executable paths; a remaining worker must still refuse installation after
the first process exits. It also requires refusal before writing any target,
fresh private install, both installed binaries refusing startup during an
installer, interrupted-marker refusal and successful repair, legacy-target
refusal, and active-worker removal refusal followed by inactive removal.

All installation targets, profiles, graphs and state paths are private temporary
directories. Only stdin-blocking fixture processes created by this driver are
controlled; no foreign/shared service daemon is terminated. Fixture dependencies are collected with the same explicit-root PE closure
helper; fixture and installed host/worker probes use only Windows/System32 in PATH and require the actual admission error,
not an arbitrary process failure. Source receipts/sidecar/installer digests are
checked before setup, and all installed payload bytes are compared with the
actual ZIP. JSON evidence and per-phase logs are preserved under
`_build/nsh-ci/installer-admission`. These remote tests are required and have not
been run locally by the source implementation. They do not establish a visible
App window, real signing trust or a graph-saving N-to-N+1 upgrade.

The same job runs the existing native update-preparation/save-abort and 1k/100k
row harnesses after the actual build, plus the shared task/service contracts.
The row harness uses the installed `lui.ppx` package by default; no generated
Dune driver path is hardcoded. The shared compiler package recipe remains owned
by the application build and must retain its `lui`/`digestif.c` requirements.

Current admission protocol v1 deliberately uses fixed Global product names.
Default object ACLs may conservatively refuse another Windows user's concurrent
startup/installation; it does not claim multi-user isolation. Source inspection
of the stock Inno [6.7.1 script-function table](https://github.com/jrsoftware/issrc/blob/is-6_7_1/Projects/Src/Shared.ScriptFunc.pas)
and documented constants found no current-user-SID helper; NSH exposes no SID helper either. Deriving an installer
SID would currently add pointer/string marshalling or a helper/WMI/PowerShell
launch to the admission path. No such fallback or false SID/v2 marker is added.
A future SID-scoped Global protocol requires a reviewed common identity seam and
a version/marker transition before ordinary multi-user concurrency is claimed.
