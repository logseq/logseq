# Search creation, loading and focus checkpoint

Reference: master 7dfa9b45a. Native base: 7b0d18735000f2b7ae6342c410df476088baa543. The paired saved-page captures use the same title and block content, 1280 x 900, English, light theme and scale 1. Both are disposable graphs.

## Reproductions before implementation

- A space in an OCaml literal reaches Melange as UTF-8 bytes. The palette's nonbreaking-space insertion skipped the existing literal-text boundary, rendering `caféÂ 😀` instead of `café 😀`. The focused regression failed with that exact difference.
- The header exposed graph search before a graph existed, unlike master. Mounted production-header tests failed for initial loading and graph closure.
- Creating a page could mount its editor while the exiting search dialog still owned return focus. A new E2E first failed its bounded editor-focus check. Deferring insertion until the closing surface is gone fixes the actual ownership race rather than masking it with a fixed delay.
- Toasts no longer exposed master's `ui__toast` selector. A mounted production-notification regression failed; this also prevented the existing graph-validation fixture from observing its success notification.

## Changes and validation

- Palette display spaces use the platform literal-text conversion while preserving worker-provided Unicode.
- Shared and native headers offer search only after their graph is ready, and remove it on graph closure.
- Search creation waits for the retained dialog to release focus ownership before starting the first editor. Reopening search cancels that pending insertion.
- The standard toast retains the master notification selector and its existing status class.
- UI recording suite: **2072 checks, 0 failures**, including the new loading, Unicode and notification assertions.
- The focused E2E `cmdk-create-page-keeps-spaced-label-and-editor-focus` passed twice in fresh contexts. It checks the spaced page title, eventual real input focus, typed content after Escape, and the existing graph-validation success notification. Broader editor/E2E coverage is not declared green.
- Actual native SDL/OpenGL reproduction: Ctrl+K, replace the restored query with `Native focus verified`, Enter, type `Focus ownership persisted` **without another pointer press**, then Escape. The screenshot shows the saved block, and the native worker returns the same persisted title. The earlier smoke page also survived graceful close and restart.

## Remaining differences

Header alignment has a later checkpoint. Escape ordering, filter query preservation and owning-input focus have a later [validated repair](../search-escape/validation.md). Palette result/filter details, complete query restoration and other search actions still require coverage. Notification placement, pause/swipe/timer semantics and layout remain unverified. The saved-page screenshots intentionally expose remaining shell and text appearance differences; this checkpoint does not establish full search, editor, notification or visual parity.
