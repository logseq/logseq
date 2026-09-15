# Remove Unused AgentBridge Prompt Templates

## Problem

AgentBridge had two independent task/comment prompt sources: registry-backed
prompt templates with defaults and validation, and the active master dispatch
builders. Both bridge entry paths loaded templates and discarded the result.
Only `build_master_task_dispatch_prompt` and
`build_master_comment_dispatch_prompt` supplied dispatched text.

The unused path queried the registry at startup, traversed blocks, extracted
code fences, validated variables, and maintained four error codes and a parity
test. It suggested a customization surface that could not affect dispatch.
Repository-wide consumer searches confirmed that no other production, script,
or interface consumer depended on these template helpers or error codes.

## Decision

The unused Task/Comment prompt-template path is removed from `cli/lib/agent.ml`:

- template types and default task/comment templates;
- variable parsing, validation, and template-only helpers;
- template block titles, code-fence extraction, lookup, and registry query;
- `ensure_prompt_templates` and both discarded calls; and
- the template-check progress message.

The corresponding types and validator are removed from
`cli/spec/commands/agent.mli`. Template-only errors are removed from
`cli/lib/error.ml` and `cli/spec/core/error.mli`:
`Agent_prompt_template_invalid`, `Missing_template_code_block`,
`Missing_template_vars`, and `Unknown_template_vars`. The self-contained
validator parity test is removed.

The per-agent master prompt remains active and unchanged. Startup reads and
validates the `AgentBridge master prompt` wrapper, creates its default when
absent, repairs missing code, and passes the prompt to `ensure_master_session`.
Shared child ordering and code-tag helpers remain because this active path uses
them.

The two master dispatch builders remain the sole task/comment prompt source.
They preserve graph and agent identity, project-directory context, master and
subagent write policy, inherited task sessions, task trees, comment context,
completion reactions, reply rules, and reporting instructions.

The implemented runtime guide now describes this active path. Existing registry
Task/Comment template blocks are left as graph data and are no longer read.
There is no compatibility reader, migration, or alternative dispatch mode.

## Alternatives considered

### Rejected approaches

- Connecting registry templates to dispatch would make previously ineffective
  graph content change dispatched prompts and requires a separate feature
  design with rendering, precedence, and runtime tests.
- Replacing active builders with the unused defaults would lose master-routing,
  project-directory, inherited-session, and reply policy context.
- Keeping unused validation for future customization preserves an unsupported
  parallel model; its history remains in version control.
- Removing the per-agent master prompt would change active runtime behavior.

## Consequences

### Verification

- Searches of production code, interfaces, and tests find no template types,
  defaults, titles, parser, validator, query, error codes, or discarded calls.
- Source comparison confirms that `default_master_prompt`,
  `master_prompt_from_block`, `ensure_agent_master_prompt`,
  `ensure_master_session`, and both dispatch builders remain unchanged.
- `pnpm --dir cli test`: 238 tests pass, including AgentBridge routing and
  command integration coverage.
- Fresh CLI and db-worker-node builds completed;
  `bb -f cli-e2e/bb.edn test --skip-build` passes all 94 cases, including
  `agent-bridge-workflows` for assignment, parallel tasks, duplicate bridges,
  comments, and the demo flow.
- `dune build @all`, OCaml formatting checks, and `bb lint:large-vars` pass.
- The removed console progress line is outside `.i18n-lint.toml` scope; no
  translation dictionary change is needed.

### Operational risks

Startup performs fewer registry reads and no longer emits the unused template
progress line. Task routing, graph writes, dispatched prompts, and command
results retain their active behavior. Future task/comment customization needs
an effective single prompt source with runtime coverage rather than restoration
of the discarded path.
