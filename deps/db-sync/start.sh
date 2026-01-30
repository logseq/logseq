#!/usr/bin/env bash
set -euo pipefail

export COGNITO_JWKS_URL="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8/.well-known/jwks.json"
export COGNITO_ISSUER="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8"
export COGNITO_CLIENT_ID="69cs1lgme7p8kbgld8n5kseii6"

# Optional: choose a fixed port
export DB_SYNC_PORT=8787

node worker/dist/node-adapter.js
