---
name: logseq-server-usage-stats
description: Collect, interpret, and troubleshoot db-sync server usage stats (total users/graphs, active users/graphs in N days, created-today metrics) using the `deps/db-sync` scripts and D1 schema. Use when requests involve `show-usage-stats`, server usage reporting, active-entity counting, or Cloudflare D1 cost impact of usage tracking.
---

# Logseq Server Usage Stats

Use this skill to run and explain server usage stats for db-sync.

## Run stats

Use the packaged command from `deps/db-sync`:

```bash
cd deps/db-sync
pnpm show-usage-stats
pnpm show-usage-stats --days 7
pnpm show-usage-stats --json
pnpm show-usage-stats --env staging --days 30 --json
pnpm show-usage-stats --env local --json
```

## Metric semantics

Interpret output with these rules:

- `active_users_last_n_days` and `active_graphs_last_n_days` come from deduplicated rows in `daily_active_entities`.
- `active_since_utc` and `today_utc` are UTC-day boundaries.
- `users_created_today` reads `users.created_at` in today UTC range.
- `graphs_created_today` reads `graphs.created_at` in today UTC range.

When discussing data quality, explicitly mention:

- activity is counted from request-path touch logic, not client app foreground time
- active metrics are per day per entity, not per request

## Cost review workflow

When asked about Cloudflare cost impact:

1. Separate one-off stats query cost from continuous request-path tracking cost.
2. Treat request-path activity touch as the primary D1 cost driver.
3. Verify whether touch happens only on successful responses in the current code.
4. Estimate cost with traffic shape:
   - successful sync request volume
   - unique `(day, entity_type, entity_id)` volume
   - cache effectiveness under multi-isolate execution
5. Recommend reducing write attempts before adding new infrastructure:
   - keep touch only on meaningful successful routes
   - avoid duplicate touch points on read-heavy endpoints

## Troubleshooting

If command fails, check in order:

1. Wrong environment or wrangler config path.
2. Missing migrations/tables/columns.
3. D1 auth/project context mismatch.
4. Non-integer `--days` value (`>= 1` required).
