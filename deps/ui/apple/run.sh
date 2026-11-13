#!/usr/bin/env bash
set -euo pipefail
host_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ui_root=$(cd "$host_root/.." && pwd)
binary="$ui_root/_build/apple/logseq-apple"
[[ -x $binary ]] || { printf 'Run bash deps/ui/apple/build.sh first.\n' >&2; exit 1; }
export LOGSEQ_NATIVE_ASSET_DIR="${LOGSEQ_NATIVE_ASSET_DIR-$ui_root/_build/Resources}"
export LOGSEQ_DB_WORKER_BIN="${LOGSEQ_DB_WORKER_BIN-$ui_root/_build/Resources/logseq-db-worker}"
export LOGSEQ_APPLE_LIBRARY="${LOGSEQ_APPLE_LIBRARY-$ui_root/_build/apple/liblogseq_ui.dylib}"
exec "$binary" "$@"
