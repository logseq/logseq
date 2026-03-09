# Shell Completions for the Logseq CLI

This directory contains shell completion scripts for the `logseq` CLI
(`src/main/logseq/cli`).

## Generating completions

These files are **auto-generated** from the CLI command table. Do not edit
them manually — regenerate instead:

```bash
logseq completion zsh  > dz/scripts/shell-completions/_logseq.zsh
logseq completion bash > dz/scripts/shell-completions/logseq.bash
```

The generator reads the command table at generation time, so adding or
modifying a command/flag in the spec is the **only** change needed — the
completion scripts stay in sync automatically.

## Available completions

| File            | Shell |
| --------------- | ----- |
| `_logseq.zsh`   | zsh   |
| `logseq.bash`   | bash  |

---

## zsh

### Installation (zsh)

**Option A — eval in `~/.zshrc`** (simplest, always up to date):

```zsh
eval "$(logseq completion zsh)"
```

**Option B — fpath** (avoids running `logseq` at shell startup):

1. Copy `_logseq.zsh` to a directory on your `$fpath`, **renaming it to
   `_logseq`** (no extension — required by zsh's autoload mechanism):

   ```zsh
   mkdir -p ~/.zsh/completions
   cp completions/_logseq.zsh ~/.zsh/completions/_logseq
   ```

2. Add that directory to `$fpath` in `~/.zshrc` **before** the `compinit` call:

   ```zsh
   fpath=(~/.zsh/completions $fpath)
   autoload -Uz compinit && compinit
   ```

3. Open a new terminal (or run `compinit` in the current session).

### Verifying (zsh)

```zsh
logseq <Tab>                      # shows top-level commands
logseq list <Tab>                 # shows: page  tag  property
logseq graph <Tab>                # shows: list  create  switch  remove  ...
logseq add block --status <Tab>   # shows task status values
logseq show --page <Tab>          # lists page names from the active graph
```

### Dynamic completions and caching (zsh)

Page names, graph names, and query names are fetched live from the CLI and
cached using zsh's built-in completion cache (`~/.zcompcache/`). The cache is
keyed per graph, so switching `--repo` gives fresh results.

To force a refresh, delete the relevant cache entries:

```zsh
rm -f ~/.zcompcache/logseq_*
```

### Updating (zsh)

After upgrading the `logseq` CLI, regenerate and re-copy:

```zsh
logseq completion zsh > ~/.zsh/completions/_logseq
compinit
```

---

## bash

### Requirements (bash)

Requires bash 4.1+ and the [`bash-completion`](https://github.com/scop/bash-completion)
package (v2 recommended). On macOS:

```bash
brew install bash bash-completion@2
```

### Installation (bash)

**Option A — per-user** (recommended):

```bash
mkdir -p ~/.local/share/bash-completion/completions
cp completions/logseq.bash ~/.local/share/bash-completion/completions/logseq
```

**Option B — source from `~/.bashrc`**:

```bash
source /path/to/logseq/completions/logseq.bash
```

**Option C — system-wide**:

```bash
sudo cp completions/logseq.bash /etc/bash_completion.d/logseq
```

### Verifying (bash)

```bash
logseq <Tab>                      # shows top-level commands
logseq list <Tab>                 # shows: page  tag  property
logseq graph <Tab>                # shows: list  create  switch  remove  ...
logseq add block --status <Tab>   # shows task status values
logseq show --page <Tab>          # lists page names from the active graph
```

### Dynamic completions (bash)

Page names, graph names, and query names are fetched live from the CLI each
time they are needed. There is no built-in caching in the bash script; results
are as fresh as the CLI response.

### Updating (bash)

After upgrading the `logseq` CLI, regenerate and re-copy:

```bash
logseq completion bash > ~/.local/share/bash-completion/completions/logseq
```

---

## What is completed (both shells)

### Commands and subcommands

```text
logseq list        page | tag | property
logseq upsert      block | page | tag | property
logseq remove      block | page | tag | property
logseq query       [list]
logseq graph       list | create | switch | remove | validate | info | export | import
logseq server      list | status | start | stop | restart
logseq show
logseq doctor
logseq completion
```

### Global options

| Option                                  | Completion                                    |
| --------------------------------------- | --------------------------------------------- |
| `--graph`                               | dynamic: graph names from `logseq graph list` |
| `--config`                              | file path                                     |
| `--data-dir`                            | directory path                                |
| `--output`                              | `human` `json` `edn`                          |
| `--timeout-ms`                          | free integer                                  |
| `--verbose`, `--version`, `-h`/`--help` | flags                                         |

### Per-command options

| Command                     | Option               | Completion                                                                                                      |
| --------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `list page`                 | `--sort`             | `title` `created-at` `updated-at`                                                                               |
| `list tag`, `list property` | `--sort`             | `name` `title`                                                                                                  |
| `list *`                    | `--order`            | `asc` `desc`                                                                                                    |
| `upsert block`              | `--pos`              | `first-child` `last-child` `sibling`                                                                            |
| `upsert block`              | `--status`           | `todo` `doing` `done` `now` `later` `wait` `waiting` `backlog` `canceled` `cancelled` `in-review` `in-progress` |
| `upsert block`              | `--target-page`      | dynamic: page titles from `logseq list page`                                                                    |
| `upsert block`              | `--blocks-file`      | file path                                                                                                       |
| `upsert page`               | `--page`             | dynamic: page titles                                                                                            |
| `upsert property`           | `--type`             | `default` `number` `date` `datetime` `checkbox` `url` `node` `json` `string`                                   |
| `upsert property`           | `--cardinality`      | `one` `many`                                                                                                    |
| `remove page`               | `--name`             | dynamic: page titles                                                                                            |
| `show`                      | `--page`             | dynamic: page titles                                                                                            |
| `query`                     | `--name`             | dynamic: query names from `logseq query list`                                                                   |
| `graph export`              | `--type`             | `edn` `sqlite`                                                                                                  |
| `graph export`              | `--file`             | file path                                                                                                       |
| `graph import`              | `--type`             | `edn` `sqlite`                                                                                                  |
| `graph import`              | `--input`            | file path                                                                                                       |
| `completions`               | `--shell`            | `zsh` `bash`                                                                                                    |
| `doctor`                    | `--dev-script`       | flag                                                                                                            |
`