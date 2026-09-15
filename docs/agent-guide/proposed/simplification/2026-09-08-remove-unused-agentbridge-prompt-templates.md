# Remove Unused AgentBridge Prompt Templates

## Problem

The shipped OCaml CLI contains two independent sources for AgentBridge task and
comment dispatch prompts:

- `default_task_prompt_template` and `default_comment_prompt_template`, plus a
  graph registry reader and template validator; and
- `build_master_task_dispatch_prompt` and
  `build_master_comment_dispatch_prompt`, which construct the prompts actually
  sent to the active master session.

Both production entry paths call `ensure_prompt_templates`, bind its result to
`_prompt_templates`, and discard it. `dispatch_task_to_master` and
`dispatch_comment_to_master` do not accept that result and instead call the
hard-coded `build_master_*_dispatch_prompt` functions directly. Consequently,
neither valid custom templates nor the built-in default templates can affect a
dispatched request.

The unused path still queries the AgentBridge registry page on every bridge
startup, walks nested block data, parses code fences and template variables,
maintains four template-only error codes, exposes template types and validation
through the internal OCaml module interface, and carries a self-contained
parity test. It makes the graph registry appear to offer a customization
surface that the runtime does not implement.

Repository-wide searches find no production, script, generated-source, or
documentation consumer outside `cli/lib/agent.ml`. The only non-production
consumer is the validator's parity test. `cli/package.json` is private, and the
public CLI command reference does not describe Task or Comment prompt
templates. The implemented runtime guide explicitly records that the returned
template set is discarded.

## Proposal

Remove the unused Task and Comment prompt-template path while retaining the
active, per-agent master prompt and the two dispatch prompt builders.

In `cli/lib/agent.ml`, delete:

- `template_kind`, `prompt_template`, and `prompt_templates`;
- `default_task_prompt_template` and `default_comment_prompt_template`;
- the template-variable parsing and validation helpers from `is_var_char`
  through `validate_prompt_template`;
- `task_prompt_template_title` and `comment_prompt_template_title`;
- the template-only block traversal, code-fence extraction, constructors,
  selectors, and `prompt_template_from_block` helpers;
- `prompt_template_blocks_query` and `ensure_prompt_templates`;
- both discarded `ensure_prompt_templates` calls; and
- the `checking prompt templates ...` progress message.

Remove the corresponding template types and `validate_prompt_template` value
from `cli/spec/commands/agent.mli`. Remove
`Agent_prompt_template_invalid`, `Missing_template_code_block`,
`Missing_template_vars`, and `Unknown_template_vars` from `cli/lib/error.ml`
and `cli/spec/core/error.mli` after confirming that no other command has adopted
them. Delete the self-contained prompt-template validation case from
`cli/test/cli_parity_test_cases.ml`.

Keep all master-prompt behavior: the `AgentBridge master prompt` wrapper on the
agent page, its default insertion and missing-code repair, its query and
validation, and `ensure_master_session`. Keep
`build_master_task_dispatch_prompt` and
`build_master_comment_dispatch_prompt` as the sole source of task and comment
dispatch text. Do not introduce a compatibility reader for the removed Task and
Comment template block titles.

Update the AgentBridge section of the implemented runtime guide so it no longer
describes the discarded registry templates. No other user documentation or
generated artifact references this path.

## Alternatives considered

### Connect the templates to dispatch

Rejected as a simplification because it would make previously ineffective graph
content change the prompts sent to Codex. That is a feature decision requiring
template rendering, precedence, failure behavior, and end-to-end tests.

### Replace the dispatch builders with the built-in templates

Rejected because the two representations are not equivalent. The active
builders include master-routing policy, project-directory context, inherited
task-session context, and comment reply rules that the template defaults do not
fully model. Substitution would change shipped dispatch behavior.

### Retain validation for future customization

Rejected because version control preserves the implementation, while current
source and tests should describe executable behavior. A future customization
feature should introduce one prompt source and tests that prove its output is
sent to the master session.

### Remove the per-agent master prompt

Rejected because that prompt is active: `ensure_agent_master_prompt` reads or
creates it and passes it to `ensure_master_session` when starting the master
Codex process. It is independent of the discarded Task and Comment templates.

## Acceptance criteria

- Repository-wide search finds no Task/Comment prompt-template types, defaults,
  block titles, query, parser, validator, template-only error codes, or discarded
  `ensure_prompt_templates` binding.
- AgentBridge startup no longer performs the template-only registry query or
  emits the template-check progress message.
- The per-agent master prompt is still read, validated, repaired or created,
  and passed unchanged to a newly started master session.
- Task dispatch still includes graph and agent identity, optional project
  directory, master/subagent write policy, optional inherited session context,
  task UUID and tree, completion reaction, and reporting instructions.
- Comment dispatch still includes graph and agent identity, optional project
  directory, target/thread/request context, completion and reply rules, and
  reporting instructions.
- Existing AgentBridge routing and command integration tests pass after the
  self-contained validator test is removed.
- `pnpm --dir cli test` passes.
- `bb -f cli-e2e/bb.edn test --skip-build` passes against freshly built CLI and
  db-worker-node artifacts when implementation is prepared for merge.
- `spec-dev-tool check --all` passes after the implemented runtime guide is
  updated.

## Risks

- Existing graphs may contain blocks titled `Task prompt template` or
  `Comment prompt template`. They currently do not affect dispatch, and the
  proposal intentionally stops reading them rather than preserving an
  unsupported compatibility path.
- Removing the no-op query also removes one incidental database-read failure
  point and one verbose progress line. Neither is a documented command contract;
  task routing, prompts sent to the master, graph writes, and command results
  remain unchanged.
- The removed error codes are defined in the shared CLI error type. The
  implementation must repeat the repository-wide consumer check immediately
  before deletion so concurrent work cannot have adopted them.
- AgentBridge may later need customizable task and comment prompts. That future
  feature will need to design and test an effective single source of truth
  instead of restoring this discarded parallel path unchanged.

## Questions

- None.
