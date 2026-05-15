---
name: logseq-task-on-lambda
description: Use when Codex needs to execute a task described by a Logseq block in the Lambda RTC graph. The request must provide a block UUID directly or as a double-bracket UUID reference. This skill validates sync state, fetches the target block tree with the Logseq CLI, and then completes the task described by that block.
---

# Logseq Task On Lambda

## Overview

Use this skill to turn one block in the `Lambda RTC` graph into the current task brief. Always fetch the target block and its children only after verifying that sync is open and idle.

## Required Companion Skill

Load `.agents/skills/logseq-cli/SKILL.md` before running any ad hoc `logseq` command. Use the fixed fetch script below for the initial task-block retrieval instead of rewriting the sync and `show` command sequence.

If the task explicitly requests a pull request, load the matching GitHub publishing skill for the current environment, such as `github:yeet` when available, before staging, committing, pushing, or opening a PR.

## Fetch Script

Run `.agents/skills/logseq-task-on-lambda/scripts/fetch-task-block.sh UUID_OR_DOUBLE_BRACKET_UUID` from the repo root to validate the input, verify the `Lambda RTC` sync gate, and fetch the target block tree.

- Pass exactly one bare UUID or one double-bracket UUID reference.
- Treat stdout as the complete task block tree.
- Read stderr for the normalized UUID and sync gate summary.
- Stop on any non-zero exit status.
- The script always targets `Lambda RTC`, runs `sync start` at most once when sync is not open, polls status for up to 20 seconds, requires numeric zero `pending-local` and `pending-server`, validates the structured `show` result, then prints the human block tree.

## Workflow

1. Validate the input.
   - Accept exactly one UUID in either bare form, such as `11111111-1111-1111-1111-111111111111`, or double-bracket form, such as `[[11111111-1111-1111-1111-111111111111]]`.
   - Strip surrounding whitespace.
   - Reject page names, db ids, block refs with extra text, multiple UUIDs, malformed UUIDs, and empty input.
   - Do not infer a fallback target.

2. Fetch the task block tree with the fixed script.
   - Run `.agents/skills/logseq-task-on-lambda/scripts/fetch-task-block.sh "$input"`.
   - Do not manually reproduce the sync gate or `show` sequence unless the script itself is being debugged or updated.
   - Do not fetch block content before this script succeeds.
   - Treat the script stdout root block and children as the complete task description.

3. Mark the task as DOING.
   - Immediately after the fetch script succeeds and before doing the described work, update the fetched root block status to `doing`.
   - Use the normalized UUID from the fetch script stderr: `logseq upsert task --graph "Lambda RTC" --uuid "$normalized_uuid" --status doing`.
   - Follow `logseq-cli` write rules and re-run the sync gate immediately before writing to `Lambda RTC`.
   - Stop if the root block cannot be updated as a task.

4. Record reproducibility for bug and regression tasks.
   - If the fetched task block or its children clearly identify the task as a bug or regression, update the fetched root block's `Reproducible?` property with one exact choice: `Not sure`, `Yes`, or `No`.
   - Use `Yes` if the issue was reproduced, `No` if reproduction was actively attempted and failed, and `Not sure` if reproduction was not attempted or the evidence is insufficient.
   - If the value is not known before doing the described work, set `Reproducible?` to `Not sure` first; if later evidence changes the value, update it before adding the completion summary.
   - Use the exact property name string key and a string choice value: `logseq upsert block --graph "Lambda RTC" --uuid "$normalized_uuid" --update-properties "{\"Reproducible?\" \"$reproducible_value\"}"`.
   - Follow `logseq-cli` write rules and re-run the sync gate immediately before writing to `Lambda RTC`.
   - Do not update `Reproducible?` for idea or enhancement tasks.
   - Stop if a clear bug or regression task cannot be updated with one of the exact `Reproducible?` choices.

5. Complete the described task.
   - Follow the fetched block tree, not assumptions from the UUID or graph name.
   - If the block tree is ambiguous or not actionable, stop with a concise error instead of guessing.
   - If the task requires code edits, follow repo `AGENTS.md` files and load any matching repo-local skills before editing.
   - If the task requires Logseq graph writes, follow `logseq-cli` write rules and re-run the sync gate immediately before writes to `Lambda RTC`.

6. Generate the PR title and git branch name before optional PR creation.
   - Do this only when the fetched task block or the user's current request explicitly asks for a pull request.
   - Generate both values after completing the described task and before staging, committing, pushing, or opening a PR.
   - Follow the repo `AGENTS.md` PR title format: `feat|enhance|fix(<module>): <short description>`.
   - Choose the PR type from the task outcome: use `fix` for bug or regression tasks, `enhance` for improvements to existing behavior, and `feat` for new behavior.
   - Generate a concise, lowercase, hyphenated git branch name with the `codex/` prefix unless the user explicitly asks for a different branch prefix.
   - Reuse the generated PR title and branch name in the GitHub publishing workflow.

