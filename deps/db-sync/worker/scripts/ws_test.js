const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8787";
const graphId = process.env.GRAPH_ID || "dev-graph";

const wsUrl = baseUrl.replace(/^http/, "ws") + `/sync/${graphId}`;

const WebSocketCtor = globalThis.WebSocket;
if (!WebSocketCtor) {
  console.error("WebSocket not available. Use node>=20 or provide a WebSocket polyfill.");
  process.exit(1);
}

const ws = new WebSocketCtor(wsUrl);
let pending = 0;

ws.addEventListener("open", () => {
  ws.send(JSON.stringify({ type: "hello", client: "ws-test" }));
  ws.send(JSON.stringify({ type: "ping" }));
  ws.send(JSON.stringify({ type: "pull", since: 0 }));
  pending = 3;
});

ws.addEventListener("message", (event) => {
  console.log(String(event.data));
  pending -= 1;
  if (pending <= 0) {
    ws.close();
  }
});

ws.addEventListener("error", (event) => {
  console.error("ws error", event);
});
