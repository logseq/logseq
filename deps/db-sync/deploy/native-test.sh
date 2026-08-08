#!/usr/bin/env bash
set -euo pipefail

readonly test_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly manager="$test_dir/logseq-sync-native"
readonly suite_tmp="$(mktemp -d "${TMPDIR:-/tmp}/logseq-sync-native-test.XXXXXX")"
manager_under_test="$manager"

cleanup() {
  if [[ -d "$suite_tmp" && "$suite_tmp" == *logseq-sync-native-test.* ]]; then
    rm -rf -- "$suite_tmp"
  fi
}

trap cleanup EXIT

pass_count=0
fail_count=0

make_sandbox() {
  local sandbox
  sandbox="$(mktemp -d "$suite_tmp/case.XXXXXX")"
  mkdir -p "$sandbox/bin" "$sandbox/install/toolchain/node/bin" \
    "$sandbox/install/toolchain/bin"

  cat > "$sandbox/bin/uname" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -s) printf 'Linux\n' ;;
  -m) printf 'x86_64\n' ;;
  *) printf 'Linux\n' ;;
esac
EOF

  cat > "$sandbox/bin/clojure" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

  cat > "$sandbox/bin/java" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

  cat > "$sandbox/bin/getent" <<'EOF'
#!/usr/bin/env bash
if [[ "$1" == "passwd" ]]; then
  printf '%s:x:0:0:test:/tmp:/bin/sh\n' "$2"
  exit 0
fi
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
printf '%s' '{"ok":true}'
EOF

  cat > "$sandbox/bin/systemctl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_SYSTEMCTL_LOG"
exit 0
EOF

  cat > "$sandbox/bin/journalctl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_JOURNAL_LOG"
exit 0
EOF

  cat > "$sandbox/install/toolchain/node/bin/node" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

  cat > "$sandbox/install/toolchain/bin/caddy" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_CADDY_LOG"
exit 0
EOF

  cat > "$sandbox/install/toolchain/bin/pnpm" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_PNPM_LOG"
workdir=""
while (( $# > 0 )); do
  if [[ "$1" == "--dir" ]]; then
    workdir="$2"
    shift 2
    continue
  fi
  case "$1" in
    install)
      mkdir -p "$workdir/node_modules"
      ;;
    build:node-adapter)
      mkdir -p "$workdir/worker/dist"
      printf 'mock adapter\n' > "$workdir/worker/dist/node-adapter.js"
      ;;
  esac
  shift
done
EOF

  chmod +x "$sandbox/bin/"* "$sandbox/install/toolchain/node/bin/node" \
    "$sandbox/install/toolchain/bin/caddy" "$sandbox/install/toolchain/bin/pnpm"
  printf '%s' "$sandbox"
}

