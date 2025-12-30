# Android 0.11.0 migration and UX plan

This document captures a scoped plan for aligning the Android build with Logseq 0.11.0 while keeping Markdown graphs first-class, dropping RTC/Pro sync expectations, and tightening the mobile UX.

## 1) Establish a clean 0.11.0 baseline

- Add the official upstream remote (if missing) and fetch the 0.11.0 tag: `git remote add upstream https://github.com/logseq/logseq.git` then `git fetch upstream v0.11.0`.
- Create a fresh branch from the tag and replay local changes there: `git switch -c android-0.11-upgrade upstream/v0.11.0` then cherry-pick/mobile patches as needed. Keep the existing Yarn lockfiles untouched until the base compiles, then regenerate with the top-level `yarn install --mode=update-lockfile`.
- Re-run the mobile entry to confirm the base loads: `yarn mobile-dev` (or the existing mobile dev script) and ensure `mobile.core/render!` still boots the app shell from `src/main/mobile/core.cljs`.
- For release builds, keep `server` commented in `capacitor.config.ts` to avoid dev server endpoints in production payloads.

## 2) Keep Markdown graphs and drop RTC/Pro expectations

- Ensure Markdown graph flows remain the default in mobile routing (`src/main/mobile/routes.cljs` and `src/main/mobile/navigation.cljs`). Confirm that repo selection still uses the file-backed graph UI from `mobile.components.graphs` and `frontend.components.repo/repos-cp`.
- Gate DB/RTC-specific background work behind explicit DB checks so Markdown graphs avoid unused workers. For example, `src/main/mobile/core.cljs` currently requires `frontend.handler.db-based.rtc-background-tasks`; wrap initialization so it only runs when a DB graph is active.
- Remove or hide RTC/Pro entry points on mobile by stubbing the RTC worker bridge in `src/main/frontend/worker/rtc` when `mobile-util/native-android?` is true. Keep manual export/import flows as the primary sync story.

## 3) Manual import/export and storage clarity

- Extend the graphs screen (`src/main/mobile/components/graphs.cljs`) to surface: “Open local folder” (existing behavior), “Export graph” (zip current repo to Downloads or user-selected SAF path), and “Refresh graph” (re-scan files). Implement export using the mobile intent helpers in `frontend.mobile.intent`.
- Document where the graph lives on-device (e.g., app sandbox vs. user-selected folder) and surface it in Settings (`src/main/mobile/components/settings.cljs`). Provide a one-tap “Open containing folder” intent for Syncthing/third-party tools.

## 4) Gesture and navigation polish

- Add two-finger back/forward history gestures by extending navigation hooks in `src/main/mobile/navigation.cljs` (tie into `mobile-nav/notify-route-change!` history stacks). Require edge start zones to avoid Android system back conflicts.
- Support edge swipes to open sidebars by wiring new handlers in `mobile.navigation` that dispatch to sidebar open/close events (reuse existing sidebar toggles from the desktop UI layer).
- Offer a pull-down gesture over the editor surface to open the command palette, plus a visible toolbar icon in `src/main/mobile/components/editor_toolbar.cljs` to trigger the same command.

## 5) Toolbar and layout fixes

- Keep visible indent/outdent buttons in the native toolbar (`mobile.components.editor_toolbar.cljs` already declares `indent-outdent-action`); ensure they are always registered in `toolbar-actions` when editing.
- Audit overlap issues (e.g., sidebar “Create” button) by testing the layout and adjusting scroll containers in `src/main/mobile/components/app.css` and `mobile.components.app`. Make sure the bottom bar does not cover actionable buttons in landscape.
- Ensure the bottom tabs from `src/main/mobile/bottom_tabs.cljs` always render in split-screen or on resize by listening for viewport changes and reconfiguring `configure-tabs` when needed.

## 6) Performance and stability checkpoints

- Exercise large Markdown graphs (5k+ pages) with the mobile entry to validate that navigation stays responsive. Focus on lazy-loading in the data layer (`src/main/frontend/worker/db` and `db_worker.cljs`) to avoid loading entire graphs at startup.
- Track crashes related to permissions or worker lifecycle by instrumenting the mobile init flow (`src/main/mobile/init.cljs`), especially around keyboard listeners and app state changes.

## 7) UX polish for editing and gestures

- Fix keyboard-dismiss handling by blurring the editor when the Keyboard hide event fires (`keyboardWillHide` in `src/main/mobile/init.cljs`), ensuring edit mode exits and toolbar reappears.
- Resolve horizontal scroll vs. swipe conflicts by raising gesture thresholds in `mobile.navigation` and honoring scrollable child elements before interpreting a swipe as navigation.
- Verify long-block editing and scrolling in the editor; adjust text area sizing and scroll anchoring in the editor component (see `frontend.components.block` and mobile wrappers) so the start of long blocks stays visible.

## 8) Testing and release

- Run the mobile regression suite (`bb dev:lint-and-test`) and add targeted tests for mobile gestures where feasible. For manual checks, walk through navigation, editing, theme switching, and split-screen scenarios on Android 12–15.
- Build the release APK using the existing script (e.g., `bb release:android-app`) and sign through the Android build pipeline. Smoke-test install on device to validate theme switching, import/export, and toolbar visibility.
