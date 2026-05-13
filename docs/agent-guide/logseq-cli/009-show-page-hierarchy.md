# Show Normal Page Hierarchy Implementation Plan

Goal: Add a `logseq show` option named `--page-hierarchy` so an ordinary page can display its child page hierarchy when requested, while preserving the current ordinary page content-tree behavior by default.

Architecture: Keep the behavior inside the existing CLI `show` command namespace.
Architecture: Reuse the current `db-worker-node` transport APIs, especially `:thread-api/pull` and `:thread-api/q`; do not add a new thread API unless concrete implementation work proves the existing query/pull path cannot fetch the required page hierarchy.
Architecture: Build on the existing `show --page Library` implementation, which already renders page hierarchy data through `:block/parent` and the shared `show` tree renderer.
Architecture: Keep `--page-hierarchy` defaulting to `false` so normal `show --page <page>` output remains unchanged unless the option is explicitly enabled.

Tech Stack: ClojureScript, Logseq CLI `show`, Datascript queries through `db-worker-node`, page hierarchy stored in `:block/parent`, `logseq.db` entity predicates, Promesa, CLI unit tests, command parser tests, CLI formatter/structured-output tests, and CLI e2e manifests.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/008-show-library-page.md`, the current implementation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`, and the `db-worker-node` thread APIs in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.

## Problem statement

The current CLI `show` command has two page-related display modes:

1. Ordinary pages render their content blocks by querying blocks whose `:block/page` is the selected page id.
2. The built-in `Library` page is special-cased to render child page entities whose `:block/parent` points at `Library`, recursively.

This is correct for default `show --page <page>` behavior because users expect page content blocks by default.

However, Logseq DB graphs can also represent page hierarchy through page entities connected by `:block/parent`. Namespace page creation such as `foo/bar/baz` creates page parent relationships, and the Desktop App can show page breadcrumb/hierarchy relationships based on that parent chain.

The CLI currently has no explicit way to ask an ordinary page target to render its child page hierarchy instead of its content blocks.

The requested feature is to add a `--page-hierarchy` option to `show`:

```text
logseq show --page Foo --page-hierarchy true
```

When the option is true and the selected target is an ordinary page, `show` should display the selected page as the root and recursively display child pages whose `:block/parent` points at that page.

When the option is omitted or false, `show --page Foo` must continue to display page content blocks exactly as it does today.

After implementation, review the change with `logseq-review-workflow` before considering the work complete.

## Current implementation snapshot

The current show command lives in:

```text
/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs
```

The current option spec is `show-spec`, which already contains boolean options such as:

```text
:linked-references
:ref-id-footer
```

The current action construction path is:

```text
show-spec
  -> core/command-entry
  -> commands/build-action
  -> show-command/build-action
```

`show-command/build-action` currently stores normalized options in the action map, including:

```text
:linked-references?
:ref-id-footer?
:uuid
:page
:level
```

The current page fetch path is:

```text
fetch-tree
  -> pull selected entity with show-root-selector
  -> attach-user-properties-to-entity
  -> fetch-tree-for-entity
```

`fetch-tree-for-entity` currently routes entities like this:

```text
if built-in Library page
  -> fetch-library-tree-for-entity
else if entity has [:block/page :db/id]
  -> block subtree path
else if entity has :db/id
  -> ordinary page content path using fetch-blocks-for-page
else
  -> not found error
```

The ordinary page content path uses:

```text
fetch-blocks-for-page
  -> :thread-api/q
  -> query blocks by [?b :block/page ?page-id]
  -> remove property value blocks
  -> attach user properties
  -> build-tree grouped by [:block/parent :db/id]
```

The Library page hierarchy path uses:

```text
fetch-library-tree-for-entity
  -> fetch-library-children
  -> :thread-api/q
  -> query children by [?child :block/parent ?parent-id]
  -> filter ordinary display pages
  -> sort by :block/order
  -> recurse with cycle protection
```

The existing Library implementation proves that the current `db-worker-node` transport is sufficient for this feature:

```text
:thread-api/pull
  -> fetch selected page/block entities

:thread-api/q
  -> fetch page hierarchy children by :block/parent

:thread-api/get-block-refs
  -> existing linked-reference behavior

:thread-api/get-block-parents
  -> existing breadcrumb behavior for ordinary block roots
```

