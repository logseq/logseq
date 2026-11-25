import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { deliverDiscussionPush, processDiscussionPush } from "./discussion_push.mjs";

function applyMigration(sqlite, name) {
  sqlite.exec(readFileSync(new URL("./migrations/" + name, import.meta.url), "utf8"));
}

function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  applyMigration(sqlite, "0001_init.sql");
  applyMigration(sqlite, "0002_add_graph_e2ee.sql");
  applyMigration(sqlite, "0008_add_discussion_push.sql");
  sqlite.exec(`INSERT INTO graphs (graph_id, user_id) VALUES ('graph', 'sender');
    INSERT INTO graph_members (graph_id, user_id, role) VALUES ('graph', 'receiver', 'member');
    INSERT INTO discussion_push_devices (installation_id, user_id, platform, token, updated_at) VALUES ('device1','receiver','fcm','valid',1000),
      ('device2','receiver','fcm','retry',1000), ('device3','receiver','fcm','expired',1000);
    INSERT INTO discussion_push_outbox (graph_id, event_id, recipient_id, sender_id, created_at, next_attempt_at)
      VALUES ('graph','event','receiver','sender',1000,1000);`);
  applyMigration(sqlite, "0009_discussion_push_preferences.sql");
  applyMigration(sqlite, "0010_discussion_push_previews.sql");
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

test("the delivery worker applies each device's latest comment and reaction settings", async () => {
  const { sqlite, env } = fixture();
  sqlite.exec(`UPDATE discussion_push_outbox SET event_kind = 'comment';
    INSERT INTO discussion_push_outbox (graph_id, event_id, recipient_id, sender_id, created_at, next_attempt_at, event_kind)
      VALUES ('graph','reaction','receiver','sender',1000,1000,'reaction');
    UPDATE discussion_push_devices SET comments = 0 WHERE installation_id = 'device1';
    UPDATE discussion_push_devices SET reactions = 0 WHERE installation_id = 'device2';
    UPDATE discussion_push_devices SET comments = 0, reactions = 0 WHERE installation_id = 'device3';`);
  const sends = [];
  await processDiscussionPush(env, 1000, async (_env, device, route) => {
    sends.push([device.installation_id, route.eventId]);
    return "sent";
  });
  assert.deepEqual(sends.sort(), [["device1", "reaction"], ["device2", "event"]]);
});

test("APNs alerts show the author and actual reaction without changing the route", async () => {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const encoded = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const env = { APNS_KEY_ID: "test", APNS_TEAM_ID: "example", APNS_TOPIC: "com.logseq.logseq",
    APNS_PRIVATE_KEY: btoa(String.fromCharCode(...encoded)) };
  const outcome = await deliverDiscussionPush(env, { platform: "apns-sandbox", token: "test-token" },
    { graphId: "opaque-graph", eventId: "opaque-event" },
    { kind: "reaction", senderId: "sender", senderName: "Ada", reactionEmoji: "❤️" }, async (url, request) => {
      assert.equal(url, "https://api.sandbox.push.apple.com/3/device/test-token");
      assert.equal(request.headers["apns-push-type"], "alert");
      assert.equal(request.headers["apns-collapse-id"], "opaque-event");
      assert.equal(request.headers.authorization.split(".").length, 3);
      assert.deepEqual(JSON.parse(request.body), {
        aps: { alert: { title: "Ada", "loc-key": "discussion_push_reaction_emoji", "loc-args": ["❤️"] },
          sound: "default", "mutable-content": 1 },
        senderId: "sender", senderName: "Ada",
        graphId: "opaque-graph", eventId: "opaque-event",
      });
      return new Response(null, { status: 200 });
    });
  assert.equal(outcome, "sent");
});

test("deleting a user unlinks push devices and delivery history without a cron run", () => {
  const { sqlite } = fixture();
  sqlite.exec(`INSERT INTO users (id) VALUES ('receiver');
    INSERT INTO discussion_push_receipts VALUES ('graph', 'event', 'receiver', 'device1', 1000);
    DELETE FROM users WHERE id = 'receiver';`);
  for (const table of ["discussion_push_devices", "discussion_push_outbox", "discussion_push_receipts"]) {
    assert.equal(sqlite.prepare(`SELECT count(*) AS count FROM ${table}`).get().count, 0);
  }
});

test("FCM delivers presentation data to the Android notification service", async () => {
  const pair = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256",
  }, true, ["sign", "verify"]);
  const encoded = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const env = { FCM_PROJECT_ID: "test", FCM_CLIENT_EMAIL: "push@example.com",
    FCM_PRIVATE_KEY: btoa(String.fromCharCode(...encoded)) };
  const route = { graphId: "graph", eventId: "event" };
  const posted = [];
  const details = { kind: "comment", senderId: "sender", senderName: "Ada", commentPreview: "Thanks!" };
  const status = await deliverDiscussionPush(env, { platform: "fcm", token: "device" }, route, details,
    async (url, request) => {
      if (url === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "token" });
      posted.push(JSON.parse(request.body));
      assert.equal(request.headers.authorization, "Bearer token");
      return Response.json({ name: "message" });
    });
  assert.equal(status, "sent");
  assert.deepEqual(posted[0].message.data, { ...route, ...details });
  assert.deepEqual(posted[0].message.android, { priority: "HIGH", ttl: "3600s" });
});

test("only explicitly unencrypted graphs can send a comment preview", async () => {
  for (const encrypted of [0, 1, null]) {
    const { sqlite, env } = fixture();
    sqlite.prepare("UPDATE graphs SET graph_e2ee = ?").run(encrypted);
    sqlite.exec("UPDATE discussion_push_outbox SET event_kind = 'comment', comment_preview = 'private text'");
    const details = [];
    await processDiscussionPush(env, 1000, async (_env, _device, _route, presentation) => {
      details.push(presentation);
      return "sent";
    });
    assert.equal(details.length, 3);
    assert.ok(details.every(value => value.commentPreview === (encrypted === 0 ? "private text" : null)));
    assert.equal(sqlite.prepare("SELECT comment_preview FROM discussion_push_outbox").get().comment_preview, null);
  }
});
