# OCaml native host (experimental)

**Status: experimental.** This optional self-drawn host does not replace the
WebView desktop or Electron paths. LUI mobile backends remain maintained.
Its native renderer comes from the pinned LUI SDK. The host links the current `logseq_ui_native` application
library directly; it does not restore an older copy of the application logic.

The application name and bundle identifier explicitly identify this backend
as experimental. Only the native SQLite database worker is shipped; SQLite WASM
and zvec binaries are rejected by the builder. Platform-specific source and
stub builds do not establish runtime acceptance on another operating system.

The SDL host has build targets for macOS and Linux. It uses LUI's CoreText/AppKit
backends on macOS and Pango/Fontconfig plus `lui.shell_linux` on Linux.
macOS rasterizes changed bands and presents immutable IOSurfaces through
Core Animation, using four raster workers by default. `LUI_GPU=metal` explicitly
selects Metal. Linux uses OpenGL. In-app menus use AppKit on macOS and the
shared LUI overlay on Linux.
On Linux, `LUI_GPU=cpu` selects LUI's software rasterizer and SDL presentation
without requesting an OpenGL window or context. Linux graphics failures
are reported rather than silently switching to an invisible renderer.

The native entry requires an explicit JSON caret capability before mounting
views. This host passes `{"paintsCaret":true}` because its glyph-layout painter
owns the caret. Hosts using the shared measured overlay must pass `false` instead.
Neither the platform nor `GenericHost` implies caret ownership. Empty startup
payloads are invalid; rebuild the launcher and OCaml entry together.

## Build

Use OCaml 5.5.1 and the LUI revision pinned by the repository installer.
The opt-in build and test commands are:

```sh
pnpm ui:native:experimental:build
pnpm ui:native:experimental:test
LOGSEQ_ROOT_DIR=/tmp/logseq-native-test LOGSEQ_UI_STATE_DIR=/tmp/logseq-native-ui \
  pnpm ui:native:experimental:run
```

For an uninstalled local SDK, use
`python3 deps/ui/ocaml_host/build.py --lui-source /absolute/path/to/lui`.
It builds the SDK into its isolated Dune install tree without repinning the
active opam switch. Build metadata records the application revision and whether its checkout is dirty,
plus the SDK revision and checkout state when a local SDK is supplied. Generated packages live in `deps/ui/_build/native-experimental`.
The macOS builder embeds SDL3 directly in `Contents/Frameworks`, checks that
no SDL2 or development-machine dependencies remain, and signs the bundle.
End users do not need to install SDL3. Credential requests use the macOS Keychain; Linux
currently reports credential storage as unsupported instead of leaving promises pending.

Linux needs the development packages listed in the workflow, including
Pango, Cairo, Fontconfig, SDL3, OpenGL, SQLite, libffi, and GMP.
On macOS, install `pkg-config sqlite3 sdl3 libffi gmp` with Homebrew.
Select Xcode 16.2 or a newer supported SDK before installing the OCaml
dependencies. The current LUI Metal backend uses `MTLCompileOptions.mathMode`,
which is absent from Xcode 15.4's SDK. CI runs on macOS 15 with Xcode 16.2
(macOS 15.2 SDK); it does not establish compatibility with older macOS
runtimes. Set `DEVELOPER_DIR` to the selected Xcode's `Contents/Developer`
directory and check `xcodebuild -version` and
`xcrun --sdk macosx --show-sdk-version`.

From the repository root, with the OCaml switch selected:

```sh
(cd deps/db-worker && sh scripts/install-opam-deps.sh)
(cd deps/ui && sh scripts/install-opam-deps.sh)
opam install -y uri mtime
(cd deps/db-worker && opam exec -- dune build bin/main.exe)
(cd deps/ui && opam exec -- dune build ocaml_host/logseq_native.exe)
(cd deps/ui && opam exec -- dune runtest ocaml_host)
```

Outputs:

- `deps/db-worker/_build/default/bin/main.exe`
- `deps/ui/_build/default/ocaml_host/logseq_native.exe`

The platform test shapes and rasterizes text without opening a window.
The host itself needs a desktop display and a working graphics backend.
Build each target on its own operating system; Linux build success does
not validate a macOS binary.

Linux stores UI state under `$XDG_STATE_HOME/logseq`, or
`~/.local/state/logseq` when the XDG variable is unset, empty, or relative.
`LOGSEQ_UI_STATE_DIR` overrides this location. macOS retains its existing
Application Support location and LaunchAgent behavior. Linux does not
install a LaunchAgent. Automatic Linux desktop appearance detection is
not wired yet; the app's theme preference remains available.

## Packaging

LUI already provides `lui package --exe PATH --no-build`, including
`--platform linux --tar`, `--deb`, or `--appimage`, and
`--platform mac --dmg`. This requires an already working native host;
it does not translate macOS bindings into Linux implementations.

A complete Logseq distribution also needs its DB worker, fonts, and icon
resources. The current CLI's resource option only bundles web assets;
do not treat a package containing only the host executable as a complete
Logseq distribution. LUI's existing `Lui_pkg` and platform packagers
support explicit resources for future application packaging integration.

For a macOS Logseq bundle, copy [Info.plist](Info.plist) into
`Contents/Info.plist` before signing. Install the host as
`Contents/MacOS/LogseqNative`, the worker as
`Contents/Resources/logseq-db-worker`, and fonts under
`Contents/Resources/fonts`. Copy the existing `resources/img/{light,dark,system}-theme.png` files to
`Contents/Resources/img/` for the Settings theme thumbnails. Keep the native
libraries from the tested build.

