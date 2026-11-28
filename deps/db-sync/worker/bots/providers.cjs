const {spawn} = require("node:child_process");
const {readFileSync, mkdtempSync, rmSync} = require("node:fs");
const {join} = require("node:path");
const {tmpdir} = require("node:os");

function agentPrompt(job) {
  return job.repository ? `Repository: ${job.repository}\n\n${job.prompt}` : job.prompt;
}

function positiveInteger(value) {
  const number = Number(value);
  return /^[1-9]\d*$/.test(value ?? "") && Number.isSafeInteger(number) ? number : 0;
}

function devinLimits(env) {
  return {
    maxAcu: positiveInteger(env.LOGSEQ_BOTS_DEVIN_MAX_ACU),
    dailyStarts: positiveInteger(env.LOGSEQ_BOTS_DEVIN_DAILY_STARTS),
    allowAutomation: env.LOGSEQ_BOTS_DEVIN_AUTOMATIONS === "1",
  };
}

function devin(env, limits) {
  const root = `https://api.devin.ai/v3/organizations/${encodeURIComponent(env.DEVIN_ORG_ID)}/sessions`;
  const call = async (url, body = null) => {
    const response = await fetch(url, {
      method: body ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(25000),
      headers: {authorization: `Bearer ${env.DEVIN_API_KEY}`, "content-type": "application/json"},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status >= 500) throw new Error("Devin connection failed");
    return {status: response.status, data: await response.json().catch(() => ({}))};
  };

  return async job => {
    const path = job.provider_session_id ? `${root}/${encodeURIComponent(job.provider_session_id)}` : root;
    if (job.state !== "poll") {
      const prompt = agentPrompt(job);
      const request = job.provider_session_id ? {message: prompt} : {
        title: job.prompt.slice(0, 96), prompt, devin_mode: "normal",
        max_acu_limit: limits.maxAcu, resumable: true,
        repos: job.repository ? [job.repository] : undefined,
      };
      const response = await call(job.provider_session_id ? `${path}/messages` : path, request);
      if (response.status >= 400) return {state: "failed", reply: `Devin rejected the request (HTTP ${response.status}).`};
      const providerSessionId = job.provider_session_id ?? response.data.session_id;
      if (!providerSessionId) throw new Error("Missing Devin session identity");
      return {state: "poll", providerSessionId, url: response.data.url};
    }
    const history = new URL(`${path}/messages?first=100`);
    if (job.provider_cursor) history.searchParams.set("after", job.provider_cursor);
    const [session, page] = await Promise.all([call(path), call(history)]);
    if (session.status >= 400 || page.status >= 400 || !Array.isArray(page.data.items)) {
      throw new Error("Devin session could not be read");
    }
    const data = session.data;
    const cursor = page.data.end_cursor ?? page.data.items.at(-1)?.event_id;
    const reply = page.data.items.filter(item => item.source === "devin")
      .map(item => item.message).filter(message => typeof message === "string").join("\n\n");
    const detail = data.status_detail;
    const result = {cursor, reply, url: data.url, pollDelay: 15};
    if (page.data.has_next_page) return {...result, state: "poll"};
    if (detail === "waiting_for_user" || detail === "waiting_for_approval") {
      return {...result, state: "needs_input", reply: reply || "Devin is waiting for your input."};
    }
    if (detail === "finished" || data.status === "exit") {
      return {...result, state: "done", reply: reply || (job.provider_cursor ? null : "Devin finished the task.")};
    }
    if (data.status === "error" || data.status === "suspended") {
      return {...result, state: "failed", reply: reply || (detail
        ? `Devin paused: ${detail.replaceAll("_", " ")}.` : "Devin could not complete this task.")};
    }
    return {...result, state: "poll"};
  };
}

function command(executable, args, cwd, input, env) {
  return new Promise((resolve, reject) => {
    const subprocess = spawn(executable, args, {cwd, env, stdio: ["pipe", "pipe", "ignore"]});
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
    !/^(LOGSEQ_BOTS_|DEVIN_|PG|DB_SYNC_|ASSET_LINK_SECRET)/.test(name)));
  const cwdFor = job => {
    if (!job.repository) return cwd;
    const directory = env.LOGSEQ_BOTS_REPOSITORIES
      ? JSON.parse(env.LOGSEQ_BOTS_REPOSITORIES)[job.repository] : null;
    if (!directory) throw new Error("The Agent repository is not configured");
    return directory;
  };
  return {
    ...(env.LOGSEQ_BOTS_CODEX ? {codex: async job => {
      const directory = mkdtempSync(join(tmpdir(), "logseq-bot-"));
      const lastMessage = join(directory, "answer");
      const args = ["exec", "--json", "-o", lastMessage];
      if (job.provider_session_id) args.push("resume", job.provider_session_id, "-");
      else args.push("--sandbox", "workspace-write", "-");
      try {
        const output = await command(env.LOGSEQ_BOTS_CODEX, args, cwdFor(job), agentPrompt(job), childEnv);
        const providerSessionId = events(output).find(event => event.type === "thread.started")?.thread_id;
        return {state: "done", providerSessionId, reply: readFileSync(lastMessage, "utf8").trim()};
      } finally { rmSync(directory, {recursive: true, force: true}); }
    }} : {}),
    ...(env.LOGSEQ_BOTS_PI ? {pi: async job => {
      const output = await command(env.LOGSEQ_BOTS_PI,
        ["--session-id", job.session_id, "--mode", "json", "-p", "--", agentPrompt(job)],
        cwdFor(job), "", childEnv);
      const final = events(output).filter(event => event.type === "message_end" && event.message?.role === "assistant").at(-1);
      const reply = final?.message.content?.filter(item => item.type === "text").map(item => item.text).join("\n");
      if (!reply) throw new Error("Pi returned no assistant reply");
      return {state: "done", providerSessionId: job.session_id, reply};
    }} : {}),
    ...(env.LOGSEQ_BOTS_CIRCLE ? {circle: async job => {
      const output = await command(env.LOGSEQ_BOTS_CIRCLE, [], cwdFor(job),
        JSON.stringify({prompt: agentPrompt(job), sessionId: job.provider_session_id}), childEnv);
      const result = JSON.parse(output);
      if (typeof result.reply !== "string") throw new Error("Circle returned no assistant reply");
      return {state: "done", providerSessionId: result.sessionId, url: result.url, reply: result.reply};
    }} : {}),
  };
}

function makeAgents(env) {
  if (env.LOGSEQ_BOTS_MOCK === "1") {
    return Object.fromEntries(["devin", "circle", "codex", "pi"].map(name => [name, async job => ({
      state: "done",
      providerSessionId: job.provider_session_id ?? `mock-${job.session_id}`,
      reply: `Mock ${name}: ${job.prompt}`,
    })]));
  }
  if (!env.LOGSEQ_BOTS_AGENT_OWNER) return {};
  const limits = devinLimits(env);
  return {
    ...localAgents(env),
    ...(env.LOGSEQ_BOTS_DEVIN_ENABLED === "1" && env.DEVIN_ORG_ID && env.DEVIN_API_KEY
      && limits.maxAcu && limits.dailyStarts ? {devin: devin(env, limits)} : {}),
  };
}

module.exports = {devinLimits, makeAgents};
