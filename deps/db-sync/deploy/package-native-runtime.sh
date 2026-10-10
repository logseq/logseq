#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly script_dir
db_sync_dir="$(cd -- "$script_dir/.." && pwd)"
readonly db_sync_dir

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

runtime_version="${1:-}"
runtime_arch="${2:-}"
output_dir="${3:-}"
node_binary="${NODE_BINARY:-$(command -v node 2>/dev/null || true)}"
default_release_repository="${DEFAULT_RELEASE_REPOSITORY:-}"

[[ -n "$runtime_version" ]] || die "Usage: $0 <version> <x64|arm64> <output-directory>"
[[ "$runtime_version" =~ ^[A-Za-z0-9._+-]+$ ]] \
  || die "Runtime version contains unsupported characters: $runtime_version"
[[ "$runtime_arch" == "x64" || "$runtime_arch" == "arm64" ]] \
  || die "Runtime architecture must be x64 or arm64."
[[ -n "$output_dir" ]] || die "Output directory is required."
[[ -x "$node_binary" ]] || die "NODE_BINARY must point to an executable Node.js binary."
if [[ -n "$default_release_repository" ]]; then
  [[ "$default_release_repository" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] \
    || die "DEFAULT_RELEASE_REPOSITORY must be an owner/repository pair."
fi
[[ -f "$db_sync_dir/worker/dist/node-adapter.js" ]] \
  || die "Build worker/dist/node-adapter.js before packaging."
[[ -d "$db_sync_dir/node_modules" ]] || die "Install production dependencies before packaging."

case "$(uname -m)" in
  x86_64) host_arch="x64" ;;
  aarch64|arm64) host_arch="arm64" ;;
  *) die "Unsupported build host architecture: $(uname -m)" ;;
esac
[[ "$host_arch" == "$runtime_arch" ]] \
  || die "Native runtime must be packaged on its target architecture ($runtime_arch)."

stage_dir="$(mktemp -d "${TMPDIR:-/tmp}/logseq-sync-runtime-package.XXXXXX")"
cleanup() {
  [[ -d "$stage_dir" ]] && rm -rf -- "$stage_dir"
}
trap cleanup EXIT

runtime_dir="$stage_dir/logseq-sync-runtime"
mkdir -p "$runtime_dir/node/bin" "$runtime_dir/app" "$runtime_dir/bin" "$output_dir"
install -m 0755 "$node_binary" "$runtime_dir/node/bin/node"
install -m 0644 "$db_sync_dir/worker/dist/node-adapter.js" \
  "$runtime_dir/app/node-adapter.js"
cp -a "$db_sync_dir/node_modules" "$runtime_dir/app/node_modules"
if [[ -n "$default_release_repository" ]]; then
  sed "s|readonly default_release_repository=\"logseq/logseq\"|readonly default_release_repository=\"${default_release_repository}\"|" \
    "$script_dir/logseq-sync-native" > "$runtime_dir/bin/logseq-sync-native"
  chmod 0755 "$runtime_dir/bin/logseq-sync-native"
else
  install -m 0755 "$script_dir/logseq-sync-native" "$runtime_dir/bin/logseq-sync-native"
fi
printf '%s\n' "$runtime_version" > "$runtime_dir/VERSION"
printf '%s\n' "$runtime_arch" > "$runtime_dir/ARCHITECTURE"

archive="logseq-sync-runtime-linux-${runtime_arch}.tar.gz"
tar --sort=name --mtime='UTC 1970-01-01' --owner=0 --group=0 --numeric-owner \
  -czf "$output_dir/$archive" -C "$stage_dir" logseq-sync-runtime
(
  cd "$output_dir"
  sha256sum "$archive" > "$archive.sha256"
)
printf 'Created %s\n' "$output_dir/$archive"
