#!/usr/bin/env bash
set -euo pipefail

test_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly test_dir
readonly manager="$test_dir/logseq-sync"
suite_tmp="$(mktemp -d "${TMPDIR:-/tmp}/logseq-sync-test-suite.XXXXXX")"
readonly suite_tmp

cleanup() {
  if [[ -d "$suite_tmp" && "$suite_tmp" == *logseq-sync-test-suite.* ]]; then
    rm -rf -- "$suite_tmp"
  fi
}

trap cleanup EXIT

pass_count=0
fail_count=0

make_sandbox() {
  local sandbox
  sandbox="$(mktemp -d "$suite_tmp/case.XXXXXX")"
  mkdir -p "$sandbox/bin" "$sandbox/home"

  cat > "$sandbox/bin/uname" <<'EOF'
#!/usr/bin/env bash
printf 'Linux\n'
EOF

  cat > "$sandbox/bin/docker" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_DOCKER_LOG"
case "$*" in
  "compose version") exit 0 ;;
  "info") exit "${MOCK_DOCKER_INFO_STATUS:-0}" ;;
esac
if [[ -n "${MOCK_DOCKER_FAIL_ONCE_PATTERN:-}" \
      && "$*" == *"$MOCK_DOCKER_FAIL_ONCE_PATTERN"* \
      && "$(grep -F -c -- "$MOCK_DOCKER_FAIL_ONCE_PATTERN" "$MOCK_DOCKER_LOG")" -eq 1 ]]; then
  exit 1
fi
if [[ "$*" == *" up -d --force-recreate"* ]]; then
  : > "$MOCK_DOCKER_STATE_DIR/rollback-started"
fi
case "$*" in
  *" ps --format json "*)
    health="${MOCK_DOCKER_HEALTH:-healthy}"
    if [[ "${MOCK_DOCKER_UNHEALTHY_UNTIL_ROLLBACK:-0}" == "1" \
          && ! -f "$MOCK_DOCKER_STATE_DIR/rollback-started" ]]; then
      health="unhealthy"
    fi
    printf '{"Health":"%s","State":"running"}\n' "$health"
    ;;
  *) exit "${MOCK_DOCKER_STATUS:-0}" ;;
esac
EOF

  cat > "$sandbox/bin/curl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_CURL_LOG"
if [[ -n "${MOCK_CURL_FAIL_PATTERN:-}" \
      && "$*" == *"$MOCK_CURL_FAIL_PATTERN"* ]]; then
  exit 1
fi
if [[ "${MOCK_CURL_STATUS:-0}" -ne 0 ]]; then
  exit "$MOCK_CURL_STATUS"
fi
printf '%s' "${MOCK_CURL_BODY:-{\"ok\":true}}"
EOF

  cat > "$sandbox/bin/sleep" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_SLEEP_LOG"
EOF

  cat > "$sandbox/bin/mv" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_MV_LOG"
if [[ -n "${MOCK_MV_FAIL_ONCE_PATTERN:-}" \
      && "$*" == *"$MOCK_MV_FAIL_ONCE_PATTERN"* \
      && "$(grep -F -c -- "$MOCK_MV_FAIL_ONCE_PATTERN" "$MOCK_MV_LOG")" -eq 1 ]]; then
  exit 1
fi
PATH=/usr/bin:/bin exec mv "$@"
EOF

  chmod +x "$sandbox/bin/uname" "$sandbox/bin/docker" "$sandbox/bin/curl" \
    "$sandbox/bin/sleep" "$sandbox/bin/mv"
  printf '%s' "$sandbox"
}

run_manager() {
  local sandbox="$1"
  local input="$2"
  shift 2
  set +e
  last_output="$(printf '%s' "$input" | env \
    HOME="$sandbox/home" \
    PATH="$sandbox/bin:$PATH" \
    MOCK_DOCKER_LOG="$sandbox/docker.log" \
    MOCK_CURL_LOG="$sandbox/curl.log" \
    MOCK_SLEEP_LOG="$sandbox/sleep.log" \
    MOCK_MV_LOG="$sandbox/mv.log" \
    MOCK_DOCKER_STATE_DIR="$sandbox" \
    "$@" \
    "$manager" setup 2>&1)"
  last_status=$?
  set -e
}

