# Self-host Logseq Sync on Linux

The recommended lightweight deployment runs a prebuilt Sync Node runtime and
Caddy as two native systemd services. It does not require Docker or a local
build environment. Caddy serves `HTTPS/WSS` on public port `443` by default,
obtains and renews the certificate, and forwards traffic to the adapter on
`127.0.0.1:10011`.

## Before you start

Use a systemd-based Linux server on `x86_64` or `arm64`. The server does not
need Node.js, Java, Clojure, pnpm, Python, gcc, or a Linux package manager. It
only needs standard base utilities (`curl`, `tar`, `sha256sum`, and
`sha512sum`) plus sudo.
The prebuilt runtime requires GLIBC 2.29 or newer, which covers current Debian,
Ubuntu, OpenCloudOS 9, TencentOS, and RHEL 9-compatible distributions. Setup
loads the bundled SQLite module before switching services, so an older or
otherwise incompatible host fails before its running release is replaced.

You also need:

- a domain whose DNS `A`/`AAAA` record already points to the server;
- inbound TCP port `80` for certificate issuance and renewal;
- inbound TCP port `443` by default, or the custom HTTPS port selected during setup;
- `sudo` access.

Do not expose the private adapter port printed in the deployment plan. The
installer binds the adapter to the loopback interface only.

## Install

Download the small management command from the native runtime release and run
the guided setup:

```bash
curl -fL \
  https://github.com/logseq/logseq/releases/download/db-sync-native/logseq-sync-native \
  -o /tmp/logseq-sync-native
curl -fL \
  https://github.com/logseq/logseq/releases/download/db-sync-native/logseq-sync-native.sha256 \
  -o /tmp/logseq-sync-native.sha256
cd /tmp
sha256sum --check logseq-sync-native.sha256
chmod +x logseq-sync-native
sudo ./logseq-sync-native setup
```

Setup automatically selects the Linux `x64` or `arm64` runtime, verifies its
SHA-256 checksum, installs the runtime, configuration, data, and Caddy under
one `/opt/logseq-sync` directory, and creates the two systemd services. The
Caddy version is pinned and its release archive is verified with SHA-512.
Compilation happens only in GitHub Actions, not on the server.

The setup wizard asks for the domain, public HTTPS port, and private Sync port.
Press Enter to accept the port defaults, or enter other available ports. It
prints the complete deployment plan before downloading or changing services.

```text
Logseq Sync setup
This wizard will configure a prebuilt Sync runtime, Caddy, automatic HTTPS, and systemd.
You only need a domain name, public HTTPS port, and private Sync port.

Step 1/3 - Sync domain name: sync.example.com
Step 2/3 - Public HTTPS port [443]:
Step 3/3 - Private Sync port [10011]:
```

The wizard explains each value before asking:

- **Domain** — enter a hostname only, without `https://` or a path. Its public
  `A`/`AAAA` record must have propagated and point to this server's public
  address. Setup prints the IP addresses returned by DNS.
- **Public HTTPS port** — Logseq clients use this port for HTTPS and secure
  WebSockets. Allow it through the cloud security group and server firewall.
- **Private Sync port** — Sync Node listens on `127.0.0.1` at this port and
  Caddy forwards requests to it. Never expose it publicly.
- **TCP 80** — Caddy uses it only to obtain and renew the HTTPS certificate.

Cloud NAT and multi-address hosts make it unreliable to infer the intended
public server address from local interfaces alone. Confirm that the displayed
DNS addresses belong to this server; setup then verifies the final public
`/health` endpoint before reporting success.

For unattended or repeatable deployment, provide named options explicitly:

```bash
sudo ./logseq-sync-native setup \
  --domain sync.example.com \
  --public-port 12000 \
  --internal-port 12001 \
  --yes
```

No Cognito values are requested in the normal flow. The installer uses the
verified JWT settings already used by an unmodified Logseq client.

After setup succeeds, enter the printed value in **Logseq → Settings → Advanced
→ Sync Server URL**:

```text
https://sync.example.com
```

