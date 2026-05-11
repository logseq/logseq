# Logseq CLI

## COMPACT-GIT-COMMIT (oldest first)
- 1a91084894

## Scope and sources of truth

This document is the current-state agent guide for the Logseq CLI under `docs/agent-guide/`.
It replaces the older CLI planning documents in this directory with one implementation-aligned reference.

Authoritative sources, in priority order:

1. Current implementation in `src/main/logseq/cli/`, especially `commands.cljs`, `command/*.cljs`, `main.cljs`, `config.cljs`, `root_dir.cljs`, `auth.cljs`, `server.cljs`, `format.cljs`, `humanize.cljs`, and `log.cljs`.
2. Current tests in `src/test/logseq/cli/` and shell e2e manifests under `cli-e2e/`.
3. The operator-facing CLI document at `docs/cli/logseq-cli.md` as an auxiliary reference only.
4. Live command help from the built CLI: `logseq --help`, `logseq <command> --help`, and `logseq <command> <subcommand> --help`.

Do not treat older `docs/agent-guide/*cli*.md` proposal files as current behavior. The public command table is the one assembled in `src/main/logseq/cli/commands.cljs`; helper namespaces such as `command/add.cljs` and `command/update.cljs` are internal implementation pieces for current commands and do not make `add` or `update` public commands.

Current non-public or removed interfaces:

- There is no public `add` command. Create and update flows use `upsert` subcommands.
- There is no public `update` command. Block update/move behavior is exposed through `upsert block` update mode.
- There is no public standalone `move` command. Moving a block uses `upsert block --id|--uuid` with `--target-*` and `--pos`.
- There is no `server status` command. Use `server list` for status-like inspection and `server cleanup` for revision-mismatched CLI-owned daemons.
- There is no current `--data-dir` global flag. Use `--root-dir`; graph storage is derived from it.
- `~/.logseq`, `~/logseq/cli-graphs`, and `~/.logseq/cli-graphs` are not current default CLI storage paths.
- Positional search queries are not supported. Use `search <scope> --content <text>`.

## Current CLI layout

The CLI is a Node-targeted ClojureScript program. `logseq.cli.main/run!` parses command-line arguments, resolves configuration, ensures the CLI root directory, builds an action from the parsed command, executes it, formats the result, and returns an exit code plus stdout payload. `logseq.cli.main/main` prints command output to stdout and exits non-zero for errors.

The current implementation layout is:

- `src/main/logseq/cli/main.cljs` - process entrypoint, result-to-exit-code handling, `--verbose`, and `--profile` orchestration.
- `src/main/logseq/cli/commands.cljs` - command table composition, top-level parsing, validation, action building, and dispatch to command namespaces.
- `src/main/logseq/cli/command/core.cljs` - shared global option spec, help rendering, graph/repo normalization, and parsing helpers.
- `src/main/logseq/cli/command/*.cljs` - command-family implementation modules.
- `src/main/logseq/cli/config.cljs` - config/env/flag resolution and config persistence.
- `src/main/logseq/cli/root_dir.cljs` - root-dir normalization and permission checks.
- `src/main/logseq/cli/server.cljs` - db-worker-node lifecycle, lock handling, server discovery, graph listing, and revision cleanup.
- `src/main/logseq/cli/auth.cljs` - persisted login state and browser-based login/logout flows.
- `src/main/logseq/cli/format.cljs`, `output_mode.cljs`, `humanize.cljs`, `style.cljs`, and `log.cljs` - human/JSON/EDN output, styling, humanized values, and stderr debug logs.

The CLI talks to `db-worker-node` through the transport layer and starts or reuses per-graph worker daemons as needed. The worker binds to localhost and publishes health/lock metadata used by server discovery.

## Command families and subcommands

The top-level help groups commands into graph inspection/editing, graph management, authentication, and utilities. The current public command set is assembled from the command namespace `entries` vectors and dynamic `example` entries.

### Graph inspect and edit

- `list page`
- `list tag`
- `list property`
- `list task`
- `list node`
- `list asset`
- `upsert block`
- `upsert page`
- `upsert task`
- `upsert asset`
- `upsert tag`
- `upsert property`
- `remove block`
- `remove page`
- `remove tag`
- `remove property`
- `query`
- `query list`
- `search block`
- `search page`
- `search property`
- `search tag`
- `show`

