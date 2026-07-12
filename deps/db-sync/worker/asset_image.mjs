function bytesToBase64(bytes) {
  const chunkSize = 32 * 1024;
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)));
  }
  return btoa(chunks.join(""));
}

const MAX_DISPLAY_IMAGE_SIZE = 10 * 1024 * 1024;

export const ASSET_IMAGE_RESOURCE_URI = "ui://widget/logseq-asset-image.html";

const ASSET_IMAGE_COMPONENT_HTML = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        padding: 8px;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      figure { margin: 0; }
      #image-button {
        display: block;
        width: 100%;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: zoom-in;
      }
      img {
        display: block;
        width: 100%;
        height: auto;
        max-height: min(70vh, 720px);
        object-fit: contain;
        border-radius: 8px;
      }
      figcaption {
        margin-top: 6px;
        color: rgba(127, 127, 127, 0.95);
        font-size: 12px;
        line-height: 1.4;
      }
      .error {
        color: #b42318;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <figure>
      <button id="image-button" type="button" aria-label="Open image fullscreen">
        <img id="image" alt="">
      </button>
      <figcaption id="caption"></figcaption>
    </figure>
    <p id="error" class="error" hidden>Image data was not provided by the tool result.</p>
    <script>
      let objectUrl;

      function currentToolResult() {
        const metadata = window.openai?.toolResponseMetadata;
        return metadata?.mcp_tool_result
          || metadata?.call_tool_result
          || { structuredContent: window.openai?.toolOutput };
      }

      function imageFromResult(result) {
        const metadataImage = result?._meta?.image;
        if (metadataImage?.data && metadataImage?.mimeType) return metadataImage;

        const contentImage = result?.content?.find((item) => item?.type === "image");
        if (!contentImage?.data || !contentImage?.mimeType) return null;

        const details = result?.structuredContent || {};
        return {
          data: contentImage.data,
          mimeType: contentImage.mimeType,
          title: details.title,
          uuid: details.uuid,
        };
      }

      function bytesFromBase64(base64) {
        const raw = atob(base64);
        const payload = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) payload[i] = raw.charCodeAt(i);
        return payload;
      }

      function notifyHeight() {
        const notify = window.openai?.notifyIntrinsicHeight;
        if (!notify) return;

        const height = Math.ceil(document.documentElement.scrollHeight);
        try {
          notify({ height });
        } catch (_) {
          try {
            notify(height);
          } catch (_) {
            notify();
          }
        }
      }

      function scheduleHeightNotification() {
        requestAnimationFrame(() => notifyHeight());
      }

      async function requestFullscreen() {
        await window.openai?.requestDisplayMode?.({ mode: "fullscreen" });
        scheduleHeightNotification();
      }

      function render(result) {
        const image = imageFromResult(result);
        const buttonElement = document.getElementById("image-button");
        const imageElement = document.getElementById("image");
        const captionElement = document.getElementById("caption");
        const errorElement = document.getElementById("error");

        if (!image) {
          buttonElement.hidden = true;
          imageElement.hidden = true;
          captionElement.textContent = "";
          errorElement.hidden = false;
          scheduleHeightNotification();
          return;
        }

        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(new Blob([bytesFromBase64(image.data)], { type: image.mimeType }));
        imageElement.src = objectUrl;
        imageElement.alt = image.title || "Logseq image asset";
        buttonElement.hidden = false;
        imageElement.hidden = false;
        errorElement.hidden = true;
        captionElement.textContent = image.title
          ? image.uuid ? image.title + " (" + image.uuid + ")" : image.title
          : image.uuid || "";
        scheduleHeightNotification();
      }

      document.getElementById("image").addEventListener("load", notifyHeight);
      document.getElementById("image-button").addEventListener("click", () => {
        requestFullscreen().catch(() => {});
      });

      render(currentToolResult());

      window.addEventListener("message", (event) => {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!message || message.jsonrpc !== "2.0") return;
        if (message.method !== "ui/notifications/tool-result") return;
        render(message.params);
      }, { passive: true });

      window.addEventListener("openai:set_globals", (event) => {
        const metadata = event.detail?.globals?.toolResponseMetadata;
        const output = event.detail?.globals?.toolOutput;
        render(metadata?.mcp_tool_result || metadata?.call_tool_result || { structuredContent: output });
      }, { passive: true });
    </script>
  </body>
</html>
`.trim();

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
  const payload = new Uint8Array(await response.arrayBuffer());
  const data = bytesToBase64(payload);
  const title = metadata.title ?? "Image asset";
  const uuid = metadata.uuid;
  return {
    structuredContent: {
      uuid,
      title,
      mimeType,
      size: payload.length,
    },
    content: [
      { type: "image", data, mimeType },
      { type: "text", text: `${title} (${uuid})` },
    ],
    _meta: {
      ui: { resourceUri: ASSET_IMAGE_RESOURCE_URI },
      "openai/outputTemplate": ASSET_IMAGE_RESOURCE_URI,
      image: {
        data,
        mimeType,
        title,
        uuid,
      },
    },
  };
}

export async function assetImageResource() {
  return {
    contents: [
      {
        uri: ASSET_IMAGE_RESOURCE_URI,
        mimeType: "text/html;profile=mcp-app",
        text: ASSET_IMAGE_COMPONENT_HTML,
        _meta: {
          ui: {
            prefersBorder: true,
          },
        },
      },
    ],
  };
}
