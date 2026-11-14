#!/bin/sh
set -eu

ui=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
root=$(CDPATH= cd -- "$ui/../.." && pwd)
worker="$root/deps/db-worker"
switch=$(opam switch show)
prefix=$(opam var prefix)
opam_root=$(opam var root)
run=$(mktemp -d "${TMPDIR:-/tmp}/quickjs-sdk.XXXXXX")
trap 'rm -rf "$run"' EXIT HUP INT TERM
mkdir -p "$ui/_build" "$worker/_build" "$run/state"
touch "$run/state/.quickjs-sdk-probe"

dune_in() (
  project=$1
  shift
  cd "$project"
  env -i HOME="$HOME" PATH="$prefix/bin:$PATH" OPAMROOT="$opam_root" OPAMSWITCH="$switch" dune "$@"
)

dune_in "$worker" build --build-dir="$worker/_build/quickjs-sdk" bin/main.exe
dune_in "$ui" build --build-dir="$ui/_build/quickjs-sdk" \
  native/logseq_ui_native.cmxa js_app test/quickjs/sdk_read_probe.exe
dune_in "$ui" runtest --build-dir="$ui/_build/quickjs-sdk" test/quickjs
pnpm --dir "$root/libs" run build:quickjs \
  --env "plugin=$ui/test/quickjs/read_plugin.ts" --env "output=$run/plugin.mjs"
env -i HOME="$HOME" PATH="$prefix/bin:$PATH" \
  LOGSEQ_ROOT_DIR="$run/state" LOGSEQ_GRAPHS_DIR="$run/graphs" \
  LOGSEQ_UI_STATE_DIR="$run/ui" LOGSEQ_NO_LOGIN_DAEMON=1 \
  LOGSEQ_DB_WORKER_BIN="$worker/_build/quickjs-sdk/default/bin/main.exe" \
  "$ui/_build/quickjs-sdk/default/test/quickjs/sdk_read_probe.exe" "$run/plugin.mjs"
