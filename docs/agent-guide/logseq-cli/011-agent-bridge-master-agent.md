# AgentBridge Master Agent Implementation Plan

Goal: Redesign `logseq agent bridge` so the CLI loop initializes a graph-scoped master agent prompt and delegates task scheduling policy to a master agent that can dispatch different subagent execution modes.

Architecture: Keep `logseq agent bridge` as the graph supervisor that resolves config, starts or reuses db-worker-node, initializes graph state, watches graph events, and holds the active master session in process memory.
Architecture: Move task scheduling policy into a master agent prompt stored in a fenced code block under the first block of the current AgentBridge name page.
Architecture: The master prompt defines subagent routing for simple tasks, read-only project tasks, and writable project tasks, while the CLI enforces graph targeting, prompt initialization, bridge locking, and graph-visible routing metadata.

Tech Stack: ClojureScript, Node `child_process` and `fs` APIs, existing Logseq CLI command parsing, db-worker-node transport, Codex CLI JSON events, Datascript queries, CLI unit tests, CLI E2E tests, and @test-driven-development.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md`.

## Problem statement

The current AgentBridge implementation starts from `logseq agent bridge` and directly routes eligible TODO `#Task` blocks assigned to the current AgentBridge name.

The current bridge stores task and comment prompt templates on the shared `AgentBridge` page.

The current bridge then starts a Codex session for each routable task or comment request.

This design works for direct task routing, but it does not give the bridge a single master agent that owns scheduling decisions across different task types.

The requested architecture changes the model so each agent has a page named by the AgentBridge name, normally the hostname.

The first block on that page is a master prompt wrapper, and its child contains the master agent prompt in a fenced markdown code block.

`logseq agent bridge` must initialize that prompt when missing.

The master prompt must describe how to classify work and how to execute subagents.

Simple tasks with no project context, such as translation, rewrite, or simple search, should run in a clean temporary directory.

Read-only project tasks, such as code review or implementation lookup, should run in the project directory without write access expectations.

Read/write project tasks, such as bug fixes or feature implementation, should default to `origin/master`, create a new branch in the project directory, and run with only one writable project subagent active at a time.

The CLI should remain responsible for the bridge loop and graph safety.

The master agent should remain responsible for task assignment and subagent strategy.

Only the master agent should write to graph content through Logseq CLI commands.

Subagents should treat graph content as read-only and return graph write requests or final report content to the master agent.

## Current implementation snapshot

All paths in this document are under `/Users/rcmerci/gh-repos/logseq`.

The primary CLI implementation is `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/agent.cljs`.

The command table integration is `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/agent.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.

The human and structured output formatting is `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.

The current unit tests are `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/agent_test.cljs`.

The current CLI E2E script is `/Users/rcmerci/gh-repos/logseq/cli-e2e/scripts/agent_bridge_e2e.py`.

The current CLI E2E manifest is `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`.

The current implementation already resolves an agent name through `resolve-agent-name`.

The current implementation already creates or keeps an agent-name page through `register-agent-bridge!`.

The current implementation initializes task and comment prompt templates through `ensure-agent-bridge-prompt-templates!` on the shared `AgentBridge` page.

The current implementation routes initial tasks through `process-tasks!` and event-driven tasks through `listen-forever!`.

The current implementation prevents duplicate routing for the same block through `routing-blocks*`.

The current implementation bounds initial task routing concurrency with `max-concurrent-routes`.

The current implementation also prevents duplicate bridge supervisors for the same CLI root dir, target graph, and AgentBridge name with a filesystem lock.

The current implementation writes bridge-owned started markers after master dispatch accepts work: tasks get an `eyes` reaction plus `status=doing` when the routed task is still `TODO`, and comment requests get an `eyes` reaction.

The current implementation marks accepted task dispatches with an `eyes` reaction; the master prompt and task dispatch prompt require the master agent to remove that reaction when a subagent finishes, whether the subagent succeeded or failed.

The new design should reuse the stable graph setup and event plumbing, then replace direct per-task Codex scheduling with a master-agent-centered dispatch path.

