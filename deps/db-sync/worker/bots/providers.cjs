const {spawn} = require("node:child_process");
const {readFileSync, writeFileSync, mkdtempSync, rmSync} = require("node:fs");
const {basename, join} = require("node:path");
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
  const organization = `https://api.devin.ai/v3/organizations/${encodeURIComponent(env.DEVIN_ORG_ID)}`;
  const root = organization + "/sessions";
  const call = async (url, body = null) => {
    const response = await fetch(url, {
      method: body ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(25000),
      headers: {authorization: `Bearer ${env.DEVIN_API_KEY}`, "content-type": "application/json"},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (body && response.status >= 500) throw new Error("Devin connection failed");
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
      if (job.files?.length) {
        request.attachment_urls = [];
        for (const file of job.files) {
          const form = new FormData();
          form.append("file", new Blob([file.payload]), file.name);
          const uploaded = await fetch(organization + "/attachments", {
            method: "POST", headers: {authorization: `Bearer ${env.DEVIN_API_KEY}`},
            body: form, redirect: "error", signal: AbortSignal.timeout(25000),
          });
          const data = await uploaded.json().catch(() => ({}));
          if (!uploaded.ok || typeof data.url !== "string") {
            return {state: "failed", reply: `Devin rejected an attachment (HTTP ${uploaded.status}).`};
          }
          request.attachment_urls.push(data.url);
        }
      }
      const response = await call(job.provider_session_id ? `${path}/messages` : path, request);
      if (response.status >= 400) return {state: "failed", reply: `Devin rejected the request (HTTP ${response.status}).`};
      const providerSessionId = job.provider_session_id ?? response.data.session_id;
      if (!providerSessionId) throw new Error("Missing Devin session identity");
      return {state: "poll", providerSessionId, url: response.data.url};
    }
    const history = new URL(`${path}/messages?first=100`);
    let watermark;
    try {
      watermark = JSON.parse(job.provider_cursor ?? "{}");
    } catch {
      // Earlier builds stored an event ID directly.
      watermark = job.provider_cursor.startsWith("event-")
        ? {event: job.provider_cursor} : {after: job.provider_cursor};
    }
    if (watermark.after) history.searchParams.set("after", watermark.after);
    const retry = () => {
      if (Date.now() - new Date(job.message_created_at).getTime() < 60 * 60 * 1000) {
        return {state: "poll", pollDelay: 15};
      }
      throw new Error("Devin session could not be read");
    };
    let session, page;
    try {
      [session, page] = await Promise.all([call(path), call(history)]);
    } catch {
      return retry();
    }
    if ([session.status, page.status].some(status => status === 404 || status === 429 || status >= 500)) {
      return retry();
    }
    if (session.status >= 400 || page.status >= 400 || !Array.isArray(page.data.items)) {
      throw new Error("Devin session could not be read");
    }
    const data = session.data;
    // The terminal page has no end cursor. Revisit that page and deduplicate by event ID.
    const items = page.data.items;
    const seen = watermark.event ? items.findIndex(item => item.event_id === watermark.event) : -1;
    const next = page.data.has_next_page && page.data.end_cursor;
    const cursor = JSON.stringify(next ? {after: next} : {
      after: watermark.after, event: items.at(-1)?.event_id ?? watermark.event,
    });
    const reply = items.slice(seen + 1).filter(item => item.source === "devin")
      .map(item => item.message).filter(message => typeof message === "string").join("\n\n");
    const detail = data.status_detail;
    const result = {cursor, reply, url: data.url, pollDelay: 15};
    if (next) return {...result, state: "poll"};
    if (detail === "waiting_for_user" || detail === "waiting_for_approval" || detail === "inactivity") {
      return {...result, state: "needs_input", reply: reply || (job.provider_cursor ? null : "Devin is waiting for your input.")};
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

function cursorImageType(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "image/jpeg";
  if (["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))) return "image/gif";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function cursorCloud(env) {
  const root = "https://api.cursor.com/v1/agents";
  const call = async (path, body) => {
    const response = await fetch(root + path, {
      method: body ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(25000),
      headers: {authorization: `Bearer ${env.CURSOR_API_KEY}`, "content-type": "application/json"},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (body && response.status >= 500) throw new Error("Cursor could not confirm the request");
    return {status: response.status, data: await response.json().catch(() => ({}))};
  };
  const agentPath = agentId => "/" + encodeURIComponent(agentId);
  const rejected = response => {
    const code = response.data.error?.code ?? response.data.code ?? response.data.error;
    const reply = code === "usage_limit_exceeded" ? "Cursor Cloud usage limit reached."
      : `Cursor rejected the request (HTTP ${response.status}).`;
    return {state: "failed", reply};
  };
  return async job => {
    if (job.state === "poll") {
      if (!job.provider_session_id || !job.provider_cursor) throw new Error("Cursor run identity is missing");
      const path = agentPath(job.provider_session_id) + "/runs/" + encodeURIComponent(job.provider_cursor);
      const retry = () => {
        if (Date.now() - new Date(job.message_created_at).getTime() >= 60 * 60 * 1000) {
          throw new Error("Cursor run could not be read");
        }
        return {state: "poll", pollDelay: 15};
      };
      let response;
      try { response = await call(path); } catch { return retry(); }
      if (response.status === 404 || response.status === 429 || response.status >= 500) return retry();
      if (response.status >= 400) return rejected(response);
      const run = response.data;
      if (run.status === "FINISHED") return {state: "done", reply: run.result || "Cursor finished the task."};
      if (["ERROR", "CANCELLED", "EXPIRED"].includes(run.status)) {
        return {state: "failed", reply: run.result || `Cursor run ended: ${run.status.toLowerCase()}.`};
      }
      if (["CREATING", "RUNNING", "WAITING_FOR_BACKGROUND_WORK"].includes(run.status)) {
        return {state: "poll", pollDelay: 10};
      }
      throw new Error("Cursor returned an unknown run state");
    }

    if (job.repository && env.LOGSEQ_BOTS_CURSOR_PUBLISH_REPOS !== "1") {
      return {state: "failed", reply: "Cursor Cloud repository dispatch requires permission to push a remote branch."};
    }
    const images = [];
    for (const file of job.files ?? []) {
      const mimeType = cursorImageType(file.payload);
      if (!mimeType) return {state: "failed", reply: "Cursor Cloud only accepts PNG, JPEG, GIF and WebP attachments."};
      images.push({mimeType, data: file.payload.toString("base64")});
    }
    const prompt = {text: job.prompt || "Review the attached images.", ...(images.length ? {images} : {})};
    if (job.provider_session_id) {
      const response = await call(agentPath(job.provider_session_id) + "/runs", {prompt});
      if (response.status >= 400) return rejected(response);
      if (!response.data.id) throw new Error("Cursor did not return a run ID");
      return {state: "poll", cursor: response.data.id, pollDelay: 5};
    }

    const agentId = "bc-" + job.session_id;
    const request = {agentId, prompt, autoCreatePR: false, workOnCurrentBranch: false};
    if (job.repository) request.repos = [{url: "https://github.com/" + job.repository}];
    const response = await call("", request);
    if (response.status === 409) {
      const existing = await call(agentPath(agentId));
      if (existing.status >= 400 || !existing.data.latestRunId) return rejected(response);
      return {state: "poll", providerSessionId: agentId, cursor: existing.data.latestRunId,
        url: existing.data.url, pollDelay: 5};
    }
    if (response.status >= 400) return rejected(response);
    if (response.data.agent?.id !== agentId || !response.data.run?.id) {
      throw new Error("Cursor did not return an agent and run ID");
    }
    return {state: "poll", providerSessionId: agentId, cursor: response.data.run.id,
      url: response.data.agent.url, pollDelay: 5};
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
        const output = await command(env.LOGSEQ_BOTS_CODEX, args, cwdFor(job), agentPrompt(job), childEnv);
        const providerSessionId = events(output).find(event => event.type === "thread.started")?.thread_id;
        return {state: "done", providerSessionId: providerSessionId ?? job.provider_session_id, reply: readFileSync(lastMessage, "utf8").trim()};
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

function makeAgents(env) {
  if (env.LOGSEQ_BOTS_MOCK === "1") {
    return Object.fromEntries(["devin", "circle", "cursor", "codex", "pi"].map(name => [name, async job => ({
      state: "done",
      providerSessionId: job.provider_session_id ?? `mock-${job.session_id}`,
      reply: `Mock ${name}: ${job.prompt}` + (job.files?.length
        ? "\nAttachments: " + job.files.map(file => file.name).join(", ") : ""),
    })]));
  }
  if (!env.LOGSEQ_BOTS_AGENT_OWNER) return {};
  const limits = devinLimits(env);
  return {
    ...localAgents(env),
    ...(env.CURSOR_API_KEY ? {cursor: cursorCloud(env)} : {}),
    ...(env.LOGSEQ_BOTS_DEVIN_ENABLED === "1" && env.DEVIN_ORG_ID && env.DEVIN_API_KEY
      && limits.maxAcu && limits.dailyStarts ? {devin: devin(env, limits)} : {}),
  };
}

module.exports = {devinLimits, makeAgents};
