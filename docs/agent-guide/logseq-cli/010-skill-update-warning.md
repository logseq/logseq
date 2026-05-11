# Logseq CLI Skill Update Warning Implementation Plan

Goal: When Logseq CLI prints the global help information, check whether the user already has an installed `logseq-cli` agent skill. If an installed skill file exists and its content differs from the built-in skill bundled with the current CLI, append a warning to the end of the global help output.

Architecture: Keep this feature entirely in the Logseq CLI help path and existing skill command support. Do not involve graph commands, db-worker-node lifecycle, or db-worker `:thread-api` calls.

Architecture: Reuse the existing built-in skill source resolution and install-target conventions from `logseq.cli.command.skill`, which currently supports `logseq skill show`, `logseq skill install`, and `logseq skill install --global`.

Architecture: Append the warning only for global help output: `logseq`, `logseq --help`, `logseq -h`, and equivalent leading-global-option forms such as `logseq --output json --help`. Do not append it to command help such as `logseq show --help`, group help such as `logseq graph`, parse errors, version output, or normal command output.

Architecture: Treat the warning as a local filesystem comparison. The CLI should compare UTF-8 skill markdown content exactly. No network request, no graph open, no db-worker-node start, and no new `:thread-api/*` method are required.

Tech Stack: ClojureScript, Node `fs`/`os`/`path` APIs, `babashka.cli`, existing Logseq CLI command parsing, existing `logseq.cli.command.skill`, `logseq.cli.main`, CLI unit tests, and the Logseq review workflow.

Related: Builds on the current implementation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/skill.cljs`, and the db-worker-node boundary in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`.

## Problem statement

The Logseq CLI ships a built-in agent skill at:

```text
.agents/skills/logseq-cli/SKILL.md
```

The CLI exposes this built-in skill through:

```text
logseq skill show
logseq skill install
logseq skill install --global
```

`logseq skill install` copies the bundled skill into the current working directory under:

```text
<cwd>/.agents/skills/logseq-cli/SKILL.md
```

`logseq skill install --global` copies it into the user's home directory under:

```text
~/.agents/skills/logseq-cli/SKILL.md
```

After the CLI is upgraded, a user may still have an older installed copy of the `logseq-cli` skill. Agents that use the installed skill can then follow stale command guidance even though the CLI binary has newer behavior.

The requested behavior is:

1. When showing global help, also check whether the installed `logseq-cli` skill is up to date.
2. If the user has not installed the skill, show no warning.
3. If the user has installed the skill and the installed content differs from the bundled content, append a warning to the end of the help info.
4. Avoid adding a new db-worker `:thread-api` unless implementation work proves it is absolutely necessary.
5. After implementation, review the finished change with `logseq-review-workflow`.

This feature is a CLI self-maintenance hint. It should not change graph data, command behavior, db-worker-node behavior, or skill installation behavior.

## Current implementation snapshot

### Global help generation

Global help is generated in:

```text
src/main/logseq/cli/command/core.cljs
```

The key function is:

```text
logseq.cli.command.core/top-level-summary
```

It returns a markdown-like/plain-text help string containing:

- usage line
- grouped commands
- global options
- command options hint

Command parsing lives in:

```text
src/main/logseq/cli/commands.cljs
```

`logseq.cli.commands/parse-args` builds the top-level summary before dispatching:

```text
(let [summary (command-core/top-level-summary table)
      {:keys [opts args]} (command-core/parse-leading-global-opts raw-args)
      ...]
  ...)
```

Global help is returned by `command-core/help-result` in at least these cases:

- `logseq`
- `logseq --help`
- `logseq -h`
- exhausted input that falls back to the top-level summary

Group help and command help also use `help-result`, but with different summary strings.

### CLI run path

The entrypoint is:

```text
src/main/logseq/cli/main.cljs
```

`logseq.cli.main/run!` parses args first:

```text
(commands/parse-args args)
```

If `(:help? parsed)` is true, it returns immediately without resolving config, ensuring root dir, building command actions, starting db-worker-node, or invoking graph APIs.

Current human help output path:

```text
{:exit-code 0
 :output (:summary parsed)}
```

Current structured help output path:

