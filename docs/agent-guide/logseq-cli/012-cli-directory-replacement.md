# CLI Directory Replacement Implementation Plan

Goal: Replace the Shadow CLJS `logseq-cli` binary with the Dune, Melange, and Vite CLI under `/Users/rcmerci/gh-repos/logseq/cli` across local builds, npm packaging, and desktop packaging.

Architecture: Keep one runtime artifact contract for consumers by staging `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js` into `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js`.
Architecture: Remove the Shadow CLJS `:logseq-cli` build from CLI binary production, and make local build, test, npm packaging, and desktop packaging paths call the `cli/` bundle pipeline instead.
Architecture: Preserve the existing db-worker-node runtime contract because `/Users/rcmerci/gh-repos/logseq/cli/AGENTS.md` says the `cli/` implementation should use the existing CLJS db-worker-node server.

Tech Stack: Dune, Melange, Vite, Node 22+, pnpm, Babashka, Electron Builder, Shadow CLJS for non-CLI targets, db-worker-node, CLI E2E, and @test-driven-development.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md`.

## Problem statement

The repository currently has two CLI implementations.

The older runtime is a Shadow CLJS build configured by `/Users/rcmerci/gh-repos/logseq/shadow-cljs.edn` under the `:logseq-cli` target.

That build writes `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js`.

The newer runtime lives under `/Users/rcmerci/gh-repos/logseq/cli`.

That implementation builds with Dune, emits Melange CommonJS, and bundles with Vite to `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js`.

The goal is to make the `cli/` implementation the only `logseq` CLI binary used by local commands, CLI E2E, npm packaging, and desktop packaging.

The migration should not add a fallback path from the new CLI to the old Shadow CLJS binary.

The migration should fail fast when the `cli/` artifact is missing, stale, or cannot be bundled.

The migration should avoid adding a compatibility layer that lets both CLI binaries remain buildable.

The db-worker-node runtime remains CLJS for this plan.

The desktop app still needs the packaged CLI script under `app.asar/js/logseq-cli.js`.

The npm package still needs `dist/logseq.js` as its bin launcher.

The CLI E2E runner currently executes `node static/logseq-cli.js`.

The implementation should keep those consumer-facing paths stable by staging the `cli/` artifact into the existing runtime locations.

## Current implementation snapshot

All paths in this document are under `/Users/rcmerci/gh-repos/logseq`.

The old CLI binary build is `:logseq-cli` in `/Users/rcmerci/gh-repos/logseq/shadow-cljs.edn`.

The old CLI source entrypoint is `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs`.

The old CLI command implementation lives under `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command`.

The root bin launcher is `/Users/rcmerci/gh-repos/logseq/dist/logseq.js`.

The root bin launcher currently requires `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js`.

The root package publishes `dist/`, `static/logseq-cli.js`, and `.agents/skills/logseq-cli/SKILL.md` through `/Users/rcmerci/gh-repos/logseq/package.json`.

The npm package preparation script is `/Users/rcmerci/gh-repos/logseq/scripts/prepare-cli-package.mjs`.

The desktop runtime staging script is `/Users/rcmerci/gh-repos/logseq/scripts/prepare-desktop-runtime-js.mjs`.

The desktop runtime staging script copies `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js` to `/Users/rcmerci/gh-repos/logseq/static/js/logseq-cli.js`.

The packaged desktop app resolves the CLI script in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/core.cljs`.

The CLI release configuration regression script is `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs`.

The CLI E2E preflight currently builds `clojure -M:cljs compile logseq-cli` from `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/preflight.clj`.

The CLI E2E runner currently points `{{cli}}` at `node static/logseq-cli.js` from `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/runner.clj`.

The new CLI package manifest is `/Users/rcmerci/gh-repos/logseq/cli/package.json`.

The new CLI bundle command is `pnpm --dir cli bundle`.

The new CLI bundle target is `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js`.

The new CLI version metadata is injected by `/Users/rcmerci/gh-repos/logseq/cli/vite.config.mjs`.

