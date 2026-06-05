# Frontend State Modules Implementation Plan

Goal: Split `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs` into focused state modules so editor, sync, UI, plugin, config, and platform state are easier to understand.

Architecture: Introduce `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs` as the single owner of the application atom, RFX bridge, and generic state mutation helpers.
Move domain defaults and domain-specific accessors into focused namespaces under `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/`.
Keep `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs` as a temporary facade that preserves existing callers while migration happens in reviewable batches.

Tech Stack: ClojureScript, Datascript, Promesa, core.async, Logseq RFX, Babashka test and lint tasks.

Related: Relates to `/Users/tiensonqin/Codes/projects/logseq-2/docs/agent-guide/078-ui-base-tailwind-migration.md` because both reduce frontend maintenance cost.

## Problem statement

`/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs` is currently a 2,091 line namespace that owns application state initialization, RFX subscriptions, generic mutation helpers, config access, editor state, selection behavior, sidebar behavior, theme behavior, plugin state, sync state, auth state, Electron state, PDF state, mobile state, and small UI helpers.

This makes the namespace hard to scan because unrelated responsibilities share one require list, one state map, and one public API surface.

The current namespace is also widely imported, and callers use both helper functions and direct `@state/state` reads.

The refactor should therefore improve structure without changing state shape, key names, initialization timing, storage side effects, RFX subscription semantics, or existing public helper behavior.

## Current structure

The source file is `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs`.

The existing tests are mainly in `/Users/tiensonqin/Codes/projects/logseq-2/src/test/frontend/state_test.cljs`.

There is also source-scanning coverage in `/Users/tiensonqin/Codes/projects/logseq-2/src/test/frontend/rum_hooks_refactor_test.cljs` that expects `use-container-id` to be present in `src/main/frontend/state.cljs`.

The current state atom contains at least these domains.

