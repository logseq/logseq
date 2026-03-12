# Logseq CLI (Node)

The Logseq CLI is a Node.js program compiled from ClojureScript that connects to a db-worker-node server managed by the CLI. When installed, the CLI binary name is `logseq`.

## Build the CLI

```bash
npm install -g @vercel/ncc
clojure -M:cljs compile logseq-cli
yarn db-worker-node:release:bundle
```

`yarn db-worker-node:release:bundle` compiles and bundles `db-worker-node` with `@vercel/ncc`, and writes a standalone runtime to `dist/db-worker-node.js` plus an asset manifest at `dist/db-worker-node-assets.json` (which may contain an empty `assets` array when no extra files are required).

## db-worker-node lifecycle

`logseq` manages `db-worker-node` automatically. You should not start the server manually. The server binds to localhost on a random port and records that port in the repo lock file.

Desktop + CLI shared semantics:
- Electron desktop and CLI are expected to use the same `db-worker-node` and lock-file protocol for a graph.
- Disk SQLite under `~/logseq/graphs` is the source of truth; OPFS periodic export is not part of the desktop primary write path.
- If a daemon already exists for the graph, CLI reuses it via lock-file discovery instead of starting a second writer.
- If lock ownership is invalid or stale, startup cleans stale lock state before retrying.
- Lock metadata includes an `owner-source` value (`cli`, `electron`, `unknown`) and lifecycle actions enforce owner boundaries.
- `server stop` and `server restart` are owner-aware: CLI can only stop/restart servers it owns (or legacy `unknown` ownership).
- If lock is missing but a matching orphan `db-worker-node` process still exists for the same repo/data-dir, startup performs orphan cleanup before retrying.

## Run the CLI

```bash
node ./dist/logseq.js graph list
```

You can also use npm link to make ./dist/logseq.js globally available, run:
```
npm link
```

If installed(or linked) globally, run:

```bash
logseq graph list
```

## Configuration

Optional configuration file: `~/logseq/cli.edn`

Default data dir: `~/logseq/graphs`.

Graph directories on disk are stored as user-facing graph names (for example, `demo/`), not `logseq_db_` prefixed repo identifiers.

Migration note: If you previously used `~/.logseq/cli-graphs` or `~/.logseq/cli.edn`, pass `--data-dir` or `--config` to continue using those locations.

Supported keys include:
- `:graph`
- `:data-dir`
- `:timeout-ms`
- `:output-format` (use `:json` or `:edn` for scripting)
- sync config persisted via `sync config set|get|unset`: `:ws-url`, `:http-base`, `:e2ee-password`

`cli.edn` no longer persists cloud auth tokens. CLI login state is stored separately in `~/logseq/auth.json`.

CLI flags take precedence over environment variables, which take precedence over the config file.

## Authentication

Use `logseq login` to authenticate the current machine with Logseq cloud.

- `logseq login` starts a temporary callback server at `http://localhost:8765/auth/callback`, opens a browser to the Logseq Cognito Hosted UI, exchanges the returned authorization code, and writes `~/logseq/auth.json`.
- `logseq logout` removes `~/logseq/auth.json`, opens a browser to the Cognito Hosted UI logout endpoint, and completes the browser logout flow at `http://localhost:8765/logout-complete`.
- Sync commands still pass an in-memory runtime `:auth-token` to db-sync, but that token is now resolved from `auth.json` instead of `cli.edn`.

Default auth file: `~/logseq/auth.json`

Auth file contents include the persisted Cognito `id-token`, `access-token`, `refresh-token`, `expires-at`, `sub`, `email`, and `updated-at` values needed for headless refresh.

Verbose logging:
- `--verbose` enables structured debug logs to stderr for CLI option parsing and db-worker-node API calls.
- `sync download` can stream realtime progress lines to stdout when progress is enabled; debug previews remain truncated.

Timeouts:
- `--timeout-ms` continues to control request timeout behavior for CLI transport.
- Login callback timeout is controlled separately by `:login-timeout-ms` / `LOGSEQ_CLI_LOGIN_TIMEOUT_MS` and defaults to 5 minutes.
- Logout callback timeout is controlled separately by `:logout-timeout-ms` / `LOGSEQ_CLI_LOGOUT_TIMEOUT_MS` and defaults to 2 minutes.

## Commands

