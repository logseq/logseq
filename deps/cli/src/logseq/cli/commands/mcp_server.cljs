(ns logseq.cli.commands.mcp-server
  "Command to run a MCP server"
  (:require ["@modelcontextprotocol/sdk/server/mcp.js" :refer [McpServer]]
            ["@modelcontextprotocol/sdk/server/stdio.js" :refer [StdioServerTransport]]
            ["fs" :as fs]
            ["zod/v3" :as z]
            [logseq.cli.common.mcp.tools :as cli-common-mcp-tools]
            [logseq.cli.util :as cli-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [nbb.core :as nbb]
            [promesa.core :as p]))

(defn- mcp-error-response [msg]
  #js {:content
       #js [#js {:type "text"
                 :text msg}]})

(defn- mcp-success-response [data]
  (clj->js {:content
            [{:type "text"
              :text (js/JSON.stringify (clj->js data))}]}))

(defn- unexpected-api-error [error]
  #js {:content
       #js [#js {:type "text"
                 :text (str "Unexpected API error: " (.-message error))}]})

(defn- api-tool
  "Calls API method w/ args and returns a MCP response"
  [api-server-token api-method method-args]
  (-> (p/let [resp (cli-util/api-fetch api-server-token api-method method-args)]
        (if (= 200 (.-status resp))
          (p/let [body (.json resp)]
            (mcp-success-response body))
          (cli-util/api-handle-error-response resp mcp-error-response)))
      (p/catch unexpected-api-error)))

(defn- api-get-page
  [{{:keys [api-server-token]} :opts} args]
  (api-tool api-server-token "logseq.cli.getPageData" [(aget args "pageName")]))

(defn- api-list-pages
  [{{:keys [api-server-token]} :opts} _args]
  (api-tool api-server-token "logseq.cli.listPages" []))

(defn- api-list-tags
  [{{:keys [api-server-token]} :opts} _args]
  (api-tool api-server-token "logseq.cli.listTags" []))

(defn- api-list-properties
  [{{:keys [api-server-token]} :opts} _args]
  (api-tool api-server-token "logseq.cli.listProperties" []))

(def ^:private api-tools
  "MCP Tools when running with API server"
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

(defn- local-get-page [conn args]
  (if-let [blocks (cli-common-mcp-tools/get-page-blocks @conn (aget args "pageName"))]
    (mcp-success-response blocks)
    (mcp-error-response (str "Error: Page " (pr-str (aget args "pageName")) " not found"))))

(defn- local-list-pages [conn _args]
  (mcp-success-response (cli-common-mcp-tools/list-pages @conn)))

(defn- local-list-properties [conn _args]
  (mcp-success-response (cli-common-mcp-tools/list-properties @conn)))

(defn- local-list-tags [conn _args]
  (mcp-success-response (cli-common-mcp-tools/list-tags @conn)))

(def ^:private local-tools
  "MCP Tools when running with a local graph"
  (merge-with
   merge
   api-tools
   {:getPage {:fn local-get-page}
    :listPages {:fn local-list-pages}
    :listProperties {:fn local-list-properties}
    :listTags {:fn local-list-tags}}))

(defn start [{{:keys [debug-tool graph] :as opts} :opts :as m}]
  (when (and graph (not (fs/existsSync (cli-util/get-graph-dir graph))))
    (cli-util/error "Graph" (pr-str graph) "does not exist"))
  (if debug-tool
    (if graph
      (if-let [tool-m (get local-tools debug-tool)]
        (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))]
          (p/let [resp ((:fn tool-m) conn (clj->js (dissoc opts :debug-tool)))]
            (js/console.log (clj->js resp))))
        (cli-util/error "Tool" (pr-str debug-tool) "not found"))
      (if-let [tool-m (get api-tools debug-tool)]
        (p/let [resp ((:fn tool-m) m (clj->js (dissoc opts :debug-tool)))]
          (js/console.log resp))
        (cli-util/error "Tool" (pr-str debug-tool) "not found")))
    (let [server (McpServer. #js {:name "Logseq MCP Server"
                                  :version "0.1.0"})
          transport (StdioServerTransport.)
          conn (when graph (apply sqlite-cli/open-db! (cli-util/->open-db-args graph)))]
      (if graph
        (doseq [[k v] local-tools]
          (.registerTool server (name k) (:config v) (partial (:fn v) conn)))
        (doseq [[k v] api-tools]
          (.registerTool server (name k) (:config v) (partial (:fn v) m))))
      (nbb/await (.connect server transport)))))