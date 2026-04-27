#!/usr/bin/env node

const path = require("node:path");
const { parseArgs } = require("node:util");
const {
  buildWranglerArgs,
  defaultConfigPath,
  fail,
  parseWranglerResults,
  runWranglerQuery,
} = require("./graph_user_lib");

function printHelp() {
  console.log(`Show db-sync usage stats from a remote D1 environment.

Usage:
  node worker/scripts/show_usage_stats.js [--env prod] [--days 7] [--json]

Options:
  --env <env>            Wrangler environment to use. Defaults to "prod".
  --days <n>             Active window size in days. Defaults to 1.
  --database <name>      D1 binding or database name. Defaults to "DB".
  --config <path>        Wrangler config path. Defaults to worker/wrangler.toml.
  --json                 Print JSON instead of a table.
  --help                 Show this message.

Output:
  days
  active_since_utc
  active_users_last_n_days
  active_graphs_last_n_days
  total_users
  total_graphs
  users_created_today
  graphs_created_today
  today_utc
`);
}

function parseDays(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    fail("--days must be an integer >= 1.");
  }
  return parsed;
}

function parseCliArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      env: { type: "string", default: "prod" },
      days: { type: "string", default: "1" },
      database: { type: "string", default: "DB" },
      config: { type: "string", default: defaultConfigPath },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  return {
    env: values.env,
    days: parseDays(values.days),
    database: values.database,
    config: path.resolve(values.config),
    json: values.json,
  };
}

function buildUsageStatsSql(days) {
  const sinceDays = days - 1;
  return `with bounds as (
  select
    cast(strftime('%s', 'now', 'start of day') as integer) * 1000 as today_start_ms,
    cast(strftime('%s', 'now', 'start of day', '+1 day') as integer) * 1000 as tomorrow_start_ms,
    date('now') as today_utc,
    date('now', '-${sinceDays} days') as active_since_utc
)
select
  ${days} as days,
  (select active_since_utc from bounds) as active_since_utc,
  (select count(distinct entity_id)
   from daily_active_entities a
   join bounds b on 1 = 1
   where a.entity_type = 'user'
     and a.day_utc >= b.active_since_utc
     and a.day_utc <= b.today_utc) as active_users_last_n_days,
  (select count(distinct entity_id)
   from daily_active_entities a
   join bounds b on 1 = 1
   where a.entity_type = 'graph'
     and a.day_utc >= b.active_since_utc
     and a.day_utc <= b.today_utc) as active_graphs_last_n_days,
  (select count(1) from users) as total_users,
  (select count(1) from graphs) as total_graphs,
  (select count(1)
   from users u
   join bounds b on 1 = 1
   where u.created_at is not null
     and u.created_at >= b.today_start_ms
     and u.created_at < b.tomorrow_start_ms) as users_created_today,
  (select count(1)
   from graphs g
   join bounds b on 1 = 1
   where g.created_at is not null
     and g.created_at >= b.today_start_ms
     and g.created_at < b.tomorrow_start_ms) as graphs_created_today,
  (select today_utc from bounds) as today_utc;`;
}

function sqlCountToNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatUsageStats(rows) {
  if (!rows.length) {
    return null;
  }

  const [row] = rows;
  return {
    days: sqlCountToNumber(row.days),
    active_since_utc: typeof row.active_since_utc === "string" ? row.active_since_utc : null,
    active_users_last_n_days: sqlCountToNumber(row.active_users_last_n_days),
    active_graphs_last_n_days: sqlCountToNumber(row.active_graphs_last_n_days),
    total_users: sqlCountToNumber(row.total_users),
    total_graphs: sqlCountToNumber(row.total_graphs),
    users_created_today: sqlCountToNumber(row.users_created_today),
    graphs_created_today: sqlCountToNumber(row.graphs_created_today),
    today_utc: typeof row.today_utc === "string" ? row.today_utc : null,
  };
}

function printUsageStatsTable(stats) {
  console.table([stats]);
}

function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const sql = buildUsageStatsSql(options.days);
  const wranglerArgs = buildWranglerArgs({
    database: options.database,
    config: options.config,
    env: options.env,
    sql,
  });
  const rows = parseWranglerResults(runWranglerQuery(wranglerArgs));
  const stats = formatUsageStats(rows);

  if (!stats) {
    fail("No stats returned from D1.");
  }

  if (options.json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    printUsageStatsTable(stats);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/no such table: daily_active_entities/i.test(message)) {
      fail("Missing daily_active_entities. Apply worker migration 0006_add_daily_active_entities.sql.");
    }
    if (/no such column: created_at/i.test(message)) {
      fail("Missing users.created_at. Apply worker migration 0005_add_user_created_at.sql.");
    }
    fail(message);
  }
}

module.exports = {
  buildUsageStatsSql,
  formatUsageStats,
  parseCliArgs,
};
