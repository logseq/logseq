import { DynamicWorkerExecutor } from "@cloudflare/codemode";
import { openApiMcpServer } from "@cloudflare/codemode/mcp";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import worker, { SyncDO } from "./dist/worker/main.js";

function protectedResourceMetadata(request, env) {
  const url = new URL(request.url);
  return Response.json({
    resource: `${url.origin}/mcp`,
    authorization_servers: [env.COGNITO_ISSUER],
    scopes_supported: ["logseq:read", "logseq:write"],
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
  if (!authorization?.startsWith("Bearer ")) {
    return new Response("Bearer token required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer resource_metadata="/.well-known/oauth-protected-resource/mcp"' },
    });
  }

  const server = openApiMcpServer({
    spec: await semanticSpec(request, env, ctx),
    executor: new DynamicWorkerExecutor({ loader: env.LOADER }),
    name: "logseq",
    version: "1.0.0",
    request: async (options) => {
      if (!options.path.startsWith("/api/v1/")) {
        throw new Error("Only Logseq semantic API paths are allowed");
      }
      const url = new URL(options.path, request.url);
      for (const [key, value] of Object.entries(options.query ?? {})) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
      const headers = { authorization };
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
  return transport.handleRequest(request);
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === "/.well-known/oauth-protected-resource" ||
        path === "/.well-known/oauth-protected-resource/mcp") {
      return protectedResourceMetadata(request, env);
    }
    if (path === "/mcp") return handleMcp(request, env, ctx);
    return worker.fetch(request, env, ctx);
  },
};

export { SyncDO };
