#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
test "$(uname -s)" = Darwin || { echo 'The current Metal/SDL host requires macOS.' >&2; exit 1; }
for tool in opam pnpm node git curl cmake make pkg-config; do
  command -v "$tool" >/dev/null || { echo "Install prerequisite: $tool" >&2; exit 1; }
done
switch=${OPAMSWITCH:-5.5.0}
if ! opam switch list --short | grep -Fx "$switch" >/dev/null; then
  opam switch create "$switch" ocaml-base-compiler.5.5.0 -y
fi
export OPAMSWITCH=$switch
case "$(opam exec -- ocamlc -version)" in
  5.5.0|5.5.1) ;; *) echo 'OCaml 5.5.0 or 5.5.1 is required.' >&2; exit 1 ;;
esac
prefix=${LOGSEQ_NATIVE_SDL_PREFIX:-$HOME/.local/sdl2-2.32.10}
if ! test -f "$prefix/lib/libSDL2.dylib"; then
  build=$(mktemp -d)
  trap 'rm -rf "$build"' EXIT HUP INT TERM
  curl --fail --location --retry 3 https://libsdl.org/release/SDL2-2.32.10.tar.gz -o "$build/sdl.tar.gz"
  printf '%s  %s\n' 5f5993c530f084535c65a6879e9b26ad441169b3e25d789d83287040a9ca5165 "$build/sdl.tar.gz" | shasum -a 256 -c -
  tar -xzf "$build/sdl.tar.gz" -C "$build"
  cmake -S "$build/SDL2-2.32.10" -B "$build/build" -DCMAKE_INSTALL_PREFIX="$prefix" -DSDL_SHARED=ON -DSDL_STATIC=OFF
  cmake --build "$build/build" --parallel 4
  cmake --install "$build/build"
  rm -rf "$build"
  trap - EXIT HUP INT TERM
fi
export LOGSEQ_NATIVE_SDL_PREFIX=$prefix
export PATH="$prefix/bin:$PATH"
export PKG_CONFIG_PATH="$prefix/lib/pkgconfig:${PKG_CONFIG_PATH:-}"
export LIBRARY_PATH="$prefix/lib:${LIBRARY_PATH:-}"
export CPATH="$prefix/include:${CPATH:-}"
# Use the documented installers so the LUI/signal/native Transit pins cannot drift.
(cd deps/db-worker && opam exec -- sh scripts/install-opam-deps.sh)
opam install eio_posix tsdl -y
(cd deps/ui && opam exec -- sh scripts/install-opam-deps.sh)
pnpm install --frozen-lockfile
pnpm --dir deps/ui install --ignore-workspace --frozen-lockfile
(cd deps/db-worker && opam exec -- dune build bin/main.exe)
(cd deps/ui && opam exec -- dune build ocaml_host/logseq_native.exe)
(cd native-e2e && opam exec -- dune build && opam exec -- dune exec ./inventory.exe -- --check ..)
printf 'Ready. Run native-e2e/run.sh (SDL prefix: %s).\n' "$prefix"
