const assert = require("node:assert/strict");
const {randomUUID} = require("node:crypto");
const {test} = require("node:test");
const {setTimeout: sleep} = require("node:timers/promises");
const {Client} = require("pg");
const {createBotService: openBotService} = require("./index.cjs");
const {makeAgents} = require("./providers.cjs");

const database = process.env.LOGSEQ_BOTS_TEST_DATABASE_URL;
const owner = randomUUID();
const fixtureGraph = randomUUID();
const bot = randomUUID();
const threadPath = session => `/bots/${bot}/sessions/${session}`;

async function call(service, path, body, subject = owner) {
  if (path === "/bots" && body && !Object.hasOwn(body, "graphId")) {
    body = {...body, graphId: body.sharedGraphId ?? fixtureGraph};
  }
  const response = await service.handle(subject, new Request(`http://127.0.0.1${path}`, {
    method: body ? "POST" : "GET", body: body && JSON.stringify(body),
  }));
  return {status: response.status, body: await response.json()};
}

function createBotService(env, options) {
  return openBotService(env, {graphsFor: async () => [fixtureGraph], ...options});
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

test("a Devin reply is read from session history and a follow-up uses the same run", async t => {
  const sent = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const request = new URL(url);
    if (request.pathname.endsWith("/attachments")) {
      const file = options.body.get("file");
      assert.equal(file.name, "demo.txt");
      assert.equal(await file.text(), "file-content");
      return Response.json({url: "https://fixture.invalid/demo.txt"});
    }
    if (options.method === "POST") {
      sent.push([request.pathname, JSON.parse(options.body)]);
      return Response.json({session_id: "devin-fixture"});
    }
    if (request.pathname.endsWith("/messages")) {
      assert.equal(request.searchParams.get("after"), null);
      return Response.json({items: [
        {event_id: "event-0", source: "user", message: "Check navigation"},
        {event_id: "event-1", source: "devin", message: "Which platform?"},
      ], end_cursor: null});
    }
    assert.match(request.pathname, /\/sessions\/devin-fixture$/);
    return Response.json({status: "running", status_detail: "waiting_for_user"});
  });
  const devin = makeAgents({LOGSEQ_BOTS_AGENT_OWNER: owner, LOGSEQ_BOTS_DEVIN_ENABLED: "1",
    LOGSEQ_BOTS_DEVIN_DAILY_STARTS: "1", LOGSEQ_BOTS_DEVIN_MAX_ACU: "2",
    DEVIN_ORG_ID: "org-fixture", DEVIN_API_KEY: "test-placeholder"}).devin;
  const started = await devin({state: "queued", prompt: "Check navigation",
    files: [{name: "demo.txt", payload: Buffer.from("file-content")}]});
  const run = {provider_session_id: started.providerSessionId, provider_cursor: "event-0"};
  const reply = await devin({...run, state: "poll"});
  assert.equal(reply.state, "needs_input");
  assert.equal(reply.reply, "Which platform?");
  assert.deepEqual(JSON.parse(reply.cursor), {event: "event-1"});
  const repeatedPoll = await devin({...run, state: "poll", provider_cursor: reply.cursor});
  assert.equal(repeatedPoll.reply, null);
  const continued = await devin({...run, state: "queued", prompt: "Android"});
  assert.equal(continued.providerSessionId, started.providerSessionId);
  assert.match(sent[0][0], /\/sessions$/);
  assert.equal(sent[0][1].resumable, true);
  assert.deepEqual(sent[0][1].attachment_urls, ["https://fixture.invalid/demo.txt"]);
  assert.match(sent[1][0], /\/sessions\/devin-fixture\/messages$/);
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
      assert.equal((await call(service, "/bots")).body.bots[0].preview, "Mock devin: Include Android");
    } finally {
      await service.close();
    }
  });

test("a confirmed weekly automation creates one new thread and posts its summary",
  {skip: !database}, async () => {
    const providers = {
      circle: async job => job.state === "poll" ? {state: "done"} : {
        state: "poll", pollDelay: 0, reply: `Mock circle: ${job.prompt}`,
      },
    };
    const service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database}, {providers});
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


