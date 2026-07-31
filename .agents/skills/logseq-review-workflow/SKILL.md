---
name: logseq-review-workflow
description: Review Logseq code changes, PRs, patches, commit ranges, or implementation plans through one main-agent orchestration workflow that routes read-only subagents across independent review passes, then deduplicates, validates, and reports findings for the web app, desktop app, and Logseq CLI.
---

# Logseq Review Workflow

## Core principle

The main agent drives the review. It identifies scope, loads routing rules, launches independent read-only subagents for each review pass, collects candidate findings, validates the actionable ones, deduplicates overlap, and writes the final conclusion.

Each pass subagent only collects issues. It must not edit files, stage changes, commit, push, or rewrite code. It returns candidate findings, evidence, checks already run, and unresolved questions to the main agent.

Review every pass through three layers:

1. **Repository-wide rules** — always apply shared review behavior from `rules/common.md`.
2. **Library/runtime/tooling rules** — apply when the diff uses or changes a specific library, language/runtime surface, or tooling dependency.
3. **Logseq module rules** — apply when the diff touches a specific product/runtime area.

Use the routing tables below to load the most specific matching rule files.

Prefer concrete findings backed by code paths, invariants, tests, or runtime behavior. Do not list speculative issues unless you can explain the failure mode and affected scenario.

Every actionable finding with an executable Logseq behavior path must be validated through at least one real Logseq interaction path before it is included in the final review. Use `logseq-repl`, `logseq-cli`, `chrome`, or `computer-use` depending on the touched surface. For implementation plans, docs-only changes, static configuration errors, missing migrations, schema/protocol invariant breaks, or other findings without an executable behavior path, validate through code paths, invariant evidence, tests, build/lint output, or documented contracts and state why runtime interaction does not apply.

## Read these first

1. Root `AGENTS.md` for repository rules and test commands.
2. `.agents/skills/logseq-i18n/SKILL.md` when reviewing shipped user-facing UI text or translation dictionaries.
3. `.agents/skills/logseq-cli/SKILL.md` when review requires running or interpreting the Logseq CLI.
4. `.agents/skills/logseq-repl/SKILL.md` when review requires Desktop renderer, Electron main-process, or db-worker-node runtime checks.
5. `Chrome` skill when testing web-app behavior in Chrome.
6. `computer-use` skill when testing Desktop app UI interactions that require operating the local application window.
7. `.agents/skills/logseq-debug-workflow/SKILL.md` when review uncovers a bug that needs deeper runtime reproduction.

## Workflow

### 1. Identify the review scope

Collect:

- changed files and touched namespaces
- target runtime: renderer, Electron main process, db-worker-node, CLI, mobile, server/worker, tests, docs
- changed public contracts: APIs, CLI output, DB schema, `frontend.worker.db.migrate/schema-version->updates`, migration `migrate-updates`, protocol messages, translations, config, or persisted data
- dependencies and libraries involved

### 2. Load matching rule modules

Always read:

- [`rules/common.md`](./rules/common.md)
- [`rules/passes/subagent-output.md`](./rules/passes/subagent-output.md)

Then read every matching module below.

#### Library routing

| Trigger | Rule module |
|---|---|
| Clojure/CLJS source, core seq idioms, JS typed-array interop | [`rules/libraries/clojure-cljs.md`](./rules/libraries/clojure-cljs.md) |
| `malli`, schemas, validation/coercion/explain data | [`rules/libraries/malli.md`](./rules/libraries/malli.md) |
| `promesa`, promise-returning functions, async JS interop | [`rules/libraries/promesa.md`](./rules/libraries/promesa.md) |
| `datascript`, Datalog queries, `d/transact!`, DB entities | [`rules/libraries/datascript.md`](./rules/libraries/datascript.md) |
| `missionary`, reactive tasks/signals/streams | [`rules/libraries/missionary.md`](./rules/libraries/missionary.md) |
| `rum`, React lifecycle, hooks, Hiccup components | [`rules/libraries/rum-react.md`](./rules/libraries/rum-react.md) |
| `cljs-time`, date parsing/formatting, formatter construction | [`rules/libraries/cljs-time.md`](./rules/libraries/cljs-time.md) |
| `lambdaisland.glogi`, logging, `js/console.*` | [`rules/libraries/glogi.md`](./rules/libraries/glogi.md) |
| `babashka.cli`, `bb`, `nbb`, command-line scripts | [`rules/libraries/babashka-cli.md`](./rules/libraries/babashka-cli.md) |
| Shadow CLJS targets, npm interop, Electron/Node loading | [`rules/libraries/shadow-cljs-node.md`](./rules/libraries/shadow-cljs-node.md) |

