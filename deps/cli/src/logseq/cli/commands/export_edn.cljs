(ns logseq.cli.commands.export-edn
  "Export edn command"
  (:require ["fs" :as fs]
            [clojure.pprint :as pprint]
            [logseq.cli.util :as cli-util]
            [logseq.common.util :as common-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defn- write-export-edn-map [export-map {:keys [graph file]}]
  (let [file' (or file (str graph "_" (quot (common-util/time-ms) 1000) ".edn"))]
    (println (str "Exported " (cli-util/summarize-build-edn export-map) " to " file'))
    (fs/writeFileSync file' (with-out-str (pprint/pprint export-map)))))

(defn- build-export-options [options]
  (cond-> {:export-type (:export-type options)}
    (= :graph (:export-type options))
    (assoc :graph-options (dissoc options :file :export-type :graph))))

(defn- local-export [{{:keys [graph] :as options} :opts}]
  (when-not graph
    (cli-util/error "Command missing required option 'graph'"))
  (if (fs/existsSync (cli-util/get-graph-path graph))
    (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
          _ (cli-util/ensure-db-graph-for-command @conn)
          export-map (sqlite-export/build-export @conn (build-export-options options))]
      (write-export-edn-map export-map options))
    (cli-util/error "Graph" (pr-str graph) "does not exist")))

(defn- api-export
  [{{:keys [api-server-token] :as options} :opts}]
  (let [opts (build-export-options options)]
    (-> (p/let [resp (cli-util/api-fetch api-server-token "logseq.cli.export_edn" [(clj->js opts)])]
          (if (= 200 (.-status resp))
            (p/let [body (.json resp)
                    export-map (sqlite-util/transit-read (aget body "export-body"))]
              (write-export-edn-map export-map (assoc options :graph (.-graph body))))
            (cli-util/api-handle-error-response resp)))
        (p/catch cli-util/command-catch-handler))))

(defn export [{opts :opts :as m}]
  (if (cli-util/api-command? opts)
    (api-export m)
    (local-export m)))