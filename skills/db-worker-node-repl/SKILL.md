---
name: db-worker-node-repl
description: Start `db-worker-node` in development and attach a `shadow-cljs` CLJS REPL (or editor nREPL session) to the `:db-worker-node` build for interactive debugging.
---

# db-worker-node REPL

## When to use

Use this skill when the user asks how to:

- start `db-worker-node` locally,
- start `shadow-cljs` REPL/nREPL,
- connect a CLJS REPL to the `:db-worker-node` runtime.

## Repo context

Commands below assume repo root:

- `/Users/rcmerci/gh-repos/logseq`

## Automation scripts (recommended)

This skill now includes two scripts under `scripts/`:

- `scripts/start-db-worker-node-repl.sh`
- `scripts/cleanup-db-worker-node-repl.sh`

Location:

- `/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/`

### Start script

`start-db-worker-node-repl.sh` automates the workflow:

1. starts/reuses `npx shadow-cljs watch db-worker-node`,
2. starts/reuses `node ./static/db-worker-node.js --repo <name>`,
3. attaches `npx shadow-cljs cljs-repl db-worker-node` (unless `--no-repl`).

Basic usage:

```bash
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/start-db-worker-node-repl.sh
```

Common options:

```bash
# Start with a specific repo and do not attach REPL
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/start-db-worker-node-repl.sh --repo demo --no-repl

# Pass extra args to db-worker-node
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/start-db-worker-node-repl.sh --repo demo -- --create-empty-db

# Override repo root
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/start-db-worker-node-repl.sh --repo-root /path/to/logseq
```

Environment overrides:

- `REPO_ROOT` (default: `/Users/rcmerci/gh-repos/logseq`)
- `DB_REPO` (default: `demo`)

State/log files created under:

- `<repo>/tmp/db-worker-node-repl/shadow-db-worker-node.log`
- `<repo>/tmp/db-worker-node-repl/db-worker-node.log`
- `<repo>/tmp/db-worker-node-repl/shadow-db-worker-node.pid`
- `<repo>/tmp/db-worker-node-repl/db-worker-node.pid`

### Cleanup script

`cleanup-db-worker-node-repl.sh` stops the processes tracked by PID files.

Basic usage:

```bash
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/cleanup-db-worker-node-repl.sh
```

Options:

```bash
# Force kill if graceful stop times out
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/cleanup-db-worker-node-repl.sh --force

# Override repo root
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/cleanup-db-worker-node-repl.sh --repo-root /path/to/logseq
```

## Editor nREPL attach flow (Calva/CIDER/Cursive)

If your editor connects to nREPL directly:

- Host: `localhost`
- Port: `8701`
- Build: `:db-worker-node`

For a CLJ-first session (for example CIDER), after connecting to nREPL run:

```clojure
(shadow.cljs.devtools.api/repl :db-worker-node)
```

## If `yarn watch` is already running

Still prefer the start script as the single entry point:

```bash
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/start-db-worker-node-repl.sh
```

If state becomes inconsistent, run cleanup first, then start again.

## Troubleshooting

### `shadow-cljs already running in project`

Cause: stale or conflicting shadow/db-worker-node processes.

Fix:

```bash
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/cleanup-db-worker-node-repl.sh
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/start-db-worker-node-repl.sh
```

### `repo is required`

Cause: runtime was started without `--repo`.

Fix:

```bash
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/start-db-worker-node-repl.sh --repo <name>
```

### `No available JS runtime`

Cause: shadow REPL is up but no live `:db-worker-node` runtime is attached.

Fix:

```bash
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/cleanup-db-worker-node-repl.sh
/Users/rcmerci/gh-repos/logseq/skills/db-worker-node-repl/scripts/start-db-worker-node-repl.sh --repo <name>
```

### Runtime/module startup errors in node process

If startup fails with missing module/bundled runtime errors, rebuild runtime artifacts first:

```bash
yarn db-worker-node:release:bundle
```

Then run the start script again.