Graph commands:
- `graph list` - list all db graphs
- `graph create --graph <name>` - create a new db graph and switch to it
- `graph switch --graph <name>` - switch current graph
- `graph remove --graph <name>` - remove a graph
- `graph validate --graph <name>` - validate graph data
- `graph info [--graph <name>]` - show graph metadata (defaults to current graph)
- `graph export --type edn|sqlite --file <path> [--graph <name>]` - export a graph to EDN or SQLite
- `graph import --type edn|sqlite --input <path> --graph <name>` - import a graph from EDN or SQLite (new graph only)

For any command that requires `--graph`, if the target graph does not exist, the CLI returns `graph not exists` (except for `graph create`). `graph import` fails if the target graph already exists.

Server commands:
- `server list` - list running db-worker-node servers
- `server status --graph <name>` - show server status for a graph
- `server start --graph <name>` - start db-worker-node for a graph
- `server stop --graph <name>` - stop db-worker-node for a graph
- `server restart --graph <name>` - restart db-worker-node for a graph
- `doctor [--dev-script]` - run runtime diagnostics for `db-worker-node.js`, `data-dir` permissions, and running server readiness (`--dev-script` checks `static/db-worker-node.js` explicitly)

Auth commands:
- `login` - authenticate this machine and create/update `~/logseq/auth.json`
- `logout` - remove persisted CLI auth from `~/logseq/auth.json`

Shell completion:
- `completion <zsh|bash>` - generate shell completion script to stdout

Setup for zsh (add to `~/.zshrc`):
```bash
autoload -Uz compinit && compinit
eval "$(logseq completion zsh)"
```

Setup for bash (add to `~/.bashrc`):
```bash
eval "$(logseq completion bash)"
```

Server ownership behavior:
- `server stop` and `server restart` can return `server-owned-by-other` if the daemon was started by another owner source.
- `server start` can return `server-start-timeout-orphan` when lock creation times out and orphan matching processes are detected.
- `server list` human output includes both `OWNER` and `REVISION` columns.
- `server list` prints a compatibility warning in human output when any server revision string is not exactly equal to the local CLI revision string.
- Structured output (`--output json|edn`) includes per-server `revision` data but does not include human warning text.

Sync commands:
- `sync status --graph <name>` - show db-sync runtime state for a graph daemon
- `sync start --graph <name>` - start db-sync websocket client for a graph
- `sync stop --graph <name>` - stop db-sync client on a graph daemon
- `sync upload --graph <name>` - upload local graph snapshot to remote
- `sync download --graph <name> [--progress true|false]` - download remote graph `<name>` into a same-name local graph directory
- `sync remote-graphs [--graph <name>]` - list remote graphs visible to the current login context
- `sync ensure-keys [--graph <name>]` - ensure user RSA keys for sync/e2ee
- `sync grant-access --graph <name> --graph-id <uuid> --email <email>` - grant encrypted graph access to a user
- `sync config set [--graph <name>] ws-url|http-base|e2ee-password <value>` - set non-auth db-sync runtime config key
- `sync config get [--graph <name>] ws-url|http-base|e2ee-password` - get non-auth db-sync runtime config key
- `sync config unset [--graph <name>] ws-url|http-base|e2ee-password` - remove non-auth db-sync runtime config key

Sync upload behavior:
- `sync upload` requires `--graph <name>`.
- The CLI starts or reuses that graph's `db-worker-node`, applies the current sync config, and uploads the local snapshot only after the worker has resolved a usable remote graph id.
- If the local graph already has sync metadata, upload reuses the stored remote `graph-id`.
- If the local graph does not have a stored remote `graph-id`, upload first lists visible remote graphs and reuses an exact same-name match when one exists.
- If no same-name remote graph exists, upload creates a new remote graph and persists the returned remote metadata locally before snapshot transfer.
- Successful upload persists graph identity metadata locally in both client-op state and graph KV (`logseq.kv/graph-uuid`, `logseq.kv/graph-remote?`, and `logseq.kv/graph-rtc-e2ee?`) so CLI and web upload/bootstrap flows stay aligned.
- Fresh uploads default to encrypted remote graph creation unless local sync metadata explicitly marks the graph as non-e2ee. In headless CLI mode, run `logseq login` first and set `e2ee-password` via `sync config set` (or in `--config`) before uploading encrypted graphs.
- `sync upload` returns a real error instead of false success when login state, remote graph bootstrap, or snapshot upload fails.
- Common upload failures include missing/invalid CLI login state, missing `http-base`, remote graph creation failure, snapshot upload failure, and local DB/worker startup failure.
- Troubleshooting: after a successful upload, run `graph info --graph <name> --output json` and confirm `data.kv.logseq.kv/graph-uuid` is present. If it is missing, rerun `sync upload` for the same graph to trigger identity backfill.

