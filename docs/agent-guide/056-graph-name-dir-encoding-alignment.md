# Align graph dir encoding between logseq-cli and desktop app

## Summary

Align `logseq-cli`, `db-worker-node`, and desktop app handling of `graph dir` / `graph-name` so special characters are encoded and decoded with one shared, reversible contract.

The authoritative contract would be the existing `encode-graph-dir-name` / `decode-graph-dir-name` pair in `src/main/frontend/worker_common/util.cljc`, which is already used by `db-worker-node` and `logseq-cli` server-side graph directory resolution.

This plan keeps user-facing graph names unchanged and only aligns their on-disk directory representation.

## Background

Current code paths do not agree on how a graph name maps to a graph directory on disk:

- `db-worker-node` and `logseq-cli` server/runtime paths use a reversible graph-dir encoding.
- desktop app contains paths that join the raw graph name directly into a filesystem path.
- some Electron and CLI-adjacent helpers still use lossy `sanitize-db-name` behavior.
- shared graph discovery still contains legacy decoding logic for older naming conventions, but not the current reversible encoding.

This mismatch becomes visible when graph names contain special characters such as `/`, `:`, `%`, `~`, or spaces.

## Goals

- Use one shared graph-dir encoding/decoding contract across CLI and desktop app.
- Preserve current user-facing graph-name semantics.
- Keep `logseq_db_` prefix canonicalization separate from graph-dir encoding.
- Define compatibility behavior for legacy graph directory names.
- Add tests that cover special-character graph names across all affected entry points.

## Non-goals

- Redesign the user-visible graph naming model.
- Change the existing `logseq_db_` display normalization rules.
- Remove all legacy compatibility in one step without an explicit migration strategy.

## Current behavior

### Shared reversible encoding already exists

Authoritative implementation today:

- `src/main/frontend/worker_common/util.cljc`
  - `encode-graph-dir-name`
  - `decode-graph-dir-name`

Current behavior:

1. `encodeURIComponent` is applied.
2. literal `~` is rewritten to `%7E`.
3. `%` is rewritten to `~`.
4. decoding reverses `~ -> %` and then applies `decodeURIComponent`.

This gives a reversible filesystem-safe directory key without `/` or `\\` path separators.

### db-worker-node follows the shared contract

Relevant files:

- `src/main/frontend/worker/db_worker_node_lock.cljs`
- `src/main/frontend/worker/platform/node.cljs`
- `src/main/frontend/worker/db_worker_node.cljs`
- `src/main/frontend/worker/graph_dir.cljs`

Current behavior:

- repo identity strips one leading `logseq_db_` to produce a graph-dir key.
- graph-dir key is encoded with `encode-graph-dir-name`.
- list-graphs decodes on-disk directory names back to graph-dir keys.
- worker log paths and lock paths are stored under the encoded graph directory.

### CLI is partially aligned

Relevant files:

- `src/main/logseq/cli/server.cljs`
- `src/main/logseq/cli/command/core.cljs`
- `src/main/logseq/cli/command/graph.cljs`
- `src/main/logseq/cli/common.cljs`
- `deps/cli/src/logseq/cli/common/graph.cljs`
- `deps/cli/src/logseq/cli/util.cljs`

Current behavior:

- `cli.server` already uses the same canonical graph-dir path contract as `db-worker-node`.
- graph display/input normalization strips or restores one `logseq_db_` prefix as needed.
- `unlink-graph!` still derives directory names with `sanitize-db-name`, which is lossy.
- shared discovery in `deps/cli` still decodes only older directory naming patterns such as `++` and `+3A+`.

### Desktop app is not aligned

Relevant files:

- `src/electron/electron/utils.cljs`
- `src/electron/electron/db.cljs`
- `src/electron/electron/handler.cljs`
- `src/electron/electron/url.cljs`
- `src/main/frontend/config.cljs`

Current behavior:

- `electron.utils/get-graph-dir` joins the raw graph name into the graph path after db-prefix stripping.
- if the graph name contains `/`, the resulting path becomes nested directories.
- `electron.db` still uses `sanitize-db-name` in some db path creation logic.
- frontend local-dir helpers also treat graph name as a raw path segment.

