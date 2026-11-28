const {readFileSync} = require("node:fs");
const {randomUUID} = require("node:crypto");
const {join} = require("node:path");
const {Pool} = require("pg");
const {devinLimits, makeAgents} = require("./providers.cjs");
const {weeklyProposal, nextWeekly} = require("./schedule.cjs");

const agents = ["devin", "circle", "codex", "pi"];
const pageSize = 40;
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
    `SELECT id,bot_id,session_id,seq,author,body,proposal,created_at FROM messages
       WHERE bot_id=$1 AND ${sessionId ? "session_id=$2::uuid" : "session_id IS NULL AND $2::uuid IS NULL"}
         AND ($3::bigint IS NULL OR seq<$3) AND ($4::bigint IS NULL OR seq>$4)
       ORDER BY seq ${after === null ? "DESC" : "ASC"} LIMIT $5`,
    [botId, sessionId, before, after, pageSize + 1]);
  const more = rows.length > pageSize;
  const messages = rows.slice(0, pageSize);
  return {messages: after === null ? messages.reverse() : messages, more};
}

async function insertMessage(db, botId, sessionId, messageId, author, body, proposal = null) {
  // A later sequence must not become visible while an earlier write can still commit.
  await db.query("SELECT id FROM bots WHERE id=$1 FOR NO KEY UPDATE", [botId]);
  const {rows: [message]} = await db.query(
    `INSERT INTO messages (id,bot_id,session_id,author,body,proposal)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING RETURNING *`,
    [messageId, botId, sessionId, author, body, proposal]);
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
  await db.query("INSERT INTO bot_runs (message_id,session_id,automation) VALUES ($1,$2,$3)",
    [rootId, sessionId, automatic]);
  return sessionId;
}

async function sendMessage(pool, bot, sessionId, body) {
  return transaction(pool, async db => {
    if (sessionId) await sessionById(db, bot.id, sessionId);
    const messageId = id(body.id);
    const prompt = text(body.body, 12000);
    const chosenAgent = body.agent == null ? null : agent(body.agent);
    const proposal = sessionId ? null : weeklyProposal(prompt, body.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, chosenAgent);
    if (proposal) {
      try { new Intl.DateTimeFormat("en", {timeZone: proposal.timeZone}); }
      catch { fail(400, "Invalid time zone"); }
    }
    const message = await insertMessage(db, bot.id, sessionId, messageId, "user", prompt);
    if (!message) {
      const {rows: [existing]} = await db.query(
        "SELECT * FROM messages WHERE id=$1 AND bot_id=$2 AND session_id IS NOT DISTINCT FROM $3::uuid",
        [messageId, bot.id, sessionId]);
      if (!existing || existing.author !== "user" || existing.body !== prompt) fail(409, "Message identifier already in use");
      const {rows: [existingSession]} = await db.query(
        "SELECT id FROM sessions WHERE root_message_id=$1", [messageId]);
      return {message: existing, sessionId: sessionId ?? existingSession?.id ?? null};
    }
    if (sessionId) {
      await db.query("INSERT INTO bot_runs (message_id,session_id) VALUES ($1,$2)", [messageId, sessionId]);
      await db.query("UPDATE sessions SET updated_at=now() WHERE id=$1", [sessionId]);
    } else if (proposal) {
      await insertMessage(db, bot.id, null, randomUUID(), "bot", "Create a weekly automation?", proposal);
    } else if (chosenAgent) {
      sessionId = await newSession(db, bot, messageId, prompt, chosenAgent, false);
    } else if (/(进展|状态|status|progress)/i.test(prompt)) {
      const {rows} = await db.query("SELECT title,status FROM sessions WHERE bot_id=$1 ORDER BY updated_at DESC LIMIT 5",
        [bot.id]);
      const reply = rows.length ? rows.map(row => `${row.title} · ${row.status}`).join("\n") : "No sessions yet.";
      await insertMessage(db, bot.id, null, randomUUID(), "bot", reply);
    }
    return {message, sessionId};
  });
}

