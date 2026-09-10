#!/usr/bin/env bash
set -euo pipefail

test_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly test_dir
readonly manager="$test_dir/logseq-sync-native"
suite_tmp="$(mktemp -d "${TMPDIR:-/tmp}/logseq-sync-native-test.XXXXXX")"
readonly suite_tmp
manager_under_test="$manager"
pass_count=0
fail_count=0

cleanup() {
  if [[ -d "$suite_tmp" && "$suite_tmp" == *logseq-sync-native-test.* ]]; then
    rm -rf -- "$suite_tmp"
  fi
}
trap cleanup EXIT

make_runtime_fixture() {
  local sandbox="$1"
  local version="${2:-runtime-v1}"
  local fixture="$sandbox/runtime-fixture/logseq-sync-runtime"
  local asset="$sandbox/logseq-sync-runtime-linux-x64.tar.gz"
  rm -rf -- "$sandbox/runtime-fixture"
  mkdir -p "$fixture/node/bin" "$fixture/app/node_modules" "$fixture/bin"
  cat > "$fixture/node/bin/node" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == "--version" ]]; then
  printf 'v24.0.0\n'
fi
if [[ "${1:-}" == "-e" ]]; then
  exit "${MOCK_SQLITE_STATUS:-0}"
fi
exit 0
EOF
  printf 'mock adapter\n' > "$fixture/app/node-adapter.js"
  cp "$manager" "$fixture/bin/logseq-sync-native"
  printf '# fixture-manager=%s\n' "$version" >> "$fixture/bin/logseq-sync-native"
  printf '%s\n' "$version" > "$fixture/VERSION"
  printf 'x64\n' > "$fixture/ARCHITECTURE"
  chmod +x "$fixture/node/bin/node" "$fixture/bin/logseq-sync-native"
  tar -czf "$asset" -C "$sandbox/runtime-fixture" logseq-sync-runtime
  (cd "$sandbox" && sha256sum "$(basename "$asset")" > "$(basename "$asset").sha256")
}

make_caddy_fixture() {
  local sandbox="$1"
  local fixture="$sandbox/caddy-fixture"
  local asset="$sandbox/caddy_2.11.4_linux_amd64.tar.gz"
  mkdir -p "$fixture"
  cp "$sandbox/home/bin/caddy" "$fixture/caddy"
  printf 'test license\n' > "$fixture/LICENSE"
  printf 'test readme\n' > "$fixture/README.md"
  tar -czf "$asset" -C "$fixture" caddy LICENSE README.md
  sha512sum "$asset" | awk '{print $1}' > "$asset.sha512"
}

make_sandbox() {
  local sandbox
  sandbox="$(mktemp -d "$suite_tmp/case.XXXXXX")"
  mkdir -p "$sandbox/bin" "$sandbox/home/bin"

  cat > "$sandbox/bin/uname" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -s) printf 'Linux\n' ;;
  -m) printf 'x86_64\n' ;;
  *) printf 'Linux\n' ;;
esac
EOF

  cat > "$sandbox/bin/getent" <<'EOF'
#!/usr/bin/env bash
if [[ "$1" == "ahosts" ]]; then
  [[ "${MOCK_DNS_STATUS:-0}" -eq 0 ]] || exit "$MOCK_DNS_STATUS"
  printf '%s STREAM %s\n' "${MOCK_DNS_IP:-203.0.113.10}" "$2"
  exit 0
fi
exit 1
EOF

  cat > "$sandbox/bin/curl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_CURL_LOG"
curl_call_count=0
if [[ -f "$MOCK_CURL_COUNT_FILE" ]]; then
  curl_call_count="$(<"$MOCK_CURL_COUNT_FILE")"
fi
curl_call_count=$((curl_call_count + 1))
printf '%s\n' "$curl_call_count" > "$MOCK_CURL_COUNT_FILE"
if (( curl_call_count <= MOCK_CURL_FAILURES )); then
  exit 22
fi
if (( MOCK_CURL_FAIL_FROM > 0 \
      && curl_call_count >= MOCK_CURL_FAIL_FROM \
      && curl_call_count <= MOCK_CURL_FAIL_THROUGH )); then
  exit 22
