# Show Library Page Implementation Plan

Goal: Make `logseq show --page Library` display the special Logseq Library page in the same semantic shape as the Desktop App: the `Library` root plus its page hierarchy, not ordinary page content blocks.

Architecture: Keep `show` orchestration inside the existing CLI show command namespace.
Architecture: Reuse the current `db-worker-node` transport APIs, especially `:thread-api/pull` and `:thread-api/q`; do not add a new thread API unless implementation proves these APIs cannot fetch the required parent-page tree.
Architecture: Detect the built-in `Library` page, fetch children through `:block/parent`, filter children with Desktop Library semantics, and render the result through the existing `show` tree formatter and structured-output sanitizer.

Tech Stack: ClojureScript, Logseq CLI `show`, Datascript queries through `db-worker-node`, `logseq.db` entity predicates, Promesa, CLI unit tests, CLI formatter tests if output shape changes, and CLI e2e manifests.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md`, `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/006-show-block-link-rendering.md`, and the current `show` implementation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`.

## Problem statement

The Desktop App treats `Library` as a special built-in page.

The current CLI `show` command treats every page as a regular page whose visible tree is built from blocks found through `:block/page`.

That ordinary page path is incorrect for `Library` because Library membership is represented by child page entities whose `:block/parent` points at the Library page.

As a result, `logseq show --page Library` can show the Library root but miss the page hierarchy that users see in the Desktop App.

The new behavior should make CLI `show` useful for inspecting Library contents from headless workflows while preserving existing `show` behavior for normal pages, blocks, linked blocks, linked references, properties, UUID references, and structured output.

This feature should not add a public CLI option.

This feature should not add a new `db-worker-node` thread API unless the existing `:thread-api/pull` and `:thread-api/q` calls cannot satisfy the implementation after concrete verification.

After implementation, review the change with `logseq-review-workflow` before considering the work complete.

## Current implementation snapshot

The current show command lives in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`.

The current CLI flow is:

```text
show action
  -> execute-show
  -> build-tree-data
  -> fetch-tree
  -> resolve-linked-blocks-in-tree-data
  -> fetch-linked-references when enabled
  -> resolve-linked-blocks-in-linked-references when enabled
  -> collect-uuid-refs
  -> uuid-refs/fetch-uuid-entities
  -> resolve-uuid-refs-in-tree-data
  -> render-tree-text-with-properties for human output
  -> sanitize-structured-tree for JSON and EDN output
```

The current page target path in `fetch-tree` pulls a page by `[:block/name page]` and then calls `fetch-tree-for-entity`.

The current `fetch-tree-for-entity` treats an entity without `[:block/page :db/id]` as a page and fetches blocks by page id:

```text
fetch-blocks-for-page
  -> :thread-api/q with [?b :block/page ?page-id]
  -> build-tree grouped by [:block/parent :db/id]
```

This is correct for normal page content blocks.

This is not enough for `Library` because Library page membership is stored as page entities with `:block/parent` set to the Library page, not as blocks with `:block/page` set to the Library page.

The current selectors relevant to `show` are `link-target-selector`, `show-root-selector`, `tree-block-selector`, and `linked-ref-selector`.

The current page target selector in the `:page` branch includes `:db/id`, `:db/ident`, `:block/uuid`, `:block/title`, `:logseq.property/deleted-at`, `:logseq.property/status`, and `:block/tags`.

The current page target selector does not include `:block/name` or `:logseq.property/built-in?`, which are useful for robust Library detection and structured output consistency.

The current `db-worker-node` implementation in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` exposes:

```text
:thread-api/pull
  -> Datascript d/pull with a caller-provided selector
  -> common-initial-data/with-parent

:thread-api/q
  -> Datascript d/q with caller-provided query and inputs

:thread-api/get-block-refs
  -> linked references for a selected entity id
```

The existing APIs can fetch the Library page and its `:block/parent` children, so the first implementation should not add a new thread API.

