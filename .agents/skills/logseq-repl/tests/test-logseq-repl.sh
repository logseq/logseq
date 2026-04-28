#!/usr/bin/env bash
set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$TEST_DIR/.." && pwd)"
START_SCRIPT="$SKILL_DIR/scripts/start-repl.sh"
START_PY_SCRIPT="$SKILL_DIR/scripts/start-repl.py"
CLEANUP_SCRIPT="$SKILL_DIR/scripts/cleanup-repl.sh"
VERIFY_SCRIPT="$SKILL_DIR/scripts/verify-repls.sh"
SKILL_FILE="$SKILL_DIR/SKILL.md"
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

  cat > "$BIN_DIR/pnpm" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "pnpm $*" >> "$FAKE_CMD_LOG"

case "${1:-}" in
  watch)
    echo "shadow-cljs - nREPL server started on port 8701"
    echo "[:electron] Build completed."
    echo "[:app] Build completed."
    echo "[:db-worker-node] Build completed."
    while true; do sleep 1; done
    ;;
  dev-electron-app)
    echo "17:12:00.841 Logseq App(2.0.1) Starting..."
    echo "shadow-cljs - #6 ready!"
    while true; do sleep 1; done
    ;;
  exec)
    shift
    if [[ "${1:-}" != "shadow-cljs" ]]; then
      echo "Unexpected pnpm exec command: $*" >&2
      exit 1
    fi
    shift

    input=""
    if [[ "${1:-}" == "cljs-repl" ]] && [[ -p /dev/stdin ]]; then
      input="$(cat)"
    fi

    if [[ "${1:-}" == "clj-eval" ]]; then
      echo "pnpm-exec-clj-eval shadow-cljs $*" >> "$FAKE_CMD_LOG"
      echo "shadow-cljs - connected to server"
      case "$*" in
        *"repl-runtimes :app"*) echo "${FAKE_APP_RUNTIME_COUNT:-1}" ;;
        *"repl-runtimes :electron"*) echo "${FAKE_ELECTRON_RUNTIME_COUNT:-1}" ;;
        *"repl-runtimes :db-worker-node"*) echo "${FAKE_DB_RUNTIME_COUNT:-1}" ;;
        *) echo "0" ;;
      esac
      exit 0
    fi

    if [[ "${1:-}" == "cljs-repl" ]]; then
      echo "pnpm-exec-repl ${2:-missing}" >> "$FAKE_CMD_LOG"
      echo "shadow-cljs - connected to server"

      if [[ "$input" == *":cljs/quit"* ]]; then
        echo "verification must not send :cljs/quit" >&2
        exit 1
      fi

      case "${2:-}" in
        app)
          if [[ "$input" != *":runtime :app"* ]]; then
            echo "unexpected app verification form" >&2
            exit 1
          fi
          echo 'cljs.user=> {:runtime :app, :document? true}'
          ;;
        electron)
          if [[ "$input" != *":runtime :electron"* ]]; then
            echo "unexpected electron verification form" >&2
            exit 1
          fi
          echo 'cljs.user=> {:runtime :electron, :process? true}'
          ;;
        db-worker-node)
          if [[ "$input" != *":runtime :db-worker-node"* ]]; then
            echo "unexpected db-worker-node verification form" >&2
            exit 1
          fi
          echo 'cljs.user=> {:runtime :db-worker-node, :process? true}'
          ;;
        *)
          echo "Unexpected cljs-repl target: ${2:-}" >&2
          exit 1
          ;;
      esac

      echo "cljs.user=>"
      exit 0
    fi

    echo "Unexpected shadow-cljs command: $*" >&2
    exit 1
    ;;
    *)
      echo "Unexpected pnpm command: $*" >&2
      exit 1
      ;;
esac
EOF

  cat > "$BIN_DIR/node" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "node $*" >> "$FAKE_CMD_LOG"
echo "shadow-cljs - #6 ready!"
while true; do sleep 1; done
EOF

  cat > "$BIN_DIR/lsof" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

exit 1
EOF

  cat > "$BIN_DIR/python3" <<EOF
#!/usr/bin/env bash
exec "$(command -v python3)" "\$@"
EOF

  chmod +x "$BIN_DIR/pnpm" "$BIN_DIR/node" "$BIN_DIR/lsof" "$BIN_DIR/python3"

  export PATH="$BIN_DIR:$ORIGINAL_PATH"
  export FAKE_CMD_LOG="$CMD_LOG"
  export FAKE_APP_RUNTIME_COUNT="${FAKE_APP_RUNTIME_COUNT:-1}"
  export FAKE_ELECTRON_RUNTIME_COUNT="${FAKE_ELECTRON_RUNTIME_COUNT:-1}"
  export FAKE_DB_RUNTIME_COUNT="${FAKE_DB_RUNTIME_COUNT:-1}"
}

