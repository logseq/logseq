# Self-hosted sync (local, no account required)

Logseq DB graphs sync through a sync server. Besides the official Logseq
Sync service, you can run the bundled Node.js sync server yourself — on a
home server, NAS, VPS, or even the same desktop — and point every device at
it. In **local-token mode** the server needs no Logseq account and no
internet access: all devices authenticate with one shared secret.

This is the supported way to keep devices in sync on your own
infrastructure. Do **not** sync the raw graph SQLite files with tools like
Syncthing/Dropbox — the database is written in WAL mode and holds
per-device sync state, so file-level syncing corrupts graphs and cannot
merge concurrent edits.

## 1. Run the server

```bash
cd deps/db-sync
pnpm install
pnpm build:node-adapter

DB_SYNC_PORT=8787 \
DB_SYNC_DATA_DIR=~/logseq-sync-data \
DB_SYNC_LOCAL_TOKEN=$(openssl rand -hex 32) \
node worker/dist/node-adapter.js
```

- `DB_SYNC_LOCAL_TOKEN` — the shared secret. When set, it is the **only**
  accepted credential: Cognito/JWT verification is disabled and every
  request maps to a single local user (`DB_SYNC_LOCAL_USER_ID`, default
  `local-user`).
- `DB_SYNC_DATA_DIR` — where graph databases and assets are stored.
- Graph data lives only on this server and the devices; nothing is sent to
  Logseq's services.

Keep the token secret. Only expose the server on a trusted network (LAN,
Tailscale/WireGuard) or behind TLS (`https://` reverse proxy).

## 2. Point each device at it

On every device (desktop and mobile):

1. Open **Settings → Sync Server URL**.
2. Set the URL, e.g. `http://192.168.1.10:8787` (or your `https://` proxy).
3. Set **Access token** to the same value as `DB_SYNC_LOCAL_TOKEN`.
4. Save. No Logseq login is needed.

Then on the device that has the graph, open the graph menu and choose
**Use Logseq Sync** to upload it. Other devices will list the remote graph
and can download it; edits sync in near real time from then on.

## Notes

- Clearing the custom URL in Settings also clears the token and returns the
  app to the official Logseq Sync service.
- With a Logseq account instead of a token, the same self-hosted server can
  verify your account's tokens — set the `COGNITO_*` env vars instead of
  `DB_SYNC_LOCAL_TOKEN` (see `deps/db-sync/README.md`).
- Local-token mode is single-user: every device acts as the same user, so
  member invitations/roles don't apply.
