const {createHash, randomBytes, randomUUID} = require("node:crypto");
const {isRunnerRequest} = require("../account_events.cjs");
const {cloudAgents, devinLimits} = require("./cloud-providers.cjs");
const {weeklyProposal, nextWeekly} = require("./schedule.cjs");

const agents = ["devin", "circle", "cursor", "codex", "pi"];
const localAgentNames = ["codex", "pi"];
const leaseSeconds = 90;
const pageSize = 40;
const maxAttachmentSize = 10 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function fail(status, message) {
  throw new RequestError(status, message);
}

function id(value) {
  if (typeof value !== "string" || !uuid.test(value)) fail(400, "Invalid identifier");
  return value.toLowerCase();
}

function text(value, max) {
  if (typeof value !== "string" || value.trim() === "" || value.length > max) fail(400, "Invalid text");
  return value.trim();
}

function agent(value) {
  if (!agents.includes(value)) fail(400, "Select an Agent");
  return value;
}

function hasAgent(availableAgents, name) {
  return availableAgents.some(item => item.name === name && item.available);
}

function configuredAgent(availableAgents, name) {
  if (!hasAgent(availableAgents, agent(name))) fail(409, "This Agent is no longer configured");
  return name;
}

function defaultAgent(availableAgents, name) {
  return name == null || name === "" ? "" : configuredAgent(availableAgents, name);
}

function repository(value) {
  if (value == null || value === "") return "";
  if (typeof value !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) fail(400, "Use owner/repository");
  return value;
}

function runnerWorkspaces(value) {
  const {repositories, hasDefaultWorkspace} = value ?? {};
  if (!Array.isArray(repositories) || repositories.length > 32 ||
      typeof hasDefaultWorkspace !== "boolean" || (!hasDefaultWorkspace && !repositories.length)) {
    fail(400, "Choose a default workspace or up to 32 repository workspaces");
  }
  if (repositories.some(name => !repository(name)) || new Set(repositories).size !== repositories.length) {
    fail(400, "Choose distinct repositories");
  }
  return {repositories, hasDefaultWorkspace};
}

function cursor(value) {
  if (value !== null && !/^\d{1,18}$/.test(value)) fail(400, "Invalid cursor");
  return value;
}

async function jsonBody(request, {allowEmpty = false} = {}) {
  try {
    const value = await request.text();
    if (allowEmpty && value === "") return {};
    if (value.length > 32000) fail(413, "Message is too long");
    const body = JSON.parse(value);
    if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "Invalid JSON");
    return body;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    fail(400, "Invalid JSON");
  }
}

function attachmentList(value = []) {
  if (!Array.isArray(value) || value.length > 4) fail(400, "Attach up to four files");
  const files = value.map(file => {
    if (!file || typeof file !== "object") fail(400, "Invalid attachment");
    const name = text(file.name, 255);
    if (/[\x00-\x1f\x7f]/.test(name)) fail(400, "Invalid attachment name");
    return {id: id(file.id), name};
  });
  if (new Set(files.map(file => file.id)).size !== files.length) fail(400, "Duplicate attachment");
  return files;
}

async function uploadAttachment(pool, owner, botId, uploadId, request) {
  if (!request.body || Number(request.headers.get("content-length")) > maxAttachmentSize) {
    fail(413, "Attachments must be between 1 byte and 10 MB");
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of request.body) {
    length += chunk.byteLength;
    if (length > maxAttachmentSize) fail(413, "Attachments must be between 1 byte and 10 MB");
    chunks.push(chunk);
  }
  if (!length) fail(400, "Empty attachment");
  const payload = Buffer.concat(chunks, length);
  const {rowCount} = await pool.query(
    `INSERT INTO bot_uploads (id,bot_id,owner,payload) VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO NOTHING`, [uploadId, botId, owner, payload]);
  if (!rowCount) {
    const existing = await pool.query(
      "SELECT id FROM bot_uploads WHERE id=$1 AND bot_id=$2 AND owner=$3 AND payload=$4",
      [uploadId, botId, owner, payload]);
    if (!existing.rowCount) fail(409, "Attachment identifier already in use");
  }
  return {saved: true};
}

async function transaction(pool, operation) {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await operation(db);
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}

async function ownedBot(db, owner, botId) {
  const {rows: [bot]} = await db.query("SELECT * FROM bots WHERE owner=$1 AND id=$2", [owner, botId]);
  if (!bot) fail(404, "Bot not found");
  return bot;
}

async function visibleBot(db, owner, botId, memberships) {
  const {rows: [bot]} = await db.query("SELECT * FROM bots WHERE id=$1", [botId]);
  if (!bot || !memberships.includes(bot.graph_id) ||
      (bot.owner !== owner && bot.shared_graph_id !== bot.graph_id)) fail(404, "Bot not found");
  return bot;
}

async function visibleBots(db, owner, memberships, bot = null) {
  const {rows} = await db.query(
    `SELECT id,name,owner,shared_graph_id FROM bots WHERE graph_id=ANY($2::uuid[])
       AND (owner=$1 OR shared_graph_id=graph_id)
       AND id IS DISTINCT FROM $3::uuid AND ($4::uuid IS NULL OR graph_id=$4)
       AND ($5::uuid IS NULL OR shared_graph_id=$5)
       ORDER BY name,id`, [owner, memberships, bot?.id ?? null, bot?.graph_id ?? null, bot?.shared_graph_id ?? null]);
  return rows;
}

async function sessionById(db, botId, sessionId) {
  const {rows: [session]} = await db.query("SELECT * FROM sessions WHERE bot_id=$1 AND id=$2", [botId, sessionId]);
  if (!session) fail(404, "Session not found");
  return session;
}

async function messagePage(db, botId, sessionId, url) {
  const before = cursor(url.searchParams.get("before"));
  const after = cursor(url.searchParams.get("after"));
  if (before !== null && after !== null) fail(400, "Use one message cursor");
  const {rows} = await db.query(
    `SELECT id,bot_id,session_id,seq,author,body,proposal,created_at,attachments,handoff,requested_agent FROM messages
       WHERE bot_id=$1 AND ${sessionId ? "session_id=$2::uuid" : "session_id IS NULL AND $2::uuid IS NULL"}
         AND ($3::bigint IS NULL OR seq<$3) AND ($4::bigint IS NULL OR seq>$4)
       ORDER BY seq ${after === null ? "DESC" : "ASC"} LIMIT $5`,
    [botId, sessionId, before, after, pageSize + 1]);
  const more = rows.length > pageSize;
  const messages = rows.slice(0, pageSize);
  return {messages: after === null ? messages.reverse() : messages, more};
}

async function insertMessage(db, botId, sessionId, messageId, author, body, {
  proposal = null, attachments = [], handoff = null, actor = null, requestedAgent = null,
  requestedAgents = null, replyTo = null,
} = {}) {
  // A later sequence must not become visible while an earlier write can still commit.
  await db.query("SELECT id FROM bots WHERE id=$1 FOR NO KEY UPDATE", [botId]);
  const {rows: [message]} = await db.query(
    `INSERT INTO messages (id,bot_id,session_id,author,body,proposal,attachments,handoff,actor,requested_agent,requested_agents,in_reply_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING RETURNING *`,
    [messageId, botId, sessionId, author, body, proposal, JSON.stringify(attachments), handoff, actor, requestedAgent, requestedAgents, replyTo]);
  if (message && sessionId && (body || attachments.length)) {
    await db.query("UPDATE sessions SET reply_count=reply_count+1 WHERE id=$1", [sessionId]);
  }
  return message;
}

