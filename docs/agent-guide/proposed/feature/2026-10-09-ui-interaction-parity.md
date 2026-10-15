# UI Interaction Parity

## Problem

The shared OCaml UI reproduces much of the styling of app.logseq.com, but several controls bypass the component lifecycle that drives interaction and motion. Graph and collaborator action menus do not toggle, URL editors sample input state at mount, generic dialogs use a fixed type priority rather than open order, and ordinary columns bypass the toast lifecycle. Nested dialogs and popup menus must consume one dismissal at a time and restore focus to the appropriate trigger.

## Proposal

Use app.logseq.com in its disposable Demo graph as the behavioral reference. Cover buttons, dropdowns and menus, dialog stacking, notification lifecycle, settings controls, RTC graph/member actions, and view action submenus. Implement shared behavior once in deps/ui/src and use existing typed LUI primitives wherever they supply the required lifecycle. Preserve alert-dialog outside-press behavior. Compare Web and GPUI separately; recording-host tests establish shared behavior but do not prove native motion or visual parity.

Implementation sequence:

1. Write all failing interaction tests for menu toggling, URL editing, dialog order and cleanup, toast identity, and submenu navigation.
2. Verify failures against the current application code and capture browser evidence before changing implementation.
3. Repair shared controls and dialog ownership; derive props with scoped reactive expressions.
4. Use the toast primitive for pause, swipe, duration, and presentation lifecycle, retaining stable keyed identity across model updates.
5. Align component motion styles with the observed production transitions and honor reduced motion.
6. Verify settings dropdowns and nested dialogs, graph/member action menus, view submenus, and notification interactions in the browser. Build and run native shared-host coverage. Record any native renderer limitations explicitly.

## Alternatives considered

### Surface-specific event and timer patches

Adding separate browser and native implementations duplicates behavior and bypasses platform component ownership. It also makes nested focus and dismissal depend on listener registration order.

### Restyle all controls before verifying behavior

The existing semantic stylesheet already contains most production chrome. Behavioral evidence should determine which styles and lifecycle paths need changes.

## Acceptance criteria

- Action-menu triggers toggle, expose their expanded state, retain disabled-item behavior, and close after an action.
- URL editor input and Reset visibility update without remounting; save/reset closes the editor that owns the operation.
- Dialog dismissal follows opening order; nested dismissal leaves the parent intact, and close-all clears all dialog state and request resources.
- Toast updates retain mounted identity, error notifications persist, and transient notifications use platform pause/swipe/dismiss behavior.
- View menus safely handle empty lists and navigate nested submenus without changing the parent action.
- Web motion and focus behavior are compared with app.logseq.com; native behavior and motion claims have corresponding native evidence.
- The UI build, shared-host tests, browser checks, and applicable translation checks pass.
- Compare each accessible page and control state at the same viewport, theme, font, and graph fixture. Save reference, local, and difference screenshots; visual similarity without measured comparison is insufficient.
- Exercise all settings controls, including persistence and reload, and match the switch track, thumb, checked state, focus state, and motion to the reference.
- Verify search opens from a single icon press and graph/action triggers close on the second press.
- Match menu icon placement, readable hover/focus colors, settings navigation, and neutral right-sidebar disclosure headers.
- Restore the correct block and caret or selection after undo/redo of typing, split, merge, indentation, and paste.
- Align heading editing geometry and typography with reading mode; match task status and priority controls.
- Show page-reference autocomplete when the caret enters an existing reference, including keyboard movement and pointer selection.

## Verification record

The reference is app.logseq.com. Anonymous Demo graphs are used for repeatable browser comparisons. Current local preview is http://localhost:3001. The initial pull advanced the application branch to a2fa7964bf.

Shared interaction fixes currently cover chronological dialog ownership, nested Escape handling, URL editor reactivity, action-menu state, view submenu navigation, and primitive-owned toast lifetime. Browser evidence exposed renderer defects in cover-popover ownership, overlay alignment, retained toast exits, and trigger outside-press handling. Corresponding LUI changes are in the sibling worktree at /Users/tiensonqin/Codes/projects/lui; its local opam pin and the native Cargo path dependency use that worktree. The renderer changes were published as a4d83c44a30d62396fe8a0366fef451481ae40f6; the application install script now pins that revision.