run_manager() {
  local sandbox="$1"
  shift
  set +e
  last_output="$(printf '%s' "${MOCK_MANAGER_INPUT:-}" | env \
    PATH="$sandbox/bin:$PATH" \
    LOGSEQ_SYNC_TEST_MODE=true \
    LOGSEQ_SYNC_ASSUME_YES="${MOCK_ASSUME_YES:-true}" \
    LOGSEQ_SYNC_INSTALL_ROOT="$sandbox/install" \
    LOGSEQ_SYNC_CONFIG_DIR="$sandbox/config" \
    LOGSEQ_SYNC_DATA_DIR="$sandbox/data" \
    LOGSEQ_SYNC_SYSTEMD_DIR="$sandbox/systemd" \
    LOGSEQ_SYNC_CADDY_DATA_DIR="$sandbox/caddy-data" \
    LOGSEQ_SYNC_MANAGER_PATH="$sandbox/bin/logseq-sync-native-installed" \
    MOCK_CURL_LOG="$sandbox/curl.log" \
    MOCK_SYSTEMCTL_LOG="$sandbox/systemctl.log" \
    MOCK_JOURNAL_LOG="$sandbox/journal.log" \
    MOCK_CADDY_LOG="$sandbox/caddy.log" \
    MOCK_PNPM_LOG="$sandbox/pnpm.log" \
    MOCK_DNS_STATUS="${MOCK_DNS_STATUS:-0}" \
    MOCK_DNS_IP="${MOCK_DNS_IP:-203.0.113.10}" \
    "$manager_under_test" "$@" 2>&1)"
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

run_system_package_install() {
  local sandbox="$1"
  local distribution_id="$2"
  local distribution_like="$3"
  local distribution_name="$4"
  local available_java="$5"
  local package_manager="${6:-dnf}"
  printf 'ID=%s\nID_LIKE="%s"\nPRETTY_NAME="%s"\n' \
    "$distribution_id" "$distribution_like" "$distribution_name" \
    > "$sandbox/os-release"
  set +e
  (
    source "$manager" help >/dev/null
    mock_package_manager() {
      printf '%s\n' "$*" >> "$sandbox/packages.log"
      case "$*" in
        '-y makecache'|install\ -y\ *) return 0 ;;
        "-q list --available $available_java"|"-q list available $available_java")
          return 0
          ;;
        *) return 1 ;;
      esac
    }
    if [[ "$package_manager" == "dnf" ]]; then
      dnf() { mock_package_manager "$@"; }
    else
      yum() { mock_package_manager "$@"; }
    fi
    ensure_system_packages "$sandbox/os-release"
  ) > "$sandbox/system-packages-output.log" 2>&1
  last_status=$?
  last_output="$(<"$sandbox/system-packages-output.log")"
  set -e
}

test_rpm_distribution_installs_system_dependencies_with_dnf() {
  local sandbox package_log
  sandbox="$(make_sandbox)"
  run_system_package_install "$sandbox" rocky 'rhel centos fedora' \
    'Rocky Linux 9.6' java-21-openjdk-headless
  assert_success || return 1
  package_log="$(<"$sandbox/packages.log")"
  assert_contains "$last_output" 'Detected operating system: Rocky Linux 9.6' || return 1
  assert_contains "$package_log" '-y makecache' || return 1
  assert_contains "$package_log" '-q list --available java-21-openjdk-headless' || return 1
  assert_contains "$package_log" 'install -y gcc gcc-c++ make' || return 1
  assert_contains "$package_log" 'java-21-openjdk-headless' || return 1
  assert_contains "$package_log" 'shadow-utils'
}

test_amazon_linux_uses_corretto_21() {
  local sandbox package_log
  sandbox="$(make_sandbox)"
  run_system_package_install "$sandbox" amzn fedora \
    'Amazon Linux 2023.7' java-21-amazon-corretto-headless
  assert_success || return 1
  package_log="$(<"$sandbox/packages.log")"
  assert_contains "$last_output" 'Detected operating system: Amazon Linux 2023.7' || return 1
  assert_contains "$package_log" '-q list --available java-21-amazon-corretto-headless' || return 1
  assert_contains "$package_log" 'java-21-amazon-corretto-headless'
}

test_opencloudos_falls_back_to_kona_17() {
  local sandbox package_log
  sandbox="$(make_sandbox)"
  run_system_package_install "$sandbox" opencloudos opencloudos \
    'OpenCloudOS 9.4' java-17-konajdk
  assert_success || return 1
  package_log="$(<"$sandbox/packages.log")"
  assert_contains "$last_output" 'Detected operating system: OpenCloudOS 9.4' || return 1
  assert_contains "$package_log" '-q list --available java-21-openjdk-headless' || return 1
  assert_contains "$package_log" '-q list --available java-17-konajdk' || return 1
  assert_contains "$package_log" 'java-17-konajdk'
}

test_rpm_distribution_can_install_with_yum() {
  local sandbox package_log
  sandbox="$(make_sandbox)"
  run_system_package_install "$sandbox" tencentos 'rhel centos fedora' \
    'TencentOS Server 3.1' java-21-openjdk-headless yum
  assert_success || return 1
  package_log="$(<"$sandbox/packages.log")"
  assert_contains "$last_output" 'Detected operating system: TencentOS Server 3.1' || return 1
  assert_contains "$package_log" '-q list available java-21-openjdk-headless' || return 1
  assert_contains "$package_log" 'install -y gcc gcc-c++ make'
}

