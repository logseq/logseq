# Trim Graph Name Boundaries

## Problem

CLI directory discovery accepts `graphs/ alpha `, then trims its typed graph
name to `alpha` while retaining the physical directory name. Listing and
subsequent commands therefore address different directories. Runtime probing
on the current branch reproduced a misleading listing, failed switch, and
duplicate advertised names when both directories exist.

The user requested trimming leading and trailing whitespace throughout graph
name and directory-related code. Repository inspection found related gaps in
shared graph codecs, repo identity/display conversion, graph-lifecycle paths,
renderer creation, and browser storage pool names.

## Decision

Normalize logical graph names before encoding, prefix conversion, identity
comparison, creation, and pool naming. Keep internal spaces and the existing
standard URI/tilde encoding. Directory discovery must reject physical names
whose decoded identity changes under trimming, rather than silently directing
commands to another directory. Keep physical paths intact; do not rename or
migrate existing directories.

Audit and cover these owners and their consumers:

| Owner | Consumers and change |
| --- | --- |
| `cli/lib/cli_primitive.ml`, `cli_config.ml`, `graph_dir.ml` | CLI options/config, create/import/sync, discovery, server paths; normalize names and reject padded physical directories |
| `deps/common/src/logseq/common/config.cljs`, `graph_dir.cljs` | Desktop discovery, worker paths, backups, repo comparison, display; normalize logical names and exclude padded decoded names |
| `deps/common/src/logseq/common/graph_registry.cljc` | Registry entry names and identity lookup; trim persisted names and lookup values |
| `src/electron/electron/utils.cljs` | Electron graph directory lookup; trim before prefix validation and shared encoding |
| `deps/graph-lifecycle/index.cjs` | Electron/CLI/worker graph and lifecycle state paths; normalize prefixed and prefix-free identities |
| `src/main/frontend/handler/repo.cljs` | Renderer creation and duplicate detection; use trimmed names |
| `src/main/frontend/worker_common/util.cljc` | Browser storage pool naming; trim graph names |

CLI graph/repo constructors and directory encoding use JavaScript trim semantics,
including Unicode whitespace, consistently with ClojureScript and lifecycle code.
Trim again after removing the repo prefix. Generic filesystem path handling is
unchanged.
Do not change `cli/spec/`, dune files, storage roots, legacy encoding policy
outside the current branch, or unrelated filesystem paths.

Added command-boundary CLI regressions and shared-codec, registry, renderer,
worker, and lifecycle regressions. Verified the failures before implementing
normalization. Replaced the touched parity fixture's direct runtime assertions
with public create/import/remove command checks.

## Alternatives considered

### Trim physical paths during scanning

Rejected because trimming ` alpha ` into `alpha` does not move the directory
and causes commands to select a different graph.

### Preserve surrounding whitespace in graph identities

Rejected because it conflicts with the user's normalization policy and existing
CLI input normalization.

## Consequences

### Resulting behavior

- Input names with leading/trailing whitespace resolve to trimmed graph names
  across the audited CLI, shared, lifecycle, and renderer paths.
- Internal spaces and special characters retain their encoding and identity.
- Padded on-disk directories are ignored and untouched, even beside a canonical
  directory with the same trimmed name. Whitespace-only names do not surface
  as discoverable graphs.
- Tests use public command behavior where appropriate and reproduce the
  reported listing/operation mismatch before implementation.
- Focused CLI, shared, renderer/worker, and lifecycle tests pass, followed by
  relevant actual CLI operations and formatting/lint checks.
- Decision documents validate with `spec-dev-tool check --all`.

### Constraints

- Changing logical normalization must not mutate actual filesystem paths.
- Prefix removal can reveal whitespace inside a repo identifier; trim after
  removing the prefix as well as before checking it.
- Shared decoding keeps its existing non-whitespace legacy policy; this fix
  does not broaden the CLI refactoring into a storage migration.

### Validation

Before implementation, the CLI fixture exposed padded physical directories and
failed the public command regression. Shared ClojureScript tests reported 36
assertion failures; registry tests reported three failures; both lifecycle tests
failed. Additional Unicode CLI coverage failed because OCaml `String.trim` did
not remove JavaScript Unicode whitespace.

After implementation:

- All 237 CLI tests pass, including standard discovery and public-command
  whitespace regressions.
- The 47 focused ClojureScript tests pass (168 assertions), and 58 related
  Electron manager, CLI server, and graph backup tests pass (163 assertions).
- Both graph-lifecycle filesystem tests pass.
- `db-worker-node`, `test`, and `electron` compile without warnings.
- Changed ClojureScript files pass clj-kondo; `bb lint:large-vars` passes.
- A freshly bundled CLI on `enhance/cli-graph-directory-discovery` passes 25
  actual commands in an isolated storage root whose own basename has spaces:
  list in three formats, blank-name rejection, create, switch, info, page
  write/read, validate, worker restart, export, import, duplicate detection,
  and removal. ASCII/Unicode-padded logical names reach one canonical directory;
  all eight padded physical-directory fixtures remain untouched. Temporary
  graphs and workers are cleaned up after verification.
- Renderer behavior is covered through handler tests and browser pool helper
  tests; a full Desktop/browser UI session was not exercised.

The package-local common test runner was unavailable because its local
`nbb-logseq` executable was missing. Common tests were compiled and executed
through the existing root ClojureScript test runner using an extra test
classpath, without changing manifests or installing dependencies.
