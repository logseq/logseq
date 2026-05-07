# Shadow CLJS, Node, and Electron Loading Review Rules

Apply when a change touches Shadow CLJS targets, npm dependencies, `js/require`, dynamic imports, Electron main-process code, db-worker-node code, or package manifests.

## Review focus

- Confirm the target runtime: browser renderer, Electron main, Node worker, CLI, or test.
- Module loading must match the dependency format and target output mode.
- ESM-only packages are risky when loaded through CommonJS-style `js/require` or Shadow CLJS require shims.
- Browser bundles must not pull Node-only modules into renderer paths.
- Browser-related code should not use `js/Buffer` or other Node-only globals.
- Electron/Node startup paths should fail loudly and log useful context.

## Red flags

- New npm dependency used from both browser and Node paths without target checks.
- `js/require` for a package that may be ESM-only.
- Top-level side effects that run during build or module load unexpectedly.
- Dynamic imports without error handling at runtime boundaries.
- Accidental inclusion of `fs`, `path`, `Buffer`, or other Node globals in browser code.

## Review questions

- Which Shadow CLJS target compiles this namespace?
- Does the package work under the target module system?
- Does Electron/db-worker-node start after the dependency change?
- Is browser bundle size or Node polyfill behavior affected?
- Are dependency manifests and lockfiles updated consistently?

## Related skill

Load `esm-cjs-risk-scan` when reviewing dependency upgrades or Electron/main-process package loading risk.