## Problem statement

The same logical graph name can map to different on-disk paths depending on which subsystem touches it:

- reversible encoded path in `db-worker-node`
- raw path join in Electron/frontend
- lossy underscore replacement in sanitize-based helpers
- legacy decode-only behavior in shared graph discovery

As a result:

- a graph may be listable but not removable
- a graph may be resolvable in CLI but not in desktop app
- a graph name containing `/` may accidentally create path nesting in one flow but not another
- existing tests do not enforce cross-subsystem parity

## Proposed contract

### 1. Separate graph identity from graph directory representation

The plan would explicitly distinguish:

- **graph-name / repo**: user-facing identifier, subject to existing `logseq_db_` canonicalization rules
- **graph-dir key**: graph-name with exactly one leading db prefix stripped
- **encoded graph-dir**: on-disk directory name produced only by `encode-graph-dir-name`

This separation would make it clear that special-character handling belongs to the graph-dir layer, not the user-facing name layer.

### 2. Make the db-worker-node contract authoritative

The repository would standardize on:

- `repo -> graph-dir key`: strip one leading `logseq_db_`
- `graph-dir key -> encoded graph-dir`: `encode-graph-dir-name`
- `encoded graph-dir -> graph-dir key`: `decode-graph-dir-name`

Any code path that needs an on-disk db graph directory would route through this contract rather than reimplementing path logic.

### 3. Keep user-visible graph names unchanged

The plan would preserve current user-visible behavior:

- CLI graph names remain prefix-free for display and config storage where already intended.
- desktop app continues to display logical graph names, not encoded directory names.
- URL-level graph identification continues to resolve to logical graph names, not on-disk encoded names.

## Proposed code changes

### A. Consolidate path-authoritative helpers

Add or reuse one shared helper layer for:

- converting repo to graph-dir key
- converting graph-dir key to encoded graph directory
- converting repo directly to on-disk graph directory path

Target files likely involved:

- `src/main/frontend/worker/graph_dir.cljs`
- `src/main/frontend/worker/db_worker_node_lock.cljs`
- `src/electron/electron/utils.cljs`
- `src/main/frontend/config.cljs`
- `deps/cli/src/logseq/cli/util.cljs`

Expected outcome:

- no raw path join for logical graph names in path-authoritative code
- no duplicate graph-dir encoding implementations

### B. Align Electron graph-dir resolution

Replace raw graph path derivation in Electron with the shared encoded graph-dir contract.

Target files:

- `src/electron/electron/utils.cljs`
- `src/electron/electron/handler.cljs`
- `src/electron/electron/db.cljs`

Expected outcome:

- desktop app resolves the same on-disk graph dir as `db-worker-node`
- graph names containing `/`, `:`, `%`, `~`, or spaces behave predictably
- `sanitize-db-name` is no longer used for authoritative db graph-dir mapping

### C. Align CLI remove/unlink behavior

Update CLI removal/unlink flows to resolve graph directories via the same encoded contract used by list/start/lock behavior.

Target file:

- `src/main/logseq/cli/common.cljs`

Expected outcome:

- a graph that can be listed or switched to can also be removed through the same path mapping

### D. Align shared graph discovery

Update shared discovery helpers so current encoded graph dirs are decoded correctly, while preserving deliberate support for legacy names where needed.

Target file:

- `deps/cli/src/logseq/cli/common/graph.cljs`

Expected outcome:

- desktop/CLI discovery would recognize encoded graph dirs produced by current db-worker-node logic
- legacy decode branches would be explicitly documented as compatibility behavior

### E. Audit frontend local-dir helpers

Review helpers that expose graph-related directories to ensure they are either:

- display-only helpers, or
- path-authoritative helpers using the shared encoded contract

Target file:

- `src/main/frontend/config.cljs`

Expected outcome:

- no ambiguous helper remains that appears safe for filesystem use while still using raw graph names

## Compatibility and migration

This plan should explicitly decide how to handle already-existing graph directories created by older logic.

### Option 1: Read legacy names, write canonical encoded names

Behavior:

- discovery accepts legacy directory names and current encoded names
- all newly created or rewritten paths use the canonical encoded form
- optional one-time migration may rename legacy directories

