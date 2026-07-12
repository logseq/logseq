import assert from "node:assert/strict";
import test from "node:test";

import { assertDisplayableImageMetadata, assetImageResult } from "./asset_image.mjs";

test("asset image result returns MCP image content", async () => {
  const response = new Response(new Uint8Array([1, 2, 3, 4]), {
    headers: { "content-type": "image/jpeg" },
  });

  assert.deepEqual(await assetImageResult(response, { uuid: "asset-1", title: "Photo" }), {
    content: [
      { type: "image", data: "AQIDBA==", mimeType: "image/jpeg" },
      { type: "text", text: "Photo (asset-1)" },
    ],
  });
});

test("asset image result rejects non-image responses", async () => {
  await assert.rejects(
    assetImageResult(new Response("{}", { headers: { "content-type": "application/json" } }), {}),
    /not an image/,
  );
});

test("asset image display rejects payloads that are unsafe to base64 in Worker memory", () => {
  assert.throws(
    () => assertDisplayableImageMetadata({ size: 10 * 1024 * 1024 + 1 }),
    /too large to display/,
  );
});