cleanup_fake_env() {
  if [[ -n "${REPO_ROOT:-}" ]]; then
    local pid_file pid
    for pid_file in "$REPO_ROOT"/tmp/logseq-repl/*.pid; do
      [[ -e "$pid_file" ]] || continue
      pid="$(tr -d '[:space:]' < "$pid_file")"
      if [[ "$pid" =~ ^[0-9]+$ ]]; then
        kill -9 "$pid" 2>/dev/null || true
      fi
    done
  fi

  PATH="$ORIGINAL_PATH"
  unset FAKE_CMD_LOG FAKE_APP_RUNTIME_COUNT FAKE_ELECTRON_RUNTIME_COUNT FAKE_DB_RUNTIME_COUNT || true

  if [[ -n "${TEST_ROOT:-}" && -d "$TEST_ROOT" ]]; then
    rm -rf "$TEST_ROOT"
  fi
}

scripts_exist_test() {
  assert_file_exists "$START_SCRIPT"
  assert_file_exists "$START_PY_SCRIPT"
  assert_file_exists "$CLEANUP_SCRIPT"
  assert_file_exists "$VERIFY_SCRIPT"
}

start_launches_all_repl_processes_without_attaching_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo > "$TEST_ROOT/start.log" 2>&1

  assert_contains "Verifying CLJS REPL targets ..." "$TEST_ROOT/start.log"
  assert_contains "REPL verification passed for :app" "$TEST_ROOT/start.log"
  assert_contains "REPL verification passed for :electron" "$TEST_ROOT/start.log"
  assert_contains "REPL verification passed for :db-worker-node" "$TEST_ROOT/start.log"
  assert_contains "Startup complete. Attach to the needed REPL manually." "$TEST_ROOT/start.log"
  assert_contains "pnpm exec shadow-cljs cljs-repl app" "$TEST_ROOT/start.log"
  assert_contains "pnpm exec shadow-cljs cljs-repl electron" "$TEST_ROOT/start.log"
  assert_contains "pnpm exec shadow-cljs cljs-repl db-worker-node" "$TEST_ROOT/start.log"
  assert_contains "pnpm watch" "$CMD_LOG"
  assert_contains "pnpm dev-electron-app" "$CMD_LOG"
  assert_contains "node ./static/db-worker-node.js --repo demo" "$CMD_LOG"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/desktop-electron.pid"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/db-worker-node.pid"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.log"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/desktop-electron.log"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/db-worker-node.log"
}

verify_script_checks_all_targets_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$VERIFY_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/verify.log" 2>&1

  assert_contains "Verifying CLJS REPL targets ..." "$TEST_ROOT/verify.log"
  assert_contains "REPL verification passed for :app" "$TEST_ROOT/verify.log"
  assert_contains "REPL verification passed for :electron" "$TEST_ROOT/verify.log"
  assert_contains "REPL verification passed for :db-worker-node" "$TEST_ROOT/verify.log"
  assert_contains "All CLJS REPL targets verified." "$TEST_ROOT/verify.log"
  assert_contains "pnpm-exec-repl app" "$CMD_LOG"
  assert_contains "pnpm-exec-repl electron" "$CMD_LOG"
  assert_contains "pnpm-exec-repl db-worker-node" "$CMD_LOG"
}

verify_script_fails_when_target_repl_fails_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  cat > "$BIN_DIR/pnpm" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "pnpm $*" >> "$FAKE_CMD_LOG"

if [[ "${1:-}" == "exec" && "${2:-}" == "shadow-cljs" && "${3:-}" == "cljs-repl" && "${4:-}" == "electron" ]]; then
  echo "No available JS runtime" >&2
  exit 1
fi

echo "shadow-cljs - connected to server"
echo "cljs.user=> {:ok true}"
EOF
  chmod +x "$BIN_DIR/pnpm"

  if bash "$VERIFY_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/verify.log" 2>&1; then
    fail "expected verify script to fail when one target REPL fails"
  fi

  assert_contains "Error: REPL verification failed for :electron." "$TEST_ROOT/verify.log"
  assert_contains "No available JS runtime" "$TEST_ROOT/verify.log"
}

start_reuses_all_running_processes_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo > "$TEST_ROOT/first.log" 2>&1
  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo > "$TEST_ROOT/second.log" 2>&1

  assert_equals "1" "$(grep -c '^pnpm watch$' "$CMD_LOG")"
  assert_equals "1" "$(grep -c '^pnpm dev-electron-app$' "$CMD_LOG")"
  assert_equals "1" "$(grep -c '^node ./static/db-worker-node.js --repo demo$' "$CMD_LOG")"
  assert_contains "Reusing shared shadow-cljs watch" "$TEST_ROOT/second.log"
  assert_contains "Reusing Desktop dev app" "$TEST_ROOT/second.log"
  assert_contains "Reusing db-worker-node runtime" "$TEST_ROOT/second.log"
}

start_fails_when_app_runtime_is_ambiguous_test() {
  create_fake_env
  trap cleanup_fake_env RETURN
  export FAKE_APP_RUNTIME_COUNT=2

  if bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo > "$TEST_ROOT/start.log" 2>&1; then
    fail "expected start script to fail when more than one :app runtime exists"
  fi

  assert_contains "Expected exactly one live :app runtime" "$TEST_ROOT/start.log"
}

cleanup_stops_all_repl_processes_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --repo demo > "$TEST_ROOT/start.log" 2>&1

  local watch_pid desktop_pid db_pid
  watch_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid")"
  desktop_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/logseq-repl/desktop-electron.pid")"
  db_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/logseq-repl/db-worker-node.pid")"

  bash "$CLEANUP_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/cleanup.log" 2>&1

  if kill -0 "$watch_pid" 2>/dev/null; then
    fail "expected shared watch to stop"
  fi

  if kill -0 "$desktop_pid" 2>/dev/null; then
    fail "expected Desktop dev app to stop"
  fi

  if kill -0 "$db_pid" 2>/dev/null; then
    fail "expected db-worker-node to stop"
  fi

  assert_not_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid"
  assert_not_exists "$REPO_ROOT/tmp/logseq-repl/desktop-electron.pid"
  assert_not_exists "$REPO_ROOT/tmp/logseq-repl/db-worker-node.pid"
  assert_contains "Cleanup done." "$TEST_ROOT/cleanup.log"
}

cleanup_removes_legacy_state_files_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  mkdir -p "$REPO_ROOT/tmp/desktop-app-repl" "$REPO_ROOT/tmp/db-worker-node-repl" "$REPO_ROOT/tmp/logseq-repl"
  sleep 30 &
  local legacy_desktop_pid=$!
  sleep 30 &
  local legacy_db_pid=$!
  echo "$legacy_desktop_pid" > "$REPO_ROOT/tmp/desktop-app-repl/desktop-electron.pid"
  echo "$legacy_db_pid" > "$REPO_ROOT/tmp/db-worker-node-repl/db-worker-node.pid"
  echo "$legacy_db_pid" > "$REPO_ROOT/tmp/db-worker-node-repl/shadow-db-worker-node.pid"

  bash "$CLEANUP_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/cleanup.log" 2>&1

  if kill -0 "$legacy_desktop_pid" 2>/dev/null; then
    fail "expected legacy desktop pid to stop"
  fi

  if kill -0 "$legacy_db_pid" 2>/dev/null; then
    fail "expected legacy db-worker pid to stop"
  fi

  assert_not_exists "$REPO_ROOT/tmp/desktop-app-repl/desktop-electron.pid"
  assert_not_exists "$REPO_ROOT/tmp/db-worker-node-repl/db-worker-node.pid"
  assert_not_exists "$REPO_ROOT/tmp/db-worker-node-repl/shadow-db-worker-node.pid"
}

help_and_docs_describe_unified_scripts_test() {
  local temp_dir start_help cleanup_help
  temp_dir="$(mktemp -d)"
  start_help="$temp_dir/start-help.txt"
  cleanup_help="$temp_dir/cleanup-help.txt"

  bash "$START_SCRIPT" --help > "$start_help"
  bash "$CLEANUP_SCRIPT" --help > "$cleanup_help"

  assert_contains "start-repl.sh" "$start_help"
  assert_contains "start-repl.py" "$SKILL_FILE"
  assert_contains "cleanup-repl.sh" "$cleanup_help"
  assert_contains "start-repl.sh" "$SKILL_FILE"
  assert_contains "cleanup-repl.sh" "$SKILL_FILE"
  assert_contains "verify-repls.sh" "$SKILL_FILE"
  assert_not_contains_text "start-desktop-app-repl.sh" "$SKILL_FILE"
  assert_not_contains_text "start-db-worker-node-repl.sh" "$SKILL_FILE"
  assert_not_contains_text "cleanup-desktop-app-repl.sh" "$SKILL_FILE"
  assert_not_contains_text "cleanup-db-worker-node-repl.sh" "$SKILL_FILE"

  rm -rf "$temp_dir"
}

run_test "scripts exist" scripts_exist_test
run_test "start launches all REPL processes without attaching" start_launches_all_repl_processes_without_attaching_test
run_test "verify script checks all targets" verify_script_checks_all_targets_test
run_test "verify script fails when target REPL fails" verify_script_fails_when_target_repl_fails_test
run_test "start reuses all running processes" start_reuses_all_running_processes_test
run_test "start fails when app runtime is ambiguous" start_fails_when_app_runtime_is_ambiguous_test
run_test "cleanup stops all REPL processes" cleanup_stops_all_repl_processes_test
run_test "cleanup removes legacy state files" cleanup_removes_legacy_state_files_test
run_test "help and docs describe unified scripts" help_and_docs_describe_unified_scripts_test

echo
if [[ "$FAIL_COUNT" -gt 0 ]]; then
  echo "$FAIL_COUNT test(s) failed; $PASS_COUNT passed." >&2
  exit 1
fi

echo "All $PASS_COUNT test(s) passed."
