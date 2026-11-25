const leaseMs = 90_000;
const retentionMs = 24 * 60 * 60 * 1000;
const activityLifetimeMs = 60 * 60 * 1000;
const title = "Logseq";
const body = "New activity in a discussion.";
const providerTokens = new Map();

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function jwt(algorithm, header, payload, privateKey) {
  const encoder = new TextEncoder();
  const encode = (json) => base64url(encoder.encode(JSON.stringify(json)));
  const input = encode(header) + "." + encode(payload);
  const pem = privateKey.replace(/-----[^-]+-----|\s/g, "");
  const pkcs8 = Uint8Array.from(atob(pem), char => char.charCodeAt(0));
  const parameters = algorithm === "ES256"
    ? { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" }
    : { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, parameters, false, ["sign"]);
  const signature = await crypto.subtle.sign(parameters, key, encoder.encode(input));
  return input + "." + base64url(new Uint8Array(signature));
}

function providerToken(key, lifetimeMs, issue) {
  const now = Date.now();
  const existing = providerTokens.get(key);
  if (existing && existing.expires > now) return existing.promise;
  const promise = Promise.resolve().then(issue).catch(error => {
    if (providerTokens.get(key)?.promise === promise) providerTokens.delete(key);
    throw error;
  });
  providerTokens.set(key, { expires: now + lifetimeMs, promise });
  return promise;
}

async function apns(env, device, route, send) {
  if (!env.APNS_KEY_ID || !env.APNS_TEAM_ID || !env.APNS_PRIVATE_KEY || !env.APNS_TOPIC) {
    return "retry";
  }
  const key = "apns:" + env.APNS_TEAM_ID + ":" + env.APNS_KEY_ID;
  const token = await providerToken(key, 50 * 60_000, () => jwt("ES256",
    { alg: "ES256", kid: env.APNS_KEY_ID },
    { iss: env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) }, env.APNS_PRIVATE_KEY));
  const host = device.platform === "apns-sandbox" ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  const response = await send(`https://${host}/3/device/${device.token}`, {
    method: "POST",
    headers: {
      authorization: "bearer " + token,
      "apns-topic": env.APNS_TOPIC,
      "apns-push-type": "alert",
      "apns-collapse-id": route.eventId,
      "apns-expiration": String(Math.floor(Date.now() / 1000) + 3600),
      "content-type": "application/json",
    },
    body: JSON.stringify({ aps: { alert: { title, body }, sound: "default" }, ...route }),
  });
  if (response.ok) return "sent";
  const error = await response.json().catch(() => ({}));
  if (response.status === 410 || error.reason === "BadDeviceToken") return "expired";
  if (error.reason === "ExpiredProviderToken") providerTokens.delete(key);
  return "retry";
}

