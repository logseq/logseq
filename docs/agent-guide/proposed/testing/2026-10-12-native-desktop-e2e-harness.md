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

### Audited API contracts and fixture initialization

TEST DECISION: USER-REQUIRED

Claim: The 15 audited plugins_basic cases exercise production SDK actions, not desktop input or pure helpers.
Stable project-owned contract: Api requires a real started app, executed assertions and completed production SDK results; parity maps one native case to one upstream registration. A protected pre-boot hook may seed production-format local state, and db-sync-status remains an unmodified read oracle.
Concrete regression risk: Fake SDL setup could satisfy API coverage, bulk covers lists could inflate parity, initialization failures could leak fixtures, and worker reads could be miscounted as SDK actions.
Existing coverage searched: All 15 plugins_basic registrations, Sdk_api registry/bridge, Client.sdk_call, Suite.with_app/runner, inventory and Sync_client.status.
Cheaper evidence considered: Temporary OCaml guard probes plus a real native registry call verify the harness contracts without new product cases.
Lowest stable boundary: The real native host/daemon with production SDK registry completion and the actual runner.
Planned retained tests: 0 new product cases; keep the existing smoke, remove temporary probes. Exactly 15 audited manifest entries change contract to api, total 249 unchanged.
Reason: The parent explicitly authorized this correction and requested real API proof, negative guards, initialization cleanup and one-to-one mappings.

TEST DECISION: SCRATCH

Claim: A synchronous production SDK exception may leak pending transport tokens and exhaust the 32-request limit.
Stable project-owned contract: Completed production SDK errors remain consumable results, without exhausting subsequent registered calls.
Concrete regression risk: Expected SDK errors can leave the automation bridge unusable for later API cases.
Existing coverage searched: Sdk_read.custom_query parsing before promise creation and the sdk-call token insertion/result path.
Cheaper evidence considered: Source inspection identifies risk but cannot establish a runtime regression; use one real native registry probe before any fix.
Lowest stable boundary: Private socket plus the actual production custom_query registry method.
Planned retained tests: 0; delete the probe after real red/green evidence.
Reason: The user requires a real reproduction before a TDD fix; do not change production based on an unverified risk.

TEST DECISION: SCRATCH

Claim: A daemon health response and a nonempty retained tree do not yet guarantee the default native graph route is ready for public SDK reads.
Stable project-owned contract: Returning from Client.start means a real page has rendered and the production SDK can read the active repo.
Concrete regression risk: A freshly booted API-only case can fail get_all_tags with "repo is required" before graph route activation, despite a healthy daemon.
Existing coverage searched: Client.start readiness checks and the real Suite.Api temporary probe.
Cheaper evidence considered: Source inspection alone does not prove the observed race; a real get_all_tags call immediately after Client.start failed, while polling the title made it pass.
Lowest stable boundary: The native retained graph route inside the existing Client.start fixture.
Planned retained tests: 0; remove the temporary API probe after validating readiness.
Reason: Repair fixture readiness once instead of adding per-case sleeps/retries or weakening SDK assertions.

### Semantic locator correctness under dynamic native layout

TEST DECISION: KEEP

Claim: A native semantic locator must select and click its intended target despite quoted attribute whitespace and settling layout.
Stable project-owned contract: Native query tokenization preserves quoted attribute values; Client.click waits for stable identity/geometry before one real SDL button sequence, never retries a misclick.
Concrete regression risk: Splitting a quoted item key on spaces loses the target, while an intermediate Cmd-K rectangle can click a different row and mutate the wrong page.
Existing coverage searched: Native Dom_ext selector parser/matcher, Client.query/click, native smoke and the editor child's real Cmd-K reproduction.
Cheaper evidence considered: A pure parser probe can diagnose tokenization but cannot protect the production query-to-layout-to-SDL boundary; compilation and the current smoke do not use quoted-space item keys.
Lowest stable boundary: Real native retained selectors and SDL input with the isolated daemon.
Planned retained tests: 1 generic additional native locator contract, no upstream parity claim and no per-group click workarounds.
Reason: The parent explicitly requested the shared root fix and a generic regression; protect semantic target correctness without fake layout/input or speculative product cases.

### Rendered native input and heading metadata

TEST DECISION: USER-REQUIRED

Claim: A real native Text_field's rendered placeholder must be available to semantic selectors.
Stable project-owned contract: Native snapshots expose the actual typed LUI PlaceholderValue on input-kind nodes, without inventing or logging the field's value.
Concrete regression risk: Property pickers render an input but `input[placeholder='Add or change property']` matches nothing; the property owner's original selected-value assertion cannot run through the native query path.
Existing coverage searched: Native_embed.ext_shallow_snapshot, Lui_elements.text_field, Lui_protocol.PlaceholderValue and Properties_dialog.prop_select_view.
Cheaper evidence considered: Source inspection proves the missing projection but not native selector transport; run a real dialog-opening regression.
Lowest stable boundary: The actual native host retained tree and private SDL client.
Planned retained tests: 1 additional native input-placeholder case, mapped to no upstream ID. The property owner retains Down+Enter and `Set <selected property>` source assertions.
Reason: The parent explicitly requested the generic projection; do not patch the property author's owned suite or fabricate selection behavior here.

TEST DECISION: USER-REQUIRED

Claim: Native snapshots must preserve a rendered heading's real HeadingLevel/As semantics without claiming to have HTML h1/h2 elements.
Stable project-owned contract: Expose the actual HeadingLevel integer and explicit As string from the mounted LUI node as snapshot metadata; absent props remain absent.
Concrete regression risk: Commands/headings cases cannot distinguish rendered heading levels from generic `heading` nodes, and retagging them as HTML would fabricate coverage.
Existing coverage searched: Lui_elements.heading/text prop writers, native runtime_properties, Render.wrap's h1..h6 implementation and Native_embed.ext_shallow_snapshot.
Cheaper evidence considered: Schema inspection validates types but not that saved heading UI exposes both props via the real native host.
Lowest stable boundary: A real saved native heading block, inspected through retained-tree snapshots.
Planned retained tests: 1 additional native heading-semantics case, mapped to no upstream ID.
Reason: The parent explicitly requested a source-derived read-only native contract and asked not to fabricate HTML or change the commands owner's test bodies.

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
