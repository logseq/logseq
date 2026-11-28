import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import pg from "pg";
import {createWorkerBots, scheduleEarlier} from "./worker.mjs";

const url = process.env.LOGSEQ_BOTS_WORKER_TEST_DATABASE_URL;
const owner = "worker-" + randomUUID();
const graph = randomUUID(), block = randomUUID();
const exports = [];
let alarm = null;
let writes = 0;
const state = {
  blockConcurrencyWhile: callback => callback(),
  storage: {
    getAlarm: async () => alarm,
    setAlarm: async time => { alarm = time; writes++; },
  },
};
const bots = createWorkerBots({
  subject: request => request.headers.get("x-fixture-subject"),
  graphAccess: () => ({graphsFor: async account => account === owner ? [graph] : []}),
  wake: (_env, time) => scheduleEarlier(state, time),
  graphFetch: async request => {
    exports.push({path: new URL(request.url).pathname, body: await request.json()});
    return Response.json({saved: true});
  },
});
const env = {
  LOGSEQ_BOTS_HYPERDRIVE: {connectionString: url}, LOGSEQ_BOTS_MOCK: "1",
  LOGSEQ_BOTS_GRAPH_TOKEN: "fixture-only", LOGSEQ_BOTS_GRAPH_OWNER: owner,
  LOGSEQ_BOTS_GRAPH_ID: graph, DB_SYNC_BASE_URL: "https://fixture.invalid",
};

async function call(path, body, {sub = owner, credential, lease, method = body ? "POST" : "GET"} = {}) {
  const wait = [];
  const response = await bots.fetch(new Request("https://fixture.invalid" + path, {
    method,
    headers: {
      ...(sub ? {"x-fixture-subject": sub} : {}),
      ...(credential ? {authorization: "Bearer " + credential} : {}),
      ...(lease ? {"x-logseq-lease": lease} : {}),
    },
    body: body instanceof Uint8Array ? body : body ? JSON.stringify(body) : undefined,
  }), env, {waitUntil: promise => wait.push(promise)});
  await Promise.all(wait);
  return {status: response.status, data: await response.json()};
}

async function runAlarm() {
  assert.notEqual(alarm, null);
  alarm = null;
  const next = await bots.runDue(env);
  if (next !== null) await scheduleEarlier(state, next);
}

test("disabled Worker keeps Bots unavailable and scheduled work idle", async () => {
  assert.equal((await bots.fetch(new Request("https://fixture.invalid/bots"), {}, {})).status, 503);
  await bots.repair({}, Date.now());
});

test("alarms coalesce future wakeups and preserve the earlier deadline", async () => {
  await scheduleEarlier(state, 100);
  await scheduleEarlier(state, 150);
  await scheduleEarlier(state, 100);
  assert.equal(writes, 1);
  await scheduleEarlier(state, 90);
  assert.equal(alarm, 90);
  assert.equal(writes, 2);
  alarm = null;
});

