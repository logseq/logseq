import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { registerSemanticApiTools, resolveOpenApiRefs } from "./semantic_api_tools.mjs";

function fakeServer() {
  const registered = new Map();
  return {
    registerTool(name, config, handler) {
      registered.set(name, { config, handler });
    },
    registered,
  };
}

const spec = {
  paths: {
    "/api/v1/graphs": {
      get: {
        operationId: "listGraphs",
        summary: "List graphs",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
      },
      post: {
        operationId: "createGraph",
        summary: "Create graph",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateGraph" } } },
        },
      },
    },
    "/api/v1/graphs/{graph-id}/pages/{page-id}": {
      get: {
        operationId: "get page",
        parameters: [
          { name: "graph-id", in: "path", required: true, schema: { type: "string" } },
          { name: "page-id", in: "path", required: true, schema: { type: "string" } },
          { name: "verbose", in: "query", schema: { type: "boolean" } },
        ],
      },
      delete: {
        operationId: "deletePage",
      },
    },
  },
  components: {
    schemas: {
      CreateGraph: {
        type: "object",
        required: ["graph-name"],
        properties: { "graph-name": { type: "string" } },
      },
    },
  },
};

test("semantic API tools are discovered as individual tools", () => {
  const server = fakeServer();
  const descriptors = registerSemanticApiTools(server, spec, async () => ({}));

  assert.deepEqual(
    descriptors.map((d) => d.name),
    ["listGraphs", "createGraph", "get_page", "deletePage"],
  );
  assert.deepEqual([...server.registered.keys()], descriptors.map((d) => d.name));

  const createGraph = descriptors.find((d) => d.name === "createGraph");
  assert.deepEqual(createGraph.inputSchema.required, ["body"]);
  assert.deepEqual(createGraph.inputSchema.properties.body.properties["graph-name"], {
    type: "string",
  });
  assert.equal(createGraph.annotations.readOnlyHint, false);

  const deletePage = descriptors.find((d) => d.name === "deletePage");
  assert.equal(deletePage.annotations.readOnlyHint, false);
  assert.equal(deletePage.annotations.destructiveHint, true);

  const getPage = descriptors.find((d) => d.name === "get_page");
  assert.deepEqual(getPage.inputSchema.required.sort(), ["graph-id", "page-id"]);
  assert.equal(getPage.annotations.readOnlyHint, true);
});

test("semantic API tools forward method, path params, query, and body", async () => {
  const server = fakeServer();
  const calls = [];
  registerSemanticApiTools(server, spec, async (options) => {
    calls.push(options);
    return options.method === "DELETE" ? null : { ok: true };
  });

  let result = await server.registered.get("get_page").handler({
    "graph-id": "g/1",
    "page-id": "p 2",
    verbose: true,
  });
  assert.deepEqual(calls[0], {
    method: "GET",
    path: "/api/v1/graphs/g%2F1/pages/p%202",
    query: { verbose: true },
  });
  assert.equal(result.content[0].text, '{\n  "ok": true\n}');

  await server.registered.get("createGraph").handler({ body: { "graph-name": "g" } });
  assert.deepEqual(calls[1], {
    method: "POST",
    path: "/api/v1/graphs",
    body: { "graph-name": "g" },
  });

  result = await server.registered.get("deletePage").handler({
    "graph-id": "g",
    "page-id": "p",
  });
  assert.deepEqual(calls[2], { method: "DELETE", path: "/api/v1/graphs/g/pages/p" });
  assert.match(result.content[0].text, /succeeded$/);
});

test("OpenAPI $refs resolve inline for tool schemas", () => {
  const resolved = resolveOpenApiRefs(
    { a: { $ref: "#/components/schemas/X" }, list: [{ $ref: "#/components/schemas/X" }] },
    { components: { schemas: { X: { type: "string", title: "X" } } } },
  );
  assert.equal(resolved.a.title, "X");
  assert.equal(resolved.list[0].type, "string");
});

test("tool argument validation follows required fields and constraints in OpenAPI", () => {
  const server = fakeServer();
  registerSemanticApiTools(server, {
    paths: {
      "/api/v1/example": {
        post: {
          operationId: "validateExample",
          requestBody: {
            required: true,
            content: { "application/json": { schema: {
              type: "object",
              required: ["texts", "selector"],
              properties: {
                texts: { type: "array", minItems: 1, maxItems: 2, items: { type: "string" } },
                selector: { oneOf: [{ type: "string" }, { type: "integer", minimum: 1 }] },
              },
            } } },
          },
        },
      },
    },
  }, async () => ({}));
  const schema = z.object(server.registered.get("validateExample").config.inputSchema);
  assert.equal(schema.safeParse({ body: {} }).success, false);
  assert.equal(schema.safeParse({ body: { texts: [], selector: "a" } }).success, false);
  assert.equal(schema.safeParse({ body: { texts: ["a", "b", "c"], selector: 1 } }).success, false);
  assert.equal(schema.safeParse({ body: { texts: ["a"], selector: 0 } }).success, false);
  assert.deepEqual(schema.parse({ body: { texts: ["a"], selector: 1, extra: true } }),
    { body: { texts: ["a"], selector: 1, extra: true } });
});