fi
printf '%s' '{"ok":true}'
EOF

  cat > "$sandbox/bin/systemctl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_SYSTEMCTL_LOG"
systemctl_call_count=0
if [[ -f "$MOCK_SYSTEMCTL_COUNT_FILE" ]]; then
  systemctl_call_count="$(<"$MOCK_SYSTEMCTL_COUNT_FILE")"
fi
systemctl_call_count=$((systemctl_call_count + 1))
printf '%s\n' "$systemctl_call_count" > "$MOCK_SYSTEMCTL_COUNT_FILE"
if (( MOCK_SYSTEMCTL_FAIL_CALL > 0 \
      && systemctl_call_count == MOCK_SYSTEMCTL_FAIL_CALL )); then
  exit 1
fi
exit 0
EOF

  cat > "$sandbox/bin/journalctl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_JOURNAL_LOG"
exit 0
EOF

  cat > "$sandbox/bin/sleep" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

  cat > "$sandbox/home/bin/caddy" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_CADDY_LOG"
if [[ "${1:-}" == "version" ]]; then
  printf 'v2.11.4 test-build\n'
fi
exit 0
EOF

  chmod +x "$sandbox/bin/"* "$sandbox/home/bin/caddy"
  make_runtime_fixture "$sandbox"
  make_caddy_fixture "$sandbox"
  printf '%s' "$sandbox"
}

