#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPO_ROOT="${REPO_ROOT:-$DEFAULT_REPO_ROOT}"

usage() {
  cat <<'EOF'
Verify that all Logseq CLJS REPL targets are usable.

Usage:
  verify-repls.sh [options]

Options:
  --repo-root <path>    Logseq repository root (default: auto-detect from script location)
  -h, --help            Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      shift
      REPO_ROOT="${1:?missing value for --repo-root}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

if [[ ! -d "$REPO_ROOT" ]]; then
  echo "Error: repo root not found: $REPO_ROOT" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm not found in PATH" >&2
  exit 1
fi

verify_target() {
  local target="$1"
  local form="$2"

  echo "Checking :$target ..."

  local repl_output
  pushd "$REPO_ROOT" >/dev/null
  if ! repl_output="$(printf '%s\n' "$form" | pnpm exec shadow-cljs cljs-repl "$target" 2>&1)"; then
    popd >/dev/null
    echo "Error: REPL verification failed for :$target." >&2
    echo "--- :$target output ---" >&2
    echo "$repl_output" >&2
    echo "-----------------------" >&2
    return 1
  fi
  popd >/dev/null

  if [[ "$repl_output" != *"shadow-cljs - connected to server"* ]]; then
    echo "Error: REPL verification did not connect for :$target." >&2
    echo "--- :$target output ---" >&2
    echo "$repl_output" >&2
    echo "-----------------------" >&2
    return 1
  fi

  echo "--- :$target result ---"
  echo "$repl_output"
  echo "-----------------------"
  echo "REPL verification passed for :$target"
}

echo "Verifying CLJS REPL targets ..."
verify_target app "(prn {:runtime :app :document? (some? js/document)})"
verify_target electron "(prn {:runtime :electron :process? (some? js/process) :type (some-> js/process .-type)})"
verify_target db-worker-node "(prn {:runtime :db-worker-node :process? (some? js/process) :platform (some-> js/process .-platform)})"
echo "All CLJS REPL targets verified."
