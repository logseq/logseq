import { z } from "zod";

const SEMANTIC_TOOL_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

export function resolveOpenApiRefs(value, root, refCache = new Map(), seen = new Set()) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => resolveOpenApiRefs(item, root, refCache, seen));
  }
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/")) {
    const ref = value.$ref;
    if (seen.has(ref)) return {};
    if (refCache.has(ref)) return structuredClone(refCache.get(ref));
    seen.add(ref);
    let resolved = root;
    for (const part of ref
      .slice(2)
      .split("/")
      .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"))) {
      resolved = resolved?.[part];
    }
    const out = resolveOpenApiRefs(resolved, root, refCache, seen);
    seen.delete(ref);
    refCache.set(ref, out);
    return structuredClone(out);
  }
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = resolveOpenApiRefs(item, root, refCache, seen);
  }
  return out;
}

// Register every documented OpenAPI operation as an individual MCP tool so
// generic clients can discover the API surface through tools/list instead of
// only through the Code Mode search tool.
export function registerSemanticApiTools(server, spec, request) {
  const resolvedSpec = resolveOpenApiRefs(spec, spec);
  const usedNames = new Set();
  const descriptors = [];
  for (const [path, pathItem] of Object.entries(resolvedSpec.paths ?? {})) {
    for (const [method, op] of Object.entries(pathItem ?? {})) {
      if (!SEMANTIC_TOOL_METHODS.has(method) || !op || typeof op !== "object") continue;
      const operationId = op.operationId;
      if (typeof operationId !== "string" || !operationId) continue;

      let name = operationId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
      while (usedNames.has(name)) name = `${name}_`;
      usedNames.add(name);

      const parameters = (op.parameters ?? []).filter((p) => p && typeof p === "object");
      const pathParams = parameters.filter((p) => p.in === "path");
      const queryParams = parameters.filter((p) => p.in === "query");
      const properties = {};
      const required = [];
      const zodShape = {};
      for (const param of [...pathParams, ...queryParams]) {
        const paramSchema = param.schema && typeof param.schema === "object" ? param.schema : {};
        properties[param.name] = param.description
          ? { ...paramSchema, description: param.description }
          : paramSchema;
        let zodType = z.fromJSONSchema(paramSchema);
        if (param.description) zodType = zodType.describe(param.description);
        if (param.in === "path" || param.required === true) required.push(param.name);
        else zodType = zodType.optional();
        zodShape[param.name] = zodType;
      }
      if (op.requestBody) {
        const content = op.requestBody.content ?? {};
        const jsonContent = content["application/json"] ?? Object.values(content)[0];
        const bodySchema = jsonContent?.schema && typeof jsonContent.schema === "object"
          ? jsonContent.schema
          : { type: "object" };
        properties.body = bodySchema.description
          ? bodySchema
          : { ...bodySchema, description: "Request body" };
        zodShape.body = z.fromJSONSchema(bodySchema);
        if (op.requestBody.required === true) required.push("body");
        else zodShape.body = zodShape.body.optional();
      }

      const upperMethod = method.toUpperCase();
      const inputSchema = {
        type: "object",
        properties,
        additionalProperties: false,
      };
      if (required.length) inputSchema.required = required;
      const annotations = {
        readOnlyHint: upperMethod === "GET",
        openWorldHint: true,
        destructiveHint: upperMethod === "DELETE",
        idempotentHint: ["GET", "PUT", "DELETE", "HEAD"].includes(upperMethod),
      };
      descriptors.push({
        name,
        description: op.summary ?? op.description ?? `${upperMethod} ${path}`,
        inputSchema,
        annotations,
      });

      const pathParamNames = [...new Set([
        ...pathParams.map((p) => p.name),
        ...[...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]),
      ])];
      const queryParamNames = queryParams.map((p) => p.name);
      server.registerTool(name, {
        description: op.summary ?? op.description ?? `${upperMethod} ${path}`,
        inputSchema: zodShape,
        annotations,
      }, async (args) => {
        const toolPath = pathParamNames.reduce(
          (p, n) => p.replaceAll(`{${n}}`, encodeURIComponent(String(args[n]))),
          path,
        );
        const query = {};
        for (const n of queryParamNames) {
          if (args[n] !== undefined) query[n] = args[n];
        }
        const options = { method: upperMethod, path: toolPath };
        if (Object.keys(query).length) options.query = query;
        if (args.body !== undefined) options.body = args.body;
        const result = await request(options);
        return {
          content: [{
            type: "text",
            text: result === null || result === undefined
              ? `${upperMethod} ${toolPath} succeeded`
              : JSON.stringify(result, null, 2),
          }],
        };
      });
    }
  }
  return descriptors;
}