run_manager() {
  local sandbox="$1"
  shift
  last_output="$(printf '%s' "${MOCK_MANAGER_INPUT:-}" | env \
    PATH="$sandbox/bin:$PATH" \
    LOGSEQ_SYNC_TEST_MODE=true \
    LOGSEQ_SYNC_ASSUME_YES="${MOCK_ASSUME_YES:-true}" \
    LOGSEQ_SYNC_HOME="${MOCK_SYNC_HOME-$sandbox/home}" \
    LOGSEQ_SYNC_SYSTEMD_DIR="$sandbox/systemd" \
    LOGSEQ_SYNC_MANAGER_PATH="$sandbox/bin/logseq-sync-native-installed" \
    LOGSEQ_SYNC_RELEASE_REPOSITORY="example/logseq" \
    LOGSEQ_SYNC_RUNTIME_ARCHIVE="$sandbox/logseq-sync-runtime-linux-x64.tar.gz" \
    LOGSEQ_SYNC_RUNTIME_CHECKSUM="$sandbox/logseq-sync-runtime-linux-x64.tar.gz.sha256" \
    LOGSEQ_SYNC_CADDY_ARCHIVE="$sandbox/caddy_2.11.4_linux_amd64.tar.gz" \
    LOGSEQ_SYNC_CADDY_SHA512="${MOCK_CADDY_SHA512:-$(<"$sandbox/caddy_2.11.4_linux_amd64.tar.gz.sha512")}" \
    MOCK_CURL_LOG="$sandbox/curl.log" \
    MOCK_CURL_COUNT_FILE="$sandbox/curl-count" \
    MOCK_CURL_FAILURES="${MOCK_CURL_FAILURES:-0}" \
    MOCK_CURL_FAIL_FROM="${MOCK_CURL_FAIL_FROM:-0}" \
    MOCK_CURL_FAIL_THROUGH="${MOCK_CURL_FAIL_THROUGH:-0}" \
    MOCK_SYSTEMCTL_LOG="$sandbox/systemctl.log" \
    MOCK_SYSTEMCTL_COUNT_FILE="$sandbox/systemctl-count" \
    MOCK_SYSTEMCTL_FAIL_CALL="${MOCK_SYSTEMCTL_FAIL_CALL:-0}" \
    MOCK_JOURNAL_LOG="$sandbox/journal.log" \
    MOCK_CADDY_LOG="$sandbox/caddy.log" \
    MOCK_DNS_STATUS="${MOCK_DNS_STATUS:-0}" \
    MOCK_DNS_IP="${MOCK_DNS_IP:-203.0.113.10}" \
    MOCK_SQLITE_STATUS="${MOCK_SQLITE_STATUS:-0}" \
    "$manager_under_test" "$@" 2>&1)"
  last_status=$?
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

test_setup_uses_prebuilt_runtime_and_default_ports() {
  local sandbox env_file service_file proxy_service_file
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  env_file="$(<"$sandbox/home/config/sync.env")"
  service_file="$(<"$sandbox/systemd/logseq-sync.service")"
  proxy_service_file="$(<"$sandbox/systemd/logseq-sync-caddy.service")"
  assert_contains "$env_file" 'DB_SYNC_BASE_URL=https://sync.example.com' || return 1
  assert_contains "$env_file" 'LOGSEQ_SYNC_PUBLIC_PORT=443' || return 1
  assert_contains "$(<"$sandbox/home/config/Caddyfile")" \
    'https://sync.example.com {' || return 1
  assert_contains "$env_file" 'DB_SYNC_PORT=10011' || return 1
  assert_contains "$env_file" 'LOGSEQ_SYNC_RELEASE_REPOSITORY=example/logseq' || return 1
  assert_contains "$env_file" "LOGSEQ_SYNC_HOME=$sandbox/home" || return 1
  assert_contains "$env_file" "DB_SYNC_DATA_DIR=$sandbox/home/data" || return 1
  assert_contains "$service_file" \
    "ExecStart=$sandbox/home/current/node/bin/node $sandbox/home/current/app/node-adapter.js" || return 1
  assert_contains "$proxy_service_file" \
    "ExecStart=$sandbox/home/bin/caddy run" || return 1
  [[ -x "$sandbox/home/bin/logseq-sync-native" ]] || return 1
  [[ -L "$sandbox/bin/logseq-sync-native-installed" ]] || return 1
  assert_not_contains "$env_file" 'LOGSEQ_SYNC_NODE_PATH=' || return 1
  assert_not_contains "$last_output" 'Clojure' || return 1
  assert_contains "$last_output" 'Prepared Sync runtime runtime-v1 with bundled v24.0.0' || return 1
  assert_contains "$last_output" 'Starting Sync Node on 127.0.0.1:10011.' || return 1
  assert_contains "$last_output" \
    'Waiting for the private Sync health check at 127.0.0.1:10011 ready.' || return 1
  assert_contains "$last_output" 'Starting Caddy on public HTTPS port 443.' || return 1
  assert_contains "$last_output" \
    'Caddy will obtain or renew the TLS certificate automatically; this can take a few minutes.' || return 1
  assert_contains "$last_output" \
    'Waiting for the public HTTPS health check at https://sync.example.com ready.'
}

test_setup_prints_progress_during_health_retries() {
  local sandbox
  sandbox="$(make_sandbox)"
  MOCK_CURL_FAILURES=1 run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  assert_contains "$last_output" \
    'Waiting for the private Sync health check at 127.0.0.1:10011. ready.'
}

test_setup_ignores_broken_system_node_and_build_tools() {
  local sandbox
  sandbox="$(make_sandbox)"
  cat > "$sandbox/bin/node" <<'EOF'
#!/usr/bin/env bash
exit 99
EOF
  cat > "$sandbox/bin/java" <<'EOF'
#!/usr/bin/env bash
exit 99
EOF
  cat > "$sandbox/bin/clojure" <<'EOF'
#!/usr/bin/env bash
exit 99
EOF
  chmod +x "$sandbox/bin/node" "$sandbox/bin/java" "$sandbox/bin/clojure"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  assert_contains "$last_output" 'bundled v24.0.0'
}

test_setup_does_not_invoke_os_package_manager() {
  local sandbox
  sandbox="$(make_sandbox)"
  cat > "$sandbox/bin/dnf" <<'EOF'
#!/usr/bin/env bash
printf 'dnf was invoked\n' >&2
exit 91
EOF
  cat > "$sandbox/bin/yum" <<'EOF'
#!/usr/bin/env bash
printf 'yum was invoked\n' >&2
exit 92
EOF
  chmod +x "$sandbox/bin/dnf" "$sandbox/bin/yum"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  assert_not_contains "$last_output" 'was invoked'
}

test_setup_rejects_bad_runtime_checksum() {
  local sandbox
  sandbox="$(make_sandbox)"
  printf '%064d  logseq-sync-runtime-linux-x64.tar.gz\n' 0 \
    > "$sandbox/logseq-sync-runtime-linux-x64.tar.gz.sha256"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  assert_contains "$last_output" 'failed checksum verification'
}

test_setup_installs_checksum_verified_caddy() {
  local sandbox
  sandbox="$(make_sandbox)"
  rm -f -- "$sandbox/home/bin/caddy"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  [[ -x "$sandbox/home/bin/caddy" ]] || return 1
  assert_contains "$last_output" 'Downloading checksum-pinned Caddy 2.11.4'
}

test_setup_rejects_bad_caddy_checksum() {
  local sandbox
  sandbox="$(make_sandbox)"
  rm -f -- "$sandbox/home/bin/caddy"
  MOCK_CADDY_SHA512="$(printf '%0128d' 0)" \
    run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  assert_contains "$last_output" 'Caddy archive failed checksum verification'
}

test_setup_replaces_tampered_caddy() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  printf '# tampered\n' >> "$sandbox/home/bin/caddy"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  assert_contains "$last_output" \
    'installed Caddy binary does not match the pinned release' || return 1
  assert_not_contains "$(<"$sandbox/home/bin/caddy")" '# tampered'
}

