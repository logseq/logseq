# Unify CLI Graph Directory Discovery

## Problem

`cli/lib/server_runtime.ml` and `cli/lib/graph.ml` independently scanned and
classified graph directories. `Graph` constructed EDN maps and reparsed them
to obtain canonical graph names. Their policies disagreed on encoded spaces,
lowercase escapes, `logseq_db_` names containing legacy markers, and mixed
percent/tilde encodings.

After reviewing these differences and the standard encoding rules, the user
requested uniform use of standard encoding and decoding. This replaced the
initial exploration's requirement to preserve legacy diagnostic entries.

## Decision

`Server_runtime.list_graph_items` is the sole production source for CLI graph
directory discovery. It accepts standard names through
`Graph_dir.canonical_graph_name_of_dir`, which requires decoding followed by
encoding to reproduce the exact directory name. The encoder is unchanged:
`encodeURIComponent`, restore `%20` to spaces, escape literal `~` as `%7E`,
and replace `%` with `~`.

The CLI legacy decoder and classification branches are removed. Nonstandard
names are ignored, including `++`, `+3A+`, percent encodings, lowercase
escapes, encoded spaces, malformed escapes, and mixed encodings. Existing
reserved-directory and `logseq_db_` exclusions remain. No stored directory is
renamed, removed, or migrated by discovery.

`Graph` now serializes typed canonical records from `Server_runtime`. Its
local filters, decoders, classifier, filesystem scan, sorting, and EDN reparse
are removed. The canonical `:graph-items` maps retain exactly `:kind`,
`:graph-name`, and `:graph-dir`. `:graphs` is derived directly from the typed
records. Both vectors retain directory-name ordering, and missing or empty
graph roots still produce empty vectors.

`Server_runtime.list_graphs`, used by CLI graph-existence validation, projects
names from the same canonical records. No fallback or compatibility path is
introduced.

`Graph_types`, `cli/spec/`, dune files, public CLI options, and the discovery
function signatures remain unchanged. The existing interface record retains
its fields, but discovery only produces canonical records. Shared Desktop
and worker codecs are outside this CLI refactoring scope.

## Alternatives considered

### Rejected approaches

- Retaining legacy diagnostics would preserve a second decoding policy and
  conflict with the user's standard-only instruction.
- Moving discovery into `Graph` would invert its existing dependency on the
  runtime owner. Extracting another module would add unnecessary surface.
- Keeping both implementations with parity tests would retain duplicated
  scanning, classification, and EDN reparsing.

## Consequences

### Behavior

JSON and EDN `:graph-items` no longer contain legacy or legacy-undecodable
entries. Standard graph names retain their output fields, values, omission
rules, and ordering. Human output and the canonical `:graphs` projection
retain their behavior. Graph-existence checks continue to use canonical names.

Discovery remains a synchronous filesystem scan and retains filesystem error
behavior. Nonstandard directories remain on disk but are not discovered.

### Verification

- A failing command-path test first confirmed that the old implementation
  emitted legacy entries in JSON. It passes after unification.
- Business tests execute the actual CLI in human, JSON, and EDN modes with
  standard space, slash, colon, plus, percent, tilde, and Unicode names.
  They cover reserved names, non-directories, all previously divergent
  encodings, ordering, missing/empty roots, and runtime graph-name discovery.
- The former legacy-only runtime test is replaced by the command-path fixture;
  the formatter fixture now focuses on the current-graph marker and count.
- `pnpm --dir cli test`: 236 tests passed.
- `pnpm cli:release`: rebuilt and staged the CLI. Existing worker artifacts
  were reused because this change only affects OCaml CLI code.
- `bb -f cli-e2e/bb.edn test --skip-build --case <id>` passed for
  `verbose-graph-list-json`, `graph-list-human`, `graph-list-edn`, and
  `graph-remove-json` after rebuilding the CLI.
- `opam exec -- dune build @all` from `cli/`: passed without OCaml warnings.
- OCaml formatting checks, `bb lint:large-vars`, `git diff --check`, and
  `spec-dev-tool check --all` passed.
- Source inspection confirms one CLI graph discovery implementation, no
  remaining CLI legacy decoder, and no changes to interfaces or dune files.
