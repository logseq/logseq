#!/usr/bin/env bash
set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$TEST_DIR/.." && pwd)"
SKILLS_ROOT="$(cd "$SKILL_DIR/.." && pwd)"
START_SCRIPT="$SKILL_DIR/scripts/start-desktop-app-repl.sh"
CLEANUP_SCRIPT="$SKILL_DIR/scripts/cleanup-desktop-app-repl.sh"
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
if [[ "${1:-}" == "shadow-cljs" && "${2:-}" == "cljs-repl" && ( "${3:-}" == "app" || "${3:-}" == "electron" ) ]] && [[ -p /dev/stdin ]]; then
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
    echo "npx-smoke $*" >> "$FAKE_CMD_LOG"
    echo "shadow-cljs - connected to server"
    if [[ "${FAKE_SMOKE_TEST_FAIL:-0}" == "1" ]]; then
      echo "cljs.user=> false"
      echo "cljs.user=> \"Wrong\""
      echo "cljs.user=>"
      exit 0
    fi
    echo "cljs.user=> true"
    echo "cljs.user=> \"${FAKE_SMOKE_TEST_TITLE:-Logseq}\""
    echo "cljs.user=>"
    exit 0
  fi

  echo "npx-attach $*" >> "$FAKE_CMD_LOG"
  echo "shadow-cljs - connected to server"
  echo "cljs.user=>"
  exit 0
fi

if [[ "${1:-}" == "shadow-cljs" && "${2:-}" == "cljs-repl" && "${3:-}" == "electron" ]]; then
  if [[ "$input" == *":runtime :electron"* ]]; then
    echo "npx-electron-smoke $*" >> "$FAKE_CMD_LOG"
    echo "shadow-cljs - connected to server"
    echo "cljs.user=> {:runtime :electron, :process? true, :type \"browser\"}"
    echo "cljs.user=>"
    exit 0
  fi

  echo "npx-electron-attach $*" >> "$FAKE_CMD_LOG"
  echo "shadow-cljs - connected to server"
  echo "cljs.user=>"
  exit 0
fi

echo "Unexpected npx command: $*" >&2
exit 1
EOF

  cat > "$BIN_DIR/setsid" <<'EOF'
#!/usr/bin/env bash
exec "$@"
EOF

  chmod +x "$BIN_DIR/yarn" "$BIN_DIR/npx" "$BIN_DIR/setsid"

  export PATH="$BIN_DIR:$ORIGINAL_PATH"
  export FAKE_CMD_LOG="$CMD_LOG"
  export FAKE_APP_RUNTIME_COUNT="${FAKE_APP_RUNTIME_COUNT:-1}"
  export FAKE_SMOKE_TEST_FAIL="${FAKE_SMOKE_TEST_FAIL:-0}"
  export FAKE_SMOKE_TEST_TITLE="${FAKE_SMOKE_TEST_TITLE:-Logseq}"
}

link_system_tool() {
  local name="$1"
  local target
  target="$(command -v "$name")"
  ln -s "$target" "$SYSTEM_BIN_DIR/$name"
}

create_fake_env_without_setsid() {
  create_fake_env

  SYSTEM_BIN_DIR="$TEST_ROOT/system-bin"
  mkdir -p "$SYSTEM_BIN_DIR"
  rm -f "$BIN_DIR/setsid"

  local tool
  for tool in bash awk cat dirname grep mkdir nohup ps rm sleep tr; do
    link_system_tool "$tool"
  done

  export PATH="$BIN_DIR:$SYSTEM_BIN_DIR"
}

