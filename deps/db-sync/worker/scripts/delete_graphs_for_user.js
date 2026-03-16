#!/usr/bin/env node

const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { parseArgs } = require("node:util");
const {
  buildAdminGraphDeleteUrl,
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
  console.log(`Delete db-sync graphs owned by a user from a remote D1 environment.

Usage:
  node worker/scripts/delete_graphs_for_user.js --username <username> [--env prod]
  node worker/scripts/delete_graphs_for_user.js --user-id <user-id> [--env prod]

Options:
  --username <username>  Look up the target user by username.
  --user-id <user-id>    Look up the target user by user id.
  --env <env>            Wrangler environment to use. Defaults to "prod".
  --database <name>      D1 binding or database name. Defaults to "DB".
  --config <path>        Wrangler config path. Defaults to worker/wrangler.toml.
  --base-url <url>       Worker base URL. Defaults to DB_SYNC_BASE_URL.
  --admin-token <token>  Admin delete token. Defaults to DB_SYNC_ADMIN_TOKEN.
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
      "base-url": { type: "string", default: process.env.DB_SYNC_BASE_URL },
      "admin-token": { type: "string", default: process.env.DB_SYNC_ADMIN_TOKEN },
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
    baseUrl: values["base-url"],
    adminToken: values["admin-token"],
  };
}

async function confirmDeletion(result) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      `Type DELETE to remove ${result.graphs.length} owned graph(s) for ${result.user.user_id}: `,
    );
    return answer.trim() === "DELETE";
  } finally {
    rl.close();
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const lookupSql = buildUserGraphsSql({ ...options, ownedOnly: true });
  const lookupArgs = buildWranglerArgs({
    database: options.database,
    config: options.config,
    env: options.env,
    sql: lookupSql,
  });
  const lookupRows = parseWranglerResults(runWranglerQuery(lookupArgs));
  const result = formatUserGraphsResult(lookupRows);

  if (!result) {
    fail(`No user found for ${options.lookupLabel}=${options.lookupValue}.`);
  }

  printUserGraphsTable(result, "Owned graphs to delete");
  if (result.graphs.length === 0) {
    console.log("No owned graphs found. Nothing to delete.");
    return;
  }

  if (!options.baseUrl) {
    fail("Missing worker base URL. Pass --base-url or set DB_SYNC_BASE_URL.");
  }

  if (!options.adminToken) {
    fail("Missing admin token. Pass --admin-token or set DB_SYNC_ADMIN_TOKEN.");
  }

  const confirmed = await confirmDeletion(result);
  if (!confirmed) {
    console.log("Aborted.");
    return;
  }

  for (const graph of result.graphs) {
    const response = await fetch(buildAdminGraphDeleteUrl(options.baseUrl, graph.graph_id), {
      method: "DELETE",
      headers: {
        "x-db-sync-admin-token": options.adminToken,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      fail(`Delete failed for ${graph.graph_id}: ${response.status} ${body}`);
    }
  }

  console.log(`Deleted ${result.graphs.length} owned graph(s).`);
}

if (require.main === module) {
  main().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
}

module.exports = {
  confirmDeletion,
  parseCliArgs,
};
