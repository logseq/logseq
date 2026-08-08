# Interactive self-hosted Sync manager

## Goal

Provide a low-configuration Linux-server deployment path for the experimental
DB Sync Node adapter. The primary path runs Sync Node and Caddy as native
systemd services without requiring Docker. The operator supplies a domain,
accepts or customizes the public and private port defaults, and receives the
exact HTTPS URL to enter in Logseq.

## Scope

The deployment assets will live under `deps/db-sync/deploy/` and include:

- a native `logseq-sync-native` entrypoint;
- a Dockerfile that builds the Node adapter and runs it;
- a Compose definition retained as an alternative deployment;
- Caddy reverse proxy configuration for automatic TLS;
- generated `sync.env` configuration, never committed with secrets.

The native installer targets one Debian or Ubuntu systemd host and one Sync
adapter instance. It installs its build/runtime dependencies, but does not run
a multi-node cluster, provide backups, or delete existing data.

## Operator flow

1. Run `sudo logseq-sync-native setup` to enter the guided flow.
2. Validate Linux and systemd, explain that the domain must be a hostname whose
   propagated public `A`/`AAAA` record points to this server, then prompt for
   and validate it. Show the addresses returned by DNS.
3. Prompt for the public HTTPS/WSS port with `10010` as the default, then prompt
   for the private loopback-only adapter port with `10011` as the default. Keep
   ACME HTTP validation on port `80`, explain the public/private exposure rules,
   reject duplicate ports, print the topology, and require one confirmation.
4. Install missing native build/runtime dependencies on Debian or Ubuntu.
5. Build into a new versioned release directory, then atomically switch the
   `current` symlink only after the build succeeds.
6. Generate systemd, adapter, and Caddy configuration. Normal setup uses the
   verified JWT identity embedded in the current Logseq client and does not ask
   for Cognito settings.
7. Start Sync Node and Caddy, then require successful private HTTP and public
   HTTPS `/health` checks before printing the Sync Server URL.

## Management commands

`logseq-sync-native` is a deployment manager, not an install-only script. Its
default setup is interactive, with named options available for automation:

```bash
logseq-sync-native setup
logseq-sync-native setup --domain <domain> --public-port <port> \
  --internal-port <port> --yes
logseq-sync-native update
logseq-sync-native status
logseq-sync-native logs --follow sync
logseq-sync-native logs --follow proxy
logseq-sync-native help
```

After `setup`, the manager checks systemd plus the unauthenticated private and
public `/health` endpoints. It reports success only when both return
`{"ok":true}`.

`status` reports service state, both health results, and the configured Sync
Server URL. `logs` prints the most recent 200 journal lines; `--follow` streams
new lines. `sync` selects the Node adapter and `proxy` selects Caddy.

On startup or health-check failure, the manager leaves releases and persistent
data intact, shows recent journal entries, and directs the operator to logs.

## Safety behavior

- Never remove the persistent data or Caddy certificate directories.
- Back up generated configuration with a timestamp before replacement.
- Bind the Node adapter to `127.0.0.1`; only Caddy listens publicly.
- Do not expose an HTTP mode in the native quickstart.

## Architecture

```text
Logseq Desktop/Web
  -> HTTPS/WSS :10010 (default, operator-configurable)
  -> Caddy systemd service
  -> DB Sync Node adapter at 127.0.0.1:10011
  -> persistent host data directory
     - index.sqlite
     - graphs/
     - assets/
```

Systemd runs a single adapter because graph state and active WebSocket
connections are held in process memory, while the adapter uses local SQLite.
Caddy owns public port 80 and the selected HTTPS port. The adapter bind address
is enforced in its own configuration rather than relying only on firewall
rules.

## Client compatibility

The existing client accepts a custom HTTP(S) Sync Server URL and derives the
matching WebSocket URL. It signs in through its embedded Logseq Cognito
configuration, so `logseq-client` is the only mode directly usable by an
unmodified client. `custom-client` is for operators who also build a client
configured for their own issuer.

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
- Start the generated systemd deployment.
- Verify `GET /health` returns `{"ok":true}`.
- Verify a client configured with the displayed URL can connect and create a
  graph using the selected verified-JWT mode.
- Run the non-interactive native-manager tests for default/custom port
  selection, default authentication, domain validation, generated service
  files, and one-shot status checks. Keep the Docker alternative tests green.

## Open constraint

The Node adapter is currently experimental: its HTTP and WebSocket end-to-end
tests are disabled in `deps/db-sync/test/logseq/db_sync/node_adapter_test.cljs`.
The installer must label this deployment as experimental and must not claim
production support.