#### Logseq module routing

| Trigger | Rule module |
|---|---|
| Logseq CLI commands, CLI E2E, graph command behavior | [`rules/modules/logseq-cli.md`](./rules/modules/logseq-cli.md) |
| db-sync server, worker, protocol, D1 schema, RTC persistence | [`rules/modules/db-sync.md`](./rules/modules/db-sync.md) |
| `outliner.core`, block tree operations, move/indent/delete/order | [`rules/modules/outliner-core.md`](./rules/modules/outliner-core.md) |
| DB model, built-in properties, keywords, migrations, schema updates | [`rules/modules/db-model.md`](./rules/modules/db-model.md) |
| i18n, translation dictionaries, user-facing text, notification text, translated attributes | [`rules/modules/i18n.md`](./rules/modules/i18n.md) |
| Frontend UI state, renderer components, dialogs, settings, pages, interaction behavior | [`rules/modules/frontend-ui.md`](./rules/modules/frontend-ui.md) |
| Editor commands, shortcuts, selection/cursor behavior | [`rules/modules/editor-commands.md`](./rules/modules/editor-commands.md) |
| Electron main process, IPC, app lifecycle, file system, windows | [`rules/modules/electron-main.md`](./rules/modules/electron-main.md) |
| Import/export, publishing, Markdown/EDN conversion | [`rules/modules/import-export.md`](./rules/modules/import-export.md) |
| Search, indexing, query performance, cache invalidation | [`rules/modules/search-indexing.md`](./rules/modules/search-indexing.md) |
| Mobile/Capacitor platform behavior | [`rules/modules/mobile.md`](./rules/modules/mobile.md) |
| Whiteboard/canvas/tldraw-style interactions | [`rules/modules/whiteboard.md`](./rules/modules/whiteboard.md) |

### 3. Launch independent pass subagents

Launch read-only pass subagents with a maximum concurrency of 4. Start the first batch of up to 4 pass subagents, wait for at least one to finish, then start the next pending pass subagent until every pass has been launched. Do not exceed 4 running pass subagents at the same time. Do not run pass subagents serially unless the environment cannot support concurrent subagents. Give every read-only subagent:

- the diff, commit range, PR, patch, or changed file list under review
- the scope collected in step 1
- `rules/common.md`
- [`rules/passes/subagent-output.md`](./rules/passes/subagent-output.md)
- that pass's rule file
- any matching library/module rules relevant to that pass

Passes:

| Pass | Rule file |
|---|---|
| Correctness | [`rules/passes/correctness.md`](./rules/passes/correctness.md) |
| Data contract | [`rules/passes/data-contract.md`](./rules/passes/data-contract.md) |
| Regression | [`rules/passes/regression.md`](./rules/passes/regression.md) |
| Failure mode | [`rules/passes/failure-mode.md`](./rules/passes/failure-mode.md) |
| Migration validation | [`rules/passes/migration-validation.md`](./rules/passes/migration-validation.md) |
| Performance | [`rules/passes/performance.md`](./rules/passes/performance.md) |
| Test coverage | [`rules/passes/test-coverage.md`](./rules/passes/test-coverage.md) |
| Repository convention | [`rules/passes/repository-convention.md`](./rules/passes/repository-convention.md) |

Ask each subagent to inspect only its assigned pass and return only candidate findings, supporting evidence, checks already run, and unresolved questions. While up to 4 subagents run in parallel, the main agent may prepare aggregation and validation steps but must keep launching pending passes as slots open and must wait for every pass report before the final review. If subagents are unavailable or concurrent launch is not possible, run each pass locally with the same rule files and state that delegation or concurrency was unavailable in the verification summary.

### 4. Aggregate pass results

Wait for all pass subagents before writing the final review. Then:

1. Merge all candidate findings.
2. Deduplicate overlapping reports across passes.
3. Discard findings without concrete evidence or turn them into questions.
4. Preserve the originating pass name for each retained finding.
5. Validate every actionable finding before including it.

