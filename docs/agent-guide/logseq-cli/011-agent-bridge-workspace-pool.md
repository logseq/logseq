# AgentBridge Local Workspace Pool

Goal: `logseq agent bridge` should support running multiple Codex sessions for the same project by assigning each session to a pre-created local project copy. The bridge still runs on the host and starts the host `codex` command, so it can reuse the local Codex app/CLI configuration while isolating file changes by workspace directory.

## Intended configuration

The bridge reads an optional workspace pool from `cli.edn`:

```clojure
{:graph "dev"
 :agent-name "logseq-coder"
 :workspaces {"dev" [{:id "copy-1" :cwd "/abs/path/logseq-1"}
                     {:id "copy-2" :cwd "/abs/path/logseq-2"}
                     {:id "copy-3" :cwd "/abs/path/logseq-3"}]}}
```

`:workspaces` is a map keyed by graph name. The bridge only uses the workspace list for the graph it is currently running against. When `:workspaces` is absent, empty, or has no entry for the current graph, the bridge keeps the existing behavior and starts Codex without an explicit working directory. In that mode Codex inherits the bridge process cwd.

Each workspace entry must have:

- `:id`: a non-empty unique string.
- `:cwd`: an absolute path to an existing git repository or worktree.

The bridge must validate the pool before listening for graph changes. Invalid pool configuration is a startup error. A dirty workspace at startup is also a startup error because v1 does not clean or reset user files.

## Session lifecycle

For each routed task or comment session:

1. Select the first idle workspace whose git status is clean.
2. Fetch and pull the latest `master` in that workspace.
3. Start host Codex with that workspace as `cwd`.
4. Codex creates a new branch from `master`, choosing the branch name based on the task.
5. Record the Codex session with `:workspace-id` and `:cwd`.
6. Write `agent-session-id` back to the graph after Codex reports a session id.
7. Codex commits all local changes before it exits, choosing the commit message based on the task.
8. When Codex exits, the bridge verifies the workspace is clean, verifies the current branch is a session branch rather than `master`, and records that branch.
9. Mark the session completed or failed based on the Codex exit code and post-session git verification.
10. Leave the workspace on the session branch for inspection.

Branch names are created by the agent, not the bridge. They should be concise and describe the work. Recommended shapes:

```text
fix/some-bug
feat/x-feature
enhance/xxx
refactor/db-worker
```

Commit messages are also created by the agent. They should be concise and describe the completed change. If Codex exits successfully but leaves uncommitted changes or stays on `master`, the session should be marked failed. Do not silently discard changes.

## Workspace pool behavior

The pool is owned by one bridge process. It is not a cross-process lock. Do not run multiple bridge processes with the same `:agent-name` and the same graph expecting safe load balancing.

Workspace states:

- `:idle`: available for a new session.
- `:running`: assigned to an active Codex process.
- `:dirty`: not available because local changes remain outside a successfully committed session.

Before assigning a workspace, check `git status --porcelain`. If it is not empty, mark the workspace dirty and skip it. If no workspace is idle, skip routing for that event or startup scan; the task remains routable and can be picked up by a later scan.

v1 must not run `git reset`, `git clean`, or any destructive checkout to recover a workspace. Recovery is manual.

## Comment resume behavior

When a comment targets a block that already has `agent-session-id`, resume the original Codex session in the same workspace recorded for that session.

If the original session has no workspace metadata, the workspace no longer exists in the configured pool, or the workspace is dirty, fail the comment route and add the existing failure reaction. Do not resume in a different workspace because that can split one Codex thread across unrelated checkouts.

When there is no resumable target session, route the comment like a new session and allocate an idle workspace.

## Output and session records

`agent-bridge-sessions.edn` should keep the existing fields and add workspace metadata:

```clojure
{:session "thread-..."
 :status :running
 :backend :codex
 :graph "dev"
 :block "11111111-1111-1111-1111-111111111111"
 :agent "logseq-coder"
 :workspace-id "copy-1"
 :cwd "/abs/path/logseq-1"
 :branch "feat/x-feature"
 :started-at 1779777600000
 :updated-at 1779777600000}
```

`logseq agent bridge list` should show workspace information in human output and keep the full fields in EDN/JSON output.

## Testing expectations

Unit coverage should verify:

- Workspace config validation rejects duplicate ids, relative paths, missing directories, non-git directories, and dirty repositories.
- Existing no-workspace behavior is unchanged.
- `start-codex!` passes configured `cwd` to `child_process.spawn`.
- Multiple routable tasks use different idle workspaces.
- Tasks beyond the number of available workspaces are not started.
- Listener and startup scan share both routing claims and workspace busy state.
- Session records include `:workspace-id`, `:cwd`, and branch metadata.
- Comment resume uses the workspace recorded on the original session.
- Codex prompts include branch and commit instructions for workspace sessions.
- Codex exit marks dirty workspaces as failed sessions instead of committing or cleaning them.

CLI/e2e coverage should create temporary git repository copies with fake Codex, run `agent bridge --process-once`, and verify that fake Codex observes the selected cwd. A dirty workspace scenario should verify that the bridge does not run reset or clean.
