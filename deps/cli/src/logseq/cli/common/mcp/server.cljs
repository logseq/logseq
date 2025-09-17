(ns logseq.cli.common.mcp.server
  "MCP server related fns shared between CLI and frontend"
  (:require ["@modelcontextprotocol/sdk/server/mcp.js" :refer [McpServer]]
            ["@modelcontextprotocol/sdk/server/streamableHttp.js" :refer [StreamableHTTPServerTransport]]
            ["@modelcontextprotocol/sdk/types.js" :refer [isInitializeRequest]]
            ["zod/v3" :as z] ;; zod 4 doesn't work w/ mcp - https://github.com/modelcontextprotocol/typescript-sdk/issues/925
            [promesa.core :as p]))

;; Server util fns
;; ===============
(def ^:private transports
  "Stores transports by session ID"
  (atom {}))

;; See https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http
;; for how to respond to different MCP requests
(defn handle-post-request [mcp-server {:keys [port host]} req res]
  (let [session-id (aget (.-headers req) "mcp-session-id")]
    (js/console.log "POST /mcp request" session-id (.-body req))
    (cond
      (and session-id (@transports session-id))
      (let [^js transport (@transports session-id)]
        (.handleRequest transport (.-raw req) (.-raw res) (.-body req)))

      (and (not session-id)
           (isInitializeRequest (.-body req)))
      (let [transport (StreamableHTTPServerTransport.
                       #js {:sessionIdGenerator (comp str random-uuid)
                            :enableDnsRebindingProtection true
                            :allowedHosts #js [(str host ":" port)]})]
        (set! (.-onclose transport)
              (fn []
                (js/console.log "Transport closed" (.-sessionId transport))
                (swap! transports dissoc (.-sessionId transport))))
        (.connect mcp-server transport)
        (.handleRequest transport (.-raw req) (.-raw res) (.-body req))
        (js/console.log "Initialize sessionId" (.-sessionId transport))
        (if (.-sessionId transport)
          (swap! transports assoc (.-sessionId transport) transport)
          (js/console.error "No sessionId to initialize!"))
        res)

      :else
      (do
        (.code res 400)
        (.send res #js {:jsonrpc "2.0"
                        :error #js {:code -32000
                                    :message "Bad Request: No valid session ID provided"}
                        :id nil})))))

(defn handle-get-request
  [req res]
  (let [session-id (aget (.-headers req) "mcp-session-id")]
    (js/console.log "GET /mcp" session-id)
    (if-let [transport (and session-id (@transports session-id))]
      (.handleRequest ^js transport (.-raw req) (.-raw res))
      (-> res (.status 400) (.send res "Invalid or missing session ID")))))

(defn handle-delete-request
  [req res]
  (let [session-id (aget (.-headers req) "mcp-session-id")]
    (js/console.log "DELETE /mcp" session-id)
    (if-let [transport (and session-id (@transports session-id))]
      (do
        (.close transport)
        (-> res (.code 200) (.send #js {:ok true})))
      (-> res (.status 400) (.send res "Invalid or missing session ID")))))

(defn mcp-error-response [msg]
  #js {:content
       #js [#js {:type "text"
                 :text msg}]})

(defn mcp-success-response [data]
  (clj->js {:content
            [{:type "text"
              :text (js/JSON.stringify (clj->js data))}]}))

;; API tool fns
;; ============
(defn- unexpected-api-error [error]
  #js {:content
       #js [#js {:type "text"
                 :text (str "Unexpected API error: " (.-message error))}]})

(defn- api-tool
  "Calls API method w/ args and returns a MCP response"
  [api-fn api-method method-args]
  (-> (p/let [body (api-fn api-method method-args)]
        (if-let [error (aget body "error")]
          (mcp-error-response (str "API Error: " error))
          (mcp-success-response body)))
      (p/catch unexpected-api-error)))

(defn- api-get-page
  [call-api-fn args]
  (call-api-fn "logseq.cli.getPageData" [(aget args "pageName")]))

(defn- api-list-pages
  [call-api-fn _args]
  (call-api-fn "logseq.cli.listPages" []))

(defn- api-list-tags
  [call-api-fn _args]
  (call-api-fn "logseq.cli.listTags" []))

(defn- api-list-properties
  [call-api-fn _args]
  (call-api-fn "logseq.cli.listProperties" []))

(def api-tools
  "MCP Tools when calling API server"
  {:listPages
   {:fn api-list-pages
    :config #js {:title "List Pages"}}
   :getPage
   {:fn api-get-page
    :config #js {:title "Get Page"
                 :description "Get a page's content including its blocks"
                 :inputSchema #js {:pageName (z/string)}}}
   :listTags
   {:fn api-list-tags
    :config #js {:title "List Tags"}}
   :listProperties
   {:fn api-list-properties
    :config #js {:title "List Properties"}}})

(defn call-api-tool [tool-fn api-fn args]
  (tool-fn (partial api-tool api-fn) args))

;; Server fns
;; ==========
(defn create-mcp-server []
  (McpServer. #js {:name "Logseq MCP Server"
                   :version "0.1.0"}))

(defn create-mcp-api-server [api-fn]
  (let [mcp-server (create-mcp-server)]
    (doseq [[k v] api-tools]
      (.registerTool mcp-server
                     (name k)
                     (:config v)
                     (partial call-api-tool (:fn v) api-fn)))
    mcp-server))