test("checks provider configuration after resolving replay", {skip: !database}, async () => {
  const bot = randomUUID();
  let service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database}, {
    providers: {codex: async () => ({state: "done", reply: "OK"})},
  });
  const request = {id: randomUUID(), body: "Review the app", agent: "codex"};
  const main = `/bots/${bot}`;
  let first;
  try {
    assert.equal((await call(service, "/bots", {id: bot, name: "Configured providers"})).status, 200);
    assert.equal((await call(service, main + "/messages", {...request, agent: "pi"})).status, 409);
    assert.equal((await call(service, main)).body.messages.length, 0);
    first = (await call(service, main + "/messages", request)).body;
    assert.ok(first.sessionId);
  } finally {
    await service.close();
  }
  service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database}, {providers: {}});
  try {
    assert.equal((await call(service, main + "/messages", request)).body.sessionId, first.sessionId);
    assert.equal((await call(service, main + "/messages", {...request, id: randomUUID()})).status, 409);
    assert.equal((await call(service, main)).body.sessions.length, 1);
  } finally {
    await service.close();
  }
});

test("checks team membership and forwards a message and file once", {skip: !database}, async () => {
  const graph = randomUUID(), member = randomUUID(), outsider = randomUUID();
  const memberships = new Set([owner, member]);
  const service = await createBotService({
    LOGSEQ_BOTS_DATABASE_URL: database, LOGSEQ_BOTS_MOCK: "1", LOGSEQ_BOTS_SHARED_AGENTS: "codex",
  }, {
    graphsFor: subject => memberships.has(subject) ? [graph] : [],
    canShareGraph: (subject, graphId) => owner === subject && graphId === graph,
  });
  try {
    const source = randomUUID(), target = randomUUID(), privateBot = randomUUID();
    const path = id => `/bots/${id}`;
    assert.equal((await call(service, "/bots", {id: source, name: "Engineering", sharedGraphId: graph})).status, 200);
    assert.equal((await call(service, "/bots", {id: target, name: "Mobile QA", sharedGraphId: graph})).status, 200);
    assert.equal((await call(service, "/bots", {id: privateBot, name: "Private", graphId: graph})).status, 200);
    assert.equal((await call(service, "/bots", {id: randomUUID(), name: "Missing Graph", graphId: null})).status, 400);
    assert.equal((await call(service, "/bots", {id: randomUUID(), name: "Foreign Graph", graphId: randomUUID()})).status, 403);
    assert.equal((await call(service, "/bots", {id: randomUUID(), name: "Wrong share",
      graphId: graph, sharedGraphId: randomUUID()})).status, 400);
    assert.equal((await call(service, "/bots", {id: randomUUID(), name: "Other", sharedGraphId: graph}, member)).status, 403);
    const main = (await call(service, path(source), null, member)).body;
    assert.equal(main.canManage, false);
    assert.deepEqual(main.mentionableBots.map(bot => bot.id), [target]);
    assert.equal((await call(service, path(source), null, outsider)).status, 404);
    assert.equal((await call(service, path(source) + "/messages",
      {id: randomUUID(), body: "Private handoff", targetBotId: privateBot})).status, 404);
    const attachment = randomUUID();
    const uploadPath = path(source) + "/uploads/" + attachment;
    const upload = (subject, body) => service.handle(subject, new Request("http://local" + uploadPath,
      {method: "PUT", body}));
    assert.equal((await upload(outsider, "review evidence")).status, 404);
    assert.equal((await upload(member, "review evidence")).status, 200);
    assert.equal((await upload(member, "review evidence")).status, 200);
    assert.equal((await upload(owner, "review evidence")).status, 409);
    const payload = {id: randomUUID(), body: "", targetBotId: target,
      attachments: [{id: attachment, name: "notes.txt"}]};
    const sends = await Promise.all([1, 2].map(() => call(service, path(source) + "/messages", payload, member)));
    assert.deepEqual(sends.map(result => result.status), [200, 200]);
    const inbox = (await call(service, path(target), null, member)).body;
    assert.equal(inbox.sessions.length, 0);
    assert.equal(inbox.messages.length, 1);
    assert.equal(inbox.messages[0].handoff.source_id, source);
    assert.equal(inbox.messages[0].attachments[0].name, "notes.txt");
    const send = await call(service, path(source) + "/messages",
      {id: randomUUID(), body: "Run the review", targetBotId: target, agent: "codex"}, member);
    assert.equal(send.status, 200);
    const report = await waitFor(() => call(service, path(target), null, member),
      result => result.sessions?.[0]?.status === "completed");
    assert.equal(report.sessions[0].agent, "codex");
    memberships.delete(member);
    assert.equal((await call(service, path(target), null, member)).status, 404);
    assert.equal((await call(service, "/bots", null, member)).body.bots.length, 0);
  } finally {
    await service.close();
  }
});