## Library model research

The Library page name is defined in `/Users/rcmerci/gh-repos/logseq/deps/common/src/logseq/common/config.cljs`:

```clojure
(defonce library-page-name "Library")
```

New DB graphs create Library as a built-in page in `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db/sqlite/create_graph.cljs`:

```text
built-in-pages-names
  -> includes common-config/library-page-name
  -> build-graph-initial-data creates default pages
  -> mark-block-as-built-in sets :logseq.property/built-in? true
```

A new page created by `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db/sqlite/util.cljs` has the shape:

```text
:block/name  = lower-case sanitized title
:block/title = original title
:block/uuid  = generated from the title for built-in pages when used by graph creation
:block/tags  = #{:logseq.class/Page}
```

The public DB helper aliases in `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db.cljs` include:

```text
ldb/get-built-in-page
ldb/library?
ldb/get-library-page
ldb/page-in-library?
```

The relevant behavior is:

```text
ldb/get-built-in-page db "Library"
  -> looks up the stable built-in UUID generated from the title

ldb/library? page
  -> true when the entity is built-in and :block/title is "Library"

ldb/page-in-library? db page
  -> follows :block/parent recursively until it reaches the Library page
```

Library membership is therefore represented by `:block/parent`, not by a Library tag or Library property.

There is no special `:logseq.class/Library` class and no dedicated Library property.

## Desktop App behavior to mirror

The Desktop App page rendering path in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/components/page.cljs` detects Library and passes `:library? true` into block rendering:

```text
config = assoc config :library? (ldb/library? block)
```

The same page rendering path adds the Library-specific add-pages UI:

```text
when ldb/library? page
  -> frontend.components.library/add-pages
```

The add-pages component in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/components/library.cljs` searches for existing pages using:

```text
:built-in? false
:page-only? true
:library-page-search? true
```

When a page is chosen, the Desktop App moves that page under the Library page by setting `:block/parent` through `editor-handler/move-blocks!`.

When a page is unchosen, the Desktop App retracts that page's `:block/parent`.

The Library display filter lives in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/components/block.cljs` inside `block-children`.

When `:library?` is true, the Desktop App keeps only children that satisfy:

```clojure
(and (ldb/page? child)
     (not (or (ldb/class? child)
              (ldb/property? child))))
```

This means Desktop Library display shows ordinary page entities and hides class/property pages.

Because `:library?` is part of the rendering config, the same page-only filtering applies recursively to nested Library page children.

Desktop Library display does not render the ordinary content blocks of each child page inside the Library tree.

The CLI should mirror those semantics rather than treating Library as a regular page content tree.

## Desired CLI behavior

`logseq show --page Library` should render the Library root and its Library page hierarchy.

The root row should be the built-in `Library` page.

Child rows should be direct child page entities whose `:block/parent` points at Library.

Nested rows should be child page entities whose `:block/parent` points at another page already displayed in the Library tree.

Children should be ordered by `:block/order`, matching the existing block tree ordering convention and Desktop `ldb/sort-by-order` behavior.

Children should be filtered with the Desktop Library rule:

```text
show ordinary pages
hide classes
hide properties
hide non-page blocks
```

The Library tree should not include normal page content blocks from child pages.

For example, if `Project Alpha` is under Library and has ordinary note blocks on the `Project Alpha` page, then `show --page Library` should show `Project Alpha` as a child page but should not inline `Project Alpha` page content blocks.

`--level` should limit the Library page hierarchy just as it limits normal `show` trees.

`--output human` should reuse the existing `tree->text` visual format.

`--output json` and `--output edn` should expose the same Library tree under `[:data :root]` and `:block/children` without adding human-only labels.

`--id <library-db-id>` and `--uuid <library-uuid>` should behave like `--page Library` when the selected entity is the built-in Library page.

Normal pages must keep the current `:block/page` content-tree behavior.

Normal blocks must keep the current block subtree behavior.

Linked block resolution must keep the current behavior.

Linked references should keep the current default behavior: if linked references are enabled, fetch references for the rendered Library root id.

If the Library page is not found, the command should continue to use the existing page/entity not found errors from the target resolution path.

If malformed graph data creates a parent cycle inside the Library hierarchy, the CLI should fail fast with an actionable error instead of recursing indefinitely.

## Recommended implementation approach

Keep the implementation in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`.

