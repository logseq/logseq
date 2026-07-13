# Interactive self-hosted Sync manager

## Goal

Provide a Linux-server deployment path for the experimental DB Sync Node adapter.
The operator runs one interactive manager, makes explicit choices, and receives
a running Docker Compose deployment plus the URL to enter in Logseq.

The installer does not install Docker. When Docker Compose is unavailable, it
stops before writing deployment files and links to the official Docker Engine
installation guide: <https://docs.docker.com/engine/install/>.

## Scope

The deployment assets will live under `deps/db-sync/deploy/` and include:

- an interactive `logseq-sync` entrypoint;
- a Dockerfile that builds the Node adapter and runs it;
- a Compose definition with a durable data volume;
- optional Caddy reverse proxy configuration for TLS;
- generated `.env` configuration, never committed with secrets.

The installer targets one Linux host and one Sync adapter instance. It does not
install Docker, run a multi-node cluster, provide backups, or delete existing
data.

## Operator flow

1. Run `logseq-sync setup`, which checks Linux, Docker Engine, and `docker
   compose` availability. If missing,
   print the official Docker documentation URL and exit without changes.
2. Ask for a deployment directory and a persistent data directory.
3. Ask for an endpoint mode:
   - `https`: domain name plus Caddy-managed TLS certificate;
   - `http`: bind a public HTTP endpoint only after the operator types an
     explicit risk acknowledgement.
4. Ask for an authentication mode:
   - verified JWT through the current Cognito-compatible environment variables;
   - shared access token, requiring a future client settings field and matching
     server validation;
   - anonymous mode only for private-network testing. It must reject public
     endpoint selection.
5. Print the full plan, including paths, URL, exposed ports, and authentication
   choice. Require a final confirmation before creating configuration files or
   running Compose.
6. Start the service with `docker compose up -d`, poll `/health`, and print the
   Sync Server URL for Logseq settings.

## Management commands

`logseq-sync` is a deployment manager, not an install-only script. It exposes:

```bash
logseq-sync setup
logseq-sync status
logseq-sync logs
logseq-sync logs --follow
logseq-sync logs sync
logseq-sync logs proxy
logseq-sync help
```

After `setup`, the manager checks both `docker compose ps` and the unauthenticated
`/health` endpoint. It reports success only when the containers are running and
the endpoint returns `{"ok":true}`.

`status` reports container state, the health result, the configured Sync Server
URL, and a short recent-error summary. `logs` prints the most recent 200 lines;
`--follow` streams new lines. `sync` selects the Node adapter logs, while `proxy`
selects Caddy logs and reports that the service is unavailable in HTTP mode.

On startup or health-check failure, the manager leaves containers and persistent
data intact, shows the failed check, and directs the operator to `logs --follow`.

## Safety behavior

- Never run recursive deletion, `docker compose down -v`, or remove volumes.
- If a generated file already exists, offer only `cancel` or write a new
  timestamped backup beside it; no overwrite occurs without explicit
  confirmation.
- Warn that public HTTP exposes bearer credentials and shared tokens in transit.
- Do not allow anonymous mode with a public HTTP or HTTPS endpoint.

## Architecture

```text
Logseq Desktop/Web
  -> HTTPS/WSS or HTTP/WS
  -> optional Caddy reverse proxy
  -> DB Sync Node adapter (single container)
  -> persistent host-mounted data directory
     - index.sqlite
     - graphs/
     - assets/
```

Compose runs a single adapter because graph state and active WebSocket
connections are held in process memory, while the adapter uses local SQLite.
The data directory is mounted from the host so container recreation does not
discard graphs or assets.

## Client compatibility

The existing client accepts a custom HTTP(S) Sync Server URL and derives the
matching WebSocket URL. It already supports the verified-JWT path.

Shared-token and anonymous choices require additional implementation before the
installer exposes them as working choices:

- the server must validate the selected authentication mode;
- the client must persist and send a shared token when selected;
- the UI must clearly mark the mode and its risk.

Until that implementation exists, the installer must either omit those choices
or display them as unavailable rather than silently starting an insecure
server.

## Verification

- Build the adapter: `pnpm --dir deps/db-sync build:node-adapter`.
- Start the generated Compose deployment.
- Verify `GET /health` returns `{"ok":true}`.
- Verify a client configured with the displayed URL can connect and create a
  graph using the selected verified-JWT mode.
- Add non-interactive shell tests for missing Docker, HTTP acknowledgement,
  existing configuration, and health-check failure paths.

## Open constraint

The Node adapter is currently experimental: its HTTP and WebSocket end-to-end
tests are disabled in `deps/db-sync/test/logseq/db_sync/node_adapter_test.cljs`.
The installer must label this deployment as experimental and must not claim
production support.
