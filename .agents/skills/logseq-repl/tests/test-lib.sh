#!/usr/bin/env bash

fail() {
  echo "FAIL: $*" >&2
  return 1
}

assert_file_exists() {
  local path="$1"
  [[ -e "$path" ]] || fail "expected file to exist: $path"
}

assert_not_exists() {
  local path="$1"
  [[ ! -e "$path" ]] || fail "expected path to be absent: $path"
}

assert_contains() {
  local needle="$1"
  local haystack_file="$2"
  if ! grep -Fq "$needle" "$haystack_file"; then
    echo "Expected to find: $needle" >&2
    echo "--- file: $haystack_file ---" >&2
    cat "$haystack_file" >&2
    echo "----------------------------" >&2
    return 1
  fi
}

assert_not_contains_text() {
  local needle="$1"
  local file="$2"
  if grep -Fq "$needle" "$file"; then
    echo "Did not expect to find: $needle" >&2
    echo "--- file: $file ---" >&2
    cat "$file" >&2
    echo "--------------------" >&2
    return 1
  fi
}

assert_not_matches() {
  local pattern="$1"
  local file="$2"
  if grep -Eq "$pattern" "$file"; then
    echo "Did not expect regex match: $pattern" >&2
    echo "--- file: $file ---" >&2
    cat "$file" >&2
    echo "--------------------" >&2
    return 1
  fi
}

assert_equals() {
  local expected="$1"
  local actual="$2"
  [[ "$expected" == "$actual" ]] || fail "expected '$expected' but got '$actual'"
}

portable_path_pattern() {
  local slash='/'
  local windows_drive='[A-Za-z]:\\[^[:space:]]+'
  printf '%s' "${slash}Users${slash}[^[:space:]]+|${slash}home${slash}[^[:space:]]+|${windows_drive}"
}

run_test() {
  local name="$1"
  local fn="$2"

  local status
  set +e
  (set -e; "$fn")
  status=$?
  set -e

  if [[ "$status" -eq 0 ]]; then
    echo "PASS: $name"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "FAIL: $name" >&2
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}
