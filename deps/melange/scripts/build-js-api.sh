#!/usr/bin/env bash

set -euo pipefail

melange_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

(
  cd "$melange_root"
  opam exec -- dune build @bundle
)