Therefore, the first implementation should not add any new thread API.

## Page hierarchy model

Ordinary page hierarchy is stored with `:block/parent` links between page entities.

Examples from the current codebase:

- `/Users/rcmerci/gh-repos/logseq/deps/outliner/src/logseq/outliner/page.cljs` can create namespace pages with parent relationships when `:split-namespace? true`.
- `/Users/rcmerci/gh-repos/logseq/deps/outliner/test/logseq/outliner/page_test.cljs` verifies namespace pages such as `foo/bar/baz` produce `foo -> bar -> baz` parent relationships.
- `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db/frontend/db.cljs` exposes `get-page-parents`, which walks `:block/parent` upward for page entities.
- The existing CLI Library path walks the inverse direction by querying children where `:block/parent` equals the current page id.

The new CLI option should use the same inverse child query as the Library path for ordinary pages.

## Desired CLI behavior

### Default behavior remains unchanged

These commands must continue to render ordinary page content blocks:

```text
logseq show --page Foo
logseq show --page Foo --page-hierarchy false
```

For ordinary pages, the default path must keep querying `:block/page` content blocks and must not query `:block/parent` page children just because page hierarchy exists.

### Explicit page hierarchy behavior

This command should render page hierarchy:

```text
logseq show --page Foo --page-hierarchy true
```

Expected tree shape:

```text
Foo
└── Bar
    └── Baz
```

Where:

```text
Bar has :block/parent Foo
Baz has :block/parent Bar
```

The root row should be the selected page entity.

Child rows should be child page entities whose `:block/parent` points at the selected page.

Nested rows should be child page entities whose `:block/parent` points at another page already displayed in the hierarchy.

Children should be sorted by `:block/order`, matching the existing block tree and Library page hierarchy behavior.

The hierarchy display should not inline ordinary content blocks from child pages. If `Bar` has normal content blocks whose `:block/page` is `Bar`, those blocks should not appear in `show --page Foo --page-hierarchy true`.

### Filtering

Use the same display filter as the current Library implementation unless implementation research proves normal page hierarchy needs a different Desktop semantic:

```text
show ordinary page entities
hide class pages
hide property pages
hide non-page blocks
```

This matches the current `library-display-page?` behavior:

```text
ldb/page?
not ldb/class?
not ldb/property?
```

The implementation should avoid showing arbitrary non-page blocks that happen to have `:block/parent` pointing at a page.

### `--level`

`--level` should limit page hierarchy depth exactly like it limits existing `show` trees.

Use the existing convention:

```text
root depth = 1
children are omitted when depth >= max-depth
```

Example:

```text
logseq show --page Foo --page-hierarchy true --level 2
```

Should show `Foo -> Bar` but omit `Baz` in `Foo -> Bar -> Baz`.

### `Library` compatibility

`logseq show --page Library` should keep the existing special Library behavior without requiring `--page-hierarchy true`.

The `--page-hierarchy` flag should not break or replace Library behavior.

These commands should both render the Library page hierarchy:

```text
logseq show --page Library
logseq show --page Library --page-hierarchy true
```

The Library branch should remain special because it is current shipped behavior and because the feature request specifically asks to reference `show --page Library`, not to make Library require the new flag.

### Target scope

The option is primarily for page targets.

Recommended behavior:

- If the selected entity is a page and `:page-hierarchy?` is true, render page hierarchy.
- If the selected entity is the built-in Library page, render Library hierarchy regardless of the flag.
- If the selected entity is an ordinary block, keep the current block subtree behavior even if the flag is true.

This allows `--id <page-id> --page-hierarchy true` and `--uuid <page-uuid> --page-hierarchy true` to behave consistently when the id or UUID selects a page, while avoiding surprising changes for block targets.

If implementation discovers that supporting `--id`/`--uuid` page targets adds ambiguity or broadens the contract too much, narrow the first implementation to `--page` targets only and add tests documenting that scope. Prefer consistency for page entities if it remains simple.

### Linked references and UUID references

Linked references should keep the current behavior.