async function enqueueRun(db, messageId, sessionId, selectedAgent, {
  automation = false, workflowRootId = null, remainingAgents = [],
} = {}) {
  await db.query(`INSERT INTO bot_runs (message_id,session_id,agent,automation,workflow_root_id,remaining_agents)
    VALUES ($1,$2,$3,$4,$5,$6)`, [messageId, sessionId, selectedAgent, automation, workflowRootId, remainingAgents]);
}

async function newSession(db, bot, rootId, prompt, selectedAgent, options) {
  const sessionId = randomUUID();
  await db.query(
    `INSERT INTO sessions (id,bot_id,root_message_id,title,agent,repository)
       VALUES ($1,$2,$3,$4,$5,$6)`,
    [sessionId, bot.id, rootId, Array.from(prompt).slice(0, 96).join(""), selectedAgent, bot.repository]);
  await enqueueRun(db, rootId, sessionId, selectedAgent, options);
  return sessionId;
}

async function sendMessage(pool, owner, bot, sessionId, body, access) {
  return transaction(pool, async db => {
    const session = sessionId && await sessionById(db, bot.id, sessionId);
    const messageId = id(body.id);
    const files = attachmentList(body.attachments);
    const prompt = body.body === "" && files.length ? "" : text(body.body, 12000);
    const requestedAgents = body.agents ?? null;
    if (requestedAgents !== null && (!Array.isArray(requestedAgents) || requestedAgents.length < 2 ||
        requestedAgents.length > agents.length || new Set(requestedAgents).size !== requestedAgents.length)) {
      fail(400, "Select distinct Agents in workflow order");
    }
    requestedAgents?.forEach(agent);
    const chosenAgent = body.agent == null ? requestedAgents?.[0] ?? null : agent(body.agent);
    if (requestedAgents && chosenAgent !== requestedAgents[0]) fail(400, "Select the first Agent in workflow order");
    const targetId = body.targetBotId == null ? null : id(body.targetBotId);
    if (targetId === bot.id) fail(400, "Choose another Bot");
    if (targetId) {
      // Lock in ID order when a message spans two conversations.
      await db.query("SELECT id FROM bots WHERE id=ANY($1::uuid[]) ORDER BY id FOR NO KEY UPDATE", [[bot.id, targetId]]);
    }
    const target = targetId && await visibleBot(db, owner, targetId, access.memberships);
    if (target && (target.graph_id !== bot.graph_id ||
        bot.shared_graph_id && target.shared_graph_id !== bot.shared_graph_id)) fail(404, "Bot not found");
    const handoff = target ? {target_id: target.id, target_name: target.name} : null;
    const proposal = sessionId || files.length || target || requestedAgents ? null
      : weeklyProposal(prompt, body.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, chosenAgent);
    if (proposal) {
      try { new Intl.DateTimeFormat("en", {timeZone: proposal.timeZone}); }
      catch { fail(400, "Invalid time zone"); }
    }
    const message = await insertMessage(db, bot.id, sessionId, messageId, "user", prompt, {
      attachments: files, handoff, actor: owner, requestedAgent: chosenAgent, requestedAgents,
    });
    if (!message) {
      const {rows: [existing]} = await db.query(
        "SELECT * FROM messages WHERE id=$1 AND bot_id=$2 AND session_id IS NOT DISTINCT FROM $3::uuid",
        [messageId, bot.id, sessionId]);
      if (!existing || existing.author !== "user" || existing.body !== prompt || (existing.handoff?.target_id ?? null) !== targetId ||
          (existing.actor ?? bot.owner) !== owner || (existing.actor && existing.requested_agent !== chosenAgent) ||
          JSON.stringify(existing.requested_agents) !== JSON.stringify(requestedAgents) ||
          existing.attachments.length !== files.length ||
          existing.attachments.some((file, index) => file.id !== files[index].id || file.name !== files[index].name)) fail(409, "Message identifier already in use");
      const {rows: [existingSession]} = await db.query(
        "SELECT id FROM sessions WHERE root_message_id=$1", [messageId]);
      return {message: existing, sessionId: sessionId ?? existingSession?.id ?? null};
    }
    if (files.length) {
      const updated = await db.query(
        `UPDATE bot_uploads SET message_id=$1 WHERE id=ANY($2::uuid[])
           AND bot_id=$3 AND owner=$4 AND message_id IS NULL`,
        [messageId, files.map(file => file.id), bot.id, owner]);
      if (updated.rowCount !== files.length) fail(409, "An attachment is unavailable");
    }
    const taskAgent = chosenAgent ?? (!target ? session?.agent : null);
    const available = await access.available(target || bot);
    if (taskAgent) (requestedAgents ?? [taskAgent]).forEach(name => configuredAgent(available, name));
    if (session && !target && taskAgent) {
      const binding = await db.query(`SELECT 1 FROM bot_thread_agents binding
        JOIN bot_runners device ON device.id=binding.runner_id WHERE binding.session_id=$1
          AND binding.agent=ANY($2::text[]) AND device.revoked_at IS NOT NULL LIMIT 1`,
      [session.id, requestedAgents ?? [taskAgent]]);
      if (binding.rowCount) fail(409, "The original device was unpaired. Start a new task in the Bot chat.");
    }
    const workflow = rootId => requestedAgents ? {workflowRootId: rootId, remainingAgents: requestedAgents.slice(1)} : undefined;
    if (target) {
      const receivedId = randomUUID();
      const copies = files.map(file => ({...file, id: randomUUID()}));
      await insertMessage(db, target.id, null, receivedId, "bot", prompt, {
        attachments: copies, actor: owner, requestedAgent: chosenAgent, requestedAgents,
        handoff: {source_id: bot.id, source_name: bot.name, source_message_id: messageId},
      });
      for (const [index, file] of copies.entries()) {
        await db.query(`INSERT INTO bot_uploads (id,bot_id,owner,payload,message_id)
           SELECT $1,$2,$3,payload,$4 FROM bot_uploads WHERE id=$5`,
          [file.id, target.id, owner, receivedId, files[index].id]);
      }
      if (taskAgent) await newSession(db, target, receivedId,
        prompt || files.map(file => file.name).join(", "), taskAgent, workflow(receivedId));
    } else if (sessionId) {
      await enqueueRun(db, messageId, sessionId, taskAgent, workflow(messageId));
      await db.query("UPDATE sessions SET status=CASE WHEN status='running' THEN status ELSE 'queued' END,updated_at=now() WHERE id=$1", [sessionId]);
    } else if (proposal) {
      await insertMessage(db, bot.id, null, randomUUID(), "bot", "Create a weekly automation?", {proposal});
    } else if (chosenAgent) {
      sessionId = await newSession(db, bot, messageId, prompt || files.map(file => file.name).join(", "), chosenAgent, workflow(messageId));
    } else if (/(进展|状态|status|progress)/i.test(prompt)) {
      const {rows} = await db.query("SELECT title,status FROM sessions WHERE bot_id=$1 ORDER BY updated_at DESC LIMIT 5",
        [bot.id]);
      const reply = rows.length ? rows.map(row => `${row.title} · ${row.status}`).join("\n") : "No sessions yet.";
      await insertMessage(db, bot.id, null, randomUUID(), "bot", reply);
    }
    return {message, sessionId};
  });
}

