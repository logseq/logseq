#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPO_ROOT="${REPO_ROOT:-$DEFAULT_REPO_ROOT}"
ATTACH_REPL=1

# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'EOF'
Start or reuse the Desktop app `:app` REPL workflow.

Usage:
  start-desktop-app-repl.sh [options]

Options:
  --repo-root <path>    Logseq repository root (default: auto-detect from script location)
  --no-repl             Do not attach `shadow-cljs cljs-repl app` after startup
  --repl                Force attach REPL (default behavior)
  -h, --help            Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      shift
      REPO_ROOT="${1:?missing value for --repo-root}"
      ;;
    --no-repl)
      ATTACH_REPL=0
      ;;
    --repl)
      ATTACH_REPL=1
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

if ! command -v yarn >/dev/null 2>&1; then
  echo "Error: yarn not found in PATH" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx not found in PATH" >&2
  exit 1
fi

LOG_DIR="$REPO_ROOT/tmp/desktop-app-repl"
SHARED_LOG_DIR="$REPO_ROOT/tmp/logseq-repl"
mkdir -p "$LOG_DIR"
mkdir -p "$SHARED_LOG_DIR"

if ! logseq_repl_require_clean_standard_ports; then
  exit 1
fi

SHADOW_PID_FILE="$LOG_DIR/shadow-watch.pid"
DESKTOP_PID_FILE="$LOG_DIR/desktop-electron.pid"
SHADOW_LOG="$LOG_DIR/shadow-watch.log"
DESKTOP_LOG="$LOG_DIR/desktop-electron.log"
SHARED_SHADOW_PID_FILE="$SHARED_LOG_DIR/shared-shadow-watch.pid"
SHARED_SHADOW_LOG="$SHARED_LOG_DIR/shared-shadow-watch.log"

wait_for_all_patterns() {
  local file="$1"
  local timeout_seconds="$2"
  shift 2

  local second pattern all_found
  for ((second=0; second<timeout_seconds; second++)); do
    all_found=1
    for pattern in "$@"; do
      if [[ ! -f "$file" ]] || ! grep -Fq "$pattern" "$file"; then
        all_found=0
        break
      fi
    done

    if [[ "$all_found" -eq 1 ]]; then
      return 0
    fi

    sleep 1
  done

  return 1
}

wait_for_any_pattern() {
  local file="$1"
  local timeout_seconds="$2"
  shift 2

  local second pattern
  for ((second=0; second<timeout_seconds; second++)); do
    if [[ -f "$file" ]]; then
      for pattern in "$@"; do
        if grep -Fq "$pattern" "$file"; then
          return 0
        fi
      done
    fi
    sleep 1
  done

  return 1
}

start_background_command() {
  local log_file="$1"
  shift

  pushd "$REPO_ROOT" >/dev/null
  if command -v setsid >/dev/null 2>&1; then
    nohup setsid "$@" > "$log_file" 2>&1 &
  else
    nohup "$@" > "$log_file" 2>&1 &
  fi
  local pid=$!
  popd >/dev/null

  echo "$pid"
}

ensure_shadow_watch() {
  local existing_pid shared_pid
  existing_pid="$(logseq_repl_read_pid "$SHADOW_PID_FILE" || true)"

  if [[ -n "${existing_pid:-}" ]] && logseq_repl_is_running_pid "$existing_pid"; then
    echo "Reusing shared shadow-cljs watch (pid=$existing_pid)"
    return 0
  fi

  shared_pid="$(logseq_repl_read_pid "$SHARED_SHADOW_PID_FILE" || true)"
  if [[ -n "${shared_pid:-}" ]] && logseq_repl_is_running_pid "$shared_pid"; then
    echo "$shared_pid" > "$SHADOW_PID_FILE"
    : > "$SHADOW_LOG"
    echo "Reusing shared shadow-cljs watch (pid=$shared_pid)"
    return 0
  fi

  echo "Starting shadow-cljs watch via yarn watch ..."
  local shadow_pid
  shadow_pid="$(start_background_command "$SHARED_SHADOW_LOG" yarn watch)"
  echo "$shadow_pid" > "$SHARED_SHADOW_PID_FILE"
  echo "$shadow_pid" > "$SHADOW_PID_FILE"
  : > "$SHADOW_LOG"
  sleep 1

  if ! logseq_repl_is_running_pid "$shadow_pid"; then
    echo "Error: yarn watch exited early. Check $SHARED_SHADOW_LOG" >&2
    exit 1
  fi

  if wait_for_all_patterns "$SHARED_SHADOW_LOG" 180 \
    "[:electron] Build completed." \
    "[:app] Build completed."; then
    echo "shadow-cljs watch builds are ready (pid=$shadow_pid)"
  else
    echo "Error: yarn watch did not finish the :app/:electron builds in time. Check $SHARED_SHADOW_LOG" >&2
    exit 1
  fi
}

