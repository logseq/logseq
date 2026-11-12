// Local preview: sync server, Tasks app, and the Logseq web app.
// The Cognito stand-in exists so this machine can record the flow without AWS.

import {createRequire} from "node:module";
import {spawn} from "node:child_process";
import {createServer} from "node:http";
import {createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from "node:fs";
import {dirname, extname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import crypto from "node:crypto";

const require = createRequire(import.meta.url);
const cognito = require("./local-cognito.cjs");
const here = dirname(fileURLToPath(import.meta.url));
const dbSyncRoot = resolve(here, "../..");
const repoRoot = resolve(dbSyncRoot, "../..");
const runtimeDir = "/tmp/logseq-tasks-demo";
const dataDir = join(runtimeDir, "data");
const keysPath = join(runtimeDir, "keys.json");
const syncPort = 8787;
const appPort = 8791;
const webPort = 3011;
const apiBase = `http://127.0.0.1:${syncPort}`;
const issuer = "https://cognito-idp.demo.local/us-east-1_tasksdemo";
const cognitoClientId = "tasks-demo-client";
const jwksUrl = `${apiBase}/tasks-demo-jwks`;
const graphName = "Tasks";
let syncProcess = null;

function mime(filePath) {
  switch (extname(filePath)) {
    case ".html": return "text/html; charset=utf-8";
    case ".js": return "text/javascript; charset=utf-8";
    case ".mjs": return "text/javascript; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".wasm": return "application/wasm";
    case ".svg": return "image/svg+xml";
    case ".png": return "image/png";
    case ".woff2": return "font/woff2";
    default: return "application/octet-stream";
  }
}

function listen(server, port) {
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolveListen());
  });
}

function sendFile(response, filePath) {
  response.writeHead(200, {"content-type": mime(filePath), "cache-control": "no-store"});
  createReadStream(filePath).pipe(response);
}

async function waitForHealth(child) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < 30000) {
    if (child.exitCode != null) {
      throw new Error("sync server exited before /health");
    }
    try {
      const response = await fetch(apiBase + "/health");
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveSleep) => setTimeout(resolveSleep, 250));
  }
  throw new Error("sync server did not become healthy: " + lastError);
}

async function jsonRequest(path, options) {
  const response = await fetch(apiBase + path, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(path + " " + response.status + " " + text);
  }
  return text ? JSON.parse(text) : null;
}

function serveTasks(config) {
  const root = here;
  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://127.0.0.1:${appPort}`);
    if (url.pathname === "/config.json") {
      response.writeHead(200, {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"});
      response.end(JSON.stringify(config));
      return;
    }
    const pathname = (url.pathname === "/" || url.pathname === "/callback") ? "/index.html" : url.pathname;
    const filePath = resolve(root, "." + pathname);
    if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    sendFile(response, filePath);
  });
  return listen(server, appPort).then(() => server);
}

function serveWeb(idToken) {
  const root = join(repoRoot, "static");
  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://127.0.0.1:${webPort}`);
    if (url.pathname === "/tasks-demo-session.html") {
      const page = `<!DOCTYPE html><meta charset="utf-8"><title>Tasks demo session</title><script>
localStorage.setItem("id-token", ${JSON.stringify(idToken)});
localStorage.setItem("access-token", ${JSON.stringify(idToken)});
localStorage.setItem("refresh-token", "tasks-demo-refresh");
localStorage.setItem("sync-server-url", ${JSON.stringify(apiBase)});
location.replace("/#/graphs");
</script>`;
      response.writeHead(200, {"content-type": "text/html; charset=utf-8", "cache-control": "no-store"});
      response.end(page);
      return;
    }
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = resolve(root, "." + pathname);
    if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    sendFile(response, filePath);
  });
  return listen(server, webPort).then(() => server);
}

async function main() {
  process.env.COGNITO_ISSUER = issuer;
  process.env.COGNITO_CLIENT_ID = cognitoClientId;
  rmSync(runtimeDir, {recursive: true, force: true});
  mkdirSync(runtimeDir, {recursive: true});
  const keys = cognito.generateKeys();
  writeFileSync(keysPath, JSON.stringify(keys));
  const privateKey = crypto.createPrivateKey(keys.privateKeyPem);
  const idToken = cognito.signJwt(
    cognito.userClaims(Math.floor(Date.now() / 1000)),
    privateKey,
    cognito.DEMO_KID
  );

  const child = spawn(process.execPath, ["-r", join(here, "local-cognito.cjs"), "worker/dist/node-adapter.js"], {
    cwd: dbSyncRoot,
    env: {
      ...process.env,
      DB_SYNC_PORT: String(syncPort),
      DB_SYNC_BASE_URL: apiBase,
      DB_SYNC_DATA_DIR: dataDir,
      DB_SYNC_ADMIN_TOKEN: "tasks-demo-admin",
      ASSET_LINK_SECRET: "tasks-demo-asset-link",
      COGNITO_ISSUER: issuer,
      COGNITO_CLIENT_ID: cognitoClientId,
      COGNITO_JWKS_URL: jwksUrl,
      TASKS_DEMO_KEYS: keysPath,
      TASKS_DEMO_PATCH_FETCH: "1"
    },
    stdio: ["ignore", "inherit", "inherit"]
  });
  syncProcess = child;
  child.on("exit", (code) => {
    console.error("sync server exited", code);
    process.exit(code || 1);
  });

  await waitForHealth(child);
  const created = await jsonRequest("/graphs", {
    method: "POST",
    headers: {
      authorization: "Bearer " + idToken,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      "graph-name": graphName,
      "schema-version": "65.35",
      "graph-e2ee?": false,
      "graph-ready-for-use?": true
    })
  });
  const graphId = created["graph-id"];
  await new Promise((resolveSeed, rejectSeed) => {
    const seed = spawn(process.execPath, ["worker/dist/tasks-demo-seed.js", dataDir, graphId], {
      cwd: dbSyncRoot,
      stdio: "inherit"
    });
    seed.on("exit", (code) => {
      if (code === 0) resolveSeed();
      else rejectSeed(new Error("seed failed: " + code));
    });
  });

  const app = await jsonRequest("/api/v1/oauth/apps", {
    method: "POST",
    headers: {
      authorization: "Bearer " + idToken,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      name: "Tasks",
      description: "A tasks app for one Logseq graph.",
      "redirect-uris": [`http://127.0.0.1:${appPort}/callback`]
    })
  });
  await jsonRequest("/admin/oauth/apps/" + app.id + "/review", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-db-sync-admin-token": "tasks-demo-admin"
    },
    body: JSON.stringify({status: "approved", note: "local preview"})
  });

  const config = {apiBase, clientId: app.id, graphName};
  writeFileSync(join(runtimeDir, "preview.json"), JSON.stringify({...config, graphId, idToken}, null, 2));
  await serveTasks(config);
  await serveWeb(idToken);
  console.log("Tasks app http://127.0.0.1:" + appPort + "/");
  console.log("Logseq web http://127.0.0.1:" + webPort + "/tasks-demo-session.html");
  console.log("Graph " + graphId);
  console.log("Sign in as " + cognito.DEMO_USERNAME + " / " + cognito.DEMO_PASSWORD);
}

main().catch((error) => {
  console.error(error);
  if (syncProcess && syncProcess.exitCode == null) syncProcess.kill();
  process.exit(1);
});