test("Cursor uses the Cloud Agents API for creation, replies and follow-ups", async t => {
  const session = randomUUID(), agentId = "bc-" + session;
  const runId = "run-" + randomUUID(), followup = "run-" + randomUUID();
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const endpoint = new URL(url);
    assert.equal(endpoint.origin, "https://api.cursor.com");
    assert.equal(options.headers.authorization, "Bearer local-fixture");
    const body = options.body && JSON.parse(options.body);
    calls.push([options.method, endpoint.pathname, body]);
    const agentPath = "/v1/agents/" + agentId;
    if (endpoint.pathname === "/v1/agents") {
      assert.equal(body.agentId, agentId);
      assert.deepEqual(body.model, {id: "grok-4.7"});
      assert.equal(body.autoCreatePR, false);
      assert.equal(body.workOnCurrentBranch, false);
      assert.equal(body.repos, undefined);
      assert.equal(body.prompt.images[0].mimeType, "image/png");
      return Response.json({agent: {id: agentId, url: "https://cursor.com/agents/" + agentId},
        run: {id: runId}});
    }
    if (endpoint.pathname === agentPath + "/runs") {
      assert.equal(body.prompt.text, "Refine it");
      assert.deepEqual(body.model, {id: "grok-4.7"});
      return Response.json({run: {id: followup}}, {status: 201});
    }
    assert.match(endpoint.pathname, new RegExp("^" + agentPath + "/runs/run-"));
    return Response.json({status: "FINISHED", result: "Review complete."});
  });
  const env = {LOGSEQ_BOTS_AGENT_OWNER: owner, CURSOR_API_KEY: "local-fixture"};
  assert.equal(makeAgents({...env, CURSOR_API_KEY: undefined}).cursor, undefined);
  const cursor = makeAgents(env).cursor;
  const command = {state: "queued", session_id: session, prompt: "Review this"};
  assert.equal((await cursor({...command, repository: "logseq/mobile"})).state, "failed");
  assert.equal((await cursor({...command, files: [{payload: Buffer.from("plain file")}]})).state, "failed");
  assert.equal(calls.length, 0);
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const started = await cursor({...command, files: [{name: "preview.png", payload: png}]});
  assert.equal(started.providerSessionId, agentId);
  assert.equal(started.cursor, runId);
  const existing = {...command, provider_session_id: started.providerSessionId};
  assert.deepEqual(await cursor({...existing, state: "poll", provider_cursor: started.cursor}),
    {state: "done", reply: "Review complete."});
  const next = await cursor({...existing, prompt: "Refine it"});
  assert.equal(next.cursor, followup);
  assert.equal((await cursor({...existing, state: "poll", provider_cursor: next.cursor})).state, "done");
  assert.deepEqual(calls.map(call => call[0]), ["POST", "GET", "POST", "GET"]);
});


test("multiple Agents share one Thread and resume their own upstream sessions", {skip: !database}, async () => {
  const bot = randomUUID();
  const seen = [];
  const providers = Object.fromEntries(["cursor", "codex", "pi", "devin"].map(name => [name, async job => {
    seen.push({name, prompt: job.prompt, providerId: job.provider_session_id});
    return {state: "done", providerSessionId: job.provider_session_id ?? "external-" + name, reply: "Reply from " + name};
  }]));
  const service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database}, {providers});
  const main = `/bots/${bot}`;
  try {
    await call(service, "/bots", {id: bot, name: "Agent workshop", defaultAgent: "cursor"});
    const first = await call(service, main + "/messages", {id: randomUUID(), body: "Propose a title", agent: "cursor"});
    assert.ok(first.body.sessionId);
    const thread = main + "/sessions/" + first.body.sessionId;
    const latest = () => call(service, thread);
    const initial = await waitFor(latest, data => data.session?.status === "completed");
    assert.deepEqual(initial.participants, ["cursor"]);
    for (const [index, name] of ["codex", "pi", "devin", "cursor"].entries()) {
      const result = await call(service, thread + "/messages",
        {id: randomUUID(), body: "Build on the earlier turns", ...(name === "cursor" ? {} : {agent: name})});
      assert.equal(result.body.sessionId, first.body.sessionId);
      await waitFor(latest, data => data.session?.status === "completed" && data.messages.length === 3 + 2 * index);
    }
    assert.deepEqual(seen.map(job => job.name), ["cursor", "codex", "pi", "devin", "cursor"]);
    assert.match(seen[1].prompt, /Reply from cursor/);
    assert.match(seen[3].prompt, /Reply from pi/);
    assert.equal(seen[4].providerId, "external-cursor");
    assert.match(seen[4].prompt, /Reply from devin/);
    const final = (await latest()).body;
    assert.deepEqual(final.participants, ["cursor", "codex", "pi", "devin"]);
    assert.equal(final.session.provider_session_id, "external-cursor");
    assert.equal((await call(service, main)).body.sessions.length, 1);
  } finally {
    await service.close();
  }
});

