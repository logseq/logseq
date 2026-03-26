const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const { isDeleteConfirmationAccepted, parseCliArgs } = require("./delete_user_totally");
const { defaultConfigPath } = require("./graph_user_lib");

function runCli(args) {
  return spawnSync(process.execPath, [path.join(__dirname, "delete_user_totally.js"), ...args], {
    encoding: "utf8",
  });
}

test("parseCliArgs accepts --username", () => {
  const parsed = parseCliArgs(["--username", "alice"]);

  assert.equal(parsed.lookupField, "username");
  assert.equal(parsed.lookupLabel, "username");
  assert.equal(parsed.lookupValue, "alice");
  assert.equal(parsed.env, "prod");
  assert.equal(parsed.database, "DB");
  assert.equal(parsed.config, path.resolve(defaultConfigPath));
});

test("parseCliArgs accepts --user-id", () => {
  const parsed = parseCliArgs(["--user-id", "user-123"]);

  assert.equal(parsed.lookupField, "id");
  assert.equal(parsed.lookupLabel, "user-id");
  assert.equal(parsed.lookupValue, "user-123");
});

test("CLI --help exits successfully", () => {
  const result = runCli(["--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Delete a db-sync user and all related data/);
});

test("CLI rejects passing both --username and --user-id", () => {
  const result = runCli(["--username", "alice", "--user-id", "user-123"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Pass exactly one of --username or --user-id\./);
});

test("confirmation accepts DELETE", () => {
  assert.equal(isDeleteConfirmationAccepted("DELETE", "user-123"), true);
});

test("confirmation accepts legacy DELETE USER <id>", () => {
  assert.equal(isDeleteConfirmationAccepted("DELETE USER user-123", "user-123"), true);
});

test("confirmation rejects unrelated input", () => {
  assert.equal(isDeleteConfirmationAccepted("DELETE USER other-user", "user-123"), false);
  assert.equal(isDeleteConfirmationAccepted("yes", "user-123"), false);
});
