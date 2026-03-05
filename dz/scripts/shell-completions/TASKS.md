# Shell Completions — TDD Implementation Tasks

Implementation plan for the `logseq completions <shell>` feature as specified
in [DESIGN.md](DESIGN.md). Each task follows **Red → Green → Refactor**: write
a failing test first, then make it pass, then clean up.

Test file: `src/test/logseq/cli/command/completions_test.cljs`
Generator test: `src/test/logseq/cli/completion_generator_test.cljs`

> **Require registration:** The nbb test runner auto-discovers `*_test.cljs`
> files under the `test` classpath (`-cp test`). No explicit require is needed
> in a runner config — but the new test namespace **must** be required in the
> test entry if one exists, or verified to be picked up by convention.

---

## Phase 0 — Scaffolding & test harness

- [ ] **0.1** Create `src/test/logseq/cli/completion_generator_test.cljs` with
      a skeleton ns that requires `[cljs.test :refer [deftest is testing]]` and
      `[logseq.cli.completion-generator :as gen]`. Add a trivial failing test
      (`(deftest placeholder (is false))`).

- [ ] **0.2** Create `src/main/logseq/cli/completion_generator.cljs` with a
      stub namespace and a `generate-completions` function that returns `""`.
      Confirm the test runner loads both files (`yarn nbb-logseq -cp test -m
      nextjournal.test-runner`).

- [ ] **0.3** Create `src/test/logseq/cli/command/completions_test.cljs` with a
      skeleton ns requiring `[logseq.cli.command.completions :as completions-command]`.
      Add a trivial failing test.

- [ ] **0.4** Create `src/main/logseq/cli/command/completions.cljs` with a stub
      ns and `entries` def (empty vector). Confirm test runner loads it.

- [ ] **0.5** Remove placeholder failing tests; verify `yarn test` passes
      (green baseline).

---

## Phase 1 — Spec enrichment (`:values` and `:complete` metadata)

Each sub-task: write a test that reads the spec from the command entry and
asserts the metadata key exists, then add the key.

- [ ] **1.1** `command/core.cljs` — global spec:
  - Test: `:output` has `:values ["human" "json" "edn"]`
  - Test: `:graph` has `:complete :graphs`
  - Test: `:config` has `:complete :file`
  - Test: `:data-dir` has `:complete :dir`
  - Implement: add the keys to `global-spec*`.

- [ ] **1.2** `command/list.cljs` — list specs:
  - Test: page-spec `:sort` has `:values ["title" "created-at" "updated-at"]`
  - Test: tag-spec `:sort` has `:values ["name" "title"]`
  - Test: property-spec `:sort` has `:values ["name" "title"]`
  - Test: common `:order` has `:values ["asc" "desc"]`
  - Implement: add the `:values` keys.

- [ ] **1.3** `command/upsert.cljs` — upsert specs:
  - Test: block-spec `:pos` has `:values`
  - Test: block-spec `:status` has `:values`
  - Test: block-spec `:target-page` has `:complete :pages`
  - Test: block-spec `:blocks-file` has `:complete :file`
  - Test: page-spec `:page` has `:complete :pages`
  - Test: property-spec `:type` has `:values`
  - Test: property-spec `:cardinality` has `:values`
  - Implement: add the keys.

- [ ] **1.4** `command/graph.cljs` — export/import specs:
  - Test: export-spec `:type` has `:values ["edn" "sqlite"]`
  - Test: export-spec `:file` has `:complete :file`
  - Test: import-spec `:type` has `:values ["edn" "sqlite"]`
  - Test: import-spec `:input` has `:complete :file`
  - Implement: add the keys.

- [ ] **1.5** `command/query.cljs` — query spec:
  - Test: query-spec `:name` has `:complete :queries`
  - Implement: add the key.

- [ ] **1.6** `command/show.cljs` — show spec:
  - Test: show-spec `:page` has `:complete :pages`
  - Implement: add the key.