### Graph and server management

- `graph list`
- `graph create`
- `graph switch`
- `graph remove`
- `graph validate`
- `graph info`
- `graph export`
- `graph import`
- `graph backup list`
- `graph backup create`
- `graph backup restore`
- `graph backup remove`
- `server list`
- `server cleanup`
- `server start`
- `server stop`
- `server restart`
- `doctor`
- `sync status`
- `sync start`
- `sync stop`
- `sync upload`
- `sync download`
- `sync asset download`
- `sync remote-graphs`
- `sync ensure-keys`
- `sync grant-access`
- `sync config set`
- `sync config get`
- `sync config unset`

### Authentication and utilities

- `login`
- `logout`
- `completion`
- `debug pull`
- `skill show`
- `skill install`
- `example <selector...>`

`example` entries are generated from command metadata for the inspect/edit families `list`, `upsert`, `remove`, `query`, `search`, and `show`. Use exact selectors such as `example upsert page` or prefix selectors such as `example upsert`.

## Global flags and output modes

Global flags are defined in `logseq.cli.command.core/global-spec`:

| Flag | Alias | Meaning |
| --- | --- | --- |
| `--help` | `-h` | Show help. |
| `--version` | none | Show build time and revision. |
| `--config <path>` | none | Path to `cli.edn`; default is `<root-dir>/cli.edn`. |
| `--graph <name>` | `-g` | Target graph name. |
| `--root-dir <path>` | none | CLI root directory; default is `~/logseq`. |
| `--timeout-ms <n>` | none | Request timeout in milliseconds; default is `10000`. |
| `--output <human|json|edn>` | `-o` | Output format; default is human output. |
| `--verbose` | `-v` | Enable structured debug logging to stderr. |
| `--profile` | none | Print stage timing profile lines to stderr. |

Configuration precedence is CLI options over environment variables over `cli.edn` over defaults. Environment variables currently recognized by `config.cljs` include `LOGSEQ_CLI_GRAPH`, `LOGSEQ_CLI_ROOT_DIR`, `LOGSEQ_CLI_TIMEOUT_MS`, `LOGSEQ_CLI_LOGIN_TIMEOUT_MS`, `LOGSEQ_CLI_LOGOUT_TIMEOUT_MS`, `LOGSEQ_CLI_OUTPUT`, and `LOGSEQ_CLI_CONFIG`.

Supported structured output modes are `json` and `edn`. `human` is the default when no output mode is resolved.

`--verbose` and `--profile` write diagnostic output to stderr and should not be parsed as command stdout. `sync download` can stream progress lines to stdout when progress is enabled; for structured output, progress is disabled by default unless explicitly enabled.

## Paths, config, auth, and graph storage

Current defaults:

| Resource | Default |
| --- | --- |
| CLI root directory | `~/logseq` |
| Graph storage root | `<root-dir>/graphs` |
| CLI config file | `<root-dir>/cli.edn` |
| Server list file | `<root-dir>/server-list` |
| Auth file | `~/logseq/auth.json` |

`root_dir.cljs` normalizes `~`, resolves paths, creates the root directory if needed, and checks read/write access. A root-dir problem returns `:root-dir-permission` and the human formatter adds a permissions hint.

`config.cljs` sanitizes legacy config keys on read and update. `:auth-token`, `:retries`, and `:e2ee-password` are removed from persisted config data. Cloud login state is stored in `auth.json`, not `cli.edn`.

The current `cli.edn` keys include:

- `:graph` - active graph selected by `graph switch` or `graph create`.
- `:root-dir` - CLI root directory.
- `:output-format` or `:output` - output mode.
- `:timeout-ms` - transport request timeout.
- `:login-timeout-ms` and `:logout-timeout-ms` - browser callback timeouts.
- `:list-title-max-display-width` - human table title truncation width; default `40`.
- `:ws-url` and `:http-base` - sync runtime endpoints, also managed with `sync config`.
- `:custom-queries` - named query definitions consumed by `query --name` and listed by `query list`.

Graph directories live under `<root-dir>/graphs` and use the current graph-directory encoding helpers. User-visible graph names are stripped of internal DB prefixes in formatted graph output. `graph list` also detects legacy graph directories and can print warnings or rename suggestions for directories whose old names can be decoded.