test_setup_rejects_wrong_runtime_architecture() {
  local sandbox fixture asset
  sandbox="$(make_sandbox)"
  fixture="$sandbox/runtime-fixture/logseq-sync-runtime"
  asset="$sandbox/logseq-sync-runtime-linux-x64.tar.gz"
  printf 'arm64\n' > "$fixture/ARCHITECTURE"
  tar -czf "$asset" -C "$sandbox/runtime-fixture" logseq-sync-runtime
  (cd "$sandbox" && sha256sum "$(basename "$asset")" > "$(basename "$asset").sha256")
  run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  assert_contains "$last_output" 'architecture does not match'
}

test_setup_rejects_incompatible_sqlite_runtime() {
  local sandbox
  sandbox="$(make_sandbox)"
  MOCK_SQLITE_STATUS=1 run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  [[ ! -e "$sandbox/home/config" ]] || return 1
  assert_contains "$last_output" 'SQLite module cannot run on this server'
}

test_setup_without_options_runs_guided_wizard() {
  local sandbox
  sandbox="$(make_sandbox)"
  MOCK_ASSUME_YES=false MOCK_MANAGER_INPUT=$'sync.example.com\n\n\n\n' \
    run_manager "$sandbox" setup
  assert_success || return 1
  assert_contains "$last_output" 'Logseq Sync setup' || return 1
  assert_contains "$last_output" 'Step 1/3 - Sync domain name' || return 1
  assert_contains "$last_output" 'Step 2/3 - Public HTTPS port [443]' || return 1
  assert_contains "$last_output" 'Step 3/3 - Private Sync port [10011]' || return 1
  assert_contains "$last_output" 'Runtime: prebuilt Linux x64 package'
}

test_guided_setup_accepts_custom_public_port() {
  local sandbox
  sandbox="$(make_sandbox)"
  MOCK_ASSUME_YES=false MOCK_MANAGER_INPUT=$'sync.example.com\n10010\n\n\n' \
    run_manager "$sandbox" setup
  assert_success || return 1
  assert_contains "$(<"$sandbox/home/config/sync.env")" \
    'DB_SYNC_BASE_URL=https://sync.example.com:10010' || return 1
  assert_contains "$(<"$sandbox/home/config/sync.env")" \
    'LOGSEQ_SYNC_PUBLIC_PORT=10010' || return 1
  assert_contains "$(<"$sandbox/home/config/Caddyfile")" \
    'https://sync.example.com:10010 {'
}

test_setup_accepts_custom_ports() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com \
    --public-port 12000 --internal-port 13000
  assert_success || return 1
  assert_contains "$(<"$sandbox/home/config/sync.env")" 'DB_SYNC_PORT=13000' || return 1
  assert_contains "$(<"$sandbox/home/config/Caddyfile")" \
    'https://sync.example.com:12000 {' || return 1
  assert_contains "$(<"$sandbox/home/config/Caddyfile")" \
    'reverse_proxy 127.0.0.1:13000'
}