If linked references are enabled, `show` should fetch linked references for the rendered root id, just as it does today.

UUID reference collection should continue to run over the root tree and linked references after page hierarchy construction.

No page-hierarchy-specific linked-reference or UUID-reference code should be necessary if the page hierarchy tree is represented as ordinary `:root` + `:block/children` data.

### Structured output

`--output json` and `--output edn` should expose the page hierarchy under the existing structured output shape:

```text
[:data :root :block/children]
```

Do not add a second top-level hierarchy field.

Do not add human-only labels such as `Page hierarchy` to structured output.

If implementation adds internal traversal metadata, use `:show/*` keys so `strip-show-internal-data` removes it automatically.

Structured output should continue to remove `:block/uuid` through the existing `sanitize-structured-tree` path.

## Recommended implementation approach

Keep the implementation in:

```text
/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs
```

Do not create a new command.

Do not add a new `db-worker-node` thread API for the first implementation.

Use existing worker transport calls:

```text
:thread-api/pull
:thread-api/q
:thread-api/get-block-refs
:thread-api/get-block-parents
```

### Add the CLI option

Add `:page-hierarchy` to `show-spec`:

```text
:page-hierarchy {:desc "Show child page hierarchy for page targets (default false)"
                 :coerce :boolean}
```

Add the value to the action map in `build-action`:

```text
:page-hierarchy? (if (contains? options :page-hierarchy)
                   (:page-hierarchy options)
                   false)
```

Because `false` is the default, existing tests and behavior should remain stable.

Update `entries` examples only if helpful. A concise example is enough:

```text
logseq show --graph my-graph --page Foo --page-hierarchy true
```

### Generalize Library hierarchy helpers

The current Library helper names are Library-specific:

```text
library-child-selector
library-display-page?
fetch-library-children
fetch-library-tree-for-entity
```

The behavior is now useful for both Library and ordinary page hierarchy.

Recommended refactor:

```text
library-child-selector
  -> page-hierarchy-child-selector

library-display-page?
  -> page-hierarchy-display-page?

fetch-library-children
  -> fetch-page-hierarchy-children

fetch-library-tree-for-entity
  -> fetch-page-hierarchy-tree-for-entity
```

Keep `library-page?` as the Library detection predicate.

After refactoring, `fetch-page-hierarchy-tree-for-entity` should still be used by the Library branch.

This avoids duplicating the recursive hierarchy traversal and ensures future fixes apply to both `Library` and ordinary page hierarchy.

### Preserve the Library contract

Route Library before ordinary page behavior, as it works today:

```text
if library-page? entity
  fetch-page-hierarchy-tree-for-entity
```

Do not require `:page-hierarchy? true` for the Library page.

Do not treat arbitrary pages titled `Library` as built-in Library unless `ldb/library?` returns true.

### Add an ordinary page hierarchy route

`fetch-tree-for-entity` currently receives only:

```text
config repo entity max-depth
```

It needs access to the action option.

Recommended options:

1. Add a `page-hierarchy?` argument:

```text
fetch-tree-for-entity config repo entity max-depth page-hierarchy?
```

2. Or pass a small context map:

```text
fetch-tree-for-entity config repo entity {:max-depth max-depth
                                          :page-hierarchy? page-hierarchy?}
```

The context-map approach is easier to extend but touches more call sites. The extra-argument approach is simpler and likely enough.

Then route page entities like this:

```text
fetch-tree-for-entity config repo entity max-depth page-hierarchy?
  if library-page? entity
    fetch-page-hierarchy-tree-for-entity
  else if page-hierarchy? and ordinary page entity
    fetch-page-hierarchy-tree-for-entity
  else if entity has [:block/page :db/id]
    existing block subtree path
  else if entity has :db/id
    existing normal page content path
```

Define a clear page predicate for the new branch.

A page entity in this command is typically an entity without `[:block/page :db/id]` and with `ldb/page?` true. Prefer using `ldb/page?` because selectors already include `:block/tags` with `:db/ident` for tag predicates.

Avoid enabling page hierarchy for ordinary content blocks.

### Keep selectors shallow

The current `show-root-selector` already includes page tags, parent, order, title, name, UUID, built-in marker, status, and link fields.

