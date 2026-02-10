# E2E Task Status (asset restore regression)

## Task (what you asked for)

- Add a real end-to-end regression for: **delete local graph, download remote graph, assets are restored automatically** (no page visit required).
- Demonstrate **fail pre-fix** (`a760ad40e^`) and **pass post-fix** (`a760ad40e`), using **two git worktrees**.
- Rewrite history so the **E2E test commit lands immediately before `a760ad40e`**.

## Current progress

- Repo branch: `feat/worker-sync-personal-use`.
- Worktrees exist under repo parent dir:
  - `../logseq-wt-pre` (pre-fix baseline runs).
  - `../logseq-wt-post` (post-fix runs).
- E2E regression test exists (currently being stabilized):
  - `clj-e2e/test/logseq/e2e/rtc_extra_part2_test.clj` (`asset-blocks-validate-after-init-downloaded-test`)
  - Test asserts assets in **lightning-fs** (`window.pfs`) since `clj-e2e` runs the web build.
  - Helper for listing/waiting assets:
    - `clj-e2e/src/logseq/e2e/assets.clj`
- Root cause uncovered while running the test: asset upload can race with asset file writes, leading to `ENOENT` in browser console logs (seen as `[frontend.handler.assets] {:read-asset ... ENOENT ...}`), and causing the test’s “asset is available on client2” precondition to fail.

## Speedup changes (temporary but safe, env-gated)

Goal: make the red-green loop ~10x faster by avoiding:
1) running the entire `rtc-extra-part2-test` namespace, and
2) creating + syncing + deleting a brand new RTC graph every run, and
3) Playwright’s default `slow-mo` delay (100ms).

### Fast env vars

- `LOGSEQ_E2E_FAST=1`
  - Sets Playwright slow-mo to `0` (via `clj-e2e/src/logseq/e2e/config.clj`).
- `LOGSEQ_E2E_ONLY_ASSET_RESTORE=1`
  - Runs only the asset restore regression test using `test-ns-hook` (via `clj-e2e/test/logseq/e2e/rtc_extra_part2_test.clj`).
- `LOGSEQ_E2E_REUSE_RTC_GRAPH=1`
  - Reuses a stable remote graph name `rtc-extra-part2-test-graph-reused` instead of creating/deleting one every run (via `clj-e2e/test/logseq/e2e/fixtures.clj`).

### New bb task

- `cd clj-e2e && bb run-rtc-extra-part2-asset-test`
  - Equivalent to setting the 3 env vars above and running the ns.
  - Implemented in `clj-e2e/bb.edn`.

### Notes about reliability

- Speed mode exposed a timing flake around opening the slash-command menu (`util/input-command` waiting `.ui__popover-content`). Next step is hardening `clj-e2e/src/logseq/e2e/util.clj` so fast mode does not introduce new flakes.

## Next steps

1) Stabilize the single asset restore E2E in fast mode (harden `util/input-command` and the asset upload step).
2) Run `../logseq-wt-pre` and `../logseq-wt-post` to prove fail/pass at the right commits.
3) Rebase to place the E2E commit immediately before `a760ad40e` (and squash/drop the noisy intermediate “fix(e2e)/fix(assets)” commits).

