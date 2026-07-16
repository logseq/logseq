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
pnpm install   # run at the repo root if you haven't already
pnpm build:node-adapter

DB_SYNC_PORT=8787 \
DB_SYNC_DATA_DIR=~/logseq-sync-data \
node worker/dist/node-adapter.js
```

On startup without Cognito configuration the server enters **local mode**
and prints its access token:

```
Local sync mode: no Cognito auth configured.
Access token: 4f3c…9b21
(persisted at ~/logseq-sync-data/local-token; set DB_SYNC_LOCAL_TOKEN to override)
```

- The token is generated on first run, persisted in the data dir, and
  reused on every restart. Set `DB_SYNC_LOCAL_TOKEN` to choose your own.
- In local mode the token is the **only** accepted credential: Cognito/JWT
  verification is disabled and every request maps to a single local user
  (`DB_SYNC_LOCAL_USER_ID`, default `local-user`).
- `DB_SYNC_DATA_DIR` is the sync server's own private storage, not your graph folder. It holds the server's replica of each synced graph in its own layout (an index database, per-graph kvs SQLite files, uploaded assets). Your devices each keep their own local copy of the graph as usual; the server's data dir is just the hub they all reconcile against - it's like the server-side bucket, not a Logseq workspace.
- Graph data lives only on this server and the devices; nothing is sent to
  Logseq's services.

Keep the token secret. Only expose the server on a trusted network (LAN,
Tailscale/WireGuard) or behind TLS (`https://` reverse proxy).

## 2. Pair each device

The server also prints a pairing link and a QR code:

```
Pair a device: open http://server-local-ip:8787/pair#<token>
or scan:
█▀▀▀▀▀█ ▀▄█▄▀ █▀▀▀▀▀█ …
```

- **Phone**: scan the QR code with the camera → the pairing page opens in
  the browser → tap **Open in Logseq** → confirm. Done — no typing.
- **Another computer**: open the pairing link in a browser and click
  **Open in Logseq**, or configure manually.

Manual configuration (always available):

1. Open **Settings → Sync Server URL**.
2. Set the URL, e.g. `http://server-local-api:8787` (or your `https://` proxy).
3. Set **Access token** to the token printed by the server.
4. Save. No Logseq login is needed.

The pairing link carries the access token in the URL fragment, so it is
never sent over the network to the server; treat the link and QR code as
secrets like the token itself.

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
