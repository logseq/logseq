#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8787}"
TOKEN="${TOKEN:-dev-token}"
RUNNER_ID="${RUNNER_ID:-$(hostname -s 2>/dev/null || echo local-runner)}"
RUNNER_MAX_SESSIONS="${RUNNER_MAX_SESSIONS:-1}"
HEARTBEAT_INTERVAL_SEC="${HEARTBEAT_INTERVAL_SEC:-20}"
RUNNER_ACTIVE_SESSIONS="${RUNNER_ACTIVE_SESSIONS:-0}"

SANDBOX_AGENT_URL="${SANDBOX_AGENT_URL:-http://127.0.0.1:2468}"
SANDBOX_AGENT_TOKEN="${SANDBOX_AGENT_TOKEN:-}"
AUTO_START_SANDBOX_AGENT="${AUTO_START_SANDBOX_AGENT:-1}"
AUTO_START_CLOUDFLARED="${AUTO_START_CLOUDFLARED:-1}"

# If set, this value is used directly and cloudflared is skipped.
RUNNER_BASE_URL="${RUNNER_BASE_URL:-}"
ACCESS_CLIENT_ID="${ACCESS_CLIENT_ID:-}"
ACCESS_CLIENT_SECRET="${ACCESS_CLIENT_SECRET:-}"

# Extra args for cloudflared when AUTO_START_CLOUDFLARED=1.
CLOUDFLARED_ARGS="${CLOUDFLARED_ARGS:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLOUDFLARED_LOG="${CLOUDFLARED_LOG:-${SCRIPT_DIR}/.local-runner-cloudflared.log}"

SANDBOX_AGENT_PID=""
CLOUDFLARED_PID=""

log() {
  printf '[local-runner-daemon] %s\n' "$*"
}

