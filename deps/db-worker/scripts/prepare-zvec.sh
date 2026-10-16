#!/bin/sh
# The native backend shares the zvec 0.5 collection format with @zvec/zvec.
set -eu
if [ "$(uname -s)" != Darwin ] || [ "$(uname -m)" != arm64 ]; then
  echo "The vector backend is only shipped for macOS arm64" >&2
  exit 1
fi
zvec_destination=${1:?Usage: prepare-zvec.sh <binary-directory>}
zvec_archive=$(mktemp -d)
trap 'rm -rf "$zvec_archive"' EXIT HUP INT TERM
curl --fail --location --silent --show-error \
  https://github.com/zvec-ai/zvec-go/releases/download/v0.5.0/zvec-libs-darwin-arm64.tar.gz \
  --output "$zvec_archive/sdk.tar.gz"
printf '%s  %s\n' a795f63819b2446d0600c390a2dacd5eefec022d9baff5faef4d4efedb925439 "$zvec_archive/sdk.tar.gz" \
  | shasum -a 256 --check --status
tar -xzf "$zvec_archive/sdk.tar.gz" -C "$zvec_archive" darwin_arm64/libzvec_c_api.dylib include/zvec/c_api.h
mkdir -p "$zvec_destination"
cp "$zvec_archive/darwin_arm64/libzvec_c_api.dylib" "$zvec_destination/"
cp "$zvec_archive/include/zvec/c_api.h" "$zvec_destination/zvec_c_api.h"
cp "$(dirname "$0")/../runtime/native/ZVEC-LICENSE" "$zvec_destination/"
cp "$(dirname "$0")/../runtime/native/ZVEC-NOTICE" "$zvec_destination/"