Pros:

- safer rollout
- less risk of immediately losing access to existing graphs

Cons:

- mixed formats may coexist temporarily

### Option 2: Auto-migrate on access

Behavior:

- when a legacy graph directory is detected, code renames it to the canonical encoded path before continuing

Pros:

- converges quickly to one format

Cons:

- higher operational risk
- rename behavior must be designed carefully for active workers and lock files

### Option 3: Strict cutover

Behavior:

- only encoded graph dirs are supported after the change

Pros:

- simplest long-term contract

Cons:

- too risky without explicit migration tooling

### Recommended direction

Prefer **Option 1** for the first rollout:

- read compatibility for legacy directory names
- canonical writes to encoded graph dirs
- add explicit migration follow-up only after parity tests pass

## Test plan

### Unit tests

Extend or add tests for:

- `src/test/frontend/worker/worker_common_util_test.cljs`
- `src/test/frontend/worker/db_worker_node_lock_test.cljs`
- `src/test/logseq/cli/server_test.cljs`
- `src/test/logseq/cli/common/graph_test.cljs`
- Electron-specific tests if available for graph-dir resolution

### Special-character test matrix

All subsystems should use the same examples:

- `foo/bar`
- `a:b`
- `space name`
- `100% legit`
- `til~de`
- `mix/of:many %chars~here`

### Behavior to verify

1. encode/decode roundtrip is lossless
2. CLI list-graphs returns the same logical graph name that was encoded on disk
3. CLI switch/remove resolve the same graph directory
4. desktop app resolves the same graph directory as CLI/db-worker-node
5. graph names remain user-visible without encoded substitutions
6. legacy discovery behavior remains intentional and documented

### Missing coverage today

The repository currently appears to lack end-to-end parity tests for:

- CLI create/switch/remove with special-character graph names
- Electron graph-name -> graph-dir resolution with special characters
- desktop and CLI agreement on one on-disk graph directory for the same logical graph

## Rollout sequence

1. Make the shared graph-dir contract explicit in code and docs.
2. Update Electron path-authoritative helpers to use encoded graph dirs.
3. Update CLI unlink/remove behavior to use the same mapping.
4. Update shared graph discovery for encoded graph dirs and legacy compatibility.
5. Add parity tests across worker, CLI, and desktop-related helpers.
6. Evaluate whether legacy directory migration should be a separate follow-up.

## Risks

- Existing graphs may already exist under lossy or raw directory naming rules.
- Desktop-specific compatibility code may rely on current path layout assumptions.
- URL/deeplink flows may resolve graph identifiers separately from filesystem mapping and should not accidentally expose encoded names to users.
- Removing `sanitize-db-name` from authoritative paths may surface hidden assumptions in older db bootstrap code.

## Open questions

1. Should legacy raw/sanitized graph directories remain writable, or only readable?
2. Should migration happen automatically, manually, or in a later dedicated change?
3. Which helper should become the single exported entry point for graph-name -> on-disk graph-dir path resolution?
4. Should `docs/cli/logseq-cli.md` be updated in the same change to clarify that on-disk graph directories are encoded, not always literal graph names?

## Expected files to change in implementation

Likely implementation targets:

- `src/main/frontend/worker_common/util.cljc`
- `src/main/frontend/worker/graph_dir.cljs`
- `src/main/frontend/worker/db_worker_node_lock.cljs`
- `src/main/logseq/cli/server.cljs`
- `src/main/logseq/cli/common.cljs`
- `deps/cli/src/logseq/cli/common/graph.cljs`
- `deps/cli/src/logseq/cli/util.cljs`
- `src/electron/electron/utils.cljs`
- `src/electron/electron/db.cljs`
- `src/electron/electron/handler.cljs`
- `src/main/frontend/config.cljs`
- related tests under `src/test/`

## Acceptance criteria

This plan would be complete when:

- one shared graph-dir encoding contract is identified as authoritative
- all affected subsystems and files are enumerated
- compatibility strategy for legacy graph directories is documented
- a concrete test matrix for special-character graph names is defined
- the plan preserves current user-facing graph-name semantics while aligning on-disk graph-dir behavior