Do not create a new command or flag.

Do not add a new `db-worker-node` thread API for the first implementation.

Use existing worker transport calls:

```text
:thread-api/pull
  -> fetch selected page/block entities

:thread-api/q
  -> fetch Library child page entities by :block/parent

:thread-api/get-block-refs
  -> keep existing linked-reference behavior
```

Add `logseq.common.config` to the show namespace if direct access to `common-config/library-page-name` is clearer than comparing against the string literal.

Prefer a small local predicate such as:

```text
library-page? entity
  -> ldb/library? entity
  -> requires :logseq.property/built-in? and :block/title in the pulled entity
```

Avoid adding compatibility fallbacks that treat any page titled `Library` as the special Library page.

Library is a built-in page; the implementation should require the built-in marker so a user-created non-built-in page title collision does not silently get special behavior.

### Selector changes

Add or refactor a page/root selector that includes the fields needed by Library detection and Library rendering:

```text
:db/id
:db/ident
:block/name
:block/uuid
:block/title
:logseq.property/built-in?
:logseq.property/deleted-at
:logseq.property/status
:block/tags
:block/parent
:block/order
```

The `:block/tags` nested selector must include `:db/ident` because `ldb/page?`, `ldb/class?`, and `ldb/property?` work on tag idents.

Use this selector for the page target branch so `ldb/library?` can be evaluated without another round trip.

For Library child pulls, use a selector that includes at least:

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

Keep selectors shallow.

Do not try to fetch the entire Library hierarchy through one recursive Datascript pull selector.

### Fetching Library children

Add a function similar to:

```text
fetch-library-children config repo parent-id
  -> :thread-api/q
       [:find (pull ?child library-child-selector)
        :in $ ?parent-id
        :where [?child :block/parent ?parent-id]]
  -> map first
  -> attach-user-properties if Library page rows should display user properties
  -> filter ordinary Library page children
  -> sort by :block/order
```

Filtering should happen in the CLI after pull so it can reuse `ldb/page?`, `ldb/class?`, and `ldb/property?` against the same pulled map shape used elsewhere.

Use `attach-user-properties` for displayed Library child page nodes if the existing `show` contract is that rows can render user properties.

If user properties for Library child page rows are not desired, explicitly document and test that Library display mirrors Desktop's hidden properties behavior; however, the lower-risk CLI-consistency default is to preserve the current `show` property rendering behavior for displayed nodes.

### Building the Library tree

Add a function similar to:

```text
fetch-library-tree-for-entity config repo library-entity max-depth
  -> recursively fetch :block/parent children
  -> filter to ordinary pages, not classes/properties
  -> attach children under :block/children
  -> stop when depth reaches max-depth
  -> guard visited ids to detect cycles
```

Depth should align with `build-tree`:

```text
root depth = 1
children are omitted when depth >= max-depth
```

A practical recursive shape is:

```text
build-library-node node depth visited
  if node id is already visited
    throw {:code :library-parent-cycle}
  if max-depth and depth >= max-depth
    return node without fetching children
  children = fetch-library-children node-id
  children* = p/all build-library-node child (inc depth) visited*
  assoc node :block/children children* when children* is non-empty
```

Use a clear error code if cycle protection is needed, for example `:library-parent-cycle`.

The exact code name can differ, but it should be asserted in tests and should not be swallowed.

### Integrating with existing `fetch-tree-for-entity`

Route Library before the ordinary page content path:

