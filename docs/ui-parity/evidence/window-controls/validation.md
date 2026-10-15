# Native window captions and acknowledged shutdown

## Scope and reference

- Reference: master `7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8`, actual Electron.
- Implementation checkpoint before this change: `525040ee2fa2304b848df71599aab7f9f50ce0b2`.
- Linux desktop, light theme, English, scale1, normal client1280×900; paired journals contain the same two dates and text. The accepted top-header placement exception does not exempt its controls.
- Graph visualization remains explicitly excluded by the user. No graph-view interaction was used.
- This is a verified subset of H01/H03/E01/E05/X03, not complete desktop or editor parity.

## Reproductions, fixes and evidence

| Scenario | Reference and before | Final native result |
|---|---|---|
| Normal caption geometry | [Reference](master-normal.png), [DOM measurements](master-normal-metrics.json); [native before](native-before.png) had no caption controls | [Native](native-final-normal.png): three48×48 controls at x1136/1184/1232. Exact reference16px SVG paths. Fullscreen exit uses reference18px glyph. Header controls reserve144px, or48px in fullscreen. |
| Maximize/restore | [Master maximized](master-maximized.png):1920×940 at0,40. Initial decorated SDL candidate [incorrectly](native-maximized.png) produced1920×907 at0,73 | Non-macOS SDL windows are borderless; [final maximize](native-final-maximized.png) is1920×940 at0,40. [Restore](native-final-restored.png) returns1280×900. Labels/icons follow authoritative SDL state, not optimistic button state. |
| Fullscreen | Actual master F11 →1920×1080 at0,0, [one exit control](master-fullscreen.png); pointer exit restores normal window | [Native F11](native-final-fullscreen.png) and [pointer exit](native-final-fullscreen-exited.png) match those geometry/state transitions. Repeated or modified F11 does not toggle. macOS keeps its system shortcut. |
| Minimize/restore | Caption click1160,24 → [Iconic/hidden](master-minimized-state.txt), activation restores | Caption click → [Iconic/hidden](native-minimized-state.txt), then [normal](native-unminimized-state.txt) and [painted content](native-unminimized.png). |
| Right sidebar open | Window controls belong to the global window edge, not the main pane | [Sidebar open](native-right-sidebar.png), [maximize](native-right-sidebar-maximized.png); captions remain clickable. Sidebar topbar reserves their width. Production-layout tests cover1280/1100px and both dock states. |
| Header drag and edge resize | [Master header drag](master-header-drag.png) moved the window. Borderless native initially could not move | SDL hit testing now marks unused header space draggable and five-pixel edges/corners resizable. After >2s idle, [drag](native-header-drag.png) moved400,40 →480,100; [right-edge drag](native-edge-resize.png) changed width1280 →1220. Controls/body/modal hits are excluded by actual scene ancestry. |
| Dirty body close | Same disposable page, active text `Body pending close parity`, no Escape: [reference before close](master-dirty-body-before-close.png) | [Native before close](native-dirty-body-before-close.png); worker retains exactly one block. [Reference after full restart](master-body-after-restart.json), [native persisted block](native-body-after-close.json), [native reopened](native-body-after-restart.png). |
| Dirty title close | Actual master edited input [before close](master-dirty-title-before-close.png); [full worker restart](master-title-after-restart.json) retains that exact edited value. Pre-fix native [active title](native-dirty-title-before-close.png) disappeared on close: [new name absent](native-title-after-close.json) | [Fixed active title](native-fixed-dirty-title-before-close.png), caption close, [worker acknowledgement](native-fixed-title-after-close.json). Native UI and its own worker75462 were stopped; new worker132874 still returns [the same UUID/new title](native-fixed-title-after-worker-restart.json), and [reopened pixels](native-title-after-worker-restart.png) show the saved title/body. |
| OS close | Uses the same acknowledgement boundary rather than a second shutdown implementation | [Active title](native-os-dirty-title.png), Alt+F4, window disappears; [worker](native-os-title-after-close.json) retains `Window lifecycle OS saved`. |

Normal captions were visually examined for glyph size, spacing, alignment and clipping. Fullscreen/maximized images are downscaled by the capture tool to1568px width; OS geometry was independently read back. The actual renderer was `LUI_GPU=gl`, not a browser wrapper or CPU replacement.

## Root causes and ownership

