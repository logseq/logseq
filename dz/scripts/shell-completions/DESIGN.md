# Shell Completions — Full Requirement (Option 2)

Generate shell completions from the CLI command table so that adding or
modifying a command/flag in the spec is the **only** change needed — the
completion scripts stay in sync automatically.

---

## 1. Overview

The Logseq CLI (`src/main/logseq/cli`) uses `babashka.cli` for argument
parsing. Commands and their options are declared as data in a `table` of
`{:cmds [...] :spec {...}}` entries assembled in `commands.cljs`.

A new `logseq completions <shell>` command will walk the `table` at
generation time and emit correct zsh and bash completion scripts.

```
logseq completions zsh  > ~/.zsh/completions/_logseq
logseq completions bash > ~/.local/share/bash-completion/completions/logseq
```

---

## 2. Complete command inventory

The table below is the single source of truth. Every row **must** appear in
the generated dispatch structure. Commands with no command-specific options
still inherit the global spec.

### 2.1 Command groups and subcommands

| Group         | Subcommands                                                                  | Command key                          |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| `graph`       | `list`, `create`, `switch`, `remove`, `validate`, `info`, `export`, `import` | `:graph-list` … `:graph-import`      |
| `server`      | `list`, `status`, `start`, `stop`, `restart`                                 | `:server-list` … `:server-restart`   |
| `list`        | `page`, `tag`, `property`                                                    | `:list-page` … `:list-property`      |
| `upsert`      | `block`, `page`, `tag`, `property`                                           | `:upsert-block` … `:upsert-property` |
| `remove`      | `block`, `page`, `tag`, `property`                                           | `:remove-block` … `:remove-property` |
| `query`       | _(root)_, `list`                                                             | `:query`, `:query-list`              |
| `show`        | _(leaf — no subcommands)_                                                    | `:show`                              |
| `doctor`      | _(leaf — no subcommands)_                                                    | `:doctor`                            |
| `completions` | _(leaf — new)_                                                               | `:completions`                       |

### 2.2 Global spec (`command/core.cljs`)

These options are available on **every** command. The merged spec
(`merge global-spec* command-spec`) is already what each table entry carries.

| Option         | Alias | `:coerce`  | `:values`                | `:complete` | Notes                |
| -------------- | ----- | ---------- | ------------------------ | ----------- | -------------------- |
| `--help`       | `-h`  | `:boolean` | —                        | —           |                      |
| `--version`    | —     | `:boolean` | —                        | —           |                      |
| `--config`     | —     | —          | —                        | `:file`     | Path to `cli.edn`    |
| `--graph`      | —     | —          | —                        | `:graphs`   | Graph name (dynamic) |
| `--data-dir`   | —     | —          | —                        | `:dir`      | Path to data dir     |
| `--timeout-ms` | —     | `:long`    | —                        | —           |                      |
| `--output`     | —     | —          | `["human" "json" "edn"]` | —           | Output format        |
| `--verbose`    | —     | `:boolean` | —                        | —           |                      |

### 2.3 Command-specific specs

#### `graph export`

| Option   | `:values`          | `:complete` |
| -------- | ------------------ | ----------- |
| `--type` | `["edn" "sqlite"]` | —           |
| `--file` | —                  | `:file`     |

#### `graph import`

| Option    | `:values`          | `:complete` |
| --------- | ------------------ | ----------- |
| `--type`  | `["edn" "sqlite"]` | —           |
| `--input` | —                  | `:file`     |

#### `graph list/create/switch/remove/validate/info`

No command-specific options (global-only).

#### `server status/start/stop/restart`

| Option    | `:complete` | Notes                                              |
| --------- | ----------- | -------------------------------------------------- |
| `--graph` | `:graphs`   | Redundant with global — shadows it (same behavior) |

#### `server list`

No command-specific options.

#### `list page`

| Option              | `:coerce`  | `:values`                             |
| ------------------- | ---------- | ------------------------------------- |
| `--expand`          | `:boolean` | —                                     |
| `--limit`           | `:long`    | —                                     |
| `--offset`          | `:long`    | —                                     |
| `--sort`            | —          | `["title" "created-at" "updated-at"]` |
| `--order`           | —          | `["asc" "desc"]`                      |
| `--include-journal` | `:boolean` | —                                     |
| `--journal-only`    | `:boolean` | —                                     |
| `--include-hidden`  | `:boolean` | —                                     |
| `--updated-after`   | —          | —                                     |
| `--created-after`   | —          | —                                     |
| `--fields`          | —          | —                                     |

