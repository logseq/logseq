(ns logseq.cli.util
  "Util fns"
  (:require ["path" :as node-path]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.db.common.sqlite :as common-sqlite]))

(defn get-graph-dir
  [graph]
  (node-path/join (cli-common-graph/get-db-graphs-dir) (common-sqlite/sanitize-db-name graph)))

(defn ->open-db-args
  "Creates args for sqlite-cli/open-db! given a graph. Similar to sqlite-cli/->open-db-args"
  [graph]
  [(cli-common-graph/get-db-graphs-dir) (common-sqlite/sanitize-db-name graph)])

(defn api-fetch [token method args]
  (js/fetch "http://127.0.0.1:12315/api"
            (clj->js {:method "POST"
                      :headers {"Authorization" (str "Bearer " token)
                                "Content-Type" "application/json"}
                      :body (js/JSON.stringify
                             (clj->js {:method method
                                       :args args}))})))

(defn api-handle-error-response
  "Handles a non 200 response"
  [resp]
  (js/console.error "Error: API Server responded with status" (.-status resp)
                    (when (.-statusText resp) (str "and body " (pr-str (.-statusText resp)))))
  (js/process.exit 1))