assert_contains() {
  local value="$1"
  local expected="$2"
  [[ "$value" == *"$expected"* ]] || {
    printf 'Expected to find %q in:\n%s\n' "$expected" "$value" >&2
    return 1
  }
}

assert_not_contains() {
  local value="$1"
  local unexpected="$2"
  [[ "$value" != *"$unexpected"* ]] || {
    printf 'Did not expect to find %q in:\n%s\n' "$unexpected" "$value" >&2
    return 1
  }
}

assert_success() {
  [[ "$last_status" -eq 0 ]] || {
    printf 'Expected success, got status %s:\n%s\n' "$last_status" "$last_output" >&2
    return 1
  }
}

assert_failure() {
  [[ "$last_status" -ne 0 ]] || {
    printf 'Expected failure:\n%s\n' "$last_output" >&2
    return 1
  }
}

assert_managed_configuration_matches() {
  local expected_dir="$1"
  local actual_dir="$2"
  local name
  for name in compose.yaml compose.http.yaml .env Caddyfile; do
    cmp "$expected_dir/$name" "$actual_dir/$name" || return 1
  done
}

test_unhealthy_service_is_rejected() {
  local sandbox input
  sandbox="$(make_sandbox)"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    sync.example.com \
    logseq-client \
    y)"
  run_manager "$sandbox" "$input" MOCK_DOCKER_HEALTH=unhealthy
  assert_failure || return 1
  assert_not_contains "$last_output" 'Logseq Sync is ready'
  [[ -f "$sandbox/install/.env" ]] || return 1
  assert_not_contains "$last_output" 'previous working deployment was restored'
  assert_not_contains "$(<"$sandbox/docker.log")" ' up -d --force-recreate'
}

test_health_body_is_verified() {
  local sandbox input
  sandbox="$(make_sandbox)"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    sync.example.com \
    logseq-client \
    y)"
  run_manager "$sandbox" "$input" 'MOCK_CURL_BODY={"ok":false}'
  assert_failure || return 1
  assert_not_contains "$last_output" 'Logseq Sync is ready'
  [[ -f "$sandbox/install/.env" ]] || return 1
  assert_not_contains "$last_output" 'previous working deployment was restored'
}

test_docker_daemon_is_checked_before_writes() {
  local sandbox input
  sandbox="$(make_sandbox)"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    sync.example.com \
    logseq-client \
    y)"
  run_manager "$sandbox" "$input" MOCK_DOCKER_INFO_STATUS=1
  assert_failure || return 1
  [[ ! -e "$sandbox/install" ]]
}

test_first_setup_compose_failure_preserves_staged_configuration() {
  local sandbox input
  sandbox="$(make_sandbox)"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    sync.example.com \
    logseq-client \
    y)"
  run_manager "$sandbox" "$input" \
    'MOCK_DOCKER_FAIL_ONCE_PATTERN= up -d --build'
  assert_failure || return 1
  [[ -f "$sandbox/install/.env" ]] || return 1
  [[ -f "$sandbox/install/compose.yaml" ]] || return 1
  [[ -f "$sandbox/install/Caddyfile" ]] || return 1
  assert_contains "$last_output" 'Sync startup failed'
  assert_not_contains "$last_output" 'previous working deployment was restored'
  assert_not_contains "$(<"$sandbox/docker.log")" ' up -d --force-recreate'
}

