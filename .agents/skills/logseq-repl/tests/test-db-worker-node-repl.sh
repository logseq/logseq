#!/usr/bin/env bash
set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$TEST_DIR/.." && pwd)"
SKILLS_ROOT="$(cd "$SKILL_DIR/.." && pwd)"
START_SCRIPT="$SKILL_DIR/scripts/start-db-worker-node-repl.sh"
CLEANUP_SCRIPT="$SKILL_DIR/scripts/cleanup-db-worker-node-repl.sh"
DESKTOP_START_SCRIPT="$SKILL_DIR/scripts/start-desktop-app-repl.sh"
DESKTOP_CLEANUP_SCRIPT="$SKILL_DIR/scripts/cleanup-desktop-app-repl.sh"
SKILL_FILE="$SKILL_DIR/SKILL.md"
CURRENT_SKILL_NAME="$(basename "$SKILL_DIR")"
ORIGINAL_PATH="$PATH"

# shellcheck source=./test-lib.sh
source "$TEST_DIR/test-lib.sh"

PASS_COUNT=0
FAIL_COUNT=0

create_fake_env() {
  TEST_ROOT="$(mktemp -d)"
  REPO_ROOT="$TEST_ROOT/repo"
  BIN_DIR="$TEST_ROOT/bin"
  CMD_LOG="$TEST_ROOT/commands.log"

  mkdir -p "$REPO_ROOT/static" "$BIN_DIR"
  : > "$CMD_LOG"

  cat > "$BIN_DIR/yarn" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "yarn $*" >> "$FAKE_CMD_LOG"

case "${1:-}" in
  watch)
    echo "shadow-cljs - nREPL server started on port 8701"
    echo "[:electron] Build completed."
    echo "[:app] Build completed."
    echo "[:db-worker-node] Build completed."
    while true; do sleep 1; done
    ;;
  dev-electron-app)
    echo "17:12:00.841 › Logseq App(2.0.1) Starting..."
    echo "shadow-cljs - #6 ready!"
    while true; do sleep 1; done
    ;;
  *)
    echo "Unexpected yarn command: $*" >&2
    exit 1
    ;;
 esac
EOF

  cat > "$BIN_DIR/npx" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

input=""
if [[ "${1:-}" == "shadow-cljs" && "${2:-}" == "cljs-repl" ]] && [[ -p /dev/stdin ]]; then
  input="$(cat)"
fi

if [[ "${1:-}" == "shadow-cljs" && "${2:-}" == "clj-eval" ]]; then
  echo "npx-clj-eval $*" >> "$FAKE_CMD_LOG"
  echo "shadow-cljs - connected to server"
  echo "${FAKE_APP_RUNTIME_COUNT:-1}"
  exit 0
fi

if [[ "${1:-}" == "shadow-cljs" && "${2:-}" == "cljs-repl" && "${3:-}" == "app" ]]; then
  if [[ "$input" == *"(.-title js/document)"* ]]; then
    echo "npx-app-smoke $*" >> "$FAKE_CMD_LOG"
    echo "shadow-cljs - connected to server"
    echo "cljs.user=> true"
    echo 'cljs.user=> "Logseq"'
    echo "cljs.user=>"
    exit 0
  fi

  echo "npx-app-attach $*" >> "$FAKE_CMD_LOG"
  echo "shadow-cljs - connected to server"
  echo "cljs.user=>"
  exit 0
fi

if [[ "${1:-}" == "shadow-cljs" && "${2:-}" == "cljs-repl" && "${3:-}" == "db-worker-node" ]]; then
  if [[ "$input" == *"(+ 1 2)"* ]]; then
    echo "npx-db-smoke $*" >> "$FAKE_CMD_LOG"
    echo "shadow-cljs - connected to server"
    echo "cljs.user=> 3"
    echo "cljs.user=>"
    exit 0
  fi

  echo "npx-db-attach $*" >> "$FAKE_CMD_LOG"
  echo "shadow-cljs - connected to server"
  echo "cljs.user=>"
  exit 0
fi

echo "Unexpected npx command: $*" >&2
exit 1
EOF

  cat > "$BIN_DIR/node" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "node $*" >> "$FAKE_CMD_LOG"
while true; do sleep 1; done
EOF

  cat > "$BIN_DIR/setsid" <<'EOF'
#!/usr/bin/env bash
exec "$@"
EOF

  chmod +x "$BIN_DIR/yarn" "$BIN_DIR/npx" "$BIN_DIR/node" "$BIN_DIR/setsid"

  export PATH="$BIN_DIR:$ORIGINAL_PATH"
  export FAKE_CMD_LOG="$CMD_LOG"
  export FAKE_APP_RUNTIME_COUNT="${FAKE_APP_RUNTIME_COUNT:-1}"
}