The current `library-child-selector` includes the fields needed to render page rows and evaluate predicates.

When generalizing it to `page-hierarchy-child-selector`, keep it shallow and avoid recursive Datascript pull selectors.

The child selector should include at least:

```text
:db/id
:db/ident
:block/name
:block/uuid
:block/title
:block/order
:logseq.property/built-in?
{:logseq.property/status [:db/ident :block/title]}
{:block/parent [:db/id :block/name :block/title :block/uuid]}
{:block/tags [:db/id :db/ident :block/name :block/title :block/uuid]}
{:block/link link-target-selector}
```

Do not fetch normal page content blocks for page hierarchy mode.

### Fetching page hierarchy children

Use the same query shape as Library currently uses:

```text
[:find (pull ?child page-hierarchy-child-selector)
 :in $ ?parent-id
 :where [?child :block/parent ?parent-id]]
```

Then:

1. `map first` over rows.
2. Filter with `page-hierarchy-display-page?`.
3. Sort by `:block/order`.
4. Attach user properties with `attach-user-properties` if hierarchy rows should preserve the existing CLI row-property rendering behavior.

Use `attach-user-properties` for consistency with Library and ordinary page rows.

### Cycle protection

Keep the existing Library cycle protection and apply it to ordinary page hierarchy too.

If a malformed graph creates a `:block/parent` cycle, fail fast instead of recursing indefinitely.

The existing error code is:

```text
:library-parent-cycle
```

When generalizing the helper, rename the error to a broader code if tests can be updated cleanly:

```text
:page-hierarchy-parent-cycle
```

If preserving the existing `:library-parent-cycle` test is preferable to minimize churn, keep the old code but document that it also protects general page hierarchy. The cleaner long-term choice is to rename and update Library tests.

### Linked block interaction

The current linked-block resolver calls `fetch-tree-for-entity` for linked targets.

After `fetch-tree-for-entity` gains a `page-hierarchy?` argument, pass the current action option through linked resolution.

Recommended behavior:

- If the user runs `show --page Foo --page-hierarchy true` and a displayed hierarchy row links to another page, linked target resolution should use the same `page-hierarchy?` setting for page targets.
- If this creates confusing output or complicates tests, keep linked target behavior unchanged and document that `--page-hierarchy` only changes the initially selected page target.

Prefer the simpler invariant: `fetch-tree-for-entity` always receives the same `page-hierarchy?` option for the whole show operation.

Add a focused linked-block test only if linked blocks are affected by the implementation.

### Breadcrumb interaction

`attach-breadcrumb-line` currently adds breadcrumbs only for ordinary block roots through `fetch-breadcrumb-parents` and `ordinary-block-root?`.

Page hierarchy roots are pages, not ordinary blocks, so no new breadcrumb line is expected.

Do not add a new breadcrumb display in this feature unless a test demonstrates an existing regression.

### Documentation

Update CLI documentation only if operator-facing docs already list `show` options or examples.

Candidate file:

```text
/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md
```

Keep docs concise:

```text
Use `--page-hierarchy true` with `show --page <page>` to display child pages connected through page hierarchy instead of normal page content blocks.
```

Do not add translation keys; this is CLI help/docs and existing CLI option descriptions, not shipped UI text in the renderer.

## Implementation steps

1. Add parser/action support.
   - Add `:page-hierarchy` to `show-spec` with `:coerce :boolean`.
   - Add `:page-hierarchy?` to the action map with default `false`.
   - Add or update command examples only if helpful.

2. Refactor Library hierarchy helpers into generic page hierarchy helpers.
   - Rename `library-child-selector` to `page-hierarchy-child-selector`.
   - Rename `library-display-page?` to `page-hierarchy-display-page?`.
   - Rename `fetch-library-children` to `fetch-page-hierarchy-children`.
   - Rename `fetch-library-tree-for-entity` to `fetch-page-hierarchy-tree-for-entity`.
   - Keep `library-page?` for built-in Library detection.

3. Generalize cycle protection.
   - Prefer a generic `:page-hierarchy-parent-cycle` error code.
   - Update Library cycle tests if the error code is renamed.
   - Ensure malformed page parent cycles fail fast for both Library and normal pages.

