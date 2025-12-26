import { DurableObject } from "cloudflare:workers";

const textDecoder = new TextDecoder();

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function unauthorized() {
  return jsonResponse({ error: "unauthorized" }, 401);
}

function badRequest(message) {
  return jsonResponse({ error: message }, 400);
}

function base64UrlToUint8Array(input) {
  const pad = input.length % 4 ? "=".repeat(4 - (input.length % 4)) : "";
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

function getSqlRows(result) {
  if (!result) return [];
  if (typeof result.toArray === "function") return result.toArray();
  if (typeof result[Symbol.iterator] === "function") {
    return Array.from(result);
  }
  if (Array.isArray(result.results)) return result.results;
  if (Array.isArray(result.rows)) return result.rows;
  if (Array.isArray(result)) {
    if (result.length === 0) return [];
    const first = result[0];
    if (first && Array.isArray(first.results)) return first.results;
    if (first && Array.isArray(first.rows)) return first.rows;
    return result;
  }
  return [];
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(message) {
  const data = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

async function hmacSha256(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, message);
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodePath(path) {
  return path
    .split("/")
    .map((part) => encodeRfc3986(part))
    .join("/");
}

async function getSignatureKey(secret, dateStamp, region, service) {
  const kDate = await hmacSha256(
    new TextEncoder().encode(`AWS4${secret}`),
    new TextEncoder().encode(dateStamp)
  );
  const kRegion = await hmacSha256(kDate, new TextEncoder().encode(region));
  const kService = await hmacSha256(kRegion, new TextEncoder().encode(service));
  return hmacSha256(kService, new TextEncoder().encode("aws4_request"));
}

async function presignR2Url(r2Key, env, expiresSeconds = 300) {
  const region = "auto";
  const service = "s3";
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const bucket = env.R2_BUCKET;
  const method = "GET";
  const now = new Date();
  const amzDate = now
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const params = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${env.R2_ACCESS_KEY_ID}/${credentialScope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  params.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const canonicalQueryString = params
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join("&");

  const canonicalUri = `/${bucket}/${encodePath(r2Key)}`;
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(
    env.R2_SECRET_ACCESS_KEY,
    dateStamp,
    region,
    service
  );
  const signature = toHex(await hmacSha256(signingKey, new TextEncoder().encode(stringToSign)));
  const signedQuery = `${canonicalQueryString}&X-Amz-Signature=${signature}`;

  return `https://${host}${canonicalUri}?${signedQuery}`;
}

function decodeJwtPart(part) {
  const bytes = base64UrlToUint8Array(part);
  return JSON.parse(textDecoder.decode(bytes));
}

async function importRsaKey(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  );
}

async function verifyJwt(token, env) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJwtPart(headerPart);
  const payload = decodeJwtPart(payloadPart);

  if (payload.iss !== env.COGNITO_ISSUER) {
    return null;
  }
  if (payload.aud !== env.COGNITO_CLIENT_ID) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    return null;
  }

  const jwksResp = await fetch(env.COGNITO_JWKS_URL);
  if (!jwksResp.ok) {
    return null;
  }
  const jwks = await jwksResp.json();
  const key = (jwks.keys || []).find((k) => k.kid === header.kid);
  if (!key) {
    return null;
  }

  const cryptoKey = await importRsaKey(key);
  const data = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const signature = base64UrlToUint8Array(signaturePart);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, data);
  return ok ? payload : null;
}

async function handlePostPages(request, env) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const devSkipAuth = env.DEV_SKIP_AUTH === "true";
  if (!token && !devSkipAuth) {
    return unauthorized();
  }

  const claims = devSkipAuth ? { sub: "dev" } : await verifyJwt(token, env);
  if (!claims && !devSkipAuth) {
    return unauthorized();
  }

  const metaHeader = request.headers.get("x-publish-meta");
  if (!metaHeader) {
    return badRequest("missing x-publish-meta header");
  }

  let meta;
  try {
    meta = JSON.parse(metaHeader);
  } catch (_err) {
    return badRequest("invalid x-publish-meta header");
  }

  if (!meta["publish/content-hash"] || !meta["publish/graph"] || !meta["page-uuid"]) {
    return badRequest("missing publish metadata");
  }

  const body = await request.arrayBuffer();
  const r2Key = `publish/${meta["publish/graph"]}/${meta["publish/content-hash"]}.transit`;

  const existing = await env.PUBLISH_R2.head(r2Key);
  if (!existing) {
    await env.PUBLISH_R2.put(r2Key, body, {
      httpMetadata: {
        contentType: "application/transit+json",
      },
    });
  }

  const doId = env.PUBLISH_META_DO.idFromName(meta["page-uuid"]);
  const doStub = env.PUBLISH_META_DO.get(doId);
  const metaResponse = await doStub.fetch("https://publish/pages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...meta,
      r2_key: r2Key,
      owner_sub: claims.sub,
      updated_at: Date.now(),
    }),
  });

  if (!metaResponse.ok) {
    return jsonResponse({ error: "metadata store failed" }, 500);
  }

  const indexId = env.PUBLISH_META_DO.idFromName("index");
  const indexStub = env.PUBLISH_META_DO.get(indexId);
  await indexStub.fetch("https://publish/pages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...meta,
      r2_key: r2Key,
      owner_sub: claims.sub,
      updated_at: Date.now(),
    }),
  });

  return jsonResponse({
    page_uuid: meta["page-uuid"],
    r2_key: r2Key,
    updated_at: Date.now(),
  });
}

