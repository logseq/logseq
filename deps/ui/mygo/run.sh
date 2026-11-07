#!/usr/bin/env bash
set -euo pipefail
host=$(bash "$(dirname "${BASH_SOURCE[0]}")/build.sh")
case "$(uname -s)" in
  Darwin) library="$(dirname "$host")/liblogseq_ui.dylib" ;;
  Linux) library="$(dirname "$host")/liblogseq_ui.so" ;;
esac
export LOGSEQ_DB_WORKER_BIN="${LOGSEQ_DB_WORKER_BIN:-$(dirname "$host")/../Resources/logseq-db-worker}"
exec "$host" -library "$library" "$@"
