# Remove Legacy CLJS CLI

## Problem

Before this change, Logseq shipped one CLI implementation under `cli/`, built
from OCaml with Dune, Melange, and Vite, but retained most of the superseded
Shadow ClojureScript implementation under `src/main/logseq/cli/` and its tests under
`src/test/logseq/cli/`.

The release migration deliberately removed the `:logseq-cli` Shadow build and
made `cli/_build/default/dist/logseq-cli.js` the only producer of the staged
`static/logseq-cli.js` artifact. `package.json`, CLI E2E preflight, npm package
preparation, and Desktop runtime staging all use that OCaml/Melange artifact.
`scripts/test-cli-release-config.mjs` rejects any active Shadow CLI build path.

The legacy command tree had no production entry point. Repository-wide
namespace searches find no production consumer outside its own implementation.
It contained 31 production files and about 14,800 lines, while 26 dedicated test
files added about 16,800 more lines. Keeping this parallel implementation makes
search results, tests, and maintenance work describe a binary that users cannot
build or run.

Not every namespace under `src/main/logseq/cli/` is obsolete. Electron,
db-worker-node, and worker handlers still import shared daemon and transport
helpers. Those imports are part of the active runtime and must remain.

## Decision

Implemented in commit `df2623ea94d5d18c166cbb7acd2e0ef5adef2404`
(`enhance(cli): remove legacy CLJS CLI`) on 2026-08-26.

Removed only the legacy CLJS CLI closure that is unreachable from active
production builds:

- `src/main/logseq/cli/command/`;
- `src/main/logseq/cli/auth.cljs`;
- `src/main/logseq/cli/commands.cljs`;
- `src/main/logseq/cli/completion_generator.cljs`;
- `src/main/logseq/cli/config.cljs`;
- `src/main/logseq/cli/format.cljs`;
- `src/main/logseq/cli/humanize.cljs`;
- `src/main/logseq/cli/main.cljs`;
- `src/main/logseq/cli/output_mode.cljs`;
- `src/main/logseq/cli/tree_text.cljs`; and
- `src/main/logseq/cli/uuid_refs.cljs`.

Removed their implementation-specific CLJS tests:

- `src/test/logseq/cli/command/`;
- `src/test/logseq/cli/auth_test.cljs`;
- `src/test/logseq/cli/commands_test.cljs`;
- `src/test/logseq/cli/completion_generator_test.cljs`;
- `src/test/logseq/cli/config_test.cljs`;
- `src/test/logseq/cli/format_test.cljs`;
- `src/test/logseq/cli/main_test.cljs`;
- `src/test/logseq/cli/output_mode_test.cljs`; and
- `src/test/logseq/cli/uuid_refs_test.cljs`.

Removed the obsolete root `.carve/ignore` entry that still describes
`logseq.cli.main/main` as a Shadow `:node-script` entry point.

Updated the retained `src/test/logseq/cli/server_test.cljs` and
`src/test/frontend/worker/db_worker_node_test.cljs` namespaces to require
`logseq.db-worker.server-list` directly and replaced their
`logseq.cli.config/server-list-path` calls with `server-list/path`. These tests
exercise the active db-worker-node runtime and must not retain a dependency on
the deleted CLI configuration namespace.

Retained the active CLJS runtime boundary and its tests:

- `logseq.cli.common` and `logseq.cli.common.db-worker`, used by Electron and
  worker handlers;
- `logseq.cli.root-dir`, used by db-worker-node and worker logging;
- `logseq.cli.server`, used by Electron runtime management;
- `logseq.cli.transport`, used by Electron database access;
- `logseq.cli.style`, used by db-worker-node;
- `logseq.cli.log` and `logseq.cli.profile`, used transitively by the active
  server and transport helpers; and
- `logseq.cli.test-helper`, which is also consumed by db-worker-node tests.

Kept the shared helpers in their existing namespace for this decision. Moving
them to a neutral namespace would add unrelated churn without reducing the
duplicate CLI implementation.

Updated `docs/cli/logseq-cli.md` so its query example points to the shipped OCaml
implementation in `cli/lib/query.ml` instead of `logseq.cli.command.query`.
Preserved `static/logseq-cli.js` as a generated artifact of the existing
OCaml/Melange staging flow; it is not part of the source deletion.

## Alternatives considered

### Retain the CLJS implementation as a reference

Rejected because the OCaml implementation, its unit/parity tests, CLI E2E
manifests, and the public command reference already own shipped behavior. A
second non-buildable implementation is a stale source of truth rather than an
executable reference.

### Delete every `logseq.cli` namespace

Rejected because Electron, db-worker-node, and worker production code still
consume the daemon, root-directory, transport, formatting, and shared database
helpers listed in the proposal.

### Move the retained helpers before deleting the command tree

Rejected for this decision because namespace relocation changes many active
runtime imports but is not required to remove the parallel CLI. It can be
considered separately if the `logseq.cli` name remains confusing after the
obsolete implementation is gone.

## Consequences

### Verification

Source and commit inspection on 2026-09-15 confirmed that:

- The 31 legacy source files and 26 implementation-specific test files are
  removed; the eight active runtime namespaces and their focused tests remain.
- Both retained runtime test namespaces use `server-list/path` directly and no
  longer require `logseq.cli.config`.
- Root Carve configuration no longer identifies `logseq.cli.main/main` as an
  entry point, and the CLI query documentation points to `cli/lib/query.ml`.
- `scripts/test-cli-release-config.mjs` includes assertions rejecting the
  removed source/test paths, stale configuration imports, and the old query
  documentation reference. It also checks the OCaml/Melange staging boundary
  and rejects an active Shadow CLI build.

The lifecycle transition records verified source changes. The release-config
check, OCaml CLI tests, CLI E2E tests, focused CLJS tests, and full
`bb dev:lint-and-test` suite were not rerun for this documentation transition;
this record does not assert fresh passing results for those checks.

### Operational risks

- A developer may have used the old CLJS namespaces manually even though they
  have no build, package, or documented public entry point. This decision
  intentionally gives up that unsupported workflow.
- Removing duplicate CLJS tests reduces coverage of the deleted implementation.
  Shipped CLI behavior remains covered by `cli/test/` and `cli-e2e/`; active
  shared CLJS runtime tests remain in place.
- The retained helpers continue to use the `logseq.cli` namespace, so the name
  will describe runtime infrastructure as well as the historical location of
  the removed CLI. Renaming them is outside this simplification.