```text
(format/format-result {:status :ok
                       :data {:message (:summary parsed)}}
                      {:output-format mode})
```

This means the right place to append a dynamic warning is in `logseq.cli.main/run!` after parsing and before formatting the help result. That keeps `command.core/top-level-summary` deterministic and avoids a namespace cycle between `command.core` and `command.skill`.

### Skill command implementation

The skill utility command lives in:

```text
src/main/logseq/cli/command/skill.cljs
```

Current constants:

```text
skill-dir-name      "logseq-cli"
skill-file-name     "SKILL.md"
relative-skill-path [".agents" "skills" "logseq-cli" "SKILL.md"]
```

Current public helpers include:

```text
resolve-install-target
resolve-skill-source-path
```

Current private helpers include:

```text
source-path-candidates
resolve-action-source-path
resolve-install-destination
```

Current command behavior:

- `skill show` resolves the bundled source skill and prints it.
- `skill install` resolves the bundled source skill, resolves a destination under `<cwd>/.agents/skills/logseq-cli/SKILL.md`, and writes the source payload.
- `skill install --global` resolves the destination under `~/.agents/skills/logseq-cli/SKILL.md`.

This code already knows the built-in source path and supported install destinations. The implementation should extend this namespace with reusable status helpers instead of duplicating path logic in `main.cljs`.

### db-worker-node boundary

The db-worker-node server lives in:

```text
src/main/frontend/worker/db_worker_node.cljs
```

It exposes HTTP endpoints such as:

```text
/healthz
/v1/events
/v1/invoke
/v1/shutdown
```

`/v1/invoke` forwards existing `:thread-api/*` calls to the worker runtime after repo validation and write-lock checks.

Global CLI help currently exits before config resolution and before any db-worker-node lifecycle path. The skill update warning only needs to compare local files, so it should preserve that boundary:

- no graph selection
- no root-dir creation
- no server discovery
- no worker start
- no `/v1/invoke`
- no new `:thread-api/*`

If an implementation attempt appears to require db-worker-node, re-check the design. That would likely mean the check has accidentally been coupled to graph/runtime state instead of the filesystem skill files.

## Desired behavior

### No installed skill

If neither supported installed skill file exists, global help should be unchanged.

Supported installed locations should match the existing install command semantics:

```text
<cwd>/.agents/skills/logseq-cli/SKILL.md
~/.agents/skills/logseq-cli/SKILL.md
```

Examples that should not show a warning when no installed file exists:

```text
logseq
logseq --help
logseq -h
logseq --output json --help
```

### Installed skill matches bundled skill

If an installed skill file exists and its UTF-8 content exactly equals the bundled skill content, global help should be unchanged.

This preserves a quiet help experience for users who already updated their installed skill.

### Installed skill differs from bundled skill

If one or more installed skill files exist and at least one installed file differs from the bundled skill content, append a warning to the end of the global help information.

Recommended warning text:

```text

Warning: Installed logseq-cli skill is out of date. Run `logseq skill install` or `logseq skill install --global` to update it.
```

If implementation can safely identify stale scopes, prefer a more specific warning:

```text

Warning: Installed logseq-cli skill is out of date at <path>. Run `logseq skill install` to update it.
```

or for global scope:

```text

Warning: Installed logseq-cli skill is out of date at <path>. Run `logseq skill install --global` to update it.
```

If both local and global installed files exist and either differs, a single concise warning is enough. The warning may include both update commands, but it should remain at the end of help and avoid turning global help into a long diagnostic report.

### Scope of global help

Append the warning for top-level/global help only:

```text
logseq
logseq --help
logseq -h
logseq --output human --help
logseq --output json --help
logseq --output edn --help
```

Do not append the warning for group help:

```text
logseq graph
logseq graph --help
logseq list
logseq example
```

Do not append the warning for command help:

```text
logseq show --help
logseq skill install --help
logseq query --help
```

Do not append the warning for non-help output:

```text
logseq --version
logseq skill show
logseq skill install
logseq graph list
```

### Structured output

Structured help modes currently wrap the help string in `:data :message`.

When global help is requested with structured output, append the same warning to that message field:

```text
logseq --output json --help
logseq --output edn --help
```

