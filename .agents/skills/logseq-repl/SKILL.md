---
name: logseq-repl
description: Start and coordinate Logseq development REPL workflows for the Desktop renderer `:app`, Electron main-process `:electron`, and `:db-worker-node` runtimes while sharing a single `yarn watch` process.
---

# Logseq REPL workflows

Use this skill when the user needs a Logseq development REPL for:

- Desktop renderer `:app`
- Electron main process `:electron`
- `:db-worker-node`
- or any combination of them

This skill keeps both workflows coordinated through `<repo>/tmp/logseq-repl/` so they do not start multiple different REPL types at the same time with competing `shadow-cljs` servers.

## Required preflight cleanup

Before starting or attaching any REPL, run both cleanup scripts:

```bash
.agents/skills/logseq-repl/scripts/cleanup-desktop-app-repl.sh
.agents/skills/logseq-repl/scripts/cleanup-db-worker-node-repl.sh
```

They stop only skill-managed Desktop, `db-worker-node`, and shared `shadow-cljs` processes. They do **not** guarantee a clean environment if another manually started or externally managed Logseq/shadow-cljs session is still running.

## Required post-cleanup port audit

Immediately after cleanup, verify the standard ports:

```bash
lsof -nP -iTCP:8701 -sTCP:LISTEN
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:3002 -sTCP:LISTEN
lsof -nP -iTCP:9630 -sTCP:LISTEN
lsof -nP -iTCP:9631 -sTCP:LISTEN
```

Interpretation:

- no listeners: clean enough to continue
- listeners after cleanup: external conflict first
- listeners only after startup: expected if owned by the workflow you just started

If listeners remain right after cleanup, stop and resolve that conflict before trusting later startup results.

## Readiness model: watch vs build vs runtime

Keep these separate:

1. **watch alive** — a `shadow-cljs` server or `yarn watch` process exists
2. **build ready** — the target build completed successfully
3. **runtime attached** — a live JS runtime is connected for `:app`, `:electron`, or `:db-worker-node`

Common failure mode:

- `yarn watch` is alive
- logs say `Build completed`
- runtime count is still `0`

If runtime count is `0`, do **not** attach yet. Fix runtime startup first.

## Cheat sheet

### Pick the right runtime

- Need DOM, UI, renderer state, page rendering? Use **Desktop app `:app` REPL**.
- Need Node worker behavior or db-worker-node code paths? Use **db-worker-node REPL**.
- Need Electron main process APIs, menus, window lifecycle, or main-process filesystem code? Use **Electron main-process `:electron` REPL**.

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

Electron `:electron`:

```bash
.agents/skills/logseq-repl/scripts/start-desktop-app-repl.sh --no-repl
npx shadow-cljs cljs-repl electron
```

`db-worker-node`:

```bash
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo demo --no-repl
npx shadow-cljs cljs-repl db-worker-node
```

Multiple runtimes:

```bash
.agents/skills/logseq-repl/scripts/start-desktop-app-repl.sh --no-repl
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh --repo demo --no-repl
npx shadow-cljs cljs-repl app
npx shadow-cljs cljs-repl electron
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
(shadow.user/electron-repl)
(shadow.user/worker-node-repl)
```

### Runtime-count health checks

Before attaching, verify that the intended runtime count is non-zero.

Check all runtimes at once:

```bash
npx shadow-cljs clj-eval "(do (require '[shadow.cljs.devtools.api :as api]) (println {:app (count (api/repl-runtimes :app)) :electron (count (api/repl-runtimes :electron)) :db-worker-node (count (api/repl-runtimes :db-worker-node))}))"
```

Interpretation:

- `:app > 0` means a Desktop renderer runtime is really attached
- `:electron > 0` means the Electron main-process runtime is really attached
- `:db-worker-node > 0` means the worker-node runtime is really attached
- `0` means **not ready yet**, even if watch/build logs look healthy

Do not run `npx shadow-cljs cljs-repl <build>` until the intended runtime count is non-zero.

