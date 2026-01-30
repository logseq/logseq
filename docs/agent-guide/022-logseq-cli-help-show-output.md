# Logseq CLI Help and Show Output Cleanup Implementation Plan

Goal: Improve logseq-cli help readability and ensure show JSON and EDN outputs use :db/id without :block/uuid.

Architecture: The CLI help text is assembled in logseq.cli.command.core and babashka.cli spec descriptions, while show output is built in logseq.cli.command.show and formatted in logseq.cli.format before returning JSON or EDN.

Tech Stack: ClojureScript, logseq-cli, babashka.cli, db-worker-node.

Related: Relates to 018-logseq-cli-add-tags-builtin-properties.md.

## Problem statement

The current help output lists [options] for nearly every command, which clutters the help display and reduces readability.

The tags and properties option help text does not clearly state that identifiers can be id, :db/ident, or :block/title across all relevant help contexts.

The show command includes :block/uuid in JSON and EDN output, even though :db/id is already present and preferred for programmatic consumers.

```
logseq-cli
  |  help text built from babashka.cli specs
  v
logseq.cli.command.core
  |  parse args and build command payloads
  v
logseq.cli.command.show
  |  fetch tree data from db-worker-node
  v
logseq.cli.format
  |  render human, json, edn output
  v
stdout
```

## Testing Plan

I will add or update unit tests that assert help summaries do not include repeated [options] in the command list, and that tags and properties descriptions include the identifier guidance.

I will add or update unit tests that verify show JSON and EDN outputs do not include :block/uuid and still include :db/id for root and child nodes.

I will add or update integration tests for show JSON output to assert :db/id is present and :block/uuid is absent in root, tags, and linked references where applicable.

NOTE: I will write all tests before I add any implementation behavior.

## Requirements

The top level help output and group summaries must avoid repeating [options] for each command listing while still documenting that options exist in the usage line.

The help description for --tags and --properties must explicitly state that identifiers can be id, :db/ident, or :block/title.

The show command must omit :block/uuid from JSON and EDN outputs while preserving :db/id for the same entities.

The show command human output must be unchanged.

## Non-goals

Do not change CLI command behavior or supported flags beyond help text updates.

Do not change db-worker-node behavior or its API surface.

Do not change the structure of human output for show, list, add, or query commands.

## Design decisions

Limit the help output adjustment to formatting in logseq.cli.command.core so command behavior and parsing remain unchanged.

Apply the identifier clarification to all --tags and --properties options in logseq.cli.command.add and any other specs that expose those flags.

Strip :block/uuid only for show outputs in JSON and EDN formats by post-processing tree data just before returning payloads.

## Implementation plan

1. Follow @test-driven-development for every change in this plan.

2. Add a unit test in src/test/logseq/cli/commands_test.cljs that asserts command list rows in top level and group help do not contain [options] after the command name.

3. Add a unit test in src/test/logseq/cli/commands_test.cljs that asserts the --tags and --properties option descriptions include the text supporting id, :db/ident, and :block/title identifiers.

4. Add a unit test in src/test/logseq/cli/format_test.cljs or src/test/logseq/cli/commands_test.cljs that asserts show JSON and EDN outputs strip :block/uuid while retaining :db/id in root and child nodes.

5. Update integration tests in src/test/logseq/cli/integration_test.cljs that currently assert :uuid or :block/uuid in show JSON output to instead assert :db/id and absence of :block/uuid.

6. Adjust logseq.cli.command.core command listing formatting so only the usage line includes [options], and the command listing uses the bare command path without the suffix.

7. Update the --tags and --properties option descriptions in src/main/logseq/cli/command/add.cljs to include the identifier guidance sentence in a consistent phrasing.

8. Add a helper in src/main/logseq/cli/command/show.cljs or src/main/logseq/cli/format.cljs that removes :block/uuid keys from show JSON and EDN payloads, and apply it in execute-show when output-format is :json or :edn.

9. Run the updated unit tests and integration tests from the Testing Plan and confirm all pass.

## Edge cases

Command help should still show [options] in the usage line for commands that accept options, but not in the command list table.

Multi-id show results should strip :block/uuid from each tree entry without changing the error map shape.

Linked references and tag entities should keep :db/id in the output even when :block/uuid is removed.

## Testing Details

I will add tests that verify help summaries and option descriptions at the command summary level and not by matching the raw babashka.cli output.

I will add tests that parse show JSON and EDN output and assert :block/uuid is missing while :db/id remains on block nodes.

I will update integration tests that read show JSON output to match the new key expectations without changing the test setup logic.

## Implementation Details

- Update logseq.cli.command.core formatting to render command rows without [options].
- Keep usage lines intact so users still see options availability in usage sections.
- Align help text for --tags and --properties to a single wording that mentions id, :db/ident, and :block/title.
- Add a show-specific sanitization step for json and edn output only.
- Keep the show tree data used for human output unchanged to avoid regressions.
- Ensure strip logic is recursive so :block/uuid is removed from nested children and linked references.
- Prefer clojure.walk/postwalk for key removal to minimize custom traversal code.
- Document the new behavior in tests rather than adding new user-facing docs.

## Question

This is resolved. Only add supports --tags and --properties today, so we will update help text there only.

---