7. Optionally create a pull request.
   - Default behavior is to not create a PR.
   - Create a PR only when the fetched task block or the user's current request explicitly asks for one.
   - For bug or regression tasks with an existing GitHub issue URL in the fetched task block, its properties, or its children, preserve that issue URL before overwriting any task property with the PR URL.
   - For those bug or regression PRs, make the commit message mention the linked issue with `fix $github_issue_url`, for example `fix https://github.com/logseq/db-test/issues/1`.
   - Use the linked GitHub issue URL, not the newly created PR URL, in the `fix ...` line.
   - When creating a PR, follow the loaded GitHub publishing workflow for branch, staging, commit, push, and PR creation.
   - Prefer a draft PR unless the task explicitly asks for a ready PR.
   - After a PR is created, update the fetched root block's `GitHub Url` property to the PR URL before adding the completion summary.
   - Use the exact property name string key: `logseq upsert block --graph "Lambda RTC" --uuid "$normalized_uuid" --update-properties "{\"GitHub Url\" \"$pr_url\"}"`.
   - Follow `logseq-cli` write rules and re-run the sync gate immediately before writing to `Lambda RTC`.
   - Stop if PR creation succeeds but the `GitHub Url` property cannot be updated.
   - Include the PR URL in the final report.
   - Stop if PR creation is explicitly requested but cannot be completed safely.

8. Add a completion summary under the task block.
   - When the described work is finished, create a `Summary:` child block under the fetched root block before changing the final task status.
   - Use the normalized UUID as the parent target for the top-level summary block: `logseq upsert block --graph "Lambda RTC" --target-uuid "$normalized_uuid" --content "Summary:"`.
   - Write the summary as an outline-style block tree with nested child blocks, not as a long single block.
   - Add concise nested sections under `Summary:` for the useful parts of the outcome, such as `Outcome`, `Changes`, `Verification`, `PR`, `Evidence`, `How It Works`, `Edge Cases and Open Questions`, or `Practical Takeaways`.
   - Keep the block tree proportional to the task; include concrete file paths, namespaces, command names, runtime surfaces, observed behavior, and verification results when they support the summary.
   - Do not write vague summaries such as only "Completed the task", "Answered the question", or "Investigated the codebase".
   - Format code and technical terms with Markdown where appropriate, including backticks for code symbols, namespaces, file paths, commands, properties, keywords, and literal values.
   - Use additional `logseq upsert block --graph "Lambda RTC" --target-uuid "$summary_or_section_uuid" --content "$child_content"` calls to create the nested summary blocks.
   - Do not include the PR URL in the summary child block.
   - Stop if the summary block cannot be created.

9. Mark the task as in review.
   - After the summary child block is created, update the fetched root block status to `in-review`.
   - Use the normalized UUID from the fetch script stderr: `logseq upsert task --graph "Lambda RTC" --uuid "$normalized_uuid" --status in-review`.
   - Follow `logseq-cli` write rules and re-run the sync gate immediately before writing to `Lambda RTC`.
   - Stop if the root block cannot be updated as a task.

10. Report the result.
   - Mention the normalized UUID.
   - State that the sync gate passed, including `ws-state`, `pending-local`, and `pending-server`.
   - State that the task status was moved to `doing`, a completion summary was added, and the task status was moved to `in-review`.
   - For `logseq-answer-machine` tasks, state that the completion summary was written as a specific Markdown block tree.
   - State which `Reproducible?` choice was recorded for a bug or regression task, or that it was skipped because the task was not a bug or regression.
   - If a PR was explicitly requested and created, include the PR URL and state that the `GitHub Url` property was updated. For bug or regression PRs with a linked GitHub issue, state that the commit message mentioned `fix $github_issue_url`. If no PR was requested, do not create one.
   - Summarize the task outcome and any verification performed.

## Fail-Fast Rules

- Use only the `Lambda RTC` graph.
- Never fetch block content before the fetch script reports a passed sync gate.
- Never silently substitute another graph, block, page, db id, or query result.
- Never mask invalid sync state with defaults.
- Never create a pull request unless the fetched task block or the user's current request explicitly asks for one.
- Never leave a created PR unrecorded on the fetched root block's `GitHub Url` property.
- Never overwrite a bug or regression task's linked GitHub issue URL before preserving it for the commit message.
- Never create a bug or regression PR for a task with a linked GitHub issue URL unless the commit message mentions `fix $github_issue_url`.
- Never set `Reproducible?` for idea or enhancement tasks.
- Never use boolean values for `Reproducible?`; it is a default property with exact choices `Not sure`, `Yes`, and `No`.
- Never skip recording one exact `Reproducible?` choice for a fetched task that is clearly a bug or regression.
- Never skip the `doing` status write, completion summary child block, or final `in-review` status write when the described task completes successfully.
- Never flatten the completion summary into a vague single block; write the specific summary as a Markdown outline block tree.
- Stop on the first command error other than a sync status showing unopened sync, invalid JSON result, missing block, sync timeout, non-idle sync state, or non-actionable task brief.