cleanup_fake_env() {
  if [[ -n "${REPO_ROOT:-}" && -d "$REPO_ROOT/tmp/desktop-app-repl" ]]; then
    local pid_file
    for pid_file in "$REPO_ROOT"/tmp/desktop-app-repl/*.pid; do
      [[ -e "$pid_file" ]] || continue
      local pid
      pid="$(tr -d '[:space:]' < "$pid_file")"
      if [[ "$pid" =~ ^[0-9]+$ ]]; then
        kill -9 "$pid" 2>/dev/null || true
      fi
    done
  fi

  PATH="$ORIGINAL_PATH"
  unset FAKE_CMD_LOG FAKE_APP_RUNTIME_COUNT FAKE_SMOKE_TEST_FAIL FAKE_SMOKE_TEST_TITLE || true

  if [[ -n "${TEST_ROOT:-}" && -d "$TEST_ROOT" ]]; then
    rm -rf "$TEST_ROOT"
  fi
}

scripts_exist_and_skill_is_renamed_test() {
  assert_equals "logseq-repl" "$CURRENT_SKILL_NAME"
  assert_file_exists "$START_SCRIPT"
  assert_file_exists "$CLEANUP_SCRIPT"
}

start_no_repl_launches_watch_and_electron_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/output.log" 2>&1

  assert_contains "Startup complete. REPL attach skipped (--no-repl)." "$TEST_ROOT/output.log"
  assert_contains "shared shadow-cljs:  $REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.log" "$TEST_ROOT/output.log"
  assert_contains "desktop-app:         $REPO_ROOT/tmp/desktop-app-repl/desktop-electron.log" "$TEST_ROOT/output.log"
  assert_contains "yarn watch" "$CMD_LOG"
  assert_contains "yarn dev-electron-app" "$CMD_LOG"
  assert_contains "npx-clj-eval shadow-cljs clj-eval" "$CMD_LOG"
  assert_contains "npx-smoke shadow-cljs cljs-repl app" "$CMD_LOG"

  assert_file_exists "$REPO_ROOT/tmp/desktop-app-repl/shadow-watch.pid"
  assert_file_exists "$REPO_ROOT/tmp/desktop-app-repl/desktop-electron.pid"
  assert_file_exists "$REPO_ROOT/tmp/desktop-app-repl/shadow-watch.log"
  assert_file_exists "$REPO_ROOT/tmp/desktop-app-repl/desktop-electron.log"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid"
  assert_file_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.log"
}

start_reuses_running_processes_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/first.log" 2>&1
  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/second.log" 2>&1

  local watch_count
  watch_count="$(grep -c '^yarn watch$' "$CMD_LOG")"
  local electron_count
  electron_count="$(grep -c '^yarn dev-electron-app$' "$CMD_LOG")"

  assert_equals "1" "$watch_count"
  assert_equals "1" "$electron_count"
  assert_contains "Reusing shared shadow-cljs watch" "$TEST_ROOT/second.log"
  assert_contains "Reusing Desktop dev app" "$TEST_ROOT/second.log"
}

start_fails_when_multiple_app_runtimes_exist_test() {
  create_fake_env
  trap cleanup_fake_env RETURN
  export FAKE_APP_RUNTIME_COUNT=2

  if bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/output.log" 2>&1; then
    fail "expected start script to fail when multiple :app runtimes exist"
  fi

  assert_contains "Expected exactly one live :app runtime" "$TEST_ROOT/output.log"
  assert_contains "Close the browser dev app" "$TEST_ROOT/output.log"
}

start_attaches_repl_by_default_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" < /dev/null > "$TEST_ROOT/output.log" 2>&1

  assert_contains "Attaching CLJS REPL: npx shadow-cljs cljs-repl app" "$TEST_ROOT/output.log"
  assert_contains "npx-attach shadow-cljs cljs-repl app" "$CMD_LOG"
}

electron_attach_works_after_desktop_start_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/start.log" 2>&1
  printf '(prn {:runtime :electron :process? (some? js/process) :type (.-type js/process)})\n:cljs/quit\n' | npx shadow-cljs cljs-repl electron > "$TEST_ROOT/electron.log" 2>&1

  assert_contains "Startup complete. REPL attach skipped (--no-repl)." "$TEST_ROOT/start.log"
  assert_contains "shadow-cljs - connected to server" "$TEST_ROOT/electron.log"
  assert_contains ":runtime :electron" "$TEST_ROOT/electron.log"
  assert_contains "npx-electron-smoke shadow-cljs cljs-repl electron" "$CMD_LOG"
}

start_works_without_setsid_test() {
  create_fake_env_without_setsid
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/output.log" 2>&1

  assert_contains "Startup complete. REPL attach skipped (--no-repl)." "$TEST_ROOT/output.log"
  assert_contains "yarn watch" "$CMD_LOG"
  assert_contains "yarn dev-electron-app" "$CMD_LOG"
}

start_accepts_non_logseq_window_title_test() {
  create_fake_env
  trap cleanup_fake_env RETURN
  export FAKE_SMOKE_TEST_TITLE="My Graph"

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/output.log" 2>&1

  assert_contains "Desktop renderer smoke test passed" "$TEST_ROOT/output.log"
  assert_contains "npx-smoke shadow-cljs cljs-repl app" "$CMD_LOG"
}

cleanup_stops_tracked_processes_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  bash "$START_SCRIPT" --repo-root "$REPO_ROOT" --no-repl > "$TEST_ROOT/start.log" 2>&1

  local shadow_pid
  shadow_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/desktop-app-repl/shadow-watch.pid")"
  local electron_pid
  electron_pid="$(tr -d '[:space:]' < "$REPO_ROOT/tmp/desktop-app-repl/desktop-electron.pid")"

  bash "$CLEANUP_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/cleanup.log" 2>&1

  if kill -0 "$shadow_pid" 2>/dev/null; then
    fail "expected shadow watch pid to be stopped"
  fi

  if kill -0 "$electron_pid" 2>/dev/null; then
    fail "expected desktop electron pid to be stopped"
  fi

  assert_not_exists "$REPO_ROOT/tmp/desktop-app-repl/shadow-watch.pid"
  assert_not_exists "$REPO_ROOT/tmp/desktop-app-repl/desktop-electron.pid"
  assert_not_exists "$REPO_ROOT/tmp/logseq-repl/shared-shadow-watch.pid"
  assert_contains "Cleanup done." "$TEST_ROOT/cleanup.log"
}

cleanup_does_not_signal_own_process_group_test() {
  create_fake_env
  trap cleanup_fake_env RETURN

  local bash_env_file fake_pid fake_pgid
  fake_pid=424242
  fake_pgid=777777
  mkdir -p "$REPO_ROOT/tmp/desktop-app-repl"
  echo "$fake_pid" > "$REPO_ROOT/tmp/desktop-app-repl/desktop-electron.pid"

  cat > "$BIN_DIR/ps" <<EOF
#!/usr/bin/env bash
set -euo pipefail

if [[ "\${1:-}" == "-o" && "\${2:-}" == "pgid=" && "\${3:-}" == "-p" ]]; then
  echo " $fake_pgid"
  exit 0
fi

exec /bin/ps "\$@"
EOF

  bash_env_file="$TEST_ROOT/bash-env"
  cat > "$bash_env_file" <<EOF
kill() {
echo "kill \$*" >> "$CMD_LOG"
return 0
}
EOF

  chmod +x "$BIN_DIR/ps"

  BASH_ENV="$bash_env_file" bash "$CLEANUP_SCRIPT" --repo-root "$REPO_ROOT" > "$TEST_ROOT/cleanup-own-pgid.log" 2>&1 || true

  if grep -Eq '^kill -TERM -[0-9]+' "$CMD_LOG"; then
    fail "expected cleanup not to signal its own process group"
  fi
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
  assert_contains "start-desktop-app-repl.sh" "$SKILL_FILE"
  assert_contains "start-db-worker-node-repl.sh" "$SKILL_FILE"
  assert_contains "tmp/logseq-repl" "$SKILL_FILE"
  assert_contains 'Run multiple runtimes together' "$SKILL_FILE"
  assert_contains "close browser dev app instances" "$SKILL_FILE"
  assert_contains "shared-shadow-watch.log" "$SKILL_FILE"
  assert_contains "shadow.user/electron-repl" "$SKILL_FILE"
  assert_contains "shadow.user/worker-node-repl" "$SKILL_FILE"
  assert_contains "Non-interactive verification examples" "$SKILL_FILE"
  assert_contains "printf '(prn {:runtime :app" "$SKILL_FILE"
  assert_contains "printf '(prn {:runtime :electron" "$SKILL_FILE"
  assert_contains "printf '(prn {:runtime :db-worker-node" "$SKILL_FILE"
  assert_contains 'Electron main-process `:electron` REPL' "$SKILL_FILE"
  assert_contains "Cleanup both workflows" "$SKILL_FILE"
  assert_not_contains_text "name: repl-workflows" "$SKILL_FILE"

  rm -rf "$temp_dir"
}

obsolete_skill_directories_removed_test() {
  assert_not_exists "$SKILLS_ROOT/desktop-app-repl"
  assert_not_exists "$SKILLS_ROOT/db-worker-node-repl"
}

run_test "scripts exist and skill is renamed" scripts_exist_and_skill_is_renamed_test
run_test "start --no-repl launches watch and electron" start_no_repl_launches_watch_and_electron_test
run_test "start reuses running processes" start_reuses_running_processes_test
run_test "start fails when multiple app runtimes exist" start_fails_when_multiple_app_runtimes_exist_test
run_test "start attaches repl by default" start_attaches_repl_by_default_test
run_test "electron attach works after desktop start" electron_attach_works_after_desktop_start_test
run_test "start works without setsid" start_works_without_setsid_test
run_test "start accepts non-Logseq window title" start_accepts_non_logseq_window_title_test
run_test "cleanup stops tracked processes" cleanup_stops_tracked_processes_test
run_test "cleanup does not signal its own process group" cleanup_does_not_signal_own_process_group_test
run_test "help and docs are portable" help_and_docs_are_portable_test
run_test "obsolete skill directories removed" obsolete_skill_directories_removed_test

echo
if [[ "$FAIL_COUNT" -gt 0 ]]; then
  echo "$FAIL_COUNT test(s) failed; $PASS_COUNT passed." >&2
  exit 1
fi

echo "All $PASS_COUNT test(s) passed."
