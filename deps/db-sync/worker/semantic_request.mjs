const MAX_ASSET_SIZE = 100 * 1024 * 1024;

function decodedBase64Size(value) {
  if (typeof value !== "string") throw new Error("base64 asset body must be a string");

  let length = 0;
  let padding = 0;
  let sawPadding = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const code = value.charCodeAt(index);
    if (code === 9 || code === 10 || code === 12 || code === 13 || code === 32) continue;
    if (character === "=") {
      sawPadding = true;
      padding += 1;
    } else {
      const base64Character = (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122) ||
        (code >= 48 && code <= 57) || code === 43 || code === 47;
      if (sawPadding || !base64Character) {
        throw new Error("invalid base64 asset body");
      }
    }
    length += 1;
  }
  if (length % 4 !== 0 || padding > 2) throw new Error("invalid base64 asset body");
  return (length / 4) * 3 - padding;
}

export function semanticRequestUrl(options, baseUrl) {
  const base = new URL(baseUrl);
  const url = new URL(options.path, baseUrl);
  // The check runs on the resolved URL: `new URL` normalizes `/..` and
  // backslashes, and a protocol-relative path (`//evil.example/...`) changes
  // the origin — which would send the user's bearer token elsewhere. Both the
  // origin and the resolved pathname are checked, not the raw string.
  if (url.origin !== base.origin || !url.pathname.startsWith("/api/v1/")) {
    throw new Error("Only Logseq server API paths are allowed");
  }
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  if (url.searchParams.get("encoding") === "base64") {
    const size = decodedBase64Size(options.body);
    // Canonical encrypted asset bytes include the IV, GCM tag, and Transit framing.
    // Their declared size describes the plaintext and is checked by the stream validator.
    const encryptedTitle = /^\["~b[A-Za-z0-9+/]{16}","~b/.test(url.searchParams.get("title") ?? "");
    const header = atob(options.body.replace(/\s/g, "").slice(0, 36));
    const encryptedBody = /^\["~b[A-Za-z0-9+/]{16}","~b/.test(header);
    if (encryptedTitle && encryptedBody) {
      if (size > 27 + 4 * Math.ceil((MAX_ASSET_SIZE + 16) / 3)) {
        throw new Error("encrypted asset exceeds the 100MB plaintext limit");
      }
    } else {
      if (size > MAX_ASSET_SIZE) throw new Error("decoded asset exceeds the 100MB limit");
      url.searchParams.set("size", String(size));
    }
  }
  return url;
}

export function semanticRequestBody(options, url) {
  if (options.body === undefined) return undefined;
  return options.rawBody || url.searchParams.get("encoding") === "base64"
    ? options.body
    : JSON.stringify(options.body);
}
