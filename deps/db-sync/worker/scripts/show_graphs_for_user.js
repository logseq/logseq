#!/usr/bin/env node

const path = require("node:path");
const { parseArgs } = require("node:util");
const {
  buildUserGraphsSql,
  buildWranglerArgs,
  defaultConfigPath,
  fail,
  formatUserGraphsResult,
  parseWranglerResults,
  printUserGraphsTable,
  runWranglerQuery,
} = require("./graph_user_lib");

function printHelp() {
  console.log(`Show db-sync graphs for a user from a remote D1 environment.

Usage:
  node worker/scripts/show_graphs_for_user.js --username <username> [--env prod] [--json]
  node worker/scripts/show_graphs_for_user.js --user-id <user-id> [--env prod] [--json]

Options:
  --username <username>  Look up the target user by username.
  --user-id <user-id>    Look up the target user by user id.
  --env <env>            Wrangler environment to use. Defaults to "prod".
  --database <name>      D1 binding or database name. Defaults to "DB".
  --config <path>        Wrangler config path. Defaults to worker/wrangler.toml.
  --json                 Print JSON instead of a table.
  --help                 Show this message.
`);
}

function parseCliArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      username: { type: "string" },
      "user-id": { type: "string" },
      env: { type: "string", default: "prod" },
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

  const lookupCount = Number(Boolean(values.username)) + Number(Boolean(values["user-id"]));
  if (lookupCount !== 1) {
    fail("Pass exactly one of --username or --user-id.");
  }

  return {
    lookupField: values.username ? "username" : "id",
    lookupLabel: values.username ? "username" : "user-id",
    lookupValue: values.username ?? values["user-id"],
    env: values.env,
    database: values.database,
    config: path.resolve(values.config),
    json: values.json,
  };
}

function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const sql = buildUserGraphsSql(options);
  const wranglerArgs = buildWranglerArgs({
    database: options.database,
    config: options.config,
    env: options.env,
    sql,
  });
  const rows = parseWranglerResults(runWranglerQuery(wranglerArgs));
  const result = formatUserGraphsResult(rows);

  if (!result) {
    fail(`No user found for ${options.lookupLabel}=${options.lookupValue}.`);
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printUserGraphsTable(result);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

module.exports = {
  parseCliArgs,
};
