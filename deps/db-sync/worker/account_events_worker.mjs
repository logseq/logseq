import {DurableObject} from "cloudflare:workers";
import events from "./account_events.cjs";
import {botsGraphAccess, eventsIdentity, relayReady, relayFrame} from "./dist/worker/main.js";

const graphStub = (env, graph) => env.LOGSEQ_SYNC_DO.getByName(graph);
const accountStub = (env, account) => env.LOGSEQ_ACCOUNT_EVENTS.getByName(account);
const relayPrefix = "account-events/";

export function accountEventPublisher(env) {
  if (env.LOGSEQ_ACCOUNT_EVENTS) return (account, event) => accountStub(env, account).publish(event);
}

export function onlineAccountRunners(env) {
  if (env.LOGSEQ_ACCOUNT_EVENTS) return account => accountStub(env, account).onlineRunners();
}

export async function upgradeAccountEvents(request, env, runnerIdentity) {
  if (request.method !== "GET" || request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response(null, {status: 426});
  }
  const identity = events.isRunnerRequest(request)
    ? await runnerIdentity(request, env) : await eventsIdentity(request, env);
  if (!identity || !request.headers.get("authorization")?.startsWith("Bearer ")) {
    return new Response(null, {status: 401});
  }
  const headers = new Headers(request.headers);
  headers.delete("authorization");
  headers.set("x-logseq-event-identity", encodeURIComponent(JSON.stringify(identity)));
  return accountStub(env, identity.account).fetch(new Request("https://account.events/", {headers}));
}

export class AccountEvents extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    const {hasGraphAccess} = botsGraphAccess(env.DB);
    this.pending = new WeakMap();
    this.connection = {
      load: socket => socket.deserializeAttachment(),
      save: (socket, connection) => socket.serializeAttachment(connection),
      graph: {
        hasAccess: hasGraphAccess,
        subscribe: connection => graphStub(env, connection.graphId).eventsSubscribe(connection),
        unsubscribe: connection => graphStub(env, connection.graphId).eventsUnsubscribe(connection.subscription),
        frame: (connection, frame) => graphStub(env, connection.graphId).eventsFrame(connection, frame),
      },
    };
  }

  fetch(request) {
    const identity = JSON.parse(decodeURIComponent(request.headers.get("x-logseq-event-identity")));
    if (!identity?.account || request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response(null, {status: 401});
    }
    if (this.ctx.getWebSockets().length >= 24) return new Response(null, {status: 429});
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    this.connection.save(server, identity);
    events.ready(server, identity);
    return new Response(null, {status: 101, webSocket: client});
  }

  async webSocketMessage(socket, raw) {
    const pending = Promise.resolve(this.pending.get(socket))
      .then(() => events.receive(socket, raw, this.connection));
    this.pending.set(socket, pending);
    try {
      await pending;
    } finally {
      if (this.pending.get(socket) === pending) this.pending.delete(socket);
    }
  }

  async webSocketClose(socket, code, reason) {
    socket.close(code === 1005 || code === 1006 ? 1000 : code, reason);
    await this.pending.get(socket);
    const connection = this.connection.load(socket);
    if (connection) await events.unsubscribe(connection, this.connection.graph);
  }

  webSocketError(socket) {
    return this.webSocketClose(socket, 1011, "Connection failed");
  }

  publish(event) {
    for (const socket of this.ctx.getWebSockets()) {
      events.publishEvent(socket, this.connection.load(socket), event);
    }
  }

  onlineRunners() {
    return this.ctx.getWebSockets().map(socket =>
      socket.readyState === 1 ? this.connection.load(socket)?.runnerId : null).filter(Boolean);
  }

  async graphChanged(account, graphId, frame) {
    const sockets = this.ctx.getWebSockets();
    if (!sockets.some(socket => this.connection.load(socket)?.graphId === graphId)) return false;
    if (!await this.connection.graph.hasAccess(account, graphId)) return false;
    for (const socket of sockets) {
      events.sendGraphChange(socket, this.connection.load(socket), graphId, frame);
    }
    return true;
  }
}

export function withAccountEvents(GraphSyncDO) {
  return class SyncDO extends GraphSyncDO {
    constructor(ctx, env) {
      super(ctx, env);
      this.accountEventsBroadcast = frame => {
        ctx.waitUntil(this.broadcastGraphChange(frame).catch(error =>
          console.error("Logseq Graph notification failed", error.code ?? error.name)));
      };
    }

    subscriptions() {
      this.subscriptionRecords ??= this.ctx.storage.list({prefix: relayPrefix});
      return this.subscriptionRecords;
    }

    async eventsSubscribe({graphId, account, subscription, expiresAt}) {
      if (!await relayReady(this, graphId)) return false;
      const records = await this.subscriptions();
      const key = relayPrefix + subscription;
      const value = {account, graphId, expiresAt};
      await this.ctx.storage.put(key, value);
      records.set(key, value);
      return true;
    }

    async eventsUnsubscribe(subscription) {
      const records = await this.subscriptions();
      const key = relayPrefix + subscription;
      await this.ctx.storage.delete(key);
      records.delete(key);
    }

    eventsFrame({graphId, user}, frame) {
      return relayFrame(this, graphId, user, frame);
    }

    async broadcastGraphChange(frame) {
      const entries = await this.subscriptions();
      const recipients = new Map();
      const expired = [];
      for (const [key, {account, graphId, expiresAt}] of entries) {
        if (expiresAt > Date.now()) recipients.set(account, graphId);
        else expired.push(key);
      }
      for (const key of expired) entries.delete(key);
      for (let start = 0; start < expired.length; start += 128) {
        await this.ctx.storage.delete(expired.slice(start, start + 128));
      }
      await Promise.all([...recipients].map(([account, graphId]) =>
        accountStub(this.env, account).graphChanged(account, graphId, frame)));
    }
  };
}