4. Route ordinary page hierarchy mode.
   - Pass `:page-hierarchy?` from the action into `fetch-tree`, `fetch-tree-for-entity`, and linked target resolution as needed.
   - In `fetch-tree-for-entity`, route `library-page?` first.
   - If `:page-hierarchy?` is true and the selected entity is a normal page, call `fetch-page-hierarchy-tree-for-entity`.
   - Keep block targets and default normal page content unchanged.

5. Preserve downstream rendering and structured output.
   - Return tree data as the existing root map with `:block/children`.
   - Avoid adding a new output section.
   - Keep `resolve-linked-blocks-in-tree-data`, linked references, UUID references, property title resolution, and structured sanitization on the existing pipeline.

6. Update docs if needed.
   - Add a concise `show --page <page> --page-hierarchy true` example to CLI docs if the `show` section already documents options/examples.

7. Run `logseq-review-workflow` after implementation and tests.
   - Apply repository-wide rules.
   - Apply Logseq CLI module rules.
   - Apply Datascript rules because the feature uses Datalog queries.
   - Apply Promesa rules because the implementation composes async query/pull calls.
   - Apply DB model rules because the feature depends on page identity and `:block/parent` hierarchy semantics.

## Testing plan

Implementation should follow @Test-Driven Development.

Add failing tests before implementation.

### Unit tests in `show_test.cljs`

Add tests in:

```text
/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs
```

Recommended tests:

1. `build-action` defaults `:page-hierarchy?` to false.
   - Call `show-command/build-action` without `:page-hierarchy`.
   - Assert `[:action :page-hierarchy?]` is false.

2. `build-action` stores `:page-hierarchy?` when true.
   - Call `show-command/build-action` with `{:page "Foo" :page-hierarchy true}`.
   - Assert `[:action :page-hierarchy?]` is true.

3. Default ordinary page behavior is unchanged.
   - Use a mock page `Foo` with content blocks under `:block/page`.
   - Also provide child pages under `:block/parent`.
   - Run `execute-show` without `:page-hierarchy?` or with false.
   - Assert content blocks appear.
   - Assert hierarchy-only child pages do not appear unless they are also content blocks.
   - Assert queries include the `:block/page` path for `Foo`.

4. Ordinary page hierarchy renders when enabled.
   - Arrange `Foo -> Bar -> Baz` through `:block/parent` page entities.
   - Run `execute-show` with `:page "Foo"` and `:page-hierarchy? true`.
   - Assert output contains `Foo`, `Bar`, and `Baz` in tree order.
   - Assert page content blocks from `Foo`, `Bar`, or `Baz` are not inlined.
   - Assert queries use `:block/parent` for hierarchy children.

5. Ordinary page hierarchy filters non-display children.
   - Under `Foo`, include one ordinary page, one class page, one property page, and one non-page block.
   - Run with `:page-hierarchy? true`.
   - Assert only the ordinary page appears.

6. Ordinary page hierarchy respects `--level`.
   - Arrange `Foo -> Bar -> Baz`.
   - Run with `:level 2` and `:page-hierarchy? true`.
   - Assert `Bar` appears and `Baz` does not.

7. Structured output uses existing shape.
   - Run with output format `:json` or `:edn`.
   - Assert child pages are under `[:data :root :block/children]`.
   - Assert `:block/uuid` is stripped.
   - Assert no `:show/*` internal keys leak.

8. Library behavior remains unchanged.
   - Existing Library tests should still pass without setting `:page-hierarchy?`.
   - Add a small assertion that `:page-hierarchy? false` still renders Library hierarchy if needed.

9. Page id and page UUID targets are consistent if supported.
   - Run `show --id <page-id>` with `:page-hierarchy? true` against a page entity.
   - Run `show --uuid <page-uuid>` with `:page-hierarchy? true` against a page entity.
   - Assert both render page hierarchy.
   - If implementation intentionally scopes the feature to `--page`, assert and document the narrower behavior instead.

10. Block targets are not changed by the flag.
    - Run `show --id <block-id>` with `:page-hierarchy? true`.
    - Assert the existing block subtree behavior remains unchanged.

