#!/usr/bin/env bash
set -euo pipefail
host_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ui_root=$(cd "$host_root/.." && pwd)
repo_root=$(cd "$ui_root/../.." && pwd)
command -v dylibbundler >/dev/null || { printf 'Install dylibbundler before packaging.\n' >&2; exit 1; }
host=$(bash "$host_root/build.sh")
version=$(node -p 'require(process.argv[1]).version' "$repo_root/resources/package.json")
packages="$ui_root/_build/packages"
mkdir -p "$packages"
stage=$(mktemp -d "$packages/apple-stage.XXXXXX")
trap 'rm -rf "$stage"' EXIT
app="$stage/Logseq.app"
bin="$app/Contents/MacOS"
resources="$app/Contents/Resources"
mkdir -p "$bin" "$resources" "$app/Contents/Frameworks"
cat > "$app/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>Logseq</string>
<key>CFBundleIdentifier</key><string>com.logseq.logseq</string>
<key>CFBundleName</key><string>Logseq</string>
<key>CFBundleDisplayName</key><string>Logseq</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>$version</string>
<key>CFBundleVersion</key><string>$version</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
EOF
cp "$host" "$bin/Logseq"
cp -R "$ui_root/_build/Resources/." "$resources/"
cp "$(dirname "$host")/liblogseq_ui.dylib" "$resources/"
dylibbundler -b -od -x "$bin/Logseq" -x "$resources/liblogseq_ui.dylib" \
  -x "$resources/logseq-db-worker" -d "$app/Contents/Frameworks" -p '@executable_path/../Frameworks/' >&2
# dylibbundler can rewrite distinct runpaths to the same bundle path.
# Keep their first occurrence; dyld rejects duplicate LC_RPATH entries.
for binary in "$bin/Logseq" "$resources/liblogseq_ui.dylib" \
  "$resources/logseq-db-worker" "$app/Contents/Frameworks/"*.dylib; do
  [[ -f $binary ]] || continue
  duplicate_runpaths=$(otool -l "$binary" | awk '
    $1 == "cmd" && $2 == "LC_RPATH" {
      getline; getline
      sub(/^[[:space:]]*path /, "")
      sub(/ \(offset [0-9]+\)$/, "")
      if (seen[$0]++) print
    }')
  while IFS= read -r runpath; do
    [[ -n $runpath ]] || continue
    install_name_tool -delete_rpath "$runpath" "$binary" >&2
  done <<< "$duplicate_runpaths"
done
codesign --force --deep --sign - "$app" >&2
codesign --verify --deep --strict "$app" >&2
destination="$packages/Logseq.app"
if [[ -e $destination ]]; then
  printf 'Remove or move the previous output first: %s\n' "$destination" >&2
  exit 1
fi
ditto "$app" "$destination"
archive="$packages/Logseq-macos-$(uname -m)-$version.zip"
ditto -c -k --sequesterRsrc --keepParent "$app" "$archive"
printf '%s\n' "$destination"
