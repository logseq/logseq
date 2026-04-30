# Logseq CLI Show Block Breadcrumb Implementation Plan

Goal: Add a one-line parent breadcrumb above `logseq show` human output when the shown entity is an ordinary block.

Architecture: Keep the existing `logseq-cli -> transport/invoke -> db-worker-node thread-api` flow and implement this as a human-rendering enhancement in `show` command orchestration.

Architecture: Reuse existing thread APIs, especially `:thread-api/get-block-parents`, and avoid adding any new thread-api unless an implementation dead-end is proven.

Tech Stack: ClojureScript, `logseq.cli.command.show`, db-worker-node `frontend.worker.db-core`, Datascript parent traversal from `logseq.db/get-block-parents`, ANSI styling helpers, and optional display-width truncation via `string-width`.

Related: Builds on `docs/agent-guide/024-logseq-cli-show-updates.md`, `docs/agent-guide/029-logseq-cli-show-properties.md`, and `docs/agent-guide/065-logseq-cli-show-ref-id-footer.md`.

## Problem statement

Current `logseq show` human output starts directly from the selected entity line.

When users show a deep block by id or uuid, they cannot quickly see where that block sits in the page hierarchy.

The request is to add a breadcrumb above the shown block for ordinary block entities, where ordinary means not page, not property, and not tag.

The breadcrumb must include parent lineage up to the page and keep each segment at a fixed maximum length.

This should not require introducing new thread APIs when current db-worker-node capabilities are already sufficient.

## Current baseline from implementation

The current show flow is centered in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`.

`fetch-tree` resolves the target entity by `--id`, `--uuid`, or `--page`, and builds children by querying blocks within the page.

Human output is composed by `render-tree-text` and `tree->text`, with optional linked references and referenced-entity footer.

db-worker-node already exposes `:thread-api/get-block-parents` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.

That API delegates to `logseq.db/get-block-parents` in `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db.cljs`, which traverses from a block to its ancestors.

This means we can fetch breadcrumb lineage without adding a new thread API.

## Scope and constraints

### In scope.

Add breadcrumb rendering for human output only when target is an ordinary block.

Compute breadcrumb from page to nearest parent and render it as one line above root block text.

Apply fixed segment truncation for each breadcrumb node label.

Keep existing linked references and referenced-entities footer behavior intact.

### Out of scope.

Any change to JSON or EDN output payload schema.

Any change to db-worker-node transport protocol.

Any new thread-api, unless the implementation proves existing APIs cannot satisfy the requirement.

### Locked decisions.

Do not add new thread-api as a first approach.

Breadcrumb is rendered only in `--output human` path.

Segment max length is a fixed constant in CLI code, not a user option in this phase.

## Ordinary block definition for this feature

Use a data-driven rule on the shown root entity.

| Condition | Meaning |
| --- | --- |
| `:block/page` exists with `:db/id` | Entity is a block under a page, not a page root. |
| `:logseq.property/created-from-property` absent | Excludes property-value pseudo blocks. |
| Class tags do not mark schema-definition roots | Defensive guard for tag/property/page schema entities when present. |

Schema-definition detection should use class idents from `:block/tags`, such as `:logseq.class/Tag` and `:logseq.class/Property`, when available in pulled data.

## Proposed UX

For ordinary block targets, prepend one breadcrumb line.

Example.

```text
Project Alpha > Milestone 2026 > API rollout
5137 Implement retry policy for upload worker
5138 ├── Add timeout backoff guard
5139 └── Add deterministic retry test
```

For page targets, property targets, and tag targets, keep current output unchanged.

For multi-id mode, each successful ordinary block segment gets its own breadcrumb line.

## Breadcrumb truncation policy

Introduce a constant such as `show-breadcrumb-segment-max-display-width` with value `24`.

Truncate each segment independently to this visual width.

Use an ellipsis suffix `…` when truncation happens.

Prefer display-width-aware truncation to avoid CJK misalignment.

Separator should be a plain ` > ` for compatibility and snapshot stability.

## Integration design

```text
logseq show
  -> execute-show
    -> build-tree-data (existing)
    -> enrich human render context (new)
      -> if ordinary block
         -> transport/invoke :thread-api/get-block-parents
         -> format/truncate breadcrumb segments
    -> render-tree-text
      -> prepend breadcrumb line
      -> existing tree text
      -> existing linked refs and footer behavior