Do not add a separate structured field unless there is a strong reason. Keeping the warning in `message` preserves the existing help-result shape and satisfies the requirement that the warning appears at the end of the help info.

## Design

### 1. Add skill status helpers in `logseq.cli.command.skill`

Add public, unit-testable helpers to `src/main/logseq/cli/command/skill.cljs`.

Suggested API:

```clojure
(defn installed-skill-targets
  [{:keys [cwd home-dir]}]
  ...)

(defn installed-skill-update-status
  [{:keys [cwd home-dir source-path]}]
  ...)

(defn format-installed-skill-warning
  [status]
  ...)
```

The exact names can change during implementation, but the responsibilities should remain separate:

1. Resolve candidate installed paths.
2. Resolve/read the bundled source skill.
3. Read only installed files that actually exist.
4. Compare content.
5. Return data describing whether a warning is needed.
6. Format the user-facing warning in one place.

Suggested status shape:

```clojure
{:installed? true
 :outdated? true
 :outdated-targets [{:scope :local
                     :path "/work/.agents/skills/logseq-cli/SKILL.md"
                     :update-command "logseq skill install"}]}
```

For no installed skill:

```clojure
{:installed? false
 :outdated? false
 :outdated-targets []}
```

For installed and current:

```clojure
{:installed? true
 :outdated? false
 :outdated-targets []}
```

For source resolution/read failures, return a typed error instead of throwing from the status helper:

```clojure
{:installed? true
 :outdated? false
 :error {:code :skill-source-not-found ...}}
```

The top-level help path can then avoid showing a false warning if comparison cannot be completed. Unit tests should still assert the typed error behavior so packaging/path bugs are visible to developers.

Implementation notes:

- Keep exact UTF-8 string equality as the freshness check.
- Do not normalize whitespace or line endings unless tests prove packaging changes introduce platform-only newline differences.
- Use `fs/existsSync` before reading installed files.
- Read source once.
- Reuse `resolve-skill-source-path` and the existing candidate logic.
- Reuse `resolve-install-target` for local/global paths where practical.
- Preserve existing `skill show` and `skill install` behavior.

### 2. Detect global help in `logseq.cli.main`

Add a small helper in `src/main/logseq/cli/main.cljs` to identify top-level help from the original argv and parse result.

Suggested behavior:

```text
global-help-info? = parsed is help AND leading global option parsing leaves no command args
```

This matches:

- `[]`
- `["--help"]`
- `["-h"]`
- `["--output" "json" "--help"]`

It does not match command or group help because those have command args after leading global options.

Suggested helper responsibilities:

```clojure
(defn- global-help-info?
  [args parsed]
  ...)
```

Use existing `command-core/parse-leading-global-opts` to avoid introducing a second argv parser.

Do not add dynamic filesystem checks to `command-core/top-level-summary`. Keeping the check in `main.cljs` avoids making parse-only tests depend on local user files and prevents a circular dependency with `logseq.cli.command.skill`.

### 3. Append warning before formatting help

In the `(:help? parsed)` branch of `logseq.cli.main/run!`:

1. Resolve output mode as today.
2. Compute `summary` from `(:summary parsed)`.
3. If `global-help-info?` is true, call the skill status helper and append the formatted warning when needed.
4. Use the final summary for both human and structured output.

Suggested flow:

```clojure
(let [mode (resolve-output-format args parsed nil nil)
      summary (maybe-append-installed-skill-warning args parsed (:summary parsed))]
  ...)
```

Keep the function synchronous unless implementation work finds a strong reason otherwise. The comparison reads two or three local files at most and happens only when global help is requested.

### 4. Warning formatting

Keep the warning concise, stable, and easy to test.

Recommended baseline:

```text
Warning: Installed logseq-cli skill is out of date. Run `logseq skill install` or `logseq skill install --global` to update it.
```

Optional scope-specific rendering:

```text
Warning: Installed logseq-cli skill is out of date at <path>. Run `<command>` to update it.
```

If there are multiple stale installed targets, either:

- render one generic warning with both install commands, or
- render one warning line with comma-separated paths.

Do not render a multi-paragraph report.

