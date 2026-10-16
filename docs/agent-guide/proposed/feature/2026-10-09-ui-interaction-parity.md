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


## Native desktop alignment on October 15

The authorized native desktop scope uses app.logseq.com as the visual and behavioral baseline and excludes Graph View. Heap investigation is no longer part of this work batch. Existing allocation fixes remain preserved separately. The external 200 MB process-memory guard continues to apply during native verification.

The first production observation measures a 48-point header, 32-point icon buttons, a 240-point sidebar in the current reference graph, 32-point top/left content padding and 16-point trailing content padding. Search uses an 8-point rounded opaque panel and a 200 ms ease-out zoom entrance; Escape closes an empty-query search. The authenticated reference graph is inspected without editing its contents. Screenshot content differs from the local Demo graph, so these observations establish chrome measurements and lifecycle behavior, not whole-page pixel parity.

The native batch first addresses shell geometry, toolbar and navigation glyph visibility, titlebar integration, sidebar and popup transitions, scrolling, keyboard focus and dismissal. On macOS, leading navigation controls must coexist with the system traffic lights, controls must never drag the window, and blank header space must remain draggable. Sidebar and content tracks must adapt without clipping labels or shifting the main reading column incorrectly. Production UI controls remain localized and use typed LUI props.

Native acceptance requires actual window evidence for toolbar toggling, search focus/typing/Escape/reopen, both sidebar docks, page navigation, scrolling to both ends, dropdown keyboard and outside-press dismissal, editing and repeated Enter, and live window resize. Motion must be visible on the native backend and honor reduced motion. Automated geometry, raster and interaction regressions accompany actual window checks; a recording-host test alone is insufficient. Interaction latency is compared using identical scripted actions and fixture sizes against the reference implementation. No broad equivalence claim is made before these checks pass.

Rich-text editing remains required: inline formatting, links and references, task status, properties, nested blocks, keyboard commands and IME must remain functional. Reading and editing typography and width must match; replacing the editing surface with a plain-text control is outside the authorized scope.


## Native parity continuation on October 16

The current native host is the OCaml SDL/Cocoa renderer, rather than the historical GPUI host mentioned above. Source and actual runtime evidence take precedence over the older verification records. Continue on the existing application and LUI branches. Preserve rich-text editing and exclude Graph View.

The user explicitly requires both sidebar opening/closing animations, continuously responsive split and window resizing, and comparison of typography, buttons, selects, menus, popups, dropdowns, and dialogs across all accessible interfaces. Compare text size, weight, line height, icon size, control bounds, padding, gaps, hover/focus/disabled states, overlay anchors, viewport-edge avoidance, nested stacking, focus restoration, and enter/exit motion. Use fixed viewport/theme/font/fixture comparisons with reference, local, and difference screenshots. Partial component or recording-host coverage cannot establish application-wide parity.

The next implementation slice repairs the native animation clock. Both native sidebar splits already carry a 300 ms standard resize transition, and the installed LUI host implements split interpolation. The application never advances `Lui_host.tick`, so its animation clock stays uninitialized and split updates take their immediate path. The main loop and the live-expose callback must advance the shared animation clock before applying user-triggered changes, continue frames while motion is active, settle exactly, reverse from displayed geometry, preserve direct drag feedback, and stop repainting when quiet. Reduced-motion preferences must remain effective. First reproduce this through the application's actual frame-preparation helper and real native split layout; then apply the smallest fix and rerun the same path. Popup transitions and the full visual-state inventory remain separate required work.

The native frame helper now advances the LUI clock before input and during live expose, and reads the macOS reduced-motion preference. Its real layout regression failed before the change and passes afterward for a long idle interval, opening, reversal, both collapsed endpoints, immediate drag feedback, reduced motion, and removal without continuing frames. A separate real input regression exposed the missing native split divider capture. LUI commits 5f11c3ad and ff82ad64 add divider dragging and expose its hit/capture state; the application preserves the resize cursor while captured and stops cursor inheritance through presented overlays. Tests cover scaled and nested split tracks, disabled/removed nodes, modal shielding, release outside the gutter, and interruption of active sidebar motion. The complete application release `@all @runtest` and LUI release `@all @runtest @install` passed. Actual visible-window motion and frame-time acceptance remain outstanding.

