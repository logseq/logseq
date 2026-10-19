(ns electron.mcp-transport
  "Hands a fastify request over to an MCP transport. Kept apart from
  electron.mcp-server, which loads the MCP SDK, so the hand-off can be tested
  without it.")

(defn- copy-reply-headers!
  "Copies the headers fastify plugins queued on the reply onto the raw Node
  response."
  [^js res]
  (doseq [[k v] (js/Object.entries (.getHeaders res))]
    (.setHeader (.-raw res) k v)))

(defn handle-request!
  "Lets `transport` answer on the raw Node request and response. The transport
  writes the raw response itself, so headers that fastify plugins queued on the
  reply - notably the CORS headers from @fastify/cors - are copied onto it first;
  otherwise they would never be sent."
  ([^js transport ^js req ^js res]
   (copy-reply-headers! res)
   (.handleRequest transport (.-raw req) (.-raw res)))
  ([^js transport ^js req ^js res body]
   (copy-reply-headers! res)
   (.handleRequest transport (.-raw req) (.-raw res) body)))
