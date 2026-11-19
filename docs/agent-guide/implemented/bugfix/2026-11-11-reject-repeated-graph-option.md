# Reject Repeated Graph Option

## Problem

Issue logseq/db-test#1482 reports that `-g a graph remove -g b` silently selects graph a. The first-valued option lookup can delete an unintended graph.

## Decision

Reject more than one graph option with an invalid-options error before any command action executes. Count normalized graph options, including identical values, mixed short and long forms, equals syntax, and occurrences missing a value. Preserve other options and the `--` terminator.

## Alternatives considered

### Last value wins

The user explicitly chose rejection instead of override semantics.

### Reject only destructive commands

The user chose one graph option per invocation, so apply the rule consistently across commands.

## Acceptance criteria

- Duplicate graph options fail with a nonzero exit and an actionable error mentioning --graph.
- Both graphs remain intact when an ambiguous graph remove is rejected.
- Valid single graph arguments retain their existing behavior.
- Existing repeated output option behavior is preserved.
- Regression coverage includes identical values, mixed aliases, equals syntax, and a missing graph value.

## Risks

- Scripts repeating graph options, even with identical values, must supply the graph only once. This is the user-approved behavior change.

## Questions

- Resolved: the user decided “报错，-g只能指定一个” on 2026-11-11. No open design questions remain.

## Verification

- Baseline: the real CLI accepted `-g a graph remove -g b`, exited 0, and unlinked disposable graph a while b remained.
- Before the fix, 20 new rejection cases failed and the terminator case passed.
- After the fix, the same command exits 1 with `invalid-options` and `Option --graph may only be specified once`; both graph fixtures and contents remain intact, with empty stderr.
- The complete CLI suite passed: 427 tests, 0 failures, using a disposable default root.
- The standalone build succeeded with session-local Melange dependencies; existing transit-js eval warnings remain.
- Touched code matches ocamlformat after accounting for unchanged formatting differences already present in the baseline.

## Implementation

Implement the user's selected rule: one graph option per invocation. Validate the normalized option list in both the request parser and CLI entry path, before help handling, stdin consumption, configuration resolution, or command execution.

## Consequences

Repeated graph flags now exit with invalid-options even when their values match. Other option repeat behavior remains as before. Tests verify that graph data is retained and that text after the option terminator is not treated as another graph selection.
