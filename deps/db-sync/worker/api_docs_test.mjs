import assert from "node:assert/strict";
import test from "node:test";

import { apiDocsResponse } from "./api_docs.mjs";

test("API docs are served as standalone HTML from both docs paths", async () => {
  const html = "<!doctype html><title>Logseq Server API</title>";

  for (const path of ["/api-docs", "/api-docs/"]) {
    const response = apiDocsResponse(path, html);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    assert.equal(await response.text(), html);
  }
});

test("API docs helper ignores unrelated paths", () => {
  assert.equal(apiDocsResponse("/openapi.json", "docs"), null);
});
