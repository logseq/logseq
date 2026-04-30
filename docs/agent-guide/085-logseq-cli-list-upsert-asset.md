# Logseq CLI `list asset` and `upsert asset` Plan

Goal: add first-class asset commands to `logseq-cli` with current architecture constraints:

1. Avoid introducing a new db-worker `thread-api` unless absolutely necessary.
2. Add `list asset` to list asset nodes.
3. Add `upsert asset` to create/update asset nodes, including create-time `--path <asset-file-path>` and shared `--content` behavior.
4. Use the product definition of asset as **a node tagged with `#Asset`** (`:logseq.class/Asset`).

Architecture direction: keep the existing `CLI -> command parse/build -> transport/invoke -> db-worker-node` pipeline, and reuse existing `list node` and `upsert block` flows as much as possible.

Related files:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/editor.cljs`
- `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db/frontend/class.cljs`
- `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db/frontend/asset.cljs`
- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`

---

## Current baseline (from codebase)

### 1) Listing path is already sufficient for asset filtering

- `list node` already resolves tag/property selectors and invokes `:thread-api/cli-list-nodes`.
- db-worker already supports node filtering by tag IDs via `logseq.cli.common.db-worker/list-nodes`.
- `:thread-api/cli-list-nodes` already exists in `frontend.worker.db_core`.

Implication: `list asset` can be implemented as a thin wrapper over existing `list node` behavior by injecting the fixed `:logseq.class/Asset` selector. No new thread API required.

### 2) Upsert path already has reusable create/update building blocks

- `upsert block` already supports create/update mode split, target placement options, and `--content` semantics.
- Existing helpers already resolve IDs/UUIDs, run outliner ops, and handle error normalization.

Implication: `upsert asset` should reuse upsert/add internals, while adding asset-specific validation and metadata/file handling.

### 3) Desktop/web app asset behavior to align with

- `:logseq.class/Asset` exists as built-in class (`deps/db/.../class.cljs`).
- Desktop creation (`new-asset-block`) sets:
  - `:block/tags #{(:db/id (db/entity :logseq.class/Asset))}`
  - `:logseq.property.asset/type`
  - `:logseq.property.asset/size`
  - `:logseq.property.asset/checksum`
  - optional title override
- Asset type/title helpers exist in `logseq.db.frontend.asset` (`asset-path->type`, `asset-name->title`).

Implication: CLI create flow should follow the same shape for metadata/tagging and content/title semantics.

---

## Proposed command contracts

## `list asset`

### Syntax

```text
logseq list asset --graph <name> [options]
```

### Semantics

- Returns nodes tagged with `#Asset` (`:logseq.class/Asset`).
- Uses existing list-node backend filtering path.

### Options (aligned with current list family)

- `--fields <csv>`
- `--limit <n>`
- `--offset <n>`
- `--sort <field>` (default `updated-at`)
- `--order asc|desc`
- `--expand`

### Initial field map

Keep MVP aligned with `list node`:

- `id` -> `:db/id`
- `title` -> `:block/title`
- `type` -> `:node/type`
- `page-id` -> `:block/page-id`
- `page-title` -> `:block/page-title`
- `created-at` -> `:block/created-at`
- `updated-at` -> `:block/updated-at`

---

## `upsert asset`

### Syntax

Create mode:

```text
logseq upsert asset --graph <name> --path <asset-file-path> [--content <text>] [--target-page <name>|--target-id <id>|--target-uuid <uuid>] [--pos first-child|last-child|sibling]
```

Update mode:

```text
logseq upsert asset --graph <name> (--id <id>|--uuid <uuid>) [--content <text>]
```

### Mode rules

- `--id` or `--uuid` => update mode.
- otherwise => create mode.

### Required/allowed options

- `--path` is supported in create mode and required for create mode MVP.
- `--content` is supported in both create and update modes.
- In create mode, target options and `--pos` follow existing upsert block behavior.
- In update mode, `--path`, target options, and `--pos` are invalid.

### Asset definition and validation

- Asset identity is tag-based: node must include `#Asset` (`:logseq.class/Asset`).
- Update mode must verify target node is asset-tagged; otherwise return typed mismatch error.

### Create-time metadata behavior

Given `--path`:

- derive `asset-type` from extension (same as `asset-path->type`)
- read file size from filesystem
- compute SHA-256 checksum
- ensure created node has `#Asset` tag and metadata:
  - `:logseq.property.asset/type`
  - `:logseq.property.asset/size`
  - `:logseq.property.asset/checksum`