ensure_desktop_app() {
  local existing_pid
  existing_pid="$(read_pid "$DESKTOP_PID_FILE" || true)"

  if [[ -n "${existing_pid:-}" ]] && is_running_pid "$existing_pid"; then
    echo "Reusing Desktop dev app (pid=$existing_pid)"
    return 0
  fi

  echo "Starting Desktop dev app via yarn dev-electron-app ..."
  local desktop_pid
  desktop_pid="$(start_background_command "$DESKTOP_LOG" yarn dev-electron-app)"
  echo "$desktop_pid" > "$DESKTOP_PID_FILE"
  sleep 1

  if ! is_running_pid "$desktop_pid"; then
    echo "Error: yarn dev-electron-app exited early. Check $DESKTOP_LOG" >&2
    exit 1
  fi

  if wait_for_any_pattern "$DESKTOP_LOG" 120 "shadow-cljs - #" "Logseq App("; then
    echo "Desktop dev app is running (pid=$desktop_pid)"
  else
    echo "Error: Desktop dev app did not report startup in time. Check $DESKTOP_LOG" >&2
    exit 1
  fi
}

ensure_single_app_runtime() {
  local runtime_count second

  for ((second=0; second<60; second++)); do
    runtime_count="$(logseq_repl_runtime_count "$REPO_ROOT" app)"

    if [[ "$runtime_count" == "1" ]]; then
      echo "Detected exactly one live :app runtime"
      return 0
    fi

    if [[ "$runtime_count" != "0" ]]; then
      break
    fi

    sleep 1
  done

  if [[ "$runtime_count" == "0" ]]; then
    echo "Error: Expected exactly one live :app runtime, found 0 after waiting for the Desktop renderer to connect." >&2
    echo "Check $DESKTOP_LOG and $SHARED_SHADOW_LOG, make sure the Desktop window is fully open, then retry." >&2
    exit 1
  fi

  echo "Error: Expected exactly one live :app runtime, found $runtime_count." >&2
  echo "Close the browser dev app so only the Desktop renderer remains, then retry." >&2
  exit 1
}

verify_renderer_smoke_test() {
  echo "Verifying Desktop renderer smoke test ..."

  local smoke_output
  pushd "$REPO_ROOT" >/dev/null
  if ! smoke_output="$(printf '(some? js/document)\n(.-title js/document)\n:cljs/quit\n' | npx shadow-cljs cljs-repl app 2>&1)"; then
    popd >/dev/null
    echo "Error: smoke test REPL command failed." >&2
    echo "--- smoke output ---" >&2
    echo "$smoke_output" >&2
    echo "--------------------" >&2
    exit 1
  fi
  popd >/dev/null

  if [[ "$smoke_output" != *"shadow-cljs - connected to server"* ]]; then
    echo "Error: smoke test did not connect to shadow-cljs." >&2
    echo "--- smoke output ---" >&2
    echo "$smoke_output" >&2
    echo "--------------------" >&2
    exit 1
  fi

  if [[ "$smoke_output" != *$'cljs.user=> true'* ]]; then
    echo "Error: smoke test did not confirm js/document." >&2
    echo "--- smoke output ---" >&2
    echo "$smoke_output" >&2
    echo "--------------------" >&2
    exit 1
  fi

  echo "Desktop renderer smoke test passed"
}

ensure_shadow_watch
ensure_desktop_app
ensure_single_app_runtime
verify_renderer_smoke_test

echo

echo "Logs:"
echo "  shared shadow-cljs:  $SHARED_SHADOW_LOG"
echo "  desktop-app:         $DESKTOP_LOG"
echo "  workflow state file: $SHADOW_LOG"
echo "PID files:"
echo "  $SHADOW_PID_FILE"
echo "  $DESKTOP_PID_FILE"
echo

if [[ "$ATTACH_REPL" -eq 1 ]]; then
  echo "Attaching CLJS REPL: npx shadow-cljs cljs-repl app"
  pushd "$REPO_ROOT" >/dev/null
  npx shadow-cljs cljs-repl app
  popd >/dev/null
else
  echo "Startup complete. REPL attach skipped (--no-repl)."
fi
