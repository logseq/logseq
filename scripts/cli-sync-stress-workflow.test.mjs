import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/cli-sync-stress.yml", import.meta.url);

test("CLI sync stress workflow runs local sync/offline stress and validates the graph", () => {
  const workflow = readFileSync(workflowPath, "utf8");

  assert.match(workflow, /^name: CLI sync stress$/m);
  assert.match(workflow, /pnpm --dir deps\/db-sync build:node-adapter/);
  assert.match(workflow, /opam exec -- pnpm cli:release/);
  assert.match(workflow, /pnpm db-worker-node:release:bundle/);
  assert.match(workflow, /alg: "RS256"/);
  assert.match(workflow, /kid: "cli-sync-stress"/);
  assert.match(workflow, /generateKeyPairSync/);
  assert.match(workflow, /createSign/);
  assert.match(workflow, /http:\/\/127\.0\.0\.1:19091/);
  assert.match(workflow, /http\.createServer/);
  assert.match(workflow, /LOGSEQ_CLI_ROOT_DIR/);
  assert.match(workflow, /HOME: \$\{\{ github\.workspace \}\}\/tmp\/cli-sync-stress\/home/);
  assert.match(workflow, /node scripts\/cli-concurrent-edit-stress\.mjs/);
  assert.match(workflow, /--sync/);
  assert.match(workflow, /--offline/);
  assert.match(workflow, /--no-e2ee/);
  assert.match(workflow, /--max-ops 1000/);
  assert.match(workflow, /graph validate --graph "\$GRAPH" --output json/);
});
