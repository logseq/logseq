#!/bin/sh
# Download the SQLite 3.50.4 amalgamation (sqlite3.c, sqlite3.h,
# sqlite3ext.h) into the current directory. Invoked by the dune rule in
# this directory so the amalgamation is a build artifact rather than
# ~9MB of vendored source. Keep VER in sync with the Windows DLL
# downloaded by deps/db-worker/scripts/install-opam-deps.sh.
set -eu

VER=3500400
ZIP=sqlite-amalgamation-$VER.zip
URL=https://sqlite.org/2025/$ZIP
SHA256=1d3049dd0f830a025a53105fc79fd2ab9431aea99e137809d064d8ee8356b032

curl -fsSL -o "$ZIP" "$URL"
if command -v sha256sum >/dev/null 2>&1; then
  echo "$SHA256  $ZIP" | sha256sum -c -
else
  echo "$SHA256  $ZIP" | shasum -a 256 -c -
fi
# unzip is missing on the Windows image; there bsdtar handles zip.
unzip -o -j -q "$ZIP" "sqlite-amalgamation-$VER/sqlite3.c" \
    "sqlite-amalgamation-$VER/sqlite3.h" \
    "sqlite-amalgamation-$VER/sqlite3ext.h" -d . 2>/dev/null || \
  tar -xf "$ZIP" --strip-components=1 \
    "sqlite-amalgamation-$VER/sqlite3.c" \
    "sqlite-amalgamation-$VER/sqlite3.h" \
    "sqlite-amalgamation-$VER/sqlite3ext.h"
rm -f "$ZIP"
