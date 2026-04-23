---
name: logseq-cli-maintenance
description: Improve readability, consistency, and long-term maintainability of Logseq CLI-related code, command flows, and tests.
---

# logseq-cli-maintenance

## Purpose

Use this skill when working on Logseq CLI-related code and you want to improve:

- Readability
- Maintainability
- Consistency across command modules
- Long-term development ergonomics

This skill focuses on practical refactoring and guardrails, without changing behavior unless explicitly requested.

---

## When to use

Trigger this skill when tasks include any of the following:

1. “Refactor Logseq CLI code”
2. “Clean up command implementation”
3. “Improve readability/structure of CLI logic”
4. “Make CLI easier to extend and test”
5. “Reduce duplication in argument parsing/output handling”

Do **not** use this skill for pure feature delivery unless the request also asks for code quality improvements.

---

## Core maintenance principles

### 1) Separate concerns clearly

Keep these responsibilities isolated:

- **Input parsing** (args/options/env)
- **Validation** (schema/rules/errors)
- **Execution** (domain logic)
- **Presentation** (stdout/stderr formatting, exit codes)

A command handler should orchestrate these steps, not mix all logic in one large function.

### 2) Prefer small, composable functions

- Keep functions single-purpose.
- Use descriptive names that explain intent.
- Extract repeated logic into shared helpers.
- Avoid deep nesting; use early returns for invalid states.

### 3) Keep command contracts explicit

For each command/subcommand, make explicit:

- Required and optional args
- Defaults
- Validation constraints
- Output shape and error format
- Exit code semantics

### 4) Make errors actionable

- Show concise error messages with next-step hints.
- Keep error wording consistent across commands.
- Distinguish user errors (invalid input) from internal errors.

### 5) Standardize CLI output

- Use one style for success, warning, and error output.
- Ensure machine-readable mode (if supported) is stable and documented.
- Avoid hidden format drift across subcommands.

### 6) Preserve behavior while refactoring

When request is maintenance-focused, avoid feature changes.
If behavior must change, call it out explicitly and add tests.

---

## Suggested workflow

1. **Map current command flow**
   - Locate parse → validate → execute → print boundaries.
2. **Identify maintenance hotspots**
   - Long functions, duplicated parsing/output logic, hidden side effects.
3. **Refactor in small, reviewable steps**
   - One concern per change.
4. **Add/update tests around behavior contracts**
   - Especially for error cases and output format.
5. **Run relevant CLI tests and linters**
   - Confirm no regressions.
6. **Run relevant cmds in logseq-cli**
   - Use logseq-cli skill
   - Confirm no regressions.
7. **Document extension points**
   - Show where future subcommands/options should be added.

---

## Refactoring checklist

Use this checklist before finishing:

- [ ] Command entrypoint is concise and easy to scan.
- [ ] Parsing/validation/execution/output are separated.
- [ ] Repeated logic is extracted to shared helpers.
- [ ] Names are intention-revealing.
- [ ] Error messages are consistent and actionable.
- [ ] Output and exit code behavior are tested.
- [ ] No behavior changes were introduced unintentionally.
- [ ] `bb lint:large-vars` passes for touched vars.
- [ ] Existing `^:large-vars/cleanup-todo` annotations were removed when possible.
- [ ] New structure is easy for future contributors to extend.

---

## Common anti-patterns to remove

- God-function command handlers
- Implicit defaults scattered across files
- Inconsistent option names/aliases
- Silent failures or ambiguous exit codes
- Copy-pasted output formatting logic
- Mixing domain logic directly with terminal I/O

---

## Deliverable expectations

When applying this skill, produce:

1. Cleaner structure with equivalent behavior (unless requested otherwise)
2. Focused tests for command contracts
3. Brief rationale for key refactors
4. Clear future extension path for new CLI commands/options
