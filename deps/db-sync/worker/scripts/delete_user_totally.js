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
  console.log(`Delete a db-sync user and all related data from a remote D1 environment.

Usage:
  node worker/scripts/delete_user_totally.js --username <username> [--env prod]
  node worker/scripts/delete_user_totally.js --user-id <user-id> [--env prod]

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

function escapeSqlValue(value) {
  return value.replaceAll("'", "''");
}

function runSelectQuery(options, sql) {
  const wranglerArgs = buildWranglerArgs({
    database: options.database,
    config: options.config,
    env: options.env,
    sql,
  });

  return parseWranglerResults(runWranglerQuery(wranglerArgs));
}

function runMutationQuery(options, sql) {
  const wranglerArgs = buildWranglerArgs({
    database: options.database,
    config: options.config,
    env: options.env,
    sql,
  });

  const output = runWranglerQuery(wranglerArgs);
  if (!Array.isArray(output) || output.length === 0) {
    throw new Error("Unexpected empty response from wrangler.");
  }

  output.forEach((statement, index) => {
    if (!statement.success) {
      throw new Error(`Wrangler reported an unsuccessful mutation (statement ${index + 1}).`);
    }
  });

  return output.reduce((sum, statement) => sum + Number(statement?.meta?.changes ?? 0), 0);
}

function sqlCountToNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function isDeleteConfirmationAccepted(answer, userId) {
  const normalizedAnswer = answer.trim();
  return normalizedAnswer === "DELETE" || normalizedAnswer === `DELETE USER ${userId}`;
}

async function confirmDeletion({ user, ownedGraphsCount, memberGraphsCount }) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      `Type DELETE to permanently delete this user (${user.user_id}; ${ownedGraphsCount} owned graph(s), ${memberGraphsCount} membership(s)): `,
    );
    return isDeleteConfirmationAccepted(answer, user.user_id);
  } finally {
    rl.close();
  }
}

async function deleteOwnedGraphs(options, ownedGraphs) {
  for (const graph of ownedGraphs) {
    const response = await fetch(buildAdminGraphDeleteUrl(options.baseUrl, graph.graph_id), {
      method: "DELETE",
      headers: {
        "x-db-sync-admin-token": options.adminToken,
      },
    });

    if (!response.ok) {
      const payload = await response.text();
      fail(`Delete failed for owned graph ${graph.graph_id}: ${response.status} ${payload}`);
    }
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const graphRows = runSelectQuery(options, buildUserGraphsSql({ ...options, ownedOnly: false }));
  const result = formatUserGraphsResult(graphRows);

  if (!result) {
    fail(`No user found for ${options.lookupLabel}=${options.lookupValue}.`);
  }

  const ownedGraphs = result.graphs.filter((graph) => graph.access_role === "owner");
  const memberGraphs = result.graphs.filter((graph) => graph.access_role !== "owner");

  printUserGraphsTable(result, "Graphs linked to user");
  console.log(`Owned graphs: ${ownedGraphs.length}`);
  console.log(`Member graphs: ${memberGraphs.length}`);

  if (ownedGraphs.length > 0 && !options.baseUrl) {
    fail("Missing worker base URL. Pass --base-url or set DB_SYNC_BASE_URL.");
  }

  if (ownedGraphs.length > 0 && !options.adminToken) {
    fail("Missing admin token. Pass --admin-token or set DB_SYNC_ADMIN_TOKEN.");
  }

  const confirmed = await confirmDeletion({
    user: result.user,
    ownedGraphsCount: ownedGraphs.length,
    memberGraphsCount: memberGraphs.length,
  });

  if (!confirmed) {
    console.log("Aborted.");
    return;
  }

  if (ownedGraphs.length > 0) {
    await deleteOwnedGraphs(options, ownedGraphs);
  }

  const escapedUserId = escapeSqlValue(result.user.user_id);
  const remainingOwnedGraphRows = runSelectQuery(
    options,
    `select count(1) as owned_graph_count from graphs where user_id = '${escapedUserId}'`,
  );
  const remainingOwnedGraphCount = sqlCountToNumber(remainingOwnedGraphRows[0]?.owned_graph_count);
  if (remainingOwnedGraphCount > 0) {
    fail(
      `Owned graph cleanup incomplete: ${remainingOwnedGraphCount} graph(s) still owned by ${result.user.user_id}.`,
    );
  }

  const deletedGraphAesKeys = runMutationQuery(
    options,
    `delete from graph_aes_keys where user_id = '${escapedUserId}'`,
  );
  const deletedGraphMembers = runMutationQuery(
    options,
    `delete from graph_members where user_id = '${escapedUserId}'`,
  );
  const clearedInvitedBy = runMutationQuery(
    options,
    `update graph_members set invited_by = null where invited_by = '${escapedUserId}'`,
  );
  const deletedUserRsaKeys = runMutationQuery(
    options,
    `delete from user_rsa_keys where user_id = '${escapedUserId}'`,
  );
  const deletedUsers = runMutationQuery(options, `delete from users where id = '${escapedUserId}'`);

  if (deletedUsers !== 1) {
    fail(`Expected to delete exactly one user row, but deleted ${deletedUsers}.`);
  }

  const userRowsAfterDelete = runSelectQuery(
    options,
    `select id from users where id = '${escapedUserId}' limit 1`,
  );
  if (userRowsAfterDelete.length > 0) {
    fail(`User ${result.user.user_id} still exists after deletion.`);
  }

  console.table([
    { step: "owned graphs deleted", rows: ownedGraphs.length },
    { step: "graph_aes_keys deleted", rows: deletedGraphAesKeys },
    { step: "graph_members deleted", rows: deletedGraphMembers },
    { step: "graph_members invited_by cleared", rows: clearedInvitedBy },
    { step: "user_rsa_keys deleted", rows: deletedUserRsaKeys },
    { step: "users deleted", rows: deletedUsers },
  ]);
  console.log(`Deleted user ${result.user.user_id} successfully.`);
}

if (require.main === module) {
  main().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
}

module.exports = {
  confirmDeletion,
  isDeleteConfirmationAccepted,
  parseCliArgs,
};
