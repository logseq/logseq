#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPO_ROOT="${REPO_ROOT:-$DEFAULT_REPO_ROOT}"
DB_REPO="${DB_REPO:-demo}"
ATTACH_REPL=1
EXTRA_NODE_ARGS=()

usage() {
  cat <<'EOF'
Start or reuse db-worker-node REPL workflow.

Usage:
  start-db-worker-node-repl.sh [options] [-- <extra db-worker-node args>]

Options:
  --repo <name>         Graph repo name passed to db-worker-node (default: demo)
  --repo-root <path>    Logseq repository root (default: auto-detect from script location)
  --no-repl             Do not attach `shadow-cljs cljs-repl` after startup
  --repl                Force attach REPL (default behavior)
  -h, --help            Show this help

Examples:
  ./start-db-worker-node-repl.sh
  ./start-db-worker-node-repl.sh --repo demo --no-repl
  ./start-db-worker-node-repl.sh --repo demo -- --create-empty-db
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      shift
      DB_REPO="${1:?missing value for --repo}"
      ;;
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
    --)
      shift
      EXTRA_NODE_ARGS+=("$@")
      break
      ;;
    *)
      EXTRA_NODE_ARGS+=("$1")
      ;;
  esac
  shift
done

if [[ ! -d "$REPO_ROOT" ]]; then
  echo "Error: repo root not found: $REPO_ROOT" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx not found in PATH" >&2
  exit 1
fi

if ! command -v yarn >/dev/null 2>&1; then
  echo "Error: yarn not found in PATH" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node not found in PATH" >&2
  exit 1
fi

LOG_DIR="$REPO_ROOT/tmp/db-worker-node-repl"
SHARED_LOG_DIR="$REPO_ROOT/tmp/logseq-repl"
mkdir -p "$LOG_DIR"
mkdir -p "$SHARED_LOG_DIR"

SHADOW_PID_FILE="$LOG_DIR/shadow-db-worker-node.pid"
DB_PID_FILE="$LOG_DIR/db-worker-node.pid"
DB_REPO_FILE="$LOG_DIR/db-worker-node.repo"
SHADOW_LOG="$LOG_DIR/shadow-db-worker-node.log"
DB_LOG="$LOG_DIR/db-worker-node.log"
SHARED_SHADOW_PID_FILE="$SHARED_LOG_DIR/shared-shadow-watch.pid"
SHARED_SHADOW_LOG="$SHARED_LOG_DIR/shared-shadow-watch.log"

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

wait_for_log_pattern() {
  local file="$1"
  local pattern="$2"
  local timeout_seconds="$3"

  local i
  for ((i=0; i<timeout_seconds; i++)); do
    if [[ -f "$file" ]] && grep -q "$pattern" "$file"; then
      return 0
    fi
    sleep 1
  done
  return 1
}

wait_for_shadow_build_ready() {
  local file="$1"
  local timeout_seconds="$2"

  local i
  for ((i=0; i<timeout_seconds; i++)); do
    if [[ -f "$file" ]] && grep -q "\[:db-worker-node\] Build completed\." "$file"; then
      return 0
    fi

    if [[ -f "$file" ]] && grep -q "\[:db-worker-node\] Build failure\." "$file"; then
      echo "Error: shadow-cljs reported build failure. Check $file" >&2
      return 1
    fi

    sleep 1
  done

  echo "Warning: did not observe db-worker-node build completion within timeout." >&2
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
  existing_pid="$(read_pid "$SHADOW_PID_FILE" || true)"

  if [[ -n "${existing_pid:-}" ]] && is_running_pid "$existing_pid"; then
    echo "Reusing shared shadow-cljs watch (pid=$existing_pid)"
    return 0
  fi

  shared_pid="$(read_pid "$SHARED_SHADOW_PID_FILE" || true)"
  if [[ -n "${shared_pid:-}" ]] && is_running_pid "$shared_pid"; then
    echo "$shared_pid" > "$SHADOW_PID_FILE"
    : > "$SHADOW_LOG"
    echo "Reusing shared shadow-cljs watch (pid=$shared_pid)"
    if wait_for_shadow_build_ready "$SHARED_SHADOW_LOG" 120; then
      echo "shadow-cljs db-worker-node build is ready"
    else
      echo "Error: shadow-cljs build is not ready. Check $SHARED_SHADOW_LOG" >&2
      exit 1
    fi
    return 0
  fi

  echo "Starting shared shadow-cljs watch via yarn watch ..."
  local shadow_pid
  shadow_pid="$(start_background_command "$SHARED_SHADOW_LOG" yarn watch)"

  echo "$shadow_pid" > "$SHARED_SHADOW_PID_FILE"
  echo "$shadow_pid" > "$SHADOW_PID_FILE"
  : > "$SHADOW_LOG"
  sleep 1

  if ! is_running_pid "$shadow_pid"; then
    echo "Error: yarn watch exited early. Check $SHARED_SHADOW_LOG" >&2
    exit 1
  fi

  if wait_for_log_pattern "$SHARED_SHADOW_LOG" "watching build :db-worker-node\\|\\[:db-worker-node\\] Build completed\\." 45; then
    echo "shadow-cljs watch is ready (pid=$shadow_pid)"
  else
    echo "Warning: did not observe watch-ready log within timeout. Continuing anyway." >&2
  fi

  if wait_for_shadow_build_ready "$SHARED_SHADOW_LOG" 120; then
    echo "shadow-cljs db-worker-node build is ready"
  else
    echo "Error: shadow-cljs build is not ready. Check $SHARED_SHADOW_LOG" >&2
    exit 1
  fi
}

