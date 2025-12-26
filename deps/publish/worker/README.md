## Cloudflare Publish Worker (Skeleton)

This worker accepts publish payloads and stores transit blobs in R2 while keeping
metadata in a Durable Object backed by SQLite.

### Bindings

- `PUBLISH_META_DO`: Durable Object namespace
- `PUBLISH_R2`: R2 bucket
- `R2_ACCOUNT_ID`: Cloudflare account id for signing
- `R2_BUCKET`: R2 bucket name for signing
- `R2_ACCESS_KEY_ID`: R2 access key for signing
- `R2_SECRET_ACCESS_KEY`: R2 secret key for signing
- `COGNITO_JWKS_URL`: JWKS URL for Cognito user pool
- `COGNITO_ISSUER`: Cognito issuer URL
- `COGNITO_CLIENT_ID`: Cognito client ID
- `DEV_SKIP_AUTH`: set to `true` to bypass JWT verification in local dev

### Routes

- `POST /pages`
  - Requires `Authorization: Bearer <JWT>`
  - Requires `x-publish-meta` header (JSON)
  - Body is transit payload (stored in R2 as-is)
- `GET /pages/:page-uuid`
  - Returns metadata for the page
- `GET /pages/:page-uuid/transit`
  - Returns JSON with a signed R2 URL and `etag`
- `GET /pages`
  - Lists metadata entries (from the index DO)

### Notes

- This is a starter implementation. Integrate with your deployment tooling
  (wrangler, etc.) as needed.
- For local testing, run `wrangler dev` and use `deps/publish/worker/scripts/dev_test.sh`.
- If you switch schema versions, clear local DO state with
  `deps/publish/worker/scripts/clear_dev_state.sh`.
