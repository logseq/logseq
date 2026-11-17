#!/usr/bin/env bash
set -euo pipefail
host_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
output="$host_root/../_build/native-experimental"
case $(uname -s) in
  Darwin) binary="$output/LogseqNative.app/Contents/MacOS/LogseqNative" ;;
  Linux) binary="$output/logseq-native/bin/LogseqNative" ;;
  *) printf 'The experimental native host supports macOS and Linux.\n' >&2; exit 1 ;;
esac
if [[ ! -f $binary ]]; then
  python3 "$host_root/build.py"
fi
export LOGSEQ_NO_LOGIN_DAEMON=1
export MallocSpaceEfficient=1
exec "$binary" "$@"
