# 059 — Add doctor warning for server and CLI revision mismatch

## Summary

This plan adds a new `doctor` warning when a discovered db-worker server revision does not match the local `logseq-cli` revision.

The warning must be actionable: for each mismatched server, `doctor` should tell the user to run:

- `logseq server restart --graph <name>`

This closes the current observability gap where `server list` already exposes revision mismatch, but `doctor` does not.

---

## Product decisions (locked)

1. **Mismatch rule is exact string compare**.
   - `cli-revision != server-revision` means mismatch.
   - No normalization, no hash shortening, no suffix stripping.

2. **Severity is warning, not error**.
   - Revision drift is diagnosable and recoverable.
   - `doctor` should still return `:status :ok` at top-level transport with `:data {:status :warning ...}` behavior, consistent with existing warning checks.

3. **`doctor` remains fail-fast for hard preconditions**.
   - If script check fails, stop immediately (current behavior).
   - If data-dir check fails, stop immediately (current behavior).
   - Revision mismatch check runs only when server checks are reached.

4. **Restart guidance is per affected graph/server**.
   - The warning includes one restart command per mismatched graph.
   - Command form is `logseq server restart --graph <name>`.

5. **Structured output must remain machine-friendly**.
   - JSON/EDN outputs include structured mismatch check data.
   - Human output includes readable warning text and restart guidance.

---

## Background

Current implementation already has the needed revision primitives:

- CLI revision source: `logseq.cli.version/revision`.
- Server revision source: `db-worker.lock` revision surfaced by `logseq.cli.server/list-servers`.
- `server list` already computes and warns on mismatch in human output.

Current `doctor` checks:

1. `db-worker-script`
2. `data-dir`
3. `running-servers` readiness

`doctor` does **not** currently compare server revision against CLI revision.

---

## Goals

- Add revision mismatch detection to `doctor` using existing revision sources.
- Provide actionable restart guidance for each mismatched graph.
- Keep mismatch semantics identical to existing `server list` behavior.
- Preserve existing `doctor` fail-fast behavior for script/data-dir errors.

## Non-goals

- No automatic server restart.
- No change to daemon ownership/permission rules.
- No new db-worker RPC endpoint for version info.
- No hard failure on mismatch.

---

## User-facing behavior

### Human output

When mismatches exist, `doctor` includes a warning check (example shape):

- `[warning] server-revision-mismatch - 2 servers use a different revision than this CLI`
- Followed by actionable per-graph commands, e.g.:
  - `Run: logseq server restart --graph graph-a`
  - `Run: logseq server restart --graph graph-b`

If graph names include spaces, command examples should quote names in guidance output.

### JSON and EDN output

`doctor --output json|edn` keeps structured check payload, including mismatch details.

Suggested check payload shape:

- `:id :server-revision-mismatch`
- `:status :warning | :ok`
- `:code :doctor-server-revision-mismatch` (when warning)
- `:cli-revision <string>`
- `:servers [{:repo <repo> :revision <server-revision> :graph <graph-name>}]`
- `:message <human summary>`

---

## Design

### 1) Reuse one mismatch computation path

Today, mismatch computation is a private helper in `logseq.cli.command.server`.

Plan:

- Move or extract mismatch computation into a shared helper (recommended in `logseq.cli.server`), so both `server list` and `doctor` use exactly the same comparison logic.
- Keep return shape stable enough to support both command paths.

This prevents semantic drift between `server list` and `doctor`.

### 2) Add a dedicated doctor check

Add a new check in `logseq.cli.command.doctor`:

- `check-server-revision-mismatch`

Input:

- local CLI revision (`logseq.cli.version/revision`)
- discovered servers from `list-servers`

Behavior:

- No mismatches -> check status `:ok`
- Any mismatch -> check status `:warning`, include mismatch metadata and restart guidance

### 3) Execution flow in doctor

Keep current order and fail-fast semantics for hard errors:

1. `check-db-worker-script` (error stops execution)
2. `check-data-dir` (error stops execution)
3. `check-running-servers`
4. `check-server-revision-mismatch` (new)

Final `doctor` status is:

- `:ok` when all checks are `:ok`
- `:warning` when any warning check exists (`running-servers` and/or `server-revision-mismatch`)
- `:error` only for hard failures as today

### 4) Restart guidance formatting strategy

Two viable options:

- **Option A (minimal formatter change):** put guidance directly into mismatch check `:message`.
- **Option B (cleaner long-term):** add a small `format-doctor` branch for `:server-revision-mismatch` to render command lines from structured fields.

Recommended: **Option B** if it stays small, because it preserves clean machine payload while improving human readability and escaping/quoting behavior.

### 5) Graph naming for restart commands

Restart command uses `--graph`, not repo id.

Plan:

- Derive graph name via existing repo/graph conversion helper before rendering command guidance.
- Ensure guidance is aligned with user-facing graph names shown in CLI output.

---

## Implementation plan (task list)

1. Extract revision mismatch helper from `command/server.cljs` into shared location.
2. Update `server list` command to call the shared helper (behavior unchanged).
3. Add `check-server-revision-mismatch` to `command/doctor.cljs`.
4. Extend `execute-doctor` to append the new check and compute combined warning status.
5. Add per-graph restart guidance to human doctor output.
6. Keep JSON/EDN payload structured and stable.
7. Update CLI docs for `doctor` warning behavior and remediation command.

---

## Testing plan

### Unit tests

- `src/test/logseq/cli/command/doctor_test.cljs`
  - Adds warning check when one or more servers have mismatched revisions.
  - Includes restart command guidance for each mismatched graph.
  - Treats missing server revision as mismatch (exact compare behavior).
  - Keeps existing fail-fast behavior for script/data-dir errors.

- `src/test/logseq/cli/command/server_test.cljs`
  - Verifies `server list` still uses exact-string mismatch semantics after helper extraction.
  - Confirms human mismatch metadata remains attached when expected.

- `src/test/logseq/cli/format_test.cljs`
  - Human `doctor` output includes mismatch warning and restart guidance.
  - JSON/EDN doctor outputs include structured mismatch fields.

### Regression checks

- Existing `running-servers` warning behavior is preserved.
- Existing `server list` mismatch warning behavior is preserved.
- `doctor` top-level status semantics remain unchanged (`ok|warning|error` through current response model).

---

## Risks and mitigations

- **Risk:** Duplicate warning noise (`running-servers` + mismatch) in one doctor run.
  - **Mitigation:** Keep distinct check IDs/messages so users can tell readiness vs revision drift.

- **Risk:** Restart command may fail with owner restrictions.
  - **Mitigation:** Keep guidance explicit but non-blocking; existing error hint `server-owned-by-other` remains the fallback behavior.

- **Risk:** Missing revision in legacy lock files increases warning count.
  - **Mitigation:** Treat as mismatch by design; message should clearly indicate missing server revision value.

---

## Acceptance criteria

- `logseq doctor` emits a warning check when any discovered server revision differs from local CLI revision.
- Warning includes actionable restart guidance: `logseq server restart --graph <name>` for each mismatched graph.
- No mismatch warning when all discovered server revisions exactly equal CLI revision.
- `server list` mismatch behavior remains consistent with `doctor` (shared comparison semantics).
- `doctor --output json|edn` includes structured mismatch check data.

---

## File scope (expected)

- `src/main/logseq/cli/command/doctor.cljs`
- `src/main/logseq/cli/command/server.cljs`
- `src/main/logseq/cli/server.cljs`
- `src/main/logseq/cli/format.cljs` (if dedicated doctor warning rendering is added)
- `src/test/logseq/cli/command/doctor_test.cljs`
- `src/test/logseq/cli/command/server_test.cljs`
- `src/test/logseq/cli/format_test.cljs`
- `docs/cli/logseq-cli.md`
- `docs/agent-guide/059-cli-doctor-server-revision-mismatch-warning.md`
