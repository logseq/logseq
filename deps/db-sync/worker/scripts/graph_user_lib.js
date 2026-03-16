const { execFileSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");
const defaultConfigPath = path.join(repoRoot, "worker", "wrangler.toml");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function escapeSqlValue(value) {
  return value.replaceAll("'", "''");
}

function sqlBooleanToBool(value) {
  if (value === null || value === undefined) return null;
  return Number(value) === 1;
}

function sqlTimestampToIso(value) {
  if (value === null || value === undefined || value === "") return null;
  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function buildUserGraphsSql({ lookupField, lookupValue, ownedOnly = false }) {
  const escapedValue = escapeSqlValue(lookupValue);
  const memberUnion = ownedOnly
    ? ""
    : `
  union all
  select g.graph_id,
         g.graph_name,
         g.user_id as owner_user_id,
         m.role as access_role,
         m.invited_by,
         g.schema_version,
         g.graph_e2ee,
         g.graph_ready_for_use,
         g.created_at,
         g.updated_at
  from graph_members m
  join graphs g on g.graph_id = m.graph_id
  join target_user u on m.user_id = u.id
  where g.user_id <> u.id`;

  return `with target_user as (
  select id, email, username
  from users
  where ${lookupField} = '${escapedValue}'
  limit 1
),
matching_graphs as (
  select g.graph_id,
         g.graph_name,
         g.user_id as owner_user_id,
         'owner' as access_role,
         null as invited_by,
         g.schema_version,
         g.graph_e2ee,
         g.graph_ready_for_use,
         g.created_at,
         g.updated_at
  from graphs g
  join target_user u on g.user_id = u.id${memberUnion}
)
select u.id as user_id,
       u.email as user_email,
       u.username as user_username,
       g.graph_id,
       g.graph_name,
       g.access_role,
       g.invited_by,
       g.owner_user_id,
       owner.email as owner_email,
       owner.username as owner_username,
       g.schema_version,
       g.graph_e2ee,
       g.graph_ready_for_use,
       g.created_at,
       g.updated_at
from target_user u
left join matching_graphs g on 1 = 1
left join users owner on owner.id = g.owner_user_id
order by g.updated_at desc;`;
}

function buildWranglerArgs({ database, config, env, sql }) {
  return [
    "--yes",
    "wrangler",
    "d1",
    "execute",
    database,
    "--config",
    config,
    "--env",
    env,
    "--remote",
    "--json",
    "--command",
    sql,
  ];
}

function runWranglerQuery(args) {
  const output = execFileSync("npx", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  return JSON.parse(output);
}

function parseWranglerResults(output) {
  if (!Array.isArray(output) || output.length === 0) {
    throw new Error("Unexpected empty response from wrangler.");
  }

  const [statement] = output;
  if (!statement.success) {
    throw new Error("Wrangler reported an unsuccessful D1 query.");
  }

  return Array.isArray(statement.results) ? statement.results : [];
}

function formatUserGraphsResult(rows) {
  if (rows.length === 0) {
    return null;
  }

  const [firstRow] = rows;
  const graphs = rows
    .filter((row) => row.graph_id)
    .map((row) => ({
      graph_id: row.graph_id,
      graph_name: row.graph_name,
      access_role: row.access_role,
      invited_by: row.invited_by ?? null,
      owner_user_id: row.owner_user_id,
      owner_username: row.owner_username ?? null,
      owner_email: row.owner_email ?? null,
      schema_version: row.schema_version ?? null,
      graph_e2ee: sqlBooleanToBool(row.graph_e2ee),
      graph_ready_for_use: sqlBooleanToBool(row.graph_ready_for_use),
      created_at: sqlTimestampToIso(row.created_at),
      updated_at: sqlTimestampToIso(row.updated_at),
    }));

  return {
    user: {
      user_id: firstRow.user_id,
      username: firstRow.user_username ?? null,
      email: firstRow.user_email ?? null,
    },
    graphs,
  };
}

function printUserGraphsTable(result, countLabel = "Graphs") {
  console.log(
    `User: ${result.user.user_id}` +
      (result.user.username ? ` (${result.user.username})` : "") +
      (result.user.email ? ` <${result.user.email}>` : ""),
  );
  console.log(`${countLabel}: ${result.graphs.length}`);
  if (result.graphs.length > 0) {
    console.table(result.graphs);
  }
}

function buildAdminGraphDeleteUrl(baseUrl, graphId) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return `${normalizedBaseUrl}/admin/graphs/${encodeURIComponent(graphId)}`;
}

module.exports = {
  buildAdminGraphDeleteUrl,
  buildUserGraphsSql,
  buildWranglerArgs,
  defaultConfigPath,
  fail,
  formatUserGraphsResult,
  parseWranglerResults,
  printUserGraphsTable,
  repoRoot,
  runWranglerQuery,
};