cleanup_fake_env() {
  if [[ -n "${REPO_ROOT:-}" ]]; then
    local pid_file
    for pid_file in \
      "$REPO_ROOT"/tmp/db-worker-node-repl/*.pid \
      "$REPO_ROOT"/tmp/desktop-app-repl/*.pid \
      "$REPO_ROOT"/tmp/logseq-repl/*.pid; do
      [[ -e "$pid_file" ]] || continue
      local pid
      pid="$(tr -d '[:space:]' < "$pid_file")"
      if [[ "$pid" =~ ^[0-9]+$ ]]; then
        kill -9 "$pid" 2>/dev/null || true
      fi
    done
  fi

  PATH="$ORIGINAL_PATH"
  unset FAKE_CMD_LOG FAKE_APP_RUNTIME_COUNT || true

  if [[ -n "${TEST_ROOT:-}" && -d "$TEST_ROOT" ]]; then
    rm -rf "$TEST_ROOT"
  fi
}

scripts_exist_and_skill_is_renamed_test() {
  assert_equals "logseq-repl" "$CURRENT_SKILL_NAME"
  assert_file_exists "$START_SCRIPT"
  assert_file_exists "$CLEANUP_SCRIPT"
  assert_file_exists "$DESKTOP_START_SCRIPT"
  assert_file_exists "$DESKTOP_CLEANUP_SCRIPT"
}

start_no_repl_launches_shared_shadow_and_runtime_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo --no-repl > "$TEST_ROOT/output.log" 2>&1

  assert_contains "Startup complete. REPL attach skipped (--no-repl)." "$TEST_ROOT/output.log"
  assert_contains "shared shadow-cljs:  $REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.log" "$TEST_ROOT/output.log"
  assert_contains "db-worker-node:     $REPO_ROOT/tmp/db-worker-node-repl/db-worker-node.log" "$TEST_ROOT/output.log"
  assert_contains "yarn watch" "$CMD_LOG"
  assert_contains "node ./static/db-worker-node.js --repo demo" "$CMD_LOG"
  assert_contains "npx-db-smoke shadow-cljs cljs-repl db-worker-node" "$CMD_LOG"

  assert_file_exists "$REPO_ROOT/tmp/db-worker-node-repl/shadow-db-worker-node.pid"
  assert_file_exists "$REPO_ROOT/tmp/db-worker-node-repl/db-worker-node.pid"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.log"
}

start_reuses_existing_db_worker_runtime_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo --no-repl > "$TEST_ROOT/first.log" 2>&1
  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo --no-repl > "$TEST_ROOT/second.log" 2>&1

  local watch_count node_count
  watch_count="$(grep -c '^yarn watch$' "$CMD_LOG")"
  node_count="$(grep -c '^node ./static/db-worker-node.js --repo demo$' "$CMD_LOG")"

  assert_equals "1" "$watch_count"
  assert_equals "1" "$node_count"
  assert_contains "Reusing shared shadow-cljs watch" "$TEST_ROOT/second.log"
  assert_contains "Reusing db-worker-node runtime" "$TEST_ROOT/second.log"
}

desktop_and_db_worker_share_single_shadow_watch_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$DESKTOP_START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/desktop.log" 2>&1
  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo --no-repl > "$TEST_ROOT/db.log" 2>&1

  local watch_count desktop_shadow_pid db_shadow_pid
  watch_count="$(grep -c '^yarn watch$' "$CMD_LOG")"
  desktop_shadow_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/desktop-app-repl/shadow-watch.pid")"
  db_shadow_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/db-worker-node-repl/shadow-db-worker-node.pid")"

  assert_equals "1" "$watch_count"
  assert_equals "$desktop_shadow_pid" "$db_shadow_pid"
  assert_contains "Reusing shared shadow-cljs watch" "$TEST_ROOT/db.log"
}

cleanup_db_worker_keeps_shared_watch_for_desktop_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$DESKTOP_START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/desktop.log" 2>&1
  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo --no-repl > "$TEST_ROOT/db.log" 2>&1

  local watch_pid runtime_pid
  watch_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid")"
  runtime_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/db-worker-node-repl/db-worker-node.pid")"

  bash "$CLEANUP_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/cleanup-db.log" 2>&1

  if ! kill -0 "$watch_pid" 2>/dev/null; then
    fail "expected shared watch to keep running while desktop workflow is active"
  fi

  if kill -0 "$runtime_pid" 2>/dev/null; then
    fail "expected db-worker-node runtime to stop during cleanup"
  fi

  assert_contains "shadow-cljs watch: shared with other workflows, leaving it running" "$TEST_ROOT/cleanup-db.log"
  assert_file_exists "$REPO_ROOT/tmp/desktop-app-repl/shadow-watch.pid"
  assert_not_exists "$REPO_ROOT/tmp/db-worker-node-repl/shadow-db-worker-node.pid"
}

cleanup_desktop_keeps_shared_watch_for_db_worker_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$DESKTOP_START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/desktop.log" 2>&1
  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo --no-repl > "$TEST_ROOT/db.log" 2>&1

  local watch_pid electron_pid
  watch_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid")"
  electron_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/desktop-app-repl/desktop-electron.pid")"

  bash "$DESKTOP_CLEANUP_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/cleanup-desktop.log" 2>&1

  if ! kill -0 "$watch_pid" 2>/dev/null; then
    fail "expected shared watch to keep running while db-worker workflow is active"
  fi

  if kill -0 "$electron_pid" 2>/dev/null; then
    fail "expected desktop electron process to stop during cleanup"
  fi

  assert_contains "shadow-cljs watch: shared with other workflows, leaving it running" "$TEST_ROOT/cleanup-desktop.log"
  assert_file_exists "$REPO_ROOT/tmp/db-worker-node-repl/shadow-db-worker-node.pid"
  assert_not_exists "$REPO_ROOT/tmp/desktop-app-repl/shadow-watch.pid"
}

shared_watch_stops_after_last_cleanup_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$DESKTOP_START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/desktop.log" 2>&1
  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo --no-repl > "$TEST_ROOT/db.log" 2>&1

  local watch_pid
  watch_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid")"

  bash "$CLEANUP_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/cleanup-db.log" 2>&1
  bash "$DESKTOP_CLEANUP_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/cleanup-desktop.log" 2>&1

  if kill -0 "$watch_pid" 2>/dev/null; then
    fail "expected shared watch to stop after the last workflow cleaned up"
  fi

  assert_not_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid"
}

start_attaches_repl_by_default_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo < /dev/null > "$TEST_ROOT/output.log" 2>&1

  assert_contains "Attaching CLJS REPL: npx shadow-cljs cljs-repl db-worker-node" "$TEST_ROOT/output.log"
  assert_contains "npx-db-attach shadow-cljs cljs-repl db-worker-node" "$CMD_LOG"
}

help_and_docs_are_portable_test() {
  local temp_dir start_help_file cleanup_help_file path_pattern
  temp_dir="$(mktemp -d)"
  start_help_file="$temp_dir/start-help.txt"
  cleanup_help_file="$temp_dir/cleanup-help.txt"
  path_pattern="$(portable_path_pattern)"

  bash "$START_SCRIPT" --help > "$start_help_file"
  bash "$CLEANUP_SCRIPT" --help > "$cleanup_help_file"

  assert_not_matches "$path_pattern" "$start_help_file"
  assert_not_matches "$path_pattern" "$cleanup_help_file"
  assert_not_matches "$path_pattern" "$SKILL_FILE"
  assert_contains "name: logseq-repl" "$SKILL_FILE"
  assert_contains 'Desktop app `:app` REPL' "$SKILL_FILE"
  assert_contains "db-worker-node REPL" "$SKILL_FILE"
  assert_contains "multiple different REPL types at the same time" "$SKILL_FILE"
  assert_contains "tmp/logseq-repl" "$SKILL_FILE"
  assert_contains 'Run both `:app` and `:db-worker-node` together' "$SKILL_FILE"
  assert_contains "shared-shadow-watch.log" "$SKILL_FILE"
  assert_contains "shadow.user/worker-node-repl" "$SKILL_FILE"
  assert_contains "Non-interactive verification examples" "$SKILL_FILE"
  assert_contains "Cleanup both workflows" "$SKILL_FILE"

  rm -rf "$temp_dir"
}

obsolete_skill_directories_removed_test() {
  assert_not_exists "$SKILLS_ROOT/desktop-app-repl"
  assert_not_exists "$SKILLS_ROOT/db-worker-node-repl"
}

run_test "scripts exist and skill is renamed" scripts_exist_and_skill_is_renamed_test
run_test "start --no-repl launches shared shadow and runtime" start_no_repl_launches_shared_shadow_and_runtime_test
run_test "start reuses existing db-worker runtime" start_reuses_existing_db_worker_runtime_test
run_test "desktop and db-worker share a single shadow watch" desktop_and_db_worker_share_single_shadow_watch_test
run_test "cleanup db-worker keeps shared watch for desktop" cleanup_db_worker_keeps_shared_watch_for_desktop_test
run_test "cleanup desktop keeps shared watch for db-worker" cleanup_desktop_keeps_shared_watch_for_db_worker_test
run_test "shared watch stops after last cleanup" shared_watch_stops_after_last_cleanup_test
run_test "start attaches repl by default" start_attaches_repl_by_default_test
run_test "help and docs are portable" help_and_docs_are_portable_test
run_test "obsolete skill directories removed" obsolete_skill_directories_removed_test

echo
if [[ "$FAIL_COUNT" -gt 0 ]]; then
  echo "$FAIL_COUNT test(s) failed; $PASS_COUNT passed." >&2
  exit 1
fi

echo "All $PASS_COUNT test(s) passed."
