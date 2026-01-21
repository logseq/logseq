# Logseq CLI Verb-First Subcommands Implementation Plan

Goal: Refactor logseq-cli to remove the block subcommand group and replace it with verb-first subcommands for list, add, remove, search, and show.

Architecture: Keep the babashka/cli dispatch table but reorganize it into verb-first subcommands, and route each verb to typed actions for pages, blocks, tags, and properties through existing db-worker-node thread-apis.

Tech Stack: ClojureScript, babashka/cli, db-worker-node thread-apis, Datascript queries.

Related: Builds on docs/agent-guide/003-db-worker-node-cli-orchestration.md and docs/agent-guide/002-logseq-cli-subcommands.md.

## Problem statement

The current CLI uses a block subcommand group, which makes the interface noun-first and inconsistent with graph and server commands.

We need to make the CLI verb-first, so that content operations are consistent with other tooling and easier to extend for new resource types.

The refactor must preserve existing behaviors for add, remove, search, and tree while adding list commands for pages, tags, and properties, and renaming tree to show.

## Testing Plan

I will add unit tests that cover verb-first parsing, group help output, and option validation for list, add, remove, search, and tree.

I will add unit tests that assert list option parsing for each list subtype and that invalid flag combinations are rejected.

I will add integration tests that run list, add, remove, search, and tree against a real db-worker-node with a test graph and assert output shapes.

I will follow @test-driven-development for all behavior changes.

NOTE: I will write *all* tests before I add any implementation behavior.

## Command surface

The block subcommand group is removed and replaced with verb-first subcommands.

Help output groups commands into two sections, with Graph Inspect and Edit first, and Graph Management last.

Group names and order:

| Group | Commands | Order |
| --- | --- | --- |
| Graph Inspect and Edit | list, add, remove, search, show | First |
| Graph Management | graph, server | Last |

| Command | Subcommand | Purpose |
| --- | --- | --- |
| list | page | List pages |
| list | tag | List tags |
| list | property | List properties |
| add | block | Add blocks |
| add | page | Create page |
| remove | block | Remove block |
| remove | page | Remove page |
| search | none | Search across resources |
| show | none | Show block tree |

Global options remain unchanged and are shared across all commands.

## List options detail

The list command should expose a consistent shape across resource types.

Common list options:

| Option | Applies to | Purpose | Notes |
| --- | --- | --- | --- |
| --expand | page, tag, property | Include expanded metadata | Maps to existing api-list-* expand behavior. |
| --limit N | page, tag, property | Limit results | Implemented in CLI after fetch unless server supports it. |
| --offset N | page, tag, property | Offset results | Implemented in CLI after fetch unless server supports it. |
| --sort FIELD | page, tag, property | Sort results | Field whitelist per type. |
| --order asc|desc | page, tag, property | Sort direction | Defaults to asc. |
| --output FORMAT | all | Output format | Existing output handling. |

List page options:

| Option | Purpose | Notes |
| --- | --- | --- |
| --include-journal | Include journal pages | Default is include all. |
| --journal-only | Only journal pages | Requires journal detection in api-list-pages. |
| --include-hidden | Include hidden pages | Requires a flag to bypass entity-util/hidden? filtering. |
| --updated-after ISO8601 | Filter by updated-at | Compare to :block/updated-at. |
| --created-after ISO8601 | Filter by created-at | Compare to :block/created-at. |
| --fields FIELD,FIELD | Select output fields | Applies when --expand is true. |

List tag options:

| Option | Purpose | Notes |
| --- | --- | --- |
| --include-built-in | Include built-in classes | Built-in tags are currently included by default, clarify behavior. |
| --with-properties | Include class properties | Uses :logseq.property.class/properties when expanded. |
| --with-extends | Include class extends | Uses :logseq.property.class/extends when expanded. |
| --fields FIELD,FIELD | Select output fields | Applies when --expand is true. |

List property options:

| Option | Purpose | Notes |
| --- | --- | --- |
| --include-built-in | Include built-in properties | Built-in properties are currently included by default, clarify behavior. |
| --with-classes | Include property classes | Uses :logseq.property/classes when expanded. |
| --with-type | Include property type | Uses :logseq.property/type when expanded. |
| --fields FIELD,FIELD | Select output fields | Applies when --expand is true. |

List block is removed to avoid overlap with search.

## Search options detail

Search has no subcommands and searches across pages, blocks, tags, and properties by default. Human output columns are `ID` (db/id) and `TITLE`.
Search and show outputs resolve block reference UUIDs in text. Nested references are resolved recursively up to 10 levels (e.g., `[[<uuid1>]]` → `[[some text [[<uuid2>]]]]`, then `<uuid2>` is also replaced).

