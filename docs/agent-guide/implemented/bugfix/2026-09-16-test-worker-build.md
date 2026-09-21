# Test Worker Build

## Problem

The CLJS test job compiles only the test target, but two new lifecycle regression tests launch static/db-worker-node.js. A clean CI checkout lacks that generated worker entry point.

## Decision

Compile db-worker-node alongside test in the shared pnpm cljs:test command, and make the main CI test job use that command. Keep the existing real-worker regression tests as behavioral coverage. The user requested this fix.

## Alternatives considered

### Build the worker only in CI

Adding a CI-only build step would leave pnpm test and bb dev:test dependent on pre-existing local artifacts.

## Acceptance criteria

- Both existing regression tests reproduce the startup failure without the generated worker entry point.
- The shared test build regenerates the worker entry point and both affected namespaces pass.
- CI uses the shared build command.

## Consequences

- Test builds also compile the worker target, adding build time.

## Questions

None. The requested fix covers the missing test build dependency.

## Verification

- Temporarily moved the generated worker entry point outside the checkout and ran the two existing regression cases against static/tests.js. Both reproduced the CI startup and cleanup failures: 2 tests, 4 failures, 0 errors. Restored the entry point afterward.
- Removed the entry point from the build inputs again and ran pnpm cljs:test. Both targets built with zero warnings, and the command regenerated static/db-worker-node.js.
- Ran LOGSEQ_STABLE_IDENTS=1 node static/tests.js -n electron.db-worker-manager-test -n frontend.persist-db-test: 75 tests, 268 assertions, 0 failures, 0 errors. This includes real worker shutdown/reopen and graph import/download coverage.
- Verification ran on macOS with Node 22.21.1. The GitHub Ubuntu/Node 24 job has not been rerun.