json_escape() {
  local value="${1-}"
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\r'/\\r}
  value=${value//$'\t'/\\t}
  printf '%s' "$value"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

cleanup() {
  if [[ -n "${CLOUDFLARED_PID}" ]] && kill -0 "${CLOUDFLARED_PID}" >/dev/null 2>&1; then
    log "Stopping cloudflared (pid=${CLOUDFLARED_PID})"
    kill "${CLOUDFLARED_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${SANDBOX_AGENT_PID}" ]] && kill -0 "${SANDBOX_AGENT_PID}" >/dev/null 2>&1; then
    log "Stopping sandbox-agent helper (pid=${SANDBOX_AGENT_PID})"
    kill "${SANDBOX_AGENT_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

sandbox_health() {
  local auth=()
  if [[ -n "${SANDBOX_AGENT_TOKEN}" ]]; then
    auth=(-H "authorization: Bearer ${SANDBOX_AGENT_TOKEN}")
  fi
  curl -sS -f "${auth[@]}" "${SANDBOX_AGENT_URL}/v1/health" >/dev/null
}

wait_sandbox_health() {
  local retries="${1:-60}"
  local interval="${2:-1}"
  local i=0
  while [[ "${i}" -lt "${retries}" ]]; do
    if sandbox_health; then
      return 0
    fi
    sleep "${interval}"
    i=$((i + 1))
  done
  return 1
}

start_sandbox_agent_if_needed() {
  if sandbox_health; then
    log "sandbox-agent is healthy at ${SANDBOX_AGENT_URL}"
    return 0
  fi
  if [[ "${AUTO_START_SANDBOX_AGENT}" != "1" ]]; then
    echo "sandbox-agent is not healthy and AUTO_START_SANDBOX_AGENT=0" >&2
    return 1
  fi
  log "Starting sandbox-agent via scripts/start-local-sandbox-agent.sh"
  "${SCRIPT_DIR}/start-local-sandbox-agent.sh" >"${SCRIPT_DIR}/.local-runner-sandbox-agent.log" 2>&1 &
  SANDBOX_AGENT_PID="$!"
  if ! wait_sandbox_health 90 1; then
    echo "sandbox-agent failed to become healthy at ${SANDBOX_AGENT_URL}" >&2
    return 1
  fi
  log "sandbox-agent is healthy at ${SANDBOX_AGENT_URL}"
}

resolve_runner_base_url() {
  if [[ -n "${RUNNER_BASE_URL}" ]]; then
    log "Using RUNNER_BASE_URL=${RUNNER_BASE_URL}"
    return 0
  fi

  if [[ "${AUTO_START_CLOUDFLARED}" != "1" ]]; then
    echo "RUNNER_BASE_URL is required when AUTO_START_CLOUDFLARED=0" >&2
    return 1
  fi

  require_cmd cloudflared
  : > "${CLOUDFLARED_LOG}"

  log "Starting cloudflared quick tunnel to ${SANDBOX_AGENT_URL}"
  # shellcheck disable=SC2086
  cloudflared tunnel --url "${SANDBOX_AGENT_URL}" ${CLOUDFLARED_ARGS} >"${CLOUDFLARED_LOG}" 2>&1 &
  CLOUDFLARED_PID="$!"

  local i=0
  while [[ "${i}" -lt 60 ]]; do
    if ! kill -0 "${CLOUDFLARED_PID}" >/dev/null 2>&1; then
      echo "cloudflared exited unexpectedly. See ${CLOUDFLARED_LOG}" >&2
      return 1
    fi
    local detected
    detected="$(grep -Eo 'https://[a-zA-Z0-9.-]+trycloudflare.com' "${CLOUDFLARED_LOG}" | tail -n 1 || true)"
    if [[ -n "${detected}" ]]; then
      RUNNER_BASE_URL="${detected}"
      log "Detected quick tunnel URL: ${RUNNER_BASE_URL}"
      log "For production, prefer a named tunnel + Access policy."
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done

  echo "Could not detect cloudflared public URL. See ${CLOUDFLARED_LOG}" >&2
  return 1
}

register_payload() {
  local payload
  payload='{"runner-id":"'"$(json_escape "${RUNNER_ID}")"'","base-url":"'"$(json_escape "${RUNNER_BASE_URL%/}")"'","max-sessions":'"${RUNNER_MAX_SESSIONS}"
  if [[ -n "${SANDBOX_AGENT_TOKEN}" ]]; then
    payload+=',"agent-token":"'"$(json_escape "${SANDBOX_AGENT_TOKEN}")"'"'
  fi
  if [[ -n "${ACCESS_CLIENT_ID}" ]]; then
    payload+=',"access-client-id":"'"$(json_escape "${ACCESS_CLIENT_ID}")"'"'
  fi
  if [[ -n "${ACCESS_CLIENT_SECRET}" ]]; then
    payload+=',"access-client-secret":"'"$(json_escape "${ACCESS_CLIENT_SECRET}")"'"'
  fi
  payload+='}'
  printf '%s' "${payload}"
}

register_runner() {
  log "Registering runner '${RUNNER_ID}' at ${RUNNER_BASE_URL}"
  local response
  response="$(curl -sS -f -X POST "${BASE_URL}/runners" \
    -H "authorization: Bearer ${TOKEN}" \
    -H "content-type: application/json" \
    -d "$(register_payload)")"
  log "Runner registered"
  echo "${response}" >/dev/null
}

heartbeat_runner() {
  curl -sS -f -X POST "${BASE_URL}/runners/${RUNNER_ID}/heartbeat" \
    -H "authorization: Bearer ${TOKEN}" \
    -H "content-type: application/json" \
    -d "{\"active-sessions\":${RUNNER_ACTIVE_SESSIONS}}" >/dev/null
}

heartbeat_loop() {
  log "Starting heartbeat loop (interval=${HEARTBEAT_INTERVAL_SEC}s)"
  while true; do
    if heartbeat_runner; then
      :
    else
      log "Heartbeat failed, retrying register"
      register_runner || true
    fi
    sleep "${HEARTBEAT_INTERVAL_SEC}"
  done
}

main() {
  require_cmd curl
  start_sandbox_agent_if_needed
  resolve_runner_base_url
  register_runner
  heartbeat_loop
}

main "$@"
