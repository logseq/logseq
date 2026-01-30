#!/usr/bin/env bash
set -euo pipefail

GRAPH_UUID=${GRAPH_UUID:-"00000000-0000-0000-0000-000000000000"}

cat <<MSG
To clear local Durable Object state, remove the miniflare state directory:
  rm -rf .wrangler/state/v3/durable-objects/${GRAPH_UUID}

If your dev environment uses a different state path, locate it under:
  .wrangler/state/v3/
MSG
