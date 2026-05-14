---
name: logseq-answer-machine
description: Answer user questions about the Logseq repository by researching source code, docs, tests, runtime behavior, and local tools. Use when Codex needs to explain how Logseq works, why behavior happens, where logic lives, how CLI/Desktop/Web flows interact, or what evidence supports an answer, without implementing features or fixing bugs.
---

# Logseq Answer Machine

Use this skill to answer questions from the Logseq repo itself. Produce evidence-backed explanations, not product changes.

## Guardrails

- Do not implement features, fix bugs, refactor code, create migrations, or make permanent behavior changes while using this skill.
- Default to read-only investigation: source search, file reading, docs, tests, command output, REPL probes, and UI observation.
- If a question turns into an implementation or bugfix request, stop using this skill and switch to the appropriate implementation/debug workflow.
- If any temporary edit is necessary for exploration, keep it minimal, explain why it is needed, avoid user data, and revert it after the question has been explored.
- Revert every exploration-time modification before the final answer. Do not leave temporary logs, probes, config changes, generated debug files, or test edits in the worktree.
- Respect all applicable `AGENTS.md` files before any file edit, including temporary logs.
- Clearly separate observed facts, source-backed conclusions, runtime experiment results, and inference.

## Investigation Workflow

1. Restate the question as the exact behavior, subsystem, or data flow to explain.
2. Read root `AGENTS.md` and any relevant directory-specific `AGENTS.md` files for touched paths.
3. Locate evidence with fast repo search:
   - Use `rg` or `rg --files` for symbols, namespaces, routes, commands, UI labels, config keys, schema keywords, and tests.
   - Prefer primary repo evidence: source files, tests, docs, migrations, EDN config, package manifests, and scripts.
   - Use git history only when the question asks about intent, regression timing, or historical behavior.
4. Build a concise evidence map:
   - owning namespace/file
   - caller/callee chain or data flow
   - relevant tests and fixtures
   - docs or agent-guide references
   - runtime surface: CLI, Desktop renderer, Electron main, db-worker-node, web app, server/worker, or mobile
5. Run experiments only when static evidence is insufficient or the user asks for runtime confirmation.
6. Answer in outline form with file and command references precise enough for another engineer to verify.

## Runtime Experiments

Choose the narrowest tool that can verify the claim.

- **CLI behavior**: Load `.agents/skills/logseq-cli/SKILL.md` before running or interpreting `logseq` commands. Use disposable graphs or explicit user-approved graph paths for mutating commands.
- **Desktop, renderer, Electron, or db-worker-node internals**: Load `.agents/skills/logseq-repl/SKILL.md` and use the correct REPL target for focused probes.
- **Web app behavior**: Use the `Chrome` skill when browser cookies/profile state or the web UI is needed.
- **Desktop UI behavior**: Use the `computer-use` skill when the local Desktop app window must be operated directly.
- **Temporary logging**: Add only targeted logs when REPL/UI observation cannot expose the needed state. Revert all logging changes and re-check the diff before finalizing.

Record exact commands, REPL expressions, UI steps, and observed outputs when they materially support the answer. If a relevant experiment cannot run, state the blocker and do not present the claim as verified.

## Answer Format

Produce the final answer as a detailed outline. Keep it proportional to the question, but include these sections when useful:

```markdown
1. Short Answer
   - Direct conclusion in one or two bullets.

2. Evidence
   - `path/to/file.ext:line`: what this proves.
   - command or REPL probe: observed result.

3. How It Works
   - Step-by-step control flow, data flow, state transition, or runtime interaction.

4. Runtime Verification
   - What was tested through CLI, REPL, Chrome, or Desktop UI.
   - What could not be tested and why.
   - Whether any temporary modifications were made and confirmation that they were reverted.

5. Edge Cases and Open Questions
   - Important limitations, ambiguity, or repo areas not covered.

6. Practical Takeaways
   - Where to look next, which tests cover it, or what constraints matter.
```

Use the active conversation language for explanatory prose, while keeping code, identifiers, file paths, command names, and quoted repo text exact.
