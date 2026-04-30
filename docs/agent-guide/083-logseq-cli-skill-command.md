# Logseq CLI `skill` Subcommand Implementation Plan

Goal: add a new `skill` utility command group so users and agents can print and install the built-in `logseq-cli` skill file with predictable local and global destinations.

Architecture: keep all behavior in the existing CLI pipeline (`parse-args -> build-action -> execute -> format-result`) and treat `skill` as a pure local filesystem utility command that does not require graph resolution or `db-worker-node` server startup.

Architecture: reuse current command wiring patterns from `completion` and `example`, and keep `db-worker-node` API and thread-api surface unchanged.

Tech Stack: ClojureScript, `babashka.cli`, Node.js `fs/path/os`, existing command modules under `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command`, and existing CLI unit plus cli-e2e harness.

Related: builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/070-logseq-cli-example-subcommand.md`, `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/073-logseq-cli-debug-command.md`, `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/036-db-worker-node-ncc-bundling.md`, and `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`.

## Problem statement

The current CLI has utility commands (`completion`, `example`, `debug`) but no direct way to print or install the Logseq CLI skill definition for agent tooling.

Users currently need to locate repository files manually, and installed package environments may not expose a documented command path for this content.

We need a first-class command group under Utilities:

- `logseq skill show` to print `logseq-cli` skill markdown.
- `logseq skill install` to install into `./.agents/skills/logseq-cli`.
- `logseq skill install --global` to install into `~/.agents/skills/logseq-cli`.

## Current baseline from implementation

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` controls top-level help grouping and currently has `Utilities` with `completion`, `debug`, and `example` as top-level-only entries.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` is the central integration point for command entry registration, parse-time validation, action building, and execute dispatch.

The CLI command pipeline already supports utility commands that do not call `db-worker-node`.

`completion` and `example` are implemented as CLI-local behaviors and are good templates for the new `skill` command.

`/Users/rcmerci/gh-repos/logseq/skills/logseq-cli/SKILL.md` is the current source skill file in this repository.

`/Users/rcmerci/gh-repos/logseq/package.json` currently publishes `dist/` and `static/logseq-cli.js`, so additional runtime source file availability for installed package use must be defined explicitly.

## Scope

In scope.

Add `skill` command group with subcommands `show` and `install`.

Add `--global` flag on `skill install`.

Show `skill` in top-level `Utilities` help and keep subcommands hidden from global help.

Add unit tests for parse, action, execute, and help rendering.

Add completion tests for `skill` command/subcommands.

Add cli-e2e non-sync coverage for show and local install behavior.

Update CLI docs with usage and examples.

Out of scope.

Any new `db-worker-node` thread-api or HTTP invoke contract.

Any graph mutation, server lifecycle behavior, or sync/auth behavior changes.

Any new agent framework abstraction beyond requested install targets.

## Proposed behavior contract

| Command | Behavior |
| --- | --- |
| `logseq skill show` | Reads bundled `logseq-cli` skill markdown and prints raw markdown text to stdout regardless of `--output` mode. |
| `logseq skill install` | Creates `./.agents/skills/logseq-cli` and installs `./.agents/skills/logseq-cli/SKILL.md`. |
| `logseq skill install --global` | Creates `~/.agents/skills/logseq-cli` and installs `~/.agents/skills/logseq-cli/SKILL.md`. |
| `logseq --help` | Shows `skill` under `Utilities`, while hiding `skill show` and `skill install` in top-level listing. |
| `logseq skill` | Shows group help with `skill show` and `skill install`. |

## Packaging and runtime file strategy

The command must work in both repository development and packaged CLI environments.

I will keep the source of truth as `/Users/rcmerci/gh-repos/logseq/skills/logseq-cli/SKILL.md`.

I will add packaging support so installed CLI can still locate this file without repository checkout assumptions.

I will prefer a minimal packaging update by including the skill file path in `/Users/rcmerci/gh-repos/logseq/package.json` `files` list.

I will add a runtime path resolver in the new command module that resolves from CLI runtime directory and returns a clear typed error when the skill file is missing.

I will keep this independent from `db-worker-node` bundle manifests because this feature is CLI-local and does not need daemon asset lifecycle semantics.

## Architecture sketch

```text
argv
  -> logseq.cli.commands/parse-args
  -> logseq.cli.commands/build-action
  -> logseq.cli.commands/execute
      -> skill-command/execute-skill-*
          -> fs/path/os local operations only
  -> logseq.cli.format/format-result
  -> stdout
