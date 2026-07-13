# Logseq Sync deployment manager

`logseq-sync` deploys the experimental DB Sync Node adapter as one Docker
Compose deployment. HTTPS also starts an optional Caddy proxy. It builds the
adapter from this checkout, so copy or clone the full Logseq repository to the
Linux server first.

## Prerequisites

- Linux host with Docker Engine and Docker Compose. Install Docker using the
  [official Docker Engine documentation](https://docs.docker.com/engine/install/).
- A public DNS record when selecting HTTPS.
- `curl` when selecting HTTPS, so the manager can verify the public endpoint.
- A Logseq account. The default setup uses the JWT issuer already configured in
  the current Logseq client. A custom JWT issuer requires a Logseq client built
  to issue matching tokens.

## Commands

```bash
cd deps/db-sync/deploy
./logseq-sync setup
./logseq-sync status
./logseq-sync logs --follow
```

The manager writes deployment files under `~/.local/share/logseq-sync` by
default and stores graph SQLite files and assets under
`~/.local/share/logseq-sync-data`. Existing generated files are never replaced
without first creating a timestamped backup after confirmation.

HTTPS uses Caddy and requires ports 80 and 443. HTTP is available only after an
explicit acknowledgement because bearer tokens are sent in plaintext.

## Limitations

This is an experimental self-hosted adapter. Run a backup strategy for the
persistent data directory before relying on it for important graphs. The
deployment manager configures verified JWT authentication only; shared-token
and anonymous modes are not exposed until the client and server support them
end-to-end.