async function route(pool, owner, request, availableAgents) {
  const url = new URL(request.url);
  const [base, botKey, resource, itemKey, action, extra] = url.pathname.slice(1).split("/");
  const method = request.method;
  if (base !== "bots" || extra || !["GET", "POST", "PATCH"].includes(method)) fail(404, "Not found");

  if (!botKey && method === "GET") {
    const {rows: bots} = await pool.query(
      `SELECT bots.*, preview.body AS preview FROM bots
       LEFT JOIN LATERAL (SELECT body FROM messages WHERE bot_id=bots.id AND session_id IS NULL
         ORDER BY seq DESC LIMIT 1) preview ON true
       WHERE owner=$1 ORDER BY created_at DESC,id`, [owner]);
    return {bots, agents: availableAgents};
  }
  if (!botKey && method === "POST") {
    const body = await jsonBody(request);
    const botId = id(body.id);
    const {rows: [bot]} = await pool.query(
      `INSERT INTO bots (id,owner,name,default_agent,repository,graph_id,graph_block_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING RETURNING *`,
      [botId, owner, text(body.name, 120), agent(body.defaultAgent), repository(body.repository),
        body.graphId ? id(body.graphId) : null, body.graphBlockId ? id(body.graphBlockId) : null]);
    return {bot: bot ?? await ownedBot(pool, owner, botId)};
  }

  const bot = await ownedBot(pool, owner, id(botKey));
  if (!resource && method === "GET") {
    const {rows: sessions} = await pool.query(
      "SELECT * FROM sessions WHERE bot_id=$1 ORDER BY updated_at DESC,id LIMIT 100", [bot.id]);
    const {rows: automations} = await pool.query("SELECT * FROM bot_automations WHERE bot_id=$1 ORDER BY next_at", [bot.id]);
    return {bot, sessions, automations, agents: availableAgents, ...await messagePage(pool, bot.id, null, url)};
  }
  if (!resource && method === "PATCH") {
    const body = await jsonBody(request);
    const {rows: [updated]} = await pool.query(
      "UPDATE bots SET default_agent=$1 WHERE id=$2 AND owner=$3 RETURNING *", [agent(body.defaultAgent), bot.id, owner]);
    return {bot: updated};
  }
  if (resource === "messages" && !itemKey && method === "POST") {
    return sendMessage(pool, bot, null, await jsonBody(request));
  }
  if (resource === "sessions" && itemKey) {
    const session = await sessionById(pool, bot.id, id(itemKey));
    if (!action && method === "GET") {
      const {rows: [root]} = await pool.query("SELECT * FROM messages WHERE id=$1", [session.root_message_id]);
      return {session, root, ...await messagePage(pool, bot.id, session.id, url)};
    }
    if (action === "messages" && method === "POST") {
      return sendMessage(pool, bot, session.id, await jsonBody(request));
    }
  }
  if (resource === "automations" && !itemKey && method === "POST") {
    const body = await jsonBody(request);
    const values = [body.weekday, body.hour, body.minute];
    if (values.some((value, index) => !Number.isInteger(value) || value < 0 || value > [6, 23, 59][index])) {
      fail(400, "Invalid automation time");
    }
    const rule = {weekday: body.weekday, hour: body.hour, minute: body.minute, timeZone: text(body.timeZone, 80)};
    let next;
    try { next = nextWeekly(rule); } catch { fail(400, "Invalid automation time zone or occurrence"); }
    await pool.query(
      `INSERT INTO bot_automations (id,bot_id,prompt,weekday,hour,minute,time_zone,agent,next_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [id(body.id), bot.id, text(body.prompt, 12000), body.weekday, body.hour, body.minute,
        rule.timeZone, body.agent == null ? null : agent(body.agent), next]);
    return {saved: true};
  }
  if (resource === "automations" && itemKey && !action && method === "PATCH") {
    const body = await jsonBody(request);
    if (typeof body.enabled !== "boolean") fail(400, "Invalid automation state");
    const update = await pool.query("UPDATE bot_automations SET enabled=$1 WHERE id=$2 AND bot_id=$3",
      [body.enabled, id(itemKey), bot.id]);
    if (!update.rowCount) fail(404, "Automation not found");
    return {saved: true};
  }
  fail(404, "Not found");
}

async function enqueueScheduled(pool) {
  await transaction(pool, async db => {
    const {rows: [rule]} = await db.query(
      `SELECT * FROM bot_automations WHERE enabled AND next_at<=now()
       ORDER BY next_at,id LIMIT 1 FOR UPDATE SKIP LOCKED`);
    if (!rule) return;
    const {rows: [bot]} = await db.query("SELECT * FROM bots WHERE id=$1", [rule.bot_id]);
    const messageId = randomUUID();
    await insertMessage(db, bot.id, null, messageId, "bot", rule.prompt);
    await newSession(db, bot, messageId, rule.prompt, rule.agent ?? bot.default_agent, true);
    const next = nextWeekly({...rule, timeZone: rule.time_zone}, Math.max(Date.now(), Number(rule.next_at)));
    await db.query("UPDATE bot_automations SET next_at=$1 WHERE id=$2", [next, rule.id]);
  });
}

async function claim(pool) {
  return transaction(pool, async db => {
    const {rows: [job]} = await db.query(
      `SELECT r.*,s.agent,s.repository,s.bot_id,s.root_message_id,s.provider_session_id,s.provider_url,m.body AS prompt,
              b.graph_id,b.graph_block_id,b.owner,s.provider_cursor AS session_cursor
         FROM bot_runs r JOIN sessions s ON s.id=r.session_id
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

async function reserveDevinStart(pool, job, limits) {
  return transaction(pool, async db => {
    await db.query("SELECT pg_advisory_xact_lock(35927682)");
    const {rows: [usage]} = await db.query(`SELECT count(*)::integer AS starts,
      EXISTS (SELECT 1 FROM bot_devin_starts started JOIN sessions s ON s.id=started.session_id
        JOIN bot_runs r ON s.id=r.session_id
        WHERE s.agent='devin' AND s.id<>$1 AND r.state IN ('working','poll')) AS active
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
      await insertMessage(db, job.bot_id, job.session_id, randomUUID(), job.agent, result.reply);
      if (job.automation && result.state === "done") {
        await insertMessage(db, job.bot_id, null, randomUUID(), "bot", result.reply);
      }
      if (result.state === "done" && canExport(job)) {
        const url = result.url ?? job.provider_url;
        const title = `${result.reply.slice(0, 6000)}${url ? "\n" + url : ""}`;
        await db.query(`INSERT INTO bot_graph_exports (id,owner,graph_id,block_id,title)
          VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
          [job.message_id, job.owner, job.graph_id, job.graph_block_id, title]);
      }
    }
    await db.query(
      `UPDATE sessions SET status=$1,provider_session_id=COALESCE($2,provider_session_id),
       provider_url=COALESCE($3,provider_url),provider_cursor=COALESCE($5,provider_cursor),
       updated_at=now() WHERE id=$4`,
      [result.state === "done" ? "completed" : result.state === "poll" ? "running" : result.state,
        result.providerSessionId ?? null, result.url ?? null, job.session_id, result.cursor ?? null]);
    await db.query("UPDATE bot_runs SET state=$1,due_at=now()+make_interval(secs=>$4),provider_cursor=$2 WHERE message_id=$3",
      [result.state, result.cursor ?? job.provider_cursor, job.message_id, result.pollDelay ?? 3]);
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
    if (job.state !== "poll" && !job.provider_session_id && job.root_message_id !== job.message_id) {
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
    return provider(job);
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
    await enqueueScheduled(pool);
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
      try { return Response.json(await route(pool, owner, request, availableAgents(owner))); }
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
