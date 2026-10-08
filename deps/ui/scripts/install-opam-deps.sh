#!/bin/sh
# opam deps for deps/ui (Melange UI app). Run after the logseq blueprint's
# `install OCaml toolchain` + db-worker's install-opam-deps.sh.
set -eu
opam pin add -y -n lui git+https://github.com/logseq/lui.git#07ab1908a3f2d10984b8f9d979ddfe28bd433326
opam pin add -y -n ocaml-signal git+https://github.com/logseq/ocaml-signal.git#976b40f
opam pin add -y -n rrbvec git+https://github.com/logseq/rrbvec.git#main
opam pin add -y -n melange-transit-core git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-melange git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-native git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-edn-core git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-edn-melange git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-edn-native git+https://github.com/logseq/melange-edn.git#main
opam install . --deps-only --with-test --yes 2>/dev/null || opam install lui ocaml-signal rrbvec melange-webapi melange-fetch melange-transit-core melange-transit-melange melange-transit-native melange-edn-core melange-edn-melange melange-edn-native digestif -y