test_existing_configuration_becomes_prompt_defaults() {
  local sandbox input env_file
  sandbox="$(make_sandbox)"
  mkdir -p "$sandbox/install"
  env_file="$sandbox/install/.env"
  cat > "$env_file" <<EOF
LOGSEQ_SYNC_SOURCE_DIR=/old/source
LOGSEQ_SYNC_INSTALL_DIR=$sandbox/install
LOGSEQ_SYNC_DATA_DIR=$sandbox/existing-data
LOGSEQ_SYNC_UID=1000
LOGSEQ_SYNC_GID=1000
LOGSEQ_SYNC_ENDPOINT_MODE=https
DB_SYNC_BASE_URL=https://old-sync.example.com:10010
DB_SYNC_BIND_ADDRESS=127.0.0.1
DB_SYNC_PUBLIC_PORT=10010
DB_SYNC_LOG_LEVEL=debug
COGNITO_ISSUER=https://issuer.example.com/pool
COGNITO_CLIENT_ID=custom-client
COGNITO_JWKS_URL=https://issuer.example.com/pool/.well-known/jwks.json
EOF
  input="$(printf '%s\n' \
    "$sandbox/install" \
    '' \
    '' \
    '' \
    '' \
    '' \
    '' \
    '' \
    y \
    y)"
  run_manager "$sandbox" "$input"
  assert_success || return 1
  assert_contains "$(<"$env_file")" "LOGSEQ_SYNC_DATA_DIR=$sandbox/existing-data"
  assert_contains "$(<"$env_file")" 'DB_SYNC_BASE_URL=https://old-sync.example.com:10010'
  assert_contains "$(<"$env_file")" 'COGNITO_CLIENT_ID=custom-client'
}

test_https_to_http_removes_caddy_container() {
  local sandbox input
  sandbox="$(make_sandbox)"
  mkdir -p "$sandbox/install"
  cat > "$sandbox/install/.env" <<EOF
LOGSEQ_SYNC_SOURCE_DIR=/old/source
LOGSEQ_SYNC_INSTALL_DIR=$sandbox/install
LOGSEQ_SYNC_DATA_DIR=$sandbox/data
LOGSEQ_SYNC_UID=1000
LOGSEQ_SYNC_GID=1000
LOGSEQ_SYNC_ENDPOINT_MODE=https
DB_SYNC_BASE_URL=https://old-sync.example.com:10010
DB_SYNC_BIND_ADDRESS=127.0.0.1
DB_SYNC_PUBLIC_PORT=10010
DB_SYNC_LOG_LEVEL=info
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8
COGNITO_CLIENT_ID=69cs1lgme7p8kbgld8n5kseii6
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8/.well-known/jwks.json
EOF
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    http \
    http://127.0.0.1:18080 \
    I_ACCEPT_HTTP \
    logseq-client \
    y \
    y)"
  run_manager "$sandbox" "$input"
  assert_success || return 1
  assert_contains "$(<"$sandbox/docker.log")" 'rm --stop --force caddy'
}

test_https_to_http_restores_configuration_when_replacement_fails() {
  local sandbox input original_dir
  sandbox="$(make_sandbox)"
  mkdir -p "$sandbox/install"
  cp "$test_dir/compose.yaml" "$sandbox/install/compose.yaml"
  cp "$test_dir/compose.http.yaml" "$sandbox/install/compose.http.yaml"
  printf 'https://old-sync.example.com {\n\treverse_proxy sync:8080\n}\n' \
    > "$sandbox/install/Caddyfile"
  cat > "$sandbox/install/.env" <<EOF
LOGSEQ_SYNC_SOURCE_DIR=/old/source
LOGSEQ_SYNC_INSTALL_DIR=$sandbox/install
LOGSEQ_SYNC_DATA_DIR=$sandbox/data
LOGSEQ_SYNC_UID=1000
LOGSEQ_SYNC_GID=1000
LOGSEQ_SYNC_ENDPOINT_MODE=https
DB_SYNC_BASE_URL=https://old-sync.example.com
DB_SYNC_BIND_ADDRESS=127.0.0.1
DB_SYNC_PUBLIC_PORT=443
DB_SYNC_LOG_LEVEL=info
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8
COGNITO_CLIENT_ID=69cs1lgme7p8kbgld8n5kseii6
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8/.well-known/jwks.json
EOF
  original_dir="$sandbox/original"
  mkdir -p "$original_dir"
  cp -a "$sandbox/install/." "$original_dir/"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    http \
    http://127.0.0.1:18080 \
    I_ACCEPT_HTTP \
    logseq-client \
    y \
    y \
    y \
    y \
    y)"
  run_manager "$sandbox" "$input" \
    'MOCK_DOCKER_FAIL_ONCE_PATTERN= up -d --build'
  assert_failure || return 1
  assert_not_contains "$(<"$sandbox/docker.log")" 'rm --stop --force caddy'
  assert_managed_configuration_matches "$original_dir" "$sandbox/install" || return 1
  assert_contains "$last_output" 'the previous working deployment was restored'
  assert_contains "$(<"$sandbox/docker.log")" '--profile https up -d --force-recreate'
}

