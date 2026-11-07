#!/usr/bin/env bash
set -euo pipefail
ui_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
repo_root=$(cd "$ui_root/../.." && pwd)
host=$(bash "$ui_root/mygo/build.sh")
version=$(node -p 'require(process.argv[1]).version' "$repo_root/resources/package.json")
arch=$(go env GOARCH)
packages="$ui_root/_build/packages"
mkdir -p "$packages"
stage=$(mktemp -d "$packages/stage.XXXXXX")
trap 'rm -rf "$stage"' EXIT
case "$(uname -s)" in
  Darwin)
    command -v dylibbundler >/dev/null
    app="$stage/Logseq MyGo.app"
    bin="$app/Contents/MacOS"
    resources="$app/Contents/Resources"
    library=liblogseq_ui.dylib
    mkdir -p "$bin" "$resources"
    cat > "$app/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleExecutable</key><string>Logseq</string>
  <key>CFBundleIdentifier</key><string>com.logseq.mygo</string>
  <key>CFBundleName</key><string>Logseq MyGo</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$version</string>
  <key>CFBundleVersion</key><string>$version</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
EOF
    launcher=Logseq
    ;;
  Linux)
    app="$stage/Logseq-MyGo"
    bin="$app/bin"
    resources="$app/Resources"
    library=liblogseq_ui.so
    launcher=logseq
    mkdir -p "$bin" "$resources"
    ;;
  *) printf 'Packaging requires a macOS or Linux toolchain.\n' >&2; exit 1 ;;
esac
cp "$host" "$bin/logseq-mygo"
cp -R "$ui_root/_build/Resources/." "$resources/"
cp "$(dirname "$host")/$library" "$resources/$library"
cp "$ui_root/scripts/launch-mygo.sh" "$bin/$launcher"
chmod +x "$bin/$launcher"
if [[ $(uname -s) == Darwin ]]; then
  dylibbundler -b -od -x "$bin/logseq-mygo" \
    -x "$resources/$library" -x "$resources/logseq-db-worker" \
    -d "$app/Contents/Frameworks" -p '@executable_path/../Frameworks/' >&2
  codesign --force --deep --sign - "$app" >&2
  archive="$packages/Logseq-MyGo-darwin-$arch-$version.zip"
  ditto -c -k --sequesterRsrc --keepParent "$app" "$archive"
else
  archive="$packages/Logseq-MyGo-linux-$arch-$version.tar.gz"
  tar -czf "$archive" -C "$stage" Logseq-MyGo
fi
printf '%s\n' "$archive"