#### `list tag`

| Option               | `:coerce`  | `:values`          |
| -------------------- | ---------- | ------------------ |
| `--expand`           | `:boolean` | —                  |
| `--limit`            | `:long`    | —                  |
| `--offset`           | `:long`    | —                  |
| `--sort`             | —          | `["name" "title"]` |
| `--order`            | —          | `["asc" "desc"]`   |
| `--include-built-in` | `:boolean` | —                  |
| `--with-properties`  | `:boolean` | —                  |
| `--with-extends`     | `:boolean` | —                  |
| `--fields`           | —          | —                  |

#### `list property`

| Option               | `:coerce`  | `:values`          |
| -------------------- | ---------- | ------------------ |
| `--expand`           | `:boolean` | —                  |
| `--limit`            | `:long`    | —                  |
| `--offset`           | `:long`    | —                  |
| `--sort`             | —          | `["name" "title"]` |
| `--order`            | —          | `["asc" "desc"]`   |
| `--include-built-in` | `:boolean` | —                  |
| `--with-classes`     | `:boolean` | —                  |
| `--with-type`        | `:boolean` | —                  |
| `--fields`           | —          | —                  |

#### `upsert block`

| Option                | `:coerce` | `:values`                                                                                                           | `:complete` |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| `--id`                | `:long`   | —                                                                                                                   | —           |
| `--uuid`              | —         | —                                                                                                                   | —           |
| `--target-id`         | `:long`   | —                                                                                                                   | —           |
| `--target-uuid`       | —         | —                                                                                                                   | —           |
| `--target-page`       | —         | —                                                                                                                   | `:pages`    |
| `--pos`               | —         | `["first-child" "last-child" "sibling"]`                                                                            | —           |
| `--content`           | —         | —                                                                                                                   | —           |
| `--blocks`            | —         | —                                                                                                                   | —           |
| `--blocks-file`       | —         | —                                                                                                                   | `:file`     |
| `--status`            | —         | `["todo" "doing" "done" "now" "later" "wait" "waiting" "backlog" "canceled" "cancelled" "in-review" "in-progress"]` | —           |
| `--update-tags`       | —         | —                                                                                                                   | —           |
| `--update-properties` | —         | —                                                                                                                   | —           |
| `--remove-tags`       | —         | —                                                                                                                   | —           |
| `--remove-properties` | —         | —                                                                                                                   | —           |

> **Note on `--status` values:** The CLI also accepts aliases like `in_review`,
> `inreview`, `in progress`, `inprogress`. These are **not** included in
> completions — only canonical hyphenated forms are offered. The aliases
> remain accepted at runtime.

#### `upsert page`

| Option                | `:coerce` | `:complete` |
| --------------------- | --------- | ----------- |
| `--id`                | `:long`   | —           |
| `--page`              | —         | `:pages`    |
| `--update-tags`       | —         | —           |
| `--update-properties` | —         | —           |
| `--remove-tags`       | —         | —           |
| `--remove-properties` | —         | —           |

#### `upsert tag`

| Option   | `:coerce` |
| -------- | --------- |
| `--id`   | `:long`   |
| `--name` | —         |

No `:complete` — free text.

#### `upsert property`

| Option          | `:coerce`  | `:values`                                                                        |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `--id`          | `:long`    | —                                                                                |
| `--name`        | —          | —                                                                                |
| `--type`        | —          | `["default" "number" "date" "datetime" "checkbox" "url" "node" "json" "string"]` |
| `--cardinality` | —          | `["one" "many"]`                                                                 |
| `--hide`        | `:boolean` | —                                                                                |
| `--public`      | `:boolean` | —                                                                                |

#### `remove block`

| Option   | Notes                           |
| -------- | ------------------------------- |
| `--id`   | Free text (db/id or EDN vector) |
| `--uuid` | Free text                       |

#### `remove page`

| Option   | `:complete` |
| -------- | ----------- |
| `--name` | `:pages`    |

#### `remove tag`

| Option   | `:coerce` |
| -------- | --------- |
| `--id`   | `:long`   |
| `--name` | —         |

No `:complete` — free text.

#### `remove property`

| Option   | `:coerce` |
| -------- | --------- |
| `--id`   | `:long`   |
| `--name` | —         |

No `:complete` — free text.

#### `query`