async function route(pool, owner, request, access) {
  const url = new URL(request.url);
  const [base, botKey, resource, itemKey, action, extra] = url.pathname.slice(1).split("/");
  const method = request.method;
  if (base !== "bots" || extra || !["GET", "POST", "PATCH", "PUT"].includes(method)) fail(404, "Not found");
  if (botKey === "runners") return manageRunners(pool, owner, request, resource, itemKey, action, access.onlineRunners);

  if (!botKey && method === "GET") {
    const {rows: bots} = await pool.query(
      `SELECT bots.*, left(preview.body,300) AS preview FROM bots
       LEFT JOIN LATERAL (SELECT body,created_at FROM messages WHERE bot_id=bots.id
         ORDER BY seq DESC LIMIT 1) preview ON true
       WHERE graph_id=ANY($2::uuid[]) AND (owner=$1 OR shared_graph_id=graph_id)
       ORDER BY coalesce(preview.created_at,bots.created_at) DESC,bots.id`, [owner, access.memberships]);
    const decisions = await Promise.all(access.memberships.map(graph => access.canShare(graph)));
    return {bots, graphIds: access.memberships, agents: await access.available(),
      shareableGraphs: access.memberships.filter((_, index) => decisions[index])};
  }
  if (!botKey && method === "POST") {
    const body = await jsonBody(request);
    const botId = id(body.id);
    if (typeof body.graphId !== "string") fail(400, "Select a Graph for the Bot");
    const graph = id(body.graphId);
    if (!access.memberships.includes(graph)) fail(403, "You do not have access to this Graph");
    const {rows: [existing]} = await pool.query("SELECT * FROM bots WHERE id=$1 AND owner=$2", [botId, owner]);
    if (existing) {
      if (existing.graph_id !== graph) fail(409, "This Bot already belongs to another Graph");
      return {bot: existing};
    }
    const shared = body.sharedGraphId ? id(body.sharedGraphId) : null;
    const repo = repository(body.repository);
    if (shared && shared !== graph) fail(400, "Share the Bot with its own Graph");
    if (shared && !await access.canShare(shared)) fail(403, "This Graph cannot be shared");
    const {rows: [bot]} = await pool.query(
      `INSERT INTO bots (id,owner,name,default_agent,repository,graph_id,graph_block_id,shared_graph_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING RETURNING *`,
      [botId, owner, text(body.name, 120), defaultAgent(await access.available({owner, repository: repo}), body.defaultAgent), repo,
        graph, body.graphBlockId ? id(body.graphBlockId) : null, shared]);
    const saved = bot ?? await ownedBot(pool, owner, botId);
    if (saved.graph_id !== graph) fail(409, "This Bot already belongs to another Graph");
    return {bot: saved};
  }

  const bot = await visibleBot(pool, owner, id(botKey), access.memberships);
  const availableAgents = await access.available(bot);
  if (resource === "uploads" && itemKey && !action && method === "PUT") {
    return uploadAttachment(pool, owner, bot.id, id(itemKey), request);
  }
  if (!resource && method === "GET") {
    const {rows: sessions} = await pool.query(
      "SELECT * FROM sessions WHERE bot_id=$1 ORDER BY updated_at DESC,id LIMIT 100", [bot.id]);
    const {rows: automations} = await pool.query("SELECT * FROM bot_automations WHERE bot_id=$1 ORDER BY next_at", [bot.id]);
    return {bot, sessions, automations, agents: availableAgents, canManage: bot.owner === owner,
      mentionableBots: await visibleBots(pool, owner, access.memberships, bot), ...await messagePage(pool, bot.id, null, url)};
  }
  if (!resource && method === "PATCH") {
    const body = await jsonBody(request);
    if (bot.owner !== owner) fail(403, "Only the Bot owner can change its settings");
    const shared = !Object.hasOwn(body, "sharedGraphId") ? bot.shared_graph_id
      : body.sharedGraphId ? id(body.sharedGraphId) : null;
    if (shared && shared !== bot.graph_id) fail(400, "Share the Bot with its own Graph");
    if (shared && shared !== bot.shared_graph_id && !await access.canShare(shared)) fail(403, "This Graph cannot be shared");
    const chosen = Object.hasOwn(body, "defaultAgent") ? defaultAgent(availableAgents, body.defaultAgent) : bot.default_agent;
    const {rows: [updated]} = await pool.query(
      "UPDATE bots SET default_agent=$1,shared_graph_id=$2 WHERE id=$3 AND owner=$4 RETURNING *",
      [chosen, shared, bot.id, owner]);
    return {bot: updated};
  }
  if (resource === "messages" && !itemKey && method === "POST") {
    return sendMessage(pool, owner, bot, null, await jsonBody(request), access);
  }
  if (resource === "sessions" && itemKey) {
    let session = await sessionById(pool, bot.id, id(itemKey));
    if (!action && method === "GET") {
      if (!url.searchParams.has("before") && await access.refreshThread(bot, session)) {
        session = await sessionById(pool, bot.id, session.id);
      }
      const {rows: [root]} = await pool.query("SELECT * FROM messages WHERE id=$1", [session.root_message_id]);
      const {rows: engaged} = await pool.query(
        `SELECT COALESCE(agent,$2) AS name FROM bot_runs WHERE session_id=$1 GROUP BY 1 ORDER BY min(seq)`,
        [session.id, session.agent]);
      return {session, root, bot, participants: engaged.map(item => item.name), agents: availableAgents,
        mentionableBots: await visibleBots(pool, owner, access.memberships, bot), ...await messagePage(pool, bot.id, session.id, url)};
    }
    if (action === "messages" && method === "POST") {
      return sendMessage(pool, owner, bot, session.id, await jsonBody(request), access);
    }
  }
  if (resource === "automations" && !itemKey && method === "POST") {
    if (bot.owner !== owner) fail(403, "Only the Bot owner can change automations");
    const body = await jsonBody(request);
    const values = [body.weekday, body.hour, body.minute];
    if (values.some((value, index) => !Number.isInteger(value) || value < 0 || value > [6, 23, 59][index])) {
      fail(400, "Invalid automation time");
    }
    const selectedAgent = configuredAgent(availableAgents, body.agent ?? bot.default_agent);
    const rule = {weekday: body.weekday, hour: body.hour, minute: body.minute, timeZone: text(body.timeZone, 80)};
    let next;
    try { next = nextWeekly(rule); } catch { fail(400, "Invalid automation time zone or occurrence"); }
    await pool.query(
      `INSERT INTO bot_automations (id,bot_id,prompt,weekday,hour,minute,time_zone,agent,next_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [id(body.id), bot.id, text(body.prompt, 12000), body.weekday, body.hour, body.minute,
        rule.timeZone, body.agent == null ? null : selectedAgent, next]);
    return {saved: true};
  }
  if (resource === "automations" && itemKey && !action && method === "PATCH") {
    if (bot.owner !== owner) fail(403, "Only the Bot owner can change automations");
    const body = await jsonBody(request);
    if (typeof body.enabled !== "boolean") fail(400, "Invalid automation state");
    const update = await pool.query("UPDATE bot_automations SET enabled=$1 WHERE id=$2 AND bot_id=$3",
      [body.enabled, id(itemKey), bot.id]);
    if (!update.rowCount) fail(404, "Automation not found");
    return {saved: true};
  }
  fail(404, "Not found");
}

async function enqueueScheduled(pool, availableAgents) {
  return transaction(pool, async db => {
    const {rows: [rule]} = await db.query(
      `SELECT * FROM bot_automations WHERE enabled AND next_at<=now()
       ORDER BY next_at,id LIMIT 1 FOR UPDATE SKIP LOCKED`);
    if (!rule) return false;
    const {rows: [bot]} = await db.query("SELECT * FROM bots WHERE id=$1", [rule.bot_id]);
    const messageId = randomUUID();
    const name = rule.agent ?? bot.default_agent;
    if (hasAgent(await availableAgents(bot.owner, bot.repository), name)) {
      await insertMessage(db, bot.id, null, messageId, "bot", rule.prompt);
      await newSession(db, bot, messageId, rule.prompt, name, {automation: true});
    } else {
      await insertMessage(db, bot.id, null, messageId, "bot",
        "An automation was skipped because its Agent is no longer configured.");
    }
    const next = nextWeekly({...rule, timeZone: rule.time_zone}, Math.max(Date.now(), Number(rule.next_at)));
    await db.query("UPDATE bot_automations SET next_at=$1 WHERE id=$2", [next, rule.id]);
    return true;
  });
}

const hash = value => createHash("sha256").update(value).digest();

async function retireRunner(db, runnerId, owner) {
  const result = await db.query(`UPDATE bot_runners SET revoked_at=COALESCE(revoked_at,now())
    WHERE id=$1 AND owner=$2`, [runnerId, owner]);
  if (!result.rowCount) fail(404, "Device not found");
  await db.query("UPDATE bot_runs SET lease_until=now() WHERE runner_id=$1 AND lease_until IS NOT NULL", [runnerId]);
  await db.query(`WITH unavailable AS (
    UPDATE bot_runs r SET state='attention' FROM bot_thread_agents binding
    WHERE r.session_id=binding.session_id AND r.agent=binding.agent AND binding.runner_id=$1
      AND r.state='queued' RETURNING r.session_id
  ) UPDATE sessions SET status='attention',updated_at=now()
    WHERE status='queued' AND id IN (SELECT session_id FROM unavailable)`, [runnerId]);
}

async function manageRunners(pool, owner, request, resource, itemKey, action, onlineRunners) {
  if (!resource && request.method === "GET") {
    const {rows} = await pool.query(`SELECT id,name,agents,repository,
      COALESCE(repositories, array_remove(ARRAY[repository], '')) AS repositories,has_default_workspace,seen_at,
      seen_at>now()-interval '75 seconds' AS online FROM bot_runners
      WHERE owner=$1 AND revoked_at IS NULL ORDER BY created_at`, [owner]);
    const connected = new Set(await onlineRunners?.(owner));
    return {runners: rows.map(row => ({...row, online: row.online || connected.has(row.id)}))};
  }
  if (!resource && request.method === "POST") {
    const body = await jsonBody(request);
    if (!Array.isArray(body.agents) || body.agents.length < 1 || body.agents.length > localAgentNames.length ||
        new Set(body.agents).size !== body.agents.length || !body.agents.every(name => localAgentNames.includes(name))) {
      fail(400, "Choose the local Agents on this device");
    }
    const deviceId = randomUUID();
    const credential = deviceId + "." + randomBytes(32).toString("base64url");
    const workspaces = body.workspaces == null ? null : runnerWorkspaces(body.workspaces);
    await pool.query(`INSERT INTO bot_runners (id,owner,name,token_hash,agents,repository,repositories,has_default_workspace,seen_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'-infinity')`,
    [deviceId, owner, text(body.name, 120), hash(credential), body.agents, repository(body.repository),
      workspaces?.repositories ?? null, workspaces?.hasDefaultWorkspace ?? true]);
    return {id: deviceId, credential};
  }
  if (resource && itemKey === "revoke" && !action && request.method === "POST") {
    return transaction(pool, async db => {
      await retireRunner(db, id(resource), owner);
      return {revoked: true};
    });
  }
  fail(404, "Not found");
}

async function expireLeases(pool, recoverServerWork = false) {
  await pool.query(`WITH expired AS (
    UPDATE bot_runs r SET state=CASE
      WHEN r.state='working' AND r.runner_id IS NULL AND r.work_from='poll' THEN 'poll'
      WHEN r.state='leased' AND NOT EXISTS (
        SELECT 1 FROM bot_thread_agents binding JOIN bot_runners device ON device.id=binding.runner_id
          WHERE binding.session_id=r.session_id AND binding.agent=r.agent AND device.revoked_at IS NOT NULL
      ) THEN 'queued'
      ELSE 'attention' END,
      runner_id=CASE WHEN r.state='leased' THEN NULL ELSE r.runner_id END,
      lease_until=NULL,lease_id=NULL,work_from=NULL
    WHERE state IN ('leased','working') AND
      (lease_until<=now() OR $1 AND state='working' AND runner_id IS NULL)
    RETURNING session_id,state
  ) UPDATE sessions SET status='attention',updated_at=now()
    WHERE id IN (SELECT session_id FROM expired WHERE state='attention')`, [recoverServerWork]);
}

async function lookupRunner(db, request, lock = false) {
  const credential = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9-]{36}\.[A-Za-z0-9_-]{43})$/)?.[1];
  const runnerId = credential?.slice(0, 36);
  if (!runnerId || !uuid.test(runnerId)) return null;
  const {rows: [runner]} = await db.query(`SELECT id,owner,agents,repository,
    COALESCE(repositories, array_remove(ARRAY[repository], '')) AS repositories,
    has_default_workspace AS "hasDefaultWorkspace" FROM bot_runners
    WHERE id=$1 AND token_hash=$2 AND revoked_at IS NULL ${lock ? "FOR UPDATE" : ""}`, [runnerId, hash(credential)]);
  return runner;
}

function validAcpAgents(runner, agents) {
  return Array.isArray(agents) && agents.length <= localAgentNames.length
    && agents.every(agent => runner.agents.includes(agent) && localAgentNames.includes(agent));
}

async function runnerRoute(pool, request, canExport, notifyRevoked) {
  const path = new URL(request.url).pathname;
  const runPath = path.match(/^\/bots\/runner\/runs\/([^/]+)\/(start|renew|complete|attachments)(?:\/([^/]+))?$/);
  let revoked;
  const response = await transaction(pool, async db => {
    const runner = await lookupRunner(db, request, true);
    if (!runner) fail(401, "Invalid device credential");
    const runnerId = runner.id;
    if (!isRunnerRequest(request)) {
      await db.query("UPDATE bot_runners SET seen_at=now() WHERE id=$1 AND seen_at<now()-interval '10 seconds'", [runnerId]);
    }
    if (path === "/bots/runner/revoke" && request.method === "POST") {
      await retireRunner(db, runnerId, runner.owner);
      revoked = runner;
      return Response.json({revoked: true});
    }
    if (path === "/bots/runner/workspaces" && request.method === "PUT") {
      const {repositories, hasDefaultWorkspace} = runnerWorkspaces(await jsonBody(request));
      await db.query(`UPDATE bot_runners SET repositories=$2,has_default_workspace=$3 WHERE id=$1
        AND (repositories IS DISTINCT FROM $2 OR has_default_workspace IS DISTINCT FROM $3)`,
      [runnerId, repositories, hasDefaultWorkspace]);
      return Response.json({saved: true});
    }
    if (path === "/bots/runner/claim" && request.method === "POST") {
      const body = await jsonBody(request, {allowEmpty: true});
      const acpAgents = body.acpAgents ?? [];
      if (!validAcpAgents(runner, acpAgents)) {
        fail(400, "Invalid ACP capabilities");
      }
      const active = await db.query(`SELECT 1 FROM bot_runs WHERE runner_id=$1 AND lease_until>now()
        AND state IN ('leased','working') LIMIT 1`, [runnerId]);
      if (active.rowCount) return Response.json({job: null});
      const workspace = body.workspaces == null
        ? {repositories: runner.repository ? [runner.repository] : [], hasDefaultWorkspace: true}
        : runnerWorkspaces(body.workspaces);
      const repositories = workspace.repositories.filter(name => runner.repositories.includes(name));
      const hasDefaultWorkspace = runner.hasDefaultWorkspace && workspace.hasDefaultWorkspace;
      const job = await claim(db, {...runner, acpAgents, repositories, hasDefaultWorkspace}, []);
      if (!job) return Response.json({job: null});
      const context = await withThreadContext(db, job);
      const providerTransport = job.provider_transport ??
        (job.provider_session_id || !acpAgents.includes(job.agent) ? "cli" : "acp-v1");
      return Response.json({job: {
        id: job.message_id, lease: job.lease_id, agent: job.agent, session_id: job.session_id,
        repository: job.repository, prompt: context.prompt, provider_session_id: job.provider_session_id,
        provider_transport: providerTransport,
        previous_turn: job.previous_turn,
        attachments: job.attachments, graph_id: job.graph_id ?? job.shared_graph_id,
        leaseExpiresAt: job.lease_until.getTime(),
      }});
    }
    if (!runPath) fail(404, "Not found");
    const [, runId, action, file] = runPath;
    const leaseId = id(request.headers.get("x-logseq-lease"));
    const {rows: [job]} = await db.query(`SELECT r.*,r.lease_until>now() AS lease_valid,
      COALESCE(r.agent,s.agent) AS agent,s.agent AS primary_agent,s.bot_id,
      b.owner,b.graph_id,b.graph_block_id FROM bot_runs r
      JOIN sessions s ON r.session_id=s.id JOIN bots b ON s.bot_id=b.id
      WHERE r.message_id=$1 AND r.runner_id=$2 AND r.lease_id=$3 FOR UPDATE OF r`, [id(runId), runnerId, leaseId]);
    if (!job) fail(409, "This device no longer holds the job");
    if (action === "attachments" && file && request.method === "GET") {
      if (!job.lease_valid || !["leased", "working"].includes(job.state)) fail(409, "The job lease expired");
      const {rows: [attachment]} = await db.query(`SELECT payload FROM bot_uploads
        WHERE id=$1 AND message_id=$2 AND bot_id=$3`, [id(file), job.workflow_root_id ?? job.message_id, job.bot_id]);
      if (!attachment) fail(404, "Attachment not found");
      return new Response(attachment.payload, {headers: {"content-type": "application/octet-stream"}});
    }
    if (file || request.method !== "POST") fail(404, "Not found");
    if (action === "complete") {
      const body = await jsonBody(request);
      if (!["done", "failed", "attention", "needs_input"].includes(body.state)) fail(400, "Invalid job result");
      const result = {state: body.state, reply: text(body.reply, 24000),
        providerSessionId: body.providerSessionId == null ? null : text(body.providerSessionId, 200)};
      if (Object.hasOwn(body, "providerTransport")) {
        if (body.providerTransport !== "acp-v1" || !result.providerSessionId) fail(400, "Invalid ACP session binding");
        result.providerTransport = body.providerTransport;
      }
      const digest = hash(JSON.stringify(result));
      if (job.result_hash?.equals(digest)) return Response.json({accepted: true});
      if (!job.lease_valid || job.state !== "working") fail(409, "The job lease expired");
      await settleJob(db, job, result, canExport);
      await db.query("UPDATE bot_runs SET lease_until=NULL,result_hash=$1 WHERE message_id=$2", [digest, job.message_id]);
      return Response.json({accepted: true});
    }
    if (!job.lease_valid || (action === "start" ? !["leased", "working"].includes(job.state) : job.state !== "working")) {
      fail(409, "The job lease expired");
    }
    await db.query(`UPDATE bot_runs SET state='working',lease_until=now()+make_interval(secs=>$1)
      WHERE message_id=$2`, [leaseSeconds, job.message_id]);
    if (action === "start" && job.state === "leased") {
      await db.query("UPDATE sessions SET status='running',updated_at=now() WHERE id=$1", [job.session_id]);
    }
    return Response.json({accepted: true});
  });
  if (revoked) await notifyRevoked(revoked.owner, revoked.id);
  return response;
}

async function claim(db, runner, localProviders, localProviderOwner = null, {
  nextOnly = false, workLeaseSeconds = 180,
} = {}) {
  const {rows: [job]} = await db.query(
    `SELECT ${nextOnly ? "r.due_at" : `r.*,COALESCE(r.agent,s.agent) AS agent,s.agent AS primary_agent,s.repository,s.bot_id,s.root_message_id,
            binding.provider_session_id,binding.provider_transport,binding.provider_url,binding.provider_cursor AS session_cursor,
            COALESCE(root.body,m.body) AS prompt,m.seq AS message_seq,m.created_at AS message_created_at,
            COALESCE(root.attachments,m.attachments) AS attachments,m.actor,root.requested_agents AS workflow_agents,
            b.graph_id,b.graph_block_id,b.owner,b.shared_graph_id,
            EXISTS (SELECT 1 FROM bot_runs earlier WHERE earlier.session_id=r.session_id AND earlier.message_id<>r.message_id
              AND earlier.state IN ('done','failed','needs_input','attention')
              AND COALESCE(earlier.agent,s.agent)=COALESCE(r.agent,s.agent)) AS previous_turn`}
       FROM bot_runs r JOIN sessions s ON s.id=r.session_id
       LEFT JOIN bot_thread_agents binding ON binding.session_id=s.id AND binding.agent=COALESCE(r.agent,s.agent)
       JOIN messages m ON m.id=r.message_id JOIN bots b ON b.id=s.bot_id
       LEFT JOIN messages root ON root.id=r.workflow_root_id
       LEFT JOIN bot_runs first ON first.message_id=r.workflow_root_id
       WHERE r.state IN ('queued','poll') ${nextOnly ? "" : "AND r.due_at<=now()"}
         AND CASE WHEN $1::uuid IS NULL THEN
           NOT (COALESCE(r.agent,s.agent)=ANY($2::text[])) OR (
             COALESCE(r.agent,s.agent)=ANY($3::text[]) AND binding.runner_id IS NULL
             AND ($7::text IS NULL OR b.owner=$7)
             AND (binding.provider_session_id IS NOT NULL OR NOT EXISTS (
               SELECT 1 FROM bot_runners d WHERE d.owner=b.owner AND d.revoked_at IS NULL
               AND ((s.repository='' AND d.has_default_workspace) OR
                 (s.repository<>'' AND s.repository=ANY(COALESCE(d.repositories, ARRAY[d.repository]))))
               AND COALESCE(r.agent,s.agent)=ANY(d.agents)
               AND (m.actor IS NULL OR m.actor=b.owner))))
         ELSE r.state='queued' AND b.owner=$4 AND (m.actor IS NULL OR m.actor=b.owner)
           AND COALESCE(r.agent,s.agent)=ANY($5::text[])
           AND ((s.repository='' AND $9) OR (s.repository<>'' AND s.repository=ANY($6::text[])))
           AND (binding.runner_id=$1 OR binding.runner_id IS NULL AND binding.provider_session_id IS NULL)
           AND (binding.provider_transport IS DISTINCT FROM 'acp-v1' OR COALESCE(r.agent,s.agent)=ANY($8::text[]))
         END
         AND NOT EXISTS (
           SELECT 1 FROM bot_runs earlier LEFT JOIN bot_runs earlier_first ON earlier_first.message_id=earlier.workflow_root_id
             WHERE earlier.session_id=r.session_id AND earlier.state NOT IN ('done','failed','needs_input','attention')
               AND (COALESCE(earlier_first.seq,earlier.seq),earlier.seq)<(COALESCE(first.seq,r.seq),r.seq))
       ORDER BY r.due_at,r.seq LIMIT 1 ${nextOnly ? "" : "FOR UPDATE OF r SKIP LOCKED"}`,
    [runner?.id ?? null, localAgentNames, localProviders, runner?.owner ?? null, runner?.agents ?? [],
      runner?.repositories ?? [], localProviderOwner, runner?.acpAgents ?? [], runner?.hasDefaultWorkspace ?? false]);
  if (!job) return null;
  if (nextOnly) return job.due_at;
  if (runner) {
    const lease = randomUUID();
    const {rows: [updated]} = await db.query(`UPDATE bot_runs SET state='leased',runner_id=$1,lease_id=$2,
      lease_until=now()+make_interval(secs=>$3) WHERE message_id=$4 RETURNING lease_until`,
    [runner.id, lease, leaseSeconds, job.message_id]);
    return {...job, ...updated, runner_id: runner.id, lease_id: lease, provider_cursor: job.session_cursor};
  }
  const lease = randomUUID();
  await db.query(`UPDATE bot_runs SET state='working',work_from=state,lease_id=$2,
    lease_until=now()+make_interval(secs=>$3) WHERE message_id=$1`, [job.message_id, lease, workLeaseSeconds]);
  await db.query("UPDATE sessions SET status='running',updated_at=now() WHERE id=$1", [job.session_id]);
  return {...job, lease_id: lease, provider_cursor: job.provider_cursor ?? job.session_cursor};
}

async function withThreadContext(pool, job) {
  const step = job.workflow_agents ? job.workflow_agents.indexOf(job.agent) + 1 : 0;
  const prompt = step > 0 ? `Logseq workflow step ${step} of ${job.workflow_agents.length}. You are ${job.agent}. ` +
    "Complete only your assigned part, using earlier replies as context. Logseq will dispatch the remaining steps.\n\n" +
    job.prompt : job.prompt;
  const {rows} = await pool.query(
    `WITH peer_runs AS (
       SELECT message_id FROM bot_runs WHERE session_id=$1 AND seq<$2
         AND COALESCE(agent,$3)<>$4 AND state IN ('done','needs_input','failed','attention')
     )
     SELECT author,left(body,1200) AS body FROM messages m
       WHERE m.bot_id=$5 AND (m.session_id=$1 OR m.id=$6) AND EXISTS (SELECT 1 FROM peer_runs)
         AND m.body<>'' AND (m.seq<$7 OR m.in_reply_to IN (SELECT message_id FROM peer_runs))
       ORDER BY m.seq DESC LIMIT 12`,
    [job.session_id, job.seq, job.primary_agent, job.agent, job.bot_id, job.root_message_id, job.message_seq]);
  if (!rows.length) return {...job, prompt};
  return {...job, prompt: "Recent messages from the shared Logseq thread, for context only:\n"
    + JSON.stringify(rows.reverse()) + "\n\nCurrent request:\n" + prompt};
}

async function reserveDevinStart(pool, job, limits) {
  return transaction(pool, async db => {
    await db.query("SELECT pg_advisory_xact_lock(35927682)");
    const {rows: [usage]} = await db.query(`SELECT count(*)::integer AS starts,
      EXISTS (SELECT 1 FROM bot_devin_starts started JOIN sessions s ON s.id=started.session_id
        JOIN bot_runs r ON s.id=r.session_id
        WHERE COALESCE(r.agent,s.agent)='devin' AND s.id<>$1 AND r.state IN ('working','poll')) AS active
      FROM bot_devin_starts WHERE started_at>now()-interval '24 hours'`, [job.session_id]);
    if (usage.active) return "busy";
    if (usage.starts >= limits.dailyStarts) return "limit";
    const reservation = await db.query(
      "INSERT INTO bot_devin_starts (session_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING session_id",
      [job.session_id]);
    return reservation.rowCount ? "allowed" : "duplicate";
  });
}

async function settle(pool, job, result, canExport) {
  return transaction(pool, async db => {
    const active = await db.query(`SELECT 1 FROM bot_runs WHERE message_id=$1 AND lease_id=$2
      AND state='working' AND runner_id IS NULL AND lease_until>now() FOR UPDATE`, [job.message_id, job.lease_id]);
    if (!active.rowCount) return false;
    await settleJob(db, job, result, canExport);
    await db.query("UPDATE bot_runs SET lease_id=NULL,lease_until=NULL,work_from=NULL WHERE message_id=$1", [job.message_id]);
    return true;
  });
}

async function settleJob(db, job, result, canExport) {
  if (result.messages?.length) {
    for (const message of result.messages) {
      await insertMessage(db, job.bot_id, job.session_id, randomUUID(), message.author, message.body,
        {replyTo: job.message_id});
    }
  } else if (result.reply) {
    await insertMessage(db, job.bot_id, job.session_id, randomUUID(), job.agent, result.reply, {replyTo: job.message_id});
  }
  const summary = result.reply || job.last_reply;
  const [nextAgent, ...remainingAgents] = job.remaining_agents;
  if (result.state === "done" && nextAgent) {
    const messageId = randomUUID();
    await insertMessage(db, job.bot_id, job.session_id, messageId, "bot", "", {
      actor: job.actor, requestedAgent: nextAgent, replyTo: job.message_id,
    });
    await enqueueRun(db, messageId, job.session_id, nextAgent, {
      workflowRootId: job.workflow_root_id, remainingAgents,
    });
  }
  if (result.state === "done" && summary) {
    if (job.automation) {
      await insertMessage(db, job.bot_id, null, randomUUID(), "bot", summary);
    }
    if (!nextAgent && canExport(job)) {
      const url = result.url ?? job.provider_url;
      const title = `${summary.slice(0, 6000)}${url ? "\n" + url : ""}`;
      await db.query(`INSERT INTO bot_graph_exports (id,owner,graph_id,block_id,title)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [job.message_id, job.owner, job.graph_id, job.graph_block_id, title]);
    }
  }
  if (result.providerSessionId || result.url || result.cursor || job.runner_id && result.state === "done") {
    await db.query(
      `INSERT INTO bot_thread_agents (session_id,agent,provider_session_id,provider_url,provider_cursor,runner_id,provider_transport)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (session_id,agent) DO UPDATE SET
       provider_session_id=COALESCE(excluded.provider_session_id,bot_thread_agents.provider_session_id),
       provider_url=COALESCE(excluded.provider_url,bot_thread_agents.provider_url),
       provider_cursor=COALESCE(excluded.provider_cursor,bot_thread_agents.provider_cursor),
       runner_id=COALESCE(excluded.runner_id,bot_thread_agents.runner_id),
       provider_transport=COALESCE(excluded.provider_transport,bot_thread_agents.provider_transport)`,
      [job.session_id, job.agent, result.providerSessionId ?? null, result.url ?? null,
        result.cursor ?? null, job.runner_id ?? null, result.providerTransport ?? null]);
  }
  const status = result.state === "done" ? "completed" : result.state === "poll" ? "running" : result.state;
  const primary = job.agent === job.primary_agent;
  await db.query(
    `UPDATE sessions SET status=CASE WHEN $1 <> 'running' AND EXISTS (
       SELECT 1 FROM bot_runs WHERE session_id=$5 AND message_id<>$6 AND state IN ('queued','leased','working','poll')
     ) THEN 'queued' ELSE $1 END,
     provider_session_id=COALESCE($2,provider_session_id),provider_url=COALESCE($3,provider_url),
     provider_cursor=COALESCE($4,provider_cursor),updated_at=now() WHERE id=$5`,
    [status, primary ? result.providerSessionId ?? null : null,
      primary ? result.url ?? null : null, primary ? result.cursor ?? null : null, job.session_id, job.message_id]);
  await db.query(`UPDATE bot_runs SET state=$1,due_at=now()+make_interval(secs=>$4),provider_cursor=$2,
    last_reply=COALESCE($5,last_reply) WHERE message_id=$3`,
    [result.state, result.cursor ?? job.provider_cursor, job.message_id, result.pollDelay ?? 3, result.reply || null]);
}

