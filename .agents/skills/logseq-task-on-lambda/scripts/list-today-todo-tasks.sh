#!/usr/bin/env bash
set -euo pipefail

GRAPH_NAME="Lambda RTC"
TIMEOUT_SECONDS=20
LOGSEQ_BIN="${LOGSEQ_BIN:-logseq}"

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat >&2 <<'EOF'
Usage: list-today-todo-tasks.sh

List TODO task blocks from today's Journal Page in the Lambda RTC graph after
verifying that sync is open and idle.
EOF
}

if [[ $# -ne 0 ]]; then
  usage
  fail "expected no arguments"
fi

today_journal_day="$(
  node -e '
const now = new Date();
const yyyy = String(now.getFullYear());
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
console.log(`${yyyy}${mm}${dd}`);
'
)"

assess_sync_status() {
  node -e '
const fs = require("fs");

function fail(message) {
  console.error(message);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(0, "utf8"));
} catch (error) {
  fail(`sync status did not return valid JSON: ${error.message}`);
}

if (payload.status !== "ok") {
  fail(`sync status returned non-ok status: ${JSON.stringify(payload)}`);
}

const data = payload.data;
if (!data || typeof data !== "object" || Array.isArray(data)) {
  fail("sync status missing object data");
}

if (Object.prototype.hasOwnProperty.call(data, "last-error") && data["last-error"] != null) {
  fail(`sync status reports last-error: ${JSON.stringify(data["last-error"])}`);
}

const wsState = data["ws-state"];
const graphId = data["graph-id"];

if (wsState !== "open" || typeof graphId !== "string" || graphId.length === 0) {
  console.log("need-start");
  process.exit(0);
}

const pendingLocal = data["pending-local"];
const pendingServer = data["pending-server"];
if (typeof pendingLocal !== "number" || !Number.isFinite(pendingLocal)) {
  fail("sync status pending-local must be a number");
}
if (typeof pendingServer !== "number" || !Number.isFinite(pendingServer)) {
  fail("sync status pending-server must be a number");
}

const state = pendingLocal === 0 && pendingServer === 0 ? "complete" : "pending";
console.log([state, wsState, pendingLocal, pendingServer].join("\t"));
'
}

validate_and_print_tasks() {
  node -e '
const fs = require("fs");
const taskUuidsFile = process.env.TASK_UUIDS_FILE;

function fail(message) {
  console.error(message);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(0, "utf8"));
} catch (error) {
  fail(`query did not return valid JSON: ${error.message}`);
}

if (payload.status !== "ok") {
  fail(`query returned non-ok status: ${JSON.stringify(payload)}`);
}

const result = payload.data && payload.data.result;
if (!Array.isArray(result)) {
  fail("query result missing result array");
}

if (typeof taskUuidsFile !== "string" || taskUuidsFile.length === 0) {
  fail("TASK_UUIDS_FILE is required");
}

if (result.length === 0) {
  console.log("No TODO tasks found on today\u0027s Journal Page.");
  process.exit(0);
}

console.log(`Found ${result.length} TODO task(s) on today\u0027s Journal Page:`);
const uuids = [];
result.forEach((task, index) => {
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    fail(`query result item ${index + 1} is not an object`);
  }

  const rawUuid = task["block/uuid"];
  const title = task["block/title"];
  if (typeof rawUuid !== "string" || rawUuid.length === 0) {
    fail(`query result item ${index + 1} is missing block/uuid`);
  }
  if (typeof title !== "string" || title.length === 0) {
    fail(`query result item ${index + 1} is missing block/title`);
  }

  const uuid = rawUuid.toLowerCase();
  console.log(`${index + 1}. ${title}`);
  console.log(`   uuid: ${uuid}`);
  uuids.push(uuid);
});

fs.writeFileSync(taskUuidsFile, `${uuids.join("\n")}\n`);
'
}

run_status() {
  "$LOGSEQ_BIN" sync status --graph "$GRAPH_NAME" --output json
}

status_json="$(run_status)" || fail "sync status command failed"
assessment="$(printf '%s' "$status_json" | assess_sync_status)" || fail "sync status returned invalid state"

if [[ "$assessment" == "need-start" ]]; then
  "$LOGSEQ_BIN" sync start --graph "$GRAPH_NAME" >/dev/null || fail "sync start command failed"
fi

deadline=$((SECONDS + TIMEOUT_SECONDS))
while true; do
  status_json="$(run_status)" || fail "sync status command failed"
  assessment="$(printf '%s' "$status_json" | assess_sync_status)" || fail "sync status returned invalid state"

  if [[ "$assessment" == complete$'\t'* ]]; then
    IFS=$'\t' read -r _ ws_state pending_local pending_server <<<"$assessment"
    printf 'today-journal-day: %s\n' "$today_journal_day" >&2
    printf 'sync-gate: ws-state=%s pending-local=%s pending-server=%s\n' \
      "$ws_state" "$pending_local" "$pending_server" >&2
    break
  fi

  if [[ "$assessment" == "need-start" ]]; then
    fail "sync did not open after sync start"
  fi

  if (( SECONDS >= deadline )); then
    fail "sync status polling timed out before queues settled"
  fi

  sleep 1
done

query='[:find [(pull ?e [:db/id :block/uuid :block/title :block/updated-at]) ...]
       :in $ ?journal-day
       :where
       [?page :block/journal-day ?journal-day]
       [?e :block/page ?page]
       [?e :logseq.property/status ?status]
       [?status :db/ident :logseq.property/status.todo]
       [?e :block/title]]'

query_json="$("$LOGSEQ_BIN" query --graph "$GRAPH_NAME" --query "$query" --inputs "[$today_journal_day]" --output json)" \
  || fail "query command failed"

task_uuids_file="$(mktemp)"
trap 'rm -f "$task_uuids_file"' EXIT

printf '%s' "$query_json" | TASK_UUIDS_FILE="$task_uuids_file" validate_and_print_tasks

if [[ -s "$task_uuids_file" ]]; then
  printf '\nBlock trees:\n'
  task_index=1
  while IFS= read -r uuid; do
    if [[ -z "$uuid" ]]; then
      continue
    fi
    printf '\n--- Task %s: %s ---\n' "$task_index" "$uuid"
    "$LOGSEQ_BIN" show --graph "$GRAPH_NAME" --uuid "$uuid" --level 100 \
      || fail "show command failed for task $uuid"
    task_index=$((task_index + 1))
  done <"$task_uuids_file"
fi