The new CLI Dune bundle rule is `/Users/rcmerci/gh-repos/logseq/cli/dist/dune`.

The new CLI tests run with `pnpm --dir cli test`.

The new CLI must not use the `db-worker-node` implementation from `cli/` because `/Users/rcmerci/gh-repos/logseq/cli/AGENTS.md` says the CLI should use the existing CLJS db-worker-node server.

Several CLJS namespaces under `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli` are also imported by Electron and worker code.

Those shared imports include `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs`, `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db.cljs`, `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs`, `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`, and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.

The implementation must distinguish old CLI binary code from CLJS helper namespaces that are still shared with Electron or db-worker-node.

## Target artifact flow

The target flow keeps the consumer-facing artifact names stable while changing the producer.

```text
/Users/rcmerci/gh-repos/logseq/cli/lib/*.ml
        |
        v
pnpm --dir cli bundle
        |
        v
/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js
        |
        v
node /Users/rcmerci/gh-repos/logseq/scripts/stage-cli-runtime.mjs
        |
        v
/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js
        |
        +--> node /Users/rcmerci/gh-repos/logseq/dist/logseq.js
        |
        +--> /Users/rcmerci/gh-repos/logseq/scripts/prepare-cli-package.mjs
        |
        +--> /Users/rcmerci/gh-repos/logseq/scripts/prepare-desktop-runtime-js.mjs
```

`/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js` is a staged release artifact.

It must always be generated from `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js`.

It must never be generated by `clojure -M:cljs release logseq-cli` after this migration.

## Testing Plan

I will add a release configuration regression in `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs` proving `/Users/rcmerci/gh-repos/logseq/package.json` exposes `cli:release`.

I will add a release configuration regression in `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs` proving `cli:release` delegates to `pnpm --dir cli bundle` and `node ./scripts/stage-cli-runtime.mjs`.

I will add a release configuration regression in `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs` proving `/Users/rcmerci/gh-repos/logseq/shadow-cljs.edn` no longer contains a `:logseq-cli` build.

I will add a release configuration regression in `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs` proving root `package.json` scripts no longer pass `logseq-cli` to Shadow CLJS watch, compile, or release commands.

I will add a release configuration regression in `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs` proving `/Users/rcmerci/gh-repos/logseq/scripts/stage-cli-runtime.mjs` copies from `cli/_build/default/dist/logseq-cli.js` to `static/logseq-cli.js` and rejects stale or missing inputs.

I will add a release configuration regression in `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs` proving `/Users/rcmerci/gh-repos/logseq/scripts/prepare-cli-package.mjs` packages the staged CLI and still rejects Shadow runtime markers.

I will add a release configuration regression in `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs` proving `/Users/rcmerci/gh-repos/logseq/scripts/prepare-desktop-runtime-js.mjs` still copies the staged CLI into `static/js/logseq-cli.js`.

I will add a CLI E2E preflight unit test in `/Users/rcmerci/gh-repos/logseq/cli-e2e/test/logseq/cli/e2e/preflight_test.clj` proving the default build command is the new CLI staging command, not `clojure -M:cljs compile logseq-cli`.

I will add a CLI E2E paths unit test in `/Users/rcmerci/gh-repos/logseq/cli-e2e/test/logseq/cli/e2e/paths_test.clj` or the nearest existing paths test proving the required artifact set includes `cli/_build/default/dist/logseq-cli.js`, `static/logseq-cli.js`, `dist/db-worker-node.js`, and `dist/db-worker-node-assets.json`.

I will add or update a Dune test under `/Users/rcmerci/gh-repos/logseq/cli/test/test_cases.ml` proving `--version` and `--help` still work when the CLI is executed through the bundled runtime.

I will run `node scripts/test-cli-release-config.mjs` after writing the release configuration tests and expect it to fail until the build and packaging files are migrated.

I will run `bb -f cli-e2e/bb.edn test --skip-build -v logseq.cli.e2e.preflight-test` after writing the preflight tests and expect it to fail until the preflight build command is migrated.

I will run `pnpm --dir cli test` after writing any new Dune test and expect it to fail only if the `cli/` binary behavior is missing.

