# Self-hosted Logseq MCP image

`ghcr.io/ssamdav/logseq-selfhost-mcp` runs the Logseq CLI headless inside a
container. The CLI stays logged in and synced with the self-hosted Logseq Sync
server (`images/sync`). The image exposes the CLI as an MCP server over
Streamable HTTP at `/mcp`.

Unlike the semantic REST API on the sync server, this works with end-to-end
encrypted graphs because the CLI decrypts them locally with the E2EE password.

## How it works

```
MCP client ──HTTP──► /mcp (node, stateless Streamable HTTP)
                       │ runs `logseq <command> --output json`
                       ▼
                    logseq CLI ──► db-worker-node (one per graph, /data/logseq/graphs)
                                      │ websocket sync
                                      ▼
                               self-hosted Logseq Sync server
```

On startup the server does the following:

1. It runs `logseq login --username --password` when `/data/logseq/auth.json` is
   missing. The CLI then refreshes the tokens itself. If the stored auth stops
   working, the server logs in again.
2. It restarts sync for every graph that was opened before. These graphs are
   listed in `/data/logseq-mcp/state.json`.
3. It opens any graphs listed in `LOGSEQ_GRAPHS`.
4. Every `SYNC_CHECK_INTERVAL_SECONDS`, it checks `sync status` for each open
   graph and runs `sync start` again when the websocket is not open.

## MCP tools

| Tool | CLI command |
| --- | --- |
| `list_remote_graphs` | `sync remote-graphs` |
| `list_local_graphs` | `graph list` + `sync status` |
| `open_graph` | `sync download` (first time) + `sync start` |
| `close_graph` | `sync stop` + `server stop` (+ `graph remove`) |
| `search` | `search block\|page\|property\|tag` |
| `show` | `show --page\|--uuid\|--id` |
| `list` | `list page\|tag\|property\|task\|node\|asset` |
| `query` | `query --query\|--name` |
| `insert_blocks` | `upsert block --blocks` |
| `update_block` | `upsert block --id\|--uuid` |
| `upsert_page` | `upsert page` |
| `upsert_task` | `upsert task` |
| `remove` | `remove block\|page\|tag\|property` |
| `logseq_cli` | any other command |
| `logseq_help` | `<command> --help` + `example <command>` |

The resource `logseq://skill/logseq-cli` serves the output of `logseq skill show`.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `LOGSEQ_SYNC_URL` | yes | Sync server HTTP base, for example `http://logseq-sync:8787`. The websocket URL defaults to `ws(s)://…/sync/%s`. |
| `LOGSEQ_SYNC_WS_URL` | no | Overrides the derived websocket URL. |
| `LOGSEQ_USERNAME`, `LOGSEQ_PASSWORD` | yes* | Logseq account. *Not needed if you provide `/data/logseq/auth.json` yourself. |
| `LOGSEQ_E2EE_PASSWORD` | for E2EE graphs | You can see it in the Logseq app under Settings → Encryption → Reset password → Current password. |
| `LOGSEQ_GRAPHS` | no | Comma-separated graphs to open on startup. |
| `MCP_TOKEN` | no | When set, `/mcp` requires `Authorization: Bearer <token>`. |
| `MCP_PORT` | no | Defaults to `8080`. |
| `SYNC_CHECK_INTERVAL_SECONDS` | no | Defaults to `60`. |

All state lives in `/data`: graphs, `auth.json`, the E2EE password, and the list
of open graphs. The E2EE password is stored in `kv-store.json`, encrypted with
the refresh token. See `docker-compose.yml` for a CasaOS example.

## Development

```bash
cd images/mcp/server
npm ci
npm test   # runs the MCP server against a fake logseq binary
```

The GitHub workflow `.github/workflows/build-selfhost-mcp-image.yml` handles builds:

- On a PR, it runs the tests and builds the image for amd64 and arm64 without pushing.
- On a merge to `master`, it also pushes the `latest` and `<sha>` tags.
