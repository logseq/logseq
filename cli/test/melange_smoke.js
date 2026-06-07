const { spawnSync } = require("child_process");

const entrypoint = process.argv[2];

if (!entrypoint) {
  console.error("missing Melange CLI entrypoint path");
  process.exit(1);
}

function runCli(args) {
  return spawnSync(process.execPath, [entrypoint, ...args], {
    encoding: "utf8",
    env: process.env,
  });
}

function assertExitZero(name, result) {
  if (result.status !== 0) {
    console.error(`${name}: expected exit 0, got ${result.status}`);
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(1);
  }
}

function assertIncludes(name, text, needle) {
  if (!text.includes(needle)) {
    console.error(`${name}: missing ${JSON.stringify(needle)}`);
    console.error(text);
    process.exit(1);
  }
}

const help = runCli(["--help"]);
assertExitZero("help", help);
assertIncludes("help", help.stdout, "Usage");
assertIncludes("help", help.stdout, "Commands");

const version = runCli(["--version"]);
assertExitZero("version", version);
assertIncludes("version", version.stdout, "logseq-cli");
