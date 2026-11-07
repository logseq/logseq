#!/usr/bin/env bash
set -euo pipefail
ui_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
repo_root=$(cd "$ui_root/../.." && pwd)
output="$ui_root/_build/mygo"
resources="$ui_root/_build/Resources"
case "$(uname -s)" in
  Darwin) library="$output/liblogseq_ui.dylib"; link_flags=(-dynamiclib "-Wl,-undefined,error") ;;
  Linux) library="$output/liblogseq_ui.so"; link_flags=(-shared "-Wl,-z,defs" -lpthread -ldl -lm) ;;
  *) printf 'Build the MyGo host with a macOS or Linux OCaml toolchain.\n' >&2; exit 1 ;;
esac
if [[ $(uname -s) == Linux ]]; then
  system_archive=$(cc -print-file-name=librt.a)
  if [[ $system_archive != /* ]]; then
    printf 'The C toolchain cannot locate librt.a. Install libc development files.\n' >&2
    exit 1
  fi
  system_archive_dir=$(dirname "$system_archive")
  export OCAMLPARAM="${OCAMLPARAM:-_},cclib=-L$system_archive_dir"
fi
(cd "$ui_root" && opam exec -- dune build native/native_embed.exe.o) >&2
(cd "$repo_root/deps/db-worker" && opam exec -- dune build bin/main.exe) >&2
mkdir -p "$output"
cc -o "$library" "$ui_root/_build/default/native/native_embed.exe.o" "${link_flags[@]}"
mkdir -p "$resources/fonts" "$resources/img" "$resources/dicts"
cp "$repo_root/deps/db-worker/_build/default/bin/main.exe" "$resources/logseq-db-worker"
cp "$ui_root/assets/"*.json "$resources/"
cp "$ui_root/assets/fonts/"*.ttf "$resources/fonts/"
cp -R "$ui_root/../../resources/img/." "$resources/img/"
cp "$ui_root/../../resources/dicts/"*.edn "$resources/dicts/"
CGO_ENABLED=1 go -C "$ui_root/mygo" build -o "$output/logseq-mygo" .
printf '%s\n' "$output/logseq-mygo"