| Option     | `:complete` |
| ---------- | ----------- |
| `--query`  | —           |
| `--name`   | `:queries`  |
| `--inputs` | —           |

> `:name` gets `:complete :queries` **only** in the `query` command spec.
> In `upsert tag` and `upsert property`, `:name` is free text — no
> `:complete` key. This is expressed naturally because each command has its
> own spec.

#### `query list`

No command-specific options.

#### `show`

| Option                | `:coerce`  | `:complete` |
| --------------------- | ---------- | ----------- |
| `--id`                | —          | —           |
| `--uuid`              | —          | —           |
| `--page`              | —          | `:pages`    |
| `--linked-references` | `:boolean` | —           |
| `--level`             | `:long`    | —           |

#### `doctor`

| Option         | `:coerce`  |
| -------------- | ---------- |
| `--dev-script` | `:boolean` |

#### `completions` _(new)_

| Option    | `:values`        |
| --------- | ---------------- |
| `--shell` | `["zsh" "bash"]` |

---

## 3. Spec enrichment — new metadata keys

Two new optional keys are added to `babashka.cli` spec entries. They are
consumed only by the completion generator; runtime parsing ignores them.

### 3.1 `:values [...]`

A vector of allowed string values — used for enum completion.

```clojure
;; before
:output {:desc "Output format (human, json, edn). Default: human"}

;; after
:output {:desc    "Output format. Default: human"
         :values  ["human" "json" "edn"]}
```

Complete list of locations that need `:values` added:

| File                                  | Option         | Values                                                                                                              |
| ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `command/core.cljs` (global)          | `:output`      | `["human" "json" "edn"]`                                                                                            |
| `command/list.cljs` (page spec)       | `:sort`        | `["title" "created-at" "updated-at"]`                                                                               |
| `command/list.cljs` (tag spec)        | `:sort`        | `["name" "title"]`                                                                                                  |
| `command/list.cljs` (property spec)   | `:sort`        | `["name" "title"]`                                                                                                  |
| `command/list.cljs` (common spec)     | `:order`       | `["asc" "desc"]`                                                                                                    |
| `command/upsert.cljs` (block spec)    | `:pos`         | `["first-child" "last-child" "sibling"]`                                                                            |
| `command/upsert.cljs` (block spec)    | `:status`      | `["todo" "doing" "done" "now" "later" "wait" "waiting" "backlog" "canceled" "cancelled" "in-review" "in-progress"]` |
| `command/upsert.cljs` (property spec) | `:type`        | `["default" "number" "date" "datetime" "checkbox" "url" "node" "json" "string"]`                                    |
| `command/upsert.cljs` (property spec) | `:cardinality` | `["one" "many"]`                                                                                                    |
| `command/graph.cljs` (export spec)    | `:type`        | `["edn" "sqlite"]`                                                                                                  |
| `command/graph.cljs` (import spec)    | `:type`        | `["edn" "sqlite"]`                                                                                                  |

> **Note on `:sort`:** The allowed values differ per sub-command (`list page`
> vs `list tag/property`). Each sub-command already has its own spec, so
> the difference is handled naturally with no special-casing.

### 3.2 `:complete <keyword>`

A hint that the value should be completed dynamically. The generator emits
a call to the appropriate shell helper function.

| Keyword    | zsh helper        | bash helper            | Notes                                             |
| ---------- | ----------------- | ---------------------- | ------------------------------------------------- |
| `:graphs`  | `_logseq_graphs`  | `_logseq_graphs_bash`  | Graph names from `logseq graph list`              |
| `:pages`   | `_logseq_pages`   | `_logseq_pages_bash`   | Page titles; requires `--graph`                   |
| `:queries` | `_logseq_queries` | `_logseq_queries_bash` | Built-in + custom query names; requires `--graph` |
| `:file`    | `_files`          | `compgen -f`           | Filesystem path                                   |
| `:dir`     | `_files -/`       | `compgen -d`           | Directory path                                    |

Complete list of locations that need `:complete` added:

