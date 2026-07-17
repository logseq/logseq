# Melange Common and DB Complete Migration Implementation Plan

Goal: Move all Common and DB runtime ownership into deps/melange, expose it through a strict ClojureScript bridge, and delete deps/common and deps/db.

Architecture: OCaml domain modules in deps/melange/lib own behavior, deps/melange/js_api publishes stable JavaScript-facing packages, and deps/melange/bridge contains only runtime adapters and one-hop ClojureScript-to-JavaScript glue.

Tech Stack: OCaml, Melange, Dune, ClojureScript, shadow-cljs, NBB, JavaScript, Vite, pnpm, and Babashka.

Related: docs/agent-guide/039-melange.md, docs/agent-guide/079-melange-common-db_inventory.md, docs/agent-guide/079-melange-common-db_inventory_common.json, and docs/agent-guide/079-melange-common-db_inventory_db.json.

## Problem statement

The current partial migration leaves significant Common and DB behavior in ClojureScript while also exposing the Melange JavaScript packages directly to application code.

The current deps/melange/bridge tree is therefore both a package boundary and a second domain implementation.

That split ownership makes it possible for OCaml and ClojureScript behavior to diverge.

The physical deps/common and deps/db projects also remain responsible for tests, scripts, package manifests, and build dependencies even though their runtime implementation is being moved elsewhere.

This plan completes the migration instead of preserving those directories as compatibility shells.

The final repository must have no deps/common directory and no deps/db directory.

The final application must consume Common and DB functionality only through logseq.melange.bridge.* ClojureScript namespaces.

