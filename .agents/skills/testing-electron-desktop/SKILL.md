---
name: testing-electron-desktop
description: How to build and run the Logseq Electron desktop app (OCaml main process via Melange+vite) in dev on macOS/Linux — opam switch gotcha, watch pipeline, daemon spawn, log locations.
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
