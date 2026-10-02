#!/bin/sh
# Pin the git-based opam deps declared by the (pin ...) stanzas in
# dune-project, then install the rest from the generated opam file.
# The pins live here rather than in logseq-db-worker.opam pin-depends
# because dune regenerates that file from dune-project
# (generate_opam_files) and the runtest diff check rejects hand edits.
set -eu
# GitHub-hosted runners disallow creating the loopback address inside
# bwrap (RTM_NEWADDR: Operation not permitted), which makes every sandboxed
# opam build fail. Clear the sandbox wrappers; CI runners are disposable.
opam option --global 'wrap-build-commands=[]'
opam option --global 'wrap-install-commands=[]'
opam option --global 'wrap-remove-commands=[]'
# Pin all three datascript packages at the same explicit version: the
# melange/native opam files constrain datascript_ocaml with {= version},
# and opam resolves unpinned versions inconsistently (~dev vs dev).
opam pin add -y -n datascript_ocaml.dev git+https://github.com/logseq/datascript-ocaml.git#main
opam pin add -y -n datascript-ocaml-melange.dev git+https://github.com/logseq/datascript-ocaml.git#main
opam pin add -y -n datascript-ocaml-native.dev git+https://github.com/logseq/datascript-ocaml.git#main
opam pin add -y -n persistent_sorted_set_ocaml git+https://github.com/logseq/persistent-sorted-set-ocaml.git#main
opam pin add -y -n melange-edn-core git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-edn-melange git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-edn-native git+https://github.com/logseq/melange-edn.git#main
opam pin add -y -n melange-transit-core git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-melange git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n melange-transit-native git+https://github.com/logseq/melange-transit.git#main
opam pin add -y -n rrbvec git+https://github.com/logseq/rrbvec.git#main
opam pin add -y -n angstrom git+https://github.com/logseq/angstrom#fork
opam pin add -y -n xmlm git+https://github.com/logseq/xmlm#master
opam pin add -y -n mldoc git+https://github.com/logseq/mldoc#master
opam install . --deps-only --with-test --yes