Sync download behavior:
- `sync download` requires `--graph <name>`.
- If a local graph with the same name already exists, the CLI returns `graph-exists`.
- If no remote graph with that name exists, the CLI returns `remote-graph-not-found`.
- `sync download` starts `db-worker-node` in create-empty mode so local startup does not write `db-initial-data` before snapshot import.
- The final snapshot download/import invoke uses a command-specific long-running timeout (30 minutes by default) rather than the generic short-request timeout path.
- Progress streaming uses db-worker-node SSE `/v1/events` and shared `:rtc.log/download` events.
- `--progress` defaults to `true` for human output.
- For structured output (`--output json|edn`), progress is auto-disabled unless explicitly overridden with `--progress true`.
- `--progress false` always suppresses progress streaming.
- If the target graph DB is not empty at download time, the CLI returns `graph-db-not-empty` and aborts before import.
- For e2ee remote graphs in headless CLI mode, run `logseq login` first and set `e2ee-password` via `sync config set` (or in `--config`) before download.

Sync config persistence:
- `sync config set/unset` writes non-auth sync config to the CLI config file selected by `--config`.
- If `--config` is not provided, the default config path is `~/logseq/cli.edn`.
- `sync config get` reads from that same config source.
- Cloud auth is persisted separately in `~/logseq/auth.json`.

