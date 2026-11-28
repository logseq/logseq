const {spawn} = require("node:child_process");
const {readFileSync, writeFileSync, mkdtempSync, rmSync} = require("node:fs");
const {basename, join} = require("node:path");
const {tmpdir} = require("node:os");

function agentPrompt(job) {
  return [
    job.repository && `Repository: ${job.repository}`,
    job.graph_id && `Linked Logseq graph ID: ${job.graph_id}. Use the local Logseq CLI for graph access if the task needs it.`,
    job.prompt,
  ].filter(Boolean).join("\n\n");
}

function command(executable, args, cwd, input, env, signal) {
  return new Promise((resolve, reject) => {
    const subprocess = spawn(executable, args, {cwd, env, signal, stdio: ["pipe", "pipe", "ignore"]});
    let output = "";
    const timer = setTimeout(() => subprocess.kill(), 20 * 60000);
    subprocess.stdout.setEncoding("utf8");
    subprocess.stdout.on("data", chunk => {
      output += chunk;
      if (output.length > 8000000) subprocess.kill();
    });
    subprocess.once("error", error => {
      clearTimeout(timer);
      reject(error);
    });
    subprocess.once("close", code => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new Error("Agent command failed"));
    });
    subprocess.stdin.on("error", () => {});
    subprocess.stdin.end(input);
  });
}

function events(output) {
  return output.split("\n").flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

function localAgents(env) {
  const cwd = env.LOGSEQ_BOTS_AGENT_ROOT;
  if (!cwd) return {};
  const childEnv = Object.fromEntries(Object.entries(env).filter(([name]) =>
    !/^(LOGSEQ_BOTS_|DEVIN_|CURSOR_API_KEY$|PG|DB_SYNC_|ASSET_LINK_SECRET)/.test(name)));
  const cwdFor = job => {
    if (!job.repository) return cwd;
    const directory = env.LOGSEQ_BOTS_REPOSITORIES
      ? JSON.parse(env.LOGSEQ_BOTS_REPOSITORIES)[job.repository] : null;
    if (!directory) throw new Error("The Agent repository is not configured");
    return directory;
  };
  const providers = {
    ...(env.LOGSEQ_BOTS_CODEX ? {codex: async job => {
      const directory = mkdtempSync(join(tmpdir(), "logseq-bot-"));
      const lastMessage = join(directory, "answer");
      const args = ["exec", "--sandbox", "workspace-write", "--json", "-o", lastMessage];
      if (job.provider_session_id) args.push("resume", job.provider_session_id, "-");
      else args.push("-");
      try {
        const output = await command(env.LOGSEQ_BOTS_CODEX, args, cwdFor(job), agentPrompt(job), childEnv, job.signal);
        const providerSessionId = events(output).find(event => event.type === "thread.started")?.thread_id;
        return {state: "done", providerSessionId: providerSessionId ?? job.provider_session_id, reply: readFileSync(lastMessage, "utf8").trim()};
      } finally { rmSync(directory, {recursive: true, force: true}); }
    }} : {}),
    ...(env.LOGSEQ_BOTS_PI ? {pi: async job => {
      const output = await command(env.LOGSEQ_BOTS_PI,
        ["--session-id", job.provider_session_id ?? job.session_id, "--mode", "json", "-p", "--", agentPrompt(job)],
        cwdFor(job), "", childEnv, job.signal);
      const final = events(output).filter(event => event.type === "message_end" && event.message?.role === "assistant").at(-1);
      const reply = final?.message.content?.filter(item => item.type === "text").map(item => item.text).join("\n");
      if (!reply) throw new Error("Pi returned no assistant reply");
      return {state: "done", providerSessionId: job.provider_session_id ?? job.session_id, reply};
    }} : {}),
    ...(env.LOGSEQ_BOTS_CIRCLE ? {circle: async job => {
      const output = await command(env.LOGSEQ_BOTS_CIRCLE, [], cwdFor(job),
        JSON.stringify({prompt: agentPrompt(job), sessionId: job.provider_session_id}), childEnv, job.signal);
      const result = JSON.parse(output);
      if (typeof result.reply !== "string") throw new Error("Circle returned no assistant reply");
      return {state: "done", providerSessionId: result.sessionId, url: result.url, reply: result.reply};
    }} : {}),
  };
  return Object.fromEntries(Object.entries(providers).map(([name, provider]) => [
    name, async job => {
      if (!job.files?.length) return provider(job);
      const directory = mkdtempSync(join(tmpdir(), "logseq-bot-files-"));
      try {
        const files = job.files.map((file, index) => {
          const path = join(directory, `${index + 1}-${basename(file.name.replaceAll("\\", "/"))}`);
          writeFileSync(path, file.payload, {mode: 0o600});
          return {name: file.name, path};
        });
        return await provider({...job, prompt: job.prompt + "\n\nAttachments:\n" + JSON.stringify(files)});
      } finally { rmSync(directory, {recursive: true, force: true}); }
    },
  ]));
}

module.exports = {localAgents};