## Desired behavior

`logseq agent bridge --graph <graph>` resolves the target graph exactly as it does today.

The command resolves the AgentBridge name from `:agent-name` in `cli.edn` or from the hostname exactly as it does today.

The command starts or reuses the db-worker-node server for the target graph before it touches graph data.

The command ensures the agent-name page exists.

The command ensures the first live child block of the agent-name page is a master prompt wrapper block.

The master prompt wrapper block contains the prompt markdown in one child fenced code block.

If the agent-name page has no live child block, the command inserts the default master prompt wrapper as the first child block.

If the agent-name page has a first live child block whose title is `AgentBridge master prompt` and whose direct live children contain exactly one fenced prompt code block, the command treats that code fence as the configured master prompt and does not overwrite it.

If the first live child block is invalid according to the master prompt lint rules, the command fails fast with an `:agent-master-prompt-invalid` error.

The default master prompt includes the existing graph safety instructions from the current task prompt.

The default master prompt includes explicit instructions that only the master agent may write task results back into the target graph.

The default master prompt includes explicit instructions that subagents may read graph context but must not write graph content.

The default master prompt includes explicit instructions to sync the graph after writing when sync is enabled.

The default master prompt includes the task classification table for simple, read-only project, and read/write project tasks.

The default master prompt says that writable project subagents must be serialized by the master agent.

The default master prompt says that writable project subagents must start from `origin/master` and create a new branch before modifying the project.

The CLI supervisor starts one master Codex session per running bridge process and keeps that master session id in memory for dispatch.

Concurrent `codex resume <master-session>` dispatches to the same master session are supported, but they must target that single master session for the target graph and AgentBridge name.

Starting a second `logseq agent bridge` process for the same CLI root dir, target graph, and AgentBridge name fails fast with `:agent-bridge-already-running`.

If a bridge lock directory exists but `owner.edn` is missing or corrupt, the bridge treats that lock as stale, removes it, and retries acquisition.

The bridge loop sends new routable task and comment context to the master agent instead of directly starting independent task or comment Codex sessions.

Task and comment routing require an active in-process `master-session`; missing master-session state is an internal fail-fast error instead of a fallback to direct Codex routing.

Task dispatch to the master agent marks the routed task as started after the master resume is accepted and before the routing claim is released.

The started marker is bridge-owned progress metadata: add an `eyes` reaction for accepted task and comment dispatches, and set task `status=doing` only when the current task status is `TODO`.

When a task or subagent finishes, remove the task block's `eyes` reaction whether the task succeeded or failed.

The master agent decides whether to dispatch a simple, read-only project, or writable project subagent.

The master agent owns subagent prompts and assignment policy.

The master agent owns all Logseq CLI graph write operations.

The exception is bridge-owned routing/progress metadata that the CLI must write synchronously to avoid duplicate dispatch.

Subagents may receive rendered graph context and may perform read-only graph inspection when explicitly instructed, but they must not mutate graph content.

The CLI should not silently recover from malformed master prompt state.

The CLI should not add a new db-worker `:thread-api` unless the existing query, pull, and outliner operation APIs cannot express the required graph mutations.

## Proposed architecture

```text
logseq agent bridge
        |
        v
resolve graph and agent name
        |
        v
ensure db-worker-node and agent page
        |
        v
ensure first block contains master prompt code fence
        |
        v
start master Codex session
        |
        v
listen to graph events and initial TODO scan
        |
        v
send task dispatch request to master agent
        |
        v
master agent chooses subagent mode
        |
        +--> simple task in clean tmp dir
        |
        +--> read-only project task in project dir
        |
        +--> writable project task on branch from origin/master
```

The CLI is still the only component that watches db-worker-node events.

The CLI is still the only component that decides whether a graph block is assigned to the current AgentBridge name.

The CLI is still the only component that writes bridge session metadata before a Codex process has fully started.

The master agent prompt is graph data, so operators can inspect and edit scheduling policy from Logseq.

The master prompt is per agent-name page, so two machines can have different scheduling policy in the same graph.

