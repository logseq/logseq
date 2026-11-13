#!/usr/bin/env bash
set -euo pipefail
host_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ui_root=$(cd "$host_root/.." && pwd)
repo_root=$(cd "$ui_root/../.." && pwd)
[[ $(uname -s) == Darwin ]] || { printf 'The Apple desktop host requires macOS.\n' >&2; exit 1; }
output="$ui_root/_build/apple"
resources="$ui_root/_build/Resources"
# Both languages must use the exact same schema revision.
revision=$(sed -n 's/.*revision: "\([0-9a-f]*\)".*/\1/p' "$host_root/Package.swift")
default_revision=$(sed -n 's/.*github.com\/logseq\/lui.git#\([0-9a-f]*\).*/\1/p' "$ui_root/scripts/install-opam-deps.sh")
if [[ -z ${LUI_SOURCE:-} && $revision != "$default_revision" ]]; then
  printf 'Swift and default OCaml LUI pins differ; install a paired revision using LUI_SOURCE.\n' >&2
  exit 1
fi
opam_revision=$(opam pin list --color=never | awk '$1 ~ /^lui\./ && $2 == "git" { gsub(/[()]/, "", $NF); print $NF }')
[[ $revision =~ ^[0-9a-f]{40}$ && $revision == "$opam_revision" ]] || {
  printf 'Swift LUI revision %s differs from the active opam Git pin %s. Run scripts/install-opam-deps.sh in the selected switch first.\n' "$revision" "$opam_revision" >&2
  exit 1
}
(cd "$ui_root" && opam exec -- dune build native/native_embed.exe.o) >&2
(cd "$repo_root/deps/db-worker" && opam exec -- dune build bin/main.exe) >&2
mkdir -p "$output" "$resources/fonts" "$resources/img" "$resources/dicts"
cc -dynamiclib '-Wl,-undefined,error' -o "$output/liblogseq_ui.dylib" "$ui_root/_build/default/native/native_embed.exe.o"
install -m 755 "$repo_root/deps/db-worker/_build/default/bin/main.exe" "$resources/logseq-db-worker"
cp "$ui_root/assets/"*.json "$resources/"
cp "$ui_root/assets/fonts/"*.ttf "$resources/fonts/"
cp -R "$repo_root/resources/img/." "$resources/img/"
cp "$repo_root/resources/dicts/"*.edn "$resources/dicts/"
swift build --package-path "$host_root" -c release >&2
swift_bin=$(swift build --package-path "$host_root" -c release --show-bin-path)
install -m 755 "$swift_bin/logseq-apple" "$output/logseq-apple"
printf '%s\n' "$output/logseq-apple"
