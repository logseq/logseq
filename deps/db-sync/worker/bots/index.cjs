const {readFileSync} = require("node:fs");
const {randomUUID} = require("node:crypto");
const {join} = require("node:path");
const {Pool} = require("pg");
const {devinLimits, makeAgents} = require("./providers.cjs");
const {weeklyProposal, nextWeekly} = require("./schedule.cjs");

const agents = ["devin", "circle", "cursor", "codex", "pi"];
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

function cursor(value) {
  if (value !== null && !/^\d{1,18}$/.test(value)) fail(400, "Invalid cursor");
  return value;
}

async function jsonBody(request) {
  try {
    const value = await request.text();
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
  if (!bot || (bot.owner !== owner && !memberships.includes(bot.shared_graph_id))) fail(404, "Bot not found");
  return bot;
}

async function visibleBots(db, owner, memberships, bot = null) {
  const {rows} = await db.query(
    `SELECT id,name,owner,shared_graph_id FROM bots WHERE (owner=$1 OR shared_graph_id=ANY($2::uuid[]))
       AND id IS DISTINCT FROM $3::uuid AND ($4::uuid IS NULL OR shared_graph_id=$4)
       ORDER BY name,id`, [owner, memberships, bot?.id ?? null, bot?.shared_graph_id ?? null]);
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
  proposal = null, attachments = [], handoff = null, actor = null, requestedAgent = null, replyTo = null,
} = {}) {
  // A later sequence must not become visible while an earlier write can still commit.
  await db.query("SELECT id FROM bots WHERE id=$1 FOR NO KEY UPDATE", [botId]);
  const {rows: [message]} = await db.query(
    `INSERT INTO messages (id,bot_id,session_id,author,body,proposal,attachments,handoff,actor,requested_agent,in_reply_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING RETURNING *`,
    [messageId, botId, sessionId, author, body, proposal, JSON.stringify(attachments), handoff, actor, requestedAgent, replyTo]);
  if (message && sessionId) {
    await db.query("UPDATE sessions SET reply_count=reply_count+1 WHERE id=$1", [sessionId]);
  }
  return message;
}

async function newSession(db, bot, rootId, prompt, selectedAgent, automatic) {
  const sessionId = randomUUID();
  await db.query(
    `INSERT INTO sessions (id,bot_id,root_message_id,title,agent,repository)
       VALUES ($1,$2,$3,$4,$5,$6)`,
    [sessionId, bot.id, rootId, Array.from(prompt).slice(0, 96).join(""), selectedAgent, bot.repository]);
  await db.query("INSERT INTO bot_runs (message_id,session_id,automation,agent) VALUES ($1,$2,$3,$4)",
    [rootId, sessionId, automatic, selectedAgent]);
  return sessionId;
}