`auth.cljs` uses browser-based Cognito login/logout:

- `login` starts a temporary callback server at `http://localhost:8765/auth/callback`, opens a browser, exchanges the authorization code, and writes `~/logseq/auth.json`.
- `logout` removes the auth file, opens the hosted logout endpoint, and waits for `http://localhost:8765/logout-complete`.
- The auth file contains Cognito token state such as `id-token`, `access-token`, `refresh-token`, `expires-at`, `sub`, `email`, and `updated-at`; formatted login output redacts tokens.

There is an internal `:auth-path` option in auth helpers for tests/config maps, but there is no current public `--auth-path` global flag.

## Server lifecycle, locking, cleanup, and revision compatibility

The CLI manages `db-worker-node` automatically for graph commands that need worker access. Manual server commands are available for inspection and lifecycle control.

Current server commands:

- `server list` discovers running db-worker-node servers for the current root-dir and rewrites the server-list file to drop dead entries.
- `server cleanup` terminates revision-mismatched servers only when they are CLI-owned.
- `server start --graph <name>` starts or reuses a graph worker.
- `server stop --graph <name>` stops a graph worker when ownership allows it.
- `server restart --graph <name>` stops then starts a graph worker, or starts one if none is running.

There is no `server status` command.

Lifecycle behavior comes from `server.cljs`:

- The server script path is `../static/db-worker-node.js` in debug builds and `../dist/db-worker-node.js` in release builds.
- Graph server discovery is scoped to the current root-dir.
- Server list entries are filtered by root-dir so one root cannot accidentally manage another root's workers.
- Worker health is read from `/healthz`, and the health payload includes status, repo, owner source, PID, host, port, and revision data.
- Lock ownership uses `owner-source` values such as `:cli`, `:electron`, and `:unknown`.
- CLI can manage CLI-owned workers and legacy `:unknown` workers; it returns `server-owned-by-other` for another owner.
- Startup cleans stale locks and waits for lock creation, server-list publication, and worker readiness.
- `server list` human output includes `OWNER` and `REVISION` columns and prints a warning when any server revision differs from the local CLI revision.
- `server cleanup` checks discovered servers, counts mismatches, skips non-CLI owners, and reports `checked`, `mismatched`, `eligible`, `skipped-owner`, `killed`, and `failed` data in structured output.

`doctor` checks the db-worker runtime script, root-dir permissions, running-server readiness, and server revision mismatch. A revision mismatch warning includes `logseq server restart --graph <name>` guidance for each affected graph.

## Inspect and edit workflows

Use `--graph` or a configured current graph for commands that operate on graph data.

### Listing

All `list` subcommands support common pagination and sorting options: `--fields`, `--limit`, `--offset`, `--sort`, and `--order`. The default sort field is `updated-at` and the default order is `desc`.

- `list page` supports page metadata expansion, built-in inclusion, journal filters, hidden pages, and created/updated time filters.
- `list tag` supports expanded metadata, built-in inclusion, tag properties, and tag extends.
- `list property` supports expanded metadata, built-in inclusion, classes, type, and cardinality. Type is included by default.
- `list task` filters by runtime-resolved task status, priority, and title content.
- `list node` requires at least one of `--tags` or `--properties`; the CSV selectors are trimmed, empty tokens are rejected, and combined filters use all-of semantics.
- `list asset` lists nodes tagged with `:logseq.class/Asset` and includes asset metadata fields when requested.

### Upserting

`upsert` is the current write surface:

- `upsert block` creates blocks from `--content`, `--blocks`, or `--blocks-file`, and updates existing blocks when `--id` or `--uuid` is present. Update mode can rewrite content, move the block with `--target-id`, `--target-uuid`, or `--target-page`, and mutate tags/properties with `--update-tags`, `--update-properties`, `--remove-tags`, and `--remove-properties`.
- `upsert page` creates or updates a page by `--page`, or updates a page by `--id`. It supports tag/property add and remove options.
- `upsert task` creates or updates task pages/blocks/nodes, ensures the `#Task` tag, sets task status/priority/scheduled/deadline properties, and supports `--no-status`, `--no-priority`, `--no-scheduled`, and `--no-deadline` clears. Generic tag/property mutation options are intentionally not supported on `upsert task`; use `upsert block` when generic mutation is needed.
- `upsert asset` creates an asset node from a local file path, attaches `#Asset`, stores file metadata, and copies the file into the graph `assets/` directory. Update mode accepts `--id` or `--uuid` and can update the title content; update mode rejects `--path`.
- `upsert tag` creates/upserts a tag by `--name`; with `--id`, it validates the target tag and optionally renames it.
- `upsert property` creates or updates a property by `--name`, or updates by `--id`; it supports `--type`, `--cardinality one|many`, `--hide`, and `--public`.