| File                          | Option         | `:complete` | Applies to         |
| ----------------------------- | -------------- | ----------- | ------------------ |
| `command/core.cljs` (global)  | `:graph`       | `:graphs`   | All commands       |
| `command/core.cljs` (global)  | `:config`      | `:file`     | All commands       |
| `command/core.cljs` (global)  | `:data-dir`    | `:dir`      | All commands       |
| `command/graph.cljs` (export) | `:file`        | `:file`     | `graph export`     |
| `command/graph.cljs` (import) | `:input`       | `:file`     | `graph import`     |
| `command/upsert.cljs` (block) | `:target-page` | `:pages`    | `upsert block`     |
| `command/upsert.cljs` (block) | `:blocks-file` | `:file`     | `upsert block`     |
| `command/upsert.cljs` (page)  | `:page`        | `:pages`    | `upsert page`      |
| `command/query.cljs`          | `:name`        | `:queries`  | `query` only       |
| `command/show.cljs`           | `:page`        | `:pages`    | `show`             |
| `command/remove.cljs` (page)  | `:name`        | `:pages`    | `remove page` only |

> **`:name` is context-dependent.** `query --name` → `:queries`.
> `remove page --name` → `:pages`. `upsert tag --name` and
> `remove tag --name` → free text. This is handled by keeping `:complete`
> in command-specific specs only.

> **`:queries` must return both built-in and custom queries.** The dynamic
> helper calls `logseq query list` which already returns both sources.

---

## 4. New `completions` command

New file: `src/main/logseq/cli/command/completions.cljs`

```
logseq completions zsh
logseq completions bash
logseq completions --help
```

The command:

1. Takes `--shell` (or a positional arg) with value `zsh` or `bash`.
2. Calls the generator (§5) with the full `table`.
3. Prints the result to stdout.
4. Exits 0.

Registration in `commands.cljs`:

```clojure
(core/command-entry ["completions"] :completions
  "Generate shell completion script"
  {:shell {:desc "Shell (zsh, bash)" :values ["zsh" "bash"]}})
```

The `completions` command itself **must be excluded** from the generated
completion dispatch (it is a meta-command, not a user-facing workflow
command). Whether to exclude it is a design choice; including it is also
acceptable since `logseq completions <Tab>` → `zsh bash` is helpful.

---

## 5. Generator function

New file: `src/main/logseq/cli/completion_generator.cljs`

Pure function: `(generate-completions shell table) → string`

### 5.1 Input

The `table` as returned by `commands/build-table` — a vector of
`command-entry` maps. Each entry has:

```clojure
{:cmds    ["graph" "export"]
 :command :graph-export
 :desc    "Export graph"
 :spec    { ;; merged global + command-specific
            :help    {:alias :h  :coerce :boolean  :desc "..."}
            :graph   {:desc "Graph name"  :complete :graphs}
            :type    {:desc "Export type"  :values ["edn" "sqlite"]}
            :file    {:desc "Export file"  :complete :file}
            ...}}
```

### 5.2 Spec-entry → completion token mapping

| Spec characteristics  | zsh token                              | bash case                                                    |
| --------------------- | -------------------------------------- | ------------------------------------------------------------ |
| `:coerce :boolean`    | `'--flag[desc]'`                       | flag in wordlist, no argument                                |
| `:values [v1 v2]`     | `'--opt=[desc]:label:(v1 v2)'`         | `compgen -W 'v1 v2' -- "$cur"`                               |
| `:complete :graphs`   | `'--opt=[desc]:graph:_logseq_graphs'`  | `_logseq_compadd_lines "$cur" _logseq_graphs_bash`           |
| `:complete :pages`    | `'--opt=[desc]:page:_logseq_pages'`    | `_logseq_compadd_lines "$cur" _logseq_pages_bash "$graph"`   |
| `:complete :queries`  | `'--opt=[desc]:query:_logseq_queries'` | `_logseq_compadd_lines "$cur" _logseq_queries_bash "$graph"` |
| `:complete :file`     | `'--opt=[desc]:file:_files'`           | `compgen -f -- "$cur"`                                       |
| `:complete :dir`      | `'--opt=[desc]:dir:_files -/'`         | `compgen -d -- "$cur"`                                       |
| `:alias :x`           | `'(-x --opt)'{-x,--opt}'[desc]...'`    | both `-x` and `--opt` in wordlist                            |
| free string (default) | `'--opt=[desc]:value:'`                | flag in wordlist, prev-word fallthrough                      |

### 5.3 Output structure (zsh)

