(ns ^:node-only logseq.cli.util
  "Util fns"
  (:require ["path" :as node-path]
            [clojure.string :as string]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.db.common.sqlite :as common-sqlite]
            [nbb.error]))

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

(defn command-catch-handler
  "Default p/catch handler for commands which handles sci errors and HTTP API Server connections gracefully"
  [err]
  (cond
    (= :sci/error (:type (ex-data err)))
    (nbb.error/print-error-report err)
    (string/includes? (some->> err .-cause .-message str) "ECONNREFUSED")
    (do (js/console.error "Error: Failed to connect to HTTP API Server with error" (pr-str (.-message err)))
        (js/console.log "Make sure the HTTP API Server is turned on."))
    :else
    (js/console.error "Error:" err))
  (js/process.exit 1))