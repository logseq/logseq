const writeScopes = ["logseq/read", "logseq/write"];

function oauthSecurity(scopes) {
  return [{ type: "oauth2", scopes }];
}

export function chatGptToolDescriptors() {
  const searchSecurity = oauthSecurity(writeScopes);
  const executeSecurity = oauthSecurity(writeScopes);
  return [
    {
      name: "search",
      title: "Discover Logseq operations",
      description: "Search the Logseq OpenAPI document before making requests. Pass JavaScript as an async arrow function; codemode.spec() returns the OpenAPI document with references resolved inline.",
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
      description: "Read or change the user's non-encrypted Logseq graph through the semantic API. First use search to discover endpoints. Pass JavaScript as an async arrow function; codemode.request(options) calls only documented Logseq endpoints.",
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
  ];
}