| Domain | Current keys and vars | Proposed module |
|--------|-----------------------|-----------------|
| Core state bridge | `state`, `get-state`, `set-state!`, `update-state!`, `replace-state!`, `swap-state!`, `register-rfx-state-subs!`, `pub-event!` | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs` |
| Initial state assembly | storage-backed defaults, current graph initialization, locale normalization, RFX init | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/init.cljs` |
| DB worker handles | `*db-worker`, `*db-worker-thread`, `*db-worker-client-id`, `db-worker-ready?`, `<invoke-db-worker`, `set-db-worker-client-id!`, `app-ready-promise` | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/db_worker.cljs` |
| Config | `merge-configs`, `get-config`, global and graph config getters, config-based predicates | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/config.cljs` |
| Editor and selection | `:editor/*`, `:selection/*`, editing helpers, cursor helpers, selection DOM helpers | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/editor.cljs` |
| Sidebar and container ids | `:sidebar/*`, `:ui/sidebar-*`, `use-right-sidebar-blocks`, `use-container-id` | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/sidebar.cljs` |
| UI preferences | theme, document mode, left sidebar, settings, scrolling, shortcut tooltip, dialogs | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/ui.cljs` |
| Search and queries | `:search/*`, `:db/query-results`, `:db/async-queries`, reactive query channels | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/search.cljs` |
| Sync and RTC | `:rtc/*`, `:sync/*`, `:sync-graph/init?`, `set-sync-block-conflicts!` | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/sync.cljs` |
| Plugins | `:plugin/*`, plugin commands, plugin services, plugin update helpers | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/plugin.cljs` |
| Platform | Electron, mobile, auth, user info, system info, handbook route channel | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/platform.cljs` |
| Assets and PDF | `:assets/*`, `:pdf/*`, copy export preferences | `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/assets.cljs` |

## Target architecture

The state shape remains one map in one atom.

Each domain module contributes a `default-state` map and domain-specific functions.

`/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/init.cljs` composes all `default-state` maps and owns any unavoidable initialization side effects.

`/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs` owns the app atom and the RFX synchronization functions.

Domain modules require `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs`, not `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs`.

`/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs` requires the domain modules and re-exports the existing public names until call sites are migrated.

The module dependency direction should look like this.

```text
frontend.state
  -> frontend.state.core
  -> frontend.state.init
  -> frontend.state.config
  -> frontend.state.editor
  -> frontend.state.sidebar
  -> frontend.state.ui
  -> frontend.state.search
  -> frontend.state.sync
  -> frontend.state.plugin
  -> frontend.state.platform
  -> frontend.state.assets

domain modules -> frontend.state.core
domain modules -> other domain modules only when the dependency is unavoidable and acyclic
application callers -> frontend.state during the compatibility phase
application callers -> frontend.state.<domain> after each migration batch
```

## Testing Plan

I will add tests in `/Users/tiensonqin/Codes/projects/logseq-2/src/test/frontend/state_test.cljs` that prove `frontend.state` and the new modules read and write the same RFX-backed app state.

I will add tests that construct the initial state through the new init namespace and assert representative existing keys keep their current values and storage-backed semantics.

I will add tests that move `merge-configs` and `get-config` into the config module while preserving merge behavior, default config behavior, and current repo behavior.

I will add tests that move editor selection behavior while preserving selected block id ordering, direction handling, and `get-editor-info`.

I will add tests that move sidebar behavior while preserving sidebar block addition, removal, collapse state, and open or close state.

I will add tests that move sync helpers while preserving nested conflict writes and RTC state reads.

I will add a source-scanning test that fails when new application code imports the facade for a domain that has already been migrated.

I will keep `/Users/tiensonqin/Codes/projects/logseq-2/src/test/frontend/rum_hooks_refactor_test.cljs` green by either preserving a facade definition for `use-container-id` or updating the test only after all relevant callers use the sidebar module.

NOTE: I will write *all* tests before I add any implementation behavior.

## Phase 1: Add the core state namespace

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs`.

Move `*profile-state`, `state`, `read-state-value`, `get-state`, `assoc-state-db`, `full-state-path`, `update-state-db`, `set-state!`, `update-state!`, `replace-state!`, `swap-state!`, `register-rfx-state-subs!`, and `pub-event!` from `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs` to the core namespace.

Keep the state map value unchanged during this phase, even if it is still physically assembled in the old namespace.

Add facade aliases in `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs` so every existing call to `state/state`, `state/get-state`, `state/set-state!`, and related helpers keeps working.

Run the focused state tests and confirm behavior is unchanged.

Expected command:

```bash
rtk bb dev:test -v frontend.state-test/get-state-reads-plain-state
rtk bb dev:test -v frontend.state-test/plain-state-accessors-use-rfx-app-db
rtk bb dev:test -v frontend.state-test/rfx-state-subscriptions-read-top-level-and-nested-paths
```

## Phase 2: Extract initial state assembly

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/init.cljs`.

Move storage-backed initial value computation out of the facade.

Keep current graph initialization behavior exactly the same, including `ipc/ipc "setCurrentGraph"`.

Keep preferred language canonicalization behavior exactly the same, including fallback to `en`.

Create one function that returns the complete initial app state map.

Use that function from `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs` or from a narrow bootstrap function that initializes core once.

Do not change any keyword names.

Do not add default values that do not already exist.

Run the focused state tests and any config tests that depend on initialization.

Expected command:

```bash
rtk bb dev:test -v frontend.state-test
rtk bb dev:test -v frontend.config-test
```

## Phase 3: Extract config state first

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/config.cljs`.

Move `common-default-config`, `db-default-config`, `merge-configs`, `config-for-repo`, config getters, config predicates, and macro getters into this namespace.

Keep config functions reading state through `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs`.

Keep `get-current-repo` dependency explicit by either requiring the graph module once it exists or by passing current repo into internal helpers.

Prefer passing repo arguments into helpers when that avoids a namespace cycle.

Keep facade aliases in `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs`.

Migrate direct config-heavy callers in a small batch only after the facade is green.

Likely first callers include `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/config.cljs`, `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/context/i18n.cljs`, and `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/commands.cljs`.

Expected command:

```bash
rtk bb dev:test -v frontend.state-test/merge-configs
rtk bb dev:test -v frontend.config-test
rtk bb dev:test -v frontend.context.i18n-test
```

## Phase 4: Extract graph, repo, and route helpers

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/graph.cljs`.

Move `get-route-match`, `get-current-route`, `home?`, `get-current-page`, `route-has-p?`, `get-current-repo`, `get-repos`, `set-repos!`, `add-repo!`, `set-current-repo!`, `delete-repo!`, and `get-rtc-graphs`.

Keep `set-current-repo!` storage and Electron side effects unchanged.

This phase gives config, editor, sidebar, sync, and asset modules a stable place to get the current repo without depending on the facade.

Expected command:

```bash
rtk bb dev:test -v frontend.handler.user-test
rtk bb dev:test -v frontend.persist-db-test
```

## Phase 5: Extract editor and selection state

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/editor.cljs`.

Move editor keys, selection keys, edit helpers, cursor helpers, DOM selection helpers, and `get-editor-info`.

Require `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs` for state reads and writes.

Require `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/config.cljs` for editing permission and document-mode behavior.

Require `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/graph.cljs` for current repo reads.

Keep selection DOM side effects unchanged.

Keep RTC presence event publication unchanged.

Do not move editor handler logic from `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/handler/editor.cljs` in this refactor.

Expected command:

```bash
rtk bb dev:test -v frontend.state-test/get-editor-info-includes-selection-when-not-editing-test
rtk bb dev:test -v frontend.state-test/get-editor-info-returns-nil-when-not-editing-and-no-selection-test
rtk bb dev:test -v frontend.handler.editor-test
rtk bb dev:test -v frontend.handler.editor-async-test
```

## Phase 6: Extract sidebar, UI, and container helpers

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/sidebar.cljs`.

Move right sidebar helpers, sidebar block collapse helpers, and `use-right-sidebar-blocks`.

Move `get-next-container-id`, `get-container-id`, and `use-container-id` into the sidebar module unless a better name such as `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/container.cljs` becomes clearer during implementation.

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/ui.cljs`.

Move theme, document mode, settings, left sidebar, scroll position, dialog, developer mode, shortcut tooltip, and small UI preference helpers.

Keep `use-container-id` facade export until `/Users/tiensonqin/Codes/projects/logseq-2/src/test/frontend/rum_hooks_refactor_test.cljs` can be updated.

Expected command:

```bash
rtk bb dev:test -v frontend.rum-hooks-refactor-test/old-rum-mixin-api-is-fully-removed
rtk bb dev:test -v frontend.components.datepicker-test
rtk bb dev:test -v frontend.components.graph-actions-test
```

## Phase 7: Extract sync, DB worker, plugin, platform, assets, and search modules

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/sync.cljs`.

Move RTC and sync state helpers, including `set-sync-block-conflicts!`.

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/db_worker.cljs`.

Move DB worker atoms, readiness tracking, invoke function, and client id persistence.

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/plugin.cljs`.

Move plugin getters, plugin service helpers, plugin hook helpers, and update state helpers.

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/platform.cljs`.

Move auth, user info, Electron, mobile, handbook, and system-level helpers.

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/assets.cljs`.

Move assets, PDF, copy export preferences, and related persistence helpers.

Create `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/search.cljs`.

Move search mode, search result, search engines, async query, query result, and reactive custom query channel helpers.

Expected command:

```bash
rtk bb dev:test -v frontend.handler.db-based.sync-test
rtk bb dev:test -v frontend.persist-db-test
rtk bb dev:test -v frontend.handler.export-test
rtk bb dev:test -v frontend.components.repo-test
```

## Phase 8: Migrate call sites in batches

Migrate callers by domain, not by directory.

For each migrated domain, replace `[frontend.state :as state]` with the focused namespace where practical.

Keep generic `core/get-state` and `core/set-state!` imports rare.

Prefer domain functions over raw state keys when a domain function already exists.

Do not migrate every caller in one PR.

Start with low-coupling domains such as config, assets, and search.

Then migrate editor and sidebar callers.

Then migrate plugin and sync callers.

Update tests after each batch.

Expected command after each batch:

```bash
rtk bb dev:test -v <changed-test-namespace>
rtk bb lint:large-vars
```

## Phase 9: Shrink the facade

After callers are migrated, remove facade aliases for domains that no longer need compatibility.

Add a source-scanning test that forbids new imports of `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs` from selected directories once those directories are migrated.

Keep the facade only for intentionally global compatibility APIs.

Remove the `^:large-vars/data-var` pressure from the old namespace by keeping large maps in the smaller init or domain namespaces.

Expected command:

```bash
rtk bb dev:test -v frontend.state-test
rtk bb lint:large-vars
rtk bb dev:lint-and-test
```

## Edge cases

Namespace cycles are the largest risk.

Domain modules must require `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state/core.cljs` instead of requiring the facade.

Cross-domain calls should be passed as arguments or moved into a lower-level domain only when the dependency direction is clear.

Direct `@state/state` reads in existing callers can bypass new domain APIs.

Those callers should be migrated only when the domain helper exists and tests cover the behavior.

Tests often reset `state/state` directly.

Keep the facade `state` alias during migration so existing tests do not require a large rewrite before behavior is protected.

RFX state and the atom must remain synchronized.

Every moved setter must continue to call the same core setter instead of using `swap!` directly.

Storage side effects must not move into pure getters.

Storage-backed writes such as current repo, theme, preferred language, recent pages, and plugin preferences should remain in explicit setter functions.

Initialization side effects must stay single-run.

Do not call current graph initialization from multiple namespaces.

Browser-only DOM helpers must keep their `js/process` guards.

Do not introduce `js/Buffer` in browser-related code.

Do not change ClojureScript keyword spelling.

Use existing keywords and keep hyphenated keyword names.

## Questions

Should this refactor target one large PR with strict facade compatibility, or several PRs by domain.

The safer default is several PRs by domain because this namespace has many direct consumers.

Should `use-container-id` live in `frontend.state.sidebar` or a new `frontend.state.container` namespace.

The cleaner default is `frontend.state.container` if more container state appears during migration.

Should new code be allowed to call `frontend.state.core/get-state` directly.

The cleaner default is to allow it only for generic infrastructure and tests.

Should the final facade remain permanently for plugin SDK compatibility.

This needs a call from maintainers because API namespaces under `/Users/tiensonqin/Codes/projects/logseq-2/src/main/logseq/api/` may rely on stable `frontend.state` access.

## Verification checklist

Run focused tests after every extraction phase.

Run `rtk bb lint:large-vars` after every phase that moves large definitions.

Run `rtk bb dev:lint-and-test` before the final PR.

Run app smoke testing for Desktop after editor, sidebar, theme, plugin, and sync phases.

Run Mobile-focused tests after mobile and auth state migration.

Run CLI E2E only if state changes touch `/Users/tiensonqin/Codes/projects/logseq-2/src/main/logseq/cli/` or CLI-visible behavior.

## Testing Details

The tests will check behavior through public functions and RFX snapshots rather than testing file placement.

The tests will verify that reads, writes, subscriptions, config merging, editor selection, sidebar mutation, sync conflict mutation, and storage-backed setters behave the same after each move.

The source-scanning test will only enforce architectural boundaries after a domain has been migrated and covered by behavior tests.

## Implementation Details

- Keep one app state atom and one RFX state source.
- Keep the current state key map shape unchanged.
- Add domain `default-state` maps only after core extraction is green.
- Keep `/Users/tiensonqin/Codes/projects/logseq-2/src/main/frontend/state.cljs` as the compatibility facade during migration.
- Do not require the facade from domain modules.
- Move call sites by domain and keep PRs small.
- Prefer domain functions over generic key mutation in migrated callers.
- Preserve storage, Electron IPC, DOM, and RFX side effects exactly.
- Add architectural scan tests only after the relevant behavior tests exist.
- Remove facade exports only when no production caller still needs them.

## Question

The main unresolved decision is whether maintainers want this shipped as one compatibility-preserving PR or as a sequence of domain PRs.

The plan assumes a sequence of domain PRs because it reduces review risk and makes regressions easier to isolate.

---
