const assert = require("node:assert/strict");
const {randomUUID} = require("node:crypto");
const {test} = require("node:test");
const {setTimeout: sleep} = require("node:timers/promises");
const {Client} = require("pg");
const {createBotService} = require("./index.cjs");
const {makeAgents} = require("./providers.cjs");

const database = process.env.LOGSEQ_BOTS_TEST_DATABASE_URL;
const owner = randomUUID();
const bot = randomUUID();
const threadPath = session => `/bots/${bot}/sessions/${session}`;

async function call(service, path, body, subject = owner) {
  const response = await service.handle(subject, new Request(`http://127.0.0.1${path}`, {
    method: body ? "POST" : "GET", body: body && JSON.stringify(body),
  }));
  return {status: response.status, body: await response.json()};
}

async function waitFor(operation, condition) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const result = await operation();
    if (condition(result.body)) return result.body;
    await sleep(100);
  }
  assert.fail("The mock worker did not finish");
}

test("mock mode overrides live credentials and live Devin requires positive limits", async () => {
  const env = {LOGSEQ_BOTS_AGENT_OWNER: owner, LOGSEQ_BOTS_DEVIN_ENABLED: "1",
    DEVIN_ORG_ID: "org-fixture", DEVIN_API_KEY: "test-placeholder"};
  assert.equal(makeAgents(env).devin, undefined);
  const mock = makeAgents({...env, LOGSEQ_BOTS_MOCK: "1"});
  assert.match((await mock.devin({prompt: "Test", session_id: bot})).reply, /^Mock devin:/);
});

test("deduplicates dispatches and continues the same session with incremental history",
  {skip: !database}, async () => {
    const service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database, LOGSEQ_BOTS_MOCK: "1"});
    try {
      await call(service, "/bots", {id: bot, name: "Logseq", defaultAgent: "devin"});
      const main = `/bots/${bot}`;
      assert.equal((await call(service, main, null, randomUUID())).status, 404);
      assert.equal((await call(service, main + "/messages", {id: randomUUID(), body: "Hello"})).body.sessionId, null);
      const request = {id: randomUUID(), body: "Summarize new issues", agent: "devin"};
      const deliveries = await Promise.all([1, 2, 3].map(() => call(service, main + "/messages", request)));
      const session = deliveries[0].body.sessionId;
      assert.ok(session);
      for (const delivery of deliveries) assert.equal(delivery.body.sessionId, session);
      const path = threadPath(session);
      const first = await waitFor(() => call(service, path), result => result.session?.status === "completed");
      assert.deepEqual(first.messages.map(item => item.body), ["Mock devin: Summarize new issues"]);
      await call(service, path + "/messages", {id: randomUUID(), body: "Include Android"});
      const delta = await waitFor(() => call(service, path + "?after=" + first.messages[0].seq),
        result => result.messages?.length === 2);
      assert.equal(delta.session.provider_session_id, first.session.provider_session_id);
      assert.deepEqual(delta.messages.map(item => item.body), ["Include Android", "Mock devin: Include Android"]);
      assert.equal((await call(service, main)).body.sessions.length, 1);
    } finally {
      await service.close();
    }
  });

test("a confirmed weekly automation creates one new thread and posts its summary",
  {skip: !database}, async () => {
    const service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database, LOGSEQ_BOTS_MOCK: "1"});
    const db = new Client({connectionString: database});
    try {
      await db.connect();
      const id = randomUUID();
      await call(service, "/bots", {id, name: "Weekly report", defaultAgent: "circle"});
      const main = `/bots/${id}`;
      await call(service, main + "/messages", {id: randomUUID(), body: "每周一总结新的 issue"});
      const draft = (await call(service, main)).body;
      assert.equal(draft.sessions.length, 0);
      const proposal = draft.messages.find(row => row.proposal);
      assert.ok(proposal);
      const confirmation = {id: proposal.id, ...proposal.proposal};
      assert.equal((await call(service, main + "/automations", confirmation)).status, 200);
      assert.equal((await call(service, main + "/automations", confirmation)).status, 200);
      await db.query("UPDATE bot_automations SET next_at=now()-interval '1 minute' WHERE id=$1", [proposal.id]);
      const report = await waitFor(() => call(service, main), result =>
        result.sessions?.[0]?.status === "completed");
      assert.equal(report.sessions.length, 1);
      assert.equal(report.sessions[0].agent, "circle");
      assert.match(report.messages.at(-1).body, /^Mock circle:/);
      assert.ok(Date.parse(report.automations[0].next_at) > Date.now());
    } finally {
      await db.end();
      await service.close();
    }
  });

test("provider receives the ACU cap and an ambiguous start consumes the rolling budget",
  {skip: !database}, async t => {
    const starts = [];
    t.mock.method(globalThis, "fetch", async (url, options) => {
      assert.match(String(url), /^https:\/\/api\.devin\.ai\/v3\/organizations\/org-fixture\/sessions$/);
      assert.equal(options.method, "POST");
      starts.push(JSON.parse(options.body));
      throw new Error("Mock connection loss after create");
    });
    const service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database, LOGSEQ_BOTS_AGENT_OWNER: owner,
      LOGSEQ_BOTS_DEVIN_ENABLED: "1", LOGSEQ_BOTS_DEVIN_DAILY_STARTS: "1", LOGSEQ_BOTS_DEVIN_MAX_ACU: "2",
      DEVIN_ORG_ID: "org-fixture", DEVIN_API_KEY: "test-placeholder"});
    try {
      const id = randomUUID();
      await call(service, "/bots", {id, name: "Budget test", defaultAgent: "devin"});
      const send = body => call(service, `/bots/${id}/messages`, {id: randomUUID(), body, agent: "devin"});
      const get = result => call(service, `/bots/${id}/sessions/${result.body.sessionId}`);
      const first = await send("First task");
      await waitFor(() => get(first), result => result.session?.status === "attention");
      const second = await send("Second task");
      const limited = await waitFor(() => get(second), result => result.session?.status === "failed");
      assert.match(limited.messages[0].body, /24-hour Devin session budget/);
      assert.equal(starts.length, 1);
      assert.equal(starts[0].max_acu_limit, 2);
      assert.equal(starts[0].devin_mode, "normal");
    } finally {
      await service.close();
    }
  });
