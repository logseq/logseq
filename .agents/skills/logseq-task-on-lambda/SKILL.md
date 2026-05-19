---
name: logseq-task-on-lambda
description: Use when Codex needs to execute or continue a task described by a Logseq block in the Lambda RTC graph. The request may provide a block UUID directly or as a double-bracket UUID reference; when no UUID is provided, discover TODO tasks from today's Journal Page, ask the user which one to run, and then continue with the selected UUID. This skill validates sync state, fetches the target block tree with the Logseq CLI, handles in-review tasks with TODO #agent-steer guidance blocks, and then completes the task described by the active block tree.
---

# Logseq Task On Lambda

Use one block in the `Lambda RTC` graph as the current task brief. The parent agent owns every `Lambda RTC` read, write, sync gate, selection prompt, and orchestration step. Load `.agents/skills/logseq-cli/SKILL.md` in the parent before running any ad hoc `logseq` command against `Lambda RTC`.

If the task explicitly requests a pull request, load the matching GitHub publishing skill for the current environment before staging, committing, pushing, or opening a PR.

## Selection and Fetch Scripts

When the user does not provide a UUID, run `.agents/skills/logseq-task-on-lambda/scripts/list-today-todo-tasks.sh` from the repo root. Pass no arguments.

The list script targets only `Lambda RTC`, starts sync at most once, waits up to 20 seconds for `ws-state=open`, `pending-local=0`, and `pending-server=0`, queries TODO tasks whose `:block/page` is today's Journal Page, validates the structured query result, prints numbered candidates with UUIDs, then runs `logseq show --graph "Lambda RTC" --uuid "$uuid" --level 100` for every candidate and prints each full block tree to stdout. It prints the journal day plus sync gate summary to stderr. Stop on any non-zero exit status. If no TODO tasks are found, report that and stop unless the user provides a UUID.

Run `.agents/skills/logseq-task-on-lambda/scripts/fetch-task-block.sh UUID_OR_DOUBLE_BRACKET_UUID` from the repo root. Pass exactly one bare UUID or one double-bracket UUID reference.

The script validates the input, targets only `Lambda RTC`, starts sync at most once, waits up to 20 seconds for `ws-state=open`, `pending-local=0`, and `pending-server=0`, validates the structured `show` result, prints the human block tree to stdout, and prints the normalized UUID plus sync gate summary to stderr. Stop on any non-zero exit status. Do not fetch block content before this script succeeds.

## Shared Write Rules

For every parent-owned `Lambda RTC` write:

- Re-run the sync gate immediately before writing and follow `logseq-cli` write rules.
- Use the normalized UUID reported by the fetch script unless the step names a preserved child UUID.
- Stop on command errors, ambiguous targets, invalid JSON, missing blocks, sync timeout, non-idle sync state, or non-actionable task briefs.
- Never substitute another graph, block, page, db id, or query result.

## Workflow

1. Resolve the task UUID and fetch the task block tree.
   - If the request includes one UUID, accept only bare form, such as `11111111-1111-1111-1111-111111111111`, or double-bracket form, such as `[[11111111-1111-1111-1111-111111111111]]`.
   - If the request includes no UUID, run the list script, present the numbered TODO task candidates to the user, and ask which task to solve. Accept only one listed index or one listed UUID from the user's answer.
   - Reject page names, db ids, block refs with extra text, multiple UUIDs, malformed UUIDs, empty answers, and answers that do not select exactly one listed task.
   - After resolving one UUID, run the fetch script and treat stdout as the complete root block tree.
   - Read stderr for `normalized-uuid` and `sync-gate`.

2. Select the active task brief.
   - If the fetched root task is not `in-review`, use the fetched root block tree as the brief.
   - If the root task is `in-review`, continue only from child block-trees whose root block has both `#agent-steer` and `TODO`.
   - Preserve every selected `#agent-steer` TODO UUID for later status updates.
   - If the fetched text does not expose the needed steer UUIDs or task statuses, re-run the sync gate and perform the smallest structured `logseq` read needed to identify them.
   - Stop if an `in-review` task has no actionable `#agent-steer` TODO block-tree or the matches are ambiguous.

3. Move the root task to `doing`.
   - Run `logseq upsert task --graph "Lambda RTC" --uuid "$normalized_uuid" --status doing`.
   - Stop if the root block cannot be updated as a task.

4. Record `Reproducible?` for bug and regression tasks.
   - For clear bug or regression tasks, set the root block property to exactly one string choice: `Not sure`, `Yes`, or `No`.
   - Use `Yes` when reproduced, `No` when reproduction was actively attempted and failed, and `Not sure` when reproduction was not attempted or evidence is insufficient.
   - If unknown before implementation, write `Not sure` first and update it before the completion summary if later evidence changes the answer.
   - Use `logseq upsert block --graph "Lambda RTC" --uuid "$normalized_uuid" --update-properties "{\"Reproducible?\" \"$reproducible_value\"}"`.
   - Skip idea and enhancement tasks. Stop if a clear bug or regression task cannot be updated with one exact choice.