test_custom_private_port_is_used_by_status() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com \
    --public-port 12000 --internal-port 13000
  assert_success || return 1
  : > "$sandbox/curl.log"
  run_manager "$sandbox" status
  assert_success || return 1
  assert_contains "$(<"$sandbox/curl.log")" \
    'http://127.0.0.1:13000/health' || return 1
  assert_contains "$(<"$sandbox/curl.log")" \
    'https://sync.example.com:12000/health'
}

test_public_port_never_collides_with_private_port() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com --public-port 10011
  assert_success || return 1
  assert_contains "$(<"$sandbox/home/config/sync.env")" 'DB_SYNC_PORT=10012'
}

test_setup_rejects_invalid_port_and_domain_inputs() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain 'https://sync.example.com'
  assert_failure || return 1
  assert_contains "$last_output" 'Enter a valid DNS domain name' || return 1
  run_manager "$sandbox" setup --domain sync.example.com \
    --public-port 12000 --internal-port 12000
  assert_failure || return 1
  assert_contains "$last_output" 'must be different' || return 1
  run_manager "$sandbox" setup --domain sync.example.com --public-port 80
  assert_failure || return 1
  assert_contains "$last_output" 'port 80 is reserved'
}

test_setup_rejects_unsafe_install_path() {
  local sandbox
  sandbox="$(make_sandbox)"
  MOCK_SYNC_HOME="$sandbox/home with space" \
    run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  assert_contains "$last_output" 'Unsafe deployment path'
}

test_setup_rejects_parent_path_segments() {
  local sandbox unsafe_path
  sandbox="$(make_sandbox)"
  for unsafe_path in /opt/.. /var/lib/../.. /srv/x/../../; do
    MOCK_SYNC_HOME="$unsafe_path" \
      run_manager "$sandbox" setup --domain sync.example.com
    assert_failure || return 1
    assert_contains "$last_output" 'Unsafe deployment path' || return 1
  done
}

test_setup_rejects_home_symlink_to_root() {
  local sandbox
  sandbox="$(make_sandbox)"
  rm -rf -- "${sandbox:?}/home"
  ln -s / "$sandbox/home"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  assert_contains "$last_output" 'resolves to an unsafe location' || return 1
  [[ ! -s "$sandbox/systemctl.log" ]]
}

test_setup_rejects_releases_symlink_to_root() {
  local sandbox
  sandbox="$(make_sandbox)"
  ln -s / "$sandbox/home/releases"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  assert_contains "$last_output" 'resolves to an unsafe location' || return 1
  [[ ! -s "$sandbox/systemctl.log" ]]
}

test_setup_does_not_execute_release_symlink_target() {
  local sandbox checksum release_id external_release marker
  sandbox="$(make_sandbox)"
  checksum="$(awk '{print $1}' "$sandbox/logseq-sync-runtime-linux-x64.tar.gz.sha256")"
  release_id="runtime-v1-x64-${checksum:0:12}"
  external_release="$sandbox/external-release"
  marker="$sandbox/external-node-executed"
  mkdir -p "$sandbox/home/releases" "$external_release/node/bin"
  cat > "$external_release/node/bin/node" <<EOF
#!/usr/bin/env bash
touch "$marker"
exit 0
EOF
  /bin/chmod +x "$external_release/node/bin/node"
  ln -s "$external_release" "$sandbox/home/releases/$release_id"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  assert_contains "$last_output" 'Refusing to use an unsafe runtime path' || return 1
  [[ ! -e "$marker" ]]
}

test_status_rejects_missing_persisted_private_port() {
  local sandbox env_file rewritten_env
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  env_file="$sandbox/home/config/sync.env"
  rewritten_env="${env_file}.new"
  sed '/^DB_SYNC_PORT=/d' "$env_file" > "$rewritten_env"
  mv "$rewritten_env" "$env_file"
  run_manager "$sandbox" status
  assert_failure || return 1
  assert_contains "$last_output" 'private Sync port is missing or invalid'
}

