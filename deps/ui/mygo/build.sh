#!/usr/bin/env bash
set -euo pipefail
ui_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
output="$ui_root/_build/mygo"
cd "$ui_root"
if [[ $(uname -s) == Linux ]]; then
  system_archive=$(cc -print-file-name=librt.a)
  if [[ $system_archive != /* ]]; then
    printf 'The C toolchain cannot locate librt.a. Install libc development files.\n' >&2
    exit 1
  fi
  export OCAMLPARAM="${OCAMLPARAM:-_},cclib=-L$(dirname "$system_archive")"
fi
opam exec -- dune build native/native_embed.exe.o >&2
mkdir -p "$output"
case "$(uname -s)" in
  Darwin) library="$output/liblogseq_ui.dylib"; link_flags=(-dynamiclib -Wl,-undefined,error) ;;
  Linux) library="$output/liblogseq_ui.so"; link_flags=(-shared -Wl,-z,defs -lpthread -ldl -lm) ;;
  *) printf 'Build the MyGo host with a macOS or Linux OCaml toolchain.\n' >&2; exit 1 ;;
esac
cc -o "$library" "$ui_root/_build/default/native/native_embed.exe.o" "${link_flags[@]}"
go -C "$ui_root/mygo" build -o "$output/logseq-mygo" .
printf '%s\n' "$output/logseq-mygo"
