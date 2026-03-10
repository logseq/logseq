# M24: E2B Sandbox Runtime Provider (Default Runtime)

Status: Proposed
Target: Add a first-class `e2b` runtime provider and make `e2b` the default runtime for new agent sessions.

## Goal
Support `AGENT_RUNTIME_PROVIDER=e2b` end-to-end so sessions can provision E2B sandboxes, persist/restore workspace state, use template-based startup, and support browser terminal access.

## Why M24
- E2B supports sandbox persistence and resume semantics that align with long-running agent sessions and interruption recovery.
- E2B supports template-based environments, which reduces startup setup time and improves reproducibility.
- E2B exposes PTY APIs for interactive terminals, which can be used to provide browser terminal capabilities.
- Moving the default runtime to `e2b` gives a single hosted default while preserving explicit fallback providers.

## Inputs
- E2B docs root: `https://e2b.dev/docs`
- E2B quickstart (`E2B_API_KEY`, sandbox creation): `https://e2b.dev/docs/quickstart`
- E2B sandbox persistence: `https://e2b.dev/docs/sandbox/persistence`
- E2B interactive PTY terminal docs: `https://e2b.dev/docs/sandbox/pty`
- E2B template quickstart: `https://e2b.dev/docs/template/quickstart`
- E2B JS SDK sandbox reference (`Sandbox.create/connect/getHost/createSnapshot`, `commands`, `pty`): `https://e2b.dev/docs/sdk-reference/js-sdk/v2.0.1/sandbox`

## Scope
1) Add `E2BProvider` under `src/logseq/agents/runtime_provider.cljs` implementing runtime lifecycle:
- `<provision-runtime!`
- `<open-events-stream!`
- `<send-message!`
- `<open-terminal!`
- `<snapshot-runtime!`
- `<terminate-runtime!`
2) Add E2B snapshot persistence flow:
- create snapshots from runtime
- restore from `:sandbox-checkpoint` on reprovision
- persist E2B snapshot metadata in runtime/session state
3) Add E2B template support:
- choose template from env/config (`E2B_TEMPLATE`)
- allow explicit template overrides where appropriate
4) Keep git push parity for E2B runtime.
5) Make `e2b` the default runtime provider and keep `local-runner` as the only alternate runtime:
- when `AGENT_RUNTIME_PROVIDER` is unset
- in `worker/wrangler.agents.toml` local/staging/prod defaults
6) Add config/env plumbing and docs for E2B credentials/options.

## Out of Scope
- Cross-provider snapshot migration.
- New user-facing UI for selecting templates/snapshots.

## Workstreams

### WS1: E2B Provider Implementation
- Add provider kind normalization for `e2b`.
- Add provider dispatch and provider ID handling for `e2b`.
- Provision E2B sandbox via SDK, bootstrap `sandbox-agent`, clone repo, create runtime session.
- Persist runtime metadata (`:provider`, `:sandbox-id`, `:sandbox-name`, `:sandbox-port`, `:base-url`, `:session-id`, `:snapshot-id`).

### WS2: Persistence + Recovery
- Implement E2B snapshot create via SDK.
- Restore from task checkpoint when provider is `e2b`.
- Keep unsupported-provider behavior explicit for providers without persistence parity.

### WS3: Browser Terminal Support
- Implement provider terminal open for E2B runtime.
- Ensure terminal lifecycle events are emitted via existing DO flow.
- Align timeout and reconnect behavior with E2B PTY/session semantics.

### WS4: Config + Defaults
- Add E2B envs to node config/server passthrough and README:
- `E2B_API_KEY`
- `E2B_DOMAIN` (optional)
- `E2B_TEMPLATE` (optional)
- `E2B_SANDBOX_TIMEOUT_MS` (optional)
- `E2B_SANDBOX_AGENT_PORT` (optional, default `2468`)
- Set default runtime to `e2b` in provider fallback and wrangler agents config.

### WS5: Tests + Validation
- Add runtime provider tests in `test/logseq/agents/runtime_provider_test.cljs` for:
- provider selection/default dispatch to `e2b`
- E2B provision/session wiring
- E2B snapshot create/restore behavior
- E2B terminal behavior
- Verify existing provider tests still pass.

## Exit Criteria
1) New sessions default to `e2b` when `AGENT_RUNTIME_PROVIDER` is unset.
2) `AGENT_RUNTIME_PROVIDER=e2b` supports create/message/events end-to-end.
3) E2B snapshots can be created and restored from checkpoint metadata.
4) Browser terminal open works for E2B runtime sessions.
5) `local-runner` remains functional when explicitly selected.

## Validation
- Add/update tests in:
  - `test/logseq/agents/runtime_provider_test.cljs`
  - `test/logseq/agents/do_test.cljs` (if runtime behavior contract changes require DO-level assertions)
- Run targeted tests for changed namespaces.
- Run full lint/test pass before rollout (`bb dev:lint-and-test` from repo root).
