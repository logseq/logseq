#!/usr/bin/env bash
set -euo pipefail
nsh_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
host=$(bash "$nsh_root/build.sh")
repo_root=$(cd "$nsh_root/../../.." && pwd)
lui_source=$(cd "${LUI_SOURCE_ROOT:-$repo_root/../lui}" && pwd -P)
"${NODE_BINARY:-node}" "$lui_source/tooling/lui_build_receipt.mjs" check --artifact "$host"
resources="$(dirname "$host")/../Resources"
case "$(uname -s)" in
  Darwin) library="$(dirname "$host")/liblogseq_ui.dylib" ;;
  Linux) library="$(dirname "$host")/liblogseq_ui.so" ;;
  *) printf 'The native build/run script currently supports macOS and Linux.\n' >&2; exit 1 ;;
esac
export LUI_OCAML_LIBRARY="$library"
export LOGSEQ_NATIVE_ASSET_DIR="${LOGSEQ_NATIVE_ASSET_DIR:-$resources}"
export LOGSEQ_DB_WORKER_BIN="${LOGSEQ_DB_WORKER_BIN:-$resources/logseq-db-worker}"
exec "$host" "$@"
