# Native OS window titles

## Reference and root cause

Reference: actual master Electron at `7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8`.
Previous implementation checkpoint: `11e95b4276760e02c07d4b68819b14c543469612`.
Both apps used1280×900 clients, scale1, English/light, the same Long Page content and a new matched disposable Unicode page. Graph visualization was not opened or tested.

Shared `Update.effects` already publishes document titles for loaded pages and static routes. Native `Platform_native.set_document_title` discarded those calls, while startup assigned a title to a shell abstraction rather than the actual SDL window. The fix forwards the existing string through the host mailbox to SDL. Both creation paths now start as `Logseq`; no parallel title derivation, cache or worker call was added.

## Actual paired reproductions

| Interaction | Reference | Native |
|---|---|---|
| Open Long Page using search | [Pixels](master-page.png), [OS name](master-page.txt): `Long Page` | [Before](native-page-before.png), [OS name before](native-page-before.txt): `logseq`; [after](native-page-after.png), [OS name after](native-page-after.txt): `Long Page` |
| Startup / Home | [Home](master-home.png): `Logseq` | [Startup](native-startup.png), [Home](native-home.png), [OS name](native-home.txt): `Logseq` |
| Home → Back → Forward | [Back](master-history-back.png): `Long Page`; [Forward](master-history-forward.png): `Logseq` | [Back](native-history-back.png): `Long Page`; [Forward](native-history-forward.png): `Logseq` |
| `g a` static-route shortcut | [Pages](master-pages.png), [OS name](master-pages.txt): `Pages` | [Pages](native-pages.png), [OS name](native-pages.txt): `Pages` |
| Create `Window 标题 parity` | [Page](master-unicode.png), [OS name](master-unicode.txt), [worker](master-unicode-page.json) | [Page](native-unicode.png), [OS name](native-unicode.txt), [worker](native-unicode-page.json) |
| Rename without navigation | Actual master [commits the new page title](master-renamed.png) but [keeps the old OS title](master-renamed.txt) | Initial adapter-only candidate [updated immediately](native-renamed.png), [OS name](native-renamed.txt), exposing a second mismatch |
| Final matched rename: `Window 标题 renamed` → `Window 标题 final`, Escape | [Committed page](master-final-rename-held-title.png), [OS name](master-final-rename-held-title.txt) stays `Window 标题 renamed`; [worker](master-final-page.json) has final title | With publication guard: [committed page](native-final-rename-held-title.png), [OS name](native-final-rename-held-title.txt) also stays `Window 标题 renamed`; [worker](native-final-page.json) has final title |
| Navigate away, then return | [Page](master-final-after-navigation.png), [OS name](master-final-after-navigation.txt) now `Window 标题 final` | [Page](native-final-after-navigation.png), [OS name](native-final-after-navigation.txt) now `Window 标题 final` |
| Stop native UI and its own worker, restart and reopen | Reference remains on matched final fixture | [New worker read](native-final-after-worker-restart.json), [reopened page](native-reopened-after-worker-restart.png), [OS name](native-reopened-after-worker-restart.txt) retain/recompute `Window 标题 final` |

The rename mismatch was fixed in the shared publication owner: `Page_loaded` captures whether a page is being entered before updating `current_page`. Metadata refresh does not replace its history-entry title. Existing `Navigate_to` clearing allows the next navigation to publish again. This follows master `handler/route.cljs` rather than assuming immediate rename publication is desirable.

The OS name was independently read with `xprop`, and the desktop tool also reported the actual top-level window label. The windows are borderless, so screenshots alone do not expose this metadata. Native verification used the actual GL SDL executable. The app/worker restart used only the disposable native root and checked worker command arguments before stopping it.

## Validation

- [Service red test](service-red.txt) demonstrates the discarded native title.
- [Publication red test](rename-publication-red.txt) demonstrates the rename-refresh mismatch.
- [Native/contract suites](native-tests.txt): passed, including Unicode/empty title payloads at scale1/2, metadata-refresh suppression, static navigation, and returning to a renamed page.
- [Shared UI checks](shared-ui-tests.txt):2119, zero failures.
- [Fresh Vite build](vite.txt), [serial browser regressions](browser-tests.txt):5 passed, [focused cmdk E2E](focused-e2e.txt):1 passed.
- [i18n lint](i18n.txt), specification check and diff whitespace checks passed.
- Nine independent read-only review passes completed; no unresolved findings in this chunk. No migration/schema or dependency change is required.

## Reproduction and evidence qualifications

The Unicode fixture was created through each app's palette and renamed through its actual title editor, then persisted under native UUID205ae4d5-4ee1-b19f-3df2-181c89ac243a and reference UUID6ad0930c-54a3-4701-b8d9-7f9e554c795a. Clipboard paste supplies Unicode to the native SDL app because the tool's raw X11 typing dropped those characters. Reference palette/title input and a final navigation also used Playwright attached to the already-running Electron renderer over its loopback DevTools port, without force clicks or application-state/API injection. Native app verification was never substituted with a browser.

Some action-scoped foreground clicks did not deliver a complete SDL button sequence; persistent activation and readback were required. Only confirmed navigation states above count as passes. This does not establish unfocused-first-click parity. A parked, partly off-screen native window was moved back into the desktop before valid close/restart verification.

The Pages screen is evidence for its OS title only: extra historical diagnostic fixtures differ between the two sample graphs, so page-list contents/layout are not declared verified. Settings opened as a dialog and correctly retained its underlying route title; this does not verify a direct Settings route. No graph visualization was used.

## Remaining work

This is not complete window-title parity. Built-in/internal-page translations, block-title truncation/formatting, loading/error titles, same-route explicit navigation, locale/theme changes, graph switching/closure, configured Home-page titles, direct File/Settings routes and multiwindow behavior remain unverified or different. macOS-specific title integration is unverified on Linux. Other existing rendering/sidebar/focus differences remain in the coverage matrix.

Captured text logs have ANSI color codes and trailing whitespace removed; outcomes are unchanged.
