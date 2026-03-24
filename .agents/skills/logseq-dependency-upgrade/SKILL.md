---
name: logseq-dependency-upgrade
description: Audit, plan, and refresh dependency upgrades for the Logseq repository by scanning every non-gitignored package.json, deps.edn, bb.edn and nbb.edn manifest, checking latest upstream versions, cross-root consistency, lockfile resolution, deprecation, staleness, and OSV vulnerabilities, then generating a batch-ordered upgrade plan and compact JSON artifact.
---

# Logseq Dependency Upgrade

Use this skill when the task is to audit dependencies, build an upgrade plan, or refresh dependency-upgrade facts for this repository.

## Workflow

1. Run the audit script:

```bash
node .agents/skills/logseq-dependency-upgrade/scripts/audit_logseq_dependencies.mjs \
  --output-json <json-output-path> \
  --output-md <markdown-output-path> \
  [--stale-months <months>] \
  [--include-prerelease]
```

- `--stale-months` — number of months since last publish to flag a package as stale (default: `36`).
- `--include-prerelease` — boolean flag (no value). When present, the Risk column annotates any newer upstream pre-release version (SNAPSHOT / RC / alpha / beta / nightly / canary etc.). The **target version is always the latest stable release** regardless of this flag. When absent (default), pre-release versions are neither fetched nor shown.

2. Read the generated Markdown report — it is the primary planning document, structured for batch-wise execution.

3. To execute an upgrade batch:
   - Read the target batch section from the Markdown report (one read, one self-contained table).
   - Apply the upgrades (change manifest files, run install/test).
   - Overwrite the batch's **Status** line and table to record results.
   - Update the **Summary** counts at the top.

CAUTION: Verify dependency usage before updating; remove unused packages instead of upgrading. For any dependency crossing a major version boundary, perform a rigorous review for breaking changes.

4. After all batches, or to refresh data, rerun the audit script to regenerate both files.

## Audit scope

- Every non-gitignored `package.json` (`dependencies` + `devDependencies`).
- Every non-gitignored `deps.edn` and `nbb.edn` (`:deps` + `:aliases` extra-deps / replace-deps — covers clj-kondo, test deps, etc.).
- Every non-gitignored `bb.edn` (`:deps` + `:pods`).
- Project-internal `local/root` deps (e.g. `logseq/db`, `logseq/common`) are **excluded**.
- Gitignored / generated manifests are excluded.

## Classification

1. Toolchain
2. Root JS Incremental
3. Root JS Major / High-Risk
4. Clojure / Babashka Libraries
5. deps/* & libs/* Package Islands
6. packages/ui
7. Mobile / Capacitor
8. Infra / Build Islands
9. Manual Review

## Version prefix preservation

Target versions preserve the original specifier prefix. If current is `^1.0.0` and latest is `1.5.0`, target is `^1.5.0`. If current is `1.0.0` (fixed), target is `1.5.0`.

## Lockfile resolution

For npm packages with a range specifier (e.g. `^`), the script checks `yarn.lock` to see if the resolved version already matches latest. These packages are flagged as **already resolved** — they need only a lockfile refresh, not a manifest change, and carry zero upgrade risk.

## Output contract

The script writes:
- **JSON** — compact, no null/false/empty-default fields. Structured by `batches[]` array for machine consumption.
- **Markdown** — batch-centric layout. Each batch is a self-contained section with a Status line and a table. An agent can read one batch section, execute it, and overwrite that section to record results — no scattered edits needed.

## Notes

- `deprecated` comes from upstream package metadata.
- `vulnerabilities` come from OSV batch queries.
- `stale / low-maintenance` is based on upstream publish dates.
- Clojure package latest versions are fetched from Clojars first, then Maven Central as fallback.

## Script

- Main script: [audit_logseq_dependencies.mjs](./scripts/audit_logseq_dependencies.mjs)