- [ ] **1.7** `command/remove.cljs` — remove page spec split:
  - Test: remove-page entry's spec has `{:name {:complete :pages}}`
  - Test: remove-tag entry's spec does NOT have `:complete` on `:name`
  - Test: remove-property entry's spec does NOT have `:complete` on `:name`
  - Implement: split `remove-page-spec` from `remove-entity-spec`.

---

## Phase 2 — Generator: table introspection utilities

Pure functions tested in `completion_generator_test.cljs`.

- [ ] **2.1** `extract-groups` — given a table, return grouped command
      hierarchy:
  - Test: `["graph" "export"]` → group `"graph"`, subcommand `"export"`
  - Test: `["show"]` → leaf command `"show"`
  - Test: `["completions"]` → leaf command `"completions"`
  - Implement in `completion_generator.cljs`.

- [ ] **2.2** `leaf-commands` / `group-commands` — classify entries:
  - Test: `show` and `doctor` are leaves
  - Test: `graph`, `server`, `list`, `upsert`, `remove`, `query` are groups
  - Implement.

- [ ] **2.3** `spec->tokens` — convert a single spec entry to a shell token
      descriptor:
  - Test: boolean spec → `:flag` type
  - Test: spec with `:values` → `:enum` type with values
  - Test: spec with `:complete :graphs` → `:dynamic` type
  - Test: spec with `:complete :file` → `:file` type
  - Test: spec with `:complete :dir` → `:dir` type
  - Test: spec with `:alias` → includes alias
  - Test: bare string spec (no `:values`, no `:complete`, not boolean) → `:free` type
  - Implement.

---

## Phase 3 — Generator: zsh output

- [ ] **3.1** `generate-zsh-preamble` — emit `#compdef logseq` header and
      dynamic helper constants:
  - Test: output starts with `#compdef logseq`
  - Test: output contains `_logseq_graphs`
  - Test: output contains `_logseq_pages`
  - Test: output contains `_logseq_queries`
  - Test: output contains `_logseq_json_names`
  - Test: output contains `_logseq_current_graph`
  - Implement with string constants.

- [ ] **3.2** `generate-zsh-leaf` — emit a `_logseq_<command>()` function for
      a leaf command:
  - Test: `show` command emits `_logseq_show()` with `_arguments`
  - Test: boolean flags emit `'--flag[desc]'` form
  - Test: enum options emit `'--opt=[desc]:label:(v1 v2)'` form
  - Test: `:complete :graphs` emits `_logseq_graphs` action
  - Test: `:complete :file` emits `_files` action
  - Test: `:alias` emits `(-x --opt)` grouping
  - Implement.

- [ ] **3.3** `generate-zsh-group` — emit a group dispatcher:
  - Test: `graph` group lists subcommands `list create switch remove validate info export import`
  - Test: dispatches to `_logseq_graph_export` etc.
  - Implement.

- [ ] **3.4** `generate-zsh-toplevel` — emit `_logseq()` root dispatcher:
  - Test: lists all top-level commands and groups
  - Test: dispatches to group/leaf functions
  - Test: ends with `_logseq "$@"`
  - Implement.

- [ ] **3.5** Integration: `(generate-completions "zsh" table)` returns a
      complete, valid zsh script:
  - Test: output contains preamble + all leaf functions + all group dispatchers
        + top-level dispatcher
  - Test: every command from the table appears in the output
  - Test: `--pos` under `upsert block` offers `first-child last-child sibling`
  - Test: `--sort` for `list page` offers `title created-at updated-at`
  - Test: `--sort` for `list tag` offers `name title`
  - Implement by composing 3.1–3.4.

---

## Phase 4 — Generator: bash output

- [ ] **4.1** `generate-bash-preamble` — emit header and dynamic helpers:
  - Test: output contains `_logseq_graphs_bash`
  - Test: output contains `_logseq_pages_bash`
  - Test: output contains `_logseq_queries_bash`
  - Test: output contains `_logseq_compadd_lines`
  - Test: output contains `_logseq_json_names_bash`
  - Test: output contains `_logseq_current_graph_bash`
  - Implement with string constants.