Initial passing checks: 1,958 Web recording-host checks, 667 native recording-host checks, 87 LUI Rust tests, 51 Web overlay tests, protocol/schema checks, and translation validation. Subsequent changes require rerunning affected checks. The native boot test reproduced and repaired missing idle-window wakeups after OCaml patches.

Browser feedback then reproduced additional failures: duplicate search activation, graph trigger reopen, menu icons after labels, unreadable highlighted text, primary-colored sidebar headings, and a persisted font setting that crashes startup because a hyphenated dataset key is assigned through DOMStringMap. New browser regressions first failed on these application paths. Settings, editing, task controls, and full pixel comparisons remain in progress.

GPUI currently has retained fade entrances/exits, with headless lifecycle coverage. Native card zoom, toast viewport/collapsed-stack geometry, and actual window pixel comparison are not yet verified or fully aligned. The Mac was locked during the native GUI check. Authenticated RTC permission and remote collaboration workflows require account fixtures and are not established by anonymous menu tests.

## Risks

- Native component motion is implemented by the LUI renderer, so CSS parity alone cannot establish GPUI parity.
- RTC permission and collaboration flows require authenticated accounts and remote graph fixtures; the anonymous Demo cannot prove server-backed behavior.
- Timed dismissals and focus restoration must not affect a newer layer or a disposed view.

## Questions

None. The default scope includes Web and GPUI; optional prioritization does not block shared interaction work.


## Partial delivery on October 9

The user requested committing and pushing the current batch before completing the remaining parity work. This is an intermediate delivery, not a pixel parity completion claim.

Implemented and checked: save before Escape/outside exit, calendar command mounting and date persistence, caret entry into an existing page reference, search activation, graph trigger toggling, menu icon placement, sidebar disclosure styling, font persistence, and atomic before/after cursor history for typing, splitting, and merging. The latest targeted six browser history cases passed. Web recording-host tests passed 1,961 checks; native recording-host tests passed 670 checks; the worker undo-redo group passed 50 cases. Translation validation and hardcoded-string lint passed.

The full browser batch passed 16 of 18 cases. One history case timed out entering its initial fixture after earlier cases; its isolated equivalent passed. The settings-switch dimensions match, but the switch click/persistence case still fails. Keep this failure visible for the next work batch.

Review identified additional cases to finish: empty page-reference completion can leave duplicate closing brackets; asynchronous history restoration needs stale-session guards; navigation can skip asynchronous exit cleanup; selected-block deletion needs a pre-delete history snapshot. Full screenshot difference evidence, heading/task geometry, all settings actions, native pixel and motion checks, and authenticated RTC workflows remain incomplete.

The LUI renderer changes were committed separately. The application dependency pin must reference that published revision so the new Toast padding properties are supported on a clean checkout.


## Continuation after the user commit

The user committed the preceding application batch as b6a8746e09. The ongoing batch fixes native checkbox default-event cancellation, switch translation composition and settings row geometry, empty reference closing brackets, stale asynchronous history restoration, exit cleanup after navigation, selection anchors before deletion, and heading read/edit metrics for all six levels.

Multi-block paste history now resolves the after-cursor from the worker's actual last inserted block before committing transaction metadata. Undo returns to the source block and caret; redo returns to the last pasted block at the end. A worker regression failed before the change and passed afterward. All 51 worker undo-redo cases passed.

Task status now precedes the title, uses shared colored vector glyphs on both hosts, and has an opaque compact picker with configured option icons, a current-value check, and Clear. Both ordinary second presses and cancellation during an asynchronous option load close the picker. Browser coverage exercises selection, reload persistence, clearing, and rapid trigger cancellation.

Latest completed recording checks: 1,966 Web checks and 675 native checks, with two native process tests. A full 29-case browser run passed 28 cases; its remaining status test exposed an asynchronous fixture timing issue. After awaiting the loaded option list and adding the rapid cancellation regression, the expanded status case passed. A complete rerun remains required before claiming the batch green.

The paired Settings / Editor screenshots at 1280 × 900 are in tmp/ui-parity/index.html. The measured modal crop is [129,135,1022,630], threshold 0.05 with antialiasing excluded. Its last comparison differs by 3,705 pixels (0.575%). This measurement applies only to that captured state, not the entire application. Remaining Keymap editing/dispatch, priority and other menu states, native visual/motion evidence, and authenticated RTC workflows keep this document proposed.

