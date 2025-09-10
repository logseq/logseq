(ns logseq.cli.commands.mcp-server
  "Command to run a MCP server"
  (:require ["@modelcontextprotocol/sdk/server/mcp.js" :refer [McpServer]]
            ["@modelcontextprotocol/sdk/server/stdio.js" :refer [StdioServerTransport]]
            ["zod/v3" :as z]
            [logseq.cli.util :as cli-util]
            [nbb.core :as nbb]
            [promesa.core :as p]))

(defn- unexpected-api-error [error]
  #js {:content
       #js [#js {:type "text"
                 :text (str "Unexpected API error: " (.-message error))}]})

(defn- api-get-all-pages
  [{{:keys [api-server-token]} :opts} _args]
  (-> (p/let [resp (cli-util/api-fetch api-server-token "logseq.editor.getAllPages" [])]
        (if (= 200 (.-status resp))
          (p/let [body (.json resp)
                  pages (clj->js (map #(hash-map :title (.-title %)
                                                 :id (.-uuid %))
                                      body))]
            (clj->js {:content
                      [{:type "text"
                        :text (js/JSON.stringify pages)}]}))
          (cli-util/api-handle-error-response resp
                                              (fn [msg]
                                                #js {:content
                                                     #js [#js {:type "text"
                                                               :text msg}]}))))
      (p/catch unexpected-api-error)))

(defn- api-get-page
  [{{:keys [api-server-token]} :opts} args]
  (-> (p/let [resp (cli-util/api-fetch api-server-token "logseq.Editor.getPageBlocksTree" [(aget args "pageName")])]
        (if (= 200 (.-status resp))
          (p/let [body (.json resp)]
            (clj->js {:content
                      [{:type "text"
                        :text (js/JSON.stringify body)}]}))
          (cli-util/api-handle-error-response resp
                                              (fn [msg]
                                                #js {:content
                                                     #js [#js {:type "text"
                                                               :text msg}]}))))
      (p/catch unexpected-api-error)))

(def ^:private api-tools
  {:getAllPages
   {:fn api-get-all-pages
    :config #js {:title "List Pages"}}
   :getPage
   {:fn api-get-page
    :config #js {:title "Get Page"
                 :description "Get a page's content"
                 :inputSchema #js {:pageName (z/string)}}}})

(defn start [{{:keys [debug-tool] :as opts} :opts :as m}]
  (if debug-tool
    (if-let [tool-m (get api-tools debug-tool)]
      (p/let [resp ((:fn tool-m) m (clj->js (dissoc opts :debug-tool)))]
        (js/console.log resp))
      (cli-util/error "Tool" (pr-str debug-tool) "not found"))
    (let [server (McpServer. #js {:name "Logseq MCP Server"
                                  :version "0.1.0"})
          transport (StdioServerTransport.)]
      (doseq [[k v] api-tools]
        (.registerTool server (name k) (:config v) (partial (:fn v) m)))
      (nbb/await (.connect server transport)))))