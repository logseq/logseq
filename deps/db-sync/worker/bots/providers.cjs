const {cloudAgents, devinLimits} = require("./cloud-providers.cjs");
const {localAgents} = require("./local-agents.cjs");

function makeAgents(env) {
  if (env.LOGSEQ_BOTS_MOCK === "1" || !env.LOGSEQ_BOTS_AGENT_OWNER) return cloudAgents(env);
  return {...localAgents(env), ...cloudAgents(env)};
}

module.exports = {devinLimits, makeAgents};