## Latest interaction and visual checks

Indentation history now snapshots the caret before asynchronous configuration loading and clears the previous pointer position when restoring keyboard focus. The browser reproductions first inserted the marker at the end after undo and redo; both now restore the original middle-of-text caret.

Keymap search, All/Unset/Disabled filtering, category disclosure, and global folding now update reactively. Category-qualified row identity prevents duplicate commands from breaking reconciliation. Custom binding editing, Search by keys, and Refresh all remain incomplete and are not counted as repaired.

Priority glyphs now belong to the shared vector registry. Its browser regression checks selection and reload persistence. A first test incorrectly assumed that priority always appears in the positioned right-side property region; it now targets the value control within the owning block. Both task status and priority cases passed together. The full 33-case run initially passed 31 cases; status reopening after reload also timed out in that full run, although its isolated rerun passed. A complete repeat is still required to establish stability.

The task status screenshot comparison is in tmp/ui-parity/task.html. At 1280 × 900, the reference popup rectangle is [194,209,226,265.875] and the local rectangle is [198,209,226,266]. The normalized 226 × 266 crop differs by 305 pixels (0.507%), threshold 0.05 with antialiasing excluded. Input caret blinking is suppressed for this captured paint state. Normalizing the crop does not erase the recorded 4-pixel horizontal placement error or prove whole-application parity.

The actual GPUI window exposed a startup panic: initial OCaml theme patches accessed ThemeRegistry before deferred component initialization. Component initialization now runs before opening the window, after registering the embedded fonts. Reopening the same isolated native fixture renders the shell without that panic. Cargo build and the linked OCaml boot smoke test pass. This adds actual native startup evidence; native popup rendering and pixel/motion parity still require further investigation.

Latest affected recording tests passed again: 1,966 Web checks, 675 native checks, and two native process tests. The repeated full browser run passed 32 of 33 cases. Investigation established that the status-reopening failure clicked an offscreen block after earlier fixtures had lengthened the page. The test now scrolls the target into view and includes a 40-block paste fixture; this expanded status case passed. This was a test-fixture correction, not an additional status-control fix.

## Commit checkpoint

The user requested committing the current work before further fixes. Search now uses the shared Dialog primitive for modal ownership. Real Web and GPUI validation previously rejected dialogs without a title; LUI now accepts a title or content children and continues to reject a completely empty dialog. These renderer changes are committed as bf13c01564d13cf70093d0cb1a0ba030d4957ac7, and the application install script pins that revision. The new dependency commit must be pushed alongside the application before another checkout can install it from GitHub.

Affected verification passed: all 33 application browser cases, 1,970 Web recording-host checks, 679 native recording-host checks and two native process tests, 101 LUI OCaml tests, 28 Rust core tests, 15 GPUI rendering regressions, and 55 Web overlay cases. The untitled-dialog tests also passed after adding an explicit initial-focus assertion. The application search lifecycle case passed for input focus, typing, query clearing on the first Escape, dismissal on the second Escape, outside press, and reopening. The reference application confirms this two-step Escape behavior when the query is nonempty.

Actual native window verification still exposes a search rendering problem: the retained input appears in accessibility state, but the popup is absent from the screenshot. Search modal geometry and backdrop styling on Web also remain different from the reference. Do not treat the shared lifecycle change or headless rendering test as proof of actual native search visibility or pixel parity. Custom keymap editing, Search by keys, Refresh all, the recorded task-popup horizontal offset, native motion, and authenticated RTC workflows remain unfinished.

The scoped LUI tests pass, but its broad `dune build @all` encounters an existing native-example build rule referencing a missing lui_caml_dispatch.h. No Dune rules were changed. The local opam pin used a temporary source snapshot for validation; the committed install script uses the dependency revision above.


## Web editor latency investigation

Pulled refactor/lui to f762cec5ce before reproducing the reported delayed text and caret. Tests used a disposable browser graph on http://localhost:3001; the user's graph was not edited.

