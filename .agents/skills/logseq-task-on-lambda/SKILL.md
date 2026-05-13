---
name: logseq-task-on-lambda
description: Use when Codex needs to execute a task described by a Logseq block in the Lambda RTC graph. The request must provide a block UUID directly or as a double-bracket UUID reference. This skill validates sync state, fetches the target block tree with the Logseq CLI, and then completes the task described by that block.
---

# Logseq Task On Lambda

## Overview

Use this skill to turn one block in the `Lambda RTC` graph into the current task brief. Always fetch the target block and its children only after verifying that sync is open and idle.

## Required Companion Skill

Load `.agents/skills/logseq-cli/SKILL.md` before running any ad hoc `logseq` command. Use the fixed fetch script below for the initial task-block retrieval instead of rewriting the sync and `show` command sequence.

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

3. Complete the described task.
   - Follow the fetched block tree, not assumptions from the UUID or graph name.
   - If the block tree is ambiguous or not actionable, stop with a concise error instead of guessing.
   - If the task requires code edits, follow repo `AGENTS.md` files and load any matching repo-local skills before editing.
   - If the task requires Logseq graph writes, follow `logseq-cli` write rules and re-run the sync gate immediately before writes to `Lambda RTC`.

4. Report the result.
   - Mention the normalized UUID.
   - State that the sync gate passed, including `ws-state`, `pending-local`, and `pending-server`.
   - Summarize the task outcome and any verification performed.

## Fail-Fast Rules

- Use only the `Lambda RTC` graph.
- Never fetch block content before the fetch script reports a passed sync gate.
- Never silently substitute another graph, block, page, db id, or query result.
- Never mask invalid sync state with defaults.
- Stop on the first command error other than a sync status showing unopened sync, invalid JSON result, missing block, sync timeout, non-idle sync state, or non-actionable task brief.
