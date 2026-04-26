---
name: logseq-repl
description: Start and coordinate Logseq development REPL workflows for the Desktop renderer `:app` runtime and the `:db-worker-node` runtime while sharing a single `yarn watch` process.
---

# Logseq REPL workflows

Use this skill when the user needs a Logseq development REPL for:

- Desktop renderer `:app`
- `:db-worker-node`
- or both at once

This skill keeps both workflows coordinated through `<repo>/tmp/logseq-repl/` so they do not start multiple different REPL types at the same time with competing `shadow-cljs` servers.

## Cheat sheet

### Pick the right runtime

- Need DOM, UI, renderer state, page rendering? Use **Desktop app `:app` REPL**.
- Need Node worker behavior or db-worker-node code paths? Use **db-worker-node REPL**.
- Need Electron main process APIs? You probably need `:electron`, not this workflow.

Runtime reminders:

- `:app` = Electron renderer
- `:electron` = Electron main process
- `:db-worker` = browser worker
- `:db-worker-node` = Node worker

### Fast paths

Desktop `:app`:

```bash
.agents/skills/logseq-repl/scripts/start-desktop-app-repl.sh --no-repl
npx shadow-cljs cljs-repl app
```

`db-worker-node`:

```bash
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo demo --no-repl
npx shadow-cljs cljs-repl db-worker-node
```

Both runtimes:

```bash
.agents/skills/logseq-repl/scripts/start-desktop-app-repl.sh --no-repl
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo demo --no-repl
npx shadow-cljs cljs-repl app
npx shadow-cljs cljs-repl db-worker-node
```

### Preflight for Desktop `:app`

- close browser dev app instances before starting Desktop `:app`
- keep the Desktop window as the only renderer runtime you want to attach to

Why: the start script expects exactly one live `:app` runtime.

### Shared watch and logs

Both workflows share one `yarn watch` process.

Look here first:

- real shared watch log: `<repo>/tmp/logseq-repl/shared-shadow-watch.log`

Workflow-local files may exist but may stay mostly empty when shared watch is reused.

### Editor attach helpers

```clojure
(shadow.user/cljs-repl)
(shadow.user/worker-node-repl)
```

### Non-interactive verification examples

Desktop `:app`:

```bash
printf '(prn {:runtime :app :document? (some? js/document) :title (.-title js/document)})\n:cljs/quit\n' | npx shadow-cljs cljs-repl app
```

`db-worker-node`:

```bash
printf '(prn {:runtime :db-worker-node :process? (some? js/process) :platform (.-platform js/process)})\n:cljs/quit\n' | npx shadow-cljs cljs-repl db-worker-node
```

### Cleanup both workflows

```bash
.agents/skills/logseq-repl/scripts/cleanup-desktop-app-repl.sh
.agents/skills/logseq-repl/scripts/cleanup-db-worker-node-repl.sh
```

Expected behavior:

- cleaning one workflow keeps shared watch alive if the other is still active
- cleaning the last active workflow stops shared watch

---

## Details and troubleshooting

### Desktop app `:app` REPL

Scripts:

- `scripts/start-desktop-app-repl.sh`
- `scripts/cleanup-desktop-app-repl.sh`

Standard start:

```bash
.agents/skills/logseq-repl/scripts/start-desktop-app-repl.sh
```

Start without attaching:

```bash
.agents/skills/logseq-repl/scripts/start-desktop-app-repl.sh --no-repl
```

What it does:

1. starts or reuses `yarn watch`
2. waits for `:app` and `:electron` builds plus nREPL
3. starts or reuses `yarn dev-electron-app`
4. verifies one live `:app` runtime
5. runs a DOM smoke test
6. attaches `npx shadow-cljs cljs-repl app` unless `--no-repl` is used

### db-worker-node REPL

Scripts:

- `scripts/start-db-worker-node-repl.sh`
- `scripts/cleanup-db-worker-node-repl.sh`

Standard start:

```bash
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo demo
```

Start without attaching:

```bash
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo demo --no-repl
```

Pass extra runtime args:

```bash
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo demo -- --create-empty-db
```

What it does:

1. starts or reuses shared `yarn watch`
2. waits for the `:db-worker-node` build
3. starts or reuses `node ./static/db-worker-node.js --repo <name>`
4. runs a REPL connectivity check
5. attaches `npx shadow-cljs cljs-repl db-worker-node` unless `--no-repl` is used

### Run both `:app` and `:db-worker-node` together

Use one terminal or editor session per runtime.

Shared `yarn watch` is expected here. Do not rely on one interactive REPL session to cover both runtimes for you.

### Editor attach

If the start scripts already launched `yarn watch`, nREPL should be on `localhost:8701`.

#### Desktop `:app`

Direct shadow-cljs/editor attach:

- Host: `localhost`
- Port: `8701`
- Build: `:app`

CLJ-first attach:

```clojure
(shadow.cljs.devtools.api/repl :app)
```

Helper:

```clojure
(shadow.user/cljs-repl)
```

#### `db-worker-node`

Direct shadow-cljs/editor attach:

- Host: `localhost`
- Port: `8701`
- Build: `:db-worker-node`

CLJ-first attach:

```clojure
(shadow.cljs.devtools.api/repl :db-worker-node)
```

Helper:

```clojure
(shadow.user/worker-node-repl)
```

`shadow.user/worker-node-repl` picks the first available `:db-worker-node` runtime.

### Troubleshooting

#### Desktop `:app`: `No available JS runtime`

Cause: the Desktop renderer is not connected yet, or the Desktop window is not open.

Fix:

1. run `scripts/start-desktop-app-repl.sh --no-repl`
2. confirm the Desktop window is open
3. re-run the script without `--no-repl`, or attach from your editor

#### Desktop `:app`: wrong runtime attached

Cause: browser and Desktop renderer runtimes are both alive.

Fix: close the browser dev app and retry.

#### Desktop `:app`: connected to `:electron` by mistake

Symptom: DOM/browser globals are missing.

Fix: reconnect to `:app`, not `:electron`.

#### `db-worker-node`: `shadow-cljs already running in project`

Cause: stale or conflicting shadow/db-worker-node processes.

Fix:

```bash
.agents/skills/logseq-repl/scripts/cleanup-db-worker-node-repl.sh
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh
```

#### `db-worker-node`: `repo is required`

Fix:

```bash
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo <name>
```

#### `db-worker-node`: `No available JS runtime`

Fix:

```bash
.agents/skills/logseq-repl/scripts/cleanup-db-worker-node-repl.sh
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo <name>
```

#### `db-worker-node`: runtime/module startup errors

Rebuild runtime artifacts first:

```bash
yarn db-worker-node:release:bundle
```

## Recommended response pattern

When helping a user connect to one or both REPLs:

1. identify whether they need `:app`, `:db-worker-node`, or both
2. if they need Desktop `:app`, close browser dev app instances first
3. run the matching start script under `logseq-repl/scripts/`
4. if they need both runtimes, start both with `--no-repl`
5. attach from the matching build or helper
6. point troubleshooting at `tmp/logseq-repl/shared-shadow-watch.log`
7. run the matching cleanup script when finished
