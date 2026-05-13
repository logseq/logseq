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
Usage: fetch-task-block.sh UUID_OR_DOUBLE_BRACKET_UUID

Fetch one task block tree from the Lambda RTC graph after verifying that
sync is open and idle.
EOF
}

if [[ $# -ne 1 ]]; then
  usage
  fail "expected exactly one UUID argument"
fi

input="$(printf '%s' "$1" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
uuid_pattern='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

if [[ "$input" =~ ^\[\[($uuid_pattern)\]\]$ ]]; then
  uuid="${BASH_REMATCH[1],,}"
elif [[ "$input" =~ ^($uuid_pattern)$ ]]; then
  uuid="${BASH_REMATCH[1],,}"
else
  fail "expected one bare UUID or one double-bracket UUID reference"
fi

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

validate_show_json() {
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
  fail(`show did not return valid JSON: ${error.message}`);
}

if (payload.status !== "ok") {
  fail(`show returned non-ok status: ${JSON.stringify(payload)}`);
}

const root = payload.data && payload.data.root;
if (!root || typeof root !== "object" || Array.isArray(root)) {
  fail("show returned no root block");
}

if (typeof root["block/title"] !== "string" || root["block/title"].length === 0) {
  fail("show root block has no block/title content");
}
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
    printf 'normalized-uuid: %s\n' "$uuid" >&2
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

show_json="$("$LOGSEQ_BIN" show --graph "$GRAPH_NAME" --uuid "$uuid" --level 100 --output json)" \
  || fail "show command failed"
printf '%s' "$show_json" | validate_show_json || fail "show returned invalid block tree"

human_output="$("$LOGSEQ_BIN" show --graph "$GRAPH_NAME" --uuid "$uuid" --level 100)" \
  || fail "show command failed"
if [[ -z "$human_output" ]]; then
  fail "show returned empty block tree"
fi

printf '%s\n' "$human_output"
