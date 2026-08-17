(ns electron.mcp-server-test
  (:require ["fastify" :as Fastify]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [electron.interop :as interop]
            [electron.mcp-server :as mcp-server]
            [promesa.core :as p]))

(def ^:private initialize-request
  #js {:jsonrpc "2.0"
       :id 1
       :method "initialize"
       :params #js {:protocolVersion "2025-03-26"
                    :capabilities #js {}
                    :clientInfo #js {:name "mcp-server-test"
                                     :version "0.0.1"}}})

(def ^:private tools-list-request
  #js {:jsonrpc "2.0"
       :id 2
       :method "tools/list"
       :params #js {}})

(defn- fastify []
  (interop/default-function-or-module Fastify))

(defn- sse-data-payloads [body]
  (->> (string/split (str body) #"\n")
       (keep (fn [line]
               (when (string/starts-with? line "data: ")
                 (js/JSON.parse (subs line 6)))))))

(defn- read-sse-until-data
  [^js response timeout-ms]
  (p/create
   (fn [resolve reject]
     (let [reader (.. response -body getReader)
           decoder (js/TextDecoder.)
           buf (atom "")
           timer (js/setTimeout
                  (fn []
                    (.cancel reader)
                    (reject (ex-info "timed out waiting for SSE data"
                                     {:body @buf
                                      :status (.-status response)
                                      :content-type (.get (.-headers response) "content-type")
                                      :session-id (.get (.-headers response) "mcp-session-id")})))
                  timeout-ms)
           finish (fn [value]
                    (js/clearTimeout timer)
                    (resolve value))
           step (fn step []
                  (-> (.read reader)
                      (.then (fn [result]
                               (if (.-done result)
                                 (finish @buf)
                                 (do (swap! buf str (.decode decoder (.-value result) #js {:stream true}))
                                     (if (re-find #"data: " @buf)
                                       (do (.cancel reader)
                                           (finish @buf))
                                       (step))))))
                      (.catch (fn [error]
                                (js/clearTimeout timer)
                                (if (re-find #"data: " @buf)
                                  (resolve @buf)
                                  (reject error))))))]
       (step)))))

(defn- post-mcp
  [url body headers]
  (js/fetch url #js {:method "POST"
                     :headers (clj->js (merge {"content-type" "application/json"
                                               "accept" "application/json, text/event-stream"}
                                              headers))
                     :body (js/JSON.stringify body)}))

(defn- start-mcp-test-server!
  []
  (let [port* (atom nil)
        api-fn (fn [_meth _args] #js {:ok true})
        ^js app ((fastify) #js {:logger false})]
    (.post app "/mcp"
           (fn [req res]
             (mcp-server/handle-post-request api-fn {:port @port* :host "127.0.0.1"} req res)))
    (.get app "/mcp" mcp-server/handle-get-request)
    (.delete app "/mcp" mcp-server/handle-delete-request)
    (p/let [_ (.listen app #js {:host "127.0.0.1" :port 0})
            port (.-port (.address (.-server app)))]
      (reset! port* port)
      {:app app
       :port port
       :url (str "http://127.0.0.1:" port "/mcp")})))

(deftest initialize-sse-emits-result-and-reuses-session
  (async done
    (let [app* (atom nil)]
      (-> (p/let [{:keys [app url]} (start-mcp-test-server!)
                  _ (reset! app* app)
                  init-res (post-mcp url initialize-request nil)
                  init-body (read-sse-until-data init-res 3000)
                  session-id (.get (.-headers init-res) "mcp-session-id")
                  ^js init-payload (first (sse-data-payloads init-body))
                  tools-res (post-mcp url tools-list-request {"mcp-session-id" session-id})
                  tools-body (read-sse-until-data tools-res 3000)
                  ^js tools-payload (first (sse-data-payloads tools-body))
                  second-init-res (post-mcp url initialize-request nil)
                  second-init-body (read-sse-until-data second-init-res 3000)
                  second-session-id (.get (.-headers second-init-res) "mcp-session-id")
                  ^js second-payload (first (sse-data-payloads second-init-body))]
            (is (= 200 (.-status init-res)))
            (is (string/includes? (or (.get (.-headers init-res) "content-type") "")
                                  "text/event-stream"))
            (is (string? session-id))
            (is (seq session-id))
            (is (= "2.0" (.-jsonrpc init-payload)))
            (is (= 1 (.-id init-payload)))
            (is (= "2025-03-26" (.. init-payload -result -protocolVersion)))
            (is (= "Logseq MCP Server" (.. init-payload -result -serverInfo -name)))
            (is (= 200 (.-status tools-res)))
            (is (some (fn [^js tool] (= "listPages" (.-name tool)))
                      (or (some-> ^js (.-result tools-payload) .-tools array-seq)
                          [])))
            (is (= 200 (.-status second-init-res)))
            (is (string? second-session-id))
            (is (not= session-id second-session-id))
            (is (= "Logseq MCP Server" (.. second-payload -result -serverInfo -name))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally (fn []
                       (when-let [^js app @app*]
                         (.close app))
                       (done)))))))
