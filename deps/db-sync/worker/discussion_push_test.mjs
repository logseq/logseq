import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { deliverDiscussionPush, processDiscussionPush } from "./discussion_push.mjs";

function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  for (const name of ["0001_init.sql", "0008_add_discussion_push.sql"]) {
    sqlite.exec(readFileSync(new URL("./migrations/" + name, import.meta.url), "utf8"));
  }
  sqlite.exec(`INSERT INTO graphs (graph_id, user_id) VALUES ('graph', 'sender');
    INSERT INTO graph_members (graph_id, user_id, role) VALUES ('graph', 'receiver', 'member');
    INSERT INTO discussion_push_devices VALUES ('device1','receiver','fcm','valid',1000),
      ('device2','receiver','fcm','retry',1000), ('device3','receiver','fcm','expired',1000);
    INSERT INTO discussion_push_outbox VALUES ('graph','event','receiver','sender',1000,1000,0);`);
  const DB = {
    prepare(sql) {
      return { bind(...args) {
        const stmt = sqlite.prepare(sql);
        return {
          all: async () => ({ results: stmt.all(...args) }),
          run: async () => ({ meta: stmt.run(...args) }),
        };
      } };
    },
    batch: statements => Promise.all(statements.map(statement => statement.run())),
  };
  return { sqlite, env: { DISCUSSION_PUSH_ENABLED: "true", DB } };
}

test("push retries only the remaining device and removes expired registrations", async () => {
  const { sqlite, env } = fixture();
  const messages = [];
  const send = async (_env, device, route) => {
    messages.push({ token: device.token, route });
    return { valid: "sent", expired: "expired", retry: "retry" }[device.token];
  };
  await processDiscussionPush(env, 1000, send);
  await processDiscussionPush(env, 61_000, async (...args) => {
    await send(...args);
    return "sent";
  });
  assert.deepEqual(messages.map(message => message.token).sort(), ["expired", "retry", "retry", "valid"]);
  assert.deepEqual(messages[0].route, { graphId: "graph", eventId: "event" });
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM discussion_push_devices").get().count, 2);
  assert.equal(sqlite.prepare("SELECT attempts FROM discussion_push_outbox").get().attempts, -1);
});

test("the delivery worker rechecks membership after a member is removed", async () => {
  const { sqlite, env } = fixture();
  sqlite.exec("DELETE FROM graph_members WHERE user_id = 'receiver'");
  let attempts = 0;
  await processDiscussionPush(env, 1000, async () => { attempts++; return "sent"; });
  assert.equal(attempts, 0);
});

test("APNs alerts contain opaque routing IDs and generic text", async () => {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const encoded = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const env = { APNS_KEY_ID: "test", APNS_TEAM_ID: "example", APNS_TOPIC: "com.logseq.logseq",
    APNS_PRIVATE_KEY: btoa(String.fromCharCode(...encoded)) };
  const outcome = await deliverDiscussionPush(env, { platform: "apns-sandbox", token: "test-token" },
    { graphId: "opaque-graph", eventId: "opaque-event" }, async (url, request) => {
      assert.equal(url, "https://api.sandbox.push.apple.com/3/device/test-token");
      assert.equal(request.headers["apns-push-type"], "alert");
      assert.equal(request.headers["apns-collapse-id"], "opaque-event");
      assert.equal(request.headers.authorization.split(".").length, 3);
      assert.deepEqual(JSON.parse(request.body), {
        aps: { alert: { title: "Logseq", body: "New activity in a discussion." }, sound: "default" },
        graphId: "opaque-graph", eventId: "opaque-event",
      });
      return new Response(null, { status: 200 });
    });
  assert.equal(outcome, "sent");
});
