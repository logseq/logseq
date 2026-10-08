import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, extname } from "node:path";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";

const site = mkdtempSync(join(tmpdir(), "logseq-publishing-"));
const graph = resolve(process.env.LOGSEQ_PUBLISHING_GRAPH ?? "/tmp/logseq-publishing-graph");
writeFileSync(join(graph, "assets/11111111-1111-4111-8111-111111111111.png"),
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6c7sAAAAASUVORK5CYII=", "base64"));
const exported = spawnSync(process.execPath, ["scripts/publishing.mjs", resolve("static"),
  graph, site],
  { encoding: "utf8", timeout: 15000 });
assert.equal(exported.status, 0, exported.stderr + exported.stdout);
assert.equal(readFileSync(join(site, "index.html"), "utf8").includes("Private content must not ship"), false);
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".png": "image/png" };
const server = createServer((req, res) => {
  try {
    const file = join(site, decodeURIComponent(new URL(req.url, "http://local").pathname).replace(/\/$/, "/index.html"));
    res.setHeader("content-type", types[extname(file)] ?? "application/octet-stream");
    res.end(readFileSync(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome" });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(12000);
  const errors = [], requests = [];
  page.on("pageerror", err => errors.push(err.stack));
  page.on("console", msg => { if (msg.type() === "error" && !msg.text().includes("404")) errors.push(msg.text()); for (const arg of msg.args()) arg.evaluate(v => Array.isArray(v) ? v.map(x => x?.stack ?? x) : v?.stack ?? null).then(stack => { if (stack) console.log(stack); }); });
  page.on("request", request => requests.push(request.url()));
  await page.addInitScript(() => {
    window.Worker = class { constructor() { throw new Error("Publishing must not start a worker"); } };
  });
  await page.goto(origin);
  page.on("close", () => { if (errors.length) console.log("Browser errors:", errors); });
  try { await page.getByText("Published", { exact: false }).first().waitFor({ timeout: 12000 }); }
  catch (error) { console.log(await page.locator("body").innerText()); console.log(await page.evaluate(() => ({state: window.logseq_state, db: window.logseq_db?.length, root: document.querySelector("#root")?.innerHTML}))); console.log(requests); throw error; }
  await page.locator(".ls-block").filter({ hasText: "Published" }).first().waitFor();
  assert.equal(await page.locator("strong,b").filter({ hasText: "bold" }).count() > 0, true);
  const query = page.locator(".ls-block").filter({has: page.locator(".block-content", {hasText: /^Published query$/})}).first();
  await query.locator(".custom-query-results").getByText("Linked page content", {exact:true}).first().waitFor();
  const emptyQuery = page.locator(".ls-block").filter({has: page.locator(".block-content", {hasText: /^Empty published query$/})}).first();
  await emptyQuery.locator(".custom-query-results .query-result").waitFor();
  assert.equal(await emptyQuery.locator(".custom-query-results .ls-table-row").count(), 0);
  assert.equal(await page.locator(".katex").count() > 0, true);
  assert.equal(await page.getByText("Private content must not ship", { exact: false }).count(), 0);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "Exported theme is restored");
  await page.waitForFunction(() => {
    const image = document.querySelector("#asset-img-11111111-1111-4111-8111-111111111111 img");
    return image?.naturalWidth === 1;
  });
  assert.equal(await page.locator("#asset-menu-btn-11111111-1111-4111-8111-111111111111,.image-resize").count(), 0);
  const content = page.locator(".block-content").filter({ hasText: "Published" }).first();
  await content.click();
  await page.keyboard.type("Should not edit");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Backspace");
  assert.equal(await page.locator(".block-editor,[contenteditable=true]").count(), 0);
  assert.equal(await page.getByText("Should not edit", { exact: false }).count(), 0);
  await page.keyboard.press("Meta+k");
  await page.locator(".cp__cmdk-search-input").fill("/");
  await page.locator(".cp__cmdk").getByText("Search only nodes", {exact:true}).waitFor();
  for (const label of ["Search only commands", "Search only files", "Search only codes", "Search only themes"])
    assert.equal(await page.locator(".cp__cmdk").getByText(label, {exact:true}).count(), 0,
      `Publishing search must hide unavailable filter: ${label}`);
  await page.locator(".cp__cmdk-search-input").fill("logseq/config.edn");
  await page.waitForTimeout(350);
  assert.equal(await page.locator(".cp__cmdk").getByText("logseq/config.edn", {exact:true}).count(), 0,
    "Publishing search must not offer an editable configuration file");
  await page.locator(".cp__cmdk-search-input").fill("Linked page content");
  await page.locator(".cp__cmdk").getByText("Linked page content", {exact:false}).first().waitFor();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.locator(".cp__cmdk-search-input").waitFor({state:"hidden"});
  await page.keyboard.press("Meta+k");
  await page.locator(".cp__cmdk-search-input").fill("Linked page content");
  await page.locator(".cp__cmdk").getByText("Linked page content", {exact:false}).first().click();
  await page.locator(".block-content").filter({hasText:"Linked page content"}).first().waitFor();
  await page.reload();
  await page.locator(".block-content").filter({hasText:"Linked page content"}).first().waitFor();
  await page.goto(`${origin}/#/`);
  await page.locator(".block-content").filter({hasText:"Published"}).first().waitFor();
  const parent = page.locator(".ls-block").filter({has: page.locator(".block-content", {hasText: /^Parent$/})}).first();
  await page.getByText("Nested published child", {exact:true}).waitFor();
  await parent.locator(".block-control-wrap .block-control").first().click();
  await page.getByText("Nested published child", {exact:true}).waitFor({state:"hidden"});
  await parent.locator(".block-control-wrap .block-control").first().click();
  await page.getByText("Nested published child", {exact:true}).waitFor();
  await page.locator("a.page-ref").filter({ hasText: "Other" }).first().click();
  await page.getByText("Linked page content", { exact: false }).first().waitFor();
  await page.locator(".references").getByText("Published", {exact:false}).first().waitFor();
  await page.reload();
  await page.getByText("Linked page content", { exact: false }).first().waitFor();
  await page.goto(`${origin}/#/`);
  await page.locator(".block-content").filter({ hasText: "Published" }).first().waitFor();
  await page.goto(`${origin}/#/all-pages`);
  await page.locator(".ls-all-pages").getByText("Home", {exact:true}).first().waitFor();
  assert.equal(await page.locator(".ls-all-pages").getByText("Secret", {exact:true}).count(), 0);
  await page.goto(`${origin}/#/page/Secret`);
  await page.getByText("Page not found", { exact: false }).first().waitFor();
  assert.equal(requests.some(url => /db-worker|sqlite|\.wasm(?:\?|$)/.test(url)), false, requests.join("\n"));
  assert.deepEqual(errors, []);
  console.log("Publishing browser: memory-only boot, search, rendering, read-only input, folding, all pages, private data, navigation and reload passed");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  rmSync(site, { recursive: true, force: true });
}
