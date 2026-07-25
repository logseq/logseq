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
  const url = new URL(options.path, baseUrl);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  if (url.searchParams.get("encoding") === "base64") {
    const size = decodedBase64Size(options.body);
    if (size > MAX_ASSET_SIZE) throw new Error("decoded asset exceeds the 100MB limit");
    url.searchParams.set("size", String(size));
  }
  return url;
}

export function semanticRequestBody(options, url) {
  if (options.body === undefined) return undefined;
  return options.rawBody || url.searchParams.get("encoding") === "base64"
    ? options.body
    : JSON.stringify(options.body);
}
