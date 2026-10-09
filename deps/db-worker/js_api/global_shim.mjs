// Imported first by entry_browser.mjs so it evaluates before any
// dependency chunk: UMD polyfills in the dep tree resolve their host
// global as `window ?? global`; module workers have neither (classic
// bundles get a `global` shim for CJS compat).
globalThis.global ??= globalThis;
