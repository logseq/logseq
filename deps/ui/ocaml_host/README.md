# OCaml native host

The SDL host has build targets for macOS and Linux. It uses LUI's CoreText/AppKit
backends on macOS and Pango/Fontconfig plus `lui.shell_linux` on Linux.
macOS rasterizes changed bands and presents immutable IOSurfaces through
Core Animation, using four raster workers by default. `LUI_GPU=metal` explicitly
selects Metal. Linux uses OpenGL. In-app menus use AppKit on macOS and the
shared LUI overlay on Linux.
On Linux, `LUI_GPU=cpu` selects LUI's software rasterizer and SDL presentation
without requesting an OpenGL window or context. Linux graphics failures
are reported rather than silently switching to an invisible renderer.

## Build

Use OCaml 5.5.1 and LUI's `feat/ml-backend` branch, as in
`.github/workflows/refactor-lui.yml`. Clone LUI separately, check out that
branch, and export its absolute path as `LUI_SOURCE` before installing
dependencies. Record `git -C "$LUI_SOURCE" rev-parse HEAD` with build logs.

Linux needs the development packages listed in the workflow, including
Pango, Cairo, Fontconfig, SDL2, SDL2_ttf, OpenGL, SQLite, libffi, and GMP.
On macOS, install `pkg-config sqlite3 sdl2 sdl2_ttf libffi gmp` with Homebrew.
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

Relative native image paths resolve under `Contents/Resources`. For a direct
development executable, set `LOGSEQ_NATIVE_ASSET_DIR` to the repository's
absolute `resources` directory. The host decodes PNGs with `imagelib`, already
included by the dependency installer. Decoded pixels belong to mounted image
nodes and are released when those nodes disappear.
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

On the affected macOS installation, SDL2-compat reports incorrect mouse
coordinates. The development bundle uses the installed SDL 2.32.6 library
in `Contents/Frameworks/libSDL2-2.0.0.dylib`, with the executable's SDL
install name set to `@executable_path/../Frameworks/libSDL2-2.0.0.dylib`.
Preserve that dependency when replacing the executable and sign the
bundle again before launching it.
