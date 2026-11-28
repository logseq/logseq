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

export function createWorkerBots({subject, graphAccess, graphFetch}) {
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
        if (response.ok && request.method === "POST" &&
            (runnerRequest ? path.endsWith("/complete") : path.endsWith("/messages"))) {
          // One short job can start immediately. Cron handles polling and uploads.
          ctx.waitUntil(withRuntime(env, async runtime => {
            const job = await runtime.claimNext({allowAttachments: false});
            if (job) await runtime.work(job);
          }).catch(error => logError("dispatch", error)));
        }
        return response;
      } catch (error) {
        logError("request", error);
        return Response.json({error: "The Bots request failed"}, {status: 500});
      }
    },

    async scheduled(env, scheduledTime, ctx) {
      if (!databaseUrl(env)) return;
      return withRuntime(env, async runtime => {
        const start = Date.now();
        await runtime.maintain({cleanUploads: new Date(scheduledTime).getUTCMinutes() === 0});
        for (let count = 0; count < 8 && Date.now() - start < 45_000; count++) {
          const job = await runtime.claimNext();
          if (!job) break;
          await runtime.work(job);
        }
        await runtime.exportGraph();
      }, ctx);
    },
  };
}