1. Native chrome lacked caption widgets and an authoritative window-state channel. New internal commands use the existing host mailbox; mounted consumers unsubscribe on disposal. Resize reports now notify existing viewport listeners after updating dimensions.
2. Decorated SDL windows retained a second system titlebar on maximize. Borderless creation fixes the client geometry; a narrow SDL_SetWindowHitTest binding preserves real window-manager drag/resize instead of implementing manual movement. Scene ancestry uses `accessibility-identifier`, not reconciliation keys, which are not store properties.
3. Tsdl's WaitEventTimeout releases the OCaml runtime lock but may pump callbacks. The host now uses runtime-held PollEvent and non-pumping idle sleep, bounded16ms when quiet. The C callback explicitly checks runtime ownership and fails fatally on a callback exception instead of unwinding through SDL. Its rooted closure is removed before window destruction. macOS does not install this custom-caption callback.
4. Title text lives in a mounted local model, outside body editing state. Scoped save hooks expose acknowledged saves without exposing buffers to native chrome. Title saves skip acknowledged text, share in-flight work, and revalidate newer input. Rejection cleanup attaches to the raw request, before recursive saving, so a successful older revision cannot mask failure of a newer one.
5. A debounce queue becoming empty is not proof that body text is saved. Shutdown commits the current live buffer through existing `commit_result`, waits behind structural operations, rechecks input/session changes, and retries dirty buffers after rejection. A pending close coalesces repeated requests. Rejected saves cancel destruction; neither arbitrary sleeps nor optimistic quit provide the persistence guarantee.

## Automated validation

- Native build, contracts and host suites: [final output](window-final-native-tests.txt).
- Production native layout/editor tests: [output](window-final-close-tests.txt). Includes actual mounted title input, delayed acknowledgements/new input, second-revision rejection, retry/coalescing, save-owner cleanup, actual400ms autosave timer with held RPC, latest body UUID/text assertions, and structural-queue resume.
- Shared UI suite: [2119 checks, zero failures](window-final-ui-tests.txt).
- Fresh Vite bundle: [build](window-final-vite.txt).
- Serial browser spacing/journal/property regressions: [5 passed](window-final-browser-tests.txt).
- Focused cmdk create/focus E2E: [1 passed](window-final-focused-e2e.txt).
- Test-first failures: [missing borderless flags](borderless-red.txt), [missing hit policy](hit-test-red.txt), [wrong actual header identifier](drag-ancestry-red.txt), [close before title acknowledgement](title-close-red.txt), [masked latest-title rejection](latest-title-rejection-red.txt), [debounce-only body barrier](body-save-barrier-red.txt).
- Nine independent read-only review passes were applied to window controls, and again to the save-gate delta. Findings about runtime ownership, latest-save rejection and empty debounce queues were repaired and regression-tested. No schema/migration is required.

Commands (from `deps/ui`, except root-relative browser/E2E paths):

```sh
opam exec -- dune build -j3 ocaml_host/logseq_native.exe js_app test
opam exec -- dune runtest -j3 test/native_host test/contracts ocaml_host
node _build/default/test/ui_test/test/test_main.js
../../node_modules/.bin/vite build
```

## Fixture and tooling qualifications

Only isolated sample graphs were modified. The lifecycle page has native UUID21a85091-4a17-9053-2520-24521ff5da7d and reference UUID6ad08a1e-d799-4896-bc9c-7b6e579dad85. Both started as `Window lifecycle parity` with the same body. The final reference input inserted text at its caret, whereas native selection replaced the title; each worker result is checked against its own actual active-input value, not falsely described as an identical final string. [Fixture reset](paired-title-fixture-reset.json) restored the reference's initial name between trials. The main representative journals/Long Page remain unchanged by these shutdown tests.

Some Electron title typing attempts did not reach the input despite an apparent selection; DOM readback exposed this, and they are not persistence evidence. The final reference screenshot/value and worker result are the successful attempt. One native follow-up used a stale XID and was refused before input; final verification rediscovered the live window. Initial right-dock caption injection had an incomplete button sequence; a refreshed real-pointer move and complete foreground click verified the OS action. These retries are not counted as passing attempts.

`overlay-hit-regression.txt` is a passing diagnostic, not a red test: the caption overlay was not the cause of the drag failure, so an unnecessary pointer-property change was removed.

## Remaining work and limits

- Caption hover/pressed/focus styling, close-button destructive hover, double-click header behavior, arbitrary narrow widths, and comprehensive OS menus remain unverified or different. They are not accepted differences.
- At this checkpoint, native task/window title still read `logseq`; basic routing and rename-publication behavior is repaired in the subsequent [window-title checkpoint](../window-titles/validation.md). Complete title formatting, route/window restoration and multiwindow behavior remain unverified.
- Full error/recovery/IME shutdown, CodeMirror/property editors and every pending non-editor operation are not covered by the title/body barrier tests. Do not claim complete shutdown/data-persistence parity.
- macOS AppKit, traffic lights, CoreText, materials and OS-menu behavior cannot be established on this Linux host.
- Existing retained-cache blanking, GL tooltip disappearance, glyph opacity, percent flex-basis, web overlay hit policy and journal scroll/gutter differences remain recorded elsewhere. This chunk does not fix or hide them.

Captured text logs have ANSI color codes and trailing whitespace removed; assertions and outcomes are unchanged.
