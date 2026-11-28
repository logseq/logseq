const {readFile, mkdir, writeFile, unlink, realpath, stat} = require("node:fs/promises");
const {homedir} = require("node:os");
const {dirname, join, resolve} = require("node:path");
const {parseArgs} = require("node:util");
const {discoverAgents, listen, pair, revoke} = require("./runner-client.cjs");

const help = `Usage:
  logseq agent runner pair --workspace <directory> [--agent codex] [--agent pi] [--repository <owner/name>] [--server <origin>]
  logseq agent runner listen
  logseq agent runner revoke

Pair uses the current CLI login. Use --auth-file for a custom CLI auth file and --config for a custom runner config.`;

async function main(args) {
  const {positionals, values} = parseArgs({args, allowPositionals: true, options: {
    help: {type: "boolean"}, workspace: {type: "string"}, repository: {type: "string"},
    agent: {type: "string", multiple: true}, server: {type: "string"}, config: {type: "string"},
    "auth-file": {type: "string"},
  }});
  if (values.help || positionals.length === 0) {
    console.log(help);
    return;
  }
  if (positionals.length !== 1) throw new Error("Choose one runner action");
  const configFile = resolve(values.config ?? join(homedir(), "logseq", "bots-runner.json"));
  if (positionals[0] === "pair") {
    if (!values.workspace) throw new Error("Choose a workspace with --workspace");
    const root = await realpath(values.workspace);
    if (!(await stat(root)).isDirectory()) throw new Error("The workspace must be a directory");
    const commands = discoverAgents();
    const agents = [...new Set(values.agent ?? Object.keys(commands))];
    if (!agents.length || agents.some(name => !Object.hasOwn(commands, name))) {
      throw new Error("Install a selected Codex or Pi executable before pairing");
    }
    const auth = JSON.parse(await readFile(values["auth-file"] ?? join(homedir(), "logseq", "auth.json"), "utf8"));
    if (!auth["id-token"]) throw new Error("Sign in with logseq auth login first");
    const server = values.server ?? process.env.LOGSEQ_BOTS_SERVER ?? "https://api.logseq.io";
    const repository = values.repository ?? "";
    await mkdir(dirname(configFile), {recursive: true, mode: 0o700});
    const device = await pair({server, accountToken: auth["id-token"], agents, repository});
    try {
      await writeFile(configFile, JSON.stringify({
        server, root, repository, credential: device.credential,
        commands: Object.fromEntries(agents.map(name => [name, commands[name]])),
      }), {flag: "wx", mode: 0o600});
    } catch (error) {
      await revoke({server, credential: device.credential}).catch(() => {});
      if (error.code === "EEXIST") throw new Error("A runner is already paired with this config");
      throw error;
    }
    console.log("Paired. Start listening with logseq agent runner listen.");
    return;
  }
  if (!["listen", "revoke"].includes(positionals[0])) throw new Error(help);
  const config = JSON.parse(await readFile(configFile, "utf8"));
  if (positionals[0] === "revoke") {
    await revoke(config);
    await unlink(configFile);
    console.log("Device unpaired.");
    return;
  }
  const stop = new AbortController();
  const abort = () => stop.abort();
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  let status;
  try {
    await listen(config, {signal: stop.signal, onStatus(next) {
      if (status !== next) console.log("Logseq Bot runner " + next);
      status = next;
    }});
    if (status === "revoked") process.exitCode = 1;
  } finally {
    process.off("SIGINT", abort);
    process.off("SIGTERM", abort);
  }
}

module.exports = {main};