Only files under deps/melange/bridge may directly require any @logseq/melange-js-api/* package subpath.

The bridge must not contain Common or DB domain logic.

## Desired end state

| Concern | Final owner | Required property |
| --- | --- | --- |
| Common domain behavior | deps/melange/lib/common | OCaml owns validation, branching, state transitions, and effectful workflow sequencing. |
| DB domain behavior | deps/melange/lib/db | OCaml owns queries, transaction preparation, validation, SQLite workflows, and DB state machines. |
| JavaScript package boundary | deps/melange/js_api | Stable JS-friendly exports wrap OCaml domain modules. |
| ClojureScript interop | deps/melange/bridge | Glue converts values, adapts runtime capabilities, converts errors, and delegates once. |
| Application consumption | src, deps, and tooling consumers | Consumers require only logseq.melange.bridge.* for migrated Common and DB behavior. |
| OCaml behavior tests | deps/melange/test/common and deps/melange/test/db | Tests exercise domain behavior without routing through CLJS. |
| JavaScript contract tests | deps/melange/test | Tests protect package exports, values, promises, and errors. |
| ClojureScript boundary tests | deps/melange/bridge/test | Tests protect bridge conversions and application-facing integration. |
| Repository DB scripts | scripts/src/logseq/tasks/db | Root tooling owns scripts that outlive deps/db. |

The dependency direction must be:

    Application CLJS
          |
          v
    logseq.melange.bridge.*
          |
          v
    @logseq/melange-js-api/*
          |
          v
    deps/melange/lib/common and deps/melange/lib/db

Runtime-specific operations must use typed capabilities passed in the opposite direction:

    OCaml workflow
          |
          v
    typed capability callback
          |
          v
    bridge runtime adapter
          |
          v
    browser, Node.js, DataScript, SQLite, Web Crypto, fetch, or filesystem

The OCaml workflow decides when and why a capability is invoked.

The bridge adapter performs one primitive runtime operation and returns its result.

## Scope

This migration covers the Common and DB domains only.

It includes all Common and DB ClojureScript consumers in the main app, desktop targets, mobile targets, publish targets, command-line tooling, and downstream deps projects.

It includes relocation of deps/melange/lib/js_api to deps/melange/js_api.

It includes relocation or replacement of every test, script, manifest, lockfile responsibility, and build task that currently keeps deps/common or deps/db alive.

It includes removal of compatibility aliases and fallback loading paths for the old namespaces.

It does not migrate unrelated domains such as outliner, graph-parser, or db-sync into OCaml.

It does not change user-visible behavior, persisted graph formats, DB schemas, or public package subpath names.

It authorizes the narrowly scoped typed interfaces required for CLJS value conversion,
DataScript primitives, authorization platform primitives, and final Common/DB workflow
entry points under deps/melange/spec/*.mli.

## Non-negotiable boundaries

Application ClojureScript may require logseq.melange.bridge.runtime, logseq.melange.bridge.common.*, logseq.melange.bridge.db.*, and logseq.melange.bridge.platform.*.

Application ClojureScript may not require @logseq/melange-js-api, @logseq/melange-js-api/common, @logseq/melange-js-api/db, @logseq/melange-js-api/node, @logseq/melange-js-api/browser, or any future package subpath directly.

Application ClojureScript may not require a transitional logseq.melange.common.*, logseq.melange.db.*, logseq.common.*, or logseq.db.* namespace.

The bridge may perform CLJS-to-JS and JS-to-CLJS conversion.

The bridge may translate JavaScript exceptions and rejected promises into the application error representation.

The bridge may build a typed runtime-capability record from browser, Node.js, DataScript, SQLite, Web Crypto, fetch, filesystem, clock, or logging primitives.

The bridge may contain compile-time target selection when the selection is purely an adapter choice.

The bridge may delegate a public ClojureScript function to exactly one JavaScript API entry point.

The bridge may not contain domain validation, query construction, transaction sequencing, retry policy, fallback policy, cache policy, sorting, filtering, grouping, or business branching.

The bridge may not own domain atoms, mutable caches, maximum-key state, schema state, or SQLite lifecycle state.

The bridge may not preserve duplicate ClojureScript implementations as a fallback.

Invalid programmer-controlled input must fail fast.

## Public interfaces

The JavaScript package name remains @logseq/melange-js-api.

The root, common, db, node, and browser package exports remain stable unless an existing export is proven unused and its removal is explicitly approved.

The db package exports exactly the modules and members consumed by deps/melange/bridge. Its entry module must have an explicit interface; internal domain helpers and test-only aliases are not part of the JavaScript package contract.

The common and db CommonJS entry points must load self-contained artifacts from deps/melange/js_api/dist.

The common and db ESM entry points must load self-contained artifacts from deps/melange/js_api/dist.

The node and browser entry points may continue loading generated modules from deps/melange/_build.

The graph-fs integration may continue loading generated modules from deps/melange/_build.

The common and db dist artifacts must be generated into the source dist directory by Dune promotion and remain gitignored.

Public bridge namespaces must use the following layout:

| Namespace prefix | Responsibility |
| --- | --- |
| logseq.melange.bridge.runtime | Shared value codecs, callback adaptation, promise adaptation, and error conversion. |
| logseq.melange.bridge.common.* | One-hop wrappers for Common JavaScript API modules. |
| logseq.melange.bridge.db.* | One-hop wrappers for DB JavaScript API modules. |
| logseq.melange.bridge.platform.* | Primitive browser, Node.js, DataScript, SQLite, filesystem, Web Crypto, fetch, clock, and logging adapters. |

Public ClojureScript function names should remain idiomatic kebab-case.

The JavaScript API must translate OCaml modules into stable JS-friendly objects, arrays, strings, numbers, booleans, nullable values, promises, callbacks, and explicit handles.

Application callers must not depend on Melange-generated module names or generated object layout.

Opaque DataScript and SQLite handles must remain opaque across the boundary and must not be serialized or structurally cloned.

## Specification constraint

The implementation may add or refine narrowly scoped typed interfaces under
deps/melange/spec when an existing interface cannot express a required DataScript,
SQLite, CLJS runtime, authorization, or platform capability.

Each specification change must expose named domain or primitive operations, preserve
opaque runtime handles, and be protected by a RED contract or behavior test before its
implementation is added.

Dune edits are authorized where required to register and wire those interfaces, relocate
js_api, register tests, or update build paths described by this plan.

The implementation must not work around a missing specification with Obj.magic, an unchecked cast, a generic JavaScript escape hatch, duplicate bridge logic, or a compatibility fallback.

Work on independent slices may continue while an explicitly reported specification blocker is awaiting approval.

## Testing Plan

This implementation follows @Test-Driven Development.

All architecture guards, OCaml behavior tests, JavaScript contract tests, and ClojureScript integration tests for this migration must be written before implementation behavior is added.

Each new test must first be run against the current implementation and fail for the expected missing behavior or forbidden dependency.

A test that fails because of a syntax error, missing fixture, incorrect command, or broken test harness does not count as a valid RED result.

### Architecture tests

Add deps/melange/test/cljs_boundary_test.js as a repository source guard.

The guard must scan tracked .cljs, .cljc, .clj, .edn, .js, .mjs, and .cjs files while excluding generated output, node_modules, .git, and build caches.

The guard must fail when @logseq/melange-js-api or any of its subpaths appears in ClojureScript outside deps/melange/bridge.

The guard must fail when application code requires logseq.common.*, logseq.db.*, logseq.melange.common.*, or logseq.melange.db.*.

The guard must fail when deps/common or deps/db exists after the deletion phase.

The guard must fail when a manifest, task, Dune action, or script path still points at deps/common or deps/db.

The guard must fail when a bridge namespace contains a known prohibited domain-state atom or a compatibility fallback marker.

The guard must print every offending path and matched form in a deterministic order.

Register the source guard in deps/melange/test/dune so opam exec -- dune build @runtest runs it.

### OCaml behavior tests

Keep pure Common behavior tests under deps/melange/test/common.

Keep pure and effectful DB behavior tests under deps/melange/test/db.

For effectful workflows, use typed fake capabilities that record primitive calls and return controlled results.

Assert the workflow order, inputs, outputs, state transitions, and error propagation rather than implementation-specific record layout.

Add behavior coverage before moving each source slice out of the bridge.

### JavaScript API contract tests

Protect root, common, db, node, and browser export availability. Protect the db package with an exact module-and-member contract derived from bridge consumption so unused internal helpers cannot become public accidentally.

Protect CommonJS and ESM loading from a clean checkout.

Protect conversion of keywords, UUIDs, vectors, sets, maps, ordered maps, option-like values, opaque handles, callbacks, promises, and errors.

Protect synchronous exceptions and asynchronous promise rejections.

Protect artifact independence by testing common and db after removing or hiding deps/melange/_build from the package-loading environment.

### ClojureScript bridge tests

Move retained legacy CLJS behavior tests into deps/melange/bridge/test only when they exercise the application-facing boundary.

Do not copy an implementation-level CLJS test when the same behavior is better owned by an OCaml test.

Test that bridge functions delegate once and preserve application-facing values and errors.

Test runtime adapters independently with controlled primitives.

Test browser, Node.js, NBB, shadow-cljs, and CLJC reader-conditional loading where the affected namespace supports those targets.

### Regression tests

Preserve behavior for empty values, nil and nullable values, Unicode text, UUIDs, keywords, ordered maps, large collections, and duplicate entries.

Preserve transaction ordering, temporary identifiers, lookup references, reverse references, schema attributes, and transaction metadata.

Preserve SQLite export, import, backup, restore, schema initialization, graph construction, validation, and error behavior.

Preserve Common authorization, graph, utility, version, and logging behavior.

Preserve application behavior on desktop, web, mobile, publish, and command-line targets.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation sequence

### Task 1: Capture the RED architecture baseline

Files:

- Create deps/melange/test/cljs_boundary_test.js.
- Modify deps/melange/test/dune.

Step 1: Add the source guard with explicit allowlists for deps/melange/bridge package imports and generated output exclusions.

Step 2: Add assertions for forbidden namespaces, forbidden package imports, forbidden directory references, and post-migration directory removal.

Step 3: Run node deps/melange/test/cljs_boundary_test.js.

Expected result: The test fails and reports the current direct imports, transitional namespaces, manifest references, and surviving deps/common and deps/db directories.

Step 4: Run cd deps/melange && opam exec -- dune build @runtest.

Expected result: The Dune test alias fails for the same architectural violations and not for harness setup.

Step 5: Save the deterministic failure list as the initial migration checklist.

### Task 2: Write all missing behavior and contract tests

Files:

- Modify deps/melange/test/common/*_test.ml.
- Modify deps/melange/test/db/*_test.ml.
- Modify deps/melange/test/package_resolution_test.js.
- Modify deps/melange/test/common_namespace_package_test.js.
- Modify deps/melange/test/db_namespace_package_test.js.
- Modify deps/melange/test/platform_js_test.js.
- Modify deps/melange/bridge/test/logseq/melange/bridge/**/*_test.cljs.
- Relocate applicable tests from deps/common/test and deps/db/test into the preceding owners.

