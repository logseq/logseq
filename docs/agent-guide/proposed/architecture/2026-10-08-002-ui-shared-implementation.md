# Shared UI Implementation Plan

Goal: Web, SwiftUI, and GPUI use one implementation of UI and business logic, retaining only genuinely different platform services, rendering adapters, and entry points.

Architecture: Build shared logic in `src/` and `subs/` as OCaml libraries supporting Melange and native compilation.
Move browser FFI, native system calls, and specialized widgets behind explicit platform boundaries with small interfaces.
Preserve the already shared editor model and view, replace its browser-shaped control boundaries, and merge actual business copies feature by feature before removing source-copy build rules and runtime emulation.

Tech Stack: OCaml, Dune, Melange, LUI, ocaml-signal, existing worker/daemon protocols, and SwiftUI/GPUI hosts.

Related: `deps/ui/docs/architecture.md`, `deps/ui/docs/component-residuals.md`, `deps/ui/docs/editor-surface-extension.md`, `deps/ui/docs/e2e-contract.md`, and `docs/agent-guide/implemented/architecture/2026-08-24-logseq-runtime-and-engineering-guide.md`.

This document uses the `spec-dev-tool` date and lifecycle path conventions, preserving plan sequence 002 in its topic.
This document was updated on 2026-10-09 after read-only editor research. The user subsequently authorized implementation through completion, including necessary changes in the LUI repository.
Before implementation, reread applicable AGENTS.md files and @.agents/skills/logseq-lui/SKILL.md, @.agents/skills/logseq-i18n/SKILL.md, @/Users/tiensonqin/.codex/skills/ocaml-development/SKILL.md, and @/Users/tiensonqin/.codex/skills/test-driven-development/SKILL.md.
Current AGENTS.md and the LUI skill take precedence over older architecture examples using direct `dyn`, generic DOM extensions, or utility classes.

## Paused implementation handoff (2026-10-09)

The user paused implementation and will assign the continuation to another model.
The active goal is paused, not complete.
This section is the current handoff; later execution entries retain historical evidence and older dependency revisions.
Resume implementation only in the continuation task.
The original Tasks 1–7 below remain the detailed design and deletion gates.

### Checkout and delivered work

Repository: `/Users/tiensonqin/Codes/projects/logseq`.
Branch: `refactor/lui`.
Last pushed implementation HEAD at pause: `8f373d1b46c14097a341017e1e2b035222602e77`.
After writing this handoff, the user requested committing and pushing the plan and the tested extraction as checkpoints.
Inspect commits after that baseline and the current Git status before assuming the listed extraction remains uncommitted.
The extraction checkpoint is now committed as `ad675c389f` (`refactor: isolate UI platform services`).
The plan is committed separately after that checkpoint; only unrelated work remains outside these commits.
Use ordinary merges and additive commits; the user explicitly rejected rebasing.