test("Worker arms only due work and drives device workflows and cloud recovery", {skip: !url}, async () => {
  const db = new pg.Client({connectionString: url});
  await db.connect();
  try {
    await db.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
    await bots.repair(env, Date.now());
    assert.equal(alarm, null);
    assert.equal((await call("/bots", null, {sub: null})).status, 401);
    const paired = await call("/bots/runners", {name: "Test device", agents: ["pi"]});
    assert.equal(paired.status, 200);
    const {credential} = paired.data;
    const device = (path, body, lease) => call("/bots/runner/" + path, body, {sub: null, credential, lease, method: "POST"});
    const main = "/bots/" + randomUUID();
    const created = await call("/bots", {id: main.slice(6), name: "Worker test", defaultAgent: "pi",
      graphId: graph, graphBlockId: block});
    assert.equal(created.status, 200);
    await call(main + "/messages", {id: randomUUID(), body: "Ordinary chat"});
    assert.equal(alarm, null);
    const started = await call(main + "/messages", {id: randomUUID(), agents: ["pi", "cursor"], body: "Ship Bots"});
    assert.equal(started.status, 200);
    const thread = main + "/sessions/" + started.data.sessionId;
    await runAlarm();
    assert.equal(alarm, null, "An offline device does not cause repeated alarms");
    assert.equal((await call(thread)).data.session.status, "queued");
    assert.equal((await call(thread, null, {sub: owner + "-other"})).status, 404);
    const {job} = (await device("claim")).data;
    assert.equal(job.agent, "pi");
    assert.equal(alarm, job.leaseExpiresAt);
    const previousWrites = writes;
    assert.equal((await device("claim")).data.job, null);
    assert.equal(writes, previousWrites);
    assert.equal((await device("runs/" + job.id + "/start", null, job.lease)).status, 200);
    const complete = {state: "done", reply: "Desktop evidence", providerSessionId: "pi-thread"};
    await Promise.all([device("runs/" + job.id + "/complete", complete, job.lease),
      device("runs/" + job.id + "/complete", complete, job.lease)]).then(results =>
      assert.ok(results.every(result => result.status === 200)));
    assert.ok(alarm < job.leaseExpiresAt);
    await runAlarm();
    assert.equal(alarm, null);
    const delivered = (await call(thread)).data;
    assert.equal(delivered.session.status, "completed");
    assert.deepEqual(delivered.participants, ["pi", "cursor"]);
    assert.equal(delivered.messages.filter(message => message.author === "pi").length, 1);
    assert.match(delivered.messages.at(-1).body, /Desktop evidence/);
    assert.equal(exports[0].path, `/api/v1/graphs/${graph}/blocks/${block}/children`);
    assert.match(exports[0].body.blocks[0].title, /Desktop evidence/);

    const file = randomUUID();
    assert.equal((await call(main + "/uploads/" + file, new Uint8Array([1, 2, 3]), {method: "PUT"})).status, 200);
    const attached = await call(main + "/messages", {id: randomUUID(), agent: "cursor",
      body: "Review the attachment", attachments: [{id: file, name: "fixture.png"}]});
    const attachmentThread = main + "/sessions/" + attached.data.sessionId;
    assert.equal((await call(attachmentThread)).data.session.status, "queued");
    await runAlarm();
    assert.match((await call(attachmentThread)).data.messages.at(-1).body, /Attachments: fixture.png/);

    const automation = randomUUID();
    assert.equal((await call(main + "/automations", {id: automation, agent: "cursor", prompt: "Scheduled check",
      timeZone: "UTC", weekday: 1, hour: 9, minute: 0})).status, 200);
    await runAlarm();
    assert.ok(alarm > Date.now(), "The next weekly occurrence has its own deadline");
    alarm = null;
    await db.query("UPDATE bot_automations SET next_at=now()-interval '2 minutes' WHERE id=$1", [automation]);
    await bots.repair(env, Date.now());
    await runAlarm();
    assert.ok((await call(main)).data.messages.some(message => message.body === "Mock cursor: Scheduled check"));

    // Simulate the loss of a provider invocation before it can settle.
    const startId = randomUUID();
    const pollId = randomUUID();
    const queue = await Promise.all([
      call(main + "/messages", {id: startId, agent: "pi", body: "Unconfirmed start"}),
      call(main + "/messages", {id: pollId, agent: "pi", body: "Interrupted poll"}),
    ]);
    await db.query(`UPDATE bot_runs SET agent='cursor',state='working',lease_id=$3,lease_until=now()-interval '1 second',
      work_from=CASE WHEN message_id=$1 THEN 'queued' ELSE 'poll' END
      WHERE message_id IN ($1,$2)`, [startId, pollId, randomUUID()]);
    await runAlarm();
    const versions = await Promise.all(queue.map(item => call(main + "/sessions/" + item.data.sessionId)));
    assert.equal(versions[0].data.session.status, "attention");
    assert.equal(versions[1].data.session.status, "completed");
    assert.equal(versions[1].data.messages.at(-1).body, "Mock cursor: Interrupted poll");
  } finally {
    await db.end();
  }
});