test("an ordered Agent mention dispatches one workflow and stops at a blocked step", {skip: !database}, async () => {
  const bot = randomUUID();
  const seen = [];
  const providers = Object.fromEntries(["pi", "codex", "cursor", "devin"].map(name => [name, async job => {
    seen.push({name, prompt: job.prompt});
    if (name === "codex" && job.prompt.includes("Blocked workflow")) {
      return {state: "needs_input", reply: "Which platform?"};
    }
    return {state: "done", reply: "Reply from " + name};
  }]));
  const service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database}, {providers});
  const main = `/bots/${bot}`;
  try {
    await call(service, "/bots", {id: bot, name: "Workflow", defaultAgent: "pi"});
    const request = {id: randomUUID(), body: "Ship session search", agents: ["pi", "codex", "cursor", "devin"]};
    const first = await call(service, main + "/messages", request);
    assert.equal(first.status, 200);
    assert.equal((await call(service, main + "/messages", request)).body.sessionId, first.body.sessionId);
    assert.equal((await call(service, main + "/messages", {...request, agents: ["codex", "pi"]})).status, 409);
    const thread = main + "/sessions/" + first.body.sessionId;
    const finished = await waitFor(() => call(service, thread), data => data.session?.status === "completed");
    assert.deepEqual(finished.root.requested_agents, request.agents);
    assert.deepEqual(finished.participants, request.agents);
    assert.deepEqual(finished.messages.filter(item => item.author !== "bot").map(item => item.author), request.agents);
    assert.equal(finished.session.reply_count, 4);
    assert.deepEqual(seen.map(item => item.name), request.agents);
    assert.match(seen[3].prompt, /step 4 of 4/);
    assert.match(seen[3].prompt, /Ship session search/);
    for (const preceding of request.agents.slice(0, -1)) {
      assert.ok(seen[3].prompt.includes("Reply from " + preceding));
    }
    assert.equal((await call(service, main)).body.sessions.length, 1);

    const blocked = await call(service, main + "/messages",
      {id: randomUUID(), body: "Blocked workflow", agents: ["pi", "codex", "cursor"]});
    const paused = await waitFor(() => call(service, main + "/sessions/" + blocked.body.sessionId),
      data => data.session?.status === "needs_input");
    assert.deepEqual(paused.participants, ["pi", "codex"]);
    assert.equal(paused.messages.at(-1).body, "Which platform?");
  } finally {
    await service.close();
  }
});

test("Cursor replies with a readable usage-limit message", async t => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({error: {code: "usage_limit_exceeded"}}, {status: 400}));
  const cursor = makeAgents({LOGSEQ_BOTS_AGENT_OWNER: owner, CURSOR_API_KEY: "local-fixture"}).cursor;
  const result = await cursor({state: "queued", session_id: randomUUID(), prompt: "Check the configuration"});
  assert.deepEqual(result, {state: "failed", reply: "Cursor Cloud usage limit reached."});
});