The URL must include `https://`. Include the selected port only when it is not
the default HTTPS port `443`.

## Cloud firewall

Allow these inbound rules in the cloud provider's security group and in the
server firewall:

| Port | Source | Purpose |
| --- | --- | --- |
| TCP 80 | Internet | Automatic HTTPS certificate validation and renewal |
| Selected HTTPS port (default TCP 443) | Internet | Logseq HTTPS and secure WebSocket traffic |

The adapter's internal port is private and must not be opened. If another
process already owns port `80` or the selected HTTPS port, stop it or integrate
the generated Caddy site into the existing reverse proxy before running setup.

## Operate and update

```bash
sudo logseq-sync-native status
sudo logseq-sync-native logs --follow sync
sudo logseq-sync-native logs --follow proxy
sudo logseq-sync-native update
```

`update` checks the small checksum file first and downloads the runtime only
when the release changed. Configuration and graph data are preserved. The new
runtime is verified before the `current` link is switched. If restart, health,
or manager installation fails, the previous runtime is restarted and checked
before rollback is reported as successful. The active and previous runtimes
are retained for rollback; older runtime directories are pruned after a
successful update. The runtime also carries the corresponding management
command, so updates do not require another repository checkout.

For testing a fork or pinning a versioned runtime release, set the source on the
first setup:

```bash
sudo LOGSEQ_SYNC_RELEASE_REPOSITORY=owner/logseq \
  LOGSEQ_SYNC_RELEASE_TAG=db-sync-native-v1 \
  ./logseq-sync-native setup
```

The selected repository and tag are persisted for later updates.

To put the complete deployment somewhere other than `/opt/logseq-sync`, set
one home directory on the first setup. The installed management command
remembers its home through its symlink, so later commands need no extra option:

```bash
sudo LOGSEQ_SYNC_HOME=/srv/logseq-sync ./logseq-sync-native setup
sudo logseq-sync-native status
```

Use an absolute path containing only letters, digits, `/`, `.`, `_`, or `-` so
it can be represented safely in the generated systemd units.

## What gets installed

| Path | Contents |
| --- | --- |
| `/opt/logseq-sync/bin` | Caddy and the canonical management command |
| `/opt/logseq-sync/releases` | active and previous self-contained Sync runtimes |
| `/opt/logseq-sync/current` | active runtime symlink |
| `/opt/logseq-sync/config` | generated environment and Caddy configuration |
| `/opt/logseq-sync/data` | graph SQLite files and assets |
| `/opt/logseq-sync/caddy-data` | certificates and Caddy state |
| `/etc/systemd/system` | Sync and Caddy service units |
| `/usr/local/bin/logseq-sync-native` | symlink to the management command |

The service is experimental. Back up `/opt/logseq-sync/data` before relying on
it for important graphs. Back up the complete `/opt/logseq-sync` directory when
you also want to preserve configuration and existing certificates.

## Building and publishing runtimes

The `db-sync native runtime` GitHub Actions workflow builds on native Linux x64
and arm64 runners with Java 21 and Node.js 24. Each archive contains:

```text
logseq-sync-runtime/
  node/bin/node
  app/node-adapter.js
  app/node_modules/
  bin/logseq-sync-native
  VERSION
  ARCHITECTURE
```

Pull requests and the existing db-sync CI build and smoke-test both
architectures. A merge to `master` that changes the runtime inputs updates the
rolling `db-sync-native` installation channel automatically. The workflow can
also be run manually, or a `db-sync-native-v*` tag can publish a versioned
release. It uploads the runtime archives, checksums, manager, and manager
checksum as GitHub Release assets. Runtime build jobs use read-only repository
permissions; only the release job receives permission to write release assets.

## Docker alternative

The Docker Compose manager remains available when container isolation is
preferred. Run it on a Linux host from the deployment directory in a Logseq
checkout:

```bash
git clone https://github.com/logseq/logseq.git
cd logseq/deps/db-sync/deploy
./logseq-sync setup
```

It exposes the same public `https://domain` endpoint on port `443`, but requires Docker
Engine and Docker Compose.