The master agent dispatch request should include the target graph, bridge name, source block UUID, rendered block tree, request kind, project directory when available, and a reminder not to operate outside the target graph.

The master dispatch request should not include unrelated graph data.

The master dispatch request should be rendered from a deterministic built-in template to avoid depending on mutable task prompt templates.

The existing shared `AgentBridge` task and comment prompt template page should be left in place unless implementation proves it is obsolete.

This avoids a broad compatibility removal in the same change.

## Master prompt content

The default master prompt should be a markdown document with sections for role, graph safety, graph write ownership, task intake, classification, subagent execution, writable project lock, result reporting, and failure handling.

The default prompt should include this classification table.

| Task type | Examples | Working directory | Write behavior | Concurrency |
| --- | --- | --- | --- | --- |
| Simple | Translation, rewrite, small lookup, simple search | Fresh temporary directory | No project writes | Can run concurrently |
| Read-only project | Code review, code explanation, implementation lookup | Project directory | No writes | Can run concurrently |
| Read/write project | Bug fix, feature implementation, test update | Project directory on new branch from `origin/master` | Writes allowed after branch setup | Only one at a time |

The prompt should instruct the master agent to fail fast when task type is ambiguous and the consequence of choosing writable mode is material.

The prompt should instruct the master agent to serialize writable subagents with its own policy state.

The prompt should instruct the master agent to make the lock visible in graph reporting when a writable task waits.

The prompt should instruct the master agent to keep graph reports short unless a blocker occurs.

The prompt should instruct the master agent to report root cause and steps to verify only for bug fixes.

The prompt should instruct the master agent that only it can use Logseq CLI commands to write graph content.

The prompt should instruct subagents that graph content is read-only for them.

The prompt should instruct subagents to return graph updates to the master agent instead of writing them directly.

The prompt should instruct the master agent to launch task subagents with `codex exec`, capture the reported Codex session id, and write that subagent session id to the routed task block's `:logseq.property.agent/session-id` property.

The prompt should instruct the master agent to continue child task blocks and comment requests under a task with `:logseq.property.agent/session-id` in that same subagent session.

When a routed child task has a nearest parent or ancestor task with `:logseq.property.agent/session-id`, the master task dispatch prompt should include the inherited parent task UUID, inherited subagent session id, and an explicit instruction to continue in that inherited subagent session instead of launching a new subagent.

The prompt should instruct the master agent to remove the task block's `eyes` reaction when the task or subagent finishes, regardless of success or failure.

Master task dispatch prompts should carry the task result, graph sync, short report, blocker, and bugfix reporting contract from the default task prompt.

Master comment dispatch prompts should carry the comment completion contract and the reply-placement instructions from the default comment prompt.

## Data model

Do not introduce new built-in properties unless the implementation cannot satisfy session tracking with existing graph-visible properties.

The master agent must use the existing `:logseq.property.agent/session-id` for routed task blocks when it launches a concrete task subagent session.

The value stored in `:logseq.property.agent/session-id` is the subagent Codex session id, not the graph supervisor session and not the master session id.

The master agent writes this property after `codex exec` reports the subagent session id, before it treats the task dispatch as complete.

Child task blocks and comment requests that belong to a task with `:logseq.property.agent/session-id` should be routed through the same subagent session.

Do not write local session registry files for AgentBridge. In particular, do not create or update `agent-bridge-sessions.edn`.

Avoid writing opaque process state into arbitrary graph blocks unless the state must be visible to the master agent.

If graph-visible master state is required, store it under the agent-name page as normal blocks instead of creating hidden properties.

Bridge-owned started state is graph-visible by design: the CLI adds the `eyes` reaction after a successful master dispatch, and advances `TODO` tasks to `DOING` so restart or rescan cannot route the same TODO again. The `eyes` reaction is progress state, not final state, and must be removed when the task or subagent finishes.

The master agent, not the CLI supervisor, writes `:logseq.property.agent/session-id` after it launches a concrete subagent with `codex exec`.

