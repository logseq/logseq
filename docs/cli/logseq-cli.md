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

The CLI config file is located at `~/logseq/cli.edn`.

Supported keys include:
- `:graph` - The current active graph. Set this with `graph switch`.
- `:data-dir` - Directory where graphs are stored. Default is `~/logseq/graphs`. The graphs in this directory are user-facing graph names e.g. `demo` and do not start with `logseq_db_`.
- `:output-format` - Format for output. Default is `:human`. Use `:json` or `:edn` for scripting.
- `:list-title-max-display-width` - For `:human` output, the max display width for TITLE column, defaulting to `40`.
- `:http-base` - Http base domain for sync service. Interact with this via `sync config`.
- `:ws-url` - Websocket url for sync service. Interact with this via `sync config`.
- `:timeout-ms` - Request timeout in milliseconds.
- `:login-timeout-ms` - Login callback timeout. Defaults to 5 minutes.
- `:logout-timeout-ms` - Logout callback timeout. Defaults to 2 minutes.
- `:custom-queries` - Map of custom queries which are run with `query --name`. See [below for more](#custom-queries).

CLI global flags take precedence over environment variables, which take precedence over the config file. Here is a mapping of these three:

| Config key | Environment variable | Global flag |
| --- | --- | --- |
| :graph | $LOGSEQ_CLI_GRAPH | --graph |
| :data-dir | $LOGSEQ_CLI_DATA_DIR | --data-dir |
| :output-format | $LOGSEQ_CLI_OUTPUT | --output |
| :timeout-ms | $LOGSEQ_CLI_TIMEOUT_MS | --timeout-ms |
| :login-timeout-ms | $LOGSEQ_CLI_LOGIN_TIMEOUT_MS | n/a |
| :logout-timeout-ms | $LOGSEQ_CLI_LOGOUT_TIMEOUT_MS | n/a  |

Legacy notes:
* Migration note: If you previously used `~/.logseq/cli-graphs` or `~/.logseq/cli.edn`, pass `--data-dir` or `--config` to continue using those locations.
* `:e2ee-password` in `cli.edn` is ignored and removed silently during config read/update. Use `sync start --e2ee-password` or `sync download --e2ee-password` instead.
* `cli.edn` no longer persists cloud auth tokens. CLI login state is stored separately in `~/logseq/auth.json`.

### Custom Queries

Custom queries are defined in `:custom-queries` of a config file. This config is a map with the key as a query name and the value as a map with the following keys:
* `:query` - Required datalog query as a vector. Queries can use built-in rules from `logseq.db.frontend.rules` by appending `%` to the `:in` part of a query. See `logseq.cli.command.query` for example queries.
* `:doc` - Optional doc string describing the query.
* `:inputs` - Optional vector of inputs where each input is a map. Valid keys for the map are `:name` and `:default`. This defines positional arguments to a query e.g. the arguments a user passes map to these inputs and the `:in` bindings in a `:query`.

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
- `graph backup list` - list backup snapshots under `<data-dir>/backup`
- `graph backup create [--graph <name>] [--name <label>]` - create a backup snapshot for the selected graph
- `graph backup restore --src <backup-name> --dst <graph-name>` - restore one backup snapshot into a new graph
- `graph backup remove --src <backup-name>` - delete one backup snapshot

For any command that requires `--graph`, if the target graph does not exist, the CLI returns `graph not exists` (except for `graph create`). `graph import` and `graph backup restore` fail if the target graph already exists.

Backup scope note:
- `graph backup create` copies only `db.sqlite`.
- `search-db.sqlite` and `client-ops-db.sqlite` are intentionally excluded.

Server commands:
- `server list` - list running db-worker-node servers
- `server cleanup` - terminate revision-mismatched CLI-owned db-worker-node servers discovered from lock files in the current data-dir
- `server start --graph <name>` - start db-worker-node for a graph
- `server stop --graph <name>` - stop db-worker-node for a graph
- `server restart --graph <name>` - restart db-worker-node for a graph
- `doctor [--dev-script]` - run runtime diagnostics for `db-worker-node.js`, `data-dir` permissions, and running server readiness (`--dev-script` checks `static/db-worker-node.js` explicitly)

Auth commands:
- `login` - authenticate this machine and create/update `~/logseq/auth.json`
- `logout` - remove persisted CLI auth from `~/logseq/auth.json`

Debug commands:
- `debug pull --id <db-id> [--graph <name>]` - pull a raw entity by db id with selector `[*]`
- `debug pull --uuid <uuid> [--graph <name>]` - pull a raw entity by block UUID lookup
- `debug pull --ident <db-ident> [--graph <name>]` - pull a raw entity by `:db/ident` lookup
  - `--ident` must be a strict EDN keyword (for example `:logseq.class/Tag`)
  - exactly one of `--id`, `--uuid`, or `--ident` is required
  - if `--graph` is omitted, CLI falls back to current graph config

Utility commands:
- `completion <zsh|bash>` - generate shell completion script to stdout
- `example <command-or-prefix...>` - show runnable command examples for a command path or command prefix (phase 1 covers Graph Inspect and Edit commands)
  - exact selector example: `logseq example upsert page`
  - prefix selector example: `logseq example upsert`
- `skill show` - print built-in `logseq-cli` skill markdown to stdout
  - always prints raw markdown text, even when `--output json` or `--output edn` is set
- `skill install` - install built-in skill to `./.agents/skills/logseq-cli/SKILL.md`
- `skill install --global` - install built-in skill to `~/.agents/skills/logseq-cli/SKILL.md`

Setup for zsh (add to `~/.zshrc`):
```bash
autoload -Uz compinit && compinit
eval "$(logseq completion zsh)"
```

Setup for bash (add to `~/.bashrc`):
```bash
eval "$(logseq completion bash)"
```

Skill command examples:
```bash
# Print markdown content to stdout
logseq skill show

# Install for current working directory
logseq skill install

# Install for current user home directory
logseq skill install --global
```

Server ownership behavior:
- `server stop` and `server restart` can return `server-owned-by-other` if the daemon was started by another owner source.
- `server start` can return `server-start-timeout-orphan` when lock creation times out and orphan matching processes are detected.
- `server list` human output includes both `OWNER` and `REVISION` columns.
- `server list` prints a compatibility warning in human output when any server revision string is not exactly equal to the local CLI revision string.
- `server cleanup` checks discovered servers in the current data-dir, treats `revision != local CLI revision` (including missing revision) as mismatch, and attempts graceful-first termination only for `:owner-source :cli` targets.
- `server cleanup` structured output includes `checked`, `mismatched`, `eligible`, `skipped-owner`, `killed`, and `failed` summaries.
- Structured output (`--output json|edn`) includes per-server `revision` data but does not include human warning text.

Sync commands:
- `sync status --graph <name>` - show db-sync runtime state for a graph daemon
- `sync start --graph <name> [--e2ee-password <password>]` - start db-sync websocket client for a graph
- `sync stop --graph <name>` - stop db-sync client on a graph daemon
- `sync upload --graph <name>` - upload local graph snapshot to remote
- `sync download --graph <name> [--progress true|false] [--e2ee-password <password>]` - download remote graph `<name>` into a same-name local graph directory
- `sync remote-graphs [--graph <name>]` - list remote graphs visible to the current login context
- `sync ensure-keys [--graph <name>]` - ensure user RSA keys for sync/e2ee
- `sync grant-access --graph <name> --graph-id <uuid> --email <email>` - grant encrypted graph access to a user
- `sync config set [--graph <name>] ws-url|http-base <value>` - set non-auth db-sync runtime config key
- `sync config get [--graph <name>] ws-url|http-base` - get non-auth db-sync runtime config key
- `sync config unset [--graph <name>] ws-url|http-base` - remove non-auth db-sync runtime config key

Sync start behavior:
- `sync start --e2ee-password <password>` verifies the password against user encrypted private key before persisting it.
- Verification and persistence run in worker-side sync crypt logic (shared with desktop/web interaction paths).
- Wrong `--e2ee-password` fails fast and does not overwrite a previously stored encrypted password payload.

Sync upload behavior:
- `sync upload` requires `--graph <name>`.
- The CLI starts or reuses that graph's `db-worker-node`, applies the current sync config, and uploads the local snapshot only after the worker has resolved a usable remote graph id.
- If the local graph already has sync metadata, upload reuses the stored remote `graph-id`.
- If the local graph does not have a stored remote `graph-id`, upload first lists visible remote graphs and reuses an exact same-name match when one exists.
- If no same-name remote graph exists, upload creates a new remote graph and persists the returned remote metadata locally before snapshot transfer.
- Successful upload persists graph identity metadata locally in both client-op state and graph KV (`logseq.kv/graph-uuid`, `logseq.kv/graph-remote?`, and `logseq.kv/graph-rtc-e2ee?`) so CLI and web upload/bootstrap flows stay aligned.
- Fresh uploads default to encrypted remote graph creation unless local sync metadata explicitly marks the graph as non-e2ee. In headless CLI mode, run `logseq login` first so refresh-token based E2EE password persistence can be used by follow-up `sync start`/`sync download` flows.
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
- For e2ee remote graphs, provide `--e2ee-password` on `sync download` (or persist once via `sync start --e2ee-password`).
- If e2ee password is required but missing, `sync start`, `sync download`, and `sync status` return `e2ee-password-not-found` with a hint to provide `--e2ee-password`.

Sync config persistence:
- `sync config set/unset` writes non-auth sync config to the CLI config file selected by `--config`.
- If `--config` is not provided, the default config path is `~/logseq/cli.edn`.
- `sync config get` reads from that same config source.
- `:e2ee-password` is not part of sync config and is silently ignored when found in legacy `cli.edn`.
- Cloud auth is persisted separately in `~/logseq/auth.json`.

E2EE password persistence locations:
- Browser runtime stores refresh-token-encrypted password payload in IndexedDB secret storage.
- Node runtime stores refresh-token-encrypted password payload at `~/logseq/e2ee-password`.

Inspect and edit commands:
- `list page [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list pages (defaults to `--sort updated-at --order desc`)
- `list tag [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list tags (defaults to `--sort updated-at --order desc`)
- `list property [--expand] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list properties (defaults to `--sort updated-at --order desc`; `TYPE` and `CARDINALITY` are included by default even without `--expand`; missing schema cardinality is treated as `one`)
- `list task [--status <status>] [--priority <low|medium|high|urgent>] [-c|--content <text>] [--fields <csv>] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list task nodes tagged with `#Task` (supports both pages and blocks; defaults to `--sort updated-at --order desc`)
  - `--status` is validated at runtime using values from the current graph; invalid values return an error that includes available values from that graph.
- `list node [--tags <csv>] [--properties <csv>] [--fields <csv>] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list ordinary nodes (pages and blocks) filtered by tags/properties (supports selector forms id/uuid/ident/name; at least one of `--tags` or `--properties` is required; defaults to `--sort updated-at --order desc`)
  - `--tags` and `--properties` use **all-of** semantics, and when both are present they are combined with **AND**.
  - CSV tokens are trimmed and empty tokens are ignored; if a provided filter becomes empty after normalization, CLI returns `invalid-options`.
- `list asset [--fields <csv>] [--limit <n>] [--offset <n>] [--sort <field>] [--order asc|desc]` - list nodes tagged with `#Asset` (`:logseq.class/Asset`; defaults to `--sort updated-at --order desc`)
- `upsert block --content <text> [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - create blocks; defaults to today’s journal page if no target is given
- `upsert block --blocks <edn> [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - insert blocks via EDN vector
- `upsert block --blocks-file <path> [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - insert blocks from an EDN file
- `upsert block --id <id>|--uuid <uuid> [--content <text>] [--target-id <id>|--target-uuid <uuid>|--target-page <name>] [--pos first-child|last-child|sibling] [--update-tags <edn-vector>] [--update-properties <edn-map>] [--remove-tags <edn-vector>] [--remove-properties <edn-vector>]` - update and/or move a block
  - `--status` is not supported on `upsert block`; use `upsert task --status ...` for task status updates.
- `upsert page --page <name> [--update-tags <edn-vector>] [--update-properties <edn-map>] [--remove-tags <edn-vector>] [--remove-properties <edn-vector>]` - create (or update by page name) a page
- `upsert page --id <id> [--update-tags <edn-vector>] [--update-properties <edn-map>] [--remove-tags <edn-vector>] [--remove-properties <edn-vector>]` - update a page by id (cannot be combined with `--page`)
- `upsert task --content <text> [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling] [--status <status>] [--priority <low|medium|high|urgent>] [--scheduled <datetime>] [--deadline <datetime>] [--no-status] [--no-priority] [--no-scheduled] [--no-deadline]` - create a task block and ensure `#Task` is attached
- `upsert task --page <name> [--status <status>] [--priority <low|medium|high|urgent>] [--scheduled <datetime>] [--deadline <datetime>] [--no-status] [--no-priority] [--no-scheduled] [--no-deadline]` - create/update a task page and ensure `#Task` is attached
- `upsert task --id <id>|--uuid <uuid> [--status <status>] [--priority <low|medium|high|urgent>] [--scheduled <datetime>] [--deadline <datetime>] [--no-status] [--no-priority] [--no-scheduled] [--no-deadline]` - update an existing node and ensure `#Task` is attached
  - `--status` is validated at runtime using values from the current graph; invalid values return an error that includes available values from that graph.
  - generic task tag/property mutation options are not supported on `upsert task`; use `upsert block --update-tags/--update-properties/--remove-tags/--remove-properties` when needed.
  - for the same field, set and clear options are mutually exclusive (for example: `--status todo --no-status` is invalid).
- `upsert asset --path <asset-file-path> [--content <text>] [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]` - create an asset node, add `#Asset`, set asset metadata (`type`, `size`, `checksum`), and copy the local file into graph `assets/` as `<block-uuid>.<ext>`
- `upsert asset --id <id>|--uuid <uuid> [--content <text>]` - update an existing asset node title; target node must be tagged with `#Asset`
  - create mode requires `--path`; update mode rejects `--path`.
- `upsert tag --name <name>` - create or upsert a tag by name
- `upsert tag --id <id> [--name <name>]` - validate a tag by id; when `--name` is provided, rename that tag id (no-op if normalized name is unchanged)
- `upsert tag --id <id> --name <name>` conflicts: returns `tag-name-conflict` when target name is a non-tag page, and `tag-rename-conflict` when target name is another existing tag
- `upsert property --name <name> [--type <type>] [--cardinality one|many] [--hide true|false] [--public true|false]` - create or update a property by name
- `upsert property --id <id> [--type <type>] [--cardinality one|many] [--hide true|false] [--public true|false]` - update a property by id
- `move --id <id>|--uuid <uuid> --target-id <id>|--target-uuid <uuid>|--target-page <name> [--pos first-child|last-child|sibling]` - move a block and its children (defaults to first-child)
- `remove --id <id>|--uuid <uuid>|--page <name>` - remove blocks (by db/id or UUID) or pages
- `search block --content <query>` - search blocks by `:block/title` (case-insensitive substring)
- `search page --content <query>` - search pages by `:block/name` (case-insensitive substring)
- `search property --content <query>` - search properties by `:block/title` (Property entities only)
- `search tag --content <query>` - search tags by `:block/title` (Tag entities only)
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
  list property [options]   List properties
  list task [options]       List tasks
  list node [options]       List nodes
  list asset [options]      List assets
  upsert block [options]    Upsert block
  upsert page [options]     Upsert page
  upsert task [options]     Upsert task
  upsert asset [options]    Upsert asset
  upsert tag [options]      Upsert tag
  upsert property [options] Upsert property
  move [options]           Move block
  remove [options]          Remove block or page
  search block [options]    Search blocks by title
  search page [options]     Search pages by name
  search property [options] Search properties by title
  search tag [options]      Search tags by title
  show [options]            Show tree
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
- Global `--profile` enables stage timing output to **stderr**. This is for debugging latency and does not change command stdout payloads.
  - Human profile output is rendered as a tree (similar to `show` output style). The elapsed time column is printed at the far left with fixed width for alignment, for example:
    ```text
    146ms command=list status=ok
         stages
    146ms └── cli.total
      4ms     ├── cli.parse-args
    139ms     └── cli.execute-action
    129ms         └── transport.invoke:thread-api/cli-list-pages
    ```
- Human output is plain text. List/search commands render tables with a final `Count: N` line. For list and search subcommands, the ID column uses `:db/id` (not UUID). If `:db/ident` exists, an `IDENT` column is included. `list property` includes dedicated `TYPE` and `CARDINALITY` columns; `list node`/`list asset` include a dedicated `TYPE` column (page/block) and page context columns for blocks. Search table columns are `ID` and `TITLE`. For `list page|tag|property|task|node|asset` in human output, the `TITLE` column is display-width-aware (CJK-safe), defaults to max width `40`, and truncates overflow with `…`; set `:list-title-max-display-width` in `cli.edn` to override. JSON/EDN outputs keep full titles (no truncation). Block titles can include multiple lines; multi-line rows align additional lines under the `TITLE` column. Times such as list `UPDATED-AT`/`CREATED-AT` and `graph info` `Created at` are shown in human-friendly relative form. Errors include error codes and may include a `Hint:` line. Use `--output json|edn` for structured output.
- `example` human output includes `Selector`, `Matched commands`, and `Examples` sections. Structured output (`json`/`edn`) includes `selector`, `matched-commands`, `examples`, and `message` fields under `data`.
- `skill show` always prints raw markdown text to stdout, regardless of `--output` mode.
- `sync download` progress lines are streamed to stdout only when progress is enabled. In `json`/`edn` mode, progress is disabled by default unless `--progress true` is provided.
- JSON machine output preserves namespaced keyword semantics:
  - Namespaced keyword keys are emitted as canonical string keys in `namespace/name` form (for example `:block/title` -> `"block/title"`).
  - Unqualified keyword keys remain plain strings (for example `:status` -> `"status"`).
  - Keyword values are emitted as strings with namespace text preserved when present (for example `:db.cardinality/one` -> `"db.cardinality/one"`).
  - UUID values are emitted as strings.
- For `list property`, `TYPE` and cardinality are returned in default output (without `--expand`) for human and structured (`json`/`edn`) formats.
  - Human output renders cardinality as `one` or `many` in the `CARDINALITY` column.
  - JSON keeps namespaced key/value form via `"db/cardinality"` and values like `"db.cardinality/one"` or `"db.cardinality/many"`.
  - EDN keeps `:db/cardinality` (for example `:db.cardinality/one` or `:db.cardinality/many`).
  - When a property omits schema cardinality, CLI treats it as default `one`.

JSON key migration (flat -> namespaced):

| Old JSON key path | New JSON key path |
| --- | --- |
| `data.items[].title` | `data.items[].block/title` |
| `data.items[].id` | `data.items[].db/id` |
| `data.items[].type` | `data.items[].logseq.property/type` |
| `data.items[].cardinality` | `data.items[].db/cardinality` |
| `data.root.children[]` | `data.root.block/children[]` |
- `upsert page`, `upsert block`, `upsert task`, and `upsert asset` return entity ids in `data.result` for JSON/EDN output, and include ids in human output.
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
- `doctor` output includes overall status (`ok`, `warning`, `error`) and per-check rows for `db-worker-script`, `data-dir`, `running-servers`, and `server-revision-mismatch`. For scripting, `--output json|edn` keeps the structured check payload.
- Common doctor failures and warnings:
  - `doctor-script-missing`: `db-worker-node.js` runtime target is missing (default target: `dist/db-worker-node.js`; use `doctor --dev-script` to check `static/db-worker-node.js`).
  - `doctor-script-unreadable`: script path exists but is not a readable file.
  - `data-dir-permission`: configured data dir is not readable or writable.
  - `doctor-server-not-ready`: one or more lock-discovered servers are still in `:starting` state (warning).
  - `doctor-server-revision-mismatch`: one or more discovered servers use a different revision than the local CLI revision (warning). Follow the printed remediation command for each affected graph: `logseq server restart --graph <name>`.
  - If bundled runtime startup fails with missing-module or missing-file errors, rebuild with `yarn db-worker-node:release:bundle` and confirm `dist/db-worker-node.js` exists and every path listed in `dist/db-worker-node-assets.json` is present next to it.
- `query` human output returns a plain string (the query result rendered via `pr-str`), which is convenient for pipelines like `logseq query ... | xargs logseq show --id`.
- Built-in named queries currently include `block-search`, `task-search`, `recent-updated`, `list-status`, and `list-priority`. Use `query list` to see the full set for your config.
- Show output resolves block reference UUIDs inside text, replacing `[[<uuid>]]` with the referenced block content. Nested references are resolved recursively up to 10 levels to avoid excessive expansion. For example: `[[<uuid1>]]` → `[[some text [[<uuid2>]]]]` and then `<uuid2>` is also replaced.
- When `show` targets an ordinary block (`--id` or `--uuid`), human output prepends one breadcrumb line (`page > ... > nearest parent`) above the root block line. Each segment is display-width truncated to `24` with `…`.

```text
Project Alpha > Milestone 2026 > API rollout
5137 Implement retry policy for upload worker
5138 ├── Add timeout backoff guard
5139 └── Add deterministic retry test
```

- `show` tree lines print `:db/id` as the first column:

```text
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
node ./dist/logseq.js graph backup create --graph demo --name nightly
node ./dist/logseq.js graph backup list
node ./dist/logseq.js graph backup restore --src demo-nightly-20260101T000000Z --dst demo-restore
node ./dist/logseq.js graph backup remove --src demo-nightly-20260101T000000Z
node ./dist/logseq.js upsert block --target-page TestPage --content "hello world"
node ./dist/logseq.js move --uuid <uuid> --target-page TargetPage
node ./dist/logseq.js search block --content "hello"
node ./dist/logseq.js show --page TestPage --output json
node ./dist/logseq.js debug pull --graph demo --ident :logseq.class/Tag --output json
node ./dist/logseq.js server list
node ./dist/logseq.js doctor
node ./dist/logseq.js doctor --dev-script
node ./dist/logseq.js doctor --output json
node ./dist/logseq.js --graph demo sync start --e2ee-password "my-secret"
node ./dist/logseq.js --graph demo sync download --e2ee-password "my-secret"
node ./dist/logseq.js logout
```
