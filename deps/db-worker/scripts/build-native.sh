#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ "$(uname -s)" = Darwin ] && [ "$(uname -m)" = arm64 ]; then
  opam exec -- dune build bin/main.exe bin/libzvec_c_api.dylib bin/ZVEC-LICENSE bin/ZVEC-NOTICE
else
  opam exec -- dune build bin/main.exe
fi