async function fcm(env, device, route, send) {
  const project = env.FCM_PROJECT_ID;
  const email = env.FCM_CLIENT_EMAIL;
  if (!project || !email || !env.FCM_PRIVATE_KEY) return "retry";
  const key = "fcm:" + email;
  const token = await providerToken(key, 50 * 60_000, async () => {
    const endpoint = "https://oauth2.googleapis.com/token";
    const now = Math.floor(Date.now() / 1000);
    const assertion = await jwt("RS256", { alg: "RS256", typ: "JWT" }, {
      iss: email, scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: endpoint, iat: now, exp: now + 3600,
    }, env.FCM_PRIVATE_KEY);
    const response = await send(endpoint, {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    if (!response.ok) throw new Error("FCM authentication failed");
    const { access_token: token } = await response.json();
    if (typeof token !== "string") throw new Error("FCM token is missing");
    return token;
  });
  const response = await send(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(project)}/messages:send`, {
    method: "POST",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        token: device.token, notification: { title, body }, data: route,
        android: { priority: "HIGH", ttl: "3600s", notification: { channel_id: "discussions", tag: route.eventId } },
      },
    }),
  });
  if (response.ok) return "sent";
  const error = await response.json().catch(() => ({}));
  if (error.error?.details?.some(detail => detail.errorCode === "UNREGISTERED")) return "expired";
  if (response.status === 401) providerTokens.delete(key);
  return "retry";
}

export async function deliverDiscussionPush(env, device, route, send = fetch) {
  return device.platform === "fcm" ? fcm(env, device, route, send) : apns(env, device, route, send);
}

const matchesMember = `EXISTS (SELECT 1 FROM graphs WHERE graph_id = ? AND user_id = ?
  UNION SELECT 1 FROM graph_members WHERE graph_id = ? AND user_id = ?)`;

export async function processDiscussionPush(env, now = Date.now(), deliver = deliverDiscussionPush) {
  if (env.DISCUSSION_PUSH_ENABLED !== "true") return;
  const db = env.DB;
  const { results } = await db.prepare(`SELECT * FROM discussion_push_outbox
    WHERE next_attempt_at <= ? AND attempts >= 0 ORDER BY next_attempt_at LIMIT 20`).bind(now).all();
  for (const event of results) {
    const { graph_id: graph, event_id: id, recipient_id: recipient, sender_id: sender } = event;
    const eventKey = [graph, id, recipient];
    const result = await db.prepare(`UPDATE discussion_push_outbox SET next_attempt_at = ?
      WHERE graph_id = ? AND event_id = ? AND recipient_id = ? AND next_attempt_at = ?`)
      .bind(now + leaseMs, ...eventKey, event.next_attempt_at).run();
    if (!result.meta.changes) continue;
    const finish = () => db.prepare(`UPDATE discussion_push_outbox SET attempts = -1
      WHERE graph_id = ? AND event_id = ? AND recipient_id = ?`).bind(...eventKey).run();
    if (now - event.created_at > activityLifetimeMs) {
      await finish();
      continue;
    }
    const { results: devices } = await db.prepare(`SELECT installation_id, platform, token
      FROM discussion_push_devices d WHERE user_id = ?
      AND ${matchesMember} AND ${matchesMember}
      AND NOT EXISTS (SELECT 1 FROM discussion_push_receipts r WHERE r.graph_id = ?
        AND r.event_id = ? AND r.recipient_id = ? AND r.installation_id = d.installation_id)
      ORDER BY updated_at DESC LIMIT 10`)
      .bind(recipient, graph, recipient, graph, recipient, graph, sender, graph, sender, ...eventKey).all();
    let retry = false;
    for (const device of devices) {
      const status = await deliver(env, device, { graphId: graph, eventId: id }).catch(() => "retry");
      if (status === "expired") {
        await db.prepare(`DELETE FROM discussion_push_devices WHERE installation_id = ? AND token = ? AND user_id = ?`)
          .bind(device.installation_id, device.token, recipient).run();
      } else if (status === "sent") {
        await db.prepare("INSERT OR IGNORE INTO discussion_push_receipts VALUES (?, ?, ?, ?, ?)")
          .bind(...eventKey, device.installation_id, now).run();
      } else {
        retry = true;
      }
    }
    if (retry) {
      const delay = Math.min(15 * 60_000, 60_000 * 2 ** event.attempts);
      await db.prepare(`UPDATE discussion_push_outbox SET attempts = attempts + 1, next_attempt_at = ?
        WHERE graph_id = ? AND event_id = ? AND recipient_id = ?`).bind(now + delay, ...eventKey).run();
    } else {
      await finish();
    }
  }
  await db.batch([
    db.prepare("DELETE FROM discussion_push_outbox WHERE created_at < ?").bind(now - retentionMs),
    db.prepare("DELETE FROM discussion_push_receipts WHERE sent_at < ?").bind(now - retentionMs),
    db.prepare("DELETE FROM discussion_push_devices WHERE updated_at < ?").bind(now - 35 * retentionMs),
  ]);
}
