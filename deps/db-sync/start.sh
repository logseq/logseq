#!/usr/bin/env bash
set -euo pipefail

: "${DB_SYNC_PORT:=8787}"

# Defaults match the local `yarn watch` app auth config.
# Override these env vars for production pool values if needed.
: "${COGNITO_ISSUER:=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8}"
: "${COGNITO_CLIENT_ID:=69cs1lgme7p8kbgld8n5kseii6}"
: "${COGNITO_JWKS_URL:=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8/.well-known/jwks.json}"

export DB_SYNC_PORT
export COGNITO_ISSUER
export COGNITO_CLIENT_ID
export COGNITO_JWKS_URL

node worker/dist/node-adapter.js
