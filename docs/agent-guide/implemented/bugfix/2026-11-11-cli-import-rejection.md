# CLI Import Rejection

## Problem

The CLI discards the worker's import result, so a rejected EDN import reports success and exits zero (db-test issue #1422).

## Decision

Check import results before restarting the server or reporting success. A non-nil `:error` becomes the existing `graph-validation-failed` CLI error and exit 1, preserving string messages and rendering other error values as EDN.

## Alternatives considered

### Add a new error code

The existing validation error code describes this rejection. A new code would require an unnecessary spec change.

### Change worker validation or graph cleanup

Worker validation already rejects bad data. Changing validation diagnostics or removing a newly created graph is outside this CLI reporting fix.

## Consequences

Scripts can distinguish rejected imports from successful ones. EDN success maps and SQLite nil replies keep their success behavior. Worker validation and persistence semantics are unchanged.

## Acceptance criteria

- A worker rejection causes exit 1 and retains the worker message in every output mode.
- Import success maps and nil replies still cause exit 0.
- Relevant CLI tests pass.

## Risks

- Import rejection still leaves a newly created empty graph, as the existing throwing path does.
- HTTP fixtures verify CLI behavior; separate scratch-worker checks verify the reported EDN defects where the runtime is available.

## Questions

None. The requested behavior and the existing error contract determine the scope without an unresolved product choice.

## Verification

- Based on master `5d83ed47fd`; no spec or dune files changed.
- The eight new CLI-process regression cases fail on the original bundle in all five rejection cases (exit 0 instead of 1), with all three success cases passing. All eight pass with the fix.
- Full CLI `dune runtest`: 414 passed, 0 failed. `ocamlformat --check` and `git diff --check` pass.
- Real worker verification uses the existing built `static/js/db-worker-node.js` from the local Logseq checkout, with a separate root and no sync configuration. Each of the issue's three malformed seeds returns exit 0 before the fix and exit 1 after it. Querying each graph confirms no imported user classes. The valid control returns exit 0 and two user classes before and after the fix.
- Every scratch worker was stopped after verification. Worker logs were checked; they contained lifecycle messages and no additional validation diagnostics for these returned errors.
- The build uses Dune 3.24.2 bootstrapped in `/tmp`, existing Melange package-cache dependencies, and copied local npm dependencies. The only bundle warnings are existing `transit-js` direct-eval warnings.
- No migration or schema change is required. No product decisions remain open. A fresh empty graph is still retained on rejection, consistent with the pre-existing thrown-error path.
