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

# Windows: the libsqlite3-0.dll bundled with the opam cygwin sysroot is
# built without JSON1/FTS5 (blocks_fts + json_each fail), so swap in the
# upstream prebuilt DLL — same soname and export set, pinned + hashed.
# `opam exec` puts this dir on PATH, so dune-built exes pick it up, and
# the release job also copies it next to main.exe for packaging.
if [ "${OS:-}" = "Windows_NT" ] || uname -s 2>/dev/null | grep -qiE 'mingw|msys|cygwin_nt'; then
  SQLITE_ZIP=sqlite-dll-win-x64-3500400.zip
  SQLITE_SHA256=56b8751cdbf6dcd8ac9a35508039e456692a402bc5ddf576c2b0eddb0fed8536
  SQLITE_BIN="$(opam var root)/.cygwin/root/usr/x86_64-w64-mingw32/sys-root/mingw/bin"
  if [ -d "$SQLITE_BIN" ]; then
    SQLITE_TMP="$(mktemp -d)"
    curl -fsSL -o "$SQLITE_TMP/$SQLITE_ZIP" "https://sqlite.org/2025/$SQLITE_ZIP"
    echo "$SQLITE_SHA256  $SQLITE_TMP/$SQLITE_ZIP" | sha256sum -c -
    (cd "$SQLITE_TMP" && tar -xf "$SQLITE_ZIP")
    cp "$SQLITE_TMP/sqlite3.dll" "$SQLITE_BIN/libsqlite3-0.dll"
    rm -rf "$SQLITE_TMP"
  fi
fi
