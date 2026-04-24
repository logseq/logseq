#!/bin/bash

set -ex

unset LOGSEQ_APP_SERVER_URL
export ENABLE_FILE_SYNC_PRODUCTION=true

# pnpm clean
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm install --frozen-lockfile

rm -rv public/static || true
rm -rv ios/App/App/public || true

pnpm release-app

rsync -avz --exclude node_modules --exclude '*.js.map' --exclude android ./static/ ./public/static/

pnpm exec cap sync ios

pnpm exec cap open ios

echo "step 1(Xcode). Product > Archive (device should be Any iOS Device)"

echo "step 2(Archive). Distribute App"

echo "  - App Store Connect"
echo "  - Upload"
echo "  - (Default config, all checked)"
echo "  - Upload"
