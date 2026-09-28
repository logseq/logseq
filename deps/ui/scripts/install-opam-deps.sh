#!/bin/sh
# opam deps for deps/ui (Melange UI app). Run after the logseq blueprint's
# `install OCaml toolchain` + db-worker's install-opam-deps.sh.
set -eu
opam pin add -y -n lui git+https://github.com/logseq/lui.git#317b801879db6e24f11e1f2b1a3067434e95a68e
opam pin add -y -n ocaml-signal git+https://github.com/logseq/ocaml-signal.git#976b40f
opam pin add -y -n rrbvec git+https://github.com/logseq/rrbvec.git#main
opam pin add -y -n melange-transit-core git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-melange git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-native git+https://github.com/logseq/melange-transit.git#main
opam install . --deps-only --with-test --yes 2>/dev/null || opam install lui melange-webapi melange-fetch melange.dom -y