At a 1440 by 932 browser viewport, the authenticated reference Settings card measures 1024 by 654.398 CSS pixels, centered at (208, 138.801), with 24-pixel padding, 16-pixel gap, 8-pixel radius, and a 200 ms ease-out entrance. The Keymap search-by-keys popup measures 290 by 104.992 at (931, 248), uses a 6-pixel radius and 150 ms entrance. These are observed reference measurements, not local parity results. Native popup, dropdown, and dialog enter/exit motion, placement during resize/scroll, keyboard/focus lifecycle, and matched local/difference captures remain required. The native transition property is still unmapped by the painter and must not be counted as implemented merely because a view emits it.

LUI commit a05db507 adds four-direction collision flipping instead of moving an overflowing popup over its trigger. Its real layout regression failed with a bottom popup at y=120 instead of the available opposite-side y=96. All four directions, preferred-side stability, cross-axis shifting, oversized surfaces, and 1x/2x scaling now pass alongside the full LUI suite.

The signed release was exercised through the actual native window: both sidebar toggles work, the left divider changes pane width, and resizing from 1440 to 1600 logical pixels and back keeps the Settings dialog centered. These observations establish functional geometry, not smooth-motion acceptance. The default Core Animation renderer does not yet report physical presentation timing. Mixed sidebar/resize/settings actions, excluding the first five reported seconds, recorded active-frame median 13.067 ms and p95 82.722 ms; this fails the 8.33 ms workload target. The observed combined GUI/worker physical-memory peak was 97.62 MB, below the external 200 MB guard. Do not infer 120 FPS from the frame-clock regression or an idle overlay reading.

Actual Settings inspection reproduced a language menu drawing options outside its 448-point panel and past the window bottom. Shared menu cards now opt into scrolling and clipping. A regression mounts the actual language trigger through the native assembly, opens it, scrolls, and requires the final option to be fully visible and hit-testable. The first valid test failed because the menu could not scroll. After enabling overflow, it exposed an independent assembly range error: subtracting the first child's origin discarded its inset, leaving the last option eight device pixels below the viewport. LUI commit 6969adb9 measures both axes from the viewport origin; its inset-range regression failed at 100 instead of 108 before the change. Both full release suites now pass, including the actual language menu's final option. Visible-window reopening and scrolling of the updated release remain required.

The reference General combobox is 256 by 32 CSS pixels, with 14/20 typography, 8/12 vertical/horizontal padding, and a 6-pixel radius. Its option rows are 31.992 pixels high with 6/8 padding. The select surface uses a 150 ms entrance and a clipped, scrollable viewport. Remaining observed Settings differences include heading weights, navigation icons/padding, theme-card layout, font buttons, checkbox visibility, accent colors, neutral action-button styling, and card height. Do not count these as aligned.

An external cleanup removed the primary worktree's temporary screenshots, release cohorts, and earlier logs during verification. Source commits and build trees survived. Subsequent evidence is retained outside that temporary directory, and the reference's four actually loaded Inter font files were exported again for reproducible native packaging. Earlier measurements above remain observations; missing captures cannot serve as current screenshot artifacts.


## Nested native surfaces and live scrolling

Actual small-window verification exposed three separate problems after menu overflow was enabled. First, nested popup anchors were refined before their dialog ancestor reached its final placement; a full layout rebuild also registered children before parents. LUI commits 47675b74 and ceb2fad9 resolve ancestor placement first, including an open-tree rebuild and resize at both backing scales. Second, the main application's hit mirror intersected every node with its ancestor scroll clip before the shared hit walk could promote popups. The mirror now keeps full shifted rectangles and leaves clip ownership to the shared walk. Its regression failed for a final menu option outside the dialog scroll clip, while ordinary offscreen scroll content remains excluded.