```zsh
#compdef logseq
# Auto-generated by `logseq completions zsh` — do not edit manually.

# --- dynamic helpers (verbatim, fixed) ---
_logseq_json_names() { ... }
_logseq_graphs()     { ... }   # with zcompcache
_logseq_pages()      { ... }   # with zcompcache, keyed by --graph value
_logseq_queries()    { ... }   # with zcompcache, keyed by --graph value
_logseq_current_graph() { ... }

# --- per-command functions (generated) ---
_logseq_graph_export() { _arguments -s ... }
_logseq_graph_import() { _arguments -s ... }
...

# --- group dispatchers (generated) ---
_logseq_graph() {
  _arguments -C -s ... '1:subcommand:->subcmd' '*::args:->args'
  case $state in
    subcmd) _describe 'subcommand' subcmds ;;
    args)   case $line[1] in ... esac ;;
  esac
}

# --- top-level dispatcher (generated) ---
_logseq() {
  _arguments -C -s ... '1:command:->cmds' '*::args:->args'
  ...
}

_logseq "$@"
```

### 5.4 Output structure (bash)

```bash
# Auto-generated by `logseq completions bash` — do not edit manually.

# --- dynamic helpers (verbatim, fixed) ---
_logseq_json_names_bash()    { ... }
_logseq_current_graph_bash() { ... }
_logseq_graphs_bash()        { ... }
_logseq_pages_bash()         { ... }
_logseq_queries_bash()       { ... }
_logseq_compadd_lines()      { ... }
_logseq_is_value_opt()       { ... }  # generated from spec
_logseq_cmd_and_subcmd()     { ... }

# --- option wordlists (generated per-command) ---
_logseq_opts_for()           { ... }  # case "$cmd"/"$subcmd"

# --- main function (generated) ---
_logseq() { ... }

complete -F _logseq logseq
```

---

## 6. Dynamic helper functions

The dynamic helpers (graph/page/query lookups, caching) are **fixed verbatim
strings** emitted by the generator regardless of the table contents. They do
not change when new commands are added — only the static dispatch structure
changes.

They live in the generator as string constants:

```clojure
(def ^:private zsh-dynamic-helpers
  "# --- dynamic helpers ---
_logseq_json_names() {
  python3 -c \"...\"
}
...")
```

### 6.1 What the helpers invoke

| Helper                                     | CLI command                                   | Output format        |
| ------------------------------------------ | --------------------------------------------- | -------------------- |
| `_logseq_graphs` / `_logseq_graphs_bash`   | `logseq graph list --output json`             | JSON array of names  |
| `_logseq_pages` / `_logseq_pages_bash`     | `logseq list page --graph <G> --output json`  | JSON array of titles |
| `_logseq_queries` / `_logseq_queries_bash` | `logseq query list --graph <G> --output json` | JSON array of names  |

### 6.2 `_logseq_current_graph`

Scans `$words` (zsh) or `$COMP_WORDS` (bash) for `--graph VALUE` to
determine which graph context to use for page/query lookups.

---

## 7. Tree-walk algorithm

The generator derives the command hierarchy by inspecting `:cmds` vectors:

1. **Leaf commands** — entries where no other entry's `:cmds` is a prefix.
   These get per-command functions with `_arguments` (zsh) or case branches
   (bash).

2. **Group commands** — the distinct first-element prefixes (`graph`,
   `server`, `list`, `upsert`, `remove`, `query`). These get dispatcher
   functions that offer subcommand completion, then delegate to the leaf.

3. **Top-level** — the root dispatcher that offers command-group (and
   leaf-command) completion.

The walk is:

```
table
  → group by first element of :cmds
  → for each group:
      if only one entry → leaf (e.g., "show", "doctor")
      if multiple entries → group dispatcher + per-subcommand leaves
  → top-level dispatcher listing all groups and leaves
```

---

## 8. Edge cases

| Case                                                                                                  | Handling                                                                                                                       |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `:alias` on a global opt (`:help` → `-h`)                                                             | Emit both long and short form with zsh grouping `(-h --help)`                                                                  |
| Same flag name in both global and command spec                                                        | Generator uses the merged spec — command spec wins (already the case via `merge`)                                              |
| `:sort` has different `:values` for `list page` vs `list tag/property`                                | Handled naturally — each sub-command has its own spec                                                                          |
| `--output` is a format enum globally; `graph export` uses `--file` for the file path                  | No conflict — `--output` keeps its global meaning everywhere, `--file` is the export path. Confirmed in source.                |
| `--name` context-dependent (`query` → `:queries`; `remove page` → `:pages`; `upsert tag` → free text) | Expressed by keeping `:complete` in command-specific specs only                                                                |
| Boolean flags shouldn't suggest a value                                                               | `:coerce :boolean` → emit as bare flag token                                                                                   |
| `remove page --name` needs page completion but `remove tag --name` does not                           | `remove-page-spec` gets its own spec with `{:name {:complete :pages}}`, separate from `remove-entity-spec`                     |
| `server` commands inherit `--graph` from global spec + also declare it in command spec                | Redundant shadow — no issue, merged spec contains one `:graph` entry                                                           |
| `completions` command in generated output                                                             | Include it — `logseq completions <Tab>` → `zsh bash` is useful                                                                 |
| Positional arguments (`graph create <name>`, `graph switch <name>`)                                   | These commands take the graph name via `--graph` (global opt). No positional arg completion needed beyond subcommand dispatch. |