const idleThread = `NOT EXISTS (SELECT 1 FROM bot_runs WHERE session_id=$1
  AND state IN ('queued','working','leased','poll'))`;

async function refreshDevinThread(pool, readDevin, bot, session) {
  const {rows: [binding]} = await pool.query(`SELECT provider_session_id,provider_cursor FROM bot_thread_agents
    WHERE session_id=$1 AND agent='devin' AND provider_session_id IS NOT NULL AND ${idleThread}`, [session.id]);
  if (!binding) return false;
  const result = await readDevin({...binding, state: "poll", readOnly: true});
  if (result.cursor === binding.provider_cursor) return false;
  return transaction(pool, async db => {
    await db.query("SELECT id FROM bots WHERE id=$1 FOR NO KEY UPDATE", [bot.id]);
    const update = await db.query(`UPDATE bot_thread_agents SET provider_cursor=$2
      WHERE session_id=$1 AND agent='devin' AND provider_session_id=$3
        AND provider_cursor IS NOT DISTINCT FROM $4 AND ${idleThread}`,
    [session.id, result.cursor, binding.provider_session_id, binding.provider_cursor]);
    if (!update.rowCount) return false;
    for (const message of result.messages) {
      await insertMessage(db, bot.id, session.id, randomUUID(), message.author, message.body);
    }
    if (session.agent === "devin" || result.messages.length) {
      await db.query(`UPDATE sessions SET provider_cursor=CASE WHEN agent='devin' THEN $2 ELSE provider_cursor END,
        updated_at=CASE WHEN $3 THEN now() ELSE updated_at END WHERE id=$1`,
      [session.id, result.cursor, result.messages.length > 0]);
    }
    return result.messages.length > 0;
  });
}

