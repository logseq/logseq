#!/usr/bin/env bash
# Builds the Logseq Apple host (apple/Package.swift -> Logseq) with the OCaml
# runtime linked in.
#
# Usage: apple/build.sh [macos] [--app-dir DIR]
#
# Native link inputs:
#   * The OCaml complete object: deps/ui/apple/native_embed.exe.o, produced by
#       cd deps/ui && eval $(opam env --switch=5.5.0) && dune build apple/native_embed.exe.o
#     It folds in logseq_lui_bridge.c (foreign_stubs) and the OCaml runtime.
#   * LOGSEQ_EXTRA_OBJECTS (colon-separated) appends more objects if needed.
#
# The db-worker daemon binary is NOT bundled here: daemon_client.ml resolves it
# via LOGSEQ_DB_WORKER_BIN or the known _build paths at runtime. To ship a
# self-contained .app, drop the binary next to the executable or into
# Contents/Resources/logseq-db-worker.

set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
apple_dir="$repo_root/apple"
info_plist="$apple_dir/Info.plist"
platform=${1:-macos}
if [[ $platform == --* ]]; then platform=macos; fi
shift || true
app_dir=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir) app_dir="$2"; shift 2 ;;
    *) shift ;;
  esac
done

[[ $platform == macos ]] || { echo "only macos supported for now" >&2; exit 2; }

deployment_target=${LOGSEQ_MACOS_DEPLOYMENT_TARGET:-26.0}
triple="arm64-apple-macosx${deployment_target}"
sdk_path=$(xcrun --sdk macosx --show-sdk-path)
clang=$(xcrun --sdk macosx --find clang)
opam_root=${OPAMROOT:-$(opam var root --safe 2>/dev/null || echo "$HOME/.opam")}
ocaml_prefix=${LOGSEQ_OCAML_PREFIX:-$(ocamlfind printconf destdir 2>/dev/null | sed 's|/lib$||' || true)}
[[ -n $ocaml_prefix ]] || ocaml_prefix="$opam_root/5.5.0"
ocaml_include="$ocaml_prefix/lib/ocaml"

build_dir="$repo_root/_build/apple/$platform"
mkdir -p "$build_dir"

# --- logseq_lui_bridge.o compile check --------------------------------------
"$clang" \
  -target "$triple" \
  -isysroot "$sdk_path" \
  -fPIC \
  -I "$ocaml_include" \
  -c "$repo_root/deps/ui/apple/logseq_lui_bridge.c" \
  -o "$build_dir/logseq_lui_bridge.o"

# --- OCaml complete object --------------------------------------------------
ocaml_object=${LOGSEQ_OCAML_OBJECT:-$repo_root/deps/ui/_build/default/apple/native_embed.exe.o}
if [[ ! -f $ocaml_object ]]; then
  echo "missing OCaml object: $ocaml_object" >&2
  echo "build it first: cd deps/ui && eval \$(opam env --switch=5.5.0) && dune build apple/native_embed.exe.o" >&2
  exit 1
fi

fingerprint=$(shasum -a 256 "$ocaml_object" | cut -d ' ' -f 1)
link_dir="$build_dir/native-link-inputs/$fingerprint"
mkdir -p "$link_dir"
cp -f "$ocaml_object" "$link_dir/logseq_complete.o"

extra_inputs=""
if [[ -n ${LOGSEQ_EXTRA_OBJECTS:-} ]]; then
  extra_inputs=":${LOGSEQ_EXTRA_OBJECTS}"
fi

# --- SwiftPM ----------------------------------------------------------------
# SwiftPM derives a local package's identity from the path basename, and our
# package directory is also named "apple" — point the dep at a symlink with a
# distinct basename so the two identities don't collide.
lui_link="$build_dir/lui-apple-backend"
ln -sfn "${LOGSEQ_LUI_PACKAGE_PATH:-$repo_root/../lui/platform/apple}" "$lui_link"

LOGSEQ_LUI_PACKAGE_PATH="$lui_link" \
LOGSEQ_NATIVE_LINK_INPUTS="$link_dir/logseq_complete.o$extra_inputs" \
swift build --package-path "$apple_dir" --product Logseq

# --- .app assembly ----------------------------------------------------------
product_dir="$apple_dir/.build/$triple/debug"
[[ -f $product_dir/Logseq ]] || product_dir="$apple_dir/.build/debug"
app_dir=${app_dir:-$build_dir/Logseq.app}
rm -rf "$app_dir"
mkdir -p "$app_dir/Contents/MacOS" "$app_dir/Contents/Resources"
cp "$info_plist" "$app_dir/Contents/Info.plist"
cp "$product_dir/Logseq" "$app_dir/Contents/MacOS/Logseq"

# Bundle the db-worker binary when it exists, so daemon_client.ml finds it via
# the Resources/ fallback path without an env var.
db_worker="$repo_root/deps/db-worker/_build/default/bin/main.exe"
if [[ -f $db_worker ]]; then
  cp "$db_worker" "$app_dir/Contents/Resources/logseq-db-worker"
fi

# tabler icon table: the OCaml twin (deps/ui/apple/icon_tabler_data.ml) reads
# ../Resources/tabler-children.json; the Swift side embeds its own copy via
# Bundle.module. Generated from resources/js/icon-data.js — see NOTES.md.
icons_json="$apple_dir/Sources/Logseq/Resources/tabler-children.json"
if [[ ! -f $icons_json ]]; then
  python3 - "$repo_root/resources/js/icon-data.js" "$icons_json" <<'PY'
import json, re, sys
src = open(sys.argv[1]).read()
body = src[src.index('__tablerChildren=') + len('__tablerChildren='):].rstrip().rstrip(';')
with open(sys.argv[2], 'w') as f:
    json.dump(json.loads(body), f, separators=(',', ':'))
PY
fi
cp "$icons_json" "$app_dir/Contents/Resources/tabler-children.json"

# settings theme-mode previews (resources/img/{light,dark,system}-theme.png,
# rendered by i.mode-* elements in the settings appearance pane)
for theme_png in light-theme.png dark-theme.png system-theme.png; do
  src_png="$repo_root/resources/img/$theme_png"
  [[ -f $src_png ]] && cp "$src_png" "$app_dir/Contents/Resources/$theme_png"
done

# SwiftPM resource bundles (Bundle.module): the generated
# resource_bundle_accessor also searches Contents/Resources — bundles at
# the .app root count as unsealed contents and break the signature
# (Gatekeeper reports the app as "damaged").
for bundle in "$product_dir"/*.bundle; do
  [[ -d $bundle ]] && cp -R "$bundle" "$app_dir/Contents/Resources/"
done

codesign --force --sign - --timestamp=none "$app_dir" || true
echo "built: $app_dir"
