#!/bin/sh
# Minimal OCaml dependencies for the Web UI and native application library.
# Run after deps/db-worker/scripts/install-opam-deps.sh in the selected switch.
set -eu
# Set LUI_SOURCE to a local Git checkout when validating a LUI update.
# Commit the source changes first. Git pinning excludes ignored build output;
# path pinning would copy native and browser build caches into the switch.
if [ -n "${LUI_SOURCE:-}" ]; then
  opam pin add --kind=git -y -n lui "$LUI_SOURCE"
else
  opam pin add -y -n lui git+https://github.com/logseq/lui.git#6a811f01759e50b7bdcc6dfdfcca5b5daf6ecf29
fi
opam pin add -y -n ocaml-signal git+https://github.com/logseq/ocaml-signal.git#02e18cdc5e0ad672aa223f638eaa3ba52fc9421e
opam pin add -y -n rrbvec git+https://github.com/logseq/rrbvec.git#main
opam pin add -y -n melange-transit-core git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-melange git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-native git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-edn-core git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-edn-melange git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-edn-native git+https://github.com/logseq/melange-edn.git#main
opam update lui ocaml-signal rrbvec melange-transit-core melange-transit-melange melange-transit-native melange-edn-core melange-edn-melange melange-edn-native
opam upgrade -y lui ocaml-signal rrbvec melange-transit-core melange-transit-melange melange-transit-native melange-edn-core melange-edn-melange melange-edn-native
opam install -y lui ocaml-signal rrbvec melange-webapi melange-fetch \
  melange-transit-core melange-transit-melange melange-transit-native \
  melange-edn-core melange-edn-melange melange-edn-native \
  yojson ptime uri digestif mtime markup
