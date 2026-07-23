export function ensureMcpAcceptHeader(request) {
  const accept = request.headers.get("accept") ?? "";
  const normalizedAccept = accept.toLowerCase();
  if (normalizedAccept.includes("application/json") &&
      normalizedAccept.includes("text/event-stream")) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set("accept", "application/json, text/event-stream");
  return new Request(request, { headers });
}
