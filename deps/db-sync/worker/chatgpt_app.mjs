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

const fileInputSchema = {
  type: "object",
  properties: {
    download_url: { type: "string", description: "Temporary HTTPS URL for the original ChatGPT file" },
    file_id: { type: "string", description: "ChatGPT file identifier" },
    mime_type: { type: "string", description: "File MIME type" },
    file_name: { type: "string", description: "Original file name including its extension" },
  },
  required: ["download_url", "file_id"],
  additionalProperties: false,
};

const assetOutputSchema = {
  type: "object",
  properties: {
    uuid: { type: "string", description: "Asset block UUID" },
    title: { type: "string", description: "Asset block title" },
    type: { type: "string", description: "Asset file extension" },
    size: { type: "integer", description: "Original file size in bytes" },
    checksum: { type: "string", description: "SHA-256 checksum of the original file" },
  },
  required: ["uuid", "title", "type", "size", "checksum"],
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
      description: "Search the Logseq DB graph OpenAPI document before making requests. For tasks, discover the dedicated /tasks operations: never use Markdown TODO syntax to create tasks and never use graph search to list tasks. Use upload_asset for ChatGPT attachments and never encode an attachment as base64 in Code Mode. This API uses DB-version typed properties; never use legacy file-graph key:: value syntax. Pass JavaScript as an async arrow function; codemode.spec() returns the OpenAPI document with references resolved inline.",
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
      description: "Read or change the user's non-encrypted Logseq DB graph through the semantic API. Use the dedicated /tasks operations for DB tasks: never use Markdown TODO syntax to create tasks and never use graph search to list tasks. Use upload_asset for ChatGPT attachments and never encode an attachment as base64 in Code Mode. Use DB-version typed properties and property UUIDs or idents; never write legacy file-graph key:: value syntax into block titles. First use search to discover endpoints. Pass JavaScript as an async arrow function; codemode.request(options) calls only documented Logseq endpoints.",
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
      name: "upload_asset",
      title: "Upload Logseq asset",
      description: "Upload the original ChatGPT attachment, unchanged and without base64 re-encoding, to a non-encrypted Logseq DB graph and create its Asset block. Optionally append it to a page. The file must not exceed 100MB; its original name is preserved when available.",
      inputSchema: {
        type: "object",
        properties: {
          graphId: { type: "string", description: "Graph UUID" },
          file: fileInputSchema,
          pageId: { type: "string", description: "Optional destination page UUID, ident, or title" },
          title: { type: "string", description: "Optional asset block title" },
        },
        required: ["graphId", "file"],
        additionalProperties: false,
      },
      outputSchema: assetOutputSchema,
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: false,
        idempotentHint: false,
      },
      securitySchemes: executeSecurity,
      _meta: {
        securitySchemes: executeSecurity,
        "openai/fileParams": ["file"],
        "openai/toolInvocation/invoking": "Uploading Logseq asset…",
        "openai/toolInvocation/invoked": "Logseq asset uploaded",
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