test_https_reconfiguration_restores_after_service_health_failure() {
  local sandbox input original_dir
  sandbox="$(make_sandbox)"
  mkdir -p "$sandbox/install"
  cp "$test_dir/compose.yaml" "$sandbox/install/compose.yaml"
  cp "$test_dir/compose.http.yaml" "$sandbox/install/compose.http.yaml"
  printf 'https://old-sync.example.com {\n\treverse_proxy sync:8080\n}\n' \
    > "$sandbox/install/Caddyfile"
  cat > "$sandbox/install/.env" <<EOF
LOGSEQ_SYNC_SOURCE_DIR=/old/source
LOGSEQ_SYNC_INSTALL_DIR=$sandbox/install
LOGSEQ_SYNC_DATA_DIR=$sandbox/data
LOGSEQ_SYNC_UID=1000
LOGSEQ_SYNC_GID=1000
LOGSEQ_SYNC_ENDPOINT_MODE=https
DB_SYNC_BASE_URL=https://old-sync.example.com
DB_SYNC_BIND_ADDRESS=127.0.0.1
DB_SYNC_PUBLIC_PORT=443
DB_SYNC_LOG_LEVEL=info
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8
COGNITO_CLIENT_ID=69cs1lgme7p8kbgld8n5kseii6
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8/.well-known/jwks.json
EOF
  original_dir="$sandbox/original"
  mkdir -p "$original_dir"
  cp -a "$sandbox/install/." "$original_dir/"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    new-sync.example.com \
    logseq-client \
    y \
    y \
    y \
    y \
    y)"
  run_manager "$sandbox" "$input" MOCK_DOCKER_UNHEALTHY_UNTIL_ROLLBACK=1
  assert_failure || return 1
  assert_managed_configuration_matches "$original_dir" "$sandbox/install" || return 1
  assert_contains "$last_output" 'the previous working deployment was restored'
}

test_https_reconfiguration_restores_after_public_health_failure() {
  local sandbox input original_dir
  sandbox="$(make_sandbox)"
  mkdir -p "$sandbox/install"
  cp "$test_dir/compose.yaml" "$sandbox/install/compose.yaml"
  cp "$test_dir/compose.http.yaml" "$sandbox/install/compose.http.yaml"
  printf 'https://old-sync.example.com {\n\treverse_proxy sync:8080\n}\n' \
    > "$sandbox/install/Caddyfile"
  cat > "$sandbox/install/.env" <<EOF
LOGSEQ_SYNC_SOURCE_DIR=/old/source
LOGSEQ_SYNC_INSTALL_DIR=$sandbox/install
LOGSEQ_SYNC_DATA_DIR=$sandbox/data
LOGSEQ_SYNC_UID=1000
LOGSEQ_SYNC_GID=1000
LOGSEQ_SYNC_ENDPOINT_MODE=https
DB_SYNC_BASE_URL=https://old-sync.example.com
DB_SYNC_BIND_ADDRESS=127.0.0.1
DB_SYNC_PUBLIC_PORT=443
DB_SYNC_LOG_LEVEL=info
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8
COGNITO_CLIENT_ID=69cs1lgme7p8kbgld8n5kseii6
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8/.well-known/jwks.json
EOF
  original_dir="$sandbox/original"
  mkdir -p "$original_dir"
  cp -a "$sandbox/install/." "$original_dir/"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    new-sync.example.com \
    logseq-client \
    y \
    y \
    y \
    y \
    y)"
  run_manager "$sandbox" "$input" \
    'MOCK_CURL_FAIL_PATTERN=https://new-sync.example.com/health'
  assert_failure || return 1
  assert_managed_configuration_matches "$original_dir" "$sandbox/install" || return 1
  assert_contains "$last_output" 'the previous working deployment was restored'
  assert_contains "$(<"$sandbox/curl.log")" 'https://old-sync.example.com/health'
}

