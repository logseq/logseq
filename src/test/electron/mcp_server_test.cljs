(ns electron.mcp-server-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [electron.mcp-server :as mcp-server]))

(def ^:private cors-headers
  {"access-control-allow-origin" "*"
   "access-control-expose-headers" "mcp-session-id"
   "vary" "Origin"})

(defn- fake-reply
  "A fastify reply whose plugins (e.g. @fastify/cors) queued `headers`, wrapping
  a raw Node response that records every header set on it."
  [headers]
  (let [raw-headers (atom {})]
    {:reply #js {:getHeaders (fn [] (clj->js headers))
                 :raw #js {:setHeader (fn [k v] (swap! raw-headers assoc k v))}}
     :raw-headers raw-headers}))

(defn- fake-transport
  "Records which headers were already on the raw response when the transport
  took it over - the MCP SDK writes the response itself from that point on."
  [raw-headers]
  (let [seen (atom nil)]
    {:transport #js {:handleRequest (fn [& _] (reset! seen @raw-headers) nil)}
     :seen seen}))

(defn- fake-request
  [session-id]
  #js {:headers #js {"mcp-session-id" session-id}
       :raw #js {}
       :body #js {:jsonrpc "2.0" :id 2 :method "tools/list"}})

(use-fixtures :each
  {:after #(reset! @#'mcp-server/transports {})})

(deftest copy-reply-headers-test
  (testing "headers queued on the reply are copied onto the raw response"
    (let [{:keys [reply raw-headers]} (fake-reply cors-headers)]
      (#'mcp-server/copy-reply-headers! reply)
      (is (= cors-headers @raw-headers))))

  (testing "a reply without queued headers leaves the raw response untouched"
    (let [{:keys [reply raw-headers]} (fake-reply {})]
      (#'mcp-server/copy-reply-headers! reply)
      (is (= {} @raw-headers)))))

(deftest post-on-existing-session-sends-reply-headers-test
  (let [{:keys [reply raw-headers]} (fake-reply cors-headers)
        {:keys [transport seen]} (fake-transport raw-headers)]
    (reset! @#'mcp-server/transports {"session-1" transport})
    (mcp-server/handle-post-request nil {:port 12315 :host "127.0.0.1"}
                                    (fake-request "session-1") reply)
    (is (= cors-headers @seen)
        "CORS headers must already be on the raw response when the transport writes it")))

(deftest get-stream-sends-reply-headers-test
  (let [{:keys [reply raw-headers]} (fake-reply cors-headers)
        {:keys [transport seen]} (fake-transport raw-headers)]
    (reset! @#'mcp-server/transports {"session-1" transport})
    (mcp-server/handle-get-request (fake-request "session-1") reply)
    (is (= cors-headers @seen)
        "CORS headers must already be on the raw response when the SSE stream opens")))