Copy `resources/dicts/*.edn` to `Contents/Resources/dicts/`, preserving their
filenames. English remains embedded; the selected non-English dictionary loads
from this directory before the first view is constructed. Missing or malformed
packaged dictionaries fail startup instead of silently showing English. Only
requested locales are parsed and retained in memory.

The shared application resource service emits relative URLs on Web and local
file URLs on native. Theme cards use the same URL image kind and typed cover
fitting on both hosts. Relative native resource paths resolve under
`Contents/Resources`. For a direct development executable, set
`LOGSEQ_NATIVE_ASSET_DIR` to the repository's absolute `resources` directory. Local file URLs decode their percent-encoded
paths before reading; Unicode, spaces and literal percent sequences retain their
filesystem names. URL images and local files share the host decoder. PNG, GIF,
BMP and PNM use `imagelib`; macOS JPEGs use Image I/O
with EXIF display orientation and sRGB RGBA output. Linux JPEG decoding
remains unsupported. Decoded URL pixels belong to mounted image owners and
are released after their final owner disappears. Local files also use the
existing bounded resource cache.
The template enables `MallocSpaceEfficient=1` at process startup so the allocator
can reclaim unused backing memory. The bundled worker inherits this policy.
Direct executable launches require the same environment setting to reproduce
bundle memory measurements. Report physical footprint and RSS separately;
reclaimable pages can remain resident until the system needs them.

## Interaction metrics and acceptance

The FPS overlay counts actual Metal drawable presentations when Metal is
selected. Core Animation presentation timing is not yet measured; its displayed
FPS is not an acceptance result. The dialog button opens a live metrics split.
Scrollbars start hidden, appear during scrolling, and hide after 800 ms without movement.

On macOS, window dragging is selected from the titlebar region at mouse-down;
header controls retain ordinary button input even after hovering a drag region.
Sidebar dropdowns use retained trigger anchors, viewport collision handling and
shared menu chrome. Context menus retain the context-click rectangle. Pressing
the owning trigger again closes its menu. Open menus, popups and dialogs suppress
chrome tooltips, including delayed tooltip callbacks. Page-title disclosure is
hover-only for collapsable titles; arrow direction and page properties update
together when the title is expanded or collapsed.

Software frame pacing uses interruptible SDL waits. Mailbox and input events
can wake the loop before the next display deadline; those wakeups retain the
deadline and coalesce view updates before layout and paint. The 120 Hz pacing
target and the platform's vsync path are unchanged. macOS reads its system
theme directly from Core Foundation preferences without launching `defaults`.
Linux continues to retain the application's selected theme.

Set `LOGSEQ_NATIVE_METRICS` to a JSONL file path to retain phase timings,
actual presentation intervals, and received key/text counters. Input
latency measures the SDL event timestamp to host-frame completion;
it excludes GPU/display delay. `LUI_FLEX_PROFILE=1` enables layout call
counts. `LUI_METAL_CAPTURE` captures a serializable scene on frame 30;
creating `<capture-path>.request` captures the next rendered scene.
Close the app before an offscreen GPU replay to avoid competing workloads.

`native_acceptance.py` validates a recorded scenario against CPU/GPU,
display, input, and layout budgets. It requires observed functional
evidence as well as timing data before reporting overall acceptance.
For typing, the evidence contains `expected_text`, `actual_text`,
`input_duration_s`, `caret_correct`, `ime_expected_text`, and
`ime_actual_text`. It requires 200 characters at 20 characters/s and a
correct non-ASCII IME commit. Enter evidence contains `expected_text`,
`actual_text`, `input_duration_s`, `enter_presses`, `before_blocks`,
`after_blocks`, and `final_block_focused`; 50 presses at 10 presses/s must
create exactly 50 blocks and retain editor focus. Read persisted data from the same running worker;
using a global CLI with a different revision can replace that worker.

```sh
python3 deps/ui/ocaml_host/native_acceptance.py recording.jsonl \
  --scenario typing --refresh-hz 100 --warmup-s 5 --evidence typing-evidence.json
```

The workload target is 120 FPS (8.33 ms). Editing requires at least
60 actual FPS, with CPU/layout p95 at most 16.67 ms. A lower-refresh
display cannot certify 120 physical FPS. These budgets are enforced by
the scenario validator and tested under `dune runtest ocaml_host`.
Run hardware GPU budget tests with `dune runtest -j 1` and close the
application first so other Metal test processes do not compete for the
same GPU. The default Metal suite includes the native modal composition;
captured-scene replay remains available for diagnosing a specific graph.

The experimental host uses the SDL3 OCaml binding pinned by LUI. Mouse
coordinates and wheel deltas retain fractional precision; event latency uses
nanosecond timestamps. Text input and IME rectangles belong to their specific
SDL3 window. The event adapter copies text and drop strings before another
event can invalidate their native storage.
Pointer coordinates and movement deltas use JSON number encoding, including
whole numbers; OCaml float display strings are not valid wire encodings.

Document key handlers run before the editor conduit. A handler that consumes
an editing shortcut must prevent its default action; the host then skips the
conduit delivery, so navigation and deletion occur once per keydown. An initial
block click keeps the native caret hidden until its hit-tested offset is ready,
matching the shared editor overlay's pending-focus behavior.
Empty block titles use a zero-width single-line placeholder, so entering or
leaving edit mode preserves the same line height as a one-line text block.

The macOS builder packages the linked SDL3 runtime and its dependencies in
`Contents/Frameworks`, adds the runtime-loading alias, and verifies the signed
bundle. Inspect the running process's loaded-library paths during acceptance:
all SDL3 mappings must come from this bundle, with no SDL2 compatibility layer.
Do not modify Homebrew's links or rely on a development-only
`DYLD_LIBRARY_PATH` or `SDL3_LIBRARY` for release launches.
