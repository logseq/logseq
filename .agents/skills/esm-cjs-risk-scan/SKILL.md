---
name: esm-cjs-risk-scan
description: Scan Logseq ClojureScript Node/Electron targets for npm module loading risks, especially ESM-only packages that may fail when loaded through js/require or shadow-cljs require-based shims. Use when changing Electron/main-process dependencies, debugging startup import errors, or auditing packages before dependency upgrades.
---

# ESM/CJS Risk Scan

Scan Node/Electron ClojureScript code for npm dependencies that may fail at runtime due to ESM/CJS incompatibility. Use when changing Electron dependencies, debugging startup import errors, or auditing before dependency upgrades.

## Quick Start

```bash
# Default scan (electron scope, human-readable table)
node .agents/skills/esm-cjs-risk-scan/scripts/scan_esm_cjs_risk.mjs

# Scan all Node targets
node .agents/skills/esm-cjs-risk-scan/scripts/scan_esm_cjs_risk.mjs --scope all-node

# Machine-readable TSV output
node .agents/skills/esm-cjs-risk-scan/scripts/scan_esm_cjs_risk.mjs --format tsv

# JSON output
node .agents/skills/esm-cjs-risk-scan/scripts/scan_esm_cjs_risk.mjs --format json

# Show full error details in probe results
node .agents/skills/esm-cjs-risk-scan/scripts/scan_esm_cjs_risk.mjs --verbose
```

## Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `--scope` | `electron`, `all-node` | `electron` | Which source directories and package locations to scan |
| `--format` | `table`, `tsv`, `json` | `table` | Output format. `table` is grouped and human-readable; `tsv` is tab-separated for machine parsing; `json` for programmatic use |
| `--verbose` / `-v` | (flag) | off | Show full error messages in probe results instead of abbreviated `ERR` |

### Scopes

| Scope | Source Directories | Description |
|-------|-------------------|--------------|
| `electron` | `src/electron/electron` | Electron main-process code only |
| `all-node` | See table below | All Node/server-side code across the repo |

**`all-node` source directories and their basis:**

| Directory | Build target / role |
|-----------|---------------------|
| `src/electron/electron` | `:electron` target — `:node-script` (Electron main process) |
| `src/test` | `:test` / `:test-no-worker` — `:node-test` (test runner) |
| `deps/cli/src` | CLI tool (nbb Node script, uses `fs-extra`, `path`) |
| `deps/db-sync/src`, `deps/db-sync/test` | DB sync server / Node adapter |
| `deps/db/script`, `deps/db/test` | DB utility scripts |
| `deps/graph-parser/src`, `test`, `script` | Graph parser CLI and tests |
| `deps/publishing/script`, `test` | Publishing CLI and tests |

Browser/Worker builds (`:app`, `:db-worker`, `:inference-worker`, `:mobile`) are intentionally excluded — their npm deps are resolved at bundle time and never `require()`-called directly in Node.
## What Gets Scanned

The scanner detects three import patterns in `.cljs` / `.cljc` / `.clj` files:

| Pattern | Kind | Example |
|---------|------|---------|
| `["pkg" :as x]` | `npm-import` | `["electron" :as e]` — shadow-cljs npm import (compiled to `require()` for Node targets) |
| `js/require "pkg"` | `js-require` | `(js/require "update-electron-app")` — Direct runtime `require()` call |
| `dynamic-import "pkg"` | `dynamic-import` | `(shadow.esm/dynamic-import "https-proxy-agent")` — Async ESM `import()` |

## Output

### Risk Levels

| Risk | Meaning | Action |
|------|---------|--------|
| **HIGH** | Package cannot be loaded by any mechanism. `js-require` with all probes failing; `dynamic-import` with import probe failing; or `npm-import` where **both** `require()` and `import()` fail (`esm-?` mode) | Must replace the package — no loading workaround exists |
| **MEDIUM** | `npm-import` where `require()` fails **but** `import()` works (`esm-imp` mode). Caused by packages whose `exports` map has **only** `"import"` conditionals with no `"require"` or top-level `"default"` fallback — Node's module resolver rejects `require()`. shadow-cljs generates `require()` which will fail | Switch to `dynamic-import` |
| **OK** | Package loads successfully from at least one probe CWD, or is `esm-req`/`esm-edep` — safe to use in ns-form require | No action needed |
| **INFO** | Relative path requires or Node builtins; always safe | Informational only |

