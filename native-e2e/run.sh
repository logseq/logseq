#!/bin/sh
set -eu
repo=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
export OPAMSWITCH=${OPAMSWITCH:-5.5.0}
export LOGSEQ_NATIVE_SDL_PREFIX=${LOGSEQ_NATIVE_SDL_PREFIX:-$HOME/.local/sdl2-2.32.10}
test -f "$LOGSEQ_NATIVE_SDL_PREFIX/lib/libSDL2.dylib" || { echo 'Run native-e2e/bootstrap.sh first (genuine SDL2 required).' >&2; exit 1; }
cd "$repo/native-e2e"
opam exec -- dune exec ./inventory.exe -- --check "$repo"
exec opam exec -- dune exec ./runner.exe -- --repo "$repo" "$@"
