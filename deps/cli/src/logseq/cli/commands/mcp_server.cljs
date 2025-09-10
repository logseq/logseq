(ns logseq.cli.commands.mcp-server
  "Command to run a MCP server"
  (:require ["@modelcontextprotocol/sdk/server/mcp.js" :refer [McpServer]]
            ["@modelcontextprotocol/sdk/server/stdio.js" :refer [StdioServerTransport]]
            ["fs" :as fs]
            ["zod/v3" :as z]
            [datascript.core :as d]
            [logseq.cli.util :as cli-util]
            [logseq.db :as ldb]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.outliner.tree :as otree]
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

(defn- api-get-all-pages
  [{{:keys [api-server-token]} :opts} _args]
  (-> (p/let [resp (cli-util/api-fetch api-server-token "logseq.editor.getAllPages" [])]
        (if (= 200 (.-status resp))
          (p/let [body (.json resp)
                  pages (map #(hash-map :title (.-title %)
                                        :createdAt (.-createdAt %)
                                        :updatedAt (.-updatedAt %)
                                        :id (.-uuid %))
                             body)]
            (mcp-success-response pages))
          (cli-util/api-handle-error-response resp mcp-error-response)))
      (p/catch unexpected-api-error)))

(defn- api-get-page
  [{{:keys [api-server-token]} :opts} args]
  (-> (p/let [resp (cli-util/api-fetch api-server-token "logseq.Editor.getPageBlocksTree" [(aget args "pageName")])]
        (if (= 200 (.-status resp))
          (p/let [body (.json resp)]
            (mcp-success-response body))
          (cli-util/api-handle-error-response resp mcp-error-response)))
      (p/catch unexpected-api-error)))

(def ^:private api-tools
  "MCP Tools when running with API server"
  {:getAllPages
   {:fn api-get-all-pages
    :config #js {:title "List Pages"}}
   :getPage
   {:fn api-get-page
    :config #js {:title "Get Page"
                 :description "Get a page's content"
                 :inputSchema #js {:pageName (z/string)}}}})

(defn- local-get-page [conn args]
  (let [db @conn
        page-id (common-initial-data/get-first-page-by-title db (aget args "pageName"))
        blocks (when page-id (ldb/get-page-blocks db page-id))]
    (if page-id
      (->> (otree/blocks->vec-tree "logseq_db_repo_stub" db blocks page-id)
           (map #(update % :block/uuid str))
           mcp-success-response)
      (mcp-error-response (str "Error: Page " (pr-str (aget args "pageName")) " not found")))))

(defn- local-get-all-pages [conn _args]
  (->> (d/datoms @conn :avet :block/name)
       (map #(d/entity @conn (:e %)))
       (remove entity-util/hidden?)
       (mapv (fn [e]
               {:id (str (:block/uuid e))
                :title (:block/title e)
                :createdAt (:block/created-at e)
                :updatedAt (:block/updated-at e)}))
       mcp-success-response))

(def ^:private local-tools
  "MCP Tools when running with a local graph"
  (merge-with
   merge
   api-tools
   {:getPage {:fn local-get-page}
    :getAllPages {:fn local-get-all-pages}}))

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