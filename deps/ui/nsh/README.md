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
or application activation is used. Its explicit `StartupPreflight` engine
context injects an owner-local empty credential store: changing HOME alone
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

Every successful build writes `logseq-nsh.lui-build.json` through LUI's existing
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
hash when present. Archive names now use NSH's version/OS/architecture order;
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
has no MyGo selection and remains independent. This cutover does not implement
Windows OCaml DLL packaging, a production NSH release/update feed, native PDF annotation,
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
bytes and the actual four compiled archive digests. Its named source digests are
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
journal header inside the canonical `journals` subtree before the first PNG,
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
