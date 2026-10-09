#!/usr/bin/env bash
# Architecture check: shared production code must not depend on browser FFI,
# JS runtime modules, OS threads, or untyped payloads.
# Scopes: src/shared/, src/contracts/, subs/ (portable business/view code).
# Exempt: src/ legacy Melange view code is being migrated feature-by-feature;
# this check guards the layers that must stay portable.
set -u
SELF="$(cd "$(dirname "$0")" && pwd)"
# dune copies this script into _build/default/scripts as a dep; map back
# to the source tree so the scan runs against real sources, not _build.
case "$SELF" in
  */_build/*) SELF="${SELF%%/_build/*}" ;;  # build mirror: SELF is deps/ui
esac
# in-place SELF is deps/ui/scripts -> parent; build-mirror SELF is deps/ui
case "$SELF" in
  */scripts) cd "$SELF/.." || exit 1 ;;
  *) cd "$SELF" || exit 1 ;;
esac

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

# Pending-transport-bridge exceptions (tracked, must shrink to zero):
#  - subs/promise_ext.ml: Js.Promise let*-syntax still opened by ~15 src files
#  - subs/subs_state.ml task_of_promise/promise_of_task: boundary adapters while
#    worker/sdk call sites still produce Js.Promise
# strip OCaml comments first so doc prose can't false-positive
strip_comments() {
  awk '{
    line=$0
    while (1) {
      if (depth>0) {
        if (match(line,/\*\)/)) { depth--; line=substr(line,RSTART+RLENGTH); continue }
        line=""
        break
      } else {
        if (match(line,/\(\*/)) { depth++; line=substr(line,1,RSTART-1) substr(line,RSTART+RLENGTH); continue }
        break
      }
    }
    if (line != "") print FNR ":" line
    next
  }' "$@"
}
hits=$(find $SHARED_DIRS -name '*.ml' -o -name '*.mli' | while read -r f; do strip_comments < "$f" | sed "s|^|$f:|"; done 2>/dev/null \
  | grep -E '\bJs\.[a-zA-Z]' \
  | grep -v '_test\.ml\|/test/' \
  | grep -v 'subs/promise_ext\.ml' \
  | grep -v 'subs/subs_state\.ml:.*Js\.Promise')
if [ -n "$hits" ]; then
  echo "FAIL: Js.* FFI in shared code"
  echo "$hits" | head -15
  fail=1
fi
check "Webapi/Web_dom/Browser FFI" '\b(Webapi|Web_dom|Browser_ui|Imperative_dom|Vdom)\.' $SHARED_DIRS
check "OS threads/unix in shared code" '\b(Unix|Thread)\.' $SHARED_DIRS
check "Yojson/raw json in shared code (use Json.t contract)" '\bYojson\.' $SHARED_DIRS
check "Raw DOM event listener registration in shared code" 'add_event_listener|addEventListener|setAttribute[^)]*"on(click|keydown|input|change|blur|focus)' $SHARED_DIRS
# Accepted residuals: module-init reads evaluated before any service install can run
# (i18n preferred-lang, Model.initial sidebar state) — excluded below.
hits=$(grep -rEn --include='*.ml' '\bPlatform\.' src/contracts src/shared subs 2>/dev/null \
  | grep -v 'local_storage_get "ls-left-sidebar-open?"\|local_storage_get "ls-left-sidebar-width"')
if [ -n "$hits" ]; then
  echo "FAIL: Platform.* direct calls in shared/contract code (use Ui_services)"
  echo "$hits" | head -15
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "shared-boundaries: OK"
fi
exit $fail
