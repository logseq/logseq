# Electron Main Process Review Rules

Apply when a change touches Electron main-process namespaces, BrowserWindow lifecycle, IPC, app startup, filesystem access, native dialogs, auto-update, or OS integration.

## Review focus

- IPC channels should validate inputs and expose the smallest necessary surface.
- Main-process async work should report failures with useful logs and caller-visible errors.
- Window and app lifecycle code should handle startup, reload, close, reopen, and platform differences.
- Filesystem paths should be explicit and should not mix graph paths, config paths, and cache paths.

## Red flags

- New IPC channel without input validation or permission/context review.
- Swallowed errors during startup or window creation.
- Platform-specific path assumptions for macOS, Windows, or Linux.

## Review questions

- Which process owns this state or side effect?
- Does the behavior survive restart/reload/reopen?
- Are IPC errors surfaced to the caller and logged?
- Is the code safe across supported operating systems?
- Does Electron start after dependency or module-loading changes?

## Related libraries and skills

- Load [`../libraries/shadow-cljs-node.md`](../libraries/shadow-cljs-node.md) for Shadow CLJS target, npm interop, ESM/CJS, and Node/global leakage rules.
- Load `esm-cjs-risk-scan` for npm module-loading risk in Electron or Node targets.