## Testing Plan

I will add unit tests for master prompt initialization in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/agent_test.cljs`.

The tests will verify that an empty agent-name page gets a first child wrapper block containing the default master prompt code fence.

The tests will verify that an existing first child wrapper block with a valid prompt code fence is preserved and used as the master prompt.

The tests will verify that a malformed first child block fails with `:agent-master-prompt-invalid`.

The tests will verify that recycled agent-name pages and recycled first child blocks are ignored.

I will add unit tests for default master prompt content in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/agent_test.cljs`.

The tests will assert that the prompt includes graph safety instructions and the three task classification strategies.

The tests will assert that the prompt includes the writable serialization rule and the `origin/master` branch rule.

The tests will assert that the prompt says only the master agent can write graph content through Logseq CLI.

The tests will assert that the prompt says subagents treat graph content as read-only.

I will add unit tests for master dispatch prompt rendering in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/agent_test.cljs`.

The tests will render a task dispatch request with graph name, agent name, block UUID, and task block tree.

The tests will render a comment dispatch request with graph name, agent name, comment UUID, target context, comment thread context, and requesting comment tree.

The tests will assert that unrelated graph data is not present in the dispatch prompt.

I will add unit tests for bridge execution order in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/agent_test.cljs`.

The tests will verify that `execute-bridge` ensures the server, initializes the master prompt, registers the bridge, starts the in-process master session, connects the listener, and then processes the initial scan.

The tests will verify that a task event is sent to the master session rather than directly starting a task Codex session.

The tests will verify that a comment mention event is sent to the master session rather than directly starting a comment Codex session.

I will add unit tests for writable serialization policy in the default prompt.

The tests will assert that the default prompt tells the master agent to run only one writable project subagent at a time.

I will add CLI E2E coverage in `/Users/rcmerci/gh-repos/logseq/cli-e2e/scripts/agent_bridge_e2e.py`.

The E2E test will create a graph, start `logseq agent bridge`, and verify that the agent-name page contains the default master prompt code fence under its first block.

The E2E test will install a custom first-block prompt code fence on the agent-name page and verify that the bridge starts the master session with the custom master prompt.

The E2E test will route a TODO `#Task` block assigned to the AgentBridge name and verify that Codex receives a master dispatch request containing the task tree.

The E2E test will route an AgentBridge mention in a `Comment` block and verify that Codex receives a master dispatch request containing the comment context.

The E2E test will cover master prompt initialization and dispatch instead of the removed dry-run prompt preview path.

I will run the focused unit test command first.

```bash
bb dev:test -v logseq.cli.command.agent-test/test-agent-bridge-initializes-default-master-prompt
```

I will then run the complete agent command unit test namespace.

```bash
bb dev:test -v logseq.cli.command.agent-test
```

I will run the repository lint and unit test command before the E2E suites.

```bash
bb dev:lint-and-test
```

I will then run the non-sync CLI E2E suite, which performs the required build preflight.

```bash
bb dev:cli-e2e
```

I will then run the CLI sync E2E suite against the fresh build artifacts.

```bash
bb dev:cli-e2e-sync --skip-build
```

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation tasks

1. Read `/Users/rcmerci/gh-repos/logseq/AGENTS.md`.

2. Read `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/AGENTS.md`.

3. Load @logseq-cli before editing CLI code.

4. Load @test-driven-development before writing implementation behavior.

5. Add a failing unit test for creating the default master prompt on an empty agent-name page.

6. Add a failing unit test for preserving an existing first child block as the master prompt.

7. Add a failing unit test for rejecting an invalid first child block.

8. Add a failing unit test for ignoring recycled agent-name pages and recycled child blocks.

9. Add a failing unit test that asserts the default master prompt contains all three task modes.

10. Add a failing unit test that asserts the default master prompt contains the `origin/master` writable branch rule.

11. Add a failing unit test that asserts the default master prompt contains the one-writable-subagent concurrency rule.

12. Add a failing unit test for rendering a master dispatch request from a routable task.

