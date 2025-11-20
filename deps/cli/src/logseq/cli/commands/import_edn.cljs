(ns logseq.cli.commands.import-edn
  "Import edn command"
  (:require ["fs" :as fs]
            [clojure.edn :as edn]
            [logseq.cli.util :as cli-util]
            [logseq.db :as ldb]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defn- print-success [import-map]
  (println (str "Imported " (cli-util/summarize-build-edn import-map) "!")))

(defn- api-import [{:keys [api-server-token]} import-map]
  (-> (p/let [resp (cli-util/api-fetch api-server-token "logseq.cli.import_edn" [(sqlite-util/transit-write import-map)])]
        (if (= 200 (.-status resp))
          (print-success import-map)
          (cli-util/api-handle-error-response resp)))
      (p/catch cli-util/command-catch-handler)))

(defn- local-import [{:keys [graph]} import-map]
  (when-not graph
    (cli-util/error "Command missing required option 'graph'"))
  (if (fs/existsSync (cli-util/get-graph-path graph))
    (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
          _ (cli-util/ensure-db-graph-for-command @conn)
          {:keys [init-tx block-props-tx misc-tx]}
          (sqlite-export/build-import import-map @conn {})
          txs (vec (concat init-tx block-props-tx misc-tx))]
      (ldb/transact! conn txs)
      (print-success import-map))
    (cli-util/error "Graph" (pr-str graph) "does not exist")))

(defn import-edn [{{:keys [file] :as opts} :opts}]
  (let [edn (edn/read-string (str (fs/readFileSync file)))]
    (if (cli-util/api-command? opts)
      (api-import opts edn)
      (local-import opts edn))))