#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://127.0.0.1:8787"}
GRAPH_UUID=${GRAPH_UUID:-"00000000-0000-0000-0000-000000000000"}
PAGE_UUID=${PAGE_UUID:-"00000000-0000-0000-0000-000000000001"}

META=$(cat <<JSON
{"page-uuid":"${PAGE_UUID}","block-count":1,"schema-version":"0","publish/format":"transit","publish/compression":"none","publish/content-hash":"dev","publish/content-length":1,"publish/graph":"${GRAPH_UUID}","publish/created-at":0}
JSON
)

PAYLOAD="{}"

curl -sS -X POST "${BASE_URL}/pages" \
  -H "content-type: application/transit+json" \
  -H "x-publish-meta: ${META}" \
  --data-binary "${PAYLOAD}"

echo

curl -sS "${BASE_URL}/pages/${PAGE_UUID}"

echo

curl -sS "${BASE_URL}/pages/${PAGE_UUID}/transit"

echo

curl -sS "${BASE_URL}/pages"

echo