13. Run the focused unit tests and confirm they fail for the expected missing behavior.

14. In `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/agent.cljs`, add a `default-master-agent-prompt` value.

15. Keep the prompt text in one namespace-local constant so tests can verify it without filesystem access.

16. Add a `master-agent-prompt-title` for the first child wrapper block on the agent-name page.

17. Store the prompt markdown in one child fenced code block under the wrapper block.

18. Add a query that pulls live children of the agent-name page with `:db/id`, `:block/uuid`, `:block/title`, `:block/order`, and recycle metadata.

19. Add a helper that returns the first live child block sorted by `:block/order`.

20. Add a helper that validates the master prompt wrapper title and direct child fenced prompt code.

21. Keep validation strict and fail-fast.

22. Require the default graph safety phrases to be present only for the default prompt test, not for every custom prompt.

23. Require custom master prompts to be non-blank markdown.

24. Require custom master prompts to include a small set of renderable variables only if dispatch rendering needs variable substitution.

25. Add `ensure-master-agent-prompt!` that creates the agent-name page when necessary and inserts the default prompt as the first child when no first live child exists.

26. Reuse the existing `ensure-registry-page!` pattern where it is useful, but do not force master prompt state onto the shared `AgentBridge` page.

27. Refactor `register-agent-bridge!` so agent page creation can return the live agent page entity.

28. Keep existing registration behavior for tests that expect the agent-name page to be created.

29. Update `execute-bridge` to call `ensure-master-agent-prompt!` during initialization.

30. Remove the obsolete dry-run preview path so `agent bridge` has one execution contract.

31. Add a `build-master-dispatch-prompt` helper that wraps task context for the master agent.

32. Add tests for `build-master-dispatch-prompt`.

33. Change task routing so routable task context is sent to the master session.

34. Change comment mention routing so comment context is sent to the master session.

35. Make task and comment routing fail fast when `:master-session` is missing, and remove obsolete direct routing execution paths.

36. Add master prompt tests for master-only graph writes and subagent read-only graph access.

37. Keep existing `routable-task?`, `list-routable-tasks`, event routing, and duplicate routing claims.

38. Keep the active master session id in memory and pass it through task and comment dispatch options.

39. Add tests that AgentBridge does not create `agent-bridge-sessions.edn`.

40. Remove obsolete local session-store tests and helpers.

41. Do not add CLI process locks for writable subagent serialization in the first pass; writable serialization remains a master policy rule.

42. Assert in tests that the default prompt says writable serialization is a master agent policy responsibility.

43. Run focused unit tests and make the smallest implementation pass.

44. Add the E2E test for default master prompt initialization.

45. Add the E2E test for custom first-block master prompt preservation.

46. Add the E2E test for master dispatch prompt routing.

47. Add the duplicate bridge process lock so only one bridge supervisor can run for a CLI root dir, target graph, and AgentBridge name.

48. Add E2E coverage that a duplicate bridge process fails with `:agent-bridge-already-running`.

49. Add tests that master task dispatch writes bridge-owned started metadata without writing the subagent session id.

50. Add tests that master task and comment dispatch prompts include the simplified default task/comment contract.

51. Run the E2E tests and fix only behavior covered by the failing tests.

52. Update `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md` if the public current-state guide needs to mention the new master-agent architecture.

53. Run @logseq-review-workflow on the finished change before PR handoff.

54. Commit with a concise imperative subject such as `enhance(cli): redesign agent bridge master`.

## Edge cases

An agent-name page may already exist and may be recycled.

The first child block may be recycled while a later child block is live.

The agent-name page may contain an unrelated first live child block.

The implementation should preserve that block and treat invalid prompt content as an explicit operator error.

Two `logseq agent bridge` processes may start for the same graph and agent name.

The implementation should not corrupt the first-block prompt when both processes initialize concurrently.

A bridge lock directory may outlive its `owner.edn` file, or the owner file may contain corrupt EDN.

The implementation should treat missing or unreadable lock owner data as stale so the next bridge process can recover.

Task events may arrive before the initial scan completes.

