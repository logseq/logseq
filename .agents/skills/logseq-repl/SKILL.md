---
name: logseq-repl
description: Start and coordinate Logseq development REPL workflows for the Desktop renderer `:app`, Electron main-process `:electron`, and `:db-worker-node` runtimes through one unified workflow.
---

# Logseq REPL Workflow

Use this skill when the user needs a Logseq development REPL for:

- Desktop renderer `:app`
- Electron main process `:electron`
- `:db-worker-node`
- any combination of those runtimes

The workflow uses one shared state directory: `<repo>/tmp/logseq-repl/`.

## Scripts

Start everything:

```bash
./scripts/start-repl.sh --repo demo
```

Clean up everything:

```bash
./scripts/cleanup-repl.sh
```

Verify all REPL targets after startup:

```bash
./scripts/verify-repls.sh
```

`start-repl.sh` starts:

1. shared `pnpm watch`
2. Desktop dev app via `pnpm dev-electron-app`
3. `db-worker-node` via `node ./static/db-worker-node.js --repo <name>`

`start-repl.sh` is a small shell wrapper around `start-repl.py`. The Python script verifies that `:app`, `:electron`, and `:db-worker-node` runtimes are live, runs `verify-repls.sh` to connect to each target REPL and print a small result, then prints attach commands. It does not attach an interactive REPL by itself and exits after verification.

`cleanup-repl.sh` stops all workflow-managed processes without requiring a target selection. It also removes legacy state files from older split workflows and attempts to stop repo-owned listeners on the standard REPL ports.

`verify-repls.sh` connects to `app`, `electron`, and `db-worker-node` with `pnpm exec shadow-cljs cljs-repl`, evaluates one target-specific expression in each REPL, and prints the output.

## Standard Flow

Before starting or attaching:

```bash
./scripts/cleanup-repl.sh
```

Then start all runtimes:

```bash
./scripts/start-repl.sh --repo demo
```

Attach only to the target you need:

```bash
pnpm exec shadow-cljs cljs-repl app
pnpm exec shadow-cljs cljs-repl electron
pnpm exec shadow-cljs cljs-repl db-worker-node
```

## Runtime Selection

- Need DOM, UI, renderer state, or page rendering? Use `:app`.
- Need Electron main process APIs, menus, window lifecycle, or main-process filesystem behavior? Use `:electron`.
- Need Node worker behavior or db-worker-node code paths? Use `:db-worker-node`.

Runtime reminders:

- `:app` = Electron renderer
- `:electron` = Electron main process
- `:db-worker` = browser worker
- `:db-worker-node` = Node worker

## Readiness Model

Keep these separate:

1. watch alive: a `shadow-cljs` server or `pnpm watch` process exists
2. build ready: the target build completed successfully
3. runtime attached: a live JS runtime is connected for `:app`, `:electron`, or `:db-worker-node`

If runtime count is `0`, do not attach yet. Fix runtime startup first.

Check runtime counts:

```bash
pnpm exec shadow-cljs clj-eval "(do (require '[shadow.cljs.devtools.api :as api]) (println {:app (count (api/repl-runtimes :app)) :electron (count (api/repl-runtimes :electron)) :db-worker-node (count (api/repl-runtimes :db-worker-node))}))"
```

Interpretation:

- `:app > 0` means a Desktop renderer runtime is attached
- `:electron > 0` means an Electron main-process runtime is attached
- `:db-worker-node > 0` means a worker-node runtime is attached
- `0` means not ready, even if watch/build logs look healthy

## Logs

Look here first:

- `<repo>/tmp/logseq-repl/shared-shadow-watch.log`
- `<repo>/tmp/logseq-repl/desktop-electron.log`
- `<repo>/tmp/logseq-repl/db-worker-node.log`

## Port Audit

After cleanup, verify standard ports if startup still reports conflicts:

```bash
lsof -nP -iTCP:8701 -sTCP:LISTEN
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:3002 -sTCP:LISTEN
lsof -nP -iTCP:9630 -sTCP:LISTEN
lsof -nP -iTCP:9631 -sTCP:LISTEN
```

Interpretation:

- no listeners: clean enough to continue
- listeners after cleanup: resolve the external conflict first
- listeners only after startup: expected if owned by the workflow

## Non-Interactive Verification Examples

Desktop `:app`:

```bash
cat <<'EOF' | pnpm exec shadow-cljs cljs-repl app
(prn {:runtime :app :document? (some? js/document) :title (.-title js/document)})
:cljs/quit
EOF
```

Electron `:electron`:

```bash
cat <<'EOF' | pnpm exec shadow-cljs cljs-repl electron
(prn {:runtime :electron :process? (some? js/process) :type (.-type js/process)})
:cljs/quit
EOF
```

`db-worker-node`:

```bash
cat <<'EOF' | pnpm exec shadow-cljs cljs-repl db-worker-node
(prn {:runtime :db-worker-node :process? (some? js/process) :platform (.-platform js/process)})
:cljs/quit
EOF
```

## Editor Attach Helpers

```clojure
(shadow.user/cljs-repl)
(shadow.user/electron-repl)
(shadow.user/worker-node-repl)
```

## Troubleshooting

Failure triage order:

1. inspect `tmp/logseq-repl/shared-shadow-watch.log`
2. inspect `tmp/logseq-repl/desktop-electron.log`
3. inspect `tmp/logseq-repl/db-worker-node.log`
4. inspect standard port listeners with `lsof`
5. inspect runtime counts with `shadow.cljs.devtools.api/repl-runtimes`

Common cases:

- `No available JS runtime`: the build may be ready, but the runtime has not connected. Check runtime counts before retrying attach.
- multiple `:app` runtimes: close browser dev app instances so only the Desktop renderer remains.
- ports already in use after cleanup: another Logseq/shadow-cljs dev session is still running.
- `db-worker-node` repo mismatch: rerun `start-repl.sh --repo <name>`; it restarts the worker runtime for the requested repo.

## Recommended Response Pattern

When helping a user connect to a REPL:

1. identify whether they need `:app`, `:electron`, `:db-worker-node`, or a combination
2. run `cleanup-repl.sh`
3. if standard ports remain occupied, resolve that conflict first
4. run `start-repl.sh --repo <name>`
5. verify runtime counts if attach fails
6. attach to the matching build or helper
7. run `cleanup-repl.sh` when finished
