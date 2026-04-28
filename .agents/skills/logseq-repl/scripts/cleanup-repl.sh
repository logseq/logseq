#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPO_ROOT="${REPO_ROOT:-$DEFAULT_REPO_ROOT}"
FORCE_KILL=0

usage() {
  cat <<'EOF'
Stop all processes started by start-repl.sh.

Usage:
  cleanup-repl.sh [options]

Options:
  --repo-root <path>    Logseq repository root (default: auto-detect from script location)
  --force               Use SIGKILL if a process does not stop gracefully
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

LOG_DIR="$REPO_ROOT/tmp/logseq-repl"
LEGACY_DESKTOP_LOG_DIR="$REPO_ROOT/tmp/desktop-app-repl"
LEGACY_DB_LOG_DIR="$REPO_ROOT/tmp/db-worker-node-repl"

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

process_group_id() {
  local pid="$1"
  ps -o pgid= -p "$pid" 2>/dev/null | tr -d '[:space:]'
}

current_process_group_id() {
  process_group_id "$$"
}

signal_process_group() {
  local signal="$1"
  local pid="$2"

  local current_pgid pgid
  pgid="$(process_group_id "$pid" || true)"
  current_pgid="$(current_process_group_id || true)"

  if [[ -n "${pgid:-}" && "$pgid" =~ ^[0-9]+$ && "$pgid" != "${current_pgid:-}" ]]; then
    kill "-$signal" "-$pgid" 2>/dev/null || true
  fi

  kill "-$signal" "$pid" 2>/dev/null || true
}

stop_by_pid_file() {
  local pid_file="$1"
  local label="$2"

  local pid
  pid="$(read_pid "$pid_file" || true)"

  if [[ -z "${pid:-}" ]]; then
    rm -f "$pid_file"
    return 0
  fi

  if ! is_running_pid "$pid"; then
    echo "$label: process already stopped (pid=$pid)"
    rm -f "$pid_file"
    return 0
  fi

  echo "$label: stopping pid=$pid"
  signal_process_group TERM "$pid"

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
    signal_process_group KILL "$pid"
    sleep 1
  fi

  if is_running_pid "$pid"; then
    echo "$label: failed to stop pid=$pid" >&2
    return 1
  fi

  echo "$label: stopped"
  rm -f "$pid_file"
}

repo_owns_pid() {
  local pid="$1"
  local cwd
  cwd="$(lsof -nP -a -p "$pid" -d cwd 2>/dev/null | awk 'NR > 1 {print $NF; exit}' || true)"
  [[ "$cwd" == "$REPO_ROOT" ]]
}

stop_repo_port_listener() {
  local port="$1"
  local pid

  while read -r pid; do
    [[ -n "${pid:-}" ]] || continue
    if is_running_pid "$pid" && repo_owns_pid "$pid"; then
      echo "port $port listener: stopping pid=$pid"
      signal_process_group TERM "$pid"
    fi
  done < <(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
}

if [[ ! -d "$LOG_DIR" && ! -d "$LEGACY_DESKTOP_LOG_DIR" && ! -d "$LEGACY_DB_LOG_DIR" ]]; then
  echo "State directory not found: $LOG_DIR"
  echo "Nothing to clean up."
  exit 0
fi

stop_by_pid_file "$LOG_DIR/db-worker-node.pid" "db-worker-node"
stop_by_pid_file "$LOG_DIR/desktop-electron.pid" "desktop-electron"
stop_by_pid_file "$LOG_DIR/shared-shadow-watch.pid" "shadow-cljs watch"

stop_by_pid_file "$LEGACY_DB_LOG_DIR/db-worker-node.pid" "legacy db-worker-node"
stop_by_pid_file "$LEGACY_DB_LOG_DIR/shadow-db-worker-node.pid" "legacy shadow-cljs watch"
stop_by_pid_file "$LEGACY_DESKTOP_LOG_DIR/desktop-electron.pid" "legacy desktop-electron"
stop_by_pid_file "$LEGACY_DESKTOP_LOG_DIR/shadow-watch.pid" "legacy shadow-cljs watch"

rm -f "$LOG_DIR/db-worker-node.repo" "$LEGACY_DB_LOG_DIR/db-worker-node.repo"

for port in 8701 3001 3002 9630 9631; do
  stop_repo_port_listener "$port"
done

rm -f "$LOG_DIR"/*.pid "$LEGACY_DB_LOG_DIR"/*.pid "$LEGACY_DESKTOP_LOG_DIR"/*.pid 2>/dev/null || true

echo "Cleanup done."