The existing `routing-blocks*` claim behavior should continue to prevent duplicate task dispatch.

The master Codex process may exit before reporting a session id.

The implementation should not write session metadata or task session ids before a session id exists.

The target graph may be sync-enabled.

The bridge prompt must continue to instruct the acting agent to sync after graph writes.

The project directory may not be a git repository.

Writable subagent instructions should fail fast in that case instead of creating an untracked fallback workflow.

The project directory may have a dirty worktree.

Writable subagent instructions should stash uncommitted changes before switching to a new branch from `origin/master`.

The prompt should tell writable subagents to report a blocker if stashing fails.

`origin/master` may not exist.

Writable subagent instructions should fail fast instead of silently using another branch.

A writable task branch name may collide with an existing branch.

The master prompt should instruct subagents to create unique branch names derived from the task id.

A task may be ambiguous between read-only and read/write.

The master prompt should instruct the master agent to choose read-only unless the task explicitly requires writes, or to ask for clarification when ambiguity blocks progress.

## Compatibility and migration

This plan does not remove the existing shared `AgentBridge` page prompt-template mechanism in the first implementation pass.

Keeping the old prompt-template path avoids mixing architecture redesign with template removal.

The new master prompt lives on the agent-name page and is independent from graph-level task and comment prompt templates.

If a later implementation removes shared task and comment templates, that removal should be a separate plan and PR.

Existing task assignment semantics should remain the same.

Existing comment mention requests should route through the master agent in the first pass.

Existing `agent bridge list` behavior should remain compatible.

New session fields should be additive.

## Testing Details

The unit tests will exercise real behavior in the agent command namespace by stubbing `transport/invoke`, Codex startup, and server startup only at process boundaries.

The unit tests will assert graph operations, generated prompts, routing calls, and session records rather than internal helper call counts alone.

The CLI E2E tests will execute the built CLI against disposable graphs and inspect graph state through CLI commands.

The E2E tests will verify that prompt initialization and task dispatch work through the same command surface that users run.

## Implementation Details

- Keep graph targeting and db-worker-node startup in the CLI supervisor.
- Store the master prompt under the first live child wrapper block on the agent-name page as one fenced code block.
- Keep the shared `AgentBridge` page prompt-template mechanism in place for this pass.
- Add strict master prompt validation with clear errors.
- Send task and comment dispatch requests to the master agent instead of directly scheduling independent task or comment agents.
- Fail fast if task or comment routing is invoked without an active `master-session`.
- Keep Logseq CLI graph writes master-only.
- Allow the CLI supervisor to write bridge-owned routing/progress metadata required for duplicate prevention.
- Keep graph content read-only for subagents.
- Keep existing duplicate routing claims for task events.
- Prevent duplicate bridge supervisor processes for the same CLI root dir, target graph, and AgentBridge name.
- Do not record AgentBridge sessions in a local EDN registry.
- Do not add a new db-worker `:thread-api` unless existing transport calls cannot express the needed graph operations.
- Treat writable project branch setup and stash failures as blockers, not recoverable defaults.
- Run focused tests first, then E2E, then full lint and unit tests.

## Question

Resolved: Use a titled wrapper block as the first block on the agent-name page, with the prompt in a child fenced code block.

Clarification: Comment mention routing is the path used when a user mentions an AgentBridge name inside a `Comment` block, like a review follow-up on an existing task.

Resolved: Comment mention routing should go through the master agent in the first pass.

Resolved: Follow-up requests from `Comment` blocks should use the same master scheduling session as assigned tasks.

Resolved: Writable subagent serialization should be enforced by master prompt policy only in the first pass.

Resolved: Each running bridge process for a target graph and AgentBridge name should have exactly one active master Codex session. Concurrent `codex resume <master-session>` calls to that same master session are supported, and the duplicate bridge lock prevents two supervisors from creating competing active master sessions for the same CLI root dir, target graph, and AgentBridge name.

Resolved: Writable project tasks should use a branch in the current project directory, and writable subagents should stash uncommitted changes before switching branches.

---