11. Existing thread APIs only.
    - Record invoked method keywords for ordinary page hierarchy mode.
    - Assert every method is in the existing allowed set, such as `:thread-api/pull`, `:thread-api/q`, `:thread-api/get-block-refs`, and `:thread-api/get-block-parents` when applicable.
    - Assert no new method keyword is introduced.

12. Page hierarchy cycle fails fast.
    - Arrange malformed page parents such as `Foo -> Bar -> Baz -> Bar`.
    - Run with `:page-hierarchy? true`.
    - Assert execution rejects with the chosen cycle error code.

### Command/help tests

If existing command tests assert help output or option lists, update them to include `--page-hierarchy`.

Candidate file:

```text
/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs
```

Add or update tests only where the command option list is already validated.

### CLI e2e tests

Add CLI e2e coverage in:

```text
/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn
```

Recommended e2e shape:

1. Create or import a graph with namespace pages such as `Foo/Bar/Baz`.
2. Add ordinary content blocks to `Foo` or `Bar` so the test can distinguish content mode from hierarchy mode.
3. Run:

```text
logseq show --graph <graph> --page Foo --page-hierarchy true --linked-references false
```

4. Assert stdout contains `Foo`, `Bar`, and `Baz`.
5. Assert stdout does not contain ordinary page content blocks that should only appear in default content mode.
6. Run:

```text
logseq show --graph <graph> --page Foo --linked-references false
```

7. Assert default stdout still contains normal page content and does not switch to hierarchy mode.
8. Add a JSON assertion if stable fixture paths are available:

```text
logseq show --graph <graph> --page Foo --page-hierarchy true --output json --linked-references false
```

Assert a stable child title path such as:

```text
[:data :root :block/children 0 :block/title]
```

Update:

```text
/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn
```

if the new e2e cases extend tracked command/option coverage.

## Verification commands

Before implementation, run the newly added focused tests and confirm they fail for the missing feature.

After implementation, run:

```text
bb dev:test -v logseq.cli.command.show-test
```

If command/help tests are changed, run:

```text
bb dev:test -v logseq.cli.commands-test
```

If CLI e2e cases are added, rebuild the CLI when necessary and run the relevant e2e suite or case, for example:

```text
bb -f cli-e2e/bb.edn test --skip-build
```

Before submitting, run:

```text
bb dev:lint-and-test
```

when the local environment supports the full suite.

## Review plan after implementation

Run `logseq-review-workflow` after the implementation and tests are complete.

The review scope should include every changed file, likely:

```text
src/main/logseq/cli/command/show.cljs
src/test/logseq/cli/command/show_test.cljs
src/test/logseq/cli/commands_test.cljs if changed
cli-e2e/spec/non_sync_cases.edn if changed
cli-e2e/spec/non_sync_inventory.edn if changed
docs/cli/logseq-cli.md if changed
```

The review should load and apply:

```text
rules/common.md
rules/modules/logseq-cli.md
rules/libraries/clojure-cljs.md
rules/libraries/datascript.md
rules/libraries/promesa.md
rules/modules/db-model.md
```

The review should specifically check:

- The implementation did not add a new thread API without documented necessity.
- `--page-hierarchy` defaults to false and does not change ordinary `show --page <page>` output by default.
- `--page-hierarchy true` displays child page hierarchy through `:block/parent`, not normal page content blocks.
- The existing `show --page Library` behavior remains available without requiring the new option.
- The implementation reuses the Library hierarchy traversal where practical instead of duplicating divergent code paths.
- Normal block `show`, normal page content `show`, `--id`, `--uuid`, multi-id, linked block, linked references, property rendering, UUID-ref footer, JSON, and EDN paths still behave correctly.
- Page hierarchy child filtering is intentional and covered by tests.
- Page hierarchy traversal cannot recurse forever on malformed parent cycles.
- Datascript queries are scoped by parent id and do not scan more data than necessary.
- Promise composition returns promises consistently and does not accidentally return unresolved nested promises.
- Structured output does not leak internal traversal metadata.
- Tests cover behavior and failure modes rather than only implementation details.

If the review finds issues, fix them and rerun the focused tests before finalizing the implementation.
