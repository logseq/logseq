---
name: git-commit-hygiene
description: Git commit rules for the shared PR branch — never rewrite shared history, never commit build artifacts, audit the staged diff before every commit, and coordinate around concurrent agent pushes. Load before committing or pushing to shared branches, and before any history-editing operation (filter-repo, rebase, amend, force-push).
---

# Git Commit Hygiene

Use whenever you are about to `git commit`, `git push`, or run any history-editing command (`git filter-repo`, `git rebase`, `git commit --amend`, `git push --force`) on a branch other sessions may share.

## Rule 1 — Never rewrite history on a shared branch

`git filter-repo`, `git rebase`, `git commit --amend`, and force-push change every SHA downstream of the touched point. On a branch that other agents/people have checked out or that contains merges, this:

- severs the merge-base with the target branch → the PR diff balloons to hundreds of thousands of phantom lines,
- poisons every concurrent worktree — their next `git pull` merges the old and new histories together,
- is effectively irreversible once others have pushed on top.

**Do not run them on `devin/ocaml-db-worker` or any branch with an open PR.** If a committed file must leave the PR, `git rm` it and commit normally — GitHub's diff only needs it gone from the tree, not from history.

If a history purge is genuinely required (a secret, a giant artifact), coordinate first:

1. Freeze all concurrent pushes — tell every active agent/session working on the branch to stop pushing until told to reset.
2. Rewrite once, force-push once.
3. Every worktree must then `git fetch origin && git reset --hard origin/<branch>` — **never** `git pull` or `git pull --rebase`, which re-merge/replay the superseded line.

## Rule 2 — Never commit build artifacts

Build outputs must be produced by CI/local builds, never committed. Before every `git commit`, audit what is staged:

```bash
git status --short
git diff --cached --stat | tail -5
```

Red flags in the staged list:

- compiled bundles: `static/js/*.js`, `resources/js/*.mjs`, `main.js`, `worker*.js`, `deps/**/_build/`, `dist/`, `out/`
- test artifacts: `*.sqlite`, `*.db`, `*.pack`, `.parallel-logs/`, `test-results/`
- generated metadata that must stay deterministic (e.g. `ocaml-e2e/shard-plan.json` is intentionally committed — check before touching)
- any staged file > 500 KB: `git diff --cached --numstat | sort -rn | head`

If a generated file is staged: unstage it, add the path to `.gitignore` (verify with `git check-ignore <path>`), and confirm the repo's build pipeline produces it (e.g. `pnpm db-worker:build` builds `static/js/db-worker.js` — CI runs it, so it never belongs in git).

## Rule 3 — Concurrent pushes: fetch, inspect, then push

Other sessions push to this branch concurrently. Before pushing:

```bash
git fetch origin
git log --oneline HEAD..origin/<branch> | head   # commits that landed meanwhile
git pull --rebase                                 # replay your commits on top — never merge remote-tracking into a stale local line
```

If push is rejected non-fast-forward, or `git log` shows commits you don't recognize, or the merge-base with the target branch looks wrong (`git merge-base HEAD origin/master` returning an ancient commit, or "multiple merge bases" warnings on diff), **stop and report** — do not merge, do not force.

## Rule 4 — Commit shape

- Imperative, concise subjects (`fix:`, `enhance(rtc):`) — see repo AGENTS.md.
- Minimal diff: stage only the files belonging to the change (`git add <file>`, never `git add .`).
- No agent/tool names anywhere in subject, body, or trailers.