async function exportGraph(pool, env, graphFetch = fetch) {
  if (!env.LOGSEQ_BOTS_GRAPH_TOKEN || !env.DB_SYNC_BASE_URL) return false;
  const {rows: [item]} = await pool.query(
    `UPDATE bot_graph_exports SET due_at=now()+interval '30 seconds' WHERE id=(
      SELECT id FROM bot_graph_exports WHERE state='queued' AND due_at<=now()
        AND owner=$1 AND graph_id::text=$2 ORDER BY due_at LIMIT 1 FOR UPDATE SKIP LOCKED
    ) RETURNING *`,
    [env.LOGSEQ_BOTS_GRAPH_OWNER ?? "", env.LOGSEQ_BOTS_GRAPH_ID ?? ""]);
  if (!item) return false;
  const path = `/api/v1/graphs/${item.graph_id}/blocks/${item.block_id}/children`;
  try {
    const response = await graphFetch(new URL(path, env.DB_SYNC_BASE_URL), {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(7000),
      headers: {authorization: `Bearer ${env.LOGSEQ_BOTS_GRAPH_TOKEN}`, "content-type": "application/json"},
      body: JSON.stringify({position: "append", blocks: [{uuid: item.id, title: item.title}]}),
    });
    if (response.ok) {
      await pool.query("UPDATE bot_graph_exports SET state='done' WHERE id=$1", [item.id]);
    } else if (response.status < 500 && response.status !== 429) {
      await pool.query("UPDATE bot_graph_exports SET state='failed' WHERE id=$1", [item.id]);
    } else {
      await pool.query("UPDATE bot_graph_exports SET due_at=now()+interval '30 seconds' WHERE id=$1", [item.id]);
    }
  } catch {
    await pool.query("UPDATE bot_graph_exports SET due_at=now()+interval '30 seconds' WHERE id=$1", [item.id]);
  }
  return true;
}

