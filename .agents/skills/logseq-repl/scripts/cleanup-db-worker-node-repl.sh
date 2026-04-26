#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPO_ROOT="${REPO_ROOT:-$DEFAULT_REPO_ROOT}"
FORCE_KILL=0

usage() {
  cat <<'EOF'
Stop processes started by start-db-worker-node-repl.sh.

Usage:
  cleanup-db-worker-node-repl.sh [options]

Options:
  --repo-root <path>    Logseq repository root (default: auto-detect from script location)
  --force               Use SIGKILL if process does not stop gracefully
  -h, --help            Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      shift
      REPO_ROOT="${1:?missing value for --repo-root}"
      ;;
    --force)
      FORCE_KILL=1
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

LOG_DIR="$REPO_ROOT/tmp/db-worker-node-repl"
DESKTOP_LOG_DIR="$REPO_ROOT/tmp/desktop-app-repl"
SHARED_LOG_DIR="$REPO_ROOT/tmp/logseq-repl"
SHADOW_PID_FILE="$LOG_DIR/shadow-db-worker-node.pid"
DB_PID_FILE="$LOG_DIR/db-worker-node.pid"
DB_REPO_FILE="$LOG_DIR/db-worker-node.repo"
DESKTOP_SHADOW_PID_FILE="$DESKTOP_LOG_DIR/shadow-watch.pid"
SHARED_SHADOW_PID_FILE="$SHARED_LOG_DIR/shared-shadow-watch.pid"

is_running_pid() {
  local pid="$1"
  [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null
}

read_pid() {
  local file="$1"
  if [[ -f "$file" ]]; then
    tr -d '[:space:]' < "$file"
  fi
}

stop_by_pid_file() {
  local pid_file="$1"
  local label="$2"

  local pid
  pid="$(read_pid "$pid_file" || true)"

  if [[ -z "${pid:-}" ]]; then
    echo "$label: no pid file, nothing to stop"
    return 0
  fi

  if ! is_running_pid "$pid"; then
    echo "$label: process already stopped (pid=$pid)"
    rm -f "$pid_file"
    return 0
  fi

  echo "$label: stopping pid=$pid"
  kill "$pid" 2>/dev/null || true

  local i
  for ((i=0; i<10; i++)); do
    if ! is_running_pid "$pid"; then
      echo "$label: stopped"
      rm -f "$pid_file"
      return 0
    fi
    sleep 1
  done

  if [[ "$FORCE_KILL" -eq 1 ]]; then
    echo "$label: force killing pid=$pid"
    kill -9 "$pid" 2>/dev/null || true
    sleep 1
  fi

  if is_running_pid "$pid"; then
    echo "$label: failed to stop pid=$pid" >&2
    return 1
  fi

  echo "$label: stopped"
  rm -f "$pid_file"
}

stop_shadow_watch() {
  local own_pid shared_pid other_pid
  own_pid="$(read_pid "$SHADOW_PID_FILE" || true)"
  shared_pid="$(read_pid "$SHARED_SHADOW_PID_FILE" || true)"
  other_pid="$(read_pid "$DESKTOP_SHADOW_PID_FILE" || true)"

  if [[ -n "${own_pid:-}" && -n "${other_pid:-}" && "$own_pid" == "$other_pid" ]] && is_running_pid "$other_pid"; then
    echo "shadow-cljs watch: shared with other workflows, leaving it running"
    rm -f "$SHADOW_PID_FILE"
    return 0
  fi

  if [[ -n "${shared_pid:-}" && -n "${other_pid:-}" && "$shared_pid" == "$other_pid" ]] && is_running_pid "$other_pid"; then
    echo "shadow-cljs watch: shared with other workflows, leaving it running"
    rm -f "$SHADOW_PID_FILE"
    return 0
  fi

  if [[ -f "$SHARED_SHADOW_PID_FILE" ]]; then
    stop_by_pid_file "$SHARED_SHADOW_PID_FILE" "shadow-cljs watch"
    rm -f "$SHADOW_PID_FILE"
  else
    stop_by_pid_file "$SHADOW_PID_FILE" "shadow-cljs watch"
  fi
}

if [[ ! -d "$LOG_DIR" && ! -d "$SHARED_LOG_DIR" ]]; then
  echo "State directory not found: $LOG_DIR"
  echo "Nothing to clean up."
  exit 0
fi

stop_by_pid_file "$DB_PID_FILE" "db-worker-node"
rm -f "$DB_REPO_FILE"
stop_shadow_watch

echo "Cleanup done."
