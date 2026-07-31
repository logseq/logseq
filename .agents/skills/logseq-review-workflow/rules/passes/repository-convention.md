# Repository-convention Pass

Inspect the reviewed change for Logseq repository conventions and maintainability.

Check:

- root and directory-specific `AGENTS.md` rules
- naming, namespace layout, keyword definitions, and built-in property conventions
- i18n rules for shipped user-facing text and translation dictionaries
- logging, console output, CLI output, and error message conventions
- migration placement, db-sync deleted attrs, and schema update rules
- dependency, npm interop, Electron/Node/browser boundary conventions
- unnecessary compatibility layers, broad rewrites, or unrelated refactors

Return results using [`subagent-output.md`](./subagent-output.md).
