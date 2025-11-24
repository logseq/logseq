(ns ^:node-only logseq.cli.util
  "CLI only util fns"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.sqlite :as common-sqlite]
            [nbb.error]
            [promesa.core :as p]))

(defn ->open-db-args
  "Creates args for sqlite-cli/open-db! given a graph. Similar to sqlite-cli/->open-db-args"
  [graph]
  (cond
    (and (fs/existsSync graph) (.isFile (fs/statSync graph)))
    [graph]
    (string/includes? graph "/")
    ((juxt node-path/dirname node-path/basename) graph)
    :else
    [(cli-common-graph/get-db-graphs-dir) (common-sqlite/sanitize-db-name graph)]))

(defn get-graph-path
  "If graph is a file, return its path. Otherwise returns the graph's dir"
  [graph]
  (apply node-path/join (->open-db-args graph)))

(defn api-fetch [token method args]
  (js/fetch "http://127.0.0.1:12315/api"
            (clj->js {:method "POST"
                      :headers {"Authorization"
                                (str "Bearer " (or token js/process.env.LOGSEQ_API_SERVER_TOKEN))
                                "Content-Type" "application/json"}
                      :body (js/JSON.stringify
                             (clj->js {:method method
                                       :args args}))})))

(defn api-handle-error-response
  "Handles a non 200 response. For 500 return full response to provide more detail"
  ([resp]
   (api-handle-error-response
    resp
    (fn [msg]
      (js/console.error msg)
      (js/process.exit 1))))
  ([resp err-fn]
   (if (= 500 (.-status resp))
     (p/let [body (.text resp)]
       (err-fn (str "Error: API Server responded with status " (.-status resp)
                    "\nAPI Response: " (pr-str body))))
     (err-fn (str "Error: API Server responded with status " (.-status resp)
                  (when (.-statusText resp) (str " and body " (pr-str (.-statusText resp)))))))))

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

(defn error
  "Prints error and then exits"
  [& strings]
  (apply println "Error:" strings)
  (js/process.exit 1))

(defn summarize-build-edn
  "Given a sqlite.build EDN map, returns a string summarizing what is transacted"
  [edn-map]
  (let [pluralize (fn pluralize [word num]
                    (if (= 1 num)
                      word
                      (get {"property" "properties"
                            "class" "classes"} word (str word "s"))))]
    (str (count (:properties edn-map)) " " (pluralize "property" (count (:properties edn-map))) ", "
         (count (:classes edn-map)) " " (pluralize "class" (count (:classes edn-map))) " and "
         (count (:pages-and-blocks edn-map)) " " (pluralize "page" (count (:pages-and-blocks edn-map))))))

(defn ensure-db-graph-for-command
  [db]
  (when-not (entity-plus/db-based-graph? db)
    (error "This command must be called on a DB graph")))

(defn api-command?
  "Given user options and $LOGSEQ_API_SERVER_TOKEN, determines if
   given command is an api (true) or local (false) command"
  [{:keys [graph graphs api-server-token]}]
  (or api-server-token
      ;; graph(s) check overrides env since it is more explicit
      (and js/process.env.LOGSEQ_API_SERVER_TOKEN (not graph) (not graphs))))