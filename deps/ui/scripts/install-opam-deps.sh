#!/bin/sh
# Minimal OCaml dependencies for the Web UI and native application library.
# Run after deps/db-worker/scripts/install-opam-deps.sh in the selected switch.
set -eu
# CI can provide OPAM_PIN_LOCK with "repo ref sha" lines so the cache key
# and the pins installed in the switch describe the same upstream revisions.
pin_git() {
  package=$1
  pin=$2
  repo_ref=${pin#git+https://github.com/}
  repo=${repo_ref%%#*}
  ref=${repo_ref##*#}
  locked_ref=
  if [ -n "${OPAM_PIN_LOCK:-}" ]; then
    if [ ! -f "$OPAM_PIN_LOCK" ]; then
      echo "OPAM_PIN_LOCK file not found: $OPAM_PIN_LOCK" >&2
      exit 1
    fi
    locked_ref=$(awk -v repo="$repo" -v ref="$ref" '$1 == repo && $2 == ref { print $3; exit }' "$OPAM_PIN_LOCK")
    if [ -z "$locked_ref" ]; then
      echo "Missing pin lock entry for $repo#$ref in $OPAM_PIN_LOCK" >&2
      exit 1
    fi
  fi
  opam pin add -y -n "$package" "git+https://github.com/$repo#${locked_ref:-$ref}"
}
# Set LUI_SOURCE to a local Git checkout when validating a LUI update.
# Commit the source changes first. Git pinning excludes ignored build output;
# path pinning would copy native and browser build caches into the switch.
if [ -n "${LUI_SOURCE:-}" ]; then
  opam pin add --kind=git -y -n lui "$LUI_SOURCE"
else
  opam pin add -y -n lui git+https://github.com/logseq/lui.git#baa3fb6143b813d7783cf34073b26ebe47de334b
fi
opam pin add -y -n ocaml-signal git+https://github.com/logseq/ocaml-signal.git#02e18cdc5e0ad672aa223f638eaa3ba52fc9421e
pin_git rrbvec git+https://github.com/logseq/rrbvec.git#main
pin_git melange-transit-core git+https://github.com/logseq/melange-transit.git#main
pin_git melange-transit-melange git+https://github.com/logseq/melange-transit.git#main
pin_git melange-transit-native git+https://github.com/logseq/melange-transit.git#main
pin_git melange-edn-core git+https://github.com/logseq/melange-edn.git#main
pin_git melange-edn-melange git+https://github.com/logseq/melange-edn.git#main
pin_git melange-edn-native git+https://github.com/logseq/melange-edn.git#main
opam update lui ocaml-signal rrbvec melange-transit-core melange-transit-melange melange-transit-native melange-edn-core melange-edn-melange melange-edn-native
opam upgrade -y lui ocaml-signal rrbvec melange-transit-core melange-transit-melange melange-transit-native melange-edn-core melange-edn-melange melange-edn-native
opam install -y lui ocaml-signal rrbvec melange-webapi melange-fetch \
  melange-transit-core melange-transit-melange melange-transit-native \
  melange-edn-core melange-edn-melange melange-edn-native \
  yojson ptime uri digestif mtime markup
