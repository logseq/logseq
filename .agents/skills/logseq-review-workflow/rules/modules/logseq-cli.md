# Logseq CLI Review Rules

Apply when a change touches Logseq CLI commands, command output, CLI graph operations, CLI tests, or CLI documentation.

## Review focus

- Command flow should keep parsing, validation, execution, and presentation separate.
- Output contracts should be explicit for human-readable and machine-readable modes.
- Commands must be deterministic with `--graph`, `--data-dir`, and temp directories.
- User errors should be actionable and should not look like internal crashes.
- Graph mutations should be idempotent where the command contract implies repeatability.

## Red flags

- Tests relying on the user's real graph, home directory, or existing config.
- Ambiguous exit code behavior.
- Hidden default graph/data-dir selection in tests or scripts.
- JSON/EDN output changes without tests or release-note awareness.
- CLI command changes that bypass existing validation or shared helpers.

## Review questions

- Which commands and subcommands changed?
- What exact output and exit code should scripts observe?
- Are invalid argument and missing graph cases covered?
- Does the command work with a fresh temp graph?
- If only unit tests changed, is CLI E2E unnecessary and why?

## Related skills

Load `logseq-cli` to run or interpret CLI commands. Load `logseq-cli-maintenance` for refactoring-focused review.