The shared structure_pending gate queued ordinary text insertion and pointer events behind every Enter transaction and its canonical page reconciliation, even though the optimistic next block was already mounted. On a page with 500 sibling fixture blocks, twenty Enter/text pairs at 20 ms intervals accumulated up to 1,070 ms of input queue wait. The last text became visible in the DOM after 1,071.4 ms. The captured UI flushes were substantially shorter, so waiting for asynchronous structure completion was the dominant cause.

Enter now mounts and edits its optimistic block immediately while worker transactions remain ordered. Each split captures its own pending text save and cursor history before the next editor opens. Canonical deltas reconcile once the pending split batch catches up; subscription reloads and autosave respect the same boundary. Other structural operations and cross-block navigation retain ordered replay. A failed insertion restores the appropriate preceding editor and replays subsequent user input; a browser test injects a failure in the second pending insertion and verifies that later text and splits survive.

Same-block clicks no longer enqueue a redundant editor transition or leave an old click coordinate for asynchronous refocus. Completion retains the live caret. Another regression showed that measured Home/End navigation compared the derived model with the original unpublished session model and consequently dropped the caret update; publication now checks the session model that owned the event before measurement.

The same 500-block page was reset to its original fixture and measured again with twenty Enter/text pairs at 20 ms intervals. All twenty inserts were visible synchronously after dispatch, with a DOM visibility median of 2.5 ms and maximum of 4.4 ms. No insert entered the structure input queue. The final persisted tree contained 521 blocks and the expected final row. Twenty alternating pointer moves in the same block completed with a median of 2.8 ms and maximum of 4.3 ms; all offsets were correct and caret geometry differed from the target by at most 0.063 px. These are browser event/DOM measurements, not physical display or native GPU latency measurements.

Enable diagnostic printing in the browser console with:

```javascript
window.__editorPerf = true;
window.__navEvents = [];
window.__uiPerf = [];
```

Enable the console's Verbose level to see PERF editor and PERF ui messages. The editor messages include structure duration, queued event kind/depth, and replay wait. UI samples include dispatch, signal flush, DOM application, virtualization, focus, patch counts, and mounted nodes. Logs omit block contents. Set window.__editorPerf = false to stop console printing; window.__uiPerf retains its existing bounded sample buffer.

The new production-browser regressions were observed failing before the behavior changes. Coverage includes text and pointer updates while a real worker request is held, ordered persistence, caret preservation after completion, measured line navigation, and a rejected second insertion. Existing undo/redo, merges, Enter repetition, composition, selection, reference and caret-blink cases are included in the browser verification batch. Shared recording tests pass 1,970 Web checks and 679 native checks, with two passing native process tests. The existing native Rust edits in other sessions were preserved.

The completed browser rerun passed all 82 editor cases. The initial full run had one incorrect expected string after simplifying the held-merge fixture; correcting that fixture expectation and rerunning the complete batch established the passing result. Web build, shared-boundary checks, document validation, and diff whitespace checks passed.

## Integration with concurrent editor updates

Merged remote commits a8ef3404aa, 20520101cf, and 6938c79bae after the latency fix. The combined input path keeps ordered optimistic splits, session-identity recovery for other pending structural edits, the first keystroke from a retired input node, browser context-menu selection mirroring, and deferred Journals side refreshes. Retargeting happens before shadow bookkeeping so restored sessions replay that first character exactly once. A shared regression covers immediate input, restored-session replay, and the drained structural-input count.

The merged production build passed all 82 browser editor cases and 1,974 Web recording-host checks. Native recording tests passed 688 checks and two process tests with the concurrent, uncommitted native measurement work present; that work is excluded from this merge commit. The repeated 500-block Enter probe displayed all twenty inserts synchronously, recorded no queued input, and persisted 521 blocks. Its maximum DOM visibility delay was 9.9 ms. Web build, shared-boundary checks, document validation, and whitespace checks passed. Other native work remains uncommitted.

## Dedicated master / SDL continuation on October 14

The current continuation uses independent clones at master `7dfa9b45a` and native base `7b0d18735000f2b7ae6342c410df476088baa543`. It does not rely on the earlier production-site/GPUI captures. The user explicitly excludes graph visualization and its graph-specific interactions; graph management remains in scope. The existing deadline timer is preserved.

