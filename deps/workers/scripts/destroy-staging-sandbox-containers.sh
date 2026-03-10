#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKERS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKER_DIR="${WORKERS_DIR}/worker"

WRANGLER_ENV="${WRANGLER_ENV:-staging}"
WRANGLER_CONFIG="${WRANGLER_CONFIG:-${WORKER_DIR}/wrangler.agents.toml}"
NAME_FILTER="${NAME_FILTER:-logseq-agents-staging}"
APPLY=0

usage() {
  cat <<'EOF'
Destroy all Cloudflare containers in staging for the agents worker.

Usage:
  ./scripts/destroy-staging-sandbox-containers.sh [--yes] [--all]

Options:
  --yes   Execute deletions. Without this flag, script runs in dry-run mode.
  --all   Ignore NAME_FILTER and target every container in the selected env.

Environment variables:
  WRANGLER_ENV      Wrangler environment (default: staging)
  WRANGLER_CONFIG   Wrangler config path (default: worker/wrangler.agents.toml)
  NAME_FILTER       Container name substring filter (default: logseq-agents-staging)
EOF
}

FILTER_ENABLED=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      APPLY=1
      shift
      ;;
    --all)
      FILTER_ENABLED=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "${WRANGLER_CONFIG}" ]]; then
  echo "Wrangler config not found: ${WRANGLER_CONFIG}" >&2
  exit 1
fi

cd "${WORKER_DIR}"

echo "Listing containers for env=${WRANGLER_ENV} config=${WRANGLER_CONFIG}"
RAW_LIST="$(npx wrangler containers list -c "${WRANGLER_CONFIG}" -e "${WRANGLER_ENV}")"

CONTAINERS_TSV="$(
  printf "%s" "${RAW_LIST}" | node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8");
const start = raw.indexOf("[");
const end = raw.lastIndexOf("]");
if (start === -1 || end === -1 || end < start) {
  process.exit(0);
}
let items = [];
try {
  items = JSON.parse(raw.slice(start, end + 1));
} catch {
  process.exit(1);
}
for (const item of items) {
  if (item && item.id && item.name) {
    process.stdout.write(`${item.id}\t${item.name}\n`);
  }
}
'
)"

if [[ -z "${CONTAINERS_TSV}" ]]; then
  echo "No containers found."
  exit 0
fi

TARGETS=()
while IFS=$'\t' read -r id name; do
  if [[ -z "${id}" || -z "${name}" ]]; then
    continue
  fi
  if [[ "${FILTER_ENABLED}" -eq 1 && "${name}" != *"${NAME_FILTER}"* ]]; then
    continue
  fi
  TARGETS+=("${id}"$'\t'"${name}")
done <<< "${CONTAINERS_TSV}"

if [[ "${#TARGETS[@]}" -eq 0 ]]; then
  if [[ "${FILTER_ENABLED}" -eq 1 ]]; then
    echo "No containers matched NAME_FILTER=${NAME_FILTER}"
  else
    echo "No containers matched selection."
  fi
  exit 0
fi

echo "Selected containers:"
for pair in "${TARGETS[@]}"; do
  IFS=$'\t' read -r id name <<< "${pair}"
  echo "- ${id}  ${name}"
done

if [[ "${APPLY}" -ne 1 ]]; then
  echo "Dry-run only. Re-run with --yes to delete selected containers."
  exit 0
fi

for pair in "${TARGETS[@]}"; do
  IFS=$'\t' read -r id name <<< "${pair}"
  echo "Deleting ${id} (${name})"
  npx wrangler containers delete "${id}" -c "${WRANGLER_CONFIG}" -e "${WRANGLER_ENV}"
done

echo "Done."