Third, the actual window reported a 408-device-pixel menu offset while the text remained at its original position. A diagnostic tree dump showed the hit rectangle at y=-400 but the application's paint callback still at y=8. Native scroll getters returned partially applied functions that captured the immutable scroll state at callback creation. LUI commit e30fed0d reads the current state when the node id is supplied. Regressions retain offset and range callbacks before scrolling, exercise both axes, range changes, clamping and reversal, and check the application's cached ancestor-offset callback. The application regression failed before the getter fix and passes afterward. A separate scene assertion requires the final option's emitted marker to match its visible hit rectangle.

Both complete release suites passed: LUI `@all @runtest @install` and the application `@all @runtest`. Existing whole-file formatter failures in the changed LUI window files also reproduce on their parent revision; only the new test body was formatted. No compiler warning was disabled.

The signed release was reopened with an isolated data root and exercised at 1440 by 600 logical pixels. The actual language menu remains within the viewport, scrolls visibly to the final Arabic option, and accepts its click below the dialog's content bounds. Reopening the menu resets its scroll position; selecting English succeeds above the dialog's content bounds. Captures are retained in the external native-ui-parity-artifacts/2026-10-16/scrollfix cohort. This fresh-root run has no graph worker and is not a combined graph-memory or performance acceptance run. Popup entrance/exit motion, exact selected-row anchoring, the measured style differences, and frame-budget acceptance remain outstanding.

## Native surface lifecycle and independent sidebar resizing

LUI commit 82e6b74c on feat/ml-backend adds this slice. Promoted native surfaces now use the host clock for ease-out opacity and 95-to-100-percent scale transitions: 150 ms for menus/popovers and 200 ms for modal surfaces. Dismissal removes live nodes and handlers immediately and retains only an inert display-list snapshot until the exit finishes. Animation-only frames reuse the captured surface without replanning fragments. Reversal starts from the displayed opacity; reduced motion, reused node ids, nested surfaces, exact settling, buffer validity, and idle completion have regression coverage. This is intrinsic native surface presentation; generic CSS-style transition properties remain unmapped.

Right-sidebar dragging exposed a separate animation error. The application compensates the nested left split to preserve its pixel width, but the host animated this dependent correction while applying the pointer-driven outer split immediately. Event batches originating from a split resize now apply all dependent split corrections without interpolation. Programmatic opening and closing retain their existing transitions. The actual host/layout regression failed before this change and passes afterward.

Native divider input also ignored child minimum widths. Pointer movement and release now enforce those widths at both backing scales, including proportional allocation when the window cannot satisfy both minima. Both application sidebars declare a 240-point minimum, and the left inner content retains its expanded width during collapse. An application-level pointer/layout regression failed before these constraints. It then exposed an independent geometry error: native split percentages included the divider width. Both panes now divide the space remaining after the gutter using zero-basis flex growth. Regression coverage includes both collapsed endpoints, intermediate fractions, and 1x/2x layout. Both complete release suites passed after these changes.

Actual-window checks with the default single raster worker exercised both open sidebars, right-divider dragging, the left minimum, Settings opening, and Escape dismissal. The right pane moved from approximately x=1800 to x=2183 device pixels while the left pane retained its width; attempting to narrow the left pane stopped at 480 device pixels. Stable screenshots retain readable labels and toolbar controls. Opening the right sidebar also produced a transient missing-label frame, which remains unresolved. A later submitted-pixel readback matched a complete CPU render byte-for-byte and the stable screenshot was correct; these later samples do not explain the earlier transient.

