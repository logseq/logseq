#!/usr/bin/env bash
set -euo pipefail
ui_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
repo_root=$(cd "$ui_root/../.." && pwd)
node_bin="${NODE_BINARY:-node}"
lui_source=$(cd "${LUI_SOURCE_ROOT:-$repo_root/../lui}" && pwd -P)
host=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --built-host) [[ $# -ge 2 ]] || { printf 'Missing --built-host path.\n' >&2; exit 1; }; host="$2"; shift 2 ;;
    --) shift ;;
    *) printf 'Usage: package-nsh.sh [--built-host qualified-executable]\n' >&2; exit 1 ;;
  esac
done
if [[ -z $host ]]; then host=$(bash "$ui_root/nsh/build.sh"); fi
host=$(cd "$(dirname "$host")" && printf '%s/%s' "$PWD" "$(basename "$host")")
version=$("$node_bin" -p 'require(process.argv[1]).version' "$repo_root/resources/package.json")
arch=$(uname -m)
case "$arch" in arm64|aarch64) arch=arm64 ;; x86_64|amd64) arch=x64 ;; *) printf 'Unsupported desktop architecture.\n' >&2; exit 1 ;; esac
packages="$ui_root/_build/packages"
mkdir -p "$packages"
stage=$(mktemp -d "$packages/.nsh-package.XXXXXX")
trap 'rm -rf "$stage"' EXIT
case "$(uname -s)" in
  Darwin)
    platform=darwin
    app="$stage/Logseq NSH.app"
    bin="$app/Contents/MacOS"
    resources="$app/Contents/Resources"
    library=liblogseq_ui.dylib
    launcher=Logseq
    extension=zip
    ;;
  Linux)
    platform=linux
    app="$stage/Logseq-NSH"
    bin="$app/bin"
    resources="$app/Resources"
    library=liblogseq_ui.so
    launcher=logseq
    extension=tar.gz
    [[ -z ${NSH_CODESIGN_IDENTITY:-}${NSH_NOTARY_PROFILE:-} ]] || { printf 'Apple signing options require macOS.\n' >&2; exit 1; }
    ;;
  *) printf 'NSH application archives currently support macOS and Linux.\n' >&2; exit 1 ;;
esac
helper="$ui_root/scripts/package-nsh.mjs"
"$node_bin" "$helper" stage "$host" "$(dirname "$host")/$library" \
  "$(dirname "$host")/../Resources" "$bin" "$resources" "$stage/snapshot.json" "$lui_source" "$launcher"
if [[ $platform == darwin ]]; then
  command -v dylibbundler >/dev/null
  "$node_bin" - "$app/Contents/Info.plist" "$version" <<'PLIST'
const fs = require("node:fs");
const escape = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
fs.writeFileSync(process.argv[2], `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>Logseq</string>
<key>CFBundleIdentifier</key><string>com.logseq.logseq</string>
<key>CFBundleName</key><string>Logseq</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${escape(process.argv[3])}</string>
<key>CFBundleVersion</key><string>${escape(process.argv[3])}</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>\n`);
PLIST
  dylibbundler -b -od -x "$bin/logseq-nsh" -x "$resources/$library" \
    -x "$resources/logseq-db-worker" -d "$app/Contents/Frameworks" -p '@executable_path/../Frameworks/' >&2
  identity="${NSH_CODESIGN_IDENTITY:--}"
  sign=(--force --sign "$identity")
  if [[ $identity == - ]]; then sign+=(--timestamp=none); else sign+=(--timestamp --options runtime); fi
  if [[ -d $app/Contents/Frameworks ]]; then
    while IFS= read -r -d '' file; do codesign "${sign[@]}" "$file" >&2; done < <(find "$app/Contents/Frameworks" -type f -name '*.dylib' -print0)
  fi
  for file in "$bin/logseq-nsh" "$resources/$library" "$resources/logseq-db-worker"; do codesign "${sign[@]}" "$file" >&2; done
  codesign "${sign[@]}" "$app" >&2
  codesign --verify --deep --strict "$app" >&2
fi
archive="$packages/Logseq-NSH-$platform-$arch-$version.$extension"
candidate="$stage/$(basename "$archive")"
if [[ $platform == darwin ]]; then
  ditto -c -k --sequesterRsrc --keepParent "$app" "$candidate"
  if [[ -n ${NSH_NOTARY_PROFILE:-} ]]; then
    [[ $identity != - ]] || { printf 'Notarization requires NSH_CODESIGN_IDENTITY.\n' >&2; exit 1; }
    xcrun notarytool submit "$candidate" --keychain-profile "$NSH_NOTARY_PROFILE" --wait >&2
    xcrun stapler staple "$app" >&2
    rm "$candidate"
    ditto -c -k --sequesterRsrc --keepParent "$app" "$candidate"
  fi
else
  tar -czf "$candidate" -C "$stage" Logseq-NSH
fi
"$node_bin" "$helper" finish "$stage/snapshot.json" "$candidate" "$archive"
mv -f "$candidate" "$archive"
mv -f "$candidate.lui-build.json" "$archive.lui-build.json"
printf '%s\n' "$archive"