Compatibility guidance in parser errors maps old options to the current surface, for example `--tags` to `--update-tags`, `--properties` to `--update-properties`, and block `--status` to `upsert task --status`.

### Removing

Removal is split by entity kind:

- `remove block --id <id-or-edn-vector>` or `remove block --uuid <uuid>` removes blocks. An EDN vector of IDs is supported for multi-remove.
- `remove page --page <name>` or `remove page --id <id>` removes a page.
- `remove tag --name <name>` or `remove tag --id <id>` removes a public non-built-in tag.
- `remove property --name <name>` or `remove property --id <id>` removes a public non-built-in property.

Selectors that would be ambiguous or target the wrong entity type return structured errors and candidate lists when available.

### Search

Search uses scoped subcommands and requires `--content` or `-c`:

- `search block --content <text>` searches block titles.
- `search page --content <text>` searches page names.
- `search property --content <text>` searches property titles.
- `search tag --content <text>` searches tag titles.

Search is case-insensitive substring search. Page and block search filter recycled entities. Legacy positional queries such as `search block alpha` are rejected with guidance to use `--content`.

### Query

`query` runs Datascript queries:

- `query --query <edn> [--inputs <edn-vector>]` runs an inline EDN query.
- `query --name <name> [--inputs <edn-vector>]` runs a built-in or custom named query.
- `query list` lists built-in and `:custom-queries` entries from config.

Built-in query names currently defined in `command/query.cljs` are:

- `task-search`
- `recent-updated`
- `list-status`
- `list-priority`

`task-search` normalizes string status input into `:logseq.property/status.*` keywords. `recent-updated` requires a positive integer `recent-days`. Optional named-query inputs can be supplied via input specs and defaults; internal `?now-ms` inputs are hidden from `query list` output.

### Show

`show` renders a page or block tree:

- `show --page <name>` shows a page tree.
- `show --id <id-or-edn-vector>` shows one or more entities by db/id.
- `show --uuid <uuid>` shows one entity by UUID.
- `--level <n>` limits tree depth and must be at least `1`.
- `--linked-references` defaults to true and includes linked references unless set false.
- `--ref-id-footer` defaults to true and shows referenced-entity ID footer rows unless set false.
- `show --id` can read IDs from stdin when `--id` is present without a value.

Human `show` output prints `:db/id` in the first column, renders a tree, displays selected user and public built-in properties, resolves UUID references in text recursively up to a bounded depth, and prepends a breadcrumb for ordinary block roots. Structured `json`/`edn` output returns sanitized tree data and removes internal UUID fields from the output tree.

## Graph management, import/export, and backup

Graph management commands use `--graph` or the configured current graph, depending on the operation:

- `graph list` lists canonical graph names and legacy graph directory diagnostics.
- `graph create --graph <name>` creates or opens a graph and persists it as current graph.
- `graph switch --graph <name>` checks that the graph exists, starts/reuses its worker, and persists it as current graph.
- `graph remove --graph <name>` stops the graph worker when possible and unlinks the graph directory.
- `graph validate --graph <name> [--fix]` delegates validation to the worker.
- `graph info --graph <name>` reads graph metadata and `logseq.kv/*` values; human output redacts sensitive KV keys matching token/secret/password.
- `graph export --graph <name> --type edn|sqlite --file <path>` exports EDN graph data or a SQLite snapshot.
  - For `--type edn`, the CLI also accepts `--include-timestamps`, `--exclude-built-in-pages`, and `--exclude-namespaces <csv>`.
  - `--exclude-namespaces` is normalized as trimmed CSV values with empty segments removed and duplicates collapsed; the worker receives the final value as a keyword set.
  - `--exclude-namespaces` intentionally reduces some backend export validation strictness because excluded ontology namespaces cannot be validated the same way.
  - For `--type sqlite`, the CLI rejects those EDN-only flags and invokes `:thread-api/backup-db-sqlite` so the worker writes the snapshot directly to the requested file path.