```

No db-worker-node API surface change is required.

The only db-worker interaction addition is calling an existing method from CLI.

## Files to modify

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs`.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`.

`/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`.

## Implementation plan (TDD order)

1. Add failing unit tests for breadcrumb segment truncation helper, including ASCII, CJK, exact-width, and one-over-width cases.

2. Add failing unit tests for root entity classification helper that distinguishes ordinary block vs page/property/tag.

3. Add failing unit tests for breadcrumb text assembly order from page to nearest parent.

4. Add failing `execute-show` tests in `show_test.cljs` asserting breadcrumb appears above root line for ordinary block targets.

5. Add failing `execute-show` tests asserting breadcrumb is absent for page targets.

6. Add failing `execute-show` tests asserting breadcrumb is absent for tag/property schema targets.

7. Add failing multi-id tests asserting each successful ordinary block section contains its own breadcrumb.

8. Add failing tests asserting `:thread-api/get-block-parents` is not called when target is non-ordinary.

9. Run the new tests and verify they fail for missing breadcrumb behavior, not due to broken fixtures.

10. Extend root selectors in `fetch-tree` pulls to include fields needed for classification, including class-tag idents and `:logseq.property/created-from-property` where necessary.

11. Implement `ordinary-block-root?` helper in `show.cljs` using root entity shape and class tags.

12. Implement breadcrumb label normalization helper with fallback order `:block/title`, `:block/name`, UUID string, and `:db/id` fallback.

13. Implement display-width truncation helper and fixed max-width constant for breadcrumb segments.

14. Implement `fetch-breadcrumb-parents` helper that calls existing `:thread-api/get-block-parents` only for ordinary block roots.

15. Implement `render-breadcrumb-line` helper that joins truncated labels with ` > ` in page-to-parent order.

16. Integrate breadcrumb composition in human render path before `tree->text` output.

17. Ensure linked references section and referenced-entities footer still append exactly as before.

18. Ensure structured output path remains unchanged by keeping breadcrumb context out of JSON and EDN payloads.

19. Update or add command help documentation section in `docs/cli/logseq-cli.md` with one human-output example showing breadcrumb.

20. Re-run targeted tests and then broader CLI regression suites.

## Testing Plan

I will add focused unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs` for breadcrumb truncation, lineage ordering, and ordinary-block classification behavior.

I will add behavioral render tests in the same file that call `execute-show` with mocked transport responses and verify breadcrumb placement above root tree output.

I will extend `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` only where shared tree rendering or option-level behavior needs regression coverage.

I will run targeted tests with `bb dev:test -v logseq.cli.command.show-test` and `bb dev:test -v logseq.cli.commands-test`.

I will then run `bb dev:lint-and-test`.

I will run CLI e2e non-sync regression with `bb -f cli-e2e/bb.edn test --skip-build`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Edge cases

Parent chain contains missing titles, so breadcrumb must fallback deterministically.

A block directly under page should produce a one-segment breadcrumb containing just the page.

A very deep hierarchy must still render in correct order with each segment independently truncated.

A target resolved by `--uuid` should behave identically to `--id` for breadcrumb behavior.

Multi-id output must preserve existing delimiter and error segment behavior.

When parent lookup fails transiently, show should still render the tree and omit breadcrumb rather than fail the command.

## Risks and mitigation

Risk: Extra parent fetch adds latency for each ordinary block render.

Mitigation: Call `:thread-api/get-block-parents` only when classification says ordinary block.

Risk: Classification drift if tag/property schemas are represented unexpectedly in data.

Mitigation: Keep classification helper table-driven and back it with explicit tests for schema-tag variants.

Risk: Truncation may produce unstable snapshots across mixed-width terminals.

Mitigation: Use display-width-aware truncation with deterministic suffix handling and strip-ansi assertions in tests.

## Testing Details

Tests validate user-visible behavior by asserting final human text composition order and content, not private intermediate maps.

Classification tests validate rendered outcomes and thread-api call gating instead of only testing helper internals.

Multi-id tests verify segment-local breadcrumb insertion and unchanged delimiter behavior.

## Implementation Details

- Keep breadcrumb logic in `show.cljs` render orchestration and avoid changing formatter-wide code.
- Reuse existing `:thread-api/get-block-parents` and do not introduce a new thread API.
- Add only the minimal extra selector fields required for ordinary-block classification.
- Use a fixed segment display-width constant with ellipsis truncation.
- Render breadcrumb as a single line above the root block line.
- Keep linked references rendering behavior unchanged.
- Keep referenced-entity footer behavior unchanged.
- Keep JSON and EDN output schema unchanged.
- Ensure failures in breadcrumb enrichment degrade gracefully to current output.
- Document the new human output behavior in CLI docs.

## Question

No open questions.

Decisions confirmed.

Use plain separator ` > `.

Use breadcrumb segment max display width `24`.

---