The coverage matrix and source-derived 251-case inventory are in `docs/ui-parity/`. Validated checkpoints cover native paint initialization, app palette lookup, graph-search loading visibility, literal-space decoding, create-page focus ownership, notification hooks, typed settings layout, visible checkbox geometry, typography-variable lookup, label wrapping and line-height. Actual native SDL execution and paired evidence accompany those partial checkpoints. The UI recording suite currently passes 2072 checks; focused creation/focus/persistence/validation E2E passes repeatedly. These results do not establish full settings, editor, search or native parity.

Remaining native renderer opacity, expose/restore repaint, nested scrolling, richer rendering, menus, keymap and other inventoried interactions remain open. macOS-specific UI is not verified by Linux. The matrix is authoritative for progress and residual differences.

### Search Escape and owning-input checkpoint

The SDL Escape default must run after synchronous document capture and skip
native dismissal when prevented. Scoped dispatch state and an Escape-only host
boundary establish this without changing other keyboard ordering or LUI.
Filter selection/clearing preserves master's query semantics and keyboard focus.
Search host services now scope value/focus/initial-focus operations to the modal
or existing pinned-sidebar panel identifier. Actual native coexistence and
editor-save regressions, paired master screenshots and test-first evidence are
recorded in `docs/ui-parity/evidence/search-escape/validation.md`.

### Page and scroll geometry checkpoint

Typed page/block/control metrics match actual reference rects. Native root
viewport bounds keep long content in the scrolling pane; host scroll bounds
exclude empty/unlaid and clipped descendant content while retaining direct
padding in device pixels. Post-paint offset clamps schedule their repaint.
Shared page spacing has one typed owner after removing obsolete CSS padding.
Fresh Vite/CSS browser regressions, native Pango tests and actual SDL evidence
are recorded in `docs/ui-parity/evidence/page-spacing/validation.md`.
Percentage flex-basis cache invalidation is a separate confirmed LUI dependency
blocker; no whole-layout workaround or extra-repository edit is introduced.

### Local publication flag checkpoint

The desktop menu now toggles the existing local publishing/export checkbox;
full-entity hydration preserves its current value without changing worker
contracts. Ordinary-page hidden-only property areas remain absent by default,
while explicit visibility reveals a real16px checkbox. Actual native pointer
writes, menu coherence and both restart states are verified against actual
master desktop behavior in `docs/ui-parity/evidence/publication/validation.md`.
Cloud publication, graph access and other menu/property workflows remain
separate inventory items, not implicitly validated by this local flag.

### Native measured caret checkpoint

The SDL hidden input extension does not paint a rich-text caret. Enable the
existing measured overlay, preserve web color overrides and fall back to the
native app foreground. Normalize device/logical coordinates at the native host
measurement boundary, including reciprocal pointer hits and editor height.
Production host tests fail first on missing geometry, missing paint and scale2
unit mixing, then pass; actual SDL captures show the caret and Escape removal.
Paired typing undo/redo and split undo preserve the insertion offset. Evidence
and exact remaining editor limitations are recorded in
`docs/ui-parity/evidence/editor-native/validation.md`; this is partial parity.

### Title input ownership checkpoint

Native rich-text snapshots expose textarea semantics so title editing does not
also trigger outline/global commands. Scoped geometry owners refresh the
current locally owned title frame on native replies and release on disposal.
An end-edge caret keeps its typed minimum width. Actual paired Ctrl+A/rename,
worker persistence and unchanged 45-block trees are recorded in
`docs/ui-parity/evidence/title-ownership/validation.md`. The title clipboard gap is addressed by the subsequent checkpoint below; no
full title/editor parity claim.

### Native title clipboard checkpoint

Native clipboard shortcuts synchronously offer the event to document owners
before using the existing rich-editor surface intent. Title copy/cut reads its
local source/selection; paste uses the existing insertion intent. Matching
platform schemas declare the existing menu event. Empty text is not insertion,
so unavailable/non-text clipboard formats cannot erase a selection. Plain title
and body copy/cut retire stale structured clipboard provenance. No worker, DB
schema, migration or dependency changes are required. Failing-first production
tests, actual paired title interactions, native ordinary-input regressions, and
exactly-once structured worker writes are recorded in
`docs/ui-parity/evidence/title-clipboard/validation.md`. An active native body
editor can remain visually empty after structured replacement until Escape;
this remains a separate unresolved editor issue, not a full clipboard claim.
