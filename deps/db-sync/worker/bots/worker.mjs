import pg from "pg";
import runtimeModule from "./runtime.cjs";

const {Client} = pg;
const {createBotRuntime} = runtimeModule;

function databaseUrl(env) {
  return env.LOGSEQ_BOTS_HYPERDRIVE?.connectionString || env.LOGSEQ_BOTS_DATABASE_URL;
}

function logError(operation, error) {
  console.error("Bots " + operation + " failed", error.code ?? error.name);
}

async function wakeScheduler(env, time) {
  return env.LOGSEQ_BOTS_SCHEDULER.getByName("queue").wake(time);
}

async function deadline(request, path, response, publishes) {
  if (!response.ok) return null;
  if (publishes && ((request.method === "PATCH" && /^\/bots\/[^/]+$/.test(path)) ||
      (request.method === "POST" && (path === "/bots" || path.endsWith("/start"))))) return Date.now();
  if (request.method === "PATCH" && /\/automations\/[^/]+$/.test(path)) return Date.now();
  if (request.method !== "POST") return null;
  if (path.endsWith("/messages")) {
    if (publishes) return Date.now();
    const {sessionId, message} = await response.clone().json();
    return sessionId || message?.requested_agent ? Date.now() : null;
  }
  if (path === "/bots/runner/claim") {
    const {job} = await response.clone().json();
    return job?.leaseExpiresAt ?? null;
  }
  if (path.endsWith("/automations") || path.endsWith("/complete") || path.endsWith("/revoke")) {
    return Date.now();
  }
  return null;
}

export function scheduleEarlier(state, time) {
  return state.blockConcurrencyWhile(async () => {
    const alarm = await state.storage.getAlarm();
    if (alarm === null || time < alarm) await state.storage.setAlarm(time);
  });
}

export function createWorkerBots({subject, graphAccess, graphFetch, publisher, wake = wakeScheduler}) {
  async function withRuntime(env, operation, ctx) {
    const client = new Client({connectionString: databaseUrl(env), connectionTimeoutMillis: 5000});
    let connected;
    let closing = false;
    client.on("error", error => {
      // pg-cloudflare's pending socket read rejects when we close the client.
      if (closing && error.name === "TypeError" && error.message === "This socket has been closed.") return;
      logError("database connection", error);
    });
    try {
      // This invocation runs one HTTP request or a serial batch of scheduled jobs.
      const query = async (...args) => {
        connected ??= client.connect();
        await connected;
        return client.query(...args);
      };
      const connection = {query, release() {}};
      const runtime = createBotRuntime({query, connect: async () => connection}, env, {
        ...graphAccess(env.DB),
        publish: publisher?.(env),
        graphFetch: graphFetch && ((url, init) => graphFetch(new Request(url, init), env, ctx)),
      });
      return await operation(runtime);
    } finally {
      closing = true;
      if (connected) await client.end();
    }
  }

  return {
    async fetch(request, env, ctx, path = new URL(request.url).pathname) {
      if (!databaseUrl(env)) return Response.json({error: "Bots are unavailable"}, {status: 503});
      const runnerRequest = path.startsWith("/bots/runner/");
      try {
        const owner = runnerRequest ? null : await subject(request, env);
        if (!runnerRequest && !owner) return Response.json({error: "unauthorized"}, {status: 401});
        const response = await withRuntime(env, runtime => runnerRequest
          ? runtime.handleRunner(request) : runtime.handle(owner, request));
        const at = await deadline(request, path, response, Boolean(publisher?.(env)));
        if (at !== null) ctx.waitUntil(wake(env, at).catch(error => logError("wake", error)));
        return response;
      } catch (error) {
        logError("request", error);
        return Response.json({error: "The Bots request failed"}, {status: 500});
      }
    },

    async runDue(env, ctx) {
      if (!databaseUrl(env)) return null;
      return withRuntime(env, async runtime => {
        const start = Date.now();
        await runtime.maintain({automationLimit: 8});
        for (let count = 0; count < 8 && Date.now() - start < 45_000; count++) {
          const job = await runtime.claimNext();
          if (!job) break;
          await runtime.work(job);
        }
        for (let count = 0; count < 4 && Date.now() - start < 45_000; count++) {
          if (!await runtime.exportGraph()) break;
        }
        if (Date.now() - start < 45_000) await runtime.deliverEvents();
        const next = await runtime.nextActionAt();
        return next === null ? null : Math.max(next, Date.now() + 500);
      }, ctx);
    },

    async repair(env, scheduledTime) {
      if (!databaseUrl(env)) return;
      const next = await withRuntime(env, async runtime => {
        const date = new Date(scheduledTime);
        if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) await runtime.cleanStaleUploads();
        return runtime.nextActionAt();
      });
      if (next !== null && next <= Date.now()) await wake(env, next);
    },
  };
}
