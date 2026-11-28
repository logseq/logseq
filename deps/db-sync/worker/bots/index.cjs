const {readFileSync} = require("node:fs");
const {join} = require("node:path");
const {Pool} = require("pg");
const {makeAgents} = require("./providers.cjs");
const {createBotRuntime} = require("./runtime.cjs");

async function createBotService(env = process.env, options = {}) {
  const pool = new Pool({connectionString: env.LOGSEQ_BOTS_DATABASE_URL});
  const runtime = createBotRuntime(pool, env, {
    ...options, providers: options.providers ?? makeAgents(env),
    unrestricted: Boolean(options.providers), workLeaseSeconds: 25 * 60,
  });
  let serviceLock;
  try {
    serviceLock = await pool.connect();
    const {rows: [lock]} = await serviceLock.query("SELECT pg_try_advisory_lock(35927681) AS acquired");
    if (!lock.acquired) throw new Error("The Bots database already has a running Node worker");
    await pool.query(readFileSync(join(__dirname, "schema.sql"), "utf8"));
    await pool.query("DELETE FROM bot_uploads WHERE message_id IS NULL AND created_at < now() - interval '7 days'");
    await runtime.recoverServerWork();
  } catch (error) {
    serviceLock?.release(true);
    await pool.end();
    throw error;
  }

  const running = new Set();
  const reportWorkerError = error => console.error("Bots worker failed", error.code ?? error.name);
  let pending = null;
  const tick = async () => {
    await runtime.maintain();
    if (running.size < 4) {
      const job = await runtime.claimNext();
      if (job) {
        const operation = runtime.work(job).catch(reportWorkerError).finally(() => running.delete(operation));
        running.add(operation);
      }
    }
    await runtime.exportGraph();
  };
  const timer = setInterval(() => {
    if (!pending) pending = tick().catch(reportWorkerError).finally(() => { pending = null; });
  }, 1000);
  timer.unref();

  return {
    handle: runtime.handle,
    handleRunner: runtime.handleRunner,
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
