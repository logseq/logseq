# Checksum Mismatch Reproduction Runbook

This runbook describes how to reliably reproduce, replay, and analyze db-sync checksum mismatches using the Chrome tab simulator.

## 1) Find a mismatch quickly

```bash
node scripts/sync-open-chrome-tab-simulate.cjs \
  --profile "Default" \
  --graph db1 \
  --instances 2 \
  --ops 100
```

Notes:
- The simulator now fail-fasts on `:rtc.log/checksum-mismatch` and `:rtc.log/tx-rejected`.
- On mismatch, output is written to `tmp/db-sync-repro/<run-id>/artifact.json`.

## 2) Replay a captured run

```bash
node scripts/sync-open-chrome-tab-simulate.cjs \
  --replay tmp/db-sync-repro/<run-id>/artifact.json
```

Replay behavior:
- Reuses captured args.
- Reuses fixed per-instance operation plan when available.
- Preserves seeded behavior for deterministic scheduling.

## 3) Analyze an artifact

```bash
node scripts/sync-open-chrome-tab-analyze-artifact.cjs \
  --artifact tmp/db-sync-repro/<run-id>/artifact.json \
  --pretty
```

Analyzer output includes:
- First mismatch payload (local/remote tx + checksums)
- First tx-rejected payload (reason + tx)
- Fail-fast reason and cancelled peers
- Requested plan comparison across clients
- Per-client last operations and errors

## 4) Deterministic controls

Use a fixed seed when searching:

```bash
node scripts/sync-open-chrome-tab-simulate.cjs \
  --profile "Default" \
  --graph db1 \
  --instances 2 \
  --ops 100 \
  --seed my-seed
```

## 5) Noise control while debugging

Disable cleanup to inspect page state after run:

```bash
node scripts/sync-open-chrome-tab-simulate.cjs \
  --profile "Default" \
  --graph db1 \
  --instances 2 \
  --ops 40 \
  --no-cleanup-today-page
```

Disable checksum verification command diagnostics if needed:

```bash
node scripts/sync-open-chrome-tab-simulate.cjs ... --no-verify-checksum
```

## 6) Current sync-side behavior

When checksum compare is ready and checksums differ:
- Worker recomputes local checksum from DB first.
- Cache is updated with recomputed checksum.
- Mismatch log/signal is emitted only if recomputed checksum still differs.

This avoids false positives from stale checksum cache values.