### Non-interactive verification examples

Prefer heredocs over complex `printf` quoting.

Desktop `:app`:

```bash
cat <<'EOF' | npx shadow-cljs cljs-repl app
(prn {:runtime :app :document? (some? js/document) :title (.-title js/document)})
:cljs/quit
EOF
```

Electron `:electron`:

```bash
cat <<'EOF' | npx shadow-cljs cljs-repl electron
(prn {:runtime :electron :process? (some? js/process) :type (.-type js/process)})
:cljs/quit
EOF
```

`db-worker-node`:

```bash
cat <<'EOF' | npx shadow-cljs cljs-repl db-worker-node
(prn {:runtime :db-worker-node :process? (some? js/process) :platform (.-platform js/process)})
:cljs/quit
EOF
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

### Electron main-process `:electron` REPL

Use the same Desktop startup script because the Electron main process comes from the same `yarn dev-electron-app` session and shared `yarn watch`.

Standard start without attaching:

```bash
.agents/skills/logseq-repl/scripts/start-desktop-app-repl.sh --no-repl
```

Then attach `:electron`:

```bash
npx shadow-cljs cljs-repl electron
```

What it does:

1. starts or reuses `yarn watch`
2. waits for `:app` and `:electron` builds plus nREPL
3. starts or reuses `yarn dev-electron-app`
4. verifies the Desktop app is alive via the renderer smoke test
5. lets you attach `npx shadow-cljs cljs-repl electron`

Notes:

- there is no separate Electron main-process start script today; reuse `start-desktop-app-repl.sh`
- `:electron` and `:app` can both be attached against the same Desktop dev app session
- **watch ready is not enough**; `:electron` runtime count must be non-zero before attaching
- if `npx shadow-cljs cljs-repl electron` says `No available JS runtime`, first inspect runtime counts; do not keep retrying blindly

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

### Run multiple runtimes together

Use one terminal or editor session per runtime.

Examples:

- `:app` + `:electron`: start Desktop once with `--no-repl`, then attach each runtime separately
- `:app` + `:db-worker-node`: start both workflows with `--no-repl`, then attach separately
- `:electron` + `:db-worker-node`: start Desktop once plus db-worker-node once, then attach separately
- all three: one shared Desktop/watch workflow plus one db-worker-node workflow

Shared `yarn watch` is expected here. Do not rely on one interactive REPL session to cover multiple runtimes for you.

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

#### Electron `:electron`

Direct shadow-cljs/editor attach:

- Host: `localhost`
- Port: `8701`
- Build: `:electron`

CLJ-first attach:

```clojure
(shadow.cljs.devtools.api/repl :electron)
```

Helper:

```clojure
(shadow.user/electron-repl)
```

`shadow.user/electron-repl` ensures `:electron` is watched, then attaches to the Electron main-process runtime.

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

#### Failure triage order

When startup or attach fails, inspect evidence in this order before retrying:

1. `tmp/logseq-repl/shared-shadow-watch.log`
2. `tmp/desktop-app-repl/desktop-electron.log` or `tmp/db-worker-node-repl/*`
3. port listeners via `lsof`
4. runtime counts via `shadow.cljs.devtools.api/repl-runtimes`

Do not jump from a failed attach straight to another attach attempt.

#### `start-desktop-app-repl.sh` timed out or said watch is not ready

Possible causes:

- external port conflict after cleanup
- watch alive but expected ports or log patterns differ from the script assumptions
- builds completed but runtime count is still `0`

Triage:

1. read `tmp/logseq-repl/shared-shadow-watch.log`
2. rerun the port audit
3. check runtime counts
4. if runtime counts are all `0`, debug app startup next instead of attaching

#### Desktop `:app`: `No available JS runtime`

Cause: the Desktop renderer is not connected yet, or the Desktop window is not open.

Fix:

1. run `scripts/start-desktop-app-repl.sh --no-repl`
2. confirm the Desktop window is open
3. confirm `:app` runtime count is non-zero
4. only then attach from the script or editor

#### Desktop startup: ports already in use (`8701`, `9630`, `3001`, `3002`)

Cause: another Logseq/shadow-cljs dev session is already running, often one that was not started by these skill scripts.

How to confirm:

```bash
lsof -nP -iTCP:8701 -sTCP:LISTEN
lsof -nP -iTCP:9630 -sTCP:LISTEN
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:3002 -sTCP:LISTEN
```

If those listeners are not the PIDs tracked under `tmp/logseq-repl/`, `tmp/desktop-app-repl/`, or `tmp/db-worker-node-repl/`, the cleanup scripts will not stop them.

Fix:

1. stop the conflicting manually started dev session
2. rerun both cleanup scripts
3. rerun the port audit
4. retry `start-desktop-app-repl.sh` only after ports are clean

#### Desktop `:app`: wrong runtime attached

Cause: browser and Desktop renderer runtimes are both alive.

Fix: close the browser dev app and retry.

#### Desktop `:app`: connected to `:electron` by mistake

Symptom: DOM/browser globals are missing.

Fix: reconnect to `:app`, not `:electron`.

#### Electron `:electron`: `No available JS runtime`

Cause: the Electron main process is not connected yet, or `yarn dev-electron-app` has not finished starting.

Fix:

1. run `scripts/start-desktop-app-repl.sh --no-repl`
2. confirm the Desktop dev app is still open
3. confirm `:electron` runtime count is non-zero
4. only then run `npx shadow-cljs cljs-repl electron`

If build logs look healthy but `:electron` runtime count stays `0`, debug the Desktop app startup instead of retrying the attach command.

#### Electron desktop app exits quickly

Symptoms may include:

- `yarn dev-electron-app` exits almost immediately
- `gulp electron` reports incomplete async completion
- no `:app` or `:electron` runtime ever appears

Triage:

1. inspect `tmp/desktop-app-repl/desktop-electron.log`
2. inspect `tmp/logseq-repl/shared-shadow-watch.log`
3. inspect port conflicts

Do not attempt `cljs-repl electron` until runtime count is non-zero.

#### Electron `:electron`: browser globals are missing

Expected: `js/process` exists, but `js/document` usually does not.

Fix: if you need DOM/browser APIs, reconnect to `:app` instead.

#### `db-worker-node`: `shadow-cljs already running in project`

Cause: stale or conflicting shadow/db-worker-node processes.

Fix:

```bash
.agents/skills/logseq-repl/scripts/cleanup-db-worker-node-repl.sh
.agents/skills/logseq-repl/scripts/start-db-worker-node-repl.sh
```

Then confirm `:db-worker-node` runtime count is non-zero before attaching.

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

Then confirm runtime count before attaching.

#### `db-worker-node`: runtime/module startup errors

Rebuild runtime artifacts first:

```bash
yarn db-worker-node:release:bundle
```

## Recommended response pattern

When helping a user connect to one or more REPLs:

1. identify whether they need `:app`, `:electron`, `:db-worker-node`, or a combination
2. run both cleanup scripts
3. run the post-cleanup port audit; if standard ports are still occupied, treat that as an external conflict first
4. if they need Desktop `:app`, close browser dev app instances first
5. start the needed workflow: `start-desktop-app-repl.sh` for `:app`/`:electron`, `start-db-worker-node-repl.sh` for `:db-worker-node`
6. if they need multiple runtimes, start each workflow with `--no-repl`
7. verify runtime counts before attaching; do not assume watch/build readiness implies runtime readiness
8. attach from the matching build or helper: `shadow.user/cljs-repl`, `shadow.user/electron-repl`, or `shadow.user/worker-node-repl`
9. if something fails, inspect `tmp/logseq-repl/shared-shadow-watch.log` first, then use port checks, runtime counts, and app logs to triage instead of repeatedly retrying attach commands
10. run the matching cleanup script when finished
