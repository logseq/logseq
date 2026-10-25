#!/usr/bin/env bash
set -euo pipefail
host=$(bash "$(dirname "${BASH_SOURCE[0]}")/build.sh")
case "$(uname -s)" in
  Darwin) library="$(dirname "$host")/liblogseq_ui.dylib" ;;
  Linux) library="$(dirname "$host")/liblogseq_ui.so" ;;
esac
exec "$host" -library "$library" "$@"