Do not warn when the installed file is missing. Missing means the user has not installed the skill through the supported install location, and the requirement explicitly says not to show a warning in that case.

### 5. Avoid db-worker-node and new thread APIs

This feature should be implemented without changing:

```text
src/main/frontend/worker/db_worker_node.cljs
src/main/logseq/cli/server.cljs
src/main/logseq/cli/transport.cljs
```

Do not add a new `:thread-api/*` for skill status. The information is already available from local files in the CLI process.

If a future implementation wants to expose skill status to a graph-aware command, prefer a normal CLI helper or command action first. A db-worker thread API would only be justified if the worker owns the data or side effect, which is not true here.

## Implementation tasks

### Task 1: Add skill content status helpers

Files:

```text
src/main/logseq/cli/command/skill.cljs
src/test/logseq/cli/command/skill_test.cljs
```

Steps:

1. Add a helper to resolve local and global installed skill targets using existing install semantics.
2. Add a helper to resolve and read the built-in source skill.
3. Add a helper to read installed skill files only when they exist.
4. Compare installed content with built-in content.
5. Return status data that distinguishes:
   - no installed skill
   - installed and current
   - installed and outdated
   - comparison error
6. Add unit tests for each status case.

Acceptance criteria:

- No existing `skill show` or `skill install` tests regress.
- No installed file means `:installed? false` and no warning.
- Matching installed file means no warning.
- Different installed file means `:outdated? true`.
- Local and global install paths match current install command semantics.

### Task 2: Append warning only for global help

Files:

```text
src/main/logseq/cli/main.cljs
src/test/logseq/cli/main_test.cljs
```

Steps:

1. Add a private global-help detector based on raw args and parse result.
2. Add a private warning append helper that calls `skill-command/installed-skill-update-status`.
3. In the `(:help? parsed)` branch, replace direct use of `(:summary parsed)` with the possibly augmented summary.
4. Add tests with `p/with-redefs` or temporary files so the tests do not depend on the developer's real `~/.agents` files.
5. Cover human, JSON, and EDN help modes if feasible.

Acceptance criteria:

- `logseq --help` appends the warning when the mocked/temporary installed skill is stale.
- `logseq` with no args follows the same global help behavior.
- `logseq show --help` does not append the warning.
- `logseq graph` group help does not append the warning.
- `logseq --version` does not append the warning.
- `logseq --output json --help` keeps the warning inside `data.message` and preserves the existing structured result shape.

### Task 3: Keep parsing deterministic

Files:

```text
src/main/logseq/cli/commands.cljs
src/main/logseq/cli/command/core.cljs
src/test/logseq/cli/commands_test.cljs
```

Expected change: ideally none.

If implementation needs parse metadata, prefer adding metadata in `commands.cljs` rather than adding filesystem checks to `command.core.cljs`.

Acceptance criteria:

- `commands/parse-args` remains deterministic and does not read user skill files.
- Existing help output tests in `commands_test.cljs` remain stable.
- Any new metadata does not change the public command/action behavior unless explicitly tested.

### Task 4: Verify no db-worker-node changes are needed

Files:

```text
src/main/frontend/worker/db_worker_node.cljs
src/main/logseq/cli/server.cljs
src/main/logseq/cli/transport.cljs
```

Expected change: none.

Acceptance criteria:

- No new `:thread-api/*` keyword is introduced for this feature.
- Global help still returns before config/root-dir/db-worker work.
- Existing db-worker-node tests are not affected.

### Task 5: Review with `logseq-review-workflow`

After implementation and tests, run the Logseq review workflow before considering the feature complete.

Scope to review:

```text
src/main/logseq/cli/main.cljs
src/main/logseq/cli/command/skill.cljs
src/test/logseq/cli/main_test.cljs
src/test/logseq/cli/command/skill_test.cljs
```

Likely review rule modules:

- `.agents/skills/logseq-review-workflow/rules/common.md`
- `.agents/skills/logseq-review-workflow/rules/libraries/clojure-cljs.md`
- `.agents/skills/logseq-review-workflow/rules/libraries/babashka-cli.md`
- `.agents/skills/logseq-review-workflow/rules/libraries/shadow-cljs-node.md`
- `.agents/skills/logseq-review-workflow/rules/modules/logseq-cli.md`