test_status_rejects_missing_private_bind_host() {
  local sandbox env_file rewritten_env
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  env_file="$sandbox/home/config/sync.env"
  rewritten_env="${env_file}.new"
  sed '/^DB_SYNC_HOST=/d' "$env_file" > "$rewritten_env"
  mv "$rewritten_env" "$env_file"
  run_manager "$sandbox" status
  assert_failure || return 1
  assert_contains "$last_output" 'private Sync host must be 127.0.0.1'
}

test_status_rejects_missing_release_repository() {
  local sandbox env_file rewritten_env
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  env_file="$sandbox/home/config/sync.env"
  rewritten_env="${env_file}.new"
  sed '/^LOGSEQ_SYNC_RELEASE_REPOSITORY=/d' "$env_file" > "$rewritten_env"
  mv "$rewritten_env" "$env_file"
  run_manager "$sandbox" status
  assert_failure || return 1
  assert_contains "$last_output" 'runtime repository is missing or invalid'
}

test_unresolved_domain_stops_before_install() {
  local sandbox
  sandbox="$(make_sandbox)"
  MOCK_DNS_STATUS=1 run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  [[ ! -e "$sandbox/home/config" ]] || return 1
  [[ ! -e "$sandbox/home/current" ]] || return 1
  assert_contains "$last_output" 'domain does not currently resolve'
}

test_default_auth_is_generated_without_prompts() {
  local sandbox env_file
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  env_file="$(<"$sandbox/home/config/sync.env")"
  assert_contains "$env_file" \
    'COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8' || return 1
  assert_contains "$env_file" 'COGNITO_CLIENT_ID=69cs1lgme7p8kbgld8n5kseii6'
}

test_status_checks_private_and_public_endpoints_once() {
  local sandbox curl_count
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  : > "$sandbox/curl.log"
  run_manager "$sandbox" status
  assert_success || return 1
  curl_count="$(wc -l < "$sandbox/curl.log" | tr -d ' ')"
  [[ "$curl_count" -eq 2 ]] || return 1
  assert_contains "$last_output" 'Runtime version: runtime-v1' || return 1
  assert_contains "$last_output" 'Health: ok'
}

test_update_preserves_configuration_and_switches_release() {
  local sandbox before_env before_release after_release
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  before_env="$(<"$sandbox/home/config/sync.env")"
  before_release="$(readlink "$sandbox/home/current")"
  make_runtime_fixture "$sandbox" runtime-v2
  run_manager "$sandbox" update
  assert_success || return 1
  after_release="$(readlink "$sandbox/home/current")"
  [[ "$before_release" != "$after_release" ]] || return 1
  [[ "$before_env" == "$(<"$sandbox/home/config/sync.env")" ]] || return 1
  assert_contains "$(<"$sandbox/home/bin/logseq-sync-native")" \
    '# fixture-manager=runtime-v2' || return 1
  assert_contains "$last_output" 'Prepared Sync runtime runtime-v2' || return 1
  assert_contains "$last_output" 'was updated successfully'
}

test_update_skips_unchanged_runtime() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  : > "$sandbox/systemctl.log"
  run_manager "$sandbox" update
  assert_success || return 1
  [[ ! -s "$sandbox/systemctl.log" ]] || return 1
  assert_contains "$last_output" 'already up to date'
}

test_setup_repairs_corrupt_current_runtime() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  rm -f -- "$sandbox/home/current/app/node-adapter.js"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  [[ -f "$sandbox/home/current/app/node-adapter.js" ]]
}

test_setup_restores_previous_configuration_on_health_failure() {
  local sandbox before_env before_caddyfile
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  before_env="$(<"$sandbox/home/config/sync.env")"
  before_caddyfile="$(<"$sandbox/home/config/Caddyfile")"
  printf '0\n' > "$sandbox/curl-count"
  MOCK_CURL_FAILURES=30 run_manager "$sandbox" setup \
    --domain other.example.com --public-port 12000 --internal-port 13000
  assert_failure || return 1
  [[ "$(<"$sandbox/home/config/sync.env")" == "$before_env" ]] || return 1
  [[ "$(<"$sandbox/home/config/Caddyfile")" == "$before_caddyfile" ]] || return 1
  assert_contains "$last_output" 'previous working configuration was restored'
}

