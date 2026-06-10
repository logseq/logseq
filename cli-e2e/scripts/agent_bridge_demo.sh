#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: agent_bridge_demo.sh [options]

Creates a fresh Logseq graph, starts `logseq agent bridge`, writes a routable
task after the bridge listener is ready, and verifies that a fake Codex master
session received the task dispatch.

Options:
  --cli PATH          Path to static/logseq-cli.js. Default: <repo-root>/static/logseq-cli.js
  --root-dir DIR     Logseq CLI root dir. Default: a new temp dir
  --graph NAME       Graph name. Default: agent-bridge-demo-<timestamp>
  --repo-root DIR    Repository root. Default: inferred from this script
  --timeout-sec N    Wait timeout for bridge events. Default: 45
  -h, --help         Show this help
USAGE
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
cli_path=""
root_dir=""
graph="agent-bridge-demo-$(date +%s)"
timeout_sec=45
agent_name="AgentBridgeDemo"
task_title="AgentBridge demo task: mark this block in review"
expected_session="thread-agent-bridge-demo"
bridge_pid=""
graph_created=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cli)
      cli_path="$2"
      shift 2
      ;;
    --root-dir)
      root_dir="$2"
      shift 2
      ;;
    --graph)
      graph="$2"
      shift 2
      ;;
    --repo-root)
      repo_root="$2"
      shift 2
      ;;
    --timeout-sec)
      timeout_sec="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

cli_path="${cli_path:-$repo_root/static/logseq-cli.js}"
root_dir="${root_dir:-$(mktemp -d "${TMPDIR:-/tmp}/logseq-agent-bridge-demo.XXXXXX")}"
config_path="$root_dir/cli.edn"
work_dir="$root_dir/agent-bridge-demo"
fake_bin="$work_dir/fake-bin"
bridge_log="$work_dir/agent-bridge.log"
bridge_err="$work_dir/agent-bridge.err"
codex_log="$work_dir/codex-invocations.jsonl"

cleanup() {
  local status=$?
  if [[ -n "${bridge_pid:-}" ]] && kill -0 "$bridge_pid" 2>/dev/null; then
    kill "$bridge_pid" 2>/dev/null || true
    wait "$bridge_pid" 2>/dev/null || true
  fi
  if [[ "$graph_created" -eq 1 ]]; then
    node "$cli_path" --root-dir "$root_dir" --config "$config_path" --output json server stop --graph "$graph" >/dev/null 2>&1 || true
  fi
  exit "$status"
}
trap cleanup EXIT INT TERM

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command is missing: $1" >&2
    exit 2
  fi
}

json_result() {
  python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["result"])'
}

json_result_first() {
  python3 -c 'import json,sys; r=json.load(sys.stdin)["data"]["result"]; print(r[0] if isinstance(r, list) else r)'
}

run_cli_json() {
  node "$cli_path" --root-dir "$root_dir" --config "$config_path" --output json "$@"
}

wait_for_file_text() {
  local path="$1"
  local text="$2"
  local deadline=$((SECONDS + timeout_sec))
  while (( SECONDS < deadline )); do
    if [[ -f "$path" ]] && grep -Fq "$text" "$path"; then
      return 0
    fi
    if [[ -n "${bridge_pid:-}" ]] && ! kill -0 "$bridge_pid" 2>/dev/null; then
      echo "agent bridge exited before '$text'" >&2
      [[ -f "$bridge_log" ]] && cat "$bridge_log" >&2
      [[ -f "$bridge_err" ]] && cat "$bridge_err" >&2
      exit 1
    fi
    sleep 0.2
  done
  echo "Timed out waiting for '$text' in $path" >&2
  [[ -f "$bridge_log" ]] && cat "$bridge_log" >&2
  [[ -f "$bridge_err" ]] && cat "$bridge_err" >&2
  exit 1
}

query_task_status() {
  run_cli_json query --graph "$graph" --query "[:find ?status-ident . :where [$1 :logseq.property/status ?status] [?status :db/ident ?status-ident]]" | json_result
}

query_agent_session() {
  local payload
  payload="$(run_cli_json query --graph "$graph" --query "[:find ?session . :where [$1 :logseq.property.agent/session-id ?session]]")"
  python3 - "$root_dir" "$config_path" "$graph" "$cli_path" "$payload" <<'PY'
import json
import subprocess
import sys

payload = json.loads(sys.argv[5])
value = payload.get("data", {}).get("result")
if isinstance(value, int):
    root_dir, config_path, graph, cli_path = sys.argv[1:5]
    query = f"[:find ?title . :where [{value} :block/title ?title]]"
    resolved = subprocess.check_output(
        [
            "node",
            cli_path,
            "--root-dir",
            root_dir,
            "--config",
            config_path,
            "--output",
            "json",
            "query",
            "--graph",
            graph,
            "--query",
            query,
        ],
        text=True,
    )
    value = json.loads(resolved)["data"]["result"]
print("" if value is None else value)
PY
}

