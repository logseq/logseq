# Native title clipboard ownership

Reference: master 7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8.
Before: native 4fa5c4a51c036186306a98861cdcc08bb725386a.
Actual Electron and SDL windows: 1280x900, light theme, scale 1, both sidebars
closed, disposable fixture graphs. Graph visualization remains excluded.

## Reproduction and change

Before this fix, Ctrl+A/C in an active native Long Page title leaves an owned
clipboard sentinel unchanged; actual master copies Long Page. The title model
is page-local, not Editor_state.editing, and the SDL hidden sink has no initial
source text. Editable classification alone cannot implement clipboard defaults.

The host now dispatches document clipboard listeners synchronously, then invokes
the existing editor menu/insert surface only when no document owner consumed the
event. This preserves structured block clipboard ownership without a duplicate
fallback. Both platform schemas declare the existing menu event/decoder. Local
title copy/cut reads the current model, not the empty sink. Plain title/body copy
or selected cut retires both old structured provenance fields, preventing a later
same-text paste from restoring stale trees/properties.

Read-only review found an empty-paste safety issue in the initial candidate:
inserting an empty string deletes the selected title. Actual SDL reproduction
confirmed it. The host now ignores empty text, matching the reference web editor;
nonempty whitespace remains valid input. This also covers a missing text format,
which the native clipboard reader reports as no text.

## Actual interaction evidence

- Selected Ctrl+C returns exact Long Page: [native](native-selected-copy.png).
- Collapsed Ctrl+C returns [[6acfb138-272f-49e4-b333-5de24a86813f]].
- Collapsed Ctrl+X preserves the owned sentinel and title.
- Selected Ctrl+X copies/removes exactly the selected source, then Ctrl+V restores
  it: [master cut](master-cut-empty-title.png), [native cut](native-cut-empty-title.png),
  [master restore](master-paste-restores-title.png), [native restore](native-paste-restores-title.png).
- Two-line paste stays inside the title, without creating outline blocks:
  [master](master-multiline-paste.png), [native](native-multiline-paste.png).
  Native selected copy returns both lines with the original newline.
- Native Unicode paste/copy returns exact café 😀 suffix:
  [capture](native-unicode-paste.png). Production tests also select the whole emoji
  by UTF-8 byte offsets, not a broken character slice.
- Empty paste: [candidate deletes selection](native-empty-paste-before.png),
  [final binary preserves text and selection](native-empty-paste-after.png).
  Follow-up Ctrl+C still returns Long Page.
- Ordinary native command-search input copy/cut/paste preserves Interaction parity:
  [capture](native-input-cut-paste.png).
- Structured block copy followed by Enter and paste into an empty target writes
  exactly two ab!cd rows in both actual app workers, never a duplicated insertion:
  master-structured-paste-tree.json and native-structured-paste-tree.json.
  **Remaining difference:** [master](master-structured-paste.png) shows the pasted
  active editor text; [native](native-structured-paste-once.png) initially appears
  empty although the worker contains it. [Escape](native-structured-paste-after-escape.png)
  shows the correct native text. This is not claimed as complete structured-paste
  parity and is the next editor investigation.

All clipboard reads followed owned sentinel/test writes or app copies. Detached
xclip ownership was required: an undetached xclip process may exit with the tool
shell, which is not an application clipboard defect. The native Long Page was
restored and committed through the UI. Final worker reads retain all 45 original
block titles/order and its original UUID; native-final-outline.json and
native-final-page.json are retained. artifact-sha256.txt identifies tested builds.

## Validation and limits

Failing-first native production tests cover the missing menu schema, collapsed
copy, local copy/cut, multiline/Unicode source and structured provenance clearing.
The host empty/whitespace policy also has a failing-first focused test. Native
host/contracts/host suites pass; shared UI suite passes 2119 checks, 0 failures.
Read-only correctness, data-contract, regression, failure-mode, migration,
performance, coverage, convention and system-addition reviews completed. The
empty-paste finding was reproduced and fixed. No DB migration/schema bump,
worker contract, dependency change or new user-facing text is introduced.

Fresh Vite focused creation/focus passes (1/1, 3.46s); serial browser
spacing/property regressions pass (2/2, 3.51s). Results are recorded in the
adjacent test output files. The geometry/property fixtures previously pressed
Enter immediately after filling a query, racing the ready create action/input
ownership. They now use the same ordinary ready-action click as the focused
creation E2E, without force or event injection. These fixture tests do not claim
keyboard-create readiness coverage; that race remains a search follow-up. After sandbox process
restoration, initial browser attempts failed because the Playwright cache was
absent and the server was started from the wrong directory (404). The browser
was reinstalled and server restarted from native/. These environment failures
are not counted as successful runs or hidden by forced pointer actions.

Title undo/redo, empty/invalid-name error timing, duplicate-name handling,
body-to-title focus, pointer placement, bidi/IME, full multiblock clipboard,
structured-paste editor refresh and paste history remain unverified/unresolved.
No full title/editor/clipboard parity claim is made.
