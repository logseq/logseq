import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const docsPath = new URL("./dist/api-docs.html", import.meta.url);
const modulePath = new URL("./dist/api-docs.generated.mjs", import.meta.url);

test("Redocly build produces standalone semantic API documentation", () => {
  assert.equal(existsSync(docsPath), true, "missing generated API docs HTML");
  assert.equal(existsSync(modulePath), true, "missing generated API docs module");

  const html = readFileSync(docsPath, "utf8");
  assert.match(html, /Logseq Semantic API/);
  assert.match(html, /listPageReferences/);
  assert.match(html, /listTagObjects/);
  assert.match(html, /redoc\.standalone\.js/);
});