- [ ] **4.2** `generate-bash-opts-for` — emit `_logseq_opts_for()` case
      dispatch:
  - Test: `graph export` case branch includes `--type` and `--file`
  - Test: boolean flags appear in wordlist without argument handling
  - Test: enum values use `compgen -W`
  - Test: `:complete :file` uses `compgen -f`
  - Implement.

- [ ] **4.3** `generate-bash-main` — emit `_logseq()` and `complete -F`:
  - Test: output ends with `complete -F _logseq logseq`
  - Test: subcommand dispatch works for groups
  - Implement.

- [ ] **4.4** Integration: `(generate-completions "bash" table)` returns a
      complete bash script:
  - Test: output contains preamble + opts-for + main function + complete
        registration
  - Test: every command from the table appears in the output
  - Implement by composing 4.1–4.3.

---

## Phase 5 — `completions` command entry

- [ ] **5.1** Command registration:
  - Test: `completions-command/entries` contains one entry with
        `:cmds ["completions"]` and `:command :completions`
  - Test: spec has `{:shell {:values ["zsh" "bash"]}}`
  - Implement `command/completions.cljs` with `entries` and spec.

- [ ] **5.2** Wire into `commands.cljs`:
  - Test: `(commands/parse-args ["completions" "--shell" "zsh"])` returns
        `{:ok? true :command :completions}`
  - Test: `(commands/parse-args ["completions" "zsh"])` handles positional arg
  - Implement: add `completions-command/entries` to the table concat in
        `commands.cljs`.

- [ ] **5.3** Build action and execute:
  - Test: `build-action` for `:completions` returns an action with
        `:type :completions` and `:shell "zsh"`
  - Test: `execute` for `:completions` calls `generate-completions` and returns
        the output string
  - Implement in `command/completions.cljs` and wire into
        `commands.cljs` `build-action`/`execute`.

---

## Phase 6 — End-to-end validation

- [ ] **6.1** Golden-file smoke test (zsh):
  - Generate zsh output from the full table
  - Assert key structural markers: `#compdef`, `_logseq_graph_export`,
        `_logseq_show`, `_logseq "$@"`
  - Assert all commands from §2.1 of DESIGN.md appear

- [ ] **6.2** Golden-file smoke test (bash):
  - Generate bash output from the full table
  - Assert key structural markers: `complete -F _logseq logseq`,
        `_logseq_opts_for`
  - Assert all commands from §2.1 of DESIGN.md appear

- [ ] **6.3** Sync test — adding a command updates output:
  - Build a minimal table, generate output, add a fake command entry,
        re-generate, assert the new command appears

- [ ] **6.4** Context-dependent `:name` test:
  - Assert `query` spec has `{:name {:complete :queries}}`
  - Assert `remove page` spec has `{:name {:complete :pages}}`
  - Assert `upsert tag` spec does NOT have `:complete` on `:name`
  - Assert `remove tag` spec does NOT have `:complete` on `:name`

---

## Phase 7 — Replace hand-maintained files

- [ ] **7.1** Generate fresh `_logseq.zsh` and `logseq.bash` from the
      `completions` command; write them to
      `dz/scripts/shell-completions/`.

- [ ] **7.2** Verify the generated files include the "do not edit manually"
      header comment.

- [ ] **7.3** Update `dz/scripts/shell-completions/README.md` to document the
      new `logseq completions` workflow instead of hand-editing.

---

## Test require checklist

All new test namespaces that must be discoverable by the test runner
(`yarn nbb-logseq -cp test -m nextjournal.test-runner`):

| Test file | Requires |
|---|---|
| `src/test/logseq/cli/completion_generator_test.cljs` | `logseq.cli.completion-generator` |
| `src/test/logseq/cli/command/completions_test.cljs` | `logseq.cli.command.completions` |

The nbb test runner scans the `test` classpath for `*_test.cljs` files
automatically. Verify with:

```bash
cd deps/cli && yarn test
```

If the runner uses an explicit require list (check for a `test_runner.cljs` or
similar), add the two new namespaces there as well.