5. Delegate implementation to a worker subagent.
   - Spawn a worker subagent; do not complete this step locally.
   - Keep all `Lambda RTC` graph work in the parent, including fetches, sync gates, status updates, `Reproducible?`, PR metadata writes, completion summaries, completed steer status updates, and final `in-review`.
   - Give the worker the active brief, full fetched block tree, normalized UUID, repo path, branch/worktree state, and the parent/worker boundary.
   - Require the worker to load task-required skills in its own context, including skills named by `agent-skills`, repo-local skills required by touched files, and `.agents/skills/logseq-cli/SKILL.md` only when the task itself needs non-`Lambda RTC` Logseq CLI work.
   - Instruct the worker to avoid all `Lambda RTC` reads, writes, syncs, and communication; report any needed `Lambda RTC` operation back to the parent.
   - Instruct the worker to follow the active brief, respect repo `AGENTS.md`, preserve others' edits, and avoid assumptions from the UUID or graph name.
   - Require the final report to list loaded skills, files changed, non-`Lambda RTC` Logseq CLI operations, requested `Lambda RTC` operations, verification, completed `#agent-steer` UUIDs, and blockers.
   - Stop if the worker cannot be spawned, touches `Lambda RTC`, skips required skills, returns an ambiguous result, or reports that the task is not actionable.

6. Close handled `#agent-steer` guidance.
   - Only for roots that started as `in-review`, mark every completed selected steer block as `done` before adding the completion summary.
   - Use `logseq upsert task --graph "Lambda RTC" --uuid "$agent_steer_uuid" --status done`.
   - Mark only steer blocks whose instructions were actually completed. Stop if any handled steer block cannot be updated as a task.

7. Create a PR only when explicitly requested.
   - Default to no PR.
   - If requested, generate the PR title and branch name after implementation and before staging. Follow `feat|enhance|fix(<module>): <short description>` and use a lowercase `codex/` branch unless the user asked otherwise.
   - Use `fix` for bug or regression tasks, `enhance` for improvements to existing behavior, and `feat` for new behavior.
   - For bug or regression tasks with an existing GitHub issue URL, preserve the issue URL before writing any PR URL and include `fix $github_issue_url` in the commit message.
   - Follow the loaded GitHub publishing workflow; prefer a draft PR unless the task asks for ready.
   - After PR creation, update the root block property with `logseq upsert block --graph "Lambda RTC" --uuid "$normalized_uuid" --update-properties "{\"GitHub Url\" \"$pr_url\"}"`.
   - Stop if explicit PR creation cannot be completed safely or a created PR cannot be recorded in `GitHub Url`.

8. Add a completion summary.
   - Before final status change, create a `Summary:` child block with `logseq upsert block --graph "Lambda RTC" --target-uuid "$normalized_uuid" --content "Summary:"`.
   - Write a proportional Markdown outline block tree with useful sections such as `Outcome`, `Changes`, `Verification`, `PR`, `Evidence`, `How It Works`, `Edge Cases and Open Questions`, or `Practical Takeaways`.
   - Include concrete file paths, namespaces, commands, runtime surfaces, observed behavior, and verification results when useful.
   - Use Markdown backticks for code symbols, namespaces, file paths, commands, properties, keywords, and literal values.
   - Do not write a vague single-block summary and do not include the PR URL in the summary child block.
   - Stop if the summary block cannot be created.

9. Move the root task to `in-review`.
   - Run `logseq upsert task --graph "Lambda RTC" --uuid "$normalized_uuid" --status in-review`.
   - Stop if the root block cannot be updated as a task.

10. Report the result.
   - Include the normalized UUID and sync gate values: `ws-state`, `pending-local`, and `pending-server`.
   - If the UUID was selected from today's Journal Page, state which listed task was selected.
   - State that the root moved to `doing`, a completion summary was added, and the root moved to `in-review`.
   - State that step 5 was completed by a worker subagent, list the worker-reported skills, and confirm the parent handled all `Lambda RTC` graph interactions.
   - Report selected `#agent-steer` TODO UUIDs moved to `done`, or state that no steer guidance was completed.
   - Report the `Reproducible?` choice for bug or regression tasks, or state that it was skipped.
   - If a PR was created, include the PR URL, confirm `GitHub Url` was updated, and for linked bug/regression issues confirm the commit message mentioned `fix $github_issue_url`.
   - Summarize the outcome and verification performed.

## Hard Stops

- Never fetch the selected block tree before the fetch script reports a passed sync gate.
- Never run no-UUID discovery from anywhere except today's Journal Page TODO list in `Lambda RTC` after the list script reports a passed sync gate.
- Never redo a whole `in-review` root task when actionable `#agent-steer` TODO guidance exists.
- Never create a PR unless the active task brief or current user request explicitly asks for one.
- Never leave a created PR unrecorded on the root block's `GitHub Url` property.
- Never set `Reproducible?` for idea or enhancement tasks, use boolean values, or skip it for a clear bug or regression task.
- Never delegate `Lambda RTC` graph reads, writes, sync gates, or orchestration writes to the worker.
- Never skip the `doing` status write, completion summary child block, or final `in-review` status write after successful completion.
