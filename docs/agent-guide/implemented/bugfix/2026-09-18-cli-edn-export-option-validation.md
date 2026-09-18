# Validate CLI EDN Export Options

## Problem

[Issue #1213](https://github.com/logseq/db-test/issues/1213) reports that
`logseq graph export --edn-options` silently ignores misplaced and unknown
keys. A previously documented request such as
`{:export-type :graph-human :include-timestamps? true}` succeeds but omits
the requested node timestamps. The current supported shape nests the option
under `:graph-options`.

The reporter observed 0 of 22 exported pages with `:block/created-at` for
the flat shape and 18 of 22 for the nested shape on CLI build `6bf8fe7-dirty`.
An entirely unknown key also returned exit code zero. These are the reporter's
runtime results, not a reproduction performed while writing this document.
The source graph is not modified; the exported artifact omits requested data,
which can break consumers that use timestamps for identity matching.

Current source inspection confirms the relevant path:

- Before this fix, `cli/lib/graph.ml`, `validate_parsed`, checked only that
  EDN options were a map, without checking keys or applicability.
- `cli/lib/graph.ml`, `export_payload`: passes the map through, supplying
  `:export-type :graph` only when that field is absent.
- `src/main/frontend/worker/handler/export.cljs`, `:thread-api/export-edn`:
  passes options to `logseq.db.sqlite.export/build-export`.
- `deps/db/src/logseq/db/sqlite/export.cljs`, `build-export`: dispatches on
  `:export-type`; the `:graph-human` branch reads only `:graph-options` for
  graph content controls.
- The successful graph export build fixture previously included
  `{:export-type :graph :include-timestamps? true}` without verifying the
  timestamp behavior. It now uses the nested `:graph-human` shape.

## Decision

Retain the nested format, reject unknown or misplaced keys, and explain the
correct shape in the error. Include primitive type and required-field checks
at the CLI boundary; leave entity existence and Datascript lookup resolution
to the worker. The user confirmed this scope on 2026-09-18. Do not restore the
old flat-option forwarding behavior, infer a different export type, or add a
compatibility layer. Implemented at the CLI boundary, with command-construction regressions and
actual CLI E2E coverage.

### Validation boundary

Validate external EDN options in the OCaml CLI's command construction path,
through `Graph.validate_parsed`, before server setup, export RPCs, or output
file writes. Return the existing `invalid-options` error through the normal
CLI error rendering path and exit nonzero. An existing destination file must
remain byte-for-byte unchanged on validation failure.

Use explicit keyword allowlists and export-type applicability checks. Compare
actual EDN keywords, not just their names or string equivalents: a string key
such as `"include-timestamps?"` is not the keyword consumed by the worker.
Do not recursively validate exported graph data or arbitrary group labels as
option maps.

Keep the validator local to the CLI boundary. The shared exporter remains the
authority for export behavior; this change does not introduce a second worker
validation layer or alter Desktop export behavior. Public module signatures and dune files are unchanged.

### Allowed option keys

`:export-type` is optional and defaults to `:graph` only when absent. Its
explicit value must be one of the seven types below. Unknown types and
explicit `nil` are invalid.

| Export type | Additional top-level keys | Meaning |
| --- | --- | --- |
| `:graph` | `:graph-options` for the common validation control only | Machine-oriented datom export |
| `:graph-human` | `:graph-options` | Human-readable whole-graph export |
| `:graph-ontology` | `:graph-options` for the common validation control only | Custom property and class definitions |
| `:block` | `:block-id`, `:graph-options` for the common validation control only | One block and its necessary dependencies |
| `:page` | `:page-id`, `:graph-options` for the common validation control only | One page, its blocks, and necessary dependencies |
| `:selected-nodes` | `:node-ids`, `:graph-options` for the common validation control only | Selected nodes, including descendants of selected blocks |
| `:view-nodes` | `:rows`, `:group-by?`, `:graph-options` for the common validation control only | View result nodes, without automatic descendant expansion |

The common validation control is `:catch-validation-errors?`, read from
`:graph-options` by `build-export` outside the export-type dispatch. Keep it
recognized rather than accidentally classifying it as an unknown key. It
controls catching `ExceptionInfo` from final export validation; it must never
bypass CLI option validation. For datom exports, the basic validation currently
has no work to perform.

For `:graph-human`, also allow these four `:graph-options` keys:

| Key | Intended value | Behavior |
| --- | --- | --- |
| `:include-timestamps?` | Boolean | Include supported node and file-record timestamps |
| `:exclude-namespaces` | Set of parent namespace keywords or strings, e.g. `#{:schema}` | Exclude matching property/class definitions |
| `:exclude-built-in-pages?` | Boolean | Exclude built-in pages |
| `:exclude-files?` | Boolean | Exclude database file records |

All five graph option keys are invalid at the top level. Graph content controls
are invalid for other export types, even if their values are `false`: accepting
them would continue to suggest that ignored controls were applied. A supplied
`:graph-options` value must be a map; an empty map is valid. With no explicit
`:export-type`, graph content controls must fail and explain that they require
`:graph-human`.

Reject internal helper controls such as `:include-uuid?`, `:shallow-copy?`, and
`:include-children?` as public graph options. Some helper fields currently flow
through or are overwritten by the exporter; that does not constitute a coherent
CLI option contract.

### Error behavior

Errors should identify the full offending key path, describe its allowed
location or export type when known, and otherwise list the allowed keys for
that location. Render multiple invalid keys in a deterministic order. Do not
silently move keys or prefer the nested key when both flat and nested forms
are supplied.

Representative diagnostics, with exact punctuation left to implementation:

```text
Invalid --edn-options key :include-timestamps?. For :graph-human, use
{:export-type :graph-human :graph-options {:include-timestamps? true}}.

Unknown --edn-options key [:graph-options :no-such-option].
Allowed keys for :graph-human: :include-timestamps?, :exclude-namespaces,
:exclude-built-in-pages?, :exclude-files?, :catch-validation-errors?.

--edn-options [:graph-options :include-timestamps?] requires
:export-type :graph-human; the selected export type is :graph.
```

Keep help examples aligned with the nested contract and explain that unknown
or inapplicable keys fail. The independent `--type sqlite` rejection of
`--edn-options` remains in place.

### Value validation

Reject wrong primitive types and missing required selectors at the same
boundary: booleans must be EDN booleans,
`:exclude-namespaces` must have the documented set shape, and `:block`, `:page`,
`:selected-nodes`, and `:view-nodes` must supply their corresponding selectors.
Preserve valid entity IDs and lookup refs, plus bare UUIDs specifically where
the current view export accepts them. Do not resolve entity existence locally
or duplicate Datascript lookup semantics. Do not add new defaults to conceal
malformed values.

Check required fields by presence and expected shape, not truthiness. Explicit
`nil` is invalid for required selectors and supplied boolean options; `false`
is a valid boolean. Empty node collections remain valid empty selections.
Diagnostics for wrong types and missing fields must identify the option path
and expected type or required selector for the chosen export type.

### Implementation owners

- `cli/lib/graph.ml`: keyword-only allowlists, export-type applicability,
  required selectors, primitive types, collection envelopes, and deterministic
  diagnostics, called from `Graph.validate_parsed`.
- `cli/lib/command_registry.ml`: help explains nesting and rejection policy;
  the existing nested example in graph metadata remains correct.
- `cli/test/cli_parity_test_cases.ml`: command construction, valid partial
  exports, false/empty values, arbitrary grouped labels, diagnostics, output
  modes, file preservation, and zero worker RPCs for invalid options.
- `cli-e2e/spec/non_sync_cases.edn`: parsed timestamp comparisons against stored
  values, partial exports using IDs/lookup refs/view UUIDs, and rejected
  requests against both existing and absent destination files.

## Alternatives considered

### Restore flat-option forwarding

Rejected: it contradicts the selected nested contract and repository policy
against compatibility layers. It also does not solve unknown-key typos.

### Warn and continue exporting

Rejected: scripts still receive successful results that omit requested data,
and warnings can be missed.

### Validate only globally unknown top-level keys

Rejected: unknown nested keys and known keys supplied for the wrong export
type remain silently ignored.

### Validate only inside the shared worker exporter

Not selected for this fix: CLI input can be rejected before contacting the
worker, and changing the shared boundary would broaden the behavior change to
other callers. Shared validation can be considered separately if needed.

## Consequences

### Resulting behavior

- Flat, unknown, misplaced, and inapplicable options fail with `invalid-options`
  before worker setup, RPCs, or export file writes. Both flat and nested forms
  together also fail.
- Supplied options are checked by actual EDN type. Explicit `nil`, non-keyword
  keys, non-map graph options, malformed collections, missing selectors, and
  invalid booleans fail with option paths and corrective guidance.
- Omitted `:export-type` still means `:graph`. The shared validation control is
  accepted across all seven export types and cannot bypass CLI validation.
- Valid nested human graph exports include the stored page and block timestamps.
  Default graph, ontology, and partial exports retain their behavior. Entity
  resolution remains in the worker, and arbitrary group labels/lookup values
  are not recursively treated as option maps.
- Human, JSON, and EDN output modes retain their normal error conventions.
  Rejected requests neither create a destination nor overwrite an existing one.
- No compatibility conversion, migration, worker validation layer, Desktop
  behavior change, public module signature change, or dune change was added.

### Validation

Runtime verification used the CLI and `db-worker-node` because the issue spans
command construction, worker export behavior, and output file writes. The
same disposable graph `edn-validation`, root directory, JSON output mode, and
export file paths were reused before and after the fix.

Before implementation:

- Flat `{:export-type :graph-human :include-timestamps? true}` returned exit 0,
  but parsed `TimestampPage` and `TimestampBlock` exports omitted timestamps.
- The nested request returned exit 0 and included both stored timestamps on
  those exact entities. The page values were `1789698137803`, and the block
  values were `1789698137925` for both created-at and updated-at.
- An unknown nested option also returned exit 0.
- The first regression run had 92 expected failures and 19 passing valid cases.
  A separate zero-RPC regression observed one RPC before the fix. The invalid
  option E2E failed because the CLI overwrote the existing export and succeeded.

After implementation:

- The same flat and unknown requests return exit 1 and `invalid-options`.
  The flat error shows the correct nested example. The pre-existing flat export
  is byte-for-byte unchanged; SHA-256 remained
  `03105ceb171897ba5f8ee3f1c301abb711db80cf7fed372746286ec474dd90f4`.
- The same nested request returns exit 0. Parsed page/block created-at and
  updated-at values equal the stored values above. Worker logs show normal
  initialization/readiness, without export errors; the graph also survives
  the worker restart during rebuild verification.
- `opam exec -- dune build @all` and `opam exec -- dune runtest` pass in `cli/`:
  387 tests, zero failures.
- All three new E2E cases pass with the rebuilt CLI and worker, including
  human/JSON/EDN errors, file preservation, timestamps, partial exports,
  default graph, ontology, and arbitrary grouped view labels.
- The rebuilt worker passes all 25 graph-tagged E2E cases. The broader
  non-sync run initially recorded 84 passes and 17 failures with the stale
  worker artifact; rebuilding `db-worker-node` and rerunning each of those
  17 failed cases passes, including the agent bridge workflow. No unrelated
  source changes were needed to resolve those failures.
- `ocamlformat --check` passes for the changed OCaml files. Changed-file i18n
  lint reports no hardcoded UI strings. The changed-file clj-kondo task has no
  Clojure source files to lint; the E2E runner successfully reads the changed EDN.
- `git diff --check` and `spec-dev-tool check --all` pass.

### Constraints

Scripts using flat keys or undocumented internal helper options now fail
instead of silently exporting incomplete data. The CLI contract must stay
aligned with `logseq.db.sqlite.export/build-export` when public export options
change. Timestamp verification must continue targeting known entities with
stored values, since not every page has timestamps and property history has
independent timestamp behavior.