Step 1: Classify every legacy test as an OCaml domain test, JavaScript API contract test, bridge conversion test, application integration test, or obsolete duplicate.

Step 2: Port domain assertions to OCaml tests before deleting the original CLJS tests.

Step 3: Port boundary assertions to bridge tests without copying domain implementation details.

Step 4: Add typed fake capabilities for authorization, DataScript, SQLite, filesystem, clock, logging, fetch, and Web Crypto workflows.

Step 5: Add clean-artifact tests for common and db CommonJS and ESM entry points.

Step 6: Run each affected test command and confirm that every new behavior test fails for a missing OCaml or JS API behavior.

Expected result: The test suites are executable, and the added tests are RED for intended migration gaps.

### Task 3: Relocate the JavaScript API project

Files:

- Move deps/melange/lib/js_api to deps/melange/js_api.
- Modify deps/melange/dune-project.
- Modify affected Dune files under deps/melange.
- Modify deps/melange/scripts/build-js-api.sh.
- Modify deps/melange/js_api/package.json after the move.
- Modify deps/melange/js_api/vite.config.*.mjs after the move.
- Modify package.json.
- Modify pnpm-lock.yaml.
- Modify .gitignore.
- Modify JavaScript API contract tests that reference the old path.

Step 1: Move the complete js_api project as one unit, including package metadata, wrappers, Vite configuration, entry modules, and dist promotion rules.