```

```text
No graph required.
No server ensure/start.
No transport/invoke.
No db-worker-node thread-api change.
```

## Testing Plan

I will follow `@test-driven-development` and write failing tests before implementation.

I will add parser and help tests that prove `skill` appears in Utilities top-level help while `skill show` and `skill install` stay hidden there.

I will add parser tests for `skill show`, `skill install`, and `skill install --global` success paths.

I will add parser validation tests for invalid combinations and unknown options.

I will add build-action tests that verify default local target resolution and global home-directory resolution.

I will add execute tests that verify local install creates destination directories and writes expected file content.

I will add execute tests for overwrite behavior and error behavior on unreadable source or unwritable destination.

I will add completion generator tests that verify `skill` group and subcommands are present in zsh and bash output.

I will add cli-e2e non-sync cases for `skill show` and local `skill install` using a temp working directory.

I will update docs tests or snapshots only if existing harness requires it.

NOTE: I will write *all* tests before I add any implementation behavior.

## TDD implementation steps

1. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for top-level help visibility under `Utilities` and group help for `skill`.

2. Add failing parse tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `skill show`, `skill install`, and `skill install --global`.

3. Add a new failing command test file `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/skill_test.cljs` covering source path resolution, install target resolution, and write/copy behavior.

4. Add failing completion tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` for `skill` command coverage.

5. Implement new command namespace `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/skill.cljs` with entries, action builders, and execute functions.

6. Wire the new namespace into `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` for table registration, build-action cases, and execute dispatch.

7. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` Utilities group to include `skill` as top-level-only with a stable description override.

8. Update `/Users/rcmerci/gh-repos/logseq/package.json` `files` list to include the published skill source path needed by packaged CLI runtime.

9. Add cli-e2e inventory and cases in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` and `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` for `skill show` and local install.

10. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` command reference and examples for `skill`.

11. Run focused test commands and then full `bb dev:lint-and-test`.

## Detailed file-by-file change map

| File | Change |
| --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/skill.cljs` | New command module with `entries`, source resolver, destination resolver, `build-action`, and execute functions for show/install. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` | Register `skill` entries and add build/execute dispatch branches for `:skill-show` and `:skill-install`. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` | Add `skill` to Utilities top-level group and description override. |
| `/Users/rcmerci/gh-repos/logseq/package.json` | Include skill markdown path in publishable files to support packaged CLI runtime. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` | Add help/parse/build tests for `skill` group and options. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/skill_test.cljs` | New tests for resolver, install path logic, write behavior, and error handling. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` | Add completion assertions for `skill` group and `show`/`install` subcommands. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` | Add `skill` command metadata. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` | Add executable non-sync behavior cases for show and local install. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Document `skill show`, `skill install`, and `--global` semantics. |

## Command output contract

`skill show` should always print exact markdown payload to stdout so users can pipe it directly.

`skill show` should ignore output format differences and keep markdown output even when `--output json` or `--output edn` is passed.

`skill install` in human output should print installed path and source path.

`skill install` in json or edn output can keep existing CLI structured conventions.

## Edge cases and expected handling

| Scenario | Expected behavior |
| --- | --- |
| Packaged CLI cannot find source skill file. | Return typed error with actionable message and checked path list. |
| Local install destination already exists. | Overwrite installed skill file to keep command idempotent. |
| Destination path is a file, not directory. | Return typed install error with destination path detail. |
| `--global` used when home directory cannot be resolved. | Return typed error indicating home directory resolution failure. |
| Running `skill show` with `--output json` or `--output edn`. | Still output raw markdown text exactly as `skill show` default behavior. |
| Running command from read-only current working directory. | Return write-permission error and do not partially install. |

## Verification commands

```bash
bb dev:test -v logseq.cli.commands-test
bb dev:test -v logseq.cli.command.skill-test
bb dev:test -v logseq.cli.completion-generator-test
bb -f cli-e2e/bb.edn test --skip-build
bb dev:lint-and-test
```

Expected outcomes.

`commands-test`, `skill-test`, and completion tests pass with zero failures and zero errors.

Non-sync e2e includes `skill` cases and passes in `--skip-build` mode after artifacts are present.

`bb dev:lint-and-test` remains green.

## Rollout and compatibility notes

This feature is additive and does not break existing command paths.

No db-worker server behavior changes are introduced.

No schema changes are introduced.

CLI users gain a portable way to acquire the built-in `logseq-cli` skill content.

## Testing Details

I will add behavior-focused parser, help, execute, and e2e tests that assert user-visible command contracts, not internal helper implementation details.

I will ensure tests verify destination path semantics (`./.agents/...` and `~/.agents/...`), raw markdown show output, and explicit overwrite behavior.

## Implementation Details

- Add a dedicated `skill` command namespace instead of embedding logic in `commands.cljs`.
- Keep source-of-truth content in `skills/logseq-cli/SKILL.md`.
- Ensure packaged CLI can resolve source file by updating publish file list.
- Add explicit typed error codes for source missing and install write failures.
- Keep Utilities top-level summary behavior consistent with existing top-level-only commands.
- Keep command design DRY by following `completion` and `example` patterns.
- Keep behavior YAGNI by installing only requested `logseq-cli` skill.
- Keep thread-api untouched and avoid any db-worker-node transport calls.
- Document usage and path semantics in CLI docs.
- Validate with unit tests first and cli-e2e second.

## Decisions confirmed

Installed filename is `SKILL.md`.

Install behavior overwrites existing destination file.

`skill show` always outputs markdown text regardless of `--output` option value.

---