test_configuration_activation_failure_restores_previous_deployment() {
  local sandbox input original_dir
  sandbox="$(make_sandbox)"
  mkdir -p "$sandbox/install"
  cp "$test_dir/compose.yaml" "$sandbox/install/compose.yaml"
  cp "$test_dir/compose.http.yaml" "$sandbox/install/compose.http.yaml"
  printf 'https://old-sync.example.com {\n\treverse_proxy sync:8080\n}\n' \
    > "$sandbox/install/Caddyfile"
  cat > "$sandbox/install/.env" <<EOF
LOGSEQ_SYNC_SOURCE_DIR=/old/source
LOGSEQ_SYNC_INSTALL_DIR=$sandbox/install
LOGSEQ_SYNC_DATA_DIR=$sandbox/data
LOGSEQ_SYNC_UID=1000
LOGSEQ_SYNC_GID=1000
LOGSEQ_SYNC_ENDPOINT_MODE=https
DB_SYNC_BASE_URL=https://old-sync.example.com
DB_SYNC_BIND_ADDRESS=127.0.0.1
DB_SYNC_PUBLIC_PORT=443
DB_SYNC_LOG_LEVEL=info
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8
COGNITO_CLIENT_ID=69cs1lgme7p8kbgld8n5kseii6
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8/.well-known/jwks.json
EOF
  original_dir="$sandbox/original"
  mkdir -p "$original_dir"
  cp -a "$sandbox/install/." "$original_dir/"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    new-sync.example.com \
    logseq-client \
    y \
    y \
    y \
    y \
    y)"
  run_manager "$sandbox" "$input" 'MOCK_MV_FAIL_ONCE_PATTERN=/.env '
  assert_failure || return 1
  assert_managed_configuration_matches "$original_dir" "$sandbox/install" || return 1
  assert_contains "$last_output" 'the previous working deployment was restored'
  assert_contains "$(<"$sandbox/docker.log")" '--profile https up -d --force-recreate'
  assert_not_contains "$(<"$sandbox/docker.log")" ' up -d --build'
}

test_https_setup_force_recreates_caddy() {
  local sandbox input
  sandbox="$(make_sandbox)"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    sync.example.com \
    logseq-client \
    y)"
  run_manager "$sandbox" "$input"
  assert_success || return 1
  assert_contains "$(<"$sandbox/docker.log")" '--force-recreate'
  assert_contains "$(<"$sandbox/install/.env")" \
    'DB_SYNC_BASE_URL=https://sync.example.com' || return 1
  assert_contains "$(<"$sandbox/install/Caddyfile")" \
    'https://sync.example.com {'
}

test_http_setup_verifies_public_endpoint() {
  local sandbox input
  sandbox="$(make_sandbox)"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    http \
    http://127.0.0.1:18080 \
    I_ACCEPT_HTTP \
    logseq-client \
    y)"
  run_manager "$sandbox" "$input" MOCK_CURL_STATUS=1
  assert_failure || return 1
  assert_contains "$last_output" 'Public endpoint did not return {"ok":true}'
}

test_invalid_http_host_is_rejected() {
  local sandbox input
  sandbox="$(make_sandbox)"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    http \
    http://999.999.999.999:18080)"
  run_manager "$sandbox" "$input"
  assert_failure || return 1
  assert_contains "$last_output" 'HTTP URL must include a valid hostname or IPv4 address and port.'
  [[ ! -e "$sandbox/install" ]]
}

test_invalid_custom_auth_url_is_rejected() {
  local sandbox input
  sandbox="$(make_sandbox)"
  input="$(printf '%s\n' \
    "$sandbox/install" \
    "$sandbox/data" \
    https \
    sync.example.com \
    custom-client \
    https://-)"
  run_manager "$sandbox" "$input"
  assert_failure || return 1
  assert_contains "$last_output" 'Cognito issuer must be a valid HTTPS URL.'
  [[ ! -e "$sandbox/install" ]]
}

