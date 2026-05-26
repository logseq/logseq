#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
install_dir="${LOGSEQ_CLI_BIN_DIR:-$HOME/.local/bin}"
pack_dir="$repo_root/tmp/logseq-cli"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

copy_file() {
  local source_path="$1"
  local target_path="$2"

  if [[ ! -f "$source_path" ]]; then
    echo "Missing build artifact: $source_path" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$target_path")"
  cp "$source_path" "$target_path"
}

require_command clojure
require_command pnpm
require_command node

cd "$repo_root"

clojure -M:cljs release logseq-cli
pnpm db-worker-node:release:bundle
pnpm --dir deps/db-sync build:node-adapter

copy_file "$repo_root/dist/db-worker-node.js" "$repo_root/static/js/db-worker-node.js"
copy_file "$repo_root/dist/db-worker-node-assets.json" "$repo_root/static/js/db-worker-node-assets.json"

mkdir -p "$pack_dir"
rm -f "$pack_dir"/logseq-*.tgz

tarball="$(pnpm pack --pack-destination "$pack_dir" | tail -n 1)"
if [[ "$tarball" != /* ]]; then
  tarball="$pack_dir/$tarball"
fi

mkdir -p "$install_dir"
export PATH="$install_dir:$PATH"
pnpm add --global --global-bin-dir "$install_dir" "$tarball"

echo "Installed logseq to $install_dir/logseq"
echo "Packed tarball kept at $tarball"