---

## 9. What is NOT generated

These are emitted as fixed preamble strings by the generator:

- The dynamic helper function bodies (graph list, page list, query list
  invocations)
- The zsh cache key logic (`_store_cache` / `_retrieve_cache`)
- The `_logseq_current_graph` helper that scans `$words` for `--graph`
- The `_logseq_compadd_lines` line-by-line appender (bash)
- The `_logseq_json_names` JSON-to-lines parser

---

## 10. New files

| Path                                            | Purpose                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `src/main/logseq/cli/command/completions.cljs`  | Command entry: parse args, call generator, print to stdout   |
| `src/main/logseq/cli/completion_generator.cljs` | Pure function: `(generate-completions shell table) → string` |

---

## 11. Changes to existing files

| File                  | Change                                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command/core.cljs`   | Add `:values` and `:complete` to `global-spec*` entries per §3                                                                                                                                 |
| `command/list.cljs`   | Add `:values` to `:sort` and `:order` per §3.1                                                                                                                                                 |
| `command/upsert.cljs` | Add `:values` to `:pos`, `:status`, `:type`, `:cardinality`; add `:complete :pages` to `:target-page`; add `:complete :file` to `:blocks-file`; add `:complete :pages` to `:page` in page spec |
| `command/graph.cljs`  | Add `:values` to `:type`; add `:complete :file` to `:file` and `:input`                                                                                                                        |
| `command/query.cljs`  | Add `:complete :queries` to `:name`                                                                                                                                                            |
| `command/show.cljs`   | Add `:complete :pages` to `:page`                                                                                                                                                              |
| `command/remove.cljs` | Split `remove-page-spec` from generic `remove-entity-spec` so `:name` gets `:complete :pages` only for `remove page`                                                                           |
| `commands.cljs`       | Add `completions-command/entries` to the `table` concat                                                                                                                                        |

---

## 12. Acceptance criteria

- [ ] `logseq completions zsh` output, when installed as `_logseq`, passes
      smoke tests: `logseq <Tab>`, `logseq list <Tab>`,
      `logseq upsert block --pos <Tab>`, `logseq show --page <Tab>`,
      `logseq remove <Tab>`, `logseq server <Tab>`, `logseq doctor <Tab>`,
      `logseq query --name <Tab>`, `logseq remove page --name <Tab>`,
      `logseq graph export --type <Tab>`, `logseq upsert block --blocks-file <Tab>`.
- [ ] `logseq completions bash` output passes equivalent smoke tests.
- [ ] Adding a new `command-entry` to the table (or a `:values` change to a
      spec) causes the generated output to change with no other edits
      required.
- [ ] The generator is a pure function testable in isolation (no I/O).
- [ ] The hand-maintained `_logseq.zsh` and `logseq.bash` files in
      `dz/scripts/shell-completions/` are replaced by the generated output
      and marked as generated (header comment: "do not edit manually").
- [ ] The `remove page` subcommand completes `--name` with page names
      (dynamic), while `remove tag` and `remove property` leave `--name`
      as free text.
- [ ] `upsert block --target-page`, `upsert page --page`, and
      `show --page` all complete with page names (dynamic).
- [ ] `upsert block --blocks-file` and `graph export --file` and
      `graph import --input` complete with file paths.
- [ ] `--config` completes with file paths; `--data-dir` completes with
      directory paths.

---

## 13. Out of scope

- Fish shell completions (can be added later with the same table-walk).
- PowerShell completions.
- Auto-installing completions on `npm install` / `brew install`.
- CI regression test that diffs generated completions against a golden file
  (desirable, but tracked separately).
- Completion for positional arguments beyond subcommand names (no current
  command uses meaningful positional args).