write_fake_codex() {
  mkdir -p "$fake_bin"
  cat > "$fake_bin/codex" <<'FAKE_CODEX'
#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -eq 1 && "$1" == "--version" ]]; then
  echo "codex-cli 0.0.0-agent-bridge-demo"
  exit 0
fi

if [[ "$#" -ge 6 && "$1" == "--sandbox" && "$2" == "danger-full-access" && "$3" == "exec" && "$4" == "--json" && "$5" == "--skip-git-repo-check" ]]; then
  prompt="$6"
  python3 - "$CODEX_FAKE_LOG" "$prompt" "$@" <<'PY'
import json
import pathlib
import sys

log_path = pathlib.Path(sys.argv[1])
prompt = sys.argv[2]
args = sys.argv[3:]
log_path.parent.mkdir(parents=True, exist_ok=True)
with log_path.open("a", encoding="utf8") as f:
    f.write(json.dumps({"event": "start", "args": args, "prompt": prompt}, ensure_ascii=False) + "\n")
PY
  printf '{"type":"thread.started","thread_id":"thread-agent-bridge-demo"}\n'
  exit 0
fi

if [[ "$#" -ge 8 && "$1" == "--sandbox" && "$2" == "danger-full-access" && "$3" == "exec" && "$4" == "resume" && "$5" == "--json" && "$6" == "--skip-git-repo-check" ]]; then
  session_id="$7"
  prompt="$8"
  python3 - "$CODEX_FAKE_LOG" "$session_id" "$prompt" "$@" <<'PY'
import json
import pathlib
import sys

log_path = pathlib.Path(sys.argv[1])
session_id = sys.argv[2]
prompt = sys.argv[3]
args = sys.argv[4:]
log_path.parent.mkdir(parents=True, exist_ok=True)
with log_path.open("a", encoding="utf8") as f:
    f.write(json.dumps({"event": "resume", "session": session_id, "args": args, "prompt": prompt}, ensure_ascii=False) + "\n")
PY
  block_uuid="$(python3 - "$prompt" <<'PY'
import re
import sys

match = re.search(r"^Block UUID:\s*([0-9a-fA-F-]+)\s*$", sys.argv[1], re.MULTILINE)
if not match:
    raise SystemExit("Block UUID not found in AgentBridge prompt")
print(match.group(1))
PY
)"
  node "$DEMO_CLI" --root-dir "$DEMO_ROOT_DIR" --config "$DEMO_CONFIG" --output json upsert task --graph "$DEMO_GRAPH" --uuid "$block_uuid" --status in-review >/dev/null
  node "$DEMO_CLI" --root-dir "$DEMO_ROOT_DIR" --config "$DEMO_CONFIG" --output json upsert block --graph "$DEMO_GRAPH" --uuid "$block_uuid" --update-properties '{"Agent Session ID" "thread-agent-bridge-demo"}' >/dev/null
  printf '{"type":"thread.started","thread_id":"%s"}\n' "$session_id"
  exit 0
fi

echo "unexpected codex args: $*" >&2
exit 2
FAKE_CODEX
  chmod +x "$fake_bin/codex"
}

require_command node
require_command python3

mkdir -p "$work_dir"
printf '{:output-format :json :agent-name "%s"}\n' "$agent_name" > "$config_path"
write_fake_codex

echo "creating graph: $graph"
echo "root dir: $root_dir"
run_cli_json graph create --graph "$graph" >/dev/null
graph_created=1

echo "starting agent bridge"
PATH="$fake_bin:$PATH" \
CODEX_FAKE_LOG="$codex_log" \
DEMO_CLI="$cli_path" \
DEMO_ROOT_DIR="$root_dir" \
DEMO_CONFIG="$config_path" \
DEMO_GRAPH="$graph" \
  node "$cli_path" --root-dir "$root_dir" --config "$config_path" --output human agent bridge --graph "$graph" >"$bridge_log" 2>"$bridge_err" &
bridge_pid=$!

wait_for_file_text "$bridge_log" "listening graph changes"

task_id="$(run_cli_json upsert task --graph "$graph" --target-page AgentBridgeDemo --content "$task_title" --status todo | json_result_first)"
run_cli_json upsert block --graph "$graph" --id "$task_id" --update-properties "{\"Assignee\" \"$agent_name\"}" >/dev/null

deadline=$((SECONDS + timeout_sec))
task_status=""
agent_session=""
while (( SECONDS < deadline )); do
  task_status="$(query_task_status "$task_id")"
  agent_session="$(query_agent_session "$task_id")"
  if [[ "$task_status" == "logseq.property/status.in-review" && "$agent_session" == "$expected_session" ]]; then
    break
  fi
  if [[ -n "${bridge_pid:-}" ]] && ! kill -0 "$bridge_pid" 2>/dev/null; then
    echo "agent bridge exited before verification completed" >&2
    cat "$bridge_log" >&2
    cat "$bridge_err" >&2
    exit 1
  fi
  sleep 0.5
done

if [[ "$task_status" != "logseq.property/status.in-review" ]]; then
  echo "Expected task status in-review, got: ${task_status:-<empty>}" >&2
  cat "$bridge_log" >&2
  cat "$bridge_err" >&2
  exit 1
fi

if [[ "$agent_session" != "$expected_session" ]]; then
  echo "Expected agent-session-id $expected_session, got: ${agent_session:-<empty>}" >&2
  cat "$bridge_log" >&2
  cat "$bridge_err" >&2
  exit 1
fi

python3 - "$codex_log" "$task_title" "$graph" <<'PY'
import json
import pathlib
import sys

log_path = pathlib.Path(sys.argv[1])
task_title = sys.argv[2]
graph = sys.argv[3]
lines = [json.loads(line) for line in log_path.read_text(encoding="utf8").splitlines() if line.strip()]
resume_lines = [line for line in lines if line.get("event") == "resume"]
if len(resume_lines) != 1:
    raise SystemExit(f"expected one Codex resume invocation, got {len(resume_lines)}")
prompt = resume_lines[0]["prompt"]
if task_title not in prompt:
    raise SystemExit("task title missing from Codex prompt")
if f"Graph: {graph}" not in prompt:
    raise SystemExit("graph missing from Codex prompt")
if "Block UUID:" not in prompt:
    raise SystemExit("block uuid missing from Codex prompt")
if "Request kind: task" not in prompt:
    raise SystemExit("request kind missing from Codex prompt")
PY

echo "task status: in-review"
echo "agent-session-id: $agent_session"
echo "agent bridge demo completed"