test_setup_uses_public_10010_and_private_10011() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" \
    'DB_SYNC_BASE_URL=https://sync.example.com:10010' || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'LOGSEQ_SYNC_PUBLIC_PORT=10010' || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'LOGSEQ_SYNC_INTERNAL_PORT=10011' || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'DB_SYNC_HOST=127.0.0.1' || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'DB_SYNC_PORT=10011' || return 1
  assert_contains "$(<"$sandbox/config/Caddyfile")" \
    'https://sync.example.com:10010 {' || return 1
  assert_contains "$(<"$sandbox/config/Caddyfile")" \
    'reverse_proxy 127.0.0.1:10011' || return 1
  assert_contains "$(<"$sandbox/systemd/logseq-sync.service")" \
    'EnvironmentFile=' || return 1
  assert_contains "$(<"$sandbox/pnpm.log")" 'install --frozen-lockfile --prod' || return 1
  assert_contains "$(<"$sandbox/pnpm.log")" 'build:node-adapter' || return 1
  assert_contains "$last_output" 'https://sync.example.com:10010'
}

test_setup_without_options_runs_guided_wizard() {
  local sandbox
  sandbox="$(make_sandbox)"
  MOCK_ASSUME_YES=false \
    MOCK_MANAGER_INPUT=$'sync.example.com\n\n\n\n' \
    run_manager "$sandbox" setup
  assert_success || return 1
  assert_contains "$last_output" 'Logseq Sync setup' || return 1
  assert_contains "$last_output" 'Step 1/3 - Sync domain name' || return 1
  assert_contains "$last_output" 'Step 2/3 - Public HTTPS port [10010]' || return 1
  assert_contains "$last_output" 'Step 3/3 - Private Sync port [10011]' || return 1
  assert_contains "$last_output" 'Its public A/AAAA record must already resolve to this server' || return 1
  assert_contains "$last_output" 'Logseq clients connect here using HTTPS' || return 1
  assert_contains "$last_output" 'Do not expose or allow this port' || return 1
  assert_contains "$last_output" 'DNS: sync.example.com -> 203.0.113.10' || return 1
  assert_contains "$last_output" 'https://sync.example.com:10010'
}

test_setup_rejects_ambiguous_positional_arguments() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup sync.example.com
  assert_failure || return 1
  assert_contains "$last_output" 'Unknown setup option' || return 1
  assert_contains "$last_output" 'Use --domain, --public-port, --internal-port, or --yes'
}

test_setup_accepts_custom_public_port() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com --public-port 12000
  assert_success || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" \
    'DB_SYNC_BASE_URL=https://sync.example.com:12000' || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'LOGSEQ_SYNC_PUBLIC_PORT=12000' || return 1
  assert_contains "$(<"$sandbox/config/Caddyfile")" \
    'https://sync.example.com:12000 {' || return 1
  assert_contains "$last_output" 'https://sync.example.com:12000'
}

test_setup_accepts_custom_private_port() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com \
    --public-port 12000 --internal-port 13000
  assert_success || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'LOGSEQ_SYNC_INTERNAL_PORT=13000' || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'DB_SYNC_PORT=13000' || return 1
  assert_contains "$(<"$sandbox/config/Caddyfile")" \
    'reverse_proxy 127.0.0.1:13000' || return 1
  assert_contains "$last_output" 'Private adapter: 127.0.0.1:13000'
}

test_public_port_never_collides_with_private_port() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com --public-port 10011
  assert_success || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'LOGSEQ_SYNC_PUBLIC_PORT=10011' || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'LOGSEQ_SYNC_INTERNAL_PORT=10012' || return 1
  assert_contains "$(<"$sandbox/config/sync.env")" 'DB_SYNC_PORT=10012'
}

