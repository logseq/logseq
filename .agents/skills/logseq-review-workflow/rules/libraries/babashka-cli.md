# Babashka CLI Review Rules

Apply when a change touches `babashka.cli`, `bb.edn`, `nbb.edn`, command scripts, or command-line argument parsing.

## Review focus

- Parsing, validation, execution, and output should be separate enough to test.
- Required arguments and option defaults should be explicit.
- Exit codes should distinguish success, user error, and internal error.
- Machine-readable output should remain stable when supported.
- File paths, graph paths, and data directories should be deterministic and test-isolated.

## Red flags

- Hidden defaults that mask missing required options.
- Command handlers that mix parsing, side effects, and printing in one large function.
- Inconsistent flag names or aliases across commands.
- Raw stack traces for expected user errors.
- Tests depending on a developer's local graph or home directory.

## Review questions

- Is the help/error output clear enough for a user to recover?
- Does JSON/EDN output remain stable for scripts?
- Are temp graphs/data dirs isolated in tests?
- Are invalid options and missing arguments tested?
- If behavior changes, is CLI E2E coverage updated?

## Related skill

Load `clojure-babashka-cli` for CLI parsing implementation work and `logseq-cli` for operating the Logseq CLI.