Step 2: Update Dune module paths without changing domain behavior.

Step 3: Update the root @logseq/melange-js-api workspace link from deps/melange/lib/js_api to deps/melange/js_api.

Step 4: Add Dune promotion rules that emit common and db artifacts into deps/melange/js_api/dist as part of @bundle.

Step 5: Update .gitignore so generated dist JavaScript artifacts remain untracked.

Step 6: Keep node, browser, and graph-fs paths pointed at deps/melange/_build.

Step 7: Run pnpm melange:build-js-api.

Expected result: The common and db self-contained artifacts are regenerated at the new path.

Step 8: Run cd deps/melange && opam exec -- dune build @runtest @bundle.

Expected result: OCaml tests, JavaScript API contract tests, and bundles pass at the new path except for still-RED migration tests.

### Task 4: Establish the final bridge skeleton

Files:

- Move deps/melange/bridge/logseq/melange/bridge.cljs to deps/melange/bridge/src/logseq/melange/bridge/runtime.cljs.
- Create or normalize deps/melange/bridge/src/logseq/melange/bridge/common/*.cljs.
- Create or normalize deps/melange/bridge/src/logseq/melange/bridge/db/*.cljs.
- Create or normalize deps/melange/bridge/src/logseq/melange/bridge/platform/*.cljs.
- Modify deps/melange/bridge/deps.edn.
- Modify deps/melange/bridge/dune.

Step 1: Centralize value codecs, callback adaptation, promise adaptation, and error conversion in logseq.melange.bridge.runtime.

Step 2: Give each public Common and DB wrapper one JavaScript API dependency and one delegation path.

Step 3: Extract primitive environment integrations into platform adapters.

Step 4: Keep DataScript and ordered-map dependencies only when required for representation conversion or primitive adapter calls.

Step 5: Remove generic re-export namespaces that expose the raw JavaScript API object to application callers.

Step 6: Run the bridge test target.

Expected result: Boundary tests pass for the skeleton, while behavior tests remain RED until their OCaml APIs are implemented.

### Task 5: Complete the Common migration

Files:

- Modify deps/melange/lib/common/*.ml.
- Modify deps/melange/lib/common/*.mli.
- Modify deps/melange/js_api/common*.ml.
- Modify deps/melange/js_api/common*.js and CommonJS wrappers when required.
- Reduce deps/melange/bridge/src/logseq/melange/bridge/common/*.cljs.
- Modify deps/melange/test/common/*_test.ml.
- Modify Common JavaScript API contract tests.

Step 1: Inventory every remaining branch, validation rule, cache, sequence, and transformation in the current Common bridge.

Step 2: Move deterministic graph, utility, version, logging, and authorization behavior into deps/melange/lib/common.

Step 3: Represent effectful authorization workflows as OCaml logic over typed fetch, Web Crypto, clock, storage, and logging capabilities.

Step 4: Keep each bridge capability implementation primitive and free of workflow branching.

Step 5: Export stable JS-friendly Common functions from deps/melange/js_api.

Step 6: Reduce each Common bridge function to conversion, capability construction, delegation, and error conversion.

Step 7: Run Common OCaml tests, Common JS API contract tests, and Common bridge tests after each module reaches GREEN.

Expected result: No Common business logic remains in ClojureScript.

### Task 6: Complete the DB migration

Files:

- Modify deps/melange/lib/db/*.ml.
- Modify deps/melange/lib/db/*.mli.
- Modify deps/melange/js_api/db*.ml.
- Modify deps/melange/js_api/db*.js and CommonJS wrappers when required.
- Reduce deps/melange/bridge/src/logseq/melange/bridge/db/*.cljs.
- Modify deps/melange/test/db/*_test.ml.
- Modify DB JavaScript API contract tests.

Step 1: Move entity, entity-plus, relationship, reference, view, frontend, initial-data, and core behavior into OCaml modules.

Step 2: Move schema, rules, validation, input normalization, deletion, content, block-title, class-catalog, property-catalog, property, property-build, and property-type behavior into OCaml modules.

Step 3: Move transaction planning, query construction, filtering, sorting, grouping, and derived-value computation into OCaml modules.

Step 4: Move SQLite build, export, import, backup, restore, schema, validation, graph construction, and lifecycle sequencing into OCaml modules.

Step 5: Model DataScript, SQLite, filesystem, clock, and logging operations as typed primitive capabilities.

Step 6: Move maximum-key state, caches, schema state, and SQLite lifecycle state into OCaml-owned abstract modules or explicit caller-owned OCaml state values.

Step 7: Preserve opaque DataScript and SQLite handles through the JavaScript API.

Step 8: Export stable JS-friendly DB functions from deps/melange/js_api.

Step 9: Reduce each DB bridge function to conversion, capability construction, delegation, and error conversion.

Step 10: Run DB OCaml tests, DB JS API contract tests, and DB bridge tests after each module reaches GREEN.

Expected result: No DB query, transaction, validation, cache, or SQLite workflow logic remains in ClojureScript.

### Task 7: Migrate every ClojureScript consumer

Files:

- Modify Common and DB consumers under src.
- Modify Common and DB consumers under deps.
- Modify Common and DB consumers under scripts.
- Modify Common and DB consumers under clj-e2e and cli-e2e where applicable.
- Modify root and downstream deps.edn manifests.

Step 1: Replace every direct @logseq/melange-js-api import outside the bridge with a logseq.melange.bridge.* require.

Step 2: Replace every logseq.melange.common.*, logseq.melange.db.*, logseq.common.*, and logseq.db.* require with its final bridge namespace.

Step 3: Route node and browser package behavior through logseq.melange.bridge.platform.* when Common or DB application code needs it.

Step 4: Add direct logseq/melange-bridge dependencies to downstream projects that consume the bridge.

Step 5: Remove transitive reliance on logseq/common and logseq/db from root and downstream manifests.

Step 6: Compile each affected shadow-cljs, NBB, desktop, mobile, publish, and command-line target before moving to the next target family.

Expected result: The source guard reports no forbidden package or namespace imports.

### Task 8: Relocate scripts and build ownership

Files:

- Move deps/db/script/create_graph.cljs to scripts/src/logseq/tasks/db/create_graph.cljs.
- Move deps/db/script/dump_datoms.cljs to scripts/src/logseq/tasks/db/dump_datoms.cljs.
- Move deps/db/script/export_client_ops_ops.cljs to scripts/src/logseq/tasks/db/export_client_ops_ops.cljs.
- Move deps/db/script/query.cljs to scripts/src/logseq/tasks/db/query.cljs.
- Move deps/db/script/replay_sync_artifact.cljs to scripts/src/logseq/tasks/db/replay_sync_artifact.cljs.
- Move deps/db/script/replay_sync_sqlite.cljs to scripts/src/logseq/tasks/db/replay_sync_sqlite.cljs.
- Move deps/db/script/create_graph/inferred.edn to scripts/src/logseq/tasks/db/fixtures/create_graph/inferred.edn.
- Modify bb.edn.
- Create deps/melange/bb.edn.
- Modify package.json.
- Modify pnpm-lock.yaml.
- Modify deps/melange/bridge/dune.

Step 1: Move repository-level DB commands into the root scripts namespace.

Step 2: Update Babashka tasks and documented invocations to use their new namespaces and paths.

Step 3: Move @logseq/nbb-logseq ownership to the root package.json.

Step 4: Update bridge Dune actions to resolve the root node_modules/.bin/nbb-logseq executable.

Step 5: Move Melange-specific lint and generated-rule tasks from deps/db/bb.edn into deps/melange/bb.edn.

Step 6: Run every relocated script against its existing fixture or help path.

Expected result: No build or tool command depends on a deps/db-local package, node_modules directory, bb.edn file, script path, or lockfile.

### Task 9: Delete deps/common and deps/db

Files:

- Delete deps/common.
- Delete deps/db.
- Modify every remaining manifest, lockfile, task, CI workflow, test configuration, and documentation reference reported by the source guard.

Step 1: Confirm that all retained tests and scripts have a new owner.

Step 2: Delete the physical directories, including their manifests, locks, build output configuration, tests, fixtures, and scripts.

Step 3: Regenerate pnpm-lock.yaml and any affected classpath or task metadata.

Step 4: Run rg -n 'deps/(common|db)|logseq/(common|db)' --glob '!docs/agent-guide/079-melange-common-db*' .

Expected result: No live build, source, test, task, or CI reference remains.

Step 5: Run node deps/melange/test/cljs_boundary_test.js.

Expected result: The complete architecture guard passes.

### Task 10: Refresh migration evidence

Files:

- Modify docs/agent-guide/079-melange-common-db_inventory.md.
- Modify docs/agent-guide/079-melange-common-db_inventory_common.json.
- Modify docs/agent-guide/079-melange-common-db_inventory_db.json.

Step 1: Regenerate the inventories from the final tracked source tree.

Step 2: Record zero forbidden package imports outside the bridge.

Step 3: Record zero old Common and DB namespaces.

Step 4: Record zero files under deps/common and deps/db.

Step 5: Record the final bridge files and verify that each is classified only as conversion, adapter, error conversion, or one-hop delegation.

Expected result: The inventories describe the final ownership model and contain no migration TODOs.

### Task 11: Reach GREEN across all targets

Step 1: Run node deps/melange/test/cljs_boundary_test.js.

Expected result: The architecture guard passes.

Step 2: Run cd deps/melange && opam exec -- dune build @runtest @bundle.

Expected result: All OCaml, JavaScript API, and bundle tests pass.

Step 3: Run pnpm melange:build-js-api.

Expected result: The common and db dist artifacts regenerate in the gitignored source dist directory without unstaged drift.

Step 4: Run pnpm cljs:test.

Expected result: The compiled ClojureScript unit tests pass.

Step 5: Run pnpm cljs:run-test.

Expected result: The ClojureScript test runner passes.

Step 6: Run pnpm cljs:build-electron.

Expected result: The Electron targets compile without forbidden imports.

Step 7: Run pnpm cljs:release-mobile.

Expected result: The mobile target compiles without forbidden imports.

Step 8: Run pnpm --dir deps/graph-parser test.

Expected result: Graph parser consumers resolve the bridge directly and pass.

Step 9: Run pnpm --dir deps/outliner test.

Expected result: Outliner consumers resolve the bridge directly and pass.

Step 10: Run pnpm --dir deps/db-sync test.

Expected result: DB sync consumers resolve the bridge directly and pass.

Step 11: Run pnpm --dir deps/publish test.

Expected result: Publish worker consumers resolve the bridge directly and pass.

Step 12: Run pnpm --dir deps/publishing test.

Expected result: Publishing consumers resolve the bridge directly and pass.

Step 13: Run bb -f cli-e2e/bb.edn build.

Expected result: The CLI test artifact builds.

Step 14: Run bb -f cli-e2e/bb.edn test --skip-build.

Expected result: CLI end-to-end tests pass.

Step 15: Run bb dev:lint-and-test.

Expected result: Repository lint and unit tests pass.

Step 16: Document any unrelated pre-existing failure with its exact command and output, but do not treat a migration-owned failure as an acceptable baseline.

### Task 12: REFACTOR after GREEN

Files:

- Modify only the migrated OCaml, JavaScript API, bridge, test, script, manifest, and documentation files.

Step 1: Remove duplicate conversions and centralize them in logseq.melange.bridge.runtime.

Step 2: Remove duplicate OCaml helpers only when behavior tests protect the consolidation.

Step 3: Remove obsolete exports, fixtures, generated wrappers, and compatibility comments that are no longer referenced.

Step 4: Re-run the full GREEN command set after every refactor batch.

Expected result: The final dependency direction remains unchanged and all tests stay green.

## Edge cases and failure modes

### Module resolution

A clean checkout must not rely on stale deps/melange/_build output for common or db package loading.

NBB and shadow-cljs must resolve the same bridge namespaces without target-specific compatibility aliases.

CLJC reader conditionals must never create a branch that imports the JavaScript package outside the bridge.

Windows path separators must not invalidate source-guard allowlists or relocated script paths.

### Values and handles

Nil, JavaScript null, JavaScript undefined, and OCaml option values must have an explicit conversion policy.

Keywords, UUIDs, vectors, sets, maps, ordered maps, and nested combinations must round-trip without lossy stringification.

Opaque DataScript database, connection, entity, transaction report, and SQLite handles must retain identity.

Large collections must not be copied more times than the existing public contract requires.

### Async behavior

Synchronous exceptions and promise rejections must produce the same application-visible error category and diagnostic data.

Callback exceptions must not be swallowed by a bridge adapter.

Cancellation, timeout, retry, and fallback policy must live in OCaml when they are domain decisions.

A primitive runtime adapter may report an unavailable capability, but it may not choose an alternate workflow.

### State and lifecycle

OCaml-owned caches must have explicit creation, reset, and disposal behavior.

Tests must prove that multiple graphs, DB connections, and runtime targets do not leak state into one another.

SQLite initialization, migration, backup, export, restore, close, and error cleanup must have deterministic lifecycle tests.

Compile-time version values and goog-define values must be passed as data or primitive capabilities rather than read by domain bridge logic.

### Compatibility removal

There must be no namespace aliases for logseq.common.*, logseq.db.*, logseq.melange.common.*, or logseq.melange.db.*.

There must be no package fallback from dist to _build for common or db.

There must be no silent default that hides a missing runtime capability.

There must be no duplicated CLJS domain implementation retained for rollback.

## Rollout and review checkpoints

The migration is intentionally atomic at the repository boundary.

Intermediate commits may fail the final architecture guard while a known RED test documents the remaining work.

Each review checkpoint must still keep already migrated slices green.

Recommended checkpoints are the RED test suite, js_api relocation, bridge skeleton, Common completion, DB completion, consumer migration, tooling relocation and directory deletion, and final GREEN refactor.

No checkpoint may introduce a compatibility layer that changes the final architecture.

## Completion criteria

- deps/common does not exist.

- deps/db does not exist.

- deps/melange/js_api owns the JavaScript API project.

- deps/melange/lib/common owns all Common domain logic.

- deps/melange/lib/db owns all DB domain logic.

- deps/melange/bridge contains only conversions, primitive adapters, error conversion, and one-hop delegation.

- All application ClojureScript uses logseq.melange.bridge.* for migrated behavior.

- No ClojureScript outside the bridge imports @logseq/melange-js-api or a subpath.

- Common and db package exports load self-contained dist artifacts.

- Node, browser, and graph-fs exports continue to work from _build.

- All retained tests and scripts have an explicit new owner.

- The architecture guard and the complete verification matrix pass.

## Testing Details

The test pyramid starts with OCaml domain behavior, adds JavaScript API contracts, adds bridge conversion and adapter tests, and ends with application and target integration tests.

Every behavior change begins with a valid RED assertion and ends with GREEN verification before refactoring.

Source guards enforce dependency direction and physical directory removal because ordinary runtime tests cannot prove those architectural properties.

Clean-checkout package tests run after bundle generation and prevent package loading from reaching back into stale _build artifacts.

## Implementation Details

- Use git moves where history is materially useful, especially for js_api and retained scripts.

- Generate gitignored, self-contained Common and DB dist outputs through Dune promotion while leaving node, browser, and graph-fs on _build.

- Model effects as typed capabilities and keep workflow decisions in OCaml.

- Keep bridge functions shallow enough to audit mechanically.

- Move state into OCaml-owned abstractions and expose explicit lifecycle operations.

- Delete old namespaces and directories without aliases or fallback paths.

- Make downstream projects depend directly on logseq/melange-bridge.

- Preserve opaque runtime handles rather than serializing them.

- Keep specification additions narrow, typed, and free of generic JavaScript escape hatches.

- Regenerate inventories and lockfiles only after their owning paths are final.

## Question

No product decision remains for the architecture described here.

Implementation must pause only for a newly discovered behavior that requires a product decision beyond this migration.

---