```text
fetch-tree-for-entity config repo entity max-depth
  if library-page? entity
    fetch-library-tree-for-entity
  else if entity has [:block/page :db/id]
    existing block tree path
  else
    existing normal page tree path
```

This keeps the special behavior scoped to the built-in Library page only.

Do not change normal page behavior for pages that happen to have child pages through `:block/parent` unless they are the built-in Library page.

### Linked block interaction

The current linked-block resolver calls `fetch-tree-for-entity` for the resolved target.

Once `fetch-tree-for-entity` knows how to handle Library, a linked block pointing at Library should naturally render the Library tree with the existing linked display marker.

Add a targeted test only if this behavior is considered part of the feature contract.

Do not add Library-specific logic inside the linked block resolver unless the shared `fetch-tree-for-entity` route is insufficient.

### Structured output sanitization

The existing structured output path removes `:block/uuid` and `:show/*` internal keys.

If new internal keys are added for Library traversal, put them under the `:show/*` namespace so `strip-show-internal-data` removes them automatically.

Do not add human-only text such as `Add pages`, `Add existing pages to Library`, or a Library marker to structured output.

Do not add translation keys for this CLI behavior; the CLI should render stored graph titles and existing command output, not new shipped UI text.

## Implementation steps

1. Add Library detection support to `show.cljs`.
   - Require `logseq.common.config` if needed.
   - Ensure the page target selector includes `:block/name` and `:logseq.property/built-in?`.
   - Add a private `library-page?` helper or use `ldb/library?` directly where clear.

2. Add Library child fetching.
   - Define a `library-child-selector` or reuse/refactor existing selectors safely.
   - Add `fetch-library-children` backed by `:thread-api/q` and `:block/parent`.
   - Filter using Desktop semantics: `ldb/page?`, not `ldb/class?`, not `ldb/property?`.
   - Sort by `:block/order`.

3. Add Library tree building.
   - Add `fetch-library-tree-for-entity` or equivalent.
   - Respect `--level` with the same root-depth convention as `build-tree`.
   - Add cycle protection.
   - Preserve row maps so existing property rendering, tag suffix rendering, UUID ref replacement, and structured-output sanitization still work.

4. Wire the special path into `fetch-tree-for-entity`.
   - Check Library before the normal page path.
   - Keep the existing block path and normal page path unchanged.

5. Verify linked references and UUID references still run after Library tree construction.
   - No special linked-reference code should be necessary if the root id remains the Library page id.
   - No special UUID-ref code should be necessary if Library child titles/properties are ordinary strings and maps.

6. Update CLI documentation only if the implementation changes operator-visible behavior enough to warrant it.
   - Candidate file: `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`.
   - Keep any added prose concise and focused on `show --page Library` displaying Library page hierarchy.

7. After implementation and tests, run `logseq-review-workflow`.
   - Apply repository-wide rules.
   - Apply the Logseq CLI module rules.
   - Apply Datascript and Promesa library rules because the change touches Datalog queries and promise composition.
   - Apply DB model rules because the change depends on built-in page identity and `:block/parent` hierarchy semantics.

## Testing Plan

Implementation should follow @Test-Driven Development.

