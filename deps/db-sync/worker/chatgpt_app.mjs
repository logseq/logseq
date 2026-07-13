import { ASSET_IMAGE_RESOURCE_URI } from "./asset_image.mjs";

const writeScopes = ["logseq/read", "logseq/write"];

const imageOutputSchema = {
  type: "object",
  properties: {
    uuid: { type: "string", description: "Image asset block UUID" },
    title: { type: "string", description: "Image asset title" },
    mimeType: { type: "string", description: "Image MIME type" },
    size: { type: "integer", description: "Image size in bytes" },
  },
  required: ["uuid", "title", "mimeType", "size"],
  additionalProperties: false,
};

function oauthSecurity(scopes) {
  return [{ type: "oauth2", scopes }];
}

export function chatGptToolDescriptors() {
  const searchSecurity = oauthSecurity(writeScopes);
  const executeSecurity = oauthSecurity(writeScopes);
  const imageSecurity = oauthSecurity(["logseq/read"]);
  return [
    {
      name: "search",
      title: "Discover Logseq operations",
      description: "Search the Logseq DB graph OpenAPI document before making requests. For tasks, discover the dedicated /tasks operations: never use Markdown TODO syntax to create tasks and never use graph search to list tasks. For /assets uploads from Code Mode, pass the base64 payload as the raw body with encoding=base64; the trusted host recalculates the decoded size, while the SHA-256 checksum describes the decoded file and the limit is 100MB. This API uses DB-version typed properties; never use legacy file-graph key:: value syntax. Pass JavaScript as an async arrow function; codemode.spec() returns the OpenAPI document with references resolved inline.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "JavaScript async arrow function that searches the Logseq OpenAPI document" },
        },
        required: ["code"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      securitySchemes: searchSecurity,
      _meta: {
        securitySchemes: searchSecurity,
        "openai/toolInvocation/invoking": "Discovering Logseq operations…",
        "openai/toolInvocation/invoked": "Logseq operations ready",
      },
    },
    {
      name: "execute",
      title: "Use Logseq",
      description: "Read or change the user's non-encrypted Logseq DB graph through the semantic API. Use the dedicated /tasks operations for DB tasks: never use Markdown TODO syntax to create tasks and never use graph search to list tasks. For /assets uploads from Code Mode, pass the base64 payload as the raw body with encoding=base64; the trusted host recalculates the decoded size, while the SHA-256 checksum describes the decoded file and the limit is 100MB. Use DB-version typed properties and property UUIDs or idents; never write legacy file-graph key:: value syntax into block titles. First use search to discover endpoints. Pass JavaScript as an async arrow function; codemode.request(options) calls only documented Logseq endpoints.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "JavaScript async arrow function that calls the Logseq API" },
        },
        required: ["code"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: true,
      },
      securitySchemes: executeSecurity,
      _meta: {
        securitySchemes: executeSecurity,
        "openai/toolInvocation/invoking": "Updating Logseq…",
        "openai/toolInvocation/invoked": "Logseq request complete",
      },
    },
    {
      name: "get_asset_image",
      title: "Display Logseq image asset",
      description: "Fetch an image asset up to 10MB from a non-encrypted Logseq DB graph and return it as image content that ChatGPT can display directly. Use this tool instead of getAsset when the user asks to view or display an image. It is read-only and does not download to local storage or modify the graph.",
      inputSchema: {
        type: "object",
        properties: {
          graphId: { type: "string", description: "Graph UUID" },
          assetBlockId: { type: "string", description: "Image asset block UUID" },
        },
        required: ["graphId", "assetBlockId"],
        additionalProperties: false,
      },
      outputSchema: imageOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      securitySchemes: imageSecurity,
      _meta: {
        securitySchemes: imageSecurity,
        ui: { resourceUri: ASSET_IMAGE_RESOURCE_URI },
        "openai/outputTemplate": ASSET_IMAGE_RESOURCE_URI,
        "openai/toolInvocation/invoking": "Loading Logseq image…",
        "openai/toolInvocation/invoked": "Logseq image ready",
      },
    },
  ];
}