Inspect and edit commands:
- `list page [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list pages
- `list tag [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list tags
- `list property [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list properties (`TYPE` is included by default even without `--expand`)
- `upsert block --content <text> [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - create blocks; defaults to today’s journal page if no target is given
- `upsert block --blocks <edn> [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - insert blocks via EDN vector
- `upsert block --blocks-file <path> [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - insert blocks from an EDN file
- `upsert block --id <id>|--uuid <uuid> [--target-id <id>|--target-uuid <uuid>|--target-page <name>] [--pos first-child|last-child|sibling] [--update-tags <edn-vector>] [--update-properties <edn-map>] [--remove-tags <edn-vector>] [--remove-properties <edn-vector>]` - update and/or move a block
- `upsert page --page <name> [--update-tags <edn-vector>] [--update-properties <edn-map>] [--remove-tags <edn-vector>] [--remove-properties <edn-vector>]` - create (or update by page name) a page
- `upsert page --id <id> [--update-tags <edn-vector>] [--update-properties <edn-map>] [--remove-tags <edn-vector>] [--remove-properties <edn-vector>]` - update a page by id (cannot be combined with `--page`)
- `upsert tag --name <name>` - create or upsert a tag by name
- `upsert tag --id <id> [--name <name>]` - validate a tag by id; when `--name` is provided, rename that tag id (no-op if normalized name is unchanged)
- `upsert tag --id <id> --name <name>` conflicts: returns `tag-name-conflict` when target name is a non-tag page, and `tag-rename-conflict` when target name is another existing tag
- `upsert property --name <name> [--type <type>] [--cardinality one|many] [--hide true|false] [--public true|false]` - create or update a property by name
- `upsert property --id <id> [--type <type>] [--cardinality one|many] [--hide true|false] [--public true|false]` - update a property by id
- `move --id <id>|--uuid <uuid> --target-id <id>|--target-uuid <uuid>|--target-page <name> [--pos first-child|last-child|sibling]` - move a block and its children (defaults to first-child)
- `remove --id <id>|--uuid <uuid>|--page <name>` - remove blocks (by db/id or UUID) or pages
- `search <query> [--type page|block|tag|property|all] [--tag <name>] [--case-sensitive] [--sort updated-at|created-at] [--order asc|desc]` - search across pages, blocks, tags, and properties (query is positional)
- `query --query <edn> [--inputs <edn-vector>]` - run a Datascript query against the graph
- `query --name <query-name> [--inputs <edn-vector>]` - run a named query (built-in or from `cli.edn`)
- `query list` - list available named queries
- `show --page <name> [--level <n>]` - show page tree
- `show --uuid <uuid> [--level <n>]` - show block tree
- `show --id <id> [--level <n>]` - show block tree by db/id

Help output:

```
Subcommands:
  list page [options]      List pages
  list tag [options]       List tags
  list property [options]  List properties
  upsert block [options]   Upsert block
  upsert page [options]    Upsert page
  upsert tag [options]     Upsert tag
  upsert property [options] Upsert property
  move [options]           Move block
  remove [options]         Remove block or page
  search <query> [options] Search graph
  show [options]           Show tree
```

Options grouping:
- Help output separates **Global options** (apply to all commands) and **Command options** (command-specific flags).

Version output:
- `logseq --version` prints:

```
Build time: <timestamp>
Revision: <commit>
```

Output formats:
- Global `--output <human|json|edn>` applies to all commands
- Output formatting is controlled via global `--output`, `:output-format` in config, or `LOGSEQ_CLI_OUTPUT`.
- Human output is plain text. List/search commands render tables with a final `Count: N` line. For list and search subcommands, the ID column uses `:db/id` (not UUID). If `:db/ident` exists, an `IDENT` column is included. `list property` includes a dedicated `TYPE` column. Search table columns are `ID` and `TITLE`. Block titles can include multiple lines; multi-line rows align additional lines under the `TITLE` column. Times such as list `UPDATED-AT`/`CREATED-AT` and `graph info` `Created at` are shown in human-friendly relative form. Errors include error codes and may include a `Hint:` line. Use `--output json|edn` for structured output.
- `sync download` progress lines are streamed to stdout only when progress is enabled. In `json`/`edn` mode, progress is disabled by default unless `--progress true` is provided.
- For `list property`, `TYPE` is returned in default output (without `--expand`) for human and structured (`json`/`edn`) formats.
- `upsert page` and `upsert block` return entity ids in `data.result` for JSON/EDN output, and include ids in human output.
  - Human example:
    ```text
    Upserted page:
    [123]
    ```
  - Human example:
    ```text
    Upserted blocks:
    [201 202]
    ```
  - JSON example: `{"status":"ok","data":{"result":[123]}}`
  - EDN example: `{:status :ok, :data {:result [123]}}`
- `doctor` output includes overall status (`ok`, `warning`, `error`) and per-check rows for `db-worker-script`, `data-dir`, and `running-servers`. For scripting, `--output json|edn` keeps the structured check payload.
- Common doctor failures:
  - `doctor-script-missing`: `db-worker-node.js` runtime target is missing (default target: `dist/db-worker-node.js`; use `doctor --dev-script` to check `static/db-worker-node.js`).
  - `doctor-script-unreadable`: script path exists but is not a readable file.
  - `data-dir-permission`: configured data dir is not readable or writable.
  - `doctor-server-not-ready`: one or more lock-discovered servers are still in `:starting` state (warning).
  - If bundled runtime startup fails with missing-module or missing-file errors, rebuild with `yarn db-worker-node:release:bundle` and confirm `dist/db-worker-node.js` exists and every path listed in `dist/db-worker-node-assets.json` is present next to it.
- `query` human output returns a plain string (the query result rendered via `pr-str`), which is convenient for pipelines like `logseq query ... | xargs logseq show --id`.
- Built-in named queries currently include `block-search`, `task-search`, `recent-updated`, `list-status`, and `list-priority`. Use `query list` to see the full set for your config.
- Show and search outputs resolve block reference UUIDs inside text, replacing `[[<uuid>]]` with the referenced block content. Nested references are resolved recursively up to 10 levels to avoid excessive expansion. For example: `[[<uuid1>]]` → `[[some text [[<uuid2>]]]]` and then `<uuid2>` is also replaced.
- `show` human output prints the `:db/id` as the first column followed by a tree:

```
id1 block1
id2 ├── b2
id3 │   └── b3
id4 ├── b4
id5 │   ├── b5
id6 │   │   └── b6
id7 │   └── b7
id8 └── b8
```

Troubleshooting:
- If authenticated sync commands fail with missing or invalid local auth, run `logseq logout` and then `logseq login` again.
- You can also manually remove `~/logseq/auth.json` and repeat `logseq login`.

Examples:

```bash
node ./dist/logseq.js login
node ./dist/logseq.js graph create --graph demo
node ./dist/logseq.js graph export --type edn --file /tmp/demo.edn --graph demo
node ./dist/logseq.js graph import --type edn --input /tmp/demo.edn --graph demo-import
node ./dist/logseq.js upsert block --target-page TestPage --content "hello world"
node ./dist/logseq.js move --uuid <uuid> --target-page TargetPage
node ./dist/logseq.js search "hello"
node ./dist/logseq.js show --page TestPage --output json
node ./dist/logseq.js server list
node ./dist/logseq.js doctor
node ./dist/logseq.js doctor --dev-script
node ./dist/logseq.js doctor --output json
node ./dist/logseq.js logout
```