async function handleGetPage(request, env) {
  const url = new URL(request.url);
  const pageUuid = url.pathname.split("/")[2];
  if (!pageUuid) {
    return badRequest("missing page uuid");
  }
  const doId = env.PUBLISH_META_DO.idFromName(pageUuid);
  const doStub = env.PUBLISH_META_DO.get(doId);
  const metaResponse = await doStub.fetch(`https://publish/pages/${pageUuid}`);
  if (!metaResponse.ok) {
    return jsonResponse({ error: "not found" }, 404);
  }
  const meta = await metaResponse.json();
  const etag = meta["publish/content-hash"];
  const ifNoneMatch = request.headers.get("if-none-match");
  if (etag && ifNoneMatch && ifNoneMatch.replace(/\"/g, "") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        etag,
      },
    });
  }
  return jsonResponse(meta, 200);
}

async function handleGetPageTransit(request, env) {
  const url = new URL(request.url);
  const pageUuid = url.pathname.split("/")[2];
  if (!pageUuid) {
    return badRequest("missing page uuid");
  }
  const doId = env.PUBLISH_META_DO.idFromName(pageUuid);
  const doStub = env.PUBLISH_META_DO.get(doId);
  const metaResponse = await doStub.fetch(`https://publish/pages/${pageUuid}`);
  if (!metaResponse.ok) {
    return jsonResponse({ error: "not found" }, 404);
  }
  const meta = await metaResponse.json();
  if (!meta.r2_key) {
    return jsonResponse({ error: "missing transit" }, 404);
  }

  const etag = meta["publish/content-hash"];
  const ifNoneMatch = request.headers.get("if-none-match");
  if (etag && ifNoneMatch && ifNoneMatch.replace(/\"/g, "") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        etag,
      },
    });
  }

  const signedUrl = await presignR2Url(meta.r2_key, env);
  return jsonResponse(
    {
      url: signedUrl,
      expires_in: 300,
      etag,
    },
    200
  );
}

async function handleListPages(request, env) {
  const doId = env.PUBLISH_META_DO.idFromName("index");
  const doStub = env.PUBLISH_META_DO.get(doId);
  const metaResponse = await doStub.fetch("https://publish/pages", {
    method: "GET",
  });
  if (!metaResponse.ok) {
    return jsonResponse({ error: "not found" }, 404);
  }
  const meta = await metaResponse.json();
  return jsonResponse(meta, 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/pages" && request.method === "POST") {
      return handlePostPages(request, env);
    }
    if (url.pathname === "/pages" && request.method === "GET") {
      return handleListPages(request, env);
    }
    if (url.pathname.startsWith("/pages/") && request.method === "GET") {
      const parts = url.pathname.split("/");
      if (parts[3] === "transit") {
        return handleGetPageTransit(request, env);
      }
      return handleGetPage(request, env);
    }
    return jsonResponse({ error: "not found" }, 404);
  },
};

export class PublishMetaDO extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.state = state;
    this.env = env;
    this.sql = state.storage.sql;
  }

  async initSchema() {
    const cols = getSqlRows(this.sql.exec("PRAGMA table_info(pages);"));
    const hasLegacyId = cols.some((col) => col.name === "page_id");
    if (hasLegacyId) {
      this.sql.exec("DROP TABLE IF EXISTS pages;");
    }
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        page_uuid TEXT NOT NULL,
        graph TEXT NOT NULL,
        schema_version TEXT,
        block_count INTEGER,
        content_hash TEXT NOT NULL,
        content_length INTEGER,
        r2_key TEXT NOT NULL,
        owner_sub TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        PRIMARY KEY (graph, page_uuid)
      );
    `);
  }

  async fetch(request) {
    await this.initSchema();
    if (request.method === "POST") {
      const body = await request.json();
      this.sql.exec(
      `
      INSERT INTO pages (
        page_uuid,
        graph,
        schema_version,
        block_count,
        content_hash,
        content_length,
        r2_key,
        owner_sub,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(graph, page_uuid) DO UPDATE SET
        page_uuid=excluded.page_uuid,
        schema_version=excluded.schema_version,
        block_count=excluded.block_count,
        content_hash=excluded.content_hash,
        content_length=excluded.content_length,
        r2_key=excluded.r2_key,
        owner_sub=excluded.owner_sub,
        updated_at=excluded.updated_at;
    `,
      body["page-uuid"],
      body["publish/graph"],
      body["schema-version"],
      body["block-count"],
      body["publish/content-hash"],
      body["publish/content-length"],
      body["r2_key"],
      body["owner_sub"],
      body["publish/created-at"],
      body["updated_at"]
      );

      return jsonResponse({ ok: true });
    }

    if (request.method === "GET") {
      const url = new URL(request.url);
      const parts = url.pathname.split("/");
      const pageUuid = parts[2];
      if (pageUuid) {
        const result = this.sql.exec(
        `
          SELECT page_uuid, graph, schema_version, block_count,
                 content_hash, content_length, r2_key, owner_sub, created_at, updated_at
          FROM pages WHERE page_uuid = ? LIMIT 1;
        `,
        pageUuid
        );
        const rows = getSqlRows(result);
        const row = rows[0];
        if (!row) {
          return jsonResponse({ error: "not found" }, 404);
        }
        return jsonResponse({
          ...row,
          "publish/content-hash": row.content_hash,
          "publish/content-length": row.content_length,
        });
      }

      const result = this.sql.exec(`
        SELECT page_uuid, graph, schema_version, block_count,
               content_hash, content_length, r2_key, owner_sub, created_at, updated_at
        FROM pages ORDER BY updated_at DESC;
      `);
      const rows = getSqlRows(result);
      return jsonResponse({
        pages: rows.map((row) => ({
          ...row,
          "publish/content-hash": row.content_hash,
          "publish/content-length": row.content_length,
        })),
      });
    }

    return jsonResponse({ error: "method not allowed" }, 405);
  }
}
