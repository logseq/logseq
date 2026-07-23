import { createHash } from "node:crypto";

const MAX_ASSET_SIZE = 100 * 1024 * 1024;
const MIME_TYPE_EXTENSIONS = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/gif", "gif"],
  ["image/webp", "webp"],
  ["image/bmp", "bmp"],
  ["image/svg+xml", "svg"],
  ["image/x-icon", "ico"],
  ["application/pdf", "pdf"],
]);

function requiredFileLength(response) {
  const value = response.headers.get("content-length");
  if (!/^\d+$/.test(value ?? "")) {
    throw new Error("ChatGPT file download must include content-length");
  }
  const size = Number(value);
  if (!Number.isSafeInteger(size) || size > MAX_ASSET_SIZE) {
    throw new Error("ChatGPT file is larger than 100MB");
  }
  return size;
}

function fixedLengthBody(body, size) {
  if (typeof FixedLengthStream !== "function") return { body, pipePromise: null };
  const fixed = new FixedLengthStream(size);
  return {
    body: fixed.readable,
    pipePromise: body.pipeTo(fixed.writable),
  };
}

function validateInput({ graphId, file }) {
  if (!graphId) throw new Error("graphId is required");
  if (!file?.file_id) throw new Error("file.file_id is required");
  if (!file?.download_url) throw new Error("file.download_url is required");
  const downloadUrl = new URL(file.download_url);
  if (downloadUrl.protocol !== "https:") {
    throw new Error("file.download_url must use HTTPS");
  }
  return downloadUrl;
}

function resolvedFileName(file, downloadUrl, contentType) {
  if (file.file_name) return file.file_name;
  const pathName = decodeURIComponent(downloadUrl.pathname.split("/").pop() ?? "");
  if (/\.[a-z0-9]+$/i.test(pathName)) return pathName;
  const extension = MIME_TYPE_EXTENSIONS.get(file.mime_type ?? contentType);
  if (!extension) throw new Error("file.file_name is required for this file type");
  return `${file.file_id}.${extension}`;
}

export async function uploadChatGptAsset(input, dependencies) {
  const {
    origin,
    authorization,
    env,
    ctx,
    workerFetch,
    fetchFile = fetch,
  } = dependencies;
  const downloadUrl = validateInput(input);
  const bucket = env.LOGSEQ_SYNC_ASSETS;
  if (!bucket) throw new Error("missing assets bucket");

  const fileResponse = await fetchFile(downloadUrl);
  if (!fileResponse.ok || !fileResponse.body) {
    throw new Error(`ChatGPT file download failed: ${fileResponse.status}`);
  }
  const size = requiredFileLength(fileResponse);
  const contentType = input.file.mime_type ?? fileResponse.headers.get("content-type");
  const fileName = resolvedFileName(input.file, downloadUrl, contentType);
  const hash = createHash("sha256");
  let received = 0;
  const hashingStream = new TransformStream({
    transform(chunk, controller) {
      const payload = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
      received += payload.byteLength;
      if (received > size) throw new Error("ChatGPT file exceeds declared content-length");
      hash.update(payload);
      controller.enqueue(payload);
    },
  });
  const hashedBody = fileResponse.body.pipeThrough(hashingStream);
  const { body, pipePromise } = fixedLengthBody(hashedBody, size);
  const tempKey = `chatgpt-uploads/${crypto.randomUUID()}`;

  try {
    const uploadResults = await Promise.allSettled([
      bucket.put(tempKey, body, {
        httpMetadata: { contentType: contentType ?? "application/octet-stream" },
      }),
      pipePromise,
    ].filter(Boolean));
    const uploadFailure = uploadResults.find((result) => result.status === "rejected");
    if (uploadFailure) throw uploadFailure.reason;
    if (received !== size) throw new Error("ChatGPT file is shorter than declared content-length");

    const stored = await bucket.get(tempKey);
    if (!stored?.body) throw new Error("temporary ChatGPT upload is missing");
    const url = new URL(`/api/v1/graphs/${encodeURIComponent(input.graphId)}/assets`, origin);
    url.searchParams.set("file-name", fileName);
    url.searchParams.set("size", String(size));
    url.searchParams.set("checksum", hash.digest("hex"));
    if (input.pageId) url.searchParams.set("page-id", input.pageId);
    if (input.title) url.searchParams.set("title", input.title);

    const headers = new Headers();
    if (authorization) headers.set("authorization", authorization);
    headers.set("content-type", contentType ?? "application/octet-stream");
    const response = await workerFetch(new Request(url, {
      method: "POST",
      headers,
      body: stored.body,
      duplex: "half",
    }), env, ctx);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Logseq API request failed: ${response.status} ${JSON.stringify(result)}`);
    }
    return result;
  } finally {
    await bucket.delete(tempKey);
  }
}
