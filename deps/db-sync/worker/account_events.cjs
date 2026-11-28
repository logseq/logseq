const graphIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function sendEvent(socket, event) {
  if (socket.readyState !== 1) return;
  try {
    socket.send(JSON.stringify(event));
  } catch {
    socket.close(1011, "Event delivery failed");
  }
}

function active(socket, connection) {
  if (!connection || socket.readyState !== 1) return false;
  if (connection.expiresAt > Date.now()) return true;
  socket.close(1008, "Logseq session expired");
  return false;
}

function ready(socket, connection) {
  sendEvent(socket, {type: "ready", expiresAt: connection.expiresAt});
}

async function unsubscribe(connection, graph) {
  if (connection.graphId) await graph.unsubscribe(connection);
}

async function receive(socket, raw, context) {
  const {graph, load, save} = context;
  const connection = load(socket);
  if (!active(socket, connection)) return;
  let event;
  try {
    if (typeof raw !== "string" || raw.length > 4 * 1024 * 1024) throw new Error("Frame too large");
    event = JSON.parse(raw);
  } catch {
    socket.close(1007, "Invalid Logseq event frame");
    return;
  }
  const {type, subscription, graphId, frame} = event ?? {};
  if (typeof subscription !== "string" || !graphIdPattern.test(subscription)) return;
  const reject = message => sendEvent(socket, {type: "graph.error", subscription, message});
  try {
    if (type === "graph.subscribe") {
      if (typeof graphId !== "string" || !graphIdPattern.test(graphId) ||
          !await graph.hasAccess(connection.account, graphId)) {
        reject("Graph access denied");
        return;
      }
      const next = {...connection, graphId, subscription};
      if (!await graph.subscribe(next)) {
        reject("Graph not ready");
        return;
      }
      if (!active(socket, connection)) {
        await unsubscribe(next, graph);
        return;
      }
      save(socket, next);
      sendEvent(socket, {type: "graph.subscribed", subscription});
      if (connection.subscription !== subscription || connection.graphId !== graphId) {
        await unsubscribe(connection, graph);
      }
    } else if (type === "graph.unsubscribe" && subscription === connection.subscription) {
      save(socket, {...connection, graphId: null, subscription: null});
      await unsubscribe(connection, graph);
    } else if (type === "graph.frame" && subscription === connection.subscription && typeof frame === "string") {
      if (!await graph.hasAccess(connection.account, connection.graphId)) {
        reject("Graph access denied");
        save(socket, {...connection, graphId: null, subscription: null});
        await unsubscribe(connection, graph);
        return;
      }
      const reply = await graph.frame(connection, frame);
      if (reply != null && active(socket, connection)) {
        sendEvent(socket, {type: "graph.frame", subscription, frame: reply});
      }
    }
  } catch (error) {
    console.error("Logseq Graph event failed", error.code ?? error.name);
    reject("Graph sync is temporarily unavailable");
  }
}

function sendGraphChange(socket, connection, graphId, frame) {
  if (active(socket, connection) && connection.graphId === graphId) {
    sendEvent(socket, {type: "graph.frame", subscription: connection.subscription, frame});
  }
}

module.exports = {active, ready, receive, sendEvent, sendGraphChange, unsubscribe};
