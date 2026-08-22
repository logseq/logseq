#!/usr/bin/env bash
set -euo pipefail

: "${DB_SYNC_IP:=0.0.0.0}"
: "${DB_SYNC_PORT:=8787}"

db_sync_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

cd "$db_sync_dir"
pnpm release
pnpm build:api-docs
pnpm migrate:local

cd worker
exec pnpm exec wrangler dev --local --ip "$DB_SYNC_IP" --port "$DB_SYNC_PORT"
