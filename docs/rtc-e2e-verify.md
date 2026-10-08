# RTC cloud sync + E2EE verification: LUI web app vs master

GUI end-to-end verification of real-time cloud sync (RTC) and E2EE on the
LUI web app (`deps/ui`, OCaml/Melange) against the production Logseq Sync
backend (`api.logseq.io`), compared surface-by-surface with master
(`app.logseq.com`, cljs/React).

- LUI: `devin/component-migration` @ `b23c2d6524` + the comments-area fixes
  in this branch, served via `node scripts/serve-static.mjs 3001`.
- Master: `app.logseq.com`, same account.
- Account: `e2etest` (password `Logseq-e2e`, E2EE password `e2etest`).
- Second client: a separate Chrome profile (incognito window on the same
  CDP endpoint) driving `http://localhost:3001` as an independent device.
- All screenshots live in `docs/assets/rtc-e2e/` as `<flow>-lui.png` /
  `<flow>-master.png`.

## What was verified end-to-end

| flow | status | notes |
|------|--------|-------|
| Login dialog | ok | Identical to master: Email + Password, Sign In, "Sign up"/"Forgot password?" links. `login-lui`, `login-master` |
| Login | ok | `e2etest`/`Logseq-e2e` signs in; id/access/refresh tokens land in localStorage; toolbar shows the `E2` avatar badge + cloud icon |
| New remote E2EE graph | ok | Created `rtc-verify-lui-e2e` (uuid `0f6a641f-...`) with "Use Logseq Sync?" + E2EE checked. Graph KV flags: `graph-rtc-e2ee?=true`, `graph-remote?=true`. It appears in master's Remote graphs list with the E2EE **lock** icon (`all-graphs-master`) |
| E2EE password modal | ok | Same "Enter password for remote graphs" prompt on both apps, incl. the "Downloading..." indicator while waiting. `e2ee-modal-lui`, `e2ee-modal-master` |
| Remote download on a second device | ok | Incognito client B picked `rtc-verify-lui-e2e` from the remote list, entered `e2etest`, decrypted and rendered both blocks |
| Live remote tx apply | ok | Both directions: blocks typed on client A appear on client B without reload; `logseq.api.append_block_in_page` on client B lands live on client A. `thread-api/db-sync-status` on both workers converged: `local-tx = remote-tx`, identical checksums, `ws-state :open`, `pending-local/pending-server = 0`, `last-error null` |
| Cross-implementation E2EE | ok | Master (`app.logseq.com`) opened the LUI-created graph, accepted `e2etest`, and rendered all blocks + comments — LUI's E2EE output is decryptable by the cljs client (`comments-master`) |
| Comments: post | ok | Textarea `Reply...` submits on Enter and on the send button; the row renders **live** after fix (1) below |
| Comments: persist | ok | All rows survive `location.reload()` and are visible in master (`Comments 4`, author `e2etest` + timestamp). `comments-lui`, `comments-master` |
| Comments: `.ls-comments-targets` | ok | Multi-target area (`ensure-comments-area-for-blocks` over 2 blocks) renders the "On those blocks" toggle; expanding shows `.ls-comments-targets` with both target titles. `comments-lui` |
| Sync status indicator | ok | Toolbar parity: person-add icon, `E2` user badge, cloud-with-check. The `{:local-tx ... :remote-tx ...}` text is a `hidden` debug node (`data-testid="rtc-tx"`), not visible |

## Bugs found and fixed (this branch)

1. **Comments area frozen at mount** — `Comments_view.area_el` took the
   block record by value; `block_row_sig` passed the mount-time `b0`, so a
   submitted comment inserted via `insert-blocks` never re-rendered the
   area (count stayed `Comments 0`, zero `.ls-comment-row`, full reload
   required). `area_el` now subscribes to the row's `Model.block` signal
   via `Signal.map2` with the local UI state; the static `row_el` path
   uses `area_el_static` (constant signal, unchanged behavior).
   `deps/ui/src/comments/comments_view.ml`, `deps/ui/src/blocks/tree.ml`
2. **Draft text not cleared after submit** — `submit_comment` cleared the
   localStorage draft but the keyed `<textarea>` DOM node is reused across
   re-renders, so the submitted text stayed visible. The textarea value is
   now cleared explicitly (`#area-<uuid> .ls-comment-add textarea`),
   matching `comments_ops.submit`.
3. **`.ls-comments-targets` always empty** — `fetch_target_titles` read
   `block/uuid`/`block/title` directly off `thread-api/get-blocks`
   results, but the endpoint returns `[{id, block}]` wrappers; every entry
   filtered out. Now unwraps `"block"` first.

## Parity gaps (observed, not fixed)

- **Comment meta line missing**: master's comment rows show avatar +
  `e2etest 7:08 PM`; LUI's `.ls-comment-meta` renders empty. `Model.block`
  carries no `created-at`/author fields — adding them means extending the
  worker block pull, so left as a documented gap.
- **No E2EE lock icon in the remote graph list**: master marks encrypted
  remote graphs with a lock glyph; LUI's All-graphs list shows the name
  only. `all-graphs-lui` vs `all-graphs-master`
- **No "Log out" affordance**: LUI's dots menu shows the logged-in
  identity (`e2etest`, masked email) but no logout action.
- Minor layout deltas: LUI's `Comments` label and count are two sibling
  nodes (master renders `Comments 4` inline); the `Reply...` textarea is
  taller; `.ls-comments-target` rows are plain text.

## Repro recipe

```sh
cd deps/ui
OPAMSWITCH=5.5.0 opam exec -- dune build @all
cd .. && pnpm gulp:build && pnpm css:build && pnpm ui:build
node scripts/serve-static.mjs 3001   # open http://localhost:3001/index.html
```

1. dots menu → Login → `e2etest` / `Logseq-e2e`
2. Create db graph → name it → check "Use Logseq Sync?" + E2EE, set
   E2EE password `e2etest` (existing-password flow on this account)
3. Open the same graph URL in a second browser profile; enter `e2etest`
   in the "Enter password for remote graphs" modal
4. Type blocks on either client; verify they appear on the other without
   reload. `db-sync-status` should report equal tx counts/checksums and
   `ws-state :open`
5. Right-click a block → Add comment (or select multiple blocks → Add
   comment for a multi-target area); submit with Enter
6. `master` check: log into `app.logseq.com` with the same account → All
   graphs → the LUI graph appears with a lock icon; opening it prompts
   for `e2etest` and decrypts

Gates after the fixes: `OPAMSWITCH=5.5.0 opam exec -- dune build @all`
clean; `node _build/default/test/ui_test/test/test_main.js` →
1546 checks, 0 failures.