Review acceptance criteria:

- The workflow is explicitly applied after implementation.
- Any findings are fixed or documented before handoff.
- The final response mentions the review scope and whether findings remain.

## Test plan

Targeted unit tests:

```text
bb dev:test -v logseq.cli.command.skill-test/test-installed-skill-update-status
bb dev:test -v logseq.cli.main-test/test-global-help-appends-stale-skill-warning
bb dev:test -v logseq.cli.main-test/test-global-help-skill-warning-structured-output
```

Existing related tests to keep green:

```text
bb dev:test -v logseq.cli.command.skill-test/test-execute-skill-show
bb dev:test -v logseq.cli.command.skill-test/test-execute-skill-install
bb dev:test -v logseq.cli.commands-test/test-help-output
bb dev:test -v logseq.cli.main-test/test-help-output-respects-structured-modes
```

Broader verification before submitting:

```text
bb dev:lint-and-test
```

Manual checks, if a built CLI is available:

```text
logseq --help
logseq --output json --help
logseq skill install
logseq --help
# then modify the installed SKILL.md or switch to a newer build
logseq --help
logseq show --help
```

Expected manual results:

- No installed skill: no warning.
- Installed current skill: no warning.
- Installed stale skill: warning appears at the end of global help.
- Command help and group help: no warning.

## Edge cases and decisions

### Local vs global installed skill

The CLI currently supports both local and global installation. The warning check should inspect both supported destinations.

If neither exists, do not warn.

If one exists and differs, warn.

If both exist and either differs, warn once. The warning can mention both install commands unless scope-specific formatting is implemented.

### User-edited installed skill

A user may intentionally customize their installed `logseq-cli` skill. Exact content comparison will treat that as different and show an update warning.

This is acceptable for the first implementation because there is no skill version metadata today. The warning says the installed skill differs from the bundled current skill; it does not overwrite anything.

Do not introduce a skill metadata format or migration in this task unless explicitly requested.

### Missing source skill

If the bundled source skill cannot be resolved/read, that is a packaging or runtime bug. The status helper should return a typed error that unit tests can cover.

The global help path should not show an update warning unless comparison succeeds and proves that an installed skill is outdated. This avoids false positives in help output.

### File permissions

If an installed skill file exists but cannot be read, return a typed comparison error from the helper. Do not claim the skill is outdated unless content comparison succeeds.

If future work wants to expose this to users, add a separate diagnostic command or a verbose-only diagnostic. Do not add noisy errors to normal global help in this task.

### Color/styling

Existing help uses `logseq.cli.style` for bold headings/options. The warning can be plain text for test stability.

If styling is added, ensure tests strip ANSI where needed and the warning remains readable when color is disabled.

### Performance

The global help path should read at most:

- the bundled source skill once
- the local installed skill if it exists
- the global installed skill if it exists

No recursive directory scan is needed.

### Compatibility

This change does not need backward compatibility shims. It adds a warning only when a supported installed skill file exists and differs from the bundled content.

Do not add default values that mask invalid state inside the status helper. Return explicit status data instead.

## Non-goals

- Do not automatically reinstall or overwrite the user's skill.
- Do not add a new `logseq skill status` command in this task.
- Do not add a new db-worker `:thread-api/*`.
- Do not start db-worker-node during help.
- Do not check remote versions or network state.
- Do not add skill version metadata unless requested separately.
- Do not show the warning for users who have not installed the skill.

## Final acceptance criteria

The implementation is complete when all of the following are true:

1. Global help checks installed `logseq-cli` skill freshness using local filesystem content comparison.
2. No warning is shown when no installed skill exists.
3. No warning is shown when installed skill content matches the bundled skill.
4. A warning is appended to the end of global help when an installed skill differs from the bundled skill.
5. The warning appears in structured help inside the existing help message field.
6. Group help, command help, version output, and normal command output do not show the warning.
7. No new `:thread-api/*` is added.
8. db-worker-node is not started or invoked for global help.
9. Targeted CLI tests pass.
10. `logseq-review-workflow` has been applied to the final implementation and any findings have been addressed or documented.
