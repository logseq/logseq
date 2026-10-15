# Add-row ownership and mounted outline refresh

## Scope and runtime

Reference: master `7dfa9b45aee9d6a9387ddb3375018356f1e7c6a8`, actual Electron.
Implementation: native SDL/LUI on `codex/native-ui-parity-master`, based on
`7b0d18735000f2b7ae6342c410df476088baa543`. No LUI dependency source edits.
Both windows use 1280x900, scale 1, English/light, the same named page and
representative Contents/Quick add text. Only dedicated disposable graph data is
used. Graph visualization remains explicitly excluded by the user.

## Before and root causes

1. Clicking the Contents add row inserted into the unrelated main route.
   `native-before.json`, the preceding [card investigation](../sidebar-cards/validation.md),
   and `owner-routing-red.txt` establish the route fallback. Explicit owners were
   looked up only among journals before falling back to the current page.
2. An owner-only repair inserted into Contents but left the editor in `main` and
   its view stale: `native-owner-correct-view-stale.png`, `scope-trace-before.txt`.
   Actual native snapshots stored ancestors root-first; returning a matched
   ancestor from `closest` also discarded its remaining parent chain.
3. Own structural response deltas refreshed the main model, not all mounted
   stores. `own-response-trace.txt` proves affected keys existed in the actual
   worker acknowledgement. Deferred saves followed by no-op acknowledgements
   also needed their combined affected keys, not just the final response.
4. Sidebar async reads could overwrite newer reads or resurrect stale fold/close
   state. Existing descendant edits did not invalidate their owning card.
5. Production snapshot tests exposed cache collisions between distinct native
   application instances with equal generation/count tuples.

## Changes

- Add rows carry required owner UUID, Library insertion kind and owning scope;
  missing owners render no interactive row. Click and Enter share routing.
  Insert as the owner's bottom child, never a sibling of a zoomed block root.
- Native snapshots use nearest-first outward ancestry. Composed `closest` calls
  preserve that ancestry. Cache identity includes the application generation ref.
- The existing canonical delta refresh captures graph context and notifies other
  mounted stores once with the union of deferred/current affected keys. Existing
  property invalidation owns the notification instead of a duplicate manual arm.
  Starting another store's asynchronous refresh does not eagerly acknowledge all
  its revisions as applied.
- Sidebar reads publish into current membership/fold state, reject obsolete
  generations and invalidate on owned descendant changes. A clean active sidebar
  editor may follow refreshed source; asynchronous reference resolution rechecks
  repository, session, input cleanliness and canonical source before publishing.
  This guard is not a claim that complete Undo UI parity is fixed.

## Paired actual interactions

| Flow | Reference | Native result / evidence |
| --- | --- | --- |
| Contents add, type, fold/save, reopen | Correct owner and text | Correct owner/scope and visible editor; `native-add-row-after.png`; final `master-second-add-editor.png` / `native-second-add-editor.png` |
| Second add under nonempty Contents | Appends after first row | Same order a0/a1, same text; `master-two-blocks.json` / `native-two-blocks.json`; `master-second-reopened.png` / `native-second-reopened.png` |
| Main route isolation | Unrelated main body unchanged | `native-main-unchanged.json` and `native-restarted-main.json`: one empty row; no Contents text leaked |
| Quick add row and save | Blank first row, entered second row | Same two-row content/owner; `master-quick-add-row.png` / `native-quick-add-row.png`, saved screenshots and body JSON |
| Nonempty Delete merge | Concatenates the two row strings without a separator | Same displayed/worker text; paired `*-merge-nonempty.png` and `*-merged-body.json` |
| Undo that sidebar merge | Two original rows, active editor follows restored text | Worker restores both original rows, but native active editor can retain merged text after nine seconds. `native-undo-immediate-final.png`, `native-undo-settled-final.png`, `native-undo-final.json`. **Unresolved UI failure, not a pass.** |
| Native UI + own worker restart | Reference content retained | Closed SDL via caption, verified worker arguments before terminating only its disposable worker; new SDL280025/worker280032. `native-restarted-contents.png`, `native-restarted-quick-add.png` and three `native-restarted-*.json` retain exact UUIDs/text/order and isolated main body |

The first failed blank-row trials were removed only after verifying their exact
UUID and empty title with the native UI closed. Their intermediate captures are
investigation evidence, not final matching screenshots. The final saved rows are
`ff257d01-21ce-4f4e-9a07-a5c54aaabb36` and
`2973e54d-ba52-45cf-a5b7-40f1661880ea`. Quick add's saved second row is
`b91c3352-6845-4534-b4b0-719229a7d24f`.

## Regression validation

Test-first red logs are retained alongside this report. New production native
coverage exercises actual add-button attributes, delegated native Click/Enter,
Quick add scope, main/journal/sidebar/block-root/Library operation payloads,
deferred + no-op notifications, real nonempty canonical batch application,
retired graph fencing, native ancestor/cache identity, sidebar membership/fold
preservation, read ordering and delayed editor resynchronization races.

- Native executable + Melange/test targets build successfully.
- Forced native-host, contracts and host tests pass.
- Shared UI suite: **2119 checks, 0 failures**.
- Fresh Vite bundle followed by six serial browser layout/card/property tests:
  **6/6 pass**. Focused current-bundle page-creation E2E: **1/1 pass**.
- Nine independent read-only review passes plus focused race follow-ups; confirmed
  findings were regression-tested and repaired. No remaining confirmed review
  finding in this chunk; actual Undo failure is still recorded above.
- Scope-specific spec and diff checks pass. No worker/schema migration, new
  shipped text or LUI dependency change. Broad historical E2E is not claimed green.

## Remaining differences

- Sidebar merge Undo/Redo source/editor ordering still requires a separate repair.
- Linux Quick add opens with Ctrl+Alt+E in master, but native currently uses Ctrl+E.
  The first master Ctrl+E attempt is not passing evidence; final master captures
  used Ctrl+Alt+E. Add to today semantics were not exercised in this chunk.
- Preview is still read-only in existing native code; tests prove owner payload
  and scope plumbing, not actual editable-preview interaction parity.
- Sidebar text is still 14px against master16px; properties button width, hidden
  collapsed-control Tab focus, Help/Search content layout and other card actions
  remain covered by the matrix, not marked complete here.
- IME, failures/retries across every surface, all Library/zoomed-root GUI cases,
  themes/scales, macOS and the rest of editor/history parity remain unverified.
