# 086 — Introduce `org.clj-commons/humanize` for logseq-cli human output

## Goal

Adopt `org.clj-commons/humanize` in `logseq-cli` to improve readability and consistency of **human-mode** output while keeping `json` and `edn` output stable.

This plan is based on the current implementation of:

- CLI output layer: `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`
- CLI command message producers: `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/*.cljs`
- db-worker-node sync progress producers used by CLI: `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/download.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/upload.cljs`

---

## Scope and constraints

### In scope

1. Add `org.clj-commons/humanize` dependency for CLI/runtime code paths.
2. Replace ad-hoc human text formatting in CLI human output with library-backed helpers where it improves readability.
3. Audit all practical human-output points that can benefit from this library and prioritize them.
4. Keep output changes focused on `--output human` behavior.

### Out of scope

1. Changing `json` or `edn` payload schemas.
2. Any `db-worker-node` code change (including sync progress message producers and thread-api payload changes).
3. Rewriting CLI table layout/alignment logic (`string-width`, truncation, padding).
4. Internationalization (the library is English-first and current CLI output is also English).

### Locked decisions

1. Keep relative time in short style (compatible with current `10s ago` / `1m ago` style).
2. `list asset` `SIZE` displays human-readable size only (no extra raw-byte suffix).
3. Apply grouped-number formatting consistently for `Count:` values.
4. Formatter-only scope: do not modify any `db-worker-node` code.

---

## Why `org.clj-commons/humanize`

Useful functions for current CLI needs:

- `clj-commons.humanize/intcomma` for grouped numbers (`12,345`).
- `clj-commons.humanize/filesize` for byte formatting (`2.0KiB`, `3.0MB`).
- `clj-commons.humanize/relative-datetime` for relative time strings.
- `clj-commons.humanize.inflect/pluralize-noun` for singular/plural grammar.
- `clj-commons.humanize/oxford` for readable list joining in error/help text.

---

## Current baseline and optimization inventory

## A) Central formatter (`format.cljs`) — highest impact

| Area | Current behavior | Candidate improvement with `humanize` | Priority |
|---|---|---|---|
| `human-ago` for `UPDATED-AT`/`CREATED-AT` columns and graph metadata | Custom `s/m/h/d/mo/y ago` calculation with fixed month/year heuristics | Replace with `relative-datetime` brief mode via a wrapper to keep compact style | P0 |
| `format-counted-table` (`Count: N`) used by list/search/query/server/graph tables | Raw integer | Use `intcomma` consistently for all `Count:` values | P0 |
| `list asset` `SIZE` column | Raw bytes integer | Show human-readable size only (`filesize`, e.g. `2.0KiB`) | P0 |
| `format-sync-status` pending counters and tx values | Raw numbers | `intcomma` for counters/tx ids | P1 |
| `format-server-cleanup` summary counters | Raw numbers | `intcomma` + optional noun pluralization cleanup | P1 |
| `format-upsert-block` change counts and `format-remove-block` multi-id count | Raw counts | `intcomma` for counts | P1 |
| Graph-list legacy warning line (`Warning: N legacy graph directories detected.`) | Raw count with hardcoded noun | `intcomma` + `pluralize-noun` | P1 |

## B) Command-level message producers (`command/*.cljs`)

| File | Current behavior | Candidate improvement | Priority |
|---|---|---|---|
| `command/doctor.cljs` (`check-running-servers`, `check-server-revision-mismatch`) | Manual pluralization (`server`/`servers`, `uses`/`use`) | Use `pluralize-noun` (and centralized verb helper if needed) | P0 |
| `command/graph.cljs` (`format-validation-errors`) | Manual `entity/entities` + raw count | `intcomma` + `pluralize-noun` | P0 |
| `command/example.cljs` (`Found N examples ...`) | Raw count | `intcomma` + `pluralize-noun` | P1 |
| `command/show.cljs` (`Linked References (N)`, `Referenced Entities (N)`) | Raw count | `intcomma` for large refs count | P1 |
| `command/sync.cljs` (`missing required sync config ...`) | Comma-joined key list | Optionally use `oxford` for clearer list text | P2 |

## C) Audited but excluded by current scope decision