### Table Columns (default format)

| Column | Description |
|--------|-------------|
| `PACKAGE` | npm package name as referenced in source code |
| `VER` | Version from package.json (`-` if not installed) |
| `KIND` | Import mechanism: `npm-import`, `js-require`, or `dynamic-import` |
| `TYPE` | Package `type` field: `cjs` (CommonJS), `esm` (ESM `type:module`), `blt` (Node builtin), `-` (unset) |
| `MODE` | Module load mode (see below). Abbreviated in table; full names in TSV/JSON |
| `REQUIRE` | Simplified require() probe results per CWD (see Probe Results below) |
| `FILE` | Source file containing the import |

HIGH/MEDIUM items additionally show: `exports` and `import` probe values.

### Module Modes

| Mode (full) | Table abbrev | Meaning |
|-------------|-------------|---|
| `cjs-or-nonmodule` | `cjs` | `type` is not `module`. CJS or unspecified — always works with `require()` |
| `module-require-compatible` | `esm-req` | `type: module` but `require()` still works (Node 22+ or dual-mode package) |
| `module-electron-dep` | `esm-edep` | `type: module`; probe fails only because Electron runtime (`electron` package) is absent. **Works fine in actual Electron.** |
| `module-import-only` | `esm-imp` | `type: module` and only loadable via `import()`. `require()` will fail |
| `module-unloadable` | `esm-?` | `type: module` and both `require()` and `import()` fail in current environment |
| `builtin` | `blt` | Node.js built-in module (fs, path, os, child_process, etc.) |

#### What actually makes require() fail for ESM packages?

Not merely `"type": "module"`. Node 22+ supports `require(esm)` for ESM modules without top-level `await`. The real determiner is the **`exports` map structure**:

| Package exports structure | require() behavior | Example |
|--------------------------|-------------------|---------|
| No `exports` field (only `main`) | ✅ Works in Node 22+ | `node-fetch@3.3.2` |
| `exports` has top-level `"default"` key | ✅ Works in Node 22+ | `electron-dl@4.0.0` (`{"types":…, "default":…}`) |
| `exports` has `"require"` key | ✅ Works (explicit CJS path) | Most dual-mode packages |
| `exports` has **only** `"import"` key, no `"default"` | ❌ Rejected by Node's module resolver | `https-proxy-agent` (`{"import":{…}}`) |

The scanner's **`esmOnly` flag** (in TSV/JSON output) marks the last case — exports explicitly restricts to import-only. Classification always uses probe results as the authoritative source.

### Probe Results

The scanner tests `require()` and `import()` from three CWD locations:

| Abbreviation | Directory | Role |
|--------------|-----------|------|
| `S` | `static/` | **Primary** Electron runtime directory |
| `R` | `resources/` | Secondary resources directory |
| `.` | repository root | Development directory |

**Compact display (default mode):**

| Display | Meaning |
|---------|---------|
| `ALL:OK` | Loads from all three CWDs |
| `ALL:ERR` | Fails from all three CWDs |
| `ALL:ERR(e-dep)` | All failures are electron-runtime errors; package loads fine in Electron |
| `S:OK R:ERR .:ERR` | Loads from static/ only (normal for Electron packages) |
| `S:ERR(e-dep) R:ERR(e-dep) .:ERR` | Probe fails because `electron` runtime is absent; package loads fine in Electron |
| `SKIP(electron)` | Skipped for `electron` runtime package |
| `BUILTIN` | Node.js built-in module |

Use `--verbose` (`-v`) for error details, e.g. `S:OK R:ERR(MODULE_NOT_FOUND) .:ERR(MODULE_NOT_FOUND)`.

### TSV Columns (--format=tsv)

All fields tab-separated, one row per usage:

`risk`, `kind`, `package`, `version`, `type`, `module_mode`, `exports_require`, `exports_import`, `require_probe`, `import_probe`, `file`

