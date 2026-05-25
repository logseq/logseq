---
name: logseq-review-workflow-eval
description: Compare two revisions of the Logseq logseq-review-workflow skill by running the same review prompt against isolated before and after skill snapshots, collecting both outputs, and producing a structured delta. Use when evaluating whether changes to .agents/skills/logseq-review-workflow improved review quality, coverage, validation rigor, subagent orchestration, or false-positive rate.
---

# Logseq Review Workflow Eval

## Overview

Use this skill to evaluate behavior changes in `.agents/skills/logseq-review-workflow` without leaking the intended outcome into the review runs. Keep the review target and prompt identical, isolate each skill revision into its own snapshot, run fresh agents with the same settings, then compare the returned findings and verification discipline.

## Inputs

Collect these before running the evaluation:

- **Before revision**: a git ref, commit, tag, or branch that contains the old `logseq-review-workflow` skill.
- **After revision**: usually the current working tree; use a git ref only when comparing two committed revisions.
- **Review prompt**: the exact user prompt to run against both skill revisions. Include the same patch, commit range, PR description, or changed-file scope for both runs.
- **Run settings**: model, reasoning effort, available tools, repository state, and whether subagents are available.

Use realistic review prompts. Prefer prompts that exercise the specific area changed in `logseq-review-workflow`, such as routing rules, validation requirements, pass aggregation, or no-findings handling.

## Workflow

1. Read the root `AGENTS.md`.
2. Prepare isolated snapshots:

   ```bash
   python .agents/skills/logseq-review-workflow-eval/scripts/setup_eval.py \
     --before-ref <old-ref> \
     --prompt-file <review-prompt.md> \
     --case-name <short-case-name>
   ```

   Add `--after-ref <new-ref>` only when the after revision should come from git instead of the current working tree.

3. Run the generated `run-before.md` prompt in a fresh agent or fresh thread. Save the full response as `outputs/before.md`.
4. Run the generated `run-after.md` prompt in another fresh agent or fresh thread with the same model and tool availability. Save the full response as `outputs/after.md`.
5. Compare outputs:

   ```bash
   python .agents/skills/logseq-review-workflow-eval/scripts/compare_outputs.py \
     --before <eval-dir>/outputs/before.md \
     --after <eval-dir>/outputs/after.md \
     --out <eval-dir>/comparison.md
   ```

6. Add qualitative judgment using `references/evaluation-rubric.md` when the deterministic comparison is not enough.

## Evaluation Rules

- Do not tell either run what changed in the skill or what result is expected.
- Do not let the before run read the after snapshot, after output, or comparison notes.
- Do not let the after run read the before output before it completes.
- Use the same review target and prompt text for both runs, except for the explicit skill snapshot path.
- Preserve raw outputs. Do not edit them before comparison.
- Treat more findings as better only when the added findings are concrete, correctly scoped, and validated.
- Treat stricter verification as better only when it is feasible and does not fabricate unrun checks.
- Flag regressions where the after output loses a real finding, adds speculative noise, skips required rule routing, or claims unperformed runtime validation.

## Output

Return:

- Snapshot paths and git refs used.
- Commands or agent prompts used to run both sides.
- `comparison.md` location.
- A concise conclusion: improved, regressed, mixed, or inconclusive.
- The specific evidence behind that conclusion, including changed findings, validation quality, and any run limitations.

## Resources

- `scripts/setup_eval.py`: create isolated before/after snapshots and prompt files for both runs.
- `scripts/compare_outputs.py`: summarize structural differences between two raw review outputs.
- `references/evaluation-rubric.md`: qualitative scoring criteria for review-output quality.