| File | Current behavior | Candidate improvement | Decision |
|---|---|---|---|
| `frontend/worker/sync/download.cljs` (`Importing data X/Y`) | Raw counters in message string | Could use `intcomma` for `X` and `Y` | Excluded (no db-worker changes) |
| `frontend/worker/sync/upload.cljs` (`Uploading X/Y`) | Raw counters in message string | Could use `intcomma` for `X` and `Y` | Excluded (no db-worker changes) |

## D) Candidate but likely keep as-is for now

| File | Current behavior | Decision |
|---|---|---|
| `src/main/logseq/cli/profile.cljs` | Technical `Nms` tree output for profiling | Keep as technical output; do not humanize in phase 1 |

---

## Proposed design

### 1) Add a CLI-local adapter namespace

Create a small wrapper namespace (e.g. `src/main/logseq/cli/humanize.cljs`) that centralizes:

- `format-count` (uses `intcomma`)
- `pluralize` (uses `pluralize-noun`)
- `format-filesize` (uses `filesize`, configurable binary/decimal)
- `relative-ago` (uses `relative-datetime` with fixed CLI options)
- Optional list helper (`oxford`)

This avoids scattering direct library calls and keeps style decisions local to CLI.

### 2) Preserve machine-output invariants

All changes must keep:

- `format-result` behavior for `:json` and `:edn`
- existing keys in command `:data` and `:error`
- transport payload compatibility

### 3) Strict boundary: CLI formatter only

- Do not modify any `db-worker-node` files.
- Do not change sync event payload structure.
- Limit all behavior changes to CLI human-output formatting paths.

---

## Implementation plan

### Phase 1 — dependency + adapter (foundation)

1. Add dependency in root project deps for CLI compile/runtime usage:
   - `/Users/rcmerci/gh-repos/logseq/deps.edn`
2. Add wrapper namespace:
   - `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/humanize.cljs`
3. Add unit tests for wrapper behavior (counts, pluralization, relative time, filesize).

### Phase 2 — migrate high-impact formatter paths

1. Replace `human-ago` implementation in `format.cljs` with wrapper call.
2. Update `format-counted-table` count rendering with grouped numbers.
3. Update list-asset size rendering to human-readable filesize.
4. Update graph-list/server-cleanup/sync-status numeric display paths.

Primary file:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`

### Phase 3 — migrate command message producers

1. `command/doctor.cljs`: pluralization cleanup.
2. `command/graph.cljs`: validation summary noun/count formatting.
3. `command/example.cljs`: example count formatting.
4. `command/show.cljs`: referenced count formatting.

Primary files:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/doctor.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/example.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`

### Phase 4 — tests and docs

1. Update/extend formatter tests for expected human-output changes:
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`
2. Update command tests where message text is asserted:
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/doctor_test.cljs`
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs`
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs`
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/example_test.cljs`
3. Update CLI documentation examples if human-mode samples are shown:
   - `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`

---

## Verification plan

Run targeted tests first:

```bash
bb dev:test -v logseq.cli.format-test
bb dev:test -v logseq.cli.command.doctor-test
bb dev:test -v logseq.cli.command.graph-test
bb dev:test -v logseq.cli.command.show-test
bb dev:test -v logseq.cli.command.example-test
```

Then broader checks:

```bash
bb dev:lint-and-test
bb -f cli-e2e/bb.edn test --skip-build
```

---

## Acceptance criteria

1. `org.clj-commons/humanize` is integrated and used by CLI human-output formatting paths.
2. High-impact areas (relative time, `Count:` rendering with grouped numbers, asset filesize, pluralization in doctor/graph) are migrated.
3. Relative time remains in compact short style compatible with current CLI behavior.
4. `json` and `edn` outputs remain schema-compatible.
5. No `db-worker-node` code changes are introduced.
6. Existing CLI tests are updated and passing.

---

## Risks and mitigations

- **Risk: output churn breaks exact-string tests.**
  - Mitigation: migrate in phases and update tests in the same commit; avoid changing machine outputs.

- **Risk: bundle-size increase from adding library + transitive time utilities.**
  - Mitigation: route usage through wrapper, prefer only needed functions, and measure `static/logseq-cli.js` size delta.

- **Risk: semantic drift in relative-time wording.**
  - Mitigation: pin wrapper options to compact short style and keep compatibility snapshots in `format_test.cljs`.