The guarded application run used an isolated copy of the Demo graph. Its combined GUI/worker physical-memory peak was 81.18 MB. Mixed interaction work-frame median was 9.19 ms and p95 was 36.41 ms; overlay/render p95 was 27.16 ms. This fails both the 8.33 ms target and a claim of smooth dialog motion. Physical presentation timing remains unavailable on this renderer. A fixed 2880x1864 raster-only modal-fade fixture measured approximately 15.49 ms p95 with one worker and 5.79 ms with four, with exact pixel equality against full rendering. The default worker count remains unchanged pending clean end-to-end presentation and memory evidence.

Test process monitoring now normalizes executable paths before identifying the owned worker and also matches its isolated root directory. Earlier GUI-only reports missed workers whose executable contained a `MacOS/../Resources` path. Those reports remain GUI-only evidence. Eight workers left by this session's retired isolated test cohorts were stopped. Screenshots, raw scenes, readbacks, timing samples, test graphs, and packaged binaries remain outside Git and must never be staged with these changes.

Final release validation used serialized Dune jobs (`-j 1`) for both full suites. Running the raster budget test alongside formatter processes exceeded the threshold at 18.91 ms p95; the isolated rerun and serialized suite passed. The fixed budget is a controlled workload gate, not a guarantee under arbitrary competing load. New function bodies were formatted separately; whole-file formatting differs on both the parent revision and the working version of all changed LUI files. This document passes validation; the repository-wide document check still reports 13 preexisting invalid documents.

## Permanent overlay carrier and software rendering phases

Native software rendering now records three separate wall-time phases: raster/setup time outside the upload callbacks, IOSurface upload, and Core Animation submission. Background drawing can overlap upload, so these are partitions of caller elapsed time rather than summed CPU time across domains. Physical presentation timing is still unavailable.

The permanent full-viewport overlay carrier was constructed as a Popover. Its default chrome emitted two full-window shadows even with no popup open, and the retained painter scheduled presentation motion for the carrier itself. The carrier now uses a fixed transparent Overlay; menus and dialogs remain independently promoted surfaces. The actual shell paint regression failed for both idle animation and full-window shadows before this change. Both checks and the complete application release suite pass afterward. A scene exported from the updated window confirms that the full-window shadows are absent.

At 1440x932 logical pixels and 2x scale, four identical Settings open/Escape cycles were compared on isolated copies of the same Demo graph. With four raster workers, removing the carrier's popup chrome reduced raster p95 from 25.75 to 7.34 ms, upload p95 from 16.75 to 5.44 ms, and mixed work-frame p95 from 57.63 to 21.86 ms. The updated cohort's combined GUI/worker physical-memory peak was 93.70 MB. First-dismissal and stable captures contain the same dark-pixel counts in the sidebar and document text regions; this observed path no longer showed missing text. Other transition paths remain unverified. The default software worker count is now four, and an environment override still permits controlled comparisons. A run with no override reported three background raster domains.

These timing runs inadvertently retained debug logging: this executable treats any nonempty LOGSEQ_NATIVE_DEBUG value, including 0, as enabled. Their relative comparison used matching logging settings, but they are not clean production performance acceptance. Logging was removed from replacement test packages; the Mac locked before the corrected comparison could be exercised. Do not claim the 120 FPS target from these results. A separate layer-geometry caching experiment passed pixel/resize tests but did not improve actual submission time (about 2.3 ms p95); that experiment and its diagnostic counters were removed.

The final build received 200 real text-input events in one typing burst and 50 Enter keydowns in approximately five seconds through the native UI. Typing work-frame p95 was 9.10 ms, maximum 16.12 ms; Enter work-frame p95 was 16.95 ms and input-to-paint p95 was 21.79 ms. Those samples also include debug logging. Enter did not immediately terminate the process, but the document became blank. Its retained tree had a 48-device-pixel document body with no page/block content and a main scroll range of zero. The later Escape was followed by process termination; the 200 MB guard did not trigger and no system crash report was found. The exit cause remains unknown. This scenario fails functional acceptance regardless of the measured latency. Preserve the captured tree/scene and investigate virtual row mounting and editor lifecycle before accepting repeated Enter.