| Commit or resource | Delivered result | State |
| --- | --- | --- |
| `a995252bd8` | LUI publishing, memory Datascript, datom search, legacy frontend cleanup | Pushed |
| `cf4f0195cb` | Shared production-view baselines, isolated native storage, modern host ABI, UTF-16 fix | Pushed |
| `1b2e5f0bff` | Portable task/service contracts and shared settings controls; standard UI command runs contract tests | Pushed |
| `f6051920e0`, `128ff91302` | Concurrent worker build cleanup and verified SQLite amalgamation download | Integrated from remote |
| `8f373d1b46` | Normal merge of remote worker build updates into the shared branch | Pushed |
| [LUI PR 162](https://github.com/logseq/lui/pull/162) | Resync ordinary parentless trees and detached extensions | Merged after all CI checks passed |
| `ad675c389f` | Theme/route baselines and browser/native platform source extraction, compiled and tested in both runtimes | Checkpoint committed after pause at the user's request |
| `ef8d49f385`, `287dda11f2` | Task 2 contract layer: semantic theme/nav/doc groups in `ui_services`, web and native implementations, production consumers migrated | Pushed 2026-10-08 (Linux VM) |

The user authorized necessary LUI repository changes, PR creation, and merging after CI passes.
That authorization does not resume this paused task.
The user ended the earlier open-ended performance work.
Preserve responsiveness while migrating; do not reopen a rope, incremental-parser, or 120fps optimization campaign.

### Continuation progress (2026-10-08)

Resumed per user instruction. Environment: Linux VM, opam switch `5.5.0`, `pnpm install --ignore-workspace` in `deps/ui` (plain install resolves the repo-root workspace and misses `@tanstack/virtual-core`/`transit-js`). Web suite baseline: 1,605 checks with one known Linux-only failure (`decorate mod` expects ⌘ on macOS); native drive and contract suites green.

Task 2 contract layer landed in `ef8d49f385` + `287dda11f2`: `ui_services` gained `theme` (semantic mode read/write, live `prefers_dark`, dataset/class apply split preserving dataset→hook→classes ordering), `nav` (push vs quiet `replace_hash`, history, split `on_change`/`on_navigate` channels, `hash_query_param`, `decode_uri`, `reload`), and `doc` (lang, arbitrary `data-*`, reload). Web impl in `web/platform_web.ml` (self-contained document FFI — the services library must not depend on shared src); native impl in `native/services/platform_native.ml` with `emit_event` routing `ls:navigate` to `nav_on_navigate` observers. Consumers migrated: settings_view/state/page, boot, router, subs_state, sidebar, pages, properties_menu, popups, chrome, sdk_ui, plugin_host, exporter, editor nav callers, render_inline, js_app. Contract tests cover theme quoting/classes, live prefers_dark re-query, push vs quiet replace, back/forward stacks, graph-qualified params, the on_change/on_navigate split, and lang pref quoting.

Still open for Task 2's full exit gate: one feature's portable state/view merged end-to-end in both runtimes (settings_page/sidebar_state land in batch 3b below). Platform-level nav/theme ops remain until `cmdk_state.ml` (batch 3c) migrates; Task 6 owns their deletion.

Parallel execution: up to 9 child sessions on `devin/SHAREDUI-*` branches covering batches 3a–3d, 4 (subs Ui_task), 5a editor regressions, 5b editor commands, views, and the Task 6 emulation inventory (read-only). Children write tests in dedicated `shared_scenarios_*.ml` files; the coordinator owns `shared_scenarios.ml`, `test_drive.ml`, contracts, and integration merges into `refactor/lui`.

### Preserve the working tree

Unrelated files must retain both content and staging state:

```text
 M AGENTS.md
A  docs/agent-guide/001-master-outliner_report.md
?? docs/ocaml-gpui-architecture.html
```

The master outliner report is deliberately staged.
Never use blanket staging, reset, clean, or stash restoration.
Do not include these files in a migration commit.
The handoff and tested extraction were uncommitted at pause; the user subsequently authorized checkpoint commits for both.

Migration files that were uncommitted at pause:

```text
 M deps/ui/gpui/drive_test.ml
 M deps/ui/gpui/dune
 M deps/ui/native/dune
 D deps/ui/native/host.ml
 M deps/ui/native/platform.ml
 M deps/ui/subs/dune
 D deps/ui/subs/platform.ml
 M deps/ui/test/shared/shared_scenarios.ml
 M deps/ui/test/test_drive.ml
 M deps/ui/web/dune
 M deps/ui/web/platform_web.ml
?? deps/ui/native/services/dune
?? deps/ui/native/services/host.ml
?? deps/ui/native/services/platform_native.ml
?? deps/ui/web/platform.ml
```

### Current architecture and extraction

During checkpoint preparation, origin advanced to `74183c02df` through three non-overlapping commits.
The checkout fast-forwarded normally, retaining the report's exact staged blob.
`b90e4520ec` changes GPUI's Taffy patch from vendored source to the pinned `logseq/taffy` tag; `3936bec9da` and `74183c02df` remove old screenshot archives, audit reports, and capture scripts.
Do not restore those obsolete files from historical audit references in this plan.
The Web suite again passed 1,605 checks; native again passed 147 checks and both process tests; `bb lint:dev` also passed at checkpoint preparation.
After the remote Taffy update, `cargo test --locked` rebuilt the changed dependencies and passed all 12 tests; its isolated worker was stopped.
This document passes its focused `spec-dev-tool check`.
The repository-wide document check reports the unrelated staged `001-master-outliner_report.md` naming violation; leave that report unchanged.

`deps/ui/src/contracts/` owns `Wire`, `State_cell`, `Ui_services`, and `Ui_task` in byte/native/Melange modes.
`deps/ui/src/shared/` owns `Ui_parts` and `Settings_controls` in both actual runtimes.
These portable libraries have no `Js`, `Web_dom`, or `Platform` references.
`Ui_services` currently exposes raw preference storage, literal-text conversion, flush, and owner assertions.
`Ui_task` provides deferred completion/observation, rejection propagation, cancellation, ordered `all`, and late-completion suppression.
No production business flow has yet migrated to `Ui_task`.

```text
Shared controls / State_cell
          |
          v
Ui_services + Ui_task
      /          \
Web adapters      Native services
browser globals   persistence / mailbox / host
```

The extracted native service library is `deps/ui/native/services/dune`.
`native/services/host.ml` is a byte-identical move of `native/host.ml`.
`native/services/platform_native.ml` extracts host/persistence/document-state, hash/history/query, and service-installation sections.
`native/platform.ml` includes that module and retains the remaining emulation helpers.
The include preserves the existing mutable state and callbacks; do not recreate them in another adapter.
`native/dune` and `gpui/dune` depend on the new library, and the GPUI Host copy rule is removed.

`deps/ui/web/platform.ml` is the moved browser implementation formerly in `subs/platform.ml`.
Its only functional-source adjustment replaces `open Promise_ext` with the equivalent local `let*` operator to avoid a library dependency cycle.
`subs/dune` now depends on `logseq_ui_web_services`.
`web/platform_web.ml` installs services using existing Platform storage access and literal-text conversion rather than duplicate FFI.
Browser storage getters still access the current `globalThis.localStorage` on every call, which is required when test fixtures replace browser globals.

Theme and route baselines use the same production view scenarios in `test/shared/shared_scenarios.ml`, with runtime-specific host operations at the two entries.
Theme scenarios drive real Dark/Light/System controls, inspect effective host classes and raw persisted values, and verify remount retention.
Route scenarios verify encoded page/graph destinations, observer ordering, and restoration.
The browser stub explicitly fires `hashchange`; native hash observers already notify synchronously.
These baselines prove existing behavior before extraction; they do not complete neutral theme/navigation contracts.

### Verification at pause

| Verification | Latest result | Limit |
| --- | --- | --- |
| OCaml Web/test/native embed/GPUI embed/GPUI Drive build | Passed after current extraction | Compilation alone does not establish host interaction parity |
| Web application test artifact | 1,605 checks, zero failures | In-process browser fixture |
| Native production Drive entry | 147 checks, zero failures | Isolated native process |
| Native process-isolation integration | Two tests passed | Isolated startup/storage contract |
| GPUI Cargo | 12 tests passed after current extraction | Includes real bridge/palette/resync/disposal, not actual OS input |
| `pnpm ui:build` | Passed after current extraction | Existing Transit eval warnings remain |
| `bb lint:dev` | Passed before current extraction | Rerun before the next implementation commit |
| Nine read-only review passes | No confirmed new findings for extraction | Thread/lifecycle questions below remain future integration work |
| Headless production Web boot | Demo/Journals loaded; no page errors | Theme/route browser interaction was not run before pause |
| Full actual Web editor baseline | One continuous Delete case failed | Expected `["first", "C", "D"]`; observed `["firstC", "D"]` |
| `git diff --check` | Passed before adding this handoff | Rerun for the document and next source batch |

The four page errors in the full editor baseline were deliberate rejection injections, not independently confirmed runtime errors.
Do not report the full editor suite as green while the continuous Delete failure remains.
Actual native window interaction, OS IME, soft-wrap navigation, and caret geometry remain unverified.
No working Logseq SwiftUI application/editor host was found; LUI Apple galleries are not evidence of Logseq parity.

### Tools, dependency state, and screen constraint

The physical display was put to sleep and must remain asleep.
Do not focus applications, open foreground browser tabs, or launch GUI verification that wakes it.
Only use a demonstrably headless method while that constraint applies.
The scoped HTTP test server and headless browser were stopped during pause cleanup.

Installed Playwright's default Chromium binary was unavailable.
Headless boot succeeded using `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` as Playwright's explicit executable.
Use a disposable origin, browser context, graph, and storage directory.
Do not treat a successful page load as interaction verification.

The sibling LUI checkout is `/Users/tiensonqin/Codes/projects/lui`, clean at `1ca2b862687bc525ffc2623410719db09e0cd926` on `fix/resync-live-trees`.
PR 162 merged as `91aecb52a1cba2faaf23aac1d64a0bd1cb6549e7` after six CI jobs and WIP all passed.
Opam is configured for `git+https://github.com/logseq/lui.git#main`, but its cached installed pin revision at pause is `1ca2b862687bc525ffc2623410719db09e0cd926`.
The fix is present; do not claim that the installed package is exactly the merge SHA.
Recheck `opam pin list` and sibling source before another dependency update.
`drive` is `1e1653d5bdd0810e89d9e3a32b2e0ea2811c1cf5`; `ocaml-signal` is `868c1459f865b4ba3b227eb440dba40f1c812899`.

All shell commands must use `rtk`, with `rtk proxy` when raw output is required.
Serialize Dune commands in this checkout, including commands started indirectly by package scripts.
`spec-dev-tool` is not on PATH; use `/Users/tiensonqin/Codes/projects/spec_dev_tool/_build/default/bin/main.exe`.
Keep this document proposed until the entire migration and its acceptance criteria are complete.

### Immediate continuation: finish Task 2

1. Read root and directory-specific AGENTS.md, the matching repo-local skills, `prompts/review.md`, and this complete plan.
2. Confirm the branch, HEAD, remote changes, dependency pins, and exact staged/unstaged files.
3. Inspect the tested uncommitted platform moves; retain them unless new evidence requires a correction.
4. Run the focused baseline commands below against the current tree.
5. Verify the existing extraction checkpoint `ad675c389f`; do not recommit or recreate the source moves.
6. Trace theme reads/writes and side effects in `src/settings/settings_view.ml`, `src/settings/settings_page.ml`, native counterparts, app boot, and plugin hooks.
7. Trace routing in `src/routing/router.ml`, `src/app/runtime.ml`, `web/platform.ml`, and `native/services/platform_native.ml`, verifying actual current paths with `rg --files`.
8. Add behavior tests for system appearance changes, effective preference persistence, and plugin notifications exactly once when a user changes theme.
9. Add behavior tests for history back/forward, quiet fragment replacement, listener cleanup, graph-qualified routes, and late notifications after disposal.
10. Run the new behavior regressions before implementation and confirm a meaningful failure for the behavior being changed.
11. Extend `src/contracts/ui_services.ml` and `.mli` only with the semantic theme/navigation operations those production callers require.
12. Implement browser globals/FFI in Web adapters and native host state in Native services, preserving raw storage formats.
13. Migrate the actual shared state/view consumers to those contracts in both runtimes.
14. Preserve theme side-effect ordering; the current implementation updates the dataset, notifies hooks, and then updates classes.
15. Preserve encoded page names, graph query context, and hashchange/custom-navigation event semantics without duplicate route notifications.
16. Remove obsolete operations and copy rules in the same owning batch after all callers have migrated.
17. Run shared behavior tests, production headless Web theme/route interaction, and affected host checks.
18. Update this plan with results, audit only the intended staged files, and commit/push the completed batch.

Task 2 exits only when an actual feature's portable state/view and required services compile and behave in both runtimes, with explicit ownership and no duplicated implementation of that feature.
Moving platform source files alone does not meet that gate.

### Remaining ordered migration batches

Run each row as a separate reviewable batch using the detailed Tasks 3–7 below.
Before changing behavior, add all necessary regressions and observe their failures.
For an unchanged source move, record passing production baselines before and after the move.

| Batch | Production paths to inspect/change | Required observable tests | Completion/deletion gate |
| --- | --- | --- | --- |
| 3a: Pure helpers | `src/core/`, `src/sdk/sdk_convert.ml`, matching `native/*.ml` helpers | Unicode, date/format behavior, conversion/order invariants in both runtimes | One portable owner; matching native business/helper copies removed |
| 3b: Settings/sidebar | `src/settings/`, `src/sidebar/`, `native/settings_page.ml`, `native/sidebar_state.ml` | Restart persistence, theme/language, sidebar reopen/context retention | Same real state/view in both runtimes; only genuine host services remain |
| 3c: Palette | `src/cmdk/cmdk_state.ml`, `cmdk_view.ml`, native counterparts | Query/results order, selection, Enter, Escape, close/focus restoration | Shared production palette behavior; native business/view copies removed |
| 3d: Properties | `src/properties/properties_data.ml`, `properties_value.ml`, native counterparts | Property edits/rejections, sorting/filtering, graph switch and stale response | Shared data/value behavior; DOM control separated into typed boundary |
| 4: Async/transport | `subs/`, `src/core/worker_client.ml`, `daemon_client.ml`, native counterparts/entry | Success/rejection/disconnect, ordered pushes, graph-switch cancellation, late replies, disposal | Portable task/state ownership; I/O threads only enqueue; migrated business flows no longer use native JS-promise emulation |
| 5: Remaining features | `src/views/`, `src/pages/`, render/assets/export/SDK and native counterparts | Query/table results, rendering, cancellation/content, plugin hooks | One business implementation per feature; genuine widgets/services retained |
| 5a–5f: Editor | Detailed editor tasks below; shared model/view and actual input hosts | Master parity, save ordering, revisioned geometry, Unicode, host input/IME/layout | Typed portable controller with host-specific input/rendering; no fabricated parity claim |
| 6: Structural cleanup | Shared Dune libraries, `native/dune`, `gpui/dune`, emulation modules | Complete affected suites and dependency/ownership scans | Delete unused copies/emulation after callers migrate; no new source-copy or module-override mechanism |
| 7: Final verification | Production entries, architecture docs, plan evidence | Full supported Web/native/GPUI checks, publishing, architecture audit | Acceptance criteria below met, actual gaps documented, plan lifecycle updated accurately |

Temporary `src/contracts/` and `src/shared/` slices may be consolidated into the final shared structure in Task 6.
Do not delete real clipboard, filesystem, host mailbox, rendering, or system-input adapters merely because they are platform-specific.
Do not make compilation pass through `Obj.magic`, identity casts, warning suppression, silent defaults, or new compatibility emulation.

### Async and lifecycle integration questions

Native service assertions currently enforce ownership of a serialized application entry through a mutex and thread ID.
Input entry and mailbox pump can still run on different threads.
Task 4 must choose and implement final ownership using actual host constraints rather than relabeling this as a single application thread.
I/O callbacks may enqueue completions but must not mutate application state directly.
Do not block on the UI thread while holding an OCaml entry/runtime lock that the UI thread may need.

The bridge disposal smoke verifies current teardown, an empty root/tree, and no remount after a late pump.
Disposal itself remains unlocked, so concurrent teardown and transport retirement require explicit Task 4 tests.
Add restart behavior only if an actual host requires it; installation currently assumes one application.

`Ui_task` listener removal uses list filtering.
Repeated observation of one pending task inside `all` has quadratic cancellation; 8,000 repeated references measured about 500 ms.
No current production flow consumes this kernel, so this is an integration question rather than a demonstrated application regression.
Assess actual request-deduplication fan-out before integration, then use constant-time unlink only if that production behavior requires it.

### Editor continuation and user-required behavior

Keep the existing shared editor model, view, save queue, structural actions, and worker truth.
Use `docs/agent-guide/001-master-outliner_report.md`, current master source, and the behavior tables below rather than designing replacement semantics.
Inspect the staged report read-only; it is not part of the migration commit.

| Requirement | Behavior to preserve/prove |
| --- | --- |
| Configurable outdent | Both existing modes remain controlled by `editor/logical-outdenting?`; trace propagation through actions and worker options |
| Merge at reference/tag/URL boundary | Backspace and Delete insert the existing separating space when required instead of joining unrelated text |
| Raw HTTP link | Backspace removes text normally; the entire URL is not an atomic token |
| Page reference | Editing displays editable `[[...]]` source delimiters |
| Block reference | Display only its first line, render math as LaTeX, treat content as immutable/atomic during navigation, and save `[[block UUID]]` identity |
| Autopair | Match master insertion, skip, and paired deletion, including the caret inside `[[|]]` and all other supported delimiters |
| Click positioning | Enter editing at the clicked position without an intermediate jump to the block end |
| Arrow movement | Visible responsive caret with master/native textarea behavior while moving; preserve idle blink |
| Multiline movement | Navigate visual lines and block boundaries consistently with master, including wrapping |
| Structural input | Enter, indent/outdent, repeated Enter/Delete preserve ordering, focus, caret, and surrounding block rendering |
| Startup | Editing becomes ready without an added complex or slower initialization path |
| Save/undo/redo | Flush pending saves before structural operations and undo/redo; preserve worker truth and dirty local input |
| Composition | Preedit is not committed; commit once; cancel/blur preserve the expected source and selection |

The full browser baseline already exposes a continuous Delete ordering failure.
First reproduce it on a disposable graph and add a regression around the production structural input/save queue.
Do not make expected results agree with a bug to obtain a passing suite.

Editor Task 5a records supported units, lifecycle, geometry revisions, and baseline behavior.
Task 5b merges command dispatch while exposing actual host capabilities for clipboard/files/export/plugins.
Task 5c returns current valid layout synchronously when safely available and reports pending layout explicitly otherwise.
Prefer a revisioned host-published layout snapshot or safe same-thread read; reject stale text/layout/session replies.
Remove timer retries and input replay workarounds only after the replacement contract is proven.
Task 5d replaces selector/document-event/JSON DOM control with typed inputs while preserving focus, autocomplete, pointers, and clipboard behavior.
Task 5e separates pure inline parsing from rendering without changing markup, references, URLs, Unicode, or source identity.
Task 5f retains the delivered Rust UTF-16 correction and verifies replacement ranges, scratch selection, wrapping, and actual OS IME.
Simulated composition and bridge smoke are not sufficient evidence for Task 5f.

### Publishing and deletion guardrails

LUI publishing already uses memory Datascript through the existing worker-shaped API without a separate-worker messaging requirement.
Publishing search reads Datascript datoms.
Unpersisted default views must render because view entities are only created when a page is opened.
Root `src/`, Shadow CLJS configuration, and obsolete `deps/publishing` have already been removed.
`deps/ui/src/` is the active OCaml application source and must not be confused with the removed root `src/`.
`deps/publish` is the backend service and must remain.
Rerun publishing when shared rendering, bootstrap, routing, or API contracts change.

```sh
# Repository root; GRAPH-DIR and OUTPUT-DIR are explicit disposable test paths.
rtk proxy bb dev:publishing GRAPH-DIR OUTPUT-DIR
rtk proxy node scripts/publishing.mjs static GRAPH-DIR OUTPUT-DIR --dev
```

### Verification commands for the continuation

Run from the repository root unless a working directory is shown.
Inspect package scripts if they change; the commands below describe the pause snapshot.

```sh
rtk git status --short
rtk proxy git log -4 --oneline
rtk proxy opam pin list
rtk proxy pnpm test:ui
rtk proxy pnpm ui:build
rtk proxy bb lint:dev
rtk proxy pnpm test:publishing
rtk git diff --check
rtk proxy /Users/tiensonqin/Codes/projects/spec_dev_tool/_build/default/bin/main.exe check docs/agent-guide/proposed/architecture/2026-10-08-002-ui-shared-implementation.md
```

```sh
# Working directory: deps/ui; serialize these with all other Dune/package builds.
rtk proxy opam exec -- dune build js_app test native/native_embed.exe.o gpui/native_embed.exe.o gpui/drive_test.exe
rtk proxy opam exec -- dune runtest gpui test/contracts
rtk proxy node _build/default/test/ui_test/test/test_main.js
rtk proxy node test/native_process_test.mjs
```

For `deps/ui/gpui/host`, run `rtk cargo test` with fresh `LOGSEQ_UI_STATE_DIR`, `LOGSEQ_ROOT_DIR`, and the actual `LOGSEQ_DB_WORKER_BIN`; set `LOGSEQ_NO_LOGIN_DAEMON=1`.
Record and clean up only daemon PIDs matching the exact disposable graph root.
The no-login flag does not guarantee that Cargo integration creates no worker daemon.
Do not broadly kill unrelated application processes.

For app integration, use `ocaml-e2e/` and its existing parallel runner with a built app served at port 3002 and an isolated graph/origin.
CLI integration is a separate `cli-e2e/` target and should be run when a shared contract affects it.
Before final completion, run `rtk proxy bb dev:lint-and-test` and the document tool's `check --all`, plus affected publishing/app/CLI suites.
Do not repeat broader checks without a changed dependency or unresolved failure.

### Final acceptance and continuation prompt

The migration is complete only when supported hosts compile from shared business/view sources, each duplicate has one authoritative owner, migrated callers use explicit services, and obsolete copy/emulation rules are removed.
Existing editor and publishing behavior must remain correct, with the known Delete failure resolved and verified.
Report actual supported host capabilities and validation gaps accurately.
Update architecture documentation and this plan with final evidence before moving it to implemented.

Suggested prompt for the next model:

> Continue the shared UI and business-logic migration on `refactor/lui`.
> Read the paused handoff and complete Tasks 2–7 in `docs/agent-guide/proposed/architecture/2026-10-08-002-ui-shared-implementation.md`.
> Reuse checkpoint `ad675c389f` for the tested theme/route baselines and platform extraction; preserve unrelated content and staging.
> Finish Task 2 first, then migrate features in tested batches and delete obsolete copies in their owning batch.
> Keep the display asleep and use headless verification.
> Preserve master editor behavior, block-reference UUID identity, autopair, outdent modes, and structural save/input ordering.
> Do not rebase or commit generated/unrelated files.
> Necessary LUI changes may use a PR and merge after CI passes.


## Problem

### Source inventory

These counts were collected from the working tree on 2026-10-08 before the concurrent merge and must be measured again before execution.

| Observation | Result | Implication |
| --- | --- | --- |
| `deps/ui/native/*.ml` | 71 handwritten files | Native contains substantially more than a thin adapter layer |
| Native files sharing a name with a file in `src/` or `subs/` | 56 pairs | Review candidates, not automatic deletion targets |
| Byte-identical files among those pairs | 0 pairs | Merging requires behavioral review rather than selecting one version |
| Modules copied from `src/` and `subs/` by `native/dune` | 109 | Shared source exists, but module inventories are maintained repeatedly |
| Files in `src/` using `Js.*` | 105 / 160 | JS runtime types extend into the shared layer |
| Files in `src/` using `Web_dom.*` | 76 / 160 | Shared views depend on browser behavior |
| Files in `subs/` using `Js.*` | 6 / 10 | Subscriptions also depend on JS types such as promises |

`deps/ui/src/dune` and `deps/ui/subs/dune` build only in Melange mode and depend on browser libraries.
`deps/ui/native/dune` builds native code by copying selected shared files and substituting modules with matching names.
`deps/ui/gpui/dune` copies native and shared modules again and repeats table generation and build inventories.
Build-time copying of shared source is not handwritten business duplication, but it obscures dependencies and increases maintenance costs.


Duplicated business logic and views include `cmdk_state.ml`, `cmdk_view.ml`, `settings_page.ml`, `sidebar_state.ml`, `properties_data.ml`, `properties_value.ml`, `views_query.ml`, `views_table.ml`, `sdk_convert.ml`, and `sdk_write.ml`.
`native/js.ml`, `native/webapi.ml`, `native/web_dom.ml`, `native/vdom.ml`, and `native/imperative_dom.ml` allow native code to retain interfaces shaped around browser APIs.
These interfaces reduced initial migration costs but preserve DOM and JS constraints in cross-platform application code.


The working tree contains unrelated modifications, including current editor changes.
On 2026-10-09, no active Git merge was detected and `ocaml-e2e/` was present.
These are planning observations, not guarantees about the checkout at execution time.
Do not resolve, abort, stage, or commit unrelated work as part of this planning request.
Before implementation, establish a stable checkout, record existing modifications, and preserve the user's work.
The existing master outliner report is outside this refactoring plan.

### Editor findings and scope correction

The editor is not two independent implementations.
`deps/ui/native/dune` and `deps/ui/gpui/dune` already compile shared source for `Edit_model`, `Edit_runs`, `Edit_input`, `Edit_view`, `Editor_state`, `Editor_surface`, `Editor_sink`, `Editor_keys`, `Editor_actions`, `Editor_commands`, `Outliner_ops`, `Block_parse`, `Block_selection`, and `Editor_embed`.
Build copying remains a packaging problem, but these modules must not be rewritten as a second editor or counted as handwritten feature duplication.


| Source evidence | Observed behavior | Refactoring implication |
| --- | --- | --- |
| `deps/ui/src/editor/edit_model.ml`, `edit_input.ml`, and `edit_view.ml` | Shared model owns committed text, selection, caret, and composition; shared LUI view draws text and overlays | Preserve the model/view architecture and existing behavior |
| `deps/ui/src/extension/logseq_editor.ml` and `deps/ui/gpui/host/src/editor.rs` | Web uses a hidden textarea; GPUI receives system input through its host handler | Keep genuine input and rendering adapters |
| `deps/ui/src/editor/editor_keys.ml`, `editor_actions.ml`, and `deps/ui/native/editor_dom.ml` | Shared control relies on selectors, document events, DOM attributes, and a substantial native DOM simulation | Replace control dependencies with typed editor operations rather than extending emulation |
| `deps/ui/src/editor/edit_input.ml` and `deps/ui/native/logseq_editor.ml` | Geometry contract appears synchronous, while the current native bridge requests measurements and returns cached results | Prefer synchronous access to valid layout and make pending layout explicit |
| `deps/ui/gpui/host/src/editor.rs` and `main.rs` | Host geometry helpers compute synchronously with a live GPUI window; OCaml platform requests are queued for UI-thread handling and the pump also runs on a separate thread | Native measurement is not inherently asynchronous; assess safe direct reads or published layout snapshots before introducing more round trips |
| `deps/ui/src/editor/editor_keys.ml` | Native arrow movement and caret display use bounded timer retries and extra flushes | Replace retry-driven input handling after the measurement contract is proven |
| `deps/ui/native/logseq_editor.ml` | Measurement keys identify block and query arguments without text or layout revisions | Reject stale replies and invalidate results on edits, layout changes, remounts, and disposal |
| Both `editor_cmds.ml` implementations | Web handles comments, export, and plugin commands that native omits; native separately handles upload | Merge business dispatch and expose actual host capabilities |
| `deps/ui/src/editor/edit_model.ml` and `deps/ui/test/edit_view_test.ml` | Native uses UTF-8 byte offsets and Web uses UTF-16 code units; both modes have existing coverage in the Melange suite | Preserve explicit offset units and run appropriate scenarios in both actual runtimes |
| `deps/ui/src/editor/edit_runs.ml` and `deps/ui/src/render/render_inline.ml` | Run parsing calls a module that also owns UI rendering and browser-shaped helpers | Extract the shared pure parser without changing its syntax or reference semantics |
| `deps/ui/gpui/host/src/editor.rs` | GPUI line measurement treats editor rows as unwrapped; Web measures wrapped visual lines | Record wrapping capability and validate navigation instead of claiming existing layout parity |
| `deps/ui/native/code_mirror.ml` | Native code blocks currently use plain text and a subset of actions | Preserve supported behavior and report missing widget capabilities explicitly |
| `deps/ui/test/dune` and `deps/ui/gpui/drive_test.ml` | Model/view suites run under Melange; GPUI driver primarily checks editor mounting | Add native execution and actual host interaction coverage |


The GPUI `utf16_slice` helper uses scalar-character enumeration as a UTF-16 position.
Static analysis shows that slicing UTF-16 range `2..3` from `😀ab` would return `b` instead of `a`.
Add a failing Rust regression test and confirm the defect before fixing it in the host input batch.
GPUI also ignores requested replacement ranges and reports an empty scratch selection; real IME testing must determine the impact before changing the contract.
These are source findings, not claims that native IME behavior has been reproduced.


Saving and structural editing are already shared and must retain their ordering.
`Outliner_ops.schedule_save` currently debounces for 400 ms, structural operations flush pending saves, and undo/redo flush before invoking the worker and resynchronizing the model.
Remote refresh replaces the open buffer only when it is clean, while explicit undo/redo forces resynchronization.
Composition previews remain separate from committed source until commit.


Incremental view patching does not imply incremental parsing.
`Edit_model.splice` constructs a new block string and rebuilds its runs; keep the current patch locality and establish a performance baseline without expanding this migration into a rope or incremental parser project.
The native editor host inspected in this research is GPUI.
SwiftUI remains a target of the broader plan, but comments mentioning it do not establish a working editor adapter or parity.


Native can return geometry synchronously when valid layout is available through a safe execution context.
The current asynchronous behavior comes from Logseq's request bridge, not a fundamental GPUI or native-platform limitation.
Applying LUI patches alone does not prove that fresh layout has completed.
`deps/ui/gpui/host/src/main.rs` queues platform requests for a UI-frame callback and runs the OCaml pump on a dedicated thread; `deps/ui/native/native_embed.ml` serializes pump and input entries.
A blocking cross-thread request must not hold OCaml entry/runtime locks while waiting for a UI thread that may need those locks.
Investigate synchronous access to a revisioned, host-published layout snapshot or safe same-thread reads, retaining completion notification only for unavailable layout.

## Testing Plan

Extend existing production view driver tests so the same scenarios run through Melange and native compilation.
Reuse `deps/ui/test/shared/drive.ml`, `deps/ui/test/fake_worker.ml`, `deps/ui/test/test_drive.ml`, and `deps/ui/gpui/drive_test.ml`.
Mount the real `View.view` and `Update.apply`, supply deterministic worker responses at the boundary, drive real LUI events, and assert observable results.
Do not test only mock call counts, compare complete patch JSON, or require hosts to produce identical node IDs and layouts.

| Scenario | Observable result | Verification layer |
| --- | --- | --- |
| Command palette | Query entry, selection changes, navigation on confirmation, focus restoration after closing | Shared scenarios plus actual Web/native host checks |
| Settings/sidebar | UI updates, persistence after restart, state retention while opening and closing sidebars | Shared scenarios plus storage integration |
| Properties/query/table | Correct data after property edits, query changes, sorting, and filtering | Shared scenarios in both runtimes |
| Editor | Unicode/IME input, caret movement, selection, split/merge, undo, redo, save ordering | Existing model/view scenarios in appropriate runtimes plus actual Web and GPUI hosts |
| Assets/export | Cancellation does not mutate the graph or report success; saved contents are correct | Platform boundary integration |
| Worker/daemon | Success, rejection, disconnection, late responses after graph switching | Shared state tests plus transport integration |
| Lifecycle | Listeners, timers, and subscriptions are released on popup closure, page changes, and application exit | Shared scenarios plus host checks |
| Async ordering | Deferred callbacks, single completion, exception propagation, application-thread execution | Behavior tests in both runtimes |

Add necessary behavior tests and establish a baseline before implementing each migration batch.
Let tests expose real gaps in existing behavior, then fix only gaps required for that batch.
Check compilation and dependency rules separately; source scans are not business behavior tests.

### Editor behavior verification

Reuse `deps/ui/test/edit_model_test.ml`, `deps/ui/test/edit_view_test.ml`, `deps/ui/test/editor_browser_test.js`, and `deps/ui/gpui/drive_test.ml` rather than creating an unrelated editor harness.
Run the byte-offset model scenarios under native compilation as well as the existing Melange suite, retaining Web-specific UTF-16 scenarios at the Web entry.
Drive the real shared input controller and view with controllable geometry completion at the host boundary.
Assert resulting text, selection, movement, focus, worker mutations, and visible overlays rather than only requests sent to a fake host.


| Scenario | Observable result | Required verification |
| --- | --- | --- |
| CJK, emoji, combining marks, ZWJ, and reference boundaries | Insert, delete, navigation, and selection preserve text and atomic references | Shared model/view scenarios in both runtimes with host-appropriate offsets |
| Valid native layout already available | Caret/point queries and navigation use the current layout immediately without an extra frame request | Shared controller behavior plus actual GPUI input |
| Cold native geometry cache | One ArrowUp/ArrowDown moves once after valid measurement; later input is never overwritten | Shared controller with deferred geometry and actual GPUI |
| Out-of-order measurement replies | Replies for old text/layout/session cannot move the caret or paint an old overlay | Controller/view scenarios including the same block and offset after an edit |
| Resize, scrolling, and soft wrapping | Caret, click targeting, selection, and popup anchors match the rendered layout | Actual Web and GPUI; document unsupported wrapping before extending it |
| Main/sidebar editor switch and remount | Focus and pending work belong to the current surface even for the same block UUID | Shared lifecycle scenarios and actual hosts |
| IME start/update/commit/cancel and blur | Preedit does not save; committed text saves once; cancellation preserves original selection and source | Shared scenarios plus real OS IME input on GPUI and browser IME |
| UTF-16 scratch-buffer slicing | Ranges after astral characters return the requested text | Rust host regression tests, including `😀ab` range `2..3` |
| Command dispatch and clipboard | Supported comments/export/plugin/upload actions produce their existing result; unavailable capabilities are explicit | Shared command scenarios plus host clipboard/file integration |
| Save, split/merge, repeated input, and rejection | Pending text is saved in order; queued input is retained; failed operations do not advance the committed base | Shared controller/worker scenarios and disposable-graph integration |
| Undo/redo and remote refresh | Undo restores worker truth; remote refresh preserves dirty local input | Shared scenarios plus real worker integration |
| Long blocks and caret-only movement | Existing patch locality is retained; no whole-editor remount or unjustified repeated measurement | Existing view tests and recorded performance baseline |


Browser-generated composition events and in-process GPUI drivers do not demonstrate real OS IME support.
Record actual host results separately from controller simulations and from source findings.

NOTE: I will write *all* tests before I add any implementation behavior.

## Proposal

### Target structure and dependency direction

Paths are relative to the repository root and must be resolved in the actual checkout during execution.

```text
deps/ui/
  src/                    Shared views, controllers, contracts, pure helpers
  subs/                   Shared model, reducer, subscriptions, Wire protocol
  web/                    Browser services, JS FFI, web extension adapters
  native/                 Native services, C bridge, native extension adapters
  js_app/                 Web bootstrap and renderer assembly
  gpui/                   GPUI host build/link entry and host-specific tests
  test/                   Shared scenarios and host-specific test entries

Web bootstrap -------> shared UI <------- Native bootstrap
       |                   |                    |
       v                   v                    v
 Web services ----> shared contracts <---- Native services
       |                                        |
 Browser APIs                              Native host / daemon

Shared UI ---> LUI kinds / typed extension contracts
Web / SwiftUI / GPUI renderers ---> host rendering
```

Use Dune `(modes byte native melange)` for shared libraries, as LUI itself does.
Platform implementations depend on shared contracts; shared code must not depend on platform implementations.
Reuse `Wire.t`, `Edit_input`, `Editor_sink`, `State_cell`, and LUI typed props rather than introducing another model or event protocol.
Implementation covers Logseq's UI and necessary tests, documentation, and build configuration; external LUI repository changes require separate scope assessment.

### Platform boundaries

Interfaces contain only operations actual callers need.
Shared views receive meaningful inputs such as text, selected values, file descriptions, caret positions, and navigation actions rather than DOM nodes or `Js.Json.t`.
Generic rendering uses LUI kinds, typed props/events, and `reactive`.
Editors, PDF/media, and genuinely specialized virtual lists may retain platform implementations while sharing contracts and business control.

| Boundary | Shared contract | Web implementation | Native implementation |
| --- | --- | --- | --- |
| Storage/navigation/environment | Settings, routes, theme/language/window state | Browser storage/history/events | Native persistence/host events |
| Scheduling/async | Time, queuing, cancellation, completion/rejection | Microtasks/timers/JS promise adaptation | Host mailbox/timers/native I/O completion |
| Worker transport | `Wire.t` requests, pushes, unsubscription, disconnection | Web Worker or Electron daemon transport | Native daemon transport |
| Files/clipboard | Selection/read/write/copy/paste results | Browser file/blob/clipboard FFI | Native host requests/results |
| Editor/measurement | Typed input, surface lifecycle, explicit offset units, synchronous valid-layout reads and pending-layout completion through `Edit_input`/`Editor_sink` | DOM measurement and textarea input | Host text input, valid-layout reads, and completion when layout is pending |
| Plugin/media | Configuration, commands, lifecycle, typed widget props | JS plugin/browser media adapters | Currently supported native adapters |

Define shared `.mli` signatures and necessary implementation records, then explicitly install real services before creating the application.
Retain the single-application architecture without application-wide functors, generic DI containers, or platform parameters on every view.
Missing required services and invalid duplicate installation fail immediately.
Optional capabilities use explicit result/capability types rather than fake success or silent no-ops.
Do not retain native-first/browser-fallback compatibility paths.


Replace shared `Js.Promise.t` usage with a small shared OCaml `Ui_task` module.
Implement only create/resolve/reject/bind/catch/all and lifecycle operations required by existing callers, retaining `let*` syntax.
Specify deferred completion, rejection propagation, repeated completion, and application-thread callback execution before connecting host schedulers.
Native I/O threads submit completion messages and cannot directly mutate signals/model state or settle tasks that execute UI callbacks.
Extract correct, tested parts of the existing native promise state machine where practical.
Do not simply rename `Js`, emulate its full API, introduce a complete async framework, or add external dependencies.


JSON belongs at host/plugin/network serialization boundaries.
Shared worker data keeps `Wire.t`; UI events use existing or small OCaml records/variants.
Do not convert all UI state to `Wire.t` or use Yojson in shared code as a replacement for leaked browser JSON.
Keep raw plugin JS conversion in Web adapters and preserve efficient binary transport rather than converting payloads into integer lists.

### Editor target boundary

```text
Web textarea / GPUI system input
             |
       typed input events
             v
Shared editor controller ---> shared command/save/worker operations
             |
             v
Shared Edit_model / parser ---> shared Edit_view and overlays
             |                            |
             v                            v
   geometry reads/requests          host rendering/layout
             |                            |
             +---- host adapter <---------+
                         |
         valid snapshot / ready notification
                         v
               current editor session
```

Preserve `Edit_model` as the committed-text authority and retain shared selection, composition, rendering, and outliner behavior.
Evolve `Edit_input` and `Editor_sink` instead of creating another event bus or editor framework.
Prefer synchronous geometry access when the host has valid layout for the requested revision.
Distinguish an immediate valid result from pending layout and unavailable surfaces without forcing Web or native through an asynchronous request for every query.
Evaluate a host-published immutable layout snapshot and safe UI-thread reads against actual GPUI ownership and lifetime constraints.
Keep GPUI window/store handles out of shared contracts and do not block the OCaml pump waiting for the UI thread.
Use one shared extension schema where host bindings permit it; keep platform FFI and serialization at adapter boundaries.
Replace generic `dom-event` forwarding with typed shortcut, clipboard, pointer, focus, and menu inputs after inventorying all current consumers, including autocomplete and global shortcuts.


A surface identity must distinguish graph/session, block, scope, and mount generation.
Geometry results must identify the request and the text/layout revisions they measured, so a result from the same block and offset can still be rejected as stale.
Layout invalidation includes width, font/style, scrolling, and host relayout even when text is unchanged.
Use a valid immediate result in the current operation; if layout is pending, finish the operation once on the ready notification in the serialized application execution context.
Do not synthesize repeated key events to obtain geometry.
Cancel or supersede pending work on newer input, focus transfer, remount, graph/route changes, and disposal.
Required backend installation must be distinct from an installed backend whose surface is not mounted or whose layout is pending.
Use explicit readiness and capability states rather than a no-op conduit or indefinite retry loop.


Retain byte offsets for native model operations and UTF-16 units for Web model operations.
Native OS input APIs may themselves use UTF-16, so conversion must occur at the host input boundary rather than assuming every native offset is a byte index.
Do not use `Bytes` versus `U16` as the long-term switch for synchronous measurement, wrapping, or platform scheduling.
Represent those behaviors in the actual host contract and layout results.
Preserve supported CodeMirror and plugin capabilities without implementing a new native code editor or browser plugin runtime as part of deduplication.

### Task 1: Establish baseline and migration inventory

Files: This plan, `deps/ui/test/test_drive.ml`, `deps/ui/gpui/drive_test.ml`, `deps/ui/test/shared/drive.ml`, and `deps/ui/test/editor_browser_test.js`.

1. Record the stable checkout's differences, opam pins, UI build entries, and test results, separating pre-existing failures from regressions.
2. Recount and classify matching files as shared business logic, generic views, platform services, specialized widget adapters, or removable unused code.
3. Record each candidate's owner, differences, callers, tests, and deletion conditions in this plan; include native-only helpers.
   Revalidate the editor findings against current local changes, preserving already shared model/view/control source and recording actual command drift separately.
4. Extract duplicated scenarios from Web/native driver entries into new `deps/ui/test/shared/shared_scenarios.ml`, retaining host setup and event injection at each entry.
5. Add palette, settings, and sidebar scenarios and run both targets.
6. Establish editor model/view/controller baselines and actual Web/GPUI launch procedures, including IME, wrapping, offsets, and geometry completion.
7. Verify whether a working SwiftUI editor host is available before including it in a runtime parity claim.

Exit: The inventory distinguishes necessary differences from duplication, the baseline is reproducible, and shared scenarios do not depend on DOM or native thread APIs.

### Task 2: Prove one feature compiles from shared source

Files: `deps/ui/src/dune`, `deps/ui/subs/dune`, `deps/ui/native/dune`, `deps/ui/gpui/dune`, new `deps/ui/web/dune`, new `deps/ui/src/core/ui_task.ml/.mli`, and service files organized around actual interfaces.

1. Write boundary tests for scheduling, storage persistence, theme and route changes, rejection, cancellation, cleanup, and late responses.
2. Define minimal contracts and split browser `Platform` implementation from `deps/ui/subs/platform.ml` into `deps/ui/web/platform_web.ml`; narrow native implementation to `platform_native.ml`.
3. Start a library supporting both compilation modes with neutral contracts, `Wire`, `State_cell`, and task logic, using explicit module ownership.
4. Install real services in bootstrap, fail fast on missing required capabilities, and isolate global registrations using separate test processes.
5. Migrate a settings or palette scenario to prove an actual view and its events compile and execute from one implementation.

Temporary explicit build slices are acceptable, but new source-copy rules or a parallel native view set are not.
Merge slices into final shared libraries rather than leaving permanent duplicate libraries or module shadowing.
Keep `subs -> contracts`, `src -> subs/contracts`, and adapter dependencies acyclic through explicit Dune ownership.

Exit: One actual feature runs in both modes with tested service and task contracts.

### Task 3: Merge generic UI, state, and pure helpers

Files: `deps/ui/src/cmdk/`, `deps/ui/src/settings/`, `deps/ui/src/sidebar/`, `deps/ui/src/core/`, `deps/ui/src/properties/`, and matching native files.

1. Process helpers, settings/sidebar, palette, and properties in order, completing tests, migration, and deletion for each feature before starting the next.
2. Test Unicode, time, ordering, formatting, and SDK conversion behavior before merging helpers into ordinary OCaml implementations.
3. Replace shared DOM queries and event parsing with typed LUI events/props and services.
4. Resolve drift from correctness and behavior tests rather than mechanically choosing the Web or native version.
5. Update module ownership and delete each native business/view copy in its migration batch, then run both builds and relevant scenarios.
6. Generate dictionary, emoji, and icon tables once for both targets without introducing persistence formats or i18n keys.

Exit: Palette/settings/sidebar/properties and pure helpers each have one maintained source.

### Task 4: Merge subscriptions and worker control

Files: `deps/ui/subs/subs.ml`, `subs_state.ml`, `update.ml`, `page_delta.ml`, `promise_ext.ml`, `deps/ui/src/app/runtime.ml`, both `worker_client.ml` implementations, and both `daemon_client.ml` implementations.

1. Add graph-switch, rejection, disconnection, push-ordering, and stale-session response tests.
2. Replace shared promises with `Ui_task` and remove browser library dependencies from `subs`.
3. Keep Web Worker/Comlink/HTTP/SSE/IPC mechanics in transport adapters while sharing request lifecycle, push dispatch, and `Wire.t` handling.
4. Remove browser popup roots and JSON handles from shared runtime/reducer code and retain explicit error channels rather than masking programmer errors with `Wire.Nil` or defaults.
5. Share daemon protocol/business dispatch while preserving genuine I/O differences and existing db-worker, RTC, Electron IPC, and persistence protocols.
6. Delete duplicate worker control and subscription build copies, verifying completion through host pump/flush.

Exit: Model, reducer, subscriptions, and request control are shared, with transport as an explicit implementation boundary.

### Task 5: Merge complex features and refactor editor boundaries

Files: `deps/ui/src/views/`, `src/pages/`, `src/editor/`, `src/blocks/`, `src/render/`, `src/assets/`, `src/export/`, `src/sdk/`, `src/extension/`, and matching native files.

1. Add or reuse tests in batches ordered as query/table, page/render, assets/export, plugins, and editor.
2. Share query, sorting, filtering, menus, property editing, downloads, and plugin command control.
3. Replace generic imperative DOM construction with LUI kinds, typed props, `reactive`, `if_`, and `keyed`; do not move CSS layout into native shims.
4. Share typed props, events, and business state for PDF/media/CodeMirror widgets while retaining actual renderer-specific implementations.
5. Execute the editor batches below, preserving the existing shared model/view and save semantics.
6. Verify focus, virtual scrolling, and popup placement in actual hosts before deleting feature copies.

Preserve plugin capabilities currently supported by each host.
Do not reimplement the browser plugin runtime or replace working features with disabled controls or no-ops.
Represent previously unsupported native capabilities explicitly without adding full feature implementations incidentally.

Exit: Generic views and complex controllers have one source, and specialized widgets retain only necessary platform differences.

#### Task 5a: Specify editor contracts and lock down behavior

Files: `deps/ui/src/editor/edit_input.ml`, `editor_sink.ml`, `editor_state.ml`, `editor_surface.ml`, `deps/ui/test/edit_model_test.ml`, `edit_view_test.ml`, `test/dune`, and `deps/ui/gpui/drive_test.ml`.

1. Trace each editor event from host input through shared control to model/view and worker operations, including autocomplete, clipboard, menu, and global shortcut consumers.
2. Add behavioral regression scenarios for composition, save ordering, structural-operation queues, rejection, undo/redo, and dirty-buffer refresh before altering those flows.
3. Define surface identity, explicit model offset units, immediate valid geometry, pending-layout completion, readiness, capability, and disposal contracts around existing editor modules.
4. Add deferred and reordered geometry scenarios asserting one movement, preserved newer input, and no stale overlay.
5. Run the existing and new baseline scenarios and record pre-existing failures without hiding them in fallback behavior.

Exit: Editor behavior and host responsibilities are explicit, with failing regressions demonstrating the boundary defects being addressed.

#### Task 5b: Merge editor command business logic

Files: `deps/ui/src/editor/editor_cmds.ml`, `deps/ui/native/editor_cmds.ml`, `deps/ui/src/editor/editor_commands.ml`, clipboard/file service contracts from Task 2, and applicable command scenario entries.

1. Record the implementation and capability of each command on Web and GPUI, particularly comments, export, plugin context actions, and upload.
2. Add tests asserting worker/UI outcomes for supported commands and explicit unavailable behavior for genuinely unsupported capabilities.
3. Route clipboard writing, file selection, and host-specific dispatch through their established services.
4. Maintain one business dispatcher, keeping plugin runtime execution inside the platform adapter.
5. Remove the native dispatcher copy and update both build inventories in this batch.

Exit: Supported command behavior survives and future business commands have one implementation.

#### Task 5c: Prefer synchronous valid geometry and define pending layout

Files: `deps/ui/src/editor/edit_input.ml`, `editor_sink.ml`, `editor_surface.ml`, `editor_keys.ml`, `editor_actions.ml`, `deps/ui/src/extension/logseq_editor.ml`, `deps/ui/native/logseq_editor.ml`, `native_embed.ml`, and `deps/ui/gpui/host/src/editor.rs`.

1. Add scenarios proving that available valid layout supports immediate caret/point queries and one navigation operation without an extra frame request.
2. Write failing scenarios for pending layout, old replies after edits/resizes, same-UUID surface switches, remounts, and completion after disposal.
3. Trace UI-frame layout, patch application, OCaml pump execution, and bridge locks; select the smallest safe synchronous path using direct reads or a published immutable snapshot.
4. Implement immediate-result and pending-layout behavior in Web and GPUI, associating geometry with surface, text, and layout revisions.
5. Invalidate snapshots/caches on layout changes and unregister all surface-owned state and pending work on disposal.
6. Ensure ready notifications enter serialized shared control and cannot apply results to a newer session or cause cross-thread blocking/reentrant host access.
7. Complete pending navigation once when valid geometry arrives, preserving queued input and superseding obsolete work.
8. Replace `retry_vertical`, timer-based caret recovery, and scattered platform-unit flush branches only after immediate and pending-layout scenarios pass.
9. Verify actual Web and GPUI caret, selection, hit testing, popup anchoring, focus, and input responsiveness after editing and resizing.

Exit: Available geometry is read synchronously, pending layout has explicit completion, and shared control neither replays input nor trusts stale cached geometry.

#### Task 5d: Remove DOM dependencies from shared editor control

Files: `deps/ui/src/editor/editor_keys.ml`, `editor_actions.ml`, `editor_surface.ml`, `editor_state.ml`, `edit_view.ml`, both `logseq_editor.ml` adapters, and `deps/ui/native/editor_dom.ml`.

1. Add scenarios proving autocomplete ownership, shortcut routing, copy/cut/paste, pointer selection, focus transfer, and menus continue to work.
2. Translate host events into typed editor inputs and semantic target identities at the adapter boundary.
3. Replace document listeners, selector queries, DOM attribute reads, and JSON `dom-event` forwarding in shared editor control with those inputs and explicit services.
4. Preserve existing selection behavior, scope routing, worker ordering, and focus ownership while removing browser-shaped dependencies.
5. Share the extension schema and decoding contract without forcing Web textarea code and GPUI input code into one implementation.
6. Trace non-editor callers of `editor_dom.ml` and delete only helpers whose owning callers have migrated; do not move their simulation into a renamed module.

Exit: Shared editor controllers and view no longer require a DOM simulation or string-based document event channel.

#### Task 5e: Extract pure run parsing

Files: `deps/ui/src/editor/edit_runs.ml`, `edit_model.ml`, `deps/ui/src/render/render_inline.ml`, new `deps/ui/src/render/inline_parse.ml`, associated Dune ownership, and `deps/ui/test/edit_model_test.ml`.

1. Add behavior cases for nested markup, delimiters, URLs, page references, immutable block references, and Unicode around token boundaries.
2. Extract token matching and its data types into a pure parser shared by the editor and renderer.
3. Keep rendering, metadata lookup, LUI nodes, and browser FFI out of the parser's dependencies.
4. Verify unchanged editable source, run boundaries, rendered references, and selection behavior in both runtimes.
5. Preserve existing view patch locality and record performance against the baseline without adding an unrelated incremental parsing subsystem.

Exit: Model/run parsing is independent of UI rendering and browser emulation, with unchanged text semantics.

#### Task 5f: Validate and correct host input limitations

Files: `deps/ui/gpui/host/src/editor.rs`, `deps/ui/src/extension/logseq_editor.ml`, `deps/ui/src/editor/edit_input.ml`, `deps/ui/test/editor_browser_test.js`, and host test/launch entries identified in Task 1.

1. Add and run Rust regression tests for `utf16_slice` with astral characters, valid empty ranges, and ranges at the end of the scratch buffer; fix the confirmed indexing defect.
2. Test real OS IME updates, replacement ranges, candidate-window positioning, commit/cancel, blur, and navigation during composition on GPUI.
3. Change scratch-buffer selection/replacement handling only where the reproduced input contract requires it, preserving committed-text ownership in the shared model.
4. Validate soft wrapping and its navigation/selection consequences on each actual host; if GPUI lacks it, record the gap and complete required host layout support before claiming parity.
5. Verify code-block and plugin behavior against supported capabilities without adding a full native CodeMirror replacement.
6. Run the editor verification matrix and record Web/GPUI results, remaining capability gaps, and any independently verified SwiftUI results separately.

Exit: Native host correctness is demonstrated through tests and actual input, and no parity claim relies on comments, synthetic browser IME events, or mounting-only tests.


Task 1 establishes editor baselines before any editor implementation.
Task 5a contracts can be specified during Task 2; production migration uses the scheduler, services, and transport ownership established by Tasks 2 and 4.
Execute Tasks 5b through 5f in order, completing focused tests and actual host checks for each batch before deletion.
The confirmed UTF-16 host regression may be isolated as a tested fix before geometry migration, without treating that fix as completion of the editor refactor.

### Task 6: Remove runtime emulation and build copying

Files: `deps/ui/native/js.ml`, `webapi.ml`, `web_dom.ml`, `vdom.ml`, `imperative_dom.ml`, old DOM twins, and shared/platform/entry Dune files.

1. Trace remaining shared browser callers and migrate their owning features instead of adding shims.
2. Move browser FFI and JS-only imports into `web/`, removing Melange-specific externals and JS dependencies from shared modules.
3. Enable byte/native/melange modes for final shared libraries, with target-specific dependencies only in adapters and entries.
4. Link native/GPUI directly against the same shared UI and native adapter libraries, preserving necessary bootstrap, C bridge, and linking differences.
5. Remove business/adapter source-copy and duplicated table generation rules.
6. Delete unused JS/Webapi/DOM simulation and temporary migration libraries instead of retaining forwarding facades.

Retain genuine specialized widget rendering helpers by ownership rather than blindly deleting anything named DOM.
Do not use `Obj.magic`, `%identity`, disabled warnings, or compatibility fallbacks to make native compilation pass.

Exit: All entries directly consume shared libraries, with no business source copying or JS/DOM dependencies in shared code.

### Task 7: Verify and document the final architecture

Files: `deps/ui/test/`, applicable application E2E tests, `deps/ui/docs/architecture.md`, this plan, and configuration owning build checks.

1. Document shared/Web/native ownership and reasons for retained adapters.
2. Add a small architectural check rejecting browser FFI, `Js.*`, `Web_dom`, `Unix`, `Thread`, Yojson, and string-based DOM events in production shared code.
3. Check dependency direction, duplicate ownership, source copying, and required registrations without incorrectly rejecting generated code or test doubles.
4. Run builds and tests sequentially and record actual host interaction checks and baseline limitations.
5. Update architecture guidance for services, typed widgets, and shared scenarios, removing obsolete DOM/dyn examples.
6. Update decision lifecycle only according to actual implementation status.

## Alternatives considered

### Approach comparison

| Approach | Decision | Reason |
| --- | --- | --- |
| Keep twins and add parity tests | Reject | Detects drift but preserves duplicate feature maintenance |
| Expand native JS/DOM simulation | Reject | Retains browser constraints and the wrong boundary |
| Generate synchronized native views | Reject | Preserves two implementations and adds conversion logic |
| Use WebView everywhere | Reject | Changes the native rendering direction rather than sharing the current application |
| Application-wide functors or generic DI | Reject | Adds unnecessary type and assembly complexity |
| Delete every native file at once | Reject | Genuine platform services/widgets remain necessary and risks become hard to isolate |
| Shared libraries, small contracts, and feature-by-feature deletion | Adopt | Shares business implementation while preserving necessary platform capabilities |

## Acceptance criteria

- Generic views, feature state/controllers, reducer, subscriptions, and helpers each have one maintained implementation.
- Native/GPUI link the same shared and adapter libraries without business source copying or matching-name module overrides.
- Shared contracts expose no JS values, DOM handles, browser events, or native thread types.
- Browser runtime simulation used for generic UI leaves production builds.
- Every inventory candidate has an outcome, and each remaining platform pair has evidence of a genuine capability/rendering difference.
- One test scenario source executes in both runtimes and checks real business results.
- Supported features and worker/sync/DB/IPC protocols remain stable; unsupported capabilities do not report fake success.
- Web/native/GPUI builds, relevant tests, and interaction checks in actual renderers pass.
- Generic views follow current LUI rules: typed layout/events, `reactive`, no direct `dyn`, and no generic DOM extensions.
- Sharing introduces no new data classes/properties, parallel i18n system, or application-wide framework.
- Editor model, selection, composition, shared view, and outliner operations retain one source and their existing committed-text and save-ordering semantics.
- Editor business commands have one dispatcher, and genuine platform capabilities are explicit.
- Geometry results are tied to current surface/text/layout revisions; stale completion cannot alter newer input or draw an old overlay.
- Valid available native geometry supports synchronous access without an unnecessary frame round trip; pending layout uses notification without blocking the UI/pump across locks.
- One navigation intent completes once without synthetic key replay; shared editor control has no DOM selector/document-event dependency.
- Byte and UTF-16 offset behavior remains correct, including native OS UTF-16 conversion, Unicode boundaries, and real IME input.
- Native editor verification includes actual GPUI input, layout, and lifecycle behavior rather than only extension mounting.
- CodeMirror, wrapping, plugin, and SwiftUI capability gaps are documented and are not presented as achieved parity.

## Risks

- Runtime semantics, platform capabilities, and existing drift require verification per feature before deleting old implementations.

| Risk | Mitigation |
| --- | --- |
| JS/native promise scheduling differs | Test deferred completion, ordering, rejection, reentrancy, and thread ownership first |
| Unicode and string offsets differ | Cover emoji, CJK, combining characters, and IME; convert offsets at boundaries without changing Edit_model semantics |
| Existing implementations have drifted | Review both through behavioral evidence rather than minimizing diff size |
| View changes affect selectors/CSS | Reuse selector/interaction contracts and verify actual Web layout |
| Global services contaminate tests/hot reload | Define registration/disposal lifecycle, isolate tests, and fail fast on invalid duplicates |
| Late async responses update another graph | Preserve session/generation checks and unsubscription |
| Native capability integration is incomplete | Test actual hosts and report gaps rather than using successful stubs |
| Geometry replies outlive text/layout/surface state | Version snapshots and pending requests/results, invalidate them, and reject stale completion without replaying input |
| Synchronous bridge waits deadlock or access host state on the wrong thread | Prefer valid published snapshots or safe UI-thread reads; inspect bridge/entry locks and avoid blocking cross-thread measurement |
| Offset units accidentally stand in for host capabilities | Keep explicit units and independently represent readiness, wrapping, and scheduling |
| Editor refactoring expands into a model/widget rewrite | Preserve shared model/view and existing specialized widgets; isolate reproduced host defects |
| Dune module cycles/conflicts | Assign contracts explicitly and compile immediately after signature changes |
| Abstractions increase complexity | Follow real callers, delete old code per batch, and remove temporary migration libraries |
| Concurrent merge or unrelated changes | Begin implementation only from a stable checkout and preserve unrelated work |

## Testing Details

These are implementation verification steps; creating this plan does not run builds or functional tests.
Prefix commands with `rtk` and serialize Dune operations, including watch processes.
Establish baseline behavior and update artifact references after build changes; stale artifacts cannot demonstrate success.

```sh
# From deps/ui: build current Web/native targets and execute existing suites.
rtk opam exec -- dune build js_app test native/native_embed.exe.o gpui/native_embed.exe.o
rtk node _build/default/test/ui_test/test/test_main.js
rtk opam exec -- dune runtest gpui

# From the repository root: build the served UI.
rtk pnpm ui:build

# From deps/db-worker: build the browser worker.
rtk opam exec -- dune build js_api
rtk proxy ../../node_modules/.bin/vite build --mode browser

# From the repository root: start the application server in a separate terminal.
rtk python3 -m http.server 3002 -d static/

# From ocaml-e2e, after confirming current suite entries:
rtk opam exec -- dune build
rtk node parallel-runner.mjs

# From the repository root: required checks for the completed implementation.
rtk bb dev:lint-and-test
rtk bb lang:lint-hardcoded
rtk git diff --check
rtk spec-dev-tool check --all
```

Current root AGENTS.md specifies `ocaml-e2e/` as the application E2E suite, replacing the earlier plan's `clj-e2e/` commands.
The directory was present during the 2026-10-09 plan update; recheck its build and runtime prerequisites in Task 1.
Use application E2E coverage for outliner, palette, sidebars, queries, assets, and exports after confirming actual suite entries.
Do not invent test filenames or treat a missing suite as a passing check.
Do not add CLI E2E work unless CLI contracts change.
When dictionaries change, also run translation validation and formatting without incidentally changing UI wording.


Verify Web editor behavior using `runEditorBrowserTests()` from `deps/ui/test/editor_browser_test.js` on a disposable graph/origin.
Execute native model/controller scenarios using the Dune entries established in Task 5a, retaining appropriate string conversion at each runtime's test entry.
Run the Rust editor regressions through the GPUI host's confirmed Cargo package and test invocation from Task 1; record the failing case before its fix and the passing result afterward.
Verify GPUI using its existing launch procedure on disposable graphs and record palette, settings, real IME, focus, measurements, file selection, disconnection, and disposal behavior.
Verify SwiftUI only after locating and launching a working editor host; otherwise record its coverage as unavailable.
Confirm native launch commands in Task 1 rather than inventing commands or treating in-process drivers as actual renderer verification.


The research supporting this update read source and tests without running builds, model suites, browser interactions, or native hosts.
The document update does not establish a passing runtime baseline.
During this update, `spec-dev-tool` was absent from PATH; the existing executable at `/Users/tiensonqin/Codes/projects/spec_dev_tool/_build/default/bin/main.exe` provided its help and validation workflow.
Use the installed command when available, or confirm the local executable before validation.


Behavior tests verify UI results, worker mutations, persistence, errors, and cleanup.
Architecture checks verify compilation in both modes, dependency direction, and source-copy removal.
After sufficient verification passes for a batch, proceed rather than repeatedly running complete suites without changes.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation Details

- `src/` and `subs/` own shared implementation; platform directories own actual services and specialized adapters.
- Contracts have one owner, and multiple compilation modes link shared libraries directly.
- Preserve `Wire.t`, the shared editor model/view, and existing feature state ownership while evolving `Edit_input` and `Editor_sink` around synchronous valid geometry and revisioned pending completion.
- Keep shared async interfaces small and execute UI callbacks on the application thread.
- Generic UI uses LUI kinds, typed props/events, and `reactive`.
- JSON, DOM, native handles, and FFI remain at platform boundaries.
- Each feature batch deletes actual business copies and verifies both runtimes; already shared editor source is repackaged rather than rewritten.
- Preserve actual capabilities, fail fast on missing required services, and express optional capabilities explicitly.
- Finish by removing emulation, build copying, migration slices, and obsolete guidance.
- Do not introduce schemas, full async frameworks, or platform plugin runtimes.

## Questions

### Question

No user question blocks completion of this plan.
The final scope is complete deduplication, starting with settings/palette as the first verifiable slice and preserving existing working features.
Native launch procedures, implementation drift, host plugin capabilities, task scheduling differences, and current E2E prerequisites are engineering investigation items for Task 1.
Editor investigation items include the real OS replacement-range contract, geometry invalidation ownership, GPUI soft-wrapping support, and the availability of a working SwiftUI editor host.
These items require evidence during implementation and do not block this documentation update.
If execution requires changing product behavior or modifying external LUI code, prepare a concrete change proposal and proceed within actual authorization.

---

## Execution progress (2026-10-09)

The implementation baseline is `a995252bd8` on `refactor/lui`, pushed to origin after publishing and legacy frontend cleanup.
Unrelated work preserved at this baseline: root `AGENTS.md`, `docs/agent-guide/001-master-outliner_report.md`, and `docs/ocaml-gpui-architecture.html`. The existing staged version and working edits of this plan are preserved; execution adds evidence to the same decision. No Git merge is active.

Status: Paused at the user's request for handoff to another model. Task 1 is committed and pushed as cf4f0195cb; the first Task 2 slice is committed and pushed as 1b2e5f0bff. Tested theme/route baselines and platform extraction were uncommitted at pause and are now checkpointed as ad675c389f at the user's request. HEAD 8f373d1b46 included a normal merge of remote worker build updates; checkpoint preparation also fast-forwarded the later non-overlapping remote updates. Task 2 remains incomplete; Tasks 3–7 are pending. Actual OS input and layout checks remain explicit validation gaps. Resume from the current handoff section above rather than older revisions recorded below.

The repeated inventory is 71 native `.ml` files, 56 matching names, zero byte-identical pairs, and 109 shared source-copy rules in `native/dune`. Shared source uses `Js.*` in 106/160 files and `Web_dom.*` in 76/160; subscriptions use `Js.*` in 6/10. Name matches remain investigation candidates rather than deletion decisions.

Current UI pins: `lui` ee51c9747e584edd2ac09cc2cefee130622d8bda; `ocaml-signal` 868c1459f865b4ba3b227eb440dba40f1c812899; `drive` 1e1653d5bdd0810e89d9e3a32b2e0ea2811c1cf5; Melange Transit 38ca92e299cf34c897d9a44091fe86e55b1315ee; Melange EDN 3cb79f278e972388a0a2b2ea1caec7a008a0b956. Dune uses the installed opam packages; Rust GPUI uses the sibling LUI checkout, so those revisions must be recorded separately for renderer verification.

Baseline build: `opam exec -- dune build js_app test native/native_embed.exe.o gpui/native_embed.exe.o` passes. Web suite passes 1,583 checks. The actual Web entry is `_build/default/test/ui_test/test/test_main.js`; the earlier example in this document contained an extra `ui_test/` segment. Native Drive initially reports 125 checks / five sidebar failures because it reads the real application support state; isolate storage before claiming a deterministic native baseline.

GPUI launch ownership is confirmed in `gpui/host/src/main.rs` and `build.rs`: build the complete OCaml object, then `cargo run` from `gpui/host`. Host pump and UI-frame queues remain separate and cannot safely block on each other. No SwiftUI Logseq application entry or editor adapter exists under `deps/ui`; LUI Apple gallery applications alone cannot establish Logseq editor parity. Actual host input, wrapping, IME, and layout checks remain pending.

### Candidate ownership and deletion gates

The owner below is the existing shared feature path. Caller samples establish reachability, not a completed exhaustive migration. Tests listed use existing production code; missing focused coverage is explicit. Detailed behavior differences must be resolved in the owning batch before deletion.

| Module pair | Classification | Shared owner | Caller samples | Existing test references | Deletion gate |
| --- | --- | --- | --- | --- | --- |
| `asset_dom` | Platform service | `src/assets/asset_dom.ml` | src/blocks/tree.ml; src/app/worker_events.ml; src/render/pdf_annotation.ml | edit_view_test.ml | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `asset_store` | Platform service | `src/assets/asset_store.ml` | src/extension/pdf_assets.ml; src/extension/pdf.ml; src/render/pdf_annotation.ml | Production Drive mount; add focused coverage before migration | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `block_dnd` | Widget adapter / control | `src/dnd/block_dnd.ml` | src/editor/editor_keys.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `chrome` | Business logic / generic view | `src/shell/chrome.ml` | src/app/view.ml | Production Drive mount; add focused coverage before migration | Run the same real-view scenarios in both runtimes; remove native copy |
| `cmdk_state` | Business logic / generic view | `src/cmdk/cmdk_state.ml` | src/blocks/selection_bar.ml; src/shell/chrome.ml; src/popups/popups_state.ml | test_main.ml, test_drive.ml | Run the same real-view scenarios in both runtimes; remove native copy |
| `cmdk_view` | Business logic / generic view | `src/cmdk/cmdk_view.ml` | src/sidebar/right_sidebar_view.ml; src/shell/chrome.ml | Production Drive mount; add focused coverage before migration | Run the same real-view scenarios in both runtimes; remove native copy |
| `code_mirror` | Widget adapter / control | `src/editor/code_mirror.ml` | src/extension/cm_adapter.ml; src/render/render.ml; src/editor/editor_commands.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `comments` | Business logic / generic view | `src/blocks/comments.ml` | src/blocks/selection_bar.ml; src/blocks/tree.ml; src/comments/comments_view.ml | Production Drive mount; add focused coverage before migration | Run the same real-view scenarios in both runtimes; remove native copy |
| `daemon_client` | Platform service | `src/core/daemon_client.ml` | src/core/worker_client.ml; src/graphs/collaborators.ml; src/graphs/exporter.ml | Production Drive mount; add focused coverage before migration | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `dates` | Pure helper / generated data | `src/core/dates.ml` | src/sidebar/sidebar_state.ml; src/app/graph.ml; src/app/boot.ml | test_main.ml | Prove Unicode/order parity; give shared source one library owner |
| `dnd_kit` | Widget adapter / control | `src/dnd/dnd_kit.ml` | Transitive entry / adapter callers require tracing | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `editor_cmds` | Business logic / generic view | `src/editor/editor_cmds.ml` | src/editor/editor_commands.ml | Production Drive mount; add focused coverage before migration | Run the same real-view scenarios in both runtimes; remove native copy |
| `emoji_mart` | Widget adapter / control | `src/icon/emoji_mart.ml` | src/extension/logseq_emoji.ml; src/app/boot.ml; src/sdk/sdk_write.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `export_page` | Business logic / generic view | `src/export/export_page.ml` | Transitive entry / adapter callers require tracing | Production Drive mount; add focused coverage before migration | Run the same real-view scenarios in both runtimes; remove native copy |
| `fuzzy` | Pure helper / generated data | `src/popups/fuzzy.ml` | src/popups/popups_state.ml; src/views/views_popup.ml; src/views/views_head.ml | test_main.ml | Prove Unicode/order parity; give shared source one library owner |
| `html_to_md` | Platform service | `src/editor/html_to_md.ml` | src/editor/editor_actions.ml | Production Drive mount; add focused coverage before migration | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `icon_picker` | Widget adapter / control | `src/icon/icon_picker.ml` | src/comments/comments_view.ml; src/properties/properties_area.ml; src/popups/popups_view.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `icon_picker_names` | Pure helper / generated data | `src/icon/icon_picker_names.ml` | src/icon/icon_picker.ml | Production Drive mount; add focused coverage before migration | Prove Unicode/order parity; give shared source one library owner |
| `icon_tabler_data` | Pure helper / generated data | `src/core/icon_tabler_data.ml` | src/core/web_dom.ml; src/core/icons.ml | Production Drive mount; add focused coverage before migration | Prove Unicode/order parity; give shared source one library owner |
| `icons` | Pure helper / generated data | `src/core/icons.ml` | src/sidebar/left_sidebar_view.ml; src/core/web_dom.ml; src/core/ui_parts.ml | Production Drive mount; add focused coverage before migration | Prove Unicode/order parity; give shared source one library owner |
| `lazy_children` | Widget adapter / control | `src/virt/lazy_children.ml` | src/blocks/tree.ml; src/pages/page.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `logseq_codemirror` | Widget adapter / control | `src/extension/logseq_codemirror.ml` | src/extension/web_ext_adapters.ml; src/render/render.ml; src/views/views_query.ml | test_lui_apply.ml, editor_bench.ml, edit_view_test.ml, test_drive.ml, drive_test.ml | Split shared state/control from actual host rendering/input |
| `logseq_editor` | Widget adapter / control | `src/extension/logseq_editor.ml` | src/extension/logseq_virt.ml | test_main.ml, test_lui_apply.ml, editor_bench.ml, edit_view_test.ml, test_drive.ml, drive_test.ml | Split shared state/control from actual host rendering/input |
| `logseq_el` | Widget adapter / control | `src/extension/logseq_el.ml` | src/blocks/comments.ml; src/blocks/query_builder.ml; src/blocks/selection_bar.ml | test_lui_apply.ml, editor_bench.ml, edit_view_test.ml, test_drive.ml, drive_test.ml | Split shared state/control from actual host rendering/input |
| `logseq_emoji` | Widget adapter / control | `src/extension/logseq_emoji.ml` | src/blocks/tree.ml; src/sidebar/right_sidebar_view.ml; src/comments/comments_view.ml | test_lui_apply.ml, editor_bench.ml, edit_view_test.ml, test_drive.ml | Split shared state/control from actual host rendering/input |
| `logseq_katex` | Widget adapter / control | `src/extension/logseq_katex.ml` | src/extension/web_ext_adapters.ml; src/render/render_inline.ml | test_lui_apply.ml, editor_bench.ml, edit_view_test.ml, test_drive.ml | Split shared state/control from actual host rendering/input |
| `logseq_virt` | Widget adapter / control | `src/extension/logseq_virt.ml` | src/core/interaction_perf.ml; src/virt/virt_list.ml | test_lui_apply.ml, editor_bench.ml, edit_view_test.ml, test_drive.ml | Split shared state/control from actual host rendering/input |
| `page_menu` | Business logic / generic view | `src/pages/page_menu.ml` | src/shell/chrome.ml; src/properties/properties_menu.ml | Production Drive mount; add focused coverage before migration | Run the same real-view scenarios in both runtimes; remove native copy |
| `pdf` | Widget adapter / control | `src/extension/pdf.ml` | src/app/boot.ml; src/render/render_inline.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `pdf_annotation` | Widget adapter / control | `src/render/pdf_annotation.ml` | src/render/render.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `pdf_assets` | Widget adapter / control | `src/extension/pdf_assets.ml` | src/extension/pdf.ml; src/render/pdf_annotation.ml; src/sdk/plugin_host.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `pdf_hls` | Widget adapter / control | `src/extension/pdf_hls.ml` | src/extension/pdf.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `pdf_toolbar` | Widget adapter / control | `src/extension/pdf_toolbar.ml` | src/extension/pdf.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `pdf_utils` | Widget adapter / control | `src/extension/pdf_utils.ml` | src/extension/pdf_assets.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `platform` | Platform service | `subs/platform.ml` | src/blocks/tree.ml; src/blocks/comments_ops.ml; src/sidebar/sidebar_state.ml | stub_dom.ml, test_main.ml, edit_view_test.ml, drive_test.ml | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `plugin_host` | Platform service | `src/sdk/plugin_host.ml` | src/sidebar/left_sidebar_view.ml; src/settings/settings_view.ml; src/app/worker_events.ml | Production Drive mount; add focused coverage before migration | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `plugin_readme` | Business logic / generic view | `src/dialogs/plugin_readme.ml` | src/dialogs/plugins_view.ml; src/dialogs/dialogs_view.ml | Production Drive mount; add focused coverage before migration | Run the same real-view scenarios in both runtimes; remove native copy |
| `plugins_view` | Widget adapter / control | `src/dialogs/plugins_view.ml` | src/dialogs/dialogs_view.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `properties_data` | Business logic / generic view | `src/properties/properties_data.ml` | src/blocks/query_builder.ml; src/extension/pdf_assets.ml; src/extension/pdf.ml | test_main.ml | Run the same real-view scenarios in both runtimes; remove native copy |
| `properties_value` | Business logic / generic view | `src/properties/properties_value.ml` | src/properties/properties_calendar.ml; src/views/views_table.ml | test_main.ml | Run the same real-view scenarios in both runtimes; remove native copy |
| `render_libs` | Platform service | `src/render/render_libs.ml` | src/extension/logseq_katex.ml; src/render/render_inline.ml | Production Drive mount; add focused coverage before migration | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `sdk_convert` | Pure helper / generated data | `src/sdk/sdk_convert.ml` | src/sdk/plugin_host.ml; src/sdk/sdk_config.ml; src/sdk/sdk_util.ml | test_main.ml | Prove Unicode/order parity; give shared source one library owner |
| `sdk_util` | Platform service | `src/sdk/sdk_util.ml` | src/settings/settings_state.ml; src/properties/properties_data.ml; src/sdk/title_refs.ml | test_main.ml | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `sdk_write` | Business logic / generic view | `src/sdk/sdk_write.ml` | src/sdk/sdk_api.ml; src/editor/editor_commands.ml | test_main.ml, test_drive.ml | Run the same real-view scenarios in both runtimes; remove native copy |
| `settings_page` | Business logic / generic view | `src/settings/settings_page.ml` | src/settings/settings_view.ml; src/shell/chrome.ml; src/dialogs/dialogs_view.ml | Production Drive mount; add focused coverage before migration | Run the same real-view scenarios in both runtimes; remove native copy |
| `sidebar_state` | Business logic / generic view | `src/sidebar/sidebar_state.ml` | src/sidebar/right_sidebar_view.ml; src/sidebar/left_sidebar_view.ml; src/shell/chrome.ml | test_main.ml, test_drive.ml, drive_test.ml | Run the same real-view scenarios in both runtimes; remove native copy |
| `sprintf` | Pure helper / generated data | `src/core/sprintf.ml` | Transitive entry / adapter callers require tracing | Production Drive mount; add focused coverage before migration | Prove Unicode/order parity; give shared source one library owner |
| `transit` | Platform service | `src/core/transit.ml` | src/core/worker_client.ml; src/core/daemon_client.ml; src/sdk/sdk_write.ml | Production Drive mount; add focused coverage before migration | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `version` | Platform service | `src/core/version.ml` | src/settings/settings_page.ml; src/shell/chrome.ml | Production Drive mount; add focused coverage before migration | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `views_popup` | Widget adapter / control | `src/views/views_popup.ml` | src/views/views_table.ml; src/assets/asset_dom.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `views_query` | Business logic / generic view | `src/views/views_query.ml` | src/views/views_view.ml | test_main.ml | Run the same real-view scenarios in both runtimes; remove native copy |
| `views_table` | Business logic / generic view | `src/views/views_table.ml` | src/views/views_view.ml; src/views/views_head.ml | test_main.ml | Run the same real-view scenarios in both runtimes; remove native copy |
| `virt_list` | Widget adapter / control | `src/virt/virt_list.ml` | src/blocks/tree.ml; src/views/views_table.ml; src/pages/page.ml | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `virtualizer` | Widget adapter / control | `src/virt/virtualizer.ml` | Transitive entry / adapter callers require tracing | Production Drive mount; add focused coverage before migration | Split shared state/control from actual host rendering/input |
| `web_dom` | Platform service | `src/core/web_dom.ml` | src/blocks/comments.ml; src/blocks/query_builder.ml; src/blocks/selection_bar.ml | test_drive.ml | Move real I/O/FFI behind neutral contracts; preserve host capabilities |
| `worker_client` | Platform service | `src/core/worker_client.ml` | src/sidebar/sidebar_state.ml; src/core/daemon_client.ml; src/app/worker_events.ml | fake_worker.ml | Move real I/O/FFI behind neutral contracts; preserve host capabilities |

Native-only `Js`, `Webapi`, `Vdom`, `Imperative_dom`, `Dom_ext`, `Editor_dom`, `Properties_dom`, `Views_dom`, `Views_virt`, `Browser_ui`, and `Host` are emulation, lifecycle, or host boundaries. Trace all callers and retire emulation only after their owning feature migrations; retain actual host mailbox and specialized input/rendering services. `Native_embed`, `Logseq_lui_bridge`, and `Menu_bar` own native entry/linking and host integration. They are not duplicated business-view deletion candidates.

### First implementation batch

The Drive replay/event harness and palette/settings/sidebar assertions now belong to `test/shared`, a single byte/native/Melange library linked by both entries. Host setup, key injection, and native chrome actions remain at the entries. The same settings scenario dispatches the real switch event, checks persistence, closes/reopens the dialog, and checks the retained value. Web passes 1,589 checks; native passes 131.

Native storage isolation was first reproduced as a failing process integration test, then fixed using `LOGSEQ_UI_STATE_DIR`. The Dune test entry creates a fresh process with an isolated UI state directory and graph root. An empty explicit directory is rejected during startup; its regression also failed before the fix. Normal host storage continues to use its application support directory.

Actual Web baseline ran the full production editor browser suite on a disposable origin. One continuous Delete scenario failed: expected `["first", "C", "D"]`, observed `["firstC", "D"]`. All other cases passed. Four page errors were the deliberately injected rejection cases and are not independently classified as unexpected runtime errors. The Delete failure remains an editor queue investigation for Task 5; this batch does not claim the editor baseline is green. Browser composition simulation does not demonstrate OS IME support.

Rust GPUI initially failed to compile because the smoke entry omitted the window argument for `pump_tick`. After correcting the entry, linking exposed missing modern LUI C ABI exports in Logseq's bridge. These are baseline host integration defects, not evidence of UI parity. The sibling LUI checkout is ad0a64760dddbaa59fcb7533a473ab893d5fe182; installed OCaml LUI remains ee51c9747e584edd2ac09cc2cefee130622d8bda.

The UTF-16 range regression was run against the exact production function extracted for `rustc --test` while the host link was repaired. Two of three tests failed before the indexing fix, including `[0,2)` returning `😀a` and an interior-surrogate range returning `a`. All three pass after replacing scalar enumeration with cumulative UTF-16 offsets and rejecting non-boundary or invalid ranges. Full Cargo passes all 12 tests, including the production palette UTF-8 input and render-tree resync smoke. Actual window interaction remains unverified. This is the isolated host fix allowed before the geometry migration; it does not complete Task 5f.

The modern bridge exports length-aware UTF-8 input, extension events, modifier presses, and resync. The Cargo smoke proves an embedded NUL plus Chinese and emoji reaches the production palette, then survives a cleared host mirror and complete resync. LUI resync previously assumed every app owned a `Root` kind; ordinary apps can instead own a column/text/extension, and detached extensions were omitted. The upstream repair is https://github.com/logseq/lui/pull/162 (head 1ca2b862687bc525ffc2623410719db09e0cd926), with 86 native OCaml tests passing. All six CI jobs and the WIP check passed; the PR was merged as 91aecb52a1cba2faaf23aac1d64a0bd1cb6549e7. Local opam returns to the updated main pin; the sibling sources contain the same repair for the restored baseline.

After the dependency repair, Web reports 1,589 checks / zero failures; the isolated native entry reports 131 checks / zero failures plus both process-isolation tests passing. Complete Web/native/GPUI OCaml targets and the regular GPUI Cargo binary build pass. Pre-existing Cargo warnings remain visible.

The user requested keeping the physical display asleep. Foreground native UI verification is deferred; no actual OS IME, soft-wrap navigation, or native caret geometry parity is claimed. These remain required editor-phase checks using a method compatible with that constraint. Task 2 proceeds from reproducible in-process and host-bridge baselines, with the known continuous Delete failure retained for Task 5.

### Task 2: First shared compilation slice

`src/contracts/` owns `Wire`, `State_cell`, `Ui_task`, and `Ui_services`; `src/shared/` owns the existing `Ui_parts` and `Settings_controls`. Both libraries compile in byte/native/Melange modes, with no `Js`, `Web_dom`, or `Platform` references. The separate directories are explicit temporary Dune ownership slices: the existing `src` library includes subdirectories unqualified, so a portable library cannot own selected modules in its existing mixed browser-dependent directories. Merge these slices into the final shared UI structure in Task 6; do not duplicate their modules in native libraries. Four old source-copy rules were deleted from each native and GPUI build. No source-copy rule was added.

Web bootstrap installs browser storage, literal-text conversion, flush, and microtask services through `web/platform_web.ml`. Native bootstrap installs native persistence, literal-text identity, flush, and mailbox services before creating the app. Native service access checks ownership of the serialized application entry, including initialization. This preserves the current main-input/pump-thread arrangement; consolidating that arrangement into final task/transport ownership remains Task 4 work. Tests install the same adapters before their real production view.

The task contract supports deferred observers, first-completion ordering, rejection propagation, exception handling, ordered/empty `all`, cancellation, cleanup, and late-response suppression. Its completion functions only enqueue work, including from actual native I/O threads. Seven scenarios failed against the extracted inline native promise behavior before deferring completion/observation and adding cancellation guards; all nine shared task scenarios now pass in both runtimes, plus the native thread check. The service regression first failed on duplicate installation, then passed with fail-fast installation.

The production settings controls compile directly from the shared library. Boolean preference reads/writes and state-cell flushes use neutral services. Sidebar/settings scenarios read persisted values through the same service contract. The initial Web adapter captured a stale storage object: two existing sidebar persistence assertions failed when the browser test fixture refreshed its globals. Reading the current browser storage at the boundary restores the existing access behavior; all 1,589 Web checks pass again. Native reports 131 checks / zero failures and both isolated-process checks pass.

At this committed slice, theme/route baselines and platform extraction remained pending. They have since been added, verified, and checkpointed as ad675c389f as described in the handoff above. Neutral theme/navigation contracts, actual shared-consumer migration, and narrowing the remaining monolithic platform adapters are still pending. Task 2 is not complete. Existing shared promises outside this first slice remain unchanged until their owning migration batches.

All nine independent review passes completed for this slice. Review found that the new contract scenarios were built but omitted from the standard UI test command. A Web `runtest` rule and the existing native test now run through `pnpm test:ui`; the command passes 1,589 application checks, and a forced contract alias runs all nine scenarios in both runtimes, both service checks, and the actual native I/O-thread check. No graph schema or persistence representation changed, so no migration or schema bump is required.

The headless production C-bridge smoke also calls `lui_ocaml_stop`: disposal is accepted, the root becomes zero, all host nodes disappear, and a subsequent mailbox pump neither remounts the app nor produces patch errors. This verifies the current path, not concurrent teardown or same-process restart. Disposal serialization and transport retirement remain Task 4 lifecycle work; service installation intentionally follows the single-application contract.

The performance pass measured quadratic cancellation when `all` contains thousands of repetitions of one pending task, because each subscription removal scans that task's listener list. No current production code consumes `Ui_task`, so this is a kernel integration question rather than a demonstrated application regression. Reassess actual observer fan-out before connecting request deduplication in Task 4; preserve prompt subscription cleanup if that path needs a constant-time unlink implementation.

### Parallel-batch integration progress (2026-10-08, coordinator)

Task 2 contract layer landed (`ef8d49f385` + follow-ups): `Ui_services` gained semantic `theme_*`/`nav_*`/`doc_*` ops with Web (`web/platform_web.ml`) and native (`native/services/platform_native.ml`) implementations; all production consumers migrated (settings, boot, router, subs_state, sidebar, pages, properties_menu, popups, chrome, sdk, exporter, editor nav, render_inline, js_app). Contract tests cover theme quoting/class swaps, live `prefers_dark`, push vs quiet replace, history stack, graph-qualified args, dual-channel on_change/on_navigate, lang pref. Web 1,605 checks (1 known Linux `decorate mod` failure), native 147 + contracts green.

Nine child sessions executed the remaining batches in parallel on `devin/SHAREDUI-*` branches; coordinator merges into `refactor/lui`:

Merged:
- **Task 6 inventory** (`9059301256`): `devin/ui-task6-emulation-inventory.md` — caller map + dead-code candidates; `logseq_virt`/`virt_list` reported dead but is a live substitution pair (src/pages/page.ml calls it); per-item verification required before deletion.
- **3d properties** (`19bc3069f3`): `src/properties/properties_{data,value}.ml` sole owners; `native/properties_{data,value}.ml` deleted (−1,387). New `Properties_services` contract; host gains `random_uuid`. Shared scenarios wired in both runtimes (gpui + coordinator-added Melange `props_host`). 1,622 web / 164 native checks.
- **3b settings+sidebar** (`d2977863f8`): `settings_page`/`sidebar_state` single portable owners; native copies deleted. New `Ui_dom` typed DOM boundary (FLAGGED: fold overlapping ops into `Ui_services` — `prefers_dark`→`theme_prefers_dark`, `navigate_hash`→`nav_set_hash` remapped at merge; `Ui_dom.dispatch "ls:navigate"` retained for the host DOM-event channel). 1,642 web / 184 native checks.
- **views query/table** (`4ec5e4b02d`): `views_query`/`views_table` single portable owners (−1,754 native); `data_gen` fetch-generation staleness guard fixed (old responses dropped); `V.query_error` now renders. Missing contract ops flagged for Task 6 (publishing, clipboard, encode_uri_component, random_uuid, payload_str, console_error, perf_mark, get_element_by_id, debounce, win_inner_height). 1,660 web / 202 native checks.

Merged (second wave):
- **5b editor-cmds** (`93e27a2d68`): `editor_cmds` single portable dispatcher with `capability`/`host`/`outcome` types; web adapter `src/editor/editor_cmds_host.ml`, native `native/editor_cmds_host.ml`; native gains add-comment + copy-export-as; plugin-ctx reports `Unavailable_command` on native. `native/editor_cmds.ml` deleted.
- **Batch 4 subs→Ui_task** (`7031ff41c0`): `subs_state`/`page_delta`/`subs` all shared flows on `Ui_task`; `task_of_promise`/`promise_of_task` adapters at the transport boundary (fixed post-merge: single then/catch chain — the original produced unhandled rejections). Callers adapted at edges (worker_events, outliner_ops, properties_state, sdk_util×2). `subs/promise_ext.ml` intentionally remains (~80 worker-RPC consumers). Task-fenced subs pipeline tests in both runtimes.
- **5a editor regression tests** (`69ee7aeb69`): `edit_flow_test` shared host suite (~500 lines) + `edit_view_web_test` + native `edit_geom_test`; `test_check` gains xfail counters. Documents 5 expected-failures incl. the known continuous-Delete boundary defect and native mounted-input stale-source pushback.
- **3a pure helpers** (`52be429a0b`): dates/fuzzy/sprintf/icons/icon_tabler_data/icon_picker_names/sdk_convert/version → `src/shared/` single owners (−2,586 twin lines); `Ui_services.time` service added; portable `Json.t` contract with `sdk_json` boundary adapters; `search_normalize` now NFKD+strip-marks (fixes the old near-no-op strip); generator rules consolidated to `src/shared/dune`.
- **3c cmdk** (`b0c43bda2a`): `cmdk_state`/`cmdk_view` → `src/shared/` single owners with `Cmdk_services` (~70-op seam) + `Cmdk_json` portable codec; native twins deleted; uses `Ui_services.nav_*` — cmdk was the last Platform nav caller. Coordinator note: `Cmdk_services` is the ready-made surface if any ops graduate into `Ui_services`. Post-merge: `journal_title_of_day` re-pointed to `Ui_services.time_of_fields` in both hosts (3a's `Dates.t`=float migration).

Post-merge test state: web 1,881 checks / 1 known failure + 1 expected-failure; native 578 checks / 5 expected-failures; contracts green. Merge-time fixes recorded above (unhandled-rejection adapter, props_repo reset after graph-switch scenario, time-of-fields for journal titles).

All nine children integrated. Open flags for Task 6: `Ui_dom` folding, `Properties_services` op gaps, `~gap:24` native sidebar param, test-env `set_language` lazy-assets throw (host catches), remaining `Platform.*` ops in views (see above).
