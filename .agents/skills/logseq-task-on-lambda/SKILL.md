---
name: logseq-task-on-lambda
description: Use when Codex needs to execute a task described by a Logseq block in the Lambda RTC graph. The request must provide a block UUID directly or as a double-bracket UUID reference. This skill validates sync state, fetches the target block tree with the Logseq CLI, and then completes the task described by that block.
---

# Logseq Task On Lambda

## Overview

Use this skill to turn one block in the `Lambda RTC` graph into the current task brief. Always fetch the target block and its children only after verifying that sync is open and idle.

## Required Companion Skill

Load `.agents/skills/logseq-cli/SKILL.md` before running any `logseq` command. Follow that skill's command policy: inspect live help and examples before relying on command flags.

## Workflow

1. Validate the input.
   - Accept exactly one UUID in either bare form, such as `11111111-1111-1111-1111-111111111111`, or double-bracket form, such as `[[11111111-1111-1111-1111-111111111111]]`.
   - Strip surrounding whitespace.
   - Reject page names, db ids, block refs with extra text, multiple UUIDs, malformed UUIDs, and empty input.
   - Do not infer a fallback target.

2. Prepare the CLI commands.
   - Run `logseq sync status --help`.
   - Run `logseq sync start --help`.
   - Run `logseq show --help`.
   - Run `logseq example show`.
   - Use `--graph "Lambda RTC"` for every graph command.

3. Verify the sync gate before fetching content.
   - Run `logseq sync status --graph "Lambda RTC" --output json`.
   - Fail unless the command succeeds and the top-level JSON `status` is `ok`.
   - If `data.ws-state` is not `open` or `data.graph-id` is missing or empty, run `logseq sync start --graph "Lambda RTC"` once.
   - After `sync start`, poll `logseq sync status --graph "Lambda RTC" --output json` until sync is complete or 20 seconds elapse.
   - Treat sync as complete only when `data.ws-state` is `open`, `data.graph-id` is present and non-empty, `data.pending-local` is numeric `0`, and `data.pending-server` is numeric `0`.
   - Treat `data.pending-server` as pending remote ops.
   - Fail if `data.last-error` is present and non-null.
   - Treat missing, renamed, null, stringified, or non-numeric sync counters as invalid state.
   - Fail if `sync start` fails, if any status poll returns invalid JSON or top-level `status` other than `ok`, or if the 20 second timeout expires before sync is complete.
   - Do not run `sync stop`, `sync upload`, or `sync download` as a fallback unless the user explicitly asks for sync control.

4. Fetch the task block tree.
   - Run `logseq show --graph "Lambda RTC" --uuid "$uuid" --level 100`.
   - Use `--output json` when structured parsing is needed; otherwise prefer human output because it is easier to read as a task brief.
   - Fail if the command fails, returns no root block, or returns a block tree that does not include the target block content.
   - Treat the fetched root block and children as the complete task description.

5. Complete the described task.
   - Follow the fetched block tree, not assumptions from the UUID or graph name.
   - If the block tree is ambiguous or not actionable, stop with a concise error instead of guessing.
   - If the task requires code edits, follow repo `AGENTS.md` files and load any matching repo-local skills before editing.
   - If the task requires Logseq graph writes, follow `logseq-cli` write rules and re-run the sync gate immediately before writes to `Lambda RTC`.

6. Report the result.
   - Mention the normalized UUID.
   - State that the sync gate passed, including `ws-state`, `pending-local`, and `pending-server`.
   - Summarize the task outcome and any verification performed.

## Fail-Fast Rules

- Use only the `Lambda RTC` graph.
- Never fetch block content before the sync gate passes.
- Never silently substitute another graph, block, page, db id, or query result.
- Never mask invalid sync state with defaults.
- Stop on the first command error other than a sync status showing unopened sync, invalid JSON result, missing block, sync timeout, non-idle sync state, or non-actionable task brief.