I will then implement the migration and rerun `pnpm --dir cli test`.

I will rerun `node scripts/test-cli-release-config.mjs`.

I will rerun `bb -f cli-e2e/bb.edn test --skip-build`.

I will run `pnpm cli:release` and expect it to produce `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js`.

I will run `node /Users/rcmerci/gh-repos/logseq/static/logseq-cli.js --help` and expect usage output.

I will run `node /Users/rcmerci/gh-repos/logseq/dist/logseq.js --version` and expect build metadata from the `cli/` Vite defines.

I will run `pnpm db-worker-node:release:bundle` and `node scripts/prepare-cli-package.mjs`.

I will run `node dist/cli-package/dist/logseq.js --help` and expect usage output.

I will run `pnpm desktop:prepare-runtime-js` after the CLI and db-worker-node artifacts are built.

I will run `node static/js/logseq-cli.js --help` and expect usage output.

I will run `bb dev:cli-e2e --jobs 1 --verbose` after the local artifacts are staged.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation tasks

### Phase 1.

Read `/Users/rcmerci/gh-repos/logseq/AGENTS.md`.

Read `/Users/rcmerci/gh-repos/logseq/cli/AGENTS.md`.

Read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/AGENTS.md`.

Read `/Users/rcmerci/gh-repos/logseq/cli-e2e/AGENTS.md` before editing any file under `/Users/rcmerci/gh-repos/logseq/cli-e2e`.

Run `rg -n "logseq-cli|:logseq-cli|static/logseq-cli.js|static/js/logseq-cli.js|cljs release logseq-cli|cljs compile logseq-cli|watch .*logseq-cli" /Users/rcmerci/gh-repos/logseq`.

Save the resulting list in the implementation notes for the PR.

Classify each match as one of build producer, staged runtime consumer, desktop runtime consumer, npm packaging consumer, e2e consumer, test assertion, or documentation.

Do not edit files during this classification step.

### Phase 2.

Open `/Users/rcmerci/gh-repos/logseq/scripts/test-cli-release-config.mjs`.

Add assertions that `/Users/rcmerci/gh-repos/logseq/shadow-cljs.edn` does not contain `:logseq-cli`.

Add assertions that `/Users/rcmerci/gh-repos/logseq/package.json` scripts do not include `logseq-cli` in any `clojure -M:cljs` command.

Add assertions that `/Users/rcmerci/gh-repos/logseq/package.json` contains a root `cli:release` script.

Add assertions that the `cli:release` script delegates to `pnpm --dir cli bundle` and `node ./scripts/stage-cli-runtime.mjs`.

Add assertions that `/Users/rcmerci/gh-repos/logseq/scripts/stage-cli-runtime.mjs` exists.

Add assertions that `/Users/rcmerci/gh-repos/logseq/scripts/stage-cli-runtime.mjs` references `cli/_build/default/dist/logseq-cli.js` and `static/logseq-cli.js`.

Add assertions that `/Users/rcmerci/gh-repos/logseq/scripts/prepare-cli-package.mjs` still packages `static/logseq-cli.js`.

Add assertions that `/Users/rcmerci/gh-repos/logseq/scripts/prepare-cli-package.mjs` still rejects `SHADOW_IMPORT`, `.shadow-cljs`, and `cljs-runtime`.

Run `node scripts/test-cli-release-config.mjs`.

Confirm the test fails because the migration has not been implemented yet.

Do not proceed until the failure message points at the old CLJS build configuration or missing staging script.

### Phase 3.

Open `/Users/rcmerci/gh-repos/logseq/cli-e2e/AGENTS.md`.

Open `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/preflight.clj`.

Open `/Users/rcmerci/gh-repos/logseq/cli-e2e/test/logseq/cli/e2e/preflight_test.clj`.

Update or add tests proving the preflight build command is the new root CLI release script.

Update or add tests proving the preflight no longer runs `clojure -M:cljs compile logseq-cli`.

Open `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/paths.clj`.

Open the closest existing paths test under `/Users/rcmerci/gh-repos/logseq/cli-e2e/test/logseq/cli/e2e`.

Update or add tests proving the artifact preflight checks include `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js`.

Update or add tests proving the artifact preflight checks include `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js`.

Update or add tests proving the artifact preflight checks still include `/Users/rcmerci/gh-repos/logseq/dist/db-worker-node.js` and `/Users/rcmerci/gh-repos/logseq/dist/db-worker-node-assets.json`.

Run `bb -f cli-e2e/bb.edn test --skip-build -v logseq.cli.e2e.preflight-test`.

Confirm the test fails because the preflight still invokes the old CLJS build.

Run the paths test if it is separate.

Confirm it fails because the new `cli/` artifact is not yet part of the preflight contract.

### Phase 4.

Open `/Users/rcmerci/gh-repos/logseq/cli/test/test_cases.ml`.

Add a behavior test only if the current test suite does not already execute the bundled runtime path.

The test should run the bundled CLI with `--help` and assert that usage output is printed.

The test should run the bundled CLI with `--version` and assert that build metadata is printed.

The test must not assert internal module layout or Dune implementation details.

Run `pnpm --dir cli test`.

Confirm the test failure is a real behavior failure if a test was added.

If the existing suite already covers the behavior, record that no extra Dune test is needed.

### Phase 5.

Create `/Users/rcmerci/gh-repos/logseq/scripts/stage-cli-runtime.mjs`.

The script should read `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js`.

The script should write `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js`.

The script should fail if `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js` does not exist.

The script should fail if `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js` contains `SHADOW_IMPORT`, `.shadow-cljs`, or `cljs-runtime`.

The script should create `/Users/rcmerci/gh-repos/logseq/static` when it is missing.

The script should copy file mode where practical, then force the staged file to be readable.

The script should remove `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js.map` if no sourcemap is produced by `cli/`.

The script should print a concise success line with source and destination paths.

Do not add a fallback to build the old CLJS CLI.

Do not silently create an empty placeholder when the `cli/` artifact is missing.

### Phase 6.

Open `/Users/rcmerci/gh-repos/logseq/package.json`.

Add a root script named `cli:release`.

Make the script run `pnpm --dir cli bundle && node ./scripts/stage-cli-runtime.mjs`.

Update `cljs:dev-watch` to remove `logseq-cli` from the Shadow watch target list.

Update `cljs:app-watch` to remove `logseq-cli` from the Shadow watch target list.

Update `cljs:electron-watch` to remove `logseq-cli` from the Shadow watch target list.

Update `cljs:release-electron` to remove `logseq-cli` from the Shadow release target list.

Update `cljs:dev-release-electron` to remove `logseq-cli` from the Shadow release target list.

Update `cljs:build-electron` to remove `logseq-cli` from the Shadow compile target list.

Leave db-worker-node build scripts unchanged.

Leave mobile and app Shadow targets unchanged.

Run `node scripts/test-cli-release-config.mjs`.

Confirm the remaining failures point to Shadow config, E2E, or packaging migration.

### Phase 7.

Open `/Users/rcmerci/gh-repos/logseq/shadow-cljs.edn`.

Remove the `:logseq-cli` build target.

Do not keep a disabled or commented copy of the old build target.

Do not add a new Shadow target for the `cli/` implementation.

Run `node scripts/test-cli-release-config.mjs`.

Confirm the remaining failures point to E2E or packaging migration.

Run `pnpm cljs:release-electron` only after the script changes are complete enough to avoid rebuilding the old CLI.

Expect Electron, app, db-worker, db-worker-node, and publishing builds to remain valid.

### Phase 8.

Open `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/preflight.clj`.

Change the build command from `clojure -M:cljs compile logseq-cli` to the new root CLI release script.

Use exactly `pnpm cli:release`.

Keep db-worker-node preflight build behavior intact.

Open `/Users/rcmerci/gh-repos/logseq/cli-e2e/src/logseq/cli/e2e/paths.clj`.

Add `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js` to the required local artifact list when preflight checks build outputs.

Keep `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js` as the runner artifact because existing shell specs use that path.

Run `bb -f cli-e2e/bb.edn test --skip-build -v logseq.cli.e2e.preflight-test`.

Run the updated paths test if it is separate.

Confirm both tests pass.

### Phase 9.

Open `/Users/rcmerci/gh-repos/logseq/scripts/prepare-cli-package.mjs`.

Keep the npm package bin as `dist/logseq.js`.

Keep the packaged CLI runtime path as `static/logseq-cli.js`.

Add a freshness check that compares `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js` against `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js`.

Fail if the staged runtime is older than the `cli/` bundle by more than one second.

Keep the existing Shadow runtime marker rejection.

Keep the existing db-worker-node package entries.

Do not package `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js` directly unless all consumers are updated to one canonical runtime path.

Run `node scripts/test-cli-release-config.mjs`.

Confirm the package assertions pass.

### Phase 10.

Open `/Users/rcmerci/gh-repos/logseq/scripts/prepare-desktop-runtime-js.mjs`.

Keep copying `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js` to `/Users/rcmerci/gh-repos/logseq/static/js/logseq-cli.js`.

Add a freshness check that compares `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js` against `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js`.

Fail with a message that tells the developer to run the new root CLI release script when the staged CLI is stale.

Keep the existing db-worker-node freshness check.

Keep the existing cleanup of root `static/logseq-cli.js` after desktop staging only if no local packaging, local CLI E2E, or subsequent step still needs it.

If cleanup creates ordering problems with npm packaging, run npm packaging before desktop staging or stop deleting `static/logseq-cli.js` in this script.

Prefer keeping the staged root runtime available for local CLI E2E and npm packaging.

Run `node scripts/test-cli-release-config.mjs`.

Confirm desktop runtime assertions pass.

### Phase 11.

Run `rg -n "clojure -M:cljs (compile|release) logseq-cli|:logseq-cli|watch .*logseq-cli" /Users/rcmerci/gh-repos/logseq`.

Remove all remaining active old CLI build references.

Keep historical mentions only in this plan document or explicit migration notes.

Run `rg -n "static/logseq-cli.js|static/js/logseq-cli.js|cli/_build/default/dist/logseq-cli.js" /Users/rcmerci/gh-repos/logseq`.

Confirm every active consumer is either the staging script, package script, desktop staging script, e2e runner, launcher, or test assertion.

Run `rg -n "src/main/logseq/cli|src/test/logseq/cli" /Users/rcmerci/gh-repos/logseq/.github /Users/rcmerci/gh-repos/logseq/scripts`.

Confirm any remaining reference is explicitly about shared CLJS helper code, not binary production.

### Phase 12.

Audit `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli` after the build migration is green.

Use `rg -n "logseq\\.cli\\." /Users/rcmerci/gh-repos/logseq/src/electron /Users/rcmerci/gh-repos/logseq/src/main/frontend /Users/rcmerci/gh-repos/logseq/src/main/logseq`.

Create a list of CLJS namespaces that are still imported outside the old CLI command tree.

Do not delete a namespace that Electron or db-worker-node still imports.

Move shared CLJS helpers to a neutral namespace only if the move is small and fully covered by existing tests.

Prefer a follow-up cleanup PR if the shared helper extraction is large.

Delete old CLJS command namespaces only after the import audit proves they are not needed by Electron, frontend worker, or db-worker-node.

Delete old CLJS CLI tests only after the corresponding behavior is covered by `/Users/rcmerci/gh-repos/logseq/cli/test/test_cases.ml` or CLI E2E.

Do not keep duplicate command behavior tests for a removed binary.

### Phase 13.

Run `pnpm --dir cli test`.

Run the new root CLI release script.

Run `node static/logseq-cli.js --help`.

Run `node dist/logseq.js --version`.

Run `pnpm db-worker-node:release:bundle`.

Run `node scripts/prepare-cli-package.mjs`.

Run `node dist/cli-package/dist/logseq.js --help`.

Run `pnpm --dir dist/cli-package install --prod`.

Run `pnpm --dir dist/cli-package pack --pack-destination ../`.

Run `pnpm desktop:prepare-runtime-js`.

Run `node static/js/logseq-cli.js --help`.

Run `bb -f cli-e2e/bb.edn test --skip-build`.

Run `bb dev:cli-e2e --jobs 1 --verbose` when the local build can afford the full shell-first suite.

Run `bb dev:lint-and-test` if CLJS helper namespaces, root package scripts, or shared CLJS tests were changed.

## Edge cases

The staged CLI can be stale when `cli/_build/default/dist/logseq-cli.js` was rebuilt after `static/logseq-cli.js`.

The staging script and packaging scripts should fail in that case.

The staged CLI can be missing when a developer runs `node dist/logseq.js` without first running the new root CLI release script.

The failure should clearly say which command to run.

The desktop runtime script currently removes root `static/logseq-cli.js`.

That cleanup can break local CLI E2E or npm packaging if the local command order changes.

The implementation should either preserve the staged root runtime or make local command ordering explicit and tested.

The new CLI bundle may not emit `static/logseq-cli.js.map`.

The staging and packaging scripts should not require a sourcemap unless the `cli/` Vite config starts producing one.

The new CLI may use different capitalization in help output.

Smoke tests should accept stable semantic markers such as `Usage` and known command names rather than exact full help text.

The new CLI must still locate the CLJS db-worker-node runtime after npm packaging.

The package script must keep `static/js/db-worker-node.js` and `static/js/db-worker-node-assets.json`.

The new CLI must still work when launched through Electron with `ELECTRON_RUN_AS_NODE=1`.

The desktop verification should execute `node static/js/logseq-cli.js --help` and the installed launcher should still point at `app.asar/js/logseq-cli.js`.

The migration should not delete CLJS helper namespaces that Electron still imports.

The implementation should avoid renaming shared CLJS namespaces in the same PR unless the change is small and covered.

The implementation should not add a second bin launcher that bypasses `dist/logseq.js`.

One bin launcher keeps npm and local behavior easier to reason about.

## Testing Details

The release configuration tests verify behavior at the integration boundary by reading actual package, Shadow, and packaging files.

They do not test data structures in isolation.

The CLI E2E preflight tests verify that the test runner builds and checks the runtime artifacts that a developer actually uses.

The Dune tests verify the `cli/` binary behavior through `--help` and `--version`.

The smoke tests verify the staged runtime, root bin launcher, npm package launcher, and desktop staged launcher all execute.

The full CLI E2E run verifies that the staged runtime can still create graphs, talk to db-worker-node, run graph commands, and pass existing shell-first scenarios.

## Implementation Details

- Use `@test-driven-development` and complete the RED phase before implementation.
- Keep `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js` as the staged runtime contract.
- Make `/Users/rcmerci/gh-repos/logseq/cli/_build/default/dist/logseq-cli.js` the only binary producer.
- Remove the Shadow CLJS `:logseq-cli` build instead of disabling it.
- Keep db-worker-node build and bundle commands unchanged.
- Keep `/Users/rcmerci/gh-repos/logseq/dist/logseq.js` as the npm bin launcher.
- Name the root release script `cli:release`.
- Update desktop packaging to stage the new CLI before `desktop:prepare-runtime-js`.
- Preserve Electron launcher behavior through `static/js/logseq-cli.js`.
- Audit shared CLJS namespace imports before deleting old CLI source.

## Question

Should `/Users/rcmerci/gh-repos/logseq/static/logseq-cli.js` remain committed or be treated as a generated artifact.

The current repository already treats it as a build artifact, so this plan keeps it generated and validated by preflight.

Should old CLJS command source be deleted in the same PR as the build migration.

This plan recommends deleting only code that the import audit proves is unused, and deferring shared namespace extraction if it grows beyond a small cleanup.

Should CLI E2E execute `node static/logseq-cli.js` or `node cli/_build/default/dist/logseq-cli.js`.

This plan recommends keeping `node static/logseq-cli.js` because it tests the same staged artifact used by npm packaging and desktop packaging.

---
