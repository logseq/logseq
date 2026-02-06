#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://127.0.0.1:8787"}
GRAPH_ID=${GRAPH_ID:-"dev-graph"}

SYNC_BASE="${BASE_URL}/sync/${GRAPH_ID}"

curl -sS "${BASE_URL}/health"
echo

curl -sS "${SYNC_BASE}/health"
echo

curl -sS "${SYNC_BASE}/pull?since=0"
echo

curl -sS "${SYNC_BASE}/snapshot"
echo

curl -sS -X POST "${SYNC_BASE}/tx" \
  -H "content-type: application/json" \
  --data-binary '{"t-before":0,"tx":"[]"}'

echo

curl -sS "${SYNC_BASE}/pull?since=0"
echo
