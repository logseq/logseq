#!/bin/sh
set -eu
bin_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
case "$(uname -s)" in
  Darwin) resources="$bin_dir/../Resources"; library="$resources/liblogseq_ui.dylib" ;;
  Linux) resources="$bin_dir/Resources"; library="$resources/liblogseq_ui.so" ;;
  *) printf 'This desktop archive requires macOS or Linux.\n' >&2; exit 1 ;;
esac
export LUI_OCAML_LIBRARY="$library"
export LOGSEQ_NATIVE_ASSET_DIR="$resources"
export LOGSEQ_DB_WORKER_BIN="$resources/logseq-db-worker"
exec "$bin_dir/logseq-nsh" "$@"
