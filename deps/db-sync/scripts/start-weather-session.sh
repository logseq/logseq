#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8787}"
TOKEN="${TOKEN:-}"
SESSION_ID="${SESSION_ID:-task-weather-hangzhou-$(date +%s)}"

create_payload() {
  cat <<JSON
{
  "id": "${SESSION_ID}",
  "source": {
    "node-id": "task-node-1",
    "node-title": "Check weather in Hangzhou",
    "node-revision": "2026-02-02T00:00:00Z",
    "snapshot": {
      "content": "#Task tell me the weather today in Hangzhou",
      "references": [],
      "attachments": []
    }
  },
  "intent": {
    "title": "Weather query",
    "summary": "Ask codex for weather in Hangzhou today"
  },
  "agent": {
    "provider": "codex",
    "mode": "build",
    "permission-mode": "default"
  },
  "audit": {
    "requested-at": 1769980800000,
    "priority": "normal"
  }
}
JSON
}

message_payload() {
  cat <<JSON
{
  "message": "Tell me the weather today in Hangzhou.",
  "kind": "user"
}
JSON
}

echo "Creating session: ${SESSION_ID}"
curl -sS -X POST "${BASE_URL}/sessions" \
  -H "authorization: Bearer ${TOKEN}" \
  -H "content-type: application/json" \
  -d "$(create_payload)"

echo

echo "Sending message to session: ${SESSION_ID}"
curl -sS -X POST "${BASE_URL}/sessions/${SESSION_ID}/messages" \
  -H "authorization: Bearer ${TOKEN}" \
  -H "content-type: application/json" \
  -d "$(message_payload)"

echo

echo "Streaming events (Ctrl+C to stop):"
curl -N -sS -H "authorization: Bearer ${TOKEN}" "${BASE_URL}/sessions/${SESSION_ID}/stream"
