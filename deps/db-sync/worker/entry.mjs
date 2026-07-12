import { DynamicWorkerExecutor } from "@cloudflare/codemode";
import { openApiMcpServer } from "@cloudflare/codemode/mcp";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { chatGptToolDescriptors } from "./chatgpt_app.mjs";
import { apiDocsResponse } from "./api_docs.mjs";
import { semanticRequestUrl } from "./semantic_request.mjs";
import apiDocsHtml from "./dist/api-docs.generated.mjs";
import worker, { SyncDO } from "./dist/worker/main.js";

function protectedResourceMetadata(request, env) {
  const url = new URL(request.url);
  return Response.json({
    resource: `${url.origin}/mcp`,
    authorization_servers: [env.COGNITO_ISSUER],
    scopes_supported: ["logseq/read", "logseq/write"],
    bearer_methods_supported: ["header"],
  });
}

async function semanticSpec(request, env, ctx) {
  const url = new URL("/openapi.json", request.url);
  const response = await worker.fetch(new Request(url), env, ctx);
  if (!response.ok) {
    throw new Error(`OpenAPI request failed: ${response.status}`);
  }
  return response.json();
}

async function handleMcp(request, env, ctx) {
  const authorization = request.headers.get("authorization");
  const server = openApiMcpServer({
    spec: await semanticSpec(request, env, ctx),
    executor: new DynamicWorkerExecutor({ loader: env.LOADER }),
    name: "logseq",
    version: "1.0.0",
    request: async (options) => {
      if (!options.path.startsWith("/api/v1/")) {
        throw new Error("Only Logseq semantic API paths are allowed");
      }
      const url = semanticRequestUrl(options, request.url);
      const headers = {};
      if (authorization) headers.authorization = authorization;
      if (options.contentType) headers["content-type"] = options.contentType;
      else if (options.body !== undefined) headers["content-type"] = "application/json";

      const response = await worker.fetch(
        new Request(url, {
          method: options.method,
          headers,
          body: options.body === undefined
            ? undefined
            : options.rawBody
              ? options.body
              : JSON.stringify(options.body),
        }),
        env,
        ctx,
      );
      if (response.status === 204) return null;
      const result = (response.headers.get("content-type") ?? "").includes("application/json")
        ? await response.json()
        : await response.text();
      if (!response.ok) {
        throw new Error(`Logseq API request failed: ${response.status} ${JSON.stringify(result)}`);
      }
      return result;
    },
  });

  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  server.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: chatGptToolDescriptors(),
  }));
  return transport.handleRequest(request);
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    const docsResponse = apiDocsResponse(path, apiDocsHtml);
    if (docsResponse) return docsResponse;
    if (path === "/.well-known/oauth-protected-resource" ||
        path === "/.well-known/oauth-protected-resource/mcp") {
      return protectedResourceMetadata(request, env);
    }
    if (path === "/mcp") return handleMcp(request, env, ctx);
    return worker.fetch(request, env, ctx);
  },
};

export { SyncDO };
