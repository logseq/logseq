# Await the canonical outline owner before restoring history

## Reference and runtime

Actual master Electron at `7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8` and actual
native SDL/LUI, both 1280x900, scale1, English/light. Native branch is
`codex/native-ui-parity-master`, base `7b0d18735000f2b7ae6342c410df476088baa543`.
Disposable Contents/Quick add/main fixtures are retained from the preceding
[add-row checkpoint](../append-owner/validation.md). No graph visualization was
opened/tested; it remains explicitly excluded by the user.

## Before: canonical data arrived after cursor restoration

The preceding candidate restored both worker rows on Undo but displayed the
merged input. Its final binary can eventually resynchronize through the delayed
background pipeline; this is a correction to interpreting the earlier nine-second
capture as a permanent failure. `native-undo-source-trace.txt` proves the concrete
ordering: history received two cursors, `restore_history` read the old merged
sidebar title, and only a later source refresh saw the restored title. Redo also
initially read the unmerged title. `native-before-undo.png` is the eventually
correct display, **not** an immediate failure screenshot; immediate pre-fix
captures are in the preceding add-row evidence.

Native UI/worker logs were checked. General app log errors are no-op in this host,
so temporary labeled source traces were used for diagnosis and then removed.
The production native test `owner-await-red.txt` fails because history finishes
while its owner read is still held. This matches the actual stale-source path.

## Fix and ownership

- Extend the existing independently stored block-source registration with its
  awaited refresh; no second source registry or parallel title cache.
- History still awaits normal route refresh, then awaits the selected cursor's
  independent owner before reading that owner's canonical block and restoring
  input/selection/focus. This avoids stale same-UUID data in another container.
  Missing owned blocks do not fabricate empty editor buffers. Historical route
  scopes retain their existing behavior rather than raising a new registry error.
- Sidebar and Quick add reads retain generation ownership and one latest-task
  reference. A superseded awaited read joins the authoritative latest read;
  obsolete failures do not terminate that newer read, current failures propagate.
  No polling, new timer, new worker or retry RPC is introduced.
- Background sidebar resync does not supersede a structural command's cursor
  restoration. Context/session guards remain. Quick add owner changes retire old
  responses, including reset/reopen boundaries.

## Paired actual native/reference checks

The final native binary was launched as SDL299849. Each action below was verified
through actual keyboard/pointer input and screenshots, not a browser substitute
for native. Reference actions use normal Playwright input attached to the actual
Electron renderer, without forced clicks or application-state injection.

| Interaction | Result and evidence |
| --- | --- |
| Contents first-row End, Delete merge | Both show `Sidebar append ownership paritySidebar second append`; paired `*-final-merged.png` |
| Ctrl+Z | Both immediately return two original rows with first-row input restored; paired `*-final-undone.png` |
| Ctrl+Shift+Z, then Ctrl+Z again | Both merge and restore without waiting for the background reload window; `*-final-redone.png`, native `*-final-restored.png` |
| Type a temporary pipe at restored caret | Both insert after the first row's 31 characters, not at the merged end. `*-caret-probe.png`; reference DOM selection31→32 in `master-interactions.json`. Native Backspace removes it. Reference immediate cleanup instead removed an earlier space; see the explicit qualification below. |
| Quick add type a pipe, allow autosave, Undo/Redo/Undo | Both restore original / append pipe / restore original with retained scope and input. Paired `*-quick-typed/undone/redone/restored.png`; reference caret22/23/22 in `master-quick-interactions.json`; native worker snapshots prove the pipe saved and was reverted. |
| Final worker data | Native `native-final-restored.json` and later reference `master-fixture-restored.json` retain Contents two original titles/order; `*-quick-restored.json` retain blank first + original second row. No Add to today action was pressed. |
| Full native UI + own worker restart | Caption-closed UI299849, verified exact worker280032 arguments before TERM, launched fresh UI/worker and reopened the same fixtures. `native-restarted-*.json/png` verify persisted restored rows and unchanged main page. This checks data durability, not Undo-stack persistence across worker restart. |

Reference cleanup qualification: although the pipe-input DOM value and caret
were correct, the following rapid Backspace/Escape saved `Sidebar appendownership
parity`, deleting an earlier space. `master-saved-restored.png` and
`master-final-restored.json` retain that failed cleanup. This is not counted as
matching Backspace behavior. The reference sample was restored using normal
click/Ctrl+A/typing, a settled save and Escape; `master-fixture-restored.png/json`
and `restart-comparison.json` distinguish that setup repair from the history
checks. The timing/caret transition needs a focused reproduction; no native
workaround or claimed root cause is added here.

The Contents merge/Undo/Redo/Undo native screenshot batch completed in under
three seconds; this is evidence it no longer depends on the multi-second
background refresh, not a controlled latency benchmark. Native bullet placement,
14px sidebar text and Quick add modal geometry still differ visually.

## Tests and independent review

- New production native `history_scope_test` exercises held owner reads in both
  directions, exact caret2 (not the old5), supersession, obsolete rejection,
  navigation retirement, Quick add ownership despite stale same-UUID sidebar
  data, reset cancellation, latest-read rejection, existing Undo error toast,
  structural queue release and successful subsequent retry.
- `superseded-read-red.txt` records the independently reviewed race before the
  latest-task join repair. Green counterparts and final native suite logs remain.
- Shared editing-pipeline regression reproduces an obsolete Quick add read
  overwriting fresh rows: `quick-add-order-red.txt` (**2120/1**), then green
  (**2120/0**). This independent two-transport ordering runs under Melange/Web;
  native identical-read coalescing prevents that exact transport ordering in its
  fixture, so the test explicitly skips it there. Native history itself is tested
  separately, including actual Quick add execution above.
- Build native executable, Melange and tests: pass. Forced native-host/contracts/
  host suites: pass. Shared suite **2120 checks, 0 failures**.
- Fresh Vite bundle; serial browser card/spacing/properties **6/6** and focused
  current-bundle page-creation E2E **1/1** pass. Full historical E2E not claimed green.
- Nine read-only review passes: Correctness, Data contract, Regression, Failure
  mode, Migration validation, Performance, Test coverage, Repository convention,
  System Additions. Superseded completion, Quick add order, rejection coverage
  and test worker-state isolation findings were validated and repaired; focused
  follow-ups closed them. No remaining confirmed finding in this chunk.
- No schema/version/migration, worker protocol, dependency, setting or shipping
  UI text change. Existing scope registration is reused; per-owner task refs earn
  their cost through the reproduced races. A generic refresh framework was not
  added. i18n, scoped spec and staged diff checks pass.

## Remaining scope

Full history parity remains Partial: indent/paste/multiselect history, cursor
ranges, the qualified reference cleanup caret transition, folded/closed/preview
and historical zoom-owner behavior, cross-graph
actual UI races, IME and macOS are not covered by these matching flows. Latest
read failures/toasts are production native application-model tests, not a real
network-failure GUI capture. Quick add Linux shortcut, modal layout, Add to today
and close/Escape semantics still need their separate reference-aligned repair.
