import assert from "node:assert/strict";
import test from "node:test";

import { chatGptToolDescriptors } from "./chatgpt_app.mjs";

test("ChatGPT tool descriptors declare titles, impact, and per-tool auth", () => {
  const descriptors = chatGptToolDescriptors();
  const search = descriptors.find((tool) => tool.name === "search");
  const execute = descriptors.find((tool) => tool.name === "execute");

  assert.deepEqual(search.annotations, {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  });
  assert.deepEqual(search.securitySchemes, [
    { type: "oauth2", scopes: ["logseq/read", "logseq/write"] },
  ]);
  assert.deepEqual(search._meta.securitySchemes, search.securitySchemes);

  assert.deepEqual(execute.annotations, {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  });
  assert.deepEqual(execute.securitySchemes, [
    { type: "oauth2", scopes: ["logseq/read", "logseq/write"] },
  ]);
  assert.deepEqual(execute._meta.securitySchemes, execute.securitySchemes);
});

test("ChatGPT tools require DB graph property semantics", () => {
  const descriptors = chatGptToolDescriptors();

  for (const tool of descriptors) {
    assert.match(tool.description, /DB graph/);
    assert.match(tool.description, /typed properties/);
    assert.match(tool.description, /key:: value/);
  }
});

test("ChatGPT tools describe the DB Task workflow", () => {
  const descriptors = chatGptToolDescriptors();

  for (const tool of descriptors) {
    assert.match(tool.description, /\/tasks/);
    assert.match(tool.description, /never use Markdown TODO/);
    assert.match(tool.description, /never use graph search to list tasks/);
  }
});

test("ChatGPT tools describe streaming asset uploads", () => {
  for (const tool of chatGptToolDescriptors()) {
    assert.match(tool.description, /\/assets/);
    assert.match(tool.description, /SHA-256/);
    assert.match(tool.description, /100MB/);
    assert.match(tool.description, /encoding=base64/);
    assert.match(tool.description, /decoded/);
  }
});
