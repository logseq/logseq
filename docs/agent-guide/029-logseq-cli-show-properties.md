# Logseq CLI Show Properties Implementation Plan

Goal: Display block properties in the human-readable output of the logseq-cli show command.

Architecture: Extend the show command pull selectors to include property data from db-worker-node, then enrich tree->text to append formatted property lines per block.
Architecture: Keep JSON and EDN outputs structurally the same, while only altering the human text renderer to include properties beneath each block label.

Tech Stack: ClojureScript, Datascript pull selectors, logseq-cli, db-worker-node thread-api.

Related: Builds on 028-logseq-cli-verbose-debug.md.

## Problem statement

The logseq-cli show command currently renders block trees without any property visibility.
Users need to see each block's properties directly under the block content in the human output so that show reflects the same metadata they rely on in the UI.
Property lines belong to the same block tree element, so they must not render with tree glyphs.
The display must show "<property-name>: <property-value>" and must handle single-value properties as a single line and multi-value properties as an indented list as shown in the example.

## Testing Plan

I will add a unit test that asserts tree->text renders single-value properties in one line after the block content.
I will add a unit test that asserts tree->text renders multi-value properties as a dash list aligned under the property name.
I will add a unit test that asserts user property order follows a stable key order.
I will add a unit test that asserts properties do not break multiline block alignment for both root and child blocks.
I will add a unit test that asserts property values only appear in property-kvs and never in block/children.
I will update selector coverage tests to assert property selectors are included in show pulls.
I will add an integration test that asserts show output includes property lines.

NOTE: I will write *all* tests before I add any implementation behavior.

## Context and integration points

The show command data path is: CLI action -> transport/invoke -> db-worker-node -> pull/query -> tree data -> tree->text human rendering.
The pull selectors in logseq.cli.command.show define what properties are available to tree->text.
User properties are stored directly on block entities with keys in the :user.property/* namespace.

ASCII diagram of the flow:

CLI show
  |
  |  transport/invoke :thread-api/pull / :thread-api/q
  v
DB worker node
  |
  |  returns tree data with block maps
  v
logseq.cli.command.show/tree->text
  |
  |  renders block label + property lines
  v
stdout

## Files to touch

| File path | Purpose |
| --- | --- |
| src/main/logseq/cli/command/show.cljs | Add property selectors, build property lines, and render properties in tree->text. |
| src/test/logseq/cli/commands_test.cljs | Add tree->text unit tests for property rendering and selector coverage. |
| src/test/logseq/cli/integration_test.cljs | Add integration coverage for show property rendering output. |

## Implementation plan (TDD-ordered)

1. Read @prompts/review.md to align with review expectations.
2. Add failing unit tests for tree->text:
   - single-value property rendering
   - multi-value property rendering with dash list formatting + alignment
   - user property ordering
   - multiline alignment with properties
3. Add failing selector coverage test asserting show pull patterns include property selectors.
4. Add failing integration test asserting show output includes property lines.
5. Run each new test and confirm failures reference missing property behavior (not test errors).
6. Update show pull selectors in src/main/logseq/cli/command/show.cljs to include :user.property/* attributes so db-worker-node returns needed data.
7. Add helpers in src/main/logseq/cli/command/show.cljs to:
   - collect and sort user property keys
   - normalize user property values into a vector of display strings
   - format property lines for single vs multi values
8. Extend tree->text in src/main/logseq/cli/command/show.cljs to append property lines after block label lines, preserving indentation rules and no tree glyphs.
9. Re-run unit tests and selector test; confirm they pass.
10. Re-run integration test; confirm it passes.
11. Run `bb dev:lint-and-test` and confirm all linters and tests pass.

## Edge cases to handle

User properties with empty values should be skipped to avoid blank lines in the output.
User properties with values that are sets, vectors, or lists should render each item as a separate dash line.
User properties with values that are entities or maps should render as :block/title, :block/name, or :logseq.property/value when present.
User properties must be detected only via the :user.property/* namespace and no other property sources should be displayed.
Blocks without properties should render exactly as they do today.
Linked references output should include properties for each block without breaking the existing tree formatting.
Property lines should not include tree glyphs or branch markers.

## Implementation details for formatting

Use a stable sort order for :user.property/* keys, such as ascending by keyword name.
Do not use :block/properties-text-values for db-graph output.
Format user property values from :user.property/* attributes and coerce values into strings using :block/title, :block/name, or :logseq.property/value.
Render single values as "Property: value" and multi values as "Property: - v1" with subsequent lines aligned under the dash list.
Align property lines with the block content column and preserve tree glyph indentation, but do not render additional tree glyphs for properties.

## Questions

Properties should display using their :block/title for the property name, derived from the property entity when available, and never fall back to :db/ident.
Hidden or internal properties must be filtered out to avoid noise in CLI output.
Tags must render as #tags only and must not be listed as properties.
:block/properties-text-values is file-graph only and should be ignored for db-graph output.

## Testing Details

The new tests will directly exercise tree->text with synthetic tree data that includes :user.property/* attributes to ensure the human output matches the requested format.
The new tests will assert property values are only present in property-kvs and do not appear in block/children output.
The selector test will validate that the show pull patterns include property attributes so db-worker-node can provide the necessary data.
These tests verify output behavior, ordering, and indentation rather than internal helper logic.
The integration test will validate that show output includes property lines end-to-end.

## Implementation Details

- Update tree-block-selector and linked-ref-selector to pull :user.property/* attributes.
- Update the id and uuid fetch pull patterns to include the same property fields.
- Add a property normalization helper that returns ordered [key values] pairs.
- Add a value formatting helper that converts each property value into displayable strings.
- Extend tree->text to append property lines after block content lines for both root and child nodes.
- Keep JSON and EDN outputs intact aside from the additional property keys pulled from the db.
- Property values should only appear in property-kvs; do not surface property values in block/children.
- Add new unit tests for single-value, multi-value, ordering, and multiline alignment cases.
- Add a selector test that asserts property selectors are included.

## Example output

Current:
```
5137 Done Add git sha when graph is created for improved debugging #Issue
5138 ├── Motivated by wanting to ensure missing addresses bug isn't happening in new graphs - https://logseq.slack.com/archives/C04ENNDPDFB/p1748290483138269
5139 ├── When a DB graph is created in app, store git SHA used to create it in entity :logseq.kv/graph-git-sha
5140 └── When a DB graph is created with a script, store git SHA used to create it in entity :logseq.kv/graph-git-sha
```

Target:
```
5137 Done Add git sha when graph is created for improved debugging #Issue
     Background: Motivated by wanting to ensure missing addresses bug isn't happening in new graphs - https://logseq.slack.com/archives/C04ENNDPDFB/p1748290483138269
     Acceptance Criteria:
       - When a DB graph is created in app, store git SHA used to create it in entity :logseq.kv/graph-git-sha
       - When a DB graph is created with a script, store git SHA used to create it in entity :logseq.kv/graph-git-sha
```

## Question

JSON and EDN outputs must include property values alongside the existing data.

---