- copy file into graph assets directory as `<block-uuid>.<asset-type>`

### `--content` behavior

- create mode: sets block title (same semantics as regular block upsert content)
- update mode: rewrites block title
- if create mode omits `--content`, default title comes from file basename (without extension), matching desktop behavior

---

## Key design decisions

1. **No new thread-api in MVP**
   - `list asset` uses current `:thread-api/cli-list-nodes`.
   - `upsert asset` uses current pull/apply-outliner APIs and CLI-side filesystem handling.

2. **Thin list command implementation**
   - Implement `list asset` by reusing list-node execution with fixed asset tag selector.

3. **CLI-side file copy for `--path`**
   - Use existing Node runtime capabilities in CLI layer (`fs`, `path`, `crypto`) and existing repo/data-dir helpers.
   - Avoid adding db-worker API solely for file copy.

4. **Asset identity remains tag-first**
   - `#Asset` is the canonical selector for list/upsert identity checks.

---

## Implementation plan (phased)

### Phase 1: parser and contract tests (RED)

1. Add parser tests for `list asset` command recognition and options.
2. Add parser tests for `upsert asset` create/update forms.
3. Add validation tests:
   - create mode requires `--path`
   - update mode rejects `--path`
   - update mode allows `--content`
   - create/update mutual exclusion errors are clear.
4. Add help/summary tests to ensure `list asset` and `upsert asset` appear consistently.

Primary file:
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`

### Phase 2: implement `list asset`

1. Add `list-asset` command spec and entry in `command/list.cljs`.
2. Reuse list-node field map/options and execute path with fixed asset tag selector.
3. Wire `:list-asset` in `commands.cljs` validation/build/execute branches.
4. Add formatter branch in `format.cljs`, reusing node table layout.

Primary files:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`

### Phase 3: implement `upsert asset`

1. Add `upsert-asset` option spec + command entry in `command/upsert.cljs`.
2. Implement build logic:
   - mode detection by id/uuid
   - create-mode path validation
   - update-mode selector validation
3. Implement execute logic:
   - create mode:
     - prepare metadata from `--path`
     - create block (reusing add/upsert block path)
     - ensure `#Asset` tag + required asset properties
     - copy file into graph `assets/`
   - update mode:
     - resolve node by id/uuid
     - enforce asset tag membership
     - apply content update when provided
4. Keep all DB writes via existing thread-api calls.

Primary files:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`

### Phase 4: tests and docs/e2e

1. Add/extend unit tests for upsert asset builder/executor behavior.
2. Add format tests for list/upsert asset human output.
3. Update CLI docs and command reference.
4. Update CLI e2e inventory and add non-sync cases:
   - `upsert asset --path ...` create
   - `upsert asset --id|--uuid --content ...` update
   - `list asset` returns asset nodes

Primary files:
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/upsert_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`

---

## Verification plan

Focused tests:

```bash
bb dev:test -v logseq.cli.commands-test
bb dev:test -v logseq.cli.command.upsert-test
bb dev:test -v logseq.cli.format-test
```

CLI e2e:

```bash
bb -f cli-e2e/bb.edn test --skip-build
```

Full regression:

```bash
bb dev:lint-and-test
```

---

## Acceptance criteria

1. `logseq list asset` is available and lists nodes tagged `#Asset`.
2. `list asset` supports list-family options consistent with current commands.
3. `logseq upsert asset` exists with create/update modes.
4. `upsert asset` create mode supports `--path <asset-file-path>`.
5. `--content` works in both create and update modes.
6. Update mode enforces that target node is an asset (`#Asset`).
7. MVP introduces no new db-worker thread-api unless a hard blocker is discovered.
8. Unit tests + CLI e2e coverage are updated and passing.

---

## Risks and mitigations

- **Risk:** create flow can leave DB/file inconsistencies on partial failure.
  - **Mitigation:** implement best-effort rollback/cleanup order and test failure paths.

- **Risk:** internal asset properties are not public and bypassing generic property parsers may be required.
  - **Mitigation:** use dedicated asset metadata writing path with explicit property identifiers, not generic user property input.

- **Risk:** ambiguity around whether create mode should allow asset node creation without `--path`.
  - **Mitigation:** lock MVP contract to require `--path` in create mode; broaden later only if product needs it.

---

No blocking open question for MVP.