#!/bin/bash

set -ex

unset LOGSEQ_APP_SERVER_URL
export ENABLE_FILE_SYNC_PRODUCTION=true

# yarn clean
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn install --force

rm -rv public/static || true
rm -rv ios/App/App/public || true

yarn release-app

rsync -avz --exclude node_modules --exclude '*.js.map' --exclude android ./static/ ./public/static/

npx cap sync ios

npx cap open ios

echo "step 1(Xcode). Product > Archive (device should be Any iOS Device)"

echo "step 2(Archive). Distribute App"

echo "  - App Store Connect"
echo "  - Upload"
echo "  - (Default config, all checked)"
echo "  - Upload"