test_logs_proxy_maps_to_caddy() {
  local sandbox
  sandbox="$(make_sandbox)"
  mkdir -p "$sandbox/install"
  cat > "$sandbox/install/.env" <<EOF
LOGSEQ_SYNC_ENDPOINT_MODE=https
LOGSEQ_SYNC_SOURCE_DIR=$test_dir/../../..
LOGSEQ_SYNC_INSTALL_DIR=$sandbox/install
LOGSEQ_SYNC_DATA_DIR=$sandbox/data
LOGSEQ_SYNC_UID=1000
LOGSEQ_SYNC_GID=1000
DB_SYNC_BASE_URL=https://sync.example.com:10010
COGNITO_ISSUER=https://issuer.example.com
COGNITO_CLIENT_ID=client
COGNITO_JWKS_URL=https://issuer.example.com/.well-known/jwks.json
EOF
  cp "$test_dir/compose.yaml" "$sandbox/install/compose.yaml"
  set +e
  last_output="$(env \
    HOME="$sandbox/home" \
    PATH="$sandbox/bin:$PATH" \
    MOCK_DOCKER_LOG="$sandbox/docker.log" \
    MOCK_CURL_LOG="$sandbox/curl.log" \
    MOCK_SLEEP_LOG="$sandbox/sleep.log" \
    "$manager" logs proxy "$sandbox/install" 2>&1)"
  last_status=$?
  set -e
  assert_success || return 1
  assert_contains "$(<"$sandbox/docker.log")" 'logs --tail 200 caddy'
}

test_status_uses_one_shot_health_checks() {
  local sandbox health_check_count
  sandbox="$(make_sandbox)"
  mkdir -p "$sandbox/install"
  cat > "$sandbox/install/.env" <<EOF
LOGSEQ_SYNC_ENDPOINT_MODE=http
LOGSEQ_SYNC_SOURCE_DIR=$test_dir/../../..
LOGSEQ_SYNC_INSTALL_DIR=$sandbox/install
LOGSEQ_SYNC_DATA_DIR=$sandbox/data
LOGSEQ_SYNC_UID=1000
LOGSEQ_SYNC_GID=1000
DB_SYNC_BASE_URL=http://127.0.0.1:18080
COGNITO_ISSUER=https://issuer.example.com
COGNITO_CLIENT_ID=client
COGNITO_JWKS_URL=https://issuer.example.com/.well-known/jwks.json
EOF
  cp "$test_dir/compose.yaml" "$sandbox/install/compose.yaml"
  cp "$test_dir/compose.http.yaml" "$sandbox/install/compose.http.yaml"
  set +e
  last_output="$(env \
    HOME="$sandbox/home" \
    PATH="$sandbox/bin:$PATH" \
    MOCK_DOCKER_LOG="$sandbox/docker.log" \
    MOCK_CURL_LOG="$sandbox/curl.log" \
    MOCK_SLEEP_LOG="$sandbox/sleep.log" \
    MOCK_DOCKER_HEALTH=unhealthy \
    "$manager" status "$sandbox/install" 2>&1)"
  last_status=$?
  set -e
  assert_failure || return 1
  health_check_count="$(grep -c 'ps --format json sync' "$sandbox/docker.log")"
  [[ "$health_check_count" -eq 1 ]] || {
    printf 'Expected one health check, got %s:\n%s\n' "$health_check_count" "$(<"$sandbox/docker.log")" >&2
    return 1
  }
}

run_test() {
  local name="$1"
  if "$name"; then
    pass_count=$((pass_count + 1))
    printf 'ok - %s\n' "$name"
  else
    fail_count=$((fail_count + 1))
    printf 'not ok - %s\n' "$name"
  fi
}

run_test test_unhealthy_service_is_rejected
run_test test_health_body_is_verified
run_test test_docker_daemon_is_checked_before_writes
run_test test_first_setup_compose_failure_preserves_staged_configuration
run_test test_existing_configuration_becomes_prompt_defaults
run_test test_https_to_http_removes_caddy_container
run_test test_https_to_http_restores_configuration_when_replacement_fails
run_test test_https_reconfiguration_restores_after_service_health_failure
run_test test_https_reconfiguration_restores_after_public_health_failure
run_test test_configuration_activation_failure_restores_previous_deployment
run_test test_https_setup_force_recreates_caddy
run_test test_http_setup_verifies_public_endpoint
run_test test_invalid_http_host_is_rejected
run_test test_invalid_custom_auth_url_is_rejected
run_test test_logs_proxy_maps_to_caddy
run_test test_status_uses_one_shot_health_checks

printf '%s passed, %s failed\n' "$pass_count" "$fail_count"
[[ "$fail_count" -eq 0 ]]