async function sendMessage(pool, owner, bot, sessionId, body, access) {
  return transaction(pool, async db => {
    const session = sessionId && await sessionById(db, bot.id, sessionId);
    const messageId = id(body.id);
    const files = attachmentList(body.attachments);
    const prompt = body.body === "" && files.length ? "" : text(body.body, 12000);
    const chosenAgent = body.agent == null ? null : agent(body.agent);
    const targetId = body.targetBotId == null ? null : id(body.targetBotId);
    if (targetId === bot.id) fail(400, "Choose another Bot");
    if (targetId) {
      // Lock in ID order when a message spans two conversations.
      await db.query("SELECT id FROM bots WHERE id=ANY($1::uuid[]) ORDER BY id FOR NO KEY UPDATE", [[bot.id, targetId]]);
    }
    const target = targetId && await visibleBot(db, owner, targetId, access.memberships);
    if (target && bot.shared_graph_id && target.shared_graph_id !== bot.shared_graph_id) fail(404, "Bot not found");
    const handoff = target ? {target_id: target.id, target_name: target.name} : null;
    const proposal = sessionId || files.length || target ? null : weeklyProposal(prompt, body.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, chosenAgent);
    if (proposal) {
      try { new Intl.DateTimeFormat("en", {timeZone: proposal.timeZone}); }
      catch { fail(400, "Invalid time zone"); }
    }
    const message = await insertMessage(db, bot.id, sessionId, messageId, "user", prompt, {attachments: files, handoff, actor: owner, requestedAgent: chosenAgent});
    if (!message) {
      const {rows: [existing]} = await db.query(
        "SELECT * FROM messages WHERE id=$1 AND bot_id=$2 AND session_id IS NOT DISTINCT FROM $3::uuid",
        [messageId, bot.id, sessionId]);
      if (!existing || existing.author !== "user" || existing.body !== prompt || (existing.handoff?.target_id ?? null) !== targetId ||
          (existing.actor ?? bot.owner) !== owner || (existing.actor && existing.requested_agent !== chosenAgent) ||
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
    if (taskAgent) configuredAgent(access.available(target || bot), taskAgent);
    if (target) {
      const receivedId = randomUUID();
      const copies = files.map(file => ({...file, id: randomUUID()}));
      await insertMessage(db, target.id, null, receivedId, "bot", prompt, {
        attachments: copies, actor: owner, requestedAgent: chosenAgent,
        handoff: {source_id: bot.id, source_name: bot.name, source_message_id: messageId},
      });
      for (const [index, file] of copies.entries()) {
        await db.query(`INSERT INTO bot_uploads (id,bot_id,owner,payload,message_id)
           SELECT $1,$2,$3,payload,$4 FROM bot_uploads WHERE id=$5`,
          [file.id, target.id, owner, receivedId, files[index].id]);
      }
      if (taskAgent) await newSession(db, target, receivedId,
        prompt || files.map(file => file.name).join(", "), taskAgent, false);
    } else if (sessionId) {
      await db.query("INSERT INTO bot_runs (message_id,session_id,agent) VALUES ($1,$2,$3)", [messageId, sessionId, taskAgent]);
      await db.query("UPDATE sessions SET status=CASE WHEN status='running' THEN status ELSE 'queued' END,updated_at=now() WHERE id=$1", [sessionId]);
    } else if (proposal) {
      await insertMessage(db, bot.id, null, randomUUID(), "bot", "Create a weekly automation?", {proposal});
    } else if (chosenAgent) {
      sessionId = await newSession(db, bot, messageId, prompt || files.map(file => file.name).join(", "), chosenAgent, false);
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

  if (!botKey && method === "GET") {
    const {rows: bots} = await pool.query(
      `SELECT bots.*, left(preview.body,300) AS preview FROM bots
       LEFT JOIN LATERAL (SELECT body,created_at FROM messages WHERE bot_id=bots.id
         ORDER BY seq DESC LIMIT 1) preview ON true
       WHERE (owner=$1 OR shared_graph_id=ANY($2::uuid[])) ORDER BY coalesce(preview.created_at,bots.created_at) DESC,bots.id`, [owner, access.memberships]);
    const decisions = await Promise.all(access.memberships.map(graph => access.canShare(graph)));
    return {bots, agents: access.available(), shareableGraphs: access.memberships.filter((_, index) => decisions[index])};
  }
  if (!botKey && method === "POST") {
    const body = await jsonBody(request);
    const botId = id(body.id);
    const {rows: [existing]} = await pool.query("SELECT * FROM bots WHERE id=$1 AND owner=$2", [botId, owner]);
    if (existing) return {bot: existing};
    const shared = body.sharedGraphId ? id(body.sharedGraphId) : null;
    if (shared && !await access.canShare(shared)) fail(403, "This Graph cannot be shared");
    const {rows: [bot]} = await pool.query(
      `INSERT INTO bots (id,owner,name,default_agent,repository,graph_id,graph_block_id,shared_graph_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING RETURNING *`,
      [botId, owner, text(body.name, 120), defaultAgent(access.available(), body.defaultAgent), repository(body.repository),
        body.graphId ? id(body.graphId) : null, body.graphBlockId ? id(body.graphBlockId) : null, shared]);
    return {bot: bot ?? await ownedBot(pool, owner, botId)};
  }

  const bot = await visibleBot(pool, owner, id(botKey), access.memberships);
  const availableAgents = access.available(bot);
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
    const session = await sessionById(pool, bot.id, id(itemKey));
    if (!action && method === "GET") {
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
  await transaction(pool, async db => {
    const {rows: [rule]} = await db.query(
      `SELECT * FROM bot_automations WHERE enabled AND next_at<=now()
       ORDER BY next_at,id LIMIT 1 FOR UPDATE SKIP LOCKED`);
    if (!rule) return;
    const {rows: [bot]} = await db.query("SELECT * FROM bots WHERE id=$1", [rule.bot_id]);
    const messageId = randomUUID();
    const name = rule.agent ?? bot.default_agent;
    if (hasAgent(availableAgents(bot.owner), name)) {
      await insertMessage(db, bot.id, null, messageId, "bot", rule.prompt);
      await newSession(db, bot, messageId, rule.prompt, name, true);
    } else {
      await insertMessage(db, bot.id, null, messageId, "bot",
        "An automation was skipped because its Agent is no longer configured.");
    }
    const next = nextWeekly({...rule, timeZone: rule.time_zone}, Math.max(Date.now(), Number(rule.next_at)));
    await db.query("UPDATE bot_automations SET next_at=$1 WHERE id=$2", [next, rule.id]);
  });
}

async function claim(pool) {
  return transaction(pool, async db => {
    const {rows: [job]} = await db.query(
      `SELECT r.*,COALESCE(r.agent,s.agent) AS agent,s.agent AS primary_agent,s.repository,s.bot_id,s.root_message_id,
              binding.provider_session_id,binding.provider_url,binding.provider_cursor AS session_cursor,
              m.body AS prompt,m.seq AS message_seq,m.created_at AS message_created_at,m.attachments,m.actor,
              b.graph_id,b.graph_block_id,b.owner,b.shared_graph_id,
              EXISTS (SELECT 1 FROM bot_runs earlier WHERE earlier.session_id=r.session_id AND earlier.seq<r.seq
                AND COALESCE(earlier.agent,s.agent)=COALESCE(r.agent,s.agent)) AS previous_turn
         FROM bot_runs r JOIN sessions s ON s.id=r.session_id
         LEFT JOIN bot_thread_agents binding ON binding.session_id=s.id AND binding.agent=COALESCE(r.agent,s.agent)
         JOIN messages m ON m.id=r.message_id JOIN bots b ON b.id=s.bot_id
         WHERE r.state IN ('queued','poll') AND r.due_at<=now()
           AND NOT EXISTS (SELECT 1 FROM bot_runs earlier WHERE earlier.session_id=r.session_id
             AND earlier.seq<r.seq AND earlier.state NOT IN ('done','failed','needs_input','attention'))
         ORDER BY r.due_at,r.seq LIMIT 1 FOR UPDATE OF r SKIP LOCKED`);
    if (!job) return null;
    await db.query("UPDATE bot_runs SET state='working' WHERE message_id=$1", [job.message_id]);
    await db.query("UPDATE sessions SET status='running',updated_at=now() WHERE id=$1", [job.session_id]);
    return {...job, provider_cursor: job.provider_cursor ?? job.session_cursor};
  });
}

async function withThreadContext(pool, job) {
  const {rows} = await pool.query(
    `WITH peer_runs AS (
       SELECT message_id FROM bot_runs WHERE session_id=$1 AND seq<$2
         AND COALESCE(agent,$3)<>$4 AND state IN ('done','needs_input','failed','attention')
     )
     SELECT author,left(body,1200) AS body FROM messages m
       WHERE m.bot_id=$5 AND (m.session_id=$1 OR m.id=$6) AND EXISTS (SELECT 1 FROM peer_runs)
         AND (m.seq<$7 OR m.in_reply_to IN (SELECT message_id FROM peer_runs))
       ORDER BY m.seq DESC LIMIT 12`,
    [job.session_id, job.seq, job.primary_agent, job.agent, job.bot_id, job.root_message_id, job.message_seq]);
  if (!rows.length) return job;
  return {...job, prompt: "Recent messages from the shared Logseq thread, for context only:\n"
    + JSON.stringify(rows.reverse()) + "\n\nCurrent request:\n" + job.prompt};
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
  await transaction(pool, async db => {
    if (result.reply) {
      await insertMessage(db, job.bot_id, job.session_id, randomUUID(), job.agent, result.reply, {replyTo: job.message_id});
    }
    const summary = result.reply || job.last_reply;
    if (result.state === "done" && summary) {
      if (job.automation) {
        await insertMessage(db, job.bot_id, null, randomUUID(), "bot", summary);
      }
      if (canExport(job)) {
        const url = result.url ?? job.provider_url;
        const title = `${summary.slice(0, 6000)}${url ? "\n" + url : ""}`;
        await db.query(`INSERT INTO bot_graph_exports (id,owner,graph_id,block_id,title)
          VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
          [job.message_id, job.owner, job.graph_id, job.graph_block_id, title]);
      }
    }
    if (result.providerSessionId || result.url || result.cursor) {
      await db.query(
        `INSERT INTO bot_thread_agents (session_id,agent,provider_session_id,provider_url,provider_cursor)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (session_id,agent) DO UPDATE SET
         provider_session_id=COALESCE(excluded.provider_session_id,bot_thread_agents.provider_session_id),
         provider_url=COALESCE(excluded.provider_url,bot_thread_agents.provider_url),
         provider_cursor=COALESCE(excluded.provider_cursor,bot_thread_agents.provider_cursor)`,
        [job.session_id, job.agent, result.providerSessionId ?? null, result.url ?? null, result.cursor ?? null]);
    }
    const status = result.state === "done" ? "completed" : result.state === "poll" ? "running" : result.state;
    const primary = job.agent === job.primary_agent;
    await db.query(
      `UPDATE sessions SET status=CASE WHEN $1 <> 'running' AND EXISTS (
         SELECT 1 FROM bot_runs WHERE session_id=$5 AND message_id<>$6 AND state IN ('queued','working','poll')
       ) THEN 'queued' ELSE $1 END,
       provider_session_id=COALESCE($2,provider_session_id),provider_url=COALESCE($3,provider_url),
       provider_cursor=COALESCE($4,provider_cursor),updated_at=now() WHERE id=$5`,
      [status, primary ? result.providerSessionId ?? null : null,
        primary ? result.url ?? null : null, primary ? result.cursor ?? null : null, job.session_id, job.message_id]);
    await db.query(`UPDATE bot_runs SET state=$1,due_at=now()+make_interval(secs=>$4),provider_cursor=$2,
      last_reply=COALESCE($5,last_reply) WHERE message_id=$3`,
      [result.state, result.cursor ?? job.provider_cursor, job.message_id, result.pollDelay ?? 3, result.reply || null]);
  });
}

async function exportGraph(pool, env) {
  if (!env.LOGSEQ_BOTS_GRAPH_TOKEN || !env.DB_SYNC_BASE_URL) return;
  const {rows: [item]} = await pool.query(
    `SELECT * FROM bot_graph_exports WHERE state='queued' AND due_at<=now()
      AND owner=$1 AND graph_id::text=$2 ORDER BY due_at LIMIT 1`,
    [env.LOGSEQ_BOTS_GRAPH_OWNER ?? "", env.LOGSEQ_BOTS_GRAPH_ID ?? ""]);
  if (!item) return;
  const path = `/api/v1/graphs/${item.graph_id}/blocks/${item.block_id}/children`;
  try {
    const response = await fetch(new URL(path, env.DB_SYNC_BASE_URL), {
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
}

async function createBotService(env = process.env, options = {}) {
  const pool = new Pool({connectionString: env.LOGSEQ_BOTS_DATABASE_URL});
  let serviceLock;
  try {
    serviceLock = await pool.connect();
    const {rows: [lock]} = await serviceLock.query("SELECT pg_try_advisory_lock(35927681) AS acquired");
    if (!lock.acquired) throw new Error("The Bots database already has a running worker");
    await transaction(pool, async db => {
      await db.query(readFileSync(join(__dirname, "schema.sql"), "utf8"));
      await db.query("DELETE FROM bot_uploads WHERE message_id IS NULL AND created_at < now() - interval '7 days'");
      await db.query(`UPDATE sessions SET status='attention' WHERE id IN
        (SELECT session_id FROM bot_runs WHERE state='working')`);
      await db.query("UPDATE bot_runs SET state='attention' WHERE state='working'");
    });
  } catch (error) {
    serviceLock?.release(true);
    await pool.end();
    throw error;
  }

  const providers = options.providers ?? makeAgents(env);
  const unrestricted = Boolean(options.providers) || env.LOGSEQ_BOTS_MOCK === "1";
  const permitted = owner => unrestricted || owner === env.LOGSEQ_BOTS_AGENT_OWNER;
  const availableAgents = owner => agents.map(name => ({name, available: permitted(owner) && Boolean(providers[name])}));
  const sharedAgents = new Set((env.LOGSEQ_BOTS_SHARED_AGENTS ?? "").split(",").map(value => value.trim()));
  const liveDevin = Boolean(providers.devin) && !unrestricted;
  const limits = devinLimits(env);
  const canExport = job => Boolean(env.LOGSEQ_BOTS_GRAPH_TOKEN && job.graph_block_id
    && job.owner === env.LOGSEQ_BOTS_GRAPH_OWNER && job.graph_id === env.LOGSEQ_BOTS_GRAPH_ID);
  let pending = null;
  const running = new Set();
  const reportWorkerError = error => console.error("Bots worker failed", error.code ?? error.name);
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
      const {rows} = await pool.query("SELECT id,payload FROM bot_uploads WHERE message_id=$1", [job.message_id]);
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
  const tick = async () => {
    await enqueueScheduled(pool, availableAgents);
    if (running.size < 4) {
      const job = await claim(pool);
      if (job) {
        const operation = work(job).catch(reportWorkerError).finally(() => running.delete(operation));
        running.add(operation);
      }
    }
    await exportGraph(pool, env);
  };

  const timer = setInterval(() => {
    if (!pending) pending = tick().catch(reportWorkerError).finally(() => { pending = null; });
  }, 1000);
  timer.unref();

  return {
    async handle(owner, request) {
      try {
        const memberships = await options.graphsFor?.(owner) ?? [];
        const access = {memberships, canShare: graph => options.canShareGraph?.(owner, graph) ?? false,
          available: bot => !bot || bot.owner === owner ? availableAgents(owner) :
            availableAgents(bot.owner).map(item => ({...item, available: item.available && sharedAgents.has(item.name)}))};
        return Response.json(await route(pool, owner, request, access));
      }
      catch (error) {
        if (error instanceof RequestError) return Response.json({error: error.message}, {status: error.status});
        console.error("Bots request failed", error.code ?? error.name);
        return Response.json({error: "The Bots request failed"}, {status: 500});
      }
    },
    async close() {
      clearInterval(timer);
      await pending;
      await Promise.all(running);
      serviceLock.release(true);
      await pool.end();
    },
  };
}

module.exports = {createBotService};
