(ns electron.mcp-server-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [electron.mcp-server :as mcp-server]
            [promesa.core :as p]))

(defn- initialize-request
  [id client-name]
  #js {:jsonrpc "2.0"
       :id id
       :method "initialize"
       :params #js {:protocolVersion "2025-03-26"
                    :capabilities #js {}
                    :clientInfo #js {:name client-name
                                    :version "0.0.1"}}})

(def ^:private tools-list-request
  #js {:jsonrpc "2.0"
       :id 3
       :method "tools/list"
       :params #js {}})

(defn- sse-data-payload
  [body]
  (some (fn [line]
          (when (string/starts-with? line "data: ")
            (js/JSON.parse (subs line 6))))
        (string/split (str body) #"\n")))

(defn- read-sse-data
  [^js response]
  (p/create
   (fn [resolve reject]
     (let [reader (.. response -body getReader)
           decoder (js/TextDecoder.)
           body* (atom "")
           timeout (js/setTimeout
                    (fn []
                      (.cancel reader)
                      (reject (ex-info "Timed out waiting for MCP SSE data"
                                       {:body @body*
                                        :status (.-status response)})))
                    3000)
           finish! (fn [body]
                     (js/clearTimeout timeout)
                     (resolve body))
           read! (fn read! []
                   (-> (.read reader)
                       (.then
                        (fn [result]
                          (if (.-done result)
                            (finish! @body*)
                            (do
                              (swap! body* str (.decode decoder (.-value result)
                                                       #js {:stream true}))
                              (if (sse-data-payload @body*)
                                (do
                                  (.cancel reader)
                                  (finish! @body*))
                                (read!))))))
                       (.catch (fn [error]
                                 (js/clearTimeout timeout)
                                 (reject error)))))]
       (read!)))))

(defn- post-mcp
  [url body session-id]
  (js/fetch url
            #js {:method "POST"
                 :headers (cond-> {"content-type" "application/json"
                                   "accept" "application/json, text/event-stream"}
                            session-id (assoc "mcp-session-id" session-id)
                            true clj->js)
                 :body (js/JSON.stringify body)}))

(defn- handle-request
  [api-fn port* ^js raw-req ^js raw-res]
  (let [body* (atom "")]
    (.setEncoding raw-req "utf8")
    (.on raw-req "data" #(swap! body* str %))
    (.on raw-req "end"
         (fn []
           (try
             (let [req #js {:headers (.-headers raw-req)
                            :body (js/JSON.parse @body*)
                            :raw raw-req}
                   res #js {:raw raw-res}]
               (mcp-server/handle-post-request
                api-fn
                {:host "127.0.0.1" :port @port*}
                req
                res))
             (catch :default error
               (set! (.-statusCode raw-res) 500)
               (.end raw-res (.-message error))))))))

(defn- start-mcp-test-server!
  []
  (p/create
   (fn [resolve reject]
     (let [http (js/require "http")
           port* (atom nil)
           api-fn (fn [_method _args] #js {:ok true})
           server (.createServer http (partial handle-request api-fn port*))]
       (.on server "error" reject)
       (.listen server 0 "127.0.0.1"
                (fn []
                  (let [port (.-port (.address server))]
                    (reset! port* port)
                    (resolve
                     {:url (str "http://127.0.0.1:" port "/mcp")
                      :stop! (fn []
                               (p/create
                                (fn [resolve _reject]
                                  (.close server (fn [] (resolve true))))))}))))))))

(deftest second-http-session-initializes-without-breaking-first
  (async done
    (let [stop!* (atom nil)]
      (-> (p/let [{:keys [url stop!]} (start-mcp-test-server!)
                  _ (reset! stop!* stop!)
                  first-response (post-mcp url (initialize-request 1 "first-client") nil)
                  first-body (read-sse-data first-response)
                  first-session-id (.get (.-headers first-response) "mcp-session-id")
                  second-response (post-mcp url (initialize-request 2 "second-client") nil)
                  second-body (read-sse-data second-response)
                  second-session-id (.get (.-headers second-response) "mcp-session-id")
                  first-tools-response (post-mcp url tools-list-request first-session-id)
                  first-tools-body (read-sse-data first-tools-response)
                  first-payload (sse-data-payload first-body)
                  second-payload (sse-data-payload second-body)
                  first-tools-payload (sse-data-payload first-tools-body)]
            (is (= 200 (.-status first-response)))
            (is (= 200 (.-status second-response)))
            (is (seq first-session-id))
            (is (seq second-session-id))
            (is (not= first-session-id second-session-id))
            (is (= 1 (.-id first-payload)))
            (is (= 2 (.-id second-payload)))
            (is (= "Logseq MCP Server" (.. first-payload -result -serverInfo -name)))
            (is (= "Logseq MCP Server" (.. second-payload -result -serverInfo -name)))
            (is (= 200 (.-status first-tools-response)))
            (is (some (fn [^js tool]
                        (= "listPages" (.-name tool)))
                      (array-seq (.. first-tools-payload -result -tools)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally (fn []
                       (if-let [stop! @stop!*]
                         (-> (stop!)
                             (p/finally done))
                         (done))))))))
