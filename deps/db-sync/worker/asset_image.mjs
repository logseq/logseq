function bytesToBase64(bytes) {
  const chunkSize = 32 * 1024;
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)));
  }
  return btoa(chunks.join(""));
}

const MAX_DISPLAY_IMAGE_SIZE = 10 * 1024 * 1024;

export function assertDisplayableImageMetadata(metadata) {
  if (!Number.isSafeInteger(metadata.size) || metadata.size < 0) {
    throw new Error("asset has an invalid size");
  }
  if (metadata.size > MAX_DISPLAY_IMAGE_SIZE) {
    throw new Error("asset is too large to display directly (10MB maximum)");
  }
}

export async function assetImageResult(response, metadata) {
  const mimeType = response.headers.get("content-type")?.split(";", 1)[0];
  if (!response.ok || !mimeType?.startsWith("image/")) {
    throw new Error(`asset response is not an image (${response.status} ${mimeType ?? "unknown"})`);
  }
  const data = bytesToBase64(new Uint8Array(await response.arrayBuffer()));
  return {
    content: [
      { type: "image", data, mimeType },
      { type: "text", text: `${metadata.title ?? "Image asset"} (${metadata.uuid})` },
    ],
  };
}