test_setup_rejects_duplicate_public_and_private_ports() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com \
    --public-port 12000 --internal-port 12000
  assert_failure || return 1
  [[ ! -e "$sandbox/config" ]] || return 1
  assert_contains "$last_output" 'must be different'
}

test_port_80_is_reserved_for_certificates() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com --public-port 80
  assert_failure || return 1
  [[ ! -e "$sandbox/config" ]] || return 1
  assert_contains "$last_output" 'port 80 is reserved'
}

test_default_auth_is_generated_without_prompts() {
  local sandbox env_file
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  env_file="$(<"$sandbox/config/sync.env")"
  assert_contains "$env_file" \
    'COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8' || return 1
  assert_contains "$env_file" 'COGNITO_CLIENT_ID=69cs1lgme7p8kbgld8n5kseii6'
}

test_invalid_domain_stops_before_writes() {
  local sandbox
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain 'https://sync.example.com'
  assert_failure || return 1
  [[ ! -e "$sandbox/config" ]] || return 1
  assert_contains "$last_output" 'Enter a valid DNS domain name'
}

test_unresolved_domain_stops_before_writes() {
  local sandbox
  sandbox="$(make_sandbox)"
  MOCK_DNS_STATUS=1 run_manager "$sandbox" setup --domain sync.example.com
  assert_failure || return 1
  [[ ! -e "$sandbox/config" ]] || return 1
  assert_contains "$last_output" 'domain does not currently resolve'
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
  [[ "$curl_count" -eq 2 ]] || {
    printf 'Expected two status probes, got %s.\n' "$curl_count" >&2
    return 1
  }
  assert_contains "$last_output" 'Health: ok'
}

test_update_preserves_configuration_and_switches_release() {
  local sandbox before_env before_release after_release
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com
  assert_success || return 1
  before_env="$(<"$sandbox/config/sync.env")"
  before_release="$(readlink "$sandbox/install/current")"
  run_manager "$sandbox" update
  assert_success || return 1
  after_release="$(readlink "$sandbox/install/current")"
  [[ "$before_release" != "$after_release" ]] || {
    printf 'Expected update to switch releases, both were %s.\n' "$before_release" >&2
    return 1
  }
  [[ "$before_env" == "$(<"$sandbox/config/sync.env")" ]] || {
    printf 'Expected update to preserve sync.env.\n' >&2
    return 1
  }
  assert_contains "$last_output" 'was updated successfully'
}

test_installed_manager_can_rerun_setup() {
  local sandbox installed_manager
  sandbox="$(make_sandbox)"
  run_manager "$sandbox" setup --domain sync.example.com --public-port 12000
  assert_success || return 1
  installed_manager="$sandbox/bin/logseq-sync-native-installed"
  [[ -x "$installed_manager" ]] || return 1
  manager_under_test="$installed_manager"
  run_manager "$sandbox" setup --domain sync.example.com
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

run_test test_setup_uses_public_10010_and_private_10011
run_test test_rpm_distribution_installs_system_dependencies_with_dnf
run_test test_amazon_linux_uses_corretto_21
run_test test_opencloudos_falls_back_to_kona_17
run_test test_rpm_distribution_can_install_with_yum
run_test test_setup_without_options_runs_guided_wizard
run_test test_setup_rejects_ambiguous_positional_arguments
run_test test_setup_accepts_custom_public_port
run_test test_setup_accepts_custom_private_port
run_test test_public_port_never_collides_with_private_port
run_test test_setup_rejects_duplicate_public_and_private_ports
run_test test_port_80_is_reserved_for_certificates
run_test test_default_auth_is_generated_without_prompts
run_test test_invalid_domain_stops_before_writes
run_test test_unresolved_domain_stops_before_writes
run_test test_status_checks_private_and_public_endpoints_once
run_test test_update_preserves_configuration_and_switches_release
run_test test_installed_manager_can_rerun_setup

printf '%s passed, %s failed\n' "$pass_count" "$fail_count"
[[ "$fail_count" -eq 0 ]]
