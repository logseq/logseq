(ns logseq.cli.commands.mcp-server
  "Command to run a MCP server"
  (:require ["@modelcontextprotocol/sdk/server/stdio.js" :refer [StdioServerTransport]]
            ["fastify$default" :as Fastify]
            ["fs" :as fs]
            [logseq.cli.common.mcp.server :as cli-common-mcp-server]
            [logseq.cli.common.mcp.tools :as cli-common-mcp-tools]
            [logseq.cli.util :as cli-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [nbb.core :as nbb]
            [promesa.core :as p]))

(defn- local-get-page [conn args]
  (if-let [resp (cli-common-mcp-tools/get-page-data @conn (aget args "pageName"))]
    (cli-common-mcp-server/mcp-success-response resp)
    (cli-common-mcp-server/mcp-error-response (str "Error: Page " (pr-str (aget args "pageName")) " not found"))))

(defn- local-list-pages [conn args]
  (cli-common-mcp-server/mcp-success-response
   (cli-common-mcp-tools/list-pages @conn {:expand (aget args "expand")})))

(defn- local-list-properties [conn args]
  (cli-common-mcp-server/mcp-success-response
   (cli-common-mcp-tools/list-properties @conn {:expand (aget args "expand")})))

(defn- local-list-tags [conn args]
  (cli-common-mcp-server/mcp-success-response
   (cli-common-mcp-tools/list-tags @conn {:expand (aget args "expand")})))

(defn- local-upsert-nodes [conn args]
  (cli-common-mcp-server/mcp-success-response
   (cli-common-mcp-tools/upsert-nodes
    conn
    ;; string is used by a -t invocation
    (-> (if (string? (.-operations args)) (js/JSON.parse (.-operations args)) (.-operations args))
        (js->clj :keywordize-keys true))
    {:dry-run (.-dry-run args)})))

(def ^:private local-tools
  "MCP Tools when running with a local graph"
  (let [tools {:getPage {:fn local-get-page}
               :listPages {:fn local-list-pages}
               :listProperties {:fn local-list-properties}
               :listTags {:fn local-list-tags}
               :upsertNodes {:fn local-upsert-nodes}}]
    (merge-with
     merge
     (select-keys cli-common-mcp-server/api-tools (keys tools))
     tools)))

(defn- create-http-server
  [mcp-server opts]
  (let [app (Fastify. #js {:requestTimeout (* 1000 30)})]
    (.post app "/mcp" #(cli-common-mcp-server/handle-post-request mcp-server opts %1 %2))
    (.get app "/mcp" cli-common-mcp-server/handle-get-request)
    (.delete app "/mcp" cli-common-mcp-server/handle-delete-request)
    app))

(defn- start-http-server [mcp-server {:keys [port host] :as opts}]
  (let [app (create-http-server mcp-server opts)]
    (.listen app (clj->js (select-keys opts [:port :host]))
             (fn [error]
               (if error
                 (do (js/console.error "Failed to start server:" error)
                     (js/process.exit 1))
                 (js/console.log
                  (str "MCP Streamable HTTP Server started on " host ":" port)))))))

(defn- call-api
  "Calls API from CLI for use w/ cli-common-mcp-server/api-tool"
  [api-server-token api-method method-args]
  (p/let [resp (cli-util/api-fetch api-server-token api-method method-args)]
    (if (= 200 (.-status resp))
      (.json resp)
      (p/let [body (.text resp)]
        #js {:error (str "Server status " (.-status resp)
                         "\nAPI Response: " (pr-str body))}))))

(defn- create-mcp-server [{{:keys [api-server-token] :as opts} :opts} graph]
  (if (cli-util/api-command? opts)
    ;; Make an initial /api call to ensure the API server is on
    (-> (p/let [_resp (call-api api-server-token "logseq.app.search" ["foo"])]
          (cli-common-mcp-server/create-mcp-api-server (partial call-api api-server-token)))
        (p/catch cli-util/command-catch-handler))
    (let [mcp-server (cli-common-mcp-server/create-mcp-server)
          conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))]
      (doseq [[k v] local-tools]
        (.registerTool mcp-server (name k) (:config v) (partial (:fn v) conn)))
      mcp-server)))

(defn start [{{:keys [debug-tool graph stdio api-server-token] :as opts} :opts :as m}]
  (when (and graph (not (fs/existsSync (cli-util/get-graph-path graph))))
    (cli-util/error "Graph" (pr-str graph) "does not exist"))
  (if debug-tool
    (if graph
      (if-let [tool-m (get local-tools debug-tool)]
        (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))]
          (p/let [resp ((:fn tool-m) conn (clj->js (dissoc opts :debug-tool)))]
            (js/console.log (clj->js resp))))
        (cli-util/error "Tool" (pr-str debug-tool) "not found"))
      (if-let [tool-m (get cli-common-mcp-server/api-tools debug-tool)]
        (p/let [resp (cli-common-mcp-server/call-api-tool (:fn tool-m)
                                                          (partial call-api api-server-token)
                                                          (clj->js (dissoc opts :debug-tool)))]
          (js/console.log resp))
        (cli-util/error "Tool" (pr-str debug-tool) "not found")))
    (p/let [mcp-server (create-mcp-server m graph)]
      (if stdio
        (nbb/await (.connect mcp-server (StdioServerTransport.)))
        (start-http-server mcp-server (select-keys opts [:port :host]))))))