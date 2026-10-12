# OCaml native host

The SDL host has build targets for macOS and Linux. It uses LUI's CoreText/AppKit
backends on macOS and Pango/Fontconfig plus `lui.shell_linux` on Linux.
macOS keeps Metal as its default renderer; Linux uses OpenGL. In-app
menus use AppKit on macOS and the shared LUI overlay on Linux.
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
opam install -y uri
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
