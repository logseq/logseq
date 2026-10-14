# Search creation callback ownership

Native predecessor: `556e3f59f2`; reference: master `7dfa9b45a`.

The dialog-dismissal wait must preserve the creation target. The editor append
service reads the live route, so a callback must cancel if the current graph or
page no longer matches its captured creation target. It now checks both on
every retry, using the existing service reads without another state channel.

## Test-first regression

The production retry function runs with queued timers and an actual stub-DOM
modal. Test cases retain/release the modal, reopen search, exhaust retries, change
the loaded page and switch graphs. Before the identity guard, the last two cases
append once to the replacement context: **2087 checks, 2 failures**. After:
**2087 checks, 0 failures**. Release inserts exactly once; cancellation never
inserts or reports timeout; exhausted ownership logs once without insertion.

Native executable/web/test builds, native-host/contracts/host tests and the
focused real-browser creation/focus/persistence/graph-validation E2E pass.

## Actual native execution

Restarted the actual SDL/OpenGL executable on the rebuilt code. At 1280 x 900,
scale 1, English/light, Ctrl+K → create `Native creation context` → type
`Creation context persisted` without another pointer action → Escape. The
capture and native worker response prove correct-page saved content. Selecting
the existing `Native focus verified` recent page then waiting a second leaves
its block tree byte-identical to the pre-navigation worker response.

This actual interaction establishes the normal creation/navigation regression
path. The narrowly timed navigation-during-dismissal race is deterministically
covered through the production retry function, not claimed as reproduced through
desktop input. Remaining palette result/filter/scroll/Escape differences remain
in the main coverage matrix. Graph visualization is excluded.
