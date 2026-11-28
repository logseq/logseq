const events = require("./account_events.cjs");

function createAccountEvents({hasAccess, graphContext, relayReady, relayFrame}) {
  const connections = new Map();
  const byAccount = new Map();
  const byGraph = new Map();
  const socketsFor = (groups, key) => {
    if (!groups.has(key)) groups.set(key, new Set());
    return groups.get(key);
  };
  const remove = (groups, key, socket) => {
    const sockets = groups.get(key);
    sockets?.delete(socket);
    if (!sockets?.size) groups.delete(key);
  };

  const context = {
    load: socket => connections.get(socket),
    save(socket, connection) {
      const previous = connections.get(socket)?.graphId;
      if (previous) remove(byGraph, previous, socket);
      if (connection.graphId) socketsFor(byGraph, connection.graphId).add(socket);
      connections.set(socket, connection);
    },
    graph: {
      hasAccess,
      async subscribe({graphId}) {
        const graph = graphContext(graphId);
        graph.accountEventsBroadcast = frame => {
          for (const socket of byGraph.get(graphId) ?? []) {
            const connection = connections.get(socket);
            hasAccess(connection.account, graphId).then(allowed => {
              if (allowed && connections.get(socket) === connection) {
                events.sendGraphChange(socket, connection, graphId, frame);
              }
            }).catch(error => console.error("Logseq Graph notification failed", error.code ?? error.name));
          }
        };
        return relayReady(graph, graphId);
      },
      unsubscribe() {},
      frame({graphId, user}, frame) {
        return relayFrame(graphContext(graphId), graphId, user, frame);
      },
    },
  };

  return {
    runnerRequest: events.isRunnerRequest,
    attach(socket, identity) {
      const accountSockets = socketsFor(byAccount, identity.account);
      if (accountSockets.size >= 24) {
        socket.close(1013, "Too many Logseq connections");
        return;
      }
      connections.set(socket, identity);
      accountSockets.add(socket);
      let pending = Promise.resolve();
      socket.on("message", data => {
        const raw = data.toString();
        if (identity.runnerId && raw === "ping" && socket.readyState === 1) {
          socket.send("pong");
        } else {
          pending = pending.then(() => events.receive(socket, raw, context)).catch(() => socket.close(1011));
        }
      });
      const dispose = () => {
        const connection = connections.get(socket);
        if (!connection) return;
        connections.delete(socket);
        remove(byAccount, connection.account, socket);
        if (connection.graphId) remove(byGraph, connection.graphId, socket);
      };
      socket.once("close", dispose);
      socket.once("error", dispose);
      events.ready(socket, identity);
    },
    publish(account, event) {
      for (const socket of byAccount.get(account) ?? []) {
        events.publishEvent(socket, connections.get(socket), event);
      }
    },
    onlineRunners(account) {
      return Array.from(byAccount.get(account) ?? [], socket =>
        socket.readyState === 1 ? connections.get(socket)?.runnerId : null).filter(Boolean);
    },
    close() {
      for (const socket of connections.keys()) socket.close(1001, "Logseq server shutting down");
    },
  };
}

module.exports = {createAccountEvents};
