# Logseq CLI Help And Show Styling Implementation Plan

Goal: Add picocolors-based styling for help output and show human output in logseq-cli and db-worker-node.

Architecture: Introduce a small shared styling helper that wraps picocolors and is used by CLI help renderers and show tree formatting.
Help output headings and error strings will apply bold to keywords while show output will color status labels and bold tag suffixes without changing data payloads.

Tech Stack: ClojureScript, Node.js, picocolors, babashka.cli.

Related: Relates to docs/agent-guide/022-logseq-cli-help-show-output.md.

## Problem statement

The current help output in logseq-cli and db-worker-node is plain text and does not emphasize command names or option names, which makes scanning harder.
The show command human output also does not visually differentiate status values or tags, which makes scanning large trees harder.
The tree glyphs in show output currently have the same visual weight as content, which makes the structure harder to scan.

## Testing Plan

I will add unit tests for help summary formatting that assert bold styling is applied to command names, option names, and error messages for missing options.
I will add unit tests for show tree text rendering that verify status labels are colorized and tag suffixes are bolded while preserving the existing tree glyph alignment when ANSI codes are stripped.
I will add a unit test that verifies tree glyphs are rendered in a lighter style without altering alignment when ANSI is stripped.
I will add a unit test for db-worker-node help output that asserts bold styling on command names and option names and that the help text still omits auth-token.
I will add unit tests for the styling helper to ensure it can be disabled for tests by stripping ANSI when comparing output.
NOTE: I will write all tests before I add any implementation behavior.

## Scope and constraints

This plan targets logseq-cli in src/main/logseq/cli and db-worker-node help output in src/main/frontend/worker/db_worker_node.cljs.
This plan must use picocolors for color and bold styling and should not change JSON or EDN output formats.
This plan should not introduce new CLI options unless required to gate coloring for tests.
Styling must only be applied when color is supported, and dumb terminals must receive plaintext output.
The `logseq -h` help output should omit the commands list section.

## Files and ownership

| Area | Path | Notes |
| --- | --- | --- |
| npm dependency | package.json | Add picocolors dependency used by ClojureScript Node targets. |
| npm lockfile | yarn.lock | Update to include picocolors. |
| CLI help summary | src/main/logseq/cli/command/core.cljs | Apply bold styling to command names and option names in help summaries and error text. |
| CLI show output | src/main/logseq/cli/command/show.cljs | Apply status color and tag bold styling in tree labels. |
| CLI show output | src/main/logseq/cli/command/show.cljs | Apply lighter styling to tree glyphs in human output. |
| CLI formatting helpers | src/main/logseq/cli/format.cljs | Avoid impacting non-human output, and ensure show uses styled message for human output only. |
| CLI legacy help | deps/cli/src/logseq/cli.cljs | Apply bold styling to command names and option names in help output for legacy cli entrypoint. |
| db-worker-node help | src/main/frontend/worker/db_worker_node.cljs | Apply bold styling to command names and option names in help output lines. |
| CLI tests | src/test/logseq/cli/commands_test.cljs | Update help summary and show tree tests to tolerate ANSI and assert styling intent. |
| CLI format tests | src/test/logseq/cli/format_test.cljs | Add or update tests to ensure human show output includes styled text but JSON and EDN do not. |
| db-worker-node tests | src/test/frontend/worker/db_worker_node_test.cljs | Extend help output test to validate bold styling. |

## Implementation plan

1. Add picocolors to package.json dependencies and update yarn.lock with the new dependency using the existing package manager.
2. Create a small styling helper in a new namespace such as src/main/logseq/cli/style.cljs that wraps picocolors functions for bold and color and exposes a no-color flag for tests.
3. Add a companion helper in a shared location for db-worker-node, or reuse the same namespace if it is available in that build target, to avoid duplicated color logic.
4. In src/main/logseq/cli/style.cljs, add a color support check that disables styling when color is not supported or TERM is dumb.
5. In src/main/logseq/cli/command/core.cljs, wrap help summary command names and option names with the new bold helper.
6. In src/main/logseq/cli/command/core.cljs, update the invalid options error formatting so missing required option names are bolded in the error message.
7. In deps/cli/src/logseq/cli.cljs, apply the same bold styling to command names and option names in the help output for the legacy cli entrypoint.
8. In src/main/frontend/worker/db_worker_node.cljs, update show-help! output to bold command names and option names in the help text.
9. In src/main/logseq/cli/command/show.cljs, add a status style function that maps known status labels to distinct colors, and bolds the status text, using picocolors.
10. In src/main/logseq/cli/command/show.cljs, update the tag suffix rendering to wrap each #tag with bold styling and ensure tags remain separated by spaces.
11. In src/main/logseq/cli/command/show.cljs, style the tree glyphs with a dim or gray color using picocolors while leaving ids and labels unstyled.
12. In src/main/logseq/cli/command/show.cljs, ensure status formatting and glyph styling are only applied to the human output path and do not alter the underlying data used for JSON or EDN outputs.
13. Update src/test/logseq/cli/commands_test.cljs to compare help summaries using an ANSI-stripping helper so assertions remain stable, and to assert bold styling for command and option names.
14. Update src/test/logseq/cli/commands_test.cljs show tree text tests to assert that the status prefix and tag suffix are styled when ANSI is preserved, and to verify tree alignment and glyph lightening using stripped output.
15. Add or update tests in src/test/logseq/cli/format_test.cljs to verify that human show output includes styled prefixes while JSON and EDN outputs remain unchanged.
16. Update src/test/frontend/worker/db_worker_node_test.cljs to assert that the help output bolds command and option names and still omits auth-token.
17. Run bb dev:lint-and-test to ensure all lint and unit tests pass.

## Edge cases

The status value may be a keyword with namespaces such as :logseq.property.status/todo and should still map to the same color for TODO.
The status label may be missing or blank, and the show output should remain unchanged in that case.
Tag labels may include uppercase or punctuation and should still render as bolded tags without losing the leading #.
Help output should still be readable when ANSI colors are not supported, and tests should be resilient by stripping ANSI sequences.
Tree glyph styling should not break alignment when ANSI codes are stripped.
Styling should be fully disabled when color is not supported or TERM is dumb.

## Open questions

Should picocolors styling be applied only when stdout is a TTY, or should it always render for human output regardless of terminal support.
Which specific status to color mapping is preferred for the full set of Logseq statuses such as NOW, LATER, WAITING, CANCELLED, and TODO variants.

## Testing Details

The tests will verify visible behavior by asserting that help output includes bolded command names and option names and that show output includes styled status and tags when rendered to human text.
The tests will also assert that JSON and EDN outputs remain unchanged and that ANSI codes do not break alignment by validating stripped output.
The tests will continue to avoid asserting internal data structures and instead focus on rendered output behavior.

## Implementation Details

- Use a small helper that can apply bold and color via picocolors and also expose a strip-ansi helper for tests.
- Keep styling limited to human output paths and avoid touching transport or data payloads.
- Centralize the status to color mapping in one function to keep future changes easy.
- Apply bold to command names and option names in help output and error strings.
- Preserve existing spacing and alignment by applying styling after label construction rather than before width calculations.
- Apply a lighter style to tree glyphs only, not to ids or labels.
- Gate styling behind color support checks so dumb terminals get plaintext output.
- Ensure any new helper is available to both the CLI and db-worker-node build targets.
- Update tests to use ANSI stripping for alignment assertions and explicit style presence for keyword checks.
- Avoid adding new configuration flags unless tests cannot reliably assert output without them.

## Question

Styling is limited to help info and show human output for now.

---
