# Self-hosted Logseq Sync image

`ghcr.io/ssamdav/logseq-selfhost-sync` packages the `db-sync` Node adapter so you
can run a self-hosted Logseq Sync server. The image is built from this
repository by the `build-selfhost-sync-image.yml` workflow.

## Building

The workflow runs on pushes that touch `images/sync/Dockerfile`, `mise.toml` or
`deps/db-sync/package.json`, and can also be started manually
(`workflow_dispatch`) with an optional `logseq_ref` (any branch, tag or commit
SHA) and `image_tag`. It publishes `linux/amd64` and `linux/arm64` images to
GHCR.

The Dockerfile is self-contained: it clones the requested Logseq ref, builds the
`db-sync` node adapter and copies the runtime into a distroless Node image.

## Running

Copy `.env.example` to `.env`, fill in `DB_SYNC_BASE_URL` and the Cognito
values, then:

```sh
docker compose up -d
```

`DB_SYNC_BASE_URL` accepts a comma-separated list of URLs so the server can be
reached through several addresses at once (for example a LAN IP over HTTP and a
Tailscale / reverse-proxy domain over HTTPS). The request Host header is matched
against the configured origins; when the variable is unset the request keeps its
Host header and `X-Forwarded-Proto`.

| Variable | Default | Description |
| --- | --- | --- |
| `DB_SYNC_PORT` | `8787` | HTTP port. |
| `DB_SYNC_BASE_URL` | unset | Comma-separated public origin(s) of this server. |
| `DB_SYNC_DATA_DIR` | `/app/data` | Graph and index storage. |
| `DB_SYNC_STORAGE_DRIVER` | `sqlite` | Only `sqlite` is supported. |
| `DB_SYNC_ASSETS_DRIVER` | `filesystem` | Only `filesystem` is supported. |
| `DB_SYNC_LOG_LEVEL` | `info` | Node adapter log level. |
| `ASSET_LINK_SECRET` | unset | Secret used to sign temporary asset links. |
| `COGNITO_ISSUER`, `COGNITO_CLIENT_ID`, `COGNITO_JWKS_URL` | baked-in Logseq defaults | Cognito values used to validate JWTs. |
