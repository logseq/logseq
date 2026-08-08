# Self-host Logseq Sync on Linux

The recommended lightweight deployment runs the Sync Node adapter and Caddy as
two native systemd services. It does not require Docker. Caddy serves
`HTTPS/WSS` on public port `10010` by default, obtains and renews the certificate, and
forwards traffic to the adapter on `127.0.0.1:10011`.

## Before you start

Use a dedicated systemd server on `x86_64` or `arm64`. The installer supports
Debian/Ubuntu (`apt`) and RPM-based cloud distributions (`dnf` or `yum`) whose
enabled repositories provide Java 17 or 21, including OpenCloudOS 9, Amazon
Linux 2023, and current RHEL-compatible distributions. On OpenCloudOS, the
installer also recognizes the distribution's Tencent KonaJDK 17 packages.
You need:

- a domain whose DNS `A`/`AAAA` record already points to the server;
- inbound TCP port `80` for certificate issuance and renewal;
- inbound TCP port `10010` by default, or the custom HTTPS port selected during setup;
- `sudo` access.

Do not expose the private adapter port printed in the deployment plan. The
installer also makes the adapter bind only to the loopback interface.

## Install

Clone the repository and run one command:

```bash
git clone https://github.com/logseq/logseq.git
cd logseq/deps/db-sync/deploy
sudo ./logseq-sync-native setup
```

Setup starts a guided flow. It asks for the domain, public HTTPS port, and
private Sync port. Press Enter to accept the port defaults, or enter other
available ports. It then prints the complete deployment plan for confirmation.

```text
Logseq Sync setup
This wizard will configure Sync Node, Caddy, automatic HTTPS, and systemd.
You only need a domain name, public HTTPS port, and private Sync port.

Step 1/3 - Sync domain name: sync.example.com
Step 2/3 - Public HTTPS port [10010]:
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

On the first run, the installer prepares the required build tools, a private
Node.js runtime, Clojure CLI, and Caddy. It then:

1. builds the adapter from the checked-out revision;
2. creates dedicated `logseq-sync` and `caddy` service users;
3. stores graph data under `/var/lib/logseq-sync`;
4. installs and starts both systemd services;
5. waits for the private and public health checks to pass;
6. prints the URL to enter in Logseq.

No Cognito values are requested in the normal flow. The installer uses the
verified JWT settings already used by an unmodified Logseq client.

After setup succeeds, enter the printed value in **Logseq → Settings → Advanced
→ Sync Server URL**:

```text
https://sync.example.com:10010
```

The URL must include `https://` and the selected port.

## Cloud firewall

Allow these inbound rules in the cloud provider's security group and in the
server firewall:

| Port | Source | Purpose |
| --- | --- | --- |
| TCP 80 | Internet | Automatic HTTPS certificate validation and renewal |
| Selected HTTPS port (default TCP 10010) | Internet | Logseq HTTPS and secure WebSocket traffic |

Port `443` is not used when the default port is selected. The adapter's internal
port is private and must not be opened. If another process already owns port
`80` or the selected HTTPS port, stop it or
integrate the generated Caddy site into the existing reverse proxy before
running setup.

## Operate and update

```bash
sudo logseq-sync-native status
sudo logseq-sync-native logs --follow sync
sudo logseq-sync-native logs --follow proxy
```

To update, move the checkout to the desired revision and rebuild atomically:

```bash
git -C ../../.. pull --ff-only
sudo logseq-sync-native update
```

Configuration and graph data are preserved. Each build is installed into a
separate release directory before the `current` link is switched, so a partial
build never replaces the running adapter. Rerunning `setup` preserves the data
directory and creates timestamped backups of generated configuration files.

## What gets installed

| Path | Contents |
| --- | --- |
| `/opt/logseq-sync` | private Node/Caddy tools and versioned adapter builds |
| `/etc/logseq-sync` | generated environment and Caddy configuration |
| `/var/lib/logseq-sync` | graph SQLite files and assets |
| `/var/lib/logseq-sync-caddy` | certificates and Caddy state |
| `/etc/systemd/system` | Sync and Caddy service units |
| `/usr/local/bin/logseq-sync-native` | management command |

The service is experimental. Back up `/var/lib/logseq-sync` before relying on
it for important graphs.

## Docker alternative

The existing Docker Compose manager remains available when container isolation
is preferred:

```bash
./logseq-sync setup
```

It exposes the same public `https://domain:10010` endpoint, but requires Docker
Engine and Docker Compose. Native deployment is the recommended path for small
servers that should not carry a container runtime.