test_setup_restores_previous_configuration_on_write_failure() {
  local sandbox before_env before_caddyfile before_sync_service before_proxy_service
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  before_env="$(<"$sandbox/home/config/sync.env")"
  before_caddyfile="$(<"$sandbox/home/config/Caddyfile")"
  before_sync_service="$(<"$sandbox/systemd/logseq-sync.service")"
  before_proxy_service="$(<"$sandbox/systemd/logseq-sync-caddy.service")"
  cat > "$sandbox/bin/chmod" <<'EOF'
#!/usr/bin/env bash
for argument in "$@"; do
  if [[ "$argument" == */Caddyfile.new ]]; then
    exit 1
  fi
done
exec /bin/chmod "$@"
EOF
  /bin/chmod +x "$sandbox/bin/chmod"
  run_manager "$sandbox" setup --domain other.example.com \
    --public-port 12000 --internal-port 13000
  assert_failure || return 1
  [[ "$(<"$sandbox/home/config/sync.env")" == "$before_env" ]] || return 1
  [[ "$(<"$sandbox/home/config/Caddyfile")" == "$before_caddyfile" ]] || return 1
  [[ "$(<"$sandbox/systemd/logseq-sync.service")" == "$before_sync_service" ]] || return 1
  [[ "$(<"$sandbox/systemd/logseq-sync-caddy.service")" == "$before_proxy_service" ]] || return 1
  assert_contains "$last_output" \
    'could not write the new configuration; the previous working configuration was restored'
}

test_update_rolls_back_private_health_failure() {
  local sandbox previous_release
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  previous_release="$(readlink "$sandbox/home/current")"
  make_runtime_fixture "$sandbox" runtime-v2
  printf '0\n' > "$sandbox/curl-count"
  MOCK_CURL_FAILURES=30 run_manager "$sandbox" update
  assert_failure || return 1
  [[ "$(readlink "$sandbox/home/current")" == "$previous_release" ]] || return 1
  assert_contains "$(<"$sandbox/home/bin/logseq-sync-native")" \
    '# fixture-manager=runtime-v1' || return 1
  assert_contains "$last_output" 'previous release was restored'
}

test_update_rolls_back_public_health_failure() {
  local sandbox previous_release
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  previous_release="$(readlink "$sandbox/home/current")"
  make_runtime_fixture "$sandbox" runtime-v2
  printf '0\n' > "$sandbox/curl-count"
  MOCK_CURL_FAIL_FROM=2 MOCK_CURL_FAIL_THROUGH=7 \
    run_manager "$sandbox" update
  assert_failure || return 1
  [[ "$(readlink "$sandbox/home/current")" == "$previous_release" ]] || return 1
  assert_contains "$(<"$sandbox/home/bin/logseq-sync-native")" \
    '# fixture-manager=runtime-v1' || return 1
  assert_contains "$last_output" 'previous release was restored'
}

test_update_rolls_back_restart_failure() {
  local sandbox previous_release
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  previous_release="$(readlink "$sandbox/home/current")"
  make_runtime_fixture "$sandbox" runtime-v2
  printf '0\n' > "$sandbox/systemctl-count"
  MOCK_SYSTEMCTL_FAIL_CALL=1 run_manager "$sandbox" update
  assert_failure || return 1
  [[ "$(readlink "$sandbox/home/current")" == "$previous_release" ]] || return 1
  assert_contains "$last_output" 'previous release was restored'
}

test_update_rolls_back_manager_install_failure() {
  local sandbox previous_release
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  previous_release="$(readlink "$sandbox/home/current")"
  make_runtime_fixture "$sandbox" runtime-v2
  cat > "$sandbox/bin/install" <<'EOF'
#!/usr/bin/env bash
last_argument=""
for argument in "$@"; do
  last_argument="$argument"
done
if [[ "$last_argument" == *.new ]]; then
  exit 1
fi
exec /usr/bin/install "$@"
EOF
  chmod +x "$sandbox/bin/install"
  run_manager "$sandbox" update
  assert_failure || return 1
  [[ "$(readlink "$sandbox/home/current")" == "$previous_release" ]] || return 1
  assert_contains "$(<"$sandbox/home/bin/logseq-sync-native")" \
    '# fixture-manager=runtime-v1' || return 1
  assert_contains "$last_output" 'manager update failed'
}

