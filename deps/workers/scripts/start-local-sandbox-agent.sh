#!/usr/bin/env bash
set -euo pipefail

SANDBOX_AGENT_REPO="${SANDBOX_AGENT_REPO:-$HOME/Codes/projects/sandbox-agent}"
SANDBOX_AGENT_HOST="${SANDBOX_AGENT_HOST:-127.0.0.1}"
SANDBOX_AGENT_PORT="${SANDBOX_AGENT_PORT:-2468}"
SANDBOX_AGENT_TOKEN="${SANDBOX_AGENT_TOKEN:-}"

if [ ! -d "$SANDBOX_AGENT_REPO" ]; then
  echo "sandbox-agent repo not found: $SANDBOX_AGENT_REPO" >&2
  exit 1
fi

cd "$SANDBOX_AGENT_REPO"

if [ -n "$SANDBOX_AGENT_TOKEN" ]; then
  exec cargo run -p sandbox-agent -- server \
    --host "$SANDBOX_AGENT_HOST" \
    --port "$SANDBOX_AGENT_PORT" \
    --token "$SANDBOX_AGENT_TOKEN"
else
  exec cargo run -p sandbox-agent -- server \
    --host "$SANDBOX_AGENT_HOST" \
    --port "$SANDBOX_AGENT_PORT" \
    --no-token
fi
