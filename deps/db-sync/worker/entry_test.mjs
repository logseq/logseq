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
