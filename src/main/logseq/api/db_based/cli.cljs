(ns logseq.api.db-based.cli
  "API fns for CLI"
  (:require [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [logseq.cli.common.mcp.tools :as cli-common-mcp-tools]
            [promesa.core :as p]))

(defn list-tags
  [options]
  (p/let [resp (state/<invoke-db-worker :thread-api/api-list-tags
                                        (state/get-current-repo)
                                        (js->clj options :keywordize-keys true))]
    (clj->js resp)))

(defn list-properties
  [options]
  (p/let [resp (state/<invoke-db-worker :thread-api/api-list-properties
                                        (state/get-current-repo)
                                        (js->clj options :keywordize-keys true))]
    (clj->js resp)))

(defn list-pages
  [options]
  (p/let [resp (state/<invoke-db-worker :thread-api/api-list-pages
                                        (state/get-current-repo)
                                        (js->clj options :keywordize-keys true))]
    (clj->js resp)))

(defn get-page-data
  "Like get_page_blocks_tree but for MCP tools"
  [page-title]
  (p/let [resp (state/<invoke-db-worker :thread-api/api-get-page-data (state/get-current-repo) page-title)]
    (if resp
      (clj->js resp)
      #js {:error (str "Page " (pr-str page-title) " not found")})))

(defn upsert-nodes
  "Given a list of MCP operations, batch imports with resulting EDN data"
  [operations options*]
  (p/let [ops (js->clj operations :keywordize-keys true)
          {:keys [dry-run] :as options} (js->clj options* :keywordize-keys true)
          edn-data (state/<invoke-db-worker :thread-api/api-build-upsert-nodes-edn (state/get-current-repo) ops)
          {:keys [error]} (when-not dry-run
                            (ui-outliner-tx/transact!
                             {:outliner-op :batch-import-edn}
                             (outliner-op/batch-import-edn! edn-data {})))]
    (when error (throw (ex-info error {})))
    (ui-handler/re-render-root!)
    (cli-common-mcp-tools/summarize-upsert-operations ops options)))