Probe columns contain raw probe strings (e.g. `static=OK;resources=ERR:MODULE_NOT_FOUND;.=ERR:MODULE_NOT_FOUND`).

## Workflow

1. Run the scanner.
2. Check the SUMMARY header for overall risk counts.
3. **HIGH**: Must fix. Package will crash at runtime.
4. **MEDIUM**: Review. Consider `dynamic-import` or CJS-compatible alternative.
5. **OK**: Verify `S:OK`-only packages are expected (installed in `static/node_modules` only).
6. For Electron code, also verify with runtime test:
   ```bash
   npx electron static/electron.js
   ```

## Common Patterns & FAQ

### "S:OK R:ERR .:ERR" — Is this a problem?

**No.** This is normal for Electron-specific packages (e.g., `keytar`, `update-electron-app`, `electron-window-state`). They are installed in `static/node_modules/` (the Electron app directory). The `resources/` and root directories don't need them.

### "ERR:Electron failed to install correctly..."

This error appears when probing packages that depend on `electron` at runtime (e.g., `update-electron-app`) from directories where `electron` isn't properly available. **Not a real issue** — the package works fine from `static/` (`S:OK`), which is where Electron actually runs.

### Node builtins (fs, path, os, etc.)

Detected automatically and shown with `BUILTIN` probe status. Always work in Node/Electron targets. Classified as OK.

### `electron-*` package probing

Only the `electron` package itself (the runtime framework) skips probing. Other `electron-*` packages (`electron-log`, `electron-window-state`, `electron-dl`, etc.) are regular npm packages and are probed normally.

### ESM packages with `module-electron-dep` mode

Some ESM packages (e.g. `electron-dl v4`) internally call `import { BrowserWindow } from 'electron'`. When the scanner probes them with a plain Node.js `require()`, the call fails — not because the package is unloadable, but because the `electron` npm package (an installer shim) doesn't expose Electron's named runtime exports.

In the actual Electron runtime, the `electron` module IS the framework, so `BrowserWindow` and friends resolve correctly. The generated shadow.js shim (`shadow.js.nativeProvides["electron-dl"] = require("electron-dl")`) works fine at Electron startup.

**How the scanner detects this:** If every probe failure contains `'electron'` in the error message (the named-export failure pattern), the package is reclassified from `module-unloadable` → `module-electron-dep` and from MEDIUM/HIGH → **OK**. Probe column shows `ERR(e-dep)` to mark the probe location.

**When to verify manually:** If a new package shows `esm-edep` unexpectedly, inspect its source — it should contain `import ... from 'electron'` or use Electron APIs directly. You can also check the compiled `static/shadow-cljs/` shim files after a build to confirm `require("pkg")` is generated.

### Understanding the plain-Node probe limitation

The scanner runs `require()` and `import()` probes in a plain Node.js process (`node -e ...`), not inside a real Electron runtime. This means:
- Packages that depend on Electron APIs will fail the probe even if they work fine in the app
- The scanner uses the `module-electron-dep` heuristic to handle this case automatically
- For packages that use Electron APIs in unusual ways (not just `import ... from 'electron'`), a manual check may be needed

If a build has already been compiled, you can inspect `static/shadow-cljs/` for `shadow.js.shim.module$<package>` files. The presence of `require("pkg")` in a shim confirms shadow-cljs successfully resolved the package for Electron. This is the definitive ground truth; the scanner's probe is a pre-build approximation.

## Recommended Fixes

For **HIGH** risk:
- Use a CJS-compatible subpath of the package if available
- Switch to `(shadow.esm/dynamic-import "pkg")` for ESM-only packages
- Pin a version that provides CJS support
- Use an alternative CJS-compatible package

For **MEDIUM** risk:
- Switch to `(shadow.esm/dynamic-import "pkg")`
- Find a CJS-compatible alternative
- Verify Node 22+ `require(esm)` covers your case (`module-require-compatible` mode)

Re-run the scanner after changes to verify fixes.

## Script

- Main script: [scan_esm_cjs_risk.mjs](./scripts/scan_esm_cjs_risk.mjs)
