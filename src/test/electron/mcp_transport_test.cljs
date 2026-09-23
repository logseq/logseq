(ns electron.mcp-transport-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.mcp-transport :as mcp-transport]))

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
  took it over - the MCP SDK writes the response itself from that point on -
  and the arguments it was called with."
  [raw-headers]
  (let [seen (atom nil)]
    {:transport #js {:handleRequest (fn [& args]
                                      (reset! seen {:headers @raw-headers
                                                    :args (vec args)})
                                      nil)}
     :seen seen}))

(def ^:private raw-req #js {})
(def ^:private fake-req #js {:raw raw-req})

(deftest copy-reply-headers-test
  (testing "headers queued on the reply are copied onto the raw response"
    (let [{:keys [reply raw-headers]} (fake-reply cors-headers)]
      (#'mcp-transport/copy-reply-headers! reply)
      (is (= cors-headers @raw-headers))))

  (testing "a reply without queued headers leaves the raw response untouched"
    (let [{:keys [reply raw-headers]} (fake-reply {})]
      (#'mcp-transport/copy-reply-headers! reply)
      (is (= {} @raw-headers)))))

(deftest handle-request-with-body-test
  (testing "a POST reaches the transport with the reply's headers already on the raw response"
    (let [{:keys [reply raw-headers]} (fake-reply cors-headers)
          {:keys [transport seen]} (fake-transport raw-headers)
          body #js {:jsonrpc "2.0" :id 2 :method "tools/list"}]
      (mcp-transport/handle-request! transport fake-req reply body)
      (is (= cors-headers (:headers @seen))
          "CORS headers must be on the raw response before the transport writes it")
      (is (= [raw-req (.-raw reply) body] (:args @seen))
          "the transport gets the raw request, the raw response and the parsed body"))))

(deftest handle-request-without-body-test
  (testing "the GET stream reaches the transport with the reply's headers already on the raw response"
    (let [{:keys [reply raw-headers]} (fake-reply cors-headers)
          {:keys [transport seen]} (fake-transport raw-headers)]
      (mcp-transport/handle-request! transport fake-req reply)
      (is (= cors-headers (:headers @seen))
          "CORS headers must be on the raw response before the SSE stream opens")
      (is (= [raw-req (.-raw reply)] (:args @seen))))))