test("paired devices claim only their own jobs and continue the same workflow and provider session", {skip: !database}, async () => {
  const localOwner = randomUUID();
  const outsider = randomUUID();
  const botId = randomUUID();
  const seen = [];
  const service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database}, {providers: {
    codex: async () => { assert.fail("A paired offline device must retain the queued job"); },
    cursor: async job => {
      seen.push(job.prompt);
      return {state: "done", reply: "Reviewed"};
    },
  }});
  const db = new Client({connectionString: database});
  await db.connect();
  const main = "/bots/" + botId;
  const callOwner = (path, body, subject = localOwner) => call(service, path, body, subject);
  async function runner(device, path, {lease, body} = {}) {
    const response = await service.handleRunner(new Request("http://127.0.0.1/bots/runner" + path, {
      method: "POST", headers: {authorization: "Bearer " + device.credential, ...(lease ? {"x-logseq-lease": lease} : {})},
      body: body ? JSON.stringify(body) : undefined,
    }));
    return {status: response.status, body: await response.json()};
  }
  async function pair(subject = localOwner, repository = "logseq/mobile") {
    const response = await callOwner("/bots/runners", {name:"Device", agents:["codex"], repository}, subject);
    assert.equal(response.status, 200);
    return response.body;
  }
  try {
    const firstDevice = await pair();
    const secondDevice = await pair();
    const otherAccount = await pair(outsider);
    const wrongRepo = await pair(localOwner, "logseq/other");
    const devices = (await callOwner("/bots/runners")).body.runners;
    assert.equal(devices.length, 3);
    assert.ok(devices.every(device => !device.online && !("credential" in device)));
    const available = (await callOwner("/bots")).body.agents;
    assert.equal(available.find(item => item.name === "codex").available, true);
    await callOwner("/bots", {id:botId, name:"Paired Bot", defaultAgent:"codex", repository:"logseq/mobile"});
    const send = await callOwner(main + "/messages", {id:randomUUID(), agents:["codex","cursor"], body:"Deliver title search"});
    const thread = main + "/sessions/" + send.body.sessionId;
    await sleep(1200);
    assert.equal((await callOwner(thread)).body.session.status, "queued");
    assert.equal((await runner(otherAccount, "/claim")).body.job, null);
    assert.equal((await runner(wrongRepo, "/claim")).body.job, null);
    const {job: original} = (await runner(firstDevice, "/claim")).body;
    assert.ok(original.lease);
    assert.equal((await runner(secondDevice, "/claim")).body.job, null);
    assert.equal((await runner(firstDevice, "/claim")).body.job, null);
    assert.equal((await runner(secondDevice, "/runs/" + original.id + "/start", {lease:original.lease})).status, 409);
    await db.query("UPDATE bot_runs SET lease_until=now()-interval '1 second' WHERE message_id=$1", [original.id]);
    const reassigned = await waitFor(() => runner(secondDevice, "/claim"), value => value.job != null);
    const job = reassigned.job;
    assert.equal(job.id, original.id);
    assert.notEqual(job.lease,original.lease);
    const action = suffix => "/runs/" + job.id + "/" + suffix;
    const result = {state:"done", reply:"Local change verified",providerSessionId:"local-codex-thread"};
    assert.equal((await runner(secondDevice, action("complete"), {lease:job.lease,body:result})).status,409);
    assert.equal((await runner(secondDevice, action("start"), {lease:job.lease})).status,200);
    assert.equal((await runner(secondDevice, action("renew"), {lease:job.lease})).status,200);
    assert.equal((await runner(secondDevice, action("complete"), {lease:job.lease,body:result})).status,200);
    assert.equal((await runner(secondDevice, action("complete"), {lease:job.lease,body:result})).status,200);
    assert.equal((await runner(secondDevice, action("complete"), {lease:job.lease,body:{...result,reply:"Different"}})).status,409);
    const completed = await waitFor(() => callOwner(thread), value => value.session?.status === "completed");
    assert.deepEqual(completed.participants,["codex","cursor"]);
    assert.equal(completed.messages.filter(message => message.author === "codex").length,1);
    assert.match(seen[0], /Local change verified/);

    await callOwner(thread + "/messages", {id:randomUUID(), body:"Follow up"});
    assert.equal((await runner(firstDevice,"/claim")).body.job,null);
    const {job:followup} = (await runner(secondDevice,"/claim")).body;
    assert.equal(followup.provider_session_id,"local-codex-thread");
    assert.equal((await runner(secondDevice,"/runs/" + followup.id + "/start",{lease:followup.lease})).status,200);
    await db.query("UPDATE bot_runs SET lease_until=now()-interval '1 second' WHERE message_id=$1", [followup.id]);
    await waitFor(() => callOwner(thread), value => value.session?.status === "attention");
    assert.equal((await runner(secondDevice,"/claim")).body.job,null);
    assert.equal((await callOwner("/bots/runners/" + secondDevice.id + "/revoke",{},outsider)).status,404);
    assert.equal((await runner(secondDevice,"/revoke")).status,200);
    assert.equal((await runner(secondDevice,"/claim")).status,401);
  } finally {
    await service.close();
    await db.end();
  }
});