function createBotRuntime(pool, env, options = {}) {
  const providers = options.providers ?? cloudAgents(env);
  const unrestricted = (options.unrestricted ?? Boolean(options.providers)) || env.LOGSEQ_BOTS_MOCK === "1";
  const permitted = owner => unrestricted || owner === env.LOGSEQ_BOTS_AGENT_OWNER;
  const builtInAgents = owner => agents.map(name => ({name, available: permitted(owner) && Boolean(providers[name])}));
  const localProviders = localAgentNames.filter(name => providers[name]);
  const localProviderOwner = unrestricted ? null : env.LOGSEQ_BOTS_AGENT_OWNER ?? null;
  const availableAgents = async (owner, repo = null) => {
    const {rows} = await pool.query(`SELECT DISTINCT unnest(agents) AS agent FROM bot_runners
      WHERE owner=$1 AND revoked_at IS NULL AND ($2::text IS NULL OR ($2='' AND has_default_workspace) OR
        ($2<>'' AND $2=ANY(COALESCE(repositories, ARRAY[repository]))))`, [owner, repo]);
    const paired = new Set(rows.map(row => row.agent));
    return builtInAgents(owner).map(item => ({...item, available: item.available || paired.has(item.name)}));
  };
  const sharedAgents = new Set((env.LOGSEQ_BOTS_SHARED_AGENTS ?? "").split(",").map(value => value.trim()));
  const liveDevin = Boolean(providers.devin) && !unrestricted;
  const limits = devinLimits(env);
  const canExport = job => Boolean(env.LOGSEQ_BOTS_GRAPH_TOKEN && job.graph_block_id
    && job.owner === env.LOGSEQ_BOTS_GRAPH_OWNER && job.graph_id === env.LOGSEQ_BOTS_GRAPH_ID);
  const runProvider = async job => {
    const provider = permitted(job.owner) ? providers[job.agent] : null;
    if (!provider) return {state: "failed", reply: "This Agent is unavailable on the local server."};
    if (job.state !== "poll" && job.actor && job.actor !== job.owner) {
      const memberships = await options.graphsFor?.(job.actor) ?? [];
      if (!sharedAgents.has(job.agent) || !memberships.includes(job.shared_graph_id)) {
        return {state: "failed", reply: "This Agent is unavailable for this Graph member."};
      }
    }
    if (job.state !== "poll" && !job.provider_session_id && job.previous_turn) {
      return {state: "failed", reply: "The original Agent session did not start. Send a new task from the Bot chat."};
    }
    if (liveDevin && job.agent === "devin" && job.state !== "poll" && !job.provider_session_id) {
      if (job.automation && !limits.allowAutomation) {
        return {state: "failed", reply: "Automatic Devin dispatch is disabled on the local server."};
      }
      const reservation = await reserveDevinStart(pool, job, limits);
      if (reservation === "busy") return {state: "queued", pollDelay: 15};
      if (reservation === "limit") return {state: "failed", reply: "The server reached its 24-hour Devin session budget."};
      if (reservation === "duplicate") return {state: "attention", reply: "A Devin start was already attempted for this task."};
    }
    if (job.state !== "poll" && job.attachments.length) {
      const {rows} = await pool.query("SELECT id,payload FROM bot_uploads WHERE message_id=$1",
        [job.workflow_root_id ?? job.message_id]);
      const contents = new Map(rows.map(row => [row.id, row.payload]));
      job = {...job, files: job.attachments.map(file => ({...file, payload: contents.get(file.id)}))};
    }
    return provider(job.state === "poll" ? job : await withThreadContext(pool, job));
  };
  const work = async job => {
    let result;
    try {
      result = await runProvider(job);
    } catch {
      result = {state: "attention", reply: "The Agent response could not be confirmed. Check the upstream session before trying again."};
    }
    await settle(pool, job, result, canExport);
  };
  const cleanStaleUploads = () =>
    pool.query("DELETE FROM bot_uploads WHERE message_id IS NULL AND created_at < now() - interval '7 days'");
  const publish = options.publish;
  async function notifyRevoked(owner, runnerId) {
    try { await publish?.(owner, {type: "runner.revoked", runnerId}); }
    catch (error) { console.error("Bots device event failed", error.code ?? error.name); }
  }

  async function runnerWakes(sessions) {
    if (!sessions.length) return new Map();
    // Inspect the same head of each thread that claim can lease.
    const {rows} = await pool.query(`WITH head AS (
      SELECT DISTINCT ON (r.session_id) r.session_id,r.state,r.due_at,m.actor,
        COALESCE(r.agent,s.agent) AS agent,b.owner,s.repository,
        binding.runner_id,binding.provider_session_id,binding.provider_transport
      FROM bot_runs r JOIN sessions s ON s.id=r.session_id
      JOIN bots b ON b.id=s.bot_id JOIN messages m ON m.id=r.message_id
      LEFT JOIN bot_runs first ON first.message_id=r.workflow_root_id
      LEFT JOIN bot_thread_agents binding ON binding.session_id=r.session_id AND binding.agent=COALESCE(r.agent,s.agent)
      WHERE r.session_id=ANY($1::uuid[]) AND r.state IN ('queued','poll','leased','working')
      ORDER BY r.session_id,COALESCE(first.seq,r.seq),r.seq
    ) SELECT head.session_id,head.agent,head.provider_transport='acp-v1' AS acp_only,array_agg(d.id) AS runner_ids
      FROM head JOIN bot_runners d ON d.owner=head.owner AND d.revoked_at IS NULL
        AND ((head.repository='' AND d.has_default_workspace) OR
          (head.repository<>'' AND head.repository=ANY(COALESCE(d.repositories, ARRAY[d.repository]))))
        AND head.agent=ANY(d.agents)
        AND (head.runner_id=d.id OR head.runner_id IS NULL AND head.provider_session_id IS NULL)
      WHERE head.state='queued' AND head.due_at<=now() AND (head.actor IS NULL OR head.actor=head.owner)
        AND head.agent=ANY($2::text[])
      GROUP BY head.session_id,head.agent,head.provider_transport`, [sessions, localAgentNames]);
    return new Map(rows.map(row => [row.session_id, row]));
  }

  async function deliverEvents() {
    if (!publish) return;
    const {rows} = await pool.query(`WITH due AS (
      SELECT version FROM bot_events WHERE due_at<=now()
      ORDER BY due_at,version LIMIT 16 FOR UPDATE SKIP LOCKED
    ) UPDATE bot_events e SET attempts=e.attempts+1,
      due_at=now()+make_interval(secs=>LEAST(300, 5 * (2 ^ e.attempts)))
      FROM due,bots b WHERE e.version=due.version AND e.bot_id=b.id
      RETURNING e.version,e.bot_id,e.session_id,e.attempts,e.refresh_graph,b.owner,b.graph_id,b.shared_graph_id`);
    const wakes = await runnerWakes(rows.map(row => row.session_id).filter(Boolean));
    for (const row of rows) {
      try {
        const recipients = new Set(row.shared_graph_id || row.refresh_graph
          ? await options.graphMembers(row.graph_id) : []);
        if (await options.hasGraphAccess(row.owner, row.graph_id)) recipients.add(row.owner);
        const refresh = {type: "bots.changed", version: row.version};
        const event = {...refresh, botId: row.bot_id, sessionId: row.session_id};
        await Promise.all([...recipients].map(account =>
          publish(account, row.shared_graph_id || account === row.owner ? event : refresh)));
        const wake = wakes.get(row.session_id);
        if (wake && recipients.has(row.owner)) {
          await publish(row.owner, {type: "runner.available", runnerIds: wake.runner_ids,
            agent: wake.agent, acpOnly: wake.acp_only === true});
        }
      } catch (error) {
        console.error("Bots event delivery failed", error.code ?? error.name);
        if (row.attempts < 8) continue;
      }
      await pool.query("DELETE FROM bot_events WHERE version=$1", [row.version]);
    }
  }
  return {
    recoverServerWork: () => expireLeases(pool, true),
    async runnerIdentity(request) {
      const runner = await lookupRunner(pool, request);
      if (!runner) return null;
      const acpAgents = request.headers.get("x-logseq-runner-acp")?.split(",") ?? [];
      if (!validAcpAgents(runner, acpAgents)) return null;
      return {account: runner.owner, runnerId: runner.id, acpAgents};
    },
    async handle(owner, request) {
      try {
        let imported = false;
        const memberships = await options.graphsFor?.(owner) ?? [];
        const access = {memberships, onlineRunners: options.onlineRunners,
          canShare: graph => options.canShareGraph?.(owner, graph) ?? false,
          available: bot => !bot || bot.owner === owner ? availableAgents(owner, bot?.repository) :
            builtInAgents(bot.owner).map(item => ({...item, available: item.available && sharedAgents.has(item.name)})),
          refreshThread: async (bot, session) => {
            if (!liveDevin || !permitted(owner) || bot.owner !== owner) return false;
            try { imported = await refreshDevinThread(pool, providers.devin, bot, session); }
            catch (error) { console.error("Bots history refresh failed", error.code ?? error.name); }
            return imported;
          }};
        const result = await route(pool, owner, request, access);
        if (result.revoked) {
          const runnerId = new URL(request.url).pathname.split("/")[3];
          await notifyRevoked(owner, id(runnerId));
        }
        return Response.json(result, imported ? {headers: {"x-logseq-bots-changed": "1"}} : undefined);
      }
      catch (error) {
        if (error instanceof RequestError) return Response.json({error: error.message}, {status: error.status});
        console.error("Bots request failed", error.code ?? error.name);
        return Response.json({error: "The Bots request failed"}, {status: 500});
      }
    },
    async handleRunner(request) {
      try {
        return await runnerRoute(pool, request, canExport, notifyRevoked);
      } catch (error) {
        if (error instanceof RequestError) return Response.json({error: error.message}, {status: error.status});
        console.error("Bots device request failed", error.code ?? error.name);
        return Response.json({error: "The device request failed"}, {status: 500});
      }
    },
    async maintain({automationLimit = 1} = {}) {
      await expireLeases(pool);
      for (let count = 0; count < automationLimit; count++) {
        if (!await enqueueScheduled(pool, availableAgents)) break;
      }
    },
    claimNext() {
      return transaction(pool, db => claim(db, null, localProviders, localProviderOwner,
        {workLeaseSeconds: options.workLeaseSeconds ?? 180}));
    },
    async nextActionAt() {
      const jobDue = await claim(pool, null, localProviders, localProviderOwner, {nextOnly: true});
      const {rows: [next]} = await pool.query(`SELECT LEAST($1::timestamptz,
        (SELECT min(next_at) FROM bot_automations WHERE enabled),
        (SELECT min(lease_until) FROM bot_runs WHERE lease_until IS NOT NULL),
        (SELECT min(due_at) FROM bot_graph_exports WHERE state='queued' AND owner=$2 AND graph_id::text=$3),
        (SELECT min(due_at) FROM bot_events WHERE $4)
      ) AS due_at`, [jobDue, env.LOGSEQ_BOTS_GRAPH_TOKEN && env.DB_SYNC_BASE_URL ? env.LOGSEQ_BOTS_GRAPH_OWNER ?? "" : "",
        env.LOGSEQ_BOTS_GRAPH_ID ?? "", Boolean(publish)]);
      return next.due_at?.getTime() ?? null;
    },
    cleanStaleUploads,
    deliverEvents,
    work,
    exportGraph: () => exportGraph(pool, env, options.graphFetch),
  };
}

module.exports = {createBotRuntime};
