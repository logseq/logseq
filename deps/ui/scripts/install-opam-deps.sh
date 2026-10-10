#!/bin/sh
# opam deps for deps/ui (Melange UI app). Run after the logseq blueprint's
# `install OCaml toolchain` + db-worker's install-opam-deps.sh.
set -eu
# Set LUI_SOURCE to a local Git checkout when validating a LUI update.
# Commit the source changes first. Git pinning excludes ignored build output;
# path pinning would copy native and browser build caches into the switch.
if [ -n "${LUI_SOURCE:-}" ]; then
  opam pin add --kind=git -y -n lui "$LUI_SOURCE"
else
  opam pin add -y -n lui git+https://github.com/logseq/lui.git#51a6addb7097cddf8721d5bcf3e7521c093055f2
fi
opam pin add -y -n ocaml-signal git+https://github.com/logseq/ocaml-signal.git#df355e15869ceb7220c0365ae7057e4c3fc558b2
opam pin add -y -n rrbvec git+https://github.com/logseq/rrbvec.git#main
opam pin add -y -n melange-transit-core git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-melange git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-native git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-edn-core git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-edn-melange git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-edn-native git+https://github.com/logseq/melange-edn.git#main
opam update lui ocaml-signal rrbvec melange-transit-core melange-transit-melange melange-transit-native melange-edn-core melange-edn-melange melange-edn-native
opam upgrade -y lui ocaml-signal rrbvec melange-transit-core melange-transit-melange melange-transit-native melange-edn-core melange-edn-melange melange-edn-native
opam install . --deps-only --with-test --yes 2>/dev/null || opam install lui ocaml-signal rrbvec melange-webapi melange-fetch melange-transit-core melange-transit-melange melange-transit-native melange-edn-core melange-edn-melange melange-edn-native digestif -y
