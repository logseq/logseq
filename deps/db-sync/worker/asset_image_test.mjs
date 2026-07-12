import assert from "node:assert/strict";
import test from "node:test";

import * as assetImage from "./asset_image.mjs";

test("asset image result returns MCP image content", async () => {
  const response = new Response(new Uint8Array([1, 2, 3, 4]), {
    headers: { "content-type": "image/jpeg" },
  });

  assert.deepEqual(await assetImage.assetImageResult(response, { uuid: "asset-1", title: "Photo" }), {
    structuredContent: {
      uuid: "asset-1",
      title: "Photo",
      mimeType: "image/jpeg",
      size: 4,
    },
    content: [
      { type: "image", data: "AQIDBA==", mimeType: "image/jpeg" },
      { type: "text", text: "Photo (asset-1)" },
    ],
    _meta: {
      image: {
        data: "AQIDBA==",
        mimeType: "image/jpeg",
        title: "Photo",
        uuid: "asset-1",
      },
    },
  });
});

test("asset image result rejects non-image responses", async () => {
  await assert.rejects(
    assetImage.assetImageResult(new Response("{}", { headers: { "content-type": "application/json" } }), {}),
    /not an image/,
  );
});

test("asset image display rejects payloads that are unsafe to base64 in Worker memory", () => {
  assert.throws(
    () => assetImage.assertDisplayableImageMetadata({ size: 10 * 1024 * 1024 + 1 }),
    /too large to display/,
  );
});

test("asset image resource is an MCP app component that renders tool results", async () => {
  assert.equal(typeof assetImage.assetImageResource, "function");
  const resource = await assetImage.assetImageResource();
  const content = resource.contents[0];

  assert.equal(content.uri, assetImage.ASSET_IMAGE_RESOURCE_URI);
  assert.equal(content.mimeType, "text/html;profile=mcp-app");
  assert.match(content.text, /ui\/notifications\/tool-result/);
  assert.match(content.text, /toolResponseMetadata/);
  assert.match(content.text, /createObjectURL/);
  assert.doesNotMatch(content.text, /https?:\/\//);
});
