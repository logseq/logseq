import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve, join, extname } from "node:path";
import { chromium } from "playwright";
import { runInNewContext } from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let apis;
const calls = [];
runInNewContext(readFileSync("resources/js/preload.js", "utf8"), {
  require: name => name === "electron" ? {
    ipcRenderer: { on() {}, once() {}, removeAllListeners() {}, removeListener() {}, invoke: (...args) => { calls.push(args); return Promise.resolve("saved"); } },
    contextBridge: { exposeInMainWorld: (name, value) => { if (name === "apis") apis = value; } }
  } : require(name), process, console, Buffer, URL
});
const saved = apis.exportPublishAssets("html", "/graph", ["asset.png"], "/output");
assert.equal(await saved, "saved", "Export completion must reach the caller");
assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),
  ["export-publish-assets", "html", "/graph", ["asset.png"], "/output"],
  "Preload must match the existing desktop export channel");

const root = resolve("static");
const types = {".html":"text/html", ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".wasm":"application/wasm"};
const server = createServer((req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://local").pathname);
    const file = join(root, path === "/" ? "index.html" : path);
    res.writeHead(200, {"content-type":types[extname(file)] ?? "application/octet-stream",
      "Cross-Origin-Opener-Policy":"same-origin", "Cross-Origin-Embedder-Policy":"require-corp"});
    res.end(readFileSync(file));
  } catch {res.writeHead(404).end();}
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({headless:true, channel:process.env.PLAYWRIGHT_CHANNEL ?? "chrome"});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.stack));
  page.on("console", message => { if (message.type() === "error") console.log("App error:", message.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const deadline = Date.now() + 15000;
  while (!(await page.evaluate(async () => window.logseq?.api &&
    (await window.logseq.api.get_current_graph(null,null,null,null))?.name))) {
    assert.ok(Date.now() < deadline, "Graph boot must finish before export");
    await page.waitForTimeout(50);
  }
  await page.evaluate(async () => {
    const api = window.logseq.api;
    await api.set_current_graph_configs({"publishing/all-pages-public?":true, "default-home":{"page":"Export home"}},null,null,null);
    await api.create_page("Export home", {}, {}, null);
    await api.insert_block("Export home", "Published from LUI", {}, null);
    await api.create_page("Private export", {"logseq.property/publishing-public?":false}, {}, null);
    await api.insert_block("Private export", "Private export sentinel", {}, null);
  });
  await page.keyboard.press("Meta+Shift+p");
  await page.locator(".cp__cmdk-search-input").fill("Export public graph pages as HTML");
  const download = page.waitForEvent("download");
  await page.locator(".cp__cmdk").getByText("Export public graph pages as HTML", {exact:true}).click();
  const result = await download;
  assert.equal(result.suggestedFilename(), "index.html");
  const html = readFileSync(await result.path(), "utf8");
  assert.match(html, /Published from LUI/);
  assert.ok(!html.includes("Private export sentinel"));
  assert.match(html, /type="module" src="static\/js\/main.js"/);
  assert.deepEqual(errors, []);
  console.log("Publishing export: desktop preload contract and LUI command with real worker passed");
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}
