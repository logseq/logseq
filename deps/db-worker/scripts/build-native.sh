#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
opam exec -- dune build bin/main.exe
