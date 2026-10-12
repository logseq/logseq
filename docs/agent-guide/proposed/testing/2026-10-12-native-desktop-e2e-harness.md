# Native Desktop E2E Harness

## Problem

The 30 Melange E2E source files have no comprehensive real OCaml desktop equivalent. A name inventory alone cannot establish behavior parity.

## Proposal

TEST DECISION: USER-REQUIRED

Claim: The explicitly requested parity suite must operate the real SDL host and OCaml daemon.
Stable project-owned contract: Native pointer, keyboard, text, focus and editor operations persist the same graph behavior as the upstream suite.
Concrete regression risk: Native event routing, retained rendering and daemon persistence can disagree while reducer or browser tests pass.
Existing coverage searched: ocaml-e2e/test/test_*.ml, deps/ui/native tests, native_embed and ocaml_host input paths.
Cheaper evidence considered: Compilation, reducer tests and worker invokes do not exercise the requested desktop input boundary.
Lowest stable boundary: Real native host plus real daemon with isolated root and settings.
Planned retained tests: Exact user-required parity scope; this scaffold retains one native smoke, an inventory validator and reusable fixtures, not the suite ports.
Reason: The user explicitly requires all upstream cases, exclusive five-group ownership, real input, cleanup and evidence. No unrelated tests are added.

Use an environment-opt-in private Unix socket, serviced on the SDL main loop, accepting a closed input/query protocol. Events enter SDL's existing event queue, never reducers. Inventory and test metadata are separate from execution evidence. Missing or duplicate mappings fail strict validation.

### Explicit additional-case provenance follow-up

TEST DECISION: USER-REQUIRED

Claim: The requested additional-case marker must distinguish justified native-only coverage from upstream parity mappings.
Stable project-owned contract: An unmapped test requires explicit additional provenance; parity and additional counts are separate and existing coverage/runtime guards remain strict.
Concrete regression risk: Additional tests could inflate parity totals, or unmarked unmapped tests could silently evade coverage validation.
Existing coverage searched: native-e2e/suite.ml, runner.ml, test_smoke.ml and README.md.
Cheaper evidence considered: Compilation plus temporary additive suite probes can validate the metadata contract without new product cases.
Lowest stable boundary: The real OCaml runner with automatically discovered temporary modules and the existing real native smoke.
Planned retained tests: 0 new product cases; mark the existing smoke only. Remove all scratch probes before handoff.
Reason: The user explicitly requested metadata/runner changes and targeted rejection/acceptance validation. Do not add speculative product coverage or change inventory contract categories before coordinated audit.

### Isolated fixture and read-oracle safety follow-up

TEST DECISION: USER-REQUIRED

Claim: Native fixtures must never register per-root login daemons, and validation oracles must never repair the graph.
Stable project-owned contract: Client.start forces LOGSEQ_NO_LOGIN_DAEMON=1; property read endpoints remain read-only; Client.validate fixes its options to fix=false and returns Wire.t.
Concrete regression risk: A cleaned-up test graph could leave a LaunchAgent targeting a deleted root; default validate-db options can mutate data and invalidate an oracle.
Existing coverage searched: Client.start/read, native daemon_client.ensure_login_daemon, property/read endpoints and validate-db implementation.
Cheaper evidence considered: Source audit plus one temporary real-client probe and the existing native smoke are sufficient; no new retained product cases.
Lowest stable boundary: Real host/daemon fixtures with LaunchAgent before/after inventory and typed wire requests.
Planned retained tests: 0 new product cases; delete scratch probes before handoff.
Reason: The user explicitly requested fixture safety and typed read APIs, not product behavior changes or additional parity cases.

## Alternatives considered

### Browser or reducer harness

Does not exercise the requested native host. Worker reads are valid oracles and setup, not substitutes for UI operations.

## Acceptance criteria

- Build the native host and daemon and pass a runnable UI page-create/edit/persistence smoke.
- Discover all upstream literal/dynamic case declarations without counting commented code; partition all 30 files exactly once across five groups.
- Isolate daemon root and settings, bound request/test timeouts, save failure logs/tree/screenshots and reliably clean up owned processes.
- Reject missing, duplicate and structurally vacuous coverage; execution reports must name actual passing native cases.

## Risks

- Inventory validation cannot prove assertion semantics; suite authors must port exact behavior and reviewers must inspect equivalence.
- Product gaps remain failures, not skip/pass claims. The scaffold stops short of porting the full suite.

## Questions

No unresolved decisions. The user specified native host, baseline, socket restrictions, suite ownership and stopping after the proven scaffold.
