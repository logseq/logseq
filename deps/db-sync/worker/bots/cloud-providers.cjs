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
    dailyStarts: env.LOGSEQ_BOTS_DEVIN_DAILY_STARTS === "unlimited"
      ? Infinity : positiveInteger(env.LOGSEQ_BOTS_DEVIN_DAILY_STARTS),
    allowAutomation: env.LOGSEQ_BOTS_DEVIN_AUTOMATIONS === "1",
  };
}

async function fetchProvider(url, options) {
  // Workers support manual redirects. Reject them before credentials can be forwarded.
  const response = await fetch(url, {...options, redirect: "manual"});
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`Agent API returned a redirect (HTTP ${response.status})`);
  }
  return response;
}

function devin(env, limits) {
  const organization = `https://api.devin.ai/v3/organizations/${encodeURIComponent(env.DEVIN_ORG_ID)}`;
  const root = organization + "/sessions";
  const call = async (url, body = null, timeout = 25000) => {
    const response = await fetchProvider(url, {
      method: body ? "POST" : "GET", signal: AbortSignal.timeout(timeout),
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
          const uploaded = await fetchProvider(organization + "/attachments", {
            method: "POST", headers: {authorization: `Bearer ${env.DEVIN_API_KEY}`},
            body: form, signal: AbortSignal.timeout(25000),
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
    const readOnly = job.readOnly === true;
    const retry = () => {
      if (Date.now() - new Date(job.message_created_at).getTime() < 60 * 60 * 1000) {
        return {state: "poll", pollDelay: 15};
      }
      throw new Error("Devin session could not be read");
    };
    let session, page;
    try {
      [session, page] = readOnly
        ? [null, await call(history, null, 2500)]
        : await Promise.all([call(path), call(history)]);
    } catch (error) {
      if (readOnly) throw error;
      return retry();
    }
    if (!readOnly && [session.status, page.status].some(status => status === 404 || status === 429 || status >= 500)) {
      return retry();
    }
    if ((session && session.status >= 400) || page.status >= 400 || !Array.isArray(page.data.items)) {
      throw new Error("Devin session could not be read");
    }
    // The terminal page has no end cursor. Revisit that page and deduplicate by event ID.
    const items = page.data.items;
    const seen = watermark.event ? items.findIndex(item => item.event_id === watermark.event) : -1;
    const next = page.data.has_next_page && page.data.end_cursor;
    const cursor = JSON.stringify(next ? {after: next} : {
      after: watermark.after, event: items.at(-1)?.event_id ?? watermark.event,
    });
    const messages = items.slice(seen + 1).flatMap(item => {
      if (typeof item.message !== "string" || !item.message.trim()) return [];
      if (item.source === "devin") return [{author: "devin", body: item.message}];
      if (item.source === "user" && item.origin === "web") return [{author: "user", body: item.message}];
      return [];
    });
    if (readOnly) return {cursor, messages};
    const data = session.data;
    const reply = messages.filter(message => message.author === "devin").map(message => message.body).join("\n\n");
    const detail = data.status_detail;
    const result = {cursor, reply, messages, url: data.url, pollDelay: 15};
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
  const model = {id: env.LOGSEQ_BOTS_CURSOR_MODEL?.trim() || "grok-4.7"};
  const call = async (path, body) => {
    const response = await fetchProvider(root + path, {
      method: body ? "POST" : "GET", signal: AbortSignal.timeout(25000),
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
      const response = await call(agentPath(job.provider_session_id) + "/runs", {prompt, model});
      if (response.status >= 400) return rejected(response);
      const runId = response.data.run?.id;
      if (!runId) throw new Error("Cursor did not return a run ID");
      return {state: "poll", cursor: runId, pollDelay: 5};
    }

    const agentId = "bc-" + job.session_id;
    const request = {agentId, prompt, model, autoCreatePR: false, workOnCurrentBranch: false};
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

function cloudAgents(env) {
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
    ...(env.CURSOR_API_KEY ? {cursor: cursorCloud(env)} : {}),
    ...(env.LOGSEQ_BOTS_DEVIN_ENABLED === "1" && env.DEVIN_ORG_ID && env.DEVIN_API_KEY
      && limits.maxAcu && limits.dailyStarts ? {devin: devin(env, limits)} : {}),
  };
}

module.exports = {cloudAgents, devinLimits};