- `graph import --graph <name> --type edn|sqlite --input <path>` imports EDN or SQLite data. SQLite import requires the target graph to be missing; EDN import can target a graph action that the worker can open.

Graph backups are SQLite snapshot helpers under the graph's backup directory:

- `graph backup list` lists backups for the selected graph.
- `graph backup create [--name <label>]` creates a backup named from the graph, optional label, and UTC timestamp.
- `graph backup restore --src <backup-name> --dst <graph-name>` restores a backup into a missing destination graph.
- `graph backup remove --src <backup-name>` removes a backup directory.

Backups store `db.sqlite` under `<root-dir>/graphs/<encoded-graph>/backup/<encoded-backup>/db.sqlite`. The backup commands are graph-database backups; auxiliary files such as search indexes are not listed as backup payloads in the CLI command implementation.

## Sync, doctor, debug, completion, skill, and example

### Sync

Sync commands live in `command/sync.cljs`.

Authenticated sync actions are `sync start`, `sync upload`, `sync download`, `sync asset download`, `sync remote-graphs`, `sync ensure-keys`, and `sync grant-access`; they resolve runtime auth from `auth.json` unless token data is already present in runtime config. `sync status`, `sync stop`, and `sync config` commands do not require the CLI login resolution path in the same way.

Current sync commands:

- `sync status --graph <name>` shows worker db-sync status.
- `sync start --graph <name> [--e2ee-password <password>]` configures runtime sync state, handles E2EE password availability when needed, starts db-sync, and waits for readiness or a clear failure state.
- `sync stop --graph <name>` stops db-sync for a graph worker.
- `sync upload --graph <name> [--e2ee-password <password>]` uploads the local graph snapshot.
- `sync download --graph <name> [--progress true|false] [--e2ee-password <password>]` downloads a remote graph into a new local graph. It creates an empty DB, requires the local graph to be missing, checks that the target DB is empty, uses a 30-minute download timeout by default, and cleans up a newly created graph on failure.
- `sync asset download --graph <name> --id <asset-db-id>` requests one remote asset download by the `ID` shown by `list asset`.
- `sync asset download --graph <name> --uuid <asset-uuid>` requests one remote asset download by asset block UUID.
- `sync remote-graphs` lists remote graphs visible to the current login context.
- `sync ensure-keys [--e2ee-password <password>] [--upload-keys]` ensures user RSA keys; `--upload-keys` asks the worker to ensure server-side presence.
- `sync grant-access --graph <name> --graph-id <uuid> --email <email>` grants graph access to an email.
- `sync config set|get|unset ws-url|http-base` manages non-auth sync config keys in `cli.edn`.

Sync config defaults are `wss://api.logseq.io/sync/%s` for `:ws-url` and `https://api.logseq.io` for `:http-base`. Missing required endpoint values for start/upload/download/asset-download/grant-access return `:missing-sync-config`.

`sync asset download` reuses the existing db-worker-node asset request API `:thread-api/db-sync-request-asset-download`; it does not add a dedicated worker API. The command requires sync to already be active for the graph and returns `:sync-not-started` with `logseq sync start --graph <graph>` guidance when the worker sync client is inactive. Before enqueueing, it resolves the asset node, verifies asset UUID/type/checksum/remote metadata, rejects external URL assets, checks the local `assets/<asset-uuid>.<asset-type>` file, skips matching checksums, and requests a re-download on checksum mismatch. It returns immediately after enqueue and does not return local filesystem paths. This first version intentionally does not accept `--e2ee-password`.

For E2EE graphs, `--e2ee-password` verifies and persists the password through worker sync crypt logic. Missing required E2EE password state returns `:e2ee-password-not-found` with a hint to provide `--e2ee-password`.

### Doctor

`doctor [--dev-script]` checks:

- the bundled db-worker runtime script, or `static/db-worker-node.js` when `--dev-script` is used;
- root-dir readability/writability;
- discovered running server readiness;
- server revision compatibility with the local CLI revision.

The command can return overall `ok`, `warning`, or `error`. Structured output preserves per-check payloads.

### Debug

`debug pull` pulls a raw entity using selector `[*]`:

- `debug pull --id <db-id>`
- `debug pull --uuid <uuid>`
- `debug pull --ident <edn-keyword>`

Exactly one selector is required. `--ident` must parse as a strict EDN keyword such as `:logseq.class/Tag`.

### Completion

`completion zsh`, `completion bash`, or `completion --shell zsh|bash` prints a shell completion script to stdout. Unsupported shells return `:invalid-options`.

### Skill

- `skill show` prints the built-in `logseq-cli` skill Markdown as raw human output regardless of requested output mode.
- `skill install` writes the skill to `./.agents/skills/logseq-cli/SKILL.md` under the current working directory.
- `skill install --global` writes the skill to `~/.agents/skills/logseq-cli/SKILL.md`.

### Example

`example <selector...>` prints runnable examples pulled from current command metadata. It supports group selectors such as `example list` and exact selectors such as `example list page` for the inspect/edit command families.

## Output contract and machine-readable behavior

All command executions format a result map with `:status` and either `:data` or `:error`. Errors produce exit code `1` unless a command explicitly overrides the exit code.

Human output:

- List and search commands render tables and a final `Count: N` line.
- Human tables use display-width-aware title truncation for list commands, with `:list-title-max-display-width` defaulting to `40`.
- Time values such as `UPDATED-AT`, `CREATED-AT`, and graph creation time are rendered in relative human form where applicable.
- Error output includes `Error (<code>): <message>` and may include `Hint:` or `Candidates:` lines.
- `show` renders an ID-prefixed tree and linked-reference sections when enabled.
- `query` human output is the `pr-str` of the query result, which is suitable for pipelines into commands such as `show --id`.

JSON output:

- Top-level shape is `{"status":"ok","data":...}` or `{"status":"error","error":...}`.
- Keyword keys are emitted as strings. Namespaced keyword keys use `namespace/name` form, for example `:block/title` becomes `"block/title"`.
- Keyword values are emitted as strings with namespace text when present, for example `:db.cardinality/one` becomes `"db.cardinality/one"`.
- UUID values are emitted as strings.
- For `doctor` errors, structured `data` is retained alongside `error` when available.

EDN output:

- EDN output preserves Clojure/EDN keywords and data shapes: `{:status :ok, :data ...}` or `{:status :error, :error ...}`.
- For `doctor` errors, structured `:data` is retained when available.

Special output behavior:

- `skill show` forces raw human Markdown output.
- `completion` returns the generated script as human message data.
- `sync download` progress uses stdout progress lines only when progress is enabled; structured output auto-disables progress unless explicitly overridden.
- `--verbose` and `--profile` write to stderr.

## Test coverage and verification sources

Use these paths to verify current behavior before editing CLI code or docs:

- Command parsing and dispatch: `src/test/logseq/cli/commands_test.cljs`.
- Command-family tests: `src/test/logseq/cli/command/*_test.cljs`.
- Config/root-dir/output/log/profile tests: `src/test/logseq/cli/config_test.cljs`, `root_dir_test.cljs`, `format_test.cljs`, `output_mode_test.cljs`, `log_test.cljs`, and `profile_test.cljs`.
- Server lifecycle tests: `src/test/logseq/cli/server_test.cljs` and `src/test/logseq/cli/command/server_test.cljs`.
- Auth tests: `src/test/logseq/cli/auth_test.cljs` and `src/test/logseq/cli/command/auth_test.cljs`.
- Shell e2e harness rules: `cli-e2e/AGENTS.md`.
- Non-sync shell e2e inventory: `cli-e2e/spec/non_sync_inventory.edn`.
- Sync shell e2e inventory: `cli-e2e/spec/sync_inventory.edn`.
- CLI operator reference: `docs/cli/logseq-cli.md`, with implementation/tests taking precedence when there is a conflict.

Useful verification commands:

```bash
bb dev:test -v logseq.cli.commands-test
bb dev:test -v logseq.cli.command.server-test
bb dev:test -v logseq.cli.command.sync-test
bb -f cli-e2e/bb.edn test --skip-build
bb -f cli-e2e/bb.edn test-sync --skip-build
```

For broad validation, use `bb dev:lint-and-test`. For CLI e2e, use the `cli-e2e/AGENTS.md` workflow and choose non-sync or sync suites explicitly.