ensure_db_worker_node() {
  local existing_pid existing_repo
  existing_pid="$(read_pid "$DB_PID_FILE" || true)"
  existing_repo="$(read_pid "$DB_REPO_FILE" || true)"

  if [[ -n "${existing_pid:-}" ]] && is_running_pid "$existing_pid"; then
    if [[ "$existing_repo" == "$DB_REPO" ]]; then
      echo "Reusing db-worker-node runtime (pid=$existing_pid, repo=$DB_REPO)"
      return 0
    fi

    echo "Stopping existing db-worker-node (pid=$existing_pid) due to repo mismatch"
    kill "$existing_pid" 2>/dev/null || true
    sleep 1
  fi

  echo "Starting db-worker-node (repo=$DB_REPO) ..."
  pushd "$REPO_ROOT" >/dev/null
  local node_cmd=(node ./static/db-worker-node.js --repo "$DB_REPO")
  if (( ${#EXTRA_NODE_ARGS[@]} > 0 )); then
    node_cmd+=("${EXTRA_NODE_ARGS[@]}")
  fi
  nohup "${node_cmd[@]}" > "$DB_LOG" 2>&1 &
  local db_pid=$!
  popd >/dev/null

  echo "$db_pid" > "$DB_PID_FILE"
  echo "$DB_REPO" > "$DB_REPO_FILE"
  sleep 1

  if ! is_running_pid "$db_pid"; then
    echo "Error: db-worker-node exited early. Check $DB_LOG" >&2
    exit 1
  fi

  echo "db-worker-node is running (pid=$db_pid, repo=$DB_REPO)"
}

verify_repl_connectivity() {
  echo "Verifying CLJS REPL connectivity ..."

  local repl_output
  pushd "$REPO_ROOT" >/dev/null
  if repl_output="$(printf '(+ 1 2)\n:cljs/quit\n' | npx shadow-cljs cljs-repl db-worker-node 2>&1)"; then
    popd >/dev/null
  else
    local repl_status=$?
    popd >/dev/null
    echo "Error: failed to run REPL connectivity check (exit=$repl_status)." >&2
    echo "--- REPL output ---" >&2
    echo "$repl_output" >&2
    echo "-------------------" >&2
    exit 1
  fi

  if [[ "$repl_output" != *"shadow-cljs - connected to server"* ]]; then
    echo "Error: REPL check did not report successful server connection." >&2
    echo "--- REPL output ---" >&2
    echo "$repl_output" >&2
    echo "-------------------" >&2
    exit 1
  fi

  if [[ "$repl_output" != *$'cljs.user=> 3'* ]]; then
    echo "Error: REPL check did not produce expected evaluation result." >&2
    echo "--- REPL output ---" >&2
    echo "$repl_output" >&2
    echo "-------------------" >&2
    exit 1
  fi

  echo "REPL connectivity check passed"
}

ensure_shadow_watch
ensure_db_worker_node
verify_repl_connectivity

echo

echo "Logs:"
echo "  shared shadow-cljs:  $SHARED_SHADOW_LOG"
echo "  db-worker-node:     $DB_LOG"
echo "  workflow state file: $SHADOW_LOG"
echo "PID files:"
echo "  $SHADOW_PID_FILE"
echo "  $DB_PID_FILE"
echo

if [[ "$ATTACH_REPL" -eq 1 ]]; then
  echo "Attaching CLJS REPL: npx shadow-cljs cljs-repl db-worker-node"
  pushd "$REPO_ROOT" >/dev/null
  npx shadow-cljs cljs-repl db-worker-node
  popd >/dev/null
else
  echo "Startup complete. REPL attach skipped (--no-repl)."
fi
