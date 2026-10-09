#!/usr/bin/env bash
# Architecture check: shared production code must not depend on browser FFI,
# JS runtime modules, OS threads, or untyped payloads.
# Scopes: src/shared/, src/contracts/, subs/ (portable business/view code).
# Exempt: src/ legacy Melange view code is being migrated feature-by-feature;
# this check guards the layers that must stay portable.
set -u
cd "$(dirname "$0")/.."

fail=0

check() {
  local desc="$1" pattern="$2"
  shift 2
  local hits
  hits=$(grep -rEn --include='*.ml' --include='*.mli' "$pattern" "$@" 2>/dev/null | grep -v '_test\.ml\|/test/\|(\*')
  if [ -n "$hits" ]; then
    echo "FAIL: $desc"
    echo "$hits" | head -15
    fail=1
  fi
}

SHARED_DIRS="src/shared src/contracts subs"

check "Js.* FFI in shared code" '\bJs\.[a-zA-Z]' $SHARED_DIRS
check "Webapi/Web_dom/Browser FFI" '\b(Webapi|Web_dom|Browser_ui|Imperative_dom|Vdom)\.' $SHARED_DIRS
check "OS threads/unix in shared code" '\b(Unix|Thread)\.' $SHARED_DIRS
check "Yojson/raw json in shared code (use Json.t contract)" '\bYojson\.' $SHARED_DIRS
check "Raw DOM event listener registration in shared code" 'add_event_listener|addEventListener|setAttribute[^)]*"on(click|keydown|input|change|blur|focus)' $SHARED_DIRS
check "Platform.* direct calls in shared/contract code (use Ui_services)" '\bPlatform\.' src/contracts subs

if [ "$fail" -eq 0 ]; then
  echo "shared-boundaries: OK"
fi
exit $fail