| Option | Purpose | Notes |
| --- | --- | --- |
| QUERY | Search text | Required positional argument. |
| --type page|block|tag|property|all | Restrict types | Default is all. |
| --tag NAME | Restrict to a specific tag | Tag is a class page, e.g. Page, Asset, Task. |
| --case-sensitive | Case sensitive search | Default is case-insensitive. |
| --sort updated-at|created-at | Sort results | Default is relevance or stable order. |
| --order asc|desc | Sort direction | Defaults to desc for time sorts. |

## Tree options detail

Show has no subcommands and returns the block tree for a page or block.

| Option | Purpose | Notes |
| --- | --- | --- |
| --id ID | Tree root by :db/id | Mutually exclusive with other identifiers. |
| --uuid UUID | Tree root by :block/uuid | Mutually exclusive with other identifiers. |
| --page-name NAME | Tree root by :block/title for a #Page block | Must be a page. |
| --level N | Limit tree depth | N >= 1, default 10. |
| --format text|json|edn | Output format | Existing behavior. |

## Plan

1. Review current CLI command parsing and action routing in src/main/logseq/cli/commands.cljs to map block group behavior to verb-first commands.
2. Add failing unit tests in src/test/logseq/cli/commands_test.cljs for verb-first help output and parse behavior for list, add, remove, search, and show.
3. Add failing unit tests that assert list subtype option parsing and validation for list page, list tag, and list property.
4. Add failing unit tests that assert search defaults to all types and respects --type and positional text.
5. Add failing unit tests that assert show accepts --page-name, --uuid, or --id and rejects missing targets.
6. Run bb dev:test -v logseq.cli.commands-test/test-parse-args and confirm failures are about the new verbs and options.
7. Update src/main/logseq/cli/commands.cljs to replace block subcommands with verb-first entries and to add list subcommand group.
8. Update summary helpers in src/main/logseq/cli/commands.cljs to show group help for list, add, and remove instead of block, and to render help groups as Graph Inspect and Edit first, Graph Management last.
9. Update src/main/logseq/cli/main.cljs usage string to reflect the verb-first command surface.
10. Add list option specs in src/main/logseq/cli/commands.cljs and update validation to enforce required args and mutually exclusive flags.
11. Implement list actions in src/main/logseq/cli/commands.cljs that call existing thread-apis for pages, tags, and properties.
12. Implement add page using thread-api/apply-outliner-ops with :create-page in src/main/logseq/cli/commands.cljs.
13. Update search logic in src/main/logseq/cli/commands.cljs to query all resource types and honor --type, --tag, --sort, and --order.
14. Update show logic in src/main/logseq/cli/commands.cljs to support --id, --uuid, --page-name, and --level.
15. Add failing integration tests in src/test/logseq/cli/integration_test.cljs for list page, list tag, list property, add page, remove page, search all, and show.
16. Run bb dev:test -v logseq.cli.integration-test/test-cli-list-and-search and confirm failures before implementation.
17. Implement behavior for list, add, remove, search, and show until all tests pass.
18. Update docs/cli/logseq-cli.md with new verb-first commands and examples.
19. Run bb dev:test -r logseq.cli.* and confirm 0 failures and 0 errors.
20. Run bb dev:lint-and-test and confirm a zero exit code.

## Edge cases

Missing subcommand should return group help for list, add, or remove, and still exit with a non-zero status.

Unknown subcommands should return a helpful error message that lists the valid subcommands.

Add block should still default to today’s journal page when no page is provided and no parent is provided.

Search across all types should avoid duplicate hits when a tag or property is also a page with the same title.

Show should return a deterministic order based on :block/order.

## Testing commands and expected output

Run a single unit test in red phase.

```bash
bb dev:test -v logseq.cli.commands-test/test-parse-args
```

Expected output includes failing assertions about the new verb-first commands and ends with a non-zero exit code.

Run the integration tests in red phase.

```bash
bb dev:test -v logseq.cli.integration-test/test-cli-list-add-search-show-remove
```

Expected output includes failing assertions about list and search output and ends with a non-zero exit code.

Run the full suite in green phase.

```bash
bb dev:test -r logseq.cli.*
```

Expected output includes 0 failures and 0 errors.

Run lint and tests after all changes.

```bash
bb dev:lint-and-test
```

Expected output includes successful linting and tests with exit code 0.

## Testing Details

The unit tests will validate parsing, help output, and option validation for each new verb-first command.

The integration tests will create a temporary graph, add pages, tags, and properties, and verify list, search, and tree output against db-worker-node behavior.

## Implementation Details

- Replace block group entries with list, add, remove, search, and show in src/main/logseq/cli/commands.cljs.
- Add list subtype specs and validation, including common list options and per-type field filtering in src/main/logseq/cli/commands.cljs.
- Extend search to combine page, block, tag, and property queries and to enforce --type and --tag behavior in src/main/logseq/cli/commands.cljs.
- Preserve existing add block and remove block behavior while changing only the command paths and option names.
- Rename tree to show and add id, uuid, page-name, and level parsing in src/main/logseq/cli/commands.cljs.
- Update docs/cli/logseq-cli.md to show new usage and examples.

## Question

None.

---