test_update_rolls_back_public_manager_link_failure() {
  local sandbox previous_release
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  previous_release="$(readlink "$sandbox/home/current")"
  make_runtime_fixture "$sandbox" runtime-v2
  unlink "$sandbox/bin/logseq-sync-native-installed"
  mkdir "$sandbox/bin/logseq-sync-native-installed"
  run_manager "$sandbox" update
  assert_failure || return 1
  [[ "$(readlink "$sandbox/home/current")" == "$previous_release" ]] || return 1
  assert_contains "$(<"$sandbox/home/bin/logseq-sync-native")" \
    '# fixture-manager=runtime-v1' || return 1
  assert_contains "$last_output" 'manager update failed'
}

test_update_keeps_only_current_and_previous_releases() {
  local sandbox release_count
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  make_runtime_fixture "$sandbox" runtime-v2
  run_manager "$sandbox" update
  assert_success || return 1
  make_runtime_fixture "$sandbox" runtime-v3
  run_manager "$sandbox" update
  assert_success || return 1
  release_count="$(find "$sandbox/home/releases" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
  [[ "$release_count" -eq 2 ]]
}

test_installed_manager_can_rerun_setup() {
  local sandbox installed_manager
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com --public-port 12000
  assert_success || return 1
  installed_manager="$sandbox/bin/logseq-sync-native-installed"
  [[ -x "$installed_manager" ]] || return 1
  manager_under_test="$installed_manager"
  MOCK_SYNC_HOME="" run_manager "$sandbox" setup --domain sync.example.com
  manager_under_test="$manager"
  assert_success || return 1
  assert_contains "$last_output" 'https://sync.example.com:12000'
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

run_test test_setup_uses_prebuilt_runtime_and_default_ports
run_test test_setup_prints_progress_during_health_retries
run_test test_setup_ignores_broken_system_node_and_build_tools
run_test test_setup_does_not_invoke_os_package_manager
run_test test_setup_rejects_bad_runtime_checksum
run_test test_setup_installs_checksum_verified_caddy
run_test test_setup_rejects_bad_caddy_checksum
run_test test_setup_replaces_tampered_caddy
run_test test_setup_rejects_wrong_runtime_architecture
run_test test_setup_rejects_incompatible_sqlite_runtime
run_test test_setup_without_options_runs_guided_wizard
run_test test_guided_setup_accepts_custom_public_port
run_test test_setup_accepts_custom_ports
run_test test_custom_private_port_is_used_by_status
run_test test_public_port_never_collides_with_private_port
run_test test_setup_rejects_invalid_port_and_domain_inputs
run_test test_setup_rejects_unsafe_install_path
run_test test_setup_rejects_parent_path_segments
run_test test_setup_rejects_home_symlink_to_root
run_test test_setup_rejects_releases_symlink_to_root
run_test test_setup_does_not_execute_release_symlink_target
run_test test_status_rejects_missing_persisted_private_port
run_test test_status_rejects_missing_private_bind_host
run_test test_status_rejects_missing_release_repository
run_test test_unresolved_domain_stops_before_install
run_test test_default_auth_is_generated_without_prompts
run_test test_status_checks_private_and_public_endpoints_once
run_test test_update_preserves_configuration_and_switches_release
run_test test_update_skips_unchanged_runtime
run_test test_setup_repairs_corrupt_current_runtime
run_test test_setup_restores_previous_configuration_on_health_failure
run_test test_setup_restores_previous_configuration_on_write_failure
run_test test_update_rolls_back_private_health_failure
run_test test_update_rolls_back_public_health_failure
run_test test_update_rolls_back_restart_failure
run_test test_update_rolls_back_manager_install_failure
run_test test_update_rolls_back_public_manager_link_failure
run_test test_update_keeps_only_current_and_previous_releases
run_test test_installed_manager_can_rerun_setup

printf '%s passed, %s failed\n' "$pass_count" "$fail_count"
[[ "$fail_count" -eq 0 ]]
