---
name: testing-electron-desktop
description: How to build and run the Logseq Electron desktop app (OCaml main process via Melange+vite) in dev on macOS/Linux AND how to test the packaged Windows build — GUI-spawn isolation, renderer log capture, NODE_ENV prod-detection gotcha, daemon spawn debugging.
---

# Testing the Logseq Electron desktop app (OCaml main)

Dev pipeline (from repo root):

```sh
OPAMSWITCH=<switch-with-melange-edn-melange> bb dev:electron-start
```

- `bb dev:electron-start` = `pnpm electron-watch` (gulp:watch + `cljs:electron-watch` [shadow-cljs :app → static/js/main.js] + `electron:dune-watch` + `electron:vite-watch`) then `pnpm dev-electron-app` once static/js/main.js is freshly built (gulp electron → `pnpm install --ignore-workspace --frozen-lockfile` in static/ → `electron .`).
- **opam switch**: `deps/db-worker/desktop/dune` requires `melange-edn-melange`. The ambient shell switch may lack it (on this machine `bonsai-ui` lacks it; `5.5.0` has it). Prefix with `OPAMSWITCH=5.5.0` or set the dir's default switch. Symptom: `Error: Library "melange-edn-melange" not found` and vite `[UNRESOLVED_IMPORT] Could not resolve '../desktop/electron_main.js'`.
- If `dune build js_api` silently succeeds but emits only entry JS (missing `desktop/*.js`), the `_build` emit state is stale/poisoned — `dune clean && dune build js_api bin/main.exe` under the right switch fixes it (takes ~2 min).
- **Dev window loads http://localhost:3001/** (shadow-cljs dev-http), NOT a file — killing the cljs watcher leaves a blank white window with `ERR_CONNECTION_REFUSED`.
- The native db-worker daemon in dev is `deps/db-worker/_build/default/bin/main.exe` (NOT a node process). Verify with `ps aux | grep "bin/main.exe"`. Its per-graph log: `<graphs-dir>/<Graph>/db-worker-node-<date>.log`.
- Default DB graphs dir is `~/logseq/graphs` (env override `LOGSEQ_GRAPHS_DIR`).
- electron-log file: `~/Library/Logs/Logseq/main.log` (productName "Logseq").
- On headless/CI boxes the Electron binary needs a display (Xvfb) — on macOS GUI sessions it just works.

## Windows packaged-build testing (NSIS + win-unpacked)

- Artifacts: `static/dist/Logseq-win-<arch>-<ver>-nsis.exe` (interactive wizard when `oneClick: false`) and `static/dist/win-unpacked/Logseq.exe` (same payload, no install). Per-user install lands in `%LOCALAPPDATA%\Programs\Logseq`; the daemon payload must be at `resources\db-worker-bin\main.exe` + `libsqlite3-0.dll`.
- **exec shells cannot spawn visible GUI windows** on the Devin Windows box (processes start in a non-interactive session — `cmd /c start foo.exe` silently produces nothing on the desktop, though the process may exist). Launch GUI apps only via the desktop session: File Explorer double-click, `super+r` Run dialog, or a `.bat` file run from the Run dialog. Taskkill/process inspection from exec works fine cross-session.
- **Renderer console capture**: prod builds have devtools disabled. Wrap the exe in a `.bat` and run it from `super+r`:
  ```bat
  set NODE_ENV=production
  "<install>\Logseq.exe" --enable-logging > out.log 2> err.log
  ```
  `err.log` then contains `INFO:CONSOLE` renderer lines and `electron: Failed to load URL` errors — the fastest way to see why the window is white.
- **Prod-mode detection gotcha (fixed 2026-10)**: `Electron_state.prod` previously checked ONLY `process_env NODE_ENV == "production"` (deps/db-worker/desktop/electron_state.ml); a packaged app launched normally saw dev=true → loaded `http://localhost:3001` → `ERR_CONNECTION_REFUSED` → permanent splash with all processes idle at 0 CPU. Fixed by also checking `app.isPackaged`. If a similar splash-stall ever recurs: check `%APPDATA%\Logseq\logs\main.log` (stops after `configure-auto-updater`), verify `NODE_ENV`, and relaunch with `set NODE_ENV=production` as a workaround. Also note: win32 `Unix.getpid` returns a handle, not an OS pid — daemon admission checks comparing `record.pid == getpid()` need a C stub (`GetCurrentProcessId`).
- **Stuck-splash triage**: check `%APPDATA%\Logseq\logs\main.log`, process CPU deltas (idle renderer = waiting, not loading), and `Get-NetTCPConnection` for the Logseq PIDs. The OCaml daemon only spawns when a graph is ensured — its absence at the picker screen is expected.
- **Daemon spawn debugging**: the app spawns `resources\db-worker-bin\main.exe` via `@logseq/graph-lifecycle` (`deps/graph-lifecycle/index.cjs` `startGraph`) with `stdio:'ignore'`, which hides the daemon's own stderr. To surface it: copy `deps/graph-lifecycle/*.cjs` to a temp dir, change `stdio:'ignore'` → `'inherit'`, then drive `resolveStorage(root, graphsDir)` → `createGraph(storage, repo)` → `startGraph({storage, repo, binary, owner:'electron', createEmpty:true})` from `node -e`. This reproduces app-context spawn failures verbatim (e.g. `Worker admission registration was revoked`).
- Graph state dirs on Windows: app lifecycle/locks under `%LOCALAPPDATA%\Logseq\runtime-locks`, graph lifecycle under `<parent-of-graphsDir>\.graph-lifecycle\<sha256>`, prefs at `%USERPROFILE%\.logseq`. Stale `runtime-locks` → `repo-locked`; delete it and retry.
