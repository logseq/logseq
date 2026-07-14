export function apiDocsResponse(path, html) {
  if (path !== "/api-docs" && path !== "/api-docs/") return null;
  return new Response(html, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "text/html; charset=utf-8",
    },
  });
}
