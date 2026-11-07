#!/bin/sh
set -eu
bin_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
resources="$bin_dir/../Resources"
case "$(uname -s)" in
  Darwin) library="$resources/liblogseq_ui.dylib" ;;
  Linux) library="$resources/liblogseq_ui.so" ;;
  *) printf 'The MyGo desktop package supports macOS and Linux.\n' >&2; exit 1 ;;
esac
export LOGSEQ_NATIVE_ASSET_DIR="${LOGSEQ_NATIVE_ASSET_DIR:-$resources}"
export LOGSEQ_DB_WORKER_BIN="${LOGSEQ_DB_WORKER_BIN:-$resources/logseq-db-worker}"
exec "$bin_dir/logseq-mygo" -library "$library" "$@"