For executable behavior paths, validate with an appropriate Logseq interaction path:
   - `logseq-repl` for ClojureScript functions, DataScript state, importer/exporter behavior, renderer state, Electron, or worker runtime behavior.
   - `logseq-cli` for CLI command behavior, db-worker-node graph interactions, command output, and graph mutations.
   - `chrome` or `computer-use` for UI, keyboard, accessibility, browser-visible rendering, Electron window behavior, and user workflows.
For findings without an executable behavior path, validate with code-path evidence, schema/protocol invariants, migration evidence, tests, build/lint output, or documented contracts. Record the exact command, REPL expression, UI workflow, or static evidence and the observed result. If no applicable check can be run, do not present the item as a confirmed finding; either continue investigating, downgrade it to a clearly labeled question, or explain the blocker.

### 5. Run targeted runtime verification

After static code inspection, exercise the reviewed functionality in the runtime surfaces affected by the diff. Keep the scenarios narrow: validate the changed behavior, the likely regression path, or the exact failure mode behind a finding.

Use these skills and surfaces:

- **Web app** — use the `Chrome` skill to drive the web UI, inspect rendered state, and check console errors for the reviewed path.
- **Desktop app** — use `.agents/skills/logseq-repl/SKILL.md` for `:app`, `:electron`, and `:db-worker-node` probes; use `computer-use` for UI interactions that must happen in the Desktop app window.
- **Logseq CLI** — use `.agents/skills/logseq-cli/SKILL.md` to inspect live command options/examples and run the reviewed CLI behavior.

Prefer isolated test graphs, temporary root directories, or disposable app state when verification needs writes. Do not mutate a user's real graph unless the review request explicitly requires it and the user has approved the target data.

If a surface is relevant but cannot be exercised, say exactly why. Do not describe unrun checks as verified.

### 6. Severity guidance

Use concise severity labels:

- **Blocking** — correctness bug, data loss, security/privacy issue, migration/protocol break, broken shipped UI path, or test suite failure.
- **Important** — likely regression, bad failure mode, incomplete tests for changed contract, performance issue on realistic graphs.
- **Minor** — readability, naming, local maintainability, missing small cleanup.
- **Question** — unclear intent or missing context that prevents confident review.

### 7. Finding format

Each finding should include:

```markdown
- **Severity:** Blocking | Important | Minor | Question
- **Category:** Correctness | Data contract | Regression | Failure mode | Migration validation | Performance | Test coverage | Repository convention
- **Location:** `path/to/file.cljs:line`
- **Issue:** What is wrong.
- **Impact:** Concrete user, data, runtime, or maintenance impact.
- **Suggestion:** Smallest actionable fix or verification step.
```

Separate findings with a horizontal rule (`---`) when reporting more than one finding.

If there are no findings, say what was reviewed and which rule modules were applied.

Add a short verification summary after findings or after the no-findings statement. Include the CLI commands, REPL probes, Chrome/browser scenarios, Desktop UI actions, static evidence, and any relevant checks that could not be run.

## Review checklist before final response

- Did you apply `rules/common.md`?
- Did you route every touched library/module to its rule file?
- Did you launch one read-only subagent for each independent pass with at most 4 running concurrently, starting new pass subagents as slots opened, or state why delegation or concurrency was unavailable?
- Did each subagent only collect issues and avoid modifying code?
- Did you wait for all pass reports before writing the final review?
- Did you deduplicate and validate actionable findings before including them?
- Did you run targeted runtime verification after static inspection for every affected web-app, desktop-app, and Logseq CLI surface?
- Did you separate verified behavior from checks that could not be run?
- Did you distinguish proven issues from questions?
- Did you check persisted data, migrations, or protocol compatibility when relevant?
- Did you run the migration validation pass and explicitly decide whether the reviewed change requires `frontend.worker.db.migrate/schema-version->updates`, migration `migrate-updates`, a `logseq.db.frontend.schema/version` bump, or migration tests?
- Did you check tests and name exact missing test coverage?
- Did every actionable finding have applicable validation evidence, using `logseq-repl`, `logseq-cli`, `chrome`, or `computer-use` for executable behavior paths and static/protocol/build evidence for non-executable findings?
- Did you avoid asking for broad rewrites when a targeted fix is enough?
- Did you mention any verification you could not perform?