I will add failing execution tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs` before implementation.

I will add a test proving `show --page Library` renders direct child pages whose `:block/parent` is Library.

That test will mock `:thread-api/pull` returning a built-in Library page with `:logseq.property/built-in? true` and `:block/title "Library"`, mock `:thread-api/q` returning child page rows for the Library parent id, execute `show`, strip ANSI, and assert that the output contains `Library` and the child page titles.

I will add a test proving `show --page Library` filters children with Desktop semantics.

That test will include one ordinary page, one class page tagged `:logseq.class/Tag`, one property page tagged `:logseq.class/Property`, and one non-page block under Library.

The assertion will verify that only the ordinary page appears.

I will add a test proving nested Library pages render recursively through `:block/parent`.

That test will arrange `Library -> Projects -> Alpha` and assert that `Alpha` appears as a child of `Projects`, not as page content.

I will add a test proving Library display does not inline ordinary content blocks from child pages.

That test will arrange a child page under Library and also arrange ordinary blocks whose `:block/page` is the child page id.

The assertion will verify that those page content blocks do not appear in `show --page Library`.

I will add a test proving `--level` limits the Library hierarchy.

That test will run `show --page Library --level 2` against `Library -> Projects -> Alpha` and assert that `Projects` appears while `Alpha` does not.

I will add a test proving `show --id <library-id>` and `show --uuid <library-uuid>` use the same Library display path as `show --page Library`.

I will add a structured-output test proving `--output json show --page Library` returns child pages under `[:data :root :block/children]` and does not include non-page, class, or property children.

I will add a structured-output test proving no Library traversal internals leak into JSON or EDN output if implementation adds internal keys.

I will add a test proving normal page behavior is unchanged.

That test will execute `show --page Home` with a regular page entity and assert that the implementation still queries blocks by `:block/page`, renders page content blocks, and does not use the Library child query path.

I will add a test proving no new thread API is used.

That test can record invoked method keywords and assert that Library display uses only existing methods such as `:thread-api/pull`, `:thread-api/q`, `:thread-api/get-block-refs`, and `:thread-api/get-block-parents` when applicable.

I will add a cycle test if the implementation includes explicit Library parent cycle detection.

That test will arrange a malformed parent chain such as `Library -> A -> B -> A` and assert that execution rejects with the chosen cycle error code.

I will update formatter tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` only if the shared `tree->text` formatting contract changes.

The preferred implementation should not require formatter changes because Library should produce ordinary tree data consumed by the existing formatter.

I will add CLI e2e coverage in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`.

The e2e should create or import a graph with pages under Library, run:

```text
logseq show --graph <graph> --page Library --output human --linked-references false
```

and assert that stdout contains `Library` and the expected Library child page titles.

The e2e should assert that stdout does not contain class/property pages that are parented under Library for the fixture, if the fixture can create that shape reliably.

Add a JSON e2e assertion for:

```text
logseq show --graph <graph> --page Library --output json --linked-references false
```

and assert the child page title at `[:data :root :block/children 0 :block/title]` or another stable JSON path.

If the e2e fixture cannot directly parent pages under Library, use namespace-page creation/import behavior after verifying it creates Library parent relationships in the current graph importer.

I will update `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` if the new e2e cases extend command/option coverage.

Before implementation, I will run the new focused tests and expect them to fail.

After implementation, I will run:

```text
bb dev:test -v logseq.cli.command.show-test
```

and expect all show command tests to pass.

If formatter tests are changed, I will run:

```text
bb dev:test -v logseq.cli.commands-test
```

and expect all command formatter tests to pass.

After adding e2e coverage and rebuilding the CLI when needed, I will run the relevant CLI e2e case or suite, for example:

```text
bb -f cli-e2e/bb.edn test --skip-build
```

Before submitting, I will run:

```text
bb dev:lint-and-test
```

when the local environment can support the full test suite.

NOTE: I will write all behavior tests before adding implementation code.

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

- The implementation did not add a new thread API without a documented necessity.
- The implementation only special-cases the built-in Library page, not arbitrary pages titled `Library`.
- Normal `show --page`, `show --id`, `show --uuid`, multi-id, linked block, linked references, property rendering, UUID-ref footer, JSON, and EDN paths still behave as before.
- Library child filtering matches Desktop semantics: ordinary pages only, excluding classes, properties, and non-page blocks.
- Library tree building cannot recurse forever on malformed parent cycles.
- Datascript queries are scoped by parent id and do not scan more data than necessary.
- Promise composition returns promises consistently and does not accidentally return unresolved nested promises.
- Structured output does not leak internal traversal metadata.
- Tests cover behavior and failure modes rather than only implementation details.

If the review finds issues, fix them and rerun the focused tests before finalizing the implementation.
