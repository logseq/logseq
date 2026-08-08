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
- checksum-verified native runtime archives built for Linux `x64` and `arm64`;
- a GitHub Actions workflow that builds, smoke-tests, and publishes the archives;
- a Dockerfile that builds the Node adapter and runs it;
- a Compose definition retained as an alternative deployment;
- Caddy reverse proxy configuration for automatic TLS;
- generated `sync.env` configuration, never committed with secrets.

The native installer targets one glibc-based Linux systemd host and one Sync
adapter instance. The server does not compile source or install Node.js, Java,
Clojure, pnpm, Python, or compiler packages. It downloads a prebuilt runtime
and Caddy, but does not run a multi-node cluster, provide backups, or delete
existing data.

All deployment-owned files use one home directory, `/opt/logseq-sync` by
default. Its `bin`, `current`, `releases`, `config`, `data`, and `caddy-data`
children contain the executable tools, runtime, configuration, graph data, and
certificate state. Only the systemd unit files and the conventional
`/usr/local/bin/logseq-sync-native` symlink live outside that home. Operators
can select a different home once with `LOGSEQ_SYNC_HOME`.

## Operator flow

1. Run `sudo logseq-sync-native setup` to enter the guided flow.
2. Validate Linux and systemd, explain that the domain must be a hostname whose
   propagated public `A`/`AAAA` record points to this server, then prompt for
   and validate it. Show the addresses returned by DNS.
3. Prompt for the public HTTPS/WSS port with `10010` as the default, then prompt
   for the private loopback-only adapter port with `10011` as the default. Keep
   ACME HTTP validation on port `80`, explain the public/private exposure rules,
   reject duplicate ports, print the topology, and require one confirmation.
4. Select the prebuilt Linux `x64` or `arm64` runtime, download its archive and
   SHA-256 file from the configured GitHub Release, and reject incomplete,
   corrupt, or wrong-architecture packages.
5. Extract into a new versioned release directory, then atomically switch the
   `current` symlink only after validation succeeds. The archive supplies its
   own Node.js binary, compiled adapter, production `node_modules` (including
   the architecture-specific `better-sqlite3` addon), and manager command.
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

`update` downloads the configured rolling or versioned release, atomically
switches it, and restores the previous runtime if either health check fails.
It does not require a repository checkout on the server.

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

## Runtime build and release

GitHub Actions builds on native Linux x64 and arm64 runners with Java 21,
Node.js 24, and the pinned pnpm/Clojure toolchain. Compilation and native module
installation happen there, not on the target host. Each published archive has
this layout:

```text
logseq-sync-runtime/
  node/bin/node
  app/node-adapter.js
  app/node_modules/
  bin/logseq-sync-native
  VERSION
  ARCHITECTURE
```

The manager verifies the separately published SHA-256 value before extraction,
checks the declared architecture, and executes both the bundled Node.js runtime
and `better-sqlite3` loader before switching releases. Published Linux binaries
must not require a GLIBC version newer than 2.29.
This archive is preferred over a literal single executable because the adapter
loads `better-sqlite3` as a native `.node` addon from the filesystem. Hiding it
inside Node SEA or another single-file wrapper would add a fragile extraction
and module-resolution layer without reducing the target host requirements.

The rolling GitHub Release tag `db-sync-native` is the default install/update
channel. Tags matching `db-sync-native-v*` provide pin-able releases. Forks can
override the release repository during first setup; the manager persists that
choice for later updates.

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

- Build and package both runtime architectures in GitHub Actions.
- Extract each packaged runtime and start its bundled adapter in the workflow.
- Install the published runtime on a clean glibc/systemd host without a system
  Node.js, Java, Clojure, pnpm, Python, or compiler toolchain.
- Start the generated systemd deployment.
- Verify `GET /health` returns `{"ok":true}`.
- Verify a client configured with the displayed URL can connect and create a
  graph using the selected verified-JWT mode.
- Run the non-interactive native-manager tests for default/custom port
  selection, default authentication, domain validation, checksum and
  architecture rejection, generated service files, update rollback path, and
  one-shot status checks. Keep the Docker alternative tests green.

## Open constraint

The Node adapter is currently experimental: its HTTP and WebSocket end-to-end
tests are disabled in `deps/db-sync/test/logseq/db_sync/node_adapter_test.cljs`.
The installer must label this deployment as experimental and must not claim
production